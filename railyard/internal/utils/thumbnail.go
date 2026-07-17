package utils

import (
	"bytes"
	"fmt"
	"io"
	"log"
	"math"
	"net/http"
	"slices"
	"strings"
	"time"

	"railyard/internal/constants"
	"railyard/internal/types"

	svg "github.com/ajstarks/svgo"
	"github.com/paulmach/orb"
	"github.com/paulmach/orb/encoding/mvt"
	"github.com/paulmach/orb/geojson"
)

// Thumbnails render at a fixed 1080p so the image aligns when the game fits it to the
// screen width on the map loading screen.
const (
	thumbnailWidth  = 1920
	thumbnailHeight = 1080
	mvtExtent       = 4096.0 // MVT tile coordinate extent
)

// projection maps fractional mercator tile coordinates onto the canvas: the region with
// origin (originX, originY) is drawn at a uniform scale of canvas pixels per tile.
type projection struct {
	originX, originY float64
	scale            float64
}

var thumbnailHTTPClient = &http.Client{Timeout: types.RequestTimeout}

func (p *projection) project(tileX, tileY int, pixelX, pixelY float64) (float64, float64) {
	return (float64(tileX) + pixelX/mvtExtent - p.originX) * p.scale,
		(float64(tileY) + pixelY/mvtExtent - p.originY) * p.scale
}

// lon2tileF/lat2tileF convert coordinates to fractional web-mercator tile positions.
func lon2tileF(lon float64, zoom int) float64 {
	return (lon + 180.0) / 360.0 * math.Pow(2, float64(zoom))
}

func lat2tileF(lat float64, zoom int) float64 {
	return (1.0 - math.Log(math.Tan(lat*math.Pi/180.0)+1.0/math.Cos(lat*math.Pi/180.0))/math.Pi) / 2.0 * math.Pow(2, float64(zoom))
}

func lon2tile(lon float64, zoom int) int {
	return int(math.Floor(lon2tileF(lon, zoom)))
}

func lat2tile(lat float64, zoom int) int {
	return int(math.Floor(lat2tileF(lat, zoom)))
}

func fetchWithRetry(url string, retries int, delay time.Duration) ([]byte, error) {
	var lastErr error
	for attempt := 1; attempt <= retries; attempt++ {
		resp, err := thumbnailHTTPClient.Get(url)
		if err != nil {
			lastErr = err
			time.Sleep(delay)
			delay *= 2
			continue
		}
		body, readErr := io.ReadAll(resp.Body)
		resp.Body.Close()
		if resp.StatusCode == http.StatusOK && readErr == nil {
			return body, nil
		}
		if readErr != nil {
			lastErr = readErr
		} else {
			lastErr = fmt.Errorf("HTTP %d for %s", resp.StatusCode, url)
		}
		time.Sleep(delay)
		delay *= 2
	}
	return nil, fmt.Errorf("failed to fetch %s after %d attempts: %w", url, retries, lastErr)
}

const defaultThumbnailZoom = 12

// thumbnailFrame is the mercator region a thumbnail renders and the canvas it fills.
type thumbnailFrame struct {
	originX, originY float64 // top-left corner in fractional tile coordinates
	spanX, spanY     float64 // region size in tiles
	width, height    int     // canvas size in pixels
}

// resolveThumbnailFrame picks what a thumbnail shows. A non-zero initial view state is
// preferred: a region around its center (span from its zoom, defaulting to
// defaultThumbnailZoom) expanded — never shrunk — to the full 16:9 canvas. Otherwise an
// explicit thumbnail bbox is framed exactly: its aspect dictates the canvas, fit within
// 1920x1080. Returns nil when neither is present. The full map bbox is never used — it can
// cover far too large an area.
func resolveThumbnailFrame(cityConfig types.ConfigData, zoom int) *thumbnailFrame {
	const fullAspect = float64(thumbnailWidth) / float64(thumbnailHeight)
	lat := cityConfig.InitialViewState.Latitude
	lng := cityConfig.InitialViewState.Longitude
	if lat != 0 || lng != 0 {
		viewZoom := cityConfig.InitialViewState.Zoom
		if viewZoom == 0 {
			viewZoom = defaultThumbnailZoom
		}
		// Approximate span based on zoom level
		latSpan := 180.0 / math.Pow(2, viewZoom)
		lngSpan := 360.0 / math.Pow(2, viewZoom)
		spanX := lon2tileF(lng+lngSpan, zoom) - lon2tileF(lng-lngSpan, zoom)
		spanY := lat2tileF(lat-latSpan, zoom) - lat2tileF(lat+latSpan, zoom)
		if spanX < spanY*fullAspect {
			spanX = spanY * fullAspect
		} else {
			spanY = spanX / fullAspect
		}
		cx, cy := lon2tileF(lng, zoom), lat2tileF(lat, zoom)
		return &thumbnailFrame{
			originX: cx - spanX/2, originY: cy - spanY/2,
			spanX: spanX, spanY: spanY,
			width: thumbnailWidth, height: thumbnailHeight,
		}
	}
	if cityConfig.ThumbnailBbox == nil {
		return nil
	}
	bbox := cityConfig.ThumbnailBbox
	x0, x1 := lon2tileF(bbox[0], zoom), lon2tileF(bbox[2], zoom)
	y0, y1 := lat2tileF(bbox[3], zoom), lat2tileF(bbox[1], zoom)
	spanX, spanY := x1-x0, y1-y0
	// Degenerate (point or line) bboxes fall back to a one-tile-high 16:9 view.
	if spanX <= 0 && spanY <= 0 {
		spanY = 1
	}
	if spanX <= 0 {
		spanX = spanY * fullAspect
	}
	if spanY <= 0 {
		spanY = spanX / fullAspect
	}
	width, height := thumbnailWidth, thumbnailHeight
	if aspect := spanX / spanY; aspect >= fullAspect {
		height = int(math.Round(thumbnailWidth / aspect))
	} else {
		width = int(math.Round(thumbnailHeight * aspect))
	}
	return &thumbnailFrame{originX: x0, originY: y0, spanX: spanX, spanY: spanY, width: width, height: height}
}

