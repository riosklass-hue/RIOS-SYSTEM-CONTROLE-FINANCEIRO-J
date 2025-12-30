
/**
 * Configuração da API Rios System
 * Prioriza o arquivo .env.production
 */
const BASE_URL = (import.meta as any).env?.VITE_API_URL || 'https://api.riossistem.com.br';

const STORAGE_KEYS = {
  ENTRIES: 'rios_data_entries',
  EXPENSES: 'rios_data_expenses',
  GOALS: 'rios_data_goals',
  USERS: 'rios_data_users',
  LAST_SYNC: 'rios_last_sync_timestamp'
};

const getLocal = (key: string) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

const saveLocal = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify(data));
  localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
};

async function request(endpoint: string, options: RequestInit = {}, storageKey?: string) {
  const cleanBase = BASE_URL.replace(/\/$/, '');
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${cleanBase}${cleanEndpoint}`;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); 

    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (storageKey && (!options.method || options.method === 'GET')) {
        saveLocal(storageKey, data);
      }
      return data;
    }
    
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Erro (${response.status})`);

  } catch (error: any) {
    const isNetworkError = error.name === 'AbortError' || 
                           error.message.includes('Failed to fetch') || 
                           error.message.includes('NetworkError');

    if (isNetworkError && storageKey) {
      const localData = getLocal(storageKey);
      
      if (options.method === 'POST') {
        const newItem = JSON.parse(options.body as string);
        if (!newItem.id) newItem.id = `temp-${Date.now()}`;
        saveLocal(storageKey, [...localData, newItem]);
        return newItem;
      }
      if (options.method === 'PUT') {
        const updatedItem = JSON.parse(options.body as string);
        const updated = localData.map((item: any) => item.id === updatedItem.id ? updatedItem : item);
        saveLocal(storageKey, updated);
        return updatedItem;
      }
      if (options.method === 'DELETE') {
        const id = endpoint.split('/').pop();
        const updated = localData.filter((item: any) => item.id !== id);
        saveLocal(storageKey, updated);
        return { success: true, offline: true };
      }
      return localData;
    }
    throw error;
  }
}

const getMethod = (item: any) => {
  if (!item.id || String(item.id).startsWith('temp-') || String(item.id).length > 30) return 'POST';
  return 'PUT';
};

export const api = {
  checkStatus: () => request('health'),
  
  getEntries: () => request('entries', {}, STORAGE_KEYS.ENTRIES),
  saveEntry: (entry: any) => request('entries', { 
    method: getMethod(entry), 
    body: JSON.stringify(entry) 
  }, STORAGE_KEYS.ENTRIES),
  deleteEntry: (id: string) => request(`entries/${id}`, { method: 'DELETE' }, STORAGE_KEYS.ENTRIES),

  getExpenses: () => request('expenses', {}, STORAGE_KEYS.EXPENSES),
  saveExpense: (expense: any) => request('expenses', { 
    method: getMethod(expense), 
    body: JSON.stringify(expense) 
  }, STORAGE_KEYS.EXPENSES),
  deleteExpense: (id: string) => request(`expenses/${id}`, { method: 'DELETE' }, STORAGE_KEYS.EXPENSES),

  getGoals: () => request('goals', {}, STORAGE_KEYS.GOALS),
  saveGoal: (goal: any) => request('goals', { 
    method: getMethod(goal), 
    body: JSON.stringify(goal) 
  }, STORAGE_KEYS.GOALS),
  deleteGoal: (id: string) => request(`goals/${id}`, { method: 'DELETE' }, STORAGE_KEYS.GOALS),

  getUsers: () => request('users', {}, STORAGE_KEYS.USERS),
  saveUser: (user: any) => request('users', { 
    method: getMethod(user), 
    body: JSON.stringify(user) 
  }, STORAGE_KEYS.USERS),
  deleteUser: (id: string) => request(`users/${id}`, { method: 'DELETE' }, STORAGE_KEYS.USERS),

  // Autenticação inteligente com suporte a múltiplos usuários locais
  authenticate: async (credentials: any) => {
    try {
      return await request('auth/login', { 
        method: 'POST', 
        body: JSON.stringify(credentials) 
      });
    } catch (err) {
      // Se a API falhar, tenta o banco local
      const localUsers = getLocal(STORAGE_KEYS.USERS);
      const user = localUsers.find((u: any) => 
        u.username.toLowerCase() === credentials.username.toLowerCase() && 
        u.password === credentials.password
      );
      
      if (user) return { user };

      // Fallback master imutável
      if (credentials.username.toLowerCase() === 'admin' && credentials.password === 'admin') {
        return { 
          user: { 
            id: 'admin', 
            username: 'admin', 
            displayName: 'Master Administrator',
            email: 'admin@riossistem.com.br' 
          } 
        };
      }
      throw err;
    }
  },
  
  forgotPassword: (username: string) => request('auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ username })
  })
};
