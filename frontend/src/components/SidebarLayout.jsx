import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function SidebarLayout({ children }) {
  const { logout, userRole, currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const navItems = {
    PATIENT: [
      { label: "Mis Citas", path: "/patient/appointments", icon: "📅" },
      { label: "Historial Médico", path: "/patient/history", icon: "📋" },
    ],
    DOCTOR: [
      { label: "Gestión de Citas", path: "/doctor/appointments", icon: "📅" },
      { label: "Diagnósticos", path: "/doctor/diagnoses", icon: "🩺" },
    ],
    SUPER_ADMIN: [
      { label: "Dashboard", path: "/admin/dashboard", icon: "📊" },
      { label: "Citas", path: "/doctor/appointments", icon: "📅" },
      { label: "Pacientes", path: "/doctor/diagnoses", icon: "🩺" },
    ]
  };

  const items = navItems[userRole] || [];

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-indigo-900 text-white flex flex-col shadow-xl">
        <div className="p-6">
          <h1 className="text-2xl font-bold tracking-tight">HealthSync</h1>
          <p className="text-indigo-300 text-xs mt-1 uppercase">Plataforma Médica</p>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {items.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                location.pathname === item.path
                  ? "bg-indigo-700 text-white"
                  : "text-indigo-100 hover:bg-indigo-800"
              }`}
            >
              <span>{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 h-20 flex items-center justify-end px-8 z-10 shadow-sm">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3 border-r border-gray-200 pr-6">
              <div className="text-right">
                <p className="text-sm font-bold text-gray-900 leading-none">{currentUser?.displayName || "Usuario"}</p>
                <p className="text-[10px] text-indigo-600 font-bold mt-1 uppercase tracking-widest">{userRole}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold shadow-md ring-2 ring-indigo-100">
                {currentUser?.displayName?.charAt(0) || "U"}
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-semibold text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 group"
              title="Cerrar Sesión"
            >
              <span className="text-lg group-hover:scale-110 transition-transform">🚪</span>
              <span className="hidden md:inline">Cerrar Sesión</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50/50">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
