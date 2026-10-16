/* מטוטלת (תיקון) · ladder.js של במה 2 עם שני שינויים לביצועים:
   1. פרמטר gate (k-rate): כשהוא 0 (הקול כבר דעך), הפילטר מתאפס פעם אחת ו־process מחזיר אפסים בלי לחשב (קול במנוחה במאגר לא עולה כלום).
   2. מקדמי הפילטר וה־detune מחושבים מחדש רק כשהערכים משתנים, לא בכל דגימה.
   במה 2 · פילטר ladder ב־AudioWorklet. מבוסס על pendulum/ladder.js של רז (אותו אלגוריתם: 4 קטבים, 24dB/oct,
   רוויה ftanh בכניסה, קטימה קובית במשוב, פיצוי בס), עם שלושה שינויים:
   1. דגימת־יתר ×2 אמיתית: אינטרפולציה לינארית בכניסה (דגימת ביניים) וממוצע של שתי היציאות בדצימציה.
   2. cutoff, res, drive ו־detune הם a-rate: אפשר לתזמן עליהם מעטפת ואקסנט חלקים לכל דגימה.
   3. detune (סנטים) מכפיל את ה־cutoff, כך שהמשטח החי מזיז את הפילטר מיד בלי לגעת במעטפת המתוזמנת. */
(function(root){
"use strict";
function ftanh(x){ if(x>3) return 1; if(x<-3) return -1; var x2=x*x; return x*(27+x2)/(27+9*x2); }
function Ladder(sr){ this.sr=sr; this.reset(); }
Ladder.prototype.reset=function(){ this.y1=this.y2=this.y3=this.y4=0; this.ox=this.oy1=this.oy2=this.oy3=0; this.px=0; this.pb=0; this.lc=-1; this.lr=-1; };
Ladder.prototype.tick=function(x,p,k,r){
  var xi=x-r*(this.y4-.5*x);
  var y1=xi*p+this.ox*p-k*this.y1, y2=y1*p+this.oy1*p-k*this.y2, y3=y2*p+this.oy2*p-k*this.y3, y4=y3*p+this.oy3*p-k*this.y4;
  if(y4>1.4) y4=1.4; else if(y4<-1.4) y4=-1.4;
  y4-=y4*y4*y4/6;
  this.ox=xi; this.oy1=y1; this.oy2=y2; this.oy3=y3; this.y1=y1; this.y2=y2; this.y3=y3; this.y4=y4;
  return y4;
};
Ladder.prototype.process=function(inp,cutoff,res,drive){
  if(cutoff!==this.lc||res!==this.lr){ this.lc=cutoff; this.lr=res;
    var f=cutoff*.87/this.sr; if(f>.9) f=.9; if(f<.001) f=.001;   // מנורמל לנייקוויסט של 2×sr
    var p0=f*(1.8-.8*f), t1=(1-p0)*1.386249, t2=12+t1*t1; this.cp=p0; this.ck=p0+p0-1; this.cr=res*(t2+6*t1)/(t2-6*t1); }
  var p=this.cp, k=this.ck, r=this.cr;
  var x=inp*drive, mid=(this.px+x)*.5; this.px=x;          // upsample first, then saturate at 2×sr
  var a=this.tick(ftanh(mid),p,k,r), b=this.tick(ftanh(x),p,k,r);
  var out=(this.pb+a+a+b)*.25; this.pb=b;                    // decimation: (1,2,1)/4 FIR on the 2× stream, then keep every 2nd

  if(out!==out){ this.reset(); out=0; }
  return out;
};
if(typeof AudioWorkletProcessor!=="undefined"){
  class LadderProc extends AudioWorkletProcessor{
    static get parameterDescriptors(){ return [
      {name:"cutoff",defaultValue:1200,minValue:20,maxValue:20000,automationRate:"a-rate"},
      {name:"detune",defaultValue:0,minValue:-4800,maxValue:4800,automationRate:"a-rate"},
      {name:"res",defaultValue:.2,minValue:0,maxValue:1.1,automationRate:"a-rate"},
      {name:"drive",defaultValue:1,minValue:.1,maxValue:10,automationRate:"a-rate"},
      {name:"gate",defaultValue:1,minValue:0,maxValue:1,automationRate:"k-rate"} ]; }
    constructor(){ super(); this.l=new Ladder(sampleRate); this.alive=true; this.port.onmessage=e=>{ if(e.data==="stop") this.alive=false; }; }
    process(inputs,outputs,P){
      var inp=inputs[0]&&inputs[0][0], out=outputs[0]&&outputs[0][0]; if(!out) return this.alive;
      var c=P.cutoff,d=P.detune,r=P.res,g=P.drive,l=this.l,n=out.length;
      if(P.gate[0]<.5){ if(!this.rest){ l.reset(); this.rest=true; } out.fill(0); return this.alive; } // במנוחה: ה־VCA כבר סגור, מאפסים פעם אחת ולא מחשבים
      this.rest=false;
      var dk=d.length>1, dm=dk?1:Math.pow(2,d[0]/1200);
      for(var i=0;i<n;i++){
        var cut=(c.length>1?c[i]:c[0])*(dk?Math.pow(2,d[i]/1200):dm); if(cut>20000) cut=20000;
        out[i]=l.process(inp?inp[i]:0,cut,r.length>1?r[i]:r[0],g.length>1?g[i]:g[0]);
      }
      return this.alive;
    }
  }
  registerProcessor("ladder2",LadderProc);
}
if(root) root.LadderDSP2={Ladder:Ladder};
})(typeof globalThis!=="undefined"?globalThis:null);
