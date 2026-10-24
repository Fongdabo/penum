/* ---------- 4.5 แบบฟอร์มใบเสนอราคา / BOQ: pick a form from a gallery (ORIEN form shop, part 1) ----------
   ORIEN sells form styles to the contractors who rent PENUM PM (user, 2026-10-24: 20 forms, a shop, buyers' own logo on every form).
   One quotation's data prints in any form: a form is a set of print settings (Q.look, Q.one, Q.lay, Q.kind) plus a colour theme
   that this file lays over the ORIEN Modern print (981-quote-forms.js) as a class on div.qm. The quotation keeps its pick in Q.form.
   FS_FORMS lists the whole catalogue (984 adds the forms sold); the 5 free forms are open to every company, the rest once bought.
   Theme "brand" takes the company's own colour (co.formColor), read from its logo the first time it is picked. */
const FS_GRP=[['pvt','เอกชนทั่วไป'],['gov','งานราชการ'],['mep','งานระบบ MEP'],['ma','งานบริการ PM/MA'],['sp','งานเฉพาะ']];
// id, group, name, what it is for, price in baht (0 = free in every package), print settings, theme
const FS_FORMS=[
  {id:'modern',g:'pvt',n:'ORIEN Modern',d:'น้ำเงิน-เขียวน้ำทะเล สะอาด อ่านง่าย (แบบเริ่มต้น)',p:0,set:{look:'',one:false}},
  {id:'xl',g:'pvt',n:'Excel คลาสสิก',d:'เส้นตารางดำ แถบเขียว แบบ BOQ ที่ผู้รับเหมาคุ้นเคย',p:0,set:{look:'xl',one:false}},
  {id:'mono',g:'pvt',n:'ขาวดำเรียบ',d:'ไม่มีพื้นสี พิมพ์ขาวดำหรือถ่ายเอกสารแล้วยังชัด ประหยัดหมึก',p:0,set:{look:'',one:false},th:'mono'},
  {id:'brand',g:'pvt',n:'สีตามโลโก้บริษัท',d:'ใช้สีจากโลโก้ของบริษัทคุณเอง หรือเลือกสีเอง',p:0,set:{look:'',one:false},th:'brand'},
  {id:'short',g:'pvt',n:'ย่อ 1 หน้า',d:'รายการ ยอดรวม และลายเซ็นอยู่หน้าเดียว เหมาะกับงานเล็ก งานซ่อม',p:0,set:{look:'',one:true}}];
const fsForm=id=>FS_FORMS.find(f=>f.id===id);
// a sold form is open when the company's licence code lists it (payload fm: form ids, or 'all'); no code = ORIEN's own data, all open.
// FS_PV: the shop's preview prints any form
let FS_PV=false;
const fsHas=id=>{if(FS_PV||!licOn())return true;const p=licP(),L=p&&Array.isArray(p.fm)?p.fm.map(String):[];return L.includes(id)||L.includes('all')};
const fsOwn=F=>!!F&&(!F.p||fsHas(F.id));
// a form made for service quotations (k 'ma') or installation ones (k 'boq'); no k = both
const fsFits=(F,Q)=>!F.k||(F.k==='ma')===qmMa(Q);
// the form a quotation prints in: its own pick, or what its older settings amount to
const fsCur=Q=>{const F=fsForm(Q.form);return F&&fsOwn(F)&&fsFits(F,Q)&&(Q.form!=='short'||Q.one)?Q.form:Q.look==='xl'?'xl':Q.one?'short':'modern'};

