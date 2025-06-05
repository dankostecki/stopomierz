const CACHE_NAME = 'stopomierz-v' + Date.now(); // Unikalny cache przy każdym deploymencie
const STATIC_CACHE = 'stopomierz-static-v' + Date.now();

// Statyczne pliki do cache (CSS, JS, fonts)
const STATIC_FILES = [
  '/styles.css',
  '/script.js',
  '/manifest.json'
];

// Pliki danych - ZAWSZE z sieci
const DATA_FILES = [
  '/nbp_rates.json',
  '/wibor_rates.json', 
  '/fra_rates.json'
];

// Install - natychmiast przejmij kontrolę
self.addEventListener('install', (event) => {
  // Skip waiting - natychmiast aktywuj nowy SW
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Caching static files');
        return cache.addAll(STATIC_FILES);
      })
  );
});

// Activate - wyczyść stare cache i przejmij kontrolę
self.addEventListener('activate', (event) => {
  // Natychmiast przejmij kontrolę nad wszystkimi klientami
  clients.claim();
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Usuń wszystkie stare cache oprócz aktualnego
          if (cacheName !== STATIC_CACHE && cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker activated and took control');
    })
  );
});

// Fetch - NETWORK FIRST strategy (zawsze próbuj z sieci)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Dla plików danych - ZAWSZE z sieci (wymagane połączenie)
  if (DATA_FILES.some(file => url.pathname.endsWith(file))) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          return response;
        })
        .catch((error) => {
          console.error('Network error for data file:', url.pathname, error);
          // Zwróć błąd - NIE używaj cache dla danych
          return new Response(
            JSON.stringify({ error: 'Brak połączenia z internetem' }), 
            { 
              status: 503, 
              headers: { 'Content-Type': 'application/json' }
            }
          );
        })
    );
    return;
  }
  
  // Dla plików statycznych - Network First z fallback do cache
  if (STATIC_FILES.some(file => url.pathname.endsWith(file))) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Zaktualizuj cache nowymi plikami
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback do cache tylko dla plików statycznych
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // Dla HTML i innych requestów - zawsze z sieci
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return new Response(
            `<!DOCTYPE html>
            <html>
            <head>
              <title>Brak połączenia</title>
              <meta charset="UTF-8">
              <style>
                body { font-family: Arial; text-align: center; padding: 50px; background: #0b1f3f; color: #fff; }
                h1 { color: #ffd700; }
              </style>
            </head>
            <body>
              <h1>Brak połączenia z internetem</h1>
              <p>Stopomierz wymaga połączenia z internetem aby pokazać aktualne dane.</p>
              <button onclick="location.reload()">Spróbuj ponownie</button>
            </body>
            </html>`,
            { 
              status: 503, 
              headers: { 'Content-Type': 'text/html' }
            }
          );
        })
    );
    return;
  }
  
  // Wszystko inne - domyślnie z sieci
  event.respondWith(fetch(event.request));
});

// Message handler - wymuszenie aktualizacji
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
