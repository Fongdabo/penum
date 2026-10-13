/* ---------- 3.16: choose the language (ไทย / English) ----------
   The screens are written in Thai. For another language the text on screen is swapped as it appears, from a dictionary
   (I18N, in 98r48a.js, generated from the app's own strings): exact strings, and patterns where a number or name sits
   inside a sentence ("รวม {0} ใบ"). What people type (names, notes, BOQ items) is not in the dictionary and stays as typed.
   Printed documents keep Thai, the official version. More languages = one more dictionary in I18N and one entry in LANGS.
   The choice is kept per user on this device (and per device before anyone signs in). */
// [code, name in its own language, html lang]; English ships inside the page, the others load from files/i18n/<code>.json
// languages that have a dictionary in files/i18n (set when a release adds one)
const LSHIP='th en zh zht ja ko vi lo km my ms id fil hi bn ta ne ur ar fr de es pt it nl pl ru tr'.split(' ');
const LANGS=[['th','ภาษาไทย','th','Thai'],['en','English','en','English'],['zh','简体中文','zh-CN','Chinese Simplified'],['zht','繁體中文','zh-TW','Chinese Traditional'],['ja','日本語','ja','Japanese'],['ko','한국어','ko','Korean'],
 ['vi','Tiếng Việt','vi','Vietnamese'],['lo','ລາວ','lo','Lao'],['km','ខ្មែរ','km','Khmer Cambodian'],['my','မြန်မာ','my','Myanmar Burmese'],['ms','Bahasa Melayu','ms','Malay'],['id','Bahasa Indonesia','id','Indonesian'],['fil','Filipino','fil','Filipino Tagalog'],
 ['hi','हिन्दी','hi','Hindi'],['bn','বাংলা','bn','Bengali Bangla'],['ta','தமிழ்','ta','Tamil'],['ne','नेपाली','ne','Nepali'],['ur','اردو','ur','Urdu'],['ar','العربية','ar','Arabic'],
 ['fr','Français','fr','French'],['de','Deutsch','de','German'],['es','Español','es','Spanish'],['pt','Português','pt','Portuguese'],['it','Italiano','it','Italian'],['nl','Nederlands','nl','Dutch'],
 ['pl','Polski','pl','Polish'],['ru','Русский','ru','Russian'],['tr','Türkçe','tr','Turkish']].filter(l=>LSHIP.includes(l[0]));
