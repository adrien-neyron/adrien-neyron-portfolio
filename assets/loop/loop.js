/* L'ascension : accueil en boucle infinie (portage du prototype).
 * Usage : const loop = initLoop(THREE); … loop.destroy() au démontage de la page.
 * Prérequis : le balisage de loop.html est déjà dans le DOM, loop.css est chargée, three@0.128.0. */
export function initLoop(THREE){
  const __ac=new AbortController(),__sig=__ac.signal,__ivs=[];let DEAD=false;
  // les écouteurs de la fenêtre sont annulés à la destruction
  const addEventListener=(t,f,o)=>window.addEventListener(t,f,(o&&typeof o==='object')?{...o,signal:__sig}:{capture:!!o,signal:__sig});
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
const lerp=(a,b,t)=>a+(b-a)*t;
const ease=t=>t*t*(3-2*t);
const sm=(a,b,x)=>ease(clamp((x-a)/(b-a)));
const trap=(p,a,b,c,d)=>p<=a||p>=d?0:p<b?(p-a)/(b-a):p<=c?1:(d-p)/(d-c);
/* Le défilement brut est étiré : la scène des projets (progression 0,30 à 0,52) occupe la moitié de la page */
const WK_R=[0,.17,.68,1],WK_V=[0,.30,.52,1];
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
let staticMode=reduce, paused=false, loaded=false;
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
const E_FOREST=['#060B14','#E6F4F1','#A8B9C0','#23324A','#E26D3B','#E26D3B','#121B2B'];
const LIGHT_E=[K(0,E_DAWN),K(.50,E_DAWN),K(.56,E_FOREST),K(.78,E_FOREST),K(.86,E_CAMP),K(.95,E_CAMP),K(1,E_DAWN)];
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
const hint=$('#hint'),altEl=$('#alt'),modeEl=$('#mode'),live=$('#live');
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
const TOOLS=[
  {n:'Calculateur d\'allure',d:'Nouveau · trail avec D+ / D−',i:'chrono',a:30},
  {n:'RunFit Advisor',d:'Chaussures de trail · swipe',i:'shoe',a:85},
  {n:'Équipement IA',d:'6 outils IA que j\'intègre',i:'spark',a:140},
  {n:'Job Search Automator',d:'IA · pipeline de candidature',i:'flow',a:220},
  {n:'CoachFlow',d:'Coaching et formation',i:'pulse',a:275},
  {n:'Analyseur GPX',d:'À venir',i:'gpx',a:330}
];
const STEP=.026;
const toolsUl=$('#tools'), lines=$('#toolLines');
const chips=TOOLS.map((t,i)=>{
  const li=document.createElement('li'); li.className='chip';
  li.innerHTML=`<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[t.i]}</svg><b>${t.n}</b><span class="d">${t.d}</span>`;
  toolsUl.appendChild(li);
  const ln=document.createElementNS('http://www.w3.org/2000/svg','line'); ln.setAttribute('pathLength','1'); lines.appendChild(ln);
  return {li,ln};
});
let LAY={W:0,H:0,cx:0,cy:0,Rs:0};
function layoutTools(){
  const st=S[0]; const W=st.clientWidth,H=st.clientHeight;
  const mob=isMobile();
  const cy=mob?H*.49:H*.52, cx=W/2;
  const Rs=mob?.375*W:.30*Math.min(W,H);
  LAY={W,H,cx,cy,Rs};layoutEscape(W,H,cx,cy,mob);
  const sp=$('#spot');sp.style.setProperty('--spx',cx+'px');sp.style.setProperty('--spy',cy+'px');sp.style.setProperty('--spr',(Rs*1.8).toFixed(0)+'px');
  lines.setAttribute('viewBox',`0 0 ${W} ${H}`);
  const rx=Math.min(.36*W,520), ry=.34*H;
  chips.forEach((c,i)=>{
    if(mob){c.li.style.left=c.li.style.top='';c.ln.style.display='none';return}
    const th=TOOLS[i].a*Math.PI/180;
    const x=cx+Math.sin(th)*rx, y=cy-Math.cos(th)*ry;
    c.li.style.left=(x-112)+'px'; c.li.style.top=(y-34)+'px';
    const ux=Math.sin(th), uy=-Math.cos(th);
    const x1=cx+ux*(Rs*.66+14), y1=cy+uy*(Rs*.66+14);
    const dx=x-x1, dy=y-y1, dl=Math.hypot(dx,dy)||1;
    const back=Math.min(120,dl*.6);
    c.ln.style.display='';
    c.ln.setAttribute('x1',x1);c.ln.setAttribute('y1',y1);
    c.ln.setAttribute('x2',x-dx/dl*back);c.ln.setAttribute('y2',y-dy/dl*back);
  });
}


/* ---------- Aurore boréale et étoiles (shader plein écran, basse résolution) ---------- */
const auroraCv=$('#aurora');let auroraGL=null,auroraU=null;
const AUR_FS=`precision highp float;
uniform vec2 uRes;uniform float uT;
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
  auroraGL=gl;auroraU={res:gl.getUniformLocation(pr,'uRes'),t:gl.getUniformLocation(pr,'uT')};
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
function drawAurora(t){if(!auroraGL)return;auroraGL.uniform2f(auroraU.res,auroraCv.width,auroraCv.height);auroraGL.uniform1f(auroraU.t,t);auroraGL.drawArrays(auroraGL.TRIANGLES,0,3)}

/* ---------- Boussole 3D ---------- */
function webglOK(){try{const c=document.createElement('canvas');return !!(c.getContext('webgl')||c.getContext('experimental-webgl'))}catch(e){return false}}
const THREE_OK=!!THREE&&webglOK();
const cv=$('#compassCanvas');
let renderer,scene3,cam,group,needle,dialTex,dialCanvas,bezelTex,bezelCanvas,vis=10,strapApply=null,readCanvas=null,readTex=null,lastReadDeg=-1,lastReadKey='',aimKey=null,pinnedKey=null,hoverKey=null,roMesh=null,topoMesh=null,topoTex=null,lastInto=null;
/* ---------- Montre GPS outdoor, inspirée des séries Garmin Fenix et Enduro ---------- */
function makeDial(){   // écran MIP : boussole numérique, fond noir, traits blancs
  const c=dialCanvas||(dialCanvas=document.createElement('canvas'));
  const N=(('ontouchstart' in window)&&innerWidth<900)?1536:2048;c.width=c.height=N;
  const x=c.getContext('2d'),R=512,cx=R,cy=R;x.setTransform(N/1024,0,0,N/1024,0,0);
  x.fillStyle='#050607';x.fillRect(0,0,1024,1024);
  const pc=document.createElement('canvas');pc.width=pc.height=4;const pp=pc.getContext('2d');pp.fillStyle='rgba(255,255,255,.05)';pp.fillRect(0,0,2,2);
  x.fillStyle=x.createPattern(pc,'repeat')||'rgba(255,255,255,.02)';x.fillRect(0,0,1024,1024);
  for(let d=0;d<360;d+=6){
    const a=d*Math.PI/180-Math.PI/2,big=d%30===0,r1=486,r2=big?446:464;
    x.strokeStyle=big?'#E6F4F1':'rgba(200,210,216,.6)';x.lineWidth=big?5:2.4;
    x.beginPath();x.moveTo(cx+Math.cos(a)*r1,cy+Math.sin(a)*r1);x.lineTo(cx+Math.cos(a)*r2,cy+Math.sin(a)*r2);x.stroke();
  }
  x.strokeStyle='rgba(255,255,255,.35)';x.lineWidth=2;x.beginPath();x.arc(cx,cy,490,0,TAU);x.stroke();
  x.textAlign='center';x.textBaseline='middle';
  const at=(d,r)=>{const a=d*Math.PI/180-Math.PI/2;return [cx+Math.cos(a)*r,cy+Math.sin(a)*r]};
  [['N',0],['E',90],['S',180],['O',270]].forEach(([l,d])=>{x.font='700 78px "Inter", sans-serif';x.fillStyle=d===0?'#E26D3B':'#E6F4F1';const p=at(d,392);x.fillText(l,p[0],p[1])});
  [['NE',45],['SE',135],['SO',225],['NO',315]].forEach(([l,d])=>{x.font='600 40px "Inter", sans-serif';x.fillStyle='#9AA4AB';const p=at(d,392);x.fillText(l,p[0],p[1])});
  [30,60,120,150,210,240,300,330].forEach(d=>{x.font='500 26px "JetBrains Mono", monospace';x.fillStyle='#B8C0C6';const p=at(d,392);x.fillText(String(d),p[0],p[1])});
  // champs de données
  x.font='500 30px "JetBrains Mono", monospace';x.fillStyle='#AEB8BF';x.fillText('COMPÉTENCES:',cx,cy-206);x.fillText('EXPÉRIENCE:',cx,cy+214);
  x.font='700 52px "Inter", sans-serif';x.fillStyle='#E6F4F1';x.fillText('Vue 3 | TypeScript',cx,cy-150);x.fillText('17 ANS',cx,cy+268);
  // qualités de savoir-être associées aux quatre points cardinaux
  x.font='600 34px "Inter", sans-serif';
  [['Résilience',0,326,'#E26D3B'],['Écoute',90,300,'#C9D1D6'],['Stabilité',180,326,'#C9D1D6'],['Curiosité',270,300,'#C9D1D6']].forEach(([l,d,r,col])=>{x.fillStyle=col;const p=at(d,r);x.fillText(l,p[0],p[1])});
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
    x.font=(l.length>1?'700 40px':'700 50px')+' "Inter", sans-serif';
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
const RING_T=.34,RING_C=new THREE.Vector3(0,0,-2.9),RING_W0=3.25,RING_W1=2.6,TAIL=2.4;
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
  for(let i=0;i<5200;i++){x.fillStyle=Wt?'rgba(70,70,64,'+(.03+rnd()*.06)+')':'rgba(255,255,255,'+(.01+rnd()*.025)+')';x.beginPath();x.arc(rnd()*W,rnd()*H,.5+rnd()*1.1,0,6.283);x.fill()}
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
  // sangle haute : de la patte haute jusqu'à la boucle
  const sA=sb-.05;
  ringG.add(new THREE.Mesh(bandGeo(curve,L,{s0:0,s1:sA,seg:Math.round(sA/.12),w:base,off:()=>0,v:s=>s/sA}),matA));
  // sangle basse : de la patte basse, par la boucle, puis posée à plat sur la sangle haute (queue arrondie)
  const wB=s=>{const q=s-sTip;return base(s)*(q<.5?Math.sqrt(Math.max(0,1-((.5-q)/.5)**2)):1)},offB=s=>(RING_T+.06)*(1-sm((s-(sb-.1))/.55));
  ringG.add(new THREE.Mesh(bandGeo(curve,L,{s0:sTip,s1:L,seg:Math.round(lenB/.12),w:wB,off:offB,v:s=>1-(s-sTip)/lenB}),matB));
  const place=(m,s,dz,dh)=>{const f=ringFrame(curve,s,L),Zr=new THREE.Vector3(1,0,0).cross(f.n);m.position.copy(f.p).addScaledVector(f.n,dh).addScaledVector(f.T,dz);m.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(1,0,0),f.n,Zr));ringG.add(m);return f};
  // boucle : cadre en acier autour des deux sangles, avec son ardillon
  const sc=sb+.1,Wb=3.2,bar=new THREE.BoxGeometry(Wb,.95,.15),side=new THREE.BoxGeometry(.16,.95,.95);
  place(new THREE.Mesh(bar,matMetal),sc,-.4,.2);place(new THREE.Mesh(bar,matMetal),sc,.4,.2);
  [-1,1].forEach(sx=>{const m=new THREE.Mesh(side,matMetal);place(m,sc,0,.2);m.position.x=sx*(Wb/2-.08)});
  place(new THREE.Mesh(new THREE.BoxGeometry(.16,.07,.8),matMetal),sc,0,.6);
  // deux passants en caoutchouc autour des deux épaisseurs
  [sb-.8,sb-1.4].forEach(s=>{
    const Wk=base(s)+.14,pl=new THREE.BoxGeometry(Wk,.07,.28),sd=new THREE.BoxGeometry(.07,.88,.28);
    place(new THREE.Mesh(pl,matRubber),s,0,.605);place(new THREE.Mesh(pl,matRubber),s,0,-.205);
    [-1,1].forEach(sx=>{const m=new THREE.Mesh(sd,matRubber);place(m,s,0,.2);m.position.x=sx*Wk/2});
  });
  return {holes:[.9,1.32,1.74,2.16,2.58,3.0].map(q=>q/lenB),lenB};
}

function makeStrapFade(){   // opacité : le bracelet s'efface vers le bout, sur son dernier tiers
  const c=document.createElement('canvas');c.width=8;c.height=128;const x=c.getContext('2d'),g=x.createLinearGradient(0,0,0,128);
  g.addColorStop(0,'#000');g.addColorStop(.36,'#fff');g.addColorStop(1,'#fff');x.fillStyle=g;x.fillRect(0,0,8,128);
  const t=new THREE.CanvasTexture(c);t.repeat.set(1/3.4,1/1.55);t.offset.set(.5,0);return t;
}
/* Lecture du cap (plaque transparente au centre de l'écran) */
function makeReadout(){readCanvas=document.createElement('canvas');readCanvas.width=512;readCanvas.height=256;readTex=new THREE.CanvasTexture(readCanvas);drawReadout(0,true);return readTex}
const DIRS=['N','NE','E','SE','S','SO','O','NO'];
function drawReadout(deg,force){
  const d=Math.round(deg)%360,info=aimKey&&HOT[aimKey],key=info?'i:'+aimKey:'h:'+d;
  if(!force&&key===lastReadKey)return;lastReadKey=key;
  const x=readCanvas.getContext('2d');x.clearRect(0,0,512,256);x.textAlign='center';x.textBaseline='alphabetic';
  if(info){
    let size=60;x.font='700 '+size+'px "Inter", sans-serif';
    while(x.measureText(info.t).width>470&&size>30){size-=3;x.font='700 '+size+'px "Inter", sans-serif'}
    x.fillStyle='#E6F4F1';x.fillText(info.t,256,96);
    x.fillStyle='#E26D3B';x.fillRect(206,118,100,4);
    x.fillStyle='#B9C2CA';x.font='500 30px "Inter", sans-serif';
    const words=info.d.split(' ');let line='',y=176;
    words.forEach(w=>{const t=line?line+' '+w:w;if(x.measureText(t).width>470&&line){x.fillText(line,256,y);y+=38;line=w}else line=t});
    x.fillText(line,256,y);
  }else{
    x.fillStyle='#C9D1D6';x.font='500 34px "JetBrains Mono", monospace';x.textAlign='left';x.fillText('CAP '+DIRS[Math.round(d/45)%8],64,56);x.textAlign='center';
    x.fillStyle='#E26D3B';x.font='700 112px "Inter", sans-serif';x.fillText(String(d).padStart(3,'0')+'°',256,176);
  }
  readTex.needsUpdate=true;
}
function makeTopoTex(){   // relief topographique qui remplace les données du cadran pendant la plongée
  const c=document.createElement('canvas');c.width=c.height=1024;const x=c.getContext('2d');
  x.fillStyle='#050607';x.fillRect(0,0,1024,1024);
  const cell=16,n=Math.ceil(1024/cell)+1;let sd=77;const rnd=()=>{sd=(sd*16807)%2147483647;return sd/2147483647};
  const P=[];for(let i=0;i<7;i++)P.push([rnd()*1024,rnd()*1024,.5+rnd()*.5,110+rnd()*120]);
  const f=new Float32Array(n*n);
  for(let j=0;j<n;j++)for(let i=0;i<n;i++){const X=i*cell,Y=j*cell;let h=0;for(const [px,py,a,sg] of P){const dx=(X-px)/1.25,dy=Y-py;h+=a*Math.exp(-(dx*dx+dy*dy)/(2*sg*sg))}f[j*n+i]=h+.05*Math.sin(X/70+1)*Math.sin(Y/60)}
  for(let li=0;li<22;li++){
    const L=.07+li*.05,master=li%5===4;x.strokeStyle=master?'rgba(226,109,59,.85)':'rgba(150,200,230,.5)';x.lineWidth=master?2.6:1.4;x.beginPath();
    marchLevel(f,n,n,cell,L,(x1,y1,x2,y2)=>{x.moveTo(x1,y1);x.lineTo(x2,y2)});x.stroke();
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
  const bp=[[1.98,-.02],[1.98,.07],[2.04,.13],[2.44,.13],[2.52,.05],[2.52,-.02]].map(([r,y])=>new THREE.Vector2(r,y));
  const bg=new THREE.LatheGeometry(bp,128);bg.rotateX(Math.PI/2);group.add(new THREE.Mesh(bg,or));
  makeBezel();bezelTex=new THREE.CanvasTexture(bezelCanvas);bezelTex.anisotropy=8;
  const bz=new THREE.Mesh(new THREE.RingGeometry(2.05,2.43,128),new THREE.MeshStandardMaterial({map:bezelTex,color:0x5E5E5E,metalness:.7,roughness:.55,envMap:env,envMapIntensity:.32}));bz.position.z=.132;group.add(bz);
  // écran
  makeDial();dialTex=new THREE.CanvasTexture(dialCanvas);dialTex.anisotropy=8;
  const scr=new THREE.Mesh(new THREE.CircleGeometry(1.98,120),new THREE.MeshBasicMaterial({map:dialTex}));scr.position.z=.05;group.add(scr);
  topoTex=makeTopoTex();
  topoMesh=new THREE.Mesh(new THREE.CircleGeometry(1.98,120),new THREE.MeshBasicMaterial({map:topoTex,transparent:true,opacity:0,depthWrite:false}));topoMesh.position.z=.053;topoMesh.visible=false;group.add(topoMesh);
  const ro=new THREE.Mesh(new THREE.PlaneGeometry(1.6,.8),new THREE.MeshBasicMaterial({map:makeReadout(),transparent:true,depthWrite:false}));ro.position.set(0,-.32,.06);group.add(ro);roMesh=ro;
  // cinq boutons : 10 h, 9 h, 8 h à gauche ; 2 h, 4 h à droite
  [300,270,240,60,120].forEach(clock=>{
    const phi=(90-clock)*Math.PI/180,ux=Math.cos(phi),uy=Math.sin(phi);
    const cap=new THREE.Mesh(new THREE.CylinderGeometry(.17,.17,.26,24),polymer);cap.rotation.z=phi-Math.PI/2;cap.position.set(ux*2.68,uy*2.68,-.1);group.add(cap);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(.18,.035,12,32),orPoli);ring.rotation.set(Math.PI/2*0,0,0);
    const col=new THREE.Mesh(new THREE.CylinderGeometry(.2,.2,.06,24),orPoli);col.rotation.z=phi-Math.PI/2;col.position.set(ux*2.55,uy*2.55,-.1);group.add(col);
  });
  // pattes (QuickFit), vis or rose, bracelet silicone
  const ls=new THREE.Shape();ls.moveTo(-1.85,0);ls.lineTo(1.85,0);ls.lineTo(1.75,1.0);ls.lineTo(-1.75,1.0);ls.closePath();
  const lgeo=new THREE.ExtrudeGeometry(ls,{depth:.34,bevelEnabled:true,bevelThickness:.04,bevelSize:.04,bevelSegments:2,curveSegments:1});
  const strapTex={};   // textures des sangles, créées avec la longueur de la queue
  const matA=new THREE.MeshStandardMaterial({color:0x9A9A9A,bumpScale:.5,roughness:.88,metalness:0,side:THREE.DoubleSide});
  const matB=new THREE.MeshStandardMaterial({color:0x9A9A9A,bumpScale:.5,roughness:.88,metalness:0,side:THREE.DoubleSide});
  const strapSide=new THREE.MeshStandardMaterial({color:0x0E0F10,roughness:.9,metalness:0});
  strapApply=dark=>{const kk=dark?'blanc':'noir';if(strapTex[kk]){[[matA,'A'],[matB,'B']].forEach(([m,q])=>{m.map=strapTex[kk][q];m.bumpMap=strapTex[kk][q];m.roughness=dark?.45:.9;m.bumpScale=dark?.45:.5;m.needsUpdate=true})}strapSide.color.set(dark?0xC9C9C3:0x0E0F10);strapSide.roughness=dark?.5:.9};
  /* Bracelet fermé : anneau complet (voir buildStrapRing) ; les pattes et les vis restent sur le boîtier */
  [1,-1].forEach(sg=>{
    const lg=new THREE.Mesh(lgeo,polymer);lg.rotation.z=sg>0?0:Math.PI;lg.position.set(0,sg*1.95,-.42);group.add(lg);
    [-1,1].forEach(sx=>{const sc=new THREE.Mesh(new THREE.CylinderGeometry(.075,.075,.03,6),orPoli);sc.rotation.x=Math.PI/2;sc.position.set(sx*1.6,sg*2.78,-.075);group.add(sc)});
  });
  {
    const ring=buildStrapRing(group,matA,matB,orPoli,strapSide,FOOT);
    strapTex.noir={A:makeLoopStrap('noir',null),B:makeLoopStrap('noir',ring.holes)};
    strapTex.blanc={A:makeLoopStrap('blanc',null),B:makeLoopStrap('blanc',ring.holes)};
  }
  strapApply(theme==='dark');
  // aiguille de cap : losange braise (nord) et argent (sud), au centre du cadran
  needle=makeNeedle();needle.position.set(0,.06,.075);group.add(needle);
  const gl=new THREE.Mesh(new THREE.CircleGeometry(1.98,64),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(makeGlass()),transparent:true,depthWrite:false}));gl.position.z=.16;group.add(gl);
  buildScenery();
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>{makeDial();dialTex.needsUpdate=true;makeBezel();bezelTex.needsUpdate=true;drawReadout(0,true);if(staticMode)drawStatic()});
}
function makeNeedle(){
  const g=new THREE.Group(),mk=(pts,col)=>{const sh=new THREE.Shape();sh.moveTo(pts[0][0],pts[0][1]);pts.slice(1).forEach(q=>sh.lineTo(q[0],q[1]));sh.closePath();return new THREE.Mesh(new THREE.ShapeGeometry(sh),new THREE.MeshBasicMaterial({color:col,transparent:true}))};
  const W=.12,N=.38,S=.30;
  g.add(mk([[0,N],[-W,0],[0,0]],0xF59A5C));g.add(mk([[0,N],[0,0],[W,0]],0xD4581F));   // nord, deux facettes
  g.add(mk([[0,-S],[0,0],[-W,0]],0xDDE3E7));g.add(mk([[0,-S],[W,0],[0,0]],0x9AA3AA));   // sud
  const piv=new THREE.Mesh(new THREE.CircleGeometry(.035,20),new THREE.MeshBasicMaterial({color:0x0B0D10,transparent:true}));piv.position.z=.004;g.add(piv);
  return g;
}
/* ---------- Décor de l'accueil : sol rocheux, rochers, massif en fil de fer lumineux (cyan à gauche, cuivre à droite) ---------- */
const FOOT=4.23,PITCH=3.1*Math.PI/180,MNX=110,MNZ=64,MU0=1.35;
let stand,scenery,sceneryNear,mtnGeo,mtnMat,gndMat,rockMat;const farRocks=[];
function makeGroundTex(){   // sol rocheux : dalles de pierre (cellules de Voronoï) aux joints sombres, arêtes éclairées
  const N=256,c=document.createElement('canvas');c.width=c.height=N;const x=c.getContext('2d'),im=x.createImageData(N,N);
  let sd=17;const r=()=>{sd=(sd*16807)%2147483647;return sd/2147483647};
  const K=46,px=[],py=[],tone=[];for(let i=0;i<K;i++){px.push(r()*N);py.push(r()*N);tone.push(.55+r()*.45)}
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){
    let d1=1e9,d2=1e9,k1=0;
    for(let k=0;k<K;k++){let dx=Math.abs(i-px[k]),dy=Math.abs(j-py[k]);if(dx>N/2)dx=N-dx;if(dy>N/2)dy=N-dy;const d=dx*dx+dy*dy;if(d<d1){d2=d1;d1=d;k1=k}else if(d<d2)d2=d}
    const e=Math.sqrt(d2)-Math.sqrt(d1),joint=Math.min(1,e/4.5),n=.85+r()*.3;
    const v=(48+60*tone[k1]*joint)*n*(.55+.45*joint);
    const o=(j*N+i)*4;im.data[o]=v*.92;im.data[o+1]=v*1.02;im.data[o+2]=v*1.1;im.data[o+3]=255;
  }
  x.putImageData(im,0,0);
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(90,60);t.anisotropy=4;return t;
}
function rockGeom(){
  const g=new THREE.IcosahedronGeometry(1,1),p=g.attributes.position;
  for(let i=0;i<p.count;i++){const vx=p.getX(i),vy=p.getY(i),vz=p.getZ(i),h=Math.sin(vx*12.9+vy*78.2+vz*37.7)*43758.5453,n=.8+(h-Math.floor(h))*.35;p.setXYZ(i,vx*n,Math.max(vy*n,-.2),vz*n)}
  g.computeVertexNormals();return g;
}
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
  farRocks.forEach(m=>{const {u,dep,w}=m.userData,z=Math.min(20,22-(he/Math.tan(dep*Math.PI/180))/s),half=(22-z)*tn*asp,sx=w*half;   // placés à un angle de sol donné sous l'horizon, donc au premier plan quel que soit l'écran
    m.position.set(u*half,0,z);m.scale.set(sx,sx*.55,sx*.75)});   // taille et position en fraction de la largeur de l'écran
}
function buildScenery(){
  scenery=new THREE.Group();scene3.add(scenery);sceneryNear=new THREE.Group();scene3.add(sceneryNear);
  const gtx=makeGroundTex();gndMat=new THREE.MeshStandardMaterial({color:0x5A6770,map:gtx,bumpMap:gtx,bumpScale:1.2,roughness:.9,metalness:0,transparent:true});
  const gnd=new THREE.Mesh(new THREE.PlaneGeometry(400,260),gndMat);gnd.rotation.x=-Math.PI/2;gnd.position.set(0,0,-90);scenery.add(gnd);
  rockMat=new THREE.MeshStandardMaterial({color:0x26324A,roughness:.88,metalness:.05,flatShading:true,transparent:true});
  const rg=rockGeom();
  // gros rochers au premier plan (à l'échelle de l'écran), cailloux autour du bracelet (à l'échelle de la montre)
  [[-.9,9.5,.34,.4],[-.42,8,.2,1.2],[.85,10,.3,2.1],[1.02,7,.2,.7],[-1.05,6.5,.26,2.6],[.5,8.5,.14,1.6],[-.75,12,.3,.9],[.72,11.5,.28,2.2],[-.1,13.5,.22,1.9],[.35,6,.12,.5],[-.6,5.5,.12,2.4],[.15,7.5,.16,1.2]].forEach(([u,dep,w,r])=>{const m=new THREE.Mesh(rg,rockMat);m.userData={u,dep,w};m.rotation.y=r;scenery.add(m);farRocks.push(m)});
  [[2.2,1.4,.5,.3,.4,.5],[-2.4,2.0,.4,.24,.35,1.9],[3.6,-.2,.3,.2,.3,2.7],[-3.8,.4,.55,.32,.45,.2],[.8,2.8,.26,.16,.22,1.1]].forEach(([x,z,a,b,c,r])=>{const m=new THREE.Mesh(rg,rockMat);m.position.set(x,0,z);m.scale.set(a,b,c);m.rotation.y=r;sceneryNear.add(m)});
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
    uniforms:{uT:{value:0},uFade:{value:1},uHmax:{value:10},uCA:{value:new THREE.Color(0x8CCFE6)},uCB:{value:new THREE.Color(0xE26D3B)}},
    vertexShader:'varying vec2 vUv;varying float vH;varying float vZ;void main(){vUv=uv;vH=position.y;vZ=-position.z;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:'varying vec2 vUv;varying float vH;varying float vZ;uniform float uT;uniform float uFade;uniform float uHmax;uniform vec3 uCA;uniform vec3 uCB;'+
      'float ln(float v){float w=fwidth(v);return 1.0-min(abs(fract(v-0.5)-0.5)/max(w,0.0001),1.0);}'+
      'void main(){float gu=ln(vUv.x/0.06);float gz=ln(vZ);float cont=ln(vH/1.1);float u01=clamp((vUv.x+1.35)/2.7,0.0,1.0);'+
      'vec3 col=mix(uCA,uCB,smoothstep(0.58,0.86,u01));float hn=clamp(vH/(uHmax*0.5),0.0,1.0);float slope=smoothstep(0.0,0.25,vH);'+
      'float a=(max(gu,gz)*1.0+cont*0.7)*slope+hn*0.11*smoothstep(0.0,0.2,hn);a*=0.8+0.2*sin(vZ*0.55-uT*1.3);a*=smoothstep(3.0,9.0,vZ)*(1.0-smoothstep(62.0,71.0,vZ));a*=1.0-smoothstep(1.15,1.35,abs(vUv.x));'+
      'col*=0.6+0.8*hn;gl_FragColor=vec4(col,a*uFade*0.62);}'
  });
  const mtn=new THREE.Mesh(mtnGeo,mtnMat);mtn.frustumCulled=false;mtn.renderOrder=2;scenery.add(mtn);
}
function sizeThree(){
  sizeAurora();buildTopoBg();sizeWarp();PARC.resize();SHOE.resize();CAMP.resize();
  if(!THREE_OK){ $('#compassFallback').style.display='block'; return }
  const w=cv.clientWidth,h=cv.clientHeight;if(!w||!h)return;
  renderer.setSize(w,h,false);cam.aspect=w/h;
  vis=3.9*h/LAY.Rs;
  cam.position.set(0,0,vis/(2*Math.tan(THREE.MathUtils.degToRad(15))));cam.rotation.x=PITCH;
  cam.updateProjectionMatrix();buildMountains();
  {const D0=cam.position.z,sc0=sceneryCalc().s;scene3.fog.near=D0+30*sc0;scene3.fog.far=D0+225*sc0}   // le sol se fond dans la nuit vers l'horizon
}
let nRot=0,nVel=0,lastTool=-1;
const tiltS={x:0,y:0,vx:0,vy:0};
function updateCompass(p,dt){
  if(!THREE_OK)return;
  const tools=p>=.07&&p<.25;
  let target=0;
  if(tools){
    const idx=clamp(Math.floor((p-.07)/STEP),0,TOOLS.length-1);target=-TOOLS[idx].a*Math.PI/180;
    if(idx!==lastTool){lastTool=idx;tick();haptic(8)}
  }else{
    lastTool=-1;
    if(p<.24||p>.95){
      if(orient.on&&orient.heading!=null)target=orient.heading*Math.PI/180;
      else if(tNow-ptr.t<4&&!paused)target=-Math.atan2(ptr.x-LAY.cx,-(ptr.y-LAY.cy));
    }
  }
  if(aimKey&&HOT[aimKey])target=-HOT[aimKey].b*Math.PI/180;
  if(!loaded){nRot+=dt*(11+Math.sin(tNow*3)*4)}
  else{
    const k=110,c=9;nVel+=(-k*(nRot-target)-c*nVel)*dt;nRot+=nVel*dt;
  }
  needle.rotation.z=nRot+(loaded&&!paused?Math.sin(tNow*2.1)*.018:0);
  drawReadout(((-needle.rotation.z*180/Math.PI)%360+360)%360);
  const zi=sm(.2,.30,p),scl=p<.5?lerp(1,4.6,zi):lerp(4.6,1,sm(.95,1,p));
  const sc=sceneryCalc();stand.scale.setScalar(scl);stand.position.y=sc.yD-FOOT*scl;   // le centre du cadran reste fixe pendant le zoom
  scenery.position.y=sceneryNear.position.y=sc.yD-FOOT;scenery.scale.setScalar(sc.s);
  const fz=p<.5?1-sm(.12,.26,p):sm(.96,1,p);
  mtnMat.uniforms.uT.value=tNow;mtnMat.uniforms.uFade.value=fz;gndMat.opacity=rockMat.opacity=fz;scenery.visible=sceneryNear.visible=fz>.01;
  const sw=paused?0:1;
  // ressort amorti : le boîtier a du poids, il suit le curseur avec un léger retard et un petit rebond
  {const k=38,c=9,mxv=reduce?0:mx,myv=reduce?0:my;tiltS.vx+=((mxv-tiltS.x)*k-tiltS.vx*c)*dt;tiltS.vy+=((myv-tiltS.y)*k-tiltS.vy*c)*dt;tiltS.x+=tiltS.vx*dt;tiltS.y+=tiltS.vy*dt}
  /* Orbite : la caméra semble tourner autour de la montre (souris, défilement, balancement lent) ; face au visiteur pendant le zoom */
  const pc=p>.5?0:p,face=p<.5?1-sm(.22,.30,p):sm(.95,1,p);   // fin de boucle = début (mêmes angles)
  stand.rotation.x=(-.1+Math.sin(tNow*.8)*.03*sw)*face+tiltS.y*.2*face;
  stand.rotation.y=(Math.sin(tNow*.55)*.1*sw*(1-sm(.05,.2,pc)*.7)+tiltS.x*.6+Math.sin(pc*11)*.14)*face;
  // métamorphose : les aiguilles s'effacent, les données du cadran se dilatent en relief topographique
  const nf=p<.5?1-sm(.15,.21,p):sm(.96,1,p),tf=p<.5?sm(.19,.26,p):1-sm(.96,1,p);
  needle.children.forEach(m=>{m.material.opacity=nf});needle.visible=nf>.01;needle.scale.setScalar(1+.4*(1-nf));
  roMesh.material.opacity=p<.5?1-sm(.17,.22,p):sm(.96,1,p);
  topoMesh.material.opacity=tf;topoMesh.visible=tf>.01;
  const zz=lerp(1,.55,tf);topoTex.repeat.set(zz,zz);topoTex.offset.set((1-zz)/2,(1-zz)/2);
  // franchissement du verre : clic, souffle, vibration
  const into=p>.21&&p<.5;if(lastInto!==null&&into&&!lastInto){tick();swoosh();haptic([10,40,16])}lastInto=into;
  renderer.render(scene3,cam);
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
  if(!THREE_OK)return {ready:()=>false,ensure(){},update(){},resize(){},impactScreen(){},rippleScreen(){},rainRipple(){},layoutZones(){},setQuality(){},dispose(){}};
  const cv=$('#shoeCanvas');
  let renderer,scene,cam,ray,gmat,pair,shoes=[],mirrors=[],pGeo,pPos,pSize,pAl,pMat,inv=[],ok=false,failed=false;
  const pl=new THREE.Plane(new THREE.Vector3(0,1,0),0),RIP=[],PARTS=[],NP=320,RX=4.6,RZ=2.6;
  const ripBuf=new Float32Array(32),prevU=[0,0];
  const tmpV=new THREE.Vector3();
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
  function overlayTex(){   // renforts pare-pierres, talon, liseré orange, boue séchée : dessinés dans l'espace de la chaussure
    const W=1040,Hh=480,c=document.createElement('canvas');c.width=W;c.height=Hh;const x=c.getContext('2d');
    const X=u=>(u+2.6)*200,Y=v=>(2.4-v)*200;
    const path=(pts,close=true)=>{x.beginPath();pts.forEach(([a,b],i)=>i?x.lineTo(X(a),Y(b)):x.moveTo(X(a),Y(b)));if(close)x.closePath()};
    // pare-pierres (bout)
    x.beginPath();x.moveTo(X(1.05),Y(.57));x.lineTo(X(2.5),Y(.57));x.bezierCurveTo(X(2.56),Y(.65),X(2.5),Y(.85),X(2.34),Y(1.05));x.bezierCurveTo(X(2.0),Y(1.42),X(1.55),Y(1.6),X(1.05),Y(1.64));x.closePath();
    x.fillStyle='#14181C';x.fill();x.strokeStyle='rgba(226,109,59,.85)';x.lineWidth=5;x.stroke();
    x.setLineDash([12,9]);x.strokeStyle='rgba(200,210,220,.5)';x.lineWidth=3;x.beginPath();x.moveTo(X(1.15),Y(.66));x.bezierCurveTo(X(1.5),Y(1.3),X(2.0),Y(1.2),X(2.3),Y(.95));x.stroke();x.setLineDash([]);
    // contrefort du talon
    x.beginPath();x.moveTo(X(-2.46),Y(.57));x.bezierCurveTo(X(-2.5),Y(1.2),X(-2.15),Y(1.72),X(-1.68),Y(1.84));x.lineTo(X(-1.4),Y(1.5));x.lineTo(X(-1.55),Y(.57));x.closePath();
    x.fillStyle='#14181C';x.fill();x.strokeStyle='rgba(226,109,59,.85)';x.lineWidth=5;x.stroke();
    // bande orange sur le flanc
    x.strokeStyle='rgba(226,109,59,.95)';x.lineWidth=24;x.lineCap='round';x.beginPath();x.moveTo(X(-1.2),Y(.98));x.bezierCurveTo(X(-.5),Y(1.05),X(.2),Y(1.3),X(.95),Y(1.22));x.stroke();
    x.strokeStyle='rgba(255,255,255,.55)';x.lineWidth=5;x.beginPath();x.moveTo(X(-1.2),Y(1.08));x.bezierCurveTo(X(-.5),Y(1.15),X(.2),Y(1.4),X(.95),Y(1.32));x.stroke();
    // boue séchée en bas du flanc
    let seed=3;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647};
    for(let i=0;i<2600;i++){const u=-2.5+rnd()*5,v=rnd()*rnd()*1.0+.56;x.fillStyle='rgba('+(48+rnd()*22|0)+','+(34+rnd()*16|0)+','+(22+rnd()*10|0)+','+(.35+rnd()*.5)+')';x.beginPath();x.arc(X(u),Y(v),1+rnd()*4.2,0,6.283);x.fill()}
    for(let i=0;i<16;i++){const u=-2+rnd()*4.4,v=.6+rnd()*.35;x.fillStyle='rgba(50,36,24,.7)';x.beginPath();x.ellipse(X(u),Y(v),10+rnd()*26,5+rnd()*9,rnd()*3,0,6.283);x.fill()}
    const t=new THREE.CanvasTexture(c);t.anisotropy=4;t.repeat.set(1/5.2,1/2.4);t.offset.set(.5,0);return t;
  }
  function makeEnvS(){
    const mk=(a,b,boxes)=>{const k=document.createElement('canvas');k.width=k.height=64;const x=k.getContext('2d'),g=x.createLinearGradient(0,0,0,64);g.addColorStop(0,a);g.addColorStop(1,b);x.fillStyle=g;x.fillRect(0,0,64,64);(boxes||[]).forEach(([bx,by,bw,bh,col])=>{x.fillStyle=col;x.fillRect(bx,by,bw,bh)});return k};
    const t=new THREE.CubeTexture([mk('#3A2A28','#0A0C10',[[26,0,8,64,'rgba(255,190,140,.7)']]),mk('#1E2A3C','#080A0E',[[15,0,6,64,'rgba(170,200,255,.8)']]),mk('#9FB4D0','#10151C',[[12,14,40,12,'rgba(235,245,255,.95)']]),mk('#050607','#080A0C'),mk('#2A3544','#0A0D12'),mk('#10151C','#05070A')]);
    t.needsUpdate=true;return t;
  }
  /* --- chaussure --- */
  const M=(x,y)=>[x/60,-y/60];
  function buildShoe(env){
    const g=new THREE.Group();
    const up=new THREE.Shape();
    up.moveTo(...M(-142,-34));up.bezierCurveTo(...M(-146,-72),...M(-126,-100),...M(-100,-106));up.bezierCurveTo(...M(-80,-110),...M(-64,-104),...M(-48,-112));
    up.bezierCurveTo(...M(-30,-124),...M(-6,-122),...M(10,-104));up.bezierCurveTo(...M(50,-96),...M(110,-84),...M(136,-56));up.bezierCurveTo(...M(146,-46),...M(148,-38),...M(146,-34));up.closePath();
    const upGeo=new THREE.ExtrudeGeometry(up,{depth:.7,bevelEnabled:true,bevelThickness:.4,bevelSize:.26,bevelSegments:5,curveSegments:14});upGeo.translate(0,0,-.35);
    const hex=hexTex(),ovl=overlayTex();
    const upper=new THREE.Mesh(upGeo,[new THREE.MeshStandardMaterial({map:hex,bumpMap:hex,bumpScale:.6,roughness:.72,metalness:.05,envMap:env,envMapIntensity:.6}),new THREE.MeshStandardMaterial({color:0x27384A,roughness:.72,metalness:.05})]);
    g.add(upper);
    const over=new THREE.Mesh(upGeo,[new THREE.MeshStandardMaterial({map:ovl,transparent:true,roughness:.85,metalness:0,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2,depthWrite:false}),new THREE.MeshBasicMaterial({visible:false})]);
    g.add(over);
    const ms=new THREE.Shape();
    ms.moveTo(...M(-146,-34));ms.lineTo(...M(148,-34));ms.quadraticCurveTo(...M(158,-20),...M(146,-6));ms.lineTo(...M(-140,-6));ms.quadraticCurveTo(...M(-154,-20),...M(-146,-34));
    const msGeo=new THREE.ExtrudeGeometry(ms,{depth:1.5,bevelEnabled:true,bevelThickness:.12,bevelSize:.1,bevelSegments:3,curveSegments:8});msGeo.translate(0,0,-.75);
    g.add(new THREE.Mesh(msGeo,new THREE.MeshStandardMaterial({color:0xE8E2D4,roughness:.55,metalness:0,envMap:env,envMapIntensity:.5})));
    const os=new THREE.Shape(),ox0=-2.4,ox1=2.45;
    os.moveTo(ox0+.2,0);os.lineTo(ox1-.2,0);os.quadraticCurveTo(ox1,0,ox1,.12);os.lineTo(ox0,.12);os.quadraticCurveTo(ox0,0,ox0+.2,0);
    const osGeo=new THREE.ExtrudeGeometry(os,{depth:1.25,bevelEnabled:true,bevelThickness:.05,bevelSize:.05,bevelSegments:2,curveSegments:6});osGeo.translate(0,0,-.625);
    const rub=new THREE.MeshStandardMaterial({color:0x14181C,roughness:.92,metalness:0});
    g.add(new THREE.Mesh(osGeo,rub));
    // crampons de la semelle
    const lugGeo=new THREE.BoxGeometry(.2,.17,.3),lugs=new THREE.InstancedMesh(lugGeo,rub,48),d=new THREE.Object3D();let n=0;
    for(let i=0;i<16;i++){const x=-2.25+i*.305;[-.47,0,.47].forEach((z,j)=>{if(n>=48)return;d.position.set(x+(j===1?.15:0),-.03,z);d.rotation.set(0,(j-1)*.25,0);d.updateMatrix();lugs.setMatrixAt(n++,d.matrix)})}
    lugs.count=n;g.add(lugs);
    // lacets techniques et languette
    const lace=new THREE.MeshStandardMaterial({color:0xE26D3B,roughness:.5,metalness:0,emissive:0x3A1A08});
    const topY=x=>{let b=0;up.getPoints(60).forEach(p=>{if(Math.abs(p.x-x)<.08&&p.y>b)b=p.y});return b+.23};
    for(let i=0;i<6;i++){
      const x=-.72+i*.3,ty=topY(x);
      const pts=[new THREE.Vector3(x-.05,ty-.26,-.72),new THREE.Vector3(x,ty-.02,-.38),new THREE.Vector3(x+.06,ty+.05,0),new THREE.Vector3(x,ty-.02,.38),new THREE.Vector3(x-.05,ty-.26,.72)];
      g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),14,.042,6,false),lace));
    }
    const tg=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(-1.75,1.5,0),new THREE.Vector3(-1.95,1.95,0),new THREE.Vector3(-1.6,2.05,0)]),12,.05,6,false),lace);g.add(tg);   // anse de talon
    // gouttelettes perlant sur le tissu
    const bead=new THREE.MeshStandardMaterial({color:0xBFD8EE,roughness:.04,metalness:0,transparent:true,opacity:.55,envMap:env,envMapIntensity:1.5});
    const bg=new THREE.SphereGeometry(1,10,8);let sd=21;const rnd=()=>{sd=(sd*16807)%2147483647;return sd/2147483647};
    for(let i=0;i<22;i++){
      const x=-1.9+rnd()*3.8,y=.72+rnd()*.85,side=rnd()<.5?-1:1;
      const b=new THREE.Mesh(bg,bead);b.userData.bead=true;const r=.03+rnd()*.05;b.scale.set(r,r*.85,r*.6);b.position.set(x,y,side*.77);g.add(b);
    }
    return g;
  }
  /* --- sol : boue et flaque (shader) --- */
  const GFS=`precision highp float;
  uniform float uT;uniform vec4 uRip[8];varying vec3 vW;
  float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
  float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
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
  void main(){
    vec2 p=vW.xz;vec2 q=p/vec2(4.6,2.6);float r=length(q);
    float m=1.-smoothstep(.9,1.,r+(vn(p*1.3)-.5)*.08);
    vec3 V=normalize(cameraPosition-vW);
    vec2 g=vec2(0.);float hh=0.;
    for(int i=0;i<8;i++){
      vec4 rp=uRip[i];float age=rp.z;
      if(age<0.||age>2.6)continue;
      vec2 d=p-rp.xy;float dist=length(d);float front=age*1.7;
      float env=exp(-abs(dist-front)*2.6)*exp(-age*1.2)*rp.w;
      float ph=(dist-front)*9.;
      hh+=sin(ph)*env;
      g+=normalize(d+vec2(1e-4))*cos(ph)*env*.55;
    }
    g+=(vec2(vn(p*3.+uT*.2),vn(p*3.-uT*.17))-.5)*.03;
    vec3 N=normalize(vec3(-g.x,1.,-g.y));
    vec3 R=reflect(-V,N);R.y=abs(R.y);
    float F=.04+.96*pow(1.-max(dot(N,V),0.),5.);
    vec3 water=vec3(.015,.025,.035)+sky(R)*(.25+.9*F)+vec3(.7,.85,1.)*pow(max(hh,0.),2.)*.5;
    float mud=vn(p*.9)*.6+vn(p*4.)*.4;
    vec3 ground=vec3(.03,.045,.07)*(.6+mud*.8)+sky(reflect(-V,vec3(0.,1.,0.)))*.03;
    vec3 col=mix(ground,water,m);
    col*=1.-.45*smoothstep(.75,1.,r)*m;
    float dfade=1.-smoothstep(18.,44.,length(vW-cameraPosition));
    gl_FragColor=vec4(col,mix(1.,.86,m)*dfade);
  }`;
  const PVS='attribute float size;attribute float alpha;varying float vA;uniform float uScale;void main(){vA=alpha;vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=size*uScale/-mv.z;gl_Position=projectionMatrix*mv;}';
  const PFS=`precision highp float;varying float vA;
  void main(){vec2 c=gl_PointCoord-.5;float d=length(c);float a=smoothstep(.5,.0,d);
    float cr=smoothstep(.05,.0,abs(c.x))*smoothstep(.5,.1,abs(c.y))+smoothstep(.05,.0,abs(c.y))*smoothstep(.5,.1,abs(c.x));
    gl_FragColor=vec4(vec3(.86,.93,1.)*(a*.85+cr*.7),(a*.9+cr*.5)*vA);}`;
  function init(){
    renderer=new THREE.WebGLRenderer({canvas:cv,antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,QDPR()));renderer.setClearColor(0x000000,0);
    scene=new THREE.Scene();cam=new THREE.PerspectiveCamera(36,1,.1,200);ray=new THREE.Raycaster();
    scene.add(new THREE.HemisphereLight(0xaac4e0,0x1a1410,.85));
    const moon=new THREE.DirectionalLight(0xbcd4ff,1.15);moon.position.set(-4,6,-6);scene.add(moon);
    const em=new THREE.PointLight(0xE26D3B,1.1,16);em.position.set(3.5,.8,3.5);scene.add(em);
    const env=makeEnvS();
    gmat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uT:{value:0},uRip:{value:ripBuf}},
      vertexShader:'varying vec3 vW;void main(){vW=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(vW,1.);}',fragmentShader:GFS});
    const gm=new THREE.Mesh(new THREE.PlaneGeometry(90,90),gmat);gm.rotation.x=-Math.PI/2;gm.renderOrder=1;scene.add(gm);
    pair=new THREE.Group();pair.position.y=.1;scene.add(pair);
    const base=buildShoe(env);
    [0,1].forEach(f=>{
      const s=f?base:base.clone();s.position.z=f?1.25:-1.25;pair.add(s);shoes.push(s);
      const mir=s.clone();mir.scale.y=-1;scene.add(mir);mirrors.push(mir);
    });
    // particules : gouttelettes qui accrochent la lumière des étoiles
    pGeo=new THREE.BufferGeometry();pPos=new Float32Array(NP*3);pSize=new Float32Array(NP);pAl=new Float32Array(NP);
    for(let i=0;i<NP;i++)pPos[i*3+1]=-100;
    pGeo.setAttribute('position',new THREE.BufferAttribute(pPos,3));pGeo.setAttribute('size',new THREE.BufferAttribute(pSize,1));pGeo.setAttribute('alpha',new THREE.BufferAttribute(pAl,1));
    pMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uScale:{value:600}},vertexShader:PVS,fragmentShader:PFS});
    const pts=new THREE.Points(pGeo,pMat);pts.frustumCulled=false;pts.renderOrder=3;scene.add(pts);
    // invitations : deux anneaux qui pulsent sur l'eau
    [-1,1].forEach(sd=>{const r=new THREE.Mesh(new THREE.RingGeometry(.55,.62,48),new THREE.MeshBasicMaterial({color:0xE26D3B,transparent:true,opacity:.6,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));r.rotation.x=-Math.PI/2;r.position.set(sd*2.6,.04,0);r.renderOrder=2;scene.add(r);inv.push(r)});
    ok=true;
  }
  function ensure(){
    if(ok||failed)return;
    try{init();const w=$('#waterCanvas');if(w)w.style.display='none';resize();setQuality(QC.tier)}catch(e){failed=true;ok=false}
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
  }
  function update(l,dt,still){
    if(!ok)return;
    pose(l,dt,still);stepSim(dt);placeCam(dt);
    ripBuf.fill(0);for(let i=0;i<8;i++)ripBuf[i*4+2]=-1;
    RIP.slice(-8).forEach((r,i)=>{ripBuf[i*4]=r.x;ripBuf[i*4+1]=r.z;ripBuf[i*4+2]=r.t;ripBuf[i*4+3]=r.a});
    gmat.uniforms.uT.value=tNow;
    inv.forEach((r,i)=>{const s=1+.12*Math.sin(tNow*2.2+i*3);r.scale.setScalar(s);r.material.opacity=(busy?0:.35)+.25*Math.sin(tNow*2.2+i*3)*(busy?0:1)+.15});
    renderer.render(scene,cam);
  }
  function setQuality(t){
    if(!ok)return;renderer.setPixelRatio(Math.min(devicePixelRatio,QDPR()));
    mirrors.forEach(m=>m.visible=t<2);
    [pair,...mirrors].forEach(r=>r.traverse(o=>{if(o.userData&&o.userData.bead)o.visible=t===0}));
    resize();
  }
  return {ready:()=>ok,ensure,update,resize,impactScreen,rippleScreen,rainRipple,layoutZones,setQuality,dispose(){if(ok)try{renderer.forceContextLoss();renderer.dispose()}catch(e){}}};
})();

/* ---------- Bivouac 3D : feu de camp, montre GPS, carnet, piolet, tasse ---------- */
const CAMP=(()=>{
  if(!THREE_OK)return {ready:()=>false,ensure(){},update(){},resize(){},stoke(){},setQuality(){},dispose(){}};
  const cv=$('#campCanvas'),sky4=$('#sky4');
  let renderer,scene,cam,ok=false,failed=false,light,logMat,ember,fSys,sSys,mSys,qm=1,stokeT=0,stokeV=0,wind=0,acc={f:0,s:0,m:0,u:0};
  const hash=(x,y)=>{const v=Math.sin(x*127.1+y*311.7)*43758.5453;return v-Math.floor(v)};
  function tex(w,h,fn,rep){const c=document.createElement('canvas');c.width=w;c.height=h;fn(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;if(rep)t.repeat.set(rep,rep);t.anisotropy=4;return t}
  function sdRnd(sd){return()=>{sd=(sd*16807)%2147483647;return sd/2147483647}}
  const mossTex=()=>tex(512,512,(x,w,h)=>{
    x.fillStyle='#1F2F19';x.fillRect(0,0,w,h);const r=sdRnd(5);
    for(let i=0;i<140;i++){x.fillStyle=['rgba(52,84,36,.55)','rgba(68,104,44,.45)','rgba(14,22,10,.5)'][i%3];x.beginPath();x.arc(r()*w,r()*h,8+r()*30,0,6.283);x.fill()}
    for(let i=0;i<5000;i++){x.fillStyle=r()<.5?'rgba(96,140,62,.35)':'rgba(10,14,8,.4)';x.fillRect(r()*w,r()*h,1+r()*2,1+r()*3)}
    x.strokeStyle='rgba(90,62,34,.45)';x.lineWidth=1;for(let i=0;i<260;i++){const px=r()*w,py=r()*h,a=r()*6.283;x.beginPath();x.moveTo(px,py);x.lineTo(px+Math.cos(a)*10,py+Math.sin(a)*10);x.stroke()}
    for(let i=0;i<40;i++){x.fillStyle='rgba(120,118,108,.55)';x.beginPath();x.ellipse(r()*w,r()*h,3+r()*6,2+r()*4,r()*3,0,6.283);x.fill()}},7);
  const rockTex=()=>tex(256,256,(x,w,h)=>{
    x.fillStyle='#6B6A63';x.fillRect(0,0,w,h);const r=sdRnd(9);
    for(let i=0;i<500;i++){x.fillStyle=r()<.5?'rgba(255,255,255,.05)':'rgba(0,0,0,.09)';x.fillRect(r()*w,r()*h,2+r()*6,2+r()*6)}
    for(let i=0;i<60;i++){x.fillStyle='rgba(58,92,40,'+(.35+r()*.35)+')';x.beginPath();x.arc(r()*w,r()*h*.8+h*.2,6+r()*22,0,6.283);x.fill()}
    for(let i=0;i<1600;i++){x.fillStyle='rgba(84,128,54,'+(.2+r()*.3)+')';x.fillRect(r()*w,r()*h,1+r()*2,1+r()*2)}},1);
  function rockGeo(r,seed){
    const g=new THREE.IcosahedronGeometry(r,2),p=g.attributes.position;
    for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),n=1+.28*(hash(x*3+seed,z*3+y*2)-.5)+.12*(hash(y*7+seed,x*5)-.5);p.setXYZ(i,x*n,y*n*.68,z*n)}
    g.computeVertexNormals();return g;
  }
  function buildWatch(env){
    const g=new THREE.Group();
    const poly=new THREE.MeshStandardMaterial({color:0x17191C,roughness:.82,metalness:.08});
    const or=new THREE.MeshStandardMaterial({color:0xC98D6E,metalness:.95,roughness:.28,envMap:env,envMapIntensity:1.5});
    const body=new THREE.Mesh(new THREE.CylinderGeometry(2.46,2.5,.5,72),poly);body.rotation.x=Math.PI/2;body.position.z=-.25;g.add(body);
    const bp=[[1.98,-.02],[1.98,.07],[2.04,.13],[2.44,.13],[2.52,.05],[2.52,-.02]].map(([r,y])=>new THREE.Vector2(r,y));
    const bg=new THREE.LatheGeometry(bp,72);bg.rotateX(Math.PI/2);g.add(new THREE.Mesh(bg,or));
    const ring=new THREE.Mesh(new THREE.RingGeometry(2.05,2.43,72),new THREE.MeshStandardMaterial({map:bezelTex||null,color:bezelTex?0xffffff:0xC98D6E,metalness:.9,roughness:.4,envMap:env}));ring.position.z=.132;g.add(ring);
    const scr=new THREE.Mesh(new THREE.CircleGeometry(1.98,72),new THREE.MeshBasicMaterial({map:dialTex||null,color:dialTex?0xffffff:0x050607}));scr.position.z=.05;g.add(scr);
    const sm=new THREE.MeshStandardMaterial({color:0x15171A,roughness:.9});
    [1,-1].forEach(sg=>{
      const lug=new THREE.Mesh(new THREE.BoxGeometry(3.4,.9,.34),poly);lug.position.set(0,sg*2.6,-.28);g.add(lug);
      const b=new THREE.Mesh(new THREE.BoxGeometry(3.1,1.7,.26),sm);b.position.set(0,sg*3.45,-.3);g.add(b);
    });
    [300,270,240,60,120].forEach(c=>{const phi=(90-c)*Math.PI/180,cap=new THREE.Mesh(new THREE.CylinderGeometry(.17,.17,.26,14),poly);cap.rotation.z=phi-Math.PI/2;cap.position.set(Math.cos(phi)*2.68,Math.sin(phi)*2.68,-.1);g.add(cap)});
    return g;
  }
  function buildNotebook(){
    const g=new THREE.Group(),r0=sdRnd(11);
    const cover=tex(256,192,(x,w,h)=>{
      x.fillStyle='#5B3A22';x.fillRect(0,0,w,h);
      for(let i=0;i<3500;i++){x.fillStyle=r0()<.55?'rgba(25,12,4,'+(.12+r0()*.15)+')':'rgba(255,200,140,'+(.05+r0()*.08)+')';x.beginPath();x.arc(r0()*w,r0()*h,.5+r0()*1.4,0,6.283);x.fill()}
      const e=x.createLinearGradient(0,0,w,h);e.addColorStop(0,'rgba(255,210,150,.18)');e.addColorStop(.5,'rgba(0,0,0,0)');e.addColorStop(1,'rgba(0,0,0,.22)');x.fillStyle=e;x.fillRect(0,0,w,h);
      for(let i=0;i<14;i++){x.strokeStyle='rgba(222,190,150,'+(.1+r0()*.2)+')';x.lineWidth=1+r0()*2;x.beginPath();const px=r0()*w,py=r0()*h;x.moveTo(px,py);x.lineTo(px+20+r0()*50,py+(r0()-.5)*30);x.stroke()}
      x.setLineDash([7,5]);x.strokeStyle='rgba(232,216,184,.75)';x.lineWidth=1.6;x.strokeRect(12,12,w-24,h-24);x.setLineDash([]);
      x.textAlign='center';x.font='italic 400 30px "DM Serif Display", Georgia, serif';x.fillStyle='rgba(255,230,190,.35)';x.fillText('Carnet',w/2+1,h/2+13);x.fillStyle='rgba(28,14,5,.8)';x.fillText('Carnet',w/2,h/2+12);
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
    const enamel=new THREE.MeshStandardMaterial({color:0xEDE6D6,roughness:.35,metalness:.05,side:THREE.DoubleSide,envMap:env,envMapIntensity:.7});
    g.add(new THREE.Mesh(new THREE.LatheGeometry(pts,28),enamel));
    const rim=new THREE.Mesh(new THREE.TorusGeometry(.139,.008,8,28),new THREE.MeshStandardMaterial({color:0x2B4A6B,roughness:.4}));rim.rotation.x=Math.PI/2;rim.position.y=.182;g.add(rim);
    const h=new THREE.Mesh(new THREE.TorusGeometry(.06,.013,8,16,Math.PI),enamel);h.position.set(.14,.09,0);h.rotation.z=-Math.PI/2;g.add(h);
    const cof=new THREE.Mesh(new THREE.CircleGeometry(.118,24),new THREE.MeshStandardMaterial({color:0x2A1608,roughness:.15,metalness:.1,emissive:0x1A0C04,envMap:env}));cof.rotation.x=-Math.PI/2;cof.position.y=.158;g.add(cof);
    return g;
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
    acc.f+=dt*(70+130*st)*Math.max(.55,qm);acc.s+=dt*(4+30*st)*qm;acc.m+=dt*7*qm;acc.u+=dt*9*qm;
    while(acc.f>=1){acc.f--;emit(fSys,p=>{const a=Math.random()*6.283,r=Math.random()*.2;p.x=Math.cos(a)*r;p.z=Math.sin(a)*r;p.y=.14;p.vx=(Math.random()-.5)*.4+wind*.3;p.vy=(.9+Math.random()*.9)*(1+.5*st);p.vz=(Math.random()-.5)*.4;p.life=.6+Math.random()*.6;p.s0=(.45+Math.random()*.4)*(1+.35*st);p.id=Math.random()*50})}
    while(acc.s>=1){acc.s--;emit(sSys,p=>{p.x=(Math.random()-.5)*.3;p.z=(Math.random()-.5)*.3;p.y=.3;p.vx=(Math.random()-.5)*.6+wind*.7;p.vy=1.5+Math.random()*2.1+st;p.vz=(Math.random()-.5)*.6;p.life=2+Math.random()*1.6;p.s0=.03+Math.random()*.035;p.id=Math.random()*50})}
    while(acc.m>=1){acc.m--;emit(mSys,p=>{p.x=(Math.random()-.5)*.25;p.z=(Math.random()-.5)*.25;p.y=.9;p.vx=wind*.15;p.vy=.45+Math.random()*.3;p.vz=0;p.life=3+Math.random();p.s0=.3;p.grow=1}) }
    while(acc.u>=1){acc.u--;emit(mSys,p=>{p.x=MUG[0]+(Math.random()-.5)*.05;p.z=MUG[2]+(Math.random()-.5)*.05;p.y=MUG[1]+.17;p.vx=wind*.05;p.vy=.2+Math.random()*.12;p.vz=0;p.life=2+Math.random()*.8;p.s0=.09;p.grow=2.2})}
    step(fSys,dt,(p,d,a)=>{p.vx+=Math.sin(tNow*7+p.id)*d*1.2+wind*d*.3;p.x+=p.vx*d;p.y+=p.vy*d;p.z+=p.vz*d;p.vy*=1-d*.55;p.sz=p.s0*(1-a*.55)*(1+.15*Math.sin(tNow*19+p.id))});
    step(sSys,dt,(p,d,a)=>{p.vx+=wind*d*.9+Math.sin(tNow*3+p.id)*d*.5;p.vy-=d*.25;p.x+=p.vx*d;p.y+=p.vy*d;p.z+=p.vz*d;p.sz=p.s0*(.7+.6*Math.abs(Math.sin(tNow*11+p.id)))});
    step(mSys,dt,(p,d,a)=>{p.vx+=wind*d*.12+Math.sin(tNow*1.6+p.y*3)*d*.2;p.x+=p.vx*d;p.y+=p.vy*d;p.z+=p.vz*d;p.sz=p.s0*(1+a*p.grow*2.2)});
  }
  const MUG=[.86,.03,1.0];
  function init(){
    renderer=new THREE.WebGLRenderer({canvas:cv,antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,QDPR()));renderer.setClearColor(0x000000,0);
    scene=new THREE.Scene();cam=new THREE.PerspectiveCamera(40,1,.1,80);
    scene.add(new THREE.HemisphereLight(0x5A6B8C,0x1A1008,.45));
    light=new THREE.PointLight(0xFF8C3C,2.4,11,1.6);light.position.set(0,.65,0);scene.add(light);
    const fill=new THREE.PointLight(0xffb070,.5,14,2);fill.position.set(2,1.5,3);scene.add(fill);
    const env=(()=>{const mk=(a,b)=>{const c=document.createElement('canvas');c.width=c.height=32;const x=c.getContext('2d'),g=x.createLinearGradient(0,0,0,32);g.addColorStop(0,a);g.addColorStop(1,b);x.fillStyle=g;x.fillRect(0,0,32,32);return c};const t=new THREE.CubeTexture([mk('#6A3A1A','#0A0F18'),mk('#6A3A1A','#0A0F18'),mk('#2A3A5C','#0A0E18'),mk('#0A0806','#0A0F18'),mk('#8A4A20','#0A0F18'),mk('#1A2438','#0A0E18')]);t.needsUpdate=true;return t})();
    const ground=new THREE.Mesh(new THREE.CircleGeometry(16,48),new THREE.MeshStandardMaterial({map:mossTex(),bumpMap:mossTex(),bumpScale:1.2,roughness:1,metalness:0}));ground.rotation.x=-Math.PI/2;scene.add(ground);
    const rmat=new THREE.MeshStandardMaterial({map:rockTex(),roughness:.95,metalness:0,flatShading:true});
    for(let i=0;i<10;i++){const a=i/10*6.283+.2,r=.82+hash(i,3)*.12,rk=new THREE.Mesh(rockGeo(.2+hash(i,7)*.12,i*3.1),rmat);rk.position.set(Math.cos(a)*r,.08,Math.sin(a)*r);rk.rotation.y=i;scene.add(rk)}
    [[-2.6,-1.6,.8],[2.8,-2.2,1.1],[-4.2,-3,1.4],[4.4,-1,.9],[0.4,-3.6,1.2],[-1.2,-2.6,.6]].forEach(([x,z,r],i)=>{const rk=new THREE.Mesh(rockGeo(r,i*5.3+1),rmat);rk.position.set(x,r*.25,z);rk.rotation.y=i*1.3;scene.add(rk)});
    const slab=new THREE.Mesh(rockGeo(.55,77),rmat);slab.scale.set(1,.35,.8);slab.position.set(1.4,.06,.95);scene.add(slab);
    logMat=new THREE.MeshStandardMaterial({color:0x1A120D,roughness:1,emissive:0x5A1E06,emissiveIntensity:.8});
    for(let i=0;i<5;i++){const lg=new THREE.Mesh(new THREE.CylinderGeometry(.075,.09,1.05,10),logMat);lg.rotation.z=Math.PI/2+(i%2?.12:-.1);lg.rotation.y=i*1.26+.4;lg.position.set(0,.1+(i>2?.11:0),0);scene.add(lg)}
    const gr=document.createElement('canvas');gr.width=gr.height=128;{const x=gr.getContext('2d'),g=x.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(255,150,60,.95)');g.addColorStop(.5,'rgba(220,70,20,.5)');g.addColorStop(1,'rgba(120,20,0,0)');x.fillStyle=g;x.fillRect(0,0,128,128)}
    ember=new THREE.Mesh(new THREE.CircleGeometry(.6,32),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(gr),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));ember.rotation.x=-Math.PI/2;ember.position.y=.03;scene.add(ember);
    const wt=buildWatch(env);wt.scale.setScalar(.11);wt.rotation.set(-Math.PI/2,0,-.55);wt.position.set(1.4,.17,.95);scene.add(wt);
    const nb=buildNotebook();nb.position.set(-1.45,.05,.9);nb.rotation.y=.55;scene.add(nb);
    const ax=buildAxe(env);ax.rotation.set(0,.7,Math.PI/2-.18);ax.position.set(-.55,.14,-.75);scene.add(ax);
    const mg=buildMug(env);mg.position.set(MUG[0],MUG[1],MUG[2]);scene.add(mg);
    fSys=mkSys(240,FFS,THREE.AdditiveBlending);sSys=mkSys(120,SFS,THREE.AdditiveBlending);mSys=mkSys(110,MFS,THREE.NormalBlending);
    [mSys,fSys,sSys].forEach((q,i)=>{q.pts.renderOrder=3+i;scene.add(q.pts)});
    for(let i=0;i<100;i++)simulate(1/50);
    ok=true;
  }
  function ensure(){if(ok||failed)return;try{init();resize();setQuality(QC.tier)}catch(e){failed=true;ok=false}}
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
    logMat.emissiveIntensity=reduce?.8:.7+.3*Math.sin(t*9)+.5*stokeV;
    ember.material.opacity=reduce?.6:.55+.25*Math.sin(t*3)+.2*stokeV;
    if(d>0){simulate(d);if(!paused&&Math.random()<d*(2.5+14*stokeV))crackle(stokeV)}
    sky4.style.setProperty('--fire',(.5+(reduce?0:.12*Math.sin(t*23))+.25*stokeV).toFixed(3));
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
  const card=$(left?'#pAbout':'#pBlog'),open=()=>{busy=false;card.classList.remove('hot');left?openProfile():openCarnet()};
  if(reduce||staticMode){setTimeout(open,250);return}
  fly(left?'about':'blog',cx,cy-20*k,()=>{card.classList.add('hot');setTimeout(open,350)});
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
const dlgProfil=$('#dlgProfil'),dlgCarnet=$('#dlgCarnet');
const ARTICLES=[
  {t:'Retour du D+ : 34,4 km et 2 339 m de dénivelé',c:'course',cat:'Récit de course',d:'Notes de terrain sur une sortie aux Houches, du fond de la vallée à 2 521 m.'},
  {t:'Calculateur d\'allure trail : compter le D+ et le D−',c:'matos',cat:'Matériel et outils',d:'Pourquoi une allure à plat ne dit presque rien d\'une course en montagne.'},
  {t:'Making-of : construire L\'ascension',c:'coulisses',cat:'Coulisses',d:'De la boussole 3D au parcours des projets : les choix de conception.'},
  {t:'Un site 3D accessible : retour d\'expérience RGAA',c:'coulisses',cat:'Coulisses',d:'Pause, vue statique, clavier : garder le spectaculaire lisible pour tous.'}
];
const carList=$('#carList');
ARTICLES.forEach(a=>{const li=document.createElement('li');li.dataset.c=a.c;li.innerHTML=`<p class="cat">${a.cat}</p><h3>${a.t}</h3><p>${a.d}</p><span class="bd">Brouillon</span>`;carList.appendChild(li)});
$$('.sh-filters button').forEach(b=>b.addEventListener('click',()=>{
  $$('.sh-filters button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
  [...carList.children].forEach(li=>{li.hidden=b.dataset.f!=='all'&&li.dataset.c!==b.dataset.f});
}));
function openProfile(){root.style.overflow='hidden';dlgProfil.showModal()}
function openCarnet(){root.style.overflow='hidden';document.body.classList.add('horspiste');dlgCarnet.showModal()}
[dlgProfil,dlgCarnet].forEach(d=>{
  d.addEventListener('close',()=>{document.body.classList.remove('horspiste');root.style.overflow=(loaded||staticMode)?'':'hidden'});
  d.addEventListener('click',e=>{if(e.target===d)d.close()});
});
$('#proX').addEventListener('click',()=>dlgProfil.close());$('#proBack').addEventListener('click',()=>dlgProfil.close());
$('#carBack').addEventListener('click',()=>dlgCarnet.close());$('#carBack2').addEventListener('click',()=>dlgCarnet.close());
function zonePoint(e){const r=pc.getBoundingClientRect();if(SHOE.ready())return [e.clientX-r.left,e.clientY-r.top];return [clamp(e.clientX-r.left,PW/2-prx*.9,PW/2+prx*.9),clamp(e.clientY-r.top,gy-pry*.6,gy+pry*.6)]}
[['sideL','left','pAbout'],['sideR','right','pBlog']].forEach(([id,side,card])=>{
  const z=$('#'+id),c=$('#'+card);
  z.addEventListener('click',e=>{const [cx,cy]=zonePoint(e);stomp(side,cx,cy)});
  z.addEventListener('pointerenter',e=>{c.classList.add('hot');if(!paused&&!reduce){const [cx,cy]=zonePoint(e);ripAt(cx,cy,.3)}});
  z.addEventListener('pointerleave',()=>c.classList.remove('hot'));
});
$('#btnAbout').addEventListener('click',()=>stomp('left',PW/2-prx*.45,gy));
$('#btnBlog').addEventListener('click',()=>stomp('right',PW/2+prx*.45,gy));

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
const CONTACT={email:'',linkedin:'',rdv:''};   // à renseigner : adresse e-mail, profil LinkedIn, lien d'agenda
const cntStatus=$('#cntStatus');
$$('#bivtext .cnt').forEach(b=>b.addEventListener('click',()=>{
  const k=b.dataset.k,u=CONTACT[k];
  if(!u){cntStatus.textContent={email:'L\'adresse e-mail reste à renseigner.',linkedin:'Le lien LinkedIn reste à renseigner.',rdv:'Le lien de prise de rendez-vous reste à renseigner.'}[k];return}
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
const SNOW=Array.from({length:420},()=>({x:Math.random(),y:Math.random(),z:Math.pow(Math.random(),1.6),ph:Math.random()*6.283}));let snowT=0;
const FLAKE=(()=>{const c=document.createElement('canvas');c.width=c.height=48;const x=c.getContext('2d'),g=x.createRadialGradient(24,24,0,24,24,24);g.addColorStop(0,'rgba(230,244,241,1)');g.addColorStop(.35,'rgba(230,244,241,.55)');g.addColorStop(1,'rgba(230,244,241,0)');x.fillStyle=g;x.fillRect(0,0,48,48);return c})();
/* Transition de la plongée dans le verre : une tempête de neige (flocons poussés par le vent, rafales, voile blanc au plus fort) */
function drawSnowstorm(I0,W,H,q,t){
  const I=reduce?I0*.45:I0,n=Math.round(SNOW.length*[1,.62,.36][QC.tier]*(reduce?.5:1)),dt=snowT?Math.min(.05,Math.max(0,t-snowT)):0;if(t)snowT=t;
  const wind=-(.22+1.5*I),fall=.16+.5*I;
  // nappes de brume qui dérivent, de plus en plus blanches
  for(let k=0;k<3;k++){
    const fx=((t*.03*(1+k*.6)+k*.37)%1.4)-.2,fy=.25+k*.28+.05*Math.sin(t*.4+k),rr=Math.max(W,H)*(.55+.25*k),X=W*(1-fx),Y=H*fy;
    const g=wctx.createRadialGradient(X,Y,0,X,Y,rr);g.addColorStop(0,`rgba(214,232,236,${.34*I*I})`);g.addColorStop(1,'rgba(214,232,236,0)');wctx.fillStyle=g;wctx.fillRect(0,0,W,H);
  }
  wctx.fillStyle=`rgba(222,238,240,${.30*I*I*I})`;wctx.fillRect(0,0,W,H);   // voile blanc au plus fort de la tempête
  wctx.lineCap='round';
  for(let i=0;i<n;i++){
    const s=SNOW[i],sp=.35+.95*s.z,gust=1+.35*Math.sin(t*.8+s.x*5),vx=wind*sp*gust,vy=fall*sp;
    s.x+=vx*dt+Math.sin(t*2+s.ph)*.05*dt;s.y+=vy*dt;
    if(s.y>1.05){s.y=-.05;s.x=Math.random()}if(s.x<-.1){s.x=1.1;s.y=Math.random()}
    const X=s.x*W,Y=s.y*H,r=(1.3+3.4*s.z*s.z)*q*1.2*(1+.45*I),a=Math.min(1,(.22+.7*s.z)*(.25+1.5*I));
    if(s.z>.55&&I>.35){   // gros flocons filés par la vitesse, étirés dans le sens du vent
      const L=(5+22*I)*s.z*q,vl=Math.hypot(vx,vy)||1;
      wctx.strokeStyle=`rgba(230,244,241,${a*.4})`;wctx.lineWidth=Math.max(1.4,r*.8);wctx.beginPath();wctx.moveTo(X,Y);wctx.lineTo(X-vx/vl*L,Y-vy/vl*L);wctx.stroke();
    }
    wctx.globalAlpha=a;wctx.drawImage(FLAKE,X-r,Y-r,2*r,2*r);
  }
  wctx.globalAlpha=1;
}
function drawWarp(p){
  const wEnd=p>.9?sm(.92,.99,p):0,wSnow=p<.5?trap(p,.17,.235,.27,.32):0,w=Math.max(wEnd,wSnow);   // fin de boucle : étoiles ; plongée dans le verre : tempête de neige
  if(w<=.001){if(warpOn){wctx.clearRect(0,0,warpCv.width,warpCv.height);warpOn=false}return}
  warpOn=true;
  const W=warpCv.width,H=warpCv.height,q=W/innerWidth,cx=(LAY.cx||innerWidth/2)*q,cy=(LAY.cy||innerHeight/2)*q,R=Math.hypot(W,H)*.6,t=paused?0:tNow;
  wctx.clearRect(0,0,W,H);
  if(wSnow>.001){wctx.globalCompositeOperation='source-over';drawSnowstorm(wSnow,W,H,q,t)}
  if(wEnd<=.001)return;
  wctx.globalCompositeOperation='lighter';wctx.lineCap='round';
  WSTARS.forEach(s=>{
    const r=(s.r+t*.05*s.s*(1+wEnd*10))%1,d=r*r*R,len=(.02+.30*wEnd*s.s)*R*r;
    const x1=cx+Math.cos(s.a)*d,y1=cy+Math.sin(s.a)*d,dd=Math.max(0,d-len),x0=cx+Math.cos(s.a)*dd,y0=cy+Math.sin(s.a)*dd;
    wctx.strokeStyle=`rgba(${200+s.s*55|0},${215+s.s*40|0},255,${(.15+.75*wEnd)*Math.min(1,r*2)})`;wctx.lineWidth=(.6+1.8*s.s)*(1+wEnd);wctx.beginPath();wctx.moveTo(x0,y0);wctx.lineTo(x1,y1);wctx.stroke();
  });
  const bw=sm(.95,.985,p),fl=1-sm(.992,1,p);
  if(bw>0){
    const g=wctx.createLinearGradient(cx,0,cx,cy);g.addColorStop(0,'rgba(255,200,140,0)');g.addColorStop(1,`rgba(255,226,190,${.9*bw})`);
    wctx.strokeStyle=g;wctx.lineWidth=(3+26*bw)*q*1.4;wctx.beginPath();wctx.moveTo(cx,0);wctx.lineTo(cx,cy);wctx.stroke();
    const rg=wctx.createRadialGradient(cx,cy,0,cx,cy,(40+260*bw)*q);rg.addColorStop(0,`rgba(255,240,215,${.95*bw*fl})`);rg.addColorStop(1,'rgba(255,170,90,0)');wctx.fillStyle=rg;wctx.fillRect(0,0,W,H);
  }
  wctx.globalCompositeOperation='source-over';
}
function restartAdventure(){
  if(staticMode){lap++;setLap();scrollTo(0,0);return}
  restartBtn.blur();cinematicTo(1,2400,'in');
}
restartBtn.addEventListener('click',restartAdventure);

/* ---------- Boucle : rendu ---------- */
const NAMES=['Se repérer','S\'équiper','Monter','Persévérer','Se poser'];
let curName=-1;
function sceneIndex(p){return p<.07?0:p<.27?1:p<.53?2:p<.80?3:p<.95?4:0}
function setVisible(el,o){el.style.opacity=o;el.style.visibility=o<.01?'hidden':'visible'}
function hudFor(p){
  const alt=p<.28?2480:(p<.54&&parcAlt!=null)?parcAlt:p<.54?2480:p<.94?35:lerp(35,2480,sm(.94,1,p));
  altEl.textContent=Math.round(alt).toLocaleString('fr-FR');
}
function announce(i){
  if(i===curName)return;curName=i;
  modeEl.textContent=NAMES[i];
  live.textContent=`Scène ${i+1} sur 5 : ${NAMES[i]}`;
  $$('#railNav button').forEach((b,j)=>b.setAttribute('aria-current',j===i?'true':'false'));
}
function draw(p,dt){
  pal=palette(p);setVars(root,pal);updateBg(p);
  setVisible(S[0],Math.max(trap(p,-1,0,.24,.30),trap(p,.95,1,2,3)));
  setVisible(S[1],trap(p,.27,.32,.50,.54));
  setVisible(S[2],trap(p,.51,.55,.77,.81));
  setVisible(S[3],trap(p,.78,.82,.97,.985));
  // s1
  head1.style.opacity=Math.max(1-sm(.04,.08,p),sm(.96,1,p));
  head2.style.opacity=trap(p,.06,.10,.24,.28);
  chips.forEach((c,i)=>{
    const o=clamp((p-(.07+i*STEP))/.03)*(p<.24?1:1-sm(.24,.28,p));
    c.li.style.opacity=o;c.li.style.visibility=o<.04?'hidden':'visible';
    c.li.style.transform=isMobile()?`translateY(${(1-o)*10}px)`:`scale(${.92+.08*o})`;
    c.ln.style.strokeDashoffset=1-clamp((p-(.07+i*STEP))/.03);c.ln.style.opacity=o;
  });
  if(S[0].style.visibility==='visible'){updateCompass(p,dt);drawAurora(tNow+20)}
  // s2
  if(S[1].style.visibility==='visible'){PARC.ensure();PARC.update(clamp((p-.30)/.22),dt)}
  // s3
  if(S[2].style.visibility==='visible')drawPuddle(clamp((p-.55)/.24),dt);
  // s4
  if(S[3].style.visibility==='visible'){updateBivouac(p);CAMP.ensure();CAMP.update(clamp((p-.78)/.14),dt)}
  drawWarp(p);
  hudFor(p);
  announce(sceneIndex(p));
  const intro=p<.25;document.body.classList.toggle('intro',intro);skipBtn.style.opacity=intro?1:0;skipBtn.style.visibility=intro?'visible':'hidden';
  updateEscape(p);
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
function setLap(){$('#eyebrow1').textContent='Se repérer · '+(lap>1?'Jour '+lap:'Km 0')}
addEventListener('scroll',()=>{
  if(staticMode||!loaded)return;
  const y=scrollY,m=maxScroll();
  if(y>=m-2&&y>lastY){lap++;setLap();jumpTo(.0004);lastY=scrollY;return}
  lastY=y;
},{passive:true});
addEventListener('wheel',e=>{
  if(staticMode||!loaded)return;
  if(scrollY<=0&&e.deltaY<0){wheelAcc+=e.deltaY;if(wheelAcc<-140){wheelAcc=0;lap=Math.max(1,lap-1);setLap();jumpTo(.9996)}}else wheelAcc=0;
},{passive:true});
addEventListener('keydown',e=>{
  if(staticMode||!loaded)return;
  if(scrollY<=0&&(e.key==='ArrowUp'||e.key==='PageUp')&&!/INPUT|TEXTAREA|BUTTON/.test(document.activeElement.tagName)){lap=Math.max(1,lap-1);setLap();jumpTo(.9996)}
});
addEventListener('pointermove',e=>{mx=(e.clientX/innerWidth-.5)*2;my=(e.clientY/innerHeight-.5)*2},{passive:true});

/* ---------- Commandes ---------- */
$('#railNav').addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  if(staticMode){document.getElementById(b.dataset.s).scrollIntoView({behavior:'auto'});return}
  scrollTo({top:unwarp(parseFloat(b.dataset.p))*maxScroll(),behavior:reduce?'auto':'smooth'});
});
$('#brand').addEventListener('click',e=>{e.preventDefault();staticMode?scrollTo(0,0):jumpTo(.0004);$('#main').focus({preventScroll:true})});
$('#tgPause').addEventListener('click',e=>{paused=!paused;document.body.classList.toggle('paused',paused);e.currentTarget.setAttribute('aria-pressed',String(paused))});
$('#tgStatic').addEventListener('click',()=>setStatic(!staticMode));
$('#tgNight').addEventListener('click',e=>{
  theme=theme==='dark'?'light':'dark';root.dataset.theme=theme;if(strapApply)strapApply(theme==='dark');
  try{localStorage.setItem('asc-theme',theme)}catch(err){}
  e.currentTarget.setAttribute('aria-pressed',String(theme==='dark'));
  if(staticMode)drawStatic();
});
root.dataset.theme=theme;$('#tgNight').setAttribute('aria-pressed',String(theme==='dark'));
$('#tgStatic').setAttribute('aria-pressed',String(staticMode));
let rz;addEventListener('resize',()=>{clearTimeout(rz);rz=setTimeout(()=>{layoutTools();sizeThree();sizePuddle();if(staticMode)drawStatic()},80)});


/* ---------- Raccourci recruteur, pied de page, dialogues ---------- */
const skipBtn=$('#skipIntro'),dlg=$('#dlg');
skipBtn.addEventListener('click',()=>{
  finishLoad();
  if(staticMode){document.getElementById('s3').scrollIntoView({behavior:'auto'});return}
  root.style.overflow='';
  jumpTo(.67);
  live.textContent='Intro passée. À propos et carnet.';
  $('#main').focus({preventScroll:true});
});
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
    <h3>Crédits</h3><p>Les photos d'ambiance viennent d'Unsplash ; chaque crédit figure sur la fiche du projet concerné.</p>
    <h3>Données personnelles</h3><p class="todo">[finalités, durée de conservation et droits d'accès pour le formulaire de contact : à rédiger]</p>`},
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

