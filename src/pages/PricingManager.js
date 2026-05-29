import { useState, useEffect } from "react";
import { Save, RefreshCw, Search, CheckCircle } from "lucide-react";
import { sb, CAR_MODELS, SERVICES, fmt } from "../config";

export default function PricingManager({ showToast }) {
  const [search,   setSearch]   = useState("");
  const [selected, setSelected] = useState(null);
  const [prices,   setPrices]   = useState({});   // {serviceId: price}
  const [saved,    setSaved]    = useState({});    // {serviceId: price} — what's in DB
  const [loading,  setLoading]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [justSaved,setJustSaved]= useState(false);

  const filtered = CAR_MODELS.filter(m => m.toLowerCase().includes(search.toLowerCase()));

  const loadPrices = async (model) => {
    setLoading(true);
    try {
      const rows = await sb(`service_prices?car_model=eq.${encodeURIComponent(model)}&select=service_id,price`, { method:"GET" });
      const map  = {};
      (rows||[]).forEach(r => { map[r.service_id] = r.price; });
      setPrices(map);
      setSaved(map);
    } catch(e) { showToast("Load error: "+e.message,"error"); }
    finally { setLoading(false); }
  };

  const selectModel = (m) => {
    setSelected(m);
    setJustSaved(false);
    loadPrices(m);
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      // Upsert each service price
      await Promise.all(
        SERVICES.map(sv => {
          const price = prices[sv.id];
          if (price === undefined || price === "") return Promise.resolve();
          return sb("service_prices", {
            method: "POST",
            prefer: "resolution=merge-duplicates,return=minimal",
            body: JSON.stringify({ car_model: selected, service_id: sv.id, price: Number(price) }),
          });
        })
      );
      setSaved({ ...prices });
      setJustSaved(true);
      showToast(`✅ Prices saved for ${selected}!`);
      setTimeout(()=>setJustSaved(false), 3000);
    } catch(e) { showToast("Save error: "+e.message,"error"); }
    finally { setSaving(false); }
  };

  const hasChanges = SERVICES.some(sv => prices[sv.id] !== saved[sv.id] && prices[sv.id] !== undefined && prices[sv.id] !== "");

  const inp = { background:"#0b1120", border:"1px solid #1e2d4a", borderRadius:8, padding:"9px 12px", color:"#e2e8f0", fontSize:13, outline:"none", width:"100%", boxSizing:"border-box" };

  return (
    <div>
      <div style={{ fontSize:22, fontWeight:800, color:"#f1f5f9", marginBottom:4 }}>💰 Pricing Manager</div>
      <div style={{ fontSize:14, color:"#475569", marginBottom:24 }}>
        Set custom prices per car model for each service. These auto-fill in the intake form and can still be overridden manually.
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"300px 1fr", gap:20 }}>

        {/* Car model list */}
        <div style={{ background:"#0d1b2e", border:"1px solid #1e3a5f", borderRadius:14, overflow:"hidden" }}>
          <div style={{ padding:"14px 16px", borderBottom:"1px solid #1e2d4a" }}>
            <div style={{ position:"relative" }}>
              <Search size={14} color="#475569" style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)" }}/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search car model…"
                style={{ ...inp, paddingLeft:32 }}/>
            </div>
          </div>
          <div style={{ maxHeight:520, overflowY:"auto" }}>
            {filtered.map(m => {
              const hasPrices = m === selected && Object.keys(saved).length > 0;
              return (
                <div key={m} onClick={()=>selectModel(m)}
                  style={{ padding:"10px 16px", cursor:"pointer", fontSize:13, borderBottom:"1px solid #0f1e3a", display:"flex", justifyContent:"space-between", alignItems:"center",
                    background: selected===m ? "#172554" : "transparent",
                    color: selected===m ? "#93c5fd" : "#94a3b8" }}>
                  <span>{m}</span>
                  {hasPrices && <span style={{ width:7, height:7, borderRadius:"50%", background:"#34d399", display:"inline-block" }}/>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Price editor */}
        <div>
          {!selected ? (
            <div style={{ background:"#0d1b2e", border:"1px solid #1e3a5f", borderRadius:14, padding:40, textAlign:"center", color:"#334155" }}>
              ← Select a car model from the list to set its prices
            </div>
          ) : (
            <div style={{ background:"#0d1b2e", border:"1px solid #1e3a5f", borderRadius:14, overflow:"hidden" }}>
              <div style={{ padding:"16px 22px", borderBottom:"1px solid #1e2d4a", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <div style={{ fontSize:15, fontWeight:700, color:"#e2e8f0" }}>{selected}</div>
                  <div style={{ fontSize:12, color:"#475569", marginTop:2 }}>Set prices for each service. Leave blank to use the default.</div>
                </div>
                {justSaved && <div style={{ display:"flex", alignItems:"center", gap:6, color:"#4ade80", fontSize:13, fontWeight:600 }}><CheckCircle size={15}/>Saved!</div>}
              </div>

              {loading ? (
                <div style={{ padding:40, textAlign:"center", color:"#475569", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                  <RefreshCw size={16} style={{ animation:"spin 1s linear infinite" }}/> Loading prices…
                </div>
              ) : (
                <div style={{ padding:22 }}>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:20 }}>
                    {SERVICES.map(sv => {
                      const val     = prices[sv.id] ?? "";
                      const savedVal= saved[sv.id];
                      const changed = val !== savedVal && val !== "";
                      return (
                        <div key={sv.id} style={{ background:"#0b1120", border:`1px solid ${changed?"#f59e0b":"#1e2d4a"}`, borderRadius:10, padding:"14px 16px" }}>
                          <div style={{ fontSize:12, color:"#64748b", fontWeight:600, marginBottom:8 }}>{sv.label}</div>
                          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                            <span style={{ color:"#475569", fontSize:14, fontWeight:600 }}>₹</span>
                            <input type="number" value={val}
                              onChange={e => setPrices(p=>({...p,[sv.id]:e.target.value}))}
                              placeholder={`Default: ${sv.defaultPrice.toLocaleString("en-IN")}`}
                              style={{ ...inp, fontSize:15, fontWeight:700, color:val?"#e2e8f0":"#334155", padding:"8px 10px" }}/>
                          </div>
                          {savedVal !== undefined && (
                            <div style={{ fontSize:11, color:"#34d399", marginTop:6 }}>
                              ✓ Saved: ₹{Number(savedVal).toLocaleString("en-IN")}
                              {changed && <span style={{ color:"#f59e0b", marginLeft:8 }}>→ will update to ₹{Number(val).toLocaleString("en-IN")}</span>}
                            </div>
                          )}
                          {savedVal === undefined && val === "" && (
                            <div style={{ fontSize:11, color:"#475569", marginTop:6 }}>Using default: {fmt(sv.defaultPrice)}</div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <button onClick={handleSave} disabled={saving||!hasChanges}
                    style={{ width:"100%", background: hasChanges?"linear-gradient(135deg,#1d4ed8,#3b82f6)":"#0f1e3a", color: hasChanges?"white":"#334155", border:"none", borderRadius:8, padding:"12px", fontWeight:700, fontSize:14, cursor:hasChanges&&!saving?"pointer":"default", display:"flex", alignItems:"center", justifyContent:"center", gap:8, transition:"all 0.2s" }}>
                    {saving?<><RefreshCw size={15} style={{ animation:"spin 1s linear infinite" }}/>Saving prices…</> : hasChanges ? <><Save size={15}/>Save Prices for {selected}</> : "✓ All prices saved — edit a field to update"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Legend */}
          <div style={{ marginTop:16, background:"#0d1b2e", border:"1px dashed #1e3a5f", borderRadius:10, padding:"14px 18px", fontSize:13, color:"#475569", lineHeight:1.8 }}>
            <div style={{ fontWeight:700, color:"#64748b", marginBottom:6 }}>💡 How pricing works</div>
            <div>1. <strong style={{ color:"#93c5fd" }}>Foam Wash</strong> — auto-priced by Car Category × Customer/Garage (set in intake form)</div>
            <div>2. <strong style={{ color:"#93c5fd" }}>All other services</strong> — set here per car model. Saved prices auto-fill in intake form.</div>
            <div>3. <strong style={{ color:"#93c5fd" }}>Manual override</strong> — staff can always edit the price on the intake form before registering.</div>
            <div>4. <strong style={{ color:"#f59e0b" }}>Orange border</strong> = unsaved change. Green dot in list = prices saved for that model.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
