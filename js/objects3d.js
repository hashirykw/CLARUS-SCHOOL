// objects3d.js — more of the Clarus world in 3D, in the same presentation-model style as campus3d.js.
//   books(canvas):  the class staircase as stacks of hardback books, one stack per class, a gold star on this year's class
//   crest(canvas):  the Clarus logo as a solid emblem (navy pages, gold star) turning slowly in the light
//   eventStills():  Science Week, Sports Day, Annual Show and Colour Day as small 3D objects, rendered once to images
// Live canvases render only while on screen and only when something moves.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { makeRenderer, starShape } from './campus3d.js';

const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
const SMALL = () => innerWidth <= 820;
const { gsap, ScrollTrigger } = window;

const NAVY = 0x1C2338, CRIMSON = 0x8F2A36, GOLD = 0xD8A63C, PAPER = 0xF4F0E7;
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: .7, metalness: 0, ...o });
const goldM = () => std(GOLD, { roughness: .26, metalness: .8, envMapIntensity: 1.4 });

function lightScene(renderer, { env = .5, shadow = 1024, span = 6, key = [-5, 9, 7] } = {}) {
  const scene = new THREE.Scene(); scene.environmentIntensity = env;
  if (renderer) { const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), .04).texture; pm.dispose(); }
  scene.add(new THREE.HemisphereLight(0xffffff, 0xCFC2AA, .55));
  const k = new THREE.DirectionalLight(0xFFF1DC, 2.8); k.position.set(...key); k.castShadow = true;
  Object.assign(k.shadow.camera, { left: -span, right: span, top: span, bottom: -span, near: .5, far: 40 });
  k.shadow.mapSize.set(shadow, shadow); k.shadow.bias = -.0005; k.shadow.normalBias = .02; scene.add(k);
  const f = new THREE.DirectionalLight(0xDCE6FF, .45); f.position.set(6, 4, -5); scene.add(f);
  const c = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.ShadowMaterial({ color: 0x1A1F33, opacity: .16 }));
  c.rotation.x = -Math.PI / 2; c.receiveShadow = true; scene.add(c);
  return scene;
}
function cast(o) { o.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); return o; }

// a shared render-on-demand loop for one canvas
function liveCanvas(canvas, scene, camera, { pr, onFrame } = {}) {
  const renderer = makeRenderer(canvas, pr || Math.min(devicePixelRatio || 1, SMALL() ? 1.3 : 1.6));
  const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), .04).texture; pm.dispose();
  let visible = false, dirty = true;
  const size = () => { const r = canvas.getBoundingClientRect(); renderer.setSize(Math.max(1, r.width), Math.max(1, r.height), false); camera.aspect = r.width / Math.max(1, r.height); camera.updateProjectionMatrix(); dirty = true; };
  size(); addEventListener('resize', size);
  new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) dirty = true; }, { rootMargin: '120px' }).observe(canvas);
  gsap.ticker.add(time => {
    if (!visible || document.hidden) return;
    if (onFrame && onFrame(time)) dirty = true;
    if (dirty) { renderer.render(scene, camera); dirty = false; }
  });
  return { invalidate: () => { dirty = true; }, renderer };
}

