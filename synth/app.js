/* מכונת אווירות · ממשק */
(function(){
"use strict";
var E=window.Engine, P=E.P;
var $=function(id){ return document.getElementById(id); };
function get(k,d){ try{ var v=localStorage.getItem(k); return v==null?d:JSON.parse(v); }catch(e){ return d; } }
function put(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} }

/* ---------- controls ---------- */
var KNOBS={
  sound:[
    ["bright","בהירות","תדר החיתוך של המסנן, כמו CUTOFF בבס. ימינה יותר הרמוניות עוברות."],
    ["reso","תהודה","מדגישה פס צר סביב החיתוך, כמו PEAK. גבוה: צפצוף חומצי."],
    ["env","מכה","כמה המסנן נפתח בתחילת כל תו, כמו CUTOFF EG INT. זה ה״קוואק״ של אסיד."],
    ["attack","כניסה","זמן העלייה. נמוך: התו מתחיל מיד. גבוה: הצליל נכנס לאט, כמו שטיח."],
    ["release","דעיכה","כמה זמן הצליל ממשיך אחרי שהאצבע עוזבת. משפיע גם על אורך ה״מכה״."],
    ["width","רוחב","הפרש קטן בגובה בין המתנדים, ועוד כורוס. יוצר פעימות ורוחב בין שתי האוזניים."],
    ["breath","נשימה","תנועה מחזורית איטית על המסנן. הצליל נפתח ונסגר לבד."],
    ["glide","גלישה","כמה לאט הגובה עובר מתו לתו במצב ״קול אחד״. כמו הגלישות בבס, רק עם שליטה על האורך."]
  ],
  dirt:[
    ["drive","לכלוך","דיסטורשן: מגביר את הצליל עד שהגל ״נחתך״. מוסיף הרמוניות, צריבה ומיץ."],
    ["mud","בוץ","מגביר את הנמוכים והנמוכים־אמצעיים. עבה, חם וכבד."],
    ["color","צבע","מסנן שני אחרי הלכלוך. שמאלה עמום וכהה, ימינה חד וחשוף."],
    ["metal","מתכת","מהוד שמכוון לכל תו שאתה מנגן. מוסיף צלצול מתכתי, כמו פח או מיתר."]
  ],
  time:[
    ["space","הד","הדמיה של חדר גדול. כל צליל מקבל זנב ארוך של השתקפויות."],
    ["echo","השהיה","הצליל חוזר בקצב של שמינית מנוקדת, ימין ושמאל לסירוגין."]
  ]
};
var ALLKNOBS=[].concat(KNOBS.sound,KNOBS.dirt,KNOBS.time);
var DEF={bright:.45,reso:.15,env:.2,attack:.55,release:.6,width:.55,breath:.25,glide:.3,space:.6,echo:.15,drive:0,mud:0,color:.7,metal:0,shape:0,mono:0,chord:"min",arp:"off",rate:1,gate:"off"};
var PRESETS=[
  {name:"ענן",          bright:.45,reso:.15,env:.1, attack:.55,release:.62,width:.55,breath:.25,space:.6, echo:.15,shape:0,chord:"min"},
  {name:"טראנס על",     bright:.6, reso:.3, env:.35,attack:.04,release:.42,width:.85,breath:.1, space:.55,echo:.45,drive:.22,mud:.2, color:.75,shape:3,chord:"min",gate:"trance"},
  {name:"אסיד בוץ",     bright:.24,reso:.8, env:.72,attack:0,  release:.25,width:.15,breath:.05,glide:.35,space:.28,echo:.32,drive:.68,mud:.55,color:.5,shape:1,mono:1,chord:"one",arp:"updown"},
  {name:"מתכת עמוקה",   bright:.5, reso:.35,env:.25,attack:.25,release:.7, width:.5, breath:.3, space:.75,echo:.3, drive:.3, mud:.45,color:.55,metal:.55,shape:4,chord:"one"},
  {name:"מנוע",         bright:.38,reso:.55,env:.55,attack:.01,release:.3, width:.6, breath:.08,space:.4, echo:.38,drive:.5, mud:.45,color:.6,shape:3,chord:"m7",arp:"up"},
  {name:"ערפל מלוכלך",  bright:.36,reso:.22,env:.1, attack:.62,release:.75,width:.72,breath:.35,space:.82,echo:.2, drive:.45,mud:.6, color:.38,metal:.1,shape:0,chord:"m7"},
  {name:"שקיעה",        bright:.26,reso:.42,env:.1, attack:.7, release:.75,width:.72,breath:.45,space:.7, echo:.2, shape:1,chord:"m7"},
  {name:"זכוכית",       bright:.74,reso:.35,env:.2, attack:.08,release:.55,width:.3, breath:.1, space:.55,echo:.42,shape:1,chord:"oct"},
  {name:"מים",          bright:.55,reso:.25,env:.3, attack:.02,release:.38,width:.2, breath:.05,space:.45,echo:.66,shape:2,chord:"one"},
  {name:"חלל",          bright:.36,reso:.1, env:0,  attack:.85,release:.9, width:.9, breath:.3, space:.95,echo:.35,shape:0,chord:"sus"}
].map(function(p){ var o={}; Object.keys(DEF).forEach(function(k){ o[k]=DEF[k]; }); o.drive=0;o.mud=0;o.metal=0;o.glide=.3;o.color=.7; Object.keys(p).forEach(function(k){ o[k]=p[k]; }); return o; });
var CHORDS={one:[0],min:[0,3,7],maj:[0,4,7],sus:[0,2,7],m7:[0,3,7,10],oct:[0,12]};
var CHORDNAME={one:"",min:"מינור",maj:"מז׳ור",sus:"תלוי",m7:"מינור 7",oct:"אוקטבות"};
var NOTE=["דו","דו#","רה","רה#","מי","פה","פה#","סול","סול#","לה","לה#","סי"];
var state={chord:"min",oct:3,hold:false,current:"ענן",arp:"off",rate:1,gate:"off"};

var knobEls={};
function knobSVG(v){
  function p(d,r){ var a=d*Math.PI/180; return [(50+r*Math.sin(a)).toFixed(1),(50-r*Math.cos(a)).toFixed(1)]; }
  var a=-150+v*300, large=(v*300)>180?1:0, s=p(-150,40), e=p(a,40), z=p(150,40), i1=p(a,8), i2=p(a,22);
  var arc=v>0.003?'<path d="M'+s.join(" ")+' A40 40 0 '+large+' 1 '+e.join(" ")+'" fill="none" stroke="var(--glow)" stroke-width="7" stroke-linecap="round"/>':"";
  return '<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M'+s.join(" ")+' A40 40 0 1 1 '+z.join(" ")+'" fill="none" stroke="var(--track)" stroke-width="7" stroke-linecap="round"/>'+arc+
    '<circle cx="50" cy="50" r="27" fill="var(--knob)"/><line x1="'+i1[0]+'" y1="'+i1[1]+'" x2="'+i2[0]+'" y2="'+i2[1]+'" stroke="var(--ink)" stroke-width="5" stroke-linecap="round"/></svg>';
}
function buildKnobs(){
  Object.keys(KNOBS).forEach(function(group){
    var box=$("knobs-"+group);
    KNOBS[group].forEach(function(k){
      var w=document.createElement("div"); w.className="kn";
      w.innerHTML='<div class="kn-dial" role="slider" tabindex="0" aria-label="'+k[1]+'" aria-valuemin="0" aria-valuemax="100" id="k-'+k[0]+'"></div><span class="kn-lbl">'+k[1]+'</span><p class="explain">'+k[2]+'</p>';
      box.appendChild(w);
      var d=w.querySelector(".kn-dial"); knobEls[k[0]]=d;
      var startY=0, startV=0, id=null, lastTap=0;
      d.addEventListener("pointerdown",function(e){ e.preventDefault(); id=e.pointerId; d.setPointerCapture(id); startY=e.clientY; startV=P[k[0]]; d.classList.add("drag");
        var now=Date.now(); if(now-lastTap<300){ var pr=PRESETS.concat(mine()).filter(function(x){return x.name===state.current;})[0]; setParam(k[0],pr&&pr[k[0]]!=null?pr[k[0]]:DEF[k[0]]); startV=P[k[0]]; } lastTap=now; });
      d.addEventListener("pointermove",function(e){ if(e.pointerId!==id) return; setParam(k[0],Math.max(0,Math.min(1,startV+(startY-e.clientY)/170))); });
      function up(e){ if(e.pointerId!==id) return; id=null; d.classList.remove("drag"); }
      d.addEventListener("pointerup",up); d.addEventListener("pointercancel",up);
      d.addEventListener("keydown",function(e){ var s={ArrowUp:.03,ArrowRight:.03,ArrowDown:-.03,ArrowLeft:-.03}[e.key]; if(s){ e.preventDefault(); setParam(k[0],Math.max(0,Math.min(1,P[k[0]]+s))); } });
    });
  });
}
function paintKnob(key){ var d=knobEls[key]; if(!d) return; d.innerHTML=knobSVG(P[key]); d.setAttribute("aria-valuenow",Math.round(P[key]*100)); }
function setParam(key,v){ E.set(key,v); paintKnob(key); if(key==="bright"||key==="space") drawXY(); markCustom(); }

function seg(id,val,on){
  [].forEach.call($(id).querySelectorAll("button"),function(b){ var sel=b.dataset.v===String(val); b.classList.toggle("on",sel); b.setAttribute("aria-pressed",sel);
    if(on && !b._w){ b._w=1; b.addEventListener("click",function(){ on(b.dataset.v); }); } });
}
function setShape(v){ E.set("shape",+v); seg("shape",v,setShape); markCustom(); }
function setMono(v){ v=+v; if(!!v!==!!P.mono) releaseAll(); E.set("mono",!!v); seg("mono",v,setMono); markCustom(); }
function setChord(v){ state.chord=v; seg("chord",v,setChord); markCustom(); }
function setArp(v){ state.arp=v; seg("arp",v,setArp); if(v==="off"){ arpStop(); } refreshClock(); markCustom(); }
function setRate(v){ state.rate=+v; seg("arpRate",v,setRate); markCustom(); }
function setGate(v){ state.gate=v; seg("gate",v,setGate); refreshClock(); markCustom(); }

/* ---------- tabs ---------- */
[].forEach.call(document.querySelectorAll(".tabs button"),function(b){
  b.addEventListener("click",function(){
    [].forEach.call(document.querySelectorAll(".tabs button"),function(x){ x.setAttribute("aria-selected",x===b); });
    [].forEach.call(document.querySelectorAll(".pane"),function(p){ p.hidden=p.dataset.pane!==b.dataset.tab; });
    put("ambi:tab",b.dataset.tab);
  });
});

/* ---------- presets ---------- */
function mine(){ return get("ambi:mine",[]); }
function loadPreset(pr){
  ALLKNOBS.forEach(function(k){ var v=pr[k[0]]!=null?pr[k[0]]:DEF[k[0]]; E.set(k[0],v); paintKnob(k[0]); });
  setShape(pr.shape!=null?pr.shape:0); setMono(pr.mono?1:0); setChord(pr.chord||"min");
  setArp(pr.arp||"off"); setRate(pr.rate||1); setGate(pr.gate||"off");
  state.current=pr.name; drawXY(); paintPresets(); put("ambi:last",pr);
}
var customTimer=null;
function markCustom(){ clearTimeout(customTimer); customTimer=setTimeout(function(){ put("ambi:last",snapshot(state.current)); },300); }
function snapshot(name){ var s={name:name}; ALLKNOBS.forEach(function(k){ s[k[0]]=+P[k[0]].toFixed(3); }); s.shape=P.shape; s.mono=P.mono?1:0; s.chord=state.chord; s.arp=state.arp; s.rate=state.rate; s.gate=state.gate; return s; }
function paintPresets(){
  var box=$("presets"); box.innerHTML="";
  PRESETS.concat(mine()).forEach(function(pr,i){
    var b=document.createElement("button"); b.type="button"; b.className="chip"+(pr.name===state.current?" on":"")+(i>=PRESETS.length?" mine":"");
    b.textContent=pr.name; b.addEventListener("click",function(){ if(!b.dataset.armed) loadPreset(pr); });
    if(i>=PRESETS.length){
      var x=document.createElement("span"); x.className="x"; x.textContent="✕"; x.setAttribute("role","button"); x.setAttribute("aria-label","מחיקת "+pr.name);
      x.addEventListener("click",function(e){ e.stopPropagation();
        if(b.dataset.armed){ put("ambi:mine",mine().filter(function(q){ return q.name!==pr.name; })); paintPresets(); toast("נמחק"); }
        else { b.dataset.armed="1"; x.textContent="למחוק?"; setTimeout(function(){ if(b.isConnected){ delete b.dataset.armed; x.textContent="✕"; } },2500); } });
      b.appendChild(x);
    }
    box.appendChild(b);
  });
}
$("save").addEventListener("click",function(){
  var m=mine(), n=1, names=m.map(function(q){return q.name;});
  while(names.indexOf("הצליל שלי "+n)>-1) n++;
  var s=snapshot("הצליל שלי "+n); m.push(s); put("ambi:mine",m); state.current=s.name; paintPresets(); toast("נשמר בשם ״"+s.name+"״");
});

/* ---------- help ---------- */
$("help").addEventListener("click",function(){ var on=document.body.classList.toggle("helping"); this.setAttribute("aria-pressed",on); this.classList.toggle("on",on); });

/* ---------- XY pad ---------- */
var cv=$("xy"), cx=cv.getContext("2d"), trail=[], xyId=null;
function sizeXY(){ var r=cv.getBoundingClientRect(), d=window.devicePixelRatio||1; cv.width=Math.round(r.width*d); cv.height=Math.round(r.height*d); drawXY(); }
function drawXY(){
  var w=cv.width, h=cv.height; if(!w) return; var d=window.devicePixelRatio||1;
  cx.clearRect(0,0,w,h);
  cx.strokeStyle="rgba(255,255,255,.06)"; cx.lineWidth=d;
  for(var i=1;i<4;i++){ cx.beginPath(); cx.moveTo(w*i/4,0); cx.lineTo(w*i/4,h); cx.stroke(); cx.beginPath(); cx.moveTo(0,h*i/4); cx.lineTo(w,h*i/4); cx.stroke(); }
  var now=performance.now();
  trail=trail.filter(function(p){ return now-p.t<900; });
  trail.forEach(function(p){ var a=1-(now-p.t)/900; cx.fillStyle="rgba(255,179,138,"+(a*0.18).toFixed(3)+")"; cx.beginPath(); cx.arc(p.x*w,(1-p.y)*h,(14+30*(1-a))*d,0,7); cx.fill(); });
  var x=P.bright*w, y=(1-P.space)*h, g=cx.createRadialGradient(x,y,0,x,y,70*d);
  g.addColorStop(0,"rgba(255,190,150,.85)"); g.addColorStop(.25,"rgba(255,150,120,.35)"); g.addColorStop(1,"rgba(127,214,201,0)");
  cx.fillStyle=g; cx.beginPath(); cx.arc(x,y,70*d,0,7); cx.fill();
  cx.fillStyle="#fff1e6"; cx.beginPath(); cx.arc(x,y,(xyId!==null?11:8)*d,0,7); cx.fill();
  if(trail.length) requestAnimationFrame(drawXY);
}
function xyMove(e){
  var r=cv.getBoundingClientRect(), x=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)), y=Math.max(0,Math.min(1,1-(e.clientY-r.top)/r.height));
  E.set("bright",x); E.set("space",y); paintKnob("bright"); paintKnob("space"); trail.push({x:x,y:y,t:performance.now()}); drawXY(); markCustom();
}
cv.addEventListener("pointerdown",function(e){ e.preventDefault(); xyId=e.pointerId; cv.setPointerCapture(xyId); xyMove(e); });
cv.addEventListener("pointermove",function(e){ if(e.pointerId===xyId) xyMove(e); });
function xyUp(e){ if(e.pointerId===xyId){ xyId=null; drawXY(); } }
cv.addEventListener("pointerup",xyUp); cv.addEventListener("pointercancel",xyUp);
window.addEventListener("resize",function(){ sizeXY(); buildKeys(); });

