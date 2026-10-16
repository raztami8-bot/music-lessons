/* מכונת גרוב 2 · עותק של groove/ עם עמודים (עד 64 צעדים), ביטול/חזרה, ניקוי ואיפוס, וכל צעדי העמוד תמיד גלויים */
(()=>{
"use strict";
const E=window.GrooveEngine;
const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const fin=(v,d)=>(typeof v==="number"&&isFinite(v))?v:d;
const STEPS=16, MAXS=64, LENS=[8,12,16,24,32,48,64], NUDGE=.03; // STEPS = צעדים בעמוד/תיבה // תזמון: עד 30 אלפיות מוקדם או מאוחר

/* ================= הדף לא זז ================= */
const phoneLand=()=>false; // גם בטלפון הדף לא זז
["gesturestart","gesturechange","gestureend"].forEach(t=>document.addEventListener(t,e=>e.preventDefault(),{passive:false}));
document.addEventListener("dblclick",e=>e.preventDefault(),{passive:false});
document.addEventListener("touchmove",e=>{ if(e.touches.length>1||!(e.target.closest&&e.target.closest(".scroll-y"))&&!phoneLand()) e.preventDefault() },{passive:false});
// גם גלילה שנגרמה מקוד או ממיקוד חוזרת למקום: המכשיר תמיד עומד במקום
for(const el of [window,document.querySelector(".app"),document.querySelector(".main"),document.querySelector(".seq")]) el.addEventListener("scroll",()=>{ if(phoneLand()) return; if(el===window){ if(scrollX||scrollY) scrollTo(0,0) } else if(el.scrollTop||el.scrollLeft){ el.scrollTop=0; el.scrollLeft=0 } },{passive:true});
document.addEventListener("contextmenu",e=>{ if(!(e.target.closest&&e.target.closest("input,textarea"))) e.preventDefault() });

/* ================= הודעות ================= */
let toastT=0, undoTok=0, toastUndo=false;
function killUndo(){ undoTok++; if(toastUndo){ toastUndo=false; $("#toast").hidden=true } }
function toast(msg,label,fn,isUndo){
  const t=$("#toast"); t.replaceChildren(); toastUndo=!!isUndo;
  const sp=document.createElement("span"); sp.textContent=msg; t.appendChild(sp);
  if(label){ const b=document.createElement("button"); b.type="button"; b.className="tact"; b.textContent=label; const tok=undoTok;
    b.addEventListener("click",()=>{ t.hidden=true; toastUndo=false; clearTimeout(toastT); if(!isUndo||tok===undoTok){ try{fn()}catch(e){} } }); t.appendChild(b) }
  t.hidden=false; clearTimeout(toastT); toastT=setTimeout(()=>{ t.hidden=true; toastUndo=false },label?5000:3000);
}

/* ================= תופים ומצב ================= */
const PARTS=[
  {id:"kick",name:"בעיטה",th:0,tone:"קליק",col:"--kick"},
  {id:"clap",name:"מחיאה",th:.26,tone:"חדות",col:"--clap"},
  {id:"ch",name:"סגור",full:"היי־האט סגור",th:.12,tone:"בהירות",col:"--ch"},
  {id:"oh",name:"פתוח",full:"היי־האט פתוח",th:.40,tone:"בהירות",col:"--oh"},
  {id:"tom",name:"טום",th:.55,tone:"עור",col:"--tom"},
  {id:"rim",name:"רים",full:"רים / רעש",th:.68,tone:"רעש",col:"--rim"}
];
const NP=PARTS.length, GHOST_TH=.86;
const DEF_PART={kick:{level:.88,decay:.45,pitch:.3,tone:.45},clap:{level:.72,decay:.35,pitch:.4,tone:.5},ch:{level:.62,decay:.3,pitch:.5,tone:.5},
  oh:{level:.56,decay:.42,pitch:.5,tone:.5},tom:{level:.66,decay:.42,pitch:.35,tone:.35},rim:{level:.62,decay:.3,pitch:.5,tone:.3}};
const DEF_REV={kick:.04,clap:.22,ch:.08,oh:.14,tom:.18,rim:.16};
const pat=s=>s.split("").map(c=>c==="X"?2:c==="x"?1:0);
const DEMOS=[
  [ "X...x...x...x...", "....X.......X...", "xx.xxx.xxx.xxx.x", "..x...x...x...x.", "..........x....x", "...x.....x......" ], // הַאוּס
  [ "X......x..x.....", "....X.......X..x", "x.x.x.x.x.x.x.x.", ".............x..", "..............xx", "..x......x......" ], // ברייק
  [ "X...X...X...X.x.", "....x.......x...", "xxXxxxXxxxXxxxXx", "................", "......x.......x.", ".x.....x.x......" ], // טכנו
  [ "X.........x.....", "........X.......", "x.x.x.xxx.x.xxxx", "......x.........", ".............x.x", "...x.......x...." ]  // חצי קצב
].map(v=>v.map(pat));
const emptyVar=()=>PARTS.map(()=>new Array(MAXS).fill(0));
const pad64=r=>{ const o=r.slice(0,MAXS); while(o.length<MAXS) o.push(0); return o };
function defaults(){
  const parts={}; for(const p of PARTS) parts[p.id]={...DEF_PART[p.id],nudge:.5,dly:0,rev:DEF_REV[p.id],cut:1,mute:false,solo:false};
  return {bpm:124,swing:.12,energy:.8,drive:.1,vol:.8,cur:0,sel:0,len:16,follow:true,vars:DEMOS.map(v=>v.map(pad64)),parts};
}
function sanitize(o){
  const d=defaults(); if(!o||typeof o!=="object") return d;
  const s={bpm:clamp(Math.round(fin(o.bpm,d.bpm)),60,200),swing:clamp(fin(o.swing,d.swing),0,1),energy:clamp(fin(o.energy,d.energy),0,1),
    drive:clamp(fin(o.drive,d.drive),0,1),vol:clamp(fin(o.vol,d.vol),0,1),len:LENS.includes(o.len)?o.len:16,follow:o.follow!==false,cur:clamp(Math.round(fin(o.cur,0)),0,3),sel:clamp(Math.round(fin(o.sel,0)),0,NP-1),vars:[],parts:{}};
  for(let v=0;v<4;v++){ const src=Array.isArray(o.vars)&&Array.isArray(o.vars[v])?o.vars[v]:d.vars[v];
    s.vars.push(PARTS.map((p,pi)=>{ const r=Array.isArray(src[pi])?src[pi]:d.vars[v][pi]; const out=[]; for(let i=0;i<MAXS;i++){ const x=Math.round(fin(r[i],0)); out.push(x===1||x===2?x:0) } return out })) }
  for(const p of PARTS){ const q=(o.parts&&o.parts[p.id])||{}, df=d.parts[p.id], w={};
    for(const k of ["level","decay","pitch","tone","nudge","dly","rev","cut"]) w[k]=clamp(fin(q[k],df[k]),0,1);
    w.mute=!!q.mute; w.solo=!!q.solo; s.parts[p.id]=w }
  return s;
}
const KEY="groove2-v1";
let S; try{ S=sanitize(JSON.parse(localStorage.getItem(KEY))) }catch(e){ S=defaults() }
let saveT=0;
function save(keepSlot){ if(!keepSlot&&curSlot>=0){ curSlot=-1; slotsUI() } clearTimeout(saveT); saveT=setTimeout(()=>{ try{ localStorage.setItem(KEY,JSON.stringify(S)) }catch(e){} },350) }
const grid=()=>S.vars[S.cur];
function hash(i,salt){ const x=Math.sin(i*127.1+salt*311.7)*43758.5453; return x-Math.floor(x) }

/* ================= אנרגיה: שכבה אחרי שכבה ================= */
function energyGain(pi){ if(pi===0) return 1; const x=(S.energy-PARTS[pi].th)/.07; return x<=0?0:Math.min(1,.35+.65*x) }
function layersText(){
  const on=PARTS.filter((p,pi)=>energyGain(pi)>0).sort((a,b)=>a.th-b.th).map(p=>p.name);
  if(on.length===1) return "בעיטה בלבד";
  return on.join(" + ")+(S.energy>GHOST_TH?" + קישוטים":"");
}

/* ================= מה מנגנים בכל צעד ================= */
// F: מצב המילוי {amt, on, land}. מחזיר מכות {pi, v, dt (חלק מצעד), pA, dA}
function stepHits(i,bar,F){
  const g=grid(), out=[], anySolo=PARTS.some(p=>S.parts[p.id].solo);
  const audible=pi=>{ const pp=S.parts[PARTS[pi].id]; return !pp.mute&&(!anySolo||pp.solo) };
  const filling=!!(F&&F.on), f=filling?Math.max(F.amt,1/32):0, land=!!(F&&F.land);
  for(let pi=0;pi<NP;pi++){
    if(!audible(pi)) continue;
    const id=PARTS[pi].id, val=g[pi][i], eg=energyGain(pi);
    if(land){ // נחיתה: בעיטה מודגשת, פתוח ארוך כמו מצילה, מחיאה
      if(id==="kick") out.push({pi,v:1.15,dt:0});
      else if(id==="oh") out.push({pi,v:1,dt:0,dA:.3});
      else if(id==="clap") out.push({pi,v:.95,dt:0});
      else if(val&&eg>0) out.push({pi,v:(val===2?1:.68)*eg,dt:0});
      continue;
    }
    if(filling){
      const pos=(i%STEPS)/STEPS, up=Math.min(1,.45+f*.4+pos*.3);
      if(id==="clap"||(id==="rim"&&f>.2)){ // גלגול שמתצפף: שש־עשריות, שלושים־ושתיים, ועוד
        const n=f<.3?1:f<.65?2:3;
        for(let k=0;k<n;k++) out.push({pi,v:up*(k?.78:1)*(id==="rim"?.75:.9),dt:k/n});
        continue;
      }
      if(id==="tom"){ if(f>.12&&(i%2===0||f>.5)) out.push({pi,v:.55+.4*f,dt:0,pA:f*.4+pos*.25}); continue }
      if(id==="kick"&&f>.6) continue; // הבעיטה יוצאת: מתח לפני הנחיתה
      if(id==="oh") continue;
      if(id==="ch"&&f>.4&&eg>0){ out.push({pi,v:.5*eg+.1,dt:0}); out.push({pi,v:.4*eg+.08,dt:.5}); continue }
    }
    if(val&&eg>0) out.push({pi,v:(val===2?1:.68)*eg,dt:0});
  }
  const gk=clamp((S.energy-GHOST_TH)/(1-GHOST_TH),0,1);
  if(gk>0&&!filling&&!land){ // קישוטים באנרגיה גבוהה: היי־האט רפאים, רים ובעיטה קטנה
    if(audible(2)&&!g[2][i]&&!g[3][i]&&hash(i,bar&1)<gk*.6) out.push({pi:2,v:.3,dt:0});
    if(audible(5)&&!g[5][i]&&i%4===3&&hash(i,7+(bar&3))<gk*.7) out.push({pi:5,v:.3,dt:0});
    if(audible(0)&&!g[0][i]&&(i===7||i===11||i===14)&&hash(i,3+(bar&1))<gk*.5) out.push({pi:0,v:.42,dt:0});
  }
  return out;
}
function hitParams(pi,h){ const pp=S.parts[PARTS[pi].id];
  return {level:pp.level,decay:clamp(pp.decay+(h.dA||0),0,1),pitch:clamp(pp.pitch+(h.pA||0),0,1),tone:pp.tone,dly:pp.dly,rev:pp.rev,cut:pp.cut} }
const stepDur=()=>60/S.bpm/4;
const swingOf=i=>i%2===1?S.swing*stepDur()*.5:0; // עד 75% סווינג
const nudgeOf=pi=>(S.parts[PARTS[pi].id].nudge-.5)*2*NUDGE;

/* ================= סקוונסר ================= */
let pos=0, playing=false, nextT=0, step=0, bar=0, timer=0, barStartT=0, leader=true, ignoreBars=false;
let pendingVar=-1;
const fill={held:false,tail:false,amt:0};
const visQ=[];
function scheduleStep(i,t){
  if(fill.held) fill.amt=Math.min(1,fill.amt+1/32); // שיא אחרי שתי תיבות
  const F={on:fill.held||fill.tail,amt:fill.amt,land:false};
  if(i===0&&fill.tail&&!fill.held){ F.on=false; F.land=true; fill.tail=false; fill.amt=0 }
  const sd=stepDur(), base=t+swingOf(i), now=E.now(), pi0=pos%S.len, hits=stepHits(pi0,bar,F), lit=[]; pos=(pos+1)%S.len;
  for(const h of hits){ const ht=Math.max(base+h.dt*sd+nudgeOf(h.pi),now+.002); E.hit(PARTS[h.pi].id,ht,h.v,hitParams(h.pi,h)); lit.push(h.pi) }
  if(!document.hidden){ visQ.push({i:pi0,t:base,lit}); if(visQ.length>80) visQ.splice(0,visQ.length-40) }
}
function onBar(){
  if(pendingVar>=0){ S.cur=pendingVar; pendingVar=-1; gridUI(); varsUI(); save(true) }
  if(clock.enabled()&&leader) clock.bar(S.bpm,epochOf(barStartT),bar);
}
function tick(){
  if(!playing||!E.running()) return;
  const now=E.now(), la=document.hidden?1.2:.12;
  if(nextT<now-.25){ // אחרי הפרעה: לא מנגנים בבת אחת את מה שפוספס
    const sd=stepDur(), k=Math.ceil((now+.05-nextT)/sd); nextT+=k*sd; step=(step+k)%STEPS; pos=(pos+k)%S.len; barStartT=nextT-step*sd;
  }
  while(nextT<now+la){
    if(step===0){ barStartT=nextT; onBar() }
    scheduleStep(step,nextT);
    nextT+=stepDur(); step=(step+1)%STEPS; if(step===0) bar++;
  }
}
const T0=()=>performance.timeOrigin||(Date.now()-performance.now());
function epochOf(ct){ return T0()+(ct+E.perfOffset())*1000 }
function ctxOf(ep){ return (ep-T0())/1000-E.perfOffset() }
function beginAt(t0,st){ // t0: זמן הצעד הבא, st: מספרו
  step=st; pos=st%S.len; nextT=t0; barStartT=t0-st*stepDur(); bar=0; visQ.length=0;
  playing=true; clearInterval(timer); timer=setInterval(tick,25); tick(); playUI(); setWake(true);
}
async function play(){
  if(!await ensureAudio()){ toast("לא הצלחתי להפעיל צליל. גע שוב"); return false }
  fill.held=false; fill.tail=false; fill.amt=0; fillUI(); leader=true; ignoreBars=false;
  beginAt(E.now()+.06,0);
  if(clock.enabled()) clock.start(S.bpm,epochOf(nextT));
  return true;
}
function stop(fromSync){
  playing=false; clearInterval(timer); visQ.length=0; nowStep(-1);
  fill.held=false; fill.tail=false; fill.amt=0; fillUI(); pendingVar=-1; varsUI();
  if(!fromSync&&clock.enabled()){ clock.stop(); ignoreBars=true }
  playUI(); setWake(!!recr);
}
function togglePlay(){ if(playing) stop(); else play() }
function playUI(){ const b=$("#play"); b.classList.toggle("on",playing); b.textContent=playing?"■ עצור":"▶ נגן"; syncUI() }
function audition(pi,v){ if(!E.running()) return; E.hit(PARTS[pi].id,E.now()+.005,v===2?1:.75,hitParams(pi,{})); flashRow(pi) }

/* ================= צליל: הפעלה, השכמה ושמירה על חיים ================= */
async function ensureAudio(){
  if(!E.available()){ toast("הדפדפן הזה לא תומך בצליל"); return false }
  E.start(); E.touched(); applySound();
  const c=E.ctx(); if(c&&c.state!=="running"){ try{ await c.resume() }catch(e){} }
  return E.running();
}
function applySound(){ E.setVolume(S.vol); E.setDrive(S.drive); E.setTempo(S.bpm) }
E.onReset=()=>{ applySound(); if(recr) stopRec(); if(playing){ const sd=stepDur(); nextT=E.now()+.08; barStartT=nextT-step*sd } };
E.onNotice=msg=>toast(msg);
E.onState=st=>{ if(st!=="running"&&playing&&!document.hidden) toast("הצליל נעצר. גע במסך כדי להמשיך") };
document.addEventListener("touchstart",()=>{ if($("#gate").hidden){ E.start(); E.touched() } },{capture:true,passive:true});
document.addEventListener("mousedown",()=>{ if($("#gate").hidden){ E.start(); E.touched() } },true);
document.addEventListener("visibilitychange",()=>{
  if(document.hidden){ if(recr) stopRec(); return }
  if($("#gate").hidden) E.start(); if(playing||recr) setWake(true);
});
let wake=null;
async function setWake(on){ try{ if(on&&navigator.wakeLock&&!wake&&!document.hidden){ wake=await navigator.wakeLock.request("screen"); wake.addEventListener("release",()=>{ wake=null }) } else if(!on&&wake){ const w=wake; wake=null; await w.release() } }catch(e){ wake=null } }

/* ================= מגע: עזרים ================= */
let lastTouchAt=0;
document.addEventListener("touchend",()=>{ lastTouchAt=Date.now() },{capture:true,passive:true});
const fromTouch=()=>Date.now()-lastTouchAt<800;
// לחיצה מהירה: מגיבים ב־touchend, בלי השהיית לחיצה כפולה. עכבר ומקלדת דרך click
function onTap(el,fn){
  let tid=null;
  el.addEventListener("touchstart",e=>{ e.preventDefault(); if(tid!==null) return; tid=e.changedTouches[0].identifier; el.classList.add("press") },{passive:false});
  el.addEventListener("touchend",e=>{ for(const t of e.changedTouches){ if(t.identifier!==tid) continue; tid=null; el.classList.remove("press");
    const r=el.getBoundingClientRect(); if(t.clientX>=r.left-12&&t.clientX<=r.right+12&&t.clientY>=r.top-12&&t.clientY<=r.bottom+12) fn(e) } });
  el.addEventListener("touchcancel",()=>{ tid=null; el.classList.remove("press") });
  el.addEventListener("click",e=>{ if(!fromTouch()) fn(e) });
}
// לחיצה והחזקה: down/up, עם רשת ביטחון למגע שנגמר מחוץ לכפתור
function onHold(el,down0,up){
  let tid=null, mouse=false, key=false, downAt=0;
  const down=()=>{ downAt=Date.now(); down0() }, tapDown=()=>down0();
  const end=(cancel)=>{ tid=null; mouse=false; key=false; el.classList.remove("press"); up(cancel) };
  el.addEventListener("touchstart",e=>{ e.preventDefault(); if(tid!==null||mouse) return; tid=e.changedTouches[0].identifier; el.classList.add("press"); down() },{passive:false});
  const tEnd=e=>{ if(tid===null) return; let alive=false; for(const t of e.touches) if(t.identifier===tid) alive=true; if(!alive) end(e.type==="touchcancel") };
  document.addEventListener("touchend",tEnd,true); document.addEventListener("touchcancel",tEnd,true);
  el.addEventListener("mousedown",e=>{ if(fromTouch()||tid!==null||e.button!==0) return; e.preventDefault(); mouse=true; el.classList.add("press"); down();
    const mu=()=>{ window.removeEventListener("mouseup",mu); if(mouse) end(false) }; window.addEventListener("mouseup",mu) });
  el.addEventListener("keydown",e=>{ if((e.key===" "||e.key==="Enter")&&!key&&tid===null&&!mouse){ e.preventDefault(); key=true; down() } });
  el.addEventListener("keyup",e=>{ if((e.key===" "||e.key==="Enter")&&key){ e.preventDefault(); end(false) } });
  // click בלי לחיצה לפני (VoiceOver, עזרי נגישות): נחשב כנגיעה קצרה
  el.addEventListener("click",e=>{ e.preventDefault(); if(tid===null&&!mouse&&!key&&!fromTouch()&&Date.now()-downAt>700){ tapDown(); up(false) } });
  window.addEventListener("blur",()=>{ if(tid!==null||mouse||key) end(true) });
}
// מחוון: אצבע במקום = ערך. בלוח שנגלל: תנועה לצדדים מזיזה, תנועה למעלה ולמטה גוללת
function slider(el,o){
  let tid=null, mode=null, x0=0, y0=0;
  const pane=el.closest(".scroll-y");
  // מחוון אנכי (פיידר) כשהוא גבוה מרוחבו: למעלה = יותר
  const vert=()=>el.clientHeight>el.clientWidth*1.5;
  let ly=0;
  const valAt=x=>{ const r=el.getBoundingClientRect(); return vert()?clamp((r.bottom-ly)/r.height,0,1):clamp((x-r.left)/r.width,0,1) };
  const setX=(x,y)=>{ if(y!==undefined) ly=y; let v=valAt(x); if(o.center&&Math.abs(v-.5)<.035) v=.5; o.set(v); paint() };
  function paint(){ const v=o.get(); el.style.setProperty("--v",v); if(o.center){ el.style.setProperty("--l",Math.min(v,.5)); el.style.setProperty("--w",Math.abs(v-.5)) }
    el.setAttribute("aria-valuenow",Math.round(v*100)); if(o.show) o.show(v) }
  el.addEventListener("touchstart",e=>{ if(tid!==null) return; const t=e.changedTouches[0]; tid=t.identifier; x0=t.clientX; y0=t.clientY;
    const scrolls=pane&&pane.scrollHeight>pane.clientHeight+2;
    if(!scrolls){ e.preventDefault(); mode="drag"; el.classList.add("drag"); setX(t.clientX,t.clientY) } else mode="wait" },{passive:false});
  el.addEventListener("touchmove",e=>{ for(const t of e.changedTouches){ if(t.identifier!==tid) continue;
    if(mode==="wait"){ const dx=t.clientX-x0, dy=t.clientY-y0; if(Math.abs(dx)>7||Math.abs(dy)>7){ if((vert()||Math.abs(dx)>Math.abs(dy))&&e.cancelable){ mode="drag"; el.classList.add("drag") } else mode="scroll" } }
    if(mode==="drag"){ e.preventDefault(); setX(t.clientX,t.clientY) } } },{passive:false});
  const tEnd=e=>{ for(const t of e.changedTouches){ if(t.identifier!==tid) continue; if(mode==="wait"&&e.type==="touchend") setX(t.clientX,t.clientY); tid=null; mode=null; el.classList.remove("drag"); if(o.done) o.done() } };
  el.addEventListener("touchend",tEnd); el.addEventListener("touchcancel",tEnd);
  el.addEventListener("mousedown",e=>{ if(fromTouch()||e.button!==0) return; e.preventDefault(); el.classList.add("drag"); setX(e.clientX,e.clientY);
    const mm=ev=>setX(ev.clientX,ev.clientY), mu=()=>{ el.classList.remove("drag"); window.removeEventListener("mousemove",mm); window.removeEventListener("mouseup",mu); if(o.done) o.done() };
    window.addEventListener("mousemove",mm); window.addEventListener("mouseup",mu) });
  el.addEventListener("keydown",e=>{ const d={ArrowRight:.02,ArrowUp:.02,ArrowLeft:-.02,ArrowDown:-.02}[e.key]; if(d){ e.preventDefault(); o.set(clamp(o.get()+d,0,1)); paint(); if(o.done) o.done() } });
  el.setAttribute("aria-valuemin","0"); el.setAttribute("aria-valuemax","100");
  paint(); return {paint};
}

/* ================= לוח צליל (נפתח לפי בקשה) ================= */
const sideEl=$("#side"), soundBtn=$("#soundBtn");
const soundOpen=()=>!sideEl.hidden;
function openSound(on){ sideEl.hidden=!on; soundBtn.classList.toggle("on",on); soundBtn.setAttribute("aria-expanded",on) }
onTap(soundBtn,()=>openSound(!soundOpen()));
onTap($("#sideClose"),()=>openSound(false));

/* ================= טלפון: לשוניות תופים, עמודים, תפריט ================= */
const isPhone=()=>matchMedia("(max-width:600px) and (orientation:portrait),(max-height:500px) and (orientation:landscape)").matches;
const tabsEl=$("#tabs"), tabs=[];
PARTS.forEach((p,pi)=>{ const b=document.createElement("button"); b.type="button"; b.className="tab"; b.textContent=p.name; b.style.setProperty("--c",`var(${p.col})`); tabs.push(b); tabsEl.appendChild(b);
  onTap(b,()=>{ S.sel=pi; partUI(); save(true); ensureAudio().then(ok=>{ if(ok) audition(pi) }) }) });
let page=0;
onTap($("#selM"),()=>{ const pp=S.parts[PARTS[S.sel].id]; pp.mute=!pp.mute; mixUI(); save() });
onTap($("#selS"),()=>{ const pp=S.parts[PARTS[S.sel].id]; pp.solo=!pp.solo; mixUI(); save() });
const moreOpen=on=>{ document.body.classList.toggle("more",on); $("#moreBtn").classList.toggle("on",on) };
onTap($("#moreBtn"),()=>moreOpen(!document.body.classList.contains("more")));
onTap($("#moreClose"),()=>moreOpen(false));
// בטלפון הזיכרון ו"נקה" עוברים לתפריט, ובאייפד חוזרים למקומם
{ const sr=$(".slotrow"), home=$(".seqhead"), top=$(".top"), mc=$("#moreClose"), ed=$("#edits");
  const place=()=>{ if(isPhone()){ top.insertBefore(sr,mc) } else { home.insertBefore(sr,ed); moreOpen(false) } };
  matchMedia("(max-width:600px) and (orientation:portrait)").addEventListener("change",place);
  matchMedia("(max-height:500px) and (orientation:landscape)").addEventListener("change",place); place() }

/* ================= רשת הצעדים ================= */
const gridEl=$("#grid"), cells=[], rows=[], names=[], mBtns=[], sBtns=[];
PARTS.forEach((p,pi)=>{
  const row=document.createElement("div"); row.className="row"; row.style.setProperty("--c",`var(${p.col})`); rows.push(row);
  const ph=document.createElement("div"); ph.className="ph";
  const nm=document.createElement("button"); nm.type="button"; nm.className="nm"; nm.textContent=p.name; nm.title=p.full||p.name; names.push(nm);
  const bx=document.createElement("span"); bx.className="btns";
  const m=document.createElement("button"); m.type="button"; m.className="btn ms m"; m.textContent="M"; m.title="השתק"; m.setAttribute("aria-label","השתק "+p.name); mBtns.push(m);
  const s=document.createElement("button"); s.type="button"; s.className="btn ms s"; s.textContent="S"; s.title="סולו"; s.setAttribute("aria-label","סולו "+p.name); sBtns.push(s);
  bx.append(m,s); ph.append(nm,bx); row.appendChild(ph);
  cells.push([]);
  for(let i=0;i<STEPS;i++){ const c=document.createElement("div"); c.className="st"+(i%4===0?" b":"")+(i>=8?" h2":""); c.dataset.pi=pi; c.dataset.i=i; if(i%4===0) c.dataset.n=i+1; const j=i%8; c.style.setProperty("--gc",3+Math.floor(i/4)*5+i%4); c.style.setProperty("--pc",3+Math.floor(j/4)*5+j%4); c.style.setProperty("--pr",1+Math.floor(i/8)); row.appendChild(c); cells[pi].push(c) }
  gridEl.appendChild(row);
  onTap(nm,()=>{ if(S.sel===pi&&!soundOpen()) openSound(true); S.sel=pi; partUI(); save(true); ensureAudio().then(ok=>{ if(ok) audition(pi) }) });
  onTap(m,()=>{ const pp=S.parts[p.id]; pp.mute=!pp.mute; mixUI(); save() });
  onTap(s,()=>{ const pp=S.parts[p.id]; pp.solo=!pp.solo; mixUI(); save() });
});
/* עמודים: כל עמוד הוא תיבה של עד 16 צעדים. התאים בעמוד הם תמיד 16 מקומות, ומציגים את צעדי העמוד הנוכחי */
const nPages=()=>Math.ceil(S.len/STEPS), pageLen=p=>Math.min(STEPS,S.len-p*STEPS), absOf=j=>page*STEPS+j;
function paintCell(pi,j){ const c=cells[pi][j], vis=j<pageLen(page); c.hidden=!vis; if(!vis) return; const a=absOf(j), v=grid()[pi][a];
  c.classList.toggle("on",v===1); c.classList.toggle("acc",v===2); if(j%4===0) c.dataset.n=a+1 }
function gridUI(){ if(page>=nPages()) page=nPages()-1; for(let pi=0;pi<NP;pi++) for(let j=0;j<STEPS;j++) paintCell(pi,j); gridEl.dataset.plen=pageLen(page); mixUI(); pagesUI() }
const pagesEl=$("#pages"), pageBtns=[];
function pagesUI(){ const n=nPages();
  while(pageBtns.length<n){ const p=pageBtns.length, b=document.createElement("button"); b.type="button"; b.className="pg";
    b.innerHTML='<b dir="ltr"></b><span class="mini" dir="ltr"></span><i class="ph2"></i>'; const mini=b.querySelector(".mini"); for(let k=0;k<STEPS;k++) mini.appendChild(document.createElement("i"));
    onTap(b,()=>{ page=p; if(playing&&S.follow){ S.follow=false; followUI() } curCol=-1; gridUI(); save(true) }); pageBtns.push(b); pagesEl.appendChild(b) }
  pageBtns.forEach((b,p)=>{ b.hidden=p>=n; if(p>=n) return; const L=pageLen(p), a0=p*STEPS; b.querySelector("b").textContent=(a0+1)+"–"+(a0+L); b.classList.toggle("cur",p===page);
    const minis=b.querySelector(".mini").children, g=grid(); let any=false;
    for(let k=0;k<STEPS;k++){ let h=0; if(k<L) for(let pi=0;pi<NP;pi++) h=Math.max(h,g[pi][a0+k]); minis[k].className=k>=L?"x":h===2?"a":h?"o":""; if(h) any=true }
    b.classList.toggle("empty",!any) });
  pagesEl.dataset.n=n; $("#lenBtn").textContent="אורך "+S.len }
function followUI(){ const b=$("#follow"); b.classList.toggle("on",S.follow); b.setAttribute("aria-pressed",S.follow) }
onTap($("#follow"),()=>{ S.follow=!S.follow; followUI(); save(true); toast(S.follow?"העמוד עוקב אחרי הנגינה":"העמוד נשאר במקום בזמן נגינה") });
function mixUI(){
  const anySolo=PARTS.some(p=>S.parts[p.id].solo);
  PARTS.forEach((p,pi)=>{ const pp=S.parts[p.id]; mBtns[pi].classList.toggle("on",pp.mute); sBtns[pi].classList.toggle("on",pp.solo);
    rows[pi].classList.toggle("dimmed",pp.mute||(anySolo&&!pp.solo)||energyGain(pi)<=0); names[pi].classList.toggle("sel",pi===S.sel); rows[pi].classList.toggle("selrow",pi===S.sel); if(tabs[pi]){ tabs[pi].classList.toggle("sel",pi===S.sel); tabs[pi].classList.toggle("dimmed",pp.mute||(anySolo&&!pp.solo)) } });
  { const pp=S.parts[PARTS[S.sel].id]; $("#selM").classList.toggle("on",pp.mute); $("#selS").classList.toggle("on",pp.solo) }
}
let curCol=-1, curAbs=-1;
function nowStep(a){ // a: מספר הצעד בתבנית, או -1
  if(a>=0&&S.follow&&playing){ const p=Math.floor(a/STEPS); if(p!==page&&p<nPages()){ page=p; curCol=-1; gridUI() } }
  if(a!==curAbs){ const pp=curAbs>=0?Math.floor(curAbs/STEPS):-1, np=a>=0?Math.floor(a/STEPS):-1;
    if(pp>=0&&pageBtns[pp]) pageBtns[pp].classList.remove("play"); if(np>=0&&pageBtns[np]){ pageBtns[np].classList.add("play"); pageBtns[np].style.setProperty("--ph",((a%STEPS)+.5)/pageLen(np)) } curAbs=a }
  const j=(a>=0&&Math.floor(a/STEPS)===page)?a%STEPS:-1;
  if(j===curCol) return; if(curCol>=0) for(let pi=0;pi<NP;pi++) cells[pi][curCol].classList.remove("now"); curCol=j; if(j>=0) for(let pi=0;pi<NP;pi++) cells[pi][j].classList.add("now") }
/* ביטול וחזרה: תמונת מצב של התבניות והאורך לפני כל שינוי */
let past=[], future=[];
const snapPat=()=>JSON.stringify({vars:S.vars,len:S.len,cur:S.cur});
function pushUndo(){ past.push(snapPat()); if(past.length>200) past.shift(); future=[]; undoUI() }
function restorePat(js){ const o=JSON.parse(js); S.vars=o.vars; S.len=o.len; S.cur=o.cur; pendingVar=-1; gridUI(); varsUI(); save() }
function undo(){ if(!past.length){ toast("אין מה לבטל"); return } future.push(snapPat()); restorePat(past.pop()); undoUI() }
function redo(){ if(!future.length){ toast("אין מה להחזיר"); return } past.push(snapPat()); restorePat(future.pop()); undoUI() }
function undoUI(){ $("#undo").disabled=!past.length; $("#redo").disabled=!future.length }
onTap($("#undo"),undo); onTap($("#redo"),redo);
const flashT=[];
function flashRow(pi){ const c=names[pi]; c.style.filter="brightness(1.7)"; clearTimeout(flashT[pi]); flashT[pi]=setTimeout(()=>c.style.filter="",90) }
// ציור באצבע: נגיעה מחליפה כבוי → דלוק → מודגש → כבוי, גרירה מעתיקה את אותו מצב לצעדים בשורה
const paints=new Map();
const stepAt=(x,y)=>{ const el=document.elementFromPoint(x,y); return el&&el.closest?el.closest(".st"):null };
function paintStart(id,x,y){
  const el=stepAt(x,y); if(!el) return false;
  const pi=+el.dataset.pi, j=+el.dataset.i, i=absOf(j), g=grid(), nv=(g[pi][i]+1)%3;
  killUndo(); pushUndo(); g[pi][i]=nv; paintCell(pi,j); pagesUI(); paints.set(id,{pi,val:nv,last:j}); save();
  if(nv&&!playing) audition(pi,nv);
  return true;
}
function paintMove(id,x,y){
  const p=paints.get(id); if(!p) return; const el=stepAt(x,y); if(!el||+el.dataset.pi!==p.pi) return;
  const j=+el.dataset.i; if(j===p.last) return; p.last=j; const g=grid(), i=absOf(j);
  if(g[p.pi][i]!==p.val){ g[p.pi][i]=p.val; paintCell(p.pi,j); pagesUI(); save(); if(p.val&&!playing) audition(p.pi,p.val) }
}
gridEl.addEventListener("touchstart",e=>{ let used=false;
  for(const t of e.changedTouches){ if(t.target.closest&&t.target.closest(".st")){ used=paintStart("t"+t.identifier,t.clientX,t.clientY)||used } }
  if(used) e.preventDefault() },{passive:false});
gridEl.addEventListener("touchmove",e=>{ e.preventDefault(); for(const t of e.changedTouches) paintMove("t"+t.identifier,t.clientX,t.clientY) },{passive:false});
const gEnd=e=>{ for(const t of e.changedTouches) paints.delete("t"+t.identifier) };
gridEl.addEventListener("touchend",gEnd); gridEl.addEventListener("touchcancel",gEnd);
document.addEventListener("touchend",e=>{ const alive=new Set(Array.from(e.touches).map(t=>"t"+t.identifier)); for(const k of paints.keys()) if(k[0]==="t"&&!alive.has(k)) paints.delete(k) },true);
gridEl.addEventListener("mousedown",e=>{ if(fromTouch()||e.button!==0||!e.target.closest(".st")) return; e.preventDefault(); paintStart("m",e.clientX,e.clientY);
  const mm=ev=>paintMove("m",ev.clientX,ev.clientY), mu=()=>{ paints.delete("m"); window.removeEventListener("mousemove",mm); window.removeEventListener("mouseup",mu) };
  window.addEventListener("mousemove",mm); window.addEventListener("mouseup",mu) });

/* ================= וריאציות, מוטציה וניקוי ================= */
const VN=["א","ב","ג","ד"];
function varsUI(){ $$(".var").forEach(b=>{ const i=+b.dataset.var; b.classList.toggle("cur",i===S.cur); b.classList.toggle("next",i===pendingVar&&i!==S.cur) }) }
function pickVar(i){ killUndo(); if(playing&&i!==S.cur){ pendingVar=i; varsUI(); return } pendingVar=-1; S.cur=i; gridUI(); varsUI(); save() }
$$(".var").forEach(b=>{ const i=+b.dataset.var; let tm=0, long=false;
  onHold(b,()=>{ long=false; b.classList.add("arming"); clearTimeout(tm); tm=setTimeout(()=>{ long=true; b.classList.remove("arming"); copyVar(i) },600) },
    cancel=>{ clearTimeout(tm); b.classList.remove("arming"); if(!long&&!cancel) pickVar(i) }) });
function copyVar(i){
  if(i===S.cur){ toast("זו הוריאציה שמנגנת עכשיו. החזק וריאציה אחרת כדי להעתיק אליה"); return }
  killUndo(); pushUndo(); S.vars[i]=S.vars[S.cur].map(r=>r.slice()); save();
  toast(`${VN[S.cur]} הועתקה אל ${VN[i]}`,"בטל",undo,true);
}
const rnd=n=>Math.floor(Math.random()*n);
function mutate(){
  killUndo(); pushUndo(); const g=grid(), W=[.12,.14,.26,.16,.16,.16], n=3+rnd(3);
  for(let k=0;k<n;k++){
    let r=Math.random(), pi=0; for(;pi<NP-1;pi++){ r-=W[pi]; if(r<0) break }
    const i=page*STEPS+rnd(pageLen(page)), op=Math.random();
    if(pi===0&&i%8===0&&g[0][i]){ g[0][i]=g[0][i]===2?1:2; continue } // הבעיטות על הפעמות הראשיות נשארות
    if(op<.45) g[pi][i]=g[pi][i]?0:1;
    else if(op<.75){ const on=[]; for(let j=page*STEPS;j<page*STEPS+pageLen(page);j++) if(g[pi][j]&&!(pi===0&&j%8===0)) on.push(j);
      if(on.length){ const j=on[rnd(on.length)], d=Math.random()<.5?-1:1, t=(j+d+S.len)%S.len; if(!g[pi][t]){ g[pi][t]=g[pi][j]; g[pi][j]=0 } } }
    else if(g[pi][i]) g[pi][i]=g[pi][i]===2?1:2; else g[pi][i]=1;
  }
  gridUI(); save(); toast("מוטציה קטנה בעמוד הזה","בטל",undo,true);
}
onTap($("#mutate"),mutate);
/* ================= גיליון "תבנית ונקה" ואישורים ================= */
function sheet(id,on){ $(id).hidden=!on }
function patUI(){ $$("#lens .opt").forEach(b=>b.classList.toggle("on",+b.dataset.v===S.len)); const P=PARTS[S.sel];
  $("#clrPart").textContent="נקה את "+(P.full||P.name); $("#clrPart").style.setProperty("--c",`var(${P.col})`);
  $("#copyNext").textContent=page<nPages()-1?`העתק עמוד ${page+1} לעמוד ${page+2}`:`העתק עמוד ${page+1} לעמוד חדש`; $("#clrPage").textContent=`נקה את עמוד ${page+1}`; $("#patVar").textContent=VN[S.cur] }
onTap($("#patBtn"),()=>{ patUI(); sheet("#pat",true) }); onTap($("#lenBtn"),()=>{ patUI(); sheet("#pat",true) });
$("#patClose").addEventListener("click",()=>sheet("#pat",false)); $("#pat").addEventListener("click",e=>{ if(e.target.id==="pat") sheet("#pat",false) });
LENS.forEach(n=>{ const b=document.createElement("button"); b.type="button"; b.className="btn opt"; b.dataset.v=n; b.textContent=n; $("#lens").appendChild(b);
  b.addEventListener("click",()=>setLen(n)) });
function setLen(n){ if(n===S.len) return; pushUndo(); S.len=n; if(page>=nPages()) page=nPages()-1; pos%=S.len; gridUI(); patUI(); save(); toast(`אורך התבנית: ${n} צעדים (${nPages()} ${nPages()>1?"עמודים":"עמוד"})`,"בטל",undo,true) }
let cfmFn=null;
function confirmSheet(title,body,ok,fn){ $("#cfmTitle").textContent=title; $("#cfmBody").textContent=body; $("#cfmOk").textContent=ok; cfmFn=fn; sheet("#pat",false); sheet("#cfm",true) }
$("#cfmOk").addEventListener("click",()=>{ sheet("#cfm",false); const f=cfmFn; cfmFn=null; if(f) f() });
$("#cfmNo").addEventListener("click",()=>{ sheet("#cfm",false); cfmFn=null });
function act(id,fn){ $(id).addEventListener("click",()=>{ fn() }) }
act("#copyNext",()=>{ const p=page, L=pageLen(p); pushUndo();
  if(p>=nPages()-1){ const nl=LENS.find(x=>x>=(p+1)*STEPS+L)||MAXS; if(nl<=S.len||(p+1)*STEPS>=MAXS){ toast("אין מקום לעמוד נוסף (64 צעדים לכל היותר)"); past.pop(); undoUI(); return } S.len=nl }
  const g=grid(); for(let pi=0;pi<NP;pi++) for(let k=0;k<STEPS;k++){ const d=(p+1)*STEPS+k; if(d<MAXS) g[pi][d]=k<L?g[pi][p*STEPS+k]:0 }
  page=p+1; gridUI(); save(); sheet("#pat",false); toast(`עמוד ${p+1} הועתק לעמוד ${p+2}`,"בטל",undo,true) });
act("#clrPart",()=>{ pushUndo(); grid()[S.sel].fill(0); gridUI(); save(); sheet("#pat",false); toast(`${PARTS[S.sel].full||PARTS[S.sel].name} נוקה בכל התבנית`,"בטל",undo,true) });
act("#clrPage",()=>{ pushUndo(); const g=grid(); for(let pi=0;pi<NP;pi++) for(let k=0;k<pageLen(page);k++) g[pi][page*STEPS+k]=0; gridUI(); save(); sheet("#pat",false); toast(`עמוד ${page+1} נוקה`,"בטל",undo,true) });
act("#clrAll",()=>confirmSheet("לנקות את כל התופים?",`כל הצעדים בוריאציה ${VN[S.cur]} יימחקו, בכל העמודים. אפשר לבטל אחר כך עם ↶.`,"כן, נקה הכול",()=>{
  pushUndo(); S.vars[S.cur]=emptyVar(); gridUI(); save(); toast(`וריאציה ${VN[S.cur]} נקייה`,"בטל",undo,true) }));
act("#newPat",()=>confirmSheet("תבנית חדשה?","מתחילים מדף ריק: כל ארבע הווריאציות מתרוקנות, אורך 16 צעדים. הצלילים נשארים. אפשר לבטל עם ↶.","כן, תבנית חדשה",()=>{
  pushUndo(); S.vars=[0,1,2,3].map(emptyVar); S.len=16; S.cur=0; page=0; pendingVar=-1; gridUI(); varsUI(); save(); toast("דף חדש. מציירים!","בטל",undo,true) }));
act("#rstSnd",()=>{ const prev=JSON.stringify({parts:S.parts,swing:S.swing,drive:S.drive}); const d=defaults(); S.parts=d.parts; S.swing=d.swing; S.drive=d.drive; applySound(); allUI(); save(); sheet("#pat",false);
  toast("הצלילים חזרו לברירת המחדל","בטל",()=>{ const o=JSON.parse(prev); Object.assign(S,o); applySound(); allUI(); save() },true) });
act("#factory",()=>confirmSheet("איפוס מלא?","הכול חוזר להתחלה: תבניות הדוגמה, הצלילים, הקצב, האורך והזיכרונות 1–4. ההקלטות נשארות. אי אפשר לבטל.","כן, אפס הכול",()=>{
  try{ localStorage.removeItem(KEY); localStorage.removeItem(SKEY) }catch(e){} slots=[null,null,null,null]; curSlot=-1; S=defaults(); page=0; past=[]; future=[]; pendingVar=-1;
  setBpmUI(); allUI(); applySound(); slotsUI(); undoUI(); save(true); toast("הכול חזר להתחלה") }));

/* ================= אנרגיה, מילוי, סווינג, לכלוך, עוצמה ================= */
const ticks=$("#energy .ticks");
PARTS.forEach(p=>{ if(!p.th) return; const s=document.createElement("span"); s.style.setProperty("--p",p.th); s.style.background=`var(${p.col})`; s.title=p.full||p.name; ticks.appendChild(s) });
{ const s=document.createElement("span"); s.style.setProperty("--p",GHOST_TH); s.style.background="var(--fg)"; s.title="קישוטים"; ticks.appendChild(s) }
const energySl=slider($("#energy"),{get:()=>S.energy,set:v=>{ S.energy=v; mixUI(); $("#layers").textContent=layersText() },done:()=>save(),show:()=>{ $("#layers").textContent=layersText() }});
const sliders={energy:energySl};
sliders.swing=slider($('.sld[data-key="swing"]'),{get:()=>S.swing,set:v=>{ S.swing=v },done:()=>save(),show:v=>{ $("#o_swing").textContent=Math.round(50+v*25)+"%" }});
sliders.drive=slider($('.sld[data-key="drive"]'),{get:()=>S.drive,set:v=>{ S.drive=v; E.setDrive(v) },done:()=>save(),show:v=>{ $("#o_drive").textContent=Math.round(v*100) }});
sliders.vol=slider($('.sld[data-key="vol"]'),{get:()=>S.vol,set:v=>{ S.vol=v; E.setVolume(v) },done:()=>save(true),show:v=>{ $("#o_vol").textContent=Math.round(v*100) }});

const fillBtn=$("#fill"), fillFill=$("#fillFill");
function fillUI(){ fillFill.style.transform=`scaleX(${fill.held||fill.tail?Math.max(fill.amt,.04):0})`; fillBtn.classList.toggle("held",fill.held&&fill.amt>.2); fillBtn.classList.toggle("land",fill.tail&&!fill.held) }
onHold(fillBtn,()=>{ if(!playing){ toast("המילוי עובד בזמן נגינה"); return } fill.held=true; fill.tail=false; fillUI() },
  ()=>{ if(!fill.held) return; fill.held=false; fill.tail=playing; fillUI() });

/* ================= צליל התוף שנבחר ================= */
const PCTL=[["level","עוצמה"],["decay","דעיכה"],["pitch","גובה"],["tone","צבע"],["cut","פילטר"],["dly","דיליי"],["rev","ריוורב"],["nudge","תזמון"]];
const partCtls={};
PCTL.forEach(([k,label])=>{
  const d=document.createElement("div"); d.className="ctl"+(k==="nudge"?" wide":"");
  d.innerHTML=`<label><span class="ln"></span> <output></output></label><div class="sld${k==="nudge"?" center":""}" role="slider" tabindex="0"><div class="fill"></div><div class="thumb"></div></div>`;
  $("#partCtls").appendChild(d);
  d.querySelector(".ln").textContent=label;
  const out=d.querySelector("output"), sl=d.querySelector(".sld"); sl.setAttribute("aria-label",label);
  const sel=()=>S.parts[PARTS[S.sel].id];
  let audT=0;
  partCtls[k]={d,sl:slider(sl,{center:k==="nudge",get:()=>sel()[k],set:v=>{ sel()[k]=v; if(!playing&&k!=="nudge"){ clearTimeout(audT); audT=setTimeout(()=>audition(S.sel),90) } },done:()=>save(),show:v=>{ out.textContent=showVal(k,v) }})};
});
function showVal(k,v){
  const id=PARTS[S.sel].id;
  if(k==="nudge"){ const ms=Math.round((v-.5)*2*NUDGE*1000); return ms===0?"בזמן":ms<0?`${-ms} מוקדם`:`${ms} מאוחר` }
  if(k==="pitch"){ if(id==="kick") return Math.round(36+v*52)+"Hz"; if(id==="tom") return Math.round(70+v*230)+"Hz" }
  if(k==="cut") return v>=.99?"פתוח":Math.round(80*Math.pow(250,v))+"Hz";
  return Math.round(v*100)+"";
}
function partUI(){
  const p=PARTS[S.sel]; $("#partCard").style.setProperty("--c",`var(${p.col})`); $("#partName").textContent=p.full||p.name;
  partCtls.tone.d.querySelector(".ln").textContent=p.tone;
  for(const [k] of PCTL) partCtls[k].sl.paint();
  mixUI();
}
onTap($("#audition"),()=>{ ensureAudio().then(ok=>{ if(ok) audition(S.sel) }) });

/* ================= קצב ================= */
function setBpm(v,fromSync){ const b=clamp(Math.round(fin(v,S.bpm)*10)/10,60,200); if(b===S.bpm) return; S.bpm=b; $("#bpmVal").textContent=Math.round(b); E.setTempo(b); save(true); if(!fromSync&&clock.enabled()) clock.tempo(S.bpm) }
function repeat(el,fn){ let tm=0; onHold(el,()=>{ fn(); clearTimeout(tm); tm=setTimeout(function r(){ fn(); tm=setTimeout(r,70) },380) },()=>clearTimeout(tm)) }
repeat($("#bpmDown"),()=>setBpm(Math.round(S.bpm)-1)); repeat($("#bpmUp"),()=>setBpm(Math.round(S.bpm)+1));
let taps=[];
onHold($("#tap"),()=>{ const t=performance.now(); if(taps.length&&t-taps[taps.length-1]>2000) taps=[]; taps.push(t); if(taps.length>6) taps.shift();
  if(taps.length>=3){ const d=(taps[taps.length-1]-taps[0])/(taps.length-1); if(d>0) setBpm(Math.round(60000/d)) } },()=>{});
onTap($("#play"),togglePlay);

/* ================= סנכרון עם הכלים האחרים ================= */
const clock=window.MusicLessonsClock.create({app:"groove",on:{
  hello:()=>{ clock.state(playing,S.bpm,playing?epochOf(barStartT):0) },
  state:m=>{ if(m.bpm) setBpm(m.bpm,true); if(m.playing&&m.at&&!playing) follow(m.at) },
  tempo:m=>{ if(m.bpm) setBpm(m.bpm,true) },
  start:m=>{ if(m.bpm) setBpm(m.bpm,true); ignoreBars=false; if(m.at) follow(m.at) },
  stop:()=>{ if(playing&&!leader) stop(true); else if(playing) stop(true) },
  bar:m=>{ if(m.bpm) setBpm(m.bpm,true); if(!m.at) return; if(!playing){ if(!ignoreBars) follow(m.at) } else if(!leader) align(m.at); else { leader=false; align(m.at); syncUI() } }
}});
function follow(at){ // מצטרפים לשעון של מישהו אחר, בדיוק על הצעד הנכון
  if(!E.running()){ toast("כלי אחר מנגן. גע במסך כדי להצטרף","הצטרף",()=>{ ensureAudio().then(ok=>{ if(ok) follow(at) }) }); return }
  const sd=stepDur(), t0=ctxOf(at), now=E.now()+.05;
  if(playing){ leader=false; align(at); syncUI(); return }
  const k=Math.max(0,Math.ceil((now-t0)/sd)); leader=false;
  fill.held=false; fill.tail=false; fill.amt=0;
  beginAt(t0+k*sd,k%STEPS);
}
function align(at){
  const sd=stepDur(), barD=sd*STEPS, t0=ctxOf(at);
  let d=((nextT-step*sd-t0)%barD+barD)%barD; if(d>barD/2) d-=barD;
  if(Math.abs(d)>.004) { nextT-=d; barStartT-=d }
}
function syncUI(){ const b=$("#sync"), on=clock.enabled(); b.classList.toggle("on",on); b.classList.toggle("follow",on&&playing&&!leader); b.setAttribute("aria-pressed",on) }
onTap($("#sync"),()=>{
  if(!clock.available()){ toast("הדפדפן הזה לא תומך בסנכרון בין חלונות"); return }
  const on=clock.setEnabled(!clock.enabled()); try{ localStorage.setItem("groove2-sync",on?"1":"0") }catch(e){}
  syncUI(); toast(on?"סנכרון פעיל: הקצב וההפעלה משותפים עם כלים פתוחים אחרים באתר":"סנכרון כבוי");
  if(on&&playing){ leader=true; clock.start(S.bpm,epochOf(barStartT+stepDur()*STEPS)) }
});
try{ if(localStorage.getItem("groove2-sync")==="1") clock.setEnabled(true) }catch(e){}

/* ================= זיכרון ================= */
const SKEY="groove2-slots-v1";
let slots=[null,null,null,null], curSlot=-1;
try{ const a=JSON.parse(localStorage.getItem(SKEY)); if(Array.isArray(a)) slots=[0,1,2,3].map(i=>(a[i]&&typeof a[i]==="object")?sanitize(a[i]):null) }catch(e){}
function saveSlots(){ try{ localStorage.setItem(SKEY,JSON.stringify(slots)); return true }catch(e){ return false } }
function slotsUI(){ $$(".slot").forEach(b=>{ const i=+b.dataset.slot; b.classList.toggle("full",!!slots[i]); b.classList.toggle("cur",i===curSlot) }) }
function snapshot(){ const o=JSON.parse(JSON.stringify(S)); delete o.vol; return o }
function saveSlot(i){ killUndo(); const old=slots[i]; slots[i]=snapshot(); curSlot=i; slotsUI();
  if(!saveSlots()) toast("השמירה לא נכתבה לדפדפן. היא תחזיק עד שתסגור את הדף");
  else if(old) toast(`זיכרון ${i+1} הוחלף`,"בטל",()=>{ slots[i]=old; saveSlots(); if(curSlot===i) curSlot=-1; slotsUI() },true);
  else toast(`נשמר בזיכרון ${i+1}`) }
function loadSlot(i){ if(!slots[i]) return; killUndo(); pushUndo(); const v=sanitize(slots[i]), vol=S.vol; S=v; S.vol=vol; pendingVar=-1; paints.clear();
  setBpmUI(); allUI(); applySound(); if(clock.enabled()) clock.tempo(S.bpm); curSlot=i; slotsUI(); save(true) }
$$(".slot").forEach(b=>{ const i=+b.dataset.slot; let tm=0, long=false;
  onHold(b,()=>{ long=false; b.classList.add("arming"); clearTimeout(tm); tm=setTimeout(()=>{ long=true; b.classList.remove("arming"); saveSlot(i) },650) },
    cancel=>{ clearTimeout(tm); b.classList.remove("arming"); if(long||cancel) return; if(slots[i]) loadSlot(i); else toast(`זיכרון ${i+1} ריק. החזק אותו כדי לשמור בו`) }) });

/* ================= איפוס ================= */
let resetArm=0;
onTap($("#reset"),()=>{
  const now=Date.now();
  if(now-resetArm>3000){ resetArm=now; E.reset(); applySound(); toast("הצליל אותחל. גע שוב באיפוס כדי להחזיר גם את הצלילים וההגדרות להתחלה"); return }
  resetArm=0; killUndo(); const keep=S.vars, cur=S.cur, d=defaults(); d.vars=keep; d.cur=cur; d.vol=S.vol; S=d; setBpmUI(); allUI(); applySound(); save();
  toast("הצלילים וההגדרות חזרו להתחלה. התבניות נשארו");
});

/* ================= הקלטת מה שמנגנים ================= */
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
    if(!playing) toast("מקליט. לחץ נגן כדי שיהיה מה לשמוע");
  } finally { recBusy=false }
}
function stopRec(){ const r=recr; if(!r) return; recr=null; r.__end(); clearInterval(recTick); recUI(); try{ if(r.state!=="inactive") r.stop() }catch(e){} if(!playing) setWake(false) }
function finishRec(r,chunks,dur){
  if(r.__done) return; r.__done=true;
  const type=(r.mimeType||(chunks[0]&&chunks[0].type)||"audio/mp4").split(";")[0], blob=new Blob(chunks,{type}); chunks.length=0;
  if(blob.size<2000||dur<1){ toast("ההקלטה קצרה מדי ולא נשמרה"); return }
  const t={id:Date.now()+"-"+Math.floor(Math.random()*1e6),name:`גרוב ${++takeSeq}`,type,dur,created:Date.now(),blob};
  takes.unshift(t); recUI(); renderTakes();
  t.saving=dbPut(t).then(ok=>{ if(ok&&playId!==t.id) t.blob=null; toast(ok?`${t.name} נשמרה במכשיר`:`${t.name} נשמרה עד שתסגור את הדף`,"פתח",openTakes); return ok });
}
onTap($("#rec"),()=>{ recr?stopRec():startRec() });

