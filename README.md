# Clarus Junior — scroll journey prototype

Confidential. Not for public release. `noindex` is set in `index.html`.

A working prototype of the 3D class journey: scrolling walks the camera along a coloured path through five scenes (Nursery, KG, Class 1, Class 2, Beyond Junior), with the mascot walking alongside and each class title typing in.

## Run it

It must be served over HTTP (the 3D models will not load from a double-clicked file).

```
cd CLARUS-SCHOOL
python3 -m http.server 8000
```

Then open http://localhost:8000. On Vercel it works as-is: plain static files, no build step.

## What's inside

| Path | What it is |
| --- | --- |
| `index.html` | Page structure. The first class's text is in the HTML so nothing blinks on load. |
| `css/style.css` | All styles and colour tokens. Phone layout below 820px. |
| `js/main.js` | Scroll logic and the class text. **Edit class names and wording in the `CLASSES` list at the top.** |
| `js/world.js` | Builds the 3D world: floor, path, lights, camera, mascot, and loads the five scene models. |
| `models/*.glb` | The five scenes, exported from the Blender files and compressed (about 2.4 MB in total). |
| `blender/` | The Blender source files, renders and build script. Not deployed. |
| `vendor/` | Three.js r187, GSAP 3.15 (ScrollTrigger, SplitText), Lenis 1.3, all local. Nothing is loaded from outside. |
| `fonts/` | Jost (headings) and Inter (body), self-hosted. |

## Blender files

The five scene files, their renders and the build script are in `blender/` (see `blender/README.md`). That folder is excluded from Vercel deploys by `.vercelignore`, so it is never served on the live site.

## Swapping in real art

Each scene loads from `models/<name>.glb`: `nursery`, `kg`, `class1`, `class2`, `beyond`.

1. Open the matching `.blend` file in `blender/blend/` or make a new scene.
2. Keep the scene roughly within 6 m wide, with the floor at height 0 and the front edge facing the camera.
3. Export the **Scene** collection only as glTF Binary (`.glb`).
4. Compress it: `npx gltf-transform optimize in.glb out.glb --compress meshopt --texture-compress webp`
5. Replace the file in `models/`. No code changes needed.

If a model file is missing, the code-built version of that scene is used instead, so the page never breaks.

The path, mascot, lights and shadows are added by the code, not by the models.

## Placeholders still to replace

- Class names, wording, and the four numbers in the About section
- The mascot (stand-in flame character)
- The children and classroom art (Blender scenes built from simple shapes)
- The Clarus logo

## Notes

- Respects reduced-motion: no typing animation, no smooth scroll.
- Pixel ratio is capped (1.5 on phones, 2 on desktop) to keep mid-range Android phones smooth.
- `?capture=1` in the URL is only used for recording the walkthrough video.
