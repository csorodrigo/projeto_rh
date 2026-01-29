/**
 * Cálculo de Métricas para People Analytics
 * Fase 8 - Diferenciação
 *
 * Fórmulas baseadas em padrões de RH e People Analytics
 */

import type {
  TurnoverMetrics,
  RecruitmentMetrics,
  AbsenteeismMetrics,
  ProductivityMetrics,
  EngagementMetrics,
  DiversityMetrics,
  DepartmentMetric,
  SourceMetric,
  TypeMetric,
  GenderMetric,
  AgeRangeMetric,
  TenureRangeMetric,
  EquityMetric,
} from '@/types/analytics';

/**
 * TURNOVER METRICS
 */

/**
 * Calcula taxa de turnover
 * Fórmula: (Desligamentos / Headcount Médio) * 100
 */
export function calculateTurnover(
  terminations: number,
  avgHeadcount: number
): number {
  if (avgHeadcount === 0) return 0;
  return (terminations / avgHeadcount) * 100;
}

/**
 * Calcula turnover voluntário e involuntário
 */
export function calculateTurnoverByType(
  voluntaryTerminations: number,
  involuntaryTerminations: number,
  avgHeadcount: number
): { voluntary: number; involuntary: number } {
  return {
    voluntary: calculateTurnover(voluntaryTerminations, avgHeadcount),
    involuntary: calculateTurnover(involuntaryTerminations, avgHeadcount),
  };
}

/**
 * Calcula custo estimado do turnover
 * Estimativa: 1.5x a 2x o salário anual do funcionário
 */
export function calculateTurnoverCost(
  terminations: number,
  avgSalary: number,
  multiplier: number = 1.5
): number {
  return terminations * avgSalary * 12 * multiplier;
}

/**
 * Calcula turnover por departamento
 */
export function calculateTurnoverByDepartment(
  departmentData: Array<{
    department: string;
    terminations: number;
    avgHeadcount: number;
  }>
): DepartmentMetric[] {
  return departmentData.map((dept) => ({
    department: dept.department,
    value: calculateTurnover(dept.terminations, dept.avgHeadcount),
    count: dept.terminations,
  }));
}

/**
 * RECRUITMENT METRICS
 */

/**
 * Calcula tempo médio de contratação (Time to Hire)
 * Em dias desde a publicação da vaga até a aceitação da oferta
 */
export function calculateTimeToHire(
  applications: Array<{ postedDate: Date; hiredDate: Date }>
): number {
  if (applications.length === 0) return 0;

  const totalDays = applications.reduce((sum, app) => {
    const days = Math.floor(
      (app.hiredDate.getTime() - app.postedDate.getTime()) /
        (1000 * 60 * 60 * 24)
    );
    return sum + days;
  }, 0);

  return Math.round(totalDays / applications.length);
}

/**
 * Calcula custo por contratação (Cost per Hire)
 * Fórmula: Total de custos de recrutamento / Número de contratações
 */
export function calculateCostPerHire(
  totalCosts: number,
  hires: number
): number {
  if (hires === 0) return 0;
  return totalCosts / hires;
}

/**
 * Calcula taxa de aceitação de ofertas
 * Fórmula: (Ofertas Aceitas / Ofertas Feitas) * 100
 */
export function calculateOfferAcceptanceRate(
  offersAccepted: number,
  offersMade: number
): number {
  if (offersMade === 0) return 0;
  return (offersAccepted / offersMade) * 100;
}

/**
 * Calcula efetividade por fonte de recrutamento
 */
export function calculateSourceEffectiveness(
  sourceData: Array<{
    source: string;
    applications: number;
    hires: number;
    cost: number;
  }>
): SourceMetric[] {
  return sourceData.map((source) => ({
    source: source.source,
    applications: source.applications,
    hires: source.hires,
    cost: source.cost,
    effectiveness:
      source.applications > 0
        ? (source.hires / source.applications) * 100
        : 0,
  }));
}

/**
 * ABSENTEEISM METRICS
 */

/**
 * Calcula taxa de absenteísmo
 * Fórmula: (Dias de Ausência / (Dias Úteis * Número de Funcionários)) * 100
 */
export function calculateAbsenteeismRate(
  totalAbsenceDays: number,
  workDays: number,
  employees: number
): number {
  const totalWorkDays = workDays * employees;
  if (totalWorkDays === 0) return 0;
  return (totalAbsenceDays / totalWorkDays) * 100;
}

