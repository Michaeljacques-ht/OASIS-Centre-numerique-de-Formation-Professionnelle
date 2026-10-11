'use strict';
if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(()=>{});
document.querySelectorAll('[data-share-path]').forEach(group=>{
 const url=new URL(group.dataset.sharePath, location.origin).href;
 const title=group.dataset.shareTitle;
 group.querySelectorAll('[data-network]').forEach(a=>{
 const u=encodeURIComponent(url), t=encodeURIComponent(title);
 a.href=a.dataset.network==='facebook' ? 'https://www.facebook.com/sharer/sharer.php?u='+u : a.dataset.network==='whatsapp' ? 'https://wa.me/?text='+t+'%20'+u : 'https://twitter.com/intent/tweet?text='+t+'&url='+u;
 });
 group.querySelector('[data-copy]')?.addEventListener('click',async e=>{const button=e.currentTarget;try{await navigator.clipboard.writeText(url);const label=button.querySelector('span');if(label)label.textContent='Copié ✓';else button.textContent='Copié ✓';}catch{window.prompt('Copiez ce lien :',url);}});
});
const socialMenus=Array.from(document.querySelectorAll('.social-dropdown'));
socialMenus.forEach(menu=>menu.addEventListener('toggle',()=>{if(menu.open)socialMenus.forEach(other=>{if(other!==menu)other.open=false;});}));
document.addEventListener('click',e=>socialMenus.forEach(menu=>{if(!menu.contains(e.target))menu.open=false;}));
document.addEventListener('keydown',e=>{if(e.key==='Escape')socialMenus.forEach(menu=>{if(menu.open){menu.open=false;menu.querySelector('summary').focus();}});});

const cookiePanel=document.getElementById('cookie-consent');
function cookiePreference(){return document.cookie.split('; ').find(c=>c.startsWith('oasis_cookie_consent='))?.split('=')[1];}
if(cookiePanel){cookiePanel.hidden=['accepted','rejected'].includes(cookiePreference());
 document.querySelectorAll('[data-cookie-choice]').forEach(button=>button.addEventListener('click',()=>{
  const choice=button.dataset.cookieChoice;
  document.cookie='oasis_cookie_consent='+choice+'; Path=/; Max-Age=15552000; SameSite=Lax'+(location.protocol==='https:'?'; Secure':'');
  cookiePanel.hidden=true;window.dispatchEvent(new CustomEvent('oasis:cookie-consent',{detail:{optional:choice==='accepted'}}));
 }));
}