const LRTL=['ar','ur'];
// round flags drawn in SVG (emoji flags don't show on Windows)
const FLAG={th:'<path fill="#A51931" d="M0 0h20v20H0z"/><path fill="#F4F5F8" d="M0 3.4h20v13.2H0z"/><path fill="#2D2A4A" d="M0 6.7h20v6.6H0z"/>',
 en:'<path fill="#012169" d="M0 0h20v20H0z"/><path stroke="#fff" stroke-width="4" d="M0 0l20 20M20 0L0 20"/><path stroke="#C8102E" stroke-width="1.6" d="M0 0l20 20M20 0L0 20"/><path stroke="#fff" stroke-width="6" d="M10 0v20M0 10h20"/><path stroke="#C8102E" stroke-width="3.4" d="M10 0v20M0 10h20"/>',
 ja:'<path fill="#fff" d="M0 0h20v20H0z"/><circle cx="10" cy="10" r="5" fill="#BC002D"/>',
 zh:'<path fill="#DE2910" d="M0 0h20v20H0z"/><path fill="#FFDE00" d="M6 3.2l1.1 3.3h3.4l-2.8 2 1.1 3.3L6 9.8l-2.8 2 1.1-3.3-2.8-2h3.4z"/>',
 zht:'<path fill="#B31B1B" d="M0 0h20v20H0z"/><text x="10" y="14.4" font-size="12" text-anchor="middle" fill="#fff" font-family="sans-serif" font-weight="700">繁</text>',
 ko:'<path fill="#fff" d="M0 0h20v20H0z"/><path fill="#CD2E3A" d="M5.5 10a4.5 4.5 0 0 1 9 0z"/><path fill="#0047A0" d="M5.5 10a4.5 4.5 0 0 0 9 0z"/><circle cx="7.75" cy="10" r="2.25" fill="#CD2E3A"/><circle cx="12.25" cy="10" r="2.25" fill="#0047A0"/>',
 vi:'<path fill="#DA251D" d="M0 0h20v20H0z"/><path fill="#FF0" d="M10 4.5l1.3 4h4.2l-3.4 2.5 1.3 4-3.4-2.5-3.4 2.5 1.3-4-3.4-2.5h4.2z"/>',
 my:'<path fill="#FECB00" d="M0 0h20v6.7H0z"/><path fill="#34B233" d="M0 6.7h20v6.6H0z"/><path fill="#EA2839" d="M0 13.3h20V20H0z"/><path fill="#fff" d="M10 4.6l1.3 4h4.2l-3.4 2.5 1.3 4L10 12.6l-3.4 2.5 1.3-4-3.4-2.5h4.2z"/>',
 lo:'<path fill="#CE1126" d="M0 0h20v20H0z"/><path fill="#002868" d="M0 5h20v10H0z"/><circle cx="10" cy="10" r="3.2" fill="#fff"/>',
 ms:'<path fill="#fff" d="M0 0h20v20H0z"/><path fill="#CC0001" d="M0 0h20v2.5H0zM0 5h20v2.5H0zM0 10h20v2.5H0zM0 15h20v2.5H0z"/><path fill="#010066" d="M0 0h11v11.25H0z"/><path fill="#FC0" d="M5.4 2.3a3.4 3.4 0 1 0 0 6.6 2.7 2.7 0 1 1 0-6.6z"/><path fill="#FC0" d="M8.4 3.6l.5 1.3 1.3-.4-.8 1.1 1.1.8-1.3.1.1 1.4-.9-1-.9 1 .1-1.4-1.3-.1 1.1-.8-.8-1.1 1.3.4z"/>',
 id:'<path fill="#fff" d="M0 0h20v20H0z"/><path fill="#CE1126" d="M0 0h20v10H0z"/>',
 fil:'<path fill="#0038A8" d="M0 0h20v10H0z"/><path fill="#CE1126" d="M0 10h20v10H0z"/><path fill="#fff" d="M0 0l11 10L0 20z"/><circle cx="4" cy="10" r="1.8" fill="#FCD116"/>',
 hi:'<path fill="#FF9933" d="M0 0h20v6.7H0z"/><path fill="#fff" d="M0 6.7h20v6.6H0z"/><path fill="#138808" d="M0 13.3h20V20H0z"/><circle cx="10" cy="10" r="2.6" fill="none" stroke="#000080" stroke-width=".7"/><circle cx="10" cy="10" r=".6" fill="#000080"/>',
 bn:'<path fill="#006A4E" d="M0 0h20v20H0z"/><circle cx="9" cy="10" r="5" fill="#F42A41"/>',
 ta:'<path fill="#FF9933" d="M0 0h20v6.7H0z"/><path fill="#fff" d="M0 6.7h20v6.6H0z"/><path fill="#138808" d="M0 13.3h20V20H0z"/><circle cx="10" cy="10" r="2.6" fill="none" stroke="#000080" stroke-width=".7"/><circle cx="10" cy="10" r=".6" fill="#000080"/>',
 ne:'<path fill="#fff" d="M0 0h20v20H0z"/><path fill="#003893" d="M3 1l13 8.2H7.6L16 19H3z"/><path fill="#DC143C" d="M4 3l9.3 5.4H5.8L13.3 18H4z"/><circle cx="7" cy="7.3" r="1.2" fill="#fff"/><circle cx="7" cy="13.8" r="1.5" fill="#fff"/>',
 ur:'<path fill="#01411C" d="M0 0h20v20H0z"/><path fill="#fff" d="M0 0h5v20H0z"/><circle cx="12.5" cy="10" r="4.6" fill="#fff"/><circle cx="13.8" cy="8.9" r="4" fill="#01411C"/><path fill="#fff" d="M15.6 6.2l.4 1.2 1.3-.2-1 .8.5 1.2-1.1-.7-1 .8.3-1.2-1.1-.7 1.3-.1z"/>',
 ar:'<path fill="#006C35" d="M0 0h20v20H0z"/><path fill="#fff" d="M5 8.2h10v.9H5zM5 13.2h9.4l.6-.8H5z"/><path fill="#fff" d="M6 6.4h1v1.2H6zm2.2 0h1v1.2h-1zm2.2 0h1v1.2h-1zm2.2 0h1v1.2h-1z"/>',
 fr:'<path fill="#fff" d="M0 0h20v20H0z"/><path fill="#002395" d="M0 0h6.7v20H0z"/><path fill="#ED2939" d="M13.3 0H20v20h-6.7z"/>',
 de:'<path fill="#000" d="M0 0h20v6.7H0z"/><path fill="#DD0000" d="M0 6.7h20v6.6H0z"/><path fill="#FFCE00" d="M0 13.3h20V20H0z"/>',
 es:'<path fill="#AA151B" d="M0 0h20v20H0z"/><path fill="#F1BF00" d="M0 5h20v10H0z"/>',
 pt:'<path fill="#FF0000" d="M0 0h20v20H0z"/><path fill="#006600" d="M0 0h8v20H0z"/><circle cx="8" cy="10" r="3" fill="#FFCC00"/><circle cx="8" cy="10" r="1.8" fill="#fff" stroke="#FF0000" stroke-width=".6"/>',
 it:'<path fill="#fff" d="M0 0h20v20H0z"/><path fill="#009246" d="M0 0h6.7v20H0z"/><path fill="#CE2B37" d="M13.3 0H20v20h-6.7z"/>',
 nl:'<path fill="#AE1C28" d="M0 0h20v6.7H0z"/><path fill="#fff" d="M0 6.7h20v6.6H0z"/><path fill="#21468B" d="M0 13.3h20V20H0z"/>',
 pl:'<path fill="#fff" d="M0 0h20v10H0z"/><path fill="#DC143C" d="M0 10h20v10H0z"/>',
 ru:'<path fill="#fff" d="M0 0h20v6.7H0z"/><path fill="#0039A6" d="M0 6.7h20v6.6H0z"/><path fill="#D52B1E" d="M0 13.3h20V20H0z"/>',
 tr:'<path fill="#E30A17" d="M0 0h20v20H0z"/><circle cx="8.5" cy="10" r="4.2" fill="#fff"/><circle cx="9.6" cy="10" r="3.4" fill="#E30A17"/><path fill="#fff" d="M13 8l.5 1.4h1.5l-1.2.9.5 1.5-1.3-.9-1.2.9.4-1.5-1.2-.9h1.5z"/>',
 km:'<path fill="#032EA1" d="M0 0h20v20H0z"/><path fill="#E00025" d="M0 5h20v10H0z"/><path fill="#fff" d="M6 13h8v-1.2h-.8V9.6h-.8V8.2h-.7V6.8H8.3v1.4h-.7v1.4h-.8v2.2H6z"/>'};
