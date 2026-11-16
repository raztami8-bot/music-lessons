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
     names    optional: {id:name} to replace names from the panel (when the board prints the same word on several knobs)
     find tabs with a board may also give x:[x0,x1]: a column of the board instead of a full row
     a find tab may give deep:[{sec, t, p:[paragraphs], ids, set, tr:[...], hear, rows:[[term,text]], back}] instead: one long explanation per screen,
       with prev/next and a list of topics; its links (if any) come on the last card
     a find tab may give bands:[{t, y:[y0,y1], x, ids, intro}] instead: several parts of the board one under the other in one tab,
       with a row of jump buttons that stays on top (the whole board as one tab: jacks, rows, sequencer)
     a find tab may give mine:true (and a hint) instead: "my sounds", for a device with no memory. A sound is a name, and only what differs
       from the home: knob hours, switch positions, cables, a note. Touch a control on the board and choose. Saved under st.mine (a draft under st.draft).
   archive  optional: {label, title, hint, links:[[href,title,note]]}: a quiet button at the end of every find tab (pages with three doors)
   The learn door has a "☰ all the cards" button (a list in a sheet); the deep door opens on a menu of all its topics by subject (sec),
       and each card has "☰ all the topics" to come back. Prev/next stay as a shortcut only. (Raz, 2026-11-13: "not like a computer game where I press next".)
   deep.top optional: the name of a group (sec) that the menu shows first
   deep     optional, with <section id="v-deep"> and a fourth tab button in the page: {cards:[...as in a deep find tab], archive:{label, title, hint, links:[[href,title,note]]}}
       a fourth door for the long explanations. The archive (older pages of this device) opens from a quiet button under every card.
   cats     [[key,label]], catName {key:label}, play [{c, t, d:[...], ids, set, from, back, min}]
     setup    optional function(BASE, BOX), runs once on the board before anything is drawn
   In any text: {id} becomes the control's name as a button that opens it, [TEXT] becomes a label as printed on the board.
   Hours: 7 = all the way left, 5 = all the way right. */
