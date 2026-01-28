import React, { useState, useEffect } from 'react';
import { AreaChart, BarChart, PieChart, LineChart } from './index';
import { formatCurrency, formatNumber, formatPercentage } from './utils';

/**
 * Componente de exemplo de Dashboard usando todos os gráficos
 * Demonstra integração com estados de loading, dados vazios e formatação
 */
const DashboardExample: React.FC = () => {
  const [loading, setLoading] = useState(true);

  // Simular carregamento de dados
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  // Dados de vendas mensais
  const salesData = [
    { name: 'Jan', vendas: 45000, meta: 40000 },
    { name: 'Fev', vendas: 52000, meta: 45000 },
    { name: 'Mar', vendas: 48000, meta: 50000 },
    { name: 'Abr', vendas: 61000, meta: 55000 },
    { name: 'Mai', vendas: 55000, meta: 58000 },
    { name: 'Jun', vendas: 67000, meta: 60000 },
  ];

  // Dados de receitas vs despesas
  const financialData = [
    { name: 'Jan', receitas: 120000, despesas: 85000 },
    { name: 'Fev', receitas: 135000, despesas: 92000 },
    { name: 'Mar', receitas: 128000, despesas: 88000 },
    { name: 'Abr', receitas: 145000, despesas: 95000 },
    { name: 'Mai', receitas: 152000, despesas: 98000 },
    { name: 'Jun', receitas: 168000, despesas: 102000 },
  ];

  // Dados de produtos mais vendidos
  const topProductsData = [
    { name: 'Produto A', vendas: 245 },
    { name: 'Produto B', vendas: 198 },
    { name: 'Produto C', vendas: 156 },
    { name: 'Produto D', vendas: 134 },
    { name: 'Produto E', vendas: 112 },
  ];

  // Dados de distribuição de vendas por região
  const regionData = [
    { name: 'Sudeste', value: 45 },
    { name: 'Sul', value: 25 },
    { name: 'Nordeste', value: 18 },
    { name: 'Centro-Oeste', value: 8 },
    { name: 'Norte', value: 4 },
  ];

  // Dados de crescimento de clientes
  const customerGrowthData = [
    { name: 'Jan', total: 1200, novos: 150, inativos: 20 },
    { name: 'Fev', total: 1330, novos: 180, inativos: 50 },
    { name: 'Mar', total: 1460, novos: 165, inativos: 35 },
    { name: 'Abr', total: 1590, novos: 195, inativos: 65 },
    { name: 'Mai', total: 1720, novos: 170, inativos: 40 },
    { name: 'Jun', total: 1850, novos: 210, inativos: 80 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Dashboard Analytics
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Visão geral das métricas e desempenho do negócio
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Vendas Totais
            </h3>
            <span className="text-green-600 text-sm font-medium">+12%</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(328000)}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Clientes Ativos
            </h3>
            <span className="text-green-600 text-sm font-medium">+8%</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatNumber(1850)}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Taxa de Conversão
            </h3>
            <span className="text-red-600 text-sm font-medium">-2%</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatPercentage(23.4)}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Ticket Médio
            </h3>
            <span className="text-green-600 text-sm font-medium">+5%</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(177)}
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vendas vs Meta */}
        <div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Vendas vs Meta Mensal
            </h2>
            <LineChart
              data={salesData}
              dataKeys={[
                { key: 'vendas', name: 'Vendas', color: '#10b981' },
                {
                  key: 'meta',
                  name: 'Meta',
                  color: '#ef4444',
                  strokeDasharray: '5 5',
                },
              ]}
              height={300}
              isLoading={loading}
            />
          </div>
        </div>

        {/* Receitas vs Despesas */}
        <div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Receitas vs Despesas
            </h2>
            <AreaChart
              data={financialData}
              dataKeys={[
                { key: 'receitas', name: 'Receitas', color: '#8b5cf6' },
                { key: 'despesas', name: 'Despesas', color: '#f59e0b' },
              ]}
              height={300}
              isLoading={loading}
            />
          </div>
        </div>

        {/* Top 5 Produtos */}
        <div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Top 5 Produtos Mais Vendidos
            </h2>
            <BarChart
              data={topProductsData}
              dataKeys={[{ key: 'vendas', name: 'Vendas', color: '#06b6d4' }]}
              height={300}
              isLoading={loading}
              horizontal
            />
          </div>
        </div>

        {/* Distribuição por Região */}
        <div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Vendas por Região (%)
            </h2>
            <PieChart
              data={regionData}
              height={300}
              isLoading={loading}
              valueFormatter={(value) => `${value}%`}
            />
          </div>
        </div>

        {/* Crescimento de Clientes - Full Width */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Crescimento de Base de Clientes
            </h2>
            <AreaChart
              data={customerGrowthData}
              dataKeys={[
                { key: 'total', name: 'Total', color: '#8b5cf6' },
                { key: 'novos', name: 'Novos', color: '#10b981' },
                { key: 'inativos', name: 'Inativos', color: '#ef4444' },
              ]}
              height={350}
              isLoading={loading}
              stacked={false}
            />
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>Dados atualizados em tempo real • Última atualização: {new Date().toLocaleString('pt-BR')}</p>
      </div>
    </div>
  );
};

export default DashboardExample;
