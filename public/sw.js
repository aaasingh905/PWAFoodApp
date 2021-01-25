const staticCacheName = 'site-static-v4';
const dynamicCacheName = 'site-dynamic-v4';
const assets =[
    '/',
    '/index.html',
    '/js/app.js',
    '/js/ui.js',
    '/js/materialize.min.js',
    '/css/materialize.min.css',
    '/css/styles.css',
    '/img/dish.png',
    'https://fonts.googleapis.com/icon?family=Material+Icons',
    '/pages/fallback.html',
    'https://fonts.gstatic.com/s/materialicons/v70/flUhRq6tzZclQEJ-Vdg-IuiaDsNc.woff2'
]

// cache size limit function
const limitCacheSize =  (name, size) => {
  cache.open(name).then(cache => {
    cache.keys().then(keys => {
      if(keys.length>size){
        cache.delete(keys[0]).then(limitCacheSize(name,size))
      }

    })
  })
}
self.addEventListener('install', event => {
    console.log("[sw.js] Install event.");
    event.waitUntil(
        caches.open(staticCacheName)
            .then(cache => {
                cache.addAll(assets)})
            .then(self.skipWaiting())
            .catch(err => console.error("[sw.js] Error trying to pre-fetch cache files:", err))
    );
});


self.addEventListener('activate', evt => {
    evt.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(keys
                .filter(key => key !== staticCacheName && key !== dynamicCacheName)
                .map(key=>caches.delete(key)))
        })
    )
} )

//Events fetch
self.addEventListener('fetch', evt => {
  if(evt.request.url.indexOf('firestore.googleapis.com') === -1){
    evt.respondWith(
      caches.match(evt.request).then(cacheRes => {
        return cacheRes || fetch(evt.request).then(fetchRes => {
          return caches.open(dynamicCacheName).then(cache => {
            cache.put(evt.request.url, fetchRes.clone());
            // check cached items size
            limitCacheSize(dynamicCacheName, 15);
            return fetchRes;
          })
        });
      }).catch(() => {
        if(evt.request.url.indexOf('.html') > -1){
          return caches.match('/pages/fallback.html');
        } 
      })
    );
  }
  });