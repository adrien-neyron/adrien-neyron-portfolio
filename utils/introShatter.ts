/**
 * Transition d'intro « craquelure et chute » (voir docs/intro-craquelure.md).
 *
 * Le panneau d'intro (capturé en image, voir introSnapshot.ts) est découpé en éclats de glace / de roche
 * (diagramme de Voronoï calculé une fois en JavaScript). Tout le mouvement est ensuite calculé sur le GPU par le
 * vertex shader à partir d'un seul nombre, `uProgress` (0 → 1) : on peut donc rejouer, mettre en pause ou
 * remonter l'animation sans état à sauvegarder. Le fragment shader dessine les fissures et la réfraction des bords.
 *
 * WebGL 1 « brut », sans three.js : la transition tient dans quelques Ko et n'attend aucune dépendance lourde.
 * Le canvas est transparent : là où les éclats sont partis, on voit la page (la montre 3D) en dessous.
 */

export type Pt = [number, number]

export interface Shard {
  /** Sommets du polygone (sens trigonométrique), en unités « écran » : x ∈ [-aspect, aspect], y ∈ [-1, 1]. */
  poly: Pt[]
  center: Pt
  /** Trois nombres aléatoires stables propres à l'éclat (vitesse, rotation, gravité). */
  rand: [number, number, number]
}

/** Générateur pseudo-aléatoire déterministe (mulberry32) : mêmes éclats à chaque fois, tests reproductibles. */
export function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function polygonArea(poly: Pt[]): number {
  let s = 0
  for (let i = 0; i < poly.length; i++) {
    const [x1, y1] = poly[i]
    const [x2, y2] = poly[(i + 1) % poly.length]
    s += x1 * y2 - x2 * y1
  }
  return s / 2
}

function centroid(poly: Pt[]): Pt {
  const a = polygonArea(poly)
  if (Math.abs(a) < 1e-12) return poly[0]
  let cx = 0
  let cy = 0
  for (let i = 0; i < poly.length; i++) {
    const [x1, y1] = poly[i]
    const [x2, y2] = poly[(i + 1) % poly.length]
    const f = x1 * y2 - x2 * y1
    cx += (x1 + x2) * f
    cy += (y1 + y2) * f
  }
  return [cx / (6 * a), cy / (6 * a)]
}

/** Découpe un polygone convexe par le demi-plan { p : dot(p, n) <= c } (Sutherland–Hodgman). */
function clip(poly: Pt[], nx: number, ny: number, c: number): Pt[] {
  const out: Pt[] = []
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i]
    const q = poly[(i + 1) % poly.length]
    const dp = p[0] * nx + p[1] * ny - c
    const dq = q[0] * nx + q[1] * ny - c
    if (dp <= 0) out.push(p)
    if (dp <= 0 !== dq <= 0) {
      const t = dp / (dp - dq)
      out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t])
    }
  }
  return out
}

/**
 * Diagramme de Voronoï borné au rectangle [-aspect, aspect] × [-1, 1].
 * Graines plus serrées au centre (l'impact) et plus lâches vers les bords, puis deux passes de relaxation (Lloyd)
 * pour des éclats de taille homogène. Les polygones couvrent exactement l'écran, sans trou ni recouvrement.
 */
