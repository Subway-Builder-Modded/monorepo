package announcements

import (
	"encoding/json"
	"os"
	"testing"
	"time"

	"github.com/stretchr/testify/require"

	"railyard/internal/paths"
	"railyard/internal/testutil"
	"railyard/internal/types"
)

func readFile(t *testing.T) types.AnnouncementsFile {
	t.Helper()
	data, err := os.ReadFile(paths.AnnouncementsPath())
	require.NoError(t, err)
	var file types.AnnouncementsFile
	require.NoError(t, json.Unmarshal(data, &file))
	return file
}

func TestSeenIsEmptyOnFirstRun(t *testing.T) {
	testutil.NewHarness(t)

	seen, err := NewAnnouncements().Seen()
	require.NoError(t, err)
	require.Empty(t, seen)
	require.NoFileExists(t, paths.AnnouncementsPath())
}

func TestMarkSeenPersistsWithSchemaVersionAndTimestamp(t *testing.T) {
	testutil.NewHarness(t)
	ann := NewAnnouncements()
	ann.now = func() time.Time { return time.Date(2026, 8, 16, 4, 30, 0, 0, time.UTC) }

	recorded, err := ann.MarkSeen("maintenance-mode-2026-08")
	require.NoError(t, err)
	require.True(t, recorded)

	file := readFile(t)
	require.Equal(t, SchemaVersion, file.SchemaVersion)
	require.Equal(t, map[string]string{"maintenance-mode-2026-08": "2026-08-16T04:30:00Z"}, file.Seen)

	// A fresh ann reads the same acknowledgement back off disk.
	seen, err := NewAnnouncements().Seen()
	require.NoError(t, err)
	require.Equal(t, []string{"maintenance-mode-2026-08"}, seen)
}

func TestMarkSeenKeepsTheFirstAcknowledgementTimestamp(t *testing.T) {
	testutil.NewHarness(t)
	ann := NewAnnouncements()
	ann.now = func() time.Time { return time.Date(2026, 8, 16, 4, 30, 0, 0, time.UTC) }
	_, err := ann.MarkSeen("maintenance-mode-2026-08")
	require.NoError(t, err)

	ann.now = func() time.Time { return time.Date(2026, 9, 1, 0, 0, 0, 0, time.UTC) }
	recorded, err := ann.MarkSeen("maintenance-mode-2026-08")
	require.NoError(t, err)
	require.False(t, recorded, "a repeat acknowledgement records nothing")

	require.Equal(t, "2026-08-16T04:30:00Z", readFile(t).Seen["maintenance-mode-2026-08"])
}

func TestSeenReturnsEveryAcknowledgementSorted(t *testing.T) {
	testutil.NewHarness(t)
	ann := NewAnnouncements()

	_, err := ann.MarkSeen("zulu")
	require.NoError(t, err)
	_, err = ann.MarkSeen("alpha")
	require.NoError(t, err)

	seen, seenErr := ann.Seen()
	require.NoError(t, seenErr)
	require.Equal(t, []string{"alpha", "zulu"}, seen)
}

// An unreadable record must not be mistaken for "nothing acknowledged", which would replay every announcement.
func TestSeenSurfacesAMalformedRecord(t *testing.T) {
	testutil.NewHarness(t)
	require.NoError(t, os.MkdirAll(paths.AppDataRoot(), 0o755))
	require.NoError(t, os.WriteFile(paths.AnnouncementsPath(), []byte("{not json"), 0o644))

	_, err := NewAnnouncements().Seen()
	require.Error(t, err)
}
