import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Wifi, WifiOff, LogOut, RefreshCw } from 'lucide-react';
import { API_URL, SOCKET_URL } from '../../config';
import { io } from 'socket.io-client';
import { useToast } from '../ui/Toast';

const Settings = () => {
    const [status, setStatus] = useState('disconnected');
    const [qrCode, setQrCode] = useState(null);
    const { addToast } = useToast();
    const token = localStorage.getItem('authToken');

    useEffect(() => {
        // Busca status inicial
        fetch(`${API_URL}/settings/whatsapp`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(data => {
                setStatus(data.status);
                setQrCode(data.qr);
            })
            .catch(console.error);

        // Socket Listeners
        const socket = io(SOCKET_URL);

        socket.on('whatsapp:status', (data) => {
            setStatus(data.status);
            if (data.status === 'connected') addToast("WhatsApp Conectado!", "success");
            if (data.status === 'disconnected') addToast("WhatsApp Desconectado.", "info");
        });

        socket.on('whatsapp:qr', (qr) => {
            setQrCode(qr);
            setStatus('connecting');
        });

        return () => socket.disconnect();
    }, [token, addToast]);

    const handleLogout = async () => {
        if(!confirm("Desconectar WhatsApp?")) return;
        try {
            await fetch(`${API_URL}/settings/whatsapp/logout`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            setStatus('disconnected');
            addToast("Desconexão solicitada...", "info");
        } catch(e) { addToast("Erro ao desconectar", "error"); }
    };

    const handleReset = async () => {
        if(!confirm("Isso apagará a sessão atual e gerará um novo QR Code. Continuar?")) return;
        try {
            await fetch(`${API_URL}/settings/whatsapp/reset`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            setStatus('disconnected');
            setQrCode(null);
            addToast("Sessão resetada. Aguarde o novo QR Code...", "info");
        } catch(e) { addToast("Erro ao resetar", "error"); }
    };

    return (
        <div className="flex-1 bg-gray-50/50 p-8 h-full overflow-y-auto font-sans">
            <h1 className="text-3xl font-bold text-gray-800 mb-8 tracking-tight">Configurações do Sistema</h1>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-2xl">
                <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    Conexão WhatsApp
                    {status === 'connected' && <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full flex items-center gap-1"><Wifi size={12}/> Online</span>}
                    {status === 'disconnected' && <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full flex items-center gap-1"><WifiOff size={12}/> Offline</span>}
                    {status === 'connecting' && <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-full flex items-center gap-1"><RefreshCw size={12} className="animate-spin"/> Conectando</span>}
                </h2>

                <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-xl border border-dashed border-gray-300 min-h-[300px]">
                    {status === 'connected' ? (
                        <div className="text-center">
                            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Wifi size={40} />
                            </div>
                            <h3 className="font-bold text-lg text-gray-800">Tudo pronto!</h3>
                            <p className="text-gray-500 mb-6">Seu WhatsApp está conectado e recebendo mensagens.</p>
                            <button onClick={handleLogout} className="bg-red-50 text-red-600 hover:bg-red-100 px-6 py-2 rounded-lg font-medium transition flex items-center gap-2 mx-auto">
                                <LogOut size={18}/> Desconectar Sessão
                            </button>
                        </div>
                    ) : (
                        <div className="text-center">
                            {qrCode ? (
                                <>
                                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-4 inline-block">
                                        <QRCodeSVG value={qrCode} size={250} />
                                    </div>
                                    <p className="text-sm text-gray-500 font-medium">Escaneie o QR Code com seu celular</p>
                                    <p className="text-xs text-gray-400 mt-1">Abra o WhatsApp {'>'} Configurações {'>'} Aparelhos conectados</p>
                                </>
                            ) : (
                                <div className="text-gray-400 flex flex-col items-center">
                                    <RefreshCw size={40} className="mx-auto mb-4 animate-spin opacity-50"/>
                                    <p className="mb-4">Aguardando QR Code...</p>
                                    <button onClick={handleReset} className="text-xs text-red-500 hover:underline">
                                        Demorando muito? Resetar Conexão
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Rodapé de Reset Global */}
                <div className="mt-8 border-t border-gray-100 pt-6">
                    <h3 className="text-sm font-bold text-gray-800 mb-2">Zona de Perigo</h3>
                    <p className="text-xs text-gray-500 mb-4">Se estiver enfrentando problemas de conexão persistentes, force o reset total da sessão.</p>
                    <button onClick={handleReset} className="w-full border border-red-200 text-red-600 hover:bg-red-50 py-2 rounded-lg text-sm font-bold transition">
                        Resetar Conexão (Forçar Logout)
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Settings;
