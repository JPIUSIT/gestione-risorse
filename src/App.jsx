import { useEffect, useState } from 'react'
import { useMsal, useIsAuthenticated } from '@azure/msal-react'
import { loginRequest, getRuoloFromAccount } from './authConfig'
import axios from 'axios'
import StepBU from './components/StepBU'
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
  const [loadingBU, setLoadingBU] = useState(true)
  const [loading, setLoading] = useState(true)

  const user = accounts[0]
  const ruolo = getRuoloFromAccount(user)
  const email = user?.username

  useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return }

    // Carica lista BU
    axios.get(`${API}/bu`).then(r => {
      setBuList(r.data)

      // Se non è Admin, cerca la sua BU assegnata
      if (ruolo !== 'Admin') {
        axios.get(`${API}/utenti/me/${email}`).then(res => {
          if (res.data) {
            const buAssegnata = r.data.find(b => b.id === res.data.bu_id)
            if (buAssegnata) setCurrentBU(buAssegnata)
          }
          setLoadingBU(false)
          setLoading(false)
        }).catch(() => { setLoadingBU(false); setLoading(false) })
      } else {
        setLoadingBU(false)
        setLoading(false)
      }
    }).catch(() => setLoading(false))
  }, [isAuthenticated])

  if (!isAuthenticated) return <Login />

  if (loading || loadingBU) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',fontFamily:'sans-serif',color:TEAL}}>
      Caricamento...
    </div>
  )

  if (!ruolo) return <NoAccess user={user} onLogout={() => instance.logoutPopup()} />

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
      onLogout={() => setCurrentBU(null)}
      onGlobalLogout={() => instance.logoutPopup()}
      user={user}
      API={API}
    />
  )
}