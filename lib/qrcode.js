'use strict';
/* ============================================================
   OASIS — Générateur de QR code (zéro dépendance)

   Encodeur conforme à la norme ISO/IEC 18004 : mode octet,
   niveau de correction M (restitue jusqu'à 15 % de modules
   endommagés — adapté à un document imprimé), versions 1 à 10
   choisies automatiquement selon la longueur du texte.

   Sortie : SVG inline, net à l'impression et sans fichier image.

      const { qrSvg } = require('./qrcode');
      qrSvg('https://oasis.ht/verifier/enr_abc', { taille: 110 });
   ============================================================ */

/* ---------- Tables de la norme (niveau de correction M) ---------- */
// [octets de correction par bloc, blocs groupe 1, données/bloc G1, blocs G2, données/bloc G2]
const BLOCS_M = {
  1:  [10, 1, 16, 0, 0],
  2:  [16, 1, 28, 0, 0],
  3:  [26, 1, 44, 0, 0],
  4:  [18, 2, 32, 0, 0],
  5:  [24, 2, 43, 0, 0],
  6:  [16, 4, 27, 0, 0],
  7:  [18, 4, 31, 0, 0],
  8:  [22, 2, 38, 2, 39],
  9:  [22, 3, 36, 2, 37],
  10: [26, 4, 43, 1, 44]
};
/** Nombre total de mots de données (octets) d'une version, déduit des blocs. */
function motsDonnees(v) {
  const [, g1, d1, g2, d2] = BLOCS_M[v];
  return g1 * d1 + g2 * d2;
}
/** Capacité utile en octets de texte : les mots de données moins l'en-tête
    (4 bits de mode + 8 ou 16 bits de compteur, arrondis à l'octet). */
function capacite(v) {
  return motsDonnees(v) - (v < 10 ? 2 : 3);
}
// Centres des motifs d'alignement
const ALIGNEMENT = {
  1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30],
  6: [6, 34], 7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46], 10: [6, 28, 50]
};
// Chaînes d'information de format (niveau M), indexées par masque
const FORMAT_M = [
  '101010000010010', '101000100100101', '101111001111100', '101101101001011',
  '100010111111001', '100000011001110', '100111110010111', '100101010100000'
];
// Information de version (versions 7 et au-delà)
const VERSION_INFO = {
  7: '000111110010010100', 8: '001000010110111100',
  9: '001001101010011001', 10: '001010010011010011'
};

/* ---------- Arithmétique dans le corps de Galois GF(256) ---------- */
const EXP = new Array(512), LOG = new Array(256);
(function initGF() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x; LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11D;          // polynôme générateur x^8+x^4+x^3+x^2+1
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
})();
const mul = (a, b) => (a === 0 || b === 0) ? 0 : EXP[LOG[a] + LOG[b]];

/** Polynôme générateur de Reed-Solomon pour n octets de correction. */
function polyGenerateur(n) {
  let p = [1];
  for (let i = 0; i < n; i++) {
    const q = [1, EXP[i]];
    const r = new Array(p.length + 1).fill(0);
    for (let j = 0; j < p.length; j++)
      for (let k = 0; k < q.length; k++) r[j + k] ^= mul(p[j], q[k]);
    p = r;
  }
  return p;
}

/** Octets de correction d'erreur d'un bloc de données. */
function correction(donnees, nbEc) {
  const gen = polyGenerateur(nbEc);
  const reste = donnees.concat(new Array(nbEc).fill(0));
  for (let i = 0; i < donnees.length; i++) {
    const coef = reste[i];
    if (coef === 0) continue;
    for (let j = 0; j < gen.length; j++) reste[i + j] ^= mul(gen[j], coef);
  }
  return reste.slice(donnees.length);
}

/* ---------- Encodage du texte en flux d'octets ---------- */
function encoder(texte, version) {
  const octets = Array.from(Buffer.from(texte, 'utf8'));
  const motsTotal = motsDonnees(version);
  const bits = [];
  const pousser = (valeur, longueur) => {
    for (let i = longueur - 1; i >= 0; i--) bits.push((valeur >> i) & 1);
  };
  pousser(0b0100, 4);                                  // mode octet
  pousser(octets.length, version < 10 ? 8 : 16);       // compteur de caractères
  for (const o of octets) pousser(o, 8);
  // Terminateur puis alignement sur l'octet
  const total = motsTotal * 8;
  for (let i = 0; i < 4 && bits.length < total; i++) bits.push(0);
  while (bits.length % 8 !== 0) bits.push(0);
  // Octets de remplissage alternés
  const remplissage = [0xEC, 0x11];
  let k = 0;
  while (bits.length < total) { pousser(remplissage[k++ % 2], 8); }
  // Conversion en octets
  const flux = [];
  for (let i = 0; i < bits.length; i += 8) {
    let v = 0;
    for (let j = 0; j < 8; j++) v = (v << 1) | bits[i + j];
    flux.push(v);
  }
  return flux;
}

