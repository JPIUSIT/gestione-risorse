const TEAL = "#0d5c63"

const RUOLI = [
  { id: 'COORD', label: 'Coordinatore', desc: 'Gestisci risorse e allocazioni', icon: '👤' },
  { id: 'MEMBRO', label: 'Membro', desc: 'Visualizza il tuo calendario', icon: '📅' },
  { id: 'ADMIN', label: 'Admin', desc: 'Accesso completo a tutte le BU', icon: '⚙️' },
]

export default function StepRole({ currentBU, onSelect, onBack }) {
  return (
    <div style={{minHeight:'100vh',background:'#f0f9fa',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',fontFamily:'sans-serif'}}>
      <div style={{background:'#fff',borderRadius:16,boxShadow:'0 4px 32px #0d5c6318',padding:'40px 48px',minWidth:400,maxWidth:500,width:'100%'}}>
        <button onClick={onBack} style={{background:'none',border:'none',color:'#64748b',cursor:'pointer',fontSize:13,marginBottom:24,padding:0}}>
          ← Torna alle BU
        </button>
        <div style={{textAlign:'center',marginBottom:32}}>
          <div style={{width:48,height:48,borderRadius:12,background:TEAL,display:'inline-flex',alignItems:'center',justifyContent:'center',marginBottom:10,fontSize:22}}>
            🏢
          </div>
          <h2 style={{margin:0,fontSize:20,fontWeight:700,color:TEAL}}>{currentBU?.nome}</h2>
          <p style={{margin:'6px 0 0',color:'#64748b',fontSize:14}}>Seleziona il tuo ruolo</p>
        </div>

        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {RUOLI.map(r => (
            <div key={r.id} onClick={() => onSelect(r.id)}
              style={{display:'flex',alignItems:'center',gap:16,padding:'16px 20px',borderRadius:10,border:'2px solid #e2e8f0',cursor:'pointer'}}
              onMouseEnter={e => e.currentTarget.style.borderColor=TEAL}
              onMouseLeave={e => e.currentTarget.style.borderColor='#e2e8f0'}
            >
              <span style={{fontSize:24}}>{r.icon}</span>
              <div>
                <div style={{fontWeight:600,color:'#1e293b',fontSize:15}}>{r.label}</div>
                <div style={{color:'#64748b',fontSize:13}}>{r.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}