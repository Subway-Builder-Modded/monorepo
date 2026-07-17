package downloader

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"io/fs"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"railyard/internal/config"
	"railyard/internal/constants"
	"railyard/internal/logger"
	"railyard/internal/registry"
	"railyard/internal/testutil"
	"railyard/internal/testutil/registrytest"
	"railyard/internal/types"

	"github.com/stretchr/testify/require"
)

// installFixtureVersion describes a single version served by setupInstallFixtureServer.
type installFixtureVersion struct {
	Version      string
	GameVersion  string
	SHA256       string
	Dependencies map[string]string
	Archive      []byte // nil leaves the version without a download URL
	SlowDownload bool   // stream a long body so cancellation can land mid-download
}

// installFixtureAsset describes a mod or map with fully controllable update metadata.
type installFixtureAsset struct {
	AssetID   string
	AssetType types.AssetType
	MapCode   string
	Versions  []installFixtureVersion
}

func downloadFixturePath(assetID string, version string) string {
	return "/downloads/" + assetID + "-" + version + ".zip"
}

func streamSlowDownload(w http.ResponseWriter) {
	flusher, _ := w.(http.Flusher)
	chunk := bytes.Repeat([]byte("a"), 32*1024)
	for i := 0; i < 256; i++ {
		if _, err := w.Write(chunk); err != nil {
			return
		}
		if flusher != nil {
			flusher.Flush()
		}
		time.Sleep(2 * time.Millisecond)
	}
}

// setupInstallFixtureServer mirrors registrytest.MockRegistryServer but exposes the
// checksum/game-version/dependency update fields the shared fixture omits.
func setupInstallFixtureServer(t *testing.T, reg *registry.Registry, assets []installFixtureAsset) func() {
	t.Helper()

	handler := http.NewServeMux()
	mods := []types.ModManifest{}
	maps := []types.MapManifest{}
	modListings := map[string]types.IntegrityListing{}
	mapListings := map[string]types.IntegrityListing{}

	for _, asset := range assets {
		current := asset
		updatePath := "/updates/" + current.AssetID + ".json"
		update := types.UpdateConfig{Type: "custom", URL: "{{BASE_URL}}" + updatePath}

		if current.AssetType == types.AssetTypeMap {
			manifest := registrytest.MockMapManifestWithIDAndCode(current.AssetID, current.MapCode)
			manifest.Update = update
			maps = append(maps, manifest)
		} else {
			manifest := registrytest.MockModManifestWithID(current.AssetID)
			manifest.Update = update
			mods = append(mods, manifest)
		}

		completeVersions := make([]string, 0, len(current.Versions))
		statuses := make(map[string]types.IntegrityVersionStatus, len(current.Versions))
		for _, version := range current.Versions {
			completeVersions = append(completeVersions, version.Version)
			statuses[version.Version] = types.IntegrityVersionStatus{IsComplete: true}
		}
		listing := types.IntegrityListing{
			HasCompleteVersion: true,
			CompleteVersions:   completeVersions,
			Versions:           statuses,
		}
		if current.AssetType == types.AssetTypeMap {
			mapListings[current.AssetID] = listing
		} else {
			modListings[current.AssetID] = listing
		}

		handler.HandleFunc(updatePath, func(w http.ResponseWriter, r *http.Request) {
			payload := types.CustomUpdateFile{SchemaVersion: 1}
			for _, version := range current.Versions {
				entry := types.CustomUpdateVersion{
					Version:      version.Version,
					GameVersion:  version.GameVersion,
					SHA256:       version.SHA256,
					Dependencies: version.Dependencies,
				}
				if version.Archive != nil || version.SlowDownload {
					entry.Download = "http://" + r.Host + downloadFixturePath(current.AssetID, version.Version)
				}
				payload.Versions = append(payload.Versions, entry)
			}
			w.Header().Set("Content-Type", "application/json")
			require.NoError(t, json.NewEncoder(w).Encode(payload))
		})

		for _, version := range current.Versions {
			currentVersion := version
			if currentVersion.Archive == nil && !currentVersion.SlowDownload {
				continue
			}
			handler.HandleFunc(downloadFixturePath(current.AssetID, currentVersion.Version), func(w http.ResponseWriter, _ *http.Request) {
				if currentVersion.SlowDownload {
					streamSlowDownload(w)
					return
				}
				w.Header().Set("Content-Type", "application/zip")
				_, _ = w.Write(currentVersion.Archive)
			})
		}
	}

	server := testutil.NewLocalhostServer(t, handler)
	for i := range mods {
		mods[i].Update.URL = strings.ReplaceAll(mods[i].Update.URL, "{{BASE_URL}}", server.URL)
	}
	for i := range maps {
		maps[i].Update.URL = strings.ReplaceAll(maps[i].Update.URL, "{{BASE_URL}}", server.URL)
	}
	registrytest.SetManifestsForTest(t, reg, mods, maps)
	registrytest.SetUnexportedField(t, reg, "integrityMods", types.RegistryIntegrityReport{
		SchemaVersion: 1,
		GeneratedAt:   "1970-01-01T00:00:00Z",
		Listings:      modListings,
	})
	registrytest.SetUnexportedField(t, reg, "integrityMaps", types.RegistryIntegrityReport{
		SchemaVersion: 1,
		GeneratedAt:   "1970-01-01T00:00:00Z",
		Listings:      mapListings,
	})
	return server.Close
}

func sha256Hex(data []byte) string {
	sum := sha256.Sum256(data)
	return hex.EncodeToString(sum[:])
}

func gameVersionFunc(version string) GameVersionFunc {
	return func() types.GameVersionResponse {
		return types.GameVersionResponse{
			GenericResponse: types.GenericResponse{Status: types.ResponseSuccess},
			Version:         version,
		}
	}
}

// writeVanillaCitiesFile seeds latest-cities.yml so getVanillaMapCodes can read it.
func writeVanillaCitiesFile(t *testing.T, cfg *config.Config, content string) {
	t.Helper()
	citiesDir := filepath.Join(cfg.Cfg.MetroMakerDataPath, "cities")
	require.NoError(t, os.MkdirAll(citiesDir, 0o755))
	require.NoError(t, os.WriteFile(filepath.Join(citiesDir, "latest-cities.yml"), []byte(content), 0o644))
}

