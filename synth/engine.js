/* מכונת אווירות · מנוע הצליל
   voices → filter (env + breath) → drive → mud → color → metal comb → trance gate → chorus → space / echo → out
   Voices: warm, bright, hollow, super (5 saws), metal (ring modulation). Optional mono voice with glide.
   A 16th-note clock drives the trance gate and lets the page run an arpeggiator in time. */
(function(){
"use strict";
var AC=window.AudioContext||window.webkitAudioContext;
var ctx=null, N={}, voices={}, unlocked=false, silentEl=null;

var P={bright:.45,reso:.15,env:.2,attack:.55,release:.6,width:.55,breath:.25,glide:.3,
       space:.6,echo:.15,drive:0,mud:0,color:.7,metal:0,shape:0,mono:false,volume:.8,bpm:128,loopvol:.85};

/* ---- iPhone/iPad: play through the silent switch, and unlock inside a tap ---- */
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

/* ---- graph ---- */
function impulse(sec,decay){
  var sr=ctx.sampleRate, len=Math.floor(sr*sec), b=ctx.createBuffer(2,len,sr);
  for(var c=0;c<2;c++){ var d=b.getChannelData(c);
    for(var i=0;i<len;i++){ var t=i/len; d[i]=(Math.random()*2-1)*Math.pow(1-t,decay)*(i<sr*0.004?i/(sr*0.004):1); } }
  return b;
}
function driveCurve(a){
  var n=2048, c=new Float32Array(n), k=a*a*60, asym=a*0.12;
  for(var i=0;i<n;i++){ var x=i*2/n-1; var y=((1+k)*x)/(1+k*Math.abs(x)); c[i]=y+asym*y*y*(y>0?1:-0.6); }
  return c;
}
function build(){
  ctx=new AC({latencyHint:"interactive"});
  var g=function(v){ var x=ctx.createGain(); x.gain.value=v; return x; };
  N.bus=g(0.22);
  N.filter=ctx.createBiquadFilter(); N.filter.type="lowpass";
  N.lfo=ctx.createOscillator(); N.lfo.type="sine"; N.lfoAmt=g(0); N.lfo.connect(N.lfoAmt); N.lfoAmt.connect(N.filter.detune); N.lfo.start();
  N.bus.connect(N.filter);

  // dirt: drive → mud (low shelf) → color (tone)
  N.drvIn=g(1); N.shaper=ctx.createWaveShaper(); N.shaper.oversample="4x"; N.drvOut=g(1);
  N.mud=ctx.createBiquadFilter(); N.mud.type="lowshelf"; N.mud.frequency.value=150;
  N.mudMid=ctx.createBiquadFilter(); N.mudMid.type="peaking"; N.mudMid.frequency.value=380; N.mudMid.Q.value=0.8;
  N.color=ctx.createBiquadFilter(); N.color.type="lowpass"; N.color.Q.value=0.4;
  N.filter.connect(N.drvIn); N.drvIn.connect(N.shaper); N.shaper.connect(N.drvOut);
  N.drvOut.connect(N.mud); N.mud.connect(N.mudMid); N.mudMid.connect(N.color);

  // metal: a tuned comb resonator, retuned to each new note
  N.gate=g(1); N.combDry=g(1); N.comb=ctx.createDelay(0.1); N.comb.delayTime.value=1/220; N.combFb=g(0); N.combWet=g(0);
  N.combTone=ctx.createBiquadFilter(); N.combTone.type="highpass"; N.combTone.frequency.value=180;
  N.color.connect(N.combDry); N.combDry.connect(N.gate);
  N.color.connect(N.comb); N.comb.connect(N.combTone); N.combTone.connect(N.combFb); N.combFb.connect(N.comb); N.comb.connect(N.combWet); N.combWet.connect(N.gate);

  // chorus
  N.pre=g(1); N.dry=g(1); N.gate.connect(N.dry); N.dry.connect(N.pre);
  N.dL=ctx.createDelay(0.1); N.dR=ctx.createDelay(0.1); N.dL.delayTime.value=0.018; N.dR.delayTime.value=0.026;
  N.chLfo=ctx.createOscillator(); N.chLfo.frequency.value=0.35; N.chDepth=g(0.003); N.chInv=g(-1);
  N.chLfo.connect(N.chDepth); N.chDepth.connect(N.dL.delayTime); N.chDepth.connect(N.chInv); N.chInv.connect(N.dR.delayTime); N.chLfo.start();
  N.chMerge=ctx.createChannelMerger(2); N.chWet=g(0.5);
  N.gate.connect(N.dL); N.gate.connect(N.dR); N.dL.connect(N.chMerge,0,0); N.dR.connect(N.chMerge,0,1);
  N.chMerge.connect(N.chWet); N.chWet.connect(N.pre);

  N.master=g(0.8); N.pre.connect(N.master);
  N.revSend=g(0); N.rev=ctx.createConvolver(); N.rev.buffer=impulse(4.6,2.8); N.revOut=g(0.9);
  N.pre.connect(N.revSend); N.revSend.connect(N.rev); N.rev.connect(N.revOut); N.revOut.connect(N.master);
  N.delSend=g(0); N.d1=ctx.createDelay(3); N.d2=ctx.createDelay(3);
  N.fb1=g(0.4); N.fb2=g(0.4); N.tone=ctx.createBiquadFilter(); N.tone.type="lowpass"; N.tone.frequency.value=3200;
  N.delMerge=ctx.createChannelMerger(2); N.delOut=g(0.8);
  N.pre.connect(N.delSend); N.delSend.connect(N.tone); N.tone.connect(N.d1);
  N.d1.connect(N.fb1); N.fb1.connect(N.d2); N.d2.connect(N.fb2); N.fb2.connect(N.d1);
  N.d1.connect(N.delMerge,0,0); N.d2.connect(N.delMerge,0,1); N.delMerge.connect(N.delOut); N.delOut.connect(N.master);
  N.revFromDelay=g(0.35); N.delOut.connect(N.revFromDelay); N.revFromDelay.connect(N.rev);

  N.comp=ctx.createDynamicsCompressor(); N.comp.threshold.value=-14; N.comp.ratio.value=4; N.comp.attack.value=0.01; N.comp.release.value=0.25;
  N.master.connect(N.comp);
  N.limit=ctx.createWaveShaper(); N.limit.curve=(function(){ var n=1024,c=new Float32Array(n); for(var i=0;i<n;i++){ var x=i*2/n-1; c[i]=Math.tanh(x*1.2)/Math.tanh(1.2); } return c; })();
  N.comp.connect(N.limit); N.limit.connect(ctx.destination);
  N.loopBus=ctx.createGain(); N.loopBus.gain.value=P.loopvol; N.loopBus.connect(N.limit);
  N.meter=ctx.createAnalyser(); N.meter.fftSize=512; N.limit.connect(N.meter); N.buf=new Float32Array(512);
  try{ N.rec=ctx.createMediaStreamDestination(); N.limit.connect(N.rec); }catch(e){ N.rec=null; }
  lastDrive=-1; apply(true);
}
var health={bad:0,last:0};
function level(){
  if(!ctx||!N.meter) return 0;
  N.meter.getFloatTimeDomainData(N.buf); var sum=0;
  for(var i=0;i<N.buf.length;i++){ var x=N.buf[i]; if(x!==x||!isFinite(x)) return -1; sum+=x*x; }
  return Math.sqrt(sum/N.buf.length);
}
// Rebuild the whole sound graph from scratch. Used when iOS breaks the audio or something blows up.
function reset(){
  var wasClock=!!clock.timer; if(clock.timer){ clearInterval(clock.timer); clock.timer=null; }
  try{ if(ctx) ctx.close(); }catch(e){}
  ctx=null; N={}; voices={}; mono=null; monoStack=[]; unlocked=false;
  start(); if(wasClock) setClock(true);
  if(window.Looper && window.Looper.reattach) window.Looper.reattach();
  return !!ctx;
}
var lastTouch=0;
function watchdog(){
  if(!ctx||document.hidden) return;
  var lv=level();
  if(lv<0 && Date.now()-health.last>3000){ health.last=Date.now(); reset(); if(window.Engine.onReset) window.Engine.onReset("נמצאה תקלה בצליל, הצליל אותחל"); return; }
  if(ctx.state!=="running"){
    try{ ctx.resume(); }catch(e){}
    if(Date.now()-lastTouch<8000) health.bad++; else health.bad=0;
    if(health.bad>=3 && Date.now()-health.last>10000){ health.bad=0; health.last=Date.now(); reset(); if(window.Engine.onReset) window.Engine.onReset("הצליל הופעל מחדש. גע שוב במקלדת"); }
  } else health.bad=0;
}
setInterval(watchdog,1000);
function start(){
  if(!AC) return false;
  playbackSession();
  if(!ctx) build();
  if(ctx.state!=="running"){ try{ var r=ctx.resume(); if(r&&r.catch) r.catch(function(){}); }catch(e){} }
  if(!unlocked){ try{ var s=ctx.createBufferSource(); s.buffer=ctx.createBuffer(1,1,22050); s.connect(ctx.destination); s.start(0); unlocked=true; }catch(e){} }
  return true;
}

/* ---- parameter mapping ---- */
function cutoffHz(v){ return 70*Math.pow(2,v*7.8); }
function attackSec(v){ return 0.003+v*v*4; }
function releaseSec(v){ return 0.06+v*v*7; }
function glideSec(v){ return 0.01+v*v*0.5; }
function beat(){ return 60/P.bpm; }
var lastDrive=-1;
function apply(now){
  if(!ctx) return;
  var t=ctx.currentTime, k=now?0.001:0.04;
  var head=Math.pow(2,(P.env*4200+P.breath*2200)/1200);           // how far env + breath can push the filter up
  N.filter.frequency.setTargetAtTime(Math.min(cutoffHz(P.bright),17000/head),t,k);
  N.filter.Q.setTargetAtTime(0.5+Math.pow(P.reso,1.5)*16,t,k);
  N.lfo.frequency.setTargetAtTime(0.07+P.breath*0.35,t,k);
  N.lfoAmt.gain.setTargetAtTime(P.breath*2200,t,k);
  if(Math.abs(P.drive-lastDrive)>0.01){ N.shaper.curve=driveCurve(P.drive); lastDrive=P.drive; }
  N.drvIn.gain.setTargetAtTime(1+P.drive*5,t,k);
  N.drvOut.gain.setTargetAtTime(1/(1+P.drive*2.6),t,k);
  N.mud.gain.setTargetAtTime(P.mud*14,t,k);
  N.mudMid.gain.setTargetAtTime(P.mud*5,t,k);
  N.color.frequency.setTargetAtTime(900*Math.pow(2,P.color*4.4),t,k);
  N.combFb.gain.setTargetAtTime(P.metal*0.9,t,k);
  N.combWet.gain.setTargetAtTime(P.metal*0.8,t,k);
  N.combDry.gain.setTargetAtTime(1-P.metal*0.35,t,k);
  N.chWet.gain.setTargetAtTime(0.15+P.width*0.75,t,k);
  N.chDepth.gain.setTargetAtTime(0.001+P.width*0.005,t,k);
  N.revSend.gain.setTargetAtTime(Math.pow(P.space,1.3)*1.1,t,k);
  N.dry.gain.setTargetAtTime(1-P.space*0.35,t,k);
  N.delSend.gain.setTargetAtTime(P.echo*0.7,t,k);
  N.fb1.gain.setTargetAtTime(0.2+P.echo*0.45,t,k); N.fb2.gain.setTargetAtTime(0.2+P.echo*0.45,t,k);
  var dt=beat()*0.75; N.d1.delayTime.setTargetAtTime(dt,t,0.05); N.d2.delayTime.setTargetAtTime(dt,t,0.05);   // dotted eighth, in time with the beat
  N.master.gain.setTargetAtTime(P.volume,t,k);
  if(N.loopBus) N.loopBus.gain.setTargetAtTime(P.loopvol,t,k);
  Object.keys(voices).forEach(function(id){ var v=voices[id]; if(!v.stopping) v.oscs.forEach(function(o){ if(o.spread!=null) o.node.detune.setTargetAtTime(o.spread*P.width*22,t,k); }); });
}
function set(key,val){ P[key]=val; if(key==="mono" && !val) dropMono(); apply(false); }

/* ---- voices ---- */
function hz(midi){ return 440*Math.pow(2,(midi-69)/12); }
function makeVoice(midi,t){
  var f=hz(midi), out=ctx.createGain(); out.gain.value=0;
  var oscs=[], mix=ctx.createGain(); mix.connect(out);
  function osc(type,ratio,spread,gain,dest){
    var o=ctx.createOscillator(), gg=ctx.createGain(); o.type=type; o.frequency.value=f*ratio;
    if(spread!=null) o.detune.value=spread*P.width*22;
    gg.gain.value=gain; o.connect(gg); gg.connect(dest||mix); o.start(t); oscs.push({node:o,ratio:ratio,spread:spread}); return o;
  }
  var s=P.shape;
  if(s===0){ osc("triangle",1,-1,1); osc("sawtooth",1,1,.55); }
  else if(s===1){ osc("sawtooth",1,-1,1); osc("sawtooth",1,1,1); }
  else if(s===2){ osc("square",1,-1,.6); osc("square",1,1,.6); }
  else if(s===3){ [-2,-1,0,1,2].forEach(function(sp){ osc("sawtooth",1,sp*1.6,sp===0?.6:.42); }); }
  else { // metal: a saw ring-modulated by an off-ratio sine, plus a little of the plain saw
    var ring=ctx.createGain(); ring.gain.value=0; ring.connect(mix);
    osc("sawtooth",1,-1,1,ring); var m=osc("sine",2.76,null,1,ring.gain); osc("sawtooth",1,1,.3);
  }
  osc("sine",.5,null,midi<60?.35:.18);
  out.connect(N.bus);
  return {oscs:oscs,out:out,midi:midi,t0:t,peak:.5,a:attackSec(P.attack)};
}
function envOn(v,t){
  var a=v.a=attackSec(P.attack);
  v.out.gain.cancelScheduledValues(t); v.out.gain.setValueAtTime(0,t); v.out.gain.linearRampToValueAtTime(v.peak,t+a);
  v.out.gain.setTargetAtTime(v.peak*0.8,t+a,0.6); v.t0=t;
}
function filterHit(t){
  if(P.env<0.01) return;
  var amt=P.env*4200; N.filter.detune.cancelScheduledValues(t); N.filter.detune.setValueAtTime(amt,t); N.filter.detune.setTargetAtTime(0,t,0.05+P.release*0.2);
}
function tuneComb(midi,t){ var per=1/hz(midi), d=per*Math.max(1,Math.ceil(0.004/per)); N.comb.delayTime.setTargetAtTime(Math.min(0.09,d),t,0.01); }
var seq=0, mono=null, monoStack=[], MAXOSC=64;
function oscCount(){ var n=0; Object.keys(voices).forEach(function(k){ n+=voices[k].oscs.length; }); return n; }
function steal(t){
  var need=(P.shape===3?6:3), guard=0;
  while(oscCount()+need>MAXOSC && guard++<20) stealOne(t);
}
function stealOne(t){
  var ids=Object.keys(voices); if(!ids.length) return;
  ids.sort(function(a,b){ var A=voices[a],B=voices[b]; return (A.stopping===B.stopping)?A.t0-B.t0:(A.stopping?-1:1); });
  var victim=voices[ids[0]]; if(!victim) return;
  try{ victim.out.gain.cancelScheduledValues(t); victim.out.gain.setTargetAtTime(0,t,0.02); victim.oscs.forEach(function(o){ try{ o.node.stop(t+0.12); }catch(e){} }); }catch(e){}
  setTimeout(function(){ try{ victim.out.disconnect(); }catch(e){} },300);
  if(victim===mono){ mono=null; monoStack=[]; }
  delete voices[ids[0]];
}
function noteOnAt(midi,t){
  if(!start()) return null;
  t=Math.max(t||0,ctx.currentTime+0.005);
  tuneComb(midi,t); filterHit(t);
  var id=++seq;
  if(P.mono){
    monoStack.push({id:id,midi:midi});
    if(mono && !mono.stopping){
      var g=glideSec(P.glide), f=hz(midi);
      mono.oscs.forEach(function(o){ o.node.frequency.setTargetAtTime(f*o.ratio,t,g/3); }); mono.midi=midi;
      return id;
    }
    steal(t); mono=makeVoice(midi,t); envOn(mono,t); voices["m"]=mono; return id;
  }
  steal(t); var v=makeVoice(midi,t); envOn(v,t); voices[id]=v; return id;
}
function release(v,t,key){
  if(!v||v.stopping) return; v.stopping=true;
  t=Math.max(t,ctx.currentTime); var r=releaseSec(P.release);
  var gp=v.out.gain;
  if(gp.cancelAndHoldAtTime){ gp.cancelAndHoldAtTime(t); }
  else { var el=t-v.t0, cur=el<v.a? v.peak*Math.max(0,el/v.a) : v.peak*(0.8+0.2*Math.exp(-(el-v.a)/0.6)); gp.cancelScheduledValues(t); gp.setValueAtTime(cur,t); }
  gp.setTargetAtTime(0,t,r/4);
  var end=t+r*1.6+0.05; v.oscs.forEach(function(o){ try{ o.node.stop(end); }catch(e){} });
  setTimeout(function(){ try{ v.out.disconnect(); }catch(e){} if(voices[key]===v) delete voices[key]; },(end-ctx.currentTime)*1000+200);
}
function noteOffAt(id,t){
  if(!ctx) return; t=t||ctx.currentTime;
  if(voices[id]){ release(voices[id],t,id); return; }
  var i=monoStack.findIndex(function(x){ return x.id===id; }); if(i<0) return;
  var wasTop=(i===monoStack.length-1); monoStack.splice(i,1);
  if(!mono) return;
  if(!monoStack.length){ release(mono,t,"m"); mono=null; }
  else if(wasTop){ var top=monoStack[monoStack.length-1], g=glideSec(P.glide), f=hz(top.midi);
    mono.oscs.forEach(function(o){ o.node.frequency.setTargetAtTime(f*o.ratio,t,g/3); }); mono.midi=top.midi; tuneComb(top.midi,t); }
}
function dropMono(){ if(mono){ release(mono,ctx.currentTime,"m"); mono=null; } monoStack=[]; }
function allOff(){ if(!ctx) return; Object.keys(voices).forEach(function(id){ release(voices[id],ctx.currentTime,id); }); mono=null; monoStack=[]; }
function sounding(){ var m={}; Object.keys(voices).forEach(function(id){ if(!voices[id].stopping) m[voices[id].midi]=1; }); return m; }

/* ---- clock: 16th notes, trance gate, callback for the arpeggiator ---- */
var GATES={
  off:null,
  trance:[1,0,1,1, 0,1,1,0, 1,0,1,1, 0,1,0,1],
  pulse:[1,1,0,1, 1,1,0,1, 1,1,0,1, 1,1,0,1],
  half:[1,1,0,0, 1,1,0,0, 1,1,0,0, 1,1,0,0]
};
var clock={timer:null,step:0,next:0,cb:null,gate:"off"};
function stepDur(){ return beat()/4; }
function tick(){
  if(!ctx) return;
  if(clock.next<ctx.currentTime-0.25) clock.next=ctx.currentTime+0.02;   // came back from a pause: skip, don't burst
  var la=ctx.currentTime+0.12;
  while(clock.next<la){
    var t=clock.next, sd=stepDur(), s=clock.step%16, pat=GATES[clock.gate];
    if(pat && N.gate){ var on=pat[s]; N.gate.gain.setTargetAtTime(on?1:0.06,t,0.004); }
    if(clock.cb) clock.cb(clock.step,t,sd);
    clock.next+=sd; clock.step++;
  }
}
function syncClock(t){ if(clock.timer && ctx){ clock.step=0; clock.next=Math.max(t,ctx.currentTime+0.01); } }
function setClock(running,cb,gate){
  if(running && !ctx) start();
  if(gate!=null) clock.gate=gate;
  if(cb!==undefined) clock.cb=cb;
  if(running && !clock.timer){ if(!ctx) return; clock.step=0; clock.next=ctx.currentTime+0.06; clock.timer=setInterval(tick,25); }
  if(!running && clock.timer){ clearInterval(clock.timer); clock.timer=null; }
  if(ctx && (!running || !GATES[clock.gate])) N.gate.gain.setTargetAtTime(1,ctx.currentTime,0.01);
}

function safe(fn,fallback){ return function(){ try{ return fn.apply(null,arguments); }catch(e){ if(window.console) console.warn("engine",e); return fallback; } }; }
window.Engine={P:P,set:safe(set),start:safe(start,false),level:level,reset:reset,touched:function(){ lastTouch=Date.now(); }, internals:function(){ return {ctx:ctx,N:N}; }, syncClock:syncClock, beatSec:beat,
  live:function(){ return Object.keys(voices).filter(function(k){ return !voices[k].stopping; }).length; },
  recStream:function(){ start(); return N.rec?N.rec.stream:null; },
  noteOn:safe(function(m){ return noteOnAt(m,0); },null), noteOff:safe(function(id){ noteOffAt(id,0); }),
  noteOnAt:safe(noteOnAt,null), noteOffAt:safe(noteOffAt), allOff:safe(allOff), sounding:safe(sounding,{}), setClock:safe(setClock), gates:GATES,
  now:function(){ return ctx?ctx.currentTime:0; },
  available:function(){ return !!AC; }, running:function(){ return !!ctx&&ctx.state==="running"; }};
})();
