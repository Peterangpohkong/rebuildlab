# rebuildlab.co

Static one-page site for Rebuild Lab. No build step, no dependencies: plain HTML, CSS and vanilla JS.

```
index.html          all markup + copy
css/styles.css      design tokens, layout, motion
js/main.js          scroll reveals, counters, sliders, canvas motion graphics
assets/favicon.svg
serve.js            tiny local preview server (node only, dev-only)
```

## Positioning

Rebuild Lab is an **AI-native consultancy**. We embed into a client's business and rebuild how it operates around AI agents, usually starting with the website, then moving into backend systems (recruiting, workforce, ops, finance). Public positioning is global; no country names on the site.

## Preview locally

```bash
node serve.js 4321
```

Then open http://localhost:4321

## Deploy

Any static host works. Drop the folder in. `serve.js` is dev-only and can be deleted before deploying.

**Vercel:** `npx vercel --prod` from this folder, then add `rebuildlab.co` in Project → Settings → Domains.
**Netlify:** drag the folder onto app.netlify.com/drop, then Domain settings → add custom domain.
**Cloudflare Pages:** Create project → Direct upload, then Custom domains → `rebuildlab.co`.

DNS at the registrar: point the apex `A`/`ALIAS` record and the `www` `CNAME` at whatever the host gives you.

## Motion (what's animating, and where to tune it)

| Effect | Where |
| --- | --- |
| Flowing dot-wave fields (hero, mid-page, CTA) | `DotWave()` in `js/main.js`: `amp`, `speed`, `cols`, `rows`, `alpha` per instance at the bottom of the file |
| Orbiting particle ring around the cutover panel | `DotRing()` |
| Rotating halftone sphere in the testimonial block | `DotSphere()` |
| Line-by-line masked headline reveal | `[data-split]` in HTML, styles in `styles.css` |
| Blur + rise reveal on scroll | `[data-reveal]`, stagger with `data-reveal-delay="120"` (ms) |
| Word-by-word highlight tied to scroll position | `[data-words]` |
| Count-up numbers | `data-count="41" data-suffix="M"` |
| Progress bars | `data-bar="72"` |
| Sparklines | `data-spark="4,6,5,9,…"` |
| Infinite logo / systems marquees | `.marquee__track`, `.vscroll__track` (JS clones the group for a seamless loop) |
| Panel pointer-glow + 3D tilt | `data-tilt` |
| Nav hide-on-scroll, scroll progress bar | `onScroll()` |

Everything is disabled under `prefers-reduced-motion: reduce`.

## Placeholders to swap before launch

- Portfolio links: `relocal.co`, `trypitch.co`, `open.cx`, `rebuildlab.co`.
- `hello@rebuildlab.co` (used in the CTA, footer and mailto links).
- `assets/og.png` is referenced by the Open Graph tags but not included. Add a 1200×630 share image.
- The newsletter form validates and shows a message client-side only; wire it to your provider's endpoint in `js/main.js` (section 14).
