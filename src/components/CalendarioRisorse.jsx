import { useState, useMemo } from 'react'
import axios from 'axios'

const TEAL = "#0d5c63"
const AV_PAL = ["#ef4444","#3b82f6","#22c55e","#a855f7","#f59e0b","#06b6d4","#ec4899","#84cc16","#f97316","#6366f1","#14b8a6","#e11d48"]
const h2r = h => [parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)].join(",")
const cCol = id => { let h=0; for(let i=0;i<(id||"").length;i++) h=(h*31+id.charCodeAt(i))&0xffff; return AV_PAL[h%AV_PAL.length] }
const li = (hex,a=0.15) => `rgba(${h2r(hex)},${a})`

const monday = d => { const dt=new Date(d),dy=dt.getDay(),df=dt.getDate()-dy+(dy===0?-6:1); return new Date(new Date(dt).setDate(df)) }
const addD = (d,n) => { const dt=new Date(d); dt.setDate(dt.getDate()+n); return dt }
const iso = d => { const dt=new Date(d); return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}` }
const disp = s => { if(!s)return""; const[y,m,dd]=s.split("-"); return`${dd}/${m}/${y}` }
const dayL = s => ["Dom","Lun","Mar","Mer","Gio","Ven","Sab"][new Date(s+"T00:00:00").getDay()]
const dayNum = s => new Date(s+"T00:00:00").getDate()
const monthS = s => new Date(s+"T00:00:00").toLocaleDateString("it-IT",{month:"short"})

export default function CalendarioRisorse({ currentBU, risorse, commesse, allocazioni, setAllocazioni, API, layout, selectedCom, selectedRis, setSelectedRis }) {
  const [weekStart, setWeekStart] = useState(iso(monday(new Date())))
  const [showModal, setShowModal] = useState(false)
  const [modalData, setModalData] = useState(null)

  // Form allocazione
  const [fComId, setFComId] = useState('')
  const [fSfId, setFSfId] = useState('')
  const [fRisId, setFRisId] = useState('')
  const [fDa, setFDa] = useState('')
  const [fA, setFA] = useState('')
  const [fOre, setFOre] = useState(8)
  const [fNote, setFNote] = useState('')
  const [fSequenza, setFSequenza] = useState(false)
  const [saving, setSaving] = useState(false)
  const [sottofasi, setSottofasi] = useState([])

  const weekDays = useMemo(() => Array.from({length:6}, (_,i) => iso(addD(weekStart, i))), [weekStart])
  const today = iso(new Date())

  const prevWeek = () => setWeekStart(iso(addD(weekStart,-7)))
  const nextWeek = () => setWeekStart(iso(addD(weekStart,7)))
  const goToday = () => setWeekStart(iso(monday(new Date())))

  const getAlloc = (risId, data) => allocazioni.filter(a => a.ris_id===risId && a.data===data)
  const getTotOre = (risId, data) => getAlloc(risId, data).reduce((s,a) => s+(a.ore||0), 0)

  const loadSottofasi = async (comId) => {
    if (!comId) { setSottofasi([]); return }
    try {
      const r = await axios.get(`${API}/sottofasi/${currentBU.id}`)
      setSottofasi(r.data.filter(s => s.com_id === comId && s.stato !== 'Completata'))
    } catch { setSottofasi([]) }
  }

  const openModal = (ris, data) => {
    const allocs = getAlloc(ris.id, data)
    const preComId = selectedCom?.id || allocs[0]?.com_id || commesse.find(c=>c.stato==='Attiva')?.id || ''
    setFComId(preComId)
    setFSfId(allocs[0]?.sf_id || '')
    setFRisId(ris.id)
    setFDa(data)
    setFA(data)
    setFOre(allocs[0]?.ore || 8)
    setFNote(allocs[0]?.note || '')
    setFSequenza(false)
    setModalData({ ris, data, existing: allocs })
    loadSottofasi(preComId)
    setShowModal(true)
  }

  const handleComChange = (comId) => {
    setFComId(comId)
    setFSfId('')
    loadSottofasi(comId)
  }

  const handleSalva = async () => {
    if (!fRisId || !fComId || !fDa) return
    setSaving(true)
    try {
      // Elimina allocazioni esistenti per quel giorno/risorsa
      const existing = getAlloc(fRisId, modalData.data)
      for (const a of existing) {
        await axios.delete(`${API}/allocazioni/${a.id}`)
      }

      if (fOre > 0) {
        if (fSequenza && fA && fA > fDa) {
          // Inserisci in sequenza su più giorni lavorativi
          let current = new Date(fDa+'T00:00:00')
          const end = new Date(fA+'T00:00:00')
          const newAllocs = []
          while (current <= end) {
            const dow = current.getDay()
            if (dow !== 0 && dow !== 6) { // skip weekend
              const dataStr = iso(current)
              const r = await axios.post(`${API}/allocazioni`, {
                bu_id: currentBU.id,
                ris_id: fRisId,
                com_id: fComId,
                sf_id: fSfId || null,
                data: dataStr,
                ore: fOre,
                note: fNote
              })
              newAllocs.push(r.data)
            }
            current.setDate(current.getDate()+1)
          }
          setAllocazioni(p => [
            ...p.filter(a => !(a.ris_id===fRisId && a.data>=fDa && a.data<=fA)),
            ...newAllocs
          ])
        } else {
          // Singolo giorno
          const r = await axios.post(`${API}/allocazioni`, {
            bu_id: currentBU.id,
            ris_id: fRisId,
            com_id: fComId,
            sf_id: fSfId || null,
            data: fDa,
            ore: fOre,
            note: fNote
          })
          setAllocazioni(p => [...p.filter(a => !(a.ris_id===fRisId && a.data===modalData.data)), r.data])
        }
      } else {
        setAllocazioni(p => p.filter(a => !(a.ris_id===fRisId && a.data===modalData.data)))
      }
    } catch(e) { console.error(e) }
    setSaving(false)
    setShowModal(false)
  }

  const handleElimina = async () => {
    if (!modalData) return
    const existing = getAlloc(fRisId, modalData.data)
    for (const a of existing) {
      await axios.delete(`${API}/allocazioni/${a.id}`)
    }
    setAllocazioni(p => p.filter(a => !(a.ris_id===fRisId && a.data===modalData.data)))
    setShowModal(false)
  }

  const commesseAttive = commesse.filter(c => c.stato==='Attiva'||c.stato==='Pianificata')

  // Risorse filtrate per risorsa selezionata (se presente)
  const risorseDamostrare = selectedRis ? risorse.filter(r=>r.id===selectedRis.id) : risorse

  return (
    <div style={{height:'100%',display:'flex',flexDirection:'column',overflow:'hidden',flex:1}}>

      {/* Navigazione settimana */}
      <div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 12px',background:'#fff',borderBottom:'1px solid #e2e8f0',flexShrink:0}}>
        <button onClick={prevWeek} style={{padding:'4px 10px',borderRadius:6,border:'1px solid #e2e8f0',background:'#fff',cursor:'pointer',fontSize:14}}>‹</button>
        <button onClick={goToday} style={{padding:'4px 10px',borderRadius:6,border:'1px solid #e2e8f0',background:'#fff',cursor:'pointer',fontSize:12}}>Oggi</button>
        <button onClick={nextWeek} style={{padding:'4px 10px',borderRadius:6,border:'1px solid #e2e8f0',background:'#fff',cursor:'pointer',fontSize:14}}>›</button>
        <span style={{fontWeight:700,color:TEAL,fontSize:13,marginLeft:4}}>
          {disp(weekDays[0])} – {disp(weekDays[5])}
        </span>
        {selectedRis && (
          <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:8,background:'#f0f9fa',border:'1px solid #bfdbfe',borderRadius:6,padding:'3px 10px'}}>
            <span style={{fontSize:12,color:TEAL,fontWeight:600}}>{selectedRis.nome} {selectedRis.cogn}</span>
            <button onClick={()=>setSelectedRis(null)} style={{background:'none',border:'none',cursor:'pointer',color:'#94a3b8',fontSize:14,lineHeight:1}}>×</button>
          </div>
        )}
        {selectedCom && (
          <div style={{marginLeft: selectedRis?4:'auto',display:'flex',alignItems:'center',gap:8,background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:6,padding:'3px 10px'}}>
            <span style={{fontSize:12,color:'#15803d',fontWeight:600}}>{selectedCom.cod}</span>
          </div>
        )}
      </div>

      {/* Griglia calendario */}
      <div style={{flex:1,overflowX:'auto',overflowY:'auto'}}>
        <table style={{borderCollapse:'collapse',width:'100%',minWidth:600}}>
          <thead style={{position:'sticky',top:0,zIndex:2,background:'#fff'}}>
            <tr>
              <th style={{width:160,padding:'6px 12px',textAlign:'left',fontSize:11,color:'#64748b',fontWeight:600,borderBottom:'2px solid #e2e8f0',background:'#fff'}}>Risorsa</th>
              {weekDays.map(d => (
                <th key={d} style={{padding:'4px',textAlign:'center',fontSize:11,color:d===today?TEAL:'#64748b',fontWeight:d===today?700:500,borderBottom:'2px solid #e2e8f0',minWidth:90,background:d===today?'#f0f9fa':'#fff'}}>
                  <div style={{fontWeight:700,fontSize:13}}>{dayL(d)}</div>
                  <div style={{fontSize:10}}>{dayNum(d)} {monthS(d)}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {risorseDamostrare.map((ris,ri) => (
              <tr key={ris.id} style={{background:ri%2===0?'#fff':'#fafafa'}}>
                <td style={{padding:'6px 12px',borderBottom:'1px solid #f1f5f9'}}>
                  <div style={{display:'flex',alignItems:'center',gap:6}}>
                    <div style={{width:26,height:26,borderRadius:'50%',background:li(cCol(ris.id),0.18),border:`1.5px solid ${li(cCol(ris.id),0.6)}`,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:9,color:cCol(ris.id),flexShrink:0}}>
                      {ris.nome?.[0]}{ris.cogn?.[0]}
                    </div>
                    <div>
                      <div style={{fontWeight:600,fontSize:11,color:'#1e293b'}}>{ris.nome} {ris.cogn}</div>
                      <div style={{fontSize:10,color:'#94a3b8'}}>{ris.ruolo}</div>
                    </div>
                  </div>
                </td>
                {weekDays.map(d => {
                  const allocs = getAlloc(ris.id, d)
                  const tot = getTotOre(ris.id, d)
                  const col = allocs[0] ? cCol(allocs[0].com_id) : null
                  const isWeekend = [0,6].includes(new Date(d+'T00:00:00').getDay())
                  const isToday = d===today
                  return (
                    <td key={d} onClick={() => !isWeekend && openModal(ris,d)}
                      style={{padding:'3px',borderBottom:'1px solid #f1f5f9',textAlign:'center',cursor:isWeekend?'default':'pointer',background:isWeekend?'#f8fafc':isToday?'#f0f9fa':'',verticalAlign:'middle',minWidth:90}}>
                      {isWeekend ? (
                        <span style={{fontSize:10,color:'#e2e8f0'}}>—</span>
                      ) : allocs.length > 0 ? (
                        <div style={{background:li(col,0.15),border:`1px solid ${li(col,0.35)}`,borderRadius:5,padding:'3px 5px',display:'inline-block',minWidth:60}}>
                          <div style={{fontSize:11,fontWeight:700,color:col}}>{tot}h</div>
                          <div style={{fontSize:9,color:col,opacity:0.8,maxWidth:80,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                            {commesse.find(c=>c.id===allocs[0].com_id)?.cod||''}
                          </div>
                        </div>
                      ) : (
                        <span style={{fontSize:16,color:'#e2e8f0',lineHeight:1}}>+</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Nuova Allocazione */}
      {showModal && modalData && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.4)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}
          onClick={e=>{ if(e.target===e.currentTarget) setShowModal(false) }}>
          <div style={{background:'#fff',borderRadius:10,width:500,maxWidth:'95vw',maxHeight:'90vh',display:'flex',flexDirection:'column',boxShadow:'0 12px 40px rgba(0,0,0,0.2)'}}>
            {/* Header modal */}
            <div style={{background:TEAL,borderRadius:'10px 10px 0 0',padding:'10px 16px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{color:'#fff',fontWeight:700,fontSize:13}}>Nuova Allocazione</span>
              <button onClick={()=>setShowModal(false)} style={{background:'none',border:'none',color:'#fff',fontSize:20,cursor:'pointer',lineHeight:1}}>×</button>
            </div>

            {/* Body modal */}
            <div style={{flex:1,overflowY:'auto',padding:'16px'}}>

              {/* Intestazione risorsa selezionata */}
              {modalData.ris && (
                <div style={{background:'#f8fafc',borderRadius:7,padding:'8px 12px',marginBottom:12,display:'flex',alignItems:'center',gap:8}}>
                  <div style={{width:28,height:28,borderRadius:'50%',background:li(cCol(modalData.ris.id),0.18),border:`1.5px solid ${li(cCol(modalData.ris.id),0.6)}`,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:10,color:cCol(modalData.ris.id)}}>
                    {modalData.ris.nome?.[0]}{modalData.ris.cogn?.[0]}
                  </div>
                  <div>
                    <div style={{fontSize:12,fontWeight:700,color:'#1e293b'}}>{modalData.ris.nome} {modalData.ris.cogn}</div>
                    <div style={{fontSize:10,color:'#94a3b8'}}>{modalData.ris.ruolo}</div>
                  </div>
                  <div style={{marginLeft:'auto',fontSize:11,color:TEAL,fontWeight:600}}>{disp(modalData.data)}</div>
                </div>
              )}

              {/* Commessa */}
              <div style={{marginBottom:10}}>
                <label style={{fontSize:11,fontWeight:600,color:'#64748b',display:'block',marginBottom:3}}>Commessa *</label>
                <select value={fComId} onChange={e=>handleComChange(e.target.value)}
                  style={{width:'100%',padding:'7px 10px',borderRadius:7,border:'1.5px solid #e2e8f0',fontSize:12,outline:'none',color:'#1e293b'}}>
                  <option value="">Seleziona...</option>
                  {commesseAttive.map(c => <option key={c.id} value={c.id}>{c.cod} – {c.tit?.slice(0,40)}</option>)}
                </select>
              </div>

              {/* Sottofase */}
              <div style={{marginBottom:10}}>
                <label style={{fontSize:11,fontWeight:600,color:'#64748b',display:'block',marginBottom:3}}>Sottofase</label>
                <select value={fSfId} onChange={e=>setFSfId(e.target.value)}
                  style={{width:'100%',padding:'7px 10px',borderRadius:7,border:'1.5px solid #e2e8f0',fontSize:12,outline:'none',color:'#1e293b'}}>
                  <option value="">Nessuna</option>
                  {sottofasi.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                </select>
              </div>

              {/* Inserisci in sequenza */}
              <div style={{marginBottom:12,background:'#f0f9fa',border:'1px solid #bfdbfe',borderRadius:7,padding:'8px 12px'}}>
                <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:12,fontWeight:600,color:TEAL}}>
                  <input type="checkbox" checked={fSequenza} onChange={e=>setFSequenza(e.target.checked)}
                    style={{width:14,height:14,cursor:'pointer'}}/>
                  Inserisci in sequenza
                </label>
                <div style={{fontSize:10,color:'#64748b',marginTop:2,paddingLeft:22}}>Ore distribuire in progressione sui giorni disponibili</div>
              </div>

              {/* Date */}
              <div style={{display:'flex',gap:10,marginBottom:10}}>
                <div style={{flex:1}}>
                  <label style={{fontSize:11,fontWeight:600,color:'#64748b',display:'block',marginBottom:3}}>Da *</label>
                  <input type="date" value={fDa} onChange={e=>setFDa(e.target.value)}
                    style={{width:'100%',padding:'7px 10px',borderRadius:7,border:'1.5px solid #e2e8f0',fontSize:12,outline:'none',boxSizing:'border-box'}}/>
                </div>
                <div style={{flex:1}}>
                  <label style={{fontSize:11,fontWeight:600,color:'#64748b',display:'block',marginBottom:3}}>A *</label>
                  <input type="date" value={fA} onChange={e=>setFA(e.target.value)}
                    disabled={!fSequenza}
                    style={{width:'100%',padding:'7px 10px',borderRadius:7,border:'1.5px solid #e2e8f0',fontSize:12,outline:'none',boxSizing:'border-box',background:!fSequenza?'#f8fafc':'#fff',color:!fSequenza?'#94a3b8':'#1e293b'}}/>
                </div>
              </div>

              {/* Ore/giorno */}
              <div style={{marginBottom:10}}>
                <label style={{fontSize:11,fontWeight:600,color:'#64748b',display:'block',marginBottom:6}}>Ore/giorno *</label>
                <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
                  {[0.5,1,1.5,2,2.5,3,3.5,4,4.5,5,5.5,6,6.5,7,7.5,8].map(o => (
                    <button key={o} onClick={()=>setFOre(o)}
                      style={{padding:'4px 9px',borderRadius:5,border:`1px solid ${fOre===o?TEAL:'#e2e8f0'}`,background:fOre===o?TEAL:'#fff',color:fOre===o?'#fff':'#1e293b',fontWeight:fOre===o?700:400,cursor:'pointer',fontSize:12}}>
                      {o}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note */}
              <div style={{marginBottom:4}}>
                <label style={{fontSize:11,fontWeight:600,color:'#64748b',display:'block',marginBottom:3}}>Note</label>
                <input value={fNote} onChange={e=>setFNote(e.target.value)} placeholder="Opzionale..."
                  style={{width:'100%',padding:'7px 10px',borderRadius:7,border:'1.5px solid #e2e8f0',fontSize:12,outline:'none',boxSizing:'border-box'}}/>
              </div>
            </div>

            {/* Footer modal */}
            <div style={{padding:'10px 16px',borderTop:'1px solid #e2e8f0',display:'flex',gap:8,justifyContent:'flex-end',background:'#f8fafc',borderRadius:'0 0 10px 10px'}}>
              {modalData.existing?.length > 0 && (
                <button onClick={handleElimina}
                  style={{padding:'7px 14px',borderRadius:7,border:'1px solid #fecaca',background:'#fff',color:'#ef4444',cursor:'pointer',fontSize:12,fontWeight:600,marginRight:'auto'}}>
                  Elimina
                </button>
              )}
              <button onClick={()=>setShowModal(false)}
                style={{padding:'7px 14px',borderRadius:7,border:'1px solid #e2e8f0',background:'#fff',cursor:'pointer',fontSize:12}}>
                Annulla
              </button>
              <button onClick={handleSalva} disabled={saving||!fComId}
                style={{padding:'7px 14px',borderRadius:7,border:'none',background:fComId?TEAL:'#e2e8f0',color:fComId?'#fff':'#94a3b8',fontWeight:700,cursor:fComId?'pointer':'default',fontSize:12}}>
                {saving?'Salvataggio...':'Salva'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}