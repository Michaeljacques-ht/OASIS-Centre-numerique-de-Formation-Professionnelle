'use strict';
/* ============================================================
   OASIS — Routeur de gestion institutionnelle
   Scolarité · Ressources humaines · Comptabilité

   Les trois modules sont reliés : une facturation de frais, un
   encaissement ou une paie validée produisent automatiquement leur
   écriture en partie double. La comptabilité n'est pas un registre
   que l'on tient à côté — c'est le reflet des opérations réelles.
   ============================================================ */
const DB = require('../lib/db');
const { get, save, audit, sequence, exerciceCourant, paramsPaie } = DB;
const U = require('../lib/utils');
const G = require('../lib/gestion');
const W = require('./gestion-views');
const F = require('../lib/files');

const JOURNAUX = [
  { code: 'VT', label: 'Ventes et facturations' },
  { code: 'AC', label: 'Achats et charges' },
  { code: 'BQ', label: 'Banque' },
  { code: 'CA', label: 'Caisse' },
  { code: 'MM', label: 'Portefeuille mobile' },
  { code: 'PA', label: 'Paie' },
  { code: 'OD', label: 'Opérations diverses' }
];

const COMPTE_TRESORERIE = {
  caisse: '531000', banque: '512100', moncash: '515000', natcash: '515000'
};
const JOURNAL_TRESORERIE = {
  caisse: 'CA', banque: 'BQ', moncash: 'MM', natcash: 'MM'
};

/* ============ Service comptable ============ */

/**
 * Enregistre une écriture après contrôle de conformité.
 * Retourne { ok, ecriture } ou { ok:false, erreurs }.
 */
function enregistrer(db, brouillon, actorId) {
  const exercice = exerciceCourant(brouillon.date);
  if (!exercice) return { ok: false, erreurs: ['Aucun exercice comptable ouvert.'] };

  const ctrl = G.validerEcriture(brouillon, db.comptes, exercice);
  if (!ctrl.ok) return { ok: false, erreurs: ctrl.erreurs };

  const journal = JOURNAUX.some(j => j.code === brouillon.journal) ? brouillon.journal : 'OD';
  const an = brouillon.date.slice(0, 4);
  const seq = sequence('ecriture_' + journal + '_' + an);
  const ecriture = {
    id: U.rid('ecr', 8),
    numero: journal + '-' + an + '-' + String(seq).padStart(5, '0'),
    exerciceId: exercice.id,
    journal,
    date: brouillon.date,
    piece: String(brouillon.piece).slice(0, 40),
    libelle: String(brouillon.libelle).slice(0, 200),
    lignes: brouillon.lignes.map(l => ({
      compte: l.compte,
      libelle: String(l.libelle || '').slice(0, 160),
      debit: Math.round((Number(l.debit) || 0) * 100) / 100,
      credit: Math.round((Number(l.credit) || 0) * 100) / 100
    })),
    source: brouillon.source || 'saisie',
    refSource: brouillon.refSource || null,
    validee: true,
    saisieLe: new Date().toISOString(),
    saisiePar: actorId || null
  };
  db.ecritures.push(ecriture);
  audit(actorId, 'compta.ecriture', { numero: ecriture.numero, debit: ctrl.debit });
  return { ok: true, ecriture };
}

/** Facturation de frais de scolarité : créance sur l'étudiant, produit constaté. */
function ecritureFacturation(db, etudiant, inscription, actorId) {
  const total = (inscription.echeancier || []).reduce((s, l) => s + (Number(l.montant) || 0), 0);
  if (total <= 0) return { ok: true, ecriture: null };
  return enregistrer(db, {
    journal: 'VT', date: inscription.dateInscription.slice(0, 10),
    piece: 'INS-' + inscription.id.slice(-6).toUpperCase(),
    libelle: 'Frais de scolarité — ' + etudiant.matricule + ' — ' + inscription.intitule,
    lignes: [
      { compte: '411000', libelle: etudiant.nomComplet, debit: total, credit: 0 },
      { compte: '706100', libelle: inscription.intitule, debit: 0, credit: total }
    ],
    source: 'scolarite.facturation', refSource: inscription.id
  }, actorId);
}

/** Encaissement : trésorerie augmentée, créance éteinte d'autant. */
function ecritureEncaissement(db, etudiant, paiement, actorId) {
  const compte = COMPTE_TRESORERIE[paiement.mode] || '531000';
  return enregistrer(db, {
    journal: JOURNAL_TRESORERIE[paiement.mode] || 'CA', date: paiement.date,
    piece: paiement.recu,
    libelle: 'Encaissement scolarité — ' + etudiant.matricule,
    lignes: [
      { compte, libelle: 'Reçu ' + paiement.recu, debit: paiement.montant, credit: 0 },
      { compte: '411000', libelle: etudiant.nomComplet, debit: 0, credit: paiement.montant }
    ],
    source: 'scolarite.encaissement', refSource: paiement.id
  }, actorId);
}

/**
 * Paie validée : charge de personnel au débit, dettes au crédit.
 * Le net revient au salarié, les cotisations aux organismes, l'IRI à la DGI.
 */
function ecriturePaie(db, employe, paie, actorId) {
  const c = paie.calcul;
  const lignes = [
    { compte: '641000', libelle: 'Salaire brut — ' + employe.nom, debit: c.brut, credit: 0 }
  ];
  if (c.patronales.ona > 0) lignes.push({ compte: '645100', libelle: 'ONA part employeur', debit: c.patronales.ona, credit: 0 });
  const ofatma = Math.round((c.patronales.ofatmaMaladie + c.patronales.ofatmaAccident) * 100) / 100;
  if (ofatma > 0) lignes.push({ compte: '645200', libelle: 'OFATMA part employeur', debit: ofatma, credit: 0 });

  if (c.net > 0) lignes.push({ compte: '421000', libelle: 'Net à payer — ' + employe.nom, debit: 0, credit: c.net });
  const onaTotal = Math.round((c.salariales.ona + c.patronales.ona) * 100) / 100;
  if (onaTotal > 0) lignes.push({ compte: '431000', libelle: 'ONA à verser', debit: 0, credit: onaTotal });
  if (ofatma > 0) lignes.push({ compte: '432000', libelle: 'OFATMA à verser', debit: 0, credit: ofatma });
  if (c.iri > 0) lignes.push({ compte: '442000', libelle: 'IRI retenu à la source', debit: 0, credit: c.iri });
  if (c.autresRetenues > 0) lignes.push({ compte: '421000', libelle: 'Retenues diverses', debit: 0, credit: c.autresRetenues });

  return enregistrer(db, {
    journal: 'PA', date: paie.periode + '-28',
    piece: 'PAIE-' + paie.periode + '-' + employe.matricule,
    libelle: 'Paie ' + paie.periode + ' — ' + employe.nom,
    lignes, source: 'rh.paie', refSource: paie.id
  }, actorId);
}

/* ============ Aides ============ */

const nomComplet = e => ((e.prenom || '') + ' ' + (e.nom || '')).trim();

