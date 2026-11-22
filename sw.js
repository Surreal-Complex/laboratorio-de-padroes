'use strict';

const scope = new URL(self.registration.scope);
const cachePrefix = 'laboratorio-de-padroes:' + scope.pathname + ':';
const cacheName = cachePrefix + 'v1';
const assets = [
  './', 'index.html', 'explorar.html', 'fundamentos.html', 'jogos.html',
  'inicio.css', 'laboratorio.css', 'explorar.js', 'fundamentos.js', 'app.js',
  'manifest.webmanifest', 'icone-192.png', 'icone-512.png'
].map(path => new URL(path, scope).href);

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const responses = await Promise.all(assets.map(async url => {
      const response = await fetch(url, {cache:'reload', redirect:'error'});
      if (!response.ok) throw new Error('Não foi possível armazenar ' + url);
      return response;
    }));
    const cache = await caches.open(cacheName);
    await Promise.all(assets.map((url, index) => cache.put(url, responses[index])));
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(cachePrefix) && key !== cacheName).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  url.search = '';
  if (!assets.includes(url.href)) return;

  // Keep each offline release consistent while an older worker is active.
  event.respondWith((async () => {
    const cache = await caches.open(cacheName);
    return await cache.match(url.href) ?? fetch(event.request);
  })());
});
