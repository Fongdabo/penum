/* ---------- 4.1 ใบเสนอราคา: type the lines by hand, or pick what we sell from the price library ----------
   A quotation could only get its lines from PENUM MEP or an imported file (user, 2026-10-24: "ไม่มีช่องรายการสินค้าที่เราขาย").
   The lines table on ฝ่ายขาย › ใบเสนอราคา is now editable: name, unit, quantity, material and labour cost per unit and the selling
   price. Under it, "+ เพิ่มรายการ" adds a line to a chosen section; the name box offers the company's price library (co.prices,
   960-price-library.js), and picking one fills the unit and the costs. A line's cost is i.t (qUnit reads it), so a change to the
   quantity or the costs keeps i.t = quantity × cost per unit. Service (PM/MA) quotes keep their own card (981). */
const QL_G=()=>[...Object.entries(BOQ_G),['mat','วัสดุก่อสร้างทั่วไป']];
const qlLab=x=>[x.name,x.br].filter(Boolean).join(' · ');
// what can be picked: the price library (or MEP's sample rates while it is empty), then lines sold on earlier quotations
const qlLib=()=>{let L=[];try{L=typeof plCfg==='function'?plCfg():[];if(!L.length&&typeof plSeedRows==='function')L=plSeedRows()}catch(e){L=[]}
  const seen=new Set(L.map(x=>qlLab(x))),R=L.slice();
  CO().quotes.slice().reverse().forEach(q=>(q.items||[]).forEach(i=>{const k=String(i.desc||'').trim();if(!k||seen.has(k)||!(n(i.m)+n(i.l)))return;seen.add(k);R.push({name:k,unit:i.unit||'',m:n(i.m),l:n(i.l),past:1})}));return R};
function qlTable(Q){const b=`co.quotes.${Q.id}`,L=qlLib();let lg=null;
  const rows=Q.items.map(i=>{const h=i.g!==lg?`<tr class="grp"><td colspan="9">${esc(gName(i.g))}</td></tr>`:'';lg=i.g;const u=qUnit(Q,i),pre=[i.head,i.type].filter(Boolean).join(' · ');
    return h+`<tr><td style="min-width:240px">${pre?`<small class="muted" style="display:block">${esc(pre)}</small>`:''}<input data-p="${b}.items.${i.id}.desc" value="${esc(i.desc||'')}" list="qlLib" placeholder="ชื่อสินค้า / รายการ" aria-label="รายการ"></td>
    <td style="width:86px"><input data-p="${b}.items.${i.id}.unit" value="${esc(i.unit||'')}" aria-label="หน่วย"></td><td style="width:86px"><input class="r" data-t="num" data-p="${b}.items.${i.id}.q" value="${n(i.q)}" aria-label="จำนวน"></td>
    <td style="width:110px"><input class="r" data-t="num" data-p="${b}.items.${i.id}.m" value="${n(i.m)||''}" placeholder="0" aria-label="ค่าของต่อหน่วย"></td><td style="width:100px"><input class="r" data-t="num" data-p="${b}.items.${i.id}.l" value="${n(i.l)||''}" placeholder="0" aria-label="ค่าแรงต่อหน่วย"></td>
    <td style="width:120px"><input class="r" data-t="num" data-p="${b}.items.${i.id}.sp" value="${i.sp||''}" placeholder="${fmt(u,2)}" aria-label="ราคาเสนอต่อหน่วย"></td><td class="r" style="white-space:nowrap">${fmt(n(i.q)*u,2)}</td>
    <td><button type="button" class="x" data-a="delRow" data-c="${b}.items" data-id="${i.id}" aria-label="ลบ">✕</button></td></tr>`}).join('');
  const gs=QL_G(),last=Q.items.length?Q.items[Q.items.length-1].g:(S.sel.qlG||'eq'),gsel=S.sel.qlG||last;
  return `<div class="tw" style="max-height:620px;overflow:auto"><table class="ql-t"><thead><tr><th>รายการ</th><th>หน่วย</th><th class="r">จำนวน</th><th class="r">ค่าของ/หน่วย</th><th class="r">ค่าแรง/หน่วย</th><th class="r">ราคาเสนอ/หน่วย</th><th class="r">รวม</th><th></th></tr></thead>
    <tbody>${rows||'<tr><td colspan="8" class="empty">ยังไม่มีรายการ พิมพ์หรือเลือกสินค้าในช่องด้านล่าง แล้วกด “+ เพิ่มรายการ”</td></tr>'}</tbody></table></div>
  <div class="ql-add"><select id="qlG" aria-label="หมวด">${gs.map(([k,l])=>`<option value="${k}"${k===gsel?' selected':''}>${esc(l)}</option>`).join('')}${Q.items.some(i=>!BOQ_G[i.g]&&i.g!=='mat')?[...new Set(Q.items.map(i=>i.g).filter(g=>!BOQ_G[g]&&g!=='mat'))].map(g=>`<option value="${esc(g)}"${g===gsel?' selected':''}>${esc(gName(g))}</option>`).join(''):''}</select>
    <input id="qlName" list="qlLib" placeholder="พิมพ์ชื่อสินค้า หรือเลือกจากคลังราคา (${fmt(L.length)} รายการ)" aria-label="ชื่อสินค้าหรือรายการ"><input id="qlQ" class="r" inputmode="decimal" value="1" aria-label="จำนวน" style="width:80px">
    <button type="button" class="btn sm pri" data-a="qlAdd" data-id="${Q.id}">+ เพิ่มรายการ</button>
    <span class="hint" style="margin:0">ราคาเสนอว่างไว้ = ต้นทุน (ของ+แรง) บวก ${fmt(n(Q.mk),1)}% · ราคาทุนมาจากคลังราคากลางและรายการที่เคยเสนอ (เพิ่มสินค้าในคลังได้ที่ ประมาณราคา › คลังราคากลาง)</span></div>
  <datalist id="qlLib">${L.slice(0,3000).map(x=>`<option value="${esc(qlLab(x))}">${esc([x.unit,n(x.m)+n(x.l)?fmt(n(x.m)+n(x.l),2):''].filter(Boolean).join(' · '))}</option>`).join('')}</datalist>`}
