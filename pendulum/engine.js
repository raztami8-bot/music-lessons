/* מטוטלת · מנוע הצליל
   קול: שני מתנדים אנלוגיים (saw + pulse עם detune) ותת־מתנד סינוס, דרך פילטר ladder (ladder.js, AudioWorklet)
   ו־VCA. אם אין AudioWorklet: שני פילטרים lowpass במקום (24dB, בלי השמעה עצמית).
   שרשרת: קולות → stutter → פייזר → דיליי פינג־פונג (קלטת: lowpass ורוויה במשוב, wow) → ריוורב (קצר/ארוך) → מדחס → קטימה רכה → רמקול.
   ציר "חלום" (ההטיה קדימה) פותח בבת אחת את הדיליי, הפייזר והריוורב. ציר "רעד" (ההטיה הצידה) מוסיף ויברטו ומרווח בין המתנדים. */
(function(){
"use strict";
var AC=window.AudioContext||window.webkitAudioContext;
var clamp=function(v,a,b){ return Math.min(b,Math.max(a,v)); };
var fin=function(v,d){ return (typeof v==="number"&&isFinite(v))?v:d; };

/* ---------- אייפון/אייפד: לנגן גם כשהמתג במצב שקט (כמו בגרוב) ---------- */
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

/* ---------- עזרים ---------- */
function softCurve(k){ var n=1024,cc=new Float32Array(n); for(var i=0;i<n;i++){ var x=i*2/n-1; cc[i]=Math.tanh(x*k)/Math.tanh(k); } return cc; }
function g(c,v){ var x=c.createGain(); x.gain.value=v; return x; }
// אימפולס ריוורב: רעש עם דעיכה מעריכית, מסונן יותר ככל שמתקדמים (כמו חדר אמיתי), עם כמה החזרות מוקדמות
function makeIR(c,sec,bright){
  var sr=c.sampleRate, n=Math.floor(sr*sec), b=c.createBuffer(2,n,sr), s=9876;
  for(var ch=0;ch<2;ch++){ var d=b.getChannelData(ch), lp=0, k=.25+bright*.35; s=9876+ch*777;
    for(var i=0;i<n;i++){ s=(s*1103515245+12345)&0x7fffffff; var w=s/0x3fffffff-1, t=i/n;
      var env=Math.pow(1-t,2.2)*Math.exp(-t*3.2); lp+=(w-lp)*(k*(1-t*.8)+.02); d[i]=lp*env*(i<sr*.03?.35:1); }
    // החזרות מוקדמות: כמה "קירות" בעוצמה יורדת
    [.011,.019,.027,.041,.053].forEach(function(dt,j){ var at=Math.floor(dt*sr*(ch?1.07:1)); if(at<n) d[at]+=(.5-j*.08)*(ch?-1:1); });
  }
  return b;
}

/* ---------- שרשרת יציאה ---------- */
function chain(c){
  var o={c:c, voices:[]};
  o.voiceBus=g(c,1);
  o.stutter=g(c,1);
  // פייזר: ארבעה allpass בטור, LFO איטי על התדר. wet מתערבב עם dry
  o.phIn=g(c,1); o.phDry=g(c,1); o.phWet=g(c,0); o.ap=[];
  var prev=o.phIn; for(var i=0;i<4;i++){ var ap=c.createBiquadFilter(); ap.type="allpass"; ap.frequency.value=[620,1150,1900,3100][i]; ap.Q.value=.6; prev.connect(ap); prev=ap; o.ap.push(ap); }
  o.phLfo=c.createOscillator(); o.phLfo.type="sine"; o.phLfo.frequency.value=.17; o.phLfoG=g(c,0);
  o.phLfo.connect(o.phLfoG); o.ap.forEach(function(ap){ o.phLfoG.connect(ap.frequency); }); o.phLfo.start();
  o.phOut=g(c,1); o.phIn.connect(o.phDry); o.phDry.connect(o.phOut); prev.connect(o.phWet); o.phWet.connect(o.phOut);
  // דיליי פינג־פונג "קלטת": lowpass + רוויה במשוב, wow קטן על הזמן
  o.dSend=g(c,.18); o.dL=c.createDelay(2); o.dR=c.createDelay(2); o.dL.delayTime.value=.375; o.dR.delayTime.value=.375;
  function fb(){ var lp=c.createBiquadFilter(); lp.type="lowpass"; lp.frequency.value=3200; lp.Q.value=.3; var hp=c.createBiquadFilter(); hp.type="highpass"; hp.frequency.value=140;
    var sh=c.createWaveShaper(); sh.curve=softCurve(1.6); var gn=g(c,.35); lp.connect(hp); hp.connect(sh); sh.connect(gn); return {in:lp,out:gn,gain:gn.gain}; }
  o.fbL=fb(); o.fbR=fb();
  o.dSend.connect(o.dL); o.dL.connect(o.fbL.in); o.fbL.out.connect(o.dR); o.dR.connect(o.fbR.in); o.fbR.out.connect(o.dL);
  o.panL=c.createStereoPanner?c.createStereoPanner():g(c,1); o.panR=c.createStereoPanner?c.createStereoPanner():g(c,1);
  if(o.panL.pan){ o.panL.pan.value=-.72; o.panR.pan.value=.72; }
  o.dRet=g(c,1); o.dL.connect(o.panL); o.dR.connect(o.panR); o.panL.connect(o.dRet); o.panR.connect(o.dRet);
  o.wow=c.createOscillator(); o.wow.type="sine"; o.wow.frequency.value=.31; o.wowG=g(c,.0016); o.wow.connect(o.wowG); o.wowG.connect(o.dL.delayTime); o.wowG.connect(o.dR.delayTime); o.wow.start();
  // ריוורב: שני אימפולסים, קצר וארוך, והחלום מחליף ביניהם
  o.rvShort=c.createConvolver(); o.rvLong=c.createConvolver();
  try{ o.rvShort.buffer=makeIR(c,1.7,.9); o.rvLong.buffer=makeIR(c,6.5,.55); }catch(e){}
  o.rvSendS=g(c,.14); o.rvSendL=g(c,0); o.rvRet=g(c,1);
  o.rvSendS.connect(o.rvShort); o.rvSendL.connect(o.rvLong); o.rvShort.connect(o.rvRet); o.rvLong.connect(o.rvRet);
  // מיקס ויציאה
  o.mix=g(c,1); o.dc=c.createBiquadFilter(); o.dc.type="highpass"; o.dc.frequency.value=24; o.dc.Q.value=.5;
  o.master=g(c,.8);
  o.comp=c.createDynamicsCompressor(); o.comp.threshold.value=-10; o.comp.knee.value=4; o.comp.ratio.value=12; o.comp.attack.value=.003; o.comp.release.value=.18;
  o.clipIn=g(c,1/1.3); o.clip=c.createWaveShaper(); o.clip.curve=(function(){ var n=2048,cc=new Float32Array(n); for(var i=0;i<n;i++){ var x=(i/1023.5-1)*1.3; cc[i]=Math.tanh(x)*.98; } return cc; })(); o.clip.oversample="2x";
  o.out=g(c,1);
  o.voiceBus.connect(o.stutter); o.stutter.connect(o.phIn); o.phOut.connect(o.mix); o.phOut.connect(o.dSend); o.phOut.connect(o.rvSendS); o.phOut.connect(o.rvSendL);
  o.dRet.connect(o.mix); o.dRet.connect(o.rvSendS); o.dRet.connect(o.rvSendL); o.rvRet.connect(o.mix);
  o.mix.connect(o.dc); o.dc.connect(o.master); o.master.connect(o.comp); o.comp.connect(o.clipIn); o.clipIn.connect(o.clip); o.clip.connect(o.out); o.out.connect(c.destination);
  // ויברטו משותף לכל הקולות: LFO אחד, עומק בסנטים
  o.vib=c.createOscillator(); o.vib.type="sine"; o.vib.frequency.value=5.6; o.vibG=g(c,0); o.vib.connect(o.vibG); o.vib.start();
  return o;
}

/* ---------- קולות ---------- */
var MAXV=10, haveWorklet=false;
function makeFilter(o){
  var c=o.c;
  if(haveWorklet){
    try{ var n=new AudioWorkletNode(c,"ladder",{numberOfInputs:1,numberOfOutputs:1,outputChannelCount:[1]});
      return {node:n,inp:n,out:n,cut:n.parameters.get("cutoff"),res:n.parameters.get("res"),drv:n.parameters.get("drive"),kill:function(){ try{ n.port.postMessage("stop"); }catch(e){} }}; }catch(e){ haveWorklet=false; }
  }
  var a=c.createBiquadFilter(), b=c.createBiquadFilter(); a.type=b.type="lowpass"; a.Q.value=.7; b.Q.value=4; a.connect(b);
  var drv=g(c,1), sh=c.createWaveShaper(); sh.curve=softCurve(2); drv.connect(sh); sh.connect(a);
  // AudioParam מדומה לפילטר הכפול: אותו API כמו ב־worklet
  var cut={_v:1200, setValueAtTime:function(v,t){ a.frequency.setValueAtTime(v,t); b.frequency.setValueAtTime(v,t); this._v=v; },
    setTargetAtTime:function(v,t,k){ a.frequency.setTargetAtTime(v,t,k); b.frequency.setTargetAtTime(v,t,k); this._v=v; },
    cancelScheduledValues:function(t){ a.frequency.cancelScheduledValues(t); b.frequency.cancelScheduledValues(t); }, get value(){ return this._v; }, set value(v){ this.setValueAtTime(v,c.currentTime); }};
  var res={setTargetAtTime:function(v,t,k){ b.Q.setTargetAtTime(.7+v*v*14,t,k); }, set value(v){ b.Q.value=.7+v*v*14; }};
  return {inp:drv,out:b,cut:cut,res:res,drv:drv.gain,kill:function(){}};
}
function spawn(o,id,freq,vel,cut,P,at){
  var c=o.c, t=Math.max(c.currentTime+.003,fin(at,0));
  if(o.voices.length>=MAXV){ var old=o.voices[0]; release(o,old,.03); }
  var v={id:id,born:t,freq:freq};
  v.o1=c.createOscillator(); v.o1.type="sawtooth";
  v.o2=c.createOscillator(); v.o2.type="square";
  v.sub=c.createOscillator(); v.sub.type="sine";
  v.o1.frequency.value=freq; v.o2.frequency.value=freq; v.sub.frequency.value=freq/2;
  v.o2.detune.value=P.spread; v.o1.detune.value=-P.spread*.35;
  v.g1=g(c,.42); v.g2=g(c,.3); v.gs=g(c,.34);
  v.f=makeFilter(o);
  v.o1.connect(v.g1); v.o2.connect(v.g2); v.sub.connect(v.gs); v.g1.connect(v.f.inp); v.g2.connect(v.f.inp); v.gs.connect(v.f.inp);
  v.vca=g(c,0); v.f.out.connect(v.vca); v.vca.connect(o.voiceBus);
  o.vibG.connect(v.o1.detune); o.vibG.connect(v.o2.detune); o.vibG.connect(v.sub.detune);
  // פילטר: פתיחה חדה ונפילה לגובה האצבע (pluck), ריזוננס ודרייב מהמצב
  v.f.cut.setValueAtTime(clamp(cut*3.2,80,16000),t); v.f.cut.setTargetAtTime(cut,t,.11);
  v.f.res.setTargetAtTime(P.res,t,.01); v.f.drv.setTargetAtTime(P.drive,t,.01);
  // VCA: עלייה מהירה, לפי עוצמת האצבע
  var lvl=.16+vel*.2; v.vca.gain.setValueAtTime(0,t); v.vca.gain.linearRampToValueAtTime(lvl,t+.012); v.lvl=lvl;
  v.o1.start(t); v.o2.start(t); v.sub.start(t);
  o.voices.push(v); return v;
}
function find(o,id){ for(var i=0;i<o.voices.length;i++) if(o.voices[i].id===id) return o.voices[i]; return null; }
function release(o,v,rel,at){
  var c=o.c, t=Math.max(c.currentTime,fin(at,0)), i=o.voices.indexOf(v); if(i>=0) o.voices.splice(i,1);
  rel=fin(rel,.25);
  try{ v.vca.gain.cancelScheduledValues(t); v.vca.gain.setTargetAtTime(0,t,rel/3.5); }catch(e){}
  var end=t+rel+.1;
  try{ v.o1.stop(end); v.o2.stop(end); v.sub.stop(end); }catch(e){}
  setTimeout(function(){ try{ o.vibG.disconnect(v.o1.detune); o.vibG.disconnect(v.o2.detune); o.vibG.disconnect(v.sub.detune); }catch(e){} try{ v.vca.disconnect(); }catch(e){} v.f.kill(); },(t-c.currentTime+rel+.25)*1000);
}

/* ---------- מצב חי ---------- */
var ctx=null, O=null, unlocked=false, meter=null, mbuf=null, recDest=null, ready=null;
var P={res:.42,drive:1.4,spread:7,dream:0,wobble:0,vol:.8,beat:60/124,div:.75};
function build(){
  ctx=new AC({latencyHint:"interactive"});
  if(ctx.audioWorklet&&ctx.audioWorklet.addModule){
    ready=ctx.audioWorklet.addModule("ladder.js").then(function(){ haveWorklet=true; },function(){ haveWorklet=false; });
  } else ready=Promise.resolve();
  O=chain(ctx);
  meter=ctx.createAnalyser(); meter.fftSize=512; mbuf=new Float32Array(512); O.out.connect(meter);
  try{ recDest=ctx.createMediaStreamDestination(); O.out.connect(recDest); }catch(e){ recDest=null; }
  apply();
  ctx.onstatechange=function(){ if(G.onState) G.onState(ctx?ctx.state:"closed"); };
}
function apply(){
  if(!O) return; var t=ctx.currentTime, d=P.dream, w=P.wobble;
  O.master.gain.setTargetAtTime(Math.pow(P.vol,1.6)*.95,t,.03);
  // חלום: דיליי (שליחה ומשוב), פייזר, ריוורב ארוך במקום קצר
  O.dSend.gain.setTargetAtTime(.14+d*.56,t,.08);
  var fbv=.3+d*d*.68; O.fbL.gain.setTargetAtTime(fbv,t,.08); O.fbR.gain.setTargetAtTime(fbv,t,.08);
  O.phWet.gain.setTargetAtTime(d*.95,t,.08); O.phDry.gain.setTargetAtTime(1-d*.35,t,.08); O.phLfoG.gain.setTargetAtTime(90+d*420,t,.1);
  O.rvSendS.gain.setTargetAtTime(.14*(1-d),t,.1); O.rvSendL.gain.setTargetAtTime(d*.8,t,.1);
  // רעד: ויברטו ומרווח בין המתנדים
  O.vibG.gain.setTargetAtTime(w*w*40,t,.05); O.vib.frequency.setTargetAtTime(5.2+w*1.6,t,.05);
  var sp=7+w*26; O.voices.forEach(function(v){ v.o2.detune.setTargetAtTime(sp,t,.05); v.o1.detune.setTargetAtTime(-sp*.35,t,.05); }); P.spread=sp;
  // זמן הדיליי מהקצב: המעבר מתגלגל (כמו קלטת שמשנה מהירות)
  var dt=clamp(P.beat*P.div,.03,1.9); O.dL.delayTime.setTargetAtTime(dt,t,.35); O.dR.delayTime.setTargetAtTime(dt,t,.35);
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
function reset(){
  try{ if(ctx) ctx.close(); }catch(e){}
  ctx=null; O=null; meter=null; recDest=null; unlocked=false;
  start(); if(G.onReset) G.onReset();
  return !!ctx;
}
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

var G=window.PendulumEngine={
  available:function(){ return !!AC; },
  start:start, reset:reset, ready:function(){ return ready||Promise.resolve(); },
  touched:function(){ lastTouch=Date.now(); },
  ctx:function(){ return ctx; },
  running:function(){ return !!ctx&&ctx.state==="running"; },
  now:function(){ return ctx?ctx.currentTime:0; },
  ladder:function(){ return haveWorklet; },
  perfOffset:function(){
    if(!ctx) return 0;
    try{ var ts=ctx.getOutputTimestamp&&ctx.getOutputTimestamp(); if(ts&&ts.performanceTime>0&&isFinite(ts.contextTime)) return ts.performanceTime/1000-ts.contextTime; }catch(e){}
    return performance.now()/1000-ctx.currentTime;
  },
  level:level,
  stream:function(){ return recDest?recDest.stream:null; },
  voices:function(){ return O?O.voices.length:0; },
  // קול: id ייחודי לאצבע. freq בהרץ, vel 0..1, cut בהרץ
  // at: זמן שמע עתידי (לסקוונסר). בלי at: עכשיו
  noteOn:function(id,freq,vel,cut,at){ if(!O) return; var old=find(O,id); if(old) release(O,old,.05,at); spawn(O,id,clamp(fin(freq,220),20,8000),clamp(fin(vel,.8),0,1),clamp(fin(cut,2000),80,16000),P,at); },
  // עדכון רציף: תדר (עם גלישה בשניות), גובה הפילטר, עוצמה
  set:function(id,q){ if(!O) return; var v=find(O,id); if(!v) return; var t=ctx.currentTime;
    if(q.freq!==undefined&&isFinite(q.freq)){ var gl=clamp(fin(q.glide,.02),.005,1.2); v.freq=q.freq; [v.o1,v.o2].forEach(function(os){ os.frequency.setTargetAtTime(q.freq,t,gl/3); }); v.sub.frequency.setTargetAtTime(q.freq/2,t,gl/3); }
    if(q.cut!==undefined&&isFinite(q.cut)) v.f.cut.setTargetAtTime(clamp(q.cut,80,16000),t,.02);
    if(q.vel!==undefined&&isFinite(q.vel)){ var lvl=.16+clamp(q.vel,0,1)*.2; v.lvl=lvl; v.vca.gain.setTargetAtTime(lvl,t,.04); }
    if(q.res!==undefined) v.f.res.setTargetAtTime(clamp(q.res,0,1.1),t,.03);
  },
  noteOff:function(id,rel,at){ if(!O) return; var v=find(O,id); if(v) release(O,v,rel,at); },
  allOff:function(rel){ if(!O) return; O.voices.slice().forEach(function(v){ release(O,v,rel); }); },
  // stutter: שער פתוח/סגור על כל הקולות, מתוזמן לשעון. from: זמן שמע, n: מספר חיתוכים, dur: אורך חיתוך בשניות
  stutter:function(from,n,dur){ if(!O) return; var gp=O.stutter.gain, t=Math.max(from,ctx.currentTime+.005);
    try{ gp.cancelScheduledValues(t); gp.setValueAtTime(1,t);
      for(var k=0;k<n;k++){ var a=t+k*dur, h=a+dur*.5; gp.setValueAtTime(1,h); gp.linearRampToValueAtTime(0,h+.003); gp.setValueAtTime(0,a+dur-.004); gp.linearRampToValueAtTime(1,a+dur); }
      gp.setValueAtTime(1,t+n*dur); }catch(e){} },
  setDream:function(x){ P.dream=clamp(fin(x,0),0,1); apply(); },
  setWobble:function(x){ P.wobble=clamp(fin(x,0),0,1); apply(); },
  setRes:function(x){ P.res=clamp(fin(x,.4),0,1.1); if(O) O.voices.forEach(function(v){ v.f.res.setTargetAtTime(P.res,ctx.currentTime,.03); }); },
  setDrive:function(x){ P.drive=clamp(fin(x,1.4),.3,8); if(O) O.voices.forEach(function(v){ v.f.drv.setTargetAtTime(P.drive,ctx.currentTime,.03); }); },
  setCut:function(hz){ if(!O) return; var t=ctx.currentTime; O.voices.forEach(function(v){ v.f.cut.setTargetAtTime(clamp(hz,80,16000),t,.02); }); },
  setVolume:function(x){ P.vol=clamp(fin(x,.8),0,1); apply(); },
  setTempo:function(bpm,div){ P.beat=60/clamp(fin(bpm,124),40,300); if(div) P.div=clamp(fin(div,.75),.1,2); apply(); },
  params:function(){ return P; },
  onReset:null, onNotice:null, onState:null
};
})();
