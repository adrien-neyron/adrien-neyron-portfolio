import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { applyLoopContent, swap, escHtml, renderStageList, loopStages, toolCount } from '~/utils/loopMarkup'
import { aiTools as staticAiTools } from '~/data/ai-tools'
import { buildStageView } from '~/utils/stages'

const markup = readFileSync(new URL('../../assets/loop/loop.html', import.meta.url), 'utf8')

describe('loop.html : contrat avec les champs « Accueil » de l’admin', () => {
  // Si une de ces balises est renommée, l’admin n’agit plus sur l’accueil sans aucune erreur visible.
  it.each([
    '<p class="eyebrow who">', '<h1 id="h1">', '<p class="lede">',
    'id="head2"', '<p class="eyebrow">', '<h2>', '<p class="sub">',
  ])('contient %s', (tag) => { expect(markup).toContain(tag) })

  it('a le bloc « S’équiper » (#head2) avec surtitre, titre et paragraphe', () => {
    const i = markup.indexOf('id="head2"')
    const block = markup.slice(i, markup.indexOf('</div>', i))
    expect(block).toMatch(/<p class="eyebrow">[^<]+<\/p>/)
    expect(block).toMatch(/<h2>[^<]+<\/h2>/)
    expect(block).toMatch(/<p class="sub">[^<]+<\/p>/)
  })
})

describe('applyLoopContent', () => {
  it('sans contenu, seul la liste des étapes (repli) est ajoutée : le reste du balisage est inchangé', () => {
    const base = applyLoopContent(markup, null)
    const strip = (h: string) => h.replace(/(<ol class="pl-list" id="pList"[^>]*>)[\s\S]*?<\/ol>/, '$1</ol>')
    expect(strip(base)).toBe(markup)
    expect(applyLoopContent(markup, {})).toBe(base)
    expect(applyLoopContent(markup, { hero: { eyebrow: '  ', title: '', lede: undefined } })).toBe(base)
  })

  it('remplace surtitre, titre et sous-texte', () => {
    const out = applyLoopContent(markup, { hero: { eyebrow: 'Eyebrow X', title: 'Titre X', lede: 'Lede X' } })
    expect(out).toContain('<p class="eyebrow who">Eyebrow X</p>')
    expect(out).toContain('<h1 id="h1"><span class="ln">Titre X</span></h1>')   // titre : une phrase par ligne (titleHtml)
    expect(out).toContain('<p class="lede">Lede X</p>')
  })

  it('titre de l’admin : chaque phrase sur sa ligne, texte échappé', () => {
    const out = applyLoopContent(markup, { hero: { title: 'Trouver le cap. <i>Concevoir</i> le chemin.' } })
    expect(out).toContain('<h1 id="h1"><span class="ln">Trouver le cap.</span> <span class="ln">&lt;i&gt;Concevoir&lt;/i&gt; le chemin.</span></h1>')
  })

  it('remplace le bloc S’équiper sans toucher aux autres surtitres', () => {
    const out = applyLoopContent(markup, { toolsHead: { eyebrow: 'Atelier X', title: 'Outils X', lede: 'Para X' } })
    const i = out.indexOf('id="head2"')
    expect(out.slice(i)).toContain('<p class="eyebrow">Atelier X</p>')
    expect(out.slice(i)).toContain('<h2>Outils X</h2>')
    expect(out.slice(i)).toContain('<p class="sub">Para X</p>')
    expect(out.slice(0, i)).toBe(markup.slice(0, i)) // rien avant #head2 n’a bougé
  })

  it('remplace le surtitre et le titre de « L’ascension » (carte des étapes), texte échappé, sans toucher à « S’équiper »', () => {
    const out = applyLoopContent(markup, { mapHead: { eyebrow: 'Carte X', title: 'Un <b>parcours</b>' } })
    expect(out).toContain('<p class="eyebrow" id="mapEyebrow">Carte X</p>')
    expect(out).toContain('<h2 id="h-map">Un &lt;b&gt;parcours&lt;/b&gt;</h2>')
    expect(out).toContain('<h2>Des outils construits pour le terrain</h2>')
    expect(applyLoopContent(markup, { mapHead: { eyebrow: ' ', title: '' } })).toBe(applyLoopContent(markup, null))   // vide : textes par défaut
  })

  it('un champ vide garde le texte par défaut du champ voisin', () => {
    const out = applyLoopContent(markup, { toolsHead: { title: 'Seul le titre' } })
    expect(out).toContain('<h2>Seul le titre</h2>')
    expect(out).toContain("S'équiper · Outils développés")
  })

  it('échappe le HTML saisi (pas d’injection)', () => {
    const out = applyLoopContent(markup, { hero: { title: '<img src=x onerror=alert(1)> & "ok"' } })
    expect(out).not.toContain('<img src=x')
    expect(out).toContain('&lt;img src=x onerror=alert(1)&gt; &amp; &quot;ok&quot;')
  })
})

