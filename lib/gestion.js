'use strict';
/* ============================================================
   OASIS — Noyau de gestion institutionnelle
   Comptabilité · Ressources humaines · Scolarité

   Chaque module suit les règles de sa discipline :

   COMPTABILITÉ — partie double. Toute écriture équilibre débit et
   crédit, s'impute sur un plan de comptes à sept classes, porte une
   pièce justificative et appartient à un exercice. Une écriture
   validée n'est jamais modifiée ni supprimée : elle se corrige par
   contre-passation. États produits : journal, grand livre, balance,
   compte de résultat et bilan.

   RESSOURCES HUMAINES — paie conforme au droit haïtien :
     · ONA (vieillesse)        6 % salarié + 6 % employeur
     · OFATMA maladie-maternité            3 % employeur
     · OFATMA accidents du travail         2 % (commerce et services)
     · IRI retenu à la source, barème progressif DGI par tranches
     · Boni de fin d'année et congés annuels suivis séparément
   Les taux sont PARAMÉTRABLES : ils évoluent par voie légale et
   doivent être confirmés auprès de l'ONA, de l'OFATMA et de la DGI.

   SCOLARITÉ — dossier étudiant unique à matricule pérenne,
   inscriptions par période, échéancier de frais, encaissements
   partiels, solde dû et états de recouvrement.
   ============================================================ */

/* ============ 1. COMPTABILITÉ ============ */

/** Plan de comptes : sept classes, structure décimale.
    Classes 1 à 5 = bilan · 6 et 7 = gestion. */
const CLASSES = [
  { num: '1', label: 'Comptes de capitaux',        nature: 'bilan',   sens: 'credit' },
  { num: '2', label: 'Immobilisations',            nature: 'bilan',   sens: 'debit'  },
  { num: '3', label: 'Stocks et en-cours',         nature: 'bilan',   sens: 'debit'  },
  { num: '4', label: 'Tiers',                      nature: 'bilan',   sens: 'mixte'  },
  { num: '5', label: 'Comptes financiers',         nature: 'bilan',   sens: 'debit'  },
  { num: '6', label: 'Charges',                    nature: 'gestion', sens: 'debit'  },
  { num: '7', label: 'Produits',                   nature: 'gestion', sens: 'credit' }
];

