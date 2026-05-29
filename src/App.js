import { useState, useEffect, useCallback } from "react";
import './App.css';
import {
  Car, Users, IndianRupee, CalendarClock, Plus, Copy, Check,
  Sparkles, ClipboardList, CalendarDays, LayoutDashboard,
  Trash2, Phone, Mail, Tag, Palette, CircleDot,
  Star, Zap, Shield, Droplets, RefreshCw, AlertCircle, Wifi,
  Printer, FileText, Wallet
} from "lucide-react";

const SUPABASE_URL = "https://vhdefudjosivafnfopzd.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoZGVmdWRqb3NpdmFmbmZvcHpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NTM0MTMsImV4cCI6MjA5NTUyOTQxM30.NbWQV_UV1byXVXeiOMDSOfSurX450vlPR7I1oliUujo";

const sb = async (path, opts = {}) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: opts.prefer || "return=representation",
    },
    ...opts,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
};

const SERVICES = [
  { id: "foam",      label: "Full Car Foam Wash",     price: 500,   icon: Droplets  },
  { id: "polish",    label: "Car Polishing",          price: 3000,  icon: Sparkles  },
  { id: "ppf",       label: "PPF Coating",            price: 80000, icon: Shield    },
  { id: "ceramic",   label: "Ceramic Coating",        price: 25000, icon: Star      },
  { id: "rub",       label: "Rubbing & Polishing",    price: 2500,  icon: Zap       },
  { id: "headlight", label: "Headlight Buffing",      price: 800,   icon: CircleDot },
  { id: "paint",     label: "Paint Work & Tinkering", price: 5000,  icon: Palette   },
];

const CAR_MODELS = [
  "Maruti Suzuki Swift","Maruti Suzuki Baleno","Hyundai Creta","Hyundai i20",
  "Mahindra Thar","Mahindra XUV700","Tata Nexon","Tata Punch",
  "Toyota Fortuner","Kia Seltos","Other"
];

const STATUS_META = {
  Queued:        { color: "bg-slate-700 text-slate-200",     dot: "bg-slate-400"    },
  "In Progress": { color: "bg-blue-900 text-blue-200",       dot: "bg-blue-400"     },
  Completed:     { color: "bg-emerald-900 text-emerald-200", dot: "bg-emerald-400"  },
  Delivered:     { color: "bg-violet-900 text-violet-200",   dot: "bg-violet-400"   },
};

const PROMOS = [
  {
    title: "🌧️ Monsoon Special", tag: "20% OFF", tagColor: "bg-blue-500",
    msg: `🚗✨ *Monsoon Detailing Offer at MSP Studio!*\n\nGet *20% OFF* on all detailing services this monsoon season!\n\n🧼 Foam Wash | 🛡️ PPF Coating | 💎 Ceramic Coating\n\n📍 Maruthi Service Point Studio\n📞 Contact us to book your slot!\n\n_Offer valid for a limited time. Don't let the rains ruin your ride!_ 🌧️`,
  },
  {
    title: "💎 Ceramic Bundle", tag: "BUNDLE DEAL", tagColor: "bg-violet-500",
    msg: `🏆 *Premium Ceramic Bundle — MSP Studio Exclusive!*\n\nBook *Ceramic Coating + Full Foam Wash* together and save ₹2,000!\n\n💎 Ceramic Coating — ₹25,000\n🧼 Foam Wash — FREE with bundle\n\n🔥 Limited slots available this month.\n\n📍 Maruthi Service Point Studio\n📞 DM or call to reserve your slot now! 🚗`,
  },
  {
    title: "🎉 Referral Reward", tag: "REFER & EARN", tagColor: "bg-amber-500",
    msg: `🎁 *Refer & Earn at MSP Studio!*\n\nRefer a friend and *both of you get ₹500 OFF* your next service!\n\nShare this message with a fellow car lover 🚗💨\n\n✅ No minimum spend\n✅ Valid on any service\n✅ Unlimited referrals\n\n📍 Maruthi Service Point Studio — Where your car gets royal treatment 👑`,
  },
];

const SAMPLE_APPOINTMENTS = [
  { id:1, name:"Rajan Mehta",    car:"Hyundai Creta",        service:"Ceramic Coating", time:"10:00 AM", date:"Today",    plate:"KA05MH2023" },
  { id:2, name:"Priya Sharma",   car:"Tata Nexon",           service:"PPF Coating",     time:"12:30 PM", date:"Today",    plate:"KA01AB4521" },
  { id:3, name:"Arjun Nair",     car:"Maruti Suzuki Baleno", service:"Foam Wash",       time:"3:00 PM",  date:"Today",    plate:"KA03CD7890" },
  { id:4, name:"Deepa Krishnan", car:"Kia Seltos",           service:"Car Polishing",   time:"11:00 AM", date:"Tomorrow", plate:"KA51EF1122" },
  { id:5, name:"Vinod Rao",      car:"Toyota Fortuner",      service:"Paint Work",      time:"9:00 AM",  date:"Tomorrow", plate:"KA09GH3344" },
];