/**
 * Calcula absenteísmo por tipo
 */
export function calculateAbsenteeismByType(
  absenceData: Array<{ type: string; days: number }>
): TypeMetric[] {
  const totalDays = absenceData.reduce((sum, abs) => sum + abs.days, 0);

  return absenceData.map((abs) => ({
    type: abs.type,
    value: abs.days,
    percentage: totalDays > 0 ? (abs.days / totalDays) * 100 : 0,
  }));
}

/**
 * Calcula custo de absenteísmo
 * Estimativa: (Dias de Ausência * Salário Diário)
 */
export function calculateAbsenteeismCost(
  absenceDays: number,
  avgDailySalary: number
): number {
  return absenceDays * avgDailySalary;
}

/**
 * PRODUCTIVITY METRICS
 */

/**
 * Calcula média de horas trabalhadas
 */
export function calculateAverageHoursWorked(
  totalHours: number,
  employees: number,
  workDays: number
): number {
  if (employees === 0 || workDays === 0) return 0;
  return totalHours / (employees * workDays);
}

/**
 * Calcula taxa de horas extras
 * Fórmula: (Horas Extras / Total de Horas Trabalhadas) * 100
 */
export function calculateOvertimeRate(
  overtimeHours: number,
  totalHours: number
): number {
  if (totalHours === 0) return 0;
  return (overtimeHours / totalHours) * 100;
}

/**
 * Calcula índice de produtividade
 * Métrica customizada: (Horas Produtivas / Horas Totais) * 100
 */
export function calculateProductivityIndex(
  productiveHours: number,
  totalHours: number
): number {
  if (totalHours === 0) return 0;
  return Math.min((productiveHours / totalHours) * 100, 100);
}

/**
 * Calcula taxa de utilização
 * Fórmula: (Horas Faturáveis / Horas Disponíveis) * 100
 */
export function calculateUtilizationRate(
  billableHours: number,
  availableHours: number
): number {
  if (availableHours === 0) return 0;
  return (billableHours / availableHours) * 100;
}

/**
 * ENGAGEMENT & RETENTION METRICS
 */

/**
 * Calcula tempo médio de casa (tenure)
 * Em meses
 */
