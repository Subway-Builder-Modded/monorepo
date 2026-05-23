package registry

import "strings"

// normalizeMapCountry returns a canonical ISO-style country code or an empty string.
func normalizeMapCountry(country string) string {
	country = strings.TrimSpace(country)
	if len(country) != 2 {
		return ""
	}

	for _, ch := range country {
		if (ch < 'A' || ch > 'Z') && (ch < 'a' || ch > 'z') {
			return ""
		}
	}

	return strings.ToUpper(country)
}
