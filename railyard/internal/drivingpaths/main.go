package drivingpaths

import (
	"net"
	"net/http"
	"time"

	"railyard/internal/logger"
	"railyard/internal/types"
)

var drivingPathsCache = &types.DrivingPathsCache{}

var globalLogger logger.Logger
var metroMakerDataPath string

func handleResetCache(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	drivingPathsCache = &types.DrivingPathsCache{}
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Driving paths cache reset"))
}

func handleLoadDrivingPathsForCity(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseForm(); err != nil {
		globalLogger.Error("Failed to parse form when loading driving paths for city", err)
		http.Error(w, "Failed to parse form: "+err.Error(), http.StatusBadRequest)
		return
	}

	if r.Method != http.MethodPost {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	cityCode := r.FormValue("cityCode")
	if cityCode == "" {
		http.Error(w, "Missing cityCode parameter", http.StatusBadRequest)
		return
	}

	if drivingPathsCache.HasMap(cityCode) {
		globalLogger.Info("Driving paths already loaded for city", "city", cityCode)
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("Driving paths already loaded for city: " + cityCode))
		return
	}

	// Load synchronously so the caller knows exactly when the city's paths are ready
	// (its console log resolves on completion) and the pre-warm is done before the
	// response returns. LoadIfAbsent still serializes with any concurrent /path load.
	globalLogger.Info("Driving paths load requested", "city", cityCode)
	start := time.Now()
	if err := loadDrivingPathsForCity(cityCode, drivingPathsCache, metroMakerDataPath); err != nil {
		globalLogger.Error("Failed to load driving paths for city: "+cityCode, err)
		http.Error(w, "Failed to load driving paths for city: "+cityCode, http.StatusNotFound)
		return
	}
	globalLogger.Info("Driving paths loaded for city", "city", cityCode, "elapsedMs", time.Since(start).Milliseconds())
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Driving paths loaded for city: " + cityCode))
}

func handleGetDrivingPathForCity(w http.ResponseWriter, r *http.Request) {
	if err := r.ParseForm(); err != nil {
		globalLogger.Error("Failed to parse form when getting driving path for city", err)
		http.Error(w, "Failed to parse form: "+err.Error(), http.StatusBadRequest)
		return
	}

	if r.Method != http.MethodGet {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	cityCode := r.FormValue("cityCode")
	popId := r.FormValue("popId")

	if cityCode == "" && popId == "" {
		http.Error(w, "Missing cityCode and popId parameters", http.StatusBadRequest)
		return
	} else if cityCode == "" {
		http.Error(w, "Missing cityCode parameter", http.StatusBadRequest)
		return
	} else if popId == "" {
		http.Error(w, "Missing popId parameter", http.StatusBadRequest)
		return
	}

	start := time.Now()
	// cacheHit records whether the city's paths were already resident before the request.
	cacheHit := drivingPathsCache.HasMap(cityCode)

	// Ensure the city's paths are loaded before the lookup. The mod loads the city's paths
	// via a POST to /loadpaths onCityLoad, but a path can still be requested before that
	// finishes, which can result in a 404.
	if err := loadDrivingPathsForCity(cityCode, drivingPathsCache, metroMakerDataPath); err != nil {
		http.Error(w, "Driving path not found for cityCode: "+cityCode+" and popId: "+popId, http.StatusNotFound)
		globalLogger.Error("Failed to load driving paths on demand for cityCode: "+cityCode, err)
		return
	}

	path, ok := drivingPathsCache.GetPath(cityCode, popId)
	if !ok {
		http.Error(w, "Driving path not found for cityCode: "+cityCode+" and popId: "+popId, http.StatusNotFound)
		globalLogger.Error("Driving path not found for cityCode: "+cityCode+" and popId: "+popId, nil)
		return
	}
	globalLogger.Info("Served driving path", "city", cityCode, "popId", popId, "cacheHit", cacheHit, "elapsedMs", time.Since(start).Milliseconds())

	// Write {"coordinates":<raw route bytes>} directly. The cached value is already
	// the route's JSON coordinate array, so there is nothing to marshal.
	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(`{"coordinates":`))
	w.Write(path)
	w.Write([]byte("}"))
}

func createHTTPServer(listener *net.Listener, log logger.Logger) (*http.Server, error) {
	mux := http.NewServeMux()
	mux.HandleFunc("/loadpaths", handleLoadDrivingPathsForCity)
	mux.HandleFunc("/path", handleGetDrivingPathForCity)
	mux.HandleFunc("/cache", handleResetCache)
	server := &http.Server{
		Handler: mux,
	}

	go func(log logger.Logger, server *http.Server, listener *net.Listener) {
		log.Error("Driving paths server stopped", server.Serve(*listener))
	}(log, server, listener)

	return server, nil
}

func StartDrivingPathsServer(log logger.Logger, metroMakerPath string) (int, *http.Server, error) {
	metroMakerDataPath = metroMakerPath
	listener, err := net.Listen("tcp", ":0")
	if err != nil {
		log.Error("Failed to start driving paths server", err)
		return 0, nil, err
	}
	port := listener.Addr().(*net.TCPAddr).Port
	log.Info("Driving paths server started", "port", port)
	server, err := createHTTPServer(&listener, log)
	if err != nil {
		log.Error("Failed to create HTTP server", err)
		return 0, nil, err
	}
	globalLogger = log
	return port, server, nil
}
