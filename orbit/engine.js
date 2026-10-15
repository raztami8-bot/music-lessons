/* כבידה — מנוע הצליל. FM פעמונים, בס אסיד, פד גל-משתנה לאצבעות, רעש מסונן, דילי וריוורב קונבולוציה שנבנה בקוד. */
(function(){
"use strict";
var E={ctx:null};
var ctx,master,comp,dry,revIn,delIn,delay,fb,recDest,noiseBuf;
var SCALES={"מינור":[0,2,3,5,7,8,10],"פריגי":[0,1,3,5,7,8,10],"דורי":[0,2,3,5,7,9,10],"פנטה":[0,3,5,7,10]};
var KEYS=["A","C","D","E","F","G"], KEYN={A:57,C:48,D:50,E:52,F:53,G:55};
E.scales=SCALES; E.keys=KEYS; E.key="A"; E.scale="מינור"; E.bpm=132;
E.note=function(deg,oct){ var s=SCALES[E.scale],n=s.length; var o=Math.floor(deg/n); var d=((deg%n)+n)%n; return KEYN[E.key]+12*(o+(oct||0))+s[d]; };
function mtof(m){ return 440*Math.pow(2,(m-69)/12); }
E.mtof=mtof;
function impulse(sec,decay){ var r=ctx.sampleRate,len=r*sec,b=ctx.createBuffer(2,len,r);
  for(var c=0;c<2;c++){ var d=b.getChannelData(c),lp=0; for(var i=0;i<len;i++){ lp=lp*0.6+(Math.random()*2-1)*0.4; d[i]=lp*Math.pow(1-i/len,decay);} } return b; }
E.unlock=function(){
  if(ctx){ if(ctx.state!=="running") ctx.resume(); return; }
  ctx=new (window.AudioContext||window.webkitAudioContext)({latencyHint:"interactive"}); E.ctx=ctx;
  var b=ctx.createBuffer(1,1,22050),s=ctx.createBufferSource(); s.buffer=b; s.connect(ctx.destination); s.start(0);
  comp=ctx.createDynamicsCompressor(); comp.threshold.value=-14; comp.ratio.value=4; comp.attack.value=0.004; comp.release.value=0.2;
  master=ctx.createGain(); master.gain.value=0.8; master.connect(comp); comp.connect(ctx.destination);
  dry=ctx.createGain(); dry.connect(master);
  var rev=ctx.createConvolver(); rev.buffer=impulse(3.2,2.6); revIn=ctx.createGain(); revIn.gain.value=0.35; var rhp=ctx.createBiquadFilter(); rhp.type="highpass"; rhp.frequency.value=250; revIn.connect(rhp); rhp.connect(rev); rev.connect(master);
  delIn=ctx.createGain(); delIn.gain.value=0.3; delay=ctx.createDelay(2); fb=ctx.createGain(); fb.gain.value=0.42; var dlp=ctx.createBiquadFilter(); dlp.frequency.value=2800;
  delIn.connect(delay); delay.connect(dlp); dlp.connect(fb); fb.connect(delay); dlp.connect(master); dlp.connect(revIn);
  E.setBpm(E.bpm);
  noiseBuf=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate); var nd=noiseBuf.getChannelData(0); for(var i=0;i<nd.length;i++) nd[i]=Math.random()*2-1;
  if(ctx.createMediaStreamDestination){ recDest=ctx.createMediaStreamDestination(); comp.connect(recDest); }
};
E.setBpm=function(b){ E.bpm=b; if(delay) delay.delayTime.setTargetAtTime(60/b*0.75,ctx.currentTime,0.05); };
function out(node,d,r,dl){ var g=ctx.createGain(); g.gain.value=d; node.connect(g); g.connect(dry); var a=ctx.createGain(); a.gain.value=r; node.connect(a); a.connect(revIn); var c=ctx.createGain(); c.gain.value=dl; node.connect(c); c.connect(delIn); }
function pan(p){ var n=ctx.createStereoPanner?ctx.createStereoPanner():ctx.createGain(); if(n.pan) n.pan.value=Math.max(-1,Math.min(1,p)); return n; }
/* FM bell/pluck: brightness b 0..1 */
E.bell=function(m,t,vel,b,p){ if(!ctx) return; t=t||ctx.currentTime; var f=mtof(m);
  var car=ctx.createOscillator(),mod=ctx.createOscillator(),mg=ctx.createGain(),g=ctx.createGain(),pn=pan(p||0);
  car.frequency.value=f; mod.frequency.value=f*(b>0.5?3.5:2); mg.gain.setValueAtTime(f*(1+b*6),t); mg.gain.exponentialRampToValueAtTime(f*0.05+1,t+0.6);
  mod.connect(mg); mg.connect(car.frequency); car.connect(g); g.connect(pn);
  g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(0.22*vel,t+0.004); g.gain.exponentialRampToValueAtTime(0.001,t+1.6);
  out(pn,0.8,0.5,0.45); car.start(t); mod.start(t); car.stop(t+1.7); mod.stop(t+1.7); };
/* acid bass: saw/square through resonant lowpass with envelope */
E.acid=function(m,t,vel,b,p){ if(!ctx) return; t=t||ctx.currentTime; var f=mtof(m);
  var o=ctx.createOscillator(),o2=ctx.createOscillator(),lp=ctx.createBiquadFilter(),g=ctx.createGain(),pn=pan((p||0)*0.4);
  o.type="sawtooth"; o2.type="square"; o.frequency.value=f; o2.frequency.value=f*0.5; o2.detune.value=6;
  var g2=ctx.createGain(); g2.gain.value=0.3; o2.connect(g2); g2.connect(lp); o.connect(lp);
  lp.type="lowpass"; lp.Q.value=8+b*14; lp.frequency.setValueAtTime(200+b*3500*vel,t); lp.frequency.exponentialRampToValueAtTime(160,t+0.25);
  lp.connect(g); g.connect(pn); g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(0.28*vel,t+0.005); g.gain.exponentialRampToValueAtTime(0.001,t+0.35);
  out(pn,1,0.08,0.15); o.start(t); o2.start(t); o.stop(t+0.4); o2.stop(t+0.4); };
/* glassy hat/noise tick for orb-orb collisions */
E.tick=function(t,vel,p){ if(!ctx) return; t=t||ctx.currentTime; var s=ctx.createBufferSource(); s.buffer=noiseBuf; s.playbackRate.value=0.8+Math.random()*0.5;
  var bp=ctx.createBiquadFilter(); bp.type="bandpass"; bp.frequency.value=7000+Math.random()*3000; bp.Q.value=3; var g=ctx.createGain(),pn=pan(p||0);
  s.connect(bp); bp.connect(g); g.connect(pn); g.gain.setValueAtTime(0.25*vel,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.08); out(pn,0.8,0.3,0.4); s.start(t,Math.random()*0.5); s.stop(t+0.1); };
E.kick=function(t){ if(!ctx) return; var o=ctx.createOscillator(),g=ctx.createGain(); o.frequency.setValueAtTime(150,t); o.frequency.exponentialRampToValueAtTime(42,t+0.12);
  g.gain.setValueAtTime(0.9,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.4); o.connect(g); g.connect(dry); o.start(t); o.stop(t+0.42); };
E.hat=function(t){ E.tick(t,0.35,0.2); };
/* held voice: morphing wavetable + shimmer grains */
var waves=null;
function mkWaves(){ waves=[]; for(var w=0;w<5;w++){ var n=32,re=new Float32Array(n),im=new Float32Array(n);
  for(var k=1;k<n;k++){ var saw=1/k, odd=(k%2?1/k:0), form=Math.exp(-Math.pow((k-(3+w*4))/2.2,2)); im[k]=w===0?(k===1?1:k===2?0.3:0):(w<2?odd:(saw*0.5+form*(w/3))); }
  waves.push(ctx.createPeriodicWave(re,im)); } }
E.voice=function(m,x,y){ if(!ctx) return null; if(!waves) mkWaves();
  var t=ctx.currentTime,f=mtof(m),o=ctx.createOscillator(),o2=ctx.createOscillator(),sub=ctx.createOscillator(),lp=ctx.createBiquadFilter(),g=ctx.createGain(),pn=pan(x*2-1),lfo=ctx.createOscillator(),lg=ctx.createGain();
  o.frequency.value=f; o2.frequency.value=f; o2.detune.value=9; sub.type="sine"; sub.frequency.value=f/2;
  lfo.frequency.value=E.bpm/60/2; lg.gain.value=0; lfo.connect(lg); lg.connect(lp.frequency);
  lp.type="lowpass"; lp.Q.value=4; [o,o2].forEach(function(n){ n.connect(lp); }); var sg=ctx.createGain(); sg.gain.value=0.5; sub.connect(sg); sg.connect(lp);
  lp.connect(g); g.connect(pn); out(pn,0.7,0.6,0.35); g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(0.13,t+0.06);
  [o,o2,sub,lfo].forEach(function(n){ n.start(t); });
  var v={m:m,set:function(m2,x2,y2){ var tt=ctx.currentTime; if(m2!==v.m){ v.m=m2; var f2=mtof(m2); o.frequency.setTargetAtTime(f2,tt,0.025); o2.frequency.setTargetAtTime(f2,tt,0.025); sub.frequency.setTargetAtTime(f2/2,tt,0.025);} 
      var wi=Math.max(0,Math.min(4,Math.round(y2*4))); if(wi!==v.w){ v.w=wi; o.setPeriodicWave(waves[wi]); o2.setPeriodicWave(waves[wi]); }
      lp.frequency.setTargetAtTime(300+y2*y2*6000,tt,0.03); lg.gain.setTargetAtTime(y2*1200,tt,0.1); if(pn.pan) pn.pan.setTargetAtTime(x2*2-1,tt,0.05); },
    stop:function(){ var tt=ctx.currentTime; g.gain.cancelScheduledValues(tt); g.gain.setTargetAtTime(0,tt,0.12); [o,o2,sub,lfo].forEach(function(n){ n.stop(tt+0.8); }); }};
  v.set(m,x,y); return v; };
E.grain=function(m,t,p){ if(!ctx) return; var o=ctx.createOscillator(),g=ctx.createGain(),pn=pan(p); o.type="triangle"; o.frequency.value=mtof(m+24)*(1+(Math.random()-0.5)*0.01);
  o.connect(g); g.connect(pn); g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(0.035,t+0.03); g.gain.linearRampToValueAtTime(0,t+0.18); out(pn,0.3,1,0.6); o.start(t); o.stop(t+0.2); };
E.stream=function(){ return recDest?recDest.stream:null; };
window.Engine=E;
})();
