//go:build linux

package constants

import (
	_ "embed"
)

//go:embed linux_type.txt
var LINUX_TYPE string