/* ═════════ the book staircase: a library shelf of leather-bound volumes on a stone plinth ═════════ */
function spineLabel(title, num, open) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 128;
  const x = c.getContext('2d');
  const ink = open ? '#E3B85A' : '#1C2338';
  x.fillStyle = ink; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.font = '700 20px "Archivo Wide", "Arial Black", sans-serif'; if ('letterSpacing' in x) x.letterSpacing = '4px';
  x.fillText(num, 256, 30);
  const t = title.toUpperCase(); let size = 46;
  x.font = `900 ${size}px "Archivo Wide", "Arial Black", sans-serif`;
  while (x.measureText(t).width > 440 && size > 20) { size -= 2; x.font = `900 ${size}px "Archivo Wide", "Arial Black", sans-serif`; }
  x.fillText(t, 256, 76);
  x.fillRect(150, 108, 212, 2);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8; return tex;
}
function coverLabel(title, num, open) {
  const c = document.createElement('canvas'); c.width = 640; c.height = 400;
  const x = c.getContext('2d'), ink = open ? '#E3B85A' : '#7A5A2A';
  x.strokeStyle = ink; x.lineWidth = 4; x.strokeRect(22, 22, 596, 356); x.lineWidth = 1.5; x.strokeRect(36, 36, 568, 328);
  x.fillStyle = ink; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.font = '700 30px "Archivo Wide", "Arial Black", sans-serif'; if ('letterSpacing' in x) x.letterSpacing = '8px';
  x.fillText(num, 320, 110);
  const t = title.toUpperCase(); let size = 78;
  x.font = `900 ${size}px "Archivo Wide", "Arial Black", sans-serif`; if ('letterSpacing' in x) x.letterSpacing = '2px';
  while (x.measureText(t).width > 520 && size > 30) { size -= 2; x.font = `900 ${size}px "Archivo Wide", "Arial Black", sans-serif`; }
  x.fillText(t, 320, 205);
  x.fillRect(250, 285, 140, 3);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8; return tex;
}
function volume(W, h, D, leather, pages, gilt, label, coverTex) {
  const g = new THREE.Group();
  const cover = new THREE.Mesh(new RoundedBoxGeometry(W, h, D, 3, Math.min(.04, h * .2)), leather); g.add(cover);
  const block = new THREE.Mesh(new THREE.BoxGeometry(W - .06, h - .07, D - .06), pages); block.position.z = -.04; g.add(block);
  // gilt page edges on the three open sides
  const e1 = new THREE.Mesh(new THREE.BoxGeometry(W - .07, h - .08, .006), gilt); e1.position.z = -D / 2 - .002; g.add(e1);
  // raised bands across the spine
  for (const bx of [-.36, -.12, .12, .36]) { const r = new THREE.Mesh(new RoundedBoxGeometry(.035, h + .012, .03, 1, .01), leather); r.position.set(bx * W, 0, D / 2); g.add(r); }
  for (const bx of [-.44, .44]) { const r = new THREE.Mesh(new THREE.BoxGeometry(.012, h - .05, .006), gilt); r.position.set(bx * W, 0, D / 2 + .004); g.add(r); }
  if (coverTex) { const l = new THREE.Mesh(new THREE.PlaneGeometry(D * .8, W * .82), new THREE.MeshStandardMaterial({ map: coverTex, transparent: true, roughness: .3, metalness: .55 })); l.rotation.x = -Math.PI / 2; l.rotation.z = Math.PI / 2; l.position.y = h / 2 + .003; g.add(l); }
  if (label) { const l = new THREE.Mesh(new THREE.PlaneGeometry(W * .66, h * .82), new THREE.MeshStandardMaterial({ map: label, transparent: true, roughness: .3, metalness: .5 })); l.position.set(0, 0, D / 2 + .006); g.add(l); }
  return g;
}