function dossierEtudiant(db, id) {
  const e = db.etudiants.find(x => x.id === id);
  if (!e) return null;
  return Object.assign({}, e, {
    nomComplet: nomComplet(e),
    situation: G.situationScolarite({ echeancier: toutEcheancier(e) })
  });
}
const toutEcheancier = e => (e.inscriptions || []).reduce((a, i) => a.concat(i.echeancier || []), []);

function statsScolarite(db) {
  const actifs = db.etudiants.filter(e => e.statut === 'actif').length;
  let du = 0, regle = 0, retard = 0;
  for (const e of db.etudiants) {
    const s = G.situationScolarite({ echeancier: toutEcheancier(e) });
    du += s.du; regle += s.regle; retard += s.montantRetard;
  }
  const arr = n => Math.round(n * 100) / 100;
  return { total: db.etudiants.length, actifs, du: arr(du), regle: arr(regle),
    solde: arr(du - regle), retard: arr(retard),
    diplomes: db.etudiants.filter(e => e.statut === 'diplome').length };
}

function statsRH(db) {
  const actifs = db.employes.filter(e => e.statut === 'actif');
  const masse = actifs.reduce((s, e) => s + (Number(e.salaireBase) || 0), 0);
  const P = paramsPaie();
  const cout = actifs.reduce((s, e) =>
    s + G.calculerPaie({ salaireBase: e.salaireBase, params: P }).coutEmployeur, 0);
  return { total: db.employes.length, actifs: actifs.length,
    masse: Math.round(masse * 100) / 100, cout: Math.round(cout * 100) / 100,
    paiesMois: db.paies.filter(p => p.periode === new Date().toISOString().slice(0, 7)).length,
    congesEnAttente: db.conges.filter(c => c.statut === 'demande').length };
}

const moisLisible = p => {
  const noms = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet',
    'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  const [a, m] = String(p).split('-');
  return (noms[Number(m) - 1] || '') + ' ' + a;
};

/* ============ Routeur ============ */

/**
 * @param {object} ctx { need, notFound, flash }
 * @returns {boolean} true si la requête a été traitée
 */
