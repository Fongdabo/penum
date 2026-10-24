/* ---------- 4.26 every quotation follows itself in งานที่กำลังติดตาม (user: "ทำไมช่องนี้ไม่ขึ้น") ----------
   The pipeline only listed rows typed with "+ เพิ่มงาน", so a company with quotations saw it empty. Now each quotation has a row
   (l.quote, l.auto): name, customer, value (the price before VAT), stage from the quotation's status, expected close = valid
   until, ผู้ดูแล = ผู้เสนอราคา. A value typed on the row stays (l.qv = false); a stage moved by hand stays until the
   quotation is won or lost. Deleting the row stops it coming back (Q.noLead). */
const QL_ST={draft:'quote',sent:'sent',won:'won',lost:'lost'};
function qLeadSync(){const C=CO();if(!C||!Array.isArray(C.quotes))return false;C.leads=C.leads||[];const was=JSON.stringify(C.leads);
  C.leads=C.leads.filter(l=>!(l.auto&&l.quote&&!C.quotes.some(q=>q.id===l.quote)));
  C.quotes.forEach(Q=>{if(Q.noLead)return;let l=C.leads.find(x=>x.quote===Q.id);const st=QL_ST[Q.status||'draft']||'quote';
    if(!l){l=Object.assign({id:uid()},NEW.leads(),{auto:1,qv:true,quote:Q.id,stage:st});C.leads.push(l)}
    if(!l.auto)return;const name=[Q.pname,Q.title].filter(Boolean).join(' - ')||Q.no||'';
    if(name)l.name=name;if(Q.cust)l.cust=Q.cust;if(!l.owner&&Q.by)l.owner=Q.by;if(okD(Q.date))l.close=addD(Q.date,n(Q.valid)||30);
    if(l.qv!==false){let v=0;try{v=Math.round(qCalc(Q).net*100)/100}catch(e){}l.value=v}
    if(st==='won'||st==='lost'||!LST.some(([k])=>k===l.stage)||(['lead','survey','quote','sent'].includes(l.stage)&&l.stage!==st&&!l.hand))l.stage=st});
  return JSON.stringify(C.leads)!==was}
{const r=render;render=function(){if(S.mode==='co'){try{if(qLeadSync())save()}catch(e){console.error(e)}}return r.apply(this,arguments)}}
// a value or a stage typed on the row is the user's: the value stops following the quotation, the stage holds until won / lost
HOOK.push(p=>{const m=String(p).match(/^co\.leads\.([^.]+)\.(value|stage)$/);if(!m)return;const l=CO().leads.find(x=>x.id===m[1]);if(!l||!l.auto)return;if(m[2]==='value')l.qv=false;else l.hand=true});
{const f=ACT.delRow;ACT.delRow=(b,e)=>{if(b&&b.dataset&&b.dataset.c==='co.leads'){const l=CO().leads.find(x=>x.id===b.dataset.id),Q=l&&l.quote&&CO().quotes.find(q=>q.id===l.quote);if(Q)Q.noLead=true}return f(b,e)}}
