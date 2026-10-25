/* ---------- 4.47 the markup % in the lines table (user: "ถ้าเอาบวกกำไรมาไว้ในแทบรายการ มันจะดูดีและทำงานง่ายขึ้นไหม") ----------
   A row above the table's column names holds the same fields as the settings above (Q.mk, Q.mkM, Q.mkL, Q.mkE), each over the column it
   prices: ของ % over ขายของ/หน่วย, แรง % over ขายแรง/หน่วย, เครื่อง % over the เครื่อง tick. A change reprices every line at once and the
   settings fields show it too, as both write the same paths. The row is not sticky, so the column names still stay on top when scrolling. */
const qmsTot=Q=>{let c=0,v=0;(Q.items||[]).forEach(i=>{const q=n(i.q);c+=q*(n(i.m)+n(i.l)||(q?n(i.t)/q:0));v+=q*qUnit(Q,i)});return {c,v}};
const qmsIn=(Q,b,k,l,tip)=>{const v=Q['mk'+k];return `<label class="qms-f qms-v" title="${tip}">${l} %<input class="r" data-t="num" data-p="${b}.mk${k}" value="${v===''||v==null?'':n(v)}" placeholder="${fmtq(n(Q.mk))}" aria-label="${tip}"></label>`};
const qmsRow=Q=>{const b=`co.quotes.${Q.id}`,T=qmsTot(Q),pr=T.v-T.c,pc=T.v?pr*100/T.v:0,cl=pr<0?'loss':pc<10?'low':'ok';
  return `<tr class="qms"><th colspan="3"><b>บวกกำไร</b> <label class="qms-f" title="ใช้กับส่วนที่ปล่อยว่าง">ทุกส่วน<input class="r" data-t="num" data-p="${b}.mk" value="${n(Q.mk)}" aria-label="บวกค่าดำเนินการ/กำไร (%)">%</label></th>${typeof qwStrip==='function'?qwStrip(Q,b):'<th></th>'}
    <th colspan="3" class="qms-h">แก้ % แล้วราคาขายทุกบรรทัดคิดใหม่ทันที ช่องว่าง = ใช้ทุกส่วน ช่อง “บวกกำไร %” ในแถวใช้เฉพาะรายการนั้น</th>
    <th class="qsell">${qmsIn(Q,b,'M','ของ','บวกกำไร ค่าของ (วัสดุ) (%)')}</th><th class="qsell">${qmsIn(Q,b,'L','แรง','บวกกำไร ค่าแรง (%)')}</th>
    <th colspan="2" class="r qms-t">กำไรรวม<br><span class="qprof ${cl}">${fmt(pr,2)} (${fmt(pc,1)}%)</span></th>
    <th class="c" colspan="2">${qmsIn(Q,b,'E','เครื่อง','บวกกำไร ค่าเครื่อง (%) ใช้กับรายการที่ติ๊กช่องเครื่อง')}</th></tr>`};
// 4.48 the row's own markup (200 qMkI): top = material (or equipment on a ticked line), bottom = labour; blank shows the default in grey
const qmkCell=(Q,i,b)=>{const eq=typeof qmIsEq==='function'&&qmIsEq(i),v=k=>i['mk'+k]===''||i['mk'+k]==null?'':n(i['mk'+k]),
    dm=qMkOn(Q)?qMkP(Q,eq?'E':'M'):n(Q.mk),dl=qMkOn(Q)?qMkP(Q,'L'):n(Q.mk),
    inp=(k,d,w,lab)=>`<label class="qmk-l"><small>${w}</small><input class="r${v(k)!==''?' own':''}" data-t="num" data-p="${b}.items.${i.id}.mk${k}" value="${v(k)}" placeholder="${fmtq(d)}" aria-label="${lab}" title="${lab} ว่าง = ${fmtq(d)}% ตามหัวตาราง"></label>`;
  return `<td class="qmk" style="width:88px;min-width:86px">${inp('M',dm,eq?'เครื่อง':'ของ',eq?'บวกกำไรค่าเครื่องของรายการนี้ (%)':'บวกกำไรค่าของของรายการนี้ (%)')}${n(i.l)>0||v('L')!==''?inp('L',dl,'แรง','บวกกำไรค่าแรงของรายการนี้ (%)'):''}</td>`};
// qlTable comes from 982, after this file: wrap it at render time
const qmsWrap=()=>{if(typeof qlTable!=='function'||qlTable.__qms)return;const f=qlTable;qlTable=function(Q){const h=f.apply(this,arguments);if(!Q||!Q.items)return h;
  return h.replace('<table class="ql-t"><thead><tr>','<table class="ql-t"><thead>'+qmsRow(Q)+'<tr>')};qlTable.__qms=1};
{const r=render;render=function(){try{qmsWrap()}catch(e){}return r.apply(this,arguments)}}
document.head.insertAdjacentHTML('beforeend',`<style>.ql-t tr.qms th{position:static;background:var(--card,#fff);font-weight:500;font-size:13px;color:var(--text);vertical-align:middle;padding:6px 8px;border-bottom:2px solid var(--accent,#1C8F9B)}
.ql-t tr.qms th.qsell{background:rgba(28,143,155,.13)}.qms-f{display:inline-flex;align-items:center;gap:4px;font-weight:600;white-space:nowrap}.qms-f input{width:64px!important;padding:4px 6px;font-weight:700}.qms-v{flex-direction:column;align-items:stretch;gap:2px;font-size:12px}.qms-v input{width:100%!important;min-width:0}
.ql-t tr.qms th.qms-h{font-size:12px;color:var(--muted);white-space:normal;font-weight:400}.ql-t tr.qms th.qms-t{white-space:normal}.ql-t tr.qms .qprof{padding:2px 6px;border-radius:6px;font-weight:700}
.ql-t th.qmk,.ql-t td.qmk{background:rgba(214,158,46,.05)}.ql-t .qmk-l{display:flex;align-items:center;gap:3px}.ql-t .qmk-l+.qmk-l{margin-top:3px}.ql-t .qmk-l small{font-size:10.5px;color:var(--muted);min-width:22px}.ql-t .qmk-l input{width:100%;min-width:0;padding:2px 4px;font-size:12.5px}.ql-t .qmk-l input.own{font-weight:700;color:var(--accent,#1C8F9B)}
.ql-t tr.qms .qprof.ok{color:#1e8e5a}.ql-t tr.qms .qprof.low{color:#b45309}.ql-t tr.qms .qprof.loss{color:#c0392b}</style>`);
if(typeof I18N==='object'&&I18N.en&&I18N.en.x)Object.assign(I18N.en.x,{'บวกกำไร':'Markup','ทุกส่วน':'All parts','ของ %':'Material %','แรง %':'Labour %','เครื่อง %':'Equipment %','กำไรรวม':'Total profit',
  'แก้ % แล้วราคาขายทุกบรรทัดคิดใหม่ทันที ช่องว่าง = ใช้ทุกส่วน ช่อง “บวกกำไร %” ในแถวใช้เฉพาะรายการนั้น':'Change a % and every line reprices at once. Blank = all parts. A row’s own “Markup %” applies to that line only','บวกกำไร %':'Markup %'});
