"""Fond du hero à partir de deux images de gorge (jour doré / nuit étoilée, générées avec Gemini, 1306 x 816).
Nettoyage des artefacts visibles (points blancs sur la roche, lumières parasites, éclat bleu trop net),
débruitage du JPEG, agrandissement en 2400 x 1350 avec renforcement du micro-contraste et grain photographique,
puis étalonnage aux couleurs de la charte (nuit : marine, hautes lumières cuivrées ; jour : crème, ombres chaudes).
Ne retire PAS les marqueurs de provenance invisibles éventuels de l'image d'origine (voir docs).
Usage : python3 -I hero-gorge.py <jour.jpg> <nuit.jpg> <dossier_sortie>
Produit hero-gorge-{dark,light}{,-m}.webp (2000x1125 et 1000x563). Déterministe."""
import sys
import numpy as np
import cv2
from PIL import Image
from scipy.ndimage import gaussian_filter

DAY, NIGHT, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
W, H = 2400, 1350
rng = np.random.default_rng(20261115)


def load(p): return cv2.cvtColor(cv2.imread(p), cv2.COLOR_BGR2RGB)


def lin(c): return np.where(c <= .04045, c / 12.92, ((c + .055) / 1.055) ** 2.4)
def srgb(c): c = np.clip(c, 0, 1); return np.where(c <= .0031308, c * 12.92, 1.055 * c ** (1 / 2.4) - .055)
def luma(c): return (.2126 * c[..., 0] + .7152 * c[..., 1] + .0722 * c[..., 2])[..., None]
def smooth(a, b, x): t = np.clip((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t)
def hexl(h): h = h.lstrip('#'); return lin(np.array([int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)], np.float32))
def sat(c, s): l = luma(c); return l + (c - l) * s


def clean_night(img):
    """points blancs isolés sur la roche, petites lumières lointaines, éclat bleu : retirés ou atténués"""
    h, w = img.shape[:2]
    v = img.max(axis=2)
    # 1) points très clairs en dessous de l'horizon (y > 105) hors zone du ciel
    m = ((v > 190) & (np.arange(h)[:, None] > 105)).astype(np.uint8)
    # 2) lumières lointaines à l'horizon (gauche) : petits points clairs entre y 100 et 130
    m2 = ((v > 150) & (np.arange(h)[:, None] > 98) & (np.arange(h)[:, None] < 135) & (np.arange(w)[None, :] < 400)).astype(np.uint8)
    m = cv2.dilate(m | m2, np.ones((5, 5), np.uint8))
    out = cv2.inpaint(img, m, 4, cv2.INPAINT_TELEA)
    # 3) éclat bleu de l'arête : cœur retiré, halo atténué
    core = np.zeros((h, w), np.uint8)
    cv2.circle(core, (1082, 162), 11, 1, -1)
    out = cv2.inpaint(out, core, 6, cv2.INPAINT_TELEA)
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    d = np.hypot(xx - 1082, yy - 162)
    k = (1 - .55 * np.exp(-(d / 60) ** 2))[..., None]
    out = np.clip(out.astype(np.float32) * k, 0, 255).astype(np.uint8)
    return out


def upscale(img):
    img = cv2.fastNlMeansDenoisingColored(img, None, 3, 3, 5, 15)      # blocs JPEG et plaques lisses
    f = W / img.shape[1]
    up = cv2.resize(img, (W, int(round(img.shape[0] * f))), interpolation=cv2.INTER_LANCZOS4)
    return up


def crop(up, top):
    return up[top:top + H].astype(np.float32) / 255


def micro(c, amt=.5, rad=1.3):
    """renforcement du micro-contraste (netteté de la roche) + texture fine proportionnelle au relief local"""
    out = np.empty_like(c)
    for k in range(3):
        b = gaussian_filter(c[..., k], rad)
        out[..., k] = c[..., k] + (c[..., k] - b) * amt
    g = np.hypot(*np.gradient(gaussian_filter(luma(c)[..., 0], 1.0)))
    g = gaussian_filter(g, 3)
    g = g / (g.max() + 1e-6)
    tex = gaussian_filter(rng.normal(0, 1, (H, W)), .7)
    out += (tex * g * .022)[..., None]
    return np.clip(out, 0, 1)


def finish(c, grain):
    gr = rng.normal(0, grain, (H, W))[..., None] + rng.normal(0, grain * .3, (H, W, 3))
    o = srgb(c)
    o = np.clip(o + gr * (1 - .5 * o.mean(axis=2, keepdims=True)), 0, 1)
    return (o * 255 + .5).astype(np.uint8)


yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
X, Y = xx / W, yy / H

# --- nuit -----------------------------------------------------------------------------------------------
night = clean_night(load(NIGHT))
c = micro(crop(upscale(night), 0), .55)
c = lin(c)
navy = hexl('#06101F')
l = luma(c)
c = c * 1.5; l = luma(c); c = c / (1 + .22 * l)                 # exposition : la roche éclairée ressort, les creux restent profonds
sh = smooth(.05, 0, l)
c = c * (1 - .5 * sh) + navy * (.5 * sh) * 1.2                  # noirs bleu marine plutôt que noirs neutres
warm = np.array([1.10, 1.0, .85], np.float32)                   # roche éclairée : cuivre (en écho au bouton et au titre)
roc = smooth(.04, .30, l) * smooth(.30, .55, Y)[..., None]
c = c * (1 + (warm - 1) * roc)
c = sat(c, .95)
r = np.hypot((X - .55) * 1.2, (Y - .5) * 1.0)
c = c * (1 - .5 * smooth(.35, 1.0, r))[..., None]
c = c * (1 - .28 * smooth(.8, 1.0, Y))[..., None]
night_img = finish(np.maximum(c, navy * .5), .014)

# --- jour -----------------------------------------------------------------------------------------------
day = load(DAY)
c = micro(crop(upscale(day), 30), .5)
c = lin(c)
cream = hexl('#F7EFE3')
l = luma(c)
c = c * 1.06 / (1 + .12 * l)
lift = smooth(.15, 0, l)
c = c * (1 - .2 * lift) + hexl('#3A2418') * (.2 * lift)         # ombres brun chaud, pas noires
c = sat(c, .93)
top = smooth(.40, .0, Y)[..., None]
c = c * (1 - .45 * top) + cream * (.45 * top)                   # ciel fondu dans la crème de la charte
far = (smooth(.55, .25, Y) * smooth(.08, .3, Y))[..., None]
c = c * (1 - .14 * far) + cream * (.14 * far)
r = np.hypot((X - .55) * 1.2, (Y - .5) * 1.0)
c = c * (1 - .12 * smooth(.45, 1.0, r))[..., None] + cream * (.12 * smooth(.45, 1.0, r))[..., None] * .6
day_img = finish(c, .010)

for variant, a in (('dark', night_img), ('light', day_img)):
    img = Image.fromarray(a)
    img.resize((2000, 1125), Image.LANCZOS).save(f'{OUT}/hero-gorge-{variant}.webp', quality=78, method=6)
    img.resize((1000, 563), Image.LANCZOS).save(f'{OUT}/hero-gorge-{variant}-m.webp', quality=74, method=6)
    img.save(f'{OUT}/_gorge-{variant}.png')
    print(variant, a.shape, round(float(a.mean()), 1))
