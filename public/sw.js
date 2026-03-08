const CACHE_NAME = 'bauplan-buddy-v2';
const STATIC_CACHE = 'bauplan-buddy-static-v2';
const DYNAMIC_CACHE = 'bauplan-buddy-dynamic-v2';
const DATA_CACHE = 'bauplan-buddy-data-v2';

// Static resources to cache
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/robots.txt'
];

// App routes to cache
const APP_ROUTES = [
  '/',
  '/dashboard',
  '/projects',
  '/calendar',
  '/quotes',
  '/invoices',
  '/customers',
  '/documents',
  '/teams',
  '/analytics',
  '/admin'
];

// API endpoints to cache with strategies
const API_CACHE_CONFIG = {
  '/api/projects': { strategy: 'networkFirst', maxAge: 5 * 60 * 1000 }, // 5 minutes
  '/api/customers': { strategy: 'networkFirst', maxAge: 10 * 60 * 1000 }, // 10 minutes
  '/api/invoices': { strategy: 'networkFirst', maxAge: 2 * 60 * 1000 }, // 2 minutes
  '/api/appointments': { strategy: 'networkFirst', maxAge: 1 * 60 * 1000 }, // 1 minute
  '/api/teams': { strategy: 'cacheFirst', maxAge: 30 * 60 * 1000 }, // 30 minutes
  '/api/documents': { strategy: 'networkFirst', maxAge: 5 * 60 * 1000 }
};

const OFFLINE_PAGE = '/offline.html';
const OFFLINE_DATA = { message: 'Offline mode - cached data only', timestamp: Date.now() };

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing v2...');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE)
        .then((cache) => {
          console.log('Service Worker: Caching static assets');
          return cache.addAll(STATIC_ASSETS);
        }),
      
      // Cache app routes
      caches.open(CACHE_NAME)
        .then((cache) => {
          console.log('Service Worker: Caching app routes');
          return cache.addAll(APP_ROUTES);
        })
    ])
    .then(() => {
      console.log('Service Worker: Installation complete');
      // Do not call skipWaiting automatically; wait for user confirmation
    })
    .catch((error) => {
      console.error('Service Worker: Installation failed:', error);
    })
  );
});

// Activate event - clean old caches and claim clients
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating v2...');
  
  const expectedCaches = [CACHE_NAME, STATIC_CACHE, DYNAMIC_CACHE, DATA_CACHE];
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!expectedCaches.includes(cacheName)) {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Initialize IndexedDB for offline data
      initializeOfflineDB(),
      
      // Claim all clients
      self.clients.claim()
    ])
    .then(() => {
      console.log('Service Worker: Activation complete');
    })
    .catch((error) => {
      console.error('Service Worker: Activation failed:', error);
    })
  );
});

// Fetch event - advanced caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip cross-origin requests unless they're API calls
  if (!url.origin.includes(self.location.origin) && !url.pathname.startsWith('/api/')) {
    return;
  }
  
  // Skip Vite development requests
  if (isDevelopmentRequest(url)) {
    return;
  }
  
  // Handle different request types
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
  } else if (isNavigationRequest(request)) {
    event.respondWith(handleNavigationRequest(request));
  } else if (isStaticAsset(url)) {
    event.respondWith(handleStaticAsset(request));
  } else {
    event.respondWith(handleDynamicRequest(request));
  }
});

// Background sync for offline data
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(syncOfflineData());
  } else if (event.tag === 'backup-sync') {
    event.waitUntil(performBackup());
  }
});

// Enhanced push notifications
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received');
  
  let notificationData;
  try {
    notificationData = event.data ? event.data.json() : {};
  } catch (e) {
    notificationData = { title: 'Bauplan Buddy', body: event.data ? event.data.text() : 'Neue Benachrichtigung' };
  }
  
  const options = {
    body: notificationData.body || 'Bauplan Buddy Update',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    image: notificationData.image,
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: notificationData.id || Math.random(),
      url: notificationData.url || '/'
    },
    actions: [
      {
        action: 'explore',
        title: 'Öffnen',
        icon: '/favicon.ico'
      },
      {
        action: 'close',
        title: 'Schließen',
        icon: '/favicon.ico'
      }
    ],
    tag: notificationData.tag || 'general',
    renotify: true,
    requireInteraction: notificationData.urgent || false
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title || 'Bauplan Buddy', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked:', event.action);
  event.notification.close();

  if (event.action === 'explore') {
    const urlToOpen = event.notification.data.url || '/';
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // Check if the app is already open
          for (const client of clientList) {
            if (client.url.includes(self.location.origin) && 'focus' in client) {
              return client.focus().then(() => client.navigate(urlToOpen));
            }
          }
          // If no window is open, open a new one
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        })
    );
  }
});