const vanillaCitiesYAML = "version: \"1\"\ncities:\n  VAN:\n    code: VAN\n  XYZ:\n    code: XYZ\n"

func TestNewDownloaderInitializesQueueAndPaths(t *testing.T) {
	cfg := config.NewConfig(testutil.TestLogSink{})
	reg := registry.NewRegistry(testutil.TestLogSink{}, cfg)

	d := NewDownloader(cfg, reg, logger.LoggerAtPath(""))
	require.Same(t, reg, d.Registry)
	require.Same(t, cfg, d.Config)
	require.NotEmpty(t, d.tempPath)
	require.NotEmpty(t, d.mapTilePath)

	// The queue worker must already be running.
	result := enqueueOperation(d, operationActionInstall, types.AssetTypeMod, "mod-new", "1.0.0", operationSuccess("ran", 0, nil))
	require.Equal(t, "ran", result.genericResponse.Message)
}

func TestRunQueueInvokesRegistryUpdateCallback(t *testing.T) {
	d := newTestDownloader()
	var updates int32
	d.OnRegistryUpdate = func() { atomic.AddInt32(&updates, 1) }

	result := enqueueOperation(d, operationActionInstall, types.AssetTypeMod, "mod-a", "1.0.0", operationSuccess("ran", 0, nil))
	require.Equal(t, types.ResponseSuccess, result.genericResponse.Status)
	require.Eventually(t, func() bool { return atomic.LoadInt32(&updates) > 0 }, 2*time.Second, 5*time.Millisecond)
}

func TestQueueMutationHelpersIgnoreUnknownOperations(t *testing.T) {
	d := newTestDownloader()
	queued := &downloadOperation{}
	unknown := &downloadOperation{}
	replacement := &downloadOperation{}

	d.queue = []*downloadOperation{queued}
	require.False(t, d.replaceQueuedOperation(unknown, replacement))
	require.True(t, d.replaceQueuedOperation(queued, replacement))
	require.False(t, d.removeQueuedOperation(unknown))
	require.True(t, d.removeQueuedOperation(replacement))
	require.Empty(t, d.queue)
}

func TestCancelPendingQueuedInstallRequiresQueuedOperation(t *testing.T) {
	d := newTestDownloader()
	d.startQueue()

	// Pending bookkeeping without a queued operation must not report a cancel.
	key := downloadQueueKey{assetType: types.AssetTypeMap, assetID: "map-a"}
	stale := &downloadOperation{action: operationActionInstall, assetKey: key, completed: make(chan operationResult, 1)}
	d.downloadMu.Lock()
	d.pending[key] = stale
	d.downloadMu.Unlock()

	require.False(t, d.cancelPendingQueuedInstall("map-a", types.AssetTypeMap, key))
}

func TestEnqueueOperationAppendsWhenPendingMissingFromQueue(t *testing.T) {
	d := newTestDownloader()
	d.startQueue()

	// Simulate out-of-sync bookkeeping: pending entry with no queued operation.
	key := downloadQueueKey{assetType: types.AssetTypeMap, assetID: "map-a"}
	stale := &downloadOperation{
		action:           operationActionInstall,
		assetKey:         key,
		supersededResult: supersededSuccess("stale superseded"),
		completed:        make(chan operationResult, 1),
	}
	d.downloadMu.Lock()
	d.pending[key] = stale
	d.downloadMu.Unlock()

	result := enqueueOperation(d, operationActionInstall, types.AssetTypeMap, "map-a", "1.0.0", operationSuccess("fresh install ran", 0, nil))
	require.Equal(t, "fresh install ran", result.genericResponse.Message)

	staleResult := <-stale.completed
	require.Equal(t, "stale superseded", staleResult.genericResponse.Message)
}

func TestCancelInstallWithNothingToCancel(t *testing.T) {
	d := newTestDownloader()

	resp := d.CancelInstall(types.AssetTypeMap, "map-a")
	require.Equal(t, types.ResponseWarn, resp.Status)
	require.Equal(t, types.UninstallErrorNotInstalled, resp.ErrorType)
	require.Contains(t, resp.Message, "No pending install found")
}

func TestCancelInstallIgnoresRunningUninstall(t *testing.T) {
	d := newTestDownloader()

	release := make(chan struct{})
	resultCh := make(chan operationResult, 1)
	go func() {
		resultCh <- enqueueOperation(d, operationActionUninstall, types.AssetTypeMap, "map-a", "", func() operationResult {
			<-release
			return operationResult{genericResponse: types.GenericResponse{Status: types.ResponseSuccess, Message: "uninstall ran"}}
		})
	}()
	waitForRunningOperation(t, d, downloadQueueKey{assetType: types.AssetTypeMap, assetID: "map-a"})

	resp := d.CancelInstall(types.AssetTypeMap, "map-a")
	require.Equal(t, types.ResponseWarn, resp.Status)
	require.Contains(t, resp.Message, "No pending install found")

	close(release)
	result := <-resultCh
	require.Equal(t, "uninstall ran", result.genericResponse.Message)
}

func TestCancelInstallCancelsQueuedInstallFromPublicAPI(t *testing.T) {
	d, _, _ := newConfiguredDownloader(t, false)
	releaseBlocker, blockerResultCh := enqueueBlockingInstall(t, d, types.AssetTypeMod, "blocker-mod", "1.0.0")

	installRespCh := make(chan types.AssetInstallResponse, 1)
	go func() {
		installRespCh <- d.InstallAsset(types.InstallAssetRequest{
			AssetType: types.AssetTypeMod,
			AssetID:   "mod-a",
			Version:   "1.0.0",
		})
	}()
	waitForPendingOperation(t, d, downloadQueueKey{assetType: types.AssetTypeMod, assetID: "mod-a"})

	cancelResp := d.CancelInstall(types.AssetTypeMod, "mod-a")
	require.Equal(t, types.ResponseWarn, cancelResp.Status)
	require.Contains(t, strings.ToLower(cancelResp.Message), "cancelled pending install")

	installResp := <-installRespCh
	require.Contains(t, strings.ToLower(installResp.Message), "superseded")

	releaseBlocker()
	<-blockerResultCh
}

