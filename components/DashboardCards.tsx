
import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Wallet, Target, Building2, CreditCard, ChevronRight, ArrowUpRight, ArrowDownRight, Clock, MoreVertical, Shield, UserCheck, PieChart } from 'lucide-react';
import { formatCurrency } from '../utils/calculations';
import { Entry, Goal, Expense, ExpenseLocal } from '../types';

interface Props {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  goalAchievement: number;
  entries: Entry[];
  goals: Goal[];
  expenses: Expense[];
}

export const DashboardCards: React.FC<Props> = ({ 
  totalIncome, 
  totalExpenses, 
  balance, 
  goalAchievement,
  entries,
  goals,
  expenses
}) => {
  // Cálculo detalhado de faturamento por empresa (Bloqueira e Agente)
  const entriesByCompany = useMemo(() => {
    const summary: Record<string, { total: number, bloqueira: number, agente: number }> = {};
    entries.forEach(e => {
      const b = (e.bloqueiraValue || 0);
      const a = (e.agentValue || 0);
      const i = (e.idep40hValue || 0) + (e.idep20hValue || 0);
      const valorTotal = b + a + i;
      
      if (!summary[e.companyName]) {
        summary[e.companyName] = { total: 0, bloqueira: 0, agente: 0 };
      }
      summary[e.companyName].total += valorTotal;
      summary[e.companyName].bloqueira += b;
      summary[e.companyName].agente += a;
    });
    
    return Object.entries(summary)
      .sort((a, b) => b[1].total - a[1].total)
      .map(([name, data]) => ({
        name,
        ...data,
        percentage: totalIncome > 0 ? (data.total / totalIncome) * 100 : 0
      }));
  }, [entries, totalIncome]);

  // Totais globais por origem
  const sourceTotals = useMemo(() => {
    return entries.reduce((acc, curr) => {
      acc.bloqueira += (curr.bloqueiraValue || 0);
      acc.agente += (curr.agentValue || 0);
      return acc;
    }, { bloqueira: 0, agente: 0 });
  }, [entries]);

  // Histórico de saídas recentes
  const recentExpenses = useMemo(() => {
    return [...expenses]
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
      .slice(0, 5);
  }, [expenses]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Top Indicators - Bento Style */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-[#0f172a] to-[#1e293b] p-6 rounded-[2.5rem] border border-slate-800 shadow-2xl relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all"></div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-cyan-500/20 rounded-xl text-cyan-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Faturamento</span>
          </div>
          <h3 className="text-2xl font-black text-white">{formatCurrency(totalIncome)}</h3>
          <div className="mt-4 flex items-center gap-1.5 text-[9px] font-black text-cyan-500 uppercase tracking-widest">
            <ArrowUpRight className="w-3.5 h-3.5" /> Entradas Ativas
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#0f172a] to-[#1e293b] p-6 rounded-[2.5rem] border border-slate-800 shadow-2xl relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-all"></div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-rose-500/20 rounded-xl text-rose-400">
              <TrendingDown className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Despesas</span>
          </div>
          <h3 className="text-2xl font-black text-white">{formatCurrency(totalExpenses)}</h3>
          <div className="mt-4 flex items-center gap-1.5 text-[9px] font-black text-rose-500 uppercase tracking-widest">
            <ArrowDownRight className="w-3.5 h-3.5" /> Fluxo de Saída
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#0f172a] to-[#1e293b] p-6 rounded-[2.5rem] border border-slate-800 shadow-2xl relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all"></div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500/20 rounded-xl text-blue-400">
              <Wallet className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Caixa Livre</span>
          </div>
          <h3 className={`text-2xl font-black ${balance >= 0 ? 'text-blue-400' : 'text-rose-500'}`}>{formatCurrency(balance)}</h3>
          <div className="mt-4 flex items-center gap-1.5 text-[9px] font-black text-blue-500 uppercase tracking-widest">
            Saldo Consolidado
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#0f172a] to-[#1e293b] p-6 rounded-[2.5rem] border border-slate-800 shadow-2xl relative overflow-hidden group">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-500/20 rounded-xl text-amber-400">
              <Target className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Meta Geral</span>
          </div>
          <h3 className="text-2xl font-black text-white">{goalAchievement.toFixed(1)}%</h3>
          <div className="w-full bg-slate-900/50 h-2.5 rounded-full mt-4 overflow-hidden border border-slate-800 p-[1px]">
            <div 
              className="bg-gradient-to-r from-amber-600 to-amber-400 h-full rounded-full transition-all duration-1000" 
              style={{ width: `${Math.min(goalAchievement, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Origem das Entradas: Bloqueira vs Agente */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="bg-gradient-to-r from-cyan-600/10 to-blue-600/10 p-6 rounded-3xl border border-blue-500/20 flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="p-3 bg-cyan-500/20 rounded-2xl">
                  <Shield className="w-6 h-6 text-cyan-400" />
               </div>
               <div>
                  <p className="text-[9px] font-black text-cyan-500 uppercase tracking-[0.2em]">Total Bloqueira</p>
                  <h4 className="text-xl font-black text-white">{formatCurrency(sourceTotals.bloqueira)}</h4>
               </div>
            </div>
            <div className="text-right">
               <span className="text-[10px] font-bold text-slate-500 uppercase">Partic. no Bruto</span>
               <p className="text-sm font-black text-cyan-400">{(totalIncome > 0 ? (sourceTotals.bloqueira / totalIncome) * 100 : 0).toFixed(1)}%</p>
            </div>
         </div>
         <div className="bg-gradient-to-r from-indigo-600/10 to-purple-600/10 p-6 rounded-3xl border border-indigo-500/20 flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="p-3 bg-indigo-500/20 rounded-2xl">
                  <UserCheck className="w-6 h-6 text-indigo-400" />
               </div>
               <div>
                  <p className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.2em]">Total Agente</p>
                  <h4 className="text-xl font-black text-white">{formatCurrency(sourceTotals.agente)}</h4>
               </div>
            </div>
            <div className="text-right">
               <span className="text-[10px] font-bold text-slate-500 uppercase">Partic. no Bruto</span>
               <p className="text-sm font-black text-indigo-400">{(totalIncome > 0 ? (sourceTotals.agente / totalIncome) * 100 : 0).toFixed(1)}%</p>
            </div>
         </div>
      </div>

      {/* Detailed Analysis - Secondary Bento Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* Entradas por Empresa Detalhadas - Left side (3 cols) */}
        <div className="lg:col-span-3 bg-[#0f172a] p-8 rounded-[3rem] shadow-2xl border border-slate-800 flex flex-col h-full">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-600/10 rounded-2xl">
                <Building2 className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h4 className="text-sm font-black text-white uppercase tracking-[0.2em]">Entradas por Unidade</h4>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Detalhamento Bloqueira vs Agente</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-8 flex-1">
            {entriesByCompany.length > 0 ? entriesByCompany.map((company, idx) => (
              <div key={company.name} className="group cursor-default bg-slate-900/20 p-4 rounded-3xl border border-transparent hover:border-slate-700 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-slate-700 w-5">{idx + 1}</span>
                    <div>
                       <span className="text-sm font-black text-slate-200 uppercase tracking-tight group-hover:text-blue-400 transition-colors">{company.name}</span>
                       <p className="text-[8px] font-bold text-slate-600 uppercase mt-0.5">{company.percentage.toFixed(1)}% do total bruto</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-black text-white">{formatCurrency(company.total)}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-3">
                   <div className="bg-slate-950/50 p-3 rounded-2xl border border-slate-800/50">
                      <div className="flex items-center gap-2 mb-1">
                         <div className="w-1.5 h-1.5 rounded-full bg-cyan-500"></div>
                         <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Bloqueira</span>
                      </div>
                      <p className="text-xs font-black text-cyan-400">{formatCurrency(company.bloqueira)}</p>
                   </div>
                   <div className="bg-slate-950/50 p-3 rounded-2xl border border-slate-800/50">
                      <div className="flex items-center gap-2 mb-1">
                         <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                         <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Agente</span>
                      </div>
                      <p className="text-xs font-black text-indigo-400">{formatCurrency(company.agente)}</p>
                   </div>
                </div>

                <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800/50 p-[1px] flex">
                  <div 
                    className="bg-cyan-600 h-full transition-all duration-700 shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                    style={{ width: `${company.total > 0 ? (company.bloqueira / company.total) * 100 : 0}%` }}
                  />
                  <div 
                    className="bg-indigo-600 h-full transition-all duration-700 shadow-[0_0_10px_rgba(79,70,229,0.3)] border-l border-slate-900"
                    style={{ width: `${company.total > 0 ? (company.agente / company.total) * 100 : 0}%` }}
                  />
                  <div 
                    className="bg-slate-700 h-full transition-all duration-700 border-l border-slate-900"
                    style={{ width: `${company.total > 0 ? ((company.total - company.bloqueira - company.agente) / company.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            )) : (
              <div className="h-full flex flex-col items-center justify-center opacity-30 gap-3 grayscale">
                <Building2 className="w-12 h-12" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em]">Aguardando faturamento...</p>
              </div>
            )}
          </div>
        </div>

        {/* Saídas Detalhadas - Right side (2 cols) */}
        <div className="lg:col-span-2 bg-[#0f172a] p-8 rounded-[3rem] shadow-2xl border border-slate-800 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-rose-600/10 rounded-2xl">
                <Clock className="w-6 h-6 text-rose-500" />
              </div>
              <div>
                <h4 className="text-sm font-black text-white uppercase tracking-[0.2em]">Saídas Recentes</h4>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Últimos Lançamentos</p>
              </div>
            </div>
            <button className="p-2 text-slate-600 hover:text-white transition-colors">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4 flex-1">
            {recentExpenses.length > 0 ? recentExpenses.map(exp => (
              <div key={exp.id} className="p-4 bg-slate-900/40 rounded-[1.5rem] border border-slate-800/50 hover:border-rose-500/30 transition-all flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border shadow-lg ${
                    exp.local === ExpenseLocal.PIX ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' :
                    exp.local === ExpenseLocal.COFRE ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                    'bg-slate-500/10 border-slate-500/20 text-slate-400'
                  }`}>
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-[11px] font-black text-slate-200 uppercase truncate max-w-[120px]">{exp.nome}</h5>
                    <p className="text-[8px] font-bold text-slate-600 uppercase mt-0.5">
                      {new Date(exp.data).toLocaleDateString('pt-BR')} • {exp.local}
                    </p>
                  </div>
                </div>
                <p className="text-xs font-black text-rose-500 group-hover:scale-105 transition-transform">{formatCurrency(exp.valor)}</p>
              </div>
            )) : (
              <div className="h-full flex flex-col items-center justify-center opacity-30 gap-3 grayscale">
                <CreditCard className="w-12 h-12" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em]">Fluxo limpo</p>
              </div>
            )}
          </div>
          
          <div className="mt-8 pt-6 border-t border-slate-800/50">
             <div className="flex justify-between items-center p-5 bg-slate-900/60 rounded-2xl border border-slate-800/30">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Saídas Totais</span>
                <span className="text-sm font-black text-rose-500">{formatCurrency(totalExpenses)}</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
