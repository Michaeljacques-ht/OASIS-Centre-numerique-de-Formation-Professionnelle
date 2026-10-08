'use strict';
/* ============================================================
   OASIS — Vues de la gestion institutionnelle
   ============================================================ */
const { layout, avatarHtml } = require('./views');
const { esc, fmtHTG } = require('../lib/utils');
const G = require('../lib/gestion');

const MENU_G = [
  ['/gestion', '🏛️', 'Vue d’ensemble'],
  ['/gestion/etudiants', '🎓', 'Étudiants'],
  ['/gestion/recouvrement', '📑', 'Recouvrement'],
  ['/gestion/rh', '👔', 'Personnel'],
  ['/gestion/rh/recrutement', '📬', 'Recrutement'],
  ['/gestion/rh/paie', '💵', 'Paie'],
  ['/gestion/rh/conges', '🌴', 'Congés'],
  ['/gestion/compta', '📘', 'Comptabilité'],
  ['/gestion/compta/journal', '📝', 'Journal'],
  ['/gestion/compta/etats', '📊', 'États financiers'],
  ['/admin', '↩️', 'Tableau de bord administration']
];

function shell(title, user, active, content, flash) {
  const inner = `
  <div class="shell">
    <aside class="side sombre">
      <div class="qui">${avatarHtml(user.name, 'var(--orange)')}
        <span><b>${esc(user.name)}</b><small>Gestion institutionnelle</small></span></div>
      <nav>${MENU_G.map(([h, i, l]) =>
        `<a href="${h}" class="${h === active ? 'on' : ''}">${i} ${l}</a>`).join('')}</nav>
    </aside>
    <section>
      ${flash ? `<div class="alerte ok">${esc(flash)}</div>` : ''}
      ${content}
    </section>
  </div>`;
  return layout(title, inner, { user });
}

const stat = (val, lib, note) => `<div class="carte stat-carte">
  <span class="val">${val}</span><span class="lib">${esc(lib)}</span>
  ${note ? `<span class="aide" style="margin-top:0">${note}</span>` : ''}</div>`;

const n2 = v => (Math.round((Number(v) || 0) * 100) / 100)
  .toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pct = t => (Math.round((Number(t) || 0) * 10000) / 100).toFixed(2).replace(/\.00$/, '') + ' %';
const vide = (txt) => `<p class="aide" style="text-align:center;padding:26px 0;font-size:13.5px">${esc(txt)}</p>`;

const ETIQ_STATUT = {
  actif: ['b-vert', 'Actif'], suspendu: ['b-orange', 'Suspendu'],
  diplome: ['b-bleu', 'Diplômé'], abandon: ['b-gris', 'Abandon'],
  sorti: ['b-gris', 'Sorti'], solde: ['b-vert', 'Soldé'],
  a_jour: ['b-bleu', 'À jour'], retard: ['b-rouge', 'En retard'],
  sans_frais: ['b-gris', 'Sans frais'], brouillon: ['b-orange', 'Brouillon'],
  validee: ['b-vert', 'Validée'], demande: ['b-orange', 'En attente'],
  accorde: ['b-vert', 'Accordé'], refuse: ['b-rouge', 'Refusé']
};
const etiq = s => {
  const [cl, lb] = ETIQ_STATUT[s] || ['b-gris', s || '—'];
  return `<span class="badge ${cl}">${esc(lb)}</span>`;
};

/* =============== VUE D'ENSEMBLE =============== */
function tableauDeBord(user, d, flash) {
  const s = d.scolarite, r = d.rh, c = d.compta;
  return shell('Gestion de l’institution', user, '/gestion', `
  <h1>Gestion de l’institution</h1>
  <p class="sous">Scolarité, personnel et comptabilité d’OASIS — ${c.exercice
    ? 'exercice ' + esc(c.exercice.libelle) + ' (' + esc(c.exercice.debut) + ' au ' + esc(c.exercice.fin) + ')'
    : 'aucun exercice ouvert'}.</p>

  <h2 style="margin-top:26px">Scolarité</h2>
  <div class="grille g-stats">
    ${stat(s.actifs, 'Étudiants actifs', s.total + ' dossiers au total')}
    ${stat(fmtHTG(s.du), 'Frais facturés')}
    ${stat(fmtHTG(s.regle), 'Encaissé', s.du > 0 ? Math.round(s.regle / s.du * 100) + ' % du facturé' : '')}
    ${stat(fmtHTG(s.retard), 'Impayés échus', s.retard > 0
      ? '<a href="/gestion/recouvrement">Voir le recouvrement</a>' : 'Aucun retard')}
  </div>

  <h2 style="margin-top:26px">Ressources humaines</h2>
  <div class="grille g-stats">
    ${stat(r.actifs, 'Employés actifs', r.total + ' dossiers')}
    ${stat(fmtHTG(r.masse), 'Masse salariale brute', 'par mois')}
    ${stat(fmtHTG(r.cout), 'Coût employeur', 'charges patronales incluses')}
    ${stat(r.congesEnAttente, 'Congés à arbitrer', r.paiesMois + ' bulletin(s) ce mois')}
  </div>

  <h2 style="margin-top:26px">Comptabilité</h2>
  <div class="grille g-stats">
    ${stat(c.ecritures, 'Écritures de l’exercice',
      c.equilibree ? '<span style="color:var(--vert);font-weight:700">Balance équilibrée</span>'
                   : '<span style="color:#B02121;font-weight:700">Balance déséquilibrée</span>')}
    ${stat(fmtHTG(c.produits), 'Produits')}
    ${stat(fmtHTG(c.charges), 'Charges')}
    ${stat(`<span style="color:${c.resultat >= 0 ? 'var(--vert)' : '#B02121'}">${fmtHTG(c.resultat)}</span>`,
      c.resultat >= 0 ? 'Résultat (excédent)' : 'Résultat (déficit)')}
  </div>

  <div class="carte" style="margin-top:26px">
    <h2 style="margin-top:0">Comment les trois modules se répondent</h2>
    <p style="font-size:14px;color:var(--sourd);line-height:1.7">
      Une inscription facturée crée la créance sur l’étudiant et constate le produit.
      Un encaissement éteint cette créance et augmente la trésorerie. Une paie validée
      enregistre la charge de personnel, le net dû au salarié, les cotisations ONA et OFATMA
      et l’impôt retenu pour la DGI. Aucune de ces écritures n’est saisie à la main :
      elles naissent de l’opération elle-même, ce qui garantit que la comptabilité
      reflète l’activité réelle de l’institution.</p>
    <div class="grille g3" style="margin-top:14px">
      <a class="btn ligne petit" href="/gestion/etudiants/nouveau">Ouvrir un dossier étudiant</a>
      <a class="btn ligne petit" href="/gestion/rh/paie">Préparer la paie du mois</a>
      <a class="btn ligne petit" href="/gestion/compta/etats">Consulter les états financiers</a>
    </div>
  </div>`, flash);
}

/* =============== SCOLARITÉ =============== */
function listeEtudiants(user, list, f, stats, flash) {
  return shell('Étudiants', user, '/gestion/etudiants', `
  <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:16px;flex-wrap:wrap">
    <div><h1 style="margin-bottom:4px">Dossiers étudiants</h1>
      <p class="sous" style="margin:0">${stats.total} dossiers · ${stats.actifs} actifs ·
        ${stats.diplomes} diplômés · solde dû ${fmtHTG(stats.solde)}</p></div>
    <a class="btn" href="/gestion/etudiants/nouveau">➕ Nouveau dossier</a>
  </div>

  <form method="GET" class="panneau" style="margin:18px 0;display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end">
    <div style="flex:1;min-width:200px"><label>Rechercher</label>
      <input name="q" value="${esc(f.q)}" placeholder="Nom, matricule, téléphone…"></div>
    <div style="min-width:160px"><label>Statut</label>
      <select name="statut">${['', 'actif', 'suspendu', 'diplome', 'abandon'].map(s =>
        `<option value="${s}" ${f.st === s ? 'selected' : ''}>${s ? esc(ETIQ_STATUT[s][1]) : 'Tous'}</option>`).join('')}</select></div>
    <button class="btn petit">Filtrer</button>
  </form>

  <div class="carte" style="padding:6px 0">
    ${list.length ? `<table>
      <thead><tr><th>Matricule</th><th>Étudiant</th><th>Contact</th><th>Inscriptions</th>
        <th class="num">Facturé</th><th class="num">Solde dû</th><th>Situation</th><th>Dossier</th></tr></thead>
      <tbody>${list.map(e => `<tr>
        <td><code style="font-size:12.5px">${esc(e.matricule)}</code></td>
        <td><a href="/gestion/etudiant/${esc(e.id)}"><b>${esc(e.nomComplet)}</b></a>
          ${e.niveauScolaire ? `<br><small class="aide">${esc(e.niveauScolaire)}</small>` : ''}</td>
        <td><small>${esc(e.telephone || '—')}${e.email ? '<br>' + esc(e.email) : ''}</small></td>
        <td>${(e.inscriptions || []).length}</td>
        <td class="num">${fmtHTG(e.situation.du)}</td>
        <td class="num"><b${e.situation.solde > 0 ? ' style="color:#B02121"' : ''}>${fmtHTG(e.situation.solde)}</b></td>
        <td>${etiq(e.situation.statut)}</td>
        <td>${etiq(e.statut)}</td></tr>`).join('')}</tbody></table>`
      : vide('Aucun dossier ne correspond. Ouvrez un premier dossier pour commencer.')}
  </div>`, flash);
}

function formEtudiant(user, et, apprenants, flash) {
  return shell('Nouveau dossier étudiant', user, '/gestion/etudiants', `
  <h1>Ouvrir un dossier étudiant</h1>
  <p class="sous">Le matricule est attribué automatiquement et reste attaché au dossier pour toute sa durée.</p>
  <form method="POST" action="/gestion/etudiants/nouveau" class="carte">
    <h2 style="margin-top:0">Identité</h2>
    <div class="grille g2" style="gap:14px">
      <div><label>Prénom *</label><input name="prenom" maxlength="80" required></div>
      <div><label>Nom *</label><input name="nom" maxlength="80" required></div>
      <div><label>Sexe</label><select name="sexe">
        <option value="F">Féminin</option><option value="M">Masculin</option>
        <option value="autre">Non précisé</option></select></div>
      <div><label>Date de naissance</label><input name="naissance" type="date"></div>
      <div><label>Lieu de naissance</label><input name="lieuNaissance" maxlength="80"></div>
      <div><label>NIF / CIN</label><input name="nif" maxlength="30"></div>
    </div>

    <h2 style="margin-top:22px">Coordonnées</h2>
    <div class="grille g2" style="gap:14px">
      <div><label>Téléphone</label><input name="telephone" maxlength="30" placeholder="+509 ..."></div>
      <div><label>Courriel</label><input name="email" type="email" maxlength="120"></div>
    </div>
    <label>Adresse</label><input name="adresse" maxlength="200">

    <h2 style="margin-top:22px">Scolarité et responsable</h2>
    <div class="grille g2" style="gap:14px">
      <div><label>Dernier niveau atteint</label><input name="niveauScolaire" maxlength="80"
        placeholder="ex. Philo, 9e année, CAP électricité"></div>
      <div><label>Compte apprenant lié</label><select name="userId">
        <option value="">Aucun pour l’instant</option>
        ${apprenants.map(u => `<option value="${esc(u.id)}">${esc(u.name)} — ${esc(u.email)}</option>`).join('')}
      </select><div class="aide">Relie le dossier administratif au compte de l’apprenant sur la plateforme.</div></div>
      <div><label>Personne responsable</label><input name="tuteurNom" maxlength="100"></div>
      <div><label>Téléphone du responsable</label><input name="tuteurTel" maxlength="30"></div>
    </div>
    <button class="btn" style="margin-top:18px">Ouvrir le dossier</button>
    <a class="btn ligne" style="margin-top:18px;margin-left:8px" href="/gestion/etudiants">Annuler</a>
  </form>`, flash);
}

