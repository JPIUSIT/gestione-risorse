import { useMsal } from '@azure/msal-react'
import { loginRequest } from '../authConfig'

const TEAL = "#0d5c63"

export default function Login() {
  const { instance } = useMsal()

  const handleLogin = () => {
    instance.loginPopup(loginRequest).catch(e => console.error(e))
  }

  return (
    <div style={{minHeight:'100vh',background:'#f0f9fa',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'sans-serif'}}>
      <div style={{background:'#fff',borderRadius:16,boxShadow:'0 4px 32px #0d5c6318',padding:'48px 56px',textAlign:'center',maxWidth:400,width:'100%'}}>
        <div style={{width:64,height:64,borderRadius:18,background:TEAL,display:'inline-flex',alignItems:'center',justifyContent:'center',marginBottom:20,fontSize:32}}>
          🏢
        </div>
        <h1 style={{margin:'0 0 8px',fontSize:24,fontWeight:700,color:TEAL}}>Gestione Risorse</h1>
        <p style={{margin:'0 0 32px',color:'#64748b',fontSize:15}}>Accedi con il tuo account aziendale</p>
        <button onClick={handleLogin}
          style={{width:'100%',padding:'14px',borderRadius:10,border:'none',background:TEAL,color:'#fff',fontWeight:700,fontSize:15,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:10}}>
          <svg width="20" height="20" viewBox="0 0 21 21" fill="none">
            <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
            <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
            <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
            <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
          </svg>
          Accedi con Microsoft
        </button>
      </div>
    </div>
  )
}