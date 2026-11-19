# Clarus School — website

Confidential. Not for public release. `noindex` is set on both pages.

Two pages, one feel: both scroll through a continuous 3D world with smooth scrolling, and moving between them uses a soft page transition.

| Page | What it is |
| --- | --- |
| `index.html` | The main school site. Preloader → 3D logo opens → the star climbs a staircase of books (one book per class) → lands on each campus on a turntable → content sections. Light and dark themes. |
| `junior.html` | Clarus Junior: the playful 3D walk through Nursery, KG, Class 1 and Class 2. |

## Run it

Must be served over HTTP (3D and modules do not load from a double-clicked file).

```
python3 -m http.server 8000
```

Open http://localhost:8000. On Vercel it works as-is: static files, no build on the server.

## Editing

| What | Where |
| --- | --- |
| Class names and wording on the main page | `CLASSES` at the top of `js/home.js` |
| Campus names, details and map links (empty fields are hidden) | `CAMPUSES` at the top of `js/home.js` |
| School WhatsApp number for the visit form | `WHATSAPP` at the top of `js/home.js` |
| Page text | `src/index.template.html`, then run `python3 src/build.py` to rebuild `index.html` |
| Colours, fonts, spacing (both themes) | `css/tokens.css` |
| Sound effects (synthesised, no files) | `js/sound.js` |
| Layout and styles | `css/home.css` |
| The 3D world (emblem, books, campuses, camera path) | `js/world-home.js` |
| Junior page | `junior.html`, `css/style.css`, `js/main.js`, `js/world.js` |

`index.html` is generated: edit `src/index.template.html` and run `python3 src/build.py`. The build only pastes in the logo shapes (`src/defs.html`), the preloader (`src/loader.html`) and the Nexlyr credit (`src/nexlyr.html`). `src/` is not deployed.

## Logo

The mark (book pages + four-point star) is re-drawn as a vector from the sample logo (19 Nov 2026), so it is crisp at any size and the pages can animate separately. Files: `assets/clarus-mark.svg`, `assets/favicon.svg`. If the final logo changes, replace the four page shapes `cb1`–`cb4` in `src/defs.html` and the star points in `js/home.js`, then rebuild.

## Placeholders still to replace

- Campus names and details (Flagship / Junior / Next are placeholders)
- WhatsApp number for the form (until then it says online booking opens soon)

## Notes

- Preloader plays once per browser session; reduced-motion users skip it.
- Theme follows the device the first time, then remembers the visitor's choice.
- Pixel ratio is capped (1.6 on phones, 2 on desktop); the 3D stops rendering once the content sheet covers it.
- Buttons follow the SMK site: gold gradient with a cut corner, a light sweep on hover, and a magnetic pull towards the pointer (`data-mag`).
- Sounds play only after the visitor's first tap, and can be switched off from the side controls.
- Vendors are local: Three.js r187 (minified to `vendor/three/three.min.js`), GSAP 3.15, Lenis 1.3. Fonts are self-hosted: Cinzel (logo wordmark), Cormorant Garamond (headings) and Geist (text), plus Jost/Inter for the junior page.
