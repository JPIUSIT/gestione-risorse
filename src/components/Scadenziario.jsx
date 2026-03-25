import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

const TEAL = "#0d5c63"
const SC = {Pianificata:"#3b82f6",Attiva:"#22c55e","In chiusura":"#f97316",Chiusa:"#94a3b8"}
const SF_COL = {'In corso':'#06b6d4','Completata':'#22c55e','In attesa':'#f59e0b','Sospesa':'#94a3b8'}
const AV_PAL = ["#ef4444","#3b82f6","#22c55e","#a855f7","#f59e0b","#06b6d4","#ec4899","#84cc16","#f97316","#6366f1","#14b8a6","#e11d48"]
const cCol = id => { let h=0; for(let i=0;i<(id||"").length;i++) h=(h*31+id.charCodeAt(i))&0xffff; return AV_PAL[h%AV_PAL.length] }

const iso = d => { const dt=new Date(d); return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}` }
const addD = (d,n) => { const dt=new Date(d); dt.setDate(dt.getDate()+n); return dt }
const disp = s => { if(!s)return""; const[y,m,dd]=s.split("-"); return`${dd}/${m}/${y}` }
const today = iso(new Date())

const getDL = scad => {
  if (!scad) return null
  return Math.round((new Date(scad+'T00:00:00') - new Date(today+'T00:00:00')) / 86400000)
}
const getDLCol = dl => {
  if (dl===null) return '#94a3b8'
  if (dl<0) return '#dc2626'
  if (dl<=3) return '#ea580c'
  if (dl<=7) return '#d97706'
  return '#16a34a'
}
const getDLLabel = dl => {
  if (dl===null) return '—'
  if (dl<0) return `scad. ${Math.abs(dl)}gg fa`
  if (dl===0) return 'oggi'
  if (dl===1) return 'domani'
  return `${dl}gg`
}

export default function Scadenziario({ currentBU, commesse, API }) {
  const [sottofasi, setSottofasi] = useState([])
  const [milestones, setMilestones] = useState([])
  const [filtroStato, setFiltroStato] = useState('Tutti gli stati')
  const [viewMode, setViewMode] = useState('sett')
  const [tooltip, setTooltip] = useState(null)
  const ganttRef = useRef(null)

  useEffect(() => {
    if (!currentBU) return
    axios.get(`${API}/sottofasi/${currentBU.id}`).then(r => setSottofasi(r.data)).catch(()=>{})
    // Carica milestone per tutte le commesse
    Promise.all(commesse.map(c => axios.get(`${API}/milestones/${c.id}`).then(r=>r.data).catch(()=>[])))
      .then(results => setMilestones(results.flat()))
  }, [currentBU, commesse])

  // Genera colonne timeline
  const generateCols = () => {
    const startDate = new Date(today)
    startDate.setMonth(startDate.getMonth() - 1)
    startDate.setDate(1)
    const endDate = new Date(today)
    endDate.setMonth(endDate.getMonth() + 5)
    endDate.setDate(1)

    const cols = []
    if (viewMode === 'sett') {
      let cur = new Date(startDate)
      // Vai al lunedì più vicino
      const dow = cur.getDay()
      cur.setDate(cur.getDate() - (dow===0?6:dow-1))
      while (cur <= endDate) {
        const weekIso = iso(cur)
        const dd = cur.getDate()
        const mm = cur.getMonth()+1
        cols.push({ key: weekIso, label: `${dd}/${mm}`, date: new Date(cur) })
        cur = new Date(cur)
        cur.setDate(cur.getDate()+7)
      }
    } else {
      let cur = new Date(startDate)
      while (cur <= endDate) {
        const year = cur.getFullYear()
        const month = cur.getMonth()
        const label = cur.toLocaleDateString('it-IT',{month:'short',year:'numeric'})
        cols.push({ key: `${year}-${String(month+1).padStart(2,'0')}`, label, date: new Date(cur), year, month })
        cur.setMonth(cur.getMonth()+1)
      }
    }
    return cols
  }

  const cols = generateCols()

  const getColIdx = (dateStr) => {
    if (!dateStr) return -1
    const d = new Date(dateStr+'T00:00:00')
    if (viewMode === 'sett') {
      return cols.findIndex(c => {
        const cEnd = new Date(c.date); cEnd.setDate(cEnd.getDate()+6)
        return d >= c.date && d <= cEnd
      })
    } else {
      return cols.findIndex(c => c.year===d.getFullYear() && c.month===d.getMonth())
    }
  }

  const todayColIdx = getColIdx(today)

  const commesseFiltrate = commesse.filter(c => {
    if (c.arch) return false
    if (filtroStato !== 'Tutti gli stati' && c.stato !== filtroStato) return false
    return true
  })

  // Riepilogo scadenze
  const scadenzeAperte = sottofasi
    .filter(sf => sf.scad && sf.stato !== 'Completata')
    .map(sf => ({ sf, com: commesse.find(c=>c.id===sf.com_id), dl: getDL(sf.scad) }))
    .sort((a,b) => a.sf.scad > b.sf.scad ? 1 : -1)

  // Criticità per mese
  const critByMonth = {}
  scadenzeAperte.forEach(({sf, com, dl}) => {
    const key = sf.scad.slice(0,7)
    const label = new Date(sf.scad+'T00:00:00').toLocaleDateString('it-IT',{month:'long',year:'numeric'})
    if (!critByMonth[key]) critByMonth[key] = { label, items:[] }
    critByMonth[key].items.push({sf, com, dl})
  })

  const COL_W = viewMode==='sett' ? 52 : 80
  const LEFT_W = 260

  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',height:'100%',fontFamily:'sans-serif'}}>

      {/* Toolbar */}
      <div style={{padding:'8px 16px',background:'#fff',borderBottom:'1px solid #e2e8f0',display:'flex',alignItems:'center',gap:12,flexShrink:0,flexWrap:'wrap'}}>
        <span style={{fontWeight:700,fontSize:15,color:'#1e293b'}}>Scadenziario</span>
        <select value={filtroStato} onChange={e=>setFiltroStato(e.target.value)}
          style={{padding:'5px 10px',borderRadius:6,border:'1px solid #e2e8f0',fontSize:12,outline:'none',color:'#1e293b'}}>
          {['Tutti gli stati','Pianificata','Attiva','In chiusura','Chiusa'].map(s=><option key={s}>{s}</option>)}
        </select>

        {/* Legenda */}
        <div style={{display:'flex',alignItems:'center',gap:12,marginLeft:'auto',fontSize:11,color:'#64748b'}}>
          <span style={{fontWeight:600}}>Legenda:</span>
          <span style={{display:'flex',alignItems:'center',gap:4}}><span style={{color:'#f59e0b',fontSize:14}}>◆</span> In attesa</span>
          <span style={{display:'flex',alignItems:'center',gap:4}}><span style={{color:'#06b6d4',fontSize:14}}>◆</span> In corso</span>
          <span style={{display:'flex',alignItems:'center',gap:4}}><span style={{color:'#22c55e',fontSize:14}}>◆</span> Completata</span>
          <span style={{display:'flex',alignItems:'center',gap:4}}><span style={{color:'#7c3aed',fontSize:14}}>★</span> Milestone</span>
          <div style={{display:'flex',border:'1px solid #e2e8f0',borderRadius:5,overflow:'hidden'}}>
            {[['sett','Sett.'],['mese','Mese']].map(([v,l]) => (
              <button key={v} onClick={()=>setViewMode(v)}
                style={{padding:'4px 10px',border:'none',background:viewMode===v?TEAL:'#fff',color:viewMode===v?'#fff':'#64748b',cursor:'pointer',fontSize:11,fontWeight:viewMode===v?700:400}}>
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Gantt */}
      <div ref={ganttRef} style={{flex:1,overflow:'auto',minHeight:0}}>
        <table style={{borderCollapse:'collapse',tableLayout:'fixed'}}>
          <colgroup>
            <col style={{width:LEFT_W}}/>
            {cols.map(c => <col key={c.key} style={{width:COL_W}}/>)}
          </colgroup>
          <thead style={{position:'sticky',top:0,zIndex:3,background:'#fff'}}>
            {/* Riga mesi (solo in vista settimana) */}
            {viewMode==='sett' && (
              <tr>
                <th style={{padding:'4px 10px',textAlign:'left',fontSize:11,color:'#64748b',fontWeight:600,borderBottom:'1px solid #e2e8f0',borderRight:'2px solid #e2e8f0',background:'#f8fafc'}}>
                  Commessa / Sottofase
                </th>
                {(() => {
                  const monthGroups = []
                  cols.forEach((c,i) => {
                    const m = c.date.toLocaleDateString('it-IT',{month:'short',year:'numeric'})
                    if (!monthGroups.length || monthGroups[monthGroups.length-1].label !== m) {
                      monthGroups.push({label:m, count:1, idx:i})
                    } else {
                      monthGroups[monthGroups.length-1].count++
                    }
                  })
                  return monthGroups.map(g => (
                    <th key={g.label} colSpan={g.count}
                      style={{padding:'4px',textAlign:'center',fontSize:11,fontWeight:700,color:'#1e293b',borderBottom:'1px solid #e2e8f0',borderLeft:'1px solid #e2e8f0',background:'#f8fafc',textTransform:'capitalize'}}>
                      {g.label}
                    </th>
                  ))
                })()}
              </tr>
            )}
            <tr>
              {viewMode==='mese' && (
                <th style={{padding:'4px 10px',textAlign:'left',fontSize:11,color:'#64748b',fontWeight:600,borderBottom:'2px solid #e2e8f0',borderRight:'2px solid #e2e8f0',background:'#f8fafc'}}>
                  Commessa / Sottofase
                </th>
              )}
              {viewMode==='sett' && <th style={{borderRight:'2px solid #e2e8f0',background:'#f8fafc',borderBottom:'2px solid #e2e8f0'}}/>}
              {cols.map((c,i) => (
                <th key={c.key} style={{
                  padding:'3px 2px',textAlign:'center',fontSize:10,
                  color:i===todayColIdx?TEAL:'#64748b',
                  fontWeight:i===todayColIdx?700:500,
                  borderBottom:'2px solid #e2e8f0',
                  borderLeft:'1px solid #f1f5f9',
                  background:i===todayColIdx?'#f0f9fa':'#f8fafc',
                  whiteSpace:'nowrap'
                }}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {commesseFiltrate.map((com, ci) => {
              const comCol = cCol(com.id)
              const sfCom = sottofasi.filter(s => s.com_id === com.id)
              const msCom = milestones.filter(m => m.com_id === com.id)
              const statoCol = SC[com.stato] || '#94a3b8'
              return [
                // Riga commessa
                <tr key={`com-${com.id}`} style={{background:ci%2===0?'#fff':'#fafafa'}}>
                  <td style={{padding:'6px 10px',borderBottom:'1px solid #f1f5f9',borderRight:'2px solid #e2e8f0',position:'sticky',left:0,background:ci%2===0?'#fff':'#fafafa',zIndex:1}}>
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <span style={{width:8,height:8,borderRadius:2,background:comCol,flexShrink:0,display:'inline-block'}}/>
                      <span style={{fontWeight:700,fontSize:11,color:comCol,marginRight:4}}>{com.cod}</span>
                      <span style={{fontSize:10,color:'#1e293b',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:120}}>{com.tit?.slice(0,25)}</span>
                      <span style={{fontSize:9,padding:'1px 5px',borderRadius:3,background:statoCol+'20',color:statoCol,fontWeight:700,flexShrink:0,marginLeft:2}}>{com.stato}</span>
                    </div>
                  </td>
                  {cols.map((c,i) => (
                    <td key={c.key} style={{borderBottom:'1px solid #f1f5f9',borderLeft:'1px solid #f1f5f9',background:i===todayColIdx?'#f0f9fa':''}}/>
                  ))}
                </tr>,
                // Righe sottofasi
                ...sfCom.map(sf => {
                  const sfCol = SF_COL[sf.stato] || '#94a3b8'
                  const colIdx = getColIdx(sf.scad)
                  const dl = getDL(sf.scad)
                  const dlCol = getDLCol(dl)
                  return (
                    <tr key={`sf-${sf.id}`} style={{background:ci%2===0?'#f9fafb':'#f4f6f8'}}>
                      <td style={{padding:'4px 10px 4px 22px',borderBottom:'1px solid #f1f5f9',borderRight:'2px solid #e2e8f0',position:'sticky',left:0,background:ci%2===0?'#f9fafb':'#f4f6f8',zIndex:1}}>
                        <div style={{display:'flex',alignItems:'center',gap:6}}>
                          <span style={{color:'#cbd5e1',fontSize:10}}>└</span>
                          <span style={{fontSize:11,color:'#334155'}}>{sf.nome}</span>
                          <span style={{fontSize:9,padding:'1px 5px',borderRadius:3,background:sfCol+'20',color:sfCol,fontWeight:700}}>{sf.stato}</span>
                        </div>
                      </td>
                      {cols.map((c,i) => (
                        <td key={c.key} style={{borderBottom:'1px solid #f1f5f9',borderLeft:'1px solid #f1f5f9',textAlign:'center',verticalAlign:'middle',background:i===todayColIdx?'#f0f9fa':'',padding:'2px',position:'relative'}}>
                          {i === colIdx && sf.scad && (
                            <div
                              onMouseEnter={e=>setTooltip({text:`${sf.nome}: ${disp(sf.scad)} (${getDLLabel(dl)})`,x:e.clientX,y:e.clientY})}
                              onMouseLeave={()=>setTooltip(null)}
                              style={{display:'inline-flex',alignItems:'center',justifyContent:'center',cursor:'default'}}>
                              <span style={{color:dlCol,fontSize:16,lineHeight:1}}>◆</span>
                            </div>
                          )}
                        </td>
                      ))}
                    </tr>
                  )
                }),
                // Righe milestone
                ...msCom.map(ms => {
                  const colIdx = getColIdx(ms.scad)
                  const dl = getDL(ms.scad)
                  return (
                    <tr key={`ms-${ms.id}`} style={{background:ci%2===0?'#f9fafb':'#f4f6f8'}}>
                      <td style={{padding:'4px 10px 4px 22px',borderBottom:'1px solid #f1f5f9',borderRight:'2px solid #e2e8f0',position:'sticky',left:0,background:ci%2===0?'#f9fafb':'#f4f6f8',zIndex:1}}>
                        <div style={{display:'flex',alignItems:'center',gap:6}}>
                          <span style={{color:'#cbd5e1',fontSize:10}}>└</span>
                          <span style={{color:'#7c3aed',fontSize:12}}>★</span>
                          <span style={{fontSize:11,color:'#334155'}}>{ms.nome}</span>
                        </div>
                      </td>
                      {cols.map((c,i) => (
                        <td key={c.key} style={{borderBottom:'1px solid #f1f5f9',borderLeft:'1px solid #f1f5f9',textAlign:'center',verticalAlign:'middle',background:i===todayColIdx?'#f0f9fa':'',padding:'2px'}}>
                          {i === colIdx && ms.scad && (
                            <div
                              onMouseEnter={e=>setTooltip({text:`★ ${ms.nome}: ${disp(ms.scad)}`,x:e.clientX,y:e.clientY})}
                              onMouseLeave={()=>setTooltip(null)}
                              style={{display:'inline-flex',alignItems:'center',justifyContent:'center',cursor:'default'}}>
                              <span style={{color:'#7c3aed',fontSize:16,lineHeight:1}}>★</span>
                            </div>
                          )}
                        </td>
                      ))}
                    </tr>
                  )
                })
              ]
            })}
          </tbody>
        </table>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div style={{position:'fixed',top:tooltip.y-36,left:tooltip.x+8,background:'#1e293b',color:'#fff',padding:'4px 10px',borderRadius:6,fontSize:11,zIndex:9999,pointerEvents:'none',whiteSpace:'nowrap'}}>
          {tooltip.text}
        </div>
      )}

      {/* Riepilogo scadenze */}
      <div style={{background:'#fff',borderTop:'2px solid #e2e8f0',flexShrink:0,maxHeight:280,display:'flex',flexDirection:'column',overflow:'hidden'}}>
        <div style={{background:TEAL,padding:'6px 14px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
          <span style={{fontWeight:700,fontSize:12,color:'#fff'}}>Riepilogo Scadenze</span>
          <span style={{fontSize:11,color:'rgba(255,255,255,0.7)'}}>{scadenzeAperte.length} scadenze totali</span>
        </div>
        <div style={{flex:1,overflowY:'auto'}}>
          {scadenzeAperte.length === 0 ? (
            <div style={{padding:'12px 16px',color:'#94a3b8',fontSize:12,textAlign:'center'}}>Nessuna scadenza aperta</div>
          ) : (
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead>
                <tr style={{background:'#f8fafc'}}>
                  <th style={{padding:'5px 14px',textAlign:'left',fontSize:10,color:'#64748b',fontWeight:600,borderBottom:'1px solid #e2e8f0'}}>Commessa</th>
                  <th style={{padding:'5px 14px',textAlign:'left',fontSize:10,color:'#64748b',fontWeight:600,borderBottom:'1px solid #e2e8f0'}}>Sottofase</th>
                  <th style={{padding:'5px 14px',textAlign:'center',fontSize:10,color:'#64748b',fontWeight:600,borderBottom:'1px solid #e2e8f0'}}>Data Scadenza</th>
                  <th style={{padding:'5px 14px',textAlign:'center',fontSize:10,color:'#64748b',fontWeight:600,borderBottom:'1px solid #e2e8f0'}}>Stato</th>
                  <th style={{padding:'5px 14px',textAlign:'center',fontSize:10,color:'#64748b',fontWeight:600,borderBottom:'1px solid #e2e8f0'}}>Giorni restanti</th>
                </tr>
              </thead>
              <tbody>
                {scadenzeAperte.map(({sf,com,dl},i) => {
                  const dlCol = getDLCol(dl)
                  const comCol = cCol(sf.com_id)
                  const sfCol = SF_COL[sf.stato]||'#94a3b8'
                  return (
                    <tr key={sf.id} style={{borderBottom:'1px solid #f1f5f9',background:i%2===0?'#fff':'#fafafa'}}>
                      <td style={{padding:'5px 14px'}}>
                        <div style={{display:'flex',alignItems:'center',gap:6}}>
                          <span style={{width:8,height:8,borderRadius:2,background:comCol,display:'inline-block',flexShrink:0}}/>
                          <div>
                            <div style={{fontWeight:700,color:comCol,fontSize:11}}>{com?.cod}</div>
                            <div style={{fontSize:10,color:'#94a3b8'}}>{com?.cli?.slice(0,20)}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{padding:'5px 14px',fontSize:11,color:'#334155'}}>{sf.nome}</td>
                      <td style={{padding:'5px 14px',textAlign:'center',fontSize:11,fontWeight:700,color:dlCol}}>{disp(sf.scad)}</td>
                      <td style={{padding:'5px 14px',textAlign:'center'}}>
                        <span style={{fontSize:10,padding:'1px 7px',borderRadius:4,background:sfCol+'20',color:sfCol,fontWeight:700}}>{sf.stato}</span>
                      </td>
                      <td style={{padding:'5px 14px',textAlign:'center'}}>
                        <span style={{fontSize:11,fontWeight:700,color:dlCol,background:dlCol+'15',borderRadius:6,padding:'2px 8px'}}>{getDLLabel(dl)}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Criticità per mese */}
        {Object.keys(critByMonth).length > 0 && (
          <div style={{borderTop:'1px solid #e2e8f0',flexShrink:0}}>
            <div style={{padding:'5px 14px',background:'#fef9ec',display:'flex',alignItems:'center',gap:6}}>
              <span style={{fontSize:11,fontWeight:700,color:'#92400e'}}>
                📅 Criticità — {scadenzeAperte.length} scadenz{scadenzeAperte.length===1?'a':'e'} in {Object.keys(critByMonth).length} period{Object.keys(critByMonth).length===1?'o':'i'}
              </span>
            </div>
            <div style={{display:'flex',overflowX:'auto',gap:0}}>
              {Object.entries(critByMonth).map(([key,{label,items}]) => {
                const hasPast = items.some(x=>x.dl<0)
                const hasUrgent = items.some(x=>x.dl>=0&&x.dl<=7)
                const hCol = hasPast?'#dc2626':hasUrgent?'#d97706':TEAL
                return (
                  <div key={key} style={{flexShrink:0,borderRight:'1px solid #e2e8f0',minWidth:160,maxWidth:200}}>
                    <div style={{background:hCol,padding:'3px 10px'}}>
                      <span style={{fontSize:10,fontWeight:700,color:'#fff',textTransform:'capitalize'}}>{label}</span>
                      <span style={{fontSize:9,color:'rgba(255,255,255,0.7)',marginLeft:6}}>{items.length} scad.</span>
                    </div>
                    <div style={{padding:'4px 6px',display:'flex',flexDirection:'column',gap:3}}>
                      {items.map(({sf,com,dl}) => {
                        const dlC = getDLCol(dl)
                        return (
                          <div key={sf.id} style={{background:`${dlC}08`,border:`1px solid ${dlC}25`,borderRadius:4,padding:'3px 6px'}}>
                            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                              <span style={{fontSize:10,fontWeight:700,color:cCol(sf.com_id)}}>{com?.cod}</span>
                              <span style={{fontSize:9,fontWeight:700,color:dlC}}>{getDLLabel(dl)}</span>
                            </div>
                            <div style={{fontSize:9,color:'#334155'}}>{sf.nome}</div>
                            <div style={{fontSize:9,color:'#94a3b8'}}>{disp(sf.scad)}</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}