// ---- colours: the brand theme from one colour
const fsRgb=h=>{const m=String(h||'').match(/^#?([0-9a-f]{6})$/i);if(!m)return null;const v=parseInt(m[1],16);return [v>>16&255,v>>8&255,v&255]};
const fsHex=c=>'#'+c.map(x=>Math.max(0,Math.min(255,Math.round(x))).toString(16).padStart(2,'0')).join('');
const fsMix=(a,b,k)=>a.map((x,i)=>x+(b[i]-x)*k);
const fsLum=c=>{const f=x=>{x/=255;return x<=0.03928?x/12.92:Math.pow((x+0.055)/1.055,2.4)};return 0.2126*f(c[0])+0.7152*f(c[1])+0.0722*f(c[2])};
function fsVars(hex){let c=fsRgb(hex)||[28,143,155];const W=[255,255,255],K=[0,0,0],raw=c;
  // white text has to read on the main colour: darken a light colour until it does
  for(let i=0;i<12&&fsLum(c)>0.2;i++)c=fsMix(c,K,0.12);
  const qn=fsMix(c,K,0.55);
  return {'--qn':fsHex(qn),'--qt':fsHex(c),'--q2':fsHex(fsMix(qn,c,0.5)),'--q3':fsHex(fsMix(raw,W,0.35)),'--qe':fsHex(fsMix(c,W,0.75)),
    '--qs':fsHex(fsMix(c,W,0.9)),'--qz':fsHex(fsMix(c,W,0.965)),'--ql':fsHex(fsMix(c,W,0.78)),'--qo':fsHex(raw)}}
// the most common strong colour in the logo; transparent, near-white, near-black and grey pixels do not count
function fsLogoColor(src){return new Promise(ok=>{if(!src)return ok('');const im=new Image();im.onload=()=>{try{const w=64,h=Math.max(1,Math.round(64*im.height/Math.max(1,im.width)));
    const cv=document.createElement('canvas');cv.width=w;cv.height=h;const x=cv.getContext('2d');x.drawImage(im,0,0,w,h);const d=x.getImageData(0,0,w,h).data,B={};
    for(let i=0;i<d.length;i+=4){const r=d[i],g=d[i+1],b=d[i+2],a=d[i+3],mx=Math.max(r,g,b),mn=Math.min(r,g,b);if(a<200||mx<40||mn>225||mx-mn<50)continue;
      const k=[r>>5,g>>5,b>>5].join(),o=B[k]=B[k]||{n:0,r:0,g:0,b:0};o.n++;o.r+=r;o.g+=g;o.b+=b}
    const top=Object.values(B).sort((a,b)=>b.n-a.n)[0];ok(top?fsHex([top.r/top.n,top.g/top.n,top.b/top.n]):'')}catch(e){ok('')}};im.onerror=()=>ok('');im.src=src})}

const FS_CSS=`<style>
#print .qm.fs-mono{--qn:#111;--qt:#333;--qs:#F1F1F1;--qz:#FAFAFA;--ql:#BDBDBD;--qg:#555;--qo:#111}
#print .qm.fs-mono .qm-bar{height:3px;border-radius:0;background:#111}
#print .qm.fs-mono .qm-ti{background:#fff;color:#111;border:1.5px solid #111}
#print .qm.fs-mono .qm-ti:before,#print .qm.fs-mono .qm-ti:after{display:none}
#print .qm.fs-mono .qm-ti small{color:#555}#print .qm.fs-mono .qm-ti h1{color:#111}#print .qm.fs-mono .qm-ti p{color:#333}
#print .qm.fs-mono .qm-ti,#print .qm.fs-mono .qm-m,#print .qm.fs-mono .qm-c,#print .qm.fs-mono .qm-tot,#print .qm.fs-mono .qm-sg>div,#print .qm.fs-mono .qm-wd,#print .qm.fs-mono .qm-pl,#print .qm.fs-mono .qm-sc>div{border-radius:0}
#print .qm.fs-mono table.qm-t thead tr.ch th{background:#E4E4E4;color:#111;border-right:1px solid #fff;border-radius:0!important}
#print .qm.fs-mono table.qm-t thead tr.ch2 th{background:#F0F0F0;color:#333}
#print .qm.fs-mono table.qm-t thead th .en{color:#555}
#print .qm.fs-mono table.qm-t tr.tt td{background:#E4E4E4!important;color:#111;border-top:1.5px solid #111;border-radius:0!important}
#print .qm.fs-mono table.qm-t tr.tt td .en{color:#555}
#print .qm.fs-mono .qm-tot div.gt{background:#E4E4E4;color:#111;border-top:1.5px solid #111}#print .qm.fs-mono .qm-tot div.gt .en{color:#555}
#print .qm.fs-mono .qm-sg>div.ok{background:none;border:1.5px solid #111}
#print .qm.fs-mono .qm-pl td i.on{background:#444}
#print .qm.fs-mono .sow-h{background:#fff;color:#111;border:1.5px solid #111;border-radius:0}#print .qm.fs-mono .sow-h small{color:#555}
#print .qm.fs-brand .qm-bar{background:linear-gradient(90deg,var(--qn) 0%,var(--qt) 60%,var(--q3) 100%)}
#print .qm.fs-brand .qm-ti{background:linear-gradient(120deg,var(--qn) 0%,var(--q2) 58%,var(--qt) 100%)}
#print .qm.fs-brand .qm-ti:before{background:rgba(255,255,255,.1)}
#print .qm.fs-brand .qm-ti small,#print .qm.fs-brand .qm-ti p,#print .qm.fs-brand table.qm-t thead th .en,#print .qm.fs-brand table.qm-t tr.tt td .en,#print .qm.fs-brand .qm-tot div.gt .en,#print .qm.fs-brand .sow-h small{color:var(--qe)}
#print .qm.fs-brand table.qm-t thead tr.ch2 th{background:var(--q2);color:var(--qe)}
#print .qm.fs-brand .qm-pl td i.on{background:linear-gradient(90deg,var(--qt),var(--q3))}
</style>`;
// lay the quotation's form over the ORIEN Modern print
{const f=PRINT.quote;PRINT.quote=(id,bq)=>{const Q=CO().quotes.find(q=>q.id===id),F=Q&&fsForm(fsCur(Q));
  if(F&&F.pr)try{return F.pr(Q,bq)}catch(e){console.error(e)}
  const h=f(id,bq);if(!F||!F.th||h.indexOf('<div class="qm"')<0)return h;
  const st=F.th==='brand'?` style="${Object.entries(fsVars(CO().formColor)).map(([k,v])=>`${k}:${v}`).join(';')}"`:'';
  return FS_CSS+h.replaceAll('<div class="qm"',`<div class="qm fs-${F.th}"${st}`)}}

// ---- a small picture of each form for the gallery
function fsThumb(F){const C=CO(),b=F.th==='brand'?fsVars(C.formColor):F.col?fsVars(F.col):null;
  const P=F.id==='xl'?{bar:'#1F7A3A',band:'#fff',bt:'#111',bs:'#111',hd:'#C6E0B4',ht:'#111',row:'#fff',ln:'#111',tot:'#C6E0B4'}
    :F.th==='mono'?{bar:'#111',band:'#fff',bt:'#111',bs:'#111',hd:'#E4E4E4',ht:'#111',row:'#FAFAFA',ln:'#BDBDBD',tot:'#E4E4E4'}
    :b?{bar:b['--qt'],band:b['--qn'],bt:'#fff',bs:'',hd:b['--qn'],ht:'#fff',row:b['--qz'],ln:b['--ql'],tot:b['--qn']}
    :{bar:'#1C8F9B',band:'#16324F',bt:'#fff',bs:'',hd:'#16324F',ht:'#fff',row:'#F6FAFB',ln:'#D3E2E5',tot:'#16324F'};
  const one=F.set&&F.set.one,rows=one?8:5,y0=one?40:43,rh=4;let r='';
  for(let i=0;i<rows;i++)r+=`<rect x="6" y="${y0+5+i*rh}" width="48" height="${rh}" fill="${i%2?P.row:'#fff'}" stroke="${F.id==='xl'?P.ln:'none'}" stroke-width=".3"/><rect x="14" y="${y0+6.4+i*rh}" width="${14+(i*7)%16}" height="1.2" fill="#9AA9AF"/><rect x="45" y="${y0+6.4+i*rh}" width="7" height="1.2" fill="#9AA9AF"/>`;
  const yt=y0+5+rows*rh;
  return `<svg viewBox="0 0 60 84" aria-hidden="true"><rect width="60" height="84" rx="2" fill="#fff" stroke="#D5DDE0"/>
    <rect x="6" y="5" width="48" height="${F.id==='xl'?1:1.6}" fill="${P.bar}"/><rect x="6" y="9" width="12" height="5" rx="1" fill="#CBD5D9"/><rect x="38" y="9.5" width="16" height="1.4" fill="#B5C2C7"/><rect x="42" y="12" width="12" height="1.2" fill="#CBD5D9"/>
    <rect x="6" y="17" width="31" height="10" rx="${F.th==='mono'||F.id==='xl'?0:2}" fill="${P.band}" stroke="${P.bs||'none'}" stroke-width=".5"/><rect x="9" y="20.5" width="14" height="2.4" fill="${P.bt}"/>
    <rect x="39" y="17" width="15" height="10" rx="${F.th==='mono'||F.id==='xl'?0:2}" fill="none" stroke="${P.ln}" stroke-width=".5"/>
    <rect x="6" y="30" width="23" height="${one?7:10}" rx="1.5" fill="none" stroke="${P.ln}" stroke-width=".4"/><rect x="31" y="30" width="23" height="${one?7:10}" rx="1.5" fill="none" stroke="${P.ln}" stroke-width=".4"/>
    <rect x="6" y="${y0}" width="48" height="5" fill="${P.hd}" stroke="${F.id==='xl'?P.ln:'none'}" stroke-width=".3"/><rect x="9" y="${y0+1.9}" width="20" height="1.2" fill="${P.ht}" opacity=".8"/>${r}
    <rect x="6" y="${yt}" width="48" height="4" fill="${P.tot}" stroke="${F.id==='xl'?P.ln:'none'}" stroke-width=".3"/>
    <rect x="34" y="${yt+6}" width="20" height="${one?6:9}" rx="1.5" fill="none" stroke="${P.ln}" stroke-width=".4"/>
    ${one?`<rect x="6" y="${yt+14}" width="14" height="7" rx="1" fill="none" stroke="${P.ln}" stroke-width=".4"/><rect x="23" y="${yt+14}" width="14" height="7" rx="1" fill="none" stroke="${P.ln}" stroke-width=".4"/><rect x="40" y="${yt+14}" width="14" height="7" rx="1" fill="none" stroke="${P.ln}" stroke-width=".4"/>`:''}</svg>`}

const FS_UI=`<style>
.fsg{border:1px solid var(--line);border-radius:12px;padding:10px 12px;margin:0 0 12px}
.fsg-h{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:0 0 8px}.fsg-h b{font-size:14px}
.fsg-l{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}
.fsg-l button{display:flex;flex-direction:column;align-items:stretch;gap:4px;text-align:left;padding:8px;border:1.5px solid var(--line);border-radius:10px;background:var(--surface);color:inherit;font:inherit;cursor:pointer}
.fsg-l button:hover{border-color:var(--accent)}
.fsg-l button.on{border-color:var(--accent);box-shadow:0 0 0 2px color-mix(in srgb,var(--accent) 25%,transparent)}
.fsg-l svg{width:100%;height:auto;max-height:150px;display:block;background:#EEF2F4;border-radius:6px;padding:6px}
.fsg-l b{font-size:13px}.fsg-l small{font-size:11.5px;color:var(--muted);line-height:1.35}
.fsg-l .tag{align-self:flex-start;font-size:11px;padding:0 7px;border-radius:9px;background:#E3F4EA;color:#1F7A3A}
.fsg-l .on .tag{background:var(--accent);color:#fff}
.fsg-c{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:8px;font-size:13px}
.fsg-c input[type=color]{width:44px;height:30px;padding:0 2px;border-radius:6px}
</style>`;
// ---- the gallery on the quotation page; it takes the place of the old "หน้าตาเอกสาร" list
{const f=salesQuote;salesQuote=function(){let h=f.apply(this,arguments);const C=CO(),Q=C.quotes.find(q=>q.id===S.sel.quote)||C.quotes.slice().reverse()[0];if(!Q)return h;
  const cur=fsCur(Q),F=fsForm(cur),f0=qForm(Q),fixed=!qmMa(Q)&&(f0==='G'||f0==='E');
  const tiles=FS_FORMS.filter(x=>fsOwn(x)&&fsFits(x,Q)).map(x=>`<button type="button" class="${x.id===cur?'on':''}" data-a="fsPick" data-id="${Q.id}" data-v="${x.id}" aria-pressed="${x.id===cur}">${fsThumb(x)}<b>${esc(x.n)}</b><small>${esc(x.d)}</small><span class="tag">${x.id===cur?'✓ ใช้อยู่':x.p?'ซื้อแล้ว':'ฟรี'}</span></button>`).join('')+fsShopTile(Q);
  const col=F&&F.th==='brand'?`<div class="fsg-c">สีของบริษัท <input type="color" data-fsc="1" value="${fsRgb(C.formColor)?esc(C.formColor):'#1c8f9b'}" aria-label="สีของบริษัท">
    <button type="button" class="btn sm" data-a="fsLogo"${C.logo?'':' disabled title="ใส่โลโก้บริษัทในตั้งค่าบริษัทก่อน"'}>ใช้สีจากโลโก้</button><small class="muted">ใช้กับทุกใบเสนอราคาที่เลือกแบบนี้</small></div>`:'';
  const g=FS_UI+`<div class="fsg"><div class="fsg-h"><b>แบบฟอร์มเอกสาร</b><small class="muted">กดเลือกแล้วกด "พิมพ์ใบเสนอราคา" ข้อมูลเดิมพิมพ์ออกมาในแบบที่เลือก โลโก้และชื่อบริษัทเป็นของบริษัทคุณเอง</small></div>
    <div class="fsg-l">${tiles}</div>${col}${fsInputs(F,Q)}${fixed&&cur!=='xl'?'<small class="hint" style="display:block;margin-top:6px">BOQ-G (ปร.4) และ BOQ-E พิมพ์แบบ Excel เดิมเสมอ เพราะรูปแบบกำหนดไว้แล้ว</small>':''}</div>`;
  h=h.replace(/<label>หน้าตาเอกสาร<select[^>]*>[\s\S]*?<\/select><\/label>/,'');
  const k=h.indexOf('<div class="form" style="margin-bottom:12px"><label>เลขที่');return k<0?h:h.slice(0,k)+g+h.slice(k)}}

ACT.fsPick=async b=>{const C=CO(),Q=C.quotes.find(q=>q.id===b.dataset.id),F=fsForm(b.dataset.v);if(!Q||!fsOwn(F)||!fsFits(F,Q))return;
  Q.form=F.id;Object.assign(Q,{look:''},F.set||{});
  if(F.th==='brand'&&!fsRgb(C.formColor)){const c=await fsLogoColor(C.logo);C.formColor=c||'#1c8f9b'}
  save();render();toast(`ใบเสนอราคานี้ใช้แบบ "${F.n}" แล้ว`)};
ACT.fsLogo=async()=>{const C=CO(),c=await fsLogoColor(C.logo);if(!c){toast('อ่านสีจากโลโก้ไม่ได้ ลองเลือกสีเอง');return}C.formColor=c;save();render();toast('ใช้สีจากโลโก้แล้ว')};
// the colour box sends "change" once the colour is picked
document.addEventListener('change',e=>{const t=e.target;if(!t||!t.dataset.fsc)return;const C=CO();if(!fsRgb(t.value))return;C.formColor=t.value;save();render()});

/* ---- 4.10 ร้านฟอร์ม ORIEN: the shop page, previews, buying ----
   Prices come from files/plans.json "forms" ([{k, price}], k 'all' = the whole set) when it lists them, else from FS_FORMS.
   A purchase is a request to ORIEN (LINE / e-mail / copy, as ขอเปลี่ยนแพ็กเกจ) ending "[PENUM-FORM] customer serial +id,id";
   ORIEN ฝ่ายขาย ticks the forms on the customer and approves, the new code (payload fm) reaches the company by itself. */
const fsPlan=k=>(Array.isArray(PLANS.forms)?PLANS.forms:[]).find(x=>x&&x.k===k);
const fsPrice=F=>{const x=fsPlan(F.id);return x&&x.price!=null?n(x.price):n(F.p)};
// sold forms in the shop's order (by group)
const fsSold=()=>FS_FORMS.filter(F=>F.p).sort((a,b)=>FS_GRP.findIndex(g=>g[0]===a.g)-FS_GRP.findIndex(g=>g[0]===b.g));
// ซื้อทั้งชุด: every form not bought yet at one price; the code still lists each form, so forms added later are sold on their own
const fsAllPrice=()=>{const x=fsPlan('all');return x&&x.price!=null?n(x.price):4900};
const FS_CART=[];
// the fields a form needs beyond the quotation's own, under the gallery
function fsInputs(F,Q){if(!F||!F.inp)return '';const b=`co.quotes.${Q.id}`;
  return `<div class="form" style="margin-top:10px">${F.inp.map(([k,l,ty,ph])=>ty==='area'?`<label class="w2">${esc(l)}<textarea data-p="${b}.${k}" rows="3" placeholder="${esc(ph||'')}">${esc(Q[k]||'')}</textarea></label>`
    :`<label>${esc(l)}<input${ty==='num'?' data-t="num"':''} data-p="${b}.${k}" value="${esc(Q[k]==null?'':Q[k])}" placeholder="${esc(ph||'')}"></label>`).join('')}</div>`}
function fsShopTile(Q){const m=fsSold().filter(F=>!fsOwn(F)&&fsFits(F,Q)).length;if(!m)return '';
  return `<button type="button" data-a="go" data-m="co" data-k="shop" style="justify-content:center;align-items:center;text-align:center;border-style:dashed"><span style="font-size:30px;line-height:1">🛒</span><b>ร้านฟอร์ม ORIEN</b><small>อีก ${m} แบบสำหรับใบเสนอราคา${qmMa(Q)?'บริการ':'นี้'} ดูตัวอย่างได้ก่อนซื้อ</small></button>`}

// ---- preview: the form printed with the quotation open now (or a sample), on screen; a form not bought carries a watermark
// a form not bought shows the sample, which has what the form is for (design lines, work taken out); one bought shows the open quotation
function fsSample(ma,own,F){const C=CO(),L=C.quotes.filter(q=>!!qmMa(q)===!!ma);const Q=L.find(q=>q.id===S.sel.quote)||L[L.length-1];if(own&&Q&&Q.items.length)return JSON.parse(JSON.stringify(Q));
  const it=(g,desc,unit,q,m,l)=>({id:uid(),g,head:'',type:'',desc,unit,q,m,l,t:q*(m+l),sp:''});
  const cust=(C.customers[0]||{}).id||'';
  const R=ma?{cust,no:'QT-ตัวอย่าง',date:today(),valid:30,title:'บำรุงรักษาเครื่องปรับอากาศ',kind:'ma',maMonths:12,maVisits:4,maStart:today(),maResp:'เข้าตรวจภายใน 24 ชั่วโมง',maHours:'จันทร์–เสาร์ 08:00–17:00',mk:0,disc:0,terms:'',by:'',
      items:[it(QM_G,'เครื่องปรับอากาศแบบแยกส่วน 18,000–36,000 BTU','เครื่อง',12,0,0),it(QM_G,'เครื่องส่งลมเย็น AHU','เครื่อง',2,0,0),it(QM_G,'ปั๊มน้ำและระบบท่อ','ระบบ',1,0,0)].map((i,k)=>Object.assign(i,{sp:[4800,18000,9600][k]})),adds:[],qpay:[]}
    :{cust,no:'QT-ตัวอย่าง',date:today(),valid:30,title:'ติดตั้งระบบปรับอากาศ',pname:'อาคารสำนักงานตัวอย่าง',site:'กรุงเทพฯ',mk:15,disc:0,terms:'ราคานี้รวมค่าขนส่งและติดตั้ง',by:'',adds:[],
      qpay:[{no:'1',desc:'เงินล่วงหน้าเมื่อลงนามสัญญา',pct:30},{no:'2',desc:'เมื่อติดตั้งแล้วเสร็จ',pct:60},{no:'3',desc:'เมื่อทดสอบและส่งมอบงาน',pct:10}],
      items:[it('ค่าออกแบบ','ออกแบบงานระบบปรับอากาศและเขียนแบบ','งาน',1,0,45000),it('งานเครื่องปรับอากาศ','Split Type 36,000 BTU/hr','ชุด',6,38000,4500),it('งานเครื่องปรับอากาศ','Split Type 24,000 BTU/hr','ชุด',4,26000,3500),
        it('งานท่อน้ำยาและท่อน้ำทิ้ง','ท่อทองแดงพร้อมฉนวน 5/8"','ม.',120,420,180),it('งานท่อน้ำยาและท่อน้ำทิ้ง','ถอดเครื่องเดิม (งานลด)','ชุด',-2,0,1500)]};
  // a form can bring its own sample work (F.smp), so the preview shows what it is made for
  return F&&F.smp?Object.assign(R,F.smp(it)):R}
function fsPreview(F){const C=CO(),Q=Object.assign(fsSample(F.k==='ma',fsOwn(F),F),{id:'fs-pv'},F.set||{},{form:F.id});if(F.k==='boq')delete Q.kind;if(F.th==='brand'&&!fsRgb(C.formColor))C.formColor='#1c8f9b';
  FS_PV=true;C.quotes.push(Q);let h='';try{h=PRINT.quote('fs-pv')}catch(e){console.error(e)}finally{C.quotes.splice(C.quotes.indexOf(Q),1);FS_PV=false}
  const wm=fsOwn(F)?'':`<div class="fs-wm" aria-hidden="true">${'<span>ตัวอย่าง · ร้านฟอร์ม ORIEN</span>'.repeat(12)}</div>`;
  let bar=$('#fsPvb');if(!bar){bar=document.createElement('div');bar.id='fsPvb';bar.className='fs-pvb';document.body.appendChild(bar)}
  bar.innerHTML=`<b>${esc(F.n)}</b><small>${fsOwn(F)?'ตัวอย่างจากใบเสนอราคาของคุณ':'ตัวอย่าง ยังไม่ได้ซื้อ (มีลายน้ำ)'}</small><span style="flex:1"></span>
    ${fsOwn(F)?'':`<button type="button" class="btn sm pri" data-a="fsCart" data-v="${F.id}">${FS_CART.includes(F.id)?'✓ อยู่ในตะกร้า':'ใส่ตะกร้า · '+fmt(fsPrice(F))+' บาท'}</button>`}<button type="button" class="btn sm" data-a="fsPvClose">ปิด</button>`;
  const p=$('#print');p.innerHTML=`<div class="fs-paper${/size:A4 landscape/.test(h)?' land':''}">${h}${wm}</div>`;fillPhotos(p);document.body.classList.add('fs-pv');p.scrollTop=0}
document.head.insertAdjacentHTML('beforeend',`<style>
body.fs-pv{overflow:hidden}
body.fs-pv #print{display:block;position:fixed;inset:0;z-index:9000;overflow:auto;background:#56626B;padding:64px 12px 24px}
body.fs-pv #print>*{max-width:216mm;margin:0 auto;background:#fff;box-shadow:0 6px 24px rgba(0,0,0,.35)}
body.fs-pv #print>.fs-paper.land{max-width:303mm}
.fs-pvb{position:fixed;top:0;left:0;right:0;z-index:9001;display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:10px 16px;background:#1F2A31;color:#fff}
.fs-pvb small{color:#C9D3D8}.fs-pvb .btn:not(.pri){background:#fff;color:#1F2A31}
.fs-paper{position:relative;padding:8mm;color:#1F2E36;overflow:hidden}
.fs-paper .ofoot{position:static!important;display:flex;justify-content:space-between;margin-top:8px;font-size:10px;color:#6B7F87}
.fs-wm{position:absolute;inset:0;pointer-events:none;display:flex;flex-wrap:wrap;align-content:space-around;justify-content:space-around;overflow:hidden;z-index:3}
.fs-wm span{transform:rotate(-28deg);font-size:26px;font-weight:700;color:rgba(200,30,30,.13);white-space:nowrap;padding:60px 20px}
@media print{.fs-pvb{display:none!important}body.fs-pv #print{position:static;padding:0;background:none;overflow:visible}body.fs-pv #print>*{max-width:none;box-shadow:none}.fs-paper{padding:0;overflow:visible}.fs-paper .ofoot{position:fixed!important}.fs-wm{position:fixed}}
</style>`);
ACT.fsPv=b=>{const F=fsForm(b.dataset.v);if(F)fsPreview(F)};
ACT.fsPvClose=()=>{document.body.classList.remove('fs-pv');$('#print').innerHTML='';const b=$('#fsPvb');if(b)b.remove()};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.body.classList.contains('fs-pv'))ACT.fsPvClose()});
ACT.fsCart=b=>{const id=b.dataset.v,k=FS_CART.indexOf(id);if(id==='all'){FS_CART.length=0;fsSold().filter(F=>!fsOwn(F)).forEach(F=>FS_CART.push(F.id))}else if(k<0)FS_CART.push(id);else FS_CART.splice(k,1);
  if(document.body.classList.contains('fs-pv')){const F=fsForm(id);if(F)fsPreview(F)}render()};

