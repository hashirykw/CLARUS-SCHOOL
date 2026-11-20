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
function canvasTex(w, h, draw, rx = 1, ry = 1) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 4; return t;
}
let TEX = null;
function textures() {
  if (TEX) return TEX;
  let seed = 3; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  TEX = {
    // card stock: a faint speckle so walls read as paper, not plastic
    card: canvasTex(256, 256, (x, w, h) => { x.fillStyle = '#F4F0E7'; x.fillRect(0, 0, w, h); for (let i = 0; i < 2600; i++) { x.fillStyle = `rgba(${rnd() > .5 ? '120,100,70' : '255,255,255'},${.05 + rnd() * .06})`; x.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 1.5, 1 + rnd() * 1.5); } }, 3, 3),
    // mown lawn: soft alternating stripes
    lawn: canvasTex(512, 64, (x, w, h) => { for (let i = 0; i < 16; i++) { x.fillStyle = i % 2 ? '#A6B091' : '#9AA585'; x.fillRect(i * w / 16, 0, w / 16 + 1, h); } }),
    // board: light oak grain
    board: canvasTex(512, 256, (x, w, h) => { x.fillStyle = '#D3BC97'; x.fillRect(0, 0, w, h); for (let i = 0; i < 90; i++) { const y = rnd() * h; x.strokeStyle = `rgba(140,100,60,${.06 + rnd() * .1})`; x.lineWidth = .6 + rnd() * 1.6; x.beginPath(); x.moveTo(0, y); for (let X = 0; X <= w; X += 32) x.lineTo(X, y + Math.sin(X / 60 + i) * 3); x.stroke(); } }, 2, 1),
    stone: canvasTex(256, 256, (x, w, h) => { x.fillStyle = '#E2D9C8'; x.fillRect(0, 0, w, h); x.strokeStyle = 'rgba(150,135,110,.25)'; x.lineWidth = 1.5; for (let i = 0; i <= 8; i++) { x.beginPath(); x.moveTo(0, i * h / 8); x.lineTo(w, i * h / 8); x.stroke(); for (let j = 0; j < 4; j++) { const xo = (j * w / 4 + (i % 2) * w / 8); x.beginPath(); x.moveTo(xo, i * h / 8); x.lineTo(xo, (i + 1) * h / 8); x.stroke(); } } }, 4, 4),
  };
  return TEX;
}
export function makeMaterials() {
  const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: .82, metalness: 0, ...o });
  const T = textures();
  return {
    card:   std(0xffffff, { roughness: .9, map: T.card }),
    trim:   std(0xE3DCCD, { roughness: .85 }),
    board:  std(0xffffff, { roughness: .55, map: T.board }),
    edge:   std(0xA88560, { roughness: .6 }),
    wood:   std(0x9C7349, { roughness: .55 }),
    stone:  std(0xffffff, { roughness: .95, map: T.stone }),
    marble: std(0xEFEAE0, { roughness: .35, envMapIntensity: 1.2 }),
    cypress:std(0x5E6E50, { roughness: .9 }),
    water:  std(0x8EA4B6, { roughness: .05, metalness: .5, envMapIntensity: 2.2 }),
    bloom:  std(0xC4485A, { roughness: .7 }),
    lawn:   std(0xffffff, { roughness: 1, map: T.lawn }),
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
export function seniorStages(M) {
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
    // classical details: rusticated ground floor, pilasters, window pediments, balustrades
    const pedi = (x, y, z, w) => { const sh = new THREE.Shape(); sh.moveTo(-w / 2, 0); sh.lineTo(w / 2, 0); sh.lineTo(0, w * .26); sh.closePath(); const g = new THREE.ExtrudeGeometry(sh, { depth: .07, bevelEnabled: false }); g.translate(x, y, z); k.geo('trim', g); k.box('trim', w + .04, .05, .1, x, y - .05, z + .03); };
    const balustrade = (cx, y, z, w) => { k.box('trim', w, .06, .16, cx, y, z); k.box('trim', w, .06, .18, cx, y + .26, z); for (let x = -w / 2 + .1; x <= w / 2 - .09; x += .17) k.cyl('trim', .028, .036, .2, cx + x, y + .06, z, 8); };
    for (const s of [-1, 1]) {
      const wx = s * 4.25, fz = 1.5;
      for (let i = 1; i <= 4; i++) k.box('trim', 3.72, .025, .03, wx, .32 + i * .32, fz + .005);
      for (const x of [-1.6, -.8, 0, .8, 1.6]) k.box('trim', .13, 1.56, .05, wx + x, 1.98, fz + .02);
      for (const x of [-1.2, -.4, .4, 1.2]) { pedi(wx + x, 3.22, fz, .66); k.box('trim', .6, .05, .09, wx + x, 1.72, fz + .03); }
      balustrade(wx, 3.92, fz - .1, 3.6);
    }
    for (const x of [-1.85, -.92, 0, .92, 1.85]) pedi(x, 3.82, 2.05, .7);
    balustrade(0, 4.9, 2.0, 4.8);
    // quoins on the centre block corners
    for (const x of [-2.45, 2.45]) for (let i = 0; i < 12; i++) k.box('trim', i % 2 ? .22 : .32, .15, .05, x + (x < 0 ? .1 : -.1), .4 + i * .33, 2.07);
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
    for (const s of [-1, 1]) for (const z of [3.1, 4.5]) { k.cyl('wood', .04, .05, .18, s * 2.35, 0, z, 6); const c = new THREE.ConeGeometry(.26, 1.55, 14); c.translate(s * 2.35, .18 + .775, z); k.geo('cypress', c); }
    // fountain
    const ring = new THREE.TorusGeometry(.62, .09, 10, 40); ring.rotateX(Math.PI / 2); ring.translate(0, .12, 4.45); k.geo('marble', ring);
    k.cyl('marble', .66, .7, .1, 0, 0, 4.45, 40); k.cyl('water', .58, .58, .06, 0, .08, 4.45, 40);
    k.cyl('marble', .08, .12, .5, 0, .1, 4.45, 16); k.cyl('marble', .28, .12, .1, 0, .58, 4.45, 24); k.cyl('water', .22, .22, .03, 0, .66, 4.45, 24);
    // flower beds along the forecourt
    for (const s of [-1, 1]) for (let i = 0; i < 9; i++) k.sphere(i % 3 ? 'bloom' : 'leaf2', .07, s * (2.2 + i * .3), .07, 1.55, 1);
  }, [0, B, 0]);
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(.62, .38, 8, 1), M.crimson); flag.position.set(5.92, 2.4, 2.1); flag.castShadow = false; flag.name = 'flag';
  const fp = flag.geometry.attributes.position; for (let i = 0; i < fp.count; i++) fp.setZ(i, Math.sin((fp.getX(i) + .31) * 7) * .025); fp.needsUpdate = true; flag.geometry.computeVertexNormals();
  stages.find(s => s.name === 'trees').add(flag);
  // re-anchor: every stage was drawn around the origin offset by its anchor
  stages.forEach(g => { const [ax, ay, az] = g.userData.anchor; g.position.set(ax, ay, az); });
  return stages;
}

