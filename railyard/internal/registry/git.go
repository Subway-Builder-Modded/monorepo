package registry

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"railyard/internal/files"
	"railyard/internal/requests"

	"github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/config"
	"github.com/go-git/go-git/v5/plumbing"
	"github.com/go-git/go-git/v5/plumbing/object"
)

// registrySparseCheckoutDirs lists the only directories materialized on disk from the registry clone. Everything else (analytics, schemas, scripts, history etc.) stays compressed inside the git object store and is never written to disk.
var registrySparseCheckoutDirs = []string{"mods", "maps", "authors", "supporters"}

// registryRepoPath is the "owner/repo" form used for GitHub API calls for the `registry` repository
const registryRepoPath = "Subway-Builder-Modded/registry"

// registryRefName is the branch tracked locally and queried for the pre-check fast exit.
const registryRefName = "main"

type remoteCommitResponse struct {
	SHA string `json:"sha"`
}

// openOrClone opens an existing repo or force-clones if missing/corrupt.
func (r *Registry) openOrClone() error {
	repo, err := git.PlainOpen(r.repoPath)
	if err != nil {
		return r.forceClone()
	}

	if _, err := repo.Head(); err != nil {
		return r.forceClone()
	}

	return nil
}

// refreshRepo fetches and resets to origin/main, or force-clones on failure.
func (r *Registry) refreshRepo() error {
	repo, err := git.PlainOpen(r.repoPath)
	if err != nil {
		return r.forceClone()
	}

	if err := r.fetchAndReset(repo); err != nil {
		return r.forceClone()
	}

	return nil
}

// forceClone removes any existing directory and performs a fresh clone,
// checking out only registrySparseCheckoutDirs.
func (r *Registry) forceClone() error {
	// Instantiate monitor to report refresh progress via Wails events
	progress := newProgressWriter(progressPhaseClone, r.emitProgress)
	if err := files.WritePathsAtomically([]files.AtomicWrite{
		files.AtomicDirectoryWrite{
			Path:  r.repoPath,
			Label: "registry clone directory",
			Callback: func(stagingPath string) error {
				repo, cloneErr := git.PlainClone(stagingPath, false, &git.CloneOptions{
					URL:           RegistryRepoURL,
					ReferenceName: plumbing.NewBranchReferenceName("main"),
					SingleBranch:  true,
					Depth:         1,
					NoCheckout:    true,
					Progress:      progress,
				})
				if cloneErr != nil {
					return cloneErr
				}

				// NoCheckout leaves refs/heads/main uncreated, so resolve the remote ref directly rather than relying on HEAD.
				hash, wt, err := prepareOriginMainCheckout(repo)
				if err != nil {
					return err
				}
				return r.materializeSparseCheckout(wt, hash, progressPhaseClone)
			},
		},
	}); err != nil {
		return fmt.Errorf("failed to clone registry repository %q: %w", RegistryRepoURL, err)
	}

	if err := r.fetchFromDisk(); err != nil {
		return fmt.Errorf("failed to load registry data after clone from %q: %w", RegistryRepoURL, err)
	}

	return nil
}

// fetchAndReset fetches from origin, hard-resets the working tree to origin/main, and re-applies the sparse checkout to keep excluded directories off disk.
func (r *Registry) fetchAndReset(repo *git.Repository) error {
	progress := newProgressWriter(progressPhaseFetch, r.emitProgress)
	err := repo.Fetch(&git.FetchOptions{
		RemoteName: "origin",
		RefSpecs: []config.RefSpec{
			"+refs/heads/main:refs/remotes/origin/main",
		},
		Force:    true,
		Depth:    1,
		Progress: progress,
	})
	if err != nil && err != git.NoErrAlreadyUpToDate {
		return fmt.Errorf("failed to fetch registry: %w", err)
	}

	hash, wt, err := prepareOriginMainCheckout(repo)
	if err != nil {
		return err
	}

	// Early exit: if the new commit's sparse subtree hashes match the local HEAD's hashes, every file we materialize is already correct on disk.
	// This is particularly useful given that the majority of remote commits are related to hourly analytics jobs that modify no content files.
	// In this case we can advance HEAD without touching the working tree.
	if r.sparseSubtreesUnchanged(repo, hash) {
		if err := wt.Reset(&git.ResetOptions{
			Commit: hash,
			Mode:   git.SoftReset,
		}); err != nil {
			return fmt.Errorf("failed to advance HEAD after tree-equal fetch: %w", err)
		}
		return nil
	}

	if err := wt.Reset(&git.ResetOptions{
		Commit: hash,
		Mode:   git.HardReset,
	}); err != nil {
		return fmt.Errorf("failed to reset to origin/main: %w", err)
	}

	// Re-apply sparse checkout after reset — go-git's hard reset may reset the sparse checkout; this trims it back to registrySparseCheckoutDirs.
	return r.materializeSparseCheckout(wt, plumbing.ZeroHash, progressPhaseFetch)
}

