/* ---------- 3.92 ยกเลิก / ลบ a project straight from ทุกโครงการ ----------
   Close and delete lived only at the bottom of ข้อมูลโครงการและ BOQ, so a project made by mistake was hard to get rid of.
   Each row of ทุกโครงการ (and that page) now has "ยกเลิก / ลบ", which says what is in the project and offers:
   ลบทิ้ง (made by mistake): a project with no work in it goes at once and ↶ ย้อนกลับ brings it back; one with work in it
     goes through the old delete (backup file first, type ลบ) and only management (or the owner, not signed in) may do it.
   ยกเลิกโครงการ (the job will not go ahead): kept like a closed project, out of the totals and alerts, marked ยกเลิกแล้ว
     with the reason (P.cxl={d,why}); เปิดโครงการอีกครั้ง brings it back.
   ปิดโครงการ (the job is finished): the same close as before. */
const PJ_WK=[['boq.items','รายการ BOQ'],['tasks','งานในแผน'],['bills','งวดเบิก'],['prs','ใบขอซื้อ'],['pos','ใบสั่งซื้อ'],['costs','ค่าใช้จ่าย'],
  ['subs','ผู้รับเหมาช่วง'],['daily','รายงานประจำวัน'],['vos','งานเพิ่มลด'],['rfis','RFI'],['subm','เอกสารส่งอนุมัติ']];
// what is in a project, as [label, count]; the project's own details (name, client, dates, contract value) do not count
function pjWork(p){const L=[],seen=new Set(['rooms']);
  PJ_WK.forEach(([k,l])=>{seen.add(k.split('.')[0]);const a=k.split('.').reduce((o,x)=>o&&o[x],p);if(Array.isArray(a)&&a.length)L.push([l,a.length])});
  let o=0;Object.entries(p).forEach(([k,v])=>{if(!seen.has(k)&&Array.isArray(v))o+=v.length});if(o)L.push(['ข้อมูลอื่น',o]);
  const q=(CO().quotes||[]).filter(x=>x.pj===p.id).length;if(q)L.push(['ใบเสนอราคาที่ผูกไว้',q]);return L}
const pjAdmin=()=>{const u=me();return !u||ACCESS[u.dept]==='*'};
const pjCan=()=>allowed('pj','setup');
// open project p as the current one, run f, then go back to the page and project you were on unless p is gone
async function pjOn(p,f){const was=DB.cur,tab=S.tab,mode=S.mode;DB.cur=p.id;P=p;
  try{await f()}finally{S.mode=mode;S.tab=tab;if(DB.projects[was]){DB.cur=was;P=DB.projects[was]}save();render()}}
ACT.pjMg=b=>{const p=DB.projects[b.dataset.id];if(!p)return;if(!pjCan()){toast('ต้องเป็นฝ่ายที่แก้ข้อมูลโครงการได้');return}
  const W=pjWork(p),bare=!W.length,del=bare||pjAdmin(),x=p.cxl,opt=(a,t,d,cls='',dis='')=>`<button type="button" class="pjm-o ${cls}" data-a="${a}" data-id="${p.id}"${dis}><b>${t}</b><small>${d}</small></button>`,
    dl=opt('pjDel',bare?'ลบทิ้ง (สร้างผิด)':'ลบทิ้งถาวร',bare?'ลบออกจากรายการทันที ถ้ากดผิด กด ↶ ย้อนกลับ ที่แถบด้านบน (Ctrl+Z)':
      del?'ข้อมูลทั้งหมดของโครงการนี้จะหาย จะให้ดาวน์โหลดไฟล์สำรองก่อน แล้วพิมพ์คำว่า ลบ เพื่อยืนยัน':'โครงการที่มีข้อมูลแล้ว เฉพาะผู้บริหารลบได้ ใช้ “ยกเลิกโครงการ” แทน','del',del?'':' disabled');
  dialog(`ยกเลิก / ลบ “${esc(p.name)}”`,`<p class="pjm-w">${bare?'โครงการนี้ยังไม่มีข้อมูลงาน (ไม่มี BOQ แผนงาน เบิกงวด จัดซื้อ หรือเอกสาร)':`ในโครงการนี้มี ${W.map(([l,c])=>`${l} ${fmt(c)}`).join(' · ')}`}</p>
    ${p.closed?`<p class="hint" style="margin:0 0 10px">${x?`ยกเลิกเมื่อ ${thD(x.d||p.closed)}${x.why?` · ${esc(x.why)}`:''}`:`ปิดโครงการเมื่อ ${thD(p.closed)}`}</p>`:''}
    <div class="pjm">${bare&&!p.closed?dl:''}${p.closed?opt('pjReopen','เปิดโครงการอีกครั้ง','กลับมาอยู่ในรายการโครงการที่กำลังทำ ยอดรวมและการแจ้งเตือน','pri'):
      `<label class="pjm-why">เหตุผลที่ยกเลิก (ไม่บังคับ)<input id="pjmWhy" placeholder="เช่น ลูกค้ายกเลิก · ไม่ได้งาน · สร้างซ้ำ"></label>
      ${opt('pjCxl','ยกเลิกโครงการ (เก็บข้อมูลไว้)','ใช้เมื่อจะไม่ทำงานนี้ต่อ ข้อมูลยังอยู่ครบ ไม่นับในยอดรวม ไม่ขึ้นแจ้งเตือน เปิดใหม่ได้ทุกเมื่อ')}
      ${opt('pjDone','ปิดโครงการ (งานจบแล้ว)','เก็บไว้ดูย้อนหลังและพิมพ์เอกสาร ย้ายไปกลุ่ม “ปิดแล้ว”')}`}
      ${bare&&!p.closed?'':dl}</div>`)};
