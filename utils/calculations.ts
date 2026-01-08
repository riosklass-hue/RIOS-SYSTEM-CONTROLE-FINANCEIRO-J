
import { Entry, Goal, CalculatedEntry, CompanySummary } from '../types';

export const getWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const calculateEntries = (entries: Entry[], goals: Goal[]): CalculatedEntry[] => {
  return entries
    .filter(e => e.status !== 'inativo')
    .map(entry => {
      const date = new Date(entry.date);
      
      // REGRAS DE CÁLCULO SOLICITADAS:
      // 1. Plataforma Bruta = soma de todos os valores lançados
      const plataformaBruta = (entry.bloqueiraValue || 0) + 
                             (entry.agentValue || 0) + 
                             (entry.idep40hValue || 0) + 
                             (entry.idep20hValue || 0);
      
      // 2. IDEP = soma IDEP 40h + IDEP 20h
      const idepTotal = (entry.idep40hValue || 0) + (entry.idep20hValue || 0);
      
      // 3. Total do Lançamento = Plataforma Bruta - IDEP
      const totalLiquido = plataformaBruta - idepTotal;

      // Adicionando mapeamentos para propriedades esperadas na UI
      const partialTotal = totalLiquido; // Bloqueira + Agente
      const totalGain = plataformaBruta; // Bruto Total

      return {
        ...entry,
        plataformaBruta,
        idepTotal,
        totalLiquido,
        partialTotal,
        totalGain,
        weekNumber: getWeekNumber(date),
        month: date.toLocaleString('pt-BR', { month: 'long' })
      };
    });
};

export const getCompanySummaries = (entries: Entry[], goals: Goal[]): CompanySummary[] => {
  return goals.filter(g => g.status !== 'inativo').map(goal => {
    const companyEntries = entries.filter(e => e.companyName === goal.companyName && e.status !== 'inativo');
    
    const ganhoBloqueira = companyEntries.reduce((acc, curr) => acc + (curr.bloqueiraValue || 0), 0);
    const ganhoAgente = companyEntries.reduce((acc, curr) => acc + (curr.agentValue || 0), 0);
    const ganho40h = companyEntries.reduce((acc, curr) => acc + (curr.idep40hValue || 0), 0);
    const ganho20h = companyEntries.reduce((acc, curr) => acc + (curr.idep20hValue || 0), 0);
    
    // Bruto da Unidade
    const ganhoGeral = ganhoBloqueira + ganhoAgente + ganho40h + ganho20h;
    
    const metaPlataformaTotal = (goal.bloqueiraMeta || 0) + (goal.agentMeta || 0);
    const metaIdepTotal = (goal.idep40hMeta || 0) + (goal.idep20hMeta || 0);
    
    const metaGeral = metaPlataformaTotal; 
    const metaGeralMensal = metaGeral * 4;

    return {
      companyName: goal.companyName,
      code: goal.code,
      metaBloqueira: goal.bloqueiraMeta,
      metaAgente: goal.agentMeta,
      metaPlataformaTotal,
      meta40h: goal.idep40hMeta,
      meta20h: goal.idep20hMeta,
      metaIdepTotal,
      metaGeral,
      metaGeralMensal,
      ganhoBloqueira,
      ganhoAgente,
      ganhoPlataforma: ganhoBloqueira + ganhoAgente,
      ganho40h,
      ganho20h,
      ganhoIdep: ganho40h + ganho20h,
      ganhoGeral
    };
  });
};