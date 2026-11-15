"""Fond du hero à partir d'une photo (Unsplash, Sylvain Mauroux : cordée sur une arête, licence Unsplash).
Recadrage 16:9 qui place la première alpiniste dans l'espace libre entre le texte (gauche) et la montre (droite)
du hero, ET entre la montre (gauche) et le texte (droite) de « S'équiper » ; la bande de gauche est prolongée
par réflexion floutée. Étalonnage nuit (heure bleue, ombres marine, lueur cuivrée) et jour (clair, aéré, crème).
Usage : python3 -I hero-photo.py <photo.jpg> <dossier_sortie>
Produit hero-cordee-{dark,light}{,-m}.webp (2000x1125 et 1000x563). Déterministe."""
import sys
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter

SRC, OUT = sys.argv[1], sys.argv[2]
W, H = 2400, 1350
rng = np.random.default_rng(20261114)

# --- 1. composition -------------------------------------------------------------------------------------
src = Image.open(SRC).convert('RGB')
S = 0.90                                   # largeur de la photo / largeur du canevas
A = 0.214                                  # début de la photo (fraction de la largeur) : alpiniste 1 vers x = .43-.55
iw = int(W * S)
ih = int(iw * src.height / src.width)
im = np.asarray(src.resize((iw, ih), Image.LANCZOS), np.float32) / 255
y0 = 30
im = im[y0:y0 + H]
if im.shape[0] < H:
    im = np.pad(im, ((0, H - im.shape[0]), (0, 0), (0, 0)), mode='edge')
x0 = int(W * A)
canvas = np.zeros((H, W, 3), np.float32)
w_in = min(iw, W - x0)
canvas[:, x0:x0 + w_in] = im[:, :w_in]
# bande gauche : réflexion de la photo, floutée de plus en plus vers le bord, fondue sur 160 px
refl = im[:, :x0][:, ::-1]
cols = np.linspace(1, 0, x0)[None, :, None]                # 1 au bord de la photo, 0 au bord de l'image
blur = np.stack([gaussian_filter(refl[..., c], (14, 14)) for c in range(3)], -1)
refl = refl * (1 - .55 * (1 - cols)) + blur * (.55 * (1 - cols))
canvas[:, :x0] = refl
seam = np.linspace(0, 1, 160)[None, :, None]
canvas[:, x0 - 80:x0 + 80] = canvas[:, x0 - 80:x0 + 80] * seam + np.stack(
    [gaussian_filter(canvas[:, x0 - 80:x0 + 80, c], (3, 3)) for c in range(3)], -1) * (1 - seam)

yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
X, Y = xx / W, yy / H


def lin(c): return np.where(c <= .04045, c / 12.92, ((c + .055) / 1.055) ** 2.4)
def srgb(c): c = np.clip(c, 0, 1); return np.where(c <= .0031308, c * 12.92, 1.055 * c ** (1 / 2.4) - .055)
def luma(c): return (.2126 * c[..., 0] + .7152 * c[..., 1] + .0722 * c[..., 2])[..., None]
def smooth(a, b, x): t = np.clip((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t)
def hexl(h): h = h.lstrip('#'); return lin(np.array([int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)], np.float32))


def tame_magenta(c, k=.65):
    """le rose du pic de droite (dominante) est ramené vers un cuivre chaud"""
    m = np.clip(np.minimum(c[..., 0], c[..., 2]) - c[..., 1], 0, 1)[..., None]
    out = c.copy()
    out[..., 2] = c[..., 2] - k * m[..., 0]
    out[..., 0] = c[..., 0] - .12 * m[..., 0]
    return np.clip(out, 0, 1)


def sat(c, s): l = luma(c); return l + (c - l) * s


def bloom(c, thr, sigma, tint, amt):
    l = luma(c)[..., 0]
    m = np.clip((l - thr) / (1 - thr), 0, 1)
    g = gaussian_filter(m, sigma) * amt
    return c + g[..., None] * tint


def finish(c, grain):
    g = rng.normal(0, grain, (H, W))[..., None] + rng.normal(0, grain * .3, (H, W, 3))
    out = srgb(c)
    out = np.clip(out + g * (1 - .5 * out.mean(axis=2, keepdims=True)), 0, 1)
    return (out * 255 + .5).astype(np.uint8)


base = tame_magenta(canvas)

# --- 2. nuit : heure bleue, ombres marine, lueur cuivrée -------------------------------------------------
def dark():
    c = lin(base)
    c = c * .36                                                   # -1,5 IL
    l = luma(c)
    c = c * (1 + l / 1.2) / (1 + l)                               # épaule douce : les hautes lumières tiennent
    # ciel : plus froid, plus profond, moins saturé
    sky = smooth(.40, .0, Y)[..., None] * (1 - .35 * smooth(.35, .0, Y)[..., None])
    c = sat(c, 1 - .35 * sky) * (1 - .45 * sky)
    navy = hexl('#06101F')
    sh = smooth(.16, .0, luma(c))                                 # ombres : bascule vers le marine de la charte
    c = c * (1 - .55 * sh) + navy * (.55 * sh) * 1.4
    warm = np.array([1.10, 1.0, .82], np.float32)                 # hautes lumières : cuivre
    c = c * (1 + (warm - 1) * smooth(.10, .5, luma(c)))
    c = bloom(c, .16, 36, hexl('#E8873F') * 1.6, .55)
    # profondeur : vignette + assombrissement progressif vers le bas-gauche (zone du texte)
    r = np.hypot((X - .55) * 1.25, (Y - .45) * 1.0)
    c = c * (1 - .62 * smooth(.30, .95, r))[..., None]
    c = c * (1 - .30 * smooth(.75, 1.0, Y))[..., None]
    c = c * (1 - .22 * smooth(.45, .0, X))[..., None]
    c = np.maximum(c, navy * .6)
    return finish(c, .014)


# --- 3. jour : clair, aéré, crème ------------------------------------------------------------------------
def light():
    c = lin(base)
    c = c * 1.10
    l = luma(c)
    c = c / (1 + .35 * l)                                         # hautes lumières contenues
    cream = hexl('#F7EFE3')
    lift = smooth(.5, .0, luma(c))                                # ombres relevées, jamais noires
    c = c * (1 - .22 * lift) + cream * (.22 * lift) * .55
    c = sat(c, .95)
    warm = np.array([1.05, 1.0, .93], np.float32)
    c = c * warm
    # ciel et lointain fondus dans la crème (brume d'altitude)
    top = smooth(.45, .0, Y)[..., None]
    c = c * (1 - .50 * top) + cream * (.50 * top)
    far = (smooth(.50, .30, Y) * smooth(.12, .34, Y))[..., None]
    c = c * (1 - .20 * far) + cream * (.20 * far)
    c = bloom(c, .55, 40, hexl('#FFE2BC') * 1.2, .35)
    r = np.hypot((X - .55) * 1.25, (Y - .45) * 1.0)
    c = c * (1 - .10 * smooth(.45, 1.0, r))[..., None] + cream * (.10 * smooth(.45, 1.0, r))[..., None]
    return finish(c, .010)


for variant, fn in (('dark', dark), ('light', light)):
    a = fn()
    img = Image.fromarray(a)
    img.resize((2000, 1125), Image.LANCZOS).save(f'{OUT}/hero-cordee-{variant}.webp', quality=78, method=6)
    img.resize((1000, 563), Image.LANCZOS).save(f'{OUT}/hero-cordee-{variant}-m.webp', quality=74, method=6)
    img.save(f'{OUT}/_cordee-{variant}.png')
    print(variant, a.shape, round(float(a.mean()), 1))
