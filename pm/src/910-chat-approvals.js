/* ---------- 3.69 approvals in the chat: what waits for you shows at the top of the window, with อนุมัติ / ไม่อนุมัติ right there.
   It uses the same rules and the same records as the pages: the PR / quote / claim steps of สิทธิ์และการอนุมัติ, and
   leave, OT, welfare claims and petty cash for the people the pages let approve them. The result can be told in the
   chat: in the project room for a PR or a claim, privately to the person for their leave, OT, welfare or petty cash. */
const CHAP={pr:['ใบขอซื้อ','PR','#8a6db8'],bill:['ใบเบิกงวด','฿','#3F8C96'],quote:['ใบเสนอราคา','QT','#7a6a4f'],leave:['ใบลา','ลา','#c0564b'],ot:['ขอทำโอที','OT','#4a7fb5'],claim:['เบิกสวัสดิการ','สว','#5d8f4f'],pc:['เงินสดย่อย','฿','#d08a2b']};
function chApStep(kind,doc){const i=APPR[kind].findIndex((_,k)=>!(doc.appr||{})[k]);return i>=0&&APPR[kind].slice(0,i).every((_,k)=>doc.appr[k].ok)&&canAppr(kind,i)?i:-1}
const chStaff=x=>CO().staff.find(s=>s.id===x||(x&&s.name===x))||null;
function chQueue(){if(!cmMe())return [];const Q=[],C=CO(),u=me(),step=(k,i)=>`ขั้นที่ ${i+1} ${APPR[k][i][0]}`;
  if(apprOn()){projects().forEach(p=>{
      (p.prs||[]).filter(r=>!r.po).forEach(r=>{const i=chApStep('pr',r);if(i>=0)Q.push({k:'pr',id:r.id,pid:p.id,ref:'prs:'+r.id,no:r.no,i,sub:p.name+' · '+step('pr',i),det:[`${(r.items||[]).length} รายการ`,r.need?'ต้องการ '+thD(r.need):'',r.note||r.title].filter(Boolean).join(' · ')})});
      (p.bills||[]).filter(b=>b.status==='draft').forEach(b=>{const i=chApStep('bill',b);if(i>=0){let amt=0;try{amt=withP(p,()=>billCalc(b).net)}catch(e){}Q.push({k:'bill',id:b.id,pid:p.id,ref:'bills:'+b.id,no:b.no,i,amt,sub:p.name+' · '+step('bill',i),det:'ยอดสุทธิที่จะเบิก'})}})});
    (C.quotes||[]).filter(q=>q.status==='draft').forEach(q=>{const i=chApStep('quote',q);if(i>=0){let amt=0;try{amt=qCalc(q).grand}catch(e){}const s=chStaff(q.by);Q.push({k:'quote',id:q.id,pid:'',ref:'quotes:'+q.id,no:q.no,i,amt,who:s&&s.id,sub:(q.cust||q.pname||q.title||'')+' · '+step('quote',i),det:q.title||q.pname||''})}})}
  const nm=x=>staffName(x)||'(ไม่ทราบชื่อ)';
  if(isBoss())(C.leave||[]).filter(l=>l.status==='pend').forEach(l=>Q.push({k:'leave',id:l.id,no:'',who:l.staff,sub:nm(l.staff),go:['co','hr','leave'],
    det:[(LTYPE.find(t=>t[0]===l.type)||['',''])[1],thD(l.from)+(l.to&&l.to!==l.from?' – '+thD(l.to):''),fmtq(leaveDays(l))+' วัน',l.reason].filter(Boolean).join(' · ')}));
  if(!u||canHR()||isHead(u))(C.otReq||[]).filter(o=>o.status==='pend').forEach(o=>Q.push({k:'ot',id:o.id,no:o.no,who:o.staff,sub:nm(o.staff),go:['co','hr','ot'],
    det:[thD(o.date),`${o.from||''}–${o.to||''}`,fmtq(otHrs(o))+' ชม.',o.reason].filter(Boolean).join(' · ')}));
  if(canHR()){const T=benCfg().claimT||[];(C.claims||[]).filter(c=>c.status==='pend').forEach(c=>Q.push({k:'claim',id:c.id,no:c.no,who:c.staff,amt:n(c.amt),sub:nm(c.staff),go:['co','hr','ben'],
    det:[(T.find(t=>t.k===c.type)||{}).n,thD(c.date),c.note].filter(Boolean).join(' · ')}))}
  if(canAcc())(C.pc||[]).filter(e=>e.status==='pend').forEach(e=>Q.push({k:'pc',id:e.id,no:e.no,who:e.staff,amt:n(e.amt),sub:nm(e.staff),go:['co','acct','pc'],
    det:[e.kind==='adv'?'ขอเงินทดรอง':'เบิกเงินสดย่อย',e.desc,e.proj&&DB.projects[e.proj]?DB.projects[e.proj].name:''].filter(Boolean).join(' · ')}));
  return Q}
