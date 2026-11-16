/* ---------- 4.99.34 ใบ PM/MA ได้งานแล้วส่งเข้าโครงการได้ (เบิกงวด) ----------
   User (2026-11-16, QT-015 ล้าง AHU/CDU ครั้งเดียว): "ไม่มีปุ่มได้งานแล้วเลย". Since 4.0 a PM/MA quotation's ได้งาน button
   only makes a service contract (981 qmaWon), and a service contract has no claims, invoices or claim photos. A one-off
   service job is billed like any job, so the PM/MA card now also offers the normal ได้งาน → ส่งเข้าโครงการ choice (750),
   and เปิดโครงการ / ส่งข้อมูลเข้าโครงการอีกครั้ง once it is in a project. The service-contract button stays as it was. */
const qmpPj=Q=>!!(Q&&Q.pj&&DB.projects[Q.pj]);
// 981 sends every PM/MA quote's qWonDlg to qmaWon; hide the kind for the moment the project dialog is built
ACT.qmaPj=b=>{const Q=CO().quotes.find(q=>q.id===b.dataset.id);if(!Q)return;
  if(qmpPj(Q)){ACT.go({dataset:{m:'pj',k:'dash',p:Q.pj}});return}
  if(typeof apprOn==='function'&&apprOn()&&typeof apprDone==='function'&&!apprDone('quote',Q)){toast('ใบเสนอราคาต้องผ่านการอนุมัติครบก่อน');return}
  const k=Q.kind;Q.kind='';try{ACT.qWonDlg(b)}finally{Q.kind=k}};
{const f=CVIEWS.sales;CVIEWS.sales=()=>{let h=f();const C=CO(),Q=C.quotes.find(q=>q.id===S.sel.quote)||null;
  return h.replace(/(<button type="button" class="btn sm pri" data-a="qmaWon" data-id="([^"]+)">[^<]*<\/button>)/,(m,btn,id)=>{
    const q=Q&&Q.id===id?Q:C.quotes.find(x=>x.id===id);if(!q)return m;
    return btn+(qmpPj(q)
      ?`<button type="button" class="btn sm" data-a="qmaPj" data-id="${id}">เปิดโครงการ</button><button type="button" class="btn sm" data-a="qRepush" data-id="${id}" title="ใช้เมื่อแก้ใบเสนอราคาหลังได้งาน">ส่งข้อมูลเข้าโครงการอีกครั้ง</button>`
      :`<button type="button" class="btn sm" data-a="qmaPj" data-id="${id}" title="งานครั้งเดียวที่เบิกเงินเป็นงวด: เปิดโครงการเพื่อทำใบเบิก ใบแจ้งหนี้ และรูปส่งงวด">ได้งาน → ส่งเข้าโครงการ (เบิกงวด)</button>`)})}}
if(typeof SBKW==='object')SBKW['co.sales.quote']=(SBKW['co.sales.quote']||'')+' ได้งานแล้ว ส่งเข้าโครงการ เบิกงวด PM MA';
