'use strict';
const crypto=require('crypto');
const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
function secret(){let bits='';for(const byte of crypto.randomBytes(20))bits+=byte.toString(2).padStart(8,'0');let out='';for(let i=0;i<bits.length;i+=5)out+=alphabet[parseInt(bits.slice(i,i+5),2)];return out;}
function code(key, step=Math.floor(Date.now()/30000)){let bits='';for(const c of key)bits+=alphabet.indexOf(c).toString(2).padStart(5,'0');const bytes=[];for(let i=0;i+8<=bits.length;i+=8)bytes.push(parseInt(bits.slice(i,i+8),2));const counter=Buffer.alloc(8);counter.writeBigUInt64BE(BigInt(step));const h=crypto.createHmac('sha1',Buffer.from(bytes)).update(counter).digest();const o=h[19]&15;return String((h.readUInt32BE(o)&0x7fffffff)%1000000).padStart(6,'0');}
function verify(key, value, last=-1){if(!/^\d{6}$/.test(String(value||'')))return null;const now=Math.floor(Date.now()/30000);for(const step of [now-1,now,now+1])if(step>last&&crypto.timingSafeEqual(Buffer.from(code(key,step)),Buffer.from(value)))return step;return null;}
const attempts=new Map();
function limited(key,max=10){const now=Date.now();for(const [k,v] of attempts)if(v.until<now)attempts.delete(k);const v=attempts.get(key)||{n:0,until:now+600000};v.n++;attempts.set(key,v);return v.n>max;}
const token=()=>crypto.randomBytes(32).toString('hex');
const digest=t=>crypto.createHash('sha256').update(t).digest('hex');
async function sendReset(email,url){if(!process.env.BREVO_API_KEY||!process.env.MAIL_FROM)throw Error('email_not_configured');const r=await fetch('https://api.brevo.com/v3/smtp/email',{method:'POST',headers:{'api-key':process.env.BREVO_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({sender:{name:'OASIS',email:process.env.MAIL_FROM},to:[{email}],subject:'Réinitialiser votre mot de passe OASIS',textContent:'Pour réinitialiser votre mot de passe (lien valable 30 minutes) : '+url+'\nSi vous ne l’avez pas demandé, ignorez ce message.'}),signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('email_delivery_failed');}
module.exports={secret,code,verify,limited,token,digest,sendReset};
