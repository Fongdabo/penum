/* ---------- 4.48 sub-headings made in the lines table the way แผนงาน makes them (user: "การเพิ่มหัวข้อ ใช้วิธีเพิ่มแบบแผนงานเลยดีไหม") ----------
   Like the schedule's task list (110 tIns / tInd), each line has ＋ (a new blank line right under it, ready to type a product),
   ⇥ (start a new sub-heading from this line down to the end of its block) and ⇤ (take the line out of its sub-heading).
   "+ หัวข้อย่อย" on a section row no longer asks for a name in a box: the new sub-heading row appears with its name selected,
   to type over, and every sub-heading row has "＋ รายการ". The model stays 918's: i.head per line, lines with none first. */
const qoQ=b=>CO().quotes.find(q=>q.id===b.dataset.id);
const qoName=(Q,g)=>{const L=qhList(Q,g);let k=L.length+1,h;do{h='หัวข้อย่อย '+k++}while(L.includes(h));return h};
const qoFocus=sel=>setTimeout(()=>{const e=document.querySelector(sel);if(!e)return;e.scrollIntoView({block:'center'});e.focus();if(e.select)e.select()},40);
const qoBlank=(g,h)=>({id:uid(),g,head:h||'',type:'',desc:'',unit:'',q:1,m:0,l:0,t:0,sp:''});
const qoDesc=(Q,x)=>qoFocus(`.ql-t input[data-p="co.quotes.${Q.id}.items.${x.id}.desc"]`);
const qoHead=h=>qoFocus(`.ql-t input.qhName[data-h="${CSS.escape(h)}"]`);
// the row buttons (982): k = the line's index in Q.items. 4.51 three levels: ⇥ on a line in a sub-heading starts a group (third
// level) from it down; ⇤ takes a line out of its group, or out of its sub-heading
const qoBtns=(Q,k)=>{const i=Q.items[k],h1=qhHd(i),h2=qhH2(i),a=`data-id="${Q.id}" data-i="${i.id}"`,
    to=h2?'เอาออกจากกลุ่มย่อย':'เอาออกจากหัวข้อย่อย',ti=h2?'อยู่ชั้นลึกสุดแล้ว':h1?'ตั้งกลุ่มย่อยตั้งแต่แถวนี้ลงไป':'ตั้งหัวข้อย่อยใหม่ตั้งแต่แถวนี้ลงไป';
  return `<button type="button" class="x" data-a="qoIns" ${a} title="แทรกรายการใหม่ใต้แถวนี้" aria-label="แทรกรายการใหม่ใต้แถวนี้">＋</button>`
    +`<button type="button" class="x" data-a="qoOut" ${a} title="${to}" aria-label="${to}"${h1?'':' disabled'}>⇤</button>`
    +`<button type="button" class="x" data-a="qoIn" ${a} title="${ti}" aria-label="${ti}"${h2?' disabled':''}>⇥</button><br>`};
const qoLine=b=>{const Q=qoQ(b),k=Q?Q.items.findIndex(x=>x.id===b.dataset.i):-1;return k<0?null:{Q,k,i:Q.items[k]}};
const qoFull=i=>String(i.head||'').trim();
ACT.qoIns=b=>{const L=qoLine(b);if(!L)return;const x=qoBlank(L.i.g,qoFull(L.i));L.Q.items.splice(L.k+1,0,x);save();render();qoDesc(L.Q,x)};
ACT.qoIn=b=>{const L=qoLine(b);if(!L)return;const {Q,k,i}=L,g=i.g,h1=qhHd(i),f0=qoFull(i);if(qhH2(i))return;let c=0;
  if(h1){const G=new Set(Q.items.filter(x=>x.g===g&&qhHd(x)===h1).map(qhH2));let n2=G.size,s;do{s='กลุ่มย่อย '+n2++}while(G.has(s));
    for(let j=k;j<Q.items.length;j++){const x=Q.items[j];if(x.g!==g||x.hs||qoFull(x)!==f0)break;x.head=h1+' · '+s;c++}
    qhOrder(Q,g,qhList(Q,g));save();render();qoFocus(`.ql-t input.qhGName[data-h="${CSS.escape(h1)}"][data-s="${CSS.escape(s)}"]`);toast(`ตั้งกลุ่มย่อยแล้ว (${c} รายการ) พิมพ์ชื่อกลุ่มทับได้เลย เช่น Ducted Type`);return}
  const HL=qhList(Q,g),h=qoName(Q,g);
  for(let j=k;j<Q.items.length;j++){const x=Q.items[j];if(x.g!==g||x.hs||qhHd(x))break;x.head=h;c++}
  HL.splice(0,0,h);qhSubs(Q,g,HL);qhOrder(Q,g,HL);S.sel.qlG=g;S.sel.qlH=h;save();render();qoHead(h);
  toast(`ตั้ง “${h}” แล้ว (${c} รายการ) พิมพ์ชื่อหัวข้อทับได้เลย`)};
