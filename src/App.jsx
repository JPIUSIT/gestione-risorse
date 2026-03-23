import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import axios from 'axios'
import StepBU from './components/StepBU'
import StepRole from './components/StepRole'
import Shell from './components/Shell'

const API = 'http://localhost:3001/api'

export default function App() {
  const [buList, setBuList] = useState([])
  const [currentBU, setCurrentBU] = useState(null)
  const [currentRole, setCurrentRole] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get(`${API}/bu`)
      .then(r => { setBuList(r.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',fontFamily:'sans-serif',color:'#0d5c63'}}>
      Caricamento...
    </div>
  )

  const screen = !currentBU ? 'bu' : !currentRole ? 'role' : 'app'

  return (
    <>
      {screen === 'bu' && (
        <StepBU
          buList={buList}
          setBuList={setBuList}
          onSelect={bu => setCurrentBU(bu)}
        />
      )}
      {screen === 'role' && (
        <StepRole
          currentBU={currentBU}
          onSelect={role => setCurrentRole(role)}
          onBack={() => setCurrentBU(null)}
        />
      )}
      {screen === 'app' && (
        <Shell
          currentBU={currentBU}
          currentRole={currentRole}
          onLogout={() => { setCurrentBU(null); setCurrentRole(null) }}
          API={API}
        />
      )}
    </>
  )
}