const flag=k=>`<svg class="flag" viewBox="0 0 20 20" aria-hidden="true"><clipPath id="fc-${k}"><circle cx="10" cy="10" r="10"/></clipPath><g clip-path="url(#fc-${k})">${FLAG[k]||''}</g></svg>`;
const LKEY='pmLang',THC=/[\u0E00-\u0E7F]/;
const langOf=u=>{try{return (u&&localStorage.getItem(LKEY+':'+u))||localStorage.getItem(LKEY)||'th'}catch(e){return 'th'}};
const meKey=()=>{try{const a=JSON.parse(localStorage.getItem(typeof AKEY!=='undefined'?AKEY:'')||'null');return a&&a.id!=null&&a.id!==undefined?(a.id||'admin'):''}catch(e){return ''}};
let LANG=langOf(meKey());if(!LANGS.some(l=>l[0]===LANG))LANG='th';
const LD=()=>(typeof I18N!=='undefined'&&I18N[LANG])||null;
// patterns: "a {0} b" -> regex, bucketed by the first two letters of the text (or the last two when it starts with {0})
let LPAT=null;
function lpat(){if(LPAT)return LPAT;const D=LD();LPAT={pre:new Map(),suf:new Map(),any:[]};if(!D||!D.p)return LPAT;
  for(const [k,v] of Object.entries(D.p)){const parts=k.split(/\{(\d+)\}/),ord=[];let re='^';
    const glue=[];parts.forEach((s,i)=>{if(i%2){ord.push(+s);glue.push(/[\u0E00-\u0E7F]$/.test(parts[i-1])||/^[\u0E00-\u0E7F]/.test(parts[i+1]||''));re+='(.*?)'}else re+=s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replace(/ /g,'\\s*')});
    if(parts.filter((x,i)=>!(i%2)).join('').replace(/[^\u0E00-\u0E7F]/g,'').length<2)continue;
    const o={re:new RegExp(re+'$','sd'),ord,glue,v,len:k.length};const p0=parts[0].trim(),pz=parts[parts.length-1].trim();
    if(p0.length>=2){const b=p0.slice(0,2);(LPAT.pre.get(b)||LPAT.pre.set(b,[]).get(b)).push(o)}
    else if(pz.length>=2){const b=pz.slice(-2);(LPAT.suf.get(b)||LPAT.suf.set(b,[]).get(b)).push(o)}else LPAT.any.push(o)}
  for(const m of [LPAT.pre,LPAT.suf])for(const L of m.values())L.sort((a,b)=>b.len-a.len);return LPAT}
