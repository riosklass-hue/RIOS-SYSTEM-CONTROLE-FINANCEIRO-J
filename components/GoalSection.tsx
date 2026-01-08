
import React, { useState, useRef } from 'react';
import { Plus, Trash2, Edit2, Target, X, Calculator, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
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
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const codeInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Partial<Goal>>({
    code: '',
    companyName: '',
    bloqueiraMeta: undefined,
    agentMeta: undefined,
    idep40hMeta: undefined,
    idep20hMeta: undefined,
    status: 'ativo'
  });

  const summaries = getCompanySummaries(entries, goals);

  // Cálculos em tempo real para o formulário (Apenas Plataforma)
  const currentWeeklyPlat = (Number(formData.bloqueiraMeta) || 0) + (Number(formData.agentMeta) || 0);
  const currentMonthlyPlat = currentWeeklyPlat * 4;

  const handleSubmit = async (e: React.FormEvent) => {
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
          setError(`O código "${formData.code}" já está em uso.`);
          return;
        }
      }

      setIsSaving(true);
      const goalData = {
        ...formData,
        code: formData.code?.trim() || '',
        bloqueiraMeta: Number(formData.bloqueiraMeta) || 0,
        agentMeta: Number(formData.agentMeta) || 0,
        idep40hMeta: Number(formData.idep40hMeta) || 0,
        idep20hMeta: Number(formData.idep20hMeta) || 0,
        status: 'ativo'
      } as Goal;

      try {
        if (editingId) {
          await onUpdate({ ...goalData, id: editingId });
          setEditingId(null);
        } else {
          await onAdd({ ...goalData, id: crypto.randomUUID() });
        }

        setFormData({ code: '', companyName: '', bloqueiraMeta: undefined, agentMeta: undefined, idep40hMeta: undefined, idep20hMeta: undefined, status: 'ativo' });
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
        codeInputRef.current?.focus();
      } catch (err) {
        setError("Falha ao salvar. Tente novamente.");
      } finally {
        setIsSaving(false);
      }
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
        status: goal.status || 'ativo'
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setError(null);
    setFormData({ code: '', companyName: '', bloqueiraMeta: undefined, agentMeta: undefined, idep40hMeta: undefined, idep20hMeta: undefined, status: 'ativo' });
  };

  const inputClasses = "w-full px-3 py-2 bg-[#1e293b] border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-amber-500/50 outline-none transition-all placeholder-slate-500 shadow-inner";
  const labelClasses = "block text-[9px] font-black text-slate-500 uppercase mb-1 tracking-widest";

  return (
    <div className="space-y-4">
      {/* Formulário de Cadastro de Metas */}
      <div className={`bg-[#0f172a] p-6 rounded-[2.5rem] shadow-2xl border transition-all duration-300 ${editingId ? 'border-amber-500/40 bg-amber-500/5' : 'border-slate-800'}`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-2xl ${editingId ? 'bg-amber-500/20' : 'bg-amber-500/10'}`}>
              {editingId ? <Edit2 className="w-5 h-5 text-amber-500" /> : <Target className="w-5 h-5 text-amber-500" />}
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-[0.2em] leading-none">
                {editingId ? 'Alterar Planejamento' : 'Configurar Planejamento Semanal (METAS)'}
              </h2>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter mt-1">Vincule metas às unidades de negócio</p>
            </div>
          </div>
          {editingId && (
            <button onClick={cancelEdit} className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 font-black uppercase tracking-widest">
              <X className="w-4 h-4" /> Cancelar
            </button>
          )}
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <div>
              <label className={labelClasses}>Cód.</label>
              <input 
                ref={codeInputRef}
                type="text" 
                placeholder="001" 
                className={`${inputClasses} ${error ? 'border-rose-500/50' : ''}`} 
                value={formData.code} 
                onChange={e => { setError(null); setFormData({ ...formData, code: e.target.value }); }} 
              />
            </div>
            <div className="lg:col-span-1">
              <label className={labelClasses}>Empresa</label>
              <input type="text" placeholder="Nome da Unidade" className={inputClasses} value={formData.companyName} onChange={e => setFormData({ ...formData, companyName: e.target.value })} required />
            </div>
            <div>
              <label className={labelClasses}>Meta Bloqueira</label>
              <input type="number" step="0.01" placeholder="0,00" className={inputClasses} value={formData.bloqueiraMeta ?? ''} onChange={e => setFormData({ ...formData, bloqueiraMeta: e.target.value === '' ? undefined : parseFloat(e.target.value) })} />
            </div>
            <div>
              <label className={labelClasses}>Meta Agente</label>
              <input type="number" step="0.01" placeholder="0,00" className={inputClasses} value={formData.agentMeta ?? ''} onChange={e => setFormData({ ...formData, agentMeta: e.target.value === '' ? undefined : parseFloat(e.target.value) })} />
            </div>
            <div>
              <label className={labelClasses}>Meta IDEP 40H</label>
              <input type="number" step="0.01" placeholder="0,00" className={inputClasses} value={formData.idep40hMeta ?? ''} onChange={e => setFormData({ ...formData, idep40hMeta: e.target.value === '' ? undefined : parseFloat(e.target.value) })} />
            </div>
            <div>
              <label className={labelClasses}>Meta IDEP 20H</label>
              <input type="number" step="0.01" placeholder="0,00" className={inputClasses} value={formData.idep20hMeta ?? ''} onChange={e => setFormData({ ...formData, idep20hMeta: e.target.value === '' ? undefined : parseFloat(e.target.value) })} />
            </div>
            <div className="flex items-end">
              <button 
                type="submit" 
                disabled={isSaving}
                className={`w-full text-white px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 active:scale-95 shadow-xl ${
                  saveSuccess ? 'bg-emerald-600' : 'bg-amber-600 hover:bg-amber-500'
                }`}
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : saveSuccess ? <CheckCircle2 className="w-4 h-4" /> : (editingId ? 'Salvar' : 'Vincular')}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 border border-rose-500/20 rounded-xl animate-in fade-in slide-in-from-top-1">
              <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
              <span className="text-[10px] font-bold text-rose-500 uppercase tracking-tight">{error}</span>
            </div>
          )}

          {(currentWeeklyPlat > 0) && !error && (
            <div className="flex items-center gap-6 px-5 py-3 bg-blue-900/10 border border-blue-500/20 rounded-2xl animate-in fade-in slide-in-from-left-2">
              <div className="flex items-center gap-3 border-r border-blue-500/20 pr-6">
                <Calculator className="w-4 h-4 text-blue-400" />
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Resumo Plataforma</span>
              </div>
              <div className="flex gap-8">
                <div className="flex flex-col">
                  <span className="text-[8px] text-slate-500 font-bold uppercase">Semanal Estimado</span>
                  <span className="text-sm font-black text-white">{formatCurrency(currentWeeklyPlat)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] text-blue-400 font-bold uppercase italic">Mensal Projetado (x4)</span>
                  <span className="text-sm font-black text-[#22d3ee] italic">{formatCurrency(currentMonthlyPlat)}</span>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Tabela de Metas x Planejamento */}
      <div className="bg-[#0f172a] rounded-[2.5rem] shadow-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-slate-400 border-b border-slate-700">
                <th colSpan={3} className="px-5 py-3 text-[8px] font-black uppercase text-center border-r border-slate-800 tracking-widest">IDENTIFICAÇÃO</th>
                <th colSpan={3} className="px-5 py-3 text-[8px] font-black uppercase text-center bg-blue-900/10 border-r border-slate-800 tracking-widest">PLATAFORMA (PREVISTO SEMANAL)</th>
                <th colSpan={3} className="px-5 py-3 text-[8px] font-black uppercase text-center bg-emerald-900/10 border-r border-slate-800 tracking-widest">IDEP (METAS 40H + 20H)</th>
                <th colSpan={3} className="px-5 py-3 text-[8px] font-black uppercase text-center bg-amber-900/10 tracking-widest">RESUMO PLANEJADO</th>
              </tr>
              <tr className="bg-slate-950/50 text-slate-500 text-[8px] font-black uppercase tracking-widest border-b border-slate-800">
                <th className="px-5 py-3 border-r border-slate-800">Cód</th>
                <th className="px-5 py-3 border-r border-slate-800">Unidade</th>
                <th className="px-5 py-3 border-r border-slate-800 text-center">Ações</th>
                
                <th className="px-5 py-3 bg-blue-950/20 border-r border-slate-800">Meta Bloq.</th>
                <th className="px-5 py-3 bg-blue-950/20 border-r border-slate-800">Meta Agente</th>
                <th className="px-5 py-3 bg-blue-950/30 border-r border-slate-800 font-black text-blue-400">Total Sem.</th>
                
                <th className="px-5 py-3 bg-emerald-950/20 border-r border-slate-800">Meta 40H</th>
                <th className="px-5 py-3 bg-emerald-950/20 border-r border-slate-800">Meta 20H</th>
                <th className="px-5 py-3 bg-emerald-950/30 border-r border-slate-800 font-black text-emerald-400">Total IDEP</th>
                
                <th className="px-5 py-3 bg-amber-950/20 border-r border-slate-800 font-black text-amber-500">Sem. (Plat)</th>
                <th className="px-5 py-3 bg-amber-950/30 border-r border-slate-800 font-black text-amber-400">Men. (Plat)</th>
                <th className="px-5 py-3 bg-amber-950/20 font-black text-white">Geral Real.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {summaries.length > 0 ? summaries.map((row, idx) => (
                <tr key={idx} className={`hover:bg-slate-800/30 transition-colors bg-[#0f172a] text-[10px] group ${editingId === goals.find(g => g.companyName === row.companyName)?.id ? 'bg-amber-500/10' : ''}`}>
                  <td className="px-5 py-3 font-mono text-slate-500 border-r border-slate-800">{row.code || '---'}</td>
                  <td className="px-5 py-3 font-black text-slate-200 border-r border-slate-800 uppercase tracking-tighter">{row.companyName}</td>
                  <td className="px-5 py-3 border-r border-slate-800 text-center">
                    <div className="flex items-center justify-center gap-2 opacity-30 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(row.companyName)} className="p-1.5 text-blue-500 hover:bg-blue-500/10 rounded-lg"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => onDelete(goals.find(g => g.companyName === row.companyName)?.id || '')} className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>

                  <td className="px-5 py-3 text-slate-400 border-r border-slate-800 bg-blue-950/5">{formatCurrency(row.metaBloqueira)}</td>
                  <td className="px-5 py-3 text-slate-400 border-r border-slate-800 bg-blue-950/5">{formatCurrency(row.metaAgente)}</td>
                  <td className="px-5 py-3 font-black text-blue-300 border-r border-slate-800 bg-blue-950/10">{formatCurrency(row.metaPlataformaTotal)}</td>

                  <td className="px-5 py-3 text-slate-400 border-r border-slate-800 bg-emerald-950/5">{formatCurrency(row.meta40h)}</td>
                  <td className="px-5 py-3 text-slate-400 border-r border-slate-800 bg-emerald-950/5">{formatCurrency(row.meta20h)}</td>
                  <td className="px-5 py-3 font-black text-emerald-300 border-r border-slate-800 bg-emerald-950/10">{formatCurrency(row.metaIdepTotal)}</td>

                  <td className="px-5 py-3 text-amber-500 font-bold border-r border-slate-800 bg-amber-950/5">{formatCurrency(row.metaGeral)}</td>
                  <td className="px-5 py-3 text-amber-300 font-black border-r border-slate-800 bg-amber-950/10 italic">{formatCurrency(row.metaGeralMensal)}</td>
                  <td className="px-5 py-3 font-black text-white bg-slate-900/40">{formatCurrency(row.ganhoGeral)}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={12} className="px-6 py-12 text-center text-slate-600 italic uppercase text-[10px] font-black tracking-widest opacity-20 bg-slate-950/30">Nenhum planejamento registrado.</td>
                </tr>
              )}
            </tbody>
            {summaries.length > 0 && (
              <tfoot className="bg-slate-900 font-black text-white border-t border-slate-700">
                <tr className="text-[9px] uppercase tracking-tighter">
                  <td colSpan={3} className="px-5 py-4 text-right border-r border-slate-700">TOTAIS CONSOLIDADOS:</td>
                  <td className="px-5 py-4 text-blue-400 border-r border-slate-700">{formatCurrency(summaries.reduce((a, c) => a + c.metaBloqueira, 0))}</td>
                  <td className="px-5 py-4 text-blue-400 border-r border-slate-700">{formatCurrency(summaries.reduce((a, c) => a + c.metaAgente, 0))}</td>
                  <td className="px-5 py-4 bg-blue-900/20 text-blue-300 border-r border-slate-700">{formatCurrency(summaries.reduce((a, c) => a + c.metaPlataformaTotal, 0))}</td>
                  <td className="px-5 py-4 text-emerald-400 border-r border-slate-700">{formatCurrency(summaries.reduce((a, c) => a + c.meta40h, 0))}</td>
                  <td className="px-5 py-4 text-emerald-400 border-r border-slate-700">{formatCurrency(summaries.reduce((a, c) => a + c.meta20h, 0))}</td>
                  <td className="px-5 py-4 bg-emerald-900/20 text-emerald-300 border-r border-slate-700">{formatCurrency(summaries.reduce((a, c) => a + c.metaIdepTotal, 0))}</td>
                  <td className="px-5 py-4 text-amber-500 border-r border-slate-700">{formatCurrency(summaries.reduce((a, c) => a + c.metaGeral, 0))}</td>
                  <td className="px-5 py-4 text-amber-300 bg-amber-900/20 border-r border-slate-700">{formatCurrency(summaries.reduce((a, c) => a + c.metaGeralMensal, 0))}</td>
                  <td className="px-5 py-4 bg-slate-800 text-white font-black">{formatCurrency(summaries.reduce((a, c) => a + c.ganhoGeral, 0))}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};