/** Découpe en blocs, calcule la correction et entrelace. */
function entrelacer(flux, version) {
  const [nbEc, g1, d1, g2, d2] = BLOCS_M[version];
  const blocsD = [], blocsE = [];
  let p = 0;
  for (let i = 0; i < g1; i++) { const b = flux.slice(p, p + d1); p += d1; blocsD.push(b); blocsE.push(correction(b, nbEc)); }
  for (let i = 0; i < g2; i++) { const b = flux.slice(p, p + d2); p += d2; blocsD.push(b); blocsE.push(correction(b, nbEc)); }
  const sortie = [];
  const maxD = Math.max(d1, d2 || 0);
  for (let i = 0; i < maxD; i++)
    for (const b of blocsD) if (i < b.length) sortie.push(b[i]);
  for (let i = 0; i < nbEc; i++)
    for (const b of blocsE) sortie.push(b[i]);
  return sortie;
}

/* ---------- Construction de la matrice ---------- */
function matriceVide(taille) {
  return { m: Array.from({ length: taille }, () => new Array(taille).fill(null)), taille };
}

function poserMotifs(g, version) {
  const t = g.taille;
  const poser = (y, x, v) => { if (y >= 0 && y < t && x >= 0 && x < t) g.m[y][x] = v; };

  // Motifs de détection de position (3 coins) et leurs séparateurs
  for (const [oy, ox] of [[0, 0], [0, t - 7], [t - 7, 0]]) {
    for (let y = -1; y <= 7; y++) for (let x = -1; x <= 7; x++) {
      const dedans = y >= 0 && y < 7 && x >= 0 && x < 7;
      const anneau = dedans && (y === 0 || y === 6 || x === 0 || x === 6 ||
        (y >= 2 && y <= 4 && x >= 2 && x <= 4));
      poser(oy + y, ox + x, anneau ? 1 : 0);
    }
  }
  // Motifs de synchronisation
  for (let i = 8; i < t - 8; i++) { poser(6, i, i % 2 === 0 ? 1 : 0); poser(i, 6, i % 2 === 0 ? 1 : 0); }
  // Motifs d'alignement
  const centres = ALIGNEMENT[version];
  for (const cy of centres) for (const cx of centres) {
    if ((cy <= 8 && cx <= 8) || (cy <= 8 && cx >= t - 9) || (cy >= t - 9 && cx <= 8)) continue;
    for (let y = -2; y <= 2; y++) for (let x = -2; x <= 2; x++)
      poser(cy + y, cx + x, (Math.abs(y) === 2 || Math.abs(x) === 2 || (y === 0 && x === 0)) ? 1 : 0);
  }
  // Module sombre obligatoire
  poser(t - 8, 8, 1);
  // Réservation des zones d'information de format
  for (let i = 0; i <= 8; i++) { if (g.m[8][i] === null) poser(8, i, 0); if (g.m[i][8] === null) poser(i, 8, 0); }
  for (let i = 0; i < 8; i++) { poser(8, t - 1 - i, 0); poser(t - 1 - i, 8, 0); }
  // Réservation de l'information de version
  if (version >= 7) {
    for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) { poser(i, t - 11 + j, 0); poser(t - 11 + j, i, 0); }
  }
}

/** Zones occupées par les motifs : masque de réservation. */
function reservation(version, taille) {
  const g = matriceVide(taille);
  poserMotifs(g, version);
  return g.m.map(r => r.map(v => v !== null));
}

function poserDonnees(g, octets, reserve) {
  const t = g.taille;
  const bits = [];
  for (const o of octets) for (let i = 7; i >= 0; i--) bits.push((o >> i) & 1);
  let idx = 0, montant = true;
  for (let col = t - 1; col > 0; col -= 2) {
    if (col === 6) col--;                       // la colonne de synchronisation est sautée
    for (let n = 0; n < t; n++) {
      const y = montant ? t - 1 - n : n;
      for (const x of [col, col - 1]) {
        if (reserve[y][x]) continue;
        g.m[y][x] = idx < bits.length ? bits[idx++] : 0;
      }
    }
    montant = !montant;
  }
}

const MASQUES = [
  (y, x) => (y + x) % 2 === 0,
  (y) => y % 2 === 0,
  (y, x) => x % 3 === 0,
  (y, x) => (y + x) % 3 === 0,
  (y, x) => (Math.floor(y / 2) + Math.floor(x / 3)) % 2 === 0,
  (y, x) => ((y * x) % 2) + ((y * x) % 3) === 0,
  (y, x) => (((y * x) % 2) + ((y * x) % 3)) % 2 === 0,
  (y, x) => (((y + x) % 2) + ((y * x) % 3)) % 2 === 0
];

