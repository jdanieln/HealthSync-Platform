import { BrowserRouter as Router, Routes, Route, Link, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import SidebarLayout from "./components/SidebarLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Unauthorized from "./pages/Unauthorized";
import AdminDashboard from "./pages/AdminDashboard";
import DoctorDiagnoses from "./pages/DoctorDiagnoses";
import PatientHistory from "./pages/PatientHistory";
import PatientAppointments from "./pages/PatientAppointments";
import DoctorAppointments from "./pages/DoctorAppointments";

function Home() {
  const { currentUser, userRole, loading } = useAuth();
  
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-600 font-medium">Verificando sesión...</p>
      </div>
    </div>
  );

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  // If user is logged in, redirect based on role
  if (userRole === 'PATIENT') return <Navigate to="/patient/appointments" />;
  if (userRole === 'DOCTOR') return <Navigate to="/doctor/appointments" />;
  if (userRole === 'SUPER_ADMIN') return <Navigate to="/admin/dashboard" />;
  if (userRole === 'ASSISTANT') return <Navigate to="/doctor/appointments" />; // Fallback until assistant page exists

  // Fallback for authenticated but unhandled role
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Hola, {currentUser.displayName}</h2>
        <p className="text-gray-600 mb-6">Tu perfil está configurado como <span className="font-mono bg-gray-100 px-2 py-1 rounded text-indigo-600">{userRole}</span>, pero aún no tienes una pantalla de inicio asignada.</p>
        <p className="text-gray-500 text-sm italic">Contacta al administrador si crees que esto es un error.</p>
        <button onClick={() => window.location.href='/login'} className="mt-8 text-indigo-600 hover:underline">Volver al inicio</button>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          <Route path="/" element={<Home />} />

          {/* Protected Routes */}
          <Route
            path="/patient/history"
            element={
              <ProtectedRoute allowedRoles={['PATIENT', 'SUPER_ADMIN']}>
                <SidebarLayout><PatientHistory /></SidebarLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/appointments"
            element={
              <ProtectedRoute allowedRoles={['PATIENT', 'SUPER_ADMIN']}>
                <SidebarLayout><PatientAppointments /></SidebarLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/diagnoses"
            element={
              <ProtectedRoute allowedRoles={['DOCTOR', 'SUPER_ADMIN']}>
                <SidebarLayout><DoctorDiagnoses /></SidebarLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/appointments"
            element={
              <ProtectedRoute allowedRoles={['DOCTOR', 'SUPER_ADMIN']}>
                <SidebarLayout><DoctorAppointments /></SidebarLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                <SidebarLayout><AdminDashboard /></SidebarLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
