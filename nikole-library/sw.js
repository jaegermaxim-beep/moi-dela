/* Nicole stories offline shell v5.5 — complete animal-story editorial revision and matched offline fallback scenes */
const CACHE="nikole-books-v25";
const ASSETS=["./index.html","./scene-art.js","./animal-games.js","./calm-scenes.js","./tablet.css","./manifest.webmanifest","./icon.svg"];
self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS.map(asset=>new Request(asset,{cache:"reload"})))).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",event=>{
  event.waitUntil(Promise.all([
    self.clients.claim(),
    caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith("nikole-books-")&&key!==CACHE).map(key=>caches.delete(key))))
  ]));
});
self.addEventListener("fetch",event=>{
  const req=event.request;
  if(req.method!=="GET"||new URL(req.url).origin!==self.location.origin)return;
  event.respondWith((async()=>{
    try {
      const response=await fetch(req,{cache:req.mode==="navigate"?"no-store":"default"});
      if(response.ok){const cache=await caches.open(CACHE);cache.put(req,response.clone()).catch(()=>{});}
      return response;
    }catch(error){
      const cached=await caches.match(req,{ignoreSearch:true});
      if(cached)return cached;
      if(req.mode==="navigate"){const fallback=await caches.match("./index.html");if(fallback)return fallback;}
      return Response.error();
    }
  })());
});