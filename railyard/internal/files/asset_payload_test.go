package files

import (
	"testing"

	"railyard/internal/types"

	"github.com/stretchr/testify/require"
)

func TestSharedAssetPayloadRelativePathCrossPlatformEntries(t *testing.T) {
	tests := []struct {
		name         string
		entryName    string
		wantRelPath  string
		wantIsShared bool
		wantErr      bool
	}{
		{
			name:         "normalizes windows separators",
			entryName:    `.railyard_map\data\example.json`,
			wantRelPath:  "data/example.json",
			wantIsShared: true,
		},
		{
			name:         "rejects windows drive path",
			entryName:    `C:\.railyard_map\data\example.json`,
			wantIsShared: true,
			wantErr:      true,
		},
		{
			name:         "rejects unc path",
			entryName:    `\\server\share\.railyard_map\data\example.json`,
			wantIsShared: true,
			wantErr:      true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			relPath, isSharedEntry, err := SharedAssetPayloadRelativePath(types.AssetTypeMap, tt.entryName)
			require.Equal(t, tt.wantIsShared, isSharedEntry)
			require.Equal(t, tt.wantRelPath, relPath)
			if tt.wantErr {
				require.Error(t, err)
				return
			}
			require.NoError(t, err)
		})
	}
}
