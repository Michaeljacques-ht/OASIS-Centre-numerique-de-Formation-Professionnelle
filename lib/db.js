'use strict';
/* ============================================================
   OASIS — Base de données JSON (zéro dépendance)
   ============================================================ */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

const EMPTY = {
  users: [], courses: [], enrollments: [], orders: [],
  avis: [], retraits: [], sessions: [], messagesContact: [], auditLog: [],
  sujetsForum: [], messagesForum: [], annonces: [], parametres: {},
  /* --- Gestion institutionnelle --- */
  etudiants: [],        // dossiers administratifs à matricule pérenne
  employes: [],         // dossiers du personnel (contrat de travail inclus)
  paies: [],            // bulletins de paie
  conges: [],           // demandes et soldes de congés
  postes: [],           // offres d'emploi publiées
  candidaturesEmploi: [], // candidatures reçues par le formulaire public
  comptes: [],          // plan comptable
  exercices: [],        // exercices comptables
  ecritures: [],        // écritures en partie double
  compteurs: {}         // séquences (matricules, numéros d'écriture)
};

let db = null;

function init() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (fs.existsSync(DB_FILE)) {
    try {
      db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      // Une collection absente est recréée avec le type attendu par le modèle
      for (const k of Object.keys(EMPTY)) {
        if (!db[k]) db[k] = Array.isArray(EMPTY[k]) ? [] : {};
      }
    } catch (e) {
      fs.renameSync(DB_FILE, DB_FILE + '.corrompu.' + Date.now());
      db = JSON.parse(JSON.stringify(EMPTY));
    }
  } else db = JSON.parse(JSON.stringify(EMPTY));
  seed();
  seedGestion();
  require('./programmes-import').integrate(db);
  save();
  return db;
}
function get() { if (!db) init(); return db; }

let saving = false, pending = false;
function save() {
  if (saving) { pending = true; return; }
  saving = true;
  try {
    fs.writeFileSync(DB_FILE + '.tmp', JSON.stringify(db, null, 2), 'utf8');
    fs.renameSync(DB_FILE + '.tmp', DB_FILE);
  } finally {
    saving = false;
    if (pending) { pending = false; save(); }
  }
}
/** Séquence persistée : matricules, numéros d'écriture, numéros de pièce. */
function sequence(cle) {
  if (!db.compteurs || Array.isArray(db.compteurs)) db.compteurs = {};
  db.compteurs[cle] = (db.compteurs[cle] || 0) + 1;
  return db.compteurs[cle];
}

/** Exercice comptable contenant une date, ou l'exercice ouvert le plus récent. */
function exerciceCourant(date) {
  const d = date || new Date().toISOString().slice(0, 10);
  return db.exercices.find(e => !e.clos && d >= e.debut && d <= e.fin)
      || db.exercices.filter(e => !e.clos).sort((a, b) => b.debut.localeCompare(a.debut))[0]
      || null;
}

function audit(actor, action, details) {
  db.auditLog.push({ at: new Date().toISOString(), actor, action, details: details || null });
  if (db.auditLog.length > 5000) db.auditLog = db.auditLog.slice(-4000);
}

/* ---------- Catégories et plans ---------- */
const CATEGORIES = [
  { id: 'numerique',    label: 'Numérique & informatique', emoji: '💻', deg: '#0B3C91,#2E8BE6' },
  { id: 'creation',     label: 'Création numérique',       emoji: '🎨', deg: '#7A1FA2,#C86DD7' },
  { id: 'energie',      label: 'Électricité & énergie',    emoji: '⚡', deg: '#C97A00,#FBBF24' },
  { id: 'batiment',     label: 'Construction & bâtiment',  emoji: '🔧', deg: '#5B4636,#A1795A' },
  { id: 'automobile',   label: 'Automobile & mobilité',    emoji: '🚗', deg: '#B3261E,#F2715E' },
  { id: 'froid',        label: 'Froid & climatisation',    emoji: '❄️', deg: '#0E7490,#5FD4E8' },
  { id: 'electronique', label: 'Électronique & télécom',   emoji: '📱', deg: '#1E40AF,#60A5FA' },
  { id: 'hotellerie',   label: 'Hôtellerie & restauration', emoji: '🏨', deg: '#9A3412,#FB923C' },
  { id: 'mode',         label: 'Mode & beauté',            emoji: '👗', deg: '#9D174D,#F472B6' },
  { id: 'agriculture',  label: 'Agriculture & transformation', emoji: '🌱', deg: '#166534,#4ADE80' },
  { id: 'administration', label: 'Administration & entreprise', emoji: '📊', deg: '#334155,#7C8CA3' },
  { id: 'finance',      label: 'Finance & microfinance',   emoji: '💳', deg: '#065F46,#10B981' },
  { id: 'commerce',     label: 'Commerce & logistique',    emoji: '📦', deg: '#7C2D12,#D97706' },
  { id: 'emergents',    label: 'Métiers émergents',        emoji: '📡', deg: '#001C4A,#0CAFFA' },
  { id: 'distance',     label: 'Emploi à distance',        emoji: '🧑‍💼', deg: '#3730A3,#818CF8' }
];

/* ---------- Formats de certification ----------
   Trois durées de parcours, du certificat court à l'insertion complète. */
const FORMATS = [
  { id: 'certificat_court', label: 'Certificat court',        duree: '1 à 3 mois',  emoji: '⏱️',
    description: 'Une compétence précise, rapidement opérationnelle.' },
  { id: 'certificat_pro',   label: 'Certificat professionnel', duree: '3 à 6 mois', emoji: '📜',
    description: 'Le cœur du métier, avec pratique encadrée.' },
  { id: 'parcours_metier',  label: 'Parcours métier',          duree: '6 à 12 mois', emoji: '🏅',
    description: 'Métier complet, socle transversal et stage : prêt à l\u2019emploi.' }
];

/* ---------- Modalités d'apprentissage ----------
   Un plombier ne se forme pas entièrement derrière un écran : la plateforme
   distingue explicitement ce qui se fait en ligne de ce qui se fait en atelier. */
