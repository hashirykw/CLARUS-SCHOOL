# Clarus Junior — Blender scenes

Confidential.

Five Blender 5.3 files, one per class scene in the website journey. Open any of them in Blender 4.2 or newer.

| File | Scene |
| --- | --- |
| `blend/nursery.blend` | Nursery: table with three children, easel, shelf, blocks |
| `blend/kg.blend` | KG: reading rug, letter blocks, tent, round table |
| `blend/class1.blend` | Class 1: whiteboard, two desks, abacus, science table |
| `blend/class2.blend` | Class 2: group table with globe, presenter at chart easel, bookshelf |
| `blend/beyond.blend` | Beyond Junior: three children facing steps to a glowing arch, class signposts |

## How each file is organised

- **Scene** — the classroom and children. This is the only part the website loads.
- **Mascot** — the flame character, placed on the path for the render.
- **Path** — the coloured ribbon for this scene.
- **Stage** — a shadow-catcher floor, so renders come out on a transparent background.
- **Lights** — key sun, soft fill, mascot glow (plus an arch glow in Beyond).
- **Camera** — matches the website's camera position and lens.

Render engine is Cycles, transparent film, so `render/*.png` drop straight onto the page colour (#F1ECE4). `render/*_final.jpg` are the same images already on that colour.

## Exporting for the website

Select the **Scene** collection only, File → Export → glTF 2.0, format glTF Binary, "Selected Objects" on. Then compress (see the prototype's README) and replace the file in the prototype's `models/` folder.

## What these are

Placeholder art. The characters and furniture are built from simple shapes so the layout, camera, lighting and scale are all locked in. A 3D artist can rebuild each scene inside the same file, keeping the camera and lights, and the website will pick it up with no code changes.
