/* ---------- 4.44: delete a bid from the งานประมูลและการทำราคา list ----------
   A ✕ at the end of each row asks first, then removes the bid; ↶ ย้อนกลับ (Ctrl+Z) brings it back.
   A quotation, lead or bank guarantee made from the bid stays; only the bid goes. */
ACT.tdDelete=b=>{const C=tdCfg(),t=C.tenders.find(x=>x.id===b.dataset.id);if(!t)return;
  const linked=[t.quote&&C.quotes.some(q=>q.id===t.quote)?'ใบเสนอราคาที่สร้างจากงานนี้':'',t.lead?'งานที่ติดตาม':'',t.lg?'หนังสือค้ำประกันซอง':''].filter(Boolean);
  if(!confirm(`ลบงานประมูล ${t.no}${t.title?' '+t.title:''}?${linked.length?`\n${linked.join(' ')} ยังอยู่ ไม่ถูกลบ`:''}\nกด ↶ ย้อนกลับ ได้ถ้าลบผิด`))return;
  C.tenders.splice(C.tenders.indexOf(t),1);if(S.sel.td===t.id)S.sel.td=null;save();render();toast(`ลบ ${t.no} แล้ว · กด ↶ ย้อนกลับ ถ้าลบผิด`)};
{const f=tdList;tdList=function(){return f().replace('<th>สถานะ</th></tr>','<th>สถานะ</th><th></th></tr>').replace('<tr><td colspan="9" class="muted">','<tr><td colspan="10" class="muted">')
  .replace(/(<tr class="[^"]*"><td><button type="button" class="btn ghost sm" data-a="sel" data-k="td" data-id="([^"]+)">[\s\S]*?)<\/tr>/g,
    (s,row,id)=>`${row}<td><button type="button" class="x" data-a="tdDelete" data-id="${id}" title="ลบงานประมูลนี้" aria-label="ลบงานประมูลนี้">✕</button></td></tr>`)}}
