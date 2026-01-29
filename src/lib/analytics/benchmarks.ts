/**
 * Benchmarks de Mercado para People Analytics
 * Fase 8 - Diferenciação
 *
 * Baseado em dados de mercado brasileiro e internacional
 */

export interface BenchmarkRange {
  excellent: number;
  good: number;
  average: number;
  poor: number;
}

export interface IndustryBenchmark {
  technology: number;
  services: number;
  retail: number;
  manufacturing: number;
  healthcare: number;
  finance: number;
}

/**
 * Benchmarks de Turnover (%)
 */
export const TURNOVER_BENCHMARKS: BenchmarkRange = {
  excellent: 5,
  good: 10,
  average: 15,
  poor: 20,
};

export const TURNOVER_BY_INDUSTRY: IndustryBenchmark = {
  technology: 13.2,
  services: 18.5,
  retail: 60.0, // Alta rotatividade no varejo
  manufacturing: 12.3,
  healthcare: 15.7,
  finance: 10.5,
};

/**
 * Benchmarks de Absenteísmo (%)
 */
export const ABSENTEEISM_BENCHMARKS: BenchmarkRange = {
  excellent: 2,
  good: 3,
  average: 5,
  poor: 8,
};

export const ABSENTEEISM_BY_INDUSTRY: IndustryBenchmark = {
  technology: 2.5,
  services: 3.8,
  retail: 5.2,
  manufacturing: 4.5,
  healthcare: 6.0, // Maior devido à natureza do trabalho
  finance: 2.8,
};

/**
 * Benchmarks de Time to Hire (dias)
 */
export const TIME_TO_HIRE_BENCHMARKS: BenchmarkRange = {
  excellent: 15,
  good: 30,
  average: 45,
  poor: 60,
};

export const TIME_TO_HIRE_BY_INDUSTRY: IndustryBenchmark = {
  technology: 38,
  services: 35,
  retail: 18, // Contratação mais rápida
  manufacturing: 32,
  healthcare: 42,
  finance: 45,
};

/**
 * Benchmarks de Cost per Hire (R$)
 */
export const COST_PER_HIRE_BENCHMARKS: BenchmarkRange = {
  excellent: 3000,
  good: 5000,
  average: 8000,
  poor: 12000,
};

export const COST_PER_HIRE_BY_INDUSTRY: IndustryBenchmark = {
  technology: 9500,
  services: 6500,
  retail: 3200,
  manufacturing: 5800,
  healthcare: 7200,
  finance: 8900,
};

/**
 * Benchmarks de Offer Acceptance Rate (%)
 */
export const OFFER_ACCEPTANCE_BENCHMARKS: BenchmarkRange = {
  excellent: 90,
  good: 80,
  average: 70,
  poor: 60,
};

/**
 * Benchmarks de Early Turnover - primeiros 90 dias (%)
 */
export const EARLY_TURNOVER_BENCHMARKS: BenchmarkRange = {
  excellent: 5,
  good: 10,
  average: 15,
  poor: 25,
};

/**
 * Benchmarks de Overtime Rate (%)
 */
export const OVERTIME_BENCHMARKS: BenchmarkRange = {
  excellent: 5,
  good: 10,
  average: 15,
  poor: 20,
};

/**
 * Benchmarks de Promotion Rate (% anual)
 */
export const PROMOTION_RATE_BENCHMARKS: BenchmarkRange = {
  excellent: 15,
  good: 10,
  average: 7,
  poor: 5,
};

/**
 * Benchmarks de Diversity Index (0-100)
 */
export const DIVERSITY_INDEX_BENCHMARKS: BenchmarkRange = {
  excellent: 80,
  good: 65,
  average: 50,
  poor: 35,
};

/**
 * Benchmarks de Average Tenure (meses)
 */
export const AVERAGE_TENURE_BENCHMARKS: BenchmarkRange = {
  excellent: 60, // 5 anos
  good: 36, // 3 anos
  average: 24, // 2 anos
  poor: 12, // 1 ano
};

/**
 * Determina o status baseado no valor e benchmark
 */
