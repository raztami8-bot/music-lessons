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
var NAMES={"map.html":"למה אפשר לעשות","notebook.html":"לפנקס","glossary.html":"למילון"};
var label, target;
if(back){
  var m=back.match(/^lesson-(\d)\.html$/);
  label="→ חזרה "+(NAMES[back]||(m?"ל"+LESSON[m[1]]:""));
  target=back;
}else{ label="⌂ הבית"; target="index.html"; }

var b=document.createElement("a");
b.className="backbtn"; b.href=target; b.textContent=label.trim();
b.addEventListener("click",function(){ sset("ret",target); });
document.body.appendChild(b);

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
