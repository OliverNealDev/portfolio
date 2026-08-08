# oliverneal.dev

Source for my portfolio site: [oliverneal.dev](https://oliverneal.dev).

Hand-written HTML, CSS and vanilla JavaScript. No framework, no build step, no dependencies. Deployed straight from `main` by GitHub Pages.

---

## What is here

| Page | Purpose |
|---|---|
| `index.html` | Home: internship, about, skills, all nine projects, education, log, contact |
| `cv.html` / `cv-print.html` | The CV in HTML, plus a print-optimised variant behind `Oliver_Neal_CV.pdf` |
| `cyber-station.html` | Case study: Cyber Station, my ExpoTees 2026 award-winning final-year artefact |
| `tile-turfer.html` | Case study: Tile Turfer |
| `minimalists.html` | Case study: Minimalists |
| `wanted.html` | Case study: Wanted |
| `unicellular.html` | Case study: Unicellular |
| `tank-game.html` | Case study: 3D Netcode Tank Game |
| `pinnable.html` | Case study: Pinnable |
| `space-bar.html` | Case study: Space Bar Simulator |
| `privacy.html` | Privacy notice for the contact form and analytics |
| `404.html` | Not-found page |

Shared assets: `styles.css`, `main.js`, `fonts/`, `media/` (screenshots and hover-preview clips per project), `og/` (social preview images).

Discovery files: `sitemap.xml`, `robots.txt` (which welcomes AI crawlers explicitly), `llms.txt` (a curated plain-text summary of the whole site for language models), and `CNAME` for the custom domain.

---

## How it is built

- **One stylesheet, one script.** `styles.css` holds the design system (theme tokens, layout, components) and `main.js` handles interaction only: theme toggle, mobile navigation, scroll reveal, hover video previews on project cards, active nav highlighting, footer year.
- **Theme without a flash.** A tiny inline script in each `<head>` applies the stored or preferred theme before first paint; `main.js` only flips and persists it afterwards.
- **Degrades gracefully.** Reduced-motion and touch users get the static path: no scroll reveal animation, no hover video previews.
- **One structured-data graph.** `index.html` carries a single JSON-LD `@graph` with stable `@id`s, and every other page references `#person` and `#website` instead of restating them, so search engines resolve one Oliver Neal across the whole site rather than eleven unconnected copies.
- **Cache busting.** `styles.css` and `main.js` are referenced with a `?v=` version string so a deploy is picked up immediately rather than being served from a stale cache. See below.

---

## Running it locally

Any static file server works. There is a zero-install one wired up for Claude Code in `.claude/launch.json`, or:

```bash
python -m http.server 8347
```

Then open <http://localhost:8347>.

---

## Deploying

Push to `main`. GitHub Pages serves the repository root at the `CNAME` domain.

**After changing `styles.css` or `main.js`, bump the version string** so returning visitors are not served a cached copy against new markup:

```bash
sed -i 's/?v=[0-9-]*/?v=2026-08-09/g' *.html
```

Use the date of the deploy. Both `styles.css?v=` and `main.js?v=` are updated by that one command. It is also worth refreshing the relevant `<lastmod>` entries in `sitemap.xml` when a page's content actually changes.

---

## Author

**Oliver Neal**, gameplay programmer specialising in Unity and C#.

[oliverneal.dev](https://oliverneal.dev) · [itch.io](https://olivernealdev.itch.io) · [LinkedIn](https://www.linkedin.com/in/oliverjackneal/) · [GitHub](https://github.com/OliverNealDev)
