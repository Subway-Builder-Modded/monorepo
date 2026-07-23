package main

// Background discovery of a Steam-launched game process. Firing steam:// is fire-and-forget: the
// game may appear immediately, after the user clears a Steam dialog (account in use elsewhere, an
// update, a cancelled prompt), or never. Discovery therefore runs as a watcher that keeps polling
// past the surface delay (which only raises the launch-blocked dialog) until one terminal outcome:
// the game is found and attached, the user cancels, or the hard cap is reached.

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"runtime"
	"time"

	"railyard/internal/constants"
	"railyard/internal/types"
)

// runSteamDiscovery polls for the game process and drives the launch lifecycle via events. It owns
// the game session from launch handoff until a terminal outcome.
func (a *App) runSteamDiscovery(ctx context.Context, sessionToken int, gen uint64, spec launchSpec) {
	lookup := steamProcessLookup(runtime.GOOS, a.Logger)
	surfaceDeadline := time.Now().Add(steamDiscoverySurfaceDelay)
	hardCapDeadline := time.Now().Add(steamLaunchDiscoveryTimeout)
	surfaced := false

	ticker := time.NewTicker(steamPollInterval)
	defer ticker.Stop()

	for {
		if proc, _ := lookup(); proc != nil {
			a.attachDiscoveredGame(sessionToken, proc)
			return
		}

		now := time.Now()
		if !surfaced && now.After(surfaceDeadline) {
			// The game hasn't appeared yet: surface the blocked dialog, but keep polling so a
			// late-appearing game still attaches and dismisses it.
			surfaced = true
			a.emitSteamLaunchBlocked()
		}
		if now.After(hardCapDeadline) {
			a.finishDiscovery(sessionToken)
			a.emitEvent("game:launch-gaveup", map[string]string{
				"message": fmt.Sprintf(
					"Railyard stopped waiting for the game after %s. If Steam is still busy, try launching again.",
					steamLaunchDiscoveryTimeout,
				),
			})
			a.emitEvent("game:status", "stopped")
			return
		}

		select {
		case <-ctx.Done():
			// User cancelled. steam:// can't be un-fired, so release the session now (unblock the
			// app) and, for a grace window, kill the game if it still appears - unless a newer
			// launch has taken over.
			a.finishDiscovery(sessionToken)
			a.emitEvent("game:status", "stopped")
			a.killGameOnSight(gen, spec)
			return
		case <-ticker.C:
		}
	}
}

// attachDiscoveredGame adopts the found process as the running game and starts the exit watcher.
func (a *App) attachDiscoveredGame(sessionToken int, proc *os.Process) {
	cmd := &exec.Cmd{Process: proc}
	a.gameMu.Lock()
	a.gameCmd = cmd
	a.gameStarting = false
	a.gameDiscovering = false
	a.gameLaunchCancel = nil
	a.gameMu.Unlock()

	a.emitEvent("game:status", "running")
	a.emitEvent("game:log", map[string]string{
		"stream": "stdout",
		"line":   fmt.Sprintf("> %s %s", constants.STEAM_URL, "(cannot get logs when using Steam launch)"),
	})

	go a.watchGameExit(sessionToken, cmd, true)
}

// finishDiscovery clears the discovery flags and releases the session. Used by the give-up and
// cancel paths (attach hands the session to watchGameExit instead).
func (a *App) finishDiscovery(sessionToken int) {
	a.gameMu.Lock()
	a.gameStarting = false
	a.gameDiscovering = false
	a.gameLaunchCancel = nil
	a.gameMu.Unlock()
	a.contentGate.EndGameSession(sessionToken)
}

// emitSteamLaunchBlocked raises the launch-blocked dialog, distinguishing "Steam isn't running"
// from "Steam is running but the launch is blocked" so the dialog can guide the user.
func (a *App) emitSteamLaunchBlocked() {
	errType := types.GameLaunchErrorSteamDiscoveryTimeout
	message := "Railyard hasn't detected the game starting yet. Steam may be waiting on a dialog - for example your account is in use on another device, an update is downloading, or the launch was cancelled."
	if !steamClientRunning(runtime.GOOS, a.Logger) {
		errType = types.GameLaunchErrorSteamNotRunning
		message = "Steam isn't running, so the game hasn't started. Open Steam to continue the launch, or cancel it."
	}
	a.emitEvent("game:launch-blocked", map[string]string{
		"errorType": string(errType),
		"message":   message,
	})
}

// killGameOnSight kills the game if it appears within the grace window after a cancel, skipping if
// a newer launch (different generation) has taken over so we never kill a valid launch's game.
func (a *App) killGameOnSight(gen uint64, spec launchSpec) {
	lookup := steamProcessLookup(runtime.GOOS, a.Logger)
	deadline := time.Now().Add(steamCancelKillGrace)
	ticker := time.NewTicker(steamPollInterval)
	defer ticker.Stop()

	for time.Now().Before(deadline) {
		a.gameMu.Lock()
		superseded := a.gameLaunchGen != gen
		a.gameMu.Unlock()
		if superseded {
			return
		}
		if proc, _ := lookup(); proc != nil {
			a.Logger.Info("Killing game that appeared after a cancelled Steam launch")
			a.killSteamGameProcess(proc)
			return
		}
		<-ticker.C
	}
}

// killSteamGameProcess kills a discovered Steam game process (and its Electron children) that
// appeared after a cancelled launch.
func (a *App) killSteamGameProcess(proc *os.Process) {
	if err := killGameProcessTree(proc.Pid, runtime.GOOS, true, a.Logger); err != nil {
		a.Logger.Warn("Failed to kill Steam game after cancel", "error", err)
	}
}

// watchGameExit blocks until the game exits, then clears state, releases the session, and emits the
// exit/stopped events. Shared by the vanilla launch path and the Steam attach path.
func (a *App) watchGameExit(sessionToken int, cmd *exec.Cmd, useSteam bool) {
	err := waitForGameExit(runtime.GOOS, useSteam, cmd, a.Logger)
	a.gameMu.Lock()
	a.gameCmd = nil
	a.gameStarting = false
	a.gameMu.Unlock()
	a.contentGate.EndGameSession(sessionToken)

	exitCode := 0
	if err != nil {
		if exitErr, ok := err.(*exec.ExitError); ok {
			exitCode = exitErr.ExitCode()
		}
		a.Logger.Warn("Game exited with error", "error", err)
	} else {
		a.Logger.Info("Game exited normally")
	}
	a.emitEvent("game:exit", exitCode)
	a.emitEvent("game:status", "stopped")
}
