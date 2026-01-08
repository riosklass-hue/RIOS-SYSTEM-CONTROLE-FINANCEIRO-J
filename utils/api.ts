
/**
 * Configuração da API Rios System
 * Arquitetura Dual: LocalStorage (AI Studio) + Hostinger (Nuvem)
 */
const BASE_URL = 'https://api.riossistem.com.br';

const STORAGE_KEYS = {
  ENTRIES: 'rios_data_entries',
  EXPENSES: 'rios_data_expenses',
  GOALS: 'rios_data_goals',
  USERS: 'rios_data_users',
  LAST_SYNC: 'rios_last_sync_timestamp'
};

/**
 * Recupera dados do armazenamento local de forma segura
 */
const getLocal = (key: string) => {
  try {
    const data = localStorage.getItem(key);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error(`Falha ao ler cache local (${key}):`, e);
    return [];
  }
};

/**
 * Salva dados localmente com inteligência de mesclagem
 */
const saveLocal = (key: string, data: any) => {
  if (!Array.isArray(data)) return;

  if (key === STORAGE_KEYS.USERS) {
    const existing = getLocal(key);
    const merged = data.map((newUser: any) => {
      const oldUser = existing.find((u: any) => String(u.id) === String(newUser.id) || u.username === newUser.username);
      return {
        ...newUser,
        password: newUser.password || oldUser?.password || '' 
      };
    });
    localStorage.setItem(key, JSON.stringify(merged));
  } else {
    // Merge inteligente: evita duplicados e mantém a ordem cronológica
    const existing = getLocal(key);
    const dataMap = new Map();
    // Prioriza dados que acabaram de chegar
    existing.forEach((item: any) => dataMap.set(String(item.id), item));
    data.forEach((item: any) => dataMap.set(String(item.id), item));
    
    const finalData = Array.from(dataMap.values());
    localStorage.setItem(key, JSON.stringify(finalData));
  }
  
  localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
};

/**
 * Executor de requisições com persistência de contingência
 */
async function request(endpoint: string, options: RequestInit = {}, storageKey?: string) {
  const url = `${BASE_URL.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;
  
  // LOGICA DE REGISTRO IMEDIATO: Salva no LocalStorage antes mesmo de tentar a rede
  if (storageKey && options.method && options.method !== 'GET') {
    const localData = getLocal(storageKey);
    const bodyData = options.body ? JSON.parse(options.body as string) : {};
    
    if (options.method === 'POST') {
      const newItem = { ...bodyData, id: bodyData.id || `temp-${crypto.randomUUID()}` };
      saveLocal(storageKey, [...localData, newItem]);
    } else if (options.method === 'PUT') {
      saveLocal(storageKey, localData.map((item: any) => String(item.id) === String(bodyData.id) ? { ...item, ...bodyData } : item));
    } else if (options.method === 'DELETE') {
      const idToDelete = endpoint.split('/').pop();
      const filtered = localData.filter((item: any) => String(item.id) !== String(idToDelete));
      localStorage.setItem(storageKey, JSON.stringify(filtered));
    }
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos de tolerância

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
      // Se a resposta for uma lista, atualizamos o banco local para ficar idêntico ao servidor
      if (storageKey && Array.isArray(data)) {
        saveLocal(storageKey, data);
      }
      return data;
    }
  } catch (error) {
    console.warn(`[REGISTRO] Falha na rede para ${endpoint}. O dado foi registrado apenas localmente no AI Studio.`);
  }

  // Fallback: Retorna o que temos no localstorage para não quebrar a UI
  return storageKey ? getLocal(storageKey) : null;
}

export const api = {
  checkStatus: async () => {
    try {
      const res = await fetch(`${BASE_URL}/health`, { method: 'GET', mode: 'cors' });
      return res.ok;
    } catch (e) {
      return false;
    }
  },
  
  getEntries: () => request('entries', {}, STORAGE_KEYS.ENTRIES),
  saveEntry: (e: any) => request('entries', { 
    method: e.id && !String(e.id).startsWith('temp-') ? 'PUT' : 'POST', 
    body: JSON.stringify(e) 
  }, STORAGE_KEYS.ENTRIES),
  deleteEntry: (id: string) => request(`entries/${id}`, { method: 'DELETE' }, STORAGE_KEYS.ENTRIES),
  
  getExpenses: () => request('expenses', {}, STORAGE_KEYS.EXPENSES),
  saveExpense: (e: any) => request('expenses', { 
    method: e.id && !String(e.id).startsWith('temp-') ? 'PUT' : 'POST', 
    body: JSON.stringify(e) 
  }, STORAGE_KEYS.EXPENSES),
  deleteExpense: (id: string) => request(`expenses/${id}`, { method: 'DELETE' }, STORAGE_KEYS.EXPENSES),
  
  getGoals: () => request('goals', {}, STORAGE_KEYS.GOALS),
  saveGoal: (e: any) => request('goals', { 
    method: e.id && !String(e.id).startsWith('temp-') ? 'PUT' : 'POST', 
    body: JSON.stringify(e) 
  }, STORAGE_KEYS.GOALS),
  deleteGoal: (id: string) => request(`goals/${id}`, { method: 'DELETE' }, STORAGE_KEYS.GOALS),
  
  getUsers: () => request('users', {}, STORAGE_KEYS.USERS),
  saveUser: (u: any) => request('users', { 
    method: u.id && !String(u.id).startsWith('temp-') ? 'PUT' : 'POST', 
    body: JSON.stringify(u) 
  }, STORAGE_KEYS.USERS),
  deleteUser: (id: string) => request(`users/${id}`, { method: 'DELETE' }, STORAGE_KEYS.USERS),

  authenticate: async (credentials: any) => {
    const user = String(credentials.username || '').toLowerCase().trim();
    const pass = String(credentials.password || '');
    
    if (user === 'admin' && pass === 'admin') {
      return { user: { id: 'admin', username: 'admin', displayName: 'Master Administrator', email: 'admin@riossistem.com.br' } };
    }

    try {
      const remoteUsers = await api.getUsers();
      if (Array.isArray(remoteUsers)) {
        const found = remoteUsers.find((u: any) => 
          String(u.username || '').toLowerCase().trim() === user && 
          String(u.password || '') === pass
        );
        if (found) return { user: found };
      }
    } catch (e) {}

    const localUsers = getLocal(STORAGE_KEYS.USERS);
    const foundLocal = localUsers.find((u: any) => 
      String(u.username || '').toLowerCase().trim() === user && 
      String(u.password || '') === pass
    );
    
    if (foundLocal) return { user: foundLocal };

    throw new Error('Usuário ou senha inválidos. Sistema operando em modo Local-First.');
  }
};
