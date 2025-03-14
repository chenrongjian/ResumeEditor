const CACHE_NAME = 'resume-editor-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/styles/main.css',
    '/styles/preview.css',
    '/scripts/theme.js',
    '/scripts/editor.js',
    '/scripts/preview.js',
    '/scripts/export.js',
    '/scripts/main.js',
    '/assets/favicon.ico',
    '/assets/site.webmanifest',
    '/assets/android-chrome-192x192.png',
    '/assets/android-chrome-512x512.png',
    '/assets/apple-touch-icon.png',
    '/assets/favicon-32x32.png',
    '/assets/favicon-16x16.png'
];

// 安装 Service Worker
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(ASSETS_TO_CACHE))
    );
});

// 激活 Service Worker
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// 处理请求
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response;
                }
                return fetch(event.request).then((response) => {
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, responseToCache);
                        });
                    return response;
                });
            })
    );
}); 