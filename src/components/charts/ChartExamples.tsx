import React from 'react';
import { AreaChart, BarChart, PieChart, LineChart } from './index';

// Dados de exemplo para demonstração
const areaChartData = [
  { name: 'Jan', vendas: 4000, despesas: 2400 },
  { name: 'Fev', vendas: 3000, despesas: 1398 },
  { name: 'Mar', vendas: 2000, despesas: 9800 },
  { name: 'Abr', vendas: 2780, despesas: 3908 },
  { name: 'Mai', vendas: 1890, despesas: 4800 },
  { name: 'Jun', vendas: 2390, despesas: 3800 },
];

const barChartData = [
  { name: 'Seg', horas: 40 },
  { name: 'Ter', horas: 35 },
  { name: 'Qua', horas: 45 },
  { name: 'Qui', horas: 38 },
  { name: 'Sex', horas: 42 },
];

const pieChartData = [
  { name: 'Desenvolvimento', value: 400 },
  { name: 'Marketing', value: 300 },
  { name: 'Vendas', value: 300 },
  { name: 'Suporte', value: 200 },
];

const lineChartData = [
  { name: 'Jan', usuarios: 100, novos: 40 },
  { name: 'Fev', usuarios: 150, novos: 50 },
  { name: 'Mar', usuarios: 200, novos: 50 },
  { name: 'Abr', usuarios: 280, novos: 80 },
  { name: 'Mai', usuarios: 350, novos: 70 },
  { name: 'Jun', usuarios: 450, novos: 100 },
];

const ChartExamples: React.FC = () => {
  return (
    <div className="p-8 space-y-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        Exemplos de Gráficos
      </h1>

      {/* AreaChart Example */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
          Gráfico de Área
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Ideal para mostrar tendências ao longo do tempo com múltiplas séries de dados.
        </p>
        <AreaChart
          data={areaChartData}
          dataKeys={[
            { key: 'vendas', name: 'Vendas', color: '#8b5cf6' },
            { key: 'despesas', name: 'Despesas', color: '#ef4444' },
          ]}
          height={300}
        />
      </section>

      {/* BarChart Example */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
          Gráfico de Barras
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Perfeito para comparar valores entre diferentes categorias.
        </p>
        <BarChart
          data={barChartData}
          dataKeys={[{ key: 'horas', name: 'Horas Trabalhadas', color: '#06b6d4' }]}
          height={300}
        />
      </section>

      {/* Horizontal BarChart Example */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
          Gráfico de Barras Horizontal
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Variação horizontal para melhor leitura de categorias com nomes longos.
        </p>
        <BarChart
          data={barChartData}
          dataKeys={[{ key: 'horas', name: 'Horas Trabalhadas', color: '#10b981' }]}
          height={300}
          horizontal
        />
      </section>

      {/* PieChart Example */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
          Gráfico de Pizza
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Excelente para mostrar distribuição proporcional de dados.
        </p>
        <PieChart data={pieChartData} height={300} />
      </section>

      {/* Donut Chart Example */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
          Gráfico Donut
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Variação do gráfico de pizza com espaço central para informações adicionais.
        </p>
        <PieChart data={pieChartData} height={300} innerRadius={60} />
      </section>

      {/* LineChart Example */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
          Gráfico de Linhas
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Ótimo para visualizar evolução temporal e identificar padrões.
        </p>
        <LineChart
          data={lineChartData}
          dataKeys={[
            { key: 'usuarios', name: 'Usuários Totais', color: '#8b5cf6' },
            { key: 'novos', name: 'Novos Usuários', color: '#06b6d4' },
          ]}
          height={300}
        />
      </section>

      {/* Loading State Example */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
          Estado de Carregamento
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Todos os gráficos suportam estado de carregamento.
        </p>
        <LineChart
          data={[]}
          dataKeys={[{ key: 'value', name: 'Valor' }]}
          height={300}
          isLoading={true}
        />
      </section>

      {/* Empty State Example */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
          Estado Vazio
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Feedback visual quando não há dados disponíveis.
        </p>
        <BarChart
          data={[]}
          dataKeys={[{ key: 'value', name: 'Valor' }]}
          height={300}
          emptyMessage="Nenhuma informação encontrada"
        />
      </section>
    </div>
  );
};

export default ChartExamples;
