'use strict';
/* ============================================================
   OASIS — Gabarits des espaces connectés
   (formateur · apprenant · entreprise)
   ============================================================ */
const { esc, fmtHTG } = require('../lib/utils');
const { CATEGORIES, FORMATS, MODALITES, SOCLE_TRANSVERSAL, categorie, format: fmtDe, modalite: modDe, noteCours, nbInscrits, nbLecons, epreuvesDe, TYPES_EPREUVES } = require('../lib/db');
const { layout, avatarHtml, etoiles } = require('./views');

/* ---------- Coquille à barre latérale ---------- */
function shell(title, user, menu, activeHref, content, { sombre = false, sousTitre = '' } = {}) {
  const espaceMenu = user.role === 'admin' && menu === MENU_F
    ? [...MENU_F, ['/admin', '⚙️', 'Administration générale'], ['/gestion', '🏛️', 'Gestion de l’institution']]
    : menu;
  const inner = `
  <div class="shell">
    <aside class="side ${sombre ? 'sombre' : ''}">
      <div class="qui">${avatarHtml(user.name, sombre ? 'var(--vert)' : 'var(--violet)')}
        <span><b>${esc(user.name)}</b><small>${esc(sousTitre)}</small></span></div>
      <nav>${espaceMenu.map(([href, icon, label]) =>
        `<a href="${href}" class="${href === activeHref ? 'on' : ''}">${icon} ${label}</a>`).join('')}</nav>
    </aside>
    <section>${content}</section>
  </div>`;
  return layout(title, inner, { user });
}

const MENU_F = [
  ['/formateur', '📊', 'Tableau de bord'],
  ['/formateur/formations', '📚', 'Mes formations'],
  ['/formateur/creer', '➕', 'Créer une formation'],
  ['/formateur/revenus', '💰', 'Mes revenus'],
  ['/formateur/abonnes', '👥', 'Abonnés'],
  ['/formateur/avis', '⭐', 'Avis & évaluations'],
  ['/formateur/profil', '👤', 'Mon profil'],
  ['/tarifs', '⚙️', 'Mon plan']
];
const MENU_A = [
  ['/apprenant', '📖', 'Mes formations'],
  ['/formations', '🔎', 'Explorer le catalogue'],
  ['/apprenant/certificats', '🎖️', 'Mes certificats']
];
const MENU_ADMIN = [
  ['/formateur', '🎓', 'Mon espace formations'],
  ['/formateur/creer', '➕', 'Créer une formation'],
  ['/admin', '📊', 'Tableau de bord'],
  ['/admin/candidatures', '📝', 'Candidatures formateurs'],
  ['/admin/moderation', '🔎', 'Formations à vérifier'],
  ['/admin/parametres', '🎖️', 'Paramètres certificat'],
  ['/gestion', '🏛️', 'Gestion de l’institution'],
  ['/gestion/etudiants', '🎓', 'Dossiers étudiants'],
  ['/gestion/rh', '👔', 'Personnel & paie'],
  ['/gestion/compta', '📘', 'Comptabilité'],
  ['/formations', '📚', 'Catalogue'],
];
const MENU_E = [
  ['/entreprise', '🏠', 'Vue d\u2019ensemble'],
  ['/entreprise/collaborateurs', '👥', 'Collaborateurs'],
  ['/entreprise/formations', '📚', 'Formations'],
  ['/entreprise/rapports', '📈', 'Rapports & Analyses']
];

/* =============== ESPACE FORMATEUR =============== */
function dashFormateur(user, d, flash) {
  return shell('Tableau de bord formateur', user, MENU_F, '/formateur', `
  <h1>Bonjour, ${esc(user.name.split(' ')[0])} ! 👋</h1>
  <p class="sous">Voici un aperçu de vos activités et revenus sur Oasis.</p>
  ${flash ? `<div class="alerte ok">${esc(flash)}</div>` : ''}
  <div class="grille g4">
    <div class="carte stat-carte"><span class="lib">Revenus totaux</span>
      <span class="val">${fmtHTG(d.revenusTotaux)}</span><span class="delta">85 % des ventes</span></div>
    <div class="carte stat-carte"><span class="lib">Solde disponible</span>
      <span class="val">${fmtHTG(user.balance || 0)}</span><span class="delta">Disponible pour retrait</span></div>
    <div class="carte stat-carte"><span class="lib">Étudiants inscrits</span>
      <span class="val">${d.nbEtudiants}</span></div>
    <div class="carte stat-carte"><span class="lib">Formations publiées</span>
      <span class="val">${d.nbPubliees}</span><span class="delta">${d.nbBrouillons} en brouillon</span></div>
  </div>
  <div class="grille g2" style="margin-top:16px">
    <div class="carte">
      <h2 style="margin-top:0">Mes formations populaires</h2>
      ${d.topCours.map(c => `<div style="display:flex;justify-content:space-between;gap:10px;padding:9px 0;border-bottom:1px solid var(--ligne)">
        <span>${categorie(c.categorie).emoji} <b>${esc(c.titre)}</b><br>
        <small style="color:var(--sourd)">${nbInscrits(c.id)} étudiant(s) · ${noteCours(c.id).note ? '★ ' + noteCours(c.id).note : 'aucun avis'}
        · <span class="badge ${c.statut === 'publiee' ? 'b-vert' : 'b-orange'}">${c.statut === 'publiee' ? 'Publiée' : c.statut === 'en_verification' ? '🔎 En vérification' : 'Brouillon'}</span></small></span>
        <b style="white-space:nowrap">${fmtHTG(d.revParCours[c.id] || 0)}</b></div>`).join('') || '<p class="aide">Aucune formation encore.</p>'}
      <p style="margin-top:12px"><a class="btn violet petit" href="/formateur/creer">➕ Créer une nouvelle formation</a></p>
    </div>
    <div class="carte">
      <h2 style="margin-top:0">Revenus récents</h2>
      ${d.ventesRecentes.map(o => `<div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid var(--ligne)">
        <span>${esc(o.acheteur)}<br><small style="color:var(--sourd)">Formation : ${esc(o.coursTitre)} · ${o.createdAt.slice(0, 10)}</small></span>
        <b style="color:var(--vert)">+${fmtHTG(o.net)}</b></div>`).join('') || '<p class="aide">Aucune vente pour le moment.</p>'}
      <div class="panneau" style="margin-top:14px;display:flex;justify-content:space-between;align-items:center">
        <span>💼 <b>Solde du portefeuille</b><br><small class="aide">Versement mobile instantané</small></span>
        <a class="btn vert petit" href="/formateur/revenus">Demander un retrait</a>
      </div>
    </div>
  </div>`, { sousTitre: user.verified ? 'Formateur vérifié ✓' : 'Formateur' });
}

function mesFormationsF(user, courses, flash) {
  return shell('Mes formations', user, MENU_F, '/formateur/formations', `
  <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">
    <h1>Mes formations</h1>
    <a class="btn violet" href="/formateur/creer">➕ Créer une formation</a></div>
  <p class="sous">${courses.length} formation(s) — brouillons, publiées et archivées.</p>
  ${flash ? `<div class="alerte ok">${esc(flash)}</div>` : ''}
  <div class="carte" style="padding:8px 14px">
  <table><tr><th>Formation</th><th>Catégorie</th><th>Inscrits</th><th>Note</th><th>Prix</th><th>Statut</th><th>Actions</th></tr>
  ${courses.map(c => {
    const n = noteCours(c.id);
    return `<tr>
    <td><b>${esc(c.titre)}</b><br><small style="color:var(--sourd)">${c.modules.length} module(s) · ${nbLecons(c)} leçon(s)</small></td>
    <td>${categorie(c.categorie).emoji} ${esc(categorie(c.categorie).label)}</td>
    <td>${nbInscrits(c.id)}</td>
    <td>${n.note ? '★ ' + n.note : '—'}</td>
    <td class="num">${fmtHTG(c.prix)}</td>
    <td><span class="badge ${c.statut === 'publiee' ? 'b-vert' : c.statut === 'archivee' ? 'b-gris' : 'b-orange'}">
      ${c.statut === 'publiee' ? 'Publiée' : c.statut === 'archivee' ? 'Archivée' : c.statut === 'en_verification' ? '🔎 En vérification' : 'Brouillon'}</span></td>
    <td style="white-space:nowrap">
      <a class="btn ligne petit" href="/formateur/formation/${c.id}">Gérer</a>
      <form method="POST" action="/formateur/formation/${c.id}/statut" style="display:inline">
        ${c.statut === 'publiee'
          ? '<button name="statut" value="archivee" class="btn petit" style="background:var(--sourd)">Archiver</button>'
          : '<button name="statut" value="publiee" class="btn vert petit">Publier</button>'}
      </form></td></tr>`;
  }).join('')}</table>
  ${!courses.length ? '<p style="padding:18px;color:var(--sourd)">Aucune formation. Créez la première !</p>' : ''}
  </div>`, { sousTitre: 'Formateur' });
}

/* ---- Assistant de création (étape 1 : informations) ---- */
function creerFormation(user, error) {
  return shell('Créer une formation', user, MENU_F, '/formateur/creer', `
  <a href="/formateur/formations" style="font-size:13.5px">← Retour</a>
  <h1>Créer une nouvelle formation</h1>
  <p class="sous">Suivez les étapes pour créer et publier votre formation sur Oasis.</p>
  <div class="etapes">
    <span class="et on"><i>1</i> Informations</span><span class="tiret"></span>
    <span class="et"><i>2</i> Contenu</span><span class="tiret"></span>
    <span class="et"><i>3</i> Publication</span>
  </div>
  ${error ? `<div class="alerte ko">${esc(error)}</div>` : ''}
  <div class="grille" style="grid-template-columns:1.5fr .9fr;align-items:start">
    <div class="carte">
      <h2 style="margin-top:0">Informations générales</h2>
      <p class="aide">Commencez par renseigner les informations de base de votre formation.</p>
      <form method="POST" action="/formateur/creer" id="f" enctype="multipart/form-data">
        <label>Titre de la formation *</label>
        <input name="titre" required maxlength="100" placeholder="Ex : Développement Web complet avec Laravel" oninput="ap()">
        <label>Sous-titre</label>
        <input name="sousTitre" maxlength="150" placeholder="Un sous-titre accrocheur pour présenter votre formation" oninput="ap()">
        <div class="grille g2">
          <div><label>Catégorie *</label><select name="categorie" required onchange="ap()">
            <option value="">Sélectionnez une catégorie</option>
            ${CATEGORIES.map(c => `<option value="${c.id}">${esc(c.label)}</option>`).join('')}</select></div>
          <div><label>Niveau *</label><select name="niveau" required onchange="ap()">
            <option value="">Sélectionnez le niveau</option>
            <option>Débutant</option><option>Intermédiaire</option><option>Avancé</option><option>Tous niveaux</option></select></div>
          <div><label>Langue *</label><select name="langue" required onchange="ap()">
            <option>Français</option><option>Créole haïtien</option><option>Anglais</option><option>Espagnol</option></select></div>
          <div><label>Durée estimée</label><input name="duree" placeholder="Ex : 4 mois" oninput="ap()"></div>
        </div>
        <div class="grille g2">
          <div><label>Format du parcours *</label><select name="format" required>
            ${FORMATS.map(f => `<option value="${f.id}" ${f.id === 'certificat_pro' ? 'selected' : ''}>${esc(f.label)} — ${esc(f.duree)}</option>`).join('')}</select></div>
          <div><label>Modalité *</label><select name="modalite" required id="modalite"
            onchange="document.getElementById('bloc-lieu').style.display = this.value === 'en_ligne' ? 'none' : 'block'">
            ${MODALITES.map(m => `<option value="${m.id}">${esc(m.label)} — ${esc(m.description)}</option>`).join('')}</select></div>
        </div>
        <div id="bloc-lieu" style="display:none">
          <label>Lieu de pratique</label>
          <input name="lieuPratique" maxlength="120" placeholder="Ex : Atelier Oasis — Port-au-Prince, ou garage partenaire">
          <p class="aide">Où se déroulent les travaux pratiques : centre Oasis, atelier ou entreprise partenaire.</p>
        </div>
        <div class="panneau" style="margin-top:14px">
          <b>🧰 Socle « métier + numérique + entrepreneuriat »</b>
          <p class="aide" style="margin:3px 0 9px">Cochez les blocs transversaux inclus. La compétence technique
          seule ne suffit pas à vivre de son métier : devis, clients, gestion et visibilité font la différence.</p>
          <div class="grille g2" style="gap:6px">
            ${SOCLE_TRANSVERSAL.map(b => `<label style="display:flex;gap:8px;align-items:flex-start;font-weight:500;margin:0">
              <input type="checkbox" name="socle_${b.id}" style="width:auto;margin-top:3px">
              <span><b style="font-size:13px">${b.emoji} ${esc(b.label)}</b>
              <br><small class="aide">${esc(b.resume)}</small></span></label>`).join('')}
          </div>
        </div>
        <div class="grille g2">
          <div><label>Prix (HTG) *</label><input name="prix" type="number" min="0" step="50" required placeholder="Ex : 2500"></div>
          <div><label>Prix barré (facultatif)</label><input name="prixBarre" type="number" min="0" step="50" placeholder="Ex : 4000"></div>
        </div>
        <label>Description *</label>
        <textarea name="description" rows="5" required maxlength="2000"
          placeholder="Décrivez votre formation, ce que les apprenants vont apprendre, les objectifs…" oninput="ap()"></textarea>
        <label>Image de couverture</label>
        <input name="image" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onchange="apImg(this)">
        <p class="aide">Format recommandé : 1280×720 px (16:9) — JPG, PNG, WebP (max. 5 Mo). Facultatif : sans image, un visuel de catégorie est utilisé.</p>
        <div style="margin-top:18px;display:flex;gap:10px">
          <a class="btn ligne" href="/formateur/formations">Annuler</a>
          <button class="btn violet">Enregistrer et continuer →</button>
        </div>
      </form>
    </div>
    <div class="carte">
      <h2 style="margin-top:0">Aperçu de la formation</h2>
      <p class="aide">Voici un aperçu de votre formation.</p>
      <div style="height:110px;background:#E8F4FE;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:36px;margin:10px 0;background-size:cover;background-position:center" id="apEmoji">🖼️</div>
      <b id="apTitre">Titre de votre formation apparaîtra ici</b>
      <p class="aide" id="apSous">Votre sous-titre apparaîtra ici</p>
      <p class="aide" style="margin-top:8px">👤 Formateur : <b style="color:var(--violet)">${esc(user.name)}</b><br>
      🏷️ <span id="apCat">Catégorie : —</span><br>📶 <span id="apNiv">Niveau : —</span><br>
      ⏱️ <span id="apDur">Durée : —</span> · 🌐 <span id="apLan">Langue : —</span></p>
      <div class="panneau" style="margin-top:12px">💡 <b>Astuces</b><br>
      <small class="aide">Prenez le temps de bien structurer votre formation pour offrir la meilleure expérience à vos apprenants.</small></div>
    </div>
  </div>
  <script>
  const EMO=${JSON.stringify(Object.fromEntries(CATEGORIES.map(c => [c.id, c.emoji])))};
  function ap(){const f=document.getElementById('f');
  document.getElementById('apTitre').textContent=f.titre.value||'Titre de votre formation apparaîtra ici';
  document.getElementById('apSous').textContent=f.sousTitre.value||'Votre sous-titre apparaîtra ici';
  document.getElementById('apCat').textContent='Catégorie : '+(f.categorie.selectedOptions[0]?.textContent||'—');
  document.getElementById('apNiv').textContent='Niveau : '+(f.niveau.value||'—');
  document.getElementById('apDur').textContent='Durée : '+(f.duree.value||'—');
  document.getElementById('apLan').textContent='Langue : '+(f.langue.value||'—');
  document.getElementById('apEmoji').textContent=EMO[f.categorie.value]||'🖼️';}
  function apImg(inp){const e=document.getElementById('apEmoji');
  if(inp.files&&inp.files[0]){e.style.backgroundImage='url('+URL.createObjectURL(inp.files[0])+')';e.textContent='';}
  else{e.style.backgroundImage='';ap();}}
  </script>`, { sousTitre: 'Formateur' });
}

