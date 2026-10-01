// Cantonne les styles de la boucle derrière html.loop-on.
// Usage : node scripts/scope-loop-css.cjs assets/loop/loop.source.css assets/loop/loop.css
const postcss=require('postcss');const fs=require('fs');
const SC='html.loop-on';
const scopeSel=sel=>sel.split(/,(?![^(]*\))/).map(s=>{s=s.trim();
  if(/^:root/.test(s))return s.replace(/^:root/,SC);
  if(/^html(?![\w-])/.test(s))return s.replace(/^html/,SC);
  if(/^body(?![\w-])/.test(s))return SC+' '+s;
  if(s.includes(':root'))return s.replace(/:root/g,SC);
  return SC+' '+s}).join(',');
const src=fs.readFileSync(process.argv[2]||'assets/loop/loop.source.css','utf8');
const root=postcss.parse(src);
root.walkRules(r=>{let p=r.parent,skip=false;while(p&&p.type!=='root'){if(p.type==='atrule'&&/keyframes|font-face/.test(p.name))skip=true;p=p.parent}if(!skip)r.selector=scopeSel(r.selector)});
fs.writeFileSync(process.argv[3]||'assets/loop/loop.css',root.toString());
console.log('rules:',(()=>{let n=0;root.walkRules(()=>n++);return n})());
