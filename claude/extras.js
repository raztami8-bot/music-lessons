/* Notebook and glossary for the Claude version. Loaded after app.js. */
(function(){
"use strict";
var NOTES="ml2:notes";
function get(k,d){ try{ var v=localStorage.getItem(k); return v==null?d:JSON.parse(v); }catch(e){ return d; } }
function set(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} }
function list(s){ return (s||"").split(",").map(function(x){return x.trim();}).filter(Boolean); }
function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];}); }
var NS="http://www.w3.org/2000/svg";

/* ---------- notes per card ---------- */
function addNotes(){
  [].forEach.call(document.querySelectorAll(".card[data-id]"),function(c){
    var id=c.dataset.id, head=c.querySelector(".card-head"); if(!head) return;
    var t=c.querySelector(".card-head h3"), n=c.querySelector(".card-head .num");
    var b=document.createElement("button"); b.type="button"; b.className="notebtn";
    var box=document.createElement("div"); box.className="note-box"; box.hidden=true;
    var tid="note-"+id.replace(/\W/g,"_");
    box.innerHTML='<label for="'+tid+'">ההערה שלך לכרטיס הזה</label><textarea id="'+tid+'" rows="3" placeholder="למשל: CUTOFF בשעה 11 נשמע לי הכי טוב"></textarea><small>נשמר אוטומטית באייפד הזה. כל ההערות מרוכזות בפנקס.</small>';
    var ta=box.querySelector("textarea");
    function paint(){ var has=!!(get(NOTES,{})[id]||{}).text; b.textContent=has?"✎ הערה •":"✎ הערה"; b.classList.toggle("has",has); }
    ta.value=(get(NOTES,{})[id]||{}).text||"";
    var tm=null;
    ta.addEventListener("input",function(){ clearTimeout(tm); tm=setTimeout(function(){
      var all=get(NOTES,{});
      if(ta.value.trim()) all[id]={text:ta.value, t:Date.now(), title:(n?n.textContent+" ":"")+(t?t.textContent:""), lesson:document.body.dataset.lesson};
      else delete all[id];
      set(NOTES,all); paint(); },400); });
    b.addEventListener("click",function(){ box.hidden=!box.hidden; if(!box.hidden) ta.focus(); });
    if(ta.value) box.hidden=false;
    head.insertBefore(b, head.querySelector(".cardplay")||head.querySelector(".donebtn"));
    c.appendChild(box); paint();
  });
}

