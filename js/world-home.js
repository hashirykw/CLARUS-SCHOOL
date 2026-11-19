// world-home.js — the one continuous 3D world behind the main Clarus page.
// Chapter 1: the Clarus emblem (the logo's own pages, in 3D) opens and its star wakes up.
// Chapter 2: the star climbs a staircase of books, one book per class.
// Chapter 3: the star lands on a turntable campus; each campus builds itself up.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';

const { gsap } = window;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const sh = (m, cast = true, recv = true) => { m.castShadow = cast; m.receiveShadow = recv; return m; };

/* ---------- colours per theme (lerped on switch) ---------- */
const THEMES = {
  light: { bg:0xF3EEE4, pages:0x1F2A44, pagesSheen:0x2C3A5A, star:0xC9A15A, starGlow:0x000000, ribbon:0xC4A162, ribbonGlow:0x000000,
           wall:0xF4EEE2, roof:0x27314A, trim:0xC4A162, lawn:0xE7E0D0, plinth:0xEAE3D4, leaf:0x46594A, trunk:0x6B5A48, page:0xFBF6EA,
           win:0x1F2A44, winGlow:0x000000, sketch:0xA88A4E, shadow:.13, hemi:.95, key:1.9, env:.75, starLight:0, glass:0xFFFFFF },
  dark:  { bg:0x0D1015, pages:0xEDE5D3, pagesSheen:0xFFFFFF, star:0xDCBA74, starGlow:0x4A3410, ribbon:0xD3B272, ribbonGlow:0x3A2C12,
           wall:0x2B2E36, roof:0x14171E, trim:0xD3B272, lawn:0x1E2128, plinth:0x1A1D24, leaf:0x24342B, trunk:0x3A3128, page:0xD6CFBE,
           win:0xFFD08A, winGlow:0xD9963A, sketch:0xD3B272, shadow:.42, hemi:.38, key:.85, env:.4, starLight:8, glass:0x8A8A90 }
};
const STAR_BOOK = .34;   // star size on the books, relative to its size in the logo
const STAR_REST = .82;   // how high the star floats above a book's cover (clears its points)
const CLASS_COLORS = [0x9A6E45, 0x6E2A26, 0x2C4A3C, 0x24304F];   // tan, oxblood, forest, navy leather

