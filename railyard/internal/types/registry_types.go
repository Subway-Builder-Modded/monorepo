package types

// InstalledConstraint is a  semver compatibility requirement stored at install time.
// The current game version must satisfy Range; failing any constraint marks the asset incompatible.
type InstalledConstraint struct {
	Type  string `json:"type"`  // ConstraintTypeManifest | ConstraintTypeBuildingsIndex | ...
	Range string `json:"range"` // semver constraint string, e.g. ">=1.3.0", "<=1.3.0"
}

const (
	// ConstraintTypeManifest is a game version constraint from the manifest game_version field
	ConstraintTypeManifest = "manifest"
	// ConstraintTypeBuildingsIndex is a constraint derived from which buildings-index files the map zip contains (JSON-only vs. binrary vs. both)
	ConstraintTypeBuildingsIndex = "buildings_index"
)

// ConstraintsFromVersionInfo builds the compatibility constraints a version imposes:
// its game-version range, plus (for maps) its buildings-index range. Single source
// of truth for what defines a version's compatibility, shared by install and update.
func ConstraintsFromVersionInfo(assetType AssetType, vi VersionInfo) []InstalledConstraint {
	var cs []InstalledConstraint
	// GameVersion covers every enrichment source: integrity report, custom JSON game_version, manifest.json fallback.
	if vi.GameVersion != "" {
		cs = append(cs, InstalledConstraint{Type: ConstraintTypeManifest, Range: vi.GameVersion})
	}
	// Only maps carry a buildings-index constraint.
	if assetType == AssetTypeMap && vi.MapBuildingsConstraint != "" {
		cs = append(cs, InstalledConstraint{Type: ConstraintTypeBuildingsIndex, Range: vi.MapBuildingsConstraint})
	}
	return cs
}

// UpdateConfig describes how a mod or map receives updates.
type UpdateConfig struct {
	Type string `json:"type"`
	Repo string `json:"repo,omitempty"`
	URL  string `json:"url,omitempty"`
}

// Source returns the canonical source identifier for update resolution.
// For GitHub updates this is the repo slug; otherwise it is the direct URL.
func (u UpdateConfig) Source() string {
	if u.Type == "github" {
		return u.Repo
	}
	return u.URL
}

type AuthorDetails struct {
	AuthorID        string  `json:"author_id"`
	AuthorAlias     string  `json:"author_alias"`
	AttributionLink string  `json:"attribution_link"`
	ContributorTier *string `json:"contributor_tier,omitempty"`
}

type AssetManifest struct {
	SchemaVersion int           `json:"schema_version"`
	ID            string        `json:"id"`
	Name          string        `json:"name"`
	Author        AuthorDetails `json:"author"`
	GithubID      int           `json:"github_id"`
	LastUpdated   int64         `json:"last_updated"`
	FirstReleased int64         `json:"first_released,omitempty"` // Earliest complete-version checked_at (asset debut); backend-enriched, best-effort
	Description   string        `json:"description"`
	Tags          []string      `json:"tags"`
	Gallery       []string      `json:"gallery"`
	Source        string        `json:"source"`
	Update        UpdateConfig  `json:"update"`
	IsTest        bool          `json:"is_test,omitempty"` // Indicates whether this asset is a test asset that should only be shown when "View Test Mods" is enabled in settings
	SearchAliases []string      `json:"search_aliases,omitempty"`
}

// ModManifest is the manifest schema for a mod entry in the registry.
type ModManifest struct {
	AssetManifest
}

type ModsResponse struct {
	GenericResponse
	Mods []ModManifest `json:"mods"`
}

// InstalledModInfo represents the information stored about an installed mod in the registry's installed_mods.json file.
type InstalledModInfo struct {
	ID                 string                 `json:"id"`
	Version            string                 `json:"version"`
	IsLocal            bool                   `json:"isLocal"` // Unused for now
	Manifest           *MetroMakerModManifest `json:"manifest,omitempty"`
	InstalledSizeBytes int64                  `json:"installedSizeBytes,omitempty"` // Populated in response payloads only
	Constraints        []InstalledConstraint  `json:"constraints,omitempty"`        // Semver compatibility requirements stored at install time
}

