/* מכונת אווירות · ממשק */
(function(){
"use strict";
var E=window.Engine, P=E.P;
var $=function(id){ return document.getElementById(id); };
function get(k,d){ try{ var v=localStorage.getItem(k); return v==null?d:JSON.parse(v); }catch(e){ return d; } }
function put(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} }

/* ================= page never moves ================= */
// iOS ignores "no zoom" in some cases: block pinch, double-tap zoom and page drag outside the scrollable panes.
["gesturestart","gesturechange","gestureend"].forEach(function(t){ document.addEventListener(t,function(e){ e.preventDefault(); },{passive:false}); });
document.addEventListener("dblclick",function(e){ e.preventDefault(); },{passive:false});
document.addEventListener("touchmove",function(e){ if(e.touches.length>1 || !e.target.closest(".scroll-y,.scroll-x,.start")) e.preventDefault(); },{passive:false});
// double-tap zoom is turned off in the stylesheet (touch-action), which keeps fast repeated taps working

/* ================= controls ================= */
var KNOBS={
  sound:[
    ["bright","בהירות","תדר החיתוך של המסנן, כמו CUTOFF בבס. ימינה יותר הרמוניות עוברות."],
    ["reso","תהודה","מדגישה פס צר סביב החיתוך, כמו PEAK. גבוה: צפצוף חומצי."],
    ["env","מכה","כמה המסנן נפתח בתחילת כל תו, כמו CUTOFF EG INT. ה״קוואק״ של אסיד."],
    ["attack","כניסה","זמן העלייה. נמוך: התו מתחיל מיד. גבוה: נכנס לאט, כמו שטיח."],
    ["release","דעיכה","כמה זמן הצליל ממשיך אחרי שהאצבע עוזבת. משפיע גם על אורך ה״מכה״."],
    ["width","רוחב","הפרש קטן בגובה בין המתנדים, ועוד כורוס. רוחב בין שתי האוזניים."],
    ["breath","נשימה","תנועה מחזורית איטית על המסנן. הצליל נפתח ונסגר לבד."],
    ["glide","גלישה","כמה לאט הגובה עובר מתו לתו במצב ״קול אחד״."]
  ],
  dirt:[
    ["drive","לכלוך","דיסטורשן: מגביר עד שהגל ״נחתך״. הרמוניות, צריבה ומיץ."],
    ["mud","בוץ","מגביר נמוכים ונמוכים־אמצעיים. עבה, חם וכבד."],
    ["color","צבע","מסנן שני אחרי הלכלוך. שמאלה עמום, ימינה חד."],
    ["metal","מתכת","מהוד שמכוון לכל תו. צלצול מתכתי, כמו פח או מיתר."]
  ],
  time:[
    ["space","הד","חדר גדול. כל צליל מקבל זנב ארוך של השתקפויות."],
    ["echo","השהיה","הצליל חוזר בקצב של שמינית מנוקדת, ימין ושמאל לסירוגין."]
  ]
};
var ALLKNOBS=[].concat(KNOBS.sound,KNOBS.dirt,KNOBS.time);
var DEF={bright:.45,reso:.15,env:.2,attack:.55,release:.6,width:.55,breath:.25,glide:.3,space:.6,echo:.15,drive:0,mud:0,color:.7,metal:0,shape:0,mono:0,chord:"min",arp:"off",rate:1,gate:"off"};
function preset(p){ var o={}; Object.keys(DEF).forEach(function(k){ o[k]=DEF[k]; }); Object.keys(p).forEach(function(k){ o[k]=p[k]; }); return o; }
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
].map(preset);
var CHORDS={one:[0],min:[0,3,7],maj:[0,4,7],sus:[0,2,7],m7:[0,3,7,10],oct:[0,12]};
var CHORDNAME={one:"",min:"מינור",maj:"מז׳ור",sus:"תלוי",m7:"מינור 7",oct:"אוקטבות"};
var NOTE=["דו","דו#","רה","רה#","מי","פה","פה#","סול","סול#","לה","לה#","סי"];
var state={chord:"min",oct:3,hold:false,current:"ענן",arp:"off",rate:1,gate:"off"};