/** Plan de comptes de référence d'un centre de formation. */
const PLAN_COMPTABLE = [
  // 1 — Capitaux
  { num: '101000', label: 'Capital', classe: '1' },
  { num: '106000', label: 'Réserves', classe: '1' },
  { num: '120000', label: 'Résultat de l’exercice', classe: '1' },
  { num: '164000', label: 'Emprunts auprès des établissements de crédit', classe: '1' },
  // 2 — Immobilisations
  { num: '213000', label: 'Constructions et aménagements', classe: '2' },
  { num: '215000', label: 'Matériel et outillage d’atelier', classe: '2' },
  { num: '218300', label: 'Matériel informatique', classe: '2' },
  { num: '218400', label: 'Mobilier', classe: '2' },
  { num: '281000', label: 'Amortissements des immobilisations', classe: '2' },
  // 3 — Stocks
  { num: '321000', label: 'Fournitures et consommables d’atelier', classe: '3' },
  // 4 — Tiers
  { num: '401000', label: 'Fournisseurs', classe: '4' },
  { num: '411000', label: 'Étudiants — frais de scolarité', classe: '4' },
  { num: '421000', label: 'Personnel — rémunérations dues', classe: '4' },
  { num: '427000', label: 'Formateurs — honoraires et revenus dus', classe: '4' },
  { num: '431000', label: 'ONA — cotisations à verser', classe: '4' },
  { num: '432000', label: 'OFATMA — cotisations à verser', classe: '4' },
  { num: '442000', label: 'DGI — impôt sur le revenu retenu à la source', classe: '4' },
  { num: '445000', label: 'DGI — TCA à reverser', classe: '4' },
  // 5 — Financier
  { num: '512100', label: 'Banque — compte courant', classe: '5' },
  { num: '515000', label: 'Portefeuille mobile (MonCash / NatCash)', classe: '5' },
  { num: '531000', label: 'Caisse', classe: '5' },
  // 6 — Charges
  { num: '601000', label: 'Achats de fournitures pédagogiques', classe: '6' },
  { num: '606100', label: 'Électricité et carburant', classe: '6' },
  { num: '613000', label: 'Loyers et charges locatives', classe: '6' },
  { num: '615000', label: 'Entretien et réparations', classe: '6' },
  { num: '622000', label: 'Honoraires des formateurs', classe: '6' },
  { num: '626000', label: 'Télécommunications et internet', classe: '6' },
  { num: '627000', label: 'Frais bancaires et commissions de paiement', classe: '6' },
  { num: '641000', label: 'Salaires et appointements', classe: '6' },
  { num: '645100', label: 'Charges sociales — ONA (part employeur)', classe: '6' },
  { num: '645200', label: 'Charges sociales — OFATMA (part employeur)', classe: '6' },
  { num: '647000', label: 'Boni de fin d’année', classe: '6' },
  { num: '681000', label: 'Dotations aux amortissements', classe: '6' },
  // 7 — Produits
  { num: '706100', label: 'Frais de scolarité et d’inscription', classe: '7' },
  { num: '706200', label: 'Ventes de formations en ligne', classe: '7' },
  { num: '706300', label: 'Prestations aux entreprises', classe: '7' },
  { num: '708000', label: 'Produits annexes (certificats, duplicatas)', classe: '7' },
  { num: '758000', label: 'Subventions et dons', classe: '7' }
];

const classeDe = num => String(num || '').charAt(0);
const infoClasse = num => CLASSES.find(c => c.num === classeDe(num)) || null;
const estBilan = num => ['1', '2', '3', '4', '5'].includes(classeDe(num));
const estGestion = num => ['6', '7'].includes(classeDe(num));

/**
 * Contrôle de conformité d'une écriture avant enregistrement.
 * Règles : au moins deux lignes, montants positifs, comptes existants,
 * total débit = total crédit (partie double), date dans l'exercice.
 */
function validerEcriture(ecriture, plan, exercice) {
  const err = [];
  const lignes = Array.isArray(ecriture.lignes) ? ecriture.lignes : [];
  if (lignes.length < 2) err.push('Une écriture comporte au moins deux lignes (un débit et un crédit).');
  if (!ecriture.libelle || !String(ecriture.libelle).trim()) err.push('Le libellé est obligatoire.');
  if (!ecriture.piece || !String(ecriture.piece).trim()) err.push('La pièce justificative est obligatoire.');
  if (!ecriture.date) err.push('La date est obligatoire.');

  let debit = 0, credit = 0;
  for (const [i, l] of lignes.entries()) {
    const d = Math.round((Number(l.debit) || 0) * 100) / 100;
    const c = Math.round((Number(l.credit) || 0) * 100) / 100;
    if (d < 0 || c < 0) err.push(`Ligne ${i + 1} : les montants ne peuvent pas être négatifs.`);
    if (d > 0 && c > 0) err.push(`Ligne ${i + 1} : une ligne est soit au débit, soit au crédit.`);
    if (d === 0 && c === 0) err.push(`Ligne ${i + 1} : le montant est nul.`);
    if (!plan.some(p => p.num === l.compte)) err.push(`Ligne ${i + 1} : compte ${l.compte || '—'} absent du plan comptable.`);
    debit += d; credit += c;
  }
  debit = Math.round(debit * 100) / 100;
  credit = Math.round(credit * 100) / 100;
  if (debit !== credit) {
    err.push(`Écriture déséquilibrée : débit ${debit.toFixed(2)} ≠ crédit ${credit.toFixed(2)} (écart ${(debit - credit).toFixed(2)}).`);
  }
  if (exercice) {
    if (exercice.clos) err.push('L’exercice est clôturé : aucune écriture ne peut y être ajoutée.');
    else if (ecriture.date < exercice.debut || ecriture.date > exercice.fin) {
      err.push(`La date doit tomber dans l’exercice (${exercice.debut} au ${exercice.fin}).`);
    }
  }
  return { ok: err.length === 0, erreurs: err, debit, credit };
}

