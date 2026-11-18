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
 *   un saut lointain.
 * - La trace (revue du 18/11/2026, « harmonieuse, ne coupe aucune information, bien visible ») : de bord à bord (jamais
 *   dans les éléments), sur la courbe qui traverse le moins de contenu, coupée là où elle passerait sur une lettre, une
 *   image ou un contrôle (comme une courbe de niveau coupée par une cote), points cerclés d'un halo de fond, dessinée du
 *   départ vers l'arrivée ; le tronçon précédent s'estompe ; rien entre deux onglets voisins ni d'un bout à l'autre de
 *   l'écran ; effacée au défilement et à l'entrée ou la sortie d'une fenêtre.
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
export const WF_TRAIL_MS = 1800
export const WF_TRAIL_MAX = 3
/** Viseur : glisse jusqu'à WF_FAR × la diagonale de la fenêtre, se verrouille au-delà. */
export const WF_FAR = 0.45
/** Trace : de WF_TRAIL_MIN px (bord à bord) à WF_TRAIL_FAR × la diagonale ; au-delà, une ligne traverserait tout l'écran. */
export const WF_TRAIL_MIN = 24
export const WF_TRAIL_FAR = 0.75
/** Écart entre la trace et le bord des éléments (px), pas d'échantillonnage pour les coupures (px), demi-largeur d'une coupure (px). */
export const WF_EDGE_GAP = 6
export const WF_SAMPLE = 5
export const WF_KNOCK = 7

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

/** Point de contrôle de la courbe a → b : écart de 18 % de la distance (60 px au plus), d'un côté (side = 1) ou de l'autre (-1). */
export function trailCtrl(a: Pt, b: Pt, side: 1 | -1 = 1): Pt {
  const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1
  const k = Math.min(60, d * 0.18) * side
  return { x: (a.x + b.x) / 2 - (dy / d) * k, y: (a.y + b.y) / 2 + (dx / d) * k }
}

/** Tronçon de trace : courbe douce (une courbe de niveau, pas une règle) de a vers b. */
export function trailPath(a: Pt, b: Pt, side: 1 | -1 = 1): string {
  const c = trailCtrl(a, b, side), f = (n: number) => Math.round(n * 10) / 10
  return `M${f(a.x)} ${f(a.y)}Q${f(c.x)} ${f(c.y)} ${f(b.x)} ${f(b.y)}`
}

/** Points de la courbe tous les `step` px environ (pour repérer ce qu'elle traverse). */
export function sampleCurve(a: Pt, b: Pt, side: 1 | -1 = 1, step = WF_SAMPLE): Pt[] {
  const c = trailCtrl(a, b, side), n = Math.max(2, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) * 1.1 / step)), out: Pt[] = []
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t
    out.push({ x: u * u * a.x + 2 * u * t * c.x + t * t * b.x, y: u * u * a.y + 2 * u * t * c.y + t * t * b.y })
  }
  return out
}

/** Point de départ (ou d'arrivée) de la trace : sur le bord du cadre, du côté de l'autre point, un peu à l'extérieur. Jamais dans l'élément. */
export function edgeAnchor(b: Box, toward: Pt, gap = WF_EDGE_GAP): Pt {
  const c = center(b), dx = toward.x - c.x, dy = toward.y - c.y
  if (!dx && !dy) return c
  const hw = b.w / 2 + gap, hh = b.h / 2 + gap
  const k = Math.min(dx ? hw / Math.abs(dx) : Infinity, dy ? hh / Math.abs(dy) : Infinity)
  return { x: c.x + dx * k, y: c.y + dy * k }
}

/** Bouts de trace trop courts entre deux coupures (moins de `min` points, ≈ 3 pointillés) : effacés aussi, sinon la ligne s'émiette entre deux lignes de texte. */
export function dropShort(covered: boolean[], min = 3): boolean[] {
  const out = covered.slice()
  for (let i = 0; i < out.length;) {
    if (out[i]) { i++; continue }
    let j = i; while (j < out.length && !out[j]) j++
    const touchesCut = i > 0 || j < out.length   // un trajet entièrement libre reste entier
    if (touchesCut && j - i < min) for (let k = i; k < j; k++) out[k] = true
    i = j
  }
  return out
}

/** Suites de points couverts (texte, image, contrôle) → tronçons à effacer de la trace, comme une courbe de niveau coupée par une cote. */
export function knockRuns(pts: Pt[], covered: boolean[]): Pt[][] {
  const runs: Pt[][] = []
  let cur: Pt[] | null = null
  pts.forEach((p, i) => {
    if (covered[i]) { if (!cur) { cur = []; runs.push(cur) } cur.push(p) } else cur = null
  })
  return runs
}