function clean(pr){
  if(!pr||typeof pr!=="object") return null;
  var o={name:String(pr.name||"").slice(0,40)};
  ALLKNOBS.forEach(function(k){ var v=+pr[k[0]]; o[k[0]]=isFinite(v)?Math.max(0,Math.min(1,v)):DEF[k[0]]; });
  o.shape=[0,1,2,3,4].indexOf(+pr.shape)>-1?+pr.shape:0; o.mono=pr.mono?1:0;
  o.chord=CHORDS[pr.chord]?pr.chord:"min"; o.arp=["off","up","down","updown","rand"].indexOf(pr.arp)>-1?pr.arp:"off";
  o.rate=+pr.rate===2?2:1; o.gate=E.gates.hasOwnProperty(pr.gate)?pr.gate:"off";
  return o;
}

/* ---- knobs ---- */
var knobEls={}, knobVals={};
function knobSVG(v){
  function p(d,r){ var a=d*Math.PI/180; return [(50+r*Math.sin(a)).toFixed(1),(50-r*Math.cos(a)).toFixed(1)]; }
  var a=-150+v*300, large=(v*300)>180?1:0, s=p(-150,41), e=p(a,41), z=p(150,41), i1=p(a,9), i2=p(a,22), ticks="";
  for(var i=0;i<=10;i++){ var d=-150+i*30, t1=p(d,47), t2=p(d,49.5); ticks+='<line x1="'+t1[0]+'" y1="'+t1[1]+'" x2="'+t2[0]+'" y2="'+t2[1]+'" stroke="var(--muted)" stroke-width="1.6" opacity=".5"/>'; }
  var arc=v>0.003?'<path d="M'+s.join(" ")+' A41 41 0 '+large+' 1 '+e.join(" ")+'" fill="none" stroke="url(#kg)" stroke-width="6.5" stroke-linecap="round"/>':"";
  return '<svg viewBox="0 0 100 100" aria-hidden="true"><defs><linearGradient id="kg" x1="0" x2="1"><stop offset="0" stop-color="#7fd6c9"/><stop offset="1" stop-color="#ffb38a"/></linearGradient>'+
    '<radialGradient id="kb" cx=".38" cy=".32" r=".8"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#cfc4ee"/></radialGradient></defs>'+ticks+
    '<path d="M'+s.join(" ")+' A41 41 0 1 1 '+z.join(" ")+'" fill="none" stroke="var(--track)" stroke-width="6.5" stroke-linecap="round"/>'+arc+
    '<circle cx="50" cy="51.5" r="28" fill="rgba(0,0,0,.35)"/><circle cx="50" cy="50" r="28" fill="url(#kb)"/><line x1="'+i1[0]+'" y1="'+i1[1]+'" x2="'+i2[0]+'" y2="'+i2[1]+'" stroke="#2a2350" stroke-width="5" stroke-linecap="round"/></svg>';
}
function buildKnobs(){
  Object.keys(KNOBS).forEach(function(group){
    var box=$("knobs-"+group);
    KNOBS[group].forEach(function(k){
      var w=document.createElement("div"); w.className="kn";
      w.innerHTML='<div class="kn-dial" role="slider" tabindex="0" aria-label="'+k[1]+'" aria-valuemin="0" aria-valuemax="10" id="k-'+k[0]+'"></div><span class="kn-lbl">'+k[1]+'</span><span class="kn-val" id="v-'+k[0]+'"></span><p class="explain">'+k[2]+'</p>';
      box.appendChild(w);
      var d=w.querySelector(".kn-dial"); knobEls[k[0]]=d;
      var drag=null, lastTap=0;
      function begin(id,y){ drag={id:id,y:y,v:P[k[0]]}; d.classList.add("drag");
        var now=Date.now(); if(now-lastTap<280){ var pr=PRESETS.concat(mine()).filter(function(x){return x.name===state.current;})[0]; setParam(k[0],pr?pr[k[0]]:DEF[k[0]]); drag.v=P[k[0]]; } lastTap=now; }
      function move(y){ if(!drag) return; setParam(k[0],Math.max(0,Math.min(1,drag.v+(drag.y-y)/180))); }
      function end(){ drag=null; d.classList.remove("drag"); }
      // touch first (iOS), mouse as fallback
      d.addEventListener("touchstart",function(e){ e.preventDefault(); var t=e.changedTouches[0]; begin(t.identifier,t.clientY); },{passive:false});
      d.addEventListener("touchmove",function(e){ e.preventDefault(); for(var i=0;i<e.changedTouches.length;i++){ var t=e.changedTouches[i]; if(drag&&t.identifier===drag.id) move(t.clientY); } },{passive:false});
      function tend(e){ for(var i=0;i<e.changedTouches.length;i++){ if(drag&&e.changedTouches[i].identifier===drag.id) end(); } }
      d.addEventListener("touchend",tend); d.addEventListener("touchcancel",tend);
      d.addEventListener("mousedown",function(e){ e.preventDefault(); begin("m",e.clientY);
        function mm(ev){ move(ev.clientY); } function mu(){ end(); window.removeEventListener("mousemove",mm); window.removeEventListener("mouseup",mu); }
        window.addEventListener("mousemove",mm); window.addEventListener("mouseup",mu); });
      d.addEventListener("keydown",function(e){ var s={ArrowUp:.02,ArrowRight:.02,ArrowDown:-.02,ArrowLeft:-.02}[e.key]; if(s){ e.preventDefault(); setParam(k[0],Math.max(0,Math.min(1,P[k[0]]+s))); } });
    });
  });
}
var paintQ={}, paintRaf=0;
function paintKnob(key){ paintQ[key]=1; if(!paintRaf) paintRaf=requestAnimationFrame(flushKnobs); }
function flushKnobs(){
  paintRaf=0;
  Object.keys(paintQ).forEach(function(key){
    var d=knobEls[key]; if(!d) return; var v=Math.round(P[key]*200)/200;
    if(knobVals[key]!==v){ knobVals[key]=v; d.innerHTML=knobSVG(P[key]); d.setAttribute("aria-valuenow",(P[key]*10).toFixed(1)); $("v-"+key).textContent=(P[key]*10).toFixed(1); }
  });
  paintQ={};
}
function setParam(key,v){ E.set(key,v); paintKnob(key); if(key==="bright"||key==="space") drawXY(); markCustom(); }

