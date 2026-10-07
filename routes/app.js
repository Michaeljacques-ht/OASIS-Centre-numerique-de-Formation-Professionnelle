'use strict';
/* ============================================================
   OASIS — Routeur principal
   ============================================================ */
const DB = require('../lib/db');
const { get, save, audit, COMMISSION } = DB;
const U = require('../lib/utils');
const V = require('./views');
const E = require('./espaces-views');
const PP = require('../lib/plopplop');
const QR = require('../lib/qrcode');
const F = require('../lib/files');
const GEST = require('./gestion');

/* ---------- Aides quiz & complétion ---------- */
function lireQuestion(data) {
  const options = [data.opt1, data.opt2, data.opt3, data.opt4]
    .map(o => String(o || '').trim()).filter(Boolean).map(o => o.slice(0, 150));
  const bonne = Number(data.bonne) - 1;
  if (!data.question || options.length < 2 || !(bonne >= 0 && bonne < options.length)) return null;
  return { id: require('../lib/utils').rid('qst', 4),
    question: String(data.question).trim().slice(0, 300), options, bonne };
}
function corrigerQuiz(quiz, data) {
  let score = 0;
  for (const q of quiz.questions) {
    if (Number(data['q_' + q.id]) === q.bonne) score++;
  }
  const total = quiz.questions.length;
  const pct = total ? Math.round(100 * score / total) : 0;
  return { score, total, pct, reussi: pct >= 60, at: new Date().toISOString() };
}
/* ---------- Évaluation réorganisée : note globale pondérée ----------
   Note globale = moyenne des quiz de modules (poidsQuiz) + examen final
   (poidsExamen), normalisée. Un quiz non passé compte 0. Le certificat
   exige : toutes les leçons + note globale ≥ seuil + examen passé s'il existe. */
function configEvaluation(c) {
  const e = c.evaluation || {};
  return {
    poidsQuiz: Number.isFinite(Number(e.poidsQuiz)) ? Number(e.poidsQuiz) : 40,
    poidsExamen: Number.isFinite(Number(e.poidsExamen)) ? Number(e.poidsExamen) : 60,
    seuil: Number.isFinite(Number(e.seuil)) ? Number(e.seuil) : 60,
    melanger: e.melanger !== false
  };
}
function bilanNotes(enr, c) {
  const evals = (enr && enr.evaluations) || {};
  const soum = (enr && enr.soumissions) || {};
  const cfg = configEvaluation(c);
  const modulesQuiz = c.modules.filter(m => m.quiz && m.quiz.questions && m.quiz.questions.length);
  const epreuves = DB.epreuvesDe(c);
  const lignes = modulesQuiz.map(m => ({
    cible: m.id, libelle: 'Quiz — ' + m.titre,
    r: evals[m.id] || null, pct: evals[m.id] ? evals[m.id].pct : 0
  }));
  const moyQuiz = lignes.length
    ? Math.round(lignes.reduce((s, l) => s + l.pct, 0) / lignes.length) : null;

  // Examen final composite : moyenne pondérée des épreuves (chacune notée /100).
  const aExam = epreuves.length > 0;
  const lignesExam = epreuves.map(ep => {
    const sm = soum[ep.id] || null;
    const note = sm && sm.note !== null && sm.note !== undefined ? sm.note : null;
    return { ep, sm, note, enAttenteCorrection: !!(sm && note === null) };
  });
  let pctExam = null, examFait = true;
  if (aExam) {
    const poidsTotal = epreuves.reduce((s, e) => s + (Number(e.poids) || 0), 0) || 100;
    let somme = 0;
    for (const l of lignesExam) {
      if (l.note === null) { examFait = false; continue; }
      somme += l.note * (Number(l.ep.poids) || 0);
    }
    pctExam = Math.round(somme / poidsTotal);
  }
  let note = null;
  if (moyQuiz !== null && pctExam !== null) {
    note = Math.round((moyQuiz * cfg.poidsQuiz + pctExam * cfg.poidsExamen) /
      (cfg.poidsQuiz + cfg.poidsExamen || 100));
  } else if (moyQuiz !== null) note = moyQuiz;
  else if (pctExam !== null) note = pctExam;
  const aEvaluations = note !== null;
  const reussi = !aEvaluations || (note >= cfg.seuil && examFait);
  return { cfg, lignes, lignesExam, epreuves, moyQuiz, pctExam, aExam, examFait, note, aEvaluations, reussi };
}
/* Correction d'un texte à trous : {{mot}} → comparaison insensible à la casse. */
function motsTrous(texte) {
  const mots = [];
  String(texte || '').replace(/\{\{([^}]+)\}\}/g, (_, mot) => { mots.push(mot.trim()); return ''; });
  return mots;
}
function corrigerTrous(ep, data) {
  const mots = motsTrous(ep.texte);
  let score = 0;
  const reponses = mots.map((mot, i) => {
    const rep = String(data['t_' + i] || '').trim();
    const ok = rep.toLowerCase() === mot.toLowerCase();
    if (ok) score++;
    return { attendu: mot, donne: rep, ok };
  });
  const total = mots.length || 1;
  return { score, total, pct: Math.round(100 * score / total), reponses };
}
/* Compétence d'un module acquise : leçons du module terminées
   ET quiz du module réussi (≥ 60 %) s'il existe. */
function bilanCompetences(enr, c) {
  const done = new Set((enr && enr.progress) || []);
  const evals = (enr && enr.evaluations) || {};
  return c.modules.map((m, i) => {
    const lecOk = m.lecons.length > 0 && m.lecons.every(l => done.has(l.id));
    const aQuiz = m.quiz && m.quiz.questions && m.quiz.questions.length;
    const quizOk = !aQuiz || (evals[m.id] && evals[m.id].reussi);
    const commence = m.lecons.some(l => done.has(l.id)) || (aQuiz && evals[m.id]);
    return {
      module: m, index: i,
      competences: m.competences || [],
      statut: (lecOk && quizOk) ? 'acquise' : commence ? 'en_cours' : 'a_venir'
    };
  });
}
/* ---------- Relevé de notes ----------
   Code de formation dérivé du titre (lettres significatives), codes de module
   numérotés : OASIS-EXC-M01. Chaque ligne porte note, barème, pourcentage et
   compétences acquises. */