const LMEMO=new Map();
function trS(s){const D=LD();if(!D||!s||!THC.test(s))return s;const k=s.replace(/\s+/g,' ').trim();if(!k)return s;
  if(LMEMO.has(k)){const r=LMEMO.get(k);return r==null?s:s.replace(k.length===s.length?s:s.trim(),r)}
  let r=trK(k,D,0);LMEMO.set(k,r);if(LMEMO.size>20000)LMEMO.clear();if(r==null)return s;
  const m=s.match(/^(\s*)[\s\S]*?(\s*)$/);return m[1]+r+m[2]}
const TMA=['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'],TMF=['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
const EMA=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],EMF=['January','February','March','April','May','June','July','August','September','October','November','December'];
const TDRE=new RegExp('(\\d{1,2}\\s)?('+[...TMF,...TMA].map(x=>x.replace(/\./g,'\\.')).join('|')+')(\\s(\\d{4}|\\d{2}))?(?![\\u0E00-\\u0E7F])','g');
const ceY=y=>{y=+y;return y<100?y+2500-543:y>2400?y-543:y};
function dateFix(k){return k.replace(TDRE,(a,d,m,_,y)=>{let i=TMA.indexOf(m),full=i<0;if(full)i=TMF.indexOf(m);return `${d||''}${(full?EMF:EMA)[i]}${y?' '+ceY(y):''}`})}
const TWD={'อา.':'Sun','จ.':'Mon','อ.':'Tue','พ.':'Wed','พฤ.':'Thu','ศ.':'Fri','ส.':'Sat'};
function trK(k,D,depth){if(D.x[k]!=null)return D.x[k];if(depth>3)return null;
  {const f=dateFix(k);if(f!==k){if(!THC.test(f))return f;const r=trK(f,D,depth+1);if(r!=null)return r}}
  {const w=k.match(/^(อา|จ|อ|พฤ|พ|ศ|ส)\.(\s[^\u0E00-\u0E7F]*)?$/);if(w)return TWD[w[1]+'.']+(w[2]||'')}
  const P=lpat(),C=[...(P.pre.get(k.slice(0,2))||[]),...(P.suf.get(k.slice(-2))||[]),...P.any];
  let part=null;pm:for(const o of C){const m=k.match(o.re);if(!m)continue;let v=o.v;part=0;
    for(let i=0;i<o.ord.length;i++){const c=m[i+1];let t=c;if(THC.test(c)){const [x0,x1]=m.indices[i+1];const cc=c.trim();if(o.glue[i]||THC.test(k[x0-1]||'')||THC.test(k[x1]||'')){if(cc.length<3||D.x[cc]==null)continue pm;t=D.x[cc]}else t=trK(cc,D,depth+1);if(t==null){if(depth||!/^\s*\S/.test(c))continue pm;t=c;part=1}}v=v.split('{'+o.ord[i]+'}').join(t)}if(!part)return v;part=v;break}
  // a line made of parts joined by · or › : translate each part
  for(const sep of [' · ',' › ',' / ',' - ',', ']){if(k.includes(sep)){const parts=k.split(sep),T=parts.map(p=>THC.test(p)?trK(p.trim(),D,depth+1):p);if(T.some(x=>x!=null))return T.map((x,i)=>x==null?parts[i]:x).join(sep)}}
  const mm=k.match(/^(.*?)\s*\(([^()]*)\)$/);if(mm){const a=trK(mm[1],D,depth+1),b=THC.test(mm[2])?trK(mm[2],D,depth+1):mm[2];if(a!=null)return `${a} (${b??mm[2]})`}
  const c=k.replace(/[:：]$/,'');if(c!==k&&D.x[c]!=null)return D.x[c]+':';
  if(typeof part==='string')return part;
  // library items written "English (ไทย)": keep the English
  if(/[A-Za-z]{3}/.test(k)){const z=k.replace(/\s*\([^()]*[\u0E00-\u0E7F][^()]*\)/g,'');if(z!==k&&z.trim()&&!THC.test(z))return z.trim()}
  return null}
