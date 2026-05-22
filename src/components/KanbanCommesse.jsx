import { useState } from 'react'
import axios from 'axios'

const TEAL = "#0d5c63"
const STATI = ['Pianificata', 'Attiva', 'Chiusa']
const STATO_COLORS = {
  Pianificata: { bg:'#eff6ff', border:'#bfdbfe', text:'#1d4ed8', header:'#3b82f6' },
  Attiva:      { bg:'#f0fdf4', border:'#bbf7d0', text:'#15803d', header:'#22c55e' },
  Chiusa:      { bg:'#f8fafc', border:'#e2e8f0', text:'#475569', header:'#94a3b8' },
}
const STATI_SF = ['In attesa', 'In corso', 'Completata', 'Sospesa']
const disp = s => { if(!s)return""; const[y,m,dd]=s.split("-"); return`${dd}/${m}/${y}` }

export default function KanbanCommesse({ currentBU, commesse, setCommesse, currentRole, API }) {
  const [dragging, setDragging] = useState(null)
  const [dragOver, setDragOver] = useState(null)
  const [showArch, setShowArch] = useState(false)
  const [cerca, setCerca] = useState('')
  const [selectedCom, setSelectedCom] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [sottofasi, setSottofasi] = useState([])
  const [milestones, setMilestones] = useState([])
  const [computi, setComputi] = useState([])
  const [sicurezze, setSicurezze] = useState([])
  const [newSf, setNewSf] = useState({ nome:'', scad:'', stato:'In attesa' })
  const [newMs, setNewMs] = useState({ nome:'', scad:'' })
  const [newCp, setNewCp] = useState({ nome:'', scad:'', stato:'In attesa', importo:'' })
  const [newSk, setNewSk] = useState({ nome:'', scad:'', stato:'In attesa' })
  const [savingSf, setSavingSf] = useState(false)
  const [editSfId, setEditSfId] = useState(null)
  const [editSfData, setEditSfData] = useState({})
  const [editMsId, setEditMsId] = useState(null)
  const [editMsData, setEditMsData] = useState({})
  const [editCpId, setEditCpId] = useState(null)
  const [editCpData, setEditCpData] = useState({})
  const [editSkId, setEditSkId] = useState(null)
  const [editSkData, setEditSkData] = useState({})
  const [activeTab, setActiveTab] = useState('sottofasi')

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

  const loadComputi = async (comId) => {
    if (!comId) return
    try {
      const r = await axios.get(`${API}/computo/${comId}`)
      setComputi(r.data)
    } catch { setComputi([]) }
  }

  const loadSicurezze = async (comId) => {
    if (!comId) return
    try {
      const r = await axios.get(`${API}/sicurezza/${comId}`)
      setSicurezze(r.data)
    } catch { setSicurezze([]) }
  }

  const handleDragStart = (e, com) => { setDragging(com); e.dataTransfer.effectAllowed = 'move' }
  const handleDragOver = (e, stato) => { e.preventDefault(); setDragOver(stato) }
  const handleDrop = async (e, nuovoStato) => {
    e.preventDefault()
    if (!dragging || dragging.stato === nuovoStato) { setDragging(null); setDragOver(null); return }
    await axios.put(`${API}/commesse/${dragging.id}`, { ...dragging, stato: nuovoStato, arch: dragging.arch?1:0 })
    setCommesse(p => p.map(c => c.id===dragging.id ? {...c, stato:nuovoStato} : c))
    setDragging(null); setDragOver(null)
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
    setSottofasi([]); setMilestones([]); setComputi([]); setSicurezze([])
    setNewSf({ nome:'', scad:'', stato:'In attesa' })
    setNewMs({ nome:'', scad:'' })
    setNewCp({ nome:'', scad:'', stato:'In attesa', importo:'' })
    setNewSk({ nome:'', scad:'', stato:'In attesa' })
    setEditSfId(null); setEditMsId(null); setEditCpId(null); setEditSkId(null)
    setActiveTab('sottofasi')
    loadSottofasi(com.id)
    loadMilestones(com.id)
    loadComputi(com.id)
    loadSicurezze(com.id)
    setShowModal(true)
  }

  const handleSalvaModal = async () => {
    if (!selectedCom) return
    await axios.put(`${API}/commesse/${selectedCom.id}`, {
      cod: selectedCom.cod, tit: selectedCom.tit, cli: selectedCom.cli,
      stato: selectedCom.stato, src: selectedCom.src,
      arch: selectedCom.arch ? 1 : 0, sharepoint_url: selectedCom.sharepoint_url
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

  // Sottofasi CRUD
  const handleAddSf = async () => {
    if (!newSf.nome.trim()) return
    setSavingSf(true)
    const r = await axios.post(`${API}/sottofasi`, { com_id:selectedCom.id, bu_id:currentBU.id, nome:newSf.nome, scad:newSf.scad||null, stato:newSf.stato })
    setSottofasi(p => [...p, r.data])
    setNewSf({ nome:'', scad:'', stato:'In attesa' })
    setSavingSf(false)
  }
  const handleSaveSf = async (sf) => {
    await axios.put(`${API}/sottofasi/${sf.id}`, editSfData)
    setSottofasi(p => p.map(s => s.id===sf.id ? {...s, ...editSfData} : s))
    setEditSfId(null)
  }
  const handleDeleteSf = async (id) => {
    await axios.delete(`${API}/sottofasi/${id}`)
    setSottofasi(p => p.filter(s => s.id !== id))
  }

  // Milestone CRUD
  const handleAddMs = async () => {
    if (!newMs.nome.trim()) return
    const r = await axios.post(`${API}/milestones`, { com_id:selectedCom.id, bu_id:currentBU.id, nome:newMs.nome, scad:newMs.scad||null })
    setMilestones(p => [...p, r.data])
    setNewMs({ nome:'', scad:'' })
  }
  const handleSaveMs = async (ms) => {
    await axios.put(`${API}/milestones/${ms.id}`, editMsData)
    setMilestones(p => p.map(m => m.id===ms.id ? {...m, ...editMsData} : m))
    setEditMsId(null)
  }
  const handleDeleteMs = async (id) => {
    await axios.delete(`${API}/milestones/${id}`)
    setMilestones(p => p.filter(m => m.id !== id))
  }

  // Computo CRUD
  const handleAddCp = async () => {
    if (!newCp.nome.trim()) return
    const r = await axios.post(`${API}/computo`, { com_id:selectedCom.id, bu_id:currentBU.id, nome:newCp.nome, scad:newCp.scad||null, stato:newCp.stato, importo:parseFloat(newCp.importo)||0 })
    setComputi(p => [...p, r.data])
    setNewCp({ nome:'', scad:'', stato:'In attesa', importo:'' })
  }
  const handleSaveCp = async (cp) => {
    await axios.put(`${API}/computo/${cp.id}`, editCpData)
    setComputi(p => p.map(c => c.id===cp.id ? {...c, ...editCpData} : c))
    setEditCpId(null)
  }
  const handleDeleteCp = async (id) => {
    await axios.delete(`${API}/computo/${id}`)
    setComputi(p => p.filter(c => c.id !== id))
  }

  // Sicurezza CRUD
  const handleAddSk = async () => {
    if (!newSk.nome.trim()) return
    const r = await axios.post(`${API}/sicurezza`, { com_id:selectedCom.id, bu_id:currentBU.id, nome:newSk.nome, scad:newSk.scad||null, stato:newSk.stato })
    setSicurezze(p => [...p, r.data])
    setNewSk({ nome:'', scad:'', stato:'In attesa' })
  }
  const handleSaveSk = async (sk) => {
    await axios.put(`${API}/sicurezza/${sk.id}`, editSkData)
    setSicurezze(p => p.map(s => s.id===sk.id ? {...s, ...editSkData} : s))
    setEditSkId(null)
  }
  const handleDeleteSk = async (id) => {
    await axios.delete(`${API}/sicurezza/${id}`)
    setSicurezze(p => p.filter(s => s.id !== id))
  }

  const sfCol = stato => ({Completata:'#22c55e','In corso':'#3b82f6','In attesa':'#f59e0b',Sospesa:'#94a3b8'}[stato]||'#94a3b8')

  const TabBtn = ({id, label, count}) => (
    <button onClick={()=>setActiveTab(id)}
      style={{padding:'5px 12px',border:'none',borderBottom:`2px solid ${activeTab===id?TEAL:'transparent'}`,background:'none',cursor:'pointer',fontSize:12,fontWeight:activeTab===id?700:400,color:activeTab===id?TEAL:'#64748b',display:'flex',alignItems:'center',gap:5}}>
      {label}
      <span style={{fontSize:10,background:activeTab===id?TEAL:'#e2e8f0',color:activeTab===id?'#fff':'#64748b',borderRadius:10,padding:'0 5px',fontWeight:700}}>{count}</span>
    </button>
  )

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
                    style={{background:'#fff',borderRadius:8,padding:'10px 12px',border:`1px solid ${sc.border}`,cursor:'pointer',boxShadow:'0 1px 3px rgba(0,0,0,0.06)',opacity:dragging?.id===c.id?0.5:1}}>
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

      {/* Modal */}
      {showModal && selectedCom && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.4)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}
          onClick={e=>{ if(e.target===e.currentTarget) setShowModal(false) }}>
          <div style={{background:'#fff',borderRadius:10,width:620,maxWidth:'95vw',maxHeight:'92vh',display:'flex',flexDirection:'column',boxShadow:'0 12px 40px rgba(0,0,0,0.2)'}}>

            {/* Header */}
            <div style={{background:TEAL,borderRadius:'10px 10px 0 0',padding:'10px 16px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <span style={{color:'#fff',fontWeight:700,fontSize:14}}>{selectedCom.cod}</span>
                <span style={{color:'rgba(255,255,255,0.8)',fontSize:12,marginLeft:8}}>{selectedCom.tit?.slice(0,45)}</span>
              </div>
              <button onClick={()=>setShowModal(false)} style={{background:'none',border:'none',color:'#fff',fontSize:20,cursor:'pointer',lineHeight:1}}>×</button>
            </div>

            {/* Stato */}
            <div style={{padding:'10px 16px',borderBottom:'1px solid #e2e8f0',display:'flex',alignItems:'center',gap:12}}>
              <span style={{fontSize:12,color:'#64748b'}}>{selectedCom.cli}</span>
              <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:8}}>
                <label style={{fontSize:11,color:'#64748b'}}>Stato:</label>
                <select value={selectedCom.stato||''} onChange={e=>setSelectedCom(p=>({...p,stato:e.target.value}))}
                  disabled={!canEdit}
                  style={{padding:'4px 8px',borderRadius:6,border:'1px solid #e2e8f0',fontSize:12,outline:'none',color:'#1e293b'}}>
                  {STATI.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* Tab bar */}
            <div style={{display:'flex',borderBottom:'1px solid #e2e8f0',padding:'0 16px',background:'#fafafa',flexShrink:0}}>
              <TabBtn id="sottofasi" label="Sottofasi" count={sottofasi.length}/>
              <TabBtn id="milestone" label="⬡ Milestone" count={milestones.length}/>
              <TabBtn id="computo" label="📐 Computo" count={computi.length}/>
              <TabBtn id="sicurezza" label="⛑️ Sicurezza" count={sicurezze.length}/>
            </div>

            {/* Body tab */}
            <div style={{flex:1,overflowY:'auto',padding:'16px'}}>

              {/* SOTTOFASI */}
              {activeTab === 'sottofasi' && (
                <div>
                  {sottofasi.length === 0 && <div style={{textAlign:'center',color:'#94a3b8',fontSize:12,padding:'8px',fontStyle:'italic'}}>Nessuna sottofase</div>}
                  {sottofasi.map(sf => {
                    const sc = sfCol(sf.stato)
                    const isEditing = editSfId === sf.id
                    return (
                      <div key={sf.id} style={{padding:'8px 10px',background:'#f8fafc',borderRadius:7,marginBottom:4,border:'1px solid #e2e8f0'}}>
                        {isEditing ? (
                          <div style={{display:'flex',flexDirection:'column',gap:6}}>
                            <input value={editSfData.nome||''} onChange={e=>setEditSfData(p=>({...p,nome:e.target.value}))}
                              style={{padding:'5px 8px',borderRadius:5,border:'1px solid #e2e8f0',fontSize:12,outline:'none'}}/>
                            <div style={{display:'flex',gap:6}}>
                              <input type="date" value={editSfData.scad||''} onChange={e=>setEditSfData(p=>({...p,scad:e.target.value}))}
                                style={{flex:1,padding:'5px 8px',borderRadius:5,border:'1px solid #e2e8f0',fontSize:12,outline:'none'}}/>
                              <select value={editSfData.stato||''} onChange={e=>setEditSfData(p=>({...p,stato:e.target.value}))}
                                style={{flex:1,padding:'5px 8px',borderRadius:5,border:'1px solid #e2e8f0',fontSize:12,outline:'none',color:'#1e293b'}}>
                                {STATI_SF.map(s=><option key={s} value={s}>{s}</option>)}
                              </select>
                            </div>
                            <div style={{display:'flex',gap:6,justifyContent:'flex-end'}}>
                              <button onClick={()=>setEditSfId(null)} style={{padding:'4px 10px',borderRadius:5,border:'1px solid #e2e8f0',background:'#fff',cursor:'pointer',fontSize:11}}>Annulla</button>
                              <button onClick={()=>handleSaveSf(sf)} style={{padding:'4px 10px',borderRadius:5,border:'none',background:TEAL,color:'#fff',cursor:'pointer',fontSize:11,fontWeight:600}}>Salva</button>
                            </div>
                          </div>
                        ) : (
                          <div style={{display:'flex',alignItems:'center',gap:8}}>
                            <div style={{flex:1}}>
                              <span style={{fontSize:12,fontWeight:600,color:'#1e293b'}}>{sf.nome}</span>
                              {sf.scad && <span style={{fontSize:10,color:'#94a3b8',marginLeft:8}}>{disp(sf.scad)}</span>}
                            </div>
                            <span style={{fontSize:10,padding:'1px 6px',borderRadius:4,background:sc+'20',color:sc,fontWeight:600}}>{sf.stato}</span>
                            {canEdit && (
                              <>
                                <button onClick={()=>{ setEditSfId(sf.id); setEditSfData({nome:sf.nome,scad:sf.scad||'',stato:sf.stato}) }}
                                  style={{background:'none',border:'none',color:'#94a3b8',cursor:'pointer',fontSize:12,padding:'2px 4px'}}
                                  onMouseEnter={e=>e.currentTarget.style.color=TEAL}
                                  onMouseLeave={e=>e.currentTarget.style.color='#94a3b8'}>✏️</button>
                                <button onClick={()=>handleDeleteSf(sf.id)}
                                  style={{background:'none',border:'none',color:'#94a3b8',cursor:'pointer',fontSize:12,padding:'2px 4px'}}
                                  onMouseEnter={e=>e.currentTarget.style.color='#ef4444'}
                                  onMouseLeave={e=>e.currentTarget.style.color='#94a3b8'}>🗑</button>
                              </>
                            )}
                          </div>
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
              )}

              {/* MILESTONE */}
              {activeTab === 'milestone' && (
                <div>
                  {milestones.length === 0 && <div style={{textAlign:'center',color:'#94a3b8',fontSize:12,padding:'8px',fontStyle:'italic'}}>Nessuna milestone</div>}
                  {milestones.map(ms => {
                    const isEditing = editMsId === ms.id
                    return (
                      <div key={ms.id} style={{padding:'8px 10px',background:'#faf5ff',borderRadius:7,marginBottom:4,border:'1px solid #e9d5ff'}}>
                        {isEditing ? (
                          <div style={{display:'flex',flexDirection:'column',gap:6}}>
                            <input value={editMsData.nome||''} onChange={e=>setEditMsData(p=>({...p,nome:e.target.value}))}
                              style={{padding:'5px 8px',borderRadius:5,border:'1px solid #e2e8f0',fontSize:12,outline:'none'}}/>
                            <input type="date" value={editMsData.scad||''} onChange={e=>setEditMsData(p=>({...p,scad:e.target.value}))}
                              style={{padding:'5px 8px',borderRadius:5,border:'1px solid #e2e8f0',fontSize:12,outline:'none'}}/>
                            <div style={{display:'flex',gap:6,justifyContent:'flex-end'}}>
                              <button onClick={()=>setEditMsId(null)} style={{padding:'4px 10px',borderRadius:5,border:'1px solid #e2e8f0',background:'#fff',cursor:'pointer',fontSize:11}}>Annulla</button>
                              <button onClick={()=>handleSaveMs(ms)} style={{padding:'4px 10px',borderRadius:5,border:'none',background:'#7c3aed',color:'#fff',cursor:'pointer',fontSize:11,fontWeight:600}}>Salva</button>
                            </div>
                          </div>
                        ) : (
                          <div style={{display:'flex',alignItems:'center',gap:8}}>
                            <span style={{fontSize:14,color:'#7c3aed'}}>⬡</span>
                            <div style={{flex:1}}>
                              <span style={{fontSize:12,fontWeight:600,color:'#1e293b'}}>{ms.nome}</span>
                              {ms.scad && <span style={{fontSize:10,color:'#94a3b8',marginLeft:8}}>{disp(ms.scad)}</span>}
                            </div>
                            {canEdit && (
                              <>
                                <button onClick={()=>{ setEditMsId(ms.id); setEditMsData({nome:ms.nome,scad:ms.scad||''}) }}
                                  style={{background:'none',border:'none',color:'#94a3b8',cursor:'pointer',fontSize:12,padding:'2px 4px'}}
                                  onMouseEnter={e=>e.currentTarget.style.color='#7c3aed'}
                                  onMouseLeave={e=>e.currentTarget.style.color='#94a3b8'}>✏️</button>
                                <button onClick={()=>handleDeleteMs(ms.id)}
                                  style={{background:'none',border:'none',color:'#94a3b8',cursor:'pointer',fontSize:12,padding:'2px 4px'}}
                                  onMouseEnter={e=>e.currentTarget.style.color='#ef4444'}
                                  onMouseLeave={e=>e.currentTarget.style.color='#94a3b8'}>🗑</button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
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
              )}

              {/* COMPUTO */}
              {activeTab === 'computo' && (
                <div>
                  {computi.length === 0 && <div style={{textAlign:'center',color:'#94a3b8',fontSize:12,padding:'8px',fontStyle:'italic'}}>Nessun capitolo di computo</div>}
                  {computi.map(cp => {
                    const sc = sfCol(cp.stato)
                    const isEditing = editCpId === cp.id
                    return (
                      <div key={cp.id} style={{padding:'8px 10px',background:'#fff7ed',borderRadius:7,marginBottom:4,border:'1px solid #fed7aa'}}>
                        {isEditing ? (
                          <div style={{display:'flex',flexDirection:'column',gap:6}}>
                            <input value={editCpData.nome||''} onChange={e=>setEditCpData(p=>({...p,nome:e.target.value}))}
                              style={{padding:'5px 8px',borderRadius:5,border:'1px solid #e2e8f0',fontSize:12,outline:'none'}}/>
                            <div style={{display:'flex',gap:6}}>
                              <input type="date" value={editCpData.scad||''} onChange={e=>setEditCpData(p=>({...p,scad:e.target.value}))}
                                style={{flex:1,padding:'5px 8px',borderRadius:5,border:'1px solid #e2e8f0',fontSize:12,outline:'none'}}/>
                              <select value={editCpData.stato||''} onChange={e=>setEditCpData(p=>({...p,stato:e.target.value}))}
                                style={{flex:1,padding:'5px 8px',borderRadius:5,border:'1px solid #e2e8f0',fontSize:12,outline:'none',color:'#1e293b'}}>
                                {STATI_SF.map(s=><option key={s} value={s}>{s}</option>)}
                              </select>
                              <input value={editCpData.importo||''} onChange={e=>setEditCpData(p=>({...p,importo:e.target.value}))}
                                placeholder="Importo €" type="number"
                                style={{flex:1,padding:'5px 8px',borderRadius:5,border:'1px solid #e2e8f0',fontSize:12,outline:'none'}}/>
                            </div>
                            <div style={{display:'flex',gap:6,justifyContent:'flex-end'}}>
                              <button onClick={()=>setEditCpId(null)} style={{padding:'4px 10px',borderRadius:5,border:'1px solid #e2e8f0',background:'#fff',cursor:'pointer',fontSize:11}}>Annulla</button>
                              <button onClick={()=>handleSaveCp(cp)} style={{padding:'4px 10px',borderRadius:5,border:'none',background:'#ea580c',color:'#fff',cursor:'pointer',fontSize:11,fontWeight:600}}>Salva</button>
                            </div>
                          </div>
                        ) : (
                          <div style={{display:'flex',alignItems:'center',gap:8}}>
                            <span style={{fontSize:14,color:'#ea580c'}}>📐</span>
                            <div style={{flex:1}}>
                              <span style={{fontSize:12,fontWeight:600,color:'#1e293b'}}>{cp.nome}</span>
                              {cp.scad && <span style={{fontSize:10,color:'#94a3b8',marginLeft:8}}>{disp(cp.scad)}</span>}
                              {cp.importo > 0 && <span style={{fontSize:10,color:'#ea580c',marginLeft:8,fontWeight:600}}>€ {cp.importo.toLocaleString('it-IT')}</span>}
                            </div>
                            <span style={{fontSize:10,padding:'1px 6px',borderRadius:4,background:sc+'20',color:sc,fontWeight:600}}>{cp.stato}</span>
                            {canEdit && (
                              <>
                                <button onClick={()=>{ setEditCpId(cp.id); setEditCpData({nome:cp.nome,scad:cp.scad||'',stato:cp.stato,importo:cp.importo||''}) }}
                                  style={{background:'none',border:'none',color:'#94a3b8',cursor:'pointer',fontSize:12,padding:'2px 4px'}}
                                  onMouseEnter={e=>e.currentTarget.style.color='#ea580c'}
                                  onMouseLeave={e=>e.currentTarget.style.color='#94a3b8'}>✏️</button>
                                <button onClick={()=>handleDeleteCp(cp.id)}
                                  style={{background:'none',border:'none',color:'#94a3b8',cursor:'pointer',fontSize:12,padding:'2px 4px'}}
                                  onMouseEnter={e=>e.currentTarget.style.color='#ef4444'}
                                  onMouseLeave={e=>e.currentTarget.style.color='#94a3b8'}>🗑</button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                  {canEdit && (
                    <div style={{background:'#fff7ed',border:'1px solid #fed7aa',borderRadius:8,padding:'10px 12px',marginTop:8}}>
                      <div style={{fontSize:11,fontWeight:700,color:'#ea580c',marginBottom:8,textTransform:'uppercase',letterSpacing:0.5}}>Nuovo Capitolo Computo</div>
                      <input value={newCp.nome} onChange={e=>setNewCp(p=>({...p,nome:e.target.value}))} placeholder="Nome capitolo..."
                        style={{width:'100%',boxSizing:'border-box',padding:'6px 10px',borderRadius:6,border:'1px solid #e2e8f0',fontSize:12,outline:'none',marginBottom:6}}/>
                      <div style={{display:'flex',gap:8,alignItems:'center'}}>
                        <input type="date" value={newCp.scad} onChange={e=>setNewCp(p=>({...p,scad:e.target.value}))}
                          style={{flex:1,padding:'6px 10px',borderRadius:6,border:'1px solid #e2e8f0',fontSize:12,outline:'none'}}/>
                        <select value={newCp.stato} onChange={e=>setNewCp(p=>({...p,stato:e.target.value}))}
                          style={{flex:1,padding:'6px 10px',borderRadius:6,border:'1px solid #e2e8f0',fontSize:12,outline:'none',color:'#1e293b'}}>
                          {STATI_SF.map(s=><option key={s} value={s}>{s}</option>)}
                        </select>
                        <input value={newCp.importo} onChange={e=>setNewCp(p=>({...p,importo:e.target.value}))}
                          placeholder="€" type="number"
                          style={{flex:1,padding:'6px 10px',borderRadius:6,border:'1px solid #e2e8f0',fontSize:12,outline:'none'}}/>
                        <button onClick={handleAddCp} disabled={!newCp.nome.trim()}
                          style={{width:32,height:32,borderRadius:6,border:'none',background:'#ea580c',color:'#fff',fontWeight:700,cursor:'pointer',fontSize:18,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>+</button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* SICUREZZA */}
              {activeTab === 'sicurezza' && (
                <div>
                  {sicurezze.length === 0 && <div style={{textAlign:'center',color:'#94a3b8',fontSize:12,padding:'8px',fontStyle:'italic'}}>Nessun documento di sicurezza</div>}
                  {sicurezze.map(sk => {
                    const sc = sfCol(sk.stato)
                    const isEditing = editSkId === sk.id
                    return (
                      <div key={sk.id} style={{padding:'8px 10px',background:'#fef2f2',borderRadius:7,marginBottom:4,border:'1px solid #fecaca'}}>
                        {isEditing ? (
                          <div style={{display:'flex',flexDirection:'column',gap:6}}>
                            <input value={editSkData.nome||''} onChange={e=>setEditSkData(p=>({...p,nome:e.target.value}))}
                              style={{padding:'5px 8px',borderRadius:5,border:'1px solid #e2e8f0',fontSize:12,outline:'none'}}/>
                            <div style={{display:'flex',gap:6}}>
                              <input type="date" value={editSkData.scad||''} onChange={e=>setEditSkData(p=>({...p,scad:e.target.value}))}
                                style={{flex:1,padding:'5px 8px',borderRadius:5,border:'1px solid #e2e8f0',fontSize:12,outline:'none'}}/>
                              <select value={editSkData.stato||''} onChange={e=>setEditSkData(p=>({...p,stato:e.target.value}))}
                                style={{flex:1,padding:'5px 8px',borderRadius:5,border:'1px solid #e2e8f0',fontSize:12,outline:'none',color:'#1e293b'}}>
                                {STATI_SF.map(s=><option key={s} value={s}>{s}</option>)}
                              </select>
                            </div>
                            <div style={{display:'flex',gap:6,justifyContent:'flex-end'}}>
                              <button onClick={()=>setEditSkId(null)} style={{padding:'4px 10px',borderRadius:5,border:'1px solid #e2e8f0',background:'#fff',cursor:'pointer',fontSize:11}}>Annulla</button>
                              <button onClick={()=>handleSaveSk(sk)} style={{padding:'4px 10px',borderRadius:5,border:'none',background:'#dc2626',color:'#fff',cursor:'pointer',fontSize:11,fontWeight:600}}>Salva</button>
                            </div>
                          </div>
                        ) : (
                          <div style={{display:'flex',alignItems:'center',gap:8}}>
                            <span style={{fontSize:14}}>⛑️</span>
                            <div style={{flex:1}}>
                              <span style={{fontSize:12,fontWeight:600,color:'#1e293b'}}>{sk.nome}</span>
                              {sk.scad && <span style={{fontSize:10,color:'#94a3b8',marginLeft:8}}>{disp(sk.scad)}</span>}
                            </div>
                            <span style={{fontSize:10,padding:'1px 6px',borderRadius:4,background:sc+'20',color:sc,fontWeight:600}}>{sk.stato}</span>
                            {canEdit && (
                              <>
                                <button onClick={()=>{ setEditSkId(sk.id); setEditSkData({nome:sk.nome,scad:sk.scad||'',stato:sk.stato}) }}
                                  style={{background:'none',border:'none',color:'#94a3b8',cursor:'pointer',fontSize:12,padding:'2px 4px'}}
                                  onMouseEnter={e=>e.currentTarget.style.color='#dc2626'}
                                  onMouseLeave={e=>e.currentTarget.style.color='#94a3b8'}>✏️</button>
                                <button onClick={()=>handleDeleteSk(sk.id)}
                                  style={{background:'none',border:'none',color:'#94a3b8',cursor:'pointer',fontSize:12,padding:'2px 4px'}}
                                  onMouseEnter={e=>e.currentTarget.style.color='#ef4444'}
                                  onMouseLeave={e=>e.currentTarget.style.color='#94a3b8'}>🗑</button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                  {canEdit && (
                    <div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:8,padding:'10px 12px',marginTop:8}}>
                      <div style={{fontSize:11,fontWeight:700,color:'#dc2626',marginBottom:8,textTransform:'uppercase',letterSpacing:0.5}}>Nuovo Documento Sicurezza</div>
                      <input value={newSk.nome} onChange={e=>setNewSk(p=>({...p,nome:e.target.value}))} placeholder="Nome documento..."
                        style={{width:'100%',boxSizing:'border-box',padding:'6px 10px',borderRadius:6,border:'1px solid #e2e8f0',fontSize:12,outline:'none',marginBottom:6}}/>
                      <div style={{display:'flex',gap:8,alignItems:'center'}}>
                        <input type="date" value={newSk.scad} onChange={e=>setNewSk(p=>({...p,scad:e.target.value}))}
                          style={{flex:1,padding:'6px 10px',borderRadius:6,border:'1px solid #e2e8f0',fontSize:12,outline:'none'}}/>
                        <select value={newSk.stato} onChange={e=>setNewSk(p=>({...p,stato:e.target.value}))}
                          style={{flex:1,padding:'6px 10px',borderRadius:6,border:'1px solid #e2e8f0',fontSize:12,outline:'none',color:'#1e293b'}}>
                          {STATI_SF.map(s=><option key={s} value={s}>{s}</option>)}
                        </select>
                        <button onClick={handleAddSk} disabled={!newSk.nome.trim()}
                          style={{width:32,height:32,borderRadius:6,border:'none',background:'#dc2626',color:'#fff',fontWeight:700,cursor:'pointer',fontSize:18,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>+</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
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