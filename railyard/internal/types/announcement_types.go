package types

// AnnouncementsFile is the on-disk record of in-app announcements the user has
// acknowledged, keyed by announcement ID and valued by the RFC 3339 time the
// acknowledgement was made. Announcement copy lives in the frontend; this file
// only ever stores IDs, so the backend never needs to know what one says.
type AnnouncementsFile struct {
	SchemaVersion int               `json:"schema_version"`
	Seen          map[string]string `json:"seen"`
}

// AnnouncementsResponse returns the acknowledged announcement IDs.
type AnnouncementsResponse struct {
	GenericResponse
	Seen []string `json:"seen"`
}
