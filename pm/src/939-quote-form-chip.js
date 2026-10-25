/* ---------- 4.60 which form the quotation prints in, shown while typing the lines (user: "เวลาใส่ราคาหรือรายการ ไม่รู้ว่าเราเลือกฟอร์มอะไร") ----------
   A compact line above the lines table names the chosen look (983) and lines table (937), with เปลี่ยน (goes to the แบบฟอร์มเอกสาร panel)
   and ตัวอย่างใบ (941: แบ่งจอ, or full screen on a narrow window). The ราคาขาย columns say what of them prints in that table: BOQ-B prints one unit price, BOQ-S prints
   only section totals, BOQ-E prints no prices; those cells are dimmed and their header carries a small tag. Cost, markup and profit never print. */
const QFC_LAY={A:'แยกของ / แรง',B:'ราคาเดียว',S:'ยอดหมวด',G:'ราชการ ปร.4',E:'ใบขอราคาเปล่า'};
function qfcBar(Q){const k=qForm(Q),fx=k==='G'||k==='E',F=typeof fsCur==='function'&&fsForm(fsCur(Q)),look=fx?'แบบ Excel':(F?F.n:'ORIEN Modern');
  const note={A:'ราคาขายพิมพ์ครบทุกช่อง',B:'ของ/หน่วย กับ แรง/หน่วย พิมพ์รวมเป็นราคาเดียว',S:'พิมพ์จำนวนทุกรายการ ราคาพิมพ์เฉพาะยอดหมวด',G:'ราคาขายพิมพ์ครบทุกช่อง',E:'ไม่พิมพ์ราคา ให้ผู้รับใบกรอกเอง'}[k];
  return `<div class="qfc"><span class="qfc-i" aria-hidden="true">🖨</span><span>พิมพ์เป็น <b>${esc(look)}</b></span><span class="qfc-d">·</span><span>ตาราง <b>BOQ-${k} ${QFC_LAY[k]}</b>${Q.lay?'':' <small>(อัตโนมัติ)</small>'}</span>
    <small class="qfc-n" title="ช่องต้นทุน บวกกำไร กำไร และเครื่อง ใช้ในบริษัทเท่านั้น ไม่พิมพ์">${note} · ต้นทุนและกำไรไม่พิมพ์</small><span style="flex:1"></span>
    <button type="button" class="btn sm" data-a="qfcGo">เปลี่ยน</button><button type="button" class="btn sm pri" data-a="qsplit" data-id="${Q.id}" title="ตัวอย่างใบด้านขวา (แบ่งจอ)">ตัวอย่างใบ</button></div>`}
// เปลี่ยน: to the แบบฟอร์มเอกสาร panel, with a short highlight
ACT.qfcGo=()=>{const g=$('.fsg');if(!g)return;g.scrollIntoView({behavior:'smooth',block:'start'});g.classList.remove('qfc-hi');void g.offsetWidth;g.classList.add('qfc-hi')};
const qfcTag=t=>`<span class="qfc-t">${t}</span>`;
// qlTable is defined in 982, after this file: wrap it at render time
// (932 and 936 wrap it again over this one, so the flag is a variable, not a property of qlTable)
let qfcOn=false;const qfcWrap=()=>{if(qfcOn||typeof qlTable!=='function')return;qfcOn=true;const f=qlTable;qlTable=function(Q){let h=f.apply(this,arguments);if(!Q||!Q.items||(typeof qmMa==='function'&&qmMa(Q)))return h;
  const k=qForm(Q),unit=k==='B'?'รวมเป็นราคาเดียว':k==='S'||k==='E'?'ไม่พิมพ์':'',tot=k==='S'?'พิมพ์เฉพาะยอดหมวด':k==='E'?'ไม่พิมพ์':'';
  h=h.replace('<table class="ql-t">',`<table class="ql-t qf-${k}">`);
  if(unit){h=h.replace(/(<th class="r qsell)(" title="ราคาขายค่า(?:ของ|แรง)ต่อหน่วย[^"]*">[^<]*)<\/th>/g,`$1 qsu$2${qfcTag(unit)}</th>`);
    if(k!=='B')h=h.replace(/<td class="r qsell" style="width:110px;/g,'<td class="r qsell qsu" style="width:110px;')}
  if(tot){h=h.replace(/(<th class="r qsell)(" title="ราคาขาย × จำนวน">[^<]*)<\/th>/,`$1 qst$2${qfcTag(tot)}</th>`)
    .replace(/<td class="r qsell" style="white-space:nowrap"><b>/g,'<td class="r qsell qst" style="white-space:nowrap"><b>')}
  h=h.replace('<th colspan="3" class="c qsell qg">ราคาขาย</th>',`<th colspan="3" class="c qsell qg">ราคาขาย <span class="qfc-g">🖨 BOQ-${k}</span></th>`);
  const at=h.indexOf('<div class="tw"');return at<0?qfcBar(Q)+h:h.slice(0,at)+qfcBar(Q)+h.slice(at)}};
{const r=render;render=function(){try{qfcWrap()}catch(e){}return r.apply(this,arguments)}}
document.head.insertAdjacentHTML('beforeend',`<style>.qfc{display:flex;align-items:center;flex-wrap:wrap;gap:4px 8px;margin:0 0 8px;padding:5px 8px 5px 10px;border:1px solid var(--line);border-left:3px solid var(--accent,#1C8F9B);border-radius:8px;background:var(--surface);font-size:13px}
.qfc b{font-weight:700}.qfc small{color:var(--muted)}.qfc-d{color:var(--muted)}.qfc-n{font-size:12px}.qfc .btn{height:28px;padding:0 10px}
.ql-t .qfc-g{display:inline-block;margin-left:6px;padding:0 6px;border-radius:8px;background:var(--accent,#1C8F9B);color:#fff;font-size:10.5px;font-weight:600;vertical-align:1px}
.ql-t th .qfc-t{display:block;font-size:10px;font-weight:600;line-height:1.2;color:#B45309;white-space:nowrap}
.ql-t tbody td.qsu,.ql-t tbody td.qst{opacity:.35}
:root[data-theme="dark"] .ql-t th .qfc-t{color:#F5B454}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .ql-t th .qfc-t{color:#F5B454}}
.fsg.qfc-hi{animation:qfcHi 1.6s ease-out}@keyframes qfcHi{0%,40%{box-shadow:0 0 0 3px var(--accent,#1C8F9B)}100%{box-shadow:0 0 0 0 transparent}}</style>`);
if(typeof I18N==='object'&&I18N.en&&I18N.en.x)Object.assign(I18N.en.x,{'พิมพ์เป็น':'Prints as','ตาราง':'Table','เปลี่ยน':'Change','แบบ Excel':'Excel style','(อัตโนมัติ)':'(automatic)',
  'รวมเป็นราคาเดียว':'one price','พิมพ์เฉพาะยอดหมวด':'section totals only'});