describe('« Explorer l’inventaire complet » (S’équiper)', () => {
  it('lien dans le bloc #head2, après le paragraphe, vers /ai-tools', () => {
    const i = markup.indexOf('id="head2"'), block = markup.slice(i, markup.indexOf('</div>', i))
    expect(block.indexOf('id="eqMore"')).toBeGreaterThan(block.indexOf('<p class="sub">'))
    expect(block).toMatch(/<a class="eq-cta" href="\/ai-tools">/)
    expect(markup).not.toContain('Voir tout l\'équipement')
  })
  it('le nombre par défaut du balisage = la liste de secours de /ai-tools', () => {
    expect(markup).toContain(`<span class="eq-n">${staticAiTools.length} outils</span>`)
  })
  it('nombre de la base s’il y en a, sinon la liste de secours (comme la page)', () => {
    expect(applyLoopContent(markup, { aiToolCount: 9 })).toContain('<span class="eq-n">9 outils</span>')
    expect(applyLoopContent(markup, { aiToolCount: 1 })).toContain('<span class="eq-n">1 outil</span>')
    expect(toolCount({ aiToolCount: 0 })).toBe(staticAiTools.length)
    expect(toolCount(null)).toBe(staticAiTools.length)
  })
})

describe('HUD connecté de « S’équiper »', () => {
  it('onglets + panneau ARIA, dans l’ordre : lien inventaire → HUD → liste des outils', () => {
    expect(markup).toMatch(/id="eqTabs" role="tablist" aria-label="[^"]+"/)
    expect(markup).toMatch(/id="eqPanel" role="tabpanel"/)
    expect(markup).toMatch(/<svg class="eq-wire" id="eqWire" aria-hidden="true">/)
    const a = markup.indexOf('id="eqMore"'), h = markup.indexOf('id="eqHud"'), t = markup.indexOf('id="tools"')
    expect(a).toBeLessThan(h); expect(h).toBeLessThan(t)
  })
})

describe('WAYFINDER : rail d’altitude', () => {
  it('repère actif dans le curseur de la barre (décorative), 5 repères = 5 étapes du menu', () => {
    const i = markup.indexOf('class="altrail"'), rail = markup.slice(i, markup.indexOf('</div>', i))
    expect(rail).toContain('aria-hidden="true"')
    expect(rail).toMatch(/<span class="wcur" id="railCur"><b id="railNum">01 \/ 05<\/b> <span id="railName">La trace<\/span><\/span>/)
    expect(rail.match(/class="tk"/g)).toHaveLength(5)
    expect(markup.match(/<li><button type="button" data-h=/g)).toHaveLength(5)
  })
})

describe('garde « fantôme » : pas d’élément invisible dans l’ordre de tabulation', () => {
  const js = readFileSync(new URL('../../assets/loop/loop.js', import.meta.url), 'utf8')
  const sel = /GHOST_SEL='([^']+)'/.exec(js)?.[1] ?? ''
  it('chaque bloc surveillé existe dans loop.html (sinon la garde ne protège plus rien)', () => {
    const parts = sel.split(',')
    expect(parts.length).toBeGreaterThan(8)
    for (const p of parts) {
      const id = /^#([\w-]+)$/.exec(p)?.[1], cls = /^\.([\w-]+)$/.exec(p)?.[1]
      if (id) expect(markup, p).toContain(`id="${id}"`)
      else if (cls) expect(new RegExp(`class="[^"]*\\b${cls}\\b`).test(markup) || new RegExp(`className\\s*=\\s*'${cls}\\b`).test(js), p).toBe(true)   // écrit dans loop.html ou créé par loop.js (zones .hot)
    }
  })
  it('sous 35 % d’opacité le bloc devient inert, jamais en vue statique', () => {
    expect(js).toContain('const GHOST_MIN=.35')
    expect(js).toContain('const off=!staticMode&&effOpacity(el)<GHOST_MIN;if(el.inert!==off)el.inert=off')
  })
})

