const CACHE='moi-dela-v1.2.0-beta';
const ASSETS=['./','./index.html','./styles.css','./app.js','./manifest.webmanifest','./apple-touch-icon.png','./icon.svg'];
self.addEventListener('install', e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate', e=>e.waitUntil(Promise.all([self.clients.claim(), caches.keys().then(keys=>Promise.all(keys.filter(x=>x!==CACHE).map(x=>caches.delete(x))))])));
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return;
 e.respondWith((async()=>{
  try {const response=await fetch(e.request);if(response.ok){const cache=await caches.open(CACHE);cache.put(e.request,response.clone());}return response;}
  catch(err){const cached=await caches.match(e.request,{ignoreSearch:true});if(cached)return cached;if(e.request.mode==='navigate'){return (await caches.match('./index.html'));}throw err;}
 })());
});