// ---- the shop page
const FS_SHOP=`<style>
.fss-h{display:flex;gap:16px;align-items:center;flex-wrap:wrap;margin:0 0 6px}.fss-h p{margin:0;color:var(--muted);flex:1;min-width:240px}
.fss-st{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:8px;margin:10px 0 4px}
.fss-st div{border-radius:10px;background:var(--sunk);padding:8px 10px;font-size:13px}.fss-st b{display:block;color:var(--accent);font-size:12px}
.fss-g{margin:16px 0 0}.fss-g h3{margin:0 0 8px;font-size:15px}
.fss-l{display:grid;grid-template-columns:repeat(auto-fill,minmax(215px,1fr));gap:12px}
.fss-c{display:flex;flex-direction:column;gap:6px;border:1px solid var(--line);border-radius:12px;padding:10px;background:var(--surface)}
.fss-c.in{border-color:var(--accent);box-shadow:0 0 0 2px color-mix(in srgb,var(--accent) 22%,transparent)}
.fss-c svg{width:100%;height:auto;max-height:190px;background:#EEF2F4;border-radius:8px;padding:8px;cursor:zoom-in}
.fss-c b{font-size:14px}.fss-c small{color:var(--muted);font-size:12.5px;line-height:1.4;flex:1}
.fss-c .pr{display:flex;align-items:center;gap:6px;flex-wrap:wrap}.fss-c .pr strong{font-size:15px}
.fss-c .row{gap:6px;flex-wrap:wrap}
.fss-cart{position:sticky;bottom:10px;z-index:5;display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:16px;padding:10px 14px;border-radius:12px;background:var(--surface);border:1.5px solid var(--accent);box-shadow:var(--shadow)}
.fss-cart b{font-size:15px}
</style>`;
CVIEWS.shop=()=>{const admin=!S.me,L=licP(),own=fsSold().filter(fsOwn),open=fsSold().filter(F=>!fsOwn(F)),tot=sum(FS_CART.map(fsForm).filter(Boolean),fsPrice),all=fsAllPrice(),useAll=open.length>1&&tot>all;
  const kind=F=>F.k==='ma'?'ใบเสนอราคาบริการ PM/MA':F.k==='boq'?'ใบเสนอราคางานติดตั้ง':'ใบเสนอราคาทุกแบบ';
  const cardOf=F=>{const o=fsOwn(F),inC=FS_CART.includes(F.id);
    return `<div class="fss-c${inC?' in':''}"><span data-a="fsPv" data-v="${F.id}" role="button" tabindex="0" aria-label="ดูตัวอย่าง ${esc(F.n)}">${fsThumb(F)}</span><b>${esc(F.n)}</b><small>${esc(F.d)}<br><span class="muted">ใช้กับ: ${kind(F)}</span></small>
      <div class="pr">${o?`<span class="pill ok">${F.p?'✓ ซื้อแล้ว':'ฟรีในทุกแพ็กเกจ'}</span>`:`<strong>${fmt(fsPrice(F))} บาท</strong><small class="muted" style="flex:none">จ่ายครั้งเดียว</small>`}</div>
      <div class="row"><button type="button" class="btn sm" data-a="fsPv" data-v="${F.id}">ดูตัวอย่าง</button>${o?`<button type="button" class="btn sm" data-a="go" data-m="co" data-k="sales" data-s="quote">ใช้ในใบเสนอราคา</button>`
        :`<button type="button" class="btn sm${inC?'':' pri'}" data-a="fsCart" data-v="${F.id}">${inC?'✓ ในตะกร้า (กดเพื่อเอาออก)':'ใส่ตะกร้า'}</button>`}</div></div>`};
  const groups=FS_GRP.map(([g,lab])=>{const Fs=FS_FORMS.filter(F=>F.g===g);return Fs.length?`<div class="fss-g"><h3>${esc(lab)}</h3><div class="fss-l">${Fs.map(cardOf).join('')}</div></div>`:''}).join('');
  const cart=FS_CART.length?`<div class="fss-cart"><span>ในตะกร้า ${FS_CART.length} แบบ</span><b>${fmt(useAll&&FS_CART.length===open.length?all:tot)} บาท</b>${useAll?`<small class="muted">ซื้อทั้งชุดจ่ายแค่ ${fmt(all)} บาท</small>`:''}<span style="flex:1"></span>
    ${open.length>1&&FS_CART.length<open.length?`<button type="button" class="btn sm" data-a="fsCart" data-v="all">ใส่ทั้งชุด (${open.length} แบบ ${fmt(all)} บาท)</button>`:''}
    ${admin?'<button type="button" class="btn pri" data-a="fsReq">ส่งคำขอซื้อ</button>':'<small class="muted">ผู้ดูแลระบบเป็นผู้ส่งคำขอซื้อ</small>'}</div>`:'';
  return FS_SHOP+`<section class="card"><h2><span>ร้านฟอร์มเอกสาร ORIEN</span></h2>
    <div class="fss-h"><p>แบบฟอร์มใบเสนอราคาและ BOQ ที่ ORIEN ออกแบบให้ พิมพ์ด้วยข้อมูลเดิมของคุณ พร้อมโลโก้และชื่อบริษัทคุณเอง กดรูปเพื่อดูตัวอย่างเต็มหน้าก่อนซื้อ</p></div>
    <div class="fss-st"><div><b>1 เลือกฟอร์ม</b>ดูตัวอย่าง แล้วใส่ตะกร้า</div><div><b>2 ส่งคำขอซื้อ</b>ทาง LINE หรืออีเมลถึง ORIEN</div><div><b>3 ORIEN อนุมัติ</b>ฟอร์มเปิดให้ใช้เองเมื่อเปิดโปรแกรม ไม่ต้องใส่รหัสใหม่</div>
      <div><b>มีแล้ว</b>${own.length?`${own.length} แบบที่ซื้อ`:'ยังไม่ได้ซื้อ'} · ฟรี ${FS_FORMS.filter(F=>!F.p).length} แบบ</div></div>${L||!licOn()?'':'<p class="hint">ใส่รหัสเปิดใช้งานในตั้งค่า › สิทธิ์การใช้งานก่อน จึงจะส่งคำขอซื้อได้</p>'}
    ${groups}${cart}</section>`};
{const f=allowed;allowed=(m,t)=>m==='co'&&t==='shop'?f('co','sales'):f(m,t)}
NAVD.find(d=>d[0]==='sales')[2].push(['co','shop','','ร้านฟอร์ม ORIEN']);

