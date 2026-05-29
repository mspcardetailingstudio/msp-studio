import { useState, useEffect, useCallback } from "react";
import { Car, Users, IndianRupee, CalendarClock, Plus, Copy, Check, Sparkles, ClipboardList, CalendarDays, LayoutDashboard, Trash2, Palette, CircleDot, Star, Zap, Shield, Droplets, RefreshCw, AlertCircle, Wifi, FileText, Printer, Bell, LogOut } from "lucide-react";
import { sb, CAR_MODELS, SERVICES, STATUS_META, calc, fmt, todayStr, MSP_WHATSAPP } from "../config";

const emptyForm = { name:"", phone:"", email:"", carModel:"", plate:"", color:"", services:[], status:"Queued", payment:"Cash" };
const displayDate = (d) => new Date(d).toLocaleDateString("en-IN",{ day:"2-digit", month:"short", year:"numeric" });

const flatRow = (l) => ({ id:l.id, name:l.customers?.name||"—", phone:l.customers?.phone||"—", email:l.customers?.email||"", carModel:l.vehicles?.car_model||"—", plate:l.vehicles?.plate||"—", color:l.vehicles?.color||"", services:l.services||[], status:l.status||"Queued", bill:l.total_bill||0, payment:l.payment_mode||"Cash", created:l.created_at||new Date().toISOString() });

const PROMOS = [
  { title:"🌧️ Monsoon Special", tag:"20% OFF", tagColor:"#3b82f6", msg:`🚗✨ *Monsoon Detailing Offer at MSP Studio!*\n\nGet *20% OFF* on all detailing services this monsoon season!\n\n🧼 Foam Wash | 🛡️ PPF Coating | 💎 Ceramic Coating\n\n📍 Maruthi Service Point Studio\n📞 Contact us to book your slot!\n\n_Offer valid for a limited time. Don't let the rains ruin your ride!_ 🌧️` },
  { title:"💎 Ceramic Bundle", tag:"BUNDLE DEAL", tagColor:"#8b5cf6", msg:`🏆 *Premium Ceramic Bundle — MSP Studio Exclusive!*\n\nBook *Ceramic Coating + Full Foam Wash* together and save ₹2,000!\n\n💎 Ceramic Coating — ₹25,000\n🧼 Foam Wash — FREE with bundle\n\n🔥 Limited slots available.\n\n📍 Maruthi Service Point Studio\n📞 DM or call to reserve your slot! 🚗` },
  { title:"🎉 Referral Reward", tag:"REFER & EARN", tagColor:"#f59e0b", msg:`🎁 *Refer & Earn at MSP Studio!*\n\nRefer a friend and *both of you get ₹500 OFF* your next service!\n\n✅ No minimum spend ✅ Valid on any service\n\n📍 Maruthi Service Point Studio — Royal treatment for your car 👑` },
];

