/* ---------- 3.87 ราคากลางควรอัปเดต: when each kind of source was last updated, and a reminder when it is due ----------
   กระทรวงพาณิชย์ publishes every month (the price is dated the 1st of its month, so it is due 45 days on), online shops change
   often, dealer price lists and e-GP results are due after 6 months, the yearly government lists (สำนักงบประมาณ, กรมบัญชีกลาง)
   after a year. Only sources the library already holds are checked, so a company that never used one is not reminded about it.
   The reminder shows on the library page and in ต้องดูวันนี้; its button opens เติมราคา with that source picked. */
const PL_EVERY={moc:[45,'ทุกเดือน'],shop:[30,'ทุกเดือน'],dealer:[182,'ทุก 6 เดือน หรือเมื่อได้ price list ใหม่'],egp:[182,'ทุก 6 เดือน'],bb:[365,'ปีละครั้ง'],cgd:[365,'ปีละครั้ง']};
const PL_URL={moc:'https://price.moc.go.th',bb:'https://www.bb.go.th',cgd:'https://www.cgd.go.th',egp:'https://www.gprocurement.go.th'};
function plFresh(){const M={},td=today();
  plCfg().forEach(x=>plOffs(x).forEach(o=>{const s=o.s||'hand';if(!PL_EVERY[s])return;const m=M[s]||(M[s]={s,d:'',n:0});m.n++;if(okD(o.d)&&o.d>m.d)m.d=o.d}));
  return PL_ORD.filter(s=>M[s]).map(s=>{const m=M[s],due=m.d?addD(m.d,PL_EVERY[s][0]):td;return Object.assign(m,{due,late:due<=td})})}
function plFreshCard(){const F=plFresh();if(!F.length)return '';const late=F.filter(x=>x.late).length;
  return `<section class="card"><h2><span>อัปเดตราคาล่าสุดของแต่ละแหล่ง</span><small>${late?`${late} แหล่งควรอัปเดต`:'ทุกแหล่งยังเป็นปัจจุบัน'}</small></h2>
  <div class="tw"><table><thead><tr><th>แหล่ง</th><th>ราคาล่าสุด</th><th class="r">จำนวนราคา</th><th>ควรอัปเดต</th><th>ครบกำหนด</th><th></th></tr></thead><tbody>
  ${F.map(x=>`<tr><td><span class="pill ${PL_SK[x.s][1]}">${PL_SK[x.s][0]}</span></td><td style="white-space:nowrap">${x.d?thD(x.d):'<span class="muted">ไม่ระบุวันที่</span>'}</td><td class="r">${fmt(x.n)}</td>
    <td>${PL_EVERY[x.s][1]}</td><td style="white-space:nowrap${x.late?';color:var(--danger)':''}">${x.late?'ควรอัปเดตแล้ว':thD(x.due)}</td>
    <td style="white-space:nowrap">${PL_URL[x.s]?`<a class="btn ghost sm" href="${PL_URL[x.s]}" target="_blank" rel="noopener">เปิดเว็บ</a>`:''}<button type="button" class="btn sm${x.late?' pri':''}" data-a="plFreshGo" data-s="${x.s}">เติมราคา</button></td></tr>`).join('')}
  </tbody></table></div>
  <p class="hint" style="margin:8px 0 0">ไม่ต้องอัปเดตทุกวันหรือทุกสัปดาห์ ราคาพาณิชย์ออกเดือนละครั้ง บัญชีของสำนักงบประมาณและกรมบัญชีกลางออกปีละครั้ง PENUM PM จะเตือนในหน้า ต้องดูวันนี้ เมื่อแหล่งไหนถึงเวลาอัปเดต</p></section>`}
// เติมราคา with the source already picked: the MOC card is at the top of the dialog, a paste source is chosen in the paste box
ACT.plFreshGo=b=>{const s=b.dataset.s;plFillDlg();const x=$('#plXs');
  if(x&&PL_SRC.some(r=>r[0]===s)){x.value=s;x.dispatchEvent(new Event('change',{bubbles:true}));const t=$('#plTxt');if(t){t.scrollIntoView({block:'center'});t.focus()}}};
// shown above the library when a source is due, below it otherwise
{const f=plView;plView=function(){const h=f.apply(this,arguments),c=plFreshCard();if(!c)return h;
  if(plFresh().some(x=>x.late)){const i=h.indexOf('<section class="card"><h2><span>คลังราคากลาง');return i<0?c+h:h.slice(0,i)+c+h.slice(i)}
  const i=h.lastIndexOf('<p class="hint">ราคาที่แก้ในตาราง'),j=i<0?-1:h.indexOf('</section>',i);return j<0?h+c:h.slice(0,j+10)+c+h.slice(j+10)}}
{const f=alerts;alerts=function(){const A=f();if(!allowed('co','tender'))return A;
  plFresh().filter(x=>x.late).forEach(x=>A.push({lv:'warn',kind:'ราคากลางควรอัปเดต',p:null,txt:`${PL_SK[x.s][0]} ราคาล่าสุด ${x.d?thD(x.d):'ไม่ระบุวันที่'} (${fmt(x.n)} ราคา) ควรอัปเดต${PL_EVERY[x.s][1]}`,due:x.due,go:{m:'co',k:'tender',s:'plib'}}));return A}}
if(typeof I18N==='object'&&I18N.en&&I18N.en.x)Object.assign(I18N.en.x,{'อัปเดตราคาล่าสุดของแต่ละแหล่ง':'Last price update per source','ราคาล่าสุด':'Latest price','จำนวนราคา':'Prices',
  'ควรอัปเดต':'Update','ครบกำหนด':'Due','ควรอัปเดตแล้ว':'Due now','เปิดเว็บ':'Open site','ทุกแหล่งยังเป็นปัจจุบัน':'All sources up to date','ราคากลางควรอัปเดต':'Reference prices due',
  'ทุกเดือน':'Monthly','ทุก 6 เดือน':'Every 6 months','ปีละครั้ง':'Yearly','ทุก 6 เดือน หรือเมื่อได้ price list ใหม่':'Every 6 months or on a new price list'});
