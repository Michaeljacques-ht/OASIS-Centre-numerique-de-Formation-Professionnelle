'use strict';
const crypto=require('crypto');
// Les imports EDUCA sont retirés du catalogue actif et ne sont plus recréés.
// L’archive interne conserve les données et les suivis existants.
function integrate(db){
 db.programmes ||= [];
 const models=require('./programmes-importes.json'),sources=new Set(models.map(p=>p.source));sources.add(require('./programme-modele.json').source);
 const ids=new Set(models.map(p=>'prg_'+crypto.createHash('sha256').update(p.importKey).digest('hex').slice(0,12)));
 const removed=db.programmes.filter(p=>p.importKey||sources.has(p.source)||ids.has(p.id));if(!removed.length)return 0;
 const removedIds=new Set(removed.map(p=>p.id));db.programmesArchives ||= [];
 for(const p of removed)if(!db.programmesArchives.some(a=>a.id===p.id))db.programmesArchives.push({...p,archivedAt:new Date().toISOString(),archiveReason:'Retrait des programmes importés'});
 db.programmes=db.programmes.filter(p=>!removedIds.has(p.id));
 db.programmeEnrollmentsArchives ||= [];
 for(const e of db.programmeEnrollments||[])if(removedIds.has(e.programmeId))db.programmeEnrollmentsArchives.push(e);
 db.programmeEnrollments=(db.programmeEnrollments||[]).filter(e=>!removedIds.has(e.programmeId));
 for(const c of db.courses||[])if(removedIds.has(c.programmeId))c.programmeId=null;
 return removed.length;
}
module.exports={integrate};
