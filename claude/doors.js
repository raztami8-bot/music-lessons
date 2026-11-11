/* doors.js: one device in three doors. Learn (one card per screen), find (the board row by row), play (one mission at a time).
   Used by edge.html and crave.html. The page defines window.DOORS before loading this file:
     key      localStorage key
     panel    the object from <dev>-data.js: {svg, info, names, areas}
     bands    y values that split the board into rows, for cropping (a crop never spans two rows unless the groups line up)
     home     {knobs:{id:hour}, sw:{id:"POSITION"}, title, lead, quick:[...], note, groups:[[title, text, ids]]}
     he       {id:[hebrew name, kind, [[position, meaning]]]}
     learn    [{t, b, tr:[...], hear, back, ids, set, all, btn:[label,"home"|"play"]}]
     find     [{id, tab, y:[y0,y1], ids, intro} | {id, tab, hint, rows:[[title,text]]} | {id, tab, hint, links:[[href,title,note]]}]
     rowKey   optional: id on the board -> id of the row that explains it (the 8 steps share one row)
     rowText  optional: {id:{name, he, info}} to override a row
     cats     [[key,label]], catName {key:label}, play [{c, t, d:[...], ids, set, from, back, min}]
     setup    optional function(BASE, BOX), runs once on the board before anything is drawn
   In any text: {id} becomes the control's name as a button that opens it, [TEXT] becomes a label as printed on the board.
   Hours: 7 = all the way left, 5 = all the way right. */
