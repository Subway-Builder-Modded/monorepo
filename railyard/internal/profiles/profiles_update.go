package profiles

import (
	"errors"
	"fmt"
	"strings"

	"railyard/internal/types"
	"railyard/internal/utils"

	semver "github.com/Masterminds/semver/v3"
)

// ===== Profile Mutations ===== //

// UpdateSubscriptions mutates the runtime state of the specified profile's subscriptions
func (s *UserProfiles) UpdateSubscriptions(req types.UpdateSubscriptionsRequest) types.UpdateSubscriptionsResult {
	s.logRequest("UpdateSubscriptions", "profile_id", req.ProfileID, "action", req.Action, "asset_count", len(req.Assets), "apply_mode", req.ApplyMode)

	if !types.IsValidUpdateSubscriptionsApplyMode(req.ApplyMode) {
		panic(fmt.Sprintf("invalid UpdateSubscriptions apply mode %q", req.ApplyMode))
	}

	s.mu.Lock()
	result := s.updateProfileSubscriptions(req)
	s.mu.Unlock()
	if result.Status == types.ResponseError {
		return result
	}

	if shouldPersist(req.ApplyMode) {
		cancelErrors := make([]types.UserProfilesError, 0)
		cancelFailed := false
		for _, operation := range result.Operations {
			if operation.Action != types.SubscriptionActionUnsubscribe {
				continue
			}
			cancelResp := s.Downloader.UninstallAsset(operation.Type, operation.AssetID)
			if cancelResp.Status == types.ResponseError {
				s.Logger.Warn("Failed to enqueue uninstall cancellation", "asset_type", operation.Type, "asset_id", operation.AssetID, "message", cancelResp.Message)
				cancelErrors = append(
					cancelErrors,
					userProfilesError(
						req.ProfileID,
						operation.AssetID,
						operation.Type,
						types.ErrorSyncFailed,
						cancelResp.ErrorType,
						cancelResp.Message,
					),
				)
				cancelFailed = true
				continue
			}
			if cancelResp.Status == types.ResponseWarn {
				cancelErrors = append(
					cancelErrors,
					userProfilesError(
						req.ProfileID,
						operation.AssetID,
						operation.Type,
						types.ErrorSyncFailed,
						cancelResp.ErrorType,
						cancelResp.Message,
					),
				)
			}
		}
		if len(cancelErrors) > 0 {
			result.Errors = append(result.Errors, cancelErrors...)
			if cancelFailed {
				result.Status = types.ResponseError
				result.Message = "Failed to cancel pending installs"
			} else if result.Status == types.ResponseSuccess {
				result.Status = types.ResponseWarn
				result.Message = "Subscriptions updated with cancellation warnings"
			}
		}

		// Unsubscribe requests already issue direct uninstall/cancel operations above. Skip the full sync routine to avoid redundant processing
		if req.Action == types.SubscriptionActionUnsubscribe {
			return result
		}
		if !shouldSync(req.ApplyMode) {
			return result
		}

		// TODO: Implement per-profile request coalescing so burst frontend updates reconcile once
		// against the latest desired subscriptions state instead of running multiple stale snapshots.
		syncResult := s.SyncSubscriptions(req.ProfileID, req.ReplaceOnConflict, req.SkipDependencyInstall)
		if syncResult.Status == types.ResponseError {
			result.Status = types.ResponseError
			result.Message = "Failed to sync subscriptions"
			result.Errors = append(result.Errors, syncResult.Errors...)
			return result
		}
		if syncResult.Status == types.ResponseWarn {
			result.Status = types.ResponseWarn
			if strings.TrimSpace(syncResult.Message) != "" {
				result.Message = syncResult.Message
			} else {
				result.Message = "Subscriptions updated with sync warnings"
			}
			result.Errors = append(result.Errors, syncResult.Errors...)
		}

		// For replace-on-conflict subscribe operations, defer conflict subscription cleanup until after sync succeeds so cancellations/failures keep prior conflicting subscriptions.
		if req.Action == types.SubscriptionActionSubscribe && req.ReplaceOnConflict && len(result.Conflicts) > 0 {
			// Defer conflict subscription removal until after sync succeeds so cancel/failure paths  preserve the pre-existing conflicting subscription state.
			updatedProfile, conflictOps, conflictErr := s.applyAndPersistConflictReplacements(req.ProfileID, result.Conflicts)
			if conflictErr != nil {
				result.Status = types.ResponseError
				result.Message = "Failed to finalize map conflict replacement"
				result.Errors = append(result.Errors, *conflictErr)
				return result
			}
			result.Profile = updatedProfile
			result.Operations = appendOperations(result.Operations, conflictOps)
		}
	}

	return result
}