/* Ligne du jour : heure en Haute-Savoie et soleil (calcul astronomique, sans réseau) */
function sunMinutes(d,lat,lon){
  const R=Math.PI/180,day=Math.floor((d-Date.UTC(d.getUTCFullYear(),0,0))/864e5);
  const g=2*Math.PI/365*(day-1+(d.getUTCHours()-12)/24);
  const eq=229.18*(.000075+.001868*Math.cos(g)-.032077*Math.sin(g)-.014615*Math.cos(2*g)-.040849*Math.sin(2*g));
  const dec=.006918-.399912*Math.cos(g)+.070257*Math.sin(g)-.006758*Math.cos(2*g)+.000907*Math.sin(2*g)-.002697*Math.cos(3*g)+.00148*Math.sin(3*g);
  const c=Math.cos(90.833*R)/(Math.cos(lat*R)*Math.cos(dec))-Math.tan(lat*R)*Math.tan(dec);
  const ha=Math.acos(clamp(c,-1,1))/R;
  return {rise:720-4*(lon+ha)-eq,set:720-4*(lon-ha)-eq};
}
function updateLive(){
  const now=new Date(),z={timeZone:'Europe/Paris',hour:'2-digit',minute:'2-digit'};
  const {rise,set}=sunMinutes(now,45.98,6.63);
  const day0=Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate());
  const at=m=>new Date(day0+m*60000).toLocaleTimeString('fr-FR',z);
  const nm=now.getUTCHours()*60+now.getUTCMinutes();
  const mom=Math.abs(nm-rise)<50?'Aube':nm>rise&&nm<set-90?'Plein jour':nm>=set-90&&nm<set+25?'Heure dorée':'Nuit';
  $('#live2').innerHTML=`Haute-Savoie · ${now.toLocaleTimeString('fr-FR',z)} · ${mom}<span class="sun"> · soleil ${at(rise)} → ${at(set)}</span>`;
}
updateLive();__ivs.push(setInterval(updateLive,30000));

