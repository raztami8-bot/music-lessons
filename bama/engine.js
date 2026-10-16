/* במה — מיקסר, תופים ואפקטים ראשיים. build(ctx,dest) עובד גם עם OfflineAudioContext.
   ערוצים: kick, clap, hats, bass → bus → DRIVE → פילטר LP → פילטר HP → TAPE (דיליי משתנה) → VOLUME → לימיטר.
   שליחות אחרי הפילטר: דיליי מסונכרן ורוורב קונבולוציה שנבנה בקוד. */
(function(){
"use strict";
function impulse(ctx,sec){ var r=ctx.sampleRate,n=Math.floor(r*sec),b=ctx.createBuffer(2,n,r); for(var c=0;c<2;c++){ var d=b.getChannelData(c),lp=0; for(var i=0;i<n;i++){ lp=lp*0.55+(Math.random()*2-1)*0.45; d[i]=lp*Math.pow(1-i/n,2.4); } } return b; }
function build(ctx,dest){
  var M={ctx:ctx}, t0=ctx.currentTime;
  var bus=ctx.createGain(), pre=ctx.createGain(), sh=ctx.createWaveShaper(), post=ctx.createGain();
  var lp=ctx.createBiquadFilter(), hp=ctx.createBiquadFilter(); lp.type="lowpass"; hp.type="highpass"; lp.frequency.value=20000; hp.frequency.value=20; lp.Q.value=hp.Q.value=0.9;
  var tape=ctx.createDelay(3); tape.delayTime.value=0;
  var vol=ctx.createGain(), lim=ctx.createDynamicsCompressor(), outG=ctx.createGain();
  lim.threshold.value=-8; lim.knee.value=4; lim.ratio.value=12; lim.attack.value=0.002; lim.release.value=0.12; outG.gain.value=0.7;
  bus.connect(pre); pre.connect(sh); sh.connect(post); post.connect(lp); lp.connect(hp); hp.connect(tape); tape.connect(vol); vol.connect(lim); lim.connect(outG); outG.connect(dest);
  M.out=outG;
  // sends
  var dSend=ctx.createGain(), dl=ctx.createDelay(2), fb=ctx.createGain(), dbp=ctx.createBiquadFilter(); dSend.gain.value=0; fb.gain.value=0.45; dbp.type="bandpass"; dbp.frequency.value=1500; dbp.Q.value=0.7;
  hp.connect(dSend); dSend.connect(dl); dl.connect(dbp); dbp.connect(fb); fb.connect(dl); dbp.connect(tape);
  var rSend=ctx.createGain(), rv=ctx.createConvolver(), rhp=ctx.createBiquadFilter(); rv.buffer=impulse(ctx,3.5); rSend.gain.value=0.08; rhp.type="highpass"; rhp.frequency.value=300;
  hp.connect(rSend); rSend.connect(rhp); rhp.connect(rv); rv.connect(tape); dbp.connect(rSend);
  // channels
  var ch={}; ["kick","clap","hats","bass","fx"].forEach(function(k){ var g=ctx.createGain(); g.connect(bus); ch[k]=g; });
  M.ch=ch;
  M.mute=function(k,on){ ch[k].gain.setTargetAtTime(on?0:1,ctx.currentTime,0.01); };
  M.bass=Acid303.build(ctx,ch.bass); M.bass.set("delay",0);
  function curve(d){ var n=1024,c=new Float32Array(n),k=1+d*12; for(var i=0;i<n;i++){ var x=i/(n-1)*2-1; c[i]=Math.tanh(k*x)/Math.tanh(k); } return c; }
  M.drive=function(v){ sh.curve=curve(v); pre.gain.value=1+v*2; post.gain.value=1/(1+v*1.6); };
  M.vol=function(v){ M.v=v*v*1.1; vol.gain.setTargetAtTime(M.v,ctx.currentTime,0.02); };
  /* XY: x 0..0.5 lowpass closes, 0.5..1 highpass opens; y = delay + reverb */
  M.xy=function(x,y){ var t=ctx.currentTime;
    var lf=x<0.47?150*Math.pow(20000/150,x/0.47):20000, hf=x>0.53?20*Math.pow(3000/20,(x-0.53)/0.47):20;
    lp.frequency.setTargetAtTime(lf,t,0.02); hp.frequency.setTargetAtTime(hf,t,0.02); lp.Q.value=hp.Q.value=0.9+Math.abs(x-0.5)*7;
    M.base={d:y*0.55,r:0.08+y*0.5}; if(!M.thr) dSend.gain.setTargetAtTime(M.base.d,t,0.03); if(!M.wsh) rSend.gain.setTargetAtTime(M.base.r,t,0.05); };
  M.base={d:0,r:0.08};
  M.throwOn=function(on){ M.thr=on; var t=ctx.currentTime; dSend.gain.setTargetAtTime(on?0.9:M.base.d,t,0.01); fb.gain.setTargetAtTime(on?0.62:0.45,t,0.05); };
  M.washOn=function(on){ M.wsh=on; rSend.gain.setTargetAtTime(on?1.2:M.base.r,ctx.currentTime,on?0.08:0.4); };
  M.tempo=function(bpm){ dl.delayTime.setTargetAtTime(60/bpm*0.75,ctx.currentTime,0.05); M.bass.tempo(bpm); };
  /* tape stop: delay time follows t²/2T, so the playback rate falls linearly from 1 to 0 over T */
  M.tape=function(on,T){ var t=ctx.currentTime; tape.delayTime.cancelScheduledValues(t);
    if(on){ T=T||0.9; var n=64,c=new Float32Array(n); for(var i=0;i<n;i++){ var tt=T*i/(n-1); c[i]=tt*tt/(2*T); } tape.delayTime.setValueCurveAtTime(c,t,T); vol.gain.setTargetAtTime(0,t+T*0.7,0.08); }
    else { vol.gain.cancelScheduledValues(t); vol.gain.setValueAtTime(0,t); tape.delayTime.setValueAtTime(0,t+0.01); vol.gain.setTargetAtTime(M.v||0.7,t+0.02,0.02); } };
  var nb=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate),nd=nb.getChannelData(0); for(var i=0;i<nd.length;i++) nd[i]=Math.random()*2-1;
  function noise(t,dur,type,f,q,g0,dest2,decay){ var s=ctx.createBufferSource(),fl=ctx.createBiquadFilter(),g=ctx.createGain(); s.buffer=nb; fl.type=type; fl.frequency.value=f; fl.Q.value=q;
    s.connect(fl); fl.connect(g); g.connect(dest2); g.gain.setValueAtTime(g0,t); g.gain.exponentialRampToValueAtTime(0.001,t+decay); s.start(t,Math.random()); s.stop(t+decay+0.02); }
  M.kick=function(t,v){ v=v||1; var o=ctx.createOscillator(),g=ctx.createGain(),c=ctx.createOscillator(),cg=ctx.createGain();
    o.frequency.setValueAtTime(170,t); o.frequency.exponentialRampToValueAtTime(46,t+0.09); g.gain.setValueAtTime(0.95*v,t); g.gain.setTargetAtTime(0,t+0.08,0.09);
    o.connect(g); g.connect(ch.kick); o.start(t); o.stop(t+0.6);
    c.type="square"; c.frequency.value=900; cg.gain.setValueAtTime(0.08*v,t); cg.gain.exponentialRampToValueAtTime(0.001,t+0.01); c.connect(cg); cg.connect(ch.kick); c.start(t); c.stop(t+0.02); };
  M.clap=function(t,v){ v=v||1; for(var k=0;k<3;k++) noise(t+k*0.011,0.02,"bandpass",1300,1.4,0.5*v,ch.clap,0.03); noise(t+0.033,0.2,"bandpass",1200,1.2,0.45*v,ch.clap,0.22); };
  M.hat=function(t,open,v){ v=v||1; noise(t,0.1,"highpass",open?7000:8500,0.8,(open?0.22:0.16)*v,ch.hats,open?0.22:0.04); };
  M.perc=function(t,v){ var o=ctx.createOscillator(),m=ctx.createOscillator(),mg=ctx.createGain(),g=ctx.createGain(); o.frequency.value=520; m.frequency.value=1370; mg.gain.value=900;
    m.connect(mg); mg.connect(o.frequency); o.connect(g); g.connect(ch.hats); g.gain.setValueAtTime(0.16*(v||1),t); g.gain.exponentialRampToValueAtTime(0.001,t+0.08); o.start(t); m.start(t); o.stop(t+0.1); m.stop(t+0.1); };
  /* riser: noise + rising bandpass, also pulls a highpass on the music */
  var riser=null;
  M.riser=function(t,dur){ M.riserStop(t); var s=ctx.createBufferSource(),bp=ctx.createBiquadFilter(),g=ctx.createGain(); s.buffer=nb; s.loop=true; bp.type="bandpass"; bp.Q.value=4;
    bp.frequency.setValueAtTime(300,t); bp.frequency.exponentialRampToValueAtTime(9000,t+dur); g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(0.35,t+dur);
    s.connect(bp); bp.connect(g); g.connect(ch.fx); g.connect(rSend); s.start(t); riser={s:s,g:g};
    hp.frequency.cancelScheduledValues(t); hp.frequency.setValueAtTime(Math.max(20,hp.frequency.value),t); hp.frequency.exponentialRampToValueAtTime(700,t+dur); };
  M.riserStop=function(t){ if(!riser) return; riser.g.gain.cancelScheduledValues(t); riser.g.gain.setTargetAtTime(0,t,0.01); riser.s.stop(t+0.2); riser=null;
    hp.frequency.cancelScheduledValues(t); hp.frequency.setValueAtTime(20,t); };
  M.impact=function(t){ M.kick(t,1.2); var o=ctx.createOscillator(),g=ctx.createGain(); o.frequency.setValueAtTime(60,t); o.frequency.exponentialRampToValueAtTime(35,t+1.2); g.gain.setValueAtTime(0.5,t); g.gain.exponentialRampToValueAtTime(0.001,t+1.5); o.connect(g); g.connect(ch.fx); o.start(t); o.stop(t+1.6);
    noise(t,2,"highpass",3000,0.5,0.25,ch.fx,1.8); };
  M.drive(0.25); M.xy(0.5,0); M.tempo(134); M.vol(0.8);
  return M;
}
window.BamaEngine={build:build};
})();