/* ---------- glossary ---------- */
var GLOSS=[
 ["סיקוונסר","מנגנון שמנגן רשימת הוראות צעד אחר צעד, בלולאה: איזה תו או תוף בכל צעד. הוא שומר הוראות, לא צליל, ולכן אפשר לשנות כפתורים בזמן שהוא מנגן.","1",["רצף","מקצב"]],
 ["פעימות לדקה","מהירות הקצב. בקצב 128 יש 128 פעימות בדקה, כל פעימה כחצי שנייה, וכל צעד כ־117 אלפיות שנייה.","1",["קצב"]],
 ["פעימה","מה שסופרים ברגל: אחת, שתיים, שלוש, ארבע. בסיקוונסר כל פעימה היא ארבעה צעדים.","1",[]],
 ["תיבה","ארבע פעימות, 16 צעדים. זו הלולאה הבסיסית של כל השיעורים.","1",[]],
 ["צעד","משבצת זמן אחת בסיקוונסר, רבע פעימה. בכל צעד יכול להיות תו, שתיקה או מכה.","1",["צעד אחד"]],
 ["צעד פעיל","צעד שהסיקוונסר עובר בו. צעד לא פעיל מדולג, והלולאה מתקצרת.","1",["פעיל"]],
 ["דילוג","הוצאת צעד מהלולאה. הלולאה מתקצרת, ומול תופים של 16 צעדים היא מתחילה לזוז ביחס לקיק.","2",["מדולג"]],
 ["שתיקה","צעד שהזמן שלו נשאר אבל לא נשמע בו תו. הלולאה נשארת באותו אורך.","2",[]],
 ["מתנד","מעגל שיוצר תנודה שחוזרת מאות פעמים בשנייה. זה מקור הצליל. בבס יש שלושה, עם מסנן ומעטפת משותפים.","1",["מתנדים"]],
 ["צורת גל","הצורה של התנודה. היא קובעת את הגוון הגולמי לפני המסנן.","1",["צורת הגל","צורה"]],
 ["גל מסור","גל עם כל ההרמוניות, הזוגיות והאי־זוגיות. נשמע עשיר וזמזומי, ונותן למסנן הרבה חומר. הבחירה הקלאסית לאסיד.","1",[]],
 ["גל מרובע","גל עם בעיקר הרמוניות אי־זוגיות. נשמע חלול יותר מגל מסור.","1",[]],
 ["הרמוניות","תדרים גבוהים שנמצאים בתוך כל צליל מעל תדר היסוד, ונותנים לו צבע. המסנן עובד בעיקר עליהם.","2",[]],
 ["מסנן מעביר נמוכים","מסנן שנותן לתדרים נמוכים לעבור ומחליש בהדרגה את מה שמעל תדר החיתוך. בבס השיפוע הוא 12 דציבל לאוקטבה: מעבר רך, לא קיר.","1",["מסנן","מסנן אחד"]],
 ["תדר החיתוך","הנקודה שמעליה המסנן מתחיל להחליש. בבס זה הכפתור הגדול CUTOFF. ימינה הצליל נפתח, שמאלה הוא נסגר.","1",["חיתוך"]],
 ["תהודה","הגברה של פס צר סביב תדר החיתוך, הכפתור PEAK. היא מה שהופך סיבוב של החיתוך ל״צרחה״ חומצית.","1",[]],
 ["מעטפת","צורת השינוי של הצליל לאורך הזמן, מרגע הנגיעה. בבס יש לה עלייה וירידה, והיא יכולה להזיז גם את העוצמה וגם את המסנן.","1",["מעטפת אחת"]],
 ["עלייה","כמה מהר המעטפת מגיעה לשיא. הכפתור ATTACK. לאסיד: עד הסוף שמאלה, התו מתחיל מיד.","1",[]],
 ["ירידה","כמה מהר המעטפת דועכת. הכפתור DECAY/RELEASE. לאסיד בערך שעה 10: תו קצר.","1",[]],
 ["החזקה","מתג בקליד 11. דולק: הצליל נשאר כל עוד האצבע על הקליד. כבוי: הוא דועך מיד אחרי העלייה. לאסיד כבוי.","2",["ההחזקה"]],
 ["עומק מעטפת המסנן","כמה המעטפת פותחת את המסנן בכל תו, הכפתור CUTOFF EG INT. זה ה״וואו״ או ה״קוואק״ בתחילת כל תו.","1",["CUTOFF EG INT"]],
 ["תנועה מחזורית","״יד אוטומטית״ שמזיזה משהו הלוך וחזור בלי קשר לתווים. באנגלית LFO. RATE קובע מהירות, INT קובע עומק.","1",["LFO"]],
 ["טרמולו","רעד בעוצמה, כשהתנועה המחזורית מזיזה את העוצמה.","2",[]],
 ["ויברטו","רעד בגובה, כשהתנועה המחזורית מזיזה את הגובה.","2",[]],
 ["קיבוץ","קובע אילו מתנדים חולקים את אותו רצף תווים. נבחר עם FUNC וקלידים 1 עד 3.","2",[]],
 ["אוניסון","שני מתנדים או יותר שמנגנים אותו תו יחד. עם סטייה זעירה ביניהם הצליל נשמע עבה ורחב.","2",[]],
 ["פעימות","כששני גלים קרובים מאוד בגובה, הם מתחזקים ונחלשים לסירוגין, כמו ״ווא־ווא״ איטי. ככל שההפרש גדל, זה מאיץ.","2",[]],
 ["גלישה","מעבר רציף בגובה מתו לתו במקום קפיצה. מסמנים את הצעד שממנו יוצאים. אין כפתור לאורך שלה: היא נמשכת צעד אחד.","1",[]],
 ["אקסנט","דגש אוטומטי על צעדים נבחרים בעוצמה ובמסנן. קיים בסינתיסייזר שהמציא את האסיד ובטי־8, אבל לא בבס שלך.","2",["הדגשה","הדגשות"]],
 ["מצב מקלדת","בטי־8: לחצני הצעדים הופכים לקלידים עם שמות תווים, ובכל צעד בוחרים תו, אוקטבה וגלישה. נכנסים עם KYBD.","4",[]],
 ["סיידצ׳יין","כלי אחד, בדרך כלל הקיק, מחליש לרגע כלי אחר בכל מכה. הבס ״נשאב״ ונושם עם הקיק.","4",["שאיבה"]],
 ["דיליי","הד: הצליל חוזר אחרי זמן קבוע. אפשר לנעול את הזמן לקצב.","4",["הד"]],
 ["סנכרון","מכשיר אחד שולח פעימות תזמון, והשני מתקדם לפיהן. הכבל מעביר תזמון בלבד, לא צליל ולא פקודת התחלה.","1",[]],
 ["הקלטת צעדים","כתיבת רצף תו אחר תו, בלי קצב ובלי לחץ זמן. הקליד קובע את הגובה, והצעד מתקדם לבד.","1",[]],
 ["סוויפ","סיבוב רציף ואיטי של כפתור לאורך זמן, בדרך כלל CUTOFF, בזמן שהקו מנגן.","1",[]],
 ["הקשבה משווה","משנים דבר אחד בלבד ומשווים לפני ואחרי. כך האוזן לומדת מה כל כפתור עושה.","1",[]],
 ["אנלוגי","צליל שנוצר במעגל חשמלי בזמן אמת. הקיק והתופים הנמוכים במכונת התופים הם אנלוגיים.","1",[]],
 ["דגימה דיגיטלית","הקלטה קצרה של צליל אמיתי שנשמרה במכשיר ומנוגנת ממנו. הקלאפ הוא דגימה.","1",[]],
 ["היי־האט","צליל מתכתי ורועש. סגור הוא קצר ויבש, פתוח הוא ארוך. סגור שבא אחרי פתוח קוטע אותו.","1",[]],
 ["חצי טון","המרחק בין קליד לקליד שלידו, בלי קשר לצבע. המדרגה הקטנה ביותר.","3",["חצאי טון"]],
 ["טון","שני חצאי טון: מדלגים על קליד אחד.","3",[]],
 ["אוקטבה","12 חצאי טון, הכפלה של התדר. אותו תו, גבוה יותר. בבס: קליד 1 וקליד 13.","1",["האוקטבה"]],
 ["מרווח","המרחק בין שני תווים, נמדד בחצאי טון.","2",[]],
 ["שורש","התו שהקו בנוי סביבו וחוזר אליו. בשיעורים זה לה, קליד 1.","3",["השורש"]],
 ["טרצה קטנה","3 חצאי טון מעל השורש. נותנת את הצבע האפל והמינורי. מעל לה: דו, קליד 4.","2",["הטרצה הקטנה"]],
 ["קווינטה","7 חצאי טון מעל השורש. צליל פתוח וחזק. מעל לה: מי, קליד 8.","2",["הקווינטה"]],
 ["ספטימה","הדרגה השביעית בסולם. בלה מינור: סול, קליד 11.","3",[]],
 ["אקורד","כמה תווים שנשמעים יחד. שורש, טרצה קטנה וקווינטה הם אקורד מינורי.","2",["אקורד לה מינור"]],
 ["סולם","בחירה של תווים שנשמעים טוב יחד. המכשיר לא נועל סולם, זו בחירה שלך.","3",[]],
 ["פריגי","סולם מינורי עם חצי טון צמוד מעל השורש. מעל לה: סי במול, קליד 2. נשמע מתוח ומאיים.","3",["לה פריגי"]],
 ["פנטטוני","סולם של חמישה תווים בלי התווים ה״צמודים״, ולכן כמעט כל צירוף נשמע טוב. הכי סלחני לאלתור.","3",["פנטטוני מינורי"]],
 ["סינקופה","התחושה שהקצב ״מועד״ קדימה, כי תווים נוחתים במקומות שהאוזן לא ציפתה, למשל אחרי שתיקה.","3",[]],
 ["פולימטר","שתי לולאות באורכים שונים שמנגנות יחד. הן נפגשות שוב רק אחרי כמה סיבובים.","2",[]],
 ["דיאז","תו גבוה בחצי טון מהתו הטבעי. בבס אלה הקלידים הזהובים.","3",["דו#","רה#","פה#","סול#","לה#"]],
 ["במול","תו נמוך בחצי טון. אותו קליד כמו הדיאז שמתחתיו: סי במול הוא לה#.","3",["סי במול"]]
];
var GMAP={};
GLOSS.forEach(function(g,i){ GMAP[g[0]]=i; g[3].forEach(function(a){ if(!(a in GMAP)) GMAP[a]=i; }); });

