package types

import (
	"io"
	"net/http"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"time"

	semver "github.com/Masterminds/semver/v3"
)

type Status string

const (
	ResponseSuccess Status = "success"
	ResponseError   Status = "error"
	ResponseWarn    Status = "warn"
)

const RequestTimeout = 15 * time.Second
const RequestUserAgent = "Railyard-Desktop-App"
const GitHubAPIBaseURL = "https://api.github.com"

type GenericResponse struct {
	Status  Status `json:"status"`
	Message string `json:"message"`
}

type DownloadTempResponse struct {
	GenericResponse
	Path string `json:"path,omitempty"`
}

type AssetConflict struct {
	ExistingAssetID   string    `json:"existingAssetId"`
	ExistingAssetType AssetType `json:"existingAssetType"`
	ExistingVersion   string    `json:"existingVersion"`
	ExistingIsLocal   bool      `json:"existingIsLocal"`
}

type MapCodeConflict struct {
	AssetConflict
	CityCode string `json:"cityCode"`
}

type DownloaderErrorType string

const (
	InstallErrorInvalidConfig              DownloaderErrorType = "install_invalid_config"
	InstallErrorInvalidMapCode             DownloaderErrorType = "install_invalid_map_code"
	InstallErrorRegistryLookup             DownloaderErrorType = "install_registry_lookup_failed"
	InstallErrorVersionLookup              DownloaderErrorType = "install_version_lookup_failed"
	InstallErrorVersionNotFound            DownloaderErrorType = "install_version_not_found"
	InstallErrorDownloadFailed             DownloaderErrorType = "install_download_failed"
	InstallErrorChecksumFailed             DownloaderErrorType = "install_checksum_failed"
	InstallErrorExtractFailed              DownloaderErrorType = "install_extract_failed"
	InstallErrorInvalidManifest            DownloaderErrorType = "install_invalid_manifest"
	InstallErrorInvalidArchive             DownloaderErrorType = "install_invalid_archive"
	InstallErrorMapCodeConflict            DownloaderErrorType = "install_map_code_conflict"
	InstallErrorFilesystem                 DownloaderErrorType = "install_filesystem_error"
	InstallErrorPersistStateFailed         DownloaderErrorType = "install_persist_state_failed"
	InstallErrorDependencyResolutionFailed DownloaderErrorType = "install_dependency_resolution_failed"
	InstallErrorIncompatibleGameVersion    DownloaderErrorType = "install_incompatible_game_version"
	InstallErrorGameVersionUndetectable    DownloaderErrorType = "install_game_version_undetectable"
	UninstallErrorNotInstalled             DownloaderErrorType = "uninstall_not_installed"
	UninstallErrorFilesystem               DownloaderErrorType = "uninstall_filesystem_error"
	UninstallErrorPersistState             DownloaderErrorType = "uninstall_persist_state_failed"
)

type RequestErrorType string

const (
	RequestErrorTooMany      RequestErrorType = "You are being rate limited. You may benefit from setting a GitHub token, as shown $HERE."
	RequestErrorUnauthorized RequestErrorType = "GitHub indicated an authorization error. Your GitHub token may be invalid or lack necessary permissions."
	RequestErrorForbidden    RequestErrorType = "GitHub indicated a permission error. Your GitHub token may be invalid or lack necessary permissions."
)

func GetErrorTypeForStatus(statusCode int) RequestErrorType {
	switch statusCode {
	case http.StatusUnauthorized:
		return RequestErrorUnauthorized
	case http.StatusForbidden:
		return RequestErrorForbidden
	case http.StatusTooManyRequests:
		return RequestErrorTooMany
	default:
		return RequestErrorType("GitHub request failed with status code " + strconv.Itoa(statusCode) + ".")
	}
}

// List of deterministic install errors that should trigger automatic purge of the subscription without user confirmation, as they indicate the subscription is invalid/corrupt and cannot be resolved through retries.
var autoPurgeDownloadErrorTypes = map[DownloaderErrorType]struct{}{
	InstallErrorInvalidManifest: {},
	InstallErrorInvalidArchive:  {},
	InstallErrorChecksumFailed:  {},
	// Error for a version removed from the installable set while the app is running; ReconcileSubscriptionVersions repairs the same condition before sync at startup.
	InstallErrorVersionNotFound: {},
	// Confirmed incompatibility (game detected, constraint violated): purge so the user is not saddled with an asset that silently never installs.
	InstallErrorIncompatibleGameVersion: {},
	// IMPORTANT: InstallErrorGameVersionUndetectable is deliberately NOT purged — an undetectable version (misconfigured exe, early startup) is an unknown, not an incompatibility verdict
	// In this case the install is blocked but the subscription is preserved for retry.
}

