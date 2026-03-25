import { useState, useEffect } from 'react'
import axios from 'axios'
import CalendarioRisorse from './CalendarioRisorse'
import NuovaCommessa from './NuovaCommessa'
import Sottofasi from './Sottofasi'
import DashboardScadenze from './DashboardScadenze'
import ImportaSharePoint from './ImportaSharePoint'

const TEAL = "#0d5c63"
const TEAL2 = "#0a4a50"
const SC = {Pianificata:"#3b82f6",Attiva:"#22c55e","In chiusura":"#f97316",Chiusa:"#94a3b8"}
const AV_PAL = ["#ef4444","#3b82f6","#22c55e","#a855f7","#f59e0b","#06b6d4","#ec4899","#84cc16","#f97316","#6366f1","#14b8a6","#e11d48"]
const cCol = id => { let h=0; for(let i=0;i<(id||"").length;i++) h=(h*31+id.charCodeAt(i))&0xffff; return AV_PAL[h%AV_PAL.length] }

export default function Shell({ currentBU, currentRole, onLogout, onGlobalLogout, user, API }) {
  const [commesse, setCommesse] = useState([])
  const [risorse, setRisorse] = useState([])
  const [categorie, setCategorie] = useState([])
  const [allocazioni, setAllocazioni] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('dashboard')

  // Selezione attiva
  const [selectedCom, setSelectedCom] = useState(null)
  const [selectedRis, setSelectedRis] = useState(null)

  // Filtri commesse
  const [cercaCom, setCercaCom] = useState('')
  const [filtroCliente, setFiltroCliente] = useState('')
  const [filtroStato, setFiltroStato] = useState('')

  // Filtri risorse
  const [cercaRis, setCercaRis] = useState('')

  // Utenti (solo Admin)
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
      // Estrai categorie uniche dalle risorse
      const cats = [...new Map(r.data.filter(x=>x.cat_id).map(x=>[x.cat_id, x.cat_id])).values()]
      setCategorie(cats)
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
    const r = await axios.post(`${API}/utenti`, { email: nuovaEmail.trim(), bu_id: nuovaBU, ruolo: nuovoRuolo })
    setUtenti(p => { const exists = p.find(u => u.email === r.data.email); if (exists) return p.map(u => u.email === r.data.email ? r.data : u); return [...p, r.data] })
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

  // Filtro commesse
  const clienti = [...new Set(commesse.map(c=>c.cli).filter(Boolean))]
  const commesseFiltrate = commesse.filter(c => {
    if (c.arch) return false
    if (cercaCom && !c.cod.toLowerCase().includes(cercaCom.toLowerCase()) && !c.tit?.toLowerCase().includes(cercaCom.toLowerCase())) return false
    if (filtroCliente && c.cli !== filtroCliente) return false
    if (filtroStato && c.stato !== filtroStato) return false
    return true
  })

  // Raggruppamento risorse per cat_id
  const catMap = {}
  risorse.forEach(r => {
    const cat = r.cat_id || 'altro'
    if (!catMap[cat]) catMap[cat] = []
    catMap[cat].push(r)
  })

  // Filtra risorse
  const risorseFiltrate = risorse.filter(r =>
    !cercaRis || `${r.nome} ${r.cogn}`.toLowerCase().includes(cercaRis.toLowerCase()) || r.ruolo?.toLowerCase().includes(cercaRis.toLowerCase())
  )
  const catMapFiltrate = {}
  risorseFiltrate.forEach(r => {
    const cat = r.cat_id || 'altro'
    if (!catMapFiltrate[cat]) catMapFiltrate[cat] = []
    catMapFiltrate[cat].push(r)
  })

  const TABS = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'riepilogo', label: 'Riepilogo Risorse' },
    { id: 'commesse', label: 'Gestione Commesse' },
    { id: 'risorse_tab', label: 'Gestione Risorse' },
    { id: 'scadenziario', label: 'Scadenziario' },
    ...(currentRole === 'Admin' ? [{ id: 'utenti', label: '⚙️ Utenti' }] : []),
  ]

  return (
    <div style={{height:'100vh',display:'flex',flexDirection:'column',fontFamily:'sans-serif',background:'#f0f4f8'}}>

      {/* Header */}
      <div style={{background:TEAL,color:'#fff',padding:'0 16px',display:'flex',alignItems:'center',justifyContent:'space-between',height:44,flexShrink:0,zIndex:10}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <span style={{fontWeight:700,fontSize:15,letterSpacing:0.5}}>J+S</span>
          <span style={{color:'rgba(255,255,255,0.5)',fontSize:14}}>|</span>
          <span style={{fontWeight:600,fontSize:13}}>Gestione Risorse BU</span>
          <div style={{display:'flex',alignItems:'center',gap:6,marginLeft:8,background:'rgba(255,255,255,0.12)',borderRadius:6,padding:'2px 10px'}}>
            <span style={{fontSize:12,fontWeight:700}}>{currentBU?.codice || currentBU?.nome}</span>
            <span style={{fontSize:10,color:'rgba(255,255,255,0.6)'}}>⇄</span>
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <span style={{fontSize:12,color:'rgba(255,255,255,0.7)'}}>Ruolo:</span>
          <span style={{fontSize:12,color:'rgba(255,255,255,0.5)',textDecoration:currentRole==='Coordinatore'?'none':'underline',cursor:'pointer'}}
            onClick={() => currentRole!=='Coordinatore' && onLogout()}>Coordinatore</span>
          <span style={{fontSize:12,color:'rgba(255,255,255,0.3)'}}>|</span>
          <span style={{fontSize:12,color:'rgba(255,255,255,0.5)',cursor:'pointer'}}
            onClick={() => currentRole==='Membro' && onLogout()}>Membro</span>
          <div style={{width:1,height:20,background:'rgba(255,255,255,0.2)',margin:'0 4px'}}/>
          <span style={{fontSize:12,color:'rgba(255,255,255,0.8)'}}>{user?.name || user?.username}</span>
          <button onClick={onGlobalLogout}
            style={{background:'rgba(255,255,255,0.15)',border:'none',color:'#fff',padding:'3px 10px',borderRadius:5,cursor:'pointer',fontSize:11}}>
            Esci
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{background:TEAL2,display:'flex',gap:0,flexShrink:0,borderBottom:`2px solid rgba(255,255,255,0.1)`}}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{padding:'8px 18px',border:'none',background:tab===t.id?'rgba(255,255,255,0.12)':'none',cursor:'pointer',fontSize:12,fontWeight:tab===t.id?700:400,color:tab===t.id?'#fff':'rgba(255,255,255,0.6)',borderBottom:tab===t.id?'2px solid #fff':'2px solid transparent',whiteSpace:'nowrap',transition:'all .15s'}}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div style={{flex:1,overflow:'hidden',display:'flex',minHeight:0}}>

        {/* DASHBOARD — layout 3 colonne */}
        {tab === 'dashboard' && (
          <div style={{flex:1,display:'flex',overflow:'hidden',height:'100%'}}>

            {/* Colonna 1 — Commesse */}
            <div style={{width:240,flexShrink:0,borderRight:'1px solid #e2e8f0',background:'#fff',display:'flex',flexDirection:'column',overflow:'hidden'}}>
              <div style={{padding:'8px 10px',borderBottom:'1px solid #e2e8f0',flexShrink:0}}>
                <div style={{fontSize:12,fontWeight:700,color:'#64748b',marginBottom:6}}>Commesse</div>
                <div style={{position:'relative',marginBottom:6}}>
                  <span style={{position:'absolute',left:7,top:'50%',transform:'translateY(-50%)',fontSize:11,color:'#94a3b8'}}>🔍</span>
                  <input value={cercaCom} onChange={e=>setCercaCom(e.target.value)} placeholder="Cerca commessa..."
                    style={{width:'100%',boxSizing:'border-box',border:'1px solid #e2e8f0',borderRadius:6,padding:'5px 8px 5px 24px',fontSize:11,outline:'none'}}/>
                </div>
                <select value={filtroCliente} onChange={e=>setFiltroCliente(e.target.value)}
                  style={{width:'100%',border:'1px solid #e2e8f0',borderRadius:6,padding:'4px 8px',fontSize:11,marginBottom:4,outline:'none',color:'#1e293b'}}>
                  <option value="">Tutti i clienti</option>
                  {clienti.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
                <select value={filtroStato} onChange={e=>setFiltroStato(e.target.value)}
                  style={{width:'100%',border:'1px solid #e2e8f0',borderRadius:6,padding:'4px 8px',fontSize:11,outline:'none',color:'#1e293b'}}>
                  <option value="">Tutti gli stati</option>
                  {['Pianificata','Attiva','In chiusura','Chiusa'].map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div style={{flex:1,overflowY:'auto'}}>
                {commesseFiltrate.map(c => {
                  const col = SC[c.stato] || '#94a3b8'
                  const isSelected = selectedCom?.id === c.id
                  return (
                    <div key={c.id} onClick={() => setSelectedCom(isSelected ? null : c)}
                      style={{padding:'8px 10px',borderBottom:'1px solid #f1f5f9',cursor:'pointer',background:isSelected?'#f0f9fa':'#fff',borderLeft:`3px solid ${isSelected?TEAL:'transparent'}`}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:2}}>
                        <span style={{fontWeight:700,fontSize:11,color:TEAL}}>{c.cod}</span>
                        <span style={{fontSize:9,padding:'1px 5px',borderRadius:4,background:col+'20',color:col,fontWeight:700,border:`1px solid ${col}40`}}>{c.stato}</span>
                      </div>
                      <div style={{fontSize:11,color:'#1e293b',fontWeight:500,lineHeight:1.3,marginBottom:1}}>{c.tit?.length>35?c.tit.slice(0,33)+'…':c.tit}</div>
                      <div style={{fontSize:10,color:'#94a3b8'}}>{c.cli?.length>30?c.cli.slice(0,28)+'…':c.cli}</div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Colonna 2 — Risorse BU */}
            <div style={{width:230,flexShrink:0,borderRight:'1px solid #e2e8f0',background:'#fff',display:'flex',flexDirection:'column',overflow:'hidden'}}>
              <div style={{padding:'8px 10px',borderBottom:'1px solid #e2e8f0',flexShrink:0}}>
                <div style={{fontSize:12,fontWeight:700,color:'#64748b',marginBottom:6}}>Risorse BU</div>
                {selectedCom && (
                  <div style={{background:'#f0f9fa',border:'1px solid #bfdbfe',borderRadius:5,padding:'3px 7px',fontSize:10,color:TEAL,fontWeight:600,marginBottom:6}}>
                    {selectedCom.cod}
                  </div>
                )}
                <div style={{position:'relative'}}>
                  <span style={{position:'absolute',left:7,top:'50%',transform:'translateY(-50%)',fontSize:11,color:'#94a3b8'}}>🔍</span>
                  <input value={cercaRis} onChange={e=>setCercaRis(e.target.value)} placeholder="Cerca risorsa..."
                    style={{width:'100%',boxSizing:'border-box',border:'1px solid #e2e8f0',borderRadius:6,padding:'5px 8px 5px 24px',fontSize:11,outline:'none'}}/>
                </div>
              </div>
              <div style={{flex:1,overflowY:'auto'}}>
                {Object.entries(catMapFiltrate).map(([catId, ris]) => (
                  <div key={catId}>
                    <div style={{padding:'5px 10px',background:'#f8fafc',borderBottom:'1px solid #e2e8f0',display:'flex',justifyContent:'space-between',alignItems:'center',position:'sticky',top:0,zIndex:1}}>
                      <span style={{fontSize:10,fontWeight:700,color:'#475569',textTransform:'uppercase',letterSpacing:0.5}}>{catId.toUpperCase()}</span>
                      <span style={{fontSize:10,color:'#94a3b8'}}>{ris.length}</span>
                    </div>
                    {ris.map((r, idx) => {
                      const col = cCol(r.id)
                      const isSelected = selectedRis?.id === r.id
                      // Ore settimana corrente
                      const oggi = new Date()
                      const lunedi = new Date(oggi); lunedi.setDate(oggi.getDate() - (oggi.getDay()===0?6:oggi.getDay()-1))
                      const oreSettimana = allocazioni.filter(a => {
                        if (a.ris_id !== r.id) return false
                        const d = new Date(a.data+'T00:00:00')
                        return d >= lunedi && d < new Date(lunedi.getTime() + 7*86400000)
                      }).reduce((s,a) => s+(a.ore||0), 0)
                      return (
                        <div key={r.id} onClick={() => setSelectedRis(isSelected ? null : r)}
                          style={{padding:'7px 10px',borderBottom:'1px solid #f1f5f9',cursor:'pointer',background:isSelected?'#f0f9fa':'#fff',display:'flex',alignItems:'center',gap:8,borderLeft:`3px solid ${isSelected?TEAL:'transparent'}`}}>
                          <div style={{width:28,height:28,borderRadius:'50%',background:`rgba(${parseInt(col.slice(1,3),16)},${parseInt(col.slice(3,5),16)},${parseInt(col.slice(5,7),16)},0.15)`,border:`1.5px solid rgba(${parseInt(col.slice(1,3),16)},${parseInt(col.slice(3,5),16)},${parseInt(col.slice(5,7),16)},0.5)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,color:col,flexShrink:0}}>
                            {r.nome?.[0]}{r.cogn?.[0]}
                          </div>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:11,fontWeight:700,color:'#1e293b'}}>{r.nome} {r.cogn}</div>
                            <div style={{fontSize:10,color:'#94a3b8'}}>{r.ruolo}</div>
                          </div>
                          {oreSettimana > 0 && (
                            <span style={{fontSize:10,fontWeight:700,color:TEAL,background:'#e0f2f1',borderRadius:4,padding:'1px 5px',flexShrink:0}}>{oreSettimana}h</span>
                          )}
                          <button onClick={e => { e.stopPropagation(); setSelectedRis(r); }}
                            style={{width:20,height:20,borderRadius:'50%',border:`1px solid ${col}`,background:'#fff',color:col,fontSize:13,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0,lineHeight:1}}>+</button>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Colonna 3 — Calendario */}
            <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',background:'#f8fafc'}}>
              <CalendarioRisorse
                currentBU={currentBU}
                risorse={risorse}
                commesse={commesse}
                allocazioni={allocazioni}
                setAllocazioni={setAllocazioni}
                selectedCom={selectedCom}
                selectedRis={selectedRis}
                setSelectedRis={setSelectedRis}
                API={API}
                layout="embedded"
              />
            </div>
          </div>
        )}

        {/* RIEPILOGO RISORSE */}
        {tab === 'riepilogo' && (
          <div style={{flex:1,overflow:'auto',padding:20}}>
            <h2 style={{margin:'0 0 16px',color:'#1e293b',fontSize:18}}>Riepilogo Risorse</h2>
            <div style={{background:'#fff',borderRadius:10,border:'1px solid #e2e8f0',overflow:'hidden'}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead>
                  <tr style={{background:'#f8fafc'}}>
                    <th style={{padding:'10px 14px',textAlign:'left',fontSize:12,color:'#64748b',fontWeight:600,borderBottom:'1px solid #e2e8f0'}}>Risorsa</th>
                    <th style={{padding:'10px 14px',textAlign:'left',fontSize:12,color:'#64748b',fontWeight:600,borderBottom:'1px solid #e2e8f0'}}>Ruolo</th>
                    <th style={{padding:'10px 14px',textAlign:'center',fontSize:12,color:'#64748b',fontWeight:600,borderBottom:'1px solid #e2e8f0'}}>Ore sett.</th>
                    <th style={{padding:'10px 14px',textAlign:'center',fontSize:12,color:'#64748b',fontWeight:600,borderBottom:'1px solid #e2e8f0'}}>Commesse</th>
                  </tr>
                </thead>
                <tbody>
                  {risorse.map((r,i) => {
                    const col = cCol(r.id)
                    const oggi = new Date()
                    const lunedi = new Date(oggi); lunedi.setDate(oggi.getDate() - (oggi.getDay()===0?6:oggi.getDay()-1))
                    const oreW = allocazioni.filter(a => {
                      if (a.ris_id !== r.id) return false
                      const d = new Date(a.data+'T00:00:00')
                      return d >= lunedi && d < new Date(lunedi.getTime() + 7*86400000)
                    }).reduce((s,a) => s+(a.ore||0), 0)
                    const comIds = [...new Set(allocazioni.filter(a=>a.ris_id===r.id).map(a=>a.com_id))]
                    return (
                      <tr key={r.id} style={{background:i%2===0?'#fff':'#fafafa',borderBottom:'1px solid #f1f5f9'}}>
                        <td style={{padding:'10px 14px'}}>
                          <div style={{display:'flex',alignItems:'center',gap:8}}>
                            <div style={{width:30,height:30,borderRadius:'50%',background:`rgba(${parseInt(col.slice(1,3),16)},${parseInt(col.slice(3,5),16)},${parseInt(col.slice(5,7),16)},0.15)`,border:`1.5px solid rgba(${parseInt(col.slice(1,3),16)},${parseInt(col.slice(3,5),16)},${parseInt(col.slice(5,7),16)},0.5)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,color:col}}>
                              {r.nome?.[0]}{r.cogn?.[0]}
                            </div>
                            <span style={{fontWeight:600,fontSize:13,color:'#1e293b'}}>{r.nome} {r.cogn}</span>
                          </div>
                        </td>
                        <td style={{padding:'10px 14px',fontSize:12,color:'#64748b'}}>{r.ruolo}</td>
                        <td style={{padding:'10px 14px',textAlign:'center'}}>
                          <span style={{fontSize:13,fontWeight:700,color:oreW>0?TEAL:'#94a3b8'}}>{oreW}h</span>
                        </td>
                        <td style={{padding:'10px 14px',textAlign:'center',fontSize:12,color:'#64748b'}}>{comIds.length}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* GESTIONE COMMESSE */}
        {tab === 'commesse' && (
          <div style={{flex:1,overflow:'auto',padding:20}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
              <h2 style={{margin:0,color:'#1e293b',fontSize:18}}>Gestione Commesse</h2>
              {(currentRole==='Admin'||currentRole==='Coordinatore') && (
                <div style={{display:'flex',gap:8}}>
                  <button onClick={()=>setTab('nuova_commessa')}
                    style={{padding:'7px 14px',borderRadius:7,border:'none',background:TEAL,color:'#fff',fontWeight:600,cursor:'pointer',fontSize:12}}>
                    + Nuova Commessa
                  </button>
                  <button onClick={()=>setTab('sharepoint')}
                    style={{padding:'7px 14px',borderRadius:7,border:'1px solid #e2e8f0',background:'#fff',color:'#64748b',cursor:'pointer',fontSize:12}}>
                    📁 SharePoint
                  </button>
                </div>
              )}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:14}}>
              {commesse.filter(c=>!c.arch).map(c => {
                const col = SC[c.stato] || '#94a3b8'
                return (
                  <div key={c.id} style={{background:'#fff',borderRadius:10,padding:'14px 16px',border:'1px solid #e2e8f0',borderTop:`3px solid ${col}`}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6}}>
                      <span style={{fontWeight:700,color:TEAL,fontSize:12}}>{c.cod}</span>
                      <span style={{fontSize:10,padding:'1px 7px',borderRadius:4,background:col+'20',color:col,fontWeight:700,border:`1px solid ${col}40`}}>{c.stato}</span>
                    </div>
                    <div style={{fontWeight:600,color:'#1e293b',fontSize:13,marginBottom:3}}>{c.tit}</div>
                    <div style={{color:'#64748b',fontSize:11,marginBottom:6}}>{c.cli}</div>
                    <div style={{fontSize:10,color:'#94a3b8',display:'flex',alignItems:'center',gap:6}}>
                      {c.src==='SharePoint'?'📁 SharePoint':'🖥 Server'}
                      {c.sharepoint_url && <a href={c.sharepoint_url} target="_blank" rel="noreferrer" style={{color:TEAL,textDecoration:'none'}}>↗ Apri</a>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* GESTIONE RISORSE */}
        {tab === 'risorse_tab' && (
          <div style={{flex:1,overflow:'auto',padding:20}}>
            <h2 style={{margin:'0 0 16px',color:'#1e293b',fontSize:18}}>Gestione Risorse</h2>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:12}}>
              {risorse.map(r => {
                const col = cCol(r.id)
                return (
                  <div key={r.id} style={{background:'#fff',borderRadius:10,padding:'14px 16px',border:'1px solid #e2e8f0',display:'flex',alignItems:'center',gap:12}}>
                    <div style={{width:40,height:40,borderRadius:'50%',background:`rgba(${parseInt(col.slice(1,3),16)},${parseInt(col.slice(3,5),16)},${parseInt(col.slice(5,7),16)},0.15)`,border:`1.5px solid rgba(${parseInt(col.slice(1,3),16)},${parseInt(col.slice(3,5),16)},${parseInt(col.slice(5,7),16)},0.5)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,color:col,flexShrink:0}}>
                      {r.nome?.[0]}{r.cogn?.[0]}
                    </div>
                    <div>
                      <div style={{fontWeight:600,color:'#1e293b',fontSize:13}}>{r.nome} {r.cogn}</div>
                      <div style={{color:'#64748b',fontSize:11}}>{r.ruolo}</div>
                      <div style={{color:'#94a3b8',fontSize:10}}>{r.email}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* SCADENZIARIO */}
        {tab === 'scadenziario' && (
          <div style={{flex:1,overflow:'auto',padding:20}}>
            <DashboardScadenze currentBU={currentBU} commesse={commesse} API={API} />
          </div>
        )}

        {/* NUOVA COMMESSA */}
        {tab === 'nuova_commessa' && (
          <div style={{flex:1,overflow:'auto',padding:20}}>
            <NuovaCommessa currentBU={currentBU} commesse={commesse} setCommesse={setCommesse} setTab={setTab} API={API} />
          </div>
        )}

        {/* SHAREPOINT */}
        {tab === 'sharepoint' && (
          <div style={{flex:1,overflow:'auto',padding:20}}>
            <ImportaSharePoint currentBU={currentBU} commesse={commesse} setCommesse={setCommesse} setTab={setTab} API={API} />
          </div>
        )}

        {/* SOTTOFASI */}
        {tab === 'sottofasi' && (
          <div style={{flex:1,overflow:'auto',padding:20}}>
            <Sottofasi currentBU={currentBU} commesse={commesse} API={API} currentRole={currentRole} />
          </div>
        )}

        {/* UTENTI */}
        {tab === 'utenti' && currentRole === 'Admin' && (
          <div style={{flex:1,overflow:'auto',padding:20,maxWidth:700}}>
            <h2 style={{margin:'0 0 20px',color:'#1e293b',fontSize:18}}>⚙️ Gestione Utenti</h2>
            <div style={{background:'#fff',borderRadius:12,padding:20,border:'1px solid #e2e8f0',marginBottom:24}}>
              <h3 style={{margin:'0 0 16px',fontSize:15,color:TEAL}}>Assegna utente a BU</h3>
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                <div>
                  <label style={{fontSize:13,color:'#64748b',display:'block',marginBottom:4}}>Email account Microsoft</label>
                  <input value={nuovaEmail} onChange={e=>setNuovaEmail(e.target.value)} placeholder="utente@azienda.it"
                    style={{width:'100%',padding:'8px 12px',borderRadius:7,border:'1px solid #e2e8f0',fontSize:14,outline:'none',boxSizing:'border-box'}}/>
                </div>
                <div style={{display:'flex',gap:12}}>
                  <div style={{flex:1}}>
                    <label style={{fontSize:13,color:'#64748b',display:'block',marginBottom:4}}>Business Unit</label>
                    <select value={nuovaBU} onChange={e=>setNuovaBU(e.target.value)}
                      style={{width:'100%',padding:'8px 12px',borderRadius:7,border:'1px solid #e2e8f0',fontSize:14,outline:'none'}}>
                      {buList.map(b=><option key={b.id} value={b.id}>{b.nome}</option>)}
                    </select>
                  </div>
                  <div style={{flex:1}}>
                    <label style={{fontSize:13,color:'#64748b',display:'block',marginBottom:4}}>Ruolo</label>
                    <select value={nuovoRuolo} onChange={e=>setNuovoRuolo(e.target.value)}
                      style={{width:'100%',padding:'8px 12px',borderRadius:7,border:'1px solid #e2e8f0',fontSize:14,outline:'none'}}>
                      <option value="Coordinatore">Coordinatore</option>
                      <option value="Membro">Membro</option>
                    </select>
                  </div>
                </div>
                <button onClick={handleSalvaUtente} disabled={savingUtente}
                  style={{padding:'10px',borderRadius:8,border:'none',background:TEAL,color:'#fff',fontWeight:700,cursor:'pointer',fontSize:14,marginTop:4}}>
                  {savingUtente?'Salvataggio...':'Assegna utente'}
                </button>
              </div>
            </div>
            <div style={{background:'#fff',borderRadius:12,border:'1px solid #e2e8f0',overflow:'hidden'}}>
              <div style={{padding:'14px 20px',borderBottom:'1px solid #e2e8f0',fontWeight:700,fontSize:14,color:'#1e293b'}}>
                Utenti assegnati — {utenti.length}
              </div>
              {utenti.length===0 ? (
                <div style={{padding:20,color:'#94a3b8',fontSize:14}}>Nessun utente assegnato.</div>
              ) : utenti.map(u => {
                const bu = buList.find(b=>b.id===u.bu_id)
                return (
                  <div key={u.email} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 20px',borderBottom:'1px solid #f1f5f9'}}>
                    <div>
                      <div style={{fontWeight:600,fontSize:14,color:'#1e293b'}}>{u.email}</div>
                      <div style={{fontSize:12,color:'#64748b',marginTop:2}}>{bu?.nome||u.bu_id} — <span style={{color:TEAL,fontWeight:600}}>{u.ruolo}</span></div>
                    </div>
                    <button onClick={()=>handleDeleteUtente(u.email)}
                      style={{background:'none',border:'none',color:'#94a3b8',cursor:'pointer',fontSize:16,padding:'4px 8px',borderRadius:6}}
                      onMouseEnter={e=>e.currentTarget.style.color='#ef4444'}
                      onMouseLeave={e=>e.currentTarget.style.color='#94a3b8'}>✕</button>
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