export function calculateAverageTenure(
  employees: Array<{ hireDate: Date }>
): number {
  if (employees.length === 0) return 0;

  const now = new Date();
  const totalMonths = employees.reduce((sum, emp) => {
    const months =
      (now.getTime() - emp.hireDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    return sum + months;
  }, 0);

  return Math.round(totalMonths / employees.length);
}

/**
 * Calcula taxa de promoção
 * Fórmula: (Promoções / Total de Funcionários) * 100
 */
export function calculatePromotionRate(
  promotions: number,
  totalEmployees: number,
  periodMonths: number = 12
): number {
  if (totalEmployees === 0) return 0;
  // Anualizar se período for diferente de 12 meses
  const annualizedPromotions = (promotions / periodMonths) * 12;
  return (annualizedPromotions / totalEmployees) * 100;
}

/**
 * Calcula taxa de retenção
 * Fórmula: ((Funcionários no Fim - Novos Contratados) / Funcionários no Início) * 100
 */
export function calculateRetentionRate(
  startCount: number,
  endCount: number,
  newHires: number
): number {
  if (startCount === 0) return 0;
  const retained = endCount - newHires;
  return (retained / startCount) * 100;
}

/**
 * Calcula early turnover (primeiros 90 dias)
 */
export function calculateEarlyTurnover(
  earlyTerminations: number,
  totalHires: number
): number {
  if (totalHires === 0) return 0;
  return (earlyTerminations / totalHires) * 100;
}

/**
 * DIVERSITY METRICS
 */

/**
 * Calcula distribuição por gênero
 */
export function calculateGenderDistribution(
  employees: Array<{ gender: string }>
): GenderMetric[] {
  const total = employees.length;
  if (total === 0) return [];

  const counts: Record<string, number> = {};
  employees.forEach((emp) => {
    counts[emp.gender] = (counts[emp.gender] || 0) + 1;
  });

  return Object.entries(counts).map(([gender, count]) => ({
    gender,
    count,
    percentage: (count / total) * 100,
  }));
}

/**
 * Calcula distribuição por faixa etária
 */
export function calculateAgeDistribution(
  employees: Array<{ birthDate: Date }>
): AgeRangeMetric[] {
  const total = employees.length;
  if (total === 0) return [];

  const ranges = [
    { range: '18-24', min: 18, max: 24 },
    { range: '25-34', min: 25, max: 34 },
    { range: '35-44', min: 35, max: 44 },
    { range: '45-54', min: 45, max: 54 },
    { range: '55+', min: 55, max: 999 },
  ];

  const now = new Date();
  const counts = ranges.map((r) => {
    const count = employees.filter((emp) => {
      const age = Math.floor(
        (now.getTime() - emp.birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365)
      );
      return age >= r.min && age <= r.max;
    }).length;

    return {
      range: r.range,
      count,
      percentage: (count / total) * 100,
    };
  });

  return counts;
}

/**
 * Calcula distribuição por tempo de casa
 */
export function calculateTenureDistribution(
  employees: Array<{ hireDate: Date }>
): TenureRangeMetric[] {
  const total = employees.length;
  if (total === 0) return [];

  const ranges = [
    { range: '0-6 meses', min: 0, max: 6 },
    { range: '6-12 meses', min: 6, max: 12 },
    { range: '1-2 anos', min: 12, max: 24 },
    { range: '2-5 anos', min: 24, max: 60 },
    { range: '5+ anos', min: 60, max: 9999 },
  ];

  const now = new Date();
  const counts = ranges.map((r) => {
    const count = employees.filter((emp) => {
      const months = Math.floor(
        (now.getTime() - emp.hireDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
      );
      return months >= r.min && months < r.max;
    }).length;

    return {
      range: r.range,
      count,
      percentage: (count / total) * 100,
    };
  });

  return counts;
}

/**
 * Calcula equidade salarial
 * Compara salários médios entre grupos
 */
export function calculateSalaryEquity(
  employeeData: Array<{ category: string; salary: number }>
): EquityMetric[] {
  const categories: Record<
    string,
    { total: number; count: number; salaries: number[] }
  > = {};

  // Agrupar por categoria
  employeeData.forEach((emp) => {
    if (!categories[emp.category]) {
      categories[emp.category] = { total: 0, count: 0, salaries: [] };
    }
    categories[emp.category].total += emp.salary;
    categories[emp.category].count += 1;
    categories[emp.category].salaries.push(emp.salary);
  });

  // Calcular média geral
  const overallAvg =
    employeeData.reduce((sum, emp) => sum + emp.salary, 0) /
    employeeData.length;

  // Calcular gap para cada categoria
  return Object.entries(categories).map(([category, data]) => {
    const avgSalary = data.total / data.count;
    const gap = ((avgSalary - overallAvg) / overallAvg) * 100;

    return {
      category,
      avgSalary,
      gap,
      count: data.count,
    };
  });
}

/**
 * Calcula índice de diversidade
 * Usa Shannon Diversity Index adaptado
 */
export function calculateDiversityIndex(
  distributions: Array<{ category: string; count: number }>
): number {
  const total = distributions.reduce((sum, d) => sum + d.count, 0);
  if (total === 0) return 0;

  // Shannon Index: -Σ(pi * ln(pi))
  const shannon = distributions.reduce((sum, d) => {
    const p = d.count / total;
    if (p === 0) return sum;
    return sum - p * Math.log(p);
  }, 0);

  // Normalizar para 0-100
  const maxShannon = Math.log(distributions.length);
  return maxShannon > 0 ? (shannon / maxShannon) * 100 : 0;
}

/**
 * HELPER FUNCTIONS
 */

/**
 * Calcula variação percentual entre dois valores
 */
export function calculatePercentageChange(
  current: number,
  previous: number
): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Calcula média de um array de números
 */
export function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

/**
 * Calcula mediana de um array de números
 */
export function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/**
 * Detecta anomalia usando desvio padrão
 */
export function detectAnomaly(
  value: number,
  mean: number,
  stdDev: number,
  threshold: number = 2
): boolean {
  return Math.abs(value - mean) > threshold * stdDev;
}

/**
 * Calcula desvio padrão
 */
export function calculateStdDev(values: number[]): number {
  if (values.length === 0) return 0;
  const avg = calculateAverage(values);
  const squaredDiffs = values.map((val) => Math.pow(val - avg, 2));
  const variance = calculateAverage(squaredDiffs);
  return Math.sqrt(variance);
}