/* ---------- Grands mots, altimètre latéral, son ---------- */
const bigWords=$$('.bigword'),railDot=$('#railDot');
const crew=$('#crew'),crewW=[...crew.querySelectorAll('.w')];let crewTotal=0,crewC=[];
function measureCrew(){crewTotal=crew.scrollWidth;crewC=crewW.map(w=>w.offsetLeft+w.offsetWidth/2)}
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(measureCrew);
addEventListener('resize',()=>{crewTotal=0});
const HW=[$('#h1'),$('#head2 h2'),$('#h-map'),$('#h-flaque'),$('#h-biv')];
function updateExtras(p,pr){
  const skew=(reduce||paused)?0:clamp((pr-p)*500,-8,8);
  const L=[p>.5?0:clamp(p/.27),clamp((p-.27)/.27),clamp((p-.51)/.30),clamp((p-.78)/.19)];
  bigWords.forEach((w,i)=>{if(i>0)w.style.transform=`translate3d(${lerp(8,-46,L[i]).toFixed(2)}vw,-50%,0) skewX(${skew.toFixed(2)}deg)`});
  /* Qualités : le ruban entre par la droite, sort par la gauche ; le mot proche du centre s'affirme */
  if(!crewTotal)measureCrew();
  const vw=innerWidth,tx=lerp(vw*.22,-(crewTotal+vw*.05),L[0]);
  crew.style.transform=`translate3d(${tx.toFixed(1)}px,-50%,0) skewX(${skew.toFixed(2)}deg)`;
  crewW.forEach((w,k)=>{const dd=(tx+crewC[k]-vw*.5)/(vw*.45);w.style.opacity=(.035+.11*Math.exp(-dd*dd*2)).toFixed(3)});
  railDot.style.top=(p*100).toFixed(2)+'%';
  if(!reduce){
    const W=[[HW[0],p<.5?lerp(800,350,sm(0,.05,p)):lerp(350,800,sm(.95,1,p))],[HW[1],lerp(800,350,sm(.06,.14,p))],[HW[2],lerp(800,350,sm(.27,.36,p))],[HW[3],lerp(800,350,sm(.51,.6,p))],[HW[4],lerp(800,350,sm(.79,.86,p))]];
    W.forEach(([el,w])=>{el.style.fontVariationSettings=`'wght' ${Math.round(w)}`});
    bigWords.forEach((w,i)=>{if(i>0)w.style.fontVariationSettings=`'wght' ${Math.round(lerp(200,900,L[i]))}`});
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
  stack:{t:'Compétences',d:'Vue 3, TypeScript, accessibilité RGAA.',b:0,p:[0,.62],r:.34},
  exp:{t:'Expérience',d:'17 ans dans le sport, puis le code.',b:180,p:[0,-.95],r:.34}
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
  const w=cv.clientWidth,h=cv.clientHeight,vis1=loaded?(p<.5?1-sm(.2,.24,p):sm(.98,1,p)):0;
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
function swoosh(){   // bourrasque : vent grave qui enfle puis retombe, avec des rafales
  if(!soundOn||!actx||!whiteBuf)return;
  const t=actx.currentTime,src=actx.createBufferSource();src.buffer=whiteBuf;src.loop=true;
  const bp=actx.createBiquadFilter();bp.type='bandpass';bp.Q.value=.7;bp.frequency.setValueAtTime(260,t);bp.frequency.linearRampToValueAtTime(900,t+1.0);bp.frequency.linearRampToValueAtTime(380,t+2.3);
  const g=actx.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.26,t+.9);g.gain.linearRampToValueAtTime(.12,t+1.4);g.gain.linearRampToValueAtTime(.2,t+1.7);g.gain.linearRampToValueAtTime(0,t+2.4);
  src.connect(bp);bp.connect(g);g.connect(actx.destination);src.start(t);src.stop(t+2.5);
}
function crackle(v){
  if(!soundOn||!actx||!whiteBuf)return;
  const t=actx.currentTime,src=actx.createBufferSource();src.buffer=whiteBuf;
  const bp=actx.createBiquadFilter();bp.type='bandpass';bp.frequency.value=1500+Math.random()*3800;bp.Q.value=1.1;
  const g=actx.createGain(),pk=.03+.12*(v||0)*Math.random()+.03*Math.random(),dur=.012+Math.random()*.03;
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(pk,t+.003);g.gain.exponentialRampToValueAtTime(.0005,t+dur);
  src.connect(bp);bp.connect(g);g.connect(actx.destination);src.start(t,Math.random(),dur+.02);
}
const escLine=$('#escLine'),escGlow=$('#escGlow'),escHead=$('#escHead'),cpf=$('#cpf'),escSvg=$('#escape');let ESC_LEN=1;
function layoutEscape(W,H,cx,cy,mob){
  const x1=cx+W*.05,y1=H*(mob?.86:.9),dy=y1-cy;
  const d=`M${cx.toFixed(1)} ${cy.toFixed(1)} C ${(cx+W*.05).toFixed(1)} ${(cy+dy*.25).toFixed(1)}, ${(cx-W*.06).toFixed(1)} ${(cy+dy*.5).toFixed(1)}, ${(cx+W*.02).toFixed(1)} ${(cy+dy*.68).toFixed(1)} S ${(x1+W*.03).toFixed(1)} ${(y1-dy*.1).toFixed(1)}, ${x1.toFixed(1)} ${y1.toFixed(1)}`;
  escSvg.setAttribute('viewBox',`0 0 ${W} ${H}`);escLine.setAttribute('d',d);escGlow.setAttribute('d',d);
  ESC_LEN=escLine.getTotalLength()||1;escLine.style.strokeDasharray=escGlow.style.strokeDasharray=ESC_LEN;
  cpf.style.left=x1+'px';cpf.style.top=y1+'px';
}
function updateEscape(p){
  const dr=p<.5?sm(.16,.27,p):0;
  const off=(ESC_LEN*(1-dr)).toFixed(1);escLine.style.strokeDashoffset=off;escGlow.style.strokeDashoffset=off;
  const q=escLine.getPointAtLength(ESC_LEN*dr);escHead.setAttribute('cx',q.x.toFixed(1));escHead.setAttribute('cy',q.y.toFixed(1));
  escHead.style.opacity=dr>.02&&dr<.999?1:0;cpf.style.opacity=dr>.95?1:0;
}
const cta=$('#cta');let cine=null;
function cinematicTo(pt,dur0,mode){
  const m=maxScroll(),y0=scrollY,y1=unwarp(pt)*m;
  if(reduce){scrollTo(0,y1);return}
  if(cine)cancelAnimationFrame(cine);
  const dur=dur0||2800,t0=performance.now();
  const step=now=>{const k=clamp((now-t0)/dur),e=mode==='in'?k*k*k:(k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2);scrollTo(0,y0+(y1-y0)*e);cine=k<1?requestAnimationFrame(step):null};
  cine=requestAnimationFrame(step);
}
const stopCine=()=>{if(cine){cancelAnimationFrame(cine);cine=null}};
addEventListener('wheel',stopCine,{passive:true});addEventListener('touchstart',stopCine,{passive:true});
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
  if(e.key==='Escape'&&!document.querySelector('dialog[open]')){tourEnd(false);return}
  if(['ArrowUp','ArrowDown','PageUp','PageDown','Home','End'].includes(e.key)&&!/INPUT|TEXTAREA|SELECT/.test(tg))tourEnd(false);
});
// une fenêtre ouverte (profil, carnet, réglages…) met le parcours en attente ; il reprend à sa fermeture
if(window.HTMLDialogElement){const sm0=HTMLDialogElement.prototype.showModal;HTMLDialogElement.prototype.showModal=function(){TOUR.hold++;this.addEventListener('close',()=>{TOUR.hold=Math.max(0,TOUR.hold-1)},{once:true});return sm0.call(this)}}
cta.addEventListener('click',()=>{if(!loaded)return;if(staticMode){document.getElementById('s2').scrollIntoView({behavior:'auto'});return}startTour()});