/** Contre-passation : écriture miroir qui annule une écriture validée. */
function contrePasser(ecriture, date, numero) {
  return {
    numero,
    date,
    journal: ecriture.journal,
    piece: 'EXT-' + ecriture.piece,
    libelle: 'Extourne — ' + ecriture.libelle,
    lignes: ecriture.lignes.map(l => ({ compte: l.compte, libelle: l.libelle,
      debit: l.credit || 0, credit: l.debit || 0 })),
    extourneDe: ecriture.numero,
    validee: true
  };
}

/** Grand livre : mouvements et solde par compte. */
function grandLivre(ecritures, plan, filtreCompte) {
  const comptes = {};
  for (const e of ecritures) {
    if (!e.validee) continue;
    for (const l of e.lignes) {
      if (filtreCompte && l.compte !== filtreCompte) continue;
      const c = comptes[l.compte] || (comptes[l.compte] = {
        num: l.compte,
        label: (plan.find(p => p.num === l.compte) || {}).label || '—',
        mouvements: [], debit: 0, credit: 0
      });
      c.debit += Number(l.debit) || 0;
      c.credit += Number(l.credit) || 0;
      c.mouvements.push({ date: e.date, piece: e.piece, numero: e.numero,
        libelle: l.libelle || e.libelle, debit: Number(l.debit) || 0, credit: Number(l.credit) || 0 });
    }
  }
  return Object.values(comptes).map(c => ({
    ...c,
    debit: Math.round(c.debit * 100) / 100,
    credit: Math.round(c.credit * 100) / 100,
    solde: Math.round((c.debit - c.credit) * 100) / 100
  })).sort((a, b) => a.num.localeCompare(b.num));
}

/** Balance générale : totaux et soldes, avec contrôle d'équilibre global. */
function balance(ecritures, plan) {
  const lignes = grandLivre(ecritures, plan).map(c => ({
    num: c.num, label: c.label, debit: c.debit, credit: c.credit,
    soldeDebiteur: c.solde > 0 ? c.solde : 0,
    soldeCrediteur: c.solde < 0 ? -c.solde : 0
  }));
  const t = lignes.reduce((a, l) => ({
    debit: a.debit + l.debit, credit: a.credit + l.credit,
    sd: a.sd + l.soldeDebiteur, sc: a.sc + l.soldeCrediteur
  }), { debit: 0, credit: 0, sd: 0, sc: 0 });
  const arr = n => Math.round(n * 100) / 100;
  return { lignes, totaux: { debit: arr(t.debit), credit: arr(t.credit), sd: arr(t.sd), sc: arr(t.sc) },
    equilibree: arr(t.debit) === arr(t.credit) && arr(t.sd) === arr(t.sc) };
}

/** Compte de résultat : produits (classe 7) moins charges (classe 6). */
function compteDeResultat(ecritures, plan) {
  const gl = grandLivre(ecritures, plan);
  const charges = gl.filter(c => classeDe(c.num) === '6')
    .map(c => ({ ...c, montant: Math.round((c.debit - c.credit) * 100) / 100 }));
  const produits = gl.filter(c => classeDe(c.num) === '7')
    .map(c => ({ ...c, montant: Math.round((c.credit - c.debit) * 100) / 100 }));
  const totalCharges = Math.round(charges.reduce((s, c) => s + c.montant, 0) * 100) / 100;
  const totalProduits = Math.round(produits.reduce((s, c) => s + c.montant, 0) * 100) / 100;
  return { charges, produits, totalCharges, totalProduits,
    resultat: Math.round((totalProduits - totalCharges) * 100) / 100 };
}

