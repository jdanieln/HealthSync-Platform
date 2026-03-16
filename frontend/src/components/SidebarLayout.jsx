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

        <div className="p-4 border-t border-indigo-800">
          <div className="flex items-center space-x-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-sm font-bold">
              {currentUser?.displayName?.charAt(0) || "U"}
            </div>
            <div className="overflow-hidden">
                <p className="text-sm font-medium truncate">{currentUser?.displayName}</p>
                <p className="text-xs text-indigo-300 truncate">{userRole}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 p-3 text-indigo-100 hover:bg-red-600 hover:text-white rounded-lg transition-colors"
          >
            <span>🚀</span>
            <span className="font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
