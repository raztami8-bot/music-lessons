/* מכונת גרוב · מנוע הצליל
   כל התופים מסונתזים בזמן אמת, בלי דגימות, בסגנון אנלוגי:
   בעיטה (סינוס עם נפילת גובה), מחיאה (רעש בפסים מתפרצים), היי־האט (שישה מתנדים מתכתיים כמו ב־808),
   טום (סינוס עם נפילה ועור רעש), רים/רעש (צליל עץ קצר שמתערבב עם רעש).
   שרשרת יציאה: ערוצים → מיקס → מדחס־מגביל → קטימה רכה → רמקול. אותה שרשרת משמשת גם לרינדור לא־מקוון (בדיקות). */
(function(){
"use strict";
var AC=window.AudioContext||window.webkitAudioContext;
var clamp=function(v,a,b){ return Math.min(b,Math.max(a,v)); };
var fin=function(v,d){ return (typeof v==="number"&&isFinite(v))?v:d; };

/* ---------- אייפון/אייפד: לנגן גם כשהמתג במצב שקט ---------- */
var silentEl=null;
function silentWav(){
  var n=1600, buf=new Uint8Array(44+n), dv=new DataView(buf.buffer);
  function str(o,t){ for(var i=0;i<t.length;i++) buf[o+i]=t.charCodeAt(i); }
  str(0,"RIFF"); dv.setUint32(4,36+n,true); str(8,"WAVE"); str(12,"fmt ");
  dv.setUint32(16,16,true); dv.setUint16(20,1,true); dv.setUint16(22,1,true);
  dv.setUint32(24,8000,true); dv.setUint32(28,8000,true); dv.setUint16(32,1,true); dv.setUint16(34,8,true);
  str(36,"data"); dv.setUint32(40,n,true); for(var i=0;i<n;i++) buf[44+i]=128;
  var b=""; for(var j=0;j<buf.length;j++) b+=String.fromCharCode(buf[j]);
  return "data:audio/wav;base64,"+btoa(b);
}
function playbackSession(){
  try{ if(navigator.audioSession && navigator.audioSession.type!=="playback") navigator.audioSession.type="playback"; }catch(e){}
  if(navigator.audioSession) return;
  if(!silentEl){ silentEl=document.createElement("audio"); silentEl.setAttribute("playsinline",""); silentEl.loop=true; silentEl.src=silentWav(); }
  if(silentEl.paused){ var pr=silentEl.play(); if(pr&&pr.catch) pr.catch(function(){}); }
}

/* ---------- שרשרת יציאה (גם לזמן אמת וגם לרינדור) ---------- */
var noiseCache=typeof WeakMap!=="undefined"?new WeakMap():null;
function noiseBuf(c){
  var b=noiseCache&&noiseCache.get(c); if(b) return b;
  var len=Math.floor(c.sampleRate*1.5); b=c.createBuffer(1,len,c.sampleRate); var d=b.getChannelData(0), s=12345;
  for(var i=0;i<len;i++){ s=(s*1103515245+12345)&0x7fffffff; d[i]=s/0x3fffffff-1; }
  if(noiseCache) noiseCache.set(c,b); return b;
}
function chain(c){
  var g=function(v){ var x=c.createGain(); x.gain.value=v; return x; };
  var o={c:c, open:null};
  o.mix=g(.7);
  o.drvIn=g(1); o.shaper=c.createWaveShaper(); o.drvOut=g(1);
  o.shaper.curve=softCurve(1.4); o.shaper.oversample="2x";
  o.dc=c.createBiquadFilter(); o.dc.type="highpass"; o.dc.frequency.value=22; o.dc.Q.value=.5;
  o.master=g(.8);
  // מגביל: מדחס מהיר וחזק, ואחריו קטימה רכה שלא נותנת לשום דבר לעבור את 0dB
  o.comp=c.createDynamicsCompressor();
  o.comp.threshold.value=-9; o.comp.knee.value=3; o.comp.ratio.value=16; o.comp.attack.value=.002; o.comp.release.value=.14;
  o.clipIn=g(1/1.3); o.clip=c.createWaveShaper(); o.clip.curve=(function(){ var n=2048,cc=new Float32Array(n); for(var i=0;i<n;i++){ var x=(i/1023.5-1)*1.3; cc[i]=Math.tanh(x)*.98; } return cc; })(); o.clip.oversample="2x";
  o.out=g(1);
  o.mix.connect(o.drvIn); o.drvIn.connect(o.shaper); o.shaper.connect(o.drvOut); o.drvOut.connect(o.dc);
  o.dc.connect(o.master); o.master.connect(o.comp); o.comp.connect(o.clipIn); o.clipIn.connect(o.clip); o.clip.connect(o.out); o.out.connect(c.destination);
  o.parts={};
  ["kick","clap","ch","oh","tom","rim"].forEach(function(k){ var x=g(1); x.connect(o.mix); o.parts[k]=x; });
  return o;
}
function softCurve(k){ var n=1024,cc=new Float32Array(n); for(var i=0;i<n;i++){ var x=i*2/n-1; cc[i]=Math.tanh(x*k)/Math.tanh(k); } return cc; }

/* ---------- קולות ---------- */
// p: level, decay, pitch, tone בין 0 ל־1. v: עוצמת המכה (רגיל ~0.7, הדגשה 1)
function env(c,gp,t,peak,tau,att){ att=att||.0015; gp.setValueAtTime(0,t); gp.linearRampToValueAtTime(peak,t+att); gp.setTargetAtTime(0,t+att,tau); }
function noiseSrc(c,t,dur){ var s=c.createBufferSource(); s.buffer=noiseBuf(c); s.loop=true; s.start(t,Math.random()*1.2); s.stop(t+dur); return s; }
var HATF=[205.3,304.4,369.6,522.7,540,800];
var V={
  kick:function(o,bus,t,v,p){
    var c=o.c, f0=36+p.pitch*52, tau=.06+p.decay*p.decay*.75, dur=tau*7+.05;
    var osc=c.createOscillator(); osc.type="sine";
    osc.frequency.setValueAtTime(f0*(4+p.tone*4)*(.9+v*.2),t); osc.frequency.exponentialRampToValueAtTime(f0*1.5,t+.012+ (1-p.tone)*.01); osc.frequency.exponentialRampToValueAtTime(f0,t+.09);
    var a=c.createGain(); env(c,a.gain,t,1.15*v,tau,.001);
    var sh=c.createWaveShaper(); sh.curve=softCurve(1+p.tone*2.5);
    osc.connect(a); a.connect(sh); sh.connect(bus); osc.start(t); osc.stop(t+dur);
    // קליק: הקצה של המכה
    var n=noiseSrc(c,t,.02), hp=c.createBiquadFilter(); hp.type="highpass"; hp.frequency.value=2500+p.tone*3000;
    var ng=c.createGain(); env(c,ng.gain,t,(.12+p.tone*.5)*v,.004,.0005);
    n.connect(hp); hp.connect(ng); ng.connect(bus);
  },
  clap:function(o,bus,t,v,p){
    var c=o.c, tail=.05+p.decay*p.decay*.45, dur=.04+tail*6;
    var n=noiseSrc(c,t,dur), bp=c.createBiquadFilter(); bp.type="bandpass"; bp.frequency.value=700+p.pitch*1700; bp.Q.value=.8+p.tone*2.5;
    var hp=c.createBiquadFilter(); hp.type="highpass"; hp.frequency.value=300+p.tone*700;
    var a=c.createGain(), gp=a.gain, pk=1.6*v; gp.setValueAtTime(0,t);
    // שלוש מחיאות צפופות ואז זנב
    for(var k=0;k<3;k++){ var tk=t+k*.0105; gp.setValueAtTime(pk*(k===0?.85:1),tk); gp.setTargetAtTime(pk*.12,tk+.0005,.0035); }
    gp.setValueAtTime(pk*.9,t+.032); gp.setTargetAtTime(0,t+.0325,tail);
    n.connect(bp); bp.connect(hp); hp.connect(a); a.connect(bus);
  },
  hat:function(o,bus,t,v,p,open){
    var c=o.c, tau=open?(.07+p.decay*p.decay*.7):(.008+p.decay*p.decay*.07), dur=tau*7+.02, mul=.7+p.pitch*.7;
    var sum=c.createGain(); sum.gain.value=.22;
    for(var i=0;i<6;i++){ var os=c.createOscillator(); os.type="square"; os.frequency.value=HATF[i]*mul; os.connect(sum); os.start(t); os.stop(t+dur); }
    var n=noiseSrc(c,t,dur), ng=c.createGain(); ng.gain.value=.25+p.tone*.25; n.connect(ng); ng.connect(sum);
    var bp=c.createBiquadFilter(); bp.type="bandpass"; bp.frequency.value=9500+p.pitch*2000; bp.Q.value=.7;
    var hp=c.createBiquadFilter(); hp.type="highpass"; hp.frequency.value=5000+p.tone*4500; hp.Q.value=.5;
    var a=c.createGain(); env(c,a.gain,t,(open?.95:1.1)*v,tau,.0008);
    sum.connect(bp); bp.connect(hp); hp.connect(a); a.connect(bus);
    return {g:a.gain, t:t, end:t+dur};
  },
  tom:function(o,bus,t,v,p){
    var c=o.c, f=70+p.pitch*230, tau=.07+p.decay*p.decay*.55, dur=tau*7+.05;
    var osc=c.createOscillator(); osc.type="sine";
    osc.frequency.setValueAtTime(f*1.7,t); osc.frequency.exponentialRampToValueAtTime(f,t+.07+p.decay*.05);
    var a=c.createGain(); env(c,a.gain,t,1.0*v,tau,.001);
    var sh=c.createWaveShaper(); sh.curve=softCurve(1.2+p.tone*1.5);
    osc.connect(a); a.connect(sh); sh.connect(bus); osc.start(t); osc.stop(t+dur);
    var n=noiseSrc(c,t,.12), bp=c.createBiquadFilter(); bp.type="bandpass"; bp.frequency.value=f*3; bp.Q.value=1.4;
    var ng=c.createGain(); env(c,ng.gain,t,(.05+p.tone*.45)*v,.02+p.decay*.03,.0008);
    n.connect(bp); bp.connect(ng); ng.connect(bus);
  },
  rim:function(o,bus,t,v,p){
    var c=o.c, m=.7+p.pitch*.6, tau=.008+p.decay*p.decay*.05, dur=tau*8+.02;
    var rimG=c.createGain(); env(c,rimG.gain,t,(1-p.tone*.8)*1.1*v,tau,.0005);
    [1720,487].forEach(function(fq,k){ var os=c.createOscillator(); os.type="triangle"; os.frequency.value=fq*m; var g2=c.createGain(); g2.gain.value=k?.6:.9; os.connect(g2); g2.connect(rimG); os.start(t); os.stop(t+dur); });
    var hp=c.createBiquadFilter(); hp.type="highpass"; hp.frequency.value=380; rimG.connect(hp); hp.connect(bus);
    // רעש: מתחזק ככל שהטון עולה, כמו סנר דק
    var ntau=.03+p.decay*p.decay*.3, n=noiseSrc(c,t,ntau*7+.02), bp=c.createBiquadFilter(); bp.type="bandpass"; bp.frequency.value=2500+p.pitch*4500; bp.Q.value=.9;
    var ng=c.createGain(); env(c,ng.gain,t,p.tone*1.0*v,ntau,.001);
    n.connect(bp); bp.connect(ng); ng.connect(bus);
  }
};
// מכה אחת. part: kick|clap|ch|oh|tom|rim
function hit(o,part,t,v,p){
  if(!o) return; var c=o.c; t=Math.max(t,c.currentTime);
  p={level:clamp(fin(p.level,.8),0,1),decay:clamp(fin(p.decay,.5),0,1),pitch:clamp(fin(p.pitch,.5),0,1),tone:clamp(fin(p.tone,.5),0,1)};
  v=clamp(fin(v,.7),0,1.3)*p.level*p.level*1.15; if(v<=.001) return;
  var bus=o.parts[part]; if(!bus) return;
  try{
    if(part==="ch"||part==="oh"){
      // הסגור חונק את הפתוח, כמו במכונות האמיתיות
      if(o.open && o.open.t<t && o.open.end>t){ var g=o.open.g; try{ g.cancelScheduledValues(t); }catch(e){} g.setTargetAtTime(0,t,.005); }
      var h=V.hat(o,bus,t,v,p,part==="oh"); if(part==="oh") o.open=h; else if(o.open && o.open.t>=t) {/* פתוח מאוחר יותר: נשאר */}
    } else V[part](o,bus,t,v,p);
  }catch(e){}
}

/* ---------- מצב חי ---------- */
var ctx=null, O=null, unlocked=false, meter=null, mbuf=null, recDest=null;
function build(){
  ctx=new AC({latencyHint:"interactive"});
  O=chain(ctx);
  meter=ctx.createAnalyser(); meter.fftSize=512; mbuf=new Float32Array(512); O.out.connect(meter);
  try{ recDest=ctx.createMediaStreamDestination(); O.out.connect(recDest); }catch(e){ recDest=null; }
  apply();
  ctx.onstatechange=function(){ if(G.onState) G.onState(ctx?ctx.state:"closed"); };
}
var vol=.8, drive=0;
function apply(){
  if(!O) return; var t=ctx.currentTime;
  O.master.gain.setTargetAtTime(Math.pow(vol,1.6)*.95,t,.03);
  var k=1+drive*drive*6; O.drvIn.gain.setTargetAtTime(k,t,.03); O.drvOut.gain.setTargetAtTime(1/Math.sqrt(k),t,.03);
}
function start(){
  if(!AC) return false;
  playbackSession();
  if(!ctx) build();
  if(ctx.state!=="running"){ try{ var r=ctx.resume(); if(r&&r.catch) r.catch(function(){}); }catch(e){} }
  if(!unlocked){ try{ var s=ctx.createBufferSource(); s.buffer=ctx.createBuffer(1,1,22050); s.connect(ctx.destination); s.start(0); unlocked=true; }catch(e){} }
  return true;
}
function level(){
  if(!meter) return 0; meter.getFloatTimeDomainData(mbuf); var s=0;
  for(var i=0;i<mbuf.length;i++){ var x=mbuf[i]; if(x!==x||!isFinite(x)) return -1; s+=x*x; }
  return Math.sqrt(s/mbuf.length);
}
// בונים את כל הצליל מחדש: כשהמערכת שברה את השמע או שמשהו התפוצץ
function reset(){
  try{ if(ctx) ctx.close(); }catch(e){}
  ctx=null; O=null; meter=null; recDest=null; unlocked=false;
  start(); if(G.onReset) G.onReset();
  return !!ctx;
}
/* כלב שמירה: כל שנייה בודקים שהשמע חי. נתקע? מנסים להעיר. מת לגמרי או מחזיר NaN? בונים מחדש */
var health={bad:0,last:0}, lastTouch=0;
function watchdog(){
  if(!ctx||document.hidden) return;
  var lv=level();
  if(lv<0 && Date.now()-health.last>3000){ health.last=Date.now(); reset(); if(G.onNotice) G.onNotice("נמצאה תקלה בצליל, הצליל אותחל"); return; }
  if(ctx.state!=="running"){
    try{ var r=ctx.resume(); if(r&&r.catch) r.catch(function(){}); }catch(e){}
    if(Date.now()-lastTouch<8000) health.bad++; else health.bad=0;
    if(health.bad>=3 && Date.now()-health.last>10000){ health.bad=0; health.last=Date.now(); reset(); if(G.onNotice) G.onNotice("הצליל הופעל מחדש"); }
  } else health.bad=0;
}
setInterval(watchdog,1000);

/* ---------- רינדור לא־מקוון: אותם קולות ואותה שרשרת, בלי רמקול ---------- */
function render(hits,dur,sr){
  var OAC=window.OfflineAudioContext||window.webkitOfflineAudioContext; if(!OAC) return Promise.reject(new Error("no offline"));
  sr=sr||44100; var c=new OAC(2,Math.ceil(sr*dur),sr), o=chain(c);
  o.master.gain.value=Math.pow(vol,1.6)*.95;
  hits.forEach(function(h){ hit(o,h.part,h.t,h.v,h.p); });
  return c.startRendering();
}

var G=window.GrooveEngine={
  available:function(){ return !!AC; },
  start:start, reset:reset, render:render,
  touched:function(){ lastTouch=Date.now(); },
  ctx:function(){ return ctx; },
  running:function(){ return !!ctx&&ctx.state==="running"; },
  now:function(){ return ctx?ctx.currentTime:0; },
  // זמן השמע ↔ זמן הדף (performance.now), לפי מה שבאמת יוצא מהרמקול. משמש לסנכרון בין חלונות
  perfOffset:function(){
    if(!ctx) return 0;
    try{ var ts=ctx.getOutputTimestamp&&ctx.getOutputTimestamp(); if(ts&&ts.performanceTime>0&&isFinite(ts.contextTime)) return ts.performanceTime/1000-ts.contextTime; }catch(e){}
    return performance.now()/1000-ctx.currentTime;
  },
  hit:function(part,t,v,p){ if(O) hit(O,part,t,v,p); },
  level:level,
  stream:function(){ return recDest?recDest.stream:null; },
  setVolume:function(x){ vol=clamp(fin(x,.8),0,1); apply(); },
  setDrive:function(x){ drive=clamp(fin(x,0),0,1); apply(); },
  onReset:null, onNotice:null, onState:null
};
})();
