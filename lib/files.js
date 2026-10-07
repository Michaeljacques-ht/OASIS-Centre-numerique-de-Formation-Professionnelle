'use strict';
/* ============================================================
   OASIS — Fichiers téléversés (images, PDF, vidéos)
   Stockage : DATA_DIR/uploads · Service : GET /fichiers/:nom
   Support des requêtes Range pour la lecture vidéo.
   ============================================================ */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

/* type MIME → { ext, familia, taille max } */
const TYPES = {
  'image/jpeg': { ext: 'jpg', fam: 'image', max: 5 * 1024 * 1024 },
  'image/png':  { ext: 'png', fam: 'image', max: 5 * 1024 * 1024 },
  'image/webp': { ext: 'webp', fam: 'image', max: 5 * 1024 * 1024 },
  'image/gif':  { ext: 'gif', fam: 'image', max: 5 * 1024 * 1024 },
  'application/pdf': { ext: 'pdf', fam: 'pdf', max: 20 * 1024 * 1024 },
  'video/mp4':  { ext: 'mp4', fam: 'video', max: 80 * 1024 * 1024 },
  'video/webm': { ext: 'webm', fam: 'video', max: 80 * 1024 * 1024 },
  'audio/mpeg': { ext: 'mp3', fam: 'audio', max: 20 * 1024 * 1024 },
  'application/zip': { ext: 'zip', fam: 'document', max: 25 * 1024 * 1024 },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    { ext: 'docx', fam: 'document', max: 15 * 1024 * 1024 }
};
const MIME_PAR_EXT = Object.fromEntries(
  Object.entries(TYPES).map(([mime, t]) => [t.ext, mime]));

const LIMITES_LISIBLES = 'images 5 Mo · PDF 20 Mo · vidéos 80 Mo · audio 20 Mo';

/** Valide et enregistre un fichier téléversé.
    familles : liste des familles acceptées, ex. ['image'] ou ['image','pdf','video','audio'] */
function saveUpload(file, familles) {
  const t = TYPES[file.contentType];
  if (!t || !familles.includes(t.fam)) {
    return { ok: false, error: 'Type de fichier non accepté (' + file.contentType +
      '). Formats : JPG, PNG, WebP, GIF, PDF, MP4, WebM, MP3.' };
  }
  if (!file.data || !file.data.length) return { ok: false, error: 'Fichier vide.' };
  if (file.data.length > t.max) {
    return { ok: false, error: 'Fichier trop volumineux (' + LIMITES_LISIBLES + ').' };
  }
  const nom = 'fic_' + crypto.randomBytes(9).toString('hex') + '.' + t.ext;
  fs.writeFileSync(path.join(UPLOAD_DIR, nom), file.data);
  return {
    ok: true,
    fichier: {
      id: nom.replace(/\..+$/, ''),
      nomOriginal: String(file.filename).slice(0, 120),
      type: t.fam,
      mime: file.contentType,
      url: '/fichiers/' + nom,
      taille: file.data.length,
      createdAt: new Date().toISOString()
    }
  };
}

function deleteUpload(url) {
  const nom = String(url || '').split('/').pop();
  if (!/^fic_[a-f0-9]+\.[a-z0-9]+$/i.test(nom)) return;
  const p = path.join(UPLOAD_DIR, nom);
  if (fs.existsSync(p)) fs.unlinkSync(p);
}

/** Sert GET /fichiers/:nom avec support Range (lecture vidéo/audio). */
function serve(req, res, nom) {
  if (!/^fic_[a-f0-9]+\.[a-z0-9]+$/i.test(nom)) { res.writeHead(404); return res.end('Introuvable'); }
  const p = path.join(UPLOAD_DIR, nom);
  if (!fs.existsSync(p)) { res.writeHead(404); return res.end('Introuvable'); }
  const stat = fs.statSync(p);
  const mime = MIME_PAR_EXT[nom.split('.').pop().toLowerCase()] || 'application/octet-stream';
  const range = req.headers.range;
  const commun = {
    'Content-Type': mime,
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'public, max-age=86400',
    'X-Content-Type-Options': 'nosniff'
  };
  if (range) {
    const m = range.match(/bytes=(\d*)-(\d*)/);
    let debut = m && m[1] ? Number(m[1]) : 0;
    let fin = m && m[2] ? Number(m[2]) : stat.size - 1;
    if (debut >= stat.size) {
      res.writeHead(416, { 'Content-Range': `bytes */${stat.size}` });
      return res.end();
    }
    fin = Math.min(fin, stat.size - 1);
    res.writeHead(206, Object.assign(commun, {
      'Content-Range': `bytes ${debut}-${fin}/${stat.size}`,
      'Content-Length': fin - debut + 1
    }));
    fs.createReadStream(p, { start: debut, end: fin }).pipe(res);
  } else {
    res.writeHead(200, Object.assign(commun, { 'Content-Length': stat.size }));
    fs.createReadStream(p).pipe(res);
  }
}

module.exports = { saveUpload, deleteUpload, serve, LIMITES_LISIBLES };
