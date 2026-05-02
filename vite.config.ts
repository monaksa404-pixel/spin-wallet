// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
//
// Vercel sets VERCEL=1 during builds — disable Cloudflare so SSR emits a Node-compatible bundle
// consumed by api/ssr.ts (Wrangler / Workers stays available locally without VERCEL=1).
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const disableCloudflareForVercel = process.env.VERCEL === "1";

export default defineConfig({
  cloudflare: disableCloudflareForVercel ? false : undefined,
});