async function handle(req, res, ctx) {
  const db = get();
  const path = req.pathname;
  const method = req.method;
  const flash = ctx.flash;
  const { need } = ctx;
  let m;

  if (!path.startsWith('/gestion') && !path.startsWith('/recrutement')) return false;

  const go = (url, msg) => U.redirect(res, url + (msg ? '?ok=' + encodeURIComponent(msg) : ''));

  /* ================= RECRUTEMENT — PAGES PUBLIQUES ================= */
  if (path.startsWith('/recrutement')) {
    const visiteur = ctx.user || null;
    const ouvertes = db.postes.filter(p => p.statut === 'ouvert' &&
      (!p.dateLimite || p.dateLimite >= new Date().toISOString().slice(0, 10)));

    if (path === '/recrutement' && method === 'GET') {
      return U.sendHTML(res, 200, W.recrutementPublic(ouvertes, visiteur, flash));
    }

    m = path.match(/^\/recrutement\/(pos_[a-z0-9]+)$/i);
    if (m && method === 'GET') {
      const p = ouvertes.find(x => x.id === m[1]);
      if (!p) return ctx.notFound(res, visiteur);
      return U.sendHTML(res, 200, W.offrePublique(p, visiteur, flash));
    }

    if (path === '/recrutement/postuler' && method === 'POST') {
      if (!U.rateLimit('cand:' + (req.socket.remoteAddress || 'x'), 5, 3600_000).ok) {
        return go('/recrutement', 'Trop de candidatures envoyées depuis cette connexion. Réessayez plus tard.');
      }
      let data = {}, cv = null;
      if ((req.headers['content-type'] || '').startsWith('multipart/')) {
        const mp = await U.parseMultipart(req).catch(() => null);
        if (!mp) return go('/recrutement', 'Envoi invalide. Vérifiez la taille du fichier.');
        data = mp.fields;
        const f = mp.files.find(x => x.field === 'cv' && x.filename);
        if (f) {
          const r = F.saveUpload(f, ['pdf', 'image', 'document']);
          if (!r.ok) return go('/recrutement', r.error);
          cv = r.fichier;
        }
      } else data = (await U.readBody(req)).data;

      const nom = String(data.nom || '').trim();
      const email = String(data.email || '').trim().toLowerCase();
      const tel = String(data.telephone || '').trim();
      if (!nom || (!email && !tel)) {
        return go('/recrutement', 'Le nom et au moins un moyen de contact sont obligatoires.');
      }
      const poste = db.postes.find(p => p.id === data.posteId && p.statut === 'ouvert') || null;
      const cand = {
        id: U.rid('cde', 8),
        posteId: poste ? poste.id : null,
        posteSouhaite: poste ? poste.titre : String(data.posteSouhaite || 'Candidature spontanée').slice(0, 140),
        nom: nom.slice(0, 100), email: email.slice(0, 120), telephone: tel.slice(0, 30),
        adresse: String(data.adresse || '').slice(0, 200),
        naissance: String(data.naissance || '').slice(0, 10),
        sexe: ['F', 'M', 'autre'].includes(data.sexe) ? data.sexe : '',
        nationalite: String(data.nationalite || '').slice(0, 60),
        niveauEtudes: String(data.niveauEtudes || '').slice(0, 120),
        diplome: String(data.diplome || '').slice(0, 140),
        experienceAnnees: Math.max(0, Math.min(60, Number(data.experienceAnnees) || 0)),
        disponibilite: String(data.disponibilite || '').slice(0, 80),
        pretentionSalariale: Math.max(0, Math.round((Number(data.pretentionSalariale) || 0) * 100) / 100),
        lettre: String(data.lettre || '').slice(0, 3000),
        cvUrl: cv ? cv.url : null, cvNom: cv ? cv.nomOriginal : null,
        statut: 'recue', decisions: [], recueLe: new Date().toISOString()
      };
      db.candidaturesEmploi.push(cand);
      audit(null, 'rh.candidature.recue', { poste: cand.posteSouhaite });
      save();
      return U.sendHTML(res, 200, W.candidatureEnvoyee(cand, visiteur));
    }

    return false;
  }

  const a = need(req, res, ['admin']);
  if (!a) return true;

  /* ---------- Vue d'ensemble ---------- */
  if (path === '/gestion' && method === 'GET') {
    const bal = G.balance(db.ecritures, db.comptes);
    const res2 = G.compteDeResultat(db.ecritures, db.comptes);
    return U.sendHTML(res, 200, W.tableauDeBord(a, {
      scolarite: statsScolarite(db), rh: statsRH(db),
      compta: { ecritures: db.ecritures.length, equilibree: bal.equilibree,
        resultat: res2.resultat, produits: res2.totalProduits, charges: res2.totalCharges,
        exercice: exerciceCourant() }
    }, flash));
  }

  /* ================= SCOLARITÉ ================= */

  if (path === '/gestion/etudiants' && method === 'GET') {
    const q = (req.query.get('q') || '').toLowerCase();
    const st = req.query.get('statut') || '';
    let list = db.etudiants.map(e => Object.assign({}, e, {
      nomComplet: nomComplet(e),
      situation: G.situationScolarite({ echeancier: toutEcheancier(e) })
    }));
    if (q) list = list.filter(e => (e.nomComplet + ' ' + e.matricule + ' ' +
      (e.telephone || '') + ' ' + (e.email || '')).toLowerCase().includes(q));
    if (st) list = list.filter(e => e.statut === st);
    list.sort((x, y) => x.nomComplet.localeCompare(y.nomComplet));
    return U.sendHTML(res, 200, W.listeEtudiants(a, list, { q, st }, statsScolarite(db), flash));
  }

  if (path === '/gestion/etudiants/nouveau') {
    if (method === 'POST') {
      const { data } = await U.readBody(req);
      const nom = String(data.nom || '').trim(), prenom = String(data.prenom || '').trim();
      if (!nom || !prenom) return go('/gestion/etudiants/nouveau', 'Nom et prénom sont obligatoires.');
      const an = new Date().getFullYear();
      const et = {
        id: U.rid('etu', 8),
        matricule: G.matricule(an, sequence('matricule_' + an)),
        nom: nom.slice(0, 80), prenom: prenom.slice(0, 80),
        sexe: ['F', 'M', 'autre'].includes(data.sexe) ? data.sexe : 'autre',
        naissance: String(data.naissance || '').slice(0, 10),
        lieuNaissance: String(data.lieuNaissance || '').slice(0, 80),
        telephone: String(data.telephone || '').slice(0, 30),
        email: String(data.email || '').trim().toLowerCase().slice(0, 120),
        adresse: String(data.adresse || '').slice(0, 200),
        nif: String(data.nif || '').slice(0, 30),
        niveauScolaire: String(data.niveauScolaire || '').slice(0, 80),
        tuteurNom: String(data.tuteurNom || '').slice(0, 100),
        tuteurTel: String(data.tuteurTel || '').slice(0, 30),
        userId: String(data.userId || '') || null,
        statut: 'actif',
        inscriptions: [], paiements: [],
        ouvertLe: new Date().toISOString(), ouvertPar: a.id
      };
      db.etudiants.push(et);
      audit(a.id, 'scolarite.dossier.creation', { matricule: et.matricule });
      save();
      return go('/gestion/etudiant/' + et.id, 'Dossier ' + et.matricule + ' ouvert.');
    }
    return U.sendHTML(res, 200, W.formEtudiant(a, null, db.users.filter(u => u.role === 'apprenant'), flash));
  }

  m = path.match(/^\/gestion\/etudiant\/(etu_[a-z0-9]+)$/i);
  if (m && method === 'GET') {
    const et = dossierEtudiant(db, m[1]);
    if (!et) return ctx.notFound(res, a);
    return U.sendHTML(res, 200, W.ficheEtudiant(a, et, db.courses, flash));
  }

  /* --- Inscription : crée l'échéancier et la facturation comptable --- */
  m = path.match(/^\/gestion\/etudiant\/(etu_[a-z0-9]+)\/inscrire$/i);
  if (m && method === 'POST') {
    const et = db.etudiants.find(x => x.id === m[1]);
    if (!et) return ctx.notFound(res, a);
    const { data } = await U.readBody(req);
    const cours = db.courses.find(c => c.id === data.courseId);
    const frais = Math.max(0, Math.round((Number(data.frais) || 0) * 100) / 100);
    const nb = Math.max(1, Math.min(24, Number(data.versements) || 1));
    const debut = String(data.debut || '').slice(0, 10) || new Date().toISOString().slice(0, 10);
    const inscription = {
      id: U.rid('ins', 8),
      courseId: cours ? cours.id : null,
      intitule: cours ? cours.titre : String(data.intitule || 'Formation').slice(0, 140),
      periode: String(data.periode || '').slice(0, 40) || String(new Date().getFullYear()),
      dateInscription: new Date().toISOString(),
      statut: 'en_cours',
      echeancier: frais > 0 ? G.echeancier(frais, nb, debut) : []
    };
    et.inscriptions.push(inscription);

    let note = 'Inscription enregistrée.';
    if (frais > 0) {
      const r = ecritureFacturation(db, Object.assign({}, et, { nomComplet: nomComplet(et) }), inscription, a.id);
      note += r.ok && r.ecriture ? ' Écriture ' + r.ecriture.numero + ' générée.'
        : ' Attention : ' + (r.erreurs || []).join(' ');
    }
    audit(a.id, 'scolarite.inscription', { matricule: et.matricule, frais });
    save();
    return go('/gestion/etudiant/' + et.id, note);
  }

  /* --- Encaissement : imputé aux échéances les plus anciennes --- */
  m = path.match(/^\/gestion\/etudiant\/(etu_[a-z0-9]+)\/encaisser$/i);
  if (m && method === 'POST') {
    const et = db.etudiants.find(x => x.id === m[1]);
    if (!et) return ctx.notFound(res, a);
    const { data } = await U.readBody(req);
    let montant = Math.round((Number(data.montant) || 0) * 100) / 100;
    if (montant <= 0) return go('/gestion/etudiant/' + et.id, 'Le montant doit être positif.');

    const situation = G.situationScolarite({ echeancier: toutEcheancier(et) });
    if (montant > situation.solde) {
      return go('/gestion/etudiant/' + et.id,
        'Montant supérieur au solde dû (' + U.fmtHTG(situation.solde) + ').');
    }

    // Imputation chronologique sur les échéances ouvertes
    const ouvertes = toutEcheancier(et)
      .filter(l => (Number(l.regle) || 0) < (Number(l.montant) || 0))
      .sort((x, y) => x.echeance.localeCompare(y.echeance));
    let restant = montant;
    const imputations = [];
    for (const l of ouvertes) {
      if (restant <= 0) break;
      const manque = Math.round(((Number(l.montant) || 0) - (Number(l.regle) || 0)) * 100) / 100;
      const part = Math.min(manque, restant);
      l.regle = Math.round(((Number(l.regle) || 0) + part) * 100) / 100;
      restant = Math.round((restant - part) * 100) / 100;
      imputations.push({ echeance: l.echeance, rang: l.rang, montant: part });
    }

    const mode = ['caisse', 'banque', 'moncash', 'natcash'].includes(data.mode) ? data.mode : 'caisse';
    const paiement = {
      id: U.rid('pay', 8),
      recu: 'REC-' + new Date().getFullYear() + '-' + String(sequence('recu_' + new Date().getFullYear())).padStart(5, '0'),
      date: String(data.date || '').slice(0, 10) || new Date().toISOString().slice(0, 10),
      montant, mode, imputations,
      note: String(data.note || '').slice(0, 200),
      encaissePar: a.id, encaisseLe: new Date().toISOString()
    };
    et.paiements = et.paiements || [];
    et.paiements.push(paiement);

    const r = ecritureEncaissement(db, Object.assign({}, et, { nomComplet: nomComplet(et) }), paiement, a.id);
    audit(a.id, 'scolarite.encaissement', { matricule: et.matricule, montant, recu: paiement.recu });
    save();
    return go('/gestion/etudiant/' + et.id, 'Reçu ' + paiement.recu + ' — ' + U.fmtHTG(montant) +
      (r.ok && r.ecriture ? ' · écriture ' + r.ecriture.numero : ''));
  }

  /* --- Statut du dossier --- */
  m = path.match(/^\/gestion\/etudiant\/(etu_[a-z0-9]+)\/statut$/i);
  if (m && method === 'POST') {
    const et = db.etudiants.find(x => x.id === m[1]);
    if (!et) return ctx.notFound(res, a);
    const { data } = await U.readBody(req);
    if (['actif', 'suspendu', 'diplome', 'abandon'].includes(data.statut)) {
      et.statut = data.statut;
      et.statutMotif = String(data.motif || '').slice(0, 200);
      audit(a.id, 'scolarite.statut', { matricule: et.matricule, statut: data.statut });
      save();
    }
    return go('/gestion/etudiant/' + et.id, 'Statut du dossier mis à jour.');
  }

  /* --- État de recouvrement --- */
  if (path === '/gestion/recouvrement' && method === 'GET') {
    const auj = new Date().toISOString().slice(0, 10);
    const list = db.etudiants.map(e => {
      const s = G.situationScolarite({ echeancier: toutEcheancier(e) }, auj);
      const retards = toutEcheancier(e)
        .filter(l => l.echeance < auj && (Number(l.regle) || 0) < (Number(l.montant) || 0))
        .map(l => ({ ...l, reste: Math.round(((Number(l.montant) || 0) - (Number(l.regle) || 0)) * 100) / 100 }))
        .sort((x, y) => x.echeance.localeCompare(y.echeance));
      return { ...e, nomComplet: nomComplet(e), situation: s, retards,
        anciennete: retards.length ? Math.floor((new Date(auj) - new Date(retards[0].echeance)) / 86400000) : 0 };
    }).filter(e => e.situation.montantRetard > 0)
      .sort((x, y) => y.anciennete - x.anciennete);
    return U.sendHTML(res, 200, W.recouvrement(a, list, statsScolarite(db), flash));
  }

  /* ================= RESSOURCES HUMAINES ================= */

  if (path === '/gestion/rh' && method === 'GET') {
    const P = paramsPaie();
    const list = db.employes.map(e => Object.assign({}, e, {
      conges: G.droitsConges(e.dateEmbauche, null, e.congesPris || 0, P),
      paie: G.calculerPaie({ salaireBase: e.salaireBase, params: P })
    })).sort((x, y) => x.nom.localeCompare(y.nom));
    return U.sendHTML(res, 200, W.listeEmployes(a, list, statsRH(db), flash));
  }

  if (path === '/gestion/rh/nouveau') {
    if (method === 'POST') {
      const { data } = await U.readBody(req);
      const nom = String(data.nom || '').trim();
      if (!nom) return go('/gestion/rh/nouveau', 'Le nom est obligatoire.');
      const an = new Date().getFullYear();
      const emp = {
        id: U.rid('emp', 8),
        matricule: 'EMP-' + an + '-' + String(sequence('matricule_emp_' + an)).padStart(3, '0'),
        nom: nom.slice(0, 100),
        poste: String(data.poste || '').slice(0, 100),
        departement: String(data.departement || '').slice(0, 80),
        typeContrat: ['indetermine', 'determine', 'prestation', 'stage'].includes(data.typeContrat)
          ? data.typeContrat : 'indetermine',
        dateEmbauche: String(data.dateEmbauche || '').slice(0, 10) || new Date().toISOString().slice(0, 10),
        dateFin: String(data.dateFin || '').slice(0, 10) || null,
        salaireBase: Math.max(0, Math.round((Number(data.salaireBase) || 0) * 100) / 100),
        telephone: String(data.telephone || '').slice(0, 30),
        email: String(data.email || '').trim().toLowerCase().slice(0, 120),
        adresse: String(data.adresse || '').slice(0, 200),
        // Énonciations exigées par l'article 22 du Code du travail
        naissance: String(data.naissance || '').slice(0, 10),
        sexe: ['F', 'M', 'autre'].includes(data.sexe) ? data.sexe : '',
        nationalite: String(data.nationalite || '').slice(0, 60),
        etatCivil: ['celibataire', 'marie', 'divorce', 'veuf', 'union']
          .includes(data.etatCivil) ? data.etatCivil : '',
        cin: String(data.cin || '').slice(0, 40),
        numeroLivret: String(data.numeroLivret || '').slice(0, 40),
        nif: String(data.nif || '').slice(0, 30),
        numeroOna: String(data.numeroOna || '').slice(0, 30),
        urgenceNom: String(data.urgenceNom || '').slice(0, 100),
        urgenceTel: String(data.urgenceTel || '').slice(0, 30),
        statut: 'actif', congesPris: 0,
        candidatureId: String(data.candidatureId || '') || null,
        ouvertLe: new Date().toISOString()
      };
      db.employes.push(emp);
      audit(a.id, 'rh.dossier.creation', { matricule: emp.matricule });
      save();
      return go('/gestion/rh/employe/' + emp.id, 'Dossier ' + emp.matricule + ' créé.');
    }
    return U.sendHTML(res, 200, W.formEmploye(a, null, flash));
  }

  m = path.match(/^\/gestion\/rh\/employe\/(emp_[a-z0-9]+)$/i);
  if (m && method === 'GET') {
    const emp = db.employes.find(x => x.id === m[1]);
    if (!emp) return ctx.notFound(res, a);
    const P = paramsPaie();
    const bulletins = db.paies.filter(p => p.employeId === emp.id)
      .sort((x, y) => y.periode.localeCompare(x.periode));
    return U.sendHTML(res, 200, W.ficheEmploye(a, emp, {
      simulation: G.calculerPaie({ salaireBase: emp.salaireBase, params: P }),
      conges: G.droitsConges(emp.dateEmbauche, null, emp.congesPris || 0, P),
      boni: G.calculerBoni(emp.salaireBase, moisDepuis(emp.dateEmbauche), P),
      bulletins, demandes: db.conges.filter(c => c.employeId === emp.id),
      controleContrat: emp.contrat ? G.verifierContrat(emp, emp.contrat) : null,
      typeContrat: G.TYPES_CONTRAT.find(t => t.id === (emp.contrat || {}).type) || null,
      preavis: G.preavisDu(emp.dateEmbauche)
    }, flash));
  }

  /* --- Contrat de travail --- */
  m = path.match(/^\/gestion\/rh\/employe\/(emp_[a-z0-9]+)\/contrat$/i);
  if (m) {
    const emp = db.employes.find(x => x.id === m[1]);
    if (!emp) return ctx.notFound(res, a);
    if (method === 'POST') {
      const { data } = await U.readBody(req);
      const type = G.TYPES_CONTRAT.some(t => t.id === data.type) ? data.type : 'indetermine';
      const c = emp.contrat = Object.assign({}, emp.contrat, {
        type,
        dateDebut: String(data.dateDebut || '').slice(0, 10) || emp.dateEmbauche,
        dateFin: String(data.dateFin || '').slice(0, 10) || null,
        nature: String(data.nature || '').slice(0, 600),
        lieuTravail: String(data.lieuTravail || '').slice(0, 160),
        heuresJour: Math.max(0, Math.min(12, Number(data.heuresJour) || 0)),
        heuresSemaine: Math.max(0, Math.min(60, Number(data.heuresSemaine) || 0)),
        horaire: String(data.horaire || '').slice(0, 200),
        salaire: Math.max(0, Math.round((Number(data.salaire) || 0) * 100) / 100),
        periodicite: ['mensuelle', 'quinzaine', 'hebdomadaire', 'journaliere']
          .includes(data.periodicite) ? data.periodicite : 'mensuelle',
        avantages: String(data.avantages || '').slice(0, 600),
        clausesParticulieres: String(data.clausesParticulieres || '').slice(0, 1500),
        lieuSignature: String(data.lieuSignature || '').slice(0, 80),
        dateSignature: String(data.dateSignature || '').slice(0, 10),
        majLe: new Date().toISOString(), majPar: a.id
      });
      // Le type de contrat du dossier suit celui du contrat signé
      emp.typeContrat = type;
      if (c.dateFin) emp.dateFin = c.dateFin;
      if (c.salaire > 0 && c.salaire !== emp.salaireBase) {
        emp.historiqueSalaire = emp.historiqueSalaire || [];
        emp.historiqueSalaire.push({ le: new Date().toISOString(),
          de: emp.salaireBase, a: c.salaire, par: a.id, motif: 'Contrat de travail' });
        emp.salaireBase = c.salaire;
      }
      const ctrl = G.verifierContrat(emp, c);
      if (data.activer === '1') {
        if (!ctrl.complet) {
          return go('/gestion/rh/employe/' + emp.id + '/contrat',
            'Contrat enregistré, mais non activé : ' + ctrl.manquants.length +
            ' énonciation(s) de l’article 22 manquent encore.');
        }
        c.statut = 'actif';
      } else if (!c.statut) c.statut = 'brouillon';
      audit(a.id, 'rh.contrat', { matricule: emp.matricule, statut: c.statut });
      save();
      return go('/gestion/rh/employe/' + emp.id + '/contrat',
        ctrl.complet ? 'Contrat enregistré — les énonciations de l’article 22 sont au complet.'
                     : 'Contrat enregistré. ' + ctrl.manquants.length + ' énonciation(s) à compléter.');
    }
    const c = emp.contrat || {};
    return U.sendHTML(res, 200, W.pageContrat(a, emp, c, {
      controle: G.verifierContrat(emp, c),
      preavis: G.preavisDu(emp.dateEmbauche),
      types: G.TYPES_CONTRAT, duree: G.DUREE_LEGALE, preavisTable: G.PREAVIS
    }, flash));
  }

  /* --- Contrat imprimable --- */
  m = path.match(/^\/gestion\/rh\/employe\/(emp_[a-z0-9]+)\/contrat\/document$/i);
  if (m && method === 'GET') {
    const emp = db.employes.find(x => x.id === m[1]);
    if (!emp) return ctx.notFound(res, a);
    const c = emp.contrat || {};
    return U.sendHTML(res, 200, W.contratDocument(a, emp, c, {
      controle: G.verifierContrat(emp, c),
      preavisTable: G.PREAVIS,
      type: G.TYPES_CONTRAT.find(t => t.id === c.type) || G.TYPES_CONTRAT[0],
      // Mêmes sceau et signataire que les certificats
      parametres: ctx.parametresCertificat(db)
    }));
  }

  m = path.match(/^\/gestion\/rh\/employe\/(emp_[a-z0-9]+)\/modifier$/i);
  if (m && method === 'POST') {
    const emp = db.employes.find(x => x.id === m[1]);
    if (!emp) return ctx.notFound(res, a);
    const { data } = await U.readBody(req);
    const ancien = emp.salaireBase;
    for (const champ of ['poste', 'departement', 'telephone', 'email', 'adresse', 'nif',
      'numeroOna', 'urgenceNom', 'urgenceTel', 'nationalite', 'cin', 'numeroLivret', 'naissance']) {
      if (data[champ] !== undefined) emp[champ] = String(data[champ]).slice(0, 200);
    }
    if (['F', 'M', 'autre'].includes(data.sexe)) emp.sexe = data.sexe;
    if (['celibataire', 'marie', 'divorce', 'veuf', 'union'].includes(data.etatCivil)) {
      emp.etatCivil = data.etatCivil;
    }
    if (data.salaireBase !== undefined) {
      emp.salaireBase = Math.max(0, Math.round((Number(data.salaireBase) || 0) * 100) / 100);
      if (emp.salaireBase !== ancien) {
        emp.historiqueSalaire = emp.historiqueSalaire || [];
        emp.historiqueSalaire.push({ le: new Date().toISOString(), de: ancien, a: emp.salaireBase, par: a.id });
      }
    }
    if (['actif', 'suspendu', 'sorti'].includes(data.statut)) emp.statut = data.statut;
    if (data.dateFin !== undefined) emp.dateFin = String(data.dateFin).slice(0, 10) || null;
    audit(a.id, 'rh.dossier.modification', { matricule: emp.matricule });
    save();
    return go('/gestion/rh/employe/' + emp.id, 'Dossier mis à jour.');
  }

  /* --- Paie : préparation du mois --- */
  if (path === '/gestion/rh/paie') {
    const periode = (req.query.get('periode') || new Date().toISOString().slice(0, 7)).slice(0, 7);
    if (method === 'POST') {
      const { data } = await U.readBody(req);
      const p = String(data.periode || periode).slice(0, 7);
      const P = paramsPaie();
      let faits = 0;
      for (const emp of db.employes.filter(e => e.statut === 'actif')) {
        if (db.paies.some(x => x.employeId === emp.id && x.periode === p)) continue;
        const primes = Math.max(0, Number(data['prime_' + emp.id]) || 0);
        const retenues = Math.max(0, Number(data['retenue_' + emp.id]) || 0);
        db.paies.push({
          id: U.rid('pai', 8), employeId: emp.id, periode: p,
          calcul: G.calculerPaie({ salaireBase: emp.salaireBase, primes, retenues, params: P }),
          parametresUtilises: JSON.parse(JSON.stringify({ ...P, iri: P.iri.map(t => ({
            jusqua: t.jusqua === Infinity ? null : t.jusqua, taux: t.taux })) })),
          statut: 'brouillon', creeeLe: new Date().toISOString(), creeePar: a.id
        });
        faits++;
      }
      audit(a.id, 'rh.paie.preparation', { periode: p, bulletins: faits });
      save();
      return go('/gestion/rh/paie?periode=' + p, faits + ' bulletin(s) préparé(s) pour ' + moisLisible(p) + '.');
    }
    const P = paramsPaie();
    const actifs = db.employes.filter(e => e.statut === 'actif');
    const bulletins = db.paies.filter(p => p.periode === periode).map(p => Object.assign({}, p, {
      employe: db.employes.find(e => e.id === p.employeId) || { nom: '—', matricule: '—' }
    }));
    const aPreparer = actifs.filter(e => !bulletins.some(b => b.employeId === e.id));
    return U.sendHTML(res, 200, W.pagePaie(a, {
      periode, periodeLisible: moisLisible(periode), bulletins, aPreparer, params: P,
      totaux: bulletins.reduce((t, b) => ({
        brut: t.brut + b.calcul.brut, net: t.net + b.calcul.net,
        iri: t.iri + b.calcul.iri, cotisations: t.cotisations + b.calcul.salariales.total + b.calcul.patronales.total,
        cout: t.cout + b.calcul.coutEmployeur
      }), { brut: 0, net: 0, iri: 0, cotisations: 0, cout: 0 })
    }, flash));
  }

  /* --- Validation d'un bulletin : génère l'écriture de paie --- */
  m = path.match(/^\/gestion\/rh\/bulletin\/(pai_[a-z0-9]+)\/valider$/i);
  if (m && method === 'POST') {
    const p = db.paies.find(x => x.id === m[1]);
    if (!p) return ctx.notFound(res, a);
    if (p.statut !== 'brouillon') return go('/gestion/rh/paie?periode=' + p.periode, 'Bulletin déjà validé.');
    const emp = db.employes.find(e => e.id === p.employeId);
    const r = ecriturePaie(db, emp, p, a.id);
    if (!r.ok) return go('/gestion/rh/paie?periode=' + p.periode, 'Écriture refusée : ' + r.erreurs.join(' '));
    p.statut = 'validee'; p.ecritureId = r.ecriture.id;
    p.valideeLe = new Date().toISOString(); p.valideePar = a.id;
    audit(a.id, 'rh.paie.validation', { bulletin: p.id, numero: r.ecriture.numero });
    save();
    return go('/gestion/rh/paie?periode=' + p.periode,
      'Bulletin validé — écriture ' + r.ecriture.numero + ' générée.');
  }

  m = path.match(/^\/gestion\/rh\/bulletin\/(pai_[a-z0-9]+)\/supprimer$/i);
  if (m && method === 'POST') {
    const i = db.paies.findIndex(x => x.id === m[1] && x.statut === 'brouillon');
    if (i >= 0) {
      const p = db.paies[i];
      db.paies.splice(i, 1);
      audit(a.id, 'rh.paie.suppression', { bulletin: p.id });
      save();
      return go('/gestion/rh/paie?periode=' + p.periode, 'Brouillon supprimé.');
    }
    return go('/gestion/rh/paie', 'Un bulletin validé ne se supprime pas.');
  }

  m = path.match(/^\/gestion\/rh\/bulletin\/(pai_[a-z0-9]+)$/i);
  if (m && method === 'GET') {
    const p = db.paies.find(x => x.id === m[1]);
    if (!p) return ctx.notFound(res, a);
    const emp = db.employes.find(e => e.id === p.employeId) || { nom: '—' };
    return U.sendHTML(res, 200, W.bulletinPaie(a, emp, p, moisLisible(p.periode),
      ctx.parametresCertificat(db), flash));
  }

  /* --- Congés --- */
  if (path === '/gestion/rh/conges') {
    if (method === 'POST') {
      const { data } = await U.readBody(req);
      if (data.action === 'demander') {
        const emp = db.employes.find(e => e.id === data.employeId);
        if (!emp) return go('/gestion/rh/conges', 'Employé introuvable.');
        const jours = Math.max(0.5, Math.min(60, Number(data.jours) || 1));
        db.conges.push({
          id: U.rid('cng', 8), employeId: emp.id, type: ['annuel', 'maladie', 'maternite', 'exceptionnel']
            .includes(data.type) ? data.type : 'annuel',
          debut: String(data.debut || '').slice(0, 10), jours,
          motif: String(data.motif || '').slice(0, 200),
          statut: 'demande', demandeLe: new Date().toISOString()
        });
        save();
        return go('/gestion/rh/conges', 'Demande enregistrée.');
      }
      const c = db.conges.find(x => x.id === data.id && x.statut === 'demande');
      if (c && ['accorde', 'refuse'].includes(data.decision)) {
        c.statut = data.decision;
        c.decideLe = new Date().toISOString(); c.decidePar = a.id;
        c.commentaire = String(data.commentaire || '').slice(0, 200);
        if (data.decision === 'accorde' && c.type === 'annuel') {
          const emp = db.employes.find(e => e.id === c.employeId);
          if (emp) emp.congesPris = Math.round(((emp.congesPris || 0) + c.jours) * 10) / 10;
        }
        audit(a.id, 'rh.conge.' + data.decision, { conge: c.id });
        save();
      }
      return go('/gestion/rh/conges', 'Décision enregistrée.');
    }
    const P = paramsPaie();
    const list = db.conges.map(c => Object.assign({}, c, {
      employe: db.employes.find(e => e.id === c.employeId) || { nom: '—', matricule: '—' }
    })).sort((x, y) => (y.demandeLe || '').localeCompare(x.demandeLe || ''));
    const soldes = db.employes.filter(e => e.statut === 'actif').map(e => Object.assign({}, e, {
      droits: G.droitsConges(e.dateEmbauche, null, e.congesPris || 0, P)
    }));
    return U.sendHTML(res, 200, W.pageConges(a, list, soldes, flash));
  }

  /* ---------- RECRUTEMENT ---------- */

  if (path === '/gestion/rh/recrutement') {
    if (method === 'POST') {
      const { data } = await U.readBody(req);
      if (data.action === 'ouvrir') {
        const titre = String(data.titre || '').trim();
        if (!titre) return go('/gestion/rh/recrutement', 'L’intitulé du poste est obligatoire.');
        const an2 = new Date().getFullYear();
        db.postes.push({
          id: U.rid('pos', 8),
          reference: 'OAS-REC-' + String(sequence('poste_' + an2)).padStart(3, '0'),
          titre: titre.slice(0, 140),
          departement: String(data.departement || '').slice(0, 80),
          typeContrat: G.TYPES_CONTRAT.some(t => t.id === data.typeContrat) ? data.typeContrat : 'indetermine',
          lieu: String(data.lieu || '').slice(0, 100),
          description: String(data.description || '').slice(0, 2000),
          profil: String(data.profil || '').slice(0, 2000),
          salaireIndicatif: String(data.salaireIndicatif || '').slice(0, 120),
          dateLimite: String(data.dateLimite || '').slice(0, 10) || null,
          statut: 'ouvert', creeLe: new Date().toISOString(), creePar: a.id
        });
        audit(a.id, 'rh.poste.ouverture', { titre });
        save();
        return go('/gestion/rh/recrutement', 'Offre publiée. Elle apparaît désormais sur la page publique de recrutement.');
      }
      if (data.action === 'fermer' || data.action === 'rouvrir') {
        const p = db.postes.find(x => x.id === data.id);
        if (p) {
          p.statut = data.action === 'fermer' ? 'ferme' : 'ouvert';
          audit(a.id, 'rh.poste.' + p.statut, { poste: p.reference });
          save();
        }
        return go('/gestion/rh/recrutement', data.action === 'fermer'
          ? 'Offre retirée de la page publique.' : 'Offre republiée.');
      }
    }
    const postes = db.postes.map(p => Object.assign({}, p, {
      nbCandidatures: db.candidaturesEmploi.filter(c => c.posteId === p.id).length
    })).sort((x, y) => (y.creeLe || '').localeCompare(x.creeLe || ''));
    const candidatures = db.candidaturesEmploi.map(c => Object.assign({}, c, {
      poste: db.postes.find(p => p.id === c.posteId) || null
    })).sort((x, y) => (y.recueLe || '').localeCompare(x.recueLe || ''));
    return U.sendHTML(res, 200, W.pageRecrutement(a, postes, candidatures, {
      lienPublic: U.baseUrl(req) + '/recrutement',
      types: G.TYPES_CONTRAT
    }, flash));
  }

  m = path.match(/^\/gestion\/rh\/candidature\/(cde_[a-z0-9]+)$/i);
  if (m) {
    const cand = db.candidaturesEmploi.find(x => x.id === m[1]);
    if (!cand) return ctx.notFound(res, a);
    if (method === 'POST') {
      const { data } = await U.readBody(req);
      const etats = ['recue', 'preselection', 'entretien', 'retenue', 'rejetee'];
      if (etats.includes(data.statut)) {
        cand.statut = data.statut;
        cand.decisions = cand.decisions || [];
        cand.decisions.push({ le: new Date().toISOString(), par: a.id, statut: data.statut,
          note: String(data.note || '').slice(0, 400) });
        audit(a.id, 'rh.candidature.' + data.statut, { candidature: cand.id });
        save();
      }
      return go('/gestion/rh/candidature/' + cand.id, 'Suivi mis à jour.');
    }
    return U.sendHTML(res, 200, W.ficheCandidature(a, cand,
      db.postes.find(p => p.id === cand.posteId) || null,
      db.employes.find(e => e.candidatureId === cand.id) || null, flash));
  }

  /* --- Embaucher : pré-remplit le dossier employé depuis la candidature --- */
  m = path.match(/^\/gestion\/rh\/candidature\/(cde_[a-z0-9]+)\/embaucher$/i);
  if (m && method === 'GET') {
    const cand = db.candidaturesEmploi.find(x => x.id === m[1]);
    if (!cand) return ctx.notFound(res, a);
    const poste = db.postes.find(p => p.id === cand.posteId) || null;
    return U.sendHTML(res, 200, W.formEmploye(a, null, flash, {
      nom: cand.nom, telephone: cand.telephone, email: cand.email, adresse: cand.adresse,
      poste: cand.posteSouhaite || (poste ? poste.titre : ''),
      departement: poste ? poste.departement : '',
      typeContrat: poste ? poste.typeContrat : 'indetermine',
      salaireBase: cand.pretentionSalariale || '',
      candidatureId: cand.id, depuis: cand.nom
    }));
  }

  /* --- Paramètres de paie --- */
  if (path === '/gestion/rh/parametres') {
    if (method === 'POST') {
      const { data } = await U.readBody(req);
      const taux = v => Math.max(0, Math.min(1, (Number(v) || 0) / 100));
      const p = db.parametres.paie = db.parametres.paie || {};
      p.ona = { salarie: taux(data.onaSalarie), employeur: taux(data.onaEmployeur) };
      p.ofatmaMaladie = { employeur: taux(data.ofatmaMaladie) };
      p.ofatmaAccident = { employeur: taux(data.ofatmaAccident) };
      p.congesAnnuelsJours = Math.max(0, Math.min(60, Number(data.congesAnnuelsJours) || 15));
      p.boniMois = Math.max(0, Math.min(3, Number(data.boniMois) || 1));
      const seuils = [], tx = [];
      for (let i = 1; i <= 5; i++) {
        const s = data['seuil' + i], t = data['taux' + i];
        if (t !== undefined && t !== '') { seuils.push(s === '' || s === undefined ? null : Number(s)); tx.push(taux(t)); }
      }
      if (tx.length) p.iri = tx.map((t, i) => ({ jusqua: seuils[i], taux: t }));
      audit(a.id, 'rh.parametres', null);
      save();
      return go('/gestion/rh/parametres', 'Paramètres de paie enregistrés.');
    }
    return U.sendHTML(res, 200, W.parametresPaie(a, paramsPaie(), flash));
  }

  /* ================= COMPTABILITÉ ================= */

  if (path === '/gestion/compta' && method === 'GET') {
    const ex = exerciceCourant();
    const ecr = db.ecritures.filter(e => !ex || e.exerciceId === ex.id);
    const res2 = G.compteDeResultat(ecr, db.comptes);
    const bal = G.balance(ecr, db.comptes);
    const tresorerie = G.grandLivre(ecr, db.comptes)
      .filter(c => G.classeDe(c.num) === '5');
    return U.sendHTML(res, 200, W.comptaAccueil(a, {
      exercice: ex, exercices: db.exercices, journaux: JOURNAUX,
      nbEcritures: ecr.length, resultat: res2, balance: bal, tresorerie,
      dernieres: ecr.slice(-8).reverse()
    }, flash));
  }

  if (path === '/gestion/compta/journal' && method === 'GET') {
    const j = req.query.get('journal') || '';
    const ex = req.query.get('exercice') || (exerciceCourant() || {}).id;
    let list = db.ecritures.filter(e => !ex || e.exerciceId === ex);
    if (j) list = list.filter(e => e.journal === j);
    list = list.sort((x, y) => (x.date + x.numero).localeCompare(y.date + y.numero));
    return U.sendHTML(res, 200, W.journal(a, list, { journal: j, exercice: ex },
      JOURNAUX, db.exercices, flash));
  }

  if (path === '/gestion/compta/saisie') {
    if (method === 'POST') {
      const { data } = await U.readBody(req);
      const lignes = [];
      for (let i = 1; i <= 8; i++) {
        const c = data['compte' + i];
        if (!c) continue;
        const d = Number(data['debit' + i]) || 0, cr = Number(data['credit' + i]) || 0;
        if (d === 0 && cr === 0) continue;
        lignes.push({ compte: c, libelle: data['libelle' + i] || '', debit: d, credit: cr });
      }
      const brouillon = {
        journal: data.journal, date: String(data.date || '').slice(0, 10),
        piece: data.piece, libelle: data.libelle, lignes
      };
      const r = enregistrer(db, brouillon, a.id);
      if (!r.ok) {
        return U.sendHTML(res, 200, W.saisieEcriture(a, db.comptes, JOURNAUX,
          exerciceCourant(), r.erreurs, brouillon, null));
      }
      save();
      return go('/gestion/compta/journal', 'Écriture ' + r.ecriture.numero + ' enregistrée.');
    }
    return U.sendHTML(res, 200, W.saisieEcriture(a, db.comptes, JOURNAUX,
      exerciceCourant(), null, null, flash));
  }

  /* --- Contre-passation : on corrige sans jamais effacer --- */
  m = path.match(/^\/gestion\/compta\/ecriture\/(ecr_[a-z0-9]+)\/extourner$/i);
  if (m && method === 'POST') {
    const e = db.ecritures.find(x => x.id === m[1]);
    if (!e) return ctx.notFound(res, a);
    if (db.ecritures.some(x => x.extourneDe === e.numero)) {
      return go('/gestion/compta/journal', 'Cette écriture a déjà été extournée.');
    }
    const date = new Date().toISOString().slice(0, 10);
    const miroir = G.contrePasser(e, date, null);
    const r = enregistrer(db, Object.assign(miroir, { source: 'extourne', refSource: e.id }), a.id);
    if (!r.ok) return go('/gestion/compta/journal', 'Extourne refusée : ' + r.erreurs.join(' '));
    r.ecriture.extourneDe = e.numero;
    e.extourneePar = r.ecriture.numero;
    audit(a.id, 'compta.extourne', { origine: e.numero, miroir: r.ecriture.numero });
    save();
    return go('/gestion/compta/journal', 'Écriture ' + e.numero + ' extournée par ' + r.ecriture.numero + '.');
  }

  if (path === '/gestion/compta/grand-livre' && method === 'GET') {
    const ex = req.query.get('exercice') || (exerciceCourant() || {}).id;
    const cpt = req.query.get('compte') || '';
    const ecr = db.ecritures.filter(e => !ex || e.exerciceId === ex);
    return U.sendHTML(res, 200, W.grandLivre(a, G.grandLivre(ecr, db.comptes, cpt || null),
      { compte: cpt, exercice: ex }, db.comptes, db.exercices, flash));
  }

  if (path === '/gestion/compta/balance' && method === 'GET') {
    const ex = req.query.get('exercice') || (exerciceCourant() || {}).id;
    const ecr = db.ecritures.filter(e => !ex || e.exerciceId === ex);
    return U.sendHTML(res, 200, W.pageBalance(a, G.balance(ecr, db.comptes),
      { exercice: ex }, db.exercices, flash));
  }

  if (path === '/gestion/compta/etats' && method === 'GET') {
    const ex = req.query.get('exercice') || (exerciceCourant() || {}).id;
    const exercice = db.exercices.find(x => x.id === ex) || exerciceCourant();
    const ecr = db.ecritures.filter(e => !ex || e.exerciceId === ex);
    return U.sendHTML(res, 200, W.etatsFinanciers(a,
      G.compteDeResultat(ecr, db.comptes), G.bilan(ecr, db.comptes),
      exercice, db.exercices, flash));
  }

  /* --- Plan comptable --- */
  if (path === '/gestion/compta/plan') {
    if (method === 'POST') {
      const { data } = await U.readBody(req);
      const num = String(data.num || '').replace(/\D/g, '').slice(0, 8);
      if (num.length < 3) return go('/gestion/compta/plan', 'Le numéro de compte comporte au moins 3 chiffres.');
      if (!G.CLASSES.some(c => c.num === num.charAt(0))) {
        return go('/gestion/compta/plan', 'Le premier chiffre doit désigner une classe de 1 à 7.');
      }
      if (db.comptes.some(c => c.num === num)) return go('/gestion/compta/plan', 'Ce compte existe déjà.');
      db.comptes.push({ num, label: String(data.label || '').slice(0, 120) || 'Compte ' + num,
        classe: num.charAt(0), systeme: false, creeLe: new Date().toISOString() });
      db.comptes.sort((x, y) => x.num.localeCompare(y.num));
      audit(a.id, 'compta.plan.ajout', { compte: num });
      save();
      return go('/gestion/compta/plan', 'Compte ' + num + ' ajouté au plan.');
    }
    const mouvements = new Set();
    for (const e of db.ecritures) for (const l of e.lignes) mouvements.add(l.compte);
    return U.sendHTML(res, 200, W.planComptable(a, db.comptes, G.CLASSES, mouvements, flash));
  }

  /* --- Exercices : ouverture et clôture --- */
  if (path === '/gestion/compta/exercices') {
    if (method === 'POST') {
      const { data } = await U.readBody(req);
      if (data.action === 'ouvrir') {
        const debut = String(data.debut || '').slice(0, 10), fin = String(data.fin || '').slice(0, 10);
        if (!debut || !fin || fin <= debut) return go('/gestion/compta/exercices', 'Dates d’exercice invalides.');
        if (db.exercices.some(e => !(fin < e.debut || debut > e.fin))) {
          return go('/gestion/compta/exercices', 'Cette période chevauche un exercice existant.');
        }
        db.exercices.push({ id: U.rid('exe', 6), libelle: String(data.libelle || '').slice(0, 60) ||
          'Exercice ' + debut.slice(0, 4), debut, fin, clos: false, ouvertLe: new Date().toISOString() });
        audit(a.id, 'compta.exercice.ouverture', { debut, fin });
        save();
        return go('/gestion/compta/exercices', 'Exercice ouvert.');
      }
      if (data.action === 'cloturer') {
        const ex = db.exercices.find(e => e.id === data.id && !e.clos);
        if (!ex) return go('/gestion/compta/exercices', 'Exercice introuvable ou déjà clos.');
        const ecr = db.ecritures.filter(e => e.exerciceId === ex.id);
        const bal = G.balance(ecr, db.comptes);
        if (!bal.equilibree) return go('/gestion/compta/exercices',
          'Clôture refusée : la balance de l’exercice n’est pas équilibrée.');
        ex.clos = true; ex.closLe = new Date().toISOString(); ex.closPar = a.id;
        ex.resultat = G.compteDeResultat(ecr, db.comptes).resultat;
        audit(a.id, 'compta.exercice.cloture', { exercice: ex.id, resultat: ex.resultat });
        save();
        return go('/gestion/compta/exercices', 'Exercice clôturé. Résultat : ' + U.fmtHTG(ex.resultat));
      }
    }
    const list = db.exercices.map(e => {
      const ecr = db.ecritures.filter(x => x.exerciceId === e.id);
      return { ...e, nbEcritures: ecr.length,
        resultatCourant: G.compteDeResultat(ecr, db.comptes).resultat,
        equilibree: G.balance(ecr, db.comptes).equilibree };
    }).sort((x, y) => y.debut.localeCompare(x.debut));
    return U.sendHTML(res, 200, W.pageExercices(a, list, flash));
  }

  return false;
}

function moisDepuis(date) {
  const d = new Date(date), n = new Date();
  if (isNaN(d)) return 0;
  const an = n.getFullYear();
  const debut = d.getFullYear() === an ? d.getMonth() : 0;
  return Math.max(0, n.getMonth() - debut + 1);
}

module.exports = { handle, JOURNAUX, enregistrer, statsScolarite, statsRH };
