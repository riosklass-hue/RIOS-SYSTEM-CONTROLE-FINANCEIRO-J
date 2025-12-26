
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
  return entries.map(entry => {
    const goalObj = goals.find(g => g.companyName === entry.companyName);
    const partialTotal = entry.bloqueiraValue + entry.agentValue;
    const totalGain = partialTotal + entry.idep40hValue + entry.idep20hValue;
    const date = new Date(entry.date);
    
    // Conforme solicitado: Diferença Meta deve utilizar a Meta Mensal (Plat)
    // A Meta Mensal é calculada como 4x a Meta Semanal cadastrada
    const monthlyBloqMeta = goalObj ? (goalObj.bloqueiraMeta * 4) : 0;
    const monthlyAgentMeta = goalObj ? (goalObj.agentMeta * 4) : 0;
    
    // Meta Weekly foca apenas na Plataforma (Bloqueira + Agente)
    const weeklyGoal = goalObj ? (goalObj.bloqueiraMeta + goalObj.agentMeta) : 0;
    
    return {
      ...entry,
      partialTotal,
      totalGain,
      // Diferenças calculadas contra as metas mensais (4x)
      diffBloqueira: entry.bloqueiraValue - monthlyBloqMeta,
      diffAgent: entry.agentValue - monthlyAgentMeta,
      weeklyGoal,
      difference: totalGain - weeklyGoal,
      weekNumber: getWeekNumber(date),
      month: date.toLocaleString('pt-BR', { month: 'long' })
    };
  });
};

export const getCompanySummaries = (entries: Entry[], goals: Goal[]): CompanySummary[] => {
  return goals.map(goal => {
    const companyEntries = entries.filter(e => e.companyName === goal.companyName);
    
    const ganhoBloqueira = companyEntries.reduce((acc, curr) => acc + curr.bloqueiraValue, 0);
    const ganhoAgente = companyEntries.reduce((acc, curr) => acc + curr.agentValue, 0);
    const ganho40h = companyEntries.reduce((acc, curr) => acc + curr.idep40hValue, 0);
    const ganho20h = companyEntries.reduce((acc, curr) => acc + curr.idep20hValue, 0);
    
    const ganhoPlataforma = ganhoBloqueira + ganhoAgente;
    const ganhoIdep = ganho40h + ganho20h;

    const metaPlataformaTotal = goal.bloqueiraMeta + goal.agentMeta;
    const metaIdepTotal = goal.idep40hMeta + goal.idep20hMeta;
    
    // Conforme solicitado: Meta Geral (Semanal) não contabiliza IDEP
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
      ganhoPlataforma,
      ganho40h,
      ganho20h,
      ganhoIdep,
      // Geral Real definido como a somatória de Total IDEP (Meta) + Meta Men. (Plat)
      ganhoGeral: metaIdepTotal + metaGeralMensal
    };
  });
};
