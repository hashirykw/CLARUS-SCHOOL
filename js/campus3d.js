// campus3d.js — the Clarus campus as an architect's presentation model (white card, light wood, glass, felt lawn).
// Hero: the main building assembles itself on its board, then turns gently with scroll and pointer.
// Campuses: the Senior and Junior buildings are rendered once as stills for the two campus cards.
// Everything is built here from simple shapes (no downloads) and merged per material, so it draws in a handful of calls.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
const SMALL = () => innerWidth <= 820;

/* ───────── materials (shared) ───────── */
export function makeMaterials() {
  const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: .82, metalness: 0, ...o });
  return {
    card:   std(0xF4F0E7, { roughness: .9 }),
    trim:   std(0xE3DCCD, { roughness: .85 }),
    board:  std(0xD3BC97, { roughness: .6 }),
    edge:   std(0xA88560, { roughness: .6 }),
    wood:   std(0x9C7349, { roughness: .55 }),
    stone:  std(0xE2D9C8, { roughness: .95 }),
    lawn:   std(0xA4AE8F, { roughness: 1 }),
    leaf:   std(0x8C9C78, { roughness: .9 }),
    leaf2:  std(0xA7B391, { roughness: .9 }),
    glass:  std(0x5A6D8D, { roughness: .05, metalness: .35, envMapIntensity: 2.4 }),
    frame:  std(0x1C2338, { roughness: .5 }),
    crimson:std(0x8F2A36, { roughness: .6 }),
    sand:   std(0xE9C98A, { roughness: .8 }),
    gold:   std(0xD8A63C, { roughness: .28, metalness: .75, envMapIntensity: 1.3 }),
    lamp:   new THREE.MeshStandardMaterial({ color: 0xFFF1C9, emissive: 0xFFD98A, emissiveIntensity: 1.2, roughness: .4 }),
  };
}

/* ───────── geometry helpers: everything is collected per material, then merged ───────── */
class Kit {
  constructor() { this.parts = {}; }
  add(mat, g) { (this.parts[mat] ||= []).push(g); return g; }
  box(mat, w, h, d, x, y, z, ry = 0) { const g = new THREE.BoxGeometry(w, h, d); if (ry) g.rotateY(ry); g.translate(x, y + h / 2, z); return this.add(mat, g); }
  rbox(mat, w, h, d, x, y, z, r = .06) { const g = new RoundedBoxGeometry(w, h, d, 3, r); g.translate(x, y + h / 2, z); return this.add(mat, g); }
  cyl(mat, rt, rb, h, x, y, z, seg = 20) { const g = new THREE.CylinderGeometry(rt, rb, h, seg); g.translate(x, y + h / 2, z); return this.add(mat, g); }
  sphere(mat, r, x, y, z, detail = 2) { const g = new THREE.IcosahedronGeometry(r, detail); g.translate(x, y, z); return this.add(mat, g); }
  geo(mat, g) { return this.add(mat, g); }
  build(M) {
    const grp = new THREE.Group();
    for (const k in this.parts) {
      const geos = this.parts[k].map(g => g.index ? g.toNonIndexed() : g);
      geos.forEach(g => { for (const a of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(a)) g.deleteAttribute(a); if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2)); });
      const m = new THREE.Mesh(mergeGeometries(geos), M[k]);
      m.castShadow = !['lawn', 'stone', 'board', 'lamp'].includes(k); m.receiveShadow = true;
      grp.add(m);
    }
    return grp;
  }
}

// a window: dark glass, navy frame, one mullion and transom; faces +z (rotate the result for other faces)
function windowAt(k, w, h, x, y, z, face = 'z') {
  const t = .045, d = .05;
  const put = (mat, ww, hh, dd, cx, cy) => {
    const g = new THREE.BoxGeometry(face === 'z' ? ww : dd, hh, face === 'z' ? dd : ww);
    if (face === 'z') g.translate(x + cx, y + cy, z); else g.translate(x, y + cy, z + (face === 'x' ? cx : -cx));
    k.add(mat, g);
  };
  put('glass', w, h, d * .6, 0, h / 2);
  put('frame', w + t * 2, t, d, 0, -t / 2 + .0); put('frame', w + t * 2, t, d, 0, h + t / 2);
  put('frame', t, h, d, -w / 2 - t / 2, h / 2); put('frame', t, h, d, w / 2 + t / 2, h / 2);
  put('frame', t * .7, h, d, 0, h / 2); put('frame', w, t * .7, d, 0, h * .68);
  put('trim', w + t * 4, t * 1.4, d * 3, 0, -t * 1.6);                        // sill
}

