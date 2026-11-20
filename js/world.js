// world.js — builds the whole 3D journey: one long floor, one ribbon path, five scenes in a row.
// Everything here is placeholder art made from simple shapes. To use real models later,
// replace the body of a scene function with a GLTFLoader load of that scene's .glb file;
// the camera, path, lighting and scroll logic do not need to change.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

// Scenes are loaded from models/<name>.glb (exported from the Blender files).
// If a model file is missing, the code-built version of that scene is used instead.
export const USE_MODELS = true;

export const SPACING = 14;          // distance between scenes along the path
export const P = { navy:0x182D47, gold:0xBE9D5E, sun:0xF6D54A, coral:0xF0785C, sky:0x7FD8EE, lilac:0xB892E6,
                   ink:0x17142B, cream:0xFBF9F5, floor:0xF1ECE4, wood:0xD9B98C, green:0x6E9A5B };
const RIBBON = [0xF3C62F, 0xF0785C, 0x6FCBE6, 0xB892E6, 0xE2B040];

const up = new THREE.Vector3(0,1,0);
const V = (x,y,z) => new THREE.Vector3(x,y,z);
const hex = n => '#' + n.toString(16).padStart(6,'0');
const M = (color,o={}) => new THREE.MeshStandardMaterial({ color, roughness:.72, metalness:0, ...o });
const sh = m => { m.castShadow = true; m.receiveShadow = true; return m; };

function box(w,h,d,mat,x=0,y=0,z=0,r=.02,seg=3){
  const m = sh(new THREE.Mesh(new RoundedBoxGeometry(w,h,d,seg,Math.min(r,w/2-1e-4,h/2-1e-4,d/2-1e-4)),mat));
  m.position.set(x,y,z); return m;
}
function sph(r,mat,x=0,y=0,z=0,sx=1,sy=1,sz=1){
  const m = sh(new THREE.Mesh(new THREE.SphereGeometry(r,32,22),mat)); m.position.set(x,y,z); m.scale.set(sx,sy,sz); return m;
}
function cyl(rt,rb,h,mat,x=0,y=0,z=0,seg=28){
  const m = sh(new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg),mat)); m.position.set(x,y,z); return m;
}
function limb(a,b,r,mat){
  const d = b.clone().sub(a), len = d.length();
  const m = sh(new THREE.Mesh(new THREE.CapsuleGeometry(r,len,6,16),mat));
  m.position.copy(a).addScaledVector(d,.5); m.quaternion.setFromUnitVectors(up,d.normalize()); return m;
}
function canvasTex(w,h,draw){
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'),w,h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
function decal(w,h,tex,x,y,z,ry=0,rx=0){
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w,h), new THREE.MeshStandardMaterial({ map:tex, transparent:true, roughness:.8 }));
  m.position.set(x,y,z); m.rotation.set(rx,ry,0); m.receiveShadow = true; return m;
}
function textTex(str, color=P.ink, w=512, h=160, size=110){
  return canvasTex(w,h,(x)=>{ x.clearRect(0,0,w,h); x.fillStyle = hex(color); x.font = `400 ${size}px Jost, sans-serif`;
    x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(str, w/2, h/2 + size*.06); });
}

