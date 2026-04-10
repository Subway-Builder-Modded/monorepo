package registry

import (
	"fmt"

	"railyard/internal/files"

	"github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/config"
	"github.com/go-git/go-git/v5/plumbing"
)

// registrySparseCheckoutDirs lists the only directories materialized on disk from the registry clone. Everything else (analytics, schemas, scripts, history etc.) stays compressed inside the git object store and is never written to disk.
var registrySparseCheckoutDirs = []string{"mods", "maps", "authors", "supporters"}

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
				})
				if cloneErr != nil {
					return cloneErr
				}

				wt, err := repo.Worktree()
				if err != nil {
					return fmt.Errorf("failed to get worktree: %w", err)
				}

				// Use sparse checkout to only materialize the directories we need
				// NOTE: If we ever need new directories from the registry, we must update the registrySparseCheckoutDirs list above and ensure this logic is applied in fetchAndReset as well.
				return wt.Checkout(&git.CheckoutOptions{
					SparseCheckoutDirectories: registrySparseCheckoutDirs,
				})
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
	err := repo.Fetch(&git.FetchOptions{
		RemoteName: "origin",
		RefSpecs: []config.RefSpec{
			"+refs/heads/main:refs/remotes/origin/main",
		},
		Force: true,
		Depth: 1,
	})
	if err != nil && err != git.NoErrAlreadyUpToDate {
		return fmt.Errorf("failed to fetch registry: %w", err)
	}

	ref, err := repo.Reference(plumbing.NewRemoteReferenceName("origin", "main"), true)
	if err != nil {
		return fmt.Errorf("failed to resolve origin/main: %w", err)
	}

	wt, err := repo.Worktree()
	if err != nil {
		return fmt.Errorf("failed to get worktree: %w", err)
	}

	if err := wt.Reset(&git.ResetOptions{
		Commit: ref.Hash(),
		Mode:   git.HardReset,
	}); err != nil {
		return fmt.Errorf("failed to reset to origin/main: %w", err)
	}

	// Re-apply sparse checkout after reset — go-git's hard reset may reset the sparse checkout; this trims it back to registrySparseCheckoutDirs.
	if err := wt.Checkout(&git.CheckoutOptions{
		SparseCheckoutDirectories: registrySparseCheckoutDirs,
	}); err != nil {
		return fmt.Errorf("failed to apply sparse checkout after reset: %w", err)
	}

	return nil
}