// UpdateSubscriptionsToLatest resolves the latest available registry versions for current profile subscriptions,
// updates those that are behind, persists updates to disk, and runs sync/install-uninstall routines.
func (s *UserProfiles) UpdateSubscriptionsToLatest(req types.UpdateSubscriptionsToLatestRequest) types.UpdateSubscriptionsResult {
	s.logRequest(
		"UpdateSubscriptionsToLatest",
		"profile_id", req.ProfileID,
		"apply", req.Apply,
		"target_count", len(req.Targets),
	)

	requestType := types.LatestCheck
	if req.Apply {
		requestType = types.LatestApply
	}

	profile, requiredUpdates, pendingUpdates, resultWarnings, profileErr := s.resolveLatestUpdatesForProfile(req.ProfileID, req.Targets)
	if profileErr != nil {
		return profileNotFoundUpdateResult(profileErr, requestType, "Profile not found")
	}

	for _, warn := range resultWarnings {
		s.Logger.Warn(
			"Skipped subscription while resolving latest version",
			"profile_id", warn.ProfileID,
			"asset_id", warn.AssetID,
			"asset_type", warn.AssetType,
			"error_type", warn.ErrorType,
			"error", warn.Message,
		)
	}

	pendingCount := len(pendingUpdates)
	hasUpdates := pendingCount > 0

	if !req.Apply || !hasUpdates {
		status := types.ResponseSuccess
		message := "Resolved subscription update availability"
		if req.Apply && !hasUpdates {
			message = "All subscriptions already at latest version; no updates applied"
		}
		if len(resultWarnings) > 0 {
			status = types.ResponseWarn
			if req.Apply && !hasUpdates {
				message = fmt.Sprintf("no updates applied; skipped %d subscriptions during latest-version resolution", len(resultWarnings))
			} else {
				message = fmt.Sprintf("Resolved update availability with %d warning(s)", len(resultWarnings))
			}
		}

		result := updateResultBase(requestType, status, message)
		result.HasUpdates = hasUpdates
		result.PendingCount = pendingCount
		result.PendingUpdates = pendingUpdates
		result.Profile = profile
		result.Errors = resultWarnings
		return result
	}

	updateResult := s.UpdateSubscriptions(types.UpdateSubscriptionsRequest{
		ProfileID: req.ProfileID,
		Assets:    requiredUpdates,
		Action:    types.SubscriptionActionSubscribe,
		ApplyMode: types.UpdateSubscriptionsPersistAndSync,
	})

	status := updateResult.Status
	message := updateResult.Message
	errors := updateResult.Errors
	if len(resultWarnings) > 0 {
		if status == types.ResponseSuccess {
			status = types.ResponseWarn
		}
		message = fmt.Sprintf("Updated %d subscriptions; skipped %d subscriptions during latest-version resolution", len(updateResult.Operations), len(resultWarnings))
		errors = append(errors, resultWarnings...)
	}

	result := updateResultBase(types.LatestApply, status, message)
	result.HasUpdates = hasUpdates
	result.PendingCount = pendingCount
	result.PendingUpdates = pendingUpdates
	result.Applied = true
	result.Profile = updateResult.Profile
	result.Persisted = updateResult.Persisted
	result.Operations = updateResult.Operations
	result.Errors = errors
	return result
}

func (s *UserProfiles) resolveLatestUpdatesForProfile(
	profileID string,
	targets []types.SubscriptionUpdateTarget,
) (
	types.UserProfile,
	map[string]types.SubscriptionUpdateItem,
	[]types.PendingSubscriptionUpdate,
	[]types.UserProfilesError,
	*types.UserProfilesError,
) {
	profile, _, profileErr := s.profileSnapshot(profileID)
	if profileErr != nil {
		return types.UserProfile{}, map[string]types.SubscriptionUpdateItem{}, []types.PendingSubscriptionUpdate{}, []types.UserProfilesError{}, profileErr
	}

	requiredUpdates, pendingUpdates, warnings := s.resolveLatestSubscriptionUpdates(profileID, profile, targets)
	return profile, requiredUpdates, pendingUpdates, warnings, nil
}

// ===== Registry Helpers ===== //

type reconcileResponse struct {
	noChangeMessage string
	persistMessage  string
	summary         func(count int) string
	notice          func(profileID string, operation types.SubscriptionOperation) types.UserProfilesError
}

// finalizeReconcile persists the profile mutations from a reconciliation pass and passes back a summary result.
func (s *UserProfiles) finalizeReconcile(
	stateCopy types.UserProfilesState,
	profileID string,
	profile types.UserProfile,
	operations []types.SubscriptionOperation,
	response reconcileResponse,
) types.UpdateSubscriptionsResult {
	// Nothing to persist when no operations were applied, so skip directly to a success.
	if len(operations) == 0 {
		s.Logger.Info("Subscription reconciliation completed with no changes", "profile_id", profileID)
		result := updateResultBase(types.UpdateSubscriptions, types.ResponseSuccess, response.noChangeMessage)
		result.Profile = profile
		return result
	}

	// Otherwise, commit the mutations to the store and return a summary of the applied operations with any persistence errors.
	if err := s.commitProfileMutation(&stateCopy, profileID, profile, true); err != nil {
		persistErr := updateSubscriptionError(profileID, "", "", types.ErrorPersistFailed, fmt.Errorf("%s: %w", response.persistMessage, err))
		return subscriptionErrorResult(types.UpdateSubscriptions, profile, operations, response.persistMessage, persistErr)
	}

	result := updateResultBase(types.UpdateSubscriptions, types.ResponseWarn, response.summary(len(operations)))
	result.Applied = true
	result.Profile = profile
	result.Persisted = true
	result.Operations = operations
	for _, operation := range operations {
		result.Errors = append(result.Errors, response.notice(profileID, operation))
	}
	return result
}

// subscriptionErrorResult builds an error UpdateSubscriptionsResult for the given request type, carrying any operations applied so far and the supplied error.
func subscriptionErrorResult(
	requestType types.UpdateSubscriptionRequestType,
	profile types.UserProfile,
	operations []types.SubscriptionOperation,
	message string,
	err types.UserProfilesError,
) types.UpdateSubscriptionsResult {
	result := updateResultBase(requestType, types.ResponseError, message)
	result.Profile = profile
	result.Operations = operations
	result.Errors = []types.UserProfilesError{err}
	return result
}