const chApTitle=it=>it.ref?cmTitle({l:CHAP[it.k][0],no:it.no}):CHAP[it.k][0]+(it.no?' '+it.no:'');
const chApBtns=(it,room)=>`<div class="ch-apb"><button type="button" class="btn sm pri" data-a="chAp" data-k="${it.k}" data-id="${esc(it.id)}" data-ok="1">✓ อนุมัติ</button><button type="button" class="btn sm del" data-a="chApR" data-k="${it.k}" data-id="${esc(it.id)}">ไม่อนุมัติ</button>${room?'':`<button type="button" class="btn sm ghost" data-a="chApGo" data-k="${it.k}" data-id="${esc(it.id)}">เปิดดู</button>`}</div>`;
function chApHtml(u){const Q=chQueue(),O=Object.keys(CHAP);Q.sort((a,b)=>O.indexOf(a.k)-O.indexOf(b.k));
  const card=it=>{const c=CHAP[it.k],rej=CH.rej===it.k+':'+it.id;
    return `<div class="ch-ap${rej?' rej':''}"><div class="ch-apt"><span class="ch-di" style="background:${c[2]}">${c[1]}</span><span class="ch-rt"><b>${esc(chApTitle(it))}</b><small>${esc(it.sub||'')}</small></span>${it.amt?`<span class="ch-apm">${fmt(it.amt)} บาท</span>`:''}</div>
      ${it.det?`<p class="ch-apd">${esc(it.det)}</p>`:''}
      ${rej?`<div class="ch-why"><input type="text" data-chwhy="1" maxlength="300" placeholder="${esc(trS('เหตุผลที่ไม่อนุมัติ (ไม่บังคับ)'))}" aria-label="เหตุผลที่ไม่อนุมัติ"><div class="ch-apb"><button type="button" class="btn sm del" data-a="chAp" data-k="${it.k}" data-id="${esc(it.id)}" data-ok="">ยืนยันไม่อนุมัติ</button><button type="button" class="btn sm ghost" data-a="chApX">ยกเลิก</button></div></div>`:chApBtns(it)}</div>`};
  const off=!apprOn()&&(u==='admin'||(me()||{}).dept==='MGT')?'<p class="hint ch-priv">ขั้นตอนอนุมัติใบขอซื้อ ใบเสนอราคา และใบเบิกงวด ยังไม่ได้เปิดใช้ เปิดได้ที่ ตั้งค่า › สิทธิ์และการอนุมัติ</p>':'';
  return `<header class="ch-rh"><button type="button" class="ch-bk" data-a="chBack" aria-label="กลับไปรายการห้อง">‹</button><span class="ch-di ch-apic" aria-hidden="true">✓</span><div><b>รอคุณอนุมัติ</b><small>${Q.length?`${Q.length} รายการ · ใช้สิทธิ์เดียวกับหน้าเอกสาร`:'ไม่มีรายการค้าง'}</small></div><button type="button" class="ch-x" data-a="chClose" aria-label="ปิดแชท">✕</button></header>
  <div class="ch-bd">${Q.length?`<label class="ch-apn"><input type="checkbox" data-chapn="1"${CH.apN!==false?' checked':''}> แจ้งผลในแชทให้คนที่เกี่ยวข้องรู้ด้วย</label>${Q.map(card).join('')}`:'<p class="ch-empty">ไม่มีเอกสารรอคุณอนุมัติ 🎉</p>'}${off}</div>`}
