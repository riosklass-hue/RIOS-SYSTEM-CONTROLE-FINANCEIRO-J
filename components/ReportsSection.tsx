
import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Entry, Goal, Expense } from '../types';
import { calculateEntries, formatCurrency } from '../utils/calculations';

interface Props {
  entries: Entry[];
  goals: Goal[];
  expenses: Expense[];
  compact?: boolean;
}

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

  const filteredData = useMemo(() => {
    return calculated.filter(item => {
      const monthMatch = selectedMonth === 'Tudo' || item.month === selectedMonth;
      const companyMatch = selectedCompany === 'Tudo' || item.companyName === selectedCompany;
      return monthMatch && companyMatch;
    });
  }, [calculated, selectedMonth, selectedCompany]);

  const companyPerformance = useMemo(() => {
    const summary: Record<string, { name: string; plataforma: number; idep: number; total: number; meta: number }> = {};
    
    // Inicializar com todas as empresas que têm metas, para garantir que apareçam mesmo sem entradas
    goals.forEach(goal => {
      if (selectedCompany === 'Tudo' || goal.companyName === selectedCompany) {
        summary[goal.companyName] = { 
          name: goal.companyName, 
          plataforma: 0, 
          idep: 0, 
          total: 0, 
          meta: goal.bloqueiraMeta + goal.agentMeta 
        };
      }
    });

    filteredData.forEach(item => {
      if (!summary[item.companyName]) {
        summary[item.companyName] = { 
          name: item.companyName, 
          plataforma: 0, 
          idep: 0, 
          total: 0, 
          meta: item.weeklyGoal 
        };
      }
      summary[item.companyName].plataforma += item.partialTotal;
      summary[item.companyName].idep += (item.idep40hValue + item.idep20hValue);
      summary[item.companyName].total += item.totalGain;
    });
    return Object.values(summary);
  }, [filteredData, goals, selectedCompany]);

  const weeklyTrend = useMemo(() => {
    const trend: Record<number, { week: string; value: number }> = {};
    filteredData.forEach(item => {
      if (!trend[item.weekNumber]) {
        trend[item.weekNumber] = { week: `SEM ${item.weekNumber}`, value: 0 };
      }
      trend[item.weekNumber].value += item.totalGain;
    });
    return Object.values(trend).sort((a, b) => a.week.localeCompare(b.week));
  }, [filteredData]);

  const selectClasses = "bg-[#1e293b] border border-slate-700 text-white rounded-md px-1 py-0.5 text-[10px] focus:ring-1 focus:ring-[#22d3ee] outline-none cursor-pointer";

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0f172a] border border-slate-800 p-2 rounded-lg shadow-xl">
          <p className="text-[10px] font-bold text-white mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-[9px]" style={{ color: entry.color }}>
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
    <div className="space-y-4">
      <div className="bg-[#1e293b]/20 p-2 rounded-lg border border-slate-800 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Mês</span>
          <select className={selectClasses} value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
            {months.map(m => <option key={m} value={m} className="bg-[#0f172a]">{m}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Empresa</span>
          <select className={selectClasses} value={selectedCompany} onChange={e => setSelectedCompany(e.target.value)}>
            {companies.map(c => <option key={c} value={c} className="bg-[#0f172a]">{c}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase mb-4 tracking-wider flex items-center gap-2">
            Distribuição Realizada
          </h3>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={companyPerformance}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis dataKey="name" fontSize={9} tick={{ fill: '#64748b' }} tickLine={false} axisLine={false} />
                <YAxis fontSize={9} tick={{ fill: '#64748b' }} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v/1000}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '9px', fontWeight: 'bold' }} />
                <Bar dataKey="plataforma" name="Plataforma" fill="#0891b2" radius={[2, 2, 0, 0]} />
                <Bar dataKey="idep" name="IDEP" fill="#10b981" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase mb-4 tracking-wider flex items-center gap-2">
            Tendência de Ganhos Semanal
          </h3>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis dataKey="week" fontSize={9} tick={{ fill: '#64748b' }} tickLine={false} axisLine={false} />
                <YAxis fontSize={9} tick={{ fill: '#64748b' }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="value" name="Total Semanal" stroke="#8b5cf6" strokeWidth={3} dot={{ fill: '#8b5cf6', r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