const MODALITES = [
  { id: 'en_ligne',  label: '100 % en ligne', emoji: '🌐',
    description: 'Théorie, exercices et évaluations à distance.' },
  { id: 'hybride',   label: 'Hybride',        emoji: '🔄',
    description: 'Théorie en ligne, pratique en atelier ou en centre.' },
  { id: 'presentiel', label: 'Présentiel',    emoji: '🏫',
    description: 'Atelier encadré, suivi administratif en ligne.' }
];

/* ---------- Socle transversal « métier + numérique + entrepreneuriat » ----------
   Blocs que le formateur active sur un parcours métier : la compétence technique
   seule ne suffit pas à vivre de son métier. */
const SOCLE_TRANSVERSAL = [
  { id: 'securite',   emoji: '🦺', label: 'Sécurité au travail',
    resume: 'Équipements de protection, gestes sûrs, prévention des accidents.' },
  { id: 'devis',      emoji: '🧾', label: 'Calcul de devis et tarification',
    resume: 'Chiffrer un travail, calculer sa marge, présenter un devis clair.' },
  { id: 'client',     emoji: '🤝', label: 'Service et relation client',
    resume: 'Accueillir, expliquer, gérer une réclamation, fidéliser.' },
  { id: 'gestion',    emoji: '📈', label: 'Gestion d\u2019une petite entreprise',
    resume: 'Recettes et dépenses, stock, caisse, obligations de base.' },
  { id: 'marketing',  emoji: '📲', label: 'Marketing WhatsApp et Facebook',
    resume: 'Se faire connaître, publier, répondre, convertir un contact en client.' },
  { id: 'numerique',  emoji: '💻', label: 'Compétences numériques de base',
    resume: 'Téléphone et ordinateur, courriel, recherche, documents.' }
];

const PLANS = [
  { id: 'gratuit', label: 'Gratuit', prixMois: 0, maxFormations: 1, maxApprenants: 10,
    inclus: ['Créer jusqu\u2019à 1 formation', 'Jusqu\u2019à 10 apprenants', 'Outils marketing de base', 'Support par email'] },
  { id: 'starter', label: 'Starter', prixMois: 950, maxFormations: Infinity, maxApprenants: 200,
    inclus: ['Formations illimitées', 'Jusqu\u2019à 200 apprenants', 'Certificats personnalisés', 'Support prioritaire par email'] },
  { id: 'pro', label: 'Pro', prixMois: 2450, maxFormations: Infinity, maxApprenants: Infinity, reco: true,
    inclus: ['Apprenants illimités', 'Outils marketing avancés', 'Rapports & analyses avancés', 'Sessions en direct', 'Support prioritaire par chat'] },
  { id: 'entreprise', label: 'Entreprise', prixMois: 4950, maxFormations: Infinity, maxApprenants: Infinity,
    inclus: ['Gestion multi-formateurs', 'Marque blanche (white label)', 'Intégrations avancées (API)', 'Gestionnaire de compte dédié'] }
];
const COMMISSION = 0.15; // 15 % pour la plateforme, 85 % au formateur

/* ---------- Initialisation de la gestion institutionnelle ----------
   Indépendante du jeu de démonstration : une base déjà peuplée reçoit
   elle aussi son plan comptable et son exercice ouvert.               */
function seedGestion() {
  const G = require('./gestion');

  // Plan comptable de référence, sans écraser les comptes déjà créés
  if (!db.comptes.length) {
    db.comptes = G.PLAN_COMPTABLE.map(c => ({ ...c, systeme: true }));
  }

  // Exercice comptable ouvert sur l'année civile courante
  if (!db.exercices.length) {
    const an = new Date().getFullYear();
    db.exercices.push({
      id: 'exe_' + an, libelle: 'Exercice ' + an,
      debut: an + '-01-01', fin: an + '-12-31',
      clos: false, ouvertLe: new Date().toISOString()
    });
  }

  // Paramètres de paie : valeurs légales par défaut, modifiables en back-office
  db.parametres = db.parametres || {};
  if (!db.parametres.paie) {
    db.parametres.paie = JSON.parse(JSON.stringify({
      ona: G.PARAMS_PAIE.ona,
      ofatmaMaladie: G.PARAMS_PAIE.ofatmaMaladie,
      ofatmaAccident: G.PARAMS_PAIE.ofatmaAccident,
      iri: G.PARAMS_PAIE.iri.map(t => ({ jusqua: t.jusqua === Infinity ? null : t.jusqua, taux: t.taux })),
      congesAnnuelsJours: G.PARAMS_PAIE.congesAnnuelsJours,
      boniMois: G.PARAMS_PAIE.boniMois,
      devise: 'HTG'
    }));
  }
}

/** Paramètres de paie effectifs, barème rechargé depuis la base. */
function paramsPaie() {
  const G = require('./gestion');
  const p = (db.parametres && db.parametres.paie) || {};
  return {
    ona: p.ona || G.PARAMS_PAIE.ona,
    ofatmaMaladie: p.ofatmaMaladie || G.PARAMS_PAIE.ofatmaMaladie,
    ofatmaAccident: p.ofatmaAccident || G.PARAMS_PAIE.ofatmaAccident,
    iri: (p.iri || G.PARAMS_PAIE.iri).map(t => ({
      jusqua: t.jusqua === null || t.jusqua === undefined ? Infinity : t.jusqua, taux: t.taux })),
    congesAnnuelsJours: p.congesAnnuelsJours || G.PARAMS_PAIE.congesAnnuelsJours,
    boniMois: p.boniMois === undefined ? G.PARAMS_PAIE.boniMois : p.boniMois
  };
}