(function(){
"use strict";
const D=window.DOORS, $=s=>document.querySelector(s);
const E=Object.assign({},D.panel,{names:Object.assign({},D.panel.names,D.names||{})});
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
  /* too many pictures: join the two groups that make the smallest picture together, as long as it stays readable on a phone */
  while(out.length>3){let bi=-1,bj=-1,ba=1e12;
    for(let i=0;i<out.length;i++)for(let j=i+1;j<out.length;j++){const u=union(out[i].concat(out[j])),w=u[2]-u[0],h=u[3]-u[1];
      if(w<=470&&h<=340&&w*h<ba){ba=w*h;bi=i;bj=j}}
    if(bi<0)break;out[bi]=out[bi].concat(out[bj]);out.splice(bj,1)}
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
  if(cl.length>4){const s=BASE.cloneNode(true);s.classList.add("dim");mark(s,ids);setKnobs(s,set);add(s);return box}
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
const act={home:openHome,play:()=>go("play"),find:()=>go("find"),deep:()=>go("deep")};

/* ---------- 1. learn ---------- */
const L=D.learn;
let li=Math.min(st.learn||0,L.length-1);
function drawLearn(){
  const c=L[li],el=$("#learn");el.innerHTML="";
  $("#prog").innerHTML=L.map((x,i)=>`<i class="${i<=li?"d":""}"></i>`).join("");
  const mb=document.createElement("button");mb.className="menubtn";mb.textContent=`☰ כל הכרטיסים · ${li+1} / ${L.length}`;
  mb.onclick=()=>openSheet(sh=>{sh.insertAdjacentHTML("beforeend",`<h2>${D.learnTitle||"הבסיס: כל הכרטיסים"}</h2><p class="lead">נוגעים בכרטיס וקופצים אליו. אין חובה ללכת לפי הסדר.</p>`);
    L.forEach((x,i)=>{const b=document.createElement("button");b.className="row pickrow"+(i===li?" cur":"");b.innerHTML=`<span class="n">${i+1}</span><span>${x.t}</span>`;
      b.onclick=()=>{shade.classList.remove("on");li=i;drawLearn()};sh.appendChild(b)})});
  el.appendChild(mb);el.insertAdjacentHTML("beforeend",`<h2>${c.t}</h2>`);
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
    F.forEach((x,xi)=>{if(x.deep)x.deep.forEach((c,ci)=>{if(hit(c.t)||(c.p||[]).some(t=>hit(plain(t)))){
      const bt=document.createElement("button");bt.className="row";bt.innerHTML=`<div class="he">📚 ${c.t}</div><p>${x.tab}</p>`;
      bt.onclick=()=>{st.deep=ci;fi=xi;drawFind()};el.appendChild(bt)}})});
    F.forEach((x,xi)=>{if(x.mine)(st.mine||[]).forEach((pt,pi)=>{if(hit(pt.n)||hit(pt.t||"")){
      const bt=document.createElement("button");bt.className="row";bt.innerHTML=`<div class="he">⭐ ${esc(pt.n)}</div><p>${x.tab}</p>`;
      bt.onclick=()=>{mineView=pi;ed=null;fi=xi;drawFind()};el.appendChild(bt)}})});
    if(D.deep)D.deep.cards.forEach((c,ci)=>{if(hit(c.t)||(c.p||[]).some(t=>hit(plain(t)))){
      const bt=document.createElement("button");bt.className="row";bt.innerHTML=`<div class="he">📚 ${c.t}</div><p>להעמיק</p>`;
      bt.onclick=()=>{st.deep=ci;deepMenu=false;go("deep")};el.appendChild(bt)}});
    ids.slice(0,30).forEach(i=>{const b=document.createElement("button");b.className="row";b.dataset.c=i;b.innerHTML=ctlHtml(i);el.appendChild(b)});
    return}
  if(f.mine){drawMine(f,el);return}
  if(f.deep){drawDeep(f,el);return}
  if(f.rows){el.insertAdjacentHTML("beforeend",`<p class="hint">${tx(f.hint||"")}</p>`+f.rows.map(r=>qa(r[0],r[1])).join(""));archBtn(el);$("#findScroll").scrollTop=0;return}
  if(f.links){el.insertAdjacentHTML("beforeend",`<p class="hint">${f.hint||""}</p><div class="links">${f.links.map(m=>`<a href="${m[0]}"><span>${m[1]}</span><small>${m[2]}</small></a>`).join("")}</div>`);$("#findScroll").scrollTop=0;return}
  if(f.bands){
    const jump=document.createElement("div");jump.className="jump";el.appendChild(jump);const rows={};
    f.bands.forEach(b=>{const h=document.createElement("h3");h.textContent=b.t;el.appendChild(h);
      const j=document.createElement("button");j.textContent=b.t;j.onclick=()=>{$("#findScroll").scrollTop+=h.getBoundingClientRect().top-jump.getBoundingClientRect().bottom-6};jump.appendChild(j);
      drawBand(b,el,rows)});
  }else drawBand(f,el,{});
  archBtn(el);$("#findScroll").scrollTop=0;
}
/* the archive (older pages of this device): a quiet button that opens a list */
function archBtn(el,a){a=a||D.archive;if(!a)return;const b=document.createElement("button");b.className="arch";b.textContent=a.label;
  b.onclick=()=>openSheet(sh=>sh.insertAdjacentHTML("beforeend",`<h2>${a.title}</h2><p class="lead">${a.hint}</p><div class="links">${a.links.map(m=>`<a href="${m[0]}"><span>${m[1]}</span><small>${m[2]}</small></a>`).join("")}</div>`));
  el.appendChild(b)}
/* one part of the board: the picture, and a row for every control in it */
function drawBand(f,el,rows){
  const bd=document.createElement("div");bd.className="band";const sv=BASE.cloneNode(true),h=f.y[1]-f.y[0];
  const x0=f.x?f.x[0]:0,w=f.x?f.x[1]-f.x[0]:W;
  sv.setAttribute("viewBox",`${x0} ${f.y[0]} ${w} ${h}`);sv.setAttribute("width",w);sv.setAttribute("height",h);
  const fit=w<=460||window.innerWidth>=w+40;
  if(fit){sv.removeAttribute("width");sv.removeAttribute("height");sv.style.width="100%"}
  setKnobs(sv,HOME);bd.appendChild(sv);el.appendChild(bd);
  el.insertAdjacentHTML("beforeend",`<p class="hint">${tx(f.intro)} ${fit?"נוגעים בכפתור.":"גוללים הצידה, ונוגעים בכפתור."}</p>`);
  f.ids.forEach(i=>{const r=document.createElement("div");r.className="row";r.innerHTML=ctlHtml(i);rows[i]=r;el.appendChild(r)});
  sv.addEventListener("click",e=>{const g=e.target.closest(".ctl");if(!g)return;const id=g.dataset.id;
    el.querySelectorAll(".band .pick").forEach(x=>x.classList.remove("pick"));g.classList.add("pick");
    const r=rows[rowKey(id)];
    el.querySelectorAll(".row.pick").forEach(x=>x.classList.remove("pick"));
    if(r){r.classList.add("pick");r.scrollIntoView({block:"center",behavior:"smooth"})}else openCtl(id)});
}


/* ---------- my sounds (a find tab with mine:true): what differs from the home, by touching the board ---------- */
const esc=t=>String(t).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const isKnob=id=>!!BASE.querySelector(`.ctl[data-id="${id}"] .ptr`);
const isJack=id=>he(id)[1]==="שקע", isOut=id=>(E.info[id]||"").indexOf("יציאה")===0;
const HRS=[7,8,9,10,11,12,1,2,3,4,5];
let mineView=null,ed=st.draft||null;
const pk=p=>Object.assign({},HOME,p.k);
const pIds=p=>Object.keys(E.names).filter(i=>p.k[i]!==undefined||p.s[i]!==undefined||p.c.some(c=>c[0]===i||c[1]===i));
const sum=p=>{const n=Object.keys(p.k).length+Object.keys(p.s).length,c=p.c.length;
  return (n===1?"שינוי אחד":n+" שינויים")+(c?" · "+(c===1?"כבל אחד":c+" כבלים"):"")};
/* the lines of a sound, in the order of the board. name(id) draws the control's name */
function pLines(p,name){const a=[];
  Object.keys(E.names).forEach(i=>{if(p.k[i]!==undefined)a.push([i,`${name(i)} <b class="hr">${hour(p.k[i])}</b>`]);
    if(p.s[i]!==undefined)a.push([i,`מתג ${name(i)} על <span class="en">${esc(p.s[i])}</span>`])});
  p.c.forEach((c,n)=>a.push(["c"+n,`🔌 כבל מ־${name(c[0])} אל ${name(c[1])}`]));return a}
function drawMine(f,el){
  const P=st.mine=st.mine||[],sc=$("#findScroll");
  if(ed){drawEdit(f,el);return}
  if(mineView!==null&&P[mineView]){const p=P[mineView];
    const mb=document.createElement("button");mb.className="menubtn";mb.textContent="☰ כל הצלילים שלי";mb.onclick=()=>{mineView=null;drawFind()};el.appendChild(mb);
    el.insertAdjacentHTML("beforeend",`<h2>${esc(p.n)}</h2><p class="from">מתחילים מ: 🏠 הבית, ומשנים רק את זה:</p>`);
    const L2=pLines(p,nm);
    el.insertAdjacentHTML("beforeend",L2.length?`<div class="box"><ol>${L2.map(x=>`<li>${x[1]}</li>`).join("")}</ol></div>`:`<p class="hint">בדיוק כמו הבית.</p>`);
    if(p.t)el.insertAdjacentHTML("beforeend",`<div class="box hear"><strong class="h">📝 ההערה שלך</strong>${esc(p.t)}</div>`);
    const ids=pIds(p);if(ids.length)el.appendChild(crops(ids,pk(p)));
    const r=document.createElement("div");r.className="btnrow";r.innerHTML=`<button class="soft">✏️ לערוך</button><button class="soft del">🗑 למחוק</button>`;
    r.children[0].onclick=()=>{ed=JSON.parse(JSON.stringify(p));ed.i=mineView;st.draft=ed;save();drawFind()};
    r.children[1].onclick=e=>{const b=e.currentTarget;if(!b.dataset.sure){b.dataset.sure=1;b.textContent="בטוח? עוד נגיעה מוחקת";return}
      P.splice(mineView,1);mineView=null;save();drawFind()};
    el.appendChild(r);sc.scrollTop=0;return}
  mineView=null;
  el.insertAdjacentHTML("beforeend",`<p class="hint">${tx(f.hint||"")}</p>`);
  const nb=document.createElement("button");nb.className="big";nb.textContent="＋ צליל חדש";
  nb.onclick=()=>{ed={i:-1,n:"",k:{},s:{},c:[],t:""};st.draft=ed;save();drawFind()};el.appendChild(nb);
  if(!P.length)el.insertAdjacentHTML("beforeend",`<p class="lead">עוד אין כאן צלילים. מצאת משהו טוב? שומרים אותו כאן, לפני שמסובבים הלאה.</p>`);
  P.forEach((p,i)=>{const b=document.createElement("button");b.className="row pickrow";b.innerHTML=`<span>⭐ ${esc(p.n)}</span><span class="n">${sum(p)}</span>`;
    b.onclick=()=>{mineView=i;drawFind()};el.appendChild(b)});
  archBtn(el);sc.scrollTop=0;
}
function drawEdit(f,el){
  const P=st.mine,keep=()=>{st.draft=ed;save()};
  const q0=el.querySelector(".search");if(q0)q0.remove(); /* no search box while editing: the first field is the name */
  el.insertAdjacentHTML("beforeend",`<h2>${ed.i<0?"צליל חדש":"עריכה"}</h2>`);
  const nmI=document.createElement("input");nmI.className="search";nmI.placeholder="שם לצליל, למשל: קיק עגול";nmI.value=ed.n;nmI.maxLength=40;
  nmI.oninput=()=>{ed.n=nmI.value;keep()};el.appendChild(nmI);
  el.insertAdjacentHTML("beforeend",`<p class="hint">נוגעים בציור בכפתור, במתג או בשקע, ובוחרים. מסמנים רק מה ששונה מ־🏠 הבית.</p>`);
  const jump=document.createElement("div");jump.className="jump";el.appendChild(jump);
  const B=(F.find(x=>x.bands)||{bands:[{t:"הלוח",y:[0,HH]}]}).bands,svgs=[];
  B.forEach(b=>{const h3=document.createElement("h3");h3.textContent=b.t;el.appendChild(h3);
    const j=document.createElement("button");j.textContent=b.t;j.onclick=()=>{$("#findScroll").scrollTop+=h3.getBoundingClientRect().top-jump.getBoundingClientRect().bottom-6};jump.appendChild(j);
    const bd=document.createElement("div");bd.className="band";const sv=BASE.cloneNode(true),h=b.y[1]-b.y[0],x0=b.x?b.x[0]:0,w=b.x?b.x[1]-b.x[0]:W;
    sv.setAttribute("viewBox",`${x0} ${b.y[0]} ${w} ${h}`);sv.setAttribute("width",w);sv.setAttribute("height",h);
    if(w<=460||window.innerWidth>=w+40){sv.removeAttribute("width");sv.removeAttribute("height");sv.style.width="100%"}
    sv.addEventListener("click",e=>{const g=e.target.closest(".ctl");if(g)editCtl(g.dataset.id)});
    svgs.push(sv);bd.appendChild(sv);el.appendChild(bd)});
  el.insertAdjacentHTML("beforeend",`<h3>מה שונה מהבית</h3>`);
  const list=document.createElement("div");list.className="chgs";el.appendChild(list);
  const plainName=i=>`<span class="en">${E.names[i]}</span>`;
  function refresh(){
    const ids=pIds(ed);
    svgs.forEach(sv=>{setKnobs(sv,pk(ed));sv.querySelectorAll(".ctl").forEach(g=>g.classList.toggle("on",ids.indexOf(g.dataset.id)>=0))});
    const L2=pLines(ed,plainName);list.innerHTML=L2.length?"":`<p class="hint">עוד כלום. נגע בכפתור בציור.</p>`;
    L2.forEach(x=>{const r=document.createElement("div");r.className="row chg";r.innerHTML=`<span>${x[1]}</span><button class="rm" aria-label="להסיר">✕</button>`;
      r.querySelector(".rm").onclick=()=>{if(x[0][0]==="c"&&/^c\d+$/.test(x[0]))ed.c.splice(+x[0].slice(1),1);else{delete ed.k[x[0]];delete ed.s[x[0]]}keep();refresh()};
      if(!/^c\d+$/.test(x[0]))r.firstChild.onclick=()=>editCtl(x[0]);list.appendChild(r)});
  }
  const done=()=>{keep();shade.classList.remove("on");refresh()};
  function editCtl(id){if(!E.names[id])return;openSheet(sh=>{
    const d=document.createElement("div");d.className="crop";d.appendChild(cropSvg([id],pk(ed),300));sh.appendChild(d);
    const h=he(id),o=(D.rowText||{})[rowKey(id)]||{};
    sh.insertAdjacentHTML("beforeend",`<div class="row"><div class="top"><span class="en">${E.names[id]}</span><span class="kind">${h[1]}</span></div><div class="he">${h[0]}</div><p>${o.info||E.info[id]||""}</p></div>`);
    if(h[2]){/* a switch */
      const cur=ed.s[id]||HOMESW[id];
      h[2].forEach(x=>{const b=document.createElement("button");b.className="row pickrow pos"+(x[0]===cur?" cur":"");
        b.innerHTML=`<span><span class="en">${x[0]}</span> ${x[1]}</span><span class="n">${x[0]===HOMESW[id]?"🏠":""}</span>`;
        b.onclick=()=>{if(x[0]===HOMESW[id])delete ed.s[id];else ed.s[id]=x[0];done()};sh.appendChild(b)});
    }else if(isJack(id)&&id.indexOf("midi")!==0){/* a jack: one cable, from an output to an input */
      const out=isOut(id),old=ed.c.findIndex(c=>c[0]===id||c[1]===id);
      if(old>=0){const c=ed.c[old],b=document.createElement("button");b.className="soft del";b.innerHTML=`✕ להוציא את הכבל (${out?"אל":"מ־"} <span class="en">${E.names[out?c[1]:c[0]]}</span>)`;
        b.onclick=()=>{ed.c.splice(old,1);done()};sh.appendChild(b)}
      sh.insertAdjacentHTML("beforeend",`<h3>${out?"לאן הכבל הולך?":"מאיפה הכבל מגיע?"}</h3>`);
      Object.keys(E.names).filter(i=>i!==id&&isJack(i)&&i.indexOf("midi")!==0&&isOut(i)!==out&&he(i)[1]==="שקע").forEach(i=>{
        const b=document.createElement("button");b.className="row pickrow";b.innerHTML=`<span><span class="en">${E.names[i]}</span></span><span class="n">${he(i)[0]}</span>`;
        b.onclick=()=>{const pair=out?[id,i]:[i,id];ed.c=ed.c.filter(c=>c[0]!==pair[0]&&c[1]!==pair[1]);ed.c.push(pair);done()};sh.appendChild(b)});
    }else if(isKnob(id)){
      const cur=ed.k[id]!==undefined?ed.k[id]:HOME[id];
      sh.insertAdjacentHTML("beforeend",`<h3>לאיזו שעה הכפתור מצביע?</h3>`);
      const g=document.createElement("div");g.className="hours";
      HRS.forEach(hh=>{const b=document.createElement("button");b.textContent=hh;if(hh===cur)b.className="cur";if(hh===HOME[id])b.classList.add("hm");
        b.onclick=()=>{if(hh===HOME[id])delete ed.k[id];else ed.k[id]=hh;done()};g.appendChild(b)});
      sh.appendChild(g);
      sh.insertAdjacentHTML("beforeend",`<p class="hint">7 זה עד הסוף שמאלה, 12 למעלה, 5 עד הסוף ימינה.${HOME[id]!==undefined?" המסגרת הצהובה: איפה הוא ב־🏠 הבית.":""}</p>`);
    }else sh.insertAdjacentHTML("beforeend",`<p class="hint">כאן אין מה לשמור.</p>`);
  })}
  const ta=document.createElement("textarea");ta.className="search ta";ta.placeholder="הערה: מה מיוחד בצליל, עם מה הוא יושב טוב";ta.value=ed.t||"";ta.maxLength=300;
  ta.oninput=()=>{ed.t=ta.value;keep()};el.appendChild(ta);
  const r=document.createElement("div");r.className="btnrow";r.innerHTML=`<button class="soft">ביטול</button><button class="big">✓ לשמור</button>`;
  r.children[0].onclick=()=>{mineView=ed.i>=0?ed.i:null;ed=null;delete st.draft;save();drawFind()};
  r.children[1].onclick=()=>{const p={n:(ed.n||"").trim()||"צליל "+(P.length+(ed.i<0?1:0)),k:ed.k,s:ed.s,c:ed.c,t:(ed.t||"").trim(),d:Date.now()};
    if(ed.i>=0&&P[ed.i]){P[ed.i]=p;mineView=ed.i}else{P.unshift(p);mineView=0}
    ed=null;delete st.draft;save();drawFind()};
  el.appendChild(r);refresh();$("#findScroll").scrollTop=0;
}

/* a deep tab: one long explanation per screen */
function drawDeep(f,el,again,scr){
  again=again||drawFind;const C=f.deep||f.cards,k=Math.max(0,Math.min(st.deep||0,C.length-1)),c=C[k];st.deep=k;save();
  if(scr){const mb=document.createElement("button");mb.className="menubtn";mb.textContent="☰ כל הנושאים";mb.onclick=()=>{deepMenu=true;again()};el.appendChild(mb);
    st.seen=st.seen||{};st.seen[k]=1;save()}
  else{const pick=document.createElement("select");pick.className="search";
  pick.innerHTML=C.map((x,i)=>`<option value="${i}"${i===k?" selected":""}>${i+1}. ${x.t}</option>`).join("");
  pick.onchange=()=>{st.deep=+pick.value;again()};el.appendChild(pick)}
  el.insertAdjacentHTML("beforeend",`${c.sec?`<span class="tag">${c.sec}</span>`:""}<span class="count">${k+1} / ${C.length}</span><h2>${c.t}</h2>`);
  if(c.ids)el.appendChild(crops(c.ids,c.set||HOME));
  (c.p||[]).forEach(t=>el.insertAdjacentHTML("beforeend",`<p class="lead">${tx(t)}</p>`));
  if(c.rows)el.insertAdjacentHTML("beforeend",c.rows.map(r=>qa(r[0],r[1])).join(""));
  if(c.tr)el.insertAdjacentHTML("beforeend",`<div class="box"><strong class="h">👆 נסה</strong><ol>${c.tr.map(x=>`<li>${tx(x)}</li>`).join("")}</ol></div>`);
  if(c.hear)el.insertAdjacentHTML("beforeend",`<div class="box hear"><strong class="h">👂 שומעים</strong>${tx(c.hear)}</div>`);
  if(c.back)el.insertAdjacentHTML("beforeend",`<p class="back">${tx(c.back)}</p>`);
  if(k===C.length-1&&f.links)el.insertAdjacentHTML("beforeend",`<p class="hint">${f.hint||""}</p><div class="links">${f.links.map(m=>`<a href="${m[0]}"><span>${m[1]}</span><small>${m[2]}</small></a>`).join("")}</div>`);
  const nv=document.createElement("div");nv.className="navrow";nv.style.padding="4px 0 8px";
  nv.innerHTML=`<button${k===0?" disabled":""}>→ הקודם</button><button class="next"${k===C.length-1?" disabled":""}>הבא ←</button>`;
  nv.children[0].onclick=()=>{st.deep=k-1;again()};nv.children[1].onclick=()=>{st.deep=k+1;again()};
  el.appendChild(nv);
  if(f.archive)archBtn(el,f.archive);
  $(scr||"#findScroll").scrollTop=0;
}
/* the fourth door: the long explanations on their own */
let deepMenu=true;
function drawDeepDoor(){const el=$("#deep");el.innerHTML="";
  if(!deepMenu){drawDeep(D.deep,el,drawDeepDoor,"#deepScroll");return}
  /* the menu: every topic on one screen, by subject. You choose what to read. */
  const C=D.deep.cards,seen=st.seen||{};let sec=null;
  el.insertAdjacentHTML("beforeend",`<h2>${D.deep.title||"במה בא לך להתעמק?"}</h2><p class="lead">${D.deep.lead||"נוגעים בנושא ונכנסים. אין סדר ואין חובה: כל כרטיס עומד בפני עצמו."}</p>`);
  /* deep.top: one group is shown first, though its cards sit at the end of the list (what was read is saved by index, so new cards are only added at the end) */
  const order=C.map((c,i)=>i);if(D.deep.top)order.sort((a,b)=>(C[b].sec===D.deep.top)-(C[a].sec===D.deep.top)||a-b);
  order.forEach(i=>{const c=C[i];if(c.sec!==sec){sec=c.sec;el.insertAdjacentHTML("beforeend",`<h3>${sec||""}</h3>`)}
    const b=document.createElement("button");b.className="row pickrow"+(seen[i]?" seen":"");b.innerHTML=`<span>${c.t}</span><span class="n">${seen[i]?"✓":"←"}</span>`;
    b.onclick=()=>{st.deep=i;deepMenu=false;drawDeepDoor()};el.appendChild(b)});
  if(D.deep.archive)archBtn(el,D.deep.archive);$("#deepScroll").scrollTop=0}
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
  /* the steps come before the picture: on a phone the picture used to push them below the screen (measured 2026-11-16) */
  el.insertAdjacentHTML("beforeend",`<div class="box"><ol>${m.d.map(x=>`<li>${tx(x)}</li>`).join("")}</ol></div>`);
  if(m.ids)el.appendChild(crops(m.ids,m.set));
  if(m.back)el.insertAdjacentHTML("beforeend",`<p class="back">חזרה: ${tx(m.back)}</p>`);
  const p=pool(),n=p.filter(i=>st.done[i]).length;
  el.insertAdjacentHTML("beforeend",`<p class="tally">עשית ${n} מתוך ${p.length}</p>`);
  const ok=$("#ok");ok.classList.toggle("on",!!st.done[mi]);ok.textContent=st.done[mi]?"✓ נעשה":"✓ עשיתי";
  if(!keep)$("#playScroll").scrollTop=0;
}

