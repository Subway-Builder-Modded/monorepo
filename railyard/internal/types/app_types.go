package types

import (
	"archive/zip"
	"time"
)

// FileFoundStruct is a struct used to represent the result of searching for a file within a zip archive, including whether it was found, the file object if found, and whether the file is required.
type FileFoundStruct struct {
	Found      bool
	FileObject *zip.File
	Required   bool
}

type DeepLinkTarget struct {
	Type string `json:"type"`
	ID   string `json:"id"`
}

type DeepLinkResponse struct {
	GenericResponse
	Target *DeepLinkTarget `json:"target,omitempty"`
}

type StartupReadyResponse struct {
	GenericResponse
	Ready bool `json:"ready"`
}

type AppVersionResponse struct {
	GenericResponse
	Version string `json:"version"`
}

type GameVersionResponse struct {
	GenericResponse
	Version string `json:"version"`
}

type PlatformResponse struct {
	GenericResponse
	Platform string `json:"platform"`
}

type SandboxStatusResponse struct {
	GenericResponse
	Installed bool `json:"installed"`
}

type ImportAssetDialogResponse struct {
	GenericResponse
	// Paths holds every selected archive; a single import is just a one-element list.
	Paths []string `json:"paths"`
}

type ImportValidationStatus string

const (
	ImportValidationNew      ImportValidationStatus = "new"
	ImportValidationConflict ImportValidationStatus = "conflict"
	ImportValidationInvalid  ImportValidationStatus = "invalid"
)

// ImportArchiveValidation is the pre-flight validation record for a single map archive.
type ImportArchiveValidation struct {
	Path     string                 `json:"path"`
	Name     string                 `json:"name"`
	Code     string                 `json:"code"`
	Version  string                 `json:"version"`
	Status   ImportValidationStatus `json:"status"`
	Conflict *MapCodeConflict       `json:"conflict,omitempty"`
	Error    string                 `json:"error,omitempty"`
}

type ImportValidationResponse struct {
	GenericResponse
	Validations []ImportArchiveValidation `json:"validations"`
}

type GameRunningResponse struct {
	GenericResponse
	Running bool `json:"running"`
}

type MetroMakerModConfig struct {
	TileZoomLevel int                          `json:"tileZoomLevel"`
	Places        []MetroMakerPlace            `json:"places"`
	Port          int                          `json:"port"`
	Colors        map[string]map[string]string `json:"colors"`
	GameVersion   string                       `json:"gameVersion"`
}

// MetroMakerPlace is a mod-config place entry: a map's ConfigData plus the buildings-index stem the game should load.
type MetroMakerPlace struct {
	ConfigData
	BuildingsIndexFile string `json:"buildingsIndexFile"`
}

type MetroMakerModManifest struct {
	Id          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Version     string `json:"version"`
	Author      struct {
		Name string `json:"name"`
	} `json:"author"`
	Main         string            `json:"main"`
	Dependencies map[string]string `json:"dependencies,omitempty"`
}

// ConfigData represents the structure of the config.json file found within a map zip file, containing metadata about the map and its initial view state.
type ConfigData struct {
	Name               string           `json:"name"`
	Code               string           `json:"code"`
	Description        string           `json:"description"`
	Population         int              `json:"population"`
	Country            *string          `json:"country,omitempty"`
	ThumbnailBbox      *[4]float64      `json:"thumbnailBbox,omitempty"`
	Bbox               *[4]float64      `json:"bbox,omitempty"`
	Creator            string           `json:"creator"`
	Version            string           `json:"version"`
	MinZoom            *int             `json:"minZoom,omitempty"`
	MaxZoom            *int             `json:"maxZoom,omitempty"`
	DemandDotScaling   *float64         `json:"demandDotScaling,omitempty"`
	InitialViewState   InitialViewState `json:"initialViewState"`
	HasOceanDepth      bool             `json:"hasOceanDepth,omitempty"`
	HasFoundationTiles bool             `json:"hasFoundationTiles,omitempty"`
}

// CityInfo represents the metadata information about a city as defined in the cities.yaml file, including its code, name, version, hash, size, last modified time, and the file name of the map zip.
type CityInfo struct {
	Code         string    `yaml:"code" json:"code"`
	Name         string    `yaml:"name" json:"name"`
	Version      string    `yaml:"version" json:"version"`
	Hash         string    `yaml:"hash" json:"hash"`
	Size         int64     `yaml:"size" json:"size"`
	LastModified time.Time `yaml:"lastModified" json:"lastModified"`
	FileName     string    `yaml:"fileName" json:"fileName"`
}

// CitiesData represents the root structure of the cities YAML file
type CitiesData struct {
	Version     string              `yaml:"version" json:"version"`
	LastUpdated time.Time           `yaml:"lastUpdated" json:"lastUpdated"`
	Cities      map[string]CityInfo `yaml:"cities" json:"cities"`
}
