/* Sound examples, notebook and glossary for the Claude version. Loaded after app.js. */
(function(){
"use strict";
var NOTES="ml2:notes", SOUNDS="ml2:sounds";
function get(k,d){ try{ var v=localStorage.getItem(k); return v==null?d:JSON.parse(v); }catch(e){ return d; } }
function set(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} }
function list(s){ return (s||"").split(",").map(function(x){return x.trim();}).filter(Boolean); }
function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];}); }
var NS="http://www.w3.org/2000/svg";

/* ---------- clock positions ---------- */
// value 0..1 across the knob's travel: fully left (7) = 0, 12 = 0.5, fully right (5) = 1
function hourToV(h){ var a=h===12?0:(h>=7?(h-12)*30:h*30); return (a+150)/300; }
function vToText(v){
  var h=Math.round((v*300-150)/30);
  if(h<=-5) return "עד הסוף שמאלה"; if(h>=5) return "עד הסוף ימינה";
  return "שעה "+(h===0?12:(h<0?12+h:h));
}
function dialSVG(v){
  var a=(v*300-150)*Math.PI/180, x=(50+26*Math.sin(a)).toFixed(1), y=(50-26*Math.cos(a)).toFixed(1);
  function p(d){ var r=d*Math.PI/180; return (50+42*Math.sin(r)).toFixed(1)+" "+(50-42*Math.cos(r)).toFixed(1); }
  return '<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M'+p(-150)+' A42 42 0 1 1 '+p(150)+'" fill="none" stroke="var(--line)" stroke-width="5" stroke-linecap="round"/>'+
    '<circle cx="50" cy="50" r="28" fill="var(--surface)" stroke="var(--muted)" stroke-width="2.5"/>'+
    '<line x1="50" y1="50" x2="'+x+'" y2="'+y+'" stroke="var(--pointer)" stroke-width="6" stroke-linecap="round"/></svg>';
}

