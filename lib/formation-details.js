'use strict';
const {esc}=require('./utils');
const fields=[
 ['objectifs','Objectifs de la formation','area','Un objectif par ligne'],
 ['competences','Compétences à acquérir','area','Savoirs et savoir-faire attendus à la fin de la formation'],
 ['debouches','Débouchés professionnels et poursuite d’études','area','Métiers, fonctions et perspectives'],
 ['equipements','Équipements et matériels nécessaires','area','Ordinateur, outils, salle, connexion, etc.'],
 ['logiciels','Logiciels et plateformes utilisés','area','Word, Excel, Access, Microsoft 365, Google Workspace, etc.'],
 ['grade','Grade ou qualification visée','text','Attestation, certificat, diplôme technique…'],
 ['diplome','Intitulé exact du diplôme ou certificat','text','Ex. Diplôme technique en informatique de gestion et bureautique'],
 ['niveauSortie','Niveau de sortie','text','Ex. Technicien spécialisé'],
 ['publicCible','Public cible','area','À qui s’adresse cette formation ?'],
 ['admission','Prérequis et conditions d’admission','area','Niveau scolaire, connaissances et documents requis'],
 ['methodes','Méthodes pédagogiques','area','Cours, travaux pratiques, ateliers, projets, études de cas'],
 ['evaluationDetails','Modalités d’évaluation','area','Quiz, travaux pratiques, projets, examens, soutenance'],
 ['conditionsDiplome','Conditions de réussite et d’obtention','area','Seuil de réussite, assiduité, stage ou projet requis']
];
function form(c={}){return `<fieldset style="border:1px solid var(--ligne);border-radius:12px;padding:14px;margin:18px 0"><legend><b>Présentation pédagogique et qualification</b></legend><p class="aide">Ces informations sont propres à cette formation. Les rubriques complétées sont visibles sur sa fiche publique.</p>${fields.map(([key,label,type,placeholder])=>`<label for="detail-${key}">${label}</label>${type==='area'?`<textarea id="detail-${key}" name="${key}" rows="3" maxlength="6000" placeholder="${esc(placeholder)}">${esc(c[key]||'')}</textarea>`:`<input id="detail-${key}" name="${key}" maxlength="300" value="${esc(c[key]||'')}" placeholder="${esc(placeholder)}">`}`).join('')}</fieldset>`;}
function apply(c,data){for(const [key,,type] of fields)if(Object.prototype.hasOwnProperty.call(data,key))c[key]=String(data[key]||'').trim().slice(0,type==='area'?6000:300);return c;}
const icons={objectifs:'🎯',competences:'🧩',debouches:'🚀',equipements:'🛠️',logiciels:'💻',grade:'🎓',diplome:'📜',niveauSortie:'🏅',publicCible:'👥',admission:'🔑',methodes:'📚',evaluationDetails:'✅',conditionsDiplome:'🏆'};
function display(c){
 const filled=fields.filter(([key])=>String(c[key]||'').trim());if(!filled.length)return '';
 return `<section class="carte pedagogie-details"><h2>Objectifs, compétences et perspectives</h2><div class="pedagogie-grille">${filled.map(([key,label,type])=>{
 const lines=String(c[key]).split(/\r?\n/).map(line=>line.trim().replace(/^(?:[•●▪*-]|\d+[.)])\s+/,'')).filter(Boolean);
 return `<article class="pedagogie-bloc"><span class="pedagogie-icon" aria-hidden="true">${icons[key]}</span><div><h3>${label}</h3>${type==='area'?`<ul>${lines.map(line=>`<li>${esc(line)}</li>`).join('')}</ul>`:`<p>${esc(c[key])}</p>`}</div></article>`;
 }).join('')}</div></section>`;
}
module.exports={fields,form,apply,display};
