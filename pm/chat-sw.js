/* PENUM PM 3.70.8: only for chat notifications on the screen. Android and an installed app can show a notification only
   through a service worker. It does not touch any request or cache (no fetch handler). Tapping a notification brings
   PENUM PM to the front and opens that chat room. */
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('notificationclick',e=>{e.notification.close();const room=(e.notification.data||{}).room||'';
  e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(L=>{const c=L.find(x=>new URL(x.url).pathname.startsWith(new URL(self.registration.scope).pathname));
    if(c){c.postMessage({chRoom:room});return c.focus()}return self.clients.openWindow(self.registration.scope+'#chat='+encodeURIComponent(room))}))});
