/* במה 2 — לוח הופעה (אותו ממשק כמו bama/, מנוע משודרג): קליפים 4×4 שמתחלפים בתחילת תיבה, השתקה/סולו, זיכרון סצנות, BUILD/DROP, משטח FX, ENERGY. */
(function(){
"use strict";
var $=function(i){return document.getElementById(i);}, $$=function(s){return [].slice.call(document.querySelectorAll(s));};
var NOTE=["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"], MINOR=[0,2,3,5,7,8,10];
/* drums: K kick, C clap, H hats (1 closed, 2 open), P perc */
var DRUMS=[
 {k:"x...x...x...x...",c:"................",h:"..2...2...2...2.",p:"................"},
 {k:"x...x...x...x...",c:"....x.......x...",h:"1.2.1.2.1.2.1.21",p:"................"},
 {k:"x...x...x...x...",c:"....x.......x..x",h:"1121112111211121",p:"..x..x....x..x.."},
 {k:"x..x..x...x.x...",c:"....x.......x...",h:"1.21.121.21.1.22",p:".x...x.x...x..x."}];
var st={bpm:134,key:9,bass:[],clipB:0,clipD:0,mutes:{},mem:[null,null,null,null],energy:55,fat:false};
var ctx=null,M=null,recDest=null,playing=false,leading=false,selfStopped=false;
var qB=-1,qD=-1,qMem=-1,dropQ=false,building=false,stut=false,solo=null;
function midi(s){ var n=MINOR.length,o=Math.floor(s.d/n),i=((s.d%n)+n)%n; return 36+st.key+12*(o+s.o)+MINOR[i]; }
function nn(m){ return NOTE[m%12]+(Math.floor(m/12)-1); }
function genBass(kind){ var dens=[0.55,0.75,0.65,0.85][kind], out=[];
  for(var i=0;i<16;i++){ var down=i%4===0, off=i%4===2, on=i===0||Math.random()<dens*(down?1.1:off?1.15:0.85);
    var w=[0,0,0,4,4,2,6,7,-1,3], d=i===0?0:w[Math.floor(Math.random()*w.length)];
    out.push({d:d,o:Math.random()<0.18+kind*0.06?1:0,gate:on,acc:Math.random()<(off?0.45:0.25),slide:Math.random()<0.22}); }
  return out; }
for(var k=0;k<4;k++) st.bass[k]=genBass(k);
function save(){ try{ localStorage.setItem("bama2",JSON.stringify(st)); }catch(e){} }
try{ var L=JSON.parse(localStorage.getItem("bama2")||"null"); if(L&&L.bass&&L.bass.length===4) Object.assign(st,L); }catch(e){}

/* ---------- lanes (read-only 16-step view) ---------- */
var lb=[],ld=[];
for(var i=0;i<16;i++){ var a=document.createElement("i"); $("laneB").appendChild(a); lb.push(a); var b=document.createElement("i"); $("laneD").appendChild(b); ld.push(b); if(i%4===0){ a.className=b.className="q"; } }
function renderLanes(){ var p=st.bass[st.clipB], d=DRUMS[st.clipD];
  for(var i=0;i<16;i++){ var s=p[i]; lb[i].textContent=s.gate?nn(midi(s)).replace(/\d/,""):""; lb[i].classList.toggle("on",s.gate); lb[i].classList.toggle("acc",s.gate&&s.acc); lb[i].classList.toggle("sl",s.gate&&s.slide);
    ld[i].textContent=d.k[i]==="x"?"●":d.c[i]==="x"?"✶":""; ld[i].classList.toggle("on",d.k[i]==="x"||d.c[i]==="x"); } }
function renderUI(){ $$(".clip").forEach(function(b){ var p=b.dataset.p,i=+b.dataset.i,cur=p==="b"?st.clipB:st.clipD,q=p==="b"?qB:qD;
    b.setAttribute("aria-pressed",i===cur?"true":"false"); b.classList.toggle("queued",i===q&&i!==cur); });
  $$(".mute").forEach(function(b){ var m=b.dataset.m; b.classList.toggle("muted",!!st.mutes[m]); b.classList.toggle("solo",solo===m); });
  $$(".m").forEach(function(b,i){ b.classList.toggle("full",!!st.mem[i]); b.classList.toggle("queued",qMem===i); });
  $("build").setAttribute("aria-pressed",building?"true":"false"); $("drop").classList.toggle("queued",dropQ);
  renderLanes(); }
function applyMutes(){ if(!M) return; ["kick","clap","hats","bass"].forEach(function(k){ M.mute(k,solo?solo!==k:!!st.mutes[k]); }); }
function vib(){ if(navigator.vibrate) navigator.vibrate(6); }
function toast(m){ var t=$("toast"); t.textContent=m; t.classList.add("on"); clearTimeout(toast.t); toast.t=setTimeout(function(){ t.classList.remove("on"); },1400); }

/* ---------- audio ---------- */
function unlock(){ BamaEngine.playbackSession(); lastTouch=Date.now(); if(ctx){ if(ctx.state!=="running") ctx.resume(); return; }
  var c=ctx=new (window.AudioContext||window.webkitAudioContext)({latencyHint:"interactive"});
  var b=c.createBuffer(1,1,22050),s=c.createBufferSource(); s.buffer=b; s.connect(c.destination); s.start(0);
  var ready=(c.audioWorklet&&c.audioWorklet.addModule)?c.audioWorklet.addModule("ladder.js").then(function(){ return true; },function(){ return false; }):Promise.resolve(false);
  ready.then(function(ok){ if(ctx!==c) return;
    M=BamaEngine.build(c,c.destination,ok); M.tempo(st.bpm); applyKnobs(); applyMutes(); M.xy(xy.x,xy.y); M.bass.set("fat",st.fat);
    if(c.createMediaStreamDestination){ recDest=c.createMediaStreamDestination(); M.out.connect(recDest); } }); }
/* watchdog (from pendulum): NaN in the output = rebuild audio; stuck suspended context after a touch = resume, then rebuild */
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
function E(){ return st.energy/100; }
function playStep(t,s16,bar){
  var d=DRUMS[st.clipD], e=E(), dur=T16();
  var kickOn=d.k[s16]==="x" && !(building&&bar-buildBar>=1);
  if(kickOn) M.kick(t);
  var clap=d.c[s16]==="x";
  if(building){ var b=bar-buildBar; clap=b<1?s16%4===0&&s16%8!==0:b<2?s16%2===0:true; }
  if(clap) M.clap(t,building?0.5+0.5*Math.min(1,(bar-buildBar)/3):1);
  var h=d.h[s16]; if(e<0.35&&h==="1") h="."; if(e>0.75&&h==="."&&s16%2) h="1";
  if(h==="1") M.hat(t,false,0.6+e*0.5); else if(h==="2") M.hat(t,true,0.6+e*0.5);
  if(d.p[s16]==="x"&&e>0.3) M.perc(t,e);
  var s=st.bass[st.clipB][s16];
  if(s.gate){ M.bass.step(t,dur,{midi:midi(s),acc:s.acc,slide:s.slide},prevSlide); prevSlide=s.slide; } else { if(prevSlide) M.bass.silence(t); prevSlide=false; }
}
function onBar(t,bar){
  var ch=false;
  if(qMem>=0&&st.mem[qMem]){ var m=st.mem[qMem]; st.clipB=m.b; st.clipD=m.d; st.mutes=Object.assign({},m.mutes); st.energy=m.e; $("energy").value=m.e; applyKnobs(); qMem=-1; qB=qD=-1; ch=true; }
  if(qB>=0){ st.clipB=qB; qB=-1; ch=true; } if(qD>=0){ st.clipD=qD; qD=-1; ch=true; }
  if(dropQ){ dropQ=false; building=false; M.riserStop(t); M.impact(t); ch=true; }
  if(ch){ var delay=Math.max(0,(t-ctx.currentTime)*1000); setTimeout(function(){ applyMutes(); renderUI(); save(); },delay); }
  if(leading&&clock.enabled()) clock.bar(st.bpm,epochFromCtx(t),bar);
}
function loop(){
  if(playing&&ctx&&M){ var now=ctx.currentTime;
    if(nextT<now-0.05){ tick=Math.ceil((now-t0)/T16()); nextT=t0+tick*T16(); }
    while(nextT<now+0.1){ var s16=tick%16, bar=Math.floor(tick/16);
      if(s16===0) onBar(nextT,bar);
      var ps=stut?stutAt+(tick-stutAt)%2:tick;   // beat repeat: loop an 8th
      playStep(nextT,((ps%16)+16)%16,bar);
      (function(i,b,t){ setTimeout(function(){ lb.forEach(function(c,j){ c.classList.toggle("now",j===i); }); ld.forEach(function(c,j){ c.classList.toggle("now",j===i); }); $("barc").textContent=(b+1)+"."+(Math.floor(i/4)+1); },Math.max(0,(t-now)*1000)); })(((ps%16)+16)%16,bar,nextT);
      tick++; nextT+=T16(); }
  }
  setTimeout(loop,20);
}
function start(at){ unlock(); playing=true; t0=at||ctx.currentTime+0.06; tick=0; nextT=t0; prevSlide=false; $("play").setAttribute("aria-pressed","true"); $("play").textContent="■"; }
function stop(){ playing=false; building=false; dropQ=false; if(M&&ctx){ M.bass.silence(ctx.currentTime); M.riserStop(ctx.currentTime); } $("play").setAttribute("aria-pressed","false"); $("play").textContent="▶"; renderUI(); }
$("play").addEventListener("click",function(){ if(playing){ stop(); selfStopped=true; if(leading) clock.stop(); leading=false; } else { start(); if(clock.enabled()){ leading=true; clock.start(st.bpm,epochFromCtx(t0)); } } });
var clock=MusicLessonsClock.create({app:"bama",on:{
  hello:function(){ if(playing&&leading) clock.state(true,st.bpm,epochFromCtx(t0)); },
  tempo:function(m){ if(m.bpm) setBpm(m.bpm,true); },
  start:function(m){ follow(m,true); }, bar:function(m){ follow(m,false); }, state:function(m){ if(m.playing) follow(m,false); },
  stop:function(){ if(!leading&&playing) stop(); } }});
function follow(m,isStart){ if(isStart) selfStopped=false; if(selfStopped&&!playing) return; if(!m.at) return; unlock(); leading=false;
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
  longPress(b,function(){ if(!playing){ if(p==="b") st.clipB=i; else st.clipD=i; renderUI(); save(); return; } if(p==="b") qB=i; else qD=i; renderUI(); },
    function(){ if(p==="b"){ st.bass[i]=genBass(i); toast("קו בס חדש ב־"+"ABCD"[i]); renderUI(); save(); } }); });
$$(".mute").forEach(function(b){ var m=b.dataset.m;
  longPress(b,function(){ if(solo){ solo=null; } else st.mutes[m]=!st.mutes[m]; applyMutes(); renderUI(); save(); },function(){ solo=solo===m?null:m; applyMutes(); renderUI(); }); });
$$(".m").forEach(function(b,i){ longPress(b,function(){ if(!st.mem[i]){ toast("לחיצה ארוכה שומרת"); return; } if(playing){ qMem=i; renderUI(); } else { qMem=i; onBarNow(); } },
  function(){ st.mem[i]={b:st.clipB,d:st.clipD,mutes:Object.assign({},st.mutes),e:st.energy}; toast("נשמר בזיכרון "+(i+1)); renderUI(); save(); }); });
function onBarNow(){ var m=st.mem[qMem]; st.clipB=m.b; st.clipD=m.d; st.mutes=Object.assign({},m.mutes); st.energy=m.e; $("energy").value=m.e; qMem=-1; applyKnobs(); applyMutes(); renderUI(); save(); }
$("build").addEventListener("click",function(){ unlock(); if(!playing||!M) return toast("קודם ▶"); vib();
  if(building){ building=false; M.riserStop(ctx.currentTime); renderUI(); return; }
  building=true; var nb=Math.ceil((ctx.currentTime-t0)/(T16()*16)); buildBar=nb; var at=t0+nb*T16()*16; M.riser(at,T16()*16*4); renderUI(); });
$("drop").addEventListener("click",function(){ unlock(); if(!playing||!M) return; vib(); dropQ=true; renderUI(); });
[].forEach.call($("tabs").children,function(b){ b.addEventListener("click",function(){ $("app").dataset.tab=b.dataset.t; [].forEach.call($("tabs").children,function(x){ x.setAttribute("aria-pressed",x===b); }); }); });
function applyKnobs(){ st.energy=+$("energy").value; if(!M) return; var e=E();
  M.bass.set("cutoff",Math.min(1,+$("cutoff").value/100*0.8+e*0.25)); M.bass.set("res",+$("res").value/100); M.bass.set("envmod",0.3+e*0.5); M.bass.set("decay",0.25+e*0.3); M.bass.set("accent",0.7);
  M.drive(+$("drive").value/100); M.vol(+$("vol").value/100); M.bass.set("drive",0.15+e*0.35); }
["energy","cutoff","res","drive","vol"].forEach(function(id){ $(id).addEventListener("input",function(){ applyKnobs(); save(); }); });
$("sync").addEventListener("click",function(){ var on=clock.setEnabled(!clock.enabled()); this.setAttribute("aria-pressed",on); if(on&&playing){ leading=true; clock.start(st.bpm,epochFromCtx(t0)); } st.sync=on; save(); });
/* XY master FX */
var xy={x:0.5,y:0}, xyEl=$("xy"), xyId=null;
function drawXY(){ $("dot").style.left=(xy.x*100)+"%"; $("dot").style.top=((1-xy.y)*100)+"%"; }
function xyMove(e){ var r=xyEl.getBoundingClientRect(); xy.x=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)); xy.y=Math.max(0,Math.min(1,1-(e.clientY-r.top)/r.height)); drawXY(); if(M) M.xy(xy.x,xy.y); }
xyEl.addEventListener("pointerdown",function(e){ e.preventDefault(); unlock(); xyId=e.pointerId; try{xyEl.setPointerCapture(e.pointerId);}catch(_){} xyEl.classList.add("on"); xyMove(e); });
xyEl.addEventListener("pointermove",function(e){ if(e.pointerId===xyId) xyMove(e); });
function xyUp(e){ if(e.pointerId!==xyId) return; xyId=null; xyEl.classList.remove("on"); xy={x:0.5,y:0}; drawXY(); if(M) M.xy(0.5,0); }  // springs back to neutral like a DJ FX pad
xyEl.addEventListener("pointerup",xyUp); xyEl.addEventListener("pointercancel",xyUp);
function hold(id,dn,upf){ var b=$(id); b.addEventListener("pointerdown",function(e){ e.preventDefault(); unlock(); b.classList.add("down"); vib(); dn(); });
  var u=function(){ if(b.classList.contains("down")){ b.classList.remove("down"); upf(); } }; ["pointerup","pointercancel","lostpointercapture"].forEach(function(ev){ b.addEventListener(ev,u); }); }
