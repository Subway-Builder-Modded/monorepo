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

func TestProjection(t *testing.T) {
	// One tile spans the full canvas height when scale = pixels per tile.
	proj := projection{originX: 5, originY: 3, scale: float64(thumbnailHeight)}
	x, y := proj.project(5, 3, 0, 0)
	require.InDelta(t, 0.0, x, 1e-9)
	require.InDelta(t, 0.0, y, 1e-9)
	x, y = proj.project(5, 3, mvtExtent, mvtExtent)
	require.InDelta(t, float64(thumbnailHeight), x, 1e-9)
	require.InDelta(t, float64(thumbnailHeight), y, 1e-9)

	// Fractional origins shift the output; neighbouring tiles continue seamlessly.
	proj = projection{originX: 5.5, originY: 3, scale: 100}
	x, y = proj.project(6, 4, 0, 0)
	require.InDelta(t, 50.0, x, 1e-9)
	require.InDelta(t, 100.0, y, 1e-9)
}

func TestLonLatToFractionalTile(t *testing.T) {
	require.InDelta(t, 0.5, lon2tileF(0, 0), 1e-9)
	require.InDelta(t, 0.5, lat2tileF(0, 0), 1e-9)
	require.InDelta(t, 2.0, lon2tileF(0, 2), 1e-9)
}

func TestLonLatToTileAtZoomZero(t *testing.T) {
	require.Equal(t, 0, lon2tile(0, 0))
	require.Equal(t, 0, lat2tile(0, 0))
}

func TestBuildLineStringPath(t *testing.T) {
	proj := projection{scale: mvtExtent}
	path := buildLineStringPath(&proj, 0, 0, orb.LineString{
		orb.Point{1, 2},
		orb.Point{3, 4},
	})
	require.Equal(t, "M 1.000000 2.000000 L 3.000000 4.000000", path)
	require.Equal(t, "", buildLineStringPath(&proj, 0, 0, nil))
}

func TestBuildRingPath(t *testing.T) {
	proj := projection{scale: mvtExtent}
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

func TestResolveThumbnailFrame(t *testing.T) {
	thumbBbox := [4]float64{24.086076, 56.884742, 24.16834, 56.929961}

	// A non-zero view state wins over the thumbnail bbox and fills the fixed 16:9 canvas,
	// centered on the view state.
	frame := resolveThumbnailFrame(types.ConfigData{
		ThumbnailBbox:    &thumbBbox,
		InitialViewState: types.InitialViewState{Latitude: 56.907352, Longitude: 24.127208, Zoom: 12},
	}, 12)
	require.NotNil(t, frame)
	require.Equal(t, thumbnailWidth, frame.width)
	require.Equal(t, thumbnailHeight, frame.height)
	require.InDelta(t, float64(thumbnailWidth)/float64(thumbnailHeight), frame.spanX/frame.spanY, 1e-9)
	require.InDelta(t, lon2tileF(24.127208, 12), frame.originX+frame.spanX/2, 1e-9)
	require.InDelta(t, lat2tileF(56.907352, 12), frame.originY+frame.spanY/2, 1e-9)

	// An explicit thumbnail bbox is framed exactly: its aspect dictates the canvas,
	// fit within the full 1920x1080.
	frame = resolveThumbnailFrame(types.ConfigData{ThumbnailBbox: &thumbBbox}, 12)
	require.NotNil(t, frame)
	require.InDelta(t, lon2tileF(thumbBbox[0], 12), frame.originX, 1e-9)
	require.InDelta(t, lat2tileF(thumbBbox[3], 12), frame.originY, 1e-9)
	require.InDelta(t, frame.spanX/frame.spanY, float64(frame.width)/float64(frame.height), 1e-2)
	require.True(t, frame.width <= thumbnailWidth && frame.height <= thumbnailHeight)
	require.True(t, frame.width == thumbnailWidth || frame.height == thumbnailHeight)

	require.Nil(t, resolveThumbnailFrame(types.ConfigData{}, 12))
	// The full map bbox is never a thumbnail source.
	require.Nil(t, resolveThumbnailFrame(types.ConfigData{Bbox: &thumbBbox}, 12))
}

func TestThumbnailPaletteDerivedFromMapColors(t *testing.T) {
	require.Equal(t, "240,241,245", hexToRGBTriple("#f0f1f5"))
	// Park displayed color = MAP_COLORS park at the game's 0.8 fill opacity over land.
	require.Equal(t, "184,221,192", blendHexOverRGB("#A9D8B6", thumbnailBackgroundRGB, 0.8))
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
	require.Contains(t, svgText, `width="1920"`)
	require.Contains(t, svgText, `height="1080"`)
}

func TestRenderPolygonWithHoleUsesSinglePathEvenOdd(t *testing.T) {
	var output strings.Builder
	canvas := svg.New(&output)
	canvas.Start(20, 20)
	proj := projection{scale: mvtExtent}
	outer := orb.Ring{orb.Point{0, 0}, orb.Point{10, 0}, orb.Point{10, 10}, orb.Point{0, 10}}
	hole := orb.Ring{orb.Point{4, 4}, orb.Point{6, 4}, orb.Point{6, 6}, orb.Point{4, 6}}
	renderGeometry(canvas, &proj, 0, 0, orb.Polygon{outer, hole}, "1,2,3")
	canvas.End()

	out := output.String()
	require.Equal(t, 1, strings.Count(out, "<path"))
	require.Contains(t, out, "fill-rule:evenodd")
	require.Equal(t, 2, strings.Count(out, "Z"))
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
