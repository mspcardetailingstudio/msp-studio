import { useState } from "react";
import { Car, Phone, Mail, Tag, User, CalendarDays, CheckCircle, ArrowLeft } from "lucide-react";
import { sb, CAR_MODELS, SERVICES, MSP_WHATSAPP, MSP_EMAIL, calc, fmt } from "../config";

const emptyForm = { name:"", phone:"", email:"", carModel:"", plate:"", color:"", date:"", time:"", services:[], notes:"" };

export default function CustomerBooking({ onBack }) {
  const [form, setForm]       = useState(emptyForm);
  const [errors, setErrors]   = useState({});
  const [saving, setSaving]   = useState(false);
  const [done,   setDone]     = useState(null);
  const [search, setSearch]   = useState("");

  const filtered = CAR_MODELS.filter(m => m.toLowerCase().includes(search.toLowerCase()));

  const validate = () => {
    const e = {};
    if (!form.name.trim())             e.name     = "Required";
    if (!form.phone.match(/^\d{10}$/)) e.phone    = "Enter 10-digit number";
    if (!form.carModel)                e.carModel = "Select a car model";
    if (!form.plate.trim())            e.plate    = "Required";
    if (!form.date)                    e.date     = "Pick a date";
    if (!form.time)                    e.time     = "Pick a time";
    if (!form.services.length)         e.services = "Select at least one service";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const toggleSvc = (id) => setForm(f => ({ ...f, services: f.services.includes(id) ? f.services.filter(s=>s!==id) : [...f.services, id] }));

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      // Save to Supabase appointments table
      await sb("appointments", {
        method:"POST",
        body: JSON.stringify({
          customer_name: form.name,
          phone: form.phone,
          email: form.email || null,
          car_model: form.carModel,
          plate: form.plate,
          color: form.color || null,
          appt_date: form.date,
          appt_time: form.time,
          services: form.services,
          estimated_bill: calc(form.services),
          notes: form.notes || null,
          status: "Pending",
        }),
      });

      const svcNames = form.services.map(id => SERVICES.find(s=>s.id===id)?.label).join(", ");
      const bill     = fmt(calc(form.services));
      const waText   = encodeURIComponent(
        `🚗 *New Booking at MSP Studio!*\n\n👤 Name: ${form.name}\n📞 Phone: ${form.phone}\n🚘 Car: ${form.carModel} (${form.plate})\n🛠️ Services: ${svcNames}\n💰 Estimated: ${bill}\n📅 Date: ${form.date} at ${form.time}\n📝 Notes: ${form.notes||"—"}\n\n_Please confirm this appointment._`
      );
      const waLink   = `https://wa.me/${MSP_WHATSAPP}?text=${waText}`;
      const emailSub = encodeURIComponent(`New Booking: ${form.name} — ${form.date}`);
      const emailBody= encodeURIComponent(`New appointment booked at MSP Studio:\n\nName: ${form.name}\nPhone: ${form.phone}\nEmail: ${form.email||"—"}\nCar: ${form.carModel} (${form.plate})\nServices: ${svcNames}\nEstimated Bill: ${bill}\nDate: ${form.date} at ${form.time}\nNotes: ${form.notes||"—"}`);
      const mailLink = `mailto:${MSP_EMAIL}?subject=${emailSub}&body=${emailBody}`;

      setDone({ waLink, mailLink, name: form.name, date: form.date, time: form.time });
      setForm(emptyForm);
    } catch(e) {
      alert("Booking failed: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  if (done) return (
    <div style={{ minHeight:"100vh", background:"#0b1120", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'DM Sans','Segoe UI',sans-serif", padding:24 }}>
      <div style={{ maxWidth:500, width:"100%", textAlign:"center" }}>
        <div style={{ width:70, height:70, borderRadius:"50%", background:"#052e16", border:"2px solid #16a34a", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px" }}>
          <CheckCircle size={36} color="#4ade80" />
        </div>
        <div style={{ fontSize:22, fontWeight:800, color:"#f1f5f9", marginBottom:8 }}>Booking Confirmed! 🎉</div>
        <div style={{ fontSize:14, color:"#64748b", marginBottom:28, lineHeight:1.7 }}>
          Thank you, <strong style={{ color:"#93c5fd" }}>{done.name}</strong>! Your appointment for <strong style={{ color:"#93c5fd" }}>{done.date} at {done.time}</strong> has been received. MSP Studio will confirm shortly.
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:24 }}>
          <a href={done.waLink} target="_blank" rel="noreferrer"
            style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10, background:"#052e16", border:"1px solid #16a34a", borderRadius:10, padding:"13px", color:"#4ade80", fontWeight:700, fontSize:14, textDecoration:"none" }}>
            📲 Notify MSP on WhatsApp
          </a>
          <a href={done.mailLink}
            style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10, background:"#0f2447", border:"1px solid #1e3a5f", borderRadius:10, padding:"13px", color:"#60a5fa", fontWeight:700, fontSize:14, textDecoration:"none" }}>
            📧 Also Send Email Notification
          </a>
        </div>
        <button onClick={() => { setDone(null); onBack(); }}
          style={{ background:"transparent", border:"1px solid #1e2d4a", borderRadius:8, padding:"10px 20px", color:"#475569", cursor:"pointer", fontSize:13 }}>
          ← Back to Home
        </button>
      </div>
    </div>
  );

  const inp = (extra={}) => ({ background:"#0b1120", border:"1px solid #1e2d4a", borderRadius:8, padding:"10px 14px", color:"#e2e8f0", fontSize:14, outline:"none", width:"100%", boxSizing:"border-box", ...extra });
  const lbl = { display:"block", fontSize:11, color:"#64748b", fontWeight:600, letterSpacing:0.8, textTransform:"uppercase", marginBottom:6 };

  return (
    <div style={{ minHeight:"100vh", background:"#0b1120", fontFamily:"'DM Sans','Segoe UI',sans-serif" }}>
      {/* Header */}
      <header style={{ background:"linear-gradient(135deg,#0f1e3a,#0b1120)", borderBottom:"1px solid #1e2d4a", padding:"0 24px" }}>
        <div style={{ maxWidth:720, margin:"0 auto", height:60, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:34, height:34, borderRadius:9, background:"linear-gradient(135deg,#3b82f6,#1d4ed8)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Car size={18} color="white" />
            </div>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:"#f1f5f9" }}>MSP Studio — Book Appointment</div>
              <div style={{ fontSize:11, color:"#475569" }}>Maruthi Service Point</div>
            </div>
          </div>
          <button onClick={onBack} style={{ background:"transparent", border:"1px solid #1e2d4a", borderRadius:7, padding:"6px 12px", color:"#475569", cursor:"pointer", fontSize:12, display:"flex", alignItems:"center", gap:5 }}>
            <ArrowLeft size={13}/> Back
          </button>
        </div>
      </header>

      <div style={{ maxWidth:720, margin:"0 auto", padding:"28px 24px" }}>
        <div style={{ background:"#0d1b2e", border:"1px solid #1e3a5f", borderRadius:16, padding:28 }}>
          <div style={{ fontSize:17, fontWeight:700, color:"#93c5fd", marginBottom:24, display:"flex", alignItems:"center", gap:8 }}>
            <CalendarDays size={19}/> Schedule Your Car Detailing
          </div>

          {/* Customer info */}
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:12, color:"#3b82f6", fontWeight:700, textTransform:"uppercase", letterSpacing:0.8, marginBottom:12 }}>Your Details</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
              <div>
                <label style={lbl}>Full Name *</label>
                <input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="e.g. Rajan Mehta" style={inp(errors.name?{borderColor:"#ef4444"}:{})}/>
                {errors.name && <div style={{ fontSize:11, color:"#f87171", marginTop:3 }}>{errors.name}</div>}
              </div>
              <div>
                <label style={lbl}>Phone Number *</label>
                <input value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))} placeholder="10-digit mobile" style={inp(errors.phone?{borderColor:"#ef4444"}:{})}/>
                {errors.phone && <div style={{ fontSize:11, color:"#f87171", marginTop:3 }}>{errors.phone}</div>}
              </div>
              <div style={{ gridColumn:"1/-1" }}>
                <label style={lbl}>Email (optional)</label>
                <input value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} placeholder="your@email.com" style={inp()}/>
              </div>
            </div>
          </div>

          {/* Car info */}
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:12, color:"#3b82f6", fontWeight:700, textTransform:"uppercase", letterSpacing:0.8, marginBottom:12 }}>Vehicle Details</div>
            <div style={{ marginBottom:12 }}>
              <label style={lbl}>Car Model * <span style={{ color:"#475569", fontWeight:400, textTransform:"none", letterSpacing:0 }}>— search below</span></label>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Type to search e.g. Swift, Creta, Nexon..."
                style={inp({ marginBottom:8, border: errors.carModel?"1px solid #ef4444":"1px solid #1e2d4a" })}/>
              <div style={{ maxHeight:160, overflowY:"auto", background:"#0b1120", border:"1px solid #1e2d4a", borderRadius:8 }}>
                {filtered.slice(0,50).map(m => (
                  <div key={m} onClick={() => { setForm(p=>({...p,carModel:m})); setSearch(m); setErrors(e=>({...e,carModel:undefined})); }}
                    style={{ padding:"9px 14px", cursor:"pointer", fontSize:13, color:form.carModel===m?"#93c5fd":"#94a3b8", background:form.carModel===m?"#172554":"transparent", borderBottom:"1px solid #0f1e3a" }}>
                    {m}
                  </div>
                ))}
                {filtered.length === 0 && <div style={{ padding:"12px 14px", color:"#334155", fontSize:13 }}>No match found — try "Other"</div>}
              </div>
              {errors.carModel && <div style={{ fontSize:11, color:"#f87171", marginTop:3 }}>{errors.carModel}</div>}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
              <div>
                <label style={lbl}>License Plate *</label>
                <input value={form.plate} onChange={e=>setForm(p=>({...p,plate:e.target.value.toUpperCase()}))} placeholder="KA01AB1234" style={inp(errors.plate?{borderColor:"#ef4444",letterSpacing:1}:{letterSpacing:1})}/>
                {errors.plate && <div style={{ fontSize:11, color:"#f87171", marginTop:3 }}>{errors.plate}</div>}
              </div>
              <div>
                <label style={lbl}>Car Colour</label>
                <input value={form.color} onChange={e=>setForm(p=>({...p,color:e.target.value}))} placeholder="e.g. Pearl White" style={inp()}/>
              </div>
            </div>
          </div>

          {/* Date & Time */}
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:12, color:"#3b82f6", fontWeight:700, textTransform:"uppercase", letterSpacing:0.8, marginBottom:12 }}>Appointment Slot</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
              <div>
                <label style={lbl}>Preferred Date *</label>
                <input type="date" value={form.date} min={new Date().toISOString().split("T")[0]} onChange={e=>setForm(p=>({...p,date:e.target.value}))} style={inp(errors.date?{borderColor:"#ef4444"}:{})}/>
                {errors.date && <div style={{ fontSize:11, color:"#f87171", marginTop:3 }}>{errors.date}</div>}
              </div>
              <div>
                <label style={lbl}>Preferred Time *</label>
                <select value={form.time} onChange={e=>setForm(p=>({...p,time:e.target.value}))} style={inp(errors.time?{borderColor:"#ef4444",cursor:"pointer"}:{cursor:"pointer"})}>
                  <option value="">Select time slot</option>
                  {["9:00 AM","9:30 AM","10:00 AM","10:30 AM","11:00 AM","11:30 AM","12:00 PM","12:30 PM","2:00 PM","2:30 PM","3:00 PM","3:30 PM","4:00 PM","4:30 PM","5:00 PM"].map(t=><option key={t} value={t}>{t}</option>)}
                </select>
                {errors.time && <div style={{ fontSize:11, color:"#f87171", marginTop:3 }}>{errors.time}</div>}
              </div>
            </div>
          </div>

          {/* Services */}
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:12, color:"#3b82f6", fontWeight:700, textTransform:"uppercase", letterSpacing:0.8, marginBottom:12 }}>
              Services Required * {errors.services && <span style={{ color:"#f87171", fontWeight:400 }}>{errors.services}</span>}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              {SERVICES.map(sv => {
                const sel = form.services.includes(sv.id);
                return (
                  <div key={sv.id} onClick={()=>toggleSvc(sv.id)} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", background:sel?"#172554":"#0b1120", border:`1px solid ${sel?"#3b82f6":"#1e2d4a"}`, borderRadius:9, padding:"11px 14px", cursor:"pointer" }}>
                    <div>
                      <div style={{ fontSize:13, fontWeight:600, color:sel?"#93c5fd":"#94a3b8" }}>{sv.label}</div>
                      <div style={{ fontSize:12, color:sel?"#60a5fa":"#475569", fontWeight:700 }}>{fmt(sv.price)}</div>
                    </div>
                    <div style={{ width:20, height:20, borderRadius:"50%", border:`2px solid ${sel?"#3b82f6":"#334155"}`, background:sel?"#3b82f6":"transparent", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      {sel && <div style={{ width:8, height:8, borderRadius:"50%", background:"white" }}/>}
                    </div>
                  </div>
                );
              })}
            </div>
            {form.services.length > 0 && (
              <div style={{ marginTop:10, background:"#0a1628", border:"1px solid #1e3a5f", borderRadius:8, padding:"10px 14px", display:"flex", justifyContent:"space-between" }}>
                <span style={{ fontSize:13, color:"#64748b" }}>Estimated Total</span>
                <span style={{ fontSize:15, fontWeight:800, color:"#34d399" }}>{fmt(calc(form.services))}</span>
              </div>
            )}
          </div>

          {/* Notes */}
          <div style={{ marginBottom:24 }}>
            <label style={lbl}>Additional Notes</label>
            <textarea value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} placeholder="Any special requests or concerns about your vehicle..."
              rows={3} style={{ ...inp(), resize:"vertical" }}/>
          </div>

          <button onClick={handleSubmit} disabled={saving}
            style={{ width:"100%", background:"linear-gradient(135deg,#1d4ed8,#3b82f6)", color:"white", border:"none", borderRadius:9, padding:"13px", fontWeight:700, fontSize:15, cursor:saving?"wait":"pointer", boxShadow:"0 4px 20px #3b82f640" }}>
            {saving ? "Submitting…" : "📅 Confirm Booking"}
          </button>
        </div>
      </div>
    </div>
  );
}
