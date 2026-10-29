// sw.js - Service Worker para Control de Copias
const CACHE_NAME = 'control-copias-v3';
const ASSETS = [
  './',
  './index.html',
  './manifest.json'  
];

// Instalación
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // Intentamos cachear, pero no fallamos si faltan iconos
        return Promise.allSettled(
          ASSETS.map(url => cache.add(url).catch(() => null))
        );
      })
      .then(() => self.skipWaiting())
  );
});

// Activación (limpia cachés viejos)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Estrategia: Network first, fallback a cache
self.addEventListener('fetch', (event) => {
  // No interferir con las peticiones a Google Apps Script
  if (event.request.url.includes('script.google.com') ||
      event.request.url.includes('googleusercontent.com') ||
      event.request.url.includes('macros/s/')) {
    return; // dejar pasar normal (no cachear)
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Guardar en caché una copia (solo GET exitosos)
        if (event.request.method === 'GET' && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
        }
        return response;
      })
      .catch(() => {
        // Si no hay internet, servir del caché
        return caches.match(event.request)
          .then((cached) => cached || caches.match('./index.html'));
      })
  );
});
