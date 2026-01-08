
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { LayoutDashboard, ArrowUpCircle, ArrowDownCircle, Target, FileBarChart, Users, LogOut, Loader2, RefreshCw, WifiOff, Cloud, Server, Database, Crown, CheckCircle2 } from 'lucide-react';
import { Entry, Goal, Expense, UserProfile } from './types';
import { calculateEntries } from './utils/calculations';
import { DashboardCards } from './components/DashboardCards';
import { IncomeSection } from './components/IncomeSection';
import { ExpenseSection } from './components/ExpenseSection';
import { GoalSection } from './components/GoalSection';
import { ReportsSection } from './components/ReportsSection';
import { UserSection } from './components/UserSection';
import { api } from './utils/api';

type Tab = 'dashboard' | 'income' | 'expenses' | 'goals' | 'reports' | 'users';
type ApiStatus = 'online' | 'offline' | 'checking';

const RiosLogo: React.FC<{ className?: string }> = ({ className = "w-8 h-8" }) => (
  <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
    <text x="35" y="75" fontFamily="serif" fontSize="70" fontWeight="bold" fill="#2563eb" style={{ fontStyle: 'italic' }}>R</text>
    <text x="15" y="70" fontFamily="serif" fontSize="75" fontWeight="bold" fill="#ef4444" style={{ fontStyle: 'italic' }}>S</text>
  </svg>
);

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('rios_auth_session') === 'active';
  });
  
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('rios_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) { return null; }
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [apiStatus, setApiStatus] = useState<ApiStatus>('checking');
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  
  const [entries, setEntries] = useState<Entry[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const isMaster = currentUser?.username.toLowerCase() === 'admin';

  const loadAllData = useCallback(async (showLoader = true) => {
    if (showLoader) setIsLoading(true);
    try {
      const [entriesData, expensesData, goalsData, usersData] = await Promise.all([
        api.getEntries(),
        api.getExpenses(),
        api.getGoals(),
        api.getUsers()
      ]);

      setEntries(Array.isArray(entriesData) ? entriesData : []);
      setExpenses(Array.isArray(expensesData) ? expensesData : []);
      setGoals(Array.isArray(goalsData) ? goalsData : []);
      setUsers(Array.isArray(usersData) ? usersData : []);
      
      const isOnline = await api.checkStatus();
      setApiStatus(isOnline ? 'online' : 'offline');
    } catch (error) {
      setApiStatus('offline');
    } finally {
      if (showLoader) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) loadAllData();
  }, [isAuthenticated, loadAllData]);

  const handleManualSync = async () => {
    setIsSyncing(true);
    await loadAllData(false);
    setIsSyncing(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsSyncing(true);
    try {
      const response = await api.authenticate({ username, password });
      if (response && response.user) {
        setIsAuthenticated(true);
        setCurrentUser(response.user);
        localStorage.setItem('rios_auth_session', 'active');
        localStorage.setItem('rios_current_user', JSON.stringify(response.user));
      }
    } catch (err: any) {
      setAuthError(err.message || 'Credenciais inválidas.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('rios_auth_session');
    localStorage.removeItem('rios_current_user');
    setIsAuthenticated(false);
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  const handleAction = async (type: 'entry' | 'expense' | 'goal' | 'user', action: 'save' | 'delete', data: any) => {
    // 1. Otimismo na UI: Atualiza a tela imediatamente com lógica de 'Upsert'
    if (action === 'save') {
      if (type === 'entry') {
        setEntries(prev => {
          const exists = prev.some(x => x.id === data.id);
          return exists ? prev.map(x => x.id === data.id ? data : x) : [...prev, data];
        });
        await api.saveEntry(data);
      } else if (type === 'expense') {
        setExpenses(prev => {
          const exists = prev.some(x => x.id === data.id);
          return exists ? prev.map(x => x.id === data.id ? data : x) : [...prev, data];
        });
        await api.saveExpense(data);
      } else if (type === 'goal') {
        setGoals(prev => {
          const exists = prev.some(x => x.id === data.id);
          return exists ? prev.map(x => x.id === data.id ? data : x) : [...prev, data];
        });
        await api.saveGoal(data);
      } else if (type === 'user') {
        setUsers(prev => {
          const exists = prev.some(x => x.id === data.id);
          return exists ? prev.map(x => x.id === data.id ? data : x) : [...prev, data];
        });
        await api.saveUser(data);
      }
    } else if (action === 'delete') {
      if (type === 'entry') {
        setEntries(prev => prev.filter(x => x.id !== data));
        await api.deleteEntry(data);
      } else if (type === 'expense') {
        setExpenses(prev => prev.filter(x => x.id !== data));
        await api.deleteExpense(data);
      } else if (type === 'goal') {
        setGoals(prev => prev.filter(x => x.id !== data));
        await api.deleteGoal(data);
      } else if (type === 'user') {
        setUsers(prev => prev.filter(x => x.id !== data));
        await api.deleteUser(data);
      }
    }
    
    // 2. Sincronização em background para garantir integridade com o servidor
    loadAllData(false);
  };

  const totals = useMemo(() => {
    const calculated = calculateEntries(entries, goals);
    const income = calculated.reduce((acc, curr) => acc + curr.totalGain, 0);
    const outgoings = expenses.reduce((acc, curr) => acc + (curr.valor || 0), 0);
    const totalGoalValue = goals.reduce((acc, curr) => acc + (curr.bloqueiraMeta || 0) + (curr.agentMeta || 0), 0);
    const achievement = totalGoalValue > 0 ? (income / (totalGoalValue * 4)) * 100 : 0;
    return { income, expenses: outgoings, balance: income - outgoings, achievement };
  }, [entries, goals, expenses]);

  const navItems = useMemo(() => {
    const base = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'income', label: 'Faturamento', icon: ArrowUpCircle },
      { id: 'expenses', label: 'Saídas', icon: ArrowDownCircle },
      { id: 'goals', label: 'Metas', icon: Target },
      { id: 'reports', label: 'Relatórios', icon: FileBarChart },
    ];
    if (isMaster) base.push({ id: 'users', label: 'Equipe', icon: Users });
    return base;
  }, [isMaster]);

  if (isLoading && isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
        <p className="text-slate-500 font-black uppercase text-[10px] tracking-[0.4em]">Protegendo sua Conexão...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617] p-6">
        <div className="w-full max-w-md bg-[#0f172a] border border-slate-800 p-10 rounded-[3rem] shadow-2xl text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-rose-500 to-blue-600"></div>
          <RiosLogo className="w-16 h-16 mx-auto mb-6" />
          <h1 className="text-xl font-black text-white mb-2 tracking-[0.2em] uppercase">RIOS SYSTEM</h1>
          <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-8 italic">Gestão e Tecnologia Financeira</p>
          
          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
              <label className="text-[9px] font-black text-slate-500 uppercase ml-4 mb-1 block">Login Operador</label>
              <input type="text" placeholder="Acesso" className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 px-5 text-white outline-none focus:ring-2 focus:ring-blue-500" value={username} onChange={e => setUsername(e.target.value)} required />
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-500 uppercase ml-4 mb-1 block">Senha Segura</label>
              <input type="password" placeholder="••••••••" className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-4 px-5 text-white outline-none focus:ring-2 focus:ring-blue-500" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            {authError && <p className="text-rose-500 text-[10px] font-bold text-center bg-rose-500/10 py-3 rounded-xl border border-rose-500/20">{authError}</p>}
            <button type="submit" disabled={isSyncing} className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl uppercase text-xs tracking-widest mt-4 shadow-xl hover:bg-blue-500 transition-all active:scale-95 disabled:opacity-50">
              {isSyncing ? 'Autenticando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#020617] text-slate-100">
      <header className="bg-[#0f172a]/95 backdrop-blur-xl border-b border-slate-800 sticky top-0 z-50 px-4 py-4 shadow-2xl">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <RiosLogo className="w-10 h-10" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black text-white italic uppercase tracking-wider leading-none">RIOS SYSTEM</h1>
                {isMaster && <Crown className="w-3.5 h-3.5 text-amber-500" />}
              </div>
              <p className="text-[8px] text-blue-500 font-black uppercase tracking-[0.2em] mt-1">{currentUser?.displayName}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-500 hover:bg-rose-500 hover:text-white transition-all">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
        <nav className="container mx-auto mt-6 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {navItems.map((item) => (
            <button 
              key={item.id} 
              onClick={() => setActiveTab(item.id as Tab)} 
              className={`flex items-center gap-3 px-6 py-4 rounded-3xl text-[10px] font-black transition-all uppercase tracking-widest whitespace-nowrap active:scale-95 ${activeTab === item.id ? 'bg-blue-600 text-white shadow-xl border border-blue-400/20' : 'text-slate-500 bg-slate-900/40 hover:bg-slate-800 border border-transparent'}`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        {activeTab === 'dashboard' && <DashboardCards totalIncome={totals.income} totalExpenses={totals.expenses} balance={totals.balance} goalAchievement={totals.achievement} entries={entries} goals={goals} expenses={expenses} />}
        {activeTab === 'income' && <IncomeSection entries={entries} goals={goals} expenses={expenses} onAdd={(e) => handleAction('entry', 'save', e)} onUpdate={(e) => handleAction('entry', 'save', e)} onDelete={(id) => handleAction('entry', 'delete', id)} />}
        {activeTab === 'expenses' && <ExpenseSection expenses={expenses} onAdd={(e) => handleAction('expense', 'save', e)} onUpdate={(e) => handleAction('expense', 'save', e)} onDelete={(id) => handleAction('expense', 'delete', id)} />}
        {activeTab === 'goals' && <GoalSection goals={goals} entries={entries} onAdd={(e) => handleAction('goal', 'save', e)} onUpdate={(e) => handleAction('goal', 'save', e)} onDelete={(id) => handleAction('goal', 'delete', id)} />}
        {activeTab === 'reports' && <ReportsSection entries={entries} goals={goals} expenses={expenses} />}
        {activeTab === 'users' && isMaster && <UserSection users={users} onAdd={(u) => handleAction('user', 'save', u)} onUpdate={(u) => handleAction('user', 'save', u)} onDelete={(id) => handleAction('user', 'delete', id)} />}
      </main>

      <footer className="bg-[#0f172a] border-t border-slate-800 py-6 px-4">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-600 text-[9px] font-black tracking-widest uppercase italic">Tecnologia Rios &copy; 2025</p>
          <div className="flex items-center gap-4 bg-slate-900/80 px-5 py-3 rounded-2xl border border-slate-800/50">
             <div className="flex items-center gap-4">
                <div className="flex flex-col">
                  <span className="text-slate-500 text-[8px] font-black uppercase flex items-center gap-1.5"><Database className="w-3 h-3" /> REGISTROS:</span>
                  <span className="text-[10px] font-black text-white uppercase tracking-tighter">{(entries.length + expenses.length + goals.length)} lançamentos salvos</span>
                </div>
                <div className="w-[1px] h-6 bg-slate-800"></div>
                <div className="flex flex-col">
                  <span className="text-slate-500 text-[8px] font-black uppercase flex items-center gap-1.5"><Cloud className="w-3 h-3" /> STATUS:</span>
                  <span className={`text-[10px] font-mono font-bold ${apiStatus === 'online' ? 'text-emerald-400' : 'text-amber-500'}`}>{apiStatus === 'online' ? 'SINCRONIZADO' : 'LOCAL-FIRST'}</span>
                </div>
             </div>
             <button onClick={handleManualSync} disabled={isSyncing} className={`p-2 bg-slate-800 hover:bg-blue-600 text-slate-400 hover:text-white rounded-lg transition-all ${isSyncing ? 'opacity-50' : ''}`}>
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
             </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