/* ---------- the little bass synth ---------- */
var Audio=(function(){
  var ctx=null, out=null, noise=null, timer=null, playing=null, onStop=null;
  var silentEl=null, unlocked=false;
  // A short silent WAV, used to move iOS into "playback" audio so the ring/silent switch does not mute us.
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
  function iosPlayback(){
    try{ if(navigator.audioSession && navigator.audioSession.type!=="playback") navigator.audioSession.type="playback"; }catch(e){}
    if(navigator.audioSession) return;           // newer iOS: the line above is enough
    if(!silentEl){ silentEl=document.createElement("audio"); silentEl.setAttribute("playsinline",""); silentEl.setAttribute("x-webkit-airplay","deny");
      silentEl.preload="auto"; silentEl.loop=true; silentEl.src=silentWav(); }
    var pr=silentEl.play(); if(pr&&pr.catch) pr.catch(function(){});
  }
  function ac(){
    iosPlayback();
    if(!ctx){
      var C=window.AudioContext||window.webkitAudioContext; if(!C) return null;
      ctx=new C(); out=ctx.createGain(); out.gain.value=0.5;
      var comp=ctx.createDynamicsCompressor(); comp.threshold.value=-18; comp.ratio.value=6;
      out.connect(comp); comp.connect(ctx.destination);
      var len=ctx.sampleRate; noise=ctx.createBuffer(1,len,ctx.sampleRate);
      var d=noise.getChannelData(0); for(var i=0;i<len;i++) d[i]=Math.random()*2-1;
    }
    if(ctx.state!=="running"){ try{ var r=ctx.resume(); if(r&&r.catch) r.catch(function(){}); }catch(e){} }
    if(!unlocked){   // iOS starts the audio only after something plays inside a tap
      try{ var sb=ctx.createBufferSource(); sb.buffer=ctx.createBuffer(1,1,22050); sb.connect(ctx.destination); sb.start(0); unlocked=true; }catch(e){}
    }
    return ctx;
  }
  function running(){ return !!ctx && ctx.state==="running"; }
  function hz(key){ return 110*Math.pow(2,(key-1)/12); }          // key 1 = A2
  function cutHz(v){ return 45*Math.pow(2,v*8.2); }                // ~45 Hz to ~13 kHz
  function att(v){ return 0.002+v*v*1.2; }
  function dec(v){ return 0.03+v*v*2.2; }
  function res(v){ return 0.7+Math.pow(v,1.4)*24; }                 // resonance, in dB

  // One mono voice that stays alive for the whole loop, so slides can glide.
  function makeVoice(p){
    var c=ac(), o=c.createOscillator(), f=c.createBiquadFilter(), g=c.createGain();
    o.type=p.wave==="square"?"square":"sawtooth"; f.type="lowpass"; g.gain.value=0;
    o.connect(f); f.connect(g); g.connect(out); o.start();
    return {o:o,f:f,g:g};
  }
  function trigger(v,p,t,key,glideFrom,stepDur){
    var a=att(p.attack), d=dec(p.decay), base=cutHz(p.cutoff), top=Math.min(18000,base*Math.pow(2,p.eg*5.5));
    v.o.type=p.wave==="square"?"square":"sawtooth";
    v.f.Q.setValueAtTime(res(p.peak),t);
    if(glideFrom){ v.o.frequency.setTargetAtTime(hz(key),t,Math.max(0.02,stepDur*0.25)); return; }
    v.o.frequency.cancelScheduledValues(t); v.o.frequency.setValueAtTime(hz(key),t);
    v.f.frequency.cancelScheduledValues(t); v.f.frequency.setValueAtTime(base,t);
    v.f.frequency.linearRampToValueAtTime(top,t+a); v.f.frequency.setTargetAtTime(base,t+a,d/3);
    v.g.gain.cancelScheduledValues(t); v.g.gain.setValueAtTime(0,t);
    v.g.gain.linearRampToValueAtTime(p.ampeg===false?0.9:1,t+a);
    if(p.ampeg===false) v.g.gain.setTargetAtTime(0.9,t+a,0.05); else v.g.gain.setTargetAtTime(0,t+a,d/3);
  }
  function release(v,t){ v.g.gain.cancelScheduledValues(t); v.g.gain.setTargetAtTime(0,t,0.015); }

  function drum(kind,t){
    var c=ctx;
    if(kind==="kick"){
      var o=c.createOscillator(), g=c.createGain(); o.type="sine";
      o.frequency.setValueAtTime(160,t); o.frequency.exponentialRampToValueAtTime(45,t+0.09);
      g.gain.setValueAtTime(1.1,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.32);
      o.connect(g); g.connect(out); o.start(t); o.stop(t+0.35); return;
    }
    var s=c.createBufferSource(), fl=c.createBiquadFilter(), g2=c.createGain(); s.buffer=noise;
    var len={clap:0.18,closed:0.05,open:0.32}[kind]||0.05;
    if(kind==="clap"){ fl.type="bandpass"; fl.frequency.value=1200; fl.Q.value=1.2;
      g2.gain.setValueAtTime(0,t); [0,0.012,0.024].forEach(function(o){ g2.gain.setValueAtTime(0.9,t+o); g2.gain.setTargetAtTime(0.15,t+o+0.003,0.004); });
      g2.gain.setTargetAtTime(0,t+0.03,0.05);
    } else { fl.type="highpass"; fl.frequency.value=7000; g2.gain.setValueAtTime(0.35,t); g2.gain.setTargetAtTime(0,t+0.005,len/3); }
    s.connect(fl); fl.connect(g2); g2.connect(out); s.start(t); s.stop(t+len+0.3);
  }

  // pattern: {steps:[{key|null, slide:bool, drums:[]}], bpm}
  function start(pattern,getParams,stopCb){
    stop(); var c=ac(); if(!c) return false;
    var stepDur=60/(pattern.bpm||128)/4, i=0, next=c.currentTime+0.06, v=null, prevSlide=false;
    if(pattern.steps.some(function(s){return s.key;})) v=makeVoice(getParams());
    playing={v:v}; onStop=stopCb||null;
    timer=setInterval(function(){
      while(next<c.currentTime+0.12){
        var s=pattern.steps[i%pattern.steps.length], p=getParams();
        if(s.key){ trigger(v,p,next,s.key,prevSlide,stepDur); prevSlide=!!s.slide; }
        else if(v && s.key===null){ release(v,next); prevSlide=false; }
        (s.drums||[]).forEach(function(k){ drum(k,next); });
        if(p.kick && i%4===0 && !(s.drums||[]).length) drum("kick",next);
        next+=stepDur; i++;
      }
    },25);
    return true;
  }
  function stop(){
    if(timer){ clearInterval(timer); timer=null; }
    if(playing&&playing.v){ var v=playing.v, t=ctx.currentTime; release(v,t); v.o.stop(t+0.2); }
    playing=null; if(silentEl){ try{ silentEl.pause(); }catch(e){} } var cb=onStop; onStop=null; if(cb) cb();
  }
  function note(key,p){
    var c=ac(); if(!c) return; var v=makeVoice(p), t=c.currentTime+0.01;
    trigger(v,p,t,key,false,0.12); v.o.stop(t+att(p.attack)+dec(p.decay)*2+0.3);
  }
  return {start:start, stop:stop, note:note, unlock:ac, running:running, available:function(){ return !!(window.AudioContext||window.webkitAudioContext); }};
})();

var IOS=/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
var ACID={wave:"saw",attack:7,decay:10,cutoff:10,peak:2,eg:1,kick:true};
var LABEL={cutoff:"CUTOFF",peak:"PEAK",eg:"CUTOFF EG INT",decay:"DECAY/RELEASE",attack:"ATTACK"};
var ORDER=["attack","decay","eg","peak","cutoff"];   // left to right, as on the bass panel
function parseSet(s){
  var o={}; Object.keys(ACID).forEach(function(k){ o[k]=ACID[k]; });
  list(s).forEach(function(kv){ var a=kv.split(":"); var k=a[0], val=a[1];
    if(k==="wave") o.wave=val; else if(k==="kick") o.kick=(val==="1"); else if(k==="ampeg") o.ampeg=(val!=="0"); else o[k]=+val; });
  return o;
}
function toParams(st){
  return {wave:st.wave, attack:hourToV(st.attack), decay:hourToV(st.decay), cutoff:hourToV(st.cutoff),
    peak:hourToV(st.peak), eg:hourToV(st.eg), kick:st.kick, ampeg:st.ampeg};
}
function stepsFrom(keys,slides,skip){
  var out=[];
  keys.forEach(function(k,i){
    var n=i+1; if(skip.indexOf(n)>-1 || k==="x") return;
    out.push({key:k==="-"?null:+k, slide:slides.indexOf(n)>-1});
  });
  return out;
}
var LINE1="1,1,1,13,1,1,13,1,1,1,1,13,1,1,13,1";

