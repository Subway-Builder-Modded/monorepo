package drivingpaths

import (
	"encoding/json"
	"net"
	"net/http"
	"railyard/internal/logger"
	"railyard/internal/types"
)

var drivingPathsCache = &types.DrivingPathsCache{}

var globalLogger logger.Logger
var metroMakerDataPath string

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
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("Driving paths already loaded for city: " + cityCode))
		return
	}

	// Start loading in a background goroutine so the main executor isn't blocked.
	go func(code string) {
		if err := loadDrivingPathsForCity(code, drivingPathsCache, metroMakerDataPath); err != nil {
			globalLogger.Error("Failed to load driving paths for city (async): "+code, err)
		} else {
			globalLogger.Info("Driving paths loaded for city", "city", code)
		}
	}(cityCode)

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Driving paths load started"))
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

	path, ok := drivingPathsCache.GetPath(cityCode, popId)
	if !ok {
		http.Error(w, "Driving path not found for cityCode: "+cityCode+" and popId: "+popId, http.StatusNotFound)
		globalLogger.Error("Driving path not found for cityCode: "+cityCode+" and popId: "+popId, nil)
		return
	}
	response := types.DrivingPathsResponse{
		Coordinates: path,
	}

	bytes, err := json.Marshal(response)
	if err != nil {
		http.Error(w, "Failed to serialize response: "+err.Error(), http.StatusInternalServerError)
		globalLogger.Error("Failed to serialize response when getting driving path for city", err)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.Write(bytes)
}

func createHTTPServer(listener *net.Listener, log logger.Logger) (*http.Server, error) {
	mux := http.NewServeMux()
	mux.HandleFunc("/loadpaths", handleLoadDrivingPathsForCity)
	mux.HandleFunc("/path", handleGetDrivingPathForCity)
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