/* ---- Formulaire d'ajout d'une question de quiz (module ou examen final) ---- */
function formQuestion(action) {
  return `<form method="POST" action="${action}" style="margin-top:8px;border-top:1px dashed var(--ligne);padding-top:8px">
    <input name="question" required maxlength="300" placeholder="Nouvelle question…">
    <div class="grille g2" style="margin-top:6px;gap:6px">
      <input name="opt1" required maxlength="150" placeholder="Réponse A *">
      <input name="opt2" required maxlength="150" placeholder="Réponse B *">
      <input name="opt3" maxlength="150" placeholder="Réponse C (facultatif)">
      <input name="opt4" maxlength="150" placeholder="Réponse D (facultatif)">
    </div>
    <div style="display:flex;gap:8px;margin-top:6px;align-items:center">
      <select name="bonne" style="max-width:230px">
        <option value="1">Bonne réponse : A</option><option value="2">Bonne réponse : B</option>
        <option value="3">Bonne réponse : C</option><option value="4">Bonne réponse : D</option>
      </select>
      <button class="btn ligne petit">+ Ajouter la question</button>
    </div></form>`;
}

/* ---- Gestion d'une formation (étape 2 : contenu) ---- */
function gererFormation(user, c, flash, annonces = []) {
  const cat = categorie(c.categorie);
  return shell('Gérer — ' + c.titre, user, MENU_F, '/formateur/formations', `
  <a href="/formateur/formations" style="font-size:13.5px">← Retour à mes formations</a>
  <h1>${cat.emoji} ${esc(c.titre)}</h1>
  <p class="sous">${esc(c.sousTitre || '')} —
    <span class="badge ${c.statut === 'publiee' ? 'b-vert' : 'b-orange'}">${c.statut === 'publiee' ? 'Publiée' : c.statut === 'en_verification' ? '🔎 En vérification' : 'Brouillon'}</span>
    · ${fmtHTG(c.prix)} · ${nbInscrits(c.id)} inscrit(s)</p>
  <div class="etapes">
    <span class="et on"><i>✓</i> Informations</span><span class="tiret"></span>
    <span class="et on"><i>2</i> Contenu</span><span class="tiret"></span>
    <span class="et ${c.statut === 'publiee' ? 'on' : ''}"><i>3</i> Publication</span>
  </div>
  ${flash ? `<div class="alerte ok">${esc(flash)}</div>` : ''}
  <div class="grille" style="grid-template-columns:1.5fr .9fr;align-items:start">
    <div>
      ${c.modules.map((m, i) => `<div class="carte" style="margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <b>Module ${i + 1} — ${esc(m.titre)}</b>
          <form method="POST" action="/formateur/formation/${c.id}/module/${m.id}/supprimer">
            <button class="btn petit" style="background:var(--rouge)">Supprimer</button></form></div>
        ${m.lecons.map(l => `<div class="lecon-row"><span>▸ <b>${esc(l.titre)}</b>
          <small style="color:var(--sourd)"> · ${l.duree} min</small><br>
          <small style="color:var(--sourd)">${esc(String(l.contenu).slice(0, 110))}${String(l.contenu).length > 110 ? '…' : ''}</small></span></div>`).join('')}
        <form method="POST" action="/formateur/formation/${c.id}/module/${m.id}/lecon" style="margin-top:10px">
          <div class="grille" style="grid-template-columns:1.3fr .5fr">
            <input name="titre" required placeholder="Titre de la nouvelle leçon" maxlength="120">
            <input name="duree" type="number" min="1" value="10" title="Durée (min)"></div>
          <textarea name="contenu" rows="2" required placeholder="Contenu de la leçon (texte, lien vidéo YouTube…)" style="margin-top:8px"></textarea>
          <button class="btn ligne petit" style="margin-top:8px">+ Ajouter la leçon</button>
        </form>

        <div class="panneau" style="margin-top:12px">
          <b>📎 Ressources du module</b> <small class="aide">(PDF, image, vidéo MP4/WebM, audio MP3)</small>
          ${(m.fichiers || []).map(f => `<div style="border-bottom:1px solid var(--ligne);padding:6px 2px">
            <div style="display:flex;justify-content:space-between;gap:8px;align-items:center">
            <span>${f.type === 'lien' ? '🔗' : f.type === 'pdf' ? '📄' : f.type === 'video' ? '🎬' : f.type === 'audio' ? '🎧' : '🖼️'}
              <a href="${esc(f.url)}" target="_blank"><b>${esc(f.titreAffiche || f.nomOriginal)}</b></a>
              <small class="aide">${f.type === 'lien' ? esc(String(f.url).replace(/^https?:\/\//, '').slice(0, 38)) : '(' + (f.taille / 1024 / 1024).toFixed(1) + ' Mo)'}</small>
              ${f.description ? `<br><small class="aide">📝 ${esc(String(f.description).slice(0, 85))}${String(f.description).length > 85 ? '…' : ''}</small>` : ''}</span>
            <form method="POST" action="/formateur/formation/${c.id}/module/${m.id}/fichier/${f.id}/supprimer">
              <button class="btn-sup" style="background:none;border:none;color:var(--rouge);cursor:pointer;font-weight:700">✕</button></form>
            </div>
            <details style="margin-top:2px"><summary style="cursor:pointer;font-size:12px;color:var(--violet)">⚙️ Paramétrer l'affichage pour les apprenants</summary>
              <form method="POST" action="/formateur/formation/${c.id}/module/${m.id}/fichier/${f.id}/parametres" style="margin-top:6px">
                <input name="titre" maxlength="120" value="${esc(f.titreAffiche || f.nomOriginal)}" placeholder="Titre affiché aux apprenants">
                <input name="description" maxlength="500" value="${esc(f.description || '')}" style="margin-top:6px"
                  placeholder="Description pédagogique : à quoi sert cette ressource, quand la consulter…">
                <button class="btn ligne petit" style="margin-top:6px">Enregistrer</button>
              </form></details>
          </div>`).join('') || '<p class="aide" style="margin:6px 0">Aucune ressource.</p>'}
          <form method="POST" action="/formateur/formation/${c.id}/module/${m.id}/fichier"
            enctype="multipart/form-data" style="display:flex;gap:8px;margin-top:8px;align-items:center">
            <input name="fichier" type="file" required style="flex:1"
              accept="application/pdf,image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,audio/mpeg">
            <button class="btn ligne petit" style="white-space:nowrap">⬆️ Téléverser</button>
          </form>
          <form method="POST" action="/formateur/formation/${c.id}/module/${m.id}/lien" style="margin-top:8px">
            <div style="display:flex;gap:6px;flex-wrap:wrap">
              <input name="url" required placeholder="https://… (article, vidéo YouTube, document en ligne)" style="flex:2;min-width:190px">
              <input name="titre" maxlength="120" placeholder="Titre affiché" style="flex:1;min-width:120px">
              <button class="btn ligne petit" style="white-space:nowrap">🔗 Ajouter le lien</button>
            </div>
            <input name="description" maxlength="500" placeholder="Description pour les apprenants (facultatif)" style="margin-top:6px">
          </form>
        </div>

        <div class="panneau" style="margin-top:10px">
          <b>📝 Quiz du module</b>
          ${(m.quiz && m.quiz.questions || []).map((q, qi) => `<div class="lecon-row">
            <span><b>Q${qi + 1}.</b> ${esc(q.question)}<br>
            <small class="aide">${q.options.map((o, oi) =>
              (oi === q.bonne ? '✅ ' : '· ') + esc(o)).join(' &nbsp; ')}</small></span>
            <form method="POST" action="/formateur/formation/${c.id}/module/${m.id}/quiz/${q.id}/supprimer">
              <button style="background:none;border:none;color:var(--rouge);cursor:pointer;font-weight:700">✕</button></form>
          </div>`).join('') || '<p class="aide" style="margin:6px 0">Aucune question — les apprenants verront le quiz dès la première question ajoutée.</p>'}
          ${formQuestion(`/formateur/formation/${c.id}/module/${m.id}/quiz`)}
        </div>

        <div class="panneau" style="margin-top:10px">
          <b>🎯 Compétences visées par ce module</b>
          <form method="POST" action="/formateur/formation/${c.id}/module/${m.id}/competences" style="display:flex;gap:8px;margin-top:8px;align-items:center">
            <input name="competences" value="${esc((m.competences || []).join(', '))}"
              placeholder="Compétences séparées par des virgules (ex : Maîtriser RECHERCHEX, Construire un TCD)">
            <button class="btn ligne petit" style="white-space:nowrap">Enregistrer</button>
          </form>
          <p class="aide" style="margin-top:6px">Une compétence est marquée « acquise » quand l'apprenant a terminé
          toutes les leçons du module et réussi son quiz (s'il existe).</p>
        </div>
      </div>`).join('')}
      <div class="carte">
        <b>Nouveau module</b>
        <form method="POST" action="/formateur/formation/${c.id}/module" style="display:flex;gap:10px;margin-top:8px">
          <input name="titre" required placeholder="Titre du module (ex : Introduction)" maxlength="120">
          <button class="btn violet petit" style="white-space:nowrap">+ Ajouter</button></form>
      </div>
    </div>
    <div>
      <div class="carte">
        <h2 style="margin-top:0">Publication</h2>
        <p class="aide">${c.modules.length} module(s) · ${nbLecons(c)} leçon(s) · Statut :
          <span class="badge ${c.statut === 'publiee' ? 'b-vert' : 'b-orange'}">${c.statut === 'publiee' ? 'Publiée' : c.statut === 'en_verification' ? '🔎 En vérification' : c.statut === 'archivee' ? 'Archivée' : 'Brouillon'}</span></p>
        ${c.statut === 'en_verification' ? `<p class="aide">Soumise le ${(c.moderation && c.moderation.soumiseLe || '').slice(0, 10)} —
          l'administration vérifie votre formation avant publication (délai habituel : 48 h).</p>` : ''}
        ${c.moderation && c.moderation.decision === 'renvoyee' && c.statut === 'brouillon' ? `
          <div class="alerte ko" style="font-size:13.5px"><b>Renvoyée par l'administration le ${c.moderation.decideeLe.slice(0, 10)}</b>${c.moderation.commentaire ? ' — ' + esc(c.moderation.commentaire) : ''}<br>
          Apportez les corrections demandées puis soumettez de nouveau.</div>` : ''}
        <form method="POST" action="/formateur/formation/${c.id}/statut" style="margin-top:10px">
          ${c.statut === 'publiee'
            ? '<button name="statut" value="brouillon" class="btn ligne" style="width:100%">Repasser en brouillon</button>'
            : c.statut === 'en_verification'
            ? '<button name="statut" value="brouillon" class="btn ligne" style="width:100%">Annuler la soumission (retour brouillon)</button>'
            : `<button name="statut" value="publiee" class="btn vert" style="width:100%" ${nbLecons(c) < 1 ? 'disabled' : ''}>${user.role === 'admin' ? '🚀 Publier la formation' : '📋 Soumettre à vérification'}</button>`}
        </form>
        <p style="margin-top:12px"><a href="/formation/${c.id}" class="aide">Voir la page publique →</a></p>
      </div>
      <div class="carte" style="margin-top:14px">
        <h2 style="margin-top:0">🖼️ Image de couverture</h2>
        <div style="height:110px;border-radius:10px;background:#E8F4FE ${c.image ? `url('${esc(c.image)}') center/cover` : ''};display:flex;align-items:center;justify-content:center;font-size:30px">${c.image ? '' : '🖼️'}</div>
        <form method="POST" action="/formateur/formation/${c.id}/image" enctype="multipart/form-data" style="margin-top:10px">
          <input name="image" type="file" required accept="image/jpeg,image/png,image/webp,image/gif">
          <button class="btn violet petit" style="margin-top:8px;width:100%">${c.image ? 'Remplacer l\u2019image' : 'Ajouter l\u2019image'}</button>
        </form>
        <p class="aide" style="margin-top:6px">1280×720 px recommandé — JPG, PNG, WebP (max. 5 Mo).</p>
      </div>
      <div class="carte" style="margin-top:14px;border-color:var(--orange)">
        <h2 style="margin-top:0">🎓 Évaluation finale — épreuves</h2>
        <p class="aide">Composez l'examen : quiz, textes à trous (auto-corrigés), réponses élaborées,
        exercices pratiques, présentations, travaux communs, projet final (corrigés par vous).
        La note d'examen = moyenne pondérée des épreuves.</p>
        ${epreuvesDe(c).map(ep => `<div class="panneau" style="margin-top:10px">
          <div style="display:flex;justify-content:space-between;gap:8px;align-items:center">
            <span><span class="badge b-orange">${esc((TYPES_EPREUVES[ep.type] || {}).label || ep.type)}</span>
              <b> ${esc(ep.titre)}</b> <small class="aide">· poids ${ep.poids} %
              ${(TYPES_EPREUVES[ep.type] || {}).auto ? '· auto-corrigée' : '· correction manuelle'}</small></span>
            <form method="POST" action="/formateur/formation/${c.id}/epreuve/${ep.id}/supprimer">
              <button style="background:none;border:none;color:var(--rouge);cursor:pointer;font-weight:700">✕</button></form>
          </div>
          ${ep.consigne ? `<p class="aide" style="margin-top:4px">${esc(ep.consigne)}</p>` : ''}
          ${ep.type === 'trous' ? `<p class="aide" style="margin-top:4px"><code>${esc(String(ep.texte || '').slice(0, 140))}…</code></p>` : ''}
          ${ep.type === 'qcm' ? `
            ${(ep.questions || []).map((q, qi) => `<div class="lecon-row"><span><b>Q${qi + 1}.</b> ${esc(q.question)}<br>
              <small class="aide">${q.options.map((o, oi) => (oi === q.bonne ? '✅ ' : '· ') + esc(o)).join(' &nbsp; ')}</small></span>
              <form method="POST" action="/formateur/formation/${c.id}/epreuve/${ep.id}/question/${q.id}/supprimer">
                <button style="background:none;border:none;color:var(--rouge);cursor:pointer;font-weight:700">✕</button></form></div>`).join('')}
            ${formQuestion(`/formateur/formation/${c.id}/epreuve/${ep.id}/question`)}` : ''}
        </div>`).join('') || '<p class="aide">Aucune épreuve — le certificat ne dépendra que des quiz de modules.</p>'}
        <form method="POST" action="/formateur/formation/${c.id}/epreuve" style="border-top:1px dashed var(--ligne);margin-top:12px;padding-top:10px">
          <b>➕ Ajouter une épreuve</b>
          <div class="grille g2" style="margin-top:6px;gap:6px">
            <select name="type">${Object.entries(TYPES_EPREUVES).map(([k, v]) =>
              `<option value="${k}">${esc(v.label)}${v.auto ? ' (auto)' : ''}</option>`).join('')}</select>
            <input name="poids" type="number" min="1" max="100" value="20" title="Poids (%)">
          </div>
          <input name="titre" required maxlength="120" placeholder="Titre de l'épreuve" style="margin-top:6px">
          <textarea name="consigne" rows="2" maxlength="2000" placeholder="Consignes pour l'apprenant…" style="margin-top:6px"></textarea>
          <textarea name="texte" rows="2" maxlength="3000" style="margin-top:6px"
            placeholder="Texte à trous uniquement : entourez chaque mot attendu de {{doubles accolades}}."></textarea>
          <button class="btn violet petit" style="margin-top:8px">Créer l'épreuve</button>
        </form>
        <p style="margin-top:12px">
          <a class="btn ligne petit" href="/formateur/formation/${c.id}/corrections">✍️ Copies à corriger →</a></p>
      </div>
      <div class="carte" style="margin-top:14px">
        <h2 style="margin-top:0">⚖️ Barème d'évaluation</h2>
        <p class="aide">Note globale = quiz de modules × poids quiz + examen final × poids examen.
        Le certificat exige la note globale ≥ seuil.</p>
        <form method="POST" action="/formateur/formation/${c.id}/evaluation">
          <label>Poids des quiz de modules (%) — l'examen final reçoit le reste</label>
          <input name="poidsQuiz" type="number" min="0" max="100" value="${(c.evaluation && c.evaluation.poidsQuiz) ?? 40}">
          <label>Seuil de réussite (%)</label>
          <input name="seuil" type="number" min="10" max="100" value="${(c.evaluation && c.evaluation.seuil) ?? 60}">
          <label style="display:flex;gap:8px;align-items:center;font-weight:600">
            <input type="checkbox" name="melanger" style="width:auto" ${(c.evaluation ? c.evaluation.melanger !== false : true) ? 'checked' : ''}>
            Mélanger l'ordre des questions et des réponses</label>
          <button class="btn violet petit" style="margin-top:12px">Enregistrer le barème</button>
        </form>
        <p style="margin-top:12px"><a class="btn ligne petit" href="/formateur/formation/${c.id}/notes">📊 Carnet de notes des apprenants →</a></p>
      </div>
      <div class="carte" style="margin-top:14px">
        <h2 style="margin-top:0">📣 Annonces aux apprenants</h2>
        ${annonces.map(a => `<div class="lecon-row"><span><b>${esc(a.titre)}</b>
          <small class="aide"> · ${a.createdAt.slice(0, 10)}</small><br>
          <small>${esc(String(a.contenu).slice(0, 100))}${a.contenu.length > 100 ? '…' : ''}</small></span>
          <form method="POST" action="/formateur/formation/${c.id}/annonce/${a.id}/supprimer">
            <button style="background:none;border:none;color:var(--rouge);cursor:pointer;font-weight:700">✕</button></form>
        </div>`).join('') || '<p class="aide">Aucune annonce publiée.</p>'}
        <form method="POST" action="/formateur/formation/${c.id}/annonce" style="margin-top:8px">
          <input name="titre" required maxlength="120" placeholder="Titre de l'annonce">
          <textarea name="contenu" rows="3" required maxlength="1500" placeholder="Message aux apprenants inscrits…" style="margin-top:6px"></textarea>
          <button class="btn violet petit" style="margin-top:8px">Publier l'annonce</button>
        </form>
        <p style="margin-top:10px"><a class="btn ligne petit" href="/cours/${c.id}/forum">💬 Forum de la formation →</a></p>
      </div>
      <div class="carte" style="margin-top:14px">
        <h2 style="margin-top:0">Modifier les informations</h2>
        <form method="POST" action="/formateur/formation/${c.id}/infos">
          <label>Titre</label><input name="titre" value="${esc(c.titre)}" required maxlength="100">
          <label>Prix (HTG)</label><input name="prix" type="number" min="0" value="${c.prix}" required>
          <label>Description</label><textarea name="description" rows="4" maxlength="2000">${esc(c.description)}</textarea>
          <div class="grille g2">
            <div><label>Format du parcours</label><select name="format">
              ${FORMATS.map(f => `<option value="${f.id}" ${(c.format || 'certificat_pro') === f.id ? 'selected' : ''}>${esc(f.label)} — ${esc(f.duree)}</option>`).join('')}</select></div>
            <div><label>Modalité</label><select name="modalite">
              ${MODALITES.map(m => `<option value="${m.id}" ${(c.modalite || 'en_ligne') === m.id ? 'selected' : ''}>${esc(m.label)}</option>`).join('')}</select></div>
          </div>
          <label>Lieu de pratique</label>
          <input name="lieuPratique" maxlength="120" value="${esc(c.lieuPratique || '')}"
            placeholder="Atelier, centre ou entreprise partenaire">
          <label>Socle transversal</label>
          <div class="grille g2" style="gap:5px">
            ${SOCLE_TRANSVERSAL.map(b => `<label style="display:flex;gap:7px;align-items:center;font-weight:500;margin:0;font-size:13px">
              <input type="checkbox" name="socle_${b.id}" style="width:auto" ${(c.socle || []).includes(b.id) ? 'checked' : ''}>
              ${b.emoji} ${esc(b.label)}</label>`).join('')}
          </div>
          <button class="btn violet petit" style="margin-top:12px">Enregistrer</button>
        </form>
      </div>
    </div>
  </div>`, { sousTitre: 'Formateur' });
}

function revenusF(user, d, flash) {
  return shell('Mes revenus', user, MENU_F, '/formateur/revenus', `
  <h1>Mes revenus</h1>
  <p class="sous">Ventes, commission plateforme (15 %) et retraits vers votre portefeuille mobile.</p>
  ${flash ? `<div class="alerte ok">${esc(flash)}</div>` : ''}
  <div class="grille g3">
    <div class="carte stat-carte"><span class="lib">Revenus totaux (85 %)</span><span class="val">${fmtHTG(d.revenusTotaux)}</span></div>
    <div class="carte stat-carte"><span class="lib">Solde disponible</span><span class="val">${fmtHTG(user.balance || 0)}</span></div>
    <div class="carte stat-carte"><span class="lib">Déjà retiré</span><span class="val">${fmtHTG(d.totalRetraits)}</span></div>
  </div>
  <div class="grille g2" style="margin-top:16px">
    <div class="carte">
      <h2 style="margin-top:0">Transactions</h2>
      <table><tr><th>Date</th><th>Formation</th><th>Brut</th><th>Net (85 %)</th></tr>
      ${d.ventes.map(o => `<tr><td>${o.createdAt.slice(0, 10)}</td><td>${esc(o.coursTitre)}</td>
        <td class="num">${fmtHTG(o.amount)}</td><td class="num" style="color:var(--vert)"><b>+${fmtHTG(o.net)}</b></td></tr>`).join('')}
      </table>${!d.ventes.length ? '<p class="aide" style="padding:12px">Aucune vente encore.</p>' : ''}
    </div>
    <div class="carte">
      <h2 style="margin-top:0">Retraits — versement mobile instantané</h2>
      <form method="POST" action="/formateur/retrait" class="panneau">
        <div class="grille g3" style="gap:10px">
          <div><label style="margin-top:0">Montant (HTG)</label>
            <input name="montant" type="number" min="500" max="${user.balance || 0}" required placeholder="Min. 500 HTG"></div>
          <div><label style="margin-top:0">Portefeuille</label>
            <select name="methode">
              <option value="moncash" ${user.walletMethode !== 'natcash' ? 'selected' : ''}>MonCash</option>
              <option value="natcash" ${user.walletMethode === 'natcash' ? 'selected' : ''}>NatCash</option>
            </select></div>
          <div><label style="margin-top:0">Numéro du portefeuille</label>
            <input name="numero" inputmode="numeric" required placeholder="509 XXXX XXXX"
              value="${esc(user.walletNumber || '')}"></div>
        </div>
        <button class="btn vert" style="margin-top:10px">💸 Retirer mes fonds</button>
        <p class="aide" style="margin-top:6px">Le versement est exécuté immédiatement par la passerelle ;
        votre solde n'est débité que si le versement est confirmé.</p>
      </form>
      <table style="margin-top:10px"><tr><th>Date</th><th>Montant</th><th>Portefeuille</th><th>Statut</th><th>Référence</th></tr>
      ${d.retraits.map(r => `<tr><td>${r.createdAt.slice(0, 10)}</td><td class="num">${fmtHTG(r.amount)}</td>
        <td>${esc(r.numero || '—')}${r.methode ? ' <small class="aide">' + (r.methode === 'natcash' ? 'NatCash' : 'MonCash') + '</small>' : ''}</td>
        <td><span class="badge ${r.status === 'verse' ? 'b-vert' : 'b-orange'}">${r.status === 'verse' ? 'Versé ✓' : 'En cours'}</span></td>
        <td><code style="font-size:12px">${esc(r.providerTxnId || '—')}</code></td></tr>`).join('')}
      </table>${!d.retraits.length ? '<p class="aide" style="padding:12px">Aucun retrait effectué.</p>' : ''}
    </div>
  </div>`, { sousTitre: 'Formateur' });
}

function abonnesF(user, list) {
  return shell('Abonnés', user, MENU_F, '/formateur/abonnes', `
  <h1>Abonnés</h1>
  <p class="sous">${list.length} apprenant(s) inscrit(s) à vos formations.</p>
  <div class="carte" style="padding:8px 14px">
  <table><tr><th>Apprenant</th><th>Formation</th><th>Progression</th><th>Inscription</th></tr>
  ${list.map(e => `<tr><td>${esc(e.userName)}</td><td>${esc(e.coursTitre)}</td>
    <td><div style="display:flex;gap:8px;align-items:center"><div class="barre"><i style="width:${e.pct}%"></i></div>${e.pct}%</div></td>
    <td>${e.createdAt.slice(0, 10)}</td></tr>`).join('')}</table>
  ${!list.length ? '<p class="aide" style="padding:14px">Aucun abonné pour le moment.</p>' : ''}</div>`,
  { sousTitre: 'Formateur' });
}

function avisF(user, list) {
  return shell('Avis & évaluations', user, MENU_F, '/formateur/avis', `
  <h1>Avis & évaluations</h1>
  <p class="sous">Les retours de vos apprenants, formation par formation.</p>
  ${list.map(a => `<div class="carte" style="margin-bottom:10px">
    <span class="note">${etoiles(a.note)}</span> <b>${esc(a.userName)}</b>
    <span class="aide"> · ${esc(a.coursTitre)} · ${a.createdAt.slice(0, 10)}</span>
    <p style="margin-top:6px">${esc(a.commentaire)}</p></div>`).join('') ||
  '<div class="carte"><p class="aide">Aucun avis pour le moment.</p></div>'}`,
  { sousTitre: 'Formateur' });
}

/* =============== ESPACE APPRENANT =============== */
function dashApprenant(user, list, flash) {
  return shell('Mes formations', user, MENU_A, '/apprenant', `
  <h1>Bonjour, ${esc(user.name.split(' ')[0])} ! 👋</h1>
  <p class="sous">Reprenez vos formations là où vous vous êtes arrêté.</p>
  ${flash ? `<div class="alerte ok">${esc(flash)}</div>` : ''}
  ${list.length ? `<div class="grille g2">${list.map(e => `
    <div class="carte">
      <b>${categorie(e.cours.categorie).emoji} ${esc(e.cours.titre)}</b>
      ${e.source === 'entreprise' ? ' <span class="badge b-vert">Assignée par votre entreprise</span>' : ''}
      <div style="display:flex;gap:10px;align-items:center;margin:12px 0">
        <div class="barre" style="flex:1"><i style="width:${e.pct}%"></i></div><b>${e.pct}%</b></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <a class="btn petit" href="/apprenant/cours/${e.cours.id}">${e.pct === 0 ? 'Commencer' : e.pct === 100 ? 'Revoir' : 'Continuer'} →</a>
        <a class="btn ligne petit" href="/releve/${e.id}">📄 Relevé de notes</a>
        ${e.completedAt ? `<a class="btn vert petit" href="/certificat/${e.id}">🎖️ Mon certificat</a>`
          : epreuvesDe(e.cours).length
            ? `<a class="btn petit" style="background:var(--orange)" href="/apprenant/cours/${e.cours.id}/examen">🎓 Évaluation finale</a>` : ''}
      </div></div>`).join('')}</div>`
  : `<div class="carte" style="text-align:center;padding:40px">
      <p style="font-size:38px">📚</p><b>Vous n'êtes inscrit à aucune formation.</b>
      <p class="aide" style="margin:8px 0 16px">Explorez le catalogue et développez de nouvelles compétences.</p>
      <a class="btn" href="/formations">Explorer les formations</a></div>`}`,
  { sousTitre: 'Apprenant' });
}

/* ---- Lecteur de cours ---- */
function lecteurCours(user, c, enr, leconActive, annonces = [], bilan = null) {
  const doneSet = new Set(enr.progress);
  const evals = enr.evaluations || {};
  let flat = [];
  c.modules.forEach((m, mi) => m.lecons.forEach(l => flat.push({ m, mi, l })));
  const cur = leconActive || flat.find(x => !doneSet.has(x.l.id)) || flat[0];
  const pct = flat.length ? Math.round(100 * enr.progress.length / flat.length) : 0;
  const aExamen = epreuvesDe(c).length;
  const badgeEval = (r) => r
    ? `<span class="badge ${r.reussi ? 'b-vert' : 'b-rouge'}">${r.score}/${r.total} ${r.reussi ? '✓' : '✗'}</span>`
    : '<span class="badge b-gris">à faire</span>';
  return shell(c.titre, user, MENU_A, '/apprenant', `
  <a href="/apprenant" style="font-size:13.5px">← Mes formations</a>
  <h1 style="font-size:22px">${categorie(c.categorie).emoji} ${esc(c.titre)}</h1>
  <div style="display:flex;gap:10px;align-items:center;margin:8px 0 16px;flex-wrap:wrap">
    <div class="barre" style="flex:1;max-width:340px"><i style="width:${pct}%"></i></div>
    <b>${pct}%</b>
    ${bilan && bilan.aEvaluations ? `<span class="badge ${bilan.note >= bilan.cfg.seuil ? 'b-vert' : 'b-orange'}">Note globale : ${bilan.note}% (seuil ${bilan.cfg.seuil}%)</span>` : ''}
    <a class="btn ligne petit" href="/apprenant/cours/${c.id}/bilan">🎯 Compétences & notes</a>
    <a class="btn ligne petit" href="/cours/${c.id}/forum">💬 Forum</a>
    <a class="btn ligne petit" href="/releve/${enr.id}">📄 Relevé</a>
    ${enr.completedAt ? `<a class="btn vert petit" href="/certificat/${enr.id}">🎖️ Mon certificat</a>`
      : aExamen ? `<a class="btn petit" style="background:var(--orange)" href="/apprenant/cours/${c.id}/examen">🎓 Évaluation finale (${epreuvesDe(c).length} épreuve${epreuvesDe(c).length > 1 ? 's' : ''})</a>` : ''}</div>
  ${annonces.length ? `<div class="carte" style="border-left:4px solid var(--orange);margin-bottom:14px;padding:14px 18px">
    <b>📣 Annonces du formateur</b>
    ${annonces.map(a => `<p style="margin-top:8px"><b>${esc(a.titre)}</b>
      <small class="aide"> · ${a.createdAt.slice(0, 10)}</small><br>${esc(a.contenu)}</p>`).join('')}
  </div>` : ''}
  <div class="grille" style="grid-template-columns:.9fr 1.5fr;align-items:start">
    <div class="carte" style="padding:12px">
      ${c.modules.map((m, mi) => `<b style="display:block;padding:8px 6px 4px;font-size:13.5px">Module ${mi + 1} — ${esc(m.titre)}</b>
        ${m.lecons.map(l => `<a href="/apprenant/cours/${c.id}?lecon=${l.id}"
          class="lecon-row ${doneSet.has(l.id) ? 'done' : ''}" style="text-decoration:none;color:var(--texte);${cur && cur.l.id === l.id ? 'border-color:var(--bleu);box-shadow:0 0 0 1px var(--bleu)' : ''}">
          <span style="font-size:13.5px">${doneSet.has(l.id) ? '✅' : '▸'} ${esc(l.titre)}</span>
          <small style="color:var(--sourd)">${l.duree} min</small></a>`).join('')}
        ${m.quiz && m.quiz.questions && m.quiz.questions.length ? `
        <a href="/apprenant/cours/${c.id}/quiz/${m.id}" class="lecon-row" style="text-decoration:none;color:var(--texte)">
          <span style="font-size:13.5px">📝 Quiz du module</span>${badgeEval(evals[m.id])}</a>` : ''}`).join('')}
      ${aExamen ? `<b style="display:block;padding:10px 6px 4px;font-size:13.5px">Certification</b>
        <a href="/apprenant/cours/${c.id}/examen" class="lecon-row" style="text-decoration:none;color:var(--texte);border-color:var(--orange)">
          <span style="font-size:13.5px">🎓 Évaluation finale — ${epreuvesDe(c).length} épreuve(s)</span>
          ${bilan && bilan.aExam ? (bilan.examFait ? `<span class="badge ${bilan.pctExam >= 60 ? 'b-vert' : 'b-rouge'}">${bilan.pctExam} %</span>` : '<span class="badge b-orange">en cours</span>') : ''}</a>` : ''}
    </div>
    <div class="carte">
      ${cur ? `<span class="badge b-bleu">Module ${cur.mi + 1} — ${esc(cur.m.titre)}</span>
      <h2 style="margin:10px 0">${esc(cur.l.titre)}</h2>
      <p style="white-space:pre-wrap">${esc(cur.l.contenu)}</p>
      ${(cur.m.fichiers || []).length ? `<h2 style="font-size:15px">📎 Ressources du module</h2>
        ${cur.m.fichiers.map(f => {
          const titre = esc(f.titreAffiche || f.nomOriginal);
          const desc = f.description ? `<p class="aide" style="margin:2px 0 8px">📝 ${esc(f.description)}</p>` : '';
          if (f.type === 'lien') {
            const yt = String(f.url).match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{6,})/);
            if (yt) return `<div style="margin:10px 0"><b style="font-size:14px">▶️ ${titre}</b>${desc}
              <iframe src="https://www.youtube.com/embed/${yt[1]}" style="width:100%;aspect-ratio:16/9;border:0;border-radius:10px;background:#000" allowfullscreen loading="lazy"></iframe></div>`;
            return `<div class="panneau" style="margin:8px 0"><b style="font-size:14px">🔗 ${titre}</b>${desc}
              <a class="btn ligne petit" href="${esc(f.url)}" target="_blank" rel="noopener">Ouvrir la ressource ↗</a></div>`;
          }
          if (f.type === 'video') return `<div style="margin:10px 0"><b style="font-size:14px">🎬 ${titre}</b>${desc}
            <video controls preload="metadata" style="width:100%;border-radius:10px;background:#000"><source src="${esc(f.url)}" type="${esc(f.mime)}"></video></div>`;
          if (f.type === 'image') return `<div style="margin:10px 0"><b style="font-size:14px">🖼️ ${titre}</b>${desc}
            <img src="${esc(f.url)}" alt="${titre}" style="max-width:100%;border-radius:10px"></div>`;
          if (f.type === 'audio') return `<div style="margin:10px 0"><b style="font-size:14px">🎧 ${titre}</b>${desc}
            <audio controls src="${esc(f.url)}" style="width:100%"></audio></div>`;
          return `<div class="panneau" style="margin:8px 0"><b style="font-size:14px">📄 ${titre}</b>
            <small class="aide">(${(f.taille / 1024 / 1024).toFixed(1)} Mo)</small>${desc}
            <a class="btn ligne petit" href="${esc(f.url)}" target="_blank">Télécharger / ouvrir ↗</a></div>`;
        }).join('')}` : ''}
      ${!doneSet.has(cur.l.id) ? `<form method="POST" action="/apprenant/cours/${c.id}/terminer" style="margin-top:18px">
        <input type="hidden" name="lecon" value="${cur.l.id}">
        <button class="btn vert">✓ Marquer la leçon comme terminée</button></form>`
      : '<p class="alerte ok" style="margin-top:18px">Leçon terminée ✓</p>'}` : '<p class="aide">Cette formation n\u2019a pas encore de contenu.</p>'}
    </div>
  </div>`, { sousTitre: 'Apprenant' });
}

/* ---- Page de quiz (module ou évaluation finale) ---- */
function pageQuiz(user, c, cible, quiz, resultat, dernierResultat, melanger = false, bilan = null) {
  const melange = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const questionsAff = melanger ? melange(quiz.questions) : quiz.questions;
  const estFinal = cible === 'final';
  const titre = estFinal ? '🎓 Évaluation finale' : '📝 Quiz du module';
  return shell(titre + ' — ' + c.titre, user, MENU_A, '/apprenant', `
  <a href="/apprenant/cours/${c.id}" style="font-size:13.5px">← Retour à la formation</a>
  <h1 style="font-size:22px">${titre}</h1>
  <p class="sous">${esc(c.titre)} — ${quiz.questions.length} question(s)${estFinal ? ' · 60 % requis pour le certificat' : ''}.
  ${dernierResultat ? ` Dernier résultat : <b>${dernierResultat.score}/${dernierResultat.total}</b> (${dernierResultat.pct}%).` : ''}</p>
  ${resultat && bilan && bilan.aEvaluations ? `<p><span class="badge ${bilan.note >= bilan.cfg.seuil ? 'b-vert' : 'b-orange'}" style="font-size:14px">Note globale de la formation : ${bilan.note} % (seuil : ${bilan.cfg.seuil} %)</span></p>` : ''}
  ${resultat ? `<div class="alerte ${resultat.reussi ? 'ok' : 'ko'}" style="font-size:15px">
    ${resultat.reussi ? '🎉 Réussi !' : 'Insuffisant —'} Votre score : <b>${resultat.score}/${resultat.total}</b> (${resultat.pct}%).
    ${estFinal ? (resultat.reussi ? ' Votre certificat est disponible dès que toutes les leçons sont terminées.' : ' Il faut 60 % — révisez puis réessayez, le meilleur score est conservé.') : ''}
    </div>
    <p><a class="btn" href="/apprenant/cours/${c.id}">Retour à la formation</a>
    ${!resultat.reussi ? `<a class="btn ligne" href="/apprenant/cours/${c.id}/quiz/${cible}" style="margin-left:8px">Réessayer</a>` : ''}</p>`
  : `<div class="carte"><form method="POST" action="/apprenant/cours/${c.id}/quiz/${cible}">
    ${questionsAff.map((q, qi) => {
      const opts = q.options.map((o, oi) => ({ o, oi }));
      const optsAff = melanger ? melange(opts) : opts;
      return `<div style="margin-bottom:18px">
      <b>Question ${qi + 1}.</b> ${esc(q.question)}
      ${optsAff.map(({ o, oi }) => `<label style="display:flex;gap:8px;align-items:center;font-weight:500;margin:6px 0;padding:9px 12px;border:1.5px solid var(--ligne);border-radius:9px;cursor:pointer">
        <input type="radio" name="q_${q.id}" value="${oi}" required style="width:auto"> ${esc(o)}</label>`).join('')}
    </div>`; }).join('')}
    <button class="btn" style="width:100%">Valider mes réponses</button>
  </form></div>`}`, { sousTitre: 'Apprenant' });
}

function certificatsA(user, list) {
  return shell('Mes certificats', user, MENU_A, '/apprenant/certificats', `
  <h1>Mes certificats</h1>
  <p class="sous">Vos certificats de réussite, prêts à imprimer ou partager.</p>
  ${list.length ? `<div class="grille g2">${list.map(e => `<div class="carte" style="display:flex;justify-content:space-between;align-items:center;gap:10px">
    <span>🎖️ <b>${esc(e.cours.titre)}</b><br><small class="aide">Terminée le ${e.completedAt.slice(0, 10)}</small></span>
    <a class="btn vert petit" href="/certificat/${e.id}">Voir le certificat</a>
    <a class="btn ligne petit" href="/releve/${e.id}" style="margin-left:6px">📄 Relevé de notes</a></div>`).join('')}</div>`
  : '<div class="carte"><p class="aide">Terminez une formation à 100 % pour obtenir votre premier certificat.</p></div>'}`,
  { sousTitre: 'Apprenant' });
}

function certificat(enr, cours, user, formateur, bilan = null, params = {}, qr = null) {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><title>Certificat — ${esc(user.name)}</title>
  <style>body{font-family:Georgia,'Times New Roman',serif;background:#F6F9FC;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
  .cert{background:#fff;border:3px solid #001C4A;border-radius:10px;padding:0 0 46px;max-width:780px;
  text-align:center;box-shadow:0 14px 44px rgba(0,28,74,.14);position:relative;overflow:hidden}
  .cert::before{content:'';position:absolute;top:0;left:0;right:0;height:9px;
  background:linear-gradient(90deg,#001C4A 0%,#0166C2 42%,#06C994 76%,#FC9F1E 100%)}
  .cert .dedans{padding:40px 62px 0;position:relative}
  .cert .marque{width:86px;height:86px;object-fit:contain;margin:6px auto 2px;display:block}
  .cert .marque-txt{color:#001C4A;letter-spacing:.11em;font-size:10px;font-weight:700;
  margin:2px auto 0;max-width:430px;line-height:1.5}
  .cert h1{color:#0166C2;letter-spacing:.2em;font-size:17px;margin:10px auto 0;font-weight:700;max-width:430px}
  .cert .grand{font-size:32px;margin:20px 0 6px;color:#0B1F3F}
  .cert .nom{font-size:29px;color:#001C4A;font-style:italic;margin:14px 0;font-weight:bold}
  .cert .ligne{width:220px;border-top:1.5px solid #9AA8BC;margin:34px auto 6px}
  .cert small{color:#6B7A90}
  .cert .qr-coin{position:absolute;top:26px;right:16px;line-height:0;text-align:center;
  border:1px solid #E3EAF3;border-radius:8px;padding:5px 5px 2px;background:#fff}
  .cert .qr-coin span{display:block;font-family:Arial,Helvetica,sans-serif;font-size:9px;
  letter-spacing:.09em;color:#0166C2;text-transform:uppercase;font-weight:700;line-height:1.9}
  @media print{body{background:#fff}.cert{box-shadow:none}.no-print{display:none}}</style></head><body>
  <div class="cert"><div class="dedans">
    ${qr ? `<div class="qr-coin">${qr.svg}<span>Vérifier</span></div>` : ''}
    <img class="marque" src="/assets/logo-oasis.png" alt="">
    <p class="marque-txt">OASIS · CENTRE NUMÉRIQUE DE FORMATION PROFESSIONNELLE</p>
    <h1>CERTIFICAT DE RÉUSSITE</h1>
    <p class="grand">Ce certificat est décerné à</p>
    <p class="nom">${esc(user.name)}</p>
    <p>pour avoir complété avec succès la formation</p>
    <p style="font-size:20px"><b>« ${esc(cours.titre)} »</b></p>
    <p><small>Durée : ${esc(cours.duree)} · Niveau : ${esc(cours.niveau)} · Terminée le ${enr.completedAt.slice(0, 10)}</small></p>
    ${bilan && bilan.aEvaluations ? `<p><small><b>Note globale obtenue : ${bilan.note} %</b> (seuil requis : ${bilan.cfg.seuil} %)</small></p>` : ''}
    <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:20px;margin-top:34px">
      <div style="flex:1;text-align:center">
        <div style="height:64px;display:flex;align-items:flex-end;justify-content:center">
          <img src="${esc(params.signatureUrl || '/assets/signature.png')}" alt="Signature"
            style="max-height:62px;max-width:220px;object-fit:contain"></div>
        <div style="width:200px;border-top:1.5px solid #9AA8BC;margin:4px auto 4px"></div>
        <small><b>${esc(params.signataireNom || 'Michael Jacques')}</b><br>${esc(params.signataireTitre || 'Directeur général — Oasis Centre Numérique de Formation Professionnelle')}</small>
      </div>
      <div style="flex:0 0 auto">
        <img src="${esc(params.sceauUrl || '/assets/sceau-oasis.png')}"
          alt="Sceau officiel Oasis Centre Numérique de Formation Professionnelle"
          style="width:132px;height:132px;object-fit:contain"></div>
      <div style="flex:1;text-align:center">
        <div style="height:64px"></div>
        <div style="width:200px;border-top:1.5px solid #9AA8BC;margin:4px auto 4px"></div>
        <small><b>${esc(formateur.name)}</b><br>Formateur</small>
      </div>
    </div>
    <small style="display:block;margin-top:24px;padding-top:16px;border-top:1px solid #E3EAF3">
      Fait à ${esc(params.villeCertificat || 'Port-au-Prince, Haïti')}, le ${enr.completedAt.slice(0, 10)}
      · Certificat n° ${esc(enr.id).toUpperCase()}<br>
      Authenticité vérifiable en scannant le QR code${qr ? ' ou sur ' + esc(qr.url) : ''}</small>
    <p class="no-print" style="margin-top:24px"><button onclick="print()" style="padding:10px 22px;font-size:15px;cursor:pointer;border:0;border-radius:10px;background:#001C4A;color:#fff;font-weight:600">🖨️ Imprimer / PDF</button>
    <a href="/releve/${esc(enr.id)}" style="margin-left:12px">📄 Relevé de notes</a>
    <a href="/apprenant/certificats" style="margin-left:12px">Retour</a></p>
    </div>
  </div></body></html>`;
}

