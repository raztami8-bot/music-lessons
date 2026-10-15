/* מכונת אווירות · לופר
   Records exactly what you hear (after the compressor), sample-accurate, at full quality (32-bit float, native rate).
   Every layer has the same length (bars × beats at the tempo) and plays from the same start, so layers stay locked. */
(function(){
"use strict";
var E=window.Engine;
var MAXLAYERS=8;
var L={bars:2,layers:[],T0:0,len:0,state:"idle",recStart:0,node:null,nodeCtx:null,kind:null,onchange:null,playing:true,starting:false};

function I(){ return E.internals(); }
function cycleSec(){ return L.bars*4*E.beatSec(); }
function emit(){ if(L.onchange) try{ L.onchange(); }catch(e){} }

/* ---- capture node: an AudioWorklet (Safari 14.5+), or the older processor as a fallback ---- */
var WORKLET=[
"class LoopRec extends AudioWorkletProcessor{",
" constructor(){ super(); this.on=false; this.port.onmessage=(e)=>{ const d=e.data;",
"  if(d.cmd==='start'){ this.startFrame=Math.round(d.at*sampleRate); this.len=d.len; this.l=new Float32Array(d.len); this.r=new Float32Array(d.len); this.pos=0; this.on=true; }",
"  else if(d.cmd==='cancel'){ this.on=false; } }; }",
" process(inputs){",
"  if(!this.on) return true;",
"  const inp=inputs[0]||[], a=inp[0], b=inp[1]||inp[0], n=128;",
"  let i=0; if(this.pos===0){ if(currentFrame+n<=this.startFrame) return true; i=Math.max(0,this.startFrame-currentFrame); }",
"  for(;i<n && this.pos<this.len;i++,this.pos++){ this.l[this.pos]=a?a[i]:0; this.r[this.pos]=b?b[i]:0; }",
"  if(this.pos>=this.len){ this.on=false; this.port.postMessage({l:this.l,r:this.r},[this.l.buffer,this.r.buffer]); }",
"  return true; } }",
"registerProcessor('loop-rec',LoopRec);"].join("\n");

var pendingCapture=null;
function ensureNode(){
  var c=I().ctx, N=I().N; if(!c) return Promise.resolve(false);
  if(L.node && L.nodeCtx===c) return Promise.resolve(true);
  L.node=null; L.nodeCtx=c;
  var sink=c.createGain(); sink.gain.value=0; sink.connect(c.destination);
  if(c.audioWorklet && window.AudioWorkletNode){
    var url=URL.createObjectURL(new Blob([WORKLET],{type:"application/javascript"}));
    return c.audioWorklet.addModule(url).then(function(){
      var node=new AudioWorkletNode(c,"loop-rec",{numberOfInputs:1,numberOfOutputs:1,outputChannelCount:[2],channelCount:2,channelCountMode:"explicit"});
      N.comp.connect(node); node.connect(sink);
      node.port.onmessage=function(e){ finish(e.data.l,e.data.r); };
      L.node=node; L.kind="worklet"; return true;
    }).catch(function(){ return fallback(c,N,sink); });
  }
  return Promise.resolve(fallback(c,N,sink));
}
function fallback(c,N,sink){
  if(!c.createScriptProcessor) return false;
  var sp=c.createScriptProcessor(1024,2,2), job=null;
  sp.onaudioprocess=function(ev){
    if(!job) return; var ib=ev.inputBuffer, n=ib.length, t=ev.playbackTime, sr=c.sampleRate;
    var a=ib.getChannelData(0), b=ib.getChannelData(1), i=0;
    if(job.pos===0){ var off=Math.round((job.at-t)*sr); if(off>=n) return; i=Math.max(0,off); }
    for(;i<n && job.pos<job.len;i++,job.pos++){ job.l[job.pos]=a[i]; job.r[job.pos]=b[i]; }
    if(job.pos>=job.len){ var j=job; job=null; setTimeout(function(){ finish(j.l,j.r); },0); }
  };
  N.comp.connect(sp); sp.connect(sink);
  L.node={port:{postMessage:function(d){
    if(d.cmd==="start") job={at:d.at,len:d.len,pos:0,l:new Float32Array(d.len),r:new Float32Array(d.len)};
    else job=null; }}};
  L.kind="script"; return true;
}

/* ---- timing ---- */
function now(){ var c=I().ctx; return c?c.currentTime:0; }
function phaseAt(t){ if(!L.len) return 0; var p=((t-L.T0)%L.len+L.len)%L.len; return p; }
function nextBoundary(after){ var k=Math.ceil((after-L.T0)/L.len); return L.T0+k*L.len; }

/* ---- layers ---- */
function play(layer,when){
  var c=I().ctx, N=I().N; if(!c||!N.loopBus) return;
  stopSrc(layer);
  var src=c.createBufferSource(); src.buffer=layer.buf; src.loop=true;
  var g=c.createGain(); g.gain.value=(layer.muted||!L.playing)?0:layer.vol;
  src.connect(g); g.connect(N.loopBus);
  when=Math.max(when,c.currentTime+0.02);
  src.start(when,phaseAt(when));          // start mid-loop at the right spot, so it lines up with the others
  layer.src=src; layer.g=g;
}
function stopSrc(layer){ if(layer.src){ try{ layer.src.stop(); }catch(e){} try{ layer.g.disconnect(); }catch(e){} layer.src=null; layer.g=null; } }
function finish(l,r){
  var c=I().ctx; if(!c || L.state!=="rec") return;
  var buf=c.createBuffer(2,l.length,c.sampleRate);
  if(buf.copyToChannel){ buf.copyToChannel(l,0); buf.copyToChannel(r,1); } else { buf.getChannelData(0).set(l); buf.getChannelData(1).set(r); }
  // tiny fades at the seam, so the loop point never clicks
  var f=Math.min(64,l.length>>4);
  for(var ch=0;ch<2;ch++){ var d=buf.getChannelData(ch); for(var i=0;i<f;i++){ var k=i/f; d[i]*=k; d[d.length-1-i]*=k; } }
  var layer={buf:buf,muted:false,vol:1,id:Date.now()};
  L.layers.push(layer); L.state="idle";
  play(layer,c.currentTime+0.02);
  emit();
}

/* ---- actions ---- */
function arm(){
  if(L.layers.length>=MAXLAYERS) return "full";
  return ensureNode().then(function(ok){
    if(!ok) return "unsupported";
    if(!L.layers.length){ L.state="armed"; emit(); return "armed"; }
    // overdub: start at the next loop start, record exactly one loop
    var t=nextBoundary(now()+0.06); record(t); return "waiting";
  });
}
function startFirst(t){
  if(L.state!=="armed") return;
  t=Math.max(t||0,now()+0.01);
  L.len=cycleSec(); L.T0=t; L.playing=true;
  E.syncClock(t);                       // arpeggio and trance gate line up with the loop
  record(t);
}
function record(t){
  var c=I().ctx; if(!c||!L.node) return;
  L.recStart=t; L.state="rec";
  L.node.port.postMessage({cmd:"start",at:t,len:Math.round(L.len*c.sampleRate)});
  emit();
}
function cancel(){
  if(L.node) L.node.port.postMessage({cmd:"cancel"});
  L.state="idle"; if(!L.layers.length){ L.len=0; } emit();
}
function undo(){ var x=L.layers.pop(); if(x) stopSrc(x); if(!L.layers.length){ L.len=0; L.state=L.state==="rec"?L.state:"idle"; } emit(); }
function clear(){ cancel(); L.layers.forEach(stopSrc); L.layers=[]; L.len=0; L.T0=0; L.playing=true; emit(); }
function remove(id){ L.layers=L.layers.filter(function(x){ if(x.id===id){ stopSrc(x); return false; } return true; }); if(!L.layers.length) L.len=0; emit(); }
function toggleMute(id){ var c=I().ctx; L.layers.forEach(function(x){ if(x.id===id){ x.muted=!x.muted; if(x.g&&c) x.g.gain.setTargetAtTime((x.muted||!L.playing)?0:x.vol,c.currentTime,0.015); } }); emit(); }
// stop: silence. play: restart every layer from the top, right now (press it on the drum downbeat to re-sync)
function togglePlay(){
  var c=I().ctx; if(!c||!L.layers.length) return;
  if(L.playing){ L.playing=false; L.layers.forEach(function(x){ if(x.g) x.g.gain.setTargetAtTime(0,c.currentTime,0.02); }); }
  else { L.playing=true; L.T0=c.currentTime+0.03; E.syncClock(L.T0); L.layers.forEach(function(x){ play(x,L.T0); }); }
  emit();
}
function reattach(){ L.node=null; L.nodeCtx=null; if(L.state==="rec"||L.state==="armed") L.state="idle";
  var c=I().ctx; if(!c) return; ensureNode(); L.layers.forEach(function(x){ x.src=null; play(x,c.currentTime+0.05); }); emit(); }
function progress(){
  if(!L.len) return 0;
  var t=now(); if(L.state==="rec" && t<L.recStart) return -(L.recStart-t);   // negative: seconds until recording starts
  return phaseAt(t)/L.len;
}

window.Looper={
  arm:arm, startFirst:startFirst, cancel:cancel, undo:undo, clear:clear, remove:remove, toggleMute:toggleMute, togglePlay:togglePlay,
  reattach:reattach, progress:progress, cycleSec:cycleSec,
  setBars:function(b){ if(!L.layers.length && L.state!=="rec") { L.bars=b; emit(); return true; } return false; },
  get state(){ return L.state; }, get layers(){ return L.layers; }, get bars(){ return L.bars; }, get playing(){ return L.playing; },
  get recStart(){ return L.recStart; }, get max(){ return MAXLAYERS; },
  set onchange(f){ L.onchange=f; }
};
})();
