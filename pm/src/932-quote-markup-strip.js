/* ---------- 4.47 the markup % in the lines table (user: "ถ้าเอาบวกกำไรมาไว้ในแทบรายการ มันจะดูดีและทำงานง่ายขึ้นไหม") ----------
   A row above the table's column names holds the same fields as the settings above (Q.mk, Q.mkM, Q.mkL, Q.mkE), each over the column it
   prices: ของ % over ขายของ/หน่วย, แรง % over ขายแรง/หน่วย, เครื่อง % over the เครื่อง tick. A change reprices every line at once and the
   settings fields show it too, as both write the same paths. The row is not sticky, so the column names still stay on top when scrolling. */
const qmsTot=Q=>{let c=0,v=0;(Q.items||[]).forEach(i=>{const q=n(i.q);c+=q*(n(i.m)+n(i.l)||(q?n(i.t)/q:0));v+=q*qUnit(Q,i)});return {c,v}};
const qmsIn=(Q,b,k,l,tip)=>{const v=Q['mk'+k];return `<label class="qms-f qms-v" title="${tip}">${l} %<input class="r" data-t="num" data-p="${b}.mk${k}" value="${v===''||v==null?'':n(v)}" placeholder="${fmtq(n(Q.mk))}" aria-label="${tip}"></label>`};
// 4.50 slimmer (user: "ตัดออกได้ไหม"): no "ทุกส่วน" box or long sentence (the help is on ⓘ); the whole-quote ของ % / แรง % sit over the
// rows' own markup columns; เครื่อง % only once a line is ticked เครื่อง (or it is set), เผื่อ % only when a line is measured in metres etc.
const qmsRow=Q=>{const b=`co.quotes.${Q.id}`,T=qmsTot(Q),pr=T.v-T.c,pc=T.v?pr*100/T.v:0,cl=pr<0?'loss':pc<10?'low':'ok',
    eq=(Q.mkE!==''&&Q.mkE!=null)||Q.items.some(i=>!i.hs&&typeof qmIsEq==='function'&&qmIsEq(i)),
    help='ช่องบนนี้ใช้กับทุกรายการในใบ แก้แล้วราคาขายทุกบรรทัดคิดใหม่ทันที ช่องกำไรค่าของ % / กำไรค่าแรง % ในแต่ละแถวใช้เฉพาะรายการนั้น ช่องในแถวที่ว่างไว้ใช้ค่าบนนี้';
  return `<tr class="qms"><th colspan="3"><b>บวกกำไรทั้งใบ</b> <span class="qms-i" title="${help}" aria-label="${help}" tabindex="0">ⓘ</span>${n(Q.mk)?` <label class="qms-f" title="ใบเก่าที่ตั้งบวกกำไรรวมไว้ ใช้กับส่วนที่ปล่อยว่าง">ทุกส่วน<input class="r" data-t="num" data-p="${b}.mk" value="${n(Q.mk)}" aria-label="บวกค่าดำเนินการ/กำไร (%)">%</label>`:''}</th>${typeof qwStrip==='function'?qwStrip(Q,b):'<th></th>'}
    <th colspan="3"></th><th class="qmk">${qmsIn(Q,b,'M','ของ','บวกกำไร ค่าของ (วัสดุ) ทั้งใบ (%)')}</th><th class="qmk">${qmsIn(Q,b,'L','แรง','บวกกำไร ค่าแรง ทั้งใบ (%)')}</th>
    <th colspan="3" class="r qms-t">กำไรรวม <span class="qprof ${cl}">${fmt(pr,2)} (${fmt(pc,1)}%)</span></th>
    <th class="c" colspan="3">${eq?qmsIn(Q,b,'E','เครื่อง','บวกกำไร ค่าเครื่อง (%) ใช้กับรายการที่ติ๊กช่องเครื่อง'):''}</th></tr>`};
