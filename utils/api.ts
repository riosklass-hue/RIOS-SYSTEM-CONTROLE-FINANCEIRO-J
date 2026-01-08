
/**
 * Configuração da API Rios System - PRODUÇÃO HOSTINGER
 * Fonte Única de Dados: Banco de Dados MySQL
 */
const BASE_URL = 'https://fi.riossistem.com.br/api';

async function request(endpoint: string, options: RequestInit = {}) {
  const url = `${BASE_URL}/${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Erro na API: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error(`Falha crítica na comunicação com o servidor: ${endpoint}`, error);
    throw error; // Propaga o erro para ser tratado pela UI
  }
}

export const api = {
  /** Verifica se o banco de dados e servidor estão operacionais */
  checkStatus: async () => {
    try {
      const res = await fetch(`${BASE_URL}/health`);
      return res.ok;
    } catch (e) { return false; }
  },
  
  // FATURAMENTO (MYSQL)
  getEntries: () => request('faturamento/listar'),
  saveEntry: (e: any) => request('faturamento/salvar', { 
    method: 'POST', 
    body: JSON.stringify(e) 
  }),
  deleteEntry: (id: string) => request(`faturamento/excluir/${id}`, { method: 'DELETE' }),
  
  // SAÍDAS / DESPESAS (MYSQL)
  getExpenses: () => request('saidas/listar'),
  saveExpense: (e: any) => request('saidas/salvar', { 
    method: 'POST', 
    body: JSON.stringify(e) 
  }),
  deleteExpense: (id: string) => request(`saidas/excluir/${id}`, { method: 'DELETE' }),
  
  // UNIDADES E METAS (MYSQL)
  getGoals: () => request('goals/listar'),
  saveGoal: (e: any) => request('goals/salvar', { 
    method: 'POST', 
    body: JSON.stringify(e) 
  }),
  deleteGoal: (id: string) => request(`goals/excluir/${id}`, { method: 'DELETE' }),

  // AUTENTICAÇÃO REAL (MYSQL)
  authenticate: async (credentials: any) => {
    return request('auth/login', { 
      method: 'POST', 
      body: JSON.stringify(credentials) 
    });
  },

  // GESTÃO DE EQUIPE (MYSQL)
  getUsers: () => request('users/listar'),
  saveUser: (u: any) => request('users/salvar', { 
    method: 'POST', 
    body: JSON.stringify(u) 
  }),
  deleteUser: (id: string) => request(`users/excluir/${id}`, { method: 'DELETE' })
};
