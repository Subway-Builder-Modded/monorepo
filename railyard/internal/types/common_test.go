package types

import (
	"bytes"
	"io"
	"net/http"
	"testing"

	semver "github.com/Masterminds/semver/v3"
	"github.com/stretchr/testify/require"
)

func TestParseSemver(t *testing.T) {
	v, err := ParseSemver("v1.3.0")
	require.NoError(t, err)
	require.Equal(t, "1.3.0", v.String(), "tolerates a v prefix")

	_, err = ParseSemver("not-a-version")
	require.Error(t, err)
}

func TestIsSemverNewer(t *testing.T) {
	newer, err := IsSemverNewer("2.0.0", "1.0.0")
	require.NoError(t, err)
	require.True(t, newer)

	same, err := IsSemverNewer("1.0.0", "1.0.0")
	require.NoError(t, err)
	require.False(t, same, "same version is not newer")

	older, err := IsSemverNewer("1.0.0", "2.0.0")
	require.NoError(t, err)
	require.False(t, older)

	prefixed, err := IsSemverNewer("v2.0.0", "1.0.0")
	require.NoError(t, err)
	require.True(t, prefixed, "tolerates a v prefix")

	_, err = IsSemverNewer("bad", "1.0.0")
	require.Error(t, err)
}

func TestSemverSatisfiesConstraint(t *testing.T) {
	gameVersion := semver.MustParse("1.3.0")

	ok, err := SemverSatisfiesConstraint(gameVersion, "")
	require.NoError(t, err)
	require.True(t, ok, "empty range imposes no requirement")

	ok, err = SemverSatisfiesConstraint(gameVersion, ">=1.0.0")
	require.NoError(t, err)
	require.True(t, ok)

	ok, err = SemverSatisfiesConstraint(gameVersion, ">=1.4.0")
	require.NoError(t, err)
	require.False(t, ok)

	// A malformed range is treated as satisfied, but surfaces the parse error.
	ok, err = SemverSatisfiesConstraint(gameVersion, "not-a-range")
	require.Error(t, err)
	require.True(t, ok)
}

func TestDescribeConstraint(t *testing.T) {
	// >= includes the boundary
	require.Equal(t,
		"Game version: needs 1.3.0 or newer (you have 1.2.0)",
		DescribeConstraint(InstalledConstraint{Type: ConstraintTypeManifest, Range: ">=1.3.0"}, "1.2.0"))
	// > excludes the boundary (binary buildings index)
	require.Equal(t,
		"Buildings format: needs newer than 1.3.0 (you have 1.2.0)",
		DescribeConstraint(InstalledConstraint{Type: ConstraintTypeBuildingsIndex, Range: ">1.3.0"}, "1.2.0"))
	// <= includes the boundary (legacy buildings index)
	require.Equal(t,
		"Buildings format: needs 1.3.0 or older (you have 1.4.0)",
		DescribeConstraint(InstalledConstraint{Type: ConstraintTypeBuildingsIndex, Range: "<=1.3.0"}, "1.4.0"))
	// compound range → left raw
	require.Equal(t,
		"Game version: needs >=1.0.0 <2.0.0 (you have 0.9.0)",
		DescribeConstraint(InstalledConstraint{Type: ConstraintTypeManifest, Range: ">=1.0.0 <2.0.0"}, "0.9.0"))
}

func TestDescribeIncompatibility(t *testing.T) {
	gameVersion := semver.MustParse("1.2.0")
	constraints := []InstalledConstraint{
		{Type: ConstraintTypeManifest, Range: ">=1.3.0"},
		{Type: ConstraintTypeBuildingsIndex, Range: ">1.3.0"},
	}
	// Buildings-index first, joined under the shared base sentence.
	require.Equal(t,
		IncompatibleGameVersionMessage+". Buildings format: needs newer than 1.3.0 (you have 1.2.0); Game version: needs 1.3.0 or newer (you have 1.2.0)",
		DescribeIncompatibility(gameVersion, constraints))

	// Empty when fully compatible.
	require.Equal(t, "", DescribeIncompatibility(semver.MustParse("2.0.0"), constraints))
}

