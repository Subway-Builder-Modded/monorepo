<p align="center">
  <img src="https://subwaybuildermodded.com/logo.png" width="128" height="128" alt="Railyard">
</p>

<h1 align="center">Subway Builder Modded Monorepo</h1>

<p align="center">
  Welcome to the Subway Builder Modded monorepo! This monorepo includes all of the shared code for our projects and tools.
</p>

<br/>
<br/>

---

## Workspace

This repository is managed as a **pnpm workspace**. A single `pnpm install` from the repo root installs dependencies for all projects — you never need to `cd` into a sub-package just to install.

### Workspace packages

| Package | Path | Description |
|---|---|---|
| `@subway-builder-modded/config` | `packages/config` | Shared workspace constants |
| `@subway-builder-modded/shared-ui` | `packages/shared-ui` | Shared React UI components |
| `@subway-builder-modded/asset-listings-ui` | `packages/asset-listings-ui` | Asset listing UI components |
| `@subway-builder-modded/stores-core` | `packages/stores-core` | Core Zustand store definitions |
| `@subway-builder-modded/asset-listings-state` | `packages/asset-listings-state` | Asset listing state and store extensions |
| `@subway-builder-modded/lifecycle-core` | `packages/lifecycle-core` | Shared lifecycle hooks |
| `@subway-builder-modded/lifecycle-web` | `packages/lifecycle-web` | Web-specific lifecycle hooks |
| `@subway-builder-modded/lifecycle-wails` | `packages/lifecycle-wails` | Wails-specific lifecycle hooks |

### Root scripts

```bash
# Install all workspace dependencies
pnpm install

# Run quality checks for each app
pnpm run ci
pnpm run check:website
pnpm run check:railyard-frontend
```

---

<p align="center">
  <img width="128" height="128" alt="train-track" src="https://github.com/user-attachments/assets/914ab1b4-d5f7-47a6-91dd-58304ac45970" />
  <img width="128" height="128" alt="globe" src="https://github.com/user-attachments/assets/ff2b1eee-91d1-4621-965e-e8e75eef29c5" />
  <img width="128" height="128" alt="anvil" src="https://github.com/user-attachments/assets/a48d734f-c48b-4645-a07b-33b01a94ad1a" />
  <img width="128" height="128" alt="anvil" src="https://github.com/user-attachments/assets/074178b6-018b-4e5e-9155-a195c5540b55" />
</p>

---

<br/>
<br/>

<a href="https://subwaybuildermodded.com/railyard">
  <h1 align="center">
    <img width="24" alt="train-track"   src="https://github.com/user-attachments/assets/914ab1b4-d5f7-47a6-91dd-58304ac45970" />
    Railyard
  </h1>
</a>

### Features

- **Custom Cities**: Browse community-made maps of cities from around the world and install them at the press of a button.
- **Mod Browser**: Discover and install gameplay mods to enhance your Subway Builder experience.
- **Intuitive Interface**: A clean, friendly UI designed to make managing your Subway Builder content effortless.
- **Content Management**: Manage your installed content and keep everything organized.
- **Fully Configurable**: Fully configure every aspect of Railyard to your liking.

### Development Prerequisites

- [Go 1.25+](https://go.dev/dl/)
- [Node.js](https://nodejs.org/) (LTS recommended)
- [pnpm](https://pnpm.io/)
- [Wails CLI](https://wails.io/docs/gettingstarted/installation)

### Getting Started

```bash
# From the repo root — installs all workspace packages in one step
pnpm install

# Run in development mode (hot reload) — from the railyard/ directory
cd railyard
wails dev

# Build for production
wails build
```

### Quality Checks

```bash
# Run full pre-push checks manually (backend + frontend) — from railyard/
cd railyard
pwsh -File ./scripts/pre-push-check.ps1

# Optional: enforce checks automatically before every git push
git config core.hooksPath .githooks
```

The pre-push check includes:
- `gofmt -w` auto-apply for all tracked Go files (then validation)
- `go test ./...`
- `go test` coverage gate (`scripts/check-go-coverage.ps1`, default minimum: `60%`)
- frontend `pnpm run format`, `pnpm run lint:fix`, then `pnpm run check` (`lint`, `format:check`, `test`, `test:coverage`)

### How It Works

1. **Registry** — Railyard clones a Git-based registry of available maps and mods.
2. **Installation** — Maps are downloaded as zip archives containing PMTiles, config, and GeoJSON data files. These are extracted to the Railyard data directory.
3. **Mod Generation** — At game launch, Railyard generates a Subway Builder mod (`com.railyard.maploader`) that registers all installed maps with the game's modding API.
4. **Tile Serving** — A local PMTiles server starts on a random port to serve vector tiles to the game at runtime.
5. **Thumbnails** — SVG thumbnails are generated from water layer features in the map's vector tiles and cached for display in the UI.

<br/>
<br/>

---

<a href="https://subwaybuildermodded.com/">
  <h1 align="center">
    <img width="24" alt="globe" src="https://github.com/user-attachments/assets/ff2b1eee-91d1-4621-965e-e8e75eef29c5" />
    Website
  </h1>
</a>

### Development Prerequisites

- [Node.js](https://nodejs.org/) 22+
- [pnpm](https://pnpm.io/)

### Getting Started

```bash
# From the repo root — installs all workspace packages in one step
pnpm install

# Start the development server
cd website
pnpm run dev
```

### Quality Checks

```bash
# Run lint, formatting check, unit tests, and coverage
cd website
pnpm run check
```

### Branches

- `website`: production website source branch
- `website-dev`: development website source branch

<br/>
<br/>

---

<p align="center">
  <a href="https://subwaybuildermodded.com/">
    <b>
      Website
    </b>
  </a>
  |
  <a href="https://subwaybuildermodded.com/railyard">
    <b>
      License
    </b>
  </a>
  |
  <a href="https://subwaybuildermodded.com/credits">
    <b>
      Credits
    </b>
  </a>
  |
  <a href="https://subwaybuildermodded.com/contribute">
    <b>
      Contribute
    </b>
  </a>
</p>
