/* אופליין: מגישים מהמטמון מיד (נפתח גם בלי רשת ובלי המתנה), ובמקביל מביאים מהרשת ומעדכנים את המטמון.
   אם index.html השתנה, הדף הפתוח מקבל הודעה ומציע לטעון מחדש. לבאמפ את CACHE בכל העלאה. */
var CACHE="acid-v11";
var FILES=["./","index.html","manifest.webmanifest","icon-180.png","icon-512.png"];
self.addEventListener("install",function(e){ e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(FILES); })); self.skipWaiting(); });
self.addEventListener("activate",function(e){ e.waitUntil(caches.keys().then(function(ks){
  return Promise.all(ks.filter(function(k){ return k!==CACHE && k.indexOf("acid-")===0; }).map(function(k){ return caches.delete(k); })); }).then(function(){ return self.clients.claim(); })); });
function changed(a,b){ var x=a.headers.get("etag")||a.headers.get("last-modified"), y=b.headers.get("etag")||b.headers.get("last-modified"); return !!(x&&y&&x!==y); }
self.addEventListener("fetch",function(e){
  var req=e.request; if(req.method!=="GET") return;
  var url=new URL(req.url); if(url.origin!==location.origin) return; // פונטים וכדומה: הדפדפן מטפל כרגיל
  var isPage=req.mode==="navigate"||/\/$|index\.html$/.test(url.pathname);
  e.respondWith(caches.match(req).then(function(cached){
    var net=fetch(req).then(function(r){
      if(r&&r.ok){ var cp=r.clone(); caches.open(CACHE).then(function(c){ c.put(req,cp); });
        if(cached&&isPage&&changed(cached,r)) self.clients.matchAll({type:"window"}).then(function(cs){ cs.forEach(function(cl){ cl.postMessage({type:"update"}); }); }); }
      return r;
    }).catch(function(){ return null; });
    if(cached){ e.waitUntil(net); return cached; }
    return net.then(function(r){ return r||caches.match("index.html"); });
  }));
});

