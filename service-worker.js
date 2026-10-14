// ===== PHISHGUARD-TR SERVICE WORKER v18 =====
// Offline çalışma ve cache yönetimi

const CACHE_NAME = 'phishguard-v18';
const urlsToCache = [
    '/',
    '/index.html',
    '/turkey.svg',
    '/manifest.json'
];

// ===== KURULUM =====
self.addEventListener('install', (event) => {
    console.log('🛡️ PhishGuard Service Worker v18 kuruluyor...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('📦 Cache açıldı:', CACHE_NAME);
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                console.log('✅ Cache dolduruldu');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.log('❌ Cache hatası:', error);
            })
    );
});

// ===== AKTİVASYON =====
self.addEventListener('activate', (event) => {
    console.log('✅ PhishGuard Service Worker v18 aktif');
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
        }).then(() => {
            console.log('🧹 Eski cache temizlendi');
            return self.clients.claim();
        })
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
        url.includes('fonts.gstatic.com') ||
        url.includes('virustotal.com') ||
        url.includes('usom.gov.tr')) {
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

// ===== BİLDİRİM TIKLAMA =====
self.addEventListener('notificationclick', (event) => {
    console.log('🔔 Bildirime tıklandı');
    event.notification.close();
    event.waitUntil(
        clients.openWindow('/')
    );
});

// ===== MESAJ DİNLEYİCİ =====
self.addEventListener('message', (event) => {
    if (event.data && event.data.action === 'skipWaiting') {
        console.log('⏩ skipWaiting komutu alındı');
        self.skipWaiting();
    }
    if (event.data && event.data.action === 'clearCache') {
        console.log('🗑️ Cache temizleme komutu alındı');
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => caches.delete(cacheName))
            );
        });
    }
});

// ===== PUSH BİLDİRİMİ =====
self.addEventListener('push', (event) => {
    console.log('📩 Push bildirimi alındı');
    const data = event.data ? event.data.json() : {};
    const title = data.title || '🛡️ PhishGuard-TR';
    const options = {
        body: data.body || 'Yeni bir tehdit tespit edildi!',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        vibrate: [200, 100, 200],
        data: { url: data.url || '/' }
    };
    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

console.log('🛡️ PhishGuard-TR Service Worker v18 yüklendi');
