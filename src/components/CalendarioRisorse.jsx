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

const ORE_OPTIONS = [0.5,1,1.5,2,2.5,3,3.5,4,4.5,5,5.5,6,6.5,7,7.5,8]

export default function CalendarioRisorse({ currentBU, risorse, commesse, allocazioni, setAllocazioni, API, layout, selectedCom, selectedRis, setSelectedRis }) {
  const [weekStart, setWeekStart] = useState(iso(monday(new Date())))
  const [editCell, setEditCell] = useState(null)
  const [editOre, setEditOre] = useState(0)
  const [editCom, setEditCom] = useState('')

  const weekDays = useMemo(() => {
    return Array.from({length:6}, (_,i) => iso(addD(weekStart, i)))
  }, [weekStart])

  const prevWeek = () => setWeekStart(iso(addD(weekStart,-7)))
  const nextWeek = () => setWeekStart(iso(addD(weekStart,7)))
  const goToday = () => setWeekStart(iso(monday(new Date())))

  const today = iso(new Date())

  const getAlloc = (risId, data) => {
    return allocazioni.filter(a => a.ris_id===risId && a.data===data)
  }

  const getTotOre = (risId, data) => {
    return getAlloc(risId, data).reduce((s,a) => s+(a.ore||0), 0)
  }

  const handleCellClick = (ris, data) => {
    const allocs = getAlloc(ris.id, data)
    setSelectedRis(ris)
    setEditCell({risId: ris.id, data})
    setEditOre(allocs[0]?.ore || 0)
    setEditCom(allocs[0]?.com_id || (commesse[0]?.id || ''))
  }

  const handleSave = async () => {
    if (!editCell) return
    const { risId, data } = editCell
    const existing = getAlloc(risId, data)

    // Elimina allocazioni esistenti per quel giorno/risorsa
    for (const a of existing) {
      await axios.delete(`${API}/allocazioni/${a.id}`)
    }

    if (editOre > 0 && editCom) {
      const r = await axios.post(`${API}/allocazioni`, {
        bu_id: currentBU.id,
        ris_id: risId,
        com_id: editCom,
        data,
        ore: editOre
      })
      setAllocazioni(p => [...p.filter(a => !(a.ris_id===risId && a.data===data)), r.data])
    } else {
      setAllocazioni(p => p.filter(a => !(a.ris_id===risId && a.data===data)))
    }
    setEditCell(null)
  }

  const commesseAttive = commesse.filter(c => c.stato === 'Attiva' || c.stato === 'Pianificata')

  return (
    <div style={{fontFamily:'sans-serif', height:'100%', display:'flex', flexDirection:'column', overflow:'hidden', flex:1}}>
      {/* Navigazione settimana */}
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20}}>
        <button onClick={prevWeek} style={{padding:'6px 14px',borderRadius:7,border:'1px solid #e2e8f0',background:'#fff',cursor:'pointer',fontSize:14}}>‹</button>
        <button onClick={goToday} style={{padding:'6px 14px',borderRadius:7,border:'1px solid #e2e8f0',background:'#fff',cursor:'pointer',fontSize:13}}>Oggi</button>
        <button onClick={nextWeek} style={{padding:'6px 14px',borderRadius:7,border:'1px solid #e2e8f0',background:'#fff',cursor:'pointer',fontSize:14}}>›</button>
        <span style={{fontWeight:700,color:TEAL,fontSize:15}}>
          Settimana del {disp(iso(addD(weekStart,1)))} – {disp(iso(addD(weekStart,6)))}
        </span>
      </div>

      {/* Griglia calendario */}
      <div style={{overflowX:'auto', flex:1, overflowY:'auto'}}>
        <table style={{borderCollapse:'collapse',width:'100%',minWidth:700}}>
          <thead>
            <tr>
              <th style={{width:160,padding:'8px 12px',textAlign:'left',fontSize:12,color:'#64748b',fontWeight:600,borderBottom:'2px solid #e2e8f0'}}>Risorsa</th>
              {weekDays.map(d => (
                <th key={d} style={{padding:'6px 4px',textAlign:'center',fontSize:11,color:d===today?TEAL:'#64748b',fontWeight:d===today?700:500,borderBottom:'2px solid #e2e8f0',minWidth:80,background:d===today?'#f0f9fa':''}}>
                  <div style={{fontWeight:700,fontSize:13}}>{dayL(d)}</div>
                  <div style={{fontSize:11}}>{dayNum(d)} {monthS(d)}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {risorse.map((ris,ri) => (
              <tr key={ris.id} style={{background:ri%2===0?'#fff':'#fafafa'}}>
                <td style={{padding:'8px 12px',borderBottom:'1px solid #f1f5f9'}}>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <div style={{width:30,height:30,borderRadius:8,background:cCol(ris.id),color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:11,flexShrink:0}}>
                      {ris.nome?.[0]}{ris.cogn?.[0]}
                    </div>
                    <div>
                      <div style={{fontWeight:600,fontSize:12,color:'#1e293b'}}>{ris.nome} {ris.cogn}</div>
                      <div style={{fontSize:10,color:'#94a3b8'}}>{ris.ruolo}</div>
                    </div>
                  </div>
                </td>
                {weekDays.map(d => {
                  const allocs = getAlloc(ris.id, d)
                  const tot = getTotOre(ris.id, d)
                  const isEditing = editCell?.risId===ris.id && editCell?.data===d
                  const col = allocs[0] ? cCol(allocs[0].com_id) : null
                  const isWeekend = [0,6].includes(new Date(d+'T00:00:00').getDay())
                  return (
                    <td key={d} onClick={() => !isWeekend && handleCellClick(ris,d)}
                      style={{padding:'4px',borderBottom:'1px solid #f1f5f9',textAlign:'center',cursor:isWeekend?'default':'pointer',background:isWeekend?'#f8fafc':d===today?'#f0f9fa':'',verticalAlign:'middle',minWidth:80}}>
                      {isWeekend ? (
                        <span style={{fontSize:10,color:'#cbd5e1'}}>—</span>
                      ) : allocs.length > 0 ? (
                        <div style={{background:li(col,0.18),border:`1px solid ${li(col,0.4)}`,borderRadius:6,padding:'3px 6px',display:'inline-block',minWidth:52}}>
                          <div style={{fontSize:11,fontWeight:700,color:col}}>{tot}h</div>
                          <div style={{fontSize:9,color:col,opacity:0.8,maxWidth:70,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                            {commesse.find(c=>c.id===allocs[0].com_id)?.cod || ''}
                          </div>
                        </div>
                      ) : (
                        <span style={{fontSize:18,color:'#e2e8f0',lineHeight:1}}>+</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pannello modifica allocazione */}
      {editCell && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.3)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000}}>
          <div style={{background:'#fff',borderRadius:14,padding:28,minWidth:340,boxShadow:'0 8px 40px #0003'}}>
            <h3 style={{margin:'0 0 16px',color:TEAL,fontSize:16}}>
              {selectedRis?.nome} {selectedRis?.cogn} — {disp(editCell.data)}
            </h3>
            <div style={{marginBottom:12}}>
              <label style={{fontSize:13,color:'#64748b',display:'block',marginBottom:4}}>Commessa</label>
              <select value={editCom} onChange={e=>setEditCom(e.target.value)}
                style={{width:'100%',padding:'8px 10px',borderRadius:7,border:'1px solid #e2e8f0',fontSize:14,outline:'none'}}>
                <option value="">— Nessuna —</option>
                {commesseAttive.map(c => (
                  <option key={c.id} value={c.id}>{c.cod} – {c.tit}</option>
                ))}
              </select>
            </div>
            <div style={{marginBottom:20}}>
              <label style={{fontSize:13,color:'#64748b',display:'block',marginBottom:4}}>Ore</label>
              <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                {ORE_OPTIONS.map(o => (
                  <button key={o} onClick={()=>setEditOre(o)}
                    style={{padding:'5px 10px',borderRadius:6,border:`1px solid ${editOre===o?TEAL:'#e2e8f0'}`,background:editOre===o?TEAL:'#fff',color:editOre===o?'#fff':'#1e293b',fontWeight:editOre===o?700:400,cursor:'pointer',fontSize:13}}>
                    {o}
                  </button>
                ))}
              </div>
            </div>
            <div style={{display:'flex',gap:10}}>
              <button onClick={handleSave}
                style={{flex:1,padding:'10px',borderRadius:8,border:'none',background:TEAL,color:'#fff',fontWeight:700,cursor:'pointer',fontSize:14}}>
                Salva
              </button>
              <button onClick={()=>setEditCell(null)}
                style={{flex:1,padding:'10px',borderRadius:8,border:'1px solid #e2e8f0',background:'#fff',cursor:'pointer',fontSize:14}}>
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}