// CanGenerateThumbnail reports whether the config carries a view source a thumbnail can be
// derived from: a non-zero initial view state or a thumbnail bbox.
func CanGenerateThumbnail(cityConfig types.ConfigData) bool {
	return resolveThumbnailFrame(cityConfig, defaultThumbnailZoom) != nil
}

func GenerateThumbnail(cityCode string, cityConfig types.ConfigData, port int) (string, error) {
	zoom := int(cityConfig.InitialViewState.Zoom)
	if zoom == 0 {
		zoom = defaultThumbnailZoom
	}

	frame := resolveThumbnailFrame(cityConfig, zoom)
	if frame == nil {
		return "", fmt.Errorf("no initial view state or thumbnail bbox found for city %s", cityCode)
	}
	proj := projection{originX: frame.originX, originY: frame.originY, scale: float64(frame.height) / frame.spanY}

	minXTile, maxXTile := int(math.Floor(frame.originX)), int(math.Floor(frame.originX+frame.spanX))
	minYTile, maxYTile := int(math.Floor(frame.originY)), int(math.Floor(frame.originY+frame.spanY))

	type tileData struct {
		X, Y int
		Data []byte
	}
	var allTiles []tileData

	for x := minXTile; x <= maxXTile; x++ {
		for y := minYTile; y <= maxYTile; y++ {
			tileURL := fmt.Sprintf("http://127.0.0.1:%d/%s/%d/%d/%d.mvt", port, cityCode, zoom, x, y)
			buffer, err := fetchWithRetry(tileURL, 5, 200*time.Millisecond)
			if err != nil {
				log.Printf("Error fetching tile: %v\n", err)
				continue
			}
			allTiles = append(allTiles, tileData{X: x, Y: y, Data: buffer})
		}
	}

	var svgBuffer bytes.Buffer
	svgCanvas := svg.New(&svgBuffer)
	// Startview adds a viewBox so consumers that resize the image (e.g. the game fitting
	// it to the screen width) scale the drawing instead of cropping it.
	svgCanvas.Startview(frame.width, frame.height, 0, 0, frame.width, frame.height)
	svgCanvas.Rect(0, 0, frame.width, frame.height, "fill:rgb("+thumbnailBackgroundRGB+")")

	for _, tile := range allTiles {
		layers, err := mvt.Unmarshal(tile.Data)
		if err != nil {
			log.Printf("failed to parse tile data: %v\n", err)
			continue
		}

		for _, style := range thumbnailLayerStyles {
			for _, layer := range layers {
				if layer.Name != style.Layer {
					continue
				}
				for _, feature := range layer.Features {
					if !style.includes(feature) {
						continue
					}
					renderGeometry(svgCanvas, &proj, tile.X, tile.Y, feature.Geometry, style.RGB)
				}
			}
		}
	}

	svgCanvas.End()
	return svgBuffer.String(), nil
}

// thumbnailBackgroundRGB fills the canvas under the rendered layers, standing in for the
// game's light-mode land tone.
const thumbnailBackgroundRGB = "246,241,233"

// thumbnailLayerStyle selects tile features to draw and the RGB triple ("r,g,b") they are
// drawn with. An empty Kinds slice selects every feature in the layer; otherwise only
// features whose "kind" property matches.
type thumbnailLayerStyle struct {
	Layer string
	Kinds []string
	RGB   string
}

// thumbnailLayerStyles are the layers a thumbnail is composed of, rendered in order within
// each tile, so later entries draw on top. Park and aerodrome colors derive from the same
// MAP_COLORS the map-loader mod styles the game with (parks composite at 0.8 opacity
// there); water matches the game's light-mode base style.
var thumbnailLayerStyles = []thumbnailLayerStyle{
	{Layer: "landuse", Kinds: []string{"park"}, RGB: blendHexOverRGB(constants.MAP_COLORS["LIGHT"]["PARK"], thumbnailBackgroundRGB, 0.8)},
	{Layer: "landuse", Kinds: []string{"aerodrome"}, RGB: hexToRGBTriple(constants.MAP_COLORS["LIGHT"]["AIRPORT"])},
	{Layer: "water", RGB: "168,195,220"},
}

