
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
  status: 'ativo' | 'inativo';
}

export interface Entry {
  id: string;
  date: string;
  companyName: string;
  bloqueiraValue: number;
  agentValue: number;
  idep40hValue: number;
  idep20hValue: number;
  status: 'ativo' | 'inativo';
}

export interface Expense {
  id: string;
  data: string;
  nome: string;
  valor: number;
  local?: ExpenseLocal;
}

export interface UserProfile {
  id: string;
  username: string;
  password: string;
  displayName: string;
  email: string;
}

export interface CalculatedEntry extends Entry {
  plataformaBruta: number;
  idepTotal: number;
  totalLiquido: number; // Plataforma Bruta - IDEP
  month: string;
  weekNumber: number;
  // Propriedades adicionais para compatibilidade com UI
  partialTotal: number;
  totalGain: number;
}

export interface CompanySummary {
  companyName: string;
  code: string;
  metaBloqueira: number;
  metaAgente: number;
  metaPlataformaTotal: number;
  meta40h: number;
  meta20h: number;
  metaIdepTotal: number;
  metaGeral: number;
  metaGeralMensal: number;
  ganhoBloqueira: number;
  ganhoAgente: number;
  ganhoPlataforma: number;
  ganho40h: number;
  ganho20h: number;
  ganhoIdep: number;
  ganhoGeral: number; // Bruto Acumulado da Unidade
}