/* ───────── the Junior building: two gabled houses, a link block, a little playground ───────── */
export function juniorStages(M) {
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
    for (const x of [-2.45, -.95]) { k.cyl('wood', .035, .045, .16, x, 0, 2.0, 6); const c = new THREE.ConeGeometry(.2, 1.1, 12); c.translate(x, .16 + .55, 2.0); k.geo('cypress', c); }
    for (let i = 0; i < 14; i++) k.sphere(i % 2 ? 'bloom' : 'sand', .065, -5.4 + i * .28, .07, 2.75, 1);
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

/* ───────── construction: the board slides in, pieces gather from around the site and rise into place,
 * the roof drops on last. Shared by the hero and the campus cards. ───────── */
function assemble(tl, stages, { scatter = false } = {}) {
  const board = stages[0], rest = stages.slice(1);
  tl.from(board.position, { y: -1.2, duration: 1.4, ease: 'expo.out' }, 0).from(board.scale, { x: .9, z: .9, duration: 1.4, ease: 'expo.out' }, 0);
  rest.forEach((s, i) => {
    const at = .45 + i * .18;
    if (s.name === 'roof') { tl.from(s.position, { y: '+=3', duration: 1.2, ease: 'bounce.out' }, 1.15); return; }
    tl.from(s.scale, { y: .001, duration: 1.3, ease: 'expo.out' }, at);
    if (scatter) {
      const a = i * 2.1 + 1, r = 5 + i;
      tl.from(s.position, { x: `+=${Math.sin(a) * r}`, z: `+=${Math.cos(a) * r}`, y: '+=2.5', duration: 1.5, ease: 'power4.out' }, at - .1);
      tl.from(s.rotation, { y: (i % 2 ? 1 : -1) * .9, duration: 1.5, ease: 'power4.out' }, at - .1);
    }
  });
  return tl;
}

/* ───────── the camera walks a full circle around the model; light and model stay put,
 * so the shadow map is drawn once (and again only while the model is assembling) ───────── */
function orbitCamera(camera, angle, d, el, look) {
  camera.position.set(Math.sin(angle) * d * Math.cos(el), Math.sin(el) * d + look, Math.cos(angle) * d * Math.cos(el));
  camera.lookAt(0, look, 0);
}
function liveLoop(canvas, renderer, scene, camera, frame) {
  let visible = false;
  new IntersectionObserver(es => { visible = es[0].isIntersecting; }, { rootMargin: '80px' }).observe(canvas);
  window.gsap.ticker.add(time => { if (!visible || document.hidden) return; if (frame(time)) renderer.render(scene, camera); });
}

/* ───────── hero ───────── */
export async function heroModel(canvas, { onReady } = {}) {
  if (document.fonts) { try { await document.fonts.load('900 48px "Archivo Wide"'); } catch (e) {} }
  const M = makeMaterials();
  const stages = seniorStages(M);
  const renderer = makeRenderer(canvas, Math.min(devicePixelRatio || 1, SMALL() ? 1.3 : 1.6));
  renderer.shadowMap.autoUpdate = false; renderer.shadowMap.needsUpdate = true;
  const { scene } = stageScene(renderer, stages, { shadowSize: SMALL() ? 1024 : 2048 });
  const camera = new THREE.PerspectiveCamera(24, 1.5, .5, 120);
  const flag = scene.getObjectByName('flag');
  const state = { turn: 0, scroll: 0, mx: 0, my: 0, tmx: 0, tmy: 0, spin: 0 };
  let dirty = true;
  function size() {
    const r = canvas.getBoundingClientRect(); renderer.setSize(Math.max(1, r.width), Math.max(1, r.height), false);
    camera.aspect = r.width / Math.max(1, r.height); camera.fov = camera.aspect < 1.2 ? 30 : 24; camera.updateProjectionMatrix(); dirty = true;
  }
  size(); addEventListener('resize', size);
  const place = () => orbitCamera(camera, .55 + state.spin + state.scroll * 1.2 + state.mx * .18 + state.turn, camera.aspect < 1.2 ? 33 : 34, .42 + state.my * .05 - state.scroll * .06, 1.3);

  // assembly: board slides in, the building rises floor by floor, the dome drops on, the gardens grow
  const tl = window.gsap.timeline({ paused: true, defaults: { ease: 'expo.out' }, onUpdate: () => { dirty = true; renderer.shadowMap.needsUpdate = true; }, onComplete: () => { renderer.shadowMap.needsUpdate = true; } });
  if (!REDUCE) {
    assemble(tl, stages);
    tl.from(state, { turn: -1.4, duration: 3.4, ease: 'power3.out' }, 0);
  }
  if (!REDUCE) {
    addEventListener('pointermove', e => { state.tmx = e.clientX / innerWidth * 2 - 1; state.tmy = e.clientY / innerHeight * 2 - 1; }, { passive: true });
    window.ScrollTrigger.create({ trigger: canvas, start: 'top top', end: 'bottom top', onUpdate: s => { state.scroll = s.progress; } });
  }
  let last = 0, t0 = 0;
  liveLoop(canvas, renderer, scene, camera, time => {
    const dt = Math.min(.05, time - (last || time)); last = time;
    if (!REDUCE) state.spin += dt * (Math.PI * 2 / 36);            // one full turn every ~36s
    state.mx += (state.tmx - state.mx) * .06; state.my += (state.tmy - state.my) * .06;
    if (flag && !REDUCE && time - t0 > 1 / 30) { t0 = time; const p = flag.geometry.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i) + .31; p.setZ(i, Math.sin(x * 7 - time * 4) * .03 * x); } p.needsUpdate = true; }
    if (REDUCE && !dirty) return false;
    place(); dirty = false; return true;
  });
  place(); renderer.render(scene, camera);
  onReady && onReady();
  return { play: () => tl.play(0), resize: size };
}

