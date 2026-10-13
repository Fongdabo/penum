/* ---------- 3.67 ความเห็นในเอกสารและโครงการ: comments with @mentions and a bell ----------
   A comment is {id, ref, by, at, t, men:[staff ids], rd:{reader: ISO}}. ref says what it is about: 'proj' (the project
   itself) or '<collection>:<id>' (bills, pos, prs, rfis, vos, subm, quotes). Project comments live in P.cmts and the
   company's documents (quotes) in co.cmts, so they travel with the data file and merge by id like every other list
   (folder, OneDrive, cloud). rd sits on the comment, so reading it on one device clears the bell on the others.
   Ordinary chat stays in LINE; this keeps the talk about a document next to the document. */
const CMK={
  bills:{l:'ใบเบิกงวด',coll:p=>p.bills,go:['pj','cost','bill','bill']},
  pos:{l:'ใบสั่งซื้อ',coll:p=>p.pos,go:['pj','buy','po','po'],sub:r=>vName(r.vid)},
  prs:{l:'ใบขอซื้อ',coll:p=>p.prs,go:['pj','buy','pr','pr'],sub:r=>r.note||r.title},
  rfis:{l:'RFI',coll:p=>p.rfis,go:['pj','site','rfi'],sub:r=>r.subject},
  vos:{l:'งานเพิ่มลด',coll:p=>p.vos,go:['pj','site','vo'],sub:r=>r.desc},
  subm:{l:'เอกสารส่งอนุมัติ',coll:p=>p.subm,go:['pj','docs','all'],sub:r=>r.title},
  quotes:{l:'ใบเสนอราคา',co:1,coll:()=>CO().quotes,go:['co','sales','quote','quote'],sub:q=>q.pname||q.title}};
const cmMe=()=>S.me==='__none'?'':S.me||'admin';
const cmName=id=>id==='admin'?'ผู้ดูแลระบบ':staffName(id)||'(ไม่ทราบชื่อ)';
const cmPj=pid=>pid?DB.projects[pid]:null;
const cmList=(pid,make)=>{const o=pid?cmPj(pid):CO();if(!o)return [];if(make&&!Array.isArray(o.cmts))o.cmts=[];return o.cmts||[]};
const cmThread=(pid,ref)=>cmList(pid).filter(c=>c.ref===ref).sort((a,b)=>String(a.at).localeCompare(String(b.at)));
const cmNew=(c,u)=>!!u&&c.by!==u&&!(c.rd&&c.rd[u]);
// what a ref points to: a label for people and where to open it
function cmDoc(pid,ref){const p=cmPj(pid);
  if(ref==='proj')return p?{l:'โครงการ',no:p.name,sub:'',ok:true,go:['pj','dash']}:{ok:false};
  const [k,id]=String(ref).split(':'),K=CMK[k];if(!K)return {ok:false};
  const L=K.co?K.coll():p?withP(p,()=>K.coll(p)):null,d=(L||[]).find(x=>x.id===id);
  return d?{l:K.l,no:d.no||'',sub:String((K.sub&&withP(p||P,()=>K.sub(d)))||'').replace(/\s+/g,' ').slice(0,60),ok:true,go:K.go,id}:{ok:false}}
const cmTitle=D=>D.no&&String(D.no).toUpperCase().startsWith(String(D.l).toUpperCase())?D.no:`${D.l}${D.no?' '+D.no:''}`;
// every comment in the company, with where it lives
function cmAll(){const out=[];Object.values(DB.projects).forEach(p=>(p.cmts||[]).forEach(c=>out.push({c,pid:p.id})));(CO().cmts||[]).forEach(c=>out.push({c,pid:''}));return out}
/* the bell: comments that call you (@), new replies where you took part, and for the administrator every new comment */
function cmNotes(u){u=u||cmMe();if(!u)return [];const all=cmAll(),mine=new Set(all.filter(x=>x.c.by===u).map(x=>x.pid+'|'+x.c.ref));
  return all.filter(({c,pid})=>c.by!==u&&((c.men||[]).includes(u)||mine.has(pid+'|'+c.ref)||u==='admin')&&cmDoc(pid,c.ref).ok)
    .map(x=>Object.assign(x,{why:(x.c.men||[]).includes(u)?'at':mine.has(x.pid+'|'+x.c.ref)?'re':'all',unread:cmNew(x.c,u)}))
    .sort((a,b)=>String(b.c.at).localeCompare(String(a.c.at)))}