const fmt  = (n) => `₹${Number(n).toLocaleString("en-IN")}`;
const calc = (sids) => sids.reduce((s, sid) => s + (SERVICES.find(sv => sv.id === sid)?.price || 0), 0);
const todayStr = () => new Date().toISOString().split("T")[0];
const displayDate = (d) => new Date(d).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" });

const emptyForm = { name:"", phone:"", email:"", carModel:"", plate:"", color:"", services:[], status:"Queued", payment:"Cash" };

const flattenRow = (log) => ({
  id:       log.id,
  name:     log.customers?.name     || "—",
  phone:    log.customers?.phone    || "—",
  email:    log.customers?.email    || "",
  carModel: log.vehicles?.car_model || "—",
  plate:    log.vehicles?.plate     || "—",
  color:    log.vehicles?.color     || "",
  services: log.services            || [],
  status:   log.status              || "Queued",
  bill:     log.total_bill          || 0,
  payment:  log.payment_mode        || "Cash",
  created:  log.created_at          || new Date().toISOString(),
});

export default function App() {
  const [tab, setTab]           = useState("dashboard");
  const [entries, setEntries]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [saving,  setSaving]    = useState(false);
  const [dbError, setDbError]   = useState(null);
  const [form, setForm]         = useState(emptyForm);
  const [errors, setErrors]     = useState({});
  const [copied, setCopied]     = useState(null);
  const [toast,  setToast]      = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [reportDate, setReportDate] = useState(todayStr());

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadEntries = useCallback(async () => {
    setLoading(true); setDbError(null);
    try {
      const rows = await sb(
        "services_log?select=id,services,total_bill,status,payment_mode,created_at,customers(name,phone,email),vehicles(car_model,plate,color)&order=created_at.desc",
        { method: "GET" }
      );
      setEntries((rows || []).map(flattenRow));
    } catch (e) { setDbError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadEntries(); }, [loadEntries]);

  const validate = () => {
    const e = {};
    if (!form.name.trim())             e.name     = "Required";
    if (!form.phone.match(/^\d{10}$/)) e.phone    = "Enter 10-digit number";
    if (!form.carModel)                e.carModel = "Select a car";
    if (!form.plate.trim())            e.plate    = "Required";
    if (!form.services.length)         e.services = "Select at least one service";
    setErrors(e); return !Object.keys(e).length;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const [customer] = await sb("customers", {
        method: "POST",
        body: JSON.stringify({ name: form.name, phone: form.phone, email: form.email || null }),
      });
      const [vehicle] = await sb("vehicles", {
        method: "POST",
        body: JSON.stringify({ customer_id: customer.id, car_model: form.carModel, plate: form.plate, color: form.color || null }),
      });
      await sb("services_log", {
        method: "POST",
        body: JSON.stringify({
          customer_id: customer.id, vehicle_id: vehicle.id,
          services: form.services, total_bill: calc(form.services),
          status: form.status, payment_mode: form.payment,
        }),
      });
      setForm(emptyForm); setErrors({}); setShowForm(false);
      showToast("✅ Customer, vehicle & service saved!");
      await loadEntries();
    } catch (e) { showToast(`❌ Save failed: ${e.message}`, "error"); }
    finally { setSaving(false); }
  };

  const updateStatus = async (id, status) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, status } : e));
    try { await sb(`services_log?id=eq.${id}`, { method:"PATCH", prefer:"return=minimal", body: JSON.stringify({ status }) }); }
    catch (e) { showToast(`Status update failed: ${e.message}`, "error"); loadEntries(); }
  };

  const deleteEntry = async (id) => {
    setEntries(prev => prev.filter(e => e.id !== id));
    try { await sb(`services_log?id=eq.${id}`, { method:"DELETE", prefer:"return=minimal" }); }
    catch (e) { showToast(`Delete failed: ${e.message}`, "error"); loadEntries(); }
  };

  const toggleService = (sid) =>
    setForm(f => ({ ...f, services: f.services.includes(sid) ? f.services.filter(s => s !== sid) : [...f.services, sid] }));

  const copyPromo = (idx, msg) => { navigator.clipboard.writeText(msg); setCopied(idx); setTimeout(() => setCopied(null), 2500); };

  // ── Report data ──
  const reportEntries = entries.filter(e => e.created.startsWith(reportDate));
  const reportTotal   = reportEntries.reduce((s, e) => s + e.bill, 0);
  const cashTotal     = reportEntries.filter(e => e.payment === "Cash").reduce((s, e) => s + e.bill, 0);
  const gpayTotal     = reportEntries.filter(e => e.payment === "GPay").reduce((s, e) => s + e.bill, 0);

  const printReport = () => {
    const win = window.open("", "_blank");
    const rows = reportEntries.map((e, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${e.carModel}</td>
        <td>${e.plate}</td>
        <td>${e.phone}</td>
        <td>${e.services.map(sid => SERVICES.find(s => s.id === sid)?.label || sid).join(", ")}</td>
        <td>₹${Number(e.bill).toLocaleString("en-IN")}</td>
        <td class="${e.payment === 'Cash' ? 'cash' : 'gpay'}">${e.payment}</td>
      </tr>`).join("");
    win.document.write(`
      <html><head><title>MSP Daily Report — ${displayDate(reportDate)}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
        h2 { margin: 0 0 4px; font-size: 20px; }
        p  { margin: 0 0 20px; color: #555; font-size: 13px; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th { background: #1e3a8a; color: white; padding: 10px 12px; text-align: left; }
        td { padding: 9px 12px; border-bottom: 1px solid #e2e8f0; }
        tr:nth-child(even) td { background: #f8fafc; }
        .cash { color: #16a34a; font-weight: 700; }
        .gpay { color: #7c3aed; font-weight: 700; }
        .summary { margin-top: 20px; display: flex; gap: 24px; }
        .box { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 18px; min-width: 140px; }
        .box .label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
        .box .val   { font-size: 20px; font-weight: 800; margin-top: 4px; }
        @media print { button { display: none; } }
      </style></head><body>
      <h2>🚗 MSP Studio Hub — Daily Report</h2>
      <p>Date: ${displayDate(reportDate)} &nbsp;|&nbsp; Generated: ${new Date().toLocaleTimeString("en-IN")}</p>
      <table>
        <thead><tr><th>No.</th><th>Car Make / Model</th><th>Vehicle Number</th><th>Contact Number</th><th>Service Type</th><th>Price</th><th>Payment</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="summary">
        <div class="box"><div class="label">Total Jobs</div><div class="val">${reportEntries.length}</div></div>
        <div class="box"><div class="label">Total Revenue</div><div class="val" style="color:#1d4ed8">₹${Number(reportTotal).toLocaleString("en-IN")}</div></div>
        <div class="box"><div class="label">Cash</div><div class="val" style="color:#16a34a">₹${Number(cashTotal).toLocaleString("en-IN")}</div></div>
        <div class="box"><div class="label">GPay</div><div class="val" style="color:#7c3aed">₹${Number(gpayTotal).toLocaleString("en-IN")}</div></div>
      </div>
      <br/><button onclick="window.print()">🖨️ Print / Save as PDF</button>
      </body></html>`);
    win.document.close();
  };

  const totalRevenue = entries.filter(e => e.status === "Completed" || e.status === "Delivered").reduce((s, e) => s + e.bill, 0);
  const pending      = entries.filter(e => e.status === "Queued").length;
  const inWorkshop   = entries.filter(e => e.status === "In Progress").length;

  const TABS = [
    { id: "dashboard",    label: "Dashboard",     icon: LayoutDashboard },
    { id: "report",       label: "Daily Report",  icon: FileText        },
    { id: "promos",       label: "Promotions",    icon: Sparkles        },
    { id: "appointments", label: "Appointments",  icon: CalendarDays    },
  ];

  return (
    <div style={{ fontFamily:"'DM Sans','Segoe UI',sans-serif", minHeight:"100vh", background:"#0b1120", color:"#e2e8f0" }}>
      {toast && (
        <div style={{ position:"fixed", top:16, right:16, zIndex:999, background:toast.type==="error"?"#1c0a0a":"#052e16", border:`1px solid ${toast.type==="error"?"#7f1d1d":"#16a34a"}`, color:toast.type==="error"?"#f87171":"#4ade80", borderRadius:10, padding:"12px 18px", fontSize:13, fontWeight:600, boxShadow:"0 8px 32px #00000060", maxWidth:400 }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <header style={{ background:"linear-gradient(135deg,#0f1e3a 0%,#0b1120 100%)", borderBottom:"1px solid #1e2d4a", padding:"0 24px", position:"sticky", top:0, zIndex:50 }}>
        <div style={{ maxWidth:1280, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", height:64 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:38, height:38, borderRadius:10, background:"linear-gradient(135deg,#3b82f6,#1d4ed8)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 0 16px #3b82f640" }}>
              <Car size={20} color="white" />
            </div>
            <div>
              <div style={{ fontSize:15, fontWeight:700, color:"#f1f5f9" }}>MSP Studio Hub</div>
              <div style={{ fontSize:11, color:"#64748b", letterSpacing:0.5 }}>MARUTHI SERVICE POINT</div>
            </div>
          </div>
          <nav style={{ display:"flex", gap:4 }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 14px", borderRadius:8, border:"none", cursor:"pointer", fontSize:13, fontWeight:500, transition:"all 0.2s", background:tab===t.id?"#1e40af":"transparent", color:tab===t.id?"#93c5fd":"#64748b", boxShadow:tab===t.id?"0 0 12px #3b82f630":"none" }}>
                <t.icon size={15} />{t.label}
              </button>
            ))}
          </nav>
          <span style={{ fontSize:11, color:"#4ade80", background:"#052e16", border:"1px solid #16a34a", padding:"4px 10px", borderRadius:20, display:"flex", alignItems:"center", gap:5 }}>
            <Wifi size={11} /> Supabase connected
          </span>
        </div>
      </header>

      <main style={{ maxWidth:1280, margin:"0 auto", padding:"28px 24px" }}>

        {/* ── DASHBOARD ── */}
        {tab === "dashboard" && (
          <div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:28 }}>
              {[
                { label:"Total Customers",      value:entries.length,   icon:Users,        accent:"#3b82f6", bg:"#0f2447" },
                { label:"Vehicles in Workshop", value:inWorkshop,       icon:Car,          accent:"#a855f7", bg:"#1a0f33" },
                { label:"Revenue Today",        value:fmt(totalRevenue),icon:IndianRupee,  accent:"#10b981", bg:"#042f1e" },
                { label:"Pending Bookings",     value:pending,          icon:CalendarClock,accent:"#f59e0b", bg:"#2d1b00" },
              ].map((kpi,i) => (
                <div key={i} style={{ background:kpi.bg, border:`1px solid ${kpi.accent}30`, borderRadius:14, padding:"20px 22px", position:"relative", overflow:"hidden" }}>
                  <div style={{ position:"absolute", right:-10, top:-10, width:70, height:70, borderRadius:"50%", background:`${kpi.accent}15` }} />
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                    <div>
                      <div style={{ fontSize:11, color:"#64748b", fontWeight:600, letterSpacing:0.8, marginBottom:8, textTransform:"uppercase" }}>{kpi.label}</div>
                      <div style={{ fontSize:28, fontWeight:800, color:"#f1f5f9", letterSpacing:-0.5 }}>{kpi.value}</div>
                    </div>
                    <div style={{ width:40, height:40, borderRadius:10, background:`${kpi.accent}20`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <kpi.icon size={20} color={kpi.accent} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display:"flex", gap:10, marginBottom:20 }}>
              <button onClick={() => setShowForm(f => !f)} style={{ display:"flex", alignItems:"center", gap:8, background:"linear-gradient(135deg,#1d4ed8,#3b82f6)", color:"white", border:"none", borderRadius:10, padding:"11px 22px", fontWeight:600, fontSize:14, cursor:"pointer" }}>
                <Plus size={18} />{showForm ? "Hide Form" : "Register New Customer & Vehicle"}
              </button>
              <button onClick={loadEntries} style={{ display:"flex", alignItems:"center", gap:6, background:"#0d1b2e", border:"1px solid #1e3a5f", color:"#64748b", borderRadius:10, padding:"11px 14px", cursor:"pointer", fontSize:13 }}>
                <RefreshCw size={14} style={{ animation:loading?"spin 1s linear infinite":"none" }} /> Refresh
              </button>
            </div>

            {showForm && (
              <div style={{ background:"#0d1b2e", border:"1px solid #1e3a5f", borderRadius:16, padding:28, marginBottom:28 }}>
                <div style={{ fontSize:16, fontWeight:700, color:"#93c5fd", marginBottom:24, display:"flex", alignItems:"center", gap:8 }}>
                  <ClipboardList size={18} /> New Customer & Vehicle Intake
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16, marginBottom:20 }}>
                  {[
                    { key:"name",  label:"Full Name *",    placeholder:"e.g. Rajan Mehta", icon:Users },
                    { key:"phone", label:"Phone Number *", placeholder:"10-digit mobile",  icon:Phone },
                    { key:"email", label:"Email",          placeholder:"optional",         icon:Mail  },
                  ].map(f => (
                    <div key={f.key}>
                      <label style={{ display:"block", fontSize:12, color:"#64748b", marginBottom:6, fontWeight:600, textTransform:"uppercase", letterSpacing:0.5 }}>{f.label}</label>
                      <div style={{ position:"relative" }}>
                        <f.icon size={14} color="#475569" style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)" }} />
                        <input value={form[f.key]} onChange={e => setForm(p => ({...p,[f.key]:e.target.value}))} placeholder={f.placeholder}
                          style={{ width:"100%", background:"#0b1120", border:`1px solid ${errors[f.key]?"#ef4444":"#1e2d4a"}`, borderRadius:8, padding:"10px 12px 10px 32px", color:"#e2e8f0", fontSize:14, outline:"none", boxSizing:"border-box" }} />
                      </div>
                      {errors[f.key] && <div style={{ fontSize:11, color:"#f87171", marginTop:3 }}>{errors[f.key]}</div>}
                    </div>
                  ))}
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:16, marginBottom:20 }}>
                  <div>
                    <label style={{ display:"block", fontSize:12, color:"#64748b", marginBottom:6, fontWeight:600, textTransform:"uppercase", letterSpacing:0.5 }}>Car Model *</label>
                    <div style={{ position:"relative" }}>
                      <Car size={14} color="#475569" style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }} />
                      <select value={form.carModel} onChange={e => setForm(p => ({...p,carModel:e.target.value}))}
                        style={{ width:"100%", background:"#0b1120", border:`1px solid ${errors.carModel?"#ef4444":"#1e2d4a"}`, borderRadius:8, padding:"10px 12px 10px 32px", color:form.carModel?"#e2e8f0":"#475569", fontSize:14, outline:"none", appearance:"none", cursor:"pointer" }}>
                        <option value="">Select car model</option>
                        {CAR_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    {errors.carModel && <div style={{ fontSize:11, color:"#f87171", marginTop:3 }}>{errors.carModel}</div>}
                  </div>
                  <div>
                    <label style={{ display:"block", fontSize:12, color:"#64748b", marginBottom:6, fontWeight:600, textTransform:"uppercase", letterSpacing:0.5 }}>License Plate *</label>
                    <div style={{ position:"relative" }}>
                      <Tag size={14} color="#475569" style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)" }} />
                      <input value={form.plate} onChange={e => setForm(p => ({...p,plate:e.target.value.toUpperCase()}))} placeholder="e.g. KA01AB1234"
                        style={{ width:"100%", background:"#0b1120", border:`1px solid ${errors.plate?"#ef4444":"#1e2d4a"}`, borderRadius:8, padding:"10px 12px 10px 32px", color:"#e2e8f0", fontSize:14, outline:"none", boxSizing:"border-box", letterSpacing:1 }} />
                    </div>
                    {errors.plate && <div style={{ fontSize:11, color:"#f87171", marginTop:3 }}>{errors.plate}</div>}
                  </div>
                  <div>
                    <label style={{ display:"block", fontSize:12, color:"#64748b", marginBottom:6, fontWeight:600, textTransform:"uppercase", letterSpacing:0.5 }}>Car Colour</label>
                    <div style={{ position:"relative" }}>
                      <Palette size={14} color="#475569" style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)" }} />
                      <input value={form.color} onChange={e => setForm(p => ({...p,color:e.target.value}))} placeholder="e.g. Pearl White"
                        style={{ width:"100%", background:"#0b1120", border:"1px solid #1e2d4a", borderRadius:8, padding:"10px 12px 10px 32px", color:"#e2e8f0", fontSize:14, outline:"none", boxSizing:"border-box" }} />
                    </div>
                  </div>
                  {/* Payment Mode */}
                  <div>
                    <label style={{ display:"block", fontSize:12, color:"#64748b", marginBottom:6, fontWeight:600, textTransform:"uppercase", letterSpacing:0.5 }}>Payment Mode *</label>
                    <div style={{ display:"flex", gap:8 }}>
                      {["Cash","GPay"].map(pm => (
                        <button key={pm} type="button" onClick={() => setForm(p => ({...p, payment: pm}))}
                          style={{ flex:1, padding:"10px", borderRadius:8, border:`1px solid ${form.payment===pm?(pm==="Cash"?"#16a34a":"#7c3aed"):"#1e2d4a"}`, background:form.payment===pm?(pm==="Cash"?"#052e16":"#2e1065"):"#0b1120", color:form.payment===pm?(pm==="Cash"?"#4ade80":"#a78bfa"):"#475569", fontWeight:700, fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                          {pm === "Cash" ? "💵" : "📱"} {pm}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom:20 }}>
                  <label style={{ display:"block", fontSize:12, color:"#64748b", marginBottom:10, fontWeight:600, textTransform:"uppercase", letterSpacing:0.5 }}>
                    Services * {errors.services && <span style={{ color:"#f87171", marginLeft:8 }}>{errors.services}</span>}
                  </label>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
                    {SERVICES.map(sv => {
                      const sel = form.services.includes(sv.id);
                      return (
                        <div key={sv.id} onClick={() => toggleService(sv.id)}
                          style={{ background:sel?"#172554":"#0b1120", border:`1px solid ${sel?"#3b82f6":"#1e2d4a"}`, borderRadius:10, padding:"12px 14px", cursor:"pointer", transition:"all 0.15s" }}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                            <sv.icon size={14} color={sel?"#60a5fa":"#475569"} />
                            {sel && <Check size={13} color="#3b82f6" />}
                          </div>
                          <div style={{ fontSize:12, fontWeight:600, color:sel?"#93c5fd":"#94a3b8", marginBottom:2 }}>{sv.label}</div>
                          <div style={{ fontSize:13, fontWeight:700, color:sel?"#60a5fa":"#475569" }}>{fmt(sv.price)}</div>
                        </div>
                      );
                    })}
                  </div>
                  {form.services.length > 0 && (
                    <div style={{ marginTop:12, background:"#0a1628", border:"1px solid #1e3a5f", borderRadius:8, padding:"10px 16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <span style={{ fontSize:13, color:"#64748b" }}>Selected {form.services.length} service{form.services.length>1?"s":""}</span>
                      <span style={{ fontSize:16, fontWeight:800, color:"#34d399" }}>Total: {fmt(calc(form.services))}</span>
                    </div>
                  )}
                </div>

                <div style={{ display:"flex", alignItems:"center", gap:16 }}>
                  <div style={{ flex:1 }}>
                    <label style={{ display:"block", fontSize:12, color:"#64748b", marginBottom:6, fontWeight:600, textTransform:"uppercase", letterSpacing:0.5 }}>Initial Status</label>
                    <select value={form.status} onChange={e => setForm(p => ({...p,status:e.target.value}))}
                      style={{ background:"#0b1120", border:"1px solid #1e2d4a", borderRadius:8, padding:"10px 16px", color:"#e2e8f0", fontSize:14, outline:"none", cursor:"pointer", width:"100%" }}>
                      {Object.keys(STATUS_META).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div style={{ flex:3 }}>
                    <div style={{ height:34 }} />
                    <button onClick={handleSubmit} disabled={saving}
                      style={{ width:"100%", background:saving?"#1e3a8a":"linear-gradient(135deg,#1d4ed8,#3b82f6)", color:"white", border:"none", borderRadius:8, padding:"11px 24px", fontWeight:700, fontSize:14, cursor:saving?"wait":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                      {saving ? <><RefreshCw size={15} style={{ animation:"spin 1s linear infinite" }}/> Saving…</> : "✅ Register Customer, Vehicle & Service"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* All entries table */}
            <div style={{ background:"#0d1b2e", border:"1px solid #1e3a5f", borderRadius:16, overflow:"hidden" }}>
              <div style={{ padding:"18px 24px", borderBottom:"1px solid #1e2d4a", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div style={{ fontSize:15, fontWeight:700, color:"#93c5fd", display:"flex", alignItems:"center", gap:8 }}>
                  <ClipboardList size={17} /> All Entries ({entries.length})
                </div>
                {loading && <div style={{ fontSize:12, color:"#475569", display:"flex", alignItems:"center", gap:6 }}><RefreshCw size={13} style={{ animation:"spin 1s linear infinite" }}/> Loading…</div>}
                {dbError && <div style={{ fontSize:12, color:"#f87171", display:"flex", alignItems:"center", gap:6 }}><AlertCircle size={13}/> {dbError}</div>}
              </div>
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                  <thead>
                    <tr style={{ background:"#0b1631" }}>
                      {["Customer","Phone","Car Model","Plate","Services","Total Bill","Payment","Status",""].map(h => (
                        <th key={h} style={{ padding:"12px 16px", textAlign:"left", color:"#475569", fontWeight:600, fontSize:11, letterSpacing:0.6, textTransform:"uppercase", borderBottom:"1px solid #1e2d4a" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry, i) => {
                      const meta = STATUS_META[entry.status] || STATUS_META.Queued;
                      return (
                        <tr key={entry.id} style={{ borderBottom:"1px solid #0f1e3a", background:i%2===0?"transparent":"#090f1c" }}>
                          <td style={{ padding:"14px 16px" }}>
                            <div style={{ fontWeight:600, color:"#e2e8f0" }}>{entry.name}</div>
                            {entry.email && <div style={{ color:"#475569", fontSize:11, marginTop:1 }}>{entry.email}</div>}
                          </td>
                          <td style={{ padding:"14px 16px", color:"#94a3b8" }}>{entry.phone}</td>
                          <td style={{ padding:"14px 16px" }}>
                            <div style={{ color:"#e2e8f0", fontWeight:500 }}>{entry.carModel}</div>
                            {entry.color && <div style={{ color:"#475569", fontSize:11 }}>{entry.color}</div>}
                          </td>
                          <td style={{ padding:"14px 16px" }}>
                            <span style={{ background:"#0b1120", border:"1px solid #1e2d4a", borderRadius:6, padding:"3px 8px", color:"#94a3b8", fontFamily:"monospace", fontSize:12, letterSpacing:0.8 }}>{entry.plate}</span>
                          </td>
                          <td style={{ padding:"14px 16px", maxWidth:180 }}>
                            <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                              {entry.services.map(sid => {
                                const sv = SERVICES.find(s => s.id === sid);
                                return sv ? <span key={sid} style={{ background:"#0f2447", color:"#60a5fa", border:"1px solid #1e3a5f", borderRadius:5, padding:"2px 7px", fontSize:11, fontWeight:500 }}>{sv.label}</span> : null;
                              })}
                            </div>
                          </td>
                          <td style={{ padding:"14px 16px", fontWeight:700, color:"#34d399", fontSize:14 }}>{fmt(entry.bill)}</td>
                          <td style={{ padding:"14px 16px" }}>
                            <span style={{ padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700, background:entry.payment==="Cash"?"#052e16":"#2e1065", color:entry.payment==="Cash"?"#4ade80":"#a78bfa", border:`1px solid ${entry.payment==="Cash"?"#16a34a":"#7c3aed"}` }}>
                              {entry.payment === "Cash" ? "💵 Cash" : "📱 GPay"}
                            </span>
                          </td>
                          <td style={{ padding:"14px 16px" }}>
                            <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700 }} className={meta.color}>
                              <span style={{ width:6, height:6, borderRadius:"50%", display:"inline-block" }} className={meta.dot} />
                              <select value={entry.status} onChange={e => updateStatus(entry.id, e.target.value)}
                                style={{ background:"transparent", border:"none", outline:"none", cursor:"pointer", fontSize:11, fontWeight:700, color:"inherit" }}>
                                {Object.keys(STATUS_META).map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                            </span>
                          </td>
                          <td style={{ padding:"14px 16px" }}>
                            <button onClick={() => deleteEntry(entry.id)}
                              style={{ background:"transparent", border:"1px solid #1e2d4a", borderRadius:6, padding:"5px 8px", cursor:"pointer", color:"#475569", display:"flex", alignItems:"center" }}>
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {!loading && entries.length === 0 && (
                      <tr><td colSpan={9} style={{ padding:40, textAlign:"center", color:"#334155" }}>No entries yet. Register your first customer above.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── DAILY REPORT ── */}
        {tab === "report" && (
          <div>
            <div style={{ marginBottom:24, display:"flex", justifyContent:"space-between", alignItems:"flex-end", flexWrap:"wrap", gap:12 }}>
              <div>
                <div style={{ fontSize:22, fontWeight:800, color:"#f1f5f9", marginBottom:4 }}>📊 Daily Report</div>
                <div style={{ fontSize:14, color:"#475569" }}>All jobs completed on a selected date.</div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <input type="date" value={reportDate} onChange={e => setReportDate(e.target.value)}
                  style={{ background:"#0d1b2e", border:"1px solid #1e3a5f", borderRadius:8, padding:"9px 14px", color:"#e2e8f0", fontSize:13, outline:"none", cursor:"pointer" }} />
                <button onClick={printReport}
                  style={{ display:"flex", alignItems:"center", gap:7, background:"linear-gradient(135deg,#1d4ed8,#3b82f6)", color:"white", border:"none", borderRadius:8, padding:"10px 18px", fontWeight:600, fontSize:13, cursor:"pointer" }}>
                  <Printer size={15} /> Print / Save PDF
                </button>
              </div>
            </div>

            {/* Summary cards */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:24 }}>
              {[
                { label:"Total Jobs",    value:reportEntries.length,  accent:"#3b82f6", bg:"#0f2447", prefix:"" },
                { label:"Total Revenue", value:fmt(reportTotal),      accent:"#10b981", bg:"#042f1e", prefix:"" },
                { label:"💵 Cash",        value:fmt(cashTotal),        accent:"#16a34a", bg:"#052e16", prefix:"" },
                { label:"📱 GPay",        value:fmt(gpayTotal),        accent:"#7c3aed", bg:"#2e1065", prefix:"" },
              ].map((k,i) => (
                <div key={i} style={{ background:k.bg, border:`1px solid ${k.accent}40`, borderRadius:12, padding:"16px 20px" }}>
                  <div style={{ fontSize:11, color:"#64748b", fontWeight:600, textTransform:"uppercase", letterSpacing:0.8, marginBottom:6 }}>{k.label}</div>
                  <div style={{ fontSize:24, fontWeight:800, color:"#f1f5f9" }}>{k.value}</div>
                </div>
              ))}
            </div>

            {/* Report table */}
            <div style={{ background:"#0d1b2e", border:"1px solid #1e3a5f", borderRadius:16, overflow:"hidden" }}>
              <div style={{ padding:"16px 22px", borderBottom:"1px solid #1e2d4a", display:"flex", alignItems:"center", gap:8 }}>
                <FileText size={16} color="#93c5fd" />
                <span style={{ fontSize:14, fontWeight:700, color:"#93c5fd" }}>
                  {reportEntries.length} job{reportEntries.length !== 1 ? "s" : ""} on {displayDate(reportDate)}
                </span>
              </div>
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                  <thead>
                    <tr style={{ background:"#0b1631" }}>
                      {["No.","Car Make / Model","Vehicle Number","Contact Number","Service Type","Price","Payment"].map(h => (
                        <th key={h} style={{ padding:"12px 16px", textAlign:"left", color:"#475569", fontWeight:600, fontSize:11, letterSpacing:0.6, textTransform:"uppercase", borderBottom:"1px solid #1e2d4a" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reportEntries.map((entry, i) => (
                      <tr key={entry.id} style={{ borderBottom:"1px solid #0f1e3a", background:i%2===0?"transparent":"#090f1c" }}>
                        <td style={{ padding:"14px 16px", color:"#64748b", fontWeight:600 }}>{i + 1}</td>
                        <td style={{ padding:"14px 16px" }}>
                          <div style={{ fontWeight:600, color:"#e2e8f0" }}>{entry.carModel}</div>
                          <div style={{ color:"#475569", fontSize:11 }}>{entry.name}</div>
                        </td>
                        <td style={{ padding:"14px 16px" }}>
                          <span style={{ background:"#0b1120", border:"1px solid #1e2d4a", borderRadius:6, padding:"3px 8px", color:"#94a3b8", fontFamily:"monospace", fontSize:12, letterSpacing:0.8 }}>{entry.plate}</span>
                        </td>
                        <td style={{ padding:"14px 16px", color:"#94a3b8" }}>{entry.phone}</td>
                        <td style={{ padding:"14px 16px", maxWidth:200 }}>
                          <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                            {entry.services.map(sid => {
                              const sv = SERVICES.find(s => s.id === sid);
                              return sv ? <span key={sid} style={{ background:"#0f2447", color:"#60a5fa", border:"1px solid #1e3a5f", borderRadius:5, padding:"2px 7px", fontSize:11, fontWeight:500 }}>{sv.label}</span> : null;
                            })}
                          </div>
                        </td>
                        <td style={{ padding:"14px 16px", fontWeight:700, color:"#34d399", fontSize:14 }}>{fmt(entry.bill)}</td>
                        <td style={{ padding:"14px 16px" }}>
                          <span style={{ padding:"4px 12px", borderRadius:20, fontSize:12, fontWeight:700, background:entry.payment==="Cash"?"#052e16":"#2e1065", color:entry.payment==="Cash"?"#4ade80":"#a78bfa", border:`1px solid ${entry.payment==="Cash"?"#16a34a":"#7c3aed"}` }}>
                            {entry.payment === "Cash" ? "💵 Cash" : "📱 GPay"}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {reportEntries.length === 0 && (
                      <tr><td colSpan={7} style={{ padding:40, textAlign:"center", color:"#334155" }}>No jobs recorded for {displayDate(reportDate)}.</td></tr>
                    )}
                  </tbody>
                  {reportEntries.length > 0 && (
                    <tfoot>
                      <tr style={{ background:"#0b1631", borderTop:"2px solid #1e3a5f" }}>
                        <td colSpan={5} style={{ padding:"14px 16px", fontWeight:700, color:"#64748b", fontSize:13 }}>TOTAL ({reportEntries.length} jobs)</td>
                        <td style={{ padding:"14px 16px", fontWeight:800, color:"#34d399", fontSize:16 }}>{fmt(reportTotal)}</td>
                        <td style={{ padding:"14px 16px", fontSize:12, color:"#64748b" }}>
                          <div>💵 {fmt(cashTotal)}</div>
                          <div>📱 {fmt(gpayTotal)}</div>
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── PROMOTIONS ── */}
        {tab === "promos" && (
          <div>
            <div style={{ marginBottom:24 }}>
              <div style={{ fontSize:22, fontWeight:800, color:"#f1f5f9", marginBottom:4 }}>📣 Promotions & WhatsApp Campaigns</div>
              <div style={{ fontSize:14, color:"#475569" }}>Copy ready-made campaign messages and send via WhatsApp Business in seconds.</div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:20 }}>
              {PROMOS.map((p, i) => (
                <div key={i} style={{ background:"#0d1b2e", border:"1px solid #1e3a5f", borderRadius:16, overflow:"hidden" }}>
                  <div style={{ padding:"16px 20px", borderBottom:"1px solid #1e2d4a", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div style={{ fontWeight:700, color:"#e2e8f0", fontSize:15 }}>{p.title}</div>
                    <span style={{ fontSize:10, fontWeight:700, padding:"3px 9px", borderRadius:20, color:"white" }} className={p.tagColor}>{p.tag}</span>
                  </div>
                  <div style={{ padding:"16px 20px" }}>
                    <pre style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"#94a3b8", whiteSpace:"pre-wrap", lineHeight:1.7, margin:0, minHeight:160 }}>{p.msg}</pre>
                  </div>
                  <div style={{ padding:"0 20px 18px" }}>
                    <button onClick={() => copyPromo(i, p.msg)}
                      style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:8, background:copied===i?"#052e16":"#172554", border:`1px solid ${copied===i?"#16a34a":"#3b82f6"}`, borderRadius:8, padding:"10px", fontWeight:600, fontSize:13, cursor:"pointer", color:copied===i?"#4ade80":"#60a5fa", transition:"all 0.2s" }}>
                      {copied===i ? <><Check size={15}/> Copied!</> : <><Copy size={15}/> Copy Campaign Message</>}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── APPOINTMENTS ── */}
        {tab === "appointments" && (
          <div>
            <div style={{ marginBottom:24 }}>
              <div style={{ fontSize:22, fontWeight:800, color:"#f1f5f9", marginBottom:4 }}>📅 Appointment Scheduler</div>
              <div style={{ fontSize:14, color:"#475569" }}>Upcoming customer slots at MSP Studio.</div>
            </div>
            {["Today","Tomorrow"].map(day => (
              <div key={day} style={{ marginBottom:28 }}>
                <div style={{ fontSize:12, fontWeight:700, color:"#3b82f6", letterSpacing:1.2, textTransform:"uppercase", marginBottom:12 }}>{day}</div>
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {SAMPLE_APPOINTMENTS.filter(a => a.date === day).map(apt => (
                    <div key={apt.id} style={{ background:"#0d1b2e", border:"1px solid #1e3a5f", borderRadius:12, padding:"16px 20px", display:"flex", alignItems:"center", gap:20 }}>
                      <div style={{ width:52, height:52, borderRadius:12, background:"#0f2447", border:"1px solid #1e3a5f", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
                        <div style={{ fontSize:13, fontWeight:800, color:"#60a5fa" }}>{apt.time.split(" ")[0]}</div>
                        <div style={{ fontSize:10, color:"#475569" }}>{apt.time.split(" ")[1]}</div>
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:700, color:"#e2e8f0", fontSize:15 }}>{apt.name}</div>
                        <div style={{ color:"#64748b", fontSize:13, marginTop:2 }}>{apt.car} · <span style={{ fontFamily:"monospace" }}>{apt.plate}</span></div>
                      </div>
                      <span style={{ background:"#0f2447", color:"#60a5fa", border:"1px solid #1e3a5f", borderRadius:8, padding:"5px 12px", fontSize:12, fontWeight:600 }}>{apt.service}</span>
                      <div style={{ display:"flex", gap:8 }}>
                        <button style={{ background:"#052e16", border:"1px solid #16a34a", borderRadius:8, padding:"6px 14px", color:"#4ade80", fontSize:12, fontWeight:600, cursor:"pointer" }}>Confirm</button>
                        <button style={{ background:"#1c0a0a", border:"1px solid #7f1d1d", borderRadius:8, padding:"6px 14px", color:"#f87171", fontSize:12, fontWeight:600, cursor:"pointer" }}>Cancel</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
