/* במה 2 · קול 303. הלוגיקה של fizz/bama נשמרה (ACCENT מגביר מעטפת ועוצמה, SLIDE גולש ולא פותח את השער מחדש),
   אבל הפילטר הוא ladder ב־AudioWorklet (ladder.js) עם מעטפת מתוזמנת לכל דגימה על cutoff ו־res.
   אם אין worklet: שני lowpass בטור כמו קודם. DRIVE עדין עם דגימת־יתר ×4. FAT (כבוי כברירת מחדל): ריבוע מכוון מעט ותת־סינוס. */
(function(){
"use strict";
function build(ctx,dest,useLadder){
  var S={ctx:ctx,ladder:false,p:{cutoff:0.35,res:0.6,envmod:0.55,decay:0.4,accent:0.6,drive:0.25,delay:0,wave:"sawtooth",fat:false}};
  var osc=ctx.createOscillator(); osc.type="sawtooth"; osc.frequency.value=110;
  var o2=ctx.createOscillator(); o2.type="square"; o2.detune.value=9; var sub=ctx.createOscillator(); sub.type="sine";
  var g1=ctx.createGain(); g1.gain.value=0.7; var g2=ctx.createGain(); g2.gain.value=0; var gs=ctx.createGain(); gs.gain.value=0;
  osc.connect(g1); o2.connect(g2); sub.connect(gs);
  var REF=220, F;
  if(useLadder){ try{ var n=new AudioWorkletNode(ctx,"ladder2",{numberOfInputs:1,numberOfOutputs:1,outputChannelCount:[1]});
    F={inp:n,out:n,freq:[n.parameters.get("cutoff")],det:[n.parameters.get("detune")],res:n.parameters.get("res"),drv:n.parameters.get("drive")}; S.ladder=true; }catch(e){ F=null; } }
  if(!F){ var f1=ctx.createBiquadFilter(),f2=ctx.createBiquadFilter(); f1.type=f2.type="lowpass"; f1.connect(f2); F={inp:f1,out:f2,freq:[f1.frequency,f2.frequency],det:[f1.detune,f2.detune],q:[f1.Q,f2.Q]}; }
  [g1,g2,gs].forEach(function(g){ g.connect(F.inp); });
  var vca=ctx.createGain(); vca.gain.value=0;
  var pre=ctx.createGain(), shaper=ctx.createWaveShaper(), post=ctx.createGain(), hp=ctx.createBiquadFilter(); shaper.oversample="4x"; hp.type="highpass"; hp.frequency.value=30;
  F.out.connect(vca); vca.connect(pre); pre.connect(shaper); shaper.connect(post); post.connect(hp); hp.connect(dest);
  S.out=hp;
  [osc,o2,sub].forEach(function(o){ o.start(); });
  function curve(d){ var n=2049,c=new Float32Array(n),k=1+d*4; for(var i=0;i<n;i++){ var x=i/(n-1)*2-1; c[i]=Math.tanh(k*x)/Math.tanh(k); } return c; }
  function resAt(v,acc){ return Math.min(1.08,v*1.0+(acc?0.06:0)); }
  S.set=function(k,v){ S.p[k]=v; var t=ctx.currentTime;
    if(k==="cutoff"){ var hz=60*Math.pow(2,v*7.5), c=1200*Math.log2(hz/REF); F.det.forEach(function(d){ d.setTargetAtTime(c,t,0.01); }); }
    else if(k==="res"){ if(F.res) F.res.setTargetAtTime(resAt(v),t,0.02); else { F.q[0].setTargetAtTime(0.7+v*v*16,t,0.02); F.q[1].setTargetAtTime(0.5+v*3,t,0.02); } }
    else if(k==="drive"){ shaper.curve=curve(v); pre.gain.value=1+v*1.5; post.gain.value=1/(1+v*0.9); if(F.drv) F.drv.setTargetAtTime(1+v*1.5,t,0.02); }
    else if(k==="wave"){ osc.type=v; }
    else if(k==="fat"){ g2.gain.setTargetAtTime(v?0.32:0,t,0.02); gs.gain.setTargetAtTime(v?0.34:0,t,0.02); g1.gain.setTargetAtTime(v?0.5:0.7,t,0.02); }
  };
  S.tempo=function(){};
  ["cutoff","res","drive"].forEach(function(k){ S.set(k,S.p[k]); });
  function mtof(m){ return 440*Math.pow(2,(m-69)/12); }
  var gateOpen=false,lastF=110;
  function setPitch(f,t,glide){ [[osc,f],[o2,f],[sub,f/2]].forEach(function(a){ var fp=a[0].frequency; fp.cancelScheduledValues(t);
    if(glide){ fp.setValueAtTime(a[0]===sub?lastF/2:lastF,t); fp.setTargetAtTime(a[1],t,0.02); } else fp.setValueAtTime(a[1],t); }); }
  S.step=function(t,dur,st,prevSlide){
    var p=S.p, f=mtof(st.midi), acc=st.acc?1:0;
    if(prevSlide&&gateOpen){ setPitch(f,t,true); }
    else { setPitch(f,t,false);
      var amt=(0.3+p.envmod*5)*(1+acc*p.accent*1.2), top=Math.min(9000,REF*(1+amt*2.2)), dec=acc?0.2:0.15+p.decay*1.6;
      F.freq.forEach(function(fp){ fp.cancelScheduledValues(t); fp.setValueAtTime(REF*0.5,t); fp.linearRampToValueAtTime(top,t+0.004); fp.setTargetAtTime(REF*0.5,t+0.004,dec/3.5); });
      if(F.res){ F.res.cancelScheduledValues(t); F.res.setValueAtTime(resAt(p.res,acc),t); F.res.setTargetAtTime(resAt(p.res),t+0.01,0.15); }
      var lvl=0.32*(1+acc*p.accent*0.9);
      vca.gain.cancelScheduledValues(t); vca.gain.setValueAtTime(0.0001,t); vca.gain.linearRampToValueAtTime(lvl,t+0.003); S.lvl=lvl;
    }
    gateOpen=true; lastF=f;
    if(!st.slide){ var off=t+dur*0.55; vca.gain.setValueAtTime(S.lvl||0.3,off); vca.gain.setTargetAtTime(0,off,0.008); gateOpen=false; }
  };
  S.silence=function(t){ vca.gain.cancelScheduledValues(t); vca.gain.setTargetAtTime(0,t,0.01); gateOpen=false; };
  return S;
}
window.Acid303={build:build};
})();