func TestInstallAssetSupersededInstallCancelsQueuedContext(t *testing.T) {
	d, _, _ := newConfiguredDownloader(t, false)
	releaseBlocker, blockerResultCh := enqueueBlockingInstall(t, d, types.AssetTypeMod, "blocker-mod", "1.0.0")

	firstRespCh := make(chan types.AssetInstallResponse, 1)
	go func() {
		firstRespCh <- d.InstallAsset(types.InstallAssetRequest{
			AssetType: types.AssetTypeMod,
			AssetID:   "mod-a",
			Version:   "1.0.0",
		})
	}()
	waitForPendingOperation(t, d, downloadQueueKey{assetType: types.AssetTypeMod, assetID: "mod-a"})

	secondRespCh := make(chan types.AssetInstallResponse, 1)
	go func() {
		secondRespCh <- d.InstallAsset(types.InstallAssetRequest{
			AssetType: types.AssetTypeMod,
			AssetID:   "mod-a",
			Version:   "2.0.0",
		})
	}()

	firstResp := <-firstRespCh
	require.Contains(t, strings.ToLower(firstResp.Message), "superseded")

	releaseBlocker()
	<-blockerResultCh

	secondResp := <-secondRespCh
	require.Equal(t, types.ResponseError, secondResp.Status)
	require.Equal(t, types.InstallErrorInvalidConfig, secondResp.ErrorType)
}

func TestUninstallModAssetPaths(t *testing.T) {
	t.Run("not installed", func(t *testing.T) {
		d, _, _ := newConfiguredDownloader(t, true)

		resp := d.UninstallAsset(types.AssetTypeMod, "mod-a")
		require.Equal(t, types.ResponseWarn, resp.Status)
		require.Equal(t, types.UninstallErrorNotInstalled, resp.ErrorType)
		require.Contains(t, resp.Message, "is not currently installed")
	})

	t.Run("missing marker", func(t *testing.T) {
		d, reg, _ := newConfiguredDownloader(t, true)
		reg.AddInstalledMod("mod-a", "1.0.0", false, nil)

		resp := d.UninstallAsset(types.AssetTypeMod, "mod-a")
		require.Equal(t, types.ResponseWarn, resp.Status)
		require.Equal(t, types.UninstallErrorNotInstalled, resp.ErrorType)
		require.Contains(t, resp.Message, "missing marker file")
	})

	t.Run("success removes files and registry entry", func(t *testing.T) {
		d, reg, _ := newConfiguredDownloader(t, true)
		reg.AddInstalledMod("mod-a", "1.0.0", false, nil)
		modDir := filepath.Join(d.getModPath(), "mod-a")
		require.NoError(t, os.MkdirAll(modDir, 0o755))
		require.NoError(t, os.WriteFile(filepath.Join(modDir, constants.RailyardAssetMarker), nil, 0o644))

		resp := d.UninstallAsset(types.AssetTypeMod, "mod-a")
		require.Equal(t, types.ResponseSuccess, resp.Status, resp.Message)
		_, statErr := os.Stat(modDir)
		require.True(t, errors.Is(statErr, fs.ErrNotExist))
		require.Empty(t, reg.GetInstalledMods())
	})
}

func TestUninstallMapAssetWarnPaths(t *testing.T) {
	t.Run("not installed", func(t *testing.T) {
		d, _, _ := newConfiguredDownloader(t, true)

		resp := d.UninstallAsset(types.AssetTypeMap, "map-a")
		require.Equal(t, types.ResponseWarn, resp.Status)
		require.Equal(t, types.UninstallErrorNotInstalled, resp.ErrorType)
		require.Contains(t, resp.Message, "is not currently installed")
	})

	t.Run("missing marker", func(t *testing.T) {
		d, reg, _ := newConfiguredDownloader(t, true)
		reg.AddInstalledMap("map-a", "1.0.0", false, types.ConfigData{Code: "MSM"})

		resp := d.UninstallAsset(types.AssetTypeMap, "map-a")
		require.Equal(t, types.ResponseWarn, resp.Status)
		require.Equal(t, types.UninstallErrorNotInstalled, resp.ErrorType)
		require.Contains(t, resp.Message, "missing marker file")
	})
}

func TestUninstallMapAssetTileRemovalFailure(t *testing.T) {
	d, reg, _ := newConfiguredDownloader(t, true)
	const code = "TDF"
	seedInstalledLocalMap(t, d, reg, "map-tile-fail", "1.0.0", code)

	// A non-empty directory at the tile path makes os.Remove fail deterministically.
	tileDir := filepath.Join(d.getMapTilePath(), code+".pmtiles")
	require.NoError(t, os.MkdirAll(tileDir, 0o755))
	require.NoError(t, os.WriteFile(filepath.Join(tileDir, "occupied"), []byte("x"), 0o644))
	t.Cleanup(func() { _ = os.RemoveAll(tileDir) })

	resp := d.UninstallAsset(types.AssetTypeMap, "map-tile-fail")
	require.Equal(t, types.ResponseError, resp.Status)
	require.Equal(t, types.UninstallErrorFilesystem, resp.ErrorType)
	require.Contains(t, resp.Message, "Failed to remove map tile files")
	require.Len(t, reg.GetInstalledMaps(), 1)
}