/* ---------- keyboard ---------- */
var keyEls={}, touches={}, held=[], heldNotes=[];
function whiteCount(){ var w=$("kbd").clientWidth||window.innerWidth; return w<520?8:(w<900?11:15); }
function buildKeys(){
  var box=$("kbd"); box.innerHTML=""; keyEls={};
  var n=whiteCount(), base=12*(state.oct+1), whites=[0,2,4,5,7,9,11], list=[];
  for(var i=0;i<n;i++){ list.push(base+Math.floor(i/7)*12+whites[i%7]); }
  var wW=100/n;
  list.forEach(function(m,i){
    var k=document.createElement("div"); k.className="key white"; k.dataset.m=m; k.style.left=(i*wW)+"%"; k.style.width=wW+"%";
    k.innerHTML='<span>'+NOTE[m%12]+(m%12===0?'<b>'+(Math.floor(m/12)-1)+'</b>':'')+'</span>'; box.appendChild(k); keyEls[m]=k;
    if(i<n-1 && [0,2,5,7,9].indexOf(m%12)>-1){
      var b=document.createElement("div"); b.className="key black"; b.dataset.m=m+1; b.style.left=((i+1)*wW-wW*0.3)+"%"; b.style.width=(wW*0.6)+"%";
      box.appendChild(b); keyEls[m+1]=b;
    }
  });
  $("oct").textContent="אוקטבה "+state.oct;
  paintKeys();
}
function paintKeys(){ var on=E.sounding(); Object.keys(keyEls).forEach(function(m){ keyEls[m].classList.toggle("on",!!on[m]); }); }
setInterval(function(){ if(state.arp!=="off") paintKeys(); },60);
function chordLabel(root){ $("chordname").textContent=root==null?"":NOTE[root%12]+(CHORDNAME[state.chord]?" "+CHORDNAME[state.chord]:""); }
function chordNotes(m){ return CHORDS[state.chord].map(function(iv){ return m+iv; }); }