document.addEventListener('change',e=>{if(e.target.dataset&&e.target.dataset.chapn){CH.apN=e.target.checked}});
ACT.chApR=b=>{CH.rej=b.dataset.k+':'+b.dataset.id;CH.view='appr';chDraw();const i=$('#chPop [data-chwhy]');if(i){i.focus();i.closest('.ch-ap').scrollIntoView({block:'nearest'})}};
ACT.chApX=()=>{CH.rej='';chDraw()};
ACT.chApGo=b=>{const it=chQueue().find(x=>x.k===b.dataset.k&&x.id===b.dataset.id);if(!it)return;
  if(it.ref){ACT.cmGo({dataset:{cmp:it.pid,cmr:it.ref}});return}
  const [m,k,s]=it.go;if(me()&&!allowed(m,k)){toast('หน้านี้ไม่ได้เปิดให้ชื่อผู้ใช้งานนี้');return}S.mode=m;S.ctab=k;S.sub[k]=s;render();window.scrollTo(0,0)};
// approve or turn down: the PR / claim / quote steps here, the rest through the pages' own buttons (same checks and questions)
ACT.chAp=b=>{const it=chQueue().find(x=>x.k===b.dataset.k&&x.id===b.dataset.id);if(!it){toast('รายการนี้ไม่ต้องอนุมัติแล้ว');CH.rej='';chDraw();return}
  const ok=!!b.dataset.ok,wi=$('#chPop [data-chwhy]'),why=!ok&&wi?wi.value.trim():'',u=me(),C=CO(),fake=d=>({dataset:Object.assign({id:it.id},d||{})});let done=false;
  if(it.ref){const p=it.pid?DB.projects[it.pid]:null,L=it.k==='quote'?C.quotes:it.k==='pr'?p.prs:p.bills,d=(L||[]).find(x=>x.id===it.id);
    if(d){d.appr=d.appr||{};d.appr[it.i]={ok,by:u?u.name:'ผู้ดูแลระบบ',at:today()};if(why)d.appr[it.i].why=why;save();render();toast(ok?'อนุมัติแล้ว':'บันทึกไม่อนุมัติแล้ว');done=true}}
  else{const R={leave:[C.leave,ok?'lvOk':'lvNo'],ot:[C.otReq,ok?'otOk':'otNo'],claim:[C.claims,ok?'clOk':'clNo'],pc:[C.pc,'pcSet']}[it.k],rec=(R[0]||[]).find(x=>x.id===it.id);
    if(rec){ACT[R[1]](fake(it.k==='pc'?{k:ok?'ok':'no'}:null));done=rec.status!=='pend';if(done&&why)rec.why=why}}
  if(!done)return;CH.rej='';
  if(CH.apN!==false){const me2=cmMe(),t=`${ok?'✅ อนุมัติ':'❌ ไม่อนุมัติ'} ${chApTitle(it)}${it.ref&&it.i!=null?` (${APPR[it.k][it.i][0]})`:''}${!it.ref?' · '+it.det:''}${why?'\nเหตุผล: '+why:''}`;
    let room='';if(it.k==='pr'||it.k==='bill')room='p:'+it.pid;else if(it.who&&it.who!==me2)room=chDm(me2,it.who);
    if(room){chPost(room,t,it.ref?{p:it.pid,ref:it.ref}:null);toast((ok?'อนุมัติแล้ว':'บันทึกไม่อนุมัติแล้ว')+(room[0]==='p'?' · แจ้งในห้องโครงการแล้ว':' · แจ้ง '+chFirst(it.who)+' ทางแชทแล้ว'))}}
  chBadge();chDraw()};

