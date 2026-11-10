"""產生桌面圖示（紅中長貓耳，跟 index.html 的 LOGO 同一張）。用法：python3 tools/make_icons.py"""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
BG = '#1f1c30'
# (x, y, w, h, 顏色)，32×32 格
RECTS = [
    (7, 3, 2, 2, '#f6efe0'), (7, 5, 4, 2, '#f6efe0'), (9, 5, 1, 1, '#f9a8c8'),
    (23, 3, 2, 2, '#f6efe0'), (21, 5, 4, 2, '#f6efe0'), (22, 5, 1, 1, '#f9a8c8'),
    (7, 7, 18, 22, '#f6efe0'), (7, 27, 18, 2, '#2f9e6e'),
    (15, 9, 2, 16, '#d6334f'), (10, 12, 12, 2, '#d6334f'), (10, 12, 2, 7, '#d6334f'), (20, 12, 2, 7, '#d6334f'), (10, 17, 12, 2, '#d6334f'),
    (4, 20, 2, 1, '#4b4b5a'), (26, 20, 2, 1, '#4b4b5a'), (4, 22, 2, 1, '#4b4b5a'), (26, 22, 2, 1, '#4b4b5a'),
]

def draw(size, rounded):
    s = size / 32
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if rounded:
        d.rounded_rectangle([0, 0, size - 1, size - 1], radius=int(7 * s), fill=BG)
    else:
        d.rectangle([0, 0, size, size], fill=BG)
    for x, y, w, h, c in RECTS:
        d.rectangle([round(x * s), round(y * s), round((x + w) * s) - 1, round((y + h) * s) - 1], fill=c)
    return img

(ROOT / 'icons').mkdir(exist_ok=True)
draw(512, False).save(ROOT / 'icons/icon-512.png')
draw(192, False).save(ROOT / 'icons/icon-192.png')
draw(180, False).convert('RGB').save(ROOT / 'icons/apple-touch-icon.png')
draw(32, True).save(ROOT / 'icons/favicon-32.png')
print('icons/ 已產生')
