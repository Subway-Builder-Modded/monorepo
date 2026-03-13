package main

import (
	"embed"
	"fmt"
	"os"

	"railyard/internal/lock"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	lockHandle, alreadyRunning, err := lock.ObtainLock()
	if err != nil {
		_, _ = fmt.Fprintf(os.Stderr, "Error: failed to acquire startup lock: %v\n", err)
		return
	}
	if alreadyRunning {
		return
	}
	defer func() {
		_ = lockHandle.Release()
	}()

	// Create an instance of the app structure
	app := NewApp()

	// Create application with options
	err = wails.Run(&options.App{
		Title:  "Railyard",
		Width:  1024,
		Height: 768,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup:        app.startup,
		OnShutdown:       app.shutdown,
		Bind: []interface{}{
			app,
			app.Registry,
			app.Config,
			app.Downloader,
			app.Profiles,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
