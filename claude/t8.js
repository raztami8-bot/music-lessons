/* T-8 panel tools for lessons 4 and 5. Data comes from t8-data.js (built by src/t8map.py).
   - #t8tour: tap a control (or its name in the list) to see what it does
   - every <kbd> whose text names a control becomes tappable and shows where it is */
(function(){
"use strict";
var T=window.PANEL||window.T8; if(!T) return;   /* the Volca Bass pages load vb-data.js, which sets window.PANEL */

var QUAL={bd:"של הקיק",sd:"של הסנר",tc:"של הקלאפ והטום",hh:"של ההיי־האטים",b:"של הבס"};
function areaOf(id){ for(var i=0;i<T.areas.length;i++) if(T.areas[i][1].indexOf(id)>-1) return T.areas[i][0]; return ""; }
function label(id){
  var n=T.names[id]||id;
  if(/^s\d+$/.test(id)){ var k=+id.slice(1), d=T.info[id].match(/התו ([^.]+)\. עם SHIFT: ([^,]+),/); return (T.stepWord||"לחצן")+" "+k+(d?" ("+d[1]+", "+d[2]+")":""); }
  var dup=0; Object.keys(T.names).forEach(function(k){ if(T.names[k]===n) dup++; });
  if(dup>1){ var q=/^b(lvl|pitch|dec)$/.test(id)?QUAL.b:(QUAL[id.slice(0,2)]||""); if(q) n+=" "+q; }
  return n;
}
function el(tag,cls,html){ var e=document.createElement(tag); if(cls) e.className=cls; if(html!=null) e.innerHTML=html; return e; }
function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];}); }

function makeMap(big){
  var box=el("div","t8-map"+(big?" big":""),T.svg); box.dir="ltr";
  box.mark=function(ids,cls){
    [].forEach.call(box.querySelectorAll(".ctl."+cls),function(g){ g.classList.remove(cls); });
    (ids||[]).forEach(function(id){ var g=box.querySelector('.ctl[data-id="'+id+'"]'); if(g) g.classList.add(cls); });
  };
  box.reveal=function(id){
    var g=box.querySelector('.ctl[data-id="'+id+'"]'); if(!g || box.scrollWidth<=box.clientWidth) return;
    var r=g.getBoundingClientRect(), b=box.getBoundingClientRect();
    box.scrollLeft+= (r.left+r.width/2)-(b.left+b.width/2);
  };
  box.onPick=null;
  box.addEventListener("click",function(e){ var g=e.target.closest(".ctl"); if(g && box.onPick) box.onPick(g.dataset.id); });
  return box;
}
function sizeToggle(map){
  var b=el("button","btn t8-size"); b.type="button";
  function paint(){ var big=map.classList.contains("big"); b.textContent=big?"⤡ תרשים קטן":"⤢ תרשים גדול"; b.setAttribute("aria-pressed",big); }
  b.addEventListener("click",function(){ map.classList.toggle("big"); paint(); }); paint();
  return b;
}

/* ---------- tour ---------- */
var tour=document.getElementById("t8tour");
if(tour){
  var map=makeMap(false), info=el("div","t8-info"), chips=el("div","t8-areas");
  info.setAttribute("aria-live","polite");
  info.innerHTML='<b>גע בכל דבר בתרשים</b><p>או בשם שלו ברשימה למטה, ויופיע כאן מה הוא עושה.</p>';
  var bar=el("div","t8-bar"); bar.appendChild(sizeToggle(map));
  T.areas.forEach(function(a){
    var sec=el("div","t8-area"); sec.appendChild(el("h4",null,esc(a[0])));
    var row=el("div","t8-chips");
    a[1].forEach(function(id){ var c=el("button","t8-chip",esc(/^s\d+$/.test(id)?id.slice(1):(T.names[id]||id))); c.type="button"; c.dataset.id=id;
      c.addEventListener("click",function(){ pick(id,true); }); row.appendChild(c); });
    sec.appendChild(row); chips.appendChild(sec);
  });
  function pick(id,fromList){
    map.mark([id],"on");
    [].forEach.call(chips.querySelectorAll(".t8-chip"),function(c){ c.classList.toggle("on",c.dataset.id===id); });
    info.innerHTML='<small>'+esc(areaOf(id))+'</small><b dir="auto">'+esc(label(id))+'</b><p>'+esc(T.info[id]||"")+'</p>';
    map.reveal(id);
    if(fromList) map.scrollIntoView({block:"nearest",behavior:"smooth"});
  }
  map.onPick=function(id){ pick(id,false); };
  tour.appendChild(bar); tour.appendChild(map); tour.appendChild(info); tour.appendChild(chips);
}

/* ---------- "where is it?" on button names ---------- */
var pop=null, pmap=null, ptxt=null;
function openPop(ids,name){
  if(!pop){
    pop=el("div","t8-pop"); pop.setAttribute("role","dialog"); pop.setAttribute("aria-label","איפה זה על הלוח");
    var inr=el("div","t8-pop-in"), head=el("div","t8-pop-h"), x=el("button","t8-x","✕"); x.type="button"; x.setAttribute("aria-label","סגירה");
    head.appendChild(el("b",null,"איפה זה על הלוח")); head.appendChild(x);
    pmap=makeMap(true); ptxt=el("div","t8-info");
    inr.appendChild(head); inr.appendChild(pmap); inr.appendChild(ptxt); pop.appendChild(inr); document.body.appendChild(pop);
    x.addEventListener("click",function(){ pop.hidden=true; });
    pop.addEventListener("click",function(e){ if(e.target===pop) pop.hidden=true; });
    document.addEventListener("keydown",function(e){ if(e.key==="Escape" && pop) pop.hidden=true; });
    pmap.onPick=function(id){ pmap.mark([id],"on"); ptxt.innerHTML='<small>'+esc(areaOf(id))+'</small><b dir="auto">'+esc(label(id))+'</b><p>'+esc(T.info[id]||"")+'</p>'; };
  }
  pop.hidden=false; pmap.mark(ids,"on");
  var h = ids.length===1
    ? '<small>'+esc(areaOf(ids[0]))+'</small><b dir="auto">'+esc(label(ids[0]))+'</b><p>'+esc(T.info[ids[0]]||"")+'</p>'
    : '<b dir="auto">'+esc(name)+'</b><p>יש '+ids.length+' כאלה, כולם מסומנים. גע באחד כדי לראות מה הוא עושה.</p>';
  ptxt.innerHTML=h;
  setTimeout(function(){ pmap.reveal(ids[0]); },30);
}
if(document.body.dataset.lesson || document.body.dataset.t8){
  [].forEach.call(document.querySelectorAll(".wrap kbd"),function(k){
    if(k.closest(".t8-map")) return;
    var t=k.textContent.trim(), ids=T.alias[t];
    if(!ids || !ids.length) return;
    k.classList.add("t8k"); k.tabIndex=0; k.setAttribute("role","button"); k.title="איפה זה על הלוח?";
    function go(e){ e.preventDefault(); openPop(ids,t); }
    k.addEventListener("click",go);
    k.addEventListener("keydown",function(e){ if(e.key==="Enter"||e.key===" ") go(e); });
  });
}
})();