/* =============== ESPACE ENTREPRISE =============== */
function dashEntreprise(user, d, flash) {
  return shell('Mon académie', user, MENU_E, '/entreprise', `
  <h1>Bienvenue dans votre académie, ${esc(user.companyName || user.name)} 👋</h1>
  <p class="sous">Gérez, suivez et développez les compétences de vos collaborateurs.
    <span class="badge b-vert">Plan ${esc(user.plan || 'entreprise')} — Actif</span></p>
  ${flash ? `<div class="alerte ok">${esc(flash)}</div>` : ''}
  <div class="grille g4">
    <div class="carte stat-carte"><span class="lib">Collaborateurs</span><span class="val">${d.nbCollabs}</span></div>
    <div class="carte stat-carte"><span class="lib">Formations actives</span><span class="val">${d.nbFormations}</span></div>
    <div class="carte stat-carte"><span class="lib">Formations complétées</span><span class="val">${d.nbCompletees}</span></div>
    <div class="carte stat-carte"><span class="lib">Taux de complétion</span><span class="val">${d.tauxCompletion}%</span></div>
  </div>
  <div class="grille g2" style="margin-top:16px">
    <div class="carte">
      <h2 style="margin-top:0">Formations les plus suivies</h2>
      ${d.topFormations.map(f => `<div style="display:flex;justify-content:space-between;gap:10px;align-items:center;padding:9px 0;border-bottom:1px solid var(--ligne)">
        <span>${categorie(f.categorie).emoji} <b>${esc(f.titre)}</b><br><small class="aide">${f.inscrits} inscrit(s)</small></span>
        <span style="display:flex;gap:8px;align-items:center"><div class="barre"><i style="width:${f.pct}%"></i></div><b>${f.pct}%</b></span></div>`).join('')
      || '<p class="aide">Assignez votre première formation depuis l\u2019onglet « Formations ».</p>'}
    </div>
    <div class="carte">
      <h2 style="margin-top:0">Gérez votre académie</h2>
      <div class="grille g2">
        <a class="panneau" href="/entreprise/collaborateurs" style="text-decoration:none;color:var(--texte)">➕ <b>Inviter des collaborateurs</b><br><small class="aide">Créez leurs accès en un clic</small></a>
        <a class="panneau" href="/entreprise/formations" style="text-decoration:none;color:var(--texte)">🗂️ <b>Assigner des formations</b><br><small class="aide">Obligatoires ou optionnelles</small></a>
        <a class="panneau" href="/entreprise/rapports" style="text-decoration:none;color:var(--texte)">📈 <b>Générer un rapport</b><br><small class="aide">Progression détaillée</small></a>
        <a class="panneau" href="/contact" style="text-decoration:none;color:var(--texte)">🎧 <b>Contacter le support</b><br><small class="aide">Notre équipe est à votre écoute</small></a>
      </div>
    </div>
  </div>`, { sombre: true, sousTitre: 'Administrateur — ' + esc(user.companyName || '') });
}

