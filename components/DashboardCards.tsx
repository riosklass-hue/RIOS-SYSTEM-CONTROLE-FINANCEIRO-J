
import React from 'react';
import { TrendingUp, TrendingDown, Wallet, Target } from 'lucide-react';
import { formatCurrency } from '../utils/calculations';

interface Props {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  goalAchievement: number;
}

export const DashboardCards: React.FC<Props> = ({ totalIncome, totalExpenses, balance, goalAchievement }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
      <div className="bg-[#0f172a] p-3 rounded-xl shadow-xl border border-slate-800 hover:border-[#22d3ee]/30 transition-all group">
        <div className="flex items-center justify-between mb-2">
          <span className="text-slate-500 text-[9px] font-bold uppercase tracking-wider">Entradas</span>
          <div className="p-1.5 bg-[#0891b2]/10 rounded-lg">
            <TrendingUp className="w-3.5 h-3.5 text-[#22d3ee]" />
          </div>
        </div>
        <div className="text-xl font-bold text-white tracking-tight">{formatCurrency(totalIncome)}</div>
      </div>

      <div className="bg-[#0f172a] p-3 rounded-xl shadow-xl border border-slate-800 hover:border-rose-500/30 transition-all group">
        <div className="flex items-center justify-between mb-2">
          <span className="text-slate-500 text-[9px] font-bold uppercase tracking-wider">Saídas</span>
          <div className="p-1.5 bg-rose-500/10 rounded-lg">
            <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
          </div>
        </div>
        <div className="text-xl font-bold text-white tracking-tight">{formatCurrency(totalExpenses)}</div>
      </div>

      <div className="bg-[#0f172a] p-3 rounded-xl shadow-xl border border-slate-800 hover:border-blue-500/30 transition-all group">
        <div className="flex items-center justify-between mb-2">
          <span className="text-slate-500 text-[9px] font-bold uppercase tracking-wider">Saldo</span>
          <div className="p-1.5 bg-blue-500/10 rounded-lg">
            <Wallet className="w-3.5 h-3.5 text-blue-400" />
          </div>
        </div>
        <div className={`text-xl font-bold tracking-tight ${balance >= 0 ? 'text-blue-400' : 'text-rose-500'}`}>
          {formatCurrency(balance)}
        </div>
      </div>

      <div className="bg-[#0f172a] p-3 rounded-xl shadow-xl border border-slate-800 hover:border-amber-500/30 transition-all group">
        <div className="flex items-center justify-between mb-2">
          <span className="text-slate-500 text-[9px] font-bold uppercase tracking-wider">Metas</span>
          <div className="p-1.5 bg-amber-500/10 rounded-lg">
            <Target className="w-3.5 h-3.5 text-amber-500" />
          </div>
        </div>
        <div className="text-xl font-bold text-white tracking-tight">{goalAchievement.toFixed(1)}%</div>
        <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-amber-500 to-amber-300 h-full rounded-full transition-all duration-1000" 
            style={{ width: `${Math.min(goalAchievement, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
};
