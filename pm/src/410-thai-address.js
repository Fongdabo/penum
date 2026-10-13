/* ---------- round 2.9: Thai address picker (จังหวัด › อำเภอ/เขต › ตำบล/แขวง › รหัสไปรษณีย์) ----------
   Every address or site field gets a 📍 button. The data ships inside the app, so it works offline. */
let THA=null;// [{p,a,d,z}]
function thAddr(){if(THA)return THA;const R=THADDR_RAW,L=R.lookup.split('|'),W=R.words.split('|');
  const t=x=>(typeof x==='number'?L[x]:x).replace(/[A-Z]/gi,m=>{const c=m.charCodeAt(0);return W[c<97?c-65:26+c-97]});
  THA=[];for(const [p,As] of R.data)for(const [a,Ds] of As)for(const [d,zs] of Ds)for(const z of [].concat(zs))THA.push({p:t(p),a:t(a),d:t(d),z:String(z)});
  return THA}
const isBkk=p=>p==='กรุงเทพมหานคร';
const addrTail=(e)=>isBkk(e.p)?`แขวง${e.d} เขต${e.a} กรุงเทพมหานคร ${e.z}`:`ตำบล${e.d} อำเภอ${e.a} จังหวัด${e.p} ${e.z}`;
const uniq=a=>[...new Set(a)];
const thSort=a=>a.sort((x,y)=>x.localeCompare(y,'th'));
let AP=null;// {el, line, p, a, d, z}
// guess the parts of an address already typed, so the picker opens on it
function addrParse(s){s=String(s||'');const T=thAddr(),z=(s.match(/\b(\d{5})\b/)||[])[1]||'';
  let C=z?T.filter(e=>e.z===z):T;const p=uniq(C.map(e=>e.p)).find(x=>s.includes(x.replace('กรุงเทพมหานคร','กรุงเทพ')))||(z&&uniq(C.map(e=>e.p)).length===1?C[0].p:'');
  if(p)C=C.filter(e=>e.p===p);const a=p?uniq(C.map(e=>e.a)).sort((x,y)=>y.length-x.length).find(x=>s.includes(x))||'':'';if(a)C=C.filter(e=>e.a===a);
  const d=a?uniq(C.map(e=>e.d)).sort((x,y)=>y.length-x.length).find(x=>new RegExp('(ตำบล|แขวง|ต\\.|ต\\s)\\s*'+x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).test(s))||'':'';
  const k=s.search(/\s*(ตำบล|แขวง|ต\.\s?|อำเภอ|เขต|อ\.\s?|จังหวัด|จ\.\s?)/);const line=(p&&k>0?s.slice(0,k):p?'':s).trim();
  return {line,p,a,d,z:d?((C.find(e=>e.d===d)||{}).z||z):z}}
function apBody(){const T=thAddr(),f=AP,zT=/^\d{5}$/.test(f.z)?T.filter(e=>e.z===f.z):null,base=zT||T;
  const P_=thSort(uniq(base.map(e=>e.p))),A_=f.p?thSort(uniq(base.filter(e=>e.p===f.p).map(e=>e.a))):[],D_=f.a?base.filter(e=>e.p===f.p&&e.a===f.a).sort((x,y)=>x.d.localeCompare(y.d,'th')):[];
  const o=(L,v,ph)=>`<option value="">${ph}</option>`+L.map(x=>`<option${x===v?' selected':''}>${esc(x)}</option>`).join('');
  const e=D_.find(x=>x.d===f.d),prev=[f.line,e?addrTail(e):''].filter(Boolean).join(' ');
  return `<div class="form apf"><label class="full">บ้านเลขที่ หมู่ อาคาร ซอย ถนน<input id="apLine" value="${esc(f.line)}" placeholder="เช่น 88/8 หมู่ 3 ถนนวิภาวดีรังสิต"></label>
  <label>รหัสไปรษณีย์<input id="apZip" inputmode="numeric" maxlength="5" value="${esc(f.z)}" placeholder="พิมพ์ 5 หลักเพื่อค้นหา"></label>
  <label>จังหวัด<select id="apP">${o(P_,f.p,'– เลือกจังหวัด –')}</select></label>
  <label>${isBkk(f.p)?'เขต':'อำเภอ'}<select id="apA"${f.p?'':' disabled'}>${o(A_,f.a,f.p?'– เลือก –':'เลือกจังหวัดก่อน')}</select></label>
  <label>${isBkk(f.p)?'แขวง':'ตำบล'}<select id="apD"${f.a?'':' disabled'}>${o(D_.map(x=>x.d),f.d,f.a?'– เลือก –':'เลือกอำเภอก่อน')}</select></label></div>
  <p class="hint" style="margin-top:10px">ที่อยู่ที่จะใส่: <b id="apPrev">${esc(prev||'–')}</b></p>`}
