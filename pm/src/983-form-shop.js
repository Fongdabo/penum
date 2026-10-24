/* ---------- 4.4 แบบฟอร์มใบเสนอราคา / BOQ: pick a form from a gallery (ORIEN form shop, part 1) ----------
   ORIEN sells form styles to the contractors who rent PENUM PM (user, 2026-10-24: 20 forms, a shop, buyers' own logo on every form).
   One quotation's data prints in any form: a form is a set of print settings (Q.look, Q.one, Q.lay, Q.kind) plus a colour theme
   that this file lays over the ORIEN Modern print (981-quote-forms.js) as a class on div.qm. The quotation keeps its pick in Q.form.
   FS_FORMS lists the whole catalogue; the 5 free forms are open to every company, the rest open once bought (the shop comes next).
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
// the form a quotation prints in: its own pick, or what its older settings amount to
const fsCur=Q=>fsForm(Q.form)&&(Q.form!=='short'||Q.one)?Q.form:Q.look==='xl'?'xl':Q.one?'short':'modern';
const fsOwn=F=>!!F&&!F.p;

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
{const f=PRINT.quote;PRINT.quote=(id,bq)=>{const h=f(id,bq),Q=CO().quotes.find(q=>q.id===id),F=Q&&fsForm(fsCur(Q));if(!F||!F.th||h.indexOf('<div class="qm"')<0)return h;
  const st=F.th==='brand'?` style="${Object.entries(fsVars(CO().formColor)).map(([k,v])=>`${k}:${v}`).join(';')}"`:'';
  return FS_CSS+h.replace('<div class="qm"',`<div class="qm fs-${F.th}"${st}`)}}

// ---- a small picture of each form for the gallery
function fsThumb(F){const C=CO(),b=F.th==='brand'?fsVars(C.formColor):null;
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
  const tiles=FS_FORMS.filter(fsOwn).map(x=>`<button type="button" class="${x.id===cur?'on':''}" data-a="fsPick" data-id="${Q.id}" data-v="${x.id}" aria-pressed="${x.id===cur}">${fsThumb(x)}<b>${esc(x.n)}</b><small>${esc(x.d)}</small><span class="tag">${x.id===cur?'✓ ใช้อยู่':'ฟรี'}</span></button>`).join('');
  const col=F&&F.th==='brand'?`<div class="fsg-c">สีของบริษัท <input type="color" data-fsc="1" value="${fsRgb(C.formColor)?esc(C.formColor):'#1c8f9b'}" aria-label="สีของบริษัท">
    <button type="button" class="btn sm" data-a="fsLogo"${C.logo?'':' disabled title="ใส่โลโก้บริษัทในตั้งค่าบริษัทก่อน"'}>ใช้สีจากโลโก้</button><small class="muted">ใช้กับทุกใบเสนอราคาที่เลือกแบบนี้</small></div>`:'';
  const g=FS_UI+`<div class="fsg"><div class="fsg-h"><b>แบบฟอร์มเอกสาร</b><small class="muted">กดเลือกแล้วกด "พิมพ์ใบเสนอราคา" ข้อมูลเดิมพิมพ์ออกมาในแบบที่เลือก โลโก้และชื่อบริษัทเป็นของบริษัทคุณเอง</small></div>
    <div class="fsg-l">${tiles}</div>${col}${fixed&&cur!=='xl'?'<small class="hint" style="display:block;margin-top:6px">BOQ-G (ปร.4) และ BOQ-E พิมพ์แบบ Excel เดิมเสมอ เพราะรูปแบบกำหนดไว้แล้ว</small>':''}</div>`;
  h=h.replace(/<label>หน้าตาเอกสาร<select[^>]*>[\s\S]*?<\/select><\/label>/,'');
  const k=h.indexOf('<div class="form" style="margin-bottom:12px"><label>เลขที่');return k<0?h:h.slice(0,k)+g+h.slice(k)}}

ACT.fsPick=async b=>{const C=CO(),Q=C.quotes.find(q=>q.id===b.dataset.id),F=fsForm(b.dataset.v);if(!Q||!fsOwn(F))return;
  Q.form=F.id;Object.assign(Q,F.set||{});
  if(F.th==='brand'&&!fsRgb(C.formColor)){const c=await fsLogoColor(C.logo);C.formColor=c||'#1c8f9b'}
  save();render();toast(`ใบเสนอราคานี้ใช้แบบ "${F.n}" แล้ว`)};
ACT.fsLogo=async()=>{const C=CO(),c=await fsLogoColor(C.logo);if(!c){toast('อ่านสีจากโลโก้ไม่ได้ ลองเลือกสีเอง');return}C.formColor=c;save();render();toast('ใช้สีจากโลโก้แล้ว')};
// the colour box sends "change" once the colour is picked
document.addEventListener('change',e=>{const t=e.target;if(!t||!t.dataset.fsc)return;const C=CO();if(!fsRgb(t.value))return;C.formColor=t.value;save();render()});