function codeFormation(c) {
  const mots = String(c.titre || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toUpperCase().split(/[^A-Z0-9]+/).filter(x => x.length > 2);
  const base = (mots[0] || 'FOR').slice(0, 3) + (mots[1] ? mots[1].slice(0, 2) : '');
  return base.slice(0, 5);
}
function releveDeNotes(enr, c) {
  const evals = (enr && enr.evaluations) || {};
  const soum = (enr && enr.soumissions) || {};
  const done = new Set((enr && enr.progress) || []);
  const code = codeFormation(c);
  const comp = bilanCompetences(enr, c);

  const modules = c.modules.map((m, i) => {
    const r = evals[m.id] || null;
    const aQuiz = !!(m.quiz && m.quiz.questions && m.quiz.questions.length);
    const lecFaites = m.lecons.filter(l => done.has(l.id)).length;
    const cm = comp[i] || { competences: [], statut: 'a_venir' };
    return {
      code: code + '-M' + String(i + 1).padStart(2, '0'),
      titre: m.titre,
      lecons: m.lecons.length, lecFaites,
      aQuiz,
      note: r ? r.score : null,
      sur: r ? r.total : (aQuiz ? m.quiz.questions.length : null),
      pct: r ? r.pct : (aQuiz ? 0 : null),
      statut: cm.statut,
      competences: cm.competences,
      acquises: cm.statut === 'acquise' ? cm.competences : []
    };
  });

  const epreuves = DB.epreuvesDe(c).map((ep, i) => {
    const sm = soum[ep.id] || null;
    const note = sm && sm.note !== null && sm.note !== undefined ? sm.note : null;
    return {
      code: code + '-E' + String(i + 1).padStart(2, '0'),
      titre: ep.titre,
      type: (DB.TYPES_EPREUVES[ep.type] || {}).label || ep.type,
      poids: ep.poids,
      note, sur: 100,
      pct: note,
      detail: sm && sm.detail ? sm.detail : null,
      feedback: sm && sm.feedback ? sm.feedback : null,
      enAttente: !!(sm && note === null)
    };
  });

  const bilan = bilanNotes(enr, c);
  const totalComp = modules.reduce((n, m) => n + m.competences.length, 0);
  const totalAcq = modules.reduce((n, m) => n + m.acquises.length, 0);
  const note = bilan.note;
  const mention = note === null ? '—'
    : note >= 90 ? 'Excellent' : note >= 80 ? 'Très bien' : note >= 70 ? 'Bien'
    : note >= 60 ? 'Assez bien' : note >= bilan.cfg.seuil ? 'Passable' : 'Insuffisant';
  const heures = c.modules.reduce((t, m) => t + m.lecons.reduce((x, l) => x + (Number(l.duree) || 0), 0), 0);

  return { code, modules, epreuves, bilan, mention, totalComp, totalAcq,
    minutes: heures, nbLecons: DB.nbLecons(c),
    leconsFaites: (enr.progress || []).length };
}

/* Complétion réelle : toutes les leçons + bilan d'évaluation réussi. */
function majCompletion(enr, c) {
  const total = require('../lib/db').nbLecons(c);
  const leconsOk = total > 0 && (enr.progress || []).length >= total;
  const bilan = bilanNotes(enr, c);
  if (leconsOk && bilan.reussi && !enr.completedAt) {
    enr.completedAt = new Date().toISOString();
  }
}
/* Paramètres du certificat (sceau, signature, signataire) avec défauts Oasis. */
function parametresCertificat(db) {
  const p = (db && db.parametres) || {};
  return {
    sceauUrl: p.sceauUrl || '/assets/sceau-oasis.png',
    signatureUrl: p.signatureUrl || '/assets/signature.png',
    signataireNom: p.signataireNom || 'Michael Jacques',
    signataireTitre: p.signataireTitre || 'Directeur général — Oasis',
    villeCertificat: p.villeCertificat || 'Port-au-Prince, Haïti'
  };
}
function urlVerification(req, enrId) {
  return U.baseUrl(req) + '/v/' + encodeURIComponent(enrId);
}
/* Accès aux espaces communautaires d'une formation (forum, annonces). */
function accesCours(db, u, c) {
  return !!(u && c && (u.role === 'admin' || c.formateurId === u.id ||
    db.enrollments.some(e => e.userId === u.id && e.courseId === c.id)));
}

/* ---------- Sessions ---------- */
function currentUser(req) {
  const db = get();
  const tok = U.parseCookies(req).eps;
  if (!tok) return null;
  const s = db.sessions.find(s => s.token === tok && s.expiresAt > Date.now());
  return s ? db.users.find(u => u.id === s.userId) || null : null;
}
function openSession(res, userId, dest) {
  const db = get();
  const token = U.rid('sess', 24);
  db.sessions.push({ token, userId, expiresAt: Date.now() + 86_400_000 });
  db.sessions = db.sessions.filter(s => s.expiresAt > Date.now());
  save();
  U.redirect(res, dest, U.sessionCookie(token));
}
function need(req, res, roles) {
  const u = currentUser(req);
  if (!u) { U.redirect(res, '/login'); return null; }
  if (roles && !roles.includes(u.role)) { U.redirect(res, '/'); return null; }
  if (u.role === 'formateur' && u.candidature && u.candidature.statut !== 'approuvee' &&
      roles && roles.includes('formateur') && !roles.includes('apprenant')) {
    U.redirect(res, '/candidature/statut');
    return null;
  }
  return u;
}

/* ---------- Aides métier ---------- */
function pctEnrollment(e, course) {
  const total = DB.nbLecons(course);
  return total ? Math.round(100 * (e.progress || []).length / total) : 0;
}
function statsPubliques(db) {
  return {
    nbCours: db.courses.filter(c => c.statut === 'publiee').length,
    nbApprenants: db.users.filter(u => u.role === 'apprenant').length + 15200,
    nbFormateurs: db.users.filter(u => u.role === 'formateur').length + 420,
    nbEntreprises: db.users.filter(u => u.role === 'entreprise').length + 200
  };
}

async function handle(req, res) {
  const db = get();
  const path = req.pathname;
  const method = req.method;
  const user = currentUser(req);
  const flash = req.query.get('ok');
  let m;

  /* ================= PUBLIC ================= */
  m = path.match(/^\/fichiers\/([a-z0-9_.-]+)$/i);
  if (m && method === 'GET') return F.serve(req, res, m[1]);

  if (path === '/' && method === 'GET') {
    return U.sendHTML(res, 200, V.landing(db.courses, statsPubliques(db), user));
  }

  if (path === '/formations' && method === 'GET') {
    const cat = req.query.get('categorie') || '';
    const fmt = req.query.get('format') || '';
    const mod = req.query.get('modalite') || '';
    const q = (req.query.get('q') || '').toLowerCase();
    let list = db.courses.filter(c => c.statut === 'publiee');
    if (cat) list = list.filter(c => c.categorie === cat);
    if (fmt) list = list.filter(c => (c.format || 'certificat_pro') === fmt);
    if (mod) list = list.filter(c => (c.modalite || 'en_ligne') === mod);
    if (q) list = list.filter(c =>
      (c.titre + ' ' + (c.sousTitre || '') + ' ' + c.description).toLowerCase().includes(q));
    return U.sendHTML(res, 200, V.catalogue(list, { cat, q, fmt, mod }, user));
  }

  m = path.match(/^\/formation\/(crs_[a-z0-9]+)$/i);
  if (m && method === 'GET') {
    const c = db.courses.find(x => x.id === m[1] && (x.statut === 'publiee' ||
      (user && (user.id === x.formateurId || user.role === 'admin'))));
    if (!c) return notFound(res, user);
    const formateur = db.users.find(u => u.id === c.formateurId) || { name: '—' };
    const avisList = db.avis.filter(a => a.courseId === c.id).map(a => Object.assign({}, a, {
      userName: (db.users.find(u => u.id === a.userId) || {}).name || 'Apprenant'
    }));
    const dejaInscrit = user && db.enrollments.some(e => e.userId === user.id && e.courseId === c.id);
    return U.sendHTML(res, 200, V.ficheCours(c, formateur, avisList, dejaInscrit, user,
      U.baseUrl(req) + '/formation/' + c.id));
  }

  if (path === '/tarifs' && method === 'GET') {
    return U.sendHTML(res, 200, V.tarifs(user, user ? user.plan : null));
  }
  if (path === '/choisir-plan' && method === 'POST') {
    if (!user) return U.redirect(res, '/register?role=formateur');
    const { data } = await U.readBody(req);
    if (DB.PLANS.some(p => p.id === data.plan)) {
      user.plan = data.plan;
      audit(user.id, 'plan.change', { plan: data.plan });
      save();
    }
    const dest = user.role === 'entreprise' ? '/entreprise' : '/formateur';
    return U.redirect(res, dest + '?ok=' + encodeURIComponent('Votre plan a été mis à jour : ' + data.plan + '.'));
  }

  if (path === '/pour-les-formateurs' && method === 'GET') return U.sendHTML(res, 200, V.pourFormateurs(user));
  if (path === '/pour-les-entreprises' && method === 'GET') return U.sendHTML(res, 200, V.pourEntreprises(user));
  if (path === '/certifications' && method === 'GET') return U.sendHTML(res, 200, V.certificationsPage(user));
  if (path === '/ressources-numeriques' && method === 'GET') return U.sendHTML(res, 200, V.ressourcesNumeriques(user));
  if (path === '/apprentissage-professionnel' && method === 'GET') return U.sendHTML(res, 200, V.conceptPage(user, 'apprentissageProfessionnel'));
  if (path === '/developpement-professionnel' && method === 'GET') return U.sendHTML(res, 200, V.conceptPage(user, 'developpementProfessionnel'));
  if (path === '/apprendre-partout' && method === 'GET') return U.sendHTML(res, 200, V.conceptPage(user, 'apprendrePartout'));
  if (path === '/evoluer-durablement' && method === 'GET') return U.sendHTML(res, 200, V.conceptPage(user, 'evoluerDurablement'));
  if (path === '/construire-parcours' && method === 'GET') return U.sendHTML(res, 200, V.conceptPage(user, 'construireParcours'));
  if (path === '/faq' && method === 'GET') return U.sendHTML(res, 200, V.faqPage(user));
  if (path === '/a-propos' && method === 'GET') return U.sendHTML(res, 200, V.aPropos(user, statsPubliques(db)));

  if (path === '/contact') {
    if (method === 'POST') {
      const { data } = await U.readBody(req);
      if (data.nom && data.email && data.message) {
        db.messagesContact.push({ id: U.rid('msg', 5), nom: String(data.nom).slice(0, 100),
          email: String(data.email).slice(0, 100), sujet: String(data.sujet || '').slice(0, 100),
          message: String(data.message).slice(0, 1000), createdAt: new Date().toISOString() });
        save();
      }
      return U.redirect(res, '/contact?ok=1');
    }
    return U.sendHTML(res, 200, V.contactPage(user, req.query.get('ok')));
  }

  /* ================= AUTH ================= */
  if (path === '/register') {
    if (method === 'GET') return U.sendHTML(res, 200,
      V.authForm('register', { role: req.query.get('role'), suite: req.query.get('suite') }));
    const { data } = await U.readBody(req);
    const email = String(data.email || '').trim().toLowerCase();
    if (data.role === 'formateur') return U.redirect(res, '/devenir-formateur');
    const role = ['apprenant', 'entreprise'].includes(data.role) ? data.role : 'apprenant';
    if (!data.name || !email || !data.password || data.password.length < 8) {
      return U.sendHTML(res, 422, V.authForm('register', { error: 'Champs invalides (mot de passe : 8 caractères minimum).', role }));
    }
    if (db.users.some(u => u.email === email)) {
      return U.sendHTML(res, 409, V.authForm('register', { error: 'Un compte existe déjà avec cet email.', role }));
    }
    const u = { id: U.rid('usr', 6), role, name: String(data.name).trim().slice(0, 100), email,
      pass: U.hashPassword(data.password),
      infos: {
        telephone: String(data.telephone || '').replace(/[\s+-]/g, '').slice(0, 15),
        departement: String(data.departement || '').slice(0, 30),
        profil: String(data.profil || '').slice(0, 40),
        niveauEtudes: String(data.niveauEtudes || '').slice(0, 40),
        source: String(data.source || '').slice(0, 60),
        secteur: String(data.secteur || '').slice(0, 60),
        taille: String(data.taille || '').slice(0, 20)
      },
      createdAt: new Date().toISOString() };
    if (role === 'entreprise') { u.companyName = u.name; u.plan = 'entreprise'; }
    db.users.push(u);
    audit(u.id, 'user.registered', { role });
    save();
    const dest = req.query.get('suite') ||
      (role === 'formateur' ? '/formateur' : role === 'entreprise' ? '/entreprise' : '/formations');
    return openSession(res, u.id, dest);
  }

  if (path === '/login') {
    if (method === 'GET') return U.sendHTML(res, 200, V.authForm('login', { suite: req.query.get('suite') }));
    const { data } = await U.readBody(req);
    const u = db.users.find(x => x.email === String(data.email || '').trim().toLowerCase());
    if (!u || !U.verifyPassword(data.password || '', u.pass)) {
      return U.sendHTML(res, 401, V.authForm('login', { error: 'Email ou mot de passe incorrect.' }));
    }
    let dest = req.query.get('suite') ||
      ({ formateur: '/formateur', entreprise: '/entreprise', admin: '/admin/candidatures' }[u.role] || '/apprenant');
    // Formateur dont la candidature n'est pas encore validée → page d'attente
    if (u.role === 'formateur' && u.candidature && u.candidature.statut !== 'approuvee') {
      dest = '/candidature/statut';
    }
    // Professionnel d'entreprise → directement sur sa formation assignée en cours
    if (u.role === 'apprenant' && u.entrepriseId && !req.query.get('suite')) {
      const assignes = db.enrollments
        .filter(e => e.userId === u.id && e.source === 'entreprise' && !e.completedAt)
        .sort((a, b) => (a.type === 'obligatoire' ? 0 : 1) - (b.type === 'obligatoire' ? 0 : 1));
      if (assignes.length) dest = '/apprenant/cours/' + assignes[0].courseId;
    }
    return openSession(res, u.id, dest);
  }

  if (path === '/logout') {
    const tok = U.parseCookies(req).eps;
    db.sessions = db.sessions.filter(s => s.token !== tok);
    save();
    return U.redirect(res, '/', U.clearSessionCookie);
  }

  /* ================= ACHAT — via la passerelle PLOP PLOP ================= */

  /* Finalisation idempotente d'une commande payée :
     inscription de l'apprenant + crédit du formateur (85 %), une seule fois. */
  function finaliserCommande(order, methode, infos) {
    if (!order || order.status === 'payee') return order;
    order.status = 'payee';
    order.method = methode || order.method || null;
    if (infos) {
      order.transactionId = infos.transactionId || order.transactionId || null;
      order.dateTransaction = infos.dateTransaction || null;
    }
    order.paidAt = new Date().toISOString();
    const c = db.courses.find(x => x.id === order.courseId);
    if (c && !db.enrollments.some(e => e.userId === order.userId && e.courseId === c.id)) {
      db.enrollments.push({ id: U.rid('enr', 6), userId: order.userId, courseId: c.id,
        source: 'achat', progress: [], completedAt: null, createdAt: new Date().toISOString() });
    }
    const formateur = c && db.users.find(u2 => u2.id === c.formateurId);
    if (formateur) formateur.balance = (formateur.balance || 0) + order.net;
    audit(order.userId, 'order.paid', { orderId: order.id, courseId: order.courseId, via: 'plopplop' });
    save();
    return order;
  }

  /* Étape 1 — ouvrir la transaction PLOP PLOP et envoyer l'apprenant payer */
  m = path.match(/^\/acheter\/(crs_[a-z0-9]+)$/i);
  if (m) {
    if (!user) return U.redirect(res, '/login?suite=' + encodeURIComponent(path));
    const c = db.courses.find(x => x.id === m[1] && x.statut === 'publiee');
    if (!c) return notFound(res, user);
    if (db.enrollments.some(e => e.userId === user.id && e.courseId === c.id)) {
      return U.redirect(res, '/apprenant/cours/' + c.id);
    }
    // Formation gratuite (grand public) : inscription immédiate, sans passer par la passerelle
    if (c.prix === 0) {
      db.enrollments.push({ id: U.rid('enr', 6), userId: user.id, courseId: c.id,
        source: 'gratuit', progress: [], completedAt: null, createdAt: new Date().toISOString() });
      audit(user.id, 'enrollment.gratuit', { courseId: c.id });
      save();
      return U.redirect(res, '/apprenant/cours/' + c.id + '?ok=' +
        encodeURIComponent('Inscription gratuite confirmée — bonne formation !'));
    }
    if (method === 'GET') return U.sendHTML(res, 200, V.checkoutCours(c, user));

    const { data } = await U.readBody(req).catch(() => ({ data: {} }));

    // Réutiliser une commande en attente existante (rejouable sans doublon)
    let order = db.orders.find(o => o.userId === user.id && o.courseId === c.id && o.status === 'en_attente');
    if (!order) {
      const commission = Math.round(c.prix * COMMISSION);
      order = { id: U.rid('ord', 6), userId: user.id, courseId: c.id, amount: c.prix,
        commission, net: c.prix - commission, method: null,
        status: 'en_attente', transactionId: null, createdAt: new Date().toISOString() };
      db.orders.push(order);
      save();
    }

    const out = await PP.initierPaiement({
      reference: order.id,
      montant: c.prix,
      methode: data.methode
    });
    if (!out.ok) {
      return U.sendHTML(res, 502, V.checkoutCours(c, user, out.error));
    }
    order.method = out.methode;
    order.transactionId = out.transactionId;
    audit(user.id, 'order.initiee', { orderId: order.id, transactionId: order.transactionId });
    save();
    // La passerelle ne redirige pas vers le marchand : on ouvre sa page et on
    // interroge api/paiement-verify jusqu'à confirmation côté serveur.
    return U.sendHTML(res, 200, V.paiementAttente(c, order, out.urlPaiement, user));
  }

  /* Étape 2 — vérification auprès de la passerelle (sondage de la page d'attente) */
  if (path === '/paiement/verifier' && method === 'GET') {
    if (!user) return U.sendJSON(res, 401, { paye: false, erreur: 'Session expirée.' });
    const ref = String(req.query.get('ref') || '').trim();
    const order = db.orders.find(o => o.id === ref && o.userId === user.id);
    if (!order) return U.sendJSON(res, 404, { paye: false, erreur: 'Commande introuvable.' });
    if (order.status === 'payee') {
      return U.sendJSON(res, 200, { paye: true, suite: '/apprenant/cours/' + order.courseId });
    }
    const out = await PP.verifierPaiement(order.id);
    if (out.paye) {
      finaliserCommande(order, (out.infos && out.infos.methode) || order.method, out.infos);
      return U.sendJSON(res, 200, { paye: true, suite: '/apprenant/cours/' + order.courseId });
    }
    return U.sendJSON(res, 200, { paye: false,
      message: out.error || out.message || 'Paiement non encore confirmé.' });
  }

  /* Étape 2 bis — retour éventuel depuis la passerelle (vérification côté serveur) */
  if (path === '/paiement/retour' && method === 'GET') {
    const ref = String(req.query.get('ref') || req.query.get('refference_id') || '').trim();
    const order = ref && db.orders.find(o => o.id === ref);
    if (!order) return U.redirect(res, '/formations');
    if (order.status !== 'payee') {
      const out = await PP.verifierPaiement(order.id);
      if (out.paye) finaliserCommande(order, (out.infos && out.infos.methode) || order.method, out.infos);
    }
    if (order.status === 'payee') {
      return U.redirect(res, '/apprenant/cours/' + order.courseId + '?ok=' +
        encodeURIComponent('Paiement confirmé ✓ Bienvenue dans la formation !'));
    }
    const c = db.courses.find(x => x.id === order.courseId);
    return U.sendHTML(res, 402, V.checkoutCours(c, user,
      'Le paiement n\u2019est pas encore confirmé par la passerelle. Réessayez dans un instant — aucun montant n\u2019a été débité deux fois.'));
  }


  /* ---- Assets de marque (sceau, signature par défaut) ---- */
  m = path.match(/^\/assets\/([a-z0-9-]+\.(?:png|jpg|webp))$/i);
  if (m && method === 'GET') {
    const fs = require('fs'), p = require('path');
    const fp = p.join(__dirname, '..', 'assets', m[1]);
    if (!fs.existsSync(fp)) return notFound(res, user);
    const buf = fs.readFileSync(fp);
    res.writeHead(200, { 'Content-Type': m[1].endsWith('.png') ? 'image/png' :
      m[1].endsWith('.webp') ? 'image/webp' : 'image/jpeg',
      'Content-Length': buf.length, 'Cache-Control': 'public, max-age=86400' });
    return res.end(buf);
  }

  /* ================= CANDIDATURE FORMATEUR ================= */
  if (path === '/devenir-formateur') {
    if (method === 'GET') return U.sendHTML(res, 200, V.candidatureForm(user));
    const { data } = await U.readBody(req);
    const email = String(data.email || '').trim().toLowerCase();
    if (!data.name || !email || !data.password || data.password.length < 8 ||
        !data.titrePro || !data.experience || !data.motivation) {
      return U.sendHTML(res, 422, V.candidatureForm(user,
        'Tous les champs marqués * sont requis (mot de passe : 8 caractères minimum).'));
    }
    if (db.users.some(u => u.email === email)) {
      return U.sendHTML(res, 409, V.candidatureForm(user, 'Un compte existe déjà avec cet email.'));
    }
    const u = { id: U.rid('usr', 6), role: 'formateur', name: String(data.name).trim().slice(0, 100),
      email, pass: U.hashPassword(data.password), plan: 'gratuit', balance: 0, verified: false,
      titrePro: String(data.titrePro).slice(0, 100),
      expertises: String(data.expertises || '').split(',').map(x => x.trim()).filter(Boolean).slice(0, 12),
      candidature: {
        statut: 'en_attente', soumiseLe: new Date().toISOString(),
        titrePro: String(data.titrePro).slice(0, 100),
        expertises: String(data.expertises || '').split(',').map(x => x.trim()).filter(Boolean).slice(0, 12),
        experience: String(data.experience).slice(0, 1500),
        motivation: String(data.motivation).slice(0, 1500),
        portfolio: String(data.portfolio || '').slice(0, 200)
      },
      createdAt: new Date().toISOString() };
    db.users.push(u);
    audit(u.id, 'candidature.soumise', null);
    save();
    return openSession(res, u.id, '/candidature/statut');
  }

  if (path === '/candidature/statut' && method === 'GET') {
    const u = currentUser(req);
    if (!u || u.role !== 'formateur' || !u.candidature) return U.redirect(res, '/');
    return U.sendHTML(res, 200, V.candidatureStatut(u));
  }

  /* ---- Gestion institutionnelle : scolarité, personnel, comptabilité ----
     Inclut les pages publiques de recrutement (/recrutement).            */
  if (path.startsWith('/gestion') || path.startsWith('/recrutement')) {
    const traite = await GEST.handle(req, res,
      { need, notFound, flash, user, parametresCertificat });
    if (traite) return;
  }

  /* ---- Administration : paramètres du certificat (sceau, signature) ---- */
  if (path === '/admin/parametres') {
    const a = need(req, res, ['admin']); if (!a) return;
    db.parametres = db.parametres || {};
    if (method === 'POST') {
      let data;
      if ((req.headers['content-type'] || '').startsWith('multipart/')) {
        const mp = await U.parseMultipart(req).catch(() => null);
        if (!mp) return U.redirect(res, '/admin/parametres?ok=' + encodeURIComponent('Envoi invalide.'));
        data = mp.fields;
        for (const champ of ['sceau', 'signature']) {
          const img = mp.files.find(f => f.field === champ && f.filename);
          if (img) {
            const r = F.saveUpload(img, ['image']);
            if (!r.ok) return U.redirect(res, '/admin/parametres?ok=' + encodeURIComponent(r.error));
            db.parametres[champ + 'Url'] = r.fichier.url;
          }
        }
      } else data = (await U.readBody(req)).data;
      db.parametres.signataireNom = String(data.signataireNom || '').slice(0, 100);
      db.parametres.signataireTitre = String(data.signataireTitre || '').slice(0, 120);
      db.parametres.villeCertificat = String(data.villeCertificat || '').slice(0, 60);
      audit(a.id, 'parametres.certificat', null);
      save();
      return U.redirect(res, '/admin/parametres?ok=' + encodeURIComponent('Paramètres du certificat enregistrés.'));
    }
    return U.sendHTML(res, 200, E.adminParametres(a, parametresCertificat(db), flash));
  }

  /* ---- Administration : modération des formations avant publication ---- */
  if (path === '/admin/moderation') {
    const a = need(req, res, ['admin']); if (!a) return;
    if (method === 'POST') {
      const { data } = await U.readBody(req);
      const c = db.courses.find(x => x.id === data.id && x.statut === 'en_verification');
      if (c && ['publiee', 'brouillon'].includes(data.decision)) {
        c.statut = data.decision;
        c.moderation = Object.assign({}, c.moderation, {
          decideeLe: new Date().toISOString(),
          decision: data.decision === 'publiee' ? 'approuvee' : 'renvoyee',
          commentaire: String(data.commentaire || '').slice(0, 800)
        });
        audit(a.id, 'moderation.' + c.moderation.decision, { courseId: c.id });
        save();
      }
      return U.redirect(res, '/admin/moderation?ok=' + encodeURIComponent('Décision enregistrée.'));
    }
    const enAttente = db.courses.filter(c => c.statut === 'en_verification').map(c => ({ ...c,
      formateurNom: (db.users.find(x => x.id === c.formateurId) || {}).name || '—' }));
    return U.sendHTML(res, 200, E.adminModeration(a, enAttente, flash));
  }

  /* ---- Administration : validation des candidatures ---- */
  if (path === '/admin/candidatures') {
    const a = need(req, res, ['admin']); if (!a) return;
    if (method === 'POST') {
      const { data } = await U.readBody(req);
      const cand = db.users.find(x => x.id === data.id && x.role === 'formateur' && x.candidature);
      if (cand && ['approuvee', 'rejetee'].includes(data.decision)) {
        cand.candidature.statut = data.decision;
        cand.candidature.decideeLe = new Date().toISOString();
        cand.candidature.commentaire = String(data.commentaire || '').slice(0, 500);
        if (data.decision === 'approuvee') cand.verified = true;
        audit(a.id, 'candidature.' + data.decision, { formateur: cand.id });
        save();
      }
      return U.redirect(res, '/admin/candidatures?ok=' + encodeURIComponent('Décision enregistrée.'));
    }
    const list = db.users.filter(x => x.role === 'formateur' && x.candidature)
      .sort((x, y) => (x.candidature.statut === 'en_attente' ? 0 : 1) - (y.candidature.statut === 'en_attente' ? 0 : 1));
    return U.sendHTML(res, 200, E.adminCandidatures(a, list, flash));
  }

  /* ================= PROFIL FORMATEUR ================= */
  if (path === '/formateur/profil') {
    const u = need(req, res, ['formateur', 'admin']); if (!u) return;
    if (method === 'POST') {
      let data, photoMeta = null;
      if ((req.headers['content-type'] || '').startsWith('multipart/')) {
        const mp = await U.parseMultipart(req).catch(() => null);
        if (!mp) return U.redirect(res, '/formateur/profil?ok=' + encodeURIComponent('Envoi invalide.'));
        data = mp.fields;
        const img = mp.files.find(f => f.field === 'photo' && f.filename);
        if (img) {
          const r = F.saveUpload(img, ['image']);
          if (!r.ok) return U.redirect(res, '/formateur/profil?ok=' + encodeURIComponent(r.error));
          if (u.photo) F.deleteUpload(u.photo);
          photoMeta = r.fichier;
        }
      } else data = (await U.readBody(req)).data;
      u.titrePro = String(data.titrePro || '').slice(0, 100);
      u.bio = String(data.bio || '').slice(0, 1000);
      u.expertises = String(data.expertises || '').split(',').map(x => x.trim()).filter(Boolean).slice(0, 12);
      u.siteWeb = String(data.siteWeb || '').slice(0, 200);
      u.whatsapp = String(data.whatsapp || '').replace(/[\s+-]/g, '').slice(0, 15);
      if (photoMeta) u.photo = photoMeta.url;
      audit(u.id, 'profil.maj', null);
      save();
      return U.redirect(res, '/formateur/profil?ok=' + encodeURIComponent('Profil enregistré. ') +
        '&voir=1');
    }
    return U.sendHTML(res, 200, E.profilFormateurEdit(u, flash));
  }

  m = path.match(/^\/formateurs\/(usr_[a-z0-9]+)$/i);
  if (m && method === 'GET') {
    const f = db.users.find(x => x.id === m[1] && (x.role === 'formateur' || x.role === 'admin'));
    if (!f) return notFound(res, user);
    const cours = db.courses.filter(c => c.formateurId === f.id && c.statut === 'publiee');
    const ids = new Set(db.courses.filter(c => c.formateurId === f.id).map(c => c.id));
    const avisF = db.avis.filter(a => ids.has(a.courseId));
    const stats = {
      nbCours: cours.length,
      nbEtudiants: new Set(db.enrollments.filter(e => ids.has(e.courseId)).map(e => e.userId)).size,
      note: avisF.length ? (avisF.reduce((s, a) => s + a.note, 0) / avisF.length).toFixed(1) : null,
      nbAvis: avisF.length
    };
    const derniersAvis = avisF.slice(-4).reverse().map(a => ({ ...a,
      userName: (db.users.find(x => x.id === a.userId) || {}).name || 'Apprenant',
      coursTitre: (db.courses.find(c => c.id === a.courseId) || {}).titre || '' }));
    return U.sendHTML(res, 200, V.profilFormateurPublic(f, cours, stats, derniersAvis, user));
  }

  /* ================= BILAN APPRENANT (compétences + notes) ================= */
  m = path.match(/^\/apprenant\/cours\/(crs_[a-z0-9]+)\/bilan$/i);
  if (m && method === 'GET') {
    const u = need(req, res); if (!u) return;
    const c = db.courses.find(x => x.id === m[1]);
    const enr = c && db.enrollments.find(e => e.userId === u.id && e.courseId === c.id);
    if (!c || !enr) return U.redirect(res, '/apprenant');
    return U.sendHTML(res, 200, E.pageBilan(u, c, enr,
      bilanCompetences(enr, c), bilanNotes(enr, c), pctEnrollment(enr, c)));
  }

  /* ================= FORUM DE DISCUSSION ================= */
  m = path.match(/^\/cours\/(crs_[a-z0-9]+)\/forum(?:\/(suj_[a-z0-9]+))?$/i);
  if (m) {
    const u = need(req, res); if (!u) return;
    const c = db.courses.find(x => x.id === m[1]);
    if (!c || !accesCours(db, u, c)) return U.redirect(res, c ? '/formation/' + c.id : '/formations');

    if (!m[2]) { // liste des sujets / création
      if (method === 'POST') {
        const { data } = await U.readBody(req);
        if (data.titre && data.contenu) {
          const suj = { id: U.rid('suj', 5), courseId: c.id, userId: u.id,
            titre: String(data.titre).slice(0, 150), createdAt: new Date().toISOString() };
          db.sujetsForum.push(suj);
          db.messagesForum.push({ id: U.rid('mfr', 5), sujetId: suj.id, userId: u.id,
            contenu: String(data.contenu).slice(0, 3000), createdAt: suj.createdAt });
          audit(u.id, 'forum.sujet', { courseId: c.id, sujet: suj.id });
          save();
          return U.redirect(res, `/cours/${c.id}/forum/${suj.id}`);
        }
        return U.redirect(res, `/cours/${c.id}/forum`);
      }
      const sujets = db.sujetsForum.filter(s => s.courseId === c.id).map(s => {
        const msgs = db.messagesForum.filter(mm => mm.sujetId === s.id);
        return { ...s,
          auteur: (db.users.find(x => x.id === s.userId) || {}).name || 'Apprenant',
          nbMessages: msgs.length,
          dernierAt: msgs.length ? msgs[msgs.length - 1].createdAt : s.createdAt };
      }).sort((a, b) => b.dernierAt.localeCompare(a.dernierAt));
      return U.sendHTML(res, 200, E.pageForum(u, c, sujets, flash));
    }

    // fil d'un sujet
    const suj = db.sujetsForum.find(s => s.id === m[2] && s.courseId === c.id);
    if (!suj) return U.redirect(res, `/cours/${c.id}/forum`);
    if (method === 'POST') {
      const { data } = await U.readBody(req);
      if (data.contenu) {
        db.messagesForum.push({ id: U.rid('mfr', 5), sujetId: suj.id, userId: u.id,
          contenu: String(data.contenu).slice(0, 3000), createdAt: new Date().toISOString() });
        save();
      }
      return U.redirect(res, `/cours/${c.id}/forum/${suj.id}`);
    }
    const messages = db.messagesForum.filter(mm => mm.sujetId === suj.id).map(mm => {
      const aut = db.users.find(x => x.id === mm.userId) || {};
      return { ...mm, auteur: aut.name || 'Apprenant',
        estFormateur: aut.id === c.formateurId, photo: aut.photo || null };
    });
    return U.sendHTML(res, 200, E.pageSujet(u, c, suj, messages));
  }

  /* ================= ANNONCES (formateur → apprenants) ================= */
  m = path.match(/^\/formateur\/formation\/(crs_[a-z0-9]+)\/annonce(?:\/(ann_[a-z0-9]+)\/supprimer)?$/i);
  if (m && method === 'POST') {
    const u = need(req, res, ['formateur', 'admin']); if (!u) return;
    const c = db.courses.find(x => x.id === m[1] && (x.formateurId === u.id || u.role === 'admin'));
    if (!c) return notFound(res, u);
    if (m[2]) {
      db.annonces = db.annonces.filter(a => a.id !== m[2]);
      save();
      return U.redirect(res, `/formateur/formation/${c.id}?ok=` + encodeURIComponent('Annonce supprimée.'));
    }
    const { data } = await U.readBody(req);
    if (data.titre && data.contenu) {
      db.annonces.push({ id: U.rid('ann', 5), courseId: c.id, formateurId: u.id,
        titre: String(data.titre).slice(0, 120), contenu: String(data.contenu).slice(0, 1500),
        createdAt: new Date().toISOString() });
      audit(u.id, 'annonce.publiee', { courseId: c.id });
      save();
    }
    return U.redirect(res, `/formateur/formation/${c.id}?ok=` +
      encodeURIComponent('Annonce publiée — visible par tous les apprenants inscrits.'));
  }

  /* ================= ÉPREUVES DE L'ÉVALUATION FINALE (formateur) ================= */
  m = path.match(/^\/formateur\/formation\/(crs_[a-z0-9]+)\/epreuve(?:\/(ep_[a-z0-9]+))?(\/.*)?$/i);
  if (m && method === 'POST') {
    const u = need(req, res, ['formateur', 'admin']); if (!u) return;
    const c = db.courses.find(x => x.id === m[1] && (x.formateurId === u.id || u.role === 'admin'));
    if (!c) return notFound(res, u);
    c.examenFinal = { epreuves: DB.epreuvesDe(c) }; // normalisation rétro-compatible
    const eps = c.examenFinal.epreuves;
    const retour = `/formateur/formation/${c.id}`;

    if (!m[2]) { // création d'une épreuve
      const { data } = await U.readBody(req);
      if (!DB.TYPES_EPREUVES[data.type] || !data.titre) {
        return U.redirect(res, retour + '?ok=' + encodeURIComponent('Type ou titre d\u2019épreuve invalide.'));
      }
      const ep = { id: U.rid('ep', 4), type: data.type,
        titre: String(data.titre).slice(0, 120),
        consigne: String(data.consigne || '').slice(0, 2000),
        poids: Math.min(100, Math.max(1, Math.round(Number(data.poids) || 20))) };
      if (data.type === 'qcm') ep.questions = [];
      if (data.type === 'trous') {
        ep.texte = String(data.texte || '').slice(0, 3000);
        if (!/\{\{[^}]+\}\}/.test(ep.texte)) {
          return U.redirect(res, retour + '?ok=' + encodeURIComponent(
            'Texte à trous : entourez chaque mot attendu de doubles accolades, ex. {{RECHERCHEX}}.'));
        }
      }
      eps.push(ep);
      audit(u.id, 'epreuve.creee', { courseId: c.id, type: ep.type });
      save();
      return U.redirect(res, retour + '?ok=' + encodeURIComponent(
        'Épreuve « ' + ep.titre + ' » ajoutée (' + DB.TYPES_EPREUVES[ep.type].label + ', poids ' + ep.poids + ').'));
    }

    const ep = eps.find(e => e.id === m[2]);
    if (!ep) return notFound(res, u);
    const sub = m[3] || '';
    if (sub === '/supprimer') {
      c.examenFinal.epreuves = eps.filter(e => e.id !== ep.id);
      save();
      return U.redirect(res, retour + '?ok=' + encodeURIComponent('Épreuve supprimée.'));
    }
    if (sub === '/question' && ep.type === 'qcm') {
      const { data } = await U.readBody(req);
      const q = lireQuestion(data);
      if (!q) return U.redirect(res, retour + '?ok=' + encodeURIComponent('Question invalide.'));
      ep.questions = ep.questions || [];
      ep.questions.push(q);
      save();
      return U.redirect(res, retour + '?ok=' + encodeURIComponent('Question ajoutée à « ' + ep.titre + ' ».'));
    }
    let mq = sub.match(/^\/question\/(qst_[a-f0-9]+)\/supprimer$/i);
    if (mq && ep.type === 'qcm') {
      ep.questions = (ep.questions || []).filter(q => q.id !== mq[1]);
      save();
      return U.redirect(res, retour + '?ok=' + encodeURIComponent('Question supprimée.'));
    }
    return notFound(res, u);
  }

  /* ---- Corrections des épreuves manuelles (formateur) ---- */
  m = path.match(/^\/formateur\/formation\/(crs_[a-z0-9]+)\/corrections$/i);
  if (m && method === 'GET') {
    const u = need(req, res, ['formateur', 'admin']); if (!u) return;
    const c = db.courses.find(x => x.id === m[1] && (x.formateurId === u.id || u.role === 'admin'));
    if (!c) return notFound(res, u);
    const eps = DB.epreuvesDe(c);
    const lignes = [];
    for (const e of db.enrollments.filter(e => e.courseId === c.id)) {
      const app = db.users.find(x => x.id === e.userId) || {};
      for (const ep of eps) {
        const sm = (e.soumissions || {})[ep.id];
        if (sm && !DB.TYPES_EPREUVES[ep.type].auto) {
          lignes.push({ enr: e, apprenant: app.name || 'Apprenant', ep, sm });
        }
      }
    }
    lignes.sort((a, b) => (a.sm.note === null ? 0 : 1) - (b.sm.note === null ? 0 : 1));
    return U.sendHTML(res, 200, E.pageCorrections(u, c, lignes, flash));
  }

  m = path.match(/^\/formateur\/formation\/(crs_[a-z0-9]+)\/corriger$/i);
  if (m && method === 'POST') {
    const u = need(req, res, ['formateur', 'admin']); if (!u) return;
    const c = db.courses.find(x => x.id === m[1] && (x.formateurId === u.id || u.role === 'admin'));
    if (!c) return notFound(res, u);
    const { data } = await U.readBody(req);
    const enr = db.enrollments.find(e => e.id === data.enrId && e.courseId === c.id);
    const sm = enr && (enr.soumissions || {})[data.epId];
    const note = Math.min(100, Math.max(0, Math.round(Number(data.note))));
    if (!sm || !Number.isFinite(note)) {
      return U.redirect(res, `/formateur/formation/${c.id}/corrections?ok=` +
        encodeURIComponent('Correction invalide.'));
    }
    sm.note = note;
    sm.feedback = String(data.feedback || '').slice(0, 1000);
    sm.corrigeLe = new Date().toISOString();
    majCompletion(enr, c);
    audit(u.id, 'epreuve.corrigee', { enr: enr.id, epreuve: data.epId, note });
    save();
    return U.redirect(res, `/formateur/formation/${c.id}/corrections?ok=` +
      encodeURIComponent('Note enregistrée : ' + note + '/100.'));
  }

  /* ================= ÉVALUATION FINALE (apprenant) ================= */
  m = path.match(/^\/apprenant\/cours\/(crs_[a-z0-9]+)\/examen$/i);
  if (m && method === 'GET') {
    const u = need(req, res); if (!u) return;
    const c = db.courses.find(x => x.id === m[1]);
    const enr = c && db.enrollments.find(e => e.userId === u.id && e.courseId === c.id);
    if (!c || !enr) return U.redirect(res, '/apprenant');
    return U.sendHTML(res, 200, E.pageExamen(u, c, enr, bilanNotes(enr, c), flash));
  }

  m = path.match(/^\/apprenant\/cours\/(crs_[a-z0-9]+)\/epreuve\/(ep_[a-z0-9]+)$/i);
  if (m) {
    const u = need(req, res); if (!u) return;
    const c = db.courses.find(x => x.id === m[1]);
    const enr = c && db.enrollments.find(e => e.userId === u.id && e.courseId === c.id);
    if (!c || !enr) return U.redirect(res, '/apprenant');
    const ep = DB.epreuvesDe(c).find(e => e.id === m[2]);
    if (!ep) return U.redirect(res, `/apprenant/cours/${c.id}/examen`);
    enr.soumissions = enr.soumissions || {};
    const cfgEval = configEvaluation(c);

    if (method === 'GET') {
      return U.sendHTML(res, 200, E.pageEpreuve(u, c, ep, enr.soumissions[ep.id] || null, null, cfgEval.melanger));
    }

    // Soumission
    let resultat = null;
    if (ep.type === 'qcm') {
      const { data } = await U.readBody(req);
      const r = corrigerQuiz({ questions: ep.questions || [] }, data);
      const prec = enr.soumissions[ep.id];
      if (!prec || r.pct >= (prec.note || 0)) {
        enr.soumissions[ep.id] = { type: 'qcm', note: r.pct,
          detail: r.score + '/' + r.total, at: new Date().toISOString() };
      }
      resultat = { auto: true, pct: r.pct, detail: r.score + '/' + r.total };
    } else if (ep.type === 'trous') {
      const { data } = await U.readBody(req);
      const r = corrigerTrous(ep, data);
      const prec = enr.soumissions[ep.id];
      if (!prec || r.pct >= (prec.note || 0)) {
        enr.soumissions[ep.id] = { type: 'trous', note: r.pct,
          detail: r.score + '/' + r.total, at: new Date().toISOString() };
      }
      resultat = { auto: true, pct: r.pct, detail: r.score + '/' + r.total, reponses: r.reponses };
    } else {
      // Épreuve à correction manuelle : texte + fichier facultatif
      let data, fichierMeta = null;
      if ((req.headers['content-type'] || '').startsWith('multipart/')) {
        const mp = await U.parseMultipart(req).catch(() => null);
        if (!mp) return U.redirect(res, `/apprenant/cours/${c.id}/epreuve/${ep.id}`);
        data = mp.fields;
        const fic = mp.files.find(f => f.field === 'fichier' && f.filename);
        if (fic) {
          const r = F.saveUpload(fic, ['image', 'pdf', 'video', 'audio', 'document']);
          if (!r.ok) return U.sendHTML(res, 422, E.pageEpreuve(u, c, ep, enr.soumissions[ep.id] || null,
            { erreur: r.error }, cfgEval.melanger));
          fichierMeta = r.fichier;
        }
      } else data = (await U.readBody(req)).data;
      if (!String(data.contenu || '').trim() && !fichierMeta) {
        return U.sendHTML(res, 422, E.pageEpreuve(u, c, ep, enr.soumissions[ep.id] || null,
          { erreur: 'Rédigez votre réponse ou joignez un fichier.' }, cfgEval.melanger));
      }
      enr.soumissions[ep.id] = { type: ep.type,
        contenu: String(data.contenu || '').slice(0, 8000),
        fichier: fichierMeta || (enr.soumissions[ep.id] || {}).fichier || null,
        note: null, feedback: null, at: new Date().toISOString() };
      resultat = { auto: false };
    }
    majCompletion(enr, c);
    audit(u.id, 'epreuve.soumise', { courseId: c.id, epreuve: ep.id, type: ep.type });
    save();
    return U.sendHTML(res, 200, E.pageEpreuve(u, c, ep, enr.soumissions[ep.id], resultat, cfgEval.melanger));
  }

  /* ================= COMPÉTENCES & PARAMÈTRES D'ÉVALUATION ================= */
  m = path.match(/^\/formateur\/formation\/(crs_[a-z0-9]+)\/module\/(mod_[a-z0-9]+)\/competences$/i);
  if (m && method === 'POST') {
    const u = need(req, res, ['formateur', 'admin']); if (!u) return;
    const c = db.courses.find(x => x.id === m[1] && (x.formateurId === u.id || u.role === 'admin'));
    const mod = c && c.modules.find(x => x.id === m[2]);
    if (!c || !mod) return notFound(res, u);
    const { data } = await U.readBody(req);
    mod.competences = String(data.competences || '').split(',')
      .map(x => x.trim()).filter(Boolean).slice(0, 10).map(x => x.slice(0, 100));
    save();
    return U.redirect(res, `/formateur/formation/${c.id}?ok=` +
      encodeURIComponent(`Compétences du module enregistrées (${mod.competences.length}).`));
  }

  m = path.match(/^\/formateur\/formation\/(crs_[a-z0-9]+)\/evaluation$/i);
  if (m && method === 'POST') {
    const u = need(req, res, ['formateur', 'admin']); if (!u) return;
    const c = db.courses.find(x => x.id === m[1] && (x.formateurId === u.id || u.role === 'admin'));
    if (!c) return notFound(res, u);
    const { data } = await U.readBody(req);
    const pq = Math.min(100, Math.max(0, Math.round(Number(data.poidsQuiz) || 40)));
    c.evaluation = {
      poidsQuiz: pq,
      poidsExamen: 100 - pq,
      seuil: Math.min(100, Math.max(10, Math.round(Number(data.seuil) || 60))),
      melanger: data.melanger === 'on'
    };
    save();
    return U.redirect(res, `/formateur/formation/${c.id}?ok=` +
      encodeURIComponent(`Barème enregistré : quiz ${pq} % + examen ${100 - pq} %, seuil ${c.evaluation.seuil} %.`));
  }

  /* ================= CARNET DE NOTES (formateur) ================= */
  m = path.match(/^\/formateur\/formation\/(crs_[a-z0-9]+)\/notes$/i);
  if (m && method === 'GET') {
    const u = need(req, res, ['formateur', 'admin']); if (!u) return;
    const c = db.courses.find(x => x.id === m[1] && (x.formateurId === u.id || u.role === 'admin'));
    if (!c) return notFound(res, u);
    const lignes = db.enrollments.filter(e => e.courseId === c.id).map(e => {
      const app = db.users.find(x => x.id === e.userId) || {};
      return { nom: app.name || 'Apprenant', enr: e,
        pct: pctEnrollment(e, c), bilan: bilanNotes(e, c) };
    });
    return U.sendHTML(res, 200, E.pageNotesFormateur(u, c, lignes, bilanNotes({ evaluations: {} }, c).cfg));
  }

  /* ================= ESPACE APPRENANT ================= */
  if (path === '/apprenant' && method === 'GET') {
    const u = need(req, res, ['apprenant', 'formateur', 'entreprise', 'admin']); if (!u) return;
    const list = db.enrollments.filter(e => e.userId === u.id).map(e => {
      const cours = db.courses.find(c => c.id === e.courseId);
      return cours ? { ...e, cours, pct: pctEnrollment(e, cours) } : null;
    }).filter(Boolean);
    return U.sendHTML(res, 200, E.dashApprenant(u, list, flash));
  }

  m = path.match(/^\/apprenant\/cours\/(crs_[a-z0-9]+)$/i);
  if (m && method === 'GET') {
    const u = need(req, res); if (!u) return;
    const c = db.courses.find(x => x.id === m[1]);
    const enr = c && db.enrollments.find(e => e.userId === u.id && e.courseId === c.id);
    if (!c || !enr) return U.redirect(res, c ? '/formation/' + c.id : '/formations');
    let leconActive = null;
    const lid = req.query.get('lecon');
    if (lid) c.modules.forEach((mo, mi) => mo.lecons.forEach(l => {
      if (l.id === lid) leconActive = { m: mo, mi, l };
    }));
    const annonces = db.annonces.filter(a => a.courseId === c.id).slice(-3).reverse();
    return U.sendHTML(res, 200, E.lecteurCours(u, c, enr, leconActive, annonces, bilanNotes(enr, c)));
  }

  /* --- Passer un quiz (module) ou l'évaluation finale --- */
  m = path.match(/^\/apprenant\/cours\/(crs_[a-z0-9]+)\/quiz\/final$/i);
  if (m) return U.redirect(res, '/apprenant/cours/' + m[1] + '/examen');
  m = path.match(/^\/apprenant\/cours\/(crs_[a-z0-9]+)\/quiz\/(mod_[a-z0-9]+)$/i);
  if (m) {
    const u = need(req, res); if (!u) return;
    const c = db.courses.find(x => x.id === m[1]);
    const enr = c && db.enrollments.find(e => e.userId === u.id && e.courseId === c.id);
    if (!c || !enr) return U.redirect(res, '/apprenant');
    const cible = m[2];
    const quiz = (c.modules.find(x => x.id === cible) || {}).quiz;
    if (!quiz || !quiz.questions || !quiz.questions.length) {
      return U.redirect(res, '/apprenant/cours/' + c.id);
    }
    enr.evaluations = enr.evaluations || {};
    const melanger = configEvaluation(c).melanger;
    if (method === 'GET') {
      return U.sendHTML(res, 200, E.pageQuiz(u, c, cible, quiz, null, enr.evaluations[cible], melanger));
    }
    const { data } = await U.readBody(req);
    const resultat = corrigerQuiz(quiz, data);
    const precedent = enr.evaluations[cible];
    // Le meilleur score est conservé
    if (!precedent || resultat.pct >= precedent.pct) enr.evaluations[cible] = resultat;
    majCompletion(enr, c); // la note globale dépend de toutes les évaluations
    audit(u.id, 'quiz.soumis', { courseId: c.id, cible, score: resultat.score, total: resultat.total });
    save();
    return U.sendHTML(res, 200, E.pageQuiz(u, c, cible, quiz, resultat, enr.evaluations[cible], melanger,
      bilanNotes(enr, c)));
  }

  m = path.match(/^\/apprenant\/cours\/(crs_[a-z0-9]+)\/terminer$/i);
  if (m && method === 'POST') {
    const u = need(req, res); if (!u) return;
    const c = db.courses.find(x => x.id === m[1]);
    const enr = c && db.enrollments.find(e => e.userId === u.id && e.courseId === c.id);
    if (!c || !enr) return U.redirect(res, '/apprenant');
    const { data } = await U.readBody(req);
    const valid = c.modules.some(mo => mo.lecons.some(l => l.id === data.lecon));
    if (valid && !enr.progress.includes(data.lecon)) enr.progress.push(data.lecon);
    majCompletion(enr, c);
    save();
    return U.redirect(res, '/apprenant/cours/' + c.id);
  }

  if (path === '/apprenant/certificats' && method === 'GET') {
    const u = need(req, res); if (!u) return;
    const list = db.enrollments.filter(e => e.userId === u.id && e.completedAt).map(e => ({
      ...e, cours: db.courses.find(c => c.id === e.courseId) || { titre: '—' }
    }));
    return U.sendHTML(res, 200, E.certificatsA(u, list));
  }

  /* ---- Vérification publique d'un document (cible des QR codes) ---- */
  m = path.match(/^\/(?:v|verifier|verify|verification)\/(enr_[a-z0-9]+)\/?$/i);
  if (!m && path === '/verifier' && req.query.get('ref')) {
    m = [null, req.query.get('ref')];
  }
  if (m && method === 'GET') {
    const ref = String(m[1] || '').trim().toLowerCase();
    const enr = db.enrollments.find(e => e.id.toLowerCase() === ref);
    const cours = enr && db.courses.find(c => c.id === enr.courseId);
    const titulaire = enr && db.users.find(x => x.id === enr.userId);
    if (!enr || !cours || !titulaire) {
      return U.sendHTML(res, 404, V.verification(null));
    }
    const formateur = db.users.find(x => x.id === cours.formateurId) || { name: 'Oasis' };
    const bilan = bilanNotes(enr, cours);
    const rel = releveDeNotes(enr, cours);
    return U.sendHTML(res, 200, V.verification({
      id: enr.id,
      titulaire: titulaire.name,
      formation: cours.titre,
      code: rel.code,
      formateur: formateur.name,
      niveau: cours.niveau,
      duree: cours.duree,
      inscritLe: enr.createdAt.slice(0, 10),
      acheveLe: enr.completedAt ? enr.completedAt.slice(0, 10) : null,
      note: bilan.note,
      seuil: bilan.cfg.seuil,
      mention: rel.mention,
      competences: rel.totalAcq + '/' + rel.totalComp,
      progression: rel.leconsFaites + '/' + rel.nbLecons,
      params: parametresCertificat(db)
    }));
  }

  m = path.match(/^\/releve\/(enr_[a-z0-9]+)$/i);
  if (m && method === 'GET') {
    const u = need(req, res); if (!u) return;
    const enr = db.enrollments.find(e => e.id === m[1]);
    if (!enr) return notFound(res, u);
    // Accessible au titulaire, au formateur de la formation et à l'administration
    const cours = db.courses.find(c => c.id === enr.courseId);
    const autorise = enr.userId === u.id || u.role === 'admin' ||
      (cours && cours.formateurId === u.id);
    if (!autorise || !cours) return notFound(res, u);
    const titulaire = db.users.find(x => x.id === enr.userId);
    const formateur = db.users.find(x => x.id === cours.formateurId) || { name: 'Oasis' };
    const urlVerif = urlVerification(req, enr.id);
    return U.sendHTML(res, 200, E.releveNotes(enr, cours, titulaire, formateur,
      releveDeNotes(enr, cours), parametresCertificat(db),
      { svg: QR.qrSvg(urlVerif, { taille: 132, couleur: '#000000' }), url: urlVerif }));
  }

  m = path.match(/^\/certificat\/(enr_[a-z0-9]+)$/i);
  if (m && method === 'GET') {
    const enr = db.enrollments.find(e => e.id === m[1] && e.completedAt);
    if (!enr) return notFound(res, user);
    const cours = db.courses.find(c => c.id === enr.courseId);
    const titulaire = db.users.find(u2 => u2.id === enr.userId);
    const formateur = db.users.find(u2 => u2.id === (cours || {}).formateurId) || { name: 'Oasis' };
    if (!cours || !titulaire) return notFound(res, user);
    const urlV = urlVerification(req, enr.id);
    return U.sendHTML(res, 200, E.certificat(enr, cours, titulaire, formateur,
      bilanNotes(enr, cours), parametresCertificat(db),
      { svg: QR.qrSvg(urlV, { taille: 132, couleur: '#000000' }), url: urlV }));
  }

  /* ================= ESPACE FORMATEUR ================= */
  const donneesFormateur = (u) => {
    const mesCours = db.courses.filter(c => c.formateurId === u.id);
    const ids = new Set(mesCours.map(c => c.id));
    const ventes = db.orders.filter(o => ids.has(o.courseId) && o.status === 'payee')
      .map(o => ({ ...o,
        coursTitre: (db.courses.find(c => c.id === o.courseId) || {}).titre || '—',
        acheteur: (db.users.find(x => x.id === o.userId) || {}).name || 'Apprenant' }))
      .reverse();
    const revParCours = {};
    ventes.forEach(o => revParCours[o.courseId] = (revParCours[o.courseId] || 0) + o.net);
    const enrs = db.enrollments.filter(e => ids.has(e.courseId));
    return {
      mesCours, ventes, revParCours,
      revenusTotaux: ventes.reduce((s, o) => s + o.net, 0),
      nbEtudiants: new Set(enrs.map(e => e.userId)).size,
      nbPubliees: mesCours.filter(c => c.statut === 'publiee').length,
      nbBrouillons: mesCours.filter(c => c.statut === 'brouillon').length,
      topCours: mesCours.slice().sort((a, b) => DB.nbInscrits(b.id) - DB.nbInscrits(a.id)).slice(0, 4),
      ventesRecentes: ventes.slice(0, 5),
      retraits: db.retraits.filter(r => r.formateurId === u.id).reverse(),
      totalRetraits: db.retraits.filter(r => r.formateurId === u.id).reduce((s, r) => s + r.amount, 0),
      enrs
    };
  };

  if (path === '/formateur' && method === 'GET') {
    const u = need(req, res, ['formateur', 'admin']); if (!u) return;
    return U.sendHTML(res, 200, E.dashFormateur(u, donneesFormateur(u), flash));
  }
  if (path === '/formateur/formations' && method === 'GET') {
    const u = need(req, res, ['formateur', 'admin']); if (!u) return;
    return U.sendHTML(res, 200, E.mesFormationsF(u, db.courses.filter(c => c.formateurId === u.id), flash));
  }

  if (path === '/formateur/creer') {
    const u = need(req, res, ['formateur', 'admin']); if (!u) return;
    if (method === 'GET') return U.sendHTML(res, 200, E.creerFormation(u));

    // Le formulaire envoie du multipart (image de couverture facultative)
    let data, imageMeta = null;
    if ((req.headers['content-type'] || '').startsWith('multipart/')) {
      const mp = await U.parseMultipart(req).catch(() => null);
      if (!mp) return U.sendHTML(res, 422, E.creerFormation(u, 'Envoi invalide ou fichier trop volumineux.'));
      data = mp.fields;
      const img = mp.files.find(f => f.field === 'image' && f.filename);
      if (img) {
        const r = F.saveUpload(img, ['image']);
        if (!r.ok) return U.sendHTML(res, 422, E.creerFormation(u, r.error));
        imageMeta = r.fichier;
      }
    } else {
      data = (await U.readBody(req)).data;
    }

    const plan = DB.PLANS.find(p => p.id === (u.plan || 'gratuit')) || DB.PLANS[0];
    const nb = db.courses.filter(c => c.formateurId === u.id).length;
    if (nb >= plan.maxFormations) {
      return U.sendHTML(res, 403, E.creerFormation(u,
        `Votre plan « ${plan.label} » est limité à ${plan.maxFormations} formation(s). Passez à un plan supérieur dans « Tarifs ».`));
    }
    const prix = Number(data.prix);
    if (!data.titre || !data.categorie || !data.niveau || !data.description ||
        !Number.isFinite(prix) || prix < 0) {
      return U.sendHTML(res, 422, E.creerFormation(u, 'Veuillez remplir tous les champs obligatoires (*).'));
    }
    const c = {
      id: U.rid('crs', 6), formateurId: u.id,
      titre: String(data.titre).slice(0, 100), sousTitre: String(data.sousTitre || '').slice(0, 150),
      categorie: DB.CATEGORIES.some(x => x.id === data.categorie) ? data.categorie : 'numerique',
      format: DB.FORMATS.some(f => f.id === data.format) ? data.format : 'certificat_pro',
      modalite: DB.MODALITES.some(m => m.id === data.modalite) ? data.modalite : 'en_ligne',
      lieuPratique: String(data.lieuPratique || '').slice(0, 120) || null,
      socle: DB.SOCLE_TRANSVERSAL.filter(b => data['socle_' + b.id] === 'on').map(b => b.id),
      niveau: String(data.niveau).slice(0, 30), langue: String(data.langue || 'Français').slice(0, 30),
      duree: String(data.duree || '—').slice(0, 20),
      prix: Math.round(prix), prixBarre: Number(data.prixBarre) > prix ? Math.round(Number(data.prixBarre)) : null,
      statut: 'brouillon', badge: null, description: String(data.description).slice(0, 2000),
      image: imageMeta ? imageMeta.url : null,
      examenFinal: { questions: [] },
      modules: [], createdAt: new Date().toISOString()
    };
    db.courses.push(c);
    audit(u.id, 'course.created', { id: c.id, image: !!imageMeta });
    save();
    return U.redirect(res, `/formateur/formation/${c.id}?ok=` +
      encodeURIComponent('Formation créée ! Ajoutez maintenant vos modules, leçons, ressources et quiz.'));
  }

  m = path.match(/^\/formateur\/formation\/(crs_[a-z0-9]+)(\/.*)?$/i);
  if (m) {
    const u = need(req, res, ['formateur', 'admin']); if (!u) return;
    const c = db.courses.find(x => x.id === m[1] &&
      (x.formateurId === u.id || u.role === 'admin'));
    if (!c) return notFound(res, u);
    const sub = m[2] || '';

    if (!sub && method === 'GET') {
      const annonces = db.annonces.filter(a => a.courseId === c.id).reverse();
      return U.sendHTML(res, 200, E.gererFormation(u, c, flash, annonces));
    }

    /* --- Image de couverture --- */
    if (sub === '/image' && method === 'POST') {
      const mp = await U.parseMultipart(req).catch(() => null);
      const img = mp && mp.files.find(f => f.field === 'image' && f.filename);
      if (!img) return U.redirect(res, `/formateur/formation/${c.id}?ok=` +
        encodeURIComponent('Aucune image reçue ou fichier trop volumineux.'));
      const r = F.saveUpload(img, ['image']);
      if (!r.ok) return U.redirect(res, `/formateur/formation/${c.id}?ok=` + encodeURIComponent(r.error));
      if (c.image) F.deleteUpload(c.image);
      c.image = r.fichier.url;
      audit(u.id, 'course.image', { id: c.id });
      save();
      return U.redirect(res, `/formateur/formation/${c.id}?ok=` + encodeURIComponent('Image de couverture enregistrée.'));
    }

    /* --- Ressources de module (PDF, image, vidéo, audio) --- */
    let mm2 = sub.match(/^\/module\/(mod_[a-z0-9]+)\/fichier$/i);
    if (mm2 && method === 'POST') {
      const mod = c.modules.find(x => x.id === mm2[1]);
      if (!mod) return notFound(res, u);
      const mp = await U.parseMultipart(req).catch(() => null);
      const fic = mp && mp.files.find(f => f.field === 'fichier' && f.filename);
      if (!fic) return U.redirect(res, `/formateur/formation/${c.id}?ok=` +
        encodeURIComponent('Aucun fichier reçu ou fichier trop volumineux (' + F.LIMITES_LISIBLES + ').'));
      const r = F.saveUpload(fic, ['image', 'pdf', 'video', 'audio']);
      if (!r.ok) return U.redirect(res, `/formateur/formation/${c.id}?ok=` + encodeURIComponent(r.error));
      mod.fichiers = mod.fichiers || [];
      mod.fichiers.push(r.fichier);
      audit(u.id, 'module.fichier', { module: mod.id, type: r.fichier.type });
      save();
      return U.redirect(res, `/formateur/formation/${c.id}?ok=` +
        encodeURIComponent('Ressource « ' + r.fichier.nomOriginal + ' » téléversée.'));
    }
    mm2 = sub.match(/^\/module\/(mod_[a-z0-9]+)\/lien$/i);
    if (mm2 && method === 'POST') {
      const mod = c.modules.find(x => x.id === mm2[1]);
      if (!mod) return notFound(res, u);
      const { data } = await U.readBody(req);
      let url;
      try { url = new URL(String(data.url || '').trim()); if (!/^https?:$/.test(url.protocol)) throw 0; }
      catch { return U.redirect(res, `/formateur/formation/${c.id}?ok=` +
        encodeURIComponent('Lien invalide : indiquez une URL complète en http(s)://')); }
      mod.fichiers = mod.fichiers || [];
      mod.fichiers.push({
        id: U.rid('fic', 9), type: 'lien', url: url.toString().slice(0, 500),
        nomOriginal: String(data.titre || url.hostname).slice(0, 120),
        titreAffiche: String(data.titre || '').slice(0, 120) || url.hostname,
        description: String(data.description || '').slice(0, 500),
        createdAt: new Date().toISOString()
      });
      audit(u.id, 'module.lien', { module: mod.id });
      save();
      return U.redirect(res, `/formateur/formation/${c.id}?ok=` +
        encodeURIComponent('Lien ajouté aux ressources du module.'));
    }
    mm2 = sub.match(/^\/module\/(mod_[a-z0-9]+)\/fichier\/(fic_[a-f0-9]+)\/parametres$/i);
    if (mm2 && method === 'POST') {
      const mod = c.modules.find(x => x.id === mm2[1]);
      const fic = mod && (mod.fichiers || []).find(f => f.id === mm2[2]);
      if (!fic) return notFound(res, u);
      const { data } = await U.readBody(req);
      fic.titreAffiche = String(data.titre || '').slice(0, 120) || fic.nomOriginal;
      fic.description = String(data.description || '').slice(0, 500);
      save();
      return U.redirect(res, `/formateur/formation/${c.id}?ok=` +
        encodeURIComponent('Ressource paramétrée : « ' + fic.titreAffiche + ' ».'));
    }
    mm2 = sub.match(/^\/module\/(mod_[a-z0-9]+)\/fichier\/(fic_[a-f0-9]+)\/supprimer$/i);
    if (mm2 && method === 'POST') {
      const mod = c.modules.find(x => x.id === mm2[1]);
      if (mod && mod.fichiers) {
        const fic = mod.fichiers.find(f => f.id === mm2[2]);
        if (fic) F.deleteUpload(fic.url);
        mod.fichiers = mod.fichiers.filter(f => f.id !== mm2[2]);
        save();
      }
      return U.redirect(res, `/formateur/formation/${c.id}?ok=` + encodeURIComponent('Ressource supprimée.'));
    }

    /* --- Quiz de module --- */
    mm2 = sub.match(/^\/module\/(mod_[a-z0-9]+)\/quiz$/i);
    if (mm2 && method === 'POST') {
      const mod = c.modules.find(x => x.id === mm2[1]);
      if (!mod) return notFound(res, u);
      const { data } = await U.readBody(req);
      const q = lireQuestion(data);
      if (!q) return U.redirect(res, `/formateur/formation/${c.id}?ok=` +
        encodeURIComponent('Question invalide : énoncé + au moins 2 réponses, et la bonne réponse doit être remplie.'));
      mod.quiz = mod.quiz || { questions: [] };
      mod.quiz.questions.push(q);
      save();
      return U.redirect(res, `/formateur/formation/${c.id}?ok=` + encodeURIComponent('Question ajoutée au quiz du module.'));
    }
    mm2 = sub.match(/^\/module\/(mod_[a-z0-9]+)\/quiz\/(qst_[a-f0-9]+)\/supprimer$/i);
    if (mm2 && method === 'POST') {
      const mod = c.modules.find(x => x.id === mm2[1]);
      if (mod && mod.quiz) { mod.quiz.questions = mod.quiz.questions.filter(q => q.id !== mm2[2]); save(); }
      return U.redirect(res, `/formateur/formation/${c.id}?ok=` + encodeURIComponent('Question supprimée.'));
    }

    /* --- Évaluation finale --- */
    if (sub === '/examen' && method === 'POST') {
      const { data } = await U.readBody(req);
      const q = lireQuestion(data);
      if (!q) return U.redirect(res, `/formateur/formation/${c.id}?ok=` +
        encodeURIComponent('Question invalide : énoncé + au moins 2 réponses.'));
      c.examenFinal = c.examenFinal || { questions: [] };
      c.examenFinal.questions.push(q);
      save();
      return U.redirect(res, `/formateur/formation/${c.id}?ok=` + encodeURIComponent('Question ajoutée à l\u2019évaluation finale.'));
    }
    mm2 = sub.match(/^\/examen\/(qst_[a-f0-9]+)\/supprimer$/i);
    if (mm2 && method === 'POST') {
      if (c.examenFinal) { c.examenFinal.questions = c.examenFinal.questions.filter(q => q.id !== mm2[1]); save(); }
      return U.redirect(res, `/formateur/formation/${c.id}?ok=` + encodeURIComponent('Question supprimée.'));
    }

    if (sub === '/module' && method === 'POST') {
      const { data } = await U.readBody(req);
      if (data.titre) c.modules.push({ id: U.rid('mod', 4), titre: String(data.titre).slice(0, 120), lecons: [] });
      save();
      return U.redirect(res, `/formateur/formation/${c.id}?ok=` + encodeURIComponent('Module ajouté.'));
    }
    mm2 = sub.match(/^\/module\/(mod_[a-z0-9]+)\/lecon$/i);
    if (mm2 && method === 'POST') {
      const mod = c.modules.find(x => x.id === mm2[1]);
      const { data } = await U.readBody(req);
      if (mod && data.titre && data.contenu) {
        mod.lecons.push({ id: U.rid('lec', 4), titre: String(data.titre).slice(0, 120),
          contenu: String(data.contenu).slice(0, 5000), duree: Math.max(1, Number(data.duree) || 10) });
        save();
      }
      return U.redirect(res, `/formateur/formation/${c.id}?ok=` + encodeURIComponent('Leçon ajoutée.'));
    }
    mm2 = sub.match(/^\/module\/(mod_[a-z0-9]+)\/supprimer$/i);
    if (mm2 && method === 'POST') {
      c.modules = c.modules.filter(x => x.id !== mm2[1]);
      save();
      return U.redirect(res, `/formateur/formation/${c.id}?ok=` + encodeURIComponent('Module supprimé.'));
    }
    if (sub === '/statut' && method === 'POST') {
      const { data } = await U.readBody(req);
      if (['brouillon', 'publiee', 'archivee'].includes(data.statut)) {
        if (data.statut === 'publiee' && DB.nbLecons(c) < 1) {
          return U.redirect(res, `/formateur/formation/${c.id}?ok=` +
            encodeURIComponent('Ajoutez au moins une leçon avant de publier.'));
        }
        // Un formateur ne publie pas directement : la formation part en vérification.
        if (data.statut === 'publiee' && u.role !== 'admin') {
          c.statut = 'en_verification';
          c.moderation = { soumiseLe: new Date().toISOString() };
          audit(u.id, 'course.soumise_verification', { id: c.id });
          save();
          const back0 = req.headers.referer && req.headers.referer.includes('/formations')
            ? '/formateur/formations' : `/formateur/formation/${c.id}`;
          return U.redirect(res, back0 + '?ok=' + encodeURIComponent(
            '📋 Formation soumise à vérification — elle sera publiée après validation par l\u2019administration (délai habituel : 48 h).'));
        }
        c.statut = data.statut;
        audit(u.id, 'course.statut', { id: c.id, statut: c.statut });
        save();
      }
      const back = req.headers.referer && req.headers.referer.includes('/formations')
        ? '/formateur/formations' : `/formateur/formation/${c.id}`;
      return U.redirect(res, back + '?ok=' + encodeURIComponent(
        c.statut === 'publiee' ? '🚀 Formation publiée !' : 'Statut mis à jour : ' + c.statut + '.'));
    }
    if (sub === '/infos' && method === 'POST') {
      const { data } = await U.readBody(req);
      if (data.titre) c.titre = String(data.titre).slice(0, 100);
      if (Number.isFinite(Number(data.prix))) c.prix = Math.max(0, Math.round(Number(data.prix)));
      if (data.description) c.description = String(data.description).slice(0, 2000);
      c.format = DB.FORMATS.some(f => f.id === data.format) ? data.format : (c.format || 'certificat_pro');
      c.modalite = DB.MODALITES.some(x => x.id === data.modalite) ? data.modalite : (c.modalite || 'en_ligne');
      c.lieuPratique = String(data.lieuPratique || '').slice(0, 120) || null;
      c.socle = DB.SOCLE_TRANSVERSAL.filter(b => data['socle_' + b.id] === 'on').map(b => b.id);
      save();
      return U.redirect(res, `/formateur/formation/${c.id}?ok=` + encodeURIComponent('Informations enregistrées.'));
    }
  }

  if (path === '/formateur/revenus' && method === 'GET') {
    const u = need(req, res, ['formateur', 'admin']); if (!u) return;
    return U.sendHTML(res, 200, E.revenusF(u, donneesFormateur(u), flash));
  }
  if (path === '/formateur/retrait' && method === 'POST') {
    const u = need(req, res, ['formateur', 'admin']); if (!u) return;
    const { data } = await U.readBody(req).catch(() => ({ data: {} }));
    const montant = Math.round(Number(data.montant) || 0);
    const numero = String(data.numero || u.walletNumber || '').replace(/[\s+-]/g, '');
    const methode = PP.METHODES_RETRAIT.includes(data.methode) ? data.methode : 'moncash';
    if (montant < 500 || montant > (u.balance || 0)) {
      return U.redirect(res, '/formateur/revenus?ok=' +
        encodeURIComponent('Montant invalide : minimum 500 HTG, maximum votre solde disponible.'));
    }
    if (!U.isValidHaitiPhone(numero)) {
      return U.redirect(res, '/formateur/revenus?ok=' +
        encodeURIComponent('Indiquez votre numéro de portefeuille au format 509XXXXXXXX.'));
    }
    // Versement réel : authentification marchand → jeton signé HMAC → exécution
    const reference = PP.nouvelleReferenceRetrait();
    const out = await PP.retirer({ montant, methode, destinataire: numero, reference });
    if (!out.ok) {
      audit(u.id, 'retrait.echec', { montant, methode, erreur: out.error, etape: out.etape || null });
      save();
      return U.redirect(res, '/formateur/revenus?ok=' +
        encodeURIComponent('Versement impossible : ' + out.error + ' Votre solde n\u2019a pas été débité.'));
    }
    // La passerelle a confirmé : on débite et on archive
    u.balance -= montant;
    u.walletNumber = numero;
    u.walletMethode = methode;
    db.retraits.push({ id: out.retrait.reference, formateurId: u.id, amount: montant,
      numero, methode, status: 'verse', statutPasserelle: out.retrait.statut,
      providerTxnId: out.retrait.transactionId, frais: out.retrait.frais,
      createdAt: out.retrait.date });
    audit(u.id, 'retrait.verse', { montant, methode, reference: out.retrait.reference });
    save();
    return U.redirect(res, '/formateur/revenus?ok=' + encodeURIComponent(
      `✓ ${montant} HTG versés sur votre ${methode === 'natcash' ? 'NatCash' : 'MonCash'} ${numero}` +
      (out.retrait.transactionId ? ` (réf. ${out.retrait.transactionId})` : ` (réf. ${out.retrait.reference})`) + '.'));
  }
  if (path === '/formateur/abonnes' && method === 'GET') {
    const u = need(req, res, ['formateur', 'admin']); if (!u) return;
    const d = donneesFormateur(u);
    const list = d.enrs.map(e => {
      const cours = db.courses.find(c => c.id === e.courseId);
      return { userName: (db.users.find(x => x.id === e.userId) || {}).name || 'Apprenant',
        coursTitre: (cours || {}).titre || '—', pct: cours ? pctEnrollment(e, cours) : 0,
        createdAt: e.createdAt };
    });
    return U.sendHTML(res, 200, E.abonnesF(u, list));
  }
  if (path === '/formateur/avis' && method === 'GET') {
    const u = need(req, res, ['formateur', 'admin']); if (!u) return;
    const ids = new Set(db.courses.filter(c => c.formateurId === u.id).map(c => c.id));
    const list = db.avis.filter(a => ids.has(a.courseId)).map(a => ({ ...a,
      userName: (db.users.find(x => x.id === a.userId) || {}).name || 'Apprenant',
      coursTitre: (db.courses.find(c => c.id === a.courseId) || {}).titre || '—' })).reverse();
    return U.sendHTML(res, 200, E.avisF(u, list));
  }

  /* ================= ESPACE ENTREPRISE ================= */
  const collabsDe = (u) => db.users.filter(x => x.entrepriseId === u.id);

  if (path === '/entreprise' && method === 'GET') {
    const u = need(req, res, ['entreprise', 'admin']); if (!u) return;
    const collabs = collabsDe(u);
    const ids = new Set(collabs.map(c => c.id));
    const enrs = db.enrollments.filter(e => ids.has(e.userId));
    const parCours = {};
    enrs.forEach(e => {
      const c = db.courses.find(x => x.id === e.courseId);
      if (!c) return;
      parCours[c.id] = parCours[c.id] || { ...c, inscrits: 0, sommePct: 0 };
      parCours[c.id].inscrits++;
      parCours[c.id].sommePct += pctEnrollment(e, c);
    });
    const topFormations = Object.values(parCours)
      .map(f => ({ ...f, pct: Math.round(f.sommePct / f.inscrits) }))
      .sort((a, b) => b.inscrits - a.inscrits).slice(0, 5);
    const completees = enrs.filter(e => e.completedAt).length;
    const d = {
      nbCollabs: collabs.length,
      nbFormations: new Set(enrs.map(e => e.courseId)).size,
      nbCompletees: completees,
      tauxCompletion: enrs.length ? Math.round(100 * completees / enrs.length) : 0,
      topFormations
    };
    return U.sendHTML(res, 200, E.dashEntreprise(u, d, flash));
  }

  /* --- Création de comptes employés en lot --- */
  if (path === '/entreprise/collaborateurs/lot' && method === 'POST') {
    const u = need(req, res, ['entreprise', 'admin']); if (!u) return;
    const { data } = await U.readBody(req);
    const lignes = String(data.lot || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean).slice(0, 200);
    let crees = 0, ignores = [];
    for (const ligne of lignes) {
      // Formats acceptés : « Nom complet, email » ou « Nom complet; email » ou « Nom <email> »
      const em = ligne.match(/([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})/i);
      if (!em) { ignores.push(ligne.slice(0, 40) + ' (email manquant)'); continue; }
      const email = em[1].toLowerCase();
      const apres = ligne.slice(ligne.indexOf(em[1]) + em[1].length);
      const avant = ligne.slice(0, ligne.indexOf(em[1]));
      const name = avant.replace(/[<>,;]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 100);
      // Mot de passe facultatif après l'email : « Nom, email, MotDePasse »
      const mdpBrut = apres.replace(/[<>,;]/g, ' ').trim().split(/\s+/)[0] || '';
      const mdp = mdpBrut.length >= 8 ? mdpBrut : 'Oasis2026!';
      if (!name) { ignores.push(email + ' (nom manquant)'); continue; }
      if (db.users.some(x => x.email === email)) { ignores.push(email + ' (existe déjà)'); continue; }
      db.users.push({ id: U.rid('usr', 6), role: 'apprenant', entrepriseId: u.id,
        name, email, pass: U.hashPassword(mdp), createdAt: new Date().toISOString() });
      crees++;
    }
    audit(u.id, 'collab.lot', { crees, ignores: ignores.length });
    save();
    let msg = `${crees} compte(s) créé(s) — mot de passe provisoire : Oasis2026!`;
    if (ignores.length) msg += ` · Ignorés : ${ignores.slice(0, 3).join(' ; ')}${ignores.length > 3 ? '…' : ''}`;
    return U.redirect(res, '/entreprise/collaborateurs?ok=' + encodeURIComponent(msg));
  }

  if (path === '/entreprise/collaborateurs') {
    const u = need(req, res, ['entreprise', 'admin']); if (!u) return;
    if (method === 'POST') {
      const { data } = await U.readBody(req);
      const email = String(data.email || '').trim().toLowerCase();
      if (!data.name || !email) return U.redirect(res, '/entreprise/collaborateurs?ok=' +
        encodeURIComponent('Nom et email requis.'));
      if (db.users.some(x => x.email === email)) return U.redirect(res, '/entreprise/collaborateurs?ok=' +
        encodeURIComponent('Un compte existe déjà avec cet email.'));
      const mdp = data.password && String(data.password).length >= 8
        ? String(data.password) : 'Oasis2026!';
      db.users.push({ id: U.rid('usr', 6), role: 'apprenant', entrepriseId: u.id,
        name: String(data.name).trim().slice(0, 100), email,
        pass: U.hashPassword(mdp), createdAt: new Date().toISOString() });
      audit(u.id, 'collab.invite', { email });
      save();
      return U.redirect(res, '/entreprise/collaborateurs?ok=' +
        encodeURIComponent(`${data.name} a été invité(e) — identifiants : ${email} / ${mdp}`));
    }
    const list = collabsDe(u).map(c => {
      const enrs = db.enrollments.filter(e => e.userId === c.id);
      const pcts = enrs.map(e => {
        const co = db.courses.find(x => x.id === e.courseId);
        return co ? pctEnrollment(e, co) : 0;
      });
      return { ...c, nbFormations: enrs.length,
        pct: pcts.length ? Math.round(pcts.reduce((s, p) => s + p, 0) / pcts.length) : 0 };
    });
    return U.sendHTML(res, 200, E.collaborateursE(u, list, flash));
  }

  if (path === '/entreprise/formations' && method === 'GET') {
    const u = need(req, res, ['entreprise', 'admin']); if (!u) return;
    const collabs = collabsDe(u);
    const ids = new Set(collabs.map(c => c.id));
    const catalogueList = db.courses.filter(c => c.statut === 'publiee').map(c => ({ ...c,
      inscritsAcademie: db.enrollments.filter(e => e.courseId === c.id && ids.has(e.userId)).length }));
    return U.sendHTML(res, 200, E.formationsE(u, catalogueList, collabs, flash));
  }

  if (path === '/entreprise/assigner' && method === 'POST') {
    const u = need(req, res, ['entreprise', 'admin']); if (!u) return;
    const { data } = await U.readBody(req);
    const c = db.courses.find(x => x.id === data.courseId && x.statut === 'publiee');
    if (!c) return U.redirect(res, '/entreprise/formations?ok=' + encodeURIComponent('Formation introuvable.'));
    const cibles = data.collab === '__tous__' ? collabsDe(u)
      : collabsDe(u).filter(x => x.id === data.collab);
    let n = 0;
    const type = data.type === 'obligatoire' ? 'obligatoire' : 'optionnelle';
    for (const cible of cibles) {
      if (db.enrollments.some(e => e.userId === cible.id && e.courseId === c.id)) continue;
      db.enrollments.push({ id: U.rid('enr', 6), userId: cible.id, courseId: c.id,
        source: 'entreprise', type, entrepriseId: u.id,
        progress: [], completedAt: null, createdAt: new Date().toISOString() });
      n++;
    }
    audit(u.id, 'entreprise.assign', { courseId: c.id, n, type });
    save();
    return U.redirect(res, '/entreprise/formations?ok=' +
      encodeURIComponent(`Formation « ${c.titre} » assignée à ${n} collaborateur(s) (${type}).`));
  }

  if (path === '/entreprise/rapports' && method === 'GET') {
    const u = need(req, res, ['entreprise', 'admin']); if (!u) return;
    const ids = new Set(collabsDe(u).map(c => c.id));
    const lignes = db.enrollments.filter(e => ids.has(e.userId)).map(e => {
      const c = db.courses.find(x => x.id === e.courseId);
      return { userName: (db.users.find(x => x.id === e.userId) || {}).name || '—',
        coursTitre: (c || {}).titre || '—', type: e.type,
        pct: c ? pctEnrollment(e, c) : 0 };
    });
    return U.sendHTML(res, 200, E.rapportsE(u, lignes));
  }

  return notFound(res, user);
}

function notFound(res, user) {
  return U.sendHTML(res, 404, V.layout('Page introuvable',
    '<div class="carte" style="text-align:center;padding:40px"><h1>Page introuvable</h1><p><a href="/">Revenir à l\u2019accueil</a></p></div>',
    { user }));
}

module.exports = { handle };