// ReconcileLocalMapSubscriptions removes local-map subscriptions that are no longer recoverable from installed state.
// Primarily used after bootstrap/swap fallback paths where local maps cannot be restored from archive.
func (s *UserProfiles) ReconcileLocalMapSubscriptions(profileID string) types.UpdateSubscriptionsResult {
	s.logRequest("ReconcileLocalMapSubscriptions", "profile_id", profileID)

	s.mu.Lock()
	defer s.mu.Unlock()

	stateCopy, profile, profileErr := s.resolveProfileFromCopy(profileID)
	if profileErr != nil {
		s.Logger.Error("Profile not found", profileErr, "profile_id", profileID)
		return profileNotFoundUpdateResult(profileErr, types.UpdateSubscriptions, "profile not found")
	}

	// Compile a list of currently installed local maps to determine which local map subscriptions are still recoverable (if any)
	currentLocalMapIDs := make(map[string]struct{})
	for _, installedMap := range s.Registry.GetInstalledMaps() {
		if !installedMap.IsLocal {
			continue
		}
		currentLocalMapIDs[installedMap.ID] = struct{}{}
	}

	cloneProfileSubscriptions(&profile)
	assetsToRemove := make(map[string]types.SubscriptionUpdateItem)
	for localMapID := range profile.Subscriptions.LocalMaps {
		if _, exists := currentLocalMapIDs[localMapID]; exists {
			continue
		}
		// Append unrecoverable local map subscription to removal list
		assetsToRemove[localMapID] = types.SubscriptionUpdateItem{
			Type:    types.AssetTypeMap,
			IsLocal: true,
		}
	}

	// Apply mutations to remove unrecoverable local map subscriptions from the profile state so that it no longer erroneously references missing installed data
	operations := make([]types.SubscriptionOperation, 0, len(assetsToRemove))
	for assetID, item := range assetsToRemove {
		operation, opErr := applySubscriptionMutation(&profile, types.SubscriptionActionUnsubscribe, strings.TrimSpace(assetID), item)
		if opErr != nil {
			s.Logger.Error("Failed to reconcile local map subscription", *opErr, "asset_id", assetID, "profile_id", profileID)
			return subscriptionErrorResult(types.UpdateSubscriptions, profile, nil, "Failed to reconcile local map subscriptions", *opErr)
		}
		operations = appendOperation(operations, operation)
	}

	return s.finalizeReconcile(stateCopy, profileID, profile, operations, reconcileResponse{
		noChangeMessage: "Local map subscriptions reconciled",
		persistMessage:  "Failed to persist local map subscription reconciliation",
		summary: func(count int) string {
			return fmt.Sprintf("Removed %d unrecoverable local map subscription(s)", count)
		},
		notice: func(profileID string, operation types.SubscriptionOperation) types.UserProfilesError {
			return userProfilesError(
				profileID,
				operation.AssetID,
				types.AssetTypeMap,
				types.ErrorArchiveMissing,
				"",
				fmt.Sprintf("Removed local map subscription %q because installed data is unavailable", operation.AssetID),
			)
		},
	})
}

// ReconcileSubscriptionVersions repairs remote map and mod subscriptions set to a version that is not installable (not in the integrity-complete set), which can be:
// - an asset version that never passed integrity
// - an asset version that originally passed integrity, but was later removed upstream.
// Such subscriptions can be invisible in the library if no version was ever installed and fail every subsequent sync, so they must be reconciled before sync runs.
func (s *UserProfiles) ReconcileSubscriptionVersions(profileID string) types.UpdateSubscriptionsResult {
	s.logRequest("ReconcileSubscriptionVersions", "profile_id", profileID)

	s.mu.Lock()
	defer s.mu.Unlock()

	stateCopy, profile, profileErr := s.resolveProfileFromCopy(profileID)
	if profileErr != nil {
		s.Logger.Error("Profile not found", profileErr, "profile_id", profileID)
		return profileNotFoundUpdateResult(profileErr, types.UpdateSubscriptions, "profile not found")
	}

	cloneProfileSubscriptions(&profile)

	operations := make([]types.SubscriptionOperation, 0)
	// Reconcile every remote subscription type
	for _, bucket := range profile.Subscriptions.RemoteSubscriptions() {
		for assetID, pinnedVersion := range bucket.Entries {
			operation, opErr := s.reconcileSubscriptionVersion(&profile, profileID, bucket.AssetType, assetID, pinnedVersion)
			if opErr != nil {
				s.Logger.Error("Failed to reconcile subscription version", *opErr, "asset_type", bucket.AssetType, "asset_id", assetID, "profile_id", profileID)
				return subscriptionErrorResult(types.UpdateSubscriptions, profile, nil, "Failed to reconcile subscription versions", *opErr)
			}
			if operation != nil {
				operations = appendOperation(operations, operation)
			}
		}
	}

	return s.finalizeReconcile(stateCopy, profileID, profile, operations, reconcileResponse{
		noChangeMessage: "Subscription versions reconciled",
		persistMessage:  "Failed to persist subscription version reconciliation",
		summary: func(count int) string {
			return fmt.Sprintf("Reconciled %d subscription(s) pinned to non-installable versions", count)
		},
		notice: subscriptionReconcileNotice,
	})
}

