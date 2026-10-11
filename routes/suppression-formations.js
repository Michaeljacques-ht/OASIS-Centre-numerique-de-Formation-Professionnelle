'use strict';
const crypto=require('crypto'),DB=require('../lib/db'),U=require('../lib/utils'),V=require('./views');
function allowed(user,c){return !!user&&(user.role==='admin'||user.role==='formateur'&&user.id===c.formateurId&&user.verified===true&&(!user.candidature||user.candidature.statut==='approuvee'));}
function button(c,user){return allowed(user,c)?`<a class="btn ligne petit" style="color:var(--rouge);border-color:var(--rouge)" href="/formateur/formation/${c.id}/supprimer">Supprimer la formation</a>`:'';}
async function handle(req,res,user){
 const match=req.pathname.match(/^\/formateur\/formation\/(crs_[a-z0-9]+)\/supprimer$/i);if(!match)return false;
 const send=(code,title,body)=>{U.sendHTML(res,code,V.layout(title,body,{user}));return true;};
 if(!user){U.redirect(res,'/login');return true;}
 const db=DB.get(),c=db.courses.find(c=>c.id===match[1]);if(!c)return send(404,'Formation introuvable','');if(!allowed(user,c))return send(403,'Suppression non autorisée','<p>Seuls l’administrateur et le formateur certifié propriétaire peuvent supprimer cette formation.</p>');
 if(!user.courseDeleteCsrf){user.courseDeleteCsrf=crypto.randomBytes(24).toString('hex');DB.save();}
 const page=error=>`<div class="page-head"><h1>Supprimer la formation</h1><p>${U.esc(c.titre)}</p></div><section class="carte">${error?`<p role="alert" class="alerte ko">${U.esc(error)}</p>`:''}<p>La formation sera retirée du catalogue et des espaces actifs. Les inscriptions, résultats et transactions existants seront conservés en archive.</p><form method="POST" action="${req.pathname}"><input type="hidden" name="csrf" value="${user.courseDeleteCsrf}"><label>Pour confirmer, saisissez exactement le titre : <b>${U.esc(c.titre)}</b></label><input name="confirmation" required maxlength="100" autocomplete="off"><div class="actions-h" style="margin-top:18px"><button class="btn" style="background:var(--rouge)">Confirmer la suppression</button><a class="btn ligne" href="/formateur/formation/${c.id}">Annuler</a></div></form></section>`;
 if(req.method==='GET')return send(200,'Supprimer la formation',page());
 if(req.method!=='POST')return send(405,'Méthode refusée','');
 const {data}=await U.readBody(req);
 if(!U.timingSafeEqual(data.csrf||'',user.courseDeleteCsrf))return send(403,'Session invalide','Rechargez la page de confirmation.');
 if(data.confirmation!==c.titre)return send(422,'Supprimer la formation',page('Le titre saisi ne correspond pas à la formation.'));
 db.coursesArchives ||= [];db.coursesArchives.push({...structuredClone(c),deletedAt:new Date().toISOString(),deletedBy:user.id});db.courses=db.courses.filter(x=>x.id!==c.id);
 db.auditLog ||= [];db.auditLog.push({id:U.rid('aud',6),userId:user.id,action:'course.deleted',details:{courseId:c.id,titre:c.titre},createdAt:new Date().toISOString()});DB.save();
 U.redirect(res,(c.parcoursType==='programme_long'?'/formateur/programmes':'/formateur/formations')+'?ok='+encodeURIComponent('Formation supprimée.'));return true;
}
module.exports={handle,button,allowed};
