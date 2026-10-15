/* מכונת אווירות · מנוע הצליל
   Polyphonic pad synth: 2 detuned oscillators + sub per voice, shared low-pass filter with a slow LFO ("breath"),
   stereo chorus, convolution reverb ("space") and ping-pong delay ("echo"). */
(function(){
"use strict";
var AC=window.AudioContext||window.webkitAudioContext;
var ctx=null, N={}, voices={}, unlocked=false, silentEl=null;

// Parameters are all 0..1, except shape (0 warm, 1 bright, 2 hollow)
var P={bright:.45,reso:.15,attack:.55,release:.6,width:.55,breath:.25,space:.6,echo:.15,shape:0,volume:.8};

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
  var pr=silentEl.play(); if(pr&&pr.catch) pr.catch(function(){});
}

/* ---- graph ---- */
function impulse(sec,decay){
  var sr=ctx.sampleRate, len=Math.floor(sr*sec), b=ctx.createBuffer(2,len,sr);
  for(var c=0;c<2;c++){ var d=b.getChannelData(c);
    for(var i=0;i<len;i++){ var t=i/len; d[i]=(Math.random()*2-1)*Math.pow(1-t,decay)*(i<sr*0.004?i/(sr*0.004):1); } }
  return b;
}
function build(){
  ctx=new AC({latencyHint:"interactive"});
  var g=function(v){ var x=ctx.createGain(); x.gain.value=v; return x; };
  N.bus=g(0.22);
  N.filter=ctx.createBiquadFilter(); N.filter.type="lowpass";
  N.lfo=ctx.createOscillator(); N.lfo.type="sine"; N.lfoAmt=g(0); N.lfo.connect(N.lfoAmt); N.lfoAmt.connect(N.filter.detune); N.lfo.start();
  N.bus.connect(N.filter);

  // chorus: two short delays swayed by a slow LFO, one per ear
  N.pre=g(1); N.dry=g(1); N.filter.connect(N.dry); N.dry.connect(N.pre);
  N.dL=ctx.createDelay(0.1); N.dR=ctx.createDelay(0.1); N.dL.delayTime.value=0.018; N.dR.delayTime.value=0.026;
  N.chLfo=ctx.createOscillator(); N.chLfo.frequency.value=0.35; N.chDepth=g(0.003); N.chInv=g(-1);
  N.chLfo.connect(N.chDepth); N.chDepth.connect(N.dL.delayTime); N.chDepth.connect(N.chInv); N.chInv.connect(N.dR.delayTime); N.chLfo.start();
  N.chMerge=ctx.createChannelMerger(2); N.chWet=g(0.5);
  N.filter.connect(N.dL); N.filter.connect(N.dR); N.dL.connect(N.chMerge,0,0); N.dR.connect(N.chMerge,0,1);
  N.chMerge.connect(N.chWet); N.chWet.connect(N.pre);

  N.master=g(0.8);
  N.pre.connect(N.master);
  // reverb
  N.revSend=g(0); N.rev=ctx.createConvolver(); N.rev.buffer=impulse(4.6,2.8); N.revOut=g(0.9);
  N.pre.connect(N.revSend); N.revSend.connect(N.rev); N.rev.connect(N.revOut); N.revOut.connect(N.master);
  // ping-pong delay with a darkening filter in the loop
  N.delSend=g(0); N.d1=ctx.createDelay(2); N.d2=ctx.createDelay(2); N.d1.delayTime.value=0.375; N.d2.delayTime.value=0.375;
  N.fb1=g(0.4); N.fb2=g(0.4); N.tone=ctx.createBiquadFilter(); N.tone.type="lowpass"; N.tone.frequency.value=3200;
  N.delMerge=ctx.createChannelMerger(2); N.delOut=g(0.8);
  N.pre.connect(N.delSend); N.delSend.connect(N.tone); N.tone.connect(N.d1);
  N.d1.connect(N.fb1); N.fb1.connect(N.d2); N.d2.connect(N.fb2); N.fb2.connect(N.d1);
  N.d1.connect(N.delMerge,0,0); N.d2.connect(N.delMerge,0,1); N.delMerge.connect(N.delOut); N.delOut.connect(N.master);
  N.revSendFromDelay=g(0.35); N.delOut.connect(N.revSendFromDelay); N.revSendFromDelay.connect(N.rev);

  N.comp=ctx.createDynamicsCompressor(); N.comp.threshold.value=-14; N.comp.ratio.value=4; N.comp.attack.value=0.01; N.comp.release.value=0.25;
  N.master.connect(N.comp); N.comp.connect(ctx.destination);
  apply(true);
}
function start(){
  if(!AC) return false;
  playbackSession();
  if(!ctx) build();
  if(ctx.state!=="running"){ try{ var r=ctx.resume(); if(r&&r.catch) r.catch(function(){}); }catch(e){} }
  if(!unlocked){ try{ var s=ctx.createBufferSource(); s.buffer=ctx.createBuffer(1,1,22050); s.connect(ctx.destination); s.start(0); unlocked=true; }catch(e){} }
  return true;
}

/* ---- parameter mapping ---- */
function cutoffHz(v){ return 70*Math.pow(2,v*7.8); }          // ~70 Hz .. ~15 kHz
function attackSec(v){ return 0.004+v*v*4; }
function releaseSec(v){ return 0.08+v*v*7; }
function apply(now){
  if(!ctx) return;
  var t=ctx.currentTime, k=now?0.001:0.04;
  N.filter.frequency.setTargetAtTime(cutoffHz(P.bright),t,k);
  N.filter.Q.setTargetAtTime(0.5+Math.pow(P.reso,1.5)*14,t,k);
  N.lfo.frequency.setTargetAtTime(0.07+P.breath*0.35,t,k);
  N.lfoAmt.gain.setTargetAtTime(P.breath*2200,t,k);
  N.chWet.gain.setTargetAtTime(0.15+P.width*0.75,t,k);
  N.chDepth.gain.setTargetAtTime(0.001+P.width*0.005,t,k);
  N.revSend.gain.setTargetAtTime(Math.pow(P.space,1.3)*1.1,t,k);
  N.dry.gain.setTargetAtTime(1-P.space*0.35,t,k);
  N.delSend.gain.setTargetAtTime(P.echo*0.7,t,k);
  N.fb1.gain.setTargetAtTime(0.2+P.echo*0.45,t,k); N.fb2.gain.setTargetAtTime(0.2+P.echo*0.45,t,k);
  N.master.gain.setTargetAtTime(P.volume,t,k);
  // detune is live on sounding voices too
  Object.keys(voices).forEach(function(id){ var v=voices[id]; if(!v.stopping){ v.o1.detune.setTargetAtTime(-P.width*22,t,k); v.o2.detune.setTargetAtTime(P.width*22,t,k); } });
}
function set(key,val){ P[key]=val; apply(false); }

/* ---- voices ---- */
var SHAPES=[["triangle","sawtooth",0.55],["sawtooth","sawtooth",1],["square","square",0.6]];
function hz(midi){ return 440*Math.pow(2,(midi-69)/12); }
var seq=0;
function noteOn(midi){
  if(!start()) return null;
  var t=ctx.currentTime+0.005, sh=SHAPES[P.shape]||SHAPES[0], f=hz(midi);
  var out=ctx.createGain(); out.gain.value=0;
  var o1=ctx.createOscillator(), o2=ctx.createOscillator(), sub=ctx.createOscillator();
  var g2=ctx.createGain(), gs=ctx.createGain();
  o1.type=sh[0]; o2.type=sh[1]; sub.type="sine";
  o1.frequency.value=f; o2.frequency.value=f; sub.frequency.value=f/2;
  o1.detune.value=-P.width*22; o2.detune.value=P.width*22;
  g2.gain.value=sh[2]; gs.gain.value=midi<60?0.35:0.18;
  o1.connect(out); o2.connect(g2); g2.connect(out); sub.connect(gs); gs.connect(out); out.connect(N.bus);
  var a=attackSec(P.attack), peak=0.5;
  out.gain.setValueAtTime(0,t); out.gain.linearRampToValueAtTime(peak,t+a);
  out.gain.setTargetAtTime(peak*0.8,t+a,0.6);
  o1.start(t); o2.start(t); sub.start(t);
  var id=++seq; voices[id]={o1:o1,o2:o2,sub:sub,out:out,midi:midi,t0:t,a:a,peak:peak};
  return id;
}
function noteOff(id){
  var v=voices[id]; if(!v||v.stopping) return; v.stopping=true;
  var t=ctx.currentTime, r=releaseSec(P.release);
  // estimate where the envelope is now, then fade from there (Safari has no cancelAndHold everywhere)
  var el=t-v.t0, cur=el<v.a? v.peak*Math.max(0,el/v.a) : v.peak*(0.8+0.2*Math.exp(-(el-v.a)/0.6));
  v.out.gain.cancelScheduledValues(t); v.out.gain.setValueAtTime(cur,t); v.out.gain.setTargetAtTime(0,t,r/4);
  var end=t+r*1.6+0.05; v.o1.stop(end); v.o2.stop(end); v.sub.stop(end);
  setTimeout(function(){ try{ v.out.disconnect(); }catch(e){} delete voices[id]; },(end-t)*1000+200);
}
function allOff(){ Object.keys(voices).forEach(function(id){ noteOff(+id); }); }
function sounding(){ var m={}; Object.keys(voices).forEach(function(id){ if(!voices[id].stopping) m[voices[id].midi]=1; }); return m; }

window.Engine={P:P,set:set,start:start,noteOn:noteOn,noteOff:noteOff,allOff:allOff,sounding:sounding,
  available:function(){ return !!AC; }, running:function(){ return !!ctx&&ctx.state==="running"; },
  suspendSilent:function(){ if(silentEl) try{ silentEl.pause(); }catch(e){} }};
})();