// reconcileSubscriptionVersion repairs a single subscription version that is not installable.
// It returns the applied subscription operation, or nil when no change is needed or the lookup could not be completed.
func (s *UserProfiles) reconcileSubscriptionVersion(
	profile *types.UserProfile,
	profileID string,
	assetType types.AssetType,
	assetID string,
	pinnedVersion string,
) (*types.SubscriptionOperation, *types.UserProfilesError) {
	pinned := strings.TrimSpace(pinnedVersion)

	installable, lookupErr := s.Registry.GetInstallableVersions(assetType, assetID)
	if lookupErr == nil {
		for _, version := range installable {
			if strings.TrimSpace(version.Version) == pinned {
				return nil, nil // still installable; nothing to reconcile
			}
		}
		// Downgrade to the latest installable version, or purge when none remain installable.
		if len(installable) > 0 {
			return s.downgradeSubscriptionToInstallable(profile, profileID, assetType, assetID, pinned, installable)
		}
		return s.purgeNonInstallableSubscription(profile, profileID, assetType, assetID, pinned)
	}

	// Lookup failed: only purge when the loaded integrity report definitively has no installable version, so a transient or unloaded registry never purges a valid subscription.
	if s.assetHasNoInstallableVersions(assetType, assetID) {
		return s.purgeNonInstallableSubscription(profile, profileID, assetType, assetID, pinned)
	}
	return s.skipVersionReconcile("Skipping subscription version reconciliation; installable versions unavailable", assetType, assetID, profileID, lookupErr)
}

// skipVersionReconcile logs that a subscription was left unchanged during version reconciliation and
// returns a no-op result (nil operation, nil error).
func (s *UserProfiles) skipVersionReconcile(message string, assetType types.AssetType, assetID, profileID string, cause error) (*types.SubscriptionOperation, *types.UserProfilesError) {
	s.Logger.Warn(message, "asset_type", assetType, "asset_id", assetID, "profile_id", profileID, "error", cause.Error())
	return nil, nil
}

// downgradeSubscriptionToInstallable rewrites the subscription to the latest installable version.
func (s *UserProfiles) downgradeSubscriptionToInstallable(
	profile *types.UserProfile,
	profileID string,
	assetType types.AssetType,
	assetID string,
	pinned string,
	installable []types.VersionInfo,
) (*types.SubscriptionOperation, *types.UserProfilesError) {
	latest, err := latestSemverVersion(installable)
	if err != nil {
		return s.skipVersionReconcile("Skipping subscription version reconciliation; failed to resolve latest installable version", assetType, assetID, profileID, err)
	}
	s.Logger.Warn(
		"Downgrading subscription pinned to non-installable version",
		"asset_type", assetType,
		"asset_id", assetID,
		"profile_id", profileID,
		"pinned_version", pinned,
		"installable_version", latest,
	)
	return applySubscriptionMutation(profile, types.SubscriptionActionSubscribe, assetID, types.SubscriptionUpdateItem{
		Type:    assetType,
		Version: types.Version(latest),
	})
}

// purgeNonInstallableSubscription removes a subscription that has no installable version available.
func (s *UserProfiles) purgeNonInstallableSubscription(
	profile *types.UserProfile,
	profileID string,
	assetType types.AssetType,
	assetID string,
	pinned string,
) (*types.SubscriptionOperation, *types.UserProfilesError) {
	s.Logger.Warn(
		"Purging subscription pinned to non-installable version with no installable alternative",
		"asset_type", assetType,
		"asset_id", assetID,
		"profile_id", profileID,
		"pinned_version", pinned,
	)
	return applySubscriptionMutation(profile, types.SubscriptionActionUnsubscribe, assetID, types.SubscriptionUpdateItem{
		Type: assetType,
	})
}

// assetHasNoInstallableVersions reports whether the registry's integrity set is available and undeniably lists no complete version for the asset (delisted or never approved).
func (s *UserProfiles) assetHasNoInstallableVersions(assetType types.AssetType, assetID string) bool {
	report, err := s.Registry.GetIntegrityReport(assetType)
	if err != nil || len(report.Listings) == 0 {
		// Returns false when the report is not loaded, so a missing or unreadable registry never triggers a purge.
		return false
	}
	listing, ok := report.Listings[assetID]
	if !ok {
		return true
	}
	return !listing.HasCompleteVersion
}

// subscriptionReconcileNotice builds an informational error describing a reconciliation operation.
func subscriptionReconcileNotice(profileID string, operation types.SubscriptionOperation) types.UserProfilesError {
	if operation.Action == types.SubscriptionActionUnsubscribe {
		return userProfilesError(
			profileID,
			operation.AssetID,
			operation.Type,
			types.ErrorLookupFailed,
			"",
			fmt.Sprintf("Purged subscription %q because no installable version is available", operation.AssetID),
		)
	}
	return userProfilesError(
		profileID,
		operation.AssetID,
		operation.Type,
		types.ErrorLookupFailed,
		"",
		fmt.Sprintf("Downgraded subscription %q to installable version %q", operation.AssetID, strings.TrimSpace(string(operation.Version))),
	)
}

func (s *UserProfiles) resolveLatestSubscriptionUpdates(
	profileID string,
	profile types.UserProfile,
	targets []types.SubscriptionUpdateTarget,
) (
	map[string]types.SubscriptionUpdateItem,
	[]types.PendingSubscriptionUpdate,
	[]types.UserProfilesError,
) {
	updates := make(map[string]types.SubscriptionUpdateItem)
	pendingUpdates := make([]types.PendingSubscriptionUpdate, 0)
	warnings := make([]types.UserProfilesError, 0)
	targetSet := makeTargetSet(targets)

	latestAssetUpdates(
		latestSubscriptionArgs[types.MapManifest]{
			assetType:     types.AssetTypeMap,
			subscriptions: profile.Subscriptions.Maps,
			getManifests:  s.Registry.GetMaps,
			idFn:          func(m types.MapManifest) string { return m.ID },
		},
		profileID, targetSet, s.Registry.GetInstallableVersions, updates, &pendingUpdates, &warnings,
	)

	latestAssetUpdates(
		latestSubscriptionArgs[types.ModManifest]{
			assetType:     types.AssetTypeMod,
			subscriptions: profile.Subscriptions.Mods,
			getManifests:  s.Registry.GetMods,
			idFn:          func(m types.ModManifest) string { return m.ID },
		},
		profileID, targetSet, s.Registry.GetInstallableVersions, updates, &pendingUpdates, &warnings,
	)

	return updates, pendingUpdates, warnings
}

