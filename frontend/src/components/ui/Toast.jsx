import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react';

const ToastContext = React.createContext(null);

export const useToast = () => {
    const context = React.useContext(ToastContext);
    if (!context) throw new Error("useToast must be used within a ToastProvider");
    return context;
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = (message, type = 'info', duration = 3000) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => removeToast(id), duration);
    };

    const removeToast = (id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
                {toasts.map(toast => (
                    <div key={toast.id} className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border animate-in slide-in-from-right fade-in duration-300 max-w-sm w-full
                        ${toast.type === 'success' ? 'bg-white border-green-200 text-green-800' :
                          toast.type === 'error' ? 'bg-white border-red-200 text-red-800' :
                          'bg-white border-blue-200 text-gray-800'}`}>
                        {toast.type === 'success' && <CheckCircle size={20} className="text-green-500" />}
                        {toast.type === 'error' && <AlertCircle size={20} className="text-red-500" />}
                        {toast.type === 'info' && <Info size={20} className="text-blue-500" />}
                        <p className="text-sm font-medium flex-1">{toast.message}</p>
                        <button onClick={() => removeToast(toast.id)} className="text-gray-400 hover:text-gray-600 transition"><X size={16} /></button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};
