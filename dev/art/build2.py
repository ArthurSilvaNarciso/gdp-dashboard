from PIL import Image, ImageFilter
import numpy as np, json, potrace
full=Image.open('sheet.png').convert('RGB'); boxes=json.load(open('boxes.json'))
SIDE=204; UP=3; S=24/(SIDE*UP)
f=lambda v: (f'{v*S:.2f}').rstrip('0').rstrip('.')
def to_d(bmp):
    path=bmp.trace(turdsize=20, turnpolicy=potrace.POTRACE_TURNPOLICY_MINORITY, alphamax=1.1, opticurve=True, opttolerance=0.35)
    out=[]
    for curve in path:
        sp=curve.start_point; out.append(f'M{f(sp.x)},{f(sp.y)}')
        for seg in curve.segments:
            if seg.is_corner: out.append(f'L{f(seg.c.x)},{f(seg.c.y)}L{f(seg.end_point.x)},{f(seg.end_point.y)}')
            else: out.append(f'C{f(seg.c1.x)},{f(seg.c1.y)} {f(seg.c2.x)},{f(seg.c2.y)} {f(seg.end_point.x)},{f(seg.end_point.y)}')
        out.append('Z')
    return ''.join(out).replace(' -','-')
res={}
for n,(x0,y0,x1,y1) in boxes.items():
    cx,cy=(x0+x1)/2,(y0+y1)/2
    L=int(round(cx-SIDE/2)); T=int(round(cy-SIDE/2))
    crop=full.crop((L,T,L+SIDE,T+SIDE))
    a=np.asarray(crop).astype(float); r,g,b=a[...,0],a[...,1],a[...,2]
    # coberturas suaves (0..1) de cada cor, a partir da distância ao branco
    ink=np.clip((255-(r+g+b)/3)/ (255-90),0,1)
    org=np.clip(((r-b)-40)/120,0,1)*np.clip((r-150)/80,0,1)
    nav=np.clip(ink-org*1.2,0,1)
    parts={}
    for k,m in (('n',nav),('a',org)):
        if (m>0.5).sum()<15: continue
        im=Image.fromarray((m*255).astype('uint8')).resize((SIDE*UP,SIDE*UP),Image.BICUBIC).filter(ImageFilter.GaussianBlur(1.2))
        bm=potrace.Bitmap(np.asarray(im)<=127)
        parts[k]=to_d(bm)
    res[n]=parts
json.dump(res,open('icons.json','w'))
print('total', sum(len(v) for d in res.values() for v in d.values()))
