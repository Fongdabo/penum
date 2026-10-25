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
// the row buttons (982): k = the line's index in Q.items
const qoBtns=(Q,k)=>{const i=Q.items[k],p=Q.items[k-1],h=qhHd(i),first=h&&!(p&&p.g===i.g&&!p.hs&&qhHd(p)===h),a=`data-id="${Q.id}" data-i="${i.id}"`;
  return `<button type="button" class="x" data-a="qoIns" ${a} title="แทรกรายการใหม่ใต้แถวนี้" aria-label="แทรกรายการใหม่ใต้แถวนี้">＋</button>`
    +`<button type="button" class="x" data-a="qoOut" ${a} title="เอาออกจากหัวข้อย่อย" aria-label="เอาออกจากหัวข้อย่อย"${h?'':' disabled'}>⇤</button>`
    +`<button type="button" class="x" data-a="qoIn" ${a} title="ตั้งหัวข้อย่อยใหม่ตั้งแต่แถวนี้ลงไป" aria-label="ตั้งหัวข้อย่อยใหม่ตั้งแต่แถวนี้ลงไป"${first?' disabled':''}>⇥</button><br>`};
const qoLine=b=>{const Q=qoQ(b),k=Q?Q.items.findIndex(x=>x.id===b.dataset.i):-1;return k<0?null:{Q,k,i:Q.items[k]}};
ACT.qoIns=b=>{const L=qoLine(b);if(!L)return;const x=qoBlank(L.i.g,qhHd(L.i));L.Q.items.splice(L.k+1,0,x);save();render();qoDesc(L.Q,x)};
ACT.qoIn=b=>{const L=qoLine(b);if(!L)return;const {Q,k,i}=L,g=i.g,h0=qhHd(i),HL=qhList(Q,g),h=qoName(Q,g);let c=0;
  for(let j=k;j<Q.items.length;j++){const x=Q.items[j];if(x.g!==g||x.hs||qhHd(x)!==h0)break;x.head=h;c++}
  HL.splice(h0?HL.indexOf(h0)+1:0,0,h);qhSubs(Q,g,HL);qhOrder(Q,g,HL);S.sel.qlG=g;S.sel.qlH=h;save();render();qoHead(h);
  toast(`ตั้ง “${h}” แล้ว (${c} รายการ) พิมพ์ชื่อหัวข้อทับได้เลย`)};
ACT.qoOut=b=>{const L=qoLine(b);if(!L)return;const {Q,i}=L,g=i.g,h=qhHd(i);if(!h)return;qhSubs(Q,g,qhList(Q,g));i.head='';qhOrder(Q,g,qhList(Q,g));save();render();
  toast(`เอาออกจาก “${h}” แล้ว รายการอยู่ด้านบนของหมวด (กด ↶ ย้อนกลับได้)`)};
// ＋ รายการ on a sub-heading row: a blank line at the end of that sub-heading
const qoHeadBtn=(Q,g,h)=>`<button type="button" class="btn ghost sm" data-a="qoInsH" data-id="${Q.id}" data-g="${esc(g)}" data-h="${esc(h)}" title="เพิ่มรายการใหม่ใต้หัวข้อนี้">＋ รายการ</button>`;
ACT.qoInsH=b=>{const Q=qoQ(b);if(!Q)return;const g=b.dataset.g,h=b.dataset.h,x=qoBlank(g,h);let k=-1;Q.items.forEach((i,j)=>{if(i.g===g&&!i.hs)k=j});
  if(k<0)Q.items.push(x);else Q.items.splice(k+1,0,x);qhOrder(Q,g,qhList(Q,g));save();render();qoDesc(Q,x)};
// + หัวข้อย่อย on a section row: the row appears at once, its name selected to type over
ACT.qhNew=b=>{const Q=qoQ(b);if(!Q)return;const g=b.dataset.g,h=qoName(Q,g);qhSubs(Q,g,[...qhList(Q,g),h]);S.sel.qlG=g;S.sel.qlH=h;save();render();qoHead(h);
  toast('พิมพ์ชื่อหัวข้อย่อยทับได้เลย แล้วกด “＋ รายการ” หรือกด ⇥ ที่รายการที่จะให้อยู่ใต้หัวข้อนี้')};
document.head.insertAdjacentHTML('beforeend',`<style>.ql-t .qo-b{display:inline-block;width:66px;text-align:center;line-height:1.1;white-space:normal}.ql-t .qo-b .x{padding:1px 3px;min-width:0}.ql-t .qo-b .x[disabled]{opacity:.25}.ql-t thead tr:last-child th{white-space:normal;line-height:1.25;vertical-align:bottom}</style>`);
if(typeof I18N==='object'&&I18N.en&&I18N.en.x)Object.assign(I18N.en.x,{'＋ รายการ':'＋ Line','เพิ่มรายการใหม่ใต้หัวข้อนี้':'Add a line under this sub-heading','แทรกรายการใหม่ใต้แถวนี้':'Insert a line below',
  'เอาออกจากหัวข้อย่อย':'Take out of the sub-heading','ตั้งหัวข้อย่อยใหม่ตั้งแต่แถวนี้ลงไป':'Start a sub-heading from this line down'});
