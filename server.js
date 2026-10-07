#!/usr/bin/env node
'use strict';
/* ============================================================
   OASIS — Plateforme de formation en ligne
   Formateurs · Apprenants · Entreprises
   Node.js pur, zéro dépendance npm, base de données JSON.

   Démarrage :  node server.js
   Variables :  PORT (3001), DATA_DIR
   ============================================================ */
const http = require('http');
const { init } = require('./lib/db');
const { handle } = require('./routes/app');
const { sendJSON } = require('./lib/utils');

const PORT = Number(process.env.PORT || 3001);
init();

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    req.pathname = url.pathname;
    req.query = url.searchParams;
    await handle(req, res);
  } catch (e) {
    console.error('[oasis-apprentissage] Erreur :', e);
    if (!res.headersSent) {
      sendJSON(res, 500, { error: 'Une erreur interne est survenue.' });
    } else res.end();
  }
});

server.listen(PORT, () => {
  console.log('┌────────────────────────────────────────────────────┐');
  console.log('│  OASIS · Formation professionnelle                 │');
  console.log('│  http://localhost:' + PORT + '                            │');
  console.log('├────────────────────────────────────────────────────┤');
  console.log('│  Formateur  : jean@oasis.ht        / Formateur1!   │');
  console.log('│  Apprenant  : marie@oasis.ht       / Apprenant1!   │');
  console.log('│  Entreprise : academie@digicel.ht  / Entreprise1!  │');
  console.log('│  Admin      : admin@oasis.ht       / Admin2026!    │');
  console.log('└────────────────────────────────────────────────────┘');
});
