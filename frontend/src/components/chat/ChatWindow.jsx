import React, { useRef, useEffect } from 'react';
import { Send, MoreVertical, Bot, User, Trash2, Edit2, Phone, Video } from 'lucide-react';
import MessageBubble from './MessageBubble';

const ChatWindow = ({
    activeContact, messages, inputText, setInputText, handleSendMessage,
    toggleAi, showRightPanel, setShowRightPanel, chatContainerRef, messagesEndRef, handleScroll,
    onEditContact, onDeleteContact
}) => {
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);

    if (!activeContact) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-slate-50/50">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 animate-pulse">
                    <Bot size={40} className="opacity-20"/>
                </div>
                <h3 className="text-lg font-medium text-gray-500">Nenhuma conversa selecionada</h3>
                <p className="text-sm opacity-60">Escolha um contato para começar o atendimento</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col min-w-0 bg-white/50 backdrop-blur-sm relative h-full">
            {/* Header */}
            <div className="h-20 border-b border-gray-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-6 shadow-sm z-10 sticky top-0">
                <div className="flex items-center gap-4">
                     <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                        {activeContact.avatar}
                    </div>
                    <div className="flex flex-col">
                        <h2 className="font-bold text-gray-900 text-lg leading-tight">{activeContact.name}</h2>
                        <span className="text-xs text-gray-500 font-mono opacity-80">{activeContact.id}</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={toggleAi}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-300 text-xs font-bold shadow-sm hover:shadow-md
                            ${activeContact.isAiActive
                                ? 'bg-gradient-to-r from-green-50 to-green-100 text-green-700 border-green-200'
                                : 'bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-700 border-yellow-200'}`}
                    >
                        {activeContact.isAiActive ? <><Bot size={16}/> IA ATIVA</> : <><User size={16}/> MANUAL</>}
                    </button>

                    <div className="h-8 w-[1px] bg-gray-200 mx-1"></div>

                    <div className="relative">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className={`p-2.5 rounded-xl transition-all ${isMenuOpen ? 'bg-gray-100 text-gray-800' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'}`}
                        >
                            <MoreVertical size={20}/>
                        </button>

                        {isMenuOpen && (
                            <div className="absolute right-0 top-12 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                                <button onClick={() => { onEditContact(); setIsMenuOpen(false); }} className="w-full text-left px-3 py-2.5 hover:bg-gray-50 rounded-lg text-sm text-gray-700 flex items-center gap-3 transition">
                                    <Edit2 size={16} className="text-blue-500"/> Editar Nome
                                </button>
                                <button onClick={() => { onDeleteContact(); setIsMenuOpen(false); }} className="w-full text-left px-3 py-2.5 hover:bg-red-50 rounded-lg text-sm text-red-600 flex items-center gap-3 transition">
                                    <Trash2 size={16}/> Excluir Conversa
                                </button>
                                <div className="h-[1px] bg-gray-100 my-1"></div>
                                <button onClick={() => { setShowRightPanel(!showRightPanel); setIsMenuOpen(false); }} className="w-full text-left px-3 py-2.5 hover:bg-gray-50 rounded-lg text-sm text-gray-600 flex items-center gap-3 transition">
                                    <User size={16}/> Ver Perfil
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div
                ref={chatContainerRef}
                onScroll={handleScroll}
                className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-100/50 scroll-smooth"
                style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '32px 32px' }}
            >
                {messages.map((msg) => (
                    <MessageBubble key={msg.id} msg={msg} />
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-5 bg-white border-t border-gray-200 shadow-[0_-4px_24px_-12px_rgba(0,0,0,0.05)] z-20">
                <div className="flex gap-3 items-end max-w-5xl mx-auto">
                    <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                        placeholder={activeContact.isAiActive ? "⚠️ A IA está respondendo. Digite para assumir..." : "Escreva sua mensagem..."}
                        className={`flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none text-sm transition shadow-inner
                            ${activeContact.isAiActive ? 'placeholder-amber-600/50 border-amber-200 bg-amber-50/30' : ''}`}
                        rows={1}
                        style={{ minHeight: '52px', maxHeight: '120px' }}
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={!inputText.trim()}
                        className="p-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-2xl shadow-lg shadow-blue-600/30 transition-all duration-200 transform active:scale-95 flex-shrink-0"
                    >
                        <Send size={20} />
                    </button>
                </div>
                <div className="text-center mt-2">
                     <p className="text-[10px] text-gray-400">Pressione Enter para enviar</p>
                </div>
            </div>
        </div>
    );
};

export default ChatWindow;
