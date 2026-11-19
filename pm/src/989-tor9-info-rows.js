/* ---------- 4.99.64 TOR: headings and background are not questions; clause numbers follow the TOR's nesting ----------
   User (2026-11-19, TOR-001 of รพ.ค่ายสุรนารี): "ข้อ 1 มันคือคำถามหรอ". ความเป็นมา and the section headings asked "เราทำได้ไหม" like a
   requirement, and a list numbered 1, 2, … again inside section 2 showed the same numbers twice. "เราทำได้ไหม" now has
   "หัวข้อ / ข้อมูล" (ok 'i'): such a row needs no answer, is left out of ตอบแล้ว x/y, and prints as a heading on ใบตอบ TOR.
   ดึงข้อจากไฟล์ marks them by itself (a clause that has sub-clauses, ความเป็นมา, สถานที่ติดต่อ) and numbers a list that starts again
   at 1 inside a section under that section (2 → 2.1, 2.2, …; a second list there, after a heading or not, 2.7 → 2.7.1, 2.7.1.1, …). */
TOROK.push(['i','หัวข้อ / ข้อมูล (ไม่ต้องตอบ)']);
// torCnt (989-tor.js) leaves ok 'i' rows out of ตอบแล้ว x/y
// numbers that start again inside a section go under it; rows are the ones one pull added, in the file's order
function torRenest(rows){let top=0,nest=null,c=0,sub=null;
  rows.forEach(r=>{const ref=String(r.ref||'').trim(),p=ref.split('.');
    if(!ref){if(top){const pre=nest||String(top);c++;r.ref=pre+'.'+c;sub=r.ref;nest=pre}return}
    const N=+p[0];
    if(p.length===1){
      if(nest!=null){if(N===c+1){c=N;r.ref=nest+'.'+N;return}if(N===top+1){nest=null;sub=null;top=N;return}
        if(N<=c){nest=sub||nest+'.'+(c+1);sub=null;c=N;r.ref=nest+'.'+N;return}nest=null;top=N;return}
      if(!top||N===top+1){top=N;return}
      if(N<=top){nest=String(top);c=N;r.ref=nest+'.'+N}return}
    if(nest!=null)r.ref=nest+'.'+ref});
  // a clause that has its own sub-clauses is a heading; the background and the contact address are information
  rows.forEach((r,i)=>{if(r.ok||String(r.ans||'').trim())return;const nx=rows[i+1],ref=String(r.ref||'');
    if(nx&&ref&&String(nx.ref||'').startsWith(ref+'.')&&String(r.t||'').length<160||/^(ความเป็นมา|สถานที่ติดต่อ)/.test(String(r.t||'').trim()))r.ok='i'});
  return rows}
{const f=ACT.torPull;ACT.torPull=async function(b){const t=torCfg().find(x=>x.id===b.dataset.id),had=new Set(((t&&t.req)||[]).map(r=>r.id));
  const x=await f.apply(this,arguments);try{if(t){const add=(t.req||[]).filter(r=>!had.has(r.id));if(add.length){torRenest(add);save();render()}}}catch(e){console.warn('torRenest',e)}return x}}
