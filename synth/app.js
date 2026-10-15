/* מכונת אווירות · ממשק */
(function(){
"use strict";
var E=window.Engine, P=E.P;
var $=function(id){ return document.getElementById(id); };
function get(k,d){ try{ var v=localStorage.getItem(k); return v==null?d:JSON.parse(v); }catch(e){ return d; } }
function put(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} }

/* ---------- controls ---------- */
var KNOBS=[
  ["bright","בהירות","תדר החיתוך של המסנן, כמו CUTOFF בבס. ימינה יותר הרמוניות עוברות והצליל נפתח."],
  ["reso","תהודה","מדגישה פס צר סביב החיתוך, כמו PEAK. בשטיחי צליל משתמשים בה בעדינות."],
  ["attack","כניסה","זמן העלייה של המעטפת. כאן הצליל נכנס לאט, ההפך מהאסיד."],
  ["release","דעיכה","כמה זמן הצליל ממשיך אחרי שהאצבע עוזבת. ארוך: הצלילים נמזגים זה בזה."],
  ["width","רוחב","שני מתנדים בגובה כמעט זהה. ההפרש ביניהם יוצר פעימות, והכורוס מפזר את הצליל בין שתי האוזניים."],
  ["breath","נשימה","תנועה מחזורית איטית על המסנן. הצליל נפתח ונסגר לבד, כמו נשימה."],
  ["space","הד","הדמיה של חדר גדול. כל צליל מקבל זנב ארוך של השתקפויות."],
  ["echo","השהיה","הצליל חוזר כמה פעמים, ימין ושמאל לסירוגין, ונחלש בכל חזרה."]
];
var PRESETS=[
  {name:"ענן",   bright:.45,reso:.15,attack:.55,release:.62,width:.55,breath:.25,space:.6, echo:.15,shape:0,chord:"min"},
  {name:"זכוכית",bright:.74,reso:.35,attack:.08,release:.55,width:.3, breath:.1, space:.55,echo:.42,shape:1,chord:"oct"},
  {name:"שקיעה", bright:.26,reso:.42,attack:.7, release:.75,width:.72,breath:.45,space:.7, echo:.2, shape:1,chord:"m7"},
  {name:"מים",   bright:.55,reso:.25,attack:.02,release:.38,width:.2, breath:.05,space:.45,echo:.66,shape:2,chord:"one"},
  {name:"חלל",   bright:.36,reso:.1, attack:.85,release:.9, width:.9, breath:.3, space:.95,echo:.35,shape:0,chord:"sus"}
];
var CHORDS={one:[0],min:[0,3,7],maj:[0,4,7],sus:[0,2,7],m7:[0,3,7,10],oct:[0,12]};
var CHORDNAME={one:"",min:"מינור",maj:"מז׳ור",sus:"תלוי",m7:"מינור 7",oct:"אוקטבות"};
var NOTE=["דו","דו#","רה","רה#","מי","פה","פה#","סול","סול#","לה","לה#","סי"];
var state={chord:"min",oct:3,hold:false,current:"ענן"};

var knobEls={};
function knobSVG(v){
  function p(d,r){ var a=d*Math.PI/180; return (50+r*Math.sin(a)).toFixed(1)+" "+(50-r*Math.cos(a)).toFixed(1); }
  var a=-150+v*300, large=(v*300)>180?1:0;
  var arc=v>0.003?'<path d="M'+p(-150,40)+' A40 40 0 '+large+' 1 '+p(a,40)+'" fill="none" stroke="var(--glow)" stroke-width="7" stroke-linecap="round"/>':"";
  return '<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M'+p(-150,40)+' A40 40 0 1 1 '+p(150,40)+'" fill="none" stroke="var(--track)" stroke-width="7" stroke-linecap="round"/>'+arc+
    '<circle cx="50" cy="50" r="27" fill="var(--knob)"/><line x1="'+p(a,8).split(" ")[0]+'" y1="'+p(a,8).split(" ")[1]+'" x2="'+p(a,22).split(" ")[0]+'" y2="'+p(a,22).split(" ")[1]+'" stroke="var(--ink)" stroke-width="5" stroke-linecap="round"/></svg>';
}
function buildKnobs(){
  var box=$("knobs");
  KNOBS.forEach(function(k){
    var w=document.createElement("div"); w.className="kn";
    w.innerHTML='<div class="kn-dial" role="slider" tabindex="0" aria-label="'+k[1]+'" aria-valuemin="0" aria-valuemax="100" id="k-'+k[0]+'"></div><span class="kn-lbl">'+k[1]+'</span><p class="explain">'+k[2]+'</p>';
    box.appendChild(w);
    var d=w.querySelector(".kn-dial"); knobEls[k[0]]=d;
    var startY=0, startV=0, id=null, lastTap=0;
    d.addEventListener("pointerdown",function(e){ e.preventDefault(); id=e.pointerId; d.setPointerCapture(id); startY=e.clientY; startV=P[k[0]]; d.classList.add("drag");
      var now=Date.now(); if(now-lastTap<300){ var pr=PRESETS.filter(function(x){return x.name===state.current;})[0]; if(pr){ setParam(k[0],pr[k[0]]); } } lastTap=now; });
    d.addEventListener("pointermove",function(e){ if(e.pointerId!==id) return; var v=Math.max(0,Math.min(1,startV+(startY-e.clientY)/170)); setParam(k[0],v); });
    function up(e){ if(e.pointerId!==id) return; id=null; d.classList.remove("drag"); }
    d.addEventListener("pointerup",up); d.addEventListener("pointercancel",up);
    d.addEventListener("keydown",function(e){ var s={ArrowUp:.03,ArrowRight:.03,ArrowDown:-.03,ArrowLeft:-.03}[e.key]; if(s){ e.preventDefault(); setParam(k[0],Math.max(0,Math.min(1,P[k[0]]+s))); } });
  });
}
function paintKnob(key){ var d=knobEls[key]; if(!d) return; d.innerHTML=knobSVG(P[key]); d.setAttribute("aria-valuenow",Math.round(P[key]*100)); }
function setParam(key,v){ E.set(key,v); paintKnob(key); if(key==="bright"||key==="space") drawXY(); markCustom(); }

function seg(id,val,on){
  [].forEach.call($(id).querySelectorAll("button"),function(b){ var sel=b.dataset.v===String(val); b.classList.toggle("on",sel); b.setAttribute("aria-pressed",sel); if(on && !b._w){ b._w=1; b.addEventListener("click",function(){ on(b.dataset.v); }); } });
}
function setShape(v){ E.set("shape",+v); seg("shape",v,setShape); markCustom(); }
function setChord(v){ state.chord=v; seg("chord",v,setChord); markCustom(); }

/* ---------- presets ---------- */
function mine(){ return get("ambi:mine",[]); }
function loadPreset(pr){
  KNOBS.forEach(function(k){ E.set(k[0],pr[k[0]]); paintKnob(k[0]); });
  setShape(pr.shape); setChord(pr.chord); state.current=pr.name; drawXY(); paintPresets(); put("ambi:last",pr);
}
var customTimer=null;
function markCustom(){
  clearTimeout(customTimer);
  customTimer=setTimeout(function(){ var s=snapshot(state.current); put("ambi:last",s); },300);
}
function snapshot(name){ var s={name:name}; KNOBS.forEach(function(k){ s[k[0]]=+P[k[0]].toFixed(3); }); s.shape=P.shape; s.chord=state.chord; return s; }
function paintPresets(){
  var box=$("presets"); box.innerHTML="";
  PRESETS.concat(mine()).forEach(function(pr,i){
    var b=document.createElement("button"); b.type="button"; b.className="chip"+(pr.name===state.current?" on":"")+(i>=PRESETS.length?" mine":"");
    b.textContent=pr.name; b.addEventListener("click",function(){ if(b.dataset.armed){ return; } loadPreset(pr); });
    if(i>=PRESETS.length){
      var x=document.createElement("span"); x.className="x"; x.textContent="✕"; x.setAttribute("role","button"); x.setAttribute("aria-label","מחיקת "+pr.name);
      x.addEventListener("click",function(e){ e.stopPropagation();
        if(b.dataset.armed){ var m=mine().filter(function(q){ return q.name!==pr.name; }); put("ambi:mine",m); paintPresets(); toast("נמחק"); }
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
  cx.strokeStyle="rgba(255,255,255,.06)"; cx.lineWidth=1*d;
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
var keyEls={}, touches={}, held=[];
function whiteCount(){ var w=$("kbd").clientWidth||window.innerWidth; return w<520?8:(w<900?11:15); }
function buildKeys(){
  var box=$("kbd"); box.innerHTML=""; keyEls={};
  var n=whiteCount(), base=12*(state.oct+1), whites=[0,2,4,5,7,9,11], list=[];
  for(var i=0;i<n;i++){ var o=Math.floor(i/7), s=whites[i%7]; list.push(base+o*12+s); }
  var wW=100/n;
  list.forEach(function(m,i){
    var k=document.createElement("div"); k.className="key white"; k.dataset.m=m; k.style.left=(i*wW)+"%"; k.style.width=wW+"%";
    k.innerHTML='<span>'+NOTE[m%12]+(m%12===0?'<b>'+(Math.floor(m/12)-1)+'</b>':'')+'</span>'; box.appendChild(k); keyEls[m]=k;
    var semi=m%12;
    if(i<n-1 && [0,2,5,7,9].indexOf(semi)>-1){
      var b=document.createElement("div"); b.className="key black"; b.dataset.m=m+1; b.style.left=((i+1)*wW-wW*0.3)+"%"; b.style.width=(wW*0.6)+"%";
      box.appendChild(b); keyEls[m+1]=b;
    }
  });
  $("oct").textContent="אוקטבה "+state.oct;
  paintKeys();
}
function paintKeys(){ var on=E.sounding(); Object.keys(keyEls).forEach(function(m){ keyEls[m].classList.toggle("on",!!on[m]); }); }
function chordLabel(root){ var c=state.chord; $("chordname").textContent=root==null?"":NOTE[root%12]+(CHORDNAME[c]?" "+CHORDNAME[c]:""); }
function press(pid,m){
  if(state.hold && Object.keys(touches).length===0 && held.length){ held.forEach(E.noteOff); held=[]; }
  var ids=CHORDS[state.chord].map(function(iv){ return E.noteOn(m+iv); }).filter(function(x){ return x!=null; });
  touches[pid]={m:m,ids:ids}; chordLabel(m); paintKeys();
}
function release(pid){
  var t=touches[pid]; if(!t) return; delete touches[pid];
  if(state.hold) held=held.concat(t.ids); else t.ids.forEach(E.noteOff);
  setTimeout(paintKeys,20); if(!state.hold && !Object.keys(touches).length) chordLabel(null);
}
function keyAt(x,y){ var el=document.elementFromPoint(x,y); return el&&el.closest?el.closest(".key"):null; }
var kbd=$("kbd");
kbd.addEventListener("pointerdown",function(e){ e.preventDefault(); var k=keyAt(e.clientX,e.clientY); if(!k) return; kbd.setPointerCapture(e.pointerId); press(e.pointerId,+k.dataset.m); });
kbd.addEventListener("pointermove",function(e){ var t=touches[e.pointerId]; if(!t) return; var k=keyAt(e.clientX,e.clientY); if(k && +k.dataset.m!==t.m){ var hold=state.hold; state.hold=false; release(e.pointerId); state.hold=hold; press(e.pointerId,+k.dataset.m); } });
kbd.addEventListener("pointerup",function(e){ release(e.pointerId); });
kbd.addEventListener("pointercancel",function(e){ release(e.pointerId); });
kbd.addEventListener("contextmenu",function(e){ e.preventDefault(); });

// computer keyboard, for testing on a laptop: A W S E D F T G Y H U J K
var KEYMAP="awsedftgyhujk";
var down={};
document.addEventListener("keydown",function(e){ if(e.repeat||e.metaKey||e.ctrlKey) return; var i=KEYMAP.indexOf(e.key.toLowerCase()); if(i<0||down[e.key]) return; down[e.key]=1; press("k"+e.key,12*(state.oct+1)+i); });
document.addEventListener("keyup",function(e){ if(down[e.key]){ delete down[e.key]; release("k"+e.key); } });

$("octDown").addEventListener("click",function(){ if(state.oct>1){ state.oct--; buildKeys(); } });
$("octUp").addEventListener("click",function(){ if(state.oct<5){ state.oct++; buildKeys(); } });
$("hold").addEventListener("click",function(){
  state.hold=!state.hold; this.classList.toggle("on",state.hold); this.setAttribute("aria-pressed",state.hold);
  if(!state.hold){ held.forEach(E.noteOff); held=[]; setTimeout(paintKeys,20); chordLabel(null); }
});
$("panic").addEventListener("click",function(){ E.allOff(); held=[]; touches={}; setTimeout(paintKeys,20); chordLabel(null); });

/* ---------- start ---------- */
function toast(t){ var el=$("toast"); el.textContent=t; el.classList.add("show"); clearTimeout(el._t); el._t=setTimeout(function(){ el.classList.remove("show"); },1800); }
$("go").addEventListener("click",function(){
  if(!E.available()){ $("go").textContent="הדפדפן הזה לא תומך בשמע"; return; }
  E.start(); $("start").hidden=true; sizeXY(); buildKeys();
  // a soft chord so you hear it works
  var ids=CHORDS[state.chord].map(function(iv){ return E.noteOn(57+iv); });
  setTimeout(function(){ ids.forEach(E.noteOff); paintKeys(); },700); paintKeys();
});
document.addEventListener("pointerdown",function(){ if($("start").hidden) E.start(); },true);
document.addEventListener("visibilitychange",function(){ if(document.hidden){ E.allOff(); held=[]; touches={}; } });

/* ---------- init ---------- */
buildKnobs();
var last=get("ambi:last",null);
loadPreset(last||PRESETS[0]);
if(last && !PRESETS.concat(mine()).some(function(p){ return p.name===last.name; })) state.current="";
paintPresets(); sizeXY(); buildKeys();

if("serviceWorker" in navigator && location.protocol==="https:"){ navigator.serviceWorker.register("sw.js").catch(function(){}); }
})();
