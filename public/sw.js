const CACHE_NAME = 'the-explainers-v1'
const STATIC_CACHE = 'static-v1'
const DYNAMIC_CACHE = 'dynamic-v1'

// Files to cache immediately
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/user-guide.html',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/apple-touch-icon.png',
  '/favicon.ico',
  '/icon.svg'
]

// Public domain texts to cache
const TEXTS_TO_CACHE = [
  '/public-domain-texts/shakespeare-romeo-and-juliet.txt',
  '/public-domain-texts/alice-in-wonderland.txt',
  '/public-domain-texts/frankenstein.txt',
  '/public-domain-texts/pride-and-prejudice.txt',
  '/public-domain-texts/middlemarch.txt'
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...')
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      }),
      caches.open(DYNAMIC_CACHE).then((cache) => {
        console.log('Caching texts')
        return cache.addAll(TEXTS_TO_CACHE.map(url => url.startsWith('/') ? url : `/${url}`))
      })
    ])
  )
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  self.clients.claim()
})

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Skip external API calls (let them fail gracefully)
  if (url.pathname.startsWith('/api/chat') || 
      url.pathname.startsWith('/api/download-text') ||
      url.hostname !== self.location.hostname) {
    return
  }

  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        // Return cached response if available
        if (cachedResponse) {
          console.log('Serving from cache:', request.url)
          return cachedResponse
        }

        // For library JSON files, try to fetch and cache
        if (url.pathname.startsWith('/api/library/')) {
          return fetch(request)
            .then((response) => {
              if (response.ok) {
                const responseClone = response.clone()
                caches.open(DYNAMIC_CACHE).then((cache) => {
                  cache.put(request, responseClone)
                })
              }
              return response
            })
            .catch(() => {
              // Return a fallback for library files
              return new Response(JSON.stringify([]), {
                headers: { 'Content-Type': 'application/json' }
              })
            })
        }

        // For text files, try to fetch and cache
        if (url.pathname.includes('.txt') || url.pathname.includes('.html')) {
          return fetch(request)
            .then((response) => {
              if (response.ok) {
                const responseClone = response.clone()
                caches.open(DYNAMIC_CACHE).then((cache) => {
                  cache.put(request, responseClone)
                })
              }
              return response
            })
            .catch(() => {
              // Return offline message for text files
              return new Response('This text is not available offline. Please check your internet connection.', {
                headers: { 'Content-Type': 'text/plain' }
              })
            })
        }

        // For all other requests, try fetch first
        return fetch(request)
          .then((response) => {
            // Cache successful responses
            if (response.ok && response.status === 200) {
              const responseClone = response.clone()
              caches.open(DYNAMIC_CACHE).then((cache) => {
                cache.put(request, responseClone)
              })
            }
            return response
          })
          .catch(() => {
            // Return a basic offline page for navigation requests
            if (request.mode === 'navigate') {
              return caches.match('/') || new Response('You are offline', {
                headers: { 'Content-Type': 'text/html' }
              })
            }
            throw new Error('Offline and no cache available')
          })
      })
  )
})

// Handle background sync for failed API calls
self.addEventListener('sync', (event) => {
  if (event.tag === 'explanation-request') {
    console.log('Background sync: explanation-request')
    // Could implement queuing of failed explanation requests here
  }
})

// Handle push notifications (for future use)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New update available',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Open App',
        icon: '/icon-192x192.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icon-192x192.png'
      }
    ]
  }

  event.waitUntil(
    self.registration.showNotification('The Explainers', options)
  )
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})