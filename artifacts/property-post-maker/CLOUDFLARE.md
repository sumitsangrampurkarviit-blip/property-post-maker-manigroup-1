# Cloudflare Pages deployment

This artifact is a static Vite app and does not require a server, database, or
environment variables on Cloudflare Pages.

## Pages dashboard settings

- **Framework preset:** Vite
- **Root directory:** `/`
- **Build command:**
  `pnpm install --frozen-lockfile && pnpm --filter @workspace/property-post-maker run build:cloudflare`
- **Build output directory:** `artifacts/property-post-maker/dist/public`
- **Node version:** 20 or newer

The repository includes `artifacts/property-post-maker/wrangler.toml` for
Wrangler-based deployments. From the artifact directory, run:

```bash
pnpm run deploy:cloudflare
```

The generated `public/_redirects` file keeps client-side routes on
`index.html`, while `public/_headers` adds basic security headers and long-lived
caching for hashed assets.