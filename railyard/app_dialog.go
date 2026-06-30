package main

import (
	"railyard/internal/dialog"
	"railyard/internal/types"
)

func (a *App) OpenInFileExplorer(targetPath string) types.GenericResponse {
	return dialog.OpenInFileExplorer(targetPath)
}

func (a *App) OpenImportAssetDialog(assetType types.AssetType) types.ImportAssetDialogResponse {
	return dialog.OpenImportAssetDialog(a.ctx, assetType)
}

// InspectImportArchives validates each selected archive and reports whether its
// map code is new, conflicts with an existing map, or the archive is invalid,
// without importing anything. Drives the pre-flight import summary dialog.
func (a *App) InspectImportArchives(paths []string) types.ImportInspectResponse {
	inspections := make([]types.ImportArchiveInspection, 0, len(paths))
	for _, p := range paths {
		inspections = append(inspections, a.Downloader.InspectMapImport(p))
	}
	return types.ImportInspectResponse{
		GenericResponse: types.SuccessResponse("Inspected import archives"),
		Inspections:     inspections,
	}
}
