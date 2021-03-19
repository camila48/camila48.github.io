'use strict';
const MANIFEST = 'flutter-app-manifest';
const TEMP = 'flutter-temp-cache';
const CACHE_NAME = 'flutter-app-cache';
const RESOURCES = {
  "index.html": "8788587a03df918d249a2c48f2700ddd",
"/": "8788587a03df918d249a2c48f2700ddd",
"icons/Icon-512.png": "96e752610906ba2a93c65f8abe1645f1",
"icons/Icon-192.png": "ac9a721a12bbc803b44f645561ecb1e1",
"assets/packages/cupertino_icons/assets/CupertinoIcons.ttf": "b14fcf3ee94e3ace300b192e9e7c8c5d",
"assets/fonts/MaterialIcons-Regular.otf": "1288c9e28052e028aba623321f7826ac",
"assets/assets/fonts/ubuntu-light.ttf": "8571edb1bb4662f1cdba0b80ea0a1632",
"assets/assets/fonts/ubuntu-regular.ttf": "1c5965c2b1dcdea439b54c3ac60cee38",
"assets/assets/fonts/ubuntu-bold.ttf": "e0008b580192405f144f2cb595100969",
"assets/assets/utils/results.json": "6ec49cd539d34ee0dfd539f5e4138b51",
"assets/assets/images/people.png": "213ddd1be62f717b22a0bc829ed099bc",
"assets/assets/images/document.png": "b47b5ce4b69a80157d1e0d592993dff8",
"assets/assets/images/img6.png": "57875045ae4edadf365a5696aa4b4bff",
"assets/assets/images/img3.png": "bd499360ad5b0cebcd0c0d93e98ec628",
"assets/assets/images/logo.png": "0d04c5bf5a4310cf06375d784fe124d6",
"assets/assets/images/autor3.jpg": "a71af7a2286fb9651c13955a4f6f6bd2",
"assets/assets/images/end.png": "56dcd12ad5edf6d1f2246c0fac551244",
"assets/assets/images/autor2.jpg": "8cdda29dc38591cb7f9eabbe27f0ee94",
"assets/assets/images/logo2.png": "13ce0f583d4c0b244ff0eada30fd1a6b",
"assets/assets/images/phone.png": "dfefc9012d56070ab09bff92b069f383",
"assets/assets/images/autor1.jpg": "03059c12126ce9810766b2aab10e80f8",
"assets/assets/images/img1.png": "2414ca5b5a233f9031f5056a8bd08520",
"assets/assets/images/img4.png": "bab45fa1a4ce1388d747ee689d5ff673",
"assets/assets/images/img5.png": "b34038cecedae86ab57e20bd5c744586",
"assets/assets/images/menu.png": "ec532fc898449d0b93f1bdf6562cd708",
"assets/assets/images/img2.png": "379305120ed26e170ec05930c5789c4a",
"assets/assets/images/pense.png": "1d82753b4a126e74db51087b8d7494c4",
"assets/assets/locale/pt.json": "662a2ba49fc5dce2f66ab12be44f8707",
"assets/NOTICES": "067eb94c99ec4dd457a11631a8a64e59",
"assets/AssetManifest.json": "adc52967912880c08dac7790debd78f5",
"assets/FontManifest.json": "389ed8e4a5599ce23bcb3358bfbc415e",
"main.dart.js": "ffc0817e3c4eac0d8235278988e5cdd2",
"manifest.json": "e9a65b5a00e93c34104b0041f268412d",
"version.json": "7bb3c52a3547d61f8deca9da756f0bb9",
"favicon.png": "5dcef449791fa27946b3d35ad8803796"
};

// The application shell files that are downloaded before a service worker can
// start.
const CORE = [
  "/",
"main.dart.js",
"index.html",
"assets/NOTICES",
"assets/AssetManifest.json",
"assets/FontManifest.json"];
// During install, the TEMP cache is populated with the application shell files.
self.addEventListener("install", (event) => {
  self.skipWaiting();
  return event.waitUntil(
    caches.open(TEMP).then((cache) => {
      return cache.addAll(
        CORE.map((value) => new Request(value + '?revision=' + RESOURCES[value], {'cache': 'reload'})));
    })
  );
});

