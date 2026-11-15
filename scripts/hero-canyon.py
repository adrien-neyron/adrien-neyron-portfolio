"""Fond du hero : paroi minérale rendue procéduralement (aucune image tierce, donc aucune licence à citer).
Dalles fracturées (Voronoï) à facettes inclinées, fissures, strates, veines de quartz, grain et piqûres de la roche,
taches d'oxyde, éclairage rasant avec ombres portées.
Usage : python3 -I hero-canyon.py <dossier_sortie>
Produit hero-canyon-{dark,light}{,-m}.webp. Déterministe (graine fixe)."""
import sys
import numpy as np
from scipy.ndimage import gaussian_filter, map_coordinates
from scipy.spatial import cKDTree
from PIL import Image

OUT = sys.argv[1]
W, H = 2400, 1350
rng = np.random.default_rng(20261114)
TH = np.deg2rad(-24)
ky = np.fft.fftfreq(H)[:, None]
kx = np.fft.rfftfreq(W)[None, :]
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)


def spec(beta, stretch, theta, kmin, kmax):
    """champ fractal périodique, étiré selon theta, normalisé (moyenne 0, écart-type 1)"""
    c, s_ = np.cos(theta), np.sin(theta)
    u = kx * c + ky * s_
    v = -kx * s_ + ky * c
    k = np.sqrt((u * stretch) ** 2 + v ** 2) + 1e-9
    amp = k ** (-beta / 2) * (k > kmin) * np.exp(-(k / kmax) ** 4)
    ph = rng.normal(size=amp.shape) + 1j * rng.normal(size=amp.shape)
    f = np.fft.irfft2(amp * ph, s=(H, W))
    return ((f - f.mean()) / f.std()).astype(np.float32)


def warp(f, dxf, dyf, amt):
    return map_coordinates(f, [(yy + dyf * amt) % H, (xx + dxf * amt) % W], order=1, mode='wrap')


def worley(cell, stretch, theta, jit=.85):
    """Voronoï anisotrope : renvoie F1, F2 (en pixels), identifiant de cellule, position relative au germe"""
    c, s_ = np.cos(theta), np.sin(theta)
    # repère tourné/étiré : les dalles sont allongées le long de theta
    u = (xx * c + yy * s_) / stretch
    v = (-xx * s_ + yy * c)
    pad = 3
    nu0, nu1 = u.min() - pad * cell, u.max() + pad * cell
    nv0, nv1 = v.min() - pad * cell, v.max() + pad * cell
    gu = np.arange(nu0, nu1, cell)
    gv = np.arange(nv0, nv1, cell)
    GU, GV = np.meshgrid(gu, gv)
    pts = np.stack([GU.ravel() + (rng.random(GU.size) - .5) * cell * jit * 2,
                    GV.ravel() + (rng.random(GV.size) - .5) * cell * jit * 2], axis=1)
    tree = cKDTree(pts)
    d, idx = tree.query(np.stack([u.ravel(), v.ravel()], axis=1), k=2, workers=-1)
    f1 = d[:, 0].reshape(H, W).astype(np.float32)
    f2 = d[:, 1].reshape(H, W).astype(np.float32)
    cid = idx[:, 0].reshape(H, W)
    du = (u - pts[cid, 0]).astype(np.float32)
    dv = (v - pts[cid, 1]).astype(np.float32)
    return f1, f2, cid, du, dv, len(pts)


# --- 1. relief : dalles à facettes inclinées + fissures + strates -------------------------------------
wa = spec(3.0, 2.0, TH, .0003, .0022)
wb = spec(3.0, 2.0, TH, .0003, .0022)
fa = warp(spec(2.4, 1.0, 0, .0006, .004), wa, wb, 90)   # déformation douce des fissures (pas de lignes droites)

# grandes dalles (~300 px) et blocs moyens (~95 px)
F1a, F2a, ida, dua, dva, na = worley(430, 1.9, TH)
F1b, F2b, idb, dub, dvb, nb = worley(170, 1.6, TH + .25)
ra = np.random.default_rng(7).random((na, 4)).astype(np.float32)
rb = np.random.default_rng(8).random((nb, 4)).astype(np.float32)

