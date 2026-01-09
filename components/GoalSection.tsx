
import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Target, X, Calculator, AlertCircle } from 'lucide-react';
import { Goal, Entry } from '../types';
import { formatCurrency, getCompanySummaries } from '../utils/calculations';

interface Props {
  goals: Goal[];
  entries: Entry[];
  onAdd: (goal: Goal) => void;
  onUpdate: (goal: Goal) => void;
  onDelete: (id: string) => void;
}

export const GoalSection: React.FC<Props> = ({ goals, entries, onAdd, onUpdate, onDelete }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Goal>>({
    code: '',
    companyName: '',
    bloqueiraMeta: undefined,
    agentMeta: undefined,
    idep40hMeta: undefined,
    idep20hMeta: undefined
  });

  const summaries = getCompanySummaries(entries, goals);

  // Cálculos em tempo real para o formulário (Apenas Plataforma)
  const currentWeeklyPlat = (Number(formData.bloqueiraMeta) || 0) + (Number(formData.agentMeta) || 0);
  const currentMonthlyPlat = currentWeeklyPlat * 4;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.companyName) {
      // Validação de Código Duplicado
      if (formData.code) {
        const isDuplicate = goals.some(g => 
          g.code.trim().toUpperCase() === formData.code?.trim().toUpperCase() && 
          g.id !== editingId
        );

        if (isDuplicate) {
          setError(`O código "${formData.code}" já está em uso por outra unidade.`);
          return;
        }
      }

      const goalData = {
        ...formData,
        code: formData.code?.trim() || '',
        bloqueiraMeta: Number(formData.bloqueiraMeta) || 0,
        agentMeta: Number(formData.agentMeta) || 0,
        idep40hMeta: Number(formData.idep40hMeta) || 0,
        idep20hMeta: Number(formData.idep20hMeta) || 0,
      } as Goal;

      if (editingId) {
        onUpdate({ ...goalData, id: editingId });
        setEditingId(null);
      } else {
        onAdd({ ...goalData, id: crypto.randomUUID() });
      }

      setFormData({ code: '', companyName: '', bloqueiraMeta: undefined, agentMeta: undefined, idep40hMeta: undefined, idep20hMeta: undefined });
    }
  };

  const handleEdit = (goalName: string) => {
    const goal = goals.find(g => g.companyName === goalName);
    if (goal) {
      setError(null);
      setEditingId(goal.id);
      setFormData({
        code: goal.code,
        companyName: goal.companyName,
        bloqueiraMeta: goal.bloqueiraMeta,
        agentMeta: goal.agentMeta,
        idep40hMeta: goal.idep40hMeta,
        idep20hMeta: goal.idep20hMeta,
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setError(null);
    setFormData({ code: '', companyName: '', bloqueiraMeta: undefined, agentMeta: undefined, idep40hMeta: undefined, idep20hMeta: undefined });
  };

  const inputClasses = "w-full px-2 py-1.5 bg-[#1e293b] border border-slate-700 rounded-lg text-[10px] text-white focus:ring-1 focus:ring-amber-500 focus:outline-none transition-all";
  const labelClasses = "block text-[8px] font-black text-slate-400 uppercase mb-1 tracking-widest";

  return (
    <div className="space-y-4">
      {/* Formulário de Cadastro de Metas */}
      <div className={`bg-[#0f172a] p-5 rounded-2xl shadow-xl border transition-all ${editingId ? 'border-amber-500/50' : 'border-slate-800'}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-black flex items-center gap-2 text-white uppercase tracking-widest">
            <div className={`p-1.5 rounded-lg bg-amber-500/10`}>
              {editingId ? <Edit2 className="w-4 h-4 text-amber-500" /> : <Target className="w-4 h-4 text-amber-500" />}
            </div>
            {editingId ? 'Editar Planejamento' : 'Planejamento Semanal (METAS)'}
          </h2>
          {editingId && (
            <button onClick={cancelEdit} className="text-[9px] text-slate-400 hover:text-white flex items-center gap-1 font-black uppercase">
              <X className="w-3.5 h-3.5" /> Cancelar
            </button>
          )}
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <div>
              <label className={labelClasses}>Cód.</label>
              <input 
                type="text" 
                placeholder="001" 
                className={`${inputClasses} ${error ? 'border-rose-500/50 ring-1 ring-rose-500/20' : ''}`} 
                value={formData.code} 
                onChange={e => {
                  setError(null);
                  setFormData({ ...formData, code: e.target.value });
                }} 
              />
            </div>
            <div className="lg:col-span-1">
              <label className={labelClasses}>Empresa</label>
              <input type="text" placeholder="Unidade" className={inputClasses} value={formData.companyName} onChange={e => setFormData({ ...formData, companyName: e.target.value })} required />
            </div>
            <div>
              <label className={labelClasses}>Meta Bloq.</label>
              <input type="number" step="0.01" className={inputClasses} value={formData.bloqueiraMeta ?? ''} onChange={e => setFormData({ ...formData, bloqueiraMeta: e.target.value === '' ? undefined : parseFloat(e.target.value) })} />
            </div>
            <div>
              <label className={labelClasses}>Meta Agente</label>
              <input type="number" step="0.01" className={inputClasses} value={formData.agentMeta ?? ''} onChange={e => setFormData({ ...formData, agentMeta: e.target.value === '' ? undefined : parseFloat(e.target.value) })} />
            </div>
            <div>
              <label className={labelClasses}>Meta 40H</label>
              <input type="number" step="0.01" className={inputClasses} value={formData.idep40hMeta ?? ''} onChange={e => setFormData({ ...formData, idep40hMeta: e.target.value === '' ? undefined : parseFloat(e.target.value) })} />
            </div>
            <div>
              <label className={labelClasses}>Meta 20H</label>
              <input type="number" step="0.01" className={inputClasses} value={formData.idep20hMeta ?? ''} onChange={e => setFormData({ ...formData, idep20hMeta: e.target.value === '' ? undefined : parseFloat(e.target.value) })} />
            </div>
            <div className="flex items-end">
              <button type="submit" className={`w-full text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest h-[32px] bg-amber-600 hover:bg-amber-700 active:scale-95 transition-all`}>
                {editingId ? 'Salvar' : 'Vincular'}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-lg animate-in fade-in duration-200">
              <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
              <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest">{error}</span>
            </div>
          )}

          {/* Cálculo Automático */}
          {(currentWeeklyPlat > 0) && !error && (
            <div className="flex items-center gap-4 px-3 py-2 bg-blue-950/20 border border-blue-500/20 rounded-xl animate-in fade-in duration-300">
              <div className="flex items-center gap-2 border-r border-blue-500/20 pr-4">
                <Calculator className="w-4 h-4 text-blue-400" />
                <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Plataforma (Exclui IDEP)</span>
              </div>
              <div className="flex gap-5">
                <div className="flex flex-col">
                  <span className="text-[7px] text-slate-500 font-black uppercase">Semanal</span>
                  <span className="text-[10px] font-black text-white leading-none mt-0.5">{formatCurrency(currentWeeklyPlat)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[7px] text-blue-400 font-black uppercase italic underline">Mensal (x4)</span>
                  <span className="text-[10px] font-black text-[#22d3ee] italic leading-none mt-0.5">{formatCurrency(currentMonthlyPlat)}</span>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Tabela de Metas */}
      <div className="bg-[#0f172a] rounded-2xl shadow-xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white border-b border-slate-700">
                <th colSpan={3} className="px-3 py-2 text-[7px] font-black uppercase text-center border-r border-slate-700">IDENTIFICAÇÃO</th>
                <th colSpan={3} className="px-3 py-2 text-[7px] font-black uppercase text-center bg-blue-900/20 border-r border-slate-700 tracking-widest">PLATAFORMA (PREVISTO SEMANAL)</th>
                <th colSpan={3} className="px-3 py-2 text-[7px] font-black uppercase text-center bg-emerald-900/20 border-r border-slate-700 tracking-widest">IDEP (METAS REAIS)</th>
                <th colSpan={3} className="px-3 py-2 text-[7px] font-black uppercase text-center bg-amber-900/20 tracking-widest">RESUMO PLANEJADO</th>
              </tr>
              <tr className="bg-slate-950 text-slate-500 text-[6px] font-black uppercase tracking-widest border-b border-slate-800">
                <th className="px-3 py-1.5 border-r border-slate-800">Cód</th>
                <th className="px-3 py-1.5 border-r border-slate-800">Empresa</th>
                <th className="px-3 py-1.5 border-r border-slate-800 text-center">Ações</th>
                
                <th className="px-3 py-1.5 bg-blue-950/30 border-r border-slate-800">Bloq</th>
                <th className="px-3 py-1.5 bg-blue-950/30 border-r border-slate-800">Agente</th>
                <th className="px-3 py-1.5 bg-blue-950/40 border-r border-slate-800 text-blue-400">Total (S)</th>
                
                <th className="px-3 py-1.5 bg-emerald-950/30 border-r border-slate-800">40H</th>
                <th className="px-3 py-1.5 bg-emerald-950/30 border-r border-slate-800">20H</th>
                <th className="px-3 py-1.5 bg-emerald-950/40 border-r border-slate-800 text-emerald-400">T. IDEP</th>
                
                <th className="px-3 py-1.5 bg-amber-950/30 border-r border-slate-800 text-amber-500">Met. Sem</th>
                <th className="px-3 py-1.5 bg-amber-950/40 border-r border-slate-800 text-amber-400 underline italic">Met. Men</th>
                <th className="px-3 py-1.5 bg-amber-950/50 text-white">Geral</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {summaries.map((row, idx) => (
                <tr key={idx} className={`hover:bg-slate-800/30 transition-colors bg-[#0f172a] text-[9px] ${editingId === goals.find(g => g.companyName === row.companyName)?.id ? 'bg-amber-500/5' : ''}`}>
                  <td className="px-3 py-2 font-mono text-slate-500 border-r border-slate-800">{row.code || '---'}</td>
                  <td className="px-3 py-2 font-black text-slate-200 border-r border-slate-800 truncate max-w-[90px] uppercase tracking-tighter">{row.companyName}</td>
                  <td className="px-3 py-2 border-r border-slate-800">
                    <div className="flex items-center justify-center gap-2 opacity-30 hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(row.companyName)} className="text-blue-500 hover:text-blue-400 transition-colors">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => onDelete(goals.find(g => g.companyName === row.companyName)?.id || '')} className="text-rose-600 hover:text-rose-400 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>

                  <td className="px-3 py-2 text-slate-400 border-r border-slate-800 bg-blue-950/5">{formatCurrency(row.metaBloqueira)}</td>
                  <td className="px-3 py-2 text-slate-400 border-r border-slate-800 bg-blue-950/5">{formatCurrency(row.metaAgente)}</td>
                  <td className="px-3 py-2 font-black text-blue-300 border-r border-slate-800 bg-blue-950/10">{formatCurrency(row.metaPlataformaTotal)}</td>

                  <td className="px-3 py-2 text-slate-400 border-r border-slate-800 bg-emerald-950/5">{formatCurrency(row.meta40h)}</td>
                  <td className="px-3 py-2 text-slate-400 border-r border-slate-800 bg-emerald-950/5">{formatCurrency(row.meta20h)}</td>
                  <td className="px-3 py-2 font-black text-emerald-300 border-r border-slate-800 bg-emerald-950/10">{formatCurrency(row.metaIdepTotal)}</td>

                  <td className="px-3 py-2 text-amber-500 font-bold border-r border-slate-800 bg-amber-950/5">{formatCurrency(row.metaGeral)}</td>
                  <td className="px-3 py-2 text-amber-300 font-black border-r border-slate-800 bg-amber-950/10 italic">{formatCurrency(row.metaGeralMensal)}</td>
                  <td className="px-3 py-2 font-black text-white bg-slate-900/60 italic">{formatCurrency(row.ganhoGeral)}</td>
                </tr>
              ))}
              {summaries.length === 0 && (
                <tr>
                  <td colSpan={12} className="px-4 py-10 text-center text-slate-600 italic uppercase text-[9px] font-bold tracking-widest">Nenhum planejamento registrado na base.</td>
                </tr>
              )}
            </tbody>
            {summaries.length > 0 && (
              <tfoot className="bg-slate-950 text-white font-black border-t border-slate-700">
                <tr className="text-[8px] uppercase tracking-widest">
                  <td colSpan={3} className="px-3 py-2 text-right">TOTAIS:</td>
                  <td className="px-3 py-2 text-blue-400">{formatCurrency(summaries.reduce((a, c) => a + c.metaBloqueira, 0))}</td>
                  <td className="px-3 py-2 text-blue-400">{formatCurrency(summaries.reduce((a, c) => a + c.metaAgente, 0))}</td>
                  <td className="px-3 py-2 bg-blue-900/20 text-blue-300">{formatCurrency(summaries.reduce((a, c) => a + c.metaPlataformaTotal, 0))}</td>
                  
                  <td className="px-3 py-2 text-emerald-400">{formatCurrency(summaries.reduce((a, c) => a + c.meta40h, 0))}</td>
                  <td className="px-3 py-2 text-emerald-400">{formatCurrency(summaries.reduce((a, c) => a + c.meta20h, 0))}</td>
                  <td className="px-3 py-2 bg-emerald-900/20 text-emerald-300">{formatCurrency(summaries.reduce((a, c) => a + c.metaIdepTotal, 0))}</td>
                  
                  <td className="px-3 py-2 text-amber-500">{formatCurrency(summaries.reduce((a, c) => a + c.metaGeral, 0))}</td>
                  <td className="px-3 py-2 text-amber-300 bg-amber-900/20 italic">{formatCurrency(summaries.reduce((a, c) => a + c.metaGeralMensal, 0))}</td>
                  <td className="px-3 py-2 bg-slate-900 text-white font-black italic">{formatCurrency(summaries.reduce((a, c) => a + c.ganhoGeral, 0))}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};
