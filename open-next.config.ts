import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";

const cloudflareConfig = defineCloudflareConfig({
  incrementalCache: r2IncrementalCache,
});

// `npm run build` is the OpenNext build itself, so point the internal
// Next.js step directly at `next build` to avoid infinite recursion.
const config = {
  ...cloudflareConfig,
  buildCommand: "npx next build",
};

export default config;