# plan incliné propre à chaque dalle : donne des facettes qui accrochent la lumière différemment
tilt_a = (ra[ida, 0] - .5) * 1.5 * dua + (ra[ida, 1] - .5) * 1.5 * dva
step_a = (ra[ida, 2] - .5) * 150
tilt_b = (rb[idb, 0] - .5) * .45 * dub + (rb[idb, 1] - .5) * .45 * dvb
step_b = (rb[idb, 2] - .5) * 36

edge_a = F2a - F1a
edge_b = F2b - F1b
crack_a = np.exp(-edge_a / 5.5)                      # fissure fine, profonde
crack_b = np.exp(-edge_b / 3.6)
chip = np.clip(1 - edge_a / 26, 0, 1) ** 2           # arêtes écornées des dalles (arrondi)

# strates : lits horizontaux (selon TH), légèrement ondulés ; marches nettes
yr = -xx * np.sin(TH) + yy * np.cos(TH)
bed = yr * .011 + fa * .18
ledge = (bed - np.floor(bed))
ledge = np.clip((ledge - .82) / .18, 0, 1) ** 1.5    # marche en haut de chaque lit
strata_h = np.floor(bed) * 5 + ledge * 6

# grain de la roche : piqûres et rugosité à plusieurs échelles
g1 = spec(1.4, 1.0, 0, .02, .18)
g2 = spec(1.0, 1.0, 0, .08, .45)
pit = np.clip(g2 - 1.1, 0, None)                     # petits creux isolés
grain = g1 * 1.1 + g2 * .8 - pit * 3.0

# profondeur d'érosion à grande échelle (sculpte les masses)
mass = spec(3.4, 1.8, TH, .0004, .003)

h = (mass * 80 + tilt_a + step_a + tilt_b + step_b + strata_h + chip * 12
     - crack_a * 40 - crack_b * 6 + grain * .7)
h = gaussian_filter(h, .6).astype(np.float32)


# --- 2. éclairage rasant + ombres portées -----------------------------------------------------------------
def shade(h, light_dir, elev, zs):
    gy, gx = np.gradient(h * zs)
    n = np.dstack([-gx, -gy, np.ones_like(h)])
    n /= np.linalg.norm(n, axis=2, keepdims=True)
    L = np.array([light_dir[0], light_dir[1], elev])
    L /= np.linalg.norm(L)
    dif = np.clip(n @ L, 0, 1)
    dx, dy = -light_dir[0], -light_dir[1]
    nrm = np.hypot(dx, dy)
    dx, dy = dx / nrm, dy / nrm
    sh = np.zeros_like(h)
    slope = elev / np.hypot(light_dir[0], light_dir[1])
    for k in range(2, 96, 2):
        sx = np.roll(h, (int(round(-dy * k)), int(round(-dx * k))), axis=(0, 1))
        sh = np.maximum(sh, np.clip((sx - h - k * slope * 1.0) / 14.0, 0, 1))
    return dif, gaussian_filter(sh, 1.2)


dif, sh = shade(h, (-.85, -.42), .55, 1.0)
ao_big = h - gaussian_filter(h, 26)
ao = np.clip(.55 + ao_big / 55, 0, 1)
ao = ao * (1 - .35 * np.clip(crack_a + crack_b * .7, 0, 1))   # fissures sombres

# --- 3. matière : teintes par dalle, oxydes, veines ---------------------------------------------------------
cell_tone = (ra[ida, 3] - .5) * .9 + (rb[idb, 3] - .5) * .5       # dalle plus claire / plus sombre
oxide = spec(3.0, 1.4, TH, .0005, .004)                           # taches d'oxyde (rouille / graphite)
lichen = np.clip(spec(2.2, 1.0, 0, .004, .05) - .9, 0, None)       # mouchetures sombres
vein_f = warp(spec(3.2, 1.6, TH + .4, .0006, .004), wb, wa, 60)
vein = np.exp(-(vein_f / .045) ** 2)                               # fines veines claires (quartz)
vein *= np.clip(spec(2, 1, 0, .001, .01) * .7 + .5, 0, 1)         # veines discontinues
dust = np.clip(-g1 * .5 + .3, 0, 1)                                # poussière dans les creux de grain


