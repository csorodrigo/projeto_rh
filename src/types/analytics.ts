/**
 * Types para People Analytics Dashboard
 * Fase 8 - Diferenciação
 */

export interface AnalyticsPeriod {
  startDate: Date;
  endDate: Date;
  label: string;
}

export interface TurnoverMetrics {
  rate: number; // Taxa de turnover (%)
  voluntary: number; // Turnover voluntário (%)
  involuntary: number; // Turnover involuntário (%)
  hires: number; // Admissões no período
  terminations: number; // Desligamentos no período
  avgHeadcount: number; // Headcount médio do período
  cost: number; // Custo estimado do turnover
  byDepartment: DepartmentMetric[];
  trend: TrendData[];
}

export interface RecruitmentMetrics {
  timeToHire: number; // Dias médios para contratação
  costPerHire: number; // Custo por contratação
  offerAcceptanceRate: number; // Taxa de aceitação (%)
  sourceEffectiveness: SourceMetric[];
  applications: number; // Total de candidaturas
  interviews: number; // Total de entrevistas
  offers: number; // Ofertas feitas
  hires: number; // Contratações
  conversionRate: number; // Taxa de conversão (%)
  trend: TrendData[];
}

export interface AbsenteeismMetrics {
  rate: number; // Taxa de absenteísmo (%)
  totalAbsences: number; // Total de ausências (dias)
  avgDuration: number; // Duração média (dias)
  cost: number; // Custo estimado
  byType: TypeMetric[];
  byDepartment: DepartmentMetric[];
  trend: TrendData[];
  heatmap: HeatmapData[];
}

export interface ProductivityMetrics {
  avgHoursWorked: number; // Média de horas trabalhadas
  overtimeRate: number; // Taxa de horas extras (%)
  overtimeHours: number; // Total de horas extras
  utilizationRate: number; // Taxa de utilização (%)
  productivityIndex: number; // Índice de produtividade (0-100)
  trend: TrendData[];
}

export interface EngagementMetrics {
  avgTenure: number; // Tempo médio de casa (meses)
  promotionRate: number; // Taxa de promoção (%)
  retentionRate: number; // Taxa de retenção (%)
  earlyTurnover: number; // Turnover nos primeiros 90 dias (%)
  satisfactionScore: number; // Pontuação de satisfação (0-100)
  trend: TrendData[];
}

export interface DiversityMetrics {
  genderDistribution: GenderMetric[];
  ageDistribution: AgeRangeMetric[];
  tenureDistribution: TenureRangeMetric[];
  salaryEquity: EquityMetric[];
  diversityIndex: number; // Índice de diversidade (0-100)
}

export interface HeadcountMetrics {
  total: number; // Total de funcionários
  active: number; // Ativos
  onLeave: number; // Em licença
  byDepartment: DepartmentMetric[];
  byPosition: PositionMetric[];
  trend: TrendData[];
  projection?: TrendData[]; // Projeção futura (opcional)
}

export interface CostMetrics {
  totalPayroll: number; // Folha total
  avgCostPerEmployee: number; // Custo médio por funcionário
  benefitsCost: number; // Custo de benefícios
  recruitmentCost: number; // Custo de recrutamento
  turnoverCost: number; // Custo de turnover
  trainingCost: number; // Custo de treinamento
  trend: TrendData[];
}

export interface DepartmentMetric {
  department: string;
  value: number;
  percentage?: number;
  count?: number;
  change?: number; // Mudança em relação ao período anterior
}

export interface PositionMetric {
  position: string;
  value: number;
  percentage?: number;
  count?: number;
}

export interface TypeMetric {
  type: string;
  value: number;
  percentage?: number;
  count?: number;
}

export interface SourceMetric {
  source: string;
  applications: number;
  hires: number;
  cost: number;
  effectiveness: number; // Taxa de efetividade (%)
}

export interface GenderMetric {
  gender: string;
  count: number;
  percentage: number;
}

export interface AgeRangeMetric {
  range: string;
  count: number;
  percentage: number;
}

export interface TenureRangeMetric {
  range: string;
  count: number;
  percentage: number;
}

export interface EquityMetric {
  category: string;
  avgSalary: number;
  gap: number; // Diferença salarial (%)
  count: number;
}

export interface TrendData {
  date: string;
  value: number;
  label?: string;
}

export interface HeatmapData {
  day: string;
  hour?: number;
  value: number;
}

export interface KPIData {
  label: string;
  value: number | string;
  change: number; // Mudança percentual
  trend: 'up' | 'down' | 'stable';
  status: 'good' | 'warning' | 'critical';
  sparkline?: number[]; // Dados para mini gráfico
  format?: 'number' | 'percentage' | 'currency' | 'days';
}

export interface Insight {
  id: string;
  type: 'alert' | 'warning' | 'info' | 'success';
  category: 'turnover' | 'absenteeism' | 'recruitment' | 'productivity' | 'diversity' | 'cost';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  recommendation?: string;
  metric?: {
    value: number;
    benchmark: number;
    difference: number;
  };
  createdAt: Date;
}

export interface AnalyticsDashboard {
  period: AnalyticsPeriod;
  kpis: KPIData[];
  headcount: HeadcountMetrics;
  turnover: TurnoverMetrics;
  recruitment: RecruitmentMetrics;
  absenteeism: AbsenteeismMetrics;
  productivity: ProductivityMetrics;
  engagement: EngagementMetrics;
  diversity: DiversityMetrics;
  costs: CostMetrics;
  insights: Insight[];
}

export interface PredictionResult {
  employeeId: string;
  employeeName: string;
  riskScore: number; // 0-100
  factors: PredictionFactor[];
  recommendation: string;
}

export interface PredictionFactor {
  factor: string;
  impact: number; // Impacto no risco (0-100)
  description: string;
}

export interface HeadcountProjection {
  month: string;
  projected: number;
  confidence: number; // Nível de confiança (0-100)
  lower: number; // Limite inferior
  upper: number; // Limite superior
}

export interface HiringNeed {
  department: string;
  position: string;
  currentCount: number;
  projectedNeed: number;
  gap: number;
  priority: 'high' | 'medium' | 'low';
  timeframe: string; // Ex: "Q1 2026"
}

export interface BenchmarkComparison {
  metric: string;
  value: number;
  benchmark: number;
  industry: string;
  status: 'above' | 'at' | 'below';
  difference: number;
  percentile: number; // 0-100
}

export interface ExportOptions {
  format: 'pdf' | 'csv' | 'xlsx' | 'png';
  includeCharts: boolean;
  includeTrends: boolean;
  includeInsights: boolean;
  period: AnalyticsPeriod;
}

export interface ComparisonPeriod {
  current: AnalyticsPeriod;
  previous: AnalyticsPeriod;
  type: 'period-over-period' | 'year-over-year';
}

export interface FilterOptions {
  department?: string[];
  position?: string[];
  status?: string[];
  ageRange?: [number, number];
  tenureRange?: [number, number];
}