type InstalledModsResponse struct {
	GenericResponse
	Mods []InstalledModInfo `json:"mods"`
}

// InstalledMapInfo represents the information stored about an installed map in the registry's installed_maps.json file.
type InstalledMapInfo struct {
	ID                 string                `json:"id"`
	Version            string                `json:"version"`
	IsLocal            bool                  `json:"isLocal"` // Indicates whether or not the map was installed from a local file rather than downloaded via the registry
	MapConfig          ConfigData            `json:"config"`
	InstalledSizeBytes int64                 `json:"installedSizeBytes,omitempty"` // Populated in response payloads only
	Constraints        []InstalledConstraint `json:"constraints,omitempty"`        // Semver compatibility requirements stored at install time
}

type InstalledMapsResponse struct {
	GenericResponse
	Maps []InstalledMapInfo `json:"maps"`
}

// InstalledModFile represents the structure of the installed_mods.json file, which is a list of installed mods.
type InstalledModFile []InstalledModInfo

// InstalledMapFile represents the structure of the installed_maps.json file, which is a list of installed maps.
type InstalledMapFile []InstalledMapInfo

// MapManifest is the manifest schema for a map entry in the registry.
type MapManifest struct {
	AssetManifest
	CityCode         string           `json:"city_code"`
	Country          string           `json:"country"`
	Location         string           `json:"location"`
	SubLocation      string           `json:"sub_location,omitempty"`
	Population       int              `json:"population"`
	DataSource       string           `json:"data_source"`
	SourceQuality    string           `json:"source_quality"`
	LevelOfDetail    string           `json:"level_of_detail"`
	SpecialDemand    []string         `json:"special_demand"`
	InitialViewState InitialViewState `json:"initial_view_state"`
}

type MapsResponse struct {
	GenericResponse
	Maps []MapManifest `json:"maps"`
}

// IndexFile represents the top-level index.json in the mods/ or maps/ directory.
type IndexFile struct {
	SchemaVersion int      `json:"schema_version"`
	Mods          []string `json:"mods,omitempty"`
	Maps          []string `json:"maps,omitempty"`
}

// DownloadsFile represents downloads.json on disk, keyed by asset ID then version.
// Example:
//
//	{
//	  "calgary": { "1.1.3": 60, "1.0.1": 62 },
//	  "dublin": { "v1.0.0": 76 }
//	}
type DownloadsFile map[string]map[string]int

type AssetDownloadCountsResponse struct {
	GenericResponse
	AssetType string         `json:"assetType"`
	AssetID   string         `json:"assetId"`
	Counts    map[string]int `json:"counts"`
}

type DownloadCountsByAssetTypeResponse struct {
	GenericResponse
	AssetType string                    `json:"assetType"`
	Counts    map[string]map[string]int `json:"counts"`
}

type VersionsResponse struct {
	GenericResponse
	Versions []VersionInfo `json:"versions"`
}

// GameIncompatibleAssetsResponse carries the IDs of assets with no game-compatible installable version.
type GameIncompatibleAssetsResponse struct {
	GenericResponse
	AssetType string   `json:"assetType"`
	AssetIDs  []string `json:"assetIds"`
}

type GalleryImageResponse struct {
	GenericResponse
	ImageURL string `json:"imageUrl"`
}

// VersionInfo represents a single release version for a mod or map.
type VersionInfo struct {
	Version                string            `json:"version"`
	Name                   string            `json:"name"`
	Changelog              string            `json:"changelog"`
	Date                   string            `json:"date"`
	DownloadURL            string            `json:"download_url"`
	GameVersion            string            `json:"game_version"`
	SHA256                 string            `json:"sha256"`
	Downloads              int               `json:"downloads"`
	Manifest               string            `json:"manifest,omitempty"`
	Prerelease             bool              `json:"prerelease"`
	Dependencies           map[string]string `json:"dependencies,omitempty"`             // Map of dependency mod IDs to version constraints
	MapBuildingsConstraint string            `json:"map_buildings_constraint,omitempty"` // Derived semver range for map versions based on which buildings-index files the version ships; always empty for mods
}

