/* תסיסה — מנוע 303: מתנד אחד (SAW/SQUARE), פילטר 24dB (שני lowpass בטור), מעטפת פילטר ו־VCA,
   ACCENT מגביר מעטפת ועוצמה, SLIDE גולש בגובה ולא פותח את השער מחדש. אחריו DRIVE, DELAY מסונכרן ותוף פשוט.
   build(ctx, out) עובד גם עם OfflineAudioContext לבדיקות. */
(function(){
"use strict";
function build(ctx,dest){
  var S={ctx:ctx,p:{cutoff:0.35,res:0.6,envmod:0.55,decay:0.4,accent:0.6,drive:0.25,delay:0.2,wave:"sawtooth"}};
  var osc=ctx.createOscillator(); osc.type="sawtooth"; osc.frequency.value=110;
  var f1=ctx.createBiquadFilter(),f2=ctx.createBiquadFilter(); f1.type=f2.type="lowpass";
  var vca=ctx.createGain(); vca.gain.value=0;
  var pre=ctx.createGain(), shaper=ctx.createWaveShaper(), post=ctx.createGain(), hp=ctx.createBiquadFilter(); hp.type="highpass"; hp.frequency.value=30;
  osc.connect(f1); f1.connect(f2); f2.connect(vca); vca.connect(pre); pre.connect(shaper); shaper.connect(post); post.connect(hp);
  var bus=ctx.createGain(); bus.gain.value=0.9; hp.connect(bus);
  var dl=ctx.createDelay(2), fb=ctx.createGain(), dlf=ctx.createBiquadFilter(), send=ctx.createGain(); dlf.type="bandpass"; dlf.frequency.value=1400; dlf.Q.value=0.6;
  hp.connect(send); send.connect(dl); dl.connect(dlf); dlf.connect(fb); fb.connect(dl); dlf.connect(bus);
  var comp=ctx.createDynamicsCompressor(); comp.threshold.value=-10; comp.ratio.value=3; var mg=ctx.createGain(); mg.gain.value=0.7; bus.connect(comp); comp.connect(mg); mg.connect(dest); comp=mg;
  S.out=comp;
  osc.start();
  var REF=220; // filter env runs on frequency around REF; live CUTOFF rides on detune so XY moves are instant
  function curve(d){ var n=1024,c=new Float32Array(n),k=1+d*30; for(var i=0;i<n;i++){ var x=i/(n-1)*2-1; c[i]=Math.tanh(k*x)/Math.tanh(k); } return c; }
  S.set=function(k,v){ S.p[k]=v; var t=ctx.currentTime;
    if(k==="cutoff"){ var hz=60*Math.pow(2,v*7.5); var c=1200*Math.log2(hz/REF); f1.detune.setTargetAtTime(c,t,0.01); f2.detune.setTargetAtTime(c,t,0.01); }
    else if(k==="res"){ f1.Q.setTargetAtTime(0.7+v*v*16,t,0.02); f2.Q.setTargetAtTime(0.5+v*3,t,0.02); }
    else if(k==="drive"){ shaper.curve=curve(v); pre.gain.value=1+v*3; post.gain.value=1/(1+v*2.2); }
    else if(k==="delay"){ send.gain.setTargetAtTime(v*0.7,t,0.03); fb.gain.setTargetAtTime(0.2+v*0.45,t,0.03); }
    else if(k==="wave"){ osc.type=v; }
  };
  S.tempo=function(bpm){ dl.delayTime.setTargetAtTime(60/bpm*0.75,ctx.currentTime,0.05); };
  ["cutoff","res","drive","delay"].forEach(function(k){ S.set(k,S.p[k]); }); S.tempo(132);
  function mtof(m){ return 440*Math.pow(2,(m-69)/12); }
  var gateOpen=false, lastF=110;
  /* one step. st={midi,acc,slide(from this step to next)} prevSlide: previous step slid into this one */
  S.step=function(t,dur,st,prevSlide){
    var p=S.p, f=mtof(st.midi), acc=st.acc?1:0;
    if(prevSlide&&gateOpen){ osc.frequency.cancelScheduledValues(t); osc.frequency.setValueAtTime(lastF,t); osc.frequency.setTargetAtTime(f,t,0.02); }
    else { osc.frequency.cancelScheduledValues(t); osc.frequency.setValueAtTime(f,t);
      // filter env: accent = more env, shorter decay, fixed; normal uses DECAY
      var amt=(0.3+p.envmod*5)*(1+acc*p.accent*1.2), top=REF*(1+amt*2.2), dec=acc?0.2:0.15+p.decay*1.6;
      [f1,f2].forEach(function(fl){ fl.frequency.cancelScheduledValues(t); fl.frequency.setValueAtTime(REF*0.5,t); fl.frequency.linearRampToValueAtTime(top,t+0.004); fl.frequency.setTargetAtTime(REF*0.5,t+0.004,dec/3.5); });
      var lvl=0.32*(1+acc*p.accent*0.9);
      vca.gain.cancelScheduledValues(t); vca.gain.setValueAtTime(0.0001,t); vca.gain.linearRampToValueAtTime(lvl,t+0.003);
      S.lvl=lvl;
    }
    gateOpen=true; lastF=f;
    if(!st.slide){ var off=t+dur*0.55; vca.gain.setValueAtTime(S.lvl||0.3,off); vca.gain.setTargetAtTime(0,off,0.008); gateOpen=false; }
    // with slide the gate stays open into the next step (tie)
  };
  S.silence=function(t){ vca.gain.cancelScheduledValues(t); vca.gain.setTargetAtTime(0,t,0.01); gateOpen=false; };
  var nb=ctx.createBuffer(1,ctx.sampleRate*0.2,ctx.sampleRate),nd=nb.getChannelData(0); for(var i=0;i<nd.length;i++) nd[i]=Math.random()*2-1;
  var dg=ctx.createGain(); dg.gain.value=0.8; dg.connect(comp);
  S.kick=function(t){ var o=ctx.createOscillator(),g=ctx.createGain(); o.frequency.setValueAtTime(160,t); o.frequency.exponentialRampToValueAtTime(45,t+0.1); g.gain.setValueAtTime(1,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.38); o.connect(g); g.connect(dg); o.start(t); o.stop(t+0.4); };
  S.hat=function(t,open){ var s=ctx.createBufferSource(),h=ctx.createBiquadFilter(),g=ctx.createGain(); s.buffer=nb; h.type="highpass"; h.frequency.value=7500; s.connect(h); h.connect(g); g.connect(dg); g.gain.setValueAtTime(open?0.28:0.2,t); g.gain.exponentialRampToValueAtTime(0.001,t+(open?0.16:0.045)); s.start(t); s.stop(t+0.2); };
  return S;
}
window.Acid303={build:build};
})();