function treeAt(k, x, z, s = 1, y = 0) {
  k.cyl('wood', .035 * s, .05 * s, .42 * s, x, y, z, 8);
  k.sphere('leaf', .34 * s, x, y + .62 * s, z, 2);
  k.sphere('leaf2', .26 * s, x + .14 * s, y + .82 * s, z - .06 * s, 2);
  k.sphere('leaf', .22 * s, x - .14 * s, y + .78 * s, z + .1 * s, 2);
}

// the eight-point Clarus star (from the logo), centred, size 1
export function starShape() {
  const P = [[246.25,78],[255.43,147.83],[278.78,137.47],[268.42,160.82],[338.25,170],[268.42,179.18],[278.78,202.53],[255.43,192.17],[246.25,262],[237.07,192.17],[213.72,202.53],[224.08,179.18],[154.25,170],[224.08,160.82],[213.72,137.47],[237.07,147.83]];
  const s = new THREE.Shape(); P.forEach(([x, y], i) => { const X = (x - 246.25) / 184, Y = -(y - 170) / 184; i ? s.lineTo(X, Y) : s.moveTo(X, Y); });
  return s;
}

function signTexture(text, w = 1024, h = 96) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d');
  x.fillStyle = '#E3DCCD'; x.fillRect(0, 0, w, h);
  x.fillStyle = '#1C2338'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.font = `900 ${Math.round(h * .5)}px "Archivo Wide", "Arial Black", sans-serif`;
  if ('letterSpacing' in x) x.letterSpacing = `${Math.round(h * .12)}px`;
  x.fillText(text, w / 2, h * .54);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

