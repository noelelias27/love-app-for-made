const CACHE = 'togethr-v1-live-push';
const ASSETS = [
'./',
'./index.html',
'./manifest.json',
'./icon-192.png',
'./icon-512.png'
];

self.addEventListener('install', event => {
event.waitUntil(
caches
.open(CACHE)
.then(cache => cache.addAll(ASSETS))
.catch(error => console.warn('Cache install failed:', error))
);

self.skipWaiting();
});

self.addEventListener('activate', event => {
event.waitUntil(
Promise.all([
caches.keys().then(keys =>
Promise.all(
keys
.filter(key => key !== CACHE)
.map(key => caches.delete(key))
)
),
self.clients.claim()
])
);
});

self.addEventListener('fetch', event => {
const request = event.request;

// Only cache GET requests.
// This prevents errors with Supabase/API requests or browser extension requests.
if (request.method !== 'GET') {
event.respondWith(fetch(request));
return;
}

event.respondWith(
fetch(request)
.then(response => {
// Only cache valid basic/cors responses.
if (
response &&
response.status === 200 &&
(response.type === 'basic' || response.type === 'cors')
) {
const clone = response.clone();
caches.open(CACHE).then(cache => {
cache.put(request, clone).catch(() => {});
});
}

```
    return response;
  })
  .catch(() => caches.match(request))
```

);
});

// Receives Web Push messages when the installed app is closed/backgrounded.
// The backend/Edge Function will send a JSON payload like:
// {
//   "title": "Togethr",
//   "body": "Nueva nota agregada 💜",
//   "url": "/love-app-for-made/",
//   "tag": "togethr-note-added"
// }
self.addEventListener('push', event => {
let payload = {};

try {
payload = event.data ? event.data.json() : {};
} catch (error) {
payload = {
title: 'Togethr',
body: event.data ? event.data.text() : 'Hay una nueva actualización 💜'
};
}

const title = payload.title || 'Togethr';

const options = {
body: payload.body || 'Hay una nueva actualización 💜',
icon: payload.icon || './icon-192.png',
badge: payload.badge || './icon-192.png',
tag: payload.tag || 'togethr-update',
data: {
url: payload.url || './',
createdAt: Date.now(),
...payload.data
},
renotify: true,
requireInteraction: false
};

event.waitUntil(
self.registration.showNotification(title, options)
);
});

// When the user taps the notification, open the installed app.
// If it is already open, focus it.
self.addEventListener('notificationclick', event => {
event.notification.close();

const targetUrl = event.notification?.data?.url || './';

event.waitUntil(
self.clients.matchAll({
type: 'window',
includeUncontrolled: true
}).then(clientList => {
for (const client of clientList) {
if ('focus' in client) {
client.focus();

```
      if ('navigate' in client) {
        return client.navigate(targetUrl);
      }

      return client;
    }
  }

  if (self.clients.openWindow) {
    return self.clients.openWindow(targetUrl);
  }

  return null;
})
```

);
});

self.addEventListener('notificationclose', event => {
// Optional: this can be used later if we want to track dismissed notifications.
console.info('Notification closed:', event.notification?.tag || 'togethr');
});
