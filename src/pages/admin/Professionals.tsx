import React, { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { useStaff } from '../../hooks/useStaff';
import { Star, MoreVertical, Edit, Power, FileText, User, Mail, Phone, Calendar, DollarSign, Clock } from 'lucide-react';

const Professionals = () => {
    // Use the hook instead of local fetching
    const { staff, loading, updateStaff, createStaff } = useStaff();
    const [selectedPro, setSelectedPro] = useState<any | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    // Edit Form State
    const [editForm, setEditForm] = useState<any>({});

    const handleEditClick = () => {
        setEditForm({ ...selectedPro });
        setIsEditing(true);
    };

    const handleSave = async () => {
        if (!selectedPro) return;

        // Optimistic UI or wait? Hook waits.
        const res = await updateStaff(selectedPro.id, {
            full_name: editForm.full_name, // Map form fields to DB columns
            specialties: editForm.specialties, // assume string array handled by UI
            // commission: editForm.commission // if implemented
        });

        if (res.success) {
            setIsEditing(false);
            setSelectedPro(null); // Close or refresh details
        } else {
            alert("Erro ao atualizar: " + res.error);
        }
    };

    const handleToggleStatus = async () => {
        if (!selectedPro) return;
        const newStatus = selectedPro.is_active ? false : true; // Schema might use boolean is_active or status string
        // Check schema -> view -> profiles usually has is_active
        await updateStaff(selectedPro.id, { is_active: newStatus });
        setSelectedPro((prev: typeof selectedPro) => prev ? { ...prev, is_active: newStatus, status: newStatus ? 'active' : 'inactive' } : null);
    };

    return (
        <div className="p-8 space-y-8 bg-gray-50 dark:bg-zinc-900 min-h-screen">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gerenciar Profissionais</h1>
                <button
                    onClick={() => alert("Funcionalidade de Novo Profissional requer convite por e-mail (Em breve).")}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors"
                >
                    + Novo Profissional
                </button>
            </div>

            {/* List Table */}
            <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-gray-800">
                        <tr>
                            <th className="p-4 text-sm font-medium text-gray-500">Nome</th>
                            <th className="p-4 text-sm font-medium text-gray-500">Especialidades</th>
                            <th className="p-4 text-sm font-medium text-gray-500">Função</th>
                            <th className="p-4 text-sm font-medium text-gray-500">Status</th>
                            <th className="p-4 text-sm font-medium text-gray-500">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {loading ? (
                            <tr><td colSpan={5} className="p-8 text-center text-gray-500">Carregando...</td></tr>
                        ) : staff.map((pro) => (
                            <tr
                                key={pro.id}
                                onClick={() => setSelectedPro(pro)}
                                className={`cursor-pointer transition-colors ${selectedPro?.id === pro.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}
                            >
                                <td className="p-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                            <User size={20} className="text-gray-400" />
                                        </div>
                                        <span className="font-medium text-gray-900 dark:text-gray-200">{pro.full_name}</span>
                                    </div>
                                </td>
                                <td className="p-4 text-sm text-gray-600 dark:text-gray-400">
                                    {(pro.specialties || []).slice(0, 2).join(', ')}
                                </td>
                                <td className="p-4 text-sm text-gray-600 dark:text-gray-400 capitalize">
                                    {pro.role === 'owner' ? 'Dono' : pro.role === 'manager' ? 'Gerente' : 'Staff'}
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${pro.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {pro.is_active ? 'ATIVO' : 'INATIVO'}
                                    </span>
                                </td>
                                <td className="p-4 text-right">
                                    <button aria-label="Ações do Profissional" className="text-gray-400 hover:text-gray-600"><MoreVertical size={20} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Detail View */}
            {selectedPro && (
                <div className="bg-white dark:bg-surface-dark p-6 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
                    {!isEditing ? (
                        <>
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Detalhes do Profissional</h2>
                                    <p className="text-sm text-gray-500">Informações completas de {selectedPro.full_name}</p>
                                </div>
                                <div className="flex space-x-2">
                                    <button onClick={handleEditClick} className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700">
                                        <Edit size={16} /> <span>Editar</span>
                                    </button>
                                    <button onClick={handleToggleStatus} className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium ${selectedPro.is_active ? 'bg-red-50 hover:bg-red-100 text-red-600' : 'bg-green-50 hover:bg-green-100 text-green-600'}`}>
                                        <Power size={16} /> <span>{selectedPro.is_active ? 'Desativar' : 'Ativar'}</span>
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="flex items-center space-x-3 text-gray-600">
                                        <User size={18} className="text-gray-400" />
                                        <span className="font-medium text-gray-900">{selectedPro.full_name}</span>
                                    </div>
                                    <div className="flex items-center space-x-3 text-gray-600">
                                        <Mail size={18} className="text-gray-400" />
                                        <span>{selectedPro.email || 'Sem e-mail'}</span>
                                    </div>
                                    <div className="flex items-start space-x-3 text-gray-600">
                                        <Star size={18} className="text-gray-400 mt-1" />
                                        <div>
                                            <span className="block mb-1">Especialidades:</span>
                                            <div className="flex flex-wrap gap-2">
                                                {(selectedPro.specialties || []).map((s: string) => (
                                                    <span key={s} className="bg-gray-100 px-2 py-1 rounded text-xs">{s}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-4">
                            <h3 className="font-bold">Editar Profissional</h3>
                            <div className="grid gap-4">
                                <div>
                                    <label htmlFor="pro-name-input" className="block text-sm font-medium text-gray-700">Nome</label>
                                    <input
                                        id="pro-name-input"
                                        type="text"
                                        placeholder="Nome do profissional"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                                        value={editForm.full_name || ''}
                                        onChange={e => setEditForm({ ...editForm, full_name: e.target.value })}
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={handleSave} className="bg-primary text-white px-4 py-2 rounded">Salvar</button>
                                    <button onClick={() => setIsEditing(false)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded">Cancelar</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Professionals;