/* ---------- Données de démonstration ---------- */
function seed() {
  const { hashPassword, rid } = require('./utils');
  if (db.users.length) return;
  const now = new Date().toISOString();

  db.users.push(
    { id: 'usr_admin', role: 'admin', name: 'Administration Oasis', email: 'admin@oasis.ht',
      pass: hashPassword('Admin2026!'), createdAt: now },
    { id: 'usr_jean', role: 'formateur', name: 'Jean Marc Louis', email: 'jean@oasis.ht',
      pass: hashPassword('Formateur1!'), plan: 'pro', verified: true, balance: 41250,
      titrePro: 'Ingénieur logiciel & formateur certifié',
      bio: 'Dix ans d\u2019expérience en développement web et bureautique professionnelle. J\u2019accompagne étudiants et entreprises haïtiennes dans leur montée en compétences numériques.',
      expertises: ['Laravel', 'Excel avancé', 'Marketing digital', 'Python'],
      siteWeb: 'https://jeanbaptiste-formation.ht', whatsapp: '50937001111', createdAt: now },
    { id: 'usr_sophia', role: 'formateur', name: 'Sophia B. Morin', email: 'sophia@oasis.ht',
      pass: hashPassword('Formateur1!'), plan: 'starter', verified: true, balance: 12800,
      bio: 'Enseignante d\u2019anglais professionnel.', createdAt: now },
    { id: 'usr_cand', role: 'formateur', name: 'Stevens François', email: 'stevens.f@oasis.ht',
      pass: hashPassword('Candidat1!'), plan: 'gratuit', verified: false, balance: 0,
      candidature: { statut: 'en_attente', soumiseLe: now,
        titrePro: 'Comptable agréé CPA', expertises: ['Comptabilité', 'QuickBooks'],
        experience: '8 ans en cabinet comptable à Port-au-Prince, formateur occasionnel en entreprise.',
        motivation: 'Je souhaite rendre la comptabilité accessible aux petites entreprises haïtiennes.',
        portfolio: 'https://linkedin.com/in/stevensf' } },
    { id: 'usr_marie', role: 'apprenant', name: 'Marie L. Pierre', email: 'marie@oasis.ht',
      pass: hashPassword('Apprenant1!'), createdAt: now },
    { id: 'usr_digicel', role: 'entreprise', name: 'Digicel SA', email: 'academie@digicel.ht',
      pass: hashPassword('Entreprise1!'), companyName: 'Digicel Academy', plan: 'entreprise', createdAt: now }
  );

  const lecon = (t, c, d) => ({ id: rid('lec', 4), titre: t, contenu: c, duree: d || 10 });
  const mod = (t, lecons) => ({ id: rid('mod', 4), titre: t, lecons });

  db.courses.push(
    { id: 'crs_laravel', formateurId: 'usr_jean', titre: 'Développement Web complet avec Laravel',
      sousTitre: 'Du premier contrôleur au déploiement en production', categorie: 'numerique', format: 'certificat_pro', modalite: 'en_ligne',
      niveau: 'Intermédiaire', langue: 'Français', duree: '12h', prix: 4900, prixBarre: 7900,
      statut: 'publiee', badge: 'Bestseller', createdAt: now,
      description: 'Maîtrisez Laravel de A à Z : routes, Eloquent, authentification, API REST et déploiement. Projet fil rouge : une plateforme de gestion scolaire adaptée au contexte haïtien.',
      evaluation: { poidsQuiz: 30, poidsExamen: 70, seuil: 60, melanger: true },
      examenFinal: { epreuves: [
        { id: rid('ep', 4), type: 'projet_final', titre: 'Projet : mini-plateforme scolaire', poids: 100,
          consigne: 'Développez une application Laravel de gestion des notes (élèves, matières, bulletins). Déposez le lien GitHub et une courte présentation de votre architecture.' }
      ] },
      modules: [
        mod('Introduction et installation', [
          lecon('Bienvenue dans la formation', 'Présentation des objectifs, du projet fil rouge et des prérequis. Installation de PHP, Composer et Laravel sur Windows.', 8),
          lecon('Structure d\u2019un projet Laravel', 'Découverte des dossiers app/, routes/, resources/ et du cycle de vie d\u2019une requête.', 12)]),
        mod('Routes, contrôleurs et vues', [
          lecon('Le routage', 'Routes GET/POST, paramètres, groupes et middleware.', 15),
          lecon('Blade, le moteur de templates', 'Layouts, composants, boucles et directives Blade.', 14)]),
        mod('Base de données avec Eloquent', [
          lecon('Migrations et modèles', 'Créer le schéma de la base et les modèles Eloquent.', 16),
          lecon('Relations entre modèles', 'hasMany, belongsTo, belongsToMany avec exemples concrets.', 18)]),
        mod('Projet final et déploiement', [
          lecon('Authentification et rôles', 'Inscription, connexion et autorisations par rôle.', 15),
          lecon('Déployer sur un hébergeur cPanel', 'Mise en production pas à pas sur un hébergement mutualisé.', 12)])
      ] },
    { id: 'crs_excel', formateurId: 'usr_jean', titre: 'Excel avancé pour les professionnels',
      sousTitre: 'Tableaux croisés, formules et automatisation', categorie: 'administration', format: 'certificat_court', modalite: 'en_ligne',
      niveau: 'Avancé', langue: 'Français', duree: '8h', prix: 2900, prixBarre: null,
      statut: 'publiee', badge: 'Nouveau', createdAt: now,
      description: 'RECHERCHEX, tableaux croisés dynamiques, Power Query et macros : gagnez des heures chaque semaine dans vos rapports.',
      evaluation: { poidsQuiz: 40, poidsExamen: 60, seuil: 60, melanger: true },
      examenFinal: { epreuves: [
        { id: rid('ep', 4), type: 'qcm', titre: 'QCM de synthèse', poids: 60,
          consigne: 'Répondez à toutes les questions.',
          questions: [
            { id: rid('qst', 4), question: 'Quelle fonction moderne remplace RECHERCHEV ?',
              options: ['RECHERCHEX', 'SOMME.SI', 'CONCAT', 'INDIRECT'], bonne: 0 },
            { id: rid('qst', 4), question: 'Un tableau croisé dynamique sert principalement à…',
              options: ['Dessiner des formes', 'Synthétiser et analyser des données', 'Envoyer des emails', 'Protéger un classeur'], bonne: 1 }
          ] },
        { id: rid('ep', 4), type: 'trous', titre: 'Vocabulaire Excel', poids: 40,
          consigne: 'Complétez les mots manquants.',
          texte: 'Pour croiser des données, on utilise un tableau {{croisé}} dynamique. La fonction {{RECHERCHEX}} remplace RECHERCHEV.' }
      ] },
      modules: [
        Object.assign(mod('Formules avancées', [
          lecon('RECHERCHEX et INDEX/EQUIV', 'Les recherches modernes qui remplacent RECHERCHEV.', 14),
          lecon('Formules matricielles dynamiques', 'FILTRE, TRIER, UNIQUE et leurs combinaisons.', 12)]),
        { competences: ['Maîtriser RECHERCHEX', 'Construire des formules matricielles dynamiques'],
          quiz: { questions: [
          { id: rid('qst', 4), question: 'RECHERCHEX peut chercher…',
            options: ['Uniquement vers la droite', 'Dans les deux sens', 'Uniquement des nombres', 'Une seule colonne à la fois'], bonne: 1 }
        ] } }),
        Object.assign(mod('Tableaux croisés dynamiques', [
          lecon('Construire un TCD efficace', 'Sources, champs calculés et segments.', 16),
          lecon('Tableaux de bord', 'Construire un tableau de bord de suivi budgétaire en gourdes.', 15)]),
        { competences: ['Analyser des données avec les TCD', 'Concevoir un tableau de bord budgétaire'] })
      ] },
    { id: 'crs_marketing', formateurId: 'usr_jean', titre: 'Stratégies Marketing Digital 2026',
      sousTitre: 'Réseaux sociaux, WhatsApp Business et contenu local', categorie: 'creation', format: 'certificat_court', modalite: 'en_ligne',
      niveau: 'Débutant', langue: 'Français', duree: '6h', prix: 3900, prixBarre: 5900,
      statut: 'publiee', badge: 'Populaire', createdAt: now,
      description: 'Une stratégie digitale adaptée au marché haïtien : Facebook, Instagram, WhatsApp Business, contenu en créole et mesure des résultats.',
      modules: [
        mod('Fondations', [
          lecon('Définir sa cible et son offre', 'Personas et proposition de valeur pour le marché local.', 12),
          lecon('WhatsApp Business pour vendre', 'Catalogue, réponses rapides et diffusion.', 14)]),
        mod('Contenu et mesure', [
          lecon('Calendrier éditorial bilingue', 'Planifier un mois de contenu français/créole.', 13),
          lecon('Mesurer avec Meta Business Suite', 'Les indicateurs qui comptent vraiment.', 11)])
      ] },
    { id: 'crs_anglais', formateurId: 'usr_sophia', titre: 'Anglais professionnel : de débutant à avancé',
      sousTitre: 'Communiquer avec assurance au travail', categorie: 'administration', format: 'certificat_pro', modalite: 'en_ligne',
      niveau: 'Tous niveaux', langue: 'Français', duree: '15h', prix: 2400, prixBarre: null,
      statut: 'publiee', badge: null, createdAt: now,
      description: 'Emails, réunions, appels et entretiens d\u2019embauche : un anglais professionnel solide, avec exercices audio et mises en situation.',
      modules: [
        mod('Les bases professionnelles', [
          lecon('Se présenter et présenter son entreprise', 'Vocabulaire et structures essentielles.', 12),
          lecon('Écrire un email professionnel', 'Formules, ton et modèles réutilisables.', 14)]),
        mod('Réunions et appels', [
          lecon('Participer à une réunion', 'Exprimer un avis, poser des questions, reformuler.', 15),
          lecon('Appels et visioconférences', 'Gérer un appel difficile avec calme et clarté.', 13)])
      ] },
    { id: 'crs_python', formateurId: 'usr_jean', titre: 'Initiation à Python',
      sousTitre: 'Vos premiers programmes pas à pas — ouvert à tous', categorie: 'numerique',
      format: 'certificat_court', modalite: 'en_ligne',
      niveau: 'Débutant', langue: 'Français', duree: '5h', prix: 0, prixBarre: null,
      statut: 'publiee', badge: 'Gratuit', createdAt: now,
      description: 'Variables, boucles, fonctions et petits projets pratiques pour bien démarrer en programmation.',
      modules: [ mod('Premiers pas', [ lecon('Installer Python', 'Installation et premier script.', 10) ]) ] }
  );

  /* ---------- Filières prioritaires du plan de lancement ----------
     Quinze métiers choisis pour leur potentiel d'emploi, d'auto-emploi ou de
     création de microentreprise en Haïti. Chacune combine technique, socle
     transversal et pratique encadrée. */
  const filiere = (id, titre, sousTitre, categorie, fmt, modal, duree, prix, socle, lieu, badge) => ({
    id, formateurId: 'usr_jean', titre, sousTitre, categorie,
    format: fmt, modalite: modal, lieuPratique: lieu || null,
    socle: socle || [], niveau: 'Débutant', langue: 'Français', duree,
    prix, prixBarre: null, statut: 'publiee', badge: badge || null, createdAt: now,
    description: sousTitre + ' Formation structurée en théorie à distance, travaux pratiques encadrés '
      + 'et évaluation par compétences, avec certification Oasis à la clé.',
    evaluation: { poidsQuiz: 40, poidsExamen: 60, seuil: 60, melanger: true },
    modules: [ mod('Fondamentaux du métier', [
      lecon('Le métier et son marché', 'Débouchés, clients types, revenus attendus en Haïti.', 25),
      lecon('Outils et équipement de base', 'Matériel indispensable, coûts, où s\u2019approvisionner.', 30)
    ]) ]
  });
  const SOCLE_COMPLET = ['securite', 'devis', 'client', 'gestion', 'marketing'];

  db.courses.push(
    filiere('crs_solaire', 'Installation et maintenance de systèmes solaires',
      'Dimensionner, installer et entretenir une installation photovoltaïque.',
      'energie', 'parcours_metier', 'hybride', '6 mois', 18500, SOCLE_COMPLET,
      'Atelier Oasis — Port-au-Prince', 'Prioritaire'),
    filiere('crs_electricite', 'Électricité résidentielle',
      'Câblage, tableaux, mises aux normes et dépannage en habitation.',
      'energie', 'certificat_pro', 'hybride', '4 mois', 12500, SOCLE_COMPLET,
      'Atelier Oasis — Port-au-Prince', 'Prioritaire'),
    filiere('crs_plomberie', 'Plomberie',
      'Installation sanitaire, réseaux d\u2019eau, réparation de fuites.',
      'batiment', 'certificat_pro', 'hybride', '4 mois', 11500, SOCLE_COMPLET,
      'Atelier partenaire — Delmas', 'Prioritaire'),
    filiere('crs_froid', 'Froid et climatisation',
      'Installation, entretien et réparation de climatiseurs et réfrigérateurs.',
      'froid', 'parcours_metier', 'hybride', '6 mois', 16500, SOCLE_COMPLET,
      'Atelier Oasis — Port-au-Prince', 'Prioritaire'),
    filiere('crs_smartphone', 'Réparation de smartphones',
      'Diagnostic, remplacement d\u2019écrans et de batteries, micro-soudure d\u2019initiation.',
      'electronique', 'certificat_pro', 'hybride', '3 mois', 9500, SOCLE_COMPLET,
      'Atelier Oasis — Port-au-Prince', 'Prioritaire'),
    filiere('crs_maintenance', 'Maintenance informatique et réseaux',
      'Dépannage, montage, installation de réseaux et Wi-Fi.',
      'numerique', 'certificat_pro', 'hybride', '4 mois', 13500, SOCLE_COMPLET,
      'Atelier Oasis — Port-au-Prince', 'Prioritaire'),
    filiere('crs_camera', 'Installation de caméras et systèmes de sécurité',
      'Vidéosurveillance, alarmes, configuration et accès à distance.',
      'electronique', 'certificat_pro', 'hybride', '3 mois', 11000, SOCLE_COMPLET,
      'Atelier partenaire — Pétion-Ville', 'Prioritaire'),
    filiere('crs_mecanique', 'Mécanique moto et automobile',
      'Entretien, diagnostic et réparation courante des deux et quatre roues.',
      'automobile', 'parcours_metier', 'hybride', '8 mois', 19500, SOCLE_COMPLET,
      'Garage partenaire — Carrefour', 'Prioritaire'),
    filiere('crs_webdev', 'Développement web',
      'Sites et applications : HTML, CSS, JavaScript et mise en ligne.',
      'numerique', 'parcours_metier', 'en_ligne', '6 mois', 15500,
      ['client', 'gestion', 'marketing'], null, 'Prioritaire'),
    filiere('crs_infographie', 'Infographie et création de contenu numérique',
      'Identité visuelle, affiches, retouche et contenus pour les réseaux.',
      'creation', 'certificat_pro', 'en_ligne', '4 mois', 11500,
      ['client', 'devis', 'gestion', 'marketing'], null, 'Prioritaire'),
    filiere('crs_compta', 'Comptabilité informatisée',
      'Tenue de comptes, états financiers et logiciels de gestion.',
      'administration', 'certificat_pro', 'en_ligne', '4 mois', 12000,
      ['client', 'gestion', 'numerique'], null, 'Prioritaire'),
    filiere('crs_credit', 'Agent de crédit et microfinance',
      'Montage de dossier, analyse de risque, suivi et recouvrement.',
      'finance', 'certificat_pro', 'hybride', '4 mois', 12500,
      ['client', 'gestion', 'numerique'], 'Institution partenaire — Port-au-Prince', 'Prioritaire'),
    filiere('crs_cuisine', 'Cuisine, pâtisserie et boulangerie',
      'Techniques de base, hygiène alimentaire et production en atelier.',
      'hotellerie', 'parcours_metier', 'hybride', '6 mois', 14500, SOCLE_COMPLET,
      'Cuisine-école Oasis — Port-au-Prince', 'Prioritaire'),
    filiere('crs_couture', 'Couture et confection',
      'Prise de mesures, patronage, assemblage et finitions.',
      'mode', 'parcours_metier', 'hybride', '6 mois', 12500, SOCLE_COMPLET,
      'Atelier partenaire — Croix-des-Bouquets', 'Prioritaire'),
    filiere('crs_entrepreneuriat', 'Entrepreneuriat et gestion d\u2019une petite entreprise',
      'Du projet à la première vente : modèle, chiffrage, clients et suivi.',
      'administration', 'certificat_court', 'en_ligne', '2 mois', 6500,
      ['devis', 'client', 'gestion', 'marketing', 'numerique'], null, 'Prioritaire')

  );

  // Inscriptions, commandes et avis de démonstration
  db.enrollments.push(
    { id: rid('enr', 6), userId: 'usr_marie', courseId: 'crs_laravel', source: 'achat',
      progress: [], completedAt: null, createdAt: now }
  );
  db.orders.push(
    { id: rid('ord', 6), userId: 'usr_marie', courseId: 'crs_laravel', amount: 4900,
      commission: Math.round(4900 * COMMISSION), net: 4900 - Math.round(4900 * COMMISSION),
      method: 'moncash', status: 'payee', createdAt: now }
  );
  db.annonces.push(
    { id: rid('ann', 5), courseId: 'crs_laravel', formateurId: 'usr_jean',
      titre: 'Bienvenue dans la formation !',
      contenu: 'Session de questions-réponses en direct chaque vendredi à 18 h sur le forum. Pensez à télécharger les ressources du module 1 avant de commencer.',
      createdAt: now }
  );
  const suj = { id: rid('suj', 5), courseId: 'crs_laravel', userId: 'usr_marie',
    titre: 'Erreur lors de l\u2019installation de Composer', createdAt: now };
  db.sujetsForum.push(suj);
  db.messagesForum.push(
    { id: rid('mfr', 5), sujetId: suj.id, userId: 'usr_marie',
      contenu: 'Bonjour, j\u2019obtiens une erreur SSL en installant Composer sur Windows 10. Une idée ?', createdAt: now },
    { id: rid('mfr', 5), sujetId: suj.id, userId: 'usr_jean',
      contenu: 'Bonjour Marie ! Téléchargez le certificat cacert.pem et indiquez son chemin dans php.ini (openssl.cafile). Je détaille cela dans la leçon 1 du module 1.', createdAt: now }
  );
  db.avis.push(
    { id: rid('avi', 5), courseId: 'crs_laravel', userId: 'usr_marie', note: 5,
      commentaire: 'Excellente formation ! Très bien expliquée et facile à suivre.', createdAt: now },
    { id: rid('avi', 5), courseId: 'crs_excel', userId: 'usr_marie', note: 5,
      commentaire: 'Contenu très riche et formateur très disponible.', createdAt: now },
    { id: rid('avi', 5), courseId: 'crs_anglais', userId: 'usr_marie', note: 4,
      commentaire: 'Bonne formation, merci beaucoup !', createdAt: now }
  );

  seedDemoGestion();
}