/* ---------- synth widget ---------- */
var widgets=[];
function stopAll(){ Audio.stop(); }
function buildWidget(el,i){
  var st=parseSet(el.dataset.set), ctrls=list(el.dataset.controls), keys=list(el.dataset.keys||LINE1),
      slides=list(el.dataset.slides==null?"6,14":el.dataset.slides).map(Number), skip=list(el.dataset.skip).map(Number);
  var useSlides=true, vals={};
  ctrls.forEach(function(k){ if(LABEL[k]) vals[k]=hourToV(st[k]); });
  var title=el.dataset.title||"שמע בדפדפן";
  var h='<div class="sy-head"><span class="sy-ic" aria-hidden="true">🔊</span><b>'+esc(title)+'</b></div>';
  h+='<div class="sy-row"><button class="sy-play" type="button" id="sy-play-'+i+'">▶ נגן</button>';
  if(ctrls.indexOf("wave")>-1) h+='<div class="sy-seg" role="group" aria-label="צורת גל"><button type="button" data-wave="saw">מסור</button><button type="button" data-wave="square">מרובע</button></div>';
  if(ctrls.indexOf("slides")>-1) h+='<button class="sy-tog on" type="button" data-tog="slides">עם גלישות</button>';
  if(ctrls.indexOf("kick")>-1 || st.kick) h+='<button class="sy-tog'+(st.kick?' on':'')+'" type="button" data-tog="kick">עם קיק</button>';
  h+='</div>';
  if(IOS) h+='<p class="sy-hint">אין צליל? הרם את העוצמה בצד המכשיר, ובדוק שהאייפון לא במצב שקט.</p>';
  var knobs=ORDER.filter(function(k){ return k in vals; });
  if(knobs.length){
    h+='<div class="sy-knobs">';
    knobs.forEach(function(k){
      h+='<label class="sy-k" for="sy-'+i+'-'+k+'"><span class="kn">'+LABEL[k]+'</span><span class="sy-dial" data-k="'+k+'"></span>'+
        '<input type="range" min="0" max="1000" id="sy-'+i+'-'+k+'" data-k="'+k+'" dir="ltr" aria-label="'+LABEL[k]+'"><span class="sy-v" data-k="'+k+'"></span></label>';
    });
    h+='</div><p class="sy-hint">גרור את הפס מתחת לכפתור. ימינה = עם כיוון השעון.'+(el.dataset.target?' יעד: '+esc(el.dataset.target)+'.':'')+'</p>';
  }
  h+='<div class="sy-row sy-foot"><button class="sy-reset" type="button">חזרה להתחלה</button><button class="sy-save" type="button">☆ שמור לפנקס</button><span class="sy-msg" aria-live="polite"></span></div>';
  el.innerHTML=h;

  var play=el.querySelector(".sy-play"), msg=el.querySelector(".sy-msg");
  function paintKnob(k){
    el.querySelector('.sy-dial[data-k="'+k+'"]').innerHTML=dialSVG(vals[k]);
    el.querySelector('.sy-v[data-k="'+k+'"]').textContent=vToText(vals[k]);
    el.querySelector('input[data-k="'+k+'"]').value=Math.round(vals[k]*1000);
  }
  function paintWave(){ [].forEach.call(el.querySelectorAll("[data-wave]"),function(b){ b.classList.toggle("on",b.dataset.wave===st.wave); b.setAttribute("aria-pressed",b.dataset.wave===st.wave); }); }
  function reset(){ var s0=parseSet(el.dataset.set); st.wave=s0.wave; st.kick=s0.kick;
    knobs.forEach(function(k){ vals[k]=hourToV(s0[k]); paintKnob(k); }); paintWave();
    var kt=el.querySelector('[data-tog="kick"]'); if(kt) kt.classList.toggle("on",!!st.kick);
    var stg=el.querySelector('[data-tog="slides"]'); if(stg){ useSlides=true; stg.classList.add("on"); } }
  knobs.forEach(paintKnob); paintWave();
  [].forEach.call(el.querySelectorAll('input[type=range]'),function(r){
    r.addEventListener("input",function(){ vals[r.dataset.k]=r.value/1000; paintKnob(r.dataset.k); });
  });
  [].forEach.call(el.querySelectorAll("[data-wave]"),function(b){ b.addEventListener("click",function(){ st.wave=b.dataset.wave; paintWave(); }); });
  [].forEach.call(el.querySelectorAll("[data-tog]"),function(b){ b.addEventListener("click",function(){
    b.classList.toggle("on"); if(b.dataset.tog==="kick") st.kick=b.classList.contains("on"); else useSlides=b.classList.contains("on"); }); });
  el.querySelector(".sy-reset").addEventListener("click",reset);

  function params(){ var p=toParams(st); Object.keys(vals).forEach(function(k){ p[k]=vals[k]; }); return p; }
  var isOn=false;
  function setOn(on){ isOn=on; play.textContent=on?"■ עצור":"▶ נגן"; play.classList.toggle("on",on); }
  play.addEventListener("click",function(){
    if(isOn){ stopAll(); return; }
    var steps=stepsFrom(keys,useSlides?slides:[],skip);
    if(!Audio.start({steps:steps,bpm:+(el.dataset.bpm||128)},params,function(){ setOn(false); })){ msg.textContent="הדפדפן הזה לא תומך בשמע."; return; }
    setOn(true);
  });
  el.querySelector(".sy-save").addEventListener("click",function(){
    var card=el.closest(".card"), t=card&&card.querySelector(".card-head h3"), n=card&&card.querySelector(".card-head .num");
    var snap={wave:st.wave}; Object.keys(vals).forEach(function(k){ snap[k]=vToText(vals[k]); snap["_"+k]=vals[k]; });
    var all=get(SOUNDS,[]);
    all.unshift({t:Date.now(), lesson:document.body.dataset.lesson||"", from:(n?n.textContent+" ":"")+(t?t.textContent:"מעבדת צליל"),
      keys:keys.join(","), slides:(useSlides?slides:[]).join(","), skip:skip.join(","), set:snap});
    set(SOUNDS,all.slice(0,60)); msg.textContent="נשמר בפנקס";
    setTimeout(function(){ msg.textContent=""; },2200);
  });
  widgets.push(el);
}

