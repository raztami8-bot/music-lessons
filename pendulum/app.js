/* מטוטלת · ממשק, מגע, הטיה ושעון */
(()=>{
"use strict";
const E=window.PendulumEngine;
const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const fin=(v,d)=>(typeof v==="number"&&isFinite(v))?v:d;

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
function defaults(){ return {root:9,scale:"minpent",oct:3,bpm:124,div:.75,tilt:true,vol:.8,res:.42,drive:.3,dream:0,wobble:0} }
function sanitize(o){
  const d=defaults(); if(!o||typeof o!=="object") return d;
  return {root:clamp(Math.round(fin(o.root,d.root)),0,11),scale:SCALES[o.scale]?o.scale:d.scale,oct:clamp(Math.round(fin(o.oct,d.oct)),1,5),
    bpm:clamp(fin(o.bpm,d.bpm),40,300),div:DIVS.some(x=>x.v===o.div)?o.div:d.div,tilt:o.tilt!==false,vol:clamp(fin(o.vol,d.vol),0,1),
    res:clamp(fin(o.res,d.res),0,1),drive:clamp(fin(o.drive,d.drive),0,1),dream:clamp(fin(o.dream,0),0,1),wobble:clamp(fin(o.wobble,0),0,1)};
}
const KEY="pendulum-v1";
let S; try{ S=sanitize(JSON.parse(localStorage.getItem(KEY))) }catch(e){ S=defaults() }
let saveT=0; function save(){ clearTimeout(saveT); saveT=setTimeout(()=>{ try{ localStorage.setItem(KEY,JSON.stringify(S)) }catch(e){} },300) }
function applySound(){ E.setVolume(S.vol); E.setRes(S.res*1.05); E.setDrive(.5+S.drive*S.drive*6); E.setTempo(bpm,S.div) }

/* ================= המשטח: עמודות = תווים, גובה = פילטר ================= */
const cv=$("#surf"), cx=cv.getContext("2d"); let W=0,H=0,DPR=1;
const steps=()=>SCALES[S.scale].steps;
const octaves=()=>W<620?1:2;
const cols=()=>steps().length*octaves()+1;
function colFreq(k){ const st=steps(), n=st.length, midi=12*(S.oct+1)+S.root+st[k%n]+12*Math.floor(k/n); return 440*Math.pow(2,(midi-69)/12) }
const colName=k=>NOTES[(S.root+steps()[k%steps().length])%12];
const xToCol=x=>clamp(Math.floor(x/W*cols()),0,cols()-1);
const yToCut=y=>120*Math.pow(2,(1-clamp(y/H,0,1))*6.6);
const hueOf=k=>(205+(k%steps().length)*(300/steps().length))%360;
function resize(){ const r=cv.getBoundingClientRect(); DPR=Math.min(2,devicePixelRatio||1); W=r.width; H=r.height; cv.width=Math.round(W*DPR); cv.height=Math.round(H*DPR); cx.setTransform(DPR,0,0,DPR,0,0) }
addEventListener("resize",resize); resize();

/* ================= אצבעות ================= */
const touches=new Map(); // pointerId → {id,x,y,col,hue,vel,t0,still,stillAt,frozen}
const frozen=[]; // קולות שממשיכים אחרי שהאצבע עזבה
const ripples=[];
let vid=0;
const FREEZE_MS=800, FREEZE_PX=9;
function velOf(e){ const w=fin(e.width,0); if(w<=1) return .85; return clamp(.45+(w-14)/36,.35,1) } // אצבע רחבה = חזק יותר
function startNote(e){
  const col=xToCol(e.offsetX), cut=yToCut(e.offsetY), vel=velOf(e), id="v"+(++vid);
  const t={id,x:e.offsetX,y:e.offsetY,col,hue:hueOf(col),vel,t0:performance.now(),stillAt:performance.now(),sx:e.offsetX,sy:e.offsetY,frozen:false};
  touches.set(e.pointerId,t); E.noteOn(id,colFreq(col),vel,cut);
  ripples.push({x:t.x,y:t.y,r:6,a:.9,hue:t.hue}); if(ripples.length>40) ripples.splice(0,ripples.length-30);
}
function moveNote(e,t){
  t.x=e.offsetX; t.y=e.offsetY;
  if(Math.hypot(t.x-t.sx,t.y-t.sy)>FREEZE_PX){ t.sx=t.x; t.sy=t.y; t.stillAt=performance.now() }
  const col=xToCol(t.x), q={cut:yToCut(t.y)};
  if(col!==t.col){ t.col=col; t.hue=hueOf(col); q.freq=colFreq(col); q.glide=.02+wob*.3; ripples.push({x:t.x,y:t.y,r:4,a:.5,hue:t.hue}) }
  const v=velOf(e); if(Math.abs(v-t.vel)>.04){ t.vel=v; q.vel=v }
  E.set(t.id,q);
}
function endNote(pid){
  const t=touches.get(pid); if(!t) return; touches.delete(pid);
  if(t.frozen){ frozen.push({id:t.id,x:t.x,y:t.y,col:t.col,hue:t.hue,cut:yToCut(t.y),ph:Math.random()*6.28,born:performance.now()}); frozenUI(); return }
  E.noteOff(t.id,.28);
}
function nearFrozen(x,y){ let best=null,bd=48; for(const f of frozen){ const d=Math.hypot(f.x-x,f.y-y); if(d<bd){ bd=d; best=f } } return best }
function releaseFrozen(f){ const i=frozen.indexOf(f); if(i>=0) frozen.splice(i,1); E.noteOff(f.id,.6); ripples.push({x:f.x,y:f.y,r:30,a:.6,hue:f.hue}); frozenUI() }
function releaseAll(){ frozen.slice().forEach(releaseFrozen); E.allOff(.3); touches.clear(); frozenUI() }
function frozenUI(){ const b=$("#release"); b.hidden=!frozen.length; b.textContent=frozen.length>1?`שחרר ${frozen.length}`:"שחרר" }
cv.addEventListener("pointerdown",e=>{
  if(e.pointerType==="mouse"&&e.button!==0) return;
  e.preventDefault(); E.start(); E.touched(); if(!E.running()){ ensureAudio(); return }
  const f=nearFrozen(e.offsetX,e.offsetY); if(f){ releaseFrozen(f); return }
  try{ cv.setPointerCapture(e.pointerId) }catch(err){}
  startNote(e);
});
cv.addEventListener("pointermove",e=>{ const t=touches.get(e.pointerId); if(!t) return; e.preventDefault(); moveNote(e,t) });
["pointerup","pointercancel","lostpointercapture"].forEach(n=>cv.addEventListener(n,e=>endNote(e.pointerId)));
$("#release").addEventListener("click",releaseAll);
document.addEventListener("keydown",e=>{ if(e.target.closest&&e.target.closest("input,select,button")) return; if(e.code==="Space"){ e.preventDefault(); releaseAll() } if(e.key==="Escape"){ moreOpen(false); closeTakes() } });

/* ================= הטיה וניעור ================= */
let dream=0, wob=0, dreamT=0, wobT=0, haveOri=false, base=null, raw={b:0,g:0};
function orient(e){
  if(e.beta===null||e.beta===undefined) return;
  let b=e.beta, g=e.gamma;
  const ang=(screen.orientation&&screen.orientation.angle)||window.orientation||0;
  if(ang===90){ const t=b; b=g; g=-t } else if(ang===-90||ang===270){ const t=b; b=-g; g=t } else if(ang===180){ b=-b; g=-g }
  if(!base) base={b,g};
  haveOri=true; raw.b=b-base.b; raw.g=g-base.g;
  if(S.tilt){ const db=Math.max(0,Math.abs(raw.b)-4), dg=Math.max(0,Math.abs(raw.g)-4); dreamT=clamp(db/38,0,1); wobT=clamp(dg/30,0,1) }
}
function calibrate(){ base=null; toast("ההטיה כוילה למצב הנוכחי") }
let lastShake=0, grav={x:0,y:0,z:0};
function motion(e){
  let a=e.acceleration; if(!a||a.x===null){ const ag=e.accelerationIncludingGravity; if(!ag||ag.x===null) return; grav.x+=(ag.x-grav.x)*.1; grav.y+=(ag.y-grav.y)*.1; grav.z+=(ag.z-grav.z)*.1; a={x:ag.x-grav.x,y:ag.y-grav.y,z:ag.z-grav.z} }
  const m=Math.hypot(a.x,a.y,a.z), now=Date.now();
  if(m>15&&now-lastShake>480&&S.tilt){ lastShake=now; stutter() }
}
async function askMotion(){ // iOS: חייב מתוך מחווה. הרשאה אחת מכסה את שניהם
  let ok=true;
  try{ if(window.DeviceOrientationEvent&&DeviceOrientationEvent.requestPermission) ok=(await DeviceOrientationEvent.requestPermission())==="granted" }catch(e){ ok=false }
  try{ if(ok&&window.DeviceMotionEvent&&DeviceMotionEvent.requestPermission) await DeviceMotionEvent.requestPermission() }catch(e){}
  if(ok){ addEventListener("deviceorientation",orient); addEventListener("devicemotion",motion) }
  return ok;
}

/* ================= שעון: משלנו, או של כלי אחר באתר ================= */
let bpm=S.bpm, barEpoch=0, following=false, lastBar=0;
const T0=()=>performance.timeOrigin||(Date.now()-performance.now());
const epochOf=ct=>T0()+(ct+E.perfOffset())*1000;
const ctxOf=ep=>(ep-T0())/1000-E.perfOffset();
const stepDur=()=>60/bpm/4;
function setBpm(v,fromSync){ const b=clamp(Math.round(fin(v,bpm)*10)/10,40,300); if(b===bpm) return; bpm=b; S.bpm=b; $("#bpmVal").textContent=Math.round(b); E.setTempo(bpm,S.div); save(); if(!fromSync&&clock.enabled()) clock.tempo(bpm) }
function stutter(){
  if(!E.running()) return;
  const sd=stepDur(), now=E.now()+.02; let t0=ctxOf(barEpoch); if(!barEpoch||!isFinite(t0)||Math.abs(now-t0)>600){ barEpoch=epochOf(now); t0=now }
  const n=Math.max(0,Math.ceil((now-t0)/sd)), from=t0+n*sd;
  E.stutter(from,8,sd/2); flashes.push({t:from,n:8,dur:sd/2});
}
const clock=window.MusicLessonsClock.create({app:"pendulum",on:{
  hello:()=>{ clock.state(false,bpm,0) },
  state:m=>{ if(m.bpm) setBpm(m.bpm,true); if(m.playing&&m.at){ barEpoch=m.at; following=true; lastBar=Date.now(); syncUI() } },
  tempo:m=>{ if(m.bpm) setBpm(m.bpm,true) },
  start:m=>{ if(m.bpm) setBpm(m.bpm,true); if(m.at){ barEpoch=m.at; following=true; lastBar=Date.now(); syncUI() } },
  bar:m=>{ if(m.bpm) setBpm(m.bpm,true); if(m.at){ barEpoch=m.at; following=true; lastBar=Date.now(); syncUI() } },
  stop:()=>{ following=false; syncUI() }
}});
function syncUI(){ const b=$("#sync"), on=clock.enabled(); b.classList.toggle("on",on); b.classList.toggle("follow",on&&following); b.setAttribute("aria-pressed",on); $("#bpmVal").classList.toggle("follow",on&&following) }
$("#sync").addEventListener("click",()=>{
  if(!clock.available()){ toast("הדפדפן הזה לא תומך בסנכרון בין חלונות"); return }
  const on=clock.setEnabled(!clock.enabled()); try{ localStorage.setItem("pendulum-sync",on?"1":"0") }catch(e){}
  if(!on) following=false; syncUI(); toast(on?"סנכרון פעיל: הקצב והפעמה מגיעים מהכלי שמנגן":"סנכרון כבוי");
});
try{ if(localStorage.getItem("pendulum-sync")==="1") clock.setEnabled(true) }catch(e){}
function repeat(el,fn){ let tm=0; const stop=()=>clearTimeout(tm);
  el.addEventListener("pointerdown",e=>{ e.preventDefault(); fn(); clearTimeout(tm); tm=setTimeout(function r(){ fn(); tm=setTimeout(r,70) },380) });
  ["pointerup","pointercancel","pointerleave"].forEach(n=>el.addEventListener(n,stop)) }
repeat($("#bpmDown"),()=>setBpm(Math.round(bpm)-1)); repeat($("#bpmUp"),()=>setBpm(Math.round(bpm)+1));

/* ================= אוקטבה ================= */
function octUI(){ $("#octVal").textContent="אוק׳ "+S.oct }
$("#octDown").addEventListener("click",()=>{ S.oct=clamp(S.oct-1,1,5); octUI(); save() });
$("#octUp").addEventListener("click",()=>{ S.oct=clamp(S.oct+1,1,5); octUI(); save() });

/* ================= עוד: סולם, שורש, דיליי, הטיה, צליל ================= */
const moreOpen=on=>{ $("#more").hidden=!on; $("#moreBtn").classList.toggle("on",on) };
$("#moreBtn").addEventListener("click",()=>moreOpen($("#more").hidden)); $("#moreClose").addEventListener("click",()=>moreOpen(false));
$("#more").addEventListener("click",e=>{ if(e.target.id==="more") moreOpen(false) });
const scaleBox=$("#scales"); for(const k in SCALES){ const b=document.createElement("button"); b.type="button"; b.className="btn opt"; b.dataset.k=k; b.textContent=SCALES[k].name; b.addEventListener("click",()=>{ S.scale=k; optUI(); save() }); scaleBox.appendChild(b) }
const rootSel=$("#root"); NOTES.forEach((n,i)=>{ const o=document.createElement("option"); o.value=i; o.textContent=n; rootSel.appendChild(o) });
rootSel.addEventListener("change",()=>{ S.root=+rootSel.value; optUI(); save() });
const divBox=$("#divs"); DIVS.forEach(d=>{ const b=document.createElement("button"); b.type="button"; b.className="btn opt"; b.dataset.v=d.v; b.textContent=d.name; b.addEventListener("click",()=>{ S.div=d.v; E.setTempo(bpm,S.div); optUI(); save() }); divBox.appendChild(b) });
$("#tiltOn").addEventListener("change",e=>{ S.tilt=e.target.checked; if(!S.tilt){ dreamT=S.dream; wobT=S.wobble } optUI(); save() });
$("#calib").addEventListener("click",calibrate);
function range(id,get,set){ const el=$(id); el.value=Math.round(get()*100); el.addEventListener("input",()=>{ set(el.value/100) }); el.addEventListener("change",save); return ()=>{ el.value=Math.round(get()*100) } }
const paints=[
  range("#r_dream",()=>S.dream,v=>{ S.dream=v; if(!S.tilt||!haveOri) dreamT=v }),
  range("#r_wob",()=>S.wobble,v=>{ S.wobble=v; if(!S.tilt||!haveOri) wobT=v }),
  range("#r_res",()=>S.res,v=>{ S.res=v; E.setRes(v*1.05) }),
  range("#r_drive",()=>S.drive,v=>{ S.drive=v; E.setDrive(.5+v*v*6) }),
  range("#r_vol",()=>S.vol,v=>{ S.vol=v; E.setVolume(v) })
];
function optUI(){
  $$("#scales .opt").forEach(b=>b.classList.toggle("on",b.dataset.k===S.scale)); rootSel.value=S.root;
  $$("#divs .opt").forEach(b=>b.classList.toggle("on",+b.dataset.v===S.div)); $("#tiltOn").checked=S.tilt;
  $("#manual").classList.toggle("dimmed",S.tilt&&haveOri); paints.forEach(p=>p()); octUI();
}
let resetArm=0;
$("#reset").addEventListener("click",()=>{
  const now=Date.now();
  if(now-resetArm>3000){ resetArm=now; releaseAll(); E.reset(); applySound(); toast("הצליל אותחל. גע שוב כדי להחזיר גם את ההגדרות להתחלה"); return }
  resetArm=0; const keep=S.bpm; S=defaults(); S.bpm=keep; applySound(); optUI(); save(); toast("ההגדרות חזרו להתחלה");
});

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
const TDB="pendulum-rec"; let dbP=null;
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
  t.blob=blob; // כדי שניסיון חוזר מהטוסט יישאר בתוך המחווה
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
E.onReset=()=>{ applySound(); if(recr) stopRec(); frozen.length=0; touches.clear(); frozenUI() };
E.onNotice=msg=>toast(msg);
E.onState=st=>{ if(st!=="running"&&!document.hidden&&$("#gate").hidden) toast("הצליל נעצר. גע במסך כדי להמשיך") };
document.addEventListener("pointerdown",()=>{ if($("#gate").hidden){ E.start(); E.touched() } },true);
document.addEventListener("visibilitychange",()=>{ if(document.hidden){ if(recr) stopRec(); releaseAll(); return } if($("#gate").hidden){ E.start(); setWake(true) } });
let wake=null;
async function setWake(on){ try{ if(on&&navigator.wakeLock&&!wake&&!document.hidden){ wake=await navigator.wakeLock.request("screen"); wake.addEventListener("release",()=>{ wake=null }) } else if(!on&&wake){ const w=wake; wake=null; await w.release() } }catch(e){ wake=null } }

/* ================= ציור ================= */
const flashes=[]; const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
const INK=getComputedStyle(document.body).getPropertyValue("--ink").trim()||"#0d0a16";
const meterFill=$("#meterFill"); let mPeak=0, lastFrozenTick=0;
function frame(){
  const now=performance.now();
  // החלקה של ההטיה אל הפרמטרים, והעברה למנוע
  dream+=(dreamT-dream)*.12; wob+=(wobT-wob)*.15;
  if(Math.abs(dream-E.params().dream)>.004) E.setDream(dream); if(Math.abs(wob-E.params().wobble)>.004) E.setWobble(wob);
  // הקפאה: אצבע שלא זזה
  for(const t of touches.values()) if(!t.frozen&&now-t.stillAt>FREEZE_MS){ t.frozen=true; ripples.push({x:t.x,y:t.y,r:20,a:.8,hue:t.hue}) }
  // קולות קפואים: נשימה איטית של הפילטר
  if(now-lastFrozenTick>60){ lastFrozenTick=now; for(const f of frozen){ const c=f.cut*Math.pow(2,Math.sin(now/1000*.5+f.ph)*.7); E.set(f.id,{cut:c}) } }
  draw(now);
  const lv=E.level(); mPeak=Math.max(lv>0?Math.min(1,lv*3):0,mPeak*.9); meterFill.style.transform=`scaleY(${mPeak})`;
  requestAnimationFrame(frame);
}
function draw(now){
  const n=cols(), cw=W/n;
  cx.fillStyle=INK; cx.fillRect(0,0,W,H);
  // זוהר החלום: מתרחב מהמרכז
  if(dream>.01){ const gr=cx.createRadialGradient(W/2,H*.55,10,W/2,H*.55,Math.max(W,H)*.75); gr.addColorStop(0,`hsla(285,80%,55%,${.22*dream})`); gr.addColorStop(.6,`hsla(190,90%,50%,${.08*dream})`); gr.addColorStop(1,"transparent"); cx.fillStyle=gr; cx.fillRect(0,0,W,H) }
  // עמודות: קווים דקים, שורש מודגש, שם התו למטה
  const len=steps().length;
  for(let k=0;k<n;k++){ const x=k*cw, root=k%len===0;
    cx.fillStyle=root?"rgba(255,255,255,.055)":"rgba(255,255,255,.02)"; cx.fillRect(x,0,cw-1,H);
    cx.fillStyle=root?"rgba(255,255,255,.55)":"rgba(255,255,255,.22)"; cx.font=(root?"700 ":"500 ")+Math.min(13,cw*.5)+"px system-ui,-apple-system,sans-serif"; cx.textAlign="center"; cx.fillText(colName(k),x+cw/2,H-10); }
  // אופק: מתכתי, מסתובב עם ההטיה הצידה ועולה עם ההטיה קדימה
  cx.save(); cx.translate(W/2,H*(.5-clamp(raw.b,-45,45)/300)); cx.rotate(clamp(raw.g,-40,40)*Math.PI/180);
  const hg=cx.createLinearGradient(-W,0,W,0); hg.addColorStop(0,"transparent"); hg.addColorStop(.5,`hsla(200,100%,80%,${.25+wob*.45})`); hg.addColorStop(1,"transparent");
  cx.strokeStyle=hg; cx.lineWidth=1.5; cx.beginPath(); cx.moveTo(-W,0); cx.lineTo(W,0); cx.stroke(); cx.restore();
  // גלים
  for(let i=ripples.length-1;i>=0;i--){ const r=ripples[i]; r.r+=reduce?3:2.6+dream*3; r.a*=.94; if(r.a<.02){ ripples.splice(i,1); continue }
    cx.strokeStyle=`hsla(${r.hue},90%,65%,${r.a})`; cx.lineWidth=2; cx.beginPath(); cx.arc(r.x,r.y,r.r,0,6.283); cx.stroke() }
  // קולות קפואים: טבעת נושמת
  for(const f of frozen){ const p=.5+.5*Math.sin(now/1000*.5+f.ph), R=22+p*10;
    cx.strokeStyle=`hsla(${f.hue},90%,70%,.85)`; cx.lineWidth=3; cx.setLineDash([6,5]); cx.lineDashOffset=-now/40; cx.beginPath(); cx.arc(f.x,f.y,R,0,6.283); cx.stroke(); cx.setLineDash([]);
    cx.fillStyle=`hsla(${f.hue},90%,70%,.25)`; cx.beginPath(); cx.arc(f.x,f.y,10,0,6.283); cx.fill() }
  // אצבעות
  for(const t of touches.values()){ const R=18+t.vel*16;
    const g=cx.createRadialGradient(t.x,t.y,2,t.x,t.y,R*2.2); g.addColorStop(0,`hsla(${t.hue},95%,70%,.95)`); g.addColorStop(.45,`hsla(${t.hue},95%,60%,.35)`); g.addColorStop(1,"transparent");
    cx.fillStyle=g; cx.beginPath(); cx.arc(t.x,t.y,R*2.2,0,6.283); cx.fill();
    cx.fillStyle=`hsla(${t.hue},95%,85%,.95)`; cx.beginPath(); cx.arc(t.x,t.y,R*.45,0,6.283); cx.fill() }
  // stutter: הבהוב של כל המסך בקצב החיתוך
  if(flashes.length&&E.ctx()){ const ct=E.now(); for(let i=flashes.length-1;i>=0;i--){ const f=flashes[i]; if(ct>f.t+f.n*f.dur){ flashes.splice(i,1); continue } if(ct>=f.t){ const ph=((ct-f.t)%f.dur)/f.dur; if(ph<.5){ cx.fillStyle="rgba(255,255,255,.07)"; cx.fillRect(0,0,W,H) } } } }
}

/* ================= פתיחה ================= */
$("#start").addEventListener("click",async()=>{
  let sensors=false;
  if(S.tilt){ sensors=await askMotion() }
  const ok=await ensureAudio(); $("#gate").hidden=true; resize(); setWake(true);
  if(!ok){ toast("גע במשטח כדי להפעיל צליל"); return }
  barEpoch=epochOf(E.now());
  E.ready().then(()=>{ if(!E.ladder()) toast("הדפדפן הזה בלי AudioWorklet: פילטר פשוט יותר, בלי השמעה עצמית") });
  if(S.tilt&&!sensors){ toast("אין גישה לחיישני התנועה. החלום והרעד במחוונים תחת ⋯ עוד") }
});
(()=>{ const ios=/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
  const standalone=navigator.standalone||(window.matchMedia&&matchMedia("(display-mode: standalone)").matches);
  if(ios&&!standalone) $("#installHint").hidden=false })();
window.addEventListener("error",()=>{ toast("משהו השתבש. אם אין צליל, גע ב־↻ איפוס תחת ⋯ עוד") });
$("#bpmVal").textContent=Math.round(bpm); optUI(); frozenUI(); recUI(); syncUI();
requestAnimationFrame(frame);
if("serviceWorker" in navigator&&location.protocol==="https:") addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
window.PendulumDebug={state:()=>JSON.parse(JSON.stringify(S)),tilt:()=>({raw,dream,wob,haveOri}),voices:()=>E.voices(),frozen:()=>frozen.length,stutter};
})();