type latestSubscriptionArgs[T any] struct {
	assetType     types.AssetType
	subscriptions map[string]string
	getManifests  func() []T
	idFn          func(T) string
}

func latestAssetUpdates[T any](
	args latestSubscriptionArgs[T],
	profileID string,
	targetSet map[assetVersionKey]struct{},
	getInstallableVersionsFn func(types.AssetType, string) ([]types.VersionInfo, error),
	updates map[string]types.SubscriptionUpdateItem,
	pendingUpdates *[]types.PendingSubscriptionUpdate,
	errors *[]types.UserProfilesError,
) {
	manifestIDs := make(map[string]struct{})
	for _, manifest := range args.getManifests() {
		manifestIDs[args.idFn(manifest)] = struct{}{}
	}

	for assetID, currentVersion := range args.subscriptions {
		// Check if the asset is within the requested update targets (if any were given)
		if !shouldUpdate(targetSet, args.assetType, assetID) {
			continue
		}

		if _, ok := manifestIDs[assetID]; !ok {
			*errors = append(*errors, updateSubscriptionError(
				profileID, assetID, args.assetType, types.ErrorLookupFailed,
				fmt.Errorf("Asset %q missing from registry manifests for %s", assetID, args.assetType),
			))
			continue
		}

		latestVersion, resolveErr := resolveLatestInstallableVersion(args.assetType, assetID, getInstallableVersionsFn)
		if resolveErr != nil {
			*errors = append(*errors, updateSubscriptionError(
				profileID, assetID, args.assetType, types.ErrorLookupFailed,
				fmt.Errorf("Failed to resolve latest version for %s %q: %w", args.assetType, assetID, resolveErr),
			))
			continue
		}

		if strings.TrimSpace(currentVersion) != latestVersion {
			updates[assetID] = types.SubscriptionUpdateItem{
				Type:    args.assetType,
				Version: types.Version(latestVersion),
			}
			*pendingUpdates = append(*pendingUpdates, types.PendingSubscriptionUpdate{
				AssetID:        assetID,
				Type:           args.assetType,
				CurrentVersion: types.Version(strings.TrimSpace(currentVersion)),
				LatestVersion:  types.Version(latestVersion),
			})
		}
	}
}

type assetVersionKey struct {
	AssetType types.AssetType
	AssetID   string
}

func makeTargetSet(targets []types.SubscriptionUpdateTarget) map[assetVersionKey]struct{} {
	targetSet := make(map[assetVersionKey]struct{}, len(targets))
	for _, target := range targets {
		targetSet[assetVersionKey{
			AssetType: target.Type,
			AssetID:   target.AssetID,
		}] = struct{}{}
	}
	return targetSet
}

func shouldUpdate(targetSet map[assetVersionKey]struct{}, assetType types.AssetType, assetID string) bool {
	if len(targetSet) == 0 {
		return true
	}
	_, ok := targetSet[assetVersionKey{
		AssetType: assetType,
		AssetID:   assetID,
	}]
	return ok
}

// resolveLatestInstallableVersion returns the latest integrity-complete version for the asset.
// Resolving against the installable set rather than the raw upstream release list ensures auto-update (and other consumers of this function) never advance a subscription to a version the downloader would reject.
func resolveLatestInstallableVersion(
	assetType types.AssetType,
	assetID string,
	getInstallableVersionsFn func(types.AssetType, string) ([]types.VersionInfo, error),
) (string, error) {
	versions, err := getInstallableVersionsFn(assetType, assetID)
	if err != nil {
		return "", fmt.Errorf("Failed to resolve installable versions: %w", err)
	}
	return latestSemverVersion(versions)
}

// latestSemverVersion returns the highest semver version from the provided list.
func latestSemverVersion(versions []types.VersionInfo) (string, error) {
	if len(versions) == 0 {
		return "", errors.New("No versions found")
	}

	// Assume Registry only contains valid semver versions and normalize with potential "v" prefix.
	normalize := func(v string) string {
		if strings.HasPrefix(v, "v") {
			return v
		}
		return "v" + v
	}

	best := versions[0].Version
	current, err := semver.NewVersion(strings.TrimPrefix(normalize(best), "v"))
	if err != nil {
		return "", fmt.Errorf("failed to parse initial semver version %q: %w", best, err)
	}
	for _, version := range versions[1:] {
		other, parseErr := semver.NewVersion(strings.TrimPrefix(normalize(version.Version), "v"))
		if parseErr != nil {
			return "", fmt.Errorf("failed to parse semver version %q: %w", version.Version, parseErr)
		}
		if other.GreaterThan(current) {
			current = other
			best = version.Version
		}
	}
	return best, nil
}

// ===== Runtime Mutation Helpers ===== //

