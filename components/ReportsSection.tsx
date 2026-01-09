
import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Entry, Goal, Expense, ExpenseLocal } from '../types';
import { calculateEntries, formatCurrency } from '../utils/calculations';
import { TrendingDown, TrendingUp, CreditCard, Landmark, Building2, Shield, UserCheck, Receipt, ListFilter, ArrowRight } from 'lucide-react';

interface Props {
  entries: Entry[];
  goals: Goal[];
  expenses: Expense[];
  compact?: boolean;
}

const EXPENSE_COLORS = {
  [ExpenseLocal.PIX]: '#6366f1',
  [ExpenseLocal.COFRE]: '#f59e0b',
  [ExpenseLocal.OUTROS]: '#64748b'
};

export const ReportsSection: React.FC<Props> = ({ entries, goals, expenses, compact = false }) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('Tudo');
  const [selectedCompany, setSelectedCompany] = useState<string>('Tudo');

  const calculated = useMemo(() => calculateEntries(entries, goals), [entries, goals]);

  const months = useMemo(() => {
    const m = Array.from(new Set(calculated.map(c => c.month)));
    return ['Tudo', ...m];
  }, [calculated]);

  const companies = useMemo(() => {
    const c = Array.from(new Set(calculated.map(entry => entry.companyName)));
    return ['Tudo', ...c];
  }, [calculated]);

  const filteredEntries = useMemo(() => {
    return calculated.filter(item => {
      const monthMatch = selectedMonth === 'Tudo' || item.month === selectedMonth;
      const companyMatch = selectedCompany === 'Tudo' || item.companyName === selectedCompany;
      return monthMatch && companyMatch;
    });
  }, [calculated, selectedMonth, selectedCompany]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      const expDate = new Date(exp.data);
      const expMonth = expDate.toLocaleString('pt-BR', { month: 'long' });
      const monthMatch = selectedMonth === 'Tudo' || expMonth === selectedMonth;
      return monthMatch;
    });
  }, [expenses, selectedMonth]);

  const totalFilteredIncome = filteredEntries.reduce((acc, curr) => acc + curr.totalGain, 0);
  const totalFilteredExpenses = filteredExpenses.reduce((acc, curr) => acc + (curr.valor || 0), 0);

  // Novos dados para análise agrupada por canal
  const expenseGroupedData = useMemo(() => {
    const groups: Record<string, { count: number; total: number }> = {
      [ExpenseLocal.PIX]: { count: 0, total: 0 },
      [ExpenseLocal.COFRE]: { count: 0, total: 0 },
      [ExpenseLocal.OUTROS]: { count: 0, total: 0 }
    };

    filteredExpenses.forEach(exp => {
      const loc = exp.local || ExpenseLocal.OUTROS;
      if (groups[loc]) {
        groups[loc].count++;
        groups[loc].total += (exp.valor || 0);
      }
    });

    return Object.entries(groups).map(([channel, data]) => ({
      channel,
      ...data,
      avg: data.count > 0 ? data.total / data.count : 0
    })).filter(g => g.count > 0 || g.total > 0);
  }, [filteredExpenses]);

  const topExpenses = useMemo(() => {
    return [...filteredExpenses]
      .sort((a, b) => (b.valor || 0) - (a.valor || 0))
      .slice(0, 5);
  }, [filteredExpenses]);

  const expenseDistribution = useMemo(() => {
    const data = [
      { name: 'PIX', value: filteredExpenses.filter(e => e.local === ExpenseLocal.PIX).reduce((a, c) => a + (c.valor || 0), 0) },
      { name: 'COFRE', value: filteredExpenses.filter(e => e.local === ExpenseLocal.COFRE).reduce((a, c) => a + (c.valor || 0), 0) },
      { name: 'OUTROS', value: filteredExpenses.filter(e => e.local === ExpenseLocal.OUTROS || !e.local).reduce((a, c) => a + (c.valor || 0), 0) }
    ];
    return data.filter(d => d.value > 0);
  }, [filteredExpenses]);

  const cashFlowData = useMemo(() => {
    return [{
      name: selectedMonth === 'Tudo' ? 'TOTAL' : selectedMonth.toUpperCase(),
      Entradas: totalFilteredIncome,
      Saídas: totalFilteredExpenses,
      Saldo: totalFilteredIncome - totalFilteredExpenses
    }];
  }, [totalFilteredIncome, totalFilteredExpenses, selectedMonth]);

  const companyPerformance = useMemo(() => {
    const summary: Record<string, { name: string; plataforma: number; idep: number; total: number; bloqueira: number; agente: number }> = {};
    filteredEntries.forEach(item => {
      if (!summary[item.companyName]) {
        summary[item.companyName] = { name: item.companyName, plataforma: 0, idep: 0, total: 0, bloqueira: 0, agente: 0 };
      }
      summary[item.companyName].plataforma += item.partialTotal;
      summary[item.companyName].bloqueira += (item.bloqueiraValue || 0);
      summary[item.companyName].agente += (item.agentValue || 0);
      summary[item.companyName].idep += (item.idep40hValue + item.idep20hValue);
      summary[item.companyName].total += item.totalGain;
    });
    return Object.values(summary).sort((a, b) => b.total - a.total);
  }, [filteredEntries]);

  const selectClasses = "bg-[#1e293b] border border-slate-700 text-white rounded-md px-3 py-1.5 text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-blue-500/50 outline-none cursor-pointer transition-all";

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0f172a] border border-slate-800 p-3 rounded-xl shadow-2xl">
          <p className="text-[10px] font-black text-white mb-2 uppercase tracking-widest">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-[9px] font-bold" style={{ color: entry.color || entry.fill }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (compact) {
    return (
      <div className="h-[180px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={companyPerformance}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
            <XAxis dataKey="name" fontSize={8} tick={{ fill: '#64748b' }} tickLine={false} axisLine={false} />
            <YAxis fontSize={8} tick={{ fill: '#64748b' }} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v/1000}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="total" name="Total Realizado" fill="#0891b2" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Filtros Estilo Dashboard */}
      <div className="bg-[#0f172a] p-5 rounded-[2rem] border border-slate-800 flex flex-wrap gap-6 items-center shadow-2xl">
        <div className="flex items-center gap-3">
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Período</span>
          <select className={selectClasses} value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
            {months.map(m => <option key={m} value={m} className="bg-[#0f172a]">{m.toUpperCase()}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Unidade</span>
          <select className={selectClasses} value={selectedCompany} onChange={e => setSelectedCompany(e.target.value)}>
            {companies.map(c => <option key={c} value={c} className="bg-[#0f172a]">{c.toUpperCase()}</option>)}
          </select>
        </div>
        <div className="ml-auto text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
           <RefreshCw className="w-3 h-3 animate-spin-slow" /> Dados Sincronizados
        </div>
      </div>

      {/* Relatório Principal: Entradas por Unidade */}
      <div className="bg-[#0f172a] p-8 rounded-[3rem] shadow-2xl border border-slate-800">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600/10 rounded-2xl">
              <Building2 className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Entradas por Unidade Detalhadas</h3>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Análise de Performance Mensal</p>
            </div>
          </div>
          <div className="text-right">
             <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Total Filtrado</span>
             <h4 className="text-xl font-black text-cyan-400">{formatCurrency(totalFilteredIncome)}</h4>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {companyPerformance.map((company, idx) => (
            <div key={company.name} className="p-6 bg-slate-900/30 rounded-3xl border border-slate-800/50 hover:border-slate-700 transition-all flex flex-col justify-between group">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-[9px] font-black text-slate-600 uppercase mb-1 block">#{idx + 1} Ranking</span>
                  <h5 className="text-xs font-black text-white uppercase tracking-tight group-hover:text-blue-400 transition-colors">{company.name}</h5>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black text-white">{formatCurrency(company.total)}</span>
                  <p className="text-[8px] font-bold text-slate-600 uppercase">{(totalFilteredIncome > 0 ? (company.total / totalFilteredIncome) * 100 : 0).toFixed(1)}% do total</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-widest">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-500"></div>
                    <span className="text-slate-400">Bloqueira</span>
                  </div>
                  <span className="text-white">{formatCurrency(company.bloqueira)}</span>
                </div>
                <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-widest">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                    <span className="text-slate-400">Agente</span>
                  </div>
                  <span className="text-white">{formatCurrency(company.agente)}</span>
                </div>
                <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-widest opacity-60">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-500"></div>
                    <span className="text-slate-400">IDEP</span>
                  </div>
                  <span className="text-white">{formatCurrency(company.idep)}</span>
                </div>
              </div>

              <div className="mt-6 w-full bg-slate-950 h-2 rounded-full overflow-hidden flex">
                <div className="bg-cyan-600 h-full" style={{ width: `${(company.bloqueira / (company.total || 1)) * 100}%` }}></div>
                <div className="bg-indigo-600 h-full" style={{ width: `${(company.agente / (company.total || 1)) * 100}%` }}></div>
                <div className="bg-slate-700 h-full" style={{ width: `${(company.idep / (company.total || 1)) * 100}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* NOVO RELATÓRIO: Detalhamento de Saídas por Canal */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="bg-[#0f172a] p-8 rounded-[3rem] border border-slate-800 shadow-2xl">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-amber-600/10 rounded-2xl">
              <ListFilter className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Análise Agrupada de Saídas</h3>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Volume e Médias por Canal</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/20">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-900/50 text-slate-500 text-[8px] font-black uppercase tracking-widest border-b border-slate-800">
                  <th className="px-6 py-4">Canal</th>
                  <th className="px-6 py-4 text-center">Transações</th>
                  <th className="px-6 py-4 text-center">Média / Lançamento</th>
                  <th className="px-6 py-4 text-right">Total Canal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {expenseGroupedData.map((item) => (
                  <tr key={item.channel} className="hover:bg-slate-800/20 transition-all text-[10px]">
                    <td className="px-6 py-4 flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: EXPENSE_COLORS[item.channel as ExpenseLocal] }}></div>
                      <span className="font-black text-white uppercase">{item.channel}</span>
                    </td>
                    <td className="px-6 py-4 text-center text-slate-400 font-bold">{item.count}</td>
                    <td className="px-6 py-4 text-center text-slate-400 font-bold">{formatCurrency(item.avg)}</td>
                    <td className="px-6 py-4 text-right font-black text-white">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
                {expenseGroupedData.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-600 font-bold uppercase tracking-widest text-[9px] opacity-30 italic">
                      Nenhuma saída registrada para o período.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-[#0f172a] p-8 rounded-[3rem] border border-slate-800 shadow-2xl">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-rose-600/10 rounded-2xl">
              <Receipt className="w-6 h-6 text-rose-500" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Maiores Saídas</h3>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Top 5 Lançamentos de Alto Valor</p>
            </div>
          </div>

          <div className="space-y-4">
            {topExpenses.map((exp) => (
              <div key={exp.id} className="p-4 bg-slate-900/40 rounded-2xl border border-slate-800/50 flex items-center justify-between hover:bg-slate-800 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-1.5 h-8 bg-rose-600/50 rounded-full group-hover:bg-rose-500 transition-all"></div>
                  <div>
                    <h5 className="text-[11px] font-black text-slate-200 uppercase truncate max-w-[200px]">{exp.nome}</h5>
                    <p className="text-[8px] font-bold text-slate-500 uppercase mt-0.5">
                      {new Date(exp.data).toLocaleDateString('pt-BR')} • {exp.local}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-rose-500">{formatCurrency(exp.valor)}</span>
                </div>
              </div>
            ))}
            {topExpenses.length === 0 && (
              <div className="py-12 flex flex-col items-center justify-center opacity-20 grayscale gap-3">
                <Receipt className="w-10 h-10" />
                <p className="text-[9px] font-black uppercase tracking-widest">Aguardando dados...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Gráficos Secundários */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-[#0f172a] p-8 rounded-[3rem] border border-slate-800 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-600"></div>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-[11px] font-black text-white uppercase tracking-widest">Distribuição de Saídas</h3>
              <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">Gastos por Tipo</p>
            </div>
            <div className="p-3 bg-rose-500/10 rounded-2xl">
              <CreditCard className="w-6 h-6 text-rose-500" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {expenseDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={EXPENSE_COLORS[entry.name as ExpenseLocal] || '#64748b'} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4">
              {expenseDistribution.map((item, idx) => (
                <div key={idx} className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800/50 hover:bg-slate-800/50 transition-all">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">{item.name}</span>
                    <span className="text-[10px] font-black text-white">{(totalFilteredExpenses > 0 ? (item.value / totalFilteredExpenses) * 100 : 0).toFixed(1)}%</span>
                  </div>
                  <p className="text-sm font-black text-white">{formatCurrency(item.value)}</p>
                </div>
              ))}
              <div className="pt-2 border-t border-slate-800/50">
                <div className="flex justify-between items-center px-4">
                   <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Total Geral Saídas</span>
                   <span className="text-sm font-black text-rose-500">{formatCurrency(totalFilteredExpenses)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#0f172a] p-8 rounded-[3rem] border border-slate-800 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600"></div>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-[11px] font-black text-white uppercase tracking-widest">Fluxo Financeiro Consolidado</h3>
              <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">DRE Simplificado</p>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-2xl">
              <Landmark className="w-6 h-6 text-blue-500" />
            </div>
          </div>
          
          <div className="h-[240px] w-full mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashFlowData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis dataKey="name" fontSize={10} tick={{ fill: '#64748b' }} hide />
                <YAxis fontSize={9} tick={{ fill: '#64748b' }} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v/1000}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '9px', fontWeight: '900', textTransform: 'uppercase' }} />
                <Bar dataKey="Entradas" fill="#22d3ee" radius={[6, 6, 0, 0]} barSize={45} />
                <Bar dataKey="Saídas" fill="#f43f5e" radius={[6, 6, 0, 0]} barSize={45} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-slate-900/50 p-6 rounded-[2rem] border border-slate-800/50 flex items-center justify-between">
             <div className="space-y-1">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Lucro Líquido do Período</span>
                <h4 className={`text-2xl font-black ${(totalFilteredIncome - totalFilteredExpenses) >= 0 ? 'text-blue-400' : 'text-rose-500'}`}>
                  {formatCurrency(totalFilteredIncome - totalFilteredExpenses)}
                </h4>
             </div>
             <div className="p-3 bg-blue-500/20 rounded-2xl text-blue-400">
                {(totalFilteredIncome - totalFilteredExpenses) >= 0 ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const RefreshCw = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
    <path d="M21 3v5h-5"/>
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
    <path d="M3 21v-5h5"/>
  </svg>
);
