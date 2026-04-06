package types

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
}

type RawModManifest struct {
	RawManifest
}

type RawMapManifest struct {
	RawManifest
	CityCode         string           `json:"city_code"`
	Country          string           `json:"country"`
	Location         string           `json:"location"`
	Population       int              `json:"population"`
	DataSource       string           `json:"data_source"`
	SourceQuality    string           `json:"source_quality"`
	LevelOfDetail    string           `json:"level_of_detail"`
	SpecialDemand    []string         `json:"special_demand"`
	InitialViewState InitialViewState `json:"initial_view_state"`
}
