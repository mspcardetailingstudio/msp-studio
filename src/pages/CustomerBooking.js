import { useState } from "react";
import { Car, Phone, Mail, Tag, CalendarDays, CheckCircle, ArrowLeft, MapPin, Navigation } from "lucide-react";
import { sb, CAR_MODELS, SERVICES, MSP_WHATSAPP, MSP_EMAIL, fmt } from "../config";

const emptyForm = {
  name:"", phone:"", email:"",
  carModel:"", plate:"", color:"",
  date:"", time:"", services:[], notes:"",
  pickup: false,
  pickupAddress:"", pickupMapsLink:"", distanceKm:"",
};

// Pickup pricing logic
const pickupCost = (km, promoActive) => {
  if (promoActive && km <= 5) return 0;
  const d = parseFloat(km);
  if (!d || d <= 0) return 0;
  if (d <= 2)  return 0;
  if (d <= 4)  return 149;
  return Math.round(d * 15);
};

const pickupLabel = (km, promoActive) => {
  if (!km || parseFloat(km) <= 0) return null;
  const cost = pickupCost(km, promoActive);
  const d    = parseFloat(km);
  if (promoActive && d <= 5) return { text:"🎉 FREE (Promo Applied!)", color:"#4ade80" };
  if (d <= 2)  return { text:"FREE — within 2 km", color:"#4ade80" };
  if (d <= 4)  return { text:`₹149 — Pickup & Drop (2–4 km)`, color:"#fbbf24" };
  return { text:`₹${cost} — ₹15 × ${d} km`, color:"#f87171" };
};

