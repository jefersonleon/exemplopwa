const CACHE_NAME = 'cafe-pwa-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/style.css',
    '/script.js',
    '/manifest.json',
    'https://fonts.googleapis.com/css2?family=Segoe+UI:wght@400;500;700&display=swap'
];

// Instalação do Service Worker
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Cache aberto');
                return cache.addAll(urlsToCache);
            })
    );
});

// Ativação e limpeza de caches antigos
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Estratégia de cache: Stale-While-Revalidate
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Retorna do cache se encontrado
                if (response) {
                    // Atualiza o cache em background
                    fetch(event.request)
                        .then(newResponse => {
                            caches.open(CACHE_NAME)
                                .then(cache => {
                                    cache.put(event.request, newResponse);
                                });
                        })
                        .catch(() => {});
                    
                    return response;
                }

                // Se não está no cache, busca da rede
                return fetch(event.request)
                    .then(response => {
                        // Verifica se é uma resposta válida
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Clona a resposta
                        const responseToCache = response.clone();

                        // Adiciona ao cache
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    })
                    .catch(() => {
                        // Se falhou a rede e não está no cache, retorna página offline
                        if (event.request.url.indexOf('.html') > -1) {
                            return caches.match('/offline.html');
                        }
                    });
            })
    );
});

// Sincronização em background (simples)
self.addEventListener('sync', event => {
    if (event.tag === 'sync-data') {
        event.waitUntil(syncData());
    }
});

async function syncData() {
    // Aqui você pode implementar sincronização de dados
    console.log('Sincronizando dados em background...');
}

// Notificações push (exemplo)
self.addEventListener('push', event => {
    const options = {
        body: event.data ? event.data.text() : 'Nova notificação',
        icon: 'icons/icon-192x192.png',
        badge: 'icons/icon-72x72.png',
        vibrate: [200, 100, 200]
    };

    event.waitUntil(
        self.registration.showNotification('Café Gourmet', options)
    );
});