package drivingpaths

import (
	"encoding/json"

	"railyard/internal/types"
)

const (
	jsonQuote     = 0x22 // "
	jsonBackslash = 0x5c // \
)

// parseDrivingPaths splits a driving-paths document ({"popId":[[lon,lat],...],...})
// into popId -> raw route bytes without unmarshalling each route's coordinates.
// On any structural surprise it falls back to encoding/json so a well-formed document always loads.
func parseDrivingPaths(b []byte) (types.DrivingPathsFile, error) {
	out := make(types.DrivingPathsFile)

	// Single-pass scan over the top-level object: find each key and the byte span of
	// its array value, keeping the value raw so serving a route is a zero-parse copy.
	i, n := 0, len(b)
	for i < n && b[i] != '{' {
		i++
	}
	if i >= n {
		return fallbackParseDrivingPaths(b)
	}
	i++ // past '{'
	for i < n {
		// Skip whitespace and the comma between entries.
		for i < n {
			c := b[i]
			if c == ' ' || c == '\n' || c == '\t' || c == '\r' || c == ',' {
				i++
				continue
			}
			break
		}
		if i >= n || b[i] == '}' {
			break
		}
		if b[i] != jsonQuote {
			return fallbackParseDrivingPaths(b)
		}
		// Key string.
		i++
		keyStart := i
		for i < n && b[i] != jsonQuote {
			if b[i] == jsonBackslash {
				i++
			}
			i++
		}
		if i >= n {
			return fallbackParseDrivingPaths(b)
		}
		key := string(b[keyStart:i])
		i++ // past closing quote
		for i < n && b[i] != ':' {
			i++
		}
		i++ // past ':'
		for i < n && (b[i] == ' ' || b[i] == '\n' || b[i] == '\t' || b[i] == '\r') {
			i++
		}
		// Value must be an array; capture its byte span by bracket depth.
		if i >= n || b[i] != '[' {
			return fallbackParseDrivingPaths(b)
		}
		valStart := i
		depth := 0
		inStr := false
		for i < n {
			c := b[i]
			if inStr {
				if c == jsonBackslash {
					i++
				} else if c == jsonQuote {
					inStr = false
				}
			} else if c == jsonQuote {
				inStr = true
			} else if c == '[' {
				depth++
			} else if c == ']' {
				depth--
				if depth == 0 {
					i++
					break
				}
			}
			i++
		}
		if depth != 0 {
			return fallbackParseDrivingPaths(b)
		}
		out[key] = json.RawMessage(b[valStart:i])
	}
	return out, nil
}

// fallbackParseDrivingPaths decodes the document with encoding/json when the fast scan bails.
func fallbackParseDrivingPaths(b []byte) (types.DrivingPathsFile, error) {
	var m types.DrivingPathsFile
	if err := json.Unmarshal(b, &m); err != nil {
		return nil, err
	}
	return m, nil
}
