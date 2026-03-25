import { useState, useEffect } from 'react'
import axios from 'axios'

const TEAL = "#0d5c63"
const STATI = ['Pianificata', 'Attiva', 'In chiusura', 'Chiusa']
const STATO_COLORS = {
  Pianificata:   { bg:'#eff6ff', border:'#bfdbfe', text:'#1d4ed8', header:'#3b82f6' },
  Attiva:        { bg:'#f0fdf4', border:'#bbf7d0', text:'#15803d', header:'#22c55e' },
  'In chiusura': { bg:'#fff7ed', border:'#fed7aa', text:'#c2410c', header:'#f97316' },
  Chiusa:        { bg:'#f8fafc', border:'#e2e8f0', text:'#475569', header:'#94a3b8' },
}
const STATI_SF = ['In attesa', 'In corso', 'Completata', 'Sospesa']

export default function KanbanCommesse({ currentBU, commesse, setCommesse, currentRole, API }) {
  const [dragging, setDragging] = useState(null)
  const [dragOver, setDragOver] = useState(null)
  const [showArch, setShowArch] = useState(false)
  const [cerca, setCerca] = useState('')
  const [selectedCom, setSelectedCom] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [sottofasi, setSottofasi] = useState([])
  const [milestones, setMilestones] = useState([])
  const [newSf, setNewSf] = useState({ nome:'', scad:'', stato:'In attesa' })
  const [newMs, setNewMs] = useState({ nome:'', scad:'' })
  const [savingSf, setSavingSf] = useState(false)

  const canEdit = currentRole === 'Admin' || currentRole === 'Coordinatore'

  const loadSottofasi = async (comId) => {
    if (!comId) return
    try {
      const r = await axios.get(`${API}/sottofasi/${currentBU.id}`)
      setSottofasi(r.data.filter(s => s.com_id === comId))
    } catch { setSottofasi([]) }
  }

  const loadMilestones = async (comId) => {
    if (!comId) return
    try {
      const r = await axios.get(`${API}/milestones/${comId}`)
      setMilestones(r.data)
    } catch { setMilestones([]) }
  }

  const handleDragStart = (e, com) => {
    setDragging(com)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e, stato) => {
    e.preventDefault()
    setDragOver(stato)
  }

  const handleDrop = async (e, nuovoStato) => {
    e.preventDefault()
    if (!dragging || dragging.stato === nuovoStato) { setDragging(null); setDragOver(null); return }
    await axios.put(`${API}/commesse/${dragging.id}`, { ...dragging, stato: nuovoStato, arch: dragging.arch?1:0 })
    setCommesse(p => p.map(c => c.id===dragging.id ? {...c, stato:nuovoStato} : c))
    setDragging(null)
    setDragOver(null)
  }

  const commesseFiltrate = commesse.filter(c => {
    if (!showArch && c.arch) return false
    if (cerca && !c.cod?.toLowerCase().includes(cerca.toLowerCase()) &&
        !c.tit?.toLowerCase().includes(cerca.toLowerCase()) &&
        !c.cli?.toLowerCase().includes(cerca.toLowerCase())) return false
    return true
  })

  const perStato = stato => commesseFiltrate.filter(c => c.stato === stato)

  const openModal = (com) => {
    setSelectedCom({...com})
    setSottofasi([])
    setMilestones([])
    setNewSf({ nome:'', scad:'', stato:'In attesa' })
    setNewMs({ nome:'', scad:'' })
    loadSottofasi(com.id)
    loadMilestones(com.id)
    setShowModal(true)
  }

  const handleSalvaModal = async () => {
    if (!selectedCom) return
    await axios.put(`${API}/commesse/${selectedCom.id}`, {
      cod: selectedCom.cod,
      tit: selectedCom.tit,
      cli: selectedCom.cli,
      stato: selectedCom.stato,
      src: selectedCom.src,
      arch: selectedCom.arch ? 1 : 0,
      sharepoint_url: selectedCom.sharepoint_url
    })
    setCommesse(p => p.map(c => c.id===selectedCom.id ? selectedCom : c))
    setShowModal(false)
  }

  const handleArchivia = async () => {
    if (!window.confirm('Archiviare questa commessa?')) return
    const updated = {...selectedCom, arch: true}
    await axios.put(`${API}/commesse/${selectedCom.id}`, {...updated, arch:1})
    setCommesse(p => p.map(c => c.id===selectedCom.id ? updated : c))
    setShowModal(false)
  }

  const handleElimina = async () => {
    if (!window.confirm('Eliminare definitivamente questa commessa?')) return
    await axios.delete(`${API}/commesse/${selectedCom.id}`)
    setCommesse(p => p.filter(c => c.id!==selectedCom.id))
    setShowModal(false)
  }

  const handleAddSf = async () => {
    if (!newSf.nome.trim()) return
    setSavingSf(true)
    const r = await axios.post(`${API}/sottofasi`, {
      com_id: selectedCom.id,
      bu_id: currentBU.id,
      nome: newSf.nome,
      scad: newSf.scad || null,
      stato: newSf.stato
    })
    setSottofasi(p => [...p, r.data])
    setNewSf({ nome:'', scad:'', stato:'In attesa' })
    setSavingSf(false)
  }

  const handleDeleteSf = async (id) => {
    await axios.delete(`${API}/sottofasi/${id}`)
    setSottofasi(p => p.filter(s => s.id !== id))
  }

  const handleAddMs = async () => {
    if (!newMs.nome.trim()) return
    try {
      const r = await axios.post(`${API}/milestones`, {
        com_id: selectedCom.id,
        bu_id: currentBU.id,
        nome: newMs.nome,
        scad: newMs.scad || null
      })
      setMilestones(p => [...p, r.data])
      setNewMs({ nome:'', scad:'' })
    } catch(e) { console.error(e) }
  }

  const handleDeleteMs = async (id) => {
    await axios.delete(`${API}/milestones/${id}`)
    setMilestones(p => p.filter(m => m.id !== id))
  }

  const disp = s => { if(!s)return""; const[y,m,d]=s.split("-"); return`${d}/${m}/${y}` }

  return (
    <div style={{flex:1,height:'100%',display:'flex',flexDirection:'column',overflow:'hidden'}}>

      {/* Toolbar */}
      <div style={{padding:'8px 16px',background:'#fff',borderBottom:'1px solid #e2e8f0',display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
        <span style={{fontSize:13,fontWeight:700,color:'#1e293b'}}>Board per stato</span>
        <div style={{position:'relative',flex:1,maxWidth:280}}>
          <span style={{position:'absolute',left:8,top:'50%',transform:'translateY(-50%)',fontSize:11,color:'#94a3b8'}}>🔍</span>
          <input value={cerca} onChange={e=>setCerca(e.target.value)} placeholder="Cerca..."
            style={{width:'100%',boxSizing:'border-box',border:'1px solid #e2e8f0',borderRadius:6,padding:'5px 8px 5px 26px',fontSize:12,outline:'none'}}/>
        </div>
        <label style={{display:'flex',alignItems:'center',gap:5,fontSize:12,color:'#64748b',cursor:'pointer'}}>
          <input type="checkbox" checked={showArch} onChange={e=>setShowArch(e.target.checked)}/>
          Archivio
        </label>
        <span style={{marginLeft:'auto',fontSize:11,color:'#94a3b8',fontStyle:'italic'}}>
          {canEdit ? '✦ Trascina la card per cambiare stato' : ''}
        </span>
      </div>

      {/* Board */}
      <div style={{flex:1,display:'flex',gap:0,overflow:'hidden'}}>
        {STATI.map(stato => {
          const sc = STATO_COLORS[stato]
          const cards = perStato(stato)
          const isDragOver = dragOver === stato
          return (
            <div key={stato}
              onDragOver={e => canEdit && handleDragOver(e, stato)}
              onDrop={e => canEdit && handleDrop(e, stato)}
              style={{flex:1,display:'flex',flexDirection:'column',borderRight:'1px solid #e2e8f0',background:isDragOver?sc.bg:'#f8fafc',transition:'background .15s',minWidth:0}}>
              <div style={{background:sc.header,padding:'8px 12px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
                <span style={{fontSize:12,fontWeight:700,color:'#fff'}}>{stato}</span>
                <span style={{background:'rgba(255,255,255,0.3)',borderRadius:10,padding:'1px 8px',fontSize:11,fontWeight:700,color:'#fff'}}>{cards.length}</span>
              </div>
              <div style={{flex:1,overflowY:'auto',padding:'8px',display:'flex',flexDirection:'column',gap:8}}>
                {cards.map(c => (
                  <div key={c.id}
                    draggable={canEdit}
                    onDragStart={e => handleDragStart(e, c)}
                    onClick={() => openModal(c)}
                    style={{background:'#fff',borderRadius:8,padding:'10px 12px',border:`1px solid ${sc.border}`,cursor:canEdit?'grab':'pointer',boxShadow:'0 1px 3px rgba(0,0,0,0.06)',opacity:dragging?.id===c.id?0.5:1}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:5}}>
                      <span style={{fontWeight:700,fontSize:11,color:TEAL}}>{c.cod}</span>
                      {c.src==='SharePoint' && (
                        <span style={{fontSize:9,background:'#f0f9ff',color:'#0369a1',padding:'1px 5px',borderRadius:3,fontWeight:600,border:'1px solid #bae6fd'}}>SP</span>
                      )}
                    </div>
                    <div style={{fontSize:12,fontWeight:600,color:'#1e293b',lineHeight:1.3,marginBottom:4}}>{c.tit?.length>50?c.tit.slice(0,48)+'…':c.tit}</div>
                    <div style={{fontSize:10,color:'#94a3b8'}}>{c.cli?.length>35?c.cli.slice(0,33)+'…':c.cli}</div>
                  </div>
                ))}
                {cards.length === 0 && (
                  <div style={{textAlign:'center',color:'#cbd5e1',fontSize:11,padding:'20px 0',fontStyle:'italic'}}>Vuota</div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal dettaglio commessa */}
      {showModal && selectedCom && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.4)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}
          onClick={e=>{ if(e.target===e.currentTarget) setShowModal(false) }}>
          <div style={{background:'#fff',borderRadius:10,width:580,maxWidth:'95vw',maxHeight:'92vh',display:'flex',flexDirection:'column',boxShadow:'0 12px 40px rgba(0,0,0,0.2)'}}>
            <div style={{background:TEAL,borderRadius:'10px 10px 0 0',padding:'10px 16px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <span style={{color:'#fff',fontWeight:700,fontSize:14}}>{selectedCom.cod}</span>
                <span style={{color:'rgba(255,255,255,0.8)',fontSize:12,marginLeft:8}}>{selectedCom.tit?.slice(0,45)}</span>
              </div>
              <button onClick={()=>setShowModal(false)} style={{background:'none',border:'none',color:'#fff',fontSize:20,cursor:'pointer',lineHeight:1}}>×</button>
            </div>

            <div style={{flex:1,overflowY:'auto',padding:'16px'}}>
              {/* Cliente e stato */}
              <div style={{color:'#64748b',fontSize:12,marginBottom:12}}>{selectedCom.cli}</div>
              <div style={{marginBottom:16}}>
                <label style={{fontSize:11,fontWeight:600,color:'#64748b',display:'block',marginBottom:3}}>Stato</label>
                <select value={selectedCom.stato||''} onChange={e=>setSelectedCom(p=>({...p,stato:e.target.value}))}
                  disabled={!canEdit}
                  style={{width:'100%',padding:'7px 10px',borderRadius:7,border:'1.5px solid #e2e8f0',fontSize:12,outline:'none',color:'#1e293b',background:!canEdit?'#f8fafc':'#fff'}}>
                  {STATI.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* SOTTOFASI */}
              <div style={{marginBottom:20}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                  <span style={{fontSize:13,fontWeight:700,color:'#1e293b'}}>Sottofasi</span>
                  <span style={{fontSize:11,color:'#94a3b8'}}>{sottofasi.length} totali</span>
                </div>
                {sottofasi.length === 0 && (
                  <div style={{textAlign:'center',color:'#94a3b8',fontSize:12,padding:'8px',fontStyle:'italic'}}>Nessuna sottofase</div>
                )}
                {sottofasi.map(sf => {
                  const scCol = {Completata:'#22c55e','In corso':'#3b82f6','In attesa':'#f59e0b',Sospesa:'#94a3b8'}[sf.stato]||'#94a3b8'
                  return (
                    <div key={sf.id} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 10px',background:'#f8fafc',borderRadius:7,marginBottom:4,border:'1px solid #e2e8f0'}}>
                      <div style={{flex:1}}>
                        <span style={{fontSize:12,fontWeight:600,color:'#1e293b'}}>{sf.nome}</span>
                        {sf.scad && <span style={{fontSize:10,color:'#94a3b8',marginLeft:8}}>{disp(sf.scad)}</span>}
                      </div>
                      <span style={{fontSize:10,padding:'1px 6px',borderRadius:4,background:scCol+'20',color:scCol,fontWeight:600}}>{sf.stato}</span>
                      {canEdit && (
                        <button onClick={()=>handleDeleteSf(sf.id)}
                          style={{background:'none',border:'none',color:'#94a3b8',cursor:'pointer',fontSize:12,padding:'2px 4px'}}
                          onMouseEnter={e=>e.currentTarget.style.color='#ef4444'}
                          onMouseLeave={e=>e.currentTarget.style.color='#94a3b8'}>🗑</button>
                      )}
                    </div>
                  )
                })}
                {canEdit && (
                  <div style={{background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:8,padding:'10px 12px',marginTop:8}}>
                    <div style={{fontSize:11,fontWeight:700,color:'#15803d',marginBottom:8,textTransform:'uppercase',letterSpacing:0.5}}>Nuova Sottofase</div>
                    <input value={newSf.nome} onChange={e=>setNewSf(p=>({...p,nome:e.target.value}))} placeholder="Nome sottofase..."
                      style={{width:'100%',boxSizing:'border-box',padding:'6px 10px',borderRadius:6,border:'1px solid #e2e8f0',fontSize:12,outline:'none',marginBottom:6}}/>
                    <div style={{display:'flex',gap:8,alignItems:'center'}}>
                      <input type="date" value={newSf.scad} onChange={e=>setNewSf(p=>({...p,scad:e.target.value}))}
                        style={{flex:1,padding:'6px 10px',borderRadius:6,border:'1px solid #e2e8f0',fontSize:12,outline:'none'}}/>
                      <select value={newSf.stato} onChange={e=>setNewSf(p=>({...p,stato:e.target.value}))}
                        style={{flex:1,padding:'6px 10px',borderRadius:6,border:'1px solid #e2e8f0',fontSize:12,outline:'none',color:'#1e293b'}}>
                        {STATI_SF.map(s=><option key={s} value={s}>{s}</option>)}
                      </select>
                      <button onClick={handleAddSf} disabled={savingSf||!newSf.nome.trim()}
                        style={{width:32,height:32,borderRadius:6,border:'none',background:TEAL,color:'#fff',fontWeight:700,cursor:'pointer',fontSize:18,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>+</button>
                    </div>
                  </div>
                )}
              </div>

              {/* MILESTONE */}
              <div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                  <span style={{fontSize:13,fontWeight:700,color:'#1e293b'}}>⬡ Milestone</span>
                  <span style={{fontSize:11,color:'#94a3b8'}}>{milestones.length} totali</span>
                </div>
                {milestones.length === 0 && (
                  <div style={{textAlign:'center',color:'#94a3b8',fontSize:12,padding:'8px',fontStyle:'italic'}}>Nessuna milestone</div>
                )}
                {milestones.map(ms => (
                  <div key={ms.id} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 10px',background:'#faf5ff',borderRadius:7,marginBottom:4,border:'1px solid #e9d5ff'}}>
                    <span style={{fontSize:14,color:'#7c3aed'}}>⬡</span>
                    <div style={{flex:1}}>
                      <span style={{fontSize:12,fontWeight:600,color:'#1e293b'}}>{ms.nome}</span>
                      {ms.scad && <span style={{fontSize:10,color:'#94a3b8',marginLeft:8}}>{disp(ms.scad)}</span>}
                    </div>
                    {canEdit && (
                      <button onClick={()=>handleDeleteMs(ms.id)}
                        style={{background:'none',border:'none',color:'#94a3b8',cursor:'pointer',fontSize:12,padding:'2px 4px'}}
                        onMouseEnter={e=>e.currentTarget.style.color='#ef4444'}
                        onMouseLeave={e=>e.currentTarget.style.color='#94a3b8'}>🗑</button>
                    )}
                  </div>
                ))}
                {canEdit && (
                  <div style={{background:'#faf5ff',border:'1px solid #e9d5ff',borderRadius:8,padding:'10px 12px',marginTop:8}}>
                    <div style={{fontSize:11,fontWeight:700,color:'#7c3aed',marginBottom:8,textTransform:'uppercase',letterSpacing:0.5}}>Nuova Milestone</div>
                    <input value={newMs.nome} onChange={e=>setNewMs(p=>({...p,nome:e.target.value}))} placeholder="Nome milestone..."
                      style={{width:'100%',boxSizing:'border-box',padding:'6px 10px',borderRadius:6,border:'1px solid #e2e8f0',fontSize:12,outline:'none',marginBottom:6}}/>
                    <div style={{display:'flex',gap:8,alignItems:'center'}}>
                      <input type="date" value={newMs.scad} onChange={e=>setNewMs(p=>({...p,scad:e.target.value}))}
                        style={{flex:1,padding:'6px 10px',borderRadius:6,border:'1px solid #e2e8f0',fontSize:12,outline:'none'}}/>
                      <button onClick={handleAddMs} disabled={!newMs.nome.trim()}
                        style={{width:32,height:32,borderRadius:6,border:'none',background:'#7c3aed',color:'#fff',fontWeight:700,cursor:'pointer',fontSize:18,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>+</button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div style={{padding:'10px 16px',borderTop:'1px solid #e2e8f0',display:'flex',gap:8,background:'#f8fafc',borderRadius:'0 0 10px 10px'}}>
              {canEdit && (
                <>
                  <button onClick={handleArchivia}
                    style={{padding:'7px 12px',borderRadius:7,border:'1px solid #e2e8f0',background:'#fff',color:'#64748b',cursor:'pointer',fontSize:11,fontWeight:600}}>
                    Archivia
                  </button>
                  <button onClick={handleElimina}
                    style={{padding:'7px 12px',borderRadius:7,border:'1px solid #fecaca',background:'#fff',color:'#ef4444',cursor:'pointer',fontSize:11,fontWeight:600}}>
                    🗑 Elimina
                  </button>
                </>
              )}
              <button onClick={()=>setShowModal(false)}
                style={{marginLeft:'auto',padding:'7px 14px',borderRadius:7,border:'1px solid #e2e8f0',background:'#fff',cursor:'pointer',fontSize:12}}>
                Annulla
              </button>
              {canEdit && (
                <button onClick={handleSalvaModal}
                  style={{padding:'7px 14px',borderRadius:7,border:'none',background:TEAL,color:'#fff',fontWeight:700,cursor:'pointer',fontSize:12}}>
                  Salva
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}