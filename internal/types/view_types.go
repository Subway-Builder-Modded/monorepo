package types

type InitialViewState struct {
	Latitude  float64  `json:"latitude"`
	Longitude float64  `json:"longitude"`
	Zoom      float64  `json:"zoom"`
	Pitch     *float64 `json:"pitch,omitempty"`
	Bearing   float64  `json:"bearing"`
}
