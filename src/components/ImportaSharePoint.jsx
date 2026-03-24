import { useState } from 'react'
import { useMsal } from '@azure/msal-react'
import { graphRequest } from '../authConfig'
import axios from 'axios'

const TEAL = "#0d5c63"

export default function ImportaSharePoint({ currentBU, commesse, setCommesse, setTab, API }) {
  const { instance, accounts } = useMsal()
  const [siti, setSiti] = useState([])
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [selected, setSelected] = useState({})
  const [errore, setErrore] = useState('')
  const [successo, setSuccesso] = useState('')
  const [cerca, setCerca] = useState('')

  const caricaSiti = async () => {
    setLoading(true)
    setErrore('')
    try {
      const tokenResp = await instance.acquireTokenSilent({
        ...graphRequest,
        account: accounts[0]
      })
      const token = tokenResp.accessToken

      const resp = await fetch(
        'https://graph.microsoft.com/v1.0/sites?search=*&$top=200&$select=id,displayName,webUrl,createdDateTime',
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const data = await resp.json()

      if (data.error) {
        setErrore(`Errore Graph: ${data.error.message}`)
        setLoading(false)
        return
      }

      setSiti(data.value || [])
      setLoading(false)
    } catch(e) {
      setErrore('Errore nel caricamento dei siti. Verifica i permessi.')
      setLoading(false)
    }
  }

  const toggleSite = (id) => {
    setSelected(p => ({ ...p, [id]: !p[id] }))
  }

  const handleImporta = async () => {
    const selezionati = siti.filter(s => selected[s.id])
    if (selezionati.length === 0) return
    setImporting(true)
    setErrore('')
    setSuccesso('')

    let importati = 0
    for (const sito of selezionati) {
      if (commesse.find(c => c.sharepoint_url === sito.webUrl)) continue
      try {
        const r = await axios.post(`${API}/commesse`, {
          bu_id: currentBU.id,
          cod: sito.displayName.slice(0,20),
          tit: sito.displayName,
          cli: '',
          stato: 'Attiva',
          src: 'SharePoint',
          sharepoint_url: sito.webUrl
        })
        setCommesse(p => [...p, r.data])
        importati++
      } catch(e) {
        console.error('Errore importazione sito', sito.displayName)
      }
    }

    setImporting(false)
    setSelected({})
    setSuccesso(`${importati} commess${importati===1?'a':'e'} importat${importati===1?'a':'e'} con successo!`)
  }

  const giàImportati = (url) => commesse.some(c => c.sharepoint_url === url)
  const nSelezionati = Object.values(selected).filter(Boolean).length

  // Filtra per ricerca
  const sitiFiltrati = siti.filter(s =>
    s.displayName?.toLowerCase().includes(cerca.toLowerCase()) ||
    s.webUrl?.toLowerCase().includes(cerca.toLowerCase())
  )

  return (
    <div style={{maxWidth:800}}>
      <h2 style={{margin:'0 0 20px',color:'#1e293b',fontSize:18}}>📁 Importa da SharePoint</h2>

      <div style={{background:'#fff',borderRadius:12,padding:20,border:'1px solid #e2e8f0',marginBottom:20}}>
        <p style={{margin:'0 0 16px',fontSize:14,color:'#64748b'}}>
          Clicca <strong>Carica siti</strong> per vedere tutti i siti SharePoint del tenant.
          Seleziona quelli da agganciare come commesse nell'app.
        </p>
        <button onClick={caricaSiti} disabled={loading}
          style={{padding:'10px 20px',borderRadius:8,border:'none',background:TEAL,color:'#fff',fontWeight:700,cursor:'pointer',fontSize:14}}>
          {loading ? 'Caricamento...' : '🔄 Carica siti SharePoint'}
        </button>
      </div>

      {errore && (
        <div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:8,padding:'12px 16px',fontSize:13,color:'#dc2626',marginBottom:16}}>
          ⚠️ {errore}
        </div>
      )}

      {successo && (
        <div style={{background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:8,padding:'12px 16px',fontSize:13,color:'#15803d',marginBottom:16}}>
          ✅ {successo}
        </div>
      )}

      {siti.length > 0 && (
        <>
          {/* Barra ricerca */}
          <div style={{position:'relative',marginBottom:12}}>
            <span style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',fontSize:16,color:'#94a3b8'}}>🔍</span>
            <input
              value={cerca}
              onChange={e => setCerca(e.target.value)}
              placeholder="Cerca per nome commessa o URL..."
              style={{width:'100%',padding:'10px 12px 10px 38px',borderRadius:8,border:'1px solid #e2e8f0',fontSize:14,outline:'none',boxSizing:'border-box'}}
            />
            {cerca && (
              <button onClick={() => setCerca('')}
                style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',fontSize:16,color:'#94a3b8'}}>
                ✕
              </button>
            )}
          </div>

          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12,flexWrap:'wrap',gap:8}}>
            <span style={{fontSize:14,color:'#64748b'}}>
              {cerca ? `${sitiFiltrati.length} risultati` : `${siti.length} siti totali`} — {nSelezionati} selezionati
            </span>
            <button onClick={handleImporta} disabled={importing || nSelezionati===0}
              style={{padding:'8px 18px',borderRadius:8,border:'none',background:nSelezionati>0?TEAL:'#e2e8f0',color:nSelezionati>0?'#fff':'#94a3b8',fontWeight:700,cursor:nSelezionati>0?'pointer':'default',fontSize:14}}>
              {importing ? 'Importazione...' : `Importa ${nSelezionati} selezinat${nSelezionati===1?'o':'i'}`}
            </button>
          </div>

          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {sitiFiltrati.length === 0 ? (
              <div style={{padding:'24px',textAlign:'center',color:'#94a3b8',fontSize:14,background:'#fff',borderRadius:10,border:'1px solid #e2e8f0'}}>
                Nessun sito trovato per "{cerca}"
              </div>
            ) : (
              sitiFiltrati.map(sito => {
                const isImportato = giàImportati(sito.webUrl)
                const isSelected = selected[sito.id]
                return (
                  <div key={sito.id}
                    onClick={() => !isImportato && toggleSite(sito.id)}
                    style={{
                      background: isImportato ? '#f8fafc' : isSelected ? '#f0f9fa' : '#fff',
                      borderRadius:10,
                      padding:'14px 18px',
                      border:`2px solid ${isImportato?'#e2e8f0':isSelected?TEAL:'#e2e8f0'}`,
                      cursor: isImportato ? 'default' : 'pointer',
                      display:'flex',alignItems:'center',gap:14,
                      opacity: isImportato ? 0.6 : 1
                    }}>
                    <div style={{width:20,height:20,borderRadius:4,border:`2px solid ${isImportato?'#e2e8f0':isSelected?TEAL:'#cbd5e1'}`,background:isSelected&&!isImportato?TEAL:'#fff',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                      {isSelected && !isImportato && <span style={{color:'#fff',fontSize:12,fontWeight:700}}>✓</span>}
                      {isImportato && <span style={{color:'#94a3b8',fontSize:10}}>✓</span>}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:600,color:'#1e293b',fontSize:14,marginBottom:2}}>{sito.displayName}</div>
                      <div style={{fontSize:12,color:'#94a3b8',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{sito.webUrl}</div>
                    </div>
                    <div style={{flexShrink:0,textAlign:'right'}}>
                      {isImportato ? (
                        <span style={{fontSize:11,background:'#f0fdf4',color:'#15803d',padding:'2px 8px',borderRadius:8,fontWeight:600}}>Già importata</span>
                      ) : (
                        <span style={{fontSize:11,color:'#94a3b8'}}>
                          {new Date(sito.createdDateTime).toLocaleDateString('it-IT')}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </>
      )}
    </div>
  )
}