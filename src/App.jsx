import { useEffect, useState } from 'react'
import { useMsal, useIsAuthenticated } from '@azure/msal-react'
import { loginRequest, getRuoloFromAccount } from './authConfig'
import axios from 'axios'
import StepBU from './components/StepBU'
import Shell from './components/Shell'
import Login from './components/Login'
import NoAccess from './components/NoAccess'

const API = '/api'
const TEAL = "#0d5c63"

export default function App() {
  const { instance, accounts } = useMsal()
  const isAuthenticated = useIsAuthenticated()
  const [buList, setBuList] = useState([])
  const [currentBU, setCurrentBU] = useState(null)
  const [currentRole, setCurrentRole] = useState(null)
  const [loadingBU, setLoadingBU] = useState(true)
  const [loading, setLoading] = useState(true)

  const user = accounts[0]
  const ruolo = getRuoloFromAccount(user)
  const email = user?.username

  useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return }

    axios.get(`${API}/bu`).then(r => {
      setBuList(r.data)

      if (ruolo === 'Admin') {
        // Admin vede tutto, sceglie la BU
        setLoadingBU(false)
        setLoading(false)
      } else if (ruolo === 'Coordinatore') {
        // Coordinatore: carica la sua BU principale ma può anche vedere le altre come Membro
        axios.get(`${API}/utenti/me/${email}`).then(res => {
          if (res.data) {
            const buAssegnata = r.data.find(b => b.id === res.data.bu_id)
            if (buAssegnata) {
              setCurrentBU(buAssegnata)
              setCurrentRole('Coordinatore')
            }
          }
          setLoadingBU(false)
          setLoading(false)
        }).catch(() => { setLoadingBU(false); setLoading(false) })
      } else if (ruolo === 'Membro') {
        // Membro: va direttamente alla sua BU
        axios.get(`${API}/utenti/me/${email}`).then(res => {
          if (res.data) {
            const buAssegnata = r.data.find(b => b.id === res.data.bu_id)
            if (buAssegnata) {
              setCurrentBU(buAssegnata)
              setCurrentRole('Membro')
            }
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

  // Se non ha ancora selezionato la BU (Admin o Coordinatore senza BU assegnata)
  if (!currentBU) return (
    <StepBU
      buList={buList}
      setBuList={setBuList}
      onSelect={(bu, roleOverride) => {
        setCurrentBU(bu)
        setCurrentRole(roleOverride || ruolo)
      }}
      user={user}
      onLogout={() => instance.logoutPopup()}
      API={API}
      ruoloUtente={ruolo}
    />
  )

  return (
    <Shell
      currentBU={currentBU}
      currentRole={currentRole || ruolo}
      onLogout={() => { setCurrentBU(null); setCurrentRole(null) }}
      onGlobalLogout={() => instance.logoutPopup()}
      user={user}
      API={API}
    />
  )
}