# Imagem de destaque da Play Store (1024×500) a partir das capturas reais e da identidade do app.
from PIL import Image, ImageDraw, ImageFont, ImageFilter
F = '/tmp/claude-0/-home-claude/bb4201d1-86ae-53d3-b9e7-0bd93a0ff471/scratchpad/fonts/'
W, H = 1024, 500; S = 2  # desenha em 2x e reduz
img = Image.new('RGB', (W * S, H * S), '#1F2A6B'); d = ImageDraw.Draw(img)
d.ellipse((W * S - 360 * S, -200 * S, W * S + 120 * S, 280 * S), fill='#FF7A1A')
d.ellipse((-140 * S, 360 * S, 180 * S, 680 * S), fill='#2C3A85')
P8 = ImageFont.truetype(F + 'Poppins-800.ttf', 84 * S); N7 = ImageFont.truetype(F + 'Nunito-700.ttf', 31 * S); N6 = ImageFont.truetype(F + 'Nunito-600.ttf', 21 * S)
x0 = 56 * S
d.text((x0, 92 * S), 'Memory', font=P8, fill='white')
lines = ['Aulas, questões e um plano', 'até o dia da sua prova']
for i, t in enumerate(lines): d.text((x0, 212 * S + i * 42 * S), t, font=N7, fill='white')
chips = ['Edital verticalizado', 'Revisão espaçada']; cx = x0
for t in chips:
    w = d.textlength(t, font=N6) + 28 * S
    d.rounded_rectangle((cx, 330 * S, cx + w, 368 * S), radius=19 * S, fill='#2C3A85'); d.text((cx + 14 * S, 337 * S), t, font=N6, fill='#DDE3FF'); cx += w + 10 * S
def phone(path, x, y, h):
    sc = Image.open(path).convert('RGB'); w = int(sc.size[0] * h / sc.size[1]); sc = sc.resize((w, h), Image.LANCZOS)
    pad = 9 * S; frame = Image.new('RGBA', (w + 2 * pad, h + 2 * pad), (0, 0, 0, 0)); fd = ImageDraw.Draw(frame)
    fd.rounded_rectangle((0, 0, w + 2 * pad - 1, h + 2 * pad - 1), radius=34 * S, fill='#0D1233')
    m = Image.new('L', (w, h), 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, w - 1, h - 1), radius=27 * S, fill=255); frame.paste(sc, (pad, pad), m)
    sh = Image.new('RGBA', (frame.size[0] + 60 * S, frame.size[1] + 60 * S), (0, 0, 0, 0)); ImageDraw.Draw(sh).rounded_rectangle((30 * S, 40 * S, frame.size[0] + 30 * S, frame.size[1] + 30 * S), radius=34 * S, fill=(0, 0, 0, 120))
    sh = sh.filter(ImageFilter.GaussianBlur(18 * S)); img.paste(sh, (x - 30 * S, y - 30 * S), sh); img.paste(frame, (x, y), frame)
phone('android/store/4-edital.png', 610 * S, 70 * S, 470 * S)
phone('android/store/1-inicio.png', 790 * S, 30 * S, 500 * S)
img.resize((W, H), Image.LANCZOS).save('android/store/feature-graphic.png', optimize=True)
print('ok')