function ficheEtudiant(user, e, courses, flash) {
  const s = e.situation;
  const ech = (e.inscriptions || []).reduce((a, i) => a.concat(
    (i.echeancier || []).map(l => ({ ...l, intitule: i.intitule }))), [])
    .sort((x, y) => x.echeance.localeCompare(y.echeance));
  const auj = new Date().toISOString().slice(0, 10);
  const publiees = courses.filter(c => c.statut === 'publiee');

  return shell('Dossier ' + e.matricule, user, '/gestion/etudiants', `
  <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap">
    <div><h1 style="margin-bottom:4px">${esc(e.nomComplet)}</h1>
      <p class="sous" style="margin:0"><code>${esc(e.matricule)}</code> · dossier ${etiq(e.statut)}
        · situation ${etiq(s.statut)}</p></div>
    <a class="btn ligne petit" href="/gestion/etudiants">← Tous les dossiers</a>
  </div>

  <div class="grille g-stats" style="margin-top:20px">
    ${stat(fmtHTG(s.du), 'Frais facturés')}
    ${stat(fmtHTG(s.regle), 'Déjà réglé')}
    ${stat(`<span style="color:${s.solde > 0 ? '#B02121' : 'var(--vert)'}">${fmtHTG(s.solde)}</span>`, 'Solde dû')}
    ${stat(s.enRetard, 'Échéances échues', s.montantRetard > 0 ? fmtHTG(s.montantRetard) + ' en retard' : 'Aucune')}
  </div>

  <div class="grille" style="grid-template-columns:1.35fr .95fr;align-items:start;margin-top:22px">
    <div>
      <div class="carte" style="padding:6px 0">
        <h2 style="padding:16px 22px 6px;margin:0">Échéancier</h2>
        ${ech.length ? `<table><thead><tr><th>Échéance</th><th>Formation</th>
          <th class="num">Dû</th><th class="num">Réglé</th><th class="num">Reste</th><th></th></tr></thead>
          <tbody>${ech.map(l => {
            const reste = Math.round(((l.montant || 0) - (l.regle || 0)) * 100) / 100;
            const retard = reste > 0 && l.echeance < auj;
            return `<tr${retard ? ' style="background:#FDF4F4"' : ''}>
              <td>${esc(l.echeance)}</td><td><small>${esc(l.intitule)}</small></td>
              <td class="num">${fmtHTG(l.montant)}</td><td class="num">${fmtHTG(l.regle || 0)}</td>
              <td class="num">${reste > 0 ? fmtHTG(reste) : '—'}</td>
              <td>${reste <= 0 ? '<span class="badge b-vert">Réglée</span>'
                : retard ? '<span class="badge b-rouge">Échue</span>' : '<span class="badge b-gris">À venir</span>'}</td></tr>`;
          }).join('')}</tbody></table>` : vide('Aucun frais facturé sur ce dossier.')}
      </div>

      <div class="carte" style="margin-top:18px;padding:6px 0">
        <h2 style="padding:16px 22px 6px;margin:0">Reçus émis</h2>
        ${(e.paiements || []).length ? `<table><thead><tr><th>Reçu</th><th>Date</th>
          <th>Mode</th><th class="num">Montant</th></tr></thead>
          <tbody>${e.paiements.slice().reverse().map(p => `<tr>
            <td><code style="font-size:12.5px">${esc(p.recu)}</code></td><td>${esc(p.date)}</td>
            <td><span class="badge b-bleu">${esc(p.mode)}</span></td>
            <td class="num"><b>${fmtHTG(p.montant)}</b></td></tr>`).join('')}</tbody></table>`
          : vide('Aucun encaissement enregistré.')}
      </div>
    </div>

    <div>
      <div class="carte">
        <h2 style="margin-top:0">Encaisser un règlement</h2>
        <p class="aide" style="margin-bottom:12px">Le montant s’impute automatiquement sur les
          échéances les plus anciennes et génère son écriture comptable.</p>
        <form method="POST" action="/gestion/etudiant/${esc(e.id)}/encaisser">
          <label>Montant (HTG) — solde dû ${fmtHTG(s.solde)}</label>
          <input name="montant" type="number" step="0.01" min="0.01" max="${s.solde}" required
            ${s.solde <= 0 ? 'disabled' : ''}>
          <label>Date</label><input name="date" type="date" value="${auj}">
          <label>Mode de règlement</label>
          <select name="mode"><option value="caisse">Espèces (caisse)</option>
            <option value="moncash">MonCash</option><option value="natcash">NatCash</option>
            <option value="banque">Virement ou chèque bancaire</option></select>
          <label>Note</label><input name="note" maxlength="200">
          <button class="btn vert" style="margin-top:14px;width:100%"
            ${s.solde <= 0 ? 'disabled' : ''}>Encaisser et comptabiliser</button>
        </form>
      </div>

      <div class="carte" style="margin-top:18px">
        <h2 style="margin-top:0">Inscrire à une formation</h2>
        <form method="POST" action="/gestion/etudiant/${esc(e.id)}/inscrire">
          <label>Formation</label>
          <select name="courseId"><option value="">— Intitulé libre —</option>
            ${publiees.map(c => `<option value="${esc(c.id)}">${esc(c.titre)}</option>`).join('')}</select>
          <label>Intitulé libre (si hors catalogue)</label><input name="intitule" maxlength="140">
          <label>Période</label><input name="periode" maxlength="40" value="${new Date().getFullYear()}">
          <label>Frais totaux (HTG) — 0 pour une formation gratuite</label>
          <input name="frais" type="number" step="0.01" min="0" value="0">
          <label>Nombre de versements</label><input name="versements" type="number" min="1" max="24" value="1">
          <label>Première échéance</label><input name="debut" type="date" value="${auj}">
          <button class="btn" style="margin-top:14px;width:100%">Inscrire et facturer</button>
        </form>
      </div>

      <div class="carte" style="margin-top:18px">
        <h2 style="margin-top:0">Statut du dossier</h2>
        <form method="POST" action="/gestion/etudiant/${esc(e.id)}/statut">
          <select name="statut">${['actif', 'suspendu', 'diplome', 'abandon'].map(x =>
            `<option value="${x}" ${e.statut === x ? 'selected' : ''}>${esc(ETIQ_STATUT[x][1])}</option>`).join('')}</select>
          <label>Motif</label><input name="motif" maxlength="200" value="${esc(e.statutMotif || '')}">
          <button class="btn ligne petit" style="margin-top:12px;width:100%">Mettre à jour</button>
        </form>
      </div>

      <div class="panneau" style="margin-top:18px;font-size:13px;line-height:1.75">
        <b>Identité</b><br>
        ${e.naissance ? 'Né(e) le ' + esc(e.naissance) + (e.lieuNaissance ? ' à ' + esc(e.lieuNaissance) : '') + '<br>' : ''}
        ${e.telephone ? '☎ ' + esc(e.telephone) + '<br>' : ''}
        ${e.email ? '✉ ' + esc(e.email) + '<br>' : ''}
        ${e.adresse ? '📍 ' + esc(e.adresse) + '<br>' : ''}
        ${e.niveauScolaire ? '🎓 ' + esc(e.niveauScolaire) + '<br>' : ''}
        ${e.tuteurNom ? '<br><b>Responsable</b><br>' + esc(e.tuteurNom) +
          (e.tuteurTel ? ' — ' + esc(e.tuteurTel) : '') : ''}
      </div>
    </div>
  </div>`, flash);
}

function recouvrement(user, list, stats, flash) {
  const tranche = j => j > 90 ? ['b-rouge', 'plus de 90 jours'] : j > 60 ? ['b-rouge', '61 à 90 jours']
    : j > 30 ? ['b-orange', '31 à 60 jours'] : ['b-bleu', '1 à 30 jours'];
  return shell('Recouvrement', user, '/gestion/recouvrement', `
  <h1>État de recouvrement</h1>
  <p class="sous">Échéances dépassées, classées par ancienneté de la plus ancienne impayée.</p>
  <div class="grille g3" style="margin-top:18px">
    ${stat(list.length, 'Dossiers en retard')}
    ${stat(fmtHTG(stats.retard), 'Montant échu impayé')}
    ${stat(fmtHTG(stats.solde), 'Solde total dû', 'échéances à venir incluses')}
  </div>
  <div class="carte" style="margin-top:20px;padding:6px 0">
    ${list.length ? `<table><thead><tr><th>Matricule</th><th>Étudiant</th><th>Contact</th>
      <th class="num">Échues</th><th class="num">Montant échu</th><th>Ancienneté</th><th></th></tr></thead>
      <tbody>${list.map(e => { const [cl, lb] = tranche(e.anciennete); return `<tr>
        <td><code style="font-size:12.5px">${esc(e.matricule)}</code></td>
        <td><a href="/gestion/etudiant/${esc(e.id)}"><b>${esc(e.nomComplet)}</b></a></td>
        <td><small>${esc(e.telephone || '—')}</small></td>
        <td class="num">${e.situation.enRetard}</td>
        <td class="num"><b style="color:#B02121">${fmtHTG(e.situation.montantRetard)}</b></td>
        <td><span class="badge ${cl}">${lb}</span><br><small class="aide">depuis ${esc(e.retards[0].echeance)}</small></td>
        <td><a class="btn ligne petit" href="/gestion/etudiant/${esc(e.id)}">Dossier</a></td></tr>`; }).join('')}
      </tbody></table>` : vide('Aucune échéance en retard. Tous les dossiers sont à jour.')}
  </div>`, flash);
}

/* =============== RESSOURCES HUMAINES =============== */
function listeEmployes(user, list, stats, flash) {
  return shell('Personnel', user, '/gestion/rh', `
  <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:16px;flex-wrap:wrap">
    <div><h1 style="margin-bottom:4px">Dossiers du personnel</h1>
      <p class="sous" style="margin:0">${stats.actifs} employés actifs sur ${stats.total} dossiers</p></div>
    <a class="btn" href="/gestion/rh/nouveau">➕ Nouveau dossier</a>
  </div>
  <div class="grille g-stats" style="margin-top:18px">
    ${stat(stats.actifs, 'Employés actifs')}
    ${stat(fmtHTG(stats.masse), 'Masse salariale brute', 'par mois')}
    ${stat(fmtHTG(stats.cout), 'Coût employeur mensuel', 'ONA et OFATMA inclus')}
    ${stat(stats.congesEnAttente, 'Congés à arbitrer')}
  </div>
  <div class="carte" style="margin-top:20px;padding:6px 0">
    ${list.length ? `<table><thead><tr><th>Matricule</th><th>Employé</th><th>Poste</th><th>Contrat</th>
      <th class="num">Brut</th><th class="num">Net estimé</th><th class="num">Congés</th><th>Statut</th></tr></thead>
      <tbody>${list.map(e => `<tr>
        <td><code style="font-size:12.5px">${esc(e.matricule)}</code></td>
        <td><a href="/gestion/rh/employe/${esc(e.id)}"><b>${esc(e.nom)}</b></a>
          <br><small class="aide">depuis ${esc(e.dateEmbauche)}</small></td>
        <td>${esc(e.poste || '—')}${e.departement ? `<br><small class="aide">${esc(e.departement)}</small>` : ''}</td>
        <td><span class="badge b-gris">${esc(contratCourt(e.typeContrat))}</span></td>
        <td class="num">${fmtHTG(e.salaireBase)}</td>
        <td class="num"><b>${fmtHTG(e.paie.net)}</b></td>
        <td class="num">${e.conges.solde} j</td>
        <td>${etiq(e.statut)}</td></tr>`).join('')}</tbody></table>`
      : vide('Aucun dossier du personnel. Créez un premier dossier.')}
  </div>`, flash);
}

function formEmploye(user, emp, flash, pre) {
  const p = pre || {};
  const v = (k, def) => esc(p[k] !== undefined && p[k] !== '' ? p[k] : (def || ''));
  const sel = (k, val) => p[k] === val ? 'selected' : '';
  return shell('Nouveau dossier employé', user, '/gestion/rh', `
  <h1>Créer un dossier du personnel</h1>
  <p class="sous">Les champs marqués <b>art. 22</b> sont les énonciations que doit contenir
    un contrat de travail écrit. Les renseigner maintenant évite de revenir dessus au moment de rédiger le contrat.</p>
  ${p.depuis ? `<div class="alerte ok">Dossier pré-rempli à partir de la candidature
    de <b>${esc(p.depuis)}</b>. Vérifiez et complétez avant d’enregistrer.</div>` : ''}
  <form method="POST" action="/gestion/rh/nouveau" class="carte">
    ${p.candidatureId ? `<input type="hidden" name="candidatureId" value="${esc(p.candidatureId)}">` : ''}
    <h2 style="margin-top:0">Identité <small class="aide" style="font-weight:500">art. 22</small></h2>
    <div class="grille g2" style="gap:14px">
      <div><label>Nom complet *</label><input name="nom" maxlength="100" required value="${v('nom')}"></div>
      <div><label>Nationalité</label><input name="nationalite" maxlength="60"
        value="${v('nationalite', 'Haïtienne')}"></div>
      <div><label>Date de naissance</label><input name="naissance" type="date" value="${v('naissance')}"></div>
      <div><label>Sexe</label><select name="sexe"><option value="">—</option>
        <option value="F" ${sel('sexe', 'F')}>Féminin</option>
        <option value="M" ${sel('sexe', 'M')}>Masculin</option>
        <option value="autre" ${sel('sexe', 'autre')}>Non précisé</option></select></div>
      <div><label>État civil</label><select name="etatCivil"><option value="">—</option>
        ${Object.entries(ETAT_CIVIL).map(([id, lb]) =>
          `<option value="${id}" ${sel('etatCivil', id)}>${esc(lb)}</option>`).join('')}</select></div>
      <div><label>Résidence précise</label><input name="adresse" maxlength="200" value="${v('adresse')}"></div>
      <div><label>Téléphone</label><input name="telephone" maxlength="30" value="${v('telephone')}"></div>
      <div><label>Courriel</label><input name="email" type="email" maxlength="120" value="${v('email')}"></div>
    </div>

    <h2 style="margin-top:22px">Poste et engagement</h2>
    <div class="grille g2" style="gap:14px">
      <div><label>Poste (profession)</label><input name="poste" maxlength="100" value="${v('poste')}"
        placeholder="ex. Coordonnateur pédagogique"></div>
      <div><label>Département</label><input name="departement" maxlength="80" value="${v('departement')}"
        placeholder="ex. Pédagogie, Administration, Ateliers"></div>
      <div><label>Type de contrat</label><select name="typeContrat">
        <option value="indetermine" ${sel('typeContrat', 'indetermine')}>Durée indéterminée</option>
        <option value="determine" ${sel('typeContrat', 'determine')}>Durée déterminée</option>
        <option value="prestation" ${sel('typeContrat', 'prestation')}>Prestation de service</option>
        <option value="apprentissage" ${sel('typeContrat', 'apprentissage')}>Apprentissage</option></select></div>
      <div><label>Date d’embauche</label><input name="dateEmbauche" type="date"
        value="${new Date().toISOString().slice(0, 10)}"></div>
      <div><label>Fin de contrat (si à terme)</label><input name="dateFin" type="date"></div>
      <div><label>Salaire de base mensuel (HTG)</label>
        <input name="salaireBase" type="number" step="0.01" min="0" required value="${v('salaireBase')}"></div>
    </div>

    <h2 style="margin-top:22px">Identifiants légaux</h2>
    <div class="grille g2" style="gap:14px">
      <div><label>Carte d’identité (CIN) <small class="aide" style="font-weight:500">art. 22</small></label>
        <input name="cin" maxlength="40"></div>
      <div><label>Livret de travail <small class="aide" style="font-weight:500">art. 22</small></label>
        <input name="numeroLivret" maxlength="40"></div>
      <div><label>NIF</label><input name="nif" maxlength="30"></div>
      <div><label>Numéro ONA</label><input name="numeroOna" maxlength="30"></div>
      <div><label>Personne à contacter en urgence</label><input name="urgenceNom" maxlength="100"></div>
      <div><label>Téléphone d’urgence</label><input name="urgenceTel" maxlength="30"></div>
    </div>
    <button class="btn" style="margin-top:18px">Créer le dossier</button>
    <a class="btn ligne" style="margin-top:18px;margin-left:8px" href="/gestion/rh">Annuler</a>
  </form>`, flash);
}

