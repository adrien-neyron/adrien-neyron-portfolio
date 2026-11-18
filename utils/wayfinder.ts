/**
 * WAYFINDER — signature de navigation clavier (18/11/2026). Voir docs/wayfinder.md.
 *
 * A. Le viseur : quatre équerres orange + un cran de visée autour de l'élément qui a VRAIMENT le focus
 *    (document.activeElement), qui glisse d'un élément au suivant, avec le nom de la destination quelques instants.
 * B. La trace : une ligne pointillée « courbe de niveau » entre l'ancien et le nouveau waypoint, puis elle s'efface.
 *
 * Règles tenues :
 * - Purement décoratif (aria-hidden, pointer-events: none) : le focus natif (:focus-visible) reste en place, même
 *   sans JavaScript ni animation. Le viseur s'ajoute, il ne remplace rien.
 * - Aucune touche interceptée (pas de preventDefault, pas de stopPropagation), aucun tabindex posé : l'ordre est
 *   celui du DOM, le viseur ne fait que le suivre.
 * - Actif seulement au clavier : Tab, ou un déplacement du focus juste après une touche ; le premier clic / toucher
 *   l'éteint. Mouvement réduit : pas de glissement ni de trace (le viseur saute d'un élément à l'autre).
 * - Calque dans la couche supérieure (API popover) pour passer au-dessus des <dialog> modales ; sans popover : fixe,
 *   z-index maximal.
 *
 * Cohérence (revue du 18/11/2026, « discret, fluide, homogène, sans doublon ») :
 * - Un seul indicateur à la fois : tant que le viseur est affiché (html.wf-on), le contour natif devient transparent
 *   (il garde sa place, rien ne bouge) ; dès que le viseur n'est pas là (hors écran, contraste élevé, pas de JS),
 *   le contour natif revient.
 * - Le nom n'apparaît que s'il n'est écrit nulle part ailleurs : bouton-icône sans texte visible, sans infobulle à lui
 *   (data-tip), sans description (aria-describedby) ; jamais sur un champ de formulaire (son libellé est visible).
 * - Pas de viseur sur une cible de focus programmé non interactive (titre après changement de page, main) : elle est
 *   volontairement sans contour.
 * - Deux mouvements seulement : glisser vers un voisin proche, « se verrouiller » (équerres qui se resserrent) après
 *   un saut lointain. La trace ne marque que le passage d'une zone à une autre (en-tête → contenu, contenu → carte…) ;
 *   jamais entre voisins d'une même zone (items du menu, onglets), ni d'un bout à l'autre de l'écran ; elle repart de zéro à
 *   l'entrée ou à la sortie d'une fenêtre.
 */

export type Cleanup = () => void
export interface Pt { x: number; y: number }
export interface Box { x: number; y: number; w: number; h: number }

/** Marge entre l'élément et les équerres (px). */
export const WF_PAD = 6
/** Longueur maximale du nom affiché. */
export const WF_NAME_MAX = 40
/** Durée d'affichage du nom après l'arrivée (ms). */
export const WF_LABEL_MS = 1400
/** Durée de vie d'un tronçon de trace (ms) et nombre maximal de tronçons à l'écran. */
export const WF_TRAIL_MS = 1200
export const WF_TRAIL_MAX = 3
/** Trace : seulement pour un saut entre WF_TRAIL_MIN px et WF_FAR × la diagonale de la fenêtre. Au-delà : verrouillage, sans glissement. */
export const WF_TRAIL_MIN = 80
export const WF_FAR = 0.45

const clean = (s: string | null | undefined) => (s ?? '').replace(/\s+/g, ' ').trim()

/** Coupe un nom trop long (ellipse). */
export function shorten(s: string, max = WF_NAME_MAX): string {
  return s.length > max ? s.slice(0, max - 1).trimEnd() + '…' : s
}

/** Interface minimale d'un élément pour le calcul du nom (testable sans DOM). */
export interface NameSource {
  getAttribute(n: string): string | null
  textContent: string | null
  ownerDocument?: { getElementById(id: string): { textContent: string | null } | null } | null
  labels?: ArrayLike<{ textContent: string | null }> | null
  querySelector?(s: string): { getAttribute(n: string): string | null } | null
}

