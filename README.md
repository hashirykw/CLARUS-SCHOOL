# Clarus School — website

Confidential. Not for public release. `noindex` is set on both pages.

Two pages, one feel: both scroll through a continuous 3D world with smooth scrolling, and moving between them uses a soft page transition.

| Page | What it is |
| --- | --- |
| `index.html` | The main school site. Opening (star, ring, name) → ink-navy hero with the 3D logo, orbit rings and floating books → a 3D student climbs a staircase of books, growing at each class → waves at each campus → content sections. Light and dark themes. |
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
- Principal's photo, name and message (`src/index.template.html`, section `.msg`, marked PLACEHOLDER)
- Teachers' names, photos and classes (section `.staff`)
- Fee schedule figures (section `.fees`, shows "To be announced")
- Event dates (section `.life`, shows "Date to be announced")
- Footer: campus address and school hours
- Clarus Junior: the four number tiles (00)

## Photographs

Event, footer and phone-hero photos in `assets/photos/` are free stock photos from Unsplash (Unsplash License: free to use, no attribution required). Swap them for the school's own photos when they exist, keeping the same file names.

## Sharing, icons and hosting

- Link previews (WhatsApp, Facebook, X, LinkedIn): `assets/og.jpg` for the main page, `assets/og-junior.jpg` for Clarus Junior, 1200×630. The site address in the tags is `https://clarus.nexlyr.solutions`.
- Icons: `favicon.ico`, `assets/favicon.svg`, `apple-touch-icon.png`, `assets/icon-192.png`, `assets/icon-512.png`, listed in `site.webmanifest` (the site can be added to a phone's home screen).
- `vercel.json`: clean URLs (`/junior`), long caching for fonts, libraries and models, and basic security headers. `404.html` is the branded not-found page.
- Both pages still carry `noindex`, so search engines skip them; remove that tag when the school is ready to be found on Google.

## Notes

- Preloader plays once per browser session; reduced-motion users skip it.
- Theme follows the device the first time, then remembers the visitor's choice.
- Pixel ratio is capped (1.6 on phones, 2 on desktop); the 3D stops rendering once the content sheet covers it.
- Design language follows the Sir Xahid site: layered glass, grain and glows, rolling-label buttons, and the Light/Dark mode pill with the sound button bottom-left. Palette sampled from the logo: navy #182D47, gold #BE9D5E / #A5854C / #977945, cream #F6F2E7, with a glowing ember orb on buttons (from the user's glass button references). Admissions, fees and the footer use frosted ink glass.
- The logo's star is an eight-point compass star (src/defs.html), replacing the long-armed four-point star.
- Sounds play only after the visitor's first tap, and can be switched off from the side controls.
- Vendors are local: Three.js r187 (minified to `vendor/three/three.min.js`), GSAP 3.15, Lenis 1.3. Fonts are self-hosted: Cinzel (logo wordmark), Playfair Display (headings) and Poppins (text), plus Jost for the 3D labels on the junior page. Clarus Junior shares the main page's nav, buttons and footer (`js/chrome.js`) and is built from `src/junior.template.html` by `python3 src/build.py`.