function ficheEmploye(user, e, d, flash) {
  const c = d.simulation;
  return shell('Dossier ' + e.matricule, user, '/gestion/rh', `
  <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap">
    <div><h1 style="margin-bottom:4px">${esc(e.nom)}</h1>
      <p class="sous" style="margin:0"><code>${esc(e.matricule)}</code> ·
        ${esc(e.poste || 'Poste non précisé')} · ${etiq(e.statut)}</p></div>
    <a class="btn ligne petit" href="/gestion/rh">← Tout le personnel</a>
  </div>

  <div class="grille" style="grid-template-columns:1.1fr 1fr;align-items:start;margin-top:20px">
    <div class="carte">
      <h2 style="margin-top:0">Décomposition de la paie mensuelle</h2>
      <table style="font-size:13.5px">
        <tbody>
          <tr><td>Salaire de base</td><td class="num">${n2(c.base)}</td></tr>
          <tr><td><b>Salaire brut</b></td><td class="num"><b>${n2(c.brut)}</b></td></tr>
          <tr><td colspan="2" style="padding-top:16px;color:var(--sourd);font-size:11.5px;
            text-transform:uppercase;letter-spacing:.08em;font-weight:700">Retenues salariales</td></tr>
          <tr><td>ONA, part salariale</td><td class="num">− ${n2(c.salariales.ona)}</td></tr>
          <tr><td>Impôt sur le revenu retenu</td><td class="num">− ${n2(c.iri)}</td></tr>
          <tr><td><b>Net à payer</b></td><td class="num"><b style="color:var(--vert)">${n2(c.net)}</b></td></tr>
          <tr><td colspan="2" style="padding-top:16px;color:var(--sourd);font-size:11.5px;
            text-transform:uppercase;letter-spacing:.08em;font-weight:700">Charges patronales</td></tr>
          <tr><td>ONA, part employeur</td><td class="num">${n2(c.patronales.ona)}</td></tr>
          <tr><td>OFATMA maladie-maternité</td><td class="num">${n2(c.patronales.ofatmaMaladie)}</td></tr>
          <tr><td>OFATMA accidents du travail</td><td class="num">${n2(c.patronales.ofatmaAccident)}</td></tr>
          <tr><td><b>Coût total employeur</b></td><td class="num"><b>${n2(c.coutEmployeur)}</b></td></tr>
        </tbody></table>
      <p class="aide">Simulation au salaire actuel et aux taux en vigueur dans les paramètres.
        L’impôt est calculé sur la base annualisée puis ramené au mois.</p>
    </div>

    <div>
      <div class="carte">
        <h2 style="margin-top:0">Congés et boni</h2>
        <div class="grille g-stats" style="grid-template-columns:repeat(3,1fr);gap:10px">
          ${stat(d.conges.acquis + ' j', 'Acquis', d.conges.mois + ' mois')}
          ${stat(d.conges.pris + ' j', 'Pris')}
          ${stat(`<span style="color:var(--vert)">${d.conges.solde} j</span>`, 'Solde')}
        </div>
        <p style="margin-top:14px;font-size:13.5px">Boni de fin d’année estimé :
          <b>${fmtHTG(d.boni.montant)}</b> <small class="aide">(${d.boni.mois} mois de présence
          sur l’année)</small></p>
      </div>

      <div class="carte" style="margin-top:18px;border-left:4px solid var(--bleu)">
        <h2 style="margin-top:0">Contrat de travail</h2>
        ${(() => {
          const c = e.contrat;
          if (!c) return `<p class="aide" style="margin-bottom:12px">Aucun contrat n’a encore
            été rédigé pour cet employé.</p>
            <a class="btn" style="width:100%;text-align:center"
              href="/gestion/rh/employe/${esc(e.id)}/contrat">Rédiger le contrat</a>`;
          const k = d.controleContrat;
          return `<p style="font-size:14px;margin:0 0 10px">
            ${esc((d.typeContrat || {}).label || c.type)}
            ${c.statut === 'actif' ? '<span class="badge b-vert">Actif</span>'
              : '<span class="badge b-orange">Brouillon</span>'}<br>
            <small class="aide">Du ${esc(c.dateDebut || '—')}${c.dateFin ? ' au ' + esc(c.dateFin) : ', sans terme'}
              · ${c.heuresSemaine || 48} h par semaine</small></p>
          ${k && !k.complet ? `<p class="aide" style="color:#8A5200;font-weight:700">
            ${k.manquants.length} énonciation(s) de l’article 22 à compléter.</p>` : ''}
          <p style="font-size:13.5px;margin:10px 0 12px">Préavis dû aujourd’hui :
            <b>${esc((d.preavis || {}).libelle || '—')}</b>
            <small class="aide">(ancienneté ${esc((d.preavis || {}).ancienneteLisible || '—')})</small></p>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <a class="btn petit" href="/gestion/rh/employe/${esc(e.id)}/contrat/document">Voir le contrat</a>
            <a class="btn ligne petit" href="/gestion/rh/employe/${esc(e.id)}/contrat">Modifier</a>
          </div>`;
        })()}
      </div>

      <div class="carte" style="margin-top:18px">
        <h2 style="margin-top:0">Modifier le dossier</h2>
        <form method="POST" action="/gestion/rh/employe/${esc(e.id)}/modifier">
          <div class="grille g2" style="gap:12px">
            <div><label>Poste</label><input name="poste" value="${esc(e.poste || '')}" maxlength="100"></div>
            <div><label>Département</label><input name="departement" value="${esc(e.departement || '')}" maxlength="80"></div>
            <div><label>Salaire de base (HTG)</label>
              <input name="salaireBase" type="number" step="0.01" min="0" value="${e.salaireBase}"></div>
            <div><label>Statut</label><select name="statut">${['actif', 'suspendu', 'sorti'].map(s =>
              `<option value="${s}" ${e.statut === s ? 'selected' : ''}>${esc(ETIQ_STATUT[s][1])}</option>`).join('')}</select></div>
            <div><label>Téléphone</label><input name="telephone" value="${esc(e.telephone || '')}" maxlength="30"></div>
            <div><label>Courriel</label><input name="email" value="${esc(e.email || '')}" maxlength="120"></div>
            <div><label>NIF</label><input name="nif" value="${esc(e.nif || '')}" maxlength="30"></div>
            <div><label>Numéro ONA</label><input name="numeroOna" value="${esc(e.numeroOna || '')}" maxlength="30"></div>
          </div>
          <button class="btn petit" style="margin-top:14px">Enregistrer</button>
        </form>
        ${(e.historiqueSalaire || []).length ? `<p class="aide" style="margin-top:12px">
          <b>Historique salarial :</b> ${e.historiqueSalaire.slice(-4).map(h =>
            esc(h.le.slice(0, 10)) + ' : ' + fmtHTG(h.de) + ' → ' + fmtHTG(h.a)).join(' · ')}</p>` : ''}
      </div>
    </div>
  </div>

  <div class="carte" style="margin-top:20px;padding:6px 0">
    <h2 style="padding:16px 22px 6px;margin:0">Bulletins de paie</h2>
    ${d.bulletins.length ? `<table><thead><tr><th>Période</th><th class="num">Brut</th>
      <th class="num">Retenues</th><th class="num">Net</th><th>Statut</th><th></th></tr></thead>
      <tbody>${d.bulletins.map(p => `<tr>
        <td><b>${esc(p.periode)}</b></td>
        <td class="num">${fmtHTG(p.calcul.brut)}</td>
        <td class="num">${fmtHTG(p.calcul.salariales.total + p.calcul.iri + p.calcul.autresRetenues)}</td>
        <td class="num"><b>${fmtHTG(p.calcul.net)}</b></td>
        <td>${etiq(p.statut)}</td>
        <td><a class="btn ligne petit" href="/gestion/rh/bulletin/${esc(p.id)}">Bulletin</a></td></tr>`).join('')}
      </tbody></table>` : vide('Aucun bulletin émis pour cet employé.')}
  </div>`, flash);
}

function pagePaie(user, d, flash) {
  const t = d.totaux;
  return shell('Paie — ' + d.periodeLisible, user, '/gestion/rh/paie', `
  <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:16px;flex-wrap:wrap">
    <div><h1 style="margin-bottom:4px">Paie de ${esc(d.periodeLisible)}</h1>
      <p class="sous" style="margin:0">${d.bulletins.length} bulletin(s) ·
        ${d.aPreparer.length} employé(s) encore sans bulletin</p></div>
    <form method="GET" style="display:flex;gap:8px;align-items:flex-end">
      <div><label>Période</label><input name="periode" type="month" value="${esc(d.periode)}"></div>
      <button class="btn ligne petit">Changer</button>
    </form>
  </div>

  ${d.bulletins.length ? `<div class="grille g-stats" style="margin-top:18px">
    ${stat(fmtHTG(t.brut), 'Total brut')}
    ${stat(fmtHTG(t.net), 'Total net à payer')}
    ${stat(fmtHTG(t.cotisations), 'Cotisations ONA + OFATMA')}
    ${stat(fmtHTG(t.iri), 'IRI à reverser à la DGI')}
  </div>` : ''}

  ${d.aPreparer.length ? `<div class="carte" style="margin-top:20px">
    <h2 style="margin-top:0">Préparer les bulletins manquants</h2>
    <p class="aide" style="margin-bottom:14px">Renseignez primes et retenues éventuelles, puis
      générez les bulletins en brouillon. Rien n’est comptabilisé avant la validation.</p>
    <form method="POST" action="/gestion/rh/paie">
      <input type="hidden" name="periode" value="${esc(d.periode)}">
      <table><thead><tr><th>Employé</th><th class="num">Salaire de base</th>
        <th>Primes (HTG)</th><th>Autres retenues (HTG)</th></tr></thead>
        <tbody>${d.aPreparer.map(e => `<tr>
          <td><b>${esc(e.nom)}</b><br><small class="aide">${esc(e.poste || '—')}</small></td>
          <td class="num">${fmtHTG(e.salaireBase)}</td>
          <td><input name="prime_${esc(e.id)}" type="number" step="0.01" min="0" value="0" style="max-width:130px"></td>
          <td><input name="retenue_${esc(e.id)}" type="number" step="0.01" min="0" value="0" style="max-width:130px"></td>
        </tr>`).join('')}</tbody></table>
      <button class="btn" style="margin-top:16px">Générer ${d.aPreparer.length} bulletin(s)</button>
    </form>
  </div>` : ''}

  <div class="carte" style="margin-top:20px;padding:6px 0">
    <h2 style="padding:16px 22px 6px;margin:0">Bulletins de la période</h2>
    ${d.bulletins.length ? `<table><thead><tr><th>Employé</th><th class="num">Brut</th>
      <th class="num">ONA</th><th class="num">IRI</th><th class="num">Net</th>
      <th class="num">Coût employeur</th><th>Statut</th><th></th></tr></thead>
      <tbody>${d.bulletins.map(b => `<tr>
        <td><a href="/gestion/rh/employe/${esc(b.employeId)}"><b>${esc(b.employe.nom)}</b></a>
          <br><small class="aide">${esc(b.employe.matricule)}</small></td>
        <td class="num">${fmtHTG(b.calcul.brut)}</td>
        <td class="num">${fmtHTG(b.calcul.salariales.ona)}</td>
        <td class="num">${fmtHTG(b.calcul.iri)}</td>
        <td class="num"><b>${fmtHTG(b.calcul.net)}</b></td>
        <td class="num">${fmtHTG(b.calcul.coutEmployeur)}</td>
        <td>${etiq(b.statut)}${b.ecritureId ? '<br><small class="aide">comptabilisé</small>' : ''}</td>
        <td style="white-space:nowrap">
          <a class="btn ligne petit" href="/gestion/rh/bulletin/${esc(b.id)}">Voir</a>
          ${b.statut === 'brouillon' ? `
            <form method="POST" action="/gestion/rh/bulletin/${esc(b.id)}/valider" style="display:inline">
              <button class="btn vert petit">Valider</button></form>
            <form method="POST" action="/gestion/rh/bulletin/${esc(b.id)}/supprimer" style="display:inline">
              <button class="btn ligne petit">Retirer</button></form>` : ''}
        </td></tr>`).join('')}</tbody></table>`
      : vide('Aucun bulletin pour cette période.')}
  </div>

  <div class="panneau" style="margin-top:18px;font-size:13px;line-height:1.7">
    <b>Taux appliqués</b> — ONA ${pct(d.params.ona.salarie)} salarié et ${pct(d.params.ona.employeur)} employeur ·
    OFATMA maladie-maternité ${pct(d.params.ofatmaMaladie.employeur)} ·
    OFATMA accidents du travail ${pct(d.params.ofatmaAccident.employeur)} ·
    impôt sur le revenu au barème progressif.
    <a href="/gestion/rh/parametres">Modifier les paramètres</a>.
  </div>`, flash);
}

function bulletinPaie(user, emp, p, periodeLisible, params, flash) {
  const c = p.calcul;
  const ligne = (lib, base, taux, retenue, patronale) => `<tr>
    <td>${lib}</td><td class="num">${base === null ? '' : n2(base)}</td>
    <td class="num">${taux === null ? '' : pct(taux)}</td>
    <td class="num">${retenue ? n2(retenue) : ''}</td>
    <td class="num">${patronale ? n2(patronale) : ''}</td></tr>`;
  const P = p.parametresUtilises || {};
  return shell('Bulletin ' + p.periode, user, '/gestion/rh/paie', `
  <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap">
    <h1 style="margin-bottom:4px">Bulletin de paie — ${esc(periodeLisible)}</h1>
    <div style="white-space:nowrap">
      <a class="btn ligne petit" href="/gestion/rh/paie?periode=${esc(p.periode)}">← La paie du mois</a>
      <a class="btn petit" href="#" onclick="window.print();return false">Imprimer</a></div>
  </div>

  <div class="carte" style="margin-top:18px;max-width:780px">
    <div style="display:flex;justify-content:space-between;gap:20px;flex-wrap:wrap;
      border-bottom:2px solid var(--marine);padding-bottom:16px;margin-bottom:18px">
      <div style="display:flex;gap:12px;align-items:center">
        <img src="/assets/logo-oasis.png" alt="" style="width:52px;height:52px;object-fit:contain">
        <div><b style="font-size:17px;color:var(--marine)">OASIS</b><br>
          <small class="aide">Centre numérique de formation professionnelle<br>Port-au-Prince, Haïti</small></div>
      </div>
      <div style="text-align:right;font-size:13px">
        <b>${esc(emp.nom)}</b><br>
        <small class="aide">${esc(emp.matricule)}<br>${esc(emp.poste || '')}<br>
        ${emp.nif ? 'NIF ' + esc(emp.nif) : ''}${emp.numeroOna ? ' · ONA ' + esc(emp.numeroOna) : ''}<br>
        Embauché le ${esc(emp.dateEmbauche || '—')}</small>
      </div>
    </div>

    <table style="font-size:13.5px">
      <thead><tr><th>Élément</th><th class="num">Base</th><th class="num">Taux</th>
        <th class="num">Retenue salarié</th><th class="num">Charge employeur</th></tr></thead>
      <tbody>
        ${ligne('Salaire de base', c.base, null, null, null)}
        ${c.prime > 0 ? ligne('Primes et indemnités', c.prime, null, null, null) : ''}
        ${c.avantage > 0 ? ligne('Avantages en nature', c.avantage, null, null, null) : ''}
        <tr style="background:var(--fond)"><td><b>Salaire brut</b></td>
          <td class="num"><b>${n2(c.brut)}</b></td><td colspan="3"></td></tr>
        ${ligne('ONA — assurance vieillesse', c.brut, (P.ona || {}).salarie, c.salariales.ona, c.patronales.ona)}
        ${ligne('OFATMA — maladie-maternité', c.brut, (P.ofatmaMaladie || {}).employeur, 0, c.patronales.ofatmaMaladie)}
        ${ligne('OFATMA — accidents du travail', c.brut, (P.ofatmaAccident || {}).employeur, 0, c.patronales.ofatmaAccident)}
        <tr><td>Base imposable</td><td class="num">${n2(c.imposable)}</td><td colspan="3"></td></tr>
        ${ligne('Impôt sur le revenu (barème progressif)', c.imposable, null, c.iri, 0)}
        ${c.autresRetenues > 0 ? ligne('Autres retenues', null, null, c.autresRetenues, 0) : ''}
        <tr style="background:var(--fond)">
          <td colspan="3"><b>Totaux</b></td>
          <td class="num"><b>${n2(c.salariales.total + c.iri + c.autresRetenues)}</b></td>
          <td class="num"><b>${n2(c.patronales.total)}</b></td></tr>
      </tbody>
    </table>

    <div style="display:flex;justify-content:space-between;gap:20px;flex-wrap:wrap;margin-top:20px;
      border-top:2px solid var(--marine);padding-top:16px">
      <div style="font-size:13px;color:var(--sourd)">
        Coût total pour l’employeur : <b style="color:var(--encre)">${fmtHTG(c.coutEmployeur)}</b><br>
        Projection annuelle d’impôt : ${fmtHTG(c.iriAnnuelProjete)}<br>
        Statut : ${etiq(p.statut)}${p.ecritureId ? ' · écriture comptable générée' : ''}
      </div>
      <div style="text-align:right">
        <small class="aide">Net à payer</small>
        <div style="font-size:30px;font-weight:800;color:var(--vert);
          font-variant-numeric:tabular-nums;letter-spacing:-.02em">${fmtHTG(c.net)}</div>
      </div>
    </div>

    ${c.iriDetail && c.iriDetail.length ? `<details style="margin-top:18px">
      <summary style="cursor:pointer;font-weight:700;font-size:13.5px">Détail du calcul de l’impôt</summary>
      <table style="font-size:13px;margin-top:10px"><thead><tr><th>Tranche annuelle</th>
        <th class="num">Assiette</th><th class="num">Taux</th><th class="num">Impôt</th></tr></thead>
        <tbody>${c.iriDetail.map(t => `<tr>
          <td>${n2(t.de)} à ${t.a === null || t.a === Infinity ? 'au-delà' : n2(t.a)}</td>
          <td class="num">${n2(t.assiette)}</td><td class="num">${pct(t.taux)}</td>
          <td class="num">${n2(t.impot)}</td></tr>`).join('')}</tbody></table>
      <p class="aide">Impôt annuel ${n2(c.iriAnnuelProjete)} ÷ 12 = ${n2(c.iri)} retenu ce mois.</p>
    </details>` : ''}

    ${params.signataireNom ? `<div style="margin-top:24px;text-align:right">
      ${params.signatureUrl ? `<img src="${esc(params.signatureUrl)}" alt=""
        style="max-height:46px;max-width:190px;object-fit:contain">` : ''}
      <div style="font-size:13px"><b>${esc(params.signataireNom)}</b><br>
        <small class="aide">${esc(params.signataireTitre || '')}</small></div></div>` : ''}
  </div>`, flash);
}

