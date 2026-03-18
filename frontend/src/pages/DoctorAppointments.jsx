import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";

export default function DoctorAppointments() {
    const [appointments, setAppointments] = useState([]);
    const [isDiagModalOpen, setIsDiagModalOpen] = useState(false);
    const [selectedApp, setSelectedApp] = useState(null);
    const [diagForm, setDiagForm] = useState({ symptoms: "", diagnosis: "", prescription: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    const handleUpdateStatus = async (appointmentId, newStatus) => {
        if (!currentUser || isSubmitting) return;
        setIsSubmitting(true);
        const token = await currentUser.getIdToken();
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/appointments/${appointmentId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (res.ok) {
                await fetchAppointments();
                showNotification(`Cita ${newStatus === 'APPROVED' ? 'aprobada' : 'rechazada'} correctamente.`, "success");
            } else {
                showNotification("Error al actualizar la cita.", "error");
            }
        } catch (err) {
            console.error("Error updating appointment", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const openDiagnosisModal = (app) => {
        setSelectedApp(app);
        setDiagForm({ symptoms: app.reason || "", diagnosis: "", prescription: "" });
        setIsDiagModalOpen(true);
    };

    const handleDiagnosisSubmit = async (e) => {
        e.preventDefault();
        if (!currentUser || !selectedApp || isSubmitting) return;

        setIsSubmitting(true);
        const token = await currentUser.getIdToken();
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/diagnoses`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    patientId: selectedApp.patientId,
                    appointmentId: selectedApp.id,
                    symptoms: diagForm.symptoms,
                    diagnosis: diagForm.diagnosis,
                    prescription: diagForm.prescription
                })
            });

            if (res.ok) {
                setIsDiagModalOpen(false);
                await fetchAppointments();
                showNotification("Diagnóstico registrado correctamente.", "success");
            } else {
                const errData = await res.json();
                showNotification(`Error: ${errData.error}`, "error");
            }
        } catch (err) {
            console.error("Error saving diagnosis", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto">
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Gestión de Citas</h1>
                    <p className="text-gray-500 mt-1">Administra las solicitudes y completa las consultas médicas.</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Paciente</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Fecha y Hora</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Motivo</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Estado</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {appointments.map((app) => (
                            <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs mr-3">
                                            {app.patientName?.charAt(0) || 'P'}
                                        </div>
                                        <div>
                                            <div className="text-sm font-semibold text-gray-900">{app.patientName}</div>
                                            <div className="text-xs text-gray-500">{app.patientEmail}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900 font-medium">{app.date}</div>
                                    <div className="text-xs text-gray-500">{app.time}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm text-gray-600 max-w-xs truncate" title={app.reason}>
                                        {app.reason}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${
                                        app.status === 'APPROVED' ? 'bg-green-50 text-green-700 border-green-100' :
                                        app.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-100' :
                                        app.status === 'COMPLETED' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                                        'bg-yellow-50 text-yellow-700 border-yellow-100'
                                    }`}>
                                        {app.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                                    {app.status === 'PENDING' && (
                                        <>
                                            <button 
                                                disabled={isSubmitting} 
                                                onClick={() => handleUpdateStatus(app.id, 'APPROVED')} 
                                                className="text-green-600 hover:text-green-900 font-bold disabled:opacity-50 inline-flex items-center"
                                            >
                                                {isSubmitting ? (
                                                    <svg className="animate-spin h-3 w-3 mr-1" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                ) : '✓'} Aprobar
                                            </button>
                                            <button 
                                                disabled={isSubmitting} 
                                                onClick={() => handleUpdateStatus(app.id, 'REJECTED')} 
                                                className="text-red-600 hover:text-red-900 font-bold disabled:opacity-50 inline-flex items-center"
                                            >
                                                {isSubmitting ? (
                                                    <svg className="animate-spin h-3 w-3 mr-1" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                ) : '✕'} Rechazar
                                            </button>
                                        </>
                                    )}
                                    {app.status === 'APPROVED' && (
                                        <button 
                                            disabled={isSubmitting}
                                            onClick={() => openDiagnosisModal(app)} 
                                            className="bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 transition font-bold text-sm shadow-sm disabled:opacity-50"
                                        >
                                            Completar y Diagnosticar
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {appointments.length === 0 && (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center text-gray-500 italic">
                                    <div className="flex flex-col items-center">
                                        <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                        <p>No hay citas registradas en este momento.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Diagnosis Modal */}
            {isDiagModalOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="bg-indigo-600 p-6 text-white">
                            <h2 className="text-2xl font-bold">Registrar Diagnóstico</h2>
                            <p className="text-indigo-100 opacity-90 mt-1">Paciente: <span className="font-semibold text-white">{selectedApp.patientName}</span></p>
                        </div>
                        
                        <form onSubmit={handleDiagnosisSubmit} className="p-8 space-y-6">
                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Síntomas Reportados</label>
                                    <textarea 
                                        required 
                                        value={diagForm.symptoms} 
                                        onChange={(e) => setDiagForm({...diagForm, symptoms: e.target.value})}
                                        rows="3" 
                                        className="block w-full rounded-xl border-gray-200 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 border p-4 transition-all"
                                        placeholder="Describa los síntomas observados..."
                                    ></textarea>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Diagnóstico Médico</label>
                                    <textarea 
                                        required 
                                        value={diagForm.diagnosis} 
                                        onChange={(e) => setDiagForm({...diagForm, diagnosis: e.target.value})}
                                        rows="3" 
                                        className="block w-full rounded-xl border-gray-200 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 border p-4 transition-all"
                                        placeholder="Indique el diagnóstico final..."
                                    ></textarea>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Prescripción / Tratamiento</label>
                                    <textarea 
                                        value={diagForm.prescription} 
                                        onChange={(e) => setDiagForm({...diagForm, prescription: e.target.value})}
                                        rows="3" 
                                        className="block w-full rounded-xl border-gray-200 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 border p-4 transition-all"
                                        placeholder="Medicamentos, dosis e indicaciones..."
                                    ></textarea>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-4 pt-4">
                                <button 
                                    type="button" 
                                    onClick={() => setIsDiagModalOpen(false)} 
                                    className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition active:scale-95"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={isSubmitting}
                                    className="bg-indigo-600 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 disabled:opacity-50 flex items-center active:scale-95"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                            Guardando...
                                        </>
                                    ) : 'Finalizar Consulta'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
