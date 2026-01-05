import React, { useState } from 'react';
import { FileText, Bot, X, Download, Check, CheckCheck } from 'lucide-react';
import { API_URL } from '../../config';

const MessageBubble = ({ msg }) => {
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const isUser = msg.sender === 'user';
    const isAi = msg.isAi;

    // Extrai o nome do arquivo da URL se não houver texto, para ficar bonito no documento
    const getFileName = (url) => {
        try { return url.split('/').pop().split('-').slice(1).join('-'); } catch(e) { return 'Arquivo'; }
    };

    const renderContent = () => {
        if (msg.mediaType === 'image' && msg.mediaUrl) {
            return (
                <div className="space-y-2">
                    <img
                        src={`${API_URL}${msg.mediaUrl}`}
                        alt="Mídia"
                        className="rounded-lg max-w-[280px] max-h-[300px] object-cover border border-white/10 shadow-sm cursor-pointer hover:scale-[1.02] transition"
                        onClick={() => setIsLightboxOpen(true)}
                    />
                    {msg.text && msg.text !== 'undefined' && <p className="leading-relaxed">{msg.text}</p>}

                    {/* Lightbox Modal */}
                    {isLightboxOpen && (
                        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setIsLightboxOpen(false)}>
                            <button className="absolute top-4 right-4 text-white hover:bg-white/10 p-2 rounded-full"><X size={32}/></button>
                            <img src={`${API_URL}${msg.mediaUrl}`} className="max-w-full max-h-[90vh] rounded shadow-2xl" />
                        </div>
                    )}
                </div>
            );
        }
        if (msg.mediaType === 'audio' && msg.mediaUrl) {
             return (
                <div className="space-y-2 min-w-[240px]">
                    <audio controls src={`${API_URL}${msg.mediaUrl}`} className="w-full h-10 mt-1 rounded-md" />
                    {msg.text && msg.text !== 'Áudio enviado' && <p className="text-xs opacity-70 italic mt-1 border-t border-white/10 pt-1">{msg.text}</p>}
                </div>
            );
        }
        if (msg.mediaType === 'document' && msg.mediaUrl) {
            return (
               <a
                href={`${API_URL}${msg.mediaUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                download
                className={`flex items-center gap-3 p-3 rounded-lg transition border group/doc
                    ${isUser ? 'bg-gray-100 border-gray-200 hover:bg-gray-200 text-gray-800' : 'bg-white/10 border-white/20 hover:bg-white/20 text-white'}`}
               >
                   <div className="bg-white/20 p-2 rounded-lg flex-shrink-0"><FileText size={24}/></div>
                   <div className="flex flex-col overflow-hidden flex-1 min-w-0">
                        <span className="truncate font-medium text-sm">{msg.text && msg.text !== 'Arquivo enviado' ? msg.text : getFileName(msg.mediaUrl)}</span>
                        <span className="text-[10px] opacity-70 flex items-center gap-1 group-hover/doc:opacity-100 transition-opacity">
                            <Download size={10}/> Baixar
                        </span>
                   </div>
               </a>
           );
       }
       return <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>;
    };

    return (
        <div className={`flex w-full ${isUser ? 'justify-start' : 'justify-end'} group animate-in slide-in-from-bottom-2 duration-300`}>
             {/* Avatar */}
             <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white mr-2 self-end mb-1 shadow-sm flex-shrink-0
                ${isUser ? 'bg-gradient-to-br from-gray-400 to-gray-500 order-first' : 'bg-gradient-to-br from-blue-500 to-indigo-600 order-last ml-2 mr-0'}`}>
                 {isUser ? 'U' : (isAi ? <Bot size={16}/> : 'A')}
             </div>

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

                <div className={`text-[10px] text-right mt-1.5 font-medium flex items-center justify-end gap-1 ${isUser ? 'text-gray-400' : 'text-white/60'}`}>
                    {msg.time}
                    {!isUser && (
                        <span>
                            {msg.status === 5 ? <CheckCheck size={12} className="text-blue-400"/> :
                             msg.status === 4 ? <CheckCheck size={12}/> :
                             <Check size={12}/>}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MessageBubble;
