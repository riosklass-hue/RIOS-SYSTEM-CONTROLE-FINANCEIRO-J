
/**
 * Configuração da API Rios System
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
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
};

const saveLocal = (key: string, data: any) => {
  if (key === STORAGE_KEYS.USERS && Array.isArray(data)) {
    const existing = getLocal(key);
    // CRÍTICO: Mescla novos usuários mantendo senhas locais se a API omitir
    const merged = data.map((newUser: any) => {
      const oldUser = existing.find((u: any) => String(u.id) === String(newUser.id) || u.username === newUser.username);
      return {
        ...newUser,
        password: newUser.password || oldUser?.password || '' 
      };
    });
    localStorage.setItem(key, JSON.stringify(merged));
  } else {
    localStorage.setItem(key, JSON.stringify(data));
  }
  localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
};

async function request(endpoint: string, options: RequestInit = {}, storageKey?: string) {
  const url = `${BASE_URL.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // Timeout aumentado para redes instáveis

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
      if (storageKey) {
        if (options.method && options.method !== 'GET') {
          const localData = getLocal(storageKey);
          const sentData = options.body ? JSON.parse(options.body as string) : {};
          const itemToSave = { ...sentData, ...data };
          
          if (options.method === 'POST') {
            saveLocal(storageKey, [...localData, itemToSave]);
          } else if (options.method === 'PUT') {
            saveLocal(storageKey, localData.map((item: any) => String(item.id) === String(itemToSave.id) ? itemToSave : item));
          }
        } else if (Array.isArray(data) && data.length > 0) {
          saveLocal(storageKey, data);
        }
      }
      return data;
    }
    
    return storageKey ? getLocal(storageKey) : null;
  } catch (error) {
    console.warn(`Erro na requisição ${endpoint}, usando cache local.`);
    return storageKey ? getLocal(storageKey) : null;
  }
}

export const api = {
  checkStatus: async () => {
    try {
      const res = await request('health');
      return !!res;
    } catch (e) {
      return false;
    }
  },
  
  getEntries: () => request('entries', {}, STORAGE_KEYS.ENTRIES),
  saveEntry: (e: any) => request('entries', { method: e.id && !String(e.id).startsWith('temp-') ? 'PUT' : 'POST', body: JSON.stringify(e) }, STORAGE_KEYS.ENTRIES),
  deleteEntry: (id: string) => request(`entries/${id}`, { method: 'DELETE' }, STORAGE_KEYS.ENTRIES),
  
  getExpenses: () => request('expenses', {}, STORAGE_KEYS.EXPENSES),
  saveExpense: (e: any) => request('expenses', { method: e.id && !String(e.id).startsWith('temp-') ? 'PUT' : 'POST', body: JSON.stringify(e) }, STORAGE_KEYS.EXPENSES),
  deleteExpense: (id: string) => request(`expenses/${id}`, { method: 'DELETE' }, STORAGE_KEYS.EXPENSES),
  
  getGoals: () => request('goals', {}, STORAGE_KEYS.GOALS),
  saveGoal: (e: any) => request('goals', { method: e.id && !String(e.id).startsWith('temp-') ? 'PUT' : 'POST', body: JSON.stringify(e) }, STORAGE_KEYS.GOALS),
  deleteGoal: (id: string) => request(`goals/${id}`, { method: 'DELETE' }, STORAGE_KEYS.GOALS),
  
  getUsers: () => request('users', {}, STORAGE_KEYS.USERS),
  saveUser: (u: any) => request('users', { method: u.id && !String(u.id).startsWith('temp-') ? 'PUT' : 'POST', body: JSON.stringify(u) }, STORAGE_KEYS.USERS),
  deleteUser: (id: string) => request(`users/${id}`, { method: 'DELETE' }, STORAGE_KEYS.USERS),

  authenticate: async (credentials: any) => {
    const user = String(credentials.username || '').toLowerCase().trim();
    const pass = String(credentials.password || '');
    
    // 1. Master Admin (Nativo)
    if (user === 'admin' && pass === 'admin') {
      return { user: { id: 'admin', username: 'admin', displayName: 'Master Administrator', email: 'admin@riossistem.com.br' } };
    }

    // 2. Tenta carregar usuários atualizados antes de negar o login
    let localUsers = getLocal(STORAGE_KEYS.USERS);
    if (localUsers.length === 0) {
      const fetched = await api.getUsers();
      if (Array.isArray(fetched)) localUsers = fetched;
    }

    // 3. Busca o operador na lista local
    const found = localUsers.find((u: any) => 
      String(u.username || '').toLowerCase().trim() === user && 
      String(u.password || '') === pass
    );
    
    if (found) return { user: found };

    throw new Error('Usuário ou senha inválidos.');
  }
};