/* ---------- play buttons on step grids ---------- */
var DRUMS={"קיק":"kick","קלאפ":"clap","סגור":"closed","פתוח":"open"};
function addGridPlayers(){
  [].forEach.call(document.querySelectorAll(".seq"),function(g,i){
    var box=g.closest(".grid-box")||g, steps=null;
    if(g.dataset.keys){
      steps=stepsFrom(list(g.dataset.keys),list(g.dataset.slides).map(Number),list(g.dataset.skip).map(Number));
    } else if(g.dataset.rows){
      var rows=JSON.parse(g.dataset.rows), arr=[]; for(var s=1;s<=16;s++) arr.push({key:false,drums:[]});
      var any=false;
      rows.forEach(function(r){ var k=DRUMS[r[0]]; if(!k) return; any=true; r[1].forEach(function(n){ arr[n-1].drums.push(k); }); });
      if(!any) return; steps=arr;
    }
    if(!steps) return;
    var b=document.createElement("button"); b.type="button"; b.className="sy-gridplay"; b.id="gp-"+i;
    b.textContent=g.dataset.keys?"▶ שמע את הקו":"▶ שמע את המקצב";
    var on=false;
    function setOn(x){ on=x; b.textContent=x?"■ עצור":(g.dataset.keys?"▶ שמע את הקו":"▶ שמע את המקצב"); b.classList.toggle("on",x); }
    b.addEventListener("click",function(){
      if(on){ stopAll(); return; }
      var p=toParams(parseSet(g.dataset.keys?"":"kick:0")); if(g.dataset.keys) p.kick=true;
      if(Audio.start({steps:steps,bpm:128},function(){ return p; },function(){ setOn(false); })) setOn(true);
    });
    box.parentNode.insertBefore(b,box.nextSibling);
  });
}

/* ---------- tappable keyboard pads ---------- */
function addPads(){
  var p=toParams(parseSet("cutoff:12,peak:9,eg:12,decay:11,kick:0"));
  [].forEach.call(document.querySelectorAll(".pads"),function(box){
    [].forEach.call(box.querySelectorAll(".pad"),function(pad){
      var n=+(pad.querySelector(".pn")||{}).textContent; if(!n) return;
      pad.setAttribute("role","button"); pad.setAttribute("tabindex","0"); pad.classList.add("live");
      pad.setAttribute("aria-label","נגן קליד "+n);
      var fired=false;
      function hit(){ Audio.note(n,p); pad.classList.add("hit"); setTimeout(function(){ pad.classList.remove("hit"); },160); }
      pad.addEventListener("pointerdown",function(){ fired=false; if(Audio.running()){ fired=true; hit(); } });
      pad.addEventListener("click",function(){ if(!fired) hit(); fired=false; });
      pad.addEventListener("keydown",function(e){ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); hit(); } });
    });
  });
}

