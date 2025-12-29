
import React, { useState } from 'react';
import { Plus, Trash2, Edit2, X } from 'lucide-react';
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
  const [formData, setFormData] = useState<Partial<Expense>>({
    data: new Date().toISOString().split('T')[0],
    nome: '',
    local: ExpenseLocal.PIX,
    valor: undefined
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.nome && formData.data) {
      const expenseData = {
        ...formData,
        valor: Number(formData.valor) || 0,
      } as Expense;

      if (editingId) {
        onUpdate({ ...expenseData, id: editingId });
        setEditingId(null);
      } else {
        onAdd({ ...expenseData, id: crypto.randomUUID() });
      }
      
      setFormData(prev => ({ ...prev, nome: '', valor: undefined }));
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingId(expense.id);
    setFormData({
      data: expense.data,
      nome: expense.nome,
      local: expense.local,
      valor: expense.valor
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData(prev => ({ ...prev, nome: '', valor: undefined }));
  };

  const totalPix = expenses.filter(e => e.local === ExpenseLocal.PIX).reduce((acc, curr) => acc + curr.valor, 0);
  const totalCofre = expenses.filter(e => e.local === ExpenseLocal.COFRE).reduce((acc, curr) => acc + curr.valor, 0);

  const inputClasses = "w-full px-2 py-1.5 bg-[#1e293b] border border-slate-700 rounded-lg text-xs text-white focus:ring-1 focus:ring-rose-500 focus:outline-none transition-all placeholder-slate-500";
  const labelClasses = "block text-[9px] font-bold text-slate-400 uppercase mb-1.5 tracking-widest";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className={`lg:col-span-2 bg-[#0f172a] p-4 rounded-xl shadow-2xl border transition-all ${editingId ? 'border-amber-500/50' : 'border-slate-800'}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold flex items-center gap-2 text-white uppercase tracking-wider">
              <div className={`p-1 rounded-md ${editingId ? 'bg-amber-500/10' : 'bg-rose-500/10'}`}>
                {editingId ? <Edit2 className="w-4 h-4 text-amber-500" /> : <Plus className="w-4 h-4 text-rose-500" />}
              </div>
              {editingId ? 'Editar Saída' : 'Registrar Saída'}
            </h2>
            {editingId && (
              <button onClick={cancelEdit} className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1">
                <X className="w-3 h-3" /> Cancelar
              </button>
            )}
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClasses}>Data</label>
              <input type="date" className={inputClasses} value={formData.data} onChange={e => setFormData({ ...formData, data: e.target.value })} required />
            </div>
            <div>
              <label className={labelClasses}>Canal</label>
              <select className={inputClasses} value={formData.local} onChange={e => setFormData({ ...formData, local: e.target.value as ExpenseLocal })}>
                <option value={ExpenseLocal.PIX} className="bg-[#0f172a]">PIX</option>
                <option value={ExpenseLocal.COFRE} className="bg-[#0f172a]">COFRE</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className={labelClasses}>Descrição (Nome)</label>
              <input type="text" placeholder="Ex: Fornecedor..." className={inputClasses} value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })} required />
            </div>
            <div className="md:col-span-1">
              <label className={labelClasses}>Valor (R$)</label>
              <input type="number" step="0.01" className={inputClasses} value={formData.valor ?? ''} onChange={e => setFormData({ ...formData, valor: e.target.value === '' ? undefined : parseFloat(e.target.value) })} required />
            </div>
            <div className="flex items-end">
              <button type="submit" className={`w-full text-white px-2 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all h-[34px] ${editingId ? 'bg-amber-600 hover:bg-amber-500' : 'bg-rose-600 hover:bg-rose-700'}`}>
                {editingId ? 'Salvar' : 'Registrar'}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-[#0f172a] p-4 rounded-xl shadow-2xl border border-slate-800 h-fit">
          <h2 className="text-xs font-bold mb-3 text-white uppercase tracking-wider">Canais</h2>
          <div className="space-y-2">
            <div className="flex justify-between items-center px-3 py-2 bg-slate-900/50 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-[9px] font-bold uppercase">PIX</span>
              <span className="font-bold text-white text-xs">{formatCurrency(totalPix)}</span>
            </div>
            <div className="flex justify-between items-center px-3 py-2 bg-slate-900/50 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-[9px] font-bold uppercase">Cofre</span>
              <span className="font-bold text-white text-xs">{formatCurrency(totalCofre)}</span>
            </div>
            <div className="flex justify-between items-center px-3 py-2 bg-rose-900/20 rounded-lg border border-rose-900/40">
              <span className="text-rose-400 font-bold uppercase text-[9px]">Total</span>
              <span className="font-black text-rose-500 text-sm">{formatCurrency(totalPix + totalCofre)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#0f172a] rounded-xl shadow-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-900/50 text-slate-500 border-b border-slate-800">
              <tr>
                <th className="px-4 py-2 font-bold uppercase text-[9px]">Data</th>
                <th className="px-4 py-2 font-bold uppercase text-[9px]">Descrição</th>
                <th className="px-4 py-2 font-bold uppercase text-[9px]">Canal</th>
                <th className="px-4 py-2 font-bold uppercase text-[9px]">Valor</th>
                <th className="px-4 py-2 text-right font-bold uppercase text-[9px]">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-500 italic bg-[#0f172a]">
                    Sem dados registrados na nuvem.
                  </td>
                </tr>
              ) : (
                expenses.map((row) => (
                  <tr key={row.id} className={`hover:bg-slate-800/20 transition-colors bg-[#0f172a] ${editingId === row.id ? 'bg-amber-500/5' : ''}`}>
                    <td className="px-4 py-2 font-mono text-slate-400 text-[10px]">{new Date(row.data).toLocaleDateString('pt-BR')}</td>
                    <td className="px-4 py-2 font-medium text-white text-[11px]">{row.nome}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${row.local === ExpenseLocal.PIX ? 'bg-indigo-900/50 text-indigo-400' : 'bg-amber-900/50 text-amber-400'}`}>
                        {row.local || '---'}
                      </span>
                    </td>
                    <td className="px-4 py-2 font-black text-rose-500 text-[11px]">{formatCurrency(row.valor)}</td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleEdit(row)} className="p-1 text-slate-500 hover:text-blue-400 bg-slate-800/30 rounded-md transition-colors">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => onDelete(row.id)} className="p-1 text-slate-600 hover:text-rose-500 bg-slate-800/30 rounded-md transition-colors">
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
