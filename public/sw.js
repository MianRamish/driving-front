self.addEventListener('install', () => {
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
  const targetPath = event.notification.data?.url || '/';
  const targetUrl = new URL(targetPath, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((client) => client.url.startsWith(self.location.origin));
      if (existing) {
        existing.focus();
        if ('navigate' in existing) return existing.navigate(targetUrl);
        return existing;
      }
      return self.clients.openWindow(targetUrl);
    })
  );
});
