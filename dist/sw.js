let staticacheName = 'converta-static-v2';

self.addEventListener('install', (event) => {
    const urlsToCache = [
       '/',
        'bundle.js',
        'style.css'
    ];
    event.waitUntil(
        caches.open(staticacheName).then((cache) => {
            return cache.addAll(urlsToCache)
        })

    )
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.filter((cacheName) => {
                    return cacheName.startsWith('converta-') && cacheName != staticacheName;
                }).map((cacheName) => {
                    return caches.delete(cacheName);
                })
            );
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) =>{
            return response || fetch(event.request);
        })
    )
});

self.addEventListener('message', function(event) {
    if (event.data.action === 'skipWaiting') {
        self.registration.showNotification("New Version available", {
            actions: [{title: "refresh", title: "dismiss"}]
        });
    }
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    if (event.action === 'refresh') {
        self.skipWaiting();
    }
}, false);