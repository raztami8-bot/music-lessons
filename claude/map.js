/* map.html: done marks, the two views, and "by button" on the panel diagram. Needs t8-data.js. */
(function(){
"use strict";
function get(k,d){ try{ var v=localStorage.getItem(k); return v==null?d:JSON.parse(v); }catch(e){ return d; } }
function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];}); }
var tricks=[].slice.call(document.querySelectorAll("#view-goal .trick"));

/* done marks from the lesson cards */
var done=get("ml2:done",{}), learned=0;
tricks.forEach(function(t){
  var keys=(t.dataset.cards||"").split(" ").filter(Boolean); if(!keys.length) return;
  var n=keys.filter(function(k){ return done[k]; }).length;
  if(n===keys.length){ t.classList.add("isdone"); learned++; } else if(n>0) t.classList.add("part");
});
var prog=document.getElementById("mp-prog");
if(prog) prog.textContent = learned ? "למדת "+learned+" מתוך "+tricks.length+"." : "עוד לא סימנת ״סיימתי״ בכרטיסים. כשתסמן, יופיע כאן ✓.";

/* counts on goal chips */
[].forEach.call(document.querySelectorAll(".gjump a"),function(a){
  var g=document.querySelector(a.getAttribute("href")); if(!g) return;
  var all=g.querySelectorAll(".trick").length, d=g.querySelectorAll(".trick.isdone").length;
  a.insertAdjacentHTML("beforeend",'<span class="cnt">'+(d?d+"/":"")+all+'</span>');
});

/* views */
var vg=document.getElementById("view-goal"), vb=document.getElementById("view-btn");
var bg=document.getElementById("mv-goal"), bb=document.getElementById("mv-btn");
function view(v){
  vg.hidden = v!=="goal"; vb.hidden = v!=="btn";
  bg.setAttribute("aria-selected", v==="goal"); bb.setAttribute("aria-selected", v==="btn");
  try{ sessionStorage.setItem("map-view",v); }catch(e){}
  if(v==="btn") initMap();
}
bg.addEventListener("click",function(){ view("goal"); });
bb.addEventListener("click",function(){ view("btn"); });

/* by button */
var ready=false, map=null;
function initMap(){
  if(ready) return; ready=true;
  var T=window.T8; if(!T) return;
  map=document.createElement("div"); map.className="t8-map"; map.dir="ltr"; map.innerHTML=T.svg;
  document.getElementById("mp-map").appendChild(map);
  var count={};
  tricks.forEach(function(t){ (t.dataset.ctl||"").split(" ").filter(Boolean).forEach(function(c){ count[c]=(count[c]||0)+1; }); });
  [].forEach.call(map.querySelectorAll(".ctl"),function(g){ if(!count[g.dataset.id]) g.style.opacity=".35"; });
  map.addEventListener("click",function(e){ var g=e.target.closest(".ctl"); if(g) pick(g.dataset.id); });
}
function pick(id){
  var T=window.T8;
  try{ sessionStorage.setItem("map-sel",id); }catch(e){}
  [].forEach.call(map.querySelectorAll(".ctl.on"),function(g){ g.classList.remove("on"); });
  var g=map.querySelector('.ctl[data-id="'+id+'"]'); if(g) g.classList.add("on");
  var hits=tricks.filter(function(t){ return (t.dataset.ctl||"").split(" ").indexOf(id)>-1; });
  var name=/^s\d+$/.test(id) ? "לחצן "+id.slice(1) : (T.names[id]||id);
  var sel=document.getElementById("mp-sel");
  sel.innerHTML='<b dir="auto">'+esc(name)+'</b><p>'+esc(T.info[id]||"")+'</p><p><b>'+(hits.length?hits.length+" דברים שאפשר לעשות איתו:":"אין לו כרגע טריק בשיעורים.")+'</b></p>';
  var list=document.getElementById("mp-list"); list.innerHTML="";
  hits.forEach(function(t){
    var c=t.cloneNode(true); c.removeAttribute("id");
    var goal=t.closest(".goal"); var tag=document.createElement("p"); tag.className="legend"; tag.style.margin="0";
    tag.textContent=goal?goal.querySelector("h2").textContent:""; c.insertBefore(tag,c.firstChild);
    list.appendChild(c);
  });
}

/* arrive on a trick from search: open the goal view and flash it */
function flashHash(){
  var h=location.hash; if(!h || h.indexOf("#t-")!==0) return;
  var t=document.querySelector(h); if(!t) return;
  view("goal"); t.classList.remove("flash"); void t.offsetWidth; t.classList.add("flash");
}
window.addEventListener("hashchange",flashHash);
var saved=null; try{ saved=sessionStorage.getItem("map-view"); }catch(e){}
if(location.hash.indexOf("#t-")===0) flashHash();
else if(saved==="btn"){ view("btn"); var ss=null; try{ ss=sessionStorage.getItem("map-sel"); }catch(e){} if(ss && map && map.querySelector('.ctl[data-id="'+ss+'"]')) pick(ss); }
})();
