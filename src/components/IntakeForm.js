import { useState, useEffect } from "react";
import { Car, Phone, Mail, Tag, Palette, Check, RefreshCw, Edit3 } from "lucide-react";
import { sb, CAR_MODELS, SERVICES, CAR_CATEGORIES, FOAM_WASH_PRICES, fmt } from "../config";

const emptyForm = {
  name:"", phone:"", email:"",
  carModel:"", carCategory:"", plate:"", color:"",
  vehicleSource:"customer", // "customer" | "garage"
  services:[], servicePrices:{}, // {serviceId: overriddenPrice}
  status:"Queued", payment:"Cash",
};

export default function IntakeForm({ onSuccess, showToast }) {
  const [form,     setForm]     = useState(emptyForm);
  const [errors,   setErrors]   = useState({});
  const [saving,   setSaving]   = useState(false);
  const [search,   setSearch]   = useState("");
  const [dbPrices, setDbPrices] = useState({}); // {carModel_serviceId: price}
  const [editingPrice, setEditingPrice] = useState(null);

  // Load saved prices from Supabase for selected car model
  useEffect(() => {
    if (!form.carModel) return;
    sb(`service_prices?car_model=eq.${encodeURIComponent(form.carModel)}&select=service_id,price`, { method:"GET" })
      .then(rows => {
        const map = {};
        (rows||[]).forEach(r => { map[r.service_id] = r.price; });
        setDbPrices(map);
      }).catch(()=>{});
  }, [form.carModel]);

  // Auto-suggest price for a service
  const suggestedPrice = (serviceId) => {
    // 1. DB saved price for this car model
    if (dbPrices[serviceId] !== undefined) return dbPrices[serviceId];
    // 2. Foam wash: use category × source table
    if (serviceId === "foam") {
      const src   = form.vehicleSource === "garage" ? "garage" : "customer";
      const cat   = form.carCategory;
      const table = FOAM_WASH_PRICES[src];
      if (cat && table[cat] !== undefined) return table[cat];
      if (src === "garage") return 350;
      return 500;
    }
    // 3. Default from SERVICES
    return SERVICES.find(s=>s.id===serviceId)?.defaultPrice || 0;
  };

  const getPrice = (serviceId) => {
    if (form.servicePrices[serviceId] !== undefined) return form.servicePrices[serviceId];
    return suggestedPrice(serviceId);
  };

  const totalBill = form.services.reduce((s, id) => s + getPrice(id), 0);

  const toggleSvc = (id) => {
    setForm(f => {
      const sel = f.services.includes(id);
      const services = sel ? f.services.filter(s=>s!==id) : [...f.services, id];
      // Auto-fill price when selecting
      const servicePrices = { ...f.servicePrices };
      if (!sel && servicePrices[id] === undefined) {
        // leave undefined so suggestedPrice() is used live
      }
      return { ...f, services, servicePrices };
    });
  };

  const setPriceOverride = (id, val) => {
    setForm(f => ({ ...f, servicePrices: { ...f.servicePrices, [id]: Number(val)||0 } }));
  };

  const validate = () => {
    const e={};
    if (!form.name.trim())             e.name     = "Required";
    if (!form.phone.match(/^\d{10}$/)) e.phone    = "10-digit number";
    if (!form.carModel)                e.carModel = "Select car model";
    if (!form.plate.trim())            e.plate    = "Required";
    if (!form.services.length)         e.services = "Select at least one service";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const [customer] = await sb("customers", { method:"POST", body:JSON.stringify({ name:form.name, phone:form.phone, email:form.email||null }) });
      const [vehicle]  = await sb("vehicles",  { method:"POST", body:JSON.stringify({ customer_id:customer.id, car_model:form.carModel, plate:form.plate, color:form.color||null }) });
      const svcPricesArr = form.services.map(id => ({ id, price: getPrice(id) }));
      await sb("services_log", { method:"POST", body:JSON.stringify({
        customer_id: customer.id,
        vehicle_id:  vehicle.id,
        services:    form.services,
        service_prices: svcPricesArr,
        total_bill:  totalBill,
        status:      form.status,
        payment_mode:form.payment,
        vehicle_source: form.vehicleSource,
        car_category:   form.carCategory || null,
      })});
      setForm(emptyForm); setErrors({}); setSearch("");
      showToast("✅ Registered successfully!");
      onSuccess();
    } catch(e) { showToast("❌ " + e.message, "error"); }
    finally { setSaving(false); }
  };

  const inp = (ex={}) => ({ background:"#0b1120", border:"1px solid #1e2d4a", borderRadius:8, padding:"10px 14px", color:"#e2e8f0", fontSize:13, outline:"none", width:"100%", boxSizing:"border-box", ...ex });
  const lbl = { display:"block", fontSize:11, color:"#64748b", fontWeight:600, letterSpacing:0.8, textTransform:"uppercase", marginBottom:6 };
  const sec = { fontSize:11, color:"#3b82f6", fontWeight:700, textTransform:"uppercase", letterSpacing:0.8, marginBottom:10 };

  const filteredCars = CAR_MODELS.filter(m => m.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ background:"#0d1b2e", border:"1px solid #1e3a5f", borderRadius:16, padding:28 }}>

      {/* ── Vehicle Source toggle ── */}
      <div style={{ marginBottom:22 }}>
        <div style={sec}>Vehicle Source</div>
        <div style={{ display:"flex", gap:10 }}>
          {[{id:"customer",label:"👤 Customer Vehicle",desc:"Walk-in / booked customer"},{id:"garage",label:"🏠 Garage Vehicle",desc:"Our own garage car"}].map(s=>(
            <button key={s.id} onClick={()=>setForm(f=>({...f,vehicleSource:s.id,servicePrices:{}}))}
              style={{ flex:1, padding:"12px 16px", borderRadius:10, border:`2px solid ${form.vehicleSource===s.id?"#3b82f6":"#1e2d4a"}`, background:form.vehicleSource===s.id?"#172554":"#0b1120", cursor:"pointer", textAlign:"left" }}>
              <div style={{ fontSize:14, fontWeight:700, color:form.vehicleSource===s.id?"#93c5fd":"#64748b" }}>{s.label}</div>
              <div style={{ fontSize:11, color:"#475569", marginTop:2 }}>{s.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Customer Details ── */}
      <div style={{ marginBottom:18 }}>
        <div style={sec}>Customer Details</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14 }}>
          {[{key:"name",label:"Full Name *",ph:"Rajan Mehta"},{key:"phone",label:"Phone *",ph:"10-digit"},{key:"email",label:"Email",ph:"optional"}].map(f=>(
            <div key={f.key}>
              <label style={lbl}>{f.label}</label>
              <input value={form[f.key]} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} placeholder={f.ph}
                style={inp(errors[f.key]?{borderColor:"#ef4444"}:{})}/>
              {errors[f.key]&&<div style={{ fontSize:11,color:"#f87171",marginTop:3 }}>{errors[f.key]}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* ── Vehicle Details ── */}
      <div style={{ marginBottom:18 }}>
        <div style={sec}>Vehicle Details</div>

        {/* Car model search */}
        <div style={{ marginBottom:12 }}>
          <label style={lbl}>Car Model * — search</label>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Type to search e.g. Swift, Creta, Nexon…"
            style={inp({ marginBottom:6, borderColor:errors.carModel?"#ef4444":"#1e2d4a" })}/>
          <div style={{ maxHeight:130, overflowY:"auto", background:"#0b1120", border:"1px solid #1e2d4a", borderRadius:8 }}>
            {filteredCars.slice(0,50).map(m=>(
              <div key={m} onClick={()=>{ setForm(p=>({...p,carModel:m,servicePrices:{}})); setSearch(m); }}
                style={{ padding:"8px 12px", cursor:"pointer", fontSize:13, color:form.carModel===m?"#93c5fd":"#94a3b8", background:form.carModel===m?"#172554":"transparent", borderBottom:"1px solid #0f1e3a" }}>
                {m}
              </div>
            ))}
            {filteredCars.length===0&&<div style={{ padding:"10px 12px", color:"#334155", fontSize:13 }}>No match — try "Other"</div>}
          </div>
          {errors.carModel&&<div style={{ fontSize:11,color:"#f87171",marginTop:3 }}>{errors.carModel}</div>}
        </div>

        {/* Car category — important for foam wash pricing */}
        <div style={{ marginBottom:12 }}>
          <label style={lbl}>Car Category <span style={{ color:"#475569", fontWeight:400, textTransform:"none" }}>(used for Foam Wash pricing)</span></label>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {[...CAR_CATEGORIES, ...(form.vehicleSource==="garage"?["Omni / Van"]:[])].map(c=>(
              <button key={c} onClick={()=>setForm(f=>({...f,carCategory:c,servicePrices:{}}))}
                style={{ padding:"7px 14px", borderRadius:8, border:`1px solid ${form.carCategory===c?"#3b82f6":"#1e2d4a"}`, background:form.carCategory===c?"#172554":"#0b1120", color:form.carCategory===c?"#93c5fd":"#64748b", fontSize:12, fontWeight:600, cursor:"pointer" }}>
                {c}
                {form.carCategory===c && form.vehicleSource && (() => {
                  const src = form.vehicleSource==="garage"?"garage":"customer";
                  const p   = FOAM_WASH_PRICES[src]?.[c];
                  return p ? <span style={{ color:"#34d399", marginLeft:6, fontWeight:700 }}>₹{p}</span> : null;
                })()}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:14 }}>
          <div>
            <label style={lbl}>License Plate *</label>
            <input value={form.plate} onChange={e=>setForm(p=>({...p,plate:e.target.value.toUpperCase()}))} placeholder="KA01AB1234"
              style={inp(errors.plate?{borderColor:"#ef4444",letterSpacing:1}:{letterSpacing:1})}/>
            {errors.plate&&<div style={{ fontSize:11,color:"#f87171",marginTop:3 }}>{errors.plate}</div>}
          </div>
          <div>
            <label style={lbl}>Colour</label>
            <input value={form.color} onChange={e=>setForm(p=>({...p,color:e.target.value}))} placeholder="Pearl White" style={inp()}/>
          </div>
          <div>
            <label style={lbl}>Payment Mode</label>
            <div style={{ display:"flex", gap:8 }}>
              {["Cash","GPay"].map(pm=>(
                <button key={pm} onClick={()=>setForm(p=>({...p,payment:pm}))}
                  style={{ flex:1, padding:"10px 6px", borderRadius:8, border:`1px solid ${form.payment===pm?(pm==="Cash"?"#16a34a":"#7c3aed"):"#1e2d4a"}`, background:form.payment===pm?(pm==="Cash"?"#052e16":"#2e1065"):"#0b1120", color:form.payment===pm?(pm==="Cash"?"#4ade80":"#a78bfa"):"#475569", fontWeight:700, fontSize:12, cursor:"pointer" }}>
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
      </div>

      {/* ── Services with editable prices ── */}
      <div style={{ marginBottom:20 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <div style={sec}>Services & Pricing {errors.services&&<span style={{ color:"#f87171", fontWeight:400 }}>{errors.services}</span>}</div>
          {!form.carModel && <span style={{ fontSize:11, color:"#475569" }}>Select a car model to see saved prices</span>}
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {SERVICES.map(sv=>{
            const sel     = form.services.includes(sv.id);
            const price   = getPrice(sv.id);
            const isEditing = editingPrice === sv.id;
            const savedInDb = dbPrices[sv.id] !== undefined;
            return (
              <div key={sv.id} style={{ background:sel?"#0f1e38":"#0b1120", border:`1px solid ${sel?"#3b82f6":"#1e2d4a"}`, borderRadius:10, padding:"12px 16px", display:"flex", alignItems:"center", gap:14 }}>
                {/* Checkbox */}
                <div onClick={()=>toggleSvc(sv.id)} style={{ width:20, height:20, borderRadius:5, border:`2px solid ${sel?"#3b82f6":"#334155"}`, background:sel?"#3b82f6":"transparent", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0 }}>
                  {sel&&<Check size={12} color="white"/>}
                </div>
                {/* Label */}
                <div style={{ flex:1, cursor:"pointer" }} onClick={()=>toggleSvc(sv.id)}>
                  <div style={{ fontSize:13, fontWeight:600, color:sel?"#e2e8f0":"#94a3b8" }}>{sv.label}</div>
                  {sv.id==="foam" && form.carCategory && (
                    <div style={{ fontSize:11, color:"#475569", marginTop:1 }}>
                      Priced for: {form.carCategory} · {form.vehicleSource==="garage"?"Garage":"Customer"}
                    </div>
                  )}
                  {savedInDb && sv.id!=="foam" && (
                    <div style={{ fontSize:11, color:"#34d399", marginTop:1 }}>✓ Custom price saved for {form.carModel}</div>
                  )}
                </div>
                {/* Price display / edit */}
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  {isEditing ? (
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <span style={{ color:"#64748b", fontSize:13 }}>₹</span>
                      <input type="number" value={form.servicePrices[sv.id]??price}
                        onChange={e=>setPriceOverride(sv.id, e.target.value)}
                        onBlur={()=>setEditingPrice(null)}
                        autoFocus
                        style={{ width:90, background:"#0b1120", border:"1px solid #3b82f6", borderRadius:6, padding:"5px 8px", color:"#e2e8f0", fontSize:13, outline:"none" }}/>
                    </div>
                  ) : (
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:14, fontWeight:700, color:sel?"#34d399":"#475569" }}>{fmt(price)}</div>
                      {form.servicePrices[sv.id]!==undefined && (
                        <div style={{ fontSize:10, color:"#f59e0b" }}>manually edited</div>
                      )}
                    </div>
                  )}
                  <button onClick={()=>{ if(!form.services.includes(sv.id)) toggleSvc(sv.id); setEditingPrice(isEditing?null:sv.id); }}
                    title="Edit price" style={{ background:"transparent", border:"1px solid #1e2d4a", borderRadius:6, padding:"5px 7px", cursor:"pointer", color:"#475569", display:"flex", alignItems:"center" }}>
                    <Edit3 size={12}/>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {form.services.length>0&&(
          <div style={{ marginTop:12, background:"#0a1628", border:"1px solid #1e3a5f", borderRadius:8, padding:"12px 16px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ fontSize:13, color:"#64748b" }}>{form.services.length} service{form.services.length>1?"s":""} selected</div>
                <div style={{ fontSize:11, color:"#475569", marginTop:2 }}>
                  {form.vehicleSource==="garage"?"🏠 Garage Vehicle":"👤 Customer Vehicle"}
                  {form.carCategory?" · "+form.carCategory:""}
                </div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:11, color:"#64748b", marginBottom:2 }}>Total Bill</div>
                <div style={{ fontSize:20, fontWeight:800, color:"#34d399" }}>{fmt(totalBill)}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <button onClick={handleSubmit} disabled={saving}
        style={{ width:"100%", background:"linear-gradient(135deg,#1d4ed8,#3b82f6)", color:"white", border:"none", borderRadius:8, padding:"13px", fontWeight:700, fontSize:14, cursor:saving?"wait":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
        {saving?<><RefreshCw size={15} style={{ animation:"spin 1s linear infinite" }}/>Saving…</>:"✅ Register Customer, Vehicle & Service"}
      </button>
    </div>
  );
}