/** Bilan : actif (soldes débiteurs) et passif (soldes créditeurs), résultat inclus. */
function bilan(ecritures, plan) {
  const gl = grandLivre(ecritures, plan).filter(c => estBilan(c.num));
  const actif = gl.filter(c => c.solde > 0).map(c => ({ ...c, montant: c.solde }));
  const passif = gl.filter(c => c.solde < 0).map(c => ({ ...c, montant: -c.solde }));
  const res = compteDeResultat(ecritures, plan).resultat;
  const totalActif = Math.round(actif.reduce((s, c) => s + c.montant, 0) * 100) / 100;
  const totalPassif = Math.round((passif.reduce((s, c) => s + c.montant, 0) + res) * 100) / 100;
  return { actif, passif, resultat: res, totalActif, totalPassif,
    equilibre: Math.abs(totalActif - totalPassif) < 0.01 };
}

/* ============ 2. RESSOURCES HUMAINES ============ */

/**
 * Paramètres de paie — droit haïtien.
 * Sources : ONA (vieillesse), OFATMA (maladie-maternité et accidents du
 * travail), DGI (impôt sur le revenu). À confirmer chaque année : les
 * taux et le barème évoluent par voie légale.
 */
const PARAMS_PAIE = {
  ona: { salarie: 0.06, employeur: 0.06 },        // vieillesse
  ofatmaMaladie: { employeur: 0.03 },             // maladie-maternité
  ofatmaAccident: { employeur: 0.02 },            // commerce et services
  // Barème IRI annuel, en gourdes
  iri: [
    { jusqua: 120000, taux: 0 },
    { jusqua: 240000, taux: 0.10 },
    { jusqua: 480000, taux: 0.15 },
    { jusqua: 1000000, taux: 0.25 },
    { jusqua: Infinity, taux: 0.30 }
  ],
  congesAnnuelsJours: 15,        // acquis après un an de service
  boniMois: 1                     // boni de fin d'année : un mois de salaire
};

/** Impôt sur le revenu annuel, barème progressif par tranches. */
function iriAnnuel(baseAnnuelle, bareme) {
  const tranches = bareme || PARAMS_PAIE.iri;
  let reste = Math.max(0, baseAnnuelle), precedent = 0, impot = 0;
  const detail = [];
  for (const t of tranches) {
    const plafond = t.jusqua === Infinity ? Infinity : t.jusqua;
    const assiette = Math.max(0, Math.min(baseAnnuelle, plafond) - precedent);
    if (assiette > 0) {
      const part = assiette * t.taux;
      impot += part;
      detail.push({ de: precedent, a: plafond, taux: t.taux, assiette: Math.round(assiette * 100) / 100,
        impot: Math.round(part * 100) / 100 });
    }
    precedent = plafond;
    if (baseAnnuelle <= plafond) break;
  }
  return { impot: Math.round(impot * 100) / 100, detail };
}

/**
 * Bulletin de paie mensuel.
 * Ordre de calcul : brut → cotisations salariales → base imposable →
 * IRI mensualisé → net à payer. Les charges patronales sont calculées
 * à part : elles ne diminuent pas le net mais constituent le coût employeur.
 */