function pageConges(user, list, soldes, flash) {
  const enAttente = list.filter(c => c.statut === 'demande');
  return shell('Congés', user, '/gestion/rh/conges', `
  <h1>Congés et absences</h1>
  <p class="sous">Les congés annuels accordés s’imputent sur le solde acquis de l’employé.</p>

  <div class="grille" style="grid-template-columns:1.25fr .9fr;align-items:start;margin-top:20px">
    <div>
      ${enAttente.length ? `<div class="carte" style="padding:6px 0">
        <h2 style="padding:16px 22px 6px;margin:0">Demandes à arbitrer</h2>
        <table><thead><tr><th>Employé</th><th>Type</th><th>Début</th>
          <th class="num">Jours</th><th>Décision</th></tr></thead>
          <tbody>${enAttente.map(c => `<tr>
            <td><b>${esc(c.employe.nom)}</b><br><small class="aide">${esc(c.employe.matricule)}</small></td>
            <td><span class="badge b-bleu">${esc(c.type)}</span>
              ${c.motif ? `<br><small class="aide">${esc(c.motif)}</small>` : ''}</td>
            <td>${esc(c.debut || '—')}</td><td class="num">${c.jours}</td>
            <td><form method="POST" action="/gestion/rh/conges" style="display:flex;gap:6px">
              <input type="hidden" name="id" value="${esc(c.id)}">
              <button class="btn vert petit" name="decision" value="accorde">Accorder</button>
              <button class="btn ligne petit" name="decision" value="refuse">Refuser</button>
            </form></td></tr>`).join('')}</tbody></table>
      </div>` : `<div class="carte">${vide('Aucune demande en attente.')}</div>`}

      <div class="carte" style="margin-top:18px;padding:6px 0">
        <h2 style="padding:16px 22px 6px;margin:0">Historique</h2>
        ${list.length ? `<table><thead><tr><th>Employé</th><th>Type</th><th>Début</th>
          <th class="num">Jours</th><th>Statut</th></tr></thead>
          <tbody>${list.slice(0, 30).map(c => `<tr>
            <td>${esc(c.employe.nom)}</td><td>${esc(c.type)}</td><td>${esc(c.debut || '—')}</td>
            <td class="num">${c.jours}</td><td>${etiq(c.statut)}</td></tr>`).join('')}</tbody></table>`
          : vide('Aucun congé enregistré.')}
      </div>
    </div>

    <div>
      <div class="carte">
        <h2 style="margin-top:0">Enregistrer une demande</h2>
        <form method="POST" action="/gestion/rh/conges">
          <input type="hidden" name="action" value="demander">
          <label>Employé</label><select name="employeId" required>
            ${soldes.map(e => `<option value="${esc(e.id)}">${esc(e.nom)} — solde ${e.droits.solde} j</option>`).join('')}
          </select>
          <label>Type</label><select name="type">
            <option value="annuel">Congé annuel</option><option value="maladie">Congé de maladie</option>
            <option value="maternite">Congé de maternité</option><option value="exceptionnel">Congé exceptionnel</option></select>
          <label>Date de début</label><input name="debut" type="date" required>
          <label>Nombre de jours</label><input name="jours" type="number" step="0.5" min="0.5" max="60" value="1" required>
          <label>Motif</label><input name="motif" maxlength="200">
          <button class="btn" style="margin-top:14px;width:100%">Enregistrer la demande</button>
        </form>
      </div>

      <div class="carte" style="margin-top:18px;padding:6px 0">
        <h2 style="padding:16px 22px 6px;margin:0">Soldes acquis</h2>
        ${soldes.length ? `<table><thead><tr><th>Employé</th><th class="num">Acquis</th>
          <th class="num">Pris</th><th class="num">Solde</th></tr></thead>
          <tbody>${soldes.map(e => `<tr><td>${esc(e.nom)}</td>
            <td class="num">${e.droits.acquis}</td><td class="num">${e.droits.pris}</td>
            <td class="num"><b>${e.droits.solde}</b></td></tr>`).join('')}</tbody></table>`
          : vide('Aucun employé actif.')}
      </div>
    </div>
  </div>`, flash);
}

/* =============== CONTRAT DE TRAVAIL =============== */

const ETAT_CIVIL = { celibataire: 'Célibataire', marie: 'Marié(e)', divorce: 'Divorcé(e)',
  veuf: 'Veuf / veuve', union: 'En union libre' };
const SEXE_LONG = { F: 'Féminin', M: 'Masculin', autre: 'Non précisé' };
const PERIODICITE = { mensuelle: 'mensuel', quinzaine: 'par quinzaine',
  hebdomadaire: 'hebdomadaire', journaliere: 'journalier' };
/** Libellé court d'un type de contrat, pour les étiquettes. */
const contratCourt = id => (G.TYPES_CONTRAT.find(t => t.id === id) || {}).court || id || '—';
const contratLong  = id => (G.TYPES_CONTRAT.find(t => t.id === id) || {}).label || id || '—';

function pageContrat(user, e, c, d, flash) {
  const k = d.controle;
  const champ = (m) => m.source === 'employe'
    ? `<a href="/gestion/rh/employe/${esc(e.id)}">dossier employé</a>` : 'ce formulaire';
  return shell('Contrat — ' + e.nom, user, '/gestion/rh', `
  <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap">
    <div><h1 style="margin-bottom:4px">Contrat de travail</h1>
      <p class="sous" style="margin:0">${esc(e.nom)} · <code>${esc(e.matricule)}</code>
        ${c.statut ? ' · ' + etiq(c.statut === 'actif' ? 'validee' : 'brouillon') : ''}</p></div>
    <div style="white-space:nowrap">
      <a class="btn ligne petit" href="/gestion/rh/employe/${esc(e.id)}">← Dossier</a>
      <a class="btn petit" href="/gestion/rh/employe/${esc(e.id)}/contrat/document">Voir le contrat</a></div>
  </div>

  <div class="alerte ${k.complet ? 'ok' : 'ko'}" style="${k.complet ? '' : 'background:#FFF6E6;color:#8A5200'}">
    <b>Article 22 du Code du travail — énonciations obligatoires :
      ${k.total - k.manquants.filter(m => m.cle !== 'dateFin').length} sur ${k.total}.</b>
    ${k.complet ? ' Le contrat peut être édité et signé.'
      : `<ul style="margin:8px 0 0 18px;font-weight:500">${k.manquants.map(m =>
          `<li>${esc(m.label)} — à renseigner dans ${champ(m)}</li>`).join('')}</ul>`}
  </div>

  <div class="grille" style="grid-template-columns:1.3fr .85fr;align-items:start">
    <form method="POST" action="/gestion/rh/employe/${esc(e.id)}/contrat" class="carte">
      <h2 style="margin-top:0">Nature et durée</h2>
      <div class="grille g2" style="gap:14px">
        <div><label>Type de contrat</label><select name="type">${d.types.map(t =>
          `<option value="${t.id}" ${c.type === t.id ? 'selected' : ''}>${esc(t.label)}</option>`).join('')}</select></div>
        <div><label>Date de début</label><input name="dateDebut" type="date"
          value="${esc(c.dateDebut || e.dateEmbauche || '')}"></div>
        <div><label>Date de fin (contrats à terme)</label><input name="dateFin" type="date"
          value="${esc(c.dateFin || '')}">
          <div class="aide">Un contrat à terme tacitement renouvelé devient un contrat
            à durée indéterminée (art. 17, 72 à 78).</div></div>
        <div><label>Lieu d’exécution du travail</label><input name="lieuTravail" maxlength="160"
          value="${esc(c.lieuTravail || '')}" placeholder="ex. Siège d’OASIS, Port-au-Prince"></div>
      </div>
      <label>Nature du travail</label>
      <textarea name="nature" rows="3" maxlength="600"
        placeholder="Décrire les fonctions confiées au salarié">${esc(c.nature || '')}</textarea>

      <h2 style="margin-top:22px">Horaire</h2>
      <div class="grille g2" style="gap:14px">
        <div><label>Heures par jour</label><input name="heuresJour" type="number" step="0.5" min="0" max="12"
          value="${c.heuresJour || d.duree.heuresJour}"></div>
        <div><label>Heures par semaine</label><input name="heuresSemaine" type="number" step="1" min="0" max="60"
          value="${c.heuresSemaine || d.duree.heuresSemaine}"></div>
      </div>
      <label>Répartition de l’horaire</label>
      <input name="horaire" maxlength="200" value="${esc(c.horaire || '')}"
        placeholder="ex. Du lundi au vendredi, de 8 h à 16 h">
      <div class="aide">Durée normale : ${d.duree.heuresJour} heures par jour
        et ${d.duree.heuresSemaine} heures par semaine.</div>

      <h2 style="margin-top:22px">Rémunération</h2>
      <div class="grille g2" style="gap:14px">
        <div><label>Salaire (HTG)</label><input name="salaire" type="number" step="0.01" min="0"
          value="${c.salaire || e.salaireBase || ''}">
          <div class="aide">Enregistrer met à jour le salaire du dossier et l’historique.</div></div>
        <div><label>Périodicité</label><select name="periodicite">${Object.entries(PERIODICITE).map(([id, lb]) =>
          `<option value="${id}" ${c.periodicite === id ? 'selected' : ''}>Paiement ${esc(lb)}</option>`).join('')}</select></div>
      </div>
      <label>Avantages en nature ou indemnités</label>
      <textarea name="avantages" rows="2" maxlength="600">${esc(c.avantages || '')}</textarea>

      <h2 style="margin-top:22px">Clauses particulières et signature</h2>
      <textarea name="clausesParticulieres" rows="4" maxlength="1500"
        placeholder="Confidentialité, usage du matériel, formation, mobilité…">${esc(c.clausesParticulieres || '')}</textarea>
      <div class="grille g2" style="gap:14px;margin-top:10px">
        <div><label>Fait à</label><input name="lieuSignature" maxlength="80"
          value="${esc(c.lieuSignature || 'Port-au-Prince')}"></div>
        <div><label>Le</label><input name="dateSignature" type="date"
          value="${esc(c.dateSignature || new Date().toISOString().slice(0, 10))}"></div>
      </div>
      <div style="margin-top:18px;display:flex;gap:9px;flex-wrap:wrap">
        <button class="btn ligne">Enregistrer le brouillon</button>
        <button class="btn vert" name="activer" value="1" ${k.complet ? '' : 'disabled'}>
          ${k.complet ? 'Enregistrer et activer le contrat' : 'Activation : énonciations incomplètes'}</button>
      </div>
    </form>

    <div>
      <div class="carte">
        <h2 style="margin-top:0">Ce que prévoit la loi</h2>
        <p style="font-size:13.5px;line-height:1.7;color:var(--sourd)">
          <b style="color:var(--encre)">Forme</b> — le contrat écrit se fait en français ou
          en créole, en deux originaux, chaque partie en conservant un (art. 22).<br><br>
          <b style="color:var(--encre)">Congés</b> — 15 jours consécutifs payés après un an
          de service, acquis à raison de 1,25 jour par mois (art. 123 à 129).<br><br>
          <b style="color:var(--encre)">Boni</b> — versé entre le 24 et le 31 décembre,
          au moins égal à 1/12 des salaires gagnés dans l’année (art. 135 à 137).
        </p>
      </div>

      <div class="carte" style="margin-top:18px">
        <h2 style="margin-top:0">Préavis applicable</h2>
        <p style="font-size:14px">Ancienneté actuelle : <b>${esc(d.preavis.ancienneteLisible)}</b><br>
          Préavis dû aujourd’hui : <b style="color:var(--marine);font-size:17px">${esc(d.preavis.libelle)}</b></p>
        <table style="font-size:12.5px;margin-top:10px"><tbody>
          ${d.preavisTable.map(p => `<tr${d.preavis.mois >= p.moisMin && d.preavis.mois < p.moisMax
            ? ' style="background:var(--bleu-pale);font-weight:700"' : ''}>
            <td style="padding:7px 10px">${p.moisMax === Infinity ? '10 ans et plus'
              : p.moisMin === 0 ? 'Moins de 3 mois'
              : (p.moisMin < 12 ? p.moisMin + ' à ' + p.moisMax + ' mois'
                 : (p.moisMin / 12) + ' à ' + (p.moisMax / 12) + ' ans')}</td>
            <td style="padding:7px 10px;text-align:right">${esc(p.libelle)}</td></tr>`).join('')}
        </tbody></table>
        <p class="aide">Le préavis n’est obligatoire qu’à partir de trois mois
          de service consécutifs (art. 44 et 45).</p>
      </div>
    </div>
  </div>`, flash);
}

