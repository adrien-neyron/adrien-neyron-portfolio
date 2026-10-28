/* L'ascension : accueil en boucle infinie (portage du prototype).
 * Usage : const loop = initLoop(THREE, { GLTFLoader }); … loop.destroy() au démontage de la page.
 * GLTFLoader (facultatif) : charge le modèle 3D de la chaussure (SHOE_GLB) ; sans lui, la chaussure procédurale reste affichée.
 * Prérequis : le balisage de loop.html est déjà dans le DOM, loop.css est chargée, three@0.128.0. */
import {projects as SITE_PROJECTS} from '~/data/projects';
import {createWheelGate,wheelGate,STEP_MS,LOCK_MS} from '~/utils/wheelStep';
import {loopStages} from '~/utils/loopMarkup';
import {stageImageFallback as IMG_FB} from '~/data/stageImages';
import {TRAIL_TOTAL,summaryHtml} from '~/utils/stages';   // étapes de la trace (admin, sinon data/stages.ts)   // « un cran = un projet » sur la carte des expériences (filtre pur, testé)   // repli des chiffres clés et des photos des fiches projets (mêmes données que /projects)
export function initLoop(THREE,LOADERS={}){
  const __ac=new AbortController(),__sig=__ac.signal,__ivs=[];let DEAD=false;
  // les écouteurs de la fenêtre sont annulés à la destruction
  const addEventListener=(t,f,o)=>window.addEventListener(t,f,(o&&typeof o==='object')?{...o,signal:__sig}:{capture:!!o,signal:__sig});
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
const lerp=(a,b,t)=>a+(b-a)*t;
const ease=t=>t*t*(3-2*t);
const sm=(a,b,x)=>ease(clamp((x-a)/(b-a)));
const trap=(p,a,b,c,d)=>p<=a||p>=d?0:p<b?(p-a)/(b-a):p<=c?1:(d-p)/(d-c);
/* Le défilement brut est étiré : la scène des projets (progression 0,30 à 0,555, pluie sur le dernier cairn comprise) occupe la moitié de la page */
const WK_R=[0,.17,.68,1],WK_V=[0,.30,.555,1];
function warp(r){for(let i=0;i<3;i++)if(r<=WK_R[i+1])return lerp(WK_V[i],WK_V[i+1],(r-WK_R[i])/(WK_R[i+1]-WK_R[i]));return 1}
function unwarp(v){for(let i=0;i<3;i++)if(v<=WK_V[i+1])return lerp(WK_R[i],WK_R[i+1],(v-WK_V[i])/(WK_V[i+1]-WK_V[i]));return 1}
const TAU=Math.PI*2;
const root=document.documentElement;
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
/* Qualité adaptative : trois niveaux (0 complet, 1 allégé, 2 économe), choisis selon l'appareil puis ajustés à la fluidité mesurée */
const QC={tier:0,base:0};
(()=>{
  const cores=navigator.hardwareConcurrency||8,mem=navigator.deviceMemory||8,touch=('ontouchstart' in window)||navigator.maxTouchPoints>0;
  let t=0;if((touch&&innerWidth<900)||cores<=4||mem<=4)t=1;if(mem<=2||cores<=2)t=2;
  try{const e=localStorage.getItem('asc-eco');if(e==='1')t=Math.max(t,1);if(e==='0')t=0}catch(er){}
  QC.tier=QC.base=t;
})();
const QDPR=()=>[1.5,1,.75][QC.tier];

/* ---------- État ---------- */
let charte='expe';try{charte=localStorage.getItem('asc-charte')||'expe'}catch(e){}
let theme='light';
try{theme=localStorage.getItem('asc-theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')}catch(e){theme=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}
/* Vue statique d'office : mouvement réduit, connexion lente / économie de données / appareil léger (décidé par la page, LOADERS.lite), ou choix mémorisé du visiteur */
let prefStatic=false;try{prefStatic=localStorage.getItem('asc-static')==='1'}catch(e){}
let staticMode=reduce||!!(LOADERS&&LOADERS.lite)||prefStatic, paused=false, loaded=false;
let tNow=0, pS=0, last=performance.now(), loadT0=performance.now();
let seen=false;try{seen=localStorage.getItem('asc-seen')==='1'}catch(e){}
const LOAD_MS=reduce||seen?450:2600;
let mx=0,my=0;

/* ---------- Palettes par moment de la journée ---------- */
const hex=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
const mk=(p,bg,fg,mu,ln,ac,at,cd)=>({p,bg:hex(bg),fg:hex(fg),mu:hex(mu),ln:hex(ln),ac:hex(ac),at:hex(at),cd:cd?hex(cd):null});
const DAWN=['#EDF0EE','#1B2A24','#56615B','#AAB5B1','#E0561B','#A63C15'];
const DAY=['#F3EFE6','#1B2A24','#56615B','#B9AF98','#E0561B','#A63C15'];
const GOLD=['#F6E9D5','#1B2A24','#56615B','#C9A57E','#E0561B','#A63C15'];
const NIGHT=['#050811','#E6F4F1','#A8B9C0','#2C4048','#E26D3B','#E26D3B'];
const dDAWN=['#050811','#E6F4F1','#A8B9C0','#26344A','#E26D3B','#E26D3B'];
const dDAY=['#141F1B','#E6F4F1','#A8B9C0','#34443E','#E26D3B','#E26D3B'];
const dGOLD=['#1D1611','#E6F4F1','#B5AA98','#5A4630','#E26D3B','#E26D3B'];
const K=(p,a)=>mk(p,...a);
const LIGHT=[K(0,DAWN),K(.2,DAY),K(.55,DAY),K(.63,GOLD),K(.78,GOLD),K(.86,NIGHT),K(.95,NIGHT),K(1,DAWN)];
const DARK=[K(0,dDAWN),K(.2,dDAY),K(.55,dDAY),K(.63,dGOLD),K(.78,dGOLD),K(.86,NIGHT),K(.95,NIGHT),K(1,dDAWN)];
const E_DAWN=['#050811','#E6F4F1','#A8B9C0','#26344A','#E26D3B','#E26D3B','#121B2B'];
const E_DAY=['#F4F8FA','#12222B','#435862','#BCD0DA','#DF6C4F','#B23F27','#E3ECF1'];
const E_GOLD=['#E8805F','#14201B','#1F2D27','#F3B7A2','#E6F4F1','#14201B','#F7CDBB'];
const E_CAMP=['#070910','#E6F4F1','#A8B9C0','#2B3040','#E26D3B','#E26D3B','#121B2B'];
const E_NIGHT=['#070A0E','#E6F4F1','#9DB0C8','#222E42','#E26D3B','#E26D3B','#121B2B'];
const D_DAWN=['#02040A','#E6F4F1','#A8B9C0','#1E2B40','#E26D3B','#E26D3B','#0E1624'];
const D_DAY=['#0A0E14','#EDF3F6','#A9BCD2','#26344A','#E26D3B','#E26D3B','#11171F'];
const D_GOLD=['#4A2216','#FFEDE5','#F0C7B6','#7A4331','#FFB08E','#FFB08E','#5C2C1E'];
const E_DAYC=['#F1E9DC','#1F1A14','#4D4438','#D3C6B1','#E26D3B','#A8401B','#E8DFCF'];   // bivouac de jour : sable clair, feu éteint
const E_FOREST=['#060B14','#E6F4F1','#A8B9C0','#23324A','#E26D3B','#E26D3B','#121B2B'];
const LIGHT_E=[K(0,E_DAY),K(.79,E_DAY),K(.85,E_DAYC),K(.95,E_DAYC),K(1,E_DAY)];   // mode jour : clair de bout en bout ; la carte, la flaque et le bivouac ont leur variante claire (bivouac de jour, feu éteint)
const DARK_E=[K(0,D_DAWN),K(.50,D_DAWN),K(.56,E_FOREST),K(.78,E_FOREST),K(.86,E_CAMP),K(.95,E_CAMP),K(1,D_DAWN)];
function palette(p){
  const KS=charte==='expe'?(theme==='dark'?DARK_E:LIGHT_E):(theme==='dark'?DARK:LIGHT); let i=0;
  while(i<KS.length-2&&p>KS[i+1].p)i++;
  const a=KS[i],b=KS[i+1],t=clamp((p-a.p)/(b.p-a.p));
  const m=k=>a[k].map((v,j)=>Math.round(lerp(v,b[k][j],t)));
  const bg=m('bg'),fg=m('fg');
  const card=(a.cd&&b.cd)?m('cd'):bg.map((v,j)=>Math.round(lerp(v,fg[j],theme==='dark'?.07:.045)));
  const c=x=>`rgb(${x.join(',')})`;
  return {'--bg':c(bg),'--fg':c(fg),'--muted':c(m('mu')),'--line':c(m('ln')),'--acc':c(m('ac')),'--acc-text':c(m('at')),'--card':c(card)};
}
const setVars=(el,o)=>{for(const k in o)el.style.setProperty(k,o[k])};
let pal=palette(0);

/* ---------- Références ---------- */
const S=[$('#s1'),$('#s2'),$('#s3'),$('#s4')];
const head1=$('#head1'),head2=$('#head2'),loader=$('#loader'),pctEl=$('#pct'),loadBar=$('#loadBar');
const hint=$('#hint'),live=$('#live');
const isMobile=()=>innerWidth<900;

/* ---------- Instruments (outils construits) ---------- */
const ICONS={
  chrono:'<circle cx="12" cy="14" r="7"/><path d="M12 14V10M9.5 3h5M12 3v4"/>',
  shoe:'<path d="M3 17v-5l5-1 3-4 3 3 5 1.5c1.2.4 2 1.4 2 2.7V17Z"/><path d="M3 20h18"/>',
  flow:'<circle cx="5" cy="6" r="2.4"/><circle cx="19" cy="12" r="2.4"/><circle cx="5" cy="18" r="2.4"/><path d="M7 7l10 4M7 17l10-4"/>',
  pulse:'<path d="M3 12h4l2-6 4 12 2-6h6"/>',
  gpx:'<path d="M5 20c0-5 6-4 6-9s5-3 5-8"/><circle cx="17" cy="4" r="2"/><circle cx="5" cy="20" r="1.5"/>',
  spark:'<path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/>'
};
/* Liens : le site en ligne est la référence (relatif quand on est dessus, absolu ailleurs, par exemple dans le prototype) */
const SITE=(typeof location!=='undefined'&&/(^|\.)vercel\.app$|^localhost$|^127\.0\.0\.1$/.test(location.hostname))?'':'https://adrien-neyron-portfolio.vercel.app';
$$('a[data-site]').forEach(a=>{a.href=SITE+a.dataset.site});   // lien d'administration : l'espace /admin du site
const PROJECT_LINKS={
  runfit:[{l:'Ouvrir RunFit Advisor',u:'https://runfit-advisor.vercel.app/'}],
  coach:[{l:'Ouvrir CoachFlow',u:'https://with-coachflow.vercel.app/'},{l:'Code sur GitHub',u:'https://github.com/adrien-neyron/CoachFlow'}],
  asc:[{l:'Voir le site en ligne',u:'https://adrien-neyron-portfolio.vercel.app/'},{l:'Code sur GitHub',u:'https://github.com/adrien-neyron/adrien-neyron-portfolio'}]
};
const TOOLS=[
  {n:'Calculateur d\'allure',d:'Nouveau · trail avec D+ / D−',i:'chrono',a:30},
  {n:'RunFit Advisor',d:'Chaussures de trail · swipe',i:'shoe',a:85},
  {n:'Équipement IA',d:'6 outils IA que j\'intègre',i:'spark',a:140},
  {n:'Job Search Automator',d:'IA · pipeline de candidature',i:'flow',a:220},
  {n:'CoachFlow',d:'Coaching et formation',i:'pulse',a:275},
  {n:'Analyseur GPX',d:'À venir',i:'gpx',a:330}
];
const TOOL_INFO=[
  {e:`Atelier · Outil`,st:`Démonstration`,l:`Une allure à plat ne dit presque rien d'une course en montagne. Ce calculateur compte le dénivelé positif (D+) et négatif (D−) pour estimer un temps de passage plus réaliste.`,pts:[`Prend en compte le D+ et le D−, pas seulement la distance.`,`Version de démonstration : la formule définitive reste à brancher.`],k:[`Vue 3`]},
  {e:`Atelier · Projet personnel`,st:`En ligne`,l:`Une application de recommandation de chaussures de trail, construite autour d'une mécanique de swipe.`,pts:[`Swipe pour comparer les paires et se décider.`,`Modèle économique : affiliation.`,`En ligne et utilisable dès maintenant.`],k:[`Nuxt 3`,`Supabase`],url:`https://runfit-advisor.vercel.app`,ul:`Ouvrir RunFit Advisor`},
  {e:`Atelier · Méthode`,st:`Au quotidien`,l:`Les outils d'IA que j'intègre à mon travail de développeur, chaque jour.`,pts:[`Assistants de code : Claude Code et GitHub Copilot.`,`Automatisation et intégrations : Make.com et l'API Claude.`],k:[`Claude Code`,`GitHub Copilot`,`Make.com`,`API Claude`]},
  {e:`Atelier · Automatisation`,st:`Projet personnel`,l:`Un pipeline de candidature assisté par l'IA, pour automatiser les étapes répétitives d'une recherche d'emploi.`,pts:[`Des automatisations construites avec Make.com, l'API Claude, Airtable et Playwright.`,`Né de ma propre recherche : optimisation du CV et prise de contact sur LinkedIn.`],k:[`Make.com`,`API Claude`,`Airtable`,`Playwright`]},
  {e:`Atelier · Projet personnel`,st:`Projet personnel`,l:`Un outil pour le coaching et la formation, né de mes dix ans de management et de formation avant le code.`,pts:[`Pensé comme une plateforme de formation (LMS) pour accompagner une progression.`],k:[`LMS`,`Formation`]}
];
TOOL_INFO[0].links=[{l:'Ouvrir le calculateur',u:SITE+'/outils/allure-denivele'}];
TOOL_INFO[1].links=PROJECT_LINKS.runfit;
TOOL_INFO[2].links=[{l:'Voir tous les outils IA',u:SITE+'/ai-tools'}];
TOOL_INFO[3].note=`Pas de lien public renseigné pour l'instant.`;
TOOL_INFO[1].t=`RunFit Advisor`;TOOL_INFO[3].t=`Job Search Automator`;TOOL_INFO[4].t=`CoachFlow`;
TOOL_INFO[4].links=PROJECT_LINKS.coach;
const PROJECT_INFO={   // fiches de la carte des projets ; liens repris du site en ligne et de ses données
  stock:{t:`Stockpulse`,e:`Étape 01 · Haute-Savoie · Développeur auto-entrepreneur`,st:`2021–2023`,l:`Une application de gestion du matériel de secours pour les casernes de pompiers : une interface responsive pensée pour le mobile, la tablette et le bureau.`,pts:[`Interface responsive multi-supports (mobile, tablette, desktop).`,`Charte graphique et design système avec Tailwind CSS.`],k:[`PHP`,`Twig`,`Tailwind CSS`],note:`Projet pour une PME locale : pas de lien public.`},
  hello:{t:`HelloStay`,e:`Étape 02 · Haute-Savoie · Développeur auto-entrepreneur`,st:`2021–2023`,l:`Un CRM de gestion locative qui automatise les entrées et les sorties des locataires et synchronise les calendriers.`,pts:[`Intégration de l'API Igloohome pour automatiser les entrées et les sorties.`,`Synchronisation des calendriers.`],k:[`Vue.js`,`Tailwind CSS`,`API Igloohome`],note:`Projet pour une PME locale : pas de lien public.`},
  dgfip:{t:`DGFiP`,e:`Étape 03 · Paris · Développeur Front-End`,st:`2023–2025`,l:`Refonte d'une application métier qui automatise les configurations systèmes et réseaux des projets entrants, au sein d'une équipe agile.`,pts:[`Formulaire multi-étapes à état centralisé, versionné via GitLab (historique, diffs), avec configuration YAML pour automatiser le déploiement serveur.`,`Tests automatisés (unitaires et E2E), CI/CD GitLab multi-environnements.`,`Analyse des besoins et rédaction de spécifications techniques.`,`Temps de traitement des configurations réduit de 50 %.`],k:[`TypeScript`,`Vue.js 3`,`Bootstrap`,`Python`,`FastAPI`,`PostgreSQL`,`GitLab`],note:`Outil interne d'une administration : pas de lien public.`},
  c2s:{t:`Click2SellSite`,e:`Étape 04 · Lyon · Tyredating`,st:`2026 – en cours`,l:`Plateforme de création de sites avec CRM intégré pour garagistes (YepGarage), déployée à l'international pour des filiales de Michelin.`,pts:[`Audit RGAA/WCAG (automatique et manuel) sur 50 pages, score Lighthouse de 90 à 100 %.`,`Anomalies corrigées au niveau des composants transverses réutilisables, propagées sur des centaines de sites clients.`,`Migration de Vue 2 vers Vue 3 et refonte des composants.`,`Convention data-id pour fiabiliser et automatiser les tests QA.`,`Support client et résolution d'incidents sur les CRM métier.`],k:[`Vue.js`,`TypeScript`,`Bootstrap`,`Jenkins`,`MongoDB`,`AWS`,`Java`,`Datadog`],links:[{l:'Voir YepGarage',u:'http://yepgarage.com'}]},
  runfit:TOOL_INFO[1],
  coach:TOOL_INFO[4],
  jsa:TOOL_INFO[3],   // mêmes fiches que l'atelier jusqu'au contenu de l'admin, puis copiées avant le CV (voir CV_FACTS)
  cpaie:{t:`C+Paie`,e:`Étape · Haute-Savoie · Développeur web freelance`,st:`2024`,l:`Une application pour une PME locale, de la conception UI/UX sur Figma au développement.`,pts:[],k:[`React`,`Next.js`,`Node.js`,`Express`,`MongoDB`,`Figma`]},
  dress:{t:`DressMeUp`,e:`Étape · Projet personnel`,st:`2023`,l:`Une application mobile pour composer ses tenues, aussi en ligne dans le navigateur.`,pts:[],k:[`React Native`,`Expo`,`Node.js`,`Express`,`MongoDB`,`Vercel`]},
  next:{t:`À déterminer`,e:`Prochaine étape · la suite`,st:`À écrire`,l:`Le tracé s'arrête ici, pour l'instant : la suite du parcours reste à écrire ensemble. Un nouveau projet, une mission, une collaboration.`,pts:[`Un projet à construire avec une équipe qui tient à l'accessibilité et à la qualité.`,`Vue 3 et TypeScript côté interface, des classes Java robustes côté données, le tout administrable en temps réel.`],k:[`Votre projet ?`],links:[{l:'Parlons de la suite',go:'contact'}]},
  asc:{t:`L'ascension`,e:`Sommet · Ce site`,st:`En ligne`,l:`Le site que vous parcourez : une boucle en 3D, de la boussole au bivouac, pensée pour rester lisible et accessible à tous.`,pts:[`Contenu 100 % HTML pour les lecteurs d'écran, la 3D est un habillage.`,`Pause, vue statique, parcours guidé et navigation au clavier.`],k:[`Nuxt`,`Three.js`,`RGAA`],links:PROJECT_LINKS.asc}
};
/* ---------- CV (CV-AdrienNeyron-DeveloppeurFrontEnd.pdf, profil de l'admin, octobre 2026) : faits des fiches de l'atelier ----------
   Les puces du CV passent en tête des points clés, sans doublon ; la description de l'admin reste le résumé ; les chiffres du CV ne servent que si l'admin n'en a pas.
   La trace, elle, ne lit plus ce tableau : elle suit les étapes de l'admin (STAGES, utils/stages.ts). */
const CV_FACTS={
  depart:{start:'2009-09',when:'Sept. 2009 – Mai 2021',role:'Formateur et manager · UCPA / Decathlon',
    pts:[`Formateur BPJEPS pendant dix ans (UCPA Formation) : conception de modules, suivi d'apprenants, 500+ personnes formées.`,`Management d'équipes jusqu'à 25 personnes : recrutement, budget, pilotage opérationnel.`]},
  stock:{start:'2021-06',when:'2021 – 2023',role:'Développeur web freelance',pts:[`Interface responsive et design system (PHP / Twig, Tailwind CSS) pour la gestion du matériel des pompiers.`]},
  dress:{start:'2023-07',when:'2023',role:'Projet personnel'},   // date : création du dépôt public (juillet 2023) ; absent du CV
  hello:{start:'2023-12-01',when:'Déc. 2023 – Janv. 2024',role:'Développeur web freelance',
    pts:[`Outil de gestion locative (Vue.js, Python) : intégration de l'API Igloohome pour automatiser les entrées et les sorties.`]},
  dgfip:{start:'2023-12-15',when:'Déc. 2023 – Oct. 2025',role:'Développeur Front-End · Mission DGFiP (via BeTeam)',place:'Paris',
    pts:[`Outil mis en production et rendu obligatoire : temps de traitement des configurations réduit de 50 % pour les architectes.`,`Formulaire multi-étapes à état centralisé (Vuex) : préremplissage, règles métier, dépôt de fichiers, versionnement.`,`Génération automatique des fiches de configuration en YAML pour automatiser le déploiement serveur.`,`Authentification, gestion des utilisateurs et persistance des données ; API s'appuyant sur GitLab pour sécuriser les requêtes.`,`Interface construite avec le Système de design de l'État (DSFR).`,`Tests unitaires (Vitest) et E2E (Selenium), CI/CD GitLab multi-environnements.`,`Analyse des besoins et rédaction des spécifications techniques.`]},
  cpaie:{start:'2024-02',when:'2024',role:'Développeur web freelance',pts:[`Conception UI/UX sur Figma et développement de l'application (React / Next.js, Node.js / Express, MongoDB).`]},   // février 2024 : premier commit du dépôt
  runfit:{start:'2025-10-01',when:'Oct. 2025 – Mai 2026',role:'Projet personnel',pts:[`Conception et mise en ligne d'une application de recommandation de chaussures de trail (Nuxt 3, Supabase).`]},
  coach:{start:'2025-10-15',when:'Oct. 2025 – Mai 2026',role:'Projet personnel',pts:[`Plateforme de formation en ligne, conçue et mise en ligne en parallèle d'un emploi saisonnier aux remontées mécaniques.`]},
  asc:{start:'2026-04',when:'2026',role:'Projet personnel · ce site'},   // avril 2026 : création du dépôt
  c2s:{start:'2026-05',when:'Mai 2026 – en cours',role:'Développeur Front-End · Mission Tyredating',place:'Lyon',
    pts:[`Audit RGAA / WCAG automatisé et manuel sur 50 pages : conformité portée de 30 % à 52 %, de « non conforme » à « partiellement conforme ».`,`Corrections réalisées dans les composants transverses réutilisables, donc propagées sur des centaines de sites clients.`,`Refonte et fiabilisation des composants après la migration vers Vue 3.`,`Convention data-id pour fiabiliser et automatiser les tests QA (Vitest, Playwright, LambdaTest).`,`Résolution d'incidents fonctionnels en production sur les CRM métier.`],
    stats:[{value:'30 → 52 %',label:'conformité RGAA, 50 pages auditées'},{value:'100+',label:'sites clients corrigés'}]}
};
const STEP=.026;
let CS=.07,CST=STEP,CSP=.07,CEND=[.24,.28],CREV=[.19,.22];   // CSP : début des boutons du boîtier (les zones du cadran disparaissent alors) ; CEND : fondu de sortie des cartes ; CREV : apparition de toutes les cartes à la souris   // début et pas du déploiement des cartes d'outils (décalés sur grand écran : elles n'apparaissent qu'avec « S'équiper »)
/* ---------- Contenu de l'admin (/api/loop-content, voir docs/admin-boucle.md) ----------
   Le texte écrit dans le balisage et dans les tableaux ci-dessous est le REPLI : un champ vide ou une API
   en échec laisse donc l'accueil exactement comme avant. Les chaînes venues de l'admin passent par esc() avant tout innerHTML. */
const CMS=(LOADERS&&LOADERS.content)||{};
const DIAL_T=Object.assign({name:'ADRIEN NEYRON',role:'DÉVELOPPEUR × TRAILEUR × FORMATEUR',xpLabel:'DÉV. 5 ANS',xpValue:'TERRAIN 12 ANS'},Object.fromEntries(Object.entries((CMS&&CMS.dial)||{}).filter(([k,v])=>typeof v==='string'&&v.trim()).map(([k,v])=>[k,v.trim()])));   // texte du cadran : admin (Accueil), sinon repli
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const okUrl=u=>{if(!u)return '';try{const x=new URL(u,location.href);return /^(https?:|mailto:)$/.test(x.protocol)?x.href:''}catch(e){return ''}};
const shortT=t=>String(t).split(/\s[—–-]\s/)[0];   // titre court pour les blocs 3D : « Click2SellSite — Sprint… » → « Click2SellSite »
const CMS_ALIAS={dgfip:/dgfip/,c2s:/click2sell|c2s|yepgarage/,hello:/hello\s?stay/,stock:/stockpulse/,runfit:/runfit/,coach:/coachflow/,jsa:/job-?\s?search|automator/,cpaie:/c\s?\+\s?paie|cpaie/,dress:/dress\s?me\s?up/,asc:/ascension|portfolio/};   // id de la boucle → mots du slug ou du titre en base
const CMS_MAP={},CMS_USED=new Set();
Object.keys(CMS_ALIAS).forEach(id=>{const m=(CMS.projects||[]).find(p=>!CMS_USED.has(p)&&CMS_ALIAS[id].test((p.slug+' '+p.title).toLowerCase()));if(m){CMS_USED.add(m);CMS_MAP[id]=m}});
/* Fiches projets : chiffres clés (stats) et photo d'ambiance (cover). Repli = données du site (data/projects.ts), remplacées par
   celles de l'admin quand elles y sont saisies. Rien d'inventé : sans chiffres ni photo, la fiche n'affiche ni l'un ni l'autre. */
const sheetExtras=(f,a)=>{
  const st=(a.stats||[]).filter(x=>x&&x.value);if(st.length)f.stats=st.map(x=>({value:String(x.value),label:String(x.label||'')}));
  if(a.cover)Object.assign(f,{cover:a.cover,coverCredit:a.coverCredit||'',coverCreditUrl:a.coverCreditUrl||''});
  if(a.category)f.cat=String(a.category);   // catégorie (ex. « Application Web ») : métadonnée du panneau d'étape
};
Object.keys(CMS_ALIAS).forEach(id=>{const f=PROJECT_INFO[id],sp=SITE_PROJECTS.find(p=>CMS_ALIAS[id].test((p.id+' '+p.title).toLowerCase()));if(f&&sp)sheetExtras(f,sp)});
const cmsLinks=a=>{const L=[];const u=okUrl(a.link),c=okUrl(a.code);if(u)L.push({l:'Voir le projet',u});if(c)L.push({l:'Code sur GitHub',u:c});return L};
const cmsPts=a=>[['Défi',a.challenge],['Solution',a.solution],['Résultat',a.result],['Impact',a.impact]].filter(x=>x[1]).map(x=>x[0]+' : '+x[1]);
Object.keys(CMS_MAP).forEach(id=>{
  const a=CMS_MAP[id],f=PROJECT_INFO[id];if(!f)return;
  if(a.title&&id!=='asc')f.t=a.title;   // « L'ascension » garde son nom : en base, ce projet s'appelle « Portfolio »
  if(a.description)f.l=a.description;
  const pts=cmsPts(a);if(pts.length)f.pts=pts;
  if(a.technologies&&a.technologies.length)f.k=a.technologies;
  const lk=cmsLinks(a);if(lk.length){f.links=lk;delete f.note}
  sheetExtras(f,a);
  if(a.place&&/^Étape/.test(f.e||'')){const q=f.e.split(' · ');q[1]=a.place;f.e=q.join(' · ')}
  const ti={runfit:1,jsa:3,coach:4}[id];if(ti!==undefined){if(a.title)TOOLS[ti].n=a.title;if(a.tagline)TOOLS[ti].d=a.tagline}
});
if(CMS.aiTools&&CMS.aiTools.length){
  const ai=CMS.aiTools.filter(t=>t.name);
  if(ai.length){TOOLS[2].d=ai.length+' outil'+(ai.length>1?'s':'')+' IA que j\'intègre';
    TOOL_INFO[2].pts=ai.slice(0,6).map(t=>t.name+(t.tagline?' : '+t.tagline:''));TOOL_INFO[2].k=ai.slice(0,8).map(t=>t.name)}
}
['runfit','coach','jsa'].forEach(id=>{PROJECT_INFO[id]={...PROJECT_INFO[id]}});   // la carte modifie période et points : copies, les fiches de l'atelier gardent les leurs
Object.keys(CV_FACTS).forEach(id=>{const c=CV_FACTS[id],f=PROJECT_INFO[id];if(!f)return;
  if(c.when)f.st=c.when;if(c.role)f.role=c.role;
  if(c.pts){const nz=x=>String(x).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9 ]+/g,' ').replace(/\s+/g,' ').trim(),cv=c.pts.map(nz);   // une puce de l'admin déjà dite par le CV (même début, ou contenue dans une puce du CV) n'est pas répétée
    f.pts=[...c.pts,...(f.pts||[]).filter(x=>{const k=nz(x).slice(0,40);return k&&!cv.some(v=>v.includes(k)||v.slice(0,40)===k)})]}
  if(c.stats&&!(f.stats&&f.stats.length))f.stats=c.stats});
const PUSH=[60,90,120,240,270,300],PUSH_R=2.6;   // boutons du boîtier (degrés depuis midi, sens horaire) ; PUSH[i] affiche TOOLS[i] : 2 h, 3 h, 4 h à droite, 8 h, 9 h, 10 h à gauche
const toolsUl=$('#tools'), lines=$('#toolLines');
const chips=TOOLS.map((t,i)=>{
  const li=document.createElement('li'); li.className='chip';
  const inner=`<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[t.i]}</svg><b>${esc(t.n)}</b><span class="d">${esc(t.d)}</span>`;
  if(TOOL_INFO[i])li.innerHTML=`<button type="button" class="cb" aria-haspopup="dialog">${inner}</button>`;   // carte cliquable : ouvre la fiche du projet
  else{li.className='chip soon';li.innerHTML=inner}   // « À venir » : pas de fiche
  toolsUl.appendChild(li);
  const ln=document.createElementNS('http://www.w3.org/2000/svg','line'); ln.setAttribute('pathLength','1'); lines.appendChild(ln);
  return {li,ln};
});
let LAY={W:0,H:0,cx:0,cy:0,Rs:0,sx:0};
function layoutTools(){
  const st=S[0]; const W=st.clientWidth,H=st.clientHeight;
  const mob=isMobile();
  const split=!mob&&W>=1000;   // grand écran : disposition asymétrique, texte à gauche, montre à droite en 3/4 (accueil seulement)
  const cy=mob?H*.545:(split?H*.5:H*.53), cx=W/2;   // montre posée plus bas et un peu plus petite sur mobile : espace négatif entre le texte du hero et le cadran
  const Rs=mob?.33*W:(split?.30:.265)*Math.min(W,H);
  LAY={W,H,cx,cy,Rs,sx:split?Math.round(W*.2):0};   // sx : décalage de la montre vers la droite (px) sur l'accueil
  const sp=$('#spot');sp.style.setProperty('--spx',cx+'px');sp.style.setProperty('--spy',cy+'px');sp.style.setProperty('--spr',(Rs*1.8).toFixed(0)+'px');
  lines.setAttribute('viewBox',`0 0 ${W} ${H}`);
  const rx=Math.min(.36*W,520), ry=.34*H;
  // les cartes ne passent ni sous le titre « S'équiper » ni sur le pied de page et l'altitude en bas
  const sr=st.getBoundingClientRect(),hr=$('#head2').getBoundingClientRect();
  const minTop=hr.bottom-sr.top+16,maxBottom=H-84,hl=hr.left-sr.left-12,hrt=hr.right-sr.left+12;
  chips.forEach((c,i)=>{
    if(mob){c.li.style.left=c.li.style.top='';c.ln.style.display='none';return}
    const th=TOOLS[i].a*Math.PI/180;
    let x=cx+Math.sin(th)*rx, y=cy-Math.cos(th)*ry;
    if(split){   // grand écran : deux colonnes de trois cartes de part et d'autre de la montre (le titre a disparu à ce moment-là)
      const sd=Math.sin(th)<0?-1:1,rank=TOOLS.map((t,j)=>j).filter(j=>Math.sin(TOOLS[j].a*Math.PI/180)<0===(sd<0)).sort((a,b)=>sd>0?TOOLS[a].a-TOOLS[b].a:TOOLS[b].a-TOOLS[a].a).indexOf(i),top0=96,span=(maxBottom-top0)/3;
      const edge=Math.max(24,W*.03);x=sd<0?edge+112:W-edge-112;y=top0+(rank+.5)*span;
    }
    const ch=c.li.offsetHeight||68;
    let top=Math.min(y-ch/2,maxBottom-ch);
    if(!split&&x+112>hl&&x-112<hrt)top=Math.max(top,minTop);   // sous le titre seulement si la carte est dans sa largeur
    c.li.style.left=(x-112)+'px'; c.li.style.top=top+'px';
    const ux=Math.sin(th), uy=-Math.cos(th);
    const x1=cx+ux*(Rs*.66+14), y1=cy+uy*(Rs*.66+14);
    const dx=x-x1, dy=y-y1, dl=Math.hypot(dx,dy)||1;
    const back=Math.min(120,dl*.6);
    c.ln.style.display='';
    c.ln.setAttribute('x1',x1);c.ln.setAttribute('y1',y1);
    c.ln.setAttribute('x2',x-dx/dl*back);c.ln.setAttribute('y2',y-dy/dl*back);
  });
  if(mob)return;
  // pas de chevauchement entre cartes d'un même côté (titre plus haut sur les écrans moyens : les cartes du haut descendent)
  [-1,1].forEach(side=>{
    const col=chips.filter((c,i)=>Math.sign(Math.sin(TOOLS[i].a*Math.PI/180))===side).map(c=>({c,top:parseFloat(c.li.style.top),h:c.li.offsetHeight||68})).sort((a,b)=>a.top-b.top);
    for(let k=1;k<col.length;k++)col[k].top=Math.max(col[k].top,col[k-1].top+col[k-1].h+10);
    const over=col.length?col[col.length-1].top+col[col.length-1].h-maxBottom:0;
    if(over>0)col.forEach(o=>{o.top-=over});   // trop bas : la colonne remonte d'un bloc
    col.forEach(o=>{o.c.li.style.top=o.top+'px'});
  });
}


/* ---------- Aurore boréale et étoiles (shader plein écran, basse résolution) ---------- */
const auroraCv=$('#aurora');let auroraGL=null,auroraU=null;
const AUR_FS=`precision highp float;
uniform vec2 uRes;uniform float uT;uniform float uK;uniform float uW;
float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<5;i++){s+=a*vn(p);p=p*2.03+vec2(17.,9.);a*=.5;}return s;}
void main(){
  vec2 uv=gl_FragCoord.xy/uRes;float asp=uRes.x/uRes.y;
  vec3 col=vec3(0.);
  vec2 g=vec2(uv.x*asp,uv.y)*85.;vec2 id=floor(g);vec2 f=fract(g)-.5;
  float h=hash(id);float st=step(.962,h);
  vec2 off=vec2(hash(id+1.3),hash(id+7.7))-.5;
  float d=length(f-off*.6);
  float tw=.65+.35*sin(uT*(1.2+h*3.)+h*40.);
  float sv=st*smoothstep(.2,.0,d)*tw*(.35+.65*hash(id+3.1));
  col+=vec3(.9,.96,.95)*sv*smoothstep(.06,.5,uv.y);
  vec3 aur=vec3(0.);
  for(int i=0;i<3;i++){
    float fi=float(i);
    float x=uv.x*asp*1.35+fi*2.7;
    float w=fbm(vec2(x*.8+uT*.03*(1.+fi*.35),fi*5.3+uT*.018));
    float base=.6+.05*fi+.16*(w-.5)+.04*sin(x*1.7+uT*.11+fi);
    float dy=uv.y-base;
    float prof=smoothstep(-.05,.0,dy)*exp(-max(dy,0.)*(4.6+fi));
    float rays=.5+.5*vn(vec2(x*26.,uT*.12+fi*3.));
    float veil=.55+.45*fbm(vec2(x*2.2,uv.y*3.+uT*.05+fi));
    vec3 c=mix(vec3(0.,.96,.63),vec3(0.,.72,.66),smoothstep(0.,.25,dy));
    c=mix(c,vec3(.55,.86,.80),smoothstep(.18,.5,dy));
    aur+=c*prof*mix(.55,1.,rays)*veil*(.2-.05*fi);
  }
  aur*=(1.-smoothstep(.7,.95,uv.y))*smoothstep(.34,.52,uv.y);
  aur*=uK;   // fondu de l'aurore pendant la plongée
  aur=mix(aur,vec3(.89,.43,.23)*dot(aur,vec3(.3,.6,.1))*1.5,uW);   // sa lumière vire de l'émeraude au cuivre de la carte
  col+=aur;
  col=1.-exp(-col*1.6);
  gl_FragColor=vec4(col,clamp(max(col.r,max(col.g,col.b)),0.,1.));
}`;
function initAurora(){
  const fail=()=>{S[0].classList.add('noaurora')};
  let gl=null;try{gl=auroraCv.getContext('webgl',{alpha:true,premultipliedAlpha:true,antialias:false,powerPreference:'low-power'})}catch(e){}
  if(!gl){fail();return}
  const mk=(t,src)=>{const sh=gl.createShader(t);gl.shaderSource(sh,src);gl.compileShader(sh);return gl.getShaderParameter(sh,gl.COMPILE_STATUS)?sh:null};
  const vs=mk(gl.VERTEX_SHADER,'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}'),fs=mk(gl.FRAGMENT_SHADER,AUR_FS);
  if(!vs||!fs){fail();return}
  const pr=gl.createProgram();gl.attachShader(pr,vs);gl.attachShader(pr,fs);gl.linkProgram(pr);
  if(!gl.getProgramParameter(pr,gl.LINK_STATUS)){fail();return}
  gl.useProgram(pr);const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
  const loc=gl.getAttribLocation(pr,'p');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
  auroraGL=gl;auroraU={res:gl.getUniformLocation(pr,'uRes'),t:gl.getUniformLocation(pr,'uT'),k:gl.getUniformLocation(pr,'uK'),w:gl.getUniformLocation(pr,'uW')};
}
function setCompassQuality(){if(renderer)renderer.setPixelRatio(Math.min(devicePixelRatio,QDPR()))}
function applyQuality(){
  document.body.dataset.q=String(QC.tier);
  setCompassQuality();PARC.setQuality();SHOE.setQuality(QC.tier);CAMP.setQuality(QC.tier);sizeAurora();
}
function sizeAurora(){
  const q=[.6,.4,.3][QC.tier];
  const w=Math.max(2,Math.round(auroraCv.clientWidth*q)),h=Math.max(2,Math.round(auroraCv.clientHeight*q));
  auroraCv.width=w;auroraCv.height=h;if(auroraGL)auroraGL.viewport(0,0,w,h);
}
let auroraK=1,auroraW=0;   // fondu et virage de teinte de l'aurore, pilotés par la position dans la plongée
function drawAurora(t){if(!auroraGL)return;auroraGL.uniform2f(auroraU.res,auroraCv.width,auroraCv.height);auroraGL.uniform1f(auroraU.t,t);auroraGL.uniform1f(auroraU.k,auroraK);auroraGL.uniform1f(auroraU.w,auroraW);auroraGL.drawArrays(auroraGL.TRIANGLES,0,3)}

/* ---------- Boussole 3D ---------- */
function webglOK(){try{const c=document.createElement('canvas');return !!(c.getContext('webgl')||c.getContext('experimental-webgl'))}catch(e){return false}}
const THREE_OK=!!THREE&&webglOK();
const cv=$('#compassCanvas');
let strapLow=null,skyK=-1;
let renderer,scene3,cam,group,needle,dialTex,dialCanvas,bezelTex,bezelCanvas,vis=10,strapApply=null,readCanvas=null,readTex=null,lastReadDeg=-1,lastReadKey='',aimKey=null,toolAim=-1,dialTool=-1,dialOver=null,pinnedKey=null,hoverKey=null,roMesh=null,topoMesh=null,topoTex=null,lastInto=null;
const NEEDLE_PIV=.06,DIAL_R=1.98,NDL={ok:false,w:0,tip:[0,0],piv:[0,0]};   // pivot de l'aiguille (base du triangle nord) et rayon du cadran, en unités de la montre : la trace des étapes démarre sous ce pivot, l'aiguille la recouvre ; NDL : pointe et pivot de l'aiguille à l'écran (px), recopiés par l'aiguille de la carte pendant la plongée
   // pointe nord de l'aiguille (pivot à .06 + losange de .38) et rayon du cadran, en unités de la montre : la trace des étapes démarre sous cette pointe
/* ---------- Montre GPS outdoor, inspirée des séries Garmin Fenix et Enduro ---------- */
const DIAL_NIGHT={bg:'#050607',pat:'rgba(255,255,255,.05)',tickBig:'#E6F4F1',tick:'rgba(200,210,216,.6)',ring:'rgba(255,255,255,.35)',N:'#E26D3B',card:'#E6F4F1',inter:'#9AA4AB',deg:'#B8C0C6',lab:'#AEB8BF',val:'#E6F4F1',qual:'#C9D1D6',rTitle:'#E6F4F1',rDesc:'#B9C2CA'};
const DIAL_DAY={bg:'#F2EEE6',pat:'rgba(60,40,20,.045)',tickBig:'#1B1712',tick:'rgba(27,23,18,.62)',ring:'rgba(27,23,18,.45)',N:'#A8401B',card:'#1B1712',inter:'#5F584D',deg:'#554E43',lab:'#554E43',val:'#1B1712',qual:'#3F392F',rTitle:'#1B1712',rDesc:'#3F392F'};
const dialPal=()=>theme==='light'?DIAL_DAY:DIAL_NIGHT;   // cadran clair en mode jour (contrastes ≥ 4,5:1 sur le papier #F2EEE6)
function makeDial(){   // écran MIP : boussole numérique ; nuit : fond noir, traits blancs ; jour : fond papier, traits encre
  const P=dialPal(),c=dialCanvas||(dialCanvas=document.createElement('canvas'));
  const N=(('ontouchstart' in window)&&innerWidth<900)?1536:2048;c.width=c.height=N;
  const x=c.getContext('2d'),R=512,cx=R,cy=R;x.setTransform(N/1024,0,0,N/1024,0,0);
  x.fillStyle=P.bg;x.fillRect(0,0,1024,1024);
  const pc=document.createElement('canvas');pc.width=pc.height=4;const pp=pc.getContext('2d');pp.fillStyle=P.pat;pp.fillRect(0,0,2,2);
  x.fillStyle=x.createPattern(pc,'repeat')||'rgba(255,255,255,.02)';x.fillRect(0,0,1024,1024);
  for(let d=0;d<360;d+=6){
    const a=d*Math.PI/180-Math.PI/2,big=d%30===0,r1=486,r2=big?446:464;
    x.strokeStyle=big?P.tickBig:P.tick;x.lineWidth=big?5:2.4;
    x.beginPath();x.moveTo(cx+Math.cos(a)*r1,cy+Math.sin(a)*r1);x.lineTo(cx+Math.cos(a)*r2,cy+Math.sin(a)*r2);x.stroke();
  }
  x.strokeStyle=P.ring;x.lineWidth=2;x.beginPath();x.arc(cx,cy,490,0,TAU);x.stroke();
  x.textAlign='center';x.textBaseline='middle';
  const at=(d,r)=>{const a=d*Math.PI/180-Math.PI/2;return [cx+Math.cos(a)*r,cy+Math.sin(a)*r]};
  [['N',0],['E',90],['S',180],['O',270]].forEach(([l,d])=>{x.font='700 66px "JetBrains Mono", monospace';x.fillStyle=d===0?P.N:P.card;const p=at(d,392);x.fillText(l,p[0],p[1])});
  [['NE',45],['SE',135],['SO',225],['NO',315]].forEach(([l,d])=>{x.font='500 34px "JetBrains Mono", monospace';x.fillStyle=P.inter;const p=at(d,392);x.fillText(l,p[0],p[1])});
  [30,60,120,150,210,240,300,330].forEach(d=>{x.font='500 26px "JetBrains Mono", monospace';x.fillStyle=P.deg;const p=at(d,392);x.fillText(String(d),p[0],p[1])});
  // champs de données
  // identité : le nom en grand en haut du cadran, puis le titre (les technologies sont dans la scène « S'équiper »)
  {const nm=(dialOver?dialOver.n:DIAL_T.name).toUpperCase();let sz=68;x.font='700 '+sz+'px "JetBrains Mono", monospace';   // survol d'un bouton du boîtier : le titre de l'outil remplace le nom
   while(x.measureText(nm).width>760&&sz>34){sz-=2;x.font='700 '+sz+'px "JetBrains Mono", monospace'}
   x.fillStyle=P.val;x.fillText(nm,cx,cy-196)}
  {const rl=dialOver?'ATELIER':DIAL_T.role.toUpperCase();let rs=31;x.font='700 '+rs+'px "JetBrains Mono", monospace';while(x.measureText(rl).width>800&&rs>18){rs-=1;x.font='700 '+rs+'px "JetBrains Mono", monospace'}x.fillStyle=P.N;x.fillText(rl,cx,cy-140)}
  x.font='500 30px "JetBrains Mono", monospace';x.fillStyle=P.lab;x.fillText(DIAL_T.xpLabel.toUpperCase(),cx,cy+214);
  x.font='700 40px "JetBrains Mono", monospace';x.fillStyle=P.val;x.fillText(DIAL_T.xpValue.toUpperCase(),cx,cy+268);
  // qualités de savoir-être associées aux quatre points cardinaux
  x.font='500 28px "JetBrains Mono", monospace';
  [['Résilience',0,326,P.N],['Écoute',90,300,P.qual],['Stabilité',180,326,P.qual],['Curiosité',270,300,P.qual]].forEach(([l,d,r,col])=>{x.fillStyle=col;const p=at(d,r);x.fillText(l,p[0],p[1])});
}
function makeBezel(){   // lunette acier brossé : graduations et points cardinaux gravés
  const c=bezelCanvas||(bezelCanvas=document.createElement('canvas'));c.width=c.height=1024;
  const x=c.getContext('2d'),R=512;
  const g=x.createLinearGradient(0,0,1024,1024);g.addColorStop(0,'#B4BBC1');g.addColorStop(.5,'#6F787F');g.addColorStop(1,'#A5ACB2');
  x.fillStyle=g;x.fillRect(0,0,1024,1024);
  let seed=5;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647};
  for(let i=0;i<900;i++){const r=432+rnd()*80,a0=rnd()*6.283,len=.2+rnd()*.9;x.strokeStyle=(rnd()<.5?'rgba(255,255,255,':'rgba(20,26,32,')+(.05+rnd()*.08)+')';x.lineWidth=.6+rnd()*1.2;x.beginPath();x.arc(R,R,r,a0,a0+len);x.stroke()}
  x.strokeStyle='rgba(22,27,32,.85)';
  for(let d=0;d<360;d+=6){const a=d*Math.PI/180-Math.PI/2,big=d%30===0,r1=508,r2=big?486:497;x.lineWidth=big?5:2.4;x.beginPath();x.moveTo(R+Math.cos(a)*r1,R+Math.sin(a)*r1);x.lineTo(R+Math.cos(a)*r2,R+Math.sin(a)*r2);x.stroke()}
  x.textAlign='center';x.textBaseline='middle';
  [['N',0],['NE',45],['E',90],['SE',135],['S',180],['SO',225],['O',270],['NO',315]].forEach(([l,d])=>{
    const a=d*Math.PI/180;x.save();x.translate(R+Math.sin(a)*458,R-Math.cos(a)*458);x.rotate(a);
    x.font=(l.length>1?'700 34px':'700 44px')+' "JetBrains Mono", monospace';
    x.fillStyle='rgba(255,255,255,.55)';x.fillText(l,1.5,1.5);   // arête claire sous la gravure
    x.fillStyle=l==='N'?'#B8431A':'#1D2227';x.fillText(l,0,0);x.restore();
  });
}
function makeGlass(){
  const c=document.createElement('canvas');c.width=c.height=512;const x=c.getContext('2d');
  x.beginPath();x.arc(256,256,256,0,TAU);x.clip();
  const g=x.createLinearGradient(60,40,330,300);g.addColorStop(0,'rgba(255,255,255,.20)');g.addColorStop(.42,'rgba(255,255,255,.04)');g.addColorStop(.5,'rgba(255,255,255,0)');
  x.fillStyle=g;x.fillRect(0,0,512,512);
  x.lineCap='round';x.lineWidth=3;x.strokeStyle='rgba(255,255,255,.22)';x.beginPath();x.arc(256,256,232,3.55,4.55);x.stroke();
  x.lineWidth=2;x.strokeStyle='rgba(255,255,255,.10)';x.beginPath();x.arc(256,256,232,.55,1.1);x.stroke();
  return c;
}
function makeEnv(){   // reflets pour l'acier : ciel froid, lueur cyan à gauche, lueur cuivre à droite (celles du massif en fil de fer)
  const mk=(a,b,boxes)=>{const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d'),g=x.createLinearGradient(0,0,0,128);g.addColorStop(0,a);g.addColorStop(1,b);x.fillStyle=g;x.fillRect(0,0,128,128);
    (boxes||[]).forEach(([bx,by,bw,bh,col])=>{x.fillStyle=col;x.fillRect(bx,by,bw,bh)});return c};
  const t=new THREE.CubeTexture([mk('#3A1C0C','#07090B',[[44,0,40,128,'rgba(226,109,59,.85)']]),mk('#0C2F44','#05080A',[[40,0,36,128,'rgba(127,208,255,.8)']]),mk('#DDE8F0','#232B33',[[14,22,100,34,'rgba(255,255,255,.95)']]),mk('#050607','#080A0C'),mk('#C9D6E0','#1A232B',[[20,16,88,26,'rgba(255,255,255,.9)']]),mk('#0A1014','#05080A')]);
  t.needsUpdate=true;return t;
}
function makeBrushed(){
  const c=document.createElement('canvas');c.width=512;c.height=256;const x=c.getContext('2d');
  x.fillStyle='#8a8a8a';x.fillRect(0,0,512,256);
  let seed=11;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647};
  for(let i=0;i<1100;i++){const y=rnd()*256,l=60+rnd()*300,px=rnd()*512;x.strokeStyle=(rnd()<.5?'rgba(255,255,255,':'rgba(0,0,0,')+(.04+rnd()*.08)+')';x.lineWidth=.6+rnd()*1.2;x.beginPath();x.moveTo(px,y);x.lineTo(px+l,y+(rnd()-.5)*1.5);x.stroke()}
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(3,1);return t;
}
function makeStrap(kind){   // bracelet silicone complet, large, mat et lisse, extrémité arrondie, plis souples près des pattes
  const Wt=kind==='blanc',W=680,H=240,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
  x.fillStyle=Wt?'#ECECE8':'#15171A';x.fillRect(0,0,W,H);
  const U=xx=>(xx+1.7)/3.4*W,V=yy=>(1-yy/1.1)*H,hw=yy=>1.625-.35*Math.min(yy,.5);
  let g=x.createLinearGradient(0,0,W,0);g.addColorStop(0,'rgba(0,0,0,'+(Wt?.16:.35)+')');g.addColorStop(.3,'rgba(255,255,255,'+(Wt?.0:.03)+')');g.addColorStop(.5,'rgba(255,255,255,'+(Wt?.22:.06)+')');g.addColorStop(.7,'rgba(255,255,255,'+(Wt?.0:.03)+')');g.addColorStop(1,'rgba(0,0,0,'+(Wt?.16:.35)+')');
  x.fillStyle=g;x.fillRect(0,0,W,H);
  let seed=9;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647};
  for(let i=0;i<7000;i++){x.fillStyle=Wt?'rgba(70,70,64,'+(.03+rnd()*.06)+')':'rgba(255,255,255,'+(.01+rnd()*.025)+')';x.beginPath();x.arc(rnd()*W,rnd()*H,.5+rnd()*1.1,0,6.283);x.fill()}
  [[.16,7],[.27,4]].forEach(([y,lw])=>{
    const Y=V(y),x0=U(-hw(y)),x1=U(hw(y));
    x.lineWidth=lw;x.strokeStyle=Wt?'rgba(0,0,0,.22)':'rgba(0,0,0,.75)';x.beginPath();x.moveTo(x0,Y);x.quadraticCurveTo((x0+x1)/2,Y-8,x1,Y);x.stroke();
    x.lineWidth=lw*.5;x.strokeStyle=Wt?'rgba(255,255,255,.9)':'rgba(255,255,255,.10)';x.beginPath();x.moveTo(x0,Y+lw);x.quadraticCurveTo((x0+x1)/2,Y-8+lw,x1,Y+lw);x.stroke();
  });
  // fin liseré moulé, qui suit l'extrémité arrondie
  x.lineWidth=2;x.strokeStyle=Wt?'rgba(0,0,0,.14)':'rgba(255,255,255,.07)';x.beginPath();
  x.moveTo(U(-hw(.02)+.06),V(.02));x.lineTo(U(-1.39),V(.5));x.quadraticCurveTo(U(-1.39),V(.94),U(-.95),V(.94));x.lineTo(U(.95),V(.94));x.quadraticCurveTo(U(1.39),V(.94),U(1.39),V(.5));x.lineTo(U(hw(.02)-.06),V(.02));x.stroke();
  const t=new THREE.CanvasTexture(c);t.anisotropy=8;t.repeat.set(1/3.4,1/1.1);t.offset.set(.5,0);
  return t;
}

/* ---------- Bracelet fermé : anneau complet autour d'un poignet, boucle acier, ardillon, passants, queue percée ---------- */
const RING_GAP=.02,RING_T=.34,RING_C=new THREE.Vector3(0,0,-2.9),RING_W0=3.25,RING_W1=2.6,TAIL=2.4;
function ringCurve(k){   // trajet du bracelet dans le plan vertical : du patte haute, derrière le boîtier, jusqu'à la patte basse
  const P=[[2.7,-.52],[3.12,-.62],[3.55,-1.12],[3.85,-2.3],[3.62,-3.75],[2.8,-4.95],[1.4,-5.6],[0,-5.82]],pts=[];
  P.forEach(([y,z],i)=>pts.push(new THREE.Vector3(0,y*(i===0?1:k),z)));
  for(let i=P.length-2;i>=0;i--){const [y,z]=P[i];pts.push(new THREE.Vector3(0,-y*(i===0?1:k),z))}
  const c=new THREE.CatmullRomCurve3(pts,false,'centripetal');c.arcLengthDivisions=600;return c;
}
function ringFrame(curve,s,L){
  const u=Math.min(1,Math.max(0,s/L)),p=curve.getPointAt(u),T=curve.getTangentAt(u).normalize(),n=new THREE.Vector3(0,-T.z,T.y).normalize();
  if(n.dot(p.clone().sub(RING_C))<0)n.negate();
  return {p,T,n};
}
function ringScale(foot){   // échelle verticale qui pose le point le plus bas de l'anneau exactement sur le sol
  let k=1;
  for(let it=0;it<4;it++){const c=ringCurve(k),L=c.getLength();let m=0;for(let i=0;i<=400;i++){const f=ringFrame(c,i/400*L,L);m=Math.max(m,Math.abs(f.p.y+f.n.y*(RING_T/2)))}k*=(foot-.01)/m}
  return k;
}
function bandGeo(curve,L,o){   // sangle plate à bords arrondis qui suit le trajet
  const r=.12,t=RING_T,pos=[],uv=[],idx=[],cl=(v,a,b)=>Math.min(b,Math.max(a,v));
  for(let i=0;i<=o.seg;i++){
    const s=o.s0+(o.s1-o.s0)*i/o.seg,f=ringFrame(curve,s,L),hw=Math.max(o.w(s),.3)/2,off=o.off(s),v=o.v(s);
    for(let c=0;c<4;c++){
      const sx=(c===0||c===3)?1:-1,sh=c<2?1:-1,a0=c*Math.PI/2;
      for(let j=0;j<4;j++){
        const a=a0+j/3*Math.PI/2,cx=sx*(hw-r)+r*Math.cos(a),h=sh*(t/2-r)+r*Math.sin(a)+off;
        pos.push(cx,f.p.y+f.n.y*h,f.p.z+f.n.z*h);uv.push(cl(cx/hw*.5+.5,0,1),v);
      }
    }
  }
  for(let i=0;i<o.seg;i++)for(let j=0;j<16;j++){const a=i*16+j,b=i*16+(j+1)%16,c=(i+1)*16+(j+1)%16,d=(i+1)*16+j;idx.push(a,b,d,b,c,d)}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;
}
function makeLoopStrap(kind,holes){   // texture de sangle : largeur en u, longueur en v ; la queue est percée (holes = positions depuis le bout, 0 à 1)
  const Wt=kind==='blanc',W=256,H=1024,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
  x.fillStyle=Wt?'#ECECE8':'#15171A';x.fillRect(0,0,W,H);
  const g=x.createLinearGradient(0,0,W,0);g.addColorStop(0,'rgba(0,0,0,'+(Wt?.16:.35)+')');g.addColorStop(.3,'rgba(255,255,255,'+(Wt?0:.03)+')');g.addColorStop(.5,'rgba(255,255,255,'+(Wt?.22:.06)+')');g.addColorStop(.7,'rgba(255,255,255,'+(Wt?0:.03)+')');g.addColorStop(1,'rgba(0,0,0,'+(Wt?.16:.35)+')');
  x.fillStyle=g;x.fillRect(0,0,W,H);
  let seed=21;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647};
  for(let i=0;i<(Wt?0:5200);i++){x.fillStyle=Wt?'rgba(70,70,64,'+(.03+rnd()*.06)+')':'rgba(255,255,255,'+(.01+rnd()*.025)+')';x.beginPath();x.arc(rnd()*W,rnd()*H,.5+rnd()*1.1,0,6.283);x.fill()}
  [.1,.9].forEach(f=>{   // fins sillons moulés le long des bords
    x.lineWidth=3;x.strokeStyle=Wt?'rgba(0,0,0,.2)':'rgba(0,0,0,.7)';x.beginPath();x.moveTo(f*W,0);x.lineTo(f*W,H);x.stroke();
    x.lineWidth=1.5;x.strokeStyle=Wt?'rgba(255,255,255,.9)':'rgba(255,255,255,.1)';x.beginPath();x.moveTo(f*W+3,0);x.lineTo(f*W+3,H);x.stroke();
  });
  (holes||[]).forEach(q=>{
    const y=q*H;x.fillStyle=Wt?'#7E7E78':'#030405';x.beginPath();x.arc(W/2,y,11,0,6.283);x.fill();
    x.lineWidth=3;x.strokeStyle=Wt?'rgba(0,0,0,.25)':'rgba(255,255,255,.14)';x.beginPath();x.arc(W/2,y,13.5,0,6.283);x.stroke();
  });
  const t=new THREE.CanvasTexture(c);t.anisotropy=8;return t;
}
function buildStrapRing(parent,matA,matB,matMetal,matRubber,foot){
  const k=ringScale(foot),curve=ringCurve(k),L=curve.getLength(),sb=L*.54,sTip=sb-TAIL,lenB=L-sTip,sm=x=>{x=Math.min(1,Math.max(0,x));return x*x*(3-2*x)};
  const base=s=>RING_W0-(RING_W0-RING_W1)*sm(Math.min(s,L-s)/(L*.5));
  const ringG=new THREE.Group();parent.add(ringG);
  /* Bracelet à boucle ardillon, comme une vraie montre (vu par la face intérieure de l'anneau, D = −1, celle que voit la caméra ; u = hauteur comptée vers cette face) :
     - sangle haute (sans trous) : de la patte haute jusqu'à la barre de charnière (sA), dont le tube enveloppe son extrémité ;
     - cadre rigide et plan, accroché à cette barre, dans le prolongement de la sangle haute ; barre d'extrémité à s1 ;
     - sangle percée : de la patte basse, elle passe SOUS la barre d'extrémité, traverse le cadre (elle franchit son plan à sx, où se trouve un trou),
       passe AU-DESSUS de la charnière, puis recouvre la sangle haute jusqu'à sa queue, tenue par les passants ;
     - ardillon : articulé sur la charnière, droit dans le plan du cadre, il traverse le trou à sx et repose sur la barre d'extrémité. */
  const D=-1,rt=.065,rBar=RING_T/2+.03,sA=sb-.05,s1=sA+.75,uOver=rBar+RING_GAP+RING_T/2,uUnder=-(rt+RING_GAP+RING_T/2),a1=sA+rBar+.06;
  ringG.add(new THREE.Mesh(bandGeo(curve,L,{s0:0,s1:sA,seg:Math.round(sA/.12),w:base,off:()=>0,v:s=>s/sA}),matA));
  const wB=s=>{const q=s-sTip;return base(s)*(q<.5?Math.sqrt(Math.max(0,1-((.5-q)/.5)**2)):1)};
  const offB=s=>s<=a1?uOver:s<=s1?uOver+(uUnder-uOver)*sm((s-a1)/(s1-a1)):uUnder*(1-sm((s-s1)/.6));   // au-dessus de la sangle haute → traverse le cadre → sous la barre d'extrémité → rejoint le niveau de la sangle
  let sx=a1;{let lo=a1,hi=s1;for(let it=0;it<40;it++){const m=(lo+hi)/2;if(offB(m)>0)lo=m;else hi=m}sx=(lo+hi)/2}   // point où la sangle percée franchit le plan du cadre : le trou de l'ardillon
  ringG.add(new THREE.Mesh(bandGeo(curve,L,{s0:sTip,s1:L,seg:Math.round(lenB/.06),w:wB,off:s=>D*offB(s),v:s=>1-(s-sTip)/lenB}),matB));
  const place=(m,s,dz,dh)=>{const f=ringFrame(curve,s,L),Zr=new THREE.Vector3(1,0,0).cross(f.n);m.position.copy(f.p).addScaledVector(f.n,dh).addScaledVector(f.T,dz);m.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(1,0,0),f.n,Zr));ringG.add(m);return f};
  /* passants : cadres à bords arrondis et biseautés, perpendiculaires à la sangle, qui entourent les épaisseurs présentes à cet endroit avec un jeu de RING_GAP (pas de clipping ni de z-fighting) */
  const stackAt=s=>{const lo=-RING_T/2,hiA=RING_T/2,hiB=s>=sTip?offB(s)+RING_T/2:-1e9;return [lo,Math.max(hiA,hiB),Math.max(base(s),s>=sTip?wB(s):0)]};
  const frame=(s,wall,depth,r,mat)=>{const [lo,hi,w]=stackAt(s),iw=w+2*RING_GAP,ih=hi-lo+2*RING_GAP,ow=iw+2*wall,oh=ih+2*wall;
    const rr=(p,W,H,R)=>{const x=W/2,y=H/2;R=Math.min(R,x,y);p.moveTo(-x+R,-y);p.lineTo(x-R,-y);p.quadraticCurveTo(x,-y,x,-y+R);p.lineTo(x,y-R);p.quadraticCurveTo(x,y,x-R,y);p.lineTo(-x+R,y);p.quadraticCurveTo(-x,y,-x,y-R);p.lineTo(-x,-y+R);p.quadraticCurveTo(-x,-y,-x+R,-y);return p};
    const sh=rr(new THREE.Shape(),ow,oh,r+wall);sh.holes.push(rr(new THREE.Path(),iw,ih,r));
    const bv=Math.min(wall,depth)*.35,g=new THREE.ExtrudeGeometry(sh,{depth:depth-2*bv,bevelEnabled:true,bevelThickness:bv,bevelSize:bv*.6,bevelSegments:3,curveSegments:8});
    g.translate(0,0,-(depth-2*bv)/2);
    const m=new THREE.Mesh(g,mat);place(m,s,0,D*(lo+hi)/2);return {m,hi}};
  const at=(x,s,u)=>{const f=ringFrame(curve,s,L),h=D*u;return new THREE.Vector3(x,f.p.y+f.n.y*h,f.p.z+f.n.z*h)};
  {const hw=Math.max(base(sA),wB(s1),wB(sx))/2,X=hw+RING_GAP+rt+.02,R=.2;
    // cadre plan : dans le plan de la corde de la sangle entre la charnière (sA) et la barre d'extrémité (s1), au niveau de la sangle haute (u = 0)
    const p0=at(0,sA,0),p1=at(0,s1,0),ex=new THREE.Vector3(1,0,0),ez=p1.clone().sub(p0),len=ez.length();ez.normalize();
    const ey=ringFrame(curve,sA,L).n.clone().add(ringFrame(curve,s1,L).n).multiplyScalar(D);ey.addScaledVector(ez,-ey.dot(ez)).normalize();
    const P=(x,d,du=0)=>p0.clone().addScaledVector(ex,x).addScaledVector(ez,d).addScaledVector(ey,du),pts=[];
    const C=[[X-R,len-R,0],[-(X-R),len-R,Math.PI/2],[-(X-R),R,Math.PI],[X-R,R,3*Math.PI/2]];
    C.forEach(([cx,cd,a0])=>{for(let j=0;j<=6;j++){const a=a0+j/6*Math.PI/2;pts.push(P(cx+R*Math.cos(a),cd+R*Math.sin(a)))}});
    ringG.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts,true,'centripetal'),120,rt,12,true),matMetal));
    // barre de charnière : tube qui enveloppe l'extrémité de la sangle haute (rayon > demi-épaisseur), un peu plus large que la sangle
    ringG.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([P(-(base(sA)/2+.06),0),P(base(sA)/2+.06,0)]),8,rBar,20,false),matMetal));
    [-1,1].forEach(sg=>{const cap=new THREE.Mesh(new THREE.SphereGeometry(rBar,20,12),matMetal);cap.position.copy(P(sg*(base(sA)/2+.06),0));cap.scale.set(.35,1,1);ringG.add(cap)});   // embouts arrondis
    // ardillon : de la charnière, droit dans le plan du cadre, à travers le trou (sx), jusqu'à reposer sur la barre d'extrémité
    const dTip=len-.02,tg=new THREE.TubeGeometry(new THREE.CatmullRomCurve3([P(0,0,0),P(0,dTip,rt+.045)]),16,.05,12,false);
    ringG.add(new THREE.Mesh(tg,matMetal));
    const tipC=new THREE.Mesh(new THREE.SphereGeometry(.05,12,8),matMetal);tipC.position.copy(P(0,dTip,rt+.045));ringG.add(tipC)}
  // deux passants dans la matière du bracelet, autour des deux épaisseurs, juste avant la boucle
  [sA-.75,sA-1.3].forEach(s=>frame(s,.07,.28,.06,matRubber));
  // points bas de l'anneau (repère du boîtier), pour que le sol ne coupe jamais le bracelet quand la montre s'incline
  const low=[];for(let i=0;i<=160;i++){const f=ringFrame(curve,i/160*L,L);[-1,1].forEach(sx=>[-1,1].forEach(sn=>{const q=f.p.clone().addScaledVector(f.n,sn*(RING_T/2+.05));q.x=sx*(RING_W0/2);if(q.y<-1)low.push(q)}))}
  const holes=[];for(let k=-6;k<=2;k++){const q=sx-sTip+k*.42;if(q>.7&&q<lenB-.5)holes.push(q/lenB)}   // un trou exactement là où passe l'ardillon (sx), puis tous les 4,2 mm
  return {holes,lenB,low};
}

function makeStrapFade(){   // opacité : le bracelet s'efface vers le bout, sur son dernier tiers
  const c=document.createElement('canvas');c.width=8;c.height=128;const x=c.getContext('2d'),g=x.createLinearGradient(0,0,0,128);
  g.addColorStop(0,'#000');g.addColorStop(.36,'#fff');g.addColorStop(1,'#fff');x.fillStyle=g;x.fillRect(0,0,8,128);
  const t=new THREE.CanvasTexture(c);t.repeat.set(1/3.4,1/1.55);t.offset.set(.5,0);return t;
}
/* Lecture du cap (plaque transparente au centre de l'écran) */
function makeReadout(){readCanvas=document.createElement('canvas');readCanvas.width=512;readCanvas.height=256;readTex=new THREE.CanvasTexture(readCanvas);drawReadout(0,true);return readTex}
function drawReadout(deg,force){
  const info=aimKey&&HOT[aimKey]||(toolAim>=0&&TOOLS[toolAim]?{t:TOOLS[toolAim].n,d:TOOLS[toolAim].d}:null),key=info?'i:'+(aimKey||'t'+toolAim):'h';   // survol d'un bouton du boîtier : l'écran de la montre affiche le contenu de la carte (titre et description), sans faire apparaître de nouvelle carte
  if(!force&&key===lastReadKey)return;lastReadKey=key;
  if(dialTool!==toolAim&&dialTex){dialTool=toolAim;dialOver=toolAim>=0&&TOOLS[toolAim]?TOOLS[toolAim]:null;makeDial();dialTex.needsUpdate=true}
  const P=dialPal(),x=readCanvas.getContext('2d');x.clearRect(0,0,512,256);x.textAlign='center';x.textBaseline='alphabetic';
  if(info&&!aimKey&&toolAim>=0){   // outil survolé : la description en grand (le titre est sur le cadran)
    x.fillStyle=P.rDesc;x.font='700 40px "JetBrains Mono", monospace';
    const words=info.d.split(' ');const L=[];let line='';
    words.forEach(w=>{const t=line?line+' '+w:w;if(x.measureText(t).width>480&&line){L.push(line);line=w}else line=t});L.push(line);
    const lh=48,y0=128-(L.length-1)*lh/2+13;L.forEach((l,i)=>x.fillText(l,256,y0+i*lh));
  }else if(info){
    let size=60;x.font='700 '+size+'px "JetBrains Mono", monospace';
    while(x.measureText(info.t).width>470&&size>30){size-=3;x.font='700 '+size+'px "JetBrains Mono", monospace'}
    x.fillStyle=P.rTitle;x.fillText(info.t,256,96);
    x.fillStyle=P.N;x.fillRect(206,118,100,4);
    x.fillStyle=P.rDesc;x.font='500 26px "JetBrains Mono", monospace';
    const words=info.d.split(' ');let line='',y=176;
    words.forEach(w=>{const t=line?line+' '+w:w;if(x.measureText(t).width>470&&line){x.fillText(line,256,y);y+=38;line=w}else line=t});
    x.fillText(line,256,y);
  }   // sans survol : rien (ni cap ni degrés), le cadran reste dégagé
  readTex.needsUpdate=true;
}
let topoDay=false;
function makeTopoTex(){   // relief gravé dans le verre : EXACTEMENT ce que verra la caméra de la carte (mêmes courbes, même grille, même perspective), vu de dessus au départ
  const I=PARC.topoInfo(),c=document.createElement('canvas');c.width=c.height=1024;const x=c.getContext('2d');
  const DY=topoDay=theme==='light';   // jour : le relief s'écrit sur le même papier clair que le cadran (transition clair → clair)
  x.fillStyle=DY?'#F2EEE6':'#050607';x.fillRect(0,0,1024,1024);
  const RG=I.rfin/.55,hT=I.kappa*I.rfin,fx=I.hx,fz=I.hz,rx=-I.hz,rz=I.hx;   // la texture couvre RG de rayon ; la plongée en montre 55 % au centre, soit rfin au bord du cadran
  const mOf=h=>hT/(hT+I.gy0-h);   // grossissement d'un point selon son altitude, vu par la caméra de dessus (les points hauts sont plus proches)
  const P=(u,v,m)=>[512+m*u/RG*512,512-m*v/RG*512];
  // grille de la carte : une ligne tous les 14 unités de sol (tracée au niveau moyen du terrain autour du départ)
  const mg=mOf(I.gy0-8);x.lineWidth=1;x.strokeStyle=DY?'rgba(60,90,120,.22)':'rgba(90,140,190,.22)';x.beginPath();
  const toU=(gx,gz)=>[(gx-I.x0)*rx+(gz-I.z0)*rz,(gx-I.x0)*fx+(gz-I.z0)*fz];
  for(let m=Math.floor((I.x0-RG*2)/14);m<=Math.ceil((I.x0+RG*2)/14);m++){const a=toU(m*14,I.z0-RG*2),b=toU(m*14,I.z0+RG*2),pa=P(a[0],a[1],mg),pb=P(b[0],b[1],mg);x.moveTo(pa[0],pa[1]);x.lineTo(pb[0],pb[1])}
  for(let m=Math.floor((I.z0-RG*2)/14);m<=Math.ceil((I.z0+RG*2)/14);m++){const a=toU(I.x0-RG*2,m*14),b=toU(I.x0+RG*2,m*14),pa=P(a[0],a[1],mg),pb=P(b[0],b[1],mg);x.moveTo(pa[0],pa[1]);x.lineTo(pb[0],pb[1])}
  x.stroke();
  // courbes de niveau : mêmes altitudes (multiples de cstep) et mêmes courbes maîtresses (tous les 5) que la carte
  const cg=1.4,n=Math.round(RG*2.6/cg)+1,half=(n-1)*cg/2,f=new Float32Array(n*n);let lo=1e9,hi=-1e9;
  for(let j=0;j<n;j++)for(let i=0;i<n;i++){const u=i*cg-half,v=half-j*cg,h=I.heightAt(I.x0+rx*u+fx*v,I.z0+rz*u+fz*v);f[j*n+i]=h;if(h<lo)lo=h;if(h>hi)hi=h}
  for(let k=Math.ceil(lo/I.cstep);k<=Math.floor(hi/I.cstep);k++){
    const L=k*I.cstep,master=k%5===0,t=Math.max(0,Math.min(1,(L-I.hmin)/(I.hmax-I.hmin))),m=mOf(L);
    x.strokeStyle=DY?`rgba(${Math.round(168-36*t)},${Math.round(64-18*t)},${Math.round(27-6*t)},${master?.9:.55})`:`rgba(${Math.round(199+56*t)},${Math.round(112+66*t)},${Math.round(46+61*t)},${master?.95:.62})`;x.lineWidth=master?2.4:1.3;x.beginPath();
    marchLevel(f,n,n,cg,L,(x1,y1,x2,y2)=>{const a=P(x1-half,half-y1,m),b=P(x2-half,half-y2,m);x.moveTo(a[0],a[1]);x.lineTo(b[0],b[1])});x.stroke();
  }
  const t=new THREE.CanvasTexture(c);t.anisotropy=4;return t;
}
function marchLevel(f,nx,ny,cell,L,emit){
  for(let j=0;j<ny-1;j++)for(let i=0;i<nx-1;i++){
    const a=f[j*nx+i],b=f[j*nx+i+1],c=f[(j+1)*nx+i+1],dd=f[(j+1)*nx+i];
    const k=(a>L?8:0)|(b>L?4:0)|(c>L?2:0)|(dd>L?1:0);if(k===0||k===15)continue;
    const x0=i*cell,y0=j*cell,it=(v0,v1)=>(L-v0)/(v1-v0);
    const T=[x0+it(a,b)*cell,y0],R=[x0+cell,y0+it(b,c)*cell],B=[x0+it(dd,c)*cell,y0+cell],Lf=[x0,y0+it(a,dd)*cell];
    const segs={1:[[Lf,B]],2:[[B,R]],3:[[Lf,R]],4:[[T,R]],5:[[T,Lf],[B,R]],6:[[T,B]],7:[[T,Lf]],8:[[T,Lf]],9:[[T,B]],10:[[T,R],[Lf,B]],11:[[T,R]],12:[[Lf,R]],13:[[B,R]],14:[[Lf,B]]}[k];
    for(const [p,q] of segs)emit(p[0],p[1],q[0],q[1]);
  }
}
function initThree(){
  renderer=new THREE.WebGLRenderer({canvas:cv,alpha:true,antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,QDPR()));
  scene3=new THREE.Scene();scene3.fog=new THREE.Fog(0x050811,50,400);
  cam=new THREE.PerspectiveCamera(30,1,.1,500);
  stand=new THREE.Group();scene3.add(stand);   // la montre se tient debout sur son bracelet : pivot au point de contact avec le sol
  group=new THREE.Group();group.position.y=FOOT;stand.add(group);
  scene3.add(new THREE.HemisphereLight(0xdbe9f2,0x050811,.55));
  const d=new THREE.DirectionalLight(0xffffff,.75);d.position.set(3,5,6);scene3.add(d);
  const l1=new THREE.PointLight(0x6FC6FF,1.3,34);l1.position.set(-6,3,3);scene3.add(l1);   // lueur cyan du massif, à gauche
  const l2=new THREE.PointLight(0xE26D3B,1.2,34);l2.position.set(6,1,3);scene3.add(l2);   // lueur cuivre du massif, à droite
  const l3=new THREE.PointLight(0xE26D3B,.6,24);l3.position.set(0,-5,4);scene3.add(l3);
  const env=makeEnv(),brushed=makeBrushed();
  const polymer=new THREE.MeshStandardMaterial({color:0x17191C,roughness:.82,metalness:.08,bumpMap:brushed,bumpScale:.1});
  const or=new THREE.MeshStandardMaterial({color:0x8E969D,metalness:.9,roughness:.5,roughnessMap:brushed,envMap:env,envMapIntensity:.7});
  const orPoli=new THREE.MeshStandardMaterial({color:0xE6EAEE,metalness:.96,roughness:.14,envMap:env,envMapIntensity:1.7});
  // boîtier en polymère renforcé, lunette en acier brossé
  const body=new THREE.Mesh(new THREE.CylinderGeometry(2.46,2.5,.5,110),polymer);body.rotation.x=Math.PI/2;body.position.z=-.25;group.add(body);
  const bp=[[2.52,-.02],[2.52,.05],[2.44,.13],[2.04,.13],[1.98,.07],[1.98,-.02]].map(([r,y])=>new THREE.Vector2(r,y));   // profil décrit de l'extérieur vers l'intérieur : LatheGeometry oriente alors les faces vers l'extérieur (flanc, dessus, bord intérieur) ; dans l'autre sens elles étaient retournées et la lunette devenait transparente selon l'angle
  const bg=new THREE.LatheGeometry(bp,128);bg.rotateX(Math.PI/2);group.add(new THREE.Mesh(bg,or));
  makeBezel();bezelTex=new THREE.CanvasTexture(bezelCanvas);bezelTex.anisotropy=8;
  const bz=new THREE.Mesh(new THREE.RingGeometry(2.05,2.43,128),new THREE.MeshStandardMaterial({map:bezelTex,color:0x5E5E5E,metalness:.7,roughness:.55,envMap:env,envMapIntensity:.32}));bz.position.z=.132;group.add(bz);
  // écran
  makeDial();dialTex=new THREE.CanvasTexture(dialCanvas);dialTex.anisotropy=8;
  const scr=new THREE.Mesh(new THREE.CircleGeometry(1.98,120),new THREE.MeshBasicMaterial({map:dialTex}));scr.position.z=.05;group.add(scr);
  topoTex=makeTopoTex();
  topoMesh=new THREE.Mesh(new THREE.CircleGeometry(1.98,120),new THREE.MeshBasicMaterial({map:topoTex,transparent:true,opacity:0,depthWrite:false}));topoMesh.position.z=.053;topoMesh.visible=false;group.add(topoMesh);
  const ro=new THREE.Mesh(new THREE.PlaneGeometry(1.6,.8),new THREE.MeshBasicMaterial({map:makeReadout(),transparent:true,depthWrite:false}));ro.position.set(0,-.32,.06);group.add(ro);roMesh=ro;
  // six boutons, un par carte de l'atelier : 10 h, 9 h, 8 h à gauche ; 2 h, 3 h, 4 h à droite (voir PUSH)
  PUSH.forEach(clock=>{
    const phi=(90-clock)*Math.PI/180,ux=Math.cos(phi),uy=Math.sin(phi);
    // collés au boîtier : la bague s'enfonce dans le flanc (rayon 2,48) et le poussoir part de sa surface
    const cap=new THREE.Mesh(new THREE.CylinderGeometry(.17,.17,.2,24),polymer);cap.rotation.z=phi-Math.PI/2;cap.position.set(ux*PUSH_R,uy*PUSH_R,-.1);group.add(cap);
    const col=new THREE.Mesh(new THREE.CylinderGeometry(.21,.21,.1,24),orPoli);col.rotation.z=phi-Math.PI/2;col.position.set(ux*2.49,uy*2.49,-.1);group.add(col);
  });
  // pattes (QuickFit), vis or rose, bracelet silicone
  const ls=new THREE.Shape();ls.moveTo(-1.85,0);ls.lineTo(1.85,0);ls.lineTo(1.75,1.0);ls.lineTo(-1.75,1.0);ls.closePath();
  const lgeo=new THREE.ExtrudeGeometry(ls,{depth:.34,bevelEnabled:true,bevelThickness:.04,bevelSize:.04,bevelSegments:2,curveSegments:1});
  const strapTex={};   // textures des sangles, créées avec la longueur de la queue
  const matA=new THREE.MeshStandardMaterial({color:0x9A9A9A,bumpScale:.5,roughness:.88,metalness:0,side:THREE.DoubleSide});
  const matB=new THREE.MeshStandardMaterial({color:0x9A9A9A,bumpScale:.5,roughness:.88,metalness:0,side:THREE.DoubleSide});
  const strapSide=new THREE.MeshStandardMaterial({color:0x0E0F10,roughness:.9,metalness:0});
  const keeperM=new THREE.MeshStandardMaterial({color:0x15171A,roughness:.9,metalness:0});   // passants : même caoutchouc mat que la sangle (couleur suivie dans strapApply)
  const steelBuckle=new THREE.MeshStandardMaterial({color:0xB4BAC0,metalness:.8,roughness:.3,roughnessMap:brushed,envMap:env,envMapIntensity:.35});   // boucle : acier brossé, reflets d'environnement atténués (pas de teinte cuivre ni cyan)
  strapApply=dark=>{dark=!dark;const kk=dark?'blanc':'noir';if(strapTex[kk]){[[matA,'A'],[matB,'B']].forEach(([m,q])=>{m.map=strapTex[kk][q];m.bumpMap=strapTex[kk][q];m.roughness=dark?.38:.9;m.bumpScale=dark?.08:.5;m.needsUpdate=true})}strapSide.color.set(dark?0xC9C9C3:0x0E0F10);strapSide.roughness=dark?.5:.9;keeperM.color.set(dark?0xECECE8:0x15171A);keeperM.roughness=dark?.38:.9};
  /* Bracelet fermé : anneau complet (voir buildStrapRing) ; les pattes et les vis restent sur le boîtier */
  [1,-1].forEach(sg=>{
    const lg=new THREE.Mesh(lgeo,polymer);lg.rotation.z=sg>0?0:Math.PI;lg.position.set(0,sg*1.95,-.42);group.add(lg);
    [-1,1].forEach(sx=>{const sc=new THREE.Mesh(new THREE.CylinderGeometry(.075,.075,.03,6),orPoli);sc.rotation.x=Math.PI/2;sc.position.set(sx*1.6,sg*2.78,-.075);group.add(sc)});
  });
  {
    const ring=buildStrapRing(group,matA,matB,steelBuckle,keeperM,FOOT);
    strapLow=ring.low;
    strapTex.noir={A:makeLoopStrap('noir',null),B:makeLoopStrap('noir',ring.holes)};
    strapTex.blanc={A:makeLoopStrap('blanc',null),B:makeLoopStrap('blanc',ring.holes)};
  }
  strapApply(theme==='dark');
  // aiguille de cap : losange braise (nord) et argent (sud), au centre du cadran
  needle=makeNeedle();needle.position.set(0,.06,.075);group.add(needle);applyDialTheme();
  const gl=new THREE.Mesh(new THREE.CircleGeometry(1.98,64),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(makeGlass()),transparent:true,depthWrite:false}));gl.position.z=.16;group.add(gl);
  buildScenery();
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>{applyDialTheme();makeBezel();bezelTex.needsUpdate=true;if(staticMode)drawStatic()});
}
function makeNeedle(){
  const g=new THREE.Group(),mk=(pts,col)=>{const sh=new THREE.Shape();sh.moveTo(pts[0][0],pts[0][1]);pts.slice(1).forEach(q=>sh.lineTo(q[0],q[1]));sh.closePath();return new THREE.Mesh(new THREE.ShapeGeometry(sh),new THREE.MeshBasicMaterial({color:col,transparent:true}))};
  const W=.12,N=.38,S=.30;
  g.add(mk([[0,N],[-W,0],[0,0]],0xF59A5C));g.add(mk([[0,N],[0,0],[W,0]],0xD4581F));   // nord, deux facettes
  g.add(mk([[0,-S],[0,0],[-W,0]],0xDDE3E7));g.add(mk([[0,-S],[W,0],[0,0]],0x9AA3AA));   // sud
  const piv=new THREE.Mesh(new THREE.CircleGeometry(.035,20),new THREE.MeshBasicMaterial({color:0x0B0D10,transparent:true}));piv.position.z=.004;g.add(piv);
  return g;
}
function applyDialTheme(){   // cadran + aiguille + affichage selon le thème
  if(!dialTex)return;
  makeDial();dialTex.needsUpdate=true;
  if(topoMesh&&topoDay!==(theme==='light')){const nt=makeTopoTex();topoMesh.material.map=nt;topoMesh.material.needsUpdate=true;topoTex.dispose();topoTex=nt}
  if(readCanvas)drawReadout(((-(needle?needle.rotation.z:0)*180/Math.PI)%360+360)%360,true);
  if(needle){const L=theme==='light',cols=L?[0xD2672B,0xA8401B,0x4A4F55,0x23272B]:[0xF59A5C,0xD4581F,0xDDE3E7,0x9AA3AA];cols.forEach((h,i)=>needle.children[i].material.color.setHex(h));needle.children[4].material.color.setHex(L?0x1B1712:0x0B0D10)}
}
/* ---------- Décor de l'accueil : sol rocheux, rochers, massif en fil de fer lumineux (cyan à gauche, cuivre à droite) ---------- */
const FOOT=4.23,PITCH=3.1*Math.PI/180,MNX=110,MNZ=64,MU0=1.35;
let gtxDay=null,gtxNight=null,sceneLt=null,stand,scenery,sceneryNear,mtnGeo,mtnMat,mtnMesh,nearGeo,nearMat,nearMesh,gndMat,rockMat,shadowMat;const farRocks=[],nearRocks=[];
const FAR_ALT={};   // grand écran : trois rochers qui tomberaient sur le bracelet (de x centré à x décalé) passent sur le côté gauche
function makeGroundTex(day){   // sol rocheux : dalles de pierre (cellules de Voronoï) aux joints sombres, arêtes éclairées ; day : dalles de sable clair, joints ocre
  const N=256,c=document.createElement('canvas');c.width=c.height=N;const x=c.getContext('2d'),im=x.createImageData(N,N);
  let sd=17;const r=()=>{sd=(sd*16807)%2147483647;return sd/2147483647};
  const K=46,px=[],py=[],tone=[];for(let i=0;i<K;i++){px.push(r()*N);py.push(r()*N);tone.push(.55+r()*.45)}
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){
    let d1=1e9,d2=1e9,k1=0;
    for(let k=0;k<K;k++){let dx=Math.abs(i-px[k]),dy=Math.abs(j-py[k]);if(dx>N/2)dx=N-dx;if(dy>N/2)dy=N-dy;const d=dx*dx+dy*dy;if(d<d1){d2=d1;d1=d;k1=k}else if(d<d2)d2=d}
    const e=Math.sqrt(d2)-Math.sqrt(d1),joint=Math.min(1,e/4.5),n=.85+r()*.3;
    const o=(j*N+i)*4;
    if(day){const v=(76+44*tone[k1]*joint)*n*(.6+.4*joint);im.data[o]=Math.min(255,v);im.data[o+1]=Math.min(255,v*.86);im.data[o+2]=Math.min(255,v*.70)}   // sable beige craquelé : chaud mais peu saturé, joints plus sombres
    else{const v=(48+60*tone[k1]*joint)*n*(.55+.45*joint);im.data[o]=v*.92;im.data[o+1]=v*1.02;im.data[o+2]=v*1.1}
    im.data[o+3]=255;
  }
  x.putImageData(im,0,0);
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(90,60);t.anisotropy=4;return t;
}
function makeRockTex(){   // roche volcanique : basalte sombre vésiculaire (trous de gaz), fissures fines, éclats de cristaux ; teinte, relief et rugosité raccordables
  const N=512,H=new Float32Array(N*N),PT=new Float32Array(N*N);let sd=4321;const r=()=>{sd=(sd*16807)%2147483647;return sd/2147483647};
  const hs=(ix,iy,P)=>{ix=((ix%P)+P)%P;iy=((iy%P)+P)%P;let n=Math.imul(ix,374761393)+Math.imul(iy,668265263)+Math.imul(P,2246822519);n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967296};
  const vn=(x,y,P)=>{const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy);return(hs(ix,iy,P)*(1-u)+hs(ix+1,iy,P)*u)*(1-v)+(hs(ix,iy+1,P)*(1-u)+hs(ix+1,iy+1,P)*u)*v};
  const fb=(i,j,base,oc)=>{let a=.5,s=0,k=1;for(let o=0;o<oc;o++){s+=a*vn(i/N*base*k,j/N*base*k,base*k);a*=.5;k*=2}return s};
  const ss=(a,b,x)=>{x=Math.min(1,Math.max(0,(x-a)/(b-a)));return x*x*(3-2*x)};
  for(let k=0;k<700;k++){   // vésicules : petites cuvettes, rares quand elles sont grandes
    const px=r()*N,py=r()*N,rad=1.4+r()*r()*8,dp=.2+r()*.45;
    for(let dy=-Math.ceil(rad);dy<=Math.ceil(rad);dy++)for(let dx=-Math.ceil(rad);dx<=Math.ceil(rad);dx++){const d2=dx*dx+dy*dy;if(d2>rad*rad)continue;const x=((Math.floor(px)+dx)%N+N)%N,y=((Math.floor(py)+dy)%N+N)%N;PT[y*N+x]+=dp*(1-d2/(rad*rad))}
  }
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){
    const c=Math.abs(fb(i+37,j+11,3,4)-.5),crack=1-ss(0,.03,c);
    H[j*N+i]=fb(i,j,4,5)*.6+(fb(i+9,j+5,48,2)-.4)*.1-crack*.1-PT[j*N+i]*.7;
  }
  const mk=()=>{const c=document.createElement('canvas');c.width=c.height=N;return c},cm=mk(),cb=mk(),cr=mk(),xm=cm.getContext('2d'),xb=cb.getContext('2d'),xr=cr.getContext('2d');
  const im=xm.createImageData(N,N),ib=xb.createImageData(N,N),ir=xr.createImageData(N,N);
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){
    const o=j*N+i,g=(x,y)=>H[((y+N)%N)*N+((x+N)%N)],hh=Math.min(1,Math.max(0,H[o]*1.15+.12));
    const sh=Math.min(1.5,Math.max(.3,.66+3.4*((g(i-1,j)-g(i+1,j))+(g(i,j+1)-g(i,j-1)))*.5));   // ombrage cuit dans la teinte : lumière rasante du haut gauche
    const grain=.9+.2*vn(i*.9,j*.9,N);
    let R=(24+36*hh)*sh*grain,G=(26+38*hh)*sh*grain,B=(30+42*hh)*sh*grain;
    if(r()<.0022){const b=70+r()*80;R+=b*.7;G+=b*.8;B+=b}   // éclats de cristaux
    const p=o*4;im.data[p]=R;im.data[p+1]=G;im.data[p+2]=B;im.data[p+3]=255;
    const bv=Math.min(255,Math.max(0,H[o]*255*1.1+40));ib.data[p]=ib.data[p+1]=ib.data[p+2]=bv;ib.data[p+3]=255;
    const rv=255*(.97+(.78-.97)*Math.min(1,PT[o]*1.4));ir.data[p]=ir.data[p+1]=ir.data[p+2]=rv;ir.data[p+3]=255;
  }
  xm.putImageData(im,0,0);xb.putImageData(ib,0,0);xr.putImageData(ir,0,0);
  const T=c=>{const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t};
  return {map:T(cm),bump:T(cb),rough:T(cr)};
}
function makeGraniteTex(){   // granite alpin (bivouac) : grains de quartz, feldspath rosé et mica noir, fissures fines, plaques de lichen gris-vert et orangé ; teinte, relief et rugosité raccordables
  const N=512,H=new Float32Array(N*N),L=new Float32Array(N*N);let sd=2718;const r=()=>{sd=(sd*16807)%2147483647;return sd/2147483647};
  const hs=(ix,iy,P)=>{ix=((ix%P)+P)%P;iy=((iy%P)+P)%P;let n=Math.imul(ix,374761393)+Math.imul(iy,668265263)+Math.imul(P,2246822519);n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967296};
  const vn=(x,y,P)=>{const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy);return(hs(ix,iy,P)*(1-u)+hs(ix+1,iy,P)*u)*(1-v)+(hs(ix,iy+1,P)*(1-u)+hs(ix+1,iy+1,P)*u)*v};
  const fb=(i,j,base,oc)=>{let a=.5,s=0,k=1;for(let o=0;o<oc;o++){s+=a*vn(i/N*base*k,j/N*base*k,base*k);a*=.5;k*=2}return s};
  const ss=(a,b,x)=>{x=Math.min(1,Math.max(0,(x-a)/(b-a)));return x*x*(3-2*x)};
  const mk=()=>{const c=document.createElement('canvas');c.width=c.height=N;return c},cm=mk(),cb=mk(),cr=mk(),xm=cm.getContext('2d'),xb=cb.getContext('2d'),xr=cr.getContext('2d');
  const im=xm.createImageData(N,N),ib=xb.createImageData(N,N),ir=xr.createImageData(N,N),MIN=new Uint8Array(N*N);
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){
    const o=j*N+i,c=Math.abs(fb(i+53,j+17,3,4)-.5),crack=1-ss(0,.022,c);
    const g1=vn(i/4,j/4,N/4),g2=vn(i/3+40,j/3+9,Math.round(N/3));   // grains de 3 à 4 px
    MIN[o]=g1>.8?1:g1<.1?2:g2>.82?3:0;   // 1 quartz, 2 mica, 3 feldspath rosé, 0 fond gris
    const lm=ss(.6,.66,fb(i+101,j+7,5,4)+.12*(vn(i/6,j/6,Math.round(N/6))-.5));   // lichen : plaques à bord découpé
    L[o]=lm;H[o]=fb(i,j,4,5)*.55+(MIN[o]===1?.03:MIN[o]===2?-.02:0)-crack*.08+lm*.04;
  }
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){
    const o=j*N+i,g=(x,y)=>H[((y+N)%N)*N+((x+N)%N)],hh=Math.min(1,Math.max(0,H[o]*1.2+.05));
    const sh=Math.min(1.2,Math.max(.7,.9+2*((g(i-1,j)-g(i+1,j))+(g(i,j+1)-g(i,j-1)))*.5));   // ombrage cuit, léger : lumière rasante du haut gauche
    const tone=.82+.36*fb(i+5,j+300,2,3);
    let R=(96+44*hh)*tone,G=(92+42*hh)*tone,B=(86+40*hh)*tone;
    const m=MIN[o];if(m===1){R=G=B=170+30*hh;B+=6}else if(m===2){R=R*.6;G=G*.6;B=B*.62}else if(m===3){R=158*tone;G=136*tone;B=122*tone}
    const lm=L[o];if(lm>0){const orange=vn(i/24+7,j/24,Math.round(N/24))>.72,rim=1-ss(.2,.6,lm)*.35;   // lichen gris-vert, quelques taches orangées
      const lr=orange?196:168,lg=orange?122:176,lb=orange?48:142;R=R+(lr*rim-R)*lm*.85;G=G+(lg*rim-G)*lm*.85;B=B+(lb*rim-B)*lm*.85}
    const p=o*4;im.data[p]=R*sh;im.data[p+1]=G*sh;im.data[p+2]=B*sh;im.data[p+3]=255;
    const bv=Math.min(255,Math.max(0,H[o]*255*1.15+30));ib.data[p]=ib.data[p+1]=ib.data[p+2]=bv;ib.data[p+3]=255;
    const rv=255*(m===1?.62:m===2?.7:.9+.08*lm);ir.data[p]=ir.data[p+1]=ir.data[p+2]=rv;ir.data[p+3]=255;   // quartz et mica un peu brillants à la lueur du feu
  }
  xm.putImageData(im,0,0);xb.putImageData(ib,0,0);xr.putImageData(ir,0,0);
  const T=c=>{const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t};
  return {map:T(cm),bump:T(cb),rough:T(cr)};
}
function rockGeom(seed,ws=104,hs=68){   // pierre cassée : sphère irrégulière, base aplatie et enterrée, coupée par des plans de fracture, puis bruit fin ; normales lissées (arêtes usées), occlusion peinte en couleurs de sommets
  const g=new THREE.SphereGeometry(1,ws,hs),p=g.attributes.position;
  let sd=seed*9301+49297;const rnd=()=>{sd=(sd*16807)%2147483647;return sd/2147483647};
  const h3=(x,y,z)=>{const s=Math.sin(x*127.1+y*311.7+z*74.7+seed*13.1)*43758.5453;return s-Math.floor(s)};
  const n3=(x,y,z)=>{const ix=Math.floor(x),iy=Math.floor(y),iz=Math.floor(z),fx=x-ix,fy=y-iy,fz=z-iz,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy),w=fz*fz*(3-2*fz),L=(a,b,t)=>a+(b-a)*t;
    return L(L(L(h3(ix,iy,iz),h3(ix+1,iy,iz),u),L(h3(ix,iy+1,iz),h3(ix+1,iy+1,iz),u),v),L(L(h3(ix,iy,iz+1),h3(ix+1,iy,iz+1),u),L(h3(ix,iy+1,iz+1),h3(ix+1,iy+1,iz+1),u),v),w)};
  const planes=[];for(let k=0;k<16;k++){const a=rnd()*6.283,b=Math.acos(2*rnd()-1);planes.push([Math.sin(b)*Math.cos(a),Math.cos(b)*(k<4?.4:1),Math.sin(b)*Math.sin(a),k<8?.36+rnd()*.3:.62+rnd()*.26])}
  planes.forEach(q=>{const l=Math.hypot(q[0],q[1],q[2]);q[0]/=l;q[1]/=l;q[2]/=l});
  const col=new Float32Array(p.count*3),V=new THREE.Vector3();
  for(let i=0;i<p.count;i++){
    V.set(p.getX(i),p.getY(i),p.getZ(i));const r0=.9+.22*n3(V.x*1.3+3,V.y*1.3,V.z*1.3);V.multiplyScalar(r0);   // forme générale irrégulière
    V.y=Math.max(V.y,-.14);V.x*=1.1;
    for(const q of planes){const t=V.x*q[0]+V.y*q[1]+V.z*q[2];if(t>q[3]){const k=(t-q[3])*.985;V.x-=k*q[0];V.y-=k*q[1];V.z-=k*q[2]}}   // facettes de cassure
    V.y=Math.max(V.y,-.14);
    const f=.03*(n3(V.x*6+7,V.y*6,V.z*6)-.5)+.014*(n3(V.x*15,V.y*15+3,V.z*15)-.5);V.addScaledVector(V.clone().normalize(),f);
    p.setXYZ(i,V.x,V.y,V.z);
    const ao=.38+.62*Math.min(1,Math.max(0,(V.y+.14)/.62)),tone=.84+.3*n3(V.x*2.2+9,V.y*2.2,V.z*2.2),c=ao*tone;
    col[i*3]=c;col[i*3+1]=c*1.01;col[i*3+2]=c*1.05;
  }
  g.scale(1.5,1.5,1.5);   // les coupes enlèvent de la matière : on regonfle la pierre pour garder la taille voulue
  g.computeVertexNormals();g.setAttribute('color',new THREE.BufferAttribute(col,3));
  const nrm=g.attributes.normal,uv=g.attributes.uv;   // projection en boîte : la texture ne s'étire pas sur les pentes
  for(let i=0;i<p.count;i++){const ax=Math.abs(nrm.getX(i)),ay=Math.abs(nrm.getY(i)),az=Math.abs(nrm.getZ(i)),x=p.getX(i),y=p.getY(i),z=p.getZ(i);
    if(ay>=ax&&ay>=az)uv.setXY(i,x*1.1,z*1.1);else if(ax>=az)uv.setXY(i,z*1.1,y*1.1);else uv.setXY(i,x*1.1,y*1.1)}
  return g;
}
function makeShadowTex(){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d'),g=x.createRadialGradient(64,64,6,64,64,64);g.addColorStop(0,'rgba(0,0,0,.78)');g.addColorStop(.45,'rgba(0,0,0,.4)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,128,128);return new THREE.CanvasTexture(c)}
function mtnShape(u,d){   // massif : un sommet principal, des épaules, des crêtes qui s'abaissent vers l'avant
  const e=Math.pow(Math.min(1,d/.85),1.25);
  const P=[[-.08+.06*(d-.5),1,.2],[-.55+.06*(d-.5),.55,.2],[.4+.06*(.5-d),.62,.22],[.9,.4,.25],[-1,.3,.25],[0,.22,.9]];
  let h=0;for(const [bu,am,su] of P){const du=(u-bu)/su;h+=am*Math.exp(-du*du)}
  h*=.8+.2*Math.sin(u*23+d*9)*Math.sin(u*9-d*14);
  return Math.min(h,1)*e;
}
function sceneryCalc(){   // position de la montre pour qu'elle reste au point choisi de l'écran, caméra légèrement relevée
  const D=cam.position.z,sN=(.5-LAY.cy/LAY.H)*2,th=Math.atan(sN*Math.tan(15*Math.PI/180));
  const yD=D*Math.tan(th+PITCH);return {yD,s:vis/11.8,he:Math.max(0,FOOT-yD)};
}
function buildMountains(){
  if(!mtnGeo)return;
  const {s,he,yD}=sceneryCalc(),gy=yD-FOOT,asp=cam.aspect,tn=Math.tan(15*Math.PI/180),pos=mtnGeo.attributes.position.array;
  cam.updateMatrixWorld();
  // chaque sommet est placé par sa position à l'écran (le massif garde la même allure sur téléphone et sur ordinateur), puis ramené à sa profondeur
  const cp=cam.position,v=new THREE.Vector3(),dr=new THREE.Vector3(),kU=clamp(asp/1.6,.4,1),PK=.5;
  let k=0,hmax=1;
  for(let j=0;j<=MNZ;j++){
    const d=j/MNZ,zl=-(8+62*d),zw=zl*s;
    const yg=v.set(0,gy,zw).project(cam).y;   // horizon du sol à cette profondeur
    for(let i=0;i<=MNX;i++){
      const u=-MU0+2*MU0*i/MNX,h=mtnShape(u*kU,d);
      dr.set(u,yg+h*PK,.5).unproject(cam).sub(cp).normalize();
      const t=(zw-cp.z)/dr.z,px=cp.x+dr.x*t,hl=Math.max(0,(cp.y+dr.y*t-gy)/s);
      pos[k++]=px/s;pos[k++]=hl;pos[k++]=zl;if(hl>hmax)hmax=hl;
    }
  }
  mtnGeo.attributes.position.needsUpdate=true;mtnGeo.computeBoundingSphere();mtnMat.uniforms.uHmax.value=hmax;
  farRocks.forEach(m=>{const {u,dep,w}=(LAY.sx&&m.userData.alt)||m.userData,z=Math.min(20,22-(he/Math.tan(dep*Math.PI/180))/s),half=(22-z)*tn*asp,sx=w*half;   // placés à un angle de sol donné sous l'horizon, donc au premier plan quel que soit l'écran
    m.position.set(u*half,0,z);m.scale.set(sx,sx*.55,sx*.75)});   // taille et position en fraction de la largeur de l'écran
}

const NNX=110,NNZ=36,NEAR_DEP0=1.9,NEAR_DEP1=6.8;
function buildNear(){   // nappe de vagues en fil de fer qui passe DEVANT la montre : placée par l'angle de sol sous l'horizon, donc au premier plan quel que soit l'écran
  if(!nearGeo)return;
  const {s,he}=sceneryCalc(),asp=cam.aspect,tn=Math.tan(15*Math.PI/180),pos=nearGeo.attributes.position.array,hh=Math.max(he,.35);
  let k=0;
  for(let j=0;j<=NNZ;j++){
    const d=j/NNZ,zd=Math.min(20,22-(hh/Math.tan(lerp(NEAR_DEP0,NEAR_DEP1,d)*Math.PI/180))/s),z=Math.max(zd,lerp(1,3.5,d)),half=(22-z)*tn*asp*1.2;   // jamais derrière le plan de la montre : la nappe passe toujours devant elle
    for(let i=0;i<=NNX;i++){const u=-1+2*i/NNX;pos[k++]=u*half;pos[k++]=0;pos[k++]=z}
  }
  nearGeo.attributes.position.needsUpdate=true;nearGeo.computeBoundingSphere();
  const A=lerp(1.05,3.1,Math.pow(clamp((asp-.45)/1.15),.8));nearMat.uniforms.uA.value=A;nearMat.uniforms.uHm.value=A*1.1;
}
function buildScenery(){
  scenery=new THREE.Group();scene3.add(scenery);sceneryNear=new THREE.Group();scene3.add(sceneryNear);
  const gtx=gtxNight=makeGroundTex();gndMat=new THREE.MeshStandardMaterial({color:0x5A6770,map:gtx,bumpMap:gtx,bumpScale:1.2,roughness:.9,metalness:0,transparent:true});
  const gnd=new THREE.Mesh(new THREE.PlaneGeometry(400,260),gndMat);gnd.rotation.x=-Math.PI/2;gnd.position.set(0,0,-90);scenery.add(gnd);
  const rtx=makeRockTex();   // gros rochers : pierre cassée à normales lissées, texture de basalte, ombre de contact au sol
  rockMat=new THREE.MeshStandardMaterial({color:0xffffff,map:rtx.map,bumpMap:rtx.bump,bumpScale:.6,roughnessMap:rtx.rough,roughness:1,metalness:0,vertexColors:true,transparent:true});
  shadowMat=new THREE.MeshBasicMaterial({map:makeShadowTex(),transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
  const RGS=[1,2,3,4].map(s=>rockGeom(s)),shGeo=new THREE.PlaneGeometry(2,2);let ri=0;
  const mkRock=()=>{const m=new THREE.Mesh(RGS[ri++%RGS.length],rockMat),sh=new THREE.Mesh(shGeo,shadowMat);sh.rotation.x=-Math.PI/2;sh.position.y=-.02;sh.scale.set(1.35,1.35,1);sh.renderOrder=1;m.add(sh);return m};
  // gros rochers au premier plan (à l'échelle de l'écran), cailloux autour du bracelet (à l'échelle de la montre)
  [[-.9,9.5,.34,.4],[-.5,11,.2,1.2],[.85,10,.3,2.1],[1.02,7,.2,.7],[-1.05,6.5,.26,2.6],[.55,10.8,.14,1.6],[-.75,12,.3,.9],[.72,11.5,.28,2.2],[-.1,13.5,.22,1.9],[.4,10.2,.12,.5],[-.3,10.6,.12,2.4],[.2,11.6,.16,1.2]].forEach(([u,dep,w,r],i)=>{const m=mkRock();m.userData={u,dep,w,alt:FAR_ALT[i]};m.rotation.y=r;scenery.add(m);farRocks.push(m)});
  [[2.2,1.4,.5,.3,.4,.5,xs=>[1.9,3.4]],[-2.4,2.0,.4,.24,.35,1.9,xs=>[-(xs+2.4),2.0]],[3.6,-.2,.3,.2,.3,2.7,xs=>[xs+3.6,.6]],[-3.8,.4,.55,.32,.45,.2,xs=>[-(xs+3.8),.6]],[.8,2.8,.26,.16,.22,1.1]].forEach(([x,z,a,b,c,r,alt])=>{const m=mkRock();m.userData={b:[x,z],alt};nearRocks.push(m);m.position.set(x,0,z);m.scale.set(a,b,c);m.rotation.y=r;sceneryNear.add(m)});
  // éclairage du décor : rasant, cyan à gauche, cuivre à droite
  const c1=new THREE.PointLight(0x6FC6FF,.8,0);c1.position.set(-16,6,10);scenery.add(c1);
  const c2=new THREE.PointLight(0xE26D3B,.8,0);c2.position.set(16,4,10);scenery.add(c2);
  // massif : nappe en fil de fer lumineux
  mtnGeo=new THREE.BufferGeometry();
  const n=(MNX+1)*(MNZ+1),uv=new Float32Array(n*2),idx=[];let k=0;
  for(let j=0;j<=MNZ;j++)for(let i=0;i<=MNX;i++){uv[k++]=-MU0+2*MU0*i/MNX;uv[k++]=j/MNZ}
  for(let j=0;j<MNZ;j++)for(let i=0;i<MNX;i++){const a=j*(MNX+1)+i,b=a+1,c=a+MNX+1,d=c+1;idx.push(a,c,b,b,c,d)}
  mtnGeo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(n*3),3));mtnGeo.setAttribute('uv',new THREE.BufferAttribute(uv,2));mtnGeo.setIndex(idx);
  mtnMat=new THREE.ShaderMaterial({
    transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,extensions:{derivatives:true},
    uniforms:{uT:{value:0},uFade:{value:1},uHmax:{value:10},uK:{value:1},uCA:{value:new THREE.Color(0x8CCFE6)},uCB:{value:new THREE.Color(0xE26D3B)}},
    vertexShader:'varying vec2 vUv;varying float vH;varying float vZ;void main(){vUv=uv;vH=position.y;vZ=-position.z;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:'varying vec2 vUv;varying float vH;varying float vZ;uniform float uT;uniform float uFade;uniform float uHmax;uniform float uK;uniform vec3 uCA;uniform vec3 uCB;'+
      'float ln(float v){float w=fwidth(v);return 1.0-min(abs(fract(v-0.5)-0.5)/max(w,0.0001),1.0);}'+
      'void main(){float gu=ln(vUv.x/0.06);float gz=ln(vZ);float cont=ln(vH/1.1);float u01=clamp((vUv.x+1.35)/2.7,0.0,1.0);'+
      'vec3 col=mix(uCA,uCB,smoothstep(0.58,0.86,u01));float hn=clamp(vH/(uHmax*0.5),0.0,1.0);float slope=smoothstep(0.0,0.25,vH);'+
      'float a=(max(gu,gz)*1.0+cont*0.7)*slope+hn*0.11*smoothstep(0.0,0.2,hn);a*=0.8+0.2*sin(vZ*0.55-uT*1.3);a*=smoothstep(3.0,9.0,vZ)*(1.0-smoothstep(62.0,71.0,vZ));a*=1.0-smoothstep(1.15,1.35,abs(vUv.x));'+
      'col*=0.6+0.8*hn;gl_FragColor=vec4(col,a*uFade*0.62*uK);}'
  });
  const mtn=new THREE.Mesh(mtnGeo,mtnMat);mtn.frustumCulled=false;mtn.renderOrder=2;scenery.add(mtn);mtnMesh=mtn;
  // nappe de vagues du premier plan : elle revient devant la montre, en lignes teal qui virent au cuivre sur la droite
  nearGeo=new THREE.BufferGeometry();
  {const n=(NNX+1)*(NNZ+1),ud=new Float32Array(n*2),idx=[];let k=0;
   for(let j=0;j<=NNZ;j++)for(let i=0;i<=NNX;i++){ud[k++]=-1+2*i/NNX;ud[k++]=j/NNZ}
   for(let j=0;j<NNZ;j++)for(let i=0;i<NNX;i++){const a=j*(NNX+1)+i,b=a+1,c=a+NNX+1,d=c+1;idx.push(a,c,b,b,c,d)}
   nearGeo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(n*3),3));nearGeo.setAttribute('aUD',new THREE.BufferAttribute(ud,2));nearGeo.setIndex(idx);}
  nearMat=new THREE.ShaderMaterial({
    transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,extensions:{derivatives:true},
    uniforms:{uT:{value:0},uA:{value:.6},uHm:{value:.7},uFade:{value:1},uK:{value:1},uCa:{value:new THREE.Color(0x4FE3C1)},uCb:{value:new THREE.Color(0xE26D3B)},uDial:{value:new THREE.Vector3(0,0,1)}},
    vertexShader:'attribute vec2 aUD;uniform float uT;uniform float uA;varying vec2 vUD;varying float vH;varying vec2 vS;'+
      'void main(){float u=aUD.x,d=aUD.y;'+
      'float w=0.55*sin(u*3.1+d*5.0+uT*0.7)+0.35*sin(u*5.3-d*3.0-uT*0.5)+0.2*sin(u*9.0+d*8.0+uT*1.2);w+=0.55*exp(-pow((d-0.52-0.16*sin(u*2.0-uT*0.35))*4.2,2.0))*(0.7+0.3*cos(u*2.6+uT*0.3));'+
      'float env=smoothstep(1.25,0.7,abs(u))*pow(sin(3.14159*clamp(d,0.0,1.0)),0.8);'+
      'float h=max(0.0,w+0.2)*uA*env;vH=h;vUD=vec2(u*0.5+0.5,d);'+
      'vec4 c=projectionMatrix*modelViewMatrix*vec4(position+vec3(0.0,h,0.0),1.0);vS=c.xy/c.w;gl_Position=c;}',
    fragmentShader:'varying vec2 vUD;varying float vH;varying vec2 vS;uniform vec3 uCa;uniform vec3 uCb;uniform float uK;uniform float uHm;uniform float uFade;'+
      'uniform vec3 uDial;float ln(float v){float w=fwidth(v);return 1.0-min(abs(fract(v-0.5)-0.5)/max(w*1.7,0.0001),1.0);}'+
      'void main(){float lu=ln(vUD.x*34.0),ld=ln(vUD.y*26.0);float hn=clamp(vH/uHm,0.0,1.0);'+
      'float a=max(lu,ld)*(0.42+0.78*smoothstep(0.0,0.5,hn))+hn*0.16;'+
      'a*=smoothstep(0.0,0.12,vUD.y)*(1.0-smoothstep(0.86,1.0,vUD.y));a*=1.0-smoothstep(0.8,1.0,abs(vUD.x*2.0-1.0));'+
      'a*=smoothstep(-0.97,-0.68,vS.y);vec2 dq=(vS-uDial.xy)*vec2(uDial.z>0.0?1.0:1.0,1.0);a*=1.0-0.78*(1.0-smoothstep(0.82,1.08,length(vec2(dq.x*uDial.z,dq.y))));'+   // pas de lignes sur le pied de page
      'vec3 col=mix(uCa,uCb,smoothstep(0.55,0.95,vUD.x))*(0.65+0.7*hn);gl_FragColor=vec4(col,a*uFade*0.95*uK);}'
  });
  nearMesh=new THREE.Mesh(nearGeo,nearMat);nearMesh.frustumCulled=false;nearMesh.renderOrder=3;scenery.add(nearMesh);
}
function sizeThree(){
  sizeAurora();buildTopoBg();sizeWarp();PARC.resize();SHOE.resize();CAMP.resize();
  if(!THREE_OK){ return }
  const w=cv.clientWidth,h=cv.clientHeight;if(!w||!h)return;
  renderer.setSize(w,h,false);cam.aspect=w/h;
  vis=3.9*h/LAY.Rs;
  cam.position.set(0,0,vis/(2*Math.tan(THREE.MathUtils.degToRad(15))));cam.rotation.x=PITCH;
  cam.updateProjectionMatrix();buildMountains();buildNear();
  {const D0=cam.position.z,sc0=sceneryCalc().s;scene3.fog.near=D0+30*sc0;scene3.fog.far=D0+225*sc0}   // le sol se fond dans la nuit vers l'horizon
}
let nRot=0,nVel=0,lastTool=-1;
/* ---------- Préchargement : l'aiguille HTML (#preload) rejoint l'aiguille 3D ----------
   Avant le démarrage, l'aiguille HTML tourne seule au centre de l'écran. Quand la montre 3D apparaît, elle glisse du centre
   de l'écran au centre du cadran (PRE_TRAVEL s) en prenant peu à peu la matrice écran exacte de l'aiguille 3D (position,
   taille, rotation, perspective), qui reste masquée pendant le trajet. À l'arrivée, l'aiguille 3D réapparaît dessous et
   l'aiguille HTML s'efface : le relais est invisible.
   Écran de la corde ouvert au démarrage : il recouvre la montre pendant le chargement, l'aiguille HTML n'apparaît pas. */
const preEl=document.querySelector('#preload .pre-needle'),preBox=document.getElementById('preload'),_preV=new THREE.Vector3();
const PRE_TRAVEL=reduce?0:.9,PRE_S0=.46;   // durée du trajet ; échelle de l'aiguille HTML au centre (CSS .pre-needle)
let preT0=-1;
function preAngle(){   // angle écran (sens horaire, CSS) de l'aiguille HTML -> rotation de l'aiguille 3D (sens anti-horaire)
  const m=/matrix\(([^)]+)\)/.exec(getComputedStyle(preEl).transform||'');if(!m)return 0;
  const v=m[1].split(',').map(Number);return -Math.atan2(v[1],v[0]);
}
const preTraveling=()=>preT0>=0&&tNow-preT0<PRE_TRAVEL;   // aiguille HTML en route vers le cadran : l'aiguille 3D attend
function preEnd(){if(!preEl||preT0===-2)return;preEl.classList.remove('sync');preBox.classList.add('fade','done');preT0=-2}
function preSync(){
  if(!preEl||preT0===-2)return;
  if(preT0===-1){
    if(!root.classList.contains('gate-seen')||root.classList.contains('gate-on')){preBox.classList.add('done');preT0=-2;return}
    preT0=tNow;preEl.classList.add('sync');preBox.classList.add('go');
  }
  const t=tNow-preT0;
  if(t>PRE_TRAVEL+.05)preBox.classList.add('fade');   // arrivée : l'aiguille 3D est visible dessous, l'aiguille HTML s'efface
  if(t>PRE_TRAVEL+.6){preEl.classList.remove('sync');preBox.classList.add('done');preT0=-2;return}
  needle.updateWorldMatrix(true,false);cam.updateMatrixWorld();
  const r=cv.getBoundingClientRect(),P=(x,y)=>{_preV.set(x,y,0);needle.localToWorld(_preV);_preV.project(cam);return[r.left+(_preV.x*.5+.5)*r.width,r.top+(.5-_preV.y*.5)*r.height]};
  const O=P(0,0),X=P(.01,0),Y=P(0,-.01);   // 1 unité du dessin SVG = 0,01 de l'espace de l'aiguille ; le dessin a son pivot en (12 px, 38 px)
  const k=PRE_TRAVEL?clamp(t/PRE_TRAVEL):1,e=k*k*(3-2*k);
  const f=lerp(PRE_S0/Math.max(1e-3,Math.hypot(X[0]-O[0],X[1]-O[1])),1,e);   // taille : celle du centre de l'écran -> celle du cadran
  const ox=lerp(innerWidth/2,O[0],e),oy=lerp(innerHeight/2,O[1],e);   // pivot : centre de l'écran -> centre du cadran
  preEl.style.transform=`matrix(${(X[0]-O[0])*f},${(X[1]-O[1])*f},${(Y[0]-O[0])*f},${(Y[1]-O[1])*f},${ox-12},${oy-38})`;
}
let lastSpx=-1e9;const DIAL={r:0,cx:0,cy:0};   // rayon et centre du cadran à l'écran (px CSS), pour caler la carte sur les lignes du verre
const tiltS={x:0,y:0,vx:0,vy:0};let lastBlinkOn=false;const MAP_LINE=new THREE.Color(0xE26D3B);
function updateCompass(p,dt){
  if(!THREE_OK)return;
  if(preT0===-1&&preEl)nRot=preAngle();   // l'aiguille 3D repart de l'angle où se trouvait l'aiguille HTML
  const tools=p>=CS&&p<.25;
  let target=0;
  if(tools){
    const idx=clamp(Math.floor((p-CS)/CST),0,TOOLS.length-1);target=-TOOLS[idx].a*Math.PI/180;
    if(idx!==lastTool){lastTool=idx;tick();haptic(8)}
  }else{
    lastTool=-1;
    if(p<.24||p>.95){
      if(orient.on&&orient.heading!=null)target=orient.heading*Math.PI/180;
      else if(tNow-ptr.t<4&&!paused)target=-Math.atan2(ptr.x-(DIAL.r>5?DIAL.cx:LAY.cx),-(ptr.y-(DIAL.r>5?DIAL.cy:LAY.cy)));
    }
  }
  if(aimKey&&HOT[aimKey])target=-HOT[aimKey].b*Math.PI/180;
  else if(toolAim>=0&&TOOLS[toolAim])target=-TOOLS[toolAim].a*Math.PI/180;
  if(!loaded){   // vitesse : part de celle de l'aiguille HTML (2π/1,7 s) puis monte en douceur vers celle du chargement (pas de coup d'accélérateur au relais)
    const k=preT0===-2?1:preT0<0?0:clamp((tNow-preT0)/.9,0,1),e=k*k*(3-2*k);
    nRot+=dt*(3.7+(11+Math.sin(tNow*3)*4-3.7)*e)}
  else{
    const k=110,c=9;nVel+=(-k*(nRot-target)-c*nVel)*dt;nRot+=nVel*dt;
  }
  needle.rotation.z=nRot+(loaded&&!paused?Math.sin(tNow*2.1)*.018:0);
  drawReadout(((-needle.rotation.z*180/Math.PI)%360+360)%360);
  const zi=sm(.2,.30,p),scl=p<.5?lerp(1,4.6,zi):lerp(4.6,1,sm(.95,1,p));
  const sc=sceneryCalc();stand.scale.setScalar(scl);stand.position.y=sc.yD-FOOT*scl;
  const hk=LAY.sx?(staticMode?1:(p<.5?1-sm(.075,.12,p):0)):0;const hk2=LAY.sx&&!staticMode&&p<.5?sm(.09,.125,p)*(1-sm(.17,.21,p)):0;stand.position.x=(hk-hk2)*LAY.sx/(LAY.W||1)*vis*cam.aspect;   // « S'équiper » (grand écran) : la montre passe de l'autre côté (à gauche), le texte est à droite ; elle revient au centre avant le zoom
     // accueil large : la montre est à droite et le texte à gauche dès l'arrivée ; elle passe à gauche pour « S'équiper », puis revient au centre avant le zoom
    // le centre du cadran reste fixe pendant le zoom
  scenery.position.y=sceneryNear.position.y=sc.yD-FOOT;scenery.scale.setScalar(sc.s);
  // l'accueil se fond dans la carte : le sol et les rochers s'effacent d'abord, le massif se couche pour devenir le quadrillage de la carte (et prend sa teinte cuivre), l'aurore s'éteint en virant au cuivre
  const fG=p<.5?1-sm(.10,.24,p):sm(.96,1,p),fM=p<.5?1-sm(.20,.30,p):sm(.96,1,p),kf=p<.5?sm(.10,.28,p):0;
  const calm=theme==='light'?1:(p<.5?lerp(.18,1,sm(.05,.13,p)):.18),fC=fM*calm;   // jour : les montagnes sont pleinement visibles dès le début de la boucle   // premier écran : crêtes atténuées, la montre est en vedette ; intensité pleine dès « S'équiper »
  mtnMesh.scale.y=lerp(1,.03,kf);
  if(nearMesh){nearMesh.scale.y=lerp(1,.03,kf);nearMat.uniforms.uFade.value=fC;nearMat.uniforms.uT.value=paused?0:tNow*.4;/* ondulation de la nappe : 2,5 fois plus lente */nearMesh.visible=QC.tier<2&&fM>.01;{const W=LAY.W||1,H=LAY.H||1,r=DIAL.r>5?DIAL.r:LAY.Rs*1.15;nearMat.uniforms.uDial.value.set(((DIAL.r>5?DIAL.cx:LAY.cx)/W)*2-1,1-((DIAL.r>5?DIAL.cy:LAY.cy)/H)*2,(W/H)/((r/H)*2)*(1/ (W/H)))}}   // la nappe du premier plan se couche elle aussi en quadrillage de cartemtnMat.uniforms.uCA.value.setHex(0x8CCFE6).lerp(MAP_LINE,Math.min(1,kf*1.25));
  auroraK=(p<.5?1-.97*sm(.14,.30,p):1)*(theme==='light'?0:1);auroraW=p<.5?sm(.12,.26,p):0;
  if(sceneLt!==(theme==='light')){   // mode jour : lignes du relief sombres en mélange normal (le mélange additif les rend invisibles sur fond clair)
    sceneLt=theme==='light';const L=sceneLt;mtnMat.blending=nearMat.blending=L?THREE.NormalBlending:THREE.AdditiveBlending;
    mtnMat.uniforms.uCA.value.set(L?0x27465C:0x8CCFE6);mtnMat.uniforms.uCB.value.set(L?0x8A3A18:0xE26D3B);mtnMat.uniforms.uK.value=nearMat.uniforms.uK.value=L?.95:1;   // jour : filaire foncé (ardoise à gauche, cuivre brûlé à droite) pour bien se détacher du ciel clair
    nearMat.uniforms.uCa.value.set(L?0x27465C:0x4FE3C1);nearMat.uniforms.uCb.value.set(L?0x8A3A18:0xE26D3B);mtnMat.needsUpdate=nearMat.needsUpdate=true;
    // sol : dalles de sable clair le jour (pierre bleutée la nuit), brume claire à l'horizon au lieu de la nuit
    if(L&&!gtxDay)gtxDay=makeGroundTex(true);
    gndMat.map=gndMat.bumpMap=L?gtxDay:gtxNight;gndMat.color.setHex(L?0xFFFFFF:0x5A6770);gndMat.needsUpdate=true;scene3.fog.color.setHex(L?0xD8E0E4:0x050811)}
  {const sk=theme==='light'?+fG.toFixed(2):0;if(sk!==skyK){skyK=sk;document.documentElement.style.setProperty('--sky',String(sk))}}   // ciel du mode jour (dégradé CSS), fondu avec le sol
  mtnMat.uniforms.uT.value=tNow;mtnMat.uniforms.uFade.value=fC;gndMat.opacity=rockMat.opacity=fG;shadowMat.opacity=.85*fG;scenery.visible=sceneryNear.visible=Math.max(fG,fM)>.01;
  const sw=paused?0:1;
  // ressort amorti : le boîtier a du poids, il suit le curseur avec un léger retard et un petit rebond
  {const k=38,c=9,mxv=reduce?0:mx,myv=reduce?0:my;tiltS.vx+=((mxv-tiltS.x)*k-tiltS.vx*c)*dt;tiltS.vy+=((myv-tiltS.y)*k-tiltS.vy*c)*dt;tiltS.x+=tiltS.vx*dt;tiltS.y+=tiltS.vy*dt}
  /* Orbite : la caméra semble tourner autour de la montre (souris, défilement, balancement lent) ; face au visiteur pendant le zoom */
  const pc=p>.5?0:p,face=p<.5?1-sm(.22,.30,p):sm(.95,1,p);   // fin de boucle = début (mêmes angles)
  stand.rotation.x=(-.1+Math.sin(tNow*.8)*.03*sw)*face+tiltS.y*.2*face;
  stand.rotation.y=(Math.sin(tNow*.55)*.1*sw*(1-sm(.05,.2,pc)*.7)+tiltS.x*.6+Math.sin(pc*11)*.14-.42*hk+.42*hk2)*face;   // -.42 rad : vue de trois quarts, cadran tourné vers le texte
  {const xs=LAY.sx?LAY.sx/(LAY.W||1)*vis*cam.aspect:0;   // grand écran : les cailloux restent posés au sol, mais ceux qui gêneraient le passage de la montre sont déplacés hors de son couloir (de x = 0 à x = xs)
   nearRocks.forEach((m,k)=>{const b=m.userData.b,a=xs&&m.userData.alt?m.userData.alt(xs):b;m.position.x=a[0];m.position.z=a[1]})}
  if(strapLow){   // le bracelet repose sur le sol : on relève la montre de ce que l'inclinaison ferait entrer sous le sol
    const ca=Math.cos(stand.rotation.x),sa=Math.sin(stand.rotation.x),cb=Math.cos(stand.rotation.y),sb=Math.sin(stand.rotation.y);let m=0;
    for(let i=0;i<strapLow.length;i++){const q=strapLow[i],zz=q.z*cb-q.x*sb,yy=(q.y+FOOT)*ca-zz*sa;if(yy<m)m=yy}
    stand.position.y-=m*scl}
  // métamorphose : les aiguilles s'effacent, les données du cadran se dilatent en relief topographique
  const nf=p<.5?1-sm(.29,.33,p):sm(.96,1,p),tf=p<.5?sm(.19,.26,p):1-sm(.96,1,p);
  const tw=transW(p),bk=needleBlink(tNow),no=nf*(1-tw*(1-bk));   // pendant la transition, l'aiguille reste visible et clignote : c'est elle qui fait le halo
  NDL.w=nf;   // la carte ne recopie l'aiguille du cadran que tant qu'elle est visible
  needle.children.forEach(m=>{m.material.opacity=no});needle.visible=no>.01&&!preTraveling();needle.scale.setScalar(1+.4*(1-nf)+tw*.18*bk);   // elle grandit autour de son pivot, posé sur le départ de la trace : en grandissant, elle recouvre un peu plus la trace
  {const on=tw>.2&&bk>.5;if(on&&!lastBlinkOn&&!paused&&!reduce)tickSoft();lastBlinkOn=on}
  roMesh.material.opacity=p<.5?1-sm(.17,.22,p):sm(.96,1,p);
  topoMesh.material.opacity=tf;topoMesh.visible=tf>.01;
  const zz=lerp(1,.55,tf);topoTex.repeat.set(zz,zz);topoTex.offset.set((1-zz)/2,(1-zz)/2);
  // franchissement du verre : clic, souffle, vibration
  const into=p>.21&&p<.5;if(lastInto!==null&&into&&!lastInto){tick();swoosh();haptic([10,40,16])}lastInto=into;
  {stand.updateMatrixWorld(true);const e=new THREE.Vector3(1.98,0,.053),c0=new THREE.Vector3(0,0,.053);group.localToWorld(e);group.localToWorld(c0);e.project(cam);c0.project(cam);
   DIAL.r=Math.abs(e.x-c0.x)*LAY.W/2;DIAL.cx=(c0.x*.5+.5)*LAY.W;DIAL.cy=(.5-c0.y*.5)*LAY.H;
   if(LAY.sx&&Math.abs(DIAL.cx-lastSpx)>1){lastSpx=DIAL.cx;const sp=$('#spot');sp.style.setProperty('--spx',DIAL.cx.toFixed(0)+'px')}
   e.set(0,.38,0);c0.set(0,0,0);needle.updateWorldMatrix(true,false);needle.localToWorld(e);needle.localToWorld(c0);e.project(cam);c0.project(cam);
   NDL.tip[0]=(e.x*.5+.5)*LAY.W;NDL.tip[1]=(.5-e.y*.5)*LAY.H;NDL.piv[0]=(c0.x*.5+.5)*LAY.W;NDL.piv[1]=(.5-c0.y*.5)*LAY.H;NDL.ok=true}
  renderer.render(scene3,cam);
  preSync();
  placeHot(p);
}

/* ---------- Carte ---------- */
const ringsG=$('#rings'),trace=$('#trace'),halo=$('#halo'),you=$('#you'),pathBase=$('#pathBase'),mapSvg=$('#mapSvg');
const ringsLitG=$('#ringsLit'),pool=$('#pool'),maskC=$('#maskC'),beamG=$('#beamGlow'),beamC=$('#beamCore');
const LIT=!(('ontouchstart' in window||navigator.maxTouchPoints>0)&&(navigator.hardwareConcurrency||4)<6);
const mk4=[0,1,2,3].map(i=>$('#mk'+i));
function catmull(P){
  let d=`M${P[0][0].toFixed(1)} ${P[0][1].toFixed(1)}`;
  for(let i=0;i<P.length-1;i++){
    const p0=P[i-1]||P[i],p1=P[i],p2=P[i+1],p3=P[i+2]||p2;
    const c1=[p1[0]+(p2[0]-p0[0])/6,p1[1]+(p2[1]-p0[1])/6],c2=[p2[0]-(p3[0]-p1[0])/6,p2[1]-(p3[1]-p1[1])/6];
    d+=` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)},${c2[0].toFixed(1)} ${c2[1].toFixed(1)},${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}
/* Courbes de niveau : lignes d'isovaleur d'un relief (somme de collines), calculées par
   marching squares. Deux courbes ne peuvent donc jamais se croiser ni se chevaucher. */
function drawContours(W,H,portrait){
  ringsG.innerHTML='';ringsLitG.innerHTML='';
  const sc=Math.min(W,H)/(portrait?620:800)*1.1;
  const cell=Math.max(8,Math.round(Math.min(W,H)/50));
  const MX=.6*W,MY=.6*H,X0=-MX,Y0=-MY;
  const nx=Math.ceil((W+2*MX)/cell)+1,ny=Math.ceil((H+2*MY)/cell)+1;
  const P=[[WPX[0][0],WPX[0][1],1,170],[WPX[1][0],WPX[1][1],.62,150],[WPX[2][0],WPX[2][1],.78,160],[.9*W,.14*H,.5,130],[.25*W,.16*H,.42,110],[.6*W,.9*H,.46,120],[-.3*W,.5*H,.5,150],[1.3*W,.4*H,.55,150],[.5*W,-.3*H,.45,140],[.5*W,1.3*H,.5,150],[1.25*W,1.25*H,.4,130],[-.25*W,-.25*H,.4,130]];
  const f=new Float32Array(nx*ny);
  for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){
    const x=X0+i*cell,y=Y0+j*cell;let h=0;
    for(const [px,py,a,sg] of P){const dx=(x-px)/1.25,dy=y-py,s2=sg*sc;h+=a*Math.exp(-(dx*dx+dy*dy)/(2*s2*s2))}
    h+=.05*Math.sin(x/(70*sc)+1.3)*Math.sin(y/(60*sc)+.4);
    f[j*nx+i]=h;
  }
  const NS='http://www.w3.org/2000/svg';
  for(let li=0;li<14;li++){
    const L=.08+li*.07;let d='';
    const it=(v0,v1)=>(L-v0)/(v1-v0);
    for(let j=0;j<ny-1;j++)for(let i=0;i<nx-1;i++){
      const a=f[j*nx+i],b=f[j*nx+i+1],c=f[(j+1)*nx+i+1],dd=f[(j+1)*nx+i];
      const k=(a>L?8:0)|(b>L?4:0)|(c>L?2:0)|(dd>L?1:0);
      if(k===0||k===15)continue;
      const x0=X0+i*cell,y0=Y0+j*cell;
      const T=[x0+it(a,b)*cell,y0],R=[x0+cell,y0+it(b,c)*cell],B=[x0+it(dd,c)*cell,y0+cell],Lf=[x0,y0+it(a,dd)*cell];
      const segs={1:[[Lf,B]],2:[[B,R]],3:[[Lf,R]],4:[[T,R]],5:[[T,Lf],[B,R]],6:[[T,B]],7:[[T,Lf]],8:[[T,Lf]],9:[[T,B]],10:[[T,R],[Lf,B]],11:[[T,R]],12:[[Lf,R]],13:[[B,R]],14:[[Lf,B]]}[k];
      for(const [p,q] of segs)d+=`M${p[0].toFixed(1)} ${p[1].toFixed(1)}L${q[0].toFixed(1)} ${q[1].toFixed(1)}`;
    }
    if(!d)continue;
    const p=document.createElementNS(NS,'path');p.setAttribute('d',d);p.setAttribute('class','ring'+(li%5===4?' m':''));ringsG.appendChild(p);
    if(LIT){const p2=p.cloneNode();p2.setAttribute('class','ringlit'+(li%5===4?' m':''));ringsLitG.appendChild(p2)}
  }
}
let LEN=1,WPX=[],WPF=[0,.3,.7,1],mapKey='',MW=1,MH=1;
const world=$('#world');
/* La carte est dessinée aux dimensions réelles de l'écran : tous les points restent visibles,
   en portrait (zigzag vertical) comme en paysage (diagonale). */
function buildMap(){
  const W=S[1].clientWidth,H=S[1].clientHeight;if(!W||!H)return;
  const key=W+'x'+H;if(key===mapKey)return;mapKey=key;
  mapSvg.setAttribute('viewBox',`0 0 ${W} ${H}`);MW=W;MH=H;
  const portrait=W<900;
  const F=portrait?[[.22,.31],[.76,.43],[.26,.57],[.70,.70]]:[[.15,.70],[.43,.31],[.75,.65],[.90,.875]];
  WPX=F.map(([a,b])=>[a*W,b*H]);
  const d=catmull(WPX);[pathBase,halo,trace,beamG,beamC].forEach(p=>p.setAttribute('d',d));
    LEN=trace.getTotalLength();trace.style.strokeDasharray=halo.style.strokeDasharray=LEN;
  WPF=WPX.map(([x,y])=>{let best=0,bd=1e9;for(let L=0;L<=LEN;L+=3){const q=trace.getPointAtLength(L);const dd=(q.x-x)**2+(q.y-y)**2;if(dd<bd){bd=dd;best=L}}return best/LEN});
  drawContours(W,H,portrait);
}
const cards=[$('#c0'),$('#c1'),$('#c2')], marks=[mk4[0],mk4[1],mk4[2]];
function placeCards(){
  if(isMobile()){cards.forEach(c=>{c.style.left='';c.style.top='';c.classList.remove('off')});return}
  const sr=S[1].getBoundingClientRect();
  const off=[[34,-70],[-150,40],[-320,36]];
  cards.forEach((c,i)=>{
    const r=marks[i].getBoundingClientRect();
    const out=r.right<sr.left+20||r.left>sr.right-20||r.bottom<sr.top+80||r.top>sr.bottom-20;
    c.classList.toggle('off',out);
    const cw=c.offsetWidth||280,ch=c.offsetHeight||110;
    let l=r.left+r.width/2+off[i][0]-sr.left,t=r.top+r.height/2+off[i][1]-sr.top;
    l=clamp(l,12,sr.width-cw-12);t=clamp(t,150,sr.height-ch-60);
    c.style.left=l+'px';c.style.top=t+'px';
  });
}
/* Caméra immersive : la carte est plus grande que l'écran ; elle suit la boule « vous êtes ici »,
   zoome à chaque étape (vue carte, le temps de lire), dézoome entre deux (vol),
   se penche légèrement dans les virages, puis révèle toute la trace à la fin. */
let lastCur=-1;
function updateMap(p,forceD){
  const d=forceD!==undefined?forceD:clamp((p-.31)/.18);
  const tilt=forceD!==undefined?0:56*(1-sm(.29,.37,p));   // vue en perspective de chemin, qui se redresse en vue carte
  mapSvg.style.transform=`perspective(1100px) rotateX(${tilt.toFixed(1)}deg)`;S[1].style.setProperty('--fog',(tilt/56).toFixed(2));
  const off=LEN*(1-d);trace.style.strokeDashoffset=off;halo.style.strokeDashoffset=off;
  const q=trace.getPointAtLength(LEN*d),q1=trace.getPointAtLength(LEN*clamp(d+.015)),q0=trace.getPointAtLength(LEN*clamp(d-.015));
  const ang=Math.atan2(q1.y-q0.y,q1.x-q0.x);
  const prox=Math.min(Math.abs(d-WPF[0]),Math.abs(d-WPF[1]),Math.abs(d-WPF[2]));
  const mob=isMobile();
  let z=lerp(mob?2.1:1.6,mob?1.35:1.2,sm(.03,.15,prox));
  const ov=sm(.9,1,d);
  z=lerp(z,1,ov);
  const tx=lerp(q.x,MW/2,ov),ty=lerp(q.y,MH/2,ov);
  const rot=lerp(-.25*Math.sin(ang),0,ov);
  world.setAttribute('transform',`translate(${MW/2} ${MH*lerp(.47,.5,ov)}) rotate(${(rot*57.2958).toFixed(2)}) scale(${z.toFixed(3)}) translate(${(-tx).toFixed(1)} ${(-ty).toFixed(1)})`);
  mapSvg.style.setProperty('--z',z.toFixed(3));
  /* Balayage de lumière : la boule éclaire la trace derrière elle et fait surgir les courbes de niveau autour d'elle */
  const pos=LEN*d,Lh=Math.min(pos,LEN*.10*(1+(paused||reduce?0:.14*Math.sin(tNow*3)))),lit=1-ov;
  [beamG,beamC].forEach(b=>{b.style.strokeDasharray=`${Lh.toFixed(1)} ${LEN.toFixed(1)}`;b.style.strokeDashoffset=(-(pos-Lh)).toFixed(1);b.style.opacity=(lit*(b===beamG?.9:1)).toFixed(2)});
  const R=(200/z)*(1-.92*ov);
  maskC.setAttribute('cx',q.x.toFixed(1));maskC.setAttribute('cy',q.y.toFixed(1));maskC.setAttribute('r',R.toFixed(1));
  pool.setAttribute('cx',q.x.toFixed(1));pool.setAttribute('cy',q.y.toFixed(1));pool.setAttribute('r',(250/z*(1-ov)+1).toFixed(1));
  WPX.forEach((pt,i)=>mk4[i].setAttribute('transform',`translate(${pt[0].toFixed(1)} ${pt[1].toFixed(1)}) scale(${(1/z).toFixed(3)})`));
  you.setAttribute('transform',`translate(${q.x.toFixed(1)} ${q.y.toFixed(1)}) scale(${(1/z).toFixed(3)})`);
  let cur=0;
  cards.forEach((c,i)=>{const on=d>=WPF[i]-.005;c.classList.toggle('revealed',on);if(on)cur=i});
  cards.forEach((c,i)=>c.classList.toggle('current',i===cur));
  if(cur!==lastCur){if(lastCur>=0&&cur>lastCur){haptic(18);tick()}lastCur=cur}
  placeCards();
  return d;
}

/* ---------- Paire de chaussures de trail 3D, eau en 3D, éclaboussures de particules ---------- */
const SHOE=(()=>{
  if(!THREE_OK)return {ready:()=>false,ensure(){},update(){},resize(){},impactScreen(){},rippleScreen(){},pointer(){},cursor(){},rainRipple(){},layoutZones(){},setQuality(){},dispose(){}};
  const cv=$('#shoeCanvas');
  let topoSpr=null,dayK=0,renderer,scene,cam,ray,gmat,pair,shoes=[],mirrors=[],pGeo,pPos,pSize,pAl,pMat,inv=[],hemiL,keyL,rimL,ok=false,failed=false;
  const pl=new THREE.Plane(new THREE.Vector3(0,1,0),0),RIP=[],PARTS=[],NP=320,RX=4.6,RZ=2.6;
  const ripBuf=new Float32Array(32),prevU=[0,0],ptrV=new THREE.Vector3(0,0,0),ptrT=new THREE.Vector3(0,0,0);   // uPtr : x, z du pointeur sur l'eau et force (0..1)
  const tmpV=new THREE.Vector3(),tmpQ=new THREE.Quaternion(),lampP=[new THREE.Vector3(0,1.2,0),new THREE.Vector3(0,1.2,0)],lampD=[new THREE.Vector3(1,-.3,0),new THREE.Vector3(1,-.3,0)];let lampL=[];
  let sway={x:0,y:0};
  /* --- textures --- */
  function hexTex(){
    const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');
    x.fillStyle='#2A394A';x.fillRect(0,0,256,256);
    const r=22,h=r*Math.sqrt(3);x.strokeStyle='rgba(130,170,200,.42)';x.lineWidth=2.6;
    for(let row=-1;row<256/h+1;row++)for(let col=-1;col<256/(1.5*r)+1;col++){
      const cx=col*1.5*r,cy=row*h+(col%2?h/2:0);x.beginPath();
      for(let i=0;i<6;i++){const a=Math.PI/3*i;x.lineTo(cx+r*Math.cos(a),cy+r*Math.sin(a))}x.closePath();
      x.fillStyle='rgba(16,26,38,'+(.25+((row*7+col*13)%5)*.06)+')';x.fill();x.stroke();
    }
    const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(1/.7,1/.7);t.anisotropy=4;return t;
  }
  function makeEnvS(){
    const mk=(a,b,boxes)=>{const k=document.createElement('canvas');k.width=k.height=64;const x=k.getContext('2d'),g=x.createLinearGradient(0,0,0,64);g.addColorStop(0,a);g.addColorStop(1,b);x.fillStyle=g;x.fillRect(0,0,64,64);(boxes||[]).forEach(([bx,by,bw,bh,col])=>{x.fillStyle=col;x.fillRect(bx,by,bw,bh)});return k};
    const t=new THREE.CubeTexture([mk('#3A2A28','#0A0C10',[[26,0,8,64,'rgba(255,190,140,.7)']]),mk('#1E2A3C','#080A0E',[[15,0,6,64,'rgba(170,200,255,.8)']]),mk('#9FB4D0','#10151C',[[12,14,40,12,'rgba(235,245,255,.95)']]),mk('#050607','#080A0C'),mk('#2A3544','#0A0D12'),mk('#10151C','#05070A')]);
    t.needsUpdate=true;return t;
  }
  function evaTex(){   // mousse EVA de semelle : fin grain mat, sans strates
    const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');x.fillStyle='#808080';x.fillRect(0,0,128,128);
    let sd=11;const rn=()=>{sd=(sd*16807)%2147483647;return sd/2147483647};
    for(let k=0;k<2600;k++){const v=rn()>.5?255:0;x.fillStyle='rgba('+v+','+v+','+v+','+(.08+rn()*.14)+')';x.beginPath();x.arc(rn()*128,rn()*128,.5+rn()*1.1,0,6.283);x.fill()}
    const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(4,4);return t;
  }
  /* ====== Chaussure de trail, d'après la Salomon Genesis / Ultra Glide (photos de référence) ======
     tige svelte en mesh tricoté très fin, renforts thermocollés sombres autour des passants, languette séparée plus haute que le col,
     col fin noir, laçage rapide type Quicklace (passants textiles, lacet fin, bloqueur plastique), semelle sculptée en mousse injectée,
     bande de gomme ondulée et crampons angulaires profonds visibles de profil.
     Couleurs regroupées dans COL : on peut les passer dans la palette du site sans toucher à la géométrie. */
  function heightNormalTex(cv,str,rx,ry){   // normal map (Sobel) calculée à partir d'une image de relief : blanc = haut
    const S=cv.width,d=cv.getContext('2d').getImageData(0,0,S,S).data,H=(u,v)=>d[(((v+S)%S)*S+((u+S)%S))*4]/255;
    const n=document.createElement('canvas');n.width=n.height=S;const nx=n.getContext('2d'),nd=nx.createImageData(S,S);
    for(let v=0;v<S;v++)for(let u=0;u<S;u++){const dx=(H(u+1,v)-H(u-1,v))*str,dy=(H(u,v+1)-H(u,v-1))*str,l=Math.hypot(dx,dy,1),k=(v*S+u)*4;
      nd.data[k]=(-dx/l*.5+.5)*255;nd.data[k+1]=(dy/l*.5+.5)*255;nd.data[k+2]=(1/l*.5+.5)*255;nd.data[k+3]=255}
    nx.putImageData(nd,0,0);const t=new THREE.CanvasTexture(n);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;t.repeat.set(rx,ry);return t;
  }
  function weaveCanvases(){   // mesh tricoté fin : côtes serrées, micro-alvéoles en quinconce, fibres (couleur + relief)
    const S=256,col=document.createElement('canvas'),rel=document.createElement('canvas');col.width=col.height=rel.width=rel.height=S;
    const c=col.getContext('2d'),r=rel.getContext('2d');c.fillStyle='#E9E0CB';c.fillRect(0,0,S,S);r.fillStyle='#9c9c9c';r.fillRect(0,0,S,S);
    for(let y=0;y<S;y+=2){c.fillStyle=y%4?'rgba(255,250,236,.12)':'rgba(120,106,80,.10)';c.fillRect(0,y,S,1);r.fillStyle=y%4?'#b8b8b8':'#7c7c7c';r.fillRect(0,y,S,1)}
    const p=8;for(let j=0;j<S/p+1;j++)for(let i=0;i<S/p+1;i++){const cx=i*p+(j%2?p/2:0),cy=j*p;
      c.fillStyle='rgba(150,134,104,.30)';c.beginPath();c.arc(cx,cy,1.5,0,6.283);c.fill();r.fillStyle='#2c2c2c';r.beginPath();r.arc(cx,cy,1.7,0,6.283);r.fill()}
    let sd=5;const rn=()=>{sd=(sd*16807)%2147483647;return sd/2147483647};
    for(let k=0;k<1400;k++){const x0=rn()*S,y0=rn()*S,l=1.5+rn()*3,v=rn()>.5;c.strokeStyle=v?'rgba(255,252,242,.16)':'rgba(110,96,70,.14)';c.lineWidth=.6;c.beginPath();c.moveTo(x0,y0);c.lineTo(x0+l,y0+(rn()-.5));c.stroke()}
    return {col,rel};
  }
  function honeyCanvases(){   // fenêtre de languette : nid d'abeille ajouré, fond brun-sable
    const S=256,col=document.createElement('canvas'),rel=document.createElement('canvas');col.width=col.height=rel.width=rel.height=S;
    const c=col.getContext('2d'),r=rel.getContext('2d');c.fillStyle='#D9C7A3';c.fillRect(0,0,S,S);r.fillStyle='#e0e0e0';r.fillRect(0,0,S,S);
    const R=8,h=R*Math.sqrt(3);for(let row=-1;row<S/h+1;row++)for(let k=-1;k<S/(1.5*R)+1;k++){const cx=k*1.5*R,cy=row*h+(k%2?h/2:0);
      for(const [cv,fill,w,st] of [[c,'rgba(96,78,54,.88)',1.5,'rgba(246,236,212,.55)'],[r,'#202020',1.5,'#fafafa']]){cv.beginPath();for(let i=0;i<6;i++){const a=Math.PI/3*i;cv.lineTo(cx+(R-2.2)*Math.cos(a),cy+(R-2.2)*Math.sin(a))}cv.closePath();cv.fillStyle=fill;cv.fill();
        cv.beginPath();for(let i=0;i<6;i++){const a=Math.PI/3*i;cv.lineTo(cx+(R-.8)*Math.cos(a),cy+(R-.8)*Math.sin(a))}cv.closePath();cv.strokeStyle=st;cv.lineWidth=w;cv.stroke()}}
    return {col,rel};
  }
  function midCanvas(){   // flanc de semelle : mousse injectée, alvéoles irrégulières (taille, profondeur, position) qui s'estompent vers le haut, grain fin partout
    const W=1040,H=200,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');x.fillStyle='#c4c4c4';x.fillRect(0,0,W,H);
    let sd=7;const rn=()=>{sd=(sd*16807)%2147483647;return sd/2147483647};
    const R=6.4,h=R*Math.sqrt(3);
    for(let row=0;row<H/h+1;row++)for(let k=0;k<W/(1.5*R)+1;k++){
      const cx=k*1.5*R+(rn()-.5)*2.6,cy=row*h+(k%2?h/2:0)+(rn()-.5)*2.6,v=1-cy/H;
      let f=1-Math.min(1,Math.max(0,(v-.18+.1*Math.sin(cx*.011))/.34));f*=.6+.4*Math.sin(cx*.017+cy*.04+rn()*.8)*.5+.2;if(f<=.04)continue;
      const rr=(1.4+2.6*f)*(.75+.5*rn());x.fillStyle='rgba(70,70,70,'+(.6*f)+')';x.beginPath();x.ellipse(cx,cy,rr*1.05,rr*.85,(rn()-.5)*.6,0,6.283);x.fill();
      x.strokeStyle='rgba(235,235,235,'+(.3*f)+')';x.lineWidth=1;x.beginPath();x.arc(cx,cy-.8,rr+.9,3.6,5.8);x.stroke()}
    for(let k=0;k<14000;k++){const v=rn()>.5?255:0;x.fillStyle='rgba('+v+','+v+','+v+','+(.015+rn()*.035)+')';x.fillRect(rn()*W,rn()*H,1,1)}
    return c;
  }
  function buildShoe(env){
    const g=new THREE.Group();
    const sm=(a,b,x)=>{x=Math.min(1,Math.max(0,(x-a)/(b-a)));return x*x*(3-2*x)};
    const XN=-2.46,XP=2.47,PW=.64,NXs=110,NT=34;
    const COL={upper:0xC9CFD0,mid:0xBDBFBA,out:0x16304F,trim:0x17181B,tpu:0x34373C,lace:0x1E1F22,inside:0x1C1712};
    /* --- profils (unités de la scène : 4,9 de long, y vers le haut, bout vers +x) --- */
    const rockF=x=>{const a=sm(.7,2.45,x),b=sm(-1.7,-2.45,x);return .38*a*a+.3*b*b};   // dessous en banane : pointe et talon relevés
    const botM=x=>.13+rockF(x),thk=x=>.55+.05*sm(-1.2,1.2,x)-.06*sm(1.7,2.47,x)+.03*sm(-1.4,-2.2,x),topM=x=>botM(x)+thk(x)*(.35+.65*endF(x));   // mousse épaisse mais plus sèche, qui s'affine vers la pointe
    const HhA=x=>1.1*(1.0-.04*sm(-2.05,-1.4,x)-.02*sm(-1.4,-.5,x)-.2*sm(-.5,1.3,x)-.13*sm(1.3,2.3,x)-.06*sm(2.2,2.47,x));   // hauteur de la tige au-dessus de la mousse : basse, le col du talon reste sous le haut de la languette
    const Wx=x=>{let w=.51+.05*sm(-2.4,-1.6,x)+.1*sm(-.3,1.0,x)-.035*Math.exp(-Math.pow((x+.3)/.6,2));   // tige plus étroite, au plus près du pied
      if(x>1.6){const q=(x-1.6)/(XP-1.6);w*=Math.pow(Math.max(.03,1-Math.pow(q,1.9)),.6)}
      if(x<-2.1){const q=(-2.1-x)/.36;w*=Math.sqrt(Math.max(.04,1-q*q))}return w};
    const WS=x=>{let w=.69+.06*sm(-2.4,-1.6,x)+.1*sm(-.4,1.0,x)-.05*Math.exp(-Math.pow((x+.2)/.6,2));
      if(x>1.7){const q=(x-1.7)/.77;w*=Math.pow(Math.max(.03,1-Math.pow(q,1.45)),.85)}
      if(x<-2.12){const q=(-2.12-x)/.34;w*=Math.sqrt(Math.max(.03,1-q*q))}return w};
    const endF=x=>Math.min(1,Math.sqrt(Math.max(0,(x+2.46)/.3)),Math.sqrt(Math.max(0,(2.47-x)/.3)));
    // du haut de la languette à la pointe, la ligne du dessus descend sans cesse (le rocker relève la semelle à l'avant : la tige doit s'abaisser d'autant)
    const baseU=x=>topM(x)-.09*(1-.5*endF(x)),Y0=baseU(-.9)+HhA(-.9),lineT=x=>{const u=Math.min(1,Math.max(0,(x+.9)/3.37));return Y0-.19*u-.36*u*u};
    const Hh=x=>{const k=sm(-1.1,-.7,x);return HhA(x)*(1-k)+Math.max(.2,lineT(x)-baseU(x))*k};
    const tipF=x=>Math.min(1,.62+.38*Math.sqrt(Math.max(0,(XP+.01-x)/.45)),.62+.38*Math.sqrt(Math.max(0,(x-XN+.01)/.35)));   // la tige se ferme en pointe au bout et au talon
    const sec=(x,t)=>{const c=Math.cos(t),s=Math.sin(t);return [x,topM(x)-.09*(1-.5*endF(x))+Hh(x)*tipF(x)*Math.pow(Math.abs(s),PW),-Wx(x)*Math.sign(c)*Math.pow(Math.abs(c),PW)]};
    const ysf=(x,z)=>{const W=Wx(x),q=Math.min(.995,Math.pow(Math.abs(z)/W,1/PW));return topM(x)-.09*(1-.5*endF(x))+Hh(x)*tipF(x)*Math.pow(Math.sqrt(1-q*q),PW)};
    /* --- languette séparée : naît sous la fenêtre de laçage, remplit l'avant de l'ouverture et dépasse nettement le col ;
           ses bords restent à plat, glissés sous les flancs et le col --- */
    const TX0=-.2,TX1=-1.0,TA=.5,TH=.36,TPW=.62;
    const tCap=u=>u>.82?Math.sqrt(Math.max(0,1-Math.pow((u-.82)/.18,2.4))):1,tH=u=>TH*sm(.3,.92,u)*tCap(u),tA=u=>TA*Math.pow(tCap(u),.55),tFl=z=>sm(.86,.62,Math.abs(z)/TA);
    const tLift=(x,z)=>{if(x>TX0||x<TX1)return 0;const u=(x-TX0)/(TX1-TX0),wa=tA(u);if(Math.abs(z)>=wa)return 0;const cs=Math.pow(Math.abs(z)/wa,1/TPW);return tH(u)*Math.pow(Math.sqrt(1-cs*cs),TPW)*tFl(z)};
    const P=(x,z,o)=>new THREE.Vector3(x,ysf(x,z)+tLift(x,z)+(o||0),z),P0=(x,z,o)=>new THREE.Vector3(x,ysf(x,z)+(o||0),z);   // P : sur la languette, P0 : sur la tige
    /* --- tige : coupes transversales, col ouvert, bout arrondi ; ombre peinte (couleur des sommets) au raccord avec la semelle --- */
    const loft=planar=>{
      const pos=[],uv=[],idx=[],cl=[],ro=NT+1;
      for(let i=0;i<=NXs;i++){const x=XN+(XP-XN)*i/NXs;let arc=0,prev=null;
        const shut=i===0||i===NXs?0:1;   // coupes extrêmes ramenées sur l'axe : le talon et la pointe sont fermés
        for(let j=0;j<=NT;j++){const p=sec(x,Math.PI*j/NT);p[2]*=shut;pos.push(p[0],p[1],p[2]);if(prev)arc+=Math.hypot(p[1]-prev[1],p[2]-prev[2]);prev=p;uv.push(planar?p[0]:x*2.4,planar?p[1]:arc*2.4);
          const f=(p[1]-topM(x))/Math.max(.2,Hh(x)),a=.56+.44*sm(0,.34,f);cl.push(a,a,a)}}
      for(let i=0;i<NXs;i++){const xm=XN+(XP-XN)*(i+.5)/NXs;for(let j=0;j<NT;j++){
        if(xm>-2.05&&xm<-.5&&j>=7&&j<NT-7)continue;   // ouverture du col, jusqu'à la gorge du laçage
        const a=i*ro+j,b=a+1,c=a+ro,d=c+1;idx.push(a,b,c,b,d,c)}}
      const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setAttribute('color',new THREE.Float32BufferAttribute(cl,3));geo.setIndex(idx);geo.computeVertexNormals();return geo};
    const WV=weaveCanvases(),wTex=new THREE.CanvasTexture(WV.col);wTex.wrapS=wTex.wrapT=THREE.RepeatWrapping;wTex.anisotropy=8;
    const wNrm=heightNormalTex(WV.rel,1.6,1,1);
    const upperMat=new THREE.MeshStandardMaterial({map:wTex,normalMap:wNrm,normalScale:new THREE.Vector2(.35,.35),vertexColors:true,color:COL.upper,roughness:.84,metalness:0,envMap:env,envMapIntensity:.5});
    g.add(new THREE.Mesh(loft(false),upperMat));
    g.add(new THREE.Mesh(loft(false),new THREE.MeshStandardMaterial({color:COL.inside,roughness:1,metalness:0,side:THREE.BackSide})));   // intérieur du col
    const surf=(x,t,off)=>{const p=sec(x,t),yc=topM(x)+Hh(x)*.32,v=new THREE.Vector3(0,p[1]-yc,p[2]);v.normalize();return new THREE.Vector3(p[0],p[1],p[2]).addScaledVector(v,off||0)};
    /* --- fenêtre de languette en nid d'abeille, bandes de passants en TPU, laçage rapide --- */
    const WX0=-.45,WX1=1.38,pa=x=>{const u=(x-WX0)/(WX1-WX0);return .33*(1-.3*u)*Math.pow(Math.max(0,1-Math.pow(u,6)),.5)};
    const NL=6,xs=i=>-.34+i*.29,ez=x=>pa(x)+.09,lz=x=>pa(x)+.05;   // ez : bande de passants, lz : sommet des boucles textiles (où passe le lacet)
    /* --- graphismes de flanc (projection plane x,y, donc des deux côtés) : renforts thermocollés autour des passants, alvéoles discrètes dans le tricot,
           contrefort de talon et pare-pierres en TPU --- */
    const OVW=1040,OVH=480,X=u=>(u+2.6)*200,Y=v=>(2.4-v)*200;
    const ovC=document.createElement('canvas'),ovR=document.createElement('canvas');ovC.width=ovR.width=OVW;ovC.height=ovR.height=OVH;
    {
      const c=ovC.getContext('2d'),r=ovR.getContext('2d');r.fillStyle='#000';r.fillRect(0,0,OVW,OVH);
      let sd=3;const rn=()=>{sd=(sd*16807)%2147483647;return sd/2147483647};
      const sideY=x=>sec(x,Math.PI*.24)[1];   // hauteur du flanc juste sous la bande de passants
      // alvéoles du tricot (motif hexagonal repris de l'avant-pied, fin et intégré)
      const R=.075,hh=R*Math.sqrt(3);
      for(let k=0;k<60;k++)for(let row=0;row<14;row++){const cx=-1.85+k*1.5*R,cy=topM(cx)+.14+row*hh+(k%2?hh/2:0);if(cx>2.05||cy>sideY(cx)-.08)continue;
        const a=.24*sm(-1.9,-.9,cx)*sm(2.1,1.3,cx)*(.55+.45*rn());if(a<.02)continue;c.beginPath();for(let i=0;i<6;i++){const q=Math.PI/3*i;c.lineTo(X(cx+R*.86*Math.cos(q)),Y(cy+R*.86*Math.sin(q)))}c.closePath();
        c.strokeStyle='rgba(118,108,84,'+a+')';c.lineWidth=1.6;c.stroke();if(rn()<.18){c.fillStyle='rgba(120,112,90,'+a*.5+')';c.fill()}}
      const poly=(pts,fill,edge)=>{for(const [cx,f,e,lw] of [[c,fill,edge,2.2],[r,'#fff','#888',3]]){cx.beginPath();pts.forEach(([u,v],i)=>i?cx.lineTo(X(u),Y(v)):cx.moveTo(X(u),Y(v)));cx.closePath();cx.fillStyle=f;cx.fill();cx.strokeStyle=e;cx.lineWidth=lw;cx.stroke()}};
      // renforts : bandes sombres qui partent des passants et s'évasent vers la semelle en filant vers l'avant
      for(let i=0;i<NL;i++){const x=xs(i),yt=ysf(x,ez(x))+.012,L=.2+.05*Math.sin(i*1.7),dx=.07+.02*(i%2);   // ailettes courtes et anguleuses sous chaque passant
        poly([[x-.055,yt],[x+.05,yt],[x+dx+.03,yt-L*.75],[x+dx-.02,yt-L],[x-.01,yt-L*.55]],'rgba(36,38,41,.93)','rgba(96,99,104,.95)')}
      // contrefort de talon (TPU sombre)
      {const pts=[];for(let k=0;k<=12;k++){const u=-2.5+.95*k/12;pts.push([u,topM(u)+.03])}for(let k=12;k>=0;k--){const u=-2.5+.95*k/12;pts.push([u,topM(u)+.05+.42*Math.pow(sm(-1.55,-2.45,u),.8)])}
        poly(pts,'rgba(34,36,39,.9)','rgba(92,95,100,.9)')}
      // pare-pierres à la pointe
      {const pts=[];for(let k=0;k<=10;k++){const u=1.85+.7*k/10;pts.push([u,topM(u)+.02])}for(let k=10;k>=0;k--){const u=1.85+.7*k/10;pts.push([u,topM(u)+.16+.05*sm(1.85,2.3,u)])}poly(pts,'rgba(34,36,39,.88)','rgba(92,95,100,.9)')}
    }
    const ovT=new THREE.CanvasTexture(ovC),ovB=new THREE.CanvasTexture(ovR);[ovT,ovB].forEach(t=>{t.anisotropy=8;t.repeat.set(1/5.2,1/2.4);t.offset.set(.5,0)});
    g.add(new THREE.Mesh(loft(true),new THREE.MeshStandardMaterial({map:ovT,bumpMap:ovB,bumpScale:.012,transparent:true,roughness:.6,metalness:0,envMap:env,envMapIntensity:.6,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2,depthWrite:false})));
    const grain=evaTex(),tpuM=new THREE.MeshStandardMaterial({color:COL.tpu,roughness:.5,metalness:0,envMap:env,envMapIntensity:.7,bumpMap:grain,bumpScale:.006});
    {
      const HC=honeyCanvases(),hT=new THREE.CanvasTexture(HC.col);hT.wrapS=hT.wrapT=THREE.RepeatWrapping;hT.anisotropy=8;
      const NX=48,NZ=12,pos=[],uv=[],idx=[];
      for(let i=0;i<=NX;i++){const x=WX0+(WX1-WX0)*i/NX,a=Math.max(.002,pa(x));for(let j=0;j<=NZ;j++){const z=a*(2*j/NZ-1);const p=P0(x,z,.014-.02*Math.pow(Math.abs(z)/a,2));pos.push(p.x,p.y,p.z);uv.push(x*3.6,z*3.6)}}
      for(let i=0;i<NX;i++)for(let j=0;j<NZ;j++){const q=i*(NZ+1)+j;idx.push(q,q+1,q+NZ+1,q+1,q+NZ+2,q+NZ+1)}
      const wg=new THREE.BufferGeometry();wg.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));wg.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));wg.setIndex(idx);wg.computeVertexNormals();
      g.add(new THREE.Mesh(wg,new THREE.MeshStandardMaterial({map:hT,normalMap:heightNormalTex(HC.rel,3,1,1),normalScale:new THREE.Vector2(1,1),color:0xffffff,roughness:.9,metalness:0,side:THREE.DoubleSide})));
      [-1,1].forEach(sd=>{   // bandes de passants : ruban de TPU thermocollé, plat, posé sur la tige
        const N=60,pos=[],uv=[],idx=[];for(let i=0;i<=N;i++){const x=WX0+.05+(WX1-WX0-.05)*i/N,e=ez(Math.min(x,WX1-.2)),fade=Math.max(.05,Math.min(1,(WX1+.02-x)/.25,(x-WX0-.05)/.14));   // effilée aux deux bouts
          for(let j=0;j<=3;j++){const z=sd*(e+(j/3-.5)*.06*fade),p=P0(x,z,.012+.006*Math.sin(Math.PI*j/3));pos.push(p.x,p.y,p.z);uv.push(x*3,j/3)}}
        for(let i=0;i<N;i++)for(let j=0;j<3;j++){const a=i*4+j;idx.push(a,a+4,a+1,a+1,a+4,a+5)}
        const bg=new THREE.BufferGeometry();bg.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));bg.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));bg.setIndex(idx);bg.computeVertexNormals();
        const m=tpuM.clone();m.side=THREE.DoubleSide;g.add(new THREE.Mesh(bg,m))});
    }
    /* --- languette : panneau tricoté, liseré noir au bord haut --- */
    {
      const NS=34,NA=30,pos=[],uv=[],idx=[],cl=[];
      for(let i=0;i<=NS;i++){const u=i/NS,x=TX0+(TX1-TX0)*u,wa=tA(u),h=tH(u);
        for(let a=0;a<=NA;a++){const ph=a/NA*Math.PI*2,cs=Math.cos(ph),sn=Math.sin(ph),z=wa*Math.sign(cs)*Math.pow(Math.abs(cs),TPW),yS=ysf(x,z);pos.push(x,sn>=0?yS-.012+h*Math.pow(sn,TPW)*tFl(z):yS-.04,z);uv.push(x*2.4,z*2.4);const k=sn>=0?1:.12;cl.push(k,k,k)}}
      for(let i=0;i<NS;i++)for(let a=0;a<NA;a++){const q=i*(NA+1)+a;idx.push(q,q+1,q+NA+1,q+1,q+NA+2,q+NA+1)}
      const tg=new THREE.BufferGeometry();tg.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));tg.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));tg.setAttribute('color',new THREE.Float32BufferAttribute(cl,3));tg.setIndex(idx);tg.computeVertexNormals();
      const tm=upperMat.clone();   // dessous foncé comme la doublure, vu par l'ouverture
     tm.color=new THREE.Color(0xE6DCC2);tm.side=THREE.DoubleSide;g.add(new THREE.Mesh(tg,tm));
      const u=.93,x=TX0+(TX1-TX0)*u,wa=tA(u),h=tH(u),pts=[];   // liseré : suit la section de la languette près de son bord haut
      for(let a=0;a<=24;a++){const ph=a/24*Math.PI,cs=Math.cos(ph),sn=Math.sin(ph),z=wa*Math.sign(cs)*Math.pow(Math.abs(cs),TPW)*.98;pts.push(new THREE.Vector3(x,ysf(x,z)+h*Math.pow(sn,TPW)*tFl(z)+.006,z))}
      g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),40,.02,8,false),new THREE.MeshStandardMaterial({color:COL.trim,roughness:.9,metalness:0,bumpMap:grain,bumpScale:.01})));
    }
    /* --- laçage rapide : boucles textiles, lacet fin croisé, bloqueur plastique noir en haut de la languette --- */
    {
      const loopM=new THREE.MeshStandardMaterial({color:COL.trim,roughness:.95,metalness:0,bumpMap:grain,bumpScale:.008}),laceM=new THREE.MeshStandardMaterial({color:COL.lace,roughness:.5,metalness:0,envMap:env,envMapIntensity:.5});
      for(let i=0;i<NL;i++)[-1,1].forEach(sd=>{const x=xs(i),m=new THREE.Mesh(new THREE.TorusGeometry(.03,.009,6,14,Math.PI),loopM);m.scale.set(1,1.3,1);
        m.position.copy(P0(x,sd*ez(x),.035));m.rotation.set(-sd*Math.PI/2+sd*.35,0,0);g.add(m)});
      const lace=(pts,n)=>g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),n,.011,6,false),laceM));
      for(let i=0;i<NL-1;i++)[[-1,1],[1,-1]].forEach(([a,b])=>{const pts=[];for(let k=0;k<=14;k++){const w=k/14,x=xs(i)+(xs(i+1)-xs(i))*w,z=a*lz(xs(i))*(1-w)+b*lz(xs(i+1))*w;pts.push(P0(x,z,.06+.022*Math.sin(Math.PI*w)))}lace(pts,28)});
      // bloqueur : capsule plastique posée sur la languette, les deux brins y entrent par l'avant, petite tirette derrière
      const ul=.55,lx=TX0+(TX1-TX0)*ul,ly=ysf(lx,0)-.012+tH(ul)+.055,x0=xs(0);
      [-1,1].forEach(sd=>lace([P(x0,sd*lz(x0),.06),P(x0-.07,sd*(lz(x0)-.06),.08),P((x0+lx)/2+.02,sd*.07,.075),new THREE.Vector3(lx+.09,ly,sd*.012)],24));
      const lockM=new THREE.MeshStandardMaterial({color:0x111214,roughness:.38,metalness:0,envMap:env,envMapIntensity:.9,bumpMap:grain,bumpScale:.003});
      const body=new THREE.Mesh(new THREE.CylinderGeometry(.042,.036,.17,14),lockM);body.rotation.z=Math.PI/2-.25;body.position.set(lx,ly,0);body.scale.z=.8;g.add(body);
      const cap=new THREE.Mesh(new THREE.SphereGeometry(.042,14,10),lockM);cap.scale.set(.6,1,.8);cap.position.set(lx+.085,ly+.021,0);g.add(cap);
      const ring=new THREE.Mesh(new THREE.TorusGeometry(.045,.006,6,16),new THREE.MeshStandardMaterial({color:0x3a3c40,roughness:.4,metalness:.2}));ring.rotation.y=Math.PI/2;ring.rotation.x=.25;ring.position.set(lx-.02,ly-.005,0);g.add(ring);
      const pull=new THREE.Mesh(new THREE.TorusGeometry(.045,.008,6,14,Math.PI),loopM);pull.position.set(lx-.1,ly-.03,0);pull.rotation.set(0,0,Math.PI/2+.35);pull.scale.set(1,.7,1);g.add(pull);
      lace([new THREE.Vector3(lx-.08,ly-.02,0),new THREE.Vector3(lx-.15,ly-.04,.02),new THREE.Vector3(lx-.2,ly-.06,0)],8);
    }
    /* --- col fin : liseré noir texturé autour de l'ouverture --- */
    {
      const collarM=new THREE.MeshStandardMaterial({color:COL.trim,roughness:.92,metalness:0,envMap:env,envMapIntensity:.3,bumpMap:grain,bumpScale:.012});
      const pts=[],xa=-.4,xb=-2.05,add=(x,t)=>pts.push(surf(x,t,0)),t0=7/NT;   // de la gorge (sous le début des bandes de passants) au talon
      for(let i=0;i<=12;i++)add(xa+(xb-xa)*i/12,Math.PI*t0);for(let j=1;j<=8;j++)add(xb,Math.PI*(t0+(1-2*t0)*j/8));for(let i=12;i>=0;i--)add(xa+(xb-xa)*i/12,Math.PI*(1-t0));
      const cc=new THREE.CatmullRomCurve3(pts),NSc=120,cg=new THREE.TubeGeometry(cc,NSc,.03,8,false),cp=cg.attributes.position,c0=new THREE.Vector3(),pv=new THREE.Vector3();
      for(let i=0;i<=NSc;i++){const u=i/NSc,f=Math.sqrt(sm(0,.05,u)*sm(1,.95,u));cc.getPointAt(u,c0);   // bouts effilés jusqu'à zéro : le liseré se referme sous les bandes de passants
        for(let j=0;j<=8;j++){const k=i*9+j;pv.fromBufferAttribute(cp,k).sub(c0).multiplyScalar(f).add(c0);cp.setXYZ(k,pv.x,pv.y,pv.z)}}
      cg.computeVertexNormals();g.add(new THREE.Mesh(cg,collarM));
    }
    /* --- semelle : mousse sculptée (gorge qui file vers l'avant), flancs alvéolés irréguliers, gomme ondulée, crampons angulaires --- */
    const loftS=(x0,x1,topF,botF,hwF,p,ns,nt,scoop)=>{
      const pos=[],uv=[],idx=[],ro=nt+1;
      for(let i=0;i<=ns;i++){const x=x0+(x1-x0)*i/ns,tp=topF(x),bt=botF(x),mid=(tp+bt)/2,hh=(tp-bt)/2,hw=hwF(x);
        for(let j=0;j<=nt;j++){const t=-Math.PI/2+2*Math.PI*j/nt,c=Math.cos(t),s=Math.sin(t),y=mid+hh*Math.sign(s)*Math.pow(Math.abs(s),p);
          const sk=(scoop?1-scoop(x,s):1)*(i===0||i===ns?0:1);
          pos.push(x,y,hw*sk*(.965-.045*s)*Math.sign(c)*Math.pow(Math.abs(c),p));uv.push(x,y-(botF(x)-botF(0)))}}
      for(let i=0;i<ns;i++)for(let j=0;j<nt;j++){const a=i*ro+j,b=a+1,c=a+ro,d=c+1;idx.push(a,c,b,b,c,d)}
      const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(idx);geo.computeVertexNormals();
      {const nr=geo.attributes.normal;for(let i=0;i<=ns;i++){const a=i*ro,b=a+nt,nx=nr.getX(a)+nr.getX(b),ny=nr.getY(a)+nr.getY(b),nz=nr.getZ(a)+nr.getZ(b),l=Math.hypot(nx,ny,nz)||1;nr.setXYZ(a,nx/l,ny/l,nz/l);nr.setXYZ(b,nx/l,ny/l,nz/l)}}
      return geo};
    const scoop=(x,s)=>{const s0=.35-.75*sm(-2.2,2.2,x),a=.075*sm(-2.45,-1.9,x)*sm(2.45,1.7,x);return a*Math.exp(-Math.pow((s-s0)/.3,2))};   // gorge sculptée : haute au talon, elle plonge vers la pointe
    const hxT=new THREE.CanvasTexture(midCanvas());hxT.wrapS=THREE.RepeatWrapping;hxT.repeat.set(1/5.2,1);hxT.offset.set(.5,0);hxT.anisotropy=8;
    const midHW=x=>WS(x)+.04;
    g.add(new THREE.Mesh(loftS(XN,XP,topM,botM,midHW,.5,130,52,scoop),new THREE.MeshStandardMaterial({color:COL.mid,roughness:.86,metalness:0,bumpMap:hxT,bumpScale:.09,envMap:env,envMapIntensity:.3})));
    const rub=new THREE.MeshStandardMaterial({color:COL.out,roughness:.92,metalness:0,envMap:env,envMapIntensity:.25,bumpMap:grain,bumpScale:.012});
    const wave=x=>.5+.5*Math.sin(x*6.2+.6);
    g.add(new THREE.Mesh(loftS(-2.43,2.45,x=>botM(x)+.1+.09*wave(x)*endF(x),x=>botM(x)-.1,x=>WS(x)+.045,.42,130,40),rub));   // gomme qui remonte en vagues sur le flanc
    {   // semelle intérieure sombre visible par le col
      const NSx=44,pos=[],idx=[],x0=-2.3,x1=1.0;for(let i=0;i<=NSx;i++){const x=x0+(x1-x0)*i/NSx,y=topM(x)+.025,w=Wx(x);pos.push(x,y,-w,x,y,w)}
      for(let i=0;i<NSx;i++){const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2)}
      const ig=new THREE.BufferGeometry();ig.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));ig.setIndex(idx);ig.computeVertexNormals();g.add(new THREE.Mesh(ig,new THREE.MeshStandardMaterial({color:COL.inside,roughness:1,metalness:0,side:THREE.DoubleSide})));
    }
    {   // crampons : chevrons angulaires profonds (vers l'avant sous l'avant-pied, inversés au talon pour freiner), tailles et angles variés
      const sh=new THREE.Shape([[-.1,-.075],[.01,-.085],[.1,0],[.01,.085],[-.1,.075],[-.035,0]].map(([a,b])=>new THREE.Vector2(a,b)));
      const lugGeo=new THREE.ExtrudeGeometry(sh,{depth:.12,bevelEnabled:true,bevelThickness:.018,bevelSize:.014,bevelSegments:1,steps:1});lugGeo.rotateX(Math.PI/2);
      const lugM=rub.clone();lugM.bumpScale=.006;
      const lugs=new THREE.InstancedMesh(lugGeo,lugM,96),d=new THREE.Object3D();let n=0,sd=9;const rn=()=>{sd=(sd*16807)%2147483647;return sd/2147483647};
      for(let i=0;i<19;i++){const x=-2.28+i*.255,sl=(rockF(x+.05)-rockF(x-.05))/.1,w=WS(x);if(w<.3)continue;
        [-1,0,1].forEach(j=>{if(n>=96)return;if(j===0&&i%2)return;const zz=j*(w-.13),fwd=x>-.7?0:Math.PI,sc=.85+.3*rn();
          d.position.set(x+(j===0?.12:0),botM(x)-.085,zz);d.rotation.set(0,fwd+j*.3+(rn()-.5)*.25,-Math.atan(sl));d.scale.set(sc,.85+.35*rn(),sc*(j?1.05:1.25));d.updateMatrix();lugs.setMatrixAt(n++,d.matrix)})}
      lugs.count=n;g.add(lugs);
    }
    return g;
  }
  /* --- sol : boue et flaque (shader) --- */
  /* texture de hauteur tuilable 256² générée au chargement (bruit de valeur périodique, 5 octaves ; déterministe, sans Math.random) : R = hauteur, G = copie de R, B = grain fin (bruit blanc adouci), A = 1 */
  function sandMaps(){
    const N=256,d=new Uint8Array(N*N*4),sm=t=>t*t*(3-2*t);
    const lat=k=>{const a=new Float32Array(k*k);let q=1234567+k*977;for(let i=0;i<a.length;i++){q=(q*16807)%2147483647;a[i]=q/2147483647}return a};
    const O=[4,8,16,32,64].map(k=>({k,a:lat(k)})),W=lat(N);
    const oct=(o,x,y)=>{const k=o.k;x*=k;y*=k;const ix=Math.floor(x),iy=Math.floor(y),fx=sm(x-ix),fy=sm(y-iy),x0=ix%k,y0=iy%k,x1=(x0+1)%k,y1=(y0+1)%k,A=o.a;
      return (A[y0*k+x0]*(1-fx)+A[y0*k+x1]*fx)*(1-fy)+(A[y1*k+x0]*(1-fx)+A[y1*k+x1]*fx)*fy};
    for(let y=0;y<N;y++)for(let x=0;x<N;x++){
      let h=0,am=1,tot=0;for(const o of O){h+=oct(o,x/N,y/N)*am;tot+=am;am*=.55}
      h=Math.min(1,Math.max(0,(h/tot-.5)*2.1+.5));
      const n=(W[y*N+x]*2+W[((y+1)%N)*N+x]+W[y*N+(x+1)%N])/4,i=(y*N+x)*4;
      d[i]=d[i+1]=h*255;d[i+2]=n*255;d[i+3]=255}
    const t=new THREE.DataTexture(d,N,N,THREE.RGBAFormat);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;t.anisotropy=4;t.needsUpdate=true;return t}
  /* relief : une texture de hauteur tuilable (canal R = hauteur, B = grain), lue par le vertex shader (déplacement du plan subdivisé) et par le fragment shader (normales, masque de rugosité de la flaque). ht(p) : relief large (tuile de 45 u) ; shoreD(p) : distance elliptique au centre de la flaque, rivage rendu irrégulier par le même relief. */
  const GCOM=`uniform sampler2D uH;uniform float uAmp;
  float ht(vec2 p){return texture2D(uH,p*.022).r;}
  float shoreD(vec2 p){return length(p/vec2(4.6,2.6))+(ht(p*1.9+vec2(3.1,7.7))-.5)*.3;}`;
  const GVS=`varying vec3 vW;`+GCOM+`
  void main(){
    vec4 w=modelMatrix*vec4(position,1.);vec2 p=w.xz;
    float bank=smoothstep(.92,2.2,shoreD(p));   // 0 dans l'eau (plan à y = 0), le sable monte en berge puis en dunes
    w.y+=uAmp*bank*(.42+(ht(p)-.5)*1.25+(texture2D(uH,p*.07).r-.5)*.5);
    vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`;
  const GFS=`precision highp float;
  uniform float uT,uDay;uniform vec3 uPtr;uniform vec4 uRip[8];uniform vec3 uLP0,uLD0,uLP1,uLD1;varying vec3 vW;`+GCOM+`
  float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
  float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
  float caust(vec2 p){   // réseau de caustiques : lignes claires qui ondulent lentement à la surface de l'eau
    vec2 q=p*1.4;float t=uT*.35,c=0.;
    for(int i=0;i<3;i++){q+=vec2(sin(q.y*1.7+t+float(i)*1.9),cos(q.x*1.5-t*1.2+float(i)))*.45;c+=pow(.5+.5*sin(q.x*3.+q.y*2.4),6.);}
    return c/3.;}
  vec3 sky(vec3 r){
    r=normalize(r);float h=clamp(r.y,0.,1.);
    vec3 c=mix(vec3(.46,.27,.30),vec3(.03,.04,.09),pow(h,.45));
    vec2 g=vec2(atan(r.x,r.z)*6.,asin(clamp(r.y,-1.,1.))*12.)*8.;vec2 id=floor(g);vec2 fr=fract(g)-.5;
    float hs=hash(id);float st=step(.94,hs);
    float dd=length(fr-(vec2(hash(id+1.3),hash(id+7.7))-.5)*.6);
    c+=vec3(.85,.93,1.)*st*smoothstep(.22,.0,dd)*(.6+.4*sin(uT*(1.5+hs*3.)+hs*40.))*smoothstep(.04,.3,h);
    float mo=dot(r,normalize(vec3(-.25,.2,-.95)));
    c+=vec3(.75,.85,1.)*(smoothstep(.9986,.9996,mo)*1.8+smoothstep(.97,.999,mo)*.3);
    return c;
  }
  vec3 lampTerm(vec3 P,vec3 Lp,vec3 D,vec3 R,float F){   // lampe frontale : tache de lumière chaude sur l'eau et reflet de la lampe
    float dist=length(P-Lp);vec3 Lw=(Lp-P)/dist;
    float cone=smoothstep(.78,.96,dot(-Lw,D))*exp(-dist*.15);
    vec3 hit=Lp+D*(-Lp.y/min(D.y,-.05));vec2 dd=P.xz-hit.xz;vec2 dr=normalize(D.xz+vec2(1e-4));float al=dot(dd,dr),pe=dot(dd,vec2(-dr.y,dr.x));
    float pch=exp(-(al*al/5.5+pe*pe/1.25));
    float spec=pow(max(dot(R,Lw),0.),60.);
    return vec3(1.,.76,.45)*(cone*(.1+.36*pch)+pch*.4+spec*1.5*(.35+F));
  }
  void main(){
    vec2 p=vW.xz;float r=shoreD(p);
    float m=1.-smoothstep(.9,1.02,r);   // eau : rivage organique (bruit du relief), plus de contour d'ellipse
    vec3 V=normalize(cameraPosition-vW);float dist=length(vW-cameraPosition);
    vec2 g=vec2(0.);float hh=0.;
    for(int i=0;i<8;i++){
      vec4 rp=uRip[i];float age=rp.z;
      if(age<0.||age>2.6)continue;
      vec2 d=p-rp.xy;float dd=length(d);float front=age*1.7;
      float env=exp(-abs(dd-front)*2.6)*exp(-age*1.2)*rp.w;
      float ph=(dd-front)*9.;
      hh+=sin(ph)*env;
      g+=normalize(d+vec2(1e-4))*cos(ph)*env*.55;
    }
    {vec2 dp=p-uPtr.xy;float dl=length(dp);float ph=dl*13.-uT*5.5;   // le pointeur déforme l'eau : onde circulaire douce autour du curseur, qui s'éteint avec la distance
      float e=exp(-dl*1.5)*uPtr.z;g+=normalize(dp+vec2(1e-4))*cos(ph)*e*.5;hh+=sin(ph)*e*.5;}
    g+=(vec2(vn(p*3.+uT*.2),vn(p*3.-uT*.17))-.5)*.03;
    vec3 N=normalize(vec3(-g.x,1.,-g.y));
    vec3 R=reflect(-V,N);R.y=abs(R.y);
    float F=.04+.96*pow(1.-max(dot(N,V),0.),5.);
    vec3 waterN=vec3(.015,.025,.035)+sky(R)*(.25+.9*F)+vec3(.7,.85,1.)*pow(max(hh,0.),2.)*.5;
    vec3 waterD=mix(vec3(.50,.62,.69),vec3(.86,.93,.97),F)+vec3(1.,1.,.96)*pow(max(hh,0.),2.)*.55;   // eau de jour : ciel clair reflété
    float cs=caust(p+g*.6);   // les caustiques suivent les ondes
    vec3 water=mix(waterN+vec3(.45,.65,.9)*cs*.1,waterD+vec3(1.,1.,.97)*cs*.13,uDay);
    /* sable : normales issues de la texture de hauteur (relief large + grain fin qui s'efface au loin) */
    vec2 uv=p*.022,e=vec2(1./256.,0.);
    vec2 gc=vec2(texture2D(uH,uv+e.xy).r-texture2D(uH,uv-e.xy).r,texture2D(uH,uv+e.yx).r-texture2D(uH,uv-e.yx).r)/(2.*.1775);
    vec2 uf=p*.45;
    vec2 gf=vec2(texture2D(uH,uf+e.xy).r-texture2D(uH,uf-e.xy).r,texture2D(uH,uf+e.yx).r-texture2D(uH,uf-e.yx).r)/(2.*.00868);
    float bank=smoothstep(.92,2.2,r),fk=1.-smoothstep(4.,20.,dist);
    vec2 gs=gc*uAmp*1.6*bank+gf*.1*fk;
    vec3 Ns=normalize(vec3(-gs.x,1.,-gs.y));
    float grain=texture2D(uH,p*.9).b;
    float wet=(1.-m)*(1.-smoothstep(.95,1.75,r+(texture2D(uH,p*.11).r-.5)*.25));   // sable mouillé autour de l'eau
    float rough=mix(.9,.28+.5*grain,wet);   // masque de rugosité : sec = mat, mouillé = lisse et brillant, grain qui casse le reflet
    float gl=1.-rough;
    vec3 Ld=normalize(vec3(.5,.7,.45)),Hh=normalize(Ld+V);
    float dif=clamp(dot(Ns,Ld),0.,1.);
    float Fs=.04+.96*pow(1.-max(dot(Ns,V),0.),5.);
    float spec=pow(max(dot(Ns,Hh),0.),mix(6.,80.,gl))*gl*wet;
    vec3 sandD=mix(vec3(.74,.69,.61),vec3(.90,.86,.78),smoothstep(.2,.8,ht(p*1.3)))*(.94+.12*grain);
    sandD*=.7+.42*dif;
    sandD=mix(sandD,sandD*vec3(.52,.5,.5),wet);   // mouillé : plus sombre
    sandD+=vec3(.9,.95,1.)*(spec*.55+Fs*gl*wet*.75);
    float mud=vn(p*.9)*.6+vn(p*4.)*.4;
    vec3 groundN=vec3(.03,.045,.07)*(.6+mud*.8)*(.7+.9*clamp(dot(Ns,normalize(vec3(-.3,.8,-.5))),0.,1.))+sky(reflect(-V,Ns))*(.03+.1*wet*gl);
    vec3 ground=mix(groundN,sandD,uDay);
    vec3 col=mix(ground,water,m);
    col*=1.-.45*smoothstep(.75,1.,r)*m;
    float qs=length(p/vec2(2.2,1.3));   // socle : centre de l'eau éclairci, halo cuivré diffus qui déborde sur la boue
    col+=vec3(.16,.19,.22)*exp(-qs*qs*2.6)*m*(1.-uDay);
    col+=vec3(.5,.6,.72)*.05*exp(-qs*qs*.6)*m*(1.-uDay);   // plus de halo cuivré en ovale autour de la flaque : un simple éclaircissement bleuté au centre de l'eau
    float dfade=1.-smoothstep(18.,44.,dist);
    gl_FragColor=vec4(col,mix(1.,.86,m)*dfade);
  }`;
  const PVS='attribute float size;attribute float alpha;varying float vA;varying vec3 vWp;uniform float uScale;void main(){vA=alpha;vWp=position;vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=size*uScale/-mv.z;gl_Position=projectionMatrix*mv;}';
  const PFS=`precision highp float;varying float vA;varying vec3 vWp;uniform vec3 uLP0,uLD0,uLP1,uLD1;
  float beamAt(vec3 P,vec3 Lp,vec3 D){vec3 w=normalize(Lp-P);return smoothstep(.72,.95,dot(-w,D))*exp(-length(P-Lp)*.14);}
  void main(){vec2 c=gl_PointCoord-.5;float d=length(c);float bm=0.;
    float disk=smoothstep(.5,.43,d),rim=smoothstep(.5,.41,d)*smoothstep(.26,.45,d);   // goutte nette : corps translucide et bord lumineux
    float hl=smoothstep(.14,.0,length(c-vec2(-.14,-.15)));   // reflet principal
    float hl2=smoothstep(.08,.0,length(c-vec2(.15,.16)))*.55;   // reflet inverse, côté de la lampe
    float a=disk*.2+rim*.7+hl*1.15+hl2;
    gl_FragColor=vec4(mix(vec3(.78,.9,1.),vec3(1.,.84,.56),bm)*a*(1.+1.5*bm),min(1.,a)*vA);}`;
  function init(){
    renderer=new THREE.WebGLRenderer({canvas:cv,antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,QDPR()));renderer.setClearColor(0x000000,0);
    scene=new THREE.Scene();cam=new THREE.PerspectiveCamera(36,1,.1,200);ray=new THREE.Raycaster();
    hemiL=new THREE.HemisphereLight(0x9db4d0,0x2a1a10,.6);scene.add(hemiL);
    const moon=new THREE.DirectionalLight(0xbcd4ff,1.15);moon.position.set(-4,6,-6);scene.add(moon);
    const em=new THREE.PointLight(0xE26D3B,.3,16);em.position.set(3.5,.8,3.5);scene.add(em);
    const key=new THREE.DirectionalLight(0xFFE6D2,1.1);key.position.set(5,3.5,4);scene.add(key);keyL=key;
    rimL=new THREE.DirectionalLight(0xFFC27A,1.5);rimL.position.set(6,5.5,-2.5);scene.add(rimL);   // contre-jour doré venant du haut à droite : liseré de lumière sur l'empeigne, le talon et la semelle   // clé chaude de droite : la tige brune et la semelle claire prennent un liseré cuivré
    const env=makeEnvS();
    gmat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uT:{value:0},uDay:{value:0},uH:{value:sandMaps()},uAmp:{value:.26},uPtr:{value:ptrV},uRip:{value:ripBuf},uLP0:{value:lampP[0]},uLD0:{value:lampD[0]},uLP1:{value:lampP[1]},uLD1:{value:lampD[1]}},
      vertexShader:GVS,fragmentShader:GFS});
    const SEG=[200,128,64][QC.tier]||128;   // plan subdivisé : le vertex shader le déplace (relief), moins de segments sur les petits appareils
    const gm=new THREE.Mesh(new THREE.PlaneGeometry(90,90,SEG,SEG),gmat);gm.rotation.x=-Math.PI/2;gm.renderOrder=1;scene.add(gm);
    pair=new THREE.Group();pair.position.y=.1;scene.add(pair);
    {   // lignes topographiques fines qui flottent derrière et au-dessus de la paire, comme sur la photo : réseau de courbes de niveau qui s'efface vers le bas
      const c=document.createElement('canvas');c.width=640;c.height=360;const x=c.getContext('2d');let sd=11;const rn=()=>{sd=(sd*16807)%2147483647;return sd/2147483647};const ph=[rn()*6,rn()*6,rn()*6];
      for(let k=0;k<17;k++){const R=26+k*12.5,al=Math.max(.14,.55-.022*k);x.strokeStyle='rgba(255,255,255,'+al+')';x.lineWidth=1.1;x.beginPath();
        for(let a=0;a<=96;a++){const th=a/96*Math.PI*2,r=R*(1+.17*Math.sin(3*th+ph[0]+k*.08)+.09*Math.sin(5*th+ph[1])+.05*Math.sin(8*th+ph[2]+k*.12)),px=320+r*1.35*Math.cos(th),py=250+r*.78*Math.sin(th);a?x.lineTo(px,py):x.moveTo(px,py)}x.closePath();x.stroke()}
      x.globalCompositeOperation='destination-in';const gr=x.createLinearGradient(0,0,0,360);gr.addColorStop(0,'rgba(0,0,0,1)');gr.addColorStop(.55,'rgba(0,0,0,.75)');gr.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=gr;x.fillRect(0,0,640,360);
      const topo=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),transparent:true,opacity:.5,depthWrite:false,blending:THREE.AdditiveBlending}));topo.scale.set(9,5,1);topo.position.set(0,3.6,-2.2);scene.add(topo);topoSpr=topo;
    }
    const base=buildShoe(env);base.scale.setScalar(.72);   // la nouvelle chaussure est plus haute (semelle épaisse) : réduite pour garder le cadrage
    [0,1].forEach(f=>{
      const s=f?base:base.clone();s.position.z=f?1.25:-1.25;pair.add(s);shoes.push(s);
      const mir=s.clone();mir.scale.y=-1;scene.add(mir);mirrors.push(mir);
    });
    loadModel(env);
    // particules : gouttelettes qui accrochent la lumière des étoiles
    pGeo=new THREE.BufferGeometry();pPos=new Float32Array(NP*3);pSize=new Float32Array(NP);pAl=new Float32Array(NP);
    for(let i=0;i<NP;i++)pPos[i*3+1]=-100;
    pGeo.setAttribute('position',new THREE.BufferAttribute(pPos,3));pGeo.setAttribute('size',new THREE.BufferAttribute(pSize,1));pGeo.setAttribute('alpha',new THREE.BufferAttribute(pAl,1));
    pMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uScale:{value:600},uLP0:{value:lampP[0]},uLD0:{value:lampD[0]},uLP1:{value:lampP[1]},uLD1:{value:lampD[1]}},vertexShader:PVS,fragmentShader:PFS});
    const pts=new THREE.Points(pGeo,pMat);pts.frustumCulled=false;pts.renderOrder=3;scene.add(pts);
    // invitations : deux anneaux qui pulsent sur l'eau
    [-1,1].forEach(sd=>{const r=new THREE.Mesh(new THREE.RingGeometry(.55,.62,48),new THREE.MeshBasicMaterial({color:0xE26D3B,transparent:true,opacity:.6,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));r.material.visible=false;   // plus de cercle orange : la mesure reste le support des ondes d'eau (enfants) et de la position des zones
      r.rotation.x=-Math.PI/2;r.position.set(sd*2.6,.04,0);r.renderOrder=2;scene.add(r);inv.push(r);
      /* invitation au clic : deux ondes d'eau translucides (bord doux, sans orange) qui partent du cercle et s'élargissent sur la flaque, et un voile d'eau à peine plus clair en dessous */
      const mkTex=(draw)=>{const k=document.createElement('canvas');k.width=k.height=256;draw(k.getContext('2d'));return new THREE.CanvasTexture(k)};
      const wob=(seed,L)=>mkTex(x=>{x.lineCap='round';   // onde au contour irrégulier (lobes 3, 5 et 8), jamais un cercle parfait
        for(const [lw,al,bl] of (L||[[16,.1,14],[7,.35,8],[2.6,.85,2]])){x.strokeStyle='rgba(255,255,255,'+al+')';x.lineWidth=lw;x.shadowColor='#fff';x.shadowBlur=bl;x.beginPath();
          for(let a=0;a<=72;a++){const th=a/72*Math.PI*2,R=60*(1+.07*Math.sin(3*th+seed)+.045*Math.sin(5*th+seed*2.3)+.03*Math.sin(8*th+seed*.7)),X=128+R*Math.cos(th),Y=128+R*Math.sin(th);a?x.lineTo(X,Y):x.moveTo(X,Y)}
          x.closePath();x.stroke()}});
      const veilTex=mkTex(x=>{const g=x.createRadialGradient(128,128,0,128,128,128);g.addColorStop(0,'rgba(255,255,255,.55)');g.addColorStop(.55,'rgba(255,255,255,.25)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,256,256)});
      const mk=(tex,size)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(size,size),new THREE.MeshBasicMaterial({map:tex,color:0xCFEFFF,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));m.renderOrder=2;r.add(m);return m};
      const halo=mk(veilTex,2.8);halo.position.z=-.005;
      const foc=mk(wob(1.7+(sd>0?.9:0),[[8,1,2]]),2.4);   // seul tracé conservé : anneau d'encre (pas orange), irrégulier, visible UNIQUEMENT au focus clavier (WCAG 2.4.7, ≥ 3:1). Au survol souris : aucun cercle, ce sont les gouttes en suspension qui marquent la zone.
      r.userData.fx={halo,foc}});
    $('#sideL').classList.add('ring3d');$('#sideR').classList.add('ring3d');   // le focus est dessiné dans l'eau : plus d'ovale orange sur le bouton
    dropInit();
    ok=true;
  }
  /* --- modèle 3D importé (glTF/GLB) : remplace la chaussure procédurale dès qu'il est chargé ; fichier absent ou illisible → la procédurale reste ---
     Le modèle est remis à l'échelle et orienté automatiquement : longueur sur x, bout vers +x (le bout est l'extrémité la plus basse), semelle posée au sol.
     toe : 0 = détection auto, 1 / -1 pour forcer le sens ; right : le fichier est un pied droit (le pied gauche est obtenu en miroir). */
  const SHOE_GLB={url:'/models/trail-shoe.glb',toe:0,right:true,len:4.93};
  function fitModel(root,env){
    const wrap=new THREE.Group(),tilt=new THREE.Group(),piv=new THREE.Group();wrap.add(tilt);tilt.add(piv);piv.add(root);
    const pts=()=>{wrap.updateMatrixWorld(true);const out=[],v=new THREE.Vector3();
      root.traverse(o=>{if(!o.isMesh)return;const a=o.geometry.attributes.position,st=Math.max(1,Math.floor(a.count/4000));for(let i=0;i<a.count;i+=st)out.push(v.fromBufferAttribute(a,i).applyMatrix4(o.matrixWorld).clone())});return out};
    let P=pts();
    {   // lacet (rotation autour de y) qui rend la chaussure la plus étroite possible : sa longueur est alors sur x (les modèles générés sont souvent de biais)
      let best=0,bw=1e9;for(let d=0;d<180;d+=.5){const a=d*Math.PI/180,c=Math.cos(a),sn=Math.sin(a);let lo=1e9,hi=-1e9;for(const p of P){const z=-p.x*sn+p.z*c;if(z<lo)lo=z;if(z>hi)hi=z}if(hi-lo<bw){bw=hi-lo;best=a}}
      piv.rotation.y=best;P=pts();
    }
    let box=new THREE.Box3().setFromPoints(P),dir=SHOE_GLB.toe;   // sens : pointe vers +x, avant de corriger l'assiette (sinon on relèverait le talon)
    if(!dir){const L=box.max.x-box.min.x,hi=e=>P.reduce((m,p)=>(e>0?p.x>box.max.x-.15*L:p.x<box.min.x+.15*L)?Math.max(m,p.y):m,-1e9);dir=hi(1)>hi(-1)?-1:1}   // le talon (col) est plus haut que la pointe
    if(dir<0){piv.rotation.y+=Math.PI;P=pts();box=new THREE.Box3().setFromPoints(P)}
    const soles=()=>{   // sommets du dessous de la semelle : normale tournée vers le bas, dans la moitié basse
      wrap.updateMatrixWorld(true);const out=[],v=new THREE.Vector3(),nv=new THREE.Vector3(),nm=new THREE.Matrix3();
      root.traverse(o=>{if(!o.isMesh||!o.geometry.attributes.normal)return;nm.getNormalMatrix(o.matrixWorld);const a=o.geometry.attributes.position,na=o.geometry.attributes.normal,st=Math.max(1,Math.floor(a.count/20000));
        for(let i=0;i<a.count;i+=st){nv.fromBufferAttribute(na,i).applyMatrix3(nm).normalize();if(nv.y<-.7)out.push(v.fromBufferAttribute(a,i).applyMatrix4(o.matrixWorld).clone())}});
      const b0=new THREE.Box3().setFromPoints(P),lim=b0.min.y+.5*(b0.max.y-b0.min.y);return out.filter(p=>p.y<lim)};
    for(let it=0;it<4;it++){   // assiette : plan des moindres carrés y = a·x + b·z + c sur le dessous de la semelle, puis on le remet à l'horizontale
      const Q=soles();if(Q.length<20)break;
      let sx=0,sz=0,sy=0,sxx=0,szz=0,sxz=0,sxy=0,szy=0;const n=Q.length;for(const p of Q){sx+=p.x;sz+=p.z;sy+=p.y}const mx=sx/n,mz=sz/n,my=sy/n;
      for(const p of Q){const x=p.x-mx,z=p.z-mz,y=p.y-my;sxx+=x*x;szz+=z*z;sxz+=x*z;sxy+=x*y;szy+=z*y}
      const det=sxx*szz-sxz*sxz;if(Math.abs(det)<1e-12)break;const A=(sxy*szz-szy*sxz)/det,B=(szy*sxx-sxy*sxz)/det;
      tilt.rotation.z-=Math.atan(A);tilt.rotation.x+=Math.atan(B);P=pts();
    }
    box=new THREE.Box3().setFromPoints(P);
    const k=SHOE_GLB.len/(box.max.x-box.min.x),c=box.getCenter(new THREE.Vector3());
    wrap.scale.setScalar(k);wrap.position.set(-c.x*k,-box.min.y*k-.06,-c.z*k);
    root.traverse(o=>{if(!o.isMesh)return;(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{
      if(m.map)m.map.encoding=THREE.LinearEncoding;if(m.emissiveMap)m.emissiveMap.encoding=THREE.LinearEncoding;   // la scène travaille en linéaire
      /* un peu plus de brillance (rugosité réduite, léger métal) : le soleil accroche la semelle, l'empeigne et les lacets */
      if(m.isMeshStandardMaterial){m.envMap=env;m.envMapIntensity=.9;m.roughness=Math.min(.78,m.roughness*.85);m.metalness=Math.max(m.metalness||0,.1)}m.needsUpdate=true})});
    return wrap;
  }
  function loadModel(env){
    const GL=LOADERS.GLTFLoader;if(!GL)return;
    new GL().load(SHOE_GLB.url,gltf=>{
      if(DEAD||!ok)return;
      try{
        const model=fitModel(gltf.scene,env);
        [shoes,mirrors].forEach(list=>list.forEach((s,f)=>{
          while(s.children.length)s.remove(s.children[0]);
          const c=model.clone();if((f===0)===SHOE_GLB.right)c.scale.z*=-1;s.add(c)}));   // f=0 : pied gauche (côté -z)
      }catch(e){}
    },undefined,()=>{});
  }
  function ensure(){
    if(ok||failed)return;
    try{init();const w=$('#waterCanvas');if(w)w.style.display='none';resize();setQuality(QC.tier)}catch(e){failed=true;ok=false;console.warn('[boucle] flaque 3D indisponible :',e&&e.message)}
  }
  function resize(){
    if(!ok)return;const w=cv.clientWidth,h=cv.clientHeight;if(!w||!h)return;
    renderer.setSize(w,h,false);cam.aspect=w/h;
    if(w/h<.9){cam.fov=44;cam.userData.base=[2.0,2.4,16.5]}else{cam.fov=36;cam.userData.base=[2.6,2.1,10.6]}
    pMat.uniforms.uScale.value=h*.9;
    placeCam(0);cam.updateProjectionMatrix();layoutZones();
  }
  function placeCam(dt){
    const b=cam.userData.base||[2.6,2.1,10.6];
    sway.x+=(mxx()-sway.x)*(1-Math.exp(-dt*4));sway.y+=(myy()-sway.y)*(1-Math.exp(-dt*4));
    cam.position.set(b[0]+sway.x*.7,b[1]+sway.y*.3,b[2]);cam.lookAt(0,1.2,0);
  }
  const mxx=()=>reduce?0:mx,myy=()=>reduce?0:my;
  function toScreen(x,y,z){tmpV.set(x,y,z).project(cam);return [(tmpV.x*.5+.5)*cv.clientWidth,(-tmpV.y*.5+.5)*cv.clientHeight]}
  /* zones tactiles : moitié gauche et moitié droite de la flaque */
  function layoutZones(){
    if(!ok)return;cam.updateMatrixWorld();
    const L=toScreen(-RX,0,0),C=toScreen(0,0,0),R=toScreen(RX,0,0),F=toScreen(0,0,-RZ),N=toScreen(0,0,RZ);
    const top=Math.min(F[1],N[1])-30,h=Math.abs(N[1]-F[1])+60,W=cv.clientWidth;
    const l0=Math.max(0,L[0]),r1=Math.min(W,R[0]);   // les zones restent dans l'écran, même quand la flaque le dépasse
    $('#sideL').style.cssText=`left:${l0}px;top:${top}px;width:${Math.max(0,C[0]-l0)}px;height:${h}px`;
    $('#sideR').style.cssText=`left:${C[0]}px;top:${top}px;width:${Math.max(0,r1-C[0])}px;height:${h}px`;
  }
  function screenToWorld(cx,cy){
    cam.updateMatrixWorld();const w=cv.clientWidth,h=cv.clientHeight;
    ray.setFromCamera(new THREE.Vector2(cx/w*2-1,-(cy/h)*2+1),cam);
    const pt=new THREE.Vector3();if(!ray.ray.intersectPlane(pl,pt))return null;
    const q=Math.hypot(pt.x/RX,pt.z/RZ);if(q>.92){pt.x*=.92/q;pt.z*=.92/q}return pt;
  }
  function ripple(x,z,a){RIP.push({x,z,t:0,a});if(RIP.length>24)RIP.shift()}
  function rippleScreen(cx,cy,a){const p=screenToWorld(cx,cy);if(p)ripple(p.x,p.z,a)}
  function pointer(cx,cy,on){if(!ok)return;if(!on){ptrT.z=0;return}const p=screenToWorld(cx,cy);if(!p){ptrT.z=0;return}ptrT.set(p.x,p.z,1)}   // curseur sur la flaque : l'eau se déforme autour
  const curT=new THREE.Vector3(),curV=new THREE.Vector3();   // curseur libre sur le sol (x, z, force), sans limite à la flaque : pilote le temps des gouttes
  function cursor(cx,cy,on){if(!ok)return;if(!on){curT.z=0;return}const r=cv.getBoundingClientRect();if(!r.width)return;cam.updateMatrixWorld();ray.setFromCamera(new THREE.Vector2((cx-r.left)/r.width*2-1,-((cy-r.top)/r.height)*2+1),cam);const pt=new THREE.Vector3();if(!ray.ray.intersectPlane(pl,pt)||Math.hypot(pt.x,pt.z)>16){curT.z=0;return}curT.set(pt.x,pt.z,1)}
  function rainRipple(){const a=Math.random()*6.283,r=Math.sqrt(Math.random())*.85;ripple(Math.cos(a)*RX*r,Math.sin(a)*RZ*r,.35)}
  function burst(x,z,amp){
    let n=Math.round(40*Math.min(amp,1.7)*[1,.55,.3][QC.tier]),i=0;
    for(const pt of PARTS){ if(pt.life<=0&&n>0){spawn(pt,x,z,amp);n--} }
    while(n>0&&PARTS.length<NP){const pt={life:0};PARTS.push(pt);spawn(pt,x,z,amp);n--}
  }
  function spawn(p,x,z,amp){
    const side=Math.random()<.5?-1:1,sp=(1.6+Math.random()*3.4)*Math.sqrt(amp);
    p.x=x+(Math.random()-.5)*.5;p.y=.06;p.z=z+(Math.random()-.5)*.4;
    p.vx=side*sp+(Math.random()-.5)*1.4;p.vz=(Math.random()-.5)*3;p.vy=3.2+Math.random()*4.4;
    p.life=1.7;p.size=.05+Math.random()*.1;p.id=Math.random()*50;
  }
  function impact(x,z,amp){ripple(x,z,amp);ripple(x,z,amp*.6);RIP[RIP.length-1].t=-.12;burst(x,z,amp);splashSound();haptic(12)}
  function impactScreen(cx,cy,amp){const p=screenToWorld(cx,cy);if(p)impact(p.x,p.z,amp)}
  /* --- pas : deux pieds en alternance, pilotés par le défilement --- */
  function pose(l,dt,still){
    const phi=l*8;
    shoes.forEach((s,f)=>{
      const u=((phi*.5-f*.5)%1+1)%1;let lift=0,xo,pitch=0;
      if(u<.5){const t=u/.5;lift=Math.sin(Math.PI*t)*1.45;xo=-.45+.9*(1-Math.cos(Math.PI*t))/2;pitch=-.42*Math.sin(Math.PI*t)}
      else{const t=(u-.5)/.5;xo=.45-.9*t}
      s.position.x=xo+(f?.35:-.35);s.position.y=lift;s.rotation.z=pitch;
      const m=mirrors[f];m.position.set(s.position.x,-lift-.2,s.position.z);m.rotation.z=-pitch;
      if(!still&&dt>0){
        const pu=prevU[f];
        if(pu<.5&&u>=.5&&u-pu<.3){impact(pair.position.x+s.position.x+.6,s.position.z,1)}
      }
      prevU[f]=u;
    });
    pair.rotation.y+=(((reduce?0:mx)*.35+.12)-pair.rotation.y)*(dt>0?1-Math.exp(-dt*5):1);
    pair.rotation.x=(reduce?0:my)*.06;
  }
  /* --- gouttelettes en suspension (InstancedMesh) : près du centre d'une zone cible, le temps de la goutte ralentit de façon exponentielle (easeOutExpo sur la distance) ; le curseur proche la soulève très lentement et la fait onduler. Coupé sous prefers-reduced-motion. --- */
  const ND=[28,20,12][QC.tier]*3,ZR=2.6,dummy=new THREE.Object3D(),DROPS=[];let dropMesh=null;
  function dropInit(){
    const m=new THREE.MeshBasicMaterial({color:0x2A6F8C,transparent:true,opacity:.75,depthWrite:false});   // comme la pluie du dernier cairn : fines gouttes étirées, matériau simple
    dropMesh=new THREE.InstancedMesh(new THREE.SphereGeometry(1,6,4),m,ND);dropMesh.frustumCulled=false;dropMesh.renderOrder=3;dropMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);dropMesh.count=0;scene.add(dropMesh);
    for(let i=0;i<ND;i++)DROPS.push({z:i%3===1?1:0,amb:i%3===2,x:0,y:0,zz:0,vy:0,r:0,id:Math.random()*50,a:0});
    DROPS.forEach(d=>dropSpawn(d,true));
  }
  function dropSpawn(d,seed){
    if(d.amb){d.x=(Math.random()*2-1)*RX*.95;d.zz=(Math.random()*2-1)*RZ*.9;d.y=seed?.3+Math.random()*2.6:2.2+Math.random()*.8;d.vy=-1.2;d.r=.011+Math.random()*.011;d.a=0;d.age=0;return}   // pluie ambiante : tombe partout sur la flaque, seul le curseur change son temps
    const cx=d.z?2.6:-2.6,a=Math.random()*6.283,rho=ZR*(.55+.45*Math.random());   // anneau autour de la zone : les gouttes glissent vers le centre et s'y figent
    d.x=cx+Math.cos(a)*rho;d.zz=Math.sin(a)*rho*.7;d.y=seed?.8+Math.random()*1.8:1.6+Math.random()*1.2;d.vy=0;d.r=.011+Math.random()*.011;d.a=0;d.age=0}
  const easeOutExpo=x=>1-Math.exp(-4.5*x*x);   // courbe exponentielle douce : le temps ralentit sur toute la zone (easeOutExpo pur saturait à 1 dès 30 % du rayon, donc invisible)
  function stepDrops(dt){
    if(!dropMesh)return;
    if(reduce){dropMesh.count=0;return}
    dt=Math.min(dt,.05);const k=busy?0:1,night=1-dayK;
    dropMesh.material.color.set(dayK>.5?0x2A6F8C:0xCFEFFF);dropMesh.material.opacity=.6+.2*dayK;
    let n=0;
    {const kk=Math.min(1,dt*10);curV.x+=(curT.x-curV.x)*kk;curV.y+=(curT.y-curV.y)*kk;curV.z+=(curT.z-curV.z)*Math.min(1,dt*9)}
    for(const d of DROPS){
      const cx=d.z?2.6:-2.6,dx=d.x-cx,dz=d.zz,dd=d.amb?9:Math.hypot(dx,dz,(d.y-.9)*.6);
      // temps de la goutte : zone cible (ralentit près du centre, d'autant plus que le curseur en est proche) ET bulle autour du curseur (easeOutExpo sur sa distance)
      const cd=Math.hypot(d.x-curV.x,d.zz-curV.y,(d.y-.8)*.5),cs=Math.max(0,curV.z);
      const tsC=1-cs*(1-(.03+.97*easeOutExpo(Math.min(1,cd/3.4))));
      let ts=tsC;
      if(!d.amb){const near=cs*Math.exp(-((curV.x-cx)*(curV.x-cx)+curV.y*curV.y)/(2*ZR*ZR*2.2)),str=.55+.45*Math.min(1,near*1.6);ts=Math.min(ts,1-str*(1-(.04+.96*easeOutExpo(Math.min(1,dd/ZR)))))}
      const pr=cs*Math.exp(-cd*cd/3);   // proximité du curseur : élévation et dérive
      const dts=dt*ts;
      d.vy=Math.max(-3.2,d.vy-(d.amb?4:1.8)*dts);d.age+=dt;
      if(!d.amb){const ix=-dx/(dd+.05),iz=-dz/(dd+.05);d.x+=ix*3*dts;d.zz+=iz*3*dts}   // glisse vers le centre, de plus en plus lentement
      d.y+=d.vy*dts+.25*pr*dt;
      d.x+=Math.sin(tNow*.8+d.id)*.16*pr*dt;d.zz+=Math.cos(tNow*.65+d.id*1.7)*.16*pr*dt;   // distorsion organique
      d.a+=((d.y>.02?1:0)-d.a)*Math.min(1,dt*4);
      if(d.y<=0){if(Math.random()<.5)ripple(d.x,d.zz,.16);dropSpawn(d,false);continue}
      if(d.y>3.1||d.age>16){dropSpawn(d,false);continue}
      const sq=1.6+ts*5.5,sz=d.r*d.a*k*(1+.12*Math.sin(tNow*1.6+d.id));   // goutte légèrement étirée dans sa chute
      dummy.position.set(d.x,d.y,d.zz);dummy.scale.set(sz,sz*sq,sz);dummy.updateMatrix();dropMesh.setMatrixAt(n++,dummy.matrix);
    }
    dropMesh.count=n;dropMesh.instanceMatrix.needsUpdate=true;
  }
  function stepSim(dt){
    for(let i=RIP.length-1;i>=0;i--){RIP[i].t+=dt;if(RIP[i].t>2.6)RIP.splice(i,1)}
    let k=0;
    PARTS.forEach((p,i)=>{
      if(p.life>0){p.life-=dt;p.vy-=13*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;
        if(p.y<0&&p.vy<0){p.life=0;if(Math.random()<.25)ripple(p.x,p.z,.3)}}
      const a=p.life>0?Math.min(1,p.life*2.5):0;
      pPos[i*3]=p.x||0;pPos[i*3+1]=p.life>0?p.y:-100;pPos[i*3+2]=p.z||0;
      pSize[i]=(p.size||0)*(1+.5*Math.sin(tNow*9+(p.id||0)));pAl[i]=a;
    });
    pGeo.attributes.position.needsUpdate=true;pGeo.attributes.size.needsUpdate=true;pGeo.attributes.alpha.needsUpdate=true;
    stepDrops(dt);
  }
  function update(l,dt,still){
    if(!ok)return;
    pose(l,dt,still);stepSim(dt);placeCam(dt);
    pair.updateMatrixWorld(true);
    shoes.forEach((s,i)=>{const L=s.userData.lamp;if(!L)return;tmpV.set(L.p[0],L.p[1],L.p[2]);s.localToWorld(tmpV);lampP[i].copy(tmpV);lampL[i].position.copy(tmpV);s.getWorldQuaternion(tmpQ);lampD[i].set(L.d[0],L.d[1],L.d[2]).applyQuaternion(tmpQ).normalize()});
    ripBuf.fill(0);for(let i=0;i<8;i++)ripBuf[i*4+2]=-1;
    RIP.slice(-8).forEach((r,i)=>{ripBuf[i*4]=r.x;ripBuf[i*4+1]=r.z;ripBuf[i*4+2]=r.t;ripBuf[i*4+3]=r.a});
    {const kk=Math.min(1,dt*10);ptrV.x+=(ptrT.x-ptrV.x)*kk;ptrV.y+=(ptrT.y-ptrV.y)*kk;ptrV.z+=((reduce?0:ptrT.z)-ptrV.z)*Math.min(1,dt*6)}
    gmat.uniforms.uT.value=tNow;
    {const tg=theme==='light'?1:0;dayK+=(tg-dayK)*Math.min(1,dt*5+(still?1:0));if(Math.abs(tg-dayK)<.005)dayK=tg;gmat.uniforms.uDay.value=dayK;hemiL.intensity=.6+.5*dayK;keyL.intensity=1.1+.4*dayK;rimL.intensity=1.5+.8*dayK;   // de jour le fond sable est très clair : la chaussure reçoit plus de lumière pour ne pas paraître sombre et plate
         // flaque de jour : eau claire, lignes de niveau et anneaux en encre
      if(topoSpr){const m=topoSpr.material,L=dayK>.5;if(m.userData.L!==L){m.userData.L=L;m.blending=L?THREE.NormalBlending:THREE.AdditiveBlending;m.color.set(L?0x12222B:0xffffff);m.opacity=L?.4:.5;m.needsUpdate=true}}
      inv.forEach(r=>{const L=dayK>.5;if(r.material.userData.L!==L){r.material.userData.L=L;r.material.blending=L?THREE.NormalBlending:THREE.AdditiveBlending;r.material.color.set(L?0xB23F27:0xE26D3B);r.material.needsUpdate=true;const fx=r.userData.fx;if(fx)[fx.halo].forEach(m=>{m.material.blending=L?THREE.NormalBlending:THREE.AdditiveBlending;m.material.color.set(L?0x2A6F8C:0xCFEFFF);m.material.needsUpdate=true})}})}
    inv.forEach((r,i)=>{const fx=r.userData.fx;if(!fx)return;const k=busy?0:1,L=dayK>.5,se=$(i?'#sideR':'#sideL'),hv=se&&se.matches(':hover,:focus-visible')?1:0;   // survol ou focus de la zone : le halo se renforce (retour visuel)
      fx.hv=(fx.hv||0)+(hv-(fx.hv||0))*Math.min(1,dt*8);
      if(!reduce&&!busy){fx.nr=(fx.nr===undefined?i*1.4:fx.nr)-dt;if(fx.nr<=0){fx.nr=hv?1.1:3.4;ripple(r.position.x+(Math.random()-.5)*.4,(Math.random()-.5)*.4,hv?.42:.2)}}   // vraies ondes dans le shader d'eau (reflets du ciel qui se déforment) : au repos toutes les ~3 s, au survol / focus toutes les ~1 s, plus marquées   // halo qui respire et trois ondes décalées (≈ 3 s) ; mouvement réduit : halo fixe, une onde figée
      fx.halo.material.opacity=k*((reduce?.1:.07+.04*Math.sin(tNow*1.4+i*2))*(L?1.8:1)+.1*fx.hv);   // voile d'eau translucide
      {const fv=se&&se.matches(':focus-visible')?1:0;fx.fv=(fx.fv||0)+(fv-(fx.fv||0))*Math.min(1,dt*10);const mm=fx.foc.material;
        if(mm.userData.L!==L){mm.userData.L=L;mm.blending=THREE.NormalBlending;mm.color.set(L?0x12222B:0xF2EEE6);mm.needsUpdate=true}   // encre de jour, clair de nuit : ≥ 3:1 sur l'eau
        mm.opacity=k*fx.fv*.95;fx.foc.scale.setScalar(.8)}});
    renderer.render(scene,cam);
  }
  function setQuality(t){
    if(!ok)return;renderer.setPixelRatio(Math.min(devicePixelRatio,QDPR()));
    mirrors.forEach(m=>m.visible=t<2);
    [pair,...mirrors].forEach(r=>r.traverse(o=>{if(o.userData&&o.userData.bead)o.visible=t===0}));
    resize();
  }
  return {ready:()=>ok,ensure,update,resize,impactScreen,rippleScreen,pointer,cursor,rainRipple,layoutZones,setQuality,dispose(){if(ok)try{renderer.forceContextLoss();renderer.dispose()}catch(e){}}};
})();

/* ---------- Bivouac 3D : feu de camp, montre GPS, carnet, tasse ---------- */
const OK_THREE_COLOR=()=>THREE_OK?new THREE.Color():null;
const CAMP=(()=>{
  if(!THREE_OK)return {ready:()=>false,ensure(){},update(){},resize(){},stoke(){},setQuality(){},dispose(){}};
  const cv=$('#campCanvas'),sky4=$('#sky4');
  let renderer,scene,cam,ok=false,failed=false,light,logMat,ember,flames=[],bloom,fSys,sSys,mSys,qm=1,stokeT=0,stokeV=0,wind=0,acc={f:0,s:0,m:0,u:0};
  let hemi,fillL,moonL,sunL,capM,groundM,dayC=0,fireK=1;   // jour : dayC 0 (nuit, feu allumé) → 1 (jour, feu éteint)
  const _ca=OK_THREE_COLOR(),_cb=OK_THREE_COLOR();
  const hash=(x,y)=>{const v=Math.sin(x*127.1+y*311.7)*43758.5453;return v-Math.floor(v)};
  function tex(w,h,fn,rep){const c=document.createElement('canvas');c.width=w;c.height=h;fn(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;if(rep)t.repeat.set(rep,rep);t.anisotropy=4;return t}
  function sdRnd(sd){return()=>{sd=(sd*16807)%2147483647;return sd/2147483647}}
  const mossTex=()=>tex(512,512,(x,w,h)=>{
    x.fillStyle='#1F2F19';x.fillRect(0,0,w,h);const r=sdRnd(5);
    for(let i=0;i<140;i++){x.fillStyle=['rgba(52,84,36,.55)','rgba(68,104,44,.45)','rgba(14,22,10,.5)'][i%3];x.beginPath();x.arc(r()*w,r()*h,8+r()*30,0,6.283);x.fill()}
    for(let i=0;i<5000;i++){x.fillStyle=r()<.5?'rgba(96,140,62,.35)':'rgba(10,14,8,.4)';x.fillRect(r()*w,r()*h,1+r()*2,1+r()*3)}
    x.strokeStyle='rgba(90,62,34,.45)';x.lineWidth=1;for(let i=0;i<260;i++){const px=r()*w,py=r()*h,a=r()*6.283;x.beginPath();x.moveTo(px,py);x.lineTo(px+Math.cos(a)*10,py+Math.sin(a)*10);x.stroke()}
    for(let i=0;i<40;i++){x.fillStyle='rgba(120,118,108,.55)';x.beginPath();x.ellipse(r()*w,r()*h,3+r()*6,2+r()*4,r()*3,0,6.283);x.fill()}},7);

  const gravelTex=()=>tex(1024,1024,(X)=>{X.scale(2,2);const x=X,w=512,h=512;   // gravier sombre du bivouac : cailloux, éclats clairs, touffes d'herbe sèche
    x.fillStyle='#231C17';x.fillRect(0,0,w,h);const r=sdRnd(9);
    for(let i=0;i<46;i++){const px=r()*w,py=r()*h,rr=40+r()*90,c=r()<.5?'rgba(10,8,6,.34)':'rgba(70,56,44,.18)';   // grandes taches : casse la répétition du motif (dessinées aussi de l'autre côté du bord)
      [[0,0],[-w,0],[w,0],[0,-h],[0,h]].forEach(([ox,oy])=>{const g=x.createRadialGradient(px+ox,py+oy,0,px+ox,py+oy,rr);g.addColorStop(0,c);g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(px+ox-rr,py+oy-rr,rr*2,rr*2)})}
    for(let i=0;i<1400;i++){const g=26+r()*42|0;x.fillStyle=`rgba(${g+12},${g+5},${g-2},${.45+r()*.5})`;x.beginPath();x.ellipse(r()*w,r()*h,2+r()*8,1.5+r()*5,r()*3,0,6.283);x.fill()}
    for(let i=0;i<200;i++){const px=r()*w,py=r()*h,rr=2+r()*5;x.fillStyle='rgba(20,14,10,.55)';x.beginPath();x.ellipse(px+1.5,py+2,rr,rr*.7,0,0,6.283);x.fill();x.fillStyle=`rgba(${70+r()*30|0},${60+r()*25|0},${50+r()*20|0},.7)`;x.beginPath();x.ellipse(px,py,rr,rr*.72,r()*3,0,6.283);x.fill()}
    for(let i=0;i<6000;i++){x.fillStyle=r()<.5?'rgba(160,140,115,.18)':'rgba(8,6,4,.3)';x.fillRect(r()*w,r()*h,1,1+r()*1.5)}
    x.lineCap='round';for(let i=0;i<150;i++){const px=r()*w,py=r()*h;x.strokeStyle=`rgba(${70+r()*30|0},${78+r()*25|0},${38},.55)`;x.lineWidth=1;for(let b=0;b<4;b++){const a=-1.57+(r()-.5)*1.1,l=5+r()*9;x.beginPath();x.moveTo(px,py);x.lineTo(px+Math.cos(a)*l,py+Math.sin(a)*l);x.stroke()}}
  },6);
  const fabricTex=(base,rep)=>tex(256,256,(x,w,h)=>{   // toile technique : trame serrée, bruit fin
    x.fillStyle=base;x.fillRect(0,0,w,h);const r=sdRnd(21);
    for(let i=0;i<9000;i++){x.fillStyle=r()<.5?'rgba(255,255,255,.05)':'rgba(0,0,0,.13)';x.fillRect(r()*w,r()*h,1,2)}
    x.strokeStyle='rgba(0,0,0,.2)';x.lineWidth=1;for(let i=0;i<w;i+=3){x.beginPath();x.moveTo(i+.5,0);x.lineTo(i+.5,h);x.stroke()}for(let i=0;i<h;i+=3){x.beginPath();x.moveTo(0,i+.5);x.lineTo(w,i+.5);x.stroke()}
  },rep||2);
  const barkTex=()=>tex(128,256,(x,w,h)=>{x.fillStyle='#3A2A1E';x.fillRect(0,0,w,h);const r=sdRnd(31);
    for(let i=0;i<260;i++){x.strokeStyle=`rgba(${r()<.5?'18,10,6':'110,84,58'},${.18+r()*.3})`;x.lineWidth=1+r()*2.5;const px=r()*w;x.beginPath();x.moveTo(px,r()*h);x.lineTo(px+(r()-.5)*8,r()*h);x.stroke()}},1);
  const ringTex=()=>tex(128,128,(x,w,h)=>{const g=x.createRadialGradient(64,64,2,64,64,64);g.addColorStop(0,'#D9B98A');g.addColorStop(1,'#B8935F');x.fillStyle=g;x.fillRect(0,0,w,h);
    for(let i=1;i<14;i++){x.strokeStyle=`rgba(90,58,28,${.25+.2*(i%2)})`;x.lineWidth=1;x.beginPath();x.arc(64+(i%3-1),64,i*4.4,0,6.283);x.stroke()}
    x.strokeStyle='rgba(60,36,16,.55)';x.beginPath();x.moveTo(64,64);x.lineTo(64+30,64-22);x.stroke();x.strokeStyle='rgba(40,26,14,.8)';x.lineWidth=3;x.beginPath();x.arc(64,64,62,0,6.283);x.stroke()},1);

  function gravelMaps(t){   // relief et brillance du gravier déduits de la texture : normal map marquée + roughness map (cailloux clairs plus lisses, donc reflets rasants du feu)
    const c=t.image,w=c.width,h=c.height,d=c.getContext('2d').getImageData(0,0,w,h).data,H=new Float32Array(w*h);
    for(let i=0;i<w*h;i++)H[i]=(d[i*4]*.3+d[i*4+1]*.59+d[i*4+2]*.11)/255;
    const N=document.createElement('canvas'),R=document.createElement('canvas');N.width=R.width=w;N.height=R.height=h;
    const nx=N.getContext('2d'),rx=R.getContext('2d'),ni=nx.createImageData(w,h),ri=rx.createImageData(w,h),S=7;
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x,dx=H[y*w+(x+1)%w]-H[y*w+(x-1+w)%w],dy=H[((y+1)%h)*w+x]-H[((y-1+h)%h)*w+x];
      let a=-dx*S,b=dy*S,l=Math.hypot(a,b,1);a/=l;b/=l;const n=1/l;
      ni.data[i*4]=(a*.5+.5)*255;ni.data[i*4+1]=(b*.5+.5)*255;ni.data[i*4+2]=(n*.5+.5)*255;ni.data[i*4+3]=255;
      const v=H[i],q=Math.min(1,Math.max(0,(v-.12)/.28)),rg=(.96-.62*q*q*(3-2*q))*255;ri.data[i*4]=ri.data[i*4+1]=ri.data[i*4+2]=rg;ri.data[i*4+3]=255}
    nx.putImageData(ni,0,0);rx.putImageData(ri,0,0);
    const mk=cv=>{const tt=new THREE.CanvasTexture(cv);tt.wrapS=tt.wrapT=THREE.RepeatWrapping;tt.repeat.copy(t.repeat);tt.anisotropy=4;return tt};
    return {normal:mk(N),rough:mk(R)};
  }
  function logGeo(len,r,sd){   // bûche irrégulière : section bosselée, léger fléchissement, coupes obliques et inégales
    const g=new THREE.CylinderGeometry(r,r*1.05,len,18,10),p=g.attributes.position,rn=sdRnd(sd*13+7),ph=[rn()*6,rn()*6,rn()*6];
    for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),a=Math.atan2(z,x),k=1+.09*Math.sin(a*3+ph[0]+y*4)+.06*Math.sin(a*7+ph[1]-y*9)+.05*Math.sin(y*6+ph[2]);
      let yy=y;if(Math.abs(y)>len/2-1e-4)yy+=(y>0?1:-1)*(x*.07+.012*Math.sin(a*5+ph[0]));
      p.setXYZ(i,x*k+Math.sin(y*3+ph[1])*.012,yy,z*k)}
    g.computeVertexNormals();return g;
  }
  const charTex=(emis)=>tex(256,256,(x,w,h)=>{   // bois brûlé : écailles de charbon noires, fissures qui rougeoient (carte émissive)
    x.fillStyle=emis?'#000':'#1B1411';x.fillRect(0,0,w,h);const r=sdRnd(emis?61:62);
    if(!emis){for(let i=0;i<500;i++){const g=14+r()*30|0;x.fillStyle=`rgba(${g+8},${g+4},${g},.8)`;x.fillRect(r()*w,r()*h,3+r()*10,2+r()*5)}}
    x.lineCap='round';for(let i=0;i<70;i++){let px=r()*w,py=r()*h,a=r()*6.283;x.strokeStyle=emis?`rgba(255,${90+r()*70|0},20,${.55+r()*.45})`:'rgba(0,0,0,.7)';x.lineWidth=emis?1+r()*2.2:1+r()*2;x.beginPath();x.moveTo(px,py);for(let k=0;k<7;k++){a+=(r()-.5)*1.1;px+=Math.cos(a)*(6+r()*10);py+=Math.sin(a)*(6+r()*10);x.lineTo(px,py)}x.stroke()}
  },1);
  const glowTex=()=>{const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d'),g=x.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(255,170,80,.9)');g.addColorStop(.25,'rgba(255,120,30,.45)');g.addColorStop(.6,'rgba(220,70,10,.12)');g.addColorStop(1,'rgba(160,30,0,0)');x.fillStyle=g;x.fillRect(0,0,128,128);return new THREE.CanvasTexture(c)};
  const watchScreen=()=>tex(256,256,(x,w,h)=>{   // écran de montre GPS : tracé, altitude
    x.fillStyle='#07150F';x.fillRect(0,0,w,h);
    x.strokeStyle='rgba(120,230,190,.22)';x.lineWidth=1;for(let k=1;k<7;k++){x.beginPath();for(let a=0;a<=60;a++){const th=a/60*6.283,rr=18*k*(1+.12*Math.sin(3*th+k*.5));a?x.lineTo(150+rr*Math.cos(th)*1.1,92+rr*Math.sin(th)*.8):x.moveTo(150+rr*Math.cos(th)*1.1,92+rr*Math.sin(th)*.8)}x.closePath();x.stroke()}
    x.strokeStyle='#E8864A';x.lineWidth=4;x.lineJoin='round';x.beginPath();[[46,150],[70,128],[96,138],[120,104],[150,112],[176,78],[206,70]].forEach(([a,b],i)=>i?x.lineTo(a,b):x.moveTo(a,b));x.stroke();
    x.fillStyle='#F5EBDD';x.beginPath();x.arc(206,70,6,0,6.283);x.fill();
    x.textAlign='center';x.fillStyle='rgba(180,230,210,.8)';x.font='500 22px "JetBrains Mono", monospace';x.fillText('ALT',128,186);
    x.fillStyle='#F5EBDD';x.font='700 48px "JetBrains Mono", monospace';x.fillText('277 m',128,232);
  },1);
  function buildWatchGps(env){   // montre GPS posée à plat, écran rétroéclairé
    const g=new THREE.Group(),scr=watchScreen();
    const body=new THREE.Mesh(new THREE.CylinderGeometry(.5,.52,.16,48),new THREE.MeshStandardMaterial({color:0x23272C,roughness:.42,metalness:.65,envMap:env,envMapIntensity:1}));g.add(body);
    const bez=new THREE.Mesh(new THREE.TorusGeometry(.47,.045,10,48),new THREE.MeshStandardMaterial({color:0xA9B1B8,roughness:.3,metalness:.9,envMap:env,envMapIntensity:1.3}));bez.rotation.x=Math.PI/2;bez.position.y=.085;g.add(bez);
    const gl=new THREE.Mesh(new THREE.CircleGeometry(.43,48),new THREE.MeshStandardMaterial({map:scr,emissive:0xFFFFFF,emissiveMap:scr,emissiveIntensity:.85,roughness:.12,metalness:0}));gl.rotation.x=-Math.PI/2;gl.position.y=.083;g.add(gl);
    [-.7,-.25,.25,.7].forEach((a,i)=>{const bt=new THREE.Mesh(new THREE.BoxGeometry(.1,.08,.16),new THREE.MeshStandardMaterial({color:0x3A3F45,roughness:.5,metalness:.7}));bt.position.set(i<2?.54:-.54,.01,i<2?(i?.3:-.3):(i===2?-.3:.3));g.add(bt)});
    const sm=new THREE.MeshStandardMaterial({map:fabricTex('#1E2126',3),roughness:.9});
    [-1,1].forEach(sg=>{const st=new THREE.Mesh(roundBox(.46,.05,.95,.02),sm);st.position.set(0,-.05,sg*(.52+.45));st.rotation.x=sg*.04;g.add(st)});
    const lp=new THREE.Mesh(roundBox(.5,.07,.1,.02),new THREE.MeshStandardMaterial({color:0xE26D3B,roughness:.6}));lp.position.set(0,-.02,1.1);g.add(lp);
    return g;
  }
  function roundBox(w,h,d,r,seg){   // pavé aux arêtes arrondies (sac, poches)
    const g=new THREE.BoxGeometry(w,h,d,seg||8,seg||8,seg||8),p=g.attributes.position,v=new THREE.Vector3(),c=new THREE.Vector3(),hx=w/2-r,hy=h/2-r,hz=d/2-r;
    for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);c.set(Math.max(-hx,Math.min(hx,v.x)),Math.max(-hy,Math.min(hy,v.y)),Math.max(-hz,Math.min(hz,v.z)));v.sub(c);if(v.lengthSq()>0)v.normalize().multiplyScalar(r);v.add(c);p.setXYZ(i,v.x,v.y,v.z)}
    g.computeVertexNormals();return g;
  }
  function buildNotebook(){
    const g=new THREE.Group(),r0=sdRnd(11);
    const cover=tex(256,192,(x,w,h)=>{
      x.fillStyle='#5B3A22';x.fillRect(0,0,w,h);
      for(let i=0;i<3500;i++){x.fillStyle=r0()<.55?'rgba(25,12,4,'+(.12+r0()*.15)+')':'rgba(255,200,140,'+(.05+r0()*.08)+')';x.beginPath();x.arc(r0()*w,r0()*h,.5+r0()*1.4,0,6.283);x.fill()}
      const e=x.createLinearGradient(0,0,w,h);e.addColorStop(0,'rgba(255,210,150,.18)');e.addColorStop(.5,'rgba(0,0,0,0)');e.addColorStop(1,'rgba(0,0,0,.22)');x.fillStyle=e;x.fillRect(0,0,w,h);
      for(let i=0;i<14;i++){x.strokeStyle='rgba(222,190,150,'+(.1+r0()*.2)+')';x.lineWidth=1+r0()*2;x.beginPath();const px=r0()*w,py=r0()*h;x.moveTo(px,py);x.lineTo(px+20+r0()*50,py+(r0()-.5)*30);x.stroke()}
      x.setLineDash([7,5]);x.strokeStyle='rgba(232,216,184,.75)';x.lineWidth=1.6;x.strokeRect(12,12,w-24,h-24);x.setLineDash([]);
      x.textAlign='center';x.font='italic 400 30px "Cordée Serif", "DM Serif Display", Georgia, serif';x.fillStyle='rgba(255,230,190,.35)';x.fillText('Carnet',w/2+1,h/2+13);x.fillStyle='rgba(28,14,5,.8)';x.fillText('Carnet',w/2,h/2+12);
      x.strokeStyle='rgba(28,14,5,.7)';x.lineWidth=2;x.beginPath();x.arc(w/2,h/2-28,14,0,6.283);x.stroke();x.beginPath();x.moveTo(w/2,h/2-40);x.lineTo(w/2+4,h/2-28);x.lineTo(w/2,h/2-16);x.lineTo(w/2-4,h/2-28);x.closePath();x.stroke()},1);
    const side=new THREE.MeshStandardMaterial({color:0x4A2E1A,roughness:.85}),top=new THREE.MeshStandardMaterial({map:cover,roughness:.8});
    g.add(new THREE.Mesh(new THREE.BoxGeometry(.7,.08,.5),[side,side,top,side,side,side]));
    const pg=new THREE.Mesh(new THREE.BoxGeometry(.66,.05,.46),new THREE.MeshStandardMaterial({color:0xE9DFC8,roughness:.9}));pg.position.set(.02,-.005,.0);g.add(pg);
    const band=new THREE.Mesh(new THREE.BoxGeometry(.03,.088,.5),new THREE.MeshStandardMaterial({color:0x14100C,roughness:.7}));band.position.x=.22;g.add(band);
    return g;
  }
  function buildAxe(env){
    const g=new THREE.Group();
    const steel=new THREE.MeshStandardMaterial({color:0xA0A8AE,metalness:.85,roughness:.35,envMap:env,envMapIntensity:1.1});
    const shaft=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,1.45,12),new THREE.MeshStandardMaterial({color:0x2B4A6B,roughness:.5,metalness:.35}));g.add(shaft);
    const pk=new THREE.Shape();pk.moveTo(0,0);pk.quadraticCurveTo(.22,.06,.36,-.07);pk.lineTo(.31,-.08);pk.quadraticCurveTo(.2,0,0,-.04);pk.closePath();
    const pg=new THREE.ExtrudeGeometry(pk,{depth:.035,bevelEnabled:false});pg.translate(0,0,-.0175);
    const pick=new THREE.Mesh(pg,steel);pick.position.y=.72;g.add(pick);
    const ad=new THREE.Mesh(new THREE.BoxGeometry(.13,.05,.035),steel);ad.position.set(-.08,.72,0);g.add(ad);
    const sp=new THREE.Mesh(new THREE.ConeGeometry(.03,.12,8),steel);sp.position.y=-.78;sp.rotation.z=Math.PI;g.add(sp);
    const grip=new THREE.Mesh(new THREE.CylinderGeometry(.036,.036,.3,12),new THREE.MeshStandardMaterial({color:0xE26D3B,roughness:.8}));grip.position.y=-.35;g.add(grip);
    return g;
  }
  function buildMug(env){
    const g=new THREE.Group();
    const pts=[[0.001,0],[.12,0],[.13,.02],[.135,.17],[.142,.18],[.135,.186],[.12,.17],[.112,.03],[0.001,.022]].map(([r,y])=>new THREE.Vector2(r,y));
    const enamel=new THREE.MeshStandardMaterial({color:0xC4CAD0,roughness:.2,metalness:.8,side:THREE.DoubleSide,envMap:env,envMapIntensity:1.7});   // tasse en acier brossé
    g.add(new THREE.Mesh(new THREE.LatheGeometry(pts,28),enamel));
    const rim=new THREE.Mesh(new THREE.TorusGeometry(.139,.008,8,28),new THREE.MeshStandardMaterial({color:0x8E959C,metalness:.8,roughness:.35}));rim.rotation.x=Math.PI/2;rim.position.y=.182;g.add(rim);
    const h=new THREE.Mesh(new THREE.TorusGeometry(.06,.013,8,16,Math.PI),enamel);h.position.set(.14,.09,0);h.rotation.z=-Math.PI/2;g.add(h);
    const cof=new THREE.Mesh(new THREE.CircleGeometry(.118,24),new THREE.MeshStandardMaterial({color:0x2A1608,roughness:.15,metalness:.1,emissive:0x1A0C04,envMap:env}));cof.rotation.x=-Math.PI/2;cof.position.y=.158;g.add(cof);
    return g;
  }

  function buildPack(env){   // sac de trail (gilet de course) : dos fin à poche en filet et laçage élastique, bretelles larges, flasques souples à l'avant
    const g=new THREE.Group(),fab=(c,rp)=>new THREE.MeshStandardMaterial({map:fabricTex(c,rp),roughness:.9,metalness:0}),
      shell=fab('#2A2F38',3),harn=fab('#353B46',4),mesh=fab('#14171C',6),acc=new THREE.MeshStandardMaterial({color:0xE26D3B,roughness:.55}),
      refl=new THREE.MeshStandardMaterial({color:0xC9D1D6,roughness:.25,metalness:.6,envMap:env,envMapIntensity:.8}),
      flask=new THREE.MeshStandardMaterial({color:0xE6F0F6,roughness:.18,metalness:0,transparent:true,opacity:.5,depthWrite:false,envMap:env,envMapIntensity:1.1}),
      water=new THREE.MeshStandardMaterial({color:0x6FA9C9,roughness:.1,metalness:0,transparent:true,opacity:.55,depthWrite:false}),
      valve=new THREE.MeshStandardMaterial({color:0x1C1F24,roughness:.5});
    const add=(geo,m,x,y,z)=>{const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);g.add(o);return o};
    const lathe=(pts,flat)=>{const ge=new THREE.LatheGeometry(pts.map(([r,y])=>new THREE.Vector2(r,y)),28);ge.scale(1,1,flat);ge.computeVertexNormals();return ge};   // profil tourné puis aplati : poche souple
    const FLASK_GEO=lathe([[0,0],[.024,.002],[.037,.012],[.042,.04],[.043,.15],[.04,.19],[.03,.224],[.018,.248],[.013,.258],[.013,.272]],.32),
      WATER_GEO=lathe([[0,.006],[.022,.008],[.033,.017],[.038,.04],[.039,.15],[0,.153]],.27);
    const cord=(A,B,m,r)=>{const a=new THREE.Vector3(...A),d=new THREE.Vector3(...B).sub(a),o=new THREE.Mesh(new THREE.CylinderGeometry(r||.007,r||.007,d.length(),6),m);
      o.position.copy(a).addScaledVector(d,.5);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());g.add(o);return o};
    // dos : panneau fin (12 L environ) affiné vers les épaules, poche en filet extensible, laçage élastique croisé, bande réfléchissante
    {const gb=roundBox(.5,.64,.15,.07),q=gb.attributes.position;for(let i=0;i<q.count;i++)q.setX(i,q.getX(i)*(1-.22*Math.max(0,q.getY(i)/.32)));gb.computeVertexNormals();add(gb,shell,0,.35,0)}
    add(roundBox(.42,.44,.05,.04),mesh,0,.3,.085);
    const ys=[.5,.42,.34,.26,.18];for(let k=0;k<ys.length-1;k++)cord([k%2?.18:-.18,ys[k],.115],[k%2?-.18:.18,ys[k+1],.115],acc,.011);
    add(new THREE.BoxGeometry(.2,.018,.01),refl,0,.6,.08);
    // bretelles : passent sur les épaules et redescendent à l'avant en plastron
    [-1,1].forEach(sx=>{
      add(roundBox(.13,.05,.3,.024),harn,sx*.16,.66,-.12);   // épaule
      add(roundBox(.15,.44,.045,.02),harn,sx*.17,.43,-.29);   // plastron
      add(roundBox(.07,.18,.28,.03),harn,sx*.25,.17,-.14);   // aile latérale
      // flasque souple de 500 mL dans la poche de poitrine : corps plat qui s'affine en col, eau aux deux tiers, bouchon et embout
      const fl=new THREE.Group();fl.position.set(sx*.17,.39,-.33);fl.rotation.z=sx*.06;g.add(fl);
      const body=new THREE.Mesh(FLASK_GEO,flask);body.renderOrder=3;fl.add(body);
      const wt=new THREE.Mesh(WATER_GEO,water);wt.renderOrder=2;fl.add(wt);
      const cap=new THREE.Mesh(new THREE.CylinderGeometry(.016,.016,.02,16),valve);cap.position.y=.281;fl.add(cap);
      const bite=new THREE.Mesh(new THREE.CylinderGeometry(.007,.01,.042,12),acc);bite.position.set(sx*.004,.31,0);bite.rotation.z=-sx*.18;fl.add(bite);
      add(roundBox(.16,.2,.05,.02),mesh,sx*.17,.33,-.335);   // poche basse en filet
    });
    // sangles de poitrine (deux, réglables) et petit sifflet cuivré
    [.58,.47].forEach(y=>add(new THREE.BoxGeometry(.3,.018,.012),acc,0,y,-.32));
    add(new THREE.CylinderGeometry(.012,.012,.05,8),acc,.05,.47,-.335).rotation.z=Math.PI/2;
    g.traverse(o=>{if(o.isMesh)o.castShadow=false});
    return g;
  }
  function buildLogs(){   // petit tas de bois : bûches coupées, bout clair avec cernes
    const g=new THREE.Group(),sd=sdRnd(41),bark=new THREE.MeshStandardMaterial({map:barkTex(),bumpMap:barkTex(),bumpScale:.05,roughness:1}),cap=new THREE.MeshStandardMaterial({color:0xA89A88,map:ringTex(),roughness:.9});
    const L=[[.12,-.2,0],[.12,0,.04],[.12,.2,-.03],[.29,-.1,.02],[.29,.1,0],[.46,0,.03]];
    L.forEach(([y,z,jx],i)=>{const len=.62+sd()*.14,r=.085+sd()*.02,lg=new THREE.Mesh(logGeo(len,r,i+3),[bark,cap,cap]);lg.rotation.z=Math.PI/2;lg.rotation.y=(sd()-.5)*.25;lg.position.set(jx,y,z);g.add(lg)});
    return g;
  }
  function buildCloth(){   // tissu plié sur la dalle
    const geo=new THREE.PlaneGeometry(1.7,1.25,28,20),p=geo.attributes.position;
    for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i);p.setZ(i,.014*Math.sin(x*6.5+y*2.3)+.01*Math.sin(x*13+y*7)+.02*Math.max(0,x-.5))}
    geo.computeVertexNormals();geo.rotateX(-Math.PI/2);
    return new THREE.Mesh(geo,new THREE.MeshStandardMaterial({map:fabricTex('#4B515B',4),roughness:1,side:THREE.DoubleSide}));
  }
  const FLV='varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}';
  const FLF=`precision highp float;varying vec2 vUv;uniform float uT;uniform float uS;
  float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),f.x),f.y);}
  void main(){
    float y=vUv.y;float sway=(n(vec2(y*2.6,uT*1.6))-.5)*.5*y;float x=(vUv.x-.5)+sway;
    float w=(1.-pow(y,.75))*(.35+.65*smoothstep(0.,.22,y))*.5;
    float nz=n(vec2(vUv.x*4.,y*5.-uT*4.2))*.6+n(vec2(vUv.x*10.,y*12.-uT*7.5))*.4;
    float d=abs(x)/max(w,.001);
    float shape=smoothstep(1.,.15,d+(nz-.5)*.7*(y+.15));
    shape*=smoothstep(1.,.78,y+(nz-.5)*.3)*smoothstep(0.,.05,y);
    float t=clamp(y*1.3+(nz-.5)*.35+d*.4,0.,1.);
    vec3 col=mix(vec3(1.,.95,.66),vec3(1.,.55,.12),smoothstep(.08,.42,t));col=mix(col,vec3(.8,.13,.02),smoothstep(.5,1.,t));
    gl_FragColor=vec4(col*shape*1.35*uS,shape*(1.-y*.4)*.92);
  }`;
  function buildFlame(o,sc){
    const geo=new THREE.PlaneGeometry(1.05,1.75);geo.translate(0,.875,0);
    const m=new THREE.Mesh(geo,new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uT:{value:0},uS:{value:1}},vertexShader:FLV,fragmentShader:FLF}));
    m.userData.o=o;m.scale.setScalar(sc);m.renderOrder=2;return m;
  }
  function topoBg(){   // courbes de niveau fines dans le ciel (même motif que la page d'accueil)
    const c=document.createElement('canvas');c.width=1400;c.height=520;const x=c.getContext('2d'),r=sdRnd(77),ph=[r()*6,r()*6,r()*6];
    for(let k=0;k<22;k++){const R=40+k*26,al=Math.max(.05,.2-.006*k);x.strokeStyle='rgba(255,236,214,'+al+')';x.lineWidth=1.1;x.beginPath();
      for(let a=0;a<=140;a++){const th=a/140*Math.PI*2,rr=R*(1+.16*Math.sin(3*th+ph[0]+k*.07)+.09*Math.sin(5*th+ph[1])+.05*Math.sin(8*th+ph[2]+k*.1)),px=420+rr*1.7*Math.cos(th),py=120+rr*.8*Math.sin(th);a?x.lineTo(px,py):x.moveTo(px,py)}x.closePath();x.stroke()}
    for(let k=0;k<14;k++){const R=30+k*30,al=Math.max(.04,.16-.006*k);x.strokeStyle='rgba(255,236,214,'+al+')';x.beginPath();
      for(let a=0;a<=140;a++){const th=a/140*Math.PI*2,rr=R*(1+.14*Math.sin(3*th+ph[2]+k*.09)+.08*Math.sin(6*th+ph[0])),px=1150+rr*1.5*Math.cos(th),py=60+rr*.7*Math.sin(th);a?x.lineTo(px,py):x.moveTo(px,py)}x.closePath();x.stroke()}
    x.globalCompositeOperation='destination-in';const gr=x.createLinearGradient(0,0,0,520);gr.addColorStop(0,'rgba(0,0,0,1)');gr.addColorStop(.6,'rgba(0,0,0,.5)');gr.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=gr;x.fillRect(0,0,1400,520);
    return 'url('+c.toDataURL('image/png')+')';
  }
  const PVS='attribute float size;attribute float age;varying float vAge;uniform float uScale;void main(){vAge=age;vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=size*uScale/-mv.z;gl_Position=projectionMatrix*mv;}';
  const FFS=`precision highp float;varying float vAge;
  void main(){vec2 c=gl_PointCoord-.5;float d=length(c);float a=smoothstep(.5,.04,d);
    vec3 col=mix(vec3(1.,.95,.62),vec3(1.,.45,.08),smoothstep(0.,.45,vAge));col=mix(col,vec3(.55,.08,.02),smoothstep(.45,1.,vAge));
    float fade=(1.-vAge)*smoothstep(0.,.06,vAge+.03);gl_FragColor=vec4(col*a*1.3,a*fade*.7);}`;
  const SFS=`precision highp float;varying float vAge;
  void main(){vec2 c=gl_PointCoord-.5;float d=length(c);float a=smoothstep(.5,.0,d);float cr=smoothstep(.05,.0,abs(c.x))*smoothstep(.5,.1,abs(c.y))+smoothstep(.05,.0,abs(c.y))*smoothstep(.5,.1,abs(c.x));
    vec3 col=mix(vec3(1.,.9,.55),vec3(1.,.4,.1),vAge);gl_FragColor=vec4(col*(a+cr*.8),(a+cr*.6)*(1.-vAge));}`;
  const MFS=`precision highp float;varying float vAge;
  void main(){vec2 c=gl_PointCoord-.5;float d=length(c);float a=smoothstep(.5,.0,d);gl_FragColor=vec4(vec3(.75,.72,.68),a*.11*(1.-vAge)*smoothstep(0.,.15,vAge+.02));}`;
  function mkSys(n,fs,blend){
    const g=new THREE.BufferGeometry(),pos=new Float32Array(n*3),size=new Float32Array(n),age=new Float32Array(n);
    for(let i=0;i<n;i++)pos[i*3+1]=-100;
    g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('size',new THREE.BufferAttribute(size,1));g.setAttribute('age',new THREE.BufferAttribute(age,1));
    const m=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:blend,uniforms:{uScale:{value:700}},vertexShader:PVS,fragmentShader:fs});
    const pts=new THREE.Points(g,m);pts.frustumCulled=false;
    return {g,pos,size,age,m,pts,n,P:Array.from({length:n},()=>({life:0,t:1})),cur:0};
  }
  function emit(sys,init){for(let k=0;k<sys.n;k++){const p=sys.P[(sys.cur+k)%sys.n];if(p.t>=p.life){sys.cur=(sys.cur+k+1)%sys.n;p.t=0;init(p);return}}}
  function step(sys,dt,upd){
    sys.P.forEach((p,i)=>{
      if(p.t<p.life){p.t+=dt;if(p.t>=p.life){sys.pos[i*3+1]=-100;sys.size[i]=0;return}upd(p,dt,p.t/p.life)
        sys.pos[i*3]=p.x;sys.pos[i*3+1]=p.y;sys.pos[i*3+2]=p.z;sys.size[i]=p.sz;sys.age[i]=p.t/p.life}
    });
    sys.g.attributes.position.needsUpdate=true;sys.g.attributes.size.needsUpdate=true;sys.g.attributes.age.needsUpdate=true;
  }
  function simulate(dt){
    const st=stokeV;
    acc.f+=dt*(70+130*st)*Math.max(.55,qm)*fireK;acc.s+=dt*(14+42*st)*qm*fireK;acc.m+=dt*7*qm*(.45+.55*fireK);acc.u+=dt*9*qm;   // feu éteint (jour) : plus de flammes ni d'étincelles, un mince filet de fumée reste
    while(acc.f>=1){acc.f--;emit(fSys,p=>{const a=Math.random()*6.283,r=Math.random()*.2;p.x=Math.cos(a)*r;p.z=Math.sin(a)*r;p.y=.14;p.vx=(Math.random()-.5)*.4+wind*.3;p.vy=(.9+Math.random()*.9)*(1+.5*st);p.vz=(Math.random()-.5)*.4;p.life=.6+Math.random()*.6;p.s0=(.45+Math.random()*.4)*(1+.35*st);p.id=Math.random()*50})}
    while(acc.s>=1){acc.s--;emit(sSys,p=>{p.x=(Math.random()-.5)*.3;p.z=(Math.random()-.5)*.3;p.y=.3;p.vx=(Math.random()-.5)*.6+wind*.7;p.vy=2.2+Math.random()*3.4+st;p.vz=(Math.random()-.5)*.6;p.life=2.4+Math.random()*2.2;p.s0=.045+Math.random()*.07;p.id=Math.random()*50})}
    while(acc.m>=1){acc.m--;emit(mSys,p=>{p.x=(Math.random()-.5)*.25;p.z=(Math.random()-.5)*.25;p.y=.9;p.vx=wind*.15;p.vy=.45+Math.random()*.3;p.vz=0;p.life=3+Math.random();p.s0=.3;p.grow=1}) }
    while(acc.u>=1){acc.u--;emit(mSys,p=>{p.x=MUG[0]+(Math.random()-.5)*.05;p.z=MUG[2]+(Math.random()-.5)*.05;p.y=MUG[1]+.17*MUGS;p.vx=wind*.05;p.vy=.2+Math.random()*.12;p.vz=0;p.life=2+Math.random()*.8;p.s0=.14;p.grow=2.4})}
    step(fSys,dt,(p,d,a)=>{p.vx+=Math.sin(tNow*7+p.id)*d*1.2+wind*d*.3;p.x+=p.vx*d;p.y+=p.vy*d;p.z+=p.vz*d;p.vy*=1-d*.55;p.sz=p.s0*(1-a*.55)*(1+.15*Math.sin(tNow*19+p.id))});
    step(sSys,dt,(p,d,a)=>{p.vx+=wind*d*.9+Math.sin(tNow*3+p.id)*d*.5;p.vy-=d*.25;p.x+=p.vx*d;p.y+=p.vy*d;p.z+=p.vz*d;p.sz=p.s0*(.7+.6*Math.abs(Math.sin(tNow*11+p.id)))});
    step(mSys,dt,(p,d,a)=>{p.vx+=wind*d*.12+Math.sin(tNow*1.6+p.y*3)*d*.2;p.x+=p.vx*d;p.y+=p.vy*d;p.z+=p.vz*d;p.sz=p.s0*(1+a*p.grow*2.2)});
  }
  const MUG=[.78,.03,1.22],MUGS=1.5;   // gamelle agrandie et avancée : premier plan, bien lisible
  function init(){
    renderer=new THREE.WebGLRenderer({canvas:cv,antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,QDPR()));renderer.setClearColor(0x000000,0);
    scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x080C14,.05);cam=new THREE.PerspectiveCamera(40,1,.1,80);   // brouillard bleu nuit : noie l'horizon, raccorde le sol au ciel
    hemi=new THREE.HemisphereLight(0x5A6B8C,0x1A1008,.45);scene.add(hemi);
    light=new THREE.PointLight(0xFF7700,2.4,11,1.6);light.position.set(0,.65,0);scene.add(light);
    const fill=new THREE.PointLight(0xffb070,.5,14,2);fill.position.set(2,1.5,3);scene.add(fill);fillL=fill;
    const moon=new THREE.DirectionalLight(0x7F9CD8,.5);moon.position.set(-3,4,-4);scene.add(moon);moonL=moon;
    sunL=new THREE.DirectionalLight(0xFFF0D6,0);sunL.position.set(-4.5,6.5,3.5);scene.add(sunL);   // soleil du bivouac de jour   // liseré froid sur les pierres et le sac
    const env=(()=>{const mk=(a,b)=>{const c=document.createElement('canvas');c.width=c.height=32;const x=c.getContext('2d'),g=x.createLinearGradient(0,0,0,32);g.addColorStop(0,a);g.addColorStop(1,b);x.fillStyle=g;x.fillRect(0,0,32,32);return c};const t=new THREE.CubeTexture([mk('#6A3A1A','#0A0F18'),mk('#6A3A1A','#0A0F18'),mk('#2A3A5C','#0A0E18'),mk('#0A0806','#0A0F18'),mk('#8A4A20','#0A0F18'),mk('#1A2438','#0A0E18')]);t.needsUpdate=true;return t})();
    const gtx=gravelTex(),gmaps=gravelMaps(gtx),ground=new THREE.Mesh(new THREE.CircleGeometry(16,48),new THREE.MeshStandardMaterial({map:gtx,normalMap:gmaps.normal,normalScale:new THREE.Vector2(1.7,1.7),roughnessMap:gmaps.rough,roughness:1,metalness:.05}));ground.rotation.x=-Math.PI/2;scene.add(ground);groundM=ground.material;
    // pierres : granite alpin (grains, fissures, lichen) sur des pierres cassées aux arêtes usées, ombre peinte à la base
    const gt=makeGraniteTex(),rmat=new THREE.MeshStandardMaterial({color:0x948D86,map:gt.map,bumpMap:gt.bump,bumpScale:.25,roughnessMap:gt.rough,roughness:1,metalness:0,vertexColors:true});
    const RG=[11,12,13,14].map(s=>rockGeom(s,48,32));   // 4 formes partagées, version légère (1 600 sommets chacune)
    const stone=(k,r,x,z,ry,sy=1,sz=1)=>{const s=r/1.5,m=new THREE.Mesh(RG[k%4],rmat);m.scale.set(s,s*sy,s*sz);m.position.set(x,.17*s*sy,z);m.rotation.y=ry;scene.add(m)};   // base de la forme à -0,21 : légèrement enterrée
    for(let i=0;i<10;i++){const a=i/10*6.283+.2,r=.82+hash(i,3)*.12;stone(i,.2+hash(i,7)*.12,Math.cos(a)*r,Math.sin(a)*r,i*1.7,.7)}   // cercle du foyer
    [[-2.6,-1.6,.8],[2.8,-2.2,1.1],[-4.2,-3,1.4],[4.4,-1,.9],[0.4,-3.6,1.2],[-1.2,-2.6,.6]].forEach(([x,z,r],i)=>stone(i+2,r,x,z,i*1.3,.8));
    stone(3,.55,1.4,.95,.4,.35,.8);   // dalle plate (pour la tasse)
    const ctx_=charTex(false);logMat=new THREE.MeshStandardMaterial({color:0x8A7A6E,map:ctx_,bumpMap:ctx_,bumpScale:.06,roughness:1,emissive:0xFF5A10,emissiveMap:charTex(true),emissiveIntensity:.8});const capMat=new THREE.MeshStandardMaterial({color:0x4A3B2E,map:ringTex(),roughness:1,emissive:0x7A2A08,emissiveIntensity:.35});capM=capMat;
    for(let i=0;i<5;i++){const lg=new THREE.Mesh(logGeo(1.05,.085,i+1),[logMat,capMat,capMat]);lg.rotation.z=Math.PI/2+(i%2?.12:-.1);lg.rotation.y=i*1.26+.4;lg.position.set(0,.1+(i>2?.11:0),0);scene.add(lg)}
    const gr=document.createElement('canvas');gr.width=gr.height=128;{const x=gr.getContext('2d'),g=x.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(255,150,60,.95)');g.addColorStop(.5,'rgba(220,70,20,.5)');g.addColorStop(1,'rgba(120,20,0,0)');x.fillStyle=g;x.fillRect(0,0,128,128)}
    ember=new THREE.Mesh(new THREE.CircleGeometry(.6,32),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(gr),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));ember.rotation.x=-Math.PI/2;ember.position.y=.03;scene.add(ember);
    bloom=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex(),blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,opacity:.5,fog:false}));bloom.scale.set(4.2,4.2,1);bloom.position.set(0,.75,.15);bloom.renderOrder=1;scene.add(bloom);   // halo de bloom autour du cœur de la flamme (additif, sans post-traitement)
    const pk=buildPack(env);pk.position.set(-1.95,.02,-.75);pk.rotation.set(.18,.62+Math.PI,.04);scene.add(pk);   // avant (bretelles, flasques) tourné vers le feu, adossé au rocher
    const lgs=buildLogs();lgs.position.set(2.9,0,-.55);lgs.rotation.y=.55;scene.add(lgs);
    flames=[buildFlame(0,1),buildFlame(2.7,.78)];flames[1].position.set(.1,.05,.08);flames.forEach(f=>{f.position.y+=.1;scene.add(f)});
    sky4.style.setProperty('--topo',topoBg());
    const wtc=buildWatchGps(env);wtc.scale.setScalar(.46);wtc.rotation.y=-.55;wtc.position.set(-.2,.07,1.55);scene.add(wtc);
    const mg=buildMug(env);mg.scale.setScalar(MUGS);mg.position.set(MUG[0],MUG[1],MUG[2]);scene.add(mg);
    fSys=mkSys(200,FFS,THREE.AdditiveBlending);sSys=mkSys(260,SFS,THREE.AdditiveBlending);mSys=mkSys(110,MFS,THREE.NormalBlending);
    [mSys,fSys,sSys].forEach((q,i)=>{q.pts.renderOrder=3+i;scene.add(q.pts)});
    for(let i=0;i<100;i++)simulate(1/50);
    ok=true;
  }
  function ensure(){if(ok||failed)return;try{init();resize();setQuality(QC.tier)}catch(e){failed=true;ok=false;console.warn('[boucle] scène 3D indisponible :',e&&e.message)}}
  function resize(){
    if(!ok)return;const w=cv.clientWidth,h=cv.clientHeight;if(!w||!h)return;
    renderer.setSize(w,h,false);cam.aspect=w/h;
    const mob=w/h<.9;cam.fov=mob?52:40;
    cam.userData.b=mob?{x0:0,y0:3.2,z0:9.6,x1:0,y1:1.9,z1:7.0,tx:0,ty:-.25}:{x0:0,y0:2.6,z0:7.2,x1:0,y1:1.35,z1:4.9,tx:.9,ty:.55};
    [fSys,sSys,mSys].forEach(q=>q.m.uniforms.uScale.value=h*.9);
    cam.updateProjectionMatrix();
  }
  function update(l,dt,still){
    if(!ok)return;
    const d=reduce||still?0:dt,t=tNow;
    stokeV+=(stokeT-stokeV)*(1-Math.exp(-dt*5));
    wind+=(((reduce?0:mx)*1.5)-wind)*(1-Math.exp(-dt*3));
    const b=cam.userData.b,e=ease(clamp(l*1.6));
    cam.position.set(lerp(b.x0,b.x1,e)+(reduce?0:mx)*.35,lerp(b.y0,b.y1,e)+(reduce?0:-my)*.12,lerp(b.z0,b.z1,e));cam.lookAt(b.tx,b.ty,0);
    light.intensity=reduce?2.6:2.3+.7*Math.sin(t*23)+.5*Math.sin(t*37+1.3)+.3*Math.sin(t*61)+1.4*stokeV;
    light.position.set(Math.sin(t*5)*.06,.65+.05*Math.sin(t*11),Math.cos(t*4)*.06);
    if(bloom)bloom.material.opacity=reduce?.5:.42+.1*Math.sin(t*9)+.06*Math.sin(t*23)+.28*stokeV;
    logMat.emissiveIntensity=reduce?.8:.7+.3*Math.sin(t*9)+.5*stokeV;
    ember.material.opacity=reduce?.6:.55+.25*Math.sin(t*3)+.2*stokeV;
    flames.forEach(f=>{f.rotation.y=Math.atan2(cam.position.x-f.position.x,cam.position.z-f.position.z);f.material.uniforms.uT.value=t+f.userData.o;f.scale.y=(f.userData.base||(f.userData.base=f.scale.x))*(reduce?1:1+.08*Math.sin(t*7+f.userData.o)+.4*stokeV);f.material.uniforms.uS.value=reduce?1:.92+.1*Math.sin(t*23+f.userData.o)+.25*stokeV});
    if(d>0){simulate(d);if(!paused&&Math.random()<d*(2.5+14*stokeV)*fireK)crackle(stokeV)}
    sky4.style.setProperty('--fire',((.5+(reduce?0:.12*Math.sin(t*23))+.25*stokeV)*fireK).toFixed(3));
    {   // jour / nuit : en mode jour, ciel clair, soleil, brume légère et feu éteint (bûches noircies, plus de flamme ni de lueur)
      const tg=theme==='light'?1:0;dayC+=(tg-dayC)*(still?1:1-Math.exp(-dt*3.5));if(Math.abs(tg-dayC)<.004)dayC=tg;
      const D=dayC,N=1-D;fireK=N;
      light.intensity*=N;fillL.intensity=.5*N;moonL.intensity=.5*N;sunL.intensity=D*1.55;
      hemi.color.set(0x5A6B8C).lerp(_ca.set(0xD4E6F6),D);hemi.groundColor.set(0x1A1008).lerp(_cb.set(0x9A8A74),D);hemi.intensity=.45+.55*D;
      scene.fog.color.set(0x080C14).lerp(_ca.set(0xCFE1EE),D);scene.fog.density=.05+.014*D;
      if(bloom)bloom.material.opacity*=N;ember.material.opacity*=N;logMat.emissiveIntensity*=N;capM.emissiveIntensity=.35*N;
      logMat.color.set(0x8A7A6E).lerp(_ca.set(0x3A3430),D);   // bois noirci, cendres
      groundM.color.setScalar(1+.5*D);
      flames.forEach(f=>{f.visible=N>.03;f.material.uniforms.uS.value*=N});
    }
    renderer.render(scene,cam);
  }
  function stoke(on){stokeT=on?1:0}
  function setQuality(t){qm=[1,.6,.35][t];if(ok){renderer.setPixelRatio(Math.min(devicePixelRatio,QDPR()));resize()}}
  return {ready:()=>ok,ensure,update,resize,stoke,setQuality,dispose(){if(ok)try{renderer.forceContextLoss();renderer.dispose()}catch(e){}}};
})();

/* ---------- Flaque : eau en shader (reflet du ciel étoilé, ondes), pas virtuel, choix gauche / droite ---------- */
const pc=$('#puddleCanvas'),px=pc.getContext('2d'),waterCv=$('#waterCanvas');
let PW=0,PH=0,DPR=1,gy=0,prx=0,pry=0,k=1;
const drops=[],ripples=[],flights=[],prints=[];let lastStep=-1,waterGL=null,waterU=null,busy=false;
const WATER_FS=`precision highp float;
uniform vec2 uRes;uniform float uT;uniform vec2 uC;uniform vec2 uR;uniform vec4 uRip[8];
float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
void main(){
  vec2 f=vec2(gl_FragCoord.x,uRes.y-gl_FragCoord.y);
  vec2 q=(f-uC)/uR;float r=length(q);
  float inside=1.-smoothstep(.93,1.,r);
  if(inside<.002){gl_FragColor=vec4(0.);return;}
  vec2 grad=vec2(0.);float hh=0.;
  for(int i=0;i<8;i++){
    vec4 rp=uRip[i];float age=rp.z;
    if(age<0.||age>2.4)continue;
    vec2 d=(f-rp.xy)/vec2(1.,.26);
    float dist=length(d)/uR.x,front=age*.24;
    float env=exp(-abs(dist-front)*9.)*exp(-age*1.3)*rp.w;
    hh+=sin((dist-front)*38.)*env;
    grad+=normalize(d+vec2(1e-4))*cos((dist-front)*38.)*env*.6;
  }
  vec2 s=vec2(q.x*.55+.5,.5-q.y*.5)+grad*.05+vec2(vn(q*4.+uT*.05)-.5,vn(q*4.-uT*.04)-.5)*.012;
  vec3 sky=mix(vec3(.05,.06,.12),vec3(.40,.24,.30),smoothstep(.0,1.,1.-s.y));
  vec2 g=s*vec2(uRes.x/uRes.y,1.)*55.;vec2 id=floor(g);vec2 fr=fract(g)-.5;
  float h=hash(id);float st=step(.93,h);
  float dd=length(fr-(vec2(hash(id+1.3),hash(id+7.7))-.5)*.6);
  sky+=vec3(.85,.92,1.)*st*smoothstep(.22,.0,dd)*(.6+.4*sin(uT*(1.5+h*3.)+h*40.));
  vec3 col=mix(vec3(.02,.03,.04),sky,.78);
  col+=vec3(.9,.95,1.)*pow(max(hh,0.),2.)*.9;
  col*=1.-.4*smoothstep(.55,1.,r);
  float a=inside*.94;
  gl_FragColor=vec4(col*a,a);
}`;
function initWater(){
  let gl=null;try{gl=waterCv.getContext('webgl',{alpha:true,premultipliedAlpha:true,antialias:false,powerPreference:'low-power'})}catch(e){}
  if(!gl)return;
  const mk=(t,src)=>{const sh=gl.createShader(t);gl.shaderSource(sh,src);gl.compileShader(sh);return gl.getShaderParameter(sh,gl.COMPILE_STATUS)?sh:null};
  const vs=mk(gl.VERTEX_SHADER,'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}'),fs=mk(gl.FRAGMENT_SHADER,WATER_FS);
  if(!vs||!fs)return;
  const pr=gl.createProgram();gl.attachShader(pr,vs);gl.attachShader(pr,fs);gl.linkProgram(pr);
  if(!gl.getProgramParameter(pr,gl.LINK_STATUS))return;
  gl.useProgram(pr);const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
  const loc=gl.getAttribLocation(pr,'p');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
  waterGL=gl;waterU={res:gl.getUniformLocation(pr,'uRes'),t:gl.getUniformLocation(pr,'uT'),c:gl.getUniformLocation(pr,'uC'),r:gl.getUniformLocation(pr,'uR'),rip:gl.getUniformLocation(pr,'uRip')};
}
const RIPBUF=new Float32Array(32);
function drawWater(){
  if(!waterGL||!PW)return;
  const gl=waterGL,sx=waterCv.width/PW,sy=waterCv.height/PH;
  gl.uniform2f(waterU.res,waterCv.width,waterCv.height);gl.uniform1f(waterU.t,tNow);
  gl.uniform2f(waterU.c,PW/2*sx,gy*sy);gl.uniform2f(waterU.r,prx*sx,pry*sy);
  RIPBUF.fill(0);for(let i=0;i<8;i++){RIPBUF[i*4+2]=-1}
  const live=ripples.slice(-8);
  live.forEach((r,i)=>{RIPBUF[i*4]=r.x*sx;RIPBUF[i*4+1]=(r.y||gy)*sy;RIPBUF[i*4+2]=r.t;RIPBUF[i*4+3]=r.a||1});
  gl.uniform4fv(waterU.rip,RIPBUF);
  gl.drawArrays(gl.TRIANGLES,0,3);
}
function sizePuddle(){
  DPR=Math.min(devicePixelRatio||1,1.5);PW=pc.clientWidth;PH=pc.clientHeight;if(!PW)return;
  pc.width=PW*DPR;pc.height=PH*DPR;px.setTransform(DPR,0,0,DPR,0,0);
  gy=PH*(isMobile()?.76:.72);prx=Math.min(PW*.4,470);pry=prx*.2;k=clamp(PW/1200,.55,1.15);
  const wq=.7;waterCv.width=Math.max(2,Math.round(PW*wq));waterCv.height=Math.max(2,Math.round(PH*wq));if(waterGL)waterGL.viewport(0,0,waterCv.width,waterCv.height);
  const top=gy-pry*1.5,h=pry*3;
  $('#sideL').style.cssText=`left:${PW/2-prx}px;top:${top}px;width:${prx}px;height:${h}px`;
  $('#sideR').style.cssText=`left:${PW/2}px;top:${top}px;width:${prx}px;height:${h}px`;
  // cartes Randonneur / Carnet : jamais sur le titre ni sur sa phrase, quelle que soit la largeur de l'écran
  const hd=$('#s3 .head').getBoundingClientRect(),s3r=S[2].getBoundingClientRect();
  ['#pAbout','#pBlog'].forEach(id=>{$(id).style.top=isMobile()?'':Math.max(PH*.26,hd.bottom-s3r.top+16)+'px'});
  if(SHOE.ready())SHOE.layoutZones();
}
function shoeX(l){return PW*(.34+.32*l)}
function ripAt(cx,cy,a){if(SHOE.ready())SHOE.rippleScreen(cx,cy,a);else ripples.push({x:cx,y:cy,t:0,a})}
function splash(x,y=gy,amp=1){
  if(SHOE.ready()){SHOE.impactScreen(x,y,amp);return}
  for(let i=0;i<30*Math.min(amp,1.6);i++){
    const a=-Math.PI/2+(Math.random()-.5)*2.5,sp=(200+Math.random()*440)*k*Math.min(amp,1.4);
    drops.push({x:x+(Math.random()-.5)*40*k,y,vx:Math.cos(a)*sp*.9+70*k,vy:Math.sin(a)*sp,r:(1.6+Math.random()*3.4)*k,age:0,e:Math.random()<.2});
  }
  ripples.push({x,y,t:0,a:amp},{x:x+30*k,y,t:-.15,a:amp*.6});
}
function fly(which,x0,y0,cb){
  const el=which==='about'?$('#pAbout'):$('#pBlog'),r=el.getBoundingClientRect(),sr=pc.getBoundingClientRect();
  flights.push({t:0,dur:.95,x0,y0,x1:r.left+r.width/2-sr.left,y1:r.top+30-sr.top,cb});
}
/* Pas virtuel : empreinte, onde, éclaboussure, goutte qui file vers la carte choisie, puis ouverture */
function stomp(side,cx,cy){
  if(busy)return;busy=true;
  const left=side==='left';
  splash(cx,cy,1.7);prints.push({x:cx,y:cy,t:0});splashSound();haptic([12,40,18]);
  const card=$(left?'#pAbout':'#pBlog'),open=()=>{busy=false;card.classList.remove('lit');left?openProfile():openCarnet()};
  if(reduce||staticMode){setTimeout(open,250);return}
  fly(left?'about':'blog',cx,cy-20*k,()=>{card.classList.add('lit');setTimeout(open,350)});
}
let lastL=0;
function stepParticles(dt){
  for(let i=drops.length-1;i>=0;i--){
    const d=drops[i];d.vy+=1500*k*dt;d.x+=d.vx*dt;d.y+=d.vy*dt;d.age+=dt;
    if((d.y>gy&&d.vy>0)||d.age>2.2){if(Math.random()<.22)ripples.push({x:d.x,y:gy+(Math.random()-.5)*pry*.4,t:0,a:.4});drops.splice(i,1)}
  }
  for(let i=ripples.length-1;i>=0;i--){ripples[i].t+=dt;if(ripples[i].t>2.4)ripples.splice(i,1)}
  for(let i=prints.length-1;i>=0;i--){prints[i].t+=dt;if(prints[i].t>.9)prints.splice(i,1)}
  for(let i=flights.length-1;i>=0;i--){flights[i].t+=dt;if(flights[i].t>=flights[i].dur){const cb=flights[i].cb;flights.splice(i,1);if(cb)cb()}}
}
function drawShoe(ctx,x,y,rot,sq,flip,alpha){
  ctx.save();ctx.translate(x,y);if(flip)ctx.scale(1,-1);ctx.rotate(rot);ctx.scale(k,k*sq);ctx.globalAlpha=alpha;
  ctx.lineJoin='round';ctx.lineCap='round';
  ctx.fillStyle=pal['--fg'];
  for(let i=0;i<17;i++){const lx=-134+i*16;ctx.beginPath();ctx.moveTo(lx,-6);ctx.lineTo(lx+12,-6);ctx.lineTo(lx+6,1);ctx.closePath();ctx.fill()}
  ctx.beginPath();ctx.moveTo(-146,-34);ctx.lineTo(148,-34);ctx.quadraticCurveTo(158,-20,146,-6);ctx.lineTo(-140,-6);ctx.quadraticCurveTo(-154,-20,-146,-34);ctx.closePath();
  ctx.fillStyle=pal['--card'];ctx.fill();ctx.lineWidth=3;ctx.strokeStyle=pal['--fg'];ctx.stroke();
  ctx.beginPath();ctx.moveTo(-142,-34);ctx.bezierCurveTo(-146,-72,-126,-100,-100,-106);ctx.bezierCurveTo(-80,-110,-64,-104,-48,-112);
  ctx.bezierCurveTo(-30,-124,-6,-122,10,-104);ctx.bezierCurveTo(50,-96,110,-84,136,-56);ctx.bezierCurveTo(146,-46,148,-38,146,-34);ctx.closePath();
  ctx.fillStyle=pal['--acc'];ctx.fill();ctx.stroke();
  ctx.strokeStyle=pal['--bg'];ctx.lineWidth=3;
  for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(-36+i*17,-114+i*6);ctx.lineTo(-20+i*17,-97+i*6);ctx.stroke()}
  ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-108,-56);ctx.bezierCurveTo(-60,-52,0,-70,64,-78);ctx.stroke();
  ctx.restore();
}
function drawFlights(ctx){
  flights.forEach(f=>{
    const e=ease(f.t/f.dur);
    const fx=lerp(f.x0,f.x1,e),fy=lerp(f.y0,f.y1,e)-Math.sin(Math.PI*e)*PH*.22;
    f.tr=f.tr||[];f.tr.push([fx,fy]);if(f.tr.length>22)f.tr.shift();
    // traînée lumineuse : les gouttelettes se fondent en un trait qui file vers la carte
    ctx.lineCap='round';
    for(let i=1;i<f.tr.length;i++){const a=i/f.tr.length;ctx.strokeStyle=`rgba(255,${170+a*70|0},${110+a*90|0},${a*.85})`;ctx.lineWidth=(2+a*8)*k;ctx.beginPath();ctx.moveTo(f.tr[i-1][0],f.tr[i-1][1]);ctx.lineTo(f.tr[i][0],f.tr[i][1]);ctx.stroke()}
    ctx.fillStyle='#E6F4F1';ctx.beginPath();ctx.arc(fx,fy,8*k*(1-.35*e),0,TAU);ctx.fill();
  });
}
function drawPuddle(l,dt,still){
  const ctx=px;ctx.clearRect(0,0,PW,PH);
  SHOE.ensure();const three=SHOE.ready();
  const dc=charte==='expe'?(theme==='dark'?'255,237,229':'255,255,255'):(theme==='dark'?'157,176,176':'47,93,107');
  const phi=l*8,fr=phi-Math.floor(phi),si=Math.floor(phi);
  const x=shoeX(l);lastL=l;
  if(!still){
    if(!three&&lastStep!==si){
      if(lastStep>=0&&Math.abs(si-lastStep)===1&&!paused){splash(x);splashSound();haptic(12)}
    }
    lastStep=si;
    if(!paused&&!reduce&&Math.random()<dt*6){three?SHOE.rainRipple():ripples.push({x:PW/2+(Math.random()*2-1)*prx*.85,y:gy+(Math.random()*2-1)*pry*.6,t:0,a:.32})}   // gouttes de pluie
    stepParticles(paused?0:dt);
  }
  $('#pAbout').classList.toggle('on',l>.1);
  $('#pBlog').classList.toggle('on',l>.1);
  // pluie fine
  if(!reduce){
    ctx.strokeStyle='rgba(210,228,240,.15)';ctx.lineWidth=1;ctx.beginPath();
    for(let i=0;i<[70,36,0][QC.tier];i++){const rx=((i*0.618034)%1)*PW,sp=520+((i*0.271)%1)*360,yy=((((i*0.137)%1)*PH*1.3)+(paused?0:tNow)*sp)%(PH*1.2)-PH*.1;ctx.moveTo(rx,yy);ctx.lineTo(rx-5,yy+20)}
    ctx.stroke();
  }
  if(three){SHOE.update(l,paused?0:dt,still);drawFlights(ctx);return}
  drawWater();
  // repli 2D sans 3D : flaque, reflet de la basket, ondes, empreinte
  ctx.save();ctx.beginPath();ctx.ellipse(PW/2,gy,prx,pry,0,0,TAU);
  if(!waterGL){const g=ctx.createRadialGradient(PW/2,gy,8,PW/2,gy,prx);g.addColorStop(0,`rgba(${dc},.30)`);g.addColorStop(1,`rgba(${dc},.10)`);ctx.fillStyle=g;ctx.fill();ctx.lineWidth=1.5;ctx.strokeStyle=`rgba(${dc},.6)`;ctx.stroke()}
  ctx.clip();
  const lift=96*k*Math.sin(Math.PI*fr);
  const rot=.26*Math.sin(Math.PI*fr)-.05;
  const sq=1-.1*Math.max(0,1-Math.min(fr,1-fr)/.12);
  drawShoe(ctx,x,gy+lift,rot,sq,true,.16);
  ctx.restore();
  if(!waterGL){
    ctx.lineWidth=2;
    ripples.forEach(r=>{if(r.t<0)return;const a=r.t/2.4,rr=8*k+a*prx*.5;ctx.strokeStyle=`rgba(${dc},${(1-a)*.7*(r.a||1)})`;ctx.beginPath();ctx.ellipse(r.x,(r.y||gy)+2,rr,rr*.22,0,0,TAU);ctx.stroke()});
  }
  prints.forEach(p=>{const a=1-p.t/.9,sc=1+p.t*.5;ctx.fillStyle=`rgba(0,0,0,${.42*a})`;ctx.beginPath();ctx.ellipse(p.x,p.y,58*k*sc,20*k*sc,0,0,TAU);ctx.fill();ctx.strokeStyle=`rgba(${dc},${.5*a})`;ctx.lineWidth=2;ctx.stroke()});
  drawShoe(ctx,x,gy-lift,rot,sq,false,1);
  drops.forEach(d=>{
    const sp=Math.hypot(d.vx,d.vy);ctx.fillStyle=d.e?pal['--acc']:`rgba(${dc},.85)`;
    ctx.beginPath();ctx.ellipse(d.x,d.y,d.r*(1+sp/1100),d.r,Math.atan2(d.vy,d.vx),0,TAU);ctx.fill();
  });
  drawFlights(ctx);
}

/* ---------- Choix : profil (gauche) ou carnet hors-piste (droite) ---------- */
const dlgProfil=$('#dlgProfil'),dlgCarnet=$('#dlgCarnet'),dlgTool=$('#dlgTool');
let ARTICLES=[
  {t:'Retour du D+ : 34,4 km et 2 339 m de dénivelé',c:'course',cat:'Récit de course',d:'Notes de terrain sur une sortie aux Houches, du fond de la vallée à 2 521 m.'},
  {t:'Calculateur d\'allure trail : compter le D+ et le D−',c:'matos',cat:'Matériel et outils',d:'Pourquoi une allure à plat ne dit presque rien d\'une course en montagne.'},
  {t:'Making-of : construire L\'ascension',c:'coulisses',cat:'Coulisses',d:'De la boussole 3D au parcours des projets : les choix de conception.'},
  {t:'Un site 3D accessible : retour d\'expérience RGAA',c:'coulisses',cat:'Coulisses',d:'Pause, vue statique, clavier : garder le spectaculaire lisible pour tous.'}
];
const carList=$('#carList');
{const real=(CMS.articles||[]).filter(a=>a.title);   // articles saisis dans /admin/carnet ; aucun → les brouillons de lancement ci-dessus
  if(real.length){
    const cl=c=>/course|récit|recit|trail|sortie|course/i.test(c)?'course':/mat[ée]riel|outil|matos|gear|chauss/i.test(c)?'matos':'coulisses';
    ARTICLES=real.map(a=>({t:a.title,c:cl(a.category||''),cat:a.category||'Carnet',d:a.excerpt||'',bd:a.date||''}));
    const nt=$('#dlgCarnet .sh-note');if(nt)nt.textContent='Articles du carnet, du plus récent au plus ancien.';
  }}
ARTICLES.forEach(a=>{const li=document.createElement('li');li.dataset.c=a.c;li.innerHTML=`<p class="cat">${esc(a.cat)}</p><h3>${esc(a.t)}</h3><p>${esc(a.d)}</p><span class="bd">${esc(a.bd||'Brouillon')}</span>`;carList.appendChild(li)});
$$('.sh-filters button').forEach(b=>b.addEventListener('click',()=>{
  $$('.sh-filters button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
  [...carList.children].forEach(li=>{li.hidden=b.dataset.f!=='all'&&li.dataset.c!==b.dataset.f});
}));
function openProfile(){root.style.overflow='hidden';dlgProfil.showModal()}
function showSheet(title,f,opener,back,proj){   // fiche descriptive : atelier (outils) et carte (projets) ; proj.gps = « Km … · Altitude … m » de l'étape sur la trace
  const gps=proj&&proj.gps;dlgTool.classList.toggle('is-proj',!!proj);
  // fiche projet : une seule ligne de coordonnées de parcours (étape · lieu · rôle · km · altitude · période) ; atelier : surtitre et statut séparés
  $('#toolE').innerHTML=proj?esc([f.e,gps,f.st].filter(Boolean).join(' · ')):esc(f.e);$('#toolT').textContent=title;$('#toolS').textContent=proj?'':f.st;$('#toolS').hidden=!!proj;$('#toolL').textContent=f.l;
  $('#toolP').innerHTML=(f.pts||[]).map(x=>`<li>${esc(x)}</li>`).join('');$('#toolK').innerHTML=(f.k||[]).map((x,i)=>`<li style="--d:${i*70}ms">${esc(x)}</li>`).join('');
  // chiffres clés (3 au plus) juste sous le titre, puis la photo d'ambiance sous verre ; absents des données = rien d'affiché
  const sl=$('#toolStats');sl.innerHTML=(f.stats||[]).slice(0,3).map(x=>`<li><b>${esc(x.value)}</b> <span>${esc(x.label)}</span></li>`).join('');sl.hidden=!sl.children.length;
  const fig=$('#toolM'),img=$('#toolImg'),src=okUrl(f.cover);fig.hidden=!src;
  if(src){if(img.getAttribute('src')!==src)img.src=src;const cu=okUrl(f.coverCreditUrl);
    $('#toolMc').innerHTML=f.coverCredit?'Photo : '+(cu?`<a href="${esc(cu)}" target="_blank" rel="noopener">${esc(f.coverCredit)}<span class="sr-only"> (nouvel onglet)</span></a>`:esc(f.coverCredit)):''}
  const nt=$('#toolN');nt.textContent=f.note||'';nt.hidden=!f.note;
  const acts=$('#toolActs'),bk=$('#toolBack');acts.querySelectorAll('.dyn').forEach(a=>a.remove());
  (f.links||[]).forEach((x,j)=>{if(x.go){const b=document.createElement('button');b.type='button';b.className='dyn '+(j?'sh-alt':'sh-main');b.textContent=x.l;b.addEventListener('click',()=>{dlgTool.close();jumpTo(.845);live.textContent='Contact. Posons le sac.'});acts.insertBefore(b,bk);return}
    const a=document.createElement('a');a.className='dyn '+(j?'sh-alt':'sh-main');a.href=x.u;a.target='_blank';a.rel='noopener';a.innerHTML=esc(x.l)+'<span class="sr-only"> (nouvel onglet)</span>';acts.insertBefore(a,bk)});
  bk.textContent=back;toolOpener=opener||null;root.style.overflow='hidden';dlgTool.showModal();
  requestAnimationFrame(drawLeads);
}
/* Fiche projet : micro-lignes de fuite (filaire SVG, décoratif) qui relient chaque chiffre clé à la fenêtre d'altimètre de la photo.
   Recalculées à l'ouverture, au chargement de la photo et quand la fiche change de taille ; rien sans chiffres ou sans photo. */
const leadsSvg=$('#toolLeads');
function drawLeads(){
  const body=leadsSvg.parentNode,glass=$('#toolM .sh-glass'),items=[...$$('#toolStats li')];
  if(!dlgTool.open||!dlgTool.classList.contains('is-proj')||$('#toolM').hidden||$('#toolStats').hidden||!items.length){leadsSvg.innerHTML='';return}
  const B=body.getBoundingClientRect(),G=glass.getBoundingClientRect(),st=body.scrollTop,W=body.scrollWidth,H=body.scrollHeight;if(!G.width){leadsSvg.innerHTML='';return}   // repère du contenu : le corps de la fiche défile
  leadsSvg.setAttribute('viewBox',`0 0 ${W} ${H}`);leadsSvg.setAttribute('width',W);leadsSvg.setAttribute('height',H);
  const gy=G.top-B.top+st,gl=G.left-B.left,gw=G.width,n=items.length;
  leadsSvg.innerHTML=items.map((li,i)=>{const L=li.getBoundingClientRect(),v=(li.querySelector('b')||li).getBoundingClientRect(),
      x0=L.left-B.left-12,y0=(v.top+v.bottom)/2-B.top+st,y2=gy-16,x1=gl+gw*(i+1)/(n+1),y1=gy+1;   // nœud dans la marge à gauche du chiffre, descente verticale dans cette marge (jamais à travers un texte), puis fuite vers un point réparti sur le haut de la fenêtre
    const f=v=>v.toFixed(1);
    return `<path class="ld" pathLength="1" d="M${f(x0+8)} ${f(y0)} L${f(x0)} ${f(y0)} L${f(x0)} ${f(y2)} L${f(x1)} ${f(y1)}"/><circle class="nd" cx="${f(x0+8)}" cy="${f(y0)}" r="2"/><circle class="nd" cx="${f(x1)}" cy="${f(y1)}" r="2.4"/>`}).join('')}
if(window.ResizeObserver){const ro=new ResizeObserver(()=>{if(dlgTool.open)drawLeads()});ro.observe(dlgTool);__sig.addEventListener('abort',()=>ro.disconnect())}
$('#toolImg').addEventListener('load',drawLeads);
function openTool(i,opener){const t=TOOLS[i],f=TOOL_INFO[i];if(!f)return;showSheet(t.n,f,opener,"Revenir à l'atelier")}
$('#toolImg').addEventListener('error',()=>{$('#toolM').hidden=true});   // photo introuvable : la fiche reste sans média
{ // photo sous verre : légère inclinaison 3D qui suit la souris, reflet de la vitre sous le pointeur (souris seulement, jamais en mouvement réduit)
  const gl=$('#toolM .sh-glass');
  gl.addEventListener('pointermove',e=>{if(reduce||e.pointerType!=='mouse')return;const r=gl.getBoundingClientRect(),x=clamp((e.clientX-r.left)/r.width),y=clamp((e.clientY-r.top)/r.height);
    gl.style.setProperty('--ry',((x-.5)*9).toFixed(2)+'deg');gl.style.setProperty('--rx',((.5-y)*7).toFixed(2)+'deg');gl.style.setProperty('--gx',(x*100).toFixed(1)+'%');gl.style.setProperty('--gy',(y*100).toFixed(1)+'%');gl.classList.add('tilt')});
  gl.addEventListener('pointerleave',()=>{gl.classList.remove('tilt');gl.style.setProperty('--rx','0deg');gl.style.setProperty('--ry','0deg')});
}
let toolOpener=null;
dlgTool.addEventListener('close',()=>{const o=toolOpener;toolOpener=null;if(o&&o.isConnected&&getComputedStyle(o).visibility!=='hidden')o.focus({preventScroll:true})});   // le focus revient sur la carte qui a ouvert la fiche
$('#tools').addEventListener('click',e=>{const b=e.target.closest('.cb');if(!b)return;openTool([...$('#tools').children].indexOf(b.closest('li')),b)});
function openCarnet(){root.style.overflow='hidden';document.body.classList.add('horspiste');dlgCarnet.showModal()}
[dlgProfil,dlgCarnet,dlgTool].forEach(d=>{
  d.addEventListener('close',()=>{document.body.classList.remove('horspiste');root.style.overflow=(loaded||staticMode)?'':'hidden'});
  d.addEventListener('click',e=>{if(e.target===d)d.close()});
});
$('#toolX').addEventListener('click',()=>dlgTool.close());$('#toolBack').addEventListener('click',()=>dlgTool.close());
$('#proX').addEventListener('click',()=>dlgProfil.close());$('#proBack').addEventListener('click',()=>dlgProfil.close());
$('#carBack').addEventListener('click',()=>dlgCarnet.close());$('#carBack2').addEventListener('click',()=>dlgCarnet.close());
/* curseur libre : la pluie ralentit autour de la souris où qu'elle soit sur la scène (souris seulement, jamais sous prefers-reduced-motion ; au clavier ou au tactile la pluie garde son rythme) */
addEventListener('pointermove',e=>{if(!reduce&&e.pointerType==='mouse'&&SHOE.ready())SHOE.cursor(e.clientX,e.clientY,true)},{passive:true});
document.addEventListener('pointerleave',()=>SHOE.cursor(0,0,false));
function zonePoint(e){const r=pc.getBoundingClientRect();if(SHOE.ready())return [e.clientX-r.left,e.clientY-r.top];return [clamp(e.clientX-r.left,PW/2-prx*.9,PW/2+prx*.9),clamp(e.clientY-r.top,gy-pry*.6,gy+pry*.6)]}
[['sideL','left','pAbout'],['sideR','right','pBlog']].forEach(([id,side,card])=>{
  const z=$('#'+id),c=$('#'+card);
  z.addEventListener('click',e=>{   // au clavier (Entrée / Espace : e.detail vaut 0), le pas tombe au milieu de la moitié de flaque
    if(!e.detail){stomp(side,PW/2+(side==='left'?-1:1)*prx*.45,gy);return}
    const [cx,cy]=zonePoint(e);stomp(side,cx,cy)});
  /* la carte (avec son bouton d'accès) reste affichée tant que la zone OU la carte est survolée / a le focus : on peut donc passer de la zone au bouton de la carte, à la souris comme au clavier */
  let off=0;const on=()=>{clearTimeout(off);c.classList.add('lit')},out=()=>{clearTimeout(off);off=setTimeout(()=>{if(!z.matches(':hover,:focus')&&!c.matches(':hover,:focus-within'))c.classList.remove('lit')},700)};
  z.addEventListener('pointerenter',e=>{on();if(!paused&&!reduce){const [cx,cy]=zonePoint(e);ripAt(cx,cy,.3)}});
  z.addEventListener('pointermove',e=>{if(!reduce&&e.pointerType==='mouse'&&SHOE.ready()){const [cx,cy]=zonePoint(e);SHOE.pointer(cx,cy,true)}});   // la flaque se déforme autour du curseur (shader)
  z.addEventListener('pointerleave',()=>SHOE.pointer(0,0,false));
  z.addEventListener('pointerleave',out);z.addEventListener('focus',on);z.addEventListener('blur',out);
  c.addEventListener('pointerenter',on);c.addEventListener('pointerleave',out);c.addEventListener('focusin',on);c.addEventListener('focusout',out);
  c.querySelector('.route').addEventListener('click',()=>stomp(side,PW/2+(side==='left'?-1:1)*prx*.45,gy));   // même action que la zone
});

/* ---------- Bivouac ---------- */
const ball=$('#ball'),bivtext=$('#bivtext'),stars=$('#stars'),tent=$('#tent'),restartBtn=$('#restart');
function updateBivouac(p){
  const o=trap(p,.82,.85,.93,.955);
  bivtext.style.opacity=o;bivtext.style.visibility=o<.02?'hidden':'visible';bivtext.style.pointerEvents=o<.3?'none':'auto';
  const ro=trap(p,.895,.92,.955,.975);
  restartBtn.style.opacity=ro;restartBtn.style.visibility=ro<.02?'hidden':'visible';
  stars.style.opacity=trap(p,.79,.83,.95,.975);
}
/* Contact : e-mail, LinkedIn, rendez-vous, formulaire ; le feu réagit au survol */
const CONTACT={email:'adrien.neyron@gmail.com',linkedin:'https://www.linkedin.com/in/adrienneyron/',github:'https://github.com/adrien-neyron',rdv:''};   // e-mail, LinkedIn et GitHub repris du site en ligne ; lien d'agenda à renseigner
{const c=CMS.contact||{};   // coordonnées saisies dans /admin/profil (e-mail, réseaux LinkedIn / GitHub, lien de rendez-vous)
  if(/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c.email||''))CONTACT.email=c.email;
  ['linkedin','github','rdv'].forEach(k=>{const u=okUrl(c[k]);if(u&&/^https?:/.test(u))CONTACT[k]=u})}
{const p=CMS.profile||{};   // texte de la fiche « Profil » et lien du CV
  const lead=$('#dlgProfil .lead'),facts=$('#dlgProfil .facts'),cvs=$$('a[download][data-cv]');   // tous les liens CV (fiche Profil et pied de page)
  if(p.lead&&lead)lead.textContent=p.lead;
  if(p.facts&&facts)facts.textContent=p.facts;
  const u=okUrl(p.cvUrl);if(u&&/^https?:|^\//.test(p.cvUrl))cvs.forEach(a=>{a.href=u})}
const cntStatus=$('#cntStatus');
{const rb=$('#bivtext .cnt[data-k="rdv"]');if(rb&&!CONTACT.rdv)rb.hidden=true}   // pas de bouton vide tant que le lien de prise de rendez-vous n'est pas renseigné
$$('#bivtext .cnt').forEach(b=>b.addEventListener('click',()=>{
  const k=b.dataset.k,u=CONTACT[k];
  if(!u){cntStatus.textContent={email:'L\'adresse e-mail reste à renseigner.',linkedin:'Le lien LinkedIn reste à renseigner.',rdv:'Le lien de prise de rendez-vous reste à renseigner.',github:'Le lien GitHub reste à renseigner.'}[k];return}
  if(k==='email')location.href='mailto:'+u;else window.open(u,'_blank','noopener');
}));
$('#cntForm').addEventListener('submit',e=>{
  e.preventDefault();const f=e.target;
  if(!f.checkValidity()){cntStatus.textContent='Merci de remplir les trois champs, avec une adresse e-mail valide.';const bad=f.querySelector(':invalid');if(bad)bad.focus();return}
  if(CONTACT.email){location.href='mailto:'+CONTACT.email+'?subject='+encodeURIComponent('Contact depuis le portfolio')+'&body='+encodeURIComponent(f.elements.message.value+'\n\n'+f.elements.nom.value+' ('+f.elements.email.value+')');cntStatus.textContent='Votre messagerie s\'ouvre avec le message prêt.'}
  else cntStatus.textContent='Prototype : le formulaire n\'est pas encore relié à un service d\'envoi.';
  CAMP.stoke(1);setTimeout(()=>CAMP.stoke(0),900);
});
$$('#bivtext .cnt,#bivtext input,#bivtext textarea,#bivtext .cnt-send,#restart').forEach(el=>{
  el.addEventListener('pointerenter',()=>CAMP.stoke(1));el.addEventListener('pointerleave',()=>CAMP.stoke(0));
  el.addEventListener('focus',()=>CAMP.stoke(1));el.addEventListener('blur',()=>CAMP.stoke(0));
});
/* Recommencer l'aventure : accélération à travers les étoiles, faisceau sur le cadran, retour au départ */
const warpCv=$('#warp'),wctx=warpCv.getContext('2d'),WSTARS=Array.from({length:220},()=>({a:Math.random()*6.283,r:Math.random(),s:.3+Math.random()*.7}));let warpOn=false;
function sizeWarp(){const q=.7;warpCv.width=Math.max(2,Math.round(innerWidth*q));warpCv.height=Math.max(2,Math.round(innerHeight*q))}
const transW=p=>p<.5?trap(p,.10,.15,.285,.32):0;   // fenêtre de la transition : l'aiguille clignote et fait le halo
const BLINK_HZ=.55;   // un éclat toutes les 1,8 s environ
function needleBlink(t){   // éclat bref et rare (bien sous le seuil de 3 éclats par seconde) ; fixe en mouvement réduit ou en pause
  if(reduce||paused)return .7;
  return .2+.8*sm(.35,.7,Math.sin(t*6.2832*BLINK_HZ));
}
function drawNeedleHalo(Hw,W,H,q,cx,cy,t){   // le halo naît de l'aiguille : cuivre au cœur, onde de blanc givre à chaque éclat
  const b=needleBlink(t),ph=(reduce||paused)?.5:(t*BLINK_HZ)%1,a=Hw*(.05+.4*b);
  wctx.globalCompositeOperation='lighter';
  const R=(70+110*b)*q*(.7+.3*Hw),g=wctx.createRadialGradient(cx,cy,0,cx,cy,R);
  g.addColorStop(0,`rgba(255,238,222,${.7*a})`);g.addColorStop(.25,`rgba(240,140,90,${.4*a})`);g.addColorStop(1,'rgba(226,109,59,0)');
  wctx.fillStyle=g;wctx.beginPath();wctx.arc(cx,cy,R,0,6.2832);wctx.fill();
  const rr=(30+240*ph)*q,al=Hw*(1-ph)*(.3+.3*b);
  wctx.lineWidth=(1.5+2.5*(1-ph))*q;wctx.strokeStyle=`rgba(230,244,241,${al*.45})`;wctx.beginPath();wctx.arc(cx,cy,rr,0,6.2832);wctx.stroke();
  wctx.globalCompositeOperation='source-over';
}
function drawWarp(p){
  const wEnd=p>.9?sm(.92,.99,p):0,wHalo=transW(p),w=Math.max(wEnd,wHalo);   // fin de boucle : étoiles ; plongée dans le verre : seulement le halo de l'aiguille
  if(w<=.001){if(warpOn){wctx.clearRect(0,0,warpCv.width,warpCv.height);warpOn=false}return}
  warpOn=true;
  const W=warpCv.width,H=warpCv.height,q=W/innerWidth,cx=(DIAL.r>5?DIAL.cx:(LAY.cx||innerWidth/2))*q,cy=(DIAL.r>5?DIAL.cy:(LAY.cy||innerHeight/2))*q,R=Math.hypot(W,H)*.6   /* le halo suit le centre réel du cadran, qui se déplace en grand écran */,t=paused?0:tNow;
  wctx.clearRect(0,0,W,H);
  if(wHalo>.001)drawNeedleHalo(wHalo,W,H,q,cx,cy,t);
  if(wEnd<=.001)return;
  wctx.globalCompositeOperation='lighter';wctx.lineCap='round';
  // plus de traînées d'étoiles : elles faisaient l'effet d'une tempête de neige 
  // plus de halo de fin (faisceau cuivre et éclat supprimés)
  wctx.globalCompositeOperation='source-over';
}
function restartAdventure(){
  if(staticMode){lap++;setLap();scrollTo(0,0);return}
  restartBtn.blur();cinematicTo(1,2400,'in');
}
restartBtn.addEventListener('click',restartAdventure);

/* ---------- Boucle : rendu ---------- */
const NAMES=['Se repérer','S\'équiper','Monter','Persévérer','Se poser'];
let curName=-1,sceneSay='';   // sceneSay : annonce de scène à joindre à celle de l'étape (en entrant sur la carte, l'une n'écrase pas l'autre)
function sceneIndex(p){return p<.07?0:p<.27?1:p<.545?2:p<.80?3:p<.95?4:0}
/* Deux palettes pour la barre de progression : la boucle (cuivre, la teinte de la marque) et la trace de la carte (blanc givre et émeraude, comme la trace) ; elle passe de l'une à l'autre en fondu quand la carte apparaît et disparaît */
const RT_A={d:[240,162,122],l:[183,154,138],g:[226,109,59],a:[247,176,138],h:[255,226,204]},RT_B={d:[242,251,248],l:[169,189,196],g:[0,245,160],a:[242,251,248],h:[0,245,160]};
function railTone(k){const el=railTone.el||(railTone.el=document.querySelector('.altrail'));if(!el)return;const q=Math.round(k*50);if(q===railTone.q)return;railTone.q=q;
  const m=(a,b)=>a.map((v,i)=>Math.round(v+(b[i]-v)*k)).join(','),st=el.style;
  st.setProperty('--rd','rgb('+m(RT_A.d,RT_B.d)+')');st.setProperty('--rl','rgb('+m(RT_A.l,RT_B.l)+')');st.setProperty('--rg','rgba('+m(RT_A.g,RT_B.g)+',.6)');st.setProperty('--ra','rgb('+m(RT_A.a,RT_B.a)+')');st.setProperty('--rh','rgb('+m(RT_A.h,RT_B.h)+')')}
/* fondu « net » entre scènes : sous 15 % rien n'est affiché et la montée est plus raide, pour qu'un texte de la scène voisine ne reste jamais à l'état de fantôme (contraste ≈ 1,1:1, bruit visuel, RGAA 3.2) quand le défilement s'arrête entre deux scènes */
const crisp=k=>{const o=k<.15?0:Math.pow((k-.15)/.85,2);return o<.05?0:o};   // montée raide, et sous 5 % la scène voisine est retirée (le dernier 5 % d'un fondu reste invisible à l'œil mais pas aux tests de contraste)
function setVisible(el,o){el.style.opacity=o;el.style.visibility=o<.01?'hidden':'visible'}
function announce(i){
  if(i===curName)return;curName=i;
  live.textContent=`Scène ${i+1} sur 5 : ${NAMES[i]}`;sceneSay=i===2?live.textContent:'';
  $$('#railNav button').forEach((b,j)=>b.setAttribute('aria-current',j===i?'true':'false'));
  $('#burgerSteps').parentNode.style.setProperty('--i',i);   // le repère de la rose des vents suit l'étape courante
}
function draw(p,dt){
  pal=palette(p);setVars(root,pal);updateBg(p);if(loaded)prewarm(p);
  setVisible(S[0],crisp(Math.max(trap(p,-1,0,.24,.30),trap(p,.95,1,2,3))));
  {const mo=trap(p,.245,.29,.525,.555);setVisible(S[1],crisp(mo));document.documentElement.style.setProperty('--hudk',(1-mo).toFixed(3));railTone(mo)}   // altitude, scène et lieu en bas à gauche : masqués dans l'expérience de la trace
  setVisible(S[2],crisp(trap(p,.53,.56,.77,.81)));   // la flaque arrive en fondu pendant le zoom arrière au-dessus du dernier cairn sous la pluie
  setVisible(S[3],crisp(trap(p,.78,.82,.97,.985)));
  // s1
  const split=LAY.sx>0&&!staticMode;CS=split?.17:.07;CST=split?.012:STEP;CSP=split?.12:.07;CEND=split?[.26,.29]:[.24,.28];CREV=split?[.20,.225]:[.19,.22];   // grand écran : accueil = texte à gauche, montre à droite
  document.documentElement.classList.toggle('hero-split',split);head1.style.opacity=split?(p<.5?1-sm(.075,.10,p):0):Math.max(1-sm(.04,.08,p),sm(.96,1,p));
  head2.style.opacity=split?trap(p,.11,.14,.17,.20):trap(p,.08,.11,.24,.28);   // le titre « S'équiper » attend que l'accroche ait disparu
  chips.forEach((c,i)=>{
    const o=hoverCards()
      ?trap(p,CS,CS+.03,CEND[0],CEND[1])*Math.max(cardReveal(i,dt),sm(CREV[0],CREV[1],p))   // souris : la carte du bouton survolé, puis toutes en fin de scène
      :clamp((p-(CS+i*CST))/.03)*(p<CEND[0]?1:1-sm(CEND[0],CEND[1],p));
    c.li.style.opacity=o;c.li.style.visibility=o<.04?'hidden':'visible';
    c.li.style.transform=isMobile()?`translateY(${(1-o)*10}px)`:`scale(${.92+.08*o})`;
    c.ln.style.strokeDashoffset=1-clamp((p-(CS+i*CST))/.03);c.ln.style.opacity=o;
  });
  if(S[0].style.visibility==='visible'){updateCompass(p,dt);drawAurora(tNow+20)}else{preEnd();NDL.w=0}   // premier écran quitté pendant le trajet de l'aiguille : on la retire, sinon elle resterait figée au centre de la carte
  if(THREE_OK&&group)placePush(S[0].style.visibility==='visible'?p:-1);
  // s2
  S[1].style.setProperty('--hd',(p<.5?sm(.262,.292,p):1).toFixed(3));
  if(S[1].style.visibility==='visible'){PARC.ensure();PARC.update(clamp((p-.30)/.19),dt,1-sm(.31,.38,p),clamp((p-.478)/.062))}
  // s3
  if(S[2].style.visibility==='visible')drawPuddle(clamp((p-.55)/.24),dt);
  // s4
  if(S[3].style.visibility==='visible'){updateBivouac(p);CAMP.ensure();CAMP.update(clamp((p-.78)/.14),dt)}
  drawWarp(p);
  announce(sceneIndex(p));
  const intro=p<.25;document.body.classList.toggle('intro',intro);
  hint.textContent=p>.97?'Encore un pas : la boucle se referme':'';
  hint.style.opacity=p>.97?1:0;
  const ctaOn=loaded&&p<.05;cta.style.opacity=ctaOn?1:0;cta.style.visibility=ctaOn?'visible':'hidden';
}

/* ---------- Mode statique ---------- */
const STATIC_P=[.0,.41,.66,.86];
function drawStatic(){
  S.forEach((s,i)=>{setVars(s,palette(STATIC_P[i]));s.style.opacity=1;s.style.visibility='visible'});
  pal=palette(.66);
  layoutTools();sizeThree();sizePuddle();
  head1.style.opacity=1;head2.style.opacity=1;
  chips.forEach(c=>{c.li.style.opacity=1;c.li.style.visibility='visible';c.li.style.transform=isMobile()?'none':'scale(1)';c.ln.style.strokeDashoffset=0;c.ln.style.opacity=1});
  if(THREE_OK){nRot=0;pal=palette(0);updateCompass(.2,0)}
  drawAurora(14);
  pal=palette(.4);PARC.ensure();PARC.staticView();
  drops.length=0;ripples.length=0;flights.length=0;
  pal=palette(.66);
  splash(shoeX(.5));for(let i=0;i<14;i++)stepParticles(.016);
  drawPuddle(.5,0,true);
  $('#pAbout').classList.add('on');$('#pBlog').classList.add('on');
  $('#pAbout').style.transitionDelay=$('#pBlog').style.transitionDelay='0s';
  bivtext.style.opacity=1;bivtext.style.visibility='visible';bivtext.style.pointerEvents='auto';stars.style.opacity=1;restartBtn.style.opacity=1;restartBtn.style.visibility='visible';CAMP.ensure();CAMP.update(1,0,true);
  $('#s4').style.background='var(--bg)';
}
function setStatic(v){
  staticMode=v;document.body.classList.toggle('static',v);
  $('#tgStatic').setAttribute('aria-pressed',String(v));
  if(v){root.style.overflow='';drawStatic();scrollTo(0,0)}
  else{
    S.forEach(s=>{['--bg','--fg','--muted','--line','--acc','--acc-text','--card'].forEach(n=>s.style.removeProperty(n));s.style.background=''});
    $('#pAbout').style.transitionDelay=$('#pBlog').style.transitionDelay='';
    layoutTools();sizeThree();sizePuddle();
    drops.length=0;ripples.length=0;flights.length=0;lastStep=-1;pS=0;
  }
}

/* ---------- Défilement infini ---------- */
const maxScroll=()=>document.documentElement.scrollHeight-innerHeight;
function jumpTo(p){scrollTo(0,unwarp(p)*maxScroll());pS=p}
let lastY=0,wheelAcc=0,lap=1;
function setLap(){}   // le premier écran n'affiche plus « Se repérer · Km 0 » (nom et métier à la place) ; le tour reste compté dans lap
addEventListener('scroll',()=>{
  if(staticMode||!loaded)return;
  const y=scrollY,m=maxScroll();
  if(y>=m-2&&y>lastY){lap++;setLap();jumpTo(.0004);lastY=scrollY;return}
  lastY=y;
},{passive:true});
/* Pas de retour en arrière avant l'accueil : remonter tout en haut s'arrête sur le premier écran (le tour ne revient plus à la fin de la boucle). Seule la fin du parcours reboucle vers l'accueil. */
addEventListener('pointermove',e=>{mx=(e.clientX/innerWidth-.5)*2;my=(e.clientY/innerHeight-.5)*2},{passive:true});

/* ---------- Commandes ---------- */
$('#railNav').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  if(staticMode){document.getElementById(b.dataset.s).scrollIntoView({behavior:'auto'});return}
  scrollTo({top:unwarp(parseFloat(b.dataset.p))*maxScroll(),behavior:reduce?'auto':'smooth'});
});
/* ---------- Menus en burger : étapes du parcours et outils de réglage (motif « disclosure » : bouton, état, panneau) ---------- */
const burgers=[...$$('.burger')];
function menuOf(b){return document.getElementById(b.getAttribute('aria-controls'))}
function setMenu(b,open){b.setAttribute('aria-expanded',String(open));menuOf(b).hidden=!open}
function closeMenus(except){burgers.forEach(b=>{if(b!==except&&b.getAttribute('aria-expanded')==='true')setMenu(b,false)})}
burgers.forEach(b=>{
  b.addEventListener('click',()=>{const open=b.getAttribute('aria-expanded')!=='true';closeMenus(open?b:null);setMenu(b,open)});
  menuOf(b).addEventListener('focusout',e=>{const n=e.relatedTarget;if(n&&(menuOf(b).contains(n)||b.contains(n)))return;if(n)setMenu(b,false)});   // le focus quitte le menu : il se ferme
});
addEventListener('pointerdown',e=>{if(!e.target.closest('.menu,.burger'))closeMenus(null)});
addEventListener('keydown',e=>{
  if(e.key!=='Escape')return;const b=burgers.find(x=>x.getAttribute('aria-expanded')==='true');
  if(!b||document.querySelector('dialog[open]'))return;
  e.menuHandled=true;setMenu(b,false);b.focus();
});
$('#railNav').addEventListener('click',()=>{if(TOUR.on)tourEnd(false)},true);   // choisir une étape reprend la main sur le parcours guidé
$('#railNav').addEventListener('click',()=>closeMenus(null));
$('#openSet').addEventListener('click',()=>closeMenus(null));
$('#brand').addEventListener('click',e=>{e.preventDefault();staticMode?scrollTo(0,0):jumpTo(.0004);$('#main').focus({preventScroll:true})});
$('#tgPause').addEventListener('click',e=>{paused=!paused;document.body.classList.toggle('paused',paused);e.currentTarget.setAttribute('aria-pressed',String(paused))});
$('#tgStatic').addEventListener('click',()=>{setStatic(!staticMode);try{localStorage.setItem('asc-static',staticMode?'1':'0')}catch(e){}});
$('#loadSkip').addEventListener('click',()=>{finishLoad();$('#main').focus({preventScroll:true})});
$('#tgNight').addEventListener('click',e=>{
  theme=theme==='dark'?'light':'dark';root.dataset.theme=theme;if(strapApply)strapApply(theme==='dark');applyDialTheme();
  try{localStorage.setItem('asc-theme',theme)}catch(err){}
  e.currentTarget.setAttribute('aria-pressed',String(theme==='dark'));
  if(staticMode)drawStatic();
});
root.dataset.theme=theme;$('#tgNight').setAttribute('aria-pressed',String(theme==='dark'));
$('#tgStatic').setAttribute('aria-pressed',String(staticMode));
let rz;addEventListener('resize',()=>{clearTimeout(rz);rz=setTimeout(()=>{layoutTools();sizeThree();sizePuddle();if(staticMode)drawStatic()},80)});


/* ---------- Raccourci recruteur, pied de page, dialogues ---------- */
const dlg=$('#dlg');
$('#ftContact').addEventListener('click',()=>{
  finishLoad();
  if(staticMode){document.getElementById('s4').scrollIntoView({behavior:'auto'});return}
  root.style.overflow='';jumpTo(.845);$('#main').focus({preventScroll:true});
});
const DLG={
  legal:{t:'Mentions légales',b:`<h3>Éditeur</h3><p>Adrien Neyron, entrepreneur individuel en EURL, Haute-Savoie (France).</p><p class="todo">[SIRET et adresse à renseigner]</p>
    <h3>Directeur de la publication</h3><p>Adrien Neyron.</p>
    <h3>Contact</h3><p class="todo">[adresse e-mail à renseigner]</p>
    <h3>Hébergeur</h3><p>Vercel Inc., États-Unis (vercel.com).</p>
    <h3>Crédits</h3><p>Les photos d'ambiance viennent d'Unsplash ; chaque crédit figure sur la fiche du projet concerné.</p><p>Titres : police « Cormorant Garamond » © The Cormorant Project Authors, licence <a href="https://openfontlicense.org/" target="_blank" rel="noopener">SIL OFL 1.1<span class="sr-only"> (nouvel onglet)</span></a>, hébergée sur ce site.</p>
    <h3>Données personnelles</h3><p>Météo locale : pour afficher l'altitude et la météo en bas de l'écran, votre ville approximative est déduite de votre adresse IP par l'hébergeur (Vercel). Seules des coordonnées arrondies (à une dizaine de kilomètres près) sont transmises au service météo Open-Meteo (open-meteo.com), sans votre adresse IP. Aucune de ces données n'est conservée.</p><p class="todo">[finalités, durée de conservation et droits d'accès pour le formulaire de contact : à rédiger]</p>`},
  a11y:{t:'Déclaration d\'accessibilité',b:`<p>Ce site vise la conformité au niveau AA des WCAG 2.1 et au RGAA 4.1.</p>
    <h3>État de conformité</h3><p class="todo">[non évalué : audit RGAA à réaliser avant la mise en ligne]</p>
    <h3>Ce qui est prévu</h3><ul><li>Tout le contenu est en texte ; la 3D et les décors sont ignorés par les lecteurs d'écran.</li><li>Un plan de navigation permet d'atteindre chaque scène au clavier.</li><li>Boutons « Pause », « Vue statique » et « Mode nuit ». La vue statique s'active seule si votre appareil demande moins d'animations.</li><li>Lien d'évitement, focus visible, cibles d'au moins 44 px.</li></ul>
    <h3>Signaler un problème</h3><p class="todo">[adresse e-mail accessibilité à renseigner]</p>
    <h3>Voie de recours</h3><p>Sans réponse satisfaisante, vous pouvez saisir le Défenseur des droits (defenseurdesdroits.fr).</p>
    <h3>Établie le</h3><p>29 septembre 2026.</p>`}
};
$$('[data-dlg]').forEach(b=>b.addEventListener('click',()=>{
  const c=DLG[b.dataset.dlg];$('#dlgT').textContent=c.t;$('#dlgB').innerHTML=c.b;
  root.style.overflow='hidden';dlg.showModal();
}));
$('#dlgX').addEventListener('click',()=>dlg.close());
dlg.addEventListener('click',e=>{if(e.target===dlg)dlg.close()});
dlg.addEventListener('close',()=>{root.style.overflow=(loaded||staticMode)?'':'hidden'});



/* ---------- Détails vivants : aiguille, vibrations, sons en couches, ligne du jour ---------- */
const ptr={x:0,y:0,t:-99};
addEventListener('pointermove',e=>{if(e.pointerType==='mouse'){ptr.x=e.clientX;ptr.y=e.clientY;ptr.t=tNow}},{passive:true});
const orient={on:false,heading:null};
function onOrient(e){
  let h=null;
  if(typeof e.webkitCompassHeading==='number')h=e.webkitCompassHeading;
  else if(e.absolute&&e.alpha!=null)h=360-e.alpha;
  if(h!=null)orient.heading=h;
}
async function setOrient(on){
  const b=$('#tgOrient');
  if(on){
    try{
      if(typeof DeviceOrientationEvent!=='undefined'&&typeof DeviceOrientationEvent.requestPermission==='function'){
        const r=await DeviceOrientationEvent.requestPermission();
        if(r!=='granted'){b.setAttribute('aria-pressed','false');return}
      }
      addEventListener('deviceorientationabsolute',onOrient,true);addEventListener('deviceorientation',onOrient,true);
      orient.on=true;
    }catch(err){orient.on=false}
  }else{
    removeEventListener('deviceorientationabsolute',onOrient,true);removeEventListener('deviceorientation',onOrient,true);
    orient.on=false;orient.heading=null;
  }
  b.setAttribute('aria-pressed',String(orient.on));
}
$('#tgOrient').addEventListener('click',()=>setOrient(!orient.on));
if(('ontouchstart' in window||navigator.maxTouchPoints>0)&&typeof DeviceOrientationEvent!=='undefined')$('#rowOrient').hidden=false;

let hapticOn=true;try{hapticOn=localStorage.getItem('asc-haptic')!=='0'}catch(e){}
function haptic(p){if(hapticOn&&!reduce&&!paused&&navigator.vibrate)try{navigator.vibrate(p)}catch(e){}}
if(navigator.vibrate)$('#rowHaptic').hidden=false;
$('#tgHaptic').setAttribute('aria-pressed',String(hapticOn));
$('#tgHaptic').addEventListener('click',e=>{hapticOn=!hapticOn;e.currentTarget.setAttribute('aria-pressed',String(hapticOn));try{localStorage.setItem('asc-haptic',hapticOn?'1':'0')}catch(err){}if(hapticOn)haptic(15)});

let lastBlip=0;
function blip(freq,dur,vol,q=1.2,type='bandpass'){
  if(!soundOn||!actx||!whiteBuf)return;
  const t=actx.currentTime;if(t-lastBlip<.06)return;lastBlip=t;
  const src=actx.createBufferSource();src.buffer=whiteBuf;
  const f=actx.createBiquadFilter();f.type=type;f.frequency.value=freq;f.Q.value=q;
  const g=actx.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.004);g.gain.exponentialRampToValueAtTime(.001,t+dur);
  src.connect(f);f.connect(g);g.connect(actx.destination);src.start(t,Math.random(),dur+.05);
}
const tick=()=>blip(2800,.045,.3,6);
const tickSoft=()=>blip(3600,.028,.14,8);   // clic d'horlogerie discret au survol des métriques
const crunch=()=>blip(2600+Math.random()*1400,.09,.22,.8,'highpass');
let lastStepIdx=-1;
function stepSounds(p){
  const i=Math.floor(p/.004);
  if(i!==lastStepIdx){lastStepIdx=i;if(p>.3&&p<.5)crunch()}
}

/* Bas d'écran : altitude, heure et météo du lieu du visiteur (heure du navigateur ; altitude et météo via /api/local-weather,
   géolocalisation IP de Vercel + Open-Meteo). Sans position connue (en local, ou si l'API échoue) : seulement l'heure. */
function updateLive(){
  $('#live2').textContent=new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
}
function updateWeather(){
  fetch('/api/local-weather').then(r=>r.ok?r.json():null).then(w=>{
    if(!w||!w.located)return;
    $('#alt').textContent=w.altitude.toLocaleString('fr-FR');$('#hudAlt').hidden=false;
    $('#hudWx').textContent=` · ${w.temperature} °C${w.weather?' '+w.weather:''}`;$('#hudWx').hidden=false;
  }).catch(()=>{});
}
updateWeather();__ivs.push(setInterval(updateWeather,15*60000));
updateLive();__ivs.push(setInterval(updateLive,30000));

/* ---------- Grands mots, altimètre latéral, son ---------- */
const railDot=$('#railDot'),railDone=$('#railDone');let mapRail=null;
const HW=[$('#h1'),$('#head2 h2'),$('#h-map'),$('#h-flaque'),$('#h-biv')];
function updateExtras(p,pr){
  const skew=(reduce||paused)?0:clamp((pr-p)*500,-8,8);
  {const r=mapRail?mapRail(p):null;   // zone de la carte : la barre devient la frise des étapes (calculée avec les étapes, plus bas)
   {const tp=(r?r.top:p*100).toFixed(2)+'%';railDot.style.top=tp;railDone.style.height=tp}railDot.parentNode.style.setProperty('--tk',(r?1-r.zk:1).toFixed(3));}
  if(!reduce){
    const W=[[HW[0],p<.5?lerp(800,350,sm(0,.05,p)):lerp(350,800,sm(.95,1,p))],[HW[1],lerp(800,350,sm(.06,.14,p))],[HW[2],lerp(800,350,sm(.27,.36,p))],[HW[3],lerp(800,350,sm(.51,.6,p))],[HW[4],lerp(800,350,sm(.79,.86,p))]];
    W.forEach(([el,w])=>{el.style.fontVariationSettings=`'wght' ${Math.round(w)}`});
  }
}
let actx=null,windG=null,noiseBuf=null,whiteBuf=null,soundOn=false,lastWind=0;
function initAudio(){
  actx=new (window.AudioContext||window.webkitAudioContext)();
  const len=actx.sampleRate*2;
  noiseBuf=actx.createBuffer(1,len,actx.sampleRate);whiteBuf=actx.createBuffer(1,len,actx.sampleRate);
  const a=noiseBuf.getChannelData(0),b=whiteBuf.getChannelData(0);let last=0;
  for(let i=0;i<len;i++){const w=Math.random()*2-1;b[i]=w;last=(last+.02*w)/1.02;a[i]=last*3.5}
  const src=actx.createBufferSource();src.buffer=noiseBuf;src.loop=true;
  const lp=actx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=420;
  const lfo=actx.createOscillator();lfo.frequency.value=.12;const lg=actx.createGain();lg.gain.value=180;lfo.connect(lg);lg.connect(lp.frequency);
  windG=actx.createGain();windG.gain.value=0;
  src.connect(lp);lp.connect(windG);windG.connect(actx.destination);src.start();lfo.start();
}
function setSound(on){
  soundOn=on;$('#tgSound').setAttribute('aria-pressed',String(on));$('#tgSoundTop').setAttribute('aria-pressed',String(on));
  if(on){if(!actx)initAudio();actx.resume()}
  if(windG)windG.gain.setTargetAtTime(on?.16*(1-.9*sm(.8,.9,pS)):0,actx.currentTime,.4);
}
function splashSound(){   // pas dans l'eau : bruit feutré qui s'assombrit, avec un petit « plop » grave
  if(!soundOn||!actx)return;
  const t=actx.currentTime,src=actx.createBufferSource();src.buffer=whiteBuf;
  const lp=actx.createBiquadFilter();lp.type='lowpass';lp.frequency.setValueAtTime(2400,t);lp.frequency.exponentialRampToValueAtTime(500,t+.3);
  const g=actx.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.2,t+.02);g.gain.exponentialRampToValueAtTime(.001,t+.34);
  src.connect(lp);lp.connect(g);g.connect(actx.destination);src.start(t,Math.random(),.4);
  const o=actx.createOscillator(),og=actx.createGain();o.type='sine';o.frequency.setValueAtTime(260,t);o.frequency.exponentialRampToValueAtTime(90,t+.16);
  og.gain.setValueAtTime(0,t);og.gain.linearRampToValueAtTime(.07,t+.01);og.gain.exponentialRampToValueAtTime(.001,t+.2);o.connect(og);og.connect(actx.destination);o.start(t);o.stop(t+.22);
}
$('#tgSound').addEventListener('click',()=>setSound(!soundOn));
$('#tgSoundTop').addEventListener('click',()=>setSound(!soundOn));
const tgEco=$('#tgEco');
function ecoSync(){tgEco.setAttribute('aria-pressed',String(QC.tier>=1))}
tgEco.addEventListener('click',()=>{const on=QC.tier<1;QC.tier=on?Math.max(1,QC.base):0;try{localStorage.setItem('asc-eco',on?'1':'0')}catch(e){}applyQuality();ecoSync()});
ecoSync();
function setCharte(v){
  charte=v?'expe':'papier';root.dataset.charte=charte;$('#tgCharte').setAttribute('aria-pressed',String(v));
  try{localStorage.setItem('asc-charte',charte)}catch(e){}
  if(staticMode)drawStatic();
}
$('#tgCharte').addEventListener('click',()=>setCharte(charte!=='expe'));
root.dataset.charte=charte;$('#tgCharte').setAttribute('aria-pressed',String(charte==='expe'));
const setDlg=$('#setDlg');
$('#openSet').addEventListener('click',()=>{root.style.overflow='hidden';setDlg.showModal()});
$('#setX').addEventListener('click',()=>setDlg.close());
setDlg.addEventListener('click',e=>{if(e.target===setDlg)setDlg.close()});
setDlg.addEventListener('close',()=>{root.style.overflow=(loaded||staticMode)?'':'hidden'});


/* ---------- Points d'interaction : qualités aux points cardinaux, compétences, expérience ---------- */
const HOT={
  n:{t:'Résilience',d:'Cap fixe face aux bugs.',b:0,p:[0,1.40],r:.42},
  e:{t:'Écoute active',d:'Collaboration d\'équipe.',b:90,p:[1.36,0],r:.42},
  s:{t:'Stabilité',d:'Gestion de la pression.',b:180,p:[0,-1.46],r:.40},
  o:{t:'Ouverture d\'esprit',d:'Curiosité technique.',b:270,p:[-1.36,0],r:.42},
  stack:{t:'Adrien Neyron',d:'Développeur, traileur, formateur.',b:0,p:[0,.62],r:.34},
  exp:{t:'Expérience',d:'12 ans de formation et de management, puis 5 ans de code.',b:180,p:[0,-.95],r:.34}
};
const tip=$('#tip'),tipT=$('#tipT'),tipD=$('#tipD');
const hotEls=Object.keys(HOT).map(k=>{
  const b=document.createElement('button');b.type='button';b.className='hot';b.dataset.k=k;
  b.setAttribute('aria-label',HOT[k].t+' : '+HOT[k].d);b.setAttribute('aria-pressed','false');
  S[0].appendChild(b);return b;
});
function refreshAim(){
  aimKey=pinnedKey||hoverKey;
  hotEls.forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.k===pinnedKey));if(b.dataset.k===aimKey)b.setAttribute('aria-describedby','tip');else b.removeAttribute('aria-describedby')});
  if(aimKey){tipT.textContent=HOT[aimKey].t;tipD.textContent=HOT[aimKey].d;tip.classList.add('on')}else tip.classList.remove('on');
}
hotEls.forEach(b=>{
  const k=b.dataset.k;
  b.addEventListener('pointerenter',()=>{hoverKey=k;refreshAim();tickSoft()});
  b.addEventListener('pointerleave',()=>{hoverKey=null;refreshAim()});
  b.addEventListener('focus',()=>{hoverKey=k;refreshAim();tickSoft()});
  b.addEventListener('blur',()=>{if(hoverKey===k)hoverKey=null;refreshAim()});
  b.addEventListener('click',()=>{pinnedKey=pinnedKey===k?null:k;refreshAim();haptic(10);tick()});
});
addEventListener('keydown',e=>{if(e.key==='Escape'&&pinnedKey){pinnedKey=null;refreshAim()}});
const _pv=THREE_OK?new THREE.Vector3():null,_pw=THREE_OK?new THREE.Vector3():null;
function placeHot(p){
  const w=cv.clientWidth,h=cv.clientHeight,vis1=loaded?(p<.5?1-sm(CSP-.02,CSP,p):sm(.98,1,p)):0;   // les zones du cadran ne sont plus disponibles dès que les boutons du boîtier apparaissent
  stand.updateMatrixWorld(true);
  hotEls.forEach(b=>{
    const H=HOT[b.dataset.k];
    _pv.set(H.p[0],H.p[1],.06);group.localToWorld(_pv);_pv.project(cam);
    _pw.set(H.p[0]+H.r,H.p[1],.06);group.localToWorld(_pw);_pw.project(cam);
    const x=(_pv.x*.5+.5)*w,y=(-_pv.y*.5+.5)*h,d=Math.max(44,Math.abs(_pw.x-_pv.x)*w);
    b.style.left=x.toFixed(1)+'px';b.style.top=y.toFixed(1)+'px';b.style.width=b.style.height=d.toFixed(1)+'px';
    b.style.opacity=vis1.toFixed(2);b.style.visibility=vis1<.05?'hidden':'visible';
    if(b.dataset.k===aimKey){tip.style.left=clamp(x,130,w-130).toFixed(1)+'px';tip.style.top=(y+d/2+8).toFixed(1)+'px'}
  });
}

/* ---------- Boutons du boîtier : chacun fait apparaître une carte de l'atelier (survol ou focus), le clic ouvre sa fiche ----------
   Avec une souris, les cartes restent cachées tant qu'aucun bouton n'est survolé, puis toutes s'affichent en fin de scène. Sur écran tactile, sur mobile,
   en vue statique ou sans 3D, toutes les cartes restent visibles comme avant. */
const hoverCards=()=>THREE_OK&&!staticMode&&!isMobile()&&matchMedia('(hover:hover) and (pointer:fine)').matches;
let pushHover=-1,cardHover=-1,pushOff=0;const REV=TOOLS.map(()=>0);
const pushEls=TOOLS.map((t,i)=>{
  const b=document.createElement('button');b.type='button';b.className='push';
  b.setAttribute('aria-label',t.n+' : '+t.d+(TOOL_INFO[i]?' (ouvre la fiche)':''));
  S[0].appendChild(b);
  const on=()=>{clearTimeout(pushOff);if(pushHover!==i)tickSoft();pushHover=i;toolAim=i};
  b.addEventListener('pointerenter',on);b.addEventListener('focus',on);
  b.addEventListener('pointerleave',()=>{clearTimeout(pushOff);pushOff=setTimeout(()=>{if(pushHover===i){pushHover=-1;toolAim=-1}},120)});   // le temps d'aller du bouton à la carte
  b.addEventListener('blur',()=>{if(pushHover===i){pushHover=-1;toolAim=-1}});
  b.addEventListener('click',()=>{haptic(10);tick();openTool(i,b)});
  return b;
});
chips.forEach((c,i)=>{
  c.li.addEventListener('pointerenter',()=>{clearTimeout(pushOff);cardHover=i});
  c.li.addEventListener('pointerleave',()=>{if(cardHover===i)cardHover=-1});
});
function cardReveal(i,dt){
  const tg=(i===cardHover)?1:0;   // le survol d'un bouton n'ouvre plus la carte : il change l'écran de la montre
  REV[i]=reduce?tg:REV[i]+(tg-REV[i])*(1-Math.exp(-dt*14));
  return REV[i];
}
function placePush(p){
  const w=cv.clientWidth,h=cv.clientHeight,vis=loaded&&p>=0&&p<.5?trap(p,CSP,CSP+.03,CEND[0],CEND[1]):0;
  stand.updateMatrixWorld(true);
  pushEls.forEach((b,i)=>{
    b.style.opacity=vis.toFixed(2);b.style.visibility=vis<.05?'hidden':'visible';
    if(vis<.05)return;
    const phi=(90-PUSH[i])*Math.PI/180;
    _pv.set(Math.cos(phi)*PUSH_R,Math.sin(phi)*PUSH_R,-.1);group.localToWorld(_pv);_pv.project(cam);
    const x=(_pv.x*.5+.5)*w,y=(-_pv.y*.5+.5)*h;
    b.style.left=x.toFixed(1)+'px';b.style.top=y.toFixed(1)+'px';
    b.classList.toggle('on',i===pushHover||i===cardHover);
  });
}

/* ---------- Fond vivant : relief topographique, halos de lumière, parallaxe ---------- */
const bgfx=$('#bgfx'),topoSvg=$('#topo'),halosEl=bgfx.querySelector('.halos');let topoKey='';
function buildTopoBg(){
  const W=innerWidth,H=innerHeight,key=W+'x'+H;if(key===topoKey||!W||!H)return;topoKey=key;
  topoSvg.setAttribute('viewBox',`0 0 ${W} ${H}`);topoSvg.innerHTML='';
  const cell=Math.max(12,Math.round(Math.min(W,H)/40)),nx=Math.ceil(W/cell)+1,ny=Math.ceil(H/cell)+1;
  let sd=31;const rnd=()=>{sd=(sd*16807)%2147483647;return sd/2147483647};
  const P=[];for(let i=0;i<9;i++)P.push([rnd()*W*1.1-.05*W,rnd()*H*1.1-.05*H,.4+rnd()*.6,Math.min(W,H)*(.18+rnd()*.22)]);
  const f=new Float32Array(nx*ny);
  for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){
    const x=i*cell,y=j*cell;let h=0;
    for(const [px,py,a,sg] of P){const dx=(x-px)/1.3,dy=y-py;h+=a*Math.exp(-(dx*dx+dy*dy)/(2*sg*sg))}
    f[j*nx+i]=h+.06*Math.sin(x/90+1.7)*Math.sin(y/70+.3);
  }
  const NS='http://www.w3.org/2000/svg';
  for(let li=0;li<18;li++){
    const L=.08+li*.055;let d='';
    for(let j=0;j<ny-1;j++)for(let i=0;i<nx-1;i++){
      const a=f[j*nx+i],b=f[j*nx+i+1],c=f[(j+1)*nx+i+1],dd=f[(j+1)*nx+i];
      const k=(a>L?8:0)|(b>L?4:0)|(c>L?2:0)|(dd>L?1:0);if(k===0||k===15)continue;
      const x0=i*cell,y0=j*cell,it=(v0,v1)=>(L-v0)/(v1-v0);
      const T=[x0+it(a,b)*cell,y0],R=[x0+cell,y0+it(b,c)*cell],B=[x0+it(dd,c)*cell,y0+cell],Lf=[x0,y0+it(a,dd)*cell];
      const segs={1:[[Lf,B]],2:[[B,R]],3:[[Lf,R]],4:[[T,R]],5:[[T,Lf],[B,R]],6:[[T,B]],7:[[T,Lf]],8:[[T,Lf]],9:[[T,B]],10:[[T,R],[Lf,B]],11:[[T,R]],12:[[Lf,R]],13:[[B,R]],14:[[Lf,B]]}[k];
      for(const [p,q] of segs)d+=`M${p[0].toFixed(0)} ${p[1].toFixed(0)}L${q[0].toFixed(0)} ${q[1].toFixed(0)}`;
    }
    if(!d)continue;
    const pa=document.createElementNS(NS,'path');pa.setAttribute('d',d);if(li%5===4)pa.setAttribute('class','m');topoSvg.appendChild(pa);
  }
}
let bgLight=false;
function updateBg(p){
  // teinte claire ou sombre selon le fond courant
  const m=pal['--bg'].match(/\d+/g),light=(.299*m[0]+.587*m[1]+.114*m[2])/255>.5;
  if(light!==bgLight){bgLight=light;bgfx.classList.toggle('light',light)}
  const t=paused||reduce?0:tNow;
  // halos : lampe frontale qui balaie, reflet de lune, éclat sur le métal
  bgfx.style.setProperty('--lx',(34+26*Math.sin(p*7+t*.05)).toFixed(1)+'vw');
  bgfx.style.setProperty('--ly',(36+12*Math.cos(p*5+t*.04)).toFixed(1)+'vh');
  bgfx.style.setProperty('--mx2',(80-16*Math.sin(p*4+1)).toFixed(1)+'vw');
  bgfx.style.setProperty('--my2',(16+8*Math.sin(p*6)).toFixed(1)+'vh');
  bgfx.style.setProperty('--gx',(((p*3.2+t*.004)%1.3)*110-10).toFixed(1)+'vw');
  bgfx.style.setProperty('--gy',(58-14*Math.sin(p*9)).toFixed(1)+'vh');
  // parallaxe : le relief suit le curseur en sens inverse, les halos dans le même sens, plus loin
  if(!reduce){
    topoSvg.style.transform=`translate3d(${(-mx*16).toFixed(1)}px,${(-my*11).toFixed(1)}px,0)`;
    halosEl.style.transform=`translate3d(${(mx*26).toFixed(1)}px,${(my*18).toFixed(1)}px,0)`;
  }
}


/* ---------- Transition : souffle, ligne GPX qui s'échappe du cadran, départ de l'expédition ---------- */
function swoosh(){
  if(!soundOn||!actx||!whiteBuf)return;
  const t=actx.currentTime,src=actx.createBufferSource();src.buffer=whiteBuf;
  const bp=actx.createBiquadFilter();bp.type='bandpass';bp.Q.value=.8;bp.frequency.setValueAtTime(350,t);bp.frequency.exponentialRampToValueAtTime(2600,t+.7);
  const g=actx.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.22,t+.25);g.gain.linearRampToValueAtTime(0,t+.85);
  src.connect(bp);bp.connect(g);g.connect(actx.destination);src.start(t,Math.random(),1);
}
function crackle(v){
  if(!soundOn||!actx||!whiteBuf)return;
  const t=actx.currentTime,src=actx.createBufferSource();src.buffer=whiteBuf;
  const bp=actx.createBiquadFilter();bp.type='bandpass';bp.frequency.value=1500+Math.random()*3800;bp.Q.value=1.1;
  const g=actx.createGain(),pk=.03+.12*(v||0)*Math.random()+.03*Math.random(),dur=.012+Math.random()*.03;
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(pk,t+.003);g.gain.exponentialRampToValueAtTime(.0005,t+dur);
  src.connect(bp);bp.connect(g);g.connect(actx.destination);src.start(t,Math.random(),dur+.02);
}
const cta=$('#cta');let cine=null;
function cinematicTo(pt,dur0,mode){
  const m=maxScroll(),y0=scrollY,y1=unwarp(pt)*m;
  if(reduce){scrollTo(0,y1);return}
  if(cine)cancelAnimationFrame(cine);
  const dur=dur0||2800,t0=performance.now();
  const step=now=>{const k=clamp((now-t0)/dur),e=mode==='in'?k*k*k:mode==='out'?1-Math.pow(1-k,3):(k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2);scrollTo(0,y0+(y1-y0)*e);cine=k<1?requestAnimationFrame(step):null};
  cine=requestAnimationFrame(step);
}
const stopCine=()=>{if(cine){cancelAnimationFrame(cine);cine=null}};
addEventListener('wheel',stopCine,{passive:true});addEventListener('touchstart',stopCine,{passive:true});
/* Carte des expériences : un cran de défilement = un projet. Un geste (cran de molette, glissé du pavé tactile ou du doigt) lance une transition
   vers le cairn suivant ou précédent ; pendant la transition et tant que la traîne d'inertie continue, les événements sont absorbés (jamais deux projets d'un coup).
   Aux deux bouts (avant le Départ, après la dernière étape), le défilement normal reprend : vers la montre, vers la pluie et la flaque.
   Clavier (flèches, Page suivante) et menu « Étapes » inchangés ; rien pendant la visite guidée, une fenêtre, un menu ouvert, ni en vue statique. */
{const gate=createWheelGate();let ty0=null;
 const stopP=()=>PARC.stopPs().map(s=>s.p),curP=()=>warp(clamp(scrollY/Math.max(1,maxScroll())));
 const inMap=()=>{const P=stopP(),p=curP();return p>P[0]-.03&&p<P[P.length-1]+.03};
 const target=dir=>{const P=stopP(),p=curP();if(dir>0)return P.findIndex(x=>x>p+.0015);for(let k=P.length-1;k>=0;k--)if(P[k]<p-.0015)return k;return -1};
 const go=dir=>{const i=target(dir);if(i<0)return false;gate.busy=performance.now()+(reduce?300:LOCK_MS);gate.tail=true;cinematicTo(stopP()[i],STEP_MS,'out');return true};   // ease-out : la carte bouge dès le cran, puis se pose en douceur
 const blocked=()=>TOUR.on||staticMode||!loaded||!!document.querySelector('dialog[open]')||!!document.querySelector('.burger[aria-expanded="true"]');
 const scrollsInside=(el,dy)=>{for(let n=el;n&&n!==document.body&&n.nodeType===1;n=n.parentElement){const cs=getComputedStyle(n);if(n.scrollHeight>n.clientHeight+1&&/(auto|scroll)/.test(cs.overflowY))if(dy>0?n.scrollTop+n.clientHeight<n.scrollHeight-1:n.scrollTop>0)return true}return false};   // le panneau d'étape défile d'abord
 const inScroller=el=>{for(let n=el;n&&n!==document.body&&n.nodeType===1;n=n.parentElement){if(n.scrollHeight>n.clientHeight+1&&/(auto|scroll)/.test(getComputedStyle(n).overflowY))return true}return false};   // le curseur est sur un panneau qui déborde (la card) : sa molette lui appartient, jamais à la trace
 const swallow=e=>{e.preventDefault();e.stopImmediatePropagation()};
 addEventListener('wheel',e=>{
   if(e.ctrlKey||blocked()||!inMap())return;
   if(inScroller(e.target)){if(!scrollsInside(e.target,e.deltaY))swallow(e);return}   // bout du panneau : rien ne remonte à la trace (ni cran, ni défilement de la page)
   const r=wheelGate(gate,performance.now(),e.deltaMode===1?e.deltaY*16:e.deltaY,d=>target(d)>=0);
   if(r.type==='pass')return;swallow(e);if(r.type==='step')go(r.dir)},{capture:true,passive:false});
 addEventListener('touchstart',e=>{ty0=(e.touches.length===1&&!blocked()&&inMap())?e.touches[0].clientY:null},{passive:true});
 addEventListener('touchmove',e=>{if(ty0==null)return;const dy=ty0-e.touches[0].clientY;if(Math.abs(dy)<6)return;if(inScroller(e.target)){ty0=null;return}   // le doigt est sur la card qui déborde : elle défile seule (overscroll-behavior: contain), la trace ne bouge pas
   
   if(target(Math.sign(dy))<0&&performance.now()>=gate.busy){ty0=null;return}   // bout de la carte : le doigt fait défiler normalement
   e.preventDefault()},{passive:false});
 addEventListener('touchend',e=>{if(ty0==null)return;const t=e.changedTouches[0],dy=t?ty0-t.clientY:0;ty0=null;if(Math.abs(dy)<40||performance.now()<gate.busy)return;go(Math.sign(dy))},{passive:true});
}
/* ---------- Parcours guidé : « Commencer l'expédition » déroule toute la boucle, avec un temps de lecture à chaque étape ---------- */
const tourEl=$('#tour'),tourLbl=$('#tourLbl'),tPause=$('#tPause'),tSkip=$('#tSkip'),tStop=$('#tStop'),tPauseIc=$('#tPauseIc');
const TOUR={on:false,paused:false,hold:0,i:0,pts:[],phase:'dwell',t:0,dw:0,y0:0,y1:0,dur:1,raf:0,last:0,hide:0};
function tourPlan(){
  const pts=[{p:0,move:0,dwell:.9,name:'Se repérer'},{p:.225,move:3.6,dwell:3.2,name:'S\'équiper'}];
  PARC.stopPs().forEach((s,i)=>pts.push({p:s.p,move:i===0?3.4:2.4,dwell:i===0?2.2:3.6,name:s.name}));
  pts.push({p:.64,move:4,dwell:4.5,name:'Persévérer'},{p:.875,move:4.6,dwell:5.5,name:'Se poser'},{p:.918,move:2.4,dwell:3,name:'Recommencer'});
  return pts;
}
function tourGoto(i){
  const P=TOUR.pts[i];TOUR.i=i;TOUR.y0=scrollY;TOUR.y1=unwarp(P.p)*maxScroll();TOUR.dur=Math.max(.01,P.move);TOUR.t=0;TOUR.dw=0;TOUR.phase=P.move>0?'move':'dwell';
  tourLbl.textContent=(i+1)+'/'+TOUR.pts.length+' · '+P.name;
  live.textContent='Parcours guidé, étape '+(i+1)+' sur '+TOUR.pts.length+' : '+P.name;
}
function tourTick(ts){
  if(!TOUR.on||DEAD)return;
  const dt=Math.min(.1,(ts-TOUR.last)/1000);TOUR.last=ts;
  if(!TOUR.paused&&!TOUR.hold&&!document.hidden){
    const P=TOUR.pts[TOUR.i];
    if(TOUR.phase==='move'){
      if(reduce){scrollTo(0,TOUR.y1);TOUR.phase='dwell';TOUR.dw=0}
      else{TOUR.t+=dt;const k=clamp(TOUR.t/TOUR.dur);scrollTo(0,lerp(TOUR.y0,TOUR.y1,ease(k)));if(k>=1){TOUR.phase='dwell';TOUR.dw=0}}
    }else{
      TOUR.dw+=dt;
      if(TOUR.dw>=P.dwell){if(TOUR.i>=TOUR.pts.length-1){tourEnd(true);return}tourGoto(TOUR.i+1)}
    }
  }
  TOUR.raf=requestAnimationFrame(tourTick);
}
function tourSetPaused(v){
  TOUR.paused=v;tPause.setAttribute('aria-pressed',String(v));
  tPause.setAttribute('aria-label',v?'Reprendre le parcours':'Mettre le parcours en pause');tPause.title=v?'Reprendre':'Pause';
  tPauseIc.setAttribute('d',v?'M7 5l12 7-12 7z':'M8 5v14M16 5v14');tPauseIc.setAttribute('fill',v?'currentColor':'none');
}
function startTour(){
  if(!loaded||staticMode||TOUR.on)return;
  stopCine();clearTimeout(TOUR.hide);TOUR.pts=tourPlan();TOUR.on=true;tourSetPaused(false);
  tourEl.classList.add('on');TOUR.last=performance.now();tourGoto(0);TOUR.raf=requestAnimationFrame(tourTick);
}
function tourEnd(done){
  const was=TOUR.on;TOUR.on=false;cancelAnimationFrame(TOUR.raf);if(!was)return;
  if(done){tourLbl.textContent='Parcours terminé';live.textContent='Parcours terminé. Vous pouvez recommencer ou explorer librement.';TOUR.hide=setTimeout(()=>tourEl.classList.remove('on'),6000)}
  else{tourEl.classList.remove('on');live.textContent='Parcours arrêté. Vous avez la main.'}
}
tPause.addEventListener('click',()=>tourSetPaused(!TOUR.paused));
tSkip.addEventListener('click',()=>{if(!TOUR.on)return;if(TOUR.i>=TOUR.pts.length-1)tourEnd(true);else tourGoto(TOUR.i+1)});
tStop.addEventListener('click',()=>{if(TOUR.on)tourEnd(false);else tourEl.classList.remove('on')});
// reprise en main : molette, geste de défilement, touches de navigation, Échap
addEventListener('wheel',e=>{if(TOUR.on&&e.deltaY!==0)tourEnd(false)},{passive:true});
addEventListener('touchmove',()=>{if(TOUR.on)tourEnd(false)},{passive:true});
addEventListener('keydown',e=>{
  if(!TOUR.on)return;const tg=(e.target&&e.target.tagName)||'';
  if(e.key==='Escape'&&!e.menuHandled&&!document.querySelector('dialog[open]')&&!document.querySelector('.burger[aria-expanded="true"]')){tourEnd(false);return}
  if(['ArrowUp','ArrowDown','PageUp','PageDown','Home','End'].includes(e.key)&&!/INPUT|TEXTAREA|SELECT/.test(tg))tourEnd(false);
});
// une fenêtre ouverte (profil, carnet, réglages…) met le parcours en attente ; il reprend à sa fermeture
if(window.HTMLDialogElement){const sm0=HTMLDialogElement.prototype.showModal;HTMLDialogElement.prototype.showModal=function(){TOUR.hold++;this.addEventListener('close',()=>{TOUR.hold=Math.max(0,TOUR.hold-1)},{once:true});return sm0.call(this)}}
cta.addEventListener('click',()=>{if(!loaded)return;if(staticMode){document.getElementById('s2').scrollIntoView({behavior:'auto'});return}startTour()});

let parcAlt=null;
const PARC=(()=>{
const DATA=[[45.8925,6.8002,1006],[45.8929,6.7995,995],[45.8937,6.7992,987],[45.8941,6.7982,985],[45.8949,6.7986,996],[45.8958,6.7986,1015],[45.8968,6.7989,1038],[45.8972,6.7988,1061],[45.8964,6.7979,1071],[45.8959,6.7968,1089],[45.896,6.7961,1109],[45.8959,6.7949,1122],[45.8965,6.7937,1133],[45.897,6.7925,1142],[45.8975,6.7913,1147],[45.8979,6.7901,1157],[45.8986,6.7891,1167],[45.8997,6.789,1178],[45.9002,6.7901,1190],[45.9004,6.7915,1197],[45.9009,6.7927,1203],[45.9009,6.7927,1216],[45.9009,6.7913,1230],[45.9012,6.7906,1247],[45.9016,6.7893,1267],[45.9021,6.7882,1279],[45.9025,6.7878,1293],[45.9032,6.7868,1310],[45.9041,6.787,1314],[45.9044,6.7883,1315],[45.9047,6.7895,1314],[45.9051,6.7901,1332],[45.9057,6.7911,1347],[45.9065,6.7903,1359],[45.9071,6.79,1377],[45.9079,6.7895,1415],[45.9085,6.7908,1433],[45.9094,6.791,1450],[45.9101,6.79,1467],[45.911,6.7894,1482],[45.912,6.7888,1495],[45.9128,6.7894,1511],[45.9137,6.7892,1535],[45.9147,6.7891,1548],[45.9156,6.7895,1564],[45.9166,6.7894,1573],[45.9177,6.7892,1581],[45.9186,6.7887,1600],[45.9196,6.7883,1617],[45.9206,6.7879,1632],[45.9216,6.7879,1647],[45.9226,6.7876,1666],[45.9236,6.7875,1689],[45.9246,6.7877,1707],[45.924,6.7886,1729],[45.9239,6.7894,1759],[45.9233,6.7905,1783],[45.9232,6.791,1805],[45.9233,6.7916,1830],[45.9234,6.7921,1854],[45.9227,6.7923,1884],[45.9221,6.7933,1907],[45.9225,6.7934,1934],[45.9225,6.7943,1956],[45.9222,6.7955,1975],[45.9219,6.7965,1994],[45.9219,6.7975,2029],[45.9217,6.7985,2060],[45.9213,6.7997,2091],[45.921,6.8007,2129],[45.9206,6.802,2170],[45.9203,6.8029,2211],[45.9201,6.8036,2225],[45.9207,6.8045,2219],[45.9199,6.8045,2179],[45.919,6.8049,2151],[45.9185,6.8061,2128],[45.9178,6.8072,2105],[45.9174,6.8085,2091],[45.9168,6.8097,2076],[45.916,6.8104,2043],[45.9153,6.8114,2015],[45.9148,6.8127,1997],[45.9146,6.814,1978],[45.9141,6.8128,1956],[45.914,6.8113,1938],[45.9137,6.81,1920],[45.9135,6.8086,1915],[45.9133,6.8071,1905],[45.9133,6.8057,1883],[45.9135,6.8042,1866],[45.9136,6.8028,1842],[45.9129,6.8032,1821],[45.9123,6.8043,1800],[45.9118,6.8054,1785],[45.9112,6.8067,1778],[45.9106,6.808,1779],[45.9103,6.8093,1766],[45.9104,6.8107,1742],[45.9101,6.812,1710],[45.9098,6.8134,1671],[45.9095,6.8147,1639],[45.9091,6.8161,1613],[45.9094,6.817,1631],[45.9099,6.8182,1647],[45.9104,6.8193,1652],[45.9109,6.8206,1661],[45.9118,6.8209,1660],[45.9124,6.8211,1681],[45.9124,6.8221,1703],[45.9127,6.8232,1724],[45.9132,6.8245,1742],[45.9141,6.8251,1768],[45.9149,6.8257,1797],[45.9156,6.8266,1825],[45.9162,6.8274,1853],[45.9165,6.8277,1884],[45.9171,6.8274,1915],[45.9179,6.8273,1928],[45.9189,6.8272,1947],[45.9197,6.8273,1965],[45.9201,6.8272,2001],[45.9204,6.8269,2031],[45.9211,6.8273,2056],[45.9216,6.8279,2087],[45.9222,6.8281,2131],[45.9222,6.8291,2160],[45.9226,6.8294,2175],[45.9233,6.8289,2193],[45.9239,6.8284,2210],[45.924,6.8291,2226],[45.9244,6.8292,2243],[45.9252,6.8297,2263],[45.925,6.8295,2256],[45.925,6.8305,2268],[45.9253,6.8317,2273],[45.9258,6.8329,2270],[45.9265,6.8334,2285],[45.9272,6.8334,2285],[45.9282,6.8338,2282],[45.9291,6.8345,2293],[45.9299,6.8344,2317],[45.9306,6.835,2331],[45.9316,6.835,2348],[45.9322,6.8351,2371],[45.9316,6.8361,2388],[45.9318,6.8364,2407],[45.9323,6.8367,2428],[45.933,6.8365,2455],[45.9336,6.8366,2477],[45.9337,6.8372,2499],[45.9338,6.8377,2521],[45.9341,6.8374,2501],[45.9345,6.8371,2480],[45.9354,6.8376,2461],[45.9363,6.8376,2444],[45.9366,6.8384,2427],[45.9355,6.8385,2410],[45.9353,6.8392,2385],[45.9356,6.8401,2358],[45.9349,6.8406,2335],[45.9359,6.841,2314],[45.9369,6.841,2296],[45.9378,6.8416,2277],[45.9371,6.8419,2247],[45.9374,6.8427,2224],[45.9375,6.8432,2205],[45.9375,6.8437,2184],[45.9378,6.8446,2163],[45.9376,6.8457,2144],[45.9373,6.8469,2119],[45.9378,6.8481,2100],[45.9379,6.8493,2071],[45.9375,6.8505,2054],[45.9367,6.851,2036],[45.9366,6.8502,2017],[45.9364,6.8497,1990],[45.9361,6.8495,1962],[45.936,6.8492,1937],[45.9356,6.8488,1908],[45.9353,6.8491,1887],[45.9351,6.849,1864],[45.9345,6.8499,1848],[45.9344,6.8493,1823],[45.934,6.849,1798],[45.9336,6.8489,1777],[45.9329,6.848,1762],[45.9319,6.8478,1741],[45.9326,6.8487,1714],[45.9318,6.8488,1691],[45.9313,6.8489,1668],[45.9315,6.8498,1643],[45.9309,6.8497,1619],[45.9312,6.851,1602],[45.931,6.8524,1590],[45.9306,6.8536,1581],[45.9303,6.8549,1564],[45.93,6.8558,1548],[45.93,6.8572,1526],[45.9295,6.8567,1494],[45.9289,6.8564,1468],[45.9284,6.8559,1444],[45.9287,6.8569,1430],[45.9279,6.8568,1403],[45.9279,6.8575,1378],[45.9274,6.8572,1353],[45.9271,6.8573,1334],[45.9275,6.8585,1316],[45.9269,6.858,1303],[45.9264,6.8579,1287],[45.927,6.859,1272],[45.9264,6.8586,1256],[45.9257,6.8577,1239],[45.9255,6.8587,1221],[45.9255,6.8591,1203],[45.9261,6.8601,1186],[45.9258,6.8605,1166],[45.9254,6.8611,1146],[45.9252,6.8624,1126],[45.9246,6.8633,1107],[45.9239,6.8641,1092],[45.9237,6.8656,1075],[45.9235,6.867,1061],[45.9242,6.8679,1056],[45.924,6.8693,1048],[45.9227,6.8692,1049],[45.922,6.8682,1050],[45.9211,6.8675,1050],[45.9203,6.8667,1050],[45.9195,6.8659,1050],[45.9189,6.8646,1050],[45.9184,6.8633,1050],[45.9181,6.8619,1051],[45.9179,6.8605,1055],[45.9177,6.8591,1055],[45.9174,6.8576,1055],[45.9172,6.8561,1054],[45.917,6.8548,1052],[45.9166,6.8532,1047],[45.9164,6.852,1041],[45.9161,6.8505,1032],[45.9156,6.8493,1028],[45.915,6.8482,1029],[45.9146,6.8469,1028],[45.9136,6.8461,1032],[45.9126,6.8458,1030],[45.9117,6.8453,1029],[45.9109,6.8443,1033],[45.9102,6.8433,1036],[45.9095,6.8423,1032],[45.909,6.841,1033],[45.9087,6.8397,1031],[45.9081,6.8384,1026],[45.9076,6.8372,1017],[45.9074,6.8359,1018],[45.9066,6.8349,1018],[45.9063,6.8336,1029],[45.9055,6.8328,1018],[45.9049,6.8316,1026],[45.9043,6.8305,1018],[45.9034,6.8295,1016],[45.9026,6.8287,1009],[45.9025,6.8273,1007],[45.9016,6.8267,1006],[45.9012,6.8253,1005],[45.9009,6.824,1005],[45.9007,6.8226,1005],[45.9005,6.8212,1004],[45.9007,6.8198,1023],[45.9008,6.8185,1036],[45.9012,6.8171,1038],[45.9016,6.8159,1039],[45.9017,6.8144,1040],[45.9016,6.8129,1043],[45.9015,6.8114,1044],[45.9012,6.81,1034],[45.9009,6.8087,1024],[45.9004,6.8074,1012],[45.8999,6.8061,1006],[45.8993,6.805,1003],[45.8986,6.8039,1005],[45.8979,6.8028,1008],[45.8975,6.8015,1010],[45.8971,6.8004,1008],[45.8962,6.7997,1003],[45.8953,6.7992,997],[45.8943,6.7987,992],[45.8939,6.7986,986],[45.8933,6.7998,995],[45.8926,6.7997,1007]];
const cv=$('#parcCanvas');

/* ---------- Étapes de la trace : source unique (admin « Étapes », utils/stages.ts, docs/admin-boucle.md) ----------
   Départ, étapes numérotées, bivouac (petit marqueur sans numéro) et cairn final (« Étape à écrire ensemble », lien vers Contact), dans l'ordre chronologique.
   Abscisses, km et D+ viennent de buildStageView : étapes à intervalles égaux, bivouac entre ses deux voisins. Les liens mènent aux vraies fiches (/projects/<slug>).
   Les fiches de l'atelier (PROJECT_INFO, CV_FACTS) ne pilotent plus la trace. */
const STAGES=loopStages(CMS);
const PROJECTS=STAGES.map((s,i)=>({id:i===0?'depart':s.kind==='final'?'next':'st-'+(s.key||i),sg:s,kind:s.kind,when:s.stelePeriod||s.period,title:s.title,cairnTitle:s.steleTitle||s.title,place:s.place||'',stage:s.label,
  tags:s.steleTags||(s.figure?[s.keyResult]:s.links.map(l=>l.title)),result:s.keyResult,mat:s.kind==='final'?'ghost':'stone',t:s.t,small:s.kind==='bivouac'}));   // tags : ligne du bas de la stèle (saisie dans l'admin, sinon chiffre, sinon fiches liées : calculé par buildStageView)
const OFFICIAL=TRAIL_TOTAL;   // ≈ 180 km et 10 200 m de D+ (simulation inspirée de la Diagonale des Fous), répartis entre les étapes

/* ---------- Trace et relief : position locale (1 unité = 10 m), altitudes exagérées de 50 % ---------- */
const SC=.1,EX=1.5;
const lat0=DATA.reduce((a,p)=>a+p[0],0)/DATA.length,lon0=DATA.reduce((a,p)=>a+p[1],0)/DATA.length;
const kx=111320*Math.cos(lat0*Math.PI/180)*SC,kz=110540*SC;
const PR=DATA.map(([la,lo,al])=>({x:(lo-lon0)*kx,z:-(la-lat0)*kz,y:al*SC*EX,alt:al}));
/* Itinéraire fluide : les points GPS bruts (en dents de scie) sont lissés par deux passes d'une fenêtre en cloche, les extrémités restent fixes ; les altitudes brutes (alt) servent toujours aux chiffres */
const smoothPath=a=>{const W=[1,4,9,16,20,16,9,4,1],n=a.length;return a.map((p,i)=>{let sx=0,sz=0,sy=0,sw=0;for(let k=-4;k<=4;k++){const q=a[i+k];if(!q)continue;const w=W[k+4];sx+=q.x*w;sz+=q.z*w;sy+=q.y*w;sw+=w}
  const e=Math.min(1,Math.min(i,n-1-i)/8),u=e*e*(3-2*e);return {x:p.x+(sx/sw-p.x)*u,z:p.z+(sz/sw-p.z)*u,y:p.y+(sy/sw-p.y)*u,alt:p.alt}})};
/* Trace apaisée : en plus, un lissage gaussien large en plan (σ = TRACE_SIGMA points, ≈ 100 m chacun, soit ≈ 1,5 km ; fenêtre 3σ) efface les lacets du sentier.
   La hauteur (y) est lissée de la même façon : la trace, plus courte, ne grimpe pas en épingle sur les pics (le relief, reconstruit autour d'elle, la suit). Les chiffres (altitude, D+) gardent les altitudes GPS (alt).
   Les extrémités restent fixes (fondu sur 4 points) : le Départ reste sous l'aiguille. */
const TRACE_SIGMA=15;
const calmPath=(a,sg)=>{const R=Math.ceil(sg*3),n=a.length,W=Array.from({length:2*R+1},(_,k)=>Math.exp(-((k-R)**2)/(2*sg*sg)));
  return a.map((p,i)=>{let sx=0,sz=0,sy=0,sw=0;for(let k=-R;k<=R;k++){const q=a[Math.min(n-1,Math.max(0,i+k))],w=W[k+R];sx+=q.x*w;sz+=q.z*w;sy+=q.y*w;sw+=w}
    const e=Math.min(1,Math.min(i,n-1-i)/4),u=e*e*(3-2*e);return {x:p.x+(sx/sw-p.x)*u,z:p.z+(sz/sw-p.z)*u,y:p.y+(sy/sw-p.y)*u,alt:p.alt}})};
const P=(()=>{const A=smoothPath(smoothPath(PR)),B=calmPath(A,TRACE_SIGMA),len=Q=>{let L=0;for(let i=1;i<Q.length;i++)L+=Math.hypot(Q[i].x-Q[i-1].x,Q[i].z-Q[i-1].z);return L};
  const k=len(A)/len(B),x0=B[0].x,z0=B[0].z;   // le lissage raccourcit la trace (≈ −23 %) : on lui rend sa longueur en plan, sinon les étapes se rapprochent et la caméra (92 unités derrière l'aiguille) bute sur le cairn précédent
  return B.map(p=>({x:x0+(p.x-x0)*k,z:z0+(p.z-z0)*k,y:p.y,alt:p.alt}))})();
/* Une trace continue, qui ne revient pas à son point de départ : le tracé réel est une boucle (arrivée à 40 m du départ). On l'ouvre en décalant ses points vers l'extérieur de la boucle, de plus en plus (nul au départ, 4,2 km à l'arrivée) : le premier kilomètre reste intact et l'arrivée tombe loin du départ. Les altitudes (alt, y) ne changent pas. */
const DRIFT_KM=4.2;
(()=>{const n=P.length,L=[0];for(let i=1;i<n;i++)L.push(L[i-1]+Math.hypot(P[i].x-P[i-1].x,P[i].z-P[i-1].z));const tot=L[n-1]||1;
  let cx=0,cz=0;P.forEach(p=>{cx+=p.x;cz+=p.z});cx/=n;cz/=n;
  const dx=P[0].x-cx,dz=P[0].z-cz,dl=Math.hypot(dx,dz)||1,D=DRIFT_KM*100;   // 1 unité = 10 m
  P.forEach((p,i)=>{const s=Math.pow(L[i]/tot,1.7);p.x+=dx/dl*D*s;p.z+=dz/dl*D*s})})();
/* Chiffres du parcours : kilomètre et dénivelé positif cumulé à l'abscisse t du tracé, ramenés aux totaux officiels */
const fmtN=n=>Math.round(n).toLocaleString('fr-FR'),kmAt=t=>OFFICIAL.km*Math.min(1,Math.max(0,t));
const gainAtT=t=>OFFICIAL.gain*Math.min(1,Math.max(0,t));   // dénivelé réparti à parts égales le long de la trace (≈ 10 200 m) : chaque étape en porte la même part, comme les km ; même calcul que utils/stages.ts (liste statique)
const kmLine=t=>'Km '+fmtN(kmAt(t))+' · D+ '+fmtN(Math.round(gainAtT(t)/10)*10)+' m',kmSpeech=t=>'Kilomètre '+fmtN(kmAt(t))+', '+fmtN(Math.round(gainAtT(t)/10)*10)+' mètres de dénivelé positif cumulé';
/* km, D+ et altitude d'une étape : ce qui est saisi dans l'admin (sg.km, sg.gain, sg.altitude), sinon le calcul d'après sa position sur la trace */
const stageKmLine=sg=>'Km '+fmtN(sg.km)+' · D+ '+fmtN(sg.gain)+' m',stageKmSpeech=sg=>'Kilomètre '+fmtN(sg.km)+', '+fmtN(sg.gain)+' mètres de dénivelé positif cumulé';
const altOf=(sg,t)=>sg&&Number.isFinite(sg.altitude)&&sg.altitude!==null?sg.altitude:altAt(t);
const KAPPA=4,RFIN=44;   // KAPPA : hauteur de la caméra de dessus = KAPPA fois le rayon visible ; le champ de vision s'ajuste pour que le cadran ait la bonne taille
//   // rayon de sol (en unités) visible au bord du cadran à la fin de la plongée
const hd=(()=>{let tot=0;for(let i=1;i<P.length;i++)tot+=Math.hypot(P[i].x-P[i-1].x,P[i].z-P[i-1].z);let acc=0,q=P[P.length-1];for(let i=1;i<P.length;i++){acc+=Math.hypot(P[i].x-P[i-1].x,P[i].z-P[i-1].z);if(acc>=.05*tot){q=P[i];break}}const dx=q.x-P[0].x,dz=q.z-P[0].z,l=Math.hypot(dx,dz)||1;return {x:dx/l,z:dz/l}})();   // direction de la trace sur ses premiers 5 %
/* La trace part droit dans l'axe de l'aiguille (hd, qui indique le nord pendant la plongée) : sur ses START_STRAIGHT premières unités elle suit exactement cet axe (l'aiguille la recouvre sans qu'elle sorte par un flanc), puis elle rejoint en douceur le tracé réel jusqu'à START_BLEND */
const START_STRAIGHT=18,START_BLEND=50;
{let acc=0;const x0=P[0].x,z0=P[0].z;for(let i=1;i<P.length;i++){acc+=Math.hypot(P[i].x-P[i-1].x,P[i].z-P[i-1].z);if(acc>=START_BLEND)break;
  const k=1-sm(START_STRAIGHT,START_BLEND,acc);P[i].x=lerp(P[i].x,x0+hd.x*acc,k);P[i].z=lerp(P[i].z,z0+hd.z*acc,k)}}
const PIV=RFIN*NEEDLE_PIV/DIAL_R,C0={x:P[0].x-hd.x*PIV,z:P[0].z-hd.z*PIV};   // centre du cadran sur le sol : le départ de la trace est sous le pivot de l'aiguille, qui indique le nord pendant la plongée : son triangle nord recouvre le début de la trace
const xs=P.map(p=>p.x),zs=P.map(p=>p.z),pad=170;
const bx0=Math.min(...xs)-pad,bx1=Math.max(...xs)+pad,bz0=Math.min(...zs)-pad,bz1=Math.max(...zs)+pad;
const cell0=7,NX0=Math.ceil((bx1-bx0)/cell0),NZ0=Math.ceil((bz1-bz0)/cell0);
let ecoSaved=false;try{ecoSaved=localStorage.getItem('asc-eco')==='1'}catch(e){}
const UPF=ecoSaved?1:2,cell=cell0/UPF,NX=NX0*UPF,NZ=NZ0*UPF;   // relief calculé grossièrement (7 unités), lissé, puis ré-échantillonné en cubique : mailles de 3,5 unités sauf en mode économe
const hash=(x,y)=>{const s=Math.sin(x*127.1+y*311.7)*43758.5453;return s-Math.floor(s)};
const vnoise=(x,y)=>{const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy);return lerp(lerp(hash(ix,iy),hash(ix+1,iy),u),lerp(hash(ix,iy+1),hash(ix+1,iy+1),u),v)};
const fbm=(x,y)=>{let a=.5,f=1,s=0;for(let o=0;o<5;o++){s+=a*vnoise(x*f,y*f);a*=.5;f*=2.03}return s};
/* Relief bâti AUTOUR de la trace : la hauteur en un point est la moyenne (pondérée par la proximité) des altitudes des points
   du tracé, diminuée d'une pente qui croît avec la distance à chacun d'eux. Près de la trace, c'est donc son altitude locale
   moins une pente latérale : les courbes de niveau la longent de part et d'autre (U emboîtés) et ne la coupent qu'aux altitudes
   qu'elle franchit, comme sur une carte autour d'une crête. Loin d'elle, un bruit doux donne un paysage naturel. */
const RK=.7,RDC=50,ridgeFall=d=>RK*Math.min(d,RDC)+.25*RK*Math.max(0,d-RDC);
const Ys=P.map((p,i)=>{let s=0,n=0;for(let k=-4;k<=4;k++){const q=P[i+k];if(q){s+=q.y;n++}}return s/n});   // altitudes lissées : le bruit du GPS ne fait pas trembler les courbes
const H0=new Float32Array((NX0+1)*(NZ0+1));
for(let j=0;j<=NZ0;j++)for(let i=0;i<=NX0;i++){
  const x=bx0+i*cell0,z=bz0+j*cell0;let sw=0,sy=0,dmin=1e9;
  for(let q=0;q<P.length;q++){const p=P[q],d=Math.hypot(p.x-x,p.z-z);if(d<dmin)dmin=d;const w=1/(d*d*d+40);sw+=w;sy+=w*(Ys[q]-ridgeFall(d))}
  const amp=lerp(.5,40,sm(14,170,dmin));
  H0[j*(NX0+1)+i]=sy/sw+(fbm(x*.011,z*.011)-.5)*amp*1.6+(fbm(x*.04,z*.04)-.5)*amp*.12;
}
/* Courbes de niveau fluides : flou binomial (deux passes) pour effacer les bosses autour de chaque point GPS, puis ré-échantillonnage cubique (Catmull-Rom) sur une grille plus fine */
(()=>{const W=NX0+1,T=new Float32Array(H0.length),at=(a,i,j)=>a[Math.min(NZ0,Math.max(0,j))*W+Math.min(NX0,Math.max(0,i))];
  for(let pa=0;pa<2;pa++){
    for(let j=0;j<=NZ0;j++)for(let i=0;i<=NX0;i++)T[j*W+i]=(at(H0,i-2,j)+4*at(H0,i-1,j)+6*at(H0,i,j)+4*at(H0,i+1,j)+at(H0,i+2,j))/16;
    for(let j=0;j<=NZ0;j++)for(let i=0;i<=NX0;i++)H0[j*W+i]=(at(T,i,j-2)+4*at(T,i,j-1)+6*at(T,i,j)+4*at(T,i,j+1)+at(T,i,j+2))/16;
  }})();
const H=UPF===1?H0:(()=>{const W0=NX0+1,W=NX+1,out=new Float32Array(W*(NZ+1)),at=(i,j)=>H0[Math.min(NZ0,Math.max(0,j))*W0+Math.min(NX0,Math.max(0,i))];
  const cr=(a,b,c,d,t)=>b+.5*t*(c-a+t*(2*a-5*b+4*c-d+t*(3*(b-c)+d-a)));
  for(let j=0;j<=NZ;j++){const fj=j/UPF,j0=Math.floor(fj),v=fj-j0;
    for(let i=0;i<=NX;i++){const fi=i/UPF,i0=Math.floor(fi),u=fi-i0;
      const r=[-1,0,1,2].map(dj=>cr(at(i0-1,j0+dj),at(i0,j0+dj),at(i0+1,j0+dj),at(i0+2,j0+dj),u));
      out[j*W+i]=cr(r[0],r[1],r[2],r[3],v)}}
  return out})();
function terrainAt(x,z){
  const fx=clamp((x-bx0)/cell,0,NX-.001),fz=clamp((z-bz0)/cell,0,NZ-.001),i=Math.floor(fx),j=Math.floor(fz),u=fx-i,v=fz-j,W=NX+1;
  return lerp(lerp(H[j*W+i],H[j*W+i+1],u),lerp(H[(j+1)*W+i],H[(j+1)*W+i+1],u),v);
}
let hmin=1e9,hmax=-1e9;for(const h of H){if(h<hmin)hmin=h;if(h>hmax)hmax=h}

/* ---------- Arrêts : départ, un par projet, bivouac ---------- */
const STOPS=PROJECTS.map(p=>({t:p.t,proj:p,name:p.title,ttl:p.stage+(p.place?' · '+p.place:''),sg:p.sg}));   // un arrêt par étape (départ et cairn final compris)
const PC0=.30,PCW=.19;   // la carte se termine à 49 % ; de 48 à 54 % il pleut sur le dernier cairn (zoom avant, zoom arrière), la flaque apparaît à 53 %
const NS=STOPS.length,DW=.042,TRAV=(1-NS*DW)/(NS-1);
STOPS.forEach((s,i)=>{s.a=i*(DW+TRAV);s.b=s.a+DW});
function param(p){
  for(let i=0;i<NS;i++){
    const s=STOPS[i];
    if(p<=s.b)return p>=s.a?s.t:(i===0?0:lerp(STOPS[i-1].t,s.t,ease((p-STOPS[i-1].b)/(s.a-STOPS[i-1].b))));   // entre deux cairns, l'aiguille accélère puis ralentit (plus de départ ni d'arrêt secs)
  }
  return 1;
}
const STOP_RAMP=Math.min(.05,TRAV*.48);   // montée et descente du poids d'arrêt : jamais plus d'une moitié de trajet, sinon deux arrêts voisins se chevauchent et la caméra bascule d'un cairn à l'autre à mi-chemin
function stopWeight(i,p){const s=STOPS[i];return Math.min(sm(s.a-STOP_RAMP,s.a,p),1-sm(s.b,s.b+STOP_RAMP,p))}

/* ---------- Scène ---------- */
const OK=THREE_OK;
let renderer,scene,cam,curve,tube,tubeSeg=1400,ball,mat,ray;
const camPos=OK?new THREE.Vector3():{},camTgt=OK?new THREE.Vector3():{};
/* Câble (la cordée) : spline lisse en traits d'épaisseur constante à l'écran (pixels). Deux passes :
   - le câble mat sur toute la trace (mode 0), bleu-noir discret ;
   - l'onde lumineuse sur la partie parcourue (mode 1, uGlow) : cœur net et halo doux en travers, ondes d'énergie qui courent vers la tête (uTime, figées en mouvement réduit),
     couleur cyan-bleu loin derrière qui vire au cuivre-or à la tête, éclat maximal à la tête. Elle avance et recule exactement avec le défilement (uT = position de la tête). */
const FAT_V='attribute vec3 aStart,aEnd;attribute float aSel,aSide,aT;uniform vec2 uRes;uniform float uW,uCap,uLen;varying float vT,vSide,vS;'+
  'void main(){vT=aT;vSide=aSide;vS=aT*uLen;mat4 M=projectionMatrix*modelViewMatrix;vec4 a=M*vec4(aStart,1.),b=M*vec4(aEnd,1.);float nr=.1;if(a.w<nr&&b.w<nr){gl_Position=vec4(2.,2.,2.,1.);return;}if(a.w<nr)a=mix(a,b,(nr-a.w)/(b.w-a.w));if(b.w<nr)b=mix(b,a,(nr-b.w)/(a.w-b.w));'+
  'vec2 sa=a.xy/a.w*uRes*.5,sb=b.xy/b.w*uRes*.5,d=sb-sa;float l=length(d);d=l>1e-4?d/l:vec2(1.,0.);bool e=aSel>.5;vec4 c=e?b:a;vec2 sc=e?sb:sa;float W=uW+1.;sc+=d*(e?1.:-1.)*uCap*W*.5;vec2 o=vec2(-d.y,d.x)*aSide*W*.5;gl_Position=vec4((sc+o)/(uRes*.5)*c.w,c.z,c.w);}';
/* uH0..uH1 : portion de la trace recouverte par l'aiguille (de sa base à sa pointe), jamais dessinée : ni le câble ni la lueur ne dépassent de l'aiguille, même dans un virage ; au départ (uH0 = 0), le bout arrondi du câble avant la trace est masqué aussi */
/* uV0..uV1 : tronçon visible de la trace, d'un cairn au suivant (fondu de uVF au-delà de chaque bout) ; le reste du tracé n'est pas dessiné */
const FAT_F='precision highp float;uniform vec3 uColor,uC2;uniform float uAlpha,uT,uMode,uW,uGlow,uTime,uLen,uBoost,uH0,uH1,uV0,uV1,uVF;varying float vT,vSide,vS;'+
  'void main(){if(uMode>.5&&vT>uT)discard;if(vT<uH1&&(vT>uH0||uH0<=0.))discard;float vis=smoothstep(uV0-uVF,uV0,vT)*(1.-smoothstep(uV1,uV1+uVF,vT));if(vis<=.001)discard;float a=uAlpha*vis;vec3 col=uColor;'+
  'if(uGlow>.5){float d=abs(vSide),dh=max(0.,uT*uLen-vS);float core=exp(-d*d*70.),glow=exp(-d*d*9.)*.5,bloom=exp(-d*d*2.2)*.22;'+
  'float wave=.6+.4*smoothstep(.35,1.,sin(vS*.16-uTime*5.));'+
  'col=mix(uC2,uColor,smoothstep(0.,90.,dh))*uBoost;col=mix(min(col,vec3(1.)),vec3(1.),core*.3);a*=clamp((core+glow+bloom)*(.55*wave+.45),0.,1.);}'+
  'else{a*=clamp(uW*.5+.5-abs(vSide)*(uW+1.)*.5,0.,1.);}'+
  'if(a<=.003)discard;gl_FragColor=vec4(col,a);}';
const FATS=[];
function fatGeo(pts){const m=pts.length-1,S=new Float32Array(m*12),E=new Float32Array(m*12),sel=new Float32Array(m*4),sd=new Float32Array(m*4),tt=new Float32Array(m*4),idx=[];   // un quadrilatère par segment, découpé au plan proche de la caméra dans le shader
  for(let i=0;i<m;i++){const a=pts[i],b=pts[i+1];for(let k=0;k<4;k++){const v=i*4+k;S.set([a.x,a.y,a.z],v*3);E.set([b.x,b.y,b.z],v*3);sel[v]=k>>1;sd[v]=k&1?1:-1;tt[v]=(i+(k>>1))/m}
    const q=i*4;idx.push(q,q+1,q+2,q+1,q+3,q+2)}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(S,3));g.setAttribute('aStart',new THREE.BufferAttribute(S,3));g.setAttribute('aEnd',new THREE.BufferAttribute(E,3));g.setAttribute('aSel',new THREE.BufferAttribute(sel,1));g.setAttribute('aSide',new THREE.BufferAttribute(sd,1));g.setAttribute('aT',new THREE.BufferAttribute(tt,1));g.setIndex(idx);g.userData.m=m;return g}
function fatLine(geo,o){const m=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:o.add?THREE.AdditiveBlending:THREE.NormalBlending,vertexShader:FAT_V,fragmentShader:FAT_F,
    uniforms:{uRes:{value:new THREE.Vector2(1,1)},uW:{value:o.w},uCap:{value:o.cap==null?1:o.cap},uColor:{value:new THREE.Color(o.c)},uC2:{value:new THREE.Color(o.c2||o.c)},uAlpha:{value:o.a},uT:{value:0},uMode:{value:o.mode},
      uLen:{value:geo.userData.len},uH0:{value:0},uH1:{value:0},uV0:{value:0},uV1:{value:1},uVF:{value:.004},uGlow:{value:o.glow?1:0},uTime:{value:0},uBoost:{value:o.boost||1}}});
  m.userData.cw=o.w;m.userData.o=o;FATS.push(m);const mesh=new THREE.Mesh(geo,m);mesh.frustumCulled=false;mesh.renderOrder=o.order||2;scene.add(mesh);return mesh}
const CLEAR=8.6,GAP=.28,SMALL_K=.62,NEEDLE_OUT=[.004,.03];   // NEEDLE_OUT : le triangle de l'aiguille s'efface entre ces abscisses (il ne parcourt pas la trace)   // SMALL_K : échelle du marqueur de bivouac (pierre gravée et cairn)   // hauteur de la pierre gravée au-dessus du wire ; jeu entre les pierres où passe le wire (≈ 3 px à l'arrêt)
const blocks=[];   // {holder,mesh,shadow,pole,proj,base,lift,stopIdx,tex,canvas}
/* année gravée : période du projet, sinon un statut daté de la fiche (« 2026 – en cours »), sinon rien */
function yearOf(pr){const f=PROJECT_INFO[pr.id],st=f&&f.st||'';return pr.when||(/\d{4}/.test(st)?st:'')}
function paintBlock(b){
  const c=b.canvas,x=c.getContext('2d'),W=512,Hh=384,pr=Object.assign({},b.proj,{mat:'stone'});   // une seule matière : pierre mate ; mise en page en 512 × 384, dessinée à l'échelle du canvas
  x.setTransform(c.width/W,0,0,c.height/Hh,0,0);
  let seed=b.proj.title.length*13+7;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647};
  if(pr.mat==='stone'){
    const g=x.createLinearGradient(0,0,W,Hh);g.addColorStop(0,'#BDB6AA');g.addColorStop(1,'#A29B8F');x.fillStyle=g;x.fillRect(0,0,W,Hh);
    for(let i=0;i<5000;i++){x.fillStyle=rnd()<.5?'rgba(255,255,255,'+(.03+rnd()*.05)+')':'rgba(30,26,20,'+(.04+rnd()*.07)+')';x.fillRect(rnd()*W,rnd()*Hh,1+rnd()*2,1+rnd()*2)}
    x.lineWidth=1.3;for(let i=0;i<9;i++){x.strokeStyle='rgba(235,228,215,'+(.12+rnd()*.12)+')';x.beginPath();let px=rnd()*W,py=rnd()*Hh;x.moveTo(px,py);for(let k=0;k<7;k++){px+=30+rnd()*50;py+=(rnd()-.5)*60;x.lineTo(px,py)}x.stroke()}
    const gl=x.createLinearGradient(0,0,W,Hh*.6);gl.addColorStop(0,'rgba(255,255,255,.22)');gl.addColorStop(.35,'rgba(255,255,255,0)');x.fillStyle=gl;x.fillRect(0,0,W,Hh);
  }else if(pr.mat==='metal'){   // schiste : gris bleuté, feuilleté en strates
    const g=x.createLinearGradient(0,0,W*.3,Hh);g.addColorStop(0,'#B4BABD');g.addColorStop(1,'#979EA2');x.fillStyle=g;x.fillRect(0,0,W,Hh);
    for(let i=0;i<60;i++){const y=rnd()*Hh;x.strokeStyle=(rnd()<.5?'rgba(255,255,255,':'rgba(20,28,34,')+(.05+rnd()*.08)+')';x.lineWidth=1+rnd()*3;x.beginPath();x.moveTo(0,y);for(let px=0;px<=W;px+=32)x.lineTo(px,y+Math.sin(px*.012+i)*6+(rnd()-.5)*3);x.stroke()}
    for(let i=0;i<3500;i++){x.fillStyle=rnd()<.5?'rgba(255,255,255,'+(.03+rnd()*.05)+')':'rgba(20,26,30,'+(.04+rnd()*.06)+')';x.fillRect(rnd()*W,rnd()*Hh,1+rnd()*2,1+rnd()*2)}
  }else if(pr.mat==='ghost'){
    const g=x.createLinearGradient(0,0,W,Hh);g.addColorStop(0,'#22344D');g.addColorStop(.5,'#16233A');g.addColorStop(1,'#101B2E');x.fillStyle=g;x.fillRect(0,0,W,Hh);
    x.strokeStyle='rgba(150,190,230,.10)';x.lineWidth=1;for(let i=-Hh;i<W;i+=26){x.beginPath();x.moveTo(i,Hh);x.lineTo(i+Hh,0);x.stroke()}
    const gl=x.createLinearGradient(0,0,W,Hh*.6);gl.addColorStop(0,'rgba(255,255,255,.20)');gl.addColorStop(.4,'rgba(255,255,255,0)');x.fillStyle=gl;x.fillRect(0,0,W,Hh);
    x.setLineDash([14,12]);x.lineWidth=3;x.strokeStyle='rgba(20,8,2,.55)';x.strokeRect(25,25,W-50,Hh-50);x.strokeStyle='#F0A27A';x.strokeRect(23.5,23.5,W-50,Hh-50);x.setLineDash([]);
  }else{   // grès : ocre chaud, grain de sable et veines
    const g=x.createLinearGradient(0,0,W,Hh);g.addColorStop(0,'#D2B38C');g.addColorStop(1,'#BC9A70');x.fillStyle=g;x.fillRect(0,0,W,Hh);
    for(let i=0;i<7000;i++){x.fillStyle=rnd()<.55?'rgba(70,40,15,'+(.05+rnd()*.08)+')':'rgba(255,240,215,'+(.05+rnd()*.07)+')';x.fillRect(rnd()*W,rnd()*Hh,1+rnd()*1.5,1+rnd()*1.5)}
    for(let i=0;i<7;i++){const y=rnd()*Hh;x.strokeStyle='rgba(150,95,50,'+(.10+rnd()*.1)+')';x.lineWidth=4+rnd()*8;x.beginPath();x.moveTo(0,y);x.bezierCurveTo(W*.3,y+(rnd()-.5)*60,W*.7,y+(rnd()-.5)*60,W,y+(rnd()-.5)*40);x.stroke()}
  }
  // typographie lisible, contraste visé AAA : encre pleine selon la matière (noir sur pierre et métal clairs, blanc sur cuir et verre sombre), graisse 600 à 700, tailles agrandies
  const TX={stone:{ink:'#0A0805',hi:'rgba(255,255,255,.35)',fill:'rgba(255,255,255,.30)'},metal:{ink:'#05080A',hi:'rgba(255,255,255,.4)',fill:'rgba(255,255,255,.30)'},leather:{ink:'#140A03',hi:'rgba(255,240,220,.4)',fill:'rgba(255,248,236,.30)'},ghost:{ink:'#FFFFFF',sh:'rgba(0,0,0,.8)',fill:'rgba(0,0,0,.28)',stage:'#FFC4A0'}}[pr.mat];
  /* gravure : étape, lieu et année en haut, nom du projet au centre, kilomètre et dénivelé cumulés, altitude, puis les technos. Le reste (rôle, résumé, chiffres, points clés) est dans le panneau d'étape #stopCard.
     La stèle est décorative (aria-hidden) : le panneau redonne ces mêmes informations aux lecteurs d'écran (#scSr). */
  const SERIF='"Cordée Serif", "DM Serif Display", Georgia, serif',MONO='"JetBrains Mono", ui-monospace, monospace',F=sz=>'italic 600 '+sz+'px '+SERIF,cx=W/2,MW=W-96;
  const engrave=(t,y,font)=>{x.font=font;x.fillStyle=TX.hi;x.fillText(t,cx+1.2,y+1.2);x.fillStyle=TX.ink;x.fillText(t,cx,y)};   // gravure : encre pleine et arête claire décalée
  const track=(t,sp)=>t.toUpperCase().split('').join(String.fromCharCode(8202).repeat(sp));   // capitales espacées (espaces fines) : la mono gravée respire
  const fitMono=(t,w,max,min)=>{let sz=max;x.font='600 '+sz+'px '+MONO;while(x.measureText(t).width>w&&sz>min){sz-=1;x.font='600 '+sz+'px '+MONO}return sz};
  x.textAlign='center';x.textBaseline='middle';
  const stage=pr.stage||'',kmT=(pr.sg?stageKmLine(pr.sg):kmLine(pr.t||0)).toUpperCase(),tags=(pr.tags||[]).slice(0,4),altT=('Altitude '+fmtN(altOf(pr.sg,pr.t||0))+' m').toUpperCase(),geoT=[pr.place,yearOf(pr)].filter(Boolean).join('  ·  ').toUpperCase();
  // étape, puis lieu et année
  {const t=track(stage,1),sz=fitMono(t,MW,23,14);engrave(t,58,'600 '+sz+'px '+MONO)}
  if(geoT){const sz=fitMono(geoT,MW,16,12);engrave(geoT,86,'500 '+sz+'px '+MONO)}
  x.strokeStyle=TX.ink;x.globalAlpha=.55;x.lineWidth=2;x.beginPath();x.moveTo(cx-34,106);x.lineTo(cx+34,106);x.stroke();x.globalAlpha=1;
  // nom du projet
  const fit=(t,max)=>{let sz=max;x.font=F(sz);while(x.measureText(t).width>MW&&sz>30){sz-=2;x.font=F(sz)}return sz};
  const cTitle=pr.cairnTitle||pr.title;let lines=[cTitle],size=fit(cTitle,76);
  if(size<54&&cTitle.includes(' ')){   // nom long : deux lignes équilibrées plutôt qu'une gravure trop petite
    const ws=cTitle.split(' ');let best=null;
    for(let i=1;i<ws.length;i++){const l1=ws.slice(0,i).join(' '),l2=ws.slice(i).join(' '),m=Math.max(l1.length,l2.length);if(!best||m<best.m)best={l1,l2,m}}
    lines=[best.l1,best.l2];size=Math.min(fit(best.l1,56),fit(best.l2,56));
  }
  {const lh=size*1.04,y0=172-(lines.length-1)*lh/2;lines.forEach((l,i)=>engrave(l,y0+i*lh,F(size)))}
  // kilomètre et dénivelé cumulés, puis altitude
  {const sz=fitMono(kmT,MW,23,14);engrave(kmT,246,'600 '+sz+'px '+MONO)}
  {const sz=fitMono(altT,MW,16,12);engrave(altT,276,'500 '+sz+'px '+MONO)}
  // technos : une ligne, séparées par des points ; si elle ne tient pas, la dernière techno part (elle reste dans le texte du panneau pour les lecteurs d'écran)
  {let ts=tags.slice(),t='',sz=0;for(;;){t=ts.map(v=>v.toUpperCase()).join('  ·  ');sz=fitMono(t,MW,18,13);x.font='600 '+sz+'px '+MONO;if(x.measureText(t).width<=MW||ts.length<=1)break;ts.pop()}
   if(t)engrave(t,318,'500 '+sz+'px '+MONO)}
  x.textBaseline='alphabetic';
  b.tex.needsUpdate=true;
}
function makeEnvP(){
  const mk=(a,c,boxes)=>{const k=document.createElement('canvas');k.width=k.height=64;const x=k.getContext('2d'),g=x.createLinearGradient(0,0,0,64);g.addColorStop(0,a);g.addColorStop(1,c);x.fillStyle=g;x.fillRect(0,0,64,64);(boxes||[]).forEach(([bx,by,bw,bh,col])=>{x.fillStyle=col;x.fillRect(bx,by,bw,bh)});return k};
  const t=new THREE.CubeTexture([mk('#3A2A20','#0A0C10',[[26,0,8,64,'rgba(255,200,150,.8)']]),mk('#1E2A3C','#080A0E',[[15,0,6,64,'rgba(150,190,255,.7)']]),mk('#E8EEF4','#2A3038',[[10,12,44,14,'rgba(255,255,255,.95)']]),mk('#050607','#080A0C'),mk('#D8DEE4','#2A2E34',[[8,7,48,10,'rgba(255,255,255,.85)']]),mk('#10151C','#05070A')]);
  t.needsUpdate=true;return t;
}
const RFAR=Math.max(520,Math.round(Math.max(...P.map(p=>Math.hypot(p.x-(bx0+bx1)/2,p.z-(bz0+bz1)/2)))+170));   // le relief reste visible jusqu'aux points les plus éloignés du tracé
function initScene(){
  renderer=new THREE.WebGLRenderer({canvas:cv,antialias:true,alpha:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,QDPR()));renderer.setClearColor(0x000000,0);
  scene=new THREE.Scene();cam=new THREE.PerspectiveCamera(42,1,.5,4000);ray=new THREE.Raycaster();
  scene.add(new THREE.HemisphereLight(0xbcd0e4,0x1a1410,.7));
  const dl=new THREE.DirectionalLight(0xffd9b0,1.1);dl.position.set(-40,60,30);scene.add(dl);
  const g=new THREE.PlaneGeometry(bx1-bx0,bz1-bz0,NX,NZ);g.rotateX(-Math.PI/2);
  const pos=g.attributes.position;
  for(let j=0;j<=NZ;j++)for(let i=0;i<=NX;i++){const k=j*(NX+1)+i;pos.setY(k,H[k]);pos.setX(k,bx0+i*cell);pos.setZ(k,bz0+j*cell)}
  mat=new THREE.ShaderMaterial({
    extensions:{derivatives:true},transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    uniforms:{cLo:{value:new THREE.Vector3(.78,.44,.18)},cHi:{value:new THREE.Vector3(1,.70,.42)},cGrid:{value:new THREE.Vector3(.35,.55,.75)},cstep:{value:20*SC*EX},uMin:{value:hmin},uMax:{value:hmax},uGlow:{value:1},uC:{value:new THREE.Vector2((bx0+bx1)/2,(bz0+bz1)/2)},uR0:{value:Math.round(.8*RFAR)},uR1:{value:RFAR},uF:{value:new THREE.Vector2()},uFk:{value:0},uFR:{value:90},cF:{value:new THREE.Vector3(1,.28,.08)}},
    vertexShader:'varying float vH;varying vec3 vW;varying vec3 vView;void main(){vH=position.y;vW=position;vec4 mv=modelViewMatrix*vec4(position,1.);vView=mv.xyz;gl_Position=projectionMatrix*mv;}',
    fragmentShader:`precision highp float;
      uniform vec3 cLo,cHi,cGrid,cF;uniform float cstep,uMin,uMax,uGlow,uR0,uR1,uFk,uFR;uniform vec2 uC,uF;
      varying float vH;varying vec3 vW;varying vec3 vView;
      void main(){
        float t=smoothstep(uMin,uMax,vH);
        float f=vH/cstep;float g=abs(fract(f-.5)-.5)/fwidth(f);float line=1.-min(g,1.);
        float m=vH/(cstep*5.);float gm=abs(fract(m-.5)-.5)/fwidth(m);float master=1.-min(gm,1.);
        vec2 gp=vW.xz/14.;vec2 gg=abs(fract(gp-.5)-.5)/fwidth(gp);float grid=1.-min(min(gg.x,gg.y),1.);
        float edge=1.-smoothstep(uR0,uR1,length(vW.xz-uC));
        float depthFade=1.-smoothstep(240.,640.,length(vView));
        vec3 col=mix(cLo,cHi,t)*(.7+.6*master)*uGlow;
        col=mix(col,cGrid,grid*(1.-line)*.6);
        float fz=uFk*(1.-smoothstep(uFR*.25,uFR,length(vW.xz-uF)));   // étape du projet affiché : son relief s'allume en cuivre
        col=mix(col,cF*(1.1+.6*master),fz);
        float a=clamp((line*.55+master*.85+grid*.13)*(1.+fz*1.4)+line*fz*.25,0.,1.)*edge*depthFade;
        gl_FragColor=vec4(col,a);}`
  });
  const tm=new THREE.Mesh(g,mat);tm.renderOrder=2;scene.add(tm);
  const pts=P.map(p=>new THREE.Vector3(p.x,Math.max(p.y,terrainAt(p.x,p.z)+.8)+1.6,p.z));
  curve=new THREE.CatmullRomCurve3(pts,false,'centripetal');
  const pathPts=Array.from({length:tubeSeg+1},(_,i)=>curve.getPointAt(i/tubeSeg)),fgeo=fatGeo(pathPts);
  fgeo.userData.len=curve.getLength();
  // câble inactif : bleu ardoise mat #1E293B sur toute la trace (3 px) ; pulse actif sur la partie parcourue : cyan électrique #00F2FE à la tête vers bleu glacier #38BDF8 derrière,
  // émissif ×2,5 et halo large dans le shader (« fil chaud / fibre optique sous tension »), à la place d'un Bloom en post-traitement (voir docs/admin-boucle.md)
  fatLine(fgeo,{w:3,c:0x1E293B,cl:0x1E293B,a:1,al:1,mode:0,order:2});
  tube=fatLine(fgeo,{w:18,c:0x38BDF8,c2:0x00F2FE,cl:0x0369A1,c2l:0x0891B2,a:1,al:1,boost:2.5,boostl:1,mode:1,glow:true,add:true,cap:0,order:3});
  /* aiguille de la carte : le triangle nord (braise, deux facettes) de l'aiguille du cadran, à l'échelle du sol (RFIN / DIAL_R) ; sa base est le pivot.
     Couché sur la trace, pointe vers l'avant, avec une arête centrale légèrement relevée. Pendant la plongée, il recouvre exactement celui du cadran (voir NDL dans rig). */
  {const k=RFIN/DIAL_R,W=.12*k,N=.38*k,R=.04*k;   // matériaux transparents (opacité 1) : au Départ, l'aiguille est triée avec la pierre gravée et passe devant elle
    ball=new THREE.Group();ball.userData.n=N;
    const face=(a,b,c,col)=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([...a,...b,...c],3));return new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:col,side:THREE.DoubleSide,transparent:true}))};
    const tip=[0,0,N],l=[-W,0,0],r=[W,0,0],c=[0,R,0];   // +z : direction de la trace (lookAt), +y : vers le ciel
    [face(tip,l,c,0xF59A5C),face(tip,c,r,0xD4581F)].forEach(m=>ball.add(m));
    scene.add(ball)}
  buildBlocks();
}
const DEP_SIDE=17,DEP_BACK=20;   // cairn du Départ, en unités de sol : à gauche de la trace sur écran large (la pierre gravée fait ≈ 12 de demi-largeur), derrière l'aiguille sur écran étroit (sinon il sortirait de l'image)
function depOff(bk){   // cairns des deux bouts de la trace : Départ (axe hd, recul derrière l'aiguille sur écran étroit) et dernière étape (axe de la fin de trace, au-delà du bout sur écran étroit)
  const end=bk.stopIdx>0,d=end?(()=>{const g=curve.getTangentAt(1);const l=Math.hypot(g.x,g.z)||1;return {x:g.x/l,z:g.z/l}})():hd,k=end?1:-1;
  return cam.aspect<.9?[k*d.x*DEP_BACK,k*d.z*DEP_BACK]:[d.z*DEP_SIDE,-d.x*DEP_SIDE]}
function buildBlocks(){
  const env=makeEnvP();
  /* Cairn sobre, une seule matière (pierre mate) : 2 pierres sous le wire, un jeu où il passe, 2 pierres au-dessus, puis la pierre gravée (contour irrégulier, bords arrondis) */
  const w=8,h=6,stoneShape=seed=>{const s=new THREE.Shape(),N=40;for(let i=0;i<N;i++){const a=i/N*Math.PI*2,c=Math.cos(a),sn=Math.sin(a),e=.25,k=1+.045*Math.sin(a*3+seed)+.03*Math.sin(a*7+seed*2.3);
      const x=Math.sign(c)*Math.pow(Math.abs(c),e)*w*k,y=Math.sign(sn)*Math.pow(Math.abs(sn),e)*h*k;i?s.lineTo(x,y):s.moveTo(x,y)}s.closePath();return s};
  const rockGeo=seed=>{const g=new THREE.IcosahedronGeometry(1,2),p=g.attributes.position,v=new THREE.Vector3();   // galet facetté : bruit stable par position (sommets partagés identiques), dessus et dessous aplatis pour l'empilement
    for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);const n=1+.16*(hash(v.x*2.7+seed,v.z*2.7+v.y*1.9)-.5);v.multiplyScalar(n);v.y=clamp(v.y,-.62,.7);p.setXYZ(i,v.x,v.y,v.z)}
    g.computeVertexNormals();return g};
  const ROCKS=[0,1,2,3].map(i=>rockGeo(i*3.7+1));
  const STONE=0x9A9387;
  const sc=document.createElement('canvas');sc.width=sc.height=128;{const x=sc.getContext('2d'),g=x.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(0,0,0,.65)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,128,128)}
  const shTex=new THREE.CanvasTexture(sc);
  STOPS.forEach((st,si)=>{
    const pr=st.proj;   // chaque étape a son cairn (Départ et cairn final compris), gravé avec ses données d'étape
    if(!pr)return;
    const cnv=document.createElement('canvas');cnv.width=768;cnv.height=576;   // 1,5 × la mise en page (512 × 384) : la gravure fine (km, technos) reste nette
    const tex=new THREE.CanvasTexture(cnv);tex.anisotropy=8;tex.repeat.set(1/(2*(w+.7)),1/(2*(h+.7)));tex.offset.set(.5,.5);
    const geo=new THREE.ExtrudeGeometry(stoneShape(si*1.9),{depth:1.4,bevelEnabled:true,bevelThickness:1.1,bevelSize:1,bevelSegments:4,curveSegments:6});
    const top=new THREE.MeshStandardMaterial({map:tex,roughness:.95,metalness:0,envMap:env,envMapIntensity:.15,transparent:true});
    const side=new THREE.MeshStandardMaterial({color:STONE,roughness:.95,metalness:0,envMap:env,envMapIntensity:.15,transparent:true});
    const mesh=new THREE.Mesh(geo,[top,side]);mesh.rotation.x=-Math.PI/2+.42;mesh.position.y=0;
    const holder=new THREE.Group();holder.add(mesh);holder.scale.setScalar(1.3*(pr.small?SMALL_K:1));scene.add(holder);   // bivouac : petit marqueur, pas une étape
    const t=st.t,pt=curve.getPointAt(t),a=curve.getPointAt(clamp(t-.03)),b=curve.getPointAt(clamp(t+.03));
    let dx=b.x-a.x,dz=b.z-a.z;const dl=Math.hypot(dx,dz)||1;dx/=dl;dz/=dl;
    const nx=-dz,nz=dx,side1=1;   // le cairn est posé sur la trace : le wire le traverse
    // sauf celui du Départ : la pointe de l'aiguille marque le départ de la trace, son cairn est posé à côté (depOff, appliqué dans placeBlocks), sans rien sous l'aiguille
    const bx=pt.x,bz=pt.z,by=pt.y+CLEAR;
    holder.position.set(bx,by,bz);
    const camAt=t>0?curve.getPointAt(clamp(t-.03)):pt.clone().multiplyScalar(2).sub(curve.getPointAt(.03));   // au Départ, rien avant la trace : on prolonge la trace en arrière
    const faceYaw=Math.atan2(camAt.x-bx,camAt.z-bz);holder.rotation.y=faceYaw;
    const shadow=new THREE.Mesh(new THREE.PlaneGeometry(34,29),new THREE.MeshBasicMaterial({map:shTex,transparent:true,depthWrite:false,opacity:.55}));
    shadow.rotation.x=-Math.PI/2;shadow.position.set(bx,terrainAt(bx,bz)+.4,bz);scene.add(shadow);
    // pierres du cairn (placées par placeBlocks)
    const rockM=new THREE.MeshStandardMaterial({color:STONE,roughness:.96,metalness:0,flatShading:true,envMap:env,envMapIntensity:.12,transparent:true});
    const cairn=new THREE.Group();for(let k=0;k<4;k++){const m=new THREE.Mesh(ROCKS[(k+si)%4],rockM);m.rotation.y=(k*2.1+si)%6.283;cairn.add(m)}scene.add(cairn);
    // perle enfilée sur le wire, dans le jeu : pleine sur le cairn actif, simple point sur les cairns passés, absente sur ceux à venir
    const bead=new THREE.Mesh(new THREE.SphereGeometry(.42,18,12),new THREE.MeshBasicMaterial({color:0xF2FBF8,transparent:true}));{const bp=curve.getPointAt(clamp(t+(si===0?11:-11)/curve.getLength()));bead.position.copy(bp)}scene.add(bead);   // à la sortie du cairn, côté caméra : visible, et enfilée sur le wire
    const bk={holder,mesh,shadow,cairn,bead,mats:[top,side,rockM],vis:si===1?1:.3,proj:pr,base:by,lift:0,stopIdx:si,tex,canvas:cnv,faceYaw,pos:new THREE.Vector3(bx,by,bz),t,ty:pt.y,pt:new THREE.Vector3(pt.x,0,pt.z),n:[nx*side1,nz*side1],camAt:new THREE.Vector3(camAt.x,0,camAt.z)};
    blocks.push(bk);paintBlock(bk);
  });
  placeBlocks();
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>blocks.forEach(paintBlock));
}
const baseFov=()=>cam.aspect<.9?54:42;
/* Sur écran étroit : blocs plus près du sentier et champ de vision plus large, pour qu'ils restent dans l'image */
function placeBlocks(){
  blocks.forEach(bk=>{
    const o=(bk.stopIdx===0||bk.t>=1)?depOff(bk):[0,0],bx=bk.pt.x+o[0],bz=bk.pt.z+o[1],gy=terrainAt(bx,bz);
    const rk=bk.proj&&bk.proj.small?SMALL_K:1;bk.base=bk.ty+CLEAR*rk;bk.faceYaw=Math.atan2(bk.camAt.x+o[0]-bx,bk.camAt.z+o[1]-bz);
    bk.holder.position.set(bx,bk.base,bz);bk.pos.set(bx,bk.base,bz);
    bk.shadow.position.set(bx,gy+.4,bz);
    // 2 pierres sous le wire (du sol, un peu enterrées, jusqu'au jeu), 2 au-dessus (du jeu jusque sous la pierre gravée) ; dessus et dessous plats : le jeu est net
    const wy=bk.ty,lo0=Math.min(gy-.5,wy-GAP/2-1.2),lo1=wy-GAP/2,hi0=wy+GAP/2,hi1=Math.max(hi0+1.6*rk,bk.base-3.4*rk);
    const span=[[lo0,(lo0+lo1)/2,6.4*rk],[(lo0+lo1)/2,lo1,5.6*rk],[hi0,(hi0+hi1)/2,5.2*rk],[(hi0+hi1)/2,hi1,4.4*rk]];
    bk.cairn.children.forEach((m,k)=>{const [y0,y1,r]=span[k],th=y1-y0,sy=th/1.32;   // la géométrie va de −0,62 à +0,7 (1,32)
      m.scale.set(r*(1+.08*Math.sin(k*2.3)),sy,r*(.86+.08*Math.cos(k*1.7)));m.position.set(bx+Math.sin(k*2.9)*.35,y0+.62*sy,bz+Math.cos(k*3.3)*.35)});
  });
}
/* ---------- Pluie sur le dernier cairn (« À déterminer ») : transition vers la flaque ----------
   rainR (0 → 1) suit le défilement après la dernière étape : bruine dès l'arrêt, averse, la pierre se mouille ;
   la caméra plonge sur la stèle (zoom avant) puis remonte très haut (zoom arrière) pendant que la flaque apparaît en fondu.
   Chaque goutte connaît son point d'impact dès sa naissance (lancer de rayon sur la stèle et les pierres, sinon le sol) : elle éclate en anneau là où elle tombe.
   prefers-reduced-motion : ni gouttes ni zoom, la pierre se mouille et le fondu fait la transition. */
let rainR=0;const RAIN={on:false,drops:null,splash:[],n:110,acc:0,wet:-1};
function rainInit(){
  const DN=RAIN.n,g=new THREE.SphereGeometry(.1,6,4);g.scale(1,7,1);   // goutte étirée par la vitesse : un trait vu de partout
  const m=new THREE.MeshBasicMaterial({color:0xCFE8F2,transparent:true,opacity:.75,depthWrite:false});
  const im=new THREE.InstancedMesh(g,m,DN);im.frustumCulled=false;im.renderOrder=12;im.count=0;scene.add(im);
  RAIN.drops={im,p:Array.from({length:DN},()=>({on:false,x:0,y:0,z:0,v:0,hy:0,hn:new THREE.Vector3(0,1,0)})),o:new THREE.Object3D(),ray:new THREE.Raycaster(),dn:new THREE.Vector3(0,-1,0),o3:new THREE.Vector3()};
  const rg=new THREE.RingGeometry(.55,.8,28);
  for(let i=0;i<34;i++){const r=new THREE.Mesh(rg,new THREE.MeshBasicMaterial({color:0xCFE8F2,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide}));r.visible=false;r.renderOrder=12;r.userData.t=-1;scene.add(r);RAIN.splash.push(r)}
  RAIN.on=true}
function rainSpawn(d,bk){
  const D=RAIN.drops,a=Math.random()*6.283,rr=Math.sqrt(Math.random())*18;   // disque de 18 unités autour du cairn (la stèle fait ≈ 10 de demi-largeur)
  d.x=bk.pos.x+Math.cos(a)*rr;d.z=bk.pos.z+Math.sin(a)*rr;d.y=bk.base+26+Math.random()*34;d.v=62+Math.random()*16;d.on=true;
  D.o3.set(d.x,bk.base+80,d.z);D.ray.set(D.o3,D.dn);
  const hit=D.ray.intersectObjects([bk.mesh,...bk.cairn.children],false)[0];
  if(hit){d.hy=hit.point.y;d.hn.copy(hit.face.normal).transformDirection(hit.object.matrixWorld)}else{d.hy=terrainAt(d.x,d.z)+.3;d.hn.set(0,1,0)}}
function rainSplash(x,y,z,n){
  const r=RAIN.splash.find(s=>s.userData.t<0);if(!r)return;
  r.position.set(x+n.x*.15,y+n.y*.15,z+n.z*.15);r.lookAt(x+n.x,y+n.y,z+n.z);r.userData.t=0;r.visible=true}
function rainStep(r,dt,bk){
  const L=theme==='light',col=L?0x27465C:0xCFE8F2;   // jour : gouttes et anneaux à l'encre de la carte ; nuit : eau claire
  // la pierre se mouille : plus sombre et plus brillante (sans gouttes en mouvement réduit)
  {const w=sm(.05,.5,r);if(Math.abs(w-RAIN.wet)>.002){RAIN.wet=w;const[top,side,rock]=bk.mats;
    top.roughness=side.roughness=rock.roughness=lerp(.95,.42,w);top.color.setScalar(lerp(1,.72,w));side.color.setHex(0x9A9387).multiplyScalar(lerp(1,.68,w));rock.color.setHex(0x9A9387).multiplyScalar(lerp(1,.68,w))}}
  if(reduce)return;
  if(!RAIN.on){if(r<=0)return;rainInit()}
  const D=RAIN.drops,rate=r>0?lerp(40,220,sm(0,.35,r))*(1-sm(.9,1,r)):0;   // bruine à l'arrêt, averse pendant le zoom
  D.im.material.color.setHex(col);D.im.material.opacity=L?.6:.75;
  RAIN.acc+=rate*dt;
  let k=0;
  for(const d of D.p){
    if(!d.on&&RAIN.acc>=1){RAIN.acc-=1;rainSpawn(d,bk)}
    if(!d.on)continue;
    d.y-=d.v*dt;
    if(d.y<=d.hy){d.on=false;rainSplash(d.x,d.hy,d.z,d.hn);continue}
    D.o.position.set(d.x,d.y,d.z);D.o.updateMatrix();D.im.setMatrixAt(k++,D.o.matrix)}
  RAIN.acc=Math.min(RAIN.acc,4);D.im.count=k;D.im.instanceMatrix.needsUpdate=true;
  RAIN.splash.forEach(s=>{if(s.userData.t<0)return;s.userData.t+=dt/.45;const u=s.userData.t;
    if(u>=1){s.userData.t=-1;s.visible=false;return}
    s.material.color.setHex(col);s.scale.setScalar(.6+2.4*u);s.material.opacity=(L?.55:.7)*(1-u)*(1-u)})}
function rainHide(){if(!RAIN.on)return;RAIN.drops.im.count=0;RAIN.drops.p.forEach(d=>d.on=false);RAIN.splash.forEach(s=>{s.userData.t=-1;s.visible=false});RAIN.acc=0}
function resize(){const w=cv.clientWidth,h=cv.clientHeight;if(!w||!h||!OK)return;renderer.setSize(w,h,false);{const bs=renderer.getDrawingBufferSize(new THREE.Vector2()),k=bs.x/w;FATS.forEach(m=>{m.uniforms.uRes.value.copy(bs);m.uniforms.uW.value=m.userData.cw*k})}cam.aspect=w/h;if(!staticMode)cam.fov=baseFov();cam.updateProjectionMatrix();placeBlocks()}

/* ---------- Caméra : vol bas, en légère contre-plongée ; arrêts devant chaque projet ---------- */
const nT=OK?new THREE.Vector3():null,nP=OK?new THREE.Vector3():null,nQ=OK?new THREE.Quaternion():null,v1=OK?new THREE.Vector3():null,v2=OK?new THREE.Vector3():null,camA=OK?new THREE.PerspectiveCamera():null,camB=OK?new THREE.PerspectiveCamera():null,v3=OK?new THREE.Vector3():null;
const trWin=[0,1];   // tronçon de trace affiché [début, fin], en abscisse t
const CAIRN_NEXT=.35;   // opacité du cairn suivant (et du précédent, le temps de le quitter) ; les autres cairns sont masqués
const STOP_D=[70,80],STOP_H=26,STOP_SIDE=.35,STOP_LOW=-9;   // cadrage aux arrêts : recul [grand écran, téléphone], hauteur, décalage latéral (part du recul) pour la carte de droite, visée plus basse sur téléphone (carte en bas)
let stopW=0,curT=0,activeStop=0,hoverIdx=-1,pinnedIdx=-1,focusIdx=-1,ptrIdx=-1,ptr={x:0,y:0,in:false};
function onPlane(q,o,y){   // point de l'écran (px) -> point du plan horizontal de hauteur y, vu par la caméra de la carte
  cam.updateMatrixWorld();o.set(q[0]/cv.clientWidth*2-1,1-q[1]/cv.clientHeight*2,.5).unproject(cam).sub(cam.position);return o.multiplyScalar((y-cam.position.y)/o.y).add(cam.position)}
const fA=OK?{p:new THREE.Vector3(),t:new THREE.Vector3()}:null,fB=OK?{p:new THREE.Vector3(),t:new THREE.Vector3()}:null,STOP_ARC=18;   // STOP_ARC : hauteur de l'arc entre deux arrêts
function frameOf(i,o){   // cadrage d'arrêt de l'étape i (position, visée) ; false si l'étape n'a pas de cairn
  const blk=blocks.find(x=>x.stopIdx===i);if(!blk)return false;
  const nar=cam.aspect<.9,fx=Math.sin(blk.faceYaw),fz=Math.cos(blk.faceYaw),D=nar?STOP_D[1]:STOP_D[0];
  o.p.set(blk.pos.x+fx*D,blk.base+STOP_H,blk.pos.z+fz*D);
  const card=cardShut!==i&&!!blk.proj,side=!nar&&card?D*STOP_SIDE:0;   // grand écran : la carte est à droite, la stèle passe à gauche du centre ; téléphone : la carte est en bas, la stèle remonte
  o.t.set(blk.pos.x+fz*side,blk.base+(nar&&card?STOP_LOW:1.5),blk.pos.z-fx*side);return true}
function frameFollow(pt,dx,dz,o){o.p.set(pt.x-dx*80,pt.y+40,pt.z-dz*80);o.t.set(pt.x,pt.y+10,pt.z)}   // repli sans cairn : derrière l'aiguille
function rig(p,dt,snap,intro=0){
  const t=param(p);
  let aw=0,bd=9;for(let i=0;i<NS;i++){const d=Math.abs(p-(STOPS[i].a+STOPS[i].b)/2);if(d<bd){bd=d;aw=i}}
  const mw=stopWeight(aw,p);activeStop=aw;stopW=mw;
  const pt=curve.getPointAt(clamp(t)),a=curve.getPointAt(clamp(t-.05)),b=curve.getPointAt(clamp(t+.05));
  let dx=b.x-a.x,dz=b.z-a.z;const dl=Math.hypot(dx,dz)||1;dx/=dl;dz/=dl;
  const blk=blocks.find(x=>x.stopIdx===aw);
  /* cadrage continu : à l'arrêt, face à la stèle (dans l'axe où elle regarde), à distance fixe ; entre deux arrêts, la caméra glisse du cadrage
     de l'un à celui du suivant, en arc léger, en gardant l'aiguille dans le champ. Pas de vue de poursuite intermédiaire : plus de bascule de 90° d'un coup. */
  {let i1=NS-1;for(let i=0;i<NS;i++)if(p<=STOPS[i].b){i1=i;break}
   const s1=STOPS[i1];
   if(!frameOf(i1,fB))frameFollow(pt,dx,dz,fB);
   if(p>=s1.a||i1===0){v1.copy(fB.p);v2.copy(fB.t)}
   else{const s0=STOPS[i1-1],u=ease(clamp((p-s0.b)/(s1.a-s0.b))),arc=Math.sin(Math.PI*u);
     if(!frameOf(i1-1,fA))frameFollow(pt,dx,dz,fA);
     v1.copy(fA.p).lerp(fB.p,u);v1.y+=arc*STOP_ARC;
     v2.copy(fA.t).lerp(fB.t,u);v3.copy(pt);v3.y+=4;v2.lerp(v3,arc*.4)}   // à mi-trajet, le regard se porte un peu sur l'aiguille
   const gh=terrainAt(v1.x,v1.z)+14;if(v1.y<gh)v1.y=gh}
  if(rainR>0&&!reduce&&!staticMode){   // pluie sur le dernier cairn : zoom avant sur la stèle mouillée, puis zoom arrière très haut, la flaque apparaît en fondu (draw)
    const end=blocks.find(x=>x.t>=1);
    if(end){const z=clamp((rainR-.2)/.8),zi=ease(sm(0,.45,z)),zo=ease(sm(.5,1,z));
      let ex=v1.x-end.pos.x,ez=v1.z-end.pos.z;const el=Math.hypot(ex,ez)||1;ex/=el;ez/=el;   // on garde l'axe de vue de l'arrêt
      v3.set(end.pos.x+ex*(cam.aspect<.9?58:34),end.base+10,end.pos.z+ez*(cam.aspect<.9?58:34));v1.lerp(v3,zi);v3.set(end.pos.x+ex*34,end.base+175,end.pos.z+ez*34);v1.lerp(v3,zo);
      v3.set(end.pos.x,end.base+2.5,end.pos.z);v2.lerp(v3,Math.max(zi,zo))}}
  {const u=mat.uniforms,fk=blk&&STOPS[aw].proj?mw:0;if(blk)u.uF.value.set(blk.pos.x,blk.pos.z);u.uFk.value+=(fk-u.uFk.value)*(snap?1:1-Math.exp(-dt*4))}   // relief de l'étape : s'allume à l'arrêt, s'éteint en repartant   // téléphone : à l'arrêt, la caméra vise exactement le bloc (centré, jamais rogné sur le côté)
  const k=snap?1:1-Math.exp(-dt*9);   // caméra réactive : elle rejoint le cadrage de l'étape en ≈ 0,1 s
  if(intro>.001){
    // début : vue de dessus à hauteur fixe (KAPPA x rayon), centrée sous le cadran ; le champ de vision est celui qui donne au sol la taille du cadran : les courbes de la carte recouvrent celles du verre
    const e=ease(intro),ok=DIAL.r>5,w=cv.clientWidth,h=cv.clientHeight,hT=KAPPA*RFIN,sP=ok?.98*DIAL.r/RFIN:(h/2)/(hT*Math.tan(baseFov()*Math.PI/360));   // 0,98 : écart d'échelle mesuré entre le disque du cadran et ses courbes
    const fovT=2*Math.atan((h/2)/(sP*hT))*180/Math.PI;
    const ox=(ok?DIAL.cx:w/2)-w/2,oy=(ok?DIAL.cy:h/2)-h/2,rx=-hd.z,rz=hd.x;
    const tx=C0.x-rx*(ox/sP)+hd.x*(oy/sP),tz=C0.z-rz*(ox/sP)+hd.z*(oy/sP),gy=terrainAt(C0.x,C0.z);
    camA.position.copy(v1);camA.up.set(0,1,0);camA.lookAt(v2);
    camB.position.set(tx,gy+hT,tz);camB.up.set(hd.x,0,hd.z);camB.lookAt(tx,gy,tz);
    camPos.copy(v1).lerp(camB.position,e);camTgt.copy(v2).lerp(v3.set(tx,gy,tz),e);
    cam.position.copy(camPos);cam.quaternion.slerpQuaternions(camA.quaternion,camB.quaternion,e);
    const fv=lerp(baseFov(),fovT,e);if(Math.abs(cam.fov-fv)>.01){cam.fov=fv;cam.updateProjectionMatrix()}
    if(NDL.ok){   // calage fin : le départ de la trace (à sa vraie hauteur) tombe exactement sous le pivot de l'aiguille du cadran, sans jour entre les deux
      const p0=curve.getPointAt(0);onPlane(NDL.piv,nT,p0.y);cam.position.x+=(p0.x-nT.x)*e;cam.position.z+=(p0.z-nT.z)*e}
  }else{
    camPos.lerp(v1,k);camTgt.lerp(v2,k);
    cam.position.copy(camPos);cam.up.set(0,1,0);cam.lookAt(camTgt);
    if(!staticMode&&Math.abs(cam.fov-baseFov())>.01){cam.fov=baseFov();cam.updateProjectionMatrix()}
  }
  // l'aiguille suit la trace, pointe en tête ; à l'arrêt sur un cairn, sa pointe s'arrête juste devant lui (côté caméra) et le désigne.
  // Au Départ, son pivot est sur le départ de la trace et elle recouvre le début de la trace, comme l'aiguille du cadran pendant la plongée
  const tb=clamp(t-(blk&&aw>0&&STOPS[aw].t<1?mw*11/curve.getLength():0));   // aux deux bouts de la trace (Départ, dernière étape), la pointe va exactement jusqu'au bout : leurs cairns sont posés à côté
  // base et pointe du triangle sont toutes deux SUR la trace (corde entre deux points de la courbe) : il la recouvre, même dans les virages ; jamais avant le départ
  const sc=lerp(1,.45,sm(0,.03,t)),nL=ball.userData.n*sc/curve.getLength(),tt=clamp(Math.max(tb,nL)),tB=clamp(tt-nL);
  {const pT=curve.getPointAt(tt);ball.position.copy(curve.getPointAt(tB));ball.scale.setScalar(Math.max(.01,ball.position.distanceTo(pT)/ball.userData.n));ball.lookAt(pT);
   if(intro>.001&&NDL.ok&&t<.006){   // vue de dessus : on reprend à l'écran la pointe et le pivot de l'aiguille du cadran (ramenés au plan de la trace), puis on glisse vers la trace en quittant le Départ
     const y=curve.getPointAt(0).y,e=ease(intro)*(1-sm(0,.006,t))*NDL.w;   // dès que la trace avance, l'aiguille la rejoint (la caméra, elle, reste en vue de dessus un peu plus longtemps)
     const s0=ball.scale.x;onPlane(NDL.tip,nT,y);onPlane(NDL.piv,nP,y);const so=nT.distanceTo(nP)/ball.userData.n;
     nQ.copy(ball.quaternion);v3.copy(ball.position);ball.position.copy(nP);ball.lookAt(nT);
     nQ.slerp(ball.quaternion,e);ball.quaternion.copy(nQ);ball.position.copy(v3).lerp(nP,e);ball.scale.setScalar(lerp(s0,so,e))}
   const top=aw===0;if(ball.userData.top!==top){ball.userData.top=top;ball.children.forEach(m=>{m.material.depthTest=!top;m.renderOrder=top?11:4})}}   // au Départ, l'aiguille passe devant la pierre gravée, comme sur le cadran : elle désigne le départ
  /* Le fil se dessine au fil de l'avancée, sans point qui se déplace : le triangle n'existe qu'au Départ (relais de l'aiguille du cadran pendant la plongée),
     il s'efface dès que la trace avance (NEEDLE_OUT) ; la lueur part alors du départ et s'arrête à l'abscisse atteinte (tt), sans trou sous l'aiguille. */
  const nv=1-sm(NEEDLE_OUT[0],NEEDLE_OUT[1],t);ball.visible=nv>.01;ball.children.forEach(m=>{m.material.opacity=nv});
  const tg0=lerp(tt,tB,nv),hB=nv>.01?tB:0,hT=nv>.01?tt:0;   // tant que le triangle est là, la lueur s'arrête à sa base et rien n'est dessiné dessous
  // tronçon visible : du cairn où l'on est (ou que l'on vient de quitter) au suivant ; à la dernière étape, de l'avant-dernier cairn au bout. Il glisse en douceur d'un tronçon au suivant
  {const L=curve.getLength(),eps=12/L;let k=0;for(let i=0;i<NS;i++)if(STOPS[i].t<=tt+eps)k=i;
   const v0=k>=NS-1?STOPS[NS-2].t:Math.min(STOPS[k].t,tB),v1=k>=NS-1?1:STOPS[k+1].t,kk=snap||reduce?1:1-Math.exp(-dt*3.5);
   trWin[0]+=(v0-trWin[0])*kk;trWin[1]+=(v1-trWin[1])*kk;}
  FATS.forEach(m=>{const glow=m.uniforms.uMode.value>.5;m.uniforms.uT.value=tg0;m.uniforms.uH0.value=hB;m.uniforms.uH1.value=hT;m.uniforms.uTime.value=reduce?0:tNow;m.uniforms.uV0.value=glow?0:trWin[0];m.uniforms.uV1.value=trWin[1];m.uniforms.uVF.value=6/curve.getLength()});   // le fil parcouru reste dessiné depuis le départ (uV0 = 0) ; le câble mat ne montre que le tronçon jusqu'au prochain cairn   // uT : avancement du pulse, lié au défilement (param(p)) à chaque image
  curT=t;parcAlt=altAt(t);
  // blocs : soulèvement au survol ou à l'arrêt, pivot vers la caméra
  blocks.forEach((bk,i)=>{
    const sel=(hoverIdx===bk.stopIdx||pinnedIdx===bk.stopIdx)?1:0,act=(aw===bk.stopIdx)?mw*.5:0;
    bk.lift+=(Math.max(sel,act)-bk.lift)*(1-Math.exp(-dt*7));
    const l=ease(bk.lift);
    bk.holder.position.y=bk.base+l*2.6;   // la pierre gravée se soulève un peu du cairn
    bk.shadow.scale.setScalar(1+.25*l);bk.shadow.material.opacity=.6-.3*l;
    bk.holder.rotation.y=bk.faceYaw+clamp((curT-bk.t)*8,-.55,.55)*.5;
    bk.mesh.rotation.x=-Math.PI/2+.42-.12*l;
    // état : cairn actif à 100 % (l'aiguille arrêtée devant lui le désigne), le suivant en discret (la destination), le précédent seulement le temps de le quitter ; tous les autres sont masqués : un seul repère à lire à la fois
    const st=bk.stopIdx===aw?2:bk.stopIdx<aw?1:0,d=bk.stopIdx-aw,goal=d===0?1:d===1?CAIRN_NEXT:d===-1?CAIRN_NEXT*(1-mw):0;
    bk.vis+=(goal-bk.vis)*(snap?1:1-Math.exp(-dt*6));if(bk.vis<.004)bk.vis=0;
    {const on=bk.vis>0;bk.holder.visible=bk.cairn.visible=bk.shadow.visible=on}
    bk.shadow.material.opacity*=Math.min(1,bk.vis/CAIRN_NEXT);
    bk.mats.forEach(m=>{m.opacity=bk.vis;m.depthWrite=bk.vis>.97});
    {const on=st===2;bk.mesh.renderOrder=on?10:0;if(bk.mats[0].depthTest===on){bk.mats[0].depthTest=bk.mats[1].depthTest=!on}}   // la pierre gravée du cairn actif passe devant le wire et les courbes : son texte reste lisible
    const bs=[0,.38,0][st];   // cairn actif : pas de perle, l'aiguille le désigne
    bk.bead.scale.setScalar(Math.max(.001,bk.bead.scale.x+(bs-bk.bead.scale.x)*(snap?1:1-Math.exp(-dt*6))));bk.bead.visible=bk.bead.scale.x>.02&&bk.vis>0;
  });
}

/* ---------- Ciel de crépuscule : du bleu minéral au bivouac ---------- */
const hex=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
const SKY=[{p:0,t:hex('#050811'),b:hex('#0A1220'),g:0},{p:.5,t:hex('#0A1020'),b:hex('#121B2B'),g:.25},{p:.8,t:hex('#0E1426'),b:hex('#3A2530'),g:.6},{p:1,t:hex('#04060E'),b:hex('#14100F'),g:.35}];   // ciel : bleu nuit arctique, puis une lueur cuivrée vers le bivouac
const sky=$('#sky2');
const SKYL=[{p:0,t:hex('#E4EEF5'),b:hex('#F3EEE4'),g:0},{p:.5,t:hex('#DCE8F1'),b:hex('#F1EBDD'),g:.18},{p:.8,t:hex('#E8EEF3'),b:hex('#F6E6D0'),g:.3},{p:1,t:hex('#E4EEF5'),b:hex('#F3EEE4'),g:0}];   // ciel de jour de la carte
let parcLt=null;
function parcTheme(L){   // carte de jour : relief en teintes cuivre foncé en mélange normal (l'additif s'efface sur fond clair), trace encre
  if(!mat)return;parcLt=L;
  mat.blending=L?THREE.NormalBlending:THREE.AdditiveBlending;mat.needsUpdate=true;
  mat.uniforms.cLo.value.set(...(L?[.55,.22,.07]:[.78,.44,.18]));mat.uniforms.cHi.value.set(...(L?[.80,.38,.13]:[1,.70,.42]));mat.uniforms.cGrid.value.set(...(L?[.20,.34,.48]:[.35,.55,.75]));mat.uniforms.cF.value.set(...(L?[.62,.12,.03]:[1,.28,.08]));
  FATS.forEach(m=>{const o=m.userData.o;if(!o)return;
    m.blending=(o.add&&!L)?THREE.AdditiveBlending:THREE.NormalBlending;m.needsUpdate=true;   // l'additif s'efface sur fond clair
    m.uniforms.uColor.value.set(L?o.cl:o.c);m.uniforms.uC2.value.set(L?(o.c2l||o.cl):(o.c2||o.c));m.uniforms.uAlpha.value=L?o.al:o.a;m.uniforms.uBoost.value=L?(o.boostl||1):(o.boost||1)});
  blocks.forEach(b=>{b.bead.material.color.set(L?0x0B2E3A:0xF2FBF8)});
  if(ball){(L?[0xD2672B,0xA8401B]:[0xF59A5C,0xD4581F]).forEach((h,i)=>ball.children[i].material.color.setHex(h))}   // mêmes teintes que le nord de l'aiguille du cadran
}
function updateSky(p){
  if(parcLt!==(theme==='light'))parcTheme(theme==='light');
  const SK=theme==='light'?SKYL:SKY;
  let i=0;while(i<SK.length-2&&p>SK[i+1].p)i++;
  const a=SK[i],b=SK[i+1],u=clamp((p-a.p)/(b.p-a.p)),m=k=>a[k].map((v,j)=>Math.round(lerp(v,b[k][j],u))),g=lerp(a.g,b.g,u);
  sky.style.background=`radial-gradient(ellipse 90% 45% at 50% 105%,rgba(240,120,60,${(g*(theme==='light'?.3:.55)).toFixed(3)}),transparent 70%),linear-gradient(to bottom,rgb(${m('t')}),rgb(${m('b')}))`;
  if(mat)mat.uniforms.uGlow.value=1+g*.5;
}

/* ---------- Interface : étapes, métriques, étiquettes holographiques ---------- */
const stageList=$('#pStageList'),plist=$('#pList'),tagsEl=$('#pTags');
const DIRS=['N','NE','E','SE','S','SO','O','NO'];
function altAt(t){const f=clamp(t)*(P.length-1),i=Math.floor(f),u=f-i,j=Math.min(i+1,P.length-1);return lerp(P[i].alt,P[j].alt,u)}
function bearingAt(t){const a=curve.getPointAt(clamp(t-.02)),b=curve.getPointAt(clamp(t+.02));return ((Math.atan2(b.x-a.x,-(b.z-a.z))*180/Math.PI)%360+360)%360}
const fmt=n=>Math.round(n).toLocaleString('fr-FR');
STOPS.forEach((st,i)=>{
  const li=document.createElement('li'),b=document.createElement('button'),sg=st.sg,num=sg.kind==='depart'?'00':sg.num?String(sg.num).padStart(2,'0'):sg.kind==='bivouac'?'BV':'∞';b.type='button';b.dataset.i=i;
  b.innerHTML=`<span class="dot" aria-hidden="true"></span><span class="stip"><i aria-hidden="true">${num}</i><span class="lb">${esc(sg.label)} · ${esc(sg.title)}</span></span>`;
  if(sg.kind==='bivouac')li.classList.add('biv');   // bivouac : petit marqueur, pas une étape
  b.addEventListener('click',()=>{pinnedIdx=pinnedIdx===i?-1:i;gotoStop(i)});
  b.addEventListener('pointerenter',()=>{focusIdx=i});b.addEventListener('pointerleave',()=>{focusIdx=-1});
  b.addEventListener('focus',()=>{focusIdx=i});b.addEventListener('blur',()=>{if(focusIdx===i)focusIdx=-1});
  li.style.top=(i/(STOPS.length-1)*100).toFixed(2)+'%';   // les étapes sont réparties sur toute la hauteur de la barre de progression
  li.appendChild(b);stageList.appendChild(li);
  // la liste des étapes (#pList : dates, chiffre, liens vers les fiches) est rendue côté serveur (utils/loopMarkup.ts) : rien à construire ici
});
const stageBtns=[...stageList.querySelectorAll('button')],holos=[...tagsEl.querySelectorAll('.holo')];
/* barre de progression : dans la zone de la carte, la pastille parcourt les points d'étapes posés sur la barre */
mapRail=p=>{
  const zk=p<.5?sm(.27,.31,p)*(1-sm(.5,.545,p)):0;if(zk<=0)return null;
  const l=clamp((p-PC0)/PCW),n=STOPS.length,c=STOPS.map(s=>(s.a+s.b)/2);let q=0;
  if(l>=c[n-1])q=1;else if(l>c[0]){let i=0;while(i<n-2&&l>c[i+1])i++;q=(i+(l-c[i])/(c[i+1]-c[i]))/(n-1)}
  return {top:lerp(p*100,q*100,zk),zk};
};
function gotoStop(i){const s=STOPS[i];cinematicTo(PC0+PCW*(s.a+s.b)/2)}
const mapTot=$('#mapTot');let totK=-1,totG=-1;
const plMore=$('#plMore');   // la plaque de métriques sous la carte (.pl-metrics) a été retirée : stèle, panneau d'étape et annonces portent ces informations
const plDock=plMore.parentElement;
// « Voir la fiche » (#plMore) est un vrai lien : son href suit l'étape affichée (première fiche liée, /contact au cairn final), voir updateUi
/* Fiche d'étape : à l'arrêt sur un cairn (caméra posée), un résumé compact apparaît sur le côté (en bas sur téléphone), sans prendre le focus ni bloquer le défilement ;
   « Fiche complète » ouvre la fenêtre détaillée. Elle disparaît en repartant. Le visiteur peut la masquer pour la session (le bouton « Voir la fiche » revient). */
const sCard=$('#stopCard'),sMore=$('#scMore'),s2el=$('#s2');let cardIdx=-1,cardShut=-1;   // cardShut : étape dont le panneau a été fermé (✕ ou Échap) ; il revient à l'étape suivante
/* résumé d'étape condensé : une ou deux phrases (≈ 150 signes au plus), la fiche complète garde tout le texte */
function brief(t,max=150){const ph=String(t||'').trim().split(/(?<=[.!?…])\s+/);let out='';for(const x of ph){if(out&&(out+' '+x).length>max)break;out=out?out+' '+x:x}return out}
/* La stèle gravée porte l'étape, le lieu, l'année, le nom, le kilomètre, le dénivelé, l'altitude et les technos ; la carte donne le reste : rôle, résumé, chiffres et points clés.
   La stèle est décorative (aria-hidden) : le titre (h3) et la ligne #scSr redonnent aux lecteurs d'écran ce qui n'est écrit que dans la pierre. */
/* Panneau d'étape (verre sombre, à droite de la 3D) : année · catégorie, titre, résumé, points clés, technos, « Voir le site ↗ » et « Code source ↗ », lien vers la fiche complète.
   La stèle gravée garde étape, lieu, km, D+ et altitude : ils sont redonnés aux lecteurs d'écran (#scSr), la stèle étant décorative. */
const cap=(t,max)=>{t=String(t||'').trim();if(t.length<=max)return t;const c=t.slice(0,max);return c.slice(0,Math.max(c.lastIndexOf(' '),max*.7)).replace(/[\s.,;:–-]+$/,'')+'…'};   // coupe au mot : la fiche complète garde le texte entier
const isCode=u=>/github\.com|gitlab\.|bitbucket\.org/i.test(u);
/* Aperçus du panneau d'étape : une image par projet lié (3 au plus). Capture d'écran saisie dans /admin, sinon celle du repli data/projects.ts, sinon la photo d'ambiance ;
   jamais l'image « bientôt » (/projectsoon.png) ; en dernier recours, l'image de repli par slug de data/stageImages.ts (projets absents de data/projects.ts). Capture claire ou sombre selon le thème choisi. Rien d'inventé : pas de projet lié ou pas d'image, pas d'aperçu.
   Décoratives (alt vide) : le titre du projet est écrit sous chaque image et les liens « Fiche … » du panneau portent l'information. */
const IMG_SEEN=new Set();
function stageImgs(sg){
  const light=document.documentElement.getAttribute('data-theme')==='light',out=[],seen=new Set();
  (sg.images||[]).forEach(x=>{const src=okUrl(x.src);if(src&&!seen.has(src)&&out.length<3){seen.add(src);out.push({src,title:x.title||shortT(sg.title)})}});   // images saisies pour l'étape (admin › Étapes) : d'abord ; les projets liés complètent jusqu'à 3
  const shot=o=>{const im=(o&&o.image)||{},x=(light?im.light:im.dark)||im.light||im.dark||'';return /projectsoon/i.test(x)?'':x};
  (sg.links||[]).forEach(l=>{
    const a=(CMS.projects||[]).find(p=>p.slug===l.slug),s=SITE_PROJECTS.find(p=>p.id===l.slug);
    const src=okUrl(shot(a)||shot(s)||(a&&a.cover)||(s&&s.cover)||(IMG_FB[l.slug]&&IMG_FB[l.slug].src)||'');
    if(src&&!seen.has(src)&&out.length<3){seen.add(src);out.push({src,title:shortT(l.title)})}
  });
  return out}
function preloadStageImgs(from){   // les images des deux étapes suivantes arrivent pendant que la caméra est posée : pas d'image qui apparaît d'un coup
  idle(()=>[from+1,from+2].forEach(i=>{const s=STOPS[i];if(s)stageImgs(s.sg).forEach(x=>{if(IMG_SEEN.has(x.src))return;IMG_SEEN.add(x.src);const im=new Image();im.decoding='async';im.src=x.src})}))}
function fillCard(pr){const sg=pr.sg,t=pr.t||0;
  sCard.setAttribute('aria-label',"Détails de l'étape "+sg.title);
  $('#scM').textContent=[sg.label,sg.period].filter(Boolean).join(' · ');
  $('#scT').textContent=sg.title;
  $('#scSr').textContent=[(sg.steleTitle&&sg.steleTitle!==sg.title?'Gravé sur la stèle : '+sg.steleTitle:''),(sg.stelePeriod&&sg.stelePeriod!==sg.period?'Période gravée : '+sg.stelePeriod:''),sg.place,'Altitude '+fmtN(altOf(sg,t))+' mètres',stageKmSpeech(sg)].filter(Boolean).join('. ')+'.';   // ce que seule la stèle (décorative) montre
  const l=$('#scL');l.innerHTML=summaryHtml(sg.summary,esc);l.hidden=!l.children.length;   // paragraphes et retours à la ligne saisis dans l'admin conservés
  const pl=$('#scP');pl.setAttribute('aria-label','Chiffre clé');pl.innerHTML=sg.figure?`<li><strong>${esc(sg.figure)}</strong>${sg.figureLabel?' '+esc(sg.figureLabel):''}</li>`:'';pl.hidden=!pl.children.length;   // sans chiffre : rien (jamais de valeur inventée)
  const kl=$('#scK');kl.innerHTML='';kl.hidden=true;
  const L=sg.kind==='final'?[{href:'/contact',title:sg.cta||'Écrire la suite ensemble',txt:sg.cta||'Écrire la suite ensemble'}]:sg.links.map((x,k)=>({href:x.href,title:x.title,txt:k===0&&sg.cta?sg.cta:'Fiche '+x.title})),acts=$('#scActs');   // texte du lien principal : saisi dans l'admin (sg.cta), sinon « Fiche … »
  acts.innerHTML=L.map((x,k)=>`<a class="${k?'sc-code':'sc-cta'}" href="${esc(x.href)}">${esc(x.txt)}<span aria-hidden="true"> →</span></a>`).join('');   // vrais liens : ils marchent aussi sans 3D (même liste dans #pList)
  acts.hidden=!acts.children.length;sMore.hidden=true;
  const il=$('#scI'),ims=stageImgs(sg);il.className='sc-imgs n'+ims.length;il.hidden=!ims.length;
  il.innerHTML=ims.map(x=>`<li><figure><img src="${esc(x.src)}" alt="" loading="lazy" decoding="async" width="320" height="200"><figcaption>${esc(x.title)}</figcaption></figure></li>`).join('');
  il.querySelectorAll('img').forEach(im=>im.addEventListener('error',()=>{const li=im.closest('li');if(li)li.remove();il.hidden=!il.children.length},{once:true}));   // image introuvable : l'aperçu disparaît, le reste du panneau ne bouge pas
  preloadStageImgs(STOPS.findIndex(x=>x.sg===sg))}
function updateCard(){
  const as=STOPS[activeStop],pr=as&&(as.proj||(activeStop===0?(blocks.find(b=>b.stopIdx===0)||{}).proj:null)),ok=!staticMode&&cardShut!==activeStop&&pr&&pr.sg;   // chaque étape a son panneau (Départ, bivouac et cairn final compris)
  const cand=!ok?-1:stopW>.9?activeStop:(stopW>.55&&cardIdx===activeStop?activeStop:-1);   // hystérésis : apparaît caméra posée, reste jusqu'au vrai départ
  if(cardShut>=0&&activeStop!==cardShut)cardShut=-1;   // on a quitté l'étape fermée : son panneau reviendra la prochaine fois
  const now=performance.now();if(cand!==updateCard.c){updateCard.c=cand;updateCard.t=now}
  const want=cand>=0&&now-updateCard.t<120?cardIdx:cand;   // arrêt d'au moins 0,12 s : le panneau suit vite, sans clignoter aux étapes survolées pendant un saut
  if(want===cardIdx)return;
  if(cardIdx>=0&&want<0&&sCard.contains(document.activeElement))plMore.focus({preventScroll:true});   // le focus ne se perd pas dans une carte qui disparaît
  cardIdx=want;if(want>=0)fillCard(pr);sCard.classList.toggle('on',want>=0);s2el.classList.toggle('card-on',want>=0)}
function shutCard(){if(cardIdx<0)return;cardShut=activeStop;const inside=sCard.contains(document.activeElement);updateCard();if(inside)plMore.focus({preventScroll:true});live.textContent='Panneau fermé. Le lien Voir la fiche reste disponible.'}
$('#scX').addEventListener('click',shutCard);
addEventListener('keydown',e=>{if(e.key!=='Escape'||e.defaultPrevented||TOUR.on||cardIdx<0||document.querySelector('dialog[open]')||document.querySelector('.burger[aria-expanded="true"]'))return;shutCard()},true);   // capture : passe avant l'écouteur de la visite guidée (qui l'arrête). Échap ferme le panneau d'étape (jamais pendant la visite guidée, une fenêtre ou un menu ouvert)
let lastShown=-2;
function updateUi(p){
  const sel=pinnedIdx>=0?pinnedIdx:(ptrIdx>=0?ptrIdx:(focusIdx>=0?focusIdx:-1));
  const cur=sel>=0?sel:activeStop;
  stageBtns.forEach((b,i)=>{b.setAttribute('aria-current',String(i===activeStop));b.classList.toggle('past',i<activeStop)});
  const st=STOPS[Math.max(cur,0)],t=st.proj?st.t:(cur===0?0:1);
  const alt=altAt(t),brg=bearingAt(t);
  {const sg=st.sg,nx=sg.kind==='final',href=sg.href;   // « Voir la fiche » : lien vers la première fiche liée ; au cairn final, vers Contact
   if(href){plMore.hidden=false;plMore.href=href;plMore.querySelector('.t').textContent=nx?'Écrire la suite':'Voir la fiche';plMore.querySelector('.n').textContent=' : '+(nx?'Contact':sg.links[0].title);plDock.classList.add('on-proj')}else{plMore.hidden=true;plDock.classList.remove('on-proj')}}
  if(cur!==lastShown||sceneSay){lastShown=cur;if(cur>=0){const sg=st.sg;live.textContent=(sceneSay?sceneSay+'. ':'')+[sg.label+' : '+sg.title,sg.period,sg.keyResult].filter(Boolean).join(', ')+'. '+stageKmSpeech(sg)+'.'}sceneSay=''}   // chaque changement d'étape est annoncé (#live, aria-live)
  // étiquettes
  holos.forEach(h=>{const i=+h.dataset.i;const on=(i===sel)||(sel<0&&i===activeStop);h.classList.toggle('on',on)});
  updateCard();
}
const _v=OK?new THREE.Vector3():null;
function placeHolos(){
  if(!OK)return;const w=cv.clientWidth,h=cv.clientHeight;
  holos.forEach(el=>{
    if(!el.classList.contains('on'))return;
    const bk=blocks.find(b=>b.stopIdx===+el.dataset.i);if(!bk)return;
    _v.copy(bk.holder.position);_v.y+=10;_v.project(cam);
    const x=(_v.x*.5+.5)*w,y=(-_v.y*.5+.5)*h;
    el.style.transform=`translate(${clamp(x,140,w-140).toFixed(1)}px,${clamp(y-50,110,h-150).toFixed(1)}px)`;
  });
}
function pick(){
  if(!OK||!ptr.in||!blocks.length){ptrIdx=-1;return}
  const w=cv.clientWidth,h=cv.clientHeight;
  cam.updateMatrixWorld();scene.updateMatrixWorld();
  ray.setFromCamera(new THREE.Vector2(ptr.x/w*2-1,-(ptr.y/h)*2+1),cam);
  const hit=ray.intersectObjects(blocks.filter(b=>b.vis>.1).map(b=>b.mesh),false)[0];   // un cairn masqué ne réagit pas au survol
  ptrIdx=hit?blocks.find(b=>b.mesh===hit.object).stopIdx:-1;
  cv.style.cursor=ptrIdx>=0?'pointer':'';
}
cv.addEventListener('pointermove',e=>{const r=cv.getBoundingClientRect();ptr.x=e.clientX-r.left;ptr.y=e.clientY-r.top;ptr.in=true});
cv.addEventListener('pointerleave',()=>{ptr.in=false;ptrIdx=-1});
cv.addEventListener('click',e=>{   // toucher le bloc 3D : sur l'étape en cours, il ouvre la fiche ; sur un autre bloc, la caméra s'y rend
  const r=cv.getBoundingClientRect();ptr.x=e.clientX-r.left;ptr.y=e.clientY-r.top;ptr.in=true;pick();
  if(ptrIdx<0)return;const st=STOPS[ptrIdx];
  if(ptrIdx===activeStop&&st&&st.sg&&st.sg.href){location.assign(st.sg.href);return}   // clic sur la stèle de l'étape affichée : même destination que « Voir la fiche »
  pinnedIdx=pinnedIdx===ptrIdx?-1:ptrIdx;gotoStop(ptrIdx)});
addEventListener('keydown',e=>{if(e.key==='Escape')pinnedIdx=-1});

/* ---------- Vue statique et interface publique ---------- */
function staticView(){
  if(!inited)return;resize();updateSky(.3);
  const c=curve.getPointAt(.5),ext=Math.max(bx1-bx0-2*pad,bz1-bz0-2*pad)*1.12,hs=Math.max(900,ext*.5/Math.tan(14*Math.PI/180));camPos.set(c.x,hs,c.z+70);camTgt.set(c.x,0,c.z);cam.position.copy(camPos);cam.lookAt(camTgt);cam.fov=28;cam.updateProjectionMatrix();
  FATS.forEach(m=>{const u=m.uniforms;u.uT.value=1;u.uTime.value=0;u.uV0.value=0;u.uV1.value=1;u.uH0.value=u.uH1.value=0});   // vue statique : toute la trace, sans aiguille
  if(ball)ball.visible=false;
  blocks.forEach(b=>{b.lift=0;b.holder.position.y=b.base});
  renderer.render(scene,cam);
}
function dynamicView(){if(!inited)return;resize()}
let inited=false;
function ensure(){if(inited||!OK)return;inited=true;initScene();resize();camPos.set(0,0,0);camTgt.set(0,0,0);first=true}
let first=true,lastT=0;
function update(l,dt,intro,rain=0){
  if(!inited)return;
  rainR=staticMode?0:rain;
  const iL=1-sm(STOPS[0].b,STOPS[1].a,l);   // la vue de dessus (alignée sur le verre) ne dure que le temps du Départ, puis la caméra s'incline en rejoignant la première étape
  updateSky(l);rig(l,dt,first||iL>0,iL);first=false;
  {const tt=param(l),k=Math.round(kmAt(tt)),g=Math.round(gainAtT(tt)/10);if(k!==totK||g!==totG){totK=k;totG=g;mapTot.textContent=kmLine(tt)}}   /* sous le titre : kilomètre et dénivelé cumulés évoluent avec l'avancée sur la trace */
  pick();updateUi(l);
  {const end=blocks.find(x=>x.t>=1);if(end)rainStep(rainR,dt,end);if(rainR<=0)rainHide()}
  warmAhead();renderer.render(scene,cam);placeHolos();
}
/* Préchauffage des cairns à venir. Un cairn (pierre gravée 768×576, galets, ombre, perle) n'est envoyé au GPU et ses shaders compilés qu'au premier rendu où il est visible ET dans le champ de la caméra :
   sans ça, tout se paie en un saut d'image au moment où le cairn apparaît (sensation de « chargement » en arrivant sur un projet). Ici, à l'arrêt sur l'étape n, on fait dessiner les cairns n+1 et n+2
   (WARM_AHEAD), un seul par image, dans un coin de 1 px (scissor) que le rendu normal recouvre aussitôt après. Les cairns restent masqués : visibilité et culling sont rétablis juste après. */
const WARM_AHEAD=2;
function warmAhead(){
  if(staticMode||!OK||!inited||stopW<.9)return;   // seulement caméra posée sur une étape, jamais en plein mouvement
  let bk=null;blocks.forEach(b=>{if(!b.warm&&b.stopIdx>activeStop&&b.stopIdx<=activeStop+WARM_AHEAD&&(!bk||b.stopIdx<bk.stopIdx))bk=b});
  if(!bk)return;bk.warm=true;
  const saved=[];[bk.holder,bk.cairn,bk.shadow,bk.bead].forEach(o=>o&&o.traverse(c=>{saved.push([c,c.visible,c.frustumCulled]);c.visible=true;c.frustumCulled=false}));
  try{renderer.setScissorTest(true);renderer.setScissor(0,0,1,1);renderer.render(scene,cam)}catch(e){}
  try{renderer.setScissorTest(false)}catch(e){}
  saved.forEach(([c,v,f])=>{c.visible=v;c.frustumCulled=f});
}
function sizeIt(){if(inited)resize()}
function setQuality(){if(inited){renderer.setPixelRatio(Math.min(devicePixelRatio,QDPR()));resize()}}
function stopPs(){return STOPS.map(s=>({p:PC0+PCW*(s.a+s.b)/2,name:s.name}))}
return {ensure,update,resize:sizeIt,staticView,dynamicView,setQuality,stopPs,topoInfo(){return {heightAt:terrainAt,x0:C0.x,z0:C0.z,gy0:terrainAt(C0.x,C0.z),hx:hd.x,hz:hd.z,cstep:20*SC*EX,rfin:RFIN,kappa:KAPPA,hmin,hmax}},dispose(){if(inited)try{renderer.forceContextLoss();renderer.dispose()}catch(e){}}};

})();

/* ---------- Chargement ---------- */
function finishLoad(){
  if(loaded)return;
  try{localStorage.setItem('asc-seen','1')}catch(e){}
  loaded=true;loader.classList.add('done');
  root.style.overflow='';
  nRot=((nRot%TAU)+TAU)%TAU;if(nRot>Math.PI)nRot-=TAU;nVel=-2.2;
  live.textContent='Boussole calée sur le nord. Faites défiler pour explorer.';
}
/* Chargement progressif : chaque scène 3D (et la chaussure de 1 Mo) n'est préparée qu'à l'approche de sa scène,
   pendant un temps libre du navigateur ; un saut direct par le menu la prépare à l'arrivée (ensure() dans draw). */
const idle=window.requestIdleCallback?f=>requestIdleCallback(f,{timeout:800}):f=>setTimeout(f,60);
const PREWARM=[[.17,()=>PARC],[.44,()=>SHOE],[.70,()=>CAMP]];const warmed=new Set();
function prewarm(p){
  PREWARM.forEach(([at,get],i)=>{if(p>=at&&!warmed.has(i)){warmed.add(i);idle(()=>{try{get().ensure()}catch(e){}})}});
}

/* ---------- Démarrage ---------- */
if(seen)$('#loadLabel').textContent='Boussole prête';
initAurora();if(!THREE_OK)initWater();
if(THREE_OK)initThree();
applyQuality();
layoutTools();sizeThree();sizePuddle();
if(staticMode){setStatic(true);loaded=true;loader.classList.add('done')}
else root.style.overflow='hidden';
let fpsEma=.016,slowT=0;
function frame(ts){
  if(DEAD)return;
  const dt=Math.min(.05,(ts-last)/1000);last=ts;
  fpsEma+=(dt-fpsEma)*.05;
  if(loaded&&!staticMode&&!document.hidden&&ts-loadT0>LOAD_MS+4000){
    if(fpsEma>.03)slowT+=dt;else slowT=Math.max(0,slowT-dt*.5);
    if(slowT>2.5&&QC.tier<2){QC.tier++;applyQuality();slowT=0;fpsEma=.016;ecoSync()}   // la page ralentit : on allège
  }
  if(!paused)tNow+=dt;
  if(!loaded){const lp=clamp((ts-loadT0)/LOAD_MS);pctEl.textContent=Math.round(lp*2480).toLocaleString('fr-FR');loadBar.style.transform=`scaleX(${lp})`;if(lp>=1)finishLoad()}
  if(!staticMode){
    const pr=loaded?warp(clamp(scrollY/Math.max(1,maxScroll()))):0;
    if(Math.abs(pr-pS)>.5)pS=pr;else pS+=(pr-pS)*(1-Math.exp(-dt*(cine?20:9)));   // pendant une transition (déjà lissée), la scène suit le défilement presque sans retard
    draw(pS,dt);updateExtras(pS,pr);stepSounds(pS);
    if(soundOn&&windG&&tNow-lastWind>.3){lastWind=tNow;windG.gain.setTargetAtTime(.16*(1-.9*sm(.8,.9,pS)),actx.currentTime,.3)}
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(t=>{last=t;loadT0=t;frame(t)});

  return {destroy(){
    DEAD=true;__ac.abort();__ivs.forEach(clearInterval);
    try{if(renderer){renderer.forceContextLoss();renderer.dispose()}}catch(e){}
    try{PARC.dispose();SHOE.dispose();CAMP.dispose()}catch(e){}
    try{const g=auroraCv.getContext('webgl'),ext=g&&g.getExtension('WEBGL_lose_context');if(ext)ext.loseContext()}catch(e){}
    try{if(actx&&actx.close)actx.close()}catch(e){}
    root.style.overflow='';document.body.removeAttribute('data-q');document.body.classList.remove('static','light');
  }};
}
