self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('fetch',event=>{
 if(event.request.mode==='navigate')event.respondWith(fetch(event.request).catch(()=>new Response(`<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>OASIS — Hors connexion</title><body style="font-family:system-ui;padding:32px;background:#f1f7fb;color:#123251"><h1>Vous êtes hors connexion</h1><p>Reconnectez-vous à Internet pour accéder à vos formations et à votre espace.</p><button onclick="location.reload()">Réessayer</button></body></html>`,{headers:{'Content-Type':'text/html; charset=utf-8'},status:503})));
});