export async function createHomeWorld(canvas, markEls) {
  const isPhone = () => innerWidth < 820;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:false, powerPreference:'high-performance' });
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
  scene.environmentIntensity = .9;
  scene.fog = new THREE.Fog(0xF3EEE4, 22, 58);
  const bg = new THREE.Color(0xF3EEE4); scene.background = bg;

  const camera = new THREE.PerspectiveCamera(34, 1, .1, 200);

  /* lights */
  const hemi = new THREE.HemisphereLight(0xFFF8EC, 0xE8DCC6, 1.15); scene.add(hemi);
  const key = new THREE.DirectionalLight(0xFFF1DC, 2.4);
  key.castShadow = true; key.shadow.mapSize.set(isPhone() ? 1024 : 2048, isPhone() ? 1024 : 2048);
  key.shadow.camera.left = -9; key.shadow.camera.right = 9; key.shadow.camera.top = 9; key.shadow.camera.bottom = -9;
  key.shadow.camera.near = 1; key.shadow.camera.far = 40; key.shadow.bias = -.0004; key.shadow.normalBias = .02; key.shadow.radius = 5;
  scene.add(key, key.target);
  const starLight = new THREE.PointLight(0xFFC56A, 0, 9, 1.6); scene.add(starLight);

  /* materials (shared, so a theme switch is just a few colour lerps) */
  const mat = {
    pages: new THREE.MeshPhysicalMaterial({ color:0x1F2A44, roughness:.62, metalness:.0, clearcoat:.15, clearcoatRoughness:.4, envMapIntensity:.12, sheen:0, sheenColor:new THREE.Color(0x2A4683) }),
    star:  new THREE.MeshStandardMaterial({ color:0xD3A85C, metalness:1, roughness:.3, emissive:0x000000, flatShading:true }),
    ribbon:new THREE.MeshStandardMaterial({ color:0xC9A257, metalness:.6, roughness:.35, emissive:0x000000 }),
    halo:  new THREE.MeshBasicMaterial({ color:0xC9A257, transparent:true, opacity:.12, depthWrite:false }),
    wall:  new THREE.MeshStandardMaterial({ color:0xFBF7EE, roughness:.8 }),
    roof:  new THREE.MeshStandardMaterial({ color:0x3A3A3E, roughness:.6, metalness:.05 }),
    trim:  new THREE.MeshStandardMaterial({ color:0xC9A257, roughness:.3, metalness:.85 }),
    lawn:  new THREE.MeshStandardMaterial({ color:0xDCE3C4, roughness:.95 }),
    plinth:new THREE.MeshStandardMaterial({ color:0xEFE7D6, roughness:.6 }),
    leaf:  new THREE.MeshStandardMaterial({ color:0x9DB98A, roughness:.9 }),
    trunk: new THREE.MeshStandardMaterial({ color:0xB79A79, roughness:.9 }),
    page:  new THREE.MeshStandardMaterial({ color:0xFFFCF4, roughness:.9 }),
    win:   new THREE.MeshStandardMaterial({ color:0x2E3036, roughness:.15, metalness:.4, emissive:0x000000 }),
    ghost: new THREE.MeshStandardMaterial({ color:0xFFFFFF, transparent:true, opacity:.22, roughness:.2, depthWrite:false }),
    sketch:new THREE.LineDashedMaterial({ color:0xB8914A, dashSize:.07, gapSize:.07, transparent:true, opacity:.95 }),
    shadow:new THREE.ShadowMaterial({ opacity:.11 }),
  };
  const classMats = CLASS_COLORS.map(c => new THREE.MeshStandardMaterial({ color:c, roughness:.5, metalness:.05 }));   // leather, a soft sheen

  /* ground: only shadows, so the floor melts into the page colour in both themes */
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), mat.shadow);
  ground.rotation.x = -Math.PI/2; ground.receiveShadow = true; scene.add(ground);

  /* ================= CHAPTER 1 · THE EMBLEM ================= */
  const S = .0078;                         // svg units -> metres
  const SPINE = { x:246.25, y:398 };
  const emblem = new THREE.Group(); emblem.position.set(0, .95, 0); scene.add(emblem);
  const tilt = new THREE.Group(); emblem.add(tilt);
  const loader = new SVGLoader();
  const pagePivots = [];
  markEls.bands.forEach((d, i) => {
    const data = loader.parse(`<svg xmlns="http://www.w3.org/2000/svg"><path d="${d}"/></svg>`);
    const shapes = data.paths.flatMap(p => p.toShapes(true));
    const geo = new THREE.ExtrudeGeometry(shapes, { depth:9, bevelEnabled:true, bevelThickness:1.6, bevelSize:.7, bevelSegments:3, curveSegments:10 });
    geo.translate(-SPINE.x, -SPINE.y, -4.5); geo.scale(S, -S, S); geo.computeVertexNormals();
    for (const side of [1, -1]) {
      const pivot = new THREE.Group();
      const m = sh(new THREE.Mesh(geo, mat.pages)); m.scale.x = side;   // right side is the mirror image
      m.position.z = (4 - i) * .012 * side * 0;                        // pages share one plane, like the logo
      pivot.add(m); pivot.userData = { side, i, open:0 };
      tilt.add(pivot); pagePivots.push(pivot);
    }
  });
  // faceted 3D star: eight triangles meeting at a raised centre, front and back
  function starGeometry(r) {
    const P = r.points; const c = r.centre; const depth = r.depth;
    const ring = ['T','tr','R','br','B','bl','L','tl'].map(k => P[k]);
    const pos = [];
    for (const face of [1, -1]) for (let k = 0; k < 8; k++) {
      const a = ring[k], b = ring[(k+1)%8];
      const tri = [[c[0], c[1], depth*face], [a[0], a[1], 0], [b[0], b[1], 0]];
      if (face < 0) tri.reverse();
      for (const t of tri) pos.push((t[0]-c[0])*S, -(t[1]-c[1])*S, t[2]*S);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals(); return g;
  }
  const starGeo = starGeometry(markEls.star);
  const star = new THREE.Group(); scene.add(star);
  const starMesh = sh(new THREE.Mesh(starGeo, mat.star), true, false); star.add(starMesh);
  const STAR_SLOT = V(0, emblem.position.y + (SPINE.y - markEls.star.centre[1]) * S, 0);   // where the star sits in the logo

  // sparkles that follow the star
  const sparkTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
    const g = x.createRadialGradient(32,32,0,32,32,32); g.addColorStop(0,'rgba(255,255,255,1)'); g.addColorStop(.25,'rgba(255,240,200,.85)'); g.addColorStop(1,'rgba(255,220,150,0)');
    x.fillStyle = g; x.fillRect(0,0,64,64); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const SPARKS = isPhone() ? 12 : 18;
  const sparkPos = new Float32Array(SPARKS*3), sparkSeed = [];
  for (let i = 0; i < SPARKS; i++) sparkSeed.push({ r:.35 + Math.random()*.9, a:Math.random()*6.28, y:(Math.random()-.5)*1.2, s:.3 + Math.random()*.8 });
  const sparkGeo = new THREE.BufferGeometry(); sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
  const sparkMat = new THREE.PointsMaterial({ map:sparkTex, color:0xE2B86A, size:.09, transparent:true, depthWrite:false, opacity:.9, blending:THREE.NormalBlending });
  const sparks = new THREE.Points(sparkGeo, sparkMat); scene.add(sparks);

  /* ================= THE PATH (a brass ribbon that joins the chapters) ================= */
  const STAIR0 = V(6.6, 0, -5.2), STEP = { dx:1.32, dy:.46 };
  const PLINTH = V(23.5, 0, -2.6);
  const pathCurve = new THREE.CatmullRomCurve3([V(-6,0,3.2), V(-1.5,0,2.2), V(2.2,0,.9), V(4.6,0,-2.6), V(6.2,0,-3.7), V(9.5,0,-3.8), V(13,0,-3.4), V(16.5,0,-.6), V(19.6,0,1.2), PLINTH.clone().add(V(-3.2,0,2.6))]);
  function ribbon(curve, width, y, material) {
    const N = 260, pos = [], idx = [], up = V(0,1,0);
    for (let i = 0; i <= N; i++) {
      const t = i/N, p = curve.getPointAt(t), tan = curve.getTangentAt(t), side = new THREE.Vector3().crossVectors(up, tan).normalize().multiplyScalar(width/2);
      pos.push(p.x+side.x, y, p.z+side.z, p.x-side.x, y, p.z-side.z);
      if (i < N) { const a = i*2; idx.push(a, a+1, a+2, a+1, a+3, a+2); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    const m = new THREE.Mesh(g, material); m.receiveShadow = true; return m;
  }
  scene.add(ribbon(pathCurve, .07, .006, mat.ribbon));

  /* cypress trees: slender and classical */
  const cypressGeo = (() => { const pts = []; for (let k = 0; k <= 14; k++) { const y = k / 14; pts.push(new THREE.Vector2(Math.sin(Math.PI * Math.pow(y, .72)) * .3 * (1 - y * .15), y * 1.9)); }
    return new THREE.LatheGeometry(pts, 18); })();
  function tree(x, z, s = 1) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s);
    g.add(sh(new THREE.Mesh(new THREE.CylinderGeometry(.045, .06, .3, 8), mat.trunk)).translateY(.15));
    const c = sh(new THREE.Mesh(cypressGeo, mat.leaf)); c.position.y = .22; g.add(c);
    return g;
  }

  /* ================= CHAPTER 2 · THE STAIRCASE OF BOOKS ================= */
  const CLASSES = 7;
  function labelTexture(text, fg, bgc) {
    const c = document.createElement('canvas'); c.width = 1024; c.height = 160; const x = c.getContext('2d');
    x.fillStyle = bgc; x.fillRect(0,0,1024,160);
    x.fillStyle = fg; x.font = '500 64px Cinzel, Georgia, serif'; x.letterSpacing = '10px'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(text.toUpperCase(), 512, 86);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
  }
  const books = [];
  const W = 2.55, H = .44, D = 1.8;
  const pageLines = (() => { const c = document.createElement('canvas'); c.width = 64; c.height = 256; const x = c.getContext('2d');
    x.fillStyle = '#fffcf4'; x.fillRect(0,0,64,256); x.fillStyle = 'rgba(120,100,70,.18)'; for (let y = 4; y < 256; y += 6) x.fillRect(0, y, 64, 1);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const pageMat = new THREE.MeshStandardMaterial({ map:pageLines, roughness:.9 });
  const NAMES = ['Nursery','KG','Class 1','Class 2','Classes 3–5','Classes 6–8','Matric'];
  for (let i = 0; i < CLASSES; i++) {
    const open = i < 4;
    const g = new THREE.Group();
    g.position.set(STAIR0.x + i*STEP.dx, i*STEP.dy, STAIR0.z - i*.12);
    g.rotation.y = [.03,-.05,.06,-.02,.05,-.04,0][i];
    if (open) {
      const cover = classMats[i];
      g.add(sh(new THREE.Mesh(new RoundedBoxGeometry(W, .06, D, 3, .025), cover)).translateY(.03));
      g.add(sh(new THREE.Mesh(new RoundedBoxGeometry(W, .06, D, 3, .025), cover)).translateY(H - .03));
      const block = sh(new THREE.Mesh(new THREE.BoxGeometry(W - .1, H - .1, D - .1), pageMat)); block.position.set(0, H/2, -.03); g.add(block);
      const spine = sh(new THREE.Mesh(new RoundedBoxGeometry(W, H, .16, 4, .07), cover)); spine.position.set(0, H/2, D/2 - .06); g.add(spine);
      const lab = new THREE.Mesh(new THREE.PlaneGeometry(W*.78, W*.78*160/1024), new THREE.MeshStandardMaterial({ map:labelTexture(NAMES[i], '#D9B877', '#' + CLASS_COLORS[i].toString(16).padStart(6,'0')), roughness:.6 }));
      lab.position.set(0, H/2, D/2 + .025); g.add(lab);
      // brass bands on the spine
      for (const s of [-1, 1]) { const b = new THREE.Mesh(new THREE.BoxGeometry(.05, H*.9, .02), mat.trim); b.position.set(s*W*.45, H/2, D/2 + .025); g.add(b); }
    } else {
      // planned classes: drawn, not built yet — a dotted sketch, like the logo before it fills in
      const ghost = new THREE.Mesh(new RoundedBoxGeometry(W, H, D, 3, .05), mat.ghost); ghost.position.y = H/2; g.add(ghost);
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(W, H, D)), mat.sketch); edges.position.y = H/2; edges.computeLineDistances(); g.add(edges);
      const lab = new THREE.Mesh(new THREE.PlaneGeometry(W*.78, W*.78*160/1024), new THREE.MeshBasicMaterial({ map:labelTexture(NAMES[i], '#A88A4E', 'rgba(0,0,0,0)'), transparent:true, depthWrite:false }));
      lab.position.set(0, H/2, D/2 + .01); g.add(lab);
    }
    scene.add(g); books.push(g);
  }
  const bookTop = i => books[i].position.clone().setY(books[i].position.y + H);
  // the part of each book's cover not covered by the next book: the star stands here
  const tread = i => { books[i].updateMatrixWorld(); return books[i].localToWorld(V(i < CLASSES - 1 ? -(W - STEP.dx) / 2 : 0, H, 0)); };

  /* ================= CHAPTER 3 · CAMPUSES ON A TURNTABLE ================= */
  const turn = new THREE.Group(); turn.position.copy(PLINTH); scene.add(turn);
  // a square stone base, stepped, with a gold inlay — like an architect's model
  turn.add(sh(new THREE.Mesh(new RoundedBoxGeometry(8.4, .2, 8.4, 2, .04), mat.plinth)).translateY(.1));
  turn.add(sh(new THREE.Mesh(new RoundedBoxGeometry(7.9, .18, 7.9, 2, .04), mat.plinth)).translateY(.29));
  for (const [w, d, x, z] of [[7.3, .04, 0, 3.63], [7.3, .04, 0, -3.63], [.04, 7.3, 3.63, 0], [.04, 7.3, -3.63, 0]]) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, .012, d), mat.trim); b.position.set(x, .386, z); turn.add(b);
  }
  const lawn = sh(new THREE.Mesh(new THREE.BoxGeometry(7.1, .01, 7.1), mat.lawn), false, true); lawn.position.y = .384; turn.add(lawn);
  const campusSets = [];

  const box = (w,h,d,m,x,y,z,r=.03) => { const o = sh(new THREE.Mesh(new RoundedBoxGeometry(w,h,d,2,Math.min(r, w/2-.001, h/2-.001, d/2-.001)), m)); o.position.set(x,y,z); return o; };
  const cyl = (rt,rb,h,m,x,y,z,seg=20) => { const o = sh(new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg), m)); o.position.set(x,y,z); return o; };
  function prism(w, h, d, m) { // triangular pediment / gable
    const s = new THREE.Shape(); s.moveTo(-w/2,0); s.lineTo(w/2,0); s.lineTo(0,h); s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth:d, bevelEnabled:false }); g.translate(0,0,-d/2); return sh(new THREE.Mesh(g, m));
  }
  function windows(parent, w, rows, cols, y0, dy, z, xs = 0) {
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const x = xs + (c - (cols-1)/2) * (w/cols);
      const win = new THREE.Mesh(new THREE.PlaneGeometry(.2, .3), mat.win); win.position.set(x, y0 + r*dy, z); parent.add(win);
    }
  }
  const BASE = .385;
  // 0 · Flagship: a classical hall with a portico, the star on its pediment
  function flagship() {
    const g = new THREE.Group(), parts = [];
    const add = o => { g.add(o); parts.push(o); return o; };
    add(box(3.2, 1.55, 1.7, mat.wall, 0, BASE + .78, -.3));
    const r1 = add(box(3.4, .12, 1.9, mat.roof, 0, BASE + 1.6, -.3)); r1.userData.k = 1;
    for (const s of [-1, 1]) { add(box(1.3, 1.05, 1.3, mat.wall, s*2.2, BASE + .53, -.2)); add(box(1.42, .1, 1.42, mat.roof, s*2.2, BASE + 1.1, -.2)); }
    for (let k = 0; k < 3; k++) add(box(2.2 - k*.12, .08, .5 - k*.12, mat.plinth, 0, BASE + .04 + k*.08, .82 - k*.06, .01));
    for (let c = 0; c < 6; c++) add(cyl(.07, .08, 1.18, mat.wall, -.95 + c*.38, BASE + .84, .66, 16));
    add(box(2.3, .1, .62, mat.wall, 0, BASE + 1.47, .6));
    const ped = add(prism(2.4, .62, .64, mat.roof)); ped.position.set(0, BASE + 1.52, .6);
    const slot = new THREE.Object3D(); slot.position.set(0, BASE + 2.95, .1); g.add(slot);   // clear above the pediment
    const door = new THREE.Mesh(new THREE.PlaneGeometry(.42, .72), mat.roof); door.position.set(0, BASE + .5, .56); add(door);
    const wg = new THREE.Group(); windows(wg, 2.6, 2, 6, BASE + .5, .62, .56); for (const s of [-1,1]) windows(wg, 1, 1, 2, BASE + .55, 0, .46, s*2.2); add(wg);
    [[-2.4,-2.9,1.05],[2.4,-2.9,1.05],[-3.25,-2.9,.85],[3.25,-2.9,.85]].forEach(t => add(tree(...t)));
    return { g, parts, slot };
  }
  // 1 · Junior: friendly, rounded, coloured windows and a playground
  function junior() {
    const g = new THREE.Group(), parts = [];
    const add = o => { g.add(o); parts.push(o); return o; };
    add(box(2.8, 1.5, 1.6, mat.wall, -.4, BASE + .75, -.4, .18));
    add(box(3, .14, 1.8, mat.roof, -.4, BASE + 1.57, -.4, .07));
    const tower = add(cyl(.62, .62, 2.1, mat.wall, 1.4, BASE + 1.05, -.3, 32));
    const cone = add(sh(new THREE.Mesh(new THREE.ConeGeometry(.78, .9, 32), mat.roof))); cone.position.set(1.4, BASE + 2.55, -.3);
    const slot = new THREE.Object3D(); slot.position.set(1.4, BASE + 3.72, -.3); g.add(slot);   // clear above the tower's point
    for (let c = 0; c < 4; c++) for (let r = 0; r < 2; r++) {
      const f = box(.42, .42, .06, classMats[(c + r) % 4], -1.45 + c*.7, BASE + .52 + r*.62, .42, .08); add(f);
      const w = new THREE.Mesh(new THREE.PlaneGeometry(.3, .3), mat.win); w.position.set(-1.45 + c*.7, BASE + .52 + r*.62, .455); add(w);
    }
    // playground: slide + swings
    const slide = new THREE.Group(); slide.position.set(-.4, BASE, 1.6);
    slide.add(box(.5, .06, 1.3, classMats[0], 0, .45, 0, .02)); slide.children[0].rotation.x = .55;
    slide.add(box(.5, .9, .1, classMats[2], 0, .45, -.62, .04)); add(slide);
    const sw = new THREE.Group(); sw.position.set(1.7, BASE, 1.5);
    for (const s of [-1,1]) { const leg = cyl(.03, .03, 1.05, mat.trim, s*.5, .5, 0, 8); leg.rotation.z = s*.12; sw.add(leg); }
    sw.add(cyl(.03, .03, 1.1, mat.trim, 0, 1.02, 0, 8)); sw.children[2].rotation.z = Math.PI/2;
    sw.add(box(.32, .04, .16, classMats[1], 0, .32, 0, .02)); add(sw);
    [[-2.6,-2.9,1],[-3.3,-2.9,.85],[3.2,-2.9,.9]].forEach(t => add(tree(...t)));
    return { g, parts, slot };
  }
  // 2 · Coming soon: the same hall, only sketched in dotted brass
  function soon() {
    const g = new THREE.Group(), parts = [];
    const add = o => { g.add(o); parts.push(o); return o; };
    const ghostBox = (w,h,d,x,y,z) => { const grp = new THREE.Group(); grp.position.set(x,y,z);
      grp.add(new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat.ghost));
      const e = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(w,h,d)), mat.sketch); e.computeLineDistances(); grp.add(e); return grp; };
    add(ghostBox(3.2, 1.55, 1.7, 0, BASE + .78, -.3));
    for (const s of [-1,1]) add(ghostBox(1.3, 1.05, 1.3, s*2.2, BASE + .53, -.2));
    const pedShape = new THREE.Shape(); pedShape.moveTo(-1.2,0); pedShape.lineTo(1.2,0); pedShape.lineTo(0,.62); pedShape.closePath();
    const pg = new THREE.ExtrudeGeometry(pedShape, { depth:.64, bevelEnabled:false }); pg.translate(0,0,-.32);
    const pe = new THREE.LineSegments(new THREE.EdgesGeometry(pg), mat.sketch); pe.computeLineDistances(); pe.position.set(0, BASE + 1.55, .6); add(pe);
    // a little crane, building it
    const crane = new THREE.Group(); crane.position.set(-2.6, BASE, 1.2);
    crane.add(box(.08, 2.8, .08, mat.trim, 0, 1.4, 0, .01)); crane.add(box(2.2, .06, .06, mat.trim, .8, 2.8, 0, .01));
    const hook = cyl(.012, .012, .9, mat.trim, 1.7, 2.35, 0, 6); crane.add(hook); add(crane);
    const slot = new THREE.Object3D(); slot.position.set(1.7 - 2.6, BASE + 1.46, 1.2); g.add(slot);   // hangs just under the crane hook
    [[3.2,-2.9,1],[2.5,-2.9,.85]].forEach(t => add(tree(...t)));
    return { g, parts, slot };
  }
  for (const make of [flagship, junior, soon]) {
    const set = make(); set.g.visible = false; turn.add(set.g);
    set.parts.forEach(p => { p.userData.s = p.scale.clone(); p.userData.y = p.position.y; });
    campusSets.push(set);
  }
  let campusShown = -1;
  function showCampus(k, instant) {
    if (k === campusShown) return;
    const prev = campusSets[campusShown]; campusShown = k; const next = campusSets[k];
    if (prev) {
      gsap.killTweensOf(prev.parts.map(p => p.scale));
      prev.parts.forEach((p, n) => gsap.to(p.scale, { x:.001, y:.001, z:.001, duration:instant ? 0 : .35, delay:instant ? 0 : n*.006, ease:'power2.in' }));
      gsap.delayedCall(instant ? 0 : .5, () => { if (campusSets[campusShown] !== prev) prev.g.visible = false; });
    }
    next.g.visible = true;
    next.parts.forEach((p, n) => {
      gsap.killTweensOf(p.scale);
      if (instant) { p.scale.copy(p.userData.s); return; }
      p.scale.set(.001, .001, .001);
      gsap.to(p.scale, { x:p.userData.s.x, y:p.userData.s.y, z:p.userData.s.z, duration:.75, delay:.25 + n*.022, ease:'expo.out' });
    });
  }
  showCampus(0, true);

  /* ================= CAMERA KEYFRAMES ================= */
  // each keyframe: camera position, look-at target, where the subject sits on screen (ox, oy as fractions)
  const K = { hero:null, steps:[], campus:[] };
  function buildKeys() {
    const portrait = innerHeight > innerWidth, ph = isPhone() || portrait;
    K.hero = { pos:V(0, 2.5, ph ? 14.2 : 11), tgt:V(0, 2.35, 0), ox:portrait ? .5 : .73, oy:portrait ? .72 : .5 };
    K.steps = books.map((b, i) => {
      const t = tread(i).add(V(.45, .4, 0)); const far = i === 0 ? 1.25 : 1;
      return { pos:t.clone().add(V(-1.7, 1.75, ph ? 9.4 : 7.2).multiplyScalar(far)), tgt:t, ox:portrait ? .52 : .67, oy:portrait ? .4 : .52 };
    });
    K.campus = [0, 1, 2].map(k => {
      const a = -.62 + k*.58, R = ph ? 17 : 12;
      return { pos:PLINTH.clone().add(V(Math.sin(a)*R, ph ? 6.4 : 5.2, Math.cos(a)*R)), tgt:PLINTH.clone().add(V(0, 1.3, 0)), ox:portrait ? .5 : .36, oy:portrait ? .5 : .57, a };
    });
  }
  buildKeys();

  /* ================= STATE + FRAME ================= */
  const state = { t:0, intro:0, pointer:{ x:0, y:0 }, drag:0, dragV:0, theme:'light', visible:true };
  const cam = { pos:V(), tgt:V(), ox:.5, oy:.5 };
  const tmpA = V(), tmpB = V(), camCtrl = V();
  const smooth = x => x*x*x*(x*(x*6-15)+10);
  const hold = (f, h) => smooth(Math.min(1, Math.max(0, (f - h)/(1 - 2*h))));
  // the scroll "t": 0 = hero, 1..7 = classes, 8..10 = campuses (set by home.js from scroll position)
  function keyAt(i) { if (i <= 0) return K.hero; if (i <= 7) return K.steps[i-1]; return K.campus[Math.min(2, i-8)]; }
  function starAt(i) {
    if (i <= 0) return STAR_SLOT.clone();
    if (i <= 7) return tread(i-1).add(V(0, STAR_REST, 0));
    const k = Math.min(2, i-8); turn.updateMatrixWorld(); return campusSets[k].slot.getWorldPosition(V());
  }
  const starPos = V(), starTarget = V(), ctrl = V();
  function frame(time) {
    const t = state.t, i = Math.min(Math.floor(t), 9), f = t - i;
    const h = i === 0 ? .0 : .2;
    const e = hold(f, h);
    const a = keyAt(i), b = keyAt(i+1);
    cam.tgt.lerpVectors(a.tgt, b.tgt, e);
    if (i === 0) {
      // from the logo to the books: swing up and out in front, never through the logo
      camCtrl.set((a.pos.x + b.pos.x) / 2 + 1, Math.max(a.pos.y, b.pos.y) + 3.4, Math.max(a.pos.z, b.pos.z) + 2.5);
      const u = 1 - e; cam.pos.set(0, 0, 0).addScaledVector(a.pos, u*u).addScaledVector(camCtrl, 2*u*e).addScaledVector(b.pos, e*e);
    } else {
      cam.pos.lerpVectors(a.pos, b.pos, e);
      // lift the camera a little mid-flight so moves feel like a glide, not a slide
      cam.pos.y += Math.sin(Math.PI*e) * (i === 7 ? 2.2 : .25);
    }
    cam.ox = a.ox + (b.ox - a.ox)*e; cam.oy = a.oy + (b.oy - a.oy)*e;
    // campus orbit + drag
    if (i >= 8) { state.dragV *= .93; state.drag += state.dragV; turn.rotation.y = state.drag + (t - 8) * .35; }
    else turn.rotation.y = state.drag;
    // hero pointer parallax
    const heroAmt = Math.max(0, 1 - t*1.4);
    tilt.rotation.y += ((state.pointer.x * .22) * heroAmt + Math.sin(time*.4) * .06 - tilt.rotation.y) * .06;
    tilt.rotation.x += ((state.pointer.y * .1) * heroAmt - tilt.rotation.x) * .06;
    emblem.position.y = .95 + Math.sin(time*.9) * .05;
    camera.position.copy(cam.pos); camera.lookAt(cam.tgt);
    const w = renderer.domElement.clientWidth, hh = renderer.domElement.clientHeight;
    camera.setViewOffset(w, hh, -(cam.ox - .5) * w, -(cam.oy - .5) * hh, w, hh);

    // pages open (intro); once the star has left, the book closes and steps out of the way
    const leave = smooth(Math.min(1, Math.max(0, (t - .04) / .36)));
    emblem.visible = leave < .999;
    emblem.position.y -= leave * .4;
    emblem.scale.setScalar(Math.max(.001, 1 - leave));
    pagePivots.forEach(p => {
      const { side, i:k } = p.userData;
      const open = Math.min(1, Math.max(0, state.intro*1.35 - k*.1));
      const eo = 1 - Math.pow(1 - open, 3);
      const closed = side * (Math.PI/2 - .05);
      const rest = side * (.16 + k*.05);
      const opened = closed + (rest - closed) * eo;
      p.rotation.y = opened + (closed - opened) * leave;
    });

    // star: rises out of the book, then follows the chapters, hopping from book to book
    tmpA.copy(starAt(i)); tmpB.copy(starAt(i+1));
    const se = i === 0 ? smooth(Math.min(1, f*1.1)) : hold(f, .16);
    if (i === 0 || i === 7) {
      // a curve with its handle high above both ends: the star lifts clear before it travels
      ctrl.lerpVectors(tmpA, tmpB, i === 0 ? .25 : .5); ctrl.y = Math.max(tmpA.y, tmpB.y) + (i === 0 ? 2.6 : 3.2);
      const u = 1 - se; starTarget.set(0, 0, 0).addScaledVector(tmpA, u*u).addScaledVector(ctrl, 2*u*se).addScaledVector(tmpB, se*se);
    } else {
      starTarget.lerpVectors(tmpA, tmpB, se);
      starTarget.y += Math.sin(Math.PI*se) * (i >= 8 ? 1.4 : .95);
    }
    const rise = smooth(Math.min(1, Math.max(0, (state.intro - .35) / .65)));
    const spineP = V(0, emblem.position.y + .1, 0);
    if (t < .001) starTarget.lerpVectors(spineP, STAR_SLOT, rise).y += emblem.position.y - .95;
    starPos.lerp(starTarget, t < .001 ? 1 : .45);
    star.position.copy(starPos); star.position.y += Math.sin(time*1.6) * .05;
    star.rotation.y = time * .7 + (1 - rise) * -4;
    const sScale = THREE.MathUtils.lerp(1, STAR_BOOK, smooth(Math.min(1, t * 1.6))) * THREE.MathUtils.lerp(1, .9, smooth(Math.min(1, Math.max(0, t - 7))));
    star.scale.setScalar(Math.max(.001, sScale * (.25 + .75 * rise) * Math.min(1, rise * 4)));
    // squash on landing
    const land = i >= 1 && i < 7 ? Math.max(0, 1 - Math.abs(se - 1) * 12) : 0;
    starMesh.scale.set(1 + land*.12, 1 - land*.15, 1 + land*.12);

    // sparkles orbit the star
    for (let k = 0; k < SPARKS; k++) {
      const s = sparkSeed[k], ang = s.a + time * .5 * s.s;
      sparkPos[k*3] = star.position.x + Math.cos(ang) * s.r;
      sparkPos[k*3+1] = star.position.y + s.y + Math.sin(time*s.s + k) * .12;
      sparkPos[k*3+2] = star.position.z + Math.sin(ang) * s.r;
    }
    sparkGeo.attributes.position.needsUpdate = true;
    sparkMat.opacity = rise * (.55 + .35*Math.sin(time*2.4));
    starLight.position.copy(star.position);

    // the soon-campus star swings on the crane hook; flags wave

    // shadows follow the camera's subject
    key.position.copy(cam.tgt).add(V(-5, 11, 7)); key.target.position.copy(cam.tgt); key.target.updateMatrixWorld();

    books.forEach(b => { b.visible = t < 7.6; });
    // pick the campus model from the scroll position
    if (t >= 7.5) showCampus(Math.min(2, Math.max(0, Math.round(t - 8))));
    renderer.render(scene, camera);
  }

  /* ================= THEME ================= */
  const live = {};   // current numeric values
  function applyTheme(name, instant) {
    state.theme = name; const T = THEMES[name];
    const col = (target, hex) => { if (instant) { gsap.killTweensOf(target); target.setHex(hex); return; } const c = new THREE.Color(hex); gsap.to(target, { r:c.r, g:c.g, b:c.b, duration:.9, ease:'power2.inOut', overwrite:true }); };
    const pairs = [[bg, T.bg], [scene.fog.color, T.bg], [mat.pages.color, T.pages], [mat.pages.sheenColor, T.pagesSheen], [mat.star.color, T.star], [mat.star.emissive, T.starGlow],
      [mat.ribbon.color, T.ribbon], [mat.ribbon.emissive, T.ribbonGlow], [mat.wall.color, T.wall], [mat.roof.color, T.roof], [mat.trim.color, T.trim],
      [mat.lawn.color, T.lawn], [mat.plinth.color, T.plinth], [mat.leaf.color, T.leaf], [mat.trunk.color, T.trunk], [mat.win.color, T.win], [mat.win.emissive, T.winGlow],
      [mat.sketch.color, T.sketch], [mat.ghost.color, T.glass], [sparkMat.color, T.star]];
    pairs.forEach(([c, h]) => col(c, h));
    const nums = { shadow:[mat.shadow, 'opacity', T.shadow], hemi:[hemi, 'intensity', T.hemi], key:[key, 'intensity', T.key], env:[scene, 'environmentIntensity', T.env], sl:[starLight, 'intensity', T.starLight] };
    for (const k in nums) { const [o, p, v] = nums[k]; if (instant) { gsap.killTweensOf(o, p); o[p] = v; } else gsap.to(o, { [p]:v, duration:.9, ease:'power2.inOut', overwrite:true }); }
    hemi.color.setHex(name === 'dark' ? 0x6C7DB8 : 0xFFF8EC); hemi.groundColor.setHex(name === 'dark' ? 0x141B33 : 0xE8DCC6);
    key.color.setHex(name === 'dark' ? 0xAFC2FF : 0xFFF1DC);
  }

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, w < 820 ? 1.6 : 2));
    renderer.setSize(w, h, false); camera.aspect = w / h;
    camera.fov = w / h < .8 ? 42 : 34; camera.updateProjectionMatrix(); buildKeys();
  }
  resize();

  return {
    state, frame, resize, applyTheme, showCampus,
    render: () => frame(performance.now() / 1000),
    intro(duration = 2.2) { gsap.to(state, { intro:1, duration, ease:'power2.out' }); },
  };
}
