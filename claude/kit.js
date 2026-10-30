/* Lesson kit for the T-8 lessons (see kit.css). Runs after app.js and extras.js, before t8.js.
   - .combo[data-seq]   draws the button combination as action marks
   - .stage[data-mana]  a short session: header, start button, done mark in the table of contents
   - .playnow .timer    a five-minute timer
   Combination syntax: "tap:X,hold:Y,rel,turn:TEMPO/VALUE,look:P.50" (X = a button name or a step number). */
(function(){
"use strict";
var page=document.body.dataset.lesson||""; if(!page && !document.body.dataset.t8) return;
var DONE="ml2:done", NOTES="ml2:notes";
function get(k,d){ try{ var v=localStorage.getItem(k); return v==null?d:JSON.parse(v); }catch(e){ return d; } }
function set(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} }
function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];}); }
function el(tag,cls,html){ var e=document.createElement(tag); if(cls) e.className=cls; if(html!=null) e.innerHTML=html; return e; }

/* ---------- one-time move of progress and notes after a lesson was renumbered ---------- */
var MOVES={"6":{"0.1":"1.1","1.1":"1.2","1.2":"1.3","1.3":"1.4","5.5":"5.3","5.3":"6.1","5.4":"6.2","5.6":"6.3","7.1":"7.2"}};
(function migrate(){
  var m=MOVES[page], flag="ml2:moved:l"+page+":v2"; if(!m || get(flag,0)) return;
  [DONE,NOTES].forEach(function(key){
    var all=get(key,{}), out={};
    Object.keys(all).forEach(function(id){
      var p=id.split(":"); if(p[0]==="l"+page && m[p[1]]) out["l"+page+":"+m[p[1]]]=all[id]; else if(!(id in out)) out[id]=all[id];
    });
    set(key,out);
  });
  try{ localStorage.removeItem("ml2:pos:l"+page); }catch(e){}
  set(flag,1);
})();

/* ---------- the combination strip ---------- */
var VERB={hold:["✋","החזק"],tap:["👆","לחץ"],turn:["⟳","סובב"]};
function parse(seq){ return seq.split(",").map(function(s){ var i=s.indexOf(":"); return i<0?{a:s.trim()}:{a:s.slice(0,i).trim(),k:s.slice(i+1).trim()}; }); }
function seg(t){
  var cells=[];
  for(var i=0;i<t.length;i++){ var ch=t[i];
    if(ch==="." && cells.length && !cells[cells.length-1][1]) cells[cells.length-1][1]=".";
    else cells.push([ch===" "?"":ch,""]); }
  while(cells.length<4) cells.unshift(["",""]);
  return '<span class="seg" role="img" aria-label="בתצוגה: '+esc(t)+'">'+cells.map(function(c){ return '<span class="c"><b>8.</b><i>'+esc(c[0]+c[1])+'</i></span>'; }).join("")+'</span>';
}
function chip(st){
  if(st.a==="rel") return '<span class="a a-rel"><i>🖐</i>שחרר</span>';
  if(st.a==="look") return '<span class="a a-look">'+seg(st.k)+'</span>';
  if(st.a==="ear") return '<span class="a a-ear"><i>👂</i>הקשב</span>';   /* turn and listen: there is no single right value */
  if(st.a==="say") return '<span class="a a-say">'+esc(st.k)+'</span>';    /* a short note, when the display text is unknown */
  var v=VERB[st.a]; if(!v) return "";
  /* "@step:16" = any step, 16 is only the example (written under the strip on map.html) */
  var ANY={step:"צעד",num:"מספר",bank:"1 עד 4",drum:"כלי",inst:"כלי",mem:"1 עד 8",vco:"VCO 1/2/3",vel:"VEL",pitch:"PITCH"}, any=/^@(\w+):/.exec(st.k||"");
  var KW=({vb:"קליד",cr:"קליד"})[document.body.dataset.panel]||"לחצן";   /* Volca Bass and Crave: the step buttons are keys */
  var name=any?(/^(vco|vel|pitch)$/.test(any[1])?"":KW+' ')+'<kbd class="any">'+ANY[any[1]]+'</kbd>':/^\d+$/.test(st.k)?KW+' <kbd>'+esc(st.k)+'</kbd>':'<kbd>'+esc(st.k)+'</kbd>';
  return '<span class="a a-'+st.a+'"><i>'+v[0]+'</i>'+v[1]+' '+name+(st.n>1?' <b>×'+st.n+'</b>':'')+'</span>';
}
function strip(seq){
  var raw=parse(seq), steps=[];
  raw.forEach(function(st){ var last=steps[steps.length-1];
    if(last && st.a==="tap" && last.a==="tap" && last.k===st.k) last.n=(last.n||1)+1; else steps.push({a:st.a,k:st.k}); });
  /* Every step is a piece (.pr) with the arrow that leads into it, so a line never ends with a lone arrow.
     A hold opens a group that lasts until the release. A turn and what it should show (look/say/ear) wrap together (.prg). */
  var out=[], i=0, first=true;
  function arr(){ var a=first?'':'<span class="to">←</span>'; first=false; return a; }
  while(i<steps.length){
    var st=steps[i];
    if(st.a==="hold"){
      var a=arr(), g='<span class="grp"><small>כל עוד מחזיקים</small>'+chip(st); i++;
      while(i<steps.length && steps[i].a!=="rel"){ g+='<span class="to">←</span>'+chip(steps[i]); i++; }
      out.push('<span class="pr">'+a+g+'</span></span>');
      continue;
    }
    var p='<span class="pr">'+arr()+chip(st)+'</span>'; i++;
    if(st.a==="turn" && i<steps.length && /^(look|say|ear)$/.test(steps[i].a)){
      p='<span class="prg">'+p+'<span class="pr">'+arr()+chip(steps[i])+'</span></span>'; i++;
    }
    out.push(p);
  }
  return '<div class="row">'+out.join("")+'</div>';
}
[].forEach.call(document.querySelectorAll(".combo[data-seq]"),function(c){
  if(c.dataset.hide){ c.hidden=true; return; }
  c.innerHTML='<span class="ch">'+esc(c.dataset.title||"הצירוף, לפי הסדר")+'</span>'+strip(c.dataset.seq);
});