// arpeggiator: plays the notes currently held (by fingers, or by "hold")
function arpPool(){
  var s={}; Object.keys(touches).forEach(function(k){ touches[k].notes.forEach(function(n){ s[n]=1; }); });
  if(state.hold) heldNotes.forEach(function(n){ s[n]=1; });
  return Object.keys(s).map(Number).sort(function(a,b){ return a-b; });
}
var arpIdx=0, arpDir=1;
function arpTick(step,t,sd){
  if(state.arp==="off" || step%state.rate!==0) return;
  var pool=arpPool(); if(!pool.length){ arpIdx=0; if(arpMonoId){ E.noteOffAt(arpMonoId,t); arpMonoId=null; } return; }
  var n;
  if(state.arp==="up") n=pool[arpIdx++%pool.length];
  else if(state.arp==="down") n=pool[pool.length-1-(arpIdx++%pool.length)];
  else if(state.arp==="rand") n=pool[Math.floor(Math.random()*pool.length)];
  else { if(pool.length===1){ n=pool[0]; } else { var span=pool.length*2-2, i=arpIdx++%span; n=pool[i<pool.length?i:span-i]; } }
  var id=E.noteOnAt(n,t);
  if(P.mono){ if(arpMonoId) E.noteOffAt(arpMonoId,t); arpMonoId=id; }   // one voice: notes glide into each other, acid style
  else E.noteOffAt(id,t+sd*state.rate*0.82);
}
var arpMonoId=null;
function arpStop(){ arpIdx=0; if(arpMonoId){ E.noteOff(arpMonoId); arpMonoId=null; } }
function refreshClock(){ var need=state.arp!=="off"||state.gate!=="off"; E.setClock(need&&E.running(),arpTick,state.gate); }

