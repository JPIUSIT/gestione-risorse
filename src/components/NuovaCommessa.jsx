import { useState } from 'react'
import axios from 'axios'

const TEAL = "#0d5c63"
const STATI = ['Pianificata', 'Attiva', 'In chiusura', 'Chiusa']

export default function NuovaCommessa({ currentBU, commesse, setCommesse, setTab, API }) {
  const [cod, setCod] = useState('')
  const [tit, setTit] = useState('')
  const [cli, setCli] = useState('')
  const [stato, setStato] = useState('Pianificata')
  const [saving, setSaving] = useState(false)
  const [errore, setErrore] = useState('')
  const [successo, setSuccesso] = useState('')

  const handleSalva = async () => {
    setErrore('')
    setSuccesso('')
    if (!cod.trim()) { setErrore('Il codice commessa è obbligatorio'); return }
    if (!tit.trim()) { setErrore('Il titolo è obbligatorio'); return }
    if (!cli.trim()) { setErrore('Il cliente è obbligatorio'); return }
    if (commesse.find(c => c.cod.toLowerCase() === cod.trim().toLowerCase())) {
      setErrore(`Esiste già una commessa con codice "${cod.trim()}"`)
      return
    }
    setSaving(true)
    try {
      const r = await axios.post(`${API}/commesse`, {
        bu_id: currentBU.id,
        cod: cod.trim(),
        tit: tit.trim(),
        cli: cli.trim(),
        stato,
        src: 'Server'
      })
      setCommesse(p => [...p, r.data])
      setSuccesso(`Commessa "${cod.trim()}" creata con successo!`)
      setCod(''); setTit(''); setCli(''); setStato('Pianificata')
    } catch(e) {
      setErrore('Errore durante il salvataggio. Riprova.')
    }
    setSaving(false)
  }

  return (
    <div style={{maxWidth:600}}>
      <h2 style={{margin:'0 0 20px',color:'#1e293b',fontSize:18}}>➕ Nuova Commessa</h2>
      <div style={{background:'#fff',borderRadius:12,padding:24,border:'1px solid #e2e8f0'}}>
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <div style={{display:'flex',gap:12}}>
            <div style={{flex:1}}>
              <label style={{fontSize:13,color:'#64748b',display:'block',marginBottom:4}}>Codice commessa *</label>
              <input value={cod} onChange={e => setCod(e.target.value)}
                placeholder="es. 25-045"
                style={{width:'100%',padding:'9px 12px',borderRadius:7,border:'1px solid #e2e8f0',fontSize:14,outline:'none',boxSizing:'border-box'}}/>
            </div>
            <div style={{flex:1}}>
              <label style={{fontSize:13,color:'#64748b',display:'block',marginBottom:4}}>Stato</label>
              <select value={stato} onChange={e => setStato(e.target.value)}
                style={{width:'100%',padding:'9px 12px',borderRadius:7,border:'1px solid #e2e8f0',fontSize:14,outline:'none'}}>
                {STATI.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={{fontSize:13,color:'#64748b',display:'block',marginBottom:4}}>Titolo / Descrizione *</label>
            <input value={tit} onChange={e => setTit(e.target.value)}
              placeholder="es. Ristrutturazione rete idrica centro città"
              style={{width:'100%',padding:'9px 12px',borderRadius:7,border:'1px solid #e2e8f0',fontSize:14,outline:'none',boxSizing:'border-box'}}/>
          </div>
          <div>
            <label style={{fontSize:13,color:'#64748b',display:'block',marginBottom:4}}>Cliente *</label>
            <input value={cli} onChange={e => setCli(e.target.value)}
              placeholder="es. Comune di Milano"
              style={{width:'100%',padding:'9px 12px',borderRadius:7,border:'1px solid #e2e8f0',fontSize:14,outline:'none',boxSizing:'border-box'}}/>
          </div>
          <div style={{background:'#f8fafc',borderRadius:8,padding:'10px 14px',fontSize:13,color:'#64748b'}}>
            <strong>BU:</strong> {currentBU?.nome} &nbsp;|&nbsp; <strong>Origine:</strong> 🖥 Server (creata manualmente)
          </div>
          {errore && (
            <div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:8,padding:'10px 14px',fontSize:13,color:'#dc2626'}}>
              ⚠️ {errore}
            </div>
          )}
          {successo && (
            <div style={{background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:8,padding:'10px 14px',fontSize:13,color:'#15803d'}}>
              ✅ {successo}
            </div>
          )}
          <div style={{display:'flex',gap:10,marginTop:4}}>
            <button onClick={handleSalva} disabled={saving}
              style={{flex:1,padding:'11px',borderRadius:8,border:'none',background:TEAL,color:'#fff',fontWeight:700,cursor:'pointer',fontSize:14}}>
              {saving ? 'Salvataggio...' : 'Crea commessa'}
            </button>
            <button onClick={() => setTab('commesse')}
              style={{flex:1,padding:'11px',borderRadius:8,border:'1px solid #e2e8f0',background:'#fff',cursor:'pointer',fontSize:14,color:'#64748b'}}>
              Vedi tutte le commesse
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}