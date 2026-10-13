/* ---------- round 2.8.1: no printout leaves without the company on it ----------
   Only the demo filled in the company profile, so a real data set printed a blank header.
   Before printing, an empty profile gets a one-click "ORIEN name + logo" or a jump to settings. */
const coEmpty=()=>!(CO().name||'').trim();
// 3.45: the one-click ORIEN name and logo is only for ORIEN's own data; a new company or an empty phone never sees it
const orienOk=()=>!(typeof genericCo==='function'&&genericCo())&&!(typeof dbEmpty==='function'&&dbEmpty());
const orBtn=(cls,l)=>orienOk()?`<button type="button" class="${cls}" data-a="coOrien">${l}</button>`:'';
let PEND=null;
ACT.coOrien=()=>{const C=DB.co;C.name=C.name||'บริษัท โอเรียน จำกัด';if(!C.logo)C.logo=ORIEN_LOGO;save();
  const d=$('#dlg');if(d.open)d.close();toast('ใส่ชื่อบริษัทและโลโก้ ORIEN แล้ว ที่อยู่และเลขผู้เสียภาษีกรอกเพิ่มได้ที่ ตั้งค่า');
  if(PEND){const b=PEND;PEND=null;printGo(b)}else render()};
ACT.coGoSet=()=>{PEND=null;const d=$('#dlg');if(d.open)d.close();S.dept='set';pgGo(['co','coset','']);render();scrollTo({top:0});setTimeout(()=>{const i=document.querySelector('[data-p="co.name"]');if(i)i.focus()},60)};
ACT.coPrintAnyway=()=>{const b=PEND;PEND=null;$('#dlg').close();if(b)printGo(b)};
const printGo=ACT.print;
ACT.print=b=>{const k=b.dataset.k,id=b.dataset.id;
  if(k==='bn'){const d=(CO().bnotes||[]).find(x=>x.id===id);
    if(d&&!d.cust){toast('เลือกลูกค้าก่อนพิมพ์ใบวางบิล');const s=document.querySelector(`[data-p="co.bnotes.${id}.cust"]`);if(s)s.focus();return}
    if(d&&!(d.invs||[]).length&&!confirm('ยังไม่ได้เลือกใบแจ้งหนี้ ใบวางบิลจะเป็นยอด 0 บาท พิมพ์ต่อไหม?'))return}
  if(coEmpty()){PEND={dataset:{k,id}};
    dialog('ยังไม่ได้ใส่ชื่อบริษัท',`<p>หัวเอกสารจะไม่มีชื่อบริษัท ที่อยู่ และโลโก้ เพราะยังไม่ได้กรอกข้อมูลบริษัท</p>${orienOk()?'<p class="hint">กดปุ่มแรกเพื่อใส่ชื่อ <b>บริษัท โอเรียน จำกัด</b> และโลโก้ ORIEN แล้วพิมพ์ต่อ ที่อยู่ เบอร์โทร และเลขประจำตัวผู้เสียภาษี กรอกเพิ่มได้ที่ ตั้งค่า</p>':'<p class="hint">กรอกชื่อ ที่อยู่ และโลโก้บริษัทที่ ตั้งค่า แล้วพิมพ์ใหม่</p>'}`,
      `${orBtn('btn pri','ใช้ชื่อและโลโก้ ORIEN แล้วพิมพ์')}<button type="button" class="btn${orienOk()?'':' pri'}" data-a="coGoSet">ไปกรอกข้อมูลบริษัท</button><button type="button" class="btn" data-a="coPrintAnyway">พิมพ์ไปก่อน</button>`);return}
  printGo(b)};
