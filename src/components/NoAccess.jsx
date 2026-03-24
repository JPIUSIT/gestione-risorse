const TEAL = "#0d5c63"

export default function NoAccess({ user, onLogout }) {
  return (
    <div style={{minHeight:'100vh',background:'#f0f9fa',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'sans-serif'}}>
      <div style={{background:'#fff',borderRadius:16,boxShadow:'0 4px 32px #0d5c6318',padding:'48px 56px',textAlign:'center',maxWidth:440,width:'100%'}}>
        <div style={{fontSize:48,marginBottom:16}}>🔒</div>
        <h2 style={{margin:'0 0 8px',color:'#1e293b',fontSize:20}}>Accesso non autorizzato</h2>
        <p style={{margin:'0 0 8px',color:'#64748b',fontSize:14}}>
          Il tuo account <strong>{user?.username}</strong> non ha un ruolo assegnato in questa applicazione.
        </p>
        <p style={{margin:'0 0 24px',color:'#94a3b8',fontSize:13}}>
          Contatta l'amministratore per richiedere l'accesso.
        </p>
        <button onClick={onLogout}
          style={{padding:'10px 24px',borderRadius:8,border:'1px solid #e2e8f0',background:'#fff',cursor:'pointer',fontSize:14,color:'#64748b'}}>
          Esci
        </button>
      </div>
    </div>
  )
}