function collaborateursE(user, list, flash) {
  return shell('Collaborateurs', user, MENU_E, '/entreprise/collaborateurs', `
  <h1>Collaborateurs</h1>
  <p class="sous">${list.length} collaborateur(s) dans votre académie.</p>
  ${flash ? `<div class="alerte ok">${esc(flash)}</div>` : ''}
  <div class="carte" style="margin-bottom:16px">
    <b>➕ Inviter un collaborateur</b>
    <form method="POST" action="/entreprise/collaborateurs" class="grille" style="grid-template-columns:1fr 1fr 1fr auto;margin-top:10px;align-items:end">
      <div><label style="margin-top:0">Nom complet</label><input name="name" required></div>
      <div><label style="margin-top:0">Email (identifiant)</label><input name="email" type="email" required></div>
      <div><label style="margin-top:0">Mot de passe</label><input name="password" minlength="8" placeholder="Défaut : Oasis2026!"></div>
      <button class="btn vert">Créer le compte</button>
    </form>
    <p class="aide" style="margin-top:8px">Vous définissez l'identifiant (email) et le mot de passe du professionnel.
    À sa connexion, il arrive directement sur sa formation assignée.</p>
  </div>
  <div class="carte" style="margin-bottom:16px">
    <b>📥 Créer des comptes en lot</b>
    <p class="aide" style="margin:6px 0">Créez d'abord les comptes de tous vos employés, puis assignez-leur des formations.
    Une ligne par employé : <code>Nom complet, email@entreprise.ht</code> ou
    <code>Nom complet, email@entreprise.ht, MotDePasse</code> (défaut : Oasis2026!)</p>
    <form method="POST" action="/entreprise/collaborateurs/lot">
      <textarea name="lot" rows="5" required placeholder="Kevin A. Joseph, kevin@digicel.ht&#10;Marie Denise Étienne, marie.d@digicel.ht&#10;Jean Pierre Toussaint, jean.p@digicel.ht"></textarea>
      <button class="btn vert petit" style="margin-top:10px">Créer tous les comptes</button>
    </form>
  </div>
  <div class="carte" style="padding:8px 14px">
  <table><tr><th>Collaborateur</th><th>Email</th><th>Formations suivies</th><th>Progression moyenne</th></tr>
  ${list.map(c => `<tr><td><b>${esc(c.name)}</b></td><td>${esc(c.email)}</td><td>${c.nbFormations}</td>
    <td><div style="display:flex;gap:8px;align-items:center"><div class="barre"><i style="width:${c.pct}%"></i></div>${c.pct}%</div></td></tr>`).join('')}
  </table>${!list.length ? '<p class="aide" style="padding:14px">Aucun collaborateur invité pour le moment.</p>' : ''}</div>`,
  { sombre: true, sousTitre: 'Administrateur' });
}

