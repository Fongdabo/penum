/* ---------- 4.99.49 what each Rev. changed (user, 2026-11-19, on QT-021's history where Rev.1 and Rev.2 both said only
   "ก่อนรับงานสดรอบใหม่": "เพิ่มอธิบายการรีไวด้วยดีไหม")
   The เหตุ column of ประวัติการแก้ไข (Rev.) gets a line under the reason saying what changed from the Rev. before it: lines and sections
   added or cut, lines edited, the extra rows under the total (ค่าขนส่ง, ค่าแรงวันหยุด, …), markup and discount, and the heading fields.
   It is worked out from the copies kept in Q.revs, so Revs. kept before this version are explained too. The header line says what was
   edited since the last Rev., and ✎ on a row writes or changes that Rev.'s own note (the quote's figures are not touched). */
const qrr=(()=>{
  const nm=i=>[i.type,i.desc].filter(Boolean).join(' ').replace(/\s+/g,' ').trim();
  const cut=(s,k)=>{s=String(s||'').replace(/\s+/g,' ').trim();return s.length>k?s.slice(0,k-1)+'…':s};
  const few=(a,k,w)=>a.slice(0,k).map(s=>w?s:cut(s,40)).join(', ')+(a.length>k?` และอีก ${a.length-k}`:'');
  const pr=(o,i)=>['m','l','sp'].some(k=>n(o[k])!==n(i[k]));
  const lines=Q=>(Q.items||[]).filter(i=>!i.hs);
  const pc=v=>fmt(n(v),2).replace(/\.00$/,'').replace(/(\.\d)0$/,'$1'),sv=v=>v==null?'':typeof v==='object'?JSON.stringify(v):String(v);
  const addV=a=>a?(a.pct!==''&&a.pct!=null&&n(a.pct)?pc(a.pct)+'%':pc(a.amt)):'';
  const HEAD={title:'ชื่องาน',cust:'ลูกค้า',site:'สถานที่',ref:'อ้างอิง',no:'เลขที่',date:'วันที่',valid:'ยืนราคา',terms:'เงื่อนไข',note:'หมายเหตุ',sow:'ขอบเขตงาน',pname:'ชื่อโครงการ'};
  const MK={mk:'Markup',mkM:'Markup ของ',mkL:'Markup ค่าแรง'};
  // A and B are quote objects (a Rev.'s copy or the quote itself); the answer is a list of short Thai phrases
  function diff(A,B){const out=[],IA=lines(A),IB=lines(B),byId={},used=new Set(),pair=[];
    IA.forEach(i=>byId[i.id]=i);
    const left=IB.filter(i=>{const o=byId[i.id];if(o&&!used.has(o.id)){used.add(o.id);pair.push([o,i]);return false}return true});
    // a line copied in again by a new import has a new id: the same section and wording still counts as the same line
    const byNm={};IA.filter(i=>!used.has(i.id)).forEach(i=>{const k=(i.g||'')+'|'+nm(i);(byNm[k]=byNm[k]||[]).push(i)});
    const added=left.filter(i=>{const L=byNm[(i.g||'')+'|'+nm(i)];if(L&&L.length){const o=L.shift();used.add(o.id);pair.push([o,i]);return false}return true});
    const gone=IA.filter(i=>!used.has(i.id));
    const ch=pair.filter(([o,i])=>nm(o)!==nm(i)||n(o.q)!==n(i.q)||(o.unit||'')!==(i.unit||'')||pr(o,i));
    // sections: a section no longer there (or new) is named instead of its lines
    const gA=[...new Set(IA.map(i=>i.g||''))],gB=[...new Set(IB.map(i=>i.g||''))],gOut=gA.filter(g=>g&&!gB.includes(g)),gIn=gB.filter(g=>g&&!gA.includes(g));
    const delLoose=gone.filter(i=>!gOut.includes(i.g||'')),addLoose=added.filter(i=>!gIn.includes(i.g||''));
    if(gOut.length)out.push(`ตัดหมวด ${gOut.length} หมวด (${gone.length-delLoose.length} รายการ): ${few(gOut,3)}`);
    if(delLoose.length)out.push(`ตัดออก ${delLoose.length} รายการ: ${few(delLoose.map(nm),3)}`);
    if(gIn.length)out.push(`หมวดใหม่ ${gIn.length} หมวด (${added.length-addLoose.length} รายการ): ${few(gIn,3)}`);
    if(addLoose.length)out.push(`เพิ่ม ${addLoose.length} รายการ: ${few(addLoose.map(nm),3)}`);
    if(ch.length){const q=ch.filter(([o,i])=>n(o.q)!==n(i.q)).length,p=ch.filter(([o,i])=>pr(o,i)).length,w=ch.filter(([o,i])=>nm(o)!==nm(i)).length;
      out.push(`แก้ ${ch.length} รายการ (`+[q&&`จำนวน ${q}`,p&&`ราคา ${p}`,w&&`ข้อความ ${w}`].filter(Boolean).join(', ')+`): ${few(ch.map(([o,i])=>nm(i)),2)}`)}
    // the rows under the total, matched by id and then by name
    const AA=(A.adds||[]).slice(),AB=B.adds||[],am=[];
    const aLeft=AB.filter(a=>{let k=AA.findIndex(x=>x.id===a.id);if(k<0)k=AA.findIndex(x=>(x.name||'').trim()===(a.name||'').trim());if(k<0)return true;am.push([AA[k],a]);AA.splice(k,1);return false});
    if(AA.length)out.push(`ตัดรายการบวกท้ายใบ: ${few(AA.map(a=>`${cut(a.name,48)} ${addV(a)}`),3,1)}`);
    if(aLeft.length)out.push(`เพิ่มรายการบวกท้ายใบ: ${few(aLeft.map(a=>`${cut(a.name,48)} ${addV(a)}`),3,1)}`);
    am.filter(([o,a])=>addV(o)!==addV(a)).forEach(([o,a])=>out.push(`${cut(a.name,40)} ${addV(o)} → ${addV(a)}`));
    Object.keys(MK).forEach(k=>{if(A[k]!==undefined||B[k]!==undefined){if(n(A[k])!==n(B[k]))out.push(`${MK[k]} ${pc(A[k])}% → ${pc(B[k])}%`)}});
    if(n(A.disc)!==n(B.disc))out.push(`ส่วนลด ${pc(A.disc)} → ${pc(B.disc)}`);
    const hd=Object.keys(HEAD).filter(k=>sv(A[k])!==sv(B[k]));
    if(hd.length)out.push('แก้หัวใบ/เงื่อนไข: '+hd.map(k=>HEAD[k]).join(', '));
    return out}
  const memo=new Map();
  // what Rev. r changed from the Rev. before it in the list
  function ofRev(Q,r,p){const k=r.id+'|'+(p?p.id:'');if(memo.has(k))return memo.get(k);let t='';
    try{if(!r.snap)t='';else if(!p||!p.snap){const I=lines(r.snap);t=`ฉบับแรก · ${I.length} รายการ ใน ${new Set(I.map(i=>i.g||'')).size} หมวด`}
      else{const d=diff(qrvObj(Q,p),qrvObj(Q,r));t=d.length?d.join('\n'):'รายการและราคาเหมือนรอบก่อน'}}catch(e){t=''}
    memo.set(k,t);return t}
  // what was edited since the last Rev. (the quote as it is now); not kept, the quote changes all the time
  function sinceLast(Q){const L=qrvLast(Q);if(!L||!L.snap)return '';try{return diff(qrvObj(Q,L),Q).join('\n')}catch(e){return ''}}
  return {diff,ofRev,sinceLast}})();
