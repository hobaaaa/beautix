self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Bu temel service worker bilinçli olarak hiçbir isteği veya kullanıcı verisini cache'lemez.