// ORIEN is the user's company: an empty profile gets its name and logo on its own (nothing typed is replaced)
{let done=false;const r=render;render=function(){if(!done&&typeof DB!=='undefined'&&DB&&DB.co){done=true;if(coEmpty()&&!dbEmpty()){DB.co.name='บริษัท โอเรียน จำกัด';if(!DB.co.logo)DB.co.logo=ORIEN_LOGO;save()}}return r.apply(this,arguments)}}
const coMissing=()=>{const C=CO();return [['addr','ที่อยู่'],['tax','เลขประจำตัวผู้เสียภาษี'],['phone','เบอร์โทร']].filter(([k])=>!(C[k]||'').trim()).map(x=>x[1])};
{const f=CVIEWS.exec;CVIEWS.exec=()=>{const h=f(),M=coMissing();
  if(coEmpty())return `<section class="card" style="border-color:var(--warn-c)">${typeof mobileMode==='function'&&mobileMode()&&dbEmpty()?'<h2><span>เริ่มใช้งานบนมือถือ</span><small>รับข้อมูลบริษัทจากไฟล์ penum-pm.json ในโฟลเดอร์ PENUM-PM บน OneDrive ที่ผู้ดูแลระบบแชร์ให้ แล้วชื่อบริษัท โครงการ และรายชื่อพนักงานจะขึ้นครบ</small></h2>':'<h2><span>ใส่ข้อมูลบริษัทก่อนพิมพ์เอกสาร</span><small>ชื่อ ที่อยู่ เลขประจำตัวผู้เสียภาษี และโลโก้ จะขึ้นที่หัวเอกสารทุกใบ</small></h2>'}
  <div class="row">${typeof mobileMode==='function'&&mobileMode()&&dbEmpty()?'<button type="button" class="btn pri" data-a="mPull">⬇ รับข้อมูลจากบริษัท (OneDrive)</button>':''}${orBtn('btn pri','ใช้ชื่อและโลโก้ ORIEN')}<button type="button" class="btn${orienOk()||mobileMode()&&dbEmpty()?'':' pri'}" data-a="coGoSet">กรอกข้อมูลบริษัท</button></div></section>`+h;
  return M.length?`<section class="card" style="border-color:var(--warn-c)"><h2><span>ข้อมูลบริษัทยังไม่ครบ</span><small>${CO().logo?`ใส่ชื่อ ${esc(CO().name)} และโลโก้แล้ว`:`ใส่ชื่อ ${esc(CO().name)} แล้ว`} ยังขาด ${[...M,...(CO().logo?[]:['โลโก้'])].join(' ')} ซึ่งต้องขึ้นบนใบเสนอราคาและใบกำกับภาษี</small></h2>
  <div class="row"><button type="button" class="btn pri" data-a="coGoSet">กรอกข้อมูลที่ยังขาด</button></div></section>`+h:h}}
{const f=CVIEWS.coset;CVIEWS.coset=()=>{const h=f(),M=coMissing();
  if(coEmpty())return `<div class="hint" style="margin:0 0 10px;padding:10px 12px;border:1px solid var(--warn-c);border-radius:10px">ยังไม่ได้ใส่ชื่อบริษัท หัวเอกสารที่พิมพ์จึงว่าง ${orienOk()?'<button type="button" class="btn sm pri" data-a="coOrien">ใช้ชื่อและโลโก้ ORIEN</button> หรือกรอกเองในช่องด้านล่าง':'กรอกในช่องด้านล่าง'}</div>`+h;
  return M.length?`<div class="hint" style="margin:0 0 10px;padding:10px 12px;border:1px solid var(--warn-c);border-radius:10px">ยังขาด <b>${M.join(' · ')}</b> กรอกในช่องด้านล่างแล้วจะขึ้นบนเอกสารทุกใบทันที</div>`+h:h}}
// billing note: say where customers come from when the list is empty, and leave out the tax line for nobody
{const f=acctBn;acctBn=()=>{const h=f();return CO().customers.length?h:h.replace('<h3 class="fm-g">เลือกใบแจ้งหนี้ที่วางบิล</h3>','<p class="hint">ยังไม่มีรายชื่อลูกค้า เพิ่มได้ที่ <button type="button" class="btn sm" data-a="go" data-m="co" data-k="sales" data-s="cust">ขาย › ลูกค้า</button> หรือสร้างโครงการจากใบเสนอราคาที่ได้งาน</p><h3 class="fm-g">เลือกใบแจ้งหนี้ที่วางบิล</h3>')}}

