package utils

import (
	"fmt"
	"io"
	"net/http"
	"net/url"
	"railyard/internal/testutil"
	"railyard/internal/types"
	"strings"
	"testing"
	"time"

	svg "github.com/ajstarks/svgo"
	"github.com/paulmach/orb"
	"github.com/paulmach/orb/geojson"
	"github.com/stretchr/testify/require"
)

func TestNewProjectionAndProject(t *testing.T) {
	proj := newProjection(0, 0, 0, 0)
	require.InDelta(t, 800.0/4096.0, proj.scale, 1e-9)
	require.InDelta(t, 0.0, proj.offsetX, 1e-9)
	require.InDelta(t, 0.0, proj.offsetY, 1e-9)

	x, y := proj.project(0, 0, 4096, 4096)
	require.InDelta(t, 800.0, x, 1e-9)
	require.InDelta(t, 800.0, y, 1e-9)
}

func TestLonLatToTileAtZoomZero(t *testing.T) {
	require.Equal(t, 0, lon2tile(0, 0))
	require.Equal(t, 0, lat2tile(0, 0))
}

func TestBuildLineStringPath(t *testing.T) {
	proj := projection{scale: 1}
	path := buildLineStringPath(&proj, 0, 0, orb.LineString{
		orb.Point{1, 2},
		orb.Point{3, 4},
	})
	require.Equal(t, "M 1.000000 2.000000 L 3.000000 4.000000", path)
	require.Equal(t, "", buildLineStringPath(&proj, 0, 0, nil))
}

func TestBuildRingPath(t *testing.T) {
	proj := projection{scale: 1}
	path := buildRingPath(&proj, 0, 0, orb.Ring{
		orb.Point{0, 0},
		orb.Point{2, 0},
		orb.Point{2, 2},
	})
	require.True(t, strings.HasSuffix(path, " Z"))
	require.Equal(t, "", buildRingPath(&proj, 0, 0, nil))
}

func TestFetchWithRetrySuccessAfterRetries(t *testing.T) {
	var calls int
	server := testutil.NewLocalhostServer(t, http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		calls++
		if calls < 3 {
			w.WriteHeader(http.StatusBadGateway)
			_, _ = io.WriteString(w, "retry")
			return
		}
		_, _ = io.WriteString(w, "ok")
	}))
	defer server.Close()

	body, err := fetchWithRetry(server.URL, 3, time.Millisecond)
	require.NoError(t, err)
	require.Equal(t, []byte("ok"), body)
	require.Equal(t, 3, calls)
}

func TestFetchWithRetryFailure(t *testing.T) {
	server := testutil.NewLocalhostServer(t, http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusBadGateway)
		_, _ = io.WriteString(w, "nope")
	}))
	defer server.Close()

	_, err := fetchWithRetry(server.URL, 2, time.Millisecond)
	require.Error(t, err)
	require.Contains(t, err.Error(), "after 2 attempts")
}

func TestCanGenerateThumbnail(t *testing.T) {
	bbox := [4]float64{0, 0, 1, 1}
	require.False(t, CanGenerateThumbnail(types.ConfigData{}))
	require.True(t, CanGenerateThumbnail(types.ConfigData{ThumbnailBbox: &bbox}))
	require.True(t, CanGenerateThumbnail(types.ConfigData{
		InitialViewState: types.InitialViewState{Latitude: 35.0, Longitude: 135.0},
	}))
	// The full map bbox is never a thumbnail source.
	require.False(t, CanGenerateThumbnail(types.ConfigData{Bbox: &bbox}))
}

