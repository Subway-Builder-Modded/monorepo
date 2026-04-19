package registrytest

import (
	"encoding/json"
	"net/http"
	"testing"

	"railyard/internal/testutil"
	"railyard/internal/types"

	"github.com/stretchr/testify/require"
)

type LastUpdatedFixture struct {
	AssetID   string
	AssetType types.AssetType
	Path      string
	Versions  []types.CustomUpdateVersion
	Status    int
}

// MockLastUpdatedServer starts an HTTP server that serves custom update payloads
// and wires the provided registry instance with matching manifests + test HTTP client.
func MockLastUpdatedServer(t *testing.T, reg any, fixtures []LastUpdatedFixture) func() {
	t.Helper()

	mux := http.NewServeMux()
	mods := make([]types.ModManifest, 0)
	maps := make([]types.MapManifest, 0)
	modListings := make(map[string]types.IntegrityListing)
	mapListings := make(map[string]types.IntegrityListing)

	for _, fixture := range fixtures {
		current := fixture
		mux.HandleFunc(current.Path, func(w http.ResponseWriter, r *http.Request) {
			if current.Status != 0 && current.Status != http.StatusOK {
				http.Error(w, "failed", current.Status)
				return
			}

			payload := types.CustomUpdateFile{
				SchemaVersion: 1,
				Versions:      current.Versions,
			}
			w.Header().Set("Content-Type", "application/json")
			require.NoError(t, json.NewEncoder(w).Encode(payload))
		})
	}

	server := testutil.NewLocalhostServer(t, mux)

	for _, fixture := range fixtures {
		update := types.UpdateConfig{
			Type: "custom",
			URL:  server.URL + fixture.Path,
		}
		completeVersions := make([]string, 0, len(fixture.Versions))
		versionStatuses := make(map[string]types.IntegrityVersionStatus, len(fixture.Versions))
		for _, version := range fixture.Versions {
			completeVersions = append(completeVersions, version.Version)
			versionStatuses[version.Version] = types.IntegrityVersionStatus{IsComplete: true}
		}
		listing := types.IntegrityListing{
			HasCompleteVersion: true,
			CompleteVersions:   completeVersions,
			Versions:           versionStatuses,
		}
		switch fixture.AssetType {
		case types.AssetTypeMap:
			maps = append(maps, types.MapManifest{
				AssetManifest: types.AssetManifest{
					ID:     fixture.AssetID,
					Update: update,
				},
			})
			mapListings[fixture.AssetID] = listing
		case types.AssetTypeMod:
			mods = append(mods, types.ModManifest{
				AssetManifest: types.AssetManifest{
					ID:     fixture.AssetID,
					Update: update,
				},
			})
			modListings[fixture.AssetID] = listing
		}
	}

	SetUnexportedField(t, reg, "httpClient", server.Client())
	SetManifestsForTest(t, reg, mods, maps)
	SetUnexportedField(t, reg, "integrityMods", types.RegistryIntegrityReport{
		SchemaVersion: 1,
		GeneratedAt:   "1970-01-01T00:00:00Z",
		Listings:      modListings,
	})
	SetUnexportedField(t, reg, "integrityMaps", types.RegistryIntegrityReport{
		SchemaVersion: 1,
		GeneratedAt:   "1970-01-01T00:00:00Z",
		Listings:      mapListings,
	})
	return server.Close
}