// 4.48 the row's own markup (200 qMkI): top = material (or equipment on a ticked line), bottom = labour; blank shows the default in grey
const qmkCell=(Q,i,b)=>{const eq=typeof qmIsEq==='function'&&qmIsEq(i),v=k=>i['mk'+k]===''||i['mk'+k]==null?'':n(i['mk'+k]),
    dm=qMkOn(Q)?qMkP(Q,eq?'E':'M'):n(Q.mk),dl=qMkOn(Q)?qMkP(Q,'L'):n(Q.mk),
    td=(k,d,lab,sub)=>`<td class="qmk" style="width:78px;min-width:70px"><input class="r${v(k)!==''?' own':''}" data-t="num" data-p="${b}.items.${i.id}.mk${k}" value="${v(k)}" placeholder="${fmtq(d)}" aria-label="${lab}" title="${lab} ว่าง = ${fmtq(d)}% ตามหัวตาราง">${sub?`<small class="qmk-s">${sub}</small>`:''}</td>`;
  return td('M',dm,eq?'บวกกำไรค่าเครื่องของรายการนี้ (%)':'บวกกำไรค่าของของรายการนี้ (%)',eq?'ค่าเครื่อง':'')+td('L',dl,'บวกกำไรค่าแรงของรายการนี้ (%)','')};
// qlTable comes from 982, after this file: wrap it at render time
const qmsWrap=()=>{if(typeof qlTable!=='function'||qlTable.__qms)return;const f=qlTable;qlTable=function(Q){const h=f.apply(this,arguments);if(!Q||!Q.items)return h;
  return h.replace(/(<table class="ql-t"><thead>)(<tr)/,(m,a,b)=>a+qmsRow(Q)+b)};qlTable.__qms=1};
{const r=render;render=function(){try{qmsWrap()}catch(e){}return r.apply(this,arguments)}}
document.head.insertAdjacentHTML('beforeend',`<style>.ql-t tr.qms th{position:static;background:var(--surface);font-weight:500;font-size:13px;color:var(--ink);vertical-align:middle;padding:6px 8px;border-bottom:1px solid var(--line)}.ql-t tr.qms th.qmk{background:rgba(214,158,46,.08)}.ql-t td.qct{white-space:nowrap;font-weight:600;color:#9a6a12}.qms-i{cursor:help;color:var(--muted);font-size:14px}
.ql-t tr.qms th.qsell{background:rgba(28,143,155,.13)}.qms-f{display:inline-flex;align-items:center;gap:4px;font-weight:600;white-space:nowrap}.qms-f input{width:64px!important;padding:4px 6px;font-weight:700}.qms-v{flex-direction:column;align-items:stretch;gap:2px;font-size:12px}.qms-v input{width:100%!important;min-width:0}
.ql-t tr.qms th.qms-h{font-size:12px;color:var(--muted);white-space:normal;font-weight:400}.ql-t tr.qms th.qms-t{white-space:nowrap}.ql-t tr.qms .qprof{padding:2px 6px;border-radius:6px;font-weight:700}
.ql-t th.qmk,.ql-t td.qmk{background:rgba(214,158,46,.05)}.ql-t td.qmk input{width:100%;min-width:0;border:1px solid var(--line,#cfd8de);border-radius:8px;padding:4px 5px;font-size:13px}.ql-t td.qmk input.own{font-weight:700;color:var(--accent,#1C8F9B);border-color:var(--accent,#1C8F9B)}.ql-t .qmk-s{display:block;text-align:right;font-size:10.5px;color:var(--muted);margin-top:2px}.ql-t .qmk-l{display:flex;align-items:center;gap:3px}.ql-t .qmk-l+.qmk-l{margin-top:3px}.ql-t .qmk-l small{font-size:10.5px;color:var(--muted);min-width:22px}.ql-t .qmk-l input{width:100%;min-width:0;padding:2px 4px;font-size:12.5px}.ql-t .qmk-l input.own{font-weight:700;color:var(--accent,#1C8F9B)}
.ql-t tr.qms .qprof.ok{color:#1e8e5a}.ql-t tr.qms .qprof.low{color:#b45309}.ql-t tr.qms .qprof.loss{color:#c0392b}</style>`);
if(typeof I18N==='object'&&I18N.en&&I18N.en.x)Object.assign(I18N.en.x,{'บวกกำไร':'Markup','ทุกส่วน':'All parts','ของ %':'Material %','แรง %':'Labour %','เครื่อง %':'Equipment %','กำไรรวม':'Total profit',
  'บวกกำไรทั้งใบ':'Markup, whole quote','รวมทุน':'Total cost','กำไรค่าของ %':'Material markup %','กำไรค่าแรง %':'Labour markup %','ค่าเครื่อง':'Equipment'});
