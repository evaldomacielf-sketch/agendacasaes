import React, { useState } from 'react';
import { NavProps, ScreenName } from '../../types';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { useFinancials } from '../../hooks/useFinancials';

const FinancialScreen: React.FC<NavProps> = ({ onNavigate }) => {
    const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
    const { transactions, summary, loading, error } = useFinancials();

    const filteredTransactions = transactions.filter(t => filterType === 'all' || t.type === filterType);

    return (
        <DashboardLayout
            currentScreen={ScreenName.DASHBOARD_FINANCIAL}
            onNavigate={onNavigate}
            title="Financeiro"
        >
            <div className="flex flex-col gap-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl shadow-sm border border-[#d2e5dd] dark:border-[#2a4035]">
                        <p className="text-sm font-medium text-slate-500 mb-1">Receitas</p>
                        <p className="text-2xl font-bold text-green-600">R$ {summary.income.toFixed(2)}</p>
                    </div>
                    <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl shadow-sm border border-[#d2e5dd] dark:border-[#2a4035]">
                        <p className="text-sm font-medium text-slate-500 mb-1">Despesas</p>
                        <p className="text-2xl font-bold text-red-500">R$ {summary.expense.toFixed(2)}</p>
                    </div>
                    <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl shadow-sm border border-[#d2e5dd] dark:border-[#2a4035]">
                        <p className="text-sm font-medium text-slate-500 mb-1">Saldo</p>
                        <p className={`text-2xl font-bold ${summary.total >= 0 ? 'text-slate-900 dark:text-white' : 'text-red-500'}`}>
                            R$ {summary.total.toFixed(2)}
                        </p>
                    </div>
                </div>

                {/* Transaction List */}
                <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-[#d2e5dd] dark:border-[#2a4035] overflow-hidden">
                    <div className="p-4 border-b border-[#d2e5dd] dark:border-[#2a4035] flex justify-between items-center">
                        <h3 className="font-bold text-slate-800 dark:text-white">Transações</h3>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setFilterType('all')}
                                className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${filterType === 'all' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600'}`}
                            >
                                Todas
                            </button>
                            <button
                                onClick={() => setFilterType('income')}
                                className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${filterType === 'income' ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                            >
                                Receitas
                            </button>
                            <button
                                onClick={() => setFilterType('expense')}
                                className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${filterType === 'expense' ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-600'}`}
                            >
                                Despesas
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400">
                                <tr>
                                    <th className="px-6 py-3 font-medium">Data</th>
                                    <th className="px-6 py-3 font-medium">Descrição</th>
                                    <th className="px-6 py-3 font-medium">Categoria</th>
                                    <th className="px-6 py-3 font-medium">Valor</th>
                                    <th className="px-6 py-3 font-medium">Método</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-slate-500">Carregando...</td>
                                    </tr>
                                ) : filteredTransactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-slate-500">Nenhuma transação encontrada.</td>
                                    </tr>
                                ) : (
                                    filteredTransactions.map((t) => (
                                        <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                                                {new Date(t.date).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                                                {t.appointment ? `Serviço: ${t.appointment.service?.name}` : 'Transação Avulsa'}
                                                {t.appointment?.client && <span className="block text-xs text-slate-400">{t.appointment.client.name}</span>}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${t.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {t.category || (t.type === 'income' ? 'Venda' : 'Despesa')}
                                                </span>
                                            </td>
                                            <td className={`px-6 py-4 font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                                                {t.type === 'income' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 capitalize">
                                                {t.payment_method || '-'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default FinancialScreen;