/* ---------- Démonstration de la gestion institutionnelle ----------
   N'est appelée que depuis seed(), donc uniquement sur une base neuve :
   une base en production ne reçoit jamais ces enregistrements.        */
function seedDemoGestion() {
  // OASIS_SANS_DEMO=1 : installation vierge, sans dossiers ni écritures fictifs
  if (process.env.OASIS_SANS_DEMO === '1') { seedGestion(); return; }
  const { rid } = require('./utils');
  const G = require('./gestion');
  seedGestion();                       // plan comptable, exercice, paramètres
  const an = new Date().getFullYear();
  const P = paramsPaie();

  /* --- Dossiers étudiants --- */
  const profils = [
    { prenom: 'Rosemie', nom: 'Baptiste', sexe: 'F', tel: '+509 3456 7890',
      niveau: 'Philo', intitule: 'Installation électrique résidentielle', frais: 24000, verses: 3, regle: 2 },
    { prenom: 'Widmar', nom: 'Célestin', sexe: 'M', tel: '+509 3712 4408',
      niveau: '9e année fondamentale', intitule: 'Plomberie sanitaire', frais: 18000, verses: 3, regle: 3 },
    { prenom: 'Nadège', nom: 'Jean-Baptiste', sexe: 'F', tel: '+509 3890 1177',
      niveau: 'Bac I', intitule: 'Couture industrielle', frais: 15000, verses: 2, regle: 1 },
    { prenom: 'Ernst', nom: 'Dorvilier', sexe: 'M', tel: '+509 4411 0932',
      niveau: 'CAP mécanique', intitule: 'Froid et climatisation', frais: 27000, verses: 3, regle: 0 }
  ];
  let seqEtu = 0, seqRecu = 0, seqEcr = {};
  const numEcr = (j) => {
    seqEcr[j] = (seqEcr[j] || 0) + 1;
    return j + '-' + an + '-' + String(seqEcr[j]).padStart(5, '0');
  };
  const ecrire = (journal, date, piece, libelle, lignes, source, ref) => {
    db.ecritures.push({ id: rid('ecr', 8), numero: numEcr(journal),
      exerciceId: 'exe_' + an, journal, date, piece, libelle, lignes,
      source, refSource: ref || null, validee: true,
      saisieLe: new Date().toISOString(), saisiePar: 'usr_admin' });
  };
  // Les échéances démarrent 4 mois en arrière : un dossier affiche donc du retard
  const d0 = new Date(); d0.setMonth(d0.getMonth() - 4);
  const depart = d0.toISOString().slice(0, 10);

  for (const p of profils) {
    seqEtu++;
    const et = {
      id: rid('etu', 8), matricule: G.matricule(an, seqEtu),
      prenom: p.prenom, nom: p.nom, sexe: p.sexe, telephone: p.tel,
      email: (p.prenom + '.' + p.nom).toLowerCase().normalize('NFD')
        .replace(/[̀-ͯ]/g, '').replace(/[^a-z.]/g, '') + '@exemple.ht',
      niveauScolaire: p.niveau, adresse: 'Port-au-Prince', statut: 'actif',
      inscriptions: [], paiements: [], ouvertLe: new Date().toISOString(), ouvertPar: 'usr_admin'
    };
    const nomComplet = p.prenom + ' ' + p.nom;
    const ins = { id: rid('ins', 8), courseId: null, intitule: p.intitule,
      periode: String(an), dateInscription: new Date(depart).toISOString(), statut: 'en_cours',
      echeancier: G.echeancier(p.frais, p.verses, depart) };
    et.inscriptions.push(ins);
    ecrire('VT', depart, 'INS-' + et.matricule.slice(-4),
      'Frais de scolarité — ' + et.matricule + ' — ' + p.intitule,
      [{ compte: '411000', libelle: nomComplet, debit: p.frais, credit: 0 },
       { compte: '706100', libelle: p.intitule, debit: 0, credit: p.frais }],
      'scolarite.facturation', ins.id);

    // Règlement des premières échéances
    for (let i = 0; i < p.regle; i++) {
      const l = ins.echeancier[i];
      l.regle = l.montant;
      seqRecu++;
      const mode = i % 2 === 0 ? 'moncash' : 'caisse';
      const compte = mode === 'moncash' ? '515000' : '531000';
      const paiement = { id: rid('pay', 8),
        recu: 'REC-' + an + '-' + String(seqRecu).padStart(5, '0'),
        date: l.echeance, montant: l.montant, mode,
        imputations: [{ echeance: l.echeance, rang: l.rang, montant: l.montant }],
        note: 'Versement ' + l.rang + '/' + p.verses,
        encaissePar: 'usr_admin', encaisseLe: new Date().toISOString() };
      et.paiements.push(paiement);
      ecrire(mode === 'moncash' ? 'MM' : 'CA', l.echeance, paiement.recu,
        'Encaissement scolarité — ' + et.matricule,
        [{ compte, libelle: 'Reçu ' + paiement.recu, debit: l.montant, credit: 0 },
         { compte: '411000', libelle: nomComplet, debit: 0, credit: l.montant }],
        'scolarite.encaissement', paiement.id);
    }
    db.etudiants.push(et);
  }

  /* --- Personnel --- */
  const equipe = [
    { nom: 'Jacques Pierre-Louis', poste: 'Coordonnateur pédagogique', dep: 'Pédagogie', sal: 48000,
      sexe: 'M', ec: 'marie', naiss: '1986-03-14', nature: 'Coordination des programmes de formation, suivi pédagogique des formateurs et des apprenants, organisation des évaluations.' },
    { nom: 'Marlène Édouard', poste: 'Responsable administrative', dep: 'Administration', sal: 36000,
      sexe: 'F', ec: 'celibataire', naiss: '1991-11-02', nature: 'Gestion administrative du centre, dossiers étudiants, correspondance et archivage.' },
    { nom: 'Fritznel Augustin', poste: 'Chef d’atelier électricité', dep: 'Ateliers', sal: 32000,
      sexe: 'M', ec: 'marie', naiss: '1983-07-28', nature: 'Encadrement de l’atelier d’électricité, sécurité des postes de travail, entretien de l’outillage.' },
    { nom: 'Carline Moïse', poste: 'Secrétaire-comptable', dep: 'Administration', sal: 22000,
      sexe: 'F', ec: 'celibataire', naiss: '1995-01-19', nature: 'Accueil, secrétariat, saisie comptable et suivi des encaissements.' }
  ];
  let seqEmp = 0;
  const embauche = new Date(); embauche.setFullYear(embauche.getFullYear() - 2);
  const dEmb = embauche.toISOString().slice(0, 10);
  for (const e of equipe) {
    seqEmp++;
    const mat = 'EMP-' + an + '-' + String(seqEmp).padStart(3, '0');
    db.employes.push({
      id: rid('emp', 8), matricule: mat,
      nom: e.nom, poste: e.poste, departement: e.dep, typeContrat: 'indetermine',
      dateEmbauche: dEmb, dateFin: null,
      salaireBase: e.sal, telephone: '+509 3' + (200 + seqEmp) + ' 00' + seqEmp + seqEmp,
      email: e.nom.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z]/g, '.') + '@oasis.ht',
      adresse: 'Rue Capois 42, Port-au-Prince',
      naissance: e.naiss, sexe: e.sexe, nationalite: 'Haïtienne', etatCivil: e.ec,
      cin: '00' + (3 + seqEmp) + '-' + (100 + seqEmp * 7) + '-' + (1980 + seqEmp) + '-0' + seqEmp,
      numeroLivret: 'LT-' + (52000 + seqEmp * 13),
      nif: '00' + (seqEmp * 111) + '-' + (seqEmp * 7) + '-0',
      numeroOna: 'ONA' + (41000 + seqEmp), statut: 'actif', congesPris: seqEmp * 2,
      contrat: {
        type: 'indetermine', dateDebut: dEmb, dateFin: null,
        nature: e.nature, lieuTravail: 'Siège d’OASIS, Port-au-Prince',
        heuresJour: 8, heuresSemaine: 48,
        horaire: 'Du lundi au vendredi, de 8 h à 16 h, et le samedi de 8 h à 12 h',
        salaire: e.sal, periodicite: 'mensuelle',
        avantages: '', clausesParticulieres: '',
        lieuSignature: 'Port-au-Prince', dateSignature: dEmb,
        statut: 'actif', majLe: new Date().toISOString()
      },
      ouvertLe: new Date().toISOString()
    });
  }

  /* --- Recrutement : deux offres ouvertes et trois candidatures --- */
  const dansUnMois = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  const offres = [
    { ref: 'OAS-REC-001', titre: 'Formateur en froid et climatisation', dep: 'Ateliers',
      type: 'determine', lieu: 'Port-au-Prince',
      description: 'Animer les modules pratiques de froid et climatisation, encadrer les travaux d’atelier et évaluer les apprenants selon le référentiel du centre.',
      profil: 'CAP ou BT en froid et climatisation, trois ans d’expérience sur installations domestiques et commerciales. Expérience de formation appréciée.',
      salaire: 'Entre 28 000 et 34 000 HTG selon profil' },
    { ref: 'OAS-REC-002', titre: 'Agent de recouvrement et accueil', dep: 'Administration',
      type: 'indetermine', lieu: 'Port-au-Prince',
      description: 'Accueillir les étudiants et les familles, suivre les échéanciers de frais de scolarité et relancer les impayés.',
      profil: 'Niveau Philo minimum, aisance relationnelle, maîtrise des outils bureautiques. La connaissance du créole et du français est exigée.',
      salaire: 'À partir de 20 000 HTG' }
  ];
  for (const o of offres) {
    db.postes.push({ id: rid('pos', 8), reference: o.ref, titre: o.titre, departement: o.dep,
      typeContrat: o.type, lieu: o.lieu, description: o.description, profil: o.profil,
      salaireIndicatif: o.salaire, dateLimite: dansUnMois, statut: 'ouvert',
      creeLe: new Date().toISOString(), creePar: 'usr_admin' });
  }
  const postulants = [
    { nom: 'Wisly Delva', tel: '+509 3311 7788', niveau: 'BT froid et climatisation',
      exp: 5, poste: 0, dispo: 'Immédiate', pretention: 32000, statut: 'preselection',
      lettre: 'Technicien frigoriste depuis cinq ans, j’ai encadré deux apprentis et je souhaite transmettre ce métier dans un cadre structuré.' },
    { nom: 'Guerline Saintil', tel: '+509 3644 2091', niveau: 'Licence en gestion',
      exp: 3, poste: 1, dispo: 'Sous quinzaine', pretention: 24000, statut: 'recue',
      lettre: 'Trois ans de suivi de recouvrement dans une coopérative de crédit, habituée aux relances et au contact direct avec les familles.' },
    { nom: 'Reginald Noël', tel: '+509 3877 5510', niveau: 'CAP électromécanique',
      exp: 2, poste: 0, dispo: 'Un mois', pretention: 29000, statut: 'recue',
      lettre: 'Formé en électromécanique, j’interviens depuis deux ans sur des unités de climatisation commerciales.' }
  ];
  for (const p of postulants) {
    db.candidaturesEmploi.push({
      id: rid('cde', 8), posteId: db.postes[p.poste].id, posteSouhaite: offres[p.poste].titre,
      nom: p.nom, email: p.nom.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z]/g, '.') + '@exemple.ht',
      telephone: p.tel, adresse: 'Port-au-Prince', niveauEtudes: p.niveau,
      experienceAnnees: p.exp, disponibilite: p.dispo, pretentionSalariale: p.pretention,
      lettre: p.lettre, cvUrl: null, statut: p.statut, decisions: [],
      recueLe: new Date(Date.now() - (p.exp * 86400000)).toISOString()
    });
  }

  /* --- Paie du mois précédent, validée et comptabilisée --- */
  const mPrec = new Date(); mPrec.setMonth(mPrec.getMonth() - 1);
  const periode = mPrec.toISOString().slice(0, 7);
  const copieParams = JSON.parse(JSON.stringify({ ...P,
    iri: P.iri.map(t => ({ jusqua: t.jusqua === Infinity ? null : t.jusqua, taux: t.taux })) }));
  for (const emp of db.employes) {
    const calcul = G.calculerPaie({ salaireBase: emp.salaireBase, params: P });
    const paie = { id: rid('pai', 8), employeId: emp.id, periode, calcul,
      parametresUtilises: copieParams, statut: 'validee',
      creeeLe: new Date().toISOString(), creeePar: 'usr_admin',
      valideeLe: new Date().toISOString(), valideePar: 'usr_admin' };
    const ofatma = Math.round((calcul.patronales.ofatmaMaladie + calcul.patronales.ofatmaAccident) * 100) / 100;
    ecrire('PA', periode + '-28', 'PAIE-' + periode + '-' + emp.matricule,
      'Paie ' + periode + ' — ' + emp.nom, [
        { compte: '641000', libelle: 'Salaire brut — ' + emp.nom, debit: calcul.brut, credit: 0 },
        { compte: '645100', libelle: 'ONA part employeur', debit: calcul.patronales.ona, credit: 0 },
        { compte: '645200', libelle: 'OFATMA part employeur', debit: ofatma, credit: 0 },
        { compte: '421000', libelle: 'Net à payer — ' + emp.nom, debit: 0, credit: calcul.net },
        { compte: '431000', libelle: 'ONA à verser', debit: 0,
          credit: Math.round((calcul.salariales.ona + calcul.patronales.ona) * 100) / 100 },
        { compte: '432000', libelle: 'OFATMA à verser', debit: 0, credit: ofatma },
        { compte: '442000', libelle: 'IRI retenu à la source', debit: 0, credit: calcul.iri }
      ], 'rh.paie', paie.id);
    paie.ecritureId = db.ecritures[db.ecritures.length - 1].id;
    db.paies.push(paie);
  }

  /* --- Charges de fonctionnement ---
     La subvention est encaissée en banque d'abord : les règlements qui
     suivent sont ainsi couverts, et aucun compte de trésorerie ne tombe
     en position créditrice.                                            */
  ecrire('BQ', periode + '-02', 'SUB-001', 'Subvention de fonctionnement',
    [{ compte: '512100', libelle: 'Virement reçu', debit: 150000, credit: 0 },
     { compte: '758000', libelle: 'Subvention annuelle', debit: 0, credit: 150000 }], 'saisie');
  ecrire('BQ', periode + '-05', 'LOY-' + periode, 'Loyer du centre de formation',
    [{ compte: '613000', libelle: 'Loyer mensuel', debit: 45000, credit: 0 },
     { compte: '512100', libelle: 'Virement au bailleur', debit: 0, credit: 45000 }], 'saisie');
  ecrire('CA', periode + '-12', 'ELE-' + periode, 'Électricité et carburant du groupe',
    [{ compte: '606100', libelle: 'EDH et carburant', debit: 12500, credit: 0 },
     { compte: '531000', libelle: 'Règlement en espèces', debit: 0, credit: 12500 }], 'saisie');
  ecrire('AC', periode + '-18', 'FAC-0087', 'Fournitures d’atelier électricité',
    [{ compte: '601000', libelle: 'Câbles, disjoncteurs, gaines', debit: 18400, credit: 0 },
     { compte: '401000', libelle: 'Quincaillerie Delmas', debit: 0, credit: 18400 }], 'saisie');

  /* --- Une demande de congé en attente d'arbitrage --- */
  const dansDeuxSemaines = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
  db.conges.push({ id: rid('cng', 8), employeId: db.employes[2].id, type: 'annuel',
    debut: dansDeuxSemaines, jours: 5, motif: 'Congé annuel — fête patronale',
    statut: 'demande', demandeLe: new Date().toISOString() });

  db.compteurs = { ['matricule_' + an]: seqEtu, ['matricule_emp_' + an]: seqEmp,
    ['recu_' + an]: seqRecu };
  for (const [j, n] of Object.entries(seqEcr)) db.compteurs['ecriture_' + j + '_' + an] = n;
}

