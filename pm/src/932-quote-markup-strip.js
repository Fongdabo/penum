/* ---------- 4.47 the markup % in the lines table (user: "ถ้าเอาบวกกำไรมาไว้ในแทบรายการ มันจะดูดีและทำงานง่ายขึ้นไหม") ----------
   A row above the table's column names holds the same fields as the settings above (Q.mk, Q.mkM, Q.mkL, Q.mkE), each over the column it
   prices: ของ % over ขายของ/หน่วย, แรง % over ขายแรง/หน่วย, เครื่อง % over the เครื่อง tick. A change reprices every line at once and the
   settings fields show it too, as both write the same paths. The row is not sticky, so the column names still stay on top when scrolling. */
const qmsTot=Q=>{let c=0,v=0;(Q.items||[]).forEach(i=>{const q=n(i.q);c+=q*(n(i.m)+n(i.l)||(q?n(i.t)/q:0));v+=q*qUnit(Q,i)});return {c,v}};
// 4.52 no separate row (user: "เอาออกเถอะหรือเอาไปไว้ที่ไหนซักที่ก็ได้" / "ดูไม่สวย"): the whole-quote % sit in the column names, a small box
// marked ทั้งใบ under ของ / แรง (บวกกำไร %), เผื่อ and เครื่อง; กำไรรวม moved to the รวมทั้งใบ row at the end of the table (qmsAll)
const qmsIn=(Q,b,k,tip,ph)=>{const v=k?Q['mk'+k]:Q.mk,p=k==='W'?`${b}.wp`:k?`${b}.mk${k}`:`${b}.mk`,x=k==='W'?n(Q.wp)||'':v===''||v==null?'':n(v);
  return `<label class="qmh" title="${tip}"><small>ทั้งใบ</small><input class="r" data-t="num" data-p="${p}" value="${x}" placeholder="${ph==null?fmtq(n(Q.mk)):ph}" aria-label="${tip}"></label>`};
const qmsHelp='บวกกำไรทั้งใบ: ช่อง “ทั้งใบ” ใต้หัวคอลัมน์ใช้กับทุกรายการ แก้แล้วราคาขายทุกบรรทัดคิดใหม่ทันที ช่องในแต่ละแถวใช้เฉพาะรายการนั้น ช่องในแถวที่ว่างไว้ใช้ค่า “ทั้งใบ”';
const qmsHead=(Q,h)=>{const b=`co.quotes.${Q.id}`,eq=(Q.mkE!==''&&Q.mkE!=null)||Q.items.some(i=>!i.hs&&typeof qmIsEq==='function'&&qmIsEq(i)),
    wp=n(Q.wp)||Q.items.some(i=>!i.hs&&typeof qwMeas==='function'&&qwMeas(i));
  return h.replace(/(<th class="r qmk"[^>]*>)ของ(<\/th>)/,(m,a,c)=>a+'ของ'+qmsIn(Q,b,'M','บวกกำไร ค่าของ (วัสดุ) ทั้งใบ (%)')+c)
    .replace(/(<th class="r qmk"[^>]*>)แรง(<\/th>)/,(m,a,c)=>a+'แรง'+qmsIn(Q,b,'L','บวกกำไร ค่าแรง ทั้งใบ (%)')+c)
    .replace(/(<th colspan="2" class="c qmk qg"[^>]*>)บวกกำไร %(<\/th>)/,(m,a,c)=>a+`บวกกำไร % <span class="qms-i" title="${qmsHelp}" aria-label="${qmsHelp}" tabindex="0">ⓘ</span>`
      +(n(Q.mk)?` <label class="qmh qmh-i" title="ใบเก่าที่ตั้งบวกกำไรรวมไว้ ใช้กับส่วนที่ปล่อยว่าง ลบเป็น 0 ได้"><small>ทุกส่วน</small><input class="r" data-t="num" data-p="${b}.mk" value="${n(Q.mk)}" aria-label="บวกค่าดำเนินการ/กำไร (%)"></label>`:'')+c)
    .replace(/(<th class="c qw qp"[^>]*>)%(<\/th>)/,(m,a,c)=>a+'%'+(wp?qmsIn(Q,b,'W','เผื่อปริมาณทั้งใบ (%) ใช้กับบรรทัดที่เป็นหน่วยความยาว พื้นที่ หรือน้ำหนัก (สายไฟ ท่อ) ที่ไม่ได้ใส่เผื่อเอง','0'):'')+c)
    .replace(/(<th rowspan="2" class="c"[^>]*>)เครื่อง(<\/th>)/,(m,a,c)=>a+'เครื่อง'+(eq?qmsIn(Q,b,'E','บวกกำไร ค่าเครื่องทั้งใบ (%) ใช้กับรายการที่ติ๊กช่องเครื่อง'):'')+c)};
// the รวมทั้งใบ row: cost, selling price and profit of the whole quotation (what the strip's กำไรรวม showed)
const qmsAll=Q=>{const T=qmsTot(Q),pr=T.v-T.c,pc=T.v?pr*100/T.v:0;
  return `<tr class="ql-gt ql-all"><td colspan="7">รวมทั้งใบ</td><td class="r qcost">${fmt(T.c,2)}</td><td colspan="4"></td><td class="r qsell">${fmt(T.v,2)}</td><td class="r qprof ${pr<0?'loss':pc<10?'low':'ok'}">${fmt(pr,0)}<small style="display:block">${fmt(pc,1)}%</small></td><td colspan="2"></td></tr>`};
