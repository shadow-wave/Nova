const CACHE_NAME = 'nova-studio-v2';
​const STATIC_ASSETS = [
'./',
'./index.html',
'./manifest.json',
'./icon.svg',
'https://cdn.tailwindcss.com',
'https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.24.0/babel.min.js',
'https://unpkg.com/lucide@latest',
'https://unpkg.com/react@18/umd/react.production.min.js',
'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js'
];
​// Install: Cache critical core assets and CDN bundles
self.addEventListener('install', (event) => {
event.waitUntil(
caches.open(CACHE_NAME).then((cache) => {
return cache.addAll(STATIC_ASSETS).catch((err) => {
console.warn('Cache addAll non-fatal warning:', err);
});
}).then(() => self.skipWaiting())
);
});
​// Activate: Purge obsolete caches and claim clients immediately
self.addEventListener('activate', (event) => {
event.waitUntil(
caches.keys().then((keys) => {
return Promise.all(
keys.map((key) => {
if (key !== CACHE_NAME) {
return caches.delete(key);
}
})
);
}).then(() => self.clients.claim())
);
});
​// Fetch: Stale-While-Revalidate with robust offline fallback
self.addEventListener('fetch', (event) => {
// Only intercept GET requests
if (event.request.method !== 'GET') return;
​const url = new URL(event.request.url);
​// Exclude blob: and data: URLs used inside preview iframes
if (url.protocol === 'blob:' || url.protocol === 'data:') return;
​event.respondWith(
caches.match(event.request).then((cachedResponse) => {
if (cachedResponse) {
// Fetch background update for static assets
fetch(event.request).then((networkResponse) => {
if (networkResponse && networkResponse.status === 200) {
caches.open(CACHE_NAME).then((cache) => {
cache.put(event.request, networkResponse);
});
}
}).catch(() => {});
return cachedResponse;
}
​// If not cached, fetch over network and cache the response
return fetch(event.request).then((networkResponse) => {
if (!networkResponse || networkResponse.status !== 200) {
return networkResponse;
}
​const responseClone = networkResponse.clone();
caches.open(CACHE_NAME).then((cache) => {
cache.put(event.request, responseClone);
});
​return networkResponse;
}).catch(() => {
// Fallback to index.html for navigation requests when offline
if (event.request.mode === 'navigate') {
return caches.match('./index.html') || caches.match('./');
}
});
})
);
});
