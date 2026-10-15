/* מטוטלת · פילטר ladder (בסגנון מוג) ב־AudioWorklet.
   4 קטבים (24dB/oct), ריזוננס עד השמעה עצמית, רוויה tanh בכניסה, קטימה קובית במשוב, דגימת־יתר ×2.
   הקובץ עובד גם ב־node לבדיקה (מייצא Ladder) וגם כ־AudioWorkletProcessor בדפדפן. */
(function(root){
"use strict";
function ftanh(x){ if(x>3) return 1; if(x<-3) return -1; var x2=x*x; return x*(27+x2)/(27+9*x2); }
function Ladder(sr){ this.sr=sr; this.reset(); }
Ladder.prototype.reset=function(){ this.y1=this.y2=this.y3=this.y4=0; this.ox=this.oy1=this.oy2=this.oy3=0; };
// in: דגימה, cutoff: הרץ, res: 0..1.1, drive: 0.1..10
Ladder.prototype.process=function(inp,cutoff,res,drive){
  var sr2=this.sr*2; // ×2: כל דגימה מעובדת פעמיים
  var f=cutoff*.87/this.sr; if(f>.9) f=.9; if(f<.001) f=.001; // מנורמל: 1 = נייקוויסט של sr2
  var p=f*(1.8-.8*f), k=p+p-1, t1=(1-p)*1.386249, t2=12+t1*t1, r=res*(t2+6*t1)/(t2-6*t1);
  var x=ftanh(inp*drive), out=0;
  for(var o=0;o<2;o++){
    var xi=x-r*(this.y4-.5*x); // פיצוי בס: המשוב מודד מול הכניסה, כך שהריזוננס לא מרוקן את התדרים הנמוכים
    var y1=xi*p+this.ox*p-k*this.y1, y2=y1*p+this.oy1*p-k*this.y2, y3=y2*p+this.oy2*p-k*this.y3, y4=y3*p+this.oy3*p-k*this.y4;
    if(y4>1.4) y4=1.4; else if(y4<-1.4) y4=-1.4;
    y4-=y4*y4*y4/6;
    this.ox=xi; this.oy1=y1; this.oy2=y2; this.oy3=y3; this.y1=y1; this.y2=y2; this.y3=y3; this.y4=y4;
    out=y4;
  }
  if(out!==out) { this.reset(); out=0; }
  return out;
};
if(typeof AudioWorkletProcessor!=="undefined"){
  class LadderProc extends AudioWorkletProcessor{
    static get parameterDescriptors(){ return [
      {name:"cutoff",defaultValue:1200,minValue:20,maxValue:18000,automationRate:"a-rate"},
      {name:"res",defaultValue:.2,minValue:0,maxValue:1.1,automationRate:"k-rate"},
      {name:"drive",defaultValue:1,minValue:.1,maxValue:10,automationRate:"k-rate"} ]; }
    constructor(){ super(); this.l=new Ladder(sampleRate); this.alive=true; this.port.onmessage=e=>{ if(e.data==="stop") this.alive=false; }; }
    process(inputs,outputs,params){
      var inp=inputs[0]&&inputs[0][0], out=outputs[0]&&outputs[0][0]; if(!out) return this.alive;
      var c=params.cutoff, res=params.res[0], drv=params.drive[0], l=this.l, n=out.length, ar=c.length>1;
      for(var i=0;i<n;i++) out[i]=l.process(inp?inp[i]:0, ar?c[i]:c[0], res, drv);
      return this.alive;
    }
  }
  registerProcessor("ladder",LadderProc);
}
if(typeof module!=="undefined") module.exports={Ladder:Ladder,ftanh:ftanh}; else if(root) root.LadderDSP={Ladder:Ladder};
})(typeof globalThis!=="undefined"?globalThis:null);
