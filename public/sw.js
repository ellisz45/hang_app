// hang. — Service Worker
// Handles background push notifications

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

// ── Receive push notification ──
self.addEventListener('push', event => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = {
      title: '🤙 hang.',
      body: event.data.text(),
    };
  }

  const options = {
    body: data.body || 'Someone wants to hang!',
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/badge-72.png',
    tag: data.tag || 'hang-alert',
    renotify: true,
    requireInteraction: false,
    vibrate: [200, 100, 200],
    data: data.data || {},
    actions: [
      { action: 'im-in', title: "I'm in 🙌" },
      { action: 'later', title: 'Maybe later' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || '🤙 hang.', options)
  );
});

// ── Notification click ──
self.addEventListener('notificationclick', event => {
  event.notification.close();

  const action = event.action;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      // Focus existing window if open
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.postMessage({ type: 'notification-click', action });
          return;
        }
      }
      // Otherwise open app
      if (self.clients.openWindow) {
        return self.clients.openWindow('/?notif=1');
      }
    })
  );
});
