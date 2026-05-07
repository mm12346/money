const CACHE_NAME = 'calendar-money-pwa-v1';

// ไฟล์และทรัพยากรที่ต้องการให้แคชไว้สำหรับใช้งานออฟไลน์
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    'https://cdn.tailwindcss.com',
    'https://cdn.jsdelivr.net/npm/chart.js',
    'https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap',
    'https://raw.githubusercontent.com/mm12346/money/main/180.png'
];

// Install Event - เริ่มทำการแคชไฟล์
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate Event - เคลียร์แคชเวอร์ชันเก่าทิ้งเมื่อมีการอัปเดต
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch Event - ดึงข้อมูลจากแคชมาใช้ถ้าไม่มีเน็ต
self.addEventListener('fetch', event => {
    // ยกเว้นการแคชสำหรับ API ของ Google Sheets (เพื่อให้ดึงข้อมูลอัปเดตใหม่เสมอเมื่อมีเน็ต)
    if (event.request.url.includes('script.google.com')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // ถ้ามีข้อมูลในแคช ให้ใช้จากแคชเลย
                if (response) {
                    return response;
                }
                
                // ถ้าไม่มีในแคช ให้ดึงจาก Network
                return fetch(event.request).then(networkResponse => {
                    return networkResponse;
                }).catch(() => {
                    // กรณีออฟไลน์และไฟล์นั้นไม่ได้ถูกแคชไว้
                    console.log('Network request failed and no cache is available.');
                });
            })
    );
});
