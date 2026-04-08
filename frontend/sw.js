/* ════════════════════════════════════════════════════════
   AapkaDINACHARYA — Service Worker
   Handles background push notifications.
   ════════════════════════════════════════════════════════ */

self.addEventListener('push', function(event) {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/assets/logo.png', // Fallback if no icon
    badge: '/assets/badge.png',
    data: data.data || { url: '/' },
    vibrate: [200, 100, 200],
    tag: data.tag || 'todo-notification',
    renotify: true,
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const urlToOpen = event.notification.data.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(windowClients) {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