const qlFind=s=>{const k=String(s||'').trim();if(!k)return null;const L=qlLib();return L.find(x=>qlLab(x)===k)||L.find(x=>x.name===k)||null};
// keep the line's cost (i.t) = quantity × cost per unit
const qlCost=i=>{const u=n(i.m)+n(i.l);if(u)i.t=Math.round(n(i.q)*u*100)/100};
ACT.qlAdd=b=>{const Q=CO().quotes.find(q=>q.id===b.dataset.id);if(!Q)return;const nm=($('#qlName')||{}).value||'',g=($('#qlG')||{}).value||'eq',q=n(($('#qlQ')||{}).value)||1,x=qlFind(nm);
  if(!nm.trim()){toast('พิมพ์ชื่อสินค้าหรือรายการก่อน');const e=$('#qlName');if(e)e.focus();return}
  const it={id:uid(),g,head:'',type:'',desc:x?qlLab(x):nm.trim(),unit:x?x.unit||'':'',q,m:x?n(x.m):0,l:x?n(x.l):0,t:0,sp:''};qlCost(it);
  // a new line goes after the last line of its section, so sections stay together on the printout
  let k=-1;Q.items.forEach((i,j)=>{if(i.g===g)k=j});if(k<0)Q.items.push(it);else Q.items.splice(k+1,0,it);
  S.sel.qlG=g;save();render();setTimeout(()=>{const e=$('#qlName');if(e)e.focus()},30);
  toast(x?`เพิ่ม “${it.desc}” ราคาทุนจากคลังราคา${it.m+it.l?'':' (ยังไม่มีราคา ใส่ได้ในตาราง)'}`:`เพิ่ม “${it.desc}” แล้ว ใส่หน่วยและราคาในตาราง`)};
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target&&(e.target.id==='qlName'||e.target.id==='qlQ')){e.preventDefault();const b=document.querySelector('[data-a="qlAdd"]');if(b)ACT.qlAdd(b)}});
// cost per unit of a line that has only a total (imported lump sums): remembered when its quantity box gets focus
document.addEventListener('focusin',e=>{const p=e.target.dataset&&e.target.dataset.p,m=p&&p.match(/^co\.quotes\.([^.]+)\.items\.([^.]+)\.q$/);if(!m)return;
  const Q=CO().quotes.find(q=>q.id===m[1]),i=Q&&Q.items.find(x=>x.id===m[2]);if(i&&!(n(i.m)+n(i.l))&&n(i.t)&&n(i.q))Object.defineProperty(i,'_uc',{value:n(i.t)/n(i.q),configurable:true,enumerable:false,writable:true})});
