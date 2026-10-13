# Splits manual.html into pm/help/: one page per sidebar tab with an anchor per page key, index.json for the app's
# "คู่มือ ?" button, the full manual as index.html, and screenshots as WebP.
import re, os, json, sys, shutil
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = sys.argv[1]
VID = sys.argv[2] if len(sys.argv) > 2 else None   # folder holding <key>.mp4 + index.json
src = open(os.path.join(HERE, 'manual.html'), encoding='utf-8').read()
css = open(os.path.join(HERE, 'style.css'), encoding='utf-8').read()
KEYS = json.load(open(os.path.join(HERE, 'help-keys.json'), encoding='utf-8'))
PAGE = {k['key']: k['page'] for k in KEYS}

# tab -> [(section number, [page keys it covers])]
TABS = {
 'co.exec':  [('3-1', []), ('3-2', []), ('3-3', [])],
 'co.mine':  [('3-2', []), ('4-1', []), ('4-2', []), ('4-3', [])],
 'co.sales': [('5-3', ['co.sales.quote']), ('5-2', ['co.sales.lead']), ('5-1', ['co.sales.cust'])],
 'co.tender':[('5-4', ['co.tender.bid', 'co.tender.tf']), ('5-5', ['co.tender.k'])],
 'co.des':   [('5-6', [])],
 'co.acct':  [('9-1', ['co.acct.ar']), ('9-2', ['co.acct.pc']), ('9-3', ['co.acct.bn']), ('9-4', ['co.acct.ap', 'co.acct.cf']),
              ('9-5', ['co.acct.vat', 'co.acct.wht']), ('9-7', ['co.acct.xp']), ('9-6', ['co.acct.lg'])],
 'co.hr':    [('2-5', ['co.hr.staff']), ('10-1', ['co.hr.ts']), ('10-2', ['co.hr.leave']), ('10-3', ['co.hr.ot']),
              ('10-4', ['co.hr.rec', 'co.hr.quit', 'co.hr.hrl']), ('10-5', ['co.hr.pay']), ('10-6', ['co.hr.ben']),
              ('10-7', ['co.hr.skill', 'co.hr.eval', 'co.hr.prof', 'co.hr.gap', 'co.hr.rev', 'co.hr.band']), ('7-7', ['co.hr.tool'])],
 'co.svc':   [('8-1', ['co.svc.job']), ('8-2', ['co.svc.con', 'co.svc.eqp'])],
 'co.org':   [('12-1', ['co.org.chart', 'co.org.flow']), ('12-2', ['co.org.forms', 'co.org.env'])],
 'co.coset': [('13-1', []), ('2-4', []), ('2-6', []), ('2-7', []), ('2-9', []), ('4-4', []), ('4-5', []), ('15-1', []), ('15-2', [])],
 'pj.pjall': [('6-1', [])],
 'pj.dash':  [('6-2', []), ('1-5', [])],
 'pj.sched': [('6-3', ['pj.sched.g']), ('6-4', ['pj.sched.la', 'pj.sched.mp'])],
 'pj.buy':   [('7-1', []), ('7-2', ['pj.buy.boq']), ('7-3', ['pj.buy.pr']), ('7-4', ['pj.buy.po']),
              ('7-5', ['pj.buy.dl']), ('7-6', ['pj.buy.stock']), ('7-7', ['pj.buy.ven'])],
 'pj.cost':  [('6-5', ['pj.cost.sum', 'pj.cost.sub', 'pj.cost.exp']), ('6-6', ['pj.cost.plan']), ('6-7', ['pj.cost.bill'])],
 'pj.site':  [('6-8', ['pj.site.daily']), ('6-9', ['pj.site.rfi', 'pj.site.vo']), ('11-1', ['pj.site.safe']),
              ('11-2', ['pj.site.wp', 'pj.site.inc']), ('14-2', [])],
 'pj.docs':  [('5-7', ['pj.docs.all', 'pj.docs.mat', 'pj.docs.shop', 'pj.docs.ms', 'pj.docs.calc', 'pj.docs.asb', 'pj.docs.oth'])],
 'pj.qa':    [('6-10', ['pj.qa.itp', 'pj.qa.wir', 'pj.qa.ncr'])],
 'pj.forms': [('6-11', ['pj.forms.dn', 'pj.forms.wo', 'pj.forms.sc', 'pj.forms.ho'])],
 'pj.hand':  [('6-12', ['pj.hand.tc', 'pj.hand.tab', 'pj.hand.punch', 'pj.hand.om', 'pj.hand.war'])],
 'pj.setup': [('6-13', []), ('5-6', [])],
}
# tabs whose clip is a topic clip rather than their own
VALIAS = {'co.mine': 'chat'}
# general topics, linked from every page's footer
GENERAL = [('1-3', 'หาเมนูไม่เจอ ให้ใช้ช่องค้นหา'), ('14-1', 'ติดตั้งบนมือถือ'), ('15-1', 'สำรองข้อมูล'), ('18-1', 'ปัญหาที่พบบ่อย')]

