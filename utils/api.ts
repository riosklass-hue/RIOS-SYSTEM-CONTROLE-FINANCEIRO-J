
const BASE_URL = 'https://api.riossistem.com.br/controle-financeiro';

async function request(endpoint: string, options: RequestInit = {}) {
  const cleanBase = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${cleanBase}${cleanEndpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error: any) {
    if (error.name === 'TypeError') {
      throw new Error('ERRO_CONEXAO: Não foi possível conectar ao servidor api.riossistem.com.br.');
    }
    throw error;
  }
}

export const api = {
  // Sincronização Geral
  getAllData: () => request('/sync'),

  // Entradas
  getEntries: () => request('/entries'),
  saveEntry: (entry: any) => request('/entries', { 
    method: String(entry.id).includes('-') ? 'POST' : 'PUT', 
    body: JSON.stringify(entry) 
  }),
  deleteEntry: (id: string) => request(`/entries/${id}`, { method: 'DELETE' }),

  // Saídas
  getExpenses: () => request('/expenses'),
  saveExpense: (expense: any) => request('/expenses', { 
    method: String(expense.id).includes('-') ? 'POST' : 'PUT', 
    body: JSON.stringify(expense) 
  }),
  deleteExpense: (id: string) => request(`/expenses/${id}`, { method: 'DELETE' }),

  // Metas
  getGoals: () => request('/goals'),
  saveGoal: (goal: any) => request('/goals', { 
    method: String(goal.id).includes('-') ? 'POST' : 'PUT', 
    body: JSON.stringify(goal) 
  }),
  deleteGoal: (id: string) => request(`/goals/${id}`, { method: 'DELETE' }),

  // Usuários & Auth
  getUsers: () => request('/users'),
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
  }),
  deleteUser: (id: string) => request(`/users/${id}`, { method: 'DELETE' }),
};