document.head.insertAdjacentHTML('beforeend',`<style>
.ch-fab{position:fixed;right:22px;bottom:22px;width:60px;height:60px;border-radius:50%;border:0;background:#1e2a36;color:#34d3a0;display:grid;place-items:center;box-shadow:0 8px 24px rgba(0,0,0,.3);z-index:880;cursor:pointer;transition:transform .15s}
.ch-fab:hover{transform:scale(1.06)}.ch-fab[aria-expanded="true"]{background:#2f7f88;color:#fff}
.ch-fab .ch-n{position:absolute;top:-3px;right:-3px;background:#e5484d;color:#fff;border-radius:999px;min-width:22px;height:22px;padding:0 5px;font-size:12px;font-weight:700;display:grid;place-items:center;box-shadow:0 0 0 2px var(--bg,#fff)}
.ch-pop{position:fixed;right:22px;bottom:94px;width:400px;max-width:calc(100vw - 24px);height:min(660px,calc(100vh - 120px));display:flex;flex-direction:column;background:var(--surface);color:var(--ink);border:1px solid var(--line);border-radius:20px;box-shadow:0 18px 50px rgba(0,0,0,.28);overflow:hidden;z-index:890}
.ch-pop[hidden]{display:none}
.pin-lock .ch-fab,.pin-lock .ch-pop{display:none!important}
#view{padding-bottom:84px}/* the last rows are not left under the button */
@media print{.ch-fab,.ch-pop{display:none!important}}
.ch-hd{background:linear-gradient(120deg,#2f7f88,#4a6fa5);color:#fff;padding:20px 20px 22px;position:relative;flex:none}
.ch-hd small{font-size:15px;opacity:.95}.ch-hd h3{margin:6px 0 0;font-size:21px;line-height:1.35}
.ch-x{position:absolute;right:12px;top:12px;width:30px;height:30px;border-radius:50%;border:0;background:rgba(255,255,255,.2);color:#fff;font:inherit;cursor:pointer}
.ch-rh .ch-x{position:static;flex:none}
.ch-bd{padding:12px 14px 16px;display:flex;flex-direction:column;gap:2px;overflow:auto;flex:1}
.ch-h{font-size:13.5px;font-weight:700;margin:12px 0 4px}
.ch-tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(96px,1fr));gap:8px;margin-bottom:8px}
.ch-t{border:1px solid var(--line);background:var(--sunk);color:inherit;font:inherit;border-radius:14px;padding:11px 6px;display:flex;flex-direction:column;align-items:center;gap:4px;cursor:pointer;position:relative}
.ch-t b{font-size:13px}.ch-t small{color:var(--muted);font-size:11.5px}.ch-t svg{color:var(--accent)}.ch-t.on{border-color:var(--accent);background:var(--accent-soft)}
.ch-t i,.ch-rm i{font-style:normal;background:#e5484d;color:#fff;border-radius:999px;min-width:19px;height:19px;padding:0 5px;font-size:11px;font-weight:700;display:grid;place-items:center}.ch-t i{position:absolute;top:6px;right:8px}
.ch-rm i.at{background:var(--accent)}
.ch-q{display:flex;align-items:center;border:1px solid var(--line-2);border-radius:12px;padding:0 10px;margin:4px 0}.ch-q input{flex:1;border:0;background:none;font:inherit;padding:9px 2px;color:inherit;outline:none;min-width:0}
.ch-all{align-self:flex-start;margin-top:4px}
.ch-r{display:flex;gap:10px;align-items:center;padding:8px 6px;border:0;border-bottom:1px solid var(--line);background:none;color:inherit;font:inherit;text-align:left;width:100%;cursor:pointer;border-radius:8px}
.ch-r:hover{background:var(--sunk)}.ch-r .cm-av,.ch-r .ch-di{width:38px;height:38px}
.ch-rt{flex:1;min-width:0;display:flex;flex-direction:column}.ch-rt b{font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ch-rt small{color:var(--muted);font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ch-r.new .ch-rt small{color:var(--ink);font-weight:600}
.ch-rm{display:flex;flex-direction:column;align-items:flex-end;gap:4px;font-size:11.5px;color:var(--muted);flex:none}
.ch-priv{margin-top:10px}
.ch-warn{margin:8px 12px 4px;padding:8px 10px;border-radius:10px;background:var(--warn-soft,#fff4e0);color:var(--ink);font-size:12.5px;line-height:1.5}.ch-warn .btn{margin-left:4px}
.ch-bd .ch-warn{margin:0 0 8px}
.ch-st{display:block;text-align:right;font-size:11px;color:var(--muted);margin-top:2px}.ch-st.rd{color:#3F8C96;font-weight:600}.ch-st.wait{color:#d08a2b}
.ch-foot{display:flex;flex-wrap:wrap;justify-content:center;gap:4px 16px;margin-top:12px}.ch-foot .ch-netb{margin:2px 0}.ch-nask{display:flex;flex-wrap:wrap;align-items:center;gap:6px}
.ch-netb{display:block;margin:14px auto 2px;background:none;border:0;color:var(--muted);font-size:12.5px;cursor:pointer;text-decoration:underline}
.ch-net{border:1px solid var(--line);border-radius:12px;padding:4px 12px;margin-bottom:10px}.ch-nr{display:flex;justify-content:space-between;gap:10px;padding:7px 0;border-bottom:1px solid var(--line);font-size:13px}.ch-nr:last-child{border:0}.ch-nr span{color:var(--muted)}.ch-nr b{text-align:right}
.ch-ok{margin:8px 0;padding:8px 10px;border-radius:10px;background:rgba(63,140,150,.14);font-size:12.5px;line-height:1.5}
.ch-bd>.btn{width:100%;margin:2px 0 6px}
.ch-rh{display:flex;align-items:center;gap:10px;padding:10px 12px;background:linear-gradient(120deg,#2f7f88,#4a6fa5);color:#fff;flex:none}
.ch-rh>div{display:flex;flex-direction:column;flex:1;min-width:0}.ch-rh b{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ch-rh small{opacity:.88;font-size:12px}
.ch-bk{border:0;background:none;color:#fff;font-size:26px;line-height:1;padding:0 6px;cursor:pointer}
.ch-rh .cm-av{box-shadow:0 0 0 2px rgba(255,255,255,.5)}
.cm-av.ch-logo{background:#fff;padding:0;overflow:hidden}.ch-logo img{width:100%;height:100%;object-fit:contain;display:block}
.ch-msgs{flex:1;overflow:auto;background:var(--sunk);padding:10px 12px 14px;display:flex;flex-direction:column;gap:8px}
.ch-old{align-self:center}.ch-empty{color:var(--muted);font-size:13px;text-align:center;margin:auto 10px;line-height:1.6}
.ch-day{text-align:center;margin:4px 0}.ch-day span{background:var(--surface);border:1px solid var(--line);border-radius:999px;padding:1px 10px;font-size:11.5px;color:var(--muted)}
.ch-m{display:flex;gap:8px;max-width:86%;align-items:flex-start}.ch-m.cont{margin-top:-4px}.ch-m.me{align-self:flex-end;flex-direction:row-reverse}
.ch-m .cm-av{width:30px;height:30px;font-size:12.5px}.cm-av.ph{visibility:hidden}
.ch-mb{display:flex;flex-direction:column;align-items:flex-start;gap:4px;min-width:0;position:relative}.ch-m.me .ch-mb{align-items:flex-end}
.ch-mh{font-size:12px}.ch-mh small{color:var(--muted)}
.ch-bb{background:var(--surface);border:1px solid var(--line);border-radius:4px 14px 14px 14px;padding:7px 11px;line-height:1.5;font-size:14px;overflow-wrap:anywhere}
.ch-m.me .ch-bb{background:#2f7f88;color:#fff;border-color:transparent;border-radius:14px 4px 14px 14px}.ch-m.me .cm-at{background:rgba(255,255,255,.22);color:#fff}
.ch-m.atme .ch-bb{border-color:var(--accent);box-shadow:0 0 0 2px var(--accent-soft)}
.ch-ph{display:flex;gap:5px;flex-wrap:wrap}.ch-ph button{border:0;padding:0;background:var(--line);border-radius:10px;overflow:hidden;width:96px;height:72px;cursor:zoom-in}.ch-ph img{width:100%;height:100%;object-fit:cover;display:block}
.ch-ph button.wait::after{content:'…';display:grid;place-items:center;height:100%;color:var(--muted)}
.ch-doc{display:flex;gap:9px;align-items:center;background:var(--surface);border:1px solid var(--line-2);border-radius:12px;padding:7px 11px;font:inherit;color:inherit;text-align:left;cursor:pointer;max-width:100%}
.ch-doc:hover{border-color:var(--accent)}.ch-doc>span:last-child{display:flex;flex-direction:column;min-width:0}.ch-doc b{font-size:13px}.ch-doc small{color:var(--muted);font-size:11.5px}.ch-doc.gone{color:var(--muted);font-size:12px;cursor:default}
.ch-di{flex:none;width:32px;height:32px;border-radius:9px;color:#fff;display:grid;place-items:center;font-weight:700;font-size:11px}
.ch-del{position:absolute;top:0;right:100%;margin-right:4px;border:0;background:none;color:var(--muted);opacity:0;cursor:pointer;font-size:12px}.ch-m:hover .ch-del,.ch-del:focus{opacity:.8}
@media (pointer:coarse){.ch-del{opacity:.5}}
.ch-ft{border-top:1px solid var(--line);padding:8px 10px;flex:none;background:var(--surface)}
.ch-row{display:flex;gap:6px;align-items:flex-end}
.ch-ib{flex:none;width:36px;height:36px;border-radius:50%;display:grid;place-items:center;color:var(--accent);border:1px solid var(--line-2);background:var(--surface);cursor:pointer}
.ch-ib.send{background:#2f7f88;color:#fff;border:0}
.ch-box{flex:1;min-width:0}.ch-ta{min-height:36px!important;height:36px;max-height:120px;border-radius:18px!important;padding:7px 14px!important;resize:none!important;line-height:1.45;overflow-y:hidden}
.ch-chip{display:inline-flex;align-items:center;gap:6px;background:var(--accent-soft);border-radius:999px;padding:3px 6px 3px 12px;font-size:12.5px;margin:0 0 6px}
.ch-apbar{display:flex;align-items:center;gap:10px;width:100%;border:1px solid var(--accent);background:var(--accent-soft);color:inherit;font:inherit;text-align:left;border-radius:14px;padding:10px 12px;margin-bottom:10px;cursor:pointer}
.ch-apbar i{font-style:normal;background:#e5484d;color:#fff;border-radius:999px;min-width:22px;height:22px;padding:0 6px;font-size:12px;font-weight:700;display:grid;place-items:center}.ch-apbar>span:last-child{font-size:20px;color:var(--muted)}
.ch-apic{background:#2f9e6b!important;font-size:16px}.ch-rh .ch-apic{width:38px;height:38px;border-radius:50%;box-shadow:0 0 0 2px rgba(255,255,255,.5)}
.ch-ap{border:1px solid var(--line);border-radius:14px;padding:10px 12px;margin-bottom:8px;background:var(--surface)}.ch-ap.rej{border-color:var(--danger,#c0564b)}
.ch-apt{display:flex;gap:10px;align-items:center}.ch-apm{font-weight:700;white-space:nowrap;font-size:13.5px}
.ch-apd{margin:6px 0 0 46px;font-size:12.5px;color:var(--muted);line-height:1.5}
.ch-apb{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}.ch-ap .ch-apb{margin-left:46px}
.ch-why{margin:8px 0 0 46px}.ch-why input{width:100%;box-sizing:border-box}.ch-why .ch-apb{margin-left:0}
.ch-apn{display:flex;gap:8px;align-items:center;font-size:12.5px;color:var(--muted);margin:2px 0 10px}.ch-apn input{width:auto}
.ch-dwrap{display:flex;flex-direction:column;align-items:flex-start;gap:2px;border-left:3px solid #2f9e6b;padding-left:8px}.ch-apw{font-size:11.5px;color:#2f9e6b;font-weight:600;margin-top:4px}.ch-dwrap .ch-apb{margin-top:2px}
.ch-ps{display:flex;flex-direction:column;gap:4px;font-size:12.5px;color:var(--muted);margin-bottom:6px}
@media (max-width:640px){.ch-fab{right:14px;bottom:14px;width:56px;height:56px}.ch-pop{right:8px;left:8px;width:auto;max-width:none;bottom:80px;height:calc(100vh - 96px);height:calc(100dvh - 96px)}}
</style>`);
if(typeof I18N==='object'&&I18N.en&&I18N.en.x)Object.assign(I18N.en.x,{'แชท':'Chat','คุยกับทีมงานในบริษัท':'Talk with your team','ห้องบริษัท':'Company room','ห้องโครงการ':'Project rooms','คุยส่วนตัว':'Direct chat','เลือกคน':'Pick someone',
  'ล่าสุด':'Recent','ห้องอื่น':'Other rooms','ห้องแชท':'Rooms','‹ ห้องทั้งหมด':'‹ All rooms','คุยส่วนตัวกับ':'Chat with','ดูข้อความเก่ากว่า':'Show older messages','แนบเอกสารจากระบบ':'Attach a document',
  'เลือกเอกสาร คนในห้องกดเปิดได้ทันที':'Pick a document; people in the room can open it','ส่งรูป':'Send photo','ส่ง':'Send','ยังไม่มีข้อความ':'No messages yet','รูปภาพ':'Photo',
  'ค้นหาห้องหรือข้อความ':'Search rooms or messages','ค้นหาชื่อคน':'Search people','พิมพ์ข้อความ… @ เรียกคน':'Type a message… @ to mention','ตั้งที่เก็บข้อมูลกลาง':'Set up shared storage','เปิดโฟลเดอร์':'Open folder',
  'บริษัทนี้ยังเก็บข้อมูลไว้ในเครื่องนี้เท่านั้น ข้อความจะยังไม่ถึงคนอื่น':'This company keeps its data on this device only; messages will not reach others yet',
  'ข้อความส่วนตัวแสดงเฉพาะสองคนในแอป แต่ยังเก็บอยู่ในที่เก็บข้อมูลของบริษัท อย่าส่งรหัสผ่านหรือข้อมูลลับทางนี้':'Direct messages show only to the two of you in the app, but they are stored in the company\'s storage. Do not send passwords or secrets here.',
  'เข้าระบบด้วยชื่อของคุณก่อน จึงจะใช้แชทได้':'Sign in with your name to use chat','รอคุณอนุมัติ':'Waiting for your approval','กดอนุมัติได้ในแชทเลย ไม่ต้องเปิดหน้าเอกสาร':'Approve right here, no need to open the page',
  '✓ อนุมัติ':'✓ Approve','ไม่อนุมัติ':'Reject','เปิดดู':'Open','ยืนยันไม่อนุมัติ':'Confirm reject','ยกเลิก':'Cancel','เหตุผลที่ไม่อนุมัติ (ไม่บังคับ)':'Reason (optional)','แจ้งผลในแชทให้คนที่เกี่ยวข้องรู้ด้วย':'Tell the people involved in the chat','ไม่มีเอกสารรอคุณอนุมัติ 🎉':'Nothing waits for your approval 🎉','ไม่มีรายการค้าง':'Nothing pending',
  'ต้องเปิดโฟลเดอร์ข้อมูลอีกครั้งจึงจะรับส่งข้อความได้':'Open the data folder again to send and receive messages','หน้าตัวอย่าง ข้อความอยู่ในเครื่องนี้เท่านั้น':'Sample page: messages stay on this device',
  'คุยส่วนตัว · ':'Direct · ','ลบข้อความนี้':'Delete this message','กดเพื่อเปิดเอกสาร':'Click to open','เอกสารนี้ถูกลบแล้ว':'This document was deleted','โครงการนี้ยังไม่มีเอกสาร':'This project has no documents yet','ใบเสนอราคา':'Quotations','วันนี้':'Today','เมื่อวาน':'Yesterday','📷 รูปภาพ':'📷 Photo','ไม่มีโครงการที่เปิดอยู่':'No open projects','ไม่พบชื่อนี้':'No one by that name','ไม่พบห้องที่ค้นหา':'No room found'});

