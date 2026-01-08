
export enum ExpenseLocal {
  PIX = 'PIX',
  COFRE = 'COFRE',
  OUTROS = 'OUTROS'
}

export interface Goal {
  id: string;
  code: string;
  companyName: string;
  bloqueiraMeta: number;
  agentMeta: number;
  idep40hMeta: number;
  idep20hMeta: number;
}

export interface Entry {
  id: string;
  date: string;
  companyName: string;
  bloqueiraValue: number;
  agentValue: number;
  idep40hValue: number;
  idep20hValue: number;
}

export interface Expense {
  id: string;
  data: string; // Mapeado para 'data' no banco
  nome: string; // Mapeado para 'nome' (antiga descrição)
  valor: number; // Mapeado para 'valor'
  local?: ExpenseLocal; // Opcional se não houver na tabela, mantido para lógica de interface
}

export interface UserProfile {
  id: string;
  username: string;
  password: string;
  displayName: string;
  email: string; // Adicionado para recuperação de senha
}

export interface CalculatedEntry extends Entry {
  partialTotal: number;
  totalGain: number;
  diffBloqueira: number;
  diffAgent: number;
  weekNumber: number;
  month: string;
  weeklyGoal: number;
  difference: number;
}

export interface CompanySummary {
  companyName: string;
  code: string;
  // Metas (Previsto) - Semanal
  metaBloqueira: number;
  metaAgente: number;
  metaPlataformaTotal: number;
  meta40h: number;
  meta20h: number;
  metaIdepTotal: number;
  metaGeral: number;
  // Meta Mensal (Auto-calculada: Semanal * 4)
  metaGeralMensal: number;
  // Realizado (Ganhos)
  ganhoBloqueira: number;
  ganhoAgente: number;
  ganhoPlataforma: number;
  ganho40h: number;
  ganho20h: number;
  ganhoIdep: number;
  ganhoGeral: number;
}
