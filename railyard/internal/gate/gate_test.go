package gate

import (
	"testing"

	"github.com/stretchr/testify/require"
)

func TestContentOpsBlockGameSession(t *testing.T) {
	g := &GameContentGate{}
	require.NoError(t, g.BeginContentOp())
	require.NoError(t, g.BeginContentOp()) // content ops may overlap

	_, err := g.BeginGameSession()
	require.ErrorIs(t, err, ErrContentOpsActive)

	g.EndContentOp()
	_, err = g.BeginGameSession()
	require.ErrorIs(t, err, ErrContentOpsActive) // one op still holds the gate

	g.EndContentOp()
	token, err := g.BeginGameSession()
	require.NoError(t, err)
	require.NotZero(t, token)
}

func TestGameSessionBlocksContentOpsAndSecondSession(t *testing.T) {
	g := &GameContentGate{}
	token, err := g.BeginGameSession()
	require.NoError(t, err)
	require.True(t, g.GameSessionActive())

	require.ErrorIs(t, g.BeginContentOp(), ErrGameSessionActive)
	_, err = g.BeginGameSession()
	require.ErrorIs(t, err, ErrGameSessionActive)

	g.EndGameSession(token)
	require.False(t, g.GameSessionActive())
	require.NoError(t, g.BeginContentOp())
}

func TestStaleSessionTokenIsIgnored(t *testing.T) {
	g := &GameContentGate{}
	stale, err := g.BeginGameSession()
	require.NoError(t, err)
	g.EndGameSession(stale)

	current, err := g.BeginGameSession()
	require.NoError(t, err)

	// A delayed watcher from the ended session must not release the new one.
	g.EndGameSession(stale)
	require.True(t, g.GameSessionActive())

	g.EndGameSession(current)
	require.False(t, g.GameSessionActive())
}

func TestNilGateImposesNoExclusivity(t *testing.T) {
	var g *GameContentGate
	require.NoError(t, g.BeginContentOp())
	g.EndContentOp()
	token, err := g.BeginGameSession()
	require.NoError(t, err)
	g.EndGameSession(token)
	require.False(t, g.GameSessionActive())
}
