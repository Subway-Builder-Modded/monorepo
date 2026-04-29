package registry

import (
	"bytes"
	"regexp"
	"strconv"
	"sync"
	"time"
)

// RegistryProgress is the payload emitted to the frontend during a registry refresh.
// Stage encodes lifecycle: "starting" -> N progress stages -> "complete" or "error".
type RegistryProgress struct {
	Stage   string `json:"stage"`
	Phase   string `json:"phase"`
	Current int64  `json:"current"`
	Total   int64  `json:"total"`
	Percent int    `json:"percent"`
	Message string `json:"message"`
	Error   string `json:"error"`
}

// Enumeration of different progress stages encountered during git checkout
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

	// progressThrottle caps how often non-terminal updates are emitted per stage.
	// "Receiving objects" can fire dozens of ticks per second; without this we'd flood the Wails event channel and the React toast would re-render at every tick.
	progressThrottle = 100 * time.Millisecond
)

// progressLinePattern matches lines like:
//
//	"{phrase}:  50% (50/100)"
//	"remote: {phrase}: 100% (200/200), 1.2 MiB | 500 KiB/s, done."
//
// The pattern is intentionally unanchored so the optional "remote: " prefix and any trailing rate/byte-count suffix are tolerated. Banners and "done." trailers without a percent simply fail to match and are dropped.
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

// progressWriter is an io.Writer linked to go-git's Progress option.
type progressWriter struct {
	phase string
	emit  func(RegistryProgress)

	// mu guards buf/lastStage/lastEmit. go-git's transport typically writes from a single goroutine, but the lock is cheap defence in case that ever changes.
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

	// Walk the buffer, slicing on either \r or \n.

	start := 0
	for i := 0; i < len(data); i++ {
		// Splitting on \r is load-bearing: git's progress lines use carriage returns to overwrite themselves in-place ("Counting objects: 1%\rCounting objects: 2%\r..."), so a \n-only split would coalesce hundreds of intermediate updates into one giant unparseable line.
		if data[i] != '\r' && data[i] != '\n' {
			continue
		}
		// Each completed segment is processed; the trailing partial segment (if it exists) is retained in the buffer for the next Write since go-git can chunk a single line across multiple Write calls.
		segment := data[start:i]
		pw.processSegment(segment)
		start = i + 1
	}

	if start > 0 {
		// Drop the processed prefix in place; the trailing partial segment is preserved.
		pw.buf.Next(start)
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

	// Always let stage transitions and the 100% tick through, even inside the throttle window.
	// The former ensures the UI shows stage handoffs, the latter prevents the bar from getting stuck mid-progress if the throttle happens to swallow the final tick.
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
