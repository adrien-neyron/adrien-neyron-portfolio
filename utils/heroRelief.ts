/**
 * Relief du fond de gorge éclairé par le curseur (premier écran et « S'équiper »).
 *
 * Principe : la photo du hero (`#hphoto`, jetons `--hero-photo*`) est redessinée par un petit shader WebGL qui en déduit un relief
 * (gradient de luminance à trois échelles), puis l'éclaire par une lumière rasante placée sous le curseur : les arêtes et les strates
 * face à la lumière s'allument, celles qui lui tournent le dos s'assombrissent, et le décor se décale légèrement selon sa hauteur
 * (parallaxe). Aucune carte de profondeur supplémentaire : la photo est la seule source.
 *
 * Amélioration progressive : sans curseur fin (tactile), avec `prefers-reduced-motion`, sur écran étroit, en vue statique ou sans WebGL,
 * rien n'est créé et la photo CSS reste telle quelle. À l'arrêt (lumière éteinte), le canvas est identique à la photo CSS.
 * Le canvas est décoratif (`aria-hidden`, hérité de #hphoto) : tout le contenu reste en HTML.
 * Coût : rendu à la demande seulement (curseur en mouvement ou lumière qui s'éteint), DPR ≤ 1,25, pause onglet masqué ou fond estompé.
 */

const VERT = 'attribute vec2 p;varying vec2 vUv;void main(){vUv=p*.5+.5;gl_Position=vec4(p,0.,1.);}'

const FRAG = `precision highp float;
uniform sampler2D uImg;uniform vec2 uRes,uImgSize,uM,uPar;uniform float uS,uLight;
varying vec2 vUv;
float H(vec2 t){return dot(texture2D(uImg,t).rgb,vec3(.299,.587,.114));}
vec2 grad(vec2 t,float r){vec2 e=vec2(r)/uImgSize;return vec2(H(t+vec2(e.x,0.))-H(t-vec2(e.x,0.)),H(t+vec2(0.,e.y))-H(t-vec2(0.,e.y)));}
void main(){
  float asp=uRes.x/uRes.y;
  vec2 sz=uImgSize*max(uRes.x/uImgSize.x,uRes.y/uImgSize.y);
  vec2 t=(vUv*uRes-uRes*.5)/sz+.5;                       // même cadrage que background-size:cover, centré
  t=(t-.5)/(1.+.035*uS)+.5;                              // léger zoom quand la lumière est active (évite les bords avec la parallaxe)
  float h0=H(t);
  t+=uPar*(h0-.5)*.05*uS;                                 // parallaxe : ce qui est haut bouge plus que ce qui est bas
  vec3 alb=texture2D(uImg,t).rgb;
  vec2 g=grad(t,1.2)*.5+grad(t,3.5)*.35+grad(t,9.)*.25;  // relief fin, moyen, large
  vec3 n=normalize(vec3(-g*uLight*5.5,1.));
  vec2 d=(uM-vUv)*vec2(asp,1.);
  vec3 L=normalize(vec3(d,.32));
  float flat0=L.z,diff=clamp(dot(n,L),0.,1.5);
  float r2=dot(d,d);
  float fall=exp(-r2/(2.*.2*.2)),wide=exp(-r2/(2.*.6*.6));
  float relief=(diff-flat0);
  float spec=pow(clamp(dot(n,normalize(L+vec3(0.,0.,1.))),0.,1.),22.)*fall;
  vec3 warm=mix(vec3(1.,.70,.44),vec3(1.,.82,.58),step(.5,uLight-1.));
  vec3 col=alb;
  if(uLight<1.5){   // nuit : l'extérieur de la lumière s'enfonce, l'intérieur s'éclaire et sculpte les arêtes
    col*=1.-.24*uS*(1.-wide);
    col+=alb*(.28*fall+relief*1.9*fall)*uS*warm;
    col+=warm*spec*.34*uS*(.4+h0);
  }else{            // jour : relief par ombrage (arêtes éclairées / ombrées), halo chaud discret
    col*=1.-.07*uS*(1.-wide);
    col*=1.+relief*1.35*fall*uS;
    col+=warm*(spec*.22+fall*.045)*uS;
  }
  gl_FragColor=vec4(clamp(col,0.,1.),1.);
}`

type Cleanup = () => void

function url(el: Element): string {
  const m = /url\(["']?([^"')]+)["']?\)/.exec(getComputedStyle(el).backgroundImage)
  return m ? m[1] : ''
}