function contratDocument(user, e, c, d) {
  const ligne = (etiquette, valeur) => valeur
    ? `<tr><td style="width:210px;color:var(--sourd);padding:7px 0;vertical-align:top">${etiquette}</td>
       <td style="padding:7px 0"><b>${esc(valeur)}</b></td></tr>` : '';
  const p = d.parametres || {};
  const art = (n, t) => `<p style="margin:0 0 13px"><b>Article ${n}.</b> ${t}</p>`;
  const typeLabel = d.type.label;
  const aTerme = c.dateFin;

  return shell('Contrat de travail — ' + e.nom, user, '/gestion/rh', `
  <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap">
    <h1 style="margin-bottom:4px">Contrat de travail</h1>
    <div style="white-space:nowrap">
      <a class="btn ligne petit" href="/gestion/rh/employe/${esc(e.id)}/contrat">← Modifier</a>
      <a class="btn petit" href="#" onclick="window.print();return false">Imprimer</a></div>
  </div>

  ${!d.controle.complet ? `<div class="alerte ko" style="background:#FFF6E6;color:#8A5200">
    <b>Document incomplet.</b> ${d.controle.manquants.length} énonciation(s) exigée(s) par
    l’article 22 manquent : ${d.controle.manquants.map(m => esc(m.label)).join(', ')}.
    Complétez-les avant signature.</div>` : ''}

  <div class="carte" style="max-width:860px;line-height:1.75;font-size:14.5px">
    <div style="display:flex;justify-content:space-between;gap:20px;flex-wrap:wrap;
      border-bottom:2px solid var(--marine);padding-bottom:16px;margin-bottom:20px">
      <div style="display:flex;gap:12px;align-items:center">
        <img src="/assets/logo-oasis.png" alt="" style="width:54px;height:54px;object-fit:contain">
        <div><b style="font-size:18px;color:var(--marine)">OASIS</b><br>
          <small class="aide">Centre numérique de formation professionnelle<br>Port-au-Prince, Haïti</small></div>
      </div>
      <div style="text-align:right;font-size:12.5px;color:var(--sourd)">
        <b style="color:var(--encre);font-size:14px">${esc(typeLabel)}</b><br>
        Réf. ${esc(e.matricule)}<br>${c.dateSignature ? 'Établi le ' + esc(c.dateSignature) : ''}</div>
    </div>

    <h2 style="margin-top:0;font-size:19px;text-align:center;letter-spacing:.02em">
      ${esc(typeLabel.toUpperCase())}</h2>
    <p style="text-align:center;color:var(--sourd);font-size:12.5px;margin-top:-6px">
      Établi en deux originaux conformément à l’article 22 du Code du travail</p>

    <h3 style="font-size:15px;margin:22px 0 8px">Entre les parties</h3>
    <p style="margin:0 0 12px"><b>L’employeur</b> — OASIS, Centre numérique de formation
      professionnelle, établi à Port-au-Prince (Haïti),
      ${p.signataireNom ? 'représenté par ' + esc(p.signataireNom) +
        (p.signataireTitre ? ', ' + esc(p.signataireTitre) : '') : 'représenté par sa direction'},
      d’une part ;</p>
    <p style="margin:0 0 14px"><b>Le salarié</b> — ci-après désigné, d’autre part :</p>
    <table style="width:100%;font-size:14px"><tbody>
      ${ligne('Noms et prénoms', e.nom)}
      ${ligne('Nationalité', e.nationalite)}
      ${ligne('Date de naissance', e.naissance)}
      ${ligne('Sexe', SEXE_LONG[e.sexe])}
      ${ligne('État civil', ETAT_CIVIL[e.etatCivil])}
      ${ligne('Profession', e.poste)}
      ${ligne('Résidence', e.adresse)}
      ${ligne('Carte d’identité', e.cin)}
      ${ligne('Livret de travail', e.numeroLivret)}
      ${ligne('Numéro ONA', e.numeroOna)}
      ${ligne('NIF', e.nif)}
    </tbody></table>

    <h3 style="font-size:15px;margin:24px 0 10px">Il est convenu ce qui suit</h3>
    ${art(1, `Le salarié est engagé par l’employeur en qualité de
      <b>${esc(e.poste || '—')}</b>, au sein du département
      ${esc(e.departement || 'de l’institution')}.`)}
    ${art(2, `<b>Nature du travail.</b> ${esc(c.nature || '—')}`)}
    ${art(3, `<b>Lieu d’exécution.</b> Le travail s’exécute à ${esc(c.lieuTravail || '—')}.
      Tout changement de lieu fait l’objet d’un accord écrit entre les parties.`)}
    ${art(4, aTerme
      ? `<b>Durée.</b> Le présent contrat est conclu pour une durée déterminée, du
         <b>${esc(c.dateDebut || '—')}</b> au <b>${esc(c.dateFin)}</b>. Conformément aux
         articles 17 et 72 à 78 du Code du travail, sa reconduction tacite le transforme
         en contrat à durée indéterminée.`
      : `<b>Durée.</b> Le présent contrat est conclu pour une durée indéterminée et prend
         effet le <b>${esc(c.dateDebut || '—')}</b>.`)}
    ${art(5, `<b>Horaire.</b> La durée du travail est de <b>${c.heuresJour || 8} heures par jour</b>
      et <b>${c.heuresSemaine || 48} heures par semaine</b>${c.horaire
        ? ', réparties comme suit : ' + esc(c.horaire) : ''}. Les heures effectuées au-delà
      de la durée normale sont rémunérées selon les dispositions légales en vigueur.`)}
    ${art(6, `<b>Rémunération.</b> Le salarié perçoit un salaire
      ${esc(PERIODICITE[c.periodicite] || 'mensuel')} de <b>${fmtHTG(c.salaire || 0)}</b>,
      sous déduction des cotisations à l’ONA et de l’impôt sur le revenu retenu
      à la source.${c.avantages ? ' Avantages : ' + esc(c.avantages) + '.' : ''}`)}
    ${art(7, `<b>Cotisations sociales.</b> L’employeur procède à l’affiliation du
      salarié à l’ONA et à l’OFATMA, et verse les cotisations patronales et salariales
      dues aux échéances légales.`)}
    ${art(8, `<b>Congés annuels.</b> Après un an de service, le salarié a droit à un congé
      payé d’au moins <b>15 jours consécutifs</b>, acquis à raison de 1,25 jour par mois
      de travail (articles 123 à 129 du Code du travail).`)}
    ${art(9, `<b>Boni de fin d’année.</b> Il est versé entre le 24 et le 31 décembre de
      chaque année, quelle que soit la durée de l’emploi, pour un montant au moins égal
      à un douzième des salaires gagnés dans l’année (articles 135 à 137).`)}
    ${art(10, `<b>Préavis.</b> La partie qui met fin au contrat donne à l’autre un préavis
      écrit, obligatoire à partir de trois mois de service consécutifs, dont la durée suit
      l’ancienneté du salarié (articles 44 et 45) :`)}
    <table style="font-size:13px;margin:0 0 14px 22px;width:auto"><tbody>
      ${d.preavisTable.filter(x => x.jours > 0).map(x => `<tr>
        <td style="padding:4px 18px 4px 0">${x.moisMax === Infinity ? 'À partir de 10 ans de service'
          : x.moisMin < 12 ? 'De ' + x.moisMin + ' à ' + x.moisMax + ' mois de service'
          : 'De ' + (x.moisMin / 12) + ' à ' + (x.moisMax / 12) + ' ans de service'}</td>
        <td style="padding:4px 0"><b>${esc(x.libelle)}</b></td></tr>`).join('')}
    </tbody></table>
    ${c.clausesParticulieres ? art(11, `<b>Clauses particulières.</b> ` +
      esc(c.clausesParticulieres).replace(/\n/g, '<br>')) : ''}
    ${art(c.clausesParticulieres ? 12 : 11, `<b>Dispositions générales.</b> Pour tout ce qui
      n’est pas prévu au présent contrat, les parties se réfèrent au Code du travail
      haïtien et au règlement intérieur de l’institution, dont le salarié déclare avoir
      pris connaissance.`)}

    <p style="margin:24px 0 8px">Fait à <b>${esc(c.lieuSignature || '—')}</b>,
      le <b>${esc(c.dateSignature || '—')}</b>, en deux originaux,
      chaque partie en conservant un exemplaire.</p>

    <div style="display:flex;justify-content:space-between;gap:30px;flex-wrap:wrap;margin-top:28px">
      <div style="flex:1;min-width:230px">
        <small class="aide">Pour l’employeur</small>
        ${p.signatureUrl ? `<div style="height:52px"><img src="${esc(p.signatureUrl)}" alt=""
          style="max-height:50px;max-width:180px;object-fit:contain"></div>`
          : '<div style="height:52px"></div>'}
        <div style="border-top:1px solid var(--encre);padding-top:7px;font-size:13px">
          <b>${esc(p.signataireNom || 'La direction')}</b><br>
          <small class="aide">${esc(p.signataireTitre || 'OASIS')}</small></div>
      </div>
      <div style="flex:1;min-width:230px">
        <small class="aide">Le salarié — lu et approuvé</small>
        <div style="height:52px"></div>
        <div style="border-top:1px solid var(--encre);padding-top:7px;font-size:13px">
          <b>${esc(e.nom)}</b><br><small class="aide">Signature ou empreinte digitale</small></div>
      </div>
      ${p.sceauUrl ? `<div style="flex:0 0 110px;text-align:center">
        <img src="${esc(p.sceauUrl)}" alt="Sceau" style="width:104px;height:104px;object-fit:contain">
      </div>` : ''}
    </div>
    <p class="aide" style="margin-top:18px;border-top:1px dashed var(--ligne);padding-top:12px">
      En l’absence de signature, l’empreinte digitale de la partie qui ne sait signer
      est apposée en présence de deux témoins (article 22, alinéa g).</p>
  </div>`, null);
}

/* =============== RECRUTEMENT — ADMINISTRATION =============== */

const ETAT_CANDIDATURE = {
  recue: ['b-gris', 'Reçue'], preselection: ['b-bleu', 'Présélection'],
  entretien: ['b-violet', 'Entretien'], retenue: ['b-vert', 'Retenue'],
  rejetee: ['b-rouge', 'Non retenue']
};
const badgeCand = s => {
  const [cl, lb] = ETAT_CANDIDATURE[s] || ['b-gris', s || '—'];
  return `<span class="badge ${cl}">${esc(lb)}</span>`;
};

function pageRecrutement(user, postes, candidatures, d, flash) {
  const ouvertes = postes.filter(p => p.statut === 'ouvert').length;
  const aTraiter = candidatures.filter(c => ['recue', 'preselection', 'entretien'].includes(c.statut)).length;
  return shell('Recrutement', user, '/gestion/rh/recrutement', `
  <h1>Recrutement</h1>
  <p class="sous">Offres d’emploi, formulaire public de candidature et suivi des dossiers reçus.</p>

  <div class="carte" style="margin-top:18px;border-left:4px solid var(--vert)">
    <h2 style="margin-top:0">Lien du formulaire de recrutement</h2>
    <p class="aide" style="margin-bottom:10px">À diffuser sur vos réseaux, par courriel ou par
      affichage. La page est publique : aucun compte n’est nécessaire pour postuler.</p>
    <div style="display:flex;gap:9px;flex-wrap:wrap;align-items:center">
      <input id="lien-public" value="${esc(d.lienPublic)}" readonly
        style="flex:1;min-width:260px;font-family:ui-monospace,monospace;font-size:13px">
      <a class="btn petit" href="${esc(d.lienPublic)}" target="_blank" rel="noopener">Ouvrir la page</a>
    </div>
  </div>

  <div class="grille g-stats" style="margin-top:18px">
    ${stat(ouvertes, 'Offres publiées', postes.length + ' au total')}
    ${stat(candidatures.length, 'Candidatures reçues')}
    ${stat(aTraiter, 'Dossiers à traiter')}
    ${stat(candidatures.filter(c => c.statut === 'retenue').length, 'Candidats retenus')}
  </div>

  <div class="carte" style="margin-top:22px">
    <h2 style="margin-top:0">Publier une offre</h2>
    <form method="POST" action="/gestion/rh/recrutement">
      <input type="hidden" name="action" value="ouvrir">
      <div class="grille g2" style="gap:14px">
        <div><label>Intitulé du poste *</label><input name="titre" maxlength="140" required
          placeholder="ex. Formateur en plomberie"></div>
        <div><label>Département</label><input name="departement" maxlength="80"></div>
        <div><label>Type de contrat</label><select name="typeContrat">${d.types.map(t =>
          `<option value="${t.id}">${esc(t.label)}</option>`).join('')}</select></div>
        <div><label>Lieu</label><input name="lieu" maxlength="100" value="Port-au-Prince"></div>
      </div>
      <div class="grille g2" style="gap:14px;margin-top:4px">
        <div><label>Description du poste</label>
          <textarea name="description" rows="4" maxlength="2000"
            placeholder="Missions confiées, rattachement, conditions d’exercice"></textarea></div>
        <div><label>Profil recherché</label>
          <textarea name="profil" rows="4" maxlength="2000"
            placeholder="Formation, expérience, compétences attendues"></textarea></div>
      </div>
      <div class="grille g2" style="gap:14px;margin-top:4px">
        <div><label>Salaire indicatif</label><input name="salaireIndicatif" maxlength="120"
          placeholder="ex. Entre 25 000 et 30 000 HTG"></div>
        <div><label>Date limite de candidature</label><input name="dateLimite" type="date"></div>
      </div>
      <button class="btn" style="margin-top:16px">Publier l’offre</button>
    </form>
  </div>

  <div style="margin-top:22px">
    <div>
      <div class="carte" style="padding:6px 0">
        <h2 style="padding:16px 22px 6px;margin:0">Candidatures</h2>
        ${candidatures.length ? `<table><thead><tr><th>Candidat</th><th>Poste visé</th>
          <th class="num">Expérience</th><th>Reçue le</th><th>Suivi</th><th></th></tr></thead>
          <tbody>${candidatures.map(c => `<tr>
            <td><a href="/gestion/rh/candidature/${esc(c.id)}"><b>${esc(c.nom)}</b></a>
              <br><small class="aide">${esc(c.telephone || c.email || '—')}</small></td>
            <td><small>${esc(c.posteSouhaite || '—')}</small></td>
            <td class="num">${c.experienceAnnees || 0} an${(c.experienceAnnees || 0) > 1 ? 's' : ''}</td>
            <td><small>${esc((c.recueLe || '').slice(0, 10))}</small></td>
            <td>${badgeCand(c.statut)}</td>
            <td><a class="btn ligne petit" href="/gestion/rh/candidature/${esc(c.id)}">Dossier</a></td>
          </tr>`).join('')}</tbody></table>`
          : vide('Aucune candidature reçue pour le moment.')}
      </div>

      <div class="carte" style="margin-top:18px;padding:6px 0">
        <h2 style="padding:16px 22px 6px;margin:0">Offres d’emploi</h2>
        ${postes.length ? `<table><thead><tr><th>Référence</th><th>Poste</th><th>Type</th>
          <th class="num">Candidatures</th><th>Limite</th><th>État</th><th></th></tr></thead>
          <tbody>${postes.map(p => `<tr>
            <td><code style="font-size:12px">${esc(p.reference)}</code></td>
            <td><b>${esc(p.titre)}</b>${p.departement ? `<br><small class="aide">${esc(p.departement)}</small>` : ''}</td>
            <td><span class="badge b-gris">${esc(contratCourt(p.typeContrat))}</span></td>
            <td class="num">${p.nbCandidatures}</td>
            <td><small>${esc(p.dateLimite || '—')}</small></td>
            <td>${p.statut === 'ouvert' ? '<span class="badge b-vert">Publiée</span>'
              : '<span class="badge b-gris">Retirée</span>'}</td>
            <td><form method="POST" action="/gestion/rh/recrutement" style="display:inline">
              <input type="hidden" name="id" value="${esc(p.id)}">
              <button class="btn ligne petit" name="action"
                value="${p.statut === 'ouvert' ? 'fermer' : 'rouvrir'}">${
                p.statut === 'ouvert' ? 'Retirer' : 'Republier'}</button></form></td>
          </tr>`).join('')}</tbody></table>`
          : vide('Aucune offre publiée. Les candidatures spontanées restent possibles.')}
      </div>
    </div>
  </div>`, flash);
}