let parcAlt=null;
const PARC=(()=>{
const DATA=[[45.8925,6.8002,1006],[45.8929,6.7995,995],[45.8937,6.7992,987],[45.8941,6.7982,985],[45.8949,6.7986,996],[45.8958,6.7986,1015],[45.8968,6.7989,1038],[45.8972,6.7988,1061],[45.8964,6.7979,1071],[45.8959,6.7968,1089],[45.896,6.7961,1109],[45.8959,6.7949,1122],[45.8965,6.7937,1133],[45.897,6.7925,1142],[45.8975,6.7913,1147],[45.8979,6.7901,1157],[45.8986,6.7891,1167],[45.8997,6.789,1178],[45.9002,6.7901,1190],[45.9004,6.7915,1197],[45.9009,6.7927,1203],[45.9009,6.7927,1216],[45.9009,6.7913,1230],[45.9012,6.7906,1247],[45.9016,6.7893,1267],[45.9021,6.7882,1279],[45.9025,6.7878,1293],[45.9032,6.7868,1310],[45.9041,6.787,1314],[45.9044,6.7883,1315],[45.9047,6.7895,1314],[45.9051,6.7901,1332],[45.9057,6.7911,1347],[45.9065,6.7903,1359],[45.9071,6.79,1377],[45.9079,6.7895,1415],[45.9085,6.7908,1433],[45.9094,6.791,1450],[45.9101,6.79,1467],[45.911,6.7894,1482],[45.912,6.7888,1495],[45.9128,6.7894,1511],[45.9137,6.7892,1535],[45.9147,6.7891,1548],[45.9156,6.7895,1564],[45.9166,6.7894,1573],[45.9177,6.7892,1581],[45.9186,6.7887,1600],[45.9196,6.7883,1617],[45.9206,6.7879,1632],[45.9216,6.7879,1647],[45.9226,6.7876,1666],[45.9236,6.7875,1689],[45.9246,6.7877,1707],[45.924,6.7886,1729],[45.9239,6.7894,1759],[45.9233,6.7905,1783],[45.9232,6.791,1805],[45.9233,6.7916,1830],[45.9234,6.7921,1854],[45.9227,6.7923,1884],[45.9221,6.7933,1907],[45.9225,6.7934,1934],[45.9225,6.7943,1956],[45.9222,6.7955,1975],[45.9219,6.7965,1994],[45.9219,6.7975,2029],[45.9217,6.7985,2060],[45.9213,6.7997,2091],[45.921,6.8007,2129],[45.9206,6.802,2170],[45.9203,6.8029,2211],[45.9201,6.8036,2225],[45.9207,6.8045,2219],[45.9199,6.8045,2179],[45.919,6.8049,2151],[45.9185,6.8061,2128],[45.9178,6.8072,2105],[45.9174,6.8085,2091],[45.9168,6.8097,2076],[45.916,6.8104,2043],[45.9153,6.8114,2015],[45.9148,6.8127,1997],[45.9146,6.814,1978],[45.9141,6.8128,1956],[45.914,6.8113,1938],[45.9137,6.81,1920],[45.9135,6.8086,1915],[45.9133,6.8071,1905],[45.9133,6.8057,1883],[45.9135,6.8042,1866],[45.9136,6.8028,1842],[45.9129,6.8032,1821],[45.9123,6.8043,1800],[45.9118,6.8054,1785],[45.9112,6.8067,1778],[45.9106,6.808,1779],[45.9103,6.8093,1766],[45.9104,6.8107,1742],[45.9101,6.812,1710],[45.9098,6.8134,1671],[45.9095,6.8147,1639],[45.9091,6.8161,1613],[45.9094,6.817,1631],[45.9099,6.8182,1647],[45.9104,6.8193,1652],[45.9109,6.8206,1661],[45.9118,6.8209,1660],[45.9124,6.8211,1681],[45.9124,6.8221,1703],[45.9127,6.8232,1724],[45.9132,6.8245,1742],[45.9141,6.8251,1768],[45.9149,6.8257,1797],[45.9156,6.8266,1825],[45.9162,6.8274,1853],[45.9165,6.8277,1884],[45.9171,6.8274,1915],[45.9179,6.8273,1928],[45.9189,6.8272,1947],[45.9197,6.8273,1965],[45.9201,6.8272,2001],[45.9204,6.8269,2031],[45.9211,6.8273,2056],[45.9216,6.8279,2087],[45.9222,6.8281,2131],[45.9222,6.8291,2160],[45.9226,6.8294,2175],[45.9233,6.8289,2193],[45.9239,6.8284,2210],[45.924,6.8291,2226],[45.9244,6.8292,2243],[45.9252,6.8297,2263],[45.925,6.8295,2256],[45.925,6.8305,2268],[45.9253,6.8317,2273],[45.9258,6.8329,2270],[45.9265,6.8334,2285],[45.9272,6.8334,2285],[45.9282,6.8338,2282],[45.9291,6.8345,2293],[45.9299,6.8344,2317],[45.9306,6.835,2331],[45.9316,6.835,2348],[45.9322,6.8351,2371],[45.9316,6.8361,2388],[45.9318,6.8364,2407],[45.9323,6.8367,2428],[45.933,6.8365,2455],[45.9336,6.8366,2477],[45.9337,6.8372,2499],[45.9338,6.8377,2521],[45.9341,6.8374,2501],[45.9345,6.8371,2480],[45.9354,6.8376,2461],[45.9363,6.8376,2444],[45.9366,6.8384,2427],[45.9355,6.8385,2410],[45.9353,6.8392,2385],[45.9356,6.8401,2358],[45.9349,6.8406,2335],[45.9359,6.841,2314],[45.9369,6.841,2296],[45.9378,6.8416,2277],[45.9371,6.8419,2247],[45.9374,6.8427,2224],[45.9375,6.8432,2205],[45.9375,6.8437,2184],[45.9378,6.8446,2163],[45.9376,6.8457,2144],[45.9373,6.8469,2119],[45.9378,6.8481,2100],[45.9379,6.8493,2071],[45.9375,6.8505,2054],[45.9367,6.851,2036],[45.9366,6.8502,2017],[45.9364,6.8497,1990],[45.9361,6.8495,1962],[45.936,6.8492,1937],[45.9356,6.8488,1908],[45.9353,6.8491,1887],[45.9351,6.849,1864],[45.9345,6.8499,1848],[45.9344,6.8493,1823],[45.934,6.849,1798],[45.9336,6.8489,1777],[45.9329,6.848,1762],[45.9319,6.8478,1741],[45.9326,6.8487,1714],[45.9318,6.8488,1691],[45.9313,6.8489,1668],[45.9315,6.8498,1643],[45.9309,6.8497,1619],[45.9312,6.851,1602],[45.931,6.8524,1590],[45.9306,6.8536,1581],[45.9303,6.8549,1564],[45.93,6.8558,1548],[45.93,6.8572,1526],[45.9295,6.8567,1494],[45.9289,6.8564,1468],[45.9284,6.8559,1444],[45.9287,6.8569,1430],[45.9279,6.8568,1403],[45.9279,6.8575,1378],[45.9274,6.8572,1353],[45.9271,6.8573,1334],[45.9275,6.8585,1316],[45.9269,6.858,1303],[45.9264,6.8579,1287],[45.927,6.859,1272],[45.9264,6.8586,1256],[45.9257,6.8577,1239],[45.9255,6.8587,1221],[45.9255,6.8591,1203],[45.9261,6.8601,1186],[45.9258,6.8605,1166],[45.9254,6.8611,1146],[45.9252,6.8624,1126],[45.9246,6.8633,1107],[45.9239,6.8641,1092],[45.9237,6.8656,1075],[45.9235,6.867,1061],[45.9242,6.8679,1056],[45.924,6.8693,1048],[45.9227,6.8692,1049],[45.922,6.8682,1050],[45.9211,6.8675,1050],[45.9203,6.8667,1050],[45.9195,6.8659,1050],[45.9189,6.8646,1050],[45.9184,6.8633,1050],[45.9181,6.8619,1051],[45.9179,6.8605,1055],[45.9177,6.8591,1055],[45.9174,6.8576,1055],[45.9172,6.8561,1054],[45.917,6.8548,1052],[45.9166,6.8532,1047],[45.9164,6.852,1041],[45.9161,6.8505,1032],[45.9156,6.8493,1028],[45.915,6.8482,1029],[45.9146,6.8469,1028],[45.9136,6.8461,1032],[45.9126,6.8458,1030],[45.9117,6.8453,1029],[45.9109,6.8443,1033],[45.9102,6.8433,1036],[45.9095,6.8423,1032],[45.909,6.841,1033],[45.9087,6.8397,1031],[45.9081,6.8384,1026],[45.9076,6.8372,1017],[45.9074,6.8359,1018],[45.9066,6.8349,1018],[45.9063,6.8336,1029],[45.9055,6.8328,1018],[45.9049,6.8316,1026],[45.9043,6.8305,1018],[45.9034,6.8295,1016],[45.9026,6.8287,1009],[45.9025,6.8273,1007],[45.9016,6.8267,1006],[45.9012,6.8253,1005],[45.9009,6.824,1005],[45.9007,6.8226,1005],[45.9005,6.8212,1004],[45.9007,6.8198,1023],[45.9008,6.8185,1036],[45.9012,6.8171,1038],[45.9016,6.8159,1039],[45.9017,6.8144,1040],[45.9016,6.8129,1043],[45.9015,6.8114,1044],[45.9012,6.81,1034],[45.9009,6.8087,1024],[45.9004,6.8074,1012],[45.8999,6.8061,1006],[45.8993,6.805,1003],[45.8986,6.8039,1005],[45.8979,6.8028,1008],[45.8975,6.8015,1010],[45.8971,6.8004,1008],[45.8962,6.7997,1003],[45.8953,6.7992,997],[45.8943,6.7987,992],[45.8939,6.7986,986],[45.8933,6.7998,995],[45.8926,6.7997,1007]];
const cv=$('#parcCanvas');

/* ---------- Projets : à remplacer par la liste de /projects (un seul endroit à modifier) ---------- */
const PROJECTS=[
  {id:'c2s',title:'Click2SellSite',place:'Lyon',stage:'Étape 02',tags:['Vue 3','TypeScript','SCSS','Vitest','RGAA'],result:'7 langues d\'accessibilité',mat:'stone',t:.10},
  {id:'dgfip',title:'DGFiP',place:'Paris',stage:'Étape 01',tags:['Vue.js','API REST'],result:'−50 % de temps de traitement',mat:'metal',t:.24},
  {id:'runfit',title:'RunFit Advisor',place:'Projet perso',stage:'Sentier',tags:['Supabase','Recommandation'],result:'Chaussures de trail',mat:'leather',t:.38},
  {id:'coach',title:'CoachFlow',place:'Projet perso',stage:'Sentier',tags:['LMS','Formation'],result:'Coaching et formation',mat:'stone',t:.66},
  {id:'jsa',title:'Job Search Automator',place:'Projet perso',stage:'Sentier',tags:['Make.com','Claude API','Airtable','Playwright'],result:'Pipeline de candidature',mat:'metal',t:.80},
  {id:'asc',title:'L\'ascension',place:'Ce site',stage:'Sommet',tags:['Nuxt','Three.js','RGAA'],result:'Le site que vous parcourez',mat:'leather',t:.92}
];
const OFFICIAL={km:34.4,gain:2339};

/* ---------- Trace et relief : position locale (1 unité = 10 m), altitudes exagérées de 50 % ---------- */
const SC=.1,EX=1.5;
const lat0=DATA.reduce((a,p)=>a+p[0],0)/DATA.length,lon0=DATA.reduce((a,p)=>a+p[1],0)/DATA.length;
const kx=111320*Math.cos(lat0*Math.PI/180)*SC,kz=110540*SC;
const P=DATA.map(([la,lo,al])=>({x:(lo-lon0)*kx,z:-(la-lat0)*kz,y:al*SC*EX,alt:al}));
let gainTot=0;const gainCum=[0];for(let i=1;i<P.length;i++){gainTot+=Math.max(0,P[i].alt-P[i-1].alt);gainCum.push(gainTot)}
const gscale=OFFICIAL.gain/gainTot;
const xs=P.map(p=>p.x),zs=P.map(p=>p.z),pad=170;
const bx0=Math.min(...xs)-pad,bx1=Math.max(...xs)+pad,bz0=Math.min(...zs)-pad,bz1=Math.max(...zs)+pad;
const cell=7,NX=Math.ceil((bx1-bx0)/cell),NZ=Math.ceil((bz1-bz0)/cell);
const hash=(x,y)=>{const s=Math.sin(x*127.1+y*311.7)*43758.5453;return s-Math.floor(s)};
const vnoise=(x,y)=>{const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy);return lerp(lerp(hash(ix,iy),hash(ix+1,iy),u),lerp(hash(ix,iy+1),hash(ix+1,iy+1),u),v)};
const fbm=(x,y)=>{let a=.5,f=1,s=0;for(let o=0;o<5;o++){s+=a*vnoise(x*f,y*f);a*=.5;f*=2.03}return s};
const H=new Float32Array((NX+1)*(NZ+1));
for(let j=0;j<=NZ;j++)for(let i=0;i<=NX;i++){
  const x=bx0+i*cell,z=bz0+j*cell;let sw=0,sy=0,dmin=1e9;
  for(const p of P){const d=Math.hypot(p.x-x,p.z-z);if(d<dmin)dmin=d;const w=1/(d*d*d+40);sw+=w;sy+=w*p.y}
  const amp=lerp(1,58,sm(6,150,dmin));
  H[j*(NX+1)+i]=sy/sw+(fbm(x*.011,z*.011)-.5)*amp*1.6+(fbm(x*.04,z*.04)-.5)*amp*.35;
}
function terrainAt(x,z){
  const fx=clamp((x-bx0)/cell,0,NX-.001),fz=clamp((z-bz0)/cell,0,NZ-.001),i=Math.floor(fx),j=Math.floor(fz),u=fx-i,v=fz-j,W=NX+1;
  return lerp(lerp(H[j*W+i],H[j*W+i+1],u),lerp(H[(j+1)*W+i],H[(j+1)*W+i+1],u),v);
}
let hmin=1e9,hmax=-1e9;for(const h of H){if(h<hmin)hmin=h;if(h>hmax)hmax=h}

/* ---------- Arrêts : départ, un par projet, bivouac ---------- */
const STOPS=[{t:0,name:'Départ',ttl:'Km 0 · Départ'}].concat(PROJECTS.slice().sort((a,b)=>a.t-b.t).map((p,i)=>({t:p.t,proj:p,name:p.title,ttl:p.stage+' · '+p.place})));
const PC0=.30,PCW=.22;
const NS=STOPS.length,DW=.042,TRAV=(1-NS*DW)/(NS-1);
STOPS.forEach((s,i)=>{s.a=i*(DW+TRAV);s.b=s.a+DW});
function param(p){
  for(let i=0;i<NS;i++){
    const s=STOPS[i];
    if(p<=s.b)return p>=s.a?s.t:(i===0?0:lerp(STOPS[i-1].t,s.t,(p-STOPS[i-1].b)/(s.a-STOPS[i-1].b)));
  }
  return 1;
}
function stopWeight(i,p){const s=STOPS[i];return Math.min(sm(s.a-.05,s.a,p),1-sm(s.b,s.b+.05,p))}

/* ---------- Scène ---------- */
const OK=THREE_OK;
let renderer,scene,cam,curve,tube,tubeSeg=700,ball,halo,mat,beam,ray;
const camPos=OK?new THREE.Vector3():{},camTgt=OK?new THREE.Vector3():{};
const blocks=[];   // {holder,mesh,shadow,pole,proj,base,lift,stopIdx,tex,canvas}
function paintBlock(b){
  const c=b.canvas,x=c.getContext('2d'),W=c.width,Hh=c.height,pr=b.proj;
  let seed=b.proj.title.length*13+7;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647};
  if(pr.mat==='stone'){
    const g=x.createLinearGradient(0,0,W,Hh);g.addColorStop(0,'#9A9388');g.addColorStop(1,'#6F695F');x.fillStyle=g;x.fillRect(0,0,W,Hh);
    for(let i=0;i<5000;i++){x.fillStyle=rnd()<.5?'rgba(255,255,255,'+(.03+rnd()*.05)+')':'rgba(30,26,20,'+(.04+rnd()*.07)+')';x.fillRect(rnd()*W,rnd()*Hh,1+rnd()*2,1+rnd()*2)}
    x.lineWidth=1.3;for(let i=0;i<9;i++){x.strokeStyle='rgba(235,228,215,'+(.12+rnd()*.12)+')';x.beginPath();let px=rnd()*W,py=rnd()*Hh;x.moveTo(px,py);for(let k=0;k<7;k++){px+=30+rnd()*50;py+=(rnd()-.5)*60;x.lineTo(px,py)}x.stroke()}
    const gl=x.createLinearGradient(0,0,W,Hh*.6);gl.addColorStop(0,'rgba(255,255,255,.22)');gl.addColorStop(.35,'rgba(255,255,255,0)');x.fillStyle=gl;x.fillRect(0,0,W,Hh);
  }else if(pr.mat==='metal'){
    const g=x.createLinearGradient(0,0,W,0);g.addColorStop(0,'#8E949A');g.addColorStop(.5,'#B7BCC1');g.addColorStop(1,'#8B9096');x.fillStyle=g;x.fillRect(0,0,W,Hh);
    for(let i=0;i<1400;i++){const y=rnd()*Hh,px=rnd()*W,l=40+rnd()*260;x.strokeStyle=(rnd()<.5?'rgba(255,255,255,':'rgba(0,0,0,')+(.04+rnd()*.08)+')';x.lineWidth=.6+rnd()*1.1;x.beginPath();x.moveTo(px,y);x.lineTo(px+l,y+(rnd()-.5));x.stroke()}
    x.strokeStyle='rgba(0,0,0,.35)';x.lineWidth=3;x.strokeRect(14,14,W-28,Hh-28);x.strokeStyle='rgba(255,255,255,.25)';x.lineWidth=1.5;x.strokeRect(17,17,W-34,Hh-34);
    [[26,26],[W-26,26],[26,Hh-26],[W-26,Hh-26]].forEach(([sx,sy])=>{x.fillStyle='#5E6368';x.beginPath();x.arc(sx,sy,7,0,6.283);x.fill();x.strokeStyle='rgba(255,255,255,.4)';x.lineWidth=1.5;x.beginPath();x.arc(sx,sy,7,0,6.283);x.stroke()});
  }else{
    x.fillStyle='#7A4A2B';x.fillRect(0,0,W,Hh);
    const g=x.createLinearGradient(0,0,0,Hh);g.addColorStop(0,'rgba(255,190,130,.10)');g.addColorStop(1,'rgba(0,0,0,.25)');x.fillStyle=g;x.fillRect(0,0,W,Hh);
    for(let i=0;i<8000;i++){x.fillStyle=rnd()<.6?'rgba(30,14,5,'+(.10+rnd()*.15)+')':'rgba(255,205,150,'+(.04+rnd()*.06)+')';x.beginPath();x.arc(rnd()*W,rnd()*Hh,.5+rnd()*1.4,0,6.283);x.fill()}
    x.setLineDash([16,11]);x.lineWidth=3;x.strokeStyle='rgba(20,8,2,.6)';x.strokeRect(25,25,W-50,Hh-50);x.strokeStyle='#E8D8B8';x.strokeRect(23.5,23.5,W-50,Hh-50);x.setLineDash([]);
  }
  // gravure du titre : ombre en creux et reflet
  const dark=pr.mat==='metal'?'rgba(0,0,0,.55)':'rgba(15,8,3,.72)',light='rgba(255,255,255,.38)';
  x.textAlign='center';x.textBaseline='alphabetic';
  x.font='italic 400 56px "DM Serif Display", Georgia, serif';
  let size=56;while(x.measureText(pr.title).width>W-90&&size>26){size-=3;x.font='italic 400 '+size+'px "DM Serif Display", Georgia, serif'}
  x.fillStyle=light;x.fillText(pr.title,W/2+1.5,Hh/2+1.5);x.fillStyle=dark;x.fillText(pr.title,W/2-.5,Hh/2-.5);
  x.font='500 22px "JetBrains Mono", monospace';x.fillStyle=pr.mat==='leather'?'rgba(245,230,205,.85)':'rgba(20,18,14,.75)';
  x.fillText((pr.stage+' · '+pr.place).toUpperCase(),W/2,Hh/2-size-6);
  x.fillText(pr.result,W/2,Hh/2+54);
  b.tex.needsUpdate=true;
}
function makeEnvP(){
  const mk=(a,c,boxes)=>{const k=document.createElement('canvas');k.width=k.height=64;const x=k.getContext('2d'),g=x.createLinearGradient(0,0,0,64);g.addColorStop(0,a);g.addColorStop(1,c);x.fillStyle=g;x.fillRect(0,0,64,64);(boxes||[]).forEach(([bx,by,bw,bh,col])=>{x.fillStyle=col;x.fillRect(bx,by,bw,bh)});return k};
  const t=new THREE.CubeTexture([mk('#3A2A20','#0A0C10',[[26,0,8,64,'rgba(255,200,150,.8)']]),mk('#1E2A3C','#080A0E',[[15,0,6,64,'rgba(150,190,255,.7)']]),mk('#E8EEF4','#2A3038',[[10,12,44,14,'rgba(255,255,255,.95)']]),mk('#050607','#080A0C'),mk('#D8DEE4','#2A2E34',[[8,7,48,10,'rgba(255,255,255,.85)']]),mk('#10151C','#05070A')]);
  t.needsUpdate=true;return t;
}
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
    uniforms:{cLo:{value:new THREE.Vector3(.78,.44,.18)},cHi:{value:new THREE.Vector3(1,.70,.42)},cGrid:{value:new THREE.Vector3(.35,.55,.75)},cstep:{value:20*SC*EX},uMin:{value:hmin},uMax:{value:hmax},uGlow:{value:1},uC:{value:new THREE.Vector2((bx0+bx1)/2,(bz0+bz1)/2)},uR0:{value:320},uR1:{value:520}},
    vertexShader:'varying float vH;varying vec3 vW;varying vec3 vView;void main(){vH=position.y;vW=position;vec4 mv=modelViewMatrix*vec4(position,1.);vView=mv.xyz;gl_Position=projectionMatrix*mv;}',
    fragmentShader:`precision highp float;
      uniform vec3 cLo,cHi,cGrid;uniform float cstep,uMin,uMax,uGlow,uR0,uR1;uniform vec2 uC;
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
        float a=clamp(line*.55+master*.85+grid*.13,0.,1.)*edge*depthFade;
        gl_FragColor=vec4(col,a);}`
  });
  const tm=new THREE.Mesh(g,mat);tm.renderOrder=2;scene.add(tm);
  const pts=P.map(p=>new THREE.Vector3(p.x,Math.max(p.y,terrainAt(p.x,p.z)+.8)+1.6,p.z));
  curve=new THREE.CatmullRomCurve3(pts,false,'centripetal');
  tube=new THREE.Mesh(new THREE.TubeGeometry(curve,tubeSeg,1.05,6,false),new THREE.MeshBasicMaterial({color:0xE26D3B}));scene.add(tube);
  beam=new THREE.Mesh(new THREE.TubeGeometry(curve,tubeSeg,2.1,6,false),new THREE.MeshBasicMaterial({color:0xFFE6C0,transparent:true,opacity:.9,blending:THREE.AdditiveBlending,depthWrite:false}));scene.add(beam);
  const ln=new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(tubeSeg)),new THREE.LineDashedMaterial({color:0xE26D3B,dashSize:3,gapSize:5,transparent:true,opacity:.35}));ln.computeLineDistances();scene.add(ln);
  ball=new THREE.Mesh(new THREE.SphereGeometry(2.4,20,14),new THREE.MeshBasicMaterial({color:0xE26D3B}));scene.add(ball);
  const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d'),gr=x.createRadialGradient(64,64,0,64,64,64);
  gr.addColorStop(0,'rgba(226,109,59,.9)');gr.addColorStop(.35,'rgba(226,109,59,.28)');gr.addColorStop(1,'rgba(226,109,59,0)');x.fillStyle=gr;x.fillRect(0,0,128,128);
  halo=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));halo.scale.set(34,34,1);scene.add(halo);
  buildBlocks();
}
function buildBlocks(){
  const env=makeEnvP();
  const shp=new THREE.Shape(),w=8,h=6,r=1.6;
  shp.moveTo(-w+r,-h);shp.lineTo(w-r,-h);shp.quadraticCurveTo(w,-h,w,-h+r);shp.lineTo(w,h-r);shp.quadraticCurveTo(w,h,w-r,h);shp.lineTo(-w+r,h);shp.quadraticCurveTo(-w,h,-w,h-r);shp.lineTo(-w,-h+r);shp.quadraticCurveTo(-w,-h,-w+r,-h);
  const geo=new THREE.ExtrudeGeometry(shp,{depth:5,bevelEnabled:true,bevelThickness:.7,bevelSize:.7,bevelSegments:3,curveSegments:6});
  const sc=document.createElement('canvas');sc.width=sc.height=128;{const x=sc.getContext('2d'),g=x.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(0,0,0,.65)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,128,128)}
  const shTex=new THREE.CanvasTexture(sc);
  const cfg={stone:{rough:.32,met:.05},metal:{rough:.38,met:.9},leather:{rough:.62,met:0}};
  STOPS.forEach((st,si)=>{
    if(!st.proj)return;
    const pr=st.proj,cnv=document.createElement('canvas');cnv.width=512;cnv.height=384;
    const tex=new THREE.CanvasTexture(cnv);tex.anisotropy=8;tex.repeat.set(1/(2*(w+.7)),1/(2*(h+.7)));tex.offset.set(.5,.5);
    const top=new THREE.MeshStandardMaterial({map:tex,roughness:cfg[pr.mat].rough,metalness:cfg[pr.mat].met,envMap:env,envMapIntensity:1.1});
    const side=new THREE.MeshStandardMaterial({color:pr.mat==='leather'?0x4A2A16:pr.mat==='metal'?0x6B7076:0x57524A,roughness:.6,metalness:pr.mat==='metal'?.8:.05,envMap:env,envMapIntensity:.8});
    const mesh=new THREE.Mesh(geo,[top,side]);mesh.rotation.x=-Math.PI/2+.42;mesh.position.y=0;
    const holder=new THREE.Group();holder.add(mesh);holder.scale.setScalar(1.3);scene.add(holder);
    const t=st.t,pt=curve.getPointAt(t),a=curve.getPointAt(clamp(t-.03)),b=curve.getPointAt(clamp(t+.03));
    let dx=b.x-a.x,dz=b.z-a.z;const dl=Math.hypot(dx,dz)||1;dx/=dl;dz/=dl;
    const side1=(blocks.length%2?1:-1),nx=-dz,nz=dx;
    const bx=pt.x+nx*side1*17,bz=pt.z+nz*side1*17,by=terrainAt(bx,bz)+3.4;
    holder.position.set(bx,by,bz);
    const camAt=curve.getPointAt(clamp(t-.03));
    const faceYaw=Math.atan2(camAt.x-bx,camAt.z-bz);holder.rotation.y=faceYaw;
    const shadow=new THREE.Mesh(new THREE.PlaneGeometry(34,29),new THREE.MeshBasicMaterial({map:shTex,transparent:true,depthWrite:false,opacity:.55}));
    shadow.rotation.x=-Math.PI/2;shadow.position.set(bx,terrainAt(bx,bz)+.4,bz);scene.add(shadow);
    // balise d'altitude : mât et anneau lumineux
    const pole=new THREE.Mesh(new THREE.CylinderGeometry(.28,.28,28,8),new THREE.MeshBasicMaterial({color:0xE26D3B,transparent:true,opacity:.75,blending:THREE.AdditiveBlending,depthWrite:false}));
    pole.position.set(bx,terrainAt(bx,bz)+14,bz);scene.add(pole);
    const ring=new THREE.Mesh(new THREE.RingGeometry(12,13.2,48),new THREE.MeshBasicMaterial({color:0xE26D3B,transparent:true,opacity:.55,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,depthWrite:false}));
    ring.rotation.x=-Math.PI/2;ring.position.set(bx,terrainAt(bx,bz)+.6,bz);scene.add(ring);
    const bk={holder,mesh,shadow,pole,ring,proj:pr,base:by,lift:0,stopIdx:si,tex,canvas:cnv,faceYaw,pos:new THREE.Vector3(bx,by,bz),t,pt:new THREE.Vector3(pt.x,0,pt.z),n:[nx*side1,nz*side1],camAt:new THREE.Vector3(camAt.x,0,camAt.z)};
    blocks.push(bk);paintBlock(bk);
  });
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>blocks.forEach(paintBlock));
}
const baseFov=()=>cam.aspect<.9?54:42;
/* Sur écran étroit : blocs plus près du sentier et champ de vision plus large, pour qu'ils restent dans l'image */
function placeBlocks(){
  const lat=cam.aspect<.9?7:17;
  blocks.forEach(bk=>{
    const bx=bk.pt.x+bk.n[0]*lat,bz=bk.pt.z+bk.n[1]*lat,gy=terrainAt(bx,bz);
    bk.base=gy+3.4;bk.faceYaw=Math.atan2(bk.camAt.x-bx,bk.camAt.z-bz);
    bk.holder.position.set(bx,bk.base,bz);bk.pos.set(bx,bk.base,bz);
    bk.shadow.position.set(bx,gy+.4,bz);bk.pole.position.set(bx,gy+14,bz);bk.ring.position.set(bx,gy+.6,bz);
  });
}
function resize(){const w=cv.clientWidth,h=cv.clientHeight;if(!w||!h||!OK)return;renderer.setSize(w,h,false);cam.aspect=w/h;if(!staticMode)cam.fov=baseFov();cam.updateProjectionMatrix();placeBlocks()}