func TestInstallAssetAdditionalErrorPaths(t *testing.T) {
	invalidManifestArchive := func(t *testing.T) []byte {
		t.Helper()
		return registrytest.MockZip(t, map[string][]byte{"manifest.json": []byte("{invalid")})
	}
	missingMainArchive := func(t *testing.T) []byte {
		t.Helper()
		manifest, err := json.Marshal(types.MetroMakerModManifest{Id: "mod-a", Name: "Mod A", Version: "1.0.0", Main: "index.js"})
		require.NoError(t, err)
		return registrytest.MockZip(t, map[string][]byte{"manifest.json": manifest})
	}

	testCases := []struct {
		name              string
		assetType         types.AssetType
		assetID           string
		version           string
		setup             func(t *testing.T, d *Downloader, reg *registry.Registry) func()
		expectedErrorCode types.DownloaderErrorType
	}{
		{
			name:      "Mod version lookup failed",
			assetType: types.AssetTypeMod,
			assetID:   "mod-a",
			version:   "1.0.0",
			setup: func(t *testing.T, d *Downloader, reg *registry.Registry) func() {
				t.Helper()
				configureDownloaderConfig(t, d.Config)
				return registrytest.MockRegistryServer(t, reg, []registrytest.UpdateFixture{
					{AssetID: "mod-a", AssetType: types.AssetTypeMod, FailVersions: true},
				})
			},
			expectedErrorCode: types.InstallErrorVersionLookup,
		},
		{
			name:      "Mod github source with invalid repo",
			assetType: types.AssetTypeMod,
			assetID:   "mod-gh",
			version:   "1.0.0",
			setup: func(t *testing.T, d *Downloader, reg *registry.Registry) func() {
				t.Helper()
				configureDownloaderConfig(t, d.Config)
				manifest := registrytest.MockModManifestWithID("mod-gh")
				manifest.Update = types.UpdateConfig{Type: "github", Repo: "not-a-valid-repo"}
				registrytest.SetManifestsForTest(t, reg, []types.ModManifest{manifest}, []types.MapManifest{})
				return nil
			},
			expectedErrorCode: types.InstallErrorVersionLookup,
		},
		{
			name:      "Map github source with invalid repo",
			assetType: types.AssetTypeMap,
			assetID:   "map-gh",
			version:   "1.0.0",
			setup: func(t *testing.T, d *Downloader, reg *registry.Registry) func() {
				t.Helper()
				configureDownloaderConfig(t, d.Config)
				manifest := registrytest.MockMapManifestWithIDAndCode("map-gh", "GHA")
				manifest.Update = types.UpdateConfig{Type: "github", Repo: "not-a-valid-repo"}
				registrytest.SetManifestsForTest(t, reg, []types.ModManifest{}, []types.MapManifest{manifest})
				return nil
			},
			expectedErrorCode: types.InstallErrorVersionLookup,
		},
		{
			name:              "Map invalid config",
			assetType:         types.AssetTypeMap,
			assetID:           "map-a",
			version:           "1.0.0",
			expectedErrorCode: types.InstallErrorInvalidConfig,
		},
		{
			name:      "Map registry lookup failed",
			assetType: types.AssetTypeMap,
			assetID:   "missing-map",
			version:   "1.0.0",
			setup: func(t *testing.T, d *Downloader, _ *registry.Registry) func() {
				t.Helper()
				configureDownloaderConfig(t, d.Config)
				return nil
			},
			expectedErrorCode: types.InstallErrorRegistryLookup,
		},
		{
			name:      "Map version not found",
			assetType: types.AssetTypeMap,
			assetID:   "map-a",
			version:   "2.0.0",
			setup: func(t *testing.T, d *Downloader, reg *registry.Registry) func() {
				t.Helper()
				configureDownloaderConfig(t, d.Config)
				return registrytest.MockRegistryServer(t, reg, []registrytest.UpdateFixture{
					{AssetID: "map-a", AssetType: types.AssetTypeMap, Versions: []string{"1.0.0"}, MapCode: "VNF"},
				})
			},
			expectedErrorCode: types.InstallErrorVersionNotFound,
		},
		{
			name:      "Map downloaded archive missing required files",
			assetType: types.AssetTypeMap,
			assetID:   "map-a",
			version:   "1.0.0",
			setup: func(t *testing.T, d *Downloader, reg *registry.Registry) func() {
				t.Helper()
				configureDownloaderConfig(t, d.Config)
				return registrytest.MockRegistryServer(t, reg, []registrytest.UpdateFixture{
					{AssetID: "map-a", AssetType: types.AssetTypeMap, Versions: []string{"1.0.0"}, MapCode: "BDA", ArchiveBytes: registrytest.MockModZip(t)},
				})
			},
			expectedErrorCode: types.InstallErrorInvalidArchive,
		},
		{
			name:      "Mod archive is not a zip",
			assetType: types.AssetTypeMod,
			assetID:   "mod-a",
			version:   "1.0.0",
			setup: func(t *testing.T, d *Downloader, reg *registry.Registry) func() {
				t.Helper()
				configureDownloaderConfig(t, d.Config)
				return registrytest.MockRegistryServer(t, reg, []registrytest.UpdateFixture{
					{AssetID: "mod-a", AssetType: types.AssetTypeMod, Versions: []string{"1.0.0"}, ArchiveBytes: []byte("this is not a zip")},
				})
			},
			expectedErrorCode: types.InstallErrorInvalidArchive,
		},
		{
			name:      "Mod archive missing manifest",
			assetType: types.AssetTypeMod,
			assetID:   "mod-a",
			version:   "1.0.0",
			setup: func(t *testing.T, d *Downloader, reg *registry.Registry) func() {
				t.Helper()
				configureDownloaderConfig(t, d.Config)
				return registrytest.MockRegistryServer(t, reg, []registrytest.UpdateFixture{
					{AssetID: "mod-a", AssetType: types.AssetTypeMod, Versions: []string{"1.0.0"}, MissingModManifest: true},
				})
			},
			expectedErrorCode: types.InstallErrorInvalidArchive,
		},
		{
			name:      "Mod manifest invalid JSON",
			assetType: types.AssetTypeMod,
			assetID:   "mod-a",
			version:   "1.0.0",
			setup: func(t *testing.T, d *Downloader, reg *registry.Registry) func() {
				t.Helper()
				configureDownloaderConfig(t, d.Config)
				return registrytest.MockRegistryServer(t, reg, []registrytest.UpdateFixture{
					{AssetID: "mod-a", AssetType: types.AssetTypeMod, Versions: []string{"1.0.0"}, ArchiveBytes: invalidManifestArchive(t)},
				})
			},
			expectedErrorCode: types.InstallErrorInvalidManifest,
		},
		{
			name:      "Mod manifest target missing",
			assetType: types.AssetTypeMod,
			assetID:   "mod-a",
			version:   "1.0.0",
			setup: func(t *testing.T, d *Downloader, reg *registry.Registry) func() {
				t.Helper()
				configureDownloaderConfig(t, d.Config)
				return registrytest.MockRegistryServer(t, reg, []registrytest.UpdateFixture{
					{AssetID: "mod-a", AssetType: types.AssetTypeMod, Versions: []string{"1.0.0"}, ArchiveBytes: missingMainArchive(t)},
				})
			},
			expectedErrorCode: types.InstallErrorInvalidArchive,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			d, reg, _ := newConfiguredDownloader(t, false)

			var cleanup func()
			if tc.setup != nil {
				cleanup = tc.setup(t, d, reg)
			}
			if cleanup != nil {
				defer cleanup()
			}

			resp := d.InstallAsset(types.InstallAssetRequest{
				AssetType: tc.assetType,
				AssetID:   tc.assetID,
				Version:   tc.version,
			})
			require.Equal(t, types.ResponseError, resp.Status)
			require.Equal(t, tc.expectedErrorCode, resp.ErrorType)
		})
	}
}