/* ---------- tabs ---------- */
const HASDEEP=!!(D.deep&&$("#v-deep"));
function go(v){if(v==="deep"&&!HASDEEP)v="learn";st.tab=v;save();
  document.querySelectorAll(".view").forEach(x=>x.classList.toggle("on",x.id==="v-"+v));
  document.querySelectorAll(".tabs button").forEach(b=>b.setAttribute("aria-selected",b.dataset.v===v));
  if(v==="learn")drawLearn();else if(v==="find")drawFind();else if(v==="deep")drawDeepDoor();else drawPlay();
}
document.querySelectorAll(".tabs button").forEach(b=>b.onclick=()=>{if(b.dataset.v==="deep")deepMenu=true;go(b.dataset.v)});
/* #play-<cat> opens the missions on one group (week.html links here) */
const hashCat=()=>{const m=/^#play-(\w+)$/.exec(location.hash);if(!m||!D.cats.some(c=>c[0]===m[1]))return false;cat=m[1];st.cat=cat;bag=[];return true};
go(hashCat()?"play":/^#(learn|find|play|deep)$/.test(location.hash)?location.hash.slice(1):(st.tab||"learn"));
window.addEventListener("hashchange",()=>{if(hashCat())go("play");else if(/^#(learn|find|play|deep)$/.test(location.hash))go(location.hash.slice(1))});
/* ---------- the screen stays on while the page is open (both hands are on the instrument) ---------- */
(()=>{if(!("wakeLock" in navigator))return;let lock=null,busy=false;
  const ask=()=>{if(lock||busy||document.visibilityState!=="visible")return;busy=true;
    navigator.wakeLock.request("screen").then(l=>{busy=false;lock=l;l.addEventListener("release",()=>{lock=null})}).catch(()=>{busy=false})};
  ask();document.addEventListener("visibilitychange",ask);
  /* some browsers give the lock only after a touch, so every touch asks again if it is not held */
  document.addEventListener("pointerdown",ask,{passive:true})})();
window.DOORS_TEST={M:M,L:L,show:i=>{mi=i;cat="all";drawPlay()},card:i=>{li=i;drawLearn()}};
})();
