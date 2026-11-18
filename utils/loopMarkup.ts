/**
 * Injection des textes de l'admin dans le balisage de l'accueil (assets/loop/loop.html).
 * Extrait de LoopHome.vue pour être testé (tests/unit/loopMarkup.test.ts) : le texte du balisage est le
 * repli, un champ vide ou une balise introuvable laisse le HTML d'origine intact.
 */
import { buildStageView, summaryHtml, type StageView } from './stages'
import { stages as staticStages } from '../data/stages'
import { projects as staticProjects } from '../data/projects'
import { aiTools as staticAiTools } from '../data/ai-tools'

export interface LoopTexts { eyebrow?: string; title?: string; lede?: string }
export interface LoopContentTexts { hero?: LoopTexts | null; toolsHead?: LoopTexts | null; stages?: StageView[] | null; profile?: { cvUrl?: string } | null; aiToolCount?: number | null }

/** Lien CV par défaut de loop.html (fichier présent dans public/) ; remplacé par celui de l'admin s'il est valide. */
export const DEFAULT_CV = '/CV_Adrien_Neyron.pdf'

export const escHtml = (v: string) =>
  v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** Remplace le texte entre `open` et la première occurrence suivante de `close`. */
/**
 * Titre du hero : une phrase par ligne (« Trouver le cap. / Concevoir le chemin. »), sans HTML saisi dans /admin.
 * Le texte est découpé après . ! ? ou …, chaque phrase échappée dans un <span class="ln"> (affiché en bloc par loop.css).
 * Un titre sans ponctuation finale reste une seule ligne.
 */
export const titleHtml = (text: string) =>
  text.trim().split(/(?<=[.!?…])\s+/).filter(Boolean).map((t) => `<span class="ln">${escHtml(t)}</span>`).join(' ')

export const swap = (html: string, open: string, close: string, text?: string) => {
  const t = (text || '').trim()
  if (!t) return html
  const i = html.indexOf(open)
  const j = i < 0 ? -1 : html.indexOf(close, i)
  return j < 0 ? html : html.slice(0, i + open.length) + escHtml(t) + html.slice(j)
}

/**
 * Étapes de la trace : celles de /api/loop-content (base, déjà résolues), sinon le repli data/stages.ts
 * (liens résolus sur les projets du repli). Même fonction pour le rendu serveur et pour loop.js.
 */
export function loopStages(content?: LoopContentTexts | null): StageView[] {
  const s = content?.stages
  return Array.isArray(s) && s.length
    ? s
    : buildStageView(staticStages, staticProjects.map((p) => ({ slug: p.id, title: p.title })))
}

const fmtN = (n: number) => Math.round(n).toLocaleString('fr-FR')

/**
 * Liste des étapes (#pList), rendue côté serveur : vraie liste ordonnée, dates, chiffre et VRAIS liens <a href>
 * vers les fiches. Lisible sans JavaScript ni 3D ; affichée en vue statique et en mouvement réduit (loop.css).
 */
export function renderStageList(view: StageView[]): string {
  return view
    .map((v, i) => {
      const head = [v.label, v.period].filter(Boolean).join(' · ')
      const fig = v.figure ? `<p class="fig"><strong>${escHtml(v.figure)}</strong>${v.figureLabel ? ' ' + escHtml(v.figureLabel) : ''}</p>` : ''
      const links = v.kind === 'final'
        ? [{ href: '/contact', text: v.cta || 'Écrire la suite ensemble' }]
        : v.links.map((l, k) => ({ href: l.href, text: k === 0 && v.cta ? v.cta : `Fiche ${l.title}` }))
      const ul = links.length
        ? `<ul class="lk">${links.map((l) => `<li><a href="${escHtml(l.href)}">${escHtml(l.text)}<span aria-hidden="true"> →</span></a></li>`).join('')}</ul>`
        : ''
      return `<li class="st-${v.kind}" data-i="${i}"><p class="e">${escHtml(head)}</p>`
        + `<h3>${escHtml(v.title)}</h3>`
        + (v.place ? `<p class="pl">${escHtml(v.place)}</p>` : '')
        + summaryHtml(v.summary, escHtml, 'p')
        + fig
        + `<p class="km">Km ${fmtN(v.km)} · D+ ${fmtN(v.gain)} m${v.altitude != null ? ` · Altitude ${fmtN(v.altitude)} m` : ''}</p>`
        + ul + '</li>'
    })
    .join('')
}

const PLIST_OPEN = '<ol class="pl-list" id="pList" aria-label="Étapes du parcours">'

/** Nombre d'outils affichés par /ai-tools : ceux de la base, ou la liste de secours si la base est vide ou indisponible (comme stores/aiTools.ts). */
export const toolCount = (content?: LoopContentTexts | null) => {
  const n = Number(content?.aiToolCount)
  return Number.isInteger(n) && n > 0 ? n : staticAiTools.length
}

export function applyLoopContent(markup: string, content?: LoopContentTexts | null): string {
  const h = content?.hero
  const t = content?.toolsHead
  // liste des étapes : HTML déjà échappé par renderStageList (remplacement par fonction : pas d'interprétation de « $ »)
  let html = markup.replace(PLIST_OPEN + '</ol>', () => PLIST_OPEN + renderStageList(loopStages(content)) + '</ol>')
  // lien CV de l'admin (chemin du site ou https) : posé dans le HTML serveur, valable sans JavaScript
  const cv = (content?.profile?.cvUrl || '').trim()
  if (cv && cv !== DEFAULT_CV && /^(\/(?!\/)|https:\/\/)/.test(cv)) html = html.split(`href="${DEFAULT_CV}"`).join(`href="${escHtml(cv)}"`)
  // « Explorer l'inventaire complet (n outils) » : même nombre que la page /ai-tools (base, sinon sa liste de secours data/ai-tools.ts)
  const n = toolCount(content)
  html = swap(html, '<span class="eq-n">', '</span>', `${n} outil${n > 1 ? 's' : ''}`)
  if (h) {
    html = swap(html, '<p class="eyebrow who">', '</p>', h.eyebrow)
    const tt = (h.title || '').trim()
    if (tt) {
      const i = html.indexOf('<h1 id="h1">'), j = i < 0 ? -1 : html.indexOf('</h1>', i)
      if (j >= 0) html = html.slice(0, i + '<h1 id="h1">'.length) + titleHtml(tt) + html.slice(j)
    }
    html = swap(html, '<p class="lede">', '</p>', h.lede)
  }
  if (t) {
    // Étape « S'équiper » : on cible le bloc #head2 pour ne pas toucher aux autres surtitres / paragraphes
    const i = html.indexOf('id="head2"')
    if (i >= 0) {
      let tail = html.slice(i)
      tail = swap(tail, '<p class="eyebrow">', '</p>', t.eyebrow)
      tail = swap(tail, '<h2>', '</h2>', t.title)
      tail = swap(tail, '<p class="sub">', '</p>', t.lede)
      html = html.slice(0, i) + tail
    }
  }
  return html
}