def block(s, start):
    """Return the balanced <div>…</div> that opens at index start."""
    depth, i = 0, start
    for m in re.compile(r'<(/?)div\b').finditer(s, start):
        depth += -1 if m.group(1) else 1
        if depth == 0:
            return s[start:s.index('>', m.end()) + 1]
    raise ValueError('unbalanced')

color = {}
for m in re.finditer(r'<section class="chapter" id="ch(\d+)" style="--cc:([^"]+)"', src):
    color[m.group(1)] = m.group(2)
SEC = {}
for m in re.finditer(r'<div class="sec" id="s(\d+)-(\d+)">', src):
    SEC[f'{m.group(1)}-{m.group(2)}'] = (block(src, m.start()), color[m.group(1)])

# screenshots → WebP
os.makedirs(os.path.join(OUT, 'img'), exist_ok=True)
for f in sorted(os.listdir(os.path.join(HERE, 'img'))):
    if not f.endswith('.jpg'): continue
    im = Image.open(os.path.join(HERE, 'img', f)).convert('RGB')
    if im.width > 1440: im = im.resize((1440, round(im.height * 1440 / im.width)), Image.LANCZOS)
    im.save(os.path.join(OUT, 'img', f[:-4] + '.webp'), 'WEBP', quality=72, method=6)

vids = {}
if VID and os.path.exists(os.path.join(VID, 'index.json')):
    vids = json.load(open(os.path.join(VID, 'index.json'), encoding='utf-8'))
    os.makedirs(os.path.join(OUT, 'video'), exist_ok=True)
    for k, v in vids.items():
        for ext in ('.mp4', '.jpg'):
            p = os.path.join(VID, v['file'][:-4] + ext)
            if os.path.exists(p): shutil.copy(p, os.path.join(OUT, 'video', k + ext))

def vkey(tab):
    return tab if tab in vids else (VALIAS[tab] if VALIAS.get(tab) in vids else None)

def fix(h):
    h = re.sub(r'img/([\w\-]+)\.jpg', r'img/\1.webp', h)
    h = re.sub(r'<b>รูป [\d.]+</b> ', '', h)          # figure numbers belong to the full manual
    h = re.sub(r'<span class="sn">[^<]*</span>', '', h)
    return h

HCSS = '''
body{background:#F3F5F9}
.top{position:sticky;top:0;z-index:5;display:flex;gap:10px;align-items:center;flex-wrap:wrap;padding:10px 20px;background:rgba(255,255,255,.94);backdrop-filter:blur(8px);border-bottom:1px solid var(--line)}
.top .lg{font:700 15px/1 "Anuphan",sans-serif;color:#fff;background:var(--cc);padding:7px 11px;border-radius:9px}
.top h1{font-size:19px;flex:1;min-width:180px}
.top a{font-size:13.5px;font-weight:600;padding:6px 12px;border-radius:99px;border:1px solid var(--line);background:#fff;white-space:nowrap}
.wrap{max-width:900px;margin:0 auto;padding:8px 20px 40px}
.jump{display:flex;flex-wrap:wrap;gap:6px;margin:16px 0 4px}
.jump a{font-size:13.5px;padding:4px 11px;border-radius:99px;background:color-mix(in srgb,var(--cc) 10%,#fff);border:1px solid color-mix(in srgb,var(--cc) 30%,#fff);color:var(--ink);font-weight:500}
.sec{background:#fff;border-radius:16px;padding:18px 24px 10px;margin:16px 0;box-shadow:0 2px 14px rgba(20,30,60,.06);scroll-margin-top:70px;border:2px solid transparent}
.sec:target,.sec.hit{border-color:var(--accent);box-shadow:0 0 0 5px rgba(255,107,26,.15)}
.anc{display:block;position:relative;top:-70px;visibility:hidden}
.vbox{background:#fff;border-radius:16px;padding:14px;margin:16px 0;box-shadow:0 2px 14px rgba(20,30,60,.06)}
.vbox video{width:100%;border-radius:10px;display:block;background:#000}
.vbox b{display:block;margin:0 0 8px;font:600 16px "Anuphan",sans-serif}
.more{margin-top:26px;font-size:14px;color:var(--ink2)}
.more a{margin-right:12px}
@media (max-width:640px){.sec{padding:14px 14px 6px}.wrap{padding:6px 10px 30px}.top{padding:8px 10px}.two{grid-template-columns:1fr}}
'''
FONTS = ('<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
         '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@400;500;600;700&family=Anuphan:wght@500;600;700&display=swap">')
