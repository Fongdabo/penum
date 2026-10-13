/* ---------- 3.5.1: arrows on the workflow chart ----------
   Each step box carries data-fk="<dept><phase>"; after every render the arrows are drawn in an SVG laid over
   the table from the boxes' real positions, so they follow the theme, the zoom and the window width. */
// [from, to, kind, label, route, offset]  kind 'b' = sent back (dashed, orange)
// route v: straight up/down in the column · h: across to the next phase through the gap between columns · gr/gl: down the gap right/left of the column
const FLOW_E=[['CUS0','SAL0','','','v',0],['SAL0','DES1','','','h',0],['SAL0','EST1','','','h',0],['DES1','EST1','','','v',0],['EST1','SAL2','','','h',0],
  ['SAL2','MGT2','','','v',14],['MGT2','SAL2','b','แก้ราคา','v',-14],['SAL2','CUS2','','','v',14],['CUS2','SAL2','b','ต่อรอง','v',-14],
  ['CUS2','PRJ3','','','h',0],['PRJ3','SHE3','','','v',0],['SHE3','HR3','','','v',0],['HR3','PUR3','','','v',0],['PUR3','PUR4','','','h',0],['PRJ3','PRJ4','','','h',0],
  ['PUR4','PRJ4','','','v',0],['PRJ4','ACC4','','','gr',0],['ACC4','CUS4','','','gl',0],['CUS4','PRJ4','b','สั่งแก้','v',0],
  ['PRJ4','PRJ5','','','h',0],['PRJ5','CUS5','','','v',14],['CUS5','PRJ5','b','งานค้าง','v',-14],['CUS5','ACC6','','','h',0],['CUS5','SVC6','','','h',0]];
const flowLegend=()=>`<div class="legend" style="margin-top:8px"><span><i style="background:var(--accent)"></i>ลำดับงาน</span><span><i style="background:none;border-top:2px dashed #E07B24;border-radius:0;height:0"></i>ส่งกลับแก้ไข / ต่อรอง</span><span><i style="background:#FFEDD5;border:1px solid #FDBA74"></i>จุดอนุมัติหรือตัดสินใจ</span></div>`;
function drawFlow(){const W=document.querySelector('.flw');if(!W)return;W.querySelector('svg.flsv')?.remove();const o=W.getBoundingClientRect();if(!o.width)return;
  const R={};W.querySelectorAll('[data-fk]').forEach(e=>{const r=e.getBoundingClientRect();R[e.dataset.fk]={l:r.left-o.left,r:r.right-o.left,t:r.top-o.top,b:r.bottom-o.top,y:(r.top+r.bottom)/2-o.top,x:(r.left+r.right)/2-o.left}});
  const ps=[];
  FLOW_E.forEach(([f,t,kind,lab,rt,off])=>{const A=R[f],B=R[t];if(!A||!B)return;const back=kind==='b';let d,lx,ly;
    if(rt==='v'){const x=(A.x+B.x)/2+off,up=B.b<=A.t;d=up?`M${x},${A.t}V${B.b+1}`:`M${x},${A.b}V${B.t-1}`;lx=x-5;ly=(up?(A.t+B.b):(A.b+B.t))/2+4}
    else if(rt==='h'){if(Math.abs(A.y-B.y)<2)d=`M${A.r},${A.y}H${B.l-1}`;else{const gx=(A.r+B.l)/2+off;d=`M${A.r},${A.y}H${gx}V${B.y}H${B.l-1}`}}
    else if(rt==='gr'){const gx=Math.max(A.r,B.r)+9+off;d=`M${A.r},${A.y}H${gx}V${B.y}H${B.r+1}`}
    else{const gx=Math.min(A.l,B.l)-9-off;d=`M${A.l},${A.y}H${gx}V${B.y}H${B.l-1}`}
    ps.push(`<path d="${d}" class="${back?'bk':''}" marker-end="url(#${back?'fla2':'fla'})"/>${lab&&lx!=null?`<text x="${lx}" y="${ly}" text-anchor="end" class="flt">${esc(lab)}</text>`:''}`)});
  W.insertAdjacentHTML('beforeend',`<svg class="flsv" width="${o.width}" height="${o.height}" viewBox="0 0 ${o.width} ${o.height}" aria-hidden="true"><defs>
    <marker id="fla" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0L8,4L0,8z" class="mh"/></marker>
    <marker id="fla2" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0L8,4L0,8z" class="mh bk"/></marker></defs>${ps.join('')}</svg>`)}
{const r=render;render=function(){const x=r.apply(this,arguments);requestAnimationFrame(drawFlow);return x}}
{let tm;addEventListener('resize',()=>{clearTimeout(tm);tm=setTimeout(drawFlow,120)})}
document.head.insertAdjacentHTML('beforeend',`<style>
.flw{position:relative}.fl td{padding:12px 14px}
.flsv{position:absolute;left:0;top:0;pointer-events:none;overflow:visible}
.flsv path{fill:none;stroke:var(--accent);stroke-width:1.6;stroke-linejoin:round}
.flsv path.bk{stroke:#E07B24;stroke-dasharray:5 4}
.flsv .mh{fill:var(--accent);stroke:none}.flsv .mh.bk{fill:#E07B24;stroke:none;stroke-dasharray:none}
.flsv .flt{font-size:10.5px;fill:#E07B24;font-weight:600;paint-order:stroke;stroke:var(--surface);stroke-width:3px}
.fl-s{position:relative;z-index:1}
@media print{.flsv path{stroke:#2A7F8A}.flsv .mh{fill:#2A7F8A}}
</style>`);

