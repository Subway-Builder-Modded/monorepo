package main

import (
	"railyard/internal/types"
)

// GetSeenAnnouncements returns the announcement IDs the user has already acknowledged.
func (a *App) GetSeenAnnouncements() types.AnnouncementsResponse {
	seen, err := a.Announcements.Seen()
	if err != nil {
		a.Logger.Error("Failed to read acknowledged announcements", err)
		return types.AnnouncementsResponse{GenericResponse: types.ErrorResponse(err.Error())}
	}
	return types.AnnouncementsResponse{
		GenericResponse: types.SuccessResponse("Read acknowledged announcements"),
		Seen:            seen,
	}
}

// MarkAnnouncementSeen records that the user dismissed an announcement, so an
// announcement that is displayed but never dismissed is shown again.
func (a *App) MarkAnnouncementSeen(id string) types.AnnouncementsResponse {
	recorded, err := a.Announcements.MarkSeen(id)
	if err != nil {
		a.Logger.Error("Failed to record announcement acknowledgement", err, "announcement_id", id)
		return types.AnnouncementsResponse{GenericResponse: types.ErrorResponse(err.Error())}
	}
	if recorded {
		a.Logger.Info("Recorded announcement acknowledgement", "announcement_id", id)
	}
	return a.GetSeenAnnouncements()
}
