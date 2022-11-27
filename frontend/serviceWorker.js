"use strict";
const CACHE_KEY = "musixV1";
self.addEventListener("install", () => {
    console.log("Power Adapter: Service worker installation successful");
});
self.addEventListener("activate", () => {
    caches.keys().then((keys) => {
        for (const key of keys) {
            if (key !== CACHE_KEY) {
                caches.delete(key);
            }
        }
        console.log("Power Adapter: Service worker activation successful");
    });
});
self.addEventListener("fetch", (e) => {
    return e.respondWith(caches.open(CACHE_KEY).then(cache => {
        return cache.match(e.request).then(cachedRes => {
            if (cachedRes) {
                return cachedRes;
            }
            else {
                return fetch(e.request).then(fetchedRes => {
                    return fetchedRes;
                }).catch(err => {
                    return new Response(JSON.stringify({
                        status: false,
                        error: {
                            title: "Fetching failed",
                            message: err,
                        }
                    }));
                });
            }
        });
    }));
});