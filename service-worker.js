// Abacus Practice Service Worker
const VERSION = '1.0.0';
const CACHE_NAME = `abacus-practice-v${VERSION}`;
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js',
  '/data-manager.js',
  '/manifest.json',
  '/offline.html',
  '/abacus.png'
];

// Log with timestamp
function logWithTime(message) {
  console.log(`[ServiceWorker ${VERSION}] ${new Date().toISOString()}: ${message}`);
}

// Install event - cache all static assets
self.addEventListener('install', (event) => {
  logWithTime('Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        logWithTime('Caching app shell and assets');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => {
        logWithTime('Skip waiting on install');
        return self.skipWaiting();
      })
      .catch(error => {
        logWithTime(`Failed to cache assets: ${error}`);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  logWithTime('Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            logWithTime(`Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      logWithTime('Claiming clients');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache, fall back to network
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  // Skip analytics and other non-essential requests
  if (
    event.request.url.includes('google-analytics.com') || 
    event.request.url.includes('analytics') ||
    event.request.url.includes('/api/')
  ) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        
        // Clone the request as it's a one-time use stream
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest)
          .then((response) => {
            // Check if valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone the response as it's a one-time use stream
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then((cache) => {
                // Only cache GET requests
                if (event.request.method === 'GET') {
                  cache.put(event.request, responseToCache);
                }
              });
              
            return response;
          })
          .catch((error) => {
            logWithTime(`Fetch failed: ${error}`);
            
            // If fetch fails (offline), show offline page for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match('/offline.html');
            }
            
            // For non-HTML requests return a simple offline response
            return new Response('App is offline');
          });
      })
  );
}); 