// Helper functions
function isDevelopmentRequest(url) {
  return url.pathname.includes('/@vite/') ||
         url.pathname.includes('/@react-refresh') ||
         url.pathname.includes('/@fs/') ||
         url.pathname.includes('/@id/') ||
         url.search.includes('?t=') ||
         url.pathname.endsWith('.tsx') ||
         url.pathname.endsWith('.ts') ||
         url.pathname.endsWith('.jsx');
}

function isNavigationRequest(request) {
  return request.mode === 'navigate' || 
         (request.method === 'GET' && request.headers.get('accept').includes('text/html'));
}

function isStaticAsset(url) {
  const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.svg', '.ico', '.woff', '.woff2', '.ttf'];
  return staticExtensions.some(ext => url.pathname.endsWith(ext));
}

// Request handlers
async function handleApiRequest(request) {
  const url = new URL(request.url);
  const config = getApiCacheConfig(url.pathname);
  
  if (!config) {
    return fetch(request).catch(() => 
      new Response(JSON.stringify(OFFLINE_DATA), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      })
    );
  }
  
  if (config.strategy === 'networkFirst') {
    return networkFirst(request, DATA_CACHE, config.maxAge);
  } else if (config.strategy === 'cacheFirst') {
    return cacheFirst(request, DATA_CACHE, config.maxAge);
  }
  
  return fetch(request);
}

async function handleNavigationRequest(request) {
  try {
    // Try network first for navigation
    const response = await fetch(request);
    
    // Cache successful responses
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Fall back to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fall back to app shell
    return caches.match('/') || new Response('Offline', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

async function handleStaticAsset(request) {
  return cacheFirst(request, STATIC_CACHE);
}

async function handleDynamicRequest(request) {
  return networkFirst(request, DYNAMIC_CACHE);
}

// Caching strategies
async function networkFirst(request, cacheName, maxAge) {
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(cacheName);
      const responseToCache = response.clone();
      
      // Add timestamp for cache expiration
      const responseWithTimestamp = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: {
          ...Object.fromEntries(responseToCache.headers),
          'sw-cache-timestamp': Date.now().toString()
        }
      });
      
      cache.put(request, responseWithTimestamp);
    }
    
    return response;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse && isCacheValid(cachedResponse, maxAge)) {
      console.log('Service Worker: Serving from cache (network failed):', request.url);
      return cachedResponse;
    }
    
    throw error;
  }
}

async function cacheFirst(request, cacheName, maxAge) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse && isCacheValid(cachedResponse, maxAge)) {
    console.log('Service Worker: Serving from cache:', request.url);
    return cachedResponse;
  }
  
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    if (cachedResponse) {
      console.log('Service Worker: Serving stale cache (network failed):', request.url);
      return cachedResponse;
    }
    throw error;
  }
}

function isCacheValid(response, maxAge) {
  if (!maxAge) return true;
  
  const timestamp = response.headers.get('sw-cache-timestamp');
  if (!timestamp) return true;
  
  return (Date.now() - parseInt(timestamp)) < maxAge;
}

function getApiCacheConfig(pathname) {
  for (const [pattern, config] of Object.entries(API_CACHE_CONFIG)) {
    if (pathname.startsWith(pattern)) {
      return config;
    }
  }
  return null;
}

// Initialize IndexedDB for offline data
async function initializeOfflineDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('BauplanBuddyOffline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create object stores
      if (!db.objectStoreNames.contains('actions')) {
        const actionStore = db.createObjectStore('actions', { keyPath: 'id' });
        actionStore.createIndex('status', 'status', { unique: false });
        actionStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
      
      if (!db.objectStoreNames.contains('cache')) {
        const cacheStore = db.createObjectStore('cache', { keyPath: 'key' });
        cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

// Enhanced sync offline data function
async function syncOfflineData() {
  console.log('Service Worker: Starting offline data sync');
  
  try {
    const db = await initializeOfflineDB();
    const transaction = db.transaction(['actions'], 'readonly');
    const store = transaction.objectStore('actions');
    const index = store.index('status');
    
    // Get all pending actions
    const pendingActions = await new Promise((resolve, reject) => {
      const request = index.getAll('pending');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    console.log(`Service Worker: Found ${pendingActions.length} pending actions`);
    
    // Process each action
    for (const action of pendingActions) {
      try {
        const success = await syncActionToServer(action);
        
        if (success) {
          // Mark as synced
          await updateActionStatus(db, action.id, 'synced');
          console.log(`Service Worker: Synced action ${action.id}`);
        } else {
          // Increment retry count
          action.attempts = (action.attempts || 0) + 1;
          if (action.attempts >= 3) {
            await updateActionStatus(db, action.id, 'failed');
          } else {
            await updateActionInDB(db, action);
          }
        }
      } catch (error) {
        console.error(`Service Worker: Failed to sync action ${action.id}:`, error);
        await updateActionStatus(db, action.id, 'failed');
      }
    }
    
    // Notify clients about sync completion
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETED',
        data: { syncedCount: pendingActions.length }
      });
    });
    
  } catch (error) {
    console.error('Service Worker: Offline sync failed:', error);
  }
}

// Sync single action to server
async function syncActionToServer(action) {
  try {
    const endpoint = getActionEndpoint(action);
    const method = getActionMethod(action.type);
    
    const response = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': await getAuthHeader()
      },
      body: JSON.stringify(action.data)
    });
    
    return response.ok;
  } catch (error) {
    console.error('Service Worker: Network error during sync:', error);
    return false;
  }
}