def ramp(t, stops):
    t = np.clip(t, 0, 1)
    xs_ = np.array([s[0] for s in stops])
    out = np.zeros(t.shape + (3,), np.float32)
    for c in range(3):
        out[..., c] = np.interp(t, xs_, [s[1][c] for s in stops])
    return out


def hexrgb(s):
    s = s.lstrip('#')
    return tuple(int(s[i:i + 2], 16) / 255 for i in (0, 2, 4))


def render(variant):
    if variant == 'dark':
        stops = [(0, hexrgb('#07060A')), (.16, hexrgb('#1A0E0F')), (.40, hexrgb('#4B2316')),
                 (.64, hexrgb('#8F4222')), (.84, hexrgb('#D1763F')), (1, hexrgb('#F8C494'))]
        expo, fill, haze, hz, vign = 1.9, .09, np.array(hexrgb('#6E2F22')), .26, .60
        cool = np.array(hexrgb('#3B3340'))      # graphite froid pour les oxydes sombres
    else:
        stops = [(0, hexrgb('#6E3E2E')), (.25, hexrgb('#A65A38')), (.5, hexrgb('#D08354')),
                 (.75, hexrgb('#EBAD7F')), (1, hexrgb('#F8D9B8')), ]
        expo, fill, haze, hz, vign = 1.08, .15, np.array(hexrgb('#F0D2BA')), .26, .14
        cool = np.array(hexrgb('#8A6A5E'))
    light = dif * (1 - .62 * sh) * (.55 + .45 * ao)
    light = light * (1 + cell_tone * .5) * (1 - .12 * np.clip(lichen, 0, 1.2)) * (1 - .14 * dust)
    light = np.clip(light * expo + fill * ao, 0, 1)
    img = ramp(light, stops)
    # oxydes : bascule vers un graphite froid dans les zones ox<0, vers un ocre plus chaud dans ox>0
    ox = np.clip(oxide * .35, -1, 1)
    cold = np.clip(-ox, 0, 1)[..., None] * .2
    img = img * (1 - cold) + cool * img.mean(axis=2, keepdims=True) * 1.2 * cold
    img[..., 0] *= (1 + .06 * np.clip(ox, 0, 1)); img[..., 2] *= (1 - .08 * np.clip(ox, 0, 1))
    # veines claires (recevant la lumière) et reflets de quartz
    v = (vein * (.25 + .75 * dif))[..., None]
    img = img * (1 - .55 * v) + np.array(hexrgb('#F4E2CC')) * (.55 * v) * (.8 if variant == 'dark' else .9)
    # arêtes éclairées : liseré clair sur les faces tournées vers la lumière
    rim = np.clip(chip * (dif - .55), 0, 1)[..., None] * .22
    img = img + rim * (1 - img)
    # brume : plus dense en haut à gauche (loin), absente en bas à droite
    gv_ = np.clip(1 - (yy / H) * 1.25 - (xx / W) * .35 + .15, 0, 1) ** 1.6
    img = img * (1 - hz * gv_[..., None]) + haze * (hz * gv_[..., None])
    if variant == 'dark':
        glow = np.exp(-(((xx / W - .18) / .35) ** 2 + ((yy / H - .02) / .30) ** 2))
        img += glow[..., None] * np.array(hexrgb('#B8532A')) * .20
    r = np.hypot((xx / W - .5) * 1.15, (yy / H - .5) * 1.0)
    img *= (1 - vign * np.clip((r - .35) / .65, 0, 1) ** 1.6)[..., None]
    # grain fin (luminance) + très léger bruit chroma
    gr = rng.normal(0, .016, (H, W))[..., None] + rng.normal(0, .004, (H, W, 3))
    img = np.clip(img + gr * (1 - .5 * img.mean(axis=2, keepdims=True)), 0, 1)
    return (img * 255 + .5).astype(np.uint8)


for variant in ('dark', 'light'):
    a = render(variant)
    im = Image.fromarray(a)
    im.resize((2000, 1125), Image.LANCZOS).save(f'{OUT}/hero-canyon-{variant}.webp', quality=72, method=6)
    im.resize((1000, 563), Image.LANCZOS).save(f'{OUT}/hero-canyon-{variant}-m.webp', quality=68, method=6)
    im.save(f'{OUT}/_preview-{variant}.png')
    print(variant, a.shape, round(float(a.mean()), 1))
