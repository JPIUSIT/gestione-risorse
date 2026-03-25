import { useState, useMemo } from 'react'

const TEAL = "#0d5c63"
const AV_PAL = ["#ef4444","#3b82f6","#22c55e","#a855f7","#f59e0b","#06b6d4","#ec4899","#84cc16","#f97316","#6366f1","#14b8a6","#e11d48"]
const cCol = id => { let h=0; for(let i=0;i<(id||"").length;i++) h=(h*31+id.charCodeAt(i))&0xffff; return AV_PAL[h%AV_PAL.length] }

const iso = d => { const dt=new Date(d); return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}` }
const addD = (d,n) => { const dt=new Date(d); dt.setDate(dt.getDate()+n); return dt }
const monday = d => { const dt=new Date(d),dy=dt.getDay(),df=dt.getDate()-dy+(dy===0?-6:1); return new Date(new Date(dt).setDate(df)) }
const dispShort = s => { if(!s)return""; const[y,m,dd]=s.split("-"); return`${dd}/${m}` }
const dispFull = s => { if(!s)return""; const[y,m,dd]=s.split("-"); return`${dd}/${m}/${y}` }
const monthName = d => new Date(d+'T00:00:00').toLocaleDateString('it-IT',{month:'long',year:'numeric'})

export default function RiepilogoRisorse({ risorse, commesse, allocazioni, currentBU, API }) {
  const [viewMode, setViewMode] = useState('settimana')
  const [weekStart, setWeekStart] = useState(iso(monday(new Date())))
  const [monthStart, setMonthStart] = useState(iso(new Date(new Date().getFullYear(), new Date().getMonth(), 1)))
  const [cercaRis, setCercaRis] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [filtroCommessa, setFiltroCommessa] = useState('')

  const giorni = useMemo(() => {
    if (viewMode === 'settimana') {
      return Array.from({length:6}, (_,i) => iso(addD(weekStart, i)))
    } else {
      const start = new Date(monthStart+'T00:00:00')
      const year = start.getFullYear()
      const month = start.getMonth()
      const daysInMonth = new Date(year, month+1, 0).getDate()
      return Array.from({length:daysInMonth}, (_,i) => {
        const d = new Date(year, month, i+1)
        const dow = d.getDay()
        if (dow===0||dow===6) return null
        return iso(d)
      }).filter(Boolean)
    }
  }, [viewMode, weekStart, monthStart])

  const prevPeriod = () => {
    if (viewMode==='settimana') setWeekStart(iso(addD(weekStart,-7)))
    else { const d=new Date(monthStart+'T00:00:00'); d.setMonth(d.getMonth()-1); setMonthStart(iso(new Date(d.getFullYear(),d.getMonth(),1))) }
  }
  const nextPeriod = () => {
    if (viewMode==='settimana') setWeekStart(iso(addD(weekStart,7)))
    else { const d=new Date(monthStart+'T00:00:00'); d.setMonth(d.getMonth()+1); setMonthStart(iso(new Date(d.getFullYear(),d.getMonth(),1))) }
  }
  const goToday = () => {
    if (viewMode==='settimana') setWeekStart(iso(monday(new Date())))
    else setMonthStart(iso(new Date(new Date().getFullYear(),new Date().getMonth(),1)))
  }

  const periodoLabel = viewMode==='settimana'
    ? `${dispFull(giorni[0])} – ${dispFull(giorni[giorni.length-1])}`
    : monthName(monthStart)

  const categorie = [...new Set(risorse.map(r=>r.cat_id).filter(Boolean))]

  const risorseFiltrate = risorse.filter(r => {
    if (cercaRis && !`${r.nome} ${r.cogn}`.toLowerCase().includes(cercaRis.toLowerCase()) && !r.ruolo?.toLowerCase().includes(cercaRis.toLowerCase())) return false
    if (filtroCategoria && r.cat_id !== filtroCategoria) return false
    return true
  })

  const getAllocRis = (risId, data) => allocazioni.filter(a => a.ris_id===risId && a.data===data)
  const getTotOreRis = (risId) => giorni.reduce((s,d) => s+getAllocRis(risId,d).reduce((ss,a)=>ss+(a.ore||0),0), 0)
  const getComIds = (risId) => [...new Set(allocazioni.filter(a=>a.ris_id===risId&&giorni.includes(a.data)).map(a=>a.com_id))]
  const today = iso(new Date())

  const risorseDaMostrare = filtroCommessa
    ? risorseFiltrate.filter(r => allocazioni.some(a => a.ris_id===r.id && a.com_id===filtroCommessa && giorni.includes(a.data)))
    : risorseFiltrate

  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',height:'100%'}}>

      {/* Toolbar */}
      <div style={{padding:'8px 16px',background:'#fff',borderBottom:'1px solid #e2e8f0',display:'flex',alignItems:'center',gap:10,flexShrink:0,flexWrap:'wrap'}}>

        {/* FILTRI — a sinistra */}
        <div style={{position:'relative'}}>
          <span style={{position:'absolute',left:7,top:'50%',transform:'translateY(-50%)',fontSize:11,color:'#94a3b8'}}>🔍</span>
          <input value={cercaRis} onChange={e=>setCercaRis(e.target.value)} placeholder="Cerca risorsa..."
            style={{padding:'5px 8px 5px 24px',borderRadius:6,border:'1px solid #e2e8f0',fontSize:12,outline:'none',width:150}}/>
        </div>

        <select value={filtroCategoria} onChange={e=>setFiltroCategoria(e.target.value)}
          style={{padding:'5px 8px',borderRadius:6,border:'1px solid #e2e8f0',fontSize:12,outline:'none',color:'#1e293b'}}>
          <option value="">Tutte le categorie</option>
          {categorie.map(c=><option key={c} value={c}>{c.toUpperCase()}</option>)}
        </select>

        <select value={filtroCommessa} onChange={e=>setFiltroCommessa(e.target.value)}
          style={{padding:'5px 8px',borderRadius:6,border:'1px solid #e2e8f0',fontSize:12,outline:'none',color:'#1e293b',maxWidth:200}}>
          <option value="">Tutte le commesse</option>
          {commesse.filter(c=>!c.arch).map(c=><option key={c.id} value={c.id}>{c.cod} – {c.tit?.slice(0,25)}</option>)}
        </select>

        <div style={{width:1,height:20,background:'#e2e8f0',margin:'0 4px'}}/>

        {/* VISTA + NAVIGAZIONE — a destra dei filtri */}
        <div style={{display:'flex',border:'1px solid #e2e8f0',borderRadius:6,overflow:'hidden'}}>
          {['settimana','mese'].map(v => (
            <button key={v} onClick={()=>setViewMode(v)}
              style={{padding:'5px 12px',border:'none',background:viewMode===v?TEAL:'#fff',color:viewMode===v?'#fff':'#64748b',cursor:'pointer',fontSize:12,fontWeight:viewMode===v?700:400}}>
              {v.charAt(0).toUpperCase()+v.slice(1)}
            </button>
          ))}
        </div>

        <button onClick={prevPeriod} style={{padding:'4px 10px',borderRadius:6,border:'1px solid #e2e8f0',background:'#fff',cursor:'pointer',fontSize:14}}>‹</button>
        <button onClick={goToday} style={{padding:'4px 10px',borderRadius:6,border:'1px solid #e2e8f0',background:'#fff',cursor:'pointer',fontSize:12}}>Oggi</button>
        <button onClick={nextPeriod} style={{padding:'4px 10px',borderRadius:6,border:'1px solid #e2e8f0',background:'#fff',cursor:'pointer',fontSize:14}}>›</button>
        <span style={{fontWeight:700,color:TEAL,fontSize:13}}>{periodoLabel}</span>

        <span style={{marginLeft:'auto',fontSize:12,color:'#64748b'}}>{risorseDaMostrare.length} risorse</span>
      </div>

      {/* Griglia */}
      <div style={{flex:1,overflow:'auto'}}>
        <table style={{borderCollapse:'collapse',width:'100%',minWidth:800}}>
          <thead style={{position:'sticky',top:0,zIndex:2,background:'#fff'}}>
            <tr>
              <th style={{width:180,padding:'6px 12px',textAlign:'left',fontSize:11,color:'#64748b',fontWeight:600,borderBottom:'2px solid #e2e8f0',background:'#fff'}}>Risorsa</th>
              <th style={{width:60,padding:'6px 8px',textAlign:'center',fontSize:11,color:'#64748b',fontWeight:600,borderBottom:'2px solid #e2e8f0',background:'#fff'}}>Tot.</th>
              <th style={{width:50,padding:'6px 8px',textAlign:'center',fontSize:11,color:'#64748b',fontWeight:600,borderBottom:'2px solid #e2e8f0',background:'#fff'}}>Com.</th>
              {giorni.map(d => {
                const dow = ['Dom','Lun','Mar','Mer','Gio','Ven','Sab'][new Date(d+'T00:00:00').getDay()]
                return (
                  <th key={d} style={{padding:'4px 2px',textAlign:'center',fontSize:10,color:d===today?TEAL:'#64748b',fontWeight:d===today?700:500,borderBottom:'2px solid #e2e8f0',minWidth:viewMode==='mese'?36:80,background:d===today?'#f0f9fa':'#fff'}}>
                    <div style={{fontWeight:700}}>{dow}</div>
                    <div style={{fontSize:9}}>{dispShort(d)}</div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {risorseDaMostrare.map((ris,ri) => {
              const col = cCol(ris.id)
              const rgb = `${parseInt(col.slice(1,3),16)},${parseInt(col.slice(3,5),16)},${parseInt(col.slice(5,7),16)}`
              const totOre = getTotOreRis(ris.id)
              const comIds = getComIds(ris.id)
              return (
                <tr key={ris.id} style={{background:ri%2===0?'#fff':'#fafafa'}}>
                  <td style={{padding:'6px 12px',borderBottom:'1px solid #f1f5f9'}}>
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <div style={{width:26,height:26,borderRadius:'50%',background:`rgba(${rgb},0.15)`,border:`1.5px solid rgba(${rgb},0.5)`,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:9,color:col,flexShrink:0}}>
                        {ris.nome?.[0]}{ris.cogn?.[0]}
                      </div>
                      <div>
                        <div style={{fontWeight:600,fontSize:11,color:'#1e293b'}}>{ris.nome} {ris.cogn}</div>
                        <div style={{fontSize:10,color:'#94a3b8'}}>{ris.ruolo}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{padding:'6px 8px',textAlign:'center',borderBottom:'1px solid #f1f5f9'}}>
                    <span style={{fontSize:12,fontWeight:700,color:totOre>0?TEAL:'#94a3b8'}}>{totOre}h</span>
                  </td>
                  <td style={{padding:'6px 8px',textAlign:'center',borderBottom:'1px solid #f1f5f9'}}>
                    <span style={{fontSize:12,color:'#64748b'}}>{comIds.length}</span>
                  </td>
                  {giorni.map(d => {
                    const allocs = getAllocRis(ris.id, d)
                    const tot = allocs.reduce((s,a)=>s+(a.ore||0),0)
                    const comCol = allocs[0] ? cCol(allocs[0].com_id) : null
                    const isToday = d===today
                    const c = comCol||col
                    const cr = `${parseInt(c.slice(1,3),16)},${parseInt(c.slice(3,5),16)},${parseInt(c.slice(5,7),16)}`
                    return (
                      <td key={d} style={{padding:'2px',textAlign:'center',borderBottom:'1px solid #f1f5f9',background:isToday?'#f0f9fa':'',verticalAlign:'middle',minWidth:viewMode==='mese'?36:80}}>
                        {tot > 0 ? (
                          <div style={{background:`rgba(${cr},0.15)`,border:`1px solid rgba(${cr},0.35)`,borderRadius:4,padding:'2px 3px',display:'inline-block',minWidth:viewMode==='mese'?28:50}}>
                            <div style={{fontSize:viewMode==='mese'?9:11,fontWeight:700,color:c}}>{tot}h</div>
                            {viewMode==='settimana' && allocs[0] && (
                              <div style={{fontSize:9,color:c,opacity:0.8,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:70}}>
                                {commesse.find(x=>x.id===allocs[0].com_id)?.cod||''}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{fontSize:14,color:'#f1f5f9'}}>·</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}