function press(pid,m){
  if(state.hold && Object.keys(touches).length===0 && (held.length||heldNotes.length)){ held.forEach(E.noteOff); held=[]; heldNotes=[]; }
  var notes=chordNotes(m), ids=[];
  if(state.arp==="off") ids=notes.map(function(n){ return E.noteOn(n); }).filter(function(x){ return x!=null; });
  else { E.start(); refreshClock(); }
  touches[pid]={m:m,ids:ids,notes:notes}; chordLabel(m); paintKeys();
}
function release(pid){
  var t=touches[pid]; if(!t) return; delete touches[pid];
  if(state.hold){ held=held.concat(t.ids); heldNotes=heldNotes.concat(t.notes); } else t.ids.forEach(E.noteOff);
  setTimeout(paintKeys,20); if(!state.hold && !Object.keys(touches).length) chordLabel(null);
}
function releaseAll(){ arpStop(); Object.keys(touches).forEach(function(k){ touches[k].ids.forEach(E.noteOff); }); touches={}; held.forEach(E.noteOff); held=[]; heldNotes=[]; E.allOff(); setTimeout(paintKeys,20); chordLabel(null); }
function keyAt(x,y){ var el=document.elementFromPoint(x,y); return el&&el.closest?el.closest(".key"):null; }
var kbd=$("kbd");
kbd.addEventListener("pointerdown",function(e){ e.preventDefault(); var k=keyAt(e.clientX,e.clientY); if(!k) return; kbd.setPointerCapture(e.pointerId); press(e.pointerId,+k.dataset.m); });
kbd.addEventListener("pointermove",function(e){ var t=touches[e.pointerId]; if(!t) return; var k=keyAt(e.clientX,e.clientY);
  if(k && +k.dataset.m!==t.m){ var hold=state.hold; state.hold=false; release(e.pointerId); state.hold=hold; press(e.pointerId,+k.dataset.m); } });
