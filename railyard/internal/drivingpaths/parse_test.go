package drivingpaths

import (
	"encoding/json"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestParseDrivingPathsSplitsTopLevel(t *testing.T) {
	in := []byte(`{"6344":[[1.1,2.2],[3.3,4.4]],"31655":[[5.5,6.6]]}`)
	m, err := parseDrivingPaths(in)
	require.NoError(t, err)
	require.Len(t, m, 2)
	require.JSONEq(t, "[[1.1,2.2],[3.3,4.4]]", string(m["6344"]))
	require.JSONEq(t, "[[5.5,6.6]]", string(m["31655"]))
}

func TestParseDrivingPathsHandlesWhitespace(t *testing.T) {
	in := []byte("{\n  \"a\": [[1,2]],\n  \"b\": [[3,4],[5,6]]\n}")
	m, err := parseDrivingPaths(in)
	require.NoError(t, err)
	require.JSONEq(t, "[[1,2]]", string(m["a"]))
	require.JSONEq(t, "[[3,4],[5,6]]", string(m["b"]))
}

func TestParseDrivingPathsEmptyObject(t *testing.T) {
	m, err := parseDrivingPaths([]byte(`{}`))
	require.NoError(t, err)
	require.Len(t, m, 0)
}

func TestParseDrivingPathsFallsBackOnMalformed(t *testing.T) {
	// Value isn't an array, so the fast path bails to encoding/json, which then
	// errors on the invalid token — a well-formed file always parses, a broken
	// one fails loudly rather than silently returning garbage.
	_, err := parseDrivingPaths([]byte(`{"a": not-json}`))
	require.Error(t, err)
}

func TestParseDrivingPathsRawValueUnmarshalsToCoordinates(t *testing.T) {
	m, err := parseDrivingPaths([]byte(`{"x":[[139.7,35.6],[139.8,35.7]]}`))
	require.NoError(t, err)
	var coords [][]float64
	require.NoError(t, json.Unmarshal(m["x"], &coords))
	require.Equal(t, [][]float64{{139.7, 35.6}, {139.8, 35.7}}, coords)
}