/** Où poser le nom : au-dessus du viseur, sinon dessous ; aligné à gauche, sinon à droite s'il déborde. */
export function labelPlace(b: Box, vw: number, labelW = 240): { below: boolean; right: boolean } {
  return { below: b.y < 30, right: b.x + labelW > vw - 8 }
}

/** Taille des équerres : 10 px, réduite sur un petit élément (30 % du plus petit côté, 6 px au moins). */
export const cornerSize = (b: Box) => Math.max(6, Math.min(10, Math.min(b.w, b.h) * 0.3))

/** Type de déplacement (centre à centre) : « glide » vers un voisin, « jump » (verrouillage) au loin ;
 *  trace (bord à bord, `gap`) sauf dans un groupe qui montre déjà sa sélection, ou pour une ligne qui traverserait tout l'écran. */
export function moveKind(a: Pt, b: Pt, vw: number, vh: number, sameGroup = false, gap = Infinity): { kind: 'glide' | 'jump'; trail: boolean } {
  const d = Math.hypot(b.x - a.x, b.y - a.y), diag = Math.hypot(vw, vh)
  return { kind: d > WF_FAR * diag ? 'jump' : 'glide', trail: !sameGroup && Math.min(gap, d) >= WF_TRAIL_MIN && d <= WF_TRAIL_FAR * diag }
}

