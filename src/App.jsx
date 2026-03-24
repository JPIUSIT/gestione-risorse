import { useEffect, useState } from 'react'
import { useMsal, useIsAuthenticated } from '@azure/msal-react'
import { loginRequest, getRuoloFromAccount } from './authConfig'
import axios from 'axios'
import StepBU from './components/StepBU'
import StepRole from './components/StepRole'
import Shell from './components/Shell'
import Login from './components/Login'
import NoAccess from './components/NoAccess'

const API = 'http://localhost:3001/api'
const TEAL = "#0d5c63"

export default function App() {
  const { instance, accounts } = useMsal()
  const isAuthenticated = useIsAuthenticated()
  const [buList, setBuList] = useState([])
  const [currentBU, setCurrentBU] = useState(null)
  const [loading, setLoading] = useState(true)

  const user = accounts[0]
  const ruolo = getRuoloFromAccount(user)

  useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return }
    axios.get(`${API}/bu`)
      .then(r => { setBuList(r.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [isAuthenticated])

  if (!isAuthenticated) return <Login />

  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',fontFamily:'sans-serif',color:TEAL}}>
      Caricamento...
    </div>
  )

  // Utente autenticato ma senza ruolo assegnato
  if (!ruolo) return <NoAccess user={user} onLogout={() => instance.logoutPopup()} />

  // Admin — sceglie la BU manualmente
  if (ruolo === 'Admin' && !currentBU) return (
    <StepBU
      buList={buList}
      setBuList={setBuList}
      onSelect={bu => setCurrentBU(bu)}
      user={user}
      onLogout={() => instance.logoutPopup()}
    />
  )

  // Coordinatore/Membro — la BU verrà assegnata automaticamente (per ora sceglie)
  if (!currentBU) return (
    <StepBU
      buList={buList}
      setBuList={setBuList}
      onSelect={bu => setCurrentBU(bu)}
      user={user}
      onLogout={() => instance.logoutPopup()}
    />
  )

  return (
    <Shell
      currentBU={currentBU}
      currentRole={ruolo}
      onLogout={() => { setCurrentBU(null) }}
      user={user}
      API={API}
      onGlobalLogout={() => instance.logoutPopup()}
    />
  )
}