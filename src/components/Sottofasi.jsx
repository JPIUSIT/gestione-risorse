import { useState, useEffect } from 'react'
import axios from 'axios'

const TEAL = "#0d5c63"
const STATI_SF = ['In corso', 'Completata', 'In attesa', 'Sospesa']
const STATO_COLORS = {
  'In corso':   { bg:'#eff6ff', text:'#1d4ed8', border:'#bfdbfe' },
  'Completata': { bg:'#f0fdf4', text:'#15803d', border:'#bbf7d0' },
  'In attesa':  { bg:'#fffbeb', text:'#92400e', border:'#fcd34d' },
  'Sospesa':    { bg:'#f8fafc', text:'#475569', border:'#e2e8f0' },
}

export default function Sottofasi({ currentBU, commesse, API, currentRole }) {
  const [sottofasi, setSottofasi] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCom, setSelectedCom] = useState('tutte')
  const [showForm, setShowForm] = useState(false)
  const [editingSf, setEditingSf] = useState(null)

  // Form state
  const [fNome, setFNome] = useState('')
  const [fScad, setFScad] = useState('')
  const [fStato, setFStato] = useState('In corso')
  const [fComId, setFComId] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!currentBU) return
    axios.get(`${API}/sottofasi/${currentBU.id}`)
      .then(r => { setSottofasi(r.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [currentBU])

  const openNew = () => {
    setEditingSf(null)
    setFNome(''); setFScad(''); setFStato('In corso')
    setFComId(commesse[0]?.id || '')
    setShowForm(true)
  }

  const openEdit = (sf) => {
    setEditingSf(sf)
    setFNome(sf.nome); setFScad(sf.scad || ''); setFStato(sf.stato)
    setFComId(sf.com_id)
    setShowForm(true)
  }

  const handleSalva = async () => {
    if (!fNome.trim() || !fComId) return
    setSaving(true)
    if (editingSf) {
      await axios.put(`${API}/sottofasi/${editingSf.id}`, { nome: fNome, scad: fScad || null, stato: fStato })
      setSottofasi(p => p.map(s => s.id === editingSf.id ? { ...s, nome: fNome, scad: fScad || null, stato: fStato } : s))
    } else {
      const r = await axios.post(`${API}/sottofasi`, {
        com_id: fComId,
        bu_id: currentBU.id,
        nome: fNome,
        scad: fScad || null,
        stato: fStato
      })
      setSottofasi(p => [...p, r.data])
    }
    setSaving(false)
    setShowForm(false)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Eliminare questa sottofase?')) return
    await axios.delete(`${API}/sottofasi/${id}`)
    setSottofasi(p => p.filter(s => s.id !== id))
  }

  const today = new Date().toISOString().split('T')[0]

  const getDaysLeft = (scad) => {
    if (!scad) return null
    const diff = Math.round((new Date(scad + 'T00:00:00') - new Date(today + 'T00:00:00')) / 86400000)
    return diff
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

  const commesseAttive = commesse.filter(c => c.stato === 'Attiva' || c.stato === 'Pianificata')

  const sfFiltrate = sottofasi
    .filter(s => selectedCom === 'tutte' || s.com_id === selectedCom)
    .sort((a, b) => {
      if (!a.scad && !b.scad) return 0
      if (!a.scad) return 1
      if (!b.scad) return -1
      return a.scad > b.scad ? 1 : -1
    })

  const canEdit = currentRole === 'Admin' || currentRole === 'Coordinatore'

  if (loading) return <div style={{color:'#94a3b8',fontSize:14}}>Caricamento sottofasi...</div>

  return (
    <div>
      {/* Header */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20,flexWrap:'wrap',gap:12}}>
        <h2 style={{margin:0,color:'#1e293b',fontSize:18}}>📌 Sottofasi — {sfFiltrate.length}</h2>
        <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
          <select value={selectedCom} onChange={e => setSelectedCom(e.target.value)}
            style={{padding:'7px 12px',borderRadius:7,border:'1px solid #e2e8f0',fontSize:13,outline:'none',color:'#1e293b'}}>
            <option value="tutte">Tutte le commesse</option>
            {commesse.map(c => <option key={c.id} value={c.id}>{c.cod} — {c.tit?.slice(0,30)}</option>)}
          </select>
          {canEdit && (
            <button onClick={openNew}
              style={{padding:'7px 16px',borderRadius:7,border:'none',background:TEAL,color:'#fff',fontWeight:600,cursor:'pointer',fontSize:13}}>
              + Nuova sottofase
            </button>
          )}
        </div>
      </div>

      {/* Lista sottofasi */}
      {sfFiltrate.length === 0 ? (
        <div style={{color:'#94a3b8',fontSize:14,padding:'32px',textAlign:'center',background:'#fff',borderRadius:10,border:'1px solid #e2e8f0'}}>
          Nessuna sottofase. {canEdit && 'Clicca "+ Nuova sottofase" per aggiungerne una.'}
        </div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {sfFiltrate.map(sf => {
            const com = commesse.find(c => c.id === sf.com_id)
            const dl = getDaysLeft(sf.scad)
            const dlCol = getDaysColor(dl)
            const sc = STATO_COLORS[sf.stato] || STATO_COLORS['Sospesa']
            return (
              <div key={sf.id} style={{background:'#fff',borderRadius:10,padding:'14px 18px',border:'1px solid #e2e8f0',display:'flex',alignItems:'center',gap:16,flexWrap:'wrap'}}>
                <div style={{flex:1,minWidth:200}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                    <span style={{fontWeight:700,color:TEAL,fontSize:12}}>{com?.cod || sf.com_id}</span>
                    <span style={{fontSize:11,padding:'1px 8px',borderRadius:8,background:sc.bg,color:sc.text,border:`1px solid ${sc.border}`,fontWeight:600}}>
                      {sf.stato}
                    </span>
                  </div>
                  <div style={{fontWeight:600,color:'#1e293b',fontSize:14}}>{sf.nome}</div>
                  <div style={{fontSize:12,color:'#64748b',marginTop:2}}>{com?.tit?.slice(0,50)}</div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:16,flexShrink:0}}>
                  {sf.scad && (
                    <div style={{textAlign:'right'}}>
                      <div style={{fontSize:12,color:'#64748b'}}>Scadenza</div>
                      <div style={{fontSize:13,fontWeight:700,color:'#1e293b'}}>
                        {sf.scad.split('-').reverse().join('/')}
                      </div>
                    </div>
                  )}
                  <div style={{background:dlCol+'15',borderRadius:8,padding:'4px 10px',textAlign:'center',minWidth:70}}>
                    <div style={{fontSize:12,fontWeight:700,color:dlCol}}>{getDaysLabel(dl)}</div>
                  </div>
                  {canEdit && (
                    <div style={{display:'flex',gap:6}}>
                      <button onClick={() => openEdit(sf)}
                        style={{padding:'5px 10px',borderRadius:6,border:'1px solid #e2e8f0',background:'#fff',cursor:'pointer',fontSize:12,color:'#64748b'}}>
                        ✏️
                      </button>
                      <button onClick={() => handleDelete(sf.id)}
                        style={{padding:'5px 10px',borderRadius:6,border:'1px solid #fee2e2',background:'#fff',cursor:'pointer',fontSize:12,color:'#ef4444'}}>
                        🗑
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal form */}
      {showForm && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.3)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
          <div style={{background:'#fff',borderRadius:14,padding:28,minWidth:380,maxWidth:480,width:'90%',boxShadow:'0 8px 40px #0003'}}>
            <h3 style={{margin:'0 0 20px',color:TEAL,fontSize:16}}>
              {editingSf ? 'Modifica sottofase' : 'Nuova sottofase'}
            </h3>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              {!editingSf && (
                <div>
                  <label style={{fontSize:13,color:'#64748b',display:'block',marginBottom:4}}>Commessa</label>
                  <select value={fComId} onChange={e => setFComId(e.target.value)}
                    style={{width:'100%',padding:'8px 12px',borderRadius:7,border:'1px solid #e2e8f0',fontSize:14,outline:'none'}}>
                    {commesseAttive.map(c => <option key={c.id} value={c.id}>{c.cod} — {c.tit?.slice(0,40)}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label style={{fontSize:13,color:'#64748b',display:'block',marginBottom:4}}>Nome sottofase *</label>
                <input value={fNome} onChange={e => setFNome(e.target.value)}
                  placeholder="es. Progettazione preliminare"
                  style={{width:'100%',padding:'8px 12px',borderRadius:7,border:'1px solid #e2e8f0',fontSize:14,outline:'none',boxSizing:'border-box'}}/>
              </div>
              <div style={{display:'flex',gap:12}}>
                <div style={{flex:1}}>
                  <label style={{fontSize:13,color:'#64748b',display:'block',marginBottom:4}}>Scadenza</label>
                  <input type="date" value={fScad} onChange={e => setFScad(e.target.value)}
                    style={{width:'100%',padding:'8px 12px',borderRadius:7,border:'1px solid #e2e8f0',fontSize:14,outline:'none',boxSizing:'border-box'}}/>
                </div>
                <div style={{flex:1}}>
                  <label style={{fontSize:13,color:'#64748b',display:'block',marginBottom:4}}>Stato</label>
                  <select value={fStato} onChange={e => setFStato(e.target.value)}
                    style={{width:'100%',padding:'8px 12px',borderRadius:7,border:'1px solid #e2e8f0',fontSize:14,outline:'none'}}>
                    {STATI_SF.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div style={{display:'flex',gap:10,marginTop:8}}>
                <button onClick={handleSalva} disabled={saving}
                  style={{flex:1,padding:'10px',borderRadius:8,border:'none',background:TEAL,color:'#fff',fontWeight:700,cursor:'pointer',fontSize:14}}>
                  {saving ? 'Salvataggio...' : 'Salva'}
                </button>
                <button onClick={() => setShowForm(false)}
                  style={{flex:1,padding:'10px',borderRadius:8,border:'1px solid #e2e8f0',background:'#fff',cursor:'pointer',fontSize:14}}>
                  Annulla
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}