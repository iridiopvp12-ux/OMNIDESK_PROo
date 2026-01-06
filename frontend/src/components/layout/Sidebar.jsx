import React from 'react';
import { MessageSquare, Ticket, Users, LogOut, PieChart, Settings } from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, onLogout }) => {
    const tabs = [
        { id: 'chat', icon: MessageSquare, label: 'Chats' },
        { id: 'tickets', icon: Ticket, label: 'Chamados' },
        { id: 'dashboard', icon: PieChart, label: 'Dashboard' },
        { id: 'users', icon: Users, label: 'Equipe' },
        { id: 'settings', icon: Settings, label: 'Config' },
    ];

    return (
        <div className="w-[72px] bg-slate-900 flex flex-col items-center py-6 gap-6 h-screen flex-shrink-0 z-20 justify-between shadow-2xl">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold mb-4 shadow-lg shadow-blue-900/50 cursor-pointer hover:scale-105 transition">
                AI
            </div>

            <div className="flex flex-col gap-4 w-full px-3">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full aspect-square rounded-xl flex items-center justify-center transition-all duration-200 group relative
                            ${activeTab === tab.id
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                        title={tab.label}
                    >
                        <tab.icon size={22} />
                        <span className="absolute left-14 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                            {tab.label}
                        </span>
                    </button>
                ))}
            </div>

            <div className="mt-auto flex flex-col gap-4 w-full px-3">
                <button
                    onClick={onLogout}
                    className="w-full aspect-square rounded-xl flex items-center justify-center text-red-400 hover:bg-red-900/30 hover:text-red-200 transition group relative"
                    title="Sair"
                >
                    <LogOut size={22} />
                    <span className="absolute left-14 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                        Sair
                    </span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
