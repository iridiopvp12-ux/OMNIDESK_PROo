import React, { useState, useEffect } from 'react';
import { PlusCircle, Building2, Trash2, X } from 'lucide-react';
import { useToast } from '../ui/Toast';
import { API_URL } from '../../config';

const DepartmentBadge = ({ name, onDelete }) => (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200 flex items-center gap-1 w-max uppercase group">
        <Building2 size={10}/> {name}
        {onDelete && <button onClick={onDelete} className="ml-1 text-purple-900 hover:text-red-600"><X size={10}/></button>}
    </span>
);

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [depts, setDepts] = useState([]);
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'AGENT', departmentId: '' });
    const [newDept, setNewDept] = useState('');
    const { addToast } = useToast();

    useEffect(() => { fetchData(); }, []);

    const fetchData = () => {
        fetch(`${API_URL}/users`).then(r => r.json()).then(setUsers);
        fetch(`${API_URL}/departments`).then(r => r.json()).then(setDepts);
    }

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            await fetch(`${API_URL}/users`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(formData) });
            addToast("Usuário criado com sucesso!", "success");
            setFormData({ name: '', email: '', password: '', role: 'AGENT', departmentId: '' });
            fetchData();
        } catch(e) { addToast("Erro ao criar usuário", "error"); }
    };

    const handleCreateDept = async () => {
        if(!newDept) return;
        try {
            await fetch(`${API_URL}/departments`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({name: newDept}) });
            setNewDept('');
            fetchData();
            addToast("Setor criado!", "success");
        } catch(e) { addToast("Erro ao criar setor", "error"); }
    }

    const handleDeleteUser = async (id) => {
        if(!confirm("Remover usuário?")) return;
        try {
            const res = await fetch(`${API_URL}/users/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error("Falha");
            fetchData();
            addToast("Usuário removido", "success");
        } catch(e) { addToast("Erro ao remover", "error"); }
    }

    const handleDeleteDept = async (id) => {
        if(!confirm("Remover setor?")) return;
        try {
            const res = await fetch(`${API_URL}/departments/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error("Falha");
            fetchData();
            addToast("Setor removido", "success");
        } catch(e) { addToast("Erro ao remover", "error"); }
    }

    return (
        <div className="flex-1 bg-gray-50/50 p-8 h-full overflow-y-auto font-sans">
            <h1 className="text-3xl font-bold text-gray-800 mb-8 tracking-tight">Gestão de Equipe</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
                {/* Form Usuário */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-lg mb-6 text-gray-800">Novo Funcionário</h3>
                    <form onSubmit={handleCreateUser} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <input required placeholder="Nome Completo" className="w-full border border-gray-200 bg-gray-50 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 transition" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                            <input required placeholder="Email" className="w-full border border-gray-200 bg-gray-50 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 transition" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                        </div>
                        <input required type="password" placeholder="Senha" className="w-full border border-gray-200 bg-gray-50 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 transition" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                        <div className="flex gap-4">
                            <select className="flex-1 border border-gray-200 bg-gray-50 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 transition text-gray-600" value={formData.departmentId} onChange={e => setFormData({...formData, departmentId: e.target.value})}>
                                <option value="">Selecione o Setor...</option>
                                {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                            <select className="w-1/3 border border-gray-200 bg-gray-50 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 transition text-gray-600" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                                <option value="AGENT">Agente</option>
                                <option value="ADMIN">Admin</option>
                            </select>
                        </div>
                        <button className="w-full bg-blue-600 text-white py-3.5 rounded-xl hover:bg-blue-700 font-bold shadow-lg shadow-blue-600/20 transition transform active:scale-[0.98]">Cadastrar Colaborador</button>
                    </form>
                </div>

                {/* Form Setor */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-max">
                    <h3 className="font-bold text-lg mb-6 text-gray-800">Criar Setor</h3>
                    <div className="flex gap-2 mb-6">
                        <input placeholder="Ex: Jurídico" className="flex-1 border border-gray-200 bg-gray-50 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-100 transition" value={newDept} onChange={e => setNewDept(e.target.value)} />
                        <button onClick={handleCreateDept} className="bg-purple-600 text-white px-4 rounded-xl hover:bg-purple-700 shadow-lg shadow-purple-600/20 transition"><PlusCircle/></button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {depts.map(d => <DepartmentBadge key={d.id} name={d.name} onDelete={() => handleDeleteDept(d.id)} />)}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs tracking-wider">
                        <tr>
                            <th className="p-5 border-b border-gray-100">Nome</th>
                            <th className="p-5 border-b border-gray-100">Email</th>
                            <th className="p-5 border-b border-gray-100">Setor</th>
                            <th className="p-5 border-b border-gray-100">Função</th>
                            <th className="p-5 border-b border-gray-100 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {users.map(u => (
                            <tr key={u.id} className="hover:bg-blue-50/30 transition">
                                <td className="p-5 font-medium text-gray-900">{u.name}</td>
                                <td className="p-5 text-gray-500">{u.email}</td>
                                <td className="p-5">{u.department ? <DepartmentBadge name={u.department.name} /> : <span className="text-gray-300">-</span>}</td>
                                <td className="p-5"><span className={`text-[10px] font-bold px-2 py-1 rounded-md ${u.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>{u.role}</span></td>
                                <td className="p-5 text-right">
                                    <button onClick={() => handleDeleteUser(u.id)} className="text-red-400 hover:text-red-600 transition"><Trash2 size={18}/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UserManagement;
