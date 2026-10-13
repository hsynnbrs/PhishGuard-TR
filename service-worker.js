// ===== PHISHGUARD-TR SERVICE WORKER =====
// Offline çalışma ve cache yönetimi

const CACHE_NAME = 'phishguard-v17';
const urlsToCache = [
    '/',
    '/index.html',
    '/turkey.svg',
    '/manifest.json'
];

// ===== KURULUM =====
self.addEventListener('install', (event) => {
    console.log('🛡️ PhishGuard Service Worker kuruluyor...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('📦 Cache açıldı');
                return cache.addAll(urlsToCache);
            })
            .then(() => self.skipWaiting())
    );
});

// ===== AKTİVASYON =====
self.addEventListener('activate', (event) => {
    console.log('✅ PhishGuard Service Worker aktif');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ Eski cache siliniyor:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// ===== FETCH (İSTEK YAKALAMA) =====
self.addEventListener('fetch', (event) => {
    // Sadece GET isteklerini yakala
    if (event.request.method !== 'GET') return;
    
    // Harici CDN'leri cache'leme
    const url = event.request.url;
    if (url.includes('cdn.jsdelivr.net') || 
        url.includes('fonts.googleapis.com') || 
        url.includes('fonts.gstatic.com')) {
        return;
    }
    
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Cache'de varsa onu döndür
                if (response) {
                    return response;
                }
                
                // Yoksa network'ten al
                return fetch(event.request).then((response) => {
                    // Geçersiz yanıtları cache'leme
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }
                    
                    // Yanıtı klonla ve cache'e ekle
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, responseToCache);
                        });
                    
                    return response;
                }).catch(() => {
                    // Offline ise ve cache'de yoksa
                    if (event.request.destination === 'document') {
                        return caches.match('/index.html');
                    }
                });
            })
    );
});

// ===== BİLDİRİM =====
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow('/')
    );
});

// ===== MESAJ DİNLEYİCİ =====
self.addEventListener('message', (event) => {
    if (event.data && event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
});