function ficheCandidature(user, c, poste, employe, flash) {
  const info = (lb, v) => v ? `<tr><td style="color:var(--sourd);width:190px">${lb}</td>
    <td><b>${esc(v)}</b></td></tr>` : '';
  return shell('Candidature — ' + c.nom, user, '/gestion/rh/recrutement', `
  <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap">
    <div><h1 style="margin-bottom:4px">${esc(c.nom)}</h1>
      <p class="sous" style="margin:0">${esc(c.posteSouhaite || 'Candidature spontanée')}
        · reçue le ${esc((c.recueLe || '').slice(0, 10))} · ${badgeCand(c.statut)}</p></div>
    <a class="btn ligne petit" href="/gestion/rh/recrutement">← Recrutement</a>
  </div>

  <div class="grille" style="grid-template-columns:1.25fr .9fr;align-items:start;margin-top:20px">
    <div>
      <div class="carte">
        <h2 style="margin-top:0">Dossier du candidat</h2>
        <table style="font-size:14px"><tbody>
          ${info('Téléphone', c.telephone)}
          ${info('Courriel', c.email)}
          ${info('Adresse', c.adresse)}
          ${info('Date de naissance', c.naissance)}
          ${info('Sexe', SEXE_LONG[c.sexe])}
          ${info('Nationalité', c.nationalite)}
          ${info('Niveau d’études', c.niveauEtudes)}
          ${info('Diplôme', c.diplome)}
          ${info('Expérience', (c.experienceAnnees || 0) + ' an(s)')}
          ${info('Disponibilité', c.disponibilite)}
          ${info('Prétention salariale', c.pretentionSalariale ? fmtHTG(c.pretentionSalariale) : '')}
        </tbody></table>
        ${c.cvUrl ? `<p style="margin-top:14px"><a class="btn ligne petit" href="${esc(c.cvUrl)}"
          target="_blank" rel="noopener">📎 Ouvrir le CV${c.cvNom ? ' — ' + esc(c.cvNom) : ''}</a></p>`
          : '<p class="aide" style="margin-top:14px">Aucun CV joint.</p>'}
      </div>

      ${c.lettre ? `<div class="carte" style="margin-top:18px">
        <h2 style="margin-top:0">Lettre de motivation</h2>
        <p style="font-size:14px;line-height:1.75;white-space:pre-wrap">${esc(c.lettre)}</p>
      </div>` : ''}

      ${(c.decisions || []).length ? `<div class="carte" style="margin-top:18px;padding:6px 0">
        <h2 style="padding:16px 22px 6px;margin:0">Historique du suivi</h2>
        <table style="font-size:13.5px"><tbody>${c.decisions.slice().reverse().map(x => `<tr>
          <td style="width:120px"><small>${esc(x.le.slice(0, 10))}</small></td>
          <td>${badgeCand(x.statut)}</td>
          <td>${esc(x.note || '')}</td></tr>`).join('')}</tbody></table>
      </div>` : ''}
    </div>

    <div>
      <div class="carte">
        <h2 style="margin-top:0">Faire avancer le dossier</h2>
        <form method="POST" action="/gestion/rh/candidature/${esc(c.id)}">
          <label>Étape</label>
          <select name="statut">${Object.entries(ETAT_CANDIDATURE).map(([id, [, lb]]) =>
            `<option value="${id}" ${c.statut === id ? 'selected' : ''}>${esc(lb)}</option>`).join('')}</select>
          <label>Note interne</label>
          <textarea name="note" rows="3" maxlength="400"
            placeholder="Impression d’entretien, point à vérifier…"></textarea>
          <button class="btn" style="margin-top:12px;width:100%">Enregistrer le suivi</button>
        </form>
      </div>

      <div class="carte" style="margin-top:18px">
        <h2 style="margin-top:0">Embauche</h2>
        ${employe ? `<p style="font-size:14px">Ce candidat a été embauché.<br>
          <a href="/gestion/rh/employe/${esc(employe.id)}"><b>${esc(employe.nom)}</b> —
          ${esc(employe.matricule)}</a></p>`
          : c.statut === 'retenue'
            ? `<p class="aide" style="margin-bottom:12px">Le dossier employé sera pré-rempli
                 avec les informations de la candidature. Le contrat se rédige ensuite
                 depuis la fiche de l’employé.</p>
               <a class="btn vert" style="width:100%;text-align:center"
                 href="/gestion/rh/candidature/${esc(c.id)}/embaucher">Créer le dossier employé</a>`
            : `<p class="aide">Marquez la candidature comme <b>retenue</b> pour ouvrir
                 la création du dossier employé.</p>`}
      </div>

      ${poste ? `<div class="panneau" style="margin-top:18px;font-size:13px;line-height:1.7">
        <b>Offre visée</b><br><code style="font-size:12px">${esc(poste.reference)}</code>
        ${esc(poste.titre)}<br>
        ${poste.departement ? esc(poste.departement) + '<br>' : ''}
        ${poste.salaireIndicatif ? esc(poste.salaireIndicatif) : ''}
      </div>` : ''}
    </div>
  </div>`, flash);
}

/* =============== RECRUTEMENT — PAGES PUBLIQUES =============== */

function champsCandidat(poste) {
  return `
  <div class="grille g2" style="gap:14px">
    <div><label>Nom et prénom *</label><input name="nom" maxlength="100" required></div>
    <div><label>Téléphone</label><input name="telephone" maxlength="30" placeholder="+509 ..."></div>
    <div><label>Courriel</label><input name="email" type="email" maxlength="120"></div>
    <div><label>Adresse</label><input name="adresse" maxlength="200"></div>
    <div><label>Date de naissance</label><input name="naissance" type="date"></div>
    <div><label>Sexe</label><select name="sexe"><option value="">—</option>
      <option value="F">Féminin</option><option value="M">Masculin</option>
      <option value="autre">Non précisé</option></select></div>
    <div><label>Nationalité</label><input name="nationalite" maxlength="60" value="Haïtienne"></div>
    <div><label>Niveau d’études</label><input name="niveauEtudes" maxlength="120"
      placeholder="ex. Philo, CAP, Licence"></div>
    <div><label>Diplôme ou certification</label><input name="diplome" maxlength="140"></div>
    <div><label>Années d’expérience</label><input name="experienceAnnees" type="number" min="0" max="60" value="0"></div>
    <div><label>Disponibilité</label><input name="disponibilite" maxlength="80"
      placeholder="ex. Immédiate, sous quinzaine"></div>
    <div><label>Prétention salariale (HTG)</label><input name="pretentionSalariale" type="number" step="0.01" min="0"></div>
  </div>
  ${poste ? '' : `<label>Poste souhaité</label>
    <input name="posteSouhaite" maxlength="140" placeholder="Indiquez le poste qui vous intéresse">`}
  <label>Lettre de motivation</label>
  <textarea name="lettre" rows="6" maxlength="3000"
    placeholder="Présentez votre parcours et ce que vous souhaitez apporter au centre."></textarea>
  <label>Curriculum vitæ (PDF, image ou document Word — 20 Mo maximum)</label>
  <input name="cv" type="file" accept=".pdf,.docx,image/*">
  <p class="aide">Les informations transmises servent uniquement au traitement de votre
    candidature et restent confidentielles.</p>`;
}

function recrutementPublic(postes, user, flash) {
  return layout('Recrutement', `
  <div class="hero" style="padding:40px 38px">
    <div>
      <span class="eyebrow">Rejoindre l’équipe</span>
      <h1>Travailler à <span class="acc">OASIS</span></h1>
      <p class="sous" style="font-size:16px;margin-top:12px">
        Nous formons aux métiers techniques et accompagnons les professionnels haïtiens.
        Consultez nos offres ouvertes, ou adressez-nous une candidature spontanée :
        elle sera conservée et examinée dès qu’un poste correspondra à votre profil.</p>
    </div>
  </div>

  ${flash ? `<div class="alerte ok" style="margin-top:18px">${esc(flash)}</div>` : ''}

  <h2 style="margin-top:30px">Postes ouverts</h2>
  ${postes.length ? `<div class="grille g2" style="margin-top:14px">${postes.map(p => `
    <div class="carte">
      <div style="display:flex;gap:7px;flex-wrap:wrap;margin-bottom:9px">
        <span class="badge b-bleu">${esc(contratLong(p.typeContrat))}</span>
        ${p.lieu ? `<span class="badge b-gris">${esc(p.lieu)}</span>` : ''}
        ${p.dateLimite ? `<span class="badge b-orange">Jusqu’au ${esc(p.dateLimite)}</span>` : ''}
      </div>
      <h3 style="margin:0;font-size:18px">${esc(p.titre)}</h3>
      ${p.departement ? `<p class="aide" style="margin-top:3px">${esc(p.departement)}</p>` : ''}
      <p style="font-size:14px;color:var(--sourd);line-height:1.65;margin-top:10px">
        ${esc((p.description || '').slice(0, 190))}${(p.description || '').length > 190 ? '…' : ''}</p>
      ${p.salaireIndicatif ? `<p style="font-size:13.5px;margin-top:8px"><b>${esc(p.salaireIndicatif)}</b></p>` : ''}
      <a class="btn petit" style="margin-top:12px" href="/recrutement/${esc(p.id)}">Voir et postuler</a>
    </div>`).join('')}</div>`
    : `<div class="carte" style="margin-top:14px;text-align:center;padding:34px">
        <p style="font-size:15px;color:var(--sourd)">Aucun poste n’est ouvert actuellement.
          Vous pouvez tout de même déposer une candidature spontanée : elle sera conservée
          et examinée dès qu’un poste correspondra à votre profil.</p></div>`}

  <h2 style="margin-top:34px" id="postuler">Candidature spontanée</h2>
  <p class="sous">Remplissez ce formulaire si aucune offre ne correspond à votre profil.</p>
  <form method="POST" action="/recrutement/postuler" enctype="multipart/form-data"
    class="carte" style="margin-top:14px">
    ${champsCandidat(null)}
    <button class="btn vert" style="margin-top:16px">Envoyer ma candidature</button>
  </form>`, { user, active: '/recrutement' });
}

function offrePublique(p, user, flash) {
  const bloc = (t, v) => v ? `<h3 style="font-size:16px;margin:22px 0 7px">${t}</h3>
    <p style="font-size:14.5px;line-height:1.75;white-space:pre-wrap;color:var(--sourd)">${esc(v)}</p>` : '';
  return layout(p.titre + ' — Recrutement', `
  <p style="margin-bottom:12px"><a href="/recrutement">← Toutes les offres</a></p>
  ${flash ? `<div class="alerte ok">${esc(flash)}</div>` : ''}
  <div class="carte">
    <div style="display:flex;gap:7px;flex-wrap:wrap;margin-bottom:10px">
      <span class="badge b-bleu">${esc(contratLong(p.typeContrat))}</span>
      ${p.lieu ? `<span class="badge b-gris">${esc(p.lieu)}</span>` : ''}
      ${p.departement ? `<span class="badge b-violet">${esc(p.departement)}</span>` : ''}
      ${p.dateLimite ? `<span class="badge b-orange">Candidatures jusqu’au ${esc(p.dateLimite)}</span>` : ''}
    </div>
    <h1 style="margin:0;font-size:29px">${esc(p.titre)}</h1>
    <p class="aide">Référence ${esc(p.reference)}</p>
    ${bloc('Le poste', p.description)}
    ${bloc('Profil recherché', p.profil)}
    ${p.salaireIndicatif ? `<h3 style="font-size:16px;margin:22px 0 7px">Rémunération</h3>
      <p style="font-size:14.5px">${esc(p.salaireIndicatif)}</p>` : ''}
  </div>

  <h2 style="margin-top:28px">Postuler à ce poste</h2>
  <form method="POST" action="/recrutement/postuler" enctype="multipart/form-data"
    class="carte" style="margin-top:14px">
    <input type="hidden" name="posteId" value="${esc(p.id)}">
    ${champsCandidat(p)}
    <button class="btn vert" style="margin-top:16px">Envoyer ma candidature</button>
  </form>`, { user, active: '/recrutement' });
}

function candidatureEnvoyee(c, user) {
  return layout('Candidature envoyée', `
  <div class="carte" style="max-width:620px;margin:40px auto;text-align:center;padding:42px 34px">
    <div style="font-size:46px;line-height:1">✅</div>
    <h1 style="font-size:27px;margin-top:12px">Candidature bien reçue</h1>
    <p style="font-size:15px;color:var(--sourd);line-height:1.75;margin-top:10px">
      Merci ${esc(c.nom.split(' ')[0])}. Votre dossier pour le poste
      <b style="color:var(--encre)">${esc(c.posteSouhaite)}</b> a été enregistré
      le ${esc(c.recueLe.slice(0, 10))}.<br><br>
      L’équipe des ressources humaines l’examinera et vous contactera
      ${c.telephone ? 'au ' + esc(c.telephone) : c.email ? 'à ' + esc(c.email) : ''}
      si votre profil correspond.</p>
    <div style="margin-top:22px;display:flex;gap:9px;justify-content:center;flex-wrap:wrap">
      <a class="btn" href="/recrutement">Voir les autres offres</a>
      <a class="btn ligne" href="/">Retour à l’accueil</a>
    </div>
  </div>`, { user, active: '/recrutement' });
}

