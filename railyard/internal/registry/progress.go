package registry

import (
	"bytes"
	"regexp"
	"strconv"
	"sync"
	"time"
)

// RegistryProgress is the payload emitted to the frontend during a
// registry refresh. Stage encodes lifecycle: "starting" -> N progress
// stages -> "complete" or "error".
type RegistryProgress struct {
	Stage   string `json:"stage"`
	Phase   string `json:"phase"`
	Current int64  `json:"current"`
	Total   int64  `json:"total"`
	Percent int    `json:"percent"`
	Message string `json:"message"`
	Error   string `json:"error"`
}

const (
	progressStageStarting    = "starting"
	progressStageCounting    = "counting"
	progressStageCompressing = "compressing"
	progressStageReceiving   = "receiving"
	progressStageResolving   = "resolving"
	progressStageCheckout    = "checkout"
	progressStageComplete    = "complete"
	progressStageError       = "error"

	progressPhaseClone = "clone"
	progressPhaseFetch = "fetch"

	progressThrottle = 100 * time.Millisecond
)

// progressLinePattern matches lines like:
//
//	"Counting objects:  50% (50/100)"
//	"remote: Receiving objects: 100% (200/200), 1.2 MiB | 500 KiB/s, done."
//
// The "remote: " prefix is optional and ignored.
var progressLinePattern = regexp.MustCompile(`(Counting objects|Compressing objects|Receiving objects|Resolving deltas):\s*(\d+)%\s*\((\d+)/(\d+)\)`)

var phaseLabelToStage = map[string]string{
	"Counting objects":    progressStageCounting,
	"Compressing objects": progressStageCompressing,
	"Receiving objects":   progressStageReceiving,
	"Resolving deltas":    progressStageResolving,
}

var stageToMessage = map[string]string{
	progressStageCounting:    "Counting objects",
	progressStageCompressing: "Compressing objects",
	progressStageReceiving:   "Receiving objects",
	progressStageResolving:   "Resolving deltas",
}

// progressWriter is an io.Writer fed to go-git's sideband Progress option.
// It parses git's human-readable progress lines and forwards structured
// updates through the supplied emit callback, throttled per-stage.
type progressWriter struct {
	phase string
	emit  func(RegistryProgress)

	mu        sync.Mutex
	buf       bytes.Buffer
	lastStage string
	lastEmit  time.Time
}

func newProgressWriter(phase string, emit func(RegistryProgress)) *progressWriter {
	return &progressWriter{phase: phase, emit: emit}
}

func (pw *progressWriter) Write(p []byte) (int, error) {
	pw.mu.Lock()
	defer pw.mu.Unlock()

	pw.buf.Write(p)
	data := pw.buf.Bytes()

	// Walk the buffer, slicing on either \r or \n. Each completed
	// segment is processed; the trailing partial segment (if any) is
	// retained in the buffer for the next Write.
	start := 0
	for i := 0; i < len(data); i++ {
		if data[i] != '\r' && data[i] != '\n' {
			continue
		}
		segment := data[start:i]
		pw.processSegment(segment)
		start = i + 1
	}

	if start > 0 {
		// Drop processed prefix; keep remainder for next Write.
		remainder := append([]byte(nil), data[start:]...)
		pw.buf.Reset()
		pw.buf.Write(remainder)
	}

	return len(p), nil
}

func (pw *progressWriter) processSegment(segment []byte) {
	if len(segment) == 0 {
		return
	}
	matches := progressLinePattern.FindSubmatch(segment)
	if matches == nil {
		return
	}

	stage, ok := phaseLabelToStage[string(matches[1])]
	if !ok {
		return
	}
	percent, _ := strconv.Atoi(string(matches[2]))
	current, _ := strconv.ParseInt(string(matches[3]), 10, 64)
	total, _ := strconv.ParseInt(string(matches[4]), 10, 64)

	stageChanged := stage != pw.lastStage
	isFinal := percent >= 100
	now := time.Now()
	if !stageChanged && !isFinal && now.Sub(pw.lastEmit) < progressThrottle {
		return
	}
	pw.lastStage = stage
	pw.lastEmit = now

	pw.emit(RegistryProgress{
		Stage:   stage,
		Phase:   pw.phase,
		Current: current,
		Total:   total,
		Percent: percent,
		Message: stageToMessage[stage],
	})
}