export async function books(canvas, classes) {
  if (document.fonts) { try { await document.fonts.load('900 40px "Archivo Wide"'); await document.fonts.load('700 20px "Archivo Wide"'); } catch (e) {} }
  const scene = lightScene(null, { span: 7, key: [-6, 10, 8], env: .65 });
  const leather = {
    navy: std(0x1E2742, { roughness: .42, metalness: .05, envMapIntensity: 1.2 }),
    ox:   std(0x6A1E2B, { roughness: .45, metalness: .05, envMapIntensity: 1.2 }),
    tan:  std(0x8E6038, { roughness: .5, envMapIntensity: 1.1 }),
    vell: std(0xEDE4D0, { roughness: .6 }),
    green:std(0x2F4A3A, { roughness: .45, envMapIntensity: 1.1 }),
  };
  const pages = std(0xF4EEDD, { roughness: .9 }), gilt = goldM();
  const marble = std(0xEEE8DC, { roughness: .28, envMapIntensity: 1.3 });
  const root = new THREE.Group(); scene.add(root);
  const W = 1.04, D = 1.4, gap = 1.2, now = classes.filter(c => c.open).length - 1, n = classes.length;
  const cycle = ['ox', 'navy', 'vell', 'navy', 'ox', 'navy'];
  // the plinth: stepped stone with a gold inlay line
  const L = n * gap + 1.0;
  const p1 = new THREE.Mesh(new RoundedBoxGeometry(L + .5, .22, D + .8, 3, .04), marble); p1.position.y = .11;
  const p2 = new THREE.Mesh(new RoundedBoxGeometry(L, .2, D + .45, 3, .04), marble); p2.position.y = .32;
  const inlay = new THREE.Mesh(new THREE.BoxGeometry(L - .1, .025, .01), gilt); inlay.position.set(0, .32, (D + .45) / 2 + .002);
  root.add(cast(p1), cast(p2), inlay);
  const base = .42;
  // two classical columns frame the shelf, the right one taller: the way up
  const column = (h) => {
    const c = new THREE.Group();
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(.17, .2, h, 24, 1), marble); shaft.position.y = .14 + h / 2; c.add(shaft);
    for (let i = 0; i < 12; i++) { const f = new THREE.Mesh(new THREE.BoxGeometry(.02, h * .96, .03), std(0xE2DBCD, { roughness: .4 })); const ang = i / 12 * Math.PI * 2; f.position.set(Math.sin(ang) * .19, .14 + h / 2, Math.cos(ang) * .19); f.rotation.y = ang; c.add(f); }
    const b = new THREE.Mesh(new RoundedBoxGeometry(.5, .14, .5, 2, .02), marble); b.position.y = .07; c.add(b);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(.28, .2, .14, 24), marble); cap.position.y = .14 + h + .07; c.add(cap);
    const ab = new THREE.Mesh(new RoundedBoxGeometry(.6, .1, .6, 2, .02), marble); ab.position.y = .14 + h + .19; c.add(ab);
    return cast(c);
  };
  const cl = column(1.2); cl.position.set(-L / 2 - .05, base, -.2); root.add(cl);
  const cr = column(2.5); cr.position.set(L / 2 + .05, base, -.2); root.add(cr);
  const cols = [];
  classes.forEach((c, i) => {
    const col = new THREE.Group(); col.position.x = (i - (n - 1) / 2) * gap; col.position.y = base;
    let y = 0;
    for (let j = 0; j <= i; j++) {
      const top = j === i, h = top ? .3 : .21 + ((i * 7 + j * 3) % 5) * .018;
      const mat = top ? (c.open ? leather.navy : leather.vell) : leather[cycle[(i + j * 2) % cycle.length]];
      const v = volume(W - (j % 3) * .04, h, D - (j % 2) * .06, mat, pages, gilt, null, top ? coverLabel(c.title, String(i + 1).padStart(2, '0'), c.open) : null);
      v.position.set(((i + j) % 3 - 1) * .012, y + h / 2, ((i * 2 + j) % 3 - 1) * .012); v.rotation.y = ((i + j) % 2 ? 1 : -1) * .012;
      col.add(cast(v)); y += h;
    }
    col.userData.top = y; root.add(col); cols.push(col);
  });
  // this year's class: a gold star on a slim stand
  const st = new THREE.Mesh(new THREE.ExtrudeGeometry(starShape(), { depth: .07, bevelEnabled: true, bevelThickness: .02, bevelSize: .02, bevelSegments: 2 }), gilt);
  st.geometry.center(); st.scale.setScalar(.62);
  const holder = new THREE.Group(); holder.position.set(cols[now].position.x, base + cols[now].userData.top, 0);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(.02, .03, .34, 10), gilt); stem.position.y = .17; holder.add(stem);
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(.12, .14, .04, 20), gilt); foot.position.y = .02; holder.add(foot);
  st.position.y = .66; holder.add(st); root.add(cast(holder));

  const camera = new THREE.PerspectiveCamera(26, 2.6, .5, 80);
  const state = { turn: 0, sc: 0, spin: 0 }; let lastT = 0;
  const place = () => {
    root.rotation.y = -.26 + state.sc * .4 + state.turn + state.spin;
    const narrow = camera.aspect < 1.8, d = narrow ? 15 : 11.5;
    camera.position.set(1.0, narrow ? 6.2 : 5.0, d); camera.lookAt(0, narrow ? 1.4 : 1.6, 0);
  };
  const live = liveCanvas(canvas, scene, camera, { onFrame: t => { const dt = Math.min(.05, t - (lastT || t)); lastT = t; if (!REDUCE) state.spin += dt * Math.PI * 2 / 36; st.rotation.y = .35 + Math.sin(t * .9) * .5 - state.spin * 0; place(); return true; } });
  place();
  const tl = gsap.timeline({ paused: true, onUpdate: live.invalidate });
  if (!REDUCE) {
    // volumes are gathered one at a time and stacked, class by class, bottom to top
    let k = 0;
    tl.from([p1.scale, p2.scale], { x: .001, duration: 1.1, ease: 'expo.out', stagger: .08 }, 0).from(inlay.scale, { x: .001, duration: 1.2, ease: 'expo.out' }, .3)
      .from([cl.scale, cr.scale], { y: .001, duration: 1.2, ease: 'expo.out', stagger: .1 }, .25);
    cols.forEach((c, i) => c.children.forEach((v, j) => {
      const at = .5 + k++ * .045, side = (i + j) % 2 ? 1 : -1;
      tl.from(v.position, { y: `+=${2.4 + j * .15}`, x: `+=${side * 1.6}`, z: '+=1.2', duration: .9, ease: 'power4.out' }, at)
        .from(v.rotation, { z: side * .9, y: side * .6, duration: .9, ease: 'power4.out' }, at);
    }));
    tl.from(holder.position, { y: '+=2.5', duration: 1, ease: 'bounce.out' }, .5 + k * .045 + .1).from(holder.scale, { x: .001, y: .001, z: .001, duration: .5, ease: 'back.out(2)' }, .5 + k * .045 + .1);
    tl.from(state, { turn: -.45, duration: 2.4, ease: 'power3.out' }, 0);
    ScrollTrigger.create({ trigger: canvas, start: 'top 80%', onEnter: () => tl.play(), toggleActions: 'play none none none' });
    ScrollTrigger.create({ trigger: canvas, start: 'top bottom', end: 'bottom top', onUpdate: s => { state.sc = s.progress; } });
  }
  return live;
}