(function(){
"use strict";
const D=window.DOORS, E=D.panel, $=s=>document.querySelector(s);
const st=(()=>{try{return JSON.parse(localStorage.getItem(D.key))||{}}catch(e){return {}}})();
const save=()=>{try{localStorage.setItem(D.key,JSON.stringify(st))}catch(e){}};
const HOME=D.home.knobs, HOMESW=D.home.sw||{};
const hour=h=>h===7?"עד הסוף שמאלה":h===5?"עד הסוף ימינה":"שעה "+h;
const he=id=>D.he[id]||[E.info[id]&&E.info[id].indexOf("יציאה")===0?"יציאה":"כניסה","שקע"];
const nm=id=>`<button class="en" data-c="${id}">${E.names[id]}</button>`;
const tx=s=>s.replace(/\{(\w+)\}/g,(m,id)=>E.names[id]?nm(id):m).replace(/\[([^\]]+)\]/g,'<span class="en">$1</span>');

/* ---------- the board, and crops of it ---------- */
const tpl=document.createElement("template"); tpl.innerHTML=E.svg;
const BASE=tpl.content.firstElementChild; BASE.classList.add("pnl");
const VB=BASE.getAttribute("viewBox").split(" ").map(Number), W=VB[2], HH=VB[3];
BASE.querySelectorAll(".ctl").forEach(g=>{const c=g.querySelector("circle"),l=[...g.querySelectorAll("line")].filter(x=>x.getAttribute("stroke-width")==="3").pop();
  if(c&&l){l.classList.add("ptr");l.style.transformOrigin=c.getAttribute("cx")+"px "+c.getAttribute("cy")+"px"}});
const BOX={};
BASE.querySelectorAll(".ctl").forEach(g=>{const r=g.querySelector(".hit");if(r)BOX[g.dataset.id]=[+r.getAttribute("x"),+r.getAttribute("y"),+r.getAttribute("width"),+r.getAttribute("height")]});
if(D.setup)D.setup(BASE,BOX);
function union(ids){let a=1e9,b=1e9,c=-1e9,d=-1e9;ids.forEach(i=>{const r=BOX[i];if(!r)return;a=Math.min(a,r[0]);b=Math.min(b,r[1]);c=Math.max(c,r[0]+r[2]);d=Math.max(d,r[1]+r[3])});return [a,b,c,d]}
const band=id=>{const y=BOX[id][1]+BOX[id][3]/2;let k=0;while(k<D.bands.length&&y>=D.bands[k])k++;return k};
function clusters(ids){
  ids=ids.filter(i=>BOX[i]);
  const rows={};ids.forEach(i=>{(rows[band(i)]=rows[band(i)]||[]).push(i)});
  let out=[];
  const split=g=>{g.sort((x,y)=>BOX[x][0]-BOX[y][0]);const u=union(g);if(u[2]-u[0]<=450||g.length<2)return [g];
    let best=1,bg=-1;const mid=g.length/2;
    for(let i=1;i<g.length;i++){const gap=BOX[g[i]][0]-(BOX[g[i-1]][0]+BOX[g[i-1]][2]);if(gap>bg+1||(Math.abs(gap-bg)<=1&&Math.abs(i-mid)<Math.abs(best-mid))){bg=gap;best=i}}
    return split(g.slice(0,best)).concat(split(g.slice(best)))};
  Object.keys(rows).sort().forEach(k=>{out=out.concat(split(rows[k]))});
  /* two groups that sit one above the other (the two knobs of a step, a knob and the switch under it) share one picture */
  for(let i=0;i<out.length;i++)for(let j=i+1;j<out.length;j++){const a=union(out[i]),b=union(out[j]);
    if(Math.abs(a[0]-b[0])<30&&Math.abs(a[2]-b[2])<30&&Math.abs(a[1]-b[1])<200){out[i]=out[i].concat(out[j]);out.splice(j,1);j--}}
  return out;
}
function setKnobs(svg,set){svg.querySelectorAll(".ptr").forEach(l=>{const id=l.closest(".ctl").dataset.id,h=set&&set[id];l.style.transform=h?`rotate(${(h%12)*30}deg)`:""})}
function mark(s,ids){ids.forEach(i=>{const g=s.querySelector(`.ctl[data-id="${i}"]`);if(g)g.classList.add("on")})}
function cropSvg(ids,set,minW){
  const s=BASE.cloneNode(true),u=union(ids),pad=26;minW=minW||290;
  let x=u[0]-pad,y=u[1]-pad,w=u[2]-u[0]+2*pad,h=u[3]-u[1]+2*pad;
  if(w<minW){x-=(minW-w)/2;w=minW} if(h<120){y-=(120-h)/2;h=120}
  x=Math.max(0,Math.min(x,W-w));y=Math.max(0,Math.min(y,HH-h));
  s.setAttribute("viewBox",[x,y,w,h].join(" "));s.classList.add("dim");mark(s,ids);setKnobs(s,set);return s;
}
function crops(ids,set){
  const box=document.createElement("div");box.className="crops";
  const add=s=>{const d=document.createElement("div");d.className="crop";d.appendChild(s);box.appendChild(d)};
  const cl=clusters(ids);
  if(cl.length>3){const s=BASE.cloneNode(true);s.classList.add("dim");mark(s,ids);setKnobs(s,set);add(s);return box}
  cl.forEach(g=>add(cropSvg(g,set)));
  return box;
}
document.addEventListener("click",e=>{
  const b=e.target.closest("[data-c]");if(b){openCtl(b.dataset.c);return}
  const g=e.target.closest(".crop .ctl");if(g)openCtl(g.dataset.id);
});

/* ---------- sheet: one control, or the home ---------- */
const shade=$("#shade"),sheet=$("#sheet");
function openSheet(build){sheet.innerHTML='<button class="x">✕ סגור</button>';build(sheet);shade.classList.add("on");sheet.scrollTop=0}
shade.addEventListener("click",e=>{if(e.target===shade||e.target.closest(".x"))shade.classList.remove("on")});
function ctlHtml(id){
  const h=he(id),o=(D.rowText||{})[id]||{};
  let s=`<div class="top"><span class="en">${o.name||E.names[id]}</span><span class="kind">${h[1]}</span></div><div class="he">${o.he||h[0]}</div><p>${o.info||E.info[id]||""}</p>`;
  if(h[2])s+=`<ul class="opts">${h[2].map(x=>`<li><b>${x[0]}</b><span>${x[1]}</span></li>`).join("")}</ul>`;
  if(HOME[id]!==undefined)s+=`<span class="athome">🏠 בבית: ${hour(HOME[id])}</span>`;
  else if(HOMESW[id])s+=`<span class="athome">🏠 בבית: <span class="en">${HOMESW[id]}</span></span>`;
  return s;
}
const rowKey=id=>D.rowKey?D.rowKey(id):id;
function openCtl(id){if(!E.names[id])return;openSheet(el=>{
  const d=document.createElement("div");d.className="crop";d.appendChild(cropSvg([id],HOME,300));el.appendChild(d);
  const r=document.createElement("div");r.className="row";r.innerHTML=ctlHtml(rowKey(id));el.appendChild(r);
})}
function openHome(){const h=D.home;openSheet(el=>{
  el.insertAdjacentHTML("beforeend",`<h2>${h.title}</h2><p class="lead">${tx(h.lead)}</p>
  <div class="box hear"><strong class="h">${h.quickTitle||"אין זמן? שלושה צעדים"}</strong><ol>${h.quick.map(q=>`<li>${tx(q)}</li>`).join("")}</ol></div>
  <p class="back">${tx(h.note)}</p>`);
  h.groups.forEach(g=>{const d=document.createElement("div");d.className="grp";
    d.innerHTML=`<h3>${g[0]}</h3><p class="sw">${tx(g[1])}</p>`;
    if(g[2]&&g[2].length){d.appendChild(crops(g[2],HOME));
      if(g[2].length<8)d.insertAdjacentHTML("beforeend",`<div class="dials">${g[2].filter(i=>HOME[i]!==undefined).map(i=>`<span><span class="en">${E.names[i]}</span> <b>${hour(HOME[i])}</b></span>`).join("")}</div>`)}
    el.appendChild(d)});
})}
$("#homebtn").onclick=openHome;
const act={home:openHome,play:()=>go("play"),find:()=>go("find")};

/* ---------- 1. learn ---------- */
const L=D.learn;
let li=Math.min(st.learn||0,L.length-1);
function drawLearn(){
  const c=L[li],el=$("#learn");el.innerHTML="";
  $("#prog").innerHTML=L.map((x,i)=>`<i class="${i<=li?"d":""}"></i>`).join("");
  el.insertAdjacentHTML("beforeend",`<span class="count">${li+1} / ${L.length}</span><h2>${c.t}</h2>`);
  if(c.all){const d=document.createElement("div");d.className="crop";d.appendChild(BASE.cloneNode(true));el.appendChild(d)}
  else if(c.ids)el.appendChild(crops(c.ids,c.set));
  if(c.b)el.insertAdjacentHTML("beforeend",`<p class="lead">${tx(c.b)}</p>`);
  if(c.tr)el.insertAdjacentHTML("beforeend",`<div class="box"><strong class="h">👆 נסה</strong><ol>${c.tr.map(x=>`<li>${tx(x)}</li>`).join("")}</ol></div>`);
  if(c.hear)el.insertAdjacentHTML("beforeend",`<div class="box hear"><strong class="h">${c.hearT||"👂 שומעים"}</strong>${tx(c.hear)}</div>`);
  if(c.btn){const b=document.createElement("button");b.className="big";b.textContent=c.btn[0];b.onclick=act[c.btn[1]];el.appendChild(b)}
  if(c.back)el.insertAdjacentHTML("beforeend",`<p class="back">${tx(c.back)}</p>`);
  $("#prev").disabled=li===0;$("#next").disabled=li===L.length-1;
  $("#learnScroll").scrollTop=0;st.learn=li;save();
}
const step=d=>{const n=li+d;if(n<0||n>=L.length)return;li=n;drawLearn()};
$("#prev").onclick=()=>step(-1);$("#next").onclick=()=>step(1);
(()=>{let x0=null,y0=0;const s=$("#learnScroll");
  s.addEventListener("touchstart",e=>{x0=e.touches[0].clientX;y0=e.touches[0].clientY},{passive:true});
  s.addEventListener("touchend",e=>{if(x0===null)return;const dx=e.changedTouches[0].clientX-x0,dy=e.changedTouches[0].clientY-y0;x0=null;
    if(Math.abs(dx)>60&&Math.abs(dx)>2*Math.abs(dy))step(dx>0?1:-1)},{passive:true})})();

/* ---------- 2. find ---------- */
const F=D.find;
let fi=Math.max(0,F.findIndex(f=>f.id===st.find));
F.forEach((f,i)=>{const b=document.createElement("button");b.className="chip";b.textContent=f.tab;b.onclick=()=>{fi=i;drawFind()};$("#chips").appendChild(b)});
const qa=(t,a)=>`<div class="row"><div class="he">${t}</div><p>${tx(a)}</p></div>`;
const plain=s=>tx(s).replace(/<[^>]+>/g,"");
function drawFind(q){
  const f=F[fi],el=$("#find");el.innerHTML="";st.find=f.id;save();
  [...$("#chips").children].forEach((b,i)=>b.setAttribute("aria-selected",i===fi&&!q));
  const s=document.createElement("input");s.className="search";s.type="search";s.placeholder="חיפוש: שם של כפתור, או מה רוצים לעשות";s.value=q||"";
  s.oninput=()=>{const v=s.value.trim();drawFind(v||undefined);const n=$("#find .search");n.focus();n.setSelectionRange(n.value.length,n.value.length)};
  el.appendChild(s);
  if(q){const k=q.toLowerCase(),hit=x=>x.toLowerCase().indexOf(k)>=0;
    const skip=D.noRow||{};
    const ids=Object.keys(E.names).filter(i=>!skip[i]&&rowKey(i)===i&&(hit(E.names[i])||hit(he(i)[0])||hit(E.info[i]||"")));
    let rc=[];F.forEach(x=>{if(x.rows)rc=rc.concat(x.rows.filter(r=>hit(r[0])||hit(plain(r[1]))))});
    if(!ids.length&&!rc.length)el.insertAdjacentHTML("beforeend",`<p class="hint">לא נמצא. אפשר לחפש באנגלית כמו על הלוח, או בעברית.</p>`);
    rc.forEach(r=>el.insertAdjacentHTML("beforeend",qa(r[0],r[1])));
    ids.slice(0,30).forEach(i=>{const b=document.createElement("button");b.className="row";b.dataset.c=i;b.innerHTML=ctlHtml(i);el.appendChild(b)});
    return}
  if(f.rows){el.insertAdjacentHTML("beforeend",`<p class="hint">${tx(f.hint||"")}</p>`+f.rows.map(r=>qa(r[0],r[1])).join(""));$("#findScroll").scrollTop=0;return}
  if(f.links){el.insertAdjacentHTML("beforeend",`<p class="hint">${f.hint||""}</p><div class="links">${f.links.map(m=>`<a href="${m[0]}"><span>${m[1]}</span><small>${m[2]}</small></a>`).join("")}</div>`);$("#findScroll").scrollTop=0;return}
  const bd=document.createElement("div");bd.className="band";const sv=BASE.cloneNode(true),h=f.y[1]-f.y[0];
  sv.setAttribute("viewBox",`0 ${f.y[0]} ${W} ${h}`);sv.setAttribute("width",W);sv.setAttribute("height",h);
  if(window.innerWidth>=W+40){sv.removeAttribute("width");sv.removeAttribute("height");sv.style.width="100%"}
  setKnobs(sv,HOME);bd.appendChild(sv);el.appendChild(bd);
  el.insertAdjacentHTML("beforeend",`<p class="hint">${tx(f.intro)} גוללים הצידה, ונוגעים בכפתור.</p>`);
  const rows={};
  f.ids.forEach(i=>{const r=document.createElement("div");r.className="row";r.innerHTML=ctlHtml(i);rows[i]=r;el.appendChild(r)});
  sv.addEventListener("click",e=>{const g=e.target.closest(".ctl");if(!g)return;const id=g.dataset.id;
    sv.querySelectorAll(".pick").forEach(x=>x.classList.remove("pick"));g.classList.add("pick");
    const r=rows[rowKey(id)];
    el.querySelectorAll(".row.pick").forEach(x=>x.classList.remove("pick"));
    if(r){r.classList.add("pick");r.scrollIntoView({block:"center",behavior:"smooth"})}else openCtl(id)});
  $("#findScroll").scrollTop=0;
}

/* ---------- 3. play ---------- */
const M=D.play,CN=D.catName;
st.done=st.done||{};let cat=st.cat||"all",mi=st.mi,bag=[];
D.cats.forEach(c=>{const b=document.createElement("button");b.className="chip";b.textContent=c[1];b.dataset.k=c[0];b.onclick=()=>{cat=c[0];st.cat=cat;bag=[];roll()};$("#cats").appendChild(b)});
const pool=()=>M.map((m,i)=>i).filter(i=>cat==="all"||M[i].c===cat);
function roll(){
  if(!bag.length){bag=pool().filter(i=>i!==mi);const fresh=bag.filter(i=>!st.done[i]);if(fresh.length)bag=fresh;
    for(let i=bag.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]]}}
  if(bag.length)mi=bag.pop();drawPlay();
}
let tick=null;
function stopTimer(){clearInterval(tick);tick=null;const b=$("#timer"),m=M[mi]&&M[mi].min||1;b.className="timer";b.textContent="⏱ "+(m===1?"דקה":m+" דקות")}
$("#timer").onclick=()=>{const b=$("#timer");if(tick||b.classList.contains("end")){stopTimer();return}
  let s=(M[mi].min||1)*60;const show=()=>{b.textContent="⏱ "+Math.floor(s/60)+":"+String(s%60).padStart(2,"0")};b.classList.add("run");show();
  tick=setInterval(()=>{s--;if(s<=0){clearInterval(tick);tick=null;b.className="timer end";b.textContent="✓ נגמר הזמן"}else show()},1000)};
