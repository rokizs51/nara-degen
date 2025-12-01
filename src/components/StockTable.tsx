import React from 'react';
import { StockWithMarketData } from '@/data/stock-calls';
import { formatCurrency, formatPercentage, calculateRelativePerformance } from '@/lib/formatters';

interface StockTableProps {
  stocks: StockWithMarketData[];
  isLoading?: boolean;
}

interface BadgeProps {
  value: number;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

// Reusable badge component for color-coded values
const ValueBadge: React.FC<BadgeProps> = ({ value, showIcon = false, size = 'md' }) => {
  const isPositive = value >= 0;
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const iconSize = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium rounded-full ${sizeClasses[size]} ${isPositive
          ? 'bg-green-100 text-green-800 border border-green-200'
          : 'bg-red-100 text-red-800 border border-red-200'
        }`}
    >
      {showIcon && (
        <svg
          className={iconSize[size]}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {isPositive ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
            />
          )}
        </svg>
      )}
      {formatPercentage(Math.abs(value))}
    </span>
  );
};

const StockTable: React.FC<StockTableProps> = ({ stocks, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left p-3 font-semibold text-gray-700 bg-gray-50">Ticker</th>
              <th className="text-left p-3 font-semibold text-gray-700 bg-gray-50">Company</th>
              <th className="text-left p-3 font-semibold text-gray-700 bg-gray-50">Entry → Target</th>
              <th className="text-left p-3 font-semibold text-gray-700 bg-gray-50">Current</th>
              <th className="text-center p-3 font-semibold text-gray-700 bg-gray-50">Current Gain</th>
              <th className="text-center p-3 font-semibold text-gray-700 bg-gray-50">Max Gain</th>
              <th className="text-center p-3 font-semibold text-gray-700 bg-gray-50">vs JKSE</th>
              <th className="text-center p-3 font-semibold text-gray-700 bg-gray-50">vs LQ45</th>
              <th className="text-center p-3 font-semibold text-gray-700 bg-gray-50">Days to Max</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="p-3">
                  <div className="animate-pulse bg-gray-200 h-4 w-16 rounded"></div>
                </td>
                <td className="p-3">
                  <div className="animate-pulse bg-gray-200 h-4 w-32 rounded"></div>
                </td>
                <td className="p-3">
                  <div className="animate-pulse bg-gray-200 h-4 w-24 rounded"></div>
                </td>
                <td className="p-3">
                  <div className="animate-pulse bg-gray-200 h-4 w-20 rounded"></div>
                </td>
                <td className="p-3 text-center">
                  <div className="animate-pulse bg-gray-200 h-6 w-20 rounded-full mx-auto"></div>
                </td>
                <td className="p-3 text-center">
                  <div className="animate-pulse bg-gray-200 h-6 w-20 rounded-full mx-auto"></div>
                </td>
                <td className="p-3 text-center">
                  <div className="animate-pulse bg-gray-200 h-6 w-20 rounded-full mx-auto"></div>
                </td>
                <td className="p-3 text-center">
                  <div className="animate-pulse bg-gray-200 h-6 w-20 rounded-full mx-auto"></div>
                </td>
                <td className="p-3 text-center">
                  <div className="animate-pulse bg-gray-200 h-4 w-12 rounded mx-auto"></div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (stocks.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
        <svg
          className="mx-auto h-12 w-12 text-gray-400 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        <p className="text-gray-500 text-lg font-medium">No stock data available</p>
        <p className="text-gray-400 text-sm mt-1">Try refreshing the data or check your connection</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="text-left p-4 font-semibold text-gray-700 sticky top-0 bg-gray-50 z-10">
              Ticker
            </th>
            <th className="text-left p-4 font-semibold text-gray-700 sticky top-0 bg-gray-50 z-10">
              Company
            </th>
            <th className="text-left p-4 font-semibold text-gray-700 sticky top-0 bg-gray-50 z-10">
              Entry → Target
            </th>
            <th className="text-left p-4 font-semibold text-gray-700 sticky top-0 bg-gray-50 z-10">
              Current
            </th>
            <th className="text-center p-4 font-semibold text-gray-700 sticky top-0 bg-gray-50 z-10">
              Current Gain
            </th>
            <th className="text-center p-4 font-semibold text-gray-700 sticky top-0 bg-gray-50 z-10">
              Max Gain
            </th>
            <th className="text-center p-4 font-semibold text-gray-700 sticky top-0 bg-gray-50 z-10">
              vs JKSE
            </th>
            <th className="text-center p-4 font-semibold text-gray-700 sticky top-0 bg-gray-50 z-10">
              vs LQ45
            </th>
            <th className="text-center p-4 font-semibold text-gray-700 sticky top-0 bg-gray-50 z-10">
              Days to Max
            </th>
          </tr>
        </thead>
        <tbody>
          {stocks.map((stock) => {
            const jkseComparison = calculateRelativePerformance(stock.currentGain, stock.jkseReturn);
            const lq45Comparison = calculateRelativePerformance(stock.currentGain, stock.lq45Return);

            return (
              <tr
                key={stock.id}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-gray-900">
                      {stock.ticker}
                    </span>
                    <ValueBadge value={stock.currentGain} size="sm" />
                  </div>
                </td>
                <td className="p-4">
                  <div>
                    <div className="font-medium text-gray-900">{stock.companyName}</div>
                    <div className="text-sm text-gray-500">{stock.sector}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-400">{stock.analyst}</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-400">{stock.callDate}</span>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">
                      {formatCurrency(stock.entryPrice)}
                    </div>
                    <div className="text-xs text-gray-500">→ {formatCurrency(stock.targetPrice)}</div>
                    <div className="text-xs text-gray-400">
                      {formatPercentage(((stock.targetPrice - stock.entryPrice) / stock.entryPrice) * 100)} target
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="font-medium text-gray-900">
                    {formatCurrency(stock.currentPrice)}
                  </div>
                </td>
                <td className="p-4 text-center">
                  <ValueBadge value={stock.currentGain} showIcon={true} />
                </td>
                <td className="p-4 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <ValueBadge value={stock.maxGain} />
                    <span className="text-xs text-gray-500">
                      {formatPercentage((stock.maxGain / stock.currentGain) * 100)} of current
                    </span>
                  </div>
                </td>
                <td className="p-4 text-center">
                  {stock.jkseReturn !== undefined ? (
                    <div className="flex flex-col items-center gap-1">
                      <ValueBadge value={jkseComparison.outperformance} />
                      <span className="text-xs text-gray-500">
                        JKSE: {formatPercentage(stock.jkseReturn)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm">-</span>
                  )}
                </td>
                <td className="p-4 text-center">
                  {stock.lq45Return !== undefined ? (
                    <div className="flex flex-col items-center gap-1">
                      <ValueBadge value={lq45Comparison.outperformance} />
                      <span className="text-xs text-gray-500">
                        LQ45: {formatPercentage(stock.lq45Return)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm">-</span>
                  )}
                </td>
                <td className="p-4 text-center">
                  <div className="flex items-center justify-center">
                    {stock.daysToMax !== null ? (
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{stock.daysToMax}</span>
                        <span className="text-xs text-gray-500">days</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default StockTable;