/* ═════════ the crest ═════════ */
export async function crest(canvas) {
  const scene = lightScene(null, { env: .7, span: 4, key: [-4, 7, 8] });
  const navy = new THREE.MeshStandardMaterial({ color: NAVY, roughness: .32, metalness: .35, envMapIntensity: 1.3 });
  const svg = '<svg>' + ['cb1', 'cb2', 'cb3', 'cb4'].map(id => `<path d="${document.getElementById(id).getAttribute('d')}"/>`).join('') + '</svg>';
  const data = new SVGLoader().parse(svg);
  const shapes = data.paths.flatMap(p => p.toShapes(true));
  const wingGeo = new THREE.ExtrudeGeometry(shapes, { depth: 16, bevelEnabled: true, bevelThickness: 3, bevelSize: 2, bevelSegments: 3, curveSegments: 6 });
  wingGeo.translate(-246.25, -200, -8);
  const emblem = new THREE.Group();
  const s = .012;
  const left = new THREE.Mesh(wingGeo, navy); left.scale.set(s, -s, s);
  const right = new THREE.Mesh(wingGeo, navy); right.scale.set(-s, -s, s);
  emblem.add(left, right);
  const star = new THREE.Mesh(new THREE.ExtrudeGeometry(starShape(), { depth: .16, bevelEnabled: true, bevelThickness: .04, bevelSize: .03, bevelSegments: 3 }), goldM());
  star.geometry.translate(0, 0, -.08); star.scale.setScalar(184 * s); star.position.set(0, -(170 - 200) * s, .05);
  emblem.add(star);
  emblem.position.y = 3.0; cast(emblem); scene.add(emblem);
  // a slim plinth under it, like a trophy on a shelf
  const plinth = new THREE.Mesh(new RoundedBoxGeometry(3.4, .3, 1.6, 3, .06), std(PAPER, { roughness: .85 })); plinth.position.y = .15; cast(plinth); scene.add(plinth);
  const band = new THREE.Mesh(new THREE.BoxGeometry(3.42, .05, 1.62), goldM()); band.position.y = .28; scene.add(band);
  const camera = new THREE.PerspectiveCamera(28, 1, .5, 60);
  camera.position.set(0, 3.2, 11.5); camera.lookAt(0, 2.5, 0);
  let sc = 0;
  if (!REDUCE) ScrollTrigger.create({ trigger: canvas, start: 'top bottom', end: 'bottom top', onUpdate: x => { sc = x.progress; } });
  return liveCanvas(canvas, scene, camera, {
    onFrame: t => {
      if (REDUCE) return false;
      emblem.rotation.y = Math.sin(t * .45) * .55 + (sc - .5) * .8;
      emblem.position.y = 3.0 + Math.sin(t * 1.1) * .06;
      star.rotation.z = Math.sin(t * .7) * .08;
      return true;
    }
  });
}

