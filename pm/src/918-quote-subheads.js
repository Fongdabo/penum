/* ---------- 4.32 main headings and sub-headings on a quotation (user: "อยากเราสามารถทำหัวข้อย่อยหัวข้อหลัก") ----------
   A section (i.g) is the main heading, numbered 1, 2, …; a line's i.head is its sub-heading, numbered 1.1, 1.2, … on the
   printout (981 already printed them). Before, only the air-con systems made sub-headings. Now every section row in the lines
   table has "+ หัวข้อย่อย"; a sub-heading row can be renamed, moved ▲▼ with its lines, or removed (its lines stay in the
   section); each line has a small box to move it under another sub-heading; the add bar picks the sub-heading for a new line.
   A sub-heading with no lines yet is kept in Q.subs[g] so it shows until lines go in. New quotes print a subtotal under each
   sub-heading (Q.hsub, 981 det); older quotes print as before unless ticked. The lines table (982 qlTable) calls these. */
// 4.51 a head can carry a third level after " · " ("Split Type · Ducted Type", as PENUM MEP and imported BOQs write it): qhHd is the
// sub-heading (1.1), qhH2 the group under it, shown in italics with its lines indented further (user: "รายการกรณีที่มีหัวข้อย่อย อยากให้เป็นแบบนี้")
const qhHd=i=>String(i.head||'').split(' · ')[0].trim();
const qhH2=i=>{const s=String(i.head||''),j=s.indexOf(' · ');return j<0?'':s.slice(j+3).trim()};
// sub-headings of a section: those on its lines (in order), then empty ones kept in Q.subs
const qhList=(Q,g)=>{const L=[];Q.items.forEach(i=>{const h=qhHd(i);if(i.g===g&&!i.hs&&h&&!L.includes(h))L.push(h)});((Q.subs||{})[g]||[]).forEach(h=>{if(h&&!L.includes(h))L.push(h)});return L};
const qhSubs=(Q,g,L)=>{Q.subs=Q.subs||{};if(L.length)Q.subs[g]=L;else delete Q.subs[g]};
const qhSell=(Q,g,h)=>Q.items.reduce((s,i)=>i.g===g&&!i.hs&&qhHd(i)===h?s+n(i.q)*qUnit(Q,i):s,0);
// 4.42 cost, selling price and profit of a sub-heading (h) or a whole section (h null), shown on its row while editing
const qhTot=(Q,g,h)=>{let c=0,v=0;Q.items.forEach(i=>{if(i.g!==g||(h!=null&&(i.hs||qhHd(i)!==h)))return;const q=n(i.q);c+=q*(n(i.m)+n(i.l)||(q?n(i.t)/q:0));v+=q*qUnit(Q,i)});return {c,v}};
const qhTotH=(Q,g,h)=>{const T=qhTot(Q,g,h),pr=T.v-T.c,pc=T.v?pr*100/T.v:0,cl=pr<0?'loss':pc<10?'low':'ok';
  return `<small class="qh-tot">ทุน ${fmt(T.c,2)} · ขาย <b>${fmt(T.v,2)}</b> · กำไร <span class="qh-p ${cl}">${fmt(pr,2)} (${fmt(pc,1)}%)</span></small>`};
// a line goes after the last line of its new sub-heading (or the section's last line), so blocks stay together
const qhPut=(Q,i,h)=>{const k0=Q.items.indexOf(i);if(k0<0)return;Q.items.splice(k0,1);i.head=h;let k=-1,kh=-1;
  Q.items.forEach((x,j)=>{if(x.g===i.g&&!x.hs){k=j;if(qhHd(x)===h)kh=j}});if(kh>=0)k=kh;if(k<0)Q.items.splice(Math.min(k0,Q.items.length),0,i);else Q.items.splice(k+1,0,i)};