// ---- the request to ORIEN
function fsReqTxt(){const L=licP(),C=CO(),F=FS_CART.map(fsForm).filter(Boolean),open=fsSold().filter(x=>!fsOwn(x)),tot=sum(F,fsPrice),all=fsAllPrice(),whole=open.length>1&&F.length===open.length&&tot>all;
  const cust=L?L.sn||String(L.id).replace(/-R\d+$/,''):'-',note=(($('#fsNo')||{}).value||'').trim();
  return ['เรียน ฝ่ายขาย ORIEN','','ขอซื้อแบบฟอร์มเอกสาร (ร้านฟอร์ม ORIEN)','',`บริษัท: ${L?L.co:C.name||''}`,`รหัสลูกค้า: ${cust}`,`Serial number: ${L?L.no||L.id:'-'}`,'',
    ...F.map((x,k)=>`${k+1}. ${x.n} · ${fmt(fsPrice(x))} บาท`),'',whole?`ซื้อทั้งชุด ${F.length} แบบ: ${fmt(all)} บาท (ไม่รวม VAT)`:`รวม ${fmt(tot)} บาท (ไม่รวม VAT)`,
    ...(note?['',`หมายเหตุ: ${note}`]:[]),'',`[PENUM-FORM] ${cust} ${L?L.no||L.id:'-'} +${F.map(x=>x.id).join(',')}${whole?' set':''}`].join('\n')}
