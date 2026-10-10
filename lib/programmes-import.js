'use strict';
const crypto=require('crypto');
function integrate(db){
 const admin=db.users.find(u=>u.role==='admin');if(!admin)return 0;
 db.programmes=db.programmes||[];let count=0;
 for(const model of require('./programmes-importes.json')){
  const id='prg_'+crypto.createHash('sha256').update(model.importKey).digest('hex').slice(0,12);
  if(db.programmes.some(p=>p.id===id||p.importKey===model.importKey))continue;
  db.programmes.push({...structuredClone(model),id,ownerId:admin.id,statut:'brouillon',confirmerHeures:false,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});count++;
 }
 return count;
}
module.exports={integrate};