/* ---------- notes per card ---------- */
function addNotes(){
  [].forEach.call(document.querySelectorAll(".card[data-id]"),function(c){
    var id=c.dataset.id, head=c.querySelector(".card-head"); if(!head) return;
    var t=c.querySelector(".card-head h3"), n=c.querySelector(".card-head .num");
    var b=document.createElement("button"); b.type="button"; b.className="notebtn";
    var box=document.createElement("div"); box.className="note-box"; box.hidden=true;
    var tid="note-"+id.replace(/\W/g,"_");
    box.innerHTML='<label for="'+tid+'">ההערה שלך לכרטיס הזה</label><textarea id="'+tid+'" rows="3" placeholder="למשל: CUTOFF בשעה 11 נשמע לי הכי טוב"></textarea><small>נשמר אוטומטית באייפד הזה. כל ההערות מרוכזות בפנקס.</small>';
    var ta=box.querySelector("textarea");
    function paint(){ var has=!!(get(NOTES,{})[id]||{}).text; b.textContent=has?"✎ הערה •":"✎ הערה"; b.classList.toggle("has",has); }
    ta.value=(get(NOTES,{})[id]||{}).text||"";
    var tm=null;
    ta.addEventListener("input",function(){ clearTimeout(tm); tm=setTimeout(function(){
      var all=get(NOTES,{});
      if(ta.value.trim()) all[id]={text:ta.value, t:Date.now(), title:(n?n.textContent+" ":"")+(t?t.textContent:""), lesson:document.body.dataset.lesson};
      else delete all[id];
      set(NOTES,all); paint(); },400); });
    b.addEventListener("click",function(){ box.hidden=!box.hidden; if(!box.hidden) ta.focus(); });
    if(ta.value) box.hidden=false;
    head.insertBefore(b, head.querySelector(".cardplay")||head.querySelector(".donebtn"));
    c.appendChild(box); paint();
  });
}