/* ---------- 3.6: top tabs follow the org chart ----------
   Row 1: the divisions (หน้าแรก · ฝ่ายธุรกิจ · ฝ่ายปฏิบัติการ · ฝ่ายบริหาร · ความปลอดภัย · ตั้งค่า).
   Row 2: the departments of that division. Row 3: the pages of the department, as before.
   Access still comes from the departments, so a division only shows the departments a person may open. */
const DIVS=[['home','หน้าแรก',['home']],['biz','ฝ่ายธุรกิจ',['sales','est','des']],['ops','ฝ่ายปฏิบัติการ',['pj','pur','store','svc']],['adm','ฝ่ายบริหาร',['acct','hr','org']],['she','ความปลอดภัย',['she']],['set','ตั้งค่า',['set']]];
Object.assign(ICO,{biz:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/>',
  ops:'<path d="M4 15a8 8 0 0 1 16 0"/><path d="M2 15h20v2H2zM12 7V4M9 7.5 8 5M15 7.5 16 5"/>',adm:'<path d="M3 21h18M5 21V8l7-5 7 5v13"/><path d="M9 21v-4h6v4M9 11h.01M15 11h.01M9 14h.01M15 14h.01"/>'});
const divOf=k=>(DIVS.find(d=>d[2].includes(k))||DIVS[0]);
const divDepts=v=>v[2].map(k=>NAVD.find(d=>d[0]===k)).filter(d=>d&&deptOk(d));
ACT.div=b=>{const v=DIVS.find(d=>d[0]===b.dataset.k);if(!v)return;const L=divDepts(v);if(!L.length)return;S.ddiv=S.ddiv||{};const k=L.some(d=>d[0]===S.ddiv[v[0]])?S.ddiv[v[0]]:L[0][0];ACT.dept({dataset:{k}})};
{const r=render;render=function(){const x=r.apply(this,arguments);const sv=a=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${a||''}</svg>`;
  const cur=divOf(S.dept);S.ddiv=S.ddiv||{};S.ddiv[cur[0]]=S.dept;
  $('#tabs').innerHTML=DIVS.filter(v=>divDepts(v).length).map(([k,l])=>`<button type="button" role="tab" data-a="div" data-k="${k}" aria-selected="${k===cur[0]}">${sv(ICO[k])}${l}</button>`).join('');
  {const T=$('#tabs'),a=T.querySelector('[aria-selected="true"]');if(a&&T.scrollWidth>T.clientWidth)T.scrollLeft=Math.max(0,a.offsetLeft-T.clientWidth/2+a.offsetWidth/2)}
  const L=divDepts(cur);
  if(L.length>1&&!$('#view .depts'))$('#view').insertAdjacentHTML('afterbegin',`<nav class="depts" role="tablist" aria-label="${esc(cur[1])}">${L.map(([k,l])=>`<button type="button" role="tab" data-a="dept" data-k="${k}" aria-selected="${k===S.dept}">${sv(ICO[k])}${esc(l)}</button>`).join('')}</nav>`);
  return x}}
document.head.insertAdjacentHTML('beforeend',`<style>
.depts{display:flex;gap:4px;flex-wrap:wrap;margin:0 0 -6px;padding:4px;border-radius:14px;background:var(--sunk);border:1px solid var(--line);width:fit-content;max-width:100%}
.depts button{display:inline-flex;align-items:center;gap:7px;border:0;background:none;color:var(--muted);border-radius:10px;padding:7px 14px;font-family:var(--f-display);font-weight:600;font-size:14px;cursor:pointer}
.depts button svg{width:17px;height:17px}
.depts button:hover{color:var(--ink);background:var(--surface)}
.depts button[aria-selected="true"]{background:var(--surface);color:var(--accent);box-shadow:var(--shadow)}
@media (max-width:640px){.depts{width:auto;flex-wrap:nowrap;overflow-x:auto}.depts button{white-space:nowrap;padding:7px 11px}}
</style>`);