kbd.addEventListener("pointerup",function(e){ release(e.pointerId); });
kbd.addEventListener("pointercancel",function(e){ release(e.pointerId); });
kbd.addEventListener("contextmenu",function(e){ e.preventDefault(); });

var KEYMAP="awsedftgyhujk", down={};
document.addEventListener("keydown",function(e){ if(e.repeat||e.metaKey||e.ctrlKey) return; var i=KEYMAP.indexOf(e.key.toLowerCase()); if(i<0||down[e.key]) return; down[e.key]=1; press("k"+e.key,12*(state.oct+1)+i); });
document.addEventListener("keyup",function(e){ if(down[e.key]){ delete down[e.key]; release("k"+e.key); } });

$("octDown").addEventListener("click",function(){ if(state.oct>1){ state.oct--; buildKeys(); } });
$("octUp").addEventListener("click",function(){ if(state.oct<5){ state.oct++; buildKeys(); } });
$("hold").addEventListener("click",function(){
  state.hold=!state.hold; this.classList.toggle("on",state.hold); this.setAttribute("aria-pressed",state.hold);
  if(!state.hold){ held.forEach(E.noteOff); held=[]; heldNotes=[]; setTimeout(paintKeys,20); chordLabel(null); }
});
$("panic").addEventListener("click",releaseAll);

