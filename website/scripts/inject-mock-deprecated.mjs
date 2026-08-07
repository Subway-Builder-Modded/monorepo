// Dev utility: inject a synthetic deprecated mod AND a synthetic deleted mod
// into the materialized registry cache so both retired UI states can be
// exercised regardless of the real registry's contents (browse toggles +
// badges, sort partitions, detail notices + no download path).
//
// Usage (after `pnpm run fetch`):
//   pnpm run mock:deprecated && pnpm run dev
//
// Opt-in only — never wired into `fetch` or the deploy workflows. The
// integrity entry mirrors the registry pipeline's deprecation overlay output
// exactly: every version is_complete:false with a "listing_deprecated" marker
// error, has_complete_version:false.
import fs from "node:fs";
import path from "node:path";

const MOCK_ID = "zz-mock-deprecated-mod";
const MOCK_DELETED_ID = "zz-mock-deleted-mod";
const root = path.join(process.cwd(), "public", "registry-cache", "mods");

if (!fs.existsSync(path.join(root, "index.json"))) {
  console.error(`[inject-mock-deprecated] ${root} not materialized — run \`pnpm run fetch\` first`);
  process.exit(1);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(root, file), "utf-8"));
}

function writeJson(file, value) {
  fs.writeFileSync(path.join(root, file), `${JSON.stringify(value, null, 2)}\n`, "utf-8");
}

const index = readJson("index.json");
for (const id of [MOCK_ID, MOCK_DELETED_ID]) {
  if (!index.mods.includes(id)) {
    index.mods.push(id);
  }
}
index.mods.sort();
writeJson("index.json", index);

const downloads = readJson("downloads.json");
downloads[MOCK_ID] = { "v1.0.0": 1234, "v1.1.0": 88 };
downloads[MOCK_DELETED_ID] = { "v1.0.0": 456 };
writeJson("downloads.json", downloads);

const integrity = readJson("integrity.json");
const mockVersion = (tag, releasedAt) => ({
  is_complete: false,
  errors: ["listing_deprecated"],
  required_checks: { config_version_matches_tag: true },
  matched_files: {},
  source: {
    update_type: "github",
    repo: "subway-builder-modded/mock-deprecated",
    tag,
    asset_name: `${MOCK_ID}-${tag}.zip`,
    download_url: `https://example.invalid/${MOCK_ID}-${tag}.zip`,
  },
  fingerprint: "mock",
  checked_at: "2026-08-01T00:00:00Z",
  released_at: releasedAt,
});
integrity.listings[MOCK_ID] = {
  has_complete_version: false,
  latest_semver_version: "1.1.0",
  latest_semver_complete: false,
  complete_versions: [],
  incomplete_versions: ["v1.0.0", "v1.1.0"],
  last_updated: 1753920000,
  versions: {
    "v1.0.0": mockVersion("v1.0.0", "2026-05-01T00:00:00Z"),
    "v1.1.0": mockVersion("v1.1.0", "2026-07-15T00:00:00Z"),
  },
};
// The pipeline's overlay is state-agnostic: deleted listings publish the same
// integrity shape as deprecated ones; only the manifest carries deleted:true.
integrity.listings[MOCK_DELETED_ID] = {
  has_complete_version: false,
  latest_semver_version: "1.0.0",
  latest_semver_complete: false,
  complete_versions: [],
  incomplete_versions: ["v1.0.0"],
  last_updated: 1753920000,
  versions: {
    "v1.0.0": mockVersion("v1.0.0", "2026-04-01T00:00:00Z"),
  },
};
writeJson("integrity.json", integrity);

const listingDir = path.join(root, MOCK_ID);
fs.mkdirSync(listingDir, { recursive: true });
fs.writeFileSync(
  path.join(listingDir, "manifest.json"),
  `${JSON.stringify(
    {
      schema_version: 1,
      id: MOCK_ID,
      name: "Mock Deprecated Mod",
      author: "subway-builder-modded-admin",
      github_id: 268817724,
      description:
        "**Synthetic listing** injected by scripts/inject-mock-deprecated.mjs to validate the Deprecated asset states. Not a real mod.",
      tags: ["misc"],
      gallery: [],
      is_test: false,
      source: "https://example.invalid/mock-deprecated",
      update: { type: "github", repo: "subway-builder-modded/mock-deprecated" },
      last_updated: 1753920000,
      deprecation: {
        since: "2026-08-01T00:00:00Z",
        by_github_id: 268817724,
        reason: "Mock deprecation for dev validation — this listing is synthetic.",
      },
    },
    null,
    2,
  )}\n`,
  "utf-8",
);

const deletedDir = path.join(root, MOCK_DELETED_ID);
fs.mkdirSync(deletedDir, { recursive: true });
fs.writeFileSync(
  path.join(deletedDir, "manifest.json"),
  `${JSON.stringify(
    {
      schema_version: 1,
      id: MOCK_DELETED_ID,
      name: "Mock Deleted Mod",
      author: "subway-builder-modded-admin",
      github_id: 268817724,
      description:
        "**Synthetic listing** injected by scripts/inject-mock-deprecated.mjs to validate the Deleted asset states. Not a real mod.",
      tags: ["misc"],
      gallery: [],
      is_test: false,
      source: "https://example.invalid/mock-deleted",
      update: { type: "github", repo: "subway-builder-modded/mock-deleted" },
      last_updated: 1753920000,
      deprecation: {
        since: "2026-08-01T00:00:00Z",
        by_github_id: 268817724,
        reason: "Mock deletion for dev validation — this listing is synthetic.",
        deleted: true,
      },
    },
    null,
    2,
  )}\n`,
  "utf-8",
);

console.log(`[inject-mock-deprecated] Injected ${MOCK_ID} and ${MOCK_DELETED_ID} into ${root}`);
