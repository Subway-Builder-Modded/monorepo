package registrytest

import "railyard/internal/types"

func MockAuthor() types.AuthorDetails {
	return types.AuthorDetails{
		AuthorID:        "author-a",
		AuthorAlias:     "Author A",
		AttributionLink: "https://example.com/author-a",
	}
}

func MockAuthorWithID(authorID string) types.AuthorDetails {
	return types.AuthorDetails{
		AuthorID:        authorID,
		AuthorAlias:     authorID,
		AttributionLink: "https://example.com/" + authorID,
	}
}

func MockModManifest() types.ModManifest {
	return MockModManifestWithID("mod-a")
}

func MockModManifestWithID(id string) types.ModManifest {
	return types.ModManifest{
		AssetManifest: types.AssetManifest{
			ID:     id,
			Name:   id,
			Author: MockAuthorWithID(id + "-author"),
		},
	}
}

func MockMapManifest() types.MapManifest {
	return MockMapManifestWithIDAndCode("map-a", "AAA")
}

func MockMapManifestWithIDAndCode(id string, cityCode string) types.MapManifest {
	return types.MapManifest{
		AssetManifest: types.AssetManifest{
			ID:     id,
			Name:   id,
			Author: MockAuthorWithID(id + "-author"),
		},
		CityCode: cityCode,
	}
}
