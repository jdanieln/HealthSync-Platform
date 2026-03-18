import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";

export default function AdminDashboard() {
    const [users, setUsers] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState("create");
    const [selectedUser, setSelectedUser] = useState(null);
    const [formData, setFormData] = useState({ email: "", displayName: "", role: "PATIENT" });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { currentUser } = useAuth();
    const { showNotification, showConfirm } = useNotification();

    const fetchUsers = useCallback(async () => {
        if (!currentUser) return;
        const token = await currentUser.getIdToken();
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (err) {
            console.error("Failed to fetch users", err);
        }
    }, [currentUser]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const openCreateModal = () => {
        setModalMode("create");
        setFormData({ email: "", displayName: "", role: "PATIENT" });
        setIsModalOpen(true);
    };

    const openEditModal = (user) => {
        setModalMode("edit");
        setSelectedUser(user);
        setFormData({ email: user.email, displayName: user.displayName || "", role: user.role });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedUser(null);
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!currentUser || isSubmitting) return;

        setIsSubmitting(true);
        const token = await currentUser.getIdToken();

        try {
            let url = `${import.meta.env.VITE_API_URL}/api/admin/users`;
            let method = 'POST';
            let bodyData = { ...formData };

            if (modalMode === 'edit') {
                url = `${url}/${selectedUser.uid}`;
                method = 'PUT';
                delete bodyData.email;
            }

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(bodyData)
            });

            if (res.ok) {
                await fetchUsers();
                closeModal();
                showNotification(`Usuario ${modalMode === 'create' ? 'creado' : 'actualizado'} correctamente.`, "success");
            } else {
                const errData = await res.json();
                showNotification(`Error: ${errData.error || 'Fallo al guardar usuario'}`, "error");
            }
        } catch (err) {
            console.error("Error saving user", err);
            showNotification("Error al guardar usuario.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (uid) => {
        if (!currentUser || isSubmitting) return;
        
        const confirmed = await showConfirm(
            "Eliminar Usuario",
            "¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.",
            "Eliminar",
            "Cancelar"
        );
        
        if (!confirmed) return;

        setIsSubmitting(true);
        const token = await currentUser.getIdToken();
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users/${uid}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                await fetchUsers();
                showNotification("Usuario eliminado correctamente.", "success");
            } else {
                const errData = await res.json();
                showNotification(`No se pudo eliminar el usuario: ${errData.error}`, "error");
            }
        } catch (err) {
            console.error("Error deleting user", err);
        } finally {
            setIsSubmitting(false);
        }
    };


    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Panel de Administración</h1>
                <div className="space-x-4">
                    <button
                        onClick={openCreateModal}
                        className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition"
                    >
                        Añadir Usuario
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden border">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {users.map(user => (
                            <tr key={user.uid}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{user.displayName || 'Sin Nombre'}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-500">{user.email}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                        ${user.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-800' :
                                            user.role === 'DOCTOR' ? 'bg-green-100 text-green-800' :
                                                user.role === 'ASSISTANT' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-gray-100 text-gray-800'}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 space-x-3">
                                    <button
                                        disabled={isSubmitting}
                                        onClick={() => openEditModal(user)}
                                        className="text-indigo-600 hover:text-indigo-900 font-bold disabled:opacity-50"
                                    >
                                        Editar
                                    </button>
                                    <button
                                        disabled={isSubmitting}
                                        onClick={() => handleDelete(user.uid)}
                                        className="text-red-600 hover:text-red-900 font-bold disabled:opacity-50 inline-flex items-center"
                                    >
                                        {isSubmitting ? (
                                            <svg className="animate-spin h-3 w-3 mr-1" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        ) : '🗑'} Eliminar
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {users.length === 0 && (
                            <tr>
                                <td colSpan="4" className="px-6 py-4 text-center text-gray-500 italic">No se encontraron usuarios.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full">
                        <h2 className="text-2xl font-bold mb-4">{modalMode === 'create' ? 'Crear Usuario' : 'Editar Usuario'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {modalMode === 'create' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Email</label>
                                    <input type="email" name="email" required value={formData.email} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2" />
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Nombre para mostrar</label>
                                <input type="text" name="displayName" value={formData.displayName} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Rol</label>
                                <select name="role" value={formData.role} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2">
                                    <option value="PATIENT">PATIENT</option>
                                    <option value="DOCTOR">DOCTOR</option>
                                    <option value="ASSISTANT">ASSISTANT</option>
                                    <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                                </select>
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <button type="button" onClick={closeModal} disabled={isSubmitting} className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition disabled:opacity-50">Cancelar</button>
                                <button type="submit" disabled={isSubmitting} className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2 min-w-[140px] font-bold shadow-sm">
                                    {isSubmitting ? (
                                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    ) : (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
                                    )}
                                    {isSubmitting ? 'Guardando...' : modalMode === 'create' ? 'Crear' : 'Guardar Cambios'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