func (s *UserProfiles) updateProfileSubscriptions(req types.UpdateSubscriptionsRequest) types.UpdateSubscriptionsResult {
	stateCopy, profile, profileErr := s.resolveProfileFromCopy(req.ProfileID)
	if profileErr != nil {
		s.Logger.Error("Profile not found", profileErr, "profile_id", req.ProfileID)
		return profileNotFoundUpdateResult(profileErr, types.UpdateSubscriptions, "profile not found")
	}

	cloneProfileSubscriptions(&profile)

	operations := make([]types.SubscriptionOperation, 0, len(req.Assets))
	conflicts := make([]types.MapCodeConflict, 0)
	if req.Action == types.SubscriptionActionSubscribe && shouldPersist(req.ApplyMode) {
		// Check for map code conflicts before applying any mutations to surface surface confirmation request to FE
		mapCodeConflicts := s.checkMapCodeConflicts(req)
		if len(mapCodeConflicts) > 0 && !req.ReplaceOnConflict {
			return conflictWarningResult(
				types.UpdateSubscriptions,
				"Map code conflict detected. Confirm replacement to continue.",
				profile,
				mapCodeConflicts,
			)
		}
		// Conflict subscriptions are intentionally not removed here.
		// They are removed only after a successful sync in UpdateSubscriptions.
		conflicts = mapCodeConflicts
	}

	for assetID, item := range req.Assets {
		operation, opErr := applySubscriptionMutation(&profile, req.Action, strings.TrimSpace(assetID), item)
		if opErr != nil {
			s.Logger.Error("Failed to apply subscription mutation", *opErr, "asset_id", assetID, "asset_type", item.Type, "action", req.Action)
			return subscriptionErrorResult(types.UpdateSubscriptions, profile, nil, "Failed to apply subscription mutation", *opErr)
		}
		operations = appendOperation(operations, operation)
	}

	if err := s.commitProfileMutation(&stateCopy, req.ProfileID, profile, shouldPersist(req.ApplyMode)); err != nil {
		persistErr := updateSubscriptionError(req.ProfileID, "", "", types.ErrorPersistFailed, fmt.Errorf("Failed to persist subscriptions: %w", err))
		return subscriptionErrorResult(types.UpdateSubscriptions, profile, operations, "Failed to persist subscriptions", persistErr)
	}

	result := updateResultBase(types.UpdateSubscriptions, types.ResponseSuccess, "Subscriptions updated")
	result.Applied = true
	result.Profile = profile
	result.Persisted = shouldPersist(req.ApplyMode)
	result.Operations = operations
	result.Conflicts = conflicts
	s.Logger.LogResponse(
		"Updated subscriptions",
		result.GenericResponse,
		"profile_id", req.ProfileID,
		"operation_count", len(operations),
		"persisted", shouldPersist(req.ApplyMode),
	)
	return result
}

// ImportAsset imports a local archive into installed state and wires it into the active profile as a local subscription.
func (s *UserProfiles) ImportAsset(req types.ImportAssetRequest) types.UpdateSubscriptionsResult {
	s.logRequest(
		"ImportAsset",
		"profile_id", req.ProfileID,
		"asset_type", req.AssetType,
		"replace_on_conflict", req.ReplaceOnConflict,
	)
	// Initial snapshot to validate profile existence before performing any operations.
	// Unlike remote subscription updates, we need to validate that the asset can be imported before mutating the profile state since we do not want to persist any subscription changes if the import fails.
	profile, _, profileErr := s.profileSnapshot(req.ProfileID)
	if profileErr != nil {
		return profileNotFoundUpdateResult(profileErr, types.ImportAsset, "Profile not found")
	}

	// Validate that the asset can be imported successfully
	importResp := s.Downloader.ImportAsset(req.AssetType, req.ZipPath, req.ReplaceOnConflict)
	if importResp.Status == types.ResponseError {
		err := userProfilesError(
			req.ProfileID,
			importResp.AssetID,
			req.AssetType,
			types.ErrorSyncFailed,
			importResp.ErrorType,
			importResp.Message,
		)
		result := updateResultBase(types.ImportAsset, types.ResponseError, importResp.Message)
		result.Profile = profile
		result.Errors = []types.UserProfilesError{err}
		return result
	}

	// If the import succeeded but recorded a warning about map code conflict, this must be raised to the frontend to confirm replaceent before profile mutation
	if importResp.Status == types.ResponseWarn && importResp.MapCodeConflict != nil && !req.ReplaceOnConflict {
		result := conflictWarningResult(
			types.ImportAsset,
			importResp.Message,
			profile,
			[]types.MapCodeConflict{*importResp.MapCodeConflict},
		)
		return result
	}

	// Re-lock and re-snapshot to perform profile mutation after import (given that import itself may take an extended period of time)
	s.mu.Lock()
	defer s.mu.Unlock()

	stateCopy, nextProfile, nextProfileErr := s.resolveProfileFromCopy(req.ProfileID)
	if nextProfileErr != nil {
		return profileNotFoundUpdateResult(nextProfileErr, types.ImportAsset, "Profile not found")
	}

	cloneProfileSubscriptions(&nextProfile)

	// There will be at most two subscription mutations to apply for an imported map asset: one to resolve map code conflicts if they exist, and one to subscribe to the newly imported map.
	// Apply conflict resolution first to ensure the profile is in a valid state to subscribe to the new asse\
	operations := make([]types.SubscriptionOperation, 0, 2)
	appliedConflicts := make([]types.MapCodeConflict, 0)
	if importResp.MapCodeConflict != nil && req.ReplaceOnConflict {
		conflictOperations, conflictErr := s.applyConflictReplacementMutations(req.ProfileID, &nextProfile, []types.MapCodeConflict{*importResp.MapCodeConflict})
		if conflictErr != nil {
			message := "Failed to replace conflicting subscription"
			if conflictErr.DownloaderErrorType == types.InstallErrorMapCodeConflict {
				message = conflictErr.Message
			}
			result := updateResultBase(types.ImportAsset, types.ResponseError, message)
			result.Profile = nextProfile
			result.Errors = []types.UserProfilesError{*conflictErr}
			return result
		}
		operations = appendOperations(operations, conflictOperations)
		appliedConflicts = append(appliedConflicts, *importResp.MapCodeConflict)
	}

	// Then apply the subscription mutation to add the imported asset to the profile.
	// Each asset type will have two different sets of subscription collections, one for locally imported assets and one for remotely subscribed assets.
	localOperation, localErr := applySubscriptionMutation(
		&nextProfile,
		types.SubscriptionActionSubscribe,
		importResp.AssetID,
		types.SubscriptionUpdateItem{
			Type:    types.AssetTypeMap,
			Version: types.Version(importResp.Version),
			IsLocal: true,
		},
	)
	if localErr != nil {
		result := updateResultBase(types.ImportAsset, types.ResponseError, "Failed to add imported map to profile subscriptions")
		result.Profile = nextProfile
		result.Errors = []types.UserProfilesError{*localErr}
		return result
	}
	operations = appendOperation(operations, localOperation)

	// If all operations (optional conflict replacement + import subscription) were applied successfully, commit the profile mutation to persist the new subscriptions state with the imported asset.
	if err := s.commitProfileMutation(&stateCopy, req.ProfileID, nextProfile, true); err != nil {
		persistErr := updateSubscriptionError(
			req.ProfileID,
			importResp.AssetID,
			types.AssetTypeMap,
			types.ErrorPersistFailed,
			fmt.Errorf("failed to persist imported asset subscriptions: %w", err),
		)
		return subscriptionErrorResult(types.ImportAsset, nextProfile, operations, "Failed to persist imported asset subscriptions", persistErr)
	}

	status := types.ResponseSuccess
	message := "Asset imported and subscribed successfully"
	if importResp.Status == types.ResponseWarn {
		status = types.ResponseWarn
		message = importResp.Message
	}

	result := updateResultBase(types.ImportAsset, status, message)
	result.Applied = true
	result.Profile = nextProfile
	result.Persisted = true
	result.Operations = operations
	result.Conflicts = appliedConflicts
	return result
}