ACT.fsReq=()=>{if(!FS_CART.length)return;const c=PLANS.contact||{};
  dialog('ส่งคำขอซื้อแบบฟอร์ม',`<textarea readonly rows="9" style="width:100%" id="fsTx">${esc(fsReqTxt())}</textarea><label style="margin-top:8px;display:block">หมายเหตุ (ถ้ามี)<textarea id="fsNo" rows="2" style="width:100%" placeholder="เช่น ขอใบกำกับภาษีในนามบริษัท"></textarea></label>
    <p class="hint">ORIEN จะส่งใบแจ้งหนี้ให้ เมื่อชำระแล้วฟอร์มจะเปิดให้ใช้เองเมื่อเปิดโปรแกรมครั้งถัดไป ไม่ต้องใส่รหัสใหม่</p>`,
    (c.lineOA?'<button type="button" class="btn pri" data-a="fsLine">ส่งทาง LINE</button><button type="button" class="btn" data-a="fsMail">ส่งอีเมล</button>':'<button type="button" class="btn pri" data-a="fsMail">ส่งอีเมล</button>')+'<button type="button" class="btn" data-a="fsCopy">คัดลอกข้อความ</button>');
  const no=$('#fsNo');no&&no.addEventListener('input',()=>{$('#fsTx').value=fsReqTxt()})};
