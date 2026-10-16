/* מטוטלת מגע · עותק של pendulum/ שבו האפקטים נשלטים במגע: משטח XY (חלום/רעד), מחוונים ל־CUTOFF/RESONANCE/DRIVE, חיתוך, ונעילה או קפיץ. ההטיה רשות. */
(()=>{
"use strict";
const E=window.PendulumEngine;
const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const fin=(v,d)=>(typeof v==="number"&&isFinite(v))?v:d;
const NPADS=8;

/* ================= הדף לא זז ================= */
["gesturestart","gesturechange","gestureend"].forEach(t=>document.addEventListener(t,e=>e.preventDefault(),{passive:false}));
document.addEventListener("dblclick",e=>e.preventDefault(),{passive:false});
document.addEventListener("touchmove",e=>{ if(e.touches.length>1||!(e.target.closest&&e.target.closest(".scroll-y"))) e.preventDefault() },{passive:false});
window.addEventListener("scroll",()=>{ if(scrollX||scrollY) scrollTo(0,0) },{passive:true});
document.addEventListener("contextmenu",e=>{ if(!(e.target.closest&&e.target.closest("input,textarea,select"))) e.preventDefault() });

/* ================= הודעות ================= */
let toastT=0;
function toast(msg,label,fn){
  const t=$("#toast"); t.replaceChildren();
  const sp=document.createElement("span"); sp.textContent=msg; t.appendChild(sp);
  if(label){ const b=document.createElement("button"); b.type="button"; b.className="tact"; b.textContent=label; b.addEventListener("click",()=>{ t.hidden=true; clearTimeout(toastT); try{fn()}catch(e){} }); t.appendChild(b) }
  t.hidden=false; clearTimeout(toastT); toastT=setTimeout(()=>{ t.hidden=true },label?5000:3000);
}

/* ================= סולמות ומצב ================= */
const SCALES={
  minpent:{name:"מינור פנטטוני",steps:[0,3,5,7,10]},
  majpent:{name:"מז'ור פנטטוני",steps:[0,2,4,7,9]},
  blues:{name:"בלוז",steps:[0,3,5,6,7,10]},
  dorian:{name:"דוריאן",steps:[0,2,3,5,7,9,10]},
  phrygian:{name:"פריגי",steps:[0,1,3,5,7,8,10]},
  harm:{name:"מינור הרמוני",steps:[0,2,3,5,7,8,11]}
};
const NOTES=["C","C♯","D","E♭","E","F","F♯","G","A♭","A","B♭","B"];
const DIVS=[{v:.5,name:"שמינית"},{v:.75,name:"שמינית מנוקדת"},{v:1,name:"רבע"},{v:1/3,name:"טריולה"}];
const DIRS=[{v:"up",name:"עולה"},{v:"down",name:"יורד"},{v:"updown",name:"עולה ויורד"},{v:"rnd",name:"אקראי"}];
const SPANS=[{v:1,name:"אוקטבה אחת"},{v:2,name:"שתי אוקטבות"}];
const RATES={"8":.5,"16":.25,"16t":1/6}; // חלק מפעמה
function defaults(){ return {root:9,scale:"minpent",oct:3,bpm:124,div:.75,mode:"note",rate:"16",dir:"up",span:1,filter:.62,dream:.15,wobble:.1,tilt:false,vol:.8,res:.42,drive:.3,fxLatch:true} }
function sanitize(o){
  const d=defaults(); if(!o||typeof o!=="object") return d;
  const pick=(v,list,df)=>list.some(x=>x.v===v)?v:df;
  return {root:clamp(Math.round(fin(o.root,d.root)),0,11),scale:SCALES[o.scale]?o.scale:d.scale,oct:clamp(Math.round(fin(o.oct,d.oct)),1,5),
    bpm:clamp(fin(o.bpm,d.bpm),40,300),div:pick(o.div,DIVS,d.div),mode:o.mode==="chord"?"chord":"note",rate:(o.rate in RATES||o.rate==="long")?o.rate:d.rate,
    dir:pick(o.dir,DIRS,d.dir),span:pick(o.span,SPANS,d.span),filter:clamp(fin(o.filter,d.filter),0,1),dream:clamp(fin(o.dream,d.dream),0,1),wobble:clamp(fin(o.wobble,d.wobble),0,1),
    tilt:o.tilt===true,vol:clamp(fin(o.vol,d.vol),0,1),res:clamp(fin(o.res,d.res),0,1),drive:clamp(fin(o.drive,d.drive),0,1),fxLatch:o.fxLatch!==false};
}
const KEY="pendulum-touch-v1";
let S; try{ S=sanitize(JSON.parse(localStorage.getItem(KEY))) }catch(e){ S=defaults() }
let saveT=0; function save(){ clearTimeout(saveT); saveT=setTimeout(()=>{ try{ localStorage.setItem(KEY,JSON.stringify(S)) }catch(e){} },300) }
const cutHz=v=>120*Math.pow(2,v*6.6);
function applySound(){ E.setVolume(cutting?0:S.vol); E.setRes(S.res*1.05); E.setDrive(.5+S.drive*S.drive*6); E.setTempo(bpm,S.div); E.setDream(S.tilt?dream:S.dream); E.setWobble(S.tilt?wob:S.wobble) }

/* ================= תווים ואקורדים ================= */
const steps=()=>SCALES[S.scale].steps;
const midiOf=deg=>{ const st=steps(), n=st.length; return 12*(S.oct+1)+S.root+st[((deg%n)+n)%n]+12*Math.floor(deg/n) };
const freqOf=m=>440*Math.pow(2,(m-69)/12);
const nameOf=m=>NOTES[((m%12)+12)%12];
function chordDegs(d){ return [d,d+2,d+4] } // שלישים בתוך הסולם
function chordName(d){
  const m=chordDegs(d).map(midiOf), a=(m[1]-m[0]+12)%12, b=(m[2]-m[0]+12)%12, r=nameOf(m[0]);
  if(a===4&&b===7) return r; if(a===3&&b===7) return r+"m"; if(a===3&&b===6) return r+"°"; if(a===4&&b===8) return r+"+";
  if(a===5) return r+"sus4"; if(a===2) return r+"sus2"; return r+"?";
}
// רשימת התווים של כפתור (midi), לפי המצב
function padNotes(p){ return (S.mode==="chord"?chordDegs(p):[p]).map(midiOf) }
const hueOf=p=>(205+(p%steps().length)*(300/steps().length))%360;

/* ================= כפתורים ================= */
const padsEl=$("#pads"), pads=[];
for(let p=0;p<NPADS;p++){ const b=document.createElement("button"); b.type="button"; b.className="pad"; b.dataset.p=p;
  b.innerHTML='<span class="big"></span><span class="sm"></span>'; padsEl.appendChild(b); pads.push(b) }
function padsUI(){ pads.forEach((b,p)=>{ b.style.setProperty("--h",hueOf(p)); const m=midiOf(p);
  if(S.mode==="chord"){ b.querySelector(".big").textContent=chordName(p); b.querySelector(".sm").textContent=["I","II","III","IV","V","VI","VII","VIII"][p]||"" }
  else { b.querySelector(".big").textContent=nameOf(m); b.querySelector(".sm").textContent=Math.floor(m/12)-1 }
  b.classList.toggle("held",held.has(p)||latched.has(p)) }) }

const held=new Set(), latched=new Set(); // אצבעות על כפתורים, וכפתורים ב"החזק"
let latch=false;
const active=()=>latch?new Set([...latched,...held]):held;
const ptr=new Map(); // pointerId → pad
function padDown(p){
  E.start(); E.touched(); if(!E.running()){ ensureAudio(); return }
  if(latch){ if(latched.has(p)) latched.delete(p); else latched.add(p); } held.add(p);
  if(S.rate==="long"){ if(latch&&!latched.has(p)) longOff(p); else longOn(p) } else if(!running) startSeq();
  padsUI();
}
function padUp(p){ held.delete(p); if(S.rate==="long"&&!(latch&&latched.has(p))) longOff(p); padsUI() }
pads.forEach((b,p)=>{
  b.addEventListener("pointerdown",e=>{ if(e.pointerType==="mouse"&&e.button!==0) return; e.preventDefault(); try{ b.setPointerCapture(e.pointerId) }catch(err){} ptr.set(e.pointerId,p); padDown(p) });
  const up=e=>{ if(!ptr.has(e.pointerId)) return; ptr.delete(e.pointerId); padUp(p) };
  ["pointerup","pointercancel","lostpointercapture"].forEach(n=>b.addEventListener(n,up));
});
window.addEventListener("blur",()=>{ ptr.clear(); [...held].forEach(p=>padUp(p)) });
// "ארוך": צליל מוחזק, בלי ארפג׳יו
function longOn(p){ padNotes(p).forEach((m,k)=>E.noteOn(`L${p}-${k}`,freqOf(m),.85,cutHz(S.filter))) }
function longOff(p){ padNotes(p).forEach((m,k)=>E.noteOff(`L${p}-${k}`,.3)) }

/* ================= שעון: משלנו או של כלי אחר ================= */
let bpm=S.bpm, barEpoch=0, following=false;
const T0=()=>performance.timeOrigin||(Date.now()-performance.now());
const epochOf=ct=>T0()+(ct+E.perfOffset())*1000;
const ctxOf=ep=>(ep-T0())/1000-E.perfOffset();
const beat=()=>60/bpm;
function setBpm(v,fromSync){ const b=clamp(Math.round(fin(v,bpm)*10)/10,40,300); if(b===bpm) return; bpm=b; S.bpm=b; $("#bpmVal").textContent=Math.round(b); E.setTempo(bpm,S.div); save(); if(!fromSync&&clock.enabled()) clock.tempo(bpm) }
const clock=window.MusicLessonsClock.create({app:"pendulum-touch",on:{
  hello:()=>{ clock.state(false,bpm,0) },
  state:m=>{ if(m.bpm) setBpm(m.bpm,true); if(m.playing&&m.at) follow(m.at) },
  tempo:m=>{ if(m.bpm) setBpm(m.bpm,true) },
  start:m=>{ if(m.bpm) setBpm(m.bpm,true); if(m.at) follow(m.at) },
  bar:m=>{ if(m.bpm) setBpm(m.bpm,true); if(m.at) follow(m.at) },
  stop:()=>{ following=false; syncUI() }
}});
function follow(at){ barEpoch=at; following=true; syncUI() }
function syncUI(){ const b=$("#sync"), on=clock.enabled(); b.classList.toggle("on",on); b.classList.toggle("follow",on&&following); b.setAttribute("aria-pressed",on); $("#bpmVal").classList.toggle("follow",on&&following) }
$("#sync").addEventListener("click",()=>{
  if(!clock.available()){ toast("הדפדפן הזה לא תומך בסנכרון בין חלונות"); return }
  const on=clock.setEnabled(!clock.enabled()); try{ localStorage.setItem("pendulum-touch-sync",on?"1":"0") }catch(e){}
  if(!on) following=false; syncUI(); toast(on?"סנכרון פעיל: הקצב והפעמה מגיעים מהכלי שמנגן":"סנכרון כבוי");
});
try{ if(localStorage.getItem("pendulum-touch-sync")==="1") clock.setEnabled(true) }catch(e){}
function repeat(el,fn){ let tm=0; const stop=()=>clearTimeout(tm);
  el.addEventListener("pointerdown",e=>{ e.preventDefault(); fn(); clearTimeout(tm); tm=setTimeout(function r(){ fn(); tm=setTimeout(r,70) },380) });
  ["pointerup","pointercancel","pointerleave"].forEach(n=>el.addEventListener(n,stop)) }
repeat($("#bpmDown"),()=>setBpm(Math.round(bpm)-1)); repeat($("#bpmUp"),()=>setBpm(Math.round(bpm)+1));

/* ================= הארפג׳יו: נעול לרשת של השעון ================= */
let running=false, timer=0, lastIdx=-1, lastT0=NaN, arpPos=0, hitSeq=0;
const visQ=[];
function t0(){ if(!barEpoch) barEpoch=epochOf(E.now()); return ctxOf(barEpoch) }
function startSeq(){ if(running) return; running=true; lastIdx=-1; lastT0=NaN; arpPos=0; clearInterval(timer); timer=setInterval(tick,25); tick() }
function stopSeq(){ running=false; clearInterval(timer); visQ.length=0 }
function pool(){ // כל התווים שמנגנים עכשיו, ממוינים
  const set=new Set(); for(const p of active()) for(const m of padNotes(p)) for(let o=0;o<S.span;o++) set.add(m+12*o);
  return [...set].sort((a,b)=>a-b);
}
function pickNote(list,i){
  const n=list.length; if(n===1) return list[0];
  if(S.dir==="up") return list[i%n]; if(S.dir==="down") return list[n-1-i%n];
  if(S.dir==="updown"){ const c=2*n-2, k=i%c; return list[k<n?k:c-k] }
  const x=Math.sin(i*127.1+n*311.7)*43758.5453; return list[Math.floor((x-Math.floor(x))*n)];
}
function tick(){
  if(!running||!E.running()) return;
  if(S.rate==="long") return;
  const rd=beat()*RATES[S.rate], base=t0(), now=E.now(), la=document.hidden?1.2:.12;
  if(Math.abs(base-lastT0)>.002){ lastT0=base; lastIdx=Math.floor((now-base)/rd) } // השעון זז (סנכרון): מתחילים מהרשת החדשה
  const upto=Math.floor((now+la-base)/rd);
  for(let i=lastIdx+1;i<=upto;i++){ const t=base+i*rd; if(t<now+.004) continue; fire(t,i,rd,base) }
  lastIdx=upto;
  if(!active().size) stopSeq();
}
function fire(t,i,rd,base){
  const list=pool(); if(!list.length) return;
  const m=pickNote(list,arpPos++), ph=((t-base)/beat())%1, onBeat=ph<.01||ph>.99;
  const id="a"+(hitSeq++), gate=Math.max(.05,rd*.58);
  E.noteOn(id,freqOf(m),onBeat?.95:.78,cutHz(S.filter),t); E.noteOff(id,.12,t+gate);
  if(!document.hidden){ visQ.push({t,m}); if(visQ.length>60) visQ.splice(0,30) }
}

/* ================= מצב, קצב, החזק, אוקטבה ================= */
function modeUI(){ $$(".seg-b[data-mode]").forEach(b=>b.classList.toggle("on",b.dataset.mode===S.mode)); $$(".seg-b[data-rate]").forEach(b=>b.classList.toggle("on",b.dataset.rate===S.rate));
  $("#hold").classList.toggle("on",latch); $("#hold").setAttribute("aria-pressed",latch); $("#octVal").textContent="אוק׳ "+S.oct; padsUI() }
// שינוי שמשנה את התווים של כפתור מוחזק במצב "ארוך": מכבים לפני ומדליקים אחרי
function relong(fn){ const was=S.rate==="long"?[...active()]:[]; was.forEach(longOff); fn(); was.forEach(longOn) }
$$(".seg-b[data-mode]").forEach(b=>b.addEventListener("click",()=>{ if(S.mode===b.dataset.mode) return; relong(()=>{ S.mode=b.dataset.mode }); modeUI(); save() }));
$$(".seg-b[data-rate]").forEach(b=>b.addEventListener("click",()=>{ const r=b.dataset.rate; if(S.rate===r) return;
  if(S.rate==="long") [...active()].forEach(longOff); S.rate=r;
  if(r==="long"){ stopSeq(); [...active()].forEach(longOn) } else if(active().size) startSeq();
  modeUI(); save() }));
$("#hold").addEventListener("click",()=>{
  latch=!latch;
  if(latch){ held.forEach(p=>latched.add(p)) } else { const was=[...latched]; latched.clear(); if(S.rate==="long") was.forEach(p=>{ if(!held.has(p)) longOff(p) }) }
  modeUI();
});
function octChange(d){ relong(()=>{ S.oct=clamp(S.oct+d,1,5) }); modeUI(); save() }
$("#octDown").addEventListener("click",()=>octChange(-1)); $("#octUp").addEventListener("click",()=>octChange(1));
document.addEventListener("keydown",e=>{ if(e.target.closest&&e.target.closest("input,select")) return;
  if(e.key==="Escape"){ moreOpen(false); closeTakes(); return }
  if(e.code==="Space"){ e.preventDefault(); $("#hold").click(); return }
  const k="12345678".indexOf(e.key); if(k>=0&&!e.repeat&&!held.has(k)){ e.preventDefault(); padDown(k) } });
document.addEventListener("keyup",e=>{ const k="12345678".indexOf(e.key); if(k>=0&&held.has(k)) padUp(k) });

/* ================= מחוונים אנכיים ================= */
function fader(el,o){
  const sl=el.querySelector(".sld"); let pid=null;
  const valAt=y=>{ const r=sl.getBoundingClientRect(); return clamp((r.bottom-y)/r.height,0,1) };
  const paint=()=>{ const v=o.get(); sl.style.setProperty("--v",v); sl.setAttribute("aria-valuenow",Math.round(v*100)) };
  sl.addEventListener("pointerdown",e=>{ if(e.pointerType==="mouse"&&e.button!==0) return; e.preventDefault(); pid=e.pointerId; try{ sl.setPointerCapture(pid) }catch(err){} sl.classList.add("drag"); o.set(valAt(e.clientY)); paint() });
  sl.addEventListener("pointermove",e=>{ if(e.pointerId!==pid) return; e.preventDefault(); o.set(valAt(e.clientY)); paint() });
  const end=e=>{ if(e.pointerId!==pid) return; pid=null; sl.classList.remove("drag"); if(o.done) o.done() };
  ["pointerup","pointercancel","lostpointercapture"].forEach(n=>sl.addEventListener(n,end));
  sl.addEventListener("keydown",e=>{ const d={ArrowUp:.03,ArrowRight:.03,ArrowDown:-.03,ArrowLeft:-.03}[e.key]; if(d){ e.preventDefault(); o.set(clamp(o.get()+d,0,1)); paint(); if(o.done) o.done() } });
  sl.setAttribute("aria-valuemin","0"); sl.setAttribute("aria-valuemax","100"); paint(); return {paint};
}
const faders={
  filter:fader($('.fader[data-key="filter"]'),{get:()=>S.filter,set:v=>{ S.filter=v; E.setCut(cutHz(v)) },done:save}),
  res:fader($('.fader[data-key="res"]'),{get:()=>S.res,set:v=>{ S.res=v; E.setRes(v*1.05) },done:save}),
  drive:fader($('.fader[data-key="drive"]'),{get:()=>S.drive,set:v=>{ S.drive=v; E.setDrive(.5+v*v*6) },done:save})
};
/* ---- משטח אפקטים XY: למעלה = חלום (דיליי, פייזר, ריוורב), הצידה = רעד (טרמולו, ויברטו, דיטיון) ----
   כל אצבע נתפסת לבד (pointerId), כך שאפשר לנגן ביד אחת ולשלוט ביד השנייה. עדכון למנוע פעם אחת בפריים. */
const xyEl=$("#xy"), xyDot=$("#xyDot"); let xyPid=null, xyRaf=0, cutting=false;
const fxNow=()=>S.tilt?{x:wob,y:dream}:{x:S.wobble,y:S.dream};
function xyPaint(){ const v=fxNow(); xyDot.style.left=(v.x*100)+"%"; xyDot.style.top=((1-v.y)*100)+"%"; xyEl.style.setProperty("--x",v.x); xyEl.style.setProperty("--y",v.y) }
function xyPush(){ if(xyRaf) return; xyRaf=requestAnimationFrame(()=>{ xyRaf=0; if(!S.tilt){ E.setDream(S.dream); E.setWobble(S.wobble) } xyPaint() }) }
function xyAt(e){ const r=xyEl.getBoundingClientRect(); S.wobble=clamp((e.clientX-r.left)/r.width,0,1); S.dream=clamp((r.bottom-e.clientY)/r.height,0,1); xyPush() }
xyEl.addEventListener("pointerdown",e=>{ if(e.pointerType==="mouse"&&e.button!==0) return; e.preventDefault(); if(S.tilt){ toast("ההטיה פעילה. אפשר לכבות אותה תחת ⋯ עוד"); return }
  xyPid=e.pointerId; try{ xyEl.setPointerCapture(xyPid) }catch(err){} xyEl.classList.add("drag"); xyAt(e) });
xyEl.addEventListener("pointermove",e=>{ if(e.pointerId!==xyPid) return; e.preventDefault(); xyAt(e) });
const xyEnd=e=>{ if(e.pointerId!==xyPid) return; xyPid=null; xyEl.classList.remove("drag"); if(!S.fxLatch){ S.dream=0; S.wobble=0; xyPush() } save() };
["pointerup","pointercancel","lostpointercapture"].forEach(n=>xyEl.addEventListener(n,xyEnd));
xyEl.addEventListener("keydown",e=>{ const d={ArrowUp:[0,.05],ArrowDown:[0,-.05],ArrowRight:[.05,0],ArrowLeft:[-.05,0]}[e.key]; if(!d||S.tilt) return; e.preventDefault(); S.wobble=clamp(S.wobble+d[0],0,1); S.dream=clamp(S.dream+d[1],0,1); xyPush(); save() });
/* קפיץ: האפקטים חוזרים לאפס, והפילטר חוזר למקום שבו היה לפני הנגיעה */
let filterHome=null;
(()=>{ const sl=$('.fader[data-key="filter"] .sld');
  $('.fader[data-key="filter"]').addEventListener("pointerdown",()=>{ if(!S.fxLatch&&filterHome===null) filterHome=S.filter },true);
  ["pointerup","pointercancel"].forEach(n=>sl.addEventListener(n,()=>{ if(filterHome!==null){ const h=filterHome; filterHome=null; if(!S.fxLatch){ S.filter=h; E.setCut(cutHz(h)); faders.filter.paint(); save() } } })) })();
function latchUI(){ const b=$("#latchBtn"); b.setAttribute("aria-pressed",S.fxLatch); b.classList.toggle("spring",!S.fxLatch);
  $("#latchHe").textContent=S.fxLatch?"נשאר במקום":"קופץ חזרה"; $("#latchEn").textContent=S.fxLatch?"LATCH":"SPRING" }
$("#latchBtn").addEventListener("click",()=>{ S.fxLatch=!S.fxLatch; if(!S.fxLatch&&xyPid===null&&!S.tilt){ S.dream=0; S.wobble=0; xyPush() } latchUI(); save(); toast(S.fxLatch?"האפקטים נשארים איפה שעזבת":"כשעוזבים, האפקטים חוזרים לאפס") });
/* חיתוך: כל עוד מחזיקים, הצליל נעלם (מה שעשה הניעור) */
(()=>{ const b=$("#cutBtn"); let pid=null;
  b.addEventListener("pointerdown",e=>{ e.preventDefault(); pid=e.pointerId; try{ b.setPointerCapture(pid) }catch(err){} cutting=true; b.classList.add("on"); E.setVolume(0) });
  const up=e=>{ if(e.pointerId!==pid) return; pid=null; cutting=false; b.classList.remove("on"); E.setVolume(S.vol) };
  ["pointerup","pointercancel","lostpointercapture"].forEach(n=>b.addEventListener(n,up)) })();

/* ================= עוד ================= */
const moreOpen=on=>{ $("#more").hidden=!on; $("#moreBtn").classList.toggle("on",on) };
$("#moreBtn").addEventListener("click",()=>moreOpen($("#more").hidden)); $("#moreClose").addEventListener("click",()=>moreOpen(false));
$("#more").addEventListener("click",e=>{ if(e.target.id==="more") moreOpen(false) });
function optGroup(box,list,set){ list.forEach(o=>{ const b=document.createElement("button"); b.type="button"; b.className="btn opt"; b.textContent=o.name; b.dataset.v=String(o.v); b.addEventListener("click",()=>{ set(o.v); optUI(); save() }); $(box).appendChild(b) }) }
optGroup("#scales",Object.keys(SCALES).map(k=>({v:k,name:SCALES[k].name})),v=>relong(()=>{ S.scale=v }));
optGroup("#dirs",DIRS,v=>{ S.dir=v });
optGroup("#spans",SPANS,v=>{ S.span=v });
optGroup("#divs",DIVS,v=>{ S.div=v; E.setTempo(bpm,S.div) });
const rootSel=$("#root"); NOTES.forEach((n,i)=>{ const o=document.createElement("option"); o.value=i; o.textContent=n; rootSel.appendChild(o) });
rootSel.addEventListener("change",()=>{ relong(()=>{ S.root=+rootSel.value }); padsUI(); save() });
function range(id,get,set){ const el=$(id); el.addEventListener("input",()=>set(el.value/100)); el.addEventListener("change",save); return ()=>{ el.value=Math.round(get()*100) } }
const ranges=[ range("#r_vol",()=>S.vol,v=>{ S.vol=v; if(!cutting) E.setVolume(v) }) ];
$("#tiltOn").addEventListener("change",async e=>{ S.tilt=e.target.checked; if(S.tilt){ const ok=await askMotion(); if(!ok){ S.tilt=false; toast("אין גישה לחיישני התנועה") } } applySound(); optUI(); save() });
$("#calib").addEventListener("click",()=>{ base=null; toast("ההטיה כוילה למצב הנוכחי") });
function optUI(){
  $$("#scales .opt").forEach(b=>b.classList.toggle("on",b.dataset.v===S.scale)); rootSel.value=S.root;
  $$("#dirs .opt").forEach(b=>b.classList.toggle("on",b.dataset.v===S.dir)); $$("#spans .opt").forEach(b=>b.classList.toggle("on",+b.dataset.v===S.span));
  $$("#divs .opt").forEach(b=>b.classList.toggle("on",+b.dataset.v===S.div)); $("#tiltOn").checked=S.tilt; $("#calib").hidden=!S.tilt;
  ranges.forEach(f=>f()); $("#ctl").classList.toggle("tilt",S.tilt); for(const k in faders) faders[k].paint(); latchUI(); xyPaint(); modeUI();
}
let resetArm=0;
$("#reset").addEventListener("click",()=>{
  const now=Date.now();
  if(now-resetArm>3000){ resetArm=now; allOff(); E.reset(); applySound(); toast("הצליל אותחל. גע שוב כדי להחזיר גם את ההגדרות להתחלה"); return }
  resetArm=0; const keep=S.bpm; S=defaults(); S.bpm=keep; applySound(); optUI(); for(const k in faders) faders[k].paint(); save(); toast("ההגדרות חזרו להתחלה");
});
function allOff(){ stopSeq(); latched.clear(); latch=false; held.clear(); ptr.clear(); E.allOff(.2); modeUI() }

/* ================= הטיה (אופציונלי, כבוי כברירת מחדל) ================= */
let dream=0, wob=0, base=null;
function orient(e){
  if(!S.tilt||e.beta===null||e.beta===undefined) return;
  let b=e.beta, g=e.gamma; const ang=(screen.orientation&&screen.orientation.angle)||window.orientation||0;
  if(ang===90){ const t=b; b=g; g=-t } else if(ang===-90||ang===270){ const t=b; b=-g; g=t } else if(ang===180){ b=-b; g=-g }
  if(!base) base={b,g};
  const db=Math.max(0,Math.abs(b-base.b)-4), dg=Math.max(0,Math.abs(g-base.g)-4);
  dream=clamp(db/38,0,1); wob=clamp(dg/30,0,1); E.setDream(dream); E.setWobble(wob); xyPaint();
}
let motionOn=false;
async function askMotion(){
  let ok=true;
  try{ if(window.DeviceOrientationEvent&&DeviceOrientationEvent.requestPermission) ok=(await DeviceOrientationEvent.requestPermission())==="granted" }catch(e){ ok=false }
  if(ok&&!motionOn){ motionOn=true; addEventListener("deviceorientation",orient) }
  return ok;
}

/* ================= הקלטה (כמו בגרוב) ================= */
let recr=null, recStart=0, recTick=0, takes=[], takeSeq=0, recBusy=false;
const REC_MAX=20*60;
function pickMime(){ if(typeof MediaRecorder==="undefined") return null;
  for(const m of ["audio/mp4","audio/webm;codecs=opus","audio/webm"]){ try{ if(MediaRecorder.isTypeSupported(m)) return m }catch(e){} } return "" }
const fmtT=sec=>{ sec=Math.max(0,Math.round(fin(sec,0))); return Math.floor(sec/60)+":"+String(sec%60).padStart(2,"0") };
function recUI(){ const b=$("#rec"), on=!!recr; b.classList.toggle("on",on); b.setAttribute("aria-pressed",on);
  if(on){ const t=(performance.now()-recStart)/1000; b.textContent="⏹ "+fmtT(t); if(t>REC_MAX) stopRec() } else b.textContent="⏺";
  $("#takesBtn").textContent=takes.length?`הקלטות ${takes.length}`:"הקלטות" }
async function startRec(){
  if(recr||recBusy) return; recBusy=true;
  try{
    if(!await ensureAudio()){ toast("לא הצלחתי להפעיל צליל. גע שוב"); return }
    const mime=pickMime(), st=E.stream(); if(mime===null||!st){ toast("המכשיר הזה לא תומך בהקלטה"); return }
    let r; try{ r=new MediaRecorder(st,mime?{mimeType:mime,audioBitsPerSecond:192000}:{}) }catch(e){ try{ r=new MediaRecorder(st) }catch(e2){ toast("ההקלטה לא הצליחה להתחיל"); return } }
    const chunks=[], t0=performance.now(); let tEnd=0;
    r.ondataavailable=e=>{ if(e.data&&e.data.size) chunks.push(e.data) };
    r.onstop=()=>{ if(recr===r){ recr=null; clearInterval(recTick); recUI() } finishRec(r,chunks,((tEnd||performance.now())-t0)/1000) };
    r.onerror=()=>{ if(recr===r) stopRec(); else { try{ if(r.state!=="inactive") r.stop() }catch(e){} } };
    r.__end=()=>{ if(!tEnd) tEnd=performance.now() };
    r.start(1000); recr=r; recStart=t0; clearInterval(recTick); recTick=setInterval(recUI,250); recUI(); setWake(true);
  } finally { recBusy=false }
}
function stopRec(){ const r=recr; if(!r) return; recr=null; r.__end(); clearInterval(recTick); recUI(); try{ if(r.state!=="inactive") r.stop() }catch(e){} }
function finishRec(r,chunks,dur){
  if(r.__done) return; r.__done=true;
  const type=(r.mimeType||(chunks[0]&&chunks[0].type)||"audio/mp4").split(";")[0], blob=new Blob(chunks,{type}); chunks.length=0;
  if(blob.size<2000||dur<1){ toast("ההקלטה קצרה מדי ולא נשמרה"); return }
  const t={id:Date.now()+"-"+Math.floor(Math.random()*1e6),name:`מטוטלת ${++takeSeq}`,type,dur,created:Date.now(),blob};
  takes.unshift(t); recUI(); renderTakes();
  t.saving=dbPut(t).then(ok=>{ if(ok&&playId!==t.id) t.blob=null; toast(ok?`${t.name} נשמרה במכשיר`:`${t.name} נשמרה עד שתסגור את הדף`,"פתח",openTakes); return ok });
}
$("#rec").addEventListener("click",()=>{ recr?stopRec():startRec() });
const TDB="pendulum-touch-rec"; let dbP=null;
function getDb(){ if(!dbP) dbP=new Promise(res=>{ try{ if(!window.indexedDB) return res(null); const q=indexedDB.open(TDB,1);
  q.onupgradeneeded=()=>{ try{ q.result.createObjectStore("meta",{keyPath:"id"}); q.result.createObjectStore("data",{keyPath:"id"}) }catch(e){} };
  q.onsuccess=()=>res(q.result); q.onerror=()=>res(null); q.onblocked=()=>res(null) }catch(e){ res(null) } }); return dbP }
const txDone=tx=>new Promise(res=>{ tx.oncomplete=()=>res(true); tx.onerror=tx.onabort=()=>res(false) });
async function dbPut(t){ const db=await getDb(); if(!db) return false; const meta={id:t.id,name:t.name,type:t.type,dur:t.dur,created:t.created};
  try{ const tx=db.transaction(["meta","data"],"readwrite"); tx.objectStore("data").put({id:t.id,blob:t.blob}); tx.objectStore("meta").put(meta); if(await txDone(tx)) return true }catch(e){}
  try{ const buf=await t.blob.arrayBuffer(); const tx=db.transaction(["meta","data"],"readwrite"); tx.objectStore("data").put({id:t.id,buf,type:t.type}); tx.objectStore("meta").put(meta); return await txDone(tx) }catch(e){ return false } }
async function dbDel(id){ const db=await getDb(); if(!db) return; try{ const tx=db.transaction(["meta","data"],"readwrite"); tx.objectStore("meta").delete(id); tx.objectStore("data").delete(id); await txDone(tx) }catch(e){} }
async function dbMeta(){ const db=await getDb(); if(!db) return []; return new Promise(res=>{ try{ const q=db.transaction("meta","readonly").objectStore("meta").getAll();
  q.onsuccess=()=>res((q.result||[]).filter(x=>x&&x.id).map(x=>({id:String(x.id),name:String(x.name||"מטוטלת"),type:String(x.type||"audio/mp4"),dur:fin(x.dur,0),created:fin(x.created,0),blob:null})));
  q.onerror=()=>res([]) }catch(e){ res([]) } }) }
async function getBlob(t){ if(t.blob) return t.blob; const db=await getDb(); if(!db) return null;
  return new Promise(res=>{ try{ const q=db.transaction("data","readonly").objectStore("data").get(t.id);
    q.onsuccess=()=>{ const x=q.result; if(!x) return res(null); res(x.blob instanceof Blob?x.blob:(x.buf?new Blob([x.buf],{type:x.type||t.type}):null)) }; q.onerror=()=>res(null) }catch(e){ res(null) } }) }
dbMeta().then(list=>{ const ids=new Set(takes.map(t=>t.id)); takes=takes.concat(list.filter(t=>!ids.has(t.id))).sort((a,b)=>b.created-a.created);
  for(const t of takes){ const m=/(\d+)\s*$/.exec(t.name); if(m) takeSeq=Math.max(takeSeq,+m[1]) } recUI(); renderTakes() });
const player=new Audio(); player.setAttribute("playsinline",""); let playId=null, playUrl=null, playReq=0;
function stopPlayer(){ playReq++; try{ player.pause(); player.removeAttribute("src"); player.load() }catch(e){} playId=null; if(playUrl){ URL.revokeObjectURL(playUrl); playUrl=null } }
player.addEventListener("ended",()=>{ stopPlayer(); renderTakes() });
player.addEventListener("error",()=>{ if(playId){ stopPlayer(); renderTakes() } });
async function togglePlayTake(t){
  if(playId===t.id){ stopPlayer(); renderTakes(); return }
  stopPlayer(); const req=playReq; playId=t.id; renderTakes();
  const blob=await getBlob(t); if(req!==playReq) return;
  if(!blob){ toast("לא מצאתי את הצליל של ההקלטה הזו"); stopPlayer(); renderTakes(); return }
  playUrl=URL.createObjectURL(blob); player.src=playUrl;
  player.play().catch(()=>{ if(req===playReq){ toast("לא הצלחתי לנגן את ההקלטה"); stopPlayer(); renderTakes() } });
}
async function shareTake(t){
  const blob=t.blob||await getBlob(t); if(!blob){ toast("לא מצאתי את הצליל של ההקלטה הזו"); return }
  t.blob=blob;
  const ext=/mp4/.test(t.type)?"m4a":"webm", n=(/(\d+)\s*$/.exec(t.name)||[0,1])[1], fname=`pendulum-${n}.${ext}`;
  let file=null; try{ file=new File([blob],fname,{type:t.type}) }catch(e){}
  try{ if(file&&navigator.canShare&&navigator.canShare({files:[file]})){ await navigator.share({files:[file],title:t.name}); return } }
  catch(e){ if(e&&e.name==="AbortError") return; if(e&&e.name==="NotAllowedError"){ toast(`${t.name} מוכנה`,"שתף",()=>shareTake(t)); return } }
  try{ const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=fname; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove() },5000) }
  catch(e){ toast("לא הצלחתי לשמור את הקובץ") }
}
function renderTakes(){
  const ul=$("#takeList"); ul.replaceChildren(); $("#takesEmpty").hidden=takes.length>0;
  for(const t of takes){
    const li=document.createElement("li"); li.className="take";
    const nm=document.createElement("div"); nm.className="nm"; nm.textContent=t.name;
    const sm=document.createElement("small"), d=new Date(t.created);
    sm.textContent=fmtT(t.dur)+" · "+d.getDate()+"."+(d.getMonth()+1)+" "+String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0"); nm.appendChild(sm);
    const mk=(txt,cls,fn)=>{ const b=document.createElement("button"); b.type="button"; b.className="btn "+cls; b.textContent=txt; b.addEventListener("click",fn); return b };
    const pl=mk(playId===t.id?"■ עצור":"▶ נגן","pl",()=>togglePlayTake(t));
    const sh=mk("שתף / שמור קובץ","sh",()=>shareTake(t));
    let armT=0; const del=mk("מחק","del",async()=>{
      if(!del.classList.contains("arm")){ del.classList.add("arm"); del.textContent="בטוח?"; clearTimeout(armT); armT=setTimeout(()=>{ del.classList.remove("arm"); del.textContent="מחק" },2500); return }
      if(playId===t.id) stopPlayer(); takes=takes.filter(x=>x!==t); recUI(); renderTakes(); try{ await t.saving }catch(e){} await dbDel(t.id); t.blob=null });
    const acts=document.createElement("div"); acts.className="acts"; acts.append(pl,sh,del); li.append(nm,acts); ul.appendChild(li);
  }
}
function openTakes(){ renderTakes(); $("#takes").hidden=false }
function closeTakes(){ $("#takes").hidden=true; stopPlayer() }
$("#takesBtn").addEventListener("click",openTakes); $("#takesClose").addEventListener("click",closeTakes);
$("#takes").addEventListener("click",e=>{ if(e.target.id==="takes") closeTakes() });