// During activate, the cache is populated with the temp files downloaded in
// install. If this service worker is upgrading from one with a saved
// MANIFEST, then use this to retain unchanged resource files.
self.addEventListener("activate", function(event) {
  return event.waitUntil(async function() {
    try {
      var contentCache = await caches.open(CACHE_NAME);
      var tempCache = await caches.open(TEMP);
      var manifestCache = await caches.open(MANIFEST);
      var manifest = await manifestCache.match('manifest');
      // When there is no prior manifest, clear the entire cache.
      if (!manifest) {
        await caches.delete(CACHE_NAME);
        contentCache = await caches.open(CACHE_NAME);
        for (var request of await tempCache.keys()) {
          var response = await tempCache.match(request);
          await contentCache.put(request, response);
        }
        await caches.delete(TEMP);
        // Save the manifest to make future upgrades efficient.
        await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
        return;
      }
      var oldManifest = await manifest.json();
      var origin = self.location.origin;
      for (var request of await contentCache.keys()) {
        var key = request.url.substring(origin.length + 1);
        if (key == "") {
          key = "/";
        }
        // If a resource from the old manifest is not in the new cache, or if
        // the MD5 sum has changed, delete it. Otherwise the resource is left
        // in the cache and can be reused by the new service worker.
        if (!RESOURCES[key] || RESOURCES[key] != oldManifest[key]) {
          await contentCache.delete(request);
        }
      }
      // Populate the cache with the app shell TEMP files, potentially overwriting
      // cache files preserved above.
      for (var request of await tempCache.keys()) {
        var response = await tempCache.match(request);
        await contentCache.put(request, response);
      }
      await caches.delete(TEMP);
      // Save the manifest to make future upgrades efficient.
      await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
      return;
    } catch (err) {
      // On an unhandled exception the state of the cache cannot be guaranteed.
      console.error('Failed to upgrade service worker: ' + err);
      await caches.delete(CACHE_NAME);
      await caches.delete(TEMP);
      await caches.delete(MANIFEST);
    }
  }());
});

// The fetch handler redirects requests for RESOURCE files to the service
// worker cache.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== 'GET') {
    return;
  }
  var origin = self.location.origin;
  var key = event.request.url.substring(origin.length + 1);
  // Redirect URLs to the index.html
  if (key.indexOf('?v=') != -1) {
    key = key.split('?v=')[0];
  }
  if (event.request.url == origin || event.request.url.startsWith(origin + '/#') || key == '') {
    key = '/';
  }
  // If the URL is not the RESOURCE list then return to signal that the
  // browser should take over.
  if (!RESOURCES[key]) {
    return;
  }
  // If the URL is the index.html, perform an online-first request.
  if (key == '/') {
    return onlineFirst(event);
  }
  event.respondWith(caches.open(CACHE_NAME)
    .then((cache) =>  {
      return cache.match(event.request).then((response) => {
        // Either respond with the cached resource, or perform a fetch and
        // lazily populate the cache.
        return response || fetch(event.request).then((response) => {
          cache.put(event.request, response.clone());
          return response;
        });
      })
    })
  );
});

self.addEventListener('message', (event) => {
  // SkipWaiting can be used to immediately activate a waiting service worker.
  // This will also require a page refresh triggered by the main worker.
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
    return;
  }
  if (event.data === 'downloadOffline') {
    downloadOffline();
    return;
  }
});

// Download offline will check the RESOURCES for all files not in the cache
// and populate them.
async function downloadOffline() {
  var resources = [];
  var contentCache = await caches.open(CACHE_NAME);
  var currentContent = {};
  for (var request of await contentCache.keys()) {
    var key = request.url.substring(origin.length + 1);
    if (key == "") {
      key = "/";
    }
    currentContent[key] = true;
  }
  for (var resourceKey of Object.keys(RESOURCES)) {
    if (!currentContent[resourceKey]) {
      resources.push(resourceKey);
    }
  }
  return contentCache.addAll(resources);
}

// Attempt to download the resource online before falling back to
// the offline cache.
function onlineFirst(event) {
  return event.respondWith(
    fetch(event.request).then((response) => {
      return caches.open(CACHE_NAME).then((cache) => {
        cache.put(event.request, response.clone());
        return response;
      });
    }).catch((error) => {
      return caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response != null) {
            return response;
          }
          throw error;
        });
      });
    })
  );
}