// hexToRGBTriple converts "#rrggbb" to the "r,g,b" form used in SVG styles.
func hexToRGBTriple(hex string) string {
	var r, g, b int
	if _, err := fmt.Sscanf(hex, "#%02x%02x%02x", &r, &g, &b); err != nil {
		return thumbnailBackgroundRGB
	}
	return fmt.Sprintf("%d,%d,%d", r, g, b)
}

// blendHexOverRGB composites hex at alpha over an "r,g,b" base, matching how the game
// renders translucent fills over the land background.
func blendHexOverRGB(hex string, baseRGB string, alpha float64) string {
	var r, g, b, br, bg, bb int
	if _, err := fmt.Sscanf(hex, "#%02x%02x%02x", &r, &g, &b); err != nil {
		return baseRGB
	}
	if _, err := fmt.Sscanf(baseRGB, "%d,%d,%d", &br, &bg, &bb); err != nil {
		return baseRGB
	}
	blend := func(c, base int) int { return int(math.Round(alpha*float64(c) + (1-alpha)*float64(base))) }
	return fmt.Sprintf("%d,%d,%d", blend(r, br), blend(g, bg), blend(b, bb))
}

func (s thumbnailLayerStyle) includes(feature *geojson.Feature) bool {
	if len(s.Kinds) == 0 {
		return true
	}
	kind, _ := feature.Properties["kind"].(string)
	return slices.Contains(s.Kinds, kind)
}

func renderGeometry(canvas *svg.SVG, proj *projection, tileX, tileY int, geometry orb.Geometry, rgb string) {
	pointStyle := "fill:rgb(" + rgb + ")"
	lineStyle := "stroke:rgb(" + rgb + ");fill:none"
	// Each polygon renders as one path holding all its rings, with the even-odd fill rule
	// leaving interior rings (e.g. islands in a river) unpainted.
	polygonStyle := "fill:rgb(" + rgb + ");fill-rule:evenodd;stroke:none"
	switch g := geometry.(type) {
	case orb.Point:
		x, y := proj.project(tileX, tileY, g.X(), g.Y())
		p := fmt.Sprintf("M %f,%f m -2,0 a 2,2 0 1,0 4,0 a 2,2 0 1,0 -4,0", x, y)
		canvas.Path(p, pointStyle)
	case orb.LineString:
		if p := buildLineStringPath(proj, tileX, tileY, g); p != "" {
			canvas.Path(p, lineStyle)
		}
	case orb.Polygon:
		if p := buildPolygonPath(proj, tileX, tileY, g); p != "" {
			canvas.Path(p, polygonStyle)
		}
	case orb.MultiPoint:
		for _, pt := range g {
			x, y := proj.project(tileX, tileY, pt.X(), pt.Y())
			p := fmt.Sprintf("M %f,%f m -2,0 a 2,2 0 1,0 4,0 a 2,2 0 1,0 -4,0", x, y)
			canvas.Path(p, pointStyle)
		}
	case orb.MultiLineString:
		for _, ls := range g {
			if p := buildLineStringPath(proj, tileX, tileY, ls); p != "" {
				canvas.Path(p, lineStyle)
			}
		}
	case orb.MultiPolygon:
		for _, polygon := range g {
			if p := buildPolygonPath(proj, tileX, tileY, polygon); p != "" {
				canvas.Path(p, polygonStyle)
			}
		}
	}
}

// buildPolygonPath joins a polygon's rings into a single path so an even-odd fill can
// subtract its holes.
func buildPolygonPath(proj *projection, tileX, tileY int, polygon orb.Polygon) string {
	var parts []string
	for _, ring := range polygon {
		if p := buildRingPath(proj, tileX, tileY, ring); p != "" {
			parts = append(parts, p)
		}
	}
	return strings.Join(parts, " ")
}

func buildLineStringPath(proj *projection, tileX, tileY int, ls orb.LineString) string {
	if len(ls) == 0 {
		return ""
	}
	var b strings.Builder
	x0, y0 := proj.project(tileX, tileY, ls[0].X(), ls[0].Y())
	fmt.Fprintf(&b, "M %f %f", x0, y0)
	for _, pt := range ls[1:] {
		x, y := proj.project(tileX, tileY, pt.X(), pt.Y())
		fmt.Fprintf(&b, " L %f %f", x, y)
	}
	return b.String()
}

func buildRingPath(proj *projection, tileX, tileY int, ring orb.Ring) string {
	if len(ring) == 0 {
		return ""
	}
	var b strings.Builder
	x0, y0 := proj.project(tileX, tileY, ring[0].X(), ring[0].Y())
	fmt.Fprintf(&b, "M %f %f", x0, y0)
	for _, pt := range ring[1:] {
		x, y := proj.project(tileX, tileY, pt.X(), pt.Y())
		fmt.Fprintf(&b, " L %f %f", x, y)
	}
	b.WriteString(" Z")
	return b.String()
}
