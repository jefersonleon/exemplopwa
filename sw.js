const CACHE_NAME = 'cafe-pwa-v2';
const DYNAMIC_CACHE = 'cafe-dynamic-v2';

const urlsToCache = [
    './',
    './index.html',
    './css/style.css',
    './js/script.js',
    './js/install.js',
    './manifest.json',
    './icons/favicon.png'
];

// Instalação do Service Worker
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Arquivos em cache na instalação');
                return cache.addAll(urlsToCache);
            })
    );
    // Força o SW a se tornar ativo imediatamente
    self.skipWaiting();
});

// Ativação do Service Worker
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE) {
                        console.log('Limpando cache antigo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Interceptando requisições (Estratégia Stale-While-Revalidate com Network Fallback)
self.addEventListener('fetch', event => {
    const requestUrl = new URL(event.request.url);

    // Ignorar requisições não-GET (como POST) e extensões do Chrome
    if (event.request.method !== 'GET' || requestUrl.protocol === 'chrome-extension:') {
        return;
    }

    // Se a requisição for de fontes do Google ou imagens do Unsplash, usar cache dinâmico com Stale-While-Revalidate
    if (requestUrl.hostname.includes('fonts.googleapis.com') ||
        requestUrl.hostname.includes('fonts.gstatic.com') ||
        requestUrl.hostname.includes('unsplash.com')) {

        event.respondWith(
            caches.match(event.request).then(cachedResponse => {
                const networkFetch = fetch(event.request).then(networkResponse => {
                    // Salvar no cache dinâmico
                    const responseClone = networkResponse.clone();
                    caches.open(DYNAMIC_CACHE).then(cache => {
                        cache.put(event.request, responseClone);
                    });
                    return networkResponse;
                }).catch(() => {
                    // Falha silenciosa no fetch dinâmico se offline
                });

                // Retornar do cache imediatamente, ou esperar a rede se não estiver no cache
                return cachedResponse || networkFetch;
            })
        );
        return;
    }

    // Para arquivos estáticos do próprio site (index.html, css, js) - Cache First
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Se estiver no cache, retorna do cache
                if (response) {
                    return response;
                }
                // Senão, busca na rede e salva no cache estático
                return fetch(event.request).then(networkResponse => {
                    // Não armazena respostas ruins
                    if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                        return networkResponse;
                    }
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(event.request, responseToCache);
                        });
                    return networkResponse;
                });
            })
            .catch(() => {
                // Se der erro na rede (offline) e for requisição de página (navegação), retorna a index com fallback
                if (event.request.mode === 'navigate') {
                    return caches.match('./index.html');
                }
            })
    );
});