function seg(id,val,on){
  [].forEach.call($(id).querySelectorAll("button"),function(b){ var sel=b.dataset.v===String(val); b.classList.toggle("on",sel); b.setAttribute("aria-pressed",sel);
    if(on && !b._w){ b._w=1; b.addEventListener("click",function(){ on(b.dataset.v); }); } });
}
function setShape(v){ E.set("shape",+v); seg("shape",v,setShape); markCustom(); }
function setMono(v){ v=+v; if(!!v!==!!P.mono) releaseAll(); E.set("mono",!!v); seg("mono",v,setMono); markCustom(); }
function setChord(v){ state.chord=v; seg("chord",v,setChord); markCustom(); }
function setArp(v){ state.arp=v; seg("arp",v,setArp); if(v==="off") arpStop(); refreshClock(); markCustom(); }
function setRate(v){ state.rate=+v; seg("arpRate",v,setRate); markCustom(); }
function setGate(v){ state.gate=v; seg("gate",v,setGate); refreshClock(); markCustom(); }

[].forEach.call(document.querySelectorAll(".tabs button"),function(b){
  b.addEventListener("click",function(){
    [].forEach.call(document.querySelectorAll(".tabs button"),function(x){ x.setAttribute("aria-selected",x===b); });
    [].forEach.call(document.querySelectorAll(".pane"),function(p){ p.hidden=p.dataset.pane!==b.dataset.tab; });
    put("ambi:tab",b.dataset.tab);
  });
});

