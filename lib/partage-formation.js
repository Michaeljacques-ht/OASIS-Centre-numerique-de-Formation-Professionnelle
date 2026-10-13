'use strict';
function clean(s){return String(s||'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();}
function description(c){const price=Number(c.prix)===0?'Gratuit':new Intl.NumberFormat('fr-FR').format(Number(c.prix)||0)+' HTG';const details=[c.niveau,c.duree,c.modalite==='hybride'?'Hybride':c.modalite==='presentiel'?'En présentiel':'En ligne',price].filter(Boolean).join(' · ');const text=clean(c.sousTitre||c.description||c.objectifs);return details+(text?' — '+text.slice(0,Math.max(0,280-details.length-3)):'');}
function text(c){return clean(c.titre)+'\n'+description(c);}
module.exports={description,text};
