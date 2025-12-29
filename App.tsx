
import React, { useState, useEffect, useMemo } from 'react';
import { LayoutDashboard, ArrowUpCircle, ArrowDownCircle, Target, FileBarChart, Users, LogOut, ArrowRight, Loader2, RefreshCw, AlertCircle, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
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

const RiosLogo: React.FC<{ className?: string }> = ({ className = "w-8 h-8" }) => (
  <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
    <text x="35" y="75" fontFamily="serif" fontSize="70" fontWeight="bold" fill="#2563eb" style={{ fontStyle: 'italic' }}>R</text>
    <text x="15" y="70" fontFamily="serif" fontSize="75" fontWeight="bold" fill="#ef4444" style={{ fontStyle: 'italic' }}>S</text>
  </svg>
);

const App: React.FC = () => {
  // Sessão persistente: busca no localStorage para evitar login repetitivo
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('rios_auth_session') === 'active';
  });
  
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('rios_current_user');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isForgotPasswordMode, setIsForgotPasswordMode] = useState(false);
  const [recoverySent, setRecoverySent] = useState(false);
  
  const [entries, setEntries] = useState<Entry[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      loadAllData();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      // Prioriza carregar dados locais imediatamente para uma UI instantânea
      const [entriesData, expensesData, goalsData, usersData] = await Promise.all([
        api.getEntries(),
        api.getExpenses(),
        api.getGoals(),
        api.getUsers()
      ]);

      setEntries(entriesData);
      setExpenses(expensesData);
      setGoals(goalsData);
      setUsers(usersData);
    } catch (error) {
      console.error("Erro na carga de dados:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsLoading(true);
    try {
      try {
        const response = await api.authenticate({ username, password });
        if (response.user) {
          loginSuccess(response.user);
          return;
        }
      } catch (apiErr: any) {
        // Fallback para admin offline se o servidor falhar
        if (username.toLowerCase() === 'admin' && password === 'admin') {
          loginSuccess({ 
            id: 'admin', 
            username: 'admin', 
            password: '---', 
            displayName: 'Administrador (Offline)',
            email: 'admin@riossistem.com.br' 
          });
          return;
        }
        setAuthError('Credenciais inválidas ou erro de conexão.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loginSuccess = (user: UserProfile) => {
    setIsAuthenticated(true);
    setCurrentUser(user);
    localStorage.setItem('rios_auth_session', 'active');
    localStorage.setItem('rios_current_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    localStorage.removeItem('rios_auth_session');
    localStorage.removeItem('rios_current_user');
    setIsAuthenticated(false);
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  // CRUD Handlers
  const onAddEntry = async (entry: Entry) => {
    setEntries(prev => [...prev, entry]);
    try { await api.saveEntry(entry); } catch(e) { console.warn("Salvo localmente"); }
  };
  const onUpdateEntry = async (entry: Entry) => {
    setEntries(prev => prev.map(e => e.id === entry.id ? entry : e));
    try { await api.saveEntry(entry); } catch(e) { console.warn("Atualizado localmente"); }
  };
  const onDeleteEntry = async (id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
    try { await api.deleteEntry(id); } catch(e) { console.warn("Removido localmente"); }
  };

  const onAddExpense = async (expense: Expense) => {
    setExpenses(prev => [...prev, expense]);
    try { await api.saveExpense(expense); } catch(e) { console.warn("Gasto salvo localmente"); }
  };
  const onUpdateExpense = async (expense: Expense) => {
    setExpenses(prev => prev.map(e => e.id === expense.id ? expense : e));
    try { await api.saveExpense(expense); } catch(e) { console.warn("Gasto atualizado localmente"); }
  };
  const onDeleteExpense = async (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    try { await api.deleteExpense(id); } catch(e) { console.warn("Gasto removido localmente"); }
  };

  const onAddGoal = async (goal: Goal) => {
    setGoals(prev => [...prev, goal]);
    try { await api.saveGoal(goal); } catch(e) { console.warn("Meta salva localmente"); }
  };
  const onUpdateGoal = async (goal: Goal) => {
    setGoals(prev => prev.map(g => g.id === goal.id ? goal : g));
    try { await api.saveGoal(goal); } catch(e) { console.warn("Meta atualizada localmente"); }
  };
  const onDeleteGoal = async (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
    try { await api.deleteGoal(id); } catch(e) { console.warn("Meta removida localmente"); }
  };

  const onAddUser = async (user: UserProfile) => {
    setUsers(prev => [...prev, user]);
    try { await api.saveUser(user); } catch(e) { console.warn("Usuário salvo localmente"); }
  };
  const onUpdateUser = async (user: UserProfile) => {
    setUsers(prev => prev.map(u => u.id === user.id ? user : u));
    try { await api.saveUser(user); } catch(e) { console.warn("Usuário atualizado localmente"); }
  };
  const onDeleteUser = async (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    try { await api.deleteUser(id); } catch(e) { console.warn("Usuário removido localmente"); }
  };

  const totals = useMemo(() => {
    const calculated = calculateEntries(entries, goals);
    const income = calculated.reduce((acc, curr) => acc + curr.totalGain, 0);
    const outgoings = expenses.reduce((acc, curr) => acc + (curr.valor || 0), 0);
    const totalGoalValue = goals.reduce((acc, curr) => acc + (curr.bloqueiraMeta || 0) + (curr.agentMeta || 0), 0);
    const achievement = totalGoalValue > 0 ? (income / (totalGoalValue * 4)) * 100 : 0;
    return { income, expenses: outgoings, balance: income - outgoings, achievement };
  }, [entries, goals, expenses]);

  if (isLoading && isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
             <RiosLogo className="w-6 h-6 opacity-50" />
          </div>
        </div>
        <p className="text-slate-500 font-black uppercase text-[10px] tracking-[0.4em] animate-pulse">Sincronizando Dados...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617] relative p-6">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `radial-gradient(#1e293b 1px, transparent 1px)`, backgroundSize: '30px 30px' }}></div>
        <div className="w-full max-w-md z-10 animate-in fade-in zoom-in duration-700">
          <div className="bg-[#0f172a]/80 backdrop-blur-xl border border-slate-800 p-10 rounded-[3rem] shadow-[0_30px_60px_rgba(0,0,0,0.5)] text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-rose-600"></div>
            <RiosLogo className="w-20 h-20 mx-auto mb-6 drop-shadow-[0_0_15px_rgba(37,99,235,0.4)]" />
            <h1 className="text-2xl font-black text-white mb-2 uppercase tracking-[0.2em] text-center">RIOS SYSTEM</h1>
            <p className="text-[10px] text-slate-500 font-bold mb-8 tracking-[0.3em] uppercase opacity-70">Controle de Fluxo Cloud</p>
            
            <form onSubmit={handleLogin} className="space-y-5 text-left">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">ID Usuário</label>
                <input type="text" placeholder="usuário.rios" className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl py-4 px-5 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all" value={username} onChange={e => setUsername(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Senha de Acesso</label>
                <input type="password" placeholder="••••••••" className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl py-4 px-5 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              {authError && <div className="text-rose-500 text-[10px] font-black text-center p-3 bg-rose-500/10 rounded-xl border border-rose-500/20">{authError}</div>}
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl transition-all uppercase text-xs tracking-[0.3em] flex items-center justify-center gap-3 shadow-[0_20px_40px_rgba(37,99,235,0.25)] active:scale-95 mt-4">
                Entrar no Sistema <ArrowRight className="w-5 h-5" />
              </button>
            </form>
            <div className="mt-8">
               <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">&copy; 2025 Rios System Intelligence</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#020617] text-slate-100">
      <header className="bg-[#0f172a]/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50 px-4 py-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <RiosLogo className="w-10 h-10" />
            <div>
              <h1 className="text-base font-black text-white italic uppercase leading-none tracking-wider">RIOS SYSTEM</h1>
              <p className="text-[9px] text-blue-500 font-black uppercase tracking-[0.3em] mt-1">Dashboard Administrativo</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Sessão Ativa</span>
              <span className="text-xs font-black text-slate-200 uppercase">{currentUser?.displayName}</span>
            </div>
            <button 
              onClick={handleLogout} 
              className="flex items-center gap-2 px-5 py-2.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-500 hover:bg-rose-500 hover:text-white transition-all active:scale-90 shadow-xl group"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] hidden sm:inline">Desconectar</span>
            </button>
          </div>
        </div>
        <nav className="container mx-auto mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {navItems.map((item) => (
            <button 
              key={item.id} 
              onClick={() => setActiveTab(item.id as Tab)} 
              className={`flex items-center gap-3 px-5 py-3 rounded-2xl text-[10px] font-black transition-all whitespace-nowrap uppercase tracking-widest ${activeTab === item.id ? 'bg-blue-600 text-white shadow-[0_10px_20px_rgba(37,99,235,0.3)]' : 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-300'}`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        {activeTab === 'dashboard' && (
          <DashboardCards 
            totalIncome={totals.income} 
            totalExpenses={totals.expenses} 
            balance={totals.balance} 
            goalAchievement={totals.achievement} 
            entries={entries}
            goals={goals}
            expenses={expenses}
          />
        )}
        {activeTab === 'income' && <IncomeSection entries={entries} goals={goals} expenses={expenses} onAdd={onAddEntry} onUpdate={onUpdateEntry} onDelete={onDeleteEntry} />}
        {activeTab === 'expenses' && <ExpenseSection expenses={expenses} onAdd={onAddExpense} onUpdate={onUpdateExpense} onDelete={onDeleteExpense} />}
        {activeTab === 'goals' && <GoalSection goals={goals} entries={entries} onAdd={onAddGoal} onUpdate={onUpdateGoal} onDelete={onDeleteGoal} />}
        {activeTab === 'reports' && <ReportsSection entries={entries} goals={goals} expenses={expenses} />}
        {activeTab === 'users' && <UserSection users={users} isSyncing={isSyncing} onAdd={onAddUser} onUpdate={onUpdateUser} onDelete={onDeleteUser} />}
      </main>

      <footer className="bg-[#0f172a] border-t border-slate-800 py-6 text-center">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-600 text-[9px] font-black tracking-[0.4em] uppercase">
            Rios System Intelligence &copy; 2025
          </p>
          <div className="flex items-center gap-4 text-slate-500 text-[8px] font-black uppercase tracking-widest">
            <span>Server: API.RIOSSISTEM.COM.BR</span>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span>Status: Online</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'income', label: 'Entradas', icon: ArrowUpCircle },
  { id: 'expenses', label: 'Saídas', icon: ArrowDownCircle },
  { id: 'goals', label: 'Metas', icon: Target },
  { id: 'reports', label: 'Relatórios', icon: FileBarChart },
  { id: 'users', label: 'Equipe', icon: Users },
];

export default App;
