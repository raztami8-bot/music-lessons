/* אופליין: מגישים מהמטמון מיד, ובמקביל מביאים מהרשת ומעדכנים.
   אם index.html השתנה, הדף הפתוח מקבל הודעה ומציע לטעון מחדש. לבאמפ את CACHE בכל העלאה.
   גם הגופנים נשמרים במטמון, כדי שהדף ייראה אותו דבר בלי רשת.
   הבאה מהרשת עוקפת את מטמון הדפדפן (GitHub Pages שומר 10 דקות), כדי שעדכון יגיע מיד. */
var CACHE="kitchen-app-2"; // המספר כאן = "גרסה N" בכותרת של index.html
var FILES=["./","index.html","manifest.webmanifest","icon-180.png","icon-512.png"];
var FONT_HOSTS=["fonts.googleapis.com","fonts.gstatic.com"];
self.addEventListener("install",function(e){ e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(FILES.map(function(f){ return new Request(f,{cache:"reload"}); })); })); self.skipWaiting(); });
self.addEventListener("activate",function(e){ e.waitUntil(caches.keys().then(function(ks){
  return Promise.all(ks.filter(function(k){ return k!==CACHE && k.indexOf("kitchen-")===0; }).map(function(k){ return caches.delete(k); })); }).then(function(){ return self.clients.claim(); })); });
function changed(a,b){ var x=a.headers.get("etag")||a.headers.get("last-modified"), y=b.headers.get("etag")||b.headers.get("last-modified"); return !!(x&&y&&x!==y); }
self.addEventListener("fetch",function(e){
  var req=e.request; if(req.method!=="GET") return;
  var url=new URL(req.url);
  if(FONT_HOSTS.indexOf(url.hostname)>=0){ // גופנים: מהמטמון קודם, ואם אין - מהרשת ושומרים
    e.respondWith(caches.match(req).then(function(hit){ return hit||fetch(req).then(function(r){
      if(r&&(r.ok||r.type==="opaque")){ var cp=r.clone(); caches.open(CACHE).then(function(c){ c.put(req,cp); }); } return r; }); }));
    return;
  }
  if(url.origin!==location.origin) return;
  var isPage=req.mode==="navigate"||/\/$|index\.html$/.test(url.pathname);
  e.respondWith(caches.match(req).then(function(cached){
    var net=fetch(req,{cache:"no-cache"}).then(function(r){
      if(r&&r.ok){ var cp=r.clone(); caches.open(CACHE).then(function(c){ c.put(req,cp); });
        if(cached&&isPage&&changed(cached,r)) self.clients.matchAll({type:"window"}).then(function(cs){ cs.forEach(function(cl){ cl.postMessage({type:"update"}); }); }); }
      return r;
    }).catch(function(){ return null; });
    if(cached){ e.waitUntil(net); return cached; }
    return net.then(function(r){ return r||caches.match("index.html"); });
  }));
});
