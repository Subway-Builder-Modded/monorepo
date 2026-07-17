package main

import (
	"context"
	"errors"
	"fmt"
	"io/fs"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path"
	"runtime"
	"strings"
	"sync"

	"railyard/internal/config"
	"railyard/internal/constants"
	"railyard/internal/downloader"
	"railyard/internal/files"
	"railyard/internal/gate"
	"railyard/internal/logger"
	"railyard/internal/paths"
	"railyard/internal/profiles"
	"railyard/internal/registry"
	"railyard/internal/types"
	"railyard/internal/updater"
	"railyard/internal/utils"

	wailsruntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

func panik(message string) {
	panic(message)
}

// App struct
type App struct {
	Registry   *registry.Registry
	Config     *config.Config
	Downloader *downloader.Downloader
	ctx        context.Context
	Profiles   *profiles.UserProfiles
	Logger     *logger.AppLogger

	gameMu        sync.Mutex
	gameCmd       *exec.Cmd
	gameStarting  bool
	pmtilesServer *http.Server
	// contentGate enforces mutual exclusion between the game session and content mutations.
	contentGate *gate.GameContentGate

	galleryServer     *http.Server
	galleryServerPort int
	startupMu         sync.RWMutex
	startupReady      bool

	deepLinks     deepLinkQueue
	appImageMount *appImageMount

	// gameVersionCache memoizes the detected game version keyed by the app.asar's path + stat.
	gameVersionMu    sync.Mutex
	gameVersionCache gameVersionCacheEntry

	// Test-only hooks for controlling the launch-starting window and event sink.
	launchGameTestReady chan<- struct{}
	launchGameTestBlock <-chan struct{}
	emitEventFunc       func(name string, optionalData ...interface{})
}

// NewApp creates a new App application struct
func NewApp() *App {
	l := logger.NewAppLogger()
	cfg := config.NewConfig(l)
	reg := registry.NewRegistry(l, cfg)
	dl := downloader.NewDownloader(cfg, reg, l)
	contentGate := &gate.GameContentGate{}
	dl.Gate = contentGate
	userProfiles := profiles.NewUserProfiles(reg, dl, l, cfg)
	userProfiles.Gate = contentGate
	return &App{
		Registry:    reg,
		Config:      cfg,
		Downloader:  dl,
		Profiles:    userProfiles,
		Logger:      l,
		contentGate: contentGate,
	}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.setStartupReady(false)
	a.ctx = ctx
	a.Config.SetContext(ctx)
	a.Registry.SetContext(ctx)
	a.startGalleryServer()
	a.Downloader.InstallDependency = func(itemId string, itemType types.AssetType, version types.Version) {
		result := a.Profiles.UpdateSubscriptions(types.UpdateSubscriptionsRequest{
			ProfileID:             a.Profiles.GetActiveProfile().Profile.ID,
			Action:                types.SubscriptionActionSubscribe,
			ApplyMode:             types.UpdateSubscriptionsPersistOnly,
			SkipDependencyInstall: true,
			Assets: map[string]types.SubscriptionUpdateItem{
				itemId: {
					Version: version,
					Type:    itemType,
					IsLocal: false,
				},
			},
		})
		if result.Status == types.ResponseError {
			a.Logger.MultipleError("Failed to persist dependency subscription", logger.AsErrors(result.Errors), "item_id", itemId, "item_type", itemType, "version", version)
		}
	}

	a.Downloader.OnExtractProgress = func(itemId string, extracted int64, total int64) {
		a.emitEvent("extract:progress", map[string]interface{}{
			"itemId":          itemId,
			"amountExtracted": extracted,
			"total":           total,
		})
	}
	a.Downloader.OnProgress = func(itemId string, received int64, total int64) {
		a.emitEvent("download:progress", map[string]interface{}{
			"itemId":   itemId,
			"received": received,
			"total":    total,
		})
	}
	a.Downloader.OnCancelled = func(itemId string, assetType types.AssetType, phase string) {
		a.emitEvent("download:cancelled", map[string]interface{}{
			"itemId":    itemId,
			"assetType": string(assetType),
			"phase":     phase,
		})
	}
	a.Downloader.GetGameVersion = func() types.GameVersionResponse {
		return a.GetGameVersion()
	}
	a.Config.IsGameRunning = a.contentGate.GameSessionActive
	a.Downloader.OnRegistryUpdate = func() {
		a.emitEvent("registry:update")
	}
	a.Registry.OnProgress = func(p registry.RegistryProgress) {
		a.emitEvent("registry:refresh-progress", p)
	}
	if _, err := a.Config.ResolveConfig(); err != nil {
		log.Printf("Warning: failed to resolve config on startup: %v", err)
	}

	if a.Logger == nil {
		a.Logger = logger.NewAppLogger()
	}

	if err := paths.MoveLogFile(); err != nil {
		log.Printf("[WARN]: Failed to rotate startup log file: %v", err)
	}

	if err := a.Logger.Start(); err != nil {
		log.Printf("[WARN]: Failed to start app logger: %v", err)
	}
	a.configureTmpStagingRoots()
	a.cleanupTmpStaging("startup")

	activeProfile := resolveStartupProfile(a)
	a.Logger.Info("Active user profile loaded on startup", "profile_id", activeProfile.ID)

	if runtime.GOOS == "linux" && isAppImagePath(a.Config.Cfg.ExecutablePath) {
		// Initialize AppImage mount
		appImageMount, err := newAppImageMount(a.Config.Cfg.ExecutablePath)
		if err != nil {
			a.Logger.Error("Failed to initialize AppImage mount", err)
			a.appImageMount = nil
		} else {
			a.Logger.Info("AppImage mount initialized", "mountPath", appImageMount.AppImageMountPath)
			a.appImageMount = appImageMount
		}
	}

	// Config and profile are ready; registry initializes in the background
	a.setStartupReady(true)
	// Keep startup deep links queued until the frontend consumes them.
	// Emitting here can race listener registration during cold launches.
	go runNonBlockingStartupRoutines(a, activeProfile)
}

func (a *App) setStartupReady(ready bool) {
	a.startupMu.Lock()
	defer a.startupMu.Unlock()
	a.startupReady = ready
}

// emitEvent forwards frontend events through Wails, with a test override.
func (a *App) emitEvent(name string, optionalData ...interface{}) {
	if a.emitEventFunc != nil {
		a.emitEventFunc(name, optionalData...)
		return
	}
	if a.ctx == nil {
		a.Logger.Warn("dropping event without Wails context", "event", name)
		return
	}
	wailsruntime.EventsEmit(a.ctx, name, optionalData...)
}

// IsStartupReady reports whether backend startup routines have completed.
func (a *App) IsStartupReady() types.StartupReadyResponse {
	a.startupMu.RLock()
	defer a.startupMu.RUnlock()
	return types.StartupReadyResponse{
		GenericResponse: types.SuccessResponse("Startup status resolved"),
		Ready:           a.startupReady,
	}
}

// shutdown is called when the app shuts down.
func (a *App) shutdown(ctx context.Context) {
	if a.Logger == nil {
		return
	}

	a.Logger.Info("application shutdown")

	if a.galleryServer != nil {
		a.galleryServer.Close()
	}

	if err := a.Logger.Shutdown(); err != nil {
		_, _ = fmt.Fprintf(os.Stderr, "failed to flush app logs on shutdown: %v\n", err)
	}

	if result := a.Config.SaveConfig(); result.Status == types.ResponseError {
		log.Printf("Warning: failed to save config on shutdown: %s", result.Message)
	}
	if err := a.Registry.WriteInstalledToDisk(); err != nil {
		log.Printf("Warning: failed to persist installed registry state on shutdown: %v", err)
	}

	res := a.StopGame()
	if res.Status == types.ResponseError {
		log.Printf("Warning: failed to stop game on shutdown: %s", res.Message)
	}

	if a.appImageMount != nil {
		if err := a.appImageMount.Close(); err != nil {
			log.Printf("Warning: failed to unmount AppImage on shutdown: %v", err)
		}
	}
	a.cleanupTmpStaging("shutdown")
}

func resolveStartupProfile(a *App) types.UserProfile {
	loadResult := a.Profiles.LoadProfiles()
	if loadResult.Status == types.ResponseSuccess {
		return loadResult.Profile
	}
	return a.recoverProfiles(loadResult)
}

func (a *App) recoverProfiles(cause types.UserProfileResult) types.UserProfile {
	success, quarantinedPath := a.Profiles.QuarantineUserProfiles()
	if !success {
		a.Logger.MultipleError("Failed to quarantine user profiles", logger.AsErrors(cause.Errors), "cause", cause.Message, "quarantinedPath", quarantinedPath)
		return types.DefaultProfile()
	}

	resetResult := a.Profiles.ResetUserProfiles()
	if resetResult.Status == types.ResponseError {
		a.Logger.MultipleError("Failed to reset user profiles", logger.AsErrors(resetResult.Errors), "cause", cause.Message, "quarantinedPath", quarantinedPath)
		return types.DefaultProfile()
	}

	a.Logger.Warn("Recovered user profiles using defaults after load failure", "quarantinedPath", quarantinedPath)
	if resetResult.Profile.ID == "" {
		return types.DefaultProfile()
	}
	return resetResult.Profile
}

func runNonBlockingStartupRoutines(a *App, activeProfile types.UserProfile) {
	wailsruntime.WindowMaximise(a.ctx)

	if a.Config.Cfg.CheckForUpdatesOnLaunch {
		updater.CheckForUpdates(a.ctx, a.Downloader.OnProgress, a.Logger, a.Config.GetGithubToken())
	}

	if err := a.Registry.Initialize(); err != nil {
		a.Logger.Warn("Failed to ensure local registry repository", "error", err)
	} else {
		a.bootstrapInstalledState(activeProfile)
		if err := a.addSaltsOnFirstRun(); err != nil {
			a.Logger.Warn("Failed to add salts to existing assets on first run", "error", err)
		}
	}
	a.emitEvent("registry:ready")

	// The registry refresh is intentionally NOT run here. The git operations hog CPU resources
	// and starve the WebView2 UI thread, which can freeze the initial render until the fetch is completed.

	// Run before sync, and independently of the auto-update preference, so a single stuck
	// subscription cannot fail the startup sync for every other asset.
	reconcileResult := a.Profiles.ReconcileSubscriptionVersions(activeProfile.ID)
	switch reconcileResult.Status {
	case types.ResponseWarn:
		a.Logger.Warn("Reconciled non-installable subscription versions on startup", "profile_id", activeProfile.ID, "message", reconcileResult.Message, "operation_count", len(reconcileResult.Operations))
	case types.ResponseError:
		a.Logger.MultipleError("Failed to reconcile subscription versions on startup", logger.AsErrors(reconcileResult.Errors), "profile_id", activeProfile.ID)
	}

	// Sync subscriptions for active profile on startup
	syncResult := a.Profiles.SyncSubscriptions(activeProfile.ID, false, false)
	shouldRunAutoUpdate := activeProfile.SystemPreferences.AutoUpdateSubscriptions && syncResult.Status != types.ResponseError
	switch syncResult.Status {
	case types.ResponseError:
		a.Logger.MultipleError("Failed to sync profile subscriptions on startup", logger.AsErrors(syncResult.Errors), "profile_id", activeProfile.ID)
	case types.ResponseWarn:
		a.Logger.Warn("Profile subscriptions synced with warnings on startup", "message", syncResult.Message, "profile_id", activeProfile.ID, "error_count", len(syncResult.Errors))
	}

	if shouldRunAutoUpdate {
		updateResult := a.Profiles.UpdateSubscriptionsToLatest(types.UpdateSubscriptionsToLatestRequest{
			ProfileID: activeProfile.ID,
			Apply:     true,
			Targets:   []types.SubscriptionUpdateTarget{},
		})
		switch updateResult.Status {
		case types.ResponseError:
			a.Logger.MultipleError(
				"Failed to auto-update subscriptions on startup",
				logger.AsErrors(updateResult.Errors),
				"profile_id", activeProfile.ID,
			)
		case types.ResponseWarn:
			a.Logger.Warn(
				"Auto-updated subscriptions on startup with warnings",
				"profile_id", activeProfile.ID,
				"message", updateResult.Message,
				"warning_count", len(updateResult.Errors),
			)
		}
	}
}

func (a *App) bootstrapInstalledState(activeProfile types.UserProfile) {
	err := a.Registry.BootstrapInstalledStateFromProfile(activeProfile)
	if err != nil {
		// This should not be blocking as we are already in an error state
		a.Logger.Error("Failed to bootstrap installed asset state on startup", err, "profile_id", activeProfile.ID)
		return
	}

	// Reconcile local map subscriptions after bootstrap to remove any entries that can no longer be fulfilled with the current installed state.
	reconcileResult := a.Profiles.ReconcileLocalMapSubscriptions(activeProfile.ID)
	if reconcileResult.Status == types.ResponseError {
		return
	}
}

func (a *App) configureTmpStagingRoots() {
	cfgResult := a.Config.GetConfig()
	// Set separate staging roots for app data and MetroMaker data to allow atomic operations (and avoid cross-drive issues) for both locations
	roots := []files.StagingRoot{
		{
			TargetRoot:  paths.AppDataRoot(),
			StagingRoot: paths.AppTmpStagingPath(),
		},
	}
	if cfgResult.Config.MetroMakerDataPath != "" {
		roots = append(roots, files.StagingRoot{
			TargetRoot:  cfgResult.Config.MetroMakerDataPath,
			StagingRoot: paths.MetroMakerTmpStagingPath(cfgResult.Config.MetroMakerDataPath),
		})
	}
	files.ConfigureTmpStagingRoots(roots)
}

func (a *App) cleanupTmpStaging(stage string) {
	if err := files.CleanupTmpStagingRoots(); err != nil {
		a.Logger.Warn("Failed to cleanup managed atomic staging directories", "stage", stage, "error", err)
	}
}

func (a *App) ManuallyCheckForUpdates() types.GenericResponse {
	a.Logger.Info("Manually checking for updates")
	updater.CheckForUpdates(a.ctx, a.Downloader.OnProgress, a.Logger, a.Config.GetGithubToken())
	return types.SuccessResponse("Update check started")
}

func (a *App) GetCurrentVersion() types.AppVersionResponse {
	version := strings.ToValidUTF8(constants.RAILYARD_VERSION, "")
	return types.AppVersionResponse{
		GenericResponse: types.SuccessResponse("App version resolved"),
		Version:         version,
	}
}

func (a *App) InstallLinuxSandbox() types.GenericResponse {
	a.Logger.Info("Installing Linux sandbox")
	if runtime.GOOS != "linux" {
		panic("InstalLinuxSandbox shouldn't be possible to call on a non-linux platform")
	}

	if a.Config.Cfg.ExecutablePath == "" {
		a.Logger.Warn("Game executable path is not configured, stopping.")
		return types.ErrorResponse("game executable path is not configured")
	}

	cmd := exec.Command(a.Config.Cfg.ExecutablePath, "--appimage-extract", "chrome-sandbox")
	cmd.Dir = "/tmp"
	err := cmd.Run()
	if err != nil {
		a.Logger.Error("Failed to extract chrome-sandbox using flatpak-spawn", err)
		return types.ErrorResponse(fmt.Sprintf("failed to extract chrome-sandbox: %v", err))
	}

	sandboxPath := path.Join("/tmp", "squashfs-root", "chrome-sandbox")
	if _, err := os.Stat(sandboxPath); errors.Is(err, fs.ErrNotExist) {
		a.Logger.Error("Extracted chrome-sandbox not found at expected path", err)
		return types.ErrorResponse(fmt.Sprintf("extracted chrome-sandbox not found at expected path: %s", sandboxPath))
	}

	destPath := path.Join("/usr", "local", "bin", "chrome-sb-sandbox")
	if _, lookPathErr := exec.LookPath("flatpak-spawn"); lookPathErr == nil {
		cmd = exec.Command("flatpak-spawn", "--host", "pkexec", "install", "-o", "root", "-g", "root", "-m", "4755", sandboxPath, destPath)
	} else {
		cmd = exec.Command("pkexec", "install", "-o", "root", "-g", "root", "-m", "4755", sandboxPath, destPath)
	}
	if err := cmd.Run(); err != nil {
		a.Logger.Error("Failed to install chrome-sandbox with pkexec", err)
		return types.ErrorResponse(fmt.Sprintf("failed to install chrome-sandbox with pkexec: %v", err))
	}
	a.Config.Cfg.ChromeSandboxPath = destPath
	return types.SuccessResponse("Linux sandbox installed")
}

func (a *App) SandboxIsInstalled() types.SandboxStatusResponse {
	installed := false
	if runtime.GOOS == "linux" && a.Config.Cfg.ChromeSandboxPath != "" {
		if _, err := os.Stat(a.Config.Cfg.ChromeSandboxPath); !errors.Is(err, fs.ErrNotExist) {
			installed = true
		}
	}

	return types.SandboxStatusResponse{
		GenericResponse: types.SuccessResponse("Sandbox status resolved"),
		Installed:       installed,
	}
}

func (a *App) GetPlatform() types.PlatformResponse {
	return types.PlatformResponse{
		GenericResponse: types.SuccessResponse("Platform resolved"),
		Platform:        runtime.GOOS,
	}
}
func (a *App) addSaltsOnFirstRun() error {
	if _, err := os.Stat(paths.JoinLocalPath(paths.AppDataRoot(), constants.RailyardAssetsSaltedMarker)); errors.Is(err, fs.ErrNotExist) {
		a.Logger.Info("Adding salts to existing assets on first run")
		for _, mod := range a.Registry.GetInstalledMods() {
			id := mod.ID

			if _, err := os.Create(paths.JoinLocalPath(a.Config.Cfg.GetModsFolderPath(), id, constants.RailyardAssetMarker)); err != nil {
				a.Logger.Warn("Failed to add salt file for mod", "mod_id", id, "error", err)
				return err
			}
		}

		for _, m := range a.Registry.GetInstalledMaps() {
			code := m.MapConfig.Code
			if _, err := os.Create(paths.JoinLocalPath(a.Config.Cfg.GetMapsFolderPath(), code, constants.RailyardAssetMarker)); err != nil {
				a.Logger.Warn("Failed to add salt file for map", "map_code", code, "error", err)
				return err
			}
		}

		// Create a marker file to indicate that salts have been added, so we don't repeat this process on subsequent runs
		if _, err := os.Create(paths.JoinLocalPath(paths.AppDataRoot(), constants.RailyardAssetsSaltedMarker)); err != nil {
			a.Logger.Warn("Failed to create asset salted marker file", "error", err)
			return err
		}
	}
	return nil
}

func (a *App) GetTotalMemory() (uint64, error) {
	return utils.GetTotalSystemMemoryMB()
}