function formationsE(user, catalogueList, collabs, flash) {
  return shell('Formations', user, MENU_E, '/entreprise/formations', `
  <h1>Formations</h1>
  <p class="sous">Assignez des formations du catalogue à vos collaborateurs — la facturation entreprise est regroupée en fin de mois.</p>
  ${flash ? `<div class="alerte ok">${esc(flash)}</div>` : ''}
  <div class="carte" style="padding:8px 14px">
  <table><tr><th>Formation</th><th>Catégorie</th><th>Prix / apprenant</th><th>Inscrits (académie)</th><th>Assigner</th></tr>
  ${catalogueList.map(c => `<tr>
    <td><b>${esc(c.titre)}</b><br><small class="aide">${esc(c.niveau)} · ${esc(c.duree)}</small></td>
    <td>${categorie(c.categorie).emoji} ${esc(categorie(c.categorie).label)}</td>
    <td class="num">${fmtHTG(c.prix)}</td>
    <td>${c.inscritsAcademie}</td>
    <td><form method="POST" action="/entreprise/assigner" style="display:flex;gap:8px;align-items:center">
      <input type="hidden" name="courseId" value="${c.id}">
      <select name="collab" style="min-width:170px">
        <option value="__tous__">Tous les collaborateurs (${collabs.length})</option>
        ${collabs.map(u => `<option value="${u.id}">${esc(u.name)}</option>`).join('')}</select>
      <select name="type"><option value="obligatoire">Obligatoire</option><option value="optionnelle">Optionnelle</option></select>
      <button class="btn vert petit">Assigner</button></form></td></tr>`).join('')}
  </table></div>`, { sombre: true, sousTitre: 'Administrateur' });
}

function rapportsE(user, lignes) {
  return shell('Rapports & Analyses', user, MENU_E, '/entreprise/rapports', `
  <h1>Rapports & Analyses</h1>
  <p class="sous">Progression détaillée de vos collaborateurs, exportable par copier-coller.</p>
  <div class="carte" style="padding:8px 14px">
  <table><tr><th>Collaborateur</th><th>Formation</th><th>Type</th><th>Progression</th><th>Statut</th></tr>
  ${lignes.map(l => `<tr><td>${esc(l.userName)}</td><td>${esc(l.coursTitre)}</td>
    <td><span class="badge ${l.type === 'obligatoire' ? 'b-bleu' : 'b-gris'}">${esc(l.type || 'optionnelle')}</span></td>
    <td><div style="display:flex;gap:8px;align-items:center"><div class="barre"><i style="width:${l.pct}%"></i></div>${l.pct}%</div></td>
    <td>${l.pct === 100 ? '<span class="badge b-vert">Complétée ✓</span>' : l.pct > 0 ? '<span class="badge b-orange">En cours</span>' : '<span class="badge b-gris">Non commencée</span>'}</td></tr>`).join('')}
  </table>${!lignes.length ? '<p class="aide" style="padding:14px">Aucune donnée : assignez d\u2019abord des formations.</p>' : ''}</div>`,
  { sombre: true, sousTitre: 'Administrateur' });
}


/* ---- Bilan apprenant : grille de compétences + grille d'évaluation ---- */
function pageBilan(user, c, enr, competences, bilan, pct) {
  const badgeC = s => s === 'acquise' ? '<span class="badge b-vert">Acquise ✓</span>'
    : s === 'en_cours' ? '<span class="badge b-orange">En cours</span>'
    : '<span class="badge b-gris">À venir</span>';
  return shell('Compétences & notes — ' + c.titre, user, MENU_A, '/apprenant', `
  <a href="/apprenant/cours/${c.id}" style="font-size:13.5px">← Retour à la formation</a>
  <h1 style="font-size:22px">🎯 Compétences & notes</h1>
  <p class="sous">${esc(c.titre)} — progression des leçons : ${pct} %.</p>

  <div class="grille g2" style="align-items:start">
    <div class="carte">
      <h2 style="margin-top:0">Grille de compétences</h2>
      ${competences.map(cm => `<div style="border-bottom:1px solid var(--ligne);padding:10px 0">
        <div style="display:flex;justify-content:space-between;gap:10px;align-items:center">
          <b>Module ${cm.index + 1} — ${esc(cm.module.titre)}</b>${badgeC(cm.statut)}</div>
        ${cm.competences.length
          ? `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">${cm.competences.map(k =>
              `<span class="badge ${cm.statut === 'acquise' ? 'b-vert' : 'b-gris'}">${cm.statut === 'acquise' ? '✓ ' : ''}${esc(k)}</span>`).join('')}</div>`
          : '<p class="aide" style="margin-top:4px">Aucune compétence définie pour ce module.</p>'}
      </div>`).join('')}
      <p class="aide" style="margin-top:10px">Une compétence est acquise quand toutes les leçons du module
      sont terminées et son quiz réussi (≥ 60 %).</p>
    </div>
    <div class="carte">
      <h2 style="margin-top:0">Grille d'évaluation comptabilisée</h2>
      ${bilan.aEvaluations ? `
      <table><tr><th>Évaluation</th><th>Score</th><th>%</th><th>Statut</th></tr>
        ${bilan.lignes.map(l => `<tr><td>${esc(l.libelle)}</td>
          <td class="num">${l.r ? l.r.score + '/' + l.r.total : '—'}</td>
          <td class="num">${l.r ? l.r.pct + ' %' : '0 %'}</td>
          <td>${l.r ? (l.r.reussi ? '<span class="badge b-vert">Réussi</span>' : '<span class="badge b-rouge">Échoué</span>') : '<span class="badge b-gris">Non passé</span>'}</td></tr>`).join('')}
        ${(bilan.lignesExam || []).map(l => `<tr><td>🎓 ${esc(l.ep.titre)} <small class="aide">(${l.ep.poids} %)</small></td>
          <td class="num">${l.sm && l.sm.detail ? esc(l.sm.detail) : '—'}</td>
          <td class="num">${l.note !== null ? l.note + ' %' : '—'}</td>
          <td>${l.note !== null ? (l.note >= 60 ? '<span class="badge b-vert">Réussi</span>' : '<span class="badge b-rouge">Échoué</span>')
            : l.enAttenteCorrection ? '<span class="badge b-orange">En correction</span>' : '<span class="badge b-gris">Non passé</span>'}</td></tr>`).join('')}
      </table>
      <div class="panneau" style="margin-top:14px">
        Moyenne des quiz : <b>${bilan.moyQuiz ?? '—'} %</b> (poids ${bilan.cfg.poidsQuiz} %) ·
        Examen final : <b>${bilan.pctExam ?? '—'} %</b> (poids ${bilan.cfg.poidsExamen} %)<br>
        <span style="font-size:18px">Note globale : <b style="color:${bilan.note >= bilan.cfg.seuil ? 'var(--vert)' : 'var(--rouge)'}">${bilan.note} %</b></span>
        — seuil de réussite : ${bilan.cfg.seuil} %
        ${bilan.reussi && enr.completedAt ? ' · <span class="badge b-vert">Certificat obtenu 🎖️</span>' : ''}
      </div>`
      : '<p class="aide">Cette formation ne comporte pas encore d\u2019évaluations notées.</p>'}
      <p style="margin-top:12px"><a class="btn ligne" href="/releve/${enr.id}">📄 Télécharger mon relevé de notes</a>
      ${enr.completedAt ? ` <a class="btn vert" href="/certificat/${enr.id}" style="margin-left:6px">🎖️ Voir mon certificat</a>` : ''}</p>
    </div>
  </div>`, { sousTitre: 'Apprenant' });
}