export function buildShards(aspect: number, count = 95, seed = 7): Shard[] {
  const rnd = rng(seed)
  const maxR = Math.hypot(aspect, 1)
  let seeds: Pt[] = []
  for (let i = 0; i < count; i++) {
    const r = Math.pow((i + rnd()) / count, 0.55) * maxR * 1.02
    const a = i * 2.399963 + rnd() * 0.9 // angle d'or : répartition régulière sans alignement
    seeds.push([Math.cos(a) * r, Math.sin(a) * r])
  }
  seeds = seeds.filter(([x, y]) => Math.abs(x) <= aspect * 1.04 && Math.abs(y) <= 1.04)
  const box: Pt[] = [[-aspect, -1], [aspect, -1], [aspect, 1], [-aspect, 1]]

  const cellOf = (i: number): Pt[] => {
    let poly = box
    const [sx, sy] = seeds[i]
    for (let j = 0; j < seeds.length && poly.length > 2; j++) {
      if (j === i) continue
      const [tx, ty] = seeds[j]
      // points plus proches de s_i que de s_j : dot(p, t - s) <= (|t|² - |s|²) / 2
      poly = clip(poly, tx - sx, ty - sy, (tx * tx + ty * ty - sx * sx - sy * sy) / 2)
    }
    return poly
  }

  for (let pass = 0; pass < 1; pass++) {
    seeds = seeds.map((_, i) => {
      const poly = cellOf(i)
      return poly.length > 2 ? centroid(poly) : seeds[i]
    })
  }

  const shards: Shard[] = []
  for (let i = 0; i < seeds.length; i++) {
    const poly = cellOf(i)
    if (poly.length < 3 || Math.abs(polygonArea(poly)) < 1e-6) continue
    shards.push({ poly, center: centroid(poly), rand: [rnd(), rnd(), rnd()] })
  }
  return shards
}

/**
 * Maillage : chaque éclat est une « éventail » de triangles partant de son centre.
 * Par sommet : position (2) · centre de l'éclat (2) · aléas (3) · distance au bord de l'éclat (1) = 8 flottants.
 * La distance au bord vaut 0 sur le contour et la distance du centre à l'arête au centre du triangle : interpolée,
 * elle donne en tout point la distance (en unités écran) à l'arête voisine, base des lignes de fissure.
 */
export function buildMesh(shards: Shard[]): { data: Float32Array; vertexCount: number } {
  const verts: number[] = []
  for (const s of shards) {
    const [cx, cy] = s.center
    const n = s.poly.length
    for (let i = 0; i < n; i++) {
      const a = s.poly[i]
      const b = s.poly[(i + 1) % n]
      const ex = b[0] - a[0]
      const ey = b[1] - a[1]
      const len = Math.hypot(ex, ey) || 1
      const h = Math.abs((cx - a[0]) * ey - (cy - a[1]) * ex) / len // distance du centre à l'arête (a, b)
      const push = (p: Pt, edge: number) => verts.push(p[0], p[1], cx, cy, s.rand[0], s.rand[1], s.rand[2], edge)
      push(s.center, h)
      push(a, 0)
      push(b, 0)
    }
  }
  return { data: new Float32Array(verts), vertexCount: verts.length / 8 }
}