/* ---------- glossary ---------- */
var GLOSS=[
 ["סיקוונסר","מנגנון שמנגן רשימת הוראות צעד אחר צעד, בלולאה: איזה תו או תוף בכל צעד. הוא שומר הוראות, לא צליל, ולכן אפשר לשנות כפתורים בזמן שהוא מנגן.","1",["רצף","מקצב"]],
 ["פעימות לדקה","מהירות הקצב. בקצב 128 יש 128 פעימות בדקה, כל פעימה כחצי שנייה, וכל צעד כ־117 אלפיות שנייה.","1",["קצב"]],
 ["פעימה","מה שסופרים ברגל: אחת, שתיים, שלוש, ארבע. בסיקוונסר כל פעימה היא ארבעה צעדים.","1",[]],
 ["תיבה","ארבע פעימות, 16 צעדים. זו הלולאה הבסיסית של כל השיעורים.","1",[]],
 ["צעד","משבצת זמן אחת בסיקוונסר, רבע פעימה. בכל צעד יכול להיות תו, שתיקה או מכה.","1",["צעד אחד"]],
 ["צעד פעיל","צעד שהסיקוונסר עובר בו. צעד לא פעיל מדולג, והלולאה מתקצרת.","1",["פעיל"]],
 ["דילוג","הוצאת צעד מהלולאה. הלולאה מתקצרת, ומול תופים של 16 צעדים היא מתחילה לזוז ביחס לקיק.","2",["מדולג"]],
 ["שתיקה","צעד שהזמן שלו נשאר אבל לא נשמע בו תו. הלולאה נשארת באותו אורך.","2",[]],
 ["מתנד","מעגל שיוצר תנודה שחוזרת מאות פעמים בשנייה. זה מקור הצליל. בבס יש שלושה, עם מסנן ומעטפת משותפים.","1",["מתנדים"]],
 ["צורת גל","הצורה של התנודה. היא קובעת את הגוון הגולמי לפני המסנן.","1",["צורת הגל","צורה"]],
 ["גל מסור","גל עם כל ההרמוניות, הזוגיות והאי־זוגיות. נשמע עשיר וזמזומי, ונותן למסנן הרבה חומר. הבחירה הקלאסית לאסיד.","1",[]],
 ["גל מרובע","גל עם בעיקר הרמוניות אי־זוגיות. נשמע חלול יותר מגל מסור.","1",[]],
 ["הרמוניות","תדרים גבוהים שנמצאים בתוך כל צליל מעל תדר היסוד, ונותנים לו צבע. המסנן עובד בעיקר עליהם.","2",[]],
 ["מסנן מעביר נמוכים","מסנן שנותן לתדרים נמוכים לעבור ומחליש בהדרגה את מה שמעל תדר החיתוך. בבס השיפוע הוא 12 דציבל לאוקטבה: מעבר רך, לא קיר.","1",["מסנן","מסנן אחד"]],
 ["תדר החיתוך","הנקודה שמעליה המסנן מתחיל להחליש. בבס זה הכפתור הגדול CUTOFF. ימינה הצליל נפתח, שמאלה הוא נסגר.","1",["חיתוך"]],
 ["תהודה","הגברה של פס צר סביב תדר החיתוך, הכפתור PEAK. היא מה שהופך סיבוב של החיתוך ל״צרחה״ חומצית.","1",[]],
 ["מעטפת","צורת השינוי של הצליל לאורך הזמן, מרגע הנגיעה. בבס יש לה עלייה וירידה, והיא יכולה להזיז גם את העוצמה וגם את המסנן.","1",["מעטפת אחת"]],
 ["עלייה","כמה מהר המעטפת מגיעה לשיא. הכפתור ATTACK. לאסיד: עד הסוף שמאלה, התו מתחיל מיד.","1",[]],
 ["ירידה","כמה מהר המעטפת דועכת. הכפתור DECAY/RELEASE. לאסיד בערך שעה 10: תו קצר.","1",[]],
 ["החזקה","מתג בקליד 11. דולק: הצליל נשאר כל עוד האצבע על הקליד. כבוי: הוא דועך מיד אחרי העלייה. לאסיד כבוי.","2",["ההחזקה"]],
 ["עומק מעטפת המסנן","כמה המעטפת פותחת את המסנן בכל תו, הכפתור CUTOFF EG INT. זה ה״וואו״ או ה״קוואק״ בתחילת כל תו.","1",["CUTOFF EG INT"]],
 ["תנועה מחזורית","״יד אוטומטית״ שמזיזה משהו הלוך וחזור בלי קשר לתווים. באנגלית LFO. RATE קובע מהירות, INT קובע עומק.","1",["LFO"]],
 ["טרמולו","רעד בעוצמה, כשהתנועה המחזורית מזיזה את העוצמה.","2",[]],
 ["ויברטו","רעד בגובה, כשהתנועה המחזורית מזיזה את הגובה.","2",[]],
 ["קיבוץ","קובע אילו מתנדים חולקים את אותו רצף תווים. נבחר עם FUNC וקלידים 1 עד 3.","2",[]],
 ["אוניסון","שני מתנדים או יותר שמנגנים אותו תו יחד. עם סטייה זעירה ביניהם הצליל נשמע עבה ורחב.","2",[]],
 ["פעימות","כששני גלים קרובים מאוד בגובה, הם מתחזקים ונחלשים לסירוגין, כמו ״ווא־ווא״ איטי. ככל שההפרש גדל, זה מאיץ.","2",[]],
 ["גלישה","מעבר רציף בגובה מתו לתו במקום קפיצה. מסמנים את הצעד שממנו יוצאים. אין כפתור לאורך שלה: היא נמשכת צעד אחד.","1",[]],
 ["אקסנט","דגש אוטומטי על צעדים נבחרים בעוצמה ובמסנן. קיים בסינתיסייזר שהמציא את האסיד, אבל לא בבס שלך.","2",[]],
 ["סנכרון","מכשיר אחד שולח פעימות תזמון, והשני מתקדם לפיהן. הכבל מעביר תזמון בלבד, לא צליל ולא פקודת התחלה.","1",[]],
 ["הקלטת צעדים","כתיבת רצף תו אחר תו, בלי קצב ובלי לחץ זמן. הקליד קובע את הגובה, והצעד מתקדם לבד.","1",[]],
 ["סוויפ","סיבוב רציף ואיטי של כפתור לאורך זמן, בדרך כלל CUTOFF, בזמן שהקו מנגן.","1",[]],
 ["הקשבה משווה","משנים דבר אחד בלבד ומשווים לפני ואחרי. כך האוזן לומדת מה כל כפתור עושה.","1",[]],
 ["אנלוגי","צליל שנוצר במעגל חשמלי בזמן אמת. הקיק והתופים הנמוכים במכונת התופים הם אנלוגיים.","1",[]],
 ["דגימה דיגיטלית","הקלטה קצרה של צליל אמיתי שנשמרה במכשיר ומנוגנת ממנו. הקלאפ הוא דגימה.","1",[]],
 ["היי־האט","צליל מתכתי ורועש. סגור הוא קצר ויבש, פתוח הוא ארוך. סגור שבא אחרי פתוח קוטע אותו.","1",[]],
 ["חצי טון","המרחק בין קליד לקליד שלידו, בלי קשר לצבע. המדרגה הקטנה ביותר.","3",["חצאי טון"]],
 ["טון","שני חצאי טון: מדלגים על קליד אחד.","3",[]],
 ["אוקטבה","12 חצאי טון, הכפלה של התדר. אותו תו, גבוה יותר. בבס: קליד 1 וקליד 13.","1",["האוקטבה"]],
 ["מרווח","המרחק בין שני תווים, נמדד בחצאי טון.","2",[]],
 ["שורש","התו שהקו בנוי סביבו וחוזר אליו. בשיעורים זה לה, קליד 1.","3",["השורש"]],
 ["טרצה קטנה","3 חצאי טון מעל השורש. נותנת את הצבע האפל והמינורי. מעל לה: דו, קליד 4.","2",["הטרצה הקטנה"]],
 ["קווינטה","7 חצאי טון מעל השורש. צליל פתוח וחזק. מעל לה: מי, קליד 8.","2",["הקווינטה"]],
 ["ספטימה","הדרגה השביעית בסולם. בלה מינור: סול, קליד 11.","3",[]],
 ["אקורד","כמה תווים שנשמעים יחד. שורש, טרצה קטנה וקווינטה הם אקורד מינורי.","2",["אקורד לה מינור"]],
 ["סולם","בחירה של תווים שנשמעים טוב יחד. המכשיר לא נועל סולם, זו בחירה שלך.","3",[]],
 ["פריגי","סולם מינורי עם חצי טון צמוד מעל השורש. מעל לה: סי במול, קליד 2. נשמע מתוח ומאיים.","3",["לה פריגי"]],
 ["פנטטוני","סולם של חמישה תווים בלי התווים ה״צמודים״, ולכן כמעט כל צירוף נשמע טוב. הכי סלחני לאלתור.","3",["פנטטוני מינורי"]],
 ["סינקופה","התחושה שהקצב ״מועד״ קדימה, כי תווים נוחתים במקומות שהאוזן לא ציפתה, למשל אחרי שתיקה.","3",[]],
 ["פולימטר","שתי לולאות באורכים שונים שמנגנות יחד. הן נפגשות שוב רק אחרי כמה סיבובים.","2",[]],
 ["דיאז","תו גבוה בחצי טון מהתו הטבעי. בבס אלה הקלידים הזהובים.","3",["דו#","רה#","פה#","סול#","לה#"]],
 ["במול","תו נמוך בחצי טון. אותו קליד כמו הדיאז שמתחתיו: סי במול הוא לה#.","3",["סי במול"]]
];
var GMAP={};
GLOSS.forEach(function(g,i){ GMAP[g[0]]=i; g[3].forEach(function(a){ if(!(a in GMAP)) GMAP[a]=i; }); });

