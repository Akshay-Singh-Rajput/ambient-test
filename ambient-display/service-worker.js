/**
 * service-worker.js — Offline cache for Ambient Display
 *
 * Cache strategy:
 *   - Versioned caches (ambient-display-v{version}) driven by cache-manifest.json
 *   - Install: precache manifest assets; reuse unchanged files from prior cache
 *   - Activate: delete stale version caches
 *   - Fetch: cache-first for shell assets; network-first for config/manifest
 */

/* global self, caches, fetch */

var CACHE_PREFIX = 'ambient-display-v';
var activeCacheName = null;

/**
 * Build the versioned cache bucket name.
 */
function buildCacheName(version) {
  return CACHE_PREFIX + version;
}

/**
 * Fetch an asset and store it in the given cache.
 */
function fetchAndPut(cache, assetUrl) {
  return fetch(assetUrl, { cache: 'reload' }).then(function (response) {
    if (response && response.ok) {
      return cache.put(assetUrl, response);
    }
  }).catch(function () {
    /* Offline during install — asset may already exist in a prior cache */
  });
}

/**
 * Precache manifest assets, copying unchanged files from the previous cache
 * so only new or modified assets hit the network.
 */
function precacheWithReuse(manifest) {
  var newCacheName = buildCacheName(manifest.version);
  var previousCacheName = null;

  return caches.keys().then(function (keys) {
    var i;
    var ambientKeys = [];

    for (i = 0; i < keys.length; i++) {
      if (keys[i].indexOf(CACHE_PREFIX) === 0 && keys[i] !== newCacheName) {
        ambientKeys.push(keys[i]);
      }
    }

    if (ambientKeys.length) {
      previousCacheName = ambientKeys[ambientKeys.length - 1];
    }

    return caches.open(newCacheName);
  }).then(function (newCache) {
    var tasks = [];
    var i;

    for (i = 0; i < manifest.assets.length; i++) {
      tasks.push(
        (function (url) {
          return newCache.match(url).then(function (hit) {
            if (hit) {
              return;
            }

            if (!previousCacheName) {
              return fetchAndPut(newCache, url);
            }

            return caches.open(previousCacheName).then(function (oldCache) {
              return oldCache.match(url).then(function (cached) {
                if (cached) {
                  return newCache.put(url, cached.clone());
                }

                return fetchAndPut(newCache, url);
              });
            });
          });
        }(manifest.assets[i]))
      );
    }

    return Promise.all(tasks).then(function () {
      activeCacheName = newCacheName;
      return newCacheName;
    });
  });
}

/**
 * Remove versioned caches that are not the active release.
 */
function purgeOldCaches(currentCacheName) {
  return caches.keys().then(function (keys) {
    var tasks = [];
    var i;

    for (i = 0; i < keys.length; i++) {
      if (keys[i].indexOf(CACHE_PREFIX) === 0 && keys[i] !== currentCacheName) {
        tasks.push(caches.delete(keys[i]));
      }
    }

    return Promise.all(tasks);
  });
}

/**
 * Resolve which cache bucket to read from.
 */
function resolveCacheName() {
  if (activeCacheName) {
    return Promise.resolve(activeCacheName);
  }

  return caches.keys().then(function (keys) {
    var i;
    var latest = null;

    for (i = 0; i < keys.length; i++) {
      if (keys[i].indexOf(CACHE_PREFIX) === 0) {
        latest = keys[i];
      }
    }

    activeCacheName = latest;
    return latest;
  });
}

/**
 * Cache-first: serve offline shell assets instantly.
 */
function cacheFirst(request) {
  return resolveCacheName().then(function (cacheName) {
    if (!cacheName) {
      return fetch(request);
    }

    return caches.open(cacheName).then(function (cache) {
      return cache.match(request).then(function (cached) {
        if (cached) {
          return cached;
        }

        return fetch(request).then(function (response) {
          if (response && response.ok) {
            cache.put(request, response.clone());
          }

          return response;
        });
      });
    });
  });
}

/**
 * Network-first: prefer fresh config; fall back to cache when offline.
 */
function networkFirst(request) {
  return resolveCacheName().then(function (cacheName) {
    return fetch(request).then(function (response) {
      if (response && response.ok && cacheName) {
        caches.open(cacheName).then(function (cache) {
          cache.put(request, response.clone());
        });
      }

      return response;
    }).catch(function () {
      if (!cacheName) {
        throw new Error('Offline and no cache available');
      }

      return caches.open(cacheName).then(function (cache) {
        return cache.match(request);
      });
    });
  });
}

/**
 * Determine whether a request targets config or the cache manifest.
 */
function isNetworkFirstAsset(url) {
  return url.indexOf('config.json') !== -1 || url.indexOf('cache-manifest.json') !== -1;
}

/**
 * Determine whether a request targets a static asset path.
 */
function isStaticAsset(url) {
  return url.indexOf('.css') !== -1 ||
    url.indexOf('.js') !== -1 ||
    url.indexOf('.html') !== -1 ||
    url.indexOf('/assets/') !== -1 ||
    url.indexOf('.png') !== -1 ||
    url.indexOf('.jpg') !== -1 ||
    url.indexOf('.jpeg') !== -1 ||
    url.indexOf('.gif') !== -1 ||
    url.indexOf('.webp') !== -1 ||
    url.indexOf('.svg') !== -1;
}

self.addEventListener('install', function (event) {
  event.waitUntil(
    fetch('./cache-manifest.json').then(function (response) {
      return response.json();
    }).then(function (manifest) {
      return precacheWithReuse(manifest);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    fetch('./cache-manifest.json').then(function (response) {
      return response.json();
    }).then(function (manifest) {
      var currentCacheName = buildCacheName(manifest.version);
      activeCacheName = currentCacheName;
      return purgeOldCaches(currentCacheName);
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function (event) {
  var request = event.request;

  if (request.method !== 'GET') {
    return;
  }

  var requestUrl = request.url;

  if (isNetworkFirstAsset(requestUrl)) {
    event.respondWith(networkFirst(request));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      cacheFirst(request).then(function (response) {
        if (response) {
          return response;
        }

        return cacheFirst(new Request('./index.html'));
      })
    );
    return;
  }

  if (isStaticAsset(requestUrl)) {
    event.respondWith(cacheFirst(request));
  }
});

self.addEventListener('message', function (event) {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