export function initHeroRelief(): Cleanup {
  const noop = () => {}
  const host = document.getElementById('hphoto')
  if (!host || typeof WebGLRenderingContext === 'undefined') return noop
  const fine = matchMedia('(pointer:fine) and (hover:hover)')
  const reduce = matchMedia('(prefers-reduced-motion:reduce)')
  const wide = matchMedia('(min-width:900px)')
  const usable = () => fine.matches && !reduce.matches && wide.matches && !document.body.classList.contains('static')
  if (!usable()) return noop

  const cv = document.createElement('canvas')
  cv.className = 'hrelief'
  cv.setAttribute('aria-hidden', 'true')
  const gl = cv.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' })
  if (!gl) return noop

  const sh = (type: number, src: string) => {
    const s = gl.createShader(type)!
    gl.shaderSource(s, src)
    gl.compileShader(s)
    return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null
  }
  const vs = sh(gl.VERTEX_SHADER, VERT), fs = sh(gl.FRAGMENT_SHADER, FRAG)
  if (!vs || !fs) return noop
  const prog = gl.createProgram()!
  gl.attachShader(prog, vs)
  gl.attachShader(prog, fs)
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return noop
  gl.useProgram(prog)
  const buf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)   // un seul triangle plein écran
  const loc = gl.getAttribLocation(prog, 'p')
  gl.enableVertexAttribArray(loc)
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
  const U = (n: string) => gl.getUniformLocation(prog, n)
  const uRes = U('uRes'), uImgSize = U('uImgSize'), uM = U('uM'), uPar = U('uPar'), uS = U('uS'), uLight = U('uLight')

  const tex = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, tex)
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)

  let ready = false, dead = false, raf = 0, imgW = 1, imgH = 1, light = 1, loaded = ''
  const m = { x: .6, y: .5, tx: .6, ty: .5, s: 0, ts: 0 }
  let lastMove = 0

  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 1.25)
    const w = Math.max(2, Math.round(host!.clientWidth * dpr)), h = Math.max(2, Math.round(host!.clientHeight * dpr))
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h }
    gl!.viewport(0, 0, w, h)
  }

  function draw() {
    if (!ready || dead) return
    resize()
    gl!.uniform2f(uRes, cv.width, cv.height)
    gl!.uniform2f(uImgSize, imgW, imgH)
    gl!.uniform2f(uM, m.x, m.y)
    gl!.uniform2f(uPar, m.x - .5, m.y - .5)
    gl!.uniform1f(uS, m.s)
    gl!.uniform1f(uLight, light)
    gl!.drawArrays(gl!.TRIANGLES, 0, 3)
  }

  let prev = 0
  function frame(ts: number) {
    raf = 0
    if (dead) return
    const dt = Math.min(.05, (ts - (prev || ts)) / 1000)
    prev = ts
    const k = 1 - Math.exp(-dt * 9), ks = 1 - Math.exp(-dt * (m.ts > m.s ? 4 : 2.2))   // la lumière s'allume vite et s'éteint doucement
    m.x += (m.tx - m.x) * k
    m.y += (m.ty - m.y) * k
    m.s += (m.ts - m.s) * ks
    if (Math.abs(m.ts - m.s) < .003 && m.ts === 0) m.s = 0
    draw()
    if (m.s > 0 || Math.abs(m.tx - m.x) > .0005 || Math.abs(m.ty - m.y) > .0005) raf = requestAnimationFrame(frame)
    else prev = 0
  }
  const kick = () => { if (!raf && !dead && ready) raf = requestAnimationFrame(frame) }

  const photoVisible = () => !document.hidden && parseFloat(getComputedStyle(host!).opacity) > .05 && host!.clientWidth > 0

  function onMove(e: PointerEvent) {
    if (e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen') return
    if (!photoVisible()) { m.ts = 0; return kick() }
    const r = host!.getBoundingClientRect()
    m.tx = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width))
    m.ty = Math.min(1, Math.max(0, 1 - (e.clientY - r.top) / r.height))
    if (m.ts === 0 && m.s === 0) { m.x = m.tx; m.y = m.ty }   // la lumière naît sous le curseur, elle ne traverse pas l'écran
    m.ts = 1
    lastMove = performance.now()
    kick()
  }
  function off() { m.ts = 0; kick() }
  const idle = setInterval(() => { if (m.ts && performance.now() - lastMove > 2500) off() }, 800)   // curseur immobile : la lumière s'éteint doucement

  function load() {
    const u = url(host!)
    if (!u || u === loaded) return
    loaded = u
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => {
      if (dead || u !== loaded) return
      gl!.bindTexture(gl!.TEXTURE_2D, tex)
      gl!.pixelStorei(gl!.UNPACK_FLIP_Y_WEBGL, true)
      gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA, gl!.RGBA, gl!.UNSIGNED_BYTE, img)
      imgW = img.naturalWidth
      imgH = img.naturalHeight
      light = /light/.test(u) ? 2 : 1
      ready = true
      draw()
      cv.classList.add('on')
    }
    img.src = u
  }

  host.insertBefore(cv, host.firstChild)
  load()
  const mo = new MutationObserver(load)   // jour ↔ nuit : les jetons changent d'image
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] })
  addEventListener('pointermove', onMove, { passive: true })
  document.addEventListener('pointerleave', off)
  addEventListener('blur', off)
  addEventListener('resize', draw, { passive: true })
  const onMq = () => { if (!usable()) { m.ts = 0; m.s = 0; draw(); cv.classList.remove('on') } else if (ready) cv.classList.add('on') }
  fine.addEventListener('change', onMq)
  reduce.addEventListener('change', onMq)
  wide.addEventListener('change', onMq)

  return () => {
    dead = true
    cancelAnimationFrame(raf)
    clearInterval(idle)
    mo.disconnect()
    removeEventListener('pointermove', onMove)
    document.removeEventListener('pointerleave', off)
    removeEventListener('blur', off)
    removeEventListener('resize', draw)
    fine.removeEventListener('change', onMq)
    reduce.removeEventListener('change', onMq)
    wide.removeEventListener('change', onMq)
    cv.remove()
    gl.getExtension('WEBGL_lose_context')?.loseContext()
  }
}

/** Premier écran épuré : tant que le visiteur n'a pas défilé, horloge, rail d'altitude et ligne de copyright s'effacent (classe `at-hero` sur <html>). */
export function initHeroClean(): Cleanup {
  const root = document.documentElement
  const upd = () => root.classList.toggle('at-hero', scrollY < innerHeight * .6)
  upd()
  addEventListener('scroll', upd, { passive: true })
  addEventListener('resize', upd, { passive: true })
  return () => {
    removeEventListener('scroll', upd)
    removeEventListener('resize', upd)
    root.classList.remove('at-hero')
  }
}
