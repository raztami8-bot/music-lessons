/* Offline support: always try the network first, fall back to the saved copy.
   Raise CACHE whenever a file here changes, so installed copies pick up the update. */
var CACHE="groove2-v1";
var FILES=["./","index.html","style.css","engine.js","sync.js","app.js","manifest.webmanifest","icon-180.png","icon-512.png"];
self.addEventListener("install",function(e){ e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(FILES); })); self.skipWaiting(); });
// only clean up this app's own old caches: the other instruments on the same site keep theirs
self.addEventListener("activate",function(e){ e.waitUntil(caches.keys().then(function(ks){ return Promise.all(ks.filter(function(k){ return k!==CACHE && k.indexOf("groove2-")===0; }).map(function(k){ return caches.delete(k); })); })); self.clients.claim(); });
self.addEventListener("fetch",function(e){
  if(e.request.method!=="GET") return;
  e.respondWith(fetch(e.request).then(function(r){
    if(r.ok && new URL(e.request.url).origin===location.origin){ var cp=r.clone(); caches.open(CACHE).then(function(c){ c.put(e.request,cp); }); }
    return r;
  }).catch(function(){ return caches.match(e.request,{ignoreSearch:true}).then(function(m){ return m||caches.match("index.html"); }); }));
});
