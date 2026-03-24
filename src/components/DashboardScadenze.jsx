import { useState, useEffect } from 'react'
import axios from 'axios'

const TEAL = "#0d5c63"
const AV_PAL = ["#ef4444","#3b82f6","#22c55e","#a855f7","#f59e0b","#06b6d4","#ec4899","#84cc16","#f97316","#6366f1","#14b8a6","#e11d48"]
const cCol = id => { let h=0; for(let i=0;i<(id||"").length;i++) h=(h*31+id.charCodeAt(i))&0xffff; return AV_PAL[h%AV_PAL.length] }

const today = new Date().toISOString().split('T')[0]

const getDaysLeft = (scad) => {
  if (!scad) return null
  return Math.round((new Date(scad+'T00:00:00') - new Date(today+'T00:00:00')) / 86400000)
}

const getDaysColor = (dl) => {
  if (dl === null) return '#94a3b8'
  if (dl < 0) return '#dc2626'
  if (dl <= 3) return '#ea580c'
  if (dl <= 7) return '#d97706'
  return '#16a34a'
}

const getDaysLabel = (dl) => {
  if (dl === null) return '—'
  if (dl < 0) return `scad. ${Math.abs(dl)}gg fa`
  if (dl === 0) return 'oggi'
  if (dl === 1) return 'domani'
  return `${dl}gg`
}

const disp = s => {
  if (!s) return ''
  const [y,m,d] = s.split('-')
  return `${d}/${m}/${y}`
}

const STATO_COLORS = {
  'In corso':   { bg:'#eff6ff', text:'#1d4ed8' },
  'Completata': { bg:'#f0fdf4', text:'#15803d' },
  'In attesa':  { bg:'#fffbeb', text:'#92400e' },
  'Sospesa':    { bg:'#f8fafc', text:'#475569' },
}