func TestInstallAssetDownloadFailure(t *testing.T) {
	testCases := []struct {
		name      string
		assetType types.AssetType
		assetID   string
		fixture   registrytest.UpdateFixture
	}{
		{
			name:      "mod",
			assetType: types.AssetTypeMod,
			assetID:   "mod-a",
			fixture:   registrytest.UpdateFixture{AssetID: "mod-a", AssetType: types.AssetTypeMod, Versions: []string{"1.0.0"}},
		},
		{
			name:      "map",
			assetType: types.AssetTypeMap,
			assetID:   "map-a",
			fixture:   registrytest.UpdateFixture{AssetID: "map-a", AssetType: types.AssetTypeMap, Versions: []string{"1.0.0"}, MapCode: "DLF"},
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			d, reg, _ := newConfiguredDownloader(t, true)
			closeServer := registrytest.MockRegistryServer(t, reg, []registrytest.UpdateFixture{tc.fixture})

			// Warm the versions cache so version resolution works offline, then kill
			// the server so only the download itself fails.
			_, err := reg.GetInstallableVersions(tc.assetType, tc.assetID)
			require.NoError(t, err)
			closeServer()

			resp := d.InstallAsset(types.InstallAssetRequest{
				AssetType: tc.assetType,
				AssetID:   tc.assetID,
				Version:   "1.0.0",
			})
			require.Equal(t, types.ResponseError, resp.Status)
			require.Equal(t, types.InstallErrorDownloadFailed, resp.ErrorType)
		})
	}
}

func TestDownloadTempZipFailurePaths(t *testing.T) {
	newDownloadClient := func(t *testing.T) *Downloader {
		t.Helper()
		return &Downloader{
			Config:   config.NewConfig(testutil.TestLogSink{}),
			Logger:   logger.LoggerAtPath(""),
			tempPath: t.TempDir(),
		}
	}

	t.Run("unexpected status code", func(t *testing.T) {
		server := testutil.NewLocalhostServer(t, http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
			w.WriteHeader(http.StatusInternalServerError)
		}))
		defer server.Close()

		d := newDownloadClient(t)
		resp := d.downloadTempZip(context.Background(), server.URL+"/asset.zip", "asset-a")
		require.Equal(t, types.ResponseError, resp.Status)
		require.Contains(t, resp.Message, "unexpected status code")

		entries, err := os.ReadDir(d.tempPath)
		require.NoError(t, err)
		require.Empty(t, entries)
	})

	t.Run("temp directory creation fails", func(t *testing.T) {
		d := newDownloadClient(t)
		blocker := filepath.Join(t.TempDir(), "blocker")
		require.NoError(t, os.WriteFile(blocker, []byte("x"), 0o644))
		d.tempPath = filepath.Join(blocker, "nested")

		resp := d.downloadTempZip(context.Background(), "http://127.0.0.1:0/never-used.zip", "asset-a")
		require.Equal(t, types.ResponseError, resp.Status)
		require.Contains(t, resp.Message, "Failed to create temp directory")
	})

	t.Run("body shorter than declared content length", func(t *testing.T) {
		server := testutil.NewLocalhostServer(t, http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
			w.Header().Set("Content-Length", "65536")
			_, _ = w.Write(make([]byte, 1024))
		}))
		defer server.Close()

		d := newDownloadClient(t)
		resp := d.downloadTempZip(context.Background(), server.URL+"/asset.zip", "asset-a")
		require.Equal(t, types.ResponseError, resp.Status)
		require.Contains(t, resp.Message, "Failed to save file")

		entries, err := os.ReadDir(d.tempPath)
		require.NoError(t, err)
		require.Empty(t, entries)
	})
}

func TestVerifySHA256OpenFailure(t *testing.T) {
	d := newTestDownloader()
	err := d.verifySHA256(filepath.Join(t.TempDir(), "missing.zip"), "abc")
	require.ErrorContains(t, err, "failed to open file")
}

func TestInstallAssetChecksumVerification(t *testing.T) {
	t.Run("mod checksum mismatch", func(t *testing.T) {
		d, reg, _ := newConfiguredDownloader(t, true)
		cleanup := setupInstallFixtureServer(t, reg, []installFixtureAsset{{
			AssetID:   "mod-a",
			AssetType: types.AssetTypeMod,
			Versions:  []installFixtureVersion{{Version: "1.0.0", SHA256: strings.Repeat("ab", 32), Archive: registrytest.MockModZip(t)}},
		}})
		defer cleanup()

		resp := d.InstallAsset(types.InstallAssetRequest{AssetType: types.AssetTypeMod, AssetID: "mod-a", Version: "1.0.0"})
		require.Equal(t, types.ResponseError, resp.Status)
		require.Equal(t, types.InstallErrorChecksumFailed, resp.ErrorType)
	})

	t.Run("map checksum mismatch", func(t *testing.T) {
		d, reg, _ := newConfiguredDownloader(t, true)
		cleanup := setupInstallFixtureServer(t, reg, []installFixtureAsset{{
			AssetID:   "map-a",
			AssetType: types.AssetTypeMap,
			MapCode:   "CSM",
			Versions:  []installFixtureVersion{{Version: "1.0.0", SHA256: strings.Repeat("cd", 32), Archive: registrytest.MockMapZip(t, "CSM")}},
		}})
		defer cleanup()

		resp := d.InstallAsset(types.InstallAssetRequest{AssetType: types.AssetTypeMap, AssetID: "map-a", Version: "1.0.0"})
		require.Equal(t, types.ResponseError, resp.Status)
		require.Equal(t, types.InstallErrorChecksumFailed, resp.ErrorType)
	})

	t.Run("mod checksum match", func(t *testing.T) {
		d, reg, _ := newConfiguredDownloader(t, true)
		archive := registrytest.MockModZip(t)
		cleanup := setupInstallFixtureServer(t, reg, []installFixtureAsset{{
			AssetID:   "mod-a",
			AssetType: types.AssetTypeMod,
			Versions:  []installFixtureVersion{{Version: "1.0.0", SHA256: sha256Hex(archive), Archive: archive}},
		}})
		defer cleanup()

		resp := d.InstallAsset(types.InstallAssetRequest{AssetType: types.AssetTypeMod, AssetID: "mod-a", Version: "1.0.0"})
		require.Equal(t, types.ResponseSuccess, resp.Status, resp.Message)
	})
}