if(typeof qrvCard==='function'){const f=qrvCard;qrvCard=function(Q){let h=f.apply(this,arguments);if(!h||!Q||!(Q.revs||[]).length)return h;
  const R=Q.revs,can=typeof sfCan!=='function'||sfCan(Q.id);
  // rows are newest first, as qrvCard draws them: Rev. R[j] is compared with R[j-1]
  R.slice().reverse().forEach((r,j,all)=>{const p=all[j+1],t=qrr.ofRev(Q,r,p),pb=`data-a="qrvPrint" data-id="${Q.id}" data-r="${r.id}"`,k=h.indexOf(pb);if(k<0)return;
    // the เหตุ cell is the 4th cell of that row: put the explanation at its end
    const s=h.lastIndexOf('<tr>',k),cells=[];let x=s;for(let c=0;c<4;c++){x=h.indexOf('<td',x+1);cells.push(x)}const e=h.indexOf('</td>',cells[3]);if(s<0||e<0||e>k)return;
    const ed=can?` <button type="button" class="qrr-ed" data-a="qrrNote" data-id="${Q.id}" data-r="${r.id}" title="เขียนหรือแก้หมายเหตุของ Rev. นี้">✎</button>`:'';
    h=h.slice(0,e)+ed+(t?`<div class="qrr">${esc(t)}</div>`:'')+h.slice(e)});
  const cur=qrvCur(Q);if(cur.dirty){const t=qrr.sinceLast(Q),k=h.indexOf('</h2>');if(t&&k>0)h=h.slice(0,k+5)+`<div class="qrr qrr-now"><b>สิ่งที่แก้หลัง Rev.${qrvLast(Q).n} (ยังไม่เก็บ):</b>\n${esc(t)}</div>`+h.slice(k+5)}
  return h}}
ACT.qrrNote=b=>{const Q=CO().quotes.find(q=>q.id===b.dataset.id),r=Q&&(Q.revs||[]).find(x=>x.id===b.dataset.r);if(!r)return;
  if(typeof sfCan==='function'&&!sfCan(Q.id)){toast('แก้ได้เฉพาะฝ่ายขาย ผู้บริหาร หรือผู้ที่ได้รับอนุญาต');return}
  const all=Q.revs,p=all[all.indexOf(r)-1],t=qrr.ofRev(Q,r,p);
  const v=prompt(`หมายเหตุของ Rev.${r.n} (เช่น ตัดตามฟอร์ม PRIME, เพิ่มค่าแรงวันหยุด)${t?`\n\nระบบสรุปให้แล้ว:\n${t.length>400?t.slice(0,399)+'…':t}`:''}`,r.note||'');if(v===null)return;
  r.note=v.trim();save();render();toast(`บันทึกหมายเหตุ Rev.${r.n} แล้ว`)};
document.head.insertAdjacentHTML('beforeend',`<style>.qrv .qrr{font-size:12px;color:var(--muted,#567080);line-height:1.45;margin-top:2px;max-width:600px;white-space:pre-line}
.qrv .qrr-now{max-width:none;margin:0 0 8px;padding:6px 10px;border-radius:8px;background:color-mix(in srgb,#0EA5E9 9%,transparent)}.qrr-ed{border:0;background:none;cursor:pointer;color:var(--muted,#567080);padding:0 4px;font-size:13px}.qrr-ed:hover{color:var(--pri,#0f766e)}
@media print{.qrr-ed{display:none}}</style>`);
if(typeof I18N==='object'&&I18N.en&&I18N.en.x)Object.assign(I18N.en.x,{'ก่อนรับงานสดรอบใหม่':'Kept before a new live copy'});
