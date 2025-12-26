
import React, { useState, useEffect, useMemo } from 'react';
import { LayoutDashboard, ArrowUpCircle, ArrowDownCircle, Target, FileBarChart, User, Lock, ArrowRight, Users, LogOut } from 'lucide-react';
import { Entry, Goal, Expense, UserProfile } from './types';
import { calculateEntries } from './utils/calculations';
import { DashboardCards } from './components/DashboardCards';
import { IncomeSection } from './components/IncomeSection';
import { ExpenseSection } from './components/ExpenseSection';
import { GoalSection } from './components/GoalSection';
import { ReportsSection } from './components/ReportsSection';
import { UserSection } from './components/UserSection';

type Tab = 'dashboard' | 'income' | 'expenses' | 'goals' | 'reports' | 'users';

// Componente de Logo Personalizada SR
const RiosLogo: React.FC<{ className?: string }> = ({ className = "w-8 h-8" }) => (
  <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
    <text x="35" y="75" fontFamily="serif" fontSize="70" fontWeight="bold" fill="#2563eb" style={{ fontStyle: 'italic' }}>R</text>
    <text x="15" y="70" fontFamily="serif" fontSize="75" fontWeight="bold" fill="#ef4444" style={{ fontStyle: 'italic' }}>S</text>
  </svg>
);

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('rios_auth') === 'true';
  });
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('rios_current_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  
  // Persistent State
  const [entries, setEntries] = useState<Entry[]>(() => {
    const saved = localStorage.getItem('idep_entries');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('idep_expenses');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [goals, setGoals] = useState<Goal[]>(() => {
    const saved = localStorage.getItem('idep_goals');
    return saved ? JSON.parse(saved) : [
      { id: '1', code: '001', companyName: 'OK OK', bloqueiraMeta: 600, agentMeta: 400, idep40hMeta: 5000, idep20hMeta: 2500 },
      { id: '2', code: '002', companyName: 'ANGELO', bloqueiraMeta: 400, agentMeta: 100, idep40hMeta: 5000, idep20hMeta: 2500 }
    ];
  });

  const [users, setUsers] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem('rios_users');
    if (saved) return JSON.parse(saved);
    return [{ id: 'admin-id', username: 'admin', password: '123', displayName: 'Administrador' }];
  });

  useEffect(() => localStorage.setItem('idep_entries', JSON.stringify(entries)), [entries]);
  useEffect(() => localStorage.setItem('idep_expenses', JSON.stringify(expenses)), [expenses]);
  useEffect(() => localStorage.setItem('idep_goals', JSON.stringify(goals)), [goals]);
  useEffect(() => localStorage.setItem('rios_users', JSON.stringify(users)), [users]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const foundUser = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);

    if (foundUser) {
      setIsAuthenticated(true);
      setCurrentUser(foundUser);
      localStorage.setItem('rios_auth', 'true');
      localStorage.setItem('rios_current_user', JSON.stringify(foundUser));
      setAuthError('');
    } else {
      setAuthError('Usuário ou senha incorretos.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    localStorage.removeItem('rios_auth');
    localStorage.removeItem('rios_current_user');
    setUsername('');
    setPassword('');
  };

  // Derived Values
  const totals = useMemo(() => {
    const calculated = calculateEntries(entries, goals);
    const income = calculated.reduce((acc, curr) => acc + curr.totalGain, 0);
    const outgoings = expenses.reduce((acc, curr) => acc + curr.value, 0);
    const totalGoalValue = goals.reduce((acc, curr) => acc + curr.bloqueiraMeta + curr.agentMeta, 0);
    const achievement = totalGoalValue > 0 ? (income / totalGoalValue) * 100 : 0;

    return {
      income,
      expenses: outgoings,
      balance: income - outgoings,
      achievement
    };
  }, [entries, goals, expenses]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617] relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-20" 
             style={{ 
               backgroundImage: `radial-gradient(#1e293b 1px, transparent 1px)`, 
               backgroundSize: '30px 30px' 
             }}>
        </div>
        
        <div className="w-full max-w-md px-6 z-10 animate-in fade-in zoom-in duration-500">
          <div className="bg-[#0f172a]/80 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col items-center">
            
            <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center border border-slate-700 shadow-[0_0_20px_rgba(8,145,178,0.2)] mb-6">
              <RiosLogo className="w-12 h-12" />
            </div>

            <h1 className="text-2xl font-black text-white tracking-widest mb-1">RIOS SYSTEM</h1>
            <p className="text-slate-500 text-xs font-medium uppercase tracking-widest mb-8">Identifique-se para prosseguir</p>

            <form onSubmit={handleLogin} className="w-full space-y-5">
              <div>
                <label className="block text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em] mb-2">Usuário / ID</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input 
                    type="text" 
                    placeholder="Digite seu usuário..." 
                    className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder:text-slate-700"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-[10px] font-black text-purple-400 uppercase tracking-[0.2em]">Senha de Acesso</label>
                  <button type="button" className="text-[9px] text-slate-600 font-bold hover:text-slate-400 transition-colors">ESQUECEU A SENHA?</button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all placeholder:text-slate-700"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              {authError && <p className="text-rose-500 text-[10px] font-bold text-center animate-bounce">{authError}</p>}

              <button 
                type="submit" 
                className="w-full bg-gradient-to-r from-[#0891b2] to-[#8b5cf6] hover:scale-[1.02] active:scale-[0.98] text-white font-black py-4 rounded-xl text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-[0_10px_20px_rgba(8,145,178,0.3)] mt-4"
              >
                Acessar Sistema <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
          
          <p className="text-center mt-8 text-slate-600 text-[9px] font-bold tracking-[0.3em] uppercase opacity-50">
            &copy; 2025 RIOS GESTÃO E TECNOLOGIA
          </p>
        </div>
      </div>
    );
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'income', label: 'Entradas', icon: ArrowUpCircle },
    { id: 'expenses', label: 'Saídas (PIX/Cofre)', icon: ArrowDownCircle },
    { id: 'goals', label: 'Metas (TabMetas)', icon: Target },
    { id: 'reports', label: 'Relatórios', icon: FileBarChart },
    { id: 'users', label: 'Operadores', icon: Users },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#020617] text-slate-100">
      <header className="bg-[#0f172a] border-b border-slate-800 shadow-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-2 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center justify-between md:justify-start gap-4 w-full md:w-auto">
            {/* Botão de Sair Estilizado - Ajustado para mobile */}
            <button 
              onClick={handleLogout}
              className="flex items-center gap-4 px-3 py-1.5 bg-[#020617]/40 border border-slate-800/50 rounded-xl hover:bg-rose-500/5 hover:border-rose-500/30 transition-all group min-w-[90px]"
            >
              <div className="flex flex-col items-start leading-tight">
                <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest group-hover:text-rose-400/70">Ativo</span>
                <span className="text-[10px] font-black text-white uppercase tracking-wider group-hover:text-white">
                  {currentUser?.displayName || currentUser?.username || 'ADMIN'}
                </span>
              </div>
              <LogOut className="w-3.5 h-3.5 text-slate-600 group-hover:text-rose-500 transition-colors" />
            </button>

            {/* Divisor Vertical */}
            <div className="hidden md:block h-8 w-px bg-slate-800 mx-1"></div>

            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-9 md:h-9 bg-black rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.2)] border border-slate-800 shrink-0">
                <RiosLogo className="w-6 h-6 md:w-7 md:h-7" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xs md:text-sm font-bold leading-none tracking-tight text-white uppercase italic">RIOS <span className="text-[#ef4444]">SYSTEM</span></h1>
                <p className="text-[#2563eb] text-[6px] md:text-[7px] font-black tracking-widest uppercase">Gestão & Tecnologia</p>
              </div>
            </div>
          </div>
          
          {/* Navegação Mobile Amigável com labels visíveis */}
          <nav className="w-full flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as Tab)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-[10px] md:text-xs font-bold transition-all whitespace-nowrap border-b-2 shrink-0 ${
                    activeTab === item.id 
                    ? 'bg-[#0891b2]/10 text-[#22d3ee] border-[#22d3ee]' 
                    : 'text-slate-400 border-transparent hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-4">
        {activeTab === 'dashboard' && (
          <div className="space-y-4 animate-in fade-in duration-500">
            <DashboardCards 
              totalIncome={totals.income} 
              totalExpenses={totals.expenses} 
              balance={totals.balance}
              goalAchievement={totals.achievement}
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
               <div className="bg-[#0f172a] p-4 rounded-xl shadow-2xl border border-slate-800">
                  <h2 className="text-sm font-bold mb-4 text-white uppercase tracking-wider flex items-center gap-2">
                    <div className="w-1.5 h-4 bg-[#22d3ee] rounded-full"></div>
                    Desempenho Geral
                  </h2>
                  <ReportsSection entries={entries} goals={goals} expenses={expenses} compact />
               </div>
               <div className="space-y-4">
                  <div className="bg-gradient-to-br from-slate-900 to-black text-white p-4 rounded-xl shadow-2xl border border-slate-800 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:scale-110 transition-transform">
                      <RiosLogo className="w-20 h-20" />
                    </div>
                    <h3 className="text-sm font-bold mb-1 flex items-center gap-2 text-rose-500">
                      Dica de Operação
                    </h3>
                    <p className="text-slate-300 text-[11px] leading-relaxed opacity-90 relative z-10">
                      O sistema RIOS SYSTEM agora permite o cadastro de múltiplos operadores. Acesse a aba "Operadores" para gerenciar quem tem acesso ao dashboard financeiro.
                    </p>
                  </div>
                  <div className="bg-[#0f172a] p-4 rounded-xl shadow-2xl border border-slate-800">
                    <h3 className="font-bold mb-3 text-sm white uppercase tracking-wider flex items-center gap-2">
                      <div className="w-1.5 h-4 bg-[#22d3ee] rounded-full"></div>
                      Últimas Atividades
                    </h3>
                    <div className="space-y-2">
                      {entries.slice(-4).reverse().map(e => (
                        <div key={e.id} className="flex items-center gap-3 text-xs p-2 bg-slate-800/30 rounded-lg border border-slate-700/30 hover:border-[#22d3ee]/30 transition-colors">
                          <div className="w-2 h-2 rounded-full bg-[#ef4444]"></div>
                          <div>
                            <p className="font-bold text-slate-100">{e.companyName}</p>
                          </div>
                          <span className="text-slate-400 ml-auto font-mono text-[10px]">{new Date(e.date).toLocaleDateString('pt-BR')}</span>
                        </div>
                      ))}
                      {entries.length === 0 && <p className="text-slate-500 text-[10px] italic py-2">Sem registros recentes.</p>}
                    </div>
                  </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'income' && (
          <div className="animate-in slide-in-from-bottom-2 duration-500">
            <IncomeSection 
              entries={entries} 
              goals={goals}
              expenses={expenses}
              onAdd={(e) => setEntries([...entries, e])}
              onUpdate={(updated) => setEntries(entries.map(e => e.id === updated.id ? updated : e))}
              onDelete={(id) => setEntries(entries.filter(e => e.id !== id))}
            />
          </div>
        )}

        {activeTab === 'expenses' && (
          <div className="animate-in slide-in-from-bottom-2 duration-500">
            <ExpenseSection 
              expenses={expenses}
              onAdd={(e) => setExpenses([...expenses, e])}
              onUpdate={(updated) => setExpenses(expenses.map(e => e.id === updated.id ? updated : e))}
              onDelete={(id) => setExpenses(expenses.filter(id => id !== id))}
            />
          </div>
        )}

        {activeTab === 'goals' && (
          <div className="animate-in slide-in-from-bottom-2 duration-500">
            <GoalSection 
              goals={goals}
              entries={entries}
              onAdd={(g) => setGoals([...goals, g])}
              onUpdate={(updated) => setGoals(goals.map(g => g.id === updated.id ? updated : g))}
              onDelete={(id) => setGoals(goals.filter(g => g.id !== id))}
            />
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="animate-in slide-in-from-bottom-2 duration-500">
            <ReportsSection entries={entries} goals={goals} expenses={expenses} />
          </div>
        )}

        {activeTab === 'users' && (
          <div className="animate-in slide-in-from-bottom-2 duration-500">
            <UserSection 
              users={users}
              onAdd={(u) => setUsers([...users, u])}
              onUpdate={(updated) => setUsers(users.map(u => u.id === updated.id ? updated : u))}
              onDelete={(id) => setUsers(users.filter(u => u.id !== id))}
            />
          </div>
        )}
      </main>

      <footer className="bg-[#0f172a] border-t border-slate-800 py-3">
        <div className="container mx-auto px-4 text-center">
          <p className="text-slate-500 text-[10px] font-medium tracking-tight">
            &copy; 2025 RIOS <span className="text-[#ef4444]">ADMIN</span> | RIOS <span className="text-[#2563eb]">SYSTEM</span>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
