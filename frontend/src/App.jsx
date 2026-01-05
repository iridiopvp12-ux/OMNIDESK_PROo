import React, { useState, useEffect, useRef, useCallback } from 'react';
import Sidebar from './components/layout/Sidebar';
import Login from './components/auth/Login';
import ChatList from './components/chat/ChatList';
import ChatWindow from './components/chat/ChatWindow';
import TicketBoard from './components/tickets/TicketBoard';
import UserManagement from './components/users/UserManagement';
import Dashboard from './components/dashboard/Dashboard';
import { ToastProvider, useToast } from './components/ui/Toast';
import { API_URL } from './config';

// Wrapper para usar o hook de Toast dentro do App
const AppContent = () => {
  const [currentUser, setCurrentUser] = useState(null); 
  const [contacts, setContacts] = useState([]); 
  const [tickets, setTickets] = useState([]); 
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [activeTab, setActiveTab] = useState('chat');
  const [showRightPanel, setShowRightPanel] = useState(false);
  
  const messagesEndRef = useRef(null); 
  const chatContainerRef = useRef(null); 
  const [isScrolledUp, setIsScrolledUp] = useState(false); 
  const prevMessagesLength = useRef(0);

  const { addToast } = useToast();

  const activeContact = contacts.find(c => c.id === selectedChatId);

  // Polling de Contatos
  const fetchContacts = useCallback(async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`${API_URL}/contacts`);
      const data = await res.json();
      if (!Array.isArray(data)) return;
      const formattedContacts = data.map(c => ({
        id: c.id,
        name: c.name || c.pushName || c.id.split('@')[0], 
        avatar: (c.name || c.pushName || c.id)[0].toUpperCase(),
        lastMsg: c.messages[0]?.content || 'Nova conversa',
        time: c.messages[0]?.createdAt ? new Date(c.messages[0].createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '',
        isAiActive: c.isAiActive,
        lastTicketReport: c.tickets && c.tickets.length > 0 ? c.tickets[0].summary : null
      }));
      setContacts(formattedContacts);
    } catch (error) { console.error("Erro API Contatos", error); }
  }, [currentUser]);

  useEffect(() => { fetchContacts(); const interval = setInterval(fetchContacts, 3000); return () => clearInterval(interval); }, [fetchContacts]);

  // Polling de Tickets
  const fetchTickets = useCallback(async () => {
    if (!currentUser) return;
    try {
        const res = await fetch(`${API_URL}/tickets`);
        const data = await res.json();
        if (Array.isArray(data)) {
            setTickets(data.map(t => ({...t, contactName: t.contact?.name || t.contactId})));
        }
    } catch (error) { console.error("Erro API Tickets", error); }
  }, [currentUser]);

  useEffect(() => {
      if (activeTab === 'tickets') { fetchTickets(); const interval = setInterval(fetchTickets, 5000); return () => clearInterval(interval); }
  }, [activeTab, fetchTickets]);

  // Polling de Mensagens
  useEffect(() => {
    if (!selectedChatId) return;
    const fetchMessages = async () => {
      try {
        const res = await fetch(`${API_URL}/messages/${selectedChatId}`);
        const data = await res.json();
        if (!Array.isArray(data)) return;
        const formattedMessages = data.map(m => ({
          id: m.id,
          text: m.content,
          sender: m.fromMe ? 'agent' : 'user', 
          isAi: m.isAi,
          time: new Date(m.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          mediaType: m.mediaType,
          mediaUrl: m.mediaUrl
        }));
        setMessages(prev => { if (prev.length !== formattedMessages.length) return formattedMessages; return prev; });
      } catch (error) { console.error("Erro API Mensagens", error); }
    };
    fetchMessages();
    const interval = setInterval(fetchMessages, 2000); 
    return () => clearInterval(interval);
  }, [selectedChatId]);

  // Scroll Logic
  useEffect(() => { prevMessagesLength.current = 0; setIsScrolledUp(false); }, [selectedChatId]);
  useEffect(() => {
    if (messagesEndRef.current && chatContainerRef.current) {
        const currentLength = messages.length;
        const prevLength = prevMessagesLength.current;
        if (prevLength === 0 && currentLength > 0) messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
        else if (currentLength > prevLength && !isScrolledUp) messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        prevMessagesLength.current = currentLength;
    }
  }, [messages, isScrolledUp]);

  const handleScroll = useCallback(() => {
    if (chatContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
        const isNearBottom = scrollHeight - scrollTop <= clientHeight + 200; 
        if (isScrolledUp === isNearBottom) setIsScrolledUp(!isNearBottom);
    }
  }, [isScrolledUp]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || !selectedChatId) return;
    const textToSend = inputText;
    setInputText(''); 
    const optimisticMsg = { id: Date.now(), text: textToSend, sender: 'agent', isAi: false, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) };
    setMessages(prevMessages => [...prevMessages, optimisticMsg]);
    setIsScrolledUp(false); 
    try {
      await fetch(`${API_URL}/send`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contactId: selectedChatId, text: textToSend }) });
    } catch (error) { setMessages(prevMessages => prevMessages.filter(m => m.id !== optimisticMsg.id)); addToast("Erro ao enviar mensagem", "error"); }
  };

  const toggleAi = async () => {
    if (!selectedChatId) return;
    const contact = contacts.find(c => c.id === selectedChatId);
    if (!contact) return;
    const newState = !contact.isAiActive;
    try {
        setContacts(prev => prev.map(c => c.id === selectedChatId ? { ...c, isAiActive: newState } : c));
        await fetch(`${API_URL}/contacts/${selectedChatId}/toggle-ai`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isAiActive: newState }) });
        addToast(newState ? "IA ativada para este contato" : "IA desativada. Modo manual.", "info");
    } catch (error) { addToast("Erro ao alterar estado da IA", "error"); }
  };

  // --- NEW FEATURES ---
  const handleEditContact = async () => {
      const newName = prompt("Novo nome para o contato:", activeContact?.name);
      if (newName && newName !== activeContact.name) {
          try {
              const res = await fetch(`${API_URL}/contacts/${activeContact.id}`, {
                  method: 'PUT', headers: {'Content-Type': 'application/json'},
                  body: JSON.stringify({ name: newName })
              });
              if (!res.ok) throw new Error("Falha na atualização");
              addToast("Contato atualizado!", "success");
              fetchContacts();
          } catch(e) { addToast("Erro ao atualizar contato", "error"); }
      }
  };

  const handleDeleteContact = async () => {
      if(confirm("Tem certeza? Isso apagará todo o histórico e tickets deste contato.")) {
          try {
              const res = await fetch(`${API_URL}/contacts/${activeContact.id}`, { method: 'DELETE' });
              if (!res.ok) throw new Error("Falha na exclusão");
              addToast("Conversa excluída.", "success");
              setSelectedChatId(null);
              fetchContacts();
          } catch(e) { addToast("Erro ao excluir conversa", "error"); }
      }
  };

  if (!currentUser) return <Login onLogin={setCurrentUser} />;

  return (
    <div className="flex h-screen w-full font-sans bg-gray-100 overflow-hidden text-gray-900">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={() => setCurrentUser(null)} />

      <div className="flex-1 h-full relative flex">
        {activeTab === 'chat' && (
            <>
                <ChatList
                    contacts={contacts}
                    selectedChatId={selectedChatId}
                    setSelectedChatId={setSelectedChatId}
                />
                <ChatWindow
                    activeContact={activeContact}
                    messages={messages}
                    inputText={inputText}
                    setInputText={setInputText}
                    handleSendMessage={handleSendMessage}
                    toggleAi={toggleAi}
                    showRightPanel={showRightPanel}
                    setShowRightPanel={setShowRightPanel}
                    chatContainerRef={chatContainerRef}
                    messagesEndRef={messagesEndRef}
                    handleScroll={handleScroll}
                    onEditContact={handleEditContact}
                    onDeleteContact={handleDeleteContact}
                />
            </>
        )}
        {activeTab === 'tickets' && (
            <TicketBoard
                tickets={tickets}
                currentUser={currentUser}
                setActiveTab={setActiveTab}
                setSelectedChatId={setSelectedChatId}
                setShowRightPanel={setShowRightPanel}
                refreshData={() => { fetchTickets(); fetchContacts(); }}
            />
        )}
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'users' && <UserManagement />}
      </div>
    </div>
  );
};

export default function App() {
    return (
        <ToastProvider>
            <AppContent />
        </ToastProvider>
    );
}
