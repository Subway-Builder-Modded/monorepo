package files

import "railyard/internal/paths"

// MapArtifactRoot identifies which Railyard-managed directory a map artifact is installed into.
type MapArtifactRoot int

// Enumeration of map artifact roots.
const (
	// ArtifactRootTiles is the flat pmtiles directory under the Railyard app-data root.
	ArtifactRootTiles MapArtifactRoot = iota
	// ArtifactRootThumbnails is the city-maps thumbnail directory under the MetroMaker data root.
	ArtifactRootThumbnails
)

// MapArtifact describes a per-map file installed outside the map data directory.
type MapArtifact struct {
	ArchiveKey       string          // key in the map archive file index
	Root             MapArtifactRoot // destination directory the artifact is installed into
	Suffix           string          // installed file name is <city code> + Suffix
	ProfileEntryName string          // file name inside a profile archive's maps/<code>/ directory
	Label            string          // human-readable artifact name for messages and logs
	OptionalOnRemove bool            // removal failures are ignored instead of failing uninstall
}

// MapArtifacts is the source of truth for map artifacts outside of `cities/data“:
var MapArtifacts = []MapArtifact{
	{
		ArchiveKey:       MapArchiveKeyTiles,
		Root:             ArtifactRootTiles,
		Suffix:           MapTileFileExt,
		ProfileEntryName: "tiles.pmtiles",
		Label:            "tile",
	},
	{
		ArchiveKey:       MapArchiveKeyThumbnail,
		Root:             ArtifactRootThumbnails,
		Suffix:           MapThumbnailFileExt,
		ProfileEntryName: "thumbnail.svg",
		Label:            "thumbnail",
		OptionalOnRemove: true, // thumbnails may not exist and are regenerated at launch
	},
	{
		ArchiveKey:       MapArchiveKeyFoundationTiles,
		Root:             ArtifactRootTiles,
		Suffix:           MapFoundationTileFileExt,
		ProfileEntryName: "tiles_foundations.pmtiles",
		Label:            "foundation tile",
	},
}

// MapArtifactRootPath resolves an artifact root to its filesystem directory.
func MapArtifactRootPath(root MapArtifactRoot, metroMakerDataPath string) string {
	if root == ArtifactRootThumbnails {
		return paths.MetroMakerMapThumbnailsPath(metroMakerDataPath)
	}
	return paths.TilesPath()
}

// MapArtifactPath returns the installed path of an artifact for the given city code.
func MapArtifactPath(artifact MapArtifact, metroMakerDataPath string, cityCode string) string {
	return paths.JoinLocalPath(MapArtifactRootPath(artifact.Root, metroMakerDataPath), cityCode+artifact.Suffix)
}

// IsMapArtifactKey reports whether key belongs to an out-of-tree map artifact rather than the map data directory.
func IsMapArtifactKey(key string) bool {
	for _, artifact := range MapArtifacts {
		if artifact.ArchiveKey == key {
			return true
		}
	}
	return false
}
