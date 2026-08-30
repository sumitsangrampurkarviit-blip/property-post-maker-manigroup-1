---
name: Cloudflare Pages deployment
description: Static-hosting compatibility for the Property Post Maker Vite artifact.
---

The Vite app must default `PORT` and `BASE_PATH` when those variables are absent, because Replit supplies them but Cloudflare Pages does not.

**Why:** A production build on Cloudflare is performed without the Replit workflow environment, so requiring either variable causes the build to fail before Vite compiles.

**How to apply:** Preserve Replit-provided values when present, and use a normal static-site fallback (`5173` for local Vite tooling and `/` for the deployed base path).