function calculerPaie({ salaireBase, primes = 0, avantages = 0, retenues = 0, params }) {
  const P = params || PARAMS_PAIE;
  const base = Math.round((Number(salaireBase) || 0) * 100) / 100;
  const prime = Math.round((Number(primes) || 0) * 100) / 100;
  const avantage = Math.round((Number(avantages) || 0) * 100) / 100;
  const brut = Math.round((base + prime + avantage) * 100) / 100;

  // Cotisations salariales
  const onaSalarie = Math.round(brut * P.ona.salarie * 100) / 100;
  const totalSalariales = onaSalarie;

  // Base imposable puis impôt mensualisé à partir du barème annuel
  const imposableMensuel = Math.round((brut - totalSalariales) * 100) / 100;
  const { impot: iriAn, detail } = iriAnnuel(imposableMensuel * 12, P.iri);
  const iriMensuel = Math.round((iriAn / 12) * 100) / 100;

  // Autres retenues (avances, prêts)
  const autres = Math.round((Number(retenues) || 0) * 100) / 100;
  const net = Math.round((brut - totalSalariales - iriMensuel - autres) * 100) / 100;

  // Charges patronales
  const onaEmployeur = Math.round(brut * P.ona.employeur * 100) / 100;
  const ofatmaMaladie = Math.round(brut * P.ofatmaMaladie.employeur * 100) / 100;
  const ofatmaAccident = Math.round(brut * P.ofatmaAccident.employeur * 100) / 100;
  const totalPatronales = Math.round((onaEmployeur + ofatmaMaladie + ofatmaAccident) * 100) / 100;

  return {
    base, prime, avantage, brut,
    salariales: { ona: onaSalarie, total: totalSalariales },
    imposable: imposableMensuel,
    iri: iriMensuel, iriAnnuelProjete: iriAn, iriDetail: detail,
    autresRetenues: autres,
    net,
    patronales: { ona: onaEmployeur, ofatmaMaladie, ofatmaAccident, total: totalPatronales },
    coutEmployeur: Math.round((brut + totalPatronales) * 100) / 100
  };
}

/**
 * Boni de fin d'année — Code du travail, art. 135 à 137.
 * Dû entre le 24 et le 31 décembre, quelle que soit la durée de l'emploi,
 * et au moins égal à 1/12 des salaires gagnés dans l'année. Le prorata par
 * mois de présence revient au même pour un salaire constant.
 */
function calculerBoni(salaireMensuel, moisTravailles, params) {
  const P = params || PARAMS_PAIE;
  const mois = Math.max(0, Math.min(12, Number(moisTravailles) || 0));
  const montant = Math.round((Number(salaireMensuel) || 0) * P.boniMois * (mois / 12) * 100) / 100;
  return { montant, mois, base: salaireMensuel };
}

/* ============ 2 bis. CONTRAT DE TRAVAIL ============ */

/** Durée normale du travail : 8 heures par jour, 48 heures par semaine. */
const DUREE_LEGALE = { heuresJour: 8, heuresSemaine: 48 };

const TYPES_CONTRAT = [
  { id: 'indetermine', label: 'Contrat à durée indéterminée', court: 'CDI', finRequise: false },
  { id: 'determine',   label: 'Contrat à durée déterminée',   court: 'CDD', finRequise: true },
  { id: 'prestation',  label: 'Contrat de prestation de service', court: 'Prestation', finRequise: true },
  { id: 'apprentissage', label: 'Contrat d’apprentissage',  court: 'Apprentissage', finRequise: true }
];

/**
 * Préavis de rupture — Code du travail, art. 44 et 45.
 * Le préavis n'est obligatoire qu'à partir de trois mois de service consécutifs.
 */
const PREAVIS = [
  { moisMin: 0,   moisMax: 3,        libelle: 'Aucun préavis obligatoire', jours: 0 },
  { moisMin: 3,   moisMax: 12,       libelle: '15 jours',  jours: 15 },
  { moisMin: 12,  moisMax: 36,       libelle: '1 mois',    jours: 30 },
  { moisMin: 36,  moisMax: 72,       libelle: '2 mois',    jours: 60 },
  { moisMin: 72,  moisMax: 120,      libelle: '3 mois',    jours: 90 },
  { moisMin: 120, moisMax: Infinity, libelle: '4 mois',    jours: 120 }
];