/* ---------- Caméra : vol bas, en légère contre-plongée ; arrêts devant chaque projet ---------- */
const v1=OK?new THREE.Vector3():null,v2=OK?new THREE.Vector3():null;
let curT=0,activeStop=0,hoverIdx=-1,pinnedIdx=-1,focusIdx=-1,ptrIdx=-1,ptr={x:0,y:0,in:false};
function rig(p,dt,snap){
  const t=param(p);
  let aw=0,bd=9;for(let i=0;i<NS;i++){const d=Math.abs(p-(STOPS[i].a+STOPS[i].b)/2);if(d<bd){bd=d;aw=i}}
  const mw=stopWeight(aw,p);activeStop=aw;
  const pt=curve.getPointAt(clamp(t)),a=curve.getPointAt(clamp(t-.05)),b=curve.getPointAt(clamp(t+.05));
  let dx=b.x-a.x,dz=b.z-a.z;const dl=Math.hypot(dx,dz)||1;dx/=dl;dz/=dl;
  const ahead=curve.getPointAt(clamp(t+.035));
  const dist=lerp(92,62,mw);   // recul : la caméra voit le sentier de plus loin
  v1.set(pt.x-dx*dist,pt.y+lerp(46,34,mw),pt.z-dz*dist);
  const gh=terrainAt(v1.x,v1.z)+22;if(v1.y<gh)v1.y=gh;
  v2.copy(ahead);v2.y+=14;   // regard qui garde les crêtes dans l'image
  const blk=blocks.find(x=>x.stopIdx===aw);
  if(blk&&mw>0){v2.lerp(blk.pos,mw*(cam.aspect<.9?.9:.55))}
  const k=snap?1:1-Math.exp(-dt*5);
  camPos.lerp(v1,k);camTgt.lerp(v2,k);
  cam.position.copy(camPos);cam.up.set(0,1,0);cam.lookAt(camTgt);
  ball.position.set(pt.x,pt.y+2.2,pt.z);halo.position.copy(ball.position);
  tube.geometry.setDrawRange(0,Math.floor(clamp(t)*tubeSeg)*36);
  const nowS=performance.now()/1000,Lh=.08*(1+.14*Math.sin(nowS*3)),a0=Math.floor(Math.max(0,t-Lh)*tubeSeg),a1=Math.floor(clamp(t)*tubeSeg);
  beam.geometry.setDrawRange(a0*36,Math.max(0,a1-a0)*36);
  curT=t;parcAlt=altAt(t);
  // blocs : soulèvement au survol ou à l'arrêt, pivot vers la caméra
  blocks.forEach((bk,i)=>{
    const sel=(hoverIdx===bk.stopIdx||pinnedIdx===bk.stopIdx)?1:0,act=(aw===bk.stopIdx)?mw*.5:0;
    bk.lift+=(Math.max(sel,act)-bk.lift)*(1-Math.exp(-dt*7));
    const l=ease(bk.lift);
    bk.holder.position.y=bk.base+l*5.4;
    bk.shadow.scale.setScalar(1+.25*l);bk.shadow.material.opacity=.6-.3*l;
    bk.holder.rotation.y=bk.faceYaw+clamp((curT-bk.t)*8,-.55,.55)*.5;
    bk.mesh.rotation.x=-Math.PI/2+.42-.12*l;
    bk.pole.material.opacity=.45+.4*l;bk.ring.material.opacity=.35+.45*l;
  });
}

