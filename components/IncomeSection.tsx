
import React, { useState, useMemo, useRef } from 'react';
import { Plus, Trash2, Edit2, X, Filter, Download, CheckCircle2, Loader2 } from 'lucide-react';
import { Entry, Goal, Expense } from '../types';
import { formatCurrency, calculateEntries } from '../utils/calculations';

interface Props {
  entries: Entry[];
  goals: Goal[];
  expenses: Expense[];
  onAdd: (entry: Entry) => void;
  onUpdate: (entry: Entry) => void;
  onDelete: (id: string) => void;
}

export const IncomeSection: React.FC<Props> = ({ entries, goals, expenses, onAdd, onUpdate, onDelete }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterCompany, setFilterCompany] = useState<string>('GERAL');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const companySelectRef = useRef<HTMLSelectElement>(null);

  const [formData, setFormData] = useState<Partial<Entry>>({
    date: new Date().toISOString().split('T')[0],
    companyName: '',
    bloqueiraValue: undefined,
    agentValue: undefined,
    idep40hValue: undefined,
    idep20hValue: undefined
  });

  const allCalculated = useMemo(() => calculateEntries(entries, goals), [entries, goals]);
  
  const filteredEntries = useMemo(() => {
    if (filterCompany === 'GERAL') return allCalculated;
    return allCalculated.filter(e => e.companyName === filterCompany);
  }, [allCalculated, filterCompany]);

  const totalGanhosExibidos = filteredEntries.reduce((acc, curr) => acc + curr.totalGain, 0);
  const totalGanhosGeral = allCalculated.reduce((acc, curr) => acc + curr.totalGain, 0);
  const totalSaidas = expenses.reduce((acc, curr) => acc + (curr.valor || 0), 0);
  const emCaixa = totalGanhosGeral - totalSaidas;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.companyName && formData.date) {
      setIsSaving(true);
      
      const entryData = {
        ...formData,
        bloqueiraValue: Number(formData.bloqueiraValue) || 0,
        agentValue: Number(formData.agentValue) || 0,
        idep40hValue: Number(formData.idep40hValue) || 0,
        idep20hValue: Number(formData.idep20hValue) || 0,
      } as Entry;

      try {
        if (editingId) {
          await onUpdate({ ...entryData, id: editingId });
          setEditingId(null);
        } else {
          await onAdd({ ...entryData, id: crypto.randomUUID() });
        }
        
        // Reset e feedback visual
        setFormData(prev => ({ 
          ...prev, 
          companyName: '', 
          bloqueiraValue: undefined, 
          agentValue: undefined, 
          idep40hValue: undefined, 
          idep20hValue: undefined 
        }));
        
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
        
        // Retorna o foco para a empresa para agilizar o próximo lançamento
        companySelectRef.current?.focus();
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleEdit = (entry: Entry) => {
    setEditingId(entry.id);
    setFormData({
      date: entry.date,
      companyName: entry.companyName,
      bloqueiraValue: entry.bloqueiraValue,
      agentValue: entry.agentValue,
      idep40hValue: entry.idep40hValue,
      idep20hValue: entry.idep20hValue,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData(prev => ({ 
      ...prev, 
      companyName: '', 
      bloqueiraValue: undefined, 
      agentValue: undefined, 
      idep40hValue: undefined, 
      idep20hValue: undefined 
    }));
  };

  const inputClasses = "w-full px-3 py-1.5 bg-[#1e293b] border border-slate-700 rounded-lg text-[11px] text-white focus:ring-2 focus:ring-blue-500/50 focus:outline-none transition-all placeholder-slate-500 shadow-inner";
  const labelClasses = "block text-[8px] font-black text-slate-500 uppercase mb-1 tracking-widest";

  return (
    <div className="space-y-4">
      <div className={`bg-[#0f172a] p-5 rounded-[1.5rem] shadow-xl border transition-all duration-300 ${editingId ? 'border-amber-500/40 bg-amber-500/5' : 'border-slate-800'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-xl ${editingId ? 'bg-amber-500/20' : 'bg-blue-600/20'}`}>
              {editingId ? <Edit2 className="w-4 h-4 text-amber-500" /> : <Plus className="w-4 h-4 text-blue-500" />}
            </div>
            <div>
              <h2 className="text-xs font-black text-white uppercase tracking-[0.1em] leading-none">
                {editingId ? 'Alterar Lançamento' : 'Novo Lançamento Bruto'}
              </h2>
              <p className="text-[8px] text-slate-500 font-bold uppercase tracking-tighter mt-0.5">Faturamento por unidade</p>
            </div>
          </div>
          {editingId && (
            <button onClick={cancelEdit} className="text-[9px] text-slate-400 hover:text-white flex items-center gap-1 font-black uppercase tracking-widest">
              <X className="w-3.5 h-3.5" /> Cancelar
            </button>
          )}
        </div>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <div>
            <label className={labelClasses}>Data</label>
            <input type="date" className={inputClasses} value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} required />
          </div>
          <div className="col-span-1">
            <label className={labelClasses}>Unidade</label>
            <select ref={companySelectRef} className={inputClasses} value={formData.companyName} onChange={e => setFormData({ ...formData, companyName: e.target.value })} required>
              <option value="" className="bg-[#0f172a]">Selecione...</option>
              {goals.map(g => (
                <option key={g.id} value={g.companyName} className="bg-[#0f172a]">
                  {g.code ? `${g.code} - ` : ''}{g.companyName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClasses}>Bloqueira (R$)</label>
            <input type="number" step="0.01" placeholder="0,00" className={inputClasses} value={formData.bloqueiraValue ?? ''} onChange={e => setFormData({ ...formData, bloqueiraValue: e.target.value === '' ? undefined : parseFloat(e.target.value) })} />
          </div>
          <div>
            <label className={labelClasses}>Agente (R$)</label>
            <input type="number" step="0.01" placeholder="0,00" className={inputClasses} value={formData.agentValue ?? ''} onChange={e => setFormData({ ...formData, agentValue: e.target.value === '' ? undefined : parseFloat(e.target.value) })} />
          </div>
          <div>
            <label className={labelClasses}>IDEP 40H (R$)</label>
            <input type="number" step="0.01" placeholder="0,00" className={inputClasses} value={formData.idep40hValue ?? ''} onChange={e => setFormData({ ...formData, idep40hValue: e.target.value === '' ? undefined : parseFloat(e.target.value) })} />
          </div>
          <div>
            <label className={labelClasses}>IDEP 20H (R$)</label>
            <input type="number" step="0.01" placeholder="0,00" className={inputClasses} value={formData.idep20hValue ?? ''} onChange={e => setFormData({ ...formData, idep20hValue: e.target.value === '' ? undefined : parseFloat(e.target.value) })} />
          </div>
          <div className="flex items-end col-span-2 md:col-span-1">
            <button 
              type="submit" 
              disabled={isSaving}
              className={`w-full text-white px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-[0.15em] transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-md ${
                saveSuccess ? 'bg-emerald-600' : (editingId ? 'bg-amber-600 hover:bg-amber-500' : 'bg-blue-600 hover:bg-blue-500')
              }`}
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saveSuccess ? <CheckCircle2 className="w-3.5 h-3.5" /> : (editingId ? 'Salvar' : 'Lançar')}
            </button>
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        <div className="xl:col-span-3 space-y-4">
          <div className="bg-[#0f172a] rounded-[1.5rem] shadow-xl border border-slate-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/30 flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-500">Histórico de Movimentação</h3>
              <div className="flex items-center gap-2">
                <Filter className="w-3 h-3 text-slate-500" />
                <select 
                  className="bg-slate-800 border border-slate-700 text-[8px] text-white rounded-lg px-2.5 py-1 font-black uppercase tracking-widest outline-none cursor-pointer"
                  value={filterCompany}
                  onChange={(e) => setFilterCompany(e.target.value)}
                >
                  <option value="GERAL">VISÃO GERAL</option>
                  {goals.map(g => <option key={g.id} value={g.companyName}>{g.companyName.toUpperCase()}</option>)}
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900/50 text-slate-500 border-b border-slate-800">
                    <th colSpan={2} className="px-4 py-3 text-[7px] font-black uppercase tracking-widest border-r border-slate-800">IDENTIFICAÇÃO</th>
                    <th colSpan={3} className="px-4 py-3 text-[7px] font-black uppercase tracking-widest border-r border-slate-800 text-center bg-blue-900/10">PLATAFORMA BRUTA</th>
                    <th colSpan={2} className="px-4 py-3 text-[7px] font-black uppercase tracking-widest border-r border-slate-800 text-center bg-emerald-900/10">IDEP</th>
                    <th className="px-4 py-3 text-[7px] font-black uppercase tracking-widest border-r border-slate-800">TOTAL</th>
                    <th className="px-4 py-3 text-[7px] font-black uppercase tracking-widest text-right">AÇÕES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredEntries.map((row) => (
                    <tr key={row.id} className={`hover:bg-slate-800/20 transition-colors bg-[#0f172a] text-[9px] group ${editingId === row.id ? 'bg-amber-500/10' : ''}`}>
                      <td className="px-4 py-2.5 font-mono text-slate-500 border-r border-slate-800">{new Date(row.date).toLocaleDateString('pt-BR')}</td>
                      <td className="px-4 py-2.5 font-black text-slate-200 border-r border-slate-800 uppercase tracking-tighter truncate max-w-[90px]">{row.companyName}</td>
                      <td className="px-4 py-2.5 text-slate-400 border-r border-slate-800 bg-blue-950/5">{formatCurrency(row.bloqueiraValue)}</td>
                      <td className="px-4 py-2.5 text-slate-400 border-r border-slate-800 bg-blue-950/5">{formatCurrency(row.agentValue)}</td>
                      <td className="px-4 py-2.5 font-black text-blue-400 border-r border-slate-800 bg-blue-950/10">{formatCurrency(row.partialTotal)}</td>
                      <td className="px-4 py-2.5 text-slate-400 border-r border-slate-800 bg-emerald-950/5">{formatCurrency(row.idep40hValue)}</td>
                      <td className="px-4 py-2.5 text-slate-400 border-r border-slate-800 bg-emerald-950/5">{formatCurrency(row.idep20hValue)}</td>
                      <td className="px-4 py-2.5 font-black text-white border-r border-slate-800 bg-slate-900/40 italic">{formatCurrency(row.totalGain)}</td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-20 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEdit(row)} className="p-1.5 text-slate-400 hover:text-blue-400 bg-slate-800 rounded-md">
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button onClick={() => onDelete(row.id)} className="p-1.5 text-slate-400 hover:text-rose-500 bg-slate-800 rounded-md">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-[#0f172a] rounded-[1.5rem] shadow-xl border border-slate-800 overflow-hidden h-fit">
            <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/40">
              <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-400">Fluxo de Caixa</h3>
            </div>
            <div className="divide-y divide-slate-800">
              <div className="bg-slate-900/50 text-slate-400 px-4 py-3 flex justify-between items-center">
                <span className="text-[8px] font-black uppercase tracking-widest">BRUTO ACUMULADO</span>
                <span className="text-xs font-black text-white">{formatCurrency(totalGanhosGeral)}</span>
              </div>
              <div className="bg-slate-900/80 text-rose-500 px-4 py-3 flex justify-between items-center">
                <span className="text-[8px] font-black uppercase tracking-widest">TOTAL SAÍDAS</span>
                <span className="text-xs font-black">{formatCurrency(totalSaidas)}</span>
              </div>
              <div className="bg-blue-600 text-white px-4 py-5 flex justify-between items-center">
                <div className="flex flex-col">
                   <span className="text-[8px] font-black uppercase tracking-widest opacity-80">Saldo Livre</span>
                   <span className="text-base font-black leading-none mt-1">{formatCurrency(emCaixa)}</span>
                </div>
                <div className="p-2 bg-white/20 rounded-xl">
                   <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
