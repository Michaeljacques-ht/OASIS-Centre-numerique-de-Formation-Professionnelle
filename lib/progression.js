'use strict';
const {epreuvesDe}=require('./db');
function seuil(c){const n=Number(c.evaluation?.seuil);return Number.isFinite(n)?Math.min(100,Math.max(0,n)):60;}
function etats(c,enr){const done=new Set(enr.progress||[]);let ouvert=true;return(c.modules||[]).map(m=>{const leconsOk=(m.lecons||[]).every(l=>done.has(l.id)),aQuiz=!!(m.quiz?.html||m.quiz?.questions?.length),r=enr.evaluations?.[m.id],quizOk=!aQuiz||!!r&&r.pct>=seuil(c);const e={m,ouvert,leconsOk,aQuiz,quizOk,valide:leconsOk&&quizOk};ouvert=ouvert&&e.valide;return e;});}
function finaleOuverte(c,enr){return etats(c,enr).every(e=>e.valide);}
function suite(c,enr){const base='/apprenant/cours/'+c.id;for(const e of etats(c,enr)){if(!e.valide){const l=e.m.lecons.find(l=>!(enr.progress||[]).includes(l.id));return l?base+'?lecon='+l.id:base+(e.m.quiz?.html?'/html/':'/quiz/')+e.m.id;}}return epreuvesDe(c).length?base+'/examen':base;}
module.exports={seuil,etats,finaleOuverte,suite};