/* ---------- tempo ---------- */
function setBpm(v){ v=Math.max(60,Math.min(190,Math.round(v))); E.set("bpm",v); $("bpm").textContent=v; put("ambi:bpm",v); }
$("bpmDown").addEventListener("click",function(){ setBpm(P.bpm-1); });
$("bpmUp").addEventListener("click",function(){ setBpm(P.bpm+1); });
var taps=[];
$("tap").addEventListener("click",function(){
  var t=performance.now(); taps=taps.filter(function(x){ return t-x<2500; }); taps.push(t);
  if(taps.length>=3){ var d=(taps[taps.length-1]-taps[0])/(taps.length-1); setBpm(60000/d); }
  this.classList.add("on"); var b=this; setTimeout(function(){ b.classList.remove("on"); },90);
});

/* ---------- start ---------- */
function toast(t){ var el=$("toast"); el.textContent=t; el.classList.add("show"); clearTimeout(el._t); el._t=setTimeout(function(){ el.classList.remove("show"); },1800); }
$("go").addEventListener("click",function(){
  if(!E.available()){ $("go").textContent="הדפדפן הזה לא תומך בשמע"; return; }
  E.start(); $("start").hidden=true; sizeXY(); buildKeys(); refreshClock();
  var ids=[57,60,64].map(function(n){ return E.noteOn(n); });
  setTimeout(function(){ ids.forEach(E.noteOff); paintKeys(); },700); paintKeys();
});
document.addEventListener("pointerdown",function(){ if($("start").hidden){ E.start(); } },true);
document.addEventListener("visibilitychange",function(){ if(document.hidden){ releaseAll(); E.setClock(false); } else refreshClock(); });

/* ---------- init ---------- */
buildKnobs();
setBpm(get("ambi:bpm",128));
var last=get("ambi:last",null);
loadPreset(last||PRESETS[0]);
if(last && !PRESETS.concat(mine()).some(function(p){ return p.name===last.name; })) state.current="";
paintPresets();
var tab=get("ambi:tab","sound"), tb=document.querySelector('.tabs [data-tab="'+tab+'"]'); if(tb) tb.click();
sizeXY(); buildKeys();
if("serviceWorker" in navigator && location.protocol==="https:"){ navigator.serviceWorker.register("sw.js").catch(function(){}); }
})();
