
const BASE_URL = 'https://api.riossistem.com.br/controle-financeiro';

// Chaves para o LocalStorage (Fallback)
const STORAGE_KEYS = {
  ENTRIES: 'rios_data_entries',
  EXPENSES: 'rios_data_expenses',
  GOALS: 'rios_data_goals',
  USERS: 'rios_data_users'
};

const getLocal = (key: string) => JSON.parse(localStorage.getItem(key) || '[]');
const saveLocal = (key: string, data: any) => localStorage.setItem(key, JSON.stringify(data));

async function request(endpoint: string, options: RequestInit = {}, storageKey?: string) {
  const cleanBase = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${cleanBase}${cleanEndpoint}`;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // Timeout rápido para evitar travar a UI

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
    throw new Error(`Erro ${response.status}`);
  } catch (error: any) {
    console.warn(`Modo Offline ativado para ${endpoint}: Servidor inacessível.`);
    
    // Se tivermos uma chave de storage, operamos localmente
    if (storageKey) {
      const localData = getLocal(storageKey);
      
      if (options.method === 'POST') {
        const newItem = JSON.parse(options.body as string);
        const updated = [...localData, newItem];
        saveLocal(storageKey, updated);
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
        return { success: true };
      }

      return localData;
    }
    
    // Fallback para autenticação admin local
    if (endpoint === '/auth/login') {
      const creds = JSON.parse(options.body as string);
      if (creds.username === 'admin' && creds.password === 'admin') {
        return { user: { id: 'admin', username: 'admin', displayName: 'Administrador (Offline)' } };
      }
    }

    throw error;
  }
}

export const api = {
  getAllData: () => request('/sync'),
  getEntries: () => request('/entries', {}, STORAGE_KEYS.ENTRIES),
  saveEntry: (entry: any) => request('/entries', { 
    method: String(entry.id).includes('-') || !entry.id ? 'POST' : 'PUT', 
    body: JSON.stringify(entry) 
  }, STORAGE_KEYS.ENTRIES),
  deleteEntry: (id: string) => request(`/entries/${id}`, { method: 'DELETE' }, STORAGE_KEYS.ENTRIES),

  getExpenses: () => request('/expenses', {}, STORAGE_KEYS.EXPENSES),
  saveExpense: (expense: any) => request('/expenses', { 
    method: String(expense.id).includes('-') || !expense.id ? 'POST' : 'PUT', 
    body: JSON.stringify(expense) 
  }, STORAGE_KEYS.EXPENSES),
  deleteExpense: (id: string) => request(`/expenses/${id}`, { method: 'DELETE' }, STORAGE_KEYS.EXPENSES),

  getGoals: () => request('/goals', {}, STORAGE_KEYS.GOALS),
  saveGoal: (goal: any) => request('/goals', { 
    method: String(goal.id).includes('-') || !goal.id ? 'POST' : 'PUT', 
    body: JSON.stringify(goal) 
  }, STORAGE_KEYS.GOALS),
  deleteGoal: (id: string) => request(`/goals/${id}`, { method: 'DELETE' }, STORAGE_KEYS.GOALS),

  getUsers: () => request('/users', {}, STORAGE_KEYS.USERS),
  authenticate: (credentials: any) => request('/auth/login', { 
    method: 'POST', 
    body: JSON.stringify(credentials) 
  }),
  forgotPassword: (username: string) => request('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ username })
  }),
  saveUser: (user: any) => request('/users', { 
    method: String(user.id).includes('-') ? 'POST' : 'PUT', 
    body: JSON.stringify(user) 
  }, STORAGE_KEYS.USERS),
  deleteUser: (id: string) => request(`/users/${id}`, { method: 'DELETE' }, STORAGE_KEYS.USERS),
};