/* ---------- sessions ---------- */
var stages=[].slice.call(document.querySelectorAll(".stage[data-mana]"));
var total=stages.length;
function cardsOf(s){ return [].slice.call(s.querySelectorAll(".card[data-id]")); }
function manaDone(s){ var d=get(DONE,{}), c=cardsOf(s); return c.length>0 && c.every(function(x){ return d[x.dataset.id]; }); }
function paintMana(){
  var firstOpen=null;
  stages.forEach(function(s){
    var ok=manaDone(s), head=s.querySelector(".mana-head");
    if(head){ head.classList.toggle("done",ok); head.querySelector(".mh-ok").hidden=!ok; }
    var li=document.querySelector('.toc a[href="#'+s.id+'"]'); if(li) li.parentNode.classList.toggle("mana-done",ok);
    if(!ok && !firstOpen) firstOpen=s;
  });
  var nx=document.getElementById("mana-next");
  if(nx){ if(firstOpen){ nx.hidden=false; nx.href="#"+firstOpen.id; nx.textContent="← למנה הבאה: "+firstOpen.dataset.title; } else nx.hidden=true; }
}
stages.forEach(function(s,i){
  var head=el("div","mana-head");
  head.innerHTML='<div class="mh-t"><b>מנה '+(i+1)+' מתוך '+total+' · כ־'+esc(s.dataset.min||"10")+' דקות</b><small>'+esc(s.dataset.goal||"")+'</small></div>'+
    '<span class="mh-ok" hidden>✓ סיימת</span>';
  var go=el("button","btn","▶ להתחיל את המנה"); go.type="button";
  go.addEventListener("click",function(){ var b=s.querySelector(".cardplay"); if(b) b.click(); else s.scrollIntoView(); });
  head.appendChild(go);
  var tag=s.querySelector(".stage-tag"); (tag||s.firstChild).insertAdjacentElement(tag?"afterend":"beforebegin",head);
});
if(total){ paintMana(); document.addEventListener("click",function(e){ if(e.target.closest(".donebtn,.pm-done")) setTimeout(paintMana,50); }); }

/* ---------- five-minute timer ---------- */
[].forEach.call(document.querySelectorAll(".playnow .timer"),function(t){
  var mins=+(t.dataset.min||5), left=mins*60, iv=null;
  var shown=el("span","t"), b=el("button","btn"); b.type="button";
  function fmt(){ var m=Math.floor(left/60), s=left%60; shown.textContent=m+":"+(s<10?"0":"")+s; }
  function paint(){ b.textContent=iv?"⏸ עצירה":(left<mins*60&&left>0?"▶ להמשיך":"▶ "+mins+" דקות של נגינה"); fmt(); }
  b.addEventListener("click",function(){
    if(iv){ clearInterval(iv); iv=null; paint(); return; }
    if(left<=0) left=mins*60;
    var wb=document.getElementById("wake"); if(wb && !wb.hidden && !wb.dataset.want) wb.click();
    iv=setInterval(function(){ left--; if(left<=0){ clearInterval(iv); iv=null; left=0; shown.textContent="0:00"; b.textContent="✓ הזמן נגמר"; return; } fmt(); },1000);
    paint();
  });
  t.appendChild(b); t.appendChild(shown); paint();
});

})();
