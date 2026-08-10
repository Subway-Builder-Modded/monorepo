package main

import (
	"context"
	"net/http"
	"os/exec"
	"runtime"
	"strings"
	"sync"

	"railyard/internal/config"
	"railyard/internal/constants"
	"railyard/internal/downloader"
	"railyard/internal/gate"
	"railyard/internal/logger"
	"railyard/internal/profiles"
	"railyard/internal/registry"
	"railyard/internal/types"
	"railyard/internal/updater"
	"railyard/internal/utils"
)

// gameLaunchState holds the mutable state of the current or most-recent game launch.
type gameLaunchState struct {
	mu       sync.Mutex
	cmd      *exec.Cmd
	starting bool
	// discovering is true while a Steam launch's background watcher polls for the game process.
	discovering bool
	// cancel aborts the in-flight discovery watcher, and is called by StopGame. It is Nil when no watcher is running.
	cancel context.CancelFunc
	// gen increments per launch so a cancelled launch's kill-on-sight never kills a newer one.
	gen uint64
}

// App struct
type App struct {
	Registry   *registry.Registry
	Config     *config.Config
	Downloader *downloader.Downloader
	ctx        context.Context
	Profiles   *profiles.UserProfiles
	Logger     *logger.AppLogger

	game              gameLaunchState
	pmtilesServer     *http.Server
	drivingPathServer *http.Server
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

func (a *App) GetPlatform() types.PlatformResponse {
	return types.PlatformResponse{
		GenericResponse: types.SuccessResponse("Platform resolved"),
		Platform:        runtime.GOOS,
	}
}

func (a *App) GetTotalMemory() (uint64, error) {
	return utils.GetTotalSystemMemoryMB()
}