// VersionsCacheEntry is a persisted upstream-release lookup: the resolved versions plus the HTTP ETag used to revalidate them with a conditional request.
type VersionsCacheEntry struct {
	ETag     string        `json:"etag"`
	Versions []VersionInfo `json:"versions"`
}

// VersionsCacheFile is the on-disk shape of the version cache, keyed by
// "<updateType>|<repoOrURL>".
type VersionsCacheFile struct {
	SchemaVersion int                           `json:"schema_version"`
	Entries       map[string]VersionsCacheEntry `json:"entries"`
}

// GithubRelease maps fields from the GitHub Releases API response.
type GithubRelease struct {
	TagName     string        `json:"tag_name"`
	Name        string        `json:"name"`
	Body        string        `json:"body"`
	Prerelease  bool          `json:"prerelease"`
	PublishedAt string        `json:"published_at"`
	Assets      []GithubAsset `json:"assets"`
}

type GithubAsset struct {
	Name               string `json:"name"`
	BrowserDownloadURL string `json:"browser_download_url"`
	DownloadCount      int    `json:"download_count"`
}

// CustomUpdateFile maps the custom update.json schema.
type CustomUpdateFile struct {
	SchemaVersion int                   `json:"schema_version"`
	Versions      []CustomUpdateVersion `json:"versions"`
}

type CustomUpdateVersion struct {
	Version      string            `json:"version"`
	GameVersion  string            `json:"game_version"`
	Date         string            `json:"date"`
	Changelog    string            `json:"changelog"`
	Download     string            `json:"download"`
	SHA256       string            `json:"sha256"`
	Manifest     string            `json:"manifest,omitempty"`
	Dependencies map[string]string `json:"dependencies,omitempty"` // Map of dependency mod IDs to version constraints
}

// RegistryIntegrityReport represents the overall status report for the registry
type RegistryIntegrityReport struct {
	SchemaVersion int                         `json:"schema_version"`
	GeneratedAt   string                      `json:"generated_at"`
	Listings      map[string]IntegrityListing `json:"listings"`
}

type RegistryIntegrityReportResponse struct {
	GenericResponse
	Report RegistryIntegrityReport `json:"report"`
}

// IntegrityListing represents a single mod/map listing with its versions
type IntegrityListing struct {
	HasCompleteVersion   bool                              `json:"has_complete_version"`
	LatestSemverVersion  *string                           `json:"latest_semver_version"`
	LatestSemverComplete *bool                             `json:"latest_semver_complete"`
	CompleteVersions     []string                          `json:"complete_versions"`
	IncompleteVersions   []string                          `json:"incomplete_versions"`
	Versions             map[string]IntegrityVersionStatus `json:"versions"`
}

// IntegrityVersionStatus represents the status of a specific version
type IntegrityVersionStatus struct {
	IsComplete     bool              `json:"is_complete"`
	Errors         []string          `json:"errors"`
	RequiredChecks map[string]bool   `json:"required_checks"`
	MatchedFiles   map[string]string `json:"matched_files"`
	// GameVersion and Dependencies are parsed from the release manifest asset by
	// the registry analytics pipeline (github sources only). When present, the
	// app uses them instead of fetching each release's manifest.json.
	GameVersion  string                 `json:"game_version,omitempty"`
	Dependencies map[string]string      `json:"dependencies,omitempty"`
	Source       IntegrityVersionSource `json:"source"`
	Fingerprint  string                 `json:"fingerprint"`
	CheckedAt    string                 `json:"checked_at"`
	// ReleasedAt is the version's immutable publish date (github release publishedAt,
	// else custom update date). Rules-bump-proof, unlike CheckedAt. Optional until the
	// registry republishes integrity with it populated.
	ReleasedAt string `json:"released_at,omitempty"`
}

// IntegrityVersionSource represents the source information for a version
type IntegrityVersionSource struct {
	UpdateType  string  `json:"update_type"`
	Repo        string  `json:"repo"`
	Tag         string  `json:"tag"`
	AssetName   *string `json:"asset_name,omitempty"`
	DownloadURL *string `json:"download_url,omitempty"`
}
