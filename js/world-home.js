// world-home.js — the one continuous 3D world behind the main Clarus page.
// Chapter 1 (hero, ink navy): the Clarus emblem opens; floating books, orbit rings and drifting light around it.
// Chapter 2: a student walks onto a staircase of books and climbs it, one book per class, growing as they go.
// Chapter 3: the student stands at each campus; each campus builds itself up on a stone base.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';

const { gsap } = window;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const sh = (m, cast = true, recv = true) => { m.castShadow = cast; m.receiveShadow = recv; return m; };

/* ---------- colours per theme (no gold: navy, ivory, claret, silver) ---------- */
const THEMES = {
  light: { bg:0xF6F2EA, heroBg:0x1A2340, pages:0x1F2A44, heroPages:0xEFE8DA, star:0x9E3346, starGlow:0x000000, ribbon:0x2B3656, heroRibbon:0xC9CEDB,
           wall:0xF5F0E6, roof:0x27314A, trim:0xA9AFBE, lawn:0xE6E0D2, plinth:0xECE6D9, leaf:0x46594A, trunk:0x6B5A48,
           win:0x27314A, winGlow:0x000000, sketch:0x6D78A6, shadow:.14, hemi:.95, key:1.9, env:.8, starLight:0, glass:0xFFFFFF, cloud:0xFFFFFF, lamp:0x000000 },
  dark:  { bg:0x0E1120, heroBg:0x121830, pages:0xEDE5D3, heroPages:0xEFE8DA, star:0xC4566A, starGlow:0x3A0E18, ribbon:0xC9CEDB, heroRibbon:0xC9CEDB,
           wall:0x2A2E3A, roof:0x141826, trim:0x8D95A8, lawn:0x1D2130, plinth:0x1A1E2B, leaf:0x24342B, trunk:0x3A3128,
           win:0xFFD9A0, winGlow:0xD9963A, sketch:0x8A94C4, shadow:.42, hemi:.38, key:.85, env:.45, starLight:6, glass:0x8A8FA8, cloud:0x283049, lamp:0xFFC47A }
};
const CLASS_COLORS = [0x9A6E45, 0x6E2A26, 0x2C4A3C, 0x24304F];   // tan, oxblood, forest, navy leather
const HERO_STAR = .8;    // the logo's star, a touch smaller than in the flat logo

