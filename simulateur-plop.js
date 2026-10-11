#!/usr/bin/env node
'use strict';
/* Simulateur PLOP PLOP (HTTPS auto-signé) — reproduit exactement les réponses
   attendues par lib/plopplop.js pour tester paiement et retrait hors production. */
const https = require('https');
const crypto = require('crypto');
const { execSync } = require('child_process');
const fs = require('fs');

if (!fs.existsSync('/tmp/sim.key')) {
  execSync('openssl req -x509 -newkey rsa:2048 -nodes -keyout /tmp/sim.key -out /tmp/sim.crt -days 2 -subj "/CN=localhost" 2>/dev/null');
}

const SECRET = process.env.SIM_SECRET || 'secret_test';
const transactions = new Map();   // refference_id → { montant, methode, payee, id }
const retraits = new Map();
let solde = 120000;

function lire(req) {
  return new Promise(r => { let d = ''; req.on('data', c => d += c); req.on('end', () => { try { r(JSON.parse(d || '{}')); } catch { r({}); } }); });
}
function json(res, code, obj) {
  const b = JSON.stringify(obj);
  res.writeHead(code, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(b) });
  res.end(b);
}

const serveur = https.createServer(
  { key: fs.readFileSync('/tmp/sim.key'), cert: fs.readFileSync('/tmp/sim.crt') },
  async (req, res) => {
    const chemin = req.url.split('?')[0];
    const corps = await lire(req);
    const jeton = (req.headers.authorization || '').replace('Bearer ', '');

    /* ---- Paiement ---- */
    if (chemin === '/api/paiement-marchand') {
      if (!corps.client_id || !corps.refference_id || !corps.montant) {
        return json(res, 400, { status: false, message: 'Paramètres manquants' });
      }
      if (corps.montant < 20) return json(res, 400, { status: false, message: 'Montant minimum : 20 HTG' });
      const id = 'TX' + crypto.randomBytes(4).toString('hex').toUpperCase();
      transactions.set(corps.refference_id, {
        montant: corps.montant, methode: corps.payment_method || 'all', payee: false, id
      });
      return json(res, 200, { status: true, transaction_id: id,
        url: 'https://plopplop.local/pay/' + id + '?ref=' + encodeURIComponent(corps.refference_id) });
    }

    if (chemin === '/api/paiement-verify') {
      const t = transactions.get(corps.refference_id);
      if (!t) return json(res, 200, { trans_status: 'pending', message: 'Transaction introuvable' });
      if (!t.payee) return json(res, 200, { trans_status: 'pending', message: 'En attente de paiement' });
      return json(res, 200, { trans_status: 'ok', id_transaction: t.id,
        method: t.methode === 'all' ? 'moncash' : t.methode,
        date: new Date().toISOString().slice(0, 10), heure: '10:24:11' });
    }

    /* ---- Simulation du paiement de l'apprenant (hors API réelle) ---- */
    if (chemin === '/simuler-paiement') {
      const t = transactions.get(corps.refference_id);
      if (!t) return json(res, 404, { erreur: 'inconnue' });
      t.payee = true;
      return json(res, 200, { ok: true });
    }

    /* ---- Retrait : étape 1 ---- */
    if (chemin === '/api/auth/marchand') {
      if (!corps.client_id || !corps.client_secret) {
        return json(res, 401, { success: false, message: 'Identifiants marchand invalides' });
      }
      return json(res, 200, { success: true, token: 'mtok_' + crypto.randomBytes(8).toString('hex') });
    }

    /* ---- Retrait : étape 2 (vérifie la signature HMAC) ---- */
    if (chemin === '/api/auth/marchand/withdrawal-token') {
      if (!jeton.startsWith('mtok_')) return json(res, 401, { success: false, message: 'Jeton marchand requis' });
      const attendue = crypto.createHmac('sha256', SECRET)
        .update([corps.amount, corps.method, corps.recipient, corps.reference, corps.timestamp].join('|'))
        .digest('hex');
      if (attendue !== corps.withdrawal_signature) {
        return json(res, 403, { success: false, message: 'Signature invalide', error_code: 'BAD_SIGNATURE' });
      }
      if (retraits.has(corps.reference)) {
        return json(res, 409, { success: false, message: 'Référence déjà utilisée', error_code: 'DUPLICATE' });
      }
      return json(res, 200, { success: true,
        withdrawal_token: 'wtok_' + crypto.randomBytes(8).toString('hex') });
    }

    /* ---- Retrait : étape 3 ---- */
    if (chemin === '/api/withdraw/marchand') {
      if (!jeton.startsWith('wtok_')) return json(res, 401, { success: false, message: 'Jeton de retrait requis' });
      if (corps.amount > solde) {
        return json(res, 400, { success: false, message: 'Solde marchand insuffisant', error_code: 'INSUFFICIENT_FUNDS' });
      }
      if (String(corps.recipient).endsWith('0000')) {
        return json(res, 400, { success: false, message: 'Compte destinataire introuvable', error_code: 'BAD_RECIPIENT' });
      }
      const frais = Math.round(corps.amount * 0.01 * 100) / 100;
      solde -= corps.amount + frais;
      const t = { transaction_id: 'WD' + crypto.randomBytes(4).toString('hex').toUpperCase(),
        status: 'completed', fee: frais, balance_after: solde };
      retraits.set(corps.reference, t);
      return json(res, 200, { success: true, message: 'Retrait effectué', data: t });
    }

    if (chemin === '/api/withdraw/marchand/verify') {
      const t = retraits.get(corps.reference);
      if (!t) return json(res, 404, { success: false, message: 'Retrait introuvable' });
      return json(res, 200, { success: true, data: t });
    }

    json(res, 404, { message: 'route inconnue ' + chemin });
  });

serveur.listen(4443, () => console.log('[sim-plop] https://localhost:4443'));