export function getBenchmarkStatus(
  value: number,
  benchmark: BenchmarkRange,
  higherIsBetter: boolean = false
): 'excellent' | 'good' | 'average' | 'poor' {
  if (higherIsBetter) {
    if (value >= benchmark.excellent) return 'excellent';
    if (value >= benchmark.good) return 'good';
    if (value >= benchmark.average) return 'average';
    return 'poor';
  } else {
    if (value <= benchmark.excellent) return 'excellent';
    if (value <= benchmark.good) return 'good';
    if (value <= benchmark.average) return 'average';
    return 'poor';
  }
}

/**
 * Converte status em cor
 */
export function getStatusColor(
  status: 'excellent' | 'good' | 'average' | 'poor'
): string {
  switch (status) {
    case 'excellent':
      return 'text-green-600';
    case 'good':
      return 'text-blue-600';
    case 'average':
      return 'text-yellow-600';
    case 'poor':
      return 'text-red-600';
  }
}

/**
 * Obtém label descritivo do status
 */
export function getStatusLabel(
  status: 'excellent' | 'good' | 'average' | 'poor'
): string {
  switch (status) {
    case 'excellent':
      return 'Excelente';
    case 'good':
      return 'Bom';
    case 'average':
      return 'Na Média';
    case 'poor':
      return 'Abaixo da Média';
  }
}

/**
 * Calcula percentil (0-100) baseado em benchmark
 */
export function calculatePercentile(
  value: number,
  benchmark: BenchmarkRange,
  higherIsBetter: boolean = false
): number {
  if (higherIsBetter) {
    if (value >= benchmark.excellent) return 95;
    if (value >= benchmark.good) return 75;
    if (value >= benchmark.average) return 50;
    if (value >= benchmark.poor) return 25;
    return 10;
  } else {
    if (value <= benchmark.excellent) return 95;
    if (value <= benchmark.good) return 75;
    if (value <= benchmark.average) return 50;
    if (value <= benchmark.poor) return 25;
    return 10;
  }
}

/**
 * Compara valor com benchmark da indústria
 */
export function compareWithIndustry(
  value: number,
  industry: keyof IndustryBenchmark,
  benchmarks: IndustryBenchmark,
  higherIsBetter: boolean = false
): {
  difference: number;
  percentageDiff: number;
  status: 'above' | 'at' | 'below';
} {
  const industryValue = benchmarks[industry];
  const difference = value - industryValue;
  const percentageDiff = (difference / industryValue) * 100;

  let status: 'above' | 'at' | 'below';
  if (Math.abs(percentageDiff) < 5) {
    status = 'at';
  } else if (higherIsBetter) {
    status = difference > 0 ? 'above' : 'below';
  } else {
    status = difference < 0 ? 'above' : 'below';
  }

  return {
    difference,
    percentageDiff,
    status,
  };
}

/**
 * Retorna todos os benchmarks em um objeto
 */
export const ALL_BENCHMARKS = {
  turnover: TURNOVER_BENCHMARKS,
  absenteeism: ABSENTEEISM_BENCHMARKS,
  timeToHire: TIME_TO_HIRE_BENCHMARKS,
  costPerHire: COST_PER_HIRE_BENCHMARKS,
  offerAcceptance: OFFER_ACCEPTANCE_BENCHMARKS,
  earlyTurnover: EARLY_TURNOVER_BENCHMARKS,
  overtime: OVERTIME_BENCHMARKS,
  promotionRate: PROMOTION_RATE_BENCHMARKS,
  diversityIndex: DIVERSITY_INDEX_BENCHMARKS,
  averageTenure: AVERAGE_TENURE_BENCHMARKS,
};

/**
 * Retorna benchmarks por indústria
 */
export const INDUSTRY_BENCHMARKS = {
  turnover: TURNOVER_BY_INDUSTRY,
  absenteeism: ABSENTEEISM_BY_INDUSTRY,
  timeToHire: TIME_TO_HIRE_BY_INDUSTRY,
  costPerHire: COST_PER_HIRE_BY_INDUSTRY,
};
