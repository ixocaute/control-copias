// sw.js - Service Worker para Control de Copias
const CACHE_NAME = 'control-copias-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Instalación
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
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
  // No cachear las peticiones a Google Apps Script
  if (event.request.url.includes('script.google.com') || 
      event.request.url.includes('googleusercontent.com')) {
    return; // dejar pasar normal
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Guardar en caché una copia
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, clone);
        });
        return response;
      })
      .catch(() => {
        // Si no hay internet, servir del caché
        return caches.match(event.request)
          .then((cached) => cached || caches.match('./index.html'));
      })
  );
});
