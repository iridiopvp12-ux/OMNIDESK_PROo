import React, { useRef, useEffect, useState } from 'react';
import { Send, MoreVertical, Bot, User, Trash2, Edit2, Phone, Video, Paperclip, Mic, StopCircle, Loader2, X } from 'lucide-react';
import MessageBubble from './MessageBubble';
import TriageReportCard from '../tickets/TriageReportCard';
import { useToast } from '../ui/Toast';
import { API_URL } from '../../config';

const StatusBadge = ({ isAiActive }) => (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 w-max ${
      isAiActive
        ? "bg-green-100 text-green-700 border-green-200"
        : "bg-yellow-100 text-yellow-700 border-yellow-200"
    }`}>
      {isAiActive ? <><Bot size={12}/> IA ATIVA</> : <><User size={12}/> MANUAL</>}
    </span>
  );

const ChatWindow = ({
    activeContact, messages, inputText, setInputText, handleSendMessage,
    toggleAi, showRightPanel, setShowRightPanel, chatContainerRef, messagesEndRef, handleScroll,
    onEditContact, onDeleteContact
}) => {
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const fileInputRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const { addToast } = useToast();

    // --- AUDIO RECORDER ---
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            const chunks = [];

            mediaRecorderRef.current.ondataavailable = (e) => chunks.push(e.data);
            mediaRecorderRef.current.onstop = async () => {
                const blob = new Blob(chunks, { type: 'audio/ogg; codecs=opus' });
                const file = new File([blob], "audio_message.ogg", { type: 'audio/ogg' });

                // Upload do Áudio
                setIsUploading(true);
                const formData = new FormData();
                formData.append('file', file);

                try {
                    const res = await fetch(`${API_URL}/upload`, { method: 'POST', body: formData });
                    if (!res.ok) throw new Error("Falha no upload");
                    const data = await res.json();

                    await fetch(`${API_URL}/send`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contactId: activeContact.id,
                            text: '',
                            mediaUrl: data.url,
                            mediaType: 'audio'
                        })
                    });
                    addToast("Áudio enviado!", "success");
                } catch (e) { addToast("Erro ao enviar áudio", "error"); }
                finally { setIsUploading(false); }
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (e) {
            console.error(e);
            addToast("Erro ao acessar microfone", "error");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop()); // Libera mic
        }
    };

    // --- UPLOAD HANDLER ---
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validação de Tamanho (50MB)
        if (file.size > 50 * 1024 * 1024) {
            addToast("Arquivo muito grande. Máximo 50MB.", "error");
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch(`${API_URL}/upload`, { method: 'POST', body: formData });
            if (!res.ok) throw new Error("Falha no upload");

            const data = await res.json();

            // Determina tipo de mídia
            let mediaType = 'document';
            if (file.type.startsWith('image/')) mediaType = 'image';
            else if (file.type.startsWith('audio/')) mediaType = 'audio';

            // Envia mensagem com mídia
            await fetch(`${API_URL}/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contactId: activeContact.id,
                    text: mediaType === 'document' ? file.name : '', // Nome do arquivo se for doc
                    mediaUrl: data.url,
                    mediaType: mediaType
                })
            });
            addToast("Arquivo enviado!", "success");

        } catch (error) {
            console.error(error);
            addToast("Erro ao enviar arquivo.", "error");
        } finally {
            setIsUploading(false);
            if(fileInputRef.current) fileInputRef.current.value = '';
        }
    };

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
      <div className="flex flex-1 h-full overflow-hidden bg-gray-50">
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
                    {/* Botão de Anexo */}
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                    <button
                        onClick={() => fileInputRef.current.click()}
                        disabled={isUploading}
                        className="p-3.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl transition-colors disabled:opacity-50"
                        title="Anexar Arquivo"
                    >
                        {isUploading ? <Loader2 size={20} className="animate-spin text-blue-600"/> : <Paperclip size={20} />}
                    </button>

                    <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                        placeholder={isRecording ? "Gravando áudio..." : (activeContact.isAiActive ? "⚠️ A IA está respondendo. Digite para assumir..." : "Escreva sua mensagem...")}
                        className={`flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none text-sm transition shadow-inner
                            ${activeContact.isAiActive ? 'placeholder-amber-600/50 border-amber-200 bg-amber-50/30' : ''}
                            ${isRecording ? 'bg-red-50 border-red-200 text-red-600 placeholder-red-400 animate-pulse' : ''}`}
                        rows={1}
                        disabled={isRecording}
                        style={{ minHeight: '52px', maxHeight: '120px' }}
                    />

                    {/* Botão de Áudio (Alterna entre Mic e Stop) */}
                    <button
                        className={`p-3.5 rounded-2xl transition-all duration-200 transform active:scale-95 flex-shrink-0 shadow-lg ${isRecording ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/30' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
                        onClick={isRecording ? stopRecording : startRecording}
                    >
                        {isRecording ? <StopCircle size={20} className="animate-pulse" /> : <Mic size={20} />}
                    </button>

                    <button
                        onClick={handleSendMessage}
                        disabled={!inputText.trim() || isUploading || isRecording}
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

        {showRightPanel && (
            <div className="w-96 bg-white border-l border-gray-200 p-6 flex flex-col h-full animate-in slide-in-from-right overflow-y-auto shadow-xl z-20">
                <div className="flex justify-between items-start mb-6">
                    <h3 className="font-bold text-gray-800 text-lg">Perfil do Cliente</h3>
                    <button onClick={() => setShowRightPanel(false)} className="p-1 hover:bg-gray-100 rounded-full text-gray-500"><X size={20}/></button>
                </div>
                <div className="text-center mb-6">
                    <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl font-bold text-gray-500">{activeContact.avatar}</div>
                    <h3 className="font-bold text-gray-800 text-lg">{activeContact.name}</h3>
                    <p className="text-xs text-gray-500 mt-1 mb-2">{activeContact.id}</p>
                    <StatusBadge isAiActive={activeContact.isAiActive} />
                </div>
                <div className="flex-1 space-y-6">
                    {activeContact.lastTicketReport ? (
                        <div className="animate-in fade-in duration-500"><TriageReportCard report={activeContact.lastTicketReport} /></div>
                    ) : (
                        <div className="p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300 text-center text-sm text-gray-500"><Bot size={24} className="mx-auto mb-2 opacity-30"/><p>Nenhum relatório gerado recentemente.</p></div>
                    )}
                </div>
            </div>
        )}
      </div>
    );
};

export default ChatWindow;
