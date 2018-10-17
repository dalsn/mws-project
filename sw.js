let cacheName = 'restaurantReview-v3';

let filesToCache = [
	'./',
	'./index.html',
	'./restaurant.html',
	'./js/main.js',
	'./js/restaurant_info.js',
	'./js/db.js',
	'./css/styles.css',
	'https://unpkg.com/leaflet@1.3.1/dist/leaflet.css',
	'https://unpkg.com/leaflet@1.3.1/dist/leaflet.js'
];

self.addEventListener('install', (e) => {
	console.log('[ServiceWorker] Installed');
	e.waitUntil(
		caches.open(cacheName).then((cache) => {
			return cache.addAll(filesToCache);
		})
	);
});


/*
* check for a response for request in cache
* otherwise request resource over network and cache response
*/
self.addEventListener('fetch', (e) => {
	let requestUrl = new URL(e.request.url);
	if (requestUrl.protocol.startsWith('http')) {
		e.respondWith(
			caches.open(cacheName)
			.then((cache) => {
				return cache.match(e.request, { ignoreSearch: true }).then((response) => {
					if (response) {
						return response;
					}

					return fetch(e.request).then((networkResponse) => {
						cache.put(e.request, networkResponse.clone());
						return networkResponse;
					})
				})
			})
		);
	}
});
