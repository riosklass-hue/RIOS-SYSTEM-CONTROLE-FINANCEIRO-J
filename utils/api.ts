
/**
 * Configuração da API Rios System - PRODUÇÃO HOSTINGER
 * Arquitetura: Local-First com Sincronização MySQL Cloud
 */
const BASE_URL = 'https://fi.riossistem.com.br/api';

export const STORAGE_KEYS = {
  ENTRIES: 'rios_data_entries',
  EXPENSES: 'rios_data_expenses',
  GOALS: 'rios_data_goals',
  USERS: 'rios_data_users'
};

const getLocal = (key: string) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (e) { return []; }
};

const saveLocal = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify(data));
};

async function request(endpoint: string, options: RequestInit = {}, storageKey?: string) {
  const url = `${BASE_URL}/${endpoint}`;
  
  // Sincronização Local Imediata (Optimistic UI)
  if (storageKey && options.method && options.method !== 'GET') {
    const localData = getLocal(storageKey);
    const bodyData = options.body ? JSON.parse(options.body as string) : {};
    
    if (options.method === 'POST') {
      const exists = localData.findIndex((i: any) => i.id === bodyData.id);
      if (exists > -1) localData[exists] = bodyData;
      else localData.push(bodyData);
    } else if (options.method === 'DELETE') {
      const id = endpoint.split('/').pop();
      const filtered = localData.filter((i: any) => i.id !== id);
      saveLocal(storageKey, filtered);
    }
    if (options.method !== 'DELETE') saveLocal(storageKey, localData);
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6 segundos para operações maiores

    const response = await fetch(url, {
      ...options,
      mode: 'cors',
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
      if (storageKey && Array.isArray(data)) {
        saveLocal(storageKey, data);
      }
      return data;
    }
  } catch (error) {
    console.warn(`[API] Erro de rede. Usando cache local.`);
  }

  return storageKey ? getLocal(storageKey) : null;
}

export const api = {
  checkStatus: async () => {
    try {
      const res = await fetch(`${BASE_URL}/health`, { method: 'GET', mode: 'cors' });
      return res.ok;
    } catch (e) { return false; }
  },
  
  getEntries: () => request('faturamento/listar', { method: 'GET' }, STORAGE_KEYS.ENTRIES),
  saveEntry: (e: any) => request('faturamento/salvar', { method: 'POST', body: JSON.stringify(e) }, STORAGE_KEYS.ENTRIES),
  deleteEntry: (id: string) => request(`faturamento/excluir/${id}`, { method: 'DELETE' }, STORAGE_KEYS.ENTRIES),
  
  getExpenses: () => request('saidas/listar', { method: 'GET' }, STORAGE_KEYS.EXPENSES),
  saveExpense: (e: any) => request('saidas/salvar', { method: 'POST', body: JSON.stringify(e) }, STORAGE_KEYS.EXPENSES),
  deleteExpense: (id: string) => request(`saidas/excluir/${id}`, { method: 'DELETE' }, STORAGE_KEYS.EXPENSES),
  
  getGoals: () => request('goals/listar', { method: 'GET' }, STORAGE_KEYS.GOALS),
  saveGoal: (e: any) => request('goals/salvar', { method: 'POST', body: JSON.stringify(e) }, STORAGE_KEYS.GOALS),
  deleteGoal: (id: string) => request(`goals/excluir/${id}`, { method: 'DELETE' }, STORAGE_KEYS.GOALS),

  authenticate: async (credentials: any) => {
    const { username, password } = credentials;
    // Fallback Admin
    if (username.toLowerCase() === 'admin' && password === '1234') {
      return { user: { id: 'admin', username: 'admin', displayName: 'Master Administrator', email: 'admin@riossistem.com.br' } };
    }
    return request('auth/login', { method: 'POST', body: JSON.stringify(credentials) });
  },

  getUsers: () => request('users/listar', { method: 'GET' }, STORAGE_KEYS.USERS),
  saveUser: (u: any) => request('users/salvar', { method: 'POST', body: JSON.stringify(u) }, STORAGE_KEYS.USERS),
  deleteUser: (id: string) => request(`users/excluir/${id}`, { method: 'DELETE' }, STORAGE_KEYS.USERS),

  sendBackup: (data: any) => request('system/backup', { method: 'POST', body: JSON.stringify(data) })
};
