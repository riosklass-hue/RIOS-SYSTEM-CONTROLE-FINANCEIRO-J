
import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Edit2, X, Filter, Download } from 'lucide-react';
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
  const [formData, setFormData] = useState<Partial<Entry>>({
    date: new Date().toISOString().split('T')[0],
    companyName: '',
    bloqueiraValue: undefined,
    agentValue: undefined,
    idep40hValue: undefined,
    idep20hValue: undefined
  });

  const allCalculated = useMemo(() => calculateEntries(entries, goals), [entries, goals]);
  
  const companySummaries = useMemo(() => {
    const summaryMap: Record<string, number> = {};
    const displayedCompanies = filterCompany === 'GERAL' 
      ? goals 
      : goals.filter(g => g.companyName === filterCompany);

    displayedCompanies.forEach(g => {
      summaryMap[g.companyName] = 0;
    });

    allCalculated.forEach(entry => {
      if (summaryMap[entry.companyName] !== undefined) {
        summaryMap[entry.companyName] += entry.totalGain;
      }
    });

    return Object.entries(summaryMap).map(([name, total]) => ({ name, total }));
  }, [allCalculated, goals, filterCompany]);

  const filteredEntries = useMemo(() => {
    if (filterCompany === 'GERAL') return allCalculated;
    return allCalculated.filter(e => e.companyName === filterCompany);
  }, [allCalculated, filterCompany]);

  const totalGanhosExibidos = filteredEntries.reduce((acc, curr) => acc + curr.totalGain, 0);
  const totalGanhosGeral = allCalculated.reduce((acc, curr) => acc + curr.totalGain, 0);
  
  // CORREÇÃO: Usando 'valor' em vez de 'value' para evitar NaN
  const totalSaidas = expenses.reduce((acc, curr) => acc + (curr.valor || 0), 0);
  const emCaixa = totalGanhosGeral - totalSaidas;

  const exportToCSV = () => {
    const headers = ["Data", "Empresa", "Bloqueira", "Agente", "Parcial", "IDEP 40H", "IDEP 20H", "Total"];
    const rows = filteredEntries.map(e => [
      new Date(e.date).toLocaleDateString('pt-BR'),
      e.companyName,
      e.bloqueiraValue.toString().replace('.', ','),
      e.agentValue.toString().replace('.', ','),
      e.partialTotal.toString().replace('.', ','),
      e.idep40hValue.toString().replace('.', ','),
      e.idep20hValue.toString().replace('.', ','),
      e.totalGain.toString().replace('.', ',')
    ]);

    const csvContent = [headers, ...rows].map(r => r.join(";")).join("\n");
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `relatorio_rios_${filterCompany.toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.companyName && formData.date) {
      const entryData = {
        ...formData,
        bloqueiraValue: Number(formData.bloqueiraValue) || 0,
        agentValue: Number(formData.agentValue) || 0,
        idep40hValue: Number(formData.idep40hValue) || 0,
        idep20hValue: Number(formData.idep20hValue) || 0,
      } as Entry;

      if (editingId) {
        onUpdate({ ...entryData, id: editingId });
        setEditingId(null);
      } else {
        onAdd({ ...entryData, id: crypto.randomUUID() });
      }
      
      setFormData(prev => ({ 
        ...prev, 
        companyName: '', 
        bloqueiraValue: undefined, 
        agentValue: undefined, 
        idep40hValue: undefined, 
        idep20hValue: undefined 
      }));
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

  const inputClasses = "w-full px-2 py-1.5 bg-[#1e293b] border border-slate-700 rounded-lg text-xs text-white focus:ring-1 focus:ring-[#22d3ee] focus:outline-none transition-all placeholder-slate-500";
  const labelClasses = "block text-[9px] font-bold text-slate-400 uppercase mb-1 tracking-widest";

  return (
    <div className="space-y-4">
      {/* Formulário */}
      <div className={`bg-[#0f172a] p-4 rounded-xl shadow-2xl border transition-all ${editingId ? 'border-amber-500/50' : 'border-slate-800'}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold flex items-center gap-2 text-white uppercase tracking-wider">
            <div className={`p-1 rounded-md ${editingId ? 'bg-amber-500/10' : 'bg-[#0891b2]/10'}`}>
              {editingId ? <Edit2 className="w-4 h-4 text-amber-500" /> : <Plus className="w-4 h-4 text-[#22d3ee]" />}
            </div>
            {editingId ? 'Editar Entrada Detalhada' : 'Lançar Entrada Detalhada'}
          </h2>
          {editingId && (
            <button onClick={cancelEdit} className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1">
              <X className="w-3 h-3" /> Cancelar Edição
            </button>
          )}
        </div>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <div>
            <label className={labelClasses}>Data</label>
            <input type="date" className={inputClasses} value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} required />
          </div>
          <div>
            <label className={labelClasses}>Empresa</label>
            <select className={inputClasses} value={formData.companyName} onChange={e => setFormData({ ...formData, companyName: e.target.value })} required>
              <option value="" className="bg-[#0f172a]">Selec...</option>
              {goals.map(g => (
                <option key={g.id} value={g.companyName} className="bg-[#0f172a]">
                  {g.code ? `[${g.code}] ` : ''}{g.companyName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClasses}>Bloqueira (R$)</label>
            <input type="number" step="0.01" className={inputClasses} value={formData.bloqueiraValue ?? ''} onChange={e => setFormData({ ...formData, bloqueiraValue: e.target.value === '' ? undefined : parseFloat(e.target.value) })} />
          </div>
          <div>
            <label className={labelClasses}>Agente (R$)</label>
            <input type="number" step="0.01" className={inputClasses} value={formData.agentValue ?? ''} onChange={e => setFormData({ ...formData, agentValue: e.target.value === '' ? undefined : parseFloat(e.target.value) })} />
          </div>
          <div>
            <label className={labelClasses}>IDEP 40H (R$)</label>
            <input type="number" step="0.01" className={inputClasses} value={formData.idep40hValue ?? ''} onChange={e => setFormData({ ...formData, idep40hValue: e.target.value === '' ? undefined : parseFloat(e.target.value) })} />
          </div>
          <div>
            <label className={labelClasses}>IDEP 20H (R$)</label>
            <input type="number" step="0.01" className={inputClasses} value={formData.idep20hValue ?? ''} onChange={e => setFormData({ ...formData, idep20hValue: e.target.value === '' ? undefined : parseFloat(e.target.value) })} />
          </div>
          <div className="flex items-end">
            <button type="submit" className={`w-full text-white px-2 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all h-[34px] ${editingId ? 'bg-amber-600 hover:bg-amber-500' : 'bg-[#0891b2] hover:bg-[#06b6d4]'}`}>
              {editingId ? 'Salvar' : 'Lançar'}
            </button>
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        {/* Tabela Principal */}
        <div className="xl:col-span-3 space-y-4">
          <div className="bg-[#0f172a] rounded-xl shadow-2xl border border-slate-800 overflow-hidden">
            <div className="p-3 border-b border-slate-800 bg-slate-900/30 flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-300">Lançamentos</h3>
              <div className="flex items-center gap-3">
                <button 
                  onClick={exportToCSV}
                  className="flex items-center gap-2 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold uppercase transition-all"
                >
                  <Download className="w-3 h-3" /> Excel
                </button>
                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-slate-500" />
                  <select 
                    className="bg-slate-800 border border-slate-700 text-[10px] text-white rounded px-2 py-1 focus:ring-1 focus:ring-[#22d3ee] outline-none"
                    value={filterCompany}
                    onChange={(e) => setFilterCompany(e.target.value)}
                  >
                    <option value="GERAL">FILTRAR: GERAL</option>
                    {goals.map(g => (
                      <option key={g.id} value={g.companyName}>{g.companyName}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900/50 text-slate-400 border-b border-slate-800">
                    <th colSpan={2} className="px-3 py-2 text-[8px] font-bold uppercase border-r border-slate-800">Geral</th>
                    <th colSpan={3} className="px-3 py-2 text-[8px] font-bold uppercase border-r border-slate-800 text-center bg-blue-900/10">Plataforma</th>
                    <th colSpan={2} className="px-3 py-2 text-[8px] font-bold uppercase border-r border-slate-800 text-center bg-emerald-900/10">IDEP</th>
                    <th className="px-3 py-2 text-[8px] font-bold uppercase border-r border-slate-800">Resumo</th>
                    <th colSpan={2} className="px-3 py-2 text-[8px] font-bold uppercase text-center bg-rose-900/10">Diferença Meta (Mensal)</th>
                    <th className="px-3 py-2 text-[8px] font-bold uppercase text-right">Ação</th>
                  </tr>
                  <tr className="bg-slate-950 text-slate-500 text-[7px] font-bold uppercase border-b border-slate-800">
                    <th className="px-3 py-2 border-r border-slate-800">Data</th>
                    <th className="px-3 py-2 border-r border-slate-800">Empresa</th>
                    <th className="px-3 py-2 bg-blue-950/20 border-r border-slate-800">Bloqueira</th>
                    <th className="px-3 py-2 bg-blue-950/20 border-r border-slate-800">Agente</th>
                    <th className="px-3 py-2 bg-blue-950/30 border-r border-slate-800 font-black text-blue-400">Parcial</th>
                    <th className="px-3 py-2 bg-emerald-950/20 border-r border-slate-800">40H</th>
                    <th className="px-3 py-2 bg-emerald-950/20 border-r border-slate-800">20H</th>
                    <th className="px-3 py-2 border-r border-slate-800 font-black text-cyan-400">Total</th>
                    <th className="px-3 py-2 bg-rose-950/20 border-r border-slate-800">Dif. Bloq.</th>
                    <th className="px-3 py-2 bg-rose-950/20 border-r border-slate-800">Dif. Agente</th>
                    <th className="px-3 py-2 text-right whitespace-nowrap">Opções</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredEntries.map((row) => (
                    <tr key={row.id} className={`hover:bg-slate-800/20 transition-colors bg-[#0f172a] text-[9px] ${editingId === row.id ? 'bg-amber-500/5' : ''}`}>
                      <td className="px-3 py-1.5 font-mono text-slate-400 border-r border-slate-800">{new Date(row.date).toLocaleDateString('pt-BR')}</td>
                      <td className="px-3 py-1.5 font-bold text-slate-100 border-r border-slate-800">{row.companyName}</td>
                      <td className="px-3 py-1.5 text-slate-300 border-r border-slate-800 bg-blue-950/5">{formatCurrency(row.bloqueiraValue)}</td>
                      <td className="px-3 py-1.5 text-slate-300 border-r border-slate-800 bg-blue-950/5">{formatCurrency(row.agentValue)}</td>
                      <td className="px-3 py-1.5 font-black text-blue-300 border-r border-slate-800 bg-blue-950/10">{formatCurrency(row.partialTotal)}</td>
                      <td className="px-3 py-1.5 text-slate-300 border-r border-slate-800 bg-emerald-950/5">{formatCurrency(row.idep40hValue)}</td>
                      <td className="px-3 py-1.5 text-slate-300 border-r border-slate-800 bg-emerald-950/5">{formatCurrency(row.idep20hValue)}</td>
                      <td className="px-3 py-1.5 font-black text-cyan-400 border-r border-slate-800 bg-slate-900/40">{formatCurrency(row.totalGain)}</td>
                      <td className={`px-3 py-1.5 border-r border-slate-800 bg-rose-950/5 font-medium ${row.diffBloqueira >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {formatCurrency(row.diffBloqueira)}
                      </td>
                      <td className={`px-3 py-1.5 border-r border-slate-800 bg-rose-950/5 font-medium ${row.diffAgent >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {formatCurrency(row.diffAgent)}
                      </td>
                      <td className="px-3 py-1.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleEdit(row)} className="p-1 text-slate-500 hover:text-blue-400 bg-slate-800/30 rounded-md transition-colors">
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button onClick={() => onDelete(row.id)} className="p-1 text-slate-600 hover:text-rose-500 bg-slate-800/30 rounded-md transition-colors">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredEntries.length === 0 && (
                    <tr>
                      <td colSpan={11} className="px-4 py-8 text-center text-slate-600 italic">Nenhum registro encontrado para este filtro.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Quadro Lateral de Totais por Empresa */}
        <div className="space-y-4">
          <div className="bg-[#0f172a] rounded-xl shadow-2xl border border-slate-800 overflow-hidden h-fit">
            <div className="p-3 border-b border-slate-800 bg-slate-900/30">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-300">Resumo de Saldo</h3>
            </div>
            <div className="divide-y divide-slate-800">
              {companySummaries.map(company => (
                <div key={company.name} className="flex justify-between items-center px-4 py-2.5 hover:bg-slate-800/30 transition-all group">
                  <span className="text-[10px] font-black text-slate-400 uppercase group-hover:text-white transition-colors">{company.name}</span>
                  <span className="text-[11px] font-bold text-slate-200">{formatCurrency(company.total)}</span>
                </div>
              ))}
              
              <div className="bg-yellow-400/90 text-black px-4 py-2.5 flex justify-between items-center">
                <span className="text-[10px] font-black uppercase">GANHO TOTAL</span>
                <span className="text-xs font-black">{formatCurrency(totalGanhosGeral)}</span>
              </div>
              <div className="bg-slate-900 text-white px-4 py-2.5 flex justify-between items-center">
                <span className="text-[10px] font-black uppercase">SAÍDA GERAL</span>
                <span className="text-xs font-black">{formatCurrency(totalSaidas)}</span>
              </div>
              <div className="bg-yellow-500 text-black px-4 py-2.5 flex justify-between items-center shadow-[inset_0_2px_10px_rgba(0,0,0,0.2)]">
                <span className="text-[10px] font-black uppercase">SALDO EM CAIXA</span>
                <span className="text-sm font-black">{formatCurrency(emCaixa)}</span>
              </div>
            </div>
          </div>
          
          {filterCompany !== 'GERAL' && (
             <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-3 animate-in fade-in zoom-in duration-300">
                <h4 className="text-[10px] font-black text-blue-400 uppercase mb-1">Visualização: {filterCompany}</h4>
                <div className="flex justify-between items-center">
                  <span className="text-[9px] text-slate-400">Total Unidade:</span>
                  <span className="text-xs font-bold text-white">{formatCurrency(totalGanhosExibidos)}</span>
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};
