/* Back button on every Claude page except the home.
   Goes back to the page you came from, at the same scroll spot (and the same view on map.html).
   Works in the home-screen app too, where there is no browser back button. */
(function(){
"use strict";
function sget(k){ try{ return sessionStorage.getItem(k); }catch(e){ return null; } }
function sset(k,v){ try{ sessionStorage.setItem(k,v); }catch(e){} }
function sdel(k){ try{ sessionStorage.removeItem(k); }catch(e){} }
function page(p){ return (p||"").split("/").pop() || "index.html"; }

var here=page(location.pathname);
var L=document.body.dataset.lesson;
if(L){ try{ localStorage.setItem("ml2:last",JSON.stringify({l:L,t:Date.now()})); }catch(e){} }

/* where did we come from: a Claude page in this folder, not this same page */
var isRet=sget("ret")===here;
var back=null;
if(!isRet) try{
  var r=new URL(document.referrer);
  var dir=location.pathname.replace(/[^\/]*$/,"");
  if(r.origin===location.origin && r.pathname.replace(/[^\/]*$/,"")===dir && page(r.pathname)!==here) back=page(r.pathname);
}catch(e){}
/* keep it across reloads and hash jumps inside the page */
if(back) sset("back:"+here,back); else back=sget("back:"+here);
if(back==="index.html") back=null;

var LESSON={"1":"וולקות 1","2":"וולקות 2","3":"וולקות 3","4":"טי־8 שיעור 1","5":"טי־8 שיעור 2","6":"טי־8 שיעור 3","7":"טי־8 שיעור 4"};
var NAMES={"map.html":"למה אפשר לעשות","settings.html":"למה נשמר","notebook.html":"לפנקס","glossary.html":"למילון"};
var label, target;
if(back){
  var m=back.match(/^lesson-(\d)\.html$/);
  label="→ חזרה "+(NAMES[back]||(m?"ל"+LESSON[m[1]]:""));
  target=back;
}else{ label="⌂ הבית"; target="index.html"; }

var b=document.createElement("a");
b.className="backbtn"; b.href=target; b.textContent=label.trim();
document.body.appendChild(b);

/* A direct link to another card on THIS page (a.xref href="#..."): the back button first returns to where you tapped,
   e.g. "→ חזרה ל־3.4". Each jump is one history step, so history.back() undoes it; we restore the exact spot. */
var jumps=[], pending=null;
function paint(){
  if(jumps.length){ b.textContent="→ חזרה ל"+jumps[jumps.length-1].lbl; b.href="#"; }
  else{ b.textContent=label.trim(); b.href=target; }
}
document.addEventListener("click",function(e){
  var a=e.target.closest&&e.target.closest('a.xref[href^="#"]'); if(!a) return;
  var c=a.closest(".card"), n=c&&c.querySelector(".card-head .num");
  jumps.push({y:window.scrollY, from:location.hash, lbl:n?"־"+n.textContent.trim():"מקום הקודם"});
  paint();
});
b.addEventListener("click",function(e){
  if(!jumps.length){ sset("ret",target); return; }
  e.preventDefault(); pending=jumps.pop().y; paint(); history.back();
});
window.addEventListener("popstate",function(){
  if(pending===null){  // the jump itself also fires popstate; only a return to where we jumped from counts
    if(jumps.length && location.hash===jumps[jumps.length-1].from){ jumps.pop(); paint(); }
    return;
  }
  var y=pending; pending=null;
  window.scrollTo(0,y); requestAnimationFrame(function(){ window.scrollTo(0,y); });
});

/* remember where we are on this page, so a "back" to it lands in the same spot */
window.addEventListener("pagehide",function(){ sset("pos:"+here,String(Math.round(window.scrollY))); });

/* arrived through a back button: restore the spot */
if(isRet && !location.hash){
  sdel("ret");
  var y=+(sget("pos:"+here)||0);
  if(y){
    if("scrollRestoration" in history) history.scrollRestoration="manual";
    var go=function(){ window.scrollTo(0,y); };
    go(); requestAnimationFrame(go); setTimeout(go,120); window.addEventListener("load",function(){ setTimeout(go,30); });
  }
}
})();