/* ---- Carnet de notes (formateur) ---- */
function pageNotesFormateur(user, c, lignes, cfg) {
  const modulesQuiz = c.modules.filter(m => m.quiz && m.quiz.questions && m.quiz.questions.length);
  const aExam = c.examenFinal && c.examenFinal.questions && c.examenFinal.questions.length;
  return shell('Carnet de notes — ' + c.titre, user, MENU_F, '/formateur/formations', `
  <a href="/formateur/formation/${c.id}" style="font-size:13.5px">← Retour à la gestion</a>
  <h1 style="font-size:22px">📊 Carnet de notes</h1>
  <p class="sous">${esc(c.titre)} — barème : quiz ${cfg.poidsQuiz} % + examen ${cfg.poidsExamen} %, seuil ${cfg.seuil} %.</p>
  <div class="carte" style="padding:8px 14px;overflow-x:auto">
  <table><tr><th>Apprenant</th><th>Leçons</th>
    ${modulesQuiz.map((m, i) => `<th>Quiz M${c.modules.indexOf(m) + 1}</th>`).join('')}
    ${aExam ? '<th>Examen</th>' : ''}<th>Note globale</th><th>Statut</th><th>Relevé</th></tr>
  ${lignes.map(l => `<tr><td><b>${esc(l.nom)}</b></td><td class="num">${l.pct} %</td>
    ${modulesQuiz.map(m => { const r = (l.enr.evaluations || {})[m.id];
      return `<td class="num">${r ? r.pct + ' %' : '—'}</td>`; }).join('')}
    ${aExam ? `<td class="num">${l.bilan.examFait ? l.bilan.pctExam + ' %' : '—'}</td>` : ''}
    <td class="num"><b>${l.bilan.aEvaluations ? l.bilan.note + ' %' : '—'}</b></td>
    <td style="white-space:nowrap">${l.enr.completedAt ? '<span class="badge b-vert">Certifié 🎖️</span>'
      : l.bilan.aEvaluations && l.bilan.note >= cfg.seuil ? '<span class="badge b-bleu">En bonne voie</span>'
      : '<span class="badge b-orange">En cours</span>'}</td>
    <td><a class="btn ligne petit" href="/releve/${l.enr.id}" target="_blank">📄 Ouvrir</a></td></tr>`).join('')}
  </table>${!lignes.length ? '<p class="aide" style="padding:14px">Aucun apprenant inscrit.</p>' : ''}</div>`,
  { sousTitre: 'Formateur' });
}

/* ---- Édition du profil formateur ---- */
function profilFormateurEdit(user, flash) {
  return shell('Mon profil', user, MENU_F, '/formateur/profil', `
  <h1>Mon profil de formateur</h1>
  <p class="sous">Ces informations sont visibles publiquement sur votre page
    <a href="/formateurs/${user.id}">/formateurs/${user.id}</a>, liée à chacune de vos formations.</p>
  ${flash ? `<div class="alerte ok">${esc(flash)} <a href="/formateurs/${user.id}">Voir ma page publique →</a></div>` : ''}
  <div class="grille" style="grid-template-columns:1.4fr .8fr;align-items:start">
    <div class="carte">
      <form method="POST" action="/formateur/profil" enctype="multipart/form-data">
        <label>Titre professionnel</label>
        <input name="titrePro" maxlength="100" value="${esc(user.titrePro || '')}"
          placeholder="Ex : Ingénieur logiciel & formateur certifié">
        <label>Présentation (bio)</label>
        <textarea name="bio" rows="5" maxlength="1000"
          placeholder="Votre parcours, votre approche pédagogique…">${esc(user.bio || '')}</textarea>
        <label>Domaines d'expertise (séparés par des virgules)</label>
        <input name="expertises" value="${esc((user.expertises || []).join(', '))}"
          placeholder="Ex : Laravel, Excel avancé, Marketing digital">
        <div class="grille g2">
          <div><label>Site web</label><input name="siteWeb" value="${esc(user.siteWeb || '')}" placeholder="https://…"></div>
          <div><label>WhatsApp</label><input name="whatsapp" value="${esc(user.whatsapp || '')}" placeholder="509XXXXXXXX"></div>
        </div>
        <label>Photo de profil</label>
        <input name="photo" type="file" accept="image/jpeg,image/png,image/webp">
        <p class="aide">Carrée de préférence — JPG, PNG, WebP (max. 5 Mo).</p>
        <button class="btn violet" style="margin-top:14px">Enregistrer mon profil</button>
      </form>
    </div>
    <div class="carte" style="text-align:center">
      <h2 style="margin-top:0">Aperçu</h2>
      ${user.photo ? `<img src="${esc(user.photo)}" style="width:110px;height:110px;border-radius:99px;object-fit:cover">`
        : avatarHtml(user.name, 'var(--violet)')}
      <p><b>${esc(user.name)}</b> ${user.verified ? '<span class="badge b-violet">Vérifié ✓</span>' : ''}</p>
      <p class="aide">${esc(user.titrePro || 'Titre professionnel')}</p>
    </div>
  </div>`, { sousTitre: 'Formateur' });
}

/* ---- Forum : liste des sujets ---- */
function pageForum(user, c, sujets, flash) {
  const menu = user.role === 'formateur' || user.role === 'admin' ? MENU_F : MENU_A;
  return shell('Forum — ' + c.titre, user, menu, '', `
  <a href="${user.role === 'formateur' ? '/formateur/formation/' + c.id : '/apprenant/cours/' + c.id}"
    style="font-size:13.5px">← Retour à la formation</a>
  <h1 style="font-size:22px">💬 Forum — ${esc(c.titre)}</h1>
  <p class="sous">Espace d'entraide réservé aux inscrits et au formateur. ${sujets.length} sujet(s).</p>
  ${flash ? `<div class="alerte ok">${esc(flash)}</div>` : ''}
  <div class="carte" style="margin-bottom:16px">
    <b>➕ Ouvrir un nouveau sujet</b>
    <form method="POST" action="/cours/${c.id}/forum" style="margin-top:8px">
      <input name="titre" required maxlength="150" placeholder="Titre de votre question ou discussion">
      <textarea name="contenu" rows="3" required maxlength="3000" placeholder="Détaillez votre question…" style="margin-top:6px"></textarea>
      <button class="btn petit" style="margin-top:8px">Publier le sujet</button>
    </form>
  </div>
  ${sujets.map(s => `<a href="/cours/${c.id}/forum/${s.id}" class="carte"
    style="display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:10px;text-decoration:none;color:var(--texte)">
    <span><b>${esc(s.titre)}</b><br><small class="aide">Par ${esc(s.auteur)} · dernier message le ${s.dernierAt.slice(0, 10)}</small></span>
    <span class="badge b-bleu">${s.nbMessages} message(s)</span></a>`).join('')
  || '<div class="carte"><p class="aide">Aucun sujet — lancez la première discussion !</p></div>'}`,
  { sousTitre: user.role === 'formateur' ? 'Formateur' : 'Apprenant' });
}

/* ---- Forum : fil d'un sujet ---- */
function pageSujet(user, c, suj, messages) {
  const menu = user.role === 'formateur' || user.role === 'admin' ? MENU_F : MENU_A;
  return shell(suj.titre, user, menu, '', `
  <a href="/cours/${c.id}/forum" style="font-size:13.5px">← Tous les sujets</a>
  <h1 style="font-size:21px">💬 ${esc(suj.titre)}</h1>
  <p class="sous">${esc(c.titre)} · ${messages.length} message(s)</p>
  ${messages.map(mm => `<div class="carte" style="margin-bottom:10px;${mm.estFormateur ? 'border-left:4px solid var(--violet)' : ''}">
    <div style="display:flex;gap:10px;align-items:center">
      ${mm.photo ? `<img src="${esc(mm.photo)}" style="width:34px;height:34px;border-radius:99px;object-fit:cover">` : avatarHtml(mm.auteur, mm.estFormateur ? 'var(--violet)' : 'var(--bleu)')}
      <span><b>${esc(mm.auteur)}</b>${mm.estFormateur ? ' <span class="badge b-violet">Formateur</span>' : ''}
      <br><small class="aide">${mm.createdAt.slice(0, 16).replace('T', ' à ')}</small></span></div>
    <p style="margin-top:10px;white-space:pre-wrap">${esc(mm.contenu)}</p></div>`).join('')}
  <div class="carte">
    <b>Répondre</b>
    <form method="POST" action="/cours/${c.id}/forum/${suj.id}" style="margin-top:8px">
      <textarea name="contenu" rows="3" required maxlength="3000" placeholder="Votre réponse…"></textarea>
      <button class="btn petit" style="margin-top:8px">Publier la réponse</button>
    </form>
  </div>`, { sousTitre: user.role === 'formateur' ? 'Formateur' : 'Apprenant' });
}


/* ---- Évaluation finale (apprenant) : liste des épreuves ---- */
function pageExamen(user, c, enr, bilan, flash) {
  const badgeEp = l => l.note !== null
    ? `<span class="badge ${l.note >= 60 ? 'b-vert' : 'b-rouge'}">${l.note}/100</span>`
    : l.enAttenteCorrection ? '<span class="badge b-orange">En correction</span>'
    : '<span class="badge b-gris">À faire</span>';
  return shell('Évaluation finale — ' + c.titre, user, MENU_A, '/apprenant', `
  <a href="/apprenant/cours/${c.id}" style="font-size:13.5px">← Retour à la formation</a>
  <h1 style="font-size:22px">🎓 Évaluation finale</h1>
  <p class="sous">${esc(c.titre)} — ${bilan.epreuves.length} épreuve(s). Note d'examen = moyenne pondérée.
  Seuil de certification : ${bilan.cfg.seuil} % de note globale.</p>
  ${flash ? `<div class="alerte ok">${esc(flash)}</div>` : ''}
  ${bilan.lignesExam.map(l => `<a href="/apprenant/cours/${c.id}/epreuve/${l.ep.id}" class="carte"
    style="display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:10px;text-decoration:none;color:var(--texte)">
    <span><span class="badge b-orange">${esc((TYPES_EPREUVES[l.ep.type] || {}).label || l.ep.type)}</span>
      <b> ${esc(l.ep.titre)}</b> <small class="aide">· poids ${l.ep.poids} %</small><br>
      <small class="aide">${esc(String(l.ep.consigne || '').slice(0, 120))}</small>
      ${l.sm && l.sm.feedback ? `<br><small><b>Retour du formateur :</b> ${esc(l.sm.feedback)}</small>` : ''}</span>
    ${badgeEp(l)}</a>`).join('')}
  <div class="panneau" style="margin-top:6px">
    Note d'examen : <b>${bilan.pctExam !== null ? bilan.pctExam + ' %' : '—'}</b>
    ${bilan.examFait ? '' : ' <small class="aide">(provisoire — certaines épreuves restent à faire ou à corriger)</small>'}
    · Note globale : <b style="color:${bilan.note >= bilan.cfg.seuil ? 'var(--vert)' : 'var(--rouge)'}">${bilan.note ?? '—'} %</b>
    · <a class="btn ligne petit" href="/releve/${enr.id}">📄 Relevé</a>
    ${enr.completedAt ? ` <a class="btn vert petit" href="/certificat/${enr.id}">🎖️ Mon certificat</a>` : ''}
  </div>`, { sousTitre: 'Apprenant' });
}

