package registrytest

import (
	"path/filepath"
	"reflect"
	"strings"
	"testing"
	"unsafe"

	"railyard/internal/constants"
	"railyard/internal/files"
	"railyard/internal/paths"
	"railyard/internal/types"

	"github.com/stretchr/testify/require"
)

type RepositoryFixture struct {
	Mods               []types.ModManifest
	Maps               []types.MapManifest
	ModDownloadEntries map[string]map[string]int
	MapDownloadEntries map[string]map[string]int
}

type fixtureAuthorIndexEntry struct {
	AuthorID        string `json:"author_id"`
	AuthorAlias     string `json:"author_alias"`
	AttributionLink string `json:"attribution_link"`
}

type fixtureAuthorIndexFile struct {
	SchemaVersion int                       `json:"schema_version"`
	Authors       []fixtureAuthorIndexEntry `json:"authors"`
}

func fixtureAuthorID(details types.AuthorDetails, fallback string) string {
	authorID := strings.TrimSpace(details.AuthorID)
	if authorID != "" {
		return authorID
	}
	authorAlias := strings.TrimSpace(details.AuthorAlias)
	if authorAlias != "" {
		return authorAlias
	}
	return strings.TrimSpace(fallback)
}

func WriteFixture(t *testing.T, fixture RepositoryFixture) {
	t.Helper()

	repoPath := paths.RegistryRepoPath()
	modIDs := make([]string, 0, len(fixture.Mods))
	mapIDs := make([]string, 0, len(fixture.Maps))

	for _, mod := range fixture.Mods {
		modIDs = append(modIDs, mod.ID)
		modPath := filepath.Join(repoPath, "mods", mod.ID, "manifest.json")
		require.NoError(t, files.WriteJSON(modPath, "mod manifest", types.RawModManifest{
			RawManifest: types.RawManifest{
				SchemaVersion: mod.SchemaVersion,
				ID:            mod.ID,
				Name:          mod.Name,
				AuthorID:      fixtureAuthorID(mod.Author, mod.ID+"-author"),
				GithubID:      mod.GithubID,
				LastUpdated:   mod.LastUpdated,
				Description:   mod.Description,
				Tags:          mod.Tags,
				Gallery:       mod.Gallery,
				Source:        mod.Source,
				Update:        mod.Update,
				IsTest:        mod.IsTest,
			},
		}))
	}
	for _, m := range fixture.Maps {
		mapIDs = append(mapIDs, m.ID)
		mapPath := filepath.Join(repoPath, "maps", m.ID, "manifest.json")
		require.NoError(t, files.WriteJSON(mapPath, "map manifest", types.RawMapManifest{
			RawManifest: types.RawManifest{
				SchemaVersion: m.SchemaVersion,
				ID:            m.ID,
				Name:          m.Name,
				AuthorID:      fixtureAuthorID(m.Author, m.ID+"-author"),
				GithubID:      m.GithubID,
				LastUpdated:   m.LastUpdated,
				Description:   m.Description,
				Tags:          m.Tags,
				Gallery:       m.Gallery,
				Source:        m.Source,
				Update:        m.Update,
				IsTest:        m.IsTest,
			},
			CityCode:         m.CityCode,
			Country:          m.Country,
			Location:         m.Location,
			Population:       m.Population,
			DataSource:       m.DataSource,
			SourceQuality:    m.SourceQuality,
			LevelOfDetail:    m.LevelOfDetail,
			SpecialDemand:    m.SpecialDemand,
			InitialViewState: m.InitialViewState,
		}))
	}

	authorsByID := make(map[string]fixtureAuthorIndexEntry)
	for _, mod := range fixture.Mods {
		authorID := fixtureAuthorID(mod.Author, mod.ID+"-author")
		if authorID == "" {
			continue
		}
		alias := strings.TrimSpace(mod.Author.AuthorAlias)
		if alias == "" {
			alias = authorID
		}
		attributionLink := strings.TrimSpace(mod.Author.AttributionLink)
		if attributionLink == "" {
			attributionLink = "https://github.com/" + authorID
		}
		authorsByID[authorID] = fixtureAuthorIndexEntry{
			AuthorID:        authorID,
			AuthorAlias:     alias,
			AttributionLink: attributionLink,
		}
	}
	for _, m := range fixture.Maps {
		authorID := fixtureAuthorID(m.Author, m.ID+"-author")
		if authorID == "" {
			continue
		}
		alias := strings.TrimSpace(m.Author.AuthorAlias)
		if alias == "" {
			alias = authorID
		}
		attributionLink := strings.TrimSpace(m.Author.AttributionLink)
		if attributionLink == "" {
			attributionLink = "https://github.com/" + authorID
		}
		authorsByID[authorID] = fixtureAuthorIndexEntry{
			AuthorID:        authorID,
			AuthorAlias:     alias,
			AttributionLink: attributionLink,
		}
	}
	authors := make([]fixtureAuthorIndexEntry, 0, len(authorsByID))
	for _, author := range authorsByID {
		authors = append(authors, author)
	}

	require.NoError(t, files.WriteJSON(filepath.Join(repoPath, "mods", "index.json"), "mods index", types.IndexFile{
		SchemaVersion: 1,
		Mods:          modIDs,
	}))
	require.NoError(t, files.WriteJSON(filepath.Join(repoPath, "maps", "index.json"), "maps index", types.IndexFile{
		SchemaVersion: 1,
		Maps:          mapIDs,
	}))

	if fixture.ModDownloadEntries == nil {
		fixture.ModDownloadEntries = map[string]map[string]int{}
	}
	if fixture.MapDownloadEntries == nil {
		fixture.MapDownloadEntries = map[string]map[string]int{}
	}

	require.NoError(t, files.WriteJSON(filepath.Join(repoPath, "mods", "downloads.json"), "mod downloads", types.DownloadsFile(fixture.ModDownloadEntries)))
	require.NoError(t, files.WriteJSON(filepath.Join(repoPath, "maps", "downloads.json"), "map downloads", types.DownloadsFile(fixture.MapDownloadEntries)))
	require.NoError(t, files.WriteJSON(filepath.Join(repoPath, "mods", constants.INTEGRITY_JSON), "mods integrity report", buildIntegrityReport(modIDs)))
	require.NoError(t, files.WriteJSON(filepath.Join(repoPath, "maps", constants.INTEGRITY_JSON), "maps integrity report", buildIntegrityReport(mapIDs)))
	require.NoError(t, files.WriteJSON(filepath.Join(repoPath, "authors", "index.json"), "authors index", fixtureAuthorIndexFile{
		SchemaVersion: 1,
		Authors:       authors,
	}))
}

