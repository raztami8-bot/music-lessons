/* שעון משותף לכלים של music-lessons, דרך BroadcastChannel בשם "music-lessons-clock".
   עובד בין חלונות ולשוניות של אותו אתר באותו דפדפן (למשל שני חלונות ספארי זה לצד זה באייפד).
   הפרוטוקול מתואר ב־NOTES.md בשורש. הקובץ עצמאי: כלי אחר יכול להעתיק אותו כמו שהוא.

   הודעה: {proto:"mlc", v:1, type, from, app, bpm, at, bar, playing}
     type: "hello" | "state" | "tempo" | "start" | "stop" | "bar"
     at:   זמן הפעמה הראשונה של תיבה, באלפיות שנייה על שעון משותף (performance.timeOrigin + performance.now())
   מי שלוחץ נגן הוא המוביל. רק המוביל שולח "bar" בכל תיבה. מי שמקבל "start" הופך לעוקב. */
(function(){
"use strict";
var NAME="music-lessons-clock";
function epoch(){ return (performance.timeOrigin||(Date.now()-performance.now()))+performance.now(); }
function create(opts){
  opts=opts||{};
  var id=Math.random().toString(36).slice(2,10), ch=null, on=false, api;
  function send(type,extra){
    if(!on||!ch) return;
    var m={proto:"mlc",v:1,type:type,from:id,app:opts.app||"?"};
    if(extra) for(var k in extra) m[k]=extra[k];
    try{ ch.postMessage(m); }catch(e){}
  }
  function onMsg(e){
    var m=e&&e.data; if(!m||m.proto!=="mlc"||m.from===id||typeof m.type!=="string") return;
    var bpm=+m.bpm, at=+m.at; if(!(bpm>=20&&bpm<=400)) bpm=0; if(!isFinite(at)) at=0;
    var cb=opts.on&&opts.on[m.type]; if(typeof cb==="function"){ try{ cb({bpm:bpm,at:at,bar:+m.bar||0,playing:!!m.playing,app:String(m.app||""),from:m.from}); }catch(err){} }
  }
  api={
    id:id, epoch:epoch,
    enabled:function(){ return on; },
    available:function(){ return typeof BroadcastChannel!=="undefined"; },
    setEnabled:function(x){
      x=!!x; if(x===on) return on;
      if(x){ if(typeof BroadcastChannel==="undefined") return false; try{ ch=new BroadcastChannel(NAME); ch.onmessage=onMsg; on=true; send("hello"); }catch(e){ ch=null; on=false; } }
      else { try{ if(ch) ch.close(); }catch(e){} ch=null; on=false; }
      return on;
    },
    tempo:function(bpm){ send("tempo",{bpm:bpm}); },
    start:function(bpm,at){ send("start",{bpm:bpm,at:at}); },
    stop:function(){ send("stop"); },
    bar:function(bpm,at,bar){ send("bar",{bpm:bpm,at:at,bar:bar}); },
    state:function(playing,bpm,at){ send("state",{playing:!!playing,bpm:bpm,at:at}); }
  };
  return api;
}
window.MusicLessonsClock={create:create,channel:NAME,epoch:epoch};
})();