/** Nom de la destination, au plus près du nom accessible : aria-labelledby, aria-label, <label>, texte, title, alt, placeholder. */
export function wfName(el: NameSource): string {
  const by = el.getAttribute('aria-labelledby')
  if (by && el.ownerDocument) {
    const t = clean(by.split(/\s+/).map((id) => el.ownerDocument!.getElementById(id)?.textContent ?? '').join(' '))
    if (t) return shorten(t)
  }
  const al = clean(el.getAttribute('aria-label'))
  if (al) return shorten(al)
  const lb = el.labels && el.labels.length ? clean(el.labels[0].textContent) : ''
  if (lb) return shorten(lb)
  const tx = clean(el.textContent)
  if (tx) return shorten(tx)
  const ti = clean(el.getAttribute('title'))
  if (ti) return shorten(ti)
  const alt = clean(el.querySelector?.('img[alt]')?.getAttribute('alt'))
  if (alt) return shorten(alt)
  return shorten(clean(el.getAttribute('placeholder')))
}

/** Cadre du viseur autour d'un rectangle (coordonnées de la fenêtre). */
export function viseurBox(r: { left: number; top: number; width: number; height: number }, pad = WF_PAD): Box {
  return { x: r.left - pad, y: r.top - pad, w: r.width + pad * 2, h: r.height + pad * 2 }
}

/** L'élément est-il (au moins en partie) dans la fenêtre ? */
export function inView(b: Box, vw: number, vh: number): boolean {
  return b.w > 2 * WF_PAD && b.h > 2 * WF_PAD && b.x + b.w > 0 && b.y + b.h > 0 && b.x < vw && b.y < vh
}

export const center = (b: Box): Pt => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 })

/** Tronçon de trace : courbe douce (une courbe de niveau, pas une règle) de a vers b. */
export function trailPath(a: Pt, b: Pt): string {
  const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1
  const k = Math.min(60, d * 0.18)   // écart de la courbe, proportionnel à la distance, plafonné
  const cx = (a.x + b.x) / 2 - (dy / d) * k, cy = (a.y + b.y) / 2 + (dx / d) * k
  const f = (n: number) => Math.round(n * 10) / 10
  return `M${f(a.x)} ${f(a.y)}Q${f(cx)} ${f(cy)} ${f(b.x)} ${f(b.y)}`
}

/** Où poser le nom : au-dessus du viseur, sinon dessous ; aligné à gauche, sinon à droite s'il déborde. */
export function labelPlace(b: Box, vw: number, labelW = 240): { below: boolean; right: boolean } {
  return { below: b.y < 30, right: b.x + labelW > vw - 8 }
}

/** Taille des équerres : 10 px, réduite sur un petit élément (30 % du plus petit côté, 6 px au moins). */
export const cornerSize = (b: Box) => Math.max(6, Math.min(10, Math.min(b.w, b.h) * 0.3))

/** Type de déplacement : « glide » vers un voisin, « jump » (verrouillage) au loin ; trace seulement pour un passage d'une zone à une autre. */
export function moveKind(a: Pt, b: Pt, vw: number, vh: number, sameZone = false): { kind: 'glide' | 'jump'; trail: boolean } {
  const d = Math.hypot(b.x - a.x, b.y - a.y), far = WF_FAR * Math.hypot(vw, vh)
  return { kind: d > far ? 'jump' : 'glide', trail: !sameZone && d >= WF_TRAIL_MIN && d <= far }
}

/** Zones de la page (repères, groupes qui montrent déjà leur sélection) : la trace ne marque que le passage d'une zone à une autre. */
export const ZONE_SEL = '[role=tablist],[role=menu],[role=menubar],[role=radiogroup],[role=listbox],[role=toolbar],[role=tree],[role=grid],[role=tabpanel],[role=dialog],[role=region],dialog,header,nav,footer,aside,form,section,main'
/** Éléments interactifs (le reste, avec tabindex="-1", est une cible de focus programmé). */
export const INTERACTIVE_SEL = 'a[href],button,input,select,textarea,summary,iframe,[contenteditable=""],[contenteditable=true],[role=button],[role=link],[role=tab],[role=menuitem],[role=option],[role=checkbox],[role=radio],[role=switch],[role=slider],[role=spinbutton],[role=combobox],[role=textbox],[role=treeitem],[role=gridcell]'
const FIELD_SEL = 'input,select,textarea,[role=textbox],[role=combobox],[role=spinbutton],[role=slider]'

/** Texte réellement visible d'un élément (sans .sr-only ni aria-hidden). */
export function visibleText(el: Element): string {
  let out = ''
  const walk = (n: Node) => {
    if (n.nodeType === 3) { out += n.textContent ?? ''; return }
    if (n.nodeType !== 1) return
    const e = n as Element
    if (e !== el && (e.getAttribute('aria-hidden') === 'true' || e.classList.contains('sr-only') || e.classList.contains('visually-hidden'))) return
    n.childNodes.forEach(walk)
  }
  walk(el)
  return clean(out)
}

