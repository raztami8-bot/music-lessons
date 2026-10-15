/* כבידה — ממשק: אצבעות מחזיקות צליל חי, זריקה משגרת כדור שמנגן בכל פגיעה בקיר, מקוונטז לשש־עשריות. */
(function(){
"use strict";
var E=window.Engine, $=function(i){return document.getElementById(i);};
var cv=$("cv"), g=cv.getContext("2d"), stage=$("stage"), W=0,H=0,DPR=1;
var orbs=[], fingers={}, sparks=[], ripples=[], started=false;
var COMBOS=[["A","מינור"],["A","פריגי"],["D","מינור"],["E","פריגי"],["C","פנטה"],["G","דורי"],["F","מינור"]], combo=0;
var grav={x:0,y:0}, tiltOn=false, beatOn=false, pulse=0;
var COLORS=["#ff4fd8","#5ee7ff","#ffd84f","#8cff6b","#b48cff","#ff8a4f","#4fffc4"];
function save(){ try{ localStorage.setItem("kvida",JSON.stringify({bpm:E.bpm,combo:combo,sync:clock.enabled(),beat:beatOn})); }catch(e){} }
function resize(){ var r=stage.getBoundingClientRect(); DPR=Math.min(2,window.devicePixelRatio||1); W=r.width; H=r.height; cv.width=W*DPR; cv.height=H*DPR; g.setTransform(DPR,0,0,DPR,0,0); }
window.addEventListener("resize",resize); resize();
function deg(x){ return Math.floor(Math.max(0,Math.min(0.999,x))*15); } // two octaves + 1
function fingerNote(x){ return E.note(deg(x),-1); }

/* ---------- clock: 16th steps ---------- */
var step0=0, stepN=0, spb=0, nextT=0, leading=false;
function sixteenth(){ return 60/E.bpm/4; }
function nextStepTime(t){ var d=sixteenth(); var n=Math.ceil((t-step0)/d); return step0+n*d; }
function ctxFromEpoch(at){ var c=E.ctx, ts=c.getOutputTimestamp?c.getOutputTimestamp():null;
  if(ts&&ts.performanceTime) return ts.contextTime+(at-(performance.timeOrigin+ts.performanceTime))/1000;
  return c.currentTime+(at-clock.epoch())/1000; }
function epochFromCtx(t){ var c=E.ctx, ts=c.getOutputTimestamp?c.getOutputTimestamp():null;
  if(ts&&ts.performanceTime) return performance.timeOrigin+ts.performanceTime+(t-ts.contextTime)*1000;
  return clock.epoch()+(t-c.currentTime)*1000; }
function schedLoop(){
  if(E.ctx){ var c=E.ctx, now=c.currentTime, d=sixteenth();
    if(nextT<now) { nextT=nextStepTime(now); stepN=Math.round((nextT-step0)/d); }
    while(nextT<now+0.12){ var s=((stepN%16)+16)%16;
      if(beatOn){ if(s%4===0){ E.kick(nextT); (function(t){ setTimeout(function(){pulse=1;},Math.max(0,(t-now)*1000)); })(nextT); } if(s%4===2) E.hat(nextT); }
      if(s===0 && leading && clock.enabled()) clock.bar(E.bpm,epochFromCtx(nextT),Math.floor(stepN/16));
      // held fingers sprinkle shimmer grains on 8ths
      if(s%2===0) for(var k in fingers){ var f=fingers[k]; if(f.v) E.grain(f.v.m+(Math.random()<0.5?0:7),nextT,f.x*2-1); }
      nextT+=d; stepN++; }
  }
  setTimeout(schedLoop,25);
}
var clock=MusicLessonsClock.create({app:"kvida",on:{
  hello:function(){ if(leading) clock.state(true,E.bpm,epochFromCtx(step0)); },
  tempo:function(m){ if(m.bpm) setBpm(m.bpm,true); },
  start:function(m){ follow(m); }, bar:function(m){ follow(m); }, state:function(m){ if(m.playing) follow(m); },
  stop:function(){} }});
function follow(m){ if(!E.ctx||!m.at) return; leading=false; if(m.bpm&&Math.abs(m.bpm-E.bpm)>0.01) setBpm(m.bpm,true);
  var t=ctxFromEpoch(m.at), bar=sixteenth()*16; var shift=((step0-t)%bar+bar)%bar; if(shift>bar/2) shift-=bar; if(Math.abs(shift)>0.004){ step0=t; nextT=0; } }

/* ---------- physics ---------- */
function launch(x,y,vx,vy,col){ if(orbs.length>=14) orbs.shift(); orbs.push({x:x,y:y,vx:vx,vy:vy,r:Math.max(12,Math.min(W,H)*0.028),hits:0,life:1,col:col,last:-1,glow:0}); }
function hitWall(o,side){
  if(!E.ctx) return; var t=nextStepTime(E.ctx.currentTime+0.01), st=Math.round((t-step0)/sixteenth()); if(o.last===st) return; o.last=st;
  var sp=Math.min(1,Math.hypot(o.vx,o.vy)/1400), vel=0.35+0.65*sp*o.life, p=o.x/W*2-1;
  if(side==="t"||side==="b"){ E.bell(E.note(deg(o.x/W),side==="t"?0:-1),t,vel,1-o.y/H*0.5,p); }
  else { E.acid(E.note(Math.floor((1-o.y/H)*7),-2),t,vel,sp,side==="l"?-0.6:0.6); }
  o.glow=1; o.hits++; o.life=Math.max(0,1-o.hits/28);
  var delay=Math.max(0,(t-E.ctx.currentTime)*1000), sx=o.x, sy=o.y, col=o.col;
  setTimeout(function(){ for(var i=0;i<10;i++){ var a=Math.random()*6.28,s=60+Math.random()*220; sparks.push({x:sx,y:sy,vx:Math.cos(a)*s,vy:Math.sin(a)*s,l:1,c:col}); } ripples.push({x:sx,y:sy,r:4,l:1,c:col}); },delay);
}
function physics(dt){
  for(var i=orbs.length-1;i>=0;i--){ var o=orbs[i];
    var ax,ay; if(tiltOn){ ax=grav.x*900; ay=grav.y*900; } else { var dx=W/2-o.x,dy=H/2-o.y,dd=Math.max(60,Math.hypot(dx,dy)); ax=dx/dd*260; ay=dy/dd*260; }
    for(var k in fingers){ var f=fingers[k]; var fx=f.px-o.x,fy=f.py-o.y,fd=Math.max(40,Math.hypot(fx,fy)); ax+=fx/fd*90000/fd; ay+=fy/fd*90000/fd; } // fingers are little suns
    o.vx+=ax*dt; o.vy+=ay*dt; var sp=Math.hypot(o.vx,o.vy); if(sp>1800){ o.vx*=1800/sp; o.vy*=1800/sp; }
    o.x+=o.vx*dt; o.y+=o.vy*dt; var e=0.93;
    if(o.x<o.r){ o.x=o.r; o.vx=Math.abs(o.vx)*e; hitWall(o,"l"); } else if(o.x>W-o.r){ o.x=W-o.r; o.vx=-Math.abs(o.vx)*e; hitWall(o,"r"); }
    if(o.y<o.r){ o.y=o.r; o.vy=Math.abs(o.vy)*e; hitWall(o,"t"); } else if(o.y>H-o.r){ o.y=H-o.r; o.vy=-Math.abs(o.vy)*e; hitWall(o,"b"); }
    o.glow*=0.9; if(o.life<=0) { o.life-=0; orbs.splice(i,1); }
  }
  for(var a=0;a<orbs.length;a++) for(var b=a+1;b<orbs.length;b++){ var A=orbs[a],B=orbs[b],dx2=B.x-A.x,dy2=B.y-A.y,d=Math.hypot(dx2,dy2),m=A.r+B.r;
    if(d<m&&d>0){ var nx=dx2/d,ny=dy2/d,rel=(B.vx-A.vx)*nx+(B.vy-A.vy)*ny; var ov=(m-d)/2; A.x-=nx*ov;A.y-=ny*ov;B.x+=nx*ov;B.y+=ny*ov;
      if(rel<0){ A.vx+=rel*nx;A.vy+=rel*ny;B.vx-=rel*nx;B.vy-=rel*ny; if(E.ctx&&-rel>120) E.tick(nextStepTime(E.ctx.currentTime+0.01),Math.min(1,-rel/900),(A.x/W)*2-1); A.glow=B.glow=0.7; } } }
}

/* ---------- drawing ---------- */
var last=performance.now();
function frame(now){ var dt=Math.min(0.033,(now-last)/1000); last=now; physics(dt); draw(dt); requestAnimationFrame(frame); }
function draw(dt){
  g.fillStyle="rgba(7,6,13,0.28)"; g.fillRect(0,0,W,H);
  // scale lanes on top/bottom walls, root notes brighter
  var n=15, sl=E.scales[E.scale].length;
  for(var i=0;i<n;i++){ var x=i*W/n; g.fillStyle=i%sl===0?"rgba(255,79,216,.45)":"rgba(94,231,255,.16)"; g.fillRect(x+2,0,W/n-4,4); g.fillRect(x+2,H-4,W/n-4,4); }
  for(var j=0;j<7;j++){ var y=H-(j+1)*H/7; g.fillStyle=j===0?"rgba(255,216,79,.45)":"rgba(255,216,79,.15)"; g.fillRect(0,y+2,4,H/7-4); g.fillRect(W-4,y+2,4,H/7-4); }
  if(pulse>0.01){ g.strokeStyle="rgba(255,79,216,"+pulse*0.5+")"; g.lineWidth=6*pulse; g.strokeRect(3,3,W-6,H-6); pulse*=0.85; }
  if(!tiltOn){ g.beginPath(); g.arc(W/2,H/2,6+pulse*8,0,6.28); g.fillStyle="rgba(255,255,255,.25)"; g.fill(); }
  for(var r=ripples.length-1;r>=0;r--){ var q=ripples[r]; q.r+=dt*260; q.l-=dt*1.6; if(q.l<=0){ripples.splice(r,1);continue;} g.beginPath(); g.arc(q.x,q.y,q.r,0,6.28); g.strokeStyle=q.c; g.globalAlpha=q.l; g.lineWidth=2; g.stroke(); g.globalAlpha=1; }
  for(var s=sparks.length-1;s>=0;s--){ var p=sparks[s]; p.x+=p.vx*dt; p.y+=p.vy*dt; p.l-=dt*2.2; if(p.l<=0){sparks.splice(s,1);continue;} g.fillStyle=p.c; g.globalAlpha=p.l; g.fillRect(p.x-1.5,p.y-1.5,3,3); g.globalAlpha=1; }
  orbs.forEach(function(o){ g.save(); g.shadowColor=o.col; g.shadowBlur=14+o.glow*30; g.beginPath(); g.arc(o.x,o.y,o.r*(1+o.glow*0.35),0,6.28); g.fillStyle=o.col; g.globalAlpha=0.35+0.65*o.life; g.fill(); g.restore(); });
  for(var k in fingers){ var f=fingers[k]; var R=34+Math.sin(performance.now()/90)*4;
    g.save(); g.shadowColor=f.col; g.shadowBlur=30; g.beginPath(); g.arc(f.px,f.py,R,0,6.28); g.strokeStyle=f.col; g.lineWidth=3; g.stroke(); g.restore();
    g.beginPath(); g.arc(f.px,f.py,R*0.35,0,6.28); g.fillStyle=f.col; g.fill();
    g.fillStyle="rgba(255,255,255,.12)"; g.fillRect(Math.floor(deg(f.x)*W/15),0,W/15,H);
    if(f.hold){ g.beginPath(); g.moveTo(f.px,f.py); g.lineTo(f.sx,f.sy); g.strokeStyle="rgba(255,255,255,.2)"; g.setLineDash([4,6]); g.stroke(); g.setLineDash([]); } }
}

/* ---------- touch ---------- */
var colorI=0;
function pt(e){ var r=stage.getBoundingClientRect(); return {x:e.clientX-r.left,y:e.clientY-r.top}; }
function firstTouch(){ E.unlock(); if(!started){ started=true; step0=E.ctx.currentTime+0.05; nextT=0; $("hint").classList.add("off"); } }
stage.addEventListener("pointerdown",function(e){ e.preventDefault(); firstTouch(); try{stage.setPointerCapture(e.pointerId);}catch(_){}
  var p=pt(e), col=COLORS[colorI++%COLORS.length], x=p.x/W, y=1-p.y/H;
  fingers[e.pointerId]={px:p.x,py:p.y,sx:p.x,sy:p.y,x:x,y:y,col:col,hist:[{x:p.x,y:p.y,t:performance.now()}],v:E.voice(fingerNote(x),x,y),hold:true};
  if(navigator.vibrate) navigator.vibrate(8);
},{passive:false});
stage.addEventListener("pointermove",function(e){ var f=fingers[e.pointerId]; if(!f) return; e.preventDefault();
  var p=pt(e); f.px=p.x; f.py=p.y; f.x=Math.max(0,Math.min(1,p.x/W)); f.y=Math.max(0,Math.min(1,1-p.y/H));
  var nn=fingerNote(f.x); if(f.v){ if(nn!==f.v.m&&navigator.vibrate) navigator.vibrate(4); f.v.set(nn,f.x,f.y); }
  f.hist.push({x:p.x,y:p.y,t:performance.now()}); if(f.hist.length>6) f.hist.shift(); },{passive:false});
function up(e){ var f=fingers[e.pointerId]; if(!f) return; delete fingers[e.pointerId]; if(f.v) f.v.stop();
  var h=f.hist, a=h[0], b=h[h.length-1], dt=(b.t-a.t)/1000;
  if(e.type!=="pointercancel" && dt>0.005 && performance.now()-b.t<80){ var vx=(b.x-a.x)/dt, vy=(b.y-a.y)/dt; if(Math.hypot(vx,vy)>250) launch(b.x,b.y,vx,vy,f.col); }
}
stage.addEventListener("pointerup",up); stage.addEventListener("pointercancel",up);
document.addEventListener("gesturestart",function(e){e.preventDefault();});
document.addEventListener("dblclick",function(e){e.preventDefault();});
document.addEventListener("contextmenu",function(e){e.preventDefault();});

/* ---------- controls ---------- */
function setBpm(b,remote){ b=Math.max(70,Math.min(170,Math.round(b))); if(E.ctx){ var t=E.ctx.currentTime, oldD=sixteenth(), n=(t-step0)/oldD; E.setBpm(b); step0=t-n*sixteenth(); nextT=0; } else E.bpm=b; $("bpmVal").textContent=b; if(!remote) clock.tempo(b); save(); }
function rep(id,fn){ var el=$(id),iv,to; el.addEventListener("pointerdown",function(e){ e.preventDefault(); fn(); to=setTimeout(function(){ iv=setInterval(fn,70); },350); }); ["pointerup","pointerleave","pointercancel"].forEach(function(ev){ el.addEventListener(ev,function(){ clearTimeout(to); clearInterval(iv); }); }); }
rep("bpmDown",function(){ setBpm(E.bpm-1); }); rep("bpmUp",function(){ setBpm(E.bpm+1); });
function setCombo(i){ combo=i%COMBOS.length; E.key=COMBOS[combo][0]; E.scale=COMBOS[combo][1]; $("keyBtn").textContent=E.key+" "+E.scale; save(); }
$("keyBtn").addEventListener("click",function(){ E.unlock(); setCombo(combo+1); E.bell(E.note(0,0),0,0.7,0.5,0); E.bell(E.note(2,0),E.ctx.currentTime+0.08,0.5,0.5,0); E.bell(E.note(4,0),E.ctx.currentTime+0.16,0.5,0.5,0); });
function press(id,on){ $(id).setAttribute("aria-pressed",on?"true":"false"); }
function setBeat(on){ beatOn=on; press("beat",on); if(E.ctx&&on&&clock.enabled()){ leading=true; clock.start(E.bpm,epochFromCtx(nextStepTime(E.ctx.currentTime+0.05))); } if(!on&&leading){ clock.stop(); leading=false; } save(); }
$("beat").addEventListener("click",function(){ firstTouch(); setBeat(!beatOn); });
$("sync").addEventListener("click",function(){ var on=clock.setEnabled(!clock.enabled()); press("sync",on); if(on&&beatOn&&E.ctx) setBeat(true); save(); });
$("clear").addEventListener("click",function(){ orbs.length=0; sparks.length=0; });
function onMotion(e){ var a=e.accelerationIncludingGravity; if(!a||a.x==null) return; var o=(screen.orientation&&screen.orientation.angle)||window.orientation||0, x=a.x/9.8, y=-a.y/9.8, X=x, Y=y;
  if(o===90){ X=-y; Y=x; } else if(o===-90||o===270){ X=y; Y=-x; } else if(o===180){ X=-x; Y=-y; } grav.x=X; grav.y=Y; }
$("tilt").addEventListener("click",function(){ firstTouch();
  if(tiltOn){ tiltOn=false; press("tilt",false); window.removeEventListener("devicemotion",onMotion); return; }
  function go(){ tiltOn=true; grav={x:0,y:1}; press("tilt",true); window.addEventListener("devicemotion",onMotion); }
  if(window.DeviceMotionEvent&&typeof DeviceMotionEvent.requestPermission==="function"){ DeviceMotionEvent.requestPermission().then(function(s){ if(s==="granted") go(); }).catch(function(){}); } else go(); });
var rec=null, chunks=[];
$("rec").addEventListener("click",function(){ firstTouch(); var st=E.stream();
  if(rec){ rec.stop(); return; } if(!st||!window.MediaRecorder){ $("rec").textContent="אין הקלטה"; return; }
  var types=["audio/mp4","audio/webm;codecs=opus","audio/webm"], mt=types.filter(function(t){ return MediaRecorder.isTypeSupported&&MediaRecorder.isTypeSupported(t); })[0];
  chunks=[]; rec=new MediaRecorder(st,mt?{mimeType:mt}:undefined); rec.ondataavailable=function(e){ if(e.data.size) chunks.push(e.data); };
  rec.onstop=function(){ var blob=new Blob(chunks,{type:rec.mimeType}), a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="kvida-"+Date.now()+(rec.mimeType.indexOf("mp4")>=0?".m4a":".webm"); document.body.appendChild(a); a.click(); a.remove(); rec=null; press("rec",false); };
  rec.start(); press("rec",true); });

/* restore */
try{ var s=JSON.parse(localStorage.getItem("kvida")||"{}"); if(s.bpm) setBpm(s.bpm,true); if(s.combo) setCombo(s.combo); if(s.sync){ press("sync",clock.setEnabled(true)); } if(s.beat){ beatOn=false; } }catch(e){}
document.addEventListener("visibilitychange",function(){ if(!document.hidden&&E.ctx) E.ctx.resume(); });
schedLoop(); requestAnimationFrame(frame);
if("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(function(){});
window.__kvida={orbs:orbs,launch:launch,fingers:fingers};
})();