/* ---- Passage d'une épreuve ---- */
function pageEpreuve(user, c, ep, soumission, resultat, melanger) {
  const auto = (TYPES_EPREUVES[ep.type] || {}).auto;
  const melange = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  let corps = '';
  if (resultat && resultat.erreur) corps += `<div class="alerte ko">${esc(resultat.erreur)}</div>`;
  if (resultat && resultat.auto) {
    corps += `<div class="alerte ${resultat.pct >= 60 ? 'ok' : 'ko'}">Votre score : <b>${resultat.pct} %</b>
      (${esc(resultat.detail)}). ${resultat.pct < 60 ? 'Vous pouvez réessayer — le meilleur score est conservé.' : ''}</div>
      ${resultat.reponses ? resultat.reponses.map((r, i) => `<p style="font-size:14px">${r.ok ? '✅' : '❌'}
        Trou ${i + 1} : <code>${esc(r.donne || '—')}</code>${r.ok ? '' : ' → attendu : <code>' + esc(r.attendu) + '</code>'}</p>`).join('') : ''}
      <p style="margin-top:12px"><a class="btn" href="/apprenant/cours/${c.id}/examen">Retour à l'examen</a>
      ${resultat.pct < 100 ? `<a class="btn ligne" href="/apprenant/cours/${c.id}/epreuve/${ep.id}" style="margin-left:8px">Réessayer</a>` : ''}</p>`;
  } else if (resultat && !resultat.auto) {
    corps += `<div class="alerte ok">✓ Votre travail a été soumis. Le formateur le corrigera et vous
      recevrez une note sur 100 avec un retour personnalisé.</div>
      <p><a class="btn" href="/apprenant/cours/${c.id}/examen">Retour à l'examen</a></p>`;
  } else if (ep.type === 'qcm') {
    const qs = melanger ? melange(ep.questions || []) : (ep.questions || []);
    corps += `<form method="POST" action="/apprenant/cours/${c.id}/epreuve/${ep.id}">
      ${qs.map((q, qi) => {
        const opts = q.options.map((o, oi) => ({ o, oi }));
        const optsAff = melanger ? melange(opts) : opts;
        return `<div style="margin-bottom:16px"><b>Question ${qi + 1}.</b> ${esc(q.question)}
        ${optsAff.map(({ o, oi }) => `<label style="display:flex;gap:8px;align-items:center;margin:6px 0;padding:9px 12px;border:1.5px solid var(--ligne);border-radius:9px;cursor:pointer">
          <input type="radio" name="q_${q.id}" value="${oi}" required style="width:auto"> ${esc(o)}</label>`).join('')}</div>`;
      }).join('')}
      <button class="btn" style="width:100%">Valider mes réponses</button></form>`;
  } else if (ep.type === 'trous') {
    let n = 0;
    const texteAff = esc(ep.texte || '').replace(/\{\{[^}]+\}\}/g, () =>
      `<input name="t_${n++}" style="display:inline-block;width:160px;margin:0 4px" placeholder="…">`);
    corps += `<form method="POST" action="/apprenant/cours/${c.id}/epreuve/${ep.id}">
      <p style="line-height:2.4">${texteAff}</p>
      <button class="btn" style="width:100%;margin-top:10px">Valider mes réponses</button></form>`;
  } else {
    corps += `${soumission ? `<div class="alerte ${soumission.note !== null ? (soumission.note >= 60 ? 'ok' : 'ko') : 'info'}" style="background:${soumission.note === null ? '#FEF3C7' : ''}">
      ${soumission.note !== null ? `Corrigé : <b>${soumission.note}/100</b>${soumission.feedback ? ' — ' + esc(soumission.feedback) : ''}`
        : 'Travail soumis le ' + soumission.at.slice(0, 10) + ' — en attente de correction. Vous pouvez le remplacer ci-dessous.'}</div>` : ''}
      <form method="POST" action="/apprenant/cours/${c.id}/epreuve/${ep.id}" enctype="multipart/form-data">
        <label>Votre réponse / présentation du travail</label>
        <textarea name="contenu" rows="7" maxlength="8000"
          placeholder="Rédigez votre réponse, décrivez votre démarche, collez vos liens (GitHub, vidéo…)">${esc(soumission ? soumission.contenu || '' : '')}</textarea>
        <label>Fichier joint (facultatif) — PDF, image, vidéo, audio, ZIP, DOCX</label>
        <input name="fichier" type="file"
          accept="application/pdf,image/*,video/mp4,video/webm,audio/mpeg,application/zip,.docx">
        ${soumission && soumission.fichier ? `<p class="aide">Fichier actuel :
          <a href="${esc(soumission.fichier.url)}" target="_blank">${esc(soumission.fichier.nomOriginal)}</a></p>` : ''}
        <button class="btn" style="width:100%;margin-top:12px">📤 Soumettre mon travail</button>
      </form>`;
  }
  return shell(ep.titre, user, MENU_A, '/apprenant', `
  <a href="/apprenant/cours/${c.id}/examen" style="font-size:13.5px">← Toutes les épreuves</a>
  <h1 style="font-size:21px"><span class="badge b-orange">${esc((TYPES_EPREUVES[ep.type] || {}).label || ep.type)}</span> ${esc(ep.titre)}</h1>
  <p class="sous">${esc(c.titre)} · poids ${ep.poids} % de l'examen · ${auto ? 'correction automatique' : 'corrigée par le formateur'}</p>
  ${ep.consigne ? `<div class="carte" style="margin-bottom:14px"><b>Consignes</b><p style="margin-top:6px;white-space:pre-wrap">${esc(ep.consigne)}</p></div>` : ''}
  <div class="carte">${corps}</div>`, { sousTitre: 'Apprenant' });
}

/* ---- Copies à corriger (formateur) ---- */
function pageCorrections(user, c, lignes, flash) {
  return shell('Corrections — ' + c.titre, user, MENU_F, '/formateur/formations', `
  <a href="/formateur/formation/${c.id}" style="font-size:13.5px">← Retour à la gestion</a>
  <h1 style="font-size:22px">✍️ Copies à corriger</h1>
  <p class="sous">${esc(c.titre)} — ${lignes.filter(l => l.sm.note === null).length} en attente,
  ${lignes.filter(l => l.sm.note !== null).length} corrigée(s).</p>
  ${flash ? `<div class="alerte ok">${esc(flash)}</div>` : ''}
  ${lignes.map(l => `<div class="carte" style="margin-bottom:12px;${l.sm.note === null ? 'border-left:4px solid var(--orange)' : ''}">
    <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap">
      <span><b>${esc(l.apprenant)}</b> · <span class="badge b-orange">${esc((TYPES_EPREUVES[l.ep.type] || {}).label)}</span>
        <b>${esc(l.ep.titre)}</b><br><small class="aide">Soumis le ${l.sm.at.slice(0, 16).replace('T', ' à ')}</small></span>
      ${l.sm.note !== null ? `<span class="badge ${l.sm.note >= 60 ? 'b-vert' : 'b-rouge'}">${l.sm.note}/100</span>` : '<span class="badge b-orange">À corriger</span>'}
    </div>
    ${l.sm.contenu ? `<p style="margin-top:10px;white-space:pre-wrap;background:#F8FAFC;padding:12px;border-radius:9px">${esc(l.sm.contenu)}</p>` : ''}
    ${l.sm.fichier ? `<p>📎 <a href="${esc(l.sm.fichier.url)}" target="_blank">${esc(l.sm.fichier.nomOriginal)}</a></p>` : ''}
    <form method="POST" action="/formateur/formation/${c.id}/corriger" style="display:flex;gap:8px;margin-top:10px;align-items:end;flex-wrap:wrap">
      <input type="hidden" name="enrId" value="${l.enr.id}"><input type="hidden" name="epId" value="${l.ep.id}">
      <div style="max-width:130px"><label style="margin-top:0">Note /100</label>
        <input name="note" type="number" min="0" max="100" value="${l.sm.note ?? ''}" required></div>
      <div style="flex:1;min-width:220px"><label style="margin-top:0">Retour à l'apprenant</label>
        <input name="feedback" maxlength="1000" value="${esc(l.sm.feedback || '')}" placeholder="Commentaire, pistes d'amélioration…"></div>
      <button class="btn violet petit">${l.sm.note !== null ? 'Modifier la note' : 'Enregistrer la note'}</button>
    </form></div>`).join('') || '<div class="carte"><p class="aide">Aucune copie soumise pour le moment.</p></div>'}`,
  { sousTitre: 'Formateur' });
}

/* ---- Administration : candidatures formateurs ---- */
function adminCandidatures(user, list, flash) {
  return shell('Candidatures formateurs', user, MENU_ADMIN, '/admin/candidatures', `
  <h1>Candidatures formateurs</h1>
  <p class="sous">${list.filter(x => x.candidature.statut === 'en_attente').length} en attente ·
  ${list.filter(x => x.candidature.statut === 'approuvee').length} approuvée(s) ·
  ${list.filter(x => x.candidature.statut === 'rejetee').length} rejetée(s)</p>
  ${flash ? `<div class="alerte ok">${esc(flash)}</div>` : ''}
  ${list.map(f => { const cd = f.candidature; return `<div class="carte" style="margin-bottom:12px;${cd.statut === 'en_attente' ? 'border-left:4px solid var(--orange)' : ''}">
    <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap">
      <span><b>${esc(f.name)}</b> — ${esc(cd.titrePro || '')}<br>
        <small class="aide">${esc(f.email)} · soumise le ${cd.soumiseLe.slice(0, 10)}
        ${(cd.expertises || []).length ? ' · ' + cd.expertises.map(e => `<span class="badge b-bleu">${esc(e)}</span>`).join(' ') : ''}</small></span>
      <span class="badge ${cd.statut === 'approuvee' ? 'b-vert' : cd.statut === 'rejetee' ? 'b-rouge' : 'b-orange'}">
        ${cd.statut === 'approuvee' ? 'Approuvée' : cd.statut === 'rejetee' ? 'Rejetée' : 'En attente'}</span>
    </div>
    <p style="margin-top:8px"><b>Expérience :</b> ${esc(cd.experience || '—')}</p>
    <p><b>Motivation :</b> ${esc(cd.motivation || '—')}</p>
    ${cd.portfolio ? `<p>🔗 <a href="${esc(cd.portfolio)}" target="_blank" rel="noopener">${esc(cd.portfolio)}</a></p>` : ''}
    ${cd.statut === 'en_attente' ? `
    <form method="POST" action="/admin/candidatures" style="display:flex;gap:8px;margin-top:10px;align-items:end;flex-wrap:wrap">
      <input type="hidden" name="id" value="${f.id}">
      <div style="flex:1;min-width:220px"><label style="margin-top:0">Commentaire (transmis si rejet)</label>
        <input name="commentaire" maxlength="500"></div>
      <button class="btn vert petit" name="decision" value="approuvee">✓ Approuver</button>
      <button class="btn petit" style="background:var(--rouge)" name="decision" value="rejetee">Rejeter</button>
    </form>` : cd.commentaire ? `<p class="aide">Commentaire : ${esc(cd.commentaire)}</p>` : ''}
  </div>`; }).join('') || '<div class="carte"><p class="aide">Aucune candidature.</p></div>'}`,
  { sombre: true, sousTitre: 'Administration' });
}


/* ---- Administration : paramètres du certificat ---- */
function adminParametres(user, p, flash) {
  return shell('Paramètres du certificat', user, MENU_ADMIN, '/admin/parametres', `
  <h1>Paramètres du certificat</h1>
  <p class="sous">Sceau officiel, signature et signataire apposés sur tous les certificats délivrés.</p>
  ${flash ? `<div class="alerte ok">${esc(flash)}</div>` : ''}
  <div class="grille" style="grid-template-columns:1.3fr .9fr;align-items:start">
    <div class="carte">
      <form method="POST" action="/admin/parametres" enctype="multipart/form-data">
        <label>Nom du signataire</label>
        <input name="signataireNom" maxlength="100" value="${esc(p.signataireNom)}">
        <label>Titre du signataire</label>
        <input name="signataireTitre" maxlength="120" value="${esc(p.signataireTitre)}">
        <label>Fait à (ville)</label>
        <input name="villeCertificat" maxlength="60" value="${esc(p.villeCertificat)}">
        <label>Nouveau sceau officiel (PNG/JPG/WebP, fond transparent conseillé)</label>
        <input name="sceau" type="file" accept="image/png,image/jpeg,image/webp">
        <label>Nouvelle signature (PNG à fond transparent ou blanc)</label>
        <input name="signature" type="file" accept="image/png,image/jpeg,image/webp">
        <button class="btn violet" style="margin-top:14px">Enregistrer les paramètres</button>
      </form>
    </div>
    <div class="carte" style="text-align:center">
      <h2 style="margin-top:0">Aperçu actuel</h2>
      <img src="${esc(p.sceauUrl)}" alt="Sceau" style="width:130px;height:130px;object-fit:contain">
      <div style="margin-top:14px;border-top:1px dashed var(--ligne);padding-top:12px">
        <img src="${esc(p.signatureUrl)}" alt="Signature" style="max-height:60px;max-width:220px;object-fit:contain">
        <p><b>${esc(p.signataireNom)}</b><br><small class="aide">${esc(p.signataireTitre)}</small></p>
      </div>
    </div>
  </div>`, { sombre: true, sousTitre: 'Administration' });
}


/* ---- Administration : modération des formations ---- */
function adminModeration(user, list, flash) {
  return shell('Formations à vérifier', user, MENU_ADMIN, '/admin/moderation', `
  <h1>Formations à vérifier</h1>
  <p class="sous">${list.length} formation(s) soumise(s) par les formateurs, en attente de validation avant publication.</p>
  ${flash ? `<div class="alerte ok">${esc(flash)}</div>` : ''}
  ${list.map(c => `<div class="carte" style="margin-bottom:12px;border-left:4px solid var(--orange)">
    <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap">
      <span>${categorie(c.categorie).emoji} <b>${esc(c.titre)}</b>
        <small class="aide">· ${esc(c.formateurNom)} · ${c.prix === 0 ? 'Gratuit' : fmtHTG(c.prix)}
        · ${nbLecons(c)} leçon(s) · soumise le ${(c.moderation && c.moderation.soumiseLe || c.createdAt).slice(0, 10)}</small><br>
        <small>${esc(String(c.sousTitre || c.description || '').slice(0, 140))}</small></span>
      <a class="btn ligne petit" href="/formation/${c.id}" target="_blank">👁️ Prévisualiser</a>
    </div>
    <form method="POST" action="/admin/moderation" style="display:flex;gap:8px;margin-top:10px;align-items:end;flex-wrap:wrap">
      <input type="hidden" name="id" value="${c.id}">
      <div style="flex:1;min-width:220px"><label style="margin-top:0">Commentaire (transmis au formateur si renvoi)</label>
        <input name="commentaire" maxlength="800" placeholder="Ex : ajoutez des ressources au module 2, précisez les objectifs…"></div>
      <button class="btn vert petit" name="decision" value="publiee">✓ Approuver et publier</button>
      <button class="btn petit" style="background:var(--rouge)" name="decision" value="brouillon">Renvoyer en brouillon</button>
    </form>
  </div>`).join('') || '<div class="carte"><p class="aide">Aucune formation en attente de vérification. ✓</p></div>'}`,
  { sombre: true, sousTitre: 'Administration' });
}


