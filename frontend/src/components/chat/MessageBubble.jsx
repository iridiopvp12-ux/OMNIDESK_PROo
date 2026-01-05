import React from 'react';
import { FileText, Bot } from 'lucide-react';
import { API_URL } from '../../config';

const MessageBubble = ({ msg }) => {
    const isUser = msg.sender === 'user';
    const isAi = msg.isAi;

    const renderContent = () => {
        if (msg.mediaType === 'image' && msg.mediaUrl) {
            return (
                <div className="space-y-2">
                    <img
                        src={`${API_URL}${msg.mediaUrl}`}
                        alt="Mídia"
                        className="rounded-lg max-w-[280px] max-h-[300px] object-cover border border-white/10 shadow-sm cursor-pointer hover:scale-[1.02] transition"
                        onClick={() => window.open(`${API_URL}${msg.mediaUrl}`, '_blank')}
                    />
                    {msg.text && <p className="leading-relaxed">{msg.text}</p>}
                </div>
            );
        }
        if (msg.mediaType === 'audio' && msg.mediaUrl) {
             return (
                <div className="space-y-2 min-w-[240px]">
                    <audio controls src={`${API_URL}${msg.mediaUrl}`} className="w-full h-10 mt-1 rounded-md" />
                    {msg.text && <p className="text-xs opacity-70 italic mt-1 border-t border-white/10 pt-1">Transcrevendo...</p>}
                </div>
            );
        }
        if (msg.mediaType === 'document' && msg.mediaUrl) {
            return (
               <a
                href={`${API_URL}${msg.mediaUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-3 p-3 rounded-lg transition border ${isUser ? 'bg-gray-100 border-gray-200 hover:bg-gray-200 text-gray-800' : 'bg-white/10 border-white/20 hover:bg-white/20 text-white'}`}
               >
                   <div className="bg-white/20 p-2 rounded-lg"><FileText size={24}/></div>
                   <div className="flex flex-col overflow-hidden">
                        <span className="truncate font-medium text-sm">Documento</span>
                        <span className="text-[10px] opacity-70">Clique para abrir</span>
                   </div>
               </a>
           );
       }
       return <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>;
    };

    return (
        <div className={`flex w-full ${isUser ? 'justify-start' : 'justify-end'} group animate-in slide-in-from-bottom-2 duration-300`}>
             {/* Avatar (Optional for user, Agent icon for AI/Agent) */}
             {isUser && (
                 <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-500 mr-2 self-end mb-1 shadow-sm">
                     U
                 </div>
             )}

            <div className={`relative max-w-[75%] lg:max-w-[60%] p-4 rounded-2xl shadow-sm text-sm transition-all
                ${isUser
                    ? 'bg-white text-gray-800 rounded-bl-none border border-gray-100'
                    : isAi
                        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-br-none shadow-indigo-200'
                        : 'bg-gray-900 text-white rounded-br-none'
                }`
            }>
                {isAi && (
                    <div className="text-[10px] opacity-90 mb-2 flex items-center gap-1.5 font-bold tracking-wide uppercase border-b border-white/20 pb-1.5">
                        <Bot size={12}/> IA Júlia
                    </div>
                )}

                {renderContent()}

                <div className={`text-[10px] text-right mt-1.5 font-medium ${isUser ? 'text-gray-400' : 'text-white/60'}`}>
                    {msg.time}
                </div>
            </div>
        </div>
    );
};

export default MessageBubble;
