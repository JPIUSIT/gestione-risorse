import { useState } from 'react'
import axios from 'axios'

const TEAL = "#0d5c63"
const API = 'http://localhost:3001/api'

export default function StepBU({ buList, setBuList, onSelect }) {
  const [showAdd, setShowAdd] = useState(false)
  const [nome, setNome] = useState('')
  const [codice, setCodice] = useState('')

  const handleAdd = async () => {
    if (!nome.trim()) return
    const r = await axios.post(`${API}/bu`, { nome, codice: codice || nome.slice(0,3).toUpperCase() })
    setBuList(p => [...p, r.data])
    setNome(''); setCodice(''); setShowAdd(false)
  }

  const handleDelete = async (id, e) => {
    e.stopPropagation()
    if (!window.confirm('Eliminare questa BU?')) return
    await axios.delete(`${API}/bu/${id}`)
    setBuList(p => p.filter(b => b.id !== id))
  }

  return (
    <div style={{minHeight:'100vh',background:'#f0f9fa',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',fontFamily:'sans-serif'}}>
      <div style={{background:'#fff',borderRadius:16,boxShadow:'0 4px 32px #0d5c6318',padding:'40px 48px',minWidth:400,maxWidth:560,width:'100%'}}>
        <div style={{textAlign:'center',marginBottom:32}}>
          <div style={{width:56,height:56,borderRadius:16,background:TEAL,display:'inline-flex',alignItems:'center',justifyContent:'center',marginBottom:12}}>
            <span style={{fontSize:28}}>🏢</span>
          </div>
          <h1 style={{margin:0,fontSize:22,fontWeight:700,color:TEAL}}>Gestione Risorse</h1>
          <p style={{margin:'8px 0 0',color:'#64748b',fontSize:14}}>Seleziona la Business Unit</p>
        </div>

        <div style={{display:'flex',flexDirection:'column',gap:12,marginBottom:24}}>
          {buList.map(bu => (
            <div key={bu.id} onClick={() => onSelect(bu)}
              style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 20px',borderRadius:10,border:'2px solid #e2e8f0',cursor:'pointer',transition:'all .15s',background:'#fff'}}
              onMouseEnter={e => e.currentTarget.style.borderColor=TEAL}
              onMouseLeave={e => e.currentTarget.style.borderColor='#e2e8f0'}
            >
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <div style={{width:36,height:36,borderRadius:8,background:TEAL,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:12}}>
                  {bu.codice}
                </div>
                <span style={{fontWeight:600,color:'#1e293b'}}>{bu.nome}</span>
              </div>
              <button onClick={e => handleDelete(bu.id, e)}
                style={{background:'none',border:'none',color:'#94a3b8',cursor:'pointer',fontSize:16,padding:'4px 8px',borderRadius:6}}
                onMouseEnter={e => e.currentTarget.style.color='#ef4444'}
                onMouseLeave={e => e.currentTarget.style.color='#94a3b8'}
              >✕</button>
            </div>
          ))}
        </div>

        {showAdd ? (
          <div style={{display:'flex',flexDirection:'column',gap:8,padding:16,background:'#f8fafc',borderRadius:10,border:'1px solid #e2e8f0'}}>
            <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome BU (es. IDR – Idraulica)"
              style={{padding:'8px 12px',borderRadius:7,border:'1px solid #e2e8f0',fontSize:14,outline:'none'}}/>
            <input value={codice} onChange={e => setCodice(e.target.value)} placeholder="Codice (es. IDR)"
              style={{padding:'8px 12px',borderRadius:7,border:'1px solid #e2e8f0',fontSize:14,outline:'none'}}/>
            <div style={{display:'flex',gap:8}}>
              <button onClick={handleAdd}
                style={{flex:1,padding:'8px',borderRadius:7,border:'none',background:TEAL,color:'#fff',fontWeight:600,cursor:'pointer',fontSize:14}}>
                Aggiungi
              </button>
              <button onClick={() => setShowAdd(false)}
                style={{flex:1,padding:'8px',borderRadius:7,border:'1px solid #e2e8f0',background:'#fff',cursor:'pointer',fontSize:14}}>
                Annulla
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowAdd(true)}
            style={{width:'100%',padding:'12px',borderRadius:10,border:'2px dashed #cbd5e1',background:'none',color:'#64748b',cursor:'pointer',fontSize:14,fontWeight:500}}>
            + Nuova Business Unit
          </button>
        )}
      </div>
    </div>
  )
}