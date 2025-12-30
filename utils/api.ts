
/**
 * Configuração da API Rios System
 * Conecta diretamente ao servidor na Hostinger
 */
const BASE_URL = 'https://api.riossistem.com.br';

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
  // Garante que a URL termine sem barra e o endpoint comece com barra
  const cleanBase = BASE_URL.replace(/\/$/, '');
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${cleanBase}${cleanEndpoint}`;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

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
      // Se for uma requisição GET de lista, salvamos no cache local
      if (storageKey && (!options.method || options.method === 'GET')) {
        saveLocal(storageKey, data);
      }
      return data;
    }
    
    // Tratamento de erro 404 (Endpoint não criado no servidor)
    if (response.status === 404) {
      console.warn(`Endpoint ${endpoint} não encontrado no servidor. Usando fallback local.`);
      if (storageKey) return getLocal(storageKey);
    }

    throw new Error(`Erro API: ${response.status}`);

  } catch (error: any) {
    // Fallback para dados locais em caso de erro de rede ou timeout
    const isNetworkError = error.name === 'AbortError' || 
                           error.message.includes('Failed to fetch') || 
                           error.message.includes('NetworkError');

    if (isNetworkError && storageKey) {
      console.log(`[Offline Mode] Servidor inacessível para ${endpoint}.`);
      const localData = getLocal(storageKey);
      
      // Simulação de sucesso para POST/PUT/DELETE em modo offline
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
        return { success: true };
      }
      
      return localData;
    }
    throw error;
  }
}

// Determina se deve ser POST ou PUT baseado no ID
const getMethod = (item: any) => {
  if (!item.id || String(item.id).startsWith('temp-')) return 'POST';
  return 'PUT';
};

export const api = {
  checkStatus: () => request('health'),
  
  // Faturamento
  getEntries: () => request('entries', {}, STORAGE_KEYS.ENTRIES),
  saveEntry: (entry: any) => request('entries', { 
    method: getMethod(entry), 
    body: JSON.stringify(entry) 
  }, STORAGE_KEYS.ENTRIES),
  deleteEntry: (id: string) => request(`entries/${id}`, { method: 'DELETE' }, STORAGE_KEYS.ENTRIES),

  // Despesas
  getExpenses: () => request('expenses', {}, STORAGE_KEYS.EXPENSES),
  saveExpense: (expense: any) => request('expenses', { 
    method: getMethod(expense), 
    body: JSON.stringify(expense) 
  }, STORAGE_KEYS.EXPENSES),
  deleteExpense: (id: string) => request(`expenses/${id}`, { method: 'DELETE' }, STORAGE_KEYS.EXPENSES),

  // Metas
  getGoals: () => request('goals', {}, STORAGE_KEYS.GOALS),
  saveGoal: (goal: any) => request('goals', { 
    method: getMethod(goal), 
    body: JSON.stringify(goal) 
  }, STORAGE_KEYS.GOALS),
  deleteGoal: (id: string) => request(`goals/${id}`, { method: 'DELETE' }, STORAGE_KEYS.GOALS),

  // Usuários / Equipe
  getUsers: () => request('users', {}, STORAGE_KEYS.USERS),
  saveUser: (user: any) => request('users', { 
    method: getMethod(user), 
    body: JSON.stringify(user) 
  }, STORAGE_KEYS.USERS),
  deleteUser: (id: string) => request(`users/${id}`, { method: 'DELETE' }, STORAGE_KEYS.USERS),

  /**
   * Autenticação Robusta Multi-Usuário
   */
  authenticate: async (credentials: any) => {
    try {
      // 1. Tenta autenticar via API
      return await request('auth/login', { 
        method: 'POST', 
        body: JSON.stringify(credentials) 
      });
    } catch (err) {
      // 2. Fallback: Se a API falhar ou não existir o endpoint, 
      // verifica na lista de usuários cadastrados que estão no cache
      const localUsers = getLocal(STORAGE_KEYS.USERS);
      const user = localUsers.find((u: any) => 
        u.username.toLowerCase() === credentials.username.toLowerCase() && 
        u.password === credentials.password
      );
      
      if (user) return { user };

      // 3. Fallback Master de Emergência
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
      throw new Error('Usuário ou senha inválidos.');
    }
  }
};
