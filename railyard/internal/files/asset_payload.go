package files

import (
	"fmt"
	"strings"

	"railyard/internal/types"
)

// ReservedAssetPayloadDir returns the reserved helper-folder name for an asset type.
func ReservedAssetPayloadDir(assetType types.AssetType) string {
	switch assetType {
	case types.AssetTypeMap:
		return ".railyard_map"
	case types.AssetTypeMod:
		return ".railyard_mod"
	default:
		panic("unsupported asset type for reserved payload dir: " + string(assetType))
	}
}

// ReservedAssetPayloadRelativePath validates a reserved helper-folder entry and returns its relative path.
func ReservedAssetPayloadRelativePath(assetType types.AssetType, entryName string) (string, bool, error) {
	reservedDir := ReservedAssetPayloadDir(assetType)
	normalized := strings.ReplaceAll(entryName, "\\", "/")
	if normalized == "" {
		return "", false, nil
	}

	if strings.HasPrefix(normalized, "/") {
		if strings.Contains(normalized, reservedDir) {
			return "", true, fmt.Errorf("reserved payload entry %q must not be absolute", entryName)
		}
		return "", false, nil
	}

	trimmed := strings.TrimSuffix(normalized, "/")
	if trimmed == "" {
		return "", false, nil
	}

	parts := strings.Split(trimmed, "/")
	hasReservedDir := false
	for i, part := range parts {
		if part == "" || part == "." || part == ".." {
			if hasReservedDir || strings.Contains(normalized, reservedDir) {
				return "", true, fmt.Errorf("reserved payload entry %q contains an invalid path segment", entryName)
			}
			return "", false, nil
		}
		if part != reservedDir {
			continue
		}
		hasReservedDir = true
		if i != 0 {
			return "", true, fmt.Errorf("reserved payload directory %q must be at archive root", reservedDir)
		}
	}

	if !hasReservedDir {
		return "", false, nil
	}

	if len(parts) == 1 {
		return "", true, nil
	}

	return strings.Join(parts[1:], "/"), true, nil
}