const TDB="groove2-rec"; let dbP=null;
function getDb(){ if(!dbP) dbP=new Promise(res=>{ try{ if(!window.indexedDB) return res(null); const q=indexedDB.open(TDB,1);
  q.onupgradeneeded=()=>{ try{ q.result.createObjectStore("meta",{keyPath:"id"}); q.result.createObjectStore("data",{keyPath:"id"}) }catch(e){} };
  q.onsuccess=()=>res(q.result); q.onerror=()=>res(null); q.onblocked=()=>res(null) }catch(e){ res(null) } }); return dbP }
const txDone=tx=>new Promise(res=>{ tx.oncomplete=()=>res(true); tx.onerror=tx.onabort=()=>res(false) });
async function dbPut(t){ const db=await getDb(); if(!db) return false; const meta={id:t.id,name:t.name,type:t.type,dur:t.dur,created:t.created};
  try{ const tx=db.transaction(["meta","data"],"readwrite"); tx.objectStore("data").put({id:t.id,blob:t.blob}); tx.objectStore("meta").put(meta); if(await txDone(tx)) return true }catch(e){}
  try{ const buf=await t.blob.arrayBuffer(); const tx=db.transaction(["meta","data"],"readwrite"); tx.objectStore("data").put({id:t.id,buf,type:t.type}); tx.objectStore("meta").put(meta); return await txDone(tx) }catch(e){ return false } }
