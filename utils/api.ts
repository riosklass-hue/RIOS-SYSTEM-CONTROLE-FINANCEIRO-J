
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

/**
 * Função de processamento local para mutations (POST/PUT/DELETE)
 * Garante que o cache local reflita a alteração imediatamente e preserve campos sensíveis
 */
function handleLocalMutation(endpoint: string, options: RequestInit, storageKey: string, apiResult?: any) {
  const localData = getLocal(storageKey);
  
  // Pegamos os dados originais enviados na requisição (que contém a senha)
  const sentData = options.body ? JSON.parse(options.body as string) : {};
  
  // CRÍTICO: Mesclamos os dados enviados com o resultado da API.
  // Isso evita que, se a API retornar apenas o ID, percamos o resto das informações (como a senha).
  const itemToSave = apiResult ? { ...sentData, ...apiResult } : sentData;

  if (options.method === 'POST') {
    if (!itemToSave.id) itemToSave.id = `temp-${Date.now()}`;
    // Evita duplicatas se a API já retornou um ID que já existe localmente
    const filtered = localData.filter((item: any) => String(item.id) !== String(itemToSave.id));
    const updated = [...filtered, itemToSave];
    saveLocal(storageKey, updated);
    return itemToSave;
  }
  
  if (options.method === 'PUT') {
    const updated = localData.map((item: any) => 
      String(item.id) === String(itemToSave.id) ? { ...item, ...itemToSave } : item
    );
    saveLocal(storageKey, updated);
    return itemToSave;
  }
  
  if (options.method === 'DELETE') {
    const id = endpoint.split('/').pop();
    const updated = localData.filter((item: any) => String(item.id) !== String(id));
    saveLocal(storageKey, updated);
    return { success: true };
  }
  
  return itemToSave;
}

async function request(endpoint: string, options: RequestInit = {}, storageKey?: string) {
  const cleanBase = BASE_URL.replace(/\/$/, '');
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${cleanBase}${cleanEndpoint}`;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

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
      
      // Se a API deu OK em um salvamento, atualizamos o cache local IMEDIATAMENTE mesclando os dados
      if (storageKey && options.method && options.method !== 'GET') {
        handleLocalMutation(endpoint, options, storageKey, data);
      } 
      // Se for um GET, atualizamos a lista toda mas com cuidado para não sobrescrever dados locais novos
      else if (storageKey && (!options.method || options.method === 'GET')) {
        saveLocal(storageKey, data);
      }
      
      return data;
    }
    
    // Se a API falhar (404/500/Timeout), aplicamos a mudança localmente
    if (storageKey && options.method && options.method !== 'GET') {
      return handleLocalMutation(endpoint, options, storageKey);
    }

    if (response.status === 404 && storageKey) return getLocal(storageKey);

    throw new Error(`Erro API: ${response.status}`);

  } catch (error: any) {
    if (storageKey) {
      if (options.method && options.method !== 'GET') {
        return handleLocalMutation(endpoint, options, storageKey);
      }
      return getLocal(storageKey);
    }
    throw error;
  }
}

const getMethod = (item: any) => {
  if (!item.id || String(item.id).startsWith('temp-')) return 'POST';
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

  authenticate: async (credentials: any) => {
    const cleanUsername = String(credentials.username || '').toLowerCase().trim();
    const cleanPassword = String(credentials.password || '');
    
    try {
      // 1. Tenta API
      return await request('auth/login', { 
        method: 'POST', 
        body: JSON.stringify({ username: cleanUsername, password: cleanPassword }) 
      });
    } catch (err) {
      // 2. Fallback Local (Busca em usuários salvos no navegador)
      const localUsers = getLocal(STORAGE_KEYS.USERS);
      const user = localUsers.find((u: any) => 
        String(u.username || '').toLowerCase().trim() === cleanUsername && 
        String(u.password || '') === cleanPassword
      );
      
      if (user) return { user };

      // 3. Fallback Admin Master
      if (cleanUsername === 'admin' && cleanPassword === 'admin') {
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