/* ---------- characters ---------- */
function kid(o={}){
  const g = new THREE.Group(), pose = o.pose || 'chair';
  const skin = M(o.skin||0xE8BE9E,{roughness:.6}), hair = M(o.hair||0x2E211C,{roughness:.85}),
        shirt = M(0xF7F9FD,{roughness:.8}), navy = M(P.navy,{roughness:.75}), shoe = M(0x1A1A22,{roughness:.5}), sock = M(0xFFFFFF);
  const hip = pose==='stand' ? .47 : pose==='floor' ? .13 : .30;
  for(const s of [-1,1]){
    if(pose==='chair'){
      g.add(limb(V(s*.075,hip+.03,0),V(s*.075,hip+.03,.22),.058,navy));
      g.add(limb(V(s*.075,hip,.24),V(s*.075,.10,.26),.045,o.girl?sock:navy));
      g.add(box(.09,.06,.15,shoe,s*.075,.035,.29,.028));
    } else if(pose==='floor'){
      g.add(limb(V(s*.075,hip+.03,0),V(s*.1,hip+.02,.24),.058,navy));
      g.add(limb(V(s*.1,hip,.26),V(s*.12,.07,.46),.045,o.girl?sock:navy));
      g.add(box(.09,.13,.07,shoe,s*.12,.075,.5,.028));
    } else {
      g.add(limb(V(s*.075,hip,0),V(s*.075,.3,0),.055,navy));
      g.add(limb(V(s*.075,.28,0),V(s*.075,.1,0),.045,o.girl?sock:navy));
      g.add(box(.09,.06,.15,shoe,s*.075,.035,.03,.028));
    }
  }
  const torso = sh(new THREE.Mesh(new THREE.CapsuleGeometry(.125,.17,8,24),shirt)); torso.position.set(0,hip+.20,0); torso.scale.set(1,1,.86); g.add(torso);
  if(o.girl){
    const pin = cyl(.118,pose==='stand'?.17:.15,pose==='stand'?.26:.2,navy,0,hip+(pose==='stand'?.06:.1),0); pin.scale.set(1,1,.88); g.add(pin);
    for(const s of [-1,1]){ g.add(limb(V(s*.07,hip+.18,.105),V(s*.085,hip+.37,.07),.016,navy)); g.add(limb(V(s*.07,hip+.18,-.105),V(s*.085,hip+.37,-.07),.016,navy)); }
  } else {
    const band = cyl(.128,.13,.1,navy,0,hip+.06,0); band.scale.set(1,1,.88); g.add(band);
    const tie = box(.035,.13,.012,navy,0,hip+.28,.108,.006); tie.rotation.x = -.12; g.add(tie);
  }
  g.add(sph(.014,M(P.gold,{metalness:.6,roughness:.3}),.06,hip+.30,.103,1,1,.4));
  g.add(cyl(.045,.05,.08,skin,0,hip+.42,0));
  const hy = hip+.60; g.add(sph(.17,skin,0,hy,0,1,.96,.96));
  for(const s of [-1,1]) g.add(sph(.032,skin,s*.168,hy-.01,0,.6,1,.9));
  const cap = sh(new THREE.Mesh(new THREE.SphereGeometry(.178,40,20,0,Math.PI*2,0,Math.PI*.52),hair)); cap.position.set(0,hy+.004,-.006); cap.rotation.x = -.34; g.add(cap);
  const back = sh(new THREE.Mesh(new THREE.SphereGeometry(.177,40,20,0,Math.PI*2,0,Math.PI*.72),hair)); back.position.set(0,hy,-.012); back.rotation.x = -1.05; g.add(back);
  if(o.girl){ for(const s of [-1,1]) g.add(sph(.072,hair,s*.135,hy+.16,-.03)); } else g.add(sph(.05,hair,.03,hy+.165,.03,1.3,.6,1));
  const eye = new THREE.MeshStandardMaterial({ color:0x221B26, roughness:.25 });
  for(const s of [-1,1]){
    const e = sph(.017,eye,s*.062,hy-.012,.156,1,1.25,.6); e.castShadow = false; g.add(e);
    const ch = sph(.028,new THREE.MeshStandardMaterial({color:P.coral,transparent:true,opacity:.32,roughness:1}),s*.1,hy-.055,.132,1,.7,.3); ch.castShadow = false; g.add(ch);
  }
  const sm = new THREE.Mesh(new THREE.TorusGeometry(.024,.0045,6,16,Math.PI),eye); sm.position.set(0,hy-.055,.158); sm.rotation.set(-.15,0,Math.PI); g.add(sm);
  const def = pose==='chair' ? [V(-.11,.555,.3),V(.11,.555,.3)] : pose==='floor' ? [V(-.09,hip+.16,.2),V(.09,hip+.16,.2)] : [V(-.2,hip+.02,.03),V(.2,hip+.02,.03)];
  const hands = [o.handL||def[0], o.handR||def[1]];
  [-1,1].forEach((s,i)=>{
    const shd = V(s*.135,hip+.33,0), hd = hands[i], el = shd.clone().lerp(hd,.5).add(V(s*.05,-.05,.02));
    g.add(limb(shd,el,.043,shirt)); g.add(limb(el,hd,.04,shirt)); g.add(sph(.046,skin,hd.x,hd.y,hd.z+.02));
  });
  return g;
}
function chair(col){
  const g = new THREE.Group(), m = M(col,{roughness:.55});
  g.add(box(.34,.04,.34,m,0,.27,0,.02)); g.add(box(.34,.28,.035,m,0,.5,-.16,.02));
  for(const sx of [-1,1]) for(const sz of [-1,1]) g.add(cyl(.016,.016,.27,m,sx*.14,.135,sz*.14,10));
  for(const sx of [-1,1]) g.add(cyl(.016,.016,.3,m,sx*.14,.4,-.16,10));
  return g;
}
function seated(o,x,z,ry=0,chairCol=P.coral){
  const g = new THREE.Group(); const k = kid(o); k.position.z = .04; g.add(k, chair(chairCol)); g.position.set(x,0,z); g.rotation.y = ry; return g;
}
export function mascot(){
  const g = new THREE.Group();
  const prof = [[0,0],[.1,.005],[.17,.04],[.215,.11],[.225,.19],[.2,.28],[.155,.36],[.105,.44],[.062,.52],[.03,.585],[.008,.63],[0,.645]];
  const pts = new THREE.SplineCurve(prof.map(p=>new THREE.Vector2(p[0],p[1]))).getPoints(48);
  const body = sh(new THREE.Mesh(new THREE.LatheGeometry(pts,48), new THREE.MeshStandardMaterial({color:0xF8CF3E,emissive:0xF0A21C,emissiveIntensity:.42,roughness:.38}))); body.position.y = .05; g.add(body);
  const inner = new THREE.Mesh(new THREE.LatheGeometry(pts,32), new THREE.MeshStandardMaterial({color:0xFFF3B8,emissive:0xFFE27A,emissiveIntensity:.9,transparent:true,opacity:.55,roughness:.3,depthWrite:false}));
  inner.scale.set(.52,.5,.52); inner.position.set(0,.07,.115); g.add(inner);
  const eye = new THREE.MeshStandardMaterial({ color:0x221B26, roughness:.2 });
  for(const s of [-1,1]){
    const e = sph(.026,eye,s*.075,.31,.2,1,1.2,.6); e.castShadow = false; g.add(e);
    const ch = sph(.03,new THREE.MeshStandardMaterial({color:P.coral,transparent:true,opacity:.4,roughness:1}),s*.13,.255,.178,1,.7,.3); ch.castShadow = false; g.add(ch);
    g.add(sph(.06,M(P.navy,{roughness:.5}),s*.08,.03,.03,1,.55,1.25));
  }
  const sm = new THREE.Mesh(new THREE.TorusGeometry(.03,.006,6,16,Math.PI),eye); sm.position.set(0,.262,.226); sm.rotation.set(-.05,0,Math.PI); g.add(sm);
  const am = new THREE.MeshStandardMaterial({color:0xF2B530,emissive:0xE89518,emissiveIntensity:.3,roughness:.45});
  const armR = new THREE.Group(); armR.add(limb(V(0,0,0),V(.13,.14,.02),.028,am), sph(.036,am,.14,.155,.02)); armR.position.set(.2,.22,.02); g.add(armR);
  g.add(limb(V(-.2,.2,.02),V(-.3,.12,.06),.028,am), sph(.036,am,-.31,.11,.06));
  g.userData.arm = armR;
  return g;
}