function apDraw(){const b=$('#dlg .bd');if(b)b.innerHTML=apBody()}
// a postcode that names one province and district picks them for you
function apFromZip(){const T=thAddr().filter(e=>e.z===AP.z);if(!T.length)return;const P_=uniq(T.map(e=>e.p));if(P_.length===1)AP.p=P_[0];
  const A_=uniq(T.filter(e=>e.p===AP.p).map(e=>e.a));if(A_.length===1)AP.a=A_[0];const D_=T.filter(e=>e.p===AP.p&&e.a===AP.a);if(D_.length===1)AP.d=D_[0].d;
  if(AP.d&&!D_.some(e=>e.d===AP.d))AP.d=''}
document.addEventListener('input',e=>{if(!AP)return;const id=e.target.id;
  if(id==='apLine'){AP.line=e.target.value;const pv=$('#apPrev');if(pv){const x=thAddr().find(r=>r.p===AP.p&&r.a===AP.a&&r.d===AP.d&&(!AP.z||r.z===AP.z));pv.textContent=[AP.line,x?addrTail(x):''].filter(Boolean).join(' ')||'–'}}
  if(id==='apZip'){const v=e.target.value.replace(/\D/g,'').slice(0,5);AP.z=v;if(v.length===5){AP.p=AP.a=AP.d='';apFromZip();apDraw();const z=$('#apZip');if(z){z.focus();z.setSelectionRange(5,5)}}}});
document.addEventListener('change',e=>{if(!AP)return;const id=e.target.id,v=e.target.value;
  if(id==='apP'){AP.p=v;AP.a=AP.d='';if(!/^\d{5}$/.test(AP.z)||!thAddr().some(r=>r.z===AP.z&&r.p===v))AP.z=''}
  else if(id==='apA'){AP.a=v;AP.d=''}
  else if(id==='apD'){AP.d=v;const x=thAddr().find(r=>r.p===AP.p&&r.a===AP.a&&r.d===v&&(!/^\d{5}$/.test(AP.z)||r.z===AP.z))||thAddr().find(r=>r.p===AP.p&&r.a===AP.a&&r.d===v);if(x)AP.z=x.z}
  else return;e.stopPropagation();apDraw()},true);
ACT.addrPick=b=>{const el=b.previousElementSibling;if(!el||!el.dataset.p)return;AP=Object.assign({el},addrParse(el.value));
  dialog('เลือกที่อยู่',apBody(),'<button type="button" class="btn pri" data-a="addrOk">ใช้ที่อยู่นี้</button>');setTimeout(()=>{const i=$('#apLine');if(i)i.focus()},30)};
ACT.addrOk=()=>{if(!AP)return;const x=thAddr().find(r=>r.p===AP.p&&r.a===AP.a&&r.d===AP.d&&(!AP.z||r.z===AP.z))||thAddr().find(r=>r.p===AP.p&&r.a===AP.a&&r.d===AP.d);
  if(!x&&!confirm('ยังเลือกตำบลไม่ครบ ใส่เฉพาะบรรทัดแรกไหม?'))return;
  const v=[AP.line.trim(),x?addrTail(x):''].filter(Boolean).join(' '),el=AP.el,path=el.dataset.p;AP=null;$('#dlg').close();
  const now=document.querySelector(`[data-p="${CSS.escape(path)}"]`)||el;now.value=v;now.dispatchEvent(new Event('input',{bubbles:true}));now.dispatchEvent(new Event('change',{bubbles:true}));toast('ใส่ที่อยู่แล้ว')};
{const d=$('#dlg');d.addEventListener('close',()=>{AP=null})}
// add the 📍 button after every address or site field on each render
const ADDR_RE=/(^|\.)(addr|site)$/;
function addrBtns(root){(root||document).querySelectorAll('input[data-p],textarea[data-p]').forEach(el=>{if(!ADDR_RE.test(el.dataset.p)||el.nextElementSibling&&el.nextElementSibling.dataset.a==='addrPick')return;
  el.insertAdjacentHTML('afterend','<button type="button" class="apb" data-a="addrPick" title="เลือก ตำบล อำเภอ จังหวัด รหัสไปรษณีย์" aria-label="เลือกที่อยู่">📍</button>');el.parentElement.classList.add('apw')})}
{const r=render;render=function(){r.apply(this,arguments);addrBtns($('#view'))}}
document.head.insertAdjacentHTML('beforeend',`<style>
.apw{position:relative}.apw>input[data-p],.apw>textarea[data-p]{padding-right:34px}
.apb{position:absolute;right:4px;bottom:4px;width:28px;height:28px;border:0;border-radius:7px;background:var(--sunk);cursor:pointer;font-size:14px;line-height:1;padding:0}
.apb:hover,.apb:focus-visible{background:var(--line)}td.apw .apb{bottom:50%;transform:translateY(50%)}td.apw>textarea[data-p]+.apb{bottom:6px;transform:none}
.apf select:disabled{opacity:.55}#dlg .apf{min-width:min(560px,80vw)}
@media print{.apb{display:none}}
</style>`);

