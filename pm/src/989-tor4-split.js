/* ---------- 4.99.58 TOR: แบ่งจอ และใบตอบ TOR ----------
   User (2026-11-19, TOR of รพ.ค่ายสุรนารี with 75 clauses): "มีแบ่งจอไหม". Other documents get ◫ แบ่งจอ (941) from the พิมพ์ button in
   their card's title row, so the ข้อกำหนดสำคัญ card now has one: PRINT.tor is the TOR answer sheet (ใบตอบ TOR), every clause in the
   TOR's own order with what we answered (ทำได้ / ต้องถาม / ทำไม่ได้) and how, headings as section rows. With แบ่งจอ on, the table is on
   the left and the sheet on the right; clicking a clause in the table brings the same clause into view on the sheet. */
const TORS_OK={y:['ทำได้','#16794C','#E6F4EC'],q:['ต้องถาม/ชี้แจง','#9A5B00','#FFF3DC'],n:['ทำไม่ได้/ต่างจาก TOR','#B42318','#FDECEA']};
PRINT.tor=id=>{const t=torCfg().find(x=>x.id===id);if(!t)return '';const C=CO(),c=torCnt(t),ma=torKind(t)==='ma',Q=torQ(t),
    cat=k=>{const L=(TORCAT[torKind(t)]||[]).find(x=>x[0]===k);return L?L[1]:''},d=s=>s&&typeof fmtD==='function'?fmtD(s):esc(s||'');
  const rows=(t.req||[]).filter(r=>String(r.t||'').trim()||r.ok||String(r.ans||'').trim()).map(r=>{const ref=String(r.ref||'').trim(),head=ref&&!ref.includes('.')&&!r.ok&&!String(r.ans||'').trim(),o=TORS_OK[r.ok];
    if(head)return `<tr id="tq-${r.id}" class="tq-h"><td>${esc(ref)}</td><td colspan="3"><b>${esc(r.t)}</b></td></tr>`;
    return `<tr id="tq-${r.id}"><td>${esc(ref)}</td><td>${esc(r.t||'').replace(/\n/g,'<br>')}${cat(r.cat)?`<div class="tq-c">${esc(cat(r.cat))}</div>`:''}</td>
      <td>${o?`<span class="tq-ok" style="color:${o[1]};background:${o[2]}">${o[0]}</span>`:'<span class="tq-ok">–</span>'}</td><td>${esc(r.ans||'').replace(/\n/g,'<br>')}</td></tr>`}).join('');
  return `<style>#print .tq{width:100%;border-collapse:collapse;font-size:11px}#print .tq th,#print .tq td{border:1px solid #CBD5DA;padding:4px 6px;vertical-align:top;text-align:left}
#print .tq th{background:#EEF3F5}#print .tq td:first-child{width:46px;white-space:nowrap}#print .tq td:nth-child(3){width:88px}#print .tq td:nth-child(4){width:30%}
#print .tq tr{break-inside:avoid}#print .tq-h td{background:#F6F8F9}#print .tq-c{color:#6B7F87;font-size:10px;margin-top:2px}
#print .tq-ok{display:inline-block;border-radius:6px;padding:1px 6px;font-size:10.5px;white-space:nowrap}#print .tq tr.tq-hl td{outline:2px solid #1C8F9B;outline-offset:-2px;background:#E8F6F7}</style>`
    +cphead(`ใบตอบข้อกำหนด TOR ${esc(t.no||'')}`,esc(ma?'TOR งานบำรุงรักษา':'TOR งานโครงการ'))
    +`<div class="meta"><div>งาน: ${esc(t.title||'')}</div><div>เจ้าของงาน: ${esc(t.owner||((C.customers||[]).find(x=>x.id===t.cust)||{}).name||'')}</div><div>สถานที่: ${esc(t.site||'')}</div>
      ${n(t.budget)?`<div>งบประมาณ: ${fmt(n(t.budget),2)} บาท</div>`:''}${t.due?`<div>วันยื่นราคา: ${d(t.due)}</div>`:''}${Q?`<div>ใบเสนอราคา: ${esc(Q.no||'')}</div>`:''}
      <div>ตอบแล้ว ${c.all-c.none}/${c.all} ข้อ · ทำได้ ${c.y} · ต้องถาม ${c.q} · ทำไม่ได้ ${c.n}</div></div>
    <table class="tq"><thead><tr><th>ข้อ</th><th>ข้อกำหนดใน TOR</th><th>เราทำได้ไหม</th><th>วิธีทำ / ที่ต้องถาม / ราคาที่เพิ่ม</th></tr></thead><tbody>${rows||'<tr><td colspan="4">ยังไม่มีข้อกำหนด</td></tr>'}</tbody></table>
    <div class="sign"><div>ผู้อ่าน TOR</div><div>ผู้ตรวจ</div><div>ผู้อนุมัติ</div></div>`};
// the พิมพ์ button in the ข้อกำหนดสำคัญ title row brings ◫ แบ่งจอ with it (941)
{const f=torOne;torOne=function(t){const h=f.apply(this,arguments);const b=`co.tors.${t.id}.req`,k=`<button type="button" class="btn sm pri" data-a="add" data-c="${b}">`;
  return h.includes(k)?h.replace(k,`<button type="button" class="btn sm" data-a="print" data-k="tor" data-id="${t.id}">พิมพ์ใบตอบ TOR</button>`+k):h}}
// a clause clicked in the table: the same clause on the sheet beside it
document.addEventListener('focusin',e=>{const p=e.target&&e.target.dataset&&e.target.dataset.p,m=p&&p.match(/^co\.tors\.[^.]+\.req\.([^.]+)\./);if(!m)return;
  const v=document.querySelector('section.qtab-sp>.qpv'),R=v&&v.shadowRoot;if(!R)return;const r=R.getElementById('tq-'+m[1]);if(!r)return;
  R.querySelectorAll('.tq-hl').forEach(x=>x.classList.remove('tq-hl'));r.classList.add('tq-hl');
  const top=r.getBoundingClientRect().top-v.getBoundingClientRect().top;v.scrollTo({top:v.scrollTop+top-v.clientHeight/3,behavior:'smooth'})});
if(typeof SBKW==='object')SBKW['co.tor.ma']=(SBKW['co.tor.ma']||'')+' แบ่งจอ ใบตอบ TOR พิมพ์ TOR';