/** Bruit simplex 2D (Ian McEwan / Ashima Arts, licence MIT) : ondulation organique de l'onde de choc et des bords. */
const NOISE = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec2 mod289(vec2 x){return x-floor(x*(1.0/289.0))*289.0;}
vec3 permute(vec3 x){return mod289(((x*34.0)+1.0)*x);}
float snoise(vec2 v){
  const vec4 C=vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);
  vec2 i=floor(v+dot(v,C.yy));
  vec2 x0=v-i+dot(i,C.xx);
  vec2 i1=(x0.x>x0.y)?vec2(1.0,0.0):vec2(0.0,1.0);
  vec4 x12=x0.xyxy+C.xxzz;
  x12.xy-=i1;
  i=mod289(i);
  vec3 p=permute(permute(i.y+vec3(0.0,i1.y,1.0))+i.x+vec3(0.0,i1.x,1.0));
  vec3 m=max(0.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.0);
  m=m*m;m=m*m;
  vec3 x=2.0*fract(p*C.www)-1.0;
  vec3 h=abs(x)-0.5;
  vec3 ox=floor(x+0.5);
  vec3 a0=x-ox;
  m*=1.79284291400159-0.85373472095314*(a0*a0+h*h);
  vec3 g;
  g.x=a0.x*x0.x+h.x*x0.y;
  g.yz=a0.yz*x12.xz+h.yz*x12.yw;
  return 130.0*dot(m,g);
}
`

/**
 * VERTEX SHADER — tout le mouvement des éclats, piloté par uProgress.
 *
 *  0 → ~0,34  les fissures partent du point d'impact (varying vCrack > 0 là où le front les a atteintes)
 *  0,14 → 1   les éclats se détachent anneau par anneau depuis le centre (délai croissant avec la distance,
 *             déformée par du bruit pour que le front soit irrégulier, pas un cercle parfait)
 *  chaque éclat : s'écarte du centre, ondule (sinus), tombe (gravité), tourne sur lui-même et « s'enfonce dans la caméra »
 *  (échelle et éloignement du centre qui grandissent avec la profondeur simulée zc), puis s'efface.
 */
export const VERTEX_SHADER = /* glsl */ `
precision highp float;
attribute vec2 aPos;
attribute vec2 aCenter;
attribute vec3 aRand;
attribute float aEdge;
uniform float uProgress;
uniform float uAspect;
uniform float uR;
uniform vec2 uEpi;
varying vec2 vUv;
varying float vEdge;
varying vec3 vRand;
varying float vT;
varying float vCrack;
varying float vAlpha;
${NOISE}
void main(){
  vec2 epi = uEpi;                                    // point d'impact (par défaut juste au-dessus du centre ; la montre quand elle est à droite)
  vec2 rel = aCenter - epi;
  float dist = length(rel);
  float ang = atan(rel.y, rel.x);
  vec2 cs = vec2(cos(ang), sin(ang));

  // 1) front de l'onde de choc, déformé par du bruit (FBM à 2 octaves sur l'angle) : irrégulier, organique
  float wob = 1.0 + 0.28*snoise(cs*1.7+3.1) + 0.12*snoise(cs*4.3);
  float front = (dist / uR) / wob;                     // 0 au centre, ~1 aux coins
  float front01 = clamp(front/1.35, 0.0, 1.0);

  // 2) phase « fissures » : le réseau se propage plus vite que les éclats ne se détachent
  float crackP = smoothstep(0.0, 0.34, uProgress);
  vCrack = crackP*1.25 - front;                        // > 0 : déjà fissuré ici

  // 3) phase « chute » : progression locale t de l'éclat (0 = en place, 1 = parti)
  float delay = 0.10 + 0.50*front01 + 0.05*aRand.x;
  float t = clamp((uProgress - delay) / 0.34, 0.0, 1.0);
  float te = t*t;                                      // accélération (gravité)

  vec2 dir = normalize(rel + vec2(1e-4) + (aRand.xy-0.5)*0.25);
  vec2 perp = vec2(-dir.y, dir.x);
  float wave = sin(t*7.0 + aRand.y*6.2831 + dist*4.0);
  vec2 off = dir*te*(0.55+0.9*aRand.x)                 // écartement radial
           + perp*wave*0.07*t                           // ondulation latérale
           + vec2(0.0,-1.0)*te*(0.35+0.9*aRand.z);      // gravité

  // tremblement avant détachement : l'éclat « travaille » sous la fissure
  float pre = smoothstep(0.0, 0.15, vCrack) * (1.0 - step(0.0001, t));
  off += vec2(snoise(aCenter*30.0+uProgress*40.0), snoise(aCenter*30.0+9.0+uProgress*40.0))*0.0045*pre;

  float th = (aRand.y-0.5)*3.2*te;                     // rotation propre
  float c = cos(th), s = sin(th);
  mat2 R = mat2(c, s, -s, c);
  float zc = te*(0.5+1.2*aRand.x);                     // profondeur simulée : vers la caméra
  float sc = 1.0 + zc*1.4;

  vec2 local = aPos - aCenter;
  vec2 world = (aCenter + off)*(1.0 + zc*0.6) + R*local*sc;
  gl_Position = vec4(world.x/uAspect, world.y, 0.0, 1.0);

  vUv = vec2(aPos.x/uAspect*0.5+0.5, aPos.y*0.5+0.5);  // l'image est lue à la position d'origine de l'éclat
  vEdge = aEdge;
  vRand = aRand;
  vT = t;
  vAlpha = 1.0 - smoothstep(0.72, 1.0, t);
}
`

/**
 * FRAGMENT SHADER — fissures, réfraction, reflets de bord.
 *  - fissure fine : là où la distance au bord de l'éclat est petite ET où le front de fissure est passé ;
 *  - lueur autour de la fissure (braise la nuit, bleu de roche le jour : uMode) ;
 *  - réfraction « verre brisé » : l'image est lue légèrement décalée (bruit) près des bords, de plus en plus
 *    à mesure que l'éclat s'écarte ;
 *  - reflet clair sur l'arête et assombrissement léger selon l'éclat pour casser l'aplat.
 * Sortie en alpha pré-multiplié (canvas transparent).
 */
export const FRAGMENT_SHADER = /* glsl */ `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D uTex;
uniform float uMode;     // 0 = jour (fond clair), 1 = nuit (fond sombre)
uniform vec3 uBrand;     // jeton --brand : couleur de la fissure (cuivre la nuit, ardoise le jour)
uniform vec3 uAcc;       // jeton --acc : lueur autour de la fissure
uniform float uPx;       // taille d'un pixel en unités écran
varying vec2 vUv;
varying float vEdge;
varying vec3 vRand;
varying float vT;
varying float vCrack;
varying float vAlpha;
${NOISE}
void main(){
  float cracked = clamp(vCrack*7.0, 0.0, 1.0);          // 0 intact → 1 fissuré
  float nearEdge = 1.0 - smoothstep(0.0, uPx*26.0, vEdge);

  // réfraction : décalage de lecture de l'image, nul tant que rien n'est fissuré
  vec2 n = vec2(snoise(vUv*9.0 + vRand.xy*11.0), snoise(vUv*9.0 + 17.0 + vRand.yz*11.0));
  vec2 uv = vUv + n * 0.010 * nearEdge * cracked * (0.35 + vT*1.8);
  vec3 col = texture2D(uTex, uv).rgb;

  // fissure fine + lueur
  float w = uPx*(0.5 + 0.8*cracked + 3.0*vT);
  float line = (1.0 - smoothstep(w, w + uPx*1.6, vEdge)) * cracked;
  float glow = (1.0 - smoothstep(0.0, uPx*14.0, vEdge)) * cracked * (1.0 - vT);
  col = mix(col, uAcc, glow*0.16);
  col = mix(col, uBrand, line*0.92);

  // reflet d'arête et variation d'éclat (plus marqués une fois détaché)
  float bevel = (1.0 - smoothstep(0.0, uPx*5.0, vEdge)) * vT;
  col += mix(vec3(-0.10), vec3(0.28,0.36,0.46), uMode) * bevel;
  col *= 1.0 - vT*0.22*(0.5 + 0.5*sin(vRand.x*6.2831 + vT*3.0));

  gl_FragColor = vec4(col, 1.0) * vAlpha;               // alpha pré-multiplié
}
`

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!
  gl.shaderSource(sh, src)
  gl.compileShader(sh)
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh)
    gl.deleteShader(sh)
    throw new Error(`Shader : ${log}`)
  }
  return sh
}

export interface ShatterOptions {
  /** 0 = thème jour, 1 = thème nuit. */
  mode: 0 | 1
  /** Couleurs de la charte (jetons --brand et --acc), composantes 0 → 1. */
  brand: [number, number, number]
  accent: [number, number, number]
  /** Nombre d'éclats visé (le diagramme en produit un peu moins une fois borné à l'écran). */
  count?: number
}

/** Dessine l'image de départ en éclats ; `render(p)` positionne tout à la progression p (0 → 1). */
export class ShatterRenderer {
  private gl: WebGLRenderingContext
  private program: WebGLProgram
  private buffer: WebGLBuffer
  private texture: WebGLTexture
  private vertexCount: number
  private aspect: number
  private uProgress: WebGLUniformLocation
  private uEpi: WebGLUniformLocation
  private uR: WebGLUniformLocation
  private lost = false
  private onLost = (e: Event) => { e.preventDefault(); this.lost = true }

  constructor(private canvas: HTMLCanvasElement, image: TexImageSource, opts: ShatterOptions) {
    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, powerPreference: 'high-performance' })
    if (!gl) throw new Error('WebGL indisponible')
    this.gl = gl
    canvas.addEventListener('webglcontextlost', this.onLost)

    this.aspect = canvas.width / canvas.height
    const { data, vertexCount } = buildMesh(buildShards(this.aspect, opts.count ?? 95))
    this.vertexCount = vertexCount

    const program = gl.createProgram()!
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER))
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER))
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(`Programme : ${gl.getProgramInfoLog(program)}`)
    this.program = program
    gl.useProgram(program)

    this.buffer = gl.createBuffer()!
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer)
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
    const stride = 8 * 4
    const attr = (name: string, size: number, offset: number) => {
      const loc = gl.getAttribLocation(program, name)
      gl.enableVertexAttribArray(loc)
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, stride, offset * 4)
    }
    attr('aPos', 2, 0)
    attr('aCenter', 2, 2)
    attr('aRand', 3, 4)
    attr('aEdge', 1, 7)

    this.texture = gl.createTexture()!
    gl.bindTexture(gl.TEXTURE_2D, this.texture)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

    gl.uniform1i(gl.getUniformLocation(program, 'uTex'), 0)
    gl.uniform1f(gl.getUniformLocation(program, 'uAspect'), this.aspect)
    gl.uniform1f(gl.getUniformLocation(program, 'uMode'), opts.mode)
    gl.uniform3f(gl.getUniformLocation(program, 'uBrand'), ...opts.brand)
    gl.uniform3f(gl.getUniformLocation(program, 'uAcc'), ...opts.accent)
    gl.uniform1f(gl.getUniformLocation(program, 'uPx'), 2 / canvas.height)
    this.uEpi = gl.getUniformLocation(program, 'uEpi')!
    this.uR = gl.getUniformLocation(program, 'uR')!
    this.setEpicenter(0, 0.06)
    this.uProgress = gl.getUniformLocation(program, 'uProgress')!

    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA) // alpha pré-multiplié
    gl.clearColor(0, 0, 0, 0)
  }

  /** Point d'impact, en unités écran (x ∈ [-aspect, aspect], y ∈ [-1, 1]) ; la portée du front de fissure suit le coin le plus lointain. */
  setEpicenter(x: number, y: number) {
    const gl = this.gl
    const far = Math.max(Math.hypot(this.aspect + Math.abs(x), 1 + Math.abs(y)), 0.5)
    gl.uniform2f(this.uEpi, x, y)
    gl.uniform1f(this.uR, far)
  }

  get contextLost() { return this.lost }

  render(progress: number) {
    if (this.lost) return
    const gl = this.gl
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.uniform1f(this.uProgress, progress)
    gl.drawArrays(gl.TRIANGLES, 0, this.vertexCount)
  }

  /** Libère tout ce qui occupe le GPU : buffer, texture, programme, puis le contexte lui-même. */
  dispose() {
    const gl = this.gl
    this.canvas.removeEventListener('webglcontextlost', this.onLost)
    gl.deleteBuffer(this.buffer)
    gl.deleteTexture(this.texture)
    gl.deleteProgram(this.program)
    gl.getExtension('WEBGL_lose_context')?.loseContext()
  }
}
