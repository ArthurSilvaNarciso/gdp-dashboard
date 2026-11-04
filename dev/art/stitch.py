import sys
from PIL import Image
# uso: stitch.py top.png bottom.png offset_src total_src_h width_src out_name
top, bot, off, H, W, name = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]), int(sys.argv[5]), sys.argv[6]
a, b = Image.open(top).convert('RGB'), Image.open(bot).convert('RGB')
s = a.width / W
out = Image.new('RGB', (a.width, round(H * s)))
out.paste(a, (0, 0)); out.paste(b, (0, round(off * s)))
# recorte 16:9 centralizado
w, h = out.size; th = round(w * 9 / 16)
if th <= h: y = (h - th) // 2; out = out.crop((0, y, w, y + th))
else: tw = round(h * 16 / 9); x = (w - tw) // 2; out = out.crop((x, 0, x + tw, h))
out.save(f'/home/claude/memory-app/dev/art/photos/{name}-src.png')
for size in (1280, 640):
    out.resize((size, size * 9 // 16), Image.LANCZOS).save(f'/home/claude/memory-app/img/{name}-{size}.webp', quality=80 if size == 640 else 78, method=6)
print(name, out.size)
