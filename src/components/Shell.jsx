import { useState, useEffect } from 'react'
import axios from 'axios'
import CalendarioRisorse from './CalendarioRisorse'

const TEAL = "#0d5c63"

export default function Shell({ currentBU, currentRole, onLogout, onGlobalLogout, user, API }) {
  const [commesse, setCommesse] = useState([])
  const [risorse, setRisorse] = useState([])
  const [allocazioni, setAllocazioni] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('calendario')

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

  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',color:TEAL,fontFamily:'sans-serif'}}>
      Caricamento dati...
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:'#f8fafc',fontFamily:'sans-serif'}}>

      {/* Header */}
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

      {/* Tab bar */}
      <div style={{background:'#fff',borderBottom:'1px solid #e2e8f0',padding:'0 24px',display:'flex',gap:4}}>
        {[
          {id:'calendario', label:'📅 Calendario'},
          {id:'commesse',   label:'📋 Commesse'},
          {id:'risorse',    label:'👥 Risorse'},
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{padding:'14px 20px',border:'none',background:'none',cursor:'pointer',fontSize:14,fontWeight:tab===t.id?700:400,color:tab===t.id?TEAL:'#64748b',borderBottom:tab===t.id?`2px solid ${TEAL}`:'2px solid transparent'}}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Contenuto */}
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
                  <div style={{marginTop:8,fontSize:11,color:'#94a3b8'}}>
                    {c.src === 'SharePoint' ? '📁 SharePoint' : '🖥 Server'}
                  </div>
                </div>
              ))}
            </div>
          </div>
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

      </div>
    </div>
  )
}