/* ───────── campus cards: each model turns a full circle while its card is on screen ───────── */
export async function campusLive(canvas, kind, { start = 0, speed = 1 } = {}) {
  if (document.fonts) { try { await document.fonts.load('900 48px "Archivo Wide"'); } catch (e) {} }
  const M = makeMaterials();
  const stages = kind === 'junior' ? juniorStages(M) : seniorStages(M);
  const renderer = makeRenderer(canvas, Math.min(devicePixelRatio || 1, SMALL() ? 1.25 : 1.5));
  renderer.shadowMap.autoUpdate = false; renderer.shadowMap.needsUpdate = true;
  const { scene } = stageScene(renderer, stages, { shadowSize: 1024, span: kind === 'junior' ? 9 : 11 });
  const camera = new THREE.PerspectiveCamera(24, 1.5, .5, 120);
  const size = () => { const r = canvas.getBoundingClientRect(); renderer.setSize(Math.max(1, r.width), Math.max(1, r.height), false); camera.aspect = r.width / Math.max(1, r.height); camera.updateProjectionMatrix(); };
  size(); addEventListener('resize', size);
  const d = kind === 'junior' ? 28 : 30, look = kind === 'junior' ? 1.1 : 1.4;
  if (!REDUCE) {
    const tl = assemble(window.gsap.timeline({ paused: true, onUpdate: () => { renderer.shadowMap.needsUpdate = true; }, onComplete: () => { renderer.shadowMap.needsUpdate = true; } }), stages, { scatter: true });
    tl.progress(0);
    window.ScrollTrigger.create({ trigger: canvas, start: 'top 85%', once: false, onEnter: () => { if (!tl.isActive() && tl.progress() === 0) tl.play(); } });
  }
  let a = start, last = 0, hover = 0, th = 0;
  canvas.parentElement.addEventListener('pointerenter', () => { th = 1; });
  canvas.parentElement.addEventListener('pointerleave', () => { th = 0; });
  liveLoop(canvas, renderer, scene, camera, time => {
    const dt = Math.min(.05, time - (last || time)); last = time;
    hover += (th - hover) * .08;
    if (!REDUCE) a += dt * (Math.PI * 2 / 30) * speed * (1 + hover * 1.5);
    orbitCamera(camera, a, d * (1 - hover * .08), .4, look);
    return true;
  });
  orbitCamera(camera, a, d, .4, look); renderer.render(scene, camera);
}

/* ───────── for the Clarus Junior walk: the Senior building as a small model at the end of the path ───────── */
export function seniorBuilding() {
  const M = makeMaterials();
  const g = new THREE.Group(); seniorStages(M).forEach(s => g.add(s));
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}
