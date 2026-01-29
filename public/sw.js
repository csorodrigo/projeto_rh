// Service Worker para PWA do Sistema RH
const CACHE_NAME = 'rh-sesame-v1';
const RUNTIME_CACHE = 'rh-sesame-runtime-v1';
const API_CACHE = 'rh-sesame-api-v1';

// Assets que devem ser cacheados na instalação
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/favicon.ico',
];

// Instalar Service Worker e fazer pre-cache
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching app shell');
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => {
      // Force o SW a se tornar ativo imediatamente
      return self.skipWaiting();
    })
  );
});

// Ativar Service Worker e limpar caches antigos
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME &&
              cacheName !== RUNTIME_CACHE &&
              cacheName !== API_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Assume o controle de todos os clientes imediatamente
      return self.clients.claim();
    })
  );
});

// Estratégia de cache para diferentes tipos de requisições
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requisições que não são HTTP/HTTPS
  if (!request.url.startsWith('http')) {
    return;
  }

  // Ignorar requisições de extensões do browser
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // API Calls - Network First com fallback para cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request, API_CACHE));
    return;
  }

  // Supabase Auth - Sempre da network
  if (url.hostname.includes('supabase')) {
    event.respondWith(fetch(request));
    return;
  }

  // Assets estáticos - Cache First
  if (request.destination === 'image' ||
      request.destination === 'font' ||
      request.destination === 'style' ||
      request.destination === 'script') {
    event.respondWith(cacheFirstStrategy(request, RUNTIME_CACHE));
    return;
  }

  // Navegação - Network First com offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstStrategy(request, RUNTIME_CACHE));
    return;
  }

  // Outras requisições - Network First
  event.respondWith(networkFirstStrategy(request, RUNTIME_CACHE));
});

// Cache First Strategy - Usa cache, fallback para network
async function cacheFirstStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('[SW] Fetch failed:', error);
    // Retornar página offline para navegação
    if (request.mode === 'navigate') {
      return caches.match('/') || new Response('Offline');
    }
    throw error;
  }
}

// Network First Strategy - Tenta network, fallback para cache
async function networkFirstStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);

  try {
    const response = await fetch(request);
    if (response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('[SW] Network failed, trying cache:', error);
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }

    // Se for navegação e não tem cache, retornar página offline
    if (request.mode === 'navigate') {
      return caches.match('/') || new Response('Você está offline');
    }

    throw error;
  }
}

// Background Sync para clock in/out pendentes
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);

  if (event.tag === 'sync-clock-entries') {
    event.waitUntil(syncClockEntries());
  }
});

async function syncClockEntries() {
  try {
    // Buscar entradas pendentes do IndexedDB
    const db = await openDatabase();
    const pendingEntries = await getPendingEntries(db);

    console.log('[SW] Syncing', pendingEntries.length, 'pending entries');

    for (const entry of pendingEntries) {
      try {
        const response = await fetch('/api/ponto/clock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry.data),
        });

        if (response.ok) {
          await removePendingEntry(db, entry.id);
          console.log('[SW] Entry synced:', entry.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync entry:', entry.id, error);
      }
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Push Notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push received');

  let data = { title: 'Sistema RH', body: 'Nova notificação' };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    data: data.data || {},
    actions: data.actions || [],
    tag: data.tag || 'default',
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification Click
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification.tag);
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Se já existe uma janela aberta, focar nela
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Caso contrário, abrir nova janela
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// IndexedDB helpers para queue de sincronização
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('rh-sesame-db', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pending-entries')) {
        db.createObjectStore('pending-entries', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

function getPendingEntries(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pending-entries'], 'readonly');
    const store = transaction.objectStore('pending-entries');
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function removePendingEntry(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pending-entries'], 'readwrite');
    const store = transaction.objectStore('pending-entries');
    const request = store.delete(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// Mensagens do cliente
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(RUNTIME_CACHE).then((cache) => {
        return cache.addAll(event.data.urls);
      })
    );
  }
});
