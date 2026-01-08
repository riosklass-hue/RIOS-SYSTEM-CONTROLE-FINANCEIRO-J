
import React, { useState, useMemo, useRef } from 'react';
import { Plus, Trash2, Edit2, X, Filter, CheckCircle2, Loader2, History } from 'lucide-react';
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
    idep20hValue: undefined,
    status: 'ativo'
  });

  const allCalculated = useMemo(() => calculateEntries(entries, goals), [entries, goals]);
  const filteredEntries = useMemo(() => {
    if (filterCompany === 'GERAL') return allCalculated;
    return allCalculated.filter(e => e.companyName === filterCompany);
  }, [allCalculated, filterCompany]);

  // REGRAS DO SISTEMA:
  // Bruto Acumulado = soma de todos os lançamentos (Plataforma Bruta)
  const brutoAcumulado = allCalculated.reduce((acc, curr) => acc + curr.plataformaBruta, 0);
  const totalSaidas = expenses.reduce((acc, curr) => acc + (curr.valor || 0), 0);
  // Saldo Disponível = Bruto Acumulado - Total Saídas
  const saldoDisponivel = brutoAcumulado - totalSaidas;

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
        status: 'ativo'
      } as Entry;

      try {
        if (editingId) {
          await onUpdate({ ...entryData, id: editingId });
          setEditingId(null);
        } else {
          await onAdd({ ...entryData, id: crypto.randomUUID() });
        }
        setFormData(prev => ({ ...prev, companyName: '', bloqueiraValue: undefined, agentValue: undefined, idep40hValue: undefined, idep20hValue: undefined }));
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
        companySelectRef.current?.focus();
      } finally { setIsSaving(false); }
    }
  };

  const inputClasses = "w-full px-3 py-2 bg-[#1e293b] border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all";
  const labelClasses = "block text-[9px] font-black text-slate-500 uppercase mb-1 tracking-widest";

  return (
    <div className="space-y-4">
      {/* Formulário Novo Lançamento */}
      <div className={`bg-[#0f172a] p-6 rounded-[2.5rem] border shadow-2xl transition-all ${editingId ? 'border-amber-500/40 bg-amber-500/5' : 'border-slate-800'}`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
             <div className="p-2 rounded-2xl bg-blue-600/20">
                <Plus className="w-5 h-5 text-blue-500" />
             </div>
             <h2 className="text-sm font-black text-white uppercase tracking-widest">{editingId ? 'Editar Lançamento' : 'Novo Lançamento Bruto'}</h2>
          </div>
          {editingId && <button onClick={() => setEditingId(null)} className="text-[10px] text-slate-500 uppercase font-black hover:text-white flex items-center gap-1"><X className="w-4 h-4" /> Cancelar</button>}
        </div>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <div>
            <label className={labelClasses}>Data</label>
            <input type="date" className={inputClasses} value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} required />
          </div>
          <div>
            <label className={labelClasses}>Unidade</label>
            <select ref={companySelectRef} className={inputClasses} value={formData.companyName} onChange={e => setFormData({ ...formData, companyName: e.target.value })} required>
              <option value="">Selecione...</option>
              {goals.map(g => <option key={g.id} value={g.companyName}>{g.companyName}</option>)}
            </select>
          </div>
          <div><label className={labelClasses}>Bloqueira (R$)</label><input type="number" step="0.01" className={inputClasses} value={formData.bloqueiraValue ?? ''} onChange={e => setFormData({ ...formData, bloqueiraValue: parseFloat(e.target.value) })} /></div>
          <div><label className={labelClasses}>Agente (R$)</label><input type="number" step="0.01" className={inputClasses} value={formData.agentValue ?? ''} onChange={e => setFormData({ ...formData, agentValue: parseFloat(e.target.value) })} /></div>
          <div><label className={labelClasses}>IDEP 40H (R$)</label><input type="number" step="0.01" className={inputClasses} value={formData.idep40hValue ?? ''} onChange={e => setFormData({ ...formData, idep40hValue: parseFloat(e.target.value) })} /></div>
          <div><label className={labelClasses}>IDEP 20H (R$)</label><input type="number" step="0.01" className={inputClasses} value={formData.idep20hValue ?? ''} onChange={e => setFormData({ ...formData, idep20hValue: parseFloat(e.target.value) })} /></div>
          <div className="flex items-end">
            <button type="submit" disabled={isSaving} className={`w-full text-white px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 ${saveSuccess ? 'bg-emerald-600' : 'bg-blue-600 hover:bg-blue-500'}`}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : saveSuccess ? <CheckCircle2 className="w-4 h-4" /> : 'Lançar'}
            </button>
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        {/* Tabela de Histórico */}
        <div className="xl:col-span-3 bg-[#0f172a] rounded-[2.5rem] border border-slate-800 overflow-hidden shadow-2xl">
          <div className="p-5 border-b border-slate-800 bg-slate-900/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
               <History className="w-4 h-4 text-slate-500" />
               <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Histórico de Movimentação</h3>
            </div>
            <select className="bg-slate-800 border border-slate-700 text-[10px] text-white rounded-xl px-4 py-2 font-black uppercase tracking-widest outline-none" value={filterCompany} onChange={(e) => setFilterCompany(e.target.value)}>
              <option value="GERAL">VISÃO GERAL</option>
              {goals.map(g => <option key={g.id} value={g.companyName}>{g.companyName}</option>)}
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-900/50 text-[8px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-800">
                  <th className="px-6 py-4">Data</th>
                  <th className="px-6 py-4">Unidade</th>
                  <th className="px-6 py-4 text-center bg-blue-900/10">Plataforma Bruta</th>
                  <th className="px-6 py-4 text-center bg-emerald-900/10">IDEP</th>
                  <th className="px-6 py-4 text-center bg-slate-800">Total Líquido</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredEntries.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-800/20 text-[10px] group transition-colors">
                    <td className="px-6 py-3 font-mono text-slate-500">{new Date(row.date).toLocaleDateString('pt-BR')}</td>
                    <td className="px-6 py-3 font-black text-white uppercase">{row.companyName}</td>
                    <td className="px-6 py-3 text-center text-blue-400 font-bold bg-blue-900/5">{formatCurrency(row.plataformaBruta)}</td>
                    <td className="px-6 py-3 text-center text-emerald-400 font-bold bg-emerald-900/5">{formatCurrency(row.idepTotal)}</td>
                    <td className="px-6 py-3 text-center font-black text-white bg-slate-900 italic">{formatCurrency(row.totalLiquido)}</td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-30 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => onDelete(row.id)} className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Resumo Financeiro */}
        <div className="bg-[#0f172a] rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden h-fit">
           <div className="p-5 border-b border-slate-800 bg-slate-900/40">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fluxo Consolidado</h3>
           </div>
           <div className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                 <span className="text-[9px] font-black text-slate-500 uppercase">Bruto Acumulado</span>
                 <span className="text-sm font-black text-white">{formatCurrency(brutoAcumulado)}</span>
              </div>
              <div className="flex justify-between items-center">
                 <span className="text-[9px] font-black text-slate-500 uppercase">Total Saídas</span>
                 <span className="text-sm font-black text-rose-500">{formatCurrency(totalSaidas)}</span>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-800">
                 <div className="bg-blue-600 p-5 rounded-2xl shadow-xl">
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/70 block mb-1">Saldo Disponível</span>
                    <span className="text-xl font-black text-white">{formatCurrency(saldoDisponivel)}</span>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