# on load: highlight the section holding the #key anchor
JS = '''<script>
function hit(){document.querySelectorAll('.hit').forEach(e=>e.classList.remove('hit'));const id=decodeURIComponent(location.hash.slice(1));const a=id&&document.getElementById(id);
 if(!a)return;const s=a.closest('.sec');if(s){s.classList.add('hit');(a.classList.contains('anc')?a:s).scrollIntoView({block:'start'})}}
addEventListener('hashchange',hit);addEventListener('load',hit);</script>'''

def page(tab, secs):
    cc = SEC[secs[0][0]][1]
    title = PAGE.get(tab, tab)
    jump, body = [], []
    for sn, keys in secs:
        h, _ = SEC[sn]
        name = re.search(r'<h2>(.*?)</h2>', fix(h)).group(1)
        anchors = ''.join(f'<span class="anc" id="{k}"></span>' for k in keys)
        h = fix(h).replace(f'<div class="sec" id="s{sn}">', f'<div class="sec" id="s{sn}">{anchors}', 1)
        body.append(h)
        jump.append(f'<a href="#s{sn}">{name}</a>')
    vk = vkey(tab)
    vb = (f'<div class="vbox"><b>▶ วิดีโอสอน: {vids[vk]["title"] if vk != tab else title}</b><video controls preload="none" playsinline poster="video/{vk}.jpg" src="video/{vk}.mp4"></video></div>' if vk else '')
    more = ' '.join(f'<a href="index.html#s{sn}">{t}</a>' for sn, t in GENERAL)
    return f'''<!doctype html><html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>คู่มือ · {title}</title>{FONTS}<style>{css}{HCSS}</style></head><body style="--cc:{cc}">
<div class="top"><span class="lg">คู่มือ</span><h1>{title}</h1><a href="index.html">คู่มือฉบับเต็ม</a></div>
<div class="wrap" style="--cc:{cc}"><nav class="jump">{''.join(jump)}</nav>{vb}{''.join(body)}
<div class="more">เรื่องทั่วไป: {more}</div></div>{JS}</body></html>'''

ix = {'index': 'index.html'}
for tab, secs in TABS.items():
    open(os.path.join(OUT, tab + '.html'), 'w', encoding='utf-8').write(page(tab, secs))
    vk = vkey(tab)
    ix[tab] = {'url': f'{tab}.html#{tab}', 'video': f'video/{vk}.mp4'} if vk else f'{tab}.html#{tab}'
    for _, keys in secs:
        for k in keys:
            ix[k] = {'url': f'{tab}.html#{k}', 'video': f'video/{vk}.mp4'} if vk else f'{tab}.html#{k}'
# the tab anchor = top of page
for tab in TABS:
    p = os.path.join(OUT, tab + '.html'); s = open(p, encoding='utf-8').read()
    open(p, 'w', encoding='utf-8').write(s.replace('<nav class="jump">', f'<span class="anc" id="{tab}"></span><nav class="jump">', 1))

# full manual as index.html, plus a "หน้าในโปรแกรม" list of tab pages
full = re.sub(r'img/([\w\-]+)\.jpg', r'img/\1.webp', src)
links = ''.join(f'<a href="{t}.html">{PAGE.get(t, t)}</a>' for t in TABS)
vfirst = ''.join(f'<div class="vbox"><b>▶ {vids[k]["title"]}</b><video controls preload="none" playsinline poster="video/{k}.jpg" src="video/{k}.mp4"></video></div>' for k in ('start', 'chat', 'mobile') if k in vids)
vfirst = f'<div class="vgrid">{vfirst}</div>' if vfirst else ''
full = full.replace('<nav class="toc">', f'<nav class="toc"><div class="byp"><h1>คู่มือแยกตามหน้า</h1><div class="jump">{links}</div>{vfirst}</div>', 1)
full = full.replace('</style>', '.byp{margin-bottom:26px}.vgrid{display:grid;grid-template-columns:2fr 2fr 1fr;gap:14px;margin-top:16px;align-items:start}.vgrid video{width:100%;border-radius:10px;background:#000}.vgrid b{display:block;font-size:14px;margin-bottom:6px}@media (max-width:640px){.vgrid{grid-template-columns:1fr}}.byp .jump{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}.byp .jump a{font-size:14px;padding:4px 12px;border-radius:99px;background:#E6F6F7;border:1px solid #A7DADE;color:#0B5F66;font-weight:500}@media print{.byp{display:none}}</style>', 1)
open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8').write(full)
json.dump(ix, open(os.path.join(OUT, 'index.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

missing = [k['key'] for k in KEYS if k['key'] not in ix and '.'.join(k['key'].split('.')[:2]) not in ix]
print('tabs', len(TABS), 'keys', len(ix), 'unreachable', missing,
      'no own section', [k['key'] for k in KEYS if k['key'] not in ix])
