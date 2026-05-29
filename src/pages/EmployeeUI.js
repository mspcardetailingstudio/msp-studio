import { useState, useEffect, useCallback } from "react";
import { Car, Users, Plus, ClipboardList, CalendarDays, RefreshCw, Check, Trash2, Phone, Mail, Tag, Palette, LogOut, Bell } from "lucide-react";
import { sb, CAR_MODELS, SERVICES, STATUS_META, calc, fmt, MSP_WHATSAPP, MSP_EMAIL } from "../config";

const emptyForm = { name:"", phone:"", email:"", carModel:"", plate:"", color:"", services:[], status:"Queued", payment:"Cash" };

export default function EmployeeUI({ onLogout }) {
  const [tab,      setTab]      = useState("intake");
  const [entries,  setEntries]  = useState([]);
  const [appts,    setAppts]    = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [form,     setForm]     = useState(emptyForm);
  const [errors,   setErrors]   = useState({});
  const [toast,    setToast]    = useState(null);
  const [search,   setSearch]   = useState("");
  const [showForm, setShowForm] = useState(true);

  const showToast = (msg, type="success") => { setToast({msg,type}); setTimeout(()=>setToast(null),3500); };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [logs, bookings] = await Promise.all([
        sb("services_log?select=id,services,total_bill,status,payment_mode,created_at,customers(name,phone),vehicles(car_model,plate,color)&order=created_at.desc&limit=30", { method:"GET" }),
        sb("appointments?select=*&order=appt_date.asc,appt_time.asc&status=eq.Pending", { method:"GET" }),
      ]);
      setEntries((logs||[]).map(l=>({ id:l.id, name:l.customers?.name||"—", phone:l.customers?.phone||"—", carModel:l.vehicles?.car_model||"—", plate:l.vehicles?.plate||"—", services:l.services||[], status:l.status||"Queued", bill:l.total_bill||0, payment:l.payment_mode||"Cash" })));
      setAppts(bookings||[]);
    } catch(e) { showToast("Load error: "+e.message,"error"); }
    finally { setLoading(false); }
  }, []);

  useEffect(()=>{ loadData(); },[loadData]);

  const validate = () => {
    const e={};
    if(!form.name.trim())             e.name="Required";
    if(!form.phone.match(/^\d{10}$/)) e.phone="10-digit number";
    if(!form.carModel)                e.carModel="Select car";
    if(!form.plate.trim())            e.plate="Required";
    if(!form.services.length)         e.services="Select a service";
    setErrors(e); return !Object.keys(e).length;
  };

  const handleSubmit = async () => {
    if(!validate()) return;
    setSaving(true);
    try {
      const [customer] = await sb("customers",{ method:"POST", body:JSON.stringify({ name:form.name, phone:form.phone, email:form.email||null }) });
      const [vehicle]  = await sb("vehicles", { method:"POST", body:JSON.stringify({ customer_id:customer.id, car_model:form.carModel, plate:form.plate, color:form.color||null }) });
      await sb("services_log",{ method:"POST", body:JSON.stringify({ customer_id:customer.id, vehicle_id:vehicle.id, services:form.services, total_bill:calc(form.services), status:form.status, payment_mode:form.payment }) });
      setForm(emptyForm); setErrors({});
      showToast("✅ Customer & service registered!");
      loadData();
    } catch(e) { showToast("❌ "+e.message,"error"); }
    finally { setSaving(false); }
  };

  const confirmAppt = async (appt) => {
    try {
      await sb(`appointments?id=eq.${appt.id}`,{ method:"PATCH", prefer:"return=minimal", body:JSON.stringify({ status:"Confirmed" }) });
      const svcNames = (appt.services||[]).map(id=>SERVICES.find(s=>s.id===id)?.label||id).join(", ");
      const waText   = encodeURIComponent(`✅ *Appointment Confirmed — MSP Studio*\n\nHi ${appt.customer_name}, your booking is confirmed!\n\n🚘 ${appt.car_model} (${appt.plate||"—"})\n🛠️ ${svcNames}\n📅 ${appt.appt_date} at ${appt.appt_time}\n\nSee you at the studio! 🚗✨`);
      window.open(`https://wa.me/${appt.phone?.replace(/\D/,"")??""}?text=${waText}`,"_blank");
      showToast("Appointment confirmed & WhatsApp opened!");
      loadData();
    } catch(e) { showToast("Error: "+e.message,"error"); }
  };

  const toggleSvc = (sid) => setForm(f=>({ ...f, services:f.services.includes(sid)?f.services.filter(s=>s!==sid):[...f.services,sid] }));
  const filteredCars = CAR_MODELS.filter(m=>m.toLowerCase().includes(search.toLowerCase()));

  const inp = (extra={}) => ({ background:"#0b1120", border:"1px solid #1e2d4a", borderRadius:8, padding:"10px 14px", color:"#e2e8f0", fontSize:13, outline:"none", width:"100%", boxSizing:"border-box", ...extra });
  const lbl = { display:"block", fontSize:11, color:"#64748b", fontWeight:600, letterSpacing:0.8, textTransform:"uppercase", marginBottom:6 };

  const TABS = [
    { id:"intake",  label:"Register Customer", icon:Plus         },
    { id:"jobs",    label:"Today's Jobs",      icon:ClipboardList },
    { id:"appts",   label:"Appointments",      icon:CalendarDays  },
  ];

  return (
    <div style={{ minHeight:"100vh", background:"#0b1120", fontFamily:"'DM Sans','Segoe UI',sans-serif", color:"#e2e8f0" }}>
      {toast && <div style={{ position:"fixed", top:16, right:16, zIndex:999, background:toast.type==="error"?"#1c0a0a":"#052e16", border:`1px solid ${toast.type==="error"?"#7f1d1d":"#16a34a"}`, color:toast.type==="error"?"#f87171":"#4ade80", borderRadius:10, padding:"11px 16px", fontSize:13, fontWeight:600, boxShadow:"0 8px 32px #00000060" }}>{toast.msg}</div>}

      <header style={{ background:"linear-gradient(135deg,#0f1e3a,#0b1120)", borderBottom:"1px solid #1e2d4a", padding:"0 24px", position:"sticky", top:0, zIndex:50 }}>
        <div style={{ maxWidth:1100, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", height:60 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:34, height:34, borderRadius:9, background:"linear-gradient(135deg,#3b82f6,#1d4ed8)", display:"flex", alignItems:"center", justifyContent:"center" }}><Car size={18} color="white"/></div>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:"#f1f5f9" }}>MSP Studio — Employee Panel</div>
              <div style={{ fontSize:11, color:"#475569" }}>🔧 Staff View</div>
            </div>
          </div>
          <nav style={{ display:"flex", gap:4 }}>
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)} style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 12px", borderRadius:7, border:"none", cursor:"pointer", fontSize:12, fontWeight:500, background:tab===t.id?"#1e40af":"transparent", color:tab===t.id?"#93c5fd":"#64748b" }}>
                <t.icon size={14}/>{t.label}
                {t.id==="appts" && appts.length>0 && <span style={{ background:"#ef4444", color:"white", borderRadius:"50%", width:16, height:16, fontSize:10, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700 }}>{appts.length}</span>}
              </button>
            ))}
          </nav>
          <button onClick={onLogout} style={{ display:"flex", alignItems:"center", gap:6, background:"#1c0a0a", border:"1px solid #7f1d1d", borderRadius:7, padding:"6px 12px", color:"#f87171", cursor:"pointer", fontSize:12 }}>
            <LogOut size={13}/> Logout
          </button>
        </div>
      </header>

      <main style={{ maxWidth:1100, margin:"0 auto", padding:"24px" }}>

        {/* ── INTAKE ── */}
        {tab==="intake" && (
          <div style={{ background:"#0d1b2e", border:"1px solid #1e3a5f", borderRadius:16, padding:28 }}>
            <div style={{ fontSize:16, fontWeight:700, color:"#93c5fd", marginBottom:24, display:"flex", alignItems:"center", gap:8 }}>
              <ClipboardList size={18}/> New Customer & Vehicle Registration
            </div>

            {/* Customer */}
            <div style={{ marginBottom:18 }}>
              <div style={{ fontSize:11, color:"#3b82f6", fontWeight:700, textTransform:"uppercase", letterSpacing:0.8, marginBottom:10 }}>Customer Details</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14 }}>
                {[{key:"name",label:"Full Name *",ph:"e.g. Rajan Mehta"},{key:"phone",label:"Phone *",ph:"10-digit"},{key:"email",label:"Email",ph:"optional"}].map(f=>(
                  <div key={f.key}>
                    <label style={lbl}>{f.label}</label>
                    <input value={form[f.key]} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} placeholder={f.ph} style={inp(errors[f.key]?{borderColor:"#ef4444"}:{})}/>
                    {errors[f.key] && <div style={{ fontSize:11, color:"#f87171", marginTop:3 }}>{errors[f.key]}</div>}
                  </div>
                ))}
              </div>
            </div>

            {/* Vehicle */}
            <div style={{ marginBottom:18 }}>
              <div style={{ fontSize:11, color:"#3b82f6", fontWeight:700, textTransform:"uppercase", letterSpacing:0.8, marginBottom:10 }}>Vehicle Details</div>
              <div style={{ marginBottom:12 }}>
                <label style={lbl}>Car Model * — search</label>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Type to search…" style={inp({ marginBottom:6 })}/>
                <div style={{ maxHeight:140, overflowY:"auto", background:"#0b1120", border:"1px solid #1e2d4a", borderRadius:8 }}>
                  {filteredCars.slice(0,40).map(m=>(
                    <div key={m} onClick={()=>{ setForm(p=>({...p,carModel:m})); setSearch(m); }} style={{ padding:"8px 12px", cursor:"pointer", fontSize:13, color:form.carModel===m?"#93c5fd":"#94a3b8", background:form.carModel===m?"#172554":"transparent", borderBottom:"1px solid #0f1e3a" }}>{m}</div>
                  ))}
                </div>
                {errors.carModel && <div style={{ fontSize:11, color:"#f87171", marginTop:3 }}>{errors.carModel}</div>}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14 }}>
                <div>
                  <label style={lbl}>License Plate *</label>
                  <input value={form.plate} onChange={e=>setForm(p=>({...p,plate:e.target.value.toUpperCase()}))} placeholder="KA01AB1234" style={inp(errors.plate?{borderColor:"#ef4444",letterSpacing:1}:{letterSpacing:1})}/>
                  {errors.plate && <div style={{ fontSize:11, color:"#f87171", marginTop:3 }}>{errors.plate}</div>}
                </div>
                <div>
                  <label style={lbl}>Colour</label>
                  <input value={form.color} onChange={e=>setForm(p=>({...p,color:e.target.value}))} placeholder="Pearl White" style={inp()}/>
                </div>
                <div>
                  <label style={lbl}>Payment Mode</label>
                  <div style={{ display:"flex", gap:8 }}>
                    {["Cash","GPay"].map(pm=>(
                      <button key={pm} onClick={()=>setForm(p=>({...p,payment:pm}))} style={{ flex:1, padding:"10px 6px", borderRadius:8, border:`1px solid ${form.payment===pm?(pm==="Cash"?"#16a34a":"#7c3aed"):"#1e2d4a"}`, background:form.payment===pm?(pm==="Cash"?"#052e16":"#2e1065"):"#0b1120", color:form.payment===pm?(pm==="Cash"?"#4ade80":"#a78bfa"):"#475569", fontWeight:700, fontSize:12, cursor:"pointer" }}>
                        {pm==="Cash"?"💵":"📱"} {pm}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Services */}
            <div style={{ marginBottom:18 }}>
              <div style={{ fontSize:11, color:"#3b82f6", fontWeight:700, textTransform:"uppercase", letterSpacing:0.8, marginBottom:10 }}>
                Services * {errors.services && <span style={{ color:"#f87171" }}>{errors.services}</span>}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8 }}>
                {SERVICES.map(sv=>{
                  const sel=form.services.includes(sv.id);
                  return <div key={sv.id} onClick={()=>toggleSvc(sv.id)} style={{ background:sel?"#172554":"#0b1120", border:`1px solid ${sel?"#3b82f6":"#1e2d4a"}`, borderRadius:9, padding:"11px 12px", cursor:"pointer" }}>
                    <div style={{ fontSize:12, fontWeight:600, color:sel?"#93c5fd":"#94a3b8", marginBottom:3 }}>{sv.label}</div>
                    <div style={{ fontSize:12, fontWeight:700, color:sel?"#60a5fa":"#475569", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      {fmt(sv.price)} {sel && <Check size={12} color="#3b82f6"/>}
                    </div>
                  </div>;
                })}
              </div>
              {form.services.length>0 && <div style={{ marginTop:8, background:"#0a1628", border:"1px solid #1e3a5f", borderRadius:8, padding:"9px 14px", display:"flex", justifyContent:"space-between" }}>
                <span style={{ fontSize:13, color:"#64748b" }}>Total</span>
                <span style={{ fontSize:15, fontWeight:800, color:"#34d399" }}>{fmt(calc(form.services))}</span>
              </div>}
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 3fr", gap:14, alignItems:"end" }}>
              <div>
                <label style={lbl}>Status</label>
                <select value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))} style={inp({cursor:"pointer"})}>
                  {["Queued","In Progress","Completed","Delivered"].map(s=><option key={s}>{s}</option>)}
                </select>
              </div>
              <button onClick={handleSubmit} disabled={saving} style={{ background:"linear-gradient(135deg,#1d4ed8,#3b82f6)", color:"white", border:"none", borderRadius:8, padding:"11px", fontWeight:700, fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                {saving?<><RefreshCw size={14} style={{ animation:"spin 1s linear infinite" }}/> Saving…</>:"✅ Register Customer & Service"}
              </button>
            </div>
          </div>
        )}

        {/* ── TODAY'S JOBS ── */}
        {tab==="jobs" && (
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
              <div style={{ fontSize:16, fontWeight:700, color:"#93c5fd", display:"flex", alignItems:"center", gap:8 }}><ClipboardList size={17}/> Today's Jobs ({entries.length})</div>
              <button onClick={loadData} style={{ display:"flex", alignItems:"center", gap:6, background:"#0d1b2e", border:"1px solid #1e3a5f", color:"#64748b", borderRadius:8, padding:"8px 12px", cursor:"pointer", fontSize:12 }}>
                <RefreshCw size={13} style={{ animation:loading?"spin 1s linear infinite":"none" }}/> Refresh
              </button>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {entries.map(e=>{
                const meta=STATUS_META[e.status]||STATUS_META.Queued;
                return <div key={e.id} style={{ background:"#0d1b2e", border:"1px solid #1e3a5f", borderRadius:12, padding:"16px 20px", display:"grid", gridTemplateColumns:"2fr 1fr 1.5fr 1.5fr 1fr", gap:12, alignItems:"center" }}>
                  <div>
                    <div style={{ fontWeight:700, color:"#e2e8f0" }}>{e.name}</div>
                    <div style={{ color:"#64748b", fontSize:12 }}>{e.phone}</div>
                  </div>
                  <div>
                    <div style={{ color:"#e2e8f0", fontSize:13, fontWeight:500 }}>{e.carModel}</div>
                    <div style={{ fontFamily:"monospace", fontSize:11, color:"#64748b" }}>{e.plate}</div>
                  </div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                    {e.services.map(sid=>{ const sv=SERVICES.find(s=>s.id===sid); return sv?<span key={sid} style={{ background:"#0f2447", color:"#60a5fa", border:"1px solid #1e3a5f", borderRadius:5, padding:"2px 6px", fontSize:10, fontWeight:500 }}>{sv.label}</span>:null; })}
                  </div>
                  <div style={{ fontWeight:800, color:"#34d399", fontSize:14 }}>{fmt(e.bill)}</div>
                  <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"4px 10px", borderRadius:20, fontSize:11, fontWeight:700 }} className={meta.badge}>
                    <span style={{ width:6, height:6, borderRadius:"50%" }} className={meta.dot}/>{e.status}
                  </span>
                </div>;
              })}
              {entries.length===0 && !loading && <div style={{ textAlign:"center", color:"#334155", padding:40 }}>No jobs yet today.</div>}
            </div>
          </div>
        )}

        {/* ── APPOINTMENTS ── */}
        {tab==="appts" && (
          <div>
            <div style={{ fontSize:16, fontWeight:700, color:"#93c5fd", marginBottom:18, display:"flex", alignItems:"center", gap:8 }}>
              <Bell size={17}/> Pending Appointments ({appts.length})
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {appts.map(a=>{
                const svcNames=(a.services||[]).map(id=>SERVICES.find(s=>s.id===id)?.label||id).join(", ");
                return <div key={a.id} style={{ background:"#0d1b2e", border:"1px solid #1e3a5f", borderRadius:12, padding:"18px 20px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                    <div>
                      <div style={{ fontWeight:700, color:"#e2e8f0", fontSize:15 }}>{a.customer_name}</div>
                      <div style={{ color:"#64748b", fontSize:13 }}>{a.phone} {a.email && `· ${a.email}`}</div>
                    </div>
                    <span style={{ background:"#1c1a08", border:"1px solid #854d0e", color:"#fbbf24", borderRadius:20, padding:"3px 10px", fontSize:11, fontWeight:700 }}>Pending</span>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:14, fontSize:13 }}>
                    <div><span style={{ color:"#475569" }}>Car: </span><span style={{ color:"#e2e8f0", fontWeight:600 }}>{a.car_model}</span></div>
                    <div><span style={{ color:"#475569" }}>Plate: </span><span style={{ fontFamily:"monospace", color:"#94a3b8" }}>{a.plate||"—"}</span></div>
                    <div><span style={{ color:"#475569" }}>Date: </span><span style={{ color:"#60a5fa", fontWeight:600 }}>{a.appt_date} {a.appt_time}</span></div>
                    <div style={{ gridColumn:"1/-1" }}><span style={{ color:"#475569" }}>Services: </span><span style={{ color:"#e2e8f0" }}>{svcNames||"—"}</span></div>
                    {a.notes && <div style={{ gridColumn:"1/-1" }}><span style={{ color:"#475569" }}>Notes: </span><span style={{ color:"#94a3b8" }}>{a.notes}</span></div>}
                  </div>
                  <div style={{ display:"flex", gap:10 }}>
                    <button onClick={()=>confirmAppt(a)} style={{ flex:1, background:"#052e16", border:"1px solid #16a34a", borderRadius:8, padding:"9px", color:"#4ade80", fontWeight:700, fontSize:13, cursor:"pointer" }}>
                      ✅ Confirm & Notify on WhatsApp
                    </button>
                  </div>
                </div>;
              })}
              {appts.length===0 && <div style={{ textAlign:"center", color:"#334155", padding:40 }}>No pending appointments.</div>}
            </div>
          </div>
        )}
      </main>
      <style>{`.bg-slate-700{background:#334155}.text-slate-200{color:#e2e8f0}.bg-slate-400{background:#94a3b8}.bg-blue-900{background:#1e3a8a}.text-blue-200{color:#bfdbfe}.bg-blue-400{background:#60a5fa}.bg-emerald-900{background:#064e3b}.text-emerald-200{color:#a7f3d0}.bg-emerald-400{background:#34d399}.bg-violet-900{background:#2e1065}.text-violet-200{color:#ddd6fe}.bg-violet-400{background:#a78bfa}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
