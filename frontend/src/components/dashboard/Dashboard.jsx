import React, { useState, useEffect } from 'react';
import { PieChart, Search, FileText, CheckCircle, Clock } from 'lucide-react';
import { API_URL } from '../../config';

const Dashboard = () => {
    const [stats, setStats] = useState({ total: 0, open: 0, done: 0, contacts: 0 });
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetch(`${API_URL}/dashboard/stats`)
            .then(r => r.json())
            .then(setStats)
            .catch(console.error);
    }, []);

    const handleSearch = async (e) => {
        const term = e.target.value;
        setSearchTerm(term);
        if (term.length < 3) {
            setSearchResults([]);
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/dashboard/search?q=${term}`);
            const data = await res.json();
            setSearchResults(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 bg-gray-50/50 p-8 h-full overflow-y-auto font-sans">
            <h1 className="text-3xl font-bold text-gray-800 mb-8 tracking-tight">Dashboard & Histórico</h1>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-4 bg-blue-50 text-blue-600 rounded-xl"><FileText size={24}/></div>
                    <div><p className="text-sm text-gray-500 font-medium">Total Tickets</p><h3 className="text-2xl font-bold text-gray-900">{stats.total}</h3></div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-4 bg-yellow-50 text-yellow-600 rounded-xl"><Clock size={24}/></div>
                    <div><p className="text-sm text-gray-500 font-medium">Em Aberto</p><h3 className="text-2xl font-bold text-gray-900">{stats.open}</h3></div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-4 bg-green-50 text-green-600 rounded-xl"><CheckCircle size={24}/></div>
                    <div><p className="text-sm text-gray-500 font-medium">Finalizados</p><h3 className="text-2xl font-bold text-gray-900">{stats.done}</h3></div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-4 bg-purple-50 text-purple-600 rounded-xl"><PieChart size={24}/></div>
                    <div><p className="text-sm text-gray-500 font-medium">Contatos</p><h3 className="text-2xl font-bold text-gray-900">{stats.contacts}</h3></div>
                </div>
            </div>

            {/* Search Section */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
                <div className="p-6 border-b border-gray-100">
                    <h3 className="font-bold text-lg text-gray-800 mb-4">Pesquisa de Arquivo Morto</h3>
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por ID, Cliente ou Assunto..."
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                            value={searchTerm}
                            onChange={handleSearch}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs">
                            <tr>
                                <th className="p-5">ID</th>
                                <th className="p-5">Data</th>
                                <th className="p-5">Cliente</th>
                                <th className="p-5">Assunto</th>
                                <th className="p-5">Status</th>
                                <th className="p-5">Atendente</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {searchResults.length > 0 ? searchResults.map(ticket => (
                                <tr key={ticket.id} className="hover:bg-blue-50/30 transition">
                                    <td className="p-5 font-mono text-xs text-gray-500">#{ticket.id.slice(0,8)}</td>
                                    <td className="p-5 text-gray-600">{new Date(ticket.createdAt).toLocaleDateString()}</td>
                                    <td className="p-5 font-medium text-gray-900">{ticket.contact?.name || 'Desconhecido'}</td>
                                    <td className="p-5 text-gray-600 max-w-xs truncate" title={ticket.title}>{ticket.title}</td>
                                    <td className="p-5">
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${ticket.status === 'done' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                            {ticket.status === 'done' ? 'Finalizado' : ticket.status}
                                        </span>
                                    </td>
                                    <td className="p-5 text-gray-500">{ticket.assignedTo?.name || '-'}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="6" className="p-10 text-center text-gray-400">
                                        {loading ? "Buscando..." : (searchTerm.length < 3 ? "Digite pelo menos 3 caracteres para buscar." : "Nenhum resultado encontrado.")}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
