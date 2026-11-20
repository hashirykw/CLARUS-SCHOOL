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

/* ═════════ the book staircase ═════════ */
function spineTexture(title, num, open) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 140;
  const x = c.getContext('2d');
  x.fillStyle = open ? '#1C2338' : '#F4F0E7'; x.fillRect(0, 0, c.width, c.height);
  x.fillStyle = open ? '#D8A63C' : '#8C8778';
  x.fillRect(28, 20, 4, 100); x.fillRect(c.width - 32, 20, 4, 100);
  x.font = '700 30px "Archivo Wide", "Arial Black", sans-serif'; x.textBaseline = 'middle';
  x.fillText(num, 56, 72);
  x.font = '900 54px "Archivo Wide", "Arial Black", sans-serif';
  if ('letterSpacing' in x) x.letterSpacing = '6px';
  x.fillStyle = open ? '#F4F0E7' : '#1C2338';
  x.textAlign = 'center'; x.fillText(title.toUpperCase(), c.width / 2 + 20, 74);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
function book(w, h, d, coverMat, pagesMat) {
  const g = new THREE.Group();
  const cover = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 2, .035), coverMat); g.add(cover);
  const pages = new THREE.Mesh(new THREE.BoxGeometry(w - .08, h - .07, d - .05), pagesMat); pages.position.z = -.03; pages.position.x = .03; g.add(pages);
  return g;
}

export async function books(canvas, classes) {
  if (document.fonts) { try { await document.fonts.load('900 40px "Archivo Wide"'); } catch (e) {} }
  const scene = lightScene(null, { span: 7, key: [-6, 10, 8] });
  const pagesMat = std(0xF6F1E4, { roughness: .95 });
  const fillers = [std(NAVY, { roughness: .5 }), std(CRIMSON, { roughness: .55 }), std(0xD9C08F, { roughness: .6 }), std(0x8D9B7A, { roughness: .6 }), std(0xE7E0D0, { roughness: .7 }), std(0x2E3B5A, { roughness: .5 })];
  const root = new THREE.Group(); scene.add(root);
  const W = 1.9, D = 1.35, gap = 1.12, now = classes.filter(c => c.open).length - 1;
  const cols = [];
  let seed = 7; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  classes.forEach((c, i) => {
    const col = new THREE.Group(); col.position.x = (i - (classes.length - 1) / 2) * gap;
    let y = 0;
    for (let j = 0; j <= i; j++) {
      const top = j === i, h = top ? .34 : .22 + rnd() * .12;
      const mat = top ? new THREE.MeshStandardMaterial({ color: c.open ? NAVY : PAPER, roughness: c.open ? .45 : .8 }) : fillers[(i * 3 + j) % fillers.length];
      const b = book(W - rnd() * .16, h, D - rnd() * .1, mat, pagesMat);
      b.position.set((rnd() - .5) * .08, y + h / 2, (rnd() - .5) * .08); b.rotation.y = (rnd() - .5) * .08 + (top ? 0 : (rnd() - .5) * .06);
      if (top) {
        const lab = new THREE.Mesh(new THREE.PlaneGeometry(W - .2, h - .08), new THREE.MeshStandardMaterial({ map: spineTexture(c.title, String(i + 1).padStart(2, '0'), c.open), roughness: .6 }));
        lab.position.set(0, 0, D / 2 + .002); b.add(lab);
      }
      col.add(cast(b)); y += h;
    }
    col.userData.top = y;
    root.add(col); cols.push(col);
  });
  // the gold star standing on this year's class
  const st = new THREE.Mesh(new THREE.ExtrudeGeometry(starShape(), { depth: .08, bevelEnabled: true, bevelThickness: .02, bevelSize: .02, bevelSegments: 2 }), goldM());
  st.geometry.center(); st.scale.setScalar(.85); st.position.set(cols[now].position.x, cols[now].userData.top + .5, 0); cast(st); root.add(st);
  const stand = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .2, 10), goldM()); stand.position.set(st.position.x, cols[now].userData.top + .1, 0); root.add(stand);

  const camera = new THREE.PerspectiveCamera(26, 2, .5, 80);
  const state = { turn: 0, sc: 0 };
  const place = () => {
    root.rotation.y = -.32 + state.sc * .45 + state.turn;
    const narrow = camera.aspect < 1.8, d = narrow ? 15.5 : 11.2;
    camera.position.set(1.2, narrow ? 5.2 : 3.9, d); camera.lookAt(0, narrow ? 1.0 : 1.15, 0);
  };
  const live = liveCanvas(canvas, scene, camera, { onFrame: t => { st.rotation.y = t * .9; place(); return true; } });
  place();
  // drop the stacks in, one class after another
  const tl = gsap.timeline({ paused: true, onUpdate: live.invalidate });
  if (!REDUCE) {
    cols.forEach((c, i) => tl.from(c.position, { y: 4.5, duration: 1.1, ease: 'bounce.out' }, i * .12));
    tl.from(st.scale, { x: .001, y: .001, z: .001, duration: .9, ease: 'back.out(2)' }, cols.length * .12 + .2);
    tl.from(state, { turn: -.5, duration: 2.4, ease: 'power3.out' }, 0);
    ScrollTrigger.create({ trigger: canvas, start: 'top 80%', onEnter: () => tl.play() , toggleActions: 'play none none none' });
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

export async function eventStills() {
  const canvas = document.createElement('canvas');
  const r = makeRenderer(canvas, 1); r.setSize(640, 640, false);
  const out = [];
  const items = [
    [flask(), [0, 1.2, 0], .1, 7.2],
    [trophy(), [0, 1.3, 0], -.2, 7.6],
    [stage(), [0, 1.3, 0], -.35, 8.6],
    [palette(), [0, .2, 0], .35, 6.4],
  ];
  for (const [obj, look, turn, dist] of items) {
    const scene = lightScene(r, { env: .8, span: 4, key: [-4, 8, 6] });
    cast(obj); obj.rotation.y = turn; scene.add(obj);
    const cam = new THREE.PerspectiveCamera(30, 1, .1, 50);
    cam.position.set(dist * .45, dist * .52, dist * .8); cam.lookAt(...look);
    r.render(scene, cam);
    out.push(await new Promise(res => canvas.toBlob(b => res(URL.createObjectURL(b)), 'image/png')));
  }
  r.dispose(); r.forceContextLoss();
  return out;
}
