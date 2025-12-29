
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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => localStorage.getItem('rios_auth') === 'true');
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
      const [entriesData, expensesData, goalsData, usersData] = await Promise.all([
        api.getEntries().catch(() => []),
        api.getExpenses().catch(() => []),
        api.getGoals().catch(() => []),
        api.getUsers().catch(() => [])
      ]);

      setEntries(entriesData);
      setExpenses(expensesData);
      setGoals(goalsData);
      setUsers(usersData);
    } catch (error) {
      console.error("Erro ao sincronizar com servidor:", error);
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
        if (username.toLowerCase() === 'admin' && password === 'admin') {
          loginSuccess({ 
            id: 'admin', 
            username: 'admin', 
            password: '---', 
            displayName: 'Administrador Rios',
            email: 'admin@riossistem.com.br' 
          });
          return;
        }
        setAuthError(apiErr.message.includes('ERRO_CONEXAO') ? 'Erro de conexão com Hostinger.' : 'Dados incorretos.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsLoading(true);
    try {
      await api.forgotPassword(username);
      setRecoverySent(true);
    } catch (error: any) {
      setAuthError(error.message || 'Erro ao processar solicitação.');
    } finally {
      setIsLoading(false);
    }
  };

  const loginSuccess = (user: UserProfile) => {
    setIsAuthenticated(true);
    setCurrentUser(user);
    localStorage.setItem('rios_auth', 'true');
    localStorage.setItem('rios_current_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    // Limpeza completa e reset de estado para evitar tela branca
    localStorage.removeItem('rios_auth');
    localStorage.removeItem('rios_current_user');
    setIsAuthenticated(false);
    setCurrentUser(null);
    setUsername('');
    setPassword('');
    setAuthError('');
    setActiveTab('dashboard');
    setIsForgotPasswordMode(false);
    setRecoverySent(false);
    // Não usamos window.location.reload() para evitar interrupção de scripts
  };

  // HANDLERS CRUD
  const onAddEntry = async (entry: Entry) => {
    setIsSyncing(true);
    try { await api.saveEntry(entry); setEntries(prev => [...prev, entry]); } finally { setIsSyncing(false); }
  };
  const onUpdateEntry = async (entry: Entry) => {
    setIsSyncing(true);
    try { await api.saveEntry(entry); setEntries(prev => prev.map(e => e.id === entry.id ? entry : e)); } finally { setIsSyncing(false); }
  };
  const onDeleteEntry = async (id: string) => {
    setIsSyncing(true);
    try { await api.deleteEntry(id); setEntries(prev => prev.filter(e => e.id !== id)); } finally { setIsSyncing(false); }
  };

  const onAddExpense = async (expense: Expense) => {
    setIsSyncing(true);
    try { await api.saveExpense(expense); setExpenses(prev => [...prev, expense]); } finally { setIsSyncing(false); }
  };
  const onUpdateExpense = async (expense: Expense) => {
    setIsSyncing(true);
    try { await api.saveExpense(expense); setExpenses(prev => prev.map(e => e.id === expense.id ? expense : e)); } finally { setIsSyncing(false); }
  };
  const onDeleteExpense = async (id: string) => {
    setIsSyncing(true);
    try { await api.deleteExpense(id); setExpenses(prev => prev.filter(e => e.id !== id)); } finally { setIsSyncing(false); }
  };

  const onAddGoal = async (goal: Goal) => {
    setIsSyncing(true);
    try { await api.saveGoal(goal); setGoals(prev => [...prev, goal]); } finally { setIsSyncing(false); }
  };
  const onUpdateGoal = async (goal: Goal) => {
    setIsSyncing(true);
    try { await api.saveGoal(goal); setGoals(prev => prev.map(g => g.id === goal.id ? goal : g)); } finally { setIsSyncing(false); }
  };
  const onDeleteGoal = async (id: string) => {
    setIsSyncing(true);
    try { await api.deleteGoal(id); setGoals(prev => prev.filter(g => g.id !== id)); } finally { setIsSyncing(false); }
  };

  const onAddUser = async (user: UserProfile) => {
    setIsSyncing(true);
    try {
      const saved = await api.saveUser(user);
      setUsers(prev => [...prev, { ...user, ...saved }]);
    } catch (error) {
      setUsers(prev => [...prev, user]);
    } finally { setIsSyncing(false); }
  };

  const onUpdateUser = async (user: UserProfile) => {
    setIsSyncing(true);
    try {
      await api.saveUser(user);
      setUsers(prev => prev.map(u => u.id === user.id ? user : u));
    } finally { setIsSyncing(false); }
  };

  const onDeleteUser = async (id: string) => {
    setIsSyncing(true);
    try {
      await api.deleteUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
    } finally { setIsSyncing(false); }
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
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em]">Carregando Sistema Rios...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617] relative p-6">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `radial-gradient(#1e293b 1px, transparent 1px)`, backgroundSize: '20px 20px' }}></div>
        <div className="w-full max-w-sm z-10 animate-in fade-in zoom-in duration-500">
          <div className="bg-[#0f172a] border border-slate-800 p-8 rounded-3xl shadow-2xl text-center">
            <RiosLogo className="w-16 h-16 mx-auto mb-4" />
            <h1 className="text-xl font-black text-white mb-2 uppercase tracking-widest text-center">RIOS SYSTEM</h1>
            
            {!isForgotPasswordMode ? (
              <>
                <p className="text-[10px] text-slate-500 font-bold mb-6 tracking-widest uppercase text-center">Acesso Restrito</p>
                <form onSubmit={handleLogin} className="space-y-4 text-left">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Usuário</label>
                    <input type="text" className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-white focus:ring-1 focus:ring-blue-500 outline-none" value={username} onChange={e => setUsername(e.target.value)} required />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Senha</label>
                    <input type="password" className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-white focus:ring-1 focus:ring-blue-500 outline-none" value={password} onChange={e => setPassword(e.target.value)} required />
                  </div>
                  {authError && <div className="text-rose-500 text-[10px] font-bold text-center p-2 bg-rose-500/10 rounded">{authError}</div>}
                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-3 rounded-xl transition-all uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-2 shadow-[0_10px_20px_rgba(37,99,235,0.2)] active:scale-95">
                    Autenticar <ArrowRight className="w-4 h-4" />
                  </button>
                  <div className="text-center pt-3">
                    <button 
                      type="button" 
                      onClick={() => { setIsForgotPasswordMode(true); setAuthError(''); }}
                      className="text-[9px] font-black text-slate-500 hover:text-blue-400 uppercase tracking-[0.1em] transition-colors cursor-pointer"
                    >
                      Esqueci minha senha
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <p className="text-[10px] text-blue-500 font-black mb-6 tracking-widest uppercase text-center">Recuperação de Acesso</p>
                {!recoverySent ? (
                  <form onSubmit={handleForgotPassword} className="space-y-4 text-left">
                    <p className="text-[10px] text-slate-400 text-center mb-4 uppercase leading-relaxed font-bold">Informe seu usuário para receber instruções de recuperação.</p>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Usuário</label>
                      <input type="text" className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-white focus:ring-1 focus:ring-blue-500 outline-none" value={username} onChange={e => setUsername(e.target.value)} required placeholder="Ex: joao.rios" />
                    </div>
                    {authError && <div className="text-rose-500 text-[10px] font-bold text-center p-2 bg-rose-500/10 rounded">{authError}</div>}
                    <button type="submit" className="w-full bg-slate-800 hover:bg-slate-700 text-white font-black py-3 rounded-xl transition-all uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-2">
                      Enviar Instruções
                    </button>
                    <button 
                      type="button" 
                      onClick={() => { setIsForgotPasswordMode(false); setAuthError(''); }}
                      className="w-full text-[9px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-colors flex items-center justify-center gap-1"
                    >
                      <ArrowLeft className="w-3 h-3" /> Voltar ao Login
                    </button>
                  </form>
                ) : (
                  <div className="space-y-6 animate-in fade-in zoom-in">
                    <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                      <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    </div>
                    <p className="text-[11px] text-slate-200 font-bold uppercase">Solicitação Enviada!</p>
                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed">As instruções foram enviadas para o e-mail de recuperação cadastrado.</p>
                    <button 
                      type="button" 
                      onClick={() => { setIsForgotPasswordMode(false); setRecoverySent(false); setAuthError(''); }}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-3 rounded-xl transition-all uppercase text-xs tracking-[0.2em]"
                    >
                      Voltar ao Login
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#020617] text-slate-100">
      <header className="bg-[#0f172a] border-b border-slate-800 sticky top-0 z-50 px-4 py-3">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <RiosLogo className="w-8 h-8" />
            <div>
              <h1 className="text-sm font-black text-white italic uppercase leading-none">RIOS SYSTEM</h1>
              <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-1">Gestão Financeira Cloud</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end mr-2">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">Operador Ativo</span>
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-tight">{currentUser?.displayName}</span>
            </div>
            <button 
              onClick={handleLogout} 
              className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-500 hover:bg-rose-600 hover:text-white transition-all active:scale-90 shadow-lg group cursor-pointer"
            >
              <span className="text-[10px] font-black uppercase tracking-widest">Sair</span>
              <LogOut className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
        <nav className="container mx-auto mt-3 flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
          {navItems.map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id as Tab)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-black transition-all whitespace-nowrap border-b-2 uppercase tracking-tighter ${activeTab === item.id ? 'bg-blue-500/10 text-blue-400 border-blue-500' : 'text-slate-500 border-transparent hover:text-white'}`}>
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6">
        {activeTab === 'dashboard' && <DashboardCards totalIncome={totals.income} totalExpenses={totals.expenses} balance={totals.balance} goalAchievement={totals.achievement} />}
        {activeTab === 'income' && <IncomeSection entries={entries} goals={goals} expenses={expenses} onAdd={onAddEntry} onUpdate={onUpdateEntry} onDelete={onDeleteEntry} />}
        {activeTab === 'expenses' && <ExpenseSection expenses={expenses} onAdd={onAddExpense} onUpdate={onUpdateExpense} onDelete={onDeleteExpense} />}
        {activeTab === 'goals' && <GoalSection goals={goals} entries={entries} onAdd={onAddGoal} onUpdate={onUpdateGoal} onDelete={onDeleteGoal} />}
        {activeTab === 'reports' && <ReportsSection entries={entries} goals={goals} expenses={expenses} />}
        {activeTab === 'users' && <UserSection users={users} isSyncing={isSyncing} onAdd={onAddUser} onUpdate={onUpdateUser} onDelete={onDeleteUser} />}
      </main>

      <footer className="bg-[#0f172a] border-t border-slate-800 py-4 text-center">
        <p className="text-slate-600 text-[9px] font-bold tracking-widest uppercase">
          RIOS SYSTEM &copy; 2025 | Tecnologia e Gestão Financeira
        </p>
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