// the lines of a section in the order of its sub-heading list: lines without one first, then each block
// inside a sub-heading, lines without a group come first, then each group in the order it first appears
const qhGrp=A=>{const G=[];A.forEach(i=>{const s=qhH2(i);if(!G.includes(s))G.push(s)});G.sort((a,b)=>(a?1:0)-(b?1:0));return G.flatMap(s=>A.filter(i=>qhH2(i)===s))};
const qhOrder=(Q,g,L)=>{const I=Q.items.filter(i=>i.g===g&&!i.hs),hs=Q.items.filter(i=>i.g===g&&i.hs),R=[...I.filter(i=>!qhHd(i)),...L.flatMap(h=>qhGrp(I.filter(i=>qhHd(i)===h))),...I.filter(i=>qhHd(i)&&!L.includes(qhHd(i)))];
  const at=Q.items.findIndex(i=>i.g===g);const rest=Q.items.filter(i=>i.g!==g);rest.splice(Math.max(0,Math.min(at,rest.length)),0,...R,...hs);Q.items=rest};
const qhQ=b=>CO().quotes.find(q=>q.id===b.dataset.id);
// ---- what the lines table shows
const qhSecL=(Q,g,gi)=>`<b class="qh-n">${gi}</b> ${esc(gName(g))} ${qhTotH(Q,g,null)} <button type="button" class="btn ghost sm qh-add" data-a="qhNew" data-id="${Q.id}" data-g="${esc(g)}" title="เพิ่มหัวข้อย่อยในหมวดนี้ เช่น 1.1 กล้อง, 1.2 สายและท่อ">+ หัวข้อย่อย</button>`;
const qhRow=(Q,g,h,gi,hi,cols,empty)=>{const L=qhList(Q,g),k=L.indexOf(h),bt=(a,l,t,d,x)=>`<button type="button" class="x${a==='qhMv'?' qlmv':''}" data-a="${a}" data-id="${Q.id}" data-g="${esc(g)}" data-h="${esc(h)}"${d!=null?` data-d="${d}"`:''} title="${t}" aria-label="${t}"${x?' disabled':''}>${l}</button>`;
  return `<tr class="grp qh-r"><td colspan="${cols}"><div class="qh-in"><b class="qh-n">${gi}.${hi}</b><input class="qhName" data-id="${Q.id}" data-g="${esc(g)}" data-h="${esc(h)}" value="${esc(h)}" aria-label="ชื่อหัวข้อย่อย">
    ${empty?'<small class="muted">ยังไม่มีรายการ กด “＋ รายการ” หรือ “เลือกรายการเข้าหัวข้อนี้”</small>':qhTotH(Q,g,h)}<span class="sp"></span>${typeof qoHeadBtn==='function'?qoHeadBtn(Q,g,h):''}
    <button type="button" class="btn ghost sm qh-pk" data-a="qhPickBtn" data-id="${Q.id}" data-g="${esc(g)}" data-h="${esc(h)}" title="ติ๊กรายการที่มีอยู่แล้วเพื่อย้ายเข้าหัวข้อนี้">เลือกรายการเข้าหัวข้อนี้</button>    ${bt('qhMv','▲','เลื่อนหัวข้อขึ้น (ย้ายรายการไปด้วย)',-1,k<=0)}${bt('qhMv','▼','เลื่อนหัวข้อลง (ย้ายรายการไปด้วย)',1,k<0||k>=L.length-1)}${bt('qhDel','✕','ลบหัวข้อย่อย (รายการยังอยู่ในหมวด)')}</div></td></tr>`};
const qhEmpty=(Q,g,gi,cols)=>{const L=qhList(Q,g),used=new Set(Q.items.filter(i=>i.g===g&&!i.hs).map(qhHd));return L.map(h=>used.has(h)?'':qhRow(Q,g,h,gi,'–',cols,1)).join('')};
const qhSel=(Q,i)=>{if(i.hs)return '';const L=qhList(Q,i.g),h=qhHd(i);if(!L.length)return '';
  return `<select class="qhSel" data-id="${Q.id}" data-i="${i.id}" aria-label="หัวข้อย่อยของรายการนี้" title="ย้ายรายการไปหัวข้อย่อยอื่น"><option value="">— ไม่อยู่ในหัวข้อย่อย —</option>${L.map(x=>`<option value="${esc(x)}"${x===h?' selected':''}>${esc(x)}</option>`).join('')}</select>`};
