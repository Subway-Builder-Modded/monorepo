// Package announcements persists which in-app announcements the user has
// acknowledged. Announcement copy lives in the frontend; this package only ever
// stores IDs.
package announcements

import (
	"sort"
	"sync"
	"time"

	"railyard/internal/files"
	"railyard/internal/paths"
	"railyard/internal/types"
)

// SchemaVersion is stamped on every write so the file can be migrated later.
const SchemaVersion = 1

// Announcements is the in-memory view of the acknowledgement record, loaded lazily from disk.
type Announcements struct {
	mu     sync.Mutex
	seen   map[string]string
	loaded bool
	now    func() time.Time
}

// NewAnnouncements returns an empty record; it is read from disk on first use.
func NewAnnouncements() *Announcements {
	return &Announcements{seen: map[string]string{}, now: time.Now}
}

// load reads the record once. A missing or empty file is a first run, not an error.
func (s *Announcements) load() error {
	if s.loaded {
		return nil
	}
	file, err := files.ReadJSON[types.AnnouncementsFile](
		paths.AnnouncementsPath(),
		"announcements",
		files.JSONReadOptions{AllowMissing: true, AllowEmpty: true},
	)
	if err != nil {
		return err
	}
	if file.Seen != nil {
		s.seen = file.Seen
	}
	s.loaded = true
	return nil
}

// Seen returns the acknowledged announcement IDs, sorted for a stable response.
func (s *Announcements) Seen() ([]string, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if err := s.load(); err != nil {
		return nil, err
	}

	ids := make([]string, 0, len(s.seen))
	for id := range s.seen {
		ids = append(ids, id)
	}
	sort.Strings(ids)
	return ids, nil
}

// MarkSeen records an acknowledgement, keeping the timestamp of the first one.
// The bool reports whether this call recorded anything, so a repeat dismissal is
// not logged as a fresh acknowledgement.
func (s *Announcements) MarkSeen(id string) (bool, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if err := s.load(); err != nil {
		return false, err
	}
	if _, ok := s.seen[id]; ok {
		return false, nil
	}

	s.seen[id] = s.now().UTC().Format(time.RFC3339)
	if err := files.WriteJSON(paths.AnnouncementsPath(), "announcements", types.AnnouncementsFile{
		SchemaVersion: SchemaVersion,
		Seen:          s.seen,
	}); err != nil {
		return false, err
	}
	return true, nil
}
