/* ---------- 4.99.57 ขอบเขตงานของใบเสนอราคา PM/MA เป็นแผ่นแนบท้าย ----------
   User (2026-11-19, รพ.ค่ายสุรนารี, 52 ข้อจาก TOR): "ขอบเขตงานควรเอาไว้อีกแผ่นเหมือนใบเสนอราคาอื่นไหม". Other quotations print their
   scope of work (340 sowPrint) on a sheet of its own after the signatures; a PM/MA quote (981 qmScope) printed it above the signatures, so a
   long scope pushed them down. Now a long one (more than 14 items) goes after the signatures on its own sheet, "แนบท้ายใบเสนอราคาเลขที่ …",
   and a short one stays where it was. The MA card has a choice per quote: Q.maScSep '' automatic, '1' always its own sheet, '0' same page. */
const QMS_MAX=14;
const qmsSep=(Q,h)=>{const v=String(Q&&Q.maScSep||'');if(v==='1')return true;if(v==='0')return false;return (String(h).match(/<li>/g)||[]).length>QMS_MAX};
{const f=qmScope;qmScope=function(Q){const h=f.apply(this,arguments);return h&&qmsSep(Q,h)?'<!--qms-->'+h+'<!--/qms-->':h}}
{const f=PRINT.quote;PRINT.quote=function(id){let h=f.apply(this,arguments);const a=h.indexOf('<!--qms-->'),z=h.indexOf('<!--/qms-->');if(a<0||z<a)return h;
  const Q=CO().quotes.find(q=>q.id===id)||{},sc=h.slice(a+10,z),en=typeof qmLang==='function'&&qmLang(Q)==='en';h=h.slice(0,a)+h.slice(z+11);
  const head=`<div style="page-break-before:always"></div><div class="qm-c" style="border:0;padding:0;margin:0 0 8px"><small style="color:var(--qg);letter-spacing:.12em">SCOPE OF WORK</small>
    <h3 style="margin:2px 0 0">${en?'Scope of work, attached to quotation no.':'ขอบเขตงาน แนบท้ายใบเสนอราคาเลขที่'} ${esc(Q._fno||Q.no||'')}</h3></div>`;
  // the scope's own heading is dropped: the sheet has one
  const body=sc.replace(/^<div class="qm-c"[^>]*><h3>[\s\S]*?<\/h3><\/div>/,'');
  const k=h.lastIndexOf('<div class="ofoot">'),e=k<0?h.lastIndexOf('</div>'):h.lastIndexOf('</div>',k);if(e<0)return h+head+body;
  return h.slice(0,e)+head+body+h.slice(e)}}
{const f=qmaScCard;qmaScCard=function(Q,b){const h=f.apply(this,arguments),v=String(Q.maScSep||'');
  const sel=`<label style="display:flex;gap:8px;align-items:center;margin-top:8px;font-size:13px">พิมพ์ขอบเขตงาน<select data-p="${b}.maScSep" style="max-width:340px">
    <option value=""${v===''?' selected':''}>อัตโนมัติ (เกิน ${QMS_MAX} ข้อ แยกเป็นแผ่นแนบท้าย)</option><option value="1"${v==='1'?' selected':''}>แผ่นแนบท้ายเสมอ</option><option value="0"${v==='0'?' selected':''}>หน้าเดียวกับใบเสนอราคา</option></select></label>`;
  return h.endsWith('</div>')?h.slice(0,-6)+sel+'</div>':h+sel}}