export async function createHomeWorld(canvas, markEls) {
  const isPhone = () => innerWidth < 820;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:false, powerPreference:'high-performance' });
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
  scene.environmentIntensity = .8;
  const bg = new THREE.Color(0x1A2340); scene.background = bg;
  scene.fog = new THREE.Fog(0x1A2340, 22, 60);
  const camera = new THREE.PerspectiveCamera(34, 1, .1, 200);

  /* colours that blend between the hero (ink navy) and the page (ivory) */
  const base = { bg:new THREE.Color(), heroBg:new THREE.Color(), pages:new THREE.Color(), heroPages:new THREE.Color(), ribbon:new THREE.Color(), heroRibbon:new THREE.Color() };

  /* lights */
  const hemi = new THREE.HemisphereLight(0xFFF8EC, 0xE8DCC6, 1); scene.add(hemi);
  const key = new THREE.DirectionalLight(0xFFF1DC, 2);
  key.castShadow = true; key.shadow.mapSize.set(isPhone() ? 1024 : 2048, isPhone() ? 1024 : 2048);
  key.shadow.camera.left = -9; key.shadow.camera.right = 9; key.shadow.camera.top = 9; key.shadow.camera.bottom = -9;
  key.shadow.camera.near = 1; key.shadow.camera.far = 40; key.shadow.bias = -.0004; key.shadow.normalBias = .02;
  scene.add(key, key.target);
  const rim = new THREE.DirectionalLight(0xC9CEFF, 0); rim.position.set(4, 3, -6); scene.add(rim);   // a cool rim light for the hero
  const starLight = new THREE.PointLight(0xFF9AAA, 0, 7, 1.6); scene.add(starLight);

  const mat = {
    pages: new THREE.MeshPhysicalMaterial({ color:0x1F2A44, roughness:.5, clearcoat:.35, clearcoatRoughness:.3, envMapIntensity:.3 }),
    star:  new THREE.MeshPhysicalMaterial({ color:0x9E3346, metalness:.25, roughness:.22, clearcoat:1, clearcoatRoughness:.08, emissive:0x000000, flatShading:true }),
    ribbon:new THREE.MeshStandardMaterial({ color:0x2B3656, roughness:.5 }),
    wall:  new THREE.MeshStandardMaterial({ color:0xF5F0E6, roughness:.8 }),
    roof:  new THREE.MeshStandardMaterial({ color:0x27314A, roughness:.55, metalness:.05 }),
    trim:  new THREE.MeshStandardMaterial({ color:0xA9AFBE, roughness:.28, metalness:.8 }),
    lawn:  new THREE.MeshStandardMaterial({ color:0xE6E0D2, roughness:.95 }),
    plinth:new THREE.MeshStandardMaterial({ color:0xECE6D9, roughness:.6 }),
    leaf:  new THREE.MeshStandardMaterial({ color:0x46594A, roughness:.9 }),
    trunk: new THREE.MeshStandardMaterial({ color:0x6B5A48, roughness:.9 }),
    win:   new THREE.MeshStandardMaterial({ color:0x27314A, roughness:.15, metalness:.4, emissive:0x000000 }),
    frame: new THREE.MeshStandardMaterial({ color:0xFFFFFF, roughness:.6 }),
    lampG: new THREE.MeshStandardMaterial({ color:0xF7EEDB, roughness:.3, emissive:0x000000 }),
    ghost: new THREE.MeshStandardMaterial({ color:0xFFFFFF, transparent:true, opacity:.22, roughness:.2, depthWrite:false }),
    sketch:new THREE.LineDashedMaterial({ color:0x6D78A6, dashSize:.07, gapSize:.07, transparent:true, opacity:.95 }),
    shadow:new THREE.ShadowMaterial({ opacity:.14 }),
    cloud: new THREE.MeshStandardMaterial({ color:0xFFFFFF, roughness:1, transparent:true, opacity:.92 }),
  };
  const classMats = CLASS_COLORS.map(c => new THREE.MeshStandardMaterial({ color:c, roughness:.48, metalness:.04 }));

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), mat.shadow);
  ground.rotation.x = -Math.PI/2; ground.receiveShadow = true; scene.add(ground);

  /* ================= CHAPTER 1 · THE EMBLEM ================= */
  const S = .0078, SPINE = { x:246.25, y:398 };
  const emblem = new THREE.Group(); emblem.position.set(0, .95, 0); scene.add(emblem);
  const tilt = new THREE.Group(); emblem.add(tilt);
  const svgL = new SVGLoader(); const pagePivots = [];
  markEls.bands.forEach((d, i) => {
    const shapes = svgL.parse(`<svg xmlns="http://www.w3.org/2000/svg"><path d="${d}"/></svg>`).paths.flatMap(p => p.toShapes(true));
    const geo = new THREE.ExtrudeGeometry(shapes, { depth:9, bevelEnabled:true, bevelThickness:1.6, bevelSize:.7, bevelSegments:3, curveSegments:10 });
    geo.translate(-SPINE.x, -SPINE.y, -4.5); geo.scale(S, -S, S); geo.computeVertexNormals();
    for (const side of [1, -1]) {
      const pivot = new THREE.Group(); const m = sh(new THREE.Mesh(geo, mat.pages)); m.scale.x = side;
      pivot.add(m); pivot.userData = { side, i }; tilt.add(pivot); pagePivots.push(pivot);
    }
  });
  // the star: sixteen points (four main, four short diagonal rays), faceted towards a raised centre
  function starGeometry({ centre:c, radii:R, depth }) {
    const ring = []; for (let k = 0; k < 16; k++) { const a = -Math.PI/2 + k*Math.PI/8, r = R[k % 4]; ring.push([c[0] + r*Math.cos(a), c[1] + r*Math.sin(a)]); }
    const pos = [];
    for (const face of [1, -1]) for (let k = 0; k < 16; k++) {
      const a = ring[k], b = ring[(k+1) % 16];
      const tri = [[c[0], c[1], depth*face], [a[0], a[1], 0], [b[0], b[1], 0]]; if (face < 0) tri.reverse();
      for (const t of tri) pos.push((t[0]-c[0])*S, -(t[1]-c[1])*S, t[2]*S);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals(); return g;
  }
  const star = sh(new THREE.Mesh(starGeometry(markEls.star), mat.star), true, false); scene.add(star);
  const STAR_SLOT = V(0, emblem.position.y + (SPINE.y - markEls.star.centre[1]) * S, 0);

  /* hero stage: drifting light, two orbit rings, three floating books, a soft disc of light */
  const heroFx = new THREE.Group(); scene.add(heroFx);
  const dotTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
    const g = x.createRadialGradient(32,32,0,32,32,32); g.addColorStop(0,'rgba(255,255,255,1)'); g.addColorStop(.3,'rgba(255,245,235,.7)'); g.addColorStop(1,'rgba(255,240,230,0)');
    x.fillStyle = g; x.fillRect(0,0,64,64); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const DUST = isPhone() ? 70 : 140, dustPos = new Float32Array(DUST*3), dustSeed = [];
  for (let k = 0; k < DUST; k++) { dustSeed.push({ x:(Math.random()-.5)*12, y:Math.random()*6, z:(Math.random()-.5)*6 - 1, s:.15 + Math.random()*.35, p:Math.random()*6.28 }); }
  const dustGeo = new THREE.BufferGeometry(); dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dustMat = new THREE.PointsMaterial({ map:dotTex, color:0xF3E9E4, size:.07, transparent:true, depthWrite:false, opacity:.8 });
  heroFx.add(new THREE.Points(dustGeo, dustMat));
  const discTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
    const g = x.createRadialGradient(128,128,0,128,128,128); g.addColorStop(0,'rgba(196,86,106,.55)'); g.addColorStop(.45,'rgba(120,90,190,.22)'); g.addColorStop(1,'rgba(40,50,110,0)');
    x.fillStyle = g; x.fillRect(0,0,256,256); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const disc = new THREE.Mesh(new THREE.PlaneGeometry(7.5, 7.5), new THREE.MeshBasicMaterial({ map:discTex, transparent:true, depthWrite:false, fog:false }));
  disc.position.set(0, 2.5, -1.6); heroFx.add(disc);
  const ringMat = new THREE.MeshBasicMaterial({ color:0xDCE0F0, transparent:true, opacity:.32, fog:false });
  const orbits = [[2.15, .2, -.35], [2.7, -.28, .5]].map(([r, rx, rz]) => {
    const g = new THREE.Group(); g.position.set(0, 2.45, 0); g.rotation.set(Math.PI/2 + rx, 0, rz);
    g.add(new THREE.Mesh(new THREE.TorusGeometry(r, .006, 6, 160), ringMat));
    const bead = new THREE.Mesh(new THREE.SphereGeometry(.045, 16, 12), new THREE.MeshBasicMaterial({ color:0xFFFFFF, fog:false })); bead.position.x = r; g.add(bead);
    heroFx.add(g); return g;
  });
  function smallBook(color, w = .62, h = .1, d = .44) {
    const g = new THREE.Group(), m = new THREE.MeshStandardMaterial({ color, roughness:.45, metalness:.05 });
    g.add(sh(new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 2, .02), m)));
    const p = new THREE.Mesh(new THREE.BoxGeometry(w - .04, h - .03, d - .02), new THREE.MeshStandardMaterial({ color:0xF7F1E3, roughness:.9 })); p.position.z = -.012; g.add(p);
    const band = new THREE.Mesh(new THREE.BoxGeometry(w * .7, h * .5, .004), mat.trim); band.position.z = d/2 + .002; g.add(band);
    return g;
  }
  const floaters = [[0x24304F, 3.05, 2.55, -1.1], [0x6E2A26, 2.55, 1.15, .7], [0xEFE8DA, -2.35, 1.0, -.9]].map(([c, x, y, z], k) => {
    const b = smallBook(c); b.position.set(x, y, z); b.userData = { x, y, z, p:k * 2.1 }; heroFx.add(b); return b;
  });

  /* ================= THE PATH ================= */
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
  scene.add(ribbon(pathCurve, .06, .006, mat.ribbon));

  /* soft clouds far behind, drifting */
  const clouds = [];
  function cloud(x, y, z, s) {
    const g = new THREE.Group(); g.position.set(x, y, z); g.scale.setScalar(s);
    [[0,0,0,1],[.9,-.15,.1,.75],[-.85,-.2,0,.7],[.35,.35,-.1,.7],[-.3,.3,.05,.6]].forEach(([a,b,c,r]) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), mat.cloud); m.position.set(a,b,c); m.scale.y = .72; g.add(m); });
    g.userData = { x, sp:.05 + Math.random()*.06 }; scene.add(g); clouds.push(g);
  }
  [[4,7.5,-16,1.6],[13,8.5,-19,2],[20,7,-15,1.3],[28,9,-20,2.2],[34,7.8,-14,1.4]].forEach(c => cloud(...c));

  /* cypress trees */
  const cypressGeo = (() => { const pts = []; for (let k = 0; k <= 14; k++) { const y = k / 14; pts.push(new THREE.Vector2(Math.sin(Math.PI * Math.pow(y, .72)) * .3 * (1 - y * .15), y * 1.9)); } return new THREE.LatheGeometry(pts, 18); })();
  function tree(x, z, s = 1) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s);
    g.add(sh(new THREE.Mesh(new THREE.CylinderGeometry(.045, .06, .3, 8), mat.trunk)).translateY(.15));
    const c = sh(new THREE.Mesh(cypressGeo, mat.leaf)); c.position.y = .22; g.add(c); g.userData.sway = Math.random()*6; return g;
  }

  /* ================= CHAPTER 2 · THE STAIRCASE OF BOOKS ================= */
  const CLASSES = 7;
  function labelTexture(text, fg, bgc) {
    const c = document.createElement('canvas'); c.width = 1024; c.height = 160; const x = c.getContext('2d');
    x.fillStyle = bgc; x.fillRect(0,0,1024,160);
    x.strokeStyle = fg; x.globalAlpha = .5; x.lineWidth = 2; x.strokeRect(70, 30, 884, 100); x.globalAlpha = 1;
    x.fillStyle = fg; x.font = '500 60px Cinzel, Georgia, serif'; x.letterSpacing = '10px'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(text.toUpperCase(), 512, 84);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
  }
  const books = [];
  const W = 2.55, H = .44, D = 1.8;
  const pageLines = (() => { const c = document.createElement('canvas'); c.width = 64; c.height = 256; const x = c.getContext('2d');
    x.fillStyle = '#fbf6ea'; x.fillRect(0,0,64,256); x.fillStyle = 'rgba(110,100,90,.16)'; for (let y = 3; y < 256; y += 5) x.fillRect(0, y, 64, 1);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, 1); return t; })();
  const pageMat = new THREE.MeshStandardMaterial({ map:pageLines, roughness:.9 });
  const ribbonMats = [0x7A1F2E, 0x24304F, 0x7A1F2E, 0xD9D2C4].map(c => new THREE.MeshStandardMaterial({ color:c, roughness:.6, side:THREE.DoubleSide }));
  const NAMES = ['Nursery','KG','Class 1','Class 2','Classes 3–5','Classes 6–8','Matric'];
  for (let i = 0; i < CLASSES; i++) {
    const open = i < 4, g = new THREE.Group();
    g.position.set(STAIR0.x + i*STEP.dx, i*STEP.dy, STAIR0.z - i*.12);
    g.rotation.y = [.03,-.05,.06,-.02,.05,-.04,0][i];
    if (open) {
      const cover = classMats[i];
      g.add(sh(new THREE.Mesh(new RoundedBoxGeometry(W, .06, D, 3, .025), cover)).translateY(.03));
      g.add(sh(new THREE.Mesh(new RoundedBoxGeometry(W, .06, D, 3, .025), cover)).translateY(H - .03));
      const block = sh(new THREE.Mesh(new THREE.BoxGeometry(W - .1, H - .1, D - .1), pageMat)); block.position.set(0, H/2, -.03); g.add(block);
      const spine = sh(new THREE.Mesh(new RoundedBoxGeometry(W, H, .16, 4, .07), cover)); spine.position.set(0, H/2, D/2 - .06); g.add(spine);
      const lab = new THREE.Mesh(new THREE.PlaneGeometry(W*.7, W*.7*160/1024), new THREE.MeshStandardMaterial({ map:labelTexture(NAMES[i], '#EFE6D2', '#' + CLASS_COLORS[i].toString(16).padStart(6,'0')), roughness:.55 }));
      lab.position.set(0, H/2, D/2 + .025); g.add(lab);
      // raised silver bands across the spine, and metal corners on the cover
      for (const s of [-.44, -.38, .38, .44]) { const b = new THREE.Mesh(new RoundedBoxGeometry(.035, H*.92, .03, 1, .01), mat.trim); b.position.set(s*W, H/2, D/2 + .02); g.add(b); }
      for (const sx of [-1, 1]) { const cnr = new THREE.Mesh(new THREE.BoxGeometry(.14, .012, .14), mat.trim); cnr.position.set(sx*(W/2 - .07), H + .002, -(D/2 - .07)); g.add(cnr); }
      // a silk bookmark hanging out of the pages
      const rb = new THREE.Mesh(new THREE.PlaneGeometry(.055, .34), ribbonMats[i]); rb.position.set(.62, H*.32, D/2 + .045); rb.rotation.set(.18, 0, .08); g.add(rb);
    } else {
      const ghost = new THREE.Mesh(new RoundedBoxGeometry(W, H, D, 3, .05), mat.ghost); ghost.position.y = H/2; g.add(ghost);
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(W, H, D)), mat.sketch); edges.position.y = H/2; edges.computeLineDistances(); g.add(edges);
      const lab = new THREE.Mesh(new THREE.PlaneGeometry(W*.7, W*.7*160/1024), new THREE.MeshBasicMaterial({ map:labelTexture(NAMES[i], '#6D78A6', 'rgba(0,0,0,0)'), transparent:true, depthWrite:false }));
      lab.position.set(0, H/2, D/2 + .01); g.add(lab);
    }
    scene.add(g); books.push(g);
  }
  // the part of each book's cover not covered by the next book: where the student stands
  const tread = i => { books[i].updateMatrixWorld(); return books[i].localToWorld(V(i < CLASSES - 1 ? -(W - STEP.dx) / 2 : 0, H, .15)); };

  /* ================= THE STUDENT ================= */
  // navy blazer, white collar, claret tie, charcoal trousers, claret backpack. Pivots at hips and shoulders for walking.
  const skin = new THREE.MeshStandardMaterial({ color:0xC99A7A, roughness:.6 });
  const hairM = new THREE.MeshStandardMaterial({ color:0x2A1E18, roughness:.75 });
  const blazer = new THREE.MeshStandardMaterial({ color:0x1F2A44, roughness:.7 });
  const shirt = new THREE.MeshStandardMaterial({ color:0xF7F4EE, roughness:.8 });
  const trouser = new THREE.MeshStandardMaterial({ color:0x3A3D46, roughness:.8 });
  const shoe = new THREE.MeshStandardMaterial({ color:0x15161A, roughness:.35, metalness:.1 });
  const tieM = new THREE.MeshStandardMaterial({ color:0x8E2B3A, roughness:.5 });
  const bagM = new THREE.MeshStandardMaterial({ color:0x7A2433, roughness:.55 });
  const eyeM = new THREE.MeshStandardMaterial({ color:0x1A1412, roughness:.2 });
  const capM = new THREE.MeshStandardMaterial({ color:0x15192A, roughness:.6 });
  const cap = (r, h, m) => sh(new THREE.Mesh(new THREE.CapsuleGeometry(r, h, 6, 14), m));
  const student = new THREE.Group(); scene.add(student);
  const body = new THREE.Group(); student.add(body);
  const legs = [], arms = [];
  for (const s of [-1, 1]) {
    const hip = new THREE.Group(); hip.position.set(s*.075, .46, 0); body.add(hip);
    const leg = cap(.058, .3, trouser); leg.position.y = -.2; hip.add(leg);
    const foot = sh(new THREE.Mesh(new RoundedBoxGeometry(.1, .065, .18, 2, .03), shoe)); foot.position.set(0, -.41, .035); hip.add(foot);
    legs.push(hip);
    const sho = new THREE.Group(); sho.position.set(s*.165, .8, 0); body.add(sho);
    const arm = cap(.045, .26, blazer); arm.position.y = -.16; arm.rotation.z = s*.08; sho.add(arm);
    const hand = sh(new THREE.Mesh(new THREE.SphereGeometry(.045, 14, 10), skin)); hand.position.set(s*.02, -.33, 0); sho.add(hand);
    arms.push(sho);
  }
  const torso = cap(.14, .22, blazer); torso.position.y = .66; torso.scale.set(1, 1, .78); body.add(torso);
  const collar = new THREE.Mesh(new THREE.ConeGeometry(.08, .1, 3), shirt); collar.position.set(0, .8, .085); collar.rotation.x = Math.PI; body.add(collar);
  const tie = new THREE.Mesh(new THREE.BoxGeometry(.035, .16, .01), tieM); tie.position.set(0, .7, .118); body.add(tie);
  const bag = sh(new THREE.Mesh(new RoundedBoxGeometry(.26, .3, .12, 3, .05), bagM)); bag.position.set(0, .66, -.16); body.add(bag);
  for (const s of [-1, 1]) { const strap = new THREE.Mesh(new THREE.BoxGeometry(.03, .26, .02), bagM); strap.position.set(s*.08, .7, .1); strap.rotation.x = -.15; body.add(strap); }
  const head = new THREE.Group(); head.position.y = 1.0; body.add(head);
  head.add(sh(new THREE.Mesh(new THREE.SphereGeometry(.15, 24, 18), skin)));
  const hair = sh(new THREE.Mesh(new THREE.SphereGeometry(.158, 24, 18, 0, Math.PI*2, 0, Math.PI*.55), hairM)); hair.rotation.x = -.25; head.add(hair);
  for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(.017, 10, 8), eyeM); e.position.set(s*.052, .005, .138); head.add(e); }
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(.045, .05, .07, 10), skin); neck.position.y = .87; body.add(neck);
  // a graduation cap that appears at the top of the staircase
  const mortar = new THREE.Group(); mortar.position.y = .15; head.add(mortar);
  mortar.add(new THREE.Mesh(new THREE.CylinderGeometry(.12, .13, .07, 18), capM));
  const board = new THREE.Mesh(new THREE.BoxGeometry(.34, .018, .34), capM); board.position.y = .045; board.rotation.y = Math.PI/4; mortar.add(board);
  const tassel = new THREE.Mesh(new THREE.CylinderGeometry(.006, .006, .14, 6), tieM); tassel.position.set(.14, -.01, 0); mortar.add(tassel);
  mortar.scale.setScalar(.001);

  /* ================= CHAPTER 3 · CAMPUSES ON A STONE BASE ================= */
  const turn = new THREE.Group(); turn.position.copy(PLINTH); scene.add(turn);
  turn.add(sh(new THREE.Mesh(new RoundedBoxGeometry(8.4, .2, 8.4, 3, .08), mat.plinth)).translateY(.1));
  turn.add(sh(new THREE.Mesh(new RoundedBoxGeometry(7.9, .18, 7.9, 3, .08), mat.plinth)).translateY(.29));
  for (const [w, d, x, z] of [[7.3, .03, 0, 3.63], [7.3, .03, 0, -3.63], [.03, 7.3, 3.63, 0], [.03, 7.3, -3.63, 0]]) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, .012, d), mat.trim); b.position.set(x, .386, z); turn.add(b); }
  const lawn = sh(new THREE.Mesh(new THREE.BoxGeometry(7.1, .01, 7.1), mat.lawn), false, true); lawn.position.y = .384; turn.add(lawn);
  const campusSets = [];
  const box = (w,h,d,m,x,y,z,r=.03) => { const o = sh(new THREE.Mesh(new RoundedBoxGeometry(w,h,d,2,Math.min(r, w/2-.001, h/2-.001, d/2-.001)), m)); o.position.set(x,y,z); return o; };
  const cyl = (rt,rb,h,m,x,y,z,seg=20) => { const o = sh(new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg), m)); o.position.set(x,y,z); return o; };
  function prism(w, h, d, m) { const s = new THREE.Shape(); s.moveTo(-w/2,0); s.lineTo(w/2,0); s.lineTo(0,h); s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth:d, bevelEnabled:false }); g.translate(0,0,-d/2); return sh(new THREE.Mesh(g, m)); }
  function windows(parent, w, rows, cols, y0, dy, z, xs = 0) {   // framed windows with a sill
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const x = xs + (c - (cols-1)/2) * (w/cols);
      const fr = new THREE.Mesh(new THREE.PlaneGeometry(.26, .36), mat.frame); fr.position.set(x, y0 + r*dy, z); parent.add(fr);
      const win = new THREE.Mesh(new THREE.PlaneGeometry(.2, .3), mat.win); win.position.set(x, y0 + r*dy, z + .003); parent.add(win);
      const sill = new THREE.Mesh(new THREE.BoxGeometry(.3, .025, .05), mat.frame); sill.position.set(x, y0 + r*dy - .19, z + .02); parent.add(sill);
    }
  }
  function lamp(x, z) { const g = new THREE.Group(); g.position.set(x, BASE, z);
    g.add(cyl(.018, .025, .7, mat.trim, 0, .35, 0, 8)); const l = sh(new THREE.Mesh(new THREE.SphereGeometry(.06, 14, 10), mat.lampG), true, false); l.position.y = .74; g.add(l);
    g.add(cyl(.05, .05, .02, mat.trim, 0, .8, 0, 10)); return g; }
  function hedge(w, x, z) { return box(w, .22, .22, mat.leaf, x, BASE + .11, z, .1); }
  function walkway(len, z0) { return box(.8, .02, len, mat.plinth, 0, BASE + .012, z0 + len/2, .01); }
  const BASE = .385;
  function flagship() {
    const g = new THREE.Group(), parts = [], add = o => { g.add(o); parts.push(o); return o; };
    add(box(3.2, 1.55, 1.7, mat.wall, 0, BASE + .78, -.3));
    add(box(3.34, .07, 1.84, mat.frame, 0, BASE + 1.52, -.3, .02));                 // cornice
    add(box(3.4, .12, 1.9, mat.roof, 0, BASE + 1.6, -.3));
    for (const s of [-1, 1]) { add(box(1.3, 1.05, 1.3, mat.wall, s*2.2, BASE + .53, -.2)); add(box(1.38, .05, 1.38, mat.frame, s*2.2, BASE + 1.05, -.2, .02)); add(box(1.42, .1, 1.42, mat.roof, s*2.2, BASE + 1.1, -.2)); }
    for (let k = 0; k < 3; k++) add(box(2.2 - k*.12, .08, .5 - k*.12, mat.plinth, 0, BASE + .04 + k*.08, .82 - k*.06, .01));
    for (let c = 0; c < 6; c++) { const x = -.95 + c*.38;
      add(cyl(.07, .08, 1.1, mat.wall, x, BASE + .84, .66, 16)); add(box(.18, .05, .18, mat.frame, x, BASE + 1.41, .66, .01)); add(box(.18, .05, .18, mat.frame, x, BASE + .3, .66, .01)); }
    add(box(2.3, .1, .62, mat.wall, 0, BASE + 1.47, .6));
    const ped = add(prism(2.4, .62, .64, mat.roof)); ped.position.set(0, BASE + 1.52, .6);
    const door = new THREE.Mesh(new THREE.PlaneGeometry(.42, .72), mat.roof); door.position.set(0, BASE + .5, .56); add(door);
    const wg = new THREE.Group(); windows(wg, 2.6, 2, 6, BASE + .5, .62, .56); for (const s of [-1,1]) windows(wg, 1, 1, 2, BASE + .55, 0, .46, s*2.2); add(wg);
    add(walkway(2.3, 1.1)); add(lamp(-.7, 2.2)); add(lamp(.7, 2.2));
    add(hedge(1.6, -2.2, .7)); add(hedge(1.6, 2.2, .7));
    [[-2.4,-2.9,1.05],[2.4,-2.9,1.05],[-3.25,-2.9,.85],[3.25,-2.9,.85]].forEach(t => add(tree(...t)));
    return { g, parts, spot:V(.42, BASE, 2.55) };
  }
  function junior() {
    const g = new THREE.Group(), parts = [], add = o => { g.add(o); parts.push(o); return o; };
    add(box(2.8, 1.5, 1.6, mat.wall, -.4, BASE + .75, -.4, .18));
    add(box(3, .14, 1.8, mat.roof, -.4, BASE + 1.57, -.4, .07));
    add(cyl(.62, .62, 2.1, mat.wall, 1.4, BASE + 1.05, -.3, 32));
    add(cyl(.66, .66, .06, mat.frame, 1.4, BASE + 2.08, -.3, 32));
    const cone = add(sh(new THREE.Mesh(new THREE.ConeGeometry(.78, .9, 32), mat.roof))); cone.position.set(1.4, BASE + 2.55, -.3);
    for (let c = 0; c < 4; c++) for (let r = 0; r < 2; r++) {
      add(box(.42, .42, .06, classMats[(c + r) % 4], -1.45 + c*.7, BASE + .52 + r*.62, .42, .08));
      const w = new THREE.Mesh(new THREE.PlaneGeometry(.3, .3), mat.win); w.position.set(-1.45 + c*.7, BASE + .52 + r*.62, .455); add(w);
    }
    const slide = new THREE.Group(); slide.position.set(-.4, BASE, 1.6);
    slide.add(box(.5, .06, 1.3, classMats[0], 0, .45, 0, .02)); slide.children[0].rotation.x = .55;
    slide.add(box(.5, .9, .1, classMats[2], 0, .45, -.62, .04)); add(slide);
    const sw = new THREE.Group(); sw.position.set(1.7, BASE, 1.5);
    for (const s of [-1,1]) { const leg = cyl(.03, .03, 1.05, mat.trim, s*.5, .5, 0, 8); leg.rotation.z = s*.12; sw.add(leg); }
    sw.add(cyl(.03, .03, 1.1, mat.trim, 0, 1.02, 0, 8)); sw.children[2].rotation.z = Math.PI/2;
    sw.add(box(.32, .04, .16, classMats[1], 0, .32, 0, .02)); add(sw);
    add(hedge(1.2, -2.6, .7)); add(lamp(-1.3, 2.4));
    [[-2.6,-2.9,1],[-3.3,-2.9,.85],[3.2,-2.9,.9]].forEach(t => add(tree(...t)));
    return { g, parts, spot:V(.95, BASE, 2.6) };
  }
  function soon() {
    const g = new THREE.Group(), parts = [], add = o => { g.add(o); parts.push(o); return o; };
    const ghostBox = (w,h,d,x,y,z) => { const grp = new THREE.Group(); grp.position.set(x,y,z);
      grp.add(new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat.ghost));
      const e = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(w,h,d)), mat.sketch); e.computeLineDistances(); grp.add(e); return grp; };
    add(ghostBox(3.2, 1.55, 1.7, 0, BASE + .78, -.3));
    for (const s of [-1,1]) add(ghostBox(1.3, 1.05, 1.3, s*2.2, BASE + .53, -.2));
    const pedShape = new THREE.Shape(); pedShape.moveTo(-1.2,0); pedShape.lineTo(1.2,0); pedShape.lineTo(0,.62); pedShape.closePath();
    const pg = new THREE.ExtrudeGeometry(pedShape, { depth:.64, bevelEnabled:false }); pg.translate(0,0,-.32);
    const pe = new THREE.LineSegments(new THREE.EdgesGeometry(pg), mat.sketch); pe.computeLineDistances(); pe.position.set(0, BASE + 1.55, .6); add(pe);
    const crane = new THREE.Group(); crane.position.set(-2.6, BASE, 1.2);
    crane.add(box(.08, 2.8, .08, mat.trim, 0, 1.4, 0, .01)); crane.add(box(2.2, .06, .06, mat.trim, .8, 2.8, 0, .01));
    crane.add(cyl(.012, .012, .9, mat.trim, 1.7, 2.35, 0, 6));
    const crate = box(.3, .22, .3, classMats[0], 1.7, 1.78, 0, .03); crane.add(crate); crane.userData.crate = crate; add(crane);
    [[3.2,-2.9,1],[2.5,-2.9,.85]].forEach(t => add(tree(...t)));
    return { g, parts, spot:V(1.3, BASE, 2.5), crane };
  }
  for (const make of [flagship, junior, soon]) {
    const set = make(); set.g.visible = false; turn.add(set.g);
    set.parts.forEach(p => { p.userData.s = p.scale.clone(); });
    campusSets.push(set);
  }
  let campusShown = -1;
  function showCampus(k, instant) {
    if (k === campusShown) return;
    const prev = campusSets[campusShown]; campusShown = k; const next = campusSets[k];
    if (prev) {
      prev.parts.forEach((p, n) => { gsap.killTweensOf(p.scale); gsap.to(p.scale, { x:.001, y:.001, z:.001, duration:instant ? 0 : .35, delay:instant ? 0 : n*.006, ease:'power2.in' }); });
      gsap.delayedCall(instant ? 0 : .5, () => { if (campusSets[campusShown] !== prev) prev.g.visible = false; });
    }
    next.g.visible = true;
    next.parts.forEach((p, n) => {
      gsap.killTweensOf(p.scale);
      if (instant) { p.scale.copy(p.userData.s); return; }
      p.scale.set(.001, .001, .001);
      gsap.to(p.scale, { x:p.userData.s.x, y:p.userData.s.y, z:p.userData.s.z, duration:.75, delay:.25 + n*.018, ease:'expo.out' });
    });
  }
  showCampus(0, true);

  /* ================= CAMERA KEYFRAMES ================= */
  const K = { hero:null, steps:[], campus:[] };
  function buildKeys() {
    const portrait = innerHeight > innerWidth, ph = isPhone() || portrait;
    K.hero = { pos:V(0, 2.6, ph ? 15.5 : 12.4), tgt:V(0, 2.4, 0), ox:portrait ? .5 : .735, oy:portrait ? .7 : .5 };
    K.steps = books.map((b, i) => {
      const t = tread(i).add(V(.45, .55, 0)); const far = i === 0 ? 1.2 : 1;
      return { pos:t.clone().add(V(-1.7, 1.6, ph ? 9.2 : 7).multiplyScalar(far)), tgt:t, ox:portrait ? .52 : .66, oy:portrait ? .42 : .52 };
    });
    K.campus = [0, 1, 2].map(k => {
      const a = -.62 + k*.58, R = ph ? 17 : 12;
      return { pos:PLINTH.clone().add(V(Math.sin(a)*R, ph ? 6.4 : 5.2, Math.cos(a)*R)), tgt:PLINTH.clone().add(V(0, 1.2, 0)), ox:portrait ? .5 : .37, oy:portrait ? .5 : .56 };
    });
  }
  buildKeys();

  /* ================= STATE + FRAME ================= */
  const state = { t:0, intro:0, pointer:{ x:0, y:0 }, px:0, py:0, drag:0, dragV:0, theme:'light' };
  const cam = { pos:V(), tgt:V(), ox:.5, oy:.5 };
  const tmpA = V(), tmpB = V(), camCtrl = V(), stuPos = V(), stuTarget = V();
  const smooth = x => x*x*x*(x*(x*6-15)+10);
  const clamp01 = x => Math.min(1, Math.max(0, x));
  const hold = (f, h) => smooth(clamp01((f - h)/(1 - 2*h)));
  function keyAt(i) { if (i <= 0) return K.hero; if (i <= 7) return K.steps[i-1]; return K.campus[Math.min(2, i-8)]; }
  const ENTRY = V(3.6, 0, -3.9);                       // where the student walks in from
  function spotAt(i) {
    if (i <= 0) return ENTRY.clone();
    if (i <= 7) return tread(i-1);
    const k = Math.min(2, i-8); turn.updateMatrixWorld(); return turn.localToWorld(campusSets[k].spot.clone());
  }
  const growth = i => .62 + Math.min(6, Math.max(0, i)) * .07;   // the student grows a little with every class
  const tmpCol = new THREE.Color();

  function frame(time) {
    const t = state.t, i = Math.min(Math.floor(t), 9), f = t - i;
    const e = hold(f, i === 0 ? 0 : .2);
    const a = keyAt(i), b = keyAt(i+1);
    const heroMix = 1 - smooth(clamp01(t / .55));

    // camera (with a slow breath so the world never feels frozen)
    cam.tgt.lerpVectors(a.tgt, b.tgt, e);
    if (i === 0) {
      camCtrl.set((a.pos.x + b.pos.x) / 2 + 1, Math.max(a.pos.y, b.pos.y) + 3.4, Math.max(a.pos.z, b.pos.z) + 2.5);
      const u = 1 - e; cam.pos.set(0, 0, 0).addScaledVector(a.pos, u*u).addScaledVector(camCtrl, 2*u*e).addScaledVector(b.pos, e*e);
    } else { cam.pos.lerpVectors(a.pos, b.pos, e); cam.pos.y += Math.sin(Math.PI*e) * (i === 7 ? 2.2 : .25); }
    state.px += (state.pointer.x - state.px) * .05; state.py += (state.pointer.y - state.py) * .05;
    cam.pos.x += Math.sin(time * .23) * .06 + state.px * .25; cam.pos.y += Math.sin(time * .31) * .04 - state.py * .12;
    cam.ox = a.ox + (b.ox - a.ox)*e; cam.oy = a.oy + (b.oy - a.oy)*e;
    if (i >= 8) { state.dragV *= .93; state.drag += state.dragV; turn.rotation.y = state.drag + (t - 8) * .35; } else turn.rotation.y = state.drag;
    camera.position.copy(cam.pos); camera.lookAt(cam.tgt);
    const w = renderer.domElement.clientWidth, hh = renderer.domElement.clientHeight;
    camera.setViewOffset(w, hh, -(cam.ox - .5) * w, -(cam.oy - .5) * hh, w, hh);

    // hero ↔ page colours
    bg.copy(base.bg).lerp(base.heroBg, heroMix); scene.fog.color.copy(bg);
    mat.pages.color.copy(base.pages).lerp(base.heroPages, heroMix);
    mat.ribbon.color.copy(base.ribbon).lerp(base.heroRibbon, heroMix);
    rim.intensity = heroMix * 1.4;

    // emblem: opens on arrival; folds away as you leave the hero
    tilt.rotation.y += ((state.px * .25) * heroMix + Math.sin(time*.4) * .06 - tilt.rotation.y) * .06;
    tilt.rotation.x += ((state.py * .1) * heroMix - tilt.rotation.x) * .06;
    const leave = smooth(clamp01((t - .04) / .36));
    emblem.position.y = .95 + Math.sin(time*.9) * .05 - leave * .4;
    emblem.visible = leave < .999; emblem.scale.setScalar(Math.max(.001, 1 - leave));
    pagePivots.forEach(p => {
      const { side, i:k } = p.userData;
      const eo = 1 - Math.pow(1 - clamp01(state.intro*1.35 - k*.1), 3);
      const closed = side * (Math.PI/2 - .05), rest = side * (.16 + k*.05), opened = closed + (rest - closed) * eo;
      p.rotation.y = opened + (closed - opened) * leave;
    });
    const rise = smooth(clamp01((state.intro - .35) / .65));
    star.position.lerpVectors(V(0, emblem.position.y + .1, 0), STAR_SLOT, rise); star.position.y += emblem.position.y - .95 + Math.sin(time*1.4)*.04;
    star.rotation.y = time * .6 + (1 - rise) * -4; star.rotation.z = Math.sin(time * .7) * .05;
    star.scale.setScalar(Math.max(.001, HERO_STAR * rise * (1 - leave)));
    star.visible = leave < .999;
    starLight.position.copy(star.position);

    // hero stage effects
    heroFx.visible = heroMix > .01;
    if (heroFx.visible) {
      const fx = heroMix * Math.min(1, state.intro * 1.5);
      ringMat.opacity = .32 * fx; dustMat.opacity = .8 * fx; disc.material.opacity = fx;
      orbits[0].rotation.z += .0025; orbits[1].rotation.z -= .0018;
      floaters.forEach((b, k) => { const u = b.userData; b.position.set(u.x + state.px*.2*(k+1), u.y + Math.sin(time*.8 + u.p)*.14, u.z); b.rotation.set(.35 + Math.sin(time*.5+u.p)*.15, time*.25 + u.p, .2 + Math.cos(time*.6+u.p)*.1); b.scale.setScalar(Math.max(.001, fx)); });
      for (let k = 0; k < DUST; k++) { const s = dustSeed[k]; dustPos[k*3] = s.x + Math.sin(time*.3 + s.p)*.2; dustPos[k*3+1] = (s.y + time*s.s*.25) % 6; dustPos[k*3+2] = s.z; }
      dustGeo.attributes.position.needsUpdate = true;
      disc.lookAt(camera.position);
    }

    // ---- the student ----
    tmpA.copy(spotAt(i)); tmpB.copy(spotAt(i+1));
    let se = i === 0 ? smooth(clamp01((f - .45) / .55)) : hold(f, .18);
    let show = 1, moving = se > .02 && se < .98, climbing = i >= 1 && i < 7 || i === 0;
    if (i === 7) {                      // Matric → campus: step out at the top, appear at the campus gate
      show = f < .5 ? 1 - smooth(clamp01(f / .4)) : smooth(clamp01((f - .6) / .3));
      stuTarget.copy(f < .5 ? tmpA : tmpB); moving = false; climbing = false;
    } else {
      stuTarget.lerpVectors(tmpA, tmpB, se);
      if (climbing) stuTarget.y += Math.sin(Math.PI * se) * .6;     // an arc high enough to clear each step's edge
      else stuTarget.y += Math.sin(Math.PI * se) * .25;
    }
    if (i === 0) show = smooth(clamp01((f - .35) / .2));
    stuPos.lerp(stuTarget, .5); student.position.copy(stuPos);
    const size = i >= 8 ? .62 : THREE.MathUtils.lerp(growth(i - 1), growth(i), se);
    student.scale.setScalar(Math.max(.001, size * show));
    student.visible = show > .01;
    // facing: towards the next step while moving, three-quarters to the camera when resting
    const dir = Math.atan2(tmpB.x - tmpA.x, tmpB.z - tmpA.z);
    const restFace = Math.atan2(camera.position.x - stuPos.x, camera.position.z - stuPos.z) * .7;
    const wantFace = moving ? dir : restFace;
    student.rotation.y += (wantFace - student.rotation.y) * .12;
    // limbs: strides are tied to scroll, so every movement is exact
    const phase = se * Math.PI * 4;
    const stride = moving ? Math.sin(phase) * .7 : 0;
    legs[0].rotation.x = stride; legs[1].rotation.x = -stride;
    const atCampus = i >= 8 && !moving;
    arms[0].rotation.x = moving ? -stride * .8 : 0; arms[1].rotation.x = moving ? stride * .8 : 0;
    arms[1].rotation.z = atCampus ? 2.5 + Math.sin(time * 6) * .25 : arms[1].rotation.z * .85;     // a wave at each campus
    arms[0].rotation.z = 0;
    body.position.y = moving ? Math.abs(Math.sin(phase)) * .04 : Math.sin(time*2) * .006;
    head.rotation.y = moving ? 0 : Math.sin(time * .7) * .2;
    const capOn = i >= 6 && i < 8 ? (i === 6 ? se : 1) : 0;
    mortar.scale.setScalar(Math.max(.001, capOn));

    // a living world: clouds drift, trees sway, the crate on the crane swings, lamps breathe at night
    clouds.forEach(c => { c.position.x = c.userData.x + Math.sin(time * c.userData.sp) * 2.5; c.visible = heroMix < .5; });
    campusSets.forEach(s => s.parts.forEach(p => { if (p.userData.sway !== undefined) p.rotation.z = Math.sin(time * .9 + p.userData.sway) * .025; }));
    const cr = campusSets[2].crane.userData.crate; cr.rotation.z = Math.sin(time * 1.2) * .08; cr.position.x = 1.7 + Math.sin(time * 1.2) * .05;
    if (state.theme === 'dark') mat.lampG.emissiveIntensity = .9 + Math.sin(time * 3) * .05;

    key.position.copy(cam.tgt).add(V(-5, 11, 7)); key.target.position.copy(cam.tgt); key.target.updateMatrixWorld();
    books.forEach(bk => { bk.visible = t < 7.6; });
    if (t >= 7.5) showCampus(Math.min(2, Math.max(0, Math.round(t - 8))));
    renderer.render(scene, camera);
  }

  /* ================= THEME ================= */
  function applyTheme(name, instant) {
    state.theme = name; const T = THEMES[name];
    const col = (target, hex) => { if (instant) { gsap.killTweensOf(target); target.setHex(hex); return; } const c = new THREE.Color(hex); gsap.to(target, { r:c.r, g:c.g, b:c.b, duration:.9, ease:'power2.inOut', overwrite:true }); };
    [[base.bg, T.bg], [base.heroBg, T.heroBg], [base.pages, T.pages], [base.heroPages, T.heroPages], [base.ribbon, T.ribbon], [base.heroRibbon, T.heroRibbon],
     [mat.star.color, T.star], [mat.star.emissive, T.starGlow], [mat.wall.color, T.wall], [mat.roof.color, T.roof], [mat.trim.color, T.trim],
     [mat.lawn.color, T.lawn], [mat.plinth.color, T.plinth], [mat.leaf.color, T.leaf], [mat.trunk.color, T.trunk], [mat.win.color, T.win], [mat.win.emissive, T.winGlow],
     [mat.sketch.color, T.sketch], [mat.ghost.color, T.glass], [mat.cloud.color, T.cloud], [mat.lampG.emissive, T.lamp]].forEach(([c, h]) => col(c, h));
    const nums = [[mat.shadow, 'opacity', T.shadow], [hemi, 'intensity', T.hemi], [key, 'intensity', T.key], [scene, 'environmentIntensity', T.env], [starLight, 'intensity', T.starLight]];
    nums.forEach(([o, p, v]) => { if (instant) { gsap.killTweensOf(o, p); o[p] = v; } else gsap.to(o, { [p]:v, duration:.9, ease:'power2.inOut', overwrite:true }); });
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
