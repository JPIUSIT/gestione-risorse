import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { useMsal } from '@azure/msal-react'

const TEAL = "#0d5c63"
const AV_PAL = ["#ef4444","#3b82f6","#22c55e","#a855f7","#f59e0b","#06b6d4","#ec4899","#84cc16","#f97316","#6366f1","#14b8a6","#e11d48"]
const cCol = id => { let h=0; for(let i=0;i<(id||"").length;i++) h=(h*31+id.charCodeAt(i))&0xffff; return AV_PAL[h%AV_PAL.length] }

export default function GestioneRisorse({ currentBU, risorse, setRisorse, API, currentRole }) {
  const { instance, accounts } = useMsal()
  const [categorie, setCategorie] = useState([])
  const [cerca, setCerca] = useState('')
  const [dragRis, setDragRis] = useState(null)
  const [dragOverCat, setDragOverCat] = useState(null)
  const [showNuovaCat, setShowNuovaCat] = useState(false)
  const [nuovaCatNome, setNuovaCatNome] = useState('')
  const [savingCat, setSavingCat] = useState(false)
  const [menuCatId, setMenuCatId] = useState(null)
  const [renameCatId, setRenameCatId] = useState(null)
  const [renameNome, setRenomeNome] = useState('')
  const menuRef = useRef(null)

  // Modal aggiungi risorsa
  const [showModalRis, setShowModalRis] = useState(false)
  const [modalTab, setModalTab] = useState('interno') // 'interno' | 'esterno'

  // Ricerca Graph
  const [graphQuery, setGraphQuery] = useState('')
  const [graphResults, setGraphResults] = useState([])
  const [graphLoading, setGraphLoading] = useState(false)
  const [graphError, setGraphError] = useState('')

  // Form esterno
  const [fNome, setFNome] = useState('')
  const [fCogn, setFCogn] = useState('')
  const [fRuolo, setFRuolo] = useState('')
  const [fEmail, setFEmail] = useState('')
  const [fBuOrigine, setFBuOrigine] = useState('')
  const [savingExt, setSavingExt] = useState(false)

  const canEdit = currentRole === 'Admin' || currentRole === 'Coordinatore'

  useEffect(() => {
    if (!currentBU) return
    axios.get(`${API}/categorie/${currentBU.id}`).then(r => setCategorie(r.data)).catch(()=>{})
  }, [currentBU])

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuCatId(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Cerca utenti nel tenant via Microsoft Graph
  const searchGraph = async (query) => {
    if (!query || query.length < 2) { setGraphResults([]); return }
    setGraphLoading(true)
    setGraphError('')
    try {
      const tokenResponse = await instance.acquireTokenSilent({
        scopes: ['User.Read.All'],
        account: accounts[0]
      })
      const token = tokenResponse.accessToken
      const res = await fetch(
        `https://graph.microsoft.com/v1.0/users?$search="displayName:${query}" OR "mail:${query}"&$select=id,displayName,givenName,surname,mail,jobTitle&$top=10`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'ConsistencyLevel': 'eventual'
          }
        }
      )
      const data = await res.json()
      if (data.error) { setGraphError(data.error.message); setGraphResults([]) }
      else setGraphResults(data.value || [])
    } catch(e) {
      setGraphError('Errore nella ricerca. Verifica i permessi Azure.')
      setGraphResults([])
    }
    setGraphLoading(false)
  }

  useEffect(() => {
    const t = setTimeout(() => searchGraph(graphQuery), 400)
    return () => clearTimeout(t)
  }, [graphQuery])

  const handleAddInterno = async (utente) => {
    // Controlla se esiste già
    const email = utente.mail || ''
    if (risorse.find(r => r.email === email)) {
      alert('Questa risorsa è già presente nella BU.')
      return
    }
    try {
      const parts = (utente.displayName || '').split(' ')
      const cogn = parts[0] || ''
      const nome = parts.slice(1).join(' ') || ''
      const r = await axios.post(`${API}/risorse`, {
        bu_id: currentBU.id,
        nome,
        cogn,
        ruolo: utente.jobTitle || '',
        email,
        esterno: 0,
        bu_origine: null
      })
      setRisorse(p => [...p, r.data])
      setGraphQuery('')
      setGraphResults([])
    } catch(e) { console.error(e) }
  }

  const handleAddEsterno = async () => {
    if (!fNome.trim() || !fCogn.trim()) return
    setSavingExt(true)
    try {
      const r = await axios.post(`${API}/risorse`, {
        bu_id: currentBU.id,
        nome: fNome.trim(),
        cogn: fCogn.trim(),
        ruolo: fRuolo.trim(),
        email: fEmail.trim(),
        esterno: 1,
        bu_origine: fBuOrigine.trim() || null
      })
      setRisorse(p => [...p, r.data])
      setFNome(''); setFCogn(''); setFRuolo(''); setFEmail(''); setFBuOrigine('')
      setShowModalRis(false)
    } catch(e) { console.error(e) }
    setSavingExt(false)
  }

  const handleDeleteRisorsa = async (ris) => {
    if (!window.confirm(`Eliminare ${ris.nome} ${ris.cogn}?`)) return
    try {
      await axios.delete(`${API}/risorse/${ris.id}`)
      setRisorse(p => p.filter(r => r.id !== ris.id))
    } catch(e) { console.error(e) }
  }

  const risorseFiltrate = risorse.filter(r =>
    !cerca || `${r.nome} ${r.cogn}`.toLowerCase().includes(cerca.toLowerCase()) ||
    r.ruolo?.toLowerCase().includes(cerca.toLowerCase())
  )

  const risPerCat = (catId) => risorse.filter(r => r.cat_id === catId)
  const risNonAssegnate = risorse.filter(r => !r.cat_id || !categorie.find(c => c.id === r.cat_id))

  const handleDragStart = (e, ris) => { setDragRis(ris); e.dataTransfer.effectAllowed = 'move' }

  const handleDrop = async (e, catId) => {
    e.preventDefault()
    if (!dragRis || dragRis.cat_id === catId) { setDragRis(null); setDragOverCat(null); return }
    try {
      await axios.put(`${API}/risorse/${dragRis.id}`, { ...dragRis, cat_id: catId })
      setRisorse(p => p.map(r => r.id === dragRis.id ? { ...r, cat_id: catId } : r))
    } catch(e) { console.error(e) }
    setDragRis(null); setDragOverCat(null)
  }

  const handleRemoveFromCat = async (ris) => {
    try {
      await axios.put(`${API}/risorse/${ris.id}`, { ...ris, cat_id: null })
      setRisorse(p => p.map(r => r.id === ris.id ? { ...r, cat_id: null } : r))
    } catch(e) { console.error(e) }
  }

  const handleAddCategoria = async () => {
    if (!nuovaCatNome.trim()) return
    setSavingCat(true)
    try {
      const r = await axios.post(`${API}/categorie`, { bu_id: currentBU.id, nome: nuovaCatNome.trim(), ord: categorie.length + 1 })
      setCategorie(p => [...p, r.data])
      setNuovaCatNome(''); setShowNuovaCat(false)
    } catch(e) { console.error(e) }
    setSavingCat(false)
  }

  const handleRinominaCategoria = async (catId) => {
    if (!renameNome.trim()) return
    try {
      await axios.put(`${API}/categorie/${catId}`, { nome: renameNome.trim() })
      setCategorie(p => p.map(c => c.id === catId ? { ...c, nome: renameNome.trim() } : c))
    } catch(e) { console.error(e) }
    setRenameCatId(null); setMenuCatId(null)
  }

  const handleDeleteCategoria = async (catId) => {
    if (!window.confirm('Eliminare questa categoria? Le risorse assegnate diventeranno non assegnate.')) return
    try {
      await axios.delete(`${API}/categorie/${catId}`)
      setCategorie(p => p.filter(c => c.id !== catId))
      setRisorse(p => p.map(r => r.cat_id === catId ? { ...r, cat_id: null } : r))
    } catch(e) { console.error(e) }
    setMenuCatId(null)
  }

  const RisCard = ({ ris, draggable, onRemove }) => {
    const col = cCol(ris.id)
    const rgb = `${parseInt(col.slice(1,3),16)},${parseInt(col.slice(3,5),16)},${parseInt(col.slice(5,7),16)}`
    return (
      <div draggable={draggable} onDragStart={e => draggable && handleDragStart(e, ris)}
        style={{display:'flex',alignItems:'center',gap:8,padding:'7px 10px',background:'#fff',borderRadius:7,border:'1px solid #e2e8f0',cursor:draggable?'grab':'default',opacity:dragRis?.id===ris.id?0.4:1,marginBottom:4}}>
        {draggable && <span style={{color:'#cbd5e1',fontSize:12,cursor:'grab'}}>⠿</span>}
        <div style={{width:28,height:28,borderRadius:'50%',background:`rgba(${rgb},0.15)`,border:`1.5px solid rgba(${rgb},0.5)`,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:10,color:col,flexShrink:0}}>
          {ris.nome?.[0]}{ris.cogn?.[0]}
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:'flex',alignItems:'center',gap:4}}>
            <span style={{fontWeight:600,fontSize:12,color:'#1e293b'}}>{ris.nome} {ris.cogn}</span>
            {ris.esterno===1 && <span style={{fontSize:9,background:'#fef3c7',color:'#92400e',padding:'1px 4px',borderRadius:3,fontWeight:700,border:'1px solid #fcd34d'}}>EXT</span>}
          </div>
          <div style={{fontSize:10,color:'#94a3b8'}}>{ris.ruolo}</div>
        </div>
        {onRemove && canEdit && (
          <button onClick={()=>onRemove(ris)}
            style={{background:'none',border:'none',color:'#cbd5e1',cursor:'pointer',fontSize:14,padding:'0 2px',lineHeight:1}}
            onMouseEnter={e=>e.currentTarget.style.color='#ef4444'}
            onMouseLeave={e=>e.currentTarget.style.color='#cbd5e1'}>×</button>
        )}
      </div>
    )
  }

  return (
    <div style={{flex:1,display:'flex',overflow:'hidden',height:'100%'}}>

      {/* Sidebar sinistra */}
      <div style={{width:220,flexShrink:0,background:TEAL,display:'flex',flexDirection:'column',overflow:'hidden'}}>
        <div style={{padding:'12px 14px',borderBottom:'1px solid rgba(255,255,255,0.1)'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:2}}>
            <div style={{fontWeight:700,fontSize:14,color:'#fff'}}>Risorse J+S</div>
            {canEdit && (
              <button onClick={()=>{ setShowModalRis(true); setModalTab('interno'); setGraphQuery(''); setGraphResults([]) }}
                style={{width:22,height:22,borderRadius:'50%',border:'1px solid rgba(255,255,255,0.4)',background:'rgba(255,255,255,0.15)',color:'#fff',cursor:'pointer',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center',lineHeight:1}}>+</button>
            )}
          </div>
          <div style={{fontSize:11,color:'rgba(255,255,255,0.6)',marginBottom:10}}>{risorse.length} persone</div>
          <div style={{position:'relative'}}>
            <span style={{position:'absolute',left:8,top:'50%',transform:'translateY(-50%)',fontSize:11,color:'rgba(255,255,255,0.4)'}}>🔍</span>
            <input value={cerca} onChange={e=>setCerca(e.target.value)} placeholder="Cerca..."
              style={{width:'100%',boxSizing:'border-box',background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.2)',borderRadius:6,padding:'5px 8px 5px 26px',fontSize:11,color:'#fff',outline:'none'}}/>
          </div>
        </div>
        {canEdit && (
          <div style={{padding:'6px 14px',borderBottom:'1px solid rgba(255,255,255,0.1)',flexShrink:0}}>
            <div style={{fontSize:10,color:'rgba(255,255,255,0.5)',textAlign:'center',fontStyle:'italic'}}>⠿ Trascina nelle categorie →</div>
          </div>
        )}
        <div style={{flex:1,overflowY:'auto',padding:'8px'}}>
          {risorseFiltrate.map(ris => (
            <div key={ris.id} draggable={canEdit} onDragStart={e => canEdit && handleDragStart(e, ris)}
              style={{display:'flex',alignItems:'center',gap:8,padding:'6px 8px',borderRadius:7,cursor:canEdit?'grab':'default',marginBottom:2,opacity:dragRis?.id===ris.id?0.4:1,background:'rgba(255,255,255,0.07)'}}>
              {canEdit && <span style={{color:'rgba(255,255,255,0.3)',fontSize:12}}>⠿</span>}
              {(() => {
                const col = cCol(ris.id)
                const rgb = `${parseInt(col.slice(1,3),16)},${parseInt(col.slice(3,5),16)},${parseInt(col.slice(5,7),16)}`
                return (
                  <div style={{width:26,height:26,borderRadius:'50%',background:`rgba(${rgb},0.25)`,border:`1.5px solid rgba(${rgb},0.6)`,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:9,color:col,flexShrink:0}}>
                    {ris.nome?.[0]}{ris.cogn?.[0]}
                  </div>
                )
              })()}
              <div style={{minWidth:0,flex:1}}>
                <div style={{display:'flex',alignItems:'center',gap:4}}>
                  <span style={{fontWeight:600,fontSize:11,color:'#fff'}}>{ris.nome} {ris.cogn}</span>
                  {ris.esterno===1 && <span style={{fontSize:8,background:'rgba(251,191,36,0.3)',color:'#fbbf24',padding:'0 3px',borderRadius:2,fontWeight:700}}>EXT</span>}
                </div>
                <div style={{fontSize:10,color:'rgba(255,255,255,0.5)'}}>{ris.ruolo}</div>
              </div>
              {canEdit && (
                <button onClick={e=>{ e.stopPropagation(); handleDeleteRisorsa(ris) }}
                  style={{background:'none',border:'none',color:'rgba(255,255,255,0.2)',cursor:'pointer',fontSize:12,padding:'0 2px',lineHeight:1,flexShrink:0}}
                  onMouseEnter={e=>e.currentTarget.style.color='#fca5a5'}
                  onMouseLeave={e=>e.currentTarget.style.color='rgba(255,255,255,0.2)'}>✕</button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Area principale */}
      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',background:'#f0f4f8'}}>

        {/* Header */}
        <div style={{padding:'10px 16px',background:'#fff',borderBottom:'1px solid #e2e8f0',display:'flex',alignItems:'center',gap:12,flexShrink:0}}>
          <span style={{fontWeight:700,fontSize:14,color:'#1e293b'}}>Categorie BU</span>
          <span style={{fontSize:12,color:'#94a3b8'}}>{risorse.filter(r=>categorie.find(c=>c.id===r.cat_id)).length} assegnate</span>
          {canEdit && <span style={{fontSize:11,color:'#94a3b8',fontStyle:'italic'}}>· Trascina da J+S o tra categorie</span>}
          {canEdit && (
            <div style={{marginLeft:'auto',display:'flex',gap:8,alignItems:'center'}}>
              {showNuovaCat ? (
                <>
                  <input value={nuovaCatNome} onChange={e=>setNuovaCatNome(e.target.value)}
                    placeholder="Nome categoria..." onKeyDown={e=>e.key==='Enter'&&handleAddCategoria()} autoFocus
                    style={{padding:'5px 10px',borderRadius:6,border:'1px solid #e2e8f0',fontSize:12,outline:'none',width:160}}/>
                  <button onClick={handleAddCategoria} disabled={savingCat||!nuovaCatNome.trim()}
                    style={{padding:'5px 12px',borderRadius:6,border:'none',background:TEAL,color:'#fff',fontWeight:600,cursor:'pointer',fontSize:12}}>Aggiungi</button>
                  <button onClick={()=>{setShowNuovaCat(false);setNuovaCatNome('')}}
                    style={{padding:'5px 10px',borderRadius:6,border:'1px solid #e2e8f0',background:'#fff',cursor:'pointer',fontSize:12}}>Annulla</button>
                </>
              ) : (
                <button onClick={()=>setShowNuovaCat(true)}
                  style={{padding:'5px 14px',borderRadius:6,border:'none',background:TEAL,color:'#fff',fontWeight:600,cursor:'pointer',fontSize:12}}>
                  + Aggiungi categoria
                </button>
              )}
            </div>
          )}
        </div>

        {/* Colonne categorie */}
        <div style={{flex:1,display:'flex',gap:0,overflow:'hidden'}}>
          {categorie.map(cat => {
            const ris = risPerCat(cat.id)
            const isDragOver = dragOverCat === cat.id
            const isMenuOpen = menuCatId === cat.id
            const isRenaming = renameCatId === cat.id
            return (
              <div key={cat.id}
                onDragOver={e=>{e.preventDefault();setDragOverCat(cat.id)}}
                onDrop={e=>handleDrop(e, cat.id)}
                onDragLeave={()=>setDragOverCat(null)}
                style={{flex:1,display:'flex',flexDirection:'column',borderRight:'1px solid #e2e8f0',minWidth:200,background:isDragOver?'#f0f9fa':'#f8fafc',transition:'background .1s'}}>
                <div style={{background:TEAL,padding:'8px 12px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0,position:'relative'}}>
                  {isRenaming ? (
                    <div style={{display:'flex',gap:4,flex:1,alignItems:'center'}}>
                      <input autoFocus value={renameNome} onChange={e=>setRenomeNome(e.target.value)}
                        onKeyDown={e=>{ if(e.key==='Enter') handleRinominaCategoria(cat.id); if(e.key==='Escape') setRenameCatId(null) }}
                        style={{flex:1,padding:'3px 6px',borderRadius:4,border:'none',fontSize:12,outline:'none'}}/>
                      <button onClick={()=>handleRinominaCategoria(cat.id)}
                        style={{background:'rgba(255,255,255,0.25)',border:'none',color:'#fff',cursor:'pointer',borderRadius:4,padding:'2px 7px',fontSize:11,fontWeight:700}}>✓</button>
                      <button onClick={()=>setRenameCatId(null)}
                        style={{background:'none',border:'none',color:'rgba(255,255,255,0.6)',cursor:'pointer',fontSize:14,lineHeight:1}}>×</button>
                    </div>
                  ) : (
                    <>
                      <div>
                        <span style={{fontWeight:700,fontSize:13,color:'#fff'}}>{cat.nome}</span>
                        <span style={{fontSize:11,color:'rgba(255,255,255,0.6)',marginLeft:8}}>{ris.length} risorse</span>
                      </div>
                      {canEdit && (
                        <div style={{position:'relative'}} ref={isMenuOpen ? menuRef : null}>
                          <button onClick={()=>{ setMenuCatId(isMenuOpen ? null : cat.id); setRenameCatId(null) }}
                            style={{background:'none',border:'none',color:'rgba(255,255,255,0.6)',cursor:'pointer',fontSize:16,padding:'0 4px',lineHeight:1}}
                            onMouseEnter={e=>e.currentTarget.style.color='#fff'}
                            onMouseLeave={e=>e.currentTarget.style.color='rgba(255,255,255,0.6)'}>⋯</button>
                          {isMenuOpen && (
                            <div style={{position:'absolute',right:0,top:'100%',background:'#fff',borderRadius:8,boxShadow:'0 4px 20px rgba(0,0,0,0.15)',border:'1px solid #e2e8f0',zIndex:100,minWidth:140,overflow:'hidden'}}>
                              <button onClick={()=>{ setRenameCatId(cat.id); setRenomeNome(cat.nome); setMenuCatId(null) }}
                                style={{display:'block',width:'100%',textAlign:'left',padding:'9px 14px',border:'none',background:'none',cursor:'pointer',fontSize:12,color:'#1e293b',borderBottom:'1px solid #f1f5f9'}}
                                onMouseEnter={e=>e.currentTarget.style.background='#f8fafc'}
                                onMouseLeave={e=>e.currentTarget.style.background='none'}>✏️ Rinomina</button>
                              <button onClick={()=>handleDeleteCategoria(cat.id)}
                                style={{display:'block',width:'100%',textAlign:'left',padding:'9px 14px',border:'none',background:'none',cursor:'pointer',fontSize:12,color:'#ef4444'}}
                                onMouseEnter={e=>e.currentTarget.style.background='#fff5f5'}
                                onMouseLeave={e=>e.currentTarget.style.background='none'}>🗑 Elimina</button>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
                <div style={{flex:1,overflowY:'auto',padding:'8px'}}>
                  {ris.length === 0 ? (
                    <div style={{textAlign:'center',color:'#cbd5e1',fontSize:11,padding:'20px 0',fontStyle:'italic',border:'2px dashed #e2e8f0',borderRadius:8,margin:'4px'}}>Vuota</div>
                  ) : (
                    ris.map(r => <RisCard key={r.id} ris={r} draggable={canEdit} onRemove={handleRemoveFromCat}/>)
                  )}
                </div>
              </div>
            )
          })}

          {/* Colonna non assegnate */}
          {risNonAssegnate.length > 0 && (
            <div style={{flex:1,display:'flex',flexDirection:'column',minWidth:200,background:'#f8fafc'}}>
              <div style={{background:'#94a3b8',padding:'8px 12px',flexShrink:0}}>
                <span style={{fontWeight:700,fontSize:13,color:'#fff'}}>Non assegnate</span>
                <span style={{fontSize:11,color:'rgba(255,255,255,0.6)',marginLeft:8}}>{risNonAssegnate.length}</span>
              </div>
              <div style={{flex:1,overflowY:'auto',padding:'8px'}}>
                {risNonAssegnate.map(r => <RisCard key={r.id} ris={r} draggable={canEdit} onRemove={null}/>)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal aggiungi risorsa */}
      {showModalRis && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.4)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}
          onClick={e=>{ if(e.target===e.currentTarget) setShowModalRis(false) }}>
          <div style={{background:'#fff',borderRadius:10,width:500,maxWidth:'95vw',maxHeight:'90vh',display:'flex',flexDirection:'column',boxShadow:'0 12px 40px rgba(0,0,0,0.2)'}}>
            <div style={{background:TEAL,borderRadius:'10px 10px 0 0',padding:'10px 16px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{color:'#fff',fontWeight:700,fontSize:13}}>Aggiungi Risorsa</span>
              <button onClick={()=>setShowModalRis(false)} style={{background:'none',border:'none',color:'#fff',fontSize:20,cursor:'pointer',lineHeight:1}}>×</button>
            </div>

            {/* Tab interno/esterno */}
            <div style={{display:'flex',borderBottom:'1px solid #e2e8f0',background:'#fafafa'}}>
              {[['interno','👤 Interno (Azure AD)'],['esterno','🌐 Esterno (Manuale)']].map(([id,label]) => (
                <button key={id} onClick={()=>setModalTab(id)}
                  style={{flex:1,padding:'10px',border:'none',borderBottom:`2px solid ${modalTab===id?TEAL:'transparent'}`,background:'none',cursor:'pointer',fontSize:12,fontWeight:modalTab===id?700:400,color:modalTab===id?TEAL:'#64748b'}}>
                  {label}
                </button>
              ))}
            </div>

            <div style={{flex:1,overflowY:'auto',padding:'16px'}}>

              {/* Tab interno — ricerca Graph */}
              {modalTab === 'interno' && (
                <div>
                  <div style={{fontSize:12,color:'#64748b',marginBottom:10}}>Cerca un utente del tenant Microsoft per aggiungerlo come risorsa interna.</div>
                  <div style={{position:'relative',marginBottom:12}}>
                    <span style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',fontSize:13,color:'#94a3b8'}}>🔍</span>
                    <input value={graphQuery} onChange={e=>setGraphQuery(e.target.value)}
                      placeholder="Cerca per nome o email..."
                      style={{width:'100%',boxSizing:'border-box',padding:'8px 12px 8px 32px',borderRadius:7,border:'1px solid #e2e8f0',fontSize:13,outline:'none'}}/>
                  </div>
                  {graphLoading && <div style={{textAlign:'center',color:'#94a3b8',fontSize:12,padding:'12px'}}>Ricerca in corso...</div>}
                  {graphError && <div style={{color:'#ef4444',fontSize:12,padding:'8px 0'}}>{graphError}</div>}
                  {!graphLoading && graphResults.length === 0 && graphQuery.length >= 2 && !graphError && (
                    <div style={{textAlign:'center',color:'#94a3b8',fontSize:12,padding:'12px'}}>Nessun utente trovato</div>
                  )}
                  <div style={{display:'flex',flexDirection:'column',gap:6}}>
                    {graphResults.map(u => {
                      const giàPresente = risorse.some(r => r.email === u.mail)
                      return (
                        <div key={u.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:8,border:'1px solid #e2e8f0',background:giàPresente?'#f8fafc':'#fff'}}>
                          <div style={{width:36,height:36,borderRadius:'50%',background:'#e0f2f1',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:12,color:TEAL,flexShrink:0}}>
                            {(u.givenName?.[0]||u.displayName?.[0]||'?')}{(u.surname?.[0]||'')}
                          </div>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontWeight:600,fontSize:13,color:'#1e293b'}}>{u.displayName}</div>
                            <div style={{fontSize:11,color:'#94a3b8'}}>{u.mail}</div>
                            {u.jobTitle && <div style={{fontSize:10,color:'#64748b'}}>{u.jobTitle}</div>}
                          </div>
                          {giàPresente ? (
                            <span style={{fontSize:11,color:'#94a3b8',fontStyle:'italic'}}>già presente</span>
                          ) : (
                            <button onClick={()=>handleAddInterno(u)}
                              style={{padding:'5px 12px',borderRadius:6,border:'none',background:TEAL,color:'#fff',fontWeight:600,cursor:'pointer',fontSize:12}}>
                              + Aggiungi
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Tab esterno — form manuale */}
              {modalTab === 'esterno' && (
                <div style={{display:'flex',flexDirection:'column',gap:12}}>
                  <div style={{fontSize:12,color:'#64748b',marginBottom:4}}>Aggiungi manualmente una risorsa esterna al tenant aziendale.</div>
                  <div style={{display:'flex',gap:10}}>
                    <div style={{flex:1}}>
                      <label style={{fontSize:11,color:'#64748b',display:'block',marginBottom:3}}>Cognome *</label>
                      <input value={fCogn} onChange={e=>setFCogn(e.target.value)} placeholder="es. Rossi"
                        style={{width:'100%',boxSizing:'border-box',padding:'7px 10px',borderRadius:7,border:'1px solid #e2e8f0',fontSize:13,outline:'none'}}/>
                    </div>
                    <div style={{flex:1}}>
                      <label style={{fontSize:11,color:'#64748b',display:'block',marginBottom:3}}>Nome *</label>
                      <input value={fNome} onChange={e=>setFNome(e.target.value)} placeholder="es. Mario"
                        style={{width:'100%',boxSizing:'border-box',padding:'7px 10px',borderRadius:7,border:'1px solid #e2e8f0',fontSize:13,outline:'none'}}/>
                    </div>
                  </div>
                  <div>
                    <label style={{fontSize:11,color:'#64748b',display:'block',marginBottom:3}}>Ruolo</label>
                    <input value={fRuolo} onChange={e=>setFRuolo(e.target.value)} placeholder="es. Progettista"
                      style={{width:'100%',boxSizing:'border-box',padding:'7px 10px',borderRadius:7,border:'1px solid #e2e8f0',fontSize:13,outline:'none'}}/>
                  </div>
                  <div>
                    <label style={{fontSize:11,color:'#64748b',display:'block',marginBottom:3}}>Email</label>
                    <input value={fEmail} onChange={e=>setFEmail(e.target.value)} placeholder="es. mario.rossi@esterno.it" type="email"
                      style={{width:'100%',boxSizing:'border-box',padding:'7px 10px',borderRadius:7,border:'1px solid #e2e8f0',fontSize:13,outline:'none'}}/>
                  </div>
                  <div>
                    <label style={{fontSize:11,color:'#64748b',display:'block',marginBottom:3}}>Azienda / BU origine</label>
                    <input value={fBuOrigine} onChange={e=>setFBuOrigine(e.target.value)} placeholder="es. Studio Tecnico XYZ"
                      style={{width:'100%',boxSizing:'border-box',padding:'7px 10px',borderRadius:7,border:'1px solid #e2e8f0',fontSize:13,outline:'none'}}/>
                  </div>
                </div>
              )}
            </div>

            <div style={{padding:'10px 16px',borderTop:'1px solid #e2e8f0',display:'flex',gap:8,justifyContent:'flex-end',background:'#f8fafc',borderRadius:'0 0 10px 10px'}}>
              <button onClick={()=>setShowModalRis(false)}
                style={{padding:'7px 14px',borderRadius:7,border:'1px solid #e2e8f0',background:'#fff',cursor:'pointer',fontSize:12}}>
                Chiudi
              </button>
              {modalTab === 'esterno' && (
                <button onClick={handleAddEsterno} disabled={savingExt||!fNome.trim()||!fCogn.trim()}
                  style={{padding:'7px 14px',borderRadius:7,border:'none',background:(fNome.trim()&&fCogn.trim())?TEAL:'#e2e8f0',color:(fNome.trim()&&fCogn.trim())?'#fff':'#94a3b8',fontWeight:700,cursor:(fNome.trim()&&fCogn.trim())?'pointer':'default',fontSize:12}}>
                  {savingExt?'Salvataggio...':'+ Aggiungi risorsa'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}