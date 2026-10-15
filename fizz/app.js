/* תסיסה — ממשק: מחולל, נעילות, וריאציות, משטח XY, טרנספוז, ×2/½/FREEZE, שעון משותף, הקלטה. */
(function(){
"use strict";
var $=function(i){return document.getElementById(i);};
var SCALES={"מינור":[0,2,3,5,7,8,10],"פריגי":[0,1,3,5,7,8,10],"דורי":[0,2,3,5,7,9,10],"הרמוני":[0,2,3,5,7,8,11],"פנטה מינור":[0,3,5,7,10],"מיקסולידי":[0,2,4,5,7,9,10]};
var NOTE=["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
var st={key:9,scale:"מינור",bpm:132,var:0,vars:[null,null,null,null],locks:[]};
var ctx=null, S=null, recDest=null, playing=false;
function sc(){ return SCALES[st.scale]; }
function midiOf(s,tr){ var a=sc(),n=a.length,d=s.d+(tr||0),o=Math.floor(d/n),i=((d%n)+n)%n; return 36+st.key+12*(o+s.o)+a[i]; }
function nn(m){ return NOTE[m%12]+(Math.floor(m/12)-1); }
function pat(){ return st.vars[st.var]; }

/* ---------- generator ---------- */
function g(id){ return +$(id).value/100; }
function pick(w){ var t=0,k; for(k in w) t+=w[k]; var r=Math.random()*t; for(k in w){ r-=w[k]; if(r<=0) return +k; } return 0; }
function genStep(i,prev){
  var dens=g("gDensity"), rest=g("gRest"), down=i%4===0, off=i%4===2;
  var pOn=Math.min(0.97,(0.35+dens*0.6)*(down?1.25:off?1.05:0.9)*(1-rest*0.6)); if(i===0) pOn=1;
  var n=sc().length, w={0:6}; w[n>5?4:3]=3; w[n>5?2:1]=2.5; w[n>5?6:4]=2; w[n>5?3:2]=1; w[1]=0.8; w[n]=1.8; w[-1]=1;
  var d=i===0?0:pick(w), o=0; if(Math.random()<g("gOct")*0.55) o=Math.random()<0.75?1:-1;
  if(prev&&prev.gate&&Math.random()<0.25&&i%4) d=prev.d;
  return {d:d,o:o,gate:Math.random()<pOn,acc:Math.random()<g("gAccent")*(down?0.7:off?0.9:0.45),slide:Math.random()<g("gSlide")*0.55};
}
function generate(keepLocks){ var p=pat()||[], out=[];
  for(var i=0;i<16;i++) out.push(keepLocks&&p[i]&&st.locks[i]?p[i]:genStep(i,out[i-1]));
  st.vars[st.var]=out; render(); save(); }
function mutate(){ var p=pat(); if(!p) return generate(); var free=[]; for(var i=0;i<16;i++) if(!st.locks[i]) free.push(i);
  for(var k=0;k<2&&free.length;k++){ var j=free.splice(Math.floor(Math.random()*free.length),1)[0], s=Object.assign({},p[j]), r=Math.random();
    if(r<0.4) s.d+=Math.random()<0.5?1:-1; else if(r<0.6) s.acc=!s.acc; else if(r<0.8) s.slide=!s.slide; else if(r<0.9) s.o=s.o?0:1; else s.gate=!s.gate; p[j]=s; }
  render(); save(); }

/* ---------- step view ---------- */
var stepsEl=$("steps"), cells=[];
for(var i=0;i<16;i++){ var b=document.createElement("button"); b.type="button"; b.className="step"+(i%4===0?" beat":""); b.innerHTML='<span class="ix">'+(i+1)+'</span><b></b><span class="mk"></span>'; stepsEl.appendChild(b); cells.push(b); (function(i,b){
  var lt=null, long=false;
  b.addEventListener("pointerdown",function(e){ e.preventDefault(); long=false; lt=setTimeout(function(){ long=true; var p=pat(); p[i].gate=!p[i].gate; render(); save(); vib(); },450); });
  b.addEventListener("pointerup",function(){ clearTimeout(lt); if(!long){ st.locks[i]=!st.locks[i]; render(); save(); vib(); } });
  b.addEventListener("pointercancel",function(){ clearTimeout(lt); });
})(i,b); }
function render(){ var p=pat(); if(!p) return; var txt=[];
  for(var i=0;i<16;i++){ var s=p[i], c=cells[i], m=midiOf(s,0);
    c.querySelector("b").textContent=s.gate?nn(m):"—";
    c.querySelector(".mk").textContent=(s.gate&&s.acc?"ACC ":"")+(s.slide&&s.gate?"⌒":"");
    c.classList.toggle("off",!s.gate); c.classList.toggle("acc",s.gate&&s.acc); c.classList.toggle("sl",s.gate&&s.slide); c.classList.toggle("lock",!!st.locks[i]);
    txt.push((i+1)+":"+(s.gate?nn(m)+(s.acc?" ACC":"")+(s.slide?" SLIDE":""):"rest")); }
  $("notes").textContent=txt.join("  ");
  [].forEach.call($("vars").children,function(b,j){ b.setAttribute("aria-pressed",j===st.var?"true":"false"); });
  renderTr(); }
function vib(){ if(navigator.vibrate) navigator.vibrate(6); }
function toast(m){ var t=$("toast"); t.textContent=m; t.classList.add("on"); clearTimeout(toast.t); toast.t=setTimeout(function(){ t.classList.remove("on"); },1400); }

/* ---------- audio + clock ---------- */
function unlock(){ if(ctx){ if(ctx.state!=="running") ctx.resume(); return; }
  ctx=new (window.AudioContext||window.webkitAudioContext)({latencyHint:"interactive"});
  var b=ctx.createBuffer(1,1,22050),s=ctx.createBufferSource(); s.buffer=b; s.connect(ctx.destination); s.start(0);
  S=Acid303.build(ctx,ctx.destination); S.tempo(st.bpm); syncKnobs();
  if(ctx.createMediaStreamDestination){ recDest=ctx.createMediaStreamDestination(); S.out.connect(recDest); } }
var tr=0, rate=1, frozen=-1, beatOn=false, leading=false;
var t0=0, tick=0, nextT=0, pos=0, prevSlide=false, sub=0;
function T32(){ return 60/st.bpm/8; }
function epochFromCtx(t){ var ts=ctx.getOutputTimestamp?ctx.getOutputTimestamp():null; if(ts&&ts.performanceTime) return performance.timeOrigin+ts.performanceTime+(t-ts.contextTime)*1000; return clock.epoch()+(t-ctx.currentTime)*1000; }
function ctxFromEpoch(at){ var ts=ctx.getOutputTimestamp?ctx.getOutputTimestamp():null; if(ts&&ts.performanceTime) return ts.contextTime+(at-(performance.timeOrigin+ts.performanceTime))/1000; return ctx.currentTime+(at-clock.epoch())/1000; }
function loop(){
  if(playing&&ctx){ var now=ctx.currentTime;
    if(nextT<now-0.05){ tick=Math.ceil((now-t0)/T32()); nextT=t0+tick*T32(); }
    while(nextT<now+0.1){
      var g16=tick%2===0, s16=Math.floor(tick/2)%16;
      if(g16){ if(beatOn){ if(s16%4===0) S.kick(nextT); if(s16%4===2) S.hat(nextT,true); else if(s16%2===1) S.hat(nextT,false); }
        if(s16===0&&leading&&clock.enabled()) clock.bar(st.bpm,epochFromCtx(nextT),Math.floor(tick/32)); }
      var every=rate===2?1:rate===0.5?4:2;
      if(tick%every===0){
        var idx;
        if(rate===1&&frozen<0) pos=s16;
        if(frozen>=0) idx=frozen+((pos-frozen)%4+4)%4; else idx=((pos%16)+16)%16;
        var s=pat()[idx], dur=T32()*every;
        if(s.gate){ S.step(nextT,dur,{midi:midiOf(s,tr),acc:s.acc,slide:s.slide},prevSlide); prevSlide=s.slide; }
        else { if(prevSlide) S.silence(nextT); prevSlide=false; }
        (function(i,t){ setTimeout(function(){ cells.forEach(function(c,j){ c.classList.toggle("now",j===i); }); },Math.max(0,(t-now)*1000)); })(idx,nextT);
        pos++;
      }
      tick++; nextT+=T32();
    }
  }
  setTimeout(loop,20);
}
function start(at){ unlock(); playing=true; t0=at||ctx.currentTime+0.06; tick=0; nextT=t0; prevSlide=false; $("play").setAttribute("aria-pressed","true"); $("play").textContent="■"; }
function stop(){ playing=false; if(S) S.silence(ctx.currentTime); $("play").setAttribute("aria-pressed","false"); $("play").textContent="▶"; cells.forEach(function(c){c.classList.remove("now");}); }
$("play").addEventListener("click",function(){ if(playing){ stop(); selfStopped=true; if(leading) clock.stop(); leading=false; } else { start(); if(clock.enabled()){ leading=true; clock.start(st.bpm,epochFromCtx(t0)); } } });
var clock=MusicLessonsClock.create({app:"fizz",on:{
  hello:function(){ if(playing&&leading) clock.state(true,st.bpm,epochFromCtx(t0)); },
  tempo:function(m){ if(m.bpm) setBpm(m.bpm,true); },
  start:function(m){ follow(m,true); }, bar:function(m){ follow(m,false); }, state:function(m){ if(m.playing) follow(m,false); },
  stop:function(){ if(!leading&&playing) stop(); } }});
var selfStopped=false;
function follow(m,isStart){ if(isStart) selfStopped=false; if(selfStopped&&!playing&&!isStart) return; if(!m.at) return; unlock(); leading=false;
  if(m.bpm&&Math.abs(m.bpm-st.bpm)>0.01) setBpm(m.bpm,true);
  var t=ctxFromEpoch(m.at), bar=T32()*32; while(t>ctx.currentTime+bar) t-=bar;
  if(!playing){ start(t); return; } var sh=((t0-t)%bar+bar)%bar; if(sh>bar/2) sh-=bar; if(Math.abs(sh)>0.004){ t0+=-sh; nextT=0; } }
function setBpm(b,remote){ b=Math.max(60,Math.min(180,Math.round(b))); if(playing&&ctx){ var n=(ctx.currentTime-t0)/T32(); st.bpm=b; t0=ctx.currentTime-n*T32(); nextT=0; } else st.bpm=b;
  $("bpmVal").textContent=b; if(S) S.tempo(b); if(!remote) clock.tempo(b); save(); }

/* ---------- controls ---------- */
function rep(id,fn){ var el=$(id),iv,to; el.addEventListener("pointerdown",function(e){ e.preventDefault(); fn(); to=setTimeout(function(){ iv=setInterval(fn,70); },350); }); ["pointerup","pointerleave","pointercancel"].forEach(function(ev){ el.addEventListener(ev,function(){ clearTimeout(to); clearInterval(iv); }); }); }
rep("bpmDown",function(){ setBpm(st.bpm-1); }); rep("bpmUp",function(){ setBpm(st.bpm+1); });
NOTE.forEach(function(n,i){ var o=document.createElement("option"); o.value=i; o.textContent=n; $("key").appendChild(o); });
Object.keys(SCALES).forEach(function(n){ var o=document.createElement("option"); o.value=n; o.textContent=n; $("scale").appendChild(o); });
$("key").addEventListener("change",function(){ st.key=+this.value; render(); save(); });
$("scale").addEventListener("change",function(){ st.scale=this.value; render(); save(); });
$("gen").addEventListener("click",function(){ unlock(); generate(true); vib(); if(!playing) start(); });
$("mutate").addEventListener("click",function(){ mutate(); vib(); });
[].forEach.call($("vars").children,function(b,j){ b.addEventListener("click",function(){ st.var=j; if(!st.vars[j]){ st.vars[j]=pat()?null:null; generate(false); } render(); save(); }); });
$("beat").addEventListener("click",function(){ beatOn=!beatOn; this.setAttribute("aria-pressed",beatOn); save(); });
$("sync").addEventListener("click",function(){ var on=clock.setEnabled(!clock.enabled()); this.setAttribute("aria-pressed",on); if(on&&playing){ leading=true; clock.start(st.bpm,epochFromCtx(t0)); } save(); });
$("copy").addEventListener("click",function(){ var t=$("notes").textContent; (navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(function(){ toast("הועתק"); },function(){ toast("לא הצלחתי להעתיק"); }); });
[].forEach.call($("tabs").children,function(b){ b.addEventListener("click",function(){ $("app").dataset.tab=b.dataset.t; [].forEach.call($("tabs").children,function(x){ x.setAttribute("aria-pressed",x===b); }); }); });
var KN=["envmod","decay","accent","drive","delay"];
function syncKnobs(){ if(!S) return; KN.forEach(function(k){ S.set(k,+$(k).value/100); }); S.set("cutoff",xy.x); S.set("res",xy.y); S.set("wave",$("wave").textContent==="SAW"?"sawtooth":"square"); }
KN.forEach(function(k){ $(k).addEventListener("input",function(){ if(S) S.set(k,+this.value/100); save(); }); });
$("wave").addEventListener("click",function(){ this.textContent=this.textContent==="SAW"?"SQUARE":"SAW"; syncKnobs(); save(); });
/* XY pad: own pointer, independent of other touches */
var xy={x:0.35,y:0.6}, xyEl=$("xy"), xyId=null;
function xyMove(e){ var r=xyEl.getBoundingClientRect(); xy.x=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)); xy.y=Math.max(0,Math.min(1,1-(e.clientY-r.top)/r.height)); drawXY(); if(S){ S.set("cutoff",xy.x); S.set("res",xy.y); } }
function drawXY(){ var d=$("dot"); d.style.left=(xy.x*100)+"%"; d.style.top=((1-xy.y)*100)+"%"; }
xyEl.addEventListener("pointerdown",function(e){ e.preventDefault(); unlock(); xyId=e.pointerId; try{xyEl.setPointerCapture(e.pointerId);}catch(_){} xyEl.classList.add("on"); xyMove(e); });
xyEl.addEventListener("pointermove",function(e){ if(e.pointerId===xyId) xyMove(e); });
function xyUp(e){ if(e.pointerId===xyId){ xyId=null; xyEl.classList.remove("on"); save(); } }
xyEl.addEventListener("pointerup",xyUp); xyEl.addEventListener("pointercancel",xyUp);
/* transpose pads (scale degrees), hold */
var TR=[-3,-2,-1,1,2,3,4], held=[];
function renderTr(){ var el=$("tr"); if(!el.children.length) TR.forEach(function(v){ var b=document.createElement("button"); b.type="button"; b.className="btn hold"; b.dataset.v=v; el.appendChild(b);
    b.addEventListener("pointerdown",function(e){ e.preventDefault(); unlock(); held.push(v); tr=v; b.classList.add("down"); vib(); });
    var u=function(){ var i=held.lastIndexOf(v); if(i>=0) held.splice(i,1); tr=held.length?held[held.length-1]:0; b.classList.remove("down"); };
    b.addEventListener("pointerup",u); b.addEventListener("pointercancel",u); b.addEventListener("lostpointercapture",u); });
  [].forEach.call(el.children,function(b){ var v=+b.dataset.v; b.innerHTML="<small>"+(v>0?"+":"")+v+"</small>"+nn(midiOf({d:0,o:1},v)).replace(/\d/,""); }); }
function hold(id,dn,upf){ var b=$(id); b.addEventListener("pointerdown",function(e){ e.preventDefault(); unlock(); b.classList.add("down"); dn(); vib(); });
  var u=function(){ if(b.classList.contains("down")){ b.classList.remove("down"); upf(); } }; b.addEventListener("pointerup",u); b.addEventListener("pointercancel",u); b.addEventListener("lostpointercapture",u); }
hold("dbl",function(){ rate=2; },function(){ rate=1; });
hold("half",function(){ rate=0.5; },function(){ rate=1; });
hold("freeze",function(){ var p=((pos-1)%16+16)%16; frozen=p-(p%4); pos=frozen; },function(){ frozen=-1; });
/* recording */
var rec=null, chunks=[];
$("rec").addEventListener("click",function(){ unlock(); if(rec){ rec.stop(); return; } if(!recDest||!window.MediaRecorder){ toast("אין הקלטה בדפדפן הזה"); return; }
  var mt=["audio/mp4","audio/webm;codecs=opus","audio/webm"].filter(function(t){ return MediaRecorder.isTypeSupported&&MediaRecorder.isTypeSupported(t); })[0];
  chunks=[]; rec=new MediaRecorder(recDest.stream,mt?{mimeType:mt}:undefined); rec.ondataavailable=function(e){ if(e.data.size) chunks.push(e.data); };
  rec.onstop=function(){ var bl=new Blob(chunks,{type:rec.mimeType}),a=document.createElement("a"); a.href=URL.createObjectURL(bl); a.download="tasisa-"+Date.now()+(rec.mimeType.indexOf("mp4")>=0?".m4a":".webm"); document.body.appendChild(a); a.click(); a.remove(); rec=null; $("rec").setAttribute("aria-pressed","false"); toast("ההקלטה נשמרה"); };
  rec.start(); this.setAttribute("aria-pressed","true"); });
/* persistence */
function save(){ try{ var k={}; KN.forEach(function(n){ k[n]=$(n).value; }); localStorage.setItem("tasisa",JSON.stringify({st:st,k:k,xy:xy,wave:$("wave").textContent,beat:beatOn,sync:clock.enabled(),g:["gDensity","gSlide","gAccent","gOct","gRest"].map(function(n){return $(n).value;})})); }catch(e){} }
try{ var L=JSON.parse(localStorage.getItem("tasisa")||"null"); if(L){ Object.assign(st,L.st); for(var k in L.k) $(k).value=L.k[k]; if(L.xy) xy=L.xy; if(L.wave) $("wave").textContent=L.wave; beatOn=!!L.beat; $("beat").setAttribute("aria-pressed",beatOn);
  if(L.g) ["gDensity","gSlide","gAccent","gOct","gRest"].forEach(function(n,i){ $(n).value=L.g[i]; }); if(L.sync) $("sync").setAttribute("aria-pressed",clock.setEnabled(true)); } }catch(e){}
$("key").value=st.key; $("scale").value=st.scale; $("bpmVal").textContent=st.bpm; drawXY();
if(!pat()) generate(false); else render();
document.addEventListener("gesturestart",function(e){e.preventDefault();}); document.addEventListener("contextmenu",function(e){e.preventDefault();});
document.addEventListener("visibilitychange",function(){ if(!document.hidden&&ctx) ctx.resume(); });
loop();
if("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(function(){});
window.__fizz={st:st,generate:generate};
})();
