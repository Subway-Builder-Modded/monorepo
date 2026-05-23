package registry

import "testing"

func TestNormalizeMapCountry(t *testing.T) {
	t.Parallel()

	testCases := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "uppercases and trims ISO codes",
			input:    " cz ",
			expected: "CZ",
		},
		{
			name:     "discards non ISO labels",
			input:    " Ukraine ",
			expected: "",
		},
		{
			name:     "discards invalid two-character labels",
			input:    "1!",
			expected: "",
		},
	}

	for _, testCase := range testCases {
		testCase := testCase
		t.Run(testCase.name, func(t *testing.T) {
			t.Parallel()
			if actual := normalizeMapCountry(testCase.input); actual != testCase.expected {
				t.Fatalf("normalizeMapCountry(%q) = %q, expected %q", testCase.input, actual, testCase.expected)
			}
		})
	}
}