/* ═════════ school life objects (rendered once) ═════════ */
function flask() {
  const g = new THREE.Group();
  const prof = [[0, 0], [.95, 0], [1.02, .08], [.98, .2], [.38, 1.45], [.34, 2.1], [.4, 2.18], [.4, 2.26], [0, 2.26]].map(([x, y]) => new THREE.Vector2(x, y));
  const glass = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: .05, transmission: .92, thickness: .3, ior: 1.4, transparent: true });
  g.add(new THREE.Mesh(new THREE.LatheGeometry(prof, 48), glass));
  const liq = [[0, .06], [.88, .06], [.93, .14], [.62, .78], [0, .78]].map(([x, y]) => new THREE.Vector2(x, y));
  g.add(new THREE.Mesh(new THREE.LatheGeometry(liq, 48), std(CRIMSON, { roughness: .2, emissive: 0x3a0a10, emissiveIntensity: .4 })));
  const cork = new THREE.Mesh(new THREE.CylinderGeometry(.36, .31, .32, 24), std(0xB08A5B, { roughness: .9 })); cork.position.y = 2.36; g.add(cork);
  [[.2, 1.1, .1, .11], [-.15, 1.5, .05, .08], [.05, 1.9, -.05, .06]].forEach(([x, y, z, r]) => { const b = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), std(0xF3D9DC, { roughness: .1, transparent: true, opacity: .8 })); b.position.set(x, y, z); g.add(b); });
  return g;
}
function trophy() {
  const g = new THREE.Group(), gold = goldM();
  const cup = [[0, 0], [.2, 0], [.2, .1], [.12, .2], [.12, .7], [.3, .82], [.72, 1.35], [.82, 2.1], [.86, 2.14], [.8, 2.16], [.7, 1.45], [.25, .98], [0, .98]].map(([x, y]) => new THREE.Vector2(x, y));
  const c = new THREE.Mesh(new THREE.LatheGeometry(cup, 48), gold); c.position.y = .5; g.add(c);
  for (const s of [-1, 1]) { const h = new THREE.Mesh(new THREE.TorusGeometry(.32, .06, 12, 32, Math.PI * 1.2), gold); h.position.set(s * .86, 2.05, 0); h.rotation.z = s > 0 ? -Math.PI * .6 : Math.PI * 1.6; g.add(h); }
  const base = new THREE.Mesh(new RoundedBoxGeometry(1.2, .5, 1.2, 2, .05), std(NAVY, { roughness: .4 })); base.position.y = .25; g.add(base);
  const plate = new THREE.Mesh(new THREE.BoxGeometry(.7, .2, .02), gold); plate.position.set(0, .26, .61); g.add(plate);
  const st = new THREE.Mesh(new THREE.ExtrudeGeometry(starShape(), { depth: .05, bevelEnabled: false }), gold); st.scale.setScalar(.45); st.position.set(0, 1.75, .78); g.add(st);
  return g;
}
function stage() {
  const g = new THREE.Group(), red = std(CRIMSON, { roughness: .75, side: THREE.DoubleSide });
  const floor = new THREE.Mesh(new RoundedBoxGeometry(3.4, .3, 1.8, 2, .04), std(0xC9A473, { roughness: .6 })); floor.position.y = .15; g.add(floor);
  const back = new THREE.Mesh(new THREE.BoxGeometry(3.4, 2.4, .08), std(NAVY, { roughness: .8 })); back.position.set(0, 1.5, -.85); g.add(back);
  const curtain = (sx) => {
    const geo = new THREE.PlaneGeometry(1.15, 2.5, 24, 8), p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); const gather = (y + 1.25) / 2.5; p.setZ(i, Math.sin((x + .6) * 16) * .07 * (.4 + gather)); p.setX(i, x * (1 - (1 - gather) * .35 * (sx > 0 ? 1 : 1)) + (1 - gather) * .2 * -sx); }
    geo.computeVertexNormals(); const m = new THREE.Mesh(geo, red); m.position.set(sx * 1.12, 1.55, -.6); return m;
  };
  g.add(curtain(-1), curtain(1));
  const val = new THREE.Mesh(new THREE.BoxGeometry(3.5, .32, .14), red); val.position.set(0, 2.78, -.55); g.add(val);
  const st = new THREE.Mesh(new THREE.ExtrudeGeometry(starShape(), { depth: .06, bevelEnabled: false }), goldM()); st.scale.setScalar(.7); st.position.set(0, 1.6, -.78); g.add(st);
  const spot = new THREE.Mesh(new THREE.CircleGeometry(.7, 40), new THREE.MeshBasicMaterial({ color: 0xFFE7A8, transparent: true, opacity: .5 })); spot.rotation.x = -Math.PI / 2; spot.position.set(0, .305, 0); g.add(spot);
  return g;
}
function palette() {
  const g = new THREE.Group();
  const s = new THREE.Shape(); s.absellipse(0, 0, 1.5, 1.05, 0, Math.PI * 2, false, 0);
  const hole = new THREE.Path(); hole.absellipse(-.75, -.35, .2, .17, 0, Math.PI * 2, true, 0); s.holes.push(hole);
  const notch = new THREE.Path(); notch.absellipse(-1.45, -.05, .3, .25, 0, Math.PI * 2, true, 0); s.holes.push(notch);
  const pal = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: .12, bevelEnabled: true, bevelThickness: .03, bevelSize: .03, bevelSegments: 2, curveSegments: 48 }), std(0xCDA673, { roughness: .55 }));
  pal.rotation.x = -Math.PI / 2; g.add(pal);
  [[CRIMSON, .2, .55], [GOLD, .85, .3], [0x6FA9D6, .95, -.35], [0x8D9B7A, .25, -.6], [0xF4F0E7, -.35, .55]].forEach(([c, x, z]) => {
    const b = new THREE.Mesh(new THREE.SphereGeometry(.24, 24, 16), std(c, { roughness: .25 })); b.scale.y = .35; b.position.set(x, .2, -z); g.add(b);
  });
  const brush = new THREE.Group();
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(.045, .07, 2.2, 16), std(NAVY, { roughness: .4 })); brush.add(handle);
  const ferrule = new THREE.Mesh(new THREE.CylinderGeometry(.075, .075, .25, 16), goldM()); ferrule.position.y = 1.2; brush.add(ferrule);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(.075, .3, 16), std(CRIMSON, { roughness: .6 })); tip.position.y = 1.47; brush.add(tip);
  brush.rotation.set(0, 0, -1.2); brush.position.set(.1, .45, .25); g.add(brush);
  return g;
}

