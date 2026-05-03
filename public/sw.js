self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
  const { type, title, body, url } = event.data || {};
  if (type === 'SHOW_NOTIFICATION' && self.registration.showNotification) {
    self.registration.showNotification(title || 'Kudos Driving School', {
      body: body || '',
      icon: '/kudos-icon.svg',
      badge: '/kudos-icon.svg',
      data: { url: url || '/' }
    });
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((client) => client.url.includes(self.location.origin));
      if (existing) return existing.focus();
      return self.clients.openWindow(targetUrl);
    })
  );
});
