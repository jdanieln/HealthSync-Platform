import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
    const { loginWithGoogle, currentUser } = useAuth();
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (currentUser) {
            navigate("/");
        }
    }, [currentUser, navigate]);

    const handleLogin = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            await loginWithGoogle();
        } catch (error) {
            console.error("Failed to login", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (currentUser) {
        return null;
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="bg-white p-8 rounded-xl shadow-lg max-w-sm w-full text-center border">
                <h2 className="text-3xl font-bold mb-4 text-indigo-800">HealthSync</h2>
                <p className="text-gray-600 mb-8 font-medium">Inicia sesión para acceder a tu plataforma de salud</p>
                <button
                    onClick={handleLogin}
                    disabled={isSubmitting}
                    className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl hover:bg-indigo-700 transition duration-300 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed shadow-md"
                >
                    {isSubmitting ? (
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6" alt="Google" />
                    )}
                    {isSubmitting ? 'Conectando...' : 'Ingresar con Google'}
                </button>
                <p className="mt-8 text-xs text-gray-400">© 2026 HealthSync Platform. Todos los derechos reservados.</p>
            </div>
        </div>
    );
}
