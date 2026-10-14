(function(){
  var NS="http://www.w3.org/2000/svg";
  var LET=["A","A#","B","C","C#","D","D#","E","F","F#","G","G#","A","A#","B","C"];
  var HEB=["לה","לה#","סי","דו","דו#","רה","רה#","מי","פה","פה#","סול","סול#","לה","לה#","סי","דו"];
  var SHARP=[2,5,7,10,12,14];
  function list(s){ return (s||"").split(",").map(function(x){return x.trim();}).filter(Boolean); }

  // Knobs: clock position to angle. 12 = up, fully left = 7, fully right = 5
  function angle(h){ return h===12 ? 0 : (h>=7 ? (h-12)*30 : h*30); }
  function pt(r,deg){ var a=deg*Math.PI/180; return [(50+r*Math.sin(a)).toFixed(1),(50-r*Math.cos(a)).toFixed(1)]; }
  document.querySelectorAll(".knob").forEach(function(el){
    var h=+el.dataset.h, big=el.dataset.ticks, cap=el.textContent.trim(), step=el.dataset.step, note=el.dataset.note;
    var s='<path d="M'+pt(42,-150)+' A42 42 0 1 1 '+pt(42,150)+'" fill="none" stroke="var(--line)" stroke-width="5" stroke-linecap="round"/>';
    s+='<circle cx="50" cy="50" r="28" fill="var(--surface)" stroke="var(--muted)" stroke-width="2.5"/>';
    if(big){ [7,8,9,10,11,12,1,2,3,4,5].forEach(function(k){ var p=pt(42,angle(k)); s+='<text x="'+p[0]+'" y="'+p[1]+'" font-size="9" font-weight="700" text-anchor="middle" dominant-baseline="central" fill="var(--muted)" font-family="Assistant,sans-serif">'+k+'</text>'; }); }
    var e=pt(26,angle(h));
    s+='<line x1="50" y1="50" x2="'+e[0]+'" y2="'+e[1]+'" stroke="var(--pointer)" stroke-width="6" stroke-linecap="round"/>';
    var svg=document.createElementNS(NS,"svg"); svg.setAttribute("viewBox","0 0 100 100"); svg.setAttribute("aria-hidden","true"); svg.innerHTML=s;
    el.textContent="";
    if(!big){ var nm=document.createElement("span"); nm.className="kn"; nm.textContent=cap; el.appendChild(nm); }
    el.appendChild(svg);
    if(!big){ var t=document.createElement("span"); t.dir="rtl";
      t.textContent=(step?step+" · ":"")+(note|| (h===7?"עד הסוף שמאלה":(h===5?"עד הסוף ימינה":"שעה "+h)));
      el.appendChild(t); }
  });

  // Step grids. data-keys = bass line ("1,1,-,13"), or data-rows = JSON [[label,[steps]],...]
  document.querySelectorAll(".seq").forEach(function(g){
    var rows=[], slides=list(g.dataset.slides).map(Number), skip=list(g.dataset.skip).map(Number);
    if(g.dataset.keys){
      var keys=list(g.dataset.keys), uniq=[];
      keys.forEach(function(k){ if(k!=="-" && k!=="x" && uniq.indexOf(+k)<0) uniq.push(+k); });
      uniq.sort(function(a,b){return b-a;});
      uniq.forEach(function(u){ var on=[]; keys.forEach(function(k,i){ if(+k===u) on.push(i+1); }); rows.push([HEB[u-1]+" · "+u,on]); });
    } else { rows=JSON.parse(g.dataset.rows); }
    var h='<div></div>';
    ["פעימה 1","פעימה 2","פעימה 3","פעימה 4"].forEach(function(b){ h+='<div class="beatlbl">'+b+'</div>'; });
    h+='<div></div>';
    for(var i=1;i<=16;i++) h+='<div class="stepnum'+((i-1)%4===0?' b':'')+'">'+(skip.indexOf(i)>-1?'×':i)+'</div>';
    rows.forEach(function(r){
      h+='<div class="rh">'+r[0]+'</div>';
      for(var i=1;i<=16;i++){ var c='cell'; if(skip.indexOf(i)>-1) c+=' skip'; else if(r[1].indexOf(i)>-1) c+=' on'; if((i-1)%4===0) c+=' beat'; h+='<div class="'+c+'"></div>'; }
    });
    if(slides.length){ h+='<div class="rh">גלישה</div>'; for(var j=1;j<=16;j++) h+='<div class="slide">'+(slides.indexOf(j)>-1?'〰':'')+'</div>'; }
    g.innerHTML=h;
  });

  // Tap trackers
  document.querySelectorAll(".taps").forEach(function(box,ti){
    var keys=list(box.dataset.keys), done=0, btns=[];
    var bar=document.createElement("div"); bar.className="tapbar"; bar.dir="rtl";
    var cnt=document.createElement("span"); cnt.setAttribute("aria-live","polite");
    var rb=document.createElement("button"); rb.type="button"; rb.className="btn"; rb.textContent="להתחיל מחדש"; rb.id="reset-"+(box.id||ti);
    bar.appendChild(cnt); bar.appendChild(rb);
    for(var g=0;g<keys.length/4;g++){
      var grp=document.createElement("div"); grp.className="group";
      for(var n=0;n<4;n++){
        var idx=g*4+n, k=keys[idx], b=document.createElement("button"), rest=(k==="-");
        b.type="button"; b.id=(box.id||"t"+ti)+"-"+(idx+1); b.className="tap"+(rest?" rest":"");
        b.innerHTML=(rest?"●":k)+'<small>'+(rest?"שתיקה":"צעד "+(idx+1))+'</small>';
        b.setAttribute("aria-label","צעד "+(idx+1)+": "+(rest?"שתיקה, לחצן העיגול":"קליד "+k));
        (function(i){ b.addEventListener("click",function(){ if(i===done){done++;paint();} else if(i===done-1){done--;paint();} }); })(idx);
        grp.appendChild(b); btns.push(b);
      }
      box.appendChild(grp);
    }
    box.parentNode.insertBefore(bar,box.nextSibling);
    function paint(){
      btns.forEach(function(b,i){ b.classList.toggle("done",i<done); b.classList.toggle("next",i===done); });
      cnt.textContent = done===keys.length ? keys.length+" מתוך "+keys.length+", עכשיו FUNC" : done+" מתוך "+keys.length;
    }
    rb.addEventListener("click",function(){ done=0; paint(); });
    paint();
  });

  // Keyboard pads. data-marks="1:שורש,4:טרצה", data-only="1,3,4" dims the rest
  document.querySelectorAll(".pads").forEach(function(p){
    var marks={}, only=list(p.dataset.only).map(Number);
    list(p.dataset.marks).forEach(function(m){ var a=m.split(":"); marks[+a[0]]=a[1]||""; });
    var h='';
    for(var i=1;i<=16;i++){
      var c='pad'+(SHARP.indexOf(i)>-1?' sh':'')+(only.length&&only.indexOf(i)<0?' dim':'')+(i in marks?' mk':'');
      h+='<div style="display:flex;flex-direction:column;gap:3px"><div class="padlbl">'+(marks[i]||'')+'</div><div class="'+c+'"><b>'+LET[i-1]+'</b><span>'+HEB[i-1]+'</span><span class="pn">'+i+'</span></div></div>';
    }
    p.innerHTML=h;
  });
})();