func AutoPurgeDownloadErrors(err DownloaderErrorType) bool {
	_, ok := autoPurgeDownloadErrorTypes[err]
	return ok
}

type AssetInstallResponse struct {
	GenericResponse
	AssetType       AssetType           `json:"assetType"`
	AssetID         string              `json:"assetId"`
	Version         string              `json:"version"`
	Config          ConfigData          `json:"config,omitempty"`
	ErrorType       DownloaderErrorType `json:"errorType,omitempty"`
	MapCodeConflict *MapCodeConflict    `json:"mapCodeConflict,omitempty"`
}

type DependencyListResponse struct {
	GenericResponse
	InstallList map[string]DependencyListEntry `json:"installList"` // List of mod IDs and numbers to install
}

type DependencyListEntry struct {
	Ranges           []string    `json:"ranges"`           // List of version ranges that require this dependency (e.g. [">=1.0.0 <2.0.0", ">=3.0.0 <4.0.0"])
	InstallCandidate VersionInfo `json:"installCandidate"` // The specific version that will be installed to satisfy this dependency, after range resolution
}

type MapInstallOptions struct {
	ReplaceOnConflict bool `json:"replaceOnConflict"`
}

// Reserved for mod-specific install options.
type ModInstallOptions struct {
	SkipDependencies bool `json:"skipDependencies,omitempty"`
}

type InstallAssetRequest struct {
	AssetType AssetType          `json:"assetType"`
	AssetID   string             `json:"assetId"`
	Version   string             `json:"version"`
	Map       *MapInstallOptions `json:"map,omitempty"`
	Mod       *ModInstallOptions `json:"mod,omitempty"`
}

type AssetUninstallResponse struct {
	GenericResponse
	AssetType AssetType           `json:"assetType"`
	AssetID   string              `json:"assetId"`
	ErrorType DownloaderErrorType `json:"errorType,omitempty"`
}

// errorResponse is a helper to create a consistent error response
func ErrorResponse(msg string) GenericResponse {
	return GenericResponse{
		Status:  ResponseError,
		Message: msg,
	}
}

// successResponse is a helper to create a consistent success response
func SuccessResponse(msg string) GenericResponse {
	return GenericResponse{
		Status:  ResponseSuccess,
		Message: msg,
	}
}

// warnResponse is a helper to create a consistent warning response
func WarnResponse(msg string) GenericResponse {
	return GenericResponse{
		Status:  ResponseWarn,
		Message: msg,
	}
}

type AssetType string

const (
	AssetTypeMap AssetType = "map"
	AssetTypeMod AssetType = "mod"
)

var LocalMapCodePattern = regexp.MustCompile(`^[A-Z]{2}([A-Z]{0,2}|[A-Z][0-9]|[0-9]{1,2})$`)

func IsValidAssetType(assetType AssetType) bool {
	switch assetType {
	case AssetTypeMap, AssetTypeMod:
		return true
	default:
		return false
	}
}

func AssetTypeDir(assetType AssetType) string {
	switch assetType {
	case AssetTypeMap:
		return "maps"
	case AssetTypeMod:
		return "mods"
	}
	panic("unsupported asset type: " + string(assetType))
}

type Version string

func IsValidSemverVersion(version Version) bool {
	value := strings.TrimSpace(string(version))
	if value == "" {
		return false
	}
	if strings.ContainsAny(value, "-+") {
		return false
	}
	core := strings.TrimPrefix(value, "v")
	if _, err := semver.NewVersion(core); err != nil {
		return false
	}
	return strings.Count(core, ".") == 2
}

func NormalizeSemver(version string) string {
	trimmed := strings.TrimSpace(version)
	if trimmed == "" {
		return ""
	}
	if strings.HasPrefix(trimmed, "v") {
		return trimmed
	}
	return "v" + trimmed
}

// ParseSemver parses a version string, tolerating an optional "v" prefix.
func ParseSemver(version string) (*semver.Version, error) {
	return semver.NewVersion(strings.TrimPrefix(strings.TrimSpace(version), "v"))
}

// IsSemverNewer reports whether candidate is a strictly newer semver than current.
func IsSemverNewer(candidate, current string) (bool, error) {
	candidateVer, err := ParseSemver(candidate)
	if err != nil {
		return false, err
	}
	currentVer, err := ParseSemver(current)
	if err != nil {
		return false, err
	}
	return candidateVer.GreaterThan(currentVer), nil
}

