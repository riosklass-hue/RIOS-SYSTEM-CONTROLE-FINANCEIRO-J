
/**
 * Configuração da API Rios System para Hostinger
 * Endpoint centralizado no banco MySQL
 */
const BASE_URL = 'https://fi.riossistem.com.br/api';

const STORAGE_KEYS = {
  ENTRIES: 'rios_cache_entries',
  EXPENSES: 'rios_cache_expenses',
  GOALS: 'rios_cache_goals',
  USERS: 'rios_cache_users'
};

async function request(endpoint: string, options: RequestInit = {}, storageKey?: string) {
  const url = `${BASE_URL}/${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (storageKey && Array.isArray(data)) {
        localStorage.setItem(storageKey, JSON.stringify(data));
      }
      return data;
    }
    throw new Error(`Erro API: ${response.statusText}`);
  } catch (error) {
    console.warn(`Operando em modo offline para ${endpoint}`);
    return storageKey ? JSON.parse(localStorage.getItem(storageKey) || '[]') : null;
  }
}

export const api = {
  checkStatus: async () => {
    try {
      const res = await fetch(`${BASE_URL}/health`);
      return res.ok;
    } catch (e) { return false; }
  },
  
  // Faturamento
  getEntries: () => request('faturamento/listar', {}, STORAGE_KEYS.ENTRIES),
  saveEntry: (e: any) => request('faturamento/salvar', { 
    method: 'POST', 
    body: JSON.stringify(e) 
  }, STORAGE_KEYS.ENTRIES),
  deleteEntry: (id: string) => request(`faturamento/excluir/${id}`, { method: 'DELETE' }, STORAGE_KEYS.ENTRIES),
  
  // Saídas
  getExpenses: () => request('saidas/listar', {}, STORAGE_KEYS.EXPENSES),
  saveExpense: (e: any) => request('saidas/salvar', { 
    method: 'POST', 
    body: JSON.stringify(e) 
  }, STORAGE_KEYS.EXPENSES),
  deleteExpense: (id: string) => request(`saidas/excluir/${id}`, { method: 'DELETE' }, STORAGE_KEYS.EXPENSES),
  
  // Metas
  getGoals: () => request('goals/listar', {}, STORAGE_KEYS.GOALS),
  saveGoal: (e: any) => request('goals/salvar', { 
    method: 'POST', 
    body: JSON.stringify(e) 
  }, STORAGE_KEYS.GOALS),
  deleteGoal: (id: string) => request(`goals/excluir/${id}`, { method: 'DELETE' }, STORAGE_KEYS.GOALS),

  // Autenticação Real
  authenticate: async (credentials: any) => {
    return request('auth/login', { 
      method: 'POST', 
      body: JSON.stringify(credentials) 
    });
  },

  getUsers: () => request('users/listar', {}, STORAGE_KEYS.USERS),
  saveUser: (u: any) => request('users/salvar', { method: 'POST', body: JSON.stringify(u) }, STORAGE_KEYS.USERS),
  deleteUser: (id: string) => request(`users/excluir/${id}`, { method: 'DELETE' }, STORAGE_KEYS.USERS)
};
