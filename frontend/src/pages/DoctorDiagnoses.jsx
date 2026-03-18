import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";

export default function DoctorDiagnoses() {
    const [patients, setPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [diagnoses, setDiagnoses] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [selectedAppointmentId, setSelectedAppointmentId] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({ symptoms: "", diagnosis: "", prescription: "" });

    const { currentUser } = useAuth();

    const fetchPatients = useCallback(async () => {
        if (!currentUser) return;
        const token = await currentUser.getIdToken();
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/doctors/patients`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setPatients(data);
            }
        } catch (err) {
            console.error("Failed to fetch patients", err);
        }
    }, [currentUser]);

    useEffect(() => {
        fetchPatients();
    }, [fetchPatients]);

    const fetchPatientData = async (patientId) => {
        if (!currentUser) return;
        const token = await currentUser.getIdToken();
        try {
            // Fetch Diagnoses
            const diagRes = await fetch(`${import.meta.env.VITE_API_URL}/api/diagnoses/patient/${patientId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (diagRes.ok) {
                const diagData = await diagRes.json();
                setDiagnoses(diagData);
            }

            // Fetch list of ALL appointments to filter for this patient
            // Optimization can be done later in backend
            const appRes = await fetch(`${import.meta.env.VITE_API_URL}/api/appointments`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (appRes.ok) {
                const allApps = await appRes.json();
                const patientApps = allApps.filter(a => a.patientId === patientId && a.status === 'APPROVED');
                setAppointments(patientApps);
            }

        } catch (err) {
            console.error("Failed to fetch patient data", err);
        }
    };

    const handleSelectPatient = (patient) => {
        setSelectedPatient(patient);
        setDiagnoses([]);
        setAppointments([]);
        setSelectedAppointmentId("");
        setFormData({ symptoms: "", diagnosis: "", prescription: "" });
        fetchPatientData(patient.uid);
    };

    const handleAppointmentChange = (e) => {
        const appId = e.target.value;
        setSelectedAppointmentId(appId);
        
        if (appId) {
            const app = appointments.find(a => a.id === appId);
            if (app && !formData.symptoms) {
                setFormData(prev => ({ ...prev, symptoms: app.reason || "" }));
            }
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmitDiagnosis = async (e) => {
        e.preventDefault();
        if (!currentUser || !selectedPatient || isSubmitting) return;

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
                    patientId: selectedPatient.uid,
                    appointmentId: selectedAppointmentId || null,
                    symptoms: formData.symptoms,
                    diagnosis: formData.diagnosis,
                    prescription: formData.prescription
                })
            });

            if (res.ok) {
                setFormData({ symptoms: "", diagnosis: "", prescription: "" });
                setSelectedAppointmentId("");
                fetchPatientData(selectedPatient.uid);
            } else {
                const errData = await res.json();
                alert(`Error: ${errData.error}`);
            }
        } catch (err) {
            console.error("Error creating diagnosis", err);
            alert("Error creating diagnosis.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Panel de Diagnósticos</h1>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-1/3 bg-white rounded-lg shadow p-4 h-fit">
                    <h2 className="text-xl font-semibold mb-4 border-b pb-2">Pacientes</h2>
                    <ul className="space-y-2">
                        {patients.map(patient => (
                            <li key={patient.uid}>
                                <button
                                    onClick={() => handleSelectPatient(patient)}
                                    className={`w-full text-left p-3 rounded-md transition ${selectedPatient?.uid === patient.uid ? 'bg-indigo-50 border-indigo-200 border' : 'hover:bg-gray-100 border border-transparent'}`}
                                >
                                    <p className="font-medium text-gray-900">{patient.displayName || 'Sin Nombre'}</p>
                                    <p className="text-sm text-gray-500">{patient.email}</p>
                                </button>
                            </li>
                        ))}
                        {patients.length === 0 && <p className="text-sm text-gray-500">No se encontraron pacientes.</p>}
                    </ul>
                </div>

                <div className="w-full md:w-2/3 flex flex-col gap-6">
                    {!selectedPatient ? (
                        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500 h-full flex flex-col justify-center border-2 border-dashed border-gray-200 min-h-[300px]">
                            <p>Selecciona un paciente de la lista para ver su historial o añadir un diagnóstico.</p>
                        </div>
                    ) : (
                        <>
                            <div className="bg-white rounded-lg shadow p-6">
                                <h2 className="text-xl font-semibold mb-4 text-indigo-700">Nuevo Diagnóstico - {selectedPatient.displayName || selectedPatient.email}</h2>
                                <form onSubmit={handleSubmitDiagnosis} className="space-y-4">
                                    {appointments.length > 0 && (
                                        <div className="bg-indigo-50 p-4 rounded-md border border-indigo-100 mb-4">
                                            <label className="block text-sm font-bold text-indigo-900 mb-1">📅 Vincular a Cita Aprobada</label>
                                            <select 
                                                value={selectedAppointmentId} 
                                                onChange={handleAppointmentChange}
                                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2 bg-white"
                                            >
                                                <option value="">-- No vincular a cita específica --</option>
                                                {appointments.map(app => (
                                                    <option key={app.id} value={app.id}>
                                                        {app.date} {app.time} - {app.reason}
                                                    </option>
                                                ))}
                                            </select>
                                            <p className="text-[10px] text-indigo-500 mt-1 italic">Vincular una cita la marcará automáticamente como completada.</p>
                                        </div>
                                    )}
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Síntomas</label>
                                        <textarea required name="symptoms" value={formData.symptoms} onChange={handleInputChange} rows="2" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2" placeholder="Síntomas del paciente..."></textarea>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Diagnóstico</label>
                                        <textarea required name="diagnosis" value={formData.diagnosis} onChange={handleInputChange} rows="2" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2" placeholder="Diagnóstico médico..."></textarea>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Prescripción (Opcional)</label>
                                        <textarea name="prescription" value={formData.prescription} onChange={handleInputChange} rows="2" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2" placeholder="Medicamentos o tratamiento..."></textarea>
                                    </div>
                                    <div className="flex justify-end">
                                        <button type="submit" disabled={isSubmitting} className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2 min-w-[160px] font-bold shadow-sm">
                                            {isSubmitting ? (
                                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                            ) : (
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
                                            )}
                                            {isSubmitting ? 'Guardando...' : 'Guardar Diagnóstico'}
                                        </button>
                                    </div>
                                </form>
                            </div>

                            <div className="bg-white rounded-lg shadow p-6">
                                <h2 className="text-xl font-semibold mb-4 border-b pb-2">Historial Médico</h2>
                                {diagnoses.length === 0 ? (
                                    <p className="text-gray-500 italic">No se encontraron diagnósticos previos para este paciente.</p>
                                ) : (
                                    <div className="space-y-6">
                                        {diagnoses.map(diag => {
                                            const dateStr = diag.createdAt ? new Date(diag.createdAt._seconds * 1000).toLocaleString() : 'Recién';
                                            return (
                                                <div key={diag.id} className="bg-gray-50 p-4 rounded-md border border-gray-200">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="flex flex-col">
                                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{dateStr}</p>
                                                            {diag.appointmentId && (
                                                                <p className="text-[10px] text-green-600 font-bold mt-1 inline-flex items-center">
                                                                    <span className="mr-1">✅</span> Cita Vinculada
                                                                </p>
                                                            )}
                                                        </div>
                                                        <p className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">Por: {diag.doctorName}</p>
                                                    </div>
                                                    <div className="space-y-2 mt-3">
                                                        <p><span className="font-semibold text-gray-700 text-sm">Síntomas:</span><br /><span className="text-gray-800">{diag.symptoms}</span></p>
                                                        <p><span className="font-semibold text-gray-700 text-sm">Diagnóstico:</span><br /><span className="text-gray-800">{diag.diagnosis}</span></p>
                                                        {diag.prescription && (
                                                            <p><span className="font-semibold text-gray-700 text-sm">Prescripción:</span><br /><span className="text-gray-800">{diag.prescription}</span></p>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