/* ---------- Aides métier ---------- */
function format(id) { return FORMATS.find(f => f.id === id) || FORMATS[1]; }
function modalite(id) { return MODALITES.find(m => m.id === id) || MODALITES[0]; }
function blocSocle(id) { return SOCLE_TRANSVERSAL.find(b => b.id === id) || null; }
function categorie(id) { return CATEGORIES.find(c => c.id === id) || CATEGORIES[0]; }
function noteCours(courseId) {
  const list = get().avis.filter(a => a.courseId === courseId);
  if (!list.length) return { note: null, count: 0 };
  return { note: (list.reduce((s, a) => s + a.note, 0) / list.length).toFixed(1), count: list.length };
}
function nbInscrits(courseId) {
  return get().enrollments.filter(e => e.courseId === courseId).length;
}
/* Épreuves de l'évaluation finale (rétro-compatible : un ancien
   examenFinal.questions devient une épreuve QCM unique de poids 100). */
function epreuvesDe(c) {
  const ef = c.examenFinal || {};
  if (Array.isArray(ef.epreuves)) return ef.epreuves;
  if (Array.isArray(ef.questions) && ef.questions.length) {
    return [{ id: 'ep_qcm_' + c.id, type: 'qcm', titre: 'QCM final',
      consigne: 'Répondez à toutes les questions.', poids: 100, questions: ef.questions }];
  }
  return [];
}
const TYPES_EPREUVES = {
  qcm: { label: 'Quiz (QCM)', auto: true },
  trous: { label: 'Texte à trous', auto: true },
  reponse_elaboree: { label: 'Question à réponse élaborée', auto: false },
  exercice_pratique: { label: 'Exercice pratique', auto: false },
  presentation: { label: 'Présentation', auto: false },
  travail_commun: { label: 'Travail en commun', auto: false },
  projet_final: { label: 'Projet final', auto: false },
  stage_pratique: { label: 'Stage pratique en entreprise', auto: false }
};

function nbLecons(course) {
  return (course.modules || []).reduce((s, m) => s + m.lecons.length, 0);
}

module.exports = {
  init, get, save, audit, sequence, exerciceCourant, paramsPaie,
  CATEGORIES, FORMATS, MODALITES, SOCLE_TRANSVERSAL, PLANS, COMMISSION,
  categorie, format, modalite, blocSocle, noteCours, nbInscrits, nbLecons,
  epreuvesDe, TYPES_EPREUVES
};