/* ───────── the Senior building: a classical hall with portico, wings, cupola ───────── */
function seniorStages(M) {
  const stages = [];
  const stage = (name, fn, anchor = [0, 0, 0], kind = 'rise') => { const k = new Kit(); fn(k); const g = k.build(M); g.name = name; g.userData.kind = kind; g.userData.anchor = anchor; stages.push(g); return g; };
  const T = .42;                                     // top of the board
  // board + grounds
  stage('board', k => {
    k.rbox('board', 16, .32, 10.6, 0, .1, 0, .08);
    k.box('edge', 16.02, .1, 10.62, 0, 0, 0);
    k.box('lawn', 15.2, .03, 9.8, 0, T, 0);
    k.box('stone', 2.3, .035, 4.2, 0, T, 2.75);       // the walk to the steps
    k.box('stone', 10.4, .035, 1.6, 0, T, .95);       // forecourt
    k.box('stone', .9, .035, 3.4, -6.3, T, 2.6); k.box('stone', .9, .035, 3.4, 6.3, T, 2.6);
  }, [0, 0, 0], 'none');
  const B = T + .03;
  // plinth + the three blocks
  stage('hall', k => {
    k.box('trim', 12.6, .32, 4.8, 0, 0, 0);
    // centre block
    k.box('card', 4.9, 4.1, 4.3, 0, .32, -.1);
    k.box('trim', 5.1, .16, 4.5, 0, 4.42, -.1); k.box('card', 4.9, .32, 4.3, 0, 4.58, -.1);
    k.box('trim', 5.0, .08, 4.4, 0, 2.3, -.1);       // string course
    // wings
    for (const s of [-1, 1]) {
      k.box('card', 3.7, 3.2, 3.7, s * 4.25, .32, -.35);
      k.box('trim', 3.86, .14, 3.86, s * 4.25, 3.52, -.35); k.box('card', 3.7, .26, 3.7, s * 4.25, 3.66, -.35);
      k.box('trim', 3.78, .07, 3.78, s * 4.25, 1.92, -.35);
    }
    // windows: centre block upper floor, wings both floors, outer sides
    for (const x of [-1.85, -.92, 0, .92, 1.85]) windowAt(k, .5, 1.05, x, 2.7, 2.08);
    for (const x of [-1.85, 1.85]) windowAt(k, .5, 1.05, x, .85, 2.08);
    for (const s of [-1, 1]) {
      for (const x of [-1.2, -.4, .4, 1.2]) { windowAt(k, .46, .95, s * 4.25 + x, .72, 1.53); windowAt(k, .46, .95, s * 4.25 + x, 2.2, 1.53); }
      for (const z of [-1.3, -.2, .9]) { windowAt(k, .46, .95, s * 6.12, .72, z - .35, s > 0 ? 'x' : '-x'); windowAt(k, .46, .95, s * 6.12, 2.2, z - .35, s > 0 ? 'x' : '-x'); }
    }
    // door
    k.box('wood', .9, 1.55, .06, 0, .32, 2.08); k.box('frame', 1.06, .08, .08, 0, 1.87, 2.08);
    k.box('frame', .03, 1.55, .08, 0, .32, 2.1);
  }, [0, B, -.6]);
  // portico: steps, columns, entablature with the name, pediment with the gold star
  const sign = signTexture('THE CLARUS SCHOOL');
  stage('portico', k => {
    for (let i = 0; i < 4; i++) k.box('trim', 4.4 - i * .12, .1, 1.7 - i * .18 + .5, 0, i * .1, .2 + i * .09);
    const top = .4;
    for (const x of [-1.5, -.5, .5, 1.5]) {
      k.box('trim', .36, .12, .36, x, top, .55);
      k.cyl('card', .12, .14, 2.85, x, top + .12, .55, 24);
      k.box('trim', .36, .14, .36, x, top + 2.97, .55);
    }
    k.box('card', 4.0, .46, 1.3, 0, top + 3.11, .2);
    k.box('trim', 4.14, .09, 1.42, 0, top + 3.57, .2);
    const ped = new THREE.Shape(); ped.moveTo(-2.07, 0); ped.lineTo(2.07, 0); ped.lineTo(0, .82); ped.closePath();
    const pg = new THREE.ExtrudeGeometry(ped, { depth: 1.3, bevelEnabled: false }); pg.translate(0, top + 3.66, -.45); k.geo('card', pg);
    const st = new THREE.ExtrudeGeometry(starShape(), { depth: .05, bevelEnabled: true, bevelThickness: .015, bevelSize: .012, bevelSegments: 1 });
    st.scale(.5, .5, 1); st.translate(0, top + 3.97, .86); k.geo('gold', st);
  }, [0, B, 1.55]);
  // the name on the frieze (its own plane so it can carry the texture)
  const fr = new THREE.Mesh(new THREE.PlaneGeometry(3.7, .3), new THREE.MeshStandardMaterial({ map: sign, roughness: .85 }));
  fr.position.set(0, .4 + 3.34, .851); fr.name = 'frieze';
  stages.find(s => s.name === 'portico').add(fr);
  // roof: parapets and the cupola with the star on top
  stage('roof', k => {
    k.cyl('trim', .82, .82, .16, 0, 0, 0, 8);
    k.cyl('card', .62, .62, .7, 0, .16, 0, 8);
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + Math.PI / 8; windowAt(k, .22, .38, Math.sin(a) * .6, .32, Math.cos(a) * .6); }
    k.cyl('trim', .7, .7, .08, 0, .86, 0, 8);
    const dome = new THREE.SphereGeometry(.6, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2); dome.translate(0, .94, 0); k.geo('crimson', dome);
    k.cyl('gold', .02, .02, .5, 0, 1.5, 0, 6);
    const st = new THREE.ExtrudeGeometry(starShape(), { depth: .04, bevelEnabled: false }); st.scale(.42, .42, 1); st.translate(0, 2.08, -.02); k.geo('gold', st);
  }, [0, B + 4.9, -.7]);
  // grounds: trees, hedges, lamps, flag
  stage('trees', k => {
    for (const [x, z, s] of [[-6.9, -3.4, 1.15], [-5.2, -4.1, .95], [6.8, -3.5, 1.2], [5.1, -4.2, .9], [-7, 3.9, 1.05], [7, 3.8, 1.1], [-3.2, 4.3, .8], [3.3, 4.3, .85], [-7.2, .4, .9], [7.2, .2, .95]]) treeAt(k, x, z, s);
    for (const s of [-1, 1]) {
      k.rbox('leaf', 3.4, .26, .36, s * 3.3, 0, 1.85, .1);
      for (const z of [2.2, 4.0]) { k.cyl('frame', .025, .03, .85, s * 1.55, 0, z, 8); k.sphere('lamp', .07, s * 1.55, .9, z, 1); }
    }
    k.cyl('frame', .02, .025, 2.6, 5.6, 0, 2.1, 6);
  }, [0, B, 0]);
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(.62, .38, 8, 1), M.crimson); flag.position.set(5.92, 2.4, 2.1); flag.castShadow = true; flag.name = 'flag';
  const fp = flag.geometry.attributes.position; for (let i = 0; i < fp.count; i++) fp.setZ(i, Math.sin((fp.getX(i) + .31) * 7) * .025); fp.needsUpdate = true; flag.geometry.computeVertexNormals();
  stages.find(s => s.name === 'trees').add(flag);
  // re-anchor: every stage was drawn around the origin offset by its anchor
  stages.forEach(g => { const [ax, ay, az] = g.userData.anchor; g.position.set(ax, ay, az); });
  return stages;
}

