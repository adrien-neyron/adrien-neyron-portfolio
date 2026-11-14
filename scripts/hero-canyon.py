"""Fond du hero : relief de grès rendu procéduralement (aucune image tierce, donc aucune licence à citer).
Usage : python3 -I canyon.py <sortie_dir>
Produit hero-canyon-{dark,light}{,-m}.webp. Déterministe (graine fixe)."""
import sys, numpy as np
from scipy.ndimage import zoom, gaussian_filter, map_coordinates
from PIL import Image

OUT = sys.argv[1]
W, H = 2400, 1350
rng = np.random.default_rng(20261114)

def noise(shape, cells, rng):
    """bruit lisse (grille aléatoire interpolée en bicubique), valeurs 0..1"""
    g = rng.random((cells[1] + 3, cells[0] + 3))
    z = zoom(g, (shape[0] / cells[1], shape[1] / cells[0]), order=3, mode='reflect')
    z = z[:shape[0], :shape[1]]
    z = (z - z.min()) / (z.max() - z.min())
    return z

def fbm(shape, base, octaves, rng, gain=.5, lac=2.0):
    s = np.zeros(shape); a = 1.0; tot = 0; c = np.array(base, float)
    for _ in range(octaves):
        s += a * noise(shape, (max(2, int(c[0])), max(2, int(c[1]))), rng); tot += a
        a *= gain; c *= lac
    return s / tot

shape = (H, W)
ky = np.fft.fftfreq(H)[:, None]; kx = np.fft.rfftfreq(W)[None, :]

def spec(beta, stretch, theta, kmin, kmax, rng):
    """champ fractal périodique (sans couture), étiré selon theta : formes allongées comme des dunes"""
    c, s_ = np.cos(theta), np.sin(theta)
    u = kx * c + ky * s_; v = -kx * s_ + ky * c
    k = np.sqrt((u * stretch) ** 2 + v ** 2) + 1e-9
    amp = k ** (-beta / 2) * (k > kmin) * np.exp(-(k / kmax) ** 4)
    ph = rng.normal(size=amp.shape) + 1j * rng.normal(size=amp.shape)
    f = np.fft.irfft2(amp * ph, s=(H, W))
    return (f - f.mean()) / f.std()

def warp(f, dxf, dyf, amt):
    yy_, xx_ = np.mgrid[0:H, 0:W].astype(np.float32)
    return map_coordinates(f, [(yy_ + dyf * amt) % H, (xx_ + dxf * amt) % W], order=1, mode='wrap')

yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
TH = np.deg2rad(-24)
wa = spec(3.0, 2.0, TH, .0003, .0022, rng); wb = spec(3.0, 2.0, TH, .0003, .0022, rng)
f1 = spec(3.6, 3.2, TH, .0004, .0021, rng)         # grandes crêtes
f2 = spec(3.2, 2.6, TH, .0008, .0045, rng)           # crêtes moyennes
f3 = spec(2.6, 1.6, TH, .004, .03, rng)            # détail
f1 = warp(f1, wa, wb, 300); f2 = warp(f2, wb, wa, 140)
r1 = (1 - np.abs(np.tanh(f1 * .9))) ** 1.8          # crêtes vives, creux doux
r2 = (1 - np.abs(np.tanh(f2 * .9))) ** 2.0
h = r1 * 1.0 + r2 * .14 + f3 * .002
h = gaussian_filter(h, .7)
h = (h - h.min()) / (h.max() - h.min())
D = (xx / W) * .85 + (yy / H) * .55
fbm = lambda shp, base, octv, rng_: .5 + .5 * np.tanh(spec(2.2, 1.0, 0, .01, .25, rng_) * .6)
noise = None

# 2. ombrage rasant (lumière haute-gauche) + ombres portées + occlusion
def shade(h, light_dir, elev, zs):
    gy, gx = np.gradient(h * zs)
    n = np.dstack([-gx, -gy, np.ones_like(h)])
    n /= np.linalg.norm(n, axis=2, keepdims=True)
    L = np.array([light_dir[0], light_dir[1], elev]); L /= np.linalg.norm(L)
    dif = np.clip(n @ L, 0, 1)
    # ombre portée : marche de l'horizon le long de la lumière
    dx, dy = -light_dir[0], -light_dir[1]
    nrm = np.hypot(dx, dy); dx, dy = dx / nrm, dy / nrm
    sh = np.zeros_like(h)
    slope = elev / np.hypot(light_dir[0], light_dir[1]) * 1.0
    for k in range(2, 90, 2):
        sx = np.roll(h, (int(round(-dy * k)), int(round(-dx * k))), axis=(0, 1))
        sh = np.maximum(sh, np.clip((sx * zs / 900.0 - h * zs / 900.0 - k * slope / 900.0 * .9) * 160, 0, 1))
    return dif, gaussian_filter(sh, 1.6), n