var pop=null;
function showTerm(i){
  var g=GLOSS[i]; if(!pop){
    pop=document.createElement("div"); pop.className="gl-pop"; pop.setAttribute("role","dialog");
    pop.innerHTML='<div class="gl-in"><div class="gl-h"><b id="gl-t"></b><button type="button" class="gl-x" id="gl-x" aria-label="סגירה">✕</button></div><p id="gl-d"></p><a id="gl-all" href="glossary.html">לכל המושגים ←</a></div>';
    document.body.appendChild(pop);
    pop.addEventListener("click",function(e){ if(e.target===pop) pop.hidden=true; });
    document.getElementById("gl-x").addEventListener("click",function(){ pop.hidden=true; });
    document.addEventListener("keydown",function(e){ if(e.key==="Escape" && pop) pop.hidden=true; });
  }
  document.getElementById("gl-t").textContent=g[0];
  document.getElementById("gl-d").textContent=g[1];
  document.getElementById("gl-all").href="glossary.html#t"+i;
  pop.hidden=false;
}
function linkTerms(){
  [].forEach.call(document.querySelectorAll(".learn b, .gloss dt"),function(b){
    if(b.closest(".acid") && b.textContent==="לאסיד:") return;
    var k=b.textContent.trim(); if(!(k in GMAP)) return;
    var btn=document.createElement("button"); btn.type="button"; btn.className="term"; btn.textContent=b.textContent;
    btn.setAttribute("aria-label","הסבר: "+k);
    btn.addEventListener("click",function(){ showTerm(GMAP[k]); });
    b.textContent=""; b.appendChild(btn);
  });
}

/* ---------- glossary page ---------- */
function renderGlossary(root){
  var order=GLOSS.map(function(g,i){return i;}).sort(function(a,b){ return GLOSS[a][0].localeCompare(GLOSS[b][0],"he"); });
  var h='<label class="gl-search" for="gl-q">חיפוש</label><input id="gl-q" type="search" placeholder="למשל: מעטפת" autocomplete="off"><dl class="gl-list">';
  order.forEach(function(i){ var g=GLOSS[i];
    h+='<div class="gl-item" id="t'+i+'" data-s="'+esc((g[0]+" "+g[3].join(" ")+" "+g[1]).toLowerCase())+'"><dt>'+esc(g[0])+'</dt><dd>'+esc(g[1])+' <a href="lesson-'+g[2]+'.html">שיעור '+g[2]+'</a></dd></div>'; });
  h+='</dl>'; root.innerHTML=h;
  var q=document.getElementById("gl-q");
  q.addEventListener("input",function(){ var v=q.value.trim().toLowerCase();
    [].forEach.call(root.querySelectorAll(".gl-item"),function(it){ it.hidden=v&&it.dataset.s.indexOf(v)<0; }); });
}