const LATTR=['placeholder','title','aria-label','alt'];
const skipEl=e=>!e||e.closest&&e.closest('#print,script,style,textarea,[contenteditable],.notr');
function trNode(root){if(LANG==='th'||!root)return;
  if(root.nodeType===3){if(!skipEl(root.parentElement)){const v=root.nodeValue,t=trS(v);if(t!==v)root.nodeValue=t}return}
  if(root.nodeType!==1||skipEl(root))return;
  const W=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>THC.test(n.nodeValue)&&!skipEl(n.parentElement)?1:2});const L=[];while(W.nextNode())L.push(W.currentNode);
  L.forEach(n=>{const v=n.nodeValue,t=trS(v);if(t!==v)n.nodeValue=t});
  const E=[root,...root.querySelectorAll('[placeholder],[title],[aria-label],[alt],input[type=button],input[type=submit]')];
  E.forEach(e=>{if(skipEl(e))return;LATTR.forEach(a=>{const v=e.getAttribute&&e.getAttribute(a);if(v&&THC.test(v)){const t=trS(v);if(t!==v)e.setAttribute(a,t)}})})}
// other languages: their dictionary comes from a file; the page shows Thai for a moment, then switches
if(LANG!=='th'&&!(typeof I18N!=='undefined'&&I18N[LANG])){fetch('files/i18n/'+LANG+'.json').then(r=>r.ok?r.json():null).then(d=>{if(!d)return;I18N[LANG]=d;LPAT=null;LMEMO.clear();
  trNode(document.body);const t=document.title;if(THC.test(t))document.title=trS(t)}).catch(()=>{})}
if(LANG!=='th'){document.documentElement.lang=(LANGS.find(l=>l[0]===LANG)||[])[2]||LANG;if(LRTL.includes(LANG))document.documentElement.dir='rtl';
  const mo=new MutationObserver(ms=>{for(const m of ms){if(m.type==='characterData')trNode(m.target);else if(m.type==='attributes')trNode(m.target.nodeType===1?m.target:null);else m.addedNodes.forEach(trNode)}});
  const go=()=>{trNode(document.body);mo.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:LATTR})};
  if(document.body)go();else document.addEventListener('DOMContentLoaded',go);
  for(const f of ['alert','confirm','prompt']){const o=window[f].bind(window);window[f]=(m,...a)=>o(trS(String(m??'')),...a)}
  {const t=document.title;if(THC.test(t))document.title=trS(t)}}
// switching reloads the page so every screen, including the parts drawn once at start, comes up in the new language
function setLang(k,who){try{localStorage.setItem(LKEY,k);const u=who!==undefined?who:meKey();if(u)localStorage.setItem(LKEY+':'+u,k)}catch(e){}
  if(k!==LANG){if(typeof save==='function')try{save(true)}catch(e){}location.reload()}}
ACT.lang=b=>setLang(b.dataset.k);
document.addEventListener('input',e=>{if(!e.target.classList||!e.target.classList.contains('lg-q'))return;const q=e.target.value.trim().toLowerCase();
  e.target.parentNode.querySelectorAll('[data-a="lang"]').forEach(b=>b.hidden=!!q&&!b.dataset.q.includes(q))});
