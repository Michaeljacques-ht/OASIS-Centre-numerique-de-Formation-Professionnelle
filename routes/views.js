'use strict';
/* ============================================================
   OASIS — Gabarits HTML (pages publiques)
   Identité visuelle issue du logo Oasis : marine #001C4A, bleu #0166C2,
   émeraude #06C994 et or #FC9F1E,
   violet #7C3AED (espace formateur), vert #10B981 (entreprise).
   ============================================================ */
const { esc, fmtHTG } = require('../lib/utils');
const { CATEGORIES, FORMATS, MODALITES, SOCLE_TRANSVERSAL, PLANS, categorie, format: fmtDe, modalite: modDe, blocSocle, noteCours, nbInscrits, nbLecons, epreuvesDe, TYPES_EPREUVES } = require('../lib/db');
const PP = require('../lib/plopplop');

const CSS = `
:root{
/* Palette extraite du logo Oasis : marine profond, bleu, turquoise, émeraude, or */
--marine:#001C4A;--marine-f:#00122F;--bleu:#0166C2;--bleu-vif:#0CAFFA;--bleu-pale:#E8F4FE;
--turquoise:#61DBFE;--vert:#06C994;--vert-f:#059E74;--orange:#FC9F1E;--orange-pale:#FFF4E3;
--violet:#5B4AC4;
--encre:#0B1F3F;--texte:#39485F;--sourd:#6B7A90;--ligne:#E3EAF3;--fond:#F6F9FC;--carte:#fff;
--rouge:#E23D3D;--jaune:#FC9F1E;
--r-carte:20px;--r-champ:12px;--r-pilule:14px;
--ombre:0 10px 30px rgba(0,28,74,.08);--ombre-f:0 16px 40px rgba(0,28,74,.15);
--degrade:linear-gradient(90deg,#001C4A 0%,#0166C2 100%);
--degrade-accent:linear-gradient(90deg,#001C4A 0%,#0166C2 42%,#06C994 76%,#FC9F1E 100%)}
*{box-sizing:border-box;margin:0;padding:0}
html{overflow-x:hidden}
body{font-family:'Inter','Segoe UI',Roboto,-apple-system,BlinkMacSystemFont,Arial,sans-serif;
background:var(--fond);color:var(--texte);font-size:15px;line-height:1.6;
-webkit-font-smoothing:antialiased;overflow-x:hidden}
a{color:var(--bleu);text-decoration:none;font-weight:600}a:hover{text-decoration:underline}

/* ---- Barre latérale verticale (navigation principale) ---- */
.cadre{display:grid;grid-template-columns:262px 1fr;min-height:100vh;position:relative;z-index:1}
.rail{background:linear-gradient(180deg,#fff 0%,#F8FBFF 100%);border-right:1px solid var(--ligne);
padding:18px 14px 18px;display:flex;flex-direction:column;gap:16px;position:sticky;top:0;
height:100vh;overflow-y:auto}
.colonne{display:flex;flex-direction:column;min-width:0}
.logo{display:flex;align-items:center;gap:10px;text-decoration:none;padding:10px;border:1px solid var(--ligne);
border-radius:18px;background:linear-gradient(135deg,#fff 0%,#EFF6FF 100%);box-shadow:0 8px 24px rgba(0,28,74,.06)}
.logo:hover{text-decoration:none}
.logo-img{width:44px;height:44px;object-fit:contain;display:block;flex:0 0 auto}
.logo-txt{line-height:1.12;min-width:0}
.logo .l1{color:var(--marine);font-weight:800;font-size:19px;letter-spacing:.01em;display:block}
.logo .l2{color:var(--bleu);font-size:8.4px;letter-spacing:.04em;display:block;font-weight:700;
text-transform:uppercase}
.rail-nav{display:flex;flex-direction:column;gap:13px;flex:1}
.nav-group{display:flex;flex-direction:column;gap:5px}
.nav-title{font-size:10px;text-transform:uppercase;letter-spacing:.12em;font-weight:800;color:#7A8AA0;
padding:0 10px 2px}
.rail-nav a{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:15px;color:var(--texte);
font-weight:700;font-size:13.8px;text-decoration:none;position:relative;transition:background .15s,box-shadow .15s,transform .15s,color .15s}
.rail-nav a .ic{font-size:15px;width:30px;height:30px;border-radius:12px;text-align:center;flex:0 0 auto;
display:inline-flex;align-items:center;justify-content:center;background:#F0F6FF;box-shadow:inset 0 0 0 1px rgba(1,102,194,.06)}
.rail-nav a:hover{background:#fff;color:var(--marine);text-decoration:none;box-shadow:0 8px 20px rgba(0,28,74,.08);
transform:translateX(2px)}
.rail-nav a.on{background:var(--degrade);color:#fff;box-shadow:0 12px 26px rgba(0,28,74,.24)}
.rail-nav a.on .ic{background:rgba(255,255,255,.18);box-shadow:inset 0 0 0 1px rgba(255,255,255,.24)}
.rail-bas{border-top:1px solid var(--ligne);padding-top:14px;background:#fff;border-radius:18px;padding:14px;
box-shadow:0 8px 22px rgba(0,28,74,.06)}
.rail-moi{display:flex;align-items:center;gap:10px;margin-bottom:11px}
.rail-moi b{font-size:14px;color:var(--encre);display:block;line-height:1.25}
.rail-moi small{font-size:11px;color:var(--sourd);text-transform:uppercase;letter-spacing:.08em;font-weight:700}
.rail-quitter{display:block;text-align:center;margin-top:9px;font-size:12.5px;color:var(--sourd)}

/* ---- Barre supérieure façon portail EDUCA ---- */
.topbar{height:76px;background:rgba(255,255,255,.94);border-bottom:1px solid var(--ligne);
display:flex;align-items:center;justify-content:space-between;gap:20px;padding:0 26px;
position:sticky;top:0;z-index:35;backdrop-filter:saturate(160%) blur(10px)}
.topbar .titre-page{display:flex;align-items:center;gap:12px;min-width:0}
.topbar .titre-page img{width:40px;height:40px;object-fit:contain}
.topbar .titre-page strong{display:block;color:var(--marine);font-size:16px;line-height:1.2}
.topbar .titre-page span{display:block;color:var(--sourd);font-size:12px;font-weight:650}
.topbar-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end}
.topbar-actions .btn{box-shadow:none}
.avatar{width:38px;height:38px;border-radius:14px;color:#fff;display:inline-flex;align-items:center;
justify-content:center;font-weight:800;font-size:13px;box-shadow:0 8px 18px rgba(0,28,74,.16);
flex:0 0 auto}
.page-head{background:#fff;border:1px solid var(--ligne);border-radius:18px;padding:22px 24px;
box-shadow:var(--ombre);margin-bottom:18px;position:relative;overflow:hidden}
.page-head::before{content:'';position:absolute;inset:0 auto 0 0;width:5px;background:var(--degrade-accent)}
.page-head h1{font-size:28px}
.page-head .sous{margin-bottom:0}

/* ---- En-tête compacte sur mobile ---- */
.barre-mobile{display:none;align-items:center;gap:12px;background:#fff;
border-bottom:1px solid var(--ligne);padding:10px 14px;position:sticky;top:0;z-index:40}
.burger{font-size:23px;line-height:1;cursor:pointer;color:var(--marine);padding:2px 6px;user-select:none}
.logo-mini{display:flex;align-items:center;gap:8px;flex:1;text-decoration:none}
.logo-mini img{width:32px;height:32px;object-fit:contain}
.logo-mini b{color:var(--marine);font-size:17px;letter-spacing:.01em}
.voile{display:none}
.bascule-menu:checked ~ .rail{transform:translateX(0)}
.bascule-menu:checked ~ .colonne .voile{display:block;position:fixed;inset:0;z-index:45;
background:rgba(0,28,74,.38)}

main{max-width:1180px;margin:0 auto;width:100%;padding:28px 26px 70px;flex:1}
h1{font-size:30px;letter-spacing:-.025em;color:var(--encre);font-weight:800;line-height:1.2}
h2{font-size:19px;color:var(--encre);margin:26px 0 12px;font-weight:750;letter-spacing:-.01em}
p.sous{color:var(--sourd);margin:8px 0 22px}

/* ---- Cartes ---- */
.carte{background:var(--carte);border:1px solid var(--ligne);border-radius:var(--r-carte);padding:22px;
box-shadow:var(--ombre)}
.panneau{background:#fff;border:1px solid var(--ligne);border-radius:var(--r-champ);padding:18px;
margin-bottom:14px}
.grille{display:grid;gap:18px}
.g2{grid-template-columns:repeat(auto-fit,minmax(320px,1fr))}
.g3{grid-template-columns:repeat(auto-fit,minmax(240px,1fr))}
.g4{grid-template-columns:repeat(auto-fit,minmax(200px,1fr))}
.g-stats{grid-template-columns:repeat(auto-fit,minmax(158px,1fr));gap:14px}
.g-stats .carte{padding:17px 18px}
.g-stats .val{font-size:23px;line-height:1.15}

/* ---- Boutons ---- */
.btn{display:inline-block;background:var(--degrade);color:#fff;border:0;padding:12px 22px;
border-radius:var(--r-champ);font-weight:700;font-size:14.5px;cursor:pointer;font-family:inherit;
box-shadow:0 6px 16px rgba(0,28,74,.22);transition:transform .12s,box-shadow .12s}
.btn:hover{text-decoration:none;transform:translateY(-1px);box-shadow:var(--ombre-f);color:#fff}
.btn.violet{background:linear-gradient(90deg,#3C2F8F,#5B4AC4)}
.btn.vert{background:linear-gradient(90deg,#059E74,#06C994)}
.btn.ligne{background:#fff;color:var(--marine);border:1.5px solid var(--ligne);box-shadow:none}
.btn.ligne:hover{background:var(--bleu-pale);border-color:var(--bleu);color:var(--marine)}
.btn.petit{padding:8px 15px;font-size:13px;border-radius:10px}

/* ---- Badges ---- */
.badge{display:inline-block;padding:3px 12px;border-radius:99px;font-size:12px;font-weight:700;
letter-spacing:.01em}
.b-bleu{background:var(--bleu-pale);color:var(--marine)}
.b-vert{background:#E0F8F0;color:#046A4D}
.b-orange{background:var(--orange-pale);color:#C4520E}
.b-violet{background:#EDEAFB;color:#3C2F8F}
.b-rouge{background:#FDEBEB;color:#B02121}
.concept-hero{background:linear-gradient(135deg,#fff 0%,#EFF6FF 54%,#FFF4E3 100%);border:1px solid var(--ligne);
border-radius:24px;padding:34px;box-shadow:var(--ombre);display:grid;grid-template-columns:1.15fr .85fr;
gap:24px;align-items:center;overflow:hidden;position:relative}
.concept-hero::after{content:'';position:absolute;right:-70px;bottom:-90px;width:240px;height:240px;border-radius:50%;
background:radial-gradient(circle,rgba(6,201,148,.18),rgba(1,102,194,0));pointer-events:none}
.concept-card{background:#fff;border:1px solid var(--ligne);border-radius:18px;padding:18px;box-shadow:0 8px 24px rgba(0,28,74,.06)}
.concept-card b{color:var(--encre)}
.doc-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;align-items:stretch}
.doc-preview{background:#fff;border:1px solid #D9E4F2;border-radius:18px;padding:24px;box-shadow:var(--ombre);position:relative;overflow:hidden}
.doc-preview::before{content:'';position:absolute;inset:0 auto 0 0;width:6px;background:var(--degrade-accent)}
.doc-watermark{position:absolute;right:18px;top:16px;color:rgba(0,28,74,.07);font-size:62px;font-weight:900;line-height:1}
.doc-head{display:flex;align-items:center;gap:10px;border-bottom:1px solid var(--ligne);padding-bottom:12px;margin-bottom:16px}
.doc-head img{width:48px;height:48px;object-fit:contain}
.doc-title{font-size:22px;color:var(--marine);font-weight:900;letter-spacing:.04em;text-transform:uppercase}
.doc-line{display:grid;grid-template-columns:120px 1fr;gap:10px;padding:8px 0;border-bottom:1px dashed #EDF2F7;font-size:13px}
.doc-line span:first-child{color:var(--sourd);font-weight:700}
.qr-demo{width:76px;height:76px;border:9px solid #111;background:linear-gradient(90deg,#111 18%,transparent 18% 36%,#111 36% 54%,transparent 54% 72%,#111 72%);
border-radius:8px}
.faq-list{display:grid;gap:10px}
.faq-item{background:#fff;border:1px solid var(--ligne);border-radius:16px;box-shadow:0 8px 22px rgba(0,28,74,.05);overflow:hidden}
.faq-item summary{cursor:pointer;padding:16px 18px;font-weight:800;color:var(--encre);list-style:none}
.faq-item summary::-webkit-details-marker{display:none}
.faq-item summary::after{content:'+';float:right;color:var(--bleu);font-size:20px;line-height:1}
.faq-item[open] summary::after{content:'–'}
.faq-item p{padding:0 18px 18px;color:var(--texte)}
.b-gris{background:#F1F4F9;color:var(--sourd)}

/* ---- Formulaires ---- */
input,select,textarea{width:100%;padding:12px 14px;border:1.5px solid var(--ligne);
border-radius:var(--r-champ);font-size:15px;font-family:inherit;background:#fff;color:var(--texte)}
input:focus,select:focus,textarea:focus{outline:0;border-color:var(--bleu);
box-shadow:0 0 0 4px rgba(1,102,194,.14)}
input::placeholder,textarea::placeholder{color:#A7B0BE}
label{display:block;font-weight:700;font-size:13px;margin:15px 0 6px;color:var(--encre)}
.aide{font-size:12px;color:var(--sourd);margin-top:5px}

/* ---- Tableaux ---- */
table{width:100%;border-collapse:collapse;font-size:14px}
th{text-align:left;color:var(--sourd);font-size:11.5px;text-transform:uppercase;letter-spacing:.08em;
font-weight:700;padding:11px 12px;border-bottom:1.5px solid var(--ligne)}
td{padding:13px 12px;border-bottom:1px solid var(--ligne);vertical-align:middle}
td.num{text-align:right;font-variant-numeric:tabular-nums}

.alerte{padding:14px 18px;border-radius:var(--r-champ);margin-bottom:18px;font-size:14px;font-weight:600}
.alerte.ok{background:#E0F8F0;color:#046A4D}
.alerte.ko{background:#FDEBEB;color:#B02121}
footer{text-align:center;color:var(--sourd);font-size:13px;padding:28px;border-top:1px solid var(--ligne);
background:#fff}

/* ---- Accueil : bannière maîtrisée + actions cliquables ---- */
.banniere-bloc{background:linear-gradient(135deg,#EFF6FF 0%,#fff 58%,#FFF7EA 100%);
border:1px solid var(--ligne);border-radius:24px;padding:18px;box-shadow:var(--ombre);
margin-bottom:22px;position:relative;overflow:hidden}
.banniere-wrap{position:relative;border-radius:18px;overflow:hidden;background:#fff;max-height:520px;
display:flex;align-items:center;justify-content:center}
.banniere{display:block;width:100%;height:auto;max-height:520px;object-fit:contain}
.banniere-spot{position:absolute;border-radius:18px;outline:2px solid transparent;
transition:background .15s,outline-color .15s,box-shadow .15s}
.banniere-spot:hover,.banniere-spot:focus-visible{background:rgba(1,102,194,.12);
outline-color:rgba(1,102,194,.45);box-shadow:0 0 0 6px rgba(255,255,255,.45);text-decoration:none}
.spot-formations{left:6.4%;top:58%;width:7.7%;height:19%}
.spot-certificats{left:16.4%;top:58%;width:7.2%;height:19%}
.spot-ressources{left:25.9%;top:58%;width:7.2%;height:19%}
.spot-flexible{left:35.1%;top:58%;width:7.4%;height:19%}
.spot-developpement{left:44.6%;top:58%;width:7.5%;height:19%}
.spot-apprendre{left:21%;top:85%;width:13.2%;height:10.5%}
.spot-evoluer{left:38.3%;top:85%;width:11.8%;height:10.5%}
.spot-construire{left:57%;top:85%;width:14.6%;height:10.5%}
.spot-commencer{left:75.8%;top:85.6%;width:20.5%;height:9.2%;border-radius:999px}
.banner-actions{display:grid;grid-template-columns:repeat(auto-fit,minmax(155px,1fr));gap:10px;margin-top:12px}
.banner-actions a{background:#fff;border:1px solid var(--ligne);border-radius:14px;padding:11px 12px;
color:var(--encre);box-shadow:0 8px 20px rgba(0,28,74,.06);display:flex;align-items:center;
gap:9px;text-decoration:none;font-size:13.5px}
.banner-actions a:hover{border-color:var(--bleu);transform:translateY(-1px);box-shadow:var(--ombre)}
.banner-actions i{width:31px;height:31px;border-radius:11px;display:inline-flex;align-items:center;
justify-content:center;background:var(--bleu-pale);font-style:normal;flex:0 0 auto}
.formation-marquee{border:1px solid var(--ligne);background:#fff;border-radius:18px;box-shadow:var(--ombre);
overflow:hidden;margin:0 0 24px;display:grid;grid-template-columns:auto 1fr;align-items:center}
.formation-marquee .marquee-label{height:100%;background:var(--marine);color:#fff;padding:13px 16px;
font-weight:800;font-size:12px;letter-spacing:.08em;text-transform:uppercase;display:flex;align-items:center}
.marquee-window{overflow:hidden;min-width:0}
.marquee-track{display:flex;gap:12px;width:max-content;animation:defilementOasis 32s linear infinite;
padding:10px 12px}
.formation-marquee:hover .marquee-track{animation-play-state:paused}
.marquee-item{display:flex;align-items:center;gap:9px;min-width:260px;background:var(--fond);
border:1px solid var(--ligne);border-radius:999px;padding:8px 12px;color:var(--encre);text-decoration:none}
.marquee-item:hover{background:var(--bleu-pale);text-decoration:none}
.marquee-item b{font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:176px}
.marquee-item small{color:var(--sourd);font-weight:700;white-space:nowrap}
@keyframes defilementOasis{from{transform:translateX(0)}to{transform:translateX(-50%)}}

/* ---- Héros : signature « barre dégradée + titre dégradé » ---- */
.hero{background:#fff;border:1px solid var(--ligne);border-radius:24px;padding:46px 42px;
display:grid;grid-template-columns:1.2fr .8fr;gap:30px;align-items:center;margin-bottom:28px;
box-shadow:var(--ombre);position:relative;overflow:hidden}
.hero::before{content:'';position:absolute;top:0;left:0;right:0;height:5px;background:var(--degrade-accent)}
.hero h1{font-size:40px;line-height:1.1;letter-spacing:-.03em}
.hero h1 .acc{background:linear-gradient(90deg,#0166C2,#06C994);-webkit-background-clip:text;
background-clip:text;color:transparent}
.hero h1 .acc2{background:linear-gradient(90deg,#06C994,#FC9F1E);-webkit-background-clip:text;
background-clip:text;color:transparent}
.eyebrow{display:inline-block;background:var(--bleu-pale);border:0;border-radius:99px;
padding:6px 15px;font-size:11px;font-weight:800;letter-spacing:.16em;color:var(--marine);
margin-bottom:18px;text-transform:uppercase}
.stats-h{display:flex;gap:32px;margin-top:28px;flex-wrap:wrap}
.stats-h>div{margin-right:30px;min-width:92px}
.stats-h b{font-size:24px;color:var(--marine);font-weight:800;display:block}
.stats-h span{display:block;font-size:13px;color:var(--sourd)}

/* ---- Cartes formation ---- */
.cours{display:flex;flex-direction:column;background:#fff;border:1px solid var(--ligne);
border-radius:var(--r-carte);overflow:hidden;box-shadow:var(--ombre);
transition:box-shadow .18s,transform .18s}
.cours:hover{box-shadow:var(--ombre-f);transform:translateY(-3px)}
.cours .visuel{height:132px;display:flex;align-items:center;justify-content:center;font-size:46px;
position:relative}
.cours .visuel .badge{position:absolute;top:12px;left:12px;background:#fff;color:var(--marine);
box-shadow:0 2px 8px rgba(0,28,74,.16)}
.cours .corps{padding:16px 18px;display:flex;flex-direction:column;gap:6px;flex:1}
.cours .titre{font-weight:750;color:var(--encre);line-height:1.35;letter-spacing:-.01em}
.cours .meta{font-size:12.5px;color:var(--sourd)}
.cours .etiq{display:flex;gap:5px;flex-wrap:wrap;margin-top:2px}
.cours .etiq span{font-size:10.5px;font-weight:700;padding:2px 8px;border-radius:99px;white-space:nowrap}
.cours .e-fmt{background:var(--bleu-pale);color:var(--marine)}
.cours .e-mod.ligne{background:#EDEAFB;color:#3C2F8F}
.cours .e-mod.atelier{background:var(--orange-pale);color:#9A5200}
.cours .prix{margin-top:auto;font-weight:800;font-size:18px;color:var(--marine)}
.cours .prix s{color:var(--sourd);font-weight:500;font-size:13px;margin-left:7px}
.note{color:var(--orange);font-weight:700;font-size:13px}
.fiche-layout{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(280px,.9fr);gap:24px;
align-items:start}
.fiche-layout>div{min-width:0}
.fiche-cover{height:190px;display:flex;align-items:center;justify-content:center;font-size:68px}
.fiche-body{padding:22px}
.fiche-title{margin:8px 0 4px;overflow-wrap:anywhere}
.fiche-meta{font-size:13.5px;color:var(--sourd)}
.fiche-share{margin:10px 0;display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.fiche-share .btn{white-space:nowrap}
.fiche-achat{position:sticky;top:94px}
.fiche-prix{font-size:30px;font-weight:800;line-height:1.2}
.formateur-mini{display:flex;gap:10px;align-items:center;margin-top:8px}
.formateur-mini span{min-width:0}.formateur-mini a,.formateur-mini small{overflow-wrap:anywhere}
.catbox{display:flex;flex-direction:column;align-items:flex-start;gap:7px;background:#fff;
border:1px solid var(--ligne);border-radius:var(--r-champ);padding:16px;box-shadow:var(--ombre);
transition:transform .15s,box-shadow .15s}
.catbox:hover{transform:translateY(-2px);box-shadow:var(--ombre-f);text-decoration:none}
.catbox .em{font-size:26px;width:46px;height:46px;border-radius:14px;background:var(--bleu-pale);
display:inline-flex;align-items:center;justify-content:center}
/* ---- Bandeau format / modalité / lieu de pratique ---- */
.parcours-info{display:grid;grid-template-columns:repeat(auto-fit,minmax(185px,1fr));gap:10px;
margin:14px 0 4px}
.parcours-info>div{display:flex;gap:9px;align-items:flex-start;background:var(--fond);
border:1px solid var(--ligne);border-radius:var(--r-champ);padding:10px 12px}
.parcours-info .pi-em{font-size:18px;line-height:1.2;flex:0 0 auto}
.parcours-info b{display:block;font-size:13px;color:var(--encre);line-height:1.3}
.parcours-info small{display:block;font-size:11.5px;color:var(--sourd);line-height:1.5;margin-top:2px}
/* ---- Socle transversal ---- */
.carte.socle{border-left:4px solid var(--orange)}
.socle-grille{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:9px}
.socle-bloc{display:flex;gap:9px;align-items:flex-start;background:var(--orange-pale);
border-radius:var(--r-champ);padding:9px 11px}
.socle-bloc>span{font-size:16px;line-height:1.3;flex:0 0 auto}
.socle-bloc b{display:block;font-size:12.5px;color:#8A5200;line-height:1.3}
.socle-bloc small{display:block;font-size:11px;color:#9A6420;line-height:1.5;margin-top:2px}
.catbox b{font-size:14px;color:var(--encre)}.catbox span{font-size:12px;color:var(--sourd)}

/* ---- Barre latérale ---- */
.shell{display:grid;grid-template-columns:262px 1fr;gap:24px;align-items:start}
/* Sans min-width:0, une piste 1fr se laisse élargir par son contenu
   (tableau large, URL insécable) et déborde de la colonne. */
.shell>section{min-width:0}
.shell>section .grille{min-width:0}
/* Un tableau trop large défile horizontalement plutôt que de couper les mots. */
.shell>section .carte{overflow-x:auto}
aside.side{background:#fff;border:1px solid var(--ligne);border-radius:var(--r-carte);padding:18px 14px;
position:sticky;top:82px;box-shadow:var(--ombre)}
aside.side.sombre{background:var(--marine-f);border-color:var(--marine-f);color:#C9D6F2}
aside.side .qui{display:flex;gap:11px;align-items:center;padding:2px 4px 16px;
border-bottom:1px solid var(--ligne);margin-bottom:12px}
aside.side.sombre .qui{border-color:rgba(255,255,255,.14)}
aside.side .qui b{font-size:14.5px;display:block;color:var(--encre)}
aside.side.sombre .qui b{color:#fff}
aside.side .qui small{font-size:11px;color:var(--sourd);text-transform:uppercase;letter-spacing:.1em;
font-weight:700}
aside.side.sombre .qui small{color:#8FA6DA}
aside.side nav a{display:flex;gap:11px;align-items:center;padding:11px 13px;border-radius:var(--r-pilule);
color:var(--texte);font-weight:650;font-size:14px;margin:3px 0}
aside.side.sombre nav a{color:#C9D6F2}
aside.side nav a:hover{background:var(--bleu-pale);color:var(--marine);text-decoration:none}
aside.side.sombre nav a:hover{background:rgba(255,255,255,.09);color:#fff}
aside.side nav a.on{background:var(--marine);color:#fff;box-shadow:0 6px 16px rgba(0,28,74,.28)}
aside.side.sombre nav a.on{background:var(--bleu);color:#fff}

/* ---- Statistiques & progression ---- */
.stat-carte{display:flex;flex-direction:column;gap:5px}
.stat-carte .val{font-size:27px;font-weight:800;color:var(--marine);font-variant-numeric:tabular-nums;
letter-spacing:-.02em}
.stat-carte .lib{font-size:12.5px;color:var(--sourd)}
.stat-carte .delta{font-size:12px;color:var(--vert);font-weight:700}
.barre{height:8px;background:#EDF1F7;border-radius:99px;overflow:hidden;min-width:90px}
.barre i{display:block;height:100%;background:var(--degrade-accent);border-radius:99px}
.etapes{display:flex;gap:9px;align-items:center;flex-wrap:wrap;margin:18px 0 22px}
.etapes .et{display:flex;gap:8px;align-items:center;font-size:13.5px;font-weight:650;color:var(--sourd)}
.etapes .et i{width:28px;height:28px;border-radius:99px;background:#EDF1F7;color:var(--sourd);
display:inline-flex;align-items:center;justify-content:center;font-style:normal;font-weight:800;font-size:13px}
.etapes .et.on i{background:var(--degrade);color:#fff;box-shadow:0 4px 12px rgba(1,102,194,.30)}
.etapes .et.on{color:var(--encre)}
.etapes .tiret{flex:0 0 34px;height:2px;background:var(--ligne);border-radius:99px}

/* ---- Plans tarifaires ---- */
.plan{border:1.5px solid var(--ligne);border-radius:var(--r-carte);padding:26px;background:#fff;
position:relative;display:flex;flex-direction:column;box-shadow:var(--ombre)}
.plan.reco{border-color:transparent;box-shadow:var(--ombre-f);overflow:hidden}
.plan.reco::before{content:'';position:absolute;top:0;left:0;right:0;height:5px;background:var(--degrade-accent)}
.plan .ruban{position:absolute;top:-13px;left:50%;transform:translateX(-50%);background:var(--degrade);
color:#fff;font-size:11.5px;font-weight:800;padding:5px 16px;border-radius:99px;letter-spacing:.04em;
box-shadow:0 6px 16px rgba(0,28,74,.26)}
.plan .prixp{font-size:34px;font-weight:800;color:var(--marine);letter-spacing:-.03em}
.plan .prixp small{font-size:14px;color:var(--sourd);font-weight:500}
.plan ul{list-style:none;margin:16px 0;display:flex;flex-direction:column;gap:9px;font-size:14px}
.plan ul li::before{content:'✓  ';color:var(--vert);font-weight:800}

.lecon-row{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:12px 14px;
border:1px solid var(--ligne);border-radius:var(--r-champ);margin:7px 0;background:#fff}
.lecon-row.done{background:#EFFBF6;border-color:#A9E9D1}

@media(max-width:980px){
  .cadre{grid-template-columns:1fr}
  .topbar{display:none}
  .rail{position:fixed;top:0;left:0;bottom:0;width:272px;z-index:50;transform:translateX(-100%);
  transition:transform .22s ease;box-shadow:0 0 40px rgba(0,28,74,.18)}
  .barre-mobile{display:flex}
  .shell{grid-template-columns:1fr}aside.side{position:static}
  .fiche-layout{display:block}
  .fiche-achat{position:static;margin-top:18px}
  .hero{grid-template-columns:1fr;padding:30px 22px}.hero h1{font-size:30px}
  .concept-hero{grid-template-columns:1fr;padding:24px}
  .doc-grid{grid-template-columns:1fr}
  main{padding:20px 16px 60px}
  .banner-actions{grid-template-columns:1fr 1fr}
  .formation-marquee{grid-template-columns:1fr}
  .formation-marquee .marquee-label{justify-content:center}
  .banniere-wrap{max-height:none;aspect-ratio:2.45}
  .banniere{height:100%;max-height:none;object-fit:cover;object-position:center bottom}
  .banniere-spot{display:none}
}
@media(max-width:620px){
  .grille{grid-template-columns:1fr!important}
  .banniere-bloc{padding:14px;border-radius:22px;margin-bottom:18px}
  .banniere-wrap{aspect-ratio:2.22;border-radius:16px}
  .banner-actions{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:14px}
  .banner-actions a{min-height:56px;padding:9px 8px;border-radius:14px;gap:7px;font-size:12.2px;line-height:1.18}
  .banner-actions i{width:28px;height:28px;border-radius:10px;font-size:14px}
  .marquee-item{min-width:230px}
  .page-head{padding:18px}.page-head h1{font-size:24px}
  .concept-hero{padding:20px;border-radius:20px}
  .doc-preview{padding:18px}
  .doc-title{font-size:18px}
  .doc-line{grid-template-columns:1fr;gap:2px}
  .fiche-cover{height:150px;font-size:52px}
  .fiche-body{padding:16px}
  .fiche-title{font-size:25px;line-height:1.16}
  .fiche-meta{font-size:12.5px;line-height:1.55}
  .parcours-info{grid-template-columns:1fr}
  .parcours-info>div{padding:11px}
  .fiche-share .btn{flex:1 1 135px;text-align:center}
  .fiche-achat .btn{padding:12px 14px}
  .fiche-prix{font-size:28px}
  .lecon-row{align-items:flex-start;flex-direction:column}
}
@media(prefers-reduced-motion:reduce){.rail{transition:none}}
@media(prefers-reduced-motion:reduce){*{transition:none!important}}
`;

