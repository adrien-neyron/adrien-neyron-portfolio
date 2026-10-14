/**
 * Capture de l'écran d'intro (#gate) en image, pour que la transition en éclats parte d'un rendu identique au DOM.
 * Le DOM reste la version de référence (lecteurs d'écran, clavier, sans WebGL) : cette image n'est utilisée que
 * pendant la transition, puis jetée. Toute erreur ici est rattrapée par l'appelant, qui retombe sur un simple fondu.
 *
 * Reconstruit : fond dégradé, accroche et lien « Passer l'intro ».
 */

const SVG_PROPS = ['fill', 'fill-opacity', 'stroke', 'stroke-opacity', 'stroke-width', 'opacity'] as const

/** Un SVG sérialisé n'a plus accès aux feuilles de style de la page : on fige les couleurs calculées dessus. */
function inlineSvgStyles(src: Element, dst: Element) {
  // Les définitions (defs, masques, dégradés, filtres) gardent leurs attributs d'auteur : y figer le « fill » noir par défaut
  // écraserait l'héritage depuis les <use> et noircirait la corde.
  if (/^(defs|mask|lineargradient|radialgradient|filter|clippath|symbol)$/i.test(src.localName)) return
  const cs = getComputedStyle(src)
  const style = SVG_PROPS.map((p) => `${p}:${cs.getPropertyValue(p)}`).join(';')
  const prev = dst.getAttribute('style')
  dst.setAttribute('style', prev ? `${prev};${style}` : style)
  for (let i = 0; i < src.children.length; i++) {
    if (dst.children[i]) inlineSvgStyles(src.children[i], dst.children[i])
  }
}

function svgToImage(svg: SVGSVGElement, w: number, h: number): Promise<HTMLImageElement> {
  const clone = svg.cloneNode(true) as SVGSVGElement
  inlineSvgStyles(svg, clone)
  // Dégradés / filtres référencés (url(#id)) mais définis ailleurs dans la page : on les recopie dans le SVG isolé.
  const own = new Set([...clone.querySelectorAll('[id]')].map((n) => n.id))
  const wanted = new Set<string>()
  for (const m of clone.outerHTML.matchAll(/url\(["']?#([\w-]+)["']?\)/g)) if (!own.has(m[1])) wanted.add(m[1])
  if (wanted.size) {
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs')
    wanted.forEach((id) => { const n = document.getElementById(id); if (n) defs.appendChild(n.cloneNode(true)) })
    clone.insertBefore(defs, clone.firstChild)
  }
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.setAttribute('width', String(w))
  clone.setAttribute('height', String(h))
  const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml;charset=utf-8' }))
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => { URL.revokeObjectURL(url); resolve(img) }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('SVG illisible')) }
    img.src = url
  })
}

/** Remplit le fond avec le dégradé du jeton CSS --gate-bg (« radial-gradient(120% 90% at 50% 40%, #… 0%, … ») */
function paintBackground(ctx: CanvasRenderingContext2D, gate: HTMLElement, w: number, h: number) {
  const raw = getComputedStyle(gate).getPropertyValue('--gate-bg')
  const stops = [...raw.matchAll(/(#[0-9a-f]{3,8}|rgba?\([^)]*\))\s+(\d+(?:\.\d+)?)%/gi)]
  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 1)
  if (stops.length >= 2) stops.forEach((m) => grad.addColorStop(Math.min(1, Number(m[2]) / 100), m[1]))
  else { grad.addColorStop(0, getComputedStyle(gate).backgroundColor); grad.addColorStop(1, getComputedStyle(gate).backgroundColor) }
  ctx.save()
  ctx.translate(w * 0.5, h * 0.4)
  ctx.scale(w * 1.2, h * 0.9) // ellipse « 120% 90% at 50% 40% » ; au-delà du dernier arrêt, la dernière couleur se prolonge
  ctx.fillStyle = grad
  ctx.fillRect(-1, -1, 2, 2)
  ctx.restore()
}

/** Écrit le texte d'un élément mot par mot, à la position exacte où le navigateur l'a posé (gère les retours à la ligne). */
function paintText(ctx: CanvasRenderingContext2D, el: HTMLElement) {
  const cs = getComputedStyle(el)
  ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`
  ctx.fillStyle = cs.color
  ctx.textBaseline = 'middle'
  const upper = cs.textTransform === 'uppercase'
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
  const range = document.createRange()
  for (let node = walker.nextNode() as Text | null; node; node = walker.nextNode() as Text | null) {
    const text = node.textContent ?? ''
    const re = /\S+/g
    for (let m = re.exec(text); m; m = re.exec(text)) {
      range.setStart(node, m.index)
      range.setEnd(node, m.index + m[0].length)
      const r = range.getBoundingClientRect()
      if (!r.width) continue
      ctx.fillText(upper ? m[0].toUpperCase() : m[0], r.left, r.top + r.height / 2)
    }
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

export async function snapshotGate(gate: HTMLElement, dpr: number, maxSide = 3072): Promise<HTMLCanvasElement> {
  const w = innerWidth
  const h = innerHeight
  const k = Math.min(dpr, maxSide / Math.max(w, h))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(w * k)
  canvas.height = Math.round(h * k)
  const ctx = canvas.getContext('2d')!
  ctx.scale(k, k)
  await document.fonts?.ready

  paintBackground(ctx, gate, w, h)

  const q = <T extends Element>(sel: string) => gate.querySelector<T>(sel)

  const tag = q<HTMLElement>('.gate-tag')
  if (tag) paintText(ctx, tag)

  const skip = q<HTMLElement>('.gate-skip')
  if (skip) {
    paintText(ctx, skip)
    const r = skip.getBoundingClientRect()
    ctx.fillStyle = getComputedStyle(skip).color
    ctx.fillRect(r.left + 16, r.bottom - 14, r.width - 32, 1) // soulignement
  }
  return canvas
}