document.addEventListener('toggle',e=>{if(e.target.id==='langSw'&&e.target.open){const q=e.target.querySelector('.lg-q');if(q&&matchMedia('(pointer:fine)').matches)q.focus()}},true);
document.addEventListener('click',e=>{const m=document.getElementById('langSw');if(m&&m.open&&!m.contains(e.target))m.open=false});
// one language menu, at the far right of the top bar (also on the sign-in screen); picking one switches the whole program
const LWORD={th:'ภาษา',en:'Language',ja:'言語',zh:'语言',zht:'語言',ko:'언어',vi:'Ngôn ngữ',my:'ဘာသာစကား',lo:'ພາສາ',km:'ភាសា',ms:'Bahasa',id:'Bahasa',fil:'Wika',hi:'भाषा',bn:'ভাষা',ta:'மொழி',ne:'भाषा',ur:'زبان',ar:'اللغة',fr:'Langue',de:'Sprache',es:'Idioma',pt:'Idioma',it:'Lingua',nl:'Taal',pl:'Język',ru:'Язык',tr:'Dil'};
const langSw=()=>{const c=LANGS.find(l=>l[0]===LANG)||LANGS[0];return `<details class="more lang-dd notr" id="langSw"><summary class="bbtn" aria-label="ภาษา / Language">${flag(c[0])}<span class="lg-t"><small>${LWORD[LANG]||'Language'}</small><b>${c[1]}</b></span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></summary>
  <div class="menu" role="menu">${LANGS.length>8?`<input type="search" class="lg-q" placeholder="ค้นหา / Search" aria-label="Search language">`:''}${LANGS.map(([k,l,h,e])=>`<button type="button" role="menuitemradio" aria-checked="${k===LANG}" lang="${h}" data-a="lang" data-k="${k}" data-q="${(l+' '+e+' '+k).toLowerCase()}">${flag(k)}<span>${l}</span>${k===LANG?'<svg class="ck" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" aria-hidden="true"><path d="m5 12 5 5 9-10"/></svg>':''}</button>`).join('')}</div></details>`};
{const put=()=>{const m=document.getElementById('moreMenu');if(m&&!document.getElementById('langSw'))m.insertAdjacentHTML('afterend',langSw())};put();
  const r=render;render=function(){const x=r.apply(this,arguments);put();return x}}
// after signing in, use that person's own choice
{const f=ACT.pinIn;ACT.pinIn=async(...a)=>{const r=await f(...a);const u=meKey();if(u){let want=null;try{want=localStorage.getItem(LKEY+':'+u)}catch(e){}if(want&&want!==LANG)setLang(want,u);else if(!want)try{localStorage.setItem(LKEY+':'+u,LANG)}catch(e){}}return r}}
document.head.insertAdjacentHTML('beforeend',`<style>
.lang-dd summary{gap:8px;padding:5px 10px 5px 6px}.lang-dd .flag{width:22px;height:22px;border-radius:50%;flex:none;box-shadow:0 0 0 1px rgba(0,0,0,.12)}
.lang-dd .lg-t{display:flex;flex-direction:column;line-height:1.1;text-align:left}.lang-dd .lg-t small{font-size:10.5px;opacity:.8}.lang-dd .lg-t b{font-size:13px;font-weight:600}
.lang-dd .menu{min-width:240px;max-height:min(420px,70vh);overflow:auto}
.lang-dd .menu button{display:flex;align-items:center;gap:10px;width:100%}.lang-dd .menu button span{flex:1}.lang-dd .menu .ck{color:var(--accent)}
.lang-dd .lg-q{width:100%;margin:0 0 6px;padding:7px 10px;border:1px solid var(--line);border-radius:8px;background:var(--card);color:var(--ink);font:inherit}
.lang-dd .menu button[hidden]{display:none}
.lang-dd .menu button[aria-checked="true"]{font-weight:600;background:var(--sunk)}
@media (max-width:640px){.lang-dd .lg-t small{display:none}.lang-dd .menu{left:0;right:auto}}
</style>`);
