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

func TestFetchFromDiskEnrichesManifestAuthors(t *testing.T) {
	testutil.NewHarness(t)
	modA := registrytest.MockModManifestWithID("mod-a")
	modA.Author.AuthorID = "author-a"
	mapA := registrytest.MockMapManifestWithIDAndCode("map-a", "AAA")
	mapA.Author.AuthorID = "author-a"
	registrytest.WriteFixture(t, registrytest.RepositoryFixture{
		Mods: []types.ModManifest{modA},
		Maps: []types.MapManifest{mapA},
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
	require.Equal(t, "author-a", reg.GetMods()[0].Author.AuthorID)
	require.Equal(t, "Alias A", reg.GetMods()[0].Author.AuthorAlias)
	require.Equal(t, "https://example.com/alias-a", reg.GetMods()[0].Author.AttributionLink)
	require.NotNil(t, reg.GetMods()[0].Author.ContributorTier)
	require.Equal(t, "developer", *reg.GetMods()[0].Author.ContributorTier)

	require.Len(t, reg.GetMaps(), 1)
	require.Equal(t, "author-a", reg.GetMaps()[0].Author.AuthorID)
	require.Equal(t, "Alias A", reg.GetMaps()[0].Author.AuthorAlias)
	require.Equal(t, "https://example.com/alias-a", reg.GetMaps()[0].Author.AttributionLink)
	require.NotNil(t, reg.GetMaps()[0].Author.ContributorTier)
	require.Equal(t, "developer", *reg.GetMaps()[0].Author.ContributorTier)

	require.Empty(t, logSink.errorMessages)
}

func TestFetchFromDiskSkipsAssetsWhenAuthorMissing(t *testing.T) {
	testutil.NewHarness(t)
	modA := registrytest.MockModManifestWithID("mod-a")
	modA.Author.AuthorID = "missing-author"
	mapA := registrytest.MockMapManifestWithIDAndCode("map-a", "AAA")
	mapA.Author.AuthorID = "missing-author"
	registrytest.WriteFixture(t, registrytest.RepositoryFixture{
		Mods: []types.ModManifest{modA},
		Maps: []types.MapManifest{mapA},
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

	require.Empty(t, reg.GetMods())
	require.Empty(t, reg.GetMaps())

	require.GreaterOrEqual(t, len(logSink.errorMessages), 1)
	require.True(
		t,
		strings.Contains(strings.Join(logSink.errorMessages, "\n"), "missing author metadata"),
		"expected missing author log entry",
	)
}