/* ---- presets ---- */
function mine(){ var m=get("ambi:mine",[]); return Array.isArray(m)?m.map(clean).filter(Boolean):[]; }
function loadPreset(pr){
  ALLKNOBS.forEach(function(k){ E.set(k[0],pr[k[0]]!=null?pr[k[0]]:DEF[k[0]]); paintKnob(k[0]); });
  setShape(pr.shape||0); setMono(pr.mono?1:0); setChord(pr.chord||"min");
  setArp(pr.arp||"off"); setRate(pr.rate||1); setGate(pr.gate||"off");
  state.current=pr.name; drawXY(); paintPresets(); put("ambi:last",pr);
}
var customTimer=null;
function markCustom(){ clearTimeout(customTimer); customTimer=setTimeout(function(){ put("ambi:last",snapshot(state.current)); },400); }
function snapshot(name){ var s={name:name}; ALLKNOBS.forEach(function(k){ s[k[0]]=+P[k[0]].toFixed(3); }); s.shape=P.shape; s.mono=P.mono?1:0; s.chord=state.chord; s.arp=state.arp; s.rate=state.rate; s.gate=state.gate; return s; }
function paintPresets(){
  var box=$("presets"), sl=box.scrollLeft; box.innerHTML="";
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
  box.scrollLeft=sl;
}
$("save").addEventListener("click",function(){
  var m=mine(), n=1, names=m.map(function(q){return q.name;});
  while(names.indexOf("הצליל שלי "+n)>-1) n++;
  var s=snapshot("הצליל שלי "+n); m.push(s); put("ambi:mine",m); state.current=s.name; paintPresets(); toast("נשמר בשם ״"+s.name+"״");
});
$("help").addEventListener("click",function(){ var on=document.body.classList.toggle("helping"); this.setAttribute("aria-pressed",on); this.classList.toggle("on",on); });

/* ================= touch surface ================= */
var cv=$("xy"), cx=cv.getContext("2d"), trail=[], xyOn=false, xyId=null, xyRaf=0;
function sizeXY(){ var r=cv.getBoundingClientRect(), d=Math.min(2,window.devicePixelRatio||1); if(!r.width) return; cv.width=Math.round(r.width*d); cv.height=Math.round(r.height*d); drawXY(); }
function drawXY(){ if(!xyRaf) xyRaf=requestAnimationFrame(renderXY); }
function renderXY(){
  xyRaf=0; var w=cv.width, h=cv.height; if(!w) return; var d=Math.min(2,window.devicePixelRatio||1);
  cx.clearRect(0,0,w,h);
  cx.strokeStyle="rgba(255,255,255,.055)"; cx.lineWidth=d;
  for(var i=1;i<4;i++){ cx.beginPath(); cx.moveTo(w*i/4,0); cx.lineTo(w*i/4,h); cx.stroke(); cx.beginPath(); cx.moveTo(0,h*i/4); cx.lineTo(w,h*i/4); cx.stroke(); }
  var now=performance.now();
  trail=trail.filter(function(p){ return now-p.t<800; }).slice(-40);
  trail.forEach(function(p){ var a=1-(now-p.t)/800; cx.fillStyle="rgba(255,179,138,"+(a*0.16).toFixed(3)+")"; cx.beginPath(); cx.arc(p.x*w,(1-p.y)*h,(12+26*(1-a))*d,0,7); cx.fill(); });
  var x=P.bright*w, y=(1-P.space)*h, g=cx.createRadialGradient(x,y,0,x,y,64*d);
  g.addColorStop(0,"rgba(255,190,150,.85)"); g.addColorStop(.28,"rgba(255,140,120,.32)"); g.addColorStop(1,"rgba(127,214,201,0)");
  cx.fillStyle=g; cx.beginPath(); cx.arc(x,y,64*d,0,7); cx.fill();
  cx.fillStyle="#fff1e6"; cx.beginPath(); cx.arc(x,y,(xyOn?11:8)*d,0,7); cx.fill();
  if(trail.length) drawXY();
}
function xyAt(cxp,cyp){
  var r=cv.getBoundingClientRect(), x=Math.max(0,Math.min(1,(cxp-r.left)/r.width)), y=Math.max(0,Math.min(1,1-(cyp-r.top)/r.height));
  E.set("bright",x); E.set("space",y); paintKnob("bright"); paintKnob("space"); trail.push({x:x,y:y,t:performance.now()}); drawXY(); markCustom();
}
cv.addEventListener("touchstart",function(e){ e.preventDefault(); E.touched(); var t=e.changedTouches[0]; xyId=t.identifier; xyOn=true; xyAt(t.clientX,t.clientY); },{passive:false});
cv.addEventListener("touchmove",function(e){ e.preventDefault(); for(var i=0;i<e.changedTouches.length;i++){ var t=e.changedTouches[i]; if(t.identifier===xyId) xyAt(t.clientX,t.clientY); } },{passive:false});
function xyEnd(e){ for(var i=0;i<e.changedTouches.length;i++){ if(e.changedTouches[i].identifier===xyId){ xyId=null; xyOn=false; drawXY(); } } }
cv.addEventListener("touchend",xyEnd); cv.addEventListener("touchcancel",xyEnd);
cv.addEventListener("mousedown",function(e){ xyOn=true; xyAt(e.clientX,e.clientY);
  function mm(ev){ xyAt(ev.clientX,ev.clientY); } function mu(){ xyOn=false; drawXY(); window.removeEventListener("mousemove",mm); window.removeEventListener("mouseup",mu); }
  window.addEventListener("mousemove",mm); window.addEventListener("mouseup",mu); });
