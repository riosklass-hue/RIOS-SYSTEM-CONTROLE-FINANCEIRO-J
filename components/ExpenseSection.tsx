
import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Edit2, X, Wallet, Loader2 } from 'lucide-react';
import { Expense, ExpenseLocal } from '../types';
import { formatCurrency } from '../utils/calculations';

interface Props {
  expenses: Expense[];
  onAdd: (expense: Expense) => void;
  onUpdate: (expense: Expense) => void;
  onDelete: (id: string) => void;
}

export const ExpenseSection: React.FC<Props> = ({ expenses, onAdd, onUpdate, onDelete }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<Expense>>({
    data: new Date().toISOString().split('T')[0],
    nome: '',
    local: ExpenseLocal.PIX,
    valor: undefined
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.nome && formData.data && formData.valor !== undefined) {
      setIsSubmitting(true);
      try {
        const expenseData = {
          ...formData,
          valor: Number(formData.valor) || 0,
        } as Expense;

        if (editingId) {
          await onUpdate({ ...expenseData, id: editingId });
          setEditingId(null);
        } else {
          await onAdd({ ...expenseData, id: crypto.randomUUID() });
        }
        
        setFormData(prev => ({ 
          ...prev, 
          nome: '', 
          valor: undefined 
        }));
      } catch (err) {
        console.error("Erro ao salvar despesa:", err);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingId(expense.id);
    setFormData({
      data: expense.data,
      nome: expense.nome,
      local: expense.local || ExpenseLocal.PIX,
      valor: expense.valor
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({
      data: new Date().toISOString().split('T')[0],
      nome: '',
      local: ExpenseLocal.PIX,
      valor: undefined
    });
  };

  const totalsByLocal = useMemo(() => {
    return expenses.reduce((acc, curr) => {
      const loc = curr.local || ExpenseLocal.OUTROS;
      acc[loc] = (acc[loc] || 0) + (curr.valor || 0);
      return acc;
    }, {
      [ExpenseLocal.PIX]: 0,
      [ExpenseLocal.COFRE]: 0,
      [ExpenseLocal.OUTROS]: 0
    } as Record<ExpenseLocal, number>);
  }, [expenses]);

  // Fix: Explicitly cast to number[] to avoid 'unknown' type errors during reduce
  const totalGeral = (Object.values(totalsByLocal) as number[]).reduce((a, b) => a + b, 0);

  const inputClasses = "w-full px-3 py-2 bg-[#1e293b] border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 focus:outline-none transition-all placeholder-slate-500 shadow-inner";
  const labelClasses = "block text-[10px] font-black text-slate-500 uppercase mb-2 tracking-[0.1em]";

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário */}
        <div className={`lg:col-span-2 bg-[#0f172a] p-6 rounded-3xl shadow-2xl border transition-all duration-300 ${editingId ? 'border-amber-500/40 bg-amber-500/5' : 'border-slate-800'}`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${editingId ? 'bg-amber-500/20' : 'bg-rose-500/20'}`}>
                {editingId ? <Edit2 className="w-5 h-5 text-amber-500" /> : <Plus className="w-5 h-5 text-rose-500" />}
              </div>
              <div>
                <h2 className="text-sm font-black text-white uppercase tracking-widest leading-none">
                  {editingId ? 'Editar Saída' : 'Registrar Saída'}
                </h2>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter mt-1">Lançamento de fluxo de caixa</p>
              </div>
            </div>
            {editingId && (
              <button onClick={cancelEdit} className="px-3 py-1.5 bg-slate-800 text-slate-400 hover:text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all">
                Cancelar
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClasses}>Data do Gasto</label>
              <input type="date" disabled={isSubmitting} className={inputClasses} value={formData.data} onChange={e => setFormData({ ...formData, data: e.target.value })} required />
            </div>
            <div>
              <label className={labelClasses}>Canal de Saída</label>
              <select disabled={isSubmitting} className={inputClasses} value={formData.local} onChange={e => setFormData({ ...formData, local: e.target.value as ExpenseLocal })}>
                <option value={ExpenseLocal.PIX}>PIX</option>
                <option value={ExpenseLocal.COFRE}>COFRE</option>
                <option value={ExpenseLocal.OUTROS}>OUTROS</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className={labelClasses}>Descrição do Gasto (Nome)</label>
              <input type="text" disabled={isSubmitting} placeholder="Ex: Fornecedor, Marketing, Internet..." className={inputClasses} value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })} required />
            </div>
            <div>
              <label className={labelClasses}>Valor (R$)</label>
              <input type="number" step="0.01" disabled={isSubmitting} placeholder="0,00" className={inputClasses} value={formData.valor ?? ''} onChange={e => setFormData({ ...formData, valor: e.target.value === '' ? undefined : parseFloat(e.target.value) })} required />
            </div>
            <div className="flex items-end">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className={`w-full text-white px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg ${editingId ? 'bg-amber-600 hover:bg-amber-500' : 'bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800'}`}
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingId ? 'Salvar Alteração' : 'Registrar')}
              </button>
            </div>
          </form>
        </div>

        {/* Resumo Canais */}
        <div className="bg-[#0f172a] p-6 rounded-3xl shadow-2xl border border-slate-800 h-fit">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-slate-800 rounded-xl">
              <Wallet className="w-5 h-5 text-slate-400" />
            </div>
            <h2 className="text-xs font-black text-white uppercase tracking-[0.2em]">Canais</h2>
          </div>
          <div className="space-y-3">
            {Object.entries(totalsByLocal).map(([name, total]) => (
              <div key={name} className="flex justify-between items-center p-4 bg-slate-900/50 rounded-2xl border border-slate-800/50 hover:border-slate-700 transition-all group">
                <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{name}</span>
                {/* Fix: Cast 'total' to number to resolve unknown type error */}
                <span className="font-bold text-white text-sm">{formatCurrency(total as number)}</span>
              </div>
            ))}
            <div className="pt-4 mt-2 border-t border-slate-800/50">
              <div className="flex justify-between items-center p-4 bg-rose-500/10 rounded-2xl border border-rose-500/20">
                <span className="text-rose-500 font-black uppercase text-[10px] tracking-[0.2em]">Total Geral</span>
                {/* Fix: Cast 'totalGeral' to number to resolve unknown type error */}
                <span className="font-black text-rose-500 text-lg">{formatCurrency(totalGeral as number)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Lançamentos */}
      <div className="bg-[#0f172a] rounded-3xl shadow-2xl border border-slate-800 overflow-hidden mt-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-900/50 text-slate-500 text-[9px] font-black uppercase tracking-widest border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Data</th>
                <th className="px-6 py-4">Descrição</th>
                <th className="px-6 py-4">Canal</th>
                <th className="px-6 py-4">Valor</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-600 italic bg-[#0f172a] uppercase text-[10px] font-bold tracking-widest">
                    Nenhum registro encontrado.
                  </td>
                </tr>
              ) : (
                expenses.map((row) => (
                  <tr key={row.id} className={`hover:bg-slate-800/20 transition-all duration-200 group ${editingId === row.id ? 'bg-amber-500/5' : ''}`}>
                    <td className="px-6 py-4 font-mono text-slate-500 text-[10px]">{new Date(row.data).toLocaleDateString('pt-BR')}</td>
                    <td className="px-6 py-4 font-bold text-white text-[11px] uppercase tracking-tighter">{row.nome}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-[0.15em] border ${
                        row.local === ExpenseLocal.PIX ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 
                        row.local === ExpenseLocal.COFRE ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                        'bg-slate-500/10 text-slate-400 border-slate-500/20'
                      }`}>
                        {row.local || 'OUTROS'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-black text-rose-500 text-xs">{formatCurrency(row.valor)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-30 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(row)} className="p-2 text-slate-400 hover:text-blue-400 bg-slate-800/50 rounded-lg hover:bg-blue-400/10 transition-all">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => onDelete(row.id)} className="p-2 text-slate-500 hover:text-rose-500 bg-slate-800/50 rounded-lg hover:bg-rose-500/10 transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
