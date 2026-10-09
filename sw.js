const CACHE = "alignerr-sim-v2";
const ASSETS = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", e=>{
  e.waitUntil(
    caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())
  );
});

self.addEventListener("activate", e=>{
  e.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener("fetch", e=>{
  const req = e.request;
  if(req.method !== "GET") return;
  // Navegación: siempre intentar red primero (versión más reciente), caché si no hay red
  if(req.mode === "navigate"){
    e.respondWith(
      fetch(req).then(res=>{
        const clone = res.clone();
        caches.open(CACHE).then(c=>c.put("./index.html", clone));
        return res;
      }).catch(()=>caches.match("./index.html"))
    );
    return;
  }
  // Recursos: caché primero, actualización en segundo plano
  e.respondWith(
    caches.match(req).then(cached=>{
      const net = fetch(req).then(res=>{
        if(res && res.ok){
          const clone = res.clone();
          caches.open(CACHE).then(c=>c.put(req, clone));
        }
        return res;
      }).catch(()=>cached);
      return cached || net;
    })
  );
});