dif, sh, nrm = shade(h, (-.85, -.42), .5, 520)
ao = np.clip(.5 + 3.2 * (h - gaussian_filter(h, 22)), 0, 1)   # cavités plus sombres
# 3. micro-relief de sable : rides fines orientées le long des crêtes + grain
rip = np.sin((D * 520) + spec(2.4, 1.0, 0, .004, .05, rng) * 5)
fine = .5 + .5 * np.tanh(spec(1.6, 1.0, 0, .08, .4, rng) * .8)
micro = .5 + .5 * (.55 * rip * (1 - np.abs(2 * dif - 1) * .3) + .45 * (fine * 2 - 1))
# strates de grès (variation de teinte)
strata = .5 + .5 * np.sin(h * 38 + spec(3, 1.4, TH, .002, .02, rng) * 2.2)

def ramp(t, stops):
    t = np.clip(t, 0, 1)
    xs = np.array([s[0] for s in stops]); out = np.zeros(t.shape + (3,))
    for c in range(3):
        out[..., c] = np.interp(t, xs, [s[1][c] for s in stops])
    return out

def hexrgb(s):
    s = s.lstrip('#'); return tuple(int(s[i:i + 2], 16) / 255 for i in (0, 2, 4))

def render(variant):
    if variant == 'dark':
        stops = [(0, hexrgb('#06050A')), (.18, hexrgb('#1B0B0C')), (.42, hexrgb('#5A2111')), (.66, hexrgb('#A5461C')), (.86, hexrgb('#E27C3C')), (1, hexrgb('#FFC48A'))]
        expo = 1.75; haze = np.array(hexrgb('#7A3224')); hz = .30; vign = .6; fill = .10
    else:
        stops = [(0, hexrgb('#7C4430')), (.25, hexrgb('#B0613A')), (.5, hexrgb('#D98A57')), (.75, hexrgb('#EDB07F')), (1, hexrgb('#FADBB8'))]
        expo = 1.05; haze = np.array(hexrgb('#F2D3BB')); hz = .30; vign = .14; fill = .16
    light = dif * (1 - .55 * sh) * (.6 + .4 * ao)
    light = light * (.8 + .2 * strata) * (.93 + .07 * micro)
    light = np.clip(light * expo + fill * ao, 0, 1) ** (1.0 if variant == 'light' else 1.0)
    img = ramp(light, stops)
    # teinte : strates plus chaudes / plus froides
    img[..., 2] *= (.93 + .1 * strata); img[..., 1] *= (.97 + .05 * strata)
    # brume atmosphérique : plus dense en haut à gauche (loin), absente en bas à droite
    gv = np.clip(1 - (yy / H) * 1.25 - (xx / W) * .35 + .15, 0, 1) ** 1.6
    img = img * (1 - hz * gv[..., None]) + haze * (hz * gv[..., None])
    # lueur d'horizon chaude
    glow = np.exp(-(((xx / W - .18) / .35) ** 2 + ((yy / H - .02) / .30) ** 2))
    if variant == 'dark':
        img += glow[..., None] * np.array(hexrgb('#B8532A')) * .22
    # vignette
    r = np.hypot((xx / W - .5) * 1.15, (yy / H - .5) * 1.0)
    img *= (1 - vign * np.clip((r - .35) / .65, 0, 1) ** 1.6)[..., None]
    # grain argentique (luminance) + très léger bruit chroma
    g = rng.normal(0, .014, (H, W))[..., None] + rng.normal(0, .004, (H, W, 3))
    img = np.clip(img + g * (1 - .5 * img.mean(axis=2, keepdims=True)), 0, 1)
    return (img * 255 + .5).astype(np.uint8)

for variant in ('dark', 'light'):
    a = render(variant)
    im = Image.fromarray(a)
    im.resize((2000, 1125), Image.LANCZOS).save(f'{OUT}/hero-canyon-{variant}.webp', quality=66, method=6)
    im.resize((1000, 563), Image.LANCZOS).save(f'{OUT}/hero-canyon-{variant}-m.webp', quality=64, method=6)
    im.save(f'{OUT}/_preview-{variant}.png')
    print(variant, a.shape, a.mean())
