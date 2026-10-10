'use strict';
const {esc}=require('./utils');
const FIELDS=new Set(['presentation','publicCible','admission','objectifs','competences','debouches','methodes','materiels']);
function items(value){
 const lines=String(value||'').replace(/\r/g,'').split('\n'),marked=lines.some(l=>/^\s*(?:[•●▪◦*–-]|\d+[.)])\s+/.test(l));
 if(marked){const out=[];let current='';for(const line of lines){const m=line.match(/^\s*(?:[•●▪◦*–-]|\d+[.)])\s+(.*)$/);if(m){if(current.trim())out.push(current.trim());current=m[1];}else if(line.trim())current+=' '+line.trim();}if(current.trim())out.push(current.trim());return out.map(x=>x.replace(/\s+/g,' '));}
 // Les paragraphes importés sont conservés ; les points sont ensuite éditables séparément.
 return String(value||'').trim().split(/\n\s*\n/).map(x=>x.replace(/\s+/g,' ').trim()).filter(Boolean);
}
function normalize(value){return items(value).map(x=>'• '+x).join('\n');}
function display(value){const rows=items(value);return rows.length?`<ul class="pg-bullets">${rows.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:'<p>À préciser</p>';}
module.exports={FIELDS,items,normalize,display};
