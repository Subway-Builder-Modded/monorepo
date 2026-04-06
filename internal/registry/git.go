package registry

import (
	"fmt"

	"railyard/internal/files"

	"github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/config"
	"github.com/go-git/go-git/v5/plumbing"
)

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

// forceClone removes any existing directory and performs a fresh clone.
func (r *Registry) forceClone() error {
	if err := files.WritePathsAtomically([]files.AtomicWrite{
		files.AtomicDirectoryWrite{
			Path:  r.repoPath,
			Label: "registry clone directory",
			Callback: func(stagingPath string) error {
				cloneOpts := &git.CloneOptions{
					URL:           RegistryRepoURL,
					ReferenceName: plumbing.NewBranchReferenceName("main"),
					SingleBranch:  true,
					Depth:         1,
				}
				_, cloneErr := git.PlainClone(stagingPath, false, cloneOpts)
				return cloneErr
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

// fetchAndReset fetches from origin and hard-resets the working tree to
// origin/main.
func (r *Registry) fetchAndReset(repo *git.Repository) error {
	fetchOpts := &git.FetchOptions{
		RemoteName: "origin",
		RefSpecs: []config.RefSpec{
			"+refs/heads/main:refs/remotes/origin/main",
		},
		Force: true,
	}
	err := repo.Fetch(fetchOpts)
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

	err = wt.Reset(&git.ResetOptions{
		Commit: ref.Hash(),
		Mode:   git.HardReset,
	})
	if err != nil {
		return fmt.Errorf("failed to reset to origin/main: %w", err)
	}

	return nil
}
