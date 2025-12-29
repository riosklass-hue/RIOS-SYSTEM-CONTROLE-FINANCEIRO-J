
import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Entry, Goal, Expense, ExpenseLocal } from '../types';
import { calculateEntries, formatCurrency } from '../utils/calculations';
import { TrendingDown, TrendingUp, CreditCard, Landmark } from 'lucide-react';

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
      if (selectedMonth === 'Tudo') return true;
      const expMonth = new Date(exp.data).toLocaleString('pt-BR', { month: 'long' });
      return expMonth === selectedMonth;
    });
  }, [expenses, selectedMonth]);

  const totalFilteredIncome = filteredEntries.reduce((acc, curr) => acc + curr.totalGain, 0);
  const totalFilteredExpenses = filteredExpenses.reduce((acc, curr) => acc + (curr.valor || 0), 0);

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
      name: selectedMonth === 'Tudo' ? 'Total Geral' : selectedMonth.toUpperCase(),
      Entradas: totalFilteredIncome,
      Saídas: totalFilteredExpenses,
      Saldo: totalFilteredIncome - totalFilteredExpenses
    }];
  }, [totalFilteredIncome, totalFilteredExpenses, selectedMonth]);

  const companyPerformance = useMemo(() => {
    const summary: Record<string, { name: string; plataforma: number; idep: number; total: number }> = {};
    filteredEntries.forEach(item => {
      if (!summary[item.companyName]) {
        summary[item.companyName] = { name: item.companyName, plataforma: 0, idep: 0, total: 0 };
      }
      summary[item.companyName].plataforma += item.partialTotal;
      summary[item.companyName].idep += (item.idep40hValue + item.idep20hValue);
      summary[item.companyName].total += item.totalGain;
    });
    return Object.values(summary);
  }, [filteredEntries]);

  const selectClasses = "bg-[#1e293b] border border-slate-700 text-white rounded-md px-2 py-1 text-[10px] focus:ring-1 focus:ring-[#22d3ee] outline-none cursor-pointer";

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0f172a] border border-slate-800 p-2 rounded-lg shadow-xl">
          <p className="text-[10px] font-bold text-white mb-1 uppercase tracking-tighter">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-[9px] font-medium" style={{ color: entry.color || entry.fill }}>
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
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-[#1e293b]/20 p-4 rounded-2xl border border-slate-800 flex flex-wrap gap-6 items-center shadow-lg">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Mês</span>
          <select className={selectClasses} value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
            {months.map(m => <option key={m} value={m} className="bg-[#0f172a]">{m}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Unidade</span>
          <select className={selectClasses} value={selectedCompany} onChange={e => setSelectedCompany(e.target.value)}>
            {companies.map(c => <option key={c} value={c} className="bg-[#0f172a]">{c}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0f172a] p-6 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500"></div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-[11px] font-black text-white uppercase tracking-widest">Análise de Saídas</h3>
              <p className="text-[9px] text-slate-500 uppercase font-bold">Por Canal de Pagamento</p>
            </div>
            <div className="p-2 bg-rose-500/10 rounded-xl">
              <CreditCard className="w-5 h-5 text-rose-500" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
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
            <div className="space-y-3">
              {expenseDistribution.map((item, idx) => (
                <div key={idx} className="bg-slate-900/40 p-3 rounded-xl border border-slate-800/50">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{item.name}</span>
                    <span className="text-[10px] font-bold text-white">{((item.value / totalFilteredExpenses) * 100).toFixed(1)}%</span>
                  </div>
                  <p className="text-xs font-black text-white">{formatCurrency(item.value)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-[#0f172a] p-6 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-[11px] font-black text-white uppercase tracking-widest">Fluxo de Caixa</h3>
              <p className="text-[9px] text-slate-500 uppercase font-bold">Entradas vs Saídas</p>
            </div>
            <div className="p-2 bg-blue-500/10 rounded-xl">
              <Landmark className="w-5 h-5 text-blue-500" />
            </div>
          </div>
          
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashFlowData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis dataKey="name" fontSize={9} tick={{ fill: '#64748b' }} hide />
                <YAxis fontSize={9} tick={{ fill: '#64748b' }} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v/1000}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '9px', fontWeight: '900', textTransform: 'uppercase' }} />
                <Bar dataKey="Entradas" fill="#22d3ee" radius={[4, 4, 0, 0]} barSize={40} />
                <Bar dataKey="Saídas" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