/* ---------- Aides de rendu ---------- */
function avatarHtml(name, color) {
  const ini = String(name || '?').split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
  return `<span class="avatar" style="background:${color || 'var(--bleu)'}">${esc(ini)}</span>`;
}
function etoiles(n) {
  const v = Math.round(Number(n) || 0);
  return '★'.repeat(v) + '☆'.repeat(5 - v);
}

function layout(title, content, { user = null, active = '' } = {}) {
  const roleDest = { formateur: '/formateur', entreprise: '/entreprise', apprenant: '/apprenant', admin: '/admin/candidatures' };
  const groupes = [
    { titre: 'Plateforme', liens: [
      ['/', '🏠', 'Accueil'],
      ['/formations', '📚', 'Formations'],
      ['/certifications', '🏅', 'Certificats'],
      ['/ressources-numeriques', '🧰', 'Ressources']
    ] },
    { titre: 'Espaces', liens: [
      ['/pour-les-formateurs', '🎓', 'Formateurs'],
      ['/pour-les-entreprises', '🏢', 'Entreprises'],
      ['/tarifs', '💳', 'Tarifs']
    ] },
    { titre: 'Institution & aide', liens: [
      ['/a-propos', 'ℹ️', 'À propos'],
      ['/recrutement', '📬', 'Recrutement'],
      ['/faq', '❔', 'FAQ'],
      ['/contact', '✉️', 'Contact']
    ] }
  ];
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} — Oasis</title><style>${CSS}</style></head><body>
<div class="cadre">
  <input type="checkbox" id="ouvrir-menu" class="bascule-menu" hidden>
  <aside class="rail">
    <a class="logo" href="/" aria-label="Oasis, Centre Numérique de Formation Professionnelle — accueil">
      <img src="/assets/logo-oasis.png" alt="" class="logo-img">
      <span class="logo-txt"><span class="l1">OASIS</span><span class="l2">Centre numérique de formation professionnelle</span></span></a>

    <nav class="rail-nav">${groupes.map(g => `<div class="nav-group">
      <span class="nav-title">${esc(g.titre)}</span>
      ${g.liens.map(([h, ic, l]) =>
        `<a href="${h}" class="${active === h ? 'on' : ''}"><span class="ic">${ic}</span>${l}</a>`).join('')}
    </div>`).join('')}</nav>

    <div class="rail-bas">${user
      ? `<div class="rail-moi">
           ${avatarHtml(user.name, user.role === 'formateur' ? 'var(--violet)' : user.role === 'entreprise' ? 'var(--vert)' : 'var(--bleu)')}
           <span><b>${esc(user.name)}</b><br><small>${esc(user.role === 'apprenant' ? 'Apprenant' : user.role === 'formateur' ? 'Formateur' : user.role === 'entreprise' ? 'Entreprise' : 'Administration')}</small></span></div>
         <a class="btn petit" style="width:100%;text-align:center" href="${roleDest[user.role] || '/'}">Mon espace</a>
         <a class="rail-quitter" href="/logout">Quitter la session</a>`
      : `<a class="btn petit" style="width:100%;text-align:center" href="/register">S'inscrire</a>
         <a class="btn ligne petit" style="width:100%;text-align:center;margin-top:7px" href="/login">Se connecter</a>`}
    </div>
  </aside>

  <div class="colonne">
    <header class="topbar">
      <div class="titre-page">
        <img src="/assets/logo-oasis.png" alt="">
        <span><strong>OASIS Centre numérique</strong><span>Formation professionnelle · Portail en ligne</span></span>
      </div>
      <div class="topbar-actions">${user
        ? `${avatarHtml(user.name, user.role === 'formateur' ? 'var(--violet)' : user.role === 'entreprise' ? 'var(--vert)' : 'var(--bleu)')}
           <a class="btn petit" href="${roleDest[user.role] || '/'}">Mon espace</a>
           <a class="btn ligne petit" href="/logout">Quitter</a>`
        : `<a class="btn ligne petit" href="/login">Se connecter</a>
           <a class="btn petit" href="/register">S'inscrire</a>`}
      </div>
    </header>
    <header class="barre-mobile">
      <label for="ouvrir-menu" class="burger" aria-label="Ouvrir le menu">☰</label>
      <a class="logo-mini" href="/"><img src="/assets/logo-oasis.png" alt=""><b>OASIS</b></a>
      ${user ? `<a class="btn petit" href="${roleDest[user.role] || '/'}">Mon espace</a>`
             : `<a class="btn petit" href="/login">Se connecter</a>`}
    </header>
    <label for="ouvrir-menu" class="voile"></label>
    <main>${content}</main>
    <footer>© 2026 <b>Oasis</b> · Centre Numérique de Formation Professionnelle — Port-au-Prince, Haïti<br>
    Paiement mobile sécurisé (MonCash · NatCash · Kashpaw) · Certificats vérifiés · Support 24/7</footer>
  </div>
