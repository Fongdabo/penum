/* ---------- 4.66 ราคากลางชุดเริ่มต้น: a starter set of MEP reference prices built into the คลังราคากลาง ----------
   The rows are shared/gov-prices.js (window.PENUM_GOV_PRICES, also in MEP and BIM): about 160 lines of material and labour per unit,
   PENUM's estimates for Bangkok in October 2569 laid out like the Commerce Ministry material prices and the CGD labour list ว 480,
   since the government sites could not be read when the set was made. One button (เติมราคา, or the empty library) loads them as
   sk 'est' (ประมาณการ): a new line, a sample line or an earlier starter line takes the price; a line holding a price of the company's
   own stays as it is and keeps the estimate only to compare (เทียบราคาทุกแหล่ง). Any real price put in later replaces an estimate,
   whatever its date (960 plMerge newer, shared/prices.js keepNewer). */
PL_SK.est=['ประมาณการ','warn'];
if(!PL_ORD.includes('est'))PL_ORD.splice(PL_ORD.indexOf('demo'),0,'est');
const govSet=()=>window.PENUM_GOV_PRICES&&Array.isArray(window.PENUM_GOV_PRICES.rows)?window.PENUM_GOV_PRICES:null;
const govRows=()=>{const S=govSet();return S?S.rows.map(([k,g,name,unit,m,l,r])=>({key:'gov:'+k,g,name,unit,m,l,date:S.date,src:S.name[0]+' · '+(S.ref[r]||S.ref.m)[0]})):[]};
// the line already in the library for a row: the same key, or the same name, unit and brand (as plMerge finds it)
function govFind(r){const L=plCfg(),u=plKey(r.unit||''),k=plKey(r.name);
  return L.find(i=>i.key&&i.key===r.key)||L.find(i=>plKey(i.name)===k&&(!u||!i.unit||plKey(i.unit)===u)&&!plKey(i.br||''))||null}
ACT.plGov=()=>{const R=govRows();if(!R.length){toast('ไม่พบราคากลางชุดเริ่มต้นในโปรแกรมนี้');return}
  const soft=x=>!x||x.sk==='demo'||x.sk==='est',go=R.filter(r=>soft(govFind(r))),keep=R.filter(r=>!soft(govFind(r)));
  const a=plMerge(go,{sk:'est',g:'oth'}),b=keep.length?plMerge(keep,{sk:'est',offer:1,noAdd:1}):{add:0,upd:0,same:0,off:0};
  $('#dlg').open&&$('#dlg').close();plSay({add:a.add,upd:a.upd,same:a.same,off:b.off},'ราคากลางชุดเริ่มต้น')};
const govNote=()=>{const S=govSet();return S?`${S.rows.length} รายการ งานไฟฟ้า สุขาภิบาล ดับเพลิง แจ้งเหตุเพลิงไหม้ สื่อสาร ท่อน้ำยา ท่อลม น้ำเย็น และเครื่องปรับอากาศ ค่าวัสดุและค่าแรงต่อหน่วย ไม่รวม VAT ราคาวันที่ ${thD(S.date)}`+
  (S.est?` · <b>เป็นราคาประมาณการตามรูปแบบราคาวัสดุกระทรวงพาณิชย์และบัญชีค่าแรงกรมบัญชีกลาง ว 480 ยังไม่ใช่ตัวเลขทางการ</b> ใช้เริ่มต้นได้ ก่อนยื่นงานราชการให้วางบัญชีจริงทับ`:'')+
  ` · ไม่ทับราคาที่บริษัทมีอยู่แล้ว (เก็บไว้เทียบแทน)`:''};

// เติมราคา: the starter set is the first choice
{const f=plFillDlg;plFillDlg=function(){const r=f.apply(this,arguments),bd=$('#dlg .bd');if(bd&&govSet()&&!bd.querySelector('[data-a="plGov"]'))
  bd.insertAdjacentHTML('afterbegin',`<div class="card" style="margin:0 0 8px;padding:10px 12px"><div class="row" style="justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap"><div style="flex:1;min-width:220px"><b>ราคากลางชุดเริ่มต้น (มีในโปรแกรม)</b> <span class="pill warn">ประมาณการ</span><br><small class="muted">${govNote()}</small></div><button type="button" class="btn sm pri" data-a="plGov">ใส่ราคากลางชุดเริ่มต้น</button></div></div>`);return r}}
// an empty library: start from the starter set
{const f=plView;plView=function(){const h=f.apply(this,arguments);if(!govSet()||plCfg().length)return h;
  return h.replace('<button type="button" class="btn pri" data-a="plSeed">',`<button type="button" class="btn pri" data-a="plGov" title="${esc(govNote().replace(/<[^>]+>/g,''))}">ใส่ราคากลางชุดเริ่มต้น ${govSet().rows.length} รายการ (ประมาณการ)</button><button type="button" class="btn" data-a="plSeed">`).replace('เริ่มได้ 3 ทาง','เริ่มได้ 4 ทาง')}}

if(typeof I18N==='object'&&I18N.en&&I18N.en.x)Object.assign(I18N.en.x,{
  'ประมาณการ':'Estimate','ราคากลางชุดเริ่มต้น (มีในโปรแกรม)':'Starter reference prices (built in)','ใส่ราคากลางชุดเริ่มต้น':'Load the starter reference prices',
  'เริ่มได้ 4 ทาง':'Four ways to start','ยังเป็นราคาสมมติ / ประมาณการ':'Assumed / estimated prices'});
