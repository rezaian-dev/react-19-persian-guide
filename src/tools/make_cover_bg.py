"""Build src/cover-bg.jpg: AI plate (stars/bokeh/aurora, lower part of cover_bg_d.png) + a procedurally
rendered React atom (exact react.dev geometry, fully inside the page) + readability scrims."""
import math, random, sys, os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

SRC = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'cover-plate.png')
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'cover-bg.jpg')
W, H = 1240, 1754                       # A4 @150 dpi
ATOM_W = 0.38                           # atom width as a fraction of the page width
CORE_Y = 0.155                          # core position (fraction of the page height)
random.seed(19)

# ---------------- plate ----------------
src = Image.open(SRC).convert('RGB')
plate = src.crop((24, 0, 872, 1200)).resize((W, H), Image.LANCZOS)
pl = np.asarray(plate).astype(np.float32)
y_join = int(0.40 * H); fade = 160
base_col = pl[y_join:y_join + 40].mean(axis=(0, 1)); top_col = np.array([4, 8, 20], dtype=np.float32)
top = np.empty_like(pl)
for y in range(H):
    t = np.clip(y / y_join, 0, 1); top[y] = top_col * (1 - t) + base_col * t
mix = np.zeros((H, 1, 1), dtype=np.float32)
mix[y_join - fade // 2:y_join + fade // 2] = np.linspace(0, 1, fade)[:, None, None]; mix[y_join + fade // 2:] = 1
arr = top * (1 - mix) + pl * mix

# ---------------- particles in the top zone ----------------
stars = Image.new('RGB', (W, H), (0, 0, 0)); d = ImageDraw.Draw(stars)
for _ in range(130):
    x, y = random.uniform(0, W), random.uniform(0, y_join); rr = random.choice([0.8, 1, 1, 1.3, 1.6]); a = random.randint(60, 200)
    d.ellipse((x - rr, y - rr, x + rr, y + rr), fill=(a, a, a))
arr += np.asarray(stars.filter(ImageFilter.GaussianBlur(0.6))).astype(np.float32) * np.array([0.86, 0.94, 1.0])

# ---------------- atom (procedural, react.dev geometry: rx 11, ry 4.2, 0/60/120 deg) ----------------
S = 4                                                # supersampling
unit = (W * ATOM_W) / 22.0                           # px per logo unit
cx, cy = W / 2, CORE_Y * H
def ellipse_pts(rot_deg, n=720):
    r = math.radians(rot_deg)
    return [(cx * S + (11 * unit * math.cos(t) * math.cos(r) - 4.2 * unit * math.sin(t) * math.sin(r)) * S,
             cy * S + (11 * unit * math.cos(t) * math.sin(r) + 4.2 * unit * math.sin(t) * math.cos(r)) * S)
            for t in np.linspace(0, 2 * math.pi, n)]
def stroke_layer(width_px, blur_px, color):
    im = Image.new('RGB', (W * S, H * S), (0, 0, 0)); dr = ImageDraw.Draw(im)
    for rot in (0, 60, 120): dr.line(ellipse_pts(rot), fill=color, width=max(1, int(width_px * S)), joint='curve')
    im = im.resize((W, H), Image.LANCZOS)
    return np.asarray(im.filter(ImageFilter.GaussianBlur(blur_px)) if blur_px else im).astype(np.float32)
light  = stroke_layer(2.6, 0.0, (150, 236, 255))         # crisp line
light += stroke_layer(4.0, 3.0, (70, 200, 245)) * 0.9     # tight bloom
light += stroke_layer(8.0, 14.0, (40, 160, 230)) * 0.7    # wide bloom
light += stroke_layer(14.0, 40.0, (20, 110, 190)) * 0.5   # atmosphere
# core: radial white -> cyan -> transparent
yy, xx = np.mgrid[0:H, 0:W]
rr = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2) / unit
core = np.clip(1 - rr / 1.15, 0, 1) ** 1.6
halo = np.exp(-(rr / 3.2) ** 2)
light += core[:, :, None] * np.array([235, 252, 255]) + halo[:, :, None] * np.array([40, 150, 220]) * 0.9
arr += light

# ---------------- readability scrims ----------------
img = Image.fromarray(np.clip(arr, 0, 255).astype('uint8'))
blurred = np.asarray(img.filter(ImageFilter.GaussianBlur(6))).astype(np.float32); arr = np.asarray(img).astype(np.float32)
ys = np.arange(H) / H
zone = np.clip((ys - 0.27) / 0.05, 0, 1) * np.clip((0.97 - ys) / 0.04, 0, 1)
card = np.clip((ys - 0.78) / 0.03, 0, 1) * np.clip((0.94 - ys) / 0.03, 0, 1)
blend = (zone * 0.55 + card * 0.45)[:, None, None]; arr = arr * (1 - blend) + blurred * blend
dark = (zone * 0.34 + card * 0.30)[:, None, None]; arr = arr * (1 - dark) + np.array([6, 10, 22], dtype=np.float32) * dark
out = Image.fromarray(np.clip(arr, 0, 255).astype('uint8')); out.save(OUT, quality=92, optimize=True, subsampling=0)

a = np.asarray(out).astype(int); cyan = (a[:, :, 2] > 190) & (a[:, :, 1] > 170) & (a[:, :, 0] < 200)
rows = np.nonzero(cyan[:int(0.5 * H)].any(axis=1))[0]; cols = np.nonzero(cyan[:int(0.5 * H)].any(axis=0))[0]
print('atom extent: top %.1f mm, bottom %.1f mm, left %.1f mm, right %.1f mm' % (rows.min() / H * 297, rows.max() / H * 297, cols.min() / W * 210, cols.max() / W * 210))
print(OUT, os.path.getsize(OUT), 'bytes')