</div>
</body></html>`;
}

/* ---------- Carte formation ---------- */
function carteCours(c) {
  const cat = categorie(c.categorie);
  const { note, count } = noteCours(c.id);
  return `<a class="cours" href="/formation/${esc(c.id)}" style="text-decoration:none">
    <div class="visuel" style="background:linear-gradient(135deg,${cat.deg})${c.image ? `;background-image:url('${esc(c.image)}');background-size:cover;background-position:center` : ''}">
      ${c.badge ? `<span class="badge ${c.badge === 'Bestseller' ? 'b-orange' : c.badge === 'Nouveau' ? 'b-vert' : 'b-violet'}">${esc(c.badge)}</span>` : ''}
      ${c.image ? '' : cat.emoji}</div>
    <div class="corps">
      <div class="titre">${esc(c.titre)}</div>
      <div class="meta">${esc(cat.label)} · ${esc(c.niveau)} · ${esc(c.duree)}</div>
      <div class="etiq">
        <span class="e-fmt">${fmtDe(c.format).emoji} ${esc(fmtDe(c.format).label)}</span>
        <span class="e-mod ${(c.modalite || 'en_ligne') === 'en_ligne' ? 'ligne' : 'atelier'}">${modDe(c.modalite).emoji} ${esc(modDe(c.modalite).label)}</span>
      </div>
      ${note ? `<div class="note">${etoiles(note)} ${note} <span style="color:var(--sourd);font-weight:500">(${count})</span></div>` : ''}
      <div class="prix">${c.prix === 0 ? '<span style="color:var(--vert)">Gratuit</span>' : fmtHTG(c.prix)}${c.prixBarre ? `<s>${fmtHTG(c.prixBarre)}</s>` : ''}</div>
    </div></a>`;
}

function formationTicker(courses) {
  const recentes = courses.filter(c => c.statut === 'publiee').slice(0, 8);
  if (!recentes.length) return '';
  const items = recentes.concat(recentes).map(c => {
    const cat = categorie(c.categorie);
    return `<a class="marquee-item" href="/formation/${esc(c.id)}">
      <span>${cat.emoji}</span><b>${esc(c.titre)}</b><small>${c.prix === 0 ? 'Gratuit' : fmtHTG(c.prix)}</small></a>`;
  }).join('');
  return `<section class="formation-marquee" aria-label="Nouvelles formations disponibles">
    <div class="marquee-label">Nouvelles formations</div>
    <div class="marquee-window"><div class="marquee-track">${items}</div></div>
  </section>`;
}

/* ---------- Accueil ---------- */
function landing(courses, stats, user) {
  return layout('Accueil', `
  <div class="banniere-bloc">
    <div class="banniere-wrap">
      <img class="banniere" src="/assets/banniere-oasis.png"
        alt="Oasis, Centre Numérique de Formation Professionnelle — Des compétences aujourd'hui pour un meilleur demain. Formations en ligne, certifications reconnues, ressources numériques, apprentissage flexible, développement professionnel.">
      <a class="banniere-spot spot-formations" href="/formations" aria-label="Formations en ligne"></a>
      <a class="banniere-spot spot-certificats" href="/certifications" aria-label="Certifications reconnues"></a>
      <a class="banniere-spot spot-ressources" href="/ressources-numeriques" aria-label="Ressources numériques"></a>
      <a class="banniere-spot spot-flexible" href="/apprentissage-professionnel" aria-label="Apprentissage professionnel"></a>
      <a class="banniere-spot spot-developpement" href="/developpement-professionnel" aria-label="Développement professionnel"></a>
      <a class="banniere-spot spot-apprendre" href="/apprendre-partout" aria-label="Apprendre partout"></a>
      <a class="banniere-spot spot-evoluer" href="/evoluer-durablement" aria-label="Évoluer durablement"></a>
      <a class="banniere-spot spot-construire" href="/construire-parcours" aria-label="Construire votre parcours"></a>
      <a class="banniere-spot spot-commencer" href="/formations" aria-label="Commencez dès maintenant"></a>
    </div>
    <div class="banner-actions">
      <a href="/ressources-numeriques"><i>📚</i><span>Ressources numériques</span></a>
      <a href="/apprentissage-professionnel"><i>🌐</i><span>Apprentissage professionnel</span></a>
      <a href="/developpement-professionnel"><i>📈</i><span>Développement professionnel</span></a>
      <a href="/apprendre-partout"><i>🎓</i><span>Apprendre partout</span></a>
      <a href="/evoluer-durablement"><i>⚙️</i><span>Évoluer durablement</span></a>
      <a href="/construire-parcours"><i>🤝</i><span>Construire votre parcours</span></a>
    </div>
  </div>

  ${formationTicker(courses)}

  <div class="hero">
    <div>
      <span class="eyebrow">SE FORMER POUR ALLER PLUS LOIN</span>
      <h1>Votre oasis<br><span class="acc">de compétences</span> <span class="acc2">professionnelles</span></h1>
      <p class="sous" style="font-size:16px;margin-top:12px">Formations en ligne, certifications reconnues et
      ressources numériques : montez en compétences à votre rythme, où que vous soyez, et faites-les valoir
      auprès des employeurs.</p>
      <div class="stats-h">
        <div><b>${stats.nbCours}+</b><span>Formations</span></div>
        <div><b>${stats.nbApprenants}+</b><span>Apprenants</span></div>
        <div><b>${stats.nbFormateurs}+</b><span>Formateurs</span></div>
      </div>
    </div>
    <div>
      <div class="panneau"><b>👤 Pour les apprenants</b>
        <p class="aide" style="margin:6px 0 10px">Apprenez à votre rythme parmi des formations créées par des experts.</p>
        <a href="/formations">Explorer les formations →</a></div>
      <div class="panneau"><b>🏢 Pour les entreprises</b>
        <p class="aide" style="margin:6px 0 10px">Formez vos équipes avec des solutions sur mesure et suivez leur progression.</p>
        <a href="/pour-les-entreprises">Découvrir Oasis Entreprise →</a></div>
    </div>
  </div>

  <h2>Catégories populaires <a href="/formations" style="font-size:13.5px;font-weight:600;margin-left:8px">Voir toutes</a></h2>
  <div class="grille g4">${CATEGORIES.slice(0, 8).map(cat => `
    <a class="catbox" href="/formations?categorie=${cat.id}" style="text-decoration:none">
      <span class="em">${cat.emoji}</span><b>${esc(cat.label)}</b>
      <span>${nbParCat(courses, cat.id)} formation(s)</span></a>`).join('')}
  </div>

  <h2>Formations à la une</h2>
  <div class="grille g4">${courses.filter(c => c.statut === 'publiee').slice(0, 4).map(carteCours).join('')}</div>

  <div class="grille g2" style="margin-top:26px">
    <div class="carte" style="background:linear-gradient(135deg,#F5F3FF,#fff)">
      <h2 style="margin-top:0">🎓 Espace Formateur</h2>
      <p>Créez, vendez et gérez vos formations en toute simplicité : publication guidée,
      suivi des revenus en gourdes, retraits MonCash, outils marketing et communauté.</p>
      <p style="margin:12px 0"><a class="btn violet" href="/pour-les-formateurs">Devenir formateur</a></p>
    </div>
    <div class="carte" style="background:linear-gradient(135deg,#ECFDF5,#fff)">
      <h2 style="margin-top:0">🏢 Espace Entreprise</h2>
      <p>Développez les compétences de vos équipes avec Oasis Entreprise : académie dédiée,
      formations assignées, rapports de progression et gestion centralisée des employés.</p>
      <p style="margin:12px 0"><a class="btn vert" href="/pour-les-entreprises">Découvrir Oasis Entreprise</a></p>
    </div>
  </div>

  <div class="carte" style="margin-top:22px;display:flex;gap:26px;flex-wrap:wrap;justify-content:space-between;align-items:center">
    <span style="color:var(--sourd);font-size:13px;font-weight:700">ILS NOUS FONT CONFIANCE</span>
    <b>SOGEBANK</b><b style="color:#E4002B">Digicel</b><b style="color:var(--bleu)">UNIBANK</b>
    <b>BRH</b><b>Ministère de l'Éducation</b><b style="color:#0072BC">USAID</b>
  </div>`, { user, active: '/' });
}
function nbParCat(courses, catId) {
  return courses.filter(c => c.statut === 'publiee' && c.categorie === catId).length;
}

/* ---------- Catalogue ---------- */
function catalogue(courses, { cat, q, fmt, mod }, user) {
  return layout('Les formations', `
  <div class="page-head">
    <span class="eyebrow">CATALOGUE</span>
    <h1>Les formations</h1>
    <p class="sous">${courses.length} formation(s)${cat ? ' — ' + esc(categorie(cat).label) : ''}${fmt ? ' · ' + esc(fmtDe(fmt).label) : ''}${mod ? ' · ' + esc(modDe(mod).label) : ''}</p>
  </div>
  <form method="GET" action="/formations" class="carte" style="display:flex;gap:12px;flex-wrap:wrap;align-items:end;margin-bottom:18px">
    <div style="flex:2;min-width:190px"><label>Rechercher</label>
      <input name="q" value="${esc(q || '')}" placeholder="Un métier, une compétence…"></div>
    <div style="flex:1;min-width:175px"><label>Domaine métier</label>
      <select name="categorie"><option value="">Tous les domaines</option>
      ${CATEGORIES.map(c => `<option value="${c.id}" ${cat === c.id ? 'selected' : ''}>${c.emoji} ${esc(c.label)}</option>`).join('')}</select></div>
    <div style="flex:1;min-width:165px"><label>Durée du parcours</label>
      <select name="format"><option value="">Toutes durées</option>
      ${FORMATS.map(f => `<option value="${f.id}" ${fmt === f.id ? 'selected' : ''}>${esc(f.label)} (${esc(f.duree)})</option>`).join('')}</select></div>
    <div style="flex:1;min-width:150px"><label>Modalité</label>
      <select name="modalite"><option value="">Toutes</option>
      ${MODALITES.map(m => `<option value="${m.id}" ${mod === m.id ? 'selected' : ''}>${m.emoji} ${esc(m.label)}</option>`).join('')}</select></div>
    <button class="btn">Filtrer</button>
  </form>
  <div class="grille g4">${courses.map(carteCours).join('') ||
    '<p style="color:var(--sourd)">Aucune formation ne correspond à votre recherche.</p>'}</div>`,
  { user, active: '/formations' });
}

/* ---------- Fiche formation ---------- */
function ficheCours(c, formateur, avisList, dejaInscrit, user, shareUrl) {
  const cat = categorie(c.categorie);
  const { note, count } = noteCours(c.id);
  const lien = encodeURIComponent(shareUrl || '');
  const texte = encodeURIComponent(`Découvrez la formation « ${c.titre} » sur Oasis`);
  const nbQuiz = (c.modules || []).filter(m => m.quiz && m.quiz.questions && m.quiz.questions.length).length;
  const epreuves = epreuvesDe(c);
  const aExamen = epreuves.length;
  return layout(c.titre, `
  <div class="fiche-layout">
    <div>
      <div class="carte" style="padding:0;overflow:hidden">
        <div class="fiche-cover" style="background:linear-gradient(135deg,${cat.deg})${c.image ? `;background-image:url('${esc(c.image)}');background-size:cover;background-position:center` : ''}">${c.image ? '' : cat.emoji}</div>
        <div class="fiche-body">
          ${c.badge ? `<span class="badge b-orange">${esc(c.badge)}</span>` : ''}
          <h1 class="fiche-title">${esc(c.titre)}</h1>
          <p class="sous" style="margin-bottom:8px">${esc(c.sousTitre || '')}</p>
          <p class="fiche-meta">${esc(cat.label)} · Niveau ${esc(c.niveau)} · ${esc(c.langue)} · ${esc(c.duree)}
          ${note ? ` · <span class="note">${etoiles(note)} ${note} (${count} avis)</span>` : ''} · ${nbInscrits(c.id)} inscrit(s)</p>

          <div class="parcours-info">
            <div><span class="pi-em">${fmtDe(c.format).emoji}</span>
              <b>${esc(fmtDe(c.format).label)}</b><small>${esc(fmtDe(c.format).duree)} · ${esc(fmtDe(c.format).description)}</small></div>
            <div><span class="pi-em">${modDe(c.modalite).emoji}</span>
              <b>${esc(modDe(c.modalite).label)}</b><small>${esc(modDe(c.modalite).description)}</small></div>
            ${c.lieuPratique ? `<div><span class="pi-em">📍</span>
              <b>Lieu de pratique</b><small>${esc(c.lieuPratique)}</small></div>` : ''}
          </div>
          <div class="fiche-share">
            <span style="font-size:13px;color:var(--sourd);font-weight:700">PARTAGER :</span>
            <a class="btn petit" style="background:#25D366" target="_blank" rel="noopener"
              href="https://wa.me/?text=${texte}%20${lien}">WhatsApp</a>
            <a class="btn petit" style="background:#1877F2" target="_blank" rel="noopener"
              href="https://www.facebook.com/sharer/sharer.php?u=${lien}">Facebook</a>
            <a class="btn petit" style="background:#0F172A" target="_blank" rel="noopener"
              href="https://twitter.com/intent/tweet?text=${texte}&url=${lien}">X</a>
            <a class="btn petit" style="background:#0A66C2" target="_blank" rel="noopener"
              href="https://www.linkedin.com/sharing/share-offsite/?url=${lien}">LinkedIn</a>
            <button class="btn ligne petit" onclick="navigator.clipboard.writeText(decodeURIComponent('${lien}')).then(()=>this.textContent='Copié ✓')">🔗 Copier le lien</button>
          </div>
          <h2>Description</h2><p>${esc(c.description)}</p>
          <h2>Programme — ${c.modules.length} module(s), ${nbLecons(c)} leçon(s)${nbQuiz ? `, ${nbQuiz} quiz` : ''}${aExamen ? ', évaluation finale certifiante' : ''}</h2>
          ${c.modules.map((m, i) => `<div class="carte" style="padding:14px;margin-bottom:10px">
            <b>Module ${i + 1} — ${esc(m.titre)}</b>
            ${m.lecons.map(l => `<div class="lecon-row"><span>▸ ${esc(l.titre)}</span>
              <span style="color:var(--sourd);font-size:12.5px">${l.duree} min</span></div>`).join('')}
            ${(m.fichiers || []).length ? `<div class="lecon-row"><span>📎 ${m.fichiers.length} ressource(s) téléchargeable(s)</span></div>` : ''}
            ${m.quiz && m.quiz.questions && m.quiz.questions.length ? `<div class="lecon-row"><span>📝 Quiz du module (${m.quiz.questions.length} question(s))</span></div>` : ''}</div>`).join('')}
          ${(c.socle || []).length ? `<div class="carte socle" style="padding:16px 18px;margin-bottom:12px">
            <b>🧰 Socle « métier + numérique + entrepreneuriat »</b>
            <p class="aide" style="margin:4px 0 10px">Au-delà de la technique, ce parcours vous apprend à
            vivre de votre métier : trouver des clients, chiffrer, gérer et vous faire connaître.</p>
            <div class="socle-grille">${c.socle.map(id => { const b = blocSocle(id); return b
              ? `<div class="socle-bloc"><span>${b.emoji}</span><div><b>${esc(b.label)}</b>
                 <small>${esc(b.resume)}</small></div></div>` : ''; }).join('')}</div>
          </div>` : ''}
          ${aExamen ? `<div class="carte" style="padding:14px;border-color:var(--orange)">
            🎓 <b>Évaluation finale certifiante</b> — ${epreuves.length} épreuve(s) :
            ${epreuves.map(ep => `<span class="badge b-orange">${esc((TYPES_EPREUVES[ep.type] || {}).label || ep.type)} (${ep.poids} %)</span>`).join(' ')}</div>` : ''}
          <h2>Avis des apprenants</h2>
          ${avisList.length ? avisList.map(a => `<div style="border-bottom:1px solid var(--ligne);padding:10px 0">
            <span class="note">${etoiles(a.note)}</span> <b>${esc(a.userName)}</b>
            <p style="font-size:14px">${esc(a.commentaire)}</p></div>`).join('')
          : '<p style="color:var(--sourd)">Aucun avis pour le moment.</p>'}
        </div>
      </div>
    </div>
    <div>
      <div class="carte fiche-achat">
        <div class="fiche-prix" style="color:${c.prix === 0 ? 'var(--vert)' : 'var(--encre)'}">${c.prix === 0 ? 'Gratuit' : fmtHTG(c.prix)}
          ${c.prixBarre ? `<s style="font-size:16px;color:var(--sourd);font-weight:500">${fmtHTG(c.prixBarre)}</s>` : ''}</div>
        <p class="aide" style="margin:6px 0 14px">Accès illimité · Certificat de réussite · Support formateur</p>
        ${dejaInscrit
          ? `<a class="btn vert" style="width:100%;text-align:center" href="/apprenant/cours/${esc(c.id)}">Continuer la formation →</a>`
          : user
            ? (c.prix === 0
              ? `<form method="POST" action="/acheter/${esc(c.id)}"><button class="btn vert" style="width:100%">S'inscrire gratuitement</button></form>`
              : `<a class="btn" style="width:100%;text-align:center" href="/acheter/${esc(c.id)}">Acheter cette formation</a>`)
            : `<a class="btn" style="width:100%;text-align:center" href="/login?suite=${c.prix === 0 ? '/formation/' + esc(c.id) : '/acheter/' + esc(c.id)}">Se connecter pour ${c.prix === 0 ? 's\u2019inscrire (gratuit)' : 'acheter'}</a>`}
        <p class="aide" style="text-align:center;margin-top:10px">🔒 Paiement MonCash · NatCash · Kashpaw</p>
        <hr style="border:none;border-top:1px solid var(--ligne);margin:16px 0">
        <b>Formateur</b>
        <div class="formateur-mini">
          ${formateur.photo ? `<img src="${esc(formateur.photo)}" alt="" style="width:44px;height:44px;border-radius:99px;object-fit:cover">` : avatarHtml(formateur.name, 'var(--violet)')}
          <span><b><a href="/formateurs/${esc(formateur.id || '')}">${esc(formateur.name)}</a></b>${formateur.verified ? ' <span class="badge b-violet">Vérifié ✓</span>' : ''}
          <br><small style="color:var(--sourd)">${esc(formateur.titrePro || formateur.bio || '')}</small>
          <br><a href="/formateurs/${esc(formateur.id || '')}" style="font-size:12.5px">Voir le profil complet →</a></span></div>
      </div>
    </div>
  </div>`, { user, active: '/formations' });
}

/* ---------- Checkout d'achat (passerelle PLOP PLOP) ---------- */
function checkoutCours(c, user, error) {
  const cat = categorie(c.categorie);
  return layout('Paiement', `
  <div style="max-width:460px;margin:20px auto">
    <div class="carte" style="padding:28px">
      <div style="text-align:center">
        <div style="font-size:38px">${cat.emoji}</div>
        <b>${esc(c.titre)}</b>
        <div style="font-size:36px;font-weight:800;color:var(--encre);margin:8px 0">${fmtHTG(c.prix)}</div>
        <p class="aide">🔒 Paiement mobile sécurisé</p>
      </div>
      ${error ? `<div class="alerte ko" style="margin-top:14px">${esc(error)}</div>
      <div class="actions-h" style="margin-bottom:6px">
        <a class="btn ligne" href="/">← Retour à l'accueil</a>
        <a class="btn ligne" href="/formation/${esc(c.id)}">Revoir la formation</a>
      </div>` : ''}
      <form method="POST" action="/acheter/${esc(c.id)}">
        <label>Méthode de paiement</label>
        ${PP.METHODES.map((mt, i) => `<label style="display:flex;gap:10px;align-items:center;font-weight:600;margin:6px 0;padding:11px 13px;border:1.5px solid var(--ligne);border-radius:10px;cursor:pointer">
          <input type="radio" name="methode" value="${mt.id}" ${i === 0 ? 'checked' : ''} style="width:auto">
          <span>${mt.emoji} ${esc(mt.label)}${mt.id === 'all' ? ' <small class="aide">— vous choisirez sur la page de paiement</small>' : ''}</span>
        </label>`).join('')}
        <div class="panneau" style="margin-top:12px;font-size:13.5px">
          Vous serez conduit vers la page de paiement sécurisée, où vous confirmerez
          avec le numéro de votre portefeuille mobile. Votre inscription est activée
          dès que le paiement est confirmé.
        </div>
        <div style="margin-top:16px"><button class="btn" style="width:100%">🔒 Payer ${fmtHTG(c.prix)}</button></div>
      </form>
      <p class="aide" style="text-align:center;margin-top:10px">Montant minimum accepté : ${PP.PLOP.montantMinHTG} HTG.</p>
    </div>
  </div>`, { user });
}

/* ---------- Page d'attente : l'apprenant paie sur la passerelle ---------- */
function paiementAttente(c, order, urlPaiement, user) {
  return layout('Paiement en cours', `
  <div style="max-width:500px;margin:20px auto">
    <div class="carte" style="padding:28px;text-align:center">
      <div style="font-size:40px">⏳</div>
      <h1 style="font-size:22px;margin:8px 0">Finalisez votre paiement</h1>
      <p class="sous">${esc(c.titre)} — <b>${fmtHTG(order.amount)}</b></p>
      <p class="aide">Référence : <code>${esc(order.id)}</code></p>
      <a class="btn" id="lien-paiement" href="${esc(urlPaiement)}" target="_blank" rel="noopener"
        style="width:100%;margin-top:8px">💳 Ouvrir la page de paiement</a>
      <div class="panneau" style="margin-top:14px;text-align:left;font-size:13.5px">
        <b>Comment procéder</b>
        <ol style="margin:6px 0 0 18px;padding:0">
          <li>La page de paiement s'ouvre dans un nouvel onglet.</li>
          <li>Confirmez avec votre portefeuille mobile.</li>
          <li>Revenez ici : votre accès s'ouvre automatiquement.</li>
        </ol>
      </div>
      <p id="etat" class="aide" style="margin-top:14px">Vérification auprès de la passerelle…</p>
      <div class="actions-h" style="justify-content:center;margin-top:10px">
        <a class="btn ligne petit" href="/">← Retour à l'accueil</a>
        <a class="btn ligne petit" href="/formation/${esc(c.id)}">Annuler le paiement</a>
      </div>
    </div>
  </div>
  <script>
    (function () {
      var ref = ${JSON.stringify(order.id)};
      var essais = 0;
      try { window.open(${JSON.stringify(urlPaiement)}, '_blank', 'noopener'); } catch (e) {}
      var etat = document.getElementById('etat');
      var minuteur = setInterval(function () {
        essais++;
        fetch('/paiement/verifier?ref=' + encodeURIComponent(ref))
          .then(function (r) { return r.json(); })
          .then(function (res) {
            if (res.paye) {
              clearInterval(minuteur);
              etat.textContent = 'Paiement confirmé ✓ Ouverture de votre formation…';
              location.href = res.suite;
            } else {
              etat.textContent = 'Vérification auprès de la passerelle… (' + essais + ')';
            }
          })
          .catch(function () { etat.textContent = 'Passerelle momentanément injoignable, nouvelle tentative…'; });
        if (essais >= 90) {   // ~7 minutes
          clearInterval(minuteur);
          etat.textContent = "Paiement non confirmé. Si vous avez payé, rechargez cette page ; sinon, réessayez depuis la formation.";
        }
      }, 5000);
    })();
  </script>`, { user });
}


/* ---------- Tarifs ---------- */
function tarifs(user, planActuel) {
  return layout('Tarifs', `
  <div class="page-head">
    <span class="eyebrow">ABONNEMENTS</span>
    <h1>Tarifs</h1>
    <p class="sous">Choisissez le plan formateur qui correspond le mieux à vos besoins.
    <span class="badge b-bleu">Garantie satisfait ou remboursé — 30 jours</span></p>
  </div>
  <div class="grille g4" style="align-items:stretch">
    ${PLANS.map(p => `<div class="plan ${p.reco ? 'reco' : ''}">
      ${p.reco ? '<span class="ruban">★ Recommandé</span>' : ''}
      <b style="font-size:18px">${esc(p.label)}</b>
      <div class="prixp">${p.prixMois === 0 ? '0 HTG' : fmtHTG(p.prixMois)}<small> /mois</small></div>
      ${p.prixMois > 0 ? `<p class="aide">${fmtHTG(Math.round(p.prixMois * 12 * 0.8))}/an — économisez 20 %</p>` : '<p class="aide">Toujours gratuit</p>'}
      <ul>${p.inclus.map(i => `<li>${esc(i)}</li>`).join('')}</ul>
      <form method="POST" action="/choisir-plan" style="margin-top:auto">
        <input type="hidden" name="plan" value="${p.id}">
        <button class="btn ${p.reco ? 'violet' : 'ligne'}" style="width:100%">
          ${planActuel === p.id ? 'Plan actuel ✓' : 'Choisir ' + esc(p.label)}</button>
      </form></div>`).join('')}
  </div>
  <div class="carte" style="margin-top:22px">
    <h2 style="margin-top:0">Comparez les fonctionnalités</h2>
    <table><tr><th></th>${PLANS.map(p => `<th>${esc(p.label)}</th>`).join('')}</tr>
      <tr><td>Formations illimitées</td><td>✗ (1 formation)</td><td>✓</td><td>✓</td><td>✓</td></tr>
      <tr><td>Apprenants</td><td>Jusqu'à 10</td><td>Jusqu'à 200</td><td>Illimités</td><td>Illimités</td></tr>
      <tr><td>Certificats personnalisés</td><td>✗</td><td>✓</td><td>✓</td><td>✓</td></tr>
      <tr><td>Outils marketing avancés</td><td>✗</td><td>✗</td><td>✓</td><td>✓</td></tr>
      <tr><td>Rapports & analyses avancés</td><td>✗</td><td>✗</td><td>✓</td><td>✓</td></tr>
      <tr><td>Support</td><td>Email</td><td>Email prioritaire</td><td>Chat prioritaire</td><td>Gestionnaire dédié</td></tr>
    </table>
  </div>
  <div class="carte" style="margin-top:18px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:14px">
    <span>🚀 <b>Des besoins spécifiques ?</b> Nous proposons des solutions sur mesure pour les grandes organisations.</span>
    <a class="btn violet" href="/contact">Demander une offre personnalisée →</a>
  </div>`, { user, active: '/tarifs' });
}

/* ---------- Pages Pour les formateurs / entreprises ---------- */
function pourFormateurs(user) {
  return layout('Pour les formateurs', `
  <div class="hero" style="background:linear-gradient(135deg,#F5F3FF,#FDF7EC)">
    <div>
      <span class="eyebrow" style="color:var(--violet)">ESPACE FORMATEUR</span>
      <h1>Partagez votre savoir.<br><span style="color:var(--violet)">Inspirez le monde.</span></h1>
      <p class="sous" style="font-size:16px;margin-top:12px">Créez, publiez et vendez vos formations en ligne
      sur Oasis et développez votre impact — revenus en gourdes, retraits MonCash.</p>
      <a class="btn violet" href="${user ? '/formateur/creer' : '/register?role=formateur'}">Créer une formation +</a>
      ${user ? '<a class="btn ligne" href="/formateur" style="margin-left:8px">Voir mes formations →</a>' : ''}
    </div>
    <div class="panneau">
      <b>Pourquoi devenir formateur ?</b>
      <ul style="list-style:none;margin-top:10px;display:flex;flex-direction:column;gap:8px;font-size:14px">
        <li>👥 Touchez des milliers d'apprenants</li>
        <li>🗂️ Gérez vos formations en toute simplicité</li>
        <li>💰 Générez des revenus récurrents (85 % pour vous)</li>
        <li>🛠️ Bénéficiez d'outils puissants</li>
        <li>🤝 Rejoignez une communauté de passionnés</li>
      </ul>
    </div>
  </div>
  <div class="grille g3">
    <div class="carte"><b>1. Créez</b><p class="aide" style="margin-top:6px">Assistant de publication en 3 étapes :
      informations, contenu (modules et leçons), publication.</p></div>
    <div class="carte"><b>2. Vendez</b><p class="aide" style="margin-top:6px">Prix en gourdes, paiement MonCash/NatCash
      par virement mobile, commission plateforme de 15 % seulement.</p></div>
    <div class="carte"><b>3. Suivez</b><p class="aide" style="margin-top:6px">Tableau de bord : revenus, inscriptions,
      avis, retraits vers votre portefeuille mobile.</p></div>
  </div>`, { user, active: '/pour-les-formateurs' });
}

function pourEntreprises(user) {
  return layout('Pour les entreprises', `
  <div class="hero" style="background:linear-gradient(135deg,#ECFDF5,#EFF6FF)">
    <div>
      <span class="eyebrow" style="color:var(--vert)">ESPACE ENTREPRISE</span>
      <h1>Développez les compétences<br>de votre équipe</h1>
      <p class="sous" style="font-size:16px;margin-top:12px">Créez, gérez et suivez les formations de vos
      collaborateurs au sein de votre académie d'entreprise.</p>
      <a class="btn vert" href="${user && user.role === 'entreprise' ? '/entreprise' : '/register?role=entreprise'}">
        ${user && user.role === 'entreprise' ? 'Accéder à mon académie' : 'Créer mon académie'}</a>
      <a class="btn ligne" href="/contact" style="margin-left:8px">Parler à un conseiller</a>
    </div>
    <div>
      <div class="panneau"><b>✅ Formations sur mesure</b><p class="aide">Assignez des formations obligatoires ou optionnelles.</p></div>
      <div class="panneau"><b>📊 Suivi de la progression</b><p class="aide">Rapports détaillés par collaborateur et par formation.</p></div>
      <div class="panneau"><b>👥 Gestion centralisée</b><p class="aide">Invitez vos employés en quelques clics.</p></div>
    </div>
  </div>`, { user, active: '/pour-les-entreprises' });
}

/* ---------- Pages de concepts publics ---------- */
function certificationsPage(user) {
  return layout('Certifications reconnues', `
  <div class="page-head">
    <span class="eyebrow">DOCUMENTS OFFICIELS</span>
    <h1>Certificat et relevé de notes Oasis</h1>
    <p class="sous" style="max-width:720px">Chaque parcours réussi peut générer deux documents officiels :
    un certificat de réussite et un relevé de notes vérifiable par QR code.</p>
  </div>
  <div class="doc-grid">
    <div class="doc-preview">
      <div class="doc-watermark">OASIS</div>
      <div class="doc-head">
        <img src="/assets/logo-oasis.png" alt="">
        <div><b>OASIS</b><br><small class="aide">Centre numérique de formation professionnelle</small></div>
      </div>
      <div class="doc-title">Certificat de réussite</div>
      <p class="sous">Ce modèle atteste officiellement qu'un apprenant a complété un parcours de formation.</p>
      <div class="doc-line"><span>Titulaire</span><b>Nom de l'apprenant</b></div>
      <div class="doc-line"><span>Formation</span><b>Mécanique moto et automobile</b></div>
      <div class="doc-line"><span>Mention</span><b>Très bien</b></div>
      <div class="doc-line"><span>Référence</span><code>ENR-OASIS-2026</code></div>
      <div style="display:flex;justify-content:space-between;gap:16px;align-items:end;margin-top:18px">
        <div><small class="aide">Signature, sceau, date de délivrance et code de vérification.</small></div>
        <div class="qr-demo" aria-label="Exemple de QR code"></div>
      </div>
    </div>
    <div class="doc-preview">
      <div class="doc-watermark">NOTES</div>
      <div class="doc-head">
        <img src="/assets/sceau-oasis.png" alt="">
        <div><b>Registre académique</b><br><small class="aide">Relevé officiel des modules et évaluations</small></div>
      </div>
      <div class="doc-title">Relevé de notes</div>
      <p class="sous">Le relevé détaille les modules suivis, les évaluations et les compétences validées.</p>
      <table>
        <tr><th>Élément</th><th>Note</th><th>Statut</th></tr>
        <tr><td>Module 1 · Fondamentaux</td><td>86 %</td><td>Acquis</td></tr>
        <tr><td>Module 2 · Pratique guidée</td><td>91 %</td><td>Acquis</td></tr>
        <tr><td>Examen final</td><td>88 %</td><td>Réussi</td></tr>
      </table>
      <p class="aide" style="margin-top:14px">Chaque relevé est relié au même registre de vérification que le certificat.</p>
    </div>
  </div>
  <div class="grille g3" style="margin-top:18px">
    <div class="concept-card"><b>QR code vérifiable</b><p class="aide">Le scan ouvre une page publique indiquant si le document est authentique.</p></div>
    <div class="concept-card"><b>Signature et sceau</b><p class="aide">Les documents utilisent l'identité officielle du centre et les paramètres administratifs.</p></div>
    <div class="concept-card"><b>Traçabilité</b><p class="aide">La référence relie le document à l'inscription, aux notes et à la progression réelle.</p></div>
  </div>`, { user, active: '/certifications' });
}

function ressourcesNumeriques(user) {
  return layout('Ressources numériques', `
  <div class="concept-hero">
    <div>
      <span class="eyebrow">PLATEFORME EN CONSTRUCTION</span>
      <h1>Oasis Centre numérique d'apprentissage</h1>
      <p class="sous" style="font-size:16px;margin-top:12px">Cette nouvelle plateforme regroupera les ressources
      numériques utiles aux apprenants, formateurs et institutions : documents, guides, médias éducatifs,
      exercices, fiches métiers et outils pratiques.</p>
      <a class="btn" href="/formations">Voir les formations actuelles</a>
      <a class="btn ligne" href="/contact" style="margin-left:8px">Être informé du lancement</a>
    </div>
    <div class="concept-card">
      <b>Ce qui sera disponible</b>
      <ul style="margin-top:10px;padding-left:18px">
        <li>Bibliothèque de documents professionnels</li>
        <li>Vidéothèque et audiothèque pédagogiques</li>
        <li>Fiches pratiques par métier</li>
        <li>Banque d'exercices et mini-évaluations</li>
        <li>Ressources adaptées aux usages mobiles</li>
      </ul>
    </div>
  </div>`, { user, active: '/ressources-numeriques' });
}

const CONCEPTS = {
  apprentissageProfessionnel: {
    titre: 'Apprentissage professionnel',
    accroche: 'Apprendre un métier avec des contenus structurés, des tâches pratiques et des preuves de compétence.',
    emoji: '🧭',
    cta: '/formations',
    items: [
      ['Compétences métier', 'Chaque parcours vise des savoir-faire concrets reliés à un emploi ou une activité professionnelle.'],
      ['Preuves de progression', 'Les leçons, quiz, travaux et évaluations permettent de suivre ce qui est réellement acquis.'],
      ['Accompagnement', 'Le formateur peut guider, corriger et orienter l’apprenant vers la pratique.']
    ]
  },
  developpementProfessionnel: {
    titre: 'Développement professionnel',
    accroche: 'Actualiser ses compétences pour rester utile, performant et prêt pour de nouvelles responsabilités.',
    emoji: '📈',
    cta: '/formations',
    items: [
      ['Montée en compétence', 'Les formations courtes aident à améliorer un poste, une activité ou un projet.'],
      ['Culture de formation continue', 'L’apprenant peut revenir régulièrement pour compléter son profil professionnel.'],
      ['Valeur pour les entreprises', 'Les organisations peuvent former leurs équipes et suivre leur progression.']
    ]
  },
  apprendrePartout: {
    titre: 'Apprendre partout',
    accroche: 'Rendre la formation accessible depuis un téléphone, à la maison, au travail ou en déplacement.',
    emoji: '🎓',
    cta: '/formations',
    items: [
      ['Mobile d’abord', 'Les parcours sont pensés pour être consultés facilement sur téléphone.'],
      ['Rythme flexible', 'L’apprenant avance selon ses disponibilités et peut reprendre son parcours.'],
      ['Accessibilité', 'L’objectif est de réduire les barrières de distance, de temps et de lieu.']
    ]
  },
  evoluerDurablement: {
    titre: 'Évoluer durablement',
    accroche: 'Construire des compétences solides, utiles aujourd’hui et adaptables aux changements de demain.',
    emoji: '⚙️',
    cta: '/formations',
    items: [
      ['Progression continue', 'Les parcours encouragent une évolution par étapes, pas seulement une formation isolée.'],
      ['Employabilité', 'Les compétences validées renforcent le profil de l’apprenant sur le marché du travail.'],
      ['Autonomie', 'L’apprenant développe des méthodes pour continuer à apprendre après la formation.']
    ]
  },
  construireParcours: {
    titre: 'Construire votre parcours',
    accroche: 'Choisir une trajectoire claire : découvrir, apprendre, pratiquer, certifier et valoriser ses compétences.',
    emoji: '🤝',
    cta: '/register',
    items: [
      ['Orientation', 'Identifier le domaine, le niveau et le type de formation qui correspondent au projet.'],
      ['Plan personnel', 'Assembler plusieurs formations pour construire un vrai parcours métier.'],
      ['Valorisation', 'Utiliser les certificats, relevés et compétences acquises pour avancer professionnellement.']
    ]
  }
};

function conceptPage(user, key) {
  const c = CONCEPTS[key] || CONCEPTS.apprentissageProfessionnel;
  return layout(c.titre, `
  <div class="concept-hero">
    <div>
      <h1>${esc(c.titre)}</h1>
      <p class="sous" style="font-size:16px;margin-top:12px">${esc(c.accroche)}</p>
      <a class="btn" href="${esc(c.cta)}">${key === 'construireParcours' ? 'Créer mon compte' : 'Explorer les formations'}</a>
      <a class="btn ligne" href="/contact" style="margin-left:8px">Demander conseil</a>
    </div>
    <div class="concept-card" style="text-align:center">
      <div style="font-size:68px;line-height:1">${c.emoji}</div>
      <h2 style="margin-top:10px">${esc(c.titre)}</h2>
      <p class="aide">Une approche pensée pour relier apprentissage, compétence et projet professionnel.</p>
    </div>
  </div>
  <div class="grille g3" style="margin-top:18px">
    ${c.items.map(([t, p]) => `<div class="concept-card"><b>${esc(t)}</b><p class="aide">${esc(p)}</p></div>`).join('')}
  </div>
  <div class="carte" style="margin-top:18px">
    <h2 style="margin-top:0">Comment Oasis l'applique</h2>
    <p>Le concept se traduit par des formations modulaires, des évaluations progressives, un suivi de la
    progression et des documents de certification vérifiables. L’objectif est de rendre chaque parcours
    compréhensible, mesurable et utile pour la vie professionnelle.</p>
  </div>`, { user });
}

function faqPage(user) {
  const questions = [
    ['Comment s’inscrire sur Oasis ?', 'Cliquez sur S’inscrire, choisissez votre profil puis complétez le formulaire. Après connexion, vous pourrez accéder à votre espace personnel.'],
    ['Comment acheter une formation ?', 'Ouvrez la fiche d’une formation, cliquez sur le bouton d’achat ou d’inscription, puis choisissez le moyen de paiement disponible.'],
    ['Les certificats sont-ils vérifiables ?', 'Oui. Les certificats et relevés de notes contiennent une référence et un QR code qui renvoient vers le registre public de vérification.'],
    ['À quoi sert le relevé de notes ?', 'Il présente les modules suivis, les évaluations, la note globale, la mention et les compétences acquises pendant le parcours.'],
    ['Puis-je apprendre depuis mon téléphone ?', 'Oui. L’interface est pensée pour les usages mobiles afin de permettre l’apprentissage à distance et selon le rythme de chacun.'],
    ['Une entreprise peut-elle former ses employés ?', 'Oui. L’espace entreprise permet de suivre les collaborateurs, les formations assignées et la progression.']
  ];
  return layout('FAQ', `
  <div class="page-head">
    <span class="eyebrow">AIDE RAPIDE</span>
    <h1>Questions fréquentes</h1>
    <p class="sous">Les réponses essentielles pour comprendre le fonctionnement d'Oasis.</p>
  </div>
  <div class="faq-list">
    ${questions.map(([q, r], i) => `<details class="faq-item" ${i === 0 ? 'open' : ''}>
      <summary>${esc(q)}</summary><p>${esc(r)}</p>
    </details>`).join('')}
  </div>
  <div class="carte" style="margin-top:18px;display:flex;justify-content:space-between;gap:14px;align-items:center;flex-wrap:wrap">
    <span>Vous avez une autre question ?</span>
    <a class="btn" href="/contact">Contacter Oasis</a>
  </div>`, { user, active: '/faq' });
}

/* ---------- À propos ---------- */
function aPropos(user, stats) {
  return layout('À propos', `
  <div class="page-head">
    <span class="eyebrow">NOTRE MISSION</span>
    <h1>À propos d'Oasis</h1>
    <p class="sous" style="max-width:640px">Oasis est une plateforme de formation en ligne qui connecte
    formateurs, apprenants et entreprises pour développer les compétences de demain.</p>
  </div>
  <div class="grille g4">
    <div class="carte stat-carte"><span class="val">${stats.nbApprenants}+</span><span class="lib">Apprenants nous font confiance</span></div>
    <div class="carte stat-carte"><span class="val">${stats.nbFormateurs}+</span><span class="lib">Formateurs experts partagent leur savoir</span></div>
    <div class="carte stat-carte"><span class="val">${stats.nbEntreprises}+</span><span class="lib">Entreprises nous accompagnent</span></div>
    <div class="carte stat-carte"><span class="val">${stats.nbCours}+</span><span class="lib">Formations en ligne disponibles</span></div>
  </div>
  <div class="grille g2" style="margin-top:18px">
    <div class="carte">
      <h2 style="margin-top:0">🎯 Notre mission</h2>
      <p>Rendre la formation accessible à tous et partout, en offrant des expériences d'apprentissage
      innovantes, flexibles et de qualité — pensées pour les réalités haïtiennes.</p>
      <h2>👁️ Notre vision</h2>
      <p>Devenir la référence francophone et créolophone de la formation en ligne et un levier essentiel
      de développement des compétences pour les individus et les organisations.</p>
    </div>
    <div class="carte">
      <h2 style="margin-top:0">Nos valeurs</h2>
      <div class="grille g2">
        <div><b>⭐ Excellence</b><p class="aide">Nous visons la qualité dans tout ce que nous faisons.</p></div>
        <div><b>🌍 Accessibilité</b><p class="aide">La formation doit être ouverte à tous, même en basse connectivité.</p></div>
        <div><b>💡 Innovation</b><p class="aide">Nous innovons constamment pour offrir les meilleures expériences.</p></div>
        <div><b>🤝 Engagement</b><p class="aide">Nous nous engageons pour la réussite de nos apprenants et partenaires.</p></div>
      </div>
    </div>
  </div>
  <div class="carte" style="margin-top:18px;display:grid;grid-template-columns:1.4fr .8fr;gap:20px;align-items:center">
    <div><h2 style="margin-top:0">⛰️ Notre histoire</h2>
    <p>Oasis est née d'un constat simple : en Haïti, la compétence existe, mais les moyens de la
    transmettre manquent. Les déplacements sont difficiles, les salles de formation coûteuses et les
    plateformes étrangères inaccessibles — tarifs en devises, paiement par carte bancaire, contenus
    éloignés de nos réalités.</p>
    <p>Nous avons donc bâti un lieu où un formateur haïtien publie son savoir et en vit, où un apprenant
    se forme depuis son téléphone et paie en gourdes, et où une entreprise développe les compétences de
    ses équipes sans logistique. Une oasis : un point d'eau accessible à tous, au milieu de ce qui manque.</p></div>
    <blockquote class="panneau" style="font-style:italic">« La connaissance est le seul bien qui se multiplie
    quand on le partage. »<br><small style="color:var(--sourd)">— Notre conviction depuis le premier jour.</small></blockquote>
  </div>`, { user, active: '/a-propos' });
}

/* ---------- Contact ---------- */
function contactPage(user, sent) {
  return layout('Contact', `
  <div class="page-head">
    <span class="eyebrow">ASSISTANCE</span>
    <h1>Contactez-nous</h1>
    <p class="sous">Notre équipe est à votre écoute pour répondre à toutes vos questions et vous accompagner
    dans votre expérience sur Oasis.</p>
  </div>
  <div class="grille" style="grid-template-columns:.8fr 1.4fr;align-items:start">
    <div class="carte">
      <h2 style="margin-top:0">Nos coordonnées</h2>
      <p>📧 <b>Email</b><br>support@oasis.ht<br><small class="aide">Nous répondons sous 24 h</small></p>
      <p style="margin-top:12px">📞 <b>Téléphone / WhatsApp</b><br>+509 xx xx xxxx<br><small class="aide">Lun – Ven : 9h00 – 17h00</small></p>
      <p style="margin-top:12px">💬 <b>Chat en direct</b><br>Disponible sur la plateforme</p>
      <p style="margin-top:12px">📍 <b>Adresse</b><br>Oasis Centre Numérique de Formation Professionnelle, Port-au-Prince, Haïti</p>
    </div>
    <div class="carte">
      <h2 style="margin-top:0">Envoyez-nous un message</h2>
      ${sent ? '<div class="alerte ok">Merci ! Votre message a bien été envoyé — nous répondons sous 24 h.</div>' : ''}
      <form method="POST" action="/contact">
        <div class="grille g2">
          <div><label>Nom complet *</label><input name="nom" required value="${esc(user ? user.name : '')}"></div>
          <div><label>Email *</label><input name="email" type="email" required value="${esc(user ? user.email : '')}"></div>
        </div>
        <label>Sujet *</label>
        <select name="sujet" required><option value="">Sélectionnez un sujet</option>
          <option>Question sur une formation</option><option>Devenir formateur</option>
          <option>Offre entreprise</option><option>Paiement / facturation</option>
          <option>Signaler un problème</option><option>Partenariats</option></select>
        <label>Message *</label>
        <textarea name="message" rows="5" required maxlength="1000" placeholder="Décrivez votre demande en détail…"></textarea>
        <div style="margin-top:16px"><button class="btn">📨 Envoyer le message</button></div>
      </form>
    </div>
  </div>
  <div class="carte" style="margin-top:18px">
    <h2 style="margin-top:0">Questions fréquentes</h2>
    <p><b>Comment créer une formation ?</b> — Inscrivez-vous comme formateur puis suivez l'assistant « Créer une formation » en 3 étapes.</p>
    <p><b>Comment être payé en tant que formateur ?</b> — Vos ventes créditent votre solde (85 % du prix) ; demandez un retrait MonCash depuis « Mes revenus ».</p>
    <p><b>Quels sont les frais de la plateforme ?</b> — 15 % de commission par vente, plus votre plan d'abonnement éventuel.</p>
  </div>`, { user, active: '/contact' });
}

/* ---------- Authentification ---------- */
function authForm(kind, { error, role, suite } = {}) {
  const isReg = kind === 'register';
  return layout(isReg ? 'Inscription' : 'Connexion', `
  <div style="max-width:440px;margin:24px auto">
    <h1 style="text-align:center">${isReg ? 'Créer un compte' : 'Se connecter'}</h1>
    <p class="sous" style="text-align:center">${isReg ? 'Rejoignez Oasis gratuitement.' : 'Heureux de vous revoir !'}</p>
    ${error ? `<div class="alerte ko">${esc(error)}</div>` : ''}
    <div class="carte">
      <form method="POST" action="/${kind}${suite ? '?suite=' + encodeURIComponent(suite) : ''}">
        ${isReg ? `
        <label>Je m'inscris en tant que</label>
        <select name="role" onchange="if(this.value==='formateur'){location.href='/devenir-formateur'}">
          <option value="apprenant" ${role === 'apprenant' ? 'selected' : ''}>Apprenant (étudiant, enseignant, professionnel)</option>
          <option value="entreprise" ${role === 'entreprise' ? 'selected' : ''}>Entreprise — je veux former mes équipes</option>
          <option value="formateur">Formateur — je dépose une candidature</option>
        </select>
        <label>Nom complet (ou nom de l'entreprise) *</label>
        <input name="name" required maxlength="100">
        <label>Téléphone (WhatsApp)</label>
        <input name="telephone" inputmode="numeric" placeholder="509 XXXX XXXX">
        <div class="grille g2">
          <div><label>Département</label>
          <select name="departement"><option value="">—</option>
            ${['Ouest', 'Artibonite', 'Nord', 'Nord-Est', 'Nord-Ouest', 'Centre', 'Sud', 'Sud-Est', 'Grand\u2019Anse', 'Nippes', 'Diaspora'].map(d => `<option>${d}</option>`).join('')}
          </select></div>
          <div><label>Votre profil</label>
          <select name="profil"><option value="">—</option>
            <option>Étudiant(e)</option><option>Enseignant(e)</option><option>Professionnel(le)</option>
            <option>Entrepreneur(e)</option><option>Sans emploi</option><option>Autre</option>
          </select></div>
        </div>
        <div class="grille g2">
          <div><label>Niveau d'études</label>
          <select name="niveauEtudes"><option value="">—</option>
            <option>Secondaire</option><option>Bac / Philo</option><option>Licence</option>
            <option>Master ou plus</option><option>Formation professionnelle</option>
          </select></div>
          <div><label>Comment nous avez-vous connus ?</label>
          <select name="source"><option value="">—</option>
            <option>Facebook / Instagram</option><option>WhatsApp</option><option>Bouche à oreille</option>
            <option>Mon entreprise</option><option>Mon école</option><option>Autre</option>
          </select></div>
        </div>
        <div id="champsEntreprise" style="display:${role === 'entreprise' ? 'block' : 'none'}">
          <div class="grille g2">
            <div><label>Secteur d'activité</label>
            <select name="secteur"><option value="">—</option>
              <option>Télécommunications</option><option>Banque & finance</option><option>Éducation</option>
              <option>Santé</option><option>Commerce</option><option>ONG</option><option>Autre</option>
            </select></div>
            <div><label>Taille de l'entreprise</label>
            <select name="taille"><option value="">—</option>
              <option>1-10</option><option>11-50</option><option>51-200</option><option>200+</option>
            </select></div>
          </div>
        </div>
        <script>document.querySelector('[name=role]').addEventListener('change', function(){
          document.getElementById('champsEntreprise').style.display = this.value === 'entreprise' ? 'block' : 'none';});</script>` : ''}
        <label>Adresse email</label><input name="email" type="email" required>
        <label>Mot de passe</label><input name="password" type="password" required minlength="8">
        ${isReg ? '<p class="aide">8 caractères minimum.</p>' : ''}
        <div style="margin-top:18px"><button class="btn" style="width:100%">${isReg ? "S'inscrire" : 'Se connecter'}</button></div>
      </form>
    </div>
    <p style="text-align:center">${isReg
      ? 'Déjà inscrit ? <a href="/login">Se connecter</a>'
      : `Pas de compte ? <a href="/register">S'inscrire</a> · Démo : jean@oasis.ht / marie@oasis.ht / academie@digicel.ht`}</p>
  </div>`, { });
}

/* ---------- Profil public d'un formateur ---------- */
function profilFormateurPublic(f, cours, stats, derniersAvis, user) {
  return layout(f.name, `
  <div class="grille" style="grid-template-columns:.85fr 1.5fr;align-items:start">
    <div class="carte" style="text-align:center">
      ${f.photo
        ? `<img src="${esc(f.photo)}" alt="${esc(f.name)}" style="width:130px;height:130px;border-radius:99px;object-fit:cover;margin:6px auto">`
        : `<div style="display:flex;justify-content:center;margin:6px 0">${avatarHtml(f.name, 'var(--violet)')}</div>`}
      <h1 style="font-size:23px">${esc(f.name)} ${f.verified ? '<span class="badge b-violet">Vérifié ✓</span>' : ''}</h1>
      <p style="color:var(--violet);font-weight:600">${esc(f.titrePro || 'Formateur')}</p>
      ${(f.expertises || []).length ? `<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin:10px 0">
        ${f.expertises.map(e => `<span class="badge b-bleu">${esc(e)}</span>`).join('')}</div>` : ''}
      <div class="grille g3" style="margin:14px 0;gap:8px">
        <div><b style="font-size:20px">${stats.nbCours}</b><br><small class="aide">Formations</small></div>
        <div><b style="font-size:20px">${stats.nbEtudiants}</b><br><small class="aide">Étudiants</small></div>
        <div><b style="font-size:20px">${stats.note ? '★ ' + stats.note : '—'}</b><br><small class="aide">${stats.nbAvis} avis</small></div>
      </div>
      ${f.siteWeb ? `<p><a href="${esc(f.siteWeb)}" target="_blank" rel="noopener">🌐 Site web</a></p>` : ''}
      ${f.whatsapp ? `<p><a href="https://wa.me/${esc(f.whatsapp)}" target="_blank" rel="noopener">💬 WhatsApp</a></p>` : ''}
    </div>
    <div>
      <div class="carte"><h2 style="margin-top:0">À propos</h2>
        <p>${esc(f.bio || 'Ce formateur n\u2019a pas encore rédigé sa présentation.')}</p></div>
      <h2>Formations de ${esc(f.name.split(' ')[0])} (${cours.length})</h2>
      <div class="grille" style="grid-template-columns:repeat(auto-fit,minmax(210px,1fr))">${cours.map(carteCours).join('') ||
        '<p class="aide">Aucune formation publiée pour le moment.</p>'}</div>
      ${derniersAvis.length ? `<h2>Derniers avis</h2>
      ${derniersAvis.map(a => `<div class="carte" style="margin-bottom:10px">
        <span class="note">${etoiles(a.note)}</span> <b>${esc(a.userName)}</b>
        <span class="aide"> · ${esc(a.coursTitre)}</span>
        <p style="margin-top:4px">${esc(a.commentaire)}</p></div>`).join('')}` : ''}
    </div>
  </div>`, { user });
}


/* ---------- Candidature formateur ---------- */
function candidatureForm(user, error) {
  return layout('Devenir formateur', `
  <div style="max-width:620px;margin:20px auto">
    <h1 style="text-align:center">Devenir formateur sur Oasis</h1>
    <p class="sous" style="text-align:center">Déposez votre candidature — notre équipe la vérifie sous 72 h
    ouvrées avant l'ouverture de votre espace formateur.</p>
    ${error ? `<div class="alerte ko">${esc(error)}</div>` : ''}
    <div class="carte"><form method="POST" action="/devenir-formateur">
      <div class="grille g2">
        <div><label>Nom complet *</label><input name="name" required maxlength="100"></div>
        <div><label>Email *</label><input name="email" type="email" required></div>
      </div>
      <label>Mot de passe * (8 caractères minimum)</label>
      <input name="password" type="password" required minlength="8">
      <label>Titre professionnel *</label>
      <input name="titrePro" required maxlength="100" placeholder="Ex : Comptable agréé CPA, Ingénieur logiciel…">
      <label>Domaines d'expertise (séparés par des virgules)</label>
      <input name="expertises" placeholder="Ex : Comptabilité, Excel, QuickBooks">
      <label>Expérience professionnelle et pédagogique *</label>
      <textarea name="experience" rows="4" required maxlength="1500"
        placeholder="Votre parcours, vos années d'expérience, vos expériences d'enseignement…"></textarea>
      <label>Pourquoi souhaitez-vous enseigner sur Oasis ? *</label>
      <textarea name="motivation" rows="3" required maxlength="1500"></textarea>
      <label>Lien portfolio / LinkedIn / CV en ligne</label>
      <input name="portfolio" placeholder="https://…">
      <button class="btn violet" style="width:100%;margin-top:16px">Soumettre ma candidature</button>
    </form></div>
  </div>`, { user });
}

function candidatureStatut(u) {
  const c = u.candidature;
  const badge = c.statut === 'approuvee' ? '<span class="badge b-vert">Approuvée ✓</span>'
    : c.statut === 'rejetee' ? '<span class="badge b-rouge">Non retenue</span>'
    : '<span class="badge b-orange">En cours d\u2019examen</span>';
  return layout('Ma candidature', `
  <div style="max-width:560px;margin:30px auto;text-align:center">
    <div class="carte" style="padding:34px">
      <p style="font-size:44px">${c.statut === 'approuvee' ? '🎉' : c.statut === 'rejetee' ? '📩' : '⏳'}</p>
      <h1>Candidature formateur</h1>
      <p style="margin:10px 0">Statut : ${badge}</p>
      ${c.statut === 'en_attente' ? `<p class="sous">Merci ${esc(u.name.split(' ')[0])} !
        Votre dossier soumis le ${c.soumiseLe.slice(0, 10)} est en cours de vérification par notre équipe
        (délai habituel : 72 h ouvrées). Vous recevrez l'accès à votre espace formateur dès validation.</p>` : ''}
      ${c.statut === 'approuvee' ? `<p class="sous">Bienvenue dans la communauté des formateurs !</p>
        <a class="btn violet" href="/formateur">Accéder à mon espace formateur →</a>` : ''}
      ${c.statut === 'rejetee' ? `<p class="sous">Votre candidature n'a pas été retenue cette fois-ci.
        ${c.commentaire ? '<br><b>Commentaire :</b> ' + esc(c.commentaire) : ''}
        <br>Vous pouvez nous écrire via la page <a href="/contact">Contact</a> pour en discuter.</p>` : ''}
    </div>
  </div>`, { user: u });
}


/* ---------- Vérification publique d'un document (cible des QR codes) ---------- */
function verification(d) {
  if (!d) {
    return layout('Document introuvable', `
    <div style="max-width:560px;margin:40px auto;text-align:center">
      <div class="carte" style="padding:36px;border-top:5px solid var(--rouge)">
        <p style="font-size:46px;margin-bottom:6px">⚠️</p>
        <h1 style="font-size:24px">Document introuvable</h1>
        <p class="sous" style="margin-top:10px">Aucun document Oasis ne correspond à cette référence.
        Vérifiez le numéro inscrit sur le document, ou contactez le centre si vous suspectez
        un document falsifié.</p>
        <a class="btn" href="/">Accueil</a>
        <a class="btn ligne" href="/contact" style="margin-left:8px">Signaler</a>
      </div>
    </div>`, { nav: 'none' });
  }
  const certifie = !!d.acheveLe;
  return layout('Vérification du document', `
  <div style="max-width:620px;margin:26px auto">
    <div class="carte" style="padding:0;overflow:hidden">
      <div style="height:6px;background:var(--degrade-accent)"></div>
      <div style="padding:30px 34px 34px">

        <div style="text-align:center">
          <img src="/assets/sceau-oasis.png" alt="" style="width:92px;height:92px;object-fit:contain">
          <p style="margin-top:10px">
            <span class="badge ${certifie ? 'b-vert' : 'b-orange'}" style="font-size:14px;padding:6px 18px">
              ${certifie ? '✓ Document authentique' : '◷ Parcours en cours'}</span></p>
          <p class="aide" style="margin-top:8px">Vérifié auprès du registre d'Oasis,
            Centre numérique de formation professionnelle</p>
        </div>

        <table style="margin-top:22px">
          <tr><td style="color:var(--sourd);width:42%">Titulaire</td><td><b>${esc(d.titulaire)}</b></td></tr>
          <tr><td style="color:var(--sourd)">Formation</td><td><b>${esc(d.formation)}</b></td></tr>
          <tr><td style="color:var(--sourd)">Code formation</td><td>${esc(d.code)}</td></tr>
          <tr><td style="color:var(--sourd)">Formateur</td><td>${esc(d.formateur)}</td></tr>
          <tr><td style="color:var(--sourd)">Niveau · durée</td><td>${esc(d.niveau)} · ${esc(d.duree)}</td></tr>
          <tr><td style="color:var(--sourd)">Inscription</td><td>${esc(d.inscritLe)}</td></tr>
          ${certifie
            ? `<tr><td style="color:var(--sourd)">Formation achevée le</td><td><b>${esc(d.acheveLe)}</b></td></tr>`
            : `<tr><td style="color:var(--sourd)">Progression</td><td>${esc(d.progression)} leçons</td></tr>`}
          ${d.note !== null ? `<tr><td style="color:var(--sourd)">Note globale</td>
            <td><b style="color:${d.note >= d.seuil ? 'var(--vert)' : 'var(--rouge)'}">${d.note} %</b>
            <span class="aide">(seuil ${d.seuil} %)</span></td></tr>
          <tr><td style="color:var(--sourd)">Mention</td><td><b>${esc(d.mention)}</b></td></tr>` : ''}
          <tr><td style="color:var(--sourd)">Compétences acquises</td><td>${esc(d.competences)}</td></tr>
          <tr><td style="color:var(--sourd)">Référence</td>
            <td><code style="font-size:12.5px">${esc(d.id).toUpperCase()}</code></td></tr>
        </table>

        <div class="panneau" style="margin-top:20px;font-size:13px">
          Cette page est générée par la plateforme Oasis au moment de la consultation : elle reflète
          l'état réel du registre. ${certifie
            ? 'Le certificat et le relevé de notes portant cette référence sont authentiques.'
            : 'Ce parcours n\'est pas encore achevé : aucun certificat n\'a été délivré à ce jour.'}
        </div>

        <p style="text-align:center;margin-top:18px" class="aide">
          Un doute sur un document ? <a href="/contact">Écrivez-nous</a>.</p>
      </div>
    </div>
  </div>`, { nav: 'none' });
}

module.exports = {
  CSS, layout, avatarHtml, etoiles, carteCours,
  landing, catalogue, ficheCours, checkoutCours, paiementAttente, tarifs,
  pourFormateurs, pourEntreprises, certificationsPage, ressourcesNumeriques, conceptPage,
  faqPage, aPropos, contactPage, authForm,
  profilFormateurPublic, candidatureForm, candidatureStatut, verification
};
