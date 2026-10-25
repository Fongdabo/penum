/* ---------- 4.58 choosing how a quotation prints, in one place (user: "เราจะทำยังไงให้เลือกง่ายๆ") ----------
   The แบบฟอร์มเอกสาร cards (983) and the "แบบฟอร์ม BOQ ที่พิมพ์" list (200) were two pickers far apart. Now the แบบฟอร์มเอกสาร panel has
   two steps: ① หน้าตาใบ = 983's cards, ② ตารางรายการ = five small picture cards for Q.lay (the list is gone), with อัตโนมัติ as a tick,
   and ดูตัวอย่าง shows the open quotation printed as chosen, on screen (983's preview frame). The BOQ-G cover is a little tighter so
   its signatures stay on page 1 (they fell alone onto page 2 for a three-section quote). */
const QFS_LAY=[['split','A','แยกของ / แรง','ราคาค่าวัสดุและค่าแรงแยกช่อง'],['one','B','ราคาเดียว','ราคาต่อหน่วยรวมช่องเดียว อ่านง่าย'],
  ['sum','S','ยอดหมวด','บอกจำนวนทุกรายการ เงินเฉพาะยอดแต่ละหมวด'],['gov','G','ราชการ ปร.4','ตารางเส้นแบบงานราชการ มีช่องหมายเหตุ'],['empty','E','ใบขอราคาเปล่า','ไม่มีราคา ให้ผู้รับเหมาช่วง/ร้านค้ากรอก']];
// the small picture of each table: bars for text, blocks for money columns
const qfsPic=k=>{const ln=(y,w,x=6)=>`<rect x="${x}" y="${y}" width="${w}" height="3" rx="1.5" fill="#B9C6CC"/>`,num=(x,y,c='#1C8F9B')=>`<rect x="${x}" y="${y}" width="12" height="3" rx="1.5" fill="${c}"/>`;
  let s='';const rows=[14,22,30,38,46,54];
  if(k==='G'||k==='E'){s+=`<rect x="4" y="5" width="88" height="54" fill="${k==='G'?'#DAF2D0':'#fff'}" stroke="#55707A" stroke-width=".8"/><rect x="4" y="5" width="88" height="7" fill="#DAF2D0" stroke="#55707A" stroke-width=".8"/>`;
    [24,52,62,72,82].forEach(x=>s+=`<line x1="${x}" y1="5" x2="${x}" y2="59" stroke="#55707A" stroke-width=".6"/>`);rows.forEach(y=>s+=`<line x1="4" y1="${y+4}" x2="92" y2="${y+4}" stroke="#55707A" stroke-width=".4"/>`+ln(y+1,14,7)+(k==='G'?num(54,y+1,'#33545E').replace('width="12"','width="7"')+num(64,y+1,'#33545E').replace('width="12"','width="7"')+num(74,y+1,'#33545E').replace('width="12"','width="7"'):''));return s}
  s+=`<rect x="4" y="5" width="88" height="6" rx="2" fill="#1F3C4A"/>`;
  rows.forEach((y,i)=>{const sec=k==='S'&&(i===0||i===3);s+=ln(y,sec?30:26,sec?6:10);
    if(k==='A')s+=num(46,y,'#C58A1B')+num(62,y)+num(78,y,'#33545E');
    if(k==='B')s+=num(58,y)+num(78,y,'#33545E');
    if(k==='S'){s+=`<rect x="44" y="${y}" width="6" height="3" rx="1.5" fill="#B9C6CC"/>`;if(sec)s+=num(78,y,'#33545E')}});return s};
function qfsStep2(Q){const f0=qForm(Q),auto=!Q.lay,b=`co.quotes.${Q.id}`;
  return `<div class="qfs-st"><b>②</b> ตารางรายการ <label class="qfs-auto" title="มีค่าแรง = แยกของ / แรง · ไม่มีค่าแรง = ราคาเดียว"><input type="checkbox" class="qfsAuto" data-id="${Q.id}"${auto?' checked':''}> อัตโนมัติ</label></div>
    <div class="qfs-l">${QFS_LAY.map(([v,k,t,d])=>`<button type="button" class="${f0===k?'on':''}" data-a="qfsLay" data-id="${Q.id}" data-v="${v}" aria-pressed="${f0===k}" title="BOQ-${k}"><svg viewBox="0 0 96 64" aria-hidden="true">${qfsPic(k)}</svg><b>${t}</b><small>${d}</small>${f0===k?`<span class="tag">${auto?'✓ อัตโนมัติ':'✓ ใช้อยู่'}</span>`:''}</button>`).join('')}</div>`};
ACT.qfsLay=b=>{const Q=CO().quotes.find(q=>q.id===b.dataset.id);if(!Q)return;Q.lay=b.dataset.v;save();render();const x=QFS_LAY.find(r=>r[0]===Q.lay);toast(`ตารางรายการ: ${x?x[2]:''}`)};
document.addEventListener('change',e=>{const t=e.target;if(!t||!t.classList||!t.classList.contains('qfsAuto'))return;const Q=CO().quotes.find(q=>q.id===t.dataset.id);if(!Q)return;
  Q.lay=t.checked?'':(QFS_LAY.find(r=>r[1]===qForm(Q))||QFS_LAY[0])[0];save();render()});