const pjWhy=()=>(($('#pjmWhy')||{}).value||'').trim().slice(0,120);
ACT.pjCxl=b=>{const p=DB.projects[b.dataset.id];if(!p)return;const why=pjWhy();$('#dlg').close();
  p.closed=today();p.cxl={d:today(),why};save();render();toast(`ยกเลิกโครงการ ${p.name} แล้ว · กดผิด กด ↶ ย้อนกลับ`)};
ACT.pjDone=b=>{const p=DB.projects[b.dataset.id];if(!p)return;$('#dlg').close();delete p.cxl;p.closed=today();save();render();toast(`ปิดโครงการ ${p.name} แล้ว`)};
ACT.pjReopen=b=>{const p=DB.projects[b.dataset.id];if(!p)return;$('#dlg').close();delete p.closed;delete p.cxl;save();render();toast(`เปิดโครงการ ${p.name} อีกครั้งแล้ว`)};
ACT.pjDel=async b=>{const p=DB.projects[b.dataset.id];if(!p)return;$('#dlg').close();
  if(pjWork(p).length){if(!pjAdmin()){toast('โครงการที่มีข้อมูลแล้ว เฉพาะผู้บริหารลบได้');return}await pjOn(p,()=>ACT.delProj());return}
  const nm=p.name;delete DB.projects[p.id];CO().quotes&&CO().quotes.forEach(q=>{if(q.pj===p.id)q.pj=''});
  if(!Object.keys(DB.projects).length){const q=blankProject('โครงการใหม่');DB.projects[q.id]=q}
  if(!DB.projects[DB.cur]){const nx=pjOpen()[0]||Object.values(DB.projects)[0];DB.cur=nx.id;P=nx;S.sel={}}
  save();render();toast(`ลบโครงการ ${nm} แล้ว · กดผิด กด ↶ ย้อนกลับ`)};