/** Groupes qui montrent déjà leur sélection (onglets, menus…) : pas de trace entre deux de leurs éléments voisins. */
export const GROUP_SEL = '[role=tablist],[role=menu],[role=menubar],[role=radiogroup],[role=listbox],[role=toolbar],[role=tree],[role=grid]'
/** Ce que la trace ne doit jamais couper (en plus du texte) : contrôles, images. */
export const INFO_SEL = 'a[href],button,input,select,textarea,label,summary,img,picture,video,[role=button],[role=link],[role=tab],[role=img],[role=menuitem]'
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
  /** Le point (x, y) est-il sur une information (lettre, image, contrôle) ? On parcourt toute la pile d'éléments sous le point
   *  (les calques décoratifs du dessus — grain, canvas — ne masquent donc rien) et on regarde si une de leurs propres lettres
   *  est vraiment sous le point. */
  const range = doc.createRange()
  const probe = (x: number, y: number): boolean => {
    if (x < 0 || y < 0 || x >= win!.innerWidth || y >= win!.innerHeight) return false
    for (const e of doc.elementsFromPoint(x, y)) {
      if (e === doc.body || e === root) break
      if (wf.contains(e)) continue
      if (e.matches(INFO_SEL)) return true
      for (const n of e.childNodes) {
        if (n.nodeType !== 3 || !(n.textContent ?? '').trim()) continue
        range.selectNodeContents(n)
        for (const q of range.getClientRects()) if (x >= q.left - 3 && x <= q.right + 3 && y >= q.top - 2 && y <= q.bottom + 2) return true
      }
    }
    return false
  }
  let trailY = 0, segN = 0
  function drawTrail(from: Box, to: Box) {
    if (reduce.matches) return
    const a = edgeAnchor(from, center(to)), b = edgeAnchor(to, center(from))
    // deux courbes possibles (d'un côté ou de l'autre) : on garde celle qui traverse le moins d'informations
    root.classList.add('wf-probe')   // le temps du test, les textes « sans clic » (pointer-events: none) comptent aussi
    let best: { side: 1 | -1; pts: Pt[]; cov: boolean[]; n: number } | null = null
    for (const side of [1, -1] as const) {
      const pts = sampleCurve(a, b, side), cov = dropShort(pts.map((p) => probe(p.x, p.y))), n = cov.filter(Boolean).length
      if (!best || n < best.n) best = { side, pts, cov, n }
      if (!n) break
    }
    root.classList.remove('wf-probe')
    const { side, pts, cov } = best!
    if (cov.every(Boolean)) return   // tout le trajet passe sur du contenu : pas de trace plutôt qu'une trace invisible
    const id = 'wfm' + (++segN), vw = win!.innerWidth, vh = win!.innerHeight, dPath = trailPath(a, b, side)
    const knock = knockRuns(pts, cov).map((run) => `<polyline points="${run.map((p) => p.x.toFixed(1) + ',' + p.y.toFixed(1)).join(' ')}" fill="none" stroke="#000" stroke-width="${WF_KNOCK * 2}" stroke-linecap="round" stroke-linejoin="round"/>`).join('')
    const startFree = !cov[0]
    const g = doc.createElementNS(SVG, 'g'); g.setAttribute('class', 'wf-seg')
    // masque : la trace se dessine du départ vers l'arrivée (wf-draw), coupée là où elle passerait sur une information
    g.innerHTML = `<mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="${vw}" height="${vh}">`
      + `<path class="wf-draw" d="${dPath}" pathLength="1" fill="none" stroke="#fff" stroke-width="16" stroke-linecap="round"/>${knock}</mask>`
      + `<g class="wf-in" mask="url(#${id})"><path class="wf-h" d="${dPath}"/><path class="wf-p" d="${dPath}"/></g>`
      + (startFree ? `<g class="wf-in wf-wp"><circle cx="${a.x.toFixed(1)}" cy="${a.y.toFixed(1)}" r="4.5"/><circle class="wf-wd" cx="${a.x.toFixed(1)}" cy="${a.y.toFixed(1)}" r="1.6"/></g>` : '')
    trail.querySelectorAll('.wf-seg:not(.old)').forEach((o) => o.classList.add('old'))   // le tronçon précédent s'estompe : l'actif reste le plus lisible
    trail.appendChild(g); trailY = win!.scrollY
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
    // ancien waypoint : la position ACTUELLE de l'élément quitté (le focus a pu faire défiler la page), sinon le dernier cadre connu
    let from: Box | null = null
    if (shown && box && !dlgChange) {
      const pr = prevEl && prevEl.isConnected ? viseurBox(prevEl.getBoundingClientRect()) : null
      from = pr && inView(pr, win!.innerWidth, win!.innerHeight) ? pr : box
    }
    const b = viseurBox(t.getBoundingClientRect())
    const grp = t.closest(GROUP_SEL), sameGroup = !!grp && !!prevEl && grp.contains(prevEl)
    el = t; prevEl = t
    if (!inView(b, win!.innerWidth, win!.innerHeight)) { box = b; if (!raf) raf = win!.requestAnimationFrame(track); return }
    let gap = 0   // distance bord à bord entre l'ancien et le nouvel élément
    if (from) { const p1 = edgeAnchor(from, center(b), 0), p2 = edgeAnchor(b, center(from), 0); gap = Math.hypot(p2.x - p1.x, p2.y - p1.y) }
    const mk = from ? moveKind(center(from), center(b), win!.innerWidth, win!.innerHeight, sameGroup, gap) : { kind: 'jump' as const, trail: false }
    if (mk.trail) drawTrail(from!, b)
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
    // navigation au clavier (Tab, flèches, Espace, Page haut/bas…) : la barre de progression de l'accueil reste affichée pour le
    // reste de la visite, même après un clic (html.wf-nav, jamais retirée) ; le viseur, lui, garde sa règle (wf-kb)
    root.classList.add('wf-nav')
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
  const fadeTrail = () => {   // défilement ou redimensionnement : la trace s'efface vite plutôt que de rester décalée de son trajet
    if (!trail.firstChild || trail.classList.contains('gone')) return
    trail.classList.add('gone'); win!.setTimeout(() => { trail.replaceChildren(); trail.classList.remove('gone') }, 200)
  }
  const onScroll = () => { if (Math.abs(win!.scrollY - trailY) > 24) fadeTrail() }

  doc.addEventListener('keydown', onKey, true)
  doc.addEventListener('focusin', onFocus, true)
  doc.addEventListener('focusout', onBlur, true)
  doc.addEventListener('pointerdown', onPointer, true)
  win.addEventListener('blur', onWinBlur)
  win.addEventListener('scroll', onScroll, { passive: true })
  win.addEventListener('resize', fadeTrail)

  return () => {
    doc.removeEventListener('keydown', onKey, true)
    doc.removeEventListener('focusin', onFocus, true)
    doc.removeEventListener('focusout', onBlur, true)
    doc.removeEventListener('pointerdown', onPointer, true)
    win.removeEventListener('blur', onWinBlur)
    win.removeEventListener('scroll', onScroll)
    win.removeEventListener('resize', fadeTrail)
    cancelAnimationFrame(raf); win.clearTimeout(moveT); win.clearTimeout(labelT)
    root.classList.remove('wf-kb', 'wf-on', 'wf-probe', 'wf-nav'); wf.remove()
  }
}