/* ---------- Ciel de crépuscule : du bleu minéral au bivouac ---------- */
const hex=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
const SKY=[{p:0,t:hex('#050811'),b:hex('#0A1220'),g:0},{p:.5,t:hex('#0A1020'),b:hex('#121B2B'),g:.25},{p:.8,t:hex('#0E1426'),b:hex('#3A2530'),g:.6},{p:1,t:hex('#04060E'),b:hex('#14100F'),g:.35}];   // ciel : bleu nuit arctique, puis une lueur cuivrée vers le bivouac
const sky=$('#sky2');
function updateSky(p){
  let i=0;while(i<SKY.length-2&&p>SKY[i+1].p)i++;
  const a=SKY[i],b=SKY[i+1],u=clamp((p-a.p)/(b.p-a.p)),m=k=>a[k].map((v,j)=>Math.round(lerp(v,b[k][j],u))),g=lerp(a.g,b.g,u);
  sky.style.background=`radial-gradient(ellipse 90% 45% at 50% 105%,rgba(240,120,60,${(g*.55).toFixed(3)}),transparent 70%),linear-gradient(to bottom,rgb(${m('t')}),rgb(${m('b')}))`;
  if(mat)mat.uniforms.uGlow.value=1+g*.5;
}

/* ---------- Interface : étapes, métriques, étiquettes holographiques ---------- */
const stageList=$('#pStageList'),plist=$('#pList'),tagsEl=$('#pTags');
const DIRS=['N','NE','E','SE','S','SO','O','NO'];
function altAt(t){const f=clamp(t)*(P.length-1),i=Math.floor(f),u=f-i,j=Math.min(i+1,P.length-1);return lerp(P[i].alt,P[j].alt,u)}
function bearingAt(t){const a=curve.getPointAt(clamp(t-.02)),b=curve.getPointAt(clamp(t+.02));return ((Math.atan2(b.x-a.x,-(b.z-a.z))*180/Math.PI)%360+360)%360}
const fmt=n=>Math.round(n).toLocaleString('fr-FR');
STOPS.forEach((st,i)=>{
  const li=document.createElement('li'),b=document.createElement('button');b.type='button';b.dataset.i=i;
  b.innerHTML=`<i>${String(i).padStart(2,'0')}</i><span class="lb">${st.name}</span>`;
  b.addEventListener('click',()=>{pinnedIdx=pinnedIdx===i?-1:i;gotoStop(i)});
  b.addEventListener('pointerenter',()=>{focusIdx=i});b.addEventListener('pointerleave',()=>{focusIdx=-1});
  b.addEventListener('focus',()=>{focusIdx=i});b.addEventListener('blur',()=>{if(focusIdx===i)focusIdx=-1});
  li.appendChild(b);stageList.appendChild(li);
  if(st.proj){
    const pr=st.proj,it=document.createElement('li');
    const alt=OK?altAt(st.t):0;
    it.innerHTML=`<p class="e">${pr.stage} · ${pr.place}</p><h3>${pr.title}</h3><p>${pr.result}</p><ul>${pr.tags.map(t=>'<li>'+t+'</li>').join('')}</ul>`;
    plist.appendChild(it);
    const holo=document.createElement('div');holo.className='holo';holo.dataset.i=i;holo.innerHTML=pr.tags.map(t=>'<span>'+t+'</span>').join('');tagsEl.appendChild(holo);
  }
});
const stageBtns=[...stageList.querySelectorAll('button')],holos=[...tagsEl.querySelectorAll('.holo')];
function gotoStop(i){const s=STOPS[i];cinematicTo(PC0+PCW*(s.a+s.b)/2)}
const mT=$('#pmTtl'),m1=$('#pm1'),m1l=$('#pm1l'),m2=$('#pm2'),m2l=$('#pm2l'),m3=$('#pm3'),m3l=$('#pm3l');
let lastShown=-2;
function updateUi(p){
  const sel=pinnedIdx>=0?pinnedIdx:(ptrIdx>=0?ptrIdx:(focusIdx>=0?focusIdx:-1));
  const cur=sel>=0?sel:activeStop;
  stageBtns.forEach((b,i)=>b.setAttribute('aria-current',String(i===activeStop)));
  const st=STOPS[Math.max(cur,0)],t=st.proj?st.t:(cur===0?0:1);
  const alt=altAt(t),brg=bearingAt(t);
  mT.textContent=st.ttl+(st.proj?' · '+st.name:'');
  m1.textContent=fmt(alt)+' m';m1l.textContent='Altitude du projet';
  m2.textContent=String(Math.round(brg)%360).padStart(3,'0')+'° '+DIRS[Math.round(brg/45)%8];m2l.textContent='Cap suivi';
  if(st.proj){m3.textContent=st.proj.result;m3l.textContent='Résultat'}else{m3.textContent=(t*OFFICIAL.km).toFixed(1).replace('.',',')+' km';m3l.textContent='Distance'}
  if(cur!==lastShown){lastShown=cur;if(cur>=0)live.textContent='Étape '+cur+' : '+st.name}
  // étiquettes
  holos.forEach(h=>{const i=+h.dataset.i;const on=(i===sel)||(sel<0&&i===activeStop);h.classList.toggle('on',on)});
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
  const hit=ray.intersectObjects(blocks.map(b=>b.mesh),false)[0];
  ptrIdx=hit?blocks.find(b=>b.mesh===hit.object).stopIdx:-1;
  cv.style.cursor=ptrIdx>=0?'pointer':'';
}
cv.addEventListener('pointermove',e=>{const r=cv.getBoundingClientRect();ptr.x=e.clientX-r.left;ptr.y=e.clientY-r.top;ptr.in=true});
cv.addEventListener('pointerleave',()=>{ptr.in=false;ptrIdx=-1});
cv.addEventListener('click',()=>{if(ptrIdx>=0){pinnedIdx=pinnedIdx===ptrIdx?-1:ptrIdx;gotoStop(ptrIdx)}});
addEventListener('keydown',e=>{if(e.key==='Escape')pinnedIdx=-1});