func TestResolveThumbnailBbox(t *testing.T) {
	thumbBbox := [4]float64{1, 2, 3, 4}

	// A non-zero view state wins over the thumbnail bbox; span comes from its zoom.
	resolved := resolveThumbnailBbox(types.ConfigData{
		ThumbnailBbox:    &thumbBbox,
		InitialViewState: types.InitialViewState{Latitude: 35.0, Longitude: 135.0, Zoom: 10},
	})
	require.NotNil(t, resolved)
	lngSpan := 360.0 / 1024.0
	latSpan := 180.0 / 1024.0
	require.InDelta(t, 135.0-lngSpan, resolved[0], 1e-9)
	require.InDelta(t, 35.0-latSpan, resolved[1], 1e-9)
	require.InDelta(t, 135.0+lngSpan, resolved[2], 1e-9)
	require.InDelta(t, 35.0+latSpan, resolved[3], 1e-9)

	// An unset zoom defaults to 12 for the span derivation.
	resolved = resolveThumbnailBbox(types.ConfigData{
		InitialViewState: types.InitialViewState{Latitude: 35.0, Longitude: 135.0},
	})
	require.NotNil(t, resolved)
	require.InDelta(t, 135.0-360.0/4096.0, resolved[0], 1e-9)

	// Without a view state the thumbnail bbox is used verbatim.
	resolved = resolveThumbnailBbox(types.ConfigData{ThumbnailBbox: &thumbBbox})
	require.Equal(t, &thumbBbox, resolved)

	require.Nil(t, resolveThumbnailBbox(types.ConfigData{}))
}

func TestGenerateThumbnailErrorsWhenNoBoundsOrViewState(t *testing.T) {
	cityConfig := types.ConfigData{}

	_, err := GenerateThumbnail("TEST", cityConfig, 1234)
	require.Error(t, err)
	require.Contains(t, err.Error(), "no initial view state or thumbnail bbox")
}

func TestGenerateThumbnailReturnsSVGWhenTilesUnavailableOrInvalid(t *testing.T) {
	server := testutil.NewLocalhostServer(t, http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = io.WriteString(w, "not-a-valid-mvt")
	}))
	defer server.Close()

	u, err := url.Parse(server.URL)
	require.NoError(t, err)

	var port int
	_, scanErr := fmt.Sscanf(u.Host, "127.0.0.1:%d", &port)
	require.NoError(t, scanErr)

	bbox := [4]float64{0, 0, 0, 0}
	cityConfig := types.ConfigData{ThumbnailBbox: &bbox}

	svgText, err := GenerateThumbnail("TEST", cityConfig, port)
	require.NoError(t, err)
	require.Contains(t, svgText, "<svg")
}

func TestRenderGeometryHandlesKnownTypes(t *testing.T) {
	var output strings.Builder
	canvas := svg.New(&output)
	canvas.Start(20, 20)
	proj := projection{scale: 1}

	renderGeometry(canvas, &proj, 0, 0, orb.Point{1, 1}, "1,2,3")
	renderGeometry(canvas, &proj, 0, 0, orb.LineString{orb.Point{0, 0}, orb.Point{1, 1}}, "1,2,3")
	renderGeometry(canvas, &proj, 0, 0, orb.Polygon{orb.Ring{orb.Point{0, 0}, orb.Point{1, 0}, orb.Point{1, 1}}}, "1,2,3")
	renderGeometry(canvas, &proj, 0, 0, orb.MultiPoint{orb.Point{2, 2}}, "1,2,3")
	renderGeometry(canvas, &proj, 0, 0, orb.MultiLineString{orb.LineString{orb.Point{0, 1}, orb.Point{1, 2}}}, "1,2,3")
	renderGeometry(canvas, &proj, 0, 0, orb.MultiPolygon{orb.Polygon{orb.Ring{orb.Point{0, 0}, orb.Point{1, 0}, orb.Point{1, 1}}}}, "1,2,3")

	canvas.End()
	require.Contains(t, output.String(), "<path")
	require.Contains(t, output.String(), "rgb(1,2,3)")
}

func TestThumbnailLayerStyleIncludes(t *testing.T) {
	park := geojson.NewFeature(orb.Point{})
	park.Properties = geojson.Properties{"kind": "park"}
	residential := geojson.NewFeature(orb.Point{})
	residential.Properties = geojson.Properties{"kind": "residential"}
	noKind := geojson.NewFeature(orb.Point{})

	// No Kinds filter selects every feature in the layer.
	all := thumbnailLayerStyle{Layer: "water"}
	require.True(t, all.includes(park))
	require.True(t, all.includes(noKind))

	parksOnly := thumbnailLayerStyle{Layer: "landuse", Kinds: []string{"park"}}
	require.True(t, parksOnly.includes(park))
	require.False(t, parksOnly.includes(residential))
	require.False(t, parksOnly.includes(noKind))
}
