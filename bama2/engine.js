/* במה 2 — מיקסר. שדרוג מול bama/: יציאה בסגנון pendulum (low-cut נגד DC, לימיטר, קטימה רכה ×2), דיליי פינג־פונג קלטת,
   ריוורב עם החזרות מוקדמות וזנב שמתכהה (זרע קבוע, קצר וארוך), DRIVE עדין עם ×4, ותיקון מתג השקט באייפון.
   במה — מיקסר, תופים ואפקטים ראשיים. build(ctx,dest) עובד גם עם OfflineAudioContext.
   ערוצים: kick, clap, hats, bass → bus → DRIVE → פילטר LP → פילטר HP → TAPE (דיליי משתנה) → VOLUME → לימיטר.
   שליחות אחרי הפילטר: דיליי מסונכרן ורוורב קונבולוציה שנבנה בקוד. */
(function(){
"use strict";
function impulse(c,sec,bright){ // from pendulum/engine.js makeIR: fixed-seed noise, darkening tail, early reflections
  var sr=c.sampleRate, n=Math.floor(sr*sec), b=c.createBuffer(2,n,sr), s=9876;
  for(var ch=0;ch<2;ch++){ var d=b.getChannelData(ch), lp=0, k=.25+bright*.35; s=9876+ch*777;
    for(var i=0;i<n;i++){ s=(s*1103515245+12345)&0x7fffffff; var w=s/0x3fffffff-1, t=i/n;
      var env=Math.pow(1-t,2.2)*Math.exp(-t*3.2); lp+=(w-lp)*(k*(1-t*.8)+.02); d[i]=lp*env*(i<sr*.03?.35:1); }
    [.011,.019,.027,.041,.053].forEach(function(dt,j){ var at=Math.floor(dt*sr*(ch?1.07:1)); if(at<n) d[at]+=(.5-j*.08)*(ch?-1:1); }); }
  return b; }
function softCurve(k){ var n=2049,cc=new Float32Array(n); for(var i=0;i<n;i++){ var x=i/(n-1)*2-1; cc[i]=Math.tanh(x*k)/Math.tanh(k); } return cc; }
/* iPhone/iPad: play even with the silent switch on (same trick as pendulum/groove) */
var silentEl=null;
function silentWav(){ var n=1600,buf=new Uint8Array(44+n),dv=new DataView(buf.buffer); function str(o,t){ for(var i=0;i<t.length;i++) buf[o+i]=t.charCodeAt(i); }
  str(0,"RIFF"); dv.setUint32(4,36+n,true); str(8,"WAVE"); str(12,"fmt "); dv.setUint32(16,16,true); dv.setUint16(20,1,true); dv.setUint16(22,1,true);
  dv.setUint32(24,8000,true); dv.setUint32(28,8000,true); dv.setUint16(32,1,true); dv.setUint16(34,8,true); str(36,"data"); dv.setUint32(40,n,true); for(var i=0;i<n;i++) buf[44+i]=128;
  var b=""; for(var j=0;j<buf.length;j++) b+=String.fromCharCode(buf[j]); return "data:audio/wav;base64,"+btoa(b); }
function playbackSession(){ try{ if(navigator.audioSession&&navigator.audioSession.type!=="playback") navigator.audioSession.type="playback"; }catch(e){}
  if(navigator.audioSession) return; if(!silentEl){ silentEl=document.createElement("audio"); silentEl.setAttribute("playsinline",""); silentEl.loop=true; silentEl.src=silentWav(); }
  if(silentEl.paused){ var pr=silentEl.play(); if(pr&&pr.catch) pr.catch(function(){}); } }
function build(ctx,dest,useLadder){
  var M={ctx:ctx}, t0=ctx.currentTime;
  var bus=ctx.createGain(), pre=ctx.createGain(), sh=ctx.createWaveShaper(), post=ctx.createGain();
  var lp=ctx.createBiquadFilter(), hp=ctx.createBiquadFilter(); lp.type="lowpass"; hp.type="highpass"; lp.frequency.value=20000; hp.frequency.value=20; lp.Q.value=hp.Q.value=0.9;
  var tape=ctx.createDelay(3); tape.delayTime.value=0;
  var vol=ctx.createGain(), dc=ctx.createBiquadFilter(), lim=ctx.createDynamicsCompressor(), clipIn=ctx.createGain(), clip=ctx.createWaveShaper(), outG=ctx.createGain();
  dc.type="highpass"; dc.frequency.value=24; dc.Q.value=.5;
  lim.threshold.value=-10; lim.knee.value=4; lim.ratio.value=12; lim.attack.value=0.003; lim.release.value=0.18;
  clipIn.gain.value=0.75/1.3; clip.curve=(function(){ var n=2049,cc=new Float32Array(n); for(var i=0;i<n;i++){ var x=(i/1024-1)*1.3; cc[i]=Math.tanh(x)*.98; } return cc; })(); clip.oversample="2x"; outG.gain.value=1;
  sh.oversample="4x";
  bus.connect(pre); pre.connect(sh); sh.connect(post); post.connect(lp); lp.connect(hp); hp.connect(tape); tape.connect(vol); vol.connect(dc); dc.connect(lim); lim.connect(clipIn); clipIn.connect(clip); clip.connect(outG); outG.connect(dest);
  M.out=outG; M.analyser=ctx.createAnalyser(); M.analyser.fftSize=512; outG.connect(M.analyser);
  // tape ping-pong delay (pendulum style): lowpass + highpass + soft saturation in each feedback leg, slow wow on the time
  var dSend=ctx.createGain(); dSend.gain.value=0; var dL=ctx.createDelay(2), dR=ctx.createDelay(2);
  function leg(){ var l=ctx.createBiquadFilter(); l.type="lowpass"; l.frequency.value=3200; l.Q.value=.3; var h=ctx.createBiquadFilter(); h.type="highpass"; h.frequency.value=140;
    var w=ctx.createWaveShaper(); w.curve=softCurve(1.6); w.oversample="2x"; var g=ctx.createGain(); g.gain.value=.38; l.connect(h); h.connect(w); w.connect(g); return {in:l,out:g,g:g.gain}; }
  var fL=leg(), fR=leg(); dSend.connect(dL); dL.connect(fL.in); fL.out.connect(dR); dR.connect(fR.in); fR.out.connect(dL);
  var pL=ctx.createStereoPanner?ctx.createStereoPanner():ctx.createGain(), pR=ctx.createStereoPanner?ctx.createStereoPanner():ctx.createGain(); if(pL.pan){ pL.pan.value=-.7; pR.pan.value=.7; }
  var dRet=ctx.createGain(); dL.connect(pL); dR.connect(pR); pL.connect(dRet); pR.connect(dRet); dRet.connect(tape);
  var wow=ctx.createOscillator(), wowG=ctx.createGain(); wow.frequency.value=.31; wowG.gain.value=.0016; wow.connect(wowG); wowG.connect(dL.delayTime); wowG.connect(dR.delayTime); wow.start();
  hp.connect(dSend);
  var fb={gain:{setTargetAtTime:function(v,t,k){ fL.g.setTargetAtTime(v,t,k); fR.g.setTargetAtTime(v,t,k); }}};
  var dl={delayTime:{setTargetAtTime:function(v,t,k){ dL.delayTime.setTargetAtTime(v,t,k); dR.delayTime.setTargetAtTime(v,t,k); }}};
  // reverb: short room for the XY pad, long hall for WASH and the riser
  var rSend=ctx.createGain(), rLong=ctx.createGain(), rvS=ctx.createConvolver(), rvL=ctx.createConvolver(), rhp=ctx.createBiquadFilter();
  rvS.buffer=impulse(ctx,1.7,.9); rvL.buffer=impulse(ctx,6.5,.55); rSend.gain.value=0.08; rLong.gain.value=0; rhp.type="highpass"; rhp.frequency.value=200;
  hp.connect(rhp); rhp.connect(rSend); rhp.connect(rLong); rSend.connect(rvS); rLong.connect(rvL); rvS.connect(tape); rvL.connect(tape); dRet.connect(rSend);
  // channels
  var ch={}; ["kick","clap","hats","bass","fx"].forEach(function(k){ var g=ctx.createGain(); g.connect(bus); ch[k]=g; });
  M.ch=ch;
  M.mute=function(k,on){ ch[k].gain.setTargetAtTime(on?0:1,ctx.currentTime,0.01); };
  M.bass=Acid303.build(ctx,ch.bass,useLadder); M.ladder=M.bass.ladder;
  function curve(d){ var n=2049,c=new Float32Array(n),k=1+d*5; for(var i=0;i<n;i++){ var x=i/(n-1)*2-1; c[i]=Math.tanh(k*x)/Math.tanh(k); } return c; }
  M.drive=function(v){ sh.curve=curve(v); pre.gain.value=1+v*2; post.gain.value=1/(1+v*1.6); };
  M.vol=function(v){ M.v=v*v*1.1; vol.gain.setTargetAtTime(M.v,ctx.currentTime,0.02); };
  /* XY: x 0..0.5 lowpass closes, 0.5..1 highpass opens; y = delay + reverb */
  M.xy=function(x,y){ var t=ctx.currentTime;
    var lf=x<0.47?150*Math.pow(20000/150,x/0.47):20000, hf=x>0.53?20*Math.pow(3000/20,(x-0.53)/0.47):20;
    lp.frequency.setTargetAtTime(lf,t,0.02); hp.frequency.setTargetAtTime(hf,t,0.02); lp.Q.value=hp.Q.value=0.9+Math.abs(x-0.5)*7;
    M.base={d:y*0.55,r:0.08+y*0.5}; if(!M.thr) dSend.gain.setTargetAtTime(M.base.d,t,0.03); if(!M.wsh) rSend.gain.setTargetAtTime(M.base.r,t,0.05); };
  M.base={d:0,r:0.08};
  M.throwOn=function(on){ M.thr=on; var t=ctx.currentTime; dSend.gain.setTargetAtTime(on?0.9:M.base.d,t,0.01); fb.gain.setTargetAtTime(on?0.7:0.38,t,0.05); };
  M.washOn=function(on){ M.wsh=on; rLong.gain.setTargetAtTime(on?1.1:0,ctx.currentTime,on?0.08:0.5); };
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
    s.connect(bp); bp.connect(g); g.connect(ch.fx); g.connect(rLong); s.start(t); riser={s:s,g:g};
    hp.frequency.cancelScheduledValues(t); hp.frequency.setValueAtTime(Math.max(20,hp.frequency.value),t); hp.frequency.exponentialRampToValueAtTime(700,t+dur); };
  M.riserStop=function(t){ if(!riser) return; riser.g.gain.cancelScheduledValues(t); riser.g.gain.setTargetAtTime(0,t,0.01); riser.s.stop(t+0.2); riser=null;
    hp.frequency.cancelScheduledValues(t); hp.frequency.setValueAtTime(20,t); };
  M.impact=function(t){ M.kick(t,1.2); var o=ctx.createOscillator(),g=ctx.createGain(); o.frequency.setValueAtTime(60,t); o.frequency.exponentialRampToValueAtTime(35,t+1.2); g.gain.setValueAtTime(0.5,t); g.gain.exponentialRampToValueAtTime(0.001,t+1.5); o.connect(g); g.connect(ch.fx); o.start(t); o.stop(t+1.6);
    noise(t,2,"highpass",3000,0.5,0.25,ch.fx,1.8); };
  M.drive(0.25); M.xy(0.5,0); M.tempo(134); M.vol(0.8);
  return M;
}
window.BamaEngine={build:build,playbackSession:playbackSession};
})();