const qhAddOpts=(Q,g)=>`<option value="">${g==='eq'?'หัวข้อย่อย: ตามระบบที่เลือก':'ไม่มีหัวข้อย่อย'}</option>${qhList(Q,g).map(h=>`<option value="${esc(h)}"${S.sel.qlH===h?' selected':''}>${esc(h)}</option>`).join('')}<option value="__new">+ หัวข้อย่อยใหม่…</option>`;
const qhAddSel=(Q,g)=>`<select id="qlH" data-id="${Q.id}" aria-label="หัวข้อย่อย" title="หัวข้อย่อยของรายการที่จะเพิ่ม">${qhAddOpts(Q,g)}</select>`;
const qhAsk=(Q,g)=>{const h=(prompt(`ชื่อหัวข้อย่อยใหม่ใน “${gName(g)}” (เช่น กล้อง, สายและท่อ, ค่าติดตั้ง)`)||'').trim();if(!h)return '';const L=qhList(Q,g);if(!L.includes(h))qhSubs(Q,g,[...L,h]);return h};
// 4.42 tick lines already in the table to put them under a sub-heading in one go (user: "ตั้งหัวข้อย่อย ไม่เพิ่มชื่อสินค้าได้ไหม");
// "+ เพิ่มรายการ" with an empty product box and a sub-heading picked opens this, creating the sub-heading when it is new
function qhPick(Q,g,h){const L=qhList(Q,g);if(!L.includes(h))qhSubs(Q,g,[...L,h]);const I=Q.items.filter(i=>i.g===g&&!i.hs);
  dialog(`เลือกรายการเข้าหัวข้อย่อย “${esc(h)}”`,`<p class="hint" style="margin-top:0">ติ๊กรายการที่จะอยู่ใต้หัวข้อนี้ (${esc(gName(g))}) รายการที่เอาติ๊กออกจะออกจากหัวข้อนี้</p>
  ${I.length?`<label class="qh-pa"><input type="checkbox" data-qh-all="1"> เลือกทั้งหมด</label><div class="qh-pl">${I.map(i=>{const c=qhHd(i);return `<label><input type="checkbox" class="qhPk" value="${i.id}"${c===h?' checked':''}> <span>${esc([i.type,i.desc].filter(Boolean).join(' ')||'(ไม่มีชื่อ)')}</span>${c&&c!==h?`<small class="muted">อยู่ใน “${esc(c)}”</small>`:''}</label>`}).join('')}</div>`:'<p class="empty">หมวดนี้ยังไม่มีรายการ</p>'}`,
  I.length?`<button type="button" class="btn pri" data-a="qhPickGo" data-id="${Q.id}" data-g="${esc(g)}" data-h="${esc(h)}">ย้ายเข้าหัวข้อย่อย</button>`:'');save()}
ACT.qhPickBtn=b=>{const Q=qhQ(b);if(Q)qhPick(Q,b.dataset.g,b.dataset.h)};
ACT.qhPickGo=b=>{const Q=qhQ(b);if(!Q)return;const g=b.dataset.g,h=b.dataset.h,on=new Set([...document.querySelectorAll('#dlg .qhPk:checked')].map(x=>x.value));let k=0;
  Q.items.filter(i=>i.g===g&&!i.hs).forEach(i=>{const c=qhHd(i);if(on.has(i.id)&&c!==h){i.head=h;k++}else if(!on.has(i.id)&&c===h){i.head='';k++}});
  qhOrder(Q,g,qhList(Q,g));$('#dlg').close();S.sel.qlH=h;save();render();toast(k?`ย้าย ${k} รายการแล้ว (กด ↶ ย้อนกลับได้)`:'ไม่มีรายการที่เปลี่ยน')};
document.addEventListener('change',e=>{const t=e.target;if(t&&t.dataset&&t.dataset.qhAll)document.querySelectorAll('#dlg .qhPk').forEach(x=>x.checked=t.checked)});
// 4.51 the group row (third level): an italic name to type over, its totals, ✕ puts its lines back under the sub-heading
const qhTotX=(Q,g,full)=>{let c=0,v=0;Q.items.forEach(i=>{if(i.g!==g||i.hs||String(i.head||'').trim()!==full)return;const q=n(i.q);c+=q*(n(i.m)+n(i.l)||(q?n(i.t)/q:0));v+=q*qUnit(Q,i)});const pr=v-c,pc=v?pr*100/v:0;
  return `<small class="qh-tot">ทุน ${fmt(c,2)} · ขาย <b>${fmt(v,2)}</b> · กำไร <span class="qh-p ${pr<0?'loss':pc<10?'low':'ok'}">${fmt(pr,2)} (${fmt(pc,1)}%)</span></small>`};