async function dbDel(id){ const db=await getDb(); if(!db) return; try{ const tx=db.transaction(["meta","data"],"readwrite"); tx.objectStore("meta").delete(id); tx.objectStore("data").delete(id); await txDone(tx) }catch(e){} }
async function dbMeta(){ const db=await getDb(); if(!db) return []; return new Promise(res=>{ try{ const q=db.transaction("meta","readonly").objectStore("meta").getAll();
  q.onsuccess=()=>res((q.result||[]).filter(x=>x&&x.id).map(x=>({id:String(x.id),name:String(x.name||"גרוב"),type:String(x.type||"audio/mp4"),dur:fin(x.dur,0),created:fin(x.created,0),blob:null})));
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
  const ext=/mp4/.test(t.type)?"m4a":"webm", n=(/(\d+)\s*$/.exec(t.name)||[0,1])[1], fname=`groove-${n}.${ext}`;
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
onTap($("#takesBtn"),openTakes);
$("#takesClose").addEventListener("click",closeTakes);
$("#takes").addEventListener("click",e=>{ if(e.target.id==="takes") closeTakes() });

/* ================= מקלדת (כשיש) ================= */
document.addEventListener("keydown",e=>{
  if(e.key==="Escape"&&!$("#takes").hidden){ closeTakes(); return }
  if(e.target.closest&&e.target.closest("button,.sld")) return;
  if(e.code==="Space"&&$("#gate").hidden){ e.preventDefault(); togglePlay() }
});

/* ================= לולאת ציור ================= */
const meterFill=$("#meterFill"); let mPeak=0, lastFill=-1;
function frame(){
  if(E.ctx()){ const now=E.now(); while(visQ.length&&visQ[0].t<=now){ const v=visQ.shift(); nowStep(v.i); for(const pi of v.lit) flashRow(pi) } }
  if(!playing) nowStep(-1);
  const fk=(fill.held?1:0)+(fill.tail?2:0)+fill.amt; if(fk!==lastFill){ lastFill=fk; fillUI() }
  const lv=E.level(); mPeak=Math.max(lv>0?Math.min(1,lv*3.2):0,mPeak*.9); meterFill.style.transform=`scaleY(${mPeak})`;
  requestAnimationFrame(frame);
}

/* ================= פתיחה ================= */
function setBpmUI(){ $("#bpmVal").textContent=Math.round(S.bpm) }
function allUI(){ gridUI(); varsUI(); partUI(); followUI(); undoUI(); for(const k in sliders) sliders[k].paint(); $("#layers").textContent=layersText(); fillUI() }
$("#start").addEventListener("click",async()=>{
  const ok=await ensureAudio(); $("#gate").hidden=true;
  if(ok) audition(0); else toast("גע בנגן כדי להפעיל צליל");
});
(()=>{ const ios=/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
  const standalone=navigator.standalone||(window.matchMedia&&matchMedia("(display-mode: standalone)").matches);
  if(ios&&!standalone) $("#installHint").hidden=false })();
window.addEventListener("error",()=>{ toast("משהו השתבש. אם אין צליל, גע ב־↻ איפוס") });
setBpmUI(); allUI(); slotsUI(); recUI(); syncUI();
requestAnimationFrame(frame);
if("serviceWorker" in navigator&&location.protocol==="https:") addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));

/* בדיקה: רינדור תיבה אחת בלי רמקול, עם אותם קולות ואותה שרשרת יציאה */
window.GrooveDebug={
  state:()=>JSON.parse(JSON.stringify(S)),
  level:()=>E.level(),
  page:()=>({page,pages:nPages(),len:S.len,follow:S.follow,undo:past.length,redo:future.length}),
  clock:()=>({playing,leader,bpm:S.bpm,barEpoch:epochOf(barStartT),barDur:stepDur()*STEPS*1000}),
  renderBar:async(opts)=>{
    opts=opts||{}; const sd=stepDur(), hits=[];
    for(let i=0;i<STEPS;i++){ const F=opts.fill?{on:true,amt:opts.fill,land:false}:null;
      for(const h of stepHits(i,0,F)) hits.push({part:PARTS[h.pi].id,t:Math.max(0,.02+i*sd+swingOf(i)+h.dt*sd+nudgeOf(h.pi)),v:h.v,p:hitParams(h.pi,h)}) }
    const buf=await E.render(hits,sd*STEPS+.8);
    let peak=0, sum=0, n=0, nan=0; for(let c=0;c<buf.numberOfChannels;c++){ const d=buf.getChannelData(c); for(let k=0;k<d.length;k++){ const x=d[k]; if(x!==x){ nan++; continue } const a=Math.abs(x); if(a>peak) peak=a; sum+=x*x; n++ } }
    return {hits:hits.length,seconds:buf.duration,peak,rms:Math.sqrt(sum/Math.max(1,n)),nan};
  }
};
})();