/* ---------- furniture + props ---------- */
function table(w,d,h=.52){
  const g = new THREE.Group(), tm = M(0xFDFCF9,{roughness:.55});
  g.add(box(w,.06,d,tm,0,h,0,.03));
  for(const sx of [-1,1]) for(const sz of [-1,1]) g.add(box(.07,h-.02,.07,tm,sx*(w/2-.1),(h-.02)/2,sz*(d/2-.1),.02));
  return g;
}
function cube(c,l,x,y,z,ry=0,s=.13){
  const g = new THREE.Group(); g.add(box(s,s,s,M(c,{roughness:.5}),0,0,0,s*.14));
  const t = textTex(l,P.ink,128,128,96);
  g.add(decal(s*.8,s*.8,t,0,0,s/2+.001)); g.add(decal(s*.8,s*.8,t,0,s/2+.001,0,0,-Math.PI/2));
  g.position.set(x,y,z); g.rotation.y = ry; return g;
}
function rings(x,y,z){
  const g = new THREE.Group(); g.add(cyl(.012,.012,.2,M(P.wood),0,.1,0,10));
  [[.1,P.sun],[.082,P.coral],[.066,P.sky],[.05,P.lilac]].forEach(([r,c],i)=>{ const t = sh(new THREE.Mesh(new THREE.TorusGeometry(r,.026,12,32),M(c,{roughness:.45}))); t.rotation.x = Math.PI/2; t.position.y = .026+i*.046; g.add(t); });
  g.position.set(x,y,z); return g;
}
function easel(tex){
  const g = new THREE.Group(), wm = M(P.wood,{roughness:.7});
  g.add(limb(V(-.3,0,.18),V(-.12,1.25,-.02),.022,wm), limb(V(.3,0,.18),V(.12,1.25,-.02),.022,wm), limb(V(0,0,-.45),V(0,1.25,-.04),.022,wm));
  const bd = box(.78,.62,.03,M(0xffffff,{roughness:.9}),0,.86,.07,.01); bd.rotation.x = -.13; g.add(bd); g.add(box(.84,.04,.07,wm,0,.54,.14,.01));
  const ad = decal(.74,.58,tex,0,.862,.088); ad.rotation.x = -.13; g.add(ad); return g;
}
function shelf(rows=3, books=1){
  const g = new THREE.Group(), sm = M(0xFBF9F5,{roughness:.6}), SW = 1.5, RH = .433, SH = RH*rows, SD = .42;
  g.add(box(SW,.04,SD,sm,0,SH,0,.015), box(SW,.04,SD,sm,0,.02,0,.015), box(.04,SH,SD,sm,-SW/2+.02,SH/2,0,.015), box(.04,SH,SD,sm,SW/2-.02,SH/2,0,.015), box(.04,SH,SD,sm,0,SH/2,0,.015));
  for(let r=1;r<rows;r++) g.add(box(SW,.035,SD,sm,0,RH*r,0,.012));
  g.add(box(SW,SH,.02,M(0xF1ECE4),0,SH/2,-SD/2+.01,.005));
  const cols = [P.sky,P.coral,P.lilac,P.navy,P.sun,P.coral], bookCols = [P.coral,P.navy,P.sky,P.sun,P.lilac,P.coral,P.navy];
  let n = 0;
  for(let r=0;r<rows;r++) for(const side of [-1,1]){
    const y0 = RH*r+.04, cx = side*.36;
    if(r < books){ // a row of books
      let x = cx-.3; bookCols.forEach((c,i)=>{ const w = .045+((i*7+r*3)%4)*.006, h = .24+((i*5+n)%4)*.03; g.add(box(w,h,.24,M(c,{roughness:.6}),x+w/2,y0+h/2,.02,.008)); x += w+.012; });
    } else g.add(box(.6,.3,.34,M(cols[n%cols.length],{roughness:.55}),cx,y0+.16,.02,.04));
    n++;
  }
  g.userData.top = SH; return g;
}
function plant(x,y,z,s=1){
  const g = new THREE.Group(); g.add(cyl(.1,.075,.15,M(P.coral,{roughness:.6}),0,.075,0));
  for(let i=0;i<7;i++){ const a = i/7*Math.PI*2; g.add(limb(V(0,.14,0),V(Math.cos(a)*.16,.32+((i%2)*.06),Math.sin(a)*.16),.022,M(P.green,{roughness:.8}))); }
  g.position.set(x,y,z); g.scale.setScalar(s); return g;
}
function sign(text,col,x,z,ry){
  const g = new THREE.Group(); g.add(cyl(.03,.03,1.15,M(P.wood),0,.575,0,10));
  g.add(box(.72,.24,.05,M(col,{roughness:.6}),0,1.05,.05,.03)); g.add(decal(.66,.2,textTex(text,P.ink,512,160,92),0,1.05,.077));
  g.position.set(x,0,z); g.rotation.y = ry; return g;
}