ACT.fsLine=async()=>{let id=String((PLANS.contact||{}).lineOA||'').trim();if(!id)return;id=id.startsWith('@')?id:'@'+id;const t=fsReqTxt();
  if(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)){open(`https://line.me/R/oaMessage/${encodeURIComponent(id)}/?${encodeURIComponent(t)}`,'_blank');return}
  const ok=await copyText(t);open(`https://line.me/R/ti/p/${encodeURIComponent(id)}`,'_blank');toast(ok?`คัดลอกข้อความแล้ว เปิด LINE ค้นหาไอดี ${id} แล้ววางข้อความส่งได้เลย`:'คัดลอกข้อความในช่องแล้วส่งทาง LINE')};
ACT.fsMail=()=>{const L=licP();location.href=`mailto:${(PLANS.contact||{}).email||''}?subject=${encodeURIComponent('ขอซื้อแบบฟอร์มเอกสาร PENUM PM: '+(L?L.co:CO().name||''))}&body=${encodeURIComponent(fsReqTxt())}`};
ACT.fsCopy=async()=>{toast(await copyText(fsReqTxt())?'คัดลอกแล้ว วางส่งทาง LINE หรืออีเมลได้เลย':'คัดลอกไม่ได้')};
// the cart in the title bar opens the shop (985 mounts the bar later)
if(window.penumBar){const m=penumBar.mount;penumBar.mount=cfg=>m(Object.assign({cart:()=>ACT.go({dataset:{m:'co',k:'shop'}})},cfg))}