/* ───────── the Junior building: two gabled houses, a link block, a little playground ───────── */
function juniorStages(M) {
  const stages = [];
  const stage = (name, fn, anchor = [0, 0, 0], kind = 'rise') => { const k = new Kit(); fn(k); const g = k.build(M); g.name = name; g.userData.kind = kind; g.position.set(...anchor); stages.push(g); return g; };
  const T = .42, B = T + .03;
  stage('board', k => {
    k.rbox('board', 13, .32, 9.4, 0, .1, 0, .08); k.box('edge', 13.02, .1, 9.42, 0, 0, 0);
    k.box('lawn', 12.3, .03, 8.7, 0, T, 0);
    k.box('stone', 1.8, .035, 3.2, -1.6, T, 2.9); k.box('stone', 7.8, .035, 1.3, -.6, T, 1.2);
    k.cyl('sand', 1.15, 1.15, .05, 3.9, T, 2.6, 32);
  }, [0, 0, 0], 'none');
  const gable = (k, mat, w, d, h, x, y, z) => {           // a pitched roof as an extruded triangle, ridge along x
    const s = new THREE.Shape(); s.moveTo(-d / 2 - .18, 0); s.lineTo(d / 2 + .18, 0); s.lineTo(0, h); s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: w + .3, bevelEnabled: false }); g.rotateY(Math.PI / 2); g.translate(x - (w + .3) / 2, y, z); k.geo(mat, g);
  };
  stage('houses', k => {
    for (const [x, roof] of [[-3.5, 'crimson'], [.1, 'sand']]) {
      k.box('card', 3.1, 2.3, 3.2, x, 0, -.6);
      k.box('trim', 3.2, .1, 3.3, x, 1.12, -.6);
      gable(k, roof, 3.1, 3.2, 1.35, x, 2.3, -.6);
      const tri = new THREE.Shape(); tri.moveTo(-1.55, 0); tri.lineTo(1.55, 0); tri.lineTo(0, 1.22); tri.closePath();
      const tg = new THREE.ExtrudeGeometry(tri, { depth: .02, bevelEnabled: false }); tg.translate(x, 2.3, 1.0); k.geo('card', tg);
      windowAt(k, .78, .78, x - .75, .35, 1.02); windowAt(k, .78, .78, x + .75, .35, 1.02);
      windowAt(k, .62, .62, x - .75, 1.42, 1.02); windowAt(k, .62, .62, x + .75, 1.42, 1.02);
      const rw = new THREE.CylinderGeometry(.3, .3, .05, 24); rw.rotateX(Math.PI / 2); rw.translate(x, 2.75, 1.0); k.geo('glass', rw);
    }
    // link block with the entrance and a canopy
    k.box('card', 2.6, 1.7, 2.4, 3.3, 0, -.3); k.box('trim', 2.8, .14, 2.6, 3.3, 1.7, -.3);
    windowAt(k, 1.6, .7, 3.3, .75, .92);
    k.box('wood', .8, 1.2, .06, -1.7, 0, .9); k.box('crimson', 1.4, .08, .7, -1.7, 1.3, 1.15);
    k.cyl('frame', .02, .02, 1.3, -2.3, 0, 1.45, 6); k.cyl('frame', .02, .02, 1.3, -1.1, 0, 1.45, 6);
    k.box('card', 1.1, 1.9, 1.3, -1.7, 0, .2);
  }, [0, B, -1.3]);
  const sign = signTexture('CLARUS JUNIOR', 768, 96);
  const sg = new THREE.Mesh(new THREE.PlaneGeometry(1.6, .2), new THREE.MeshStandardMaterial({ map: sign, roughness: .85 }));
  sg.position.set(-1.7, 1.62, .87); stages[1].add(sg);
  stage('play', k => {
    // slide
        const slide = new THREE.BoxGeometry(.6, .05, 1.9); slide.rotateX(-.55); slide.translate(0, .48, .95); k.geo('sand', slide);
    k.box('card', .7, .9, .7, 0, 0, -.6); k.box('crimson', .8, .08, .8, 0, .9, -.6);
    for (const x of [-.3, .3]) k.cyl('frame', .02, .02, 1.25, x, 0, -.95, 6);
  }, [3.9, B, 1.2]);
  stage('trees', k => {
    for (const [x, z, s] of [[-5.6, -3.4, 1], [-4.2, -3.9, .8], [5.4, -3.3, 1.05], [2.4, -3.6, .85], [-5.6, 3.2, .9], [5.6, .2, .85], [-2.9, 3.4, .7]]) treeAt(k, x, z, s);
    for (const x of [-.1, -3.3]) k.rbox('leaf', 1.4, .22, .32, x, 0, 1.5, .1);
    for (let i = 0; i < 26; i++) k.box('card', .05, .32, .05, -5.75 + i * .46, 0, 4.15);
    k.box('card', 12, .04, .04, 0, .22, 4.15); k.box('card', 12, .04, .04, 0, .1, 4.15);
  }, [0, B, 0]);
  return stages;
}