/* ---------- notebook page ---------- */
var TITLES={"1":"שיעור 1","2":"שיעור 2","3":"שיעור 3"};
function renderNotebook(root){
  var sounds=get(SOUNDS,[]), notes=get(NOTES,{});
  var ids=Object.keys(notes).sort(function(a,b){ var x=a.split(":"),y=b.split(":"); return x[0]===y[0]?parseFloat(x[1])-parseFloat(y[1]):(x[0]<y[0]?-1:1); });
  var h='<section class="stage"><h2>צלילים ששמרת</h2>';
  if(!sounds.length) h+='<p class="info">עדיין אין. בכל נגן שמע בשיעורים יש כפתור ״☆ שמור לפנקס״. הצליל נשמר עם מיקומי הכפתורים, ותוכל לנגן אותו כאן ולהעתיק את המיקומים למכשיר.</p>';
  sounds.forEach(function(s,i){
    var knobs=ORDER.filter(function(k){ return s.set[k]; });
    var setStr="wave:"+s.set.wave+","+knobs.map(function(k){ var v=s.set["_"+k], hr=Math.round((v*300-150)/30); hr=hr===0?12:(hr<0?12+hr:hr); return k+":"+hr; }).join(",");
    h+='<article class="card"><div class="card-head"><h3>'+esc(s.from)+'</h3><small class="nb-date">'+new Date(s.t).toLocaleString("he-IL",{day:"numeric",month:"numeric",hour:"2-digit",minute:"2-digit"})+'</small>'+
      '<button type="button" class="nb-del" data-i="'+i+'">מחיקה</button></div>'+
      '<div class="tbl-box"><table><tbody>'+(s.set.wave==="square"?'<tr><td>צורת גל</td><td>מרובע</td></tr>':'')+knobs.map(function(k){ return '<tr><td><kbd>'+LABEL[k]+'</kbd></td><td>'+esc(s.set[k])+'</td></tr>'; }).join("")+'</tbody></table></div>'+
      '<div class="synth" data-set="'+esc(setStr)+',kick:1" data-controls="'+knobs.join(",")+(knobs.length?",":"")+'wave" data-keys="'+esc(s.keys)+'" data-slides="'+esc(s.slides)+'" data-skip="'+esc(s.skip||"")+'" data-title="נגן את הצליל"></div></article>';
  });
  h+='</section><section class="stage"><h2>ההערות שלך</h2>';
  if(!ids.length) h+='<p class="info">עדיין אין. בכל כרטיס בשיעורים יש כפתור ״✎ הערה״.</p>';
  ids.forEach(function(id){ var n=notes[id], parts=id.split(":");
    h+='<article class="card"><div class="card-head"><span class="num">'+esc(TITLES[n.lesson]||"")+'</span><h3><a href="lesson-'+esc(n.lesson)+'.html#'+esc(parts[0]+"-"+parts[1].replace(/\./g,"-"))+'">'+esc(n.title||id)+'</a></h3></div><p class="nb-text">'+esc(n.text).replace(/\n/g,"<br>")+'</p></article>'; });
  h+='</section><section class="stage"><h2>גיבוי</h2><article class="card"><p>הפנקס נשמר רק באייפד הזה. כדי לשמור עותק, העתק את הכול והדבק בפתקים או בהודעה לעצמך.</p>'+
    '<div class="sy-row"><button type="button" class="btn" id="nb-copy">העתק את כל הפנקס</button><span class="sy-msg" id="nb-msg" aria-live="polite"></span></div><textarea id="nb-text" class="nb-out" rows="6" readonly hidden></textarea></article></section>';
  root.innerHTML=h;
  [].forEach.call(root.querySelectorAll(".nb-del"),function(b){ b.addEventListener("click",function(){
    if(b.dataset.armed){ var all=get(SOUNDS,[]); all.splice(+b.dataset.i,1); set(SOUNDS,all); renderNotebook(root); initWidgets(root); }
    else { b.dataset.armed="1"; b.textContent="למחוק? גע שוב"; setTimeout(function(){ if(b.isConnected){ delete b.dataset.armed; b.textContent="מחיקה"; } },3000); } }); });
  document.getElementById("nb-copy").addEventListener("click",function(){
    var lines=["הפנקס שלי · שיעורי מוזיקה",""];
    sounds.forEach(function(s){ lines.push("צליל: "+s.from); ORDER.forEach(function(k){ if(s.set[k]) lines.push("  "+LABEL[k]+": "+s.set[k]); }); if(s.set.wave==="square") lines.push("  צורת גל: מרובע"); lines.push(""); });
    ids.forEach(function(id){ var n=notes[id]; lines.push((TITLES[n.lesson]||"")+" · "+(n.title||id)); lines.push("  "+n.text.replace(/\n/g,"\n  ")); lines.push(""); });
    var txt=lines.join("\n"), out=document.getElementById("nb-text"), m=document.getElementById("nb-msg");
    function fallback(){ out.hidden=false; out.value=txt; out.focus(); out.select(); m.textContent="סמן והעתק מהתיבה"; }
    if(navigator.clipboard&&navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(function(){ m.textContent="הועתק"; },fallback); else fallback();
  });
}

/* ---------- init ---------- */
function initWidgets(root){ [].forEach.call((root||document).querySelectorAll(".synth"),function(el){ if(!el.dataset.ready){ el.dataset.ready="1"; buildWidget(el,widgets.length); } }); }
var nb=document.getElementById("notebook"); if(nb) renderNotebook(nb);
var gl=document.getElementById("glossary"); if(gl){ renderGlossary(gl); if(location.hash){ var t=document.getElementById(location.hash.slice(1)); if(t){ t.classList.add("hl"); t.scrollIntoView(); } } }
if(Audio.available()){ initWidgets(); addGridPlayers(); addPads(); }
else [].forEach.call(document.querySelectorAll(".synth"),function(el){ el.innerHTML='<p class="info">הדפדפן הזה לא תומך בשמע.</p>'; });
addNotes(); linkTerms();
if(Audio.available()){
  var first=function(){ Audio.unlock(); document.removeEventListener("touchend",first,true); document.removeEventListener("click",first,true); };
  document.addEventListener("touchend",first,true); document.addEventListener("click",first,true);
}
document.addEventListener("visibilitychange",function(){ if(document.hidden) stopAll(); });
})();
