import type {
  TemplateModCodeExample,
  TemplateModCta,
  TemplateModDirectoryNode,
  TemplateModFoundationCard,
} from "@/features/template-mod/template-mod-types";

export const TEMPLATE_MOD_TITLE = "Template Mod";

export const TEMPLATE_MOD_HERO_COPY =
  "The all-inclusive TypeScript template for creating Subway Builder mods with ease.";

export const TEMPLATE_MOD_PRIMARY_CTA: TemplateModCta = {
  label: "Get Started",
  href: "https://github.com/Subway-Builder-Modded/template-mod",
  icon: "Github",
  style: "solid",
  external: true,
};

export const TEMPLATE_MOD_SECONDARY_CTA: TemplateModCta = {
  label: "Documentation",
  href: "/template-mod/docs",
  icon: "BookText",
  style: "outline",
};

export const TEMPLATE_MOD_DIRECTORY_TREE: TemplateModDirectoryNode = {
  id: "root",
  label: "template-mod",
  kind: "folder",
  children: [
    {
      id: "src",
      label: "src",
      kind: "folder",
      children: [
        {
          id: "main",
          label: "main.ts",
          kind: "file",
        },
        {
          id: "ui",
          label: "ui",
          kind: "folder",
          children: [
            {
              id: "example-panel",
              label: "ExamplePanel.tsx",
              kind: "file",
            },
          ],
        },
        {
          id: "types",
          label: "types",
          kind: "folder",
          children: [
            {
              id: "api",
              label: "api.d.ts",
              kind: "file",
            },
            {
              id: "core",
              label: "core.d.ts",
              kind: "file",
            },
          ],
        },
      ],
    },
    {
      id: "scripts",
      label: "scripts",
      kind: "folder",
      children: [
        {
          id: "run",
          label: "run.ts",
          kind: "file",
        },
        {
          id: "link",
          label: "link.ts",
          kind: "file",
        },
      ],
    },
    {
      id: "manifest",
      label: "manifest.json",
      kind: "file",
    },
    {
      id: "vite",
      label: "vite.config.ts",
      kind: "file",
    },
    {
      id: "tsconfig",
      label: "tsconfig.json",
      kind: "file",
    },
    {
      id: "package",
      label: "package.json",
      kind: "file",
    },
  ],
};

export const TEMPLATE_MOD_FOUNDATION_CARDS: TemplateModFoundationCard[] = [
  {
    id: "modding-api",
    title: "Modding API-Aligned Types",
    description: "Template typings are aligned to Subway Builder Modding API, including core, game-state, build, and UI modules.",
    icon: "Blocks",
  },
  {
    id: "react",
    title: "React at Runtime",
    description: "React is provided by the game. Use regular hooks and bind game UI components from SubwayBuilderAPI.",
    icon: "Atom",
  },
  {
    id: "dev-scripts",
    title: "Dev Scripts",
    description: "Use `build`/`dev`/`dev:link`/`dev:unlink`/`typecheck` scripts for a stable modding workflow across platforms.",
    icon: "Terminal",
  },
  {
    id: "documentation",
    title: "In-Depth Documentation",
    description: "Comprehensive guides and references for mod development, all actively maintained and expanded.",
    icon: "FolderTree",
  },
];

const INSTALL_CODE = `{
  "id": "com.yourname.yourmod",
  "name": "Your Mod Name",
  "description": "What it does",
  "version": "1.0.0",
  "author": { "name": "Your Name" },
  "main": "index.js"
}`;

const WORKFLOW_CODE = `# dev starts watcher + game in parallel.
# Logs are written here:
debug/latest.log

# In-game hot reload:
# Windows/Linux: CTRL + SHIFT + R
# macOS: CMD + SHIFT + R`;

const API_CODE = `const api = window.SubwayBuilderAPI

api.hooks.onMapReady((map) => {
  api.ui.showNotification("Map loaded", "info")
})

api.ui.addFloatingPanel({
  id: "my-panel",
  title: "My Panel",
  icon: "Settings",
  render: MyComponent,
})`;

export const TEMPLATE_MOD_CODE_EXAMPLES: TemplateModCodeExample[] = [
  {
    id: "install",
    label: "Install and Configure",
    icon: "SlidersHorizontal",
    lang: "json",
    title: "manifest.json",
    content: INSTALL_CODE,
  },
  {
    id: "workflow",
    label: "Build, Link, and Develop",
    icon: "FileCode2",
    lang: "log",
    title: "debug/latest.log",
    content: WORKFLOW_CODE,
  },
  {
    id: "api",
    label: "Game API",
    icon: "Sparkles",
    lang: "ts",
    title: "src/main.ts",
    content: API_CODE,
  },
];


