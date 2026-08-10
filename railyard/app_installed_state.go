package main

// This file defines installed-state repair on startup: bootstrapping the installed
// asset registry from the active profile, first-run marker back-fill, and orphaned
// file cleanup.

import (
	"errors"
	"io/fs"
	"os"

	"railyard/internal/constants"
	"railyard/internal/files"
	"railyard/internal/paths"
	"railyard/internal/types"
)

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

// cleanupOrphanedArtifacts sweeps orphaned Railyard-managed files on startup, best-effort.
func (a *App) cleanupOrphanedArtifacts() {
	removed, err := files.CleanupOrphanFoundationTiles(paths.TilesPath())
	if err != nil {
		a.Logger.Warn("Failed to clean up orphaned foundation tile files", "error", err)
	}
	if len(removed) > 0 {
		a.Logger.Info("Removed orphaned foundation tile files", "count", len(removed), "files", removed)
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