var pop=null;
function showTerm(i){
  var g=GLOSS[i]; if(!pop){
    pop=document.createElement("div"); pop.className="gl-pop"; pop.setAttribute("role","dialog");
    pop.innerHTML='<div class="gl-in"><div class="gl-h"><b id="gl-t"></b><button type="button" class="gl-x" id="gl-x" aria-label="סגירה">✕</button></div><p id="gl-d"></p><a id="gl-all" href="glossary.html">לכל המושגים ←</a></div>';
    document.body.appendChild(pop);
    pop.addEventListener("click",function(e){ if(e.target===pop) pop.hidden=true; });
    document.getElementById("gl-x").addEventListener("click",function(){ pop.hidden=true; });
    document.addEventListener("keydown",function(e){ if(e.key==="Escape" && pop) pop.hidden=true; });
  }
  document.getElementById("gl-t").textContent=g[0];
  document.getElementById("gl-d").textContent=g[1];
  document.getElementById("gl-all").href="glossary.html#t"+i;
  pop.hidden=false;
}
function linkTerms(){
  [].forEach.call(document.querySelectorAll(".learn b, .gloss dt"),function(b){
    if(b.closest(".acid") && b.textContent==="לאסיד:") return;
    var k=b.textContent.trim(); if(!(k in GMAP)) return;
    var btn=document.createElement("button"); btn.type="button"; btn.className="term"; btn.textContent=b.textContent;
    btn.setAttribute("aria-label","הסבר: "+k);
    btn.addEventListener("click",function(){ showTerm(GMAP[k]); });
    b.textContent=""; b.appendChild(btn);
  });
}

