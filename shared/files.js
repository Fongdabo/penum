/* PENUM บันทึกลงเครื่อง (save to a folder on this computer): each project is its own file in one folder the customer picks once,
   like an ordinary desktop program, so they keep their own backup files.
   tools/build-pages.mjs puts this file in the <head> of every app whose app.json has "files": true (see docs/apps.md).
   - Chrome and Edge on a computer (File System Access): the customer picks a folder once; the app works in a new folder
     PENUM-<APP> inside it (or in the picked folder itself when it already has that name). The folder is remembered in
     IndexedDB 'penum-files', one per app; the browser asks again for permission after it restarts, on a click.
   - A file whose name is taken by another project, or any file the app did not write, is never overwritten, moved or deleted:
     the new file gets " (2)", " (3)"… instead. A file is the app's own when isMine(its text) says so (e.g. the same project id).
   - Phones, Safari and Firefox have no folder access: save() downloads the file instead and openFile() picks one file.
   window.penumFiles: ok (folder access works here) · init(app) · folder(ask) → handle or null · pick() · name() → the folder's name
   save({name, ext, text, isMine}) → {file, dir} or {file, dl: true} (downloaded) or {err: 'cancel'|'denied'|'bad'}
   list(ext) → [{file, at, size}] newest first · read(file) → text · openFile(accept) → {file, text} or null · download(file, text) */
(()=>{if(window.penumFiles)return;
let APP='',H=null;
const ok=typeof window.showDirectoryPicker==='function'&&(()=>{try{return window.self===window.top}catch(e){return false}})();          // a page inside another site's frame may not pick folders
const SUB=()=>'PENUM-'+APP.toUpperCase();
function db(){return new Promise((res,rej)=>{let r;try{r=indexedDB.open('penum-files',1)}catch(e){rej(e);return}
  r.onupgradeneeded=()=>r.result.createObjectStore('h');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
async function kv(v){const d=await db();return new Promise((res,rej)=>{const t=d.transaction('h',v===undefined?'readonly':'readwrite'),s=t.objectStore('h');let q;
  if(v===undefined)q=s.get(APP);else s.put(v,APP);t.oncomplete=()=>{res(q?q.result:undefined);d.close()};t.onerror=()=>{rej(t.error);d.close()}})}
async function allowed(h,ask){let p='prompt';try{p=await h.queryPermission({mode:'readwrite'})}catch(e){}
  if(p!=='granted'&&ask){try{p=await h.requestPermission({mode:'readwrite'})}catch(e){}}return p==='granted'}
// ask = called from a click: may show the folder picker or the permission prompt
async function folder(ask){if(!ok||!APP)return null;
  if(!H){try{H=await kv()||null}catch(e){H=null}}
  if(!H){if(!ask)return null;return pick()}
  return await allowed(H,ask)?H:null}
async function pick(){if(!ok||!APP)return null;let h;try{h=await window.showDirectoryPicker({id:'penum-'+APP,mode:'readwrite',startIn:'documents'})}catch(e){return null}
  if(!await allowed(h,true))return null;
  if(h.name!==SUB()){try{h=await h.getDirectoryHandle(SUB(),{create:true})}catch(e){return null}}          // a new folder of its own; nothing else in the picked folder is touched
  H=h;try{await kv(h)}catch(e){}return h}
const name=()=>H?H.name:'';
const safe=s=>String(s||'').replace(/[\\/:*?"<>|\u0000-\u001f]+/g,' ').replace(/\s+/g,' ').trim().replace(/^\.+/,'').slice(0,80)||'project';
async function textOf(fh){try{return await (await fh.getFile()).text()}catch(e){return null}}
function download(file,text){const b=text instanceof Blob?text:new Blob([text],{type:'application/json'});
  if(window.claude&&window.claude.use)return window.claude.use('downloads').then(d=>d.save({filename:file,data:b})).then(()=>true,()=>false);
  try{const u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=file;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000);return Promise.resolve(true)}catch(e){return Promise.resolve(false)}}
async function save({name:n,ext,text,isMine}){const base=safe(n);
  if(!ok){const f=base+ext;return await download(f,text)?{file:f,dl:true}:{err:'bad'}}
  const d=await folder(true);if(!d)return {err:H?'denied':'cancel'};
  let f='';for(let i=1;i<200&&!f;i++){const c=base+(i>1?` (${i})`:'')+ext;let fh=null;try{fh=await d.getFileHandle(c)}catch(e){f=c;break}
    const t=await textOf(fh);if(t!=null&&isMine&&(()=>{try{return !!isMine(t)}catch(e){return false}})())f=c}          // the same project saved before: write over that file only
  if(!f)return {err:'bad'};
  try{const fh=await d.getFileHandle(f,{create:true}),w=await fh.createWritable();await w.write(text);await w.close();return {file:f,dir:d.name}}catch(e){return {err:'bad'}}}
async function list(ext){const d=await folder(true);if(!d)return null;const out=[];
  try{for await(const [n,h] of d.entries()){if(h.kind!=='file'||!n.toLowerCase().endsWith(ext.toLowerCase()))continue;try{const f=await h.getFile();out.push({file:n,at:f.lastModified,size:f.size})}catch(e){}}}catch(e){return null}
  return out.sort((a,b)=>b.at-a.at)}
async function read(file){const d=await folder(true);if(!d)return null;try{return await textOf(await d.getFileHandle(file))}catch(e){return null}}
function openFile(accept){return new Promise(res=>{const i=document.createElement('input');i.type='file';i.accept=accept||'.json,.txt,application/json';i.style.display='none';
  i.onchange=async()=>{const f=i.files&&i.files[0];i.remove();if(!f){res(null);return}try{res({file:f.name,text:await f.text()})}catch(e){res(null)}};
  document.body.appendChild(i);i.click()})}
window.penumFiles={ok,init:a=>{APP=String(a||'');H=null},folder,pick,name,save,list,read,openFile,download,safe};
})();