// 4.48 the row's own markup (200 qMkI): top = material (or equipment on a ticked line), bottom = labour; blank shows the default in grey
const qmkCell=(Q,i,b)=>{const eq=typeof qmIsEq==='function'&&qmIsEq(i),v=k=>i['mk'+k]===''||i['mk'+k]==null?'':n(i['mk'+k]),
    dm=qMkOn(Q)?qMkP(Q,eq?'E':'M'):n(Q.mk),dl=qMkOn(Q)?qMkP(Q,'L'):n(Q.mk),
    td=(k,d,lab,sub)=>`<td class="qmk" style="width:78px;min-width:70px"><input class="r${v(k)!==''?' own':''}" data-t="num" data-p="${b}.items.${i.id}.mk${k}" value="${v(k)}" placeholder="${fmtq(d)}" aria-label="${lab}" title="${lab} ว่าง = ${fmtq(d)}% ตามหัวตาราง">${sub?`<small class="qmk-s">${sub}</small>`:''}</td>`;
  return td('M',dm,eq?'บวกกำไรค่าเครื่องของรายการนี้ (%)':'บวกกำไรค่าของของรายการนี้ (%)',eq?'ค่าเครื่อง':'')+td('L',dl,'บวกกำไรค่าแรงของรายการนี้ (%)','')};
// qlTable comes from 982, after this file: wrap it at render time
const qmsWrap=()=>{if(typeof qlTable!=='function'||qlTable.__qms)return;const f=qlTable;qlTable=function(Q){const h=f.apply(this,arguments);if(!Q||!Q.items)return h;
  const i=h.indexOf('</thead>');if(i<0)return h;const j=Q.items.length?h.indexOf('</tbody>',i):-1;
  return qmsHead(Q,h.slice(0,i))+(j<0?h.slice(i):h.slice(i,j)+qmsAll(Q)+h.slice(j))};qlTable.__qms=1};
{const r=render;render=function(){try{qmsWrap()}catch(e){}return r.apply(this,arguments)}}
document.head.insertAdjacentHTML('beforeend',`<style>.ql-t .qmh{display:flex;align-items:center;justify-content:flex-end;gap:2px;margin-top:4px;font-weight:400}.ql-t .qmh small{font-size:10px;color:var(--muted);white-space:nowrap}.ql-t thead .qmh input{width:34px;min-width:0;height:22px;padding:1px 4px;font-size:12px;font-weight:700;text-align:right;background:var(--sunk);border:1px solid transparent;border-radius:6px;color:var(--ink)}.ql-t thead .qmh input:hover{border-color:var(--line)}.ql-t thead .qmh input:focus{border-color:var(--accent,#1C8F9B);background:var(--surface);outline:none}.ql-t thead th.c .qmh{justify-content:center}.ql-t .qmh-i{display:inline-flex;margin:0 0 0 6px}.ql-t tr.ql-all td{border-top:3px double var(--line)}
.ql-t tr.qms th{position:static;background:var(--surface);font-weight:500;font-size:13px;color:var(--ink);vertical-align:middle;padding:6px 8px;border-bottom:1px solid var(--line)}.ql-t tr.qms th.qmk{background:rgba(214,158,46,.08)}.ql-t td.qct{white-space:nowrap;font-weight:600;color:#9a6a12}.qms-i{cursor:help;color:var(--muted);font-size:14px}
.ql-t tr.qms th.qsell{background:rgba(28,143,155,.13)}.qms-f{display:inline-flex;align-items:center;gap:4px;font-weight:600;white-space:nowrap}.qms-f input{width:64px!important;padding:4px 6px;font-weight:700}.qms-v{flex-direction:column;align-items:stretch;gap:2px;font-size:12px}.qms-v input{width:100%!important;min-width:0}
.ql-t tr.qms th.qms-h{font-size:12px;color:var(--muted);white-space:normal;font-weight:400}.ql-t tr.qms th.qms-t{white-space:nowrap}.ql-t tr.qms .qprof{padding:2px 6px;border-radius:6px;font-weight:700}
.ql-t th.qmk,.ql-t td.qmk{background:rgba(214,158,46,.05)}.ql-t td.qmk input{width:100%;min-width:0;border:1px solid var(--line,#cfd8de);border-radius:8px;padding:4px 5px;font-size:13px}.ql-t td.qmk input.own{font-weight:700;color:var(--accent,#1C8F9B);border-color:var(--accent,#1C8F9B)}.ql-t .qmk-s{display:block;text-align:right;font-size:10.5px;color:var(--muted);margin-top:2px}.ql-t .qmk-l{display:flex;align-items:center;gap:3px}.ql-t .qmk-l+.qmk-l{margin-top:3px}.ql-t .qmk-l small{font-size:10.5px;color:var(--muted);min-width:22px}.ql-t .qmk-l input{width:100%;min-width:0;padding:2px 4px;font-size:12.5px}.ql-t .qmk-l input.own{font-weight:700;color:var(--accent,#1C8F9B)}
.ql-t tr.qms .qprof.ok{color:#1e8e5a}.ql-t tr.qms .qprof.low{color:#b45309}.ql-t tr.qms .qprof.loss{color:#c0392b}</style>`);
if(typeof I18N==='object'&&I18N.en&&I18N.en.x)Object.assign(I18N.en.x,{'บวกกำไร':'Markup','ทุกส่วน':'All parts','ของ %':'Material %','แรง %':'Labour %','เครื่อง %':'Equipment %','กำไรรวม':'Total profit',
  'บวกกำไรทั้งใบ':'Markup, whole quote','รวมทุน':'Total cost','กำไรค่าของ %':'Material markup %','กำไรค่าแรง %':'Labour markup %','ค่าเครื่อง':'Equipment'});