var rsT=0; window.addEventListener("resize",function(){ clearTimeout(rsT); rsT=setTimeout(function(){ sizeXY(); buildKeys(); },120); });

/* ================= keyboard ================= */
var keyEls={}, fingers={}, held=[], heldNotes=[], lastPress=0;
function whiteCount(){ var w=$("kbd").clientWidth||window.innerWidth; return w<520?8:(w<900?11:15); }
function buildKeys(){
  var box=$("kbd"); box.innerHTML=""; keyEls={};
  var n=whiteCount(), base=12*(state.oct+1), whites=[0,2,4,5,7,9,11], list=[];
  for(var i=0;i<n;i++) list.push(base+Math.floor(i/7)*12+whites[i%7]);
  var wW=100/n;
  list.forEach(function(m,i){
    var k=document.createElement("div"); k.className="key white"; k.dataset.m=m; k.style.left=(i*wW)+"%"; k.style.width=wW+"%";
    k.innerHTML='<span>'+NOTE[m%12]+(m%12===0?'<b>'+(Math.floor(m/12)-1)+'</b>':'')+'</span>'; box.appendChild(k); keyEls[m]=k;
    if(i<n-1 && [0,2,5,7,9].indexOf(m%12)>-1){
      var b=document.createElement("div"); b.className="key black"; b.dataset.m=m+1; b.style.left=((i+1)*wW-wW*0.3)+"%"; b.style.width=(wW*0.6)+"%";
      box.appendChild(b); keyEls[m+1]=b;
    }
  });
  $("oct").textContent=state.oct;
  paintKeys();
}
function paintKeys(){
  var on=E.sounding(), pressed={};
  Object.keys(fingers).forEach(function(f){ pressed[fingers[f].m]=1; });
  Object.keys(keyEls).forEach(function(m){ keyEls[m].classList.toggle("on",!!on[m]); keyEls[m].classList.toggle("pressed",!!pressed[m]); });
}
function chordLabel(root){ $("chordname").textContent=root==null?"":NOTE[root%12]+(CHORDNAME[state.chord]?" "+CHORDNAME[state.chord]:""); }
function chordNotes(m){ return CHORDS[state.chord].map(function(iv){ return m+iv; }); }
function clearHeld(){ held.forEach(E.noteOff); held=[]; heldNotes=[]; }

function press(fid,m,sliding){
  E.touched(); lastPress=Date.now();
  if(!sliding && state.hold && Object.keys(fingers).length===0) clearHeld();   // a fresh chord replaces the held one
  var notes=chordNotes(m), ids=[];
  if(state.arp==="off") ids=notes.map(function(n){ return E.noteOn(n); }).filter(function(x){ return x!=null; });
  else { E.start(); refreshClock(); }
  fingers[fid]={m:m,ids:ids,notes:notes}; chordLabel(m); paintKeys();
}
function lift(fid,sliding){
  var f=fingers[fid]; if(!f) return; delete fingers[fid];
  if(state.hold && !sliding){ held=held.concat(f.ids); heldNotes=heldNotes.concat(f.notes); } else f.ids.forEach(E.noteOff);
  if(!state.hold && !Object.keys(fingers).length) chordLabel(null);
  paintKeys(); setTimeout(paintKeys,30);
}
function slide(fid,m){ var f=fingers[fid]; if(!f||f.m===m) return; lift(fid,true); press(fid,m,true); }
function keyAt(x,y){ var el=document.elementFromPoint(x,y); return el&&el.closest?el.closest(".key"):null; }
function releaseAll(){
  arpStop(); Object.keys(fingers).forEach(function(k){ fingers[k].ids.forEach(E.noteOff); }); fingers={}; clearHeld(); E.allOff(); chordLabel(null); paintKeys(); setTimeout(paintKeys,30);
}

