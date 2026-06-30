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

// ValidateImportedMapArchives classifies each selected archive for the pre-flight
// import review, importing nothing.
func (a *App) ValidateImportedMapArchives(paths []string) types.ImportValidationResponse {
	validations := make([]types.ImportArchiveValidation, 0, len(paths))
	for _, p := range paths {
		validations = append(validations, a.Downloader.ValidateImportedMapArchive(p))
	}
	return types.ImportValidationResponse{
		GenericResponse: types.SuccessResponse("Validated import archives"),
		Validations:     validations,
	}
}