function parametresPaie(user, P, flash) {
  const tr = P.iri;
  return shell('Paramètres de paie', user, '/gestion/rh/parametres', `
  <h1>Paramètres de paie</h1>
  <p class="sous">Taux de cotisation et barème d’imposition appliqués à tous les bulletins.</p>

  <div class="alerte ko" style="background:#FFF6E6;color:#8A5200">
    <b>À confirmer avant la première paie réelle.</b> Les valeurs ci-dessous sont celles couramment
    appliquées en Haïti, mais les taux et les seuils évoluent par voie légale. Faites-les vérifier
    auprès de l’ONA, de l’OFATMA et de la DGI — en particulier la périodicité du barème
    d’imposition, enregistrée ici en montants annuels. Chaque bulletin conserve une copie
    des paramètres utilisés, de sorte qu’un changement de taux ne modifie jamais un bulletin déjà émis.
  </div>

  <form method="POST" action="/gestion/rh/parametres" class="carte">
    <h2 style="margin-top:0">Cotisations sociales</h2>
    <div class="grille g2" style="gap:14px">
      <div><label>ONA — part salariale (%)</label>
        <input name="onaSalarie" type="number" step="0.01" min="0" max="100" value="${P.ona.salarie * 100}"></div>
      <div><label>ONA — part employeur (%)</label>
        <input name="onaEmployeur" type="number" step="0.01" min="0" max="100" value="${P.ona.employeur * 100}"></div>
      <div><label>OFATMA — maladie-maternité, employeur (%)</label>
        <input name="ofatmaMaladie" type="number" step="0.01" min="0" max="100" value="${P.ofatmaMaladie.employeur * 100}"></div>
      <div><label>OFATMA — accidents du travail, employeur (%)</label>
        <input name="ofatmaAccident" type="number" step="0.01" min="0" max="100" value="${P.ofatmaAccident.employeur * 100}">
        <div class="aide">2 % commerce et services · 3 % industrie, construction, agriculture · 6 % mines</div></div>
    </div>

    <h2 style="margin-top:24px">Barème de l’impôt sur le revenu</h2>
    <p class="aide" style="margin-bottom:12px">Tranches cumulatives, en gourdes et par année.
      Laissez le plafond vide pour la dernière tranche (au-delà).</p>
    <table style="font-size:13.5px"><thead><tr><th>Tranche</th><th>Plafond annuel (HTG)</th><th>Taux (%)</th></tr></thead>
      <tbody>${[0, 1, 2, 3, 4].map(i => {
        const t = tr[i] || { jusqua: '', taux: 0 };
        const plafond = t.jusqua === Infinity || t.jusqua === null ? '' : t.jusqua;
        return `<tr><td>${i + 1}</td>
          <td><input name="seuil${i + 1}" type="number" step="1" min="0" value="${plafond}"
            placeholder="${i === 4 ? 'au-delà' : ''}" style="max-width:190px"></td>
          <td><input name="taux${i + 1}" type="number" step="0.01" min="0" max="100"
            value="${tr[i] ? tr[i].taux * 100 : ''}" style="max-width:120px"></td></tr>`;
      }).join('')}</tbody></table>

    <h2 style="margin-top:24px">Congés et boni</h2>
    <div class="grille g2" style="gap:14px">
      <div><label>Congés annuels acquis (jours par an)</label>
        <input name="congesAnnuelsJours" type="number" step="1" min="0" max="60" value="${P.congesAnnuelsJours}"></div>
      <div><label>Boni de fin d’année (mois de salaire)</label>
        <input name="boniMois" type="number" step="0.25" min="0" max="3" value="${P.boniMois}"></div>
    </div>
    <button class="btn" style="margin-top:18px">Enregistrer les paramètres</button>
  </form>`, flash);
}

/* =============== COMPTABILITÉ =============== */
function comptaAccueil(user, d, flash) {
  const r = d.resultat;
  return shell('Comptabilité', user, '/gestion/compta', `
  <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:16px;flex-wrap:wrap">
    <div><h1 style="margin-bottom:4px">Comptabilité</h1>
      <p class="sous" style="margin:0">${d.exercice
        ? 'Exercice ' + esc(d.exercice.libelle) + ' · ' + esc(d.exercice.debut) + ' au ' + esc(d.exercice.fin)
        : 'Aucun exercice ouvert'} · ${d.nbEcritures} écriture(s)</p></div>
    <div style="white-space:nowrap">
      <a class="btn" href="/gestion/compta/saisie">➕ Saisir une écriture</a>
      <a class="btn ligne petit" href="/gestion/compta/exercices">Exercices</a></div>
  </div>

  <div class="grille g-stats" style="margin-top:18px">
    ${stat(fmtHTG(r.totalProduits), 'Produits de l’exercice')}
    ${stat(fmtHTG(r.totalCharges), 'Charges de l’exercice')}
    ${stat(`<span style="color:${r.resultat >= 0 ? 'var(--vert)' : '#B02121'}">${fmtHTG(r.resultat)}</span>`,
      r.resultat >= 0 ? 'Excédent' : 'Déficit')}
    ${stat(d.balance.equilibree
      ? '<span style="color:var(--vert);font-size:20px">✓ équilibrée</span>'
      : '<span style="color:#B02121;font-size:20px">⚠ écart</span>', 'Balance générale',
      'débit ' + n2(d.balance.totaux.debit) + ' · crédit ' + n2(d.balance.totaux.credit))}
  </div>

  <div class="grille" style="grid-template-columns:1fr 1fr;align-items:start;margin-top:22px">
    <div class="carte" style="padding:6px 0">
      <h2 style="padding:16px 22px 6px;margin:0">Trésorerie</h2>
      ${d.tresorerie.length ? `<table><thead><tr><th>Compte</th><th class="num">Solde</th></tr></thead>
        <tbody>${d.tresorerie.map(c => `<tr${c.solde < 0 ? ' style="background:#FDF4F4"' : ''}>
          <td><code style="font-size:12.5px">${esc(c.num)}</code> ${esc(c.label)}
            ${c.solde < 0 ? '<br><small style="color:#B02121;font-weight:700">Position créditrice — à vérifier</small>' : ''}</td>
          <td class="num"><b${c.solde < 0 ? ' style="color:#B02121"' : ''}>${fmtHTG(c.solde)}</b></td></tr>`).join('')}
        <tr style="background:var(--fond)"><td><b>Total disponible</b></td>
          <td class="num"><b>${fmtHTG(d.tresorerie.reduce((s, c) => s + c.solde, 0))}</b></td></tr>
        </tbody></table>
        ${d.tresorerie.some(c => c.solde < 0) ? `<p class="aide" style="padding:0 22px 14px">
          Un compte de trésorerie créditeur signifie que l’on a décaissé plus qu’il n’y avait :
          vérifiez les règlements imputés sur ce compte, ou enregistrez l’alimentation manquante.</p>` : ''}`
        : vide('Aucun mouvement de trésorerie.')}
    </div>

    <div class="carte">
      <h2 style="margin-top:0">États et registres</h2>
      <div style="display:flex;flex-direction:column;gap:9px;margin-top:12px">
        <a class="btn ligne petit" href="/gestion/compta/journal">📝 Journal des écritures</a>
        <a class="btn ligne petit" href="/gestion/compta/grand-livre">📗 Grand livre</a>
        <a class="btn ligne petit" href="/gestion/compta/balance">⚖️ Balance générale</a>
        <a class="btn ligne petit" href="/gestion/compta/etats">📊 Compte de résultat et bilan</a>
        <a class="btn ligne petit" href="/gestion/compta/plan">🗂️ Plan comptable</a>
      </div>
    </div>
  </div>

  <div class="carte" style="margin-top:20px;padding:6px 0">
    <h2 style="padding:16px 22px 6px;margin:0">Dernières écritures</h2>
    ${d.dernieres.length ? `<table><thead><tr><th>Numéro</th><th>Date</th><th>Libellé</th>
      <th>Origine</th><th class="num">Montant</th></tr></thead>
      <tbody>${d.dernieres.map(e => `<tr>
        <td><code style="font-size:12.5px">${esc(e.numero)}</code></td><td>${esc(e.date)}</td>
        <td>${esc(e.libelle)}<br><small class="aide">pièce ${esc(e.piece)}</small></td>
        <td><span class="badge b-gris">${esc(e.source)}</span></td>
        <td class="num"><b>${fmtHTG(e.lignes.reduce((s, l) => s + (l.debit || 0), 0))}</b></td></tr>`).join('')}
      </tbody></table>` : vide('Aucune écriture. Les opérations de scolarité et de paie en généreront automatiquement.')}
  </div>`, flash);
}

function journal(user, list, f, journaux, exercices, flash) {
  const total = list.reduce((s, e) => s + e.lignes.reduce((x, l) => x + (l.debit || 0), 0), 0);
  return shell('Journal', user, '/gestion/compta/journal', `
  <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:16px;flex-wrap:wrap">
    <div><h1 style="margin-bottom:4px">Journal des écritures</h1>
      <p class="sous" style="margin:0">${list.length} écriture(s) · total débit ${fmtHTG(total)}</p></div>
    <a class="btn" href="/gestion/compta/saisie">➕ Saisir une écriture</a>
  </div>

  <form method="GET" class="panneau" style="margin:18px 0;display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end">
    <div><label>Exercice</label><select name="exercice">
      ${exercices.map(x => `<option value="${esc(x.id)}" ${f.exercice === x.id ? 'selected' : ''}>${esc(x.libelle)}</option>`).join('')}</select></div>
    <div><label>Journal</label><select name="journal">
      <option value="">Tous les journaux</option>
      ${journaux.map(j => `<option value="${j.code}" ${f.journal === j.code ? 'selected' : ''}>${j.code} — ${esc(j.label)}</option>`).join('')}</select></div>
    <button class="btn petit">Filtrer</button>
  </form>

  ${list.length ? list.map(e => {
    const td = e.lignes.reduce((s, l) => s + (l.debit || 0), 0);
    return `<div class="carte" style="margin-bottom:14px;padding:16px 20px
      ${e.extourneePar ? ';opacity:.62;border-style:dashed' : ''}">
      <div style="display:flex;justify-content:space-between;gap:14px;flex-wrap:wrap;align-items:flex-start">
        <div><code style="font-size:13px;font-weight:700;color:var(--marine)">${esc(e.numero)}</code>
          <span class="badge b-bleu" style="margin-left:7px">${esc(e.journal)}</span>
          ${e.extourneePar ? `<span class="badge b-rouge" style="margin-left:5px">extournée par ${esc(e.extourneePar)}</span>` : ''}
          ${e.extourneDe ? `<span class="badge b-orange" style="margin-left:5px">extourne de ${esc(e.extourneDe)}</span>` : ''}
          <div style="margin-top:5px"><b>${esc(e.libelle)}</b></div>
          <small class="aide">${esc(e.date)} · pièce ${esc(e.piece)} · origine ${esc(e.source)}</small></div>
        <div style="text-align:right">
          <div style="font-weight:800;font-size:17px;color:var(--marine)">${fmtHTG(td)}</div>
          ${!e.extourneePar && !e.extourneDe ? `
            <form method="POST" action="/gestion/compta/ecriture/${esc(e.id)}/extourner" style="margin-top:7px">
              <button class="btn ligne petit">Extourner</button></form>` : ''}</div>
      </div>
      <table style="font-size:13px;margin-top:12px"><thead><tr><th>Compte</th><th>Libellé</th>
        <th class="num">Débit</th><th class="num">Crédit</th></tr></thead>
        <tbody>${e.lignes.map(l => `<tr>
          <td><code style="font-size:12.5px">${esc(l.compte)}</code></td>
          <td>${esc(l.libelle || '')}</td>
          <td class="num">${l.debit ? n2(l.debit) : ''}</td>
          <td class="num">${l.credit ? n2(l.credit) : ''}</td></tr>`).join('')}</tbody></table>
    </div>`;
  }).join('') : `<div class="carte">${vide('Aucune écriture pour ce filtre.')}</div>`}`, flash);
}

function saisieEcriture(user, comptes, journaux, exercice, erreurs, b, flash) {
  const v = (champ, def) => esc((b && b[champ] !== undefined && b[champ] !== null ? b[champ] : def) || '');
  const lignes = (b && b.lignes) || [];
  const options = sel => `<option value="">— compte —</option>` + comptes.map(c =>
    `<option value="${esc(c.num)}" ${sel === c.num ? 'selected' : ''}>${esc(c.num)} — ${esc(c.label)}</option>`).join('');
  return shell('Saisir une écriture', user, '/gestion/compta/saisie', `
  <h1>Saisir une écriture</h1>
  <p class="sous">Une écriture n’est acceptée que si le total des débits égale le total des crédits.</p>

  ${erreurs && erreurs.length ? `<div class="alerte ko"><b>Écriture refusée</b>
    <ul style="margin:8px 0 0 18px;font-weight:500">${erreurs.map(e => `<li>${esc(e)}</li>`).join('')}</ul></div>` : ''}
  ${!exercice ? `<div class="alerte ko">Aucun exercice comptable ouvert.
    <a href="/gestion/compta/exercices">Ouvrez un exercice</a> avant de saisir.</div>` : ''}

  <form method="POST" action="/gestion/compta/saisie" class="carte">
    <div class="grille g-stats" style="gap:14px">
      <div><label>Journal</label><select name="journal">${journaux.map(j =>
        `<option value="${j.code}" ${(b && b.journal) === j.code ? 'selected' : ''}>${j.code} — ${esc(j.label)}</option>`).join('')}</select></div>
      <div><label>Date</label><input name="date" type="date" required
        value="${v('date', new Date().toISOString().slice(0, 10))}"></div>
      <div><label>Pièce justificative</label><input name="piece" maxlength="40" required
        value="${v('piece', '')}" placeholder="ex. FAC-0142"></div>
      <div><label>Libellé</label><input name="libelle" maxlength="200" required
        value="${v('libelle', '')}" placeholder="Objet de l’opération"></div>
    </div>

    <h2 style="margin-top:22px">Lignes d’imputation</h2>
    <table style="font-size:13.5px"><thead><tr><th style="min-width:230px">Compte</th><th>Libellé de ligne</th>
      <th class="num" style="width:140px">Débit</th><th class="num" style="width:140px">Crédit</th></tr></thead>
      <tbody>${[0, 1, 2, 3, 4, 5, 6, 7].map(i => {
        const l = lignes[i] || {};
        return `<tr>
          <td><select name="compte${i + 1}">${options(l.compte)}</select></td>
          <td><input name="libelle${i + 1}" maxlength="160" value="${esc(l.libelle || '')}"></td>
          <td><input name="debit${i + 1}" type="number" step="0.01" min="0"
            value="${l.debit ? l.debit : ''}" style="text-align:right"></td>
          <td><input name="credit${i + 1}" type="number" step="0.01" min="0"
            value="${l.credit ? l.credit : ''}" style="text-align:right"></td></tr>`;
      }).join('')}</tbody></table>
    <p class="aide">Une ligne porte soit un débit, soit un crédit — jamais les deux.
      Les lignes laissées vides sont ignorées.</p>
    <button class="btn" style="margin-top:14px" ${!exercice ? 'disabled' : ''}>Contrôler et enregistrer</button>
    <a class="btn ligne" style="margin-top:14px;margin-left:8px" href="/gestion/compta/journal">Annuler</a>
  </form>`, flash);
}