// deleting a project that has work in it is for management only, from ข้อมูลโครงการ too
{const f=ACT.delProj;ACT.delProj=(...a)=>{if(pjWork(P).length&&!pjAdmin()){toast('โครงการที่มีข้อมูลแล้ว เฉพาะผู้บริหารลบได้ ใช้ “ยกเลิกโครงการ” แทน');return}return f(...a)}}
{const f=ACT.projOpen;ACT.projOpen=(...a)=>{delete P.cxl;return f(...a)}}
{const f=ACT.projClose;ACT.projClose=(...a)=>{delete P.cxl;return f(...a)}}
// ทุกโครงการ: the row says ยกเลิกแล้ว, and each row gets its ยกเลิก / ลบ button
{const f=paRow;paRow=function(p,A){const r=f(p,A);if(p.closed&&p.cxl)r.st='ยกเลิกแล้ว'+(p.cxl.why?` · ${p.cxl.why}`:'');return r}}
{const f=VIEWS.pjall;VIEWS.pjall=()=>{const h=f();if(!pjCan())return h;
  return h.replace(/(<tr class="pa-r [^"]*" data-a="go" data-m="pj" data-k="dash" data-p="([^"]+)"[\s\S]*?)<\/td>/g,(m,a,id)=>{const p=DB.projects[id];
    return p?`${a}<button type="button" class="btn sm pa-mg" data-a="pjMg" data-id="${id}" title="ยกเลิก ปิด หรือลบโครงการนี้">${p.closed?'เปิดใหม่ / ลบ':'ยกเลิก / ลบ'}</button></td>`:m})
    .replace('กดที่โครงการเพื่อเปิดภาพรวมของโครงการนั้น · ','กดที่โครงการเพื่อเปิดภาพรวมของโครงการนั้น · สร้างผิด กด “ยกเลิก / ลบ” · ')}}
// ข้อมูลโครงการ: the same choices next to ปิดโครงการ, and the banner says it was cancelled
{const f=VIEWS.setup;VIEWS.setup=()=>{let h=f();
  if(P.closed&&P.cxl)h=h.replace(/<div class="pj-closed">[^<]*<\/div>/,`<div class="pj-closed">โครงการนี้ยกเลิกเมื่อ ${thD(P.cxl.d||P.closed)}${P.cxl.why?` (${esc(P.cxl.why)})`:''} ข้อมูลยังดูและพิมพ์ได้ตามปกติ</div>`);
  if(!P.closed)h=h.replace('<button type="button" class="btn del" data-a="delProj">',`<button type="button" class="btn" data-a="pjMg" data-id="${P.id}">ยกเลิกโครงการ</button>$&`);
  return h}}
document.head.insertAdjacentHTML('beforeend',`<style>
.pa-t td .pa-mg{display:inline-flex;margin:6px 0 0 6px;padding:2px 10px;font-size:12px;opacity:.75}
.pa-r:hover .pa-mg,.pa-mg:focus-visible{opacity:1}
.pjm-w{margin:0 0 10px;font-weight:600}
.pjm{display:grid;gap:8px;min-width:min(440px,80vw)}
.pjm-why{display:flex;flex-direction:column;gap:4px;font-size:13px;color:var(--muted)}
.pjm-o{all:unset;box-sizing:border-box;cursor:pointer;display:flex;flex-direction:column;gap:2px;padding:10px 14px;border:1px solid var(--line);border-radius:12px;background:var(--card,var(--bg))}
.pjm-o b{color:var(--ink);font-size:15px}.pjm-o small{color:var(--muted);font-size:12.5px;line-height:1.4}
.pjm-o:hover,.pjm-o:focus-visible{border-color:var(--accent);background:var(--sunk)}
.pjm-o.pri{border-color:var(--accent)}
.pjm-o.del b{color:var(--danger)}.pjm-o.del:hover{border-color:var(--danger)}
.pjm-o[disabled]{cursor:not-allowed;opacity:.55}
</style>`);
if(typeof I18N==='object'&&I18N.en&&I18N.en.x)Object.assign(I18N.en.x,{'ยกเลิก / ลบ':'Cancel / delete','เปิดใหม่ / ลบ':'Reopen / delete','ยกเลิก ปิด หรือลบโครงการนี้':'Cancel, close or delete this project',
  'ยกเลิกโครงการ':'Cancel project','ยกเลิกโครงการ (เก็บข้อมูลไว้)':'Cancel project (keep data)','ปิดโครงการ (งานจบแล้ว)':'Close project (work finished)','ลบทิ้ง (สร้างผิด)':'Delete (made by mistake)',
  'ลบทิ้งถาวร':'Delete permanently','เปิดโครงการอีกครั้ง':'Reopen project','เหตุผลที่ยกเลิก (ไม่บังคับ)':'Reason for cancelling (optional)','ยกเลิกแล้ว':'Cancelled',
  'โครงการนี้ยังไม่มีข้อมูลงาน (ไม่มี BOQ แผนงาน เบิกงวด จัดซื้อ หรือเอกสาร)':'This project has no work in it yet (no BOQ, schedule, claims, purchasing or documents)'});
