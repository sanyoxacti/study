const CACHE_NAME = 'study-for-na-cache-v1';
const APP_SHELL_URLS = [
  '/',
  './index.html',
  './index.tsx',
  './types.ts',
  './constants.ts',
  './App.tsx',
  './hooks/useLocalStorage.ts',
  './components/Icons.tsx',
  './components/SubjectManager.tsx',
  './components/ScheduleBlockModal.tsx',
  './components/DistractionLog.tsx',
  './components/Scheduler.tsx',
  './components/Clock.tsx',
  './components/TodoList.tsx',
  './components/Statistics.tsx',
  './components/BottomNavBar.tsx',
  './components/GoalManager.tsx'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache and caching app shell');
        return cache.addAll(APP_SHELL_URLS);
      })
      .catch(err => {
        console.error('Failed to cache app shell:', err);
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request).then(response => {
        const fetchPromise = fetch(event.request).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(error => {
          console.warn('Fetch failed; using cached version if available.', error);
        });
        return response || fetchPromise;
      });
    })
  );
});
