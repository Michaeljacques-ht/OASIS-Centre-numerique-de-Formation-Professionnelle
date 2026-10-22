'use strict';
/* ============================================================
   OASIS — Utilitaires (crypto, HTTP, sécurité)
   ============================================================ */
const crypto = require('crypto');

/* ---------- Identifiants et clés ---------- */
const uuid = () => crypto.randomUUID();
const rid = (prefix, bytes = 12) =>
  prefix + '_' + crypto.randomBytes(bytes).toString('hex');

/* ---------- Mots de passe (scrypt, sel unique) ---------- */
function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(pw, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}
function verifyPassword(pw, stored) {
  if (!stored || !stored.includes(':')) return false;
  const [salt, hash] = stored.split(':');
  const test = crypto.scryptSync(pw, salt, 64).toString('hex');
  return timingSafeEqual(test, hash);
}
function timingSafeEqual(a, b) {
  const ba = Buffer.from(String(a)), bb = Buffer.from(String(b));
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}


/* ---------- Lecture du corps de requête ---------- */
function readBody(req, limit = 256 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', c => {
      size += c.length;
      if (size > limit) { reject(new Error('payload_too_large')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      const ct = (req.headers['content-type'] || '').split(';')[0].trim();
      try {
        if (ct === 'application/json') return resolve({ raw, data: raw ? JSON.parse(raw) : {} });
        if (ct === 'application/x-www-form-urlencoded') {
          return resolve({ raw, data: Object.fromEntries(new URLSearchParams(raw)) });
        }
        resolve({ raw, data: {} });
      } catch { reject(new Error('invalid_json')); }
    });
    req.on('error', reject);
  });
}

/* ---------- Réponses ---------- */
function sendJSON(res, status, obj) {
  const body = JSON.stringify(obj, null, 2);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'X-Powered-By': 'Oasis/1.0'
  });
  res.end(body);
}
function sendHTML(res, status, html, extraHeaders = {}) {
  res.writeHead(status, Object.assign({
    'Content-Type': 'text/html; charset=utf-8',
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'same-origin'
  }, extraHeaders));
  res.end(html);
}
function redirect(res, location, cookies) {
  const h = { Location: location };
  if (cookies) h['Set-Cookie'] = cookies;
  res.writeHead(302, h);
  res.end();
}

/* ---------- Cookies ---------- */
function parseCookies(req) {
  const out = {};
  (req.headers.cookie || '').split(';').forEach(p => {
    const i = p.indexOf('=');
    if (i > -1) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
}
function sessionCookie(token) {
  return `eps=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`;
}
const clearSessionCookie = 'eps=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0';

/* ---------- Limitation de débit (rate limiting) ----------
   Fenêtre glissante en mémoire : 120 requêtes / minute / clé. */
const rlBuckets = new Map();
function rateLimit(key, max = 120, windowMs = 60_000) {
  const now = Date.now();
  let b = rlBuckets.get(key);
  if (!b || now - b.start >= windowMs) { b = { start: now, count: 0 }; rlBuckets.set(key, b); }
  b.count++;
  if (rlBuckets.size > 10_000) rlBuckets.clear(); // garde-fou mémoire
  return {
    ok: b.count <= max,
    remaining: Math.max(0, max - b.count),
    retryAfter: Math.ceil((b.start + windowMs - now) / 1000)
  };
}

/* ---------- Lecture multipart/form-data (téléversements) ----------
   Parseur maison, zéro dépendance, binaire-sûr (Buffers).
   Retourne { fields: {...}, files: [{field, filename, contentType, data}] } */
function parseMultipart(req, limit = 80 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const ct = req.headers['content-type'] || '';
    const m = ct.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
    if (!m) return reject(new Error('boundary_manquant'));
    const bBound = Buffer.from('--' + (m[1] || m[2]).trim());
    let size = 0; const chunks = [];
    req.on('data', c => {
      size += c.length;
      if (size > limit) { reject(new Error('fichier_trop_grand')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      try {
        const buf = Buffer.concat(chunks);
        const fields = {}; const files = [];
        let pos = buf.indexOf(bBound);
        while (pos !== -1) {
          const next = buf.indexOf(bBound, pos + bBound.length);
          if (next === -1) break;
          const part = buf.slice(pos + bBound.length + 2, next - 2); // saute/retire les CRLF
          const headerEnd = part.indexOf('\r\n\r\n');
          if (headerEnd !== -1) {
            const head = part.slice(0, headerEnd).toString('utf8');
            const body = part.slice(headerEnd + 4);
            const nameM = head.match(/name="([^"]*)"/i);
            const fileM = head.match(/filename="([^"]*)"/i);
            const ctM = head.match(/Content-Type:\s*([^\r\n]+)/i);
            const name = nameM ? nameM[1] : '';
            if (fileM && fileM[1]) {
              files.push({ field: name, filename: fileM[1],
                contentType: ctM ? ctM[1].trim().toLowerCase() : 'application/octet-stream',
                data: body });
            } else if (name) {
              fields[name] = body.toString('utf8');
            }
          }
          pos = next;
        }
        resolve({ fields, files });
      } catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

/* ---------- Divers ---------- */
const esc = s => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const fmtHTG = n => new Intl.NumberFormat('fr-HT').format(n) + ' HTG';
const isValidHaitiPhone = p => /^509\d{8}$/.test(String(p).replace(/[\s+-]/g, ''));

function baseUrl(req) {
  const configured = process.env.BASE_URL || process.env.OASIS_BASE_URL ||
    process.env.PUBLIC_URL || process.env.RENDER_EXTERNAL_URL;
  if (configured) return String(configured).replace(/\/$/, '');
  const forwardedHost = String(req.headers['x-forwarded-host'] || '').split(',')[0].trim();
  const forwardedProto = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim();
  const host = forwardedHost || req.headers.host || 'localhost:3000';
  const proto = forwardedProto || (host.includes('localhost') || host.startsWith('127.') ? 'http' : 'https');
  return `${proto}://${host}`;
}

module.exports = {
  uuid, rid, hashPassword, verifyPassword, timingSafeEqual,
  readBody, parseMultipart, sendJSON, sendHTML, redirect,
  parseCookies, sessionCookie, clearSessionCookie,
  rateLimit, esc, fmtHTG, isValidHaitiPhone, baseUrl
};