$("#ok").onclick=()=>{if(st.done[mi])delete st.done[mi];else st.done[mi]=1;save();drawPlay(true)};
$("#dice").onclick=roll;
function drawPlay(keep){
  if(mi===undefined||!M[mi]||(cat!=="all"&&M[mi].c!==cat)){mi=undefined;roll();return}
  const m=M[mi],el=$("#play");el.innerHTML="";st.mi=mi;save();if(!keep)stopTimer();
  [...$("#cats").children].forEach(b=>b.setAttribute("aria-selected",b.dataset.k===cat));
  el.insertAdjacentHTML("beforeend",`<span class="tag">${CN[m.c]}</span><h2>${m.t}</h2><p class="from">מתחילים מ: ${tx(m.from||"🏠 הבית")}</p>`);
  if(m.ids)el.appendChild(crops(m.ids,m.set));
  el.insertAdjacentHTML("beforeend",`<div class="box"><ol>${m.d.map(x=>`<li>${tx(x)}</li>`).join("")}</ol></div>`);
  if(m.back)el.insertAdjacentHTML("beforeend",`<p class="back">חזרה: ${tx(m.back)}</p>`);
  const p=pool(),n=p.filter(i=>st.done[i]).length;
  el.insertAdjacentHTML("beforeend",`<p class="tally">עשית ${n} מתוך ${p.length}</p>`);
  const ok=$("#ok");ok.classList.toggle("on",!!st.done[mi]);ok.textContent=st.done[mi]?"✓ נעשה":"✓ עשיתי";
  if(!keep)$("#playScroll").scrollTop=0;
}

/* ---------- tabs ---------- */
function go(v){st.tab=v;save();
  document.querySelectorAll(".view").forEach(x=>x.classList.toggle("on",x.id==="v-"+v));
  document.querySelectorAll(".tabs button").forEach(b=>b.setAttribute("aria-selected",b.dataset.v===v));
  if(v==="learn")drawLearn();else if(v==="find")drawFind();else drawPlay();
}
document.querySelectorAll(".tabs button").forEach(b=>b.onclick=()=>go(b.dataset.v));
go(/^#(learn|find|play)$/.test(location.hash)?location.hash.slice(1):(st.tab||"learn"));
window.DOORS_TEST={M:M,L:L,show:i=>{mi=i;cat="all";drawPlay()},card:i=>{li=i;drawLearn()}};
})();