export const SPIN_FRAMES = 36;
/* each school-life object is rendered as a full 360° turntable strip, then played back with CSS steps():
 * real 3D rotation at the cost of an image, with no live WebGL context per card */
export async function eventStills(size = 300) {
  const F = SPIN_FRAMES;
  const canvas = document.createElement('canvas');
  const r = makeRenderer(canvas, 1); r.setSize(size, size, false);
  const strip = document.createElement('canvas'); strip.width = size * F; strip.height = size;
  const sx = strip.getContext('2d');
  const out = [];
  const items = [
    [flask(), [0, 1.2, 0], .1, 7.2],
    [trophy(), [0, 1.3, 0], -.2, 7.6],
    [stage(), [0, 1.2, 0], -.35, 10.6],
    [palette(), [0, .2, 0], .35, 6.4],
  ];
  const breathe = () => new Promise(res => setTimeout(res, 0));
  for (const [obj, look, turn, dist] of items) {
    const scene = lightScene(r, { env: .8, span: 4, key: [-4, 8, 6] });
    cast(obj); scene.add(obj);
    const cam = new THREE.PerspectiveCamera(30, 1, .1, 50);
    cam.position.set(dist * .45, dist * .52, dist * .8); cam.lookAt(...look);
    sx.clearRect(0, 0, strip.width, size);
    for (let f = 0; f < F; f++) {
      obj.rotation.y = turn + f / F * Math.PI * 2;
      r.render(scene, cam); sx.drawImage(canvas, f * size, 0);
      if (f % 6 === 5) await breathe();
    }
    out.push(await new Promise(res => strip.toBlob(b => res(URL.createObjectURL(b)), 'image/webp', .9)));
  }
  r.dispose(); r.forceContextLoss();
  return out;
}
