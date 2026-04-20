package files

import (
	"fmt"
	"strings"

	"railyard/internal/types"
)

// NormalizeArchiveEntryPath normalizes a ZIP entry path and reports whether it contains a usable value.
func NormalizeArchiveEntryPath(entryName string) (string, bool) {
	normalized := strings.ReplaceAll(entryName, "\\", "/")
	if normalized == "" {
		return "", false
	}

	trimmed := strings.TrimSuffix(normalized, "/")
	if trimmed == "" {
		return "", false
	}

	return trimmed, true
}

// ArchiveEntryParts normalizes a ZIP entry path and splits it into path segments.
func ArchiveEntryParts(entryName string) (string, []string, bool) {
	normalized, ok := NormalizeArchiveEntryPath(entryName)
	if !ok {
		return "", nil, false
	}

	return normalized, strings.Split(normalized, "/"), true
}

// HasInvalidArchivePathSegments reports whether a normalized archive path contains unsafe segments.
func HasInvalidArchivePathSegments(parts []string) bool {
	for _, part := range parts {
		if part == "" || part == "." || part == ".." {
			return true
		}
	}

	return false
}

func hasArchivePathPrefix(normalized string) bool {
	return strings.HasPrefix(normalized, "/")
}

func pathSegmentIndex(parts []string, target string) int {
	for i, part := range parts {
		if part == target {
			return i
		}
	}

	return -1
}

// SharedAssetPayloadDir returns the shared helper-folder name for an asset type.
func SharedAssetPayloadDir(assetType types.AssetType) string {
	switch assetType {
	case types.AssetTypeMap:
		return ".railyard_map"
	case types.AssetTypeMod:
		return ".railyard_mod"
	default:
		panic("unsupported asset type for shared payload dir: " + string(assetType))
	}
}

// SharedAssetPayloadRelativePath validates a shared helper-folder entry and returns its relative path.
func SharedAssetPayloadRelativePath(assetType types.AssetType, entryName string) (string, bool, error) {
	payloadDir := SharedAssetPayloadDir(assetType)
	// ZIP paths are slash-separated by convention, but some Windows tools emit
	// backslashes; normalize before applying archive-path policy.
	normalized, parts, ok := ArchiveEntryParts(entryName)
	if !ok {
		return "", false, nil
	}

	payloadIndex := pathSegmentIndex(parts, payloadDir)
	if hasArchivePathPrefix(normalized) {
		// Absolute archive paths are not valid shared payload entries. If the
		// payload folder appears there, fail the archive instead of ignoring it.
		if payloadIndex >= 0 {
			return "", true, fmt.Errorf("shared payload entry %q must not be absolute", entryName)
		}
		return "", false, nil
	}

	if HasInvalidArchivePathSegments(parts) {
		// Traversal-like entries are only this helper's concern when they target
		// the shared payload folder; other archive validation remains separate.
		if payloadIndex >= 0 {
			return "", true, fmt.Errorf("shared payload entry %q contains an invalid path segment", entryName)
		}
		return "", false, nil
	}

	if payloadIndex < 0 {
		return "", false, nil
	}
	if payloadIndex != 0 {
		// v1 intentionally supports only a root-level .railyard_<asset> folder so
		// consumers have one stable, discoverable path to probe.
		return "", true, fmt.Errorf("shared payload directory %q must be at archive root", payloadDir)
	}

	if len(parts) == 1 {
		return "", true, nil
	}

	return strings.Join(parts[1:], "/"), true, nil
}