ACT.qoOut=b=>{const L=qoLine(b);if(!L)return;const {Q,i}=L,g=i.g,h=qhHd(i),s=qhH2(i);if(!h)return;
  if(s){i.head=h;qhOrder(Q,g,qhList(Q,g));save();render();toast(`เอาออกจากกลุ่ม “${s}” แล้ว อยู่ใต้ “${h}” (กด ↶ ย้อนกลับได้)`);return}
  qhSubs(Q,g,qhList(Q,g));i.head='';qhOrder(Q,g,qhList(Q,g));save();render();toast(`เอาออกจาก “${h}” แล้ว รายการอยู่ด้านบนของหมวด (กด ↶ ย้อนกลับได้)`)};
// 4.51 the รวม row at the end of each section (982): cost under รวมทุน, selling price under ยอดรวม, profit under กำไร
const qlGTot=(Q,g)=>{const T=qhTot(Q,g,null),pr=T.v-T.c,pc=T.v?pr*100/T.v:0;
  return `<tr class="ql-gt"><td colspan="7">รวม${esc(gName(g))}</td><td class="r qcost">${fmt(T.c,2)}</td><td colspan="4"></td><td class="r qsell">${fmt(T.v,2)}</td><td class="r qprof ${pr<0?'loss':pc<10?'low':'ok'}">${fmt(pr,0)}<small style="display:block">${fmt(pc,1)}%</small></td><td colspan="2"></td></tr>`};
// ＋ รายการ on a sub-heading row: a blank line at the end of that sub-heading
const qoHeadBtn=(Q,g,h)=>`<button type="button" class="btn ghost sm" data-a="qoInsH" data-id="${Q.id}" data-g="${esc(g)}" data-h="${esc(h)}" title="เพิ่มรายการใหม่ใต้หัวข้อนี้">＋ รายการ</button>`;
ACT.qoInsH=b=>{const Q=qoQ(b);if(!Q)return;const g=b.dataset.g,h=b.dataset.h,x=qoBlank(g,h);let k=-1;Q.items.forEach((i,j)=>{if(i.g===g&&!i.hs)k=j});
  if(k<0)Q.items.push(x);else Q.items.splice(k+1,0,x);qhOrder(Q,g,qhList(Q,g));save();render();qoDesc(Q,x)};
// + หัวข้อย่อย on a section row: the row appears at once, its name selected to type over
ACT.qhNew=b=>{const Q=qoQ(b);if(!Q)return;const g=b.dataset.g,h=qoName(Q,g);qhSubs(Q,g,[...qhList(Q,g),h]);S.sel.qlG=g;S.sel.qlH=h;save();render();qoHead(h);
  toast('พิมพ์ชื่อหัวข้อย่อยทับได้เลย แล้วกด “＋ รายการ” หรือกด ⇥ ที่รายการที่จะให้อยู่ใต้หัวข้อนี้')};
