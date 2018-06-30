let staticacheName = 'converta-static-v3';

self.addEventListener('install', (event) => {
    const urlsToCache = [
       '/',
        '/converta',
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

const handleErrors = (response) => {
    if(!response) {
        throw Error(response.statusText);
    }
    return response;
};

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) =>{
            console.log(response);
            return response || fetch(event.request).then(handleErrors)
                .catch((error) => {console.log(error)});
        })
    )
});



self.addEventListener('load', function() {
    navigator.serviceWorker.register('sw.js').catch(function(error) {
        self.registration.showNotification("Please clear some space on your device");
    });
});

self.addEventListener('message', function(event) {
    if (event.data.action === 'skipWaiting') {
        self.registration.showNotification("New Version available", {
            actions: [{action: "refresh", title: "refresh"}, {action:"dismiss", title:"dismiss"}]
        });
    }
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    if (event.action === 'refresh') {
        self.skipWaiting();
    }
    }, false);