// SemverSatisfiesConstraint reports whether version satisfies a semver range.
// An empty range imposes no requirement; a malformed range is treated as
// satisfied (the err is returned so callers may log it) so a bad constraint
// never hides an otherwise-valid result.
func SemverSatisfiesConstraint(version *semver.Version, rangeExpr string) (bool, error) {
	rangeExpr = strings.TrimSpace(rangeExpr)
	if rangeExpr == "" {
		return true, nil
	}
	constraint, err := semver.NewConstraint(strings.TrimPrefix(rangeExpr, "v"))
	if err != nil {
		return true, err
	}
	return constraint.Check(version), nil
}

// UnsatisfiedConstraints returns every constraint the game version fails, ordered
// with buildings_index (the more specific format requirement) first. Empty when the
// version is fully compatible. Shared by install gating, update filtering, and
// incompatibility messaging so all three judge compatibility the same way.
func UnsatisfiedConstraints(gameVersion *semver.Version, constraints []InstalledConstraint) []InstalledConstraint {
	failing := make([]InstalledConstraint, 0, len(constraints))
	for _, c := range constraints {
		// Malformed ranges are treated as satisfied (lenient); err is ignored here.
		if satisfied, _ := SemverSatisfiesConstraint(gameVersion, c.Range); !satisfied {
			failing = append(failing, c)
		}
	}
	sort.SliceStable(failing, func(i, _ int) bool {
		return failing[i].Type == ConstraintTypeBuildingsIndex
	})
	return failing
}

// DescribeConstraint phrases a failing constraint for the user, e.g.
// "Game version: needs 1.3.0 or newer (you have 1.2.0)".
func DescribeConstraint(c InstalledConstraint, gameVersion string) string {
	label := "Game version"
	if c.Type == ConstraintTypeBuildingsIndex {
		label = "Buildings format"
	}
	return label + ": needs " + humanizeSemverRange(c.Range) + " (you have " + gameVersion + ")"
}

// humanizeSemverRange turns a single-operator semver range into plain language,
// preserving boundary inclusivity (>= includes, > excludes). Compound or
// unrecognized ranges are returned unchanged.
func humanizeSemverRange(rangeExpr string) string {
	r := strings.TrimSpace(rangeExpr)
	// Two-char operators first so ">=" is not matched as ">".
	for _, o := range []struct{ op, prefix, suffix string }{
		{">=", "", " or newer"},
		{"<=", "", " or older"},
		{">", "newer than ", ""},
		{"<", "older than ", ""},
		{"=", "exactly ", ""},
	} {
		if strings.HasPrefix(r, o.op) {
			version := strings.TrimPrefix(strings.TrimSpace(strings.TrimPrefix(r, o.op)), "v")
			if version == "" || strings.ContainsAny(version, " ,|") {
				return rangeExpr // compound / empty → leave raw
			}
			return o.prefix + version + o.suffix
		}
	}
	return rangeExpr
}

// DetectedVersion returns the detected game version as parsed semver.
func (r GameVersionResponse) DetectedVersion() (*semver.Version, bool) {
	// No version detecteed
	if r.Status != ResponseSuccess || r.Version == "" {
		return nil, false
	}
	// Assume detected version is semver-compliant
	return semver.MustParse(strings.TrimPrefix(r.Version, "v")), true
}

// MissingFilesError is returned when required files are missing from an archive.
type MissingFilesError struct {
	Files []string
}

func (e *MissingFilesError) Error() string {
	return "Missing required files: " + joinStrings(e.Files, ", ")
}

// MapAlreadyExistsError is returned when a map code conflicts with an existing map.
type MapAlreadyExistsError struct {
	MapCode string
}

func (e *MapAlreadyExistsError) Error() string {
	return "Map with code '" + e.MapCode + "' has already been installed or would overwrite a vanilla map."
}

func joinStrings(s []string, sep string) string {
	result := ""
	for i, v := range s {
		if i > 0 {
			result += sep
		}
		result += v
	}
	return result
}

// ProgressFunc is a callback for reporting download progress.
// itemId identifies what is being downloaded, received is bytes downloaded so far, total is the total size (-1 if unknown).
type ProgressFunc func(itemId string, received int64, total int64)

// progressReader wraps an io.Reader to report download progress via a callback.
type ProgressReader struct {
	Reader     io.Reader
	Total      int64
	Received   int64
	ItemId     string
	OnProgress ProgressFunc
}

func (pr *ProgressReader) Read(p []byte) (int, error) {
	n, err := pr.Reader.Read(p)
	pr.Received += int64(n)
	if pr.OnProgress != nil {
		pr.OnProgress(pr.ItemId, pr.Received, pr.Total)
	}
	return n, err
}