const cmUnread=()=>cmNotes().filter(x=>x.unread).length;
const cmPeople=()=>CO().staff.filter(s=>s.active!==false&&s.name).sort((a,b)=>String(a.name).localeCompare(String(b.name),'th'));
function cmWhen(at){const d=new Date(at);if(isNaN(d))return '';const t=d.toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'}),D=iso(d);
  return D===today()?'วันนี้ '+t:D===addD(today(),-1)?'เมื่อวาน '+t:thD(D)+' '+t}
// the round picture: first letter of the name (skipping a leading Thai vowel), a colour that stays the same for that person
function cmAv(id){const nm=cmName(id).replace(/^(ดร\.|นาย|นาง|น\.ส\.|คุณ)\s*/,''),ch=(nm.replace(/^[เแโใไ]/,'')[0]||'?').toUpperCase();let h=0;for(const x of String(id))h=(h*31+x.charCodeAt(0))%360;
  return `<span class="cm-av" style="--h:${h}" aria-hidden="true">${esc(id==='admin'?'A':ch)}</span>`}
// text: @names of people in the company stand out, line breaks kept
function cmText(c){let h=esc(c.t||'');const L=cmPeople().map(s=>esc(s.name)).sort((a,b)=>b.length-a.length);
  if(L.length){const re=new RegExp('@('+L.map(x=>x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')+')','g');h=h.replace(re,'<b class="cm-at">@$1</b>')}
  return h.replace(/\n/g,'<br>')}
const cmIco=`<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.6A8 8 0 1 1 21 12z"/></svg>`;
const CMD={};// unsent text per thread on this screen
const cmKey=(pid,ref)=>(pid||'co')+'|'+ref;
function cmThreadHtml(pid,ref){const L=cmThread(pid,ref),u=cmMe(),may=!!u;
  const items=L.length?L.map(c=>`<li class="cm-it${cmNew(c,u)?' new':''}">${cmAv(c.by)}<div class="cm-b"><div class="cm-h"><b>${esc(cmName(c.by))}</b><small>${esc(cmWhen(c.at))}</small>${cmNew(c,u)?'<span class="pill info">ใหม่</span>':''}
      ${(c.by===u||(u==='admin'))&&may?`<button type="button" class="x cm-del" data-a="cmDel" data-cmp="${pid}" data-id="${c.id}" title="ลบความเห็นนี้" aria-label="ลบความเห็นนี้">✕</button>`:''}</div><div class="cm-t">${cmText(c)}</div></div></li>`).join('')
    :'<li class="cm-none">ยังไม่มีความเห็น เขียนคำถาม สั่งงาน หรือบันทึกการตกลงไว้ที่นี่ แล้วพิมพ์ @ชื่อ เพื่อเรียกคนที่เกี่ยวข้อง</li>';
  return `<div class="cm-wrap" data-cmr="${esc(ref)}" data-cmp="${pid}"><ul class="cm-ul">${items}</ul>
    ${may?`<div class="cm-new"><div class="cm-box"><textarea class="cm-in" rows="2" data-cmr="${esc(ref)}" data-cmp="${pid}" aria-label="เขียนความเห็น" placeholder="${esc(trS('เขียนความเห็น… พิมพ์ @ แล้วเลือกชื่อ เพื่อเรียกคนที่เกี่ยวข้อง'))}">${esc(CMD[cmKey(pid,ref)]||'')}</textarea><div class="cm-pick" role="listbox" hidden></div></div>
    <div class="row cm-bar"><button type="button" class="btn sm" data-a="cmAt">@ เรียกคน</button><span class="hint cm-k">Ctrl + Enter = ส่ง</span><span class="sp"></span><button type="button" class="btn sm pri" data-a="cmPost">ส่งความเห็น</button></div></div>`
    :'<p class="hint">เข้าระบบด้วยชื่อของคุณก่อน จึงจะเขียนความเห็นได้</p>'}</div>`}
function cmCard(pid,ref,head){const n=cmThread(pid,ref).length;
  return `<section class="card cm-card" id="cm-${esc(ref.replace(':','-'))}"><h2><span>${cmIco} ความเห็น${head?' · '+esc(head):''}</span><small>${n?n+' ความเห็น · ':''}พิมพ์ @ชื่อ เพื่อเรียกคนที่เกี่ยวข้อง คนที่ถูกเรียกจะเห็นที่กระดิ่ง</small></h2>${cmThreadHtml(pid,ref)}</section>`}
// the small count next to a document number or in a register row
function cmCount(pid,ref,btn){const L=cmThread(pid,ref),u=cmMe(),nw=L.some(c=>cmNew(c,u));
  if(btn)return `<button type="button" class="btn sm cm-rb${nw?' on':''}" data-a="cmOpen" data-cmp="${pid}" data-cmr="${esc(ref)}" title="ความเห็น" aria-label="ความเห็น ${L.length}">${cmIco}${L.length||''}</button>`;
  return L.length?`<span class="cm-cnt${nw?' on':''}" title="${L.length} ความเห็น">${cmIco}${L.length}</span>`:''}

/* writing, deleting, reading */
function cmMark(pid,ref){const u=cmMe();if(!u)return false;let k=0;const at=new Date().toISOString();
  cmThread(pid,ref).forEach(c=>{if(cmNew(c,u)){c.rd=Object.assign({},c.rd,{[u]:at});k++}});return k>0}
function cmMen(t){return cmPeople().filter(s=>t.includes('@'+s.name)).map(s=>s.id)}
ACT.cmPost=b=>{const w=b.closest('.cm-wrap');if(!w)return;const ta=w.querySelector('.cm-in'),u=cmMe();if(!ta||!u)return;
  const t=ta.value.trim(),pid=w.dataset.cmp,ref=w.dataset.cmr;if(!t){ta.focus();toast('ยังไม่ได้เขียนความเห็น');return}
  if(pid&&!cmPj(pid)){toast('ไม่พบโครงการนี้แล้ว');return}
  const at=new Date().toISOString(),c={id:uid(),ref,by:u,at,t,men:cmMen(t).filter(x=>x!==u),rd:{[u]:at}};
  cmMark(pid,ref);cmList(pid,true).push(c);delete CMD[cmKey(pid,ref)];save();
  const inDlg=!!b.closest('#dlg');render();if(inDlg)cmDlg(pid,ref);
  toast(c.men.length?`ส่งแล้ว แจ้ง ${c.men.map(cmName).join(', ')} ที่กระดิ่ง`:'ส่งความเห็นแล้ว')};
ACT.cmDel=b=>{const pid=b.dataset.cmp,L=cmList(pid),i=L.findIndex(c=>c.id===b.dataset.id),u=cmMe();if(i<0)return;const c=L[i];
  if(c.by!==u&&u!=='admin'){toast('ลบได้เฉพาะความเห็นของตัวเอง');return}if(!confirm('ลบความเห็นนี้?'))return;
  L.splice(i,1);save();const inDlg=!!b.closest('#dlg');render();if(inDlg)cmDlg(pid,c.ref)};
// the thread in a window: for register rows (RFI, VO, submittals) and from the bell
function cmDlg(pid,ref){const D=cmDoc(pid,ref),p=cmPj(pid);if(!D.ok){toast('ไม่พบเอกสารนี้แล้ว');return}
  if(cmMark(pid,ref)){save();cmBell()}
  const d=dialog(`${cmIco} ความเห็น · ${esc(cmTitle(D))}`,`<p class="hint cm-dh">${esc([p&&ref!=='proj'?'โครงการ '+p.name:'',D.sub].filter(Boolean).join(' · '))}</p>${cmThreadHtml(pid,ref)}`,
    `<button type="button" class="btn" data-a="cmGo" data-cmp="${pid}" data-cmr="${esc(ref)}">เปิดเอกสาร</button>`);
  d.classList.add('cm-dlg');const ta=d.querySelector('.cm-in');if(ta&&!matchMedia('(pointer:coarse)').matches)setTimeout(()=>ta.focus(),30);
  const ul=d.querySelector('.cm-ul');if(ul)ul.scrollTop=ul.scrollHeight}
ACT.cmOpen=b=>cmDlg(b.dataset.cmp,b.dataset.cmr);
ACT.cmGo=b=>{const pid=b.dataset.cmp,ref=b.dataset.cmr,D=cmDoc(pid,ref);if(!D.ok){toast('ไม่พบเอกสารนี้แล้ว');return}
  const [m,k,s,sel]=D.go;if(me()&&!allowed(m,k)){toast('หน้านี้ไม่ได้เปิดให้ชื่อผู้ใช้งานนี้');return}
  const d=$('#dlg');if(d.open)d.close();
  if(pid&&DB.projects[pid]&&DB.cur!==pid){DB.cur=pid;P=DB.projects[pid];S.sel={}}
  S.mode=m;if(m==='co')S.ctab=k;else S.tab=k;if(s)S.sub[k]=s;if(sel)S.sel[sel]=D.id;save();render();
  const reg=!sel&&ref!=='proj';const el=document.getElementById('cm-'+ref.replace(':','-'));
  if(el){const hb=document.querySelector('header.band'),hs=hb&&getComputedStyle(hb).position,top=hb&&(hs==='sticky'||hs==='fixed')?hb.getBoundingClientRect().bottom:0;
    scrollTo({top:scrollY+el.getBoundingClientRect().top-top-12,behavior:'smooth'});el.classList.add('flash');setTimeout(()=>el.classList.remove('flash'),1600)}else scrollTo({top:0});
  if(reg)setTimeout(()=>cmDlg(pid,ref),60)};

/* @ picker: type @ and some letters, pick with the mouse, a finger, or arrows + Enter */
let CMP=null;
function cmPick(ta){const box=ta.parentElement.querySelector('.cm-pick');if(!box)return;const v=ta.value,pos=ta.selectionStart,pre=v.slice(0,pos),m=pre.match(/(^|[\s(])@([^\s@]{0,24})$/);
  if(!m){box.hidden=true;CMP=null;return}
  const q=m[2].toLowerCase(),pj=ta.dataset.cmp,L=cmPeople().filter(s=>!q||[s.name,s.code,s.role,s.email].some(x=>String(x||'').toLowerCase().includes(q)))
    .map(s=>{const n=String(s.name||'').toLowerCase().replace(/^(ดร\.|นาย|นางสาว|นาง|น\.ส\.|คุณ)\s*/,'');return [s,!q?0:n.startsWith(q)?0:n.split(/\s+/).some(w=>w.startsWith(q))?1:n.includes(q)?2:3]})
    .sort((a,b)=>a[1]-b[1]||(b[0].proj===pj&&!!pj)-(a[0].proj===pj&&!!pj)).map(x=>x[0]).slice(0,8);// names that start with what was typed, then people on this project
  if(!L.length){box.innerHTML='<div class="cm-pe">ไม่พบชื่อนี้ในรายชื่อพนักงาน</div>';box.hidden=false;CMP={ta,L:[],i:0,at:pos-m[2].length-1};cmPickAt(box);return}
  CMP={ta,L,i:Math.min(CMP&&CMP.ta===ta?CMP.i:0,L.length-1),at:pos-m[2].length-1};cmPickDraw()}
function cmPickDraw(){if(!CMP)return;const box=CMP.ta.parentElement.querySelector('.cm-pick');
  box.innerHTML=`<div class="cm-pt">เรียกใครดี</div>`+CMP.L.map((s,i)=>`<button type="button" role="option" class="cm-po${i===CMP.i?' on':''}" data-a="cmPickGo" data-i="${i}" aria-selected="${i===CMP.i}">${cmAv(s.id)}<span><b>${esc(s.name)}</b><small>${esc([s.role,s.dept].filter(Boolean).join(' · '))}</small></span></button>`).join('');box.hidden=false;cmPickAt(box)}
// the list floats by the text box (fixed, so a window's scrolling area does not cut it off); above it when there is no room below
function cmPickAt(box){const r=CMP.ta.getBoundingClientRect(),H=box.offsetHeight,W=box.offsetWidth,vh=innerHeight;
  box.style.left=Math.max(8,Math.min(r.left+8,innerWidth-W-8))+'px';box.style.top=(r.bottom+H+8>vh&&r.top-H-4>0?r.top-H-4:Math.min(r.bottom+4,vh-H-8))+'px'}
addEventListener('scroll',()=>{if(CMP){const b=CMP.ta.parentElement.querySelector('.cm-pick');if(b&&!b.hidden)cmPickAt(b)}},true);
function cmPickPut(i){if(!CMP||!CMP.L[i])return;const {ta,at}=CMP,s=CMP.L[i],v=ta.value,end=ta.selectionStart,ins='@'+s.name+' ';
  ta.value=v.slice(0,at)+ins+v.slice(end);const p=at+ins.length;ta.focus();ta.setSelectionRange(p,p);
  CMD[cmKey(ta.dataset.cmp,ta.dataset.cmr)]=ta.value;ta.parentElement.querySelector('.cm-pick').hidden=true;CMP=null}
ACT.cmPickGo=b=>cmPickPut(+b.dataset.i);
ACT.cmAt=b=>{const w=b.closest('.cm-wrap'),ta=w&&w.querySelector('.cm-in');if(!ta)return;const v=ta.value,p=ta.selectionStart??v.length,sp=p&&!/\s$/.test(v.slice(0,p))?' ':'';
  ta.value=v.slice(0,p)+sp+'@'+v.slice(p);const q=p+sp.length+1;ta.focus();ta.setSelectionRange(q,q);CMD[cmKey(ta.dataset.cmp,ta.dataset.cmr)]=ta.value;cmPick(ta)};
document.addEventListener('input',e=>{const ta=e.target;if(!(ta.matches&&ta.matches('.cm-in')))return;CMD[cmKey(ta.dataset.cmp,ta.dataset.cmr)]=ta.value;cmPick(ta)});
document.addEventListener('keydown',e=>{const ta=e.target;if(!(ta.matches&&ta.matches('.cm-in')))return;
  if(CMP&&CMP.ta===ta&&CMP.L.length){
    if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();CMP.i=(CMP.i+(e.key==='ArrowDown'?1:CMP.L.length-1))%CMP.L.length;cmPickDraw();return}
    if(e.key==='Enter'||e.key==='Tab'){e.preventDefault();cmPickPut(CMP.i);return}}
  if(e.key==='Escape'&&CMP){e.preventDefault();e.stopPropagation();const b=ta.parentElement.querySelector('.cm-pick');if(b)b.hidden=true;CMP=null;return}
  if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){const w=ta.closest('.cm-wrap');if(!w)return;e.preventDefault();ACT.cmPost(w.querySelector('[data-a="cmPost"]'))}},true);
document.addEventListener('click',e=>{if(CMP&&!e.target.closest('.cm-box,[data-a="cmAt"]')){const b=CMP.ta.parentElement.querySelector('.cm-pick');if(b)b.hidden=true;CMP=null}});
document.addEventListener('selectionchange',()=>{const a=document.activeElement;if(CMP&&a===CMP.ta)cmPick(a)});

/* the bell in the header */
function cmBell(){const b=$('#cmBell');if(!b)return;const k=cmMe()?cmUnread():0,n=b.querySelector('.cm-n');
  n.textContent=k>99?'99+':k;n.hidden=!k;b.classList.toggle('on',k>0);b.title=k?`มี ${k} เรื่องใหม่ในความเห็น`:'การแจ้งเตือน';b.setAttribute('aria-label',b.title)}
ACT.cmBell=()=>{const u=cmMe();
  if(!u){dialog('การแจ้งเตือน','<p class="hint">เข้าระบบด้วยชื่อของคุณก่อน จึงจะเห็นความเห็นที่เรียกคุณ</p>');return}
  const L=cmNotes(u).slice(0,60),why={at:'เรียกคุณ',re:'ตอบในเรื่องที่คุณคุย',all:'ความเห็นใหม่'};
  const body=L.length?`<ul class="cm-nl">${L.map(({c,pid,why:w,unread})=>{const D=cmDoc(pid,c.ref),p=cmPj(pid);
      return `<li><button type="button" class="cm-nt${unread?' new':''}" data-a="cmOpen" data-cmp="${pid}" data-cmr="${esc(c.ref)}">${cmAv(c.by)}<span class="cm-nb"><span class="cm-nh"><b>${esc(cmName(c.by))}</b> <span class="pill ${w==='at'?'info':''}">${why[w]}</span> <small>${esc(cmWhen(c.at))}</small></span>
      <span class="cm-nd">${esc(cmTitle(D))}${p&&c.ref!=='proj'?' · '+esc(p.name):''}</span><span class="cm-ns">${esc(String(c.t||'').replace(/\s+/g,' ').slice(0,140))}</span></span>${unread?'<i class="cm-dot" aria-label="ยังไม่ได้อ่าน"></i>':''}</button></li>`}).join('')}</ul>`
    :`<p class="hint">ยังไม่มีความเห็นที่เรียกคุณ${u==='admin'?' หรือความเห็นใหม่ในบริษัท':''} เมื่อมีคนพิมพ์ @${esc(u==='admin'?'ชื่อ':cmName(u))} ในเอกสารหรือโครงการ จะขึ้นที่นี่</p>`;
  const d=dialog(`การแจ้งเตือน · ${esc(cmName(u))}`,`<p class="hint" style="margin:0 0 8px">${u==='admin'?'ผู้ดูแลระบบเห็นทุกความเห็นใหม่ในบริษัท':'ความเห็นที่มีคนพิมพ์ @ชื่อคุณ และคำตอบในเรื่องที่คุณร่วมคุย'} กดที่รายการเพื่ออ่านและตอบ</p>${body}`,
    L.some(x=>x.unread)?'<button type="button" class="btn" data-a="cmReadAll">อ่านทั้งหมดแล้ว</button>':'');d.classList.add('cm-dlg')};
ACT.cmReadAll=()=>{const u=cmMe(),at=new Date().toISOString();cmNotes(u).filter(x=>x.unread).forEach(({c})=>{c.rd=Object.assign({},c.rd,{[u]:at})});save();render();ACT.cmBell()};
{const put=()=>{if(document.getElementById('cmBell'))return;const a=document.getElementById('helpBtn')||document.getElementById('moreMenu');
  if(a)a.insertAdjacentHTML('beforebegin',`<button type="button" id="cmBell" class="bbtn cm-bell" data-a="cmBell" title="การแจ้งเตือน" aria-label="การแจ้งเตือน"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/></svg><b class="cm-n" hidden>0</b></button>`)};
  const r=render;render=function(){
    // keep a half-written comment and the cursor when the page redraws (another device synced, a field changed)
    const a=document.activeElement,keep=a&&a.matches&&a.matches('#view .cm-in')?{r:a.dataset.cmr,p:a.dataset.cmp,s:a.selectionStart,e:a.selectionEnd}:null;
    const x=r.apply(this,arguments);put();cmBell();
    if(keep){const t=[...document.querySelectorAll('#view .cm-in')].find(el=>el.dataset.cmr===keep.r&&el.dataset.cmp===keep.p);if(t){t.focus();try{t.setSelectionRange(keep.s,keep.e)}catch(e){}}}
    // a thread shown on the page counts as read a moment later
    clearTimeout(cmRT);cmRT=setTimeout(()=>{let k=0;document.querySelectorAll('#view .cm-wrap').forEach(w=>{if(cmMark(w.dataset.cmp,w.dataset.cmr))k++});if(k){save();cmBell()}},2500);
    return x}}
let cmRT=0;

/* where the comment boxes go */
// claims, POs, PRs and quotes: under the open document, and a count next to each number in the list
const cmBadge=(h,k,coll,pid)=>h.replace(new RegExp(`(data-a="sel" data-k="${k}" data-id="([^"]+)"><b>[^<]*</b></button>)`,'g'),(m,a,id)=>a+cmCount(pid,coll+':'+id));
{const f=costBill;costBill=function(){let h=f();const bs=billsSorted(),sel=P.bills.find(b=>b.id===S.sel.bill)||bs[bs.length-1];h=cmBadge(h,'bill','bills',P.id);
  return sel?h+cmCard(P.id,'bills:'+sel.id,'ใบเบิกงวด '+(sel.no||'')):h}}
{const f=buyPO;buyPO=function(){let h=f();const sel=P.pos.find(r=>r.id===S.sel.po)||P.pos[P.pos.length-1];h=cmBadge(h,'po','pos',P.id);
  return sel?h+cmCard(P.id,'pos:'+sel.id,'ใบสั่งซื้อ '+(sel.no||'')):h}}
{const f=buyPR;buyPR=function(){let h=f();const sel=P.prs.find(r=>r.id===S.sel.pr)||P.prs[P.prs.length-1];h=cmBadge(h,'pr','prs',P.id);
  return sel?h+cmCard(P.id,'prs:'+sel.id,'ใบขอซื้อ '+(sel.no||'')):h}}
{const f=salesQuote;salesQuote=function(){let h=f();const C=CO(),sel=C.quotes.find(q=>q.id===S.sel.quote)||C.quotes.slice().reverse()[0];h=cmBadge(h,'quote','quotes','');
  return sel?h+cmCard('','quotes:'+sel.id,'ใบเสนอราคา '+(sel.no||'')):h}}
// registers (RFI, VO, submittals): a comment button on every row opens the thread
const CMTBL={rfis:1,vos:1,subm:1};
{const g=gtable;gtable=function(base,rows,cols,o={}){if(!CMTBL[base]||!P)return g(base,rows,cols,o);
  return g(base,rows,[{h:'ความเห็น',t:'calc',f:r=>cmCount(P.id,base+':'+r.id,true)},...cols],o)}}
// the project overview: the project's own thread and the latest comments on its documents
{const f=VIEWS.dash;VIEWS.dash=()=>{const h=f();if(!P)return h;
  const L=(P.cmts||[]).filter(c=>c.ref!=='proj'&&cmDoc(P.id,c.ref).ok).sort((a,b)=>String(b.at).localeCompare(String(a.at))),u=cmMe(),seen=new Set(),last=[];
  for(const c of L){if(seen.has(c.ref))continue;seen.add(c.ref);last.push(c);if(last.length>=6)break}
  const recent=last.length?`<h3 class="cm-h3">ความเห็นล่าสุดในเอกสารของโครงการนี้</h3><ul class="cm-nl cm-rc">${last.map(c=>{const D=cmDoc(P.id,c.ref),n=cmThread(P.id,c.ref).length;
      return `<li><button type="button" class="cm-nt${cmNew(c,u)?' new':''}" data-a="cmOpen" data-cmp="${P.id}" data-cmr="${esc(c.ref)}">${cmAv(c.by)}<span class="cm-nb"><span class="cm-nh"><b>${esc(cmTitle(D))}</b> <small>${esc(cmName(c.by))} · ${esc(cmWhen(c.at))} · ${n} ความเห็น</small></span><span class="cm-ns">${esc(String(c.t||'').replace(/\s+/g,' ').slice(0,140))}</span></span></button></li>`}).join('')}</ul>`:'';
  const card=cmCard(P.id,'proj','โครงการ '+P.name).replace('</section>',recent+'</section>');
  const k='<section class="card"><h2><span>ข้อมูลโครงการสำหรับ AI</span>';return h.includes(k)?h.replace(k,card+k):h+card}}
if(typeof SBKW==='object'){SBKW['pj.dash']=(SBKW['pj.dash']||'')+' ความเห็น คอมเมนต์ แท็ก @ชื่อ เรียกคน แจ้งเตือน กระดิ่ง comment mention';
  SBKW['pj.cost.bill']=(SBKW['pj.cost.bill']||'')+' ความเห็นใบเบิกงวด คอมเมนต์';SBKW['pj.site.rfi']=(SBKW['pj.site.rfi']||'')+' ความเห็น RFI คอมเมนต์'}
document.head.insertAdjacentHTML('beforeend',`<style>
.cm-bell{position:relative;min-height:34px;padding:6px 9px!important;display:inline-grid!important;place-items:center}
.cm-bell .cm-n{position:absolute;top:-6px;right:-6px;min-width:18px;height:18px;padding:0 5px;border-radius:999px;background:#e5484d;color:#fff;font-size:11px;font-weight:700;line-height:18px;text-align:center;box-shadow:0 0 0 2px var(--band,#3F8C96)}
.cm-bell.on svg{animation:cmRing 1.2s ease 1}@keyframes cmRing{0%,100%{transform:none}20%{transform:rotate(14deg)}40%{transform:rotate(-12deg)}60%{transform:rotate(8deg)}}
.pin-lock #cmBell{display:none!important}
.cm-card h2>span:first-child{display:inline-flex;align-items:center;gap:6px}
.cm-ul{list-style:none;margin:0 0 10px;padding:0;display:flex;flex-direction:column;gap:10px}
.cm-dlg .cm-ul{max-height:52vh;overflow:auto;padding-right:4px}
.cm-it{display:flex;gap:10px;align-items:flex-start}
.cm-it.new .cm-b{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}
.cm-av{flex:none;width:32px;height:32px;border-radius:50%;display:inline-grid;place-items:center;font-weight:700;font-size:14px;color:#fff;background:hsl(var(--h) 55% 46%)}
.cm-b{flex:1;min-width:0;background:var(--sunk);border:1px solid var(--line);border-radius:12px;padding:8px 12px}
.cm-h{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.cm-h small{color:var(--muted)}.cm-h .cm-del{margin-left:auto;opacity:.55}.cm-h .cm-del:hover{opacity:1}
.cm-t{margin-top:3px;line-height:1.6;overflow-wrap:anywhere}
.cm-at{color:var(--accent);background:var(--accent-soft);border-radius:6px;padding:0 4px;font-weight:600}
.cm-none{color:var(--muted);font-size:13.5px;padding:6px 2px}
.cm-box{position:relative}
.cm-in{width:100%;box-sizing:border-box;min-height:64px;resize:vertical;font:inherit;padding:9px 12px;border-radius:10px;border:1px solid var(--line-2);background:var(--surface);color:var(--ink)}
.cm-in:focus{outline:2px solid var(--accent);outline-offset:1px}
.cm-bar{margin-top:6px;gap:8px;align-items:center}.cm-k{margin:0}@media (pointer:coarse){.cm-k{display:none}}
.cm-pick{position:fixed;z-index:1000;max-height:min(320px,60vh);overflow:auto;min-width:260px;max-width:min(360px,90vw);background:var(--surface);border:1px solid var(--line-2);border-radius:12px;box-shadow:var(--shadow-hi,0 10px 30px rgba(0,0,0,.18));padding:6px}
.cm-pt{font-size:12px;color:var(--muted);padding:2px 8px 4px}.cm-pe{font-size:13px;color:var(--muted);padding:8px}
.cm-po{display:flex;gap:10px;align-items:center;width:100%;text-align:left;border:0;background:none;color:inherit;font:inherit;padding:6px 8px;border-radius:8px;cursor:pointer}
.cm-po .cm-av{width:28px;height:28px;font-size:12.5px}.cm-po span{display:flex;flex-direction:column;line-height:1.3}.cm-po small{color:var(--muted);font-size:12px}
.cm-po.on,.cm-po:hover{background:var(--accent-soft)}
.cm-cnt{display:inline-flex;align-items:center;gap:3px;margin-left:4px;font-size:12px;color:var(--muted);vertical-align:middle}.cm-cnt.on{color:var(--accent);font-weight:700}
.cm-rb{display:inline-flex!important;align-items:center;gap:4px}.cm-rb.on{border-color:var(--accent);color:var(--accent);font-weight:700;background:var(--accent-soft)}
.cm-nl{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px}
.cm-nt{display:flex;gap:10px;align-items:flex-start;width:100%;text-align:left;font:inherit;color:inherit;background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:10px 12px;cursor:pointer;position:relative}
.cm-nt:hover{border-color:var(--accent)}.cm-nt.new{background:var(--accent-soft);border-color:transparent}
.cm-nb{display:flex;flex-direction:column;gap:2px;min-width:0;flex:1}.cm-nh small{color:var(--muted)}.cm-nd{font-size:13px;font-weight:600}.cm-ns{font-size:13px;color:var(--muted);overflow-wrap:anywhere}
.cm-dot{position:absolute;top:12px;right:12px;width:9px;height:9px;border-radius:50%;background:#e5484d}
.cm-h3{font-size:14px;margin:14px 0 8px}
.cm-dlg{width:min(680px,96vw)}.cm-dh{margin:0 0 10px}
</style>`);
if(typeof I18N==='object'&&I18N.en&&I18N.en.x)Object.assign(I18N.en.x,{'ความเห็น':'Comments','ส่งความเห็น':'Post comment','@ เรียกคน':'@ Mention','Ctrl + Enter = ส่ง':'Ctrl + Enter = send',
  'ใหม่':'New','เรียกใครดี':'Mention someone','การแจ้งเตือน':'Notifications','อ่านทั้งหมดแล้ว':'Mark all as read','เปิดเอกสาร':'Open document','เรียกคุณ':'Mentioned you',
  'ตอบในเรื่องที่คุณคุย':'Reply in your thread','ความเห็นใหม่':'New comment','ความเห็นล่าสุดในเอกสารของโครงการนี้':'Latest comments on this project\'s documents',
  'ยังไม่มีความเห็น เขียนคำถาม สั่งงาน หรือบันทึกการตกลงไว้ที่นี่ แล้วพิมพ์ @ชื่อ เพื่อเรียกคนที่เกี่ยวข้อง':'No comments yet. Write a question, an instruction or an agreement here, and type @name to call the people involved.',
  'พิมพ์ @ชื่อ เพื่อเรียกคนที่เกี่ยวข้อง คนที่ถูกเรียกจะเห็นที่กระดิ่ง':'Type @name to call someone; they see it under the bell',
  'เขียนความเห็น… พิมพ์ @ แล้วเลือกชื่อ เพื่อเรียกคนที่เกี่ยวข้อง':'Write a comment… type @ and pick a name to call someone',
  'ผู้ดูแลระบบเห็นทุกความเห็นใหม่ในบริษัท':'The administrator sees every new comment in the company','กดที่รายการเพื่ออ่านและตอบ':'Tap an item to read and reply',
  'เข้าระบบด้วยชื่อของคุณก่อน จึงจะเขียนความเห็นได้':'Sign in with your name to write comments','ไม่พบชื่อนี้ในรายชื่อพนักงาน':'No staff member with this name'});

