package registry

import (
	"fmt"
	"path/filepath"

	"railyard/internal/constants"
	"railyard/internal/files"
	"railyard/internal/types"
)

type authorIndexEntry struct {
	AuthorID        string  `json:"author_id"`
	AuthorAlias     string  `json:"author_alias"`
	AttributionLink string  `json:"attribution_link"`
	ContributorTier *string `json:"contributor_tier,omitempty"`
}

type authorIndexFile struct {
	SchemaVersion int                `json:"schema_version"`
	Authors       []authorIndexEntry `json:"authors"`
}

func (r *Registry) getAuthorsFromIndex() (map[string]authorIndexEntry, error) {
	authorsPath := filepath.Join(r.repoPath, constants.AUTHORS_DIR, constants.INDEX_JSON)
	index, err := files.ReadJSON[authorIndexFile](authorsPath, "authors index", files.JSONReadOptions{})
	if err != nil {
		r.logger.Error("Failed to read authors index file", err, "path", authorsPath)
		return nil, err
	}

	authorsByID := make(map[string]authorIndexEntry, len(index.Authors))
	for _, author := range index.Authors {
		authorsByID[author.AuthorID] = author
	}
	return authorsByID, nil
}

func (r *Registry) resolveManifestAuthor(
	authorID string,
	assetType types.AssetType,
	assetID string,
	authorsByID map[string]authorIndexEntry,
) (types.AuthorDetails, bool) {
	author, ok := authorsByID[authorID]

	// If the author ID from the manifest doesn't exist in the authors index, log an error and return an empty AuthorDetails.
	// This shouldn't happen if the registry data is correctly maintained, but that is a data ingestion issue rather than an application error, so we can soft-fail here.
	if !ok {
		r.logger.Error(
			"Skipping asset with missing author metadata",
			fmt.Errorf("author %q not found in authors index", authorID),
			"asset_type", assetType,
			"asset_id", assetID,
			"author_id", authorID,
		)
		return types.AuthorDetails{}, false
	}

	return types.AuthorDetails{
		AuthorID:        author.AuthorID,
		AuthorAlias:     author.AuthorAlias,
		AttributionLink: author.AttributionLink,
		ContributorTier: author.ContributorTier,
	}, true
}
