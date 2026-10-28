/* ---------- 4.94 ผู้ลงนาม / ผู้เสนอราคา on a quote fill themselves (user: "ควรมีตำแหน่งให้เลือก ชื่อขึ้นออโต้ ดีไหม",
   "ขึ้นตามชื่อผู้ล็อกอินเลย ดีไหม") ----------
   ตำแหน่งผู้ลงนาม becomes a list of the company's staff (ตำแหน่ง · ชื่อ from ทีมงาน); picking one writes both Q.signPos and Q.signName.
   "พิมพ์ตำแหน่งเอง…" (Q.sgMan) brings back the free text box for a signer who is not on the staff list. Typing a staff name in ผู้ลงนาม
   fills the position too. A new quote takes the signer of the company's last quote and ผู้เสนอราคา = the signed-in user (me(), 240);
   a draft whose ผู้เสนอราคา is still empty gets the signed-in user when it is opened. Both stay editable.
   เรียน (user: "ชื่อตามลูกค้า ดีไหม"): choosing the customer writes its ผู้ติดต่อ into Q.attn (first name when the cell lists several,
   split on , / ; or newline); the box offers every contact of that customer plus the names earlier quotes to it were addressed to.
   A draft with an empty เรียน gets the contact when opened. A เรียน typed by hand is kept when the customer changes. */
const qsgStaff=()=>(CO().staff||[]).filter(s=>s.active!==false&&String(s.name||'').trim());
const qsgCur=Q=>{const nm=String(Q.signName||'').trim(),ps=String(Q.signPos||'').trim(),L=qsgStaff().filter(s=>s.name.trim()===nm);
  return nm?L.find(s=>String(s.role||'').trim()===ps)||(!ps&&L[0])||null:null};
const qsgMan=Q=>!!Q.sgMan||(!qsgCur(Q)&&!!String(Q.signPos||'').trim());
const qsgMe=()=>{const u=typeof me==='function'&&me();return u&&u.name||''};
function qsgFields(Q){const b=`co.quotes.${Q.id}`,cur=qsgCur(Q),man=qsgMan(Q),L=qsgStaff();
  const sel=`<label>ตำแหน่งผู้ลงนาม<select class="qsgPos" data-id="${Q.id}" title="เลือกตำแหน่ง ชื่อผู้ลงนามขึ้นเอง รายชื่อมาจาก ทีมงาน"><option value=""${!cur&&!man?' selected':''}>– เลือกตำแหน่ง –</option>${L.map(s=>`<option value="${s.id}"${cur&&!man&&cur.id===s.id?' selected':''}>${esc(s.role||'(ไม่ระบุตำแหน่ง)')} · ${esc(s.name)}</option>`).join('')}<option value="_m"${man?' selected':''}>พิมพ์ตำแหน่งเอง…</option></select></label>`;
  return `<label>ผู้ลงนาม<input data-p="${b}.signName" list="qsgNames" value="${esc(Q.signName||'')}" placeholder="เลือกตำแหน่ง หรือพิมพ์ชื่อ"></label>${sel}${man?`<label>ตำแหน่ง (พิมพ์เอง)<input data-p="${b}.signPos" value="${esc(Q.signPos||'')}" placeholder="เช่น กรรมการผู้จัดการ"></label>`:''}<datalist id="qsgNames">${L.map(s=>`<option value="${esc(s.name)}">${esc(s.role||'')}</option>`).join('')}</datalist>`}
{const f=salesQuote;salesQuote=function(){let h=f.apply(this,arguments);const C=CO(),Q=C.quotes.find(q=>q.id===S.sel.quote);if(!Q)return h;
  const by=qsgMe();if(by&&!String(Q.by||'').trim()&&(Q.status||'draft')==='draft'){Q.by=by;save()}
  h=h.replace(new RegExp(`<label>ผู้ลงนาม<input data-p="co\\.quotes\\.${Q.id}\\.signName"[^>]*></label><label>ตำแหน่งผู้ลงนาม<input data-p="co\\.quotes\\.${Q.id}\\.signPos"[^>]*></label>`),()=>qsgFields(Q));
  const ct=qsgContacts(Q.cust);if(ct.length&&!String(Q.attn||'').trim()&&(Q.status||'draft')==='draft'){Q.attn=ct[0];save()}
  h=h.replace(new RegExp(`(<label>เรียน<input data-p="co\\.quotes\\.${Q.id}\\.attn")([^>]*)placeholder="[^"]*"`),`$1 list="qsgAttn"$2placeholder="${ct.length?'เลือกหรือพิมพ์ชื่อผู้ติดต่อ':'ใส่ชื่อผู้ติดต่อในข้อมูลลูกค้า แล้วชื่อจะขึ้นเอง'}"`)+`<datalist id="qsgAttn">${ct.map(x=>`<option value="${esc(x)}">`).join('')}</datalist>`;
  h=h.replace(new RegExp(`(<label>ผู้เสนอราคา<input data-p="co\\.quotes\\.${Q.id}\\.by")`),`$1 list="qsgNames"${by?` placeholder="${esc(by)}"`:''}`);
  return h}}
