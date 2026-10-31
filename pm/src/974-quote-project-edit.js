/* ---------- 4.99.10 แก้โครงการจากรายการใบเสนอราคา (user: "ในกรณีเราตั้งโครงการผิด อยากแก้ไขทำยังไง") ----------
   The โครงการ cell of the quotation list is a button (✎). For a quote not won yet it changes the quote's โครงการ box (Q.pname).
   For a won quote it moves the job it became under another project, or renames that project, the same as ✎ แก้ชื่อโครงการ / งาน
   (968): โครงการ and งาน boxes, the project list to pick from, and a name already used by another job is refused. The quote's
   โครงการ box follows, so the quote and its job say the same. */
function qPjBases(){const B=new Set();Object.values(DB.projects).forEach(p=>{const b=pjSplit(p).base;if(b)B.add(b)});
  (CO().quotes||[]).forEach(q=>{const b=pjName(q.pname||'');if(b)B.add(b)});return [...B].sort((a,b)=>a.localeCompare(b,'th'))}
ACT.qPjEd=b=>{const q=CO().quotes.find(x=>x.id===b.dataset.id);if(!q)return;const p=q.pj&&DB.projects[q.pj];
  if(p&&typeof pjCan==='function'&&!pjCan()){toast('ต้องเป็นฝ่ายที่แก้ข้อมูลโครงการได้');return}
  const J=p?pjSplit(p):null,cur=p?J.base:pjName(q.pname||'')||String(q.pname||'');
  dialog(`โครงการของ ${esc(q.no)}`,`<datalist id="qPjL">${qPjBases().map(x=>`<option value="${esc(x)}">`).join('')}</datalist>
    <p class="hint" style="margin-top:0">${p?`ใบนี้ได้งานแล้ว เป็นงานในโครงการ “${esc(J.base)}” เปลี่ยนชื่อโครงการที่นี่ = ย้ายงานนี้ไปอยู่ใต้โครงการนั้น (เลือกจากรายการได้) ใบเสนอราคาจะเปลี่ยนตาม`:'พิมพ์หรือเลือกโครงการจากรายการ ช่องโครงการในใบเสนอราคาจะเปลี่ยนตาม'}</p>
    <div class="form"><label class="w2">โครงการ<input id="qPjN" list="qPjL" value="${esc(cur)}" autocomplete="off"></label>
    ${p?`<label class="w2">งาน<input id="qPjJ" value="${esc(J.job)}" placeholder="(ไม่มีชื่องาน)"></label>`:''}</div>`,
    `<button type="button" class="btn pri" data-a="qPjEdGo" data-id="${q.id}">บันทึก</button>`);setTimeout(()=>{const i=$('#qPjN');if(i){i.focus();i.select()}},0)};
ACT.qPjEdGo=b=>{const q=CO().quotes.find(x=>x.id===b.dataset.id);if(!q)return;const p=q.pj&&DB.projects[q.pj],a=String(($('#qPjN')||{}).value||'').trim();
  if(!p){q.pname=a;$('#dlg').close();save();render();toast(a?`โครงการ: ${a}`:'ล้างชื่อโครงการแล้ว');return}
  const j=String(($('#qPjJ')||{}).value||'').trim();if(!a&&!j){toast('ใส่ชื่อโครงการ');return}
  const k=pjKey(pjCombine(a||j,a?j:''));if(Object.values(DB.projects).some(x=>x!==p&&pjKey(x.name)===k)){toast('มีงานชื่อนี้ในโครงการนั้นแล้ว ใส่ชื่องานให้ต่างกัน');return}
  pjSetNames(p,a||j,a?j:'');q.pname=a||j;$('#dlg').close();save();render();toast(`ย้ายไปโครงการ ${a||j} แล้ว`)};
{const f=salesQuote;salesQuote=function(){const h=f.apply(this,arguments);
  return h.replace(/(<tr class="[^"]*"><td><button type="button" class="btn ghost sm" data-a="sel" data-k="quote" data-id="([^"]+)">[\s\S]*?<\/td><td[^>]*>[\s\S]*?<\/td><td[^>]*>[\s\S]*?<\/td>)<td( class="[^"]*")?>([\s\S]*?)<\/td>/g,
    (all,pre,id,cl,v)=>`${pre}<td${cl||''}${v?` title="${v}"`:''}><button type="button" class="q-pjc" data-a="qPjEd" data-id="${id}" title="${v?v+' · ':''}แก้ / ย้ายโครงการ"><span class="q-pjt">${v||'<span class="muted">ใส่โครงการ</span>'}</span> <span class="q-pje" aria-hidden="true">✎</span></button></td>`)}}
document.head.insertAdjacentHTML('beforeend',`<style>
.q-pjc{background:none;border:0;padding:2px 4px;margin:-2px -4px;font:inherit;color:inherit;text-align:left;cursor:pointer;border-radius:6px}.q-pjc:hover{background:var(--surface-2,rgba(127,127,127,.12))}
.q-pje{font-size:12px;opacity:0;color:var(--accent,#0e7490)}.q-pjc:hover .q-pje,.q-pjc:focus-visible .q-pje{opacity:1}@media (hover:none){.q-pje{opacity:.6}}
</style>`);
Object.assign(SBKW,{'co.sales.quote':(SBKW['co.sales.quote']||'')+' แก้โครงการ ย้ายโครงการ ตั้งโครงการผิด'});
