// This package enforces mutual exclusion between a running game session and mutations of
// installed content (installs, uninstalls, imports); the game must never launch against
// content that is mid-change, and content must never change underneath a running game.
package gate

import (
	"errors"
	"sync"
)

var (
	// ErrGameSessionActive rejects a content mutation while a game session holds the gate.
	ErrGameSessionActive = errors.New("the game is running")
	// ErrContentOpsActive rejects a game launch while content mutations hold the gate.
	ErrContentOpsActive = errors.New("content is being installed")
)

// GameContentGate is the authority for game<>content mutation exclusivity.
// - content operations hold the gate from enqueue until completion and may overlap each other
// - a game session holds it exclusively from launch until the game process exits.
// Either side fails fast when the other holds the gate.
type GameContentGate struct {
	mu          sync.Mutex
	contentOps  int
	gameSession int // 0 when no session is active; otherwise the active session's token
	lastSession int
}

// BeginContentOp reserves the gate for one content mutation; pair with EndContentOp.
func (g *GameContentGate) BeginContentOp() error {
	if g == nil {
		return nil
	}
	g.mu.Lock()
	defer g.mu.Unlock()
	if g.gameSession != 0 {
		return ErrGameSessionActive
	}
	g.contentOps++
	return nil
}

// EndContentOp releases one content mutation's hold on the gate.
func (g *GameContentGate) EndContentOp() {
	if g == nil {
		return
	}
	g.mu.Lock()
	defer g.mu.Unlock()
	if g.contentOps > 0 {
		g.contentOps--
	}
}

// BeginGameSession reserves the gate for a game session, returning a token for EndGameSession.
func (g *GameContentGate) BeginGameSession() (int, error) {
	if g == nil {
		return 0, nil
	}
	g.mu.Lock()
	defer g.mu.Unlock()
	if g.contentOps > 0 {
		return 0, ErrContentOpsActive
	}
	if g.gameSession != 0 {
		return 0, ErrGameSessionActive
	}
	g.lastSession++
	g.gameSession = g.lastSession
	return g.gameSession, nil
}

// EndGameSession releases the game session identified by token; stale tokens are ignored.
func (g *GameContentGate) EndGameSession(token int) {
	if g == nil {
		return
	}
	g.mu.Lock()
	defer g.mu.Unlock()
	if g.gameSession == token {
		g.gameSession = 0
	}
}

// GameSessionActive reports whether a game session currently holds the gate.
func (g *GameContentGate) GameSessionActive() bool {
	if g == nil {
		return false
	}
	g.mu.Lock()
	defer g.mu.Unlock()
	return g.gameSession != 0
}