/** Le nom doit-il être affiché ? Seulement s'il n'est visible nulle part ailleurs. */
export function needsLabel(el: Element): boolean {
  if (el.matches(FIELD_SEL)) return false
  if (el.hasAttribute('data-tip') || el.hasAttribute('aria-describedby')) return false
  return visibleText(el).length === 0
}

/** Touches après lesquelles un déplacement du focus compte comme une navigation clavier. */
const NAV_KEYS = new Set(['Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Enter', ' ', 'Escape', 'PageUp', 'PageDown'])
export const isNavKey = (key: string) => NAV_KEYS.has(key)

const SVG = 'http://www.w3.org/2000/svg'

/** Lance le WAYFINDER sur la page (une seule fois). Renvoie une fonction d'arrêt. */
export function initWayfinder(doc: Document = document): Cleanup {
  const win = doc.defaultView
  if (!win || doc.getElementById('wayfinder')) return () => {}
  const root = doc.documentElement
  const reduce = win.matchMedia('(prefers-reduced-motion: reduce)')

  const wf = doc.createElement('div')
  wf.id = 'wayfinder'; wf.className = 'wf'
  wf.setAttribute('aria-hidden', 'true')
  const canPop = typeof (wf as HTMLElement & { showPopover?: unknown }).showPopover === 'function'
  if (canPop) wf.setAttribute('popover', 'manual')
  wf.innerHTML = '<svg class="wf-trail" focusable="false"></svg>'
    + '<div class="wf-v"><i class="wf-c wf-tl"></i><i class="wf-c wf-tr"></i><i class="wf-c wf-bl"></i><i class="wf-c wf-br"></i><i class="wf-n"></i><span class="wf-l"></span></div>'
  doc.body.appendChild(wf)
  const trail = wf.querySelector('.wf-trail') as SVGSVGElement
  const v = wf.querySelector('.wf-v') as HTMLElement
  const label = wf.querySelector('.wf-l') as HTMLElement

  let kb = false, keyAt = -1e9, el: HTMLElement | null = null, prevEl: Element | null = null, box: Box | null = null, shown = false
  let raf = 0, moveT = 0, labelT = 0, topDlg: Element | null = null, frame = 0

  const popUp = () => {   // (re)place le calque en haut de la couche supérieure : au-dessus d'une <dialog> ouverte après lui
    if (!canPop) return
    try { if (wf.matches(':popover-open')) wf.hidePopover(); wf.showPopover() } catch { /* calque retiré du DOM */ }
  }
  const setKb = (on: boolean) => {
    if (kb === on) return
    kb = on; root.classList.toggle('wf-kb', on)
    if (on) popUp()
    else { hide(); trail.replaceChildren(); el = null; prevEl = null; box = null }
  }
  const setShown = (on: boolean) => {   // viseur visible ⇔ html.wf-on (le contour natif se retire derrière lui)
    shown = on; v.classList.toggle('on', on); root.classList.toggle('wf-on', on)
    if (!on) label.classList.remove('on')
  }
  function hide() {
    setShown(false)
    cancelAnimationFrame(raf); raf = 0
  }
  const place = (b: Box) => {
    v.style.transform = `translate(${b.x.toFixed(1)}px,${b.y.toFixed(1)}px)`
    v.style.width = b.w.toFixed(1) + 'px'; v.style.height = b.h.toFixed(1) + 'px'
    v.style.setProperty('--wf-k', cornerSize(b).toFixed(1) + 'px')
  }
  const visible = (t: HTMLElement) => {
    const cv = (t as HTMLElement & { checkVisibility?: (o?: object) => boolean }).checkVisibility
    return cv ? cv.call(t, { checkOpacity: true, checkVisibilityCSS: true }) : true
  }
  function drawTrail(a: Pt, b: Pt) {
    if (reduce.matches) return
    const g = doc.createElementNS(SVG, 'g'); g.setAttribute('class', 'wf-seg')
    const p = doc.createElementNS(SVG, 'path'); p.setAttribute('d', trailPath(a, b)); p.setAttribute('class', 'wf-p')
    const w = doc.createElementNS(SVG, 'circle'); w.setAttribute('cx', a.x.toFixed(1)); w.setAttribute('cy', a.y.toFixed(1)); w.setAttribute('r', '3.5'); w.setAttribute('class', 'wf-w')
    g.append(p, w); trail.appendChild(g)
    while (trail.childElementCount > WF_TRAIL_MAX) trail.firstElementChild?.remove()
    win!.setTimeout(() => g.remove(), WF_TRAIL_MS + 50)
  }
  const track = () => {   // suit l'élément à chaque image (défilement, 3D qui bouge, carte qui glisse) ; s'arrête dès qu'il n'y a plus rien à suivre
    raf = 0
    if (!kb || !el) return
    if (doc.activeElement !== el || !el.isConnected) { hide(); return }
    const b = viseurBox(el.getBoundingClientRect())
    const ok = inView(b, win!.innerWidth, win!.innerHeight) && (frame++ % 10 !== 0 || visible(el))
    if (ok) {
      if (!box || Math.abs(b.x - box.x) + Math.abs(b.y - box.y) + Math.abs(b.w - box.w) + Math.abs(b.h - box.h) > 0.5) { box = b; place(b) }
      if (!shown) setShown(true)
    } else if (shown) setShown(false)
    raf = win!.requestAnimationFrame(track)
  }
  function moveTo(t: HTMLElement) {
    // cible de focus programmé (titre après changement de page, main…) : pas de viseur, elle garde son propre rendu
    if (t === doc.body || t === root || (t.tabIndex < 0 && !t.matches(INTERACTIVE_SEL))) { hide(); el = null; prevEl = null; return }
    const dlg = t.closest('dialog')
    const dlgChange = (dlg && (dlg as HTMLDialogElement).open ? dlg : null) !== topDlg
    if (dlgChange) { topDlg = dlg && (dlg as HTMLDialogElement).open ? dlg : null; trail.replaceChildren(); if (topDlg) popUp() }   // entrée / sortie de fenêtre : on repart d'une trace vierge
    const prev = shown && box && !dlgChange ? center(box) : null
    const b = viseurBox(t.getBoundingClientRect())
    const zone = t.parentElement?.closest(ZONE_SEL) ?? null, sameZone = !!zone && !!prevEl && prevEl.parentElement?.closest(ZONE_SEL) === zone
    el = t; prevEl = t
    if (!inView(b, win!.innerWidth, win!.innerHeight)) { box = b; if (!raf) raf = win!.requestAnimationFrame(track); return }
    const mk = prev ? moveKind(prev, center(b), win!.innerWidth, win!.innerHeight, sameZone) : { kind: 'jump' as const, trail: false }
    if (mk.trail) drawTrail(prev!, center(b))
    else if (mk.kind === 'jump') trail.replaceChildren()   // saut lointain : pas de longue ligne à travers l'écran
    const anim = reduce.matches ? '' : mk.kind === 'glide' ? 'wf-move' : 'wf-lock'
    v.classList.remove('wf-move', 'wf-lock'); if (anim) { void v.offsetWidth; v.classList.add(anim) }
    win!.clearTimeout(moveT); moveT = win!.setTimeout(() => v.classList.remove('wf-move', 'wf-lock'), 260)
    box = b; place(b); setShown(true)
    const name = needsLabel(t) ? wfName(t) : ''
    label.textContent = name
    const lp = labelPlace(b, win!.innerWidth)
    label.classList.toggle('below', lp.below); label.classList.toggle('right', lp.right)
    label.classList.toggle('on', !!name)
    win!.clearTimeout(labelT); if (name) labelT = win!.setTimeout(() => label.classList.remove('on'), WF_LABEL_MS)
    if (!raf) raf = win!.requestAnimationFrame(track)
  }

  const onKey = (e: KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return
    if (!isNavKey(e.key)) return
    keyAt = win!.performance.now()
    if (e.key === 'Tab') setKb(true)
  }
  const onFocus = (e: FocusEvent) => {
    const t = e.target as HTMLElement
    if (!kb && win!.performance.now() - keyAt < 400) setKb(true)   // flèches d'un menu, Entrée qui ouvre une fenêtre : le focus a bougé au clavier
    if (kb && t && t.nodeType === 1) moveTo(t)
  }
  const onBlur = () => { win!.setTimeout(() => { if (kb && (!doc.activeElement || doc.activeElement === doc.body)) hide() }, 0) }
  const onPointer = (e: PointerEvent) => { if (e.isTrusted) setKb(false) }
  const onWinBlur = () => hide()

  doc.addEventListener('keydown', onKey, true)
  doc.addEventListener('focusin', onFocus, true)
  doc.addEventListener('focusout', onBlur, true)
  doc.addEventListener('pointerdown', onPointer, true)
  win.addEventListener('blur', onWinBlur)

  return () => {
    doc.removeEventListener('keydown', onKey, true)
    doc.removeEventListener('focusin', onFocus, true)
    doc.removeEventListener('focusout', onBlur, true)
    doc.removeEventListener('pointerdown', onPointer, true)
    win.removeEventListener('blur', onWinBlur)
    cancelAnimationFrame(raf); win.clearTimeout(moveT); win.clearTimeout(labelT)
    root.classList.remove('wf-kb', 'wf-on'); wf.remove()
  }
}