/* ---------- site additions ---------- */
(function(){
  var KEY="ml2:done";
  function load(){ try{ return JSON.parse(localStorage.getItem(KEY)||"{}"); }catch(e){ return {}; } }
  function save(d){ try{ localStorage.setItem(KEY,JSON.stringify(d)); }catch(e){} }
  var page=document.body.dataset.lesson;

  // Done buttons on numbered cards
  if(page){
    var done=load();
    document.querySelectorAll(".card[data-id]").forEach(function(c){
      var id=c.dataset.id, head=c.querySelector(".card-head"); if(!head) return;
      var b=document.createElement("button"); b.type="button"; b.className="donebtn"; b.id="done-"+id.replace(/\W/g,"_");
      function paint(){ var on=!!done[id]; c.classList.toggle("isdone",on); b.textContent=on?"✓ סיימתי":"סיימתי"; b.setAttribute("aria-pressed",on); }
      b.addEventListener("click",function(){ done=load(); if(done[id]) delete done[id]; else done[id]=1; save(done); paint(); });
      head.appendChild(b); paint();
    });
  }

  // Hub progress
  document.querySelectorAll("[data-progress]").forEach(function(el){
    var p=el.dataset.progress, total=+el.dataset.total, d=load(), n=0;
    Object.keys(d).forEach(function(k){ if(k.indexOf(p+":")===0) n++; });
    var bar=el.querySelector(".progress span"), txt=el.querySelector(".ptxt");
    if(bar) bar.style.width=Math.min(100,Math.round(n/total*100))+"%";
    if(txt) txt.textContent=n+" מתוך "+total+" כרטיסים";
  });

  // Keep screen awake while playing
  var wb=document.getElementById("wake"), lock=null;
  if(wb){
    if(!("wakeLock" in navigator)){ wb.hidden=true; }
    else{
      async function req(){ try{ lock=await navigator.wakeLock.request("screen"); wb.classList.add("on"); wb.textContent="☀ מסך דלוק";
        lock.addEventListener("release",function(){ if(!wb.dataset.want) { wb.classList.remove("on"); wb.textContent="☀ להשאיר מסך דלוק"; } }); }
        catch(e){ wb.dataset.want=""; wb.classList.remove("on"); wb.textContent="☀ להשאיר מסך דלוק"; } }
      wb.addEventListener("click",function(){
        if(wb.dataset.want){ delete wb.dataset.want; if(lock) lock.release(); lock=null; wb.classList.remove("on"); wb.textContent="☀ להשאיר מסך דלוק"; }
        else { wb.dataset.want="1"; req(); }
      });
      document.addEventListener("visibilitychange",function(){ if(document.visibilityState==="visible" && wb.dataset.want) req(); });
    }
  }

  // Tap photo to enlarge
  document.querySelectorAll(".photo img").forEach(function(img){
    img.addEventListener("click",function(){
      var z=document.createElement("div"); z.className="zoom"; z.setAttribute("role","dialog");
      var i=document.createElement("img"); i.src=img.src; i.alt=img.alt; z.appendChild(i);
      z.addEventListener("click",function(){ z.remove(); });
      document.body.appendChild(z);
    });
  });
})();