// prepareOriginMainCheckout resolves the hash of the remote and acquires the worktree.
func prepareOriginMainCheckout(repo *git.Repository) (plumbing.Hash, *git.Worktree, error) {
	ref, err := repo.Reference(plumbing.NewRemoteReferenceName("origin", "main"), true)
	if err != nil {
		return plumbing.ZeroHash, nil, fmt.Errorf("failed to resolve origin/main: %w", err)
	}
	wt, err := repo.Worktree()
	if err != nil {
		return plumbing.ZeroHash, nil, fmt.Errorf("failed to get worktree: %w", err)
	}
	return ref.Hash(), wt, nil
}

// materializeSparseCheckout emits a "Materializing files" progress event for the given phase and applies registrySparseCheckoutDirs to the worktree. Pass plumbing.ZeroHash to materialize the current HEAD (post-reset case in fetchAndReset); pass a specific hash to check it out directly (post-clone NoCheckout case in forceClone).
// NOTE: If we ever need new directories from the registry, update the registrySparseCheckoutDirs list above — both call sites flow through this single helper.
func (r *Registry) materializeSparseCheckout(wt *git.Worktree, hash plumbing.Hash, phase string) error {
	r.emitProgress(RegistryProgress{
		Stage:   progressStageCheckout,
		Phase:   phase,
		Percent: -1,
		Message: "Materializing files",
	})
	opts := &git.CheckoutOptions{SparseCheckoutDirectories: registrySparseCheckoutDirs}
	if !hash.IsZero() {
		opts.Hash = hash
	}
	return wt.Checkout(opts)
}

// isUpToDateWithRemote queries the GitHub API for the registry's latest commit on the tracked branch (main) and compares it to the local HEAD.
func (r *Registry) isUpToDateWithRemote() (bool, error) {
	repo, err := git.PlainOpen(r.repoPath)
	// If an error occurs, return error and allow downstream to fall back to full fetch
	if err != nil {
		return false, err
	}
	head, err := repo.Head()
	if err != nil {
		return false, err
	}
	localSHA := head.Hash().String()

	apiURL := fmt.Sprintf(
		"%s/repos/%s/commits/%s",
		strings.TrimRight(r.githubAPIBase(), "/"),
		registryRepoPath,
		registryRefName,
	)

	resp, err := requests.GetWithGithubToken(r.httpClient, requests.GithubTokenRequestArgs{
		URL:         apiURL,
		GitHubToken: r.config.GetGithubToken(),
		Headers: map[string]string{
			"Accept": "application/vnd.github+json",
		},
	})
	if err != nil {
		return false, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return false, fmt.Errorf("registry precheck returned status %d", resp.StatusCode)
	}

	body, err := io.ReadAll(io.LimitReader(resp.Body, 64*1024))
	if err != nil {
		return false, err
	}
	var parsed remoteCommitResponse
	if err := json.Unmarshal(body, &parsed); err != nil {
		return false, err
	}
	if parsed.SHA == "" {
		return false, fmt.Errorf("registry precheck returned empty sha")
	}
	return strings.EqualFold(parsed.SHA, localSHA), nil
}

// sparseSubtreesUnchanged returns true when every directory in registrySparseCheckoutDirs has the same tree hash in the local HEAD commit and the supplied hash from remote.
// Any failure to resolve commits/trees returns false so the downstream can fall back to the full reset+checkout path.
func (r *Registry) sparseSubtreesUnchanged(repo *git.Repository, newCommitHash plumbing.Hash) bool {
	head, err := repo.Head()
	if err != nil {
		return false
	}

	var trees [2]*object.Tree
	for i, hash := range [2]plumbing.Hash{head.Hash(), newCommitHash} {
		commit, err := repo.CommitObject(hash)
		if err != nil {
			return false
		}
		trees[i], err = commit.Tree()
		if err != nil {
			return false
		}
	}

	for _, dir := range registrySparseCheckoutDirs {
		oldEntry, oldErr := trees[0].FindEntry(dir)
		newEntry, newErr := trees[1].FindEntry(dir)
		// Both directories absent: vacuously equal.
		if oldErr != nil && newErr != nil {
			continue
		}
		// Exactly one missing: one has definitely changed.
		if oldErr != nil || newErr != nil {
			return false
		}
		if oldEntry.Hash != newEntry.Hash {
			return false
		}
	}
	return true
}
