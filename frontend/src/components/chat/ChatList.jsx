import React from 'react';
import { Search, Bot, User } from 'lucide-react';

const ChatList = ({ contacts, selectedChatId, setSelectedChatId }) => {
    return (
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 z-10 h-full shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]">
            <div className="p-5 border-b border-gray-100 bg-white">
                <h2 className="font-bold text-gray-800 text-xl mb-4 tracking-tight">Conversas</h2>
                <div className="relative group">
                    <Search className="absolute left-3 top-2.5 text-gray-400 group-focus-within:text-blue-500 transition" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar cliente..."
                        className="w-full bg-gray-50 border border-gray-200 pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                    />
                </div>
            </div>

            <div className="overflow-y-auto flex-1 custom-scrollbar">
                {contacts.map((contact) => (
                    <div
                        key={contact.id}
                        onClick={() => setSelectedChatId(contact.id)}
                        className={`p-4 mx-3 my-1 rounded-xl cursor-pointer transition-all duration-200 border border-transparent
                            ${selectedChatId === contact.id
                                ? 'bg-blue-50 border-blue-100 shadow-sm'
                                : 'hover:bg-gray-50 hover:border-gray-100'}`
                        }
                    >
                        <div className="flex gap-3">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md transition
                                ${selectedChatId === contact.id ? 'bg-blue-600 scale-105' : 'bg-gradient-to-br from-gray-400 to-gray-500'}`}>
                                {contact.avatar}
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                <div className="flex justify-between items-center mb-0.5">
                                    <span className={`font-semibold text-sm truncate ${selectedChatId === contact.id ? 'text-blue-900' : 'text-gray-900'}`}>
                                        {contact.name}
                                    </span>
                                    <span className="text-[10px] text-gray-400 font-medium">{contact.time}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <p className={`text-xs truncate max-w-[140px] ${selectedChatId === contact.id ? 'text-blue-700/80' : 'text-gray-500'}`}>
                                        {contact.lastMsg.includes('Arquivo') ? '📎 Mídia recebida' : contact.lastMsg}
                                    </p>

                                    {contact.isAiActive ? (
                                        <div className="bg-green-100 text-green-700 p-1 rounded-full" title="IA Ativa">
                                            <Bot size={12}/>
                                        </div>
                                    ) : (
                                        <div className="bg-yellow-100 text-yellow-700 p-1 rounded-full" title="Manual">
                                            <User size={12}/>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ChatList;