export default function DashboardScadenze({ currentBU, commesse, API }) {
  const [sottofasi, setSottofasi] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('aperte')

  useEffect(() => {
    if (!currentBU) return
    axios.get(`${API}/sottofasi/${currentBU.id}`)
      .then(r => { setSottofasi(r.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [currentBU])

  if (loading) return <div style={{color:'#94a3b8',fontSize:14}}>Caricamento scadenze...</div>

  // Costruisci lista scadenze con info commessa
  const scadenze = sottofasi
    .filter(sf => sf.scad)
    .map(sf => {
      const com = commesse.find(c => c.id === sf.com_id)
      const dl = getDaysLeft(sf.scad)
      return { sf, com, dl }
    })
    .filter(item => {
      if (filtro === 'aperte') return item.sf.stato !== 'Completata'
      if (filtro === 'scadute') return item.dl < 0 && item.sf.stato !== 'Completata'
      if (filtro === 'settimana') return item.dl >= 0 && item.dl <= 7 && item.sf.stato !== 'Completata'
      if (filtro === 'completate') return item.sf.stato === 'Completata'
      return true
    })
    .sort((a, b) => a.sf.scad > b.sf.scad ? 1 : -1)

  // Statistiche
  const totAperte = sottofasi.filter(s => s.scad && s.stato !== 'Completata').length
  const totScadute = sottofasi.filter(s => s.scad && getDaysLeft(s.scad) < 0 && s.stato !== 'Completata').length
  const totSettimana = sottofasi.filter(s => s.scad && getDaysLeft(s.scad) >= 0 && getDaysLeft(s.scad) <= 7 && s.stato !== 'Completata').length
  const totCompletate = sottofasi.filter(s => s.stato === 'Completata').length

  // Raggruppa per mese
  const perMese = {}
  scadenze.forEach(item => {
    const key = item.sf.scad.slice(0,7)
    const label = new Date(item.sf.scad+'T00:00:00').toLocaleDateString('it-IT', {month:'long', year:'numeric'})
    if (!perMese[key]) perMese[key] = { label, items: [] }
    perMese[key].items.push(item)
  })

  return (
    <div>
      <h2 style={{margin:'0 0 20px',color:'#1e293b',fontSize:18}}>📅 Dashboard Scadenze</h2>

      {/* Statistiche */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:12,marginBottom:24}}>
        {[
          {label:'Aperte', val:totAperte, color:'#1d4ed8', bg:'#eff6ff', f:'aperte'},
          {label:'Scadute', val:totScadute, color:'#dc2626', bg:'#fef2f2', f:'scadute'},
          {label:'Questa settimana', val:totSettimana, color:'#d97706', bg:'#fffbeb', f:'settimana'},
          {label:'Completate', val:totCompletate, color:'#15803d', bg:'#f0fdf4', f:'completate'},
        ].map(s => (
          <div key={s.f} onClick={() => setFiltro(s.f)}
            style={{background:filtro===s.f?s.bg:'#fff',borderRadius:10,padding:'16px',border:`2px solid ${filtro===s.f?s.color:'#e2e8f0'}`,cursor:'pointer',transition:'all .15s'}}>
            <div style={{fontSize:28,fontWeight:700,color:s.color}}>{s.val}</div>
            <div style={{fontSize:13,color:'#64748b',marginTop:4}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filtro rapido */}
      <div style={{display:'flex',gap:8,marginBottom:20,flexWrap:'wrap'}}>
        {[
          {id:'aperte', label:'Tutte aperte'},
          {id:'scadute', label:'🔴 Scadute'},
          {id:'settimana', label:'🟡 Questa settimana'},
          {id:'completate', label:'✅ Completate'},
          {id:'tutte', label:'Mostra tutto'},
        ].map(f => (
          <button key={f.id} onClick={() => setFiltro(f.id)}
            style={{padding:'6px 14px',borderRadius:20,border:`1px solid ${filtro===f.id?TEAL:'#e2e8f0'}`,background:filtro===f.id?TEAL:'#fff',color:filtro===f.id?'#fff':'#64748b',cursor:'pointer',fontSize:13,fontWeight:filtro===f.id?600:400}}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista raggruppata per mese */}
      {Object.keys(perMese).length === 0 ? (
        <div style={{color:'#94a3b8',fontSize:14,padding:'32px',textAlign:'center',background:'#fff',borderRadius:10,border:'1px solid #e2e8f0'}}>
          Nessuna scadenza per il filtro selezionato.
        </div>
      ) : (
        Object.entries(perMese).map(([key, {label, items}]) => {
          const hasPast = items.some(x => x.dl < 0)
          const hasUrgent = items.some(x => x.dl >= 0 && x.dl <= 7)
          const headerCol = hasPast ? '#dc2626' : hasUrgent ? '#d97706' : TEAL
          return (
            <div key={key} style={{marginBottom:20}}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
                <div style={{background:headerCol,borderRadius:6,padding:'3px 12px'}}>
                  <span style={{fontSize:13,fontWeight:700,color:'#fff',textTransform:'capitalize'}}>{label}</span>
                </div>
                <span style={{fontSize:12,color:'#94a3b8'}}>{items.length} scadenz{items.length===1?'a':'e'}</span>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {items.map(({sf, com, dl}) => {
                  const dlCol = getDaysColor(dl)
                  const sc = STATO_COLORS[sf.stato] || STATO_COLORS['Sospesa']
                  const comCol = cCol(sf.com_id)
                  return (
                    <div key={sf.id} style={{background:'#fff',borderRadius:10,padding:'14px 18px',border:'1px solid #e2e8f0',display:'flex',alignItems:'center',gap:16,flexWrap:'wrap'}}>
                      <div style={{width:4,height:40,borderRadius:2,background:comCol,flexShrink:0}}/>
                      <div style={{flex:1,minWidth:200}}>
                        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                          <span style={{fontWeight:700,color:comCol,fontSize:12}}>{com?.cod || sf.com_id}</span>
                          <span style={{fontSize:11,padding:'1px 8px',borderRadius:8,background:sc.bg,color:sc.text,fontWeight:600}}>
                            {sf.stato}
                          </span>
                        </div>
                        <div style={{fontWeight:600,color:'#1e293b',fontSize:14}}>{sf.nome}</div>
                        <div style={{fontSize:12,color:'#64748b',marginTop:2}}>{com?.cli}</div>
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:12,flexShrink:0}}>
                        <div style={{textAlign:'right'}}>
                          <div style={{fontSize:12,color:'#64748b'}}>Scadenza</div>
                          <div style={{fontSize:13,fontWeight:700,color:'#1e293b'}}>{disp(sf.scad)}</div>
                        </div>
                        <div style={{background:dlCol+'18',borderRadius:8,padding:'6px 12px',textAlign:'center',minWidth:80}}>
                          <div style={{fontSize:13,fontWeight:700,color:dlCol}}>{getDaysLabel(dl)}</div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}