export default function AdminUI({ onLogout }) {
  const [tab,       setTab]      = useState("dashboard");
  const [entries,   setEntries]  = useState([]);
  const [appts,     setAppts]    = useState([]);
  const [loading,   setLoading]  = useState(false);
  const [saving,    setSaving]   = useState(false);
  const [form,      setForm]     = useState(emptyForm);
  const [errors,    setErrors]   = useState({});
  const [copied,    setCopied]   = useState(null);
  const [toast,     setToast]    = useState(null);
  const [showForm,  setShowForm] = useState(false);
  const [reportDate,setReportDate]=useState(todayStr());
  const [search,    setSearch]   = useState("");
  const [dbError,   setDbError]  = useState(null);

  const showToast = (msg, type="success") => { setToast({msg,type}); setTimeout(()=>setToast(null),3500); };

  const loadData = useCallback(async () => {
    setLoading(true); setDbError(null);
    try {
      const [logs, bookings] = await Promise.all([
        sb("services_log?select=id,services,total_bill,status,payment_mode,created_at,customers(name,phone,email),vehicles(car_model,plate,color)&order=created_at.desc", { method:"GET" }),
        sb("appointments?select=*&order=appt_date.asc,appt_time.asc", { method:"GET" }),
      ]);
      setEntries((logs||[]).map(flatRow));
      setAppts(bookings||[]);
    } catch(e) { setDbError(e.message); }
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
      setForm(emptyForm); setErrors({}); setShowForm(false);
      showToast("✅ Registered successfully!");
      loadData();
    } catch(e) { showToast("❌ "+e.message,"error"); }
    finally { setSaving(false); }
  };

  const updateStatus = async (id, status) => {
    setEntries(p=>p.map(e=>e.id===id?{...e,status}:e));
    try { await sb(`services_log?id=eq.${id}`,{ method:"PATCH", prefer:"return=minimal", body:JSON.stringify({status}) }); }
    catch(e) { showToast("Update failed","error"); loadData(); }
  };

  const deleteEntry = async (id) => {
    setEntries(p=>p.filter(e=>e.id!==id));
    try { await sb(`services_log?id=eq.${id}`,{ method:"DELETE", prefer:"return=minimal" }); }
    catch(e) { showToast("Delete failed","error"); loadData(); }
  };

  const confirmAppt = async (appt) => {
    try {
      await sb(`appointments?id=eq.${appt.id}`,{ method:"PATCH", prefer:"return=minimal", body:JSON.stringify({status:"Confirmed"}) });
      const svcNames=(appt.services||[]).map(id=>SERVICES.find(s=>s.id===id)?.label||id).join(", ");
      const waText=encodeURIComponent(`✅ *Appointment Confirmed — MSP Studio*\n\nHi ${appt.customer_name}! Your booking is confirmed.\n\n🚘 ${appt.car_model}\n🛠️ ${svcNames||"—"}\n📅 ${appt.appt_date} at ${appt.appt_time}\n\nSee you at the studio! 🚗✨`);
      window.open(`https://wa.me/${appt.phone?.replace(/\D/g,"")??""}?text=${waText}`,"_blank");
      showToast("Confirmed & WhatsApp opened!"); loadData();
    } catch(e) { showToast("Error: "+e.message,"error"); }
  };

  const toggleSvc = (sid) => setForm(f=>({ ...f, services:f.services.includes(sid)?f.services.filter(s=>s!==sid):[...f.services,sid] }));
  const filteredCars = CAR_MODELS.filter(m=>m.toLowerCase().includes(search.toLowerCase()));

  const reportEntries = entries.filter(e=>e.created.startsWith(reportDate));
  const reportTotal   = reportEntries.reduce((s,e)=>s+e.bill,0);
  const cashTotal     = reportEntries.filter(e=>e.payment==="Cash").reduce((s,e)=>s+e.bill,0);
  const gpayTotal     = reportEntries.filter(e=>e.payment==="GPay").reduce((s,e)=>s+e.bill,0);
  const totalRevenue  = entries.filter(e=>e.status==="Completed"||e.status==="Delivered").reduce((s,e)=>s+e.bill,0);
  const pending       = entries.filter(e=>e.status==="Queued").length;
  const inWorkshop    = entries.filter(e=>e.status==="In Progress").length;
  const pendingAppts  = appts.filter(a=>a.status==="Pending").length;

  const printReport = () => {
    const win=window.open("","_blank");
    const rows=reportEntries.map((e,i)=>`<tr><td>${i+1}</td><td>${e.carModel}<br/><small>${e.name}</small></td><td style="font-family:monospace">${e.plate}</td><td>${e.phone}</td><td>${e.services.map(sid=>SERVICES.find(s=>s.id===sid)?.label||sid).join(", ")}</td><td>₹${Number(e.bill).toLocaleString("en-IN")}</td><td class="${e.payment==="Cash"?"cash":"gpay"}">${e.payment==="Cash"?"💵 Cash":"📱 GPay"}</td></tr>`).join("");
    win.document.write(`<html><head><title>MSP Daily Report — ${displayDate(reportDate)}</title><style>body{font-family:Arial,sans-serif;padding:24px;color:#111}h2{margin:0 0 4px}p{margin:0 0 20px;color:#555;font-size:13px}table{width:100%;border-collapse:collapse;font-size:13px}th{background:#1e3a8a;color:white;padding:10px 12px;text-align:left}td{padding:9px 12px;border-bottom:1px solid #e2e8f0}tr:nth-child(even) td{background:#f8fafc}.cash{color:#16a34a;font-weight:700}.gpay{color:#7c3aed;font-weight:700}.summary{margin-top:20px;display:flex;gap:20px;flex-wrap:wrap}.box{border:1px solid #e2e8f0;border-radius:8px;padding:12px 18px}.box .label{font-size:11px;color:#64748b;text-transform:uppercase}.box .val{font-size:20px;font-weight:800;margin-top:4px}@media print{button{display:none}}</style></head><body><h2>🚗 MSP Studio Hub — Daily Report</h2><p>Date: ${displayDate(reportDate)} | Generated: ${new Date().toLocaleTimeString("en-IN")}</p><table><thead><tr><th>No.</th><th>Car / Customer</th><th>Vehicle No.</th><th>Contact</th><th>Service Type</th><th>Price</th><th>Payment</th></tr></thead><tbody>${rows}</tbody></table><div class="summary"><div class="box"><div class="label">Total Jobs</div><div class="val">${reportEntries.length}</div></div><div class="box"><div class="label">Total Revenue</div><div class="val" style="color:#1d4ed8">₹${Number(reportTotal).toLocaleString("en-IN")}</div></div><div class="box"><div class="label">Cash</div><div class="val" style="color:#16a34a">₹${Number(cashTotal).toLocaleString("en-IN")}</div></div><div class="box"><div class="label">GPay</div><div class="val" style="color:#7c3aed">₹${Number(gpayTotal).toLocaleString("en-IN")}</div></div></div><br/><button onclick="window.print()">🖨️ Print / Save as PDF</button></body></html>`);
    win.document.close();
  };

  const inp = (ex={}) => ({ background:"#0b1120", border:"1px solid #1e2d4a", borderRadius:8, padding:"10px 14px", color:"#e2e8f0", fontSize:13, outline:"none", width:"100%", boxSizing:"border-box", ...ex });
  const lbl = { display:"block", fontSize:11, color:"#64748b", fontWeight:600, letterSpacing:0.8, textTransform:"uppercase", marginBottom:6 };

  const TABS = [
    { id:"dashboard", label:"Dashboard",    icon:LayoutDashboard },
    { id:"report",    label:"Daily Report", icon:FileText        },
    { id:"appts",     label:"Appointments", icon:CalendarDays    },
    { id:"promos",    label:"Promotions",   icon:Sparkles        },
  ];

  return (
    <div style={{ minHeight:"100vh", background:"#0b1120", fontFamily:"'DM Sans','Segoe UI',sans-serif", color:"#e2e8f0" }}>
      {toast && <div style={{ position:"fixed", top:16, right:16, zIndex:999, background:toast.type==="error"?"#1c0a0a":"#052e16", border:`1px solid ${toast.type==="error"?"#7f1d1d":"#16a34a"}`, color:toast.type==="error"?"#f87171":"#4ade80", borderRadius:10, padding:"11px 16px", fontSize:13, fontWeight:600, boxShadow:"0 8px 32px #00000060" }}>{toast.msg}</div>}

      <header style={{ background:"linear-gradient(135deg,#0f1e3a,#0b1120)", borderBottom:"1px solid #1e2d4a", padding:"0 24px", position:"sticky", top:0, zIndex:50 }}>
        <div style={{ maxWidth:1280, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", height:64 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:38, height:38, borderRadius:10, background:"linear-gradient(135deg,#3b82f6,#1d4ed8)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 0 16px #3b82f640" }}><Car size={20} color="white"/></div>
            <div>
              <div style={{ fontSize:15, fontWeight:700, color:"#f1f5f9" }}>MSP Studio Hub</div>
              <div style={{ fontSize:11, color:"#475569", letterSpacing:0.5 }}>ADMIN PANEL 👑</div>
            </div>
          </div>
          <nav style={{ display:"flex", gap:4 }}>
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)} style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 14px", borderRadius:8, border:"none", cursor:"pointer", fontSize:13, fontWeight:500, transition:"all 0.2s", background:tab===t.id?"#1e40af":"transparent", color:tab===t.id?"#93c5fd":"#64748b" }}>
                <t.icon size={15}/>{t.label}
                {t.id==="appts" && pendingAppts>0 && <span style={{ background:"#ef4444", color:"white", borderRadius:"50%", width:17, height:17, fontSize:10, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700 }}>{pendingAppts}</span>}
              </button>
            ))}
          </nav>
          <div style={{ display:"flex", gap:10, alignItems:"center" }}>
            <span style={{ fontSize:11, color:"#4ade80", background:"#052e16", border:"1px solid #16a34a", padding:"4px 10px", borderRadius:20, display:"flex", alignItems:"center", gap:5 }}><Wifi size={11}/>Live</span>
            <button onClick={onLogout} style={{ display:"flex", alignItems:"center", gap:6, background:"#1c0a0a", border:"1px solid #7f1d1d", borderRadius:8, padding:"7px 12px", color:"#f87171", cursor:"pointer", fontSize:12 }}><LogOut size={13}/>Logout</button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth:1280, margin:"0 auto", padding:"28px 24px" }}>

        {/* ── DASHBOARD ── */}
        {tab==="dashboard" && (
          <div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:28 }}>
              {[
                { label:"Total Customers",      value:entries.length,   icon:Users,        accent:"#3b82f6", bg:"#0f2447" },
                { label:"Vehicles in Workshop", value:inWorkshop,       icon:Car,          accent:"#a855f7", bg:"#1a0f33" },
                { label:"Revenue (Completed)",  value:fmt(totalRevenue),icon:IndianRupee,  accent:"#10b981", bg:"#042f1e" },
                { label:"Pending Bookings",     value:pending,          icon:CalendarClock,accent:"#f59e0b", bg:"#2d1b00" },
              ].map((kpi,i)=>(
                <div key={i} style={{ background:kpi.bg, border:`1px solid ${kpi.accent}30`, borderRadius:14, padding:"20px 22px", position:"relative", overflow:"hidden" }}>
                  <div style={{ position:"absolute", right:-10, top:-10, width:70, height:70, borderRadius:"50%", background:`${kpi.accent}15` }}/>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                    <div>
                      <div style={{ fontSize:11, color:"#64748b", fontWeight:600, letterSpacing:0.8, marginBottom:8, textTransform:"uppercase" }}>{kpi.label}</div>
                      <div style={{ fontSize:28, fontWeight:800, color:"#f1f5f9" }}>{kpi.value}</div>
                    </div>
                    <div style={{ width:40, height:40, borderRadius:10, background:`${kpi.accent}20`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <kpi.icon size={20} color={kpi.accent}/>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display:"flex", gap:10, marginBottom:20 }}>
              <button onClick={()=>setShowForm(f=>!f)} style={{ display:"flex", alignItems:"center", gap:8, background:"linear-gradient(135deg,#1d4ed8,#3b82f6)", color:"white", border:"none", borderRadius:10, padding:"11px 22px", fontWeight:600, fontSize:14, cursor:"pointer" }}>
                <Plus size={18}/>{showForm?"Hide Form":"Register New Customer & Vehicle"}
              </button>
              <button onClick={loadData} style={{ display:"flex", alignItems:"center", gap:6, background:"#0d1b2e", border:"1px solid #1e3a5f", color:"#64748b", borderRadius:10, padding:"11px 14px", cursor:"pointer", fontSize:13 }}>
                <RefreshCw size={14} style={{ animation:loading?"spin 1s linear infinite":"none" }}/> Refresh
              </button>
            </div>

            {showForm && (
              <div style={{ background:"#0d1b2e", border:"1px solid #1e3a5f", borderRadius:16, padding:28, marginBottom:28 }}>
                <div style={{ fontSize:15, fontWeight:700, color:"#93c5fd", marginBottom:20, display:"flex", alignItems:"center", gap:8 }}><ClipboardList size={17}/>New Customer & Vehicle Intake</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14, marginBottom:16 }}>
                  {[{key:"name",label:"Full Name *",ph:"Rajan Mehta"},{key:"phone",label:"Phone *",ph:"10-digit"},{key:"email",label:"Email",ph:"optional"}].map(f=>(
                    <div key={f.key}>
                      <label style={lbl}>{f.label}</label>
                      <input value={form[f.key]} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} placeholder={f.ph} style={inp(errors[f.key]?{borderColor:"#ef4444"}:{})}/>
                      {errors[f.key] && <div style={{ fontSize:11, color:"#f87171", marginTop:3 }}>{errors[f.key]}</div>}
                    </div>
                  ))}
                </div>
                <div style={{ marginBottom:14 }}>
                  <label style={lbl}>Car Model * — search</label>
                  <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Type to search e.g. Swift, Creta…" style={inp({ marginBottom:6 })}/>
                  <div style={{ maxHeight:130, overflowY:"auto", background:"#0b1120", border:"1px solid #1e2d4a", borderRadius:8 }}>
                    {filteredCars.slice(0,50).map(m=>(
                      <div key={m} onClick={()=>{setForm(p=>({...p,carModel:m}));setSearch(m);}} style={{ padding:"8px 12px", cursor:"pointer", fontSize:13, color:form.carModel===m?"#93c5fd":"#94a3b8", background:form.carModel===m?"#172554":"transparent", borderBottom:"1px solid #0f1e3a" }}>{m}</div>
                    ))}
                  </div>
                  {errors.carModel && <div style={{ fontSize:11, color:"#f87171", marginTop:3 }}>{errors.carModel}</div>}
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:14, marginBottom:16 }}>
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
                        <button key={pm} onClick={()=>setForm(p=>({...p,payment:pm}))} style={{ flex:1, padding:"10px", borderRadius:8, border:`1px solid ${form.payment===pm?(pm==="Cash"?"#16a34a":"#7c3aed"):"#1e2d4a"}`, background:form.payment===pm?(pm==="Cash"?"#052e16":"#2e1065"):"#0b1120", color:form.payment===pm?(pm==="Cash"?"#4ade80":"#a78bfa"):"#475569", fontWeight:700, fontSize:12, cursor:"pointer" }}>
                          {pm==="Cash"?"💵":"📱"} {pm}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={lbl}>Status</label>
                    <select value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))} style={inp({cursor:"pointer"})}>
                      {["Queued","In Progress","Completed","Delivered"].map(s=><option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom:16 }}>
                  <label style={{ ...lbl, display:"inline" }}>Services * </label>{errors.services && <span style={{ fontSize:11, color:"#f87171" }}>{errors.services}</span>}
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginTop:8 }}>
                    {SERVICES.map(sv=>{
                      const sel=form.services.includes(sv.id);
                      return <div key={sv.id} onClick={()=>toggleSvc(sv.id)} style={{ background:sel?"#172554":"#0b1120", border:`1px solid ${sel?"#3b82f6":"#1e2d4a"}`, borderRadius:9, padding:"11px 12px", cursor:"pointer" }}>
                        <div style={{ fontSize:12, fontWeight:600, color:sel?"#93c5fd":"#94a3b8", marginBottom:2 }}>{sv.label}</div>
                        <div style={{ fontSize:12, fontWeight:700, color:sel?"#60a5fa":"#475569", display:"flex", justifyContent:"space-between" }}>{fmt(sv.price)}{sel&&<Check size={12} color="#3b82f6"/>}</div>
                      </div>;
                    })}
                  </div>
                  {form.services.length>0&&<div style={{ marginTop:8, background:"#0a1628", border:"1px solid #1e3a5f", borderRadius:8, padding:"9px 14px", display:"flex", justifyContent:"space-between" }}><span style={{ fontSize:13, color:"#64748b" }}>Total</span><span style={{ fontSize:15, fontWeight:800, color:"#34d399" }}>{fmt(calc(form.services))}</span></div>}
                </div>
                <button onClick={handleSubmit} disabled={saving} style={{ width:"100%", background:"linear-gradient(135deg,#1d4ed8,#3b82f6)", color:"white", border:"none", borderRadius:8, padding:"12px", fontWeight:700, fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                  {saving?<><RefreshCw size={14} style={{ animation:"spin 1s linear infinite" }}/>Saving…</>:"✅ Register Customer, Vehicle & Service"}
                </button>
              </div>
            )}

            {/* Table */}
            <div style={{ background:"#0d1b2e", border:"1px solid #1e3a5f", borderRadius:16, overflow:"hidden" }}>
              <div style={{ padding:"16px 22px", borderBottom:"1px solid #1e2d4a", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div style={{ fontSize:14, fontWeight:700, color:"#93c5fd", display:"flex", alignItems:"center", gap:8 }}><ClipboardList size={16}/>All Entries ({entries.length})</div>
                {dbError && <div style={{ fontSize:12, color:"#f87171", display:"flex", alignItems:"center", gap:5 }}><AlertCircle size={13}/>{dbError}</div>}
              </div>
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                  <thead><tr style={{ background:"#0b1631" }}>
                    {["Customer","Phone","Car Model","Plate","Services","Bill","Payment","Status",""].map(h=><th key={h} style={{ padding:"11px 14px", textAlign:"left", color:"#475569", fontWeight:600, fontSize:11, letterSpacing:0.6, textTransform:"uppercase", borderBottom:"1px solid #1e2d4a" }}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {entries.map((e,i)=>{
                      const meta=STATUS_META[e.status]||STATUS_META.Queued;
                      return <tr key={e.id} style={{ borderBottom:"1px solid #0f1e3a", background:i%2===0?"transparent":"#090f1c" }}>
                        <td style={{ padding:"12px 14px" }}><div style={{ fontWeight:600, color:"#e2e8f0" }}>{e.name}</div>{e.email&&<div style={{ color:"#475569", fontSize:11 }}>{e.email}</div>}</td>
                        <td style={{ padding:"12px 14px", color:"#94a3b8" }}>{e.phone}</td>
                        <td style={{ padding:"12px 14px" }}><div style={{ color:"#e2e8f0", fontWeight:500 }}>{e.carModel}</div>{e.color&&<div style={{ color:"#475569", fontSize:11 }}>{e.color}</div>}</td>
                        <td style={{ padding:"12px 14px" }}><span style={{ background:"#0b1120", border:"1px solid #1e2d4a", borderRadius:6, padding:"3px 8px", color:"#94a3b8", fontFamily:"monospace", fontSize:12 }}>{e.plate}</span></td>
                        <td style={{ padding:"12px 14px", maxWidth:160 }}><div style={{ display:"flex", flexWrap:"wrap", gap:3 }}>{e.services.map(sid=>{const sv=SERVICES.find(s=>s.id===sid);return sv?<span key={sid} style={{ background:"#0f2447", color:"#60a5fa", border:"1px solid #1e3a5f", borderRadius:5, padding:"2px 6px", fontSize:10 }}>{sv.label}</span>:null;})}</div></td>
                        <td style={{ padding:"12px 14px", fontWeight:700, color:"#34d399" }}>{fmt(e.bill)}</td>
                        <td style={{ padding:"12px 14px" }}><span style={{ padding:"3px 9px", borderRadius:20, fontSize:11, fontWeight:700, background:e.payment==="Cash"?"#052e16":"#2e1065", color:e.payment==="Cash"?"#4ade80":"#a78bfa", border:`1px solid ${e.payment==="Cash"?"#16a34a":"#7c3aed"}` }}>{e.payment==="Cash"?"💵 Cash":"📱 GPay"}</span></td>
                        <td style={{ padding:"12px 14px" }}>
                          <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"3px 9px", borderRadius:20, fontSize:11, fontWeight:700 }} className={meta.badge}>
                            <span style={{ width:6, height:6, borderRadius:"50%" }} className={meta.dot}/>
                            <select value={e.status} onChange={ev=>updateStatus(e.id,ev.target.value)} style={{ background:"transparent", border:"none", outline:"none", cursor:"pointer", fontSize:11, fontWeight:700, color:"inherit" }}>
                              {["Queued","In Progress","Completed","Delivered"].map(s=><option key={s}>{s}</option>)}
                            </select>
                          </span>
                        </td>
                        <td style={{ padding:"12px 14px" }}><button onClick={()=>deleteEntry(e.id)} style={{ background:"transparent", border:"1px solid #1e2d4a", borderRadius:6, padding:"5px 8px", cursor:"pointer", color:"#475569", display:"flex", alignItems:"center" }}><Trash2 size={12}/></button></td>
                      </tr>;
                    })}
                    {!loading&&entries.length===0&&<tr><td colSpan={9} style={{ padding:40, textAlign:"center", color:"#334155" }}>No entries yet.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── DAILY REPORT ── */}
        {tab==="report" && (
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:20, flexWrap:"wrap", gap:12 }}>
              <div><div style={{ fontSize:22, fontWeight:800, color:"#f1f5f9", marginBottom:4 }}>📊 Daily Report</div><div style={{ fontSize:14, color:"#475569" }}>Select a date to view all jobs.</div></div>
              <div style={{ display:"flex", gap:10 }}>
                <input type="date" value={reportDate} onChange={e=>setReportDate(e.target.value)} style={{ background:"#0d1b2e", border:"1px solid #1e3a5f", borderRadius:8, padding:"9px 14px", color:"#e2e8f0", fontSize:13, outline:"none" }}/>
                <button onClick={printReport} style={{ display:"flex", alignItems:"center", gap:7, background:"linear-gradient(135deg,#1d4ed8,#3b82f6)", color:"white", border:"none", borderRadius:8, padding:"10px 18px", fontWeight:600, fontSize:13, cursor:"pointer" }}>
                  <Printer size={15}/> Print / Save PDF
                </button>
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:22 }}>
              {[
                { label:"Total Jobs",    value:reportEntries.length, accent:"#3b82f6", bg:"#0f2447" },
                { label:"Total Revenue", value:fmt(reportTotal),     accent:"#10b981", bg:"#042f1e" },
                { label:"💵 Cash",        value:fmt(cashTotal),       accent:"#16a34a", bg:"#052e16" },
                { label:"📱 GPay",        value:fmt(gpayTotal),       accent:"#7c3aed", bg:"#2e1065" },
              ].map((k,i)=>(
                <div key={i} style={{ background:k.bg, border:`1px solid ${k.accent}40`, borderRadius:12, padding:"16px 20px" }}>
                  <div style={{ fontSize:11, color:"#64748b", fontWeight:600, textTransform:"uppercase", letterSpacing:0.8, marginBottom:6 }}>{k.label}</div>
                  <div style={{ fontSize:24, fontWeight:800, color:"#f1f5f9" }}>{k.value}</div>
                </div>
              ))}
            </div>
            <div style={{ background:"#0d1b2e", border:"1px solid #1e3a5f", borderRadius:16, overflow:"hidden" }}>
              <div style={{ padding:"14px 20px", borderBottom:"1px solid #1e2d4a" }}>
                <span style={{ fontSize:14, fontWeight:700, color:"#93c5fd" }}>{reportEntries.length} job{reportEntries.length!==1?"s":""} on {displayDate(reportDate)}</span>
              </div>
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                  <thead><tr style={{ background:"#0b1631" }}>
                    {["No.","Car Make / Model","Vehicle Number","Contact","Service Type","Price","Payment"].map(h=><th key={h} style={{ padding:"11px 14px", textAlign:"left", color:"#475569", fontWeight:600, fontSize:11, textTransform:"uppercase", letterSpacing:0.6, borderBottom:"1px solid #1e2d4a" }}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {reportEntries.map((e,i)=>(
                      <tr key={e.id} style={{ borderBottom:"1px solid #0f1e3a", background:i%2===0?"transparent":"#090f1c" }}>
                        <td style={{ padding:"12px 14px", color:"#64748b", fontWeight:600 }}>{i+1}</td>
                        <td style={{ padding:"12px 14px" }}><div style={{ fontWeight:600, color:"#e2e8f0" }}>{e.carModel}</div><div style={{ color:"#475569", fontSize:11 }}>{e.name}</div></td>
                        <td style={{ padding:"12px 14px" }}><span style={{ background:"#0b1120", border:"1px solid #1e2d4a", borderRadius:6, padding:"3px 8px", color:"#94a3b8", fontFamily:"monospace", fontSize:12 }}>{e.plate}</span></td>
                        <td style={{ padding:"12px 14px", color:"#94a3b8" }}>{e.phone}</td>
                        <td style={{ padding:"12px 14px", maxWidth:180 }}><div style={{ display:"flex", flexWrap:"wrap", gap:3 }}>{e.services.map(sid=>{const sv=SERVICES.find(s=>s.id===sid);return sv?<span key={sid} style={{ background:"#0f2447", color:"#60a5fa", border:"1px solid #1e3a5f", borderRadius:5, padding:"2px 6px", fontSize:10 }}>{sv.label}</span>:null;})}</div></td>
                        <td style={{ padding:"12px 14px", fontWeight:700, color:"#34d399" }}>{fmt(e.bill)}</td>
                        <td style={{ padding:"12px 14px" }}><span style={{ padding:"3px 9px", borderRadius:20, fontSize:11, fontWeight:700, background:e.payment==="Cash"?"#052e16":"#2e1065", color:e.payment==="Cash"?"#4ade80":"#a78bfa" }}>{e.payment==="Cash"?"💵 Cash":"📱 GPay"}</span></td>
                      </tr>
                    ))}
                    {reportEntries.length===0&&<tr><td colSpan={7} style={{ padding:40, textAlign:"center", color:"#334155" }}>No jobs on {displayDate(reportDate)}.</td></tr>}
                  </tbody>
                  {reportEntries.length>0&&<tfoot><tr style={{ background:"#0b1631", borderTop:"2px solid #1e3a5f" }}>
                    <td colSpan={5} style={{ padding:"12px 14px", fontWeight:700, color:"#64748b" }}>TOTAL</td>
                    <td style={{ padding:"12px 14px", fontWeight:800, color:"#34d399", fontSize:15 }}>{fmt(reportTotal)}</td>
                    <td style={{ padding:"12px 14px", fontSize:12, color:"#64748b" }}><div>💵 {fmt(cashTotal)}</div><div>📱 {fmt(gpayTotal)}</div></td>
                  </tr></tfoot>}
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── APPOINTMENTS ── */}
        {tab==="appts" && (
          <div>
            <div style={{ fontSize:22, fontWeight:800, color:"#f1f5f9", marginBottom:6 }}>📅 All Appointments</div>
            <div style={{ fontSize:14, color:"#475569", marginBottom:20 }}>Customer bookings from the public booking form.</div>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {appts.map(a=>{
                const svcNames=(a.services||[]).map(id=>SERVICES.find(s=>s.id===id)?.label||id).join(", ");
                const isPending=a.status==="Pending";
                return <div key={a.id} style={{ background:"#0d1b2e", border:`1px solid ${isPending?"#854d0e":"#1e3a5f"}`, borderRadius:12, padding:"18px 20px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                    <div>
                      <div style={{ fontWeight:700, color:"#e2e8f0", fontSize:15 }}>{a.customer_name}</div>
                      <div style={{ color:"#64748b", fontSize:13 }}>{a.phone}{a.email&&` · ${a.email}`}</div>
                    </div>
                    <span style={{ background:isPending?"#1c1a08":"#052e16", border:`1px solid ${isPending?"#854d0e":"#16a34a"}`, color:isPending?"#fbbf24":"#4ade80", borderRadius:20, padding:"3px 10px", fontSize:11, fontWeight:700 }}>{a.status}</span>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, fontSize:13, marginBottom:12 }}>
                    <div><span style={{ color:"#475569" }}>Car: </span><span style={{ color:"#e2e8f0", fontWeight:600 }}>{a.car_model}</span></div>
                    <div><span style={{ color:"#475569" }}>Plate: </span><span style={{ fontFamily:"monospace", color:"#94a3b8" }}>{a.plate||"—"}</span></div>
                    <div><span style={{ color:"#475569" }}>Slot: </span><span style={{ color:"#60a5fa", fontWeight:600 }}>{a.appt_date} at {a.appt_time}</span></div>
                    <div style={{ gridColumn:"1/-1" }}><span style={{ color:"#475569" }}>Services: </span><span style={{ color:"#e2e8f0" }}>{svcNames||"—"}</span></div>
                    <div><span style={{ color:"#475569" }}>Estimated: </span><span style={{ color:"#34d399", fontWeight:700 }}>{fmt(a.estimated_bill||0)}</span></div>
                    {a.notes&&<div style={{ gridColumn:"1/-1" }}><span style={{ color:"#475569" }}>Notes: </span><span style={{ color:"#94a3b8" }}>{a.notes}</span></div>}
                  </div>
                  {isPending&&<button onClick={()=>confirmAppt(a)} style={{ background:"#052e16", border:"1px solid #16a34a", borderRadius:8, padding:"9px 18px", color:"#4ade80", fontWeight:700, fontSize:13, cursor:"pointer" }}>
                    ✅ Confirm & Notify Customer on WhatsApp
                  </button>}
                </div>;
              })}
              {appts.length===0&&<div style={{ textAlign:"center", color:"#334155", padding:40 }}>No appointments yet. Share the booking link with customers.</div>}
            </div>
          </div>
        )}

        {/* ── PROMOTIONS ── */}
        {tab==="promos" && (
          <div>
            <div style={{ fontSize:22, fontWeight:800, color:"#f1f5f9", marginBottom:4 }}>📣 WhatsApp Campaign Messages</div>
            <div style={{ fontSize:14, color:"#475569", marginBottom:20 }}>Copy and send via WhatsApp Business in seconds.</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:20 }}>
              {PROMOS.map((p,i)=>(
                <div key={i} style={{ background:"#0d1b2e", border:"1px solid #1e3a5f", borderRadius:16, overflow:"hidden" }}>
                  <div style={{ padding:"14px 18px", borderBottom:"1px solid #1e2d4a", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div style={{ fontWeight:700, color:"#e2e8f0" }}>{p.title}</div>
                    <span style={{ fontSize:10, fontWeight:700, padding:"3px 9px", borderRadius:20, color:"white", background:p.tagColor }}>{p.tag}</span>
                  </div>
                  <div style={{ padding:"14px 18px" }}><pre style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"#94a3b8", whiteSpace:"pre-wrap", lineHeight:1.7, margin:0, minHeight:140 }}>{p.msg}</pre></div>
                  <div style={{ padding:"0 18px 16px" }}>
                    <button onClick={()=>{ navigator.clipboard.writeText(p.msg); setCopied(i); setTimeout(()=>setCopied(null),2500); }}
                      style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:8, background:copied===i?"#052e16":"#172554", border:`1px solid ${copied===i?"#16a34a":"#3b82f6"}`, borderRadius:8, padding:"10px", fontWeight:600, fontSize:13, cursor:"pointer", color:copied===i?"#4ade80":"#60a5fa" }}>
                      {copied===i?<><Check size={14}/>Copied!</>:<><Copy size={14}/>Copy Campaign Message</>}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        select option{background:#0b1120;color:#e2e8f0}
        input::placeholder{color:#334155}
        .bg-slate-700{background:#334155}.text-slate-200{color:#e2e8f0}.bg-slate-400{background:#94a3b8}
        .bg-blue-900{background:#1e3a8a}.text-blue-200{color:#bfdbfe}.bg-blue-400{background:#60a5fa}
        .bg-emerald-900{background:#064e3b}.text-emerald-200{color:#a7f3d0}.bg-emerald-400{background:#34d399}
        .bg-violet-900{background:#2e1065}.text-violet-200{color:#ddd6fe}.bg-violet-400{background:#a78bfa}
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:#0b1120}
        ::-webkit-scrollbar-thumb{background:#1e3a5f;border-radius:3px}
      `}</style>
    </div>
  );
}
