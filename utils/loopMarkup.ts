/**
 * Injection des textes de l'admin dans le balisage de l'accueil (assets/loop/loop.html).
 * Extrait de LoopHome.vue pour être testé (tests/unit/loopMarkup.test.ts) : le texte du balisage est le
 * repli, un champ vide ou une balise introuvable laisse le HTML d'origine intact.
 */
export interface LoopTexts { eyebrow?: string; title?: string; lede?: string }
export interface LoopContentTexts { hero?: LoopTexts | null; toolsHead?: LoopTexts | null }

export const escHtml = (v: string) =>
  v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** Remplace le texte entre `open` et la première occurrence suivante de `close`. */
export const swap = (html: string, open: string, close: string, text?: string) => {
  const t = (text || '').trim()
  if (!t) return html
  const i = html.indexOf(open)
  const j = i < 0 ? -1 : html.indexOf(close, i)
  return j < 0 ? html : html.slice(0, i + open.length) + escHtml(t) + html.slice(j)
}

export function applyLoopContent(markup: string, content?: LoopContentTexts | null): string {
  const h = content?.hero
  const t = content?.toolsHead
  let html = markup
  if (h) {
    html = swap(html, '<p class="eyebrow who">', '</p>', h.eyebrow)
    html = swap(html, '<h1 id="h1">', '</h1>', h.title)
    html = swap(html, '<p class="lede">', '</p>', h.lede)
    html = swap(html, '<p class="gate-tag">', '</p>', h.title)
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
