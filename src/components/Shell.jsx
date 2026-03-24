import { useState, useEffect } from 'react'
import axios from 'axios'
import CalendarioRisorse from './CalendarioRisorse'
import NuovaCommessa from './NuovaCommessa'
import Sottofasi from './Sottofasi'
import DashboardScadenze from './DashboardScadenze'
import ImportaSharePoint from './ImportaSharePoint'

const TEAL = "#0d5c63"

export default function Shell({ currentBU, currentRole, onLogout, onGlobalLogout, user, API }) {
  const [commesse, setCommesse] = useState([])
  const [risorse, setRisorse] = useState([])
  const [allocazioni, setAllocazioni] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('calendario')

  const [utenti, setUtenti] = useState([])
  const [buList, setBuList] = useState([])
  const [nuovaEmail, setNuovaEmail] = useState('')
  const [nuovaBU, setNuovaBU] = useState('')
  const [nuovoRuolo, setNuovoRuolo] = useState('Membro')
  const [savingUtente, setSavingUtente] = useState(false)

  useEffect(() => {
    if (!currentBU) return
    const bid = currentBU.id
    setLoading(true)
    Promise.all([
      axios.get(`${API}/commesse/${bid}`),
      axios.get(`${API}/risorse/${bid}`),
      axios.get(`${API}/allocazioni/${bid}`),
    ]).then(([c, r, a]) => {
      setCommesse(c.data)
      setRisorse(r.data)
      setAllocazioni(a.data)
      setLoading(false)
    })
  }, [currentBU])

  useEffect(() => {
    if (currentRole !== 'Admin') return
    Promise.all([
      axios.get(`${API}/utenti`),
      axios.get(`${API}/bu`),
    ]).then(([u, b]) => {
      setUtenti(u.data)
      setBuList(b.data)
      if (b.data.length > 0) setNuovaBU(b.data[0].id)
    })
  }, [currentRole])

  const handleSalvaUtente = async () => {
    if (!nuovaEmail.trim() || !nuovaBU) return
    setSavingUtente(true)
    const r = await axios.post(`${API}/utenti`, {
      email: nuovaEmail.trim(),
      bu_id: nuovaBU,
      ruolo: nuovoRuolo
    })
    setUtenti(p => {
      const exists = p.find(u => u.email === r.data.email)
      if (exists) return p.map(u => u.email === r.data.email ? r.data : u)
      return [...p, r.data]
    })
    setNuovaEmail('')
    setSavingUtente(false)
  }

  const handleDeleteUtente = async (email) => {
    if (!window.confirm(`Rimuovere ${email}?`)) return
    await axios.delete(`${API}/utenti/${email}`)
    setUtenti(p => p.filter(u => u.email !== email))
  }

  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',color:TEAL,fontFamily:'sans-serif'}}>
      Caricamento dati...
    </div>
  )

  const tabs = [
    {id:'calendario',   label:'📅 Calendario'},
    {id:'scadenze',     label:'⏰ Scadenze'},
    {id:'commesse',     label:'📋 Commesse'},
    {id:'sottofasi',    label:'📌 Sottofasi'},
    {id:'risorse',      label:'👥 Risorse'},
    ...(currentRole === 'Admin' || currentRole === 'Coordinatore' ? [
      {id:'nuova-commessa', label:'➕ Nuova Commessa'},
      {id:'sharepoint',     label:'📁 SharePoint'},
    ] : []),
    ...(currentRole === 'Admin' ? [{id:'utenti', label:'⚙️ Utenti'}] : []),
  ]

  return (
    <div style={{minHeight:'100vh',background:'#f8fafc',fontFamily:'sans-serif'}}>

      <div style={{background:TEAL,color:'#fff',padding:'0 24px',display:'flex',alignItems:'center',justifyContent:'space-between',height:56,flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <span style={{fontWeight:700,fontSize:16}}>Gestione Risorse</span>
          <span style={{background:'rgba(255,255,255,0.2)',borderRadius:6,padding:'2px 10px',fontSize:12}}>{currentBU?.nome}</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <span style={{fontSize:13}}>{user?.name || user?.username}</span>
          <span style={{background:'rgba(255,255,255,0.2)',borderRadius:6,padding:'2px 10px',fontSize:12,fontWeight:600}}>
            {currentRole}
          </span>
          <button onClick={onLogout}
            style={{background:'rgba(255,255,255,0.15)',border:'none',color:'#fff',padding:'5px 12px',borderRadius:6,cursor:'pointer',fontSize:12}}>
            Cambia BU
          </button>
          <button onClick={onGlobalLogout}
            style={{background:'rgba(255,255,255,0.15)',border:'none',color:'#fff',padding:'5px 12px',borderRadius:6,cursor:'pointer',fontSize:12}}>
            Esci
          </button>
        </div>
      </div>

      <div style={{background:'#fff',borderBottom:'1px solid #e2e8f0',padding:'0 24px',display:'flex',gap:4,overflowX:'auto'}}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{padding:'14px 20px',border:'none',background:'none',cursor:'pointer',fontSize:14,fontWeight:tab===t.id?700:400,color:tab===t.id?TEAL:'#64748b',borderBottom:tab===t.id?`2px solid ${TEAL}`:'2px solid transparent',whiteSpace:'nowrap'}}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{padding:24}}>

        {tab === 'calendario' && (
          <CalendarioRisorse
            currentBU={currentBU}
            risorse={risorse}
            commesse={commesse}
            allocazioni={allocazioni}
            setAllocazioni={setAllocazioni}
            API={API}
          />
        )}

        {tab === 'scadenze' && (
          <DashboardScadenze
            currentBU={currentBU}
            commesse={commesse}
            API={API}
          />
        )}

        {tab === 'commesse' && (
          <div>
            <h2 style={{margin:'0 0 16px',color:'#1e293b',fontSize:18}}>Commesse — {commesse.length}</h2>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))',gap:16}}>
              {commesse.map(c => (
                <div key={c.id} style={{background:'#fff',borderRadius:10,padding:'16px 20px',border:'1px solid #e2e8f0',boxShadow:'0 1px 4px #0001'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
                    <span style={{fontWeight:700,color:TEAL,fontSize:13}}>{c.cod}</span>
                    <span style={{fontSize:11,padding:'2px 8px',borderRadius:10,background:c.stato==='Attiva'?'#f0fdf4':'#eff6ff',color:c.stato==='Attiva'?'#15803d':'#1d4ed8',fontWeight:600}}>{c.stato}</span>
                  </div>
                  <div style={{fontWeight:600,color:'#1e293b',fontSize:14,marginBottom:4}}>{c.tit}</div>
                  <div style={{color:'#64748b',fontSize:12}}>{c.cli}</div>
                  <div style={{marginTop:8,fontSize:11,color:'#94a3b8',display:'flex',alignItems:'center',gap:6}}>
                    {c.src === 'SharePoint' ? '📁 SharePoint' : '🖥 Server'}
                    {c.sharepoint_url && (
                      <a href={c.sharepoint_url} target="_blank" rel="noreferrer"
                        style={{color:TEAL,fontSize:11,textDecoration:'none'}}>↗ Apri sito</a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'sottofasi' && (
          <Sottofasi
            currentBU={currentBU}
            commesse={commesse}
            API={API}
            currentRole={currentRole}
          />
        )}

        {tab === 'risorse' && (
          <div>
            <h2 style={{margin:'0 0 16px',color:'#1e293b',fontSize:18}}>Risorse — {risorse.length}</h2>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:12}}>
              {risorse.map(r => (
                <div key={r.id} style={{background:'#fff',borderRadius:10,padding:'14px 18px',border:'1px solid #e2e8f0',display:'flex',alignItems:'center',gap:12}}>
                  <div style={{width:40,height:40,borderRadius:10,background:TEAL,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:14,flexShrink:0}}>
                    {r.nome?.[0]}{r.cogn?.[0]}
                  </div>
                  <div>
                    <div style={{fontWeight:600,color:'#1e293b',fontSize:14}}>{r.nome} {r.cogn}</div>
                    <div style={{color:'#64748b',fontSize:12}}>{r.ruolo}</div>
                    <div style={{color:'#94a3b8',fontSize:11}}>{r.email}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'nuova-commessa' && (currentRole === 'Admin' || currentRole === 'Coordinatore') && (
          <NuovaCommessa
            currentBU={currentBU}
            commesse={commesse}
            setCommesse={setCommesse}
            setTab={setTab}
            API={API}
          />
        )}

        {tab === 'sharepoint' && (currentRole === 'Admin' || currentRole === 'Coordinatore') && (
          <ImportaSharePoint
            currentBU={currentBU}
            commesse={commesse}
            setCommesse={setCommesse}
            setTab={setTab}
            API={API}
          />
        )}

        {tab === 'utenti' && currentRole === 'Admin' && (
          <div style={{maxWidth:700}}>
            <h2 style={{margin:'0 0 20px',color:'#1e293b',fontSize:18}}>⚙️ Gestione Utenti</h2>
            <div style={{background:'#fff',borderRadius:12,padding:20,border:'1px solid #e2e8f0',marginBottom:24}}>
              <h3 style={{margin:'0 0 16px',fontSize:15,color:TEAL}}>Assegna utente a BU</h3>
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                <div>
                  <label style={{fontSize:13,color:'#64748b',display:'block',marginBottom:4}}>Email account Microsoft</label>
                  <input value={nuovaEmail} onChange={e => setNuovaEmail(e.target.value)}
                    placeholder="utente@azienda.it"
                    style={{width:'100%',padding:'8px 12px',borderRadius:7,border:'1px solid #e2e8f0',fontSize:14,outline:'none',boxSizing:'border-box'}}/>
                </div>
                <div style={{display:'flex',gap:12}}>
                  <div style={{flex:1}}>
                    <label style={{fontSize:13,color:'#64748b',display:'block',marginBottom:4}}>Business Unit</label>
                    <select value={nuovaBU} onChange={e => setNuovaBU(e.target.value)}
                      style={{width:'100%',padding:'8px 12px',borderRadius:7,border:'1px solid #e2e8f0',fontSize:14,outline:'none'}}>
                      {buList.map(b => <option key={b.id} value={b.id}>{b.nome}</option>)}
                    </select>
                  </div>
                  <div style={{flex:1}}>
                    <label style={{fontSize:13,color:'#64748b',display:'block',marginBottom:4}}>Ruolo</label>
                    <select value={nuovoRuolo} onChange={e => setNuovoRuolo(e.target.value)}
                      style={{width:'100%',padding:'8px 12px',borderRadius:7,border:'1px solid #e2e8f0',fontSize:14,outline:'none'}}>
                      <option value="Coordinatore">Coordinatore</option>
                      <option value="Membro">Membro</option>
                    </select>
                  </div>
                </div>
                <button onClick={handleSalvaUtente} disabled={savingUtente}
                  style={{padding:'10px',borderRadius:8,border:'none',background:TEAL,color:'#fff',fontWeight:700,cursor:'pointer',fontSize:14,marginTop:4}}>
                  {savingUtente ? 'Salvataggio...' : 'Assegna utente'}
                </button>
              </div>
            </div>
            <div style={{background:'#fff',borderRadius:12,border:'1px solid #e2e8f0',overflow:'hidden'}}>
              <div style={{padding:'14px 20px',borderBottom:'1px solid #e2e8f0',fontWeight:700,fontSize:14,color:'#1e293b'}}>
                Utenti assegnati — {utenti.length}
              </div>
              {utenti.length === 0 ? (
                <div style={{padding:20,color:'#94a3b8',fontSize:14}}>Nessun utente assegnato.</div>
              ) : (
                utenti.map(u => {
                  const bu = buList.find(b => b.id === u.bu_id)
                  return (
                    <div key={u.email} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 20px',borderBottom:'1px solid #f1f5f9'}}>
                      <div>
                        <div style={{fontWeight:600,fontSize:14,color:'#1e293b'}}>{u.email}</div>
                        <div style={{fontSize:12,color:'#64748b',marginTop:2}}>
                          {bu?.nome || u.bu_id} — <span style={{color:TEAL,fontWeight:600}}>{u.ruolo}</span>
                        </div>
                      </div>
                      <button onClick={() => handleDeleteUtente(u.email)}
                        style={{background:'none',border:'none',color:'#94a3b8',cursor:'pointer',fontSize:16,padding:'4px 8px',borderRadius:6}}
                        onMouseEnter={e => e.currentTarget.style.color='#ef4444'}
                        onMouseLeave={e => e.currentTarget.style.color='#94a3b8'}>
                        ✕
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}