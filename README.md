# Schill Labs — schilllabs.com

The official website of **Schill Labs**, an independent one-person studio — web software (FragLedger, Live QA), phone apps (Mello, Dryfire Trainer, Swing Loop, Bloom Doc), and an unannounced western settlement builder for Steam.

Hand-built static site. **No frameworks, no build step, no trackers.** Edit an HTML file, push, done.

## Structure

```
├── index.html              Home — hero, software, featured game, app grid, newsletter
├── games/                  Western settlement sim teaser page
├── software/               Web products index
│   ├── fragledger/         Live CS2 match ledger (points at fragledger.com)
│   └── live-qa/            Company QA bot
├── apps/                   Apps index
│   ├── mello/              Per-app landing pages…
│   ├── dryfire-trainer/    …each one is a store-ready marketing URL
│   ├── swing-loop/
│   └── bloom-doc/
├── news/                   Devlog — add a folder per post, update news/index.html + sitemap
├── about/                  Studio story
├── press/                  Press kit — factsheet, boilerplate, logo downloads
├── support/                Support hub  ← use as App Store "Support URL"
├── privacy/                Privacy policy ← use as store "Privacy Policy URL"
├── terms/                  Terms of use
├── 404.html                Custom not-found page (Cloudflare Pages serves it automatically)
├── assets/
│   ├── css/style.css       The entire design system (design tokens up top)
│   ├── js/main.js          Particles, reveals, tilt, menu, forms — no deps
│   ├── fonts/              Self-hosted woff2 (Space Grotesk, Inter, JetBrains Mono)
│   ├── img/                Product and game art
│   │   ├── brand/          Schill Labs mark, favicon and app icons (new brand, Nov 2026)
│   │   └── share/          1200×630 social share images
│   └── press/              Downloadable press assets (brand/ logos + press-kit ZIP)
├── sitemap.xml · robots.txt · site.webmanifest
```

## App-store checklist (why some pages exist)

Both stores require working URLs at submission time — this site provides them:

| Store field            | URL to paste                                  |
|------------------------|-----------------------------------------------|
| Support URL            | `https://schilllabs.com/support/`             |
| Privacy Policy URL     | `https://schilllabs.com/privacy/`             |
| Diet App privacy       | `https://schilllabs.com/diet/privacy.html`    |
| Diet App terms         | `https://schilllabs.com/diet/terms.html`      |
| Marketing URL (per app)| `https://schilllabs.com/apps/<app-name>/`     |

> Before each launch, update `/privacy/` with that app's specific data disclosures. The current policy covers the principles and flags that per-app details are coming.

## Common edits

- **Copy/text** — edit the HTML files directly; every page is plain HTML.
- **Brand** — the angular "S" mark (ink #141321, lavender #C6BCFF, cream #F5F0E8) comes from the hype repo's `campaigns/schill-labs/kit/`. `/assets/*` is cached as immutable, so a changed logo, icon or share image needs a new file name, not an overwrite.
- **Colors/design tokens** — top of `assets/css/style.css` (`:root` block).
- **Real screenshots** — on each app page, replace the `.phone .screen` contents with an `<img>` of the real screenshot.
- **Steam page goes live** — on `games/index.html` and `index.html`, point the ember buttons at the Steam URL (`https://store.steampowered.com/app/<id>`) and change the "Steam page coming" chips to "Wishlist on Steam". When the name is announced, replace "western settlement builder" / "the western sim" with the real title across the site.
- **Store badges go live** — in each `apps/*/index.html`, swap the "Coming soon" `store-pill`s for links to the real listings.

## Newsletter form (2-minute upgrade)

The email forms work out of the box by opening a pre-filled email draft to `hello@schilllabs.com` — zero backend. To collect signups automatically instead:

1. Create a free form at [formspree.io](https://formspree.io) (or Buttondown/Mailchimp).
2. In `assets/js/main.js`, set `FORM_ENDPOINT = 'https://formspree.io/f/XXXXXXX'`.
3. Add the endpoint's origin to `connect-src` in `_headers` (CSP), e.g. `connect-src 'self' https://formspree.io`.

## Email: hello@schilllabs.com

The site uses `hello@schilllabs.com` everywhere. The domain is on Cloudflare, so this is a 3-minute free setup: Cloudflare dashboard → schilllabs.com → **Email → Email Routing** → add `hello@` as a custom address forwarding to your Gmail. (Or find-and-replace the address across the HTML files and `assets/js/main.js`.)

## Hosting: Cloudflare Pages

The site is deployed on **Cloudflare Pages** (project: `schill-labs`), with `schilllabs.com` attached as the custom domain. To ship an update:

- **Dashboard route (no setup):** Cloudflare dashboard → Workers & Pages → `schill-labs` → *Create deployment* → drag in the site folder (or a zip of it).
- **CLI route:** `npx wrangler pages deploy . --project-name=schill-labs` with a `CLOUDFLARE_API_TOKEN` in your environment.
- **Auto-deploy from GitHub (recommended eventually):** in the Pages project, connect the `schill-labs-website` GitHub repo — after that, every push to `main` deploys automatically. Build command: none. Output directory: `/`.

## Local preview

Any static server works:

```bash
python3 -m http.server 8080
# → http://localhost:8080
```

---

© Schill Labs. All rights reserved. Site content and artwork may not be reused without permission (press assets excepted — see `/press/`).