var kbd=$("kbd");
kbd.addEventListener("touchstart",function(e){ e.preventDefault();
  for(var i=0;i<e.changedTouches.length;i++){ var t=e.changedTouches[i], k=keyAt(t.clientX,t.clientY); if(k) press("t"+t.identifier,+k.dataset.m); } },{passive:false});
kbd.addEventListener("touchmove",function(e){ e.preventDefault();
  for(var i=0;i<e.changedTouches.length;i++){ var t=e.changedTouches[i], fid="t"+t.identifier; if(!fingers[fid]) continue; var k=keyAt(t.clientX,t.clientY); if(k) slide(fid,+k.dataset.m); } },{passive:false});
function kEnd(e){ for(var i=0;i<e.changedTouches.length;i++) lift("t"+e.changedTouches[i].identifier); }
kbd.addEventListener("touchend",kEnd); kbd.addEventListener("touchcancel",kEnd);
kbd.addEventListener("mousedown",function(e){ var k=keyAt(e.clientX,e.clientY); if(!k) return; press("mouse",+k.dataset.m);
  function mm(ev){ var kk=keyAt(ev.clientX,ev.clientY); if(kk) slide("mouse",+kk.dataset.m); }
  function mu(){ lift("mouse"); window.removeEventListener("mousemove",mm); window.removeEventListener("mouseup",mu); }
  window.addEventListener("mousemove",mm); window.addEventListener("mouseup",mu); });
kbd.addEventListener("contextmenu",function(e){ e.preventDefault(); });

// Safety nets against stuck notes:
// 1. any touch that ends anywhere on the page releases its finger, even if it slid off the keyboard
document.addEventListener("touchend",function(e){ var alive={}; for(var i=0;i<e.touches.length;i++) alive["t"+e.touches[i].identifier]=1;
  Object.keys(fingers).forEach(function(f){ if(f.charAt(0)==="t" && !alive[f]) lift(f); }); },true);
document.addEventListener("touchcancel",function(e){ var alive={}; for(var i=0;i<e.touches.length;i++) alive["t"+e.touches[i].identifier]=1;
  Object.keys(fingers).forEach(function(f){ if(f.charAt(0)==="t" && !alive[f]) lift(f); }); },true);
// 2. leaving the app or losing focus lets go of everything that isn't held on purpose
window.addEventListener("blur",function(){ Object.keys(fingers).forEach(function(f){ lift(f); }); });
// 3. a sweep: nothing pressed, nothing held, no arpeggio, but something still sounding → silence it
setInterval(function(){
  if(Object.keys(fingers).length || state.hold || state.arp!=="off") return;
  if(Date.now()-lastPress<900) return;
  if(E.live()>0) E.allOff();
  paintKeys();
},500);

var KEYMAP="awsedftgyhujk", down={};
document.addEventListener("keydown",function(e){ if(e.repeat||e.metaKey||e.ctrlKey) return; var i=KEYMAP.indexOf(e.key.toLowerCase()); if(i<0||down[e.key]) return; down[e.key]=1; press("k"+e.key,12*(state.oct+1)+i); });
document.addEventListener("keyup",function(e){ if(down[e.key]){ delete down[e.key]; lift("k"+e.key); } });

$("octDown").addEventListener("click",function(){ if(state.oct>1){ state.oct--; buildKeys(); } });
$("octUp").addEventListener("click",function(){ if(state.oct<5){ state.oct++; buildKeys(); } });
$("hold").addEventListener("click",function(){
  state.hold=!state.hold; this.classList.toggle("on",state.hold); this.setAttribute("aria-pressed",state.hold);
  if(!state.hold){ clearHeld(); paintKeys(); setTimeout(paintKeys,30); if(!Object.keys(fingers).length) chordLabel(null); }
});
$("panic").addEventListener("click",releaseAll);
$("reset").addEventListener("click",function(){ releaseAll(); E.reset(); E.touched(); refreshClock(); toast("הצליל אותחל"); });
E.onReset=function(msg){ fingers={}; held=[]; heldNotes=[]; arpMonoId=null; refreshClock(); paintKeys(); toast(msg); };

