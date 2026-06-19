const APP_NAME = 'Togethr';
const ICON = './icon-192.png';

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', event => {
  let data = {};

  if (event.data) {
    try {
      data = event.data.json();
    } catch (error) {
      data = { body: event.data.text() };
    }
  }

  const isAppleTouchDevice = /iPad|iPhone|iPod/.test(self.navigator.userAgent || '');
  const title = isAppleTouchDevice ? '' : (data.title || APP_NAME);
  const body = data.body || data.message || 'Hay algo nuevo en Togethr.';
  const options = {
    body,
    icon: data.icon || ICON,
    badge: data.badge || ICON,
    tag: data.tag || ('togethr-' + Date.now()),
    renotify: false,
    data: {
      url: data.url || './'
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();

  const url = event.notification.data && event.notification.data.url
    ? event.notification.data.url
    : './';

  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of windows) {
      if ('focus' in client) return client.focus();
    }
    if (self.clients.openWindow) return self.clients.openWindow(url);
  })());
});
