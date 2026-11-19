// main.js — wires scroll to the 3D world and swaps the text for each class.
import * as THREE from 'three';
import { createWorld, SPACING } from './world.js';

/* ---- content: edit class names and wording here ---- */
const CLASSES = [
  { label:'Class 1 of 4', title:'Nursery',  text:'Play, songs, stories and first friends. A gentle start where little ones learn by doing.', btn:'Explore more' },
  { label:'Class 2 of 4', title:'KG',       text:'Letters, sounds and numbers come alive through picture books, rhymes and plenty of hands-on play.', btn:'Explore more' },
  { label:'Class 3 of 4', title:'Class 1',  text:'First real reading and writing, number work, and small experiments that turn "why?" into "let me try".', btn:'Explore more' },
  { label:'Class 4 of 4', title:'Class 2',  text:'Confident readers start working in teams, presenting ideas and exploring the wider world.', btn:'Explore more' },
  { label:'What comes next', title:'Beyond Junior', text:'Clarus grows with its children, with classes planned all the way to Matric.', btn:'See the main school' },
];
const HOLD = .22;   // share of each step where the camera rests on a scene before and after moving

const { gsap, ScrollTrigger, SplitText, Lenis } = window;
gsap.registerPlugin(ScrollTrigger, SplitText);
const params = new URLSearchParams(location.search);
const CAPTURE = params.has('capture');                       // used only for recording the walkthrough
const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = id => document.getElementById(id);
const el = { stage:document.querySelector('.stage'), copy:$('copy'), label:$('c-label'), title:$('c-title'), desc:$('c-desc'), btn:$('c-btn'), dots:$('dots'), cue:$('cue') };

/* dots */
CLASSES.forEach((_,i)=>{ const d = document.createElement('i'); if(!i) d.className = 'on'; el.dots.appendChild(d); });

/* text swap. The first class is already in the HTML, so nothing blinks on load. */
let shown = 0, split = null;
function setScene(k){
  if(k === shown) return; shown = k;
  const c = CLASSES[k];
  if(split){ split.revert(); split = null; }
  gsap.killTweensOf([el.desc, el.btn]);
  el.label.textContent = c.label; el.title.textContent = c.title; el.desc.textContent = c.text; (window.setBtnLabel || ((b,t)=>b.textContent=t))(el.btn, c.btn);
  [...el.dots.children].forEach((d,i)=>d.classList.toggle('on', i===k));
  if(REDUCE) return;
  split = new SplitText(el.title, { type:'chars' });
  gsap.set(split.chars, { opacity:0 });
  gsap.to(split.chars, { opacity:1, duration:.01, stagger:.055, delay:.05 });
  gsap.fromTo([el.desc, el.btn], { opacity:0, y:12 }, { opacity:1, y:0, duration:.6, ease:'power3.out', stagger:.08, delay:.3 });
}

/* 3D */
await document.fonts.load('400 96px Jost'); await document.fonts.ready;
const canvas = $('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true, powerPreference:'high-performance' });
renderer.setClearColor(0x000000,0);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.NeutralToneMapping;
const world = await createWorld(renderer);
window.__sources = world.sources;
const N = world.count;
function resize(){
  const w = el.stage.clientWidth, h = el.stage.clientHeight;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, w < 820 ? 1.5 : 2));
  renderer.setSize(w,h,false); world.resize(w,h); dirty = true;
}
let dirty = true, progress = 0, visible = true;
addEventListener('resize', resize); resize();

const smoother = x => x*x*x*(x*(x*6-15)+10);
function frame(time){
  const t = progress*(N-1), i = Math.min(Math.floor(t), N-2), f = t-i;
  const fe = smoother(Math.min(1, Math.max(0, (f-HOLD)/(1-2*HOLD))));
  world.update((i+fe)*SPACING, time);
  renderer.render(world.scene, world.camera);
  // text: belongs to the nearest scene, fades while the camera travels
  const active = f < .5 ? i : i+1, dist = Math.abs(t-active);
  const o = 1 - Math.min(1, Math.max(0, (dist-.2)/.2));
  el.copy.style.opacity = o.toFixed(3);
  if(dist < .4) setScene(active);
  el.cue.style.opacity = Math.max(0, 1 - progress*30).toFixed(2);
}

/* scroll */
ScrollTrigger.create({ trigger:'#journey', start:'top top', end:'bottom bottom', onUpdate:self=>{ progress = self.progress; } });
new IntersectionObserver(es=>{ visible = es[0].isIntersecting; }).observe(document.getElementById('journey'));


/* statement types in once, when it scrolls into view (its space is already reserved) */
if(!REDUCE){
  const st = new SplitText('#statement', { type:'chars,words' });
  gsap.set(st.chars, { opacity:0 });
  ScrollTrigger.create({ trigger:'#statement', start:'top 80%', once:true, onEnter:()=>gsap.to(st.chars,{ opacity:1, duration:.01, stagger:.022 }) });
}

if(CAPTURE){
  // deterministic stepping for the recorder: no smooth scroll, time is advanced by hand
  gsap.ticker.remove(gsap.updateRoot);
  window.__cap = (y, time) => { window.scrollTo(0, y); ScrollTrigger.update(); gsap.updateRoot(time); frame(time); return progress; };
  window.__ready = true;
} else {
  if(!REDUCE && Lenis){
    const lenis = new Lenis({ lerp:.09 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t*1000));
    gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{ const t = document.querySelector(a.getAttribute('href')); if(t){ e.preventDefault(); lenis.scrollTo(t); } }));
  }
  gsap.ticker.add(time => { if(visible) frame(time); });
  window.__ready = true;
}
