/* PENUM รหัสเชื่อมโครงการ (project link code): PENUM MEP, PM and BIM pass a project's data to each other across computers.
   tools/build-pages.mjs puts this file in the <head> of every app whose app.json has "cloud": true (see docs/apps.md).
   - In the same browser the apps still share localStorage (penum.mep.link and the rest); this is for other computers.
   - Each PENUM MEP project has its own code (P.lid), 20 characters of Crockford base32 shown as XXXXX-XXXXX-XXXXX-XXXXX.
     A PM project or a BIM project that is given the code reads that MEP project's data, wherever MEP was used.
   - The data goes to ORIEN's Supabase (tools/link-setup.sql, run once) in slots: 'mep' = what MEP writes to penum.mep.link.
     A row is found by the first 16 bytes of sha256('penum-link:' + code) and encrypted (AES-GCM) with sha256('penum-link-key:' + code),
     so only someone who has the code can find or read it; ORIEN cannot. Anyone with the code may also overwrite it.
   window.penumLink: make() a new code · norm(text) the code in a text (a pasted code or a link with #mep=) or '' · show(code)
   put(code, slot, obj) → {at} or {err} · get(code, slot) → {data, at} or null (none yet) or {err} · at([codes]) → {code: {slot: at}} or {err}
   err: 'offline' (no internet or Supabase down), 'nosql' (ORIEN has not run tools/link-setup.sql yet), 'big' (over 3 MB encrypted),
   'full' (the table reached 200 MB, so no new projects), 'bad'. */
(()=>{if(window.penumLink)return;
const SB={url:'https://uejnlxwjqsadbnzdncvb.supabase.co',key:'sb_publishable_0GTUfFnwBuWxjMw7yYULtQ_mhVVhcez'};
const A='0123456789ABCDEFGHJKMNPQRSTVWXYZ',SLOTS=['mep','bim','hand'],MAX=3e6;
const te=new TextEncoder(),td=new TextDecoder();
const sha=async s=>new Uint8Array(await crypto.subtle.digest('SHA-256',te.encode(s)));
const hex=u=>[...u].map(b=>b.toString(16).padStart(2,'0')).join('');
const b64u=u=>{let s='';for(let i=0;i<u.length;i+=0x8000)s+=String.fromCharCode.apply(null,u.subarray(i,i+0x8000));return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')};
const ub64=s=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
function make(){const r=crypto.getRandomValues(new Uint8Array(20));return [...r].map(b=>A[b&31]).join('')}
// the code in what someone pasted: the code itself (any case, spaces or dashes, O for 0, I or L for 1) or a link carrying #mep=…
function norm(s){s=String(s||'');const m=/[#&?](?:mep|link)=([0-9A-Za-z-]+)/.exec(s);if(m)s=m[1];
  const c=s.toUpperCase().replace(/O/g,'0').replace(/[IL]/g,'1').replace(/[^0-9A-Z]/g,'');return c.length===20&&[...c].every(x=>A.includes(x))?c:''}
const show=c=>(c=norm(c))?c.match(/.{5}/g).join('-'):'';
const ids=async c=>({k:hex((await sha('penum-link:'+c)).slice(0,16)),key:await crypto.subtle.importKey('raw',await sha('penum-link-key:'+c),'AES-GCM',false,['encrypt','decrypt'])});
// gzip when the browser can (the first byte says which), then AES-GCM
async function gzip(u){return new Uint8Array(await new Response(new Blob([u]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer())}
async function unzip(u){return new Uint8Array(await new Response(new Blob([u]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer())}
async function rpc(fn,body){let r;try{r=await fetch(SB.url+'/rest/v1/rpc/'+fn,{method:'POST',cache:'no-store',headers:{apikey:SB.key,'Content-Type':'application/json'},body:JSON.stringify(body)})}catch(e){return {err:'offline'}}
  if(r.ok){try{return {j:await r.json()}}catch(e){return {err:'bad'}}}
  let t='';try{t=await r.text()}catch(e){}if(r.status===404||/PGRST202|does not exist|Could not find the function/i.test(t))return {err:'nosql'};
  return {err:/"full"|\bfull\b/.test(t)?'full':r.status===413||/too long|too large/i.test(t)?'big':r.status>=500?'offline':'bad'}}
async function put(code,slot,obj){const c=norm(code);if(!c||!SLOTS.includes(slot))return {err:'bad'};
  try{const {k,key}=await ids(c),raw=te.encode(JSON.stringify(obj)),z=!!window.CompressionStream,body=z?await gzip(raw):raw,pt=new Uint8Array(body.length+1);pt[0]=z?1:0;pt.set(body,1);
    const iv=crypto.getRandomValues(new Uint8Array(12)),ct=b64u(new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},key,pt)));if(ct.length>MAX)return {err:'big'};
    const r=await rpc('penum_link_put',{p_k:k,p_s:slot,p_iv:b64u(iv),p_ct:ct});return r.err?r:{at:String(r.j||'')}}catch(e){return {err:'bad'}}}
async function get(code,slot){const c=norm(code);if(!c||!SLOTS.includes(slot))return {err:'bad'};
  try{const {k,key}=await ids(c),r=await rpc('penum_link_get',{p_k:k,p_s:slot});if(r.err)return r;const e=r.j;if(!e||!e.ct)return null;
    const pt=new Uint8Array(await crypto.subtle.decrypt({name:'AES-GCM',iv:ub64(e.iv)},key,ub64(e.ct))),body=pt.subarray(1);
    return {data:JSON.parse(td.decode(pt[0]===1?await unzip(body):body)),at:String(e.at||'')}}catch(e){return {err:'bad'}}}
// when each slot of these codes last changed, so the apps fetch a project again only when it is newer
async function at(codes){const C=[...new Set((codes||[]).map(norm).filter(Boolean))].slice(0,30);if(!C.length)return {};
  try{const ks=await Promise.all(C.map(async c=>(await ids(c)).k)),r=await rpc('penum_link_at',{p_k:ks});if(r.err)return r;const o={},j=r.j||{};C.forEach((c,i)=>{if(j[ks[i]])o[c]=j[ks[i]]});return o}catch(e){return {err:'bad'}}}
// a link that opens an app with the code: …/penum/pm/#mep=XXXXX-…
const url=(app,code)=>new URL('../'+app+'/#mep='+show(code),location.href).href;
// the program is read-only or waits for a licence code (shared/licence.js): it keeps its data to itself
const locked=()=>{try{const s=window.penumLic&&window.penumLic.state();return !!s&&(s.st==='ro'||s.st==='none')}catch(e){return false}};
window.penumLink={make,norm,show,put,get,at,url,locked};
})();