/* ---------- glossary page ---------- */
function renderGlossary(root){
  var order=GLOSS.map(function(g,i){return i;}).sort(function(a,b){ return GLOSS[a][0].localeCompare(GLOSS[b][0],"he"); });
  var h='<label class="gl-search" for="gl-q">חיפוש</label><input id="gl-q" type="search" placeholder="למשל: מעטפת" autocomplete="off"><dl class="gl-list">';
  order.forEach(function(i){ var g=GLOSS[i];
    h+='<div class="gl-item" id="t'+i+'" data-s="'+esc((g[0]+" "+g[3].join(" ")+" "+g[1]).toLowerCase())+'"><dt>'+esc(g[0])+'</dt><dd>'+esc(g[1])+' <a href="lesson-'+g[2]+'.html">שיעור '+g[2]+'</a></dd></div>'; });
  h+='</dl>'; root.innerHTML=h;
  var q=document.getElementById("gl-q");
  q.addEventListener("input",function(){ var v=q.value.trim().toLowerCase();
    [].forEach.call(root.querySelectorAll(".gl-item"),function(it){ it.hidden=v&&it.dataset.s.indexOf(v)<0; }); });
}

/* ---------- notebook page ---------- */
var TITLES={"1":"שיעור 1","2":"שיעור 2","3":"שיעור 3","4":"שיעור 4"};
function renderNotebook(root){
  var notes=get(NOTES,{});
  var ids=Object.keys(notes).sort(function(a,b){ var x=a.split(":"),y=b.split(":"); return x[0]===y[0]?parseFloat(x[1])-parseFloat(y[1]):(x[0]<y[0]?-1:1); });
  var h='<section class="stage"><h2>ההערות שלך</h2>';
  if(!ids.length) h+='<p class="info">עדיין אין. בכל כרטיס בשיעורים יש כפתור ״✎ הערה״.</p>';
  ids.forEach(function(id){ var n=notes[id], parts=id.split(":");
    h+='<article class="card"><div class="card-head"><span class="num">'+esc(TITLES[n.lesson]||"")+'</span><h3><a href="lesson-'+esc(n.lesson)+'.html#'+esc(parts[0]+"-"+parts[1].replace(/\./g,"-"))+'">'+esc(n.title||id)+'</a></h3></div><p class="nb-text">'+esc(n.text).replace(/\n/g,"<br>")+'</p></article>'; });
  h+='</section><section class="stage"><h2>גיבוי</h2><article class="card"><p>הפנקס נשמר רק באייפד הזה. כדי לשמור עותק, העתק את הכול והדבק בפתקים או בהודעה לעצמך.</p>'+
    '<div class="sy-row"><button type="button" class="btn" id="nb-copy">העתק את כל הפנקס</button><span class="sy-msg" id="nb-msg" aria-live="polite"></span></div><textarea id="nb-text" class="nb-out" rows="6" readonly hidden></textarea></article></section>';
  root.innerHTML=h;
  document.getElementById("nb-copy").addEventListener("click",function(){
    var lines=["הפנקס שלי · שיעורי מוזיקה",""];
    ids.forEach(function(id){ var n=notes[id]; lines.push((TITLES[n.lesson]||"")+" · "+(n.title||id)); lines.push("  "+n.text.replace(/\n/g,"\n  ")); lines.push(""); });
    var txt=lines.join("\n"), out=document.getElementById("nb-text"), m=document.getElementById("nb-msg");
    function fallback(){ out.hidden=false; out.value=txt; out.focus(); out.select(); m.textContent="סמן והעתק מהתיבה"; }
    if(navigator.clipboard&&navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(function(){ m.textContent="הועתק"; },fallback); else fallback();
  });
}

var nb=document.getElementById("notebook"); if(nb) renderNotebook(nb);
var gl=document.getElementById("glossary"); if(gl){ renderGlossary(gl); if(location.hash){ var t=document.getElementById(location.hash.slice(1)); if(t){ t.classList.add("hl"); t.scrollIntoView(); } } }
addNotes(); linkTerms();
})();
