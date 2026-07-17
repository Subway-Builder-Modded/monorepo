// Command layerdump prints the layer structure of installed PMTiles around a center point,
// for inspecting which layers/kinds a map archive actually carries. Temporary dev tool.
package main

import (
	"bytes"
	"compress/gzip"
	"fmt"
	"io"
	"log"
	"math"
	"net/http/httptest"
	"os"
	"sort"
	"strconv"

	"github.com/paulmach/orb/encoding/mvt"
	"github.com/protomaps/go-pmtiles/pmtiles"
)

func lon2tile(lon float64, zoom int) int {
	return int(math.Floor((lon + 180) / 360 * math.Pow(2, float64(zoom))))
}

func lat2tile(lat float64, zoom int) int {
	rad := lat * math.Pi / 180
	return int(math.Floor((1 - math.Log(math.Tan(rad)+1/math.Cos(rad))/math.Pi) / 2 * math.Pow(2, float64(zoom))))
}

func main() {
	if len(os.Args) != 6 {
		log.Fatal("usage: layerdump <tilesDir> <code> <lat> <lng> <zoom>")
	}
	tilesDir, code := os.Args[1], os.Args[2]
	lat, _ := strconv.ParseFloat(os.Args[3], 64)
	lng, _ := strconv.ParseFloat(os.Args[4], 64)
	zoom, _ := strconv.Atoi(os.Args[5])

	server, err := pmtiles.NewServerWithBucket(pmtiles.NewFileBucket(tilesDir), "", log.Default(), 16, "")
	if err != nil {
		log.Fatal(err)
	}
	server.Start()

	cx, cy := lon2tile(lng, zoom), lat2tile(lat, zoom)
	type layerStats struct {
		features int
		geoms    map[string]int
		props    map[string]map[string]int // key -> value -> count (strings only)
	}
	stats := map[string]*layerStats{}

	for x := cx - 1; x <= cx+1; x++ {
		for y := cy - 1; y <= cy+1; y++ {
			rec := httptest.NewRecorder()
			req := httptest.NewRequest("GET", fmt.Sprintf("/%s/%d/%d/%d.mvt", code, zoom, x, y), nil)
			status := server.ServeHTTP(rec, req)
			if status != 200 {
				fmt.Printf("tile %d/%d/%d -> HTTP %d\n", zoom, x, y, status)
				continue
			}
			data := rec.Body.Bytes()
			if len(data) > 1 && data[0] == 0x1f && data[1] == 0x8b {
				gz, gzErr := gzip.NewReader(bytes.NewReader(data))
				if gzErr != nil {
					fmt.Printf("tile %d/%d/%d -> gzip error: %v\n", zoom, x, y, gzErr)
					continue
				}
				if data, err = io.ReadAll(gz); err != nil {
					fmt.Printf("tile %d/%d/%d -> gunzip error: %v\n", zoom, x, y, err)
					continue
				}
			}
			layers, err := mvt.Unmarshal(data)
			if err != nil {
				fmt.Printf("tile %d/%d/%d -> decode error: %v\n", zoom, x, y, err)
				continue
			}
			for _, layer := range layers {
				s := stats[layer.Name]
				if s == nil {
					s = &layerStats{geoms: map[string]int{}, props: map[string]map[string]int{}}
					stats[layer.Name] = s
				}
				for _, f := range layer.Features {
					s.features++
					s.geoms[string(f.Geometry.GeoJSONType())]++
					for k, v := range f.Properties {
						sv, ok := v.(string)
						if !ok {
							continue
						}
						if s.props[k] == nil {
							s.props[k] = map[string]int{}
						}
						s.props[k][sv]++
					}
				}
			}
		}
	}

	names := make([]string, 0, len(stats))
	for n := range stats {
		names = append(names, n)
	}
	sort.Strings(names)
	for _, n := range names {
		s := stats[n]
		fmt.Printf("\nLAYER %q: %d features, geoms=%v\n", n, s.features, s.geoms)
		keys := make([]string, 0, len(s.props))
		for k := range s.props {
			keys = append(keys, k)
		}
		sort.Strings(keys)
		for _, k := range keys {
			vals := s.props[k]
			if len(vals) > 40 {
				fmt.Printf("  %s: (%d distinct values)\n", k, len(vals))
				continue
			}
			fmt.Printf("  %s: %v\n", k, vals)
		}
	}
}
