import React, { useState } from 'react';
import { Bot, User, Lock, ArrowRight } from 'lucide-react';
import { useToast } from '../ui/Toast';
import { API_URL } from '../../config';

const Login = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { addToast } = useToast();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();

            if (res.ok && data.user) {
                onLogin(data.user);
                addToast(`Bem-vindo, ${data.user.name}!`, "success");
            } else {
                addToast(data.error || "Login falhou", "error");
                setLoading(false);
            }
        } catch (error) {
            addToast("Erro de conexão", "error");
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 font-sans p-4">
            <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md border border-white/50 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-500">
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center text-white font-bold text-3xl mx-auto mb-6 shadow-xl shadow-blue-500/20 transform hover:scale-110 transition duration-300">
                        <Bot size={40} />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800 tracking-tight">OmniDesk Pro</h1>
                    <p className="text-gray-500 text-sm mt-2 font-medium">Faça login para acessar o painel</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="relative group">
                        <User className="absolute left-3 top-3 text-gray-400 group-focus-within:text-blue-500 transition" size={20} />
                        <input
                            type="text"
                            placeholder="Usuário"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-sm"
                        />
                    </div>
                    <div className="relative group">
                        <Lock className="absolute left-3 top-3 text-gray-400 group-focus-within:text-blue-500 transition" size={20} />
                        <input
                            type="password"
                            placeholder="Senha"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-sm"
                        />
                    </div>

                    <button
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-95"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>Entrar <ArrowRight size={18} /></>
                        )}
                    </button>
                </form>

                <p className="text-center text-xs text-gray-400 mt-8">
                    &copy; 2024 OmniDesk Systems. v2.0
                </p>
            </div>
        </div>
    );
};

export default Login;