/* ================= arpeggiator & clock ================= */
function arpPool(){
  var s={}; Object.keys(fingers).forEach(function(k){ fingers[k].notes.forEach(function(n){ s[n]=1; }); });
  if(state.hold) heldNotes.forEach(function(n){ s[n]=1; });
  return Object.keys(s).map(Number).sort(function(a,b){ return a-b; });
}
var arpIdx=0, arpMonoId=null;
function arpTick(step,t,sd){
  if(state.arp==="off" || step%state.rate!==0) return;
  var pool=arpPool();
  if(!pool.length){ arpIdx=0; if(arpMonoId){ E.noteOffAt(arpMonoId,t); arpMonoId=null; } return; }
  var n;
  if(state.arp==="up") n=pool[arpIdx++%pool.length];
  else if(state.arp==="down") n=pool[pool.length-1-(arpIdx++%pool.length)];
  else if(state.arp==="rand") n=pool[Math.floor(Math.random()*pool.length)];
  else { if(pool.length===1) n=pool[0]; else { var span=pool.length*2-2, i=arpIdx++%span; n=pool[i<pool.length?i:span-i]; } }
  var id=E.noteOnAt(n,t);
  if(P.mono){ if(arpMonoId) E.noteOffAt(arpMonoId,t); arpMonoId=id; }
  else E.noteOffAt(id,t+sd*state.rate*0.82);
}
function arpStop(){ arpIdx=0; if(arpMonoId){ E.noteOff(arpMonoId); arpMonoId=null; } }
function refreshClock(){ var need=state.arp!=="off"||state.gate!=="off"; E.setClock(need&&E.running(),arpTick,state.gate); }
setInterval(function(){ if(state.arp!=="off") paintKeys(); },90);

/* ================= tempo ================= */
function setBpm(v){ v=+v; if(!isFinite(v)) v=128; v=Math.max(60,Math.min(190,Math.round(v))); E.set("bpm",v); $("bpm").textContent=v; put("ambi:bpm",v); }
$("bpmDown").addEventListener("click",function(){ setBpm(P.bpm-1); });
$("bpmUp").addEventListener("click",function(){ setBpm(P.bpm+1); });
var taps=[];
$("tap").addEventListener("click",function(){
  var t=performance.now(); taps=taps.filter(function(x){ return t-x<2500; }); taps.push(t);
  if(taps.length>=3){ setBpm(60000/((taps[taps.length-1]-taps[0])/(taps.length-1))); }
  var b=this; b.classList.add("on"); setTimeout(function(){ b.classList.remove("on"); },90);
});

/* ================= meter (light: 15 times a second) ================= */
setInterval(function(){
  if(document.hidden) return; var lv=E.level(), box=$("meter").parentNode;
  box.classList.toggle("bad",lv<0); $("meter").style.width=Math.min(100,Math.round(Math.max(0,lv)*260))+"%";
},66);

