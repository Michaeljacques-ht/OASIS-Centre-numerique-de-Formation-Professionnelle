'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),DB=require('../lib/db'),U=require('../lib/utils'),V=require('./views'),P=require('../lib/progression');
const dir=()=>{const d=path.join(process.env.DATA_DIR||path.join(__dirname,'../data'),'evaluations-html');fs.mkdirSync(d,{recursive:true});return d;};
function csrf(user){if(!user.htmlUploadCsrf){user.htmlUploadCsrf=crypto.randomBytes(24).toString('hex');DB.save();}return user.htmlUploadCsrf;}
function uploadForm(c,user,module){const action='/formateur/formation/'+c.id+(module?'/module/'+module.id:'/final')+'/html';const existing=module?.quiz?.html;return `<div class="panneau" style="margin:12px 0"><b>📄 Importer une évaluation HTML interactive</b><p class="aide">Fichier autonome .html (5 Mo maximum), avec son CSS et ses scripts. À la fin de l’activité, il doit appeler <code>OASIS.submit(score, total)</code> pour enregistrer automatiquement la note et débloquer la suite.</p>${existing?`<p>Fichier actuel : ${U.esc(existing.nomOriginal)}</p>`:''}<form method="POST" action="${action}" enctype="multipart/form-data"><input type="hidden" name="csrf" value="${csrf(user)}">${module?'':'<label>Titre de l’évaluation</label><input name="titre" required maxlength="120" placeholder="Évaluation finale interactive"><label>Poids de cette épreuve (%)</label><input name="poids" type="number" min="1" max="100" value="100">'}<input name="html" type="file" accept=".html,.htm,text/html" required><button class="btn petit" style="margin-top:8px">${existing?'Remplacer le fichier HTML':'Importer le fichier HTML'}</button></form></div>`;}
function documentHTML(file){if(!/^html_[a-f0-9]+\.html$/.test(file.nom))throw Error('Fichier invalide');return fs.readFileSync(path.join(dir(),file.nom),'utf8');}
async function handle(req,res,user,completion){
 const db=DB.get(),url=req.pathname,method=req.method;
 let match=url.match(/^\/formateur\/formation\/(crs_[a-z0-9]+)\/(?:module\/(mod_[a-z0-9]+)|final)\/html$/i);
 if(match){
  if(!user)return U.redirect(res,'/login'),true;
  const c=db.courses.find(c=>c.id===match[1]&&(user.role==='admin'||user.role==='formateur'&&c.formateurId===user.id));
  if(!c)return U.sendHTML(res,403,'Accès refusé'),true;
  if(method!=='POST')return U.sendHTML(res,405,'Méthode non autorisée'),true;
  const module=match[2]?c.modules.find(m=>m.id===match[2]):null;if(match[2]&&!module)return U.sendHTML(res,404,'Module introuvable'),true;
  const mp=await U.parseMultipart(req).catch(()=>null);const f=mp?.files.find(f=>f.field==='html');
  if(!mp||mp.fields.csrf!==user.htmlUploadCsrf||!user.htmlUploadCsrf)return U.sendHTML(res,403,'Formulaire expiré. Rechargez la page.'),true;
  if(!f||! /\.html?$/i.test(f.filename)||!f.data?.length||f.data.length>5*1024*1024)return U.sendHTML(res,422,'Importez un fichier HTML non vide de 5 Mo maximum.'),true;
  const source=f.data.toString('utf8');if(!/<(?:!doctype|html|body|script|div|section|main)\b/i.test(source))return U.sendHTML(res,422,'Le fichier ne contient pas de document HTML valide.'),true;
  const file={nom:'html_'+crypto.randomBytes(16).toString('hex')+'.html',nomOriginal:String(f.filename).slice(0,120)};fs.writeFileSync(path.join(dir(),file.nom),source);
  if(module){module.quiz={html:file,questions:[]};}else{c.examenFinal={epreuves:DB.epreuvesDe(c)};c.examenFinal.epreuves.push({id:U.rid('ep',4),type:'html',titre:String(mp.fields.titre||'Évaluation HTML finale').slice(0,120),poids:Math.min(100,Math.max(1,Number(mp.fields.poids)||100)),html:file});}
  DB.save();U.redirect(res,'/formateur/formation/'+c.id+'?ok='+encodeURIComponent('Évaluation HTML importée. La note sera enregistrée via OASIS.submit(score, total).'));return true;
 }
 match=url.match(/^\/apprenant\/cours\/(crs_[a-z0-9]+)\/html\/(mod_[a-z0-9]+|ep_[a-z0-9_]+)(\/resultat)?$/i);
 if(!match)return false;
 if(!user)return U.redirect(res,'/login'),true;
 const c=db.courses.find(c=>c.id===match[1]),enr=c&&db.enrollments.find(e=>e.courseId===c.id&&e.userId===user.id);if(!enr)return U.sendHTML(res,403,'Inscription requise'),true;
 const target=match[2],mod=c.modules.find(m=>m.id===target),ep=DB.epreuvesDe(c).find(e=>e.id===target),file=mod?.quiz?.html||ep?.html;
 const state=mod&&P.etats(c,enr).find(e=>e.m.id===target);if(!file||mod&&(!state.ouvert||!state.leconsOk)||!mod&&!P.finaleOuverte(c,enr))return U.redirect(res,P.suite(c,enr)),true;
 if(match[3]){
  if(method!=='POST')return U.sendJSON(res,405,{error:'Méthode non autorisée'}),true;
  const {data}=await U.readBody(req),attempt=enr.htmlAttempts?.[target];
  if(!attempt||attempt.token!==data.token||attempt.expires<Date.now()||attempt.file!==file.nom)return U.sendJSON(res,403,{error:'Session expirée. Rechargez l’évaluation.'}),true;
  const score=Number(data.score),total=Number(data.total);if(!String(data.score||'').trim()||!String(data.total||'').trim()||!Number.isFinite(score)||!Number.isFinite(total)||total<=0||score<0||score>total||total>1000000)return U.sendJSON(res,422,{error:'Résultat invalide'}),true;
  const pct=Math.round(100*score/total),result={score,total,pct,reussi:pct>=P.seuil(c),at:new Date().toISOString()};
  if(mod){enr.evaluations=enr.evaluations||{};if(!enr.evaluations[target]||pct>=enr.evaluations[target].pct)enr.evaluations[target]=result;}
  else{enr.soumissions=enr.soumissions||{};if(!enr.soumissions[target]||pct>=enr.soumissions[target].note)enr.soumissions[target]={type:'html',note:pct,detail:score+'/'+total,at:result.at};}
  delete enr.htmlAttempts[target];completion(enr,c);DB.audit(user.id,'evaluation.html.soumise',{courseId:c.id,target,pct});DB.save();const best=mod?enr.evaluations[target].pct:enr.soumissions[target].note;U.sendJSON(res,200,{pct,best,reussi:best>=P.seuil(c),suite:P.suite(c,enr),completed:!!enr.completedAt});return true;
 }
 if(method!=='GET')return U.sendHTML(res,405,'Méthode non autorisée'),true;
 const token=crypto.randomBytes(24).toString('hex');enr.htmlAttempts=enr.htmlAttempts||{};enr.htmlAttempts[target]={token,expires:Date.now()+3600000,file:file.nom};DB.save();
 let source;try{source=documentHTML(file);}catch{return U.sendHTML(res,404,'Fichier introuvable'),true;}
 const bridge='<script>window.OASIS={submit:function(score,total){parent.postMessage({type:"oasis:result",score:score,total:total},"*");}};<\/script>';
 source=bridge+source;
 const endpoint='/apprenant/cours/'+c.id+'/html/'+target+'/resultat';
 const content=`<a href="/apprenant/cours/${c.id}">← Retour au parcours</a><h1>${U.esc(mod?'Évaluation — '+mod.titre:ep.titre)}</h1><p>Seuil de réussite : ${P.seuil(c)} %. Votre note est intégrée au bilan.</p><iframe id="html-evaluation" title="Évaluation interactive" sandbox="allow-scripts" referrerpolicy="no-referrer" srcdoc="${U.esc(source)}" style="width:100%;height:75vh;border:1px solid #d9e4ef;border-radius:16px;background:#fff"></iframe><div id="html-result" role="status" aria-live="polite"></div><script>(function(){const frame=document.getElementById('html-evaluation'),status=document.getElementById('html-result');let busy=false,done=false;window.addEventListener('message',async function(e){if(e.source!==frame.contentWindow||e.data?.type!=='oasis:result'||busy||done)return;busy=true;status.textContent='Enregistrement du résultat…';try{const r=await fetch(${JSON.stringify(endpoint)},{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({token:${JSON.stringify(token)},score:e.data.score,total:e.data.total})});const data=await r.json();if(!r.ok)throw Error(data.error);done=true;status.textContent='Votre note : '+data.pct+' % · Meilleure note : '+data.best+' % · '+(data.reussi?'Réussi !':'Révisez et réessayez.');const a=document.createElement('a');a.className='btn';a.style.margin='12px';a.textContent=data.reussi?'Continuer le parcours':'Réessayer';a.href=data.reussi?data.suite:location.pathname;status.append(a);if(data.reussi)window.location.assign(data.suite);}catch(error){status.textContent=error.message;}finally{busy=false;}});})();</script>`;
 res.setHeader('Cache-Control','no-store');U.sendHTML(res,200,V.layout('Évaluation HTML',content,{user}));return true;
}
module.exports={handle,uploadForm};
