import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";

export default function PatientAppointments() {
    const [appointments, setAppointments] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({ date: "", time: "", reason: "" });
    const { currentUser } = useAuth();
    const { showNotification } = useNotification();

    const fetchAppointments = useCallback(async () => {
        if (!currentUser) return;
        const token = await currentUser.getIdToken();
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/appointments`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setAppointments(data);
            }
        } catch (err) {
            console.error("Failed to fetch appointments", err);
        }
    }, [currentUser]);

    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments]);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!currentUser || isSubmitting) return;

        setIsSubmitting(true);
        const token = await currentUser.getIdToken();

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/appointments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setFormData({ date: "", time: "", reason: "" });
                fetchAppointments();
                showNotification("Cita solicitada correctamente.", "success");
            } else {
                const errData = await res.json();
                showNotification(`Error: ${errData.error}`, "error");
            }
        } catch (err) {
            console.error("Error creating appointment", err);
            showNotification("Error al solicitar la cita.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">Mis Citas</h1>
                    <Link to="/" className="text-blue-600 hover:underline">Inicio</Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Request Form */}
                    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                        <h2 className="text-xl font-semibold mb-4 text-indigo-700">Solicitar Nueva Cita</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                                <input type="date" name="date" required value={formData.date} onChange={handleInputChange} className="w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
                                <input type="time" name="time" required value={formData.time} onChange={handleInputChange} className="w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Motivo (Opcional)</label>
                                <textarea name="reason" value={formData.reason} onChange={handleInputChange} rows="3" className="w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500" placeholder="Describe brevemente el motivo de tu consulta..."></textarea>
                            </div>
                            <button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition disabled:opacity-70 flex items-center justify-center gap-2 font-bold shadow-sm">
                                {isSubmitting ? (
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                )}
                                {isSubmitting ? "Enviando..." : "Solicitar Cita"}
                            </button>
                        </form>
                    </div>

                    {/* Appointments List */}
                    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                        <h2 className="text-xl font-semibold mb-4 text-gray-800">Historial de Solicitudes</h2>
                        {appointments.length === 0 ? (
                            <p className="text-gray-500 italic">No has solicitado ninguna cita aún.</p>
                        ) : (
                            <div className="space-y-4">
                                {appointments.map(app => (
                                    <div key={app.id} className="p-4 border rounded-lg bg-gray-50">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-bold text-gray-900">{app.date} a las {app.time}</p>
                                                <p className="text-sm text-gray-600">{app.reason}</p>
                                            </div>
                                            <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${
                                                app.status === 'APPROVED' ? 'bg-green-50 text-green-700 border-green-100' :
                                                app.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-100' :
                                                app.status === 'COMPLETED' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                                                'bg-yellow-50 text-yellow-700 border-yellow-100'
                                            }`}>
                                                {app.status}
                                            </span>
                                        </div>
                                        {app.status === 'COMPLETED' && (
                                            <div className="mt-3 flex justify-end">
                                                <Link 
                                                    to="/patient/history" 
                                                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center bg-indigo-50 px-2 py-1 rounded"
                                                >
                                                    <span className="mr-1">📋</span> Ver Diagnóstico
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
