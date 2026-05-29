import { useState } from "react";
import LoginPage from "./pages/LoginPage";
import CustomerBooking from "./pages/CustomerBooking";
import EmployeeUI from "./pages/EmployeeUI";
import AdminUI from "./pages/AdminUI";
import './App.css';

export default function App() {
  const [role, setRole] = useState(null);
  if (!role)                return <LoginPage onLogin={setRole} />;
  if (role === "customer")  return <CustomerBooking onBack={() => setRole(null)} />;
  if (role === "employee")  return <EmployeeUI onLogout={() => setRole(null)} />;
  if (role === "admin")     return <AdminUI onLogout={() => setRole(null)} />;
  return null;
}
