/* ---------- 4.99.36 a claim paid in full always reads "รับเงินแล้ว" ----------
   billSync (770) only ran when a receipt row was edited, so a claim whose receipts already add up to the net amount
   could still say "ส่งเบิกแล้ว" (status picked again by hand, data from another device or an older version, or a
   changed amount). It then showed the yellow "รับบางส่วน · ค้าง 0" badge and a red overdue badge. Before each draw,
   every project's claims with receipts are checked once more; billCalc reads the global P, so P is switched per project. */
function billSyncAll(){let ch=0;const cur=P;
  try{Object.values(DB.projects||{}).forEach(p=>{if(!p||!(p.bills||[]).some(b=>b.status!=='paid'&&(b.rcpts||[]).length))return;P=p;
    p.bills.forEach(b=>{if(b.status==='paid'||!(b.rcpts||[]).length)return;const s=b.status;try{billSync(b)}catch(e){}if(b.status!==s)ch=1})})}
  finally{P=cur}return ch}
{const f=render;render=(...a)=>{try{if(billSyncAll())save()}catch(e){}return f(...a)}}