/** Pénalité d'un motif selon les quatre règles de la norme. */
function penalite(m) {
  const t = m.length;
  let p = 0;
  // Règle 1 : séries de 5 modules identiques ou plus
  for (let i = 0; i < t; i++) {
    for (const ligne of [m[i], m.map(r => r[i])]) {
      let compte = 1;
      for (let j = 1; j < t; j++) {
        if (ligne[j] === ligne[j - 1]) compte++;
        else { if (compte >= 5) p += 3 + (compte - 5); compte = 1; }
      }
      if (compte >= 5) p += 3 + (compte - 5);
    }
  }
  // Règle 2 : blocs 2×2 de même couleur
  for (let y = 0; y < t - 1; y++) for (let x = 0; x < t - 1; x++)
    if (m[y][x] === m[y][x + 1] && m[y][x] === m[y + 1][x] && m[y][x] === m[y + 1][x + 1]) p += 3;
  // Règle 3 : motifs ressemblant aux repères de position
  const a = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0], b = [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1];
  const contient = (ligne, motif) => {
    let n = 0;
    for (let i = 0; i + motif.length <= ligne.length; i++) {
      let ok = true;
      for (let j = 0; j < motif.length; j++) if (ligne[i + j] !== motif[j]) { ok = false; break; }
      if (ok) n++;
    }
    return n;
  };
  for (let i = 0; i < t; i++) {
    const L = m[i], C = m.map(r => r[i]);
    p += 40 * (contient(L, a) + contient(L, b) + contient(C, a) + contient(C, b));
  }
  // Règle 4 : déséquilibre entre modules sombres et clairs
  let sombres = 0;
  for (const r of m) for (const v of r) sombres += v;
  p += 10 * Math.floor(Math.abs((sombres * 100) / (t * t) - 50) / 5);
  return p;
}

function poserFormat(m, masque) {
  const t = m.length;
  const bits = FORMAT_M[masque].split('').map(Number);
  for (let i = 0; i <= 5; i++) m[8][i] = bits[i];
  m[8][7] = bits[6]; m[8][8] = bits[7]; m[7][8] = bits[8];
  for (let i = 9; i <= 14; i++) m[14 - i][8] = bits[i];
  for (let i = 0; i <= 7; i++) m[t - 1 - i][8] = bits[i];
  for (let i = 8; i <= 14; i++) m[8][t - 15 + i] = bits[i];
  m[t - 8][8] = 1;
}

function poserVersion(m, version) {
  if (version < 7) return;
  const t = m.length;
  const bits = VERSION_INFO[version].split('').map(Number).reverse();
  for (let i = 0; i < 18; i++) {
    const y = Math.floor(i / 3), x = i % 3;
    m[y][t - 11 + x] = bits[i];
    m[t - 11 + x][y] = bits[i];
  }
}

/** Construit la matrice de modules (tableau de 0/1) pour un texte. */
function qrMatrice(texte) {
  const longueur = Buffer.byteLength(texte, 'utf8');
  let version = 0;
  for (let v = 1; v <= 10; v++) if (capacite(v) >= longueur) { version = v; break; }
  if (!version) throw new Error('Texte trop long pour un QR code (max ' + capacite(10) + ' octets).');

  const taille = 17 + version * 4;
  const octets = entrelacer(encoder(texte, version), version);
  const reserve = reservation(version, taille);

  let meilleur = null, meilleurScore = Infinity, meilleurMasque = 0;
  for (let k = 0; k < 8; k++) {
    const g = matriceVide(taille);
    poserMotifs(g, version);
    poserDonnees(g, octets, reserve);
    const m = g.m.map((r, y) => r.map((v, x) =>
      reserve[y][x] ? v : (MASQUES[k](y, x) ? v ^ 1 : v)));
    poserFormat(m, k);
    poserVersion(m, version);
    const s = penalite(m);
    if (s < meilleurScore) { meilleurScore = s; meilleur = m; meilleurMasque = k; }
  }
  return { modules: meilleur, taille, version, masque: meilleurMasque };
}

/**
 * QR code en SVG inline.
 * @param {string} texte      contenu encodé (généralement une URL de vérification)
 * @param {object} opts       { taille: côté en pixels, marge: modules, couleur, fond }
 */
function qrSvg(texte, opts = {}) {
  const { modules, taille } = qrMatrice(texte);
  const marge = opts.marge === undefined ? 4 : opts.marge;   // zone de silence (norme : 4 modules)
  const n = taille + marge * 2;
  const cote = opts.taille || 120;
  const couleur = opts.couleur || '#001C4A';
  const fond = opts.fond || '#FFFFFF';

  // Un seul tracé pour tous les modules sombres : SVG compact
  let d = '';
  for (let y = 0; y < taille; y++) {
    let x = 0;
    while (x < taille) {
      if (modules[y][x]) {
        let w = 1;
        while (x + w < taille && modules[y][x + w]) w++;
        d += `M${x + marge} ${y + marge}h${w}v1h-${w}z`;
        x += w;
      } else x++;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n} ${n}" ` +
    `width="${cote}" height="${cote}" shape-rendering="crispEdges" role="img" ` +
    `aria-label="${(opts.alt || 'QR code de vérification').replace(/"/g, '')}">` +
    `<rect width="${n}" height="${n}" fill="${fond}"/>` +
    `<path d="${d}" fill="${couleur}"/></svg>`;
}

module.exports = { qrSvg, qrMatrice };