// checkMapCodeConflicts checks for potential map code conflicts between the maps in the update request and existing subscriptions.
func (s *UserProfiles) checkMapCodeConflicts(req types.UpdateSubscriptionsRequest) []types.MapCodeConflict {
	conflicts := make([]types.MapCodeConflict, 0)

	for assetID, item := range req.Assets {
		if item.Type != types.AssetTypeMap || item.IsLocal {
			continue
		}
		manifest, err := s.Registry.GetMap(assetID)
		if err != nil {
			continue
		}

		conflict, hasConflict := s.Downloader.FindMapCodeConflict(assetID, manifest.CityCode, true)
		if !hasConflict {
			continue
		}
		conflicts = append(conflicts, *conflict)
	}

	return conflicts
}

// copyProfilesState is a helper to create a deep copy of the profiles state prior to mutation
func copyProfilesState(source types.UserProfilesState) types.UserProfilesState {
	copied := types.UserProfilesState{
		ActiveProfileID: source.ActiveProfileID,
		Profiles:        make(map[string]types.UserProfile, len(source.Profiles)),
	}
	for id, profile := range source.Profiles {
		copied.Profiles[id] = profile
	}
	return copied
}

// resolveProfileFromCopy returns a mutable state copy and resolved profile for mutation paths.
func (s *UserProfiles) resolveProfileFromCopy(profileID string) (types.UserProfilesState, types.UserProfile, *types.UserProfilesError) {
	stateCopy := copyProfilesState(s.state)
	profile, profileErr := profileFromState(stateCopy, profileID)
	if profileErr != nil {
		return types.UserProfilesState{}, types.UserProfile{}, profileErr
	}
	return stateCopy, profile, nil
}

func shouldPersist(mode types.UpdateSubscriptionsApplyMode) bool {
	return mode == types.UpdateSubscriptionsPersistOnly || mode == types.UpdateSubscriptionsPersistAndSync
}

func shouldSync(mode types.UpdateSubscriptionsApplyMode) bool {
	return mode == types.UpdateSubscriptionsPersistAndSync
}

func (s *UserProfiles) commitProfileMutation(state *types.UserProfilesState, profileID string, profile types.UserProfile, persist bool) error {
	state.Profiles[profileID] = profile
	if persist {
		if err := WriteUserProfilesState(*state); err != nil {
			return err
		}
	}
	s.setState(*state)
	return nil
}

func cloneProfileSubscriptions(profile *types.UserProfile) {
	profile.Subscriptions.Maps = utils.CloneMap(profile.Subscriptions.Maps)
	profile.Subscriptions.Mods = utils.CloneMap(profile.Subscriptions.Mods)
	profile.Subscriptions.LocalMaps = utils.CloneMap(profile.Subscriptions.LocalMaps)
}

func appendOperation(operations []types.SubscriptionOperation, operation *types.SubscriptionOperation) []types.SubscriptionOperation {
	if operation == nil {
		return operations
	}
	return append(operations, *operation)
}

func appendOperations(operations []types.SubscriptionOperation, additional []types.SubscriptionOperation) []types.SubscriptionOperation {
	if len(additional) == 0 {
		return operations
	}
	return append(operations, additional...)
}

