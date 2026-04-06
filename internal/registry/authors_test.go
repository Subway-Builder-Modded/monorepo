package registry

import (
	"context"
	"path/filepath"
	"strings"
	"testing"

	"railyard/internal/config"
	"railyard/internal/files"
	"railyard/internal/paths"
	"railyard/internal/testutil"
	"railyard/internal/testutil/registrytest"
	"railyard/internal/types"

	"github.com/stretchr/testify/require"
)

type captureRegistryLog struct {
	errorMessages []string
}

func (l *captureRegistryLog) Info(string, ...any) {}

func (l *captureRegistryLog) Warn(string, ...any) {}

func (l *captureRegistryLog) Error(msg string, err error, _ ...any) {
	if err != nil {
		l.errorMessages = append(l.errorMessages, msg+": "+err.Error())
		return
	}
	l.errorMessages = append(l.errorMessages, msg)
}

func TestFetchFromDiskEnrichesManifestAuthorsFromAuthorsIndex(t *testing.T) {
	testutil.NewHarness(t)
	registrytest.WriteFixture(t, registrytest.RepositoryFixture{
		Mods: []types.ModManifest{
			{ID: "mod-a", Author: "author-a"},
		},
		Maps: []types.MapManifest{
			{ID: "map-a", Author: "author-a"},
		},
	})

	contributorTier := "developer"
	require.NoError(t, files.WriteJSON(
		filepath.Join(paths.RegistryRepoPath(), "authors", "index.json"),
		"authors index",
		authorIndexFile{
			SchemaVersion: 1,
			Authors: []authorIndexEntry{
				{
					AuthorID:        "author-a",
					AuthorAlias:     "Alias A",
					AttributionLink: "https://example.com/alias-a",
					ContributorTier: &contributorTier,
				},
			},
		},
	))

	logSink := &captureRegistryLog{}
	reg := NewRegistry(logSink, config.NewConfig(testutil.TestLogSink{}))
	reg.SetContext(context.WithValue(context.Background(), "test", "true"))
	require.NoError(t, reg.fetchFromDisk())

	require.Len(t, reg.GetMods(), 1)
	require.Equal(t, "Alias A", reg.GetMods()[0].Author)
	require.Equal(t, "https://example.com/alias-a", reg.GetMods()[0].AuthorAttributionLink)
	require.NotNil(t, reg.GetMods()[0].ContributorTier)
	require.Equal(t, "developer", *reg.GetMods()[0].ContributorTier)

	require.Len(t, reg.GetMaps(), 1)
	require.Equal(t, "Alias A", reg.GetMaps()[0].Author)
	require.Equal(t, "https://example.com/alias-a", reg.GetMaps()[0].AuthorAttributionLink)
	require.NotNil(t, reg.GetMaps()[0].ContributorTier)
	require.Equal(t, "developer", *reg.GetMaps()[0].ContributorTier)

	require.Empty(t, logSink.errorMessages)
}

func TestFetchFromDiskFallsBackWhenAuthorMissingFromAuthorsIndex(t *testing.T) {
	testutil.NewHarness(t)
	registrytest.WriteFixture(t, registrytest.RepositoryFixture{
		Mods: []types.ModManifest{
			{ID: "mod-a", Author: "missing-author"},
		},
		Maps: []types.MapManifest{
			{ID: "map-a", Author: "missing-author"},
		},
	})

	require.NoError(t, files.WriteJSON(
		filepath.Join(paths.RegistryRepoPath(), "authors", "index.json"),
		"authors index",
		authorIndexFile{
			SchemaVersion: 1,
			Authors:       []authorIndexEntry{},
		},
	))

	logSink := &captureRegistryLog{}
	reg := NewRegistry(logSink, config.NewConfig(testutil.TestLogSink{}))
	reg.SetContext(context.WithValue(context.Background(), "test", "true"))
	require.NoError(t, reg.fetchFromDisk())

	require.Len(t, reg.GetMods(), 1)
	require.Equal(t, "missing-author", reg.GetMods()[0].Author)
	require.Equal(t, "https://github.com/missing-author", reg.GetMods()[0].AuthorAttributionLink)
	require.Nil(t, reg.GetMods()[0].ContributorTier)

	require.Len(t, reg.GetMaps(), 1)
	require.Equal(t, "missing-author", reg.GetMaps()[0].Author)
	require.Equal(t, "https://github.com/missing-author", reg.GetMaps()[0].AuthorAttributionLink)
	require.Nil(t, reg.GetMaps()[0].ContributorTier)

	require.GreaterOrEqual(t, len(logSink.errorMessages), 2)
	require.True(
		t,
		strings.Contains(strings.Join(logSink.errorMessages, "\n"), "falling back to manifest author"),
		"expected fallback author log entry",
	)
}