/* ================= recording ================= */
var rec=null, recChunks=[], recT0=0, recTimer=null, recBlob=null;
function recType(){
  if(!window.MediaRecorder) return null;
  var t=["audio/mp4","audio/webm;codecs=opus","audio/webm"];
  for(var i=0;i<t.length;i++){ try{ if(MediaRecorder.isTypeSupported(t[i])) return t[i]; }catch(e){} }
  return "";
}
$("rec").addEventListener("click",function(){
  var b=this, lbl='⏺<span class="lbl"> הקלטה</span>';
  if(rec){ try{ rec.stop(); }catch(e){} return; }
  var type=recType(), stream=E.recStream();
  if(type===null||!stream){ toast("המכשיר הזה לא תומך בהקלטה מתוך הדפדפן"); return; }
  try{ rec=type?new MediaRecorder(stream,{mimeType:type}):new MediaRecorder(stream); }catch(e){ rec=null; toast("ההקלטה לא הצליחה להתחיל"); return; }
  recChunks=[];
  rec.ondataavailable=function(e){ if(e.data&&e.data.size) recChunks.push(e.data); };
  rec.onstop=function(){
    clearInterval(recTimer); b.classList.remove("on"); b.innerHTML=lbl; b.setAttribute("aria-pressed",false);
    var mt=(rec&&rec.mimeType)||type||"audio/webm"; rec=null;
    recBlob=new Blob(recChunks,{type:mt}); if(!recBlob.size){ toast("ההקלטה ריקה"); return; }
    var ext=mt.indexOf("mp4")>-1?"m4a":"webm", name="אווירות-"+new Date().toISOString().slice(0,16).replace(/[:T]/g,"-")+"."+ext;
    var a=$("recfile"); if(a.href) URL.revokeObjectURL(a.href); a.href=URL.createObjectURL(recBlob); a.download=name; a.dataset.name=name;
    var canShare=false; try{ canShare=!!(navigator.canShare&&navigator.canShare({files:[new File([recBlob],name,{type:mt})]})); }catch(e){}
    $("recshare").hidden=!canShare; $("recdone").hidden=false;
  };
  rec.start(1000); recT0=Date.now(); b.classList.add("on"); b.setAttribute("aria-pressed",true); b.textContent="⏹ 0:00";
  recTimer=setInterval(function(){ var s=Math.floor((Date.now()-recT0)/1000); b.textContent="⏹ "+Math.floor(s/60)+":"+("0"+s%60).slice(-2); },500);
});
$("recshare").addEventListener("click",function(){ var a=$("recfile"); if(!recBlob) return;
  try{ navigator.share({files:[new File([recBlob],a.dataset.name,{type:recBlob.type})],title:"אווירות"}).catch(function(){}); }catch(e){} });
$("recx").addEventListener("click",function(){ $("recdone").hidden=true; });

/* ================= start, screen, lifecycle ================= */
function toast(t){ var el=$("toast"); el.textContent=t; el.classList.add("show"); clearTimeout(el._t); el._t=setTimeout(function(){ el.classList.remove("show"); },2000); }
var lock=null;
function wake(){ if(!("wakeLock" in navigator)||document.hidden) return; navigator.wakeLock.request("screen").then(function(l){ lock=l; }).catch(function(){}); }
$("go").addEventListener("click",function(){
  if(!E.available()){ $("go").textContent="הדפדפן הזה לא תומך בשמע"; return; }
  E.start(); E.touched(); $("start").hidden=true; sizeXY(); buildKeys(); refreshClock(); wake();
  var ids=[57,60,64].map(function(n){ return E.noteOn(n); }); lastPress=Date.now();
  setTimeout(function(){ ids.forEach(E.noteOff); paintKeys(); },650);
});
// wake the audio on every touch (cheap now), so iOS never leaves it asleep after a call or app switch
document.addEventListener("touchstart",function(){ if($("start").hidden){ E.start(); E.touched(); } },{capture:true,passive:true});
document.addEventListener("mousedown",function(){ if($("start").hidden) E.start(); },true);
document.addEventListener("visibilitychange",function(){
  if(document.hidden){ if(!rec){ Object.keys(fingers).forEach(function(f){ lift(f); }); E.setClock(false); } }
  else { E.start(); refreshClock(); wake(); }
});
window.addEventListener("error",function(){ toast("משהו השתבש. אם אין צליל, גע ב־↻"); });

/* ================= init ================= */
(function(){
  var ios=/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
  var standalone=navigator.standalone||(window.matchMedia&&matchMedia("(display-mode: standalone)").matches);
  if(ios&&!standalone) $("install").hidden=false;
})();
buildKnobs();
setBpm(get("ambi:bpm",128));
var last=clean(get("ambi:last",null));
loadPreset(last||PRESETS[0]);
if(last && !PRESETS.concat(mine()).some(function(p){ return p.name===last.name; })) state.current="";
paintPresets();
var tab=get("ambi:tab","sound"), tb=document.querySelector('.tabs [data-tab="'+tab+'"]'); if(tb) tb.click();
sizeXY(); buildKeys(); flushKnobs();
if("serviceWorker" in navigator && location.protocol==="https:"){ navigator.serviceWorker.register("sw.js").catch(function(){}); }
})();
