
import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Target, X, Calculator } from 'lucide-react';
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
    if (formData.companyName) {
      const goalData = {
        ...formData,
        code: formData.code || '',
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
    setFormData({ code: '', companyName: '', bloqueiraMeta: undefined, agentMeta: undefined, idep40hMeta: undefined, idep20hMeta: undefined });
  };

  const inputClasses = "w-full px-2 py-1 bg-[#1e293b] border border-slate-700 rounded-md text-[10px] text-white focus:ring-1 focus:ring-amber-500 focus:outline-none transition-all";
  const labelClasses = "block text-[8px] font-bold text-slate-400 uppercase mb-0.5 tracking-tighter";

  return (
    <div className="space-y-3">
      {/* Formulário de Cadastro de Metas */}
      <div className={`bg-[#0f172a] p-3 rounded-xl shadow-2xl border transition-all ${editingId ? 'border-amber-500/50' : 'border-slate-800'}`}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold flex items-center gap-2 text-white uppercase tracking-wider">
            <div className={`p-1 rounded-md bg-amber-500/10`}>
              {editingId ? <Edit2 className="w-3.5 h-3.5 text-amber-500" /> : <Target className="w-3.5 h-3.5 text-amber-500" />}
            </div>
            {editingId ? 'Editar Planejamento' : 'Configurar Planejamento Semanal (METAS)'}
          </h2>
          {editingId && (
            <button onClick={cancelEdit} className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1">
              <X className="w-3 h-3" /> Cancelar
            </button>
          )}
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
            <div>
              <label className={labelClasses}>Cód.</label>
              <input type="text" placeholder="001" className={inputClasses} value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} />
            </div>
            <div className="lg:col-span-1">
              <label className={labelClasses}>Empresa</label>
              <input type="text" placeholder="Unidade" className={inputClasses} value={formData.companyName} onChange={e => setFormData({ ...formData, companyName: e.target.value })} required />
            </div>
            <div>
              <label className={labelClasses}>Meta Bloqueira</label>
              <input type="number" step="0.01" className={inputClasses} value={formData.bloqueiraMeta ?? ''} onChange={e => setFormData({ ...formData, bloqueiraMeta: e.target.value === '' ? undefined : parseFloat(e.target.value) })} />
            </div>
            <div>
              <label className={labelClasses}>Meta Agente</label>
              <input type="number" step="0.01" className={inputClasses} value={formData.agentMeta ?? ''} onChange={e => setFormData({ ...formData, agentMeta: e.target.value === '' ? undefined : parseFloat(e.target.value) })} />
            </div>
            <div>
              <label className={labelClasses}>Meta IDEP 40H</label>
              <input type="number" step="0.01" className={inputClasses} value={formData.idep40hMeta ?? ''} onChange={e => setFormData({ ...formData, idep40hMeta: e.target.value === '' ? undefined : parseFloat(e.target.value) })} />
            </div>
            <div>
              <label className={labelClasses}>Meta IDEP 20H</label>
              <input type="number" step="0.01" className={inputClasses} value={formData.idep20hMeta ?? ''} onChange={e => setFormData({ ...formData, idep20hMeta: e.target.value === '' ? undefined : parseFloat(e.target.value) })} />
            </div>
            <div className="flex items-end">
              <button type="submit" className={`w-full text-white px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider h-[24px] bg-amber-600 hover:bg-amber-700`}>
                {editingId ? 'Salvar' : 'Vincular'}
              </button>
            </div>
          </div>

          {/* Cálculo Automático de Plataforma (Real-time) - Excluindo IDEP */}
          {(currentWeeklyPlat > 0) && (
            <div className="flex items-center gap-4 px-3 py-2 bg-blue-900/10 border border-blue-500/20 rounded-lg animate-in fade-in slide-in-from-left-2 duration-300">
              <div className="flex items-center gap-2 border-r border-blue-500/20 pr-4">
                <Calculator className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Resumo Plataforma (Exclui IDEP)</span>
              </div>
              <div className="flex gap-6">
                <div className="flex flex-col">
                  <span className="text-[7px] text-slate-500 font-bold uppercase">Semanal (Bloq + Agente)</span>
                  <span className="text-[11px] font-black text-white">{formatCurrency(currentWeeklyPlat)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[7px] text-blue-400 font-bold uppercase underline italic">Automático Mensal (x4)</span>
                  <span className="text-[11px] font-black text-[#22d3ee] italic">{formatCurrency(currentMonthlyPlat)}</span>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Tabela de Metas x Planejamento */}
      <div className="bg-[#0f172a] rounded-xl shadow-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white border-b border-slate-700">
                <th colSpan={3} className="px-2 py-1 text-[8px] font-black uppercase text-center border-r border-slate-700">IDENTIFICAÇÃO</th>
                <th colSpan={3} className="px-2 py-1 text-[8px] font-black uppercase text-center bg-blue-900/20 border-r border-slate-700">PLATAFORMA (PREVISTO SEMANAL)</th>
                <th colSpan={3} className="px-2 py-1 text-[8px] font-black uppercase text-center bg-emerald-900/20 border-r border-slate-700">IDEP (METAS 40H + 20H)</th>
                <th colSpan={3} className="px-2 py-1 text-[8px] font-black uppercase text-center bg-amber-900/20">RESUMO PLANEJADO (IDEP + MEN PLAT)</th>
              </tr>
              <tr className="bg-slate-950 text-slate-400 text-[7px] font-bold uppercase tracking-tighter border-b border-slate-800">
                <th className="px-2 py-1 border-r border-slate-800">Cód</th>
                <th className="px-2 py-1 border-r border-slate-800">Empresa</th>
                <th className="px-2 py-1 border-r border-slate-800">Ações</th>
                
                <th className="px-2 py-1 bg-blue-950/30 border-r border-slate-800">Meta Bloq.</th>
                <th className="px-2 py-1 bg-blue-950/30 border-r border-slate-800">Meta Agente</th>
                <th className="px-2 py-1 bg-blue-950/30 border-r border-slate-800 font-black text-blue-400">Total Plat. (Sem)</th>
                
                <th className="px-2 py-1 bg-emerald-950/30 border-r border-slate-800">Meta 40H</th>
                <th className="px-2 py-1 bg-emerald-950/30 border-r border-slate-800">Meta 20H</th>
                <th className="px-2 py-1 bg-emerald-950/30 border-r border-slate-800 font-black text-emerald-400 underline italic">Total IDEP (Real)</th>
                
                <th className="px-2 py-1 bg-amber-950/30 border-r border-slate-800 font-black text-amber-500">Meta Sem. (Plat)</th>
                <th className="px-2 py-1 bg-amber-950/30 border-r border-slate-800 font-black text-amber-400 underline italic">Meta Men. (Plat)</th>
                <th className="px-2 py-1 bg-amber-950/30 font-black text-white">Geral Real.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {summaries.map((row, idx) => (
                <tr key={idx} className={`hover:bg-slate-800/30 transition-colors bg-[#0f172a] text-[9px] ${editingId === goals.find(g => g.companyName === row.companyName)?.id ? 'bg-amber-500/5' : ''}`}>
                  <td className="px-2 py-1.5 font-mono text-slate-500 border-r border-slate-800">{row.code || '---'}</td>
                  <td className="px-2 py-1.5 font-black text-slate-200 border-r border-slate-800 truncate max-w-[80px]">{row.companyName}</td>
                  <td className="px-2 py-1.5 border-r border-slate-800 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => handleEdit(row.companyName)} className="text-blue-500 hover:text-blue-400 transition-colors">
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button onClick={() => onDelete(goals.find(g => g.companyName === row.companyName)?.id || '')} className="text-rose-600 hover:text-rose-400 transition-colors">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </td>

                  {/* Plataforma Previsto */}
                  <td className="px-2 py-1.5 text-slate-400 border-r border-slate-800 bg-blue-950/10">{formatCurrency(row.metaBloqueira)}</td>
                  <td className="px-2 py-1.5 text-slate-400 border-r border-slate-800 bg-blue-950/10">{formatCurrency(row.metaAgente)}</td>
                  <td className="px-2 py-1.5 font-black text-blue-300 border-r border-slate-800 bg-blue-950/20">{formatCurrency(row.metaPlataformaTotal)}</td>

                  {/* IDEP Detalhado (Total IDEP Real = Meta 40H + Meta 20H) */}
                  <td className="px-2 py-1.5 text-slate-400 border-r border-slate-800 bg-emerald-950/10">{formatCurrency(row.meta40h)}</td>
                  <td className="px-2 py-1.5 text-slate-400 border-r border-slate-800 bg-emerald-950/10">{formatCurrency(row.meta20h)}</td>
                  <td className="px-2 py-1.5 font-black text-emerald-300 border-r border-slate-800 bg-emerald-950/20 underline italic">{formatCurrency(row.metaIdepTotal)}</td>

                  {/* Resumo Geral (Geral Real = Total IDEP Real + Meta Men. Plat) */}
                  <td className="px-2 py-1.5 text-amber-500 font-bold border-r border-slate-800 bg-amber-950/10">{formatCurrency(row.metaGeral)}</td>
                  <td className="px-2 py-1.5 text-amber-300 font-black border-r border-slate-800 bg-amber-950/20 underline italic">{formatCurrency(row.metaGeralMensal)}</td>
                  <td className="px-2 py-1.5 font-black text-white bg-amber-950/10">{formatCurrency(row.ganhoGeral)}</td>
                </tr>
              ))}
              {summaries.length === 0 && (
                <tr>
                  <td colSpan={12} className="px-4 py-8 text-center text-slate-600 italic">Nenhum planejamento registrado.</td>
                </tr>
              )}
            </tbody>
            {summaries.length > 0 && (
              <tfoot className="bg-slate-900/80 font-black text-white border-t border-slate-700">
                <tr className="text-[9px]">
                  <td colSpan={3} className="px-2 py-1 text-right">TOTAIS GERAIS:</td>
                  <td className="px-2 py-1 text-blue-400">{formatCurrency(summaries.reduce((a, c) => a + c.metaBloqueira, 0))}</td>
                  <td className="px-2 py-1 text-blue-400">{formatCurrency(summaries.reduce((a, c) => a + c.metaAgente, 0))}</td>
                  <td className="px-2 py-1 bg-blue-900/30 text-blue-300">{formatCurrency(summaries.reduce((a, c) => a + c.metaPlataformaTotal, 0))}</td>
                  
                  <td className="px-2 py-1 text-emerald-400">{formatCurrency(summaries.reduce((a, c) => a + c.meta40h, 0))}</td>
                  <td className="px-2 py-1 text-emerald-400">{formatCurrency(summaries.reduce((a, c) => a + c.meta20h, 0))}</td>
                  <td className="px-2 py-1 bg-emerald-900/30 text-emerald-300 underline italic">{formatCurrency(summaries.reduce((a, c) => a + c.metaIdepTotal, 0))}</td>
                  
                  <td className="px-2 py-1 text-amber-500">{formatCurrency(summaries.reduce((a, c) => a + c.metaGeral, 0))}</td>
                  <td className="px-2 py-1 text-amber-300 bg-amber-900/30 underline italic">{formatCurrency(summaries.reduce((a, c) => a + c.metaGeralMensal, 0))}</td>
                  <td className="px-2 py-1 bg-slate-800 text-white font-black">{formatCurrency(summaries.reduce((a, c) => a + c.ganhoGeral, 0))}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};
