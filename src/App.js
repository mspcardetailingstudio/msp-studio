import { useState } from "react";
import LoginPage from "./pages/LoginPage";
import CustomerBooking from "./pages/CustomerBooking";
import EmployeeUI from "./pages/EmployeeUI";
import AdminUI from "./pages/AdminUI";
import './App.css';

export default function App() {
  const [role,  setRole]  = useState(null);
  const [promo, setPromo] = useState({ active:false, endDate:null });

  const handleLogin = (r, promoState) => {
    setRole(r);
    if (promoState) setPromo(promoState);
  };

  if (!role)               return <LoginPage onLogin={handleLogin}/>;
  if (role==="customer")   return <CustomerBooking onBack={()=>setRole(null)} promoActive={promo.active} promoEndDate={promo.endDate}/>;
  if (role==="employee")   return <EmployeeUI onLogout={()=>setRole(null)}/>;
  if (role==="admin")      return <AdminUI onLogout={()=>setRole(null)}/>;
  return null;
}
