package registry

import (
	"testing"

	"railyard/internal/types"
)

type noopLogSink struct{}

func (noopLogSink) Info(msg string, attrs ...any)             {}
func (noopLogSink) Warn(msg string, attrs ...any)             {}
func (noopLogSink) Error(msg string, err error, attrs ...any) {}

func modWithDeprecation(id string, deprecation *types.Deprecation) types.ModManifest {
	return types.ModManifest{
		AssetManifest: types.AssetManifest{
			ID:          id,
			Deprecation: deprecation,
		},
	}
}

// Deprecated listings are published by the registry pipeline with zero
// complete integrity versions, but must remain loadable (behind the Deprecated
// facet) so their history and attribution stay browsable. Non-deprecated
// listings without a complete version stay hidden (delisted).
func TestFilterManifestsByIntegrityKeepsDeprecated(t *testing.T) {
	deprecation := &types.Deprecation{Since: "2026-08-01T00:00:00Z", ByGithubID: 1}
	deletion := &types.Deprecation{Since: "2026-08-01T00:00:00Z", ByGithubID: 1, Deleted: true}
	manifests := []types.ModManifest{
		modWithDeprecation("active-mod", nil),
		modWithDeprecation("deprecated-mod", deprecation),
		modWithDeprecation("deleted-mod", deletion),
		modWithDeprecation("delisted-mod", nil),
		modWithDeprecation("unlisted-mod", deprecation),
	}
	listings := map[string]types.IntegrityListing{
		"active-mod":     {HasCompleteVersion: true},
		"deprecated-mod": {HasCompleteVersion: false},
		// Deleted implies deprecated: retained on the same rule.
		"deleted-mod":  {HasCompleteVersion: false},
		"delisted-mod": {HasCompleteVersion: false},
		// unlisted-mod has no integrity listing at all: dropped even when deprecated.
	}

	filtered := filterManifestsByIntegrity(
		manifests,
		listings,
		func(item types.ModManifest) types.AssetManifest { return item.AssetManifest },
		types.AssetTypeMod,
		noopLogSink{},
	)

	ids := make([]string, 0, len(filtered))
	for _, item := range filtered {
		ids = append(ids, item.ID)
	}
	want := []string{"active-mod", "deprecated-mod", "deleted-mod"}
	if len(ids) != len(want) {
		t.Fatalf("filtered ids = %v, want %v", ids, want)
	}
	for i, id := range want {
		if ids[i] != id {
			t.Fatalf("filtered ids = %v, want %v", ids, want)
		}
	}
}
