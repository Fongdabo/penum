/* ---------- 4.66 ราคากลางชุดเริ่มต้น: a starter set of MEP reference prices built into the คลังราคากลาง ----------
   The rows are shared/gov-prices.js (window.PENUM_GOV_PRICES, also in MEP and BIM): about 160 lines of material and labour per unit,
   PENUM's estimates for Bangkok in October 2569 laid out like the Commerce Ministry material prices and the CGD labour list ว 480,
   since the government sites could not be read when the set was made. One button (เติมราคา, or the empty library) loads them as
   sk 'est' (ประมาณการ): a new line, a sample line or an earlier starter line takes the price; a line holding a price of the company's
   own stays as it is and keeps the estimate only to compare (เทียบราคาทุกแหล่ง). Any real price put in later replaces an estimate,
   whatever its date (960 plMerge newer, shared/prices.js keepNewer).
   4.68: the user sent ว 480 itself: 120 lines now carry its official labour and load as sk 'offl'; material is still estimated.
   The user also sent the Budget Bureau standard prices (Dec 2568, revision Feb 2569, supplement Apr 2569): 51 whole lines, sk 'bb'.
   And the สนค. material prices for ส่วนกลาง, September 2569: 51 lines take its material price, sk 'gov' (with ว 480 labour) or 'offm'.
   The whole สนค. list is searched in 977-moc-list.js. */
PL_SK.est=['ประมาณการ','warn'];
// 4.68 a line whose labour is the official ว 480 rate (the material is still an estimate)
PL_SK.offl=['ค่าแรง ว 480 · วัสดุประมาณการ','info'];
// 4.68 official on both halves (สนค. material, ว 480 labour), or the material only
PL_SK.gov=['ราคาทางการ สนค. + ว 480','ok'];PL_SK.offm=['ค่าวัสดุ สนค. · ค่าแรงประมาณการ','info'];
if(!PL_ORD.includes('est'))PL_ORD.splice(PL_ORD.indexOf('demo'),0,'offm','offl','est');
if(!PL_ORD.includes('gov'))PL_ORD.splice(PL_ORD.indexOf('moc')+1,0,'gov');
const govSet=()=>window.PENUM_GOV_PRICES&&Array.isArray(window.PENUM_GOV_PRICES.rows)?window.PENUM_GOV_PRICES:null;
// the rows as shared/prices.js reads them (sk 'gov', 'offm', 'offl', 'est' or 'bb', the source line)
const govRows=()=>govSet()&&window.penumPrices&&penumPrices.govRows?penumPrices.govRows():[];
// the line already in the library for a row: the same key, or the same name, unit and brand (as plMerge finds it)
function govFind(r){const L=plCfg(),u=plKey(r.unit||''),k=plKey(r.name);
  return L.find(i=>i.key&&i.key===r.key)||L.find(i=>plKey(i.name)===k&&(!u||!i.unit||plKey(i.unit)===u)&&!plKey(i.br||''))||null}
ACT.plGov=()=>{const R=govRows();if(!R.length){toast('ไม่พบราคากลางชุดเริ่มต้นในโปรแกรมนี้');return}
  // a placeholder line, or a line still as this set loaded it (a Budget Bureau line too), takes the set's price
  const soft=(x,r)=>!x||x.sk==='demo'||x.sk==='est'||x.sk==='offl'||x.sk==='offm'||x.key===r.key&&x.sk===r.sk&&x.src===r.src,go=R.filter(r=>soft(govFind(r),r)),keep=R.filter(r=>!soft(govFind(r),r)),t={add:0,upd:0,same:0,off:0};
  ['bb','gov','offm','offl','est'].forEach(sk=>{const G=go.filter(r=>r.sk===sk),K=keep.filter(r=>r.sk===sk);
    [G.length&&plMerge(G,{sk,g:'oth'}),K.length&&plMerge(K,{sk,offer:1,noAdd:1})].forEach(r=>r&&Object.keys(t).forEach(k=>t[k]+=r[k]||0))});
  $('#dlg').open&&$('#dlg').close();plSay(t,'ราคากลางชุดเริ่มต้น')};