// Perform backup function
async function performBackup() {
  console.log('Service Worker: Starting backup process');
  
  try {
    // Get all cached data
    const cacheNames = await caches.keys();
    const backupData = {
      timestamp: new Date().toISOString(),
      caches: {},
      indexedDB: {}
    };
    
    // Backup cache data
    for (const cacheName of cacheNames) {
      if (cacheName.startsWith('bauplan-buddy')) {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        backupData.caches[cacheName] = requests.map(req => req.url);
      }
    }
    
    // Backup IndexedDB data
    const db = await initializeOfflineDB();
    const transaction = db.transaction(['actions', 'cache'], 'readonly');
    
    const actionsStore = transaction.objectStore('actions');
    const cacheStore = transaction.objectStore('cache');
    
    backupData.indexedDB.actions = await getAllFromStore(actionsStore);
    backupData.indexedDB.cache = await getAllFromStore(cacheStore);
    
    // Store backup locally
    const backupCache = await caches.open('bauplan-buddy-backup');
    const backupResponse = new Response(JSON.stringify(backupData), {
      headers: { 'Content-Type': 'application/json' }
    });
    
    await backupCache.put('/backup/latest', backupResponse);
    
    console.log('Service Worker: Backup completed successfully');
    
  } catch (error) {
    console.error('Service Worker: Backup failed:', error);
  }
}

// Helper functions
function getActionEndpoint(action) {
  const baseUrl = '/api';
  const entityMap = {
    project: '/projects',
    customer: '/customers',
    invoice: '/invoices',
    appointment: '/appointments',
    document: '/documents',
    team: '/teams',
    quote: '/quotes'
  };
  
  let endpoint = baseUrl + (entityMap[action.entity] || `/${action.entity}`);
  
  if (action.type === 'update' || action.type === 'delete') {
    endpoint += `/${action.entityId}`;
  }
  
  return endpoint;
}

function getActionMethod(type) {
  const methodMap = {
    create: 'POST',
    update: 'PUT',
    delete: 'DELETE'
  };
  
  return methodMap[type] || 'POST';
}

async function getAuthHeader() {
  // Try to get auth token from various sources
  try {
    // Check if we have cached auth data
    const authCache = await caches.open('bauplan-buddy-auth');
    const authResponse = await authCache.match('/auth/token');
    
    if (authResponse) {
      const authData = await authResponse.json();
      return `Bearer ${authData.token}`;
    }
  } catch (error) {
    console.warn('Service Worker: Could not get auth token:', error);
  }
  
  return '';
}

async function updateActionStatus(db, actionId, status) {
  const transaction = db.transaction(['actions'], 'readwrite');
  const store = transaction.objectStore('actions');
  
  const action = await new Promise((resolve, reject) => {
    const request = store.get(actionId);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  
  if (action) {
    action.status = status;
    action.lastAttempt = new Date().toISOString();
    
    await new Promise((resolve, reject) => {
      const request = store.put(action);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

async function updateActionInDB(db, action) {
  const transaction = db.transaction(['actions'], 'readwrite');
  const store = transaction.objectStore('actions');
  
  return new Promise((resolve, reject) => {
    const request = store.put(action);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getAllFromStore(store) {
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker: Received message:', event.data);
  
  switch (event.data.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
    case 'FORCE_SYNC':
      syncOfflineData();
      break;
    case 'CLEAR_CACHE':
      clearAllCaches();
      break;
    default:
      console.log('Service Worker: Unknown message type:', event.data.type);
  }
});

// Clear all caches
async function clearAllCaches() {
  try {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );
    console.log('Service Worker: All caches cleared');
  } catch (error) {
    console.error('Service Worker: Failed to clear caches:', error);
  }
}

console.log('Service Worker: Script loaded successfully');