/* ───────── a small renderer kit ───────── */
export function makeRenderer(canvas, pr) {
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: false });
  r.setClearColor(0x000000, 0);
  r.setPixelRatio(pr);
  r.outputColorSpace = THREE.SRGBColorSpace;
  r.toneMapping = THREE.NeutralToneMapping; r.toneMappingExposure = 1.04;
  r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFShadowMap;
  return r;
}
export function stageScene(renderer, stages, { shadowSize = 2048, span = 11 } = {}) {
  const scene = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), .04).texture; scene.environmentIntensity = .42;
  pm.dispose();
  const model = new THREE.Group(); stages.forEach(s => model.add(s)); scene.add(model);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xCFC2AA, .55));
  const key = new THREE.DirectionalLight(0xFFF1DC, 3.0); key.position.set(-7, 12, 9); key.castShadow = true;
  Object.assign(key.shadow.camera, { left: -span, right: span, top: span, bottom: -span, near: 1, far: 40 });
  key.shadow.mapSize.set(shadowSize, shadowSize); key.shadow.bias = -.0004; key.shadow.normalBias = .03; key.shadow.radius = 4;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xDCE6FF, .5); fill.position.set(8, 5, -6); scene.add(fill);
  // a soft contact shadow under the board, on the page itself
  const catcher = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.ShadowMaterial({ color: 0x1A1F33, opacity: .18 }));
  catcher.rotation.x = -Math.PI / 2; catcher.position.y = -.001; catcher.receiveShadow = true; scene.add(catcher);
  return { scene, model, key };
}

