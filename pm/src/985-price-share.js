/* ---------- 3.90 คลังราคากลาง round 3: one price list for PENUM PM, MEP and BIM, on every computer of the company ----------
   shared/prices.js keeps the company's list in 'penum.prices' on this device and in the company list in ORIEN's Supabase for the
   other computers (MEP and BIM open it from their menus and edit it there). PENUM PM keeps its fuller list in co.prices (every
   source's price, pins, history) and the two stay one: after each change here PM sends the lines that changed (x.u = when PM and the
   shared list last agreed on the line), and a line edited in MEP, BIM or on another computer comes back into co.prices, the price it
   replaced kept in the line's history and among the prices to compare. Lines taken out here are taken out everywhere: the ids PM had
   at the last exchange are remembered per company on this device ('penum.prices.pm'), so a line PM no longer has was deleted in PM.
   Replaces round 1's one-way plShare. Never from the sample company (?demo=1). */
const plsOn=()=>!!window.penumPrices&&!DEMOPG&&!!DB&&!!DB.co;
const plsCid=()=>{const p=licP();return p?String(p.id||'').replace(/-R\d+$/,'')||String(p.co||''):''};
if(window.penumPrices)penumPrices.attach({app:'pm',code:()=>licP()?DB.co.lic:'',cid:plsCid,co:()=>(DB&&DB.co&&DB.co.name)||'',
  who:()=>{try{const u=me();return u?u.name:''}catch(e){return ''}},off:()=>!plsOn()});
const PLS_F=['g','name','br','unit','m','l','src','sk','date','key'];
const plsV=(x,f)=>f==='m'||f==='l'?String(Math.round(n(x[f])*100)/100):String(x[f]??'').trim();
const plsSame=(x,s)=>PLS_F.every(f=>plsV(x,f)===plsV(s,f));
function plsSeen(ids){let o={};try{o=JSON.parse(localStorage.getItem('penum.prices.pm')||'{}')||{}}catch(e){}const k=plsCid()+DSFX;
  if(ids===undefined)return o[k]?new Set(o[k]):null;o[k]=ids;try{localStorage.setItem('penum.prices.pm',JSON.stringify(o))}catch(e){}}
// the shared list into co.prices: newer lines, new lines, deletions; returns whether anything changed
function plsPull(){if(!plsOn())return false;const L=plCfg(),S=penumPrices.items(),D=penumPrices.deleted(),seen=plsSeen(),by=new Map(L.map(x=>[x.id,x]));let ch=0;
  S.forEach(s=>{const x=by.get(s.id);
    if(x){if(!plsSame(x,s)&&(s.u||0)>(x.u||0)){plOffSeed(x);plHist(x);PLS_F.forEach(f=>{if(s[f]!=null&&s[f]!=='')x[f]=f==='m'||f==='l'?n(s[f]):s[f]});
        if(!PL_GS().includes(x.g))x.g='oth';plOffer(x,s.sk,s.src,s.m,s.l,s.date);if(x.pin)x.pin=plOK(s.sk,s.src);x.u=s.u;ch++}
      else if((s.u||0)>(x.u||0)&&plsSame(x,s))x.u=s.u;return}
    if(seen&&seen.has(s.id))return;          // PM had it and took it out: it goes from the shared list in plsPush
    const it={id:s.id,g:PL_GS().includes(s.g)?s.g:'oth',name:s.name,unit:s.unit||'',m:n(s.m),l:n(s.l),src:s.src||'',sk:s.sk||'hand',date:s.date||today(),u:s.u};
    if(s.br)it.br=s.br;if(s.key)it.key=s.key;plOffer(it,it.sk,it.src,it.m,it.l,it.date);L.push(it);by.set(it.id,it);ch++});
  const gone=new Set(Object.entries(D).filter(([id,u])=>{const x=by.get(id);return x&&(x.u||0)<=u}).map(([id])=>id));
  if(gone.size){CO().prices=L.filter(x=>!gone.has(x.id));ch+=gone.size}
  return ch>0}
// co.prices into the shared list: lines changed here since they last agreed, new lines, lines taken out here
function plsPush(){if(!plsOn())return;const L=plCfg(),S=new Map(penumPrices.items().map(s=>[s.id,s])),seen=plsSeen(),ids=new Set(L.map(x=>x.id));
  const rows=L.filter(x=>{const s=S.get(x.id);return s?!plsSame(x,s)&&(x.u||0)>=(s.u||0):true}).map(x=>Object.assign({id:x.id,u:x.u||0},...PLS_F.map(f=>({[f]:f==='m'||f==='l'?n(x[f]):x[f]??''}))));
  if(rows.length){const r=penumPrices.put(rows,{exact:1});const now=new Map(penumPrices.items().map(s=>[s.id,s]));rows.forEach(rw=>{const x=L.find(i=>i.id===rw.id),s=now.get(rw.id);if(x&&s)x.u=s.u})}
  if(seen)seen.forEach(id=>{if(!ids.has(id)&&S.has(id))penumPrices.remove(id)});
  plsSeen([...ids])}
let plsBusy=0;
plShare=function(){if(!plsOn()||plsBusy)return;plsBusy=1;try{const ch=plsPull();plsPush();if(ch){save();render()}}catch(e){}finally{plsBusy=0}};
if(window.penumPrices)penumPrices.on(why=>{if(why==='device'||why==='cloud')setTimeout(plShare,50)});
if(typeof I18N==='object'&&I18N.en&&I18N.en.x)Object.assign(I18N.en.x,{'ใช้ร่วมกับ PENUM MEP และ BIM ทุกเครื่องของบริษัท':'Shared with PENUM MEP and BIM on every computer of your company'});
// on the library page: whether the list is shared with the company's other computers
const plsLine=()=>{if(!window.penumPrices||DEMOPG)return '';const s=penumPrices.state(),T={ok:'ใช้ร่วมกับ PENUM MEP และ BIM ทุกเครื่องของบริษัท',run:'กำลังอัปเดตกับเครื่องอื่นของบริษัท…',
  nolic:'ใช้ร่วมกับ PENUM MEP และ BIM ในเครื่องนี้ (ส่งให้เครื่องอื่นได้เมื่อใส่รหัสเปิดใช้งานของบริษัท)',offline:'ต่ออินเทอร์เน็ตไม่ได้ ใช้คลังในเครื่องนี้ไปก่อน จะอัปเดตเองเมื่อต่อได้',
  nosql:'ORIEN ยังไม่ได้เปิดระบบรายการของบริษัท ตอนนี้ใช้ร่วมกันได้เฉพาะในเครื่องนี้',bad:'อัปเดตกับเครื่องอื่นไม่สำเร็จ จะลองใหม่เอง'};
  return `<p class="hint" id="plsSt" style="margin:0 0 10px">🔗 ${T[s.st]||T.nolic}${s.at&&s.st==='ok'?' · อัปเดต '+new Date(s.at).toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'}):''}${s.st&&s.st!=='nolic'&&s.st!=='run'?` <button type="button" class="btn ghost sm" data-a="plsSync">อัปเดตตอนนี้</button>`:''}</p>`};
{const f=plView;plView=function(){const h=f.apply(this,arguments),i=h.indexOf('<section class="card"><h2><span>คลังราคากลาง');if(i<0)return h;const j=h.indexOf('</h2>',i);return j<0?h:h.slice(0,j+5)+plsLine()+h.slice(j+5)}}
ACT.plsSync=()=>{if(window.penumPrices)penumPrices.sync()};
if(window.penumPrices)penumPrices.on(why=>{if(why!=='state')return;const e=document.getElementById('plsSt');if(e)e.outerHTML=plsLine()});
