package registry

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"railyard/internal/constants"
	"railyard/internal/files"
	"railyard/internal/testutil"
	"railyard/internal/types"

	"github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/plumbing"
	"github.com/go-git/go-git/v5/plumbing/object"
	"github.com/stretchr/testify/require"
)

// newSourceRepo initializes a local repository on a main branch to act as the clone/fetch origin.
func newSourceRepo(t *testing.T) (string, *git.Repository) {
	t.Helper()
	dir := t.TempDir()
	repo, err := git.PlainInitWithOptions(dir, &git.PlainInitOptions{
		InitOptions: git.InitOptions{DefaultBranch: plumbing.Main},
	})
	require.NoError(t, err)
	return dir, repo
}

// writeSourceContent writes the minimal registry layout fetchFromDisk requires into the source worktree.
func writeSourceContent(t *testing.T, dir string, modName string) {
	t.Helper()
	require.NoError(t, files.WriteJSON(filepath.Join(dir, "mods", "mod-a", constants.MANIFEST_JSON), "mod manifest", types.RawModManifest{
		RawManifest: types.RawManifest{
			SchemaVersion: 1,
			ID:            "mod-a",
			Name:          modName,
			AuthorID:      "author-a",
			Update:        types.UpdateConfig{Type: "github", Repo: "owner/mod-a"},
		},
	}))
	require.NoError(t, files.WriteJSON(filepath.Join(dir, "mods", constants.INDEX_JSON), "mods index", types.IndexFile{SchemaVersion: 1, Mods: []string{"mod-a"}}))
	require.NoError(t, files.WriteJSON(filepath.Join(dir, "maps", constants.INDEX_JSON), "maps index", types.IndexFile{SchemaVersion: 1, Maps: []string{}}))
	require.NoError(t, files.WriteJSON(filepath.Join(dir, "mods", "downloads.json"), "mod downloads", types.DownloadsFile{}))
	require.NoError(t, files.WriteJSON(filepath.Join(dir, "maps", "downloads.json"), "map downloads", types.DownloadsFile{}))
	require.NoError(t, files.WriteJSON(filepath.Join(dir, "mods", constants.INTEGRITY_JSON), "mods integrity report", types.RegistryIntegrityReport{
		SchemaVersion: 1,
		GeneratedAt:   "1970-01-01T00:00:00Z",
		// A complete listing so the manifest survives integrity filtering.
		Listings: map[string]types.IntegrityListing{
			"mod-a": {
				HasCompleteVersion: true,
				CompleteVersions:   []string{"v1.0.0"},
				Versions: map[string]types.IntegrityVersionStatus{
					"v1.0.0": {IsComplete: true, CheckedAt: "2026-01-01T00:00:00Z", ReleasedAt: "2025-12-01T00:00:00Z"},
				},
			},
		},
	}))
	require.NoError(t, files.WriteJSON(filepath.Join(dir, "maps", constants.INTEGRITY_JSON), "maps integrity report", types.RegistryIntegrityReport{SchemaVersion: 1, GeneratedAt: "1970-01-01T00:00:00Z"}))
	require.NoError(t, files.WriteJSON(filepath.Join(dir, constants.AUTHORS_DIR, constants.INDEX_JSON), "authors index", authorIndexFile{
		SchemaVersion: 1,
		Authors:       []authorIndexEntry{{AuthorID: "author-a", AuthorAlias: "Author A", AttributionLink: "https://github.com/author-a"}},
	}))
	// A directory outside registrySparseCheckoutDirs; must never be materialized in the local clone.
	require.NoError(t, files.WriteJSON(filepath.Join(dir, "analytics", "stats.json"), "analytics stats", map[string]int{"runs": 1}))
}

// commitAll stages the entire worktree and commits it, returning the commit hash.
func commitAll(t *testing.T, repo *git.Repository, msg string) plumbing.Hash {
	t.Helper()
	wt, err := repo.Worktree()
	require.NoError(t, err)
	require.NoError(t, wt.AddWithOptions(&git.AddOptions{All: true}))
	hash, err := wt.Commit(msg, &git.CommitOptions{
		Author: &object.Signature{Name: "test", Email: "test@example.com", When: time.Now()},
	})
	require.NoError(t, err)
	return hash
}

// newClonedRegistry builds a Registry cloned from a fresh source repo, returning both plus the source path.
func newClonedRegistry(t *testing.T) (*Registry, string, *git.Repository) {
	t.Helper()
	testutil.NewHarness(t)
	sourceDir, sourceRepo := newSourceRepo(t)
	writeSourceContent(t, sourceDir, "Mod A")
	commitAll(t, sourceRepo, "initial")

	reg := newTestRegistry(t)
	reg.registryRepoURL = sourceDir
	require.NoError(t, reg.openOrClone())
	return reg, sourceDir, sourceRepo
}