function grandLivre(user, comptes, f, plan, exercices, flash) {
  return shell('Grand livre', user, '/gestion/compta/grand-livre', `
  <h1>Grand livre</h1>
  <p class="sous">Mouvements et solde de chaque compte mouvementé.</p>

  <form method="GET" class="panneau" style="margin:18px 0;display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end">
    <div><label>Exercice</label><select name="exercice">${exercices.map(x =>
      `<option value="${esc(x.id)}" ${f.exercice === x.id ? 'selected' : ''}>${esc(x.libelle)}</option>`).join('')}</select></div>
    <div style="min-width:300px"><label>Compte</label><select name="compte">
      <option value="">Tous les comptes mouvementés</option>
      ${plan.map(c => `<option value="${esc(c.num)}" ${f.compte === c.num ? 'selected' : ''}>${esc(c.num)} — ${esc(c.label)}</option>`).join('')}</select></div>
    <button class="btn petit">Afficher</button>
  </form>

  ${comptes.length ? comptes.map(c => `<div class="carte" style="margin-bottom:14px;padding:6px 0">
    <div style="display:flex;justify-content:space-between;gap:14px;flex-wrap:wrap;padding:14px 20px 8px">
      <div><code style="font-size:13px;font-weight:700;color:var(--marine)">${esc(c.num)}</code>
        <b style="margin-left:7px">${esc(c.label)}</b></div>
      <div style="font-size:13px;color:var(--sourd)">débit ${n2(c.debit)} · crédit ${n2(c.credit)} ·
        solde <b style="color:var(--encre)">${n2(Math.abs(c.solde))} ${c.solde >= 0 ? 'D' : 'C'}</b></div>
    </div>
    <table style="font-size:13px"><thead><tr><th>Date</th><th>Écriture</th><th>Libellé</th>
      <th class="num">Débit</th><th class="num">Crédit</th><th class="num">Solde cumulé</th></tr></thead>
      <tbody>${(() => { let cum = 0; return c.mouvements
        .sort((x, y) => x.date.localeCompare(y.date)).map(m => {
          cum = Math.round((cum + (m.debit || 0) - (m.credit || 0)) * 100) / 100;
          return `<tr><td>${esc(m.date)}</td>
            <td><code style="font-size:12px">${esc(m.numero)}</code></td>
            <td>${esc(m.libelle)}</td>
            <td class="num">${m.debit ? n2(m.debit) : ''}</td>
            <td class="num">${m.credit ? n2(m.credit) : ''}</td>
            <td class="num">${n2(Math.abs(cum))} ${cum >= 0 ? 'D' : 'C'}</td></tr>`;
        }).join(''); })()}</tbody></table>
  </div>`).join('') : `<div class="carte">${vide('Aucun mouvement sur ce filtre.')}</div>`}`, flash);
}

function pageBalance(user, bal, f, exercices, flash) {
  return shell('Balance générale', user, '/gestion/compta/balance', `
  <h1>Balance générale</h1>
  <p class="sous">${bal.equilibree
    ? '<span style="color:var(--vert);font-weight:700">Balance équilibrée.</span> Les contrôles de partie double sont respectés.'
    : '<span style="color:#B02121;font-weight:700">Balance déséquilibrée.</span> Vérifiez les écritures de l’exercice.'}</p>

  <form method="GET" class="panneau" style="margin:18px 0;display:flex;gap:10px;align-items:flex-end">
    <div><label>Exercice</label><select name="exercice">${exercices.map(x =>
      `<option value="${esc(x.id)}" ${f.exercice === x.id ? 'selected' : ''}>${esc(x.libelle)}</option>`).join('')}</select></div>
    <button class="btn petit">Afficher</button>
  </form>

  <div class="carte" style="padding:6px 0">
    ${bal.lignes.length ? `<table><thead><tr><th>Compte</th><th>Intitulé</th>
      <th class="num">Total débit</th><th class="num">Total crédit</th>
      <th class="num">Solde débiteur</th><th class="num">Solde créditeur</th></tr></thead>
      <tbody>${bal.lignes.map(l => `<tr>
        <td><code style="font-size:12.5px">${esc(l.num)}</code></td><td>${esc(l.label)}</td>
        <td class="num">${n2(l.debit)}</td><td class="num">${n2(l.credit)}</td>
        <td class="num">${l.soldeDebiteur ? n2(l.soldeDebiteur) : ''}</td>
        <td class="num">${l.soldeCrediteur ? n2(l.soldeCrediteur) : ''}</td></tr>`).join('')}
        <tr style="background:var(--fond)"><td colspan="2"><b>Totaux</b></td>
          <td class="num"><b>${n2(bal.totaux.debit)}</b></td>
          <td class="num"><b>${n2(bal.totaux.credit)}</b></td>
          <td class="num"><b>${n2(bal.totaux.sd)}</b></td>
          <td class="num"><b>${n2(bal.totaux.sc)}</b></td></tr>
      </tbody></table>` : vide('Aucune écriture sur cet exercice.')}
  </div>`, flash);
}

function etatsFinanciers(user, r, b, exercice, exercices, flash) {
  const bloc = (titre, lignes, total, libTotal, couleur) => `<div class="carte" style="padding:6px 0">
    <h2 style="padding:16px 22px 6px;margin:0">${titre}</h2>
    ${lignes.length ? `<table style="font-size:13.5px">
      <tbody>${lignes.map(l => `<tr><td><code style="font-size:12px;color:var(--sourd)">${esc(l.num)}</code>
        ${esc(l.label)}</td><td class="num">${n2(l.montant)}</td></tr>`).join('')}
        <tr style="background:var(--fond)"><td><b>${libTotal}</b></td>
          <td class="num"><b${couleur ? ` style="color:${couleur}"` : ''}>${n2(total)}</b></td></tr>
      </tbody></table>` : vide('Aucun mouvement.')}
  </div>`;

  return shell('États financiers', user, '/gestion/compta/etats', `
  <h1>États financiers</h1>
  <p class="sous">${exercice ? 'Exercice ' + esc(exercice.libelle) + ' — du ' + esc(exercice.debut) +
    ' au ' + esc(exercice.fin) + (exercice.clos ? ' (clôturé)' : '') : 'Aucun exercice'}</p>

  <form method="GET" class="panneau" style="margin:18px 0;display:flex;gap:10px;align-items:flex-end">
    <div><label>Exercice</label><select name="exercice">${exercices.map(x =>
      `<option value="${esc(x.id)}" ${exercice && exercice.id === x.id ? 'selected' : ''}>${esc(x.libelle)}</option>`).join('')}</select></div>
    <button class="btn petit">Afficher</button>
    <a class="btn ligne petit" href="#" onclick="window.print();return false">Imprimer</a>
  </form>

  <h2 style="margin-top:22px">Compte de résultat</h2>
  <div class="grille" style="grid-template-columns:1fr 1fr;align-items:start">
    ${bloc('Charges', r.charges, r.totalCharges, 'Total des charges')}
    ${bloc('Produits', r.produits, r.totalProduits, 'Total des produits')}
  </div>
  <div class="carte" style="margin-top:14px;text-align:center">
    <small class="aide">${r.resultat >= 0 ? 'Excédent de l’exercice' : 'Déficit de l’exercice'}</small>
    <div style="font-size:30px;font-weight:800;letter-spacing:-.02em;
      color:${r.resultat >= 0 ? 'var(--vert)' : '#B02121'}">${fmtHTG(r.resultat)}</div>
    <small class="aide">produits ${n2(r.totalProduits)} − charges ${n2(r.totalCharges)}</small>
  </div>

  <h2 style="margin-top:28px">Bilan</h2>
  <div class="grille" style="grid-template-columns:1fr 1fr;align-items:start">
    ${bloc('Actif', b.actif, b.totalActif, 'Total de l’actif')}
    ${bloc('Passif', b.passif.concat([{ num: '120000',
      label: 'Résultat de l’exercice', montant: b.resultat }]), b.totalPassif, 'Total du passif')}
  </div>
  <p class="aide" style="text-align:center;margin-top:12px">${b.equilibre
    ? '<span style="color:var(--vert);font-weight:700">Bilan équilibré</span> — actif = passif, résultat inclus.'
    : '<span style="color:#B02121;font-weight:700">Bilan non équilibré</span> — écart de ' +
      n2(Math.abs(b.totalActif - b.totalPassif)) + ' HTG à corriger.'}</p>`, flash);
}

function planComptable(user, comptes, classes, mouvements, flash) {
  return shell('Plan comptable', user, '/gestion/compta/plan', `
  <h1>Plan comptable</h1>
  <p class="sous">${comptes.length} comptes répartis en sept classes.
    Les classes 1 à 5 forment le bilan, les classes 6 et 7 le compte de résultat.</p>

  <div class="grille" style="grid-template-columns:1.45fr .85fr;align-items:start;margin-top:20px">
    <div>${classes.map(cl => {
      const liste = comptes.filter(c => c.classe === cl.num);
      if (!liste.length) return '';
      return `<div class="carte" style="margin-bottom:14px;padding:6px 0">
        <h2 style="padding:14px 20px 6px;margin:0;font-size:17px">
          <span class="badge ${cl.nature === 'bilan' ? 'b-bleu' : 'b-orange'}">Classe ${cl.num}</span>
          ${esc(cl.label)}</h2>
        <table style="font-size:13.5px"><tbody>${liste.map(c => `<tr>
          <td style="width:110px"><code style="font-size:12.5px">${esc(c.num)}</code></td>
          <td>${esc(c.label)}</td>
          <td style="width:130px">${mouvements.has(c.num)
            ? `<a href="/gestion/compta/grand-livre?compte=${esc(c.num)}" class="badge b-vert">mouvementé</a>`
            : '<span class="badge b-gris">inutilisé</span>'}</td></tr>`).join('')}</tbody></table>
      </div>`;
    }).join('')}</div>

    <div class="carte">
      <h2 style="margin-top:0">Ajouter un compte</h2>
      <p class="aide" style="margin-bottom:12px">Le premier chiffre détermine la classe et donc
        la place du compte dans les états financiers.</p>
      <form method="POST" action="/gestion/compta/plan">
        <label>Numéro de compte</label>
        <input name="num" maxlength="8" required placeholder="ex. 606200" pattern="[0-9]{3,8}">
        <label>Intitulé</label><input name="label" maxlength="120" required>
        <button class="btn" style="margin-top:14px;width:100%">Ajouter au plan</button>
      </form>
      <div class="panneau" style="margin-top:16px;font-size:12.5px;line-height:1.8">
        ${classes.map(c => `<b>${c.num}</b> — ${esc(c.label)}`).join('<br>')}
      </div>
    </div>
  </div>`, flash);
}

function pageExercices(user, list, flash) {
  const an = new Date().getFullYear();
  return shell('Exercices comptables', user, '/gestion/compta/exercices', `
  <h1>Exercices comptables</h1>
  <p class="sous">Un exercice clôturé se verrouille : plus aucune écriture ne peut y être ajoutée.</p>

  <div class="grille" style="grid-template-columns:1.3fr .85fr;align-items:start;margin-top:20px">
    <div class="carte" style="padding:6px 0">
      ${list.length ? `<table><thead><tr><th>Exercice</th><th>Période</th>
        <th class="num">Écritures</th><th class="num">Résultat</th><th>État</th><th></th></tr></thead>
        <tbody>${list.map(e => `<tr>
          <td><b>${esc(e.libelle)}</b></td>
          <td><small>${esc(e.debut)} au ${esc(e.fin)}</small></td>
          <td class="num">${e.nbEcritures}</td>
          <td class="num"><b style="color:${(e.clos ? e.resultat : e.resultatCourant) >= 0 ? 'var(--vert)' : '#B02121'}">${
            fmtHTG(e.clos ? e.resultat : e.resultatCourant)}</b></td>
          <td>${e.clos ? '<span class="badge b-gris">Clôturé</span>'
            : e.equilibree ? '<span class="badge b-vert">Ouvert</span>'
            : '<span class="badge b-rouge">Ouvert — déséquilibré</span>'}</td>
          <td>${!e.clos ? `<form method="POST" action="/gestion/compta/exercices"
            onsubmit="return confirm('Clôturer définitivement cet exercice ?')">
            <input type="hidden" name="action" value="cloturer">
            <input type="hidden" name="id" value="${esc(e.id)}">
            <button class="btn ligne petit" ${e.equilibree ? '' : 'disabled'}>Clôturer</button></form>`
            : `<small class="aide">${esc((e.closLe || '').slice(0, 10))}</small>`}</td></tr>`).join('')}
        </tbody></table>` : vide('Aucun exercice.')}
    </div>

    <div class="carte">
      <h2 style="margin-top:0">Ouvrir un exercice</h2>
      <form method="POST" action="/gestion/compta/exercices">
        <input type="hidden" name="action" value="ouvrir">
        <label>Libellé</label><input name="libelle" maxlength="60" value="Exercice ${an + 1}">
        <label>Début</label><input name="debut" type="date" value="${an + 1}-01-01" required>
        <label>Fin</label><input name="fin" type="date" value="${an + 1}-12-31" required>
        <button class="btn" style="margin-top:14px;width:100%">Ouvrir</button>
      </form>
      <p class="aide" style="margin-top:12px">Les périodes ne peuvent pas se chevaucher.
        La clôture exige une balance équilibrée.</p>
    </div>
  </div>`, flash);
}

module.exports = {
  tableauDeBord,
  listeEtudiants, formEtudiant, ficheEtudiant, recouvrement,
  listeEmployes, formEmploye, ficheEmploye, pagePaie, bulletinPaie, pageConges, parametresPaie,
  pageContrat, contratDocument,
  pageRecrutement, ficheCandidature,
  recrutementPublic, offrePublique, candidatureEnvoyee,
  comptaAccueil, journal, saisieEcriture, grandLivre, pageBalance, etatsFinanciers,
  planComptable, pageExercices
};