describe('« Aller au contenu » ≠ logo', () => {
  const js = readFileSync(new URL('../../assets/loop/loop.js', import.meta.url), 'utf8')
  it('le lien d’évitement saute l’en-tête vers le titre de la scène affichée ; le logo ramène au début', () => {
    expect(markup).toContain('<a class="skip" href="#main">')   // sans JavaScript : #main reste une cible valable
    expect(js).toMatch(/\$\('\.skip'\)\.addEventListener\('click',e=>\{\s*e\.preventDefault\(\);/)
    expect(js).toContain('HW[Math.max(0,curName)]')
    expect(js).toMatch(/\$\('#brand'\)\.addEventListener\('click',e=>\{e\.preventDefault\(\);staticMode\?scrollTo\(0,0\):jumpTo\(\.0004\)/)
  })
})

describe('fiche d’étape en trois niveaux (titre, chiffre-preuve, images ; récit derrière « Lire le parcours »)', () => {
  const i = markup.indexOf('id="stopCard"'), card = markup.slice(i, markup.indexOf('</aside>', i))
  it('ordre : titre → chiffre-preuve → images → « Lire le parcours » (récit dedans) → liens', () => {
    const at = (s: string) => card.indexOf(s)
    expect(at('id="scT"')).toBeLessThan(at('id="scF"'))
    expect(at('id="scF"')).toBeLessThan(at('id="scI"'))
    expect(at('id="scI"')).toBeLessThan(at('id="scD"'))
    expect(at('id="scD"')).toBeLessThan(at('id="scActs"'))
    expect(card).toMatch(/<details class="sc-read" id="scD" hidden><summary><span class="o">Lire le parcours<\/span><span class="c">Masquer le parcours<\/span><\/summary><div class="sc-l" id="scL"><\/div><\/details>/)
  })
  it('le chiffre n’est affiché que s’il est saisi, jamais inventé ; récit refermé à chaque étape', () => {
    const js = readFileSync(new URL('../../assets/loop/loop.js', import.meta.url), 'utf8')
    expect(js).toContain("f.hidden=!sg.figure")
    expect(js).toContain("d.hidden=!l.children.length;d.open=false")
  })
})

describe('compteur Km · D+ à rouleaux (étape 3)', () => {
  const js = readFileSync(new URL('../../assets/loop/loop.js', import.meta.url), 'utf8')
  it('décoratif (le total est dans le texte pour lecteur d’écran), chiffres en rouleaux 0-9, sans rotation en mouvement réduit', () => {
    expect(markup).toContain('<p class="tot" id="mapTot" aria-hidden="true">')
    expect(markup).toMatch(/<p class="sr-only">Parcours complet : [^<]+<\/p>/)
    expect(js).toContain("odoSet(kmAt(tt),Math.round(gainAtT(tt)/10)*10)")
    const css = readFileSync(new URL('../../assets/loop/loop.source.css', import.meta.url), 'utf8')
    expect(css).toContain('@media (prefers-reduced-motion:reduce){#mapTot .od-c{transition:none}}')
  })
})

describe('swap / escHtml', () => {
  it('swap ignore une balise absente', () => {
    expect(swap('<b>a</b>', '<i>', '</i>', 'x')).toBe('<b>a</b>')
  })
  it('swap ne remplace que la première occurrence', () => {
    expect(swap('<p>1</p><p>2</p>', '<p>', '</p>', 'X')).toBe('<p>X</p><p>2</p>')
  })
  it('escHtml échappe & < > "', () => {
    expect(escHtml(`&<>"`)).toBe('&amp;&lt;&gt;&quot;')
  })
})

describe('liste des étapes (#pList, rendue côté serveur)', () => {
  const view = buildStageView(
    [
      { key: 'd', order: 0, kind: 'depart', period: 'Sept. 2010 – Oct. 2021', title: 'UCPA <b>', figure: '500+', figureLabel: 'personnes formées', projects: [] },
      { key: 'e1', order: 1, kind: 'etape', period: '2021', title: 'Freelance', projects: ['p1', 'absent'] },
      { key: 'f', order: 2, kind: 'final', period: '', title: 'Étape à écrire ensemble', projects: [] },
    ],
    [{ slug: 'p1', title: 'Projet "1"' }],
  )
  const html = renderStageList(view)

  it('toutes les étapes, dans l’ordre, avec dates', () => {
    expect(html.match(/<li class="st-/g)).toHaveLength(3)
    expect(html.indexOf('Départ · Sept. 2010 – Oct. 2021')).toBeLessThan(html.indexOf('Étape 01 · 2021'))
  })
  it('vrais liens <a href> vers les fiches présentes, /contact au cairn final', () => {
    expect(html).toContain('<a href="/projects/p1">Fiche Projet &quot;1&quot;')
    expect(html).not.toContain('/projects/absent')
    expect(html).toContain('<a href="/contact">')
  })
  it('chiffre affiché seulement s’il est saisi, texte échappé', () => {
    expect(html.match(/class="fig"/g)).toHaveLength(1)
    expect(html).toContain('UCPA &lt;b&gt;')
  })
  it('contenu vide ou en panne → étapes par défaut', () => {
    expect(loopStages(null).length).toBeGreaterThan(3)
    expect(loopStages({ stages: [] })[0].label).toBe('Départ')
    expect(loopStages({ stages: view })).toBe(view)
  })
})

describe('lien CV (rendu serveur)', () => {
  it('par défaut : un fichier qui existe dans public/', async () => {
    const { existsSync } = await import('node:fs')
    expect(markup).not.toContain('/cv-adrien-neyron.pdf')
    expect(markup.match(/href="\/CV_Adrien_Neyron\.pdf" data-cv/g)).toHaveLength(2)
    expect(existsSync(new URL('../../public/CV_Adrien_Neyron.pdf', import.meta.url))).toBe(true)
  })
  it('CV de l’admin : remplace tous les liens ; URL douteuse ignorée', () => {
    const out = applyLoopContent(markup, { profile: { cvUrl: 'https://blob.example/cv.pdf' } })
    expect(out.match(/href="https:\/\/blob\.example\/cv\.pdf"/g)).toHaveLength(2)
    expect(applyLoopContent(markup, { profile: { cvUrl: 'javascript:alert(1)' } })).toBe(applyLoopContent(markup, null))
    expect(applyLoopContent(markup, { profile: { cvUrl: '//evil.example/cv.pdf' } })).toBe(applyLoopContent(markup, null))
  })
})