const govNote=()=>{const S=govSet();return S?`${S.rows.length} รายการ งานไฟฟ้า สุขาภิบาล ดับเพลิง แจ้งเหตุเพลิงไหม้ สื่อสาร ท่อน้ำยา ท่อลม น้ำเย็น เครื่องปรับอากาศ เครื่องกำเนิดไฟฟ้า และโซลาร์เซลล์ ค่าวัสดุและค่าแรงต่อหน่วย ไม่รวม VAT ราคาวันที่ ${thD(S.date)}`+
  (S.moc?` · <b>ค่าวัสดุ ${S.rows.filter(r=>r[7]).length} รายการเป็นราคาทางการ สนค. ส่วนกลาง ก.ย. 2569 (เงินสด ไม่รวม VAT และค่าขนส่ง ราคาต่อหน่วยหารจากม้วนหรือท่อน)</b>`:'')+
  (S.cgd?` · <b>ค่าแรง ${S.rows.filter(r=>/^\d/.test(r[6])).length} รายการเป็นตัวเลขทางการของกรมบัญชีกลาง ว 480 (${thD(S.cgd.date)})</b>`:'')+
  (S.bb?` · <b>ราคา ${S.rows.filter(r=>/^bb:/.test(r[6])).length} รายการ (แอร์ เครื่องกำเนิดไฟฟ้า โซลาร์เซลล์) ทั้งบรรทัดจากบัญชีราคามาตรฐานครุภัณฑ์ สำนักงบประมาณ ธ.ค. 2568 ฉบับปรับปรุง ก.พ. 2569 และเพิ่มเติม เม.ย. 2569 (หัก VAT 7%)</b>`:'')+
  (S.est?` · <b>ค่าวัสดุรายการอื่นยังเป็นราคาประมาณการ</b> ตามรูปแบบราคากระทรวงพาณิชย์ ก่อนยื่นงานราชการให้วางบัญชีราคาวัสดุจริงทับ`:'')+
  ` · ไม่ทับราคาที่บริษัทมีอยู่แล้ว (เก็บไว้เทียบแทน)`:''};

// เติมราคา: the starter set is the first choice
{const f=plFillDlg;plFillDlg=function(){const r=f.apply(this,arguments),bd=$('#dlg .bd');if(bd&&govSet()&&!bd.querySelector('[data-a="plGov"]'))
  bd.insertAdjacentHTML('afterbegin',`<div class="card" style="margin:0 0 8px;padding:10px 12px"><div class="row" style="justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap"><div style="flex:1;min-width:220px"><b>ราคากลางชุดเริ่มต้น (มีในโปรแกรม)</b> <span class="pill ok">ค่าวัสดุ สนค.</span> <span class="pill info">ค่าแรง ว 480</span> <span class="pill info">ครุภัณฑ์ สำนักงบฯ</span> <span class="pill warn">ค่าวัสดุอื่นประมาณการ</span><br><small class="muted">${govNote()}</small></div><button type="button" class="btn sm pri" data-a="plGov">ใส่ราคากลางชุดเริ่มต้น</button></div></div>`);return r}}
// an empty library: start from the starter set
{const f=plView;plView=function(){const h=f.apply(this,arguments);if(!govSet()||plCfg().length)return h;
  return h.replace('<button type="button" class="btn pri" data-a="plSeed">',`<button type="button" class="btn pri" data-a="plGov" title="${esc(govNote().replace(/<[^>]+>/g,''))}">ใส่ราคากลางชุดเริ่มต้น ${govSet().rows.length} รายการ (สนค. + ว 480 + สำนักงบฯ)</button><button type="button" class="btn" data-a="plSeed">`).replace('เริ่มได้ 3 ทาง','เริ่มได้ 4 ทาง')}}

if(typeof I18N==='object'&&I18N.en&&I18N.en.x)Object.assign(I18N.en.x,{
  'ประมาณการ':'Estimate','ค่าแรง ว 480':'CGD labour','ค่าวัสดุอื่นประมาณการ':'Other material estimated','ครุภัณฑ์ สำนักงบฯ':'Budget Bureau equipment','ค่าแรง ว 480 · วัสดุประมาณการ':'CGD labour · est. material','ค่าวัสดุ สนค.':'TPSO material','ราคาทางการ สนค. + ว 480':'Official: TPSO + CGD labour','ค่าวัสดุ สนค. · ค่าแรงประมาณการ':'TPSO material · est. labour','ราคากลางชุดเริ่มต้น (มีในโปรแกรม)':'Starter reference prices (built in)','ใส่ราคากลางชุดเริ่มต้น':'Load the starter reference prices',
  'เริ่มได้ 4 ทาง':'Four ways to start','ยังเป็นราคาสมมติ / ประมาณการ':'Assumed / estimated prices'});
