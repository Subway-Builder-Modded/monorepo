package main

// LogFrontend persists a log line emitted by the frontend into the backend application log,
// so frontend diagnostics land in the persisted log alongside backend logs instead of living only in the dev console.
func (a *App) LogFrontend(level string, message string) {
	if a.Logger == nil {
		return
	}
	// level selects the backend log level: "perf" routes to Logger.Perf, "warn"/"error" to the matching level, and anything else to info (the default).
	switch level {
	case "perf":
		a.Logger.Perf("frontend", message)
	case "warn":
		a.Logger.Warn(message, "source", "frontend")
	case "error":
		a.Logger.Error(message, nil, "source", "frontend")
	default:
		a.Logger.Info(message, "source", "frontend")
	}
}