const qhGRow=(Q,g,h1,h2,cols)=>`<tr class="grp qh-gr"><td colspan="${cols}"><div class="qh-in"><input class="qhGName" data-id="${Q.id}" data-g="${esc(g)}" data-h="${esc(h1)}" data-s="${esc(h2)}" value="${esc(h2)}" aria-label="ชื่อกลุ่มย่อย">${qhTotX(Q,g,h1+' · '+h2)}<span class="sp"></span><button type="button" class="x" data-a="qhGDel" data-id="${Q.id}" data-g="${esc(g)}" data-h="${esc(h1)}" data-s="${esc(h2)}" title="ลบกลุ่มย่อย (รายการยังอยู่ในหัวข้อ)" aria-label="ลบกลุ่มย่อย">✕</button></div></td></tr>`;
ACT.qhGDel=b=>{const Q=qhQ(b);if(!Q)return;const g=b.dataset.g,h=b.dataset.h,full=h+' · '+b.dataset.s;Q.items.forEach(i=>{if(i.g===g&&String(i.head||'').trim()===full)i.head=h});qhOrder(Q,g,qhList(Q,g));save();render();toast(`ลบกลุ่มย่อย “${b.dataset.s}” แล้ว รายการยังอยู่ใน “${h}” (กด ↶ ย้อนกลับได้)`)};
document.addEventListener('change',e=>{const t=e.target;if(!t||!t.classList||!t.classList.contains('qhGName'))return;const Q=qhQ(t);if(!Q)return;const g=t.dataset.g,h=t.dataset.h,o=t.dataset.s,v=t.value.trim().replace(/ · /g,' - ');
  if(!v||v===o){t.value=o;return}Q.items.forEach(i=>{if(i.g===g&&String(i.head||'').trim()===h+' · '+o)i.head=h+' · '+v});qhOrder(Q,g,qhList(Q,g));save();render()});
// ---- actions
ACT.qhNew=b=>{const Q=qhQ(b);if(!Q)return;const g=b.dataset.g,h=qhAsk(Q,g);if(!h)return;S.sel.qlG=g;S.sel.qlH=h;save();render();toast(`เพิ่มหัวข้อย่อย “${h}” แล้ว เลือกไว้ในช่องเพิ่มรายการให้แล้ว`)};
ACT.qhMv=b=>{const Q=qhQ(b);if(!Q)return;const g=b.dataset.g,L=qhList(Q,g),k=L.indexOf(b.dataset.h),j=k+ +b.dataset.d;if(k<0||j<0||j>=L.length)return;[L[k],L[j]]=[L[j],L[k]];
  qhSubs(Q,g,L);qhOrder(Q,g,L);save();render()};
ACT.qhDel=b=>{const Q=qhQ(b);if(!Q)return;const g=b.dataset.g,h=b.dataset.h;Q.items.forEach(i=>{if(i.g===g&&qhHd(i)===h)i.head=''});qhSubs(Q,g,qhList(Q,g).filter(x=>x!==h));
  if(S.sel.qlH===h)S.sel.qlH='';qhOrder(Q,g,qhList(Q,g));save();render();toast(`ลบหัวข้อย่อย “${h}” แล้ว รายการยังอยู่ในหมวด (กด ↶ ย้อนกลับได้)`)};
document.addEventListener('change',e=>{const t=e.target;if(!t||!t.classList)return;
  if(t.classList.contains('qhName')){const Q=qhQ(t);if(!Q)return;const g=t.dataset.g,o=t.dataset.h,v=t.value.trim();if(!v||v===o){t.value=o;return}
    const L=qhList(Q,g);if(L.includes(v)&&!confirm(`มีหัวข้อ “${v}” อยู่แล้ว รวมรายการเข้าด้วยกันไหม`)){t.value=o;return}
    Q.items.forEach(i=>{if(i.g===g&&qhHd(i)===o)i.head=v+(qhH2(i)?' · '+qhH2(i):'')});qhSubs(Q,g,[...new Set(L.map(x=>x===o?v:x))]);qhOrder(Q,g,qhList(Q,g));if(S.sel.qlH===o)S.sel.qlH=v;save();render();return}
  if(t.classList.contains('qhSel')){const Q=qhQ(t),i=Q&&Q.items.find(x=>x.id===t.dataset.i);if(!i)return;qhPut(Q,i,t.value);save();render();return}
  if(t.id==='qlH'){const Q=qhQ(t);if(!Q)return;if(t.value==='__new'){const g=($('#qlG')||{}).value||'eq',h=qhAsk(Q,g);S.sel.qlH=h;if(h)save();t.innerHTML=qhAddOpts(Q,g);t.value=h;return}S.sel.qlH=t.value;return}
  if(t.id==='qlG'){const h=$('#qlH'),Q=h&&qhQ(h);if(!Q)return;S.sel.qlH='';h.innerHTML=qhAddOpts(Q,t.value)}});