/* ───────── hero ───────── */
export async function heroModel(canvas, { onReady } = {}) {
  if (document.fonts) { try { await document.fonts.load('900 48px "Archivo Wide"'); } catch (e) {} }
  const M = makeMaterials();
  const stages = seniorStages(M);
  const renderer = makeRenderer(canvas, Math.min(devicePixelRatio || 1, SMALL() ? 1.3 : 1.75));
  const { scene, model } = stageScene(renderer, stages, { shadowSize: SMALL() ? 1024 : 2048 });
  const camera = new THREE.PerspectiveCamera(24, 1.5, .5, 120);
  const flag = scene.getObjectByName('flag');

  let w = 0, h = 0, dirty = true;
  const state = { turn: 0, scroll: 0, mx: 0, my: 0, tmx: 0, tmy: 0 };
  function size() {
    const r = canvas.getBoundingClientRect(); w = Math.max(1, r.width); h = Math.max(1, r.height);
    renderer.setSize(w, h, false); camera.aspect = w / h;
    const narrow = camera.aspect < 1.2;
    camera.fov = narrow ? 30 : 24; camera.updateProjectionMatrix(); dirty = true;
  }
  function place() {
    const base = -.55 + state.scroll * .9 + state.mx * .14 + state.turn;
    model.rotation.y = base;
    const d = camera.aspect < 1.2 ? 33 : 34;
    const el = .42 + state.my * .05 - state.scroll * .08;
    camera.position.set(Math.sin(.18) * d * Math.cos(el), Math.sin(el) * d, Math.cos(.18) * d * Math.cos(el));
    camera.lookAt(0, 1.3, 0);
  }
  size(); addEventListener('resize', () => { size(); });

  // assembly: the board slides in, then the building rises floor by floor, the roof drops on, trees pop up
  const tl = window.gsap.timeline({ paused: true, defaults: { ease: 'expo.out' }, onUpdate: () => { dirty = true; } });
  stages.forEach(s => s.visible = true);
  const board = stages[0], rest = stages.slice(1);
  if (!REDUCE) {
    tl.from(board.position, { y: -1.2, duration: 1.4 }, 0).from(board.scale, { x: .9, z: .9, duration: 1.4 }, 0);
    rest.forEach((s, i) => {
      if (s.userData.kind === 'pop') tl.from(s.scale, { x: .001, y: .001, z: .001, duration: 1.1, ease: 'back.out(1.7)' }, 1.3 + i * .08);
      else if (s.name === 'roof') tl.from(s.position, { y: '+=3', duration: 1.2, ease: 'bounce.out' }, 1.15);
      else tl.from(s.scale, { y: .001, duration: 1.3 }, .45 + i * .18);
    });
    tl.from(state, { turn: -1.1, duration: 3.2, ease: 'power3.out' }, 0);
  }

  // pointer + scroll
  let visible = true;
  new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(canvas);
  if (!REDUCE) {
    addEventListener('pointermove', e => { state.tmx = e.clientX / innerWidth * 2 - 1; state.tmy = e.clientY / innerHeight * 2 - 1; }, { passive: true });
    window.ScrollTrigger.create({ trigger: canvas, start: 'top top', end: 'bottom top', onUpdate: s => { state.scroll = s.progress; dirty = true; } });
  }
  let t0 = 0;
  window.gsap.ticker.add(time => {
    if (!visible || document.hidden) return;
    const dx = state.tmx - state.mx, dy = state.tmy - state.my;
    if (Math.abs(dx) > .0005 || Math.abs(dy) > .0005) { state.mx += dx * .06; state.my += dy * .06; dirty = true; }
    if (flag && !REDUCE && time - t0 > 1 / 30) {   // the flag ripples at 30fps; cheap
      t0 = time; const p = flag.geometry.attributes.position;
      for (let i = 0; i < p.count; i++) { const x = p.getX(i) + .31; p.setZ(i, Math.sin(x * 7 - time * 4) * .03 * x); }
      p.needsUpdate = true; dirty = true;
    }
    if (dirty) { place(); renderer.render(scene, camera); dirty = false; }
  });
  place(); renderer.render(scene, camera);
  onReady && onReady();
  return { play: () => tl.play(0), resize: size };
}

/* ───────── campus stills ───────── */
export async function campusStills(targets) {
  const canvas = document.createElement('canvas');
  const renderer = makeRenderer(canvas, 1);
  const M = makeMaterials();
  const out = {};
  for (const t of targets) {
    const stages = t.kind === 'junior' ? juniorStages(M) : seniorStages(M);
    const { scene, model } = stageScene(renderer, stages, { shadowSize: 2048, span: t.kind === 'junior' ? 9 : 11 });
    model.rotation.y = t.turn ?? -.5;
    const W = t.w || 1400, Hh = t.h || 1000;
    renderer.setSize(W, Hh, false);
    const cam = new THREE.PerspectiveCamera(t.fov || 24, W / Hh, .5, 120);
    const d = t.dist || 34, el = t.el ?? .38;
    cam.position.set(Math.sin(.2) * d * Math.cos(el), Math.sin(el) * d, Math.cos(.2) * d * Math.cos(el)); cam.lookAt(0, t.look ?? 1.4, 0);
    renderer.render(scene, cam);
    out[t.id] = await new Promise(res => canvas.toBlob(b => res(URL.createObjectURL(b)), 'image/png'));
    scene.traverse(o => { if (o.geometry) o.geometry.dispose(); });
  }
  renderer.dispose(); renderer.forceContextLoss();
  return out;
}

/* ───────── for the Clarus Junior walk: the Senior building as a small model at the end of the path ───────── */
export function seniorBuilding() {
  const M = makeMaterials();
  const g = new THREE.Group(); seniorStages(M).forEach(s => g.add(s));
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}
