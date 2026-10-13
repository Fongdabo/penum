/* ---------- download any table as a file Excel opens (CSV, UTF-8 with BOM so Thai shows correctly) ---------- */
{const f=copyBtn;copyBtn=k=>f(k)+` <button type="button" class="btn sm" data-a="dlTbl" data-k="${k}">ดาวน์โหลด Excel</button>`}
ACT.dlTbl=async b=>{const t=TABLES[b.dataset.k];if(!t)return;
  const csv='﻿'+tsvOf(t.rows(),t.cols).split('\n').map(l=>l.split('\t').map(v=>/[",\r\n]/.test(v)||/^[=+\-@]/.test(v)?`"${v.replace(/"/g,'""')}"`:v).join(',')).join('\r\n');
  const nm=`PENUM-${b.dataset.k}-${today()}.csv`;// plain ASCII name: some browsers drop non-Latin download names
  toast(await download(nm,csv,'text/csv;charset=utf-8')?'ดาวน์โหลดแล้ว เปิดด้วย Excel ได้เลย':'ดาวน์โหลดไม่ได้')};

/* ---------- company logo on every printed document ---------- */
const withLogo=h=>DB.co.logo?h.replace('<div class="co"><div>',`<div class="co"><div style="display:flex;gap:12px;align-items:center"><img src="${DB.co.logo}" alt="" style="max-height:56px;max-width:160px;object-fit:contain"><div>`).replace(/(<div class="co">.*?<\/div>)(<div style="text-align:right">)/s,'$1</div>$2'):h;
{const f=cphead;cphead=(t,s)=>withLogo(f(t,s))}{const f=phead;phead=(t,s)=>withLogo(f(t,s))}
ACT.logoUp=()=>{const f=$('#fileIn');f.accept='image/*';f.onchange=async()=>{const file=f.files[0];f.value='';if(!file)return;
  const url=await new Promise(ok=>{const r=new FileReader();r.onload=()=>ok(r.result);r.readAsDataURL(file)}),im=new Image();im.src=url;await im.decode().catch(()=>{});
  const k=Math.min(1,400/Math.max(im.naturalWidth||1,im.naturalHeight||1)),c=document.createElement('canvas');c.width=Math.round(im.naturalWidth*k)||1;c.height=Math.round(im.naturalHeight*k)||1;c.getContext('2d').drawImage(im,0,0,c.width,c.height);
  DB.co.logo=c.toDataURL('image/png');save();render();toast('ใส่โลโก้แล้ว จะขึ้นบนเอกสารที่พิมพ์ทุกใบ')};f.click()};
ACT.logoDel=()=>{if(confirm('ลบโลโก้?')){delete DB.co.logo;save();render()}};
{const f=CVIEWS.coset;CVIEWS.coset=()=>{const h=f(),i=h.indexOf('</section>');const box=`<div style="margin-top:12px;display:flex;gap:12px;align-items:center;flex-wrap:wrap"><b>โลโก้บริษัท</b>${DB.co.logo?`<img src="${DB.co.logo}" alt="โลโก้" style="max-height:48px;max-width:160px;border:1px solid var(--line);border-radius:6px;padding:4px;background:#fff"><button type="button" class="btn sm" data-a="logoUp">เปลี่ยน</button><button type="button" class="btn sm del" data-a="logoDel">ลบ</button>`:`<button type="button" class="btn sm" data-a="logoUp">ใส่โลโก้</button><span class="hint">ขึ้นบนใบเสนอราคา ใบสั่งซื้อ ใบเบิกงวด และเอกสารพิมพ์ทุกใบ</span>`}</div>`;
  return i<0?h+box:h.slice(0,i)+box+h.slice(i)}}

/* ---------- what needs attention today, across all projects and the company ---------- */
function alerts(){const td=today(),A=[],soon=k=>addD(td,k),add=(lv,kind,p,txt,due,go)=>A.push({lv,kind,p,txt,due,go});
  projects().forEach(p=>withP(p,()=>{
    p.pos.forEach(po=>{if(poState(po).k==='bad')add('bad','ของส่งล่าช้า',p,`${po.no} ${vName(po.vid)}`,po.due,{m:'pj',k:'buy',s:'po'})});
    (p.rfis||[]).forEach(r=>{if(r.status==='open'&&okD(r.due)&&r.due<=soon(1))add(r.due<td?'bad':'warn','RFI รอคำตอบ',p,`${r.no} ${r.subject||''}`,r.due,{m:'pj',k:'site',s:'rfi'})});
    (p.punch||[]).forEach(r=>{if(r.status!=='done'&&okD(r.due)&&r.due<td)add('warn','Punch list เกินกำหนด',p,`${r.no} ${r.item||''} ${r.loc||''}`,r.due,{m:'pj',k:'hand',s:'punch'})});
    (p.war||[]).forEach(w=>{if(!okD(w.start))return;const d=pd(w.start);d.setMonth(d.getMonth()+n(w.months));const end=iso(d);if(end>=td&&end<=soon(60))add('warn','ประกันใกล้หมด',p,`${w.item||''} ${w.vendor||''}`,end,{m:'pj',k:'hand',s:'war'})});
    if(p.tasks.length){const s=sched();p.tasks.forEach(t=>{const r=s.R[t.id];if(r&&r.crit&&n(t.pct)<100&&okD(r.ef)&&r.ef<td)add('bad','งานวิกฤตล่าช้า',p,t.name||'',r.ef,{m:'pj',k:'sched'})})}}));
  arRows().forEach(({p,b,c,due})=>{if(b.status!=='paid'&&due<td)add('bad','ลูกหนี้เกินกำหนด',p,`${b.no} ${fmt(c.net)} บาท`,due,{m:'co',k:'acct',s:'ar'})});
  apRows().forEach(({p,po,t,due})=>{if(!po.paid&&due<=soon(7))add(due<td?'bad':'warn','ครบกำหนดจ่ายผู้ขาย',p,`${po.no} ${fmt(t)} บาท`,due,{m:'co',k:'acct',s:'ap'})});
  CO().staff.forEach(s=>{if(s.active!==false&&okD(s.licExp)&&s.licExp<=soon(30))add(s.licExp<td?'bad':'warn','ใบอนุญาต/บัตรอบรมใกล้หมด',null,`${s.name} · ${s.lic||''}`,s.licExp,{m:'co',k:'hr',s:'staff'})});
  CO().tickets.forEach(t=>{if((t.status==='open'||t.status==='plan')&&okD(t.due)&&t.due<=soon(3))add(t.due<td?'bad':'warn',t.kind==='pm'?'งาน PM ใกล้ถึงกำหนด':'งานซ่อมรอทำ',null,`${t.no} ${t.problem||''}`,t.due,{m:'co',k:'svc',s:'job'})});
  return A.filter(a=>allowed(a.go.m,a.go.k)).sort((a,b)=>(a.lv==='bad'?0:1)-(b.lv==='bad'?0:1)||String(a.due).localeCompare(String(b.due)))}
function alertCard(list,title){if(!list.length)return '';const max=12;
  return `<section class="card"><h2><span>${title}</span><small>${list.length} รายการ · เรียงจากเรื่องด่วน</small></h2><div class="tw"><table><thead><tr><th>เรื่อง</th><th>รายการ</th><th>โครงการ</th><th>กำหนด</th><th></th></tr></thead><tbody>
  ${list.slice(0,max).map(a=>`<tr><td><span class="pill ${a.lv}">${a.kind}</span></td><td>${esc(a.txt)}</td><td>${a.p?esc(a.p.name):'<span class="muted">บริษัท</span>'}</td><td style="white-space:nowrap">${thD(a.due)}</td><td><button type="button" class="btn sm" data-a="go" data-m="${a.go.m}" data-k="${a.go.k}"${a.go.s?` data-s="${a.go.s}"`:''}${a.p?` data-p="${a.p.id}"`:''}>เปิด</button></td></tr>`).join('')}
  ${list.length>max?`<tr><td colspan="5" class="muted">และอีก ${list.length-max} รายการ</td></tr>`:''}</tbody></table></div></section>`}
{const f=CVIEWS.exec;CVIEWS.exec=()=>{let h=f();const c=alertCard(alerts(),'ต้องดูวันนี้');const i=h.indexOf('<section');return c?(i<0?c+h:h.slice(0,i)+c+h.slice(i)):h}}
{const f=VIEWS.dash;VIEWS.dash=()=>f()+alertCard(alerts().filter(a=>a.p&&a.p.id===P.id),'ต้องดูในโครงการนี้')}
// backup and restore move the whole company's data: only the administrator, once PINs are on
{for(const k of ['backup','restore']){const f=ACT[k];ACT[k]=b=>{if(pinOn()&&(!authOK()||S.me)){toast('เฉพาะผู้ดูแลระบบ');return}return f(b)}}}

/* ---------- look: stroke icons on the tabs, and the "เมนู" dropdown closes after a pick or an outside click ---------- */
const ICO={exec:'<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 6-6"/>',
  sales:'<path d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
  acct:'<rect x="2" y="6" width="20" height="13" rx="2"/><path d="M2 10h20M6 15h4"/>',
  hr:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20a6.5 6.5 0 0 0-4-6"/>',
  svc:'<path d="M14.7 6.3a4 4 0 0 0-5.4 5.2L3 17.8V21h3.2l6.3-6.3a4 4 0 0 0 5.2-5.4l-2.6 2.6-2.4-.6-.6-2.4z"/>',
  coset:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 3.1 14H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 10 3.1V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A1.7 1.7 0 0 0 20.9 10H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  dash:'<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
  sched:'<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4M7 13h5M7 17h9"/>',
  buy:'<circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2 3h3l2.7 12.4a2 2 0 0 0 2 1.6h8.6a2 2 0 0 0 2-1.6L22 7H6"/>',
  cost:'<circle cx="12" cy="12" r="9"/><path d="M15 9.5c-.5-1-1.6-1.5-3-1.5-1.7 0-3 .9-3 2.2 0 3 6 1.6 6 4.6 0 1.3-1.3 2.2-3 2.2-1.4 0-2.6-.6-3-1.6M12 6v2M12 16v2"/>',
  site:'<path d="M2 18h20M4 18v-3a8 8 0 0 1 16 0v3"/><path d="M10 7.5V5h4v2.5"/>',
  docs:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
  hand:'<path d="M20 6L9 17l-5-5"/>',
  setup:'<path d="M4 6h16M4 12h16M4 18h10"/>'};
{const r=render;render=function(){r.apply(this,arguments);
  $('#tabs').querySelectorAll('[data-a="tab"]').forEach(b=>{const p=ICO[b.dataset.k];if(p&&!b.querySelector('svg'))b.insertAdjacentHTML('afterbegin',`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`)})}}
document.addEventListener('click',e=>{const m=$('#moreMenu');if(!m||!m.open)return;if(!m.contains(e.target)||e.target.closest('.menu button,.menu a'))m.open=false});
/* colours: bright by default on every device; "สีเข้ม" in the menu switches this device to dark and back */
const THEME={get(){try{return localStorage.getItem('penum.pm.theme')||'soft'}catch(e){return 'soft'}},
  set(t){try{localStorage.setItem('penum.pm.theme',t)}catch(e){}this.apply()},
  apply(){const t=this.get();document.documentElement.dataset.theme=t;document.querySelectorAll('#themeSw [data-k]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.k===t))}};
THEME.apply();
ACT.theme=b=>{THEME.set(['dark','soft'].includes(b.dataset.k)?b.dataset.k:'light');render()};