func buildIntegrityReport(ids []string) types.RegistryIntegrityReport {
	listings := make(map[string]types.IntegrityListing, len(ids))
	for _, id := range ids {
		listings[id] = types.IntegrityListing{
			HasCompleteVersion:   false,
			LatestSemverVersion:  nil,
			LatestSemverComplete: nil,
			CompleteVersions:     []string{},
			IncompleteVersions:   []string{},
			Versions:             map[string]types.IntegrityVersionStatus{},
		}
	}
	return types.RegistryIntegrityReport{
		SchemaVersion: 1,
		GeneratedAt:   "1970-01-01T00:00:00Z",
		Listings:      listings,
	}
}

func SetUnexportedField(t *testing.T, target any, fieldName string, value any) {
	t.Helper()
	rv := reflect.ValueOf(target)
	require.True(t, rv.Kind() == reflect.Ptr, "target must be pointer")
	elem := rv.Elem()
	field := elem.FieldByName(fieldName)
	require.True(t, field.IsValid(), "field %q not found", fieldName)

	reflect.NewAt(field.Type(), unsafe.Pointer(field.UnsafeAddr())).Elem().Set(reflect.ValueOf(value))
}

func SetManifestsForTest(t *testing.T, registryValue any, mods []types.ModManifest, maps []types.MapManifest) {
	t.Helper()
	SetUnexportedField(t, registryValue, "mods", mods)
	SetUnexportedField(t, registryValue, "maps", maps)
}