func TestInstallModGameVersionConstraints(t *testing.T) {
	setup := func(t *testing.T) (*Downloader, func()) {
		t.Helper()
		d, reg, _ := newConfiguredDownloader(t, true)
		cleanup := setupInstallFixtureServer(t, reg, []installFixtureAsset{{
			AssetID:   "mod-a",
			AssetType: types.AssetTypeMod,
			Versions:  []installFixtureVersion{{Version: "1.0.0", GameVersion: ">=2.0.0", Archive: registrytest.MockModZip(t)}},
		}})
		return d, cleanup
	}
	request := types.InstallAssetRequest{AssetType: types.AssetTypeMod, AssetID: "mod-a", Version: "1.0.0"}

	t.Run("undetectable game version", func(t *testing.T) {
		d, cleanup := setup(t)
		defer cleanup()
		d.GetGameVersion = func() types.GameVersionResponse {
			return types.GameVersionResponse{GenericResponse: types.GenericResponse{Status: types.ResponseError}}
		}

		resp := d.InstallAsset(request)
		require.Equal(t, types.ResponseError, resp.Status)
		require.Equal(t, types.InstallErrorGameVersionUndetectable, resp.ErrorType)
	})

	t.Run("incompatible game version", func(t *testing.T) {
		d, cleanup := setup(t)
		defer cleanup()
		d.GetGameVersion = gameVersionFunc("1.0.0")

		resp := d.InstallAsset(request)
		require.Equal(t, types.ResponseError, resp.Status)
		require.Equal(t, types.InstallErrorIncompatibleGameVersion, resp.ErrorType)
		require.Contains(t, resp.Message, types.IncompatibleGameVersionMessage)
	})

	t.Run("compatible game version with skipped dependencies", func(t *testing.T) {
		d, cleanup := setup(t)
		defer cleanup()
		d.GetGameVersion = gameVersionFunc("2.5.0")

		compatRequest := request
		compatRequest.Mod = &types.ModInstallOptions{SkipDependencies: true}
		resp := d.InstallAsset(compatRequest)
		require.Equal(t, types.ResponseSuccess, resp.Status, resp.Message)
	})
}

func TestInstallMapGameVersionIncompatible(t *testing.T) {
	d, reg, _ := newConfiguredDownloader(t, true)
	cleanup := setupInstallFixtureServer(t, reg, []installFixtureAsset{{
		AssetID:   "map-a",
		AssetType: types.AssetTypeMap,
		MapCode:   "GVX",
		Versions:  []installFixtureVersion{{Version: "1.0.0", GameVersion: ">=2.0.0"}},
	}})
	defer cleanup()
	d.GetGameVersion = gameVersionFunc("1.0.0")

	resp := d.InstallAsset(types.InstallAssetRequest{AssetType: types.AssetTypeMap, AssetID: "map-a", Version: "1.0.0"})
	require.Equal(t, types.ResponseError, resp.Status)
	require.Equal(t, types.InstallErrorIncompatibleGameVersion, resp.ErrorType)
}

func TestInstallModDependencyFailures(t *testing.T) {
	t.Run("dependency resolution fails", func(t *testing.T) {
		d, reg, _ := newConfiguredDownloader(t, true)
		cleanup := setupInstallFixtureServer(t, reg, []installFixtureAsset{{
			AssetID:   "mod-root",
			AssetType: types.AssetTypeMod,
			Versions:  []installFixtureVersion{{Version: "1.0.0", Dependencies: map[string]string{"missing-dep": "1.0.0"}}},
		}})
		defer cleanup()

		resp := d.InstallAsset(types.InstallAssetRequest{AssetType: types.AssetTypeMod, AssetID: "mod-root", Version: "1.0.0"})
		require.Equal(t, types.ResponseError, resp.Status)
		require.Equal(t, types.InstallErrorDependencyResolutionFailed, resp.ErrorType)
		require.Contains(t, resp.Message, "Failed to resolve mod dependencies")
	})

	t.Run("dependency install fails", func(t *testing.T) {
		d, reg, _ := newConfiguredDownloader(t, true)
		cleanup := setupInstallFixtureServer(t, reg, []installFixtureAsset{
			{
				AssetID:   "mod-root",
				AssetType: types.AssetTypeMod,
				Versions:  []installFixtureVersion{{Version: "1.0.0", Dependencies: map[string]string{"dep-broken": "1.0.0"}}},
			},
			{
				AssetID:   "dep-broken",
				AssetType: types.AssetTypeMod,
				// No archive: the dependency resolves but its download fails.
				Versions: []installFixtureVersion{{Version: "1.0.0"}},
			},
		})
		defer cleanup()

		resp := d.InstallAsset(types.InstallAssetRequest{AssetType: types.AssetTypeMod, AssetID: "mod-root", Version: "1.0.0"})
		require.Equal(t, types.ResponseError, resp.Status)
		require.Equal(t, types.InstallErrorDependencyResolutionFailed, resp.ErrorType)
		require.Contains(t, resp.Message, "Failed to install mod dependency")
	})
}

