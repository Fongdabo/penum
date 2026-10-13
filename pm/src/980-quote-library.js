/* ---------- 3.85 คลังราคากลางในใบเสนอราคา: the price library works for private jobs too ----------
   ทำราคาประมูล already takes prices from the library for government and private bids (965-reference-price.js). A quotation
   (ฝ่ายขาย › ใบเสนอราคา) gets the same card under its lines: the cost per unit (material + labour) is matched to the library
   by name, unit and brand and replaced on the lines picked; the selling price follows from the markup as before, and a line
   with its own selling price keeps it. "บันทึกราคางานนี้เข้าคลัง" saves the quotation's costs as source ใบเสนอราคา. */
PL_SK.qt=['ใบเสนอราคาของเรา',''];
{const f=salesQuote;salesQuote=function(){const h=f.apply(this,arguments),C=CO(),Q=C.quotes.find(q=>q.id===S.sel.quote)||C.quotes.slice().reverse()[0];
  if(!Q||!(Q.items||[]).length)return h;TDW=null;
  const c=tdLibCard(Q,{tk:'q',b:`co.quotes.${Q.id}.items`,title:'ราคาทุนจากคลังราคากลาง',hint:' · ราคาเสนอคิดจากราคาทุนบวกค่าดำเนินการ/กำไรเหมือนเดิม รายการที่พิมพ์ราคาเสนอเองคงราคานั้นไว้'});
  const i=h.indexOf('<section class="card cm-card"');return i<0?h+c:h.slice(0,i)+c+h.slice(i)}}// under the quotation lines, above its comments
if(typeof I18N==='object'&&I18N.en&&I18N.en.x)Object.assign(I18N.en.x,{'ราคาทุนจากคลังราคากลาง':'Cost from the price library','ใบเสนอราคาของเรา':'Our quotation'});
