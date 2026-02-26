package main

import (
	"context"
	"log"
)

// App struct
type App struct {
	ctx      context.Context
	Registry *Registry
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{
		Registry: NewRegistry(),
	}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	// Initialize the registry (clone or update) on startup
	if err := a.Registry.Initialize(); err != nil {
		log.Printf("Warning: failed to initialize registry: %v", err)
	}
}