hold("stut",function(){ stut=true; stutAt=tick; },function(){ stut=false; });
hold("throw",function(){ if(M) M.throwOn(true); },function(){ if(M) M.throwOn(false); });
hold("wash",function(){ if(M) M.washOn(true); },function(){ if(M) M.washOn(false); });
hold("tape",function(){ if(M) M.tape(true,60/st.bpm*2); },function(){ if(M) M.tape(false); });
/* recording */
var rec=null,chunks=[];
$("rec").addEventListener("click",function(){ unlock(); if(rec){ rec.stop(); return; } if(!recDest||!window.MediaRecorder){ toast("אין הקלטה בדפדפן הזה"); return; }
  var mt=["audio/mp4","audio/webm;codecs=opus","audio/webm"].filter(function(t){ return MediaRecorder.isTypeSupported&&MediaRecorder.isTypeSupported(t); })[0];
  chunks=[]; rec=new MediaRecorder(recDest.stream,mt?{mimeType:mt}:undefined); rec.ondataavailable=function(e){ if(e.data.size) chunks.push(e.data); };
  rec.onstop=function(){ var bl=new Blob(chunks,{type:rec.mimeType}),a=document.createElement("a"); a.href=URL.createObjectURL(bl); a.download="bama2-"+Date.now()+(rec.mimeType.indexOf("mp4")>=0?".m4a":".webm"); document.body.appendChild(a); a.click(); a.remove(); rec=null; $("rec").setAttribute("aria-pressed","false"); toast("ההקלטה נשמרה"); };
  rec.start(); this.setAttribute("aria-pressed","true"); });
$("fat").addEventListener("click",function(){ st.fat=!st.fat; this.textContent=st.fat?"ON":"OFF"; this.setAttribute("aria-pressed",st.fat); if(M) M.bass.set("fat",st.fat); save(); });
/* init */
$("key").value=st.key; $("bpmVal").textContent=st.bpm; $("energy").value=st.energy; if(st.sync) $("sync").setAttribute("aria-pressed",clock.setEnabled(true));
$("fat").textContent=st.fat?"ON":"OFF"; $("fat").setAttribute("aria-pressed",!!st.fat); drawXY(); renderUI();
document.addEventListener("gesturestart",function(e){e.preventDefault();}); document.addEventListener("contextmenu",function(e){e.preventDefault();});
document.addEventListener("visibilitychange",function(){ if(!document.hidden&&ctx) ctx.resume(); });
loop();
if("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(function(){});
window.__bama={st:st,M:function(){return M;}};
})();
