import { useState, useEffect, useCallback } from "react";
import { Car, Users, IndianRupee, CalendarClock, Plus, Copy, Check, Sparkles, ClipboardList, CalendarDays, LayoutDashboard, Trash2, RefreshCw, AlertCircle, Wifi, FileText, Printer, LogOut, Settings, Search, ToggleLeft, ToggleRight, Calendar } from "lucide-react";
import { sb, SERVICES, STATUS_META, fmt, todayStr, MSP_WHATSAPP } from "../config";
import IntakeForm from "../components/IntakeForm";
import PricingManager from "./PricingManager";

const displayDate = (d) => new Date(d).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});

const flatRow = (l) => ({
  id:       l.id,
  name:     l.customers?.name     || "—",
  phone:    l.customers?.phone    || "—",
  email:    l.customers?.email    || "",
  carModel: l.vehicles?.car_model || "—",
  plate:    l.vehicles?.plate     || "—",
  color:    l.vehicles?.color     || "",
  services: l.services            || [],
  status:   l.status              || "Queued",
  bill:     l.total_bill          || 0,
  payment:  l.payment_mode        || "Cash",
  source:   l.vehicle_source      || "customer",
  category: l.car_category        || "",
  created:  l.created_at          || new Date().toISOString(),
});

const PROMOS = [
  { title:"🌧️ Monsoon Special", tag:"20% OFF", tagColor:"#3b82f6", msg:`🚗✨ *Monsoon Detailing Offer at MSP Studio!*\n\nGet *20% OFF* on all detailing services this monsoon season!\n\n🧼 Foam Wash | 🛡️ PPF Coating | 💎 Ceramic Coating\n\n📍 Maruthi Service Point Studio\n📞 Contact us to book your slot!\n\n_Don't let the rains ruin your ride!_ 🌧️` },
  { title:"💎 Ceramic Bundle", tag:"BUNDLE DEAL", tagColor:"#8b5cf6", msg:`🏆 *Premium Ceramic Bundle — MSP Studio Exclusive!*\n\nBook *Ceramic Coating + Full Foam Wash* together and save ₹2,000!\n\n💎 Ceramic Coating — ₹25,000\n🧼 Foam Wash — FREE\n\n🔥 Limited slots available.\n\n📍 Maruthi Service Point Studio\n📞 Reserve now! 🚗` },
  { title:"🎉 Referral Reward", tag:"REFER & EARN", tagColor:"#f59e0b", msg:`🎁 *Refer & Earn at MSP Studio!*\n\nRefer a friend and *both get ₹500 OFF!*\n\n✅ No minimum spend ✅ Valid on any service\n\n📍 Maruthi Service Point Studio 👑` },
];