/* ---------- the five scenes ---------- */
function sceneNursery(){
  const g = new THREE.Group(), ty = .55;
  g.add(table(2.3,1.05));
  g.add(seated({girl:true,hair:0x2A1E1A,skin:0xE6B998},-.62,-.7), seated({hair:0x3A2A22,skin:0xD9A985},.3,-.7), seated({girl:true,hair:0x4A3326,skin:0xEEC7A8},1.56,.05,-Math.PI/2));
  const paper = canvasTex(512,360,(x,w,h)=>{ x.fillStyle='#fff'; x.fillRect(0,0,w,h); x.lineCap='round'; x.lineWidth=16; x.strokeStyle=hex(P.coral); x.beginPath(); x.moveTo(60,220); x.bezierCurveTo(150,60,220,320,320,160); x.bezierCurveTo(370,90,430,170,460,120); x.stroke(); x.fillStyle=hex(P.sun); x.beginPath(); x.arc(110,90,44,0,7); x.fill(); });
  const pp = decal(.5,.35,paper,-.55,ty+.004,-.05,0,-Math.PI/2); pp.rotation.z = .18; g.add(pp);
  [[P.sky,-.2,.12,.5],[P.lilac,-.12,.2,-.4],[P.coral,-.26,.25,1.2]].forEach(([c,x,z,r])=>g.add(limb(V(x,ty+.015,z),V(x+.13*Math.cos(r),ty+.015,z+.13*Math.sin(r)),.013,M(c,{roughness:.5}))));
  g.add(rings(0,ty,-.12));
  g.add(cube(P.sun,'1',.62,ty+.065,.2,.3), cube(P.sky,'2',.8,ty+.065,.08,-.25), cube(P.coral,'3',.7,ty+.195,.15,.6));
  const car = new THREE.Group(); car.add(box(.2,.06,.1,M(P.coral,{roughness:.4}),0,.045,0,.025), box(.1,.05,.09,M(P.sky,{roughness:.3}),-.01,.095,0,.022));
  for(const sx of [-1,1]) for(const sz of [-1,1]){ const w = cyl(.026,.026,.02,M(P.ink,{roughness:.5}),sx*.06,.026,sz*.055,14); w.rotation.x = Math.PI/2; car.add(w); }
  car.position.set(-.9,ty,.3); car.rotation.y = .5; g.add(car);
  g.add(cube(P.coral,'A',-1.45,.11,.75,.35,.22), cube(P.sky,'B',-1.17,.11,.9,-.2,.22), cube(P.lilac,'C',-1.32,.33,.8,.7,.22), cube(P.sun,'D',1.9,.11,1.0,1.0,.22));
  const art = canvasTex(512,400,(x,w,h)=>{ x.fillStyle='#fff'; x.fillRect(0,0,w,h); x.fillStyle=hex(P.sun); x.beginPath(); x.arc(140,130,70,0,7); x.fill(); x.fillStyle=hex(P.coral); x.beginPath(); x.arc(360,110,30,0,7); x.fill(); x.lineCap='round'; x.lineWidth=30; x.strokeStyle=hex(P.sky); x.beginPath(); x.moveTo(70,300); x.bezierCurveTo(160,210,240,360,330,280); x.bezierCurveTo(380,240,420,300,450,270); x.stroke(); });
  const ez = easel(art); ez.position.set(-2.3,0,-.7); ez.rotation.y = .38; g.add(ez);
  const sf = shelf(3,1); sf.add(plant(.3,sf.userData.top+.02,0), sph(.11,M(P.sky,{roughness:.5}),-.3,sf.userData.top+.13,0)); sf.position.set(2.55,0,-.8); sf.rotation.y = -.35; g.add(sf);
  return g;
}
function sceneKG(){
  const g = new THREE.Group();
  const rug = cyl(1.3,1.3,.02,M(0xCDEFF7,{roughness:1}),-.1,.011,-.2,64); rug.castShadow = false; g.add(rug);
  g.add(sph(.27,M(P.coral,{roughness:.9}),-.7,.09,-.1,1,.36,1), sph(.27,M(P.sun,{roughness:.9}),.5,.09,.05,1,.36,1));
  const a = kid({girl:true,pose:'floor',hair:0x33241D,skin:0xE9C2A2,handL:V(-.11,.45,.26),handR:V(.11,.45,.26)});
  const book = box(.34,.02,.24,M(P.lilac,{roughness:.6}),0,.44,.32,.008); book.rotation.x = -.6; a.add(book);
  a.position.set(-.7,.1,-.1); a.rotation.y = .35; g.add(a);
  const b = kid({pose:'floor',hair:0x2B1F1A,skin:0xD7A682}); b.position.set(.5,.1,.05); b.rotation.y = -.45; g.add(b);
  const slab = (l,c,x,z,ry)=>{ const s = new THREE.Group(); s.add(box(.52,.64,.15,M(c,{roughness:.55}),0,.32,0,.05)); s.add(decal(.44,.5,textTex(l,P.ink,256,256,200),0,.33,.077)); s.position.set(x,0,z); s.rotation.y = ry; return s; };
  g.add(slab('A',P.sun,-1.5,-1.35,.25), slab('b',P.coral,-.15,-1.6,.0), slab('c',P.sky,.75,-1.4,-.2));
  const tent = sh(new THREE.Mesh(new THREE.ConeGeometry(.78,1.45,4), M(P.lilac,{roughness:.9,flatShading:true}))); tent.position.set(-2.45,.725,-1.0); tent.rotation.y = .55; g.add(tent);
  for(let i=0;i<3;i++){ const a2 = i/3*Math.PI*2+.4; g.add(limb(V(-2.45,1.4,-1.0),V(-2.45+Math.cos(a2)*.12,1.66,-1.0+Math.sin(a2)*.12),.012,M(P.wood))); }
  const sf = shelf(2,2); sf.add(plant(-.3,sf.userData.top+.02,0,.9)); sf.position.set(2.2,0,-1.0); sf.rotation.y = -.3; g.add(sf);
  const rt = new THREE.Group(), wm = M(0xFDFCF9,{roughness:.55}); rt.add(cyl(.5,.5,.045,wm,0,.42,0,40), cyl(.05,.07,.4,wm,0,.2,0), cyl(.26,.26,.02,wm,0,.01,0,32));
  rt.add(rings(-.12,.445,.05), cube(P.sun,'1',.18,.51,.12,.3), cube(P.sky,'2',.2,.51,-.14,-.3)); rt.position.set(1.85,0,.6); g.add(rt);
  g.add(sph(.17,M(P.sun,{roughness:.6}),-.1,.17,.62));
  return g;
}
function sceneClass1(){
  const g = new THREE.Group();
  const desk = (x,o)=>{ const d = new THREE.Group(); d.add(table(.98,.56)); d.add(box(.24,.012,.32,M(0xFFFFFF),-.1,.557,.02,.004)); d.add(limb(V(.18,.565,.1),V(.3,.565,-.02),.011,M(P.sun))); d.position.set(x,0,.1); g.add(d); g.add(seated(o,x,-.42)); };
  desk(-1.15,{hair:0x2B1F1A,skin:0xDDB08E}); desk(.08,{girl:true,hair:0x3A2A22,skin:0xECC5A6});
  const wb = new THREE.Group(), fm = M(0xE6DFD3,{roughness:.6});
  wb.add(limb(V(-.8,0,.25),V(-.8,1.95,0),.025,fm), limb(V(.8,0,.25),V(.8,1.95,0),.025,fm), limb(V(-.8,0,-.25),V(-.8,1.0,0),.02,fm), limb(V(.8,0,-.25),V(.8,1.0,0),.02,fm));
  wb.add(box(2.0,1.15,.05,M(0xFFFFFF,{roughness:.4}),0,1.36,.02,.02)); wb.add(box(2.08,.05,.1,fm,0,.77,.05,.015));
  const sum = canvasTex(1024,560,(x,w,h)=>{ x.clearRect(0,0,w,h); x.fillStyle=hex(P.navy); x.font='400 190px Jost, sans-serif'; x.textAlign='center'; x.textBaseline='middle'; x.fillText('2 + 3 = 5',w/2,h/2+10); x.strokeStyle=hex(P.coral); x.lineWidth=12; x.lineCap='round'; x.beginPath(); x.moveTo(250,430); x.quadraticCurveTo(512,470,780,425); x.stroke(); });
  wb.add(decal(1.84,1.0,sum,0,1.36,.047)); wb.position.set(-.45,0,-1.55); wb.rotation.y = .08; g.add(wb);
  const sci = new THREE.Group(); sci.add(table(.95,.6));
  sci.add(cyl(.11,.085,.16,M(P.coral,{roughness:.6}),-.2,.63,0)); sci.add(limb(V(-.2,.7,0),V(-.19,.95,0),.014,M(P.green)));
  sci.add(sph(.07,M(P.green,{roughness:.8}),-.27,.93,0,1,.35,.7), sph(.07,M(P.green,{roughness:.8}),-.12,.98,0,1,.35,.7));
  sci.add(cyl(.09,.09,.16,M(P.sky,{roughness:.4}),.2,.63,.05)); sci.add(limb(V(.27,.63,.05),V(.42,.74,.05),.016,M(P.sky,{roughness:.4})));
  const mg = sh(new THREE.Mesh(new THREE.TorusGeometry(.07,.012,10,28),M(P.gold,{metalness:.7,roughness:.3}))); mg.rotation.x = Math.PI/2; mg.position.set(.02,.565,.2); sci.add(mg); sci.add(limb(V(.08,.565,.25),V(.18,.565,.33),.012,M(P.navy)));
  sci.position.set(2.15,0,-.25); sci.rotation.y = -.3; g.add(sci);
  const ab = new THREE.Group(), wm = M(P.wood,{roughness:.6}); ab.add(box(.06,.66,.1,wm,-.44,.33,0,.02), box(.06,.66,.1,wm,.44,.33,0,.02), box(.98,.05,.16,wm,0,.025,0,.02));
  [P.coral,P.sun,P.sky,P.lilac].forEach((c,r)=>{ const y = .16+r*.13; const rod = cyl(.007,.007,.84,M(0x8C8C96,{metalness:.6,roughness:.4}),0,y,0,8); rod.rotation.z = Math.PI/2; ab.add(rod);
    for(let i=0;i<6;i++){ const off = i<3+(r%2) ? -.36+i*.1 : .36-(5-i)*.1; ab.add(sph(.05,M(c,{roughness:.4}),off,y,0)); } });
  ab.position.set(-2.55,0,-.75); ab.rotation.y = .45; g.add(ab);
  const bag = new THREE.Group(); bag.add(box(.3,.34,.16,M(P.navy,{roughness:.7}),0,.17,0,.06), box(.2,.14,.03,M(P.coral,{roughness:.7}),0,.13,.09,.02), sph(.016,M(P.gold,{metalness:.6,roughness:.3}),0,.26,.085));
  bag.position.set(.85,0,.45); bag.rotation.y = -.4; g.add(bag);
  return g;
}
function sceneClass2(){
  const g = new THREE.Group(), ty = .55;
  g.add(table(2.1,1.0));
  g.add(seated({girl:true,hair:0x2A1E1A,skin:0xE4B795},-.45,-.68), seated({hair:0x4A3326,skin:0xEEC7A8},.55,-.68));
  const globe = new THREE.Group(); globe.add(cyl(.11,.13,.03,M(P.navy),0,.015,0), cyl(.012,.012,.12,M(P.gold,{metalness:.7,roughness:.3}),0,.08,0,8));
  const ball = new THREE.Group(); ball.add(sph(.17,M(0x6FCBE6,{roughness:.45})));
  [[.3,.5,.9],[-.6,.2,.75],[.1,-.5,.85],[-.2,.75,.6],[.8,.1,.55],[-.85,-.3,.4],[.5,-.2,-.82],[-.3,.4,-.86]].forEach(([x,y,z],i)=>{ const v = V(x,y,z).normalize().multiplyScalar(.158); const b = sph(.05+(i%3)*.012,M(0x7FB56A,{roughness:.8}),v.x,v.y,v.z); b.lookAt(0,0,0); b.scale.z = .3; ball.add(b); });
  ball.position.y = .31; ball.rotation.z = .35; globe.add(ball); globe.position.set(.05,ty,-.05); g.add(globe);
  [[P.coral,.36,.05],[P.navy,.32,.045],[P.sun,.3,.04]].reduce((y,[c,w,h])=>{ g.add(box(w,h,.24,M(c,{roughness:.6}),-.8,y+h/2,.12,.01)); return y+h; },ty);
  g.add(cyl(.05,.045,.11,M(P.lilac,{roughness:.5}),.82,ty+.055,.22)); [[P.coral,.02],[P.sky,-.02],[P.sun,0]].forEach(([c,o],i)=>g.add(limb(V(.82+o,ty+.08,.22),V(.82+o*3,ty+.2,.22+(i-1)*.03),.008,M(c))));
  const chart = canvasTex(512,400,(x,w,h)=>{ x.fillStyle='#fff'; x.fillRect(0,0,w,h); [[70,150,P.sun],[170,230,P.coral],[270,190,P.sky],[370,290,P.lilac]].forEach(([bx,bh,c])=>{ x.fillStyle=hex(c); x.fillRect(bx,350-bh,72,bh); }); x.fillStyle=hex(P.navy); x.fillRect(40,350,440,6); });
  const ez = easel(chart); ez.position.set(-2.75,0,-.8); ez.rotation.y = .5; g.add(ez);
  const pres = kid({pose:'stand',hair:0x2B1F1A,skin:0xD9A985,handL:V(-.36,1.0,.1)}); pres.position.set(-1.95,0,-.05); pres.rotation.y = .75; g.add(pres);
  const sf = shelf(3,3); sf.add(plant(.35,sf.userData.top+.02,0)); sf.position.set(2.6,0,-.85); sf.rotation.y = -.35; g.add(sf);
  return g;
}
function sceneBeyond(){
  const g = new THREE.Group(), wht = M(0xFBF9F5,{roughness:.6}), gold = M(P.gold,{metalness:.7,roughness:.35});
  const packs = [P.coral,P.sky,P.lilac];
  [[-.85,.75,false],[0,.95,true],[.85,.7,false]].forEach(([x,z,girl],i)=>{ const k = kid({pose:'stand',girl,hair:[0x2B1F1A,0x33241D,0x4A3326][i],skin:[0xD9A985,0xE9C2A2,0xEEC7A8][i]});
    k.add(box(.22,.26,.11,M(packs[i],{roughness:.7}),0,.68,-.15,.04)); k.position.set(x,0,z); k.rotation.y = Math.PI + (i-1)*-.18; g.add(k); });
  for(let i=0;i<6;i++){ const w = 2.7-i*.12, h = (i+1)*.12, z = -.7-i*.5; g.add(box(w,h,.52,wht,0,h/2,z,.03)); g.add(box(w,.02,.03,gold,0,h+.004,z+.25,.008,1)); }
  g.add(sign('Class 3',P.sun,-1.9,-.55,.3), sign('Class 5',P.coral,1.9,-1.2,-.3), sign('Class 8',P.sky,-2.05,-2.1,.3), sign('Matric',P.lilac,2.05,-2.9,-.3));
  const top = 7*.12, zt = -4.3; g.add(box(3.2,top,1.9,wht,0,top/2,zt,.03));
  for(const s of [-1,1]) g.add(cyl(.15,.15,1.35,wht,s*.95,top+.675,zt));
  const arch = sh(new THREE.Mesh(new THREE.TorusGeometry(.95,.14,14,40,Math.PI),wht)); arch.position.set(0,top+1.35,zt); g.add(arch);
  const sun = new THREE.Mesh(new THREE.CircleGeometry(1.0,48), new THREE.MeshBasicMaterial({color:0xFFE08A,toneMapped:false,fog:false})); sun.position.set(0,top+1.1,zt-1.0); g.add(sun);
  const halo = new THREE.Mesh(new THREE.CircleGeometry(1.6,48), new THREE.MeshBasicMaterial({color:0xFFE9A8,transparent:true,opacity:.35,toneMapped:false,fog:false,depthWrite:false})); halo.position.set(0,top+1.1,zt-1.1); g.add(halo);
  return g;
}

