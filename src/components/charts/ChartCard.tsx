import React, { ReactNode } from 'react';

interface ChartCardProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}

/**
 * Componente wrapper para gráficos com título, subtítulo e ações
 * Fornece layout consistente e estilização
 */
const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  children,
  action,
  className = '',
}) => {
  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}
    >
      {/* Header */}
      {(title || subtitle || action) && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            {title && (
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {title}
              </h3>
            )}
            {action && <div className="flex-shrink-0">{action}</div>}
          </div>
          {subtitle && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* Chart Content */}
      <div>{children}</div>
    </div>
  );
};

export default ChartCard;