/** Ancienneté en mois révolus entre deux dates. */
function ancienneteMois(dateDebut, dateReference) {
  const d = new Date(dateDebut), r = new Date(dateReference || Date.now());
  if (isNaN(d) || isNaN(r)) return 0;
  let m = (r.getFullYear() - d.getFullYear()) * 12 + (r.getMonth() - d.getMonth());
  if (r.getDate() < d.getDate()) m--;
  return Math.max(0, m);
}

/** Préavis applicable à une ancienneté donnée. */
function preavisDu(dateEmbauche, dateReference) {
  const mois = ancienneteMois(dateEmbauche, dateReference);
  const t = PREAVIS.find(p => mois >= p.moisMin && mois < p.moisMax) || PREAVIS[PREAVIS.length - 1];
  return { mois, jours: t.jours, libelle: t.libelle,
    ancienneteLisible: mois < 12 ? mois + ' mois'
      : Math.floor(mois / 12) + ' an' + (mois >= 24 ? 's' : '') +
        (mois % 12 ? ' et ' + (mois % 12) + ' mois' : '') };
}

/**
 * Énonciations que doit contenir un contrat écrit — Code du travail, art. 22.
 * `champ` désigne la donnée du dossier employé ou du contrat qui la porte.
 */
const MENTIONS_CONTRAT = [
  { cle: 'identite',   label: 'Noms et prénoms des parties',        source: 'employe',  champ: 'nom' },
  { cle: 'nationalite', label: 'Nationalité',                       source: 'employe',  champ: 'nationalite' },
  { cle: 'naissance',  label: 'Âge (date de naissance)',            source: 'employe',  champ: 'naissance' },
  { cle: 'sexe',       label: 'Sexe',                               source: 'employe',  champ: 'sexe' },
  { cle: 'etatCivil',  label: 'État civil',                         source: 'employe',  champ: 'etatCivil' },
  { cle: 'profession', label: 'Profession',                         source: 'employe',  champ: 'poste' },
  { cle: 'cin',        label: 'Numéro de carte d’identité',    source: 'employe',  champ: 'cin' },
  { cle: 'livret',     label: 'Numéro du livret de travail',        source: 'employe',  champ: 'numeroLivret' },
  { cle: 'residence',  label: 'Résidence précise du salarié',       source: 'employe',  champ: 'adresse' },
  { cle: 'duree',      label: 'Durée et heures journalières de travail', source: 'contrat', champ: 'heuresJour' },
  { cle: 'nature',     label: 'Nature du travail',                  source: 'contrat',  champ: 'nature' },
  { cle: 'lieu',       label: 'Lieu d’exécution du travail',   source: 'contrat',  champ: 'lieuTravail' },
  { cle: 'salaire',    label: 'Salaire convenu',                    source: 'contrat',  champ: 'salaire' },
  { cle: 'lieuDate',   label: 'Lieu et date de conclusion',         source: 'contrat',  champ: 'lieuSignature' }
];

/**
 * Contrôle de complétude au regard de l'article 22.
 * Renvoie la liste des énonciations manquantes : un contrat incomplet
 * peut être préparé, mais ne devrait pas être signé en l'état.
 */
function verifierContrat(employe, contrat) {
  const e = employe || {}, c = contrat || {};
  const rempli = m => {
    const v = m.source === 'employe' ? e[m.champ] : c[m.champ];
    return v !== undefined && v !== null && String(v).trim() !== '' && v !== 0;
  };
  const manquants = MENTIONS_CONTRAT.filter(m => !rempli(m));
  const type = TYPES_CONTRAT.find(t => t.id === c.type);
  if (type && type.finRequise && !c.dateFin) {
    manquants.push({ cle: 'dateFin', label: 'Date de fin (contrat à terme)', source: 'contrat', champ: 'dateFin' });
  }
  return {
    complet: manquants.length === 0,
    manquants,
    fournies: MENTIONS_CONTRAT.length - manquants.filter(m => m.cle !== 'dateFin').length,
    total: MENTIONS_CONTRAT.length
  };
}