func TestUnsatisfiedConstraints(t *testing.T) {
	gameVersion := semver.MustParse("1.2.0")

	failing := UnsatisfiedConstraints(gameVersion, []InstalledConstraint{
		{Type: ConstraintTypeManifest, Range: ">=1.3.0"},      // fails
		{Type: ConstraintTypeBuildingsIndex, Range: ">1.0.0"}, // satisfied
	})
	require.Len(t, failing, 1)
	require.Equal(t, ConstraintTypeManifest, failing[0].Type)

	// When both fail, buildings_index is ordered first.
	both := []InstalledConstraint{
		{Type: ConstraintTypeManifest, Range: ">=1.3.0"},
		{Type: ConstraintTypeBuildingsIndex, Range: ">1.3.0"},
	}
	failingBoth := UnsatisfiedConstraints(gameVersion, both)
	require.Len(t, failingBoth, 2)
	require.Equal(t, ConstraintTypeBuildingsIndex, failingBoth[0].Type)

	// Fully compatible game version yields nothing.
	require.Empty(t, UnsatisfiedConstraints(semver.MustParse("2.0.0"), both))
}

func TestConstraintsSatisfied(t *testing.T) {
	constraints := []InstalledConstraint{
		{Type: ConstraintTypeManifest, Range: ">=1.3.0"},
		{Type: ConstraintTypeBuildingsIndex, Range: ">1.3.0"},
	}
	require.True(t, ConstraintsSatisfied(semver.MustParse("1.4.0"), constraints))
	require.False(t, ConstraintsSatisfied(semver.MustParse("1.2.0"), constraints))
	// No constraints is trivially compatible.
	require.True(t, ConstraintsSatisfied(semver.MustParse("1.0.0"), nil))
}

func TestIsValidAssetType(t *testing.T) {
	require.True(t, IsValidAssetType(AssetTypeMap))
	require.True(t, IsValidAssetType(AssetTypeMod))
	require.False(t, IsValidAssetType(AssetType("unknown")))
}

func TestIsValidSemverVersion(t *testing.T) {
	require.True(t, IsValidSemverVersion(Version("1.2.3")))
	require.True(t, IsValidSemverVersion(Version("v1.2.3")))
	require.True(t, IsValidSemverVersion(Version(" 1.2.3 ")))

	require.False(t, IsValidSemverVersion(Version("1.2")))
	require.False(t, IsValidSemverVersion(Version("1.2.3.4")))
	require.False(t, IsValidSemverVersion(Version("1.2.3-beta.1")))
	require.False(t, IsValidSemverVersion(Version("1.2.3+build.9")))
	require.False(t, IsValidSemverVersion(Version("not-semver")))
	require.False(t, IsValidSemverVersion(Version("")))
}

func TestResponseHelpers(t *testing.T) {
	errResp := ErrorResponse("bad")
	require.Equal(t, ResponseError, errResp.Status)
	require.Equal(t, "bad", errResp.Message)

	successResp := SuccessResponse("ok")
	require.Equal(t, ResponseSuccess, successResp.Status)
	require.Equal(t, "ok", successResp.Message)

	warnResp := WarnResponse("warn")
	require.Equal(t, ResponseWarn, warnResp.Status)
	require.Equal(t, "warn", warnResp.Message)
}

func TestAutoPurgeDownloadErrors(t *testing.T) {
	require.True(t, AutoPurgeDownloadErrors(InstallErrorInvalidManifest))
	require.True(t, AutoPurgeDownloadErrors(InstallErrorInvalidArchive))
	require.True(t, AutoPurgeDownloadErrors(InstallErrorChecksumFailed))
	require.True(t, AutoPurgeDownloadErrors(InstallErrorVersionNotFound))
	require.False(t, AutoPurgeDownloadErrors(InstallErrorVersionLookup))

	// Confirmed incompatibility purges; an undetectable version does not (it is an
	// unknown — blocked but preserved for retry once detection works).
	require.True(t, AutoPurgeDownloadErrors(InstallErrorIncompatibleGameVersion))
	require.False(t, AutoPurgeDownloadErrors(InstallErrorGameVersionUndetectable))
}