/* ================= צליל: הפעלה ושמירה על חיים ================= */
async function ensureAudio(){
  if(!E.available()){ toast("הדפדפן הזה לא תומך בצליל"); return false }
  E.start(); E.touched(); applySound();
  const c=E.ctx(); if(c&&c.state!=="running"){ try{ await c.resume() }catch(e){} }
  return E.running();
}
E.onReset=()=>{ applySound(); if(recr) stopRec(); allOff() };
E.onNotice=msg=>toast(msg);
E.onState=st=>{ if(st!=="running"&&!document.hidden&&$("#gate").hidden) toast("הצליל נעצר. גע במסך כדי להמשיך") };
document.addEventListener("pointerdown",()=>{ if($("#gate").hidden){ E.start(); E.touched() } },true);
document.addEventListener("visibilitychange",()=>{ if(document.hidden){ if(recr) stopRec(); return } if($("#gate").hidden){ E.start(); setWake(true) } });
let wake=null;
async function setWake(on){ try{ if(on&&navigator.wakeLock&&!wake&&!document.hidden){ wake=await navigator.wakeLock.request("screen"); wake.addEventListener("release",()=>{ wake=null }) } else if(!on&&wake){ const w=wake; wake=null; await w.release() } }catch(e){ wake=null } }

/* ================= ציור: הבהוב כפתורים ושורת הפעמות ================= */
const stepsBar=$("#stepsBar"), stepDots=[]; for(let i=0;i<16;i++){ const d=document.createElement("i"); if(i%4===0) d.className="b"; stepsBar.appendChild(d); stepDots.push(d) }
const meterFill=$("#meterFill"); let mPeak=0, lastStep=-1;
const flashT=[];
function flashPad(m){ const a=active(); pads.forEach((b,p)=>{ if(a.has(p)&&padNotes(p).some(x=>(x-m)%12===0)){ b.classList.add("hit"); clearTimeout(flashT[p]); flashT[p]=setTimeout(()=>b.classList.remove("hit"),90) } }) }
function frame(){
  if(E.ctx()){ const now=E.now();
    while(visQ.length&&visQ[0].t<=now){ const v=visQ.shift(); flashPad(v.m) }
    if(barEpoch){ const st=(Math.floor((now-ctxOf(barEpoch))/(beat()/4))%16+16)%16; if(st!==lastStep){ if(lastStep>=0) stepDots[lastStep].classList.remove("now"); stepDots[st].classList.add("now"); lastStep=st } } }
  const lv=E.level(); mPeak=Math.max(lv>0?Math.min(1,lv*3):0,mPeak*.9); meterFill.style.transform=`scaleY(${mPeak})`;
  requestAnimationFrame(frame);
}