export default function CustomerBooking({ onBack, promoActive, promoEndDate }) {
  const [page,   setPage]   = useState("cover"); // "cover" | "form"
  const [form,   setForm]   = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [done,   setDone]   = useState(null);
  const [search, setSearch] = useState("");

  const filtered = CAR_MODELS.filter(m => m.toLowerCase().includes(search.toLowerCase()));
  const pickup   = pickupCost(form.distanceKm, promoActive);
  const svcTotal = form.services.reduce((s,id)=>s+(SERVICES.find(sv=>sv.id===id)?.defaultPrice||0),0);
  const grandTotal = svcTotal + (form.pickup ? pickup : 0);
  const pickInfo = form.pickup ? pickupLabel(form.distanceKm, promoActive) : null;

  const validate = () => {
    const e={};
    if (!form.name.trim())             e.name="Required";
    if (!form.phone.match(/^\d{10}$/)) e.phone="10-digit number";
    if (!form.carModel)                e.carModel="Select car model";
    if (!form.plate.trim())            e.plate="Required";
    if (!form.date)                    e.date="Pick a date";
    if (!form.time)                    e.time="Pick a time";
    if (!form.services.length)         e.services="Select at least one service";
    if (form.pickup && !form.pickupAddress.trim()) e.pickupAddress="Enter pickup address";
    if (form.pickup && (!form.distanceKm || parseFloat(form.distanceKm)<=0)) e.distanceKm="Enter distance in km";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const toggleSvc = (id) => setForm(f=>({...f, services:f.services.includes(id)?f.services.filter(s=>s!==id):[...f.services,id]}));

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await sb("appointments",{ method:"POST", body:JSON.stringify({
        customer_name:  form.name,
        phone:          form.phone,
        email:          form.email||null,
        car_model:      form.carModel,
        plate:          form.plate,
        color:          form.color||null,
        appt_date:      form.date,
        appt_time:      form.time,
        services:       form.services,
        estimated_bill: grandTotal,
        notes:          form.notes||null,
        pickup_requested: form.pickup,
        pickup_address: form.pickup ? form.pickupAddress : null,
        pickup_maps_link: form.pickup && form.pickupMapsLink ? form.pickupMapsLink : null,
        pickup_distance_km: form.pickup ? parseFloat(form.distanceKm)||0 : null,
        pickup_charge:  form.pickup ? pickup : 0,
        status:"Pending",
      })});

      const svcNames = form.services.map(id=>SERVICES.find(s=>s.id===id)?.label).join(", ");
      const waText = encodeURIComponent(
        `🚗 *New Booking at MSP Studio!*\n\n👤 Name: ${form.name}\n📞 Phone: ${form.phone}\n🚘 Car: ${form.carModel} (${form.plate})\n🛠️ Services: ${svcNames}\n💰 Services: ${fmt(svcTotal)}\n${form.pickup?`🚐 Pickup: ${form.pickupAddress} (${form.distanceKm} km) — ${pickInfo?.text}\n${form.pickupMapsLink?"📍 Maps: "+form.pickupMapsLink+"\n":""}💰 Grand Total: ${fmt(grandTotal)}\n`:""}\n📅 Date: ${form.date} at ${form.time}\n📝 Notes: ${form.notes||"—"}\n\n_Please confirm this appointment._`
      );
      const emailSub  = encodeURIComponent(`New Booking: ${form.name} — ${form.date}`);
      const emailBody = encodeURIComponent(`New appointment at MSP Studio:\n\nName: ${form.name}\nPhone: ${form.phone}\nCar: ${form.carModel} (${form.plate})\nServices: ${svcNames}\nDate: ${form.date} at ${form.time}${form.pickup?`\nPickup: ${form.pickupAddress} (${form.distanceKm}km) — ${pickup===0?"FREE":fmt(pickup)}`:""}\nTotal: ${fmt(grandTotal)}\nNotes: ${form.notes||"—"}`);
      setDone({ waLink:`https://wa.me/${MSP_WHATSAPP}?text=${waText}`, mailLink:`mailto:${MSP_EMAIL}?subject=${emailSub}&body=${emailBody}`, name:form.name, date:form.date, time:form.time });
      setForm(emptyForm);
    } catch(e) { alert("Booking failed: "+e.message); }
    finally { setSaving(false); }
  };

  const inp = (ex={}) => ({ background:"#0b1120", border:"1px solid #1e2d4a", borderRadius:8, padding:"10px 14px", color:"#e2e8f0", fontSize:14, outline:"none", width:"100%", boxSizing:"border-box", ...ex });
  const lbl = { display:"block", fontSize:11, color:"#64748b", fontWeight:600, letterSpacing:0.8, textTransform:"uppercase", marginBottom:6 };

  // ── SUCCESS ──
  if (done) return (
    <div style={{ minHeight:"100vh", background:"#0b1120", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'DM Sans','Segoe UI',sans-serif", padding:24 }}>
      <div style={{ maxWidth:500, width:"100%", textAlign:"center" }}>
        <div style={{ width:70, height:70, borderRadius:"50%", background:"#052e16", border:"2px solid #16a34a", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px" }}>
          <CheckCircle size={36} color="#4ade80"/>
        </div>
        <div style={{ fontSize:22, fontWeight:800, color:"#f1f5f9", marginBottom:8 }}>Booking Confirmed! 🎉</div>
        <div style={{ fontSize:14, color:"#64748b", marginBottom:28, lineHeight:1.7 }}>
          Thank you, <strong style={{ color:"#93c5fd" }}>{done.name}</strong>! Your appointment for <strong style={{ color:"#93c5fd" }}>{done.date} at {done.time}</strong> has been received.
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:24 }}>
          <a href={done.waLink} target="_blank" rel="noreferrer" style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10, background:"#052e16", border:"1px solid #16a34a", borderRadius:10, padding:"13px", color:"#4ade80", fontWeight:700, fontSize:14, textDecoration:"none" }}>
            📲 Notify MSP on WhatsApp
          </a>
          <a href={done.mailLink} style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10, background:"#0f2447", border:"1px solid #1e3a5f", borderRadius:10, padding:"13px", color:"#60a5fa", fontWeight:700, fontSize:14, textDecoration:"none" }}>
            📧 Also Send Email Notification
          </a>
        </div>
        <button onClick={()=>{ setDone(null); setPage("cover"); onBack(); }} style={{ background:"transparent", border:"1px solid #1e2d4a", borderRadius:8, padding:"10px 20px", color:"#475569", cursor:"pointer", fontSize:13 }}>← Back to Home</button>
      </div>
    </div>
  );

  // ── COVER PAGE ──
  if (page === "cover") return (
    <div style={{ minHeight:"100vh", background:"#050d1a", fontFamily:"'DM Sans','Segoe UI',sans-serif", overflow:"hidden", position:"relative" }}>
      {/* Background gradient blobs */}
      <div style={{ position:"absolute", top:-100, left:-100, width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle, #1d4ed820, transparent 70%)", pointerEvents:"none" }}/>
      <div style={{ position:"absolute", bottom:-80, right:-80, width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle, #7c3aed20, transparent 70%)", pointerEvents:"none" }}/>

      {/* Top bar */}
      <div style={{ padding:"16px 32px", display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:"1px solid #0f1e38" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:9, background:"linear-gradient(135deg,#3b82f6,#1d4ed8)", display:"flex", alignItems:"center", justifyContent:"center" }}><Car size={19} color="white"/></div>
          <div><div style={{ fontSize:15, fontWeight:800, color:"#f1f5f9" }}>MSP Studio</div><div style={{ fontSize:10, color:"#475569", letterSpacing:1 }}>MARUTHI SERVICE POINT</div></div>
        </div>
        <button onClick={onBack} style={{ background:"transparent", border:"1px solid #1e2d4a", borderRadius:7, padding:"6px 14px", color:"#475569", cursor:"pointer", fontSize:12 }}>← Back</button>
      </div>

      <div style={{ maxWidth:1100, margin:"0 auto", padding:"40px 32px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:48, alignItems:"center", minHeight:"calc(100vh - 70px)" }}>

        {/* Left — Promo poster */}
        <div style={{ position:"relative" }}>
          {/* Main promo card */}
          <div style={{ background:"linear-gradient(135deg, #0f2447 0%, #1a0f33 50%, #0f2447 100%)", border:"1px solid #1e3a5f", borderRadius:24, padding:"36px 32px", position:"relative", overflow:"hidden" }}>
            {/* Decorative circles */}
            <div style={{ position:"absolute", top:-40, right:-40, width:200, height:200, borderRadius:"50%", border:"1px solid #3b82f620" }}/>
            <div style={{ position:"absolute", top:-20, right:-20, width:120, height:120, borderRadius:"50%", border:"1px solid #3b82f630" }}/>
            <div style={{ position:"absolute", bottom:-60, left:-60, width:200, height:200, borderRadius:"50%", border:"1px solid #a855f720" }}/>

            {/* Badge */}
            <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"linear-gradient(135deg,#1d4ed8,#7c3aed)", borderRadius:20, padding:"5px 14px", marginBottom:20 }}>
              <span style={{ fontSize:11, fontWeight:800, color:"white", letterSpacing:1, textTransform:"uppercase" }}>
                {promoActive ? "🔥 Limited Time Offer" : "🚗 Pickup & Drop Service"}
              </span>
            </div>

            {promoActive ? (
              <>
                <div style={{ fontSize:52, fontWeight:900, color:"#f1f5f9", lineHeight:1, marginBottom:8 }}>
                  100<span style={{ color:"#3b82f6" }}>%</span>
                </div>
                <div style={{ fontSize:28, fontWeight:800, color:"#93c5fd", marginBottom:6 }}>OFF Pickup & Drop</div>
                <div style={{ fontSize:16, color:"#64748b", marginBottom:20 }}>Up to <strong style={{ color:"#fbbf24" }}>5 km radius</strong> — absolutely FREE!</div>
                {promoEndDate && <div style={{ background:"#1c1a08", border:"1px solid #854d0e", borderRadius:8, padding:"8px 14px", display:"inline-block", fontSize:12, color:"#fbbf24", fontWeight:600, marginBottom:20 }}>
                  ⏳ Offer valid till {new Date(promoEndDate).toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"})}
                </div>}
              </>
            ) : (
              <>
                <div style={{ fontSize:36, fontWeight:900, color:"#f1f5f9", lineHeight:1.1, marginBottom:12 }}>
                  Doorstep<br/><span style={{ color:"#3b82f6" }}>Car Care</span>
                </div>
                <div style={{ fontSize:15, color:"#64748b", marginBottom:20 }}>We pick up your car, detail it to perfection, and drop it back. Zero hassle.</div>
              </>
            )}

            {/* Pickup pricing table */}
            <div style={{ background:"#0b1120", borderRadius:12, padding:"14px 16px", marginBottom:20 }}>
              <div style={{ fontSize:11, color:"#64748b", fontWeight:700, textTransform:"uppercase", letterSpacing:0.8, marginBottom:10 }}>Pickup & Drop Charges</div>
              {[
                { range:"Within 2 km",  price: promoActive?"FREE 🎉":"FREE", color:"#4ade80" },
                { range:"2 – 4 km",     price: promoActive?"FREE 🎉":"₹149", color: promoActive?"#4ade80":"#fbbf24" },
                { range:"4 – 5 km",     price: promoActive?"FREE 🎉":"₹75", color: promoActive?"#4ade80":"#f87171" },
                { range:"Above 5 km",   price:"₹15 / km", color:"#f87171" },
              ].map((row,i)=>(
                <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom: i<3?"1px solid #0f1e3a":"none" }}>
                  <span style={{ fontSize:13, color:"#94a3b8" }}>{row.range}</span>
                  <span style={{ fontSize:13, fontWeight:700, color:row.color }}>{row.price}</span>
                </div>
              ))}
            </div>

            {/* Indian cars illustration strip */}
            <div style={{ display:"flex", gap:8, marginBottom:20, fontSize:28 }}>
              {"🚗🚙🛻🏎️🚕".split("").map((e,i)=>(
                <div key={i} style={{ width:44, height:44, borderRadius:10, background:"#0f2447", display:"flex", alignItems:"center", justifyContent:"center", border:"1px solid #1e3a5f", fontSize:22 }}>{e}</div>
              ))}
            </div>

            <div style={{ fontSize:12, color:"#334155" }}>All major car brands serviced · Insured handling · On-time guaranteed</div>
          </div>

          {/* Floating badge */}
          <div style={{ position:"absolute", top:-16, right:-16, background:"linear-gradient(135deg,#f59e0b,#d97706)", borderRadius:"50%", width:72, height:72, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 20px #f59e0b50" }}>
            <div style={{ fontSize:11, fontWeight:800, color:"white", lineHeight:1, textAlign:"center" }}>BOOK<br/>NOW</div>
          </div>
        </div>

        {/* Right — CTA */}
        <div>
          <div style={{ fontSize:13, color:"#3b82f6", fontWeight:700, textTransform:"uppercase", letterSpacing:1.2, marginBottom:16 }}>Maruthi Service Point Studio</div>
          <div style={{ fontSize:42, fontWeight:900, color:"#f1f5f9", lineHeight:1.1, marginBottom:16 }}>
            Premium<br/>Car Detailing<br/><span style={{ background:"linear-gradient(135deg,#3b82f6,#a855f7)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>at Your Door</span>
          </div>
          <div style={{ fontSize:16, color:"#475569", lineHeight:1.8, marginBottom:32 }}>
            Book your appointment in 2 minutes. Choose from expert detailing services — Foam Wash, PPF, Ceramic Coating and more. Add pickup & drop for maximum convenience.
          </div>

          {/* Service highlights */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:32 }}>
            {["🧼 Full Foam Wash","🛡️ PPF Coating","💎 Ceramic Coating","✨ Car Polishing","💡 Headlight Buffing","🎨 Paint Work"].map((s,i)=>(
              <div key={i} style={{ background:"#0d1b2e", border:"1px solid #1e3a5f", borderRadius:8, padding:"9px 12px", fontSize:13, color:"#94a3b8", display:"flex", alignItems:"center", gap:8 }}>
                {s}
              </div>
            ))}
          </div>

          <button onClick={()=>setPage("form")}
            style={{ width:"100%", background:"linear-gradient(135deg,#1d4ed8,#3b82f6)", color:"white", border:"none", borderRadius:12, padding:"16px 24px", fontWeight:800, fontSize:17, cursor:"pointer", boxShadow:"0 8px 32px #3b82f650", display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}>
            📅 Book Your Appointment →
          </button>
          <div style={{ fontSize:12, color:"#334155", textAlign:"center", marginTop:10 }}>No signup required · Instant confirmation</div>
        </div>
      </div>
    </div>
  );

  // ── BOOKING FORM ──
  return (
    <div style={{ minHeight:"100vh", background:"#0b1120", fontFamily:"'DM Sans','Segoe UI',sans-serif" }}>
      <header style={{ background:"linear-gradient(135deg,#0f1e3a,#0b1120)", borderBottom:"1px solid #1e2d4a", padding:"0 24px" }}>
        <div style={{ maxWidth:760, margin:"0 auto", height:60, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:32, height:32, borderRadius:8, background:"linear-gradient(135deg,#3b82f6,#1d4ed8)", display:"flex", alignItems:"center", justifyContent:"center" }}><Car size={17} color="white"/></div>
            <div><div style={{ fontSize:14, fontWeight:700, color:"#f1f5f9" }}>Book Appointment</div><div style={{ fontSize:10, color:"#475569" }}>Maruthi Service Point</div></div>
          </div>
          <button onClick={()=>setPage("cover")} style={{ background:"transparent", border:"1px solid #1e2d4a", borderRadius:7, padding:"6px 12px", color:"#475569", cursor:"pointer", fontSize:12, display:"flex", alignItems:"center", gap:5 }}>
            <ArrowLeft size={13}/> Back
          </button>
        </div>
      </header>

      <div style={{ maxWidth:760, margin:"0 auto", padding:"28px 24px" }}>
        <div style={{ background:"#0d1b2e", border:"1px solid #1e3a5f", borderRadius:16, padding:28 }}>
          <div style={{ fontSize:17, fontWeight:700, color:"#93c5fd", marginBottom:24, display:"flex", alignItems:"center", gap:8 }}>
            <CalendarDays size={19}/> Schedule Your Detailing
          </div>

          {/* Customer */}
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:11, color:"#3b82f6", fontWeight:700, textTransform:"uppercase", letterSpacing:0.8, marginBottom:10 }}>Your Details</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
              <div>
                <label style={lbl}>Full Name *</label>
                <input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="Rajan Mehta" style={inp(errors.name?{borderColor:"#ef4444"}:{})}/>
                {errors.name&&<div style={{ fontSize:11,color:"#f87171",marginTop:3 }}>{errors.name}</div>}
              </div>
              <div>
                <label style={lbl}>Phone *</label>
                <input value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))} placeholder="10-digit mobile" style={inp(errors.phone?{borderColor:"#ef4444"}:{})}/>
                {errors.phone&&<div style={{ fontSize:11,color:"#f87171",marginTop:3 }}>{errors.phone}</div>}
              </div>
              <div style={{ gridColumn:"1/-1" }}>
                <label style={lbl}>Email (optional)</label>
                <input value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} placeholder="your@email.com" style={inp()}/>
              </div>
            </div>
          </div>

          {/* Car */}
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:11, color:"#3b82f6", fontWeight:700, textTransform:"uppercase", letterSpacing:0.8, marginBottom:10 }}>Vehicle Details</div>
            <div style={{ marginBottom:12 }}>
              <label style={lbl}>Car Model * — search</label>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Type e.g. Swift, Creta, Nexon…" style={inp({ marginBottom:6, borderColor:errors.carModel?"#ef4444":"#1e2d4a" })}/>
              <div style={{ maxHeight:150, overflowY:"auto", background:"#0b1120", border:"1px solid #1e2d4a", borderRadius:8 }}>
                {filtered.slice(0,50).map(m=>(
                  <div key={m} onClick={()=>{ setForm(p=>({...p,carModel:m})); setSearch(m); }}
                    style={{ padding:"8px 12px", cursor:"pointer", fontSize:13, color:form.carModel===m?"#93c5fd":"#94a3b8", background:form.carModel===m?"#172554":"transparent", borderBottom:"1px solid #0f1e3a" }}>{m}</div>
                ))}
              </div>
              {errors.carModel&&<div style={{ fontSize:11,color:"#f87171",marginTop:3 }}>{errors.carModel}</div>}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
              <div>
                <label style={lbl}>License Plate *</label>
                <input value={form.plate} onChange={e=>setForm(p=>({...p,plate:e.target.value.toUpperCase()}))} placeholder="KA01AB1234" style={inp(errors.plate?{borderColor:"#ef4444",letterSpacing:1}:{letterSpacing:1})}/>
                {errors.plate&&<div style={{ fontSize:11,color:"#f87171",marginTop:3 }}>{errors.plate}</div>}
              </div>
              <div>
                <label style={lbl}>Car Colour</label>
                <input value={form.color} onChange={e=>setForm(p=>({...p,color:e.target.value}))} placeholder="Pearl White" style={inp()}/>
              </div>
            </div>
          </div>

          {/* Date & Time */}
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:11, color:"#3b82f6", fontWeight:700, textTransform:"uppercase", letterSpacing:0.8, marginBottom:10 }}>Appointment Slot</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
              <div>
                <label style={lbl}>Date *</label>
                <input type="date" value={form.date} min={new Date().toISOString().split("T")[0]} onChange={e=>setForm(p=>({...p,date:e.target.value}))} style={inp(errors.date?{borderColor:"#ef4444"}:{})}/>
                {errors.date&&<div style={{ fontSize:11,color:"#f87171",marginTop:3 }}>{errors.date}</div>}
              </div>
              <div>
                <label style={lbl}>Time *</label>
                <select value={form.time} onChange={e=>setForm(p=>({...p,time:e.target.value}))} style={inp(errors.time?{borderColor:"#ef4444",cursor:"pointer"}:{cursor:"pointer"})}>
                  <option value="">Select slot</option>
                  {["9:00 AM","9:30 AM","10:00 AM","10:30 AM","11:00 AM","11:30 AM","12:00 PM","12:30 PM","2:00 PM","2:30 PM","3:00 PM","3:30 PM","4:00 PM","4:30 PM","5:00 PM"].map(t=><option key={t}>{t}</option>)}
                </select>
                {errors.time&&<div style={{ fontSize:11,color:"#f87171",marginTop:3 }}>{errors.time}</div>}
              </div>
            </div>
          </div>

          {/* Services */}
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:11, color:"#3b82f6", fontWeight:700, textTransform:"uppercase", letterSpacing:0.8, marginBottom:10 }}>
              Services * {errors.services&&<span style={{ color:"#f87171",fontWeight:400 }}>{errors.services}</span>}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              {SERVICES.map(sv=>{
                const sel=form.services.includes(sv.id);
                return <div key={sv.id} onClick={()=>toggleSvc(sv.id)} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", background:sel?"#172554":"#0b1120", border:`1px solid ${sel?"#3b82f6":"#1e2d4a"}`, borderRadius:9, padding:"11px 14px", cursor:"pointer" }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color:sel?"#93c5fd":"#94a3b8" }}>{sv.label}</div>
                    <div style={{ fontSize:12, color:sel?"#60a5fa":"#475569", fontWeight:700 }}>{fmt(sv.defaultPrice)}</div>
                  </div>
                  <div style={{ width:20, height:20, borderRadius:"50%", border:`2px solid ${sel?"#3b82f6":"#334155"}`, background:sel?"#3b82f6":"transparent", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {sel&&<div style={{ width:8,height:8,borderRadius:"50%",background:"white" }}/>}
                  </div>
                </div>;
              })}
            </div>
          </div>

          {/* Pickup & Drop */}
          <div style={{ marginBottom:20 }}>
            <div style={{ background: form.pickup?"#0f2447":"#0b1120", border:`1px solid ${form.pickup?"#3b82f6":"#1e2d4a"}`, borderRadius:12, overflow:"hidden" }}>
              <div onClick={()=>setForm(f=>({...f,pickup:!f.pickup}))}
                style={{ padding:"14px 18px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:36, height:36, borderRadius:9, background:form.pickup?"#1d4ed8":"#0f1e3a", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <Navigation size={18} color={form.pickup?"#93c5fd":"#475569"}/>
                  </div>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, color:form.pickup?"#93c5fd":"#94a3b8" }}>Add Pickup & Drop Service</div>
                    <div style={{ fontSize:12, color:"#475569" }}>
                      {promoActive?"🎉 Currently FREE up to 5 km!":"₹0 within 2km · ₹149 up to 4km · ₹15/km above"}
                    </div>
                  </div>
                </div>
                <div style={{ width:24, height:24, borderRadius:"50%", border:`2px solid ${form.pickup?"#3b82f6":"#334155"}`, background:form.pickup?"#3b82f6":"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  {form.pickup&&<div style={{ width:10,height:10,borderRadius:"50%",background:"white" }}/>}
                </div>
              </div>

              {form.pickup&&(
                <div style={{ padding:"0 18px 18px", borderTop:"1px solid #1e3a5f" }}>
                  <div style={{ height:14 }}/>
                  <div style={{ marginBottom:12 }}>
                    <label style={lbl}>Pickup Address *</label>
                    <div style={{ position:"relative" }}>
                      <MapPin size={14} color="#475569" style={{ position:"absolute",left:11,top:"50%",transform:"translateY(-50%)" }}/>
                      <input value={form.pickupAddress} onChange={e=>setForm(p=>({...p,pickupAddress:e.target.value}))} placeholder="Enter your full address"
                        style={inp({ paddingLeft:32, borderColor:errors.pickupAddress?"#ef4444":"#1e2d4a" })}/>
                    </div>
                    {errors.pickupAddress&&<div style={{ fontSize:11,color:"#f87171",marginTop:3 }}>{errors.pickupAddress}</div>}
                  </div>
                  <div style={{ marginBottom:12 }}>
                    <label style={lbl}>Google Maps Pin Link (optional)</label>
                    <div style={{ position:"relative" }}>
                      <span style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", fontSize:14 }}>📍</span>
                      <input value={form.pickupMapsLink} onChange={e=>setForm(p=>({...p,pickupMapsLink:e.target.value}))}
                        placeholder="Paste Google Maps link e.g. https://maps.app.goo.gl/..."
                        style={inp({ paddingLeft:32 })}/>
                    </div>
                    {form.pickupMapsLink && (
                      <a href={form.pickupMapsLink} target="_blank" rel="noreferrer"
                        style={{ display:"inline-flex", alignItems:"center", gap:5, marginTop:6, fontSize:12, color:"#60a5fa", textDecoration:"none", fontWeight:600 }}>
                        🗺️ Open in Google Maps →
                      </a>
                    )}
                    <div style={{ fontSize:11, color:"#475569", marginTop:4 }}>Open Google Maps → long press your location → tap the coordinates → Share → Copy link</div>
                  </div>

                  <div>
                    <label style={lbl}>Distance from MSP Studio (in km) *</label>
                    <input type="number" step="0.1" min="0" value={form.distanceKm} onChange={e=>setForm(p=>({...p,distanceKm:e.target.value}))} placeholder="e.g. 3.5"
                      style={inp(errors.distanceKm?{borderColor:"#ef4444"}:{})}/>
                    {errors.distanceKm&&<div style={{ fontSize:11,color:"#f87171",marginTop:3 }}>{errors.distanceKm}</div>}
                    {pickInfo&&(
                      <div style={{ marginTop:8, background:"#0a1628", border:"1px solid #1e3a5f", borderRadius:8, padding:"9px 14px", fontSize:13, fontWeight:700, color:pickInfo.color }}>
                        🚐 Pickup & Drop Charge: {pickInfo.text}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div style={{ marginBottom:24 }}>
            <label style={lbl}>Additional Notes</label>
            <textarea value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} placeholder="Any special requests…" rows={3} style={{ ...inp(), resize:"vertical" }}/>
          </div>

          {/* Total */}
          {(form.services.length>0||form.pickup)&&(
            <div style={{ background:"#0a1628", border:"1px solid #1e3a5f", borderRadius:10, padding:"14px 18px", marginBottom:20 }}>
              {form.services.length>0&&<div style={{ display:"flex", justifyContent:"space-between", fontSize:13, color:"#64748b", marginBottom:6 }}><span>Services</span><span style={{ color:"#e2e8f0" }}>{fmt(svcTotal)}</span></div>}
              {form.pickup&&pickInfo&&<div style={{ display:"flex", justifyContent:"space-between", fontSize:13, color:"#64748b", marginBottom:6 }}><span>Pickup & Drop</span><span style={{ color:pickInfo.color }}>{pickInfo.text}</span></div>}
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:16, fontWeight:800, color:"#34d399", borderTop:"1px solid #1e3a5f", paddingTop:8, marginTop:4 }}><span>Estimated Total</span><span>{fmt(grandTotal)}</span></div>
            </div>
          )}

          <button onClick={handleSubmit} disabled={saving}
            style={{ width:"100%", background:"linear-gradient(135deg,#1d4ed8,#3b82f6)", color:"white", border:"none", borderRadius:9, padding:"14px", fontWeight:700, fontSize:15, cursor:saving?"wait":"pointer", boxShadow:"0 4px 20px #3b82f640" }}>
            {saving?"Submitting…":"📅 Confirm Booking"}
          </button>
        </div>
      </div>
    </div>
  );
}
