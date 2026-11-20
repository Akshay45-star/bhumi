# bhumi-web

Static landing site for `bhumi.app`. Deploy to Cloudflare Pages.

## Files
- `index.html`   — Main landing page / recipient invite landing
- `privacy.html` — Privacy Policy (linked as `bhumi.app/privacy` for App Store)
- `terms.html`   — Terms of Service
- `_redirects`   — Cloudflare Pages redirect rules

## Deploy (Cloudflare Pages)
1. Go to https://pages.cloudflare.com
2. Create project → Connect Git → select `bhumi-web/` directory (or just this folder as root)
3. Framework preset: **None** (static HTML)
4. Build command: (empty)
5. Output directory: `.` (root)
6. Add custom domain: `bhumi.app`
7. Done — SSL auto-provisioned

## URL mapping after deploy
- `bhumi.app`          → index.html   (recipient invite landing)
- `bhumi.app/privacy`  → privacy.html (Apple App Store requirement)
- `bhumi.app/terms`    → terms.html
- `bhumi.app/join/:token` → app deep link handled by iOS universal links
