from PIL import Image, ImageFilter
import numpy as np, json, potrace
d='/tmp/claude-chrome-screenshots-3Udh67/'
files={'sync':'screenshot-1793729165462-13.png','class':'screenshot-1793729165463-14.png','search':'screenshot-1793729165463-15.png','done':'screenshot-1793729165464-16.png'}
UP=2
def to_d(bmp, S, ox, oy):
    f=lambda v: (f'{v*S:.1f}').rstrip('0').rstrip('.')
    path=bmp.trace(turdsize=30, turnpolicy=potrace.POTRACE_TURNPOLICY_MINORITY, alphamax=1.1, opticurve=True, opttolerance=0.4)
    out=[]
    for c in path:
        out.append(f'M{f(c.start_point.x)},{f(c.start_point.y)}')
        for s in c.segments:
            out.append(f'L{f(s.c.x)},{f(s.c.y)}L{f(s.end_point.x)},{f(s.end_point.y)}' if s.is_corner else f'C{f(s.c1.x)},{f(s.c1.y)} {f(s.c2.x)},{f(s.c2.y)} {f(s.end_point.x)},{f(s.end_point.y)}')
        out.append('Z')
    return ''.join(out).replace(' -','-')
res={}
for n,fn in files.items():
    im=Image.open(d+fn).convert('RGB'); a=np.asarray(im).astype(float); r,g,b=a[...,0],a[...,1],a[...,2]
    ink=np.clip((255-(r+g+b)/3)/(255-90),0,1); org=np.clip(((r-b)-40)/120,0,1)*np.clip((r-150)/80,0,1); nav=np.clip(ink-org*1.2,0,1)
    ys,xs=np.nonzero((nav>0.5)|(org>0.5)); x0,x1,y0,y1=xs.min()-6,xs.max()+6,ys.min()-6,ys.max()+6
    W,H=x1-x0,y1-y0; S=1/UP  # unidades = px da arte
    parts={'w':int(W),'h':int(H)}
    for k,m in (('n',nav),('a',org)):
        crop=Image.fromarray((m*255).astype('uint8')).crop((x0,y0,x1,y1)).resize((W*UP,H*UP),Image.BICUBIC).filter(ImageFilter.GaussianBlur(1))
        if (np.asarray(crop)>127).sum()<20: continue
        parts[k]=to_d(potrace.Bitmap(np.asarray(crop)<=127), S, 0, 0)
    res[n]=parts
json.dump(res,open('illus.json','w'))
print({k:(v['w'],v['h'],len(v.get('n','')),len(v.get('a',''))) for k,v in res.items()})
