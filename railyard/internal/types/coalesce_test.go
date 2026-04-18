package types

import "testing"

func TestCoalesce(t *testing.T) {
	if got := Coalesce("", "", "fallback", "later"); got != "fallback" {
		t.Fatalf("expected fallback, got %q", got)
	}
	if got := Coalesce(0, 0, 42, 99); got != 42 {
		t.Fatalf("expected 42, got %d", got)
	}
	if got := Coalesce("", ""); got != "" {
		t.Fatalf("expected zero value, got %q", got)
	}
}

func TestCoalescePtr(t *testing.T) {
	first := "first"
	second := "second"

	if got := CoalescePtr[string](nil, &first, &second); got != &first {
		t.Fatalf("expected first pointer, got %v", got)
	}
	if got := CoalescePtr[string](nil, nil); got != nil {
		t.Fatalf("expected nil, got %v", got)
	}
}

func TestCoalesceBy(t *testing.T) {
	type sample struct {
		Value int
	}

	isZero := func(value sample) bool { return value.Value == 0 }

	if got := CoalesceBy(isZero, sample{}, sample{Value: 7}, sample{Value: 9}); got.Value != 7 {
		t.Fatalf("expected first non-zero sample, got %+v", got)
	}
	if got := CoalesceBy(isZero, sample{}, sample{}); got.Value != 0 {
		t.Fatalf("expected zero sample, got %+v", got)
	}
}

func TestPtr(t *testing.T) {
	value := Ptr("hello")
	if value == nil || *value != "hello" {
		t.Fatalf("expected pointer to hello, got %v", value)
	}
}
