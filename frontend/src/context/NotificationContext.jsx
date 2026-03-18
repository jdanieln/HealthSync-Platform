import { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext();

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [confirmModal, setConfirmModal] = useState(null);

    const showNotification = useCallback((message, type = 'info', duration = 4000) => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, duration);
    }, []);

    const showConfirm = useCallback((title, message, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar') => {
        return new Promise((resolve) => {
            setConfirmModal({
                title,
                message,
                confirmLabel,
                cancelLabel,
                onConfirm: () => {
                    setConfirmModal(null);
                    resolve(true);
                },
                onCancel: () => {
                    setConfirmModal(null);
                    resolve(false);
                }
            });
        });
    }, []);

    return (
        <NotificationContext.Provider value={{ showNotification, showConfirm }}>
            {children}
            
            {/* Toasts Container */}
            <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-4 pointer-events-none">
                {notifications.map(n => (
                    <div 
                        key={n.id} 
                        className={`pointer-events-auto min-w-[320px] max-w-md p-5 rounded-2xl shadow-2xl border-l-[6px] transform transition-all animate-slide-in-right ${
                            n.type === 'success' ? 'bg-white border-green-500 text-gray-800' :
                            n.type === 'error' ? 'bg-white border-red-500 text-gray-800' :
                            'bg-white border-indigo-500 text-gray-800'
                        }`}
                    >
                        <div className="flex items-start gap-4">
                            <div className={`mt-0.5 h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                                n.type === 'success' ? 'bg-green-100 text-green-600' :
                                n.type === 'error' ? 'bg-red-100 text-red-600' :
                                'bg-indigo-100 text-indigo-600'
                            }`}>
                                {n.type === 'success' && <span className="text-xl font-bold">✓</span>}
                                {n.type === 'error' && <span className="text-xl font-bold">✕</span>}
                                {n.type === 'info' && <span className="text-xl font-bold">ℹ</span>}
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-sm text-gray-900 mb-0.5 capitalize">{n.type === 'info' ? 'Aviso' : n.type === 'success' ? 'Éxito' : 'Error'}</p>
                                <p className="text-sm text-gray-600 leading-relaxed font-medium">{n.message}</p>
                            </div>
                            <button 
                                onClick={() => setNotifications(prev => prev.filter(toast => toast.id !== n.id))}
                                className="text-gray-400 hover:text-gray-600 transition-colors h-6 w-6 flex items-center justify-center rounded-full hover:bg-gray-100"
                            >
                                <span className="text-lg">×</span>
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Confirmation Modal */}
            {confirmModal && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-black/40 backdrop-blur-[2px] animate-fade-in">
                    <div className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full overflow-hidden animate-zoom-in border border-gray-100">
                        <div className="p-8 text-center">
                            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">{confirmModal.title}</h3>
                            <p className="text-gray-500 font-medium leading-relaxed">{confirmModal.message}</p>
                        </div>
                        <div className="bg-gray-50/50 p-8 flex flex-col sm:flex-row gap-3 border-t border-gray-100">
                            <button 
                                onClick={confirmModal.onCancel}
                                className="flex-1 px-6 py-4 rounded-2xl text-gray-600 font-bold hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200 transition-all duration-200"
                            >
                                {confirmModal.cancelLabel}
                            </button>
                            <button 
                                onClick={confirmModal.onConfirm}
                                className="flex-1 px-8 py-4 rounded-2xl bg-red-600 text-white font-bold hover:bg-red-700 shadow-lg shadow-red-100 transition-all duration-200 transform active:scale-[0.98]"
                            >
                                {confirmModal.confirmLabel}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </NotificationContext.Provider>
    );
};
