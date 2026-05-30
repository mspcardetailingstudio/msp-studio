import { useState, useEffect } from "react";
import { Car, Lock, Eye, EyeOff } from "lucide-react";
import { ADMIN_PASSWORD, EMPLOYEE_PASSWORD, sb } from "../config";

export default function LoginPage({ onLogin }) {
  const [role,  setRole]  = useState("admin");
  const [pass,  setPass]  = useState("");
  const [show,  setShow]  = useState(false);
  const [err,   setErr]   = useState("");
  const [promo, setPromo] = useState({ active:false, endDate:null });

  useEffect(()=>{
    sb("promo_settings?id=eq.1&select=active,end_date",{ method:"GET" })
      .then(rows=>{ if(rows&&rows[0]) setPromo({ active:rows[0].active, endDate:rows[0].end_date }); })
      .catch(()=>{});
  },[]);

  const handleLogin = () => {
    if (role==="admin"    && pass===ADMIN_PASSWORD)    { onLogin("admin",    promo); return; }
    if (role==="employee" && pass===EMPLOYEE_PASSWORD) { onLogin("employee", promo); return; }
    if (role==="customer")                             { onLogin("customer", promo); return; }
    setErr("Incorrect password. Please try again.");
  };

  return (
    <div style={{ minHeight:"100vh", background:"#0b1120", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'DM Sans','Segoe UI',sans-serif" }}>
      <div style={{ width:"100%", maxWidth:420, padding:24 }}>
        <div style={{ textAlign:"center", marginBottom:36 }}>
          <div style={{ width:60, height:60, borderRadius:16, background:"linear-gradient(135deg,#3b82f6,#1d4ed8)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", boxShadow:"0 0 32px #3b82f650" }}>
            <Car size={30} color="white"/>
          </div>
          <div style={{ fontSize:22, fontWeight:800, color:"#f1f5f9" }}>MSP Studio Hub</div>
          <div style={{ fontSize:12, color:"#475569", letterSpacing:1.5, marginTop:2 }}>MARUTHI SERVICE POINT</div>
        </div>

        <div style={{ background:"#0d1b2e", border:"1px solid #1e3a5f", borderRadius:16, padding:28 }}>
          <div style={{ fontSize:15, fontWeight:700, color:"#93c5fd", marginBottom:20 }}>Sign in to continue</div>

          <div style={{ marginBottom:20 }}>
            <label style={{ display:"block", fontSize:11, color:"#64748b", fontWeight:600, letterSpacing:0.8, textTransform:"uppercase", marginBottom:8 }}>I am a</label>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
              {[{id:"admin",label:"Admin",emoji:"👑"},{id:"employee",label:"Employee",emoji:"🔧"},{id:"customer",label:"Customer",emoji:"🚗"}].map(r=>(
                <button key={r.id} onClick={()=>{ setRole(r.id); setPass(""); setErr(""); }}
                  style={{ padding:"10px 8px", borderRadius:8, border:`1px solid ${role===r.id?"#3b82f6":"#1e2d4a"}`, background:role===r.id?"#172554":"#0b1120", color:role===r.id?"#93c5fd":"#475569", fontWeight:600, fontSize:13, cursor:"pointer" }}>
                  <div style={{ fontSize:18, marginBottom:3 }}>{r.emoji}</div>{r.label}
                </button>
              ))}
            </div>
          </div>

          {role!=="customer"&&(
            <div style={{ marginBottom:20 }}>
              <label style={{ display:"block", fontSize:11, color:"#64748b", fontWeight:600, letterSpacing:0.8, textTransform:"uppercase", marginBottom:8 }}>Password</label>
              <div style={{ position:"relative" }}>
                <Lock size={14} color="#475569" style={{ position:"absolute",left:12,top:"50%",transform:"translateY(-50%)" }}/>
                <input type={show?"text":"password"} value={pass} onChange={e=>{ setPass(e.target.value); setErr(""); }} onKeyDown={e=>e.key==="Enter"&&handleLogin()} placeholder="Enter password"
                  style={{ width:"100%", background:"#0b1120", border:`1px solid ${err?"#ef4444":"#1e2d4a"}`, borderRadius:8, padding:"11px 40px 11px 36px", color:"#e2e8f0", fontSize:14, outline:"none", boxSizing:"border-box" }}/>
                <button onClick={()=>setShow(s=>!s)} style={{ position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#475569" }}>
                  {show?<EyeOff size={15}/>:<Eye size={15}/>}
                </button>
              </div>
              {err&&<div style={{ fontSize:12,color:"#f87171",marginTop:5 }}>{err}</div>}
            </div>
          )}

          {role==="customer"&&(
            <div style={{ marginBottom:20, background:"#0a1628", border:"1px solid #1e3a5f", borderRadius:8, padding:"12px 14px", fontSize:13, color:"#64748b", lineHeight:1.6 }}>
              📋 You'll be taken to our <strong style={{ color:"#93c5fd" }}>Booking Page</strong> to schedule your car detailing.
              {promo.active&&<div style={{ marginTop:6, color:"#fbbf24", fontWeight:600 }}>🎉 Special Offer Active: FREE Pickup & Drop up to 5km!</div>}
            </div>
          )}

          <button onClick={handleLogin}
            style={{ width:"100%", background:"linear-gradient(135deg,#1d4ed8,#3b82f6)", color:"white", border:"none", borderRadius:8, padding:"12px", fontWeight:700, fontSize:14, cursor:"pointer", boxShadow:"0 4px 20px #3b82f640" }}>
            {role==="customer"?"View Offer & Book →":"Sign In →"}
          </button>
        </div>
      </div>
    </div>
  );
}