document.addEventListener('change',e=>{const el=e.target;if(!el.classList||!el.classList.contains('qsgPos'))return;
  const Q=(CO().quotes||[]).find(q=>q.id===el.dataset.id);if(!Q)return;const v=el.value;
  if(v==='_m'){Q.sgMan=1}else if(!v){delete Q.sgMan;Q.signName='';Q.signPos=''}
  else{const s=qsgStaff().find(x=>x.id===v);if(!s)return;delete Q.sgMan;Q.signName=s.name.trim();Q.signPos=String(s.role||'').trim()}
  save();render()});
// typing (or picking from the list) a staff member's name fills the position, unless the position is typed by hand
HOOK.push((p,v)=>{const m=/^co\.quotes\.([^.]+)\.signName$/.exec(p);if(!m)return;const Q=(CO().quotes||[]).find(q=>q.id===m[1]);if(!Q||Q.sgMan)return;
  const s=qsgStaff().find(x=>x.name.trim()===String(v||'').trim());if(s)Q.signPos=String(s.role||'').trim()});
const qsgSplit=t=>String(t||'').split(/[,;\/\n]+/).map(x=>x.trim()).filter(Boolean);
function qsgContacts(cid,skip){const C=CO(),c=cid&&(C.customers||[]).find(x=>x.id===cid);if(!c)return [];
  return [...new Set([...qsgSplit(c.contact),...(C.quotes||[]).filter(q=>q.cust===cid&&q.id!==skip).map(q=>String(q.attn||'').trim()).filter(Boolean)])]}
// a new customer brings its contact unless เรียน was typed by hand (i.e. is not one of the old customer's contacts)
{let was=[];const rx=/^co\.quotes\.([^.]+)\.cust$/,q=id=>(CO().quotes||[]).find(x=>x.id===id);
  document.addEventListener('change',e=>{const m=rx.exec(e.target&&e.target.dataset&&e.target.dataset.p||''),Q=m&&q(m[1]);was=Q?qsgContacts(Q.cust,Q.id):[]},true);
  HOOK.push((p,v)=>{const m=rx.exec(p),Q=m&&q(m[1]);if(!Q)return;const a=String(Q.attn||'').trim();if(a&&!was.includes(a))return;Q.attn=qsgContacts(v)[0]||''})}
{const f=NEW.quotes;NEW.quotes=function(arr){const q=f.apply(this,arguments),L=(arr||CO().quotes||[]).filter(x=>String(x.signName||'').trim()),last=L[L.length-1];
  if(last){q.signName=last.signName;q.signPos=last.signPos||'';if(last.sgMan)q.sgMan=1}
  const by=qsgMe();if(by&&!q.by)q.by=by;return q}}
if(typeof I18N==='object'&&I18N.en&&I18N.en.x)Object.assign(I18N.en.x,{'– เลือกตำแหน่ง –':'– Choose a position –','พิมพ์ตำแหน่งเอง…':'Type a position…',
  'เลือกหรือพิมพ์ชื่อผู้ติดต่อ':'Choose or type a contact','ใส่ชื่อผู้ติดต่อในข้อมูลลูกค้า แล้วชื่อจะขึ้นเอง':'Add a contact to the customer and it fills in here',
  'ตำแหน่ง (พิมพ์เอง)':'Position (typed)','(ไม่ระบุตำแหน่ง)':'(no position)','เลือกตำแหน่ง หรือพิมพ์ชื่อ':'Choose a position or type a name',
  'เลือกตำแหน่ง ชื่อผู้ลงนามขึ้นเอง รายชื่อมาจาก ทีมงาน':'Choose a position and the signer\'s name fills in; the list comes from Team'});