// localHead returns the HEAD hash of the registry's local clone.
func localHead(t *testing.T, reg *Registry) plumbing.Hash {
	t.Helper()
	repo, err := git.PlainOpen(reg.repoPath)
	require.NoError(t, err)
	head, err := repo.Head()
	require.NoError(t, err)
	return head.Hash()
}

func TestOpenOrCloneFreshClone(t *testing.T) {
	reg, _, _ := newClonedRegistry(t)

	// Sparse checkout materializes registry content but not directories outside registrySparseCheckoutDirs.
	require.FileExists(t, filepath.Join(reg.repoPath, "mods", "mod-a", constants.MANIFEST_JSON))
	require.NoFileExists(t, filepath.Join(reg.repoPath, "analytics", "stats.json"))

	// forceClone loads the registry data after cloning.
	require.Len(t, reg.mods, 1)
	require.Equal(t, "Mod A", reg.mods[0].Name)
	require.False(t, reg.localCloneHasTags())
}

func TestOpenOrCloneReopensExistingClone(t *testing.T) {
	reg, _, _ := newClonedRegistry(t)

	// A second Registry pointed at an unreachable origin must reopen the existing clone without cloning.
	reg2 := newTestRegistry(t)
	reg2.registryRepoURL = filepath.Join(t.TempDir(), "missing")
	require.NoError(t, reg2.openOrClone())
	require.Equal(t, localHead(t, reg), localHead(t, reg2))
}

func TestOpenOrCloneRecloneOnCorruptRepo(t *testing.T) {
	t.Run("unopenable repo", func(t *testing.T) {
		testutil.NewHarness(t)
		sourceDir, sourceRepo := newSourceRepo(t)
		writeSourceContent(t, sourceDir, "Mod A")
		commitAll(t, sourceRepo, "initial")

		reg := newTestRegistry(t)
		reg.registryRepoURL = sourceDir
		// A directory with an empty .git cannot be opened as a repository.
		require.NoError(t, os.MkdirAll(filepath.Join(reg.repoPath, ".git"), 0o755))
		require.NoError(t, reg.openOrClone())
		require.FileExists(t, filepath.Join(reg.repoPath, "mods", "mod-a", constants.MANIFEST_JSON))
	})

	t.Run("repo without HEAD", func(t *testing.T) {
		testutil.NewHarness(t)
		sourceDir, sourceRepo := newSourceRepo(t)
		writeSourceContent(t, sourceDir, "Mod A")
		commitAll(t, sourceRepo, "initial")

		reg := newTestRegistry(t)
		reg.registryRepoURL = sourceDir
		// An initialized repo with no commits opens fine but has no resolvable HEAD.
		_, err := git.PlainInit(reg.repoPath, false)
		require.NoError(t, err)
		require.NoError(t, reg.openOrClone())
		require.FileExists(t, filepath.Join(reg.repoPath, "mods", "mod-a", constants.MANIFEST_JSON))
	})
}

func TestRefreshRepoForceClonesWhenMissing(t *testing.T) {
	testutil.NewHarness(t)
	sourceDir, sourceRepo := newSourceRepo(t)
	writeSourceContent(t, sourceDir, "Mod A")
	commitAll(t, sourceRepo, "initial")

	reg := newTestRegistry(t)
	reg.registryRepoURL = sourceDir
	require.NoError(t, reg.refreshRepo())
	require.FileExists(t, filepath.Join(reg.repoPath, "mods", "mod-a", constants.MANIFEST_JSON))
}

func TestRefreshRepoFallsBackToForceCloneOnFetchFailure(t *testing.T) {
	testutil.NewHarness(t)
	sourceDir, sourceRepo := newSourceRepo(t)
	writeSourceContent(t, sourceDir, "Mod A")
	commitAll(t, sourceRepo, "initial")

	reg := newTestRegistry(t)
	reg.registryRepoURL = sourceDir
	// A local repo with a commit but no origin remote makes fetchAndReset fail, forcing a re-clone.
	local, err := git.PlainInit(reg.repoPath, false)
	require.NoError(t, err)
	require.NoError(t, os.WriteFile(filepath.Join(reg.repoPath, "placeholder.txt"), []byte("x"), 0o644))
	commitAll(t, local, "local only")

	require.NoError(t, reg.refreshRepo())
	require.FileExists(t, filepath.Join(reg.repoPath, "mods", "mod-a", constants.MANIFEST_JSON))
	require.NoFileExists(t, filepath.Join(reg.repoPath, "placeholder.txt"))
}

