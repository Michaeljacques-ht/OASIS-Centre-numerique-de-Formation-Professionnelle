'use strict';
let installPrompt;
window.addEventListener('beforeinstallprompt', e => {e.preventDefault(); installPrompt=e;});
if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(()=>{});
document.querySelectorAll('[data-share-path]').forEach(group=>{
 const url=new URL(group.dataset.sharePath, location.origin).href;
 const title=group.dataset.shareTitle;
 group.querySelectorAll('[data-network]').forEach(a=>{
 const u=encodeURIComponent(url), t=encodeURIComponent(title);
 a.href=a.dataset.network==='facebook' ? 'https://www.facebook.com/sharer/sharer.php?u='+u : a.dataset.network==='whatsapp' ? 'https://wa.me/?text='+t+'%20'+u : 'https://twitter.com/intent/tweet?text='+t+'&url='+u;
 });
 group.querySelector('[data-copy]')?.addEventListener('click',async e=>{try{await navigator.clipboard.writeText(url);e.target.textContent='Copié ✓';}catch{window.prompt('Copiez ce lien :',url);}});
});
document.querySelectorAll('[data-install]').forEach(b=>b.addEventListener('click',async()=>{
 if(installPrompt){await installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;}
 else if(window.matchMedia('(display-mode: standalone)').matches){alert('OASIS est déjà ouvert en application.');}
 else{alert('Pour installer OASIS, ouvrez le menu de votre navigateur puis « Installer l’application » ou « Ajouter à l’écran d’accueil ». Sur iPhone : Partager → Sur l’écran d’accueil.');}
}));