func TestAssetTypeDir(t *testing.T) {
	require.Equal(t, "maps", AssetTypeDir(AssetTypeMap))
	require.Equal(t, "mods", AssetTypeDir(AssetTypeMod))
	require.Panics(t, func() {
		_ = AssetTypeDir(AssetType("unknown"))
	})
}

func TestCustomErrorTypes(t *testing.T) {
	missing := (&MissingFilesError{Files: []string{"a", "b"}}).Error()
	require.Contains(t, missing, "Missing required files:")
	require.Contains(t, missing, "a, b")

	conflict := (&MapAlreadyExistsError{MapCode: "ABC"}).Error()
	require.Contains(t, conflict, "ABC")
}

func TestProgressReader(t *testing.T) {
	payload := []byte("abcdef")
	progressCalls := 0
	var lastReceived int64
	var lastTotal int64

	reader := &ProgressReader{
		Reader: bytes.NewReader(payload),
		Total:  int64(len(payload)),
		ItemId: "asset-1",
		OnProgress: func(_ string, received int64, total int64) {
			progressCalls++
			lastReceived = received
			lastTotal = total
		},
	}

	out, err := io.ReadAll(reader)
	require.NoError(t, err)
	require.Equal(t, payload, out)
	require.GreaterOrEqual(t, progressCalls, 1)
	require.Equal(t, int64(len(payload)), lastReceived)
	require.Equal(t, int64(len(payload)), lastTotal)
}

func TestLocalMapCodePattern(t *testing.T) {
	// Valid: 2-4 chars, first two uppercase alpha, digits only as trailing suffix
	require.True(t, LocalMapCodePattern.MatchString("AB"))
	require.True(t, LocalMapCodePattern.MatchString("ABC"))
	require.True(t, LocalMapCodePattern.MatchString("ABCD"))
	require.True(t, LocalMapCodePattern.MatchString("AB1"))
	require.True(t, LocalMapCodePattern.MatchString("AB12"))
	require.True(t, LocalMapCodePattern.MatchString("ABC1"))
	// Invalid
	require.False(t, LocalMapCodePattern.MatchString("A"))
	require.False(t, LocalMapCodePattern.MatchString("ABCDE"))
	require.False(t, LocalMapCodePattern.MatchString("AbC"))
	require.False(t, LocalMapCodePattern.MatchString("abc"))
	require.False(t, LocalMapCodePattern.MatchString("A1"))
	require.False(t, LocalMapCodePattern.MatchString("A1B"))
	require.False(t, LocalMapCodePattern.MatchString("AB1C"))
	require.False(t, LocalMapCodePattern.MatchString(" AB"))
	require.False(t, LocalMapCodePattern.MatchString("AB "))
}

func TestNormalizeSemver(t *testing.T) {
	require.Equal(t, "v1.2.3", NormalizeSemver("1.2.3"))
	require.Equal(t, "v1.2.3", NormalizeSemver("v1.2.3"))
	require.Equal(t, "v1.2.3", NormalizeSemver(" 1.2.3 "))
	require.Equal(t, "", NormalizeSemver("   "))
}

func TestGetErrorTypeForStatus(t *testing.T) {
	require.Equal(t, RequestErrorUnauthorized, GetErrorTypeForStatus(http.StatusUnauthorized))
	require.Equal(t, RequestErrorForbidden, GetErrorTypeForStatus(http.StatusForbidden))
	require.Equal(t, RequestErrorTooMany, GetErrorTypeForStatus(http.StatusTooManyRequests))
	require.Contains(t, string(GetErrorTypeForStatus(http.StatusTeapot)), "418")
}

func TestGameVersionResponseDetectedVersion(t *testing.T) {
	detected, ok := GameVersionResponse{
		GenericResponse: SuccessResponse("ok"),
		Version:         "v1.4.11",
	}.DetectedVersion()
	require.True(t, ok)
	require.Equal(t, "1.4.11", detected.String())

	_, ok = GameVersionResponse{GenericResponse: WarnResponse("nope")}.DetectedVersion()
	require.False(t, ok)
	_, ok = GameVersionResponse{GenericResponse: SuccessResponse("ok")}.DetectedVersion()
	require.False(t, ok)
}