// ดูตัวอย่าง: the open quotation printed as it is set now, in 983's on-screen paper (ปิด / Esc closes it)
ACT.qfsPv=b=>{const Q=CO().quotes.find(q=>q.id===b.dataset.id);if(!Q)return;let h='';try{h=PRINT.quote(Q.id)}catch(e){console.error(e)}if(!h){toast('ยังพิมพ์ใบนี้ไม่ได้');return}
  const x=QFS_LAY.find(r=>r[1]===qForm(Q));let bar=$('#fsPvb');if(!bar){bar=document.createElement('div');bar.id='fsPvb';bar.className='fs-pvb';document.body.appendChild(bar)}
  bar.innerHTML=`<b>ตัวอย่าง ${esc(Q.no||'')}</b><small>ตารางรายการ: ${x?esc(x[2]):''} · หน้าตาจริงตอนพิมพ์</small><span style="flex:1"></span><button type="button" class="btn sm pri" data-a="print" data-k="quote" data-id="${Q.id}">พิมพ์</button><button type="button" class="btn sm" data-a="fsPvClose">ปิด</button>`;
  const p=$('#print');p.innerHTML=`<div class="fs-paper${/size:A4 landscape/.test(h)?' land':''}">${h}</div>`;if(typeof fillPhotos==='function')fillPhotos(p);document.body.classList.add('fs-pv');p.scrollTop=0};
// พิมพ์ from the preview: close the frame first so the page prints as usual
{const f=ACT.print;ACT.print=b=>{if(document.body.classList.contains('fs-pv')&&typeof ACT.fsPvClose==='function')ACT.fsPvClose();return f(b)}}
// salesQuote is wrapped again by 981 and 983, after this file: work on the finished page, at render time
const qfsWrap=()=>{if(typeof salesQuote!=='function'||salesQuote.__qfs)return;const f=salesQuote;salesQuote=function(){let h=f.apply(this,arguments);
  const C=CO(),Q=C.quotes.find(q=>q.id===S.sel.quote)||C.quotes.slice().reverse()[0];if(!Q||(typeof qmMa==='function'&&qmMa(Q)))return h;
  h=h.replace(/<label>แบบฟอร์ม BOQ ที่พิมพ์<select[^>]*>[\s\S]*?<\/select><\/label>/,'');
  const a=h.indexOf('<div class="fsg">');if(a<0)return h;const l=h.indexOf('<div class="fsg-l">',a),end=h.indexOf('<div class="form" style="margin-bottom:12px"><label>เลขที่',a);if(l<0||end<0)return h;
  const close=h.lastIndexOf('</div>',end);
  h=h.slice(0,l)+`<div class="qfs-st"><b>①</b> หน้าตาใบ</div>`+h.slice(l,close)+qfsStep2(Q)+h.slice(close);
  return h.replace('<div class="fsg-h"><b>แบบฟอร์มเอกสาร</b>',`<div class="fsg-h"><b>แบบฟอร์มเอกสาร</b><button type="button" class="btn sm pri qfs-pv" data-a="qfsPv" data-id="${Q.id}">ดูตัวอย่าง</button>`)};salesQuote.__qfs=1};
{const r=render;render=function(){try{qfsWrap()}catch(e){}return r.apply(this,arguments)}}
document.head.insertAdjacentHTML('beforeend',`<style>.qfs-st{display:flex;align-items:center;gap:8px;margin:10px 0 6px;font-size:13px;font-weight:600;color:var(--ink)}.qfs-st>b{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;background:var(--accent,#1C8F9B);color:#fff;font-size:12px}
.qfs-auto{display:inline-flex;align-items:center;gap:5px;margin-left:10px;font-weight:400;font-size:12.5px;color:var(--muted);cursor:pointer}.qfs-auto input{width:16px;height:16px;margin:0;accent-color:var(--accent,#1C8F9B)}
.qfs-l{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}
.qfs-l button{display:flex;flex-direction:column;align-items:stretch;gap:3px;text-align:left;padding:8px;border:1px solid var(--line);border-radius:10px;background:var(--surface);color:var(--ink);cursor:pointer;font:inherit}
.qfs-l button:hover{border-color:var(--accent,#1C8F9B)}.qfs-l button.on{border:2px solid var(--accent,#1C8F9B);padding:7px}
.qfs-l svg{width:100%;height:auto;max-height:76px;background:#F4F7F8;border-radius:6px}
.qfs-l b{font-size:13px}.qfs-l small{font-size:11.5px;color:var(--muted);line-height:1.35}
.qfs-l .tag{align-self:flex-start;font-size:11px;padding:0 7px;border-radius:9px;background:var(--accent,#1C8F9B);color:#fff}
.fsg-h .qfs-pv{margin-left:auto}
html body #print .xb-s{margin-top:8px}html body #print .xb-s .ln{margin:30px 26px 3px}html body #print .xb-s .ok{padding:8px 10px 6px}html body #print .xb-s .ok .ln{margin:26px 30px 2px}html body #print .xb-n b[style*="margin-top:12px"],html body #print .xb-n div[style*="margin-top:12px"]{margin-top:4px!important}</style>`);
if(typeof I18N==='object'&&I18N.en&&I18N.en.x)Object.assign(I18N.en.x,{'หน้าตาใบ':'Look','ตารางรายการ':'Lines table','อัตโนมัติ':'Automatic','ดูตัวอย่าง':'Preview','แยกของ / แรง':'Material / labour','ราคาเดียว':'One price',
  'ยอดหมวด':'Section totals','ราชการ ปร.4':'Government (ปร.4)','ใบขอราคาเปล่า':'Blank request','พิมพ์':'Print','ปิด':'Close'});