export default function AdminUI({ onLogout }) {
  const [tab,        setTab]       = useState("dashboard");
  const [entries,    setEntries]   = useState([]);
  const [appts,      setAppts]     = useState([]);
  const [loading,    setLoading]   = useState(false);
  const [copied,     setCopied]    = useState(null);
  const [toast,      setToast]     = useState(null);
  const [showForm,   setShowForm]  = useState(false);
  const [reportDate, setReportDate]= useState(todayStr());
  const [dbError,    setDbError]   = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [promoActive, setPromoActive] = useState(false);
  const [promoEndDate,setPromoEndDate]= useState("");
  const [promoSaving, setPromoSaving] = useState(false);

  const showToast = (msg, type="success") => { setToast({msg,type}); setTimeout(()=>setToast(null),3500); };

  const loadData = useCallback(async () => {
    setLoading(true); setDbError(null);
    try {
      // Load promo settings
      sb("promo_settings?id=eq.1&select=active,end_date",{ method:"GET" })
        .then(rows=>{ if(rows&&rows[0]){ setPromoActive(rows[0].active); setPromoEndDate(rows[0].end_date||""); } })
        .catch(()=>{});
      const [logs, bookings] = await Promise.all([
        sb("services_log?select=id,services,total_bill,status,payment_mode,vehicle_source,car_category,created_at,customers(name,phone,email),vehicles(car_model,plate,color)&order=created_at.desc", { method:"GET" }),
        sb("appointments?select=*&order=appt_date.asc,appt_time.asc", { method:"GET" }),
      ]);
      setEntries((logs||[]).map(flatRow));
      setAppts(bookings||[]);
    } catch(e) { setDbError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(()=>{ loadData(); },[loadData]);

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
      showToast("Confirmed!"); loadData();
    } catch(e) { showToast("Error: "+e.message,"error"); }
  };

  // ── Report calculations ──
  const reportAll      = entries.filter(e=>e.created.startsWith(reportDate));
  const reportCust     = reportAll.filter(e=>e.source==="customer");
  const reportGarage   = reportAll.filter(e=>e.source==="garage");
  const sum            = (arr) => arr.reduce((s,e)=>s+e.bill,0);
  const cashOf         = (arr) => arr.filter(e=>e.payment==="Cash").reduce((s,e)=>s+e.bill,0);
  const gpayOf         = (arr) => arr.filter(e=>e.payment==="GPay").reduce((s,e)=>s+e.bill,0);

  // Monthly revenue
  const monthStr    = reportDate.slice(0,7);
  const monthAll    = entries.filter(e=>e.created.startsWith(monthStr));
  const monthCust   = monthAll.filter(e=>e.source==="customer");
  const monthGarage = monthAll.filter(e=>e.source==="garage");

  const totalRevenue = entries.filter(e=>e.status==="Completed"||e.status==="Delivered").reduce((s,e)=>s+e.bill,0);
  const pending      = entries.filter(e=>e.status==="Queued").length;
  const inWorkshop   = entries.filter(e=>e.status==="In Progress").length;
  const pendingAppts = appts.filter(a=>a.status==="Pending").length;

  const printReport = () => {
    const win=window.open("","_blank");
    const rows=reportAll.map((e,i)=>`<tr><td>${i+1}</td><td>${e.carModel}${e.category?`<br/><small>${e.category}</small>`:""}<br/><small style="color:#555">${e.name}</small></td><td style="font-family:monospace">${e.plate}</td><td>${e.phone}</td><td>${e.services.map(sid=>SERVICES.find(s=>s.id===sid)?.label||sid).join(", ")}</td><td>₹${Number(e.bill).toLocaleString("en-IN")}</td><td class="${e.payment==="Cash"?"cash":"gpay"}">${e.payment==="Cash"?"💵 Cash":"📱 GPay"}</td><td class="${e.source==="garage"?"garage":"cust"}">${e.source==="garage"?"🏠 Garage":"👤 Customer"}</td></tr>`).join("");
    win.document.write(`<html><head><title>MSP Daily Report — ${displayDate(reportDate)}</title>
    <style>body{font-family:Arial,sans-serif;padding:24px;color:#111}h2{margin:0 0 4px}p{margin:0 0 16px;color:#555;font-size:13px}table{width:100%;border-collapse:collapse;font-size:12px}th{background:#1e3a8a;color:white;padding:9px 10px;text-align:left}td{padding:8px 10px;border-bottom:1px solid #e2e8f0;vertical-align:top}tr:nth-child(even) td{background:#f8fafc}.cash{color:#16a34a;font-weight:700}.gpay{color:#7c3aed;font-weight:700}.cust{color:#3b82f6;font-weight:700}.garage{color:#f59e0b;font-weight:700}.summary{margin-top:20px;display:flex;gap:14px;flex-wrap:wrap}.box{border:1px solid #e2e8f0;border-radius:8px;padding:10px 16px;min-width:130px}.box .label{font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px}.box .val{font-size:18px;font-weight:800;margin-top:4px}.section{margin-top:20px;font-weight:700;font-size:14px;color:#1e3a8a;border-bottom:2px solid #1e3a8a;padding-bottom:4px;margin-bottom:8px}@media print{button{display:none}}</style></head><body>
    <h2>🚗 MSP Studio Hub — Daily Report</h2>
    <p>Date: ${displayDate(reportDate)} | Generated: ${new Date().toLocaleTimeString("en-IN")}</p>
    <table><thead><tr><th>No.</th><th>Car / Customer</th><th>Vehicle No.</th><th>Contact</th><th>Services</th><th>Price</th><th>Payment</th><th>Source</th></tr></thead>
    <tbody>${rows}</tbody></table>
    <div class="summary">
      <div class="box"><div class="label">Total Jobs</div><div class="val">${reportAll.length}</div></div>
      <div class="box"><div class="label">Total Revenue</div><div class="val" style="color:#1d4ed8">₹${Number(sum(reportAll)).toLocaleString("en-IN")}</div></div>
      <div class="box"><div class="label">👤 Customer Rev.</div><div class="val" style="color:#3b82f6">₹${Number(sum(reportCust)).toLocaleString("en-IN")}</div></div>
      <div class="box"><div class="label">🏠 Garage Rev.</div><div class="val" style="color:#f59e0b">₹${Number(sum(reportGarage)).toLocaleString("en-IN")}</div></div>
      <div class="box"><div class="label">💵 Cash</div><div class="val" style="color:#16a34a">₹${Number(cashOf(reportAll)).toLocaleString("en-IN")}</div></div>
      <div class="box"><div class="label">📱 GPay</div><div class="val" style="color:#7c3aed">₹${Number(gpayOf(reportAll)).toLocaleString("en-IN")}</div></div>
    </div>
    <div class="section" style="margin-top:24px">Monthly Summary — ${new Date(reportDate).toLocaleDateString("en-IN",{month:"long",year:"numeric"})}</div>
    <div class="summary">
      <div class="box"><div class="label">Month Total</div><div class="val" style="color:#1d4ed8">₹${Number(sum(monthAll)).toLocaleString("en-IN")}</div></div>
      <div class="box"><div class="label">👤 Customer</div><div class="val" style="color:#3b82f6">₹${Number(sum(monthCust)).toLocaleString("en-IN")}</div></div>
      <div class="box"><div class="label">🏠 Garage</div><div class="val" style="color:#f59e0b">₹${Number(sum(monthGarage)).toLocaleString("en-IN")}</div></div>
    </div>
    <br/><button onclick="window.print()">🖨️ Print / Save as PDF</button></body></html>`);
    win.document.close();
  };

  const savePromo = async () => {
    setPromoSaving(true);
    try {
      await sb("promo_settings", { method:"POST", prefer:"resolution=merge-duplicates,return=minimal", body:JSON.stringify({ id:1, active:promoActive, end_date:promoEndDate||null }) });
      showToast(promoActive?"🎉 Promo is now LIVE!":"Promo ended.");
    } catch(e) { showToast("Save failed: "+e.message,"error"); }
    finally { setPromoSaving(false); }
  };

  const TABS = [
    { id:"dashboard", label:"Dashboard",    icon:LayoutDashboard },
    { id:"report",    label:"Daily Report", icon:FileText        },
    { id:"appts",     label:"Appointments", icon:CalendarDays    },
    { id:"pricing",   label:"Pricing",      icon:Settings        },
    { id:"promos",    label:"Promotions",   icon:Sparkles        },
  ];

  const sourceBadge = (src) => src==="garage"
    ? { bg:"#2d1b00", border:"#854d0e", color:"#fbbf24", label:"🏠 Garage" }
    : { bg:"#0f2447", border:"#1e3a5f", color:"#60a5fa", label:"👤 Customer" };

  return (
    <div style={{ minHeight:"100vh", background:"#0b1120", fontFamily:"'DM Sans','Segoe UI',sans-serif", color:"#e2e8f0" }}>
      {toast&&<div style={{ position:"fixed", top:16, right:16, zIndex:999, background:toast.type==="error"?"#1c0a0a":"#052e16", border:`1px solid ${toast.type==="error"?"#7f1d1d":"#16a34a"}`, color:toast.type==="error"?"#f87171":"#4ade80", borderRadius:10, padding:"11px 16px", fontSize:13, fontWeight:600, boxShadow:"0 8px 32px #00000060" }}>{toast.msg}</div>}

      <header style={{ background:"linear-gradient(135deg,#0f1e3a,#0b1120)", borderBottom:"1px solid #1e2d4a", padding:"0 24px", position:"sticky", top:0, zIndex:50 }}>
        <div style={{ maxWidth:1300, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", height:64 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:38, height:38, borderRadius:10, background:"linear-gradient(135deg,#3b82f6,#1d4ed8)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 0 16px #3b82f640" }}><Car size={20} color="white"/></div>
            <div><div style={{ fontSize:15, fontWeight:700, color:"#f1f5f9" }}>MSP Studio Hub</div><div style={{ fontSize:11, color:"#475569" }}>ADMIN PANEL 👑</div></div>
          </div>
          <nav style={{ display:"flex", gap:3 }}>
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)} style={{ display:"flex", alignItems:"center", gap:5, padding:"7px 13px", borderRadius:8, border:"none", cursor:"pointer", fontSize:13, fontWeight:500, background:tab===t.id?"#1e40af":"transparent", color:tab===t.id?"#93c5fd":"#64748b" }}>
                <t.icon size={14}/>{t.label}
                {t.id==="appts"&&pendingAppts>0&&<span style={{ background:"#ef4444", color:"white", borderRadius:"50%", width:16, height:16, fontSize:10, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700 }}>{pendingAppts}</span>}
              </button>
            ))}
          </nav>
          <div style={{ display:"flex", gap:10, alignItems:"center" }}>
            <span style={{ fontSize:11, color:"#4ade80", background:"#052e16", border:"1px solid #16a34a", padding:"4px 10px", borderRadius:20, display:"flex", alignItems:"center", gap:5 }}><Wifi size={11}/>Live</span>
            <button onClick={onLogout} style={{ display:"flex", alignItems:"center", gap:6, background:"#1c0a0a", border:"1px solid #7f1d1d", borderRadius:8, padding:"7px 12px", color:"#f87171", cursor:"pointer", fontSize:12 }}><LogOut size={13}/>Logout</button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth:1300, margin:"0 auto", padding:"28px 24px" }}>

        {/* ── DASHBOARD ── */}
        {tab==="dashboard"&&(
          <div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:28 }}>
              {[
                { label:"Total Entries",        value:entries.length,   icon:Users,        accent:"#3b82f6", bg:"#0f2447" },
                { label:"Vehicles in Workshop", value:inWorkshop,       icon:Car,          accent:"#a855f7", bg:"#1a0f33" },
                { label:"Revenue (Completed)",  value:fmt(totalRevenue),icon:IndianRupee,  accent:"#10b981", bg:"#042f1e" },
                { label:"Queued Jobs",          value:pending,          icon:CalendarClock,accent:"#f59e0b", bg:"#2d1b00" },
              ].map((kpi,i)=>(
                <div key={i} style={{ background:kpi.bg, border:`1px solid ${kpi.accent}30`, borderRadius:14, padding:"20px 22px", position:"relative", overflow:"hidden" }}>
                  <div style={{ position:"absolute", right:-10, top:-10, width:70, height:70, borderRadius:"50%", background:`${kpi.accent}15` }}/>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                    <div>
                      <div style={{ fontSize:11, color:"#64748b", fontWeight:600, letterSpacing:0.8, marginBottom:8, textTransform:"uppercase" }}>{kpi.label}</div>
                      <div style={{ fontSize:28, fontWeight:800, color:"#f1f5f9" }}>{kpi.value}</div>
                    </div>
                    <div style={{ width:40, height:40, borderRadius:10, background:`${kpi.accent}20`, display:"flex", alignItems:"center", justifyContent:"center" }}><kpi.icon size={20} color={kpi.accent}/></div>
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

            {showForm&&<div style={{ marginBottom:28 }}><IntakeForm onSuccess={()=>{ setShowForm(false); loadData(); }} showToast={showToast}/></div>}

            {/* All entries table */}
            <div style={{ background:"#0d1b2e", border:"1px solid #1e3a5f", borderRadius:16, overflow:"hidden" }}>
              <div style={{ padding:"16px 22px", borderBottom:"1px solid #1e2d4a", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div style={{ fontSize:14, fontWeight:700, color:"#93c5fd", display:"flex", alignItems:"center", gap:8 }}><ClipboardList size={16}/>All Entries ({entries.length})</div>
                <div style={{ position:"relative" }}>
                  <Search size={13} color="#475569" style={{ position:"absolute",left:10,top:"50%",transform:"translateY(-50%)" }}/>
                  <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Search by plate or phone…"
                    style={{ background:"#0b1120", border:"1px solid #1e2d4a", borderRadius:8, padding:"7px 12px 7px 30px", color:"#e2e8f0", fontSize:12, outline:"none", width:220 }}/>
                </div>
                {dbError&&<div style={{ fontSize:12, color:"#f87171", display:"flex", alignItems:"center", gap:5 }}><AlertCircle size={13}/>{dbError}</div>}
              </div>
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                  <thead><tr style={{ background:"#0b1631" }}>
                    {["Customer","Phone","Car","Plate","Services","Bill","Payment","Source","Status",""].map(h=><th key={h} style={{ padding:"11px 12px", textAlign:"left", color:"#475569", fontWeight:600, fontSize:11, textTransform:"uppercase", letterSpacing:0.5, borderBottom:"1px solid #1e2d4a" }}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {entries.filter(e=>!searchQuery||e.plate.toLowerCase().includes(searchQuery.toLowerCase())||e.phone.includes(searchQuery)||e.name.toLowerCase().includes(searchQuery.toLowerCase())).map((e,i)=>{
                      const meta=STATUS_META[e.status]||STATUS_META.Queued;
                      const sb2=sourceBadge(e.source);
                      return <tr key={e.id} style={{ borderBottom:"1px solid #0f1e3a", background:i%2===0?"transparent":"#090f1c" }}>
                        <td style={{ padding:"11px 12px" }}><div style={{ fontWeight:600, color:"#e2e8f0" }}>{e.name}</div></td>
                        <td style={{ padding:"11px 12px", color:"#94a3b8" }}>{e.phone}</td>
                        <td style={{ padding:"11px 12px" }}><div style={{ color:"#e2e8f0", fontWeight:500, fontSize:12 }}>{e.carModel}</div>{e.category&&<div style={{ color:"#475569", fontSize:10 }}>{e.category}</div>}</td>
                        <td style={{ padding:"11px 12px" }}><span style={{ background:"#0b1120", border:"1px solid #1e2d4a", borderRadius:5, padding:"2px 7px", color:"#94a3b8", fontFamily:"monospace", fontSize:11 }}>{e.plate}</span></td>
                        <td style={{ padding:"11px 12px", maxWidth:150 }}><div style={{ display:"flex", flexWrap:"wrap", gap:3 }}>{e.services.map(sid=>{const sv=SERVICES.find(s=>s.id===sid);return sv?<span key={sid} style={{ background:"#0f2447", color:"#60a5fa", border:"1px solid #1e3a5f", borderRadius:4, padding:"1px 5px", fontSize:10 }}>{sv.label}</span>:null;})}</div></td>
                        <td style={{ padding:"11px 12px", fontWeight:700, color:"#34d399", fontSize:13 }}>{fmt(e.bill)}</td>
                        <td style={{ padding:"11px 12px" }}><span style={{ padding:"2px 8px", borderRadius:20, fontSize:11, fontWeight:700, background:e.payment==="Cash"?"#052e16":"#2e1065", color:e.payment==="Cash"?"#4ade80":"#a78bfa" }}>{e.payment==="Cash"?"💵":"📱"} {e.payment}</span></td>
                        <td style={{ padding:"11px 12px" }}><span style={{ padding:"2px 8px", borderRadius:20, fontSize:11, fontWeight:700, background:sb2.bg, border:`1px solid ${sb2.border}`, color:sb2.color }}>{sb2.label}</span></td>
                        <td style={{ padding:"11px 12px" }}>
                          <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"2px 8px", borderRadius:20, fontSize:11, fontWeight:700 }} className={meta.badge}>
                            <span style={{ width:5, height:5, borderRadius:"50%" }} className={meta.dot}/>
                            <select value={e.status} onChange={ev=>updateStatus(e.id,ev.target.value)} style={{ background:"transparent", border:"none", outline:"none", cursor:"pointer", fontSize:11, fontWeight:700, color:"inherit" }}>
                              {["Queued","In Progress","Completed","Delivered"].map(s=><option key={s}>{s}</option>)}
                            </select>
                          </span>
                        </td>
                        <td style={{ padding:"11px 12px" }}><button onClick={()=>deleteEntry(e.id)} style={{ background:"transparent", border:"1px solid #1e2d4a", borderRadius:5, padding:"4px 7px", cursor:"pointer", color:"#475569", display:"flex" }}><Trash2 size={11}/></button></td>
                      </tr>;
                    })}
                    {!loading&&entries.length===0&&<tr><td colSpan={10} style={{ padding:40, textAlign:"center", color:"#334155" }}>No entries yet.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── DAILY REPORT ── */}
        {tab==="report"&&(
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:20, flexWrap:"wrap", gap:12 }}>
              <div><div style={{ fontSize:22, fontWeight:800, color:"#f1f5f9", marginBottom:4 }}>📊 Daily Report</div><div style={{ fontSize:14, color:"#475569" }}>Revenue split by Customer / Garage vehicles.</div></div>
              <div style={{ display:"flex", gap:10 }}>
                <input type="date" value={reportDate} onChange={e=>setReportDate(e.target.value)} style={{ background:"#0d1b2e", border:"1px solid #1e3a5f", borderRadius:8, padding:"9px 14px", color:"#e2e8f0", fontSize:13, outline:"none" }}/>
                <button onClick={printReport} style={{ display:"flex", alignItems:"center", gap:7, background:"linear-gradient(135deg,#1d4ed8,#3b82f6)", color:"white", border:"none", borderRadius:8, padding:"10px 18px", fontWeight:600, fontSize:13, cursor:"pointer" }}>
                  <Printer size={15}/> Print / Save PDF
                </button>
              </div>
            </div>

            {/* Daily summary cards */}
            <div style={{ marginBottom:10 }}>
              <div style={{ fontSize:11, color:"#3b82f6", fontWeight:700, textTransform:"uppercase", letterSpacing:0.8, marginBottom:10 }}>Daily — {displayDate(reportDate)}</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:12, marginBottom:20 }}>
                {[
                  { label:"Total Jobs",      value:reportAll.length,      accent:"#3b82f6", bg:"#0f2447" },
                  { label:"Total Revenue",   value:fmt(sum(reportAll)),   accent:"#10b981", bg:"#042f1e" },
                  { label:"👤 Customer",     value:fmt(sum(reportCust)),  accent:"#3b82f6", bg:"#0f2447" },
                  { label:"🏠 Garage",       value:fmt(sum(reportGarage)),accent:"#f59e0b", bg:"#2d1b00" },
                  { label:"💵 Cash",         value:fmt(cashOf(reportAll)),accent:"#16a34a", bg:"#052e16" },
                  { label:"📱 GPay",         value:fmt(gpayOf(reportAll)),accent:"#7c3aed", bg:"#2e1065" },
                ].map((k,i)=>(
                  <div key={i} style={{ background:k.bg, border:`1px solid ${k.accent}40`, borderRadius:12, padding:"13px 16px" }}>
                    <div style={{ fontSize:10, color:"#64748b", fontWeight:600, textTransform:"uppercase", letterSpacing:0.8, marginBottom:5 }}>{k.label}</div>
                    <div style={{ fontSize:18, fontWeight:800, color:"#f1f5f9" }}>{k.value}</div>
                  </div>
                ))}
              </div>

              {/* Monthly summary */}
              <div style={{ fontSize:11, color:"#a855f7", fontWeight:700, textTransform:"uppercase", letterSpacing:0.8, marginBottom:10 }}>Monthly — {new Date(reportDate).toLocaleDateString("en-IN",{month:"long",year:"numeric"})}</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:12, marginBottom:24 }}>
                {[
                  { label:"Month Total",    value:fmt(sum(monthAll)),    accent:"#a855f7", bg:"#1a0f33" },
                  { label:"👤 Customer",    value:fmt(sum(monthCust)),   accent:"#3b82f6", bg:"#0f2447" },
                  { label:"🏠 Garage",      value:fmt(sum(monthGarage)), accent:"#f59e0b", bg:"#2d1b00" },
                  { label:"💵 Cash",        value:fmt(cashOf(monthAll)), accent:"#16a34a", bg:"#052e16" },
                  { label:"📱 GPay",        value:fmt(gpayOf(monthAll)), accent:"#7c3aed", bg:"#2e1065" },
                ].map((k,i)=>(
                  <div key={i} style={{ background:k.bg, border:`1px solid ${k.accent}40`, borderRadius:12, padding:"13px 16px" }}>
                    <div style={{ fontSize:10, color:"#64748b", fontWeight:600, textTransform:"uppercase", letterSpacing:0.8, marginBottom:5 }}>{k.label}</div>
                    <div style={{ fontSize:18, fontWeight:800, color:"#f1f5f9" }}>{k.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Report table */}
            <div style={{ background:"#0d1b2e", border:"1px solid #1e3a5f", borderRadius:16, overflow:"hidden" }}>
              <div style={{ padding:"14px 20px", borderBottom:"1px solid #1e2d4a" }}>
                <span style={{ fontSize:14, fontWeight:700, color:"#93c5fd" }}>{reportAll.length} job{reportAll.length!==1?"s":""} on {displayDate(reportDate)}</span>
              </div>
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                  <thead><tr style={{ background:"#0b1631" }}>
                    {["No.","Car / Customer","Vehicle No.","Contact","Services","Price","Payment","Source"].map(h=><th key={h} style={{ padding:"11px 13px", textAlign:"left", color:"#475569", fontWeight:600, fontSize:11, textTransform:"uppercase", letterSpacing:0.5, borderBottom:"1px solid #1e2d4a" }}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {reportAll.map((e,i)=>{
                      const sb2=sourceBadge(e.source);
                      return <tr key={e.id} style={{ borderBottom:"1px solid #0f1e3a", background:i%2===0?"transparent":"#090f1c" }}>
                        <td style={{ padding:"11px 13px", color:"#64748b", fontWeight:600 }}>{i+1}</td>
                        <td style={{ padding:"11px 13px" }}><div style={{ fontWeight:600, color:"#e2e8f0" }}>{e.carModel}</div><div style={{ color:"#475569", fontSize:11 }}>{e.name}{e.category?" · "+e.category:""}</div></td>
                        <td style={{ padding:"11px 13px" }}><span style={{ background:"#0b1120", border:"1px solid #1e2d4a", borderRadius:5, padding:"2px 7px", color:"#94a3b8", fontFamily:"monospace", fontSize:11 }}>{e.plate}</span></td>
                        <td style={{ padding:"11px 13px", color:"#94a3b8" }}>{e.phone}</td>
                        <td style={{ padding:"11px 13px", maxWidth:180 }}><div style={{ display:"flex", flexWrap:"wrap", gap:3 }}>{e.services.map(sid=>{const sv=SERVICES.find(s=>s.id===sid);return sv?<span key={sid} style={{ background:"#0f2447", color:"#60a5fa", border:"1px solid #1e3a5f", borderRadius:4, padding:"1px 5px", fontSize:10 }}>{sv.label}</span>:null;})}</div></td>
                        <td style={{ padding:"11px 13px", fontWeight:700, color:"#34d399" }}>{fmt(e.bill)}</td>
                        <td style={{ padding:"11px 13px" }}><span style={{ padding:"2px 8px", borderRadius:20, fontSize:11, fontWeight:700, background:e.payment==="Cash"?"#052e16":"#2e1065", color:e.payment==="Cash"?"#4ade80":"#a78bfa" }}>{e.payment==="Cash"?"💵 Cash":"📱 GPay"}</span></td>
                        <td style={{ padding:"11px 13px" }}><span style={{ padding:"2px 8px", borderRadius:20, fontSize:11, fontWeight:700, background:sb2.bg, border:`1px solid ${sb2.border}`, color:sb2.color }}>{sb2.label}</span></td>
                      </tr>;
                    })}
                    {reportAll.length===0&&<tr><td colSpan={8} style={{ padding:40, textAlign:"center", color:"#334155" }}>No jobs on {displayDate(reportDate)}.</td></tr>}
                  </tbody>
                  {reportAll.length>0&&<tfoot><tr style={{ background:"#0b1631", borderTop:"2px solid #1e3a5f" }}>
                    <td colSpan={5} style={{ padding:"12px 13px", fontWeight:700, color:"#64748b" }}>TOTALS</td>
                    <td style={{ padding:"12px 13px", fontWeight:800, color:"#34d399", fontSize:15 }}>{fmt(sum(reportAll))}</td>
                    <td style={{ padding:"12px 13px", fontSize:11, color:"#64748b" }}><div>💵 {fmt(cashOf(reportAll))}</div><div>📱 {fmt(gpayOf(reportAll))}</div></td>
                    <td style={{ padding:"12px 13px", fontSize:11 }}><div style={{ color:"#60a5fa" }}>👤 {fmt(sum(reportCust))}</div><div style={{ color:"#fbbf24" }}>🏠 {fmt(sum(reportGarage))}</div></td>
                  </tr></tfoot>}
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── APPOINTMENTS ── */}
        {tab==="appts"&&(
          <div>
            <div style={{ fontSize:22, fontWeight:800, color:"#f1f5f9", marginBottom:6 }}>📅 All Appointments</div>
            <div style={{ fontSize:14, color:"#475569", marginBottom:20 }}>Customer bookings from the public booking form.</div>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {appts.map(a=>{
                const svcNames=(a.services||[]).map(id=>SERVICES.find(s=>s.id===id)?.label||id).join(", ");
                const isPending=a.status==="Pending";
                return <div key={a.id} style={{ background:"#0d1b2e", border:`1px solid ${isPending?"#854d0e":"#1e3a5f"}`, borderRadius:12, padding:"18px 20px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                    <div><div style={{ fontWeight:700, color:"#e2e8f0", fontSize:15 }}>{a.customer_name}</div><div style={{ color:"#64748b", fontSize:13 }}>{a.phone}{a.email&&` · ${a.email}`}</div></div>
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
                  {isPending&&<button onClick={()=>confirmAppt(a)} style={{ background:"#052e16", border:"1px solid #16a34a", borderRadius:8, padding:"9px 18px", color:"#4ade80", fontWeight:700, fontSize:13, cursor:"pointer" }}>✅ Confirm & Notify on WhatsApp</button>}
                </div>;
              })}
              {appts.length===0&&<div style={{ textAlign:"center", color:"#334155", padding:40 }}>No appointments yet.</div>}
            </div>
          </div>
        )}

        {/* ── PRICING MANAGER ── */}
        {tab==="pricing"&&<PricingManager showToast={showToast}/>}

        {/* ── PROMOTIONS ── */}
        {tab==="promos"&&(
          <div>
            {/* Promo Manager */}
            <div style={{ background:"#0d1b2e", border:`2px solid ${promoActive?"#16a34a":"#1e3a5f"}`, borderRadius:16, padding:24, marginBottom:28 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:16 }}>
                <div>
                  <div style={{ fontSize:16, fontWeight:700, color:"#f1f5f9", marginBottom:4, display:"flex", alignItems:"center", gap:8 }}>
                    {promoActive?<ToggleRight size={22} color="#4ade80"/>:<ToggleLeft size={22} color="#475569"/>}
                    Pickup & Drop Promo — 100% OFF up to 5km
                  </div>
                  <div style={{ fontSize:13, color:"#64748b" }}>When ON, customers see the promo offer on the booking page and get free pickup up to 5km.</div>
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={()=>setPromoActive(true)} style={{ padding:"8px 16px", borderRadius:8, border:`1px solid ${promoActive?"#16a34a":"#1e2d4a"}`, background:promoActive?"#052e16":"#0b1120", color:promoActive?"#4ade80":"#475569", fontWeight:700, fontSize:13, cursor:"pointer" }}>🟢 ON</button>
                  <button onClick={()=>setPromoActive(false)} style={{ padding:"8px 16px", borderRadius:8, border:`1px solid ${!promoActive?"#7f1d1d":"#1e2d4a"}`, background:!promoActive?"#1c0a0a":"#0b1120", color:!promoActive?"#f87171":"#475569", fontWeight:700, fontSize:13, cursor:"pointer" }}>🔴 OFF</button>
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginTop:18, alignItems:"end" }}>
                <div>
                  <label style={{ display:"block", fontSize:11, color:"#64748b", fontWeight:600, textTransform:"uppercase", letterSpacing:0.8, marginBottom:6 }}>Offer End Date (optional)</label>
                  <div style={{ position:"relative" }}>
                    <Calendar size={14} color="#475569" style={{ position:"absolute",left:10,top:"50%",transform:"translateY(-50%)" }}/>
                    <input type="date" value={promoEndDate} onChange={e=>setPromoEndDate(e.target.value)}
                      style={{ width:"100%", background:"#0b1120", border:"1px solid #1e2d4a", borderRadius:8, padding:"10px 12px 10px 32px", color:"#e2e8f0", fontSize:13, outline:"none", boxSizing:"border-box" }}/>
                  </div>
                  <div style={{ fontSize:11, color:"#475569", marginTop:4 }}>Shown to customers on the booking page. Leave blank for open-ended.</div>
                </div>
                <button onClick={savePromo} disabled={promoSaving}
                  style={{ background:promoActive?"linear-gradient(135deg,#16a34a,#4ade80)":"linear-gradient(135deg,#1d4ed8,#3b82f6)", color:"white", border:"none", borderRadius:8, padding:"11px", fontWeight:700, fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                  {promoSaving?<><RefreshCw size={14} style={{ animation:"spin 1s linear infinite" }}/>Saving…</>:(promoActive?"🚀 Save & Go Live":"💾 Save Settings")}
                </button>
              </div>
              {promoActive&&<div style={{ marginTop:14, background:"#052e16", border:"1px solid #16a34a", borderRadius:8, padding:"10px 14px", fontSize:13, color:"#4ade80", fontWeight:600 }}>✅ Promo is LIVE — customers see the 100% OFF offer on their booking page right now!</div>}
            </div>

            <div style={{ fontSize:22, fontWeight:800, color:"#f1f5f9", marginBottom:4 }}>📣 WhatsApp Campaign Messages</div>
            <div style={{ fontSize:14, color:"#475569", marginBottom:20 }}>Copy and send via WhatsApp Business.</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:20 }}>
              {PROMOS.map((p,i)=>(
                <div key={i} style={{ background:"#0d1b2e", border:"1px solid #1e3a5f", borderRadius:16, overflow:"hidden" }}>
                  <div style={{ padding:"14px 18px", borderBottom:"1px solid #1e2d4a", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div style={{ fontWeight:700, color:"#e2e8f0" }}>{p.title}</div>
                    <span style={{ fontSize:10, fontWeight:700, padding:"3px 9px", borderRadius:20, color:"white", background:p.tagColor }}>{p.tag}</span>
                  </div>
                  <div style={{ padding:"14px 18px" }}><pre style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"#94a3b8", whiteSpace:"pre-wrap", lineHeight:1.7, margin:0, minHeight:120 }}>{p.msg}</pre></div>
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

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}select option{background:#0b1120;color:#e2e8f0}input::placeholder{color:#334155}.bg-slate-700{background:#334155}.text-slate-200{color:#e2e8f0}.bg-slate-400{background:#94a3b8}.bg-blue-900{background:#1e3a8a}.text-blue-200{color:#bfdbfe}.bg-blue-400{background:#60a5fa}.bg-emerald-900{background:#064e3b}.text-emerald-200{color:#a7f3d0}.bg-emerald-400{background:#34d399}.bg-violet-900{background:#2e1065}.bg-violet-400{background:#a78bfa}.text-violet-200{color:#ddd6fe}*{box-sizing:border-box}::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-track{background:#0b1120}::-webkit-scrollbar-thumb{background:#1e3a5f;border-radius:3px}`}</style>
    </div>
  );
}