// applyConflictReplacementMutations applies in-memory subscription mutations to resolve map code conflicts.
func (s *UserProfiles) applyConflictReplacementMutations(
	profileID string,
	profile *types.UserProfile,
	conflicts []types.MapCodeConflict,
) ([]types.SubscriptionOperation, *types.UserProfilesError) {
	operations := make([]types.SubscriptionOperation, 0, len(conflicts))
	for _, conflict := range conflicts {
		// Vanilla map conflicts are not resolvable since we should not overwrite vanilla maps.
		// If this occurs it is either a registry error or an issue with an imported map's configuration
		if strings.HasPrefix(conflict.ExistingAssetID, "vanilla:") {
			err := userProfilesError(
				profileID,
				conflict.ExistingAssetID,
				conflict.ExistingAssetType,
				types.ErrorInvalidAction,
				types.InstallErrorMapCodeConflict,
				"Cannot replace a vanilla map city code",
			)
			return nil, &err
		}
		// For map code conflicts, remove the existing conflicting subscription before adding the new one.
		removedOperation, removeErr := removeMapConflictSubscription(profile, conflict)
		if removeErr != nil {
			return nil, removeErr
		}
		operations = appendOperation(operations, removedOperation)
	}
	return operations, nil
}

// applyAndPersistConflictReplacements applies in-memory subscription mutations to resolve map code conflicts and persists the updated profile state if mutations were applied.
func (s *UserProfiles) applyAndPersistConflictReplacements(
	profileID string,
	conflicts []types.MapCodeConflict,
) (types.UserProfile, []types.SubscriptionOperation, *types.UserProfilesError) {
	// If there are no conflicts to resolve, skip the mutation and commit steps and return the current profile snapshot to avoid an unnecessary write to disk.
	if len(conflicts) == 0 {
		profile, _, profileErr := s.profileSnapshot(profileID)
		if profileErr != nil {
			return types.UserProfile{}, nil, profileErr
		}
		return profile, []types.SubscriptionOperation{}, nil
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	stateCopy, profile, profileErr := s.resolveProfileFromCopy(profileID)
	if profileErr != nil {
		return types.UserProfile{}, nil, profileErr
	}

	// Apply conflict mutations against a fresh snapshot of the profile.
	cloneProfileSubscriptions(&profile)
	operations, conflictErr := s.applyConflictReplacementMutations(profileID, &profile, conflicts)
	if conflictErr != nil {
		return types.UserProfile{}, nil, conflictErr
	}
	if len(operations) == 0 {
		return profile, operations, nil
	}

	// If conflict mutations were applied successfully, commit the profile mutation to persist the updated subscriptions state.
	if err := s.commitProfileMutation(&stateCopy, profileID, profile, true); err != nil {
		persistErr := updateSubscriptionError(
			profileID,
			"",
			types.AssetTypeMap,
			types.ErrorPersistFailed,
			fmt.Errorf("failed to persist deferred map conflict replacement: %w", err),
		)
		return types.UserProfile{}, nil, &persistErr
	}

	return profile, operations, nil
}

func applySubscriptionMutation(
	profile *types.UserProfile,
	action types.SubscriptionAction,
	assetID string,
	item types.SubscriptionUpdateItem,
) (*types.SubscriptionOperation, *types.UserProfilesError) {
	switch item.Type {
	// TODO: Generalize non-local/local split across all asset types instead of applying a special case for maps only.
	case types.AssetTypeMap:
		target := profile.Subscriptions.Maps
		if item.IsLocal {
			target = profile.Subscriptions.LocalMaps
		} else if action == types.SubscriptionActionUnsubscribe {
			if _, exists := profile.Subscriptions.LocalMaps[assetID]; exists {
				target = profile.Subscriptions.LocalMaps
			}
		}
		return mutateSubscriptionMap(target, action, assetID, item)
	case types.AssetTypeMod:
		return mutateSubscriptionMap(profile.Subscriptions.Mods, action, assetID, item)
	default:
		err := userProfilesError("", assetID, item.Type, types.ErrorInvalidAssetType, "", fmt.Sprintf("Invalid asset type: %q", item.Type))
		return nil, &err
	}
}

// removeMapConflictSubscription removes the subscription that is in conflict with a new map subscription to resolve map code conflicts.
func removeMapConflictSubscription(
	profile *types.UserProfile,
	conflict types.MapCodeConflict,
) (*types.SubscriptionOperation, *types.UserProfilesError) {
	target := profile.Subscriptions.Maps
	item := types.SubscriptionUpdateItem{
		Type: types.AssetTypeMap,
	}
	if conflict.ExistingIsLocal {
		target = profile.Subscriptions.LocalMaps
		item.IsLocal = true
	}
	return mutateSubscriptionMap(target, types.SubscriptionActionUnsubscribe, conflict.ExistingAssetID, item)
}

func mutateSubscriptionMap(
	target map[string]string,
	action types.SubscriptionAction,
	assetID string,
	item types.SubscriptionUpdateItem,
) (*types.SubscriptionOperation, *types.UserProfilesError) {
	switch action {
	case types.SubscriptionActionSubscribe:
		versionText := strings.TrimSpace(string(item.Version))
		if !types.IsValidSemverVersion(types.Version(versionText)) {
			err := userProfilesError("", assetID, item.Type, types.ErrorInvalidVersion, "", fmt.Sprintf("Invalid version: %q", versionText))
			return nil, &err
		}
		target[assetID] = versionText
		return &types.SubscriptionOperation{
			AssetID: assetID,
			Type:    item.Type,
			Action:  action,
			Version: types.Version(versionText),
		}, nil
	case types.SubscriptionActionUnsubscribe:
		removedVersion, exists := target[assetID]
		if !exists {
			return nil, nil
		}
		delete(target, assetID)
		return &types.SubscriptionOperation{
			AssetID: assetID,
			Type:    item.Type,
			Action:  action,
			Version: types.Version(strings.TrimSpace(removedVersion)),
		}, nil
	default:
		err := userProfilesError("", assetID, item.Type, types.ErrorInvalidAction, "", fmt.Sprintf("Invalid subscription action: %q", action))
		return nil, &err
	}
}
