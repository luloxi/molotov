// Empty service worker to prevent 404 errors
// This file exists to satisfy service worker requests from wallet SDKs
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());