export const SCENES = [['nursery',sceneNursery],['kg',sceneKG],['class1',sceneClass1],['class2',sceneClass2],['beyond',sceneBeyond]];

/* ---------- world ---------- */
export async function createWorld(renderer){
  const scene = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(),.04).texture; scene.environmentIntensity = .45;

  // floor: exact page colour with a dot grid; shadows land on a separate transparent plane
  const L = SPACING*4, cx = L/2;
  // the page's own paper grid shows through: no painted floor, only the shadow-catcher below
  const shp = new THREE.Mesh(new THREE.PlaneGeometry(260,80), new THREE.ShadowMaterial({ opacity:.16, color:0x2A2340 })); shp.rotation.x = -Math.PI/2; shp.position.set(cx,.002,0); shp.receiveShadow = true; scene.add(shp);

  // ribbon path: one curve, colour blends from scene to scene
  const cps = []; for(let i=0;i<=26;i++){ const x = -12+i*3.2; cps.push(V(x,0,1.45+.26*Math.sin(i*1.35))); }
  const curve = new THREE.CatmullRomCurve3(cps);
  const cols = RIBBON.map(c=>new THREE.Color(c)), white = new THREE.Color(0xffffff);
  const colAt = (x,lift=0)=>{ const t = THREE.MathUtils.clamp(x/SPACING,0,cols.length-1), i = Math.min(Math.floor(t),cols.length-2); let f = THREE.MathUtils.clamp((t-i-.3)/.4,0,1); f = f*f*(3-2*f); return cols[i].clone().lerp(cols[i+1],f).lerp(white,lift); };
  const tube = (r,lift,mat)=>{ const geo = new THREE.TubeGeometry(curve,520,r,16); const pos = geo.attributes.position, c = new Float32Array(pos.count*3);
    for(let i=0;i<pos.count;i++){ const k = colAt(pos.getX(i),lift); c[i*3]=k.r; c[i*3+1]=k.g; c[i*3+2]=k.b; } geo.setAttribute('color',new THREE.BufferAttribute(c,3)); const m = new THREE.Mesh(geo,mat); return m; };
  const r1 = tube(.3,0,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.7})); r1.scale.y = .03; r1.position.y = .006; r1.receiveShadow = true; scene.add(r1);
  const r2 = tube(.1,.5,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.7})); r2.scale.y = .03; r2.position.y = .012; r2.receiveShadow = true; scene.add(r2);
  const r3 = tube(.52,.25,new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,opacity:.28,toneMapped:false,depthWrite:false})); r3.scale.y = .01; r3.position.y = .004; scene.add(r3);
  const table0 = curve.getSpacedPoints(600);
  const zAt = x=>{ let lo = 0, hi = table0.length-1; while(hi-lo>1){ const m = (lo+hi)>>1; if(table0[m].x < x) lo = m; else hi = m; } const a = table0[lo], b = table0[hi]; return a.z + (b.z-a.z)*((x-a.x)/((b.x-a.x)||1)); };

  // scenes
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder), sources = {};
  await Promise.all(SCENES.map(async ([name,fn],i)=>{
    let g = null;
    if(USE_MODELS){
      try {
        g = (await loader.loadAsync(`models/${name}.glb`)).scene;
        g.traverse(o=>{ if(o.isMesh){ const flat = o.material.transparent || o.material.isMeshBasicMaterial; o.castShadow = !flat; o.receiveShadow = !o.material.isMeshBasicMaterial; if(o.material.isMeshBasicMaterial){ o.material.toneMapped = false; o.material.fog = false; } if(o.material.map) o.material.map.anisotropy = 8; } });
        sources[name] = 'model';
      } catch(e){ g = null; }
    }
    if(!g){ g = fn(); sources[name] = 'code'; }
    g.name = name; g.position.x = i*SPACING; scene.add(g);
  }));
  const archGlow = new THREE.PointLight(0xFFD27A,10,9,1.6); archGlow.position.set(4*SPACING,.84+1.2,-3.4); scene.add(archGlow);

  // mascot guide
  const ms = mascot(); ms.scale.setScalar(1.1); scene.add(ms);
  const glow = new THREE.PointLight(0xFFC74A,2.2,3.2,1.6); scene.add(glow);

  // lights (the shadow light follows the camera so one shadow map covers whatever is on screen)
  scene.add(new THREE.HemisphereLight(0xffffff,0xEADFCF,1.0));
  const key = new THREE.DirectionalLight(0xFFF4E4,2.3); key.castShadow = true;
  const sc = key.shadow.camera; sc.left = -8; sc.right = 8; sc.top = 8; sc.bottom = -8; sc.near = .5; sc.far = 40;
  key.shadow.mapSize.set(1024,1024); key.shadow.radius = 5; key.shadow.bias = -.0003; key.shadow.normalBias = .02; scene.add(key,key.target);
  const fill = new THREE.DirectionalLight(0xE6EEFF,.55); fill.position.set(6,4,6); scene.add(fill);

  const camera = new THREE.PerspectiveCamera(27,1.6,.1,120);
  const wide = { fov:27, y:3.0, z:8.0, ly:1.08, mx:-2.1 }, tall = { fov:40, y:4.0, z:13.0, ly:2.25, mx:-1.5 };
  let cur = { ...wide };
  function resize(w,h){
    const a = w/h, t = THREE.MathUtils.clamp((1.45-a)/(1.45-.5),0,1);
    for(const k in wide) cur[k] = wide[k] + (tall[k]-wide[k])*t;
    camera.aspect = a; camera.fov = cur.fov; camera.updateProjectionMatrix();
  }
  function update(camX,time){
    camera.position.set(camX+.45,cur.y,cur.z); camera.lookAt(camX+.12,cur.ly,0);
    key.position.set(camX-5,8,6); key.target.position.set(camX,0,0); fill.position.set(camX+6,4,6);
    const mx = camX + cur.mx, hop = Math.abs(Math.sin(mx*2.6)), idle = Math.sin(time*2.2)*.012;
    ms.position.set(mx, hop*.13 + idle + .0, zAt(mx)-.12); ms.rotation.y = .55; ms.rotation.z = Math.sin(mx*2.6)*.07;
    ms.userData.arm.rotation.z = Math.sin(time*5)*.35;
    glow.position.set(mx+.05,.42,ms.position.z+.45);
  }
  return { scene, camera, resize, update, count:5, sources };
}