HOOK.push((p,v)=>{const m=p.match(/^co\.quotes\.([^.]+)\.items\.([^.]+)\.(q|m|l|desc)$/);if(!m)return;const Q=CO().quotes.find(q=>q.id===m[1]),i=Q&&Q.items.find(x=>x.id===m[2]);if(!i)return;
  if(m[3]==='desc'){const x=qlFind(v);if(x&&!(n(i.m)+n(i.l))&&!n(i.t)){i.unit=i.unit||x.unit||'';i.m=n(x.m);i.l=n(x.l);qlCost(i)}return}
  if(n(i.m)+n(i.l))qlCost(i);else if(m[3]==='q'&&i._uc){i.t=Math.round(i._uc*n(i.q)*100)/100;delete i._uc}});
{const f=salesQuote;salesQuote=function(){let h=f.apply(this,arguments);const C=CO(),Q=C.quotes.find(q=>q.id===S.sel.quote)||C.quotes.slice().reverse()[0];
  if(!Q||(typeof qmMa==='function'&&qmMa(Q)))return h;
  const a=h.indexOf('<div class="tw" style="max-height:520px;overflow:auto"><table><thead><tr><th>รายการ</th>'),e0='<p class="empty">ยังไม่มีรายการ ดึงจาก PENUM MEP หรือนำเข้าจากไฟล์</p>';
  if(a>=0){const z=h.indexOf('</tbody></table></div>',a);if(z>0)h=h.slice(0,a)+qlTable(Q)+h.slice(z+'</tbody></table></div>'.length)}
  else if(h.includes(e0))h=h.replace(e0,qlTable(Q));
  return h}}
document.head.insertAdjacentHTML('beforeend',`<style>.ql-t td input{width:100%;min-width:0}.ql-t td{vertical-align:middle}
.ql-add{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:10px 0 4px;padding:10px;border:1px dashed var(--line);border-radius:12px;background:var(--sunk)}
.ql-add select{max-width:230px}.ql-add #qlName{flex:1;min-width:240px}.ql-add .hint{flex-basis:100%}</style>`);
if(typeof SBKW==='object')SBKW['co.sales.quote']=(SBKW['co.sales.quote']||'')+' เพิ่มรายการ สินค้า พิมพ์รายการเอง คลังราคา';
if(typeof I18N==='object'&&I18N.en&&I18N.en.x)Object.assign(I18N.en.x,{'+ เพิ่มรายการ':'+ Add line','ค่าของ/หน่วย':'Material/unit','ค่าแรง/หน่วย':'Labour/unit','ราคาเสนอ/หน่วย':'Price/unit','วัสดุก่อสร้างทั่วไป':'General building materials','งานระบบแจ้งเหตุเพลิงไหม้':'Fire alarm system','งานระบบสื่อสาร':'Communication system','งานระบบกล้องวงจรปิด (CCTV)':'CCTV system','งานระบบควบคุมการเข้า-ออก':'Access control system','งานระบบเสียงประกาศ':'Public address system','งานระบบควบคุมอาคารอัตโนมัติ (BMS)':'Building management system (BMS)','งานระบบป้องกันฟ้าผ่าและสายดิน':'Lightning protection & earthing','งานเครื่องกำเนิดไฟฟ้าและ UPS':'Generator & UPS','งานระบบโซลาร์เซลล์':'Solar PV system','งานระบบบำบัดน้ำเสีย':'Wastewater treatment','งานระบบก๊าซทางการแพทย์':'Medical gas system'});
// 4.2 more systems (CCTV, fire alarm, communication, access control, PA, BMS, lightning, generator/UPS, solar, wastewater,
// medical gas): headings written other ways in a pasted or imported BOQ find their section too
if(typeof G_ALIAS==='object')G_ALIAS.unshift([/กล้องวงจรปิด|CCTV/i,'cctv'],[/แจ้งเหตุเพลิงไหม้|fire ?alarm/i,'fa'],[/ควบคุมการเข้า|access ?control|คีย์การ์ด/i,'acc'],
  [/เสียงประกาศ|เสียงตามสาย|public address/i,'pa'],[/BMS|ควบคุมอาคารอัตโนมัติ/i,'bms'],[/ฟ้าผ่า|สายดิน|lightning/i,'lp'],[/เครื่องกำเนิดไฟฟ้า|generator|\bUPS\b/i,'genr'],
  [/โซลาร์|solar/i,'sol'],[/บำบัดน้ำเสีย|wastewater|\bSTP\b/i,'wwt'],[/ก๊าซทางการแพทย์|medical gas/i,'mg'],[/สื่อสาร|\bLAN\b|โทรศัพท์|MATV|ทีวีรวม/i,'com']);
