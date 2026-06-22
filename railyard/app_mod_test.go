package main

import (
	"os"
	"testing"

	"railyard/internal/files"
	"railyard/internal/paths"
	"railyard/internal/types"

	"github.com/stretchr/testify/require"
)

func TestGameSupportsBinaryBuildings(t *testing.T) {
	success := func(version string) types.GameVersionResponse {
		return types.GameVersionResponse{GenericResponse: types.SuccessResponse("ok"), Version: version}
	}

	tests := []struct {
		name string
		resp types.GameVersionResponse
		want bool
	}{
		{"newer than floor", success("1.4.0"), true},
		{"newer with v prefix", success("v1.4.0"), true},
		{"much newer", success("2.0.0"), true},
		{"exactly the floor is json", success("1.3.0"), false},
		{"older than floor", success("1.2.0"), false},
		{"undetected version", types.GameVersionResponse{GenericResponse: types.WarnResponse("not detected"), Version: ""}, false},
		{"success but empty version", success(""), false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			require.Equal(t, tt.want, gameSupportsBinaryBuildings(tt.resp))
		})
	}
}

func TestChooseBuildingsIndexStem(t *testing.T) {
	const code = "AAA"

	writeBin := func(t *testing.T) string {
		t.Helper()
		root := t.TempDir()
		dir := paths.JoinLocalPath(root, code)
		require.NoError(t, os.MkdirAll(dir, 0o755))
		require.NoError(t, os.WriteFile(paths.JoinLocalPath(dir, files.MapBuildingsBinFileName+".gz"), []byte("bin"), 0o644))
		return root
	}

	t.Run("binary-capable game with the binary present loads the binary", func(t *testing.T) {
		root := writeBin(t)
		require.Equal(t, files.MapBuildingsBinFileName, chooseBuildingsIndexStem(root, code, true))
	})

	t.Run("binary-capable game without the binary falls back to json", func(t *testing.T) {
		root := t.TempDir() // no bin written
		require.Equal(t, files.MapBuildingsFileName, chooseBuildingsIndexStem(root, code, true))
	})

	t.Run("older game ignores an available binary and loads json", func(t *testing.T) {
		root := writeBin(t)
		require.Equal(t, files.MapBuildingsFileName, chooseBuildingsIndexStem(root, code, false))
	})
}
