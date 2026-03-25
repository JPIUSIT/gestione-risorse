import { useState, useEffect } from 'react'
import axios from 'axios'

const TEAL = "#0d5c63"
const AV_PAL = ["#ef4444","#3b82f6","#22c55e","#a855f7","#f59e0b","#06b6d4","#ec4899","#84cc16","#f97316","#6366f1","#14b8a6","#e11d48"]
const cCol = id => { let h=0; for(let i=0;i<(id||"").length;i++) h=(h*31+id.charCodeAt(i))&0xffff; return AV_PAL[h%AV_PAL.length] }

export default function GestioneRisorse({ currentBU, risorse, setRisorse, API, currentRole }) {
  const [categorie, setCategorie] = useState([])
  const [cerca, setCerca] = useState('')
  const [dragRis, setDragRis] = useState(null)
  const [dragOverCat, setDragOverCat] = useState(null)
  const [showNuovaCat, setShowNuovaCat] = useState(false)
  const [nuovaCatNome, setNuovaCatNome] = useState('')
  const [savingCat, setSavingCat] = useState(false)

  const canEdit = currentRole === 'Admin' || currentRole === 'Coordinatore'

  useEffect(() => {
    if (!currentBU) return
    axios.get(`${API}/categorie/${currentBU.id}`).then(r => setCategorie(r.data)).catch(()=>{})
  }, [currentBU])

  const risorseFiltrate = risorse.filter(r =>
    !cerca || `${r.nome} ${r.cogn}`.toLowerCase().includes(cerca.toLowerCase()) ||
    r.ruolo?.toLowerCase().includes(cerca.toLowerCase())
  )

  const risPerCat = (catId) => risorse.filter(r => r.cat_id === catId)
  const risNonAssegnate = risorse.filter(r => !r.cat_id || !categorie.find(c => c.id === r.cat_id))

  const handleDragStart = (e, ris) => {
    setDragRis(ris)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDrop = async (e, catId) => {
    e.preventDefault()
    if (!dragRis || dragRis.cat_id === catId) { setDragRis(null); setDragOverCat(null); return }
    try {
      await axios.put(`${API}/risorse/${dragRis.id}`, { ...dragRis, cat_id: catId })
      setRisorse(p => p.map(r => r.id === dragRis.id ? { ...r, cat_id: catId } : r))
    } catch(e) { console.error(e) }
    setDragRis(null)
    setDragOverCat(null)
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
      const r = await axios.post(`${API}/categorie`, {
        bu_id: currentBU.id,
        nome: nuovaCatNome.trim(),
        ord: categorie.length + 1
      })
      setCategorie(p => [...p, r.data])
      setNuovaCatNome('')
      setShowNuovaCat(false)
    } catch(e) { console.error(e) }
    setSavingCat(false)
  }

  const handleDeleteCategoria = async (catId) => {
    if (!window.confirm('Eliminare questa categoria? Le risorse assegnate diventeranno non assegnate.')) return
    try {
      await axios.delete(`${API}/categorie/${catId}`)
      setCategorie(p => p.filter(c => c.id !== catId))
      setRisorse(p => p.map(r => r.cat_id === catId ? { ...r, cat_id: null } : r))
    } catch(e) { console.error(e) }
  }

  const RisCard = ({ ris, draggable, onRemove }) => {
    const col = cCol(ris.id)
    const rgb = `${parseInt(col.slice(1,3),16)},${parseInt(col.slice(3,5),16)},${parseInt(col.slice(5,7),16)}`
    return (
      <div
        draggable={draggable}
        onDragStart={e => draggable && handleDragStart(e, ris)}
        style={{display:'flex',alignItems:'center',gap:8,padding:'7px 10px',background:'#fff',borderRadius:7,border:'1px solid #e2e8f0',cursor:draggable?'grab':'default',opacity:dragRis?.id===ris.id?0.4:1,marginBottom:4}}>
        {draggable && <span style={{color:'#cbd5e1',fontSize:12,cursor:'grab'}}>⠿</span>}
        <div style={{width:28,height:28,borderRadius:'50%',background:`rgba(${rgb},0.15)`,border:`1.5px solid rgba(${rgb},0.5)`,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:10,color:col,flexShrink:0}}>
          {ris.nome?.[0]}{ris.cogn?.[0]}
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontWeight:600,fontSize:12,color:'#1e293b'}}>{ris.nome} {ris.cogn}</div>
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
          <div style={{fontWeight:700,fontSize:14,color:'#fff',marginBottom:2}}>Risorse J+S</div>
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
            <div key={ris.id}
              draggable={canEdit}
              onDragStart={e => canEdit && handleDragStart(e, ris)}
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
              <div style={{minWidth:0}}>
                <div style={{fontWeight:600,fontSize:11,color:'#fff'}}>{ris.nome} {ris.cogn}</div>
                <div style={{fontSize:10,color:'rgba(255,255,255,0.5)'}}>{ris.ruolo}</div>
              </div>
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
          {canEdit && (
            <span style={{fontSize:11,color:'#94a3b8',fontStyle:'italic'}}>· Trascina da J+S o tra categorie · Trascina colonne per riordinarle</span>
          )}
          {canEdit && (
            <div style={{marginLeft:'auto',display:'flex',gap:8,alignItems:'center'}}>
              {showNuovaCat ? (
                <>
                  <input value={nuovaCatNome} onChange={e=>setNuovaCatNome(e.target.value)}
                    placeholder="Nome categoria..."
                    onKeyDown={e=>e.key==='Enter'&&handleAddCategoria()}
                    autoFocus
                    style={{padding:'5px 10px',borderRadius:6,border:'1px solid #e2e8f0',fontSize:12,outline:'none',width:160}}/>
                  <button onClick={handleAddCategoria} disabled={savingCat||!nuovaCatNome.trim()}
                    style={{padding:'5px 12px',borderRadius:6,border:'none',background:TEAL,color:'#fff',fontWeight:600,cursor:'pointer',fontSize:12}}>
                    Aggiungi
                  </button>
                  <button onClick={()=>{setShowNuovaCat(false);setNuovaCatNome('')}}
                    style={{padding:'5px 10px',borderRadius:6,border:'1px solid #e2e8f0',background:'#fff',cursor:'pointer',fontSize:12}}>
                    Annulla
                  </button>
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
            return (
              <div key={cat.id}
                onDragOver={e=>{e.preventDefault();setDragOverCat(cat.id)}}
                onDrop={e=>handleDrop(e, cat.id)}
                onDragLeave={()=>setDragOverCat(null)}
                style={{flex:1,display:'flex',flexDirection:'column',borderRight:'1px solid #e2e8f0',minWidth:200,background:isDragOver?'#f0f9fa':'#f8fafc',transition:'background .1s'}}>

                {/* Header categoria */}
                <div style={{background:TEAL,padding:'8px 12px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
                  <div>
                    <span style={{fontWeight:700,fontSize:13,color:'#fff'}}>{cat.nome}</span>
                    <span style={{fontSize:11,color:'rgba(255,255,255,0.6)',marginLeft:8}}>{ris.length} risorse</span>
                  </div>
                  {canEdit && (
                    <button onClick={()=>handleDeleteCategoria(cat.id)}
                      style={{background:'none',border:'none',color:'rgba(255,255,255,0.4)',cursor:'pointer',fontSize:14,padding:'0 4px',lineHeight:1}}
                      onMouseEnter={e=>e.currentTarget.style.color='#fca5a5'}
                      onMouseLeave={e=>e.currentTarget.style.color='rgba(255,255,255,0.4)'}>⋯</button>
                  )}
                </div>

                {/* Risorse nella categoria */}
                <div style={{flex:1,overflowY:'auto',padding:'8px'}}>
                  {ris.length === 0 ? (
                    <div style={{textAlign:'center',color:'#cbd5e1',fontSize:11,padding:'20px 0',fontStyle:'italic',border:'2px dashed #e2e8f0',borderRadius:8,margin:'4px'}}>
                      Vuota
                    </div>
                  ) : (
                    ris.map(r => (
                      <RisCard key={r.id} ris={r} draggable={canEdit} onRemove={handleRemoveFromCat}/>
                    ))
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
                {risNonAssegnate.map(r => (
                  <RisCard key={r.id} ris={r} draggable={canEdit} onRemove={null}/>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}