func TestInstallModInstallsDependenciesFirst(t *testing.T) {
	d, reg, _ := newConfiguredDownloader(t, true)
	cleanup := setupInstallFixtureServer(t, reg, []installFixtureAsset{
		{
			AssetID:   "mod-root",
			AssetType: types.AssetTypeMod,
			// Empty range also exercises normalizeDependencyRange's wildcard default.
			Versions: []installFixtureVersion{{Version: "1.0.0", Dependencies: map[string]string{"dep-ok": ""}, Archive: registrytest.MockModZip(t)}},
		},
		{
			AssetID:   "dep-ok",
			AssetType: types.AssetTypeMod,
			Versions:  []installFixtureVersion{{Version: "1.0.0", Archive: registrytest.MockModZip(t)}},
		},
	})
	defer cleanup()

	var mu sync.Mutex
	var recorded []string
	d.InstallDependency = func(modID string, itemType types.AssetType, version types.Version) {
		mu.Lock()
		defer mu.Unlock()
		recorded = append(recorded, modID+"@"+string(version))
		require.Equal(t, types.AssetTypeMod, itemType)
	}

	resp := d.InstallAsset(types.InstallAssetRequest{AssetType: types.AssetTypeMod, AssetID: "mod-root", Version: "1.0.0"})
	require.Equal(t, types.ResponseSuccess, resp.Status, resp.Message)
	require.Equal(t, []string{"dep-ok@1.0.0"}, recorded)

	installedIDs := make([]string, 0, 2)
	for _, mod := range reg.GetInstalledMods() {
		installedIDs = append(installedIDs, mod.ID)
	}
	require.ElementsMatch(t, []string{"mod-root", "dep-ok"}, installedIDs)
}

func TestCancelRunningModInstallReturnsWarn(t *testing.T) {
	d, reg, _ := newConfiguredDownloader(t, true)
	cleanup := setupInstallFixtureServer(t, reg, []installFixtureAsset{{
		AssetID:   "mod-slow",
		AssetType: types.AssetTypeMod,
		Versions:  []installFixtureVersion{{Version: "1.0.0", SlowDownload: true}},
	}})
	defer cleanup()

	var cancelOnce sync.Once
	cancelRespCh := make(chan types.AssetUninstallResponse, 1)
	d.OnProgress = func(string, int64, int64) {
		cancelOnce.Do(func() {
			cancelRespCh <- d.CancelInstall(types.AssetTypeMod, "mod-slow")
		})
	}

	resp := d.InstallAsset(types.InstallAssetRequest{AssetType: types.AssetTypeMod, AssetID: "mod-slow", Version: "1.0.0"})
	require.Equal(t, types.ResponseWarn, resp.Status, resp.Message)
	require.Contains(t, strings.ToLower(resp.Message), "cancelled")

	cancelResp := <-cancelRespCh
	require.Equal(t, types.ResponseWarn, cancelResp.Status)
	require.Contains(t, strings.ToLower(cancelResp.Message), "cancelled running install")
}

func TestFindMapCodeConflictInstalledMapBranches(t *testing.T) {
	d, reg, _ := newConfiguredDownloader(t, true)
	reg.AddInstalledMap("map-other", "1.0.0", false, types.ConfigData{Code: "BBB"})
	reg.AddInstalledMap("map-a", "1.0.0", false, types.ConfigData{Code: "AAA"})

	// Empty codes can never conflict.
	conflict, hasConflict := d.FindMapCodeConflict("map-a", "", false)
	require.False(t, hasConflict)
	require.Nil(t, conflict)

	// The target asset itself is skipped during updates.
	conflict, hasConflict = d.FindMapCodeConflict("map-a", "AAA", true)
	require.False(t, hasConflict)
	require.Nil(t, conflict)

	// A different asset with the same code conflicts.
	conflict, hasConflict = d.FindMapCodeConflict("map-new", "AAA", false)
	require.True(t, hasConflict)
	require.Equal(t, "map-a", conflict.ExistingAssetID)
	require.Equal(t, "AAA", conflict.CityCode)
}

func TestFindMapCodeConflictVanillaCodes(t *testing.T) {
	t.Run("invalid config yields no vanilla codes", func(t *testing.T) {
		d, _, _ := newConfiguredDownloader(t, false)
		_, hasConflict := d.FindMapCodeConflict("map-a", "VAN", false)
		require.False(t, hasConflict)
	})

	t.Run("missing latest-cities file yields no vanilla codes", func(t *testing.T) {
		d, _, _ := newConfiguredDownloader(t, true)
		_, hasConflict := d.FindMapCodeConflict("map-a", "VAN", false)
		require.False(t, hasConflict)
	})

	t.Run("malformed latest-cities file yields no vanilla codes", func(t *testing.T) {
		d, _, cfg := newConfiguredDownloader(t, true)
		writeVanillaCitiesFile(t, cfg, "cities: [not: a: map")
		_, hasConflict := d.FindMapCodeConflict("map-a", "VAN", false)
		require.False(t, hasConflict)
	})

	t.Run("vanilla code conflicts", func(t *testing.T) {
		d, _, cfg := newConfiguredDownloader(t, true)
		writeVanillaCitiesFile(t, cfg, vanillaCitiesYAML)

		conflict, hasConflict := d.FindMapCodeConflict("map-a", "VAN", false)
		require.True(t, hasConflict)
		require.Equal(t, "vanilla:VAN", conflict.ExistingAssetID)
		require.Equal(t, "VAN", conflict.CityCode)

		_, hasConflict = d.FindMapCodeConflict("map-a", "QQQ", false)
		require.False(t, hasConflict)
	})
}

func TestImportAssetCannotReplaceVanillaMap(t *testing.T) {
	d, _, cfg := newConfiguredDownloader(t, true)
	writeVanillaCitiesFile(t, cfg, vanillaCitiesYAML)

	zipPath := filepath.Join(t.TempDir(), "vanilla-map.zip")
	require.NoError(t, os.WriteFile(zipPath, registrytest.MockMapZip(t, "VAN"), 0o644))

	resp := d.ImportAsset(types.AssetTypeMap, zipPath, true)
	require.Equal(t, types.ResponseError, resp.Status)
	require.Equal(t, types.InstallErrorMapCodeConflict, resp.ErrorType)
	require.Contains(t, resp.Message, "Cannot replace a vanilla map city code")
}

func TestImportAssetPanicsOnUnsupportedAssetType(t *testing.T) {
	d := newTestDownloader()
	require.PanicsWithValue(t, `unsupported import asset type: "mod"`, func() {
		_ = d.ImportAsset(types.AssetTypeMod, "asset.zip", false)
	})
}