func TestForceCloneErrors(t *testing.T) {
	t.Run("unreachable origin", func(t *testing.T) {
		testutil.NewHarness(t)
		reg := newTestRegistry(t)
		reg.registryRepoURL = filepath.Join(t.TempDir(), "missing")
		err := reg.openOrClone()
		require.Error(t, err)
		require.Contains(t, err.Error(), "failed to clone registry repository")
	})

	t.Run("clone without registry data", func(t *testing.T) {
		testutil.NewHarness(t)
		sourceDir, sourceRepo := newSourceRepo(t)
		require.NoError(t, os.WriteFile(filepath.Join(sourceDir, "readme.txt"), []byte("x"), 0o644))
		commitAll(t, sourceRepo, "no registry layout")

		reg := newTestRegistry(t)
		reg.registryRepoURL = sourceDir
		err := reg.openOrClone()
		require.Error(t, err)
		require.Contains(t, err.Error(), "failed to load registry data after clone")
	})
}

func TestRefreshRepoFetchesNewCommits(t *testing.T) {
	reg, sourceDir, sourceRepo := newClonedRegistry(t)

	// A content commit touching mods forces the full reset+checkout path.
	writeSourceContent(t, sourceDir, "Mod A v2")
	require.NoError(t, files.WriteJSON(filepath.Join(sourceDir, "mods", "mod-b", constants.MANIFEST_JSON), "mod manifest", types.RawModManifest{
		RawManifest: types.RawManifest{SchemaVersion: 1, ID: "mod-b", Name: "Mod B", AuthorID: "author-a"},
	}))
	newHash := commitAll(t, sourceRepo, "add mod-b")

	require.NoError(t, reg.refreshRepo())
	require.Equal(t, newHash, localHead(t, reg))
	require.FileExists(t, filepath.Join(reg.repoPath, "mods", "mod-b", constants.MANIFEST_JSON))
	require.NoFileExists(t, filepath.Join(reg.repoPath, "analytics", "stats.json"))
}

func TestRefreshRepoAdvancesHeadWhenSparseSubtreesUnchanged(t *testing.T) {
	reg, sourceDir, sourceRepo := newClonedRegistry(t)

	// A commit touching only a non-sparse directory takes the soft-reset fast path.
	require.NoError(t, files.WriteJSON(filepath.Join(sourceDir, "analytics", "stats.json"), "analytics stats", map[string]int{"runs": 2}))
	newHash := commitAll(t, sourceRepo, "analytics only")

	require.NoError(t, reg.refreshRepo())
	require.Equal(t, newHash, localHead(t, reg))
	require.FileExists(t, filepath.Join(reg.repoPath, "mods", "mod-a", constants.MANIFEST_JSON))
	require.NoFileExists(t, filepath.Join(reg.repoPath, "analytics", "stats.json"))
}

func TestRefreshRepoReclonesWhenTagsPresent(t *testing.T) {
	reg, _, _ := newClonedRegistry(t)

	// Simulate a legacy full-tag clone by tagging the local HEAD.
	localRepo, err := git.PlainOpen(reg.repoPath)
	require.NoError(t, err)
	_, err = localRepo.CreateTag("v1.0.0", localHead(t, reg), nil)
	require.NoError(t, err)
	require.True(t, reg.localCloneHasTags())
	require.True(t, repoHasTags(localRepo))

	// refreshRepo re-clones tag-free.
	require.NoError(t, reg.refreshRepo())
	require.False(t, reg.localCloneHasTags())
	require.FileExists(t, filepath.Join(reg.repoPath, "mods", "mod-a", constants.MANIFEST_JSON))
}

func TestLocalCloneHasTagsMissingRepo(t *testing.T) {
	testutil.NewHarness(t)
	reg := newTestRegistry(t)
	require.False(t, reg.localCloneHasTags())
}

