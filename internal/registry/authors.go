package registry

import (
	"fmt"
	"path/filepath"
	"strings"

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

func normalizeAuthorID(authorID string) string {
	return strings.ToLower(strings.TrimSpace(authorID))
}

func (r *Registry) getAuthorsFromIndex() (map[string]authorIndexEntry, error) {
	authorsPath := filepath.Join(r.repoPath, "authors", constants.INDEX_JSON)
	index, err := files.ReadJSON[authorIndexFile](authorsPath, "authors index", files.JSONReadOptions{})
	if err != nil {
		return nil, err
	}

	authorsByID := make(map[string]authorIndexEntry, len(index.Authors))
	for _, author := range index.Authors {
		normalizedAuthorID := normalizeAuthorID(author.AuthorID)
		if normalizedAuthorID == "" {
			r.logger.Error(
				"Skipping invalid author entry in authors index",
				fmt.Errorf("author_id is empty"),
			)
			continue
		}
		authorsByID[normalizedAuthorID] = author
	}
	return authorsByID, nil
}

func (r *Registry) resolveManifestAuthor(
	authorID string,
	assetType types.AssetType,
	assetID string,
	authorsByID map[string]authorIndexEntry,
) (types.AuthorDetails, bool) {
	normalizedAuthorID := normalizeAuthorID(authorID)
	if normalizedAuthorID == "" {
		r.logger.Error(
			"Skipping asset with invalid manifest author id",
			fmt.Errorf("manifest author id is empty"),
			"asset_type", assetType,
			"asset_id", assetID,
			"author_id", authorID,
		)
		return types.AuthorDetails{}, false
	}

	author, ok := authorsByID[normalizedAuthorID]
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

	alias := strings.TrimSpace(author.AuthorAlias)
	attributionLink := strings.TrimSpace(author.AttributionLink)
	indexAuthorID := strings.TrimSpace(author.AuthorID)
	if alias == "" || attributionLink == "" || indexAuthorID == "" {
		r.logger.Error(
			"Skipping asset with invalid author contract in authors index",
			fmt.Errorf("author metadata missing required fields"),
			"asset_type", assetType,
			"asset_id", assetID,
			"author_id", authorID,
		)
		return types.AuthorDetails{}, false
	}

	return types.AuthorDetails{
		AuthorID:        indexAuthorID,
		AuthorAlias:     alias,
		AttributionLink: attributionLink,
		ContributorTier: author.ContributorTier,
	}, true
}