/* ---------- Vue statique et interface publique ---------- */
function staticView(){
  if(!inited)return;resize();updateSky(.3);
  const c=curve.getPointAt(.5);camPos.set(c.x,900,c.z+70);camTgt.set(c.x,0,c.z);cam.position.copy(camPos);cam.lookAt(camTgt);cam.fov=28;cam.updateProjectionMatrix();
  tube.geometry.setDrawRange(0,tubeSeg*36);beam.visible=false;halo.visible=false;
  blocks.forEach(b=>{b.lift=0;b.holder.position.y=b.base});
  renderer.render(scene,cam);
}
function dynamicView(){if(!inited)return;beam.visible=true;halo.visible=true;resize()}
let inited=false;
function ensure(){if(inited||!OK)return;inited=true;initScene();resize();camPos.set(0,0,0);camTgt.set(0,0,0);first=true}
let first=true,lastT=0;
function update(l,dt){
  if(!inited)return;
  updateSky(l);rig(l,dt,first);first=false;pick();updateUi(l);
  renderer.render(scene,cam);placeHolos();
}
function sizeIt(){if(inited)resize()}
function setQuality(){if(inited){renderer.setPixelRatio(Math.min(devicePixelRatio,QDPR()));resize()}}
function stopPs(){return STOPS.map(s=>({p:PC0+PCW*(s.a+s.b)/2,name:s.name}))}
return {ensure,update,resize:sizeIt,staticView,dynamicView,setQuality,stopPs,dispose(){if(inited)try{renderer.forceContextLoss();renderer.dispose()}catch(e){}}};

})();

/* ---------- Chargement ---------- */
function finishLoad(){
  if(loaded)return;
  try{localStorage.setItem('asc-seen','1')}catch(e){}
  loaded=true;loader.classList.add('done');
  root.style.overflow='';
  nRot=((nRot%TAU)+TAU)%TAU;if(nRot>Math.PI)nRot-=TAU;nVel=-2.2;
  live.textContent='Boussole calée sur le nord. Faites défiler pour explorer.';
  setTimeout(()=>{try{PARC.ensure()}catch(e){}},400);
  setTimeout(()=>{try{SHOE.ensure()}catch(e){}},1000);
  setTimeout(()=>{try{CAMP.ensure()}catch(e){}},1600);   // prépare le relief 3D pendant que la montre s'affiche
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
    if(Math.abs(pr-pS)>.5)pS=pr;else pS+=(pr-pS)*(1-Math.exp(-dt*9));
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
