import { useState, useEffect, useCallback } from "react";
import { Car, Plus, ClipboardList, CalendarDays, RefreshCw, LogOut, Bell, Search } from "lucide-react";
import { sb, SERVICES, STATUS_META, fmt, MSP_WHATSAPP } from "../config";
import IntakeForm from "../components/IntakeForm";

export default function EmployeeUI({ onLogout }) {
  const [tab,     setTab]    = useState("intake");
  const [entries, setEntries]= useState([]);
  const [appts,   setAppts]  = useState([]);
  const [loading, setLoading]= useState(false);
  const [toast,   setToast]  = useState(null);
  const [searchQ, setSearchQ] = useState("");

  const showToast = (msg, type="success") => { setToast({msg,type}); setTimeout(()=>setToast(null),3500); };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const [logs, bookings] = await Promise.all([
        sb(`services_log?select=id,services,total_bill,status,vehicle_source,created_at,customers(name,phone),vehicles(car_model,plate)&order=created_at.desc&created_at=gte.${today}T00:00:00`, { method:"GET" }),
        sb("appointments?select=*&status=eq.Pending&order=appt_date.asc", { method:"GET" }),
      ]);
      setEntries((logs||[]).map(l=>({ id:l.id, name:l.customers?.name||"—", phone:l.customers?.phone||"—", carModel:l.vehicles?.car_model||"—", plate:l.vehicles?.plate||"—", services:l.services||[], status:l.status||"Queued", bill:l.total_bill||0, source:l.vehicle_source||"customer" })));
      setAppts(bookings||[]);
    } catch(e) { showToast("Load error: "+e.message,"error"); }
    finally { setLoading(false); }
  }, []);

  useEffect(()=>{ loadData(); },[loadData]);

  const confirmAppt = async (appt) => {
    try {
      await sb(`appointments?id=eq.${appt.id}`,{ method:"PATCH", prefer:"return=minimal", body:JSON.stringify({status:"Confirmed"}) });
      const svcNames=(appt.services||[]).map(id=>SERVICES.find(s=>s.id===id)?.label||id).join(", ");
      const waText=encodeURIComponent(`✅ *Appointment Confirmed — MSP Studio*\n\nHi ${appt.customer_name}! Your booking is confirmed.\n\n🚘 ${appt.car_model}\n🛠️ ${svcNames||"—"}\n📅 ${appt.appt_date} at ${appt.appt_time}\n\nSee you at the studio! 🚗✨`);
      window.open(`https://wa.me/${appt.phone?.replace(/\D/g,"")??""}?text=${waText}`,"_blank");
      showToast("Confirmed!"); loadData();
    } catch(e) { showToast("Error: "+e.message,"error"); }
  };

  const TABS = [
    { id:"intake", label:"Register Customer", icon:Plus          },
    { id:"jobs",   label:"Today's Jobs",      icon:ClipboardList },
    { id:"appts",  label:"Appointments",      icon:Bell          },
  ];

  return (
    <div style={{ minHeight:"100vh", background:"#0b1120", fontFamily:"'DM Sans','Segoe UI',sans-serif", color:"#e2e8f0" }}>
      {toast&&<div style={{ position:"fixed", top:16, right:16, zIndex:999, background:toast.type==="error"?"#1c0a0a":"#052e16", border:`1px solid ${toast.type==="error"?"#7f1d1d":"#16a34a"}`, color:toast.type==="error"?"#f87171":"#4ade80", borderRadius:10, padding:"11px 16px", fontSize:13, fontWeight:600, boxShadow:"0 8px 32px #00000060" }}>{toast.msg}</div>}

      <header style={{ background:"linear-gradient(135deg,#0f1e3a,#0b1120)", borderBottom:"1px solid #1e2d4a", padding:"0 24px", position:"sticky", top:0, zIndex:50 }}>
        <div style={{ maxWidth:1100, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", height:60 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:34, height:34, borderRadius:9, background:"linear-gradient(135deg,#3b82f6,#1d4ed8)", display:"flex", alignItems:"center", justifyContent:"center" }}><Car size={18} color="white"/></div>
            <div><div style={{ fontSize:14, fontWeight:700, color:"#f1f5f9" }}>MSP Studio — Employee Panel</div><div style={{ fontSize:11, color:"#475569" }}>🔧 Staff View</div></div>
          </div>
          <nav style={{ display:"flex", gap:4 }}>
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)} style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 12px", borderRadius:7, border:"none", cursor:"pointer", fontSize:12, fontWeight:500, background:tab===t.id?"#1e40af":"transparent", color:tab===t.id?"#93c5fd":"#64748b" }}>
                <t.icon size={14}/>{t.label}
                {t.id==="appts"&&appts.length>0&&<span style={{ background:"#ef4444", color:"white", borderRadius:"50%", width:16, height:16, fontSize:10, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700 }}>{appts.length}</span>}
              </button>
            ))}
          </nav>
          <button onClick={onLogout} style={{ display:"flex", alignItems:"center", gap:6, background:"#1c0a0a", border:"1px solid #7f1d1d", borderRadius:7, padding:"6px 12px", color:"#f87171", cursor:"pointer", fontSize:12 }}>
            <LogOut size={13}/> Logout
          </button>
        </div>
      </header>

      <main style={{ maxWidth:1100, margin:"0 auto", padding:"24px" }}>
        {tab==="intake"&&<IntakeForm onSuccess={loadData} showToast={showToast}/>}

        {tab==="jobs"&&(
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <div style={{ fontSize:16, fontWeight:700, color:"#93c5fd" }}>Today's Jobs ({entries.length})</div>
              <div style={{ position:"relative" }}>
                <Search size={13} color="#475569" style={{ position:"absolute",left:10,top:"50%",transform:"translateY(-50%)" }}/>
                <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Search plate or phone…"
                  style={{ background:"#0b1120", border:"1px solid #1e2d4a", borderRadius:8, padding:"7px 12px 7px 30px", color:"#e2e8f0", fontSize:12, outline:"none", width:200 }}/>
              </div>
              <button onClick={loadData} style={{ display:"flex", alignItems:"center", gap:6, background:"#0d1b2e", border:"1px solid #1e3a5f", color:"#64748b", borderRadius:8, padding:"8px 12px", cursor:"pointer", fontSize:12 }}>
                <RefreshCw size={13} style={{ animation:loading?"spin 1s linear infinite":"none" }}/> Refresh
              </button>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {entries.filter(e=>!searchQ||e.plate.toLowerCase().includes(searchQ.toLowerCase())||e.phone.includes(searchQ)||e.name.toLowerCase().includes(searchQ.toLowerCase())).map(e=>{
                const meta=STATUS_META[e.status]||STATUS_META.Queued;
                return <div key={e.id} style={{ background:"#0d1b2e", border:"1px solid #1e3a5f", borderRadius:12, padding:"14px 18px", display:"grid", gridTemplateColumns:"2fr 1fr 1.5fr auto auto", gap:12, alignItems:"center" }}>
                  <div><div style={{ fontWeight:700, color:"#e2e8f0" }}>{e.name}</div><div style={{ color:"#64748b", fontSize:12 }}>{e.phone}</div></div>
                  <div><div style={{ color:"#e2e8f0", fontSize:13 }}>{e.carModel}</div><div style={{ fontFamily:"monospace", fontSize:11, color:"#64748b" }}>{e.plate}</div></div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:3 }}>{e.services.map(sid=>{const sv=SERVICES.find(s=>s.id===sid);return sv?<span key={sid} style={{ background:"#0f2447", color:"#60a5fa", border:"1px solid #1e3a5f", borderRadius:4, padding:"1px 5px", fontSize:10 }}>{sv.label}</span>:null;})}</div>
                  <div style={{ fontSize:13, fontWeight:700, color:"#34d399" }}>{fmt(e.bill)}</div>
                  <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"3px 9px", borderRadius:20, fontSize:11, fontWeight:700 }} className={meta.badge}>
                    <span style={{ width:5, height:5, borderRadius:"50%" }} className={meta.dot}/>{e.status}
                  </span>
                </div>;
              })}
              {entries.length===0&&!loading&&<div style={{ textAlign:"center", color:"#334155", padding:40 }}>No jobs registered today yet.</div>}
            </div>
          </div>
        )}

        {tab==="appts"&&(
          <div>
            <div style={{ fontSize:16, fontWeight:700, color:"#93c5fd", marginBottom:16, display:"flex", alignItems:"center", gap:8 }}><Bell size={17}/> Pending Appointments ({appts.length})</div>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {appts.map(a=>{
                const svcNames=(a.services||[]).map(id=>SERVICES.find(s=>s.id===id)?.label||id).join(", ");
                return <div key={a.id} style={{ background:"#0d1b2e", border:"1px solid #1e3a5f", borderRadius:12, padding:"16px 20px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                    <div><div style={{ fontWeight:700, color:"#e2e8f0" }}>{a.customer_name}</div><div style={{ color:"#64748b", fontSize:12 }}>{a.phone}</div></div>
                    <span style={{ background:"#1c1a08", border:"1px solid #854d0e", color:"#fbbf24", borderRadius:20, padding:"2px 9px", fontSize:11, fontWeight:700 }}>Pending</span>
                  </div>
                  <div style={{ fontSize:13, color:"#94a3b8", marginBottom:10 }}>{a.car_model} · <span style={{ fontFamily:"monospace" }}>{a.plate||"—"}</span> · <span style={{ color:"#60a5fa" }}>{a.appt_date} {a.appt_time}</span></div>
                  <div style={{ fontSize:13, color:"#64748b", marginBottom:12 }}>Services: <span style={{ color:"#e2e8f0" }}>{svcNames||"—"}</span></div>
                  <button onClick={()=>confirmAppt(a)} style={{ background:"#052e16", border:"1px solid #16a34a", borderRadius:8, padding:"8px 16px", color:"#4ade80", fontWeight:700, fontSize:13, cursor:"pointer" }}>✅ Confirm & Notify on WhatsApp</button>
                </div>;
              })}
              {appts.length===0&&<div style={{ textAlign:"center", color:"#334155", padding:40 }}>No pending appointments.</div>}
            </div>
          </div>
        )}
      </main>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}select option{background:#0b1120;color:#e2e8f0}input::placeholder{color:#334155}.bg-slate-700{background:#334155}.text-slate-200{color:#e2e8f0}.bg-slate-400{background:#94a3b8}.bg-blue-900{background:#1e3a8a}.text-blue-200{color:#bfdbfe}.bg-blue-400{background:#60a5fa}.bg-emerald-900{background:#064e3b}.text-emerald-200{color:#a7f3d0}.bg-emerald-400{background:#34d399}.bg-violet-900{background:#2e1065}.bg-violet-400{background:#a78bfa}.text-violet-200{color:#ddd6fe}*{box-sizing:border-box}`}</style>
    </div>
  );
}