/** Droits à congés annuels acquis, au prorata de l'ancienneté. */
function droitsConges(dateEmbauche, dateReference, joursPris, params) {
  const P = params || PARAMS_PAIE;
  const emb = new Date(dateEmbauche), ref = new Date(dateReference || Date.now());
  if (isNaN(emb) || isNaN(ref)) return { acquis: 0, pris: 0, solde: 0, mois: 0 };
  const mois = Math.max(0, (ref.getFullYear() - emb.getFullYear()) * 12 + (ref.getMonth() - emb.getMonth()));
  const acquis = Math.floor((P.congesAnnuelsJours / 12) * mois * 10) / 10;
  const pris = Number(joursPris) || 0;
  return { acquis, pris, solde: Math.round((acquis - pris) * 10) / 10, mois };
}

/* ============ 3. SCOLARITÉ ============ */

/** Matricule étudiant : OAS-AAAA-NNNN, pérenne et lisible. */
function matricule(annee, sequence) {
  return 'OAS-' + annee + '-' + String(sequence).padStart(4, '0');
}

/** Échéancier : répartition d'un montant en N versements mensuels. */
function echeancier(montantTotal, nbVersements, dateDebut) {
  const total = Math.round((Number(montantTotal) || 0) * 100) / 100;
  const n = Math.max(1, Math.min(24, Number(nbVersements) || 1));
  const part = Math.floor((total / n) * 100) / 100;
  const lignes = [];
  const d0 = new Date(dateDebut || Date.now());
  for (let i = 0; i < n; i++) {
    const d = new Date(d0.getFullYear(), d0.getMonth() + i, d0.getDate());
    // Le dernier versement absorbe l'arrondi pour retomber sur le total exact
    const montant = i === n - 1 ? Math.round((total - part * (n - 1)) * 100) / 100 : part;
    lignes.push({ rang: i + 1, echeance: d.toISOString().slice(0, 10), montant, regle: 0 });
  }
  return lignes;
}

/** Situation financière d'un dossier : dû, réglé, solde, retard. */
function situationScolarite(dossier, aujourdhui) {
  const auj = (aujourdhui || new Date().toISOString().slice(0, 10));
  const lignes = dossier.echeancier || [];
  const du = Math.round(lignes.reduce((s, l) => s + (Number(l.montant) || 0), 0) * 100) / 100;
  const regle = Math.round(lignes.reduce((s, l) => s + (Number(l.regle) || 0), 0) * 100) / 100;
  const enRetard = lignes.filter(l => l.echeance < auj && (Number(l.regle) || 0) < (Number(l.montant) || 0));
  const montantRetard = Math.round(enRetard.reduce((s, l) =>
    s + ((Number(l.montant) || 0) - (Number(l.regle) || 0)), 0) * 100) / 100;
  return { du, regle, solde: Math.round((du - regle) * 100) / 100,
    enRetard: enRetard.length, montantRetard,
    statut: du === 0 ? 'sans_frais' : regle >= du ? 'solde' : montantRetard > 0 ? 'retard' : 'a_jour' };
}

module.exports = {
  // Comptabilité
  CLASSES, PLAN_COMPTABLE, classeDe, infoClasse, estBilan, estGestion,
  validerEcriture, contrePasser, grandLivre, balance, compteDeResultat, bilan,
  // Ressources humaines
  PARAMS_PAIE, iriAnnuel, calculerPaie, calculerBoni, droitsConges,
  // Contrat de travail
  DUREE_LEGALE, TYPES_CONTRAT, PREAVIS, MENTIONS_CONTRAT,
  ancienneteMois, preavisDu, verifierContrat,
  // Scolarité
  matricule, echeancier, situationScolarite
};
