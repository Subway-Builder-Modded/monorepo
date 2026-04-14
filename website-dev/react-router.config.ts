import type { Config } from "@react-router/dev/config";

// Static site generation: all routes prerendered to static HTML at build time.
export default {
  prerender: true,
} satisfies Config;
