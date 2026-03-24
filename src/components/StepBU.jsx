import { useState } from 'react'
import axios from 'axios'

const TEAL = "#0d5c63"
const API = 'http://localhost:3002/api'

export default function StepBU({ buList, setBuList, onSelect, user, onLogout }) {
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

  const ruolo = user?.idTokenClaims?.roles?.[0] || 'Nessun ruolo'

  return (
    <div style={{minHeight:'100vh',background:'#f0f9fa',fontFamily:'sans-serif'}}>

      {/* Barra superiore */}
      <div style={{position:'fixed',top:0,left:0,right:0,background:TEAL,color:'#fff',padding:'0 24px',height:48,display:'flex',alignItems:'center',justifyContent:'space-between',zIndex:100}}>
        <span style={{fontWeight:700,fontSize:15}}>Gestione Risorse</span>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <span style={{fontSize:13}}>{user?.name || user?.username}</span>
          <span style={{background:'rgba(255,255,255,0.2)',borderRadius:6,padding:'2px 10px',fontSize:12,fontWeight:600}}>
            {ruolo}
          </span>
          <button onClick={onLogout}
            style={{background:'rgba(255,255,255,0.15)',border:'none',color:'#fff',padding:'5px 12px',borderRadius:6,cursor:'pointer',fontSize:12}}>
            Esci
          </button>
        </div>
      </div>

      {/* Contenuto centrato */}
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'100vh',paddingTop:48}}>
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
                {ruolo === 'Admin' && (
                  <button onClick={e => handleDelete(bu.id, e)}
                    style={{background:'none',border:'none',color:'#94a3b8',cursor:'pointer',fontSize:16,padding:'4px 8px',borderRadius:6}}
                    onMouseEnter={e => e.currentTarget.style.color='#ef4444'}
                    onMouseLeave={e => e.currentTarget.style.color='#94a3b8'}
                  >✕</button>
                )}
              </div>
            ))}
          </div>

          {ruolo === 'Admin' && (
            showAdd ? (
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
            )
          )}
        </div>
      </div>
    </div>
  )
}