func TestImportAssetInvalidConfig(t *testing.T) {
	d, _, _ := newConfiguredDownloader(t, false)
	resp := d.ImportAsset(types.AssetTypeMap, "asset.zip", false)
	require.Equal(t, types.ResponseError, resp.Status)
	require.Equal(t, types.InstallErrorInvalidConfig, resp.ErrorType)
}

func TestImportAssetReplacesConflictingLocalMap(t *testing.T) {
	d, reg, _ := newConfiguredDownloader(t, true)
	// Existing installed map with a different ID but the same city code.
	seedInstalledLocalMap(t, d, reg, "legacy-map", "1.0.0", "AAA")

	zipPath := filepath.Join(t.TempDir(), "replacement-map.zip")
	require.NoError(t, os.WriteFile(zipPath, registrytest.MockMapZip(t, "AAA"), 0o644))

	resp := d.ImportAsset(types.AssetTypeMap, zipPath, true)
	require.Equal(t, types.ResponseSuccess, resp.Status, resp.Message)
	require.NotNil(t, resp.MapCodeConflict)
	require.Equal(t, "legacy-map", resp.MapCodeConflict.ExistingAssetID)

	installedIDs := make([]string, 0, 1)
	for _, installed := range reg.GetInstalledMaps() {
		installedIDs = append(installedIDs, installed.ID)
	}
	require.Equal(t, []string{"AAA"}, installedIDs)
}

func TestValidateImportedMapArchive(t *testing.T) {
	d, reg, _ := newConfiguredDownloader(t, true)

	t.Run("invalid archive", func(t *testing.T) {
		badPath := filepath.Join(t.TempDir(), "bad.zip")
		require.NoError(t, os.WriteFile(badPath, []byte("not a zip"), 0o644))

		validation := d.ValidateImportedMapArchive(badPath)
		require.Equal(t, types.ImportValidationInvalid, validation.Status)
		require.Equal(t, "bad.zip", validation.Name)
		require.NotEmpty(t, validation.Error)
	})

	t.Run("conflicting archive", func(t *testing.T) {
		reg.AddInstalledMap("AAA", "1.0.0", true, types.ConfigData{Code: "AAA"})
		zipPath := filepath.Join(t.TempDir(), "conflict.zip")
		require.NoError(t, os.WriteFile(zipPath, registrytest.MockMapZip(t, "AAA"), 0o644))

		validation := d.ValidateImportedMapArchive(zipPath)
		require.Equal(t, types.ImportValidationConflict, validation.Status)
		require.NotNil(t, validation.Conflict)
		require.Equal(t, "AAA", validation.Conflict.ExistingAssetID)
	})

	t.Run("new archive", func(t *testing.T) {
		zipPath := filepath.Join(t.TempDir(), "new.zip")
		require.NoError(t, os.WriteFile(zipPath, registrytest.MockMapZip(t, "BBB"), 0o644))

		validation := d.ValidateImportedMapArchive(zipPath)
		require.Equal(t, types.ImportValidationNew, validation.Status)
		require.Equal(t, "BBB", validation.Code)
	})
}

func TestRecursivelyComputeDependenciesGuards(t *testing.T) {
	d := newTestDownloader()

	// Re-entering a mod already on the visit path is a cycle.
	_, err := d.recursivelyComputeDependencies("mod-a", types.VersionInfo{}, map[string]types.DependencyListEntry{}, []string{"mod-a"})
	require.ErrorContains(t, err, "circular dependency detected")

	// A mod absent from the install list is added on first visit.
	installList, err := d.recursivelyComputeDependencies("mod-a", types.VersionInfo{Version: "1.0.0"}, map[string]types.DependencyListEntry{}, nil)
	require.NoError(t, err)
	require.Contains(t, installList, "mod-a")
	require.Equal(t, "1.0.0", installList["mod-a"].InstallCandidate.Version)
}

func TestComputeDependencyListFailsOnMissingDependencyVersions(t *testing.T) {
	cfg := config.NewConfig(testutil.TestLogSink{})
	reg := registry.NewRegistry(testutil.TestLogSink{}, cfg)
	d := &Downloader{Registry: reg}
	registrytest.SetManifestsForTest(t, reg, []types.ModManifest{}, []types.MapManifest{})

	result := d.ComputeDependencyList("root", types.VersionInfo{
		Version:      "1.0.0",
		Dependencies: map[string]string{"missing-dep": "1.0.0"},
	})
	require.Equal(t, types.ResponseError, result.Status)
	require.Contains(t, result.Message, "missing-dep")
}

func TestResolveDependencyCandidateEdgeCases(t *testing.T) {
	_, err := resolveDependencyCandidate("dep", []string{"*"}, nil)
	require.ErrorContains(t, err, "no versions found for dependency")

	_, err = resolveDependencyCandidate("dep", []string{">>bad"}, []types.VersionInfo{{Version: "1.0.0"}})
	require.ErrorContains(t, err, "invalid version range")

	// Unparsable versions are skipped rather than failing resolution.
	candidate, err := resolveDependencyCandidate("dep", []string{"*"}, []types.VersionInfo{{Version: "garbage"}, {Version: "1.0.0"}})
	require.NoError(t, err)
	require.Equal(t, "1.0.0", candidate.Version)
}

func TestInstallModReinstallsWhenMarkerMissing(t *testing.T) {
	d, reg, _ := newConfiguredDownloader(t, true)
	// Registered at the requested version but with no marker on disk, so the
	// no-op short-circuit must fall through to a full re-install.
	reg.AddInstalledMod("mod-a", "1.0.0", false, nil)

	cleanup := registrytest.MockRegistryServer(t, reg, []registrytest.UpdateFixture{
		{AssetID: "mod-a", AssetType: types.AssetTypeMod, Versions: []string{"1.0.0"}},
	})
	defer cleanup()

	resp := d.InstallAsset(types.InstallAssetRequest{AssetType: types.AssetTypeMod, AssetID: "mod-a", Version: "1.0.0"})
	require.Equal(t, types.ResponseSuccess, resp.Status, resp.Message)

	_, err := os.Stat(filepath.Join(d.getModPath(), "mod-a", constants.RailyardAssetMarker))
	require.NoError(t, err)
}

func TestDetectedGameVersionWithoutDetector(t *testing.T) {
	d := newTestDownloader()
	version, ok := d.DetectedGameVersion()
	require.False(t, ok)
	require.Nil(t, version)
}
