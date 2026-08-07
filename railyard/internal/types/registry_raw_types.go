package types

// Deprecation is the author/caretaker-issued deprecation record on a listing
// manifest. Presence marks the asset deprecated: it is never downloadable and
// only surfaces in browse behind the Deprecated status facet. Deleted=true
// upgrades that to permanent deletion (never restorable; own Deleted facet).
type Deprecation struct {
	Since      string `json:"since"`
	ByGithubID int64  `json:"by_github_id"`
	Reason     string `json:"reason,omitempty"`
	Deleted    bool   `json:"deleted,omitempty"`
}

// RawManifest represents shared manifest fields as stored on disk in the registry repository.
// This shape is intentionally distinct from AssetManifest because `AuthorID` is not yet enriched.
type RawManifest struct {
	SchemaVersion int          `json:"schema_version"`
	ID            string       `json:"id"`
	Name          string       `json:"name"`
	AuthorID      string       `json:"author"`
	GithubID      int          `json:"github_id"`
	LastUpdated   int64        `json:"last_updated"`
	Description   string       `json:"description"`
	Tags          []string     `json:"tags"`
	Gallery       []string     `json:"gallery"`
	Source        string       `json:"source"`
	Update        UpdateConfig `json:"update"`
	IsTest        bool         `json:"is_test,omitempty"`
	SearchAliases []string     `json:"search_aliases,omitempty"`
	Deprecation   *Deprecation `json:"deprecation,omitempty"`
}

type RawModManifest struct {
	RawManifest
}

type DataQuality struct {
	Tier          string  `json:"tier"`
	RawScore      float64 `json:"raw_score,omitempty"`
	WeightedScore float64 `json:"weighted_score,omitempty"`
	RubricVersion int     `json:"rubric_version"`
	Provenance    string  `json:"provenance,omitempty"`
}

type RawMapManifest struct {
	RawManifest
	CityCode         string           `json:"city_code"`
	Country          string           `json:"country"`
	Location         string           `json:"location"`
	Population       int              `json:"population"`
	DataSource       string           `json:"data_source"`
	SourceQuality    string           `json:"source_quality"`
	DataQuality      *DataQuality     `json:"data_quality,omitempty"`
	SpecialDemand    []string         `json:"special_demand"`
	InitialViewState InitialViewState `json:"initial_view_state"`
}
