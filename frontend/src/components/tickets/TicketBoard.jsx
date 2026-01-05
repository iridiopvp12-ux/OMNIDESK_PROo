import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { AlertTriangle, FileText, CheckCircle, MessageSquare, X, Building2, User } from 'lucide-react';
import { useToast } from '../ui/Toast';
import { API_URL } from '../../config';
import TriageReportCard from './TriageReportCard';

const DepartmentBadge = ({ name }) => (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200 flex items-center gap-1 w-max uppercase">
        <Building2 size={10}/> {name}
    </span>
);

const TicketBoard = ({ tickets, currentUser, setActiveTab, setSelectedChatId, setShowRightPanel, refreshData }) => {
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [closingNote, setClosingNote] = useState("");
    const [showCloseInput, setShowCloseInput] = useState(false);
    const { addToast } = useToast();

    // Organiza colunas
    const columns = {
        todo: { id: 'todo', label: 'Triagem / Entrada', color: 'border-t-red-500', bg: 'bg-red-50/50', list: tickets.filter(t => t.status === 'todo') },
        doing: { id: 'doing', label: 'Em Atendimento', color: 'border-t-blue-500', bg: 'bg-blue-50/50', list: tickets.filter(t => t.status === 'doing') },
        done: { id: 'done', label: 'Finalizados', color: 'border-t-green-500', bg: 'bg-green-50/50', list: tickets.filter(t => t.status === 'done') }
    };

    const handleDragEnd = async (result) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        const ticketId = draggableId;
        const newStatus = destination.droppableId;
        const oldStatus = source.droppableId;

        // Optimistic UI update (optional, but skipping for simplicity as we refresh)

        try {
            // Lógica de Negócio ao Mover
            if (newStatus === 'doing' && oldStatus !== 'doing') {
                // Assumir Ticket
                const res = await fetch(`${API_URL}/tickets/${ticketId}/assign`, {
                    method: 'POST', headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ userId: currentUser.id })
                });
                if(!res.ok) throw new Error("Erro ao assumir");

                // Desativa IA
                const ticket = tickets.find(t => t.id === ticketId);
                if(ticket) {
                    await fetch(`${API_URL}/contacts/${ticket.contactId}/toggle-ai`, {
                        method: 'POST', headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({ isAiActive: false })
                    });
                }
                addToast("Chamado assumido!", "success");

            } else if (newStatus === 'done' && oldStatus !== 'done') {
                const res = await fetch(`${API_URL}/tickets/${ticketId}/close`, {
                    method: 'POST', headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ closingNote: "Finalizado via Kanban" })
                });
                if(!res.ok) throw new Error("Erro ao finalizar");
                addToast("Chamado finalizado.", "success");

            } else if (newStatus === 'todo') {
                const res = await fetch(`${API_URL}/tickets/${ticketId}`, {
                    method: 'PUT', headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ status: 'todo', assignedToId: null })
                });
                if(!res.ok) throw new Error("Erro ao mover");
                addToast("Retornado para fila.", "info");
            } else {
                 const res = await fetch(`${API_URL}/tickets/${ticketId}`, {
                    method: 'PUT', headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ status: newStatus })
                });
                if(!res.ok) throw new Error("Erro ao mover");
            }

            if (refreshData) refreshData();

        } catch (e) {
            console.error(e);
            addToast("Erro ao mover card.", "error");
            if (refreshData) refreshData(); // Reverte visual
        }
    };

    const handleViewProfile = () => {
        if (!selectedTicket) return;
        setSelectedChatId(selectedTicket.contactId);
        setActiveTab('chat');
        setShowRightPanel(true);
        setSelectedTicket(null);
    };

    // Actions
    const handleTakeOwnership = async () => {
        if(!selectedTicket) return;
        try {
            await fetch(`${API_URL}/tickets/${selectedTicket.id}/assign`, {
                method: 'POST', headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ userId: currentUser.id })
            });
            await fetch(`${API_URL}/contacts/${selectedTicket.contactId}/toggle-ai`, {
                method: 'POST', headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ isAiActive: false })
            });
            addToast("Você assumiu o chamado!", "success");
            handleViewProfile(); // Já redireciona
        } catch (e) { addToast("Erro ao assumir chamado.", "error"); }
    };

    const handleCloseTicket = async () => {
        if(!selectedTicket) return;
        try {
            await fetch(`${API_URL}/tickets/${selectedTicket.id}/close`, {
                method: 'POST', headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ closingNote })
            });
            addToast("Chamado encerrado.", "success");
            setShowCloseInput(false);
            setClosingNote("");
            setSelectedTicket(null);
            if(refreshData) refreshData();
        } catch (e) { addToast("Erro ao encerrar chamado.", "error"); }
    };

    return (
        <div className="flex-1 bg-gray-50/50 p-8 h-full overflow-y-auto flex flex-col relative font-sans">
            <h1 className="text-3xl font-bold text-gray-800 mb-8 tracking-tight">Central de Chamados</h1>

            <DragDropContext onDragEnd={handleDragEnd}>
                <div className="flex-1 overflow-x-auto pb-4">
                    <div className="flex gap-6 h-full min-w-[1000px]">
                        {Object.values(columns).map(col => (
                            <Droppable key={col.id} droppableId={col.id}>
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className={`w-80 flex flex-col h-full rounded-2xl transition-colors ${snapshot.isDraggingOver ? 'bg-blue-50/50 ring-2 ring-blue-100' : ''}`}
                                    >
                                        <div className={`flex justify-between items-center mb-4 px-3 py-2 rounded-lg ${col.bg} border border-transparent`}>
                                            <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide">{col.label}</h3>
                                            <div className="flex items-center gap-2">
                                                {col.id === 'done' && <button onClick={() => setActiveTab('dashboard')} className="text-[10px] text-blue-600 hover:underline font-bold">Ver Todos</button>}
                                                <span className="bg-white text-gray-600 text-xs px-2 py-0.5 rounded-full shadow-sm font-mono">{col.list.length}</span>
                                            </div>
                                        </div>

                                        <div className="bg-gray-100/50 p-2 rounded-2xl h-full space-y-3 border border-gray-200 overflow-y-auto custom-scrollbar min-h-[200px]">
                                            {col.list.map((ticket, index) => (
                                                <Draggable key={ticket.id} draggableId={ticket.id} index={index}>
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            onClick={() => { setSelectedTicket(ticket); setShowCloseInput(false); }}
                                                            className={`bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer relative group ${col.color} border-t-4 active:scale-[0.98]
                                                                ${snapshot.isDragging ? 'shadow-xl rotate-2 ring-2 ring-blue-400 z-50' : ''}`}
                                                            style={{ ...provided.draggableProps.style }}
                                                        >
                                                            <div className="flex justify-between items-start mb-3">
                                                                <span className="text-[10px] text-gray-400 font-mono bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">#{ticket.id.slice(0,6)}</span>
                                                                {ticket.priority === 'high' && <AlertTriangle size={14} className="text-red-500 animate-pulse" />}
                                                            </div>
                                                            <div className="mb-4">
                                                                <h4 className="font-bold text-gray-800 text-sm leading-tight mb-1">{ticket.contactName || 'Desconhecido'}</h4>
                                                                <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{ticket.title}</p>
                                                            </div>
                                                            <div className="flex items-center justify-between mt-auto">
                                                                <div className="flex gap-2">
                                                                    {ticket.department && <DepartmentBadge name={ticket.department.name} />}
                                                                </div>
                                                                {ticket.summary && <div className="text-orange-500" title="Relatório IA"><FileText size={14}/></div>}
                                                            </div>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                    </div>
                                )}
                            </Droppable>
                        ))}
                    </div>
                </div>
            </DragDropContext>

            {selectedTicket && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-200 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/80 backdrop-blur-md">
                            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Ticket #{selectedTicket.id.slice(0,8)}</span>
                            <button onClick={() => setSelectedTicket(null)} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition hover:rotate-90"><X size={20} /></button>
                        </div>

                        <div className="p-8 overflow-y-auto custom-scrollbar">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedTicket.contactName}</h2>
                                    <p className="text-gray-600">{selectedTicket.title}</p>
                                </div>
                                <button onClick={handleViewProfile} className="flex items-center gap-2 text-blue-600 font-bold text-sm bg-blue-50 px-3 py-2 rounded-lg hover:bg-blue-100 transition">
                                    <User size={16}/> Ver Perfil Completo
                                </button>
                            </div>

                            {selectedTicket.summary && (
                                <TriageReportCard report={selectedTicket.summary} />
                            )}

                            <div className="mt-8 pt-8 border-t border-gray-100 space-y-4">
                                {selectedTicket.status === 'todo' && (
                                    <button onClick={handleTakeOwnership} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-sm hover:bg-blue-700 transition shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transform hover:-translate-y-1">
                                        ✋ Assumir Tratativa e Ir para Chat
                                    </button>
                                )}

                                {selectedTicket.status === 'doing' && !showCloseInput && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <button onClick={handleViewProfile} className="col-span-1 bg-white text-blue-700 py-3 rounded-xl font-bold text-sm hover:bg-blue-50 transition flex items-center justify-center gap-2 border border-blue-200 shadow-sm">
                                            <MessageSquare size={16}/> Ir para Chat
                                        </button>
                                        <button onClick={() => setShowCloseInput(true)} className="col-span-1 bg-green-50 text-green-700 py-3 rounded-xl font-bold text-sm hover:bg-green-100 transition flex items-center justify-center gap-2 border border-green-200 shadow-sm">
                                            <CheckCircle size={16}/> Encerrar Chamado
                                        </button>
                                    </div>
                                )}

                                {showCloseInput && (
                                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 animate-in fade-in slide-in-from-bottom-4">
                                        <label className="text-xs font-bold text-gray-500 uppercase mb-3 block">Nota de Encerramento:</label>
                                        <textarea
                                            value={closingNote} onChange={e => setClosingNote(e.target.value)}
                                            className="w-full border border-gray-300 p-3 rounded-lg text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition"
                                            rows={3} placeholder="Descreva brevemente a solução..."
                                        />
                                        <div className="flex gap-3">
                                            <button onClick={() => setShowCloseInput(false)} className="flex-1 py-2.5 text-gray-600 hover:bg-gray-200 rounded-lg text-sm font-medium transition">Cancelar</button>
                                            <button onClick={handleCloseTicket} className="flex-1 py-2.5 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition shadow-lg shadow-green-600/20">Confirmar Encerramento</button>
                                        </div>
                                    </div>
                                )}

                                {selectedTicket.status === 'done' && (
                                    <div className="bg-gray-100 text-gray-500 p-4 rounded-xl text-center text-sm font-medium border border-gray-200">
                                        Este chamado foi encerrado.
                                        {selectedTicket.closingNote && <p className="text-xs mt-2 italic text-gray-600 bg-white p-2 rounded border border-gray-200">"{selectedTicket.closingNote}"</p>}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TicketBoard;