func TestIsUpToDateWithRemote(t *testing.T) {
	reg, _, _ := newClonedRegistry(t)
	headSHA := localHead(t, reg).String()

	tests := []struct {
		name     string
		handler  http.HandlerFunc
		want     bool
		wantErr  bool
		errPart  string
		baseOnly string // overrides the server base URL when set
	}{
		{
			name: "matching sha",
			handler: func(w http.ResponseWriter, r *http.Request) {
				require.Equal(t, "/repos/Subway-Builder-Modded/registry/commits/main", r.URL.Path)
				require.Equal(t, "application/vnd.github.sha", r.Header.Get("Accept"))
				fmt.Fprint(w, headSHA)
			},
			want: true,
		},
		{
			name: "matching sha case-insensitive",
			handler: func(w http.ResponseWriter, r *http.Request) {
				fmt.Fprintf(w, "%s\n", strings.ToUpper(headSHA))
			},
			want: true,
		},
		{
			name: "different sha",
			handler: func(w http.ResponseWriter, r *http.Request) {
				fmt.Fprint(w, "0000000000000000000000000000000000000000")
			},
			want: false,
		},
		{
			name:    "non-200 status",
			handler: func(w http.ResponseWriter, r *http.Request) { w.WriteHeader(http.StatusNotFound) },
			wantErr: true,
			errPart: "returned status 404",
		},
		{
			name:    "empty body",
			handler: func(w http.ResponseWriter, r *http.Request) { fmt.Fprint(w, "  \n") },
			wantErr: true,
			errPart: "returned empty sha",
		},
		{
			name:     "network error",
			baseOnly: "http://127.0.0.1:1",
			wantErr:  true,
		},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			if tc.baseOnly != "" {
				reg.gitHubAPIBaseURL = tc.baseOnly
			} else {
				server := testutil.NewLocalhostServer(t, tc.handler)
				defer server.Close()
				reg.gitHubAPIBaseURL = server.URL
			}

			upToDate, err := reg.isUpToDateWithRemote()
			if tc.wantErr {
				require.Error(t, err)
				if tc.errPart != "" {
					require.Contains(t, err.Error(), tc.errPart)
				}
				return
			}
			require.NoError(t, err)
			require.Equal(t, tc.want, upToDate)
		})
	}
}

func TestIsUpToDateWithRemoteLocalRepoErrors(t *testing.T) {
	t.Run("missing repo", func(t *testing.T) {
		testutil.NewHarness(t)
		reg := newTestRegistry(t)
		_, err := reg.isUpToDateWithRemote()
		require.Error(t, err)
	})

	t.Run("repo without HEAD", func(t *testing.T) {
		testutil.NewHarness(t)
		reg := newTestRegistry(t)
		_, err := git.PlainInit(reg.repoPath, false)
		require.NoError(t, err)
		_, err = reg.isUpToDateWithRemote()
		require.Error(t, err)
	})
}

func TestAreSparseSubtreesUnchanged(t *testing.T) {
	testutil.NewHarness(t)
	reg := newTestRegistry(t)
	sourceDir, repo := newSourceRepo(t)

	writeSourceContent(t, sourceDir, "Mod A")
	first := commitAll(t, repo, "initial")

	// Non-sparse change only: subtrees unchanged.
	require.NoError(t, files.WriteJSON(filepath.Join(sourceDir, "analytics", "stats.json"), "analytics stats", map[string]int{"runs": 2}))
	analyticsOnly := commitAll(t, repo, "analytics only")

	// Sparse change: mods subtree differs.
	writeSourceContent(t, sourceDir, "Mod A v2")
	modsChanged := commitAll(t, repo, "change mods")

	// Sparse dir added where it was previously absent: exactly one side missing.
	require.NoError(t, files.WriteJSON(filepath.Join(sourceDir, "supporters", "index.json"), "supporters index", map[string]int{"schema_version": 1}))
	supportersAdded := commitAll(t, repo, "add supporters")

	// HEAD is now supportersAdded; reset back through the history via comparisons against HEAD.
	tests := []struct {
		name string
		head plumbing.Hash
		next plumbing.Hash
		want bool
	}{
		{"identical commits", first, first, true},
		{"non-sparse change only", first, analyticsOnly, true},
		{"sparse subtree changed", analyticsOnly, modsChanged, false},
		{"sparse dir added on one side", modsChanged, supportersAdded, false},
		{"unresolvable commit", first, plumbing.NewHash("0000000000000000000000000000000000000001"), false},
	}
	wt, err := repo.Worktree()
	require.NoError(t, err)
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			require.NoError(t, wt.Reset(&git.ResetOptions{Commit: tc.head, Mode: git.SoftReset}))
			require.Equal(t, tc.want, reg.areSparseSubtreesUnchanged(repo, tc.next))
		})
	}
}

func TestAreSparseSubtreesUnchangedNoHead(t *testing.T) {
	testutil.NewHarness(t)
	reg := newTestRegistry(t)
	repo, err := git.PlainInit(t.TempDir(), false)
	require.NoError(t, err)
	require.False(t, reg.areSparseSubtreesUnchanged(repo, plumbing.ZeroHash))
}

func TestRepoHasTags(t *testing.T) {
	dir, repo := newSourceRepo(t)
	writeSourceContent(t, dir, "Mod A")
	hash := commitAll(t, repo, "initial")

	require.False(t, repoHasTags(repo))
	_, err := repo.CreateTag("v1.0.0", hash, nil)
	require.NoError(t, err)
	require.True(t, repoHasTags(repo))
}