// the header rows (982, 932) all stick: the second under the first, the ทั้งใบ row (4.55) under the second
{const r=render;render=function(){const x=r.apply(this,arguments);requestAnimationFrame(()=>document.querySelectorAll('.ql-t').forEach(t=>{const a=t.querySelector('tr.qh1 th.qg'),h=a?a.offsetHeight:0;t.querySelectorAll('tr.qh2 th').forEach(th=>th.style.top=h+'px');const b2=t.querySelector('tr.qh2 th'),h2=h+(b2?b2.offsetHeight:0);t.querySelectorAll('tr.qh3 th').forEach(th=>th.style.top=h2+'px')}));return x}}
document.head.insertAdjacentHTML('beforeend',`<style>.ql-t .qo-b{display:inline-block;width:60px;text-align:center;line-height:1.1;white-space:normal}.ql-t .qo-b .x{padding:1px 3px;min-width:0}.ql-t .qo-b .x[disabled]{opacity:.25}.ql-t thead th{vertical-align:bottom}.ql-t thead tr.qh1 th.qg{text-align:center;border-bottom:1px solid var(--line);padding-bottom:3px}.ql-t thead tr.qh2 th{padding-top:3px}
.ql-t td input:not([type=checkbox]),.ql-t td select,.ql-t tr.qms input{background:var(--sunk);border:1px solid transparent;border-radius:8px;padding:5px 8px;box-shadow:none;color:var(--ink)}
.ql-t td input:not([type=checkbox]):hover,.ql-t td select:hover{border-color:var(--line)}.ql-t td input:not([type=checkbox]):focus,.ql-t td select:focus,.ql-t tr.qms input:focus{border-color:var(--accent,#1C8F9B);background:var(--surface);outline:none}
.ql-t td.qmk input,.ql-t td.qw input,.ql-t .qmk-l input{padding:4px 6px}.ql-t td input.r{padding:5px 5px}.ql-t select.qhSel{width:100%;max-width:100%;min-width:0;text-overflow:ellipsis;font-size:11px;padding:1px 4px;background:transparent;color:var(--muted)}.ql-t tr.qh-r .qhName{flex:0 1 auto;field-sizing:content;min-width:240px;max-width:680px}
.ql-t .ql-di{display:flex;align-items:center;gap:6px}.ql-t .ql-dash{color:var(--muted);font-weight:600}.ql-t td.ql-dc.l1{padding-left:8px}.ql-t td.ql-dc.l2{padding-left:20px}.ql-t .ql-di input{min-width:0;flex:1 1 auto}
.ql-t tr.qh-gr td{padding-left:34px;background:transparent}.ql-t tr.qh-gr .qhGName{font-style:italic;font-weight:600;width:auto;field-sizing:content;min-width:200px;max-width:520px;background:transparent;border-color:transparent}.ql-t tr.qh-gr .qhGName:hover{border-color:var(--line)}
.ql-t td.qct,.ql-t td.qsell,.ql-t td.qprof,.ql-t tr.ql-gt td.qcost{font-size:12.5px;padding-left:4px;padding-right:4px;white-space:nowrap}.ql-t tr.qh-r .qhName{font-weight:700}.ql-t tr.ql-gt td{font-weight:700;border-top:2px solid var(--line);background:var(--sunk)}</style>`);
// 4.54 every box in a line alike (user: "ดูแล้วช่องมันไม่เข้าพวก"): one height, padding, corner and font; numbers right, text left; every cell
// centred on the row; the row buttons a 3 × 2 grid (＋ ⇤ ⇥ / ▲ ▼ ✕). 4.55 the sticky header cells are solid (their tint over --sunk) and above the
// rows, so the lines no longer show through them when the table scrolls (user: "ให้ไหมเกิดอะไรขึ้น").
// 4.56 the section row's Hanger Support box sits right after the section totals instead of at the far right, where a narrow window cut it off
document.head.insertAdjacentHTML('beforeend',`<style>.ql-t tbody td{vertical-align:middle}
.ql-t tbody td input:not([type=checkbox]),.ql-t tbody td select:not(.qhSel):not(.qc-us){height:32px;box-sizing:border-box;padding:0 8px;border-radius:8px;font-size:13.5px;line-height:30px;background:var(--sunk);border:1px solid transparent;color:var(--ink);box-shadow:none;vertical-align:middle}
.ql-t tbody td input.r,.ql-t tbody td.qmk input,.ql-t tbody td.qw input{padding:0 7px;text-align:right;font-weight:500}
.ql-t tbody td input:not([type=checkbox])::placeholder{color:var(--muted);opacity:.75;font-weight:400}
.ql-t tbody td.qmk input.own,.ql-t tbody td.qw input.own{font-weight:700;color:var(--accent,#1C8F9B);border-color:transparent}
.ql-t tbody td input:not([type=checkbox]):hover{border-color:var(--line)}.ql-t tbody td input:not([type=checkbox]):focus{border-color:var(--accent,#1C8F9B);background:var(--surface);outline:none}
.ql-t tbody tr.qh-gr td .qhGName{background:transparent}
.ql-t .qo-b{display:grid;grid-template-columns:repeat(3,20px);gap:2px 3px;width:auto;justify-content:center}.ql-t .qo-b br{display:none}
.ql-t .qo-b .x{width:20px;height:20px;padding:0;display:inline-flex;align-items:center;justify-content:center;font-size:13px;line-height:1}
.ql-t tbody td.qcost,.ql-t tbody td.qmk,.ql-t tbody td.qq{padding-left:4px;padding-right:4px}.ql-t tbody td input.r{font-size:13px;padding:0 6px}.ql-t tbody tr:not(.grp):not(.ql-gt)>td:last-child{padding-left:4px;padding-right:4px}.ql-t tbody tr:not(.grp):not(.ql-gt)>td:nth-last-child(2){padding-left:4px;padding-right:4px}.ql-t thead th{z-index:3;background-color:var(--sunk)}.ql-t thead th.qw{background:linear-gradient(rgba(110,90,200,.06),rgba(110,90,200,.06)),var(--sunk)}.ql-t thead th.qcost{background:linear-gradient(rgba(214,158,46,.09),rgba(214,158,46,.09)),var(--sunk)}.ql-t thead th.qmk{background:linear-gradient(rgba(214,158,46,.05),rgba(214,158,46,.05)),var(--sunk)}.ql-t thead th.qsell{background:linear-gradient(rgba(28,143,155,.07),rgba(28,143,155,.07)),var(--sunk)}.ql-t tbody tr.grp .qlhs{float:none;display:inline-flex;vertical-align:middle;margin-left:18px;white-space:nowrap}.ql-t tbody tr.grp .qlhs input.qlHsP{width:56px;height:28px}.ql-t thead th.qp .qmh{flex-direction:column;align-items:stretch;gap:1px}.ql-t thead th.qp .qmh small{text-align:center}.ql-t thead th.qp .qmh input{width:100%}</style>`);
if(typeof I18N==='object'&&I18N.en&&I18N.en.x)Object.assign(I18N.en.x,{'＋ รายการ':'＋ Line','เพิ่มรายการใหม่ใต้หัวข้อนี้':'Add a line under this sub-heading','แทรกรายการใหม่ใต้แถวนี้':'Insert a line below',
  'เอาออกจากหัวข้อย่อย':'Take out of the sub-heading','เอาออกจากกลุ่มย่อย':'Take out of the group','ตั้งกลุ่มย่อยตั้งแต่แถวนี้ลงไป':'Start a group from this line down','อยู่ชั้นลึกสุดแล้ว':'Already at the deepest level','ตั้งหัวข้อย่อยใหม่ตั้งแต่แถวนี้ลงไป':'Start a sub-heading from this line down','ของ/หน่วย':'Material/unit','แรง/หน่วย':'Labour/unit','ยอดรวม':'Total','บวกกำไร %':'Markup %','ของ':'Material','แรง':'Labour'});
