import sys
from PIL import Image
# uso: cover.py captura.png nome  -> img/<nome>-1280.webp e -640.webp (16:9)
src, name = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGB')
w, h = im.size; th = round(w * 9 / 16)
if th <= h: y = (h - th) // 2; im = im.crop((0, y, w, y + th))
else: tw = round(h * 16 / 9); x = (w - tw) // 2; im = im.crop((x, 0, x + tw, h))
im.save(f'/home/claude/memory-app/dev/art/photos/{name}-src.png')
for size in (1280, 640):
    im.resize((size, size * 9 // 16), Image.LANCZOS).save(f'/home/claude/memory-app/img/{name}-{size}.webp', quality=80 if size == 640 else 78, method=6)
print(name, im.size)