/* ---- Relevé de notes officiel (imprimable) ---- */
function releveNotes(enr, cours, user, formateur, rel, params = {}, qr = null) {
  const b = rel.bilan;
  const pct = n => n === null || n === undefined ? '—' : n + ' %';
  const statutMod = st => st === 'acquise'
    ? '<span class="et ok">Acquis</span>'
    : st === 'en_cours' ? '<span class="et enc">En cours</span>'
    : '<span class="et att">Non abordé</span>';

  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8">
  <title>Relevé de notes — ${esc(user.name)}</title>
  <style>
  @page{size:A4;margin:14mm}
  body{font-family:'Helvetica Neue',Arial,sans-serif;background:#F6F9FC;margin:0;padding:26px 16px;color:#39485F}
  .doc{background:#fff;max-width:820px;margin:0 auto;border:1px solid #E3EAF3;border-radius:12px;
  box-shadow:0 12px 36px rgba(0,28,74,.10);overflow:hidden}
  .bandeau{height:8px;background:linear-gradient(90deg,#001C4A 0%,#0166C2 42%,#06C994 76%,#FC9F1E 100%)}
  .dedans{padding:30px 38px 36px}
  .tete{display:flex;align-items:center;gap:16px;border-bottom:2px solid #E3EAF3;padding-bottom:16px}
  .tete img{width:62px;height:62px;object-fit:contain}
  .tete .nom{font-size:19px;font-weight:800;color:#001C4A;letter-spacing:.02em;line-height:1.15}
  .tete .sous{font-size:10.5px;letter-spacing:.14em;color:#0166C2;font-weight:700;text-transform:uppercase}
  .tete .ref{margin-left:auto;text-align:right;font-size:11px;color:#6B7A90;line-height:1.7}
  .tete .qr-tete{line-height:0;text-align:center;border:1px solid #E3EAF3;border-radius:8px;padding:4px 4px 2px}
  .tete .qr-tete span{display:block;font-size:9px;letter-spacing:.09em;color:#0166C2;
  text-transform:uppercase;font-weight:700;line-height:1.9}
  h1{font-size:17px;color:#001C4A;letter-spacing:.16em;text-align:center;margin:22px 0 4px;font-weight:800}
  .soustitre{text-align:center;font-size:11.5px;color:#6B7A90;margin:0 0 20px}
  .fiche{display:grid;grid-template-columns:1fr 1fr;gap:6px 26px;background:#F6F9FC;border:1px solid #E3EAF3;
  border-radius:9px;padding:14px 18px;font-size:12.5px;margin-bottom:22px}
  .fiche div{display:flex;gap:8px}
  .fiche b{color:#001C4A;min-width:116px;display:inline-block}
  h2{font-size:12px;letter-spacing:.13em;color:#0166C2;text-transform:uppercase;margin:24px 0 8px;font-weight:800}
  table{width:100%;border-collapse:collapse;font-size:12px}
  th{background:#001C4A;color:#fff;text-align:left;padding:8px 9px;font-size:10.5px;
  letter-spacing:.05em;text-transform:uppercase;font-weight:700}
  th.n,td.n{text-align:center}
  td{padding:9px;border-bottom:1px solid #EDF1F7;vertical-align:top}
  tr:nth-child(even) td{background:#FAFCFE}
  td.code{font-family:'Courier New',monospace;font-size:11px;color:#0166C2;font-weight:bold;white-space:nowrap}
  .et{display:inline-block;padding:2px 9px;border-radius:99px;font-size:10px;font-weight:700;white-space:nowrap}
  .et.ok{background:#E0F8F0;color:#046A4D}.et.enc{background:#FFF4E3;color:#8A5200}
  .et.att{background:#F1F4F9;color:#6B7A90}
  .comp{margin-top:5px;font-size:11px;color:#39485F;line-height:1.7}
  .comp span{display:inline-block;background:#E8F4FE;color:#001C4A;border-radius:99px;padding:1px 9px;margin:1px 3px 1px 0}
  .comp span.ok{background:#E0F8F0;color:#046A4D}
  .synthese{margin-top:24px;border:2px solid #001C4A;border-radius:11px;overflow:hidden}
  .synthese .haut{background:#001C4A;color:#fff;padding:9px 18px;font-size:11px;letter-spacing:.13em;
  text-transform:uppercase;font-weight:700}
  .synthese .corps{display:grid;grid-template-columns:repeat(4,1fr);gap:0}
  .synthese .bloc{padding:14px 16px;border-right:1px solid #E3EAF3;text-align:center}
  .synthese .bloc:last-child{border-right:0}
  .synthese .v{font-size:23px;font-weight:800;color:#001C4A;display:block;line-height:1.2}
  .synthese .l{font-size:10px;color:#6B7A90;text-transform:uppercase;letter-spacing:.07em}
  .synthese .v.vert{color:#059E74}.synthese .v.rouge{color:#E23D3D}
  .pieds{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;margin-top:30px}
  .pieds .sig{flex:1;text-align:center}
  .pieds .sig img{max-height:54px;max-width:190px;object-fit:contain;display:block;margin:0 auto}
  .pieds .trait{width:180px;border-top:1.4px solid #9AA8BC;margin:4px auto 4px}
  .pieds small{font-size:11px;color:#6B7A90}
  .pieds .sceau img{width:104px;height:104px;object-fit:contain}
  .legal{margin-top:24px;border-top:1px solid #E3EAF3;padding-top:12px;font-size:10.5px;
  color:#6B7A90;text-align:center;line-height:1.7}
  .outils{text-align:center;margin:20px auto;max-width:820px}
  .outils button,.outils a{font-family:inherit;font-size:14px;padding:10px 20px;border-radius:10px;
  border:1.5px solid #E3EAF3;background:#fff;color:#001C4A;cursor:pointer;text-decoration:none;
  display:inline-block;margin:0 5px;font-weight:600}
  .outils button{background:linear-gradient(90deg,#001C4A,#0166C2);color:#fff;border:0}
  @media print{body{background:#fff;padding:0}.doc{box-shadow:none;border:0;border-radius:0}
  .outils{display:none}tr{page-break-inside:avoid}}
  </style></head><body>
  <div class="doc"><div class="bandeau"></div><div class="dedans">

    <div class="tete">
      <img src="/assets/logo-oasis.png" alt="">
      <div><div class="nom">OASIS</div><div class="sous">Centre numérique de formation professionnelle</div></div>
      <div class="ref">N° ${esc(enr.id).toUpperCase()}<br>Édité le ${new Date().toISOString().slice(0, 10)}</div>
      ${qr ? `<div class="qr-tete">${qr.svg}<span>Vérifier</span></div>` : ''}
    </div>

    <h1>RELEVÉ DE NOTES</h1>
    <p class="soustitre">Document officiel · ${esc(params.villeCertificat || 'Port-au-Prince, Haïti')}</p>

    <div class="fiche">
      <div><b>Apprenant</b> <span>${esc(user.name)}</span></div>
      <div><b>Formation</b> <span>${esc(cours.titre)}</span></div>
      <div><b>Courriel</b> <span>${esc(user.email || '—')}</span></div>
      <div><b>Code formation</b> <span>${esc(rel.code)}</span></div>
      <div><b>Formateur</b> <span>${esc(formateur.name)}</span></div>
      <div><b>Niveau · durée</b> <span>${esc(cours.niveau)} · ${esc(cours.duree)}</span></div>
      <div><b>Inscription</b> <span>${enr.createdAt.slice(0, 10)}</span></div>
      <div><b>Statut</b> <span>${enr.completedAt
        ? 'Formation achevée le ' + enr.completedAt.slice(0, 10)
        : 'En cours (' + rel.leconsFaites + '/' + rel.nbLecons + ' leçons)'}</span></div>
    </div>

    <h2>Modules et compétences</h2>
    <table>
      <tr><th>Code</th><th>Module</th><th class="n">Note</th><th class="n">Sur</th>
          <th class="n">%</th><th class="n">Leçons</th><th>Statut</th></tr>
      ${rel.modules.map(m => `<tr>
        <td class="code">${esc(m.code)}</td>
        <td><b>${esc(m.titre)}</b>
          ${m.competences.length ? `<div class="comp">${m.competences.map(k =>
            `<span class="${m.statut === 'acquise' ? 'ok' : ''}">${m.statut === 'acquise' ? '✓ ' : ''}${esc(k)}</span>`).join('')}</div>` : ''}</td>
        <td class="n">${m.note === null ? '—' : '<b>' + m.note + '</b>'}</td>
        <td class="n">${m.sur === null ? '—' : m.sur}</td>
        <td class="n">${pct(m.pct)}</td>
        <td class="n">${m.lecFaites}/${m.lecons}</td>
        <td>${statutMod(m.statut)}</td></tr>`).join('')}
    </table>

    ${rel.epreuves.length ? `<h2>Évaluation finale</h2>
    <table>
      <tr><th>Code</th><th>Épreuve</th><th>Type</th><th class="n">Poids</th>
          <th class="n">Note</th><th class="n">Sur</th><th class="n">%</th></tr>
      ${rel.epreuves.map(e => `<tr>
        <td class="code">${esc(e.code)}</td>
        <td><b>${esc(e.titre)}</b>${e.feedback ? `<div class="comp">${esc(e.feedback)}</div>` : ''}</td>
        <td>${esc(e.type)}</td>
        <td class="n">${e.poids} %</td>
        <td class="n">${e.note === null ? (e.enAttente ? '<span class="et enc">en correction</span>' : '—') : '<b>' + e.note + '</b>'}</td>
        <td class="n">${e.note === null ? '—' : e.sur}</td>
        <td class="n">${pct(e.pct)}</td></tr>`).join('')}
    </table>` : ''}

    <div class="synthese">
      <div class="haut">Synthèse des résultats</div>
      <div class="corps">
        <div class="bloc"><span class="v">${b.moyQuiz === null ? '—' : b.moyQuiz + ' %'}</span>
          <span class="l">Moyenne modules<br>(poids ${b.cfg.poidsQuiz} %)</span></div>
        <div class="bloc"><span class="v">${b.pctExam === null ? '—' : b.pctExam + ' %'}</span>
          <span class="l">Évaluation finale<br>(poids ${b.cfg.poidsExamen} %)</span></div>
        <div class="bloc"><span class="v ${b.note === null ? '' : b.note >= b.cfg.seuil ? 'vert' : 'rouge'}">${b.note === null ? '—' : b.note + ' %'}</span>
          <span class="l">Note globale<br>(seuil ${b.cfg.seuil} %)</span></div>
        <div class="bloc"><span class="v">${rel.totalAcq}/${rel.totalComp}</span>
          <span class="l">Compétences<br>acquises</span></div>
      </div>
    </div>

    <p style="text-align:center;margin-top:16px;font-size:14px">
      <b style="color:#001C4A">Mention : ${esc(rel.mention)}</b>
      ${enr.completedAt ? ' · <span class="et ok">Certificat délivré</span>' : ''}</p>

    <div class="pieds">
      <div class="sig">
        <img src="${esc(params.signatureUrl || '/assets/signature.png')}" alt="">
        <div class="trait"></div>
        <small><b>${esc(params.signataireNom || 'Michael Jacques')}</b><br>${esc(params.signataireTitre || 'Directeur général — Oasis')}</small>
      </div>
      <div class="sceau"><img src="${esc(params.sceauUrl || '/assets/sceau-oasis.png')}" alt="Sceau officiel"></div>
      <div class="sig">
        <div style="height:54px"></div>
        <div class="trait"></div>
        <small><b>${esc(formateur.name)}</b><br>Formateur responsable</small>
      </div>
    </div>

    <p class="legal">Relevé établi automatiquement par la plateforme Oasis le ${new Date().toISOString().slice(0, 10)}.
      Authenticité vérifiable en scannant le QR code${qr ? ' ou sur ' + esc(qr.url) : ''}.<br>
      Barème : note globale = moyenne des modules × ${b.cfg.poidsQuiz} % + évaluation finale × ${b.cfg.poidsExamen} %.</p>
  </div></div>

  <div class="outils">
    <button onclick="print()">🖨️ Télécharger en PDF / imprimer</button>
    ${enr.completedAt ? `<a href="/certificat/${esc(enr.id)}">🎖️ Voir le certificat</a>` : ''}
    <a href="/apprenant/cours/${esc(cours.id)}/bilan">← Retour</a>
  </div>
  </body></html>`;
}

module.exports = {
  dashFormateur, mesFormationsF, creerFormation, gererFormation,
  revenusF, abonnesF, avisF,
  dashApprenant, lecteurCours, pageQuiz, pageBilan, certificatsA, certificat, releveNotes,
  pageNotesFormateur, profilFormateurEdit, pageForum, pageSujet,
  pageExamen, pageEpreuve, pageCorrections, adminCandidatures, adminParametres, adminModeration,
  dashEntreprise, collaborateursE, formationsE, rapportsE
};

/* Accueil de l’administration : destination de « Mon espace ». */
function dashAdmin(user, db) {
  const pending = db.users.filter(u => u.role === 'formateur' && u.candidature && u.candidature.statut === 'en_attente').length;
  const review = db.courses.filter(c => c.statut === 'en_verification').length;
  const published = db.courses.filter(c => c.statut === 'publiee').length;
  const learners = db.users.filter(u => u.role === 'apprenant').length;
  const modules = [
    ['/admin/candidatures', '📝', 'Candidatures formateurs', 'Examiner les demandes et gérer les décisions.'],
    ['/admin/moderation', '🔎', 'Formations à vérifier', 'Contrôler les formations avant leur publication.'],
    ['/admin/parametres', '🎖️', 'Paramètres des certificats', 'Configurer le sceau, la signature et les certificats.'],
    ['/gestion', '🏛️', 'Gestion de l’institution', 'Consulter les indicateurs de scolarité, de personnel et de comptabilité.'],
    ['/gestion/etudiants', '🎓', 'Dossiers étudiants', 'Suivre les inscriptions et les dossiers étudiants.'],
    ['/gestion/rh', '👔', 'Personnel et ressources humaines', 'Consulter et gérer les membres du personnel.'],
    ['/gestion/rh/paie', '💵', 'Paie', 'Accéder aux salaires et aux opérations de paie.'],
    ['/gestion/compta', '📘', 'Comptabilité', 'Accéder aux écritures et aux états financiers.'],
    ['/formations', '📚', 'Catalogue des formations', 'Consulter les formations disponibles sur la plateforme.']
  ];
  return shell('Tableau de bord administrateur', user, MENU_ADMIN, '/admin', `
    <h1>Mon espace administrateur</h1>
    <p class="sous">Bienvenue, ${esc(user.name)}. Accédez aux modules d’administration et de gestion d’OASIS.</p>
    <div class="grille g4">
      ${[[pending,'Candidatures en attente'],[review,'Formations à vérifier'],[published,'Formations publiées'],[learners,'Comptes apprenants']].map(([n,l])=>`<div class="carte stat-carte"><span class="lib">${esc(l)}</span><span class="val">${n}</span></div>`).join('')}
    </div>
    <div class="grille g3" style="margin-top:20px">
      ${modules.map(([h,icon,label,desc])=>`<div class="carte"><h2 style="margin-top:0">${icon} ${esc(label)}</h2><p>${esc(desc)}</p><a class="btn petit" href="${h}">Ouvrir</a></div>`).join('')}
    </div>`, {sombre:true,sousTitre:'Administration'});
}
module.exports.dashAdmin = dashAdmin;
