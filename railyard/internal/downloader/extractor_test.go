package downloader

import (
	"testing"

	"railyard/internal/files"
	"railyard/internal/paths"

	"github.com/stretchr/testify/require"
)

func TestMapEntryStagedTarget(t *testing.T) {
	const staging = "staging"

	tests := []struct {
		name      string
		key       string
		entryName string
		wantBase  string
		wantGzip  bool
	}{
		{
			name:      "config kept uncompressed for bootstrapping",
			key:       files.MapArchiveKeyConfig,
			entryName: files.MapConfigFileName,
			wantBase:  files.MapConfigFileName,
			wantGzip:  false,
		},
		{
			name:      "uncompressed json is gzipped on the way in",
			key:       files.MapArchiveKeyBuildings,
			entryName: files.MapBuildingsFileName,
			wantBase:  files.MapBuildingsFileName + ".gz",
			wantGzip:  true,
		},
		{
			name:      "already-gzipped binary is stored verbatim",
			key:       files.MapArchiveKeyBuildingsBin,
			entryName: files.MapBuildingsBinFileName + ".gz",
			wantBase:  files.MapBuildingsBinFileName + ".gz",
			wantGzip:  false,
		},
		{
			name:      "already-gzipped json is stored verbatim (no double-gzip)",
			key:       files.MapArchiveKeyBuildings,
			entryName: files.MapBuildingsFileName + ".gz",
			wantBase:  files.MapBuildingsFileName + ".gz",
			wantGzip:  false,
		},
		{
			name:      "uncompressed demand data is gzipped",
			key:       files.MapArchiveKeyDemandData,
			entryName: files.MapDemandFileName,
			wantBase:  files.MapDemandFileName + ".gz",
			wantGzip:  true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			dest, gzipStream := mapEntryStagedTarget(tt.key, tt.entryName, staging)
			require.Equal(t, tt.wantGzip, gzipStream)
			require.Equal(t, paths.JoinLocalPath(staging, tt.wantBase), dest)
		})
	}
}