/* ================= פתיחה ================= */
$("#start").addEventListener("click",async()=>{
  if(S.tilt){ const ok=await askMotion(); if(!ok) S.tilt=false }
  const ok=await ensureAudio(); $("#gate").hidden=true; setWake(true);
  if(!ok){ toast("גע בכפתור כדי להפעיל צליל"); return }
  barEpoch=epochOf(E.now());
  E.ready().then(()=>{ if(!E.ladder()) toast("הדפדפן הזה בלי AudioWorklet: פילטר פשוט יותר, בלי השמעה עצמית") });
});
(()=>{ const ios=/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
  const standalone=navigator.standalone||(window.matchMedia&&matchMedia("(display-mode: standalone)").matches);
  if(ios&&!standalone) $("#installHint").hidden=false })();
window.addEventListener("error",()=>{ toast("משהו השתבש. אם אין צליל, גע ב־↻ איפוס תחת ⋯ עוד") });
$("#bpmVal").textContent=Math.round(bpm); optUI(); recUI(); syncUI();
requestAnimationFrame(frame);
if("serviceWorker" in navigator&&location.protocol==="https:") addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
window.PendulumDebug={level:()=>E.level(),fx:()=>({dream:S.dream,wobble:S.wobble,filter:S.filter,latch:S.fxLatch}),state:()=>JSON.parse(JSON.stringify(S)),clock:()=>({bpm,following,barEpoch}),voices:()=>E.voices(),active:()=>[...active()]};
})();