// new quotes print a subtotal under each sub-heading; a tick on the lines table turns it on or off
{const f=NEW.quotes;NEW.quotes=function(){return Object.assign(f.apply(this,arguments),{hsub:true})}}
const qhSubTick=(Q,b)=>`<label class="qh-tick"><input type="checkbox" data-t="chk" data-p="${b}.hsub"${Q.hsub?' checked':''}> พิมพ์ยอดรวมใต้หัวข้อย่อยแต่ละหัวข้อ</label>`;
document.head.insertAdjacentHTML('beforeend',`<style>.ql-t .qh-n{display:inline-block;min-width:30px;color:var(--accent,#1C8F9B)}.ql-t .qh-add{font-size:11.5px;padding:1px 8px;margin-left:6px;font-weight:400}
.ql-t tr.qh-r td{padding-left:22px;background:rgba(28,143,155,.05)}.qh-in{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.qh-in input.qhName{width:auto;min-width:220px;max-width:420px;font-weight:600;padding:3px 8px;border:1px dashed var(--line,#c5d2db);background:var(--card,#fff)}.qh-in .sp{flex:1}
.ql-t .qh-tot{font-weight:400;color:var(--muted,#567080);margin:0 6px;white-space:nowrap}.ql-t .qh-tot b{color:var(--ink,inherit)}.qh-p.ok{color:var(--good,#1e8e5a)}.qh-p.low{color:var(--warn-c,#b7791f)}.qh-p.loss{color:var(--danger,#c0392b);font-weight:700}
.qh-pl{display:flex;flex-direction:column;gap:4px;max-height:50vh;overflow:auto;min-width:min(520px,80vw);border:1px solid var(--line,#d5dee5);border-radius:8px;padding:8px 10px}.qh-pl label{display:flex;gap:8px;align-items:baseline;flex-wrap:wrap;font-size:14px}.qh-pl small{font-size:11.5px}.qh-pa{display:flex;gap:8px;align-items:center;margin:0 0 6px;font-weight:600}.ql-t .qh-pk{font-size:11.5px;padding:1px 8px}
.ql-t select.qhSel{display:block;font-size:11px;padding:1px 4px;margin-bottom:3px;max-width:100%;width:auto;color:var(--muted,#567080)}#qlH{max-width:220px}.qh-tick{display:flex;gap:6px;align-items:center;font-size:13px;margin:4px 0}</style>`);
if(typeof I18N==='object'&&I18N.en&&I18N.en.x)Object.assign(I18N.en.x,{'+ หัวข้อย่อย':'+ Sub-heading','— ไม่อยู่ในหัวข้อย่อย —':'— No sub-heading —','หัวข้อย่อย: ตามระบบที่เลือก':'Sub-heading: by system',
  'ไม่มีหัวข้อย่อย':'No sub-heading','เลือกรายการเข้าหัวข้อนี้':'Pick lines for this sub-heading','ย้ายเข้าหัวข้อย่อย':'Move under the sub-heading','เลือกทั้งหมด':'Select all','+ หัวข้อย่อยใหม่…':'+ New sub-heading…','พิมพ์ยอดรวมใต้หัวข้อย่อยแต่ละหัวข้อ':'Print a subtotal under each sub-heading','ยังไม่มีรายการ กด “＋ รายการ” หรือ “เลือกรายการเข้าหัวข้อนี้”':'No lines yet. Press “＋ Line” or “Pick lines for this sub-heading”'});
