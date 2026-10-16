/* במה 3 — בונים שיר ומנגנים אותו. בסיס: במה 2 (אותו מנוע צליל: ladder, דיליי קלטת, לימיטר).
   חדש: עורך תופים/בס (16 צעדים), סידור שיר מקטעים (גרירה + כפתורים), מצב שיר/לולאה, הדרכה ראשונה, שמירה/טעינה. */
(function(){
"use strict";
var $=function(i){return document.getElementById(i);}, $$=function(s,r){return [].slice.call((r||document).querySelectorAll(s));};
var NOTE=["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"], MINOR=[0,2,3,5,7,8,10];
var INST=[{k:"k",he:"בעיטה",en:"KICK"},{k:"c",he:"מחיאה",en:"CLAP"},{k:"h",he:"מצילה סגורה",en:"HAT"},{k:"o",he:"מצילה פתוחה",en:"OPEN HAT"},{k:"p",he:"כלי הקשה",en:"PERC"}];
var NAMES=["פתיחה","בנייה","דרופ","שבירה","סיום"];
function fromStr(s){ return s.split("").map(function(ch){ return ch==="x"?1:0; }); }
function defDrums(){ var src=[
 {k:"x...x...x...x...",c:"................",h:"................",o:"..x...x...x...x.",p:"................"},
 {k:"x...x...x...x...",c:"....x.......x...",h:"x...x...x...x..x",o:"..x...x...x...x.",p:"................"},
 {k:"x...x...x...x...",c:"....x.......x..x",h:"xx.xxx.xxx.xxx.x",o:"..x...x...x...x.",p:"..x..x....x..x.."},
 {k:"x..x..x...x.x...",c:"....x.......x...",h:"x..x..x.x..x.x..",o:"..x..x...x....xx",p:".x...x.x...x..x."}];
  return src.map(function(d){ var o={}; INST.forEach(function(I){ o[I.k]=fromStr(d[I.k]); }); return o; }); }
function genBass(kind){ var dens=[0.55,0.75,0.65,0.85][kind], out=[];
  for(var i=0;i<16;i++){ var down=i%4===0, off=i%4===2, on=i===0||Math.random()<dens*(down?1.1:off?1.15:0.85);
    var w=[0,0,0,4,4,2,6,7,-1,3], d=i===0?0:w[Math.floor(Math.random()*w.length)];
    out.push({d:d,o:Math.random()<0.18+kind*0.06?1:0,gate:on,acc:Math.random()<(off?0.45:0.25),slide:Math.random()<0.22}); }
  return out; }
function sec(name,b,d,e,bars,mutes){ return {name:name,b:b,d:d,e:e,bars:bars,mutes:mutes||{}}; }
function defSong(){ return [sec("פתיחה",0,0,35,4,{bass:true}),sec("בנייה",1,1,55,4),sec("דרופ",2,2,85,8),sec("שבירה",0,0,30,4,{kick:true}),sec("דרופ",3,3,90,8),sec("סיום",1,0,40,4,{clap:true})]; }
var st={bpm:134,key:9,bass:[],drums:defDrums(),song:defSong(),cur:0,songMode:true,energy:55,fat:false};
for(var k=0;k<4;k++) st.bass[k]=genBass(k);
function save(){ try{ localStorage.setItem("bama3",JSON.stringify(st)); }catch(e){} }
try{ var L=JSON.parse(localStorage.getItem("bama3")||"null"); if(L&&L.bass&&L.bass.length===4&&L.song&&L.song.length&&L.drums) Object.assign(st,L); }catch(e){}
if(st.cur>=st.song.length) st.cur=0;
function S(){ return st.song[st.cur]; }
var ctx=null,M=null,recDest=null,playing=false,leading=false,selfStopped=false;
var qB=-1,qD=-1,qSec=-1,dropQ=false,building=false,stut=false,solo=null,barIn=0,mode="play",sel=-1;
function midi(s){ var n=MINOR.length,o=Math.floor(s.d/n),i=((s.d%n)+n)%n; return 36+st.key+12*(o+s.o)+MINOR[i]; }
function nn(m){ return NOTE[m%12]+(Math.floor(m/12)-1); }
function vib(){ if(navigator.vibrate) navigator.vibrate(6); }
function toast(m){ var t=$("toast"); t.textContent=m; t.classList.add("on"); clearTimeout(toast.t); toast.t=setTimeout(function(){ t.classList.remove("on"); },1600); }
function el(tag,cls,html){ var e=document.createElement(tag); if(cls) e.className=cls; if(html!=null) e.innerHTML=html; return e; }
function btn(cls,html,fn){ var b=el("button","btn "+(cls||""),html); b.type="button"; if(fn) b.addEventListener("click",function(e){ unlock(); vib(); fn(e); }); return b; }
function nextIdx(){ if(qSec>=0) return qSec; if(!st.songMode) return st.cur; return (st.cur+1)%st.song.length; }

/* ---------- lanes ---------- */
var lb=[],ld=[];
for(var i=0;i<16;i++){ var a=document.createElement("i"); $("laneB").appendChild(a); lb.push(a); var b=document.createElement("i"); $("laneD").appendChild(b); ld.push(b); if(i%4===0){ a.className=b.className="q"; } }
function renderLanes(){ var p=st.bass[S().b], d=st.drums[S().d];
  for(var i=0;i<16;i++){ var s=p[i]; lb[i].textContent=s.gate?nn(midi(s)).replace(/\d/,""):""; lb[i].classList.toggle("on",s.gate); lb[i].classList.toggle("acc",s.gate&&s.acc); lb[i].classList.toggle("sl",s.gate&&s.slide);
    ld[i].textContent=d.k[i]?"●":d.c[i]?"✶":""; ld[i].classList.toggle("on",!!(d.k[i]||d.c[i])); } }

/* ---------- song strip ---------- */
function secSub(s){ return '<bdi dir="ltr">'+"ABCD"[s.b]+"·"+"ABCD"[s.d]+"</bdi> · "+s.bars+" תיבות"; }
function renderStrip(){ var sp=$("strip"); sp.innerHTML="";
  st.song.forEach(function(s,i){ var c=el("div","sec"); c.dataset.i=i;
    if(i===st.cur) c.classList.add("cur"); if(playing&&i===nextIdx()&&i!==st.cur) c.classList.add("next"); if(qSec===i) c.classList.add("queued"); if(sel===i&&mode==="edit") c.classList.add("sel");
    var h=el("span","handle","⠿"); h.setAttribute("aria-label","גרור כדי להזיז"); c.appendChild(h);
    var body=el("button","sbody",'<span class="sn"><bdi class="ix" dir="ltr">'+(i+1)+'</bdi> '+esc(s.name)+'</span><span class="ss">'+secSub(s)+'</span>'); body.type="button";
    if(i===st.cur&&playing){ var pr=el("i","prog"); pr.style.width=Math.min(100,barIn/s.bars*100)+"%"; body.appendChild(pr); }
    body.addEventListener("click",function(){ unlock(); vib(); secTap(i); });
    c.appendChild(body); sp.appendChild(c); dragify(h,c); });
  var cur=sp.children[st.cur]; if(cur&&cur.scrollIntoView&&!dragging) try{ cur.scrollIntoView({block:"nearest",inline:"nearest"}); }catch(e){} }
function esc(s){ return String(s).replace(/[&<>"]/g,function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); }
function secTap(i){ if(mode==="edit"){ sel=i; openSection(i); return; }
  if(playing){ qSec=(qSec===i)?-1:i; if(qSec===st.cur) qSec=-1; renderUI(); toast(qSec>=0?"עובר ל־"+st.song[i].name+" בתחילת התיבה הבאה":"בוטל"); }
  else { goSec(i); } }
function goSec(i){ st.cur=i; barIn=0; qB=qD=-1; $("energy").value=S().e; applyKnobs(); applyMutes(); renderUI(); save(); }
/* drag reorder (pointer events: touch, pen, mouse) */
var dragging=null;
function dragify(h,card){
  h.addEventListener("pointerdown",function(e){ e.preventDefault(); e.stopPropagation(); try{ h.setPointerCapture(e.pointerId); }catch(_){}
    var from=+card.dataset.i; dragging={id:e.pointerId,from:from,to:from,card:card,x0:e.clientX}; card.classList.add("drag"); vib(); });
  h.addEventListener("pointermove",function(e){ if(!dragging||e.pointerId!==dragging.id) return; e.preventDefault();
    var cards=$$(".sec",$("strip")), to=dragging.from;
    dragging.card.style.transform="translateX("+(e.clientX-dragging.x0)+"px)";
    cards.forEach(function(c,i){ if(c===dragging.card) return; var r=c.getBoundingClientRect(), mid=r.left+r.width/2;
      // strip runs right-to-left: card i sits to the left of card i-1
      if(i>dragging.from && e.clientX<mid) to=Math.max(to,i); if(i<dragging.from && e.clientX>mid) to=Math.min(to,i); });
    dragging.to=to; cards.forEach(function(c,i){ c.classList.toggle("drop-at",i===to&&to!==dragging.from); });
    var sp=$("strip"), r=sp.getBoundingClientRect(); if(e.clientX<r.left+30) sp.scrollLeft-=12; else if(e.clientX>r.right-30) sp.scrollLeft+=12; });
  function end(e){ if(!dragging||e.pointerId!==dragging.id) return; var d=dragging; dragging=null; d.card.style.transform=""; d.card.classList.remove("drag");
    if(d.to!==d.from){ moveSec(d.from,d.to); toast("הקטע הוזז למקום "+(d.to+1)); } else renderStrip(); }
  h.addEventListener("pointerup",end); h.addEventListener("pointercancel",end); }
function moveSec(from,to){ if(to<0||to>=st.song.length||from===to) return; var curObj=S(), selObj=st.song[sel], qObj=st.song[qSec];
  var s=st.song.splice(from,1)[0]; st.song.splice(to,0,s);
  st.cur=st.song.indexOf(curObj); sel=selObj?st.song.indexOf(selObj):-1; qSec=qObj?st.song.indexOf(qObj):-1; renderUI(); save(); }

/* ---------- main render ---------- */
function renderUI(quiet){ var s=S();
  $$(".clip").forEach(function(b){ var p=b.dataset.p,i=+b.dataset.i,cur=p==="b"?s.b:s.d,q=p==="b"?qB:qD;
    b.setAttribute("aria-pressed",i===cur?"true":"false"); b.classList.toggle("queued",i===q&&i!==cur); });
  $$(".mute").forEach(function(b){ var m=b.dataset.m; b.classList.toggle("muted",!!s.mutes[m]); b.classList.toggle("solo",solo===m); });
  $("build").setAttribute("aria-pressed",building?"true":"false"); $("drop").classList.toggle("queued",dropQ);
  $("nowName").textContent=(st.cur+1)+". "+s.name; $("nowBars").textContent=playing?("תיבה \u2066"+Math.min(barIn+1,s.bars)+"/"+s.bars+"\u2069"):(s.bars+" תיבות");
  var n=nextIdx(); $("nextName").textContent=!playing?"(עצור)":(qSec>=0?"⏳ "+(n+1)+". "+st.song[n].name:(st.songMode?(n===0&&st.cur===st.song.length-1?"↺ ":"")+(n+1)+". "+st.song[n].name:"⟳ חוזר על הקטע"));
  $("songModeL").textContent=st.songMode?"שיר ⇠":"לולאה ⟳"; $("songMode").setAttribute("aria-pressed",st.songMode);
  $("hint").textContent=mode==="edit"?"מצב עריכה: לחיצה על קליף פותחת את העורך שלו. לחיצה על קטע בשיר פותחת את ההגדרות שלו.":(st.songMode?"מצב שיר: הקטעים מתנגנים לפי הסדר. לחיצה על קטע = קפיצה אליו. קליף מתחלף בתחילת התיבה.":"מצב לולאה: הקטע הנוכחי חוזר שוב ושוב. קליף מתחלף בתחילת התיבה.");
  $("app").dataset.mode=mode; $$(".modes [data-mode]").forEach(function(b){ b.setAttribute("aria-pressed",b.dataset.mode===mode); });
  if(!dragging) renderStrip(); renderLanes(); if(sheetKind&&!quiet) refreshSheet(); }
function applyMutes(){ if(!M) return; var m=S().mutes; ["kick","clap","hats","bass"].forEach(function(k){ M.mute(k,solo?solo!==k:!!m[k]); }); }

/* ---------- audio ---------- */
function unlock(){ BamaEngine.playbackSession(); lastTouch=Date.now(); if(ctx){ if(ctx.state!=="running") ctx.resume(); return; }
  var c=ctx=new (window.AudioContext||window.webkitAudioContext)({latencyHint:"interactive"});
  var b=c.createBuffer(1,1,22050),s=c.createBufferSource(); s.buffer=b; s.connect(c.destination); s.start(0);
  var ready=(c.audioWorklet&&c.audioWorklet.addModule)?c.audioWorklet.addModule("ladder.js").then(function(){ return true; },function(){ return false; }):Promise.resolve(false);
  ready.then(function(ok){ if(ctx!==c) return;
    M=BamaEngine.build(c,c.destination,ok); M.tempo(st.bpm); applyKnobs(); applyMutes(); M.xy(xy.x,xy.y); M.bass.set("fat",st.fat);
    if(c.createMediaStreamDestination){ recDest=c.createMediaStreamDestination(); M.out.connect(recDest); } }); }
var lastTouch=0, wdBad=0, wdLast=0, wbuf=new Float32Array(512);
function rebuild(msg){ var was=playing; try{ ctx.close(); }catch(e){} ctx=null; M=null; recDest=null; unlock(); if(was){ playing=false; start(); } toast(msg); }
setInterval(function(){ if(!ctx||!M||document.hidden) return;
  M.analyser.getFloatTimeDomainData(wbuf); for(var i=0;i<wbuf.length;i++){ if(!isFinite(wbuf[i])){ if(Date.now()-wdLast>3000){ wdLast=Date.now(); rebuild("נמצאה תקלה בצליל, הצליל אותחל"); } return; } }
  if(ctx.state!=="running"){ try{ ctx.resume(); }catch(e){} if(Date.now()-lastTouch<8000) wdBad++; else wdBad=0;
    if(wdBad>=3&&Date.now()-wdLast>10000){ wdBad=0; wdLast=Date.now(); rebuild("הצליל הופעל מחדש"); } } else wdBad=0; },1000);
function T16(){ return 60/st.bpm/4; }
var t0=0,tick=0,nextT=0,prevSlide=false,stutAt=0,buildBar=0;
function epochFromCtx(t){ var ts=ctx.getOutputTimestamp?ctx.getOutputTimestamp():null; if(ts&&ts.performanceTime) return performance.timeOrigin+ts.performanceTime+(t-ts.contextTime)*1000; return clock.epoch()+(t-ctx.currentTime)*1000; }
function ctxFromEpoch(at){ var ts=ctx.getOutputTimestamp?ctx.getOutputTimestamp():null; if(ts&&ts.performanceTime) return ts.contextTime+(at-(performance.timeOrigin+ts.performanceTime))/1000; return ctx.currentTime+(at-clock.epoch())/1000; }
function E(){ return S().e/100; }
function playStep(t,s16,bar){
  var s0=S(), d=st.drums[s0.d], e=E(), dur=T16(), A=function(v){ return v===2?1.3:1; };
  var kickOn=d.k[s16] && !(building&&bar-buildBar>=1);
  if(kickOn) M.kick(t,d.k[s16]===2?1.2:1);
  var clap=d.c[s16]?A(d.c[s16]):0;
  if(building){ var b=bar-buildBar; clap=(b<1?s16%4===0&&s16%8!==0:b<2?s16%2===0:true)?0.5+0.5*Math.min(1,(bar-buildBar)/3):0; }
  if(clap) M.clap(t,clap);
  var hv=0.6+e*0.5;
  if(d.o[s16]) M.hat(t,true,hv*A(d.o[s16]));
  else if(d.h[s16]){ if(!(e<0.3&&d.h[s16]===1&&s16%4!==0)) M.hat(t,false,hv*A(d.h[s16])); }
  else if(e>0.8&&s16%2) M.hat(t,false,hv*0.6);
  if(d.p[s16]) M.perc(t,Math.max(0.4,e)*A(d.p[s16]));
  var s=st.bass[s0.b][s16];
  if(s.gate){ M.bass.step(t,dur,{midi:midi(s),acc:s.acc,slide:s.slide},prevSlide); prevSlide=s.slide; } else { if(prevSlide) M.bass.silence(t); prevSlide=false; }
}
function onBar(t,bar){
  var ch=false, prevCur=st.cur;
  if(qSec>=0){ st.cur=qSec; qSec=-1; barIn=0; qB=qD=-1; ch=true; }
  else if(bar>0){ barIn++; if(barIn>=S().bars){ barIn=0; if(st.songMode){ st.cur=(st.cur+1)%st.song.length; qB=qD=-1; } } ch=true; }
  if(qB>=0){ S().b=qB; qB=-1; ch=true; } if(qD>=0){ S().d=qD; qD=-1; ch=true; }
  if(dropQ){ dropQ=false; building=false; M.riserStop(t); M.impact(t); ch=true; }
  var moved=st.cur!==prevCur;
  if(moved){ applyKnobsSec(); }
  if(ch){ var delay=Math.max(0,(t-ctx.currentTime)*1000); setTimeout(function(){ if(moved){ $("energy").value=S().e; } applyMutes(); renderUI(true); save(); },delay); }
  if(leading&&clock.enabled()) clock.bar(st.bpm,epochFromCtx(t),bar);
}
var nowStep=-1;
function loop(){
  if(playing&&ctx&&M){ var now=ctx.currentTime;
    if(nextT<now-0.05){ tick=Math.ceil((now-t0)/T16()); nextT=t0+tick*T16(); }
    while(nextT<now+0.1){ var s16=tick%16, bar=Math.floor(tick/16);
      if(s16===0) onBar(nextT,bar);
      var ps=stut?stutAt+(tick-stutAt)%2:tick;
      playStep(nextT,((ps%16)+16)%16,bar);
      (function(i,t){ setTimeout(function(){ nowStep=i; lb.forEach(function(c,j){ c.classList.toggle("now",j===i); }); ld.forEach(function(c,j){ c.classList.toggle("now",j===i); });
        $$(".stepcol.now").forEach(function(c){ c.classList.remove("now"); }); $$('.stepcol[data-s="'+i+'"]').forEach(function(c){ c.classList.add("now"); }); },Math.max(0,(t-now)*1000)); })(((ps%16)+16)%16,nextT);
      tick++; nextT+=T16(); }
  }
  setTimeout(loop,20);
}
function setPlayBtns(){ ["play","shPlay"].forEach(function(id){ $(id).setAttribute("aria-pressed",playing?"true":"false"); $(id).textContent=playing?"■":"▶"; }); }
function start(at){ unlock(); playing=true; t0=at||ctx.currentTime+0.06; tick=0; nextT=t0; prevSlide=false; barIn=0; setPlayBtns(); renderUI(); }
function stop(){ playing=false; building=false; dropQ=false; qSec=-1; if(M&&ctx){ M.bass.silence(ctx.currentTime); M.riserStop(ctx.currentTime); } setPlayBtns();
  $$(".now").forEach(function(c){ if(c.tagName==="I"||c.classList.contains("stepcol")) c.classList.remove("now"); }); renderUI(); }
function toggle(){ if(playing){ stop(); selfStopped=true; if(leading) clock.stop(); leading=false; } else { start(); if(clock.enabled()){ leading=true; clock.start(st.bpm,epochFromCtx(t0)); } } }
$("play").addEventListener("click",toggle); $("shPlay").addEventListener("click",toggle);
var clock=MusicLessonsClock.create({app:"bama",on:{
  hello:function(){ if(playing&&leading) clock.state(true,st.bpm,epochFromCtx(t0)); },
  tempo:function(m){ if(m.bpm) setBpm(m.bpm,true); },
  start:function(m){ follow(m,true); }, bar:function(m){ follow(m,false); }, state:function(m){ if(m.playing) follow(m,false); },
  stop:function(){ if(!leading&&playing) stop(); } }});
function follow(m,isStart){ if(isStart) selfStopped=false; if(selfStopped&&!playing) return; if(!m.at) return; unlock(); leading=false;
  if(!ctx||!M){ return; }
  if(m.bpm&&Math.abs(m.bpm-st.bpm)>0.01) setBpm(m.bpm,true);
  var t=ctxFromEpoch(m.at), bar=T16()*16; while(t>ctx.currentTime+bar) t-=bar;
  if(!playing){ while(t<ctx.currentTime) t+=bar; start(t); return; } var sh=((t0-t)%bar+bar)%bar; if(sh>bar/2) sh-=bar; if(Math.abs(sh)>0.004){ t0-=sh; nextT=0; } }
function setBpm(b,remote){ b=Math.max(70,Math.min(170,Math.round(b))); if(playing&&ctx){ var n=(ctx.currentTime-t0)/T16(); st.bpm=b; t0=ctx.currentTime-n*T16(); nextT=0; } else st.bpm=b;
  $("bpmVal").textContent=b; if(M) M.tempo(b); if(!remote) clock.tempo(b); save(); }

/* ---------- controls ---------- */
function longPress(el,shortFn,longFn){ var t=null,long=false;
  el.addEventListener("pointerdown",function(e){ e.preventDefault(); unlock(); long=false; t=setTimeout(function(){ long=true; vib(); longFn(); },480); });
  el.addEventListener("pointerup",function(){ clearTimeout(t); if(!long){ vib(); shortFn(); } });
  el.addEventListener("pointercancel",function(){ clearTimeout(t); }); }
function rep(id,fn){ var el=$(id),iv,to; el.addEventListener("pointerdown",function(e){ e.preventDefault(); fn(); to=setTimeout(function(){ iv=setInterval(fn,70); },350); }); ["pointerup","pointerleave","pointercancel"].forEach(function(ev){ el.addEventListener(ev,function(){ clearTimeout(to); clearInterval(iv); }); }); }
rep("bpmDown",function(){ setBpm(st.bpm-1); }); rep("bpmUp",function(){ setBpm(st.bpm+1); });
NOTE.forEach(function(n,i){ var o=document.createElement("option"); o.value=i; o.textContent=n+"m"; $("key").appendChild(o); });
$("key").addEventListener("change",function(){ st.key=+this.value; renderUI(); save(); });
$$(".clip").forEach(function(b){ var p=b.dataset.p,i=+b.dataset.i;
  longPress(b,function(){ if(mode==="edit"){ openClip(p,i); return; }
      if(!playing){ if(p==="b") S().b=i; else S().d=i; renderUI(); save(); return; } if(p==="b") qB=i; else qD=i; renderUI(); },
    function(){ openClip(p,i); }); });
$$(".mute").forEach(function(b){ var m=b.dataset.m;
  longPress(b,function(){ if(solo){ solo=null; } else S().mutes[m]=!S().mutes[m]; applyMutes(); renderUI(); save(); },function(){ solo=solo===m?null:m; applyMutes(); renderUI(); }); });
$("build").addEventListener("click",function(){ unlock(); if(!playing||!M) return toast("קודם ▶"); vib();
  if(building){ building=false; M.riserStop(ctx.currentTime); renderUI(); return; }
  building=true; var nb=Math.ceil((ctx.currentTime-t0)/(T16()*16)); buildBar=nb; var at=t0+nb*T16()*16; M.riser(at,T16()*16*4); renderUI(); });
$("drop").addEventListener("click",function(){ unlock(); if(!playing||!M) return; vib(); dropQ=true; renderUI(); });
$$("#tabs [data-t]").forEach(function(b){ b.addEventListener("click",function(){ $("app").dataset.tab=b.dataset.t; $$("#tabs [data-t]").forEach(function(x){ x.setAttribute("aria-pressed",x===b); }); }); });
$$(".modes [data-mode]").forEach(function(b){ b.addEventListener("click",function(){ vib(); mode=b.dataset.mode; if(mode==="edit"){ $("app").dataset.tab="clips"; $$("#tabs [data-t]").forEach(function(x){ x.setAttribute("aria-pressed",x.dataset.t==="clips"); }); } renderUI(); toast(mode==="edit"?"מצב עריכה ✎":"מצב נגינה ▶"); }); });
$("songMode").addEventListener("click",function(){ vib(); st.songMode=!st.songMode; renderUI(); save(); toast(st.songMode?"מצב שיר: הקטעים מתנגנים לפי הסדר":"מצב לולאה: הקטע הנוכחי חוזר"); });
$("addSec").addEventListener("click",function(){ unlock(); vib(); var s=S(), n=sec(NAMES[st.song.length%NAMES.length],s.b,s.d,s.e,4,Object.assign({},s.mutes)); st.song.splice(st.cur+1,0,n); sel=st.cur+1; renderUI(); save(); toast("נוסף קטע"); if(mode==="edit") openSection(sel); });
function applyKnobsSec(){ if(!M) return; var e=E(); var cut=Math.min(1,+$("cutoff").value/100*0.8+e*0.25);
  M.bass.set("cutoff",cut); M.bass.set("envmod",0.3+e*0.5); M.bass.set("decay",0.25+e*0.3); M.bass.set("drive",0.15+e*0.35); }
function applyKnobs(){ if(!M) return; applyKnobsSec(); M.bass.set("res",+$("res").value/100); M.bass.set("accent",0.7); M.drive(+$("drive").value/100); M.vol(+$("vol").value/100); }
$("energy").addEventListener("input",function(){ S().e=+this.value; applyKnobs(); save(); renderStrip(); });
["cutoff","res","drive","vol"].forEach(function(id){ $(id).addEventListener("input",function(){ st[id]=+this.value; applyKnobs(); save(); }); });
/* XY master FX */
var xy={x:0.5,y:0}, xyEl=$("xy"), xyId=null;
function drawXY(){ $("dot").style.left=(xy.x*100)+"%"; $("dot").style.top=((1-xy.y)*100)+"%"; }
function xyMove(e){ var r=xyEl.getBoundingClientRect(); xy.x=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)); xy.y=Math.max(0,Math.min(1,1-(e.clientY-r.top)/r.height)); drawXY(); if(M) M.xy(xy.x,xy.y); }
xyEl.addEventListener("pointerdown",function(e){ e.preventDefault(); unlock(); xyId=e.pointerId; try{xyEl.setPointerCapture(e.pointerId);}catch(_){} xyEl.classList.add("on"); xyMove(e); });
xyEl.addEventListener("pointermove",function(e){ if(e.pointerId===xyId) xyMove(e); });
function xyUp(e){ if(e.pointerId!==xyId) return; xyId=null; xyEl.classList.remove("on"); xy={x:0.5,y:0}; drawXY(); if(M) M.xy(0.5,0); }
xyEl.addEventListener("pointerup",xyUp); xyEl.addEventListener("pointercancel",xyUp);
function hold(id,dn,upf){ var b=$(id); b.addEventListener("pointerdown",function(e){ e.preventDefault(); unlock(); b.classList.add("down"); vib(); dn(); });
  var u=function(){ if(b.classList.contains("down")){ b.classList.remove("down"); upf(); } }; ["pointerup","pointercancel","lostpointercapture"].forEach(function(ev){ b.addEventListener(ev,u); }); }
hold("stut",function(){ stut=true; stutAt=tick; },function(){ stut=false; });
hold("throw",function(){ if(M) M.throwOn(true); },function(){ if(M) M.throwOn(false); });
hold("wash",function(){ if(M) M.washOn(true); },function(){ if(M) M.washOn(false); });
hold("tape",function(){ if(M) M.tape(true,60/st.bpm*2); },function(){ if(M) M.tape(false); });
$("fat").addEventListener("click",function(){ st.fat=!st.fat; this.textContent=st.fat?"ON":"OFF"; this.setAttribute("aria-pressed",st.fat); if(M) M.bass.set("fat",st.fat); save(); });

/* ---------- sheets ---------- */
var sheetKind=null, sheetArg=null, page=0, bsel=0;
function openSheet(kind,arg,title){ sheetKind=kind; sheetArg=arg; $("shTitle").innerHTML=title; $("sheet").hidden=false; $("scrim").hidden=false; $("sheet").dataset.kind=kind; refreshSheet(); }
function closeSheet(){ sheetKind=null; $("sheet").hidden=true; $("scrim").hidden=true; renderUI(); }
$("shClose").addEventListener("click",closeSheet); $("scrim").addEventListener("click",closeSheet);
function perPage(){ var w=$("shBody").clientWidth||innerWidth, lw=w<600?0:(matchMedia("(min-width:700px) and (min-height:700px)").matches?110:70); return (w-lw-16*3)/16>=44?16:8; }
function refreshSheet(){ if(!sheetKind) return; var b=$("shBody"), sc=b.scrollTop; b.innerHTML="";
  if(sheetKind==="drum") drumEditor(b,sheetArg); else if(sheetKind==="bass") bassEditor(b,sheetArg); else if(sheetKind==="sec") secEditor(b,sheetArg); else if(sheetKind==="more") moreSheet(b);
  b.scrollTop=sc; }
function pager(b){ var pp=perPage(); if(pp===16){ page=0; return [0,16]; }
  var r=el("div","pager"); [0,1].forEach(function(p){ var x=btn("",'צעדים <bdi dir="ltr">'+(p?"9–16":"1–8")+"</bdi>",function(){ page=p; refreshSheet(); }); x.setAttribute("aria-pressed",page===p); r.appendChild(x); }); b.appendChild(r); return [page*8,page*8+8]; }
function stepHead(row,a,z){ row.appendChild(el("span","rh",'<span class="en">STEP</span>')); for(var i=a;i<z;i++){ var c=el("span","stepcol sn2"+(i%4===0?" beat":""),String(i+1)); c.dataset.s=i; row.appendChild(c); } }
function openClip(p,i){ if(p==="d") openSheet("drum",i,'עריכת תופים <bdi dir="ltr">'+"ABCD"[i]+'</bdi>'); else { bsel=0; openSheet("bass",i,'עריכת בס <bdi dir="ltr">'+"ABCD"[i]+'</bdi>'); } }
function inUse(kind,i){ var s=S(); return kind==="d"?s.d===i:s.b===i; }
function useRow(b,kind,i){ var r=el("div","userow"); var lab=inUse(kind,i)?'<span class="ok">✓ הקליף הזה מתנגן בקטע הנוכחי — שינויים נשמעים מיד</span>':'';
  r.appendChild(el("span","note",lab)); if(!inUse(kind,i)) r.appendChild(btn("pri","שים בקטע הנוכחי",function(){ if(kind==="d") S().d=i; else S().b=i; renderUI(); save(); }));
  ["A","B","C","D"].forEach(function(L,j){ var x=btn("ab",'<bdi dir="ltr">'+L+"</bdi>",function(){ openClip(kind,j); }); x.setAttribute("aria-pressed",j===i); r.appendChild(x); }); b.appendChild(r); }
function drumEditor(b,ci){ var d=st.drums[ci]; useRow(b,"d",ci);
  b.appendChild(el("p","legend",'הקשה מחליפה: כבוי → <span class="lg1">דולק</span> → <span class="lg2">מודגש <bdi class="en">ACCENT</bdi></span> → כבוי. צעד 1 משמאל.'));
  var rg=pager(b), a=rg[0], z=rg[1]; var g=el("div","dgrid"); g.dir="ltr"; g.style.setProperty("--n",z-a);
  var hr=el("div","drow head"); stepHead(hr,a,z); g.appendChild(hr);
  INST.forEach(function(I){ var r=el("div","drow"); r.appendChild(el("span","rh",'<span>'+I.he+'</span><bdi class="en">'+I.en+'</bdi>'));
    for(var i=a;i<z;i++){ (function(i){ var v=d[I.k][i], c=el("button","cell stepcol"+(i%4===0?" beat":"")+(v===1?" on":v===2?" acc":"")); c.type="button"; c.dataset.s=i; c.setAttribute("aria-label",I.he+" צעד "+(i+1));
      c.addEventListener("pointerdown",function(e){ e.preventDefault(); unlock(); vib(); d[I.k][i]=(d[I.k][i]+1)%3; if(I.k==="o"&&d.o[i]) d.h[i]=0; if(I.k==="h"&&d.h[i]) d.o[i]=0;
        if(!playing&&M&&d[I.k][i]) preview(I.k,d[I.k][i]); save(); renderLanes(); refreshSheet(); });
      r.appendChild(c); })(i); }
    g.appendChild(r); });
  b.appendChild(g);
  var t=el("div","tools"); t.appendChild(btn("","נקה הכול",function(){ INST.forEach(function(I){ d[I.k]=d[I.k].map(function(){ return 0; }); }); save(); renderUI(); }));
  t.appendChild(btn("","חזור למקור",function(){ st.drums[ci]=defDrums()[ci]; save(); renderUI(); })); b.appendChild(t); }
function preview(k,v){ var t=ctx.currentTime+0.01, a=v===2?1.3:1; if(k==="k") M.kick(t,v===2?1.2:1); else if(k==="c") M.clap(t,a); else if(k==="h") M.hat(t,false,a); else if(k==="o") M.hat(t,true,a); else M.perc(t,a); }
function bassEditor(b,ci){ var p=st.bass[ci]; useRow(b,"b",ci);
  var rg=pager(b), a=rg[0], z=rg[1]; if(bsel<a||bsel>=z) bsel=a;
  var g=el("div","bsteps"); g.dir="ltr"; g.style.setProperty("--n",z-a);
  for(var i=a;i<z;i++){ (function(i){ var s=p[i], c=el("button","bstep stepcol"+(i%4===0?" beat":"")+(s.gate?" on":"")+(s.gate&&s.acc?" acc":"")+(s.gate&&s.slide?" sl":"")+(i===bsel?" pick":""),
      '<small>'+(i+1)+'</small><b>'+(s.gate?nn(midi(s)):"—")+'</b>'); c.type="button"; c.dataset.s=i;
    c.addEventListener("click",function(){ unlock(); vib(); bsel=i; if(!playing&&M&&p[i].gate) bprev(p[i]); refreshSheet(); }); g.appendChild(c); })(i); }
  b.appendChild(g);
  var s=p[bsel], ins=el("div","insp");
  ins.appendChild(el("div","insh",'צעד <bdi dir="ltr">'+(bsel+1)+'</bdi>: '+(s.gate?'<bdi dir="ltr">'+nn(midi(s))+'</bdi>':"שקט")));
  var nr=el("div","notes"); nr.dir="ltr";
  for(var d=0;d<8;d++){ (function(d){ var m={d:d,o:s.o}, x=btn("nt"+(s.gate&&s.d===d?" sel":""),'<bdi dir="ltr">'+nn(midi(m)).replace(/-?\d+$/,"")+(d===7?"↑":"")+"</bdi>",function(){ s.d=d; s.gate=true; after(); }); nr.appendChild(x); })(d); }
  ins.appendChild(nr);
  var fr=el("div","flags");
  fr.appendChild(el("span","cap",'אוקטבה <bdi class="en">OCT</bdi>'));
  fr.appendChild(btn("sq","−",function(){ s.o=Math.max(-1,s.o-1); s.gate=true; after(); })); fr.appendChild(el("span","num",'<bdi dir="ltr">'+(s.o>0?"+":"")+s.o+'</bdi>')); fr.appendChild(btn("sq","+",function(){ s.o=Math.min(2,s.o+1); s.gate=true; after(); }));
  var x1=btn("fl",'שקט <bdi class="en">REST</bdi>',function(){ s.gate=!s.gate; after(); }); x1.setAttribute("aria-pressed",!s.gate); fr.appendChild(x1);
  var x2=btn("fl",'גלישה <bdi class="en">SLIDE</bdi>',function(){ s.slide=!s.slide; s.gate=true; after(); }); x2.setAttribute("aria-pressed",!!(s.gate&&s.slide)); fr.appendChild(x2);
  var x3=btn("fl",'הדגשה <bdi class="en">ACCENT</bdi>',function(){ s.acc=!s.acc; s.gate=true; after(); }); x3.setAttribute("aria-pressed",!!(s.gate&&s.acc)); fr.appendChild(x3);
  ins.appendChild(fr); b.appendChild(ins);
  function after(){ if(!playing&&M&&s.gate) bprev(s); save(); renderLanes(); refreshSheet(); }
  var t=el("div","tools"); t.appendChild(btn("",'◀ צעד קודם',function(){ bsel=(bsel+15)%16; page=Math.floor(bsel/8); refreshSheet(); })); t.appendChild(btn("",'צעד הבא ▶',function(){ bsel=(bsel+1)%16; page=Math.floor(bsel/8); refreshSheet(); }));
  t.appendChild(btn("","🎲 קו חדש",function(){ st.bass[ci]=genBass(ci); save(); renderUI(); })); t.appendChild(btn("","נקה",function(){ st.bass[ci]=st.bass[ci].map(function(x){ return {d:0,o:0,gate:false,acc:false,slide:false}; }); save(); renderUI(); }));
  b.appendChild(t); }
function bprev(s){ var t=ctx.currentTime+0.01; M.bass.step(t,T16()*2,{midi:midi(s),acc:s.acc,slide:false},false); }
function openSection(i){ sel=i; openSheet("sec",i,"הגדרות קטע"); }
function secEditor(b,i){ var s=st.song[i]; if(!s){ closeSheet(); return; }
  var top=el("div","srow"); top.appendChild(el("span","cap",'קטע <bdi dir="ltr">'+(i+1)+"/"+st.song.length+"</bdi>"));
  var inp=el("input","name"); inp.type="text"; inp.value=s.name; inp.maxLength=16; inp.setAttribute("aria-label","שם הקטע"); inp.addEventListener("change",function(){ s.name=inp.value.trim()||"קטע"; save(); renderStrip(); }); top.appendChild(inp); b.appendChild(top);
  var nm=el("div","chips"); NAMES.forEach(function(n){ var x=btn("chip",n,function(){ s.name=n; save(); renderUI(); }); x.setAttribute("aria-pressed",s.name===n); nm.appendChild(x); }); b.appendChild(nm);
  [["b",'קליף בס <bdi class="en">BASS</bdi>'],["d",'קליף תופים <bdi class="en">DRUMS</bdi>']].forEach(function(K){ var r=el("div","srow"); r.appendChild(el("span","cap",K[1])); var g=el("div","abcd"); g.dir="ltr";
    [0,1,2,3].forEach(function(j){ var x=btn("ab",'<bdi dir="ltr">'+"ABCD"[j]+"</bdi>",function(){ s[K[0]]=j; save(); if(i===st.cur) applyMutes(); renderUI(); }); x.setAttribute("aria-pressed",s[K[0]]===j); g.appendChild(x); });
    r.appendChild(g); r.appendChild(btn("ed","✎ ערוך",function(){ openClip(K[0],s[K[0]]); })); b.appendChild(r); });
  var mr=el("div","srow"); mr.appendChild(el("span","cap","מושתק")); var mg=el("div","abcd");
  [["kick","בעיטה"],["clap","מחיאה"],["hats","מצילות"],["bass","בס"]].forEach(function(m){ var x=btn("mt",m[1],function(){ s.mutes[m[0]]=!s.mutes[m[0]]; save(); if(i===st.cur) applyMutes(); renderUI(); }); x.setAttribute("aria-pressed",!!s.mutes[m[0]]); mg.appendChild(x); });
  mr.appendChild(mg); b.appendChild(mr);
  var er=el("div","srow"); er.appendChild(el("span","cap",'אנרגיה <bdi class="en">ENERGY</bdi>')); var rr=el("input"); rr.type="range"; rr.min=0; rr.max=100; rr.value=s.e;
  rr.addEventListener("input",function(){ s.e=+rr.value; if(i===st.cur){ $("energy").value=s.e; applyKnobs(); } save(); }); er.appendChild(rr); b.appendChild(er);
  var br=el("div","srow"); br.appendChild(el("span","cap","אורך בתיבות")); br.appendChild(btn("sq","−",function(){ s.bars=Math.max(1,s.bars-1); save(); renderUI(); }));
  br.appendChild(el("span","num",'<bdi dir="ltr">'+s.bars+"</bdi>")); br.appendChild(btn("sq","+",function(){ s.bars=Math.min(32,s.bars+1); save(); renderUI(); }));
  [1,2,4,8,16].forEach(function(n){ var x=btn("chip",String(n),function(){ s.bars=n; save(); renderUI(); }); x.setAttribute("aria-pressed",s.bars===n); br.appendChild(x); }); b.appendChild(br);
  var t=el("div","tools");
  var up=btn("",'→ מוקדם יותר',function(){ moveSec(i,i-1); sheetArg=sel; refreshSheet(); }); up.disabled=i===0; t.appendChild(up);
  var dn=btn("",'מאוחר יותר ←',function(){ moveSec(i,i+1); sheetArg=sel; refreshSheet(); }); dn.disabled=i===st.song.length-1; t.appendChild(dn);
  t.appendChild(btn("","⧉ שכפל",function(){ var c=JSON.parse(JSON.stringify(s)); st.song.splice(i+1,0,c); if(st.cur>i) st.cur++; sel=sheetArg=i+1; save(); renderUI(); toast("הקטע שוכפל"); }));
  var del=btn("danger","🗑 מחק",function(){ if(st.song.length<2) return toast("צריך לפחות קטע אחד"); var curObj=S(); st.song.splice(i,1); var ci=st.song.indexOf(curObj); st.cur=ci>=0?ci:Math.min(i,st.song.length-1); qSec=-1; sel=-1; save(); closeSheet(); goSec(st.cur); toast("הקטע נמחק"); }); t.appendChild(del);
  t.appendChild(btn("pri","▶ נגן מכאן",function(){ if(playing){ qSec=i===st.cur?-1:i; renderUI(); } else { goSec(i); toggle(); } }));
  b.appendChild(t); }
/* save / load + more */
function saves(){ try{ return JSON.parse(localStorage.getItem("bama3-saves")||"{}"); }catch(e){ return {}; } }
function moreSheet(b){ var r=el("div","srow"); var inp=el("input","name"); inp.type="text"; inp.placeholder="שם לסידור"; inp.maxLength=24; inp.setAttribute("aria-label","שם לסידור"); r.appendChild(inp);
  r.appendChild(btn("pri","💾 שמור",function(){ var n=inp.value.trim()||("סידור "+new Date().toLocaleString("he-IL",{day:"numeric",month:"numeric",hour:"2-digit",minute:"2-digit"})); var all=saves();
    all[n]={t:Date.now(),song:st.song,drums:st.drums,bass:st.bass,bpm:st.bpm,key:st.key}; try{ localStorage.setItem("bama3-saves",JSON.stringify(all)); toast("נשמר: "+n); }catch(e){ toast("השמירה נכשלה"); } refreshSheet(); }));
  b.appendChild(r);
  var all=saves(), keys=Object.keys(all).sort(function(x,y){ return all[y].t-all[x].t; }), list=el("div","saves");
  if(!keys.length) list.appendChild(el("p","note","עוד אין סידורים שמורים. הם נשמרים רק במכשיר הזה."));
  keys.forEach(function(k){ var row=el("div","srow"); row.appendChild(el("span","sname",esc(k)+' <small>'+all[k].song.length+" קטעים</small>"));
    row.appendChild(btn("pri","טען",function(){ var a=JSON.parse(JSON.stringify(all[k])); if(playing) stop(); st.song=a.song; st.drums=a.drums; st.bass=a.bass; st.key=a.key; $("key").value=st.key; setBpm(a.bpm); st.cur=0; goSec(0); toast("נטען: "+k); closeSheet(); }));
    row.appendChild(btn("danger","מחק",function(){ var x=saves(); delete x[k]; localStorage.setItem("bama3-saves",JSON.stringify(x)); refreshSheet(); })); list.appendChild(row); });
  b.appendChild(list);
  var t=el("div","tools");
  var sy=btn("",'⇄ סנכרון עם כלים אחרים',function(){ var on=clock.setEnabled(!clock.enabled()); if(on&&playing){ leading=true; clock.start(st.bpm,epochFromCtx(t0)); } st.sync=on; save(); refreshSheet(); }); sy.setAttribute("aria-pressed",clock.enabled()); t.appendChild(sy);
  var rc=btn("rec",rec?"⏹ עצור הקלטה":"⏺ הקלט",recToggle); rc.setAttribute("aria-pressed",!!rec); t.appendChild(rc);
  t.appendChild(btn("","? איך זה עובד",function(){ closeSheet(); onb(0); }));
  t.appendChild(btn("","שיר לדוגמה",function(){ st.song=defSong(); st.cur=0; goSec(0); toast("השיר לדוגמה נטען"); }));
  b.appendChild(t); }
$("moreBtn").addEventListener("click",function(){ unlock(); openSheet("more",null,"שמירה, טעינה ועוד"); });
var rec=null,chunks=[];
function recToggle(){ if(rec){ rec.stop(); return; } if(!recDest||!window.MediaRecorder){ toast("אין הקלטה בדפדפן הזה"); return; }
  var mt=["audio/mp4","audio/webm;codecs=opus","audio/webm"].filter(function(t){ return MediaRecorder.isTypeSupported&&MediaRecorder.isTypeSupported(t); })[0];
  chunks=[]; rec=new MediaRecorder(recDest.stream,mt?{mimeType:mt}:undefined); rec.ondataavailable=function(e){ if(e.data.size) chunks.push(e.data); };
  rec.onstop=function(){ var bl=new Blob(chunks,{type:rec.mimeType}),a=document.createElement("a"); a.href=URL.createObjectURL(bl); a.download="bama3-"+Date.now()+(rec.mimeType.indexOf("mp4")>=0?".m4a":".webm"); document.body.appendChild(a); a.click(); a.remove(); rec=null; toast("ההקלטה נשמרה"); refreshSheet(); };
  rec.start(); refreshSheet(); }

/* ---------- onboarding ---------- */
var CARDS=[
 ["🎛️","מה זה במה 3?","מכונה שבונה ומנגנת שיר אלקטרוני. יש בה <b>בס</b> ו<b>תופים</b>. לכל אחד 4 קצבים מוכנים: <bdi dir='ltr'>A B C D</bdi>. לוחצים ▶ ושומעים."],
 ["🧱","השיר בנוי מקטעים","בפס העליון יש את <b>הקטעים</b>: פתיחה, בנייה, דרופ... כל קטע = איזה בס, איזה תופים, כמה חזק, וכמה תיבות. במצב <b>שיר ⇠</b> הם מתנגנים לפי הסדר. במצב <b>לולאה ⟳</b> הקטע הנוכחי חוזר."],
 ["⠿","לשנות את הסדר","גוררים קטע בידית <b>⠿</b> ימינה או שמאלה. בעריכה יש גם כפתורי <b>מוקדם יותר / מאוחר יותר</b>, שכפול ומחיקה. ＋ מוסיף קטע."],
 ["✎","לשנות את הקצב בעצמך","עוברים ל־<b>✎ עריכה</b> ולוחצים על קליף. בתופים: נוגעים בריבוע כדי להדליק צעד (פעם שנייה = מודגש). בבס: בוחרים צעד ואז תו. שומעים את השינוי מיד."]];
var oi=0;
function onb(i){ oi=i; var c=CARDS[i]; $("onbCard").innerHTML='<div class="ic">'+c[0]+'</div><h2>'+c[1]+'</h2><p>'+c[2]+'</p>';
  $("onbDots").innerHTML=CARDS.map(function(_,j){ return '<i class="'+(j===i?"on":"")+'"></i>'; }).join(""); $("onbNext").textContent=i===CARDS.length-1?"יאללה, מתחילים":"הבא"; $("onb").hidden=false; }
function onbDone(){ $("onb").hidden=true; try{ localStorage.setItem("bama3-onb","1"); }catch(e){} }
$("onbNext").addEventListener("click",function(){ if(oi<CARDS.length-1) onb(oi+1); else onbDone(); }); $("onbSkip").addEventListener("click",onbDone);

/* init */
["cutoff","res","drive","vol"].forEach(function(id){ if(st[id]!=null) $(id).value=st[id]; });
$("key").value=st.key; $("bpmVal").textContent=st.bpm; $("energy").value=S().e; if(st.sync) clock.setEnabled(true);
$("fat").textContent=st.fat?"ON":"OFF"; $("fat").setAttribute("aria-pressed",!!st.fat); drawXY(); renderUI();
document.addEventListener("gesturestart",function(e){e.preventDefault();}); document.addEventListener("contextmenu",function(e){e.preventDefault();});
document.addEventListener("visibilitychange",function(){ if(!document.hidden&&ctx) ctx.resume(); });
addEventListener("resize",function(){ if(sheetKind) refreshSheet(); });
var _cs=setInterval(function(){ if(playing) { var p=document.querySelector(".sec.cur .prog"); if(p) p.style.width=Math.min(100,(barIn+((tick%16)/16))/S().bars*100)+"%"; } },120);
try{ if(!localStorage.getItem("bama3-onb")) onb(0); }catch(e){ onb(0); }
loop();
if("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(function(){});
window.__bama={st:st,M:function(){return M;},moveSec:moveSec};
})();
