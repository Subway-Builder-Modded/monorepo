package types

// Coalesce returns the first value that is not the zero value for its type.
func Coalesce[T comparable](values ...T) T {
	var zero T
	for _, value := range values {
		if value != zero {
			return value
		}
	}
	return zero
}

// CoalescePtr returns the first non-nil pointer in values.
func CoalescePtr[T any](values ...*T) *T {
	for _, value := range values {
		if value != nil {
			return value
		}
	}
	return nil
}

// CoalesceBy returns the first value for which isZero returns false.
func CoalesceBy[T any](isZero func(T) bool, values ...T) T {
	var zero T
	for _, value := range values {
		if !isZero(value) {
			return value
		}
	}
	return zero
}

// Ptr returns a pointer to value.
func Ptr[T any](value T) *T {
	return &value
}
