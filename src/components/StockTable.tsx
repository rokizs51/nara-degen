import React from 'react';
import { StockWithMarketData, MarketDataPoint } from '@/data/stock-calls';
import { formatCurrency, formatPercentage, calculateRelativePerformance } from '@/lib/formatters';

interface StockTableProps {
  stocks: StockWithMarketData[];
  isLoading?: boolean;
  darkMode?: boolean;
}

interface BadgeProps {
  value: number;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

// Helper function to get price from call date month
const getPriceFromCallDateMonth = (stock: StockWithMarketData): number => {
  const callDate = new Date(stock.callDate);

  // Get the first day of the call date month
  const firstDayOfMonth = new Date(callDate.getFullYear(), callDate.getMonth(), 1);

  // Find the historical data point closest to the call date month
  const callDateData = stock.historicalData.find(d => {
    const dataDate = new Date(d.date);
    return dataDate.getFullYear() === callDate.getFullYear() &&
           dataDate.getMonth() === callDate.getMonth();
  });

  // If we found data for the call date month, use the closing price from the first trading day of that month
  if (callDateData) {
    return callDateData.close;
  }

  // Fallback to the first available data point after or on the call date
  const afterCallDate = stock.historicalData.find(d => new Date(d.date) >= callDate);
  if (afterCallDate) {
    return afterCallDate.close;
  }

  // Final fallback to original entry price
  return stock.entryPrice;
};

// Reusable badge component for color-coded values
const ValueBadge: React.FC<BadgeProps & { darkMode?: boolean }> = ({ value, showIcon = false, size = 'md', darkMode = false }) => {
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
      className={`inline-flex items-center gap-1 font-medium rounded-full ${sizeClasses[size]} ${
        isPositive
          ? darkMode
            ? 'bg-green-900 text-green-200 border border-green-800'
            : 'bg-green-100 text-green-800 border border-green-200'
          : darkMode
            ? 'bg-red-900 text-red-200 border border-red-800'
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

const StockTable: React.FC<StockTableProps> = ({ stocks, isLoading = false, darkMode = false }) => {
  if (isLoading) {
    return (
      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <th className={`text-left p-3 font-semibold ${darkMode ? 'text-gray-300 bg-gray-800' : 'text-gray-700 bg-gray-50'}`}>Ticker</th>
              <th className={`text-left p-3 font-semibold ${darkMode ? 'text-gray-300 bg-gray-800' : 'text-gray-700 bg-gray-50'}`}>Company</th>
              <th className={`text-left p-3 font-semibold ${darkMode ? 'text-gray-300 bg-gray-800' : 'text-gray-700 bg-gray-50'}`}>Entry → Target</th>
              <th className={`text-left p-3 font-semibold ${darkMode ? 'text-gray-300 bg-gray-800' : 'text-gray-700 bg-gray-50'}`}>Current</th>
              <th className={`text-center p-3 font-semibold ${darkMode ? 'text-gray-300 bg-gray-800' : 'text-gray-700 bg-gray-50'}`}>Current Gain</th>
              <th className={`text-center p-3 font-semibold ${darkMode ? 'text-gray-300 bg-gray-800' : 'text-gray-700 bg-gray-50'}`}>Max Gain</th>
              <th className={`text-center p-3 font-semibold ${darkMode ? 'text-gray-300 bg-gray-800' : 'text-gray-700 bg-gray-50'}`}>vs JKSE</th>
              <th className={`text-center p-3 font-semibold ${darkMode ? 'text-gray-300 bg-gray-800' : 'text-gray-700 bg-gray-50'}`}>vs LQ45</th>
              <th className={`text-center p-3 font-semibold ${darkMode ? 'text-gray-300 bg-gray-800' : 'text-gray-700 bg-gray-50'}`}>Days to Max</th>
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
    <div className={`w-full overflow-x-auto border rounded-lg shadow-sm ${
      darkMode ? 'border-gray-700' : 'border-gray-200'
    }`}>
      <table className="w-full border-collapse">
        <thead>
          <tr className={`border-b bg-gray-50 ${
            darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200'
          }`}>
            <th className={`text-left p-4 font-semibold sticky top-0 z-10 ${
              darkMode ? 'text-gray-300 bg-gray-800' : 'text-gray-700 bg-gray-50'
            }`}>
              Ticker
            </th>
            <th className={`text-left p-4 font-semibold sticky top-0 z-10 ${
              darkMode ? 'text-gray-300 bg-gray-800' : 'text-gray-700 bg-gray-50'
            }`}>
              Company
            </th>
            <th className={`text-left p-4 font-semibold sticky top-0 z-10 ${
              darkMode ? 'text-gray-300 bg-gray-800' : 'text-gray-700 bg-gray-50'
            }`}>
              Entry → Target
            </th>
            <th className={`text-left p-4 font-semibold sticky top-0 z-10 ${
              darkMode ? 'text-gray-300 bg-gray-800' : 'text-gray-700 bg-gray-50'
            }`}>
              Current
            </th>
            <th className={`text-center p-4 font-semibold sticky top-0 z-10 ${
              darkMode ? 'text-gray-300 bg-gray-800' : 'text-gray-700 bg-gray-50'
            }`}>
              Current Gain
            </th>
            <th className={`text-center p-4 font-semibold sticky top-0 z-10 ${
              darkMode ? 'text-gray-300 bg-gray-800' : 'text-gray-700 bg-gray-50'
            }`}>
              Max Gain
            </th>
            <th className={`text-center p-4 font-semibold sticky top-0 z-10 ${
              darkMode ? 'text-gray-300 bg-gray-800' : 'text-gray-700 bg-gray-50'
            }`}>
              vs JKSE
            </th>
            <th className={`text-center p-4 font-semibold sticky top-0 z-10 ${
              darkMode ? 'text-gray-300 bg-gray-800' : 'text-gray-700 bg-gray-50'
            }`}>
              vs LQ45
            </th>
            <th className={`text-center p-4 font-semibold sticky top-0 z-10 ${
              darkMode ? 'text-gray-300 bg-gray-800' : 'text-gray-700 bg-gray-50'
            }`}>
              Days to Max
            </th>
          </tr>
        </thead>
        <tbody>
          {stocks.map((stock) => {
            // Get price from call date month
            const callDateMonthPrice = getPriceFromCallDateMonth(stock);

            // Recalculate current gain based on call date month price
            const recalculatedCurrentGain = ((stock.currentPrice - callDateMonthPrice) / callDateMonthPrice) * 100;

            const jkseComparison = calculateRelativePerformance(recalculatedCurrentGain, stock.jkseReturn);
            const lq45Comparison = calculateRelativePerformance(recalculatedCurrentGain, stock.lq45Return);

            return (
              <tr
                key={stock.id}
                className={`border-b transition-colors ${
                  darkMode
                    ? 'border-gray-700 hover:bg-gray-800'
                    : 'border-gray-100 hover:bg-gray-50'
                }`}
              >
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <span className={`font-mono font-semibold ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {stock.ticker}
                    </span>
                    <ValueBadge value={recalculatedCurrentGain} size="sm" darkMode={darkMode} />
                  </div>
                </td>
                <td className="p-4">
                  <div>
                    <div className={`font-medium ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}>{stock.companyName}</div>
                    <div className={`text-sm ${
                      darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>{stock.sector}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs ${
                        darkMode ? 'text-gray-500' : 'text-gray-400'
                      }`}>{stock.analyst}</span>
                      <span className={`text-xs ${
                        darkMode ? 'text-gray-500' : 'text-gray-400'
                      }`}>•</span>
                      <span className={`text-xs ${
                        darkMode ? 'text-gray-500' : 'text-gray-400'
                      }`}>{stock.callDate}</span>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="text-sm">
                    <div className={`font-medium ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {formatCurrency(callDateMonthPrice)}
                    </div>
                    <div className={`text-xs ${
                      darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>→ {formatCurrency(stock.targetPrice)}</div>
                    <div className={`text-xs ${
                      darkMode ? 'text-gray-500' : 'text-gray-400'
                    }`}>
                      {formatPercentage(((stock.targetPrice - callDateMonthPrice) / callDateMonthPrice) * 100)} target
                    </div>
                    <div className={`text-xs font-medium mt-1 ${
                      darkMode ? 'text-blue-400' : 'text-blue-500'
                    }`}>
                      {new Date(stock.callDate).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <div className={`font-medium ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {formatCurrency(stock.currentPrice)}
                  </div>
                </td>
                <td className="p-4 text-center">
                  <ValueBadge value={recalculatedCurrentGain} showIcon={true} darkMode={darkMode} />
                </td>
                <td className="p-4 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <ValueBadge value={stock.maxGain} darkMode={darkMode} />
                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {formatPercentage((stock.maxGain / recalculatedCurrentGain) * 100)} of current
                    </span>
                  </div>
                </td>
                <td className="p-4 text-center">
                  {stock.jkseReturn !== undefined ? (
                    <div className="flex flex-col items-center gap-1">
                      <ValueBadge value={jkseComparison.outperformance} darkMode={darkMode} />
                      <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        JKSE: {formatPercentage(stock.jkseReturn)}
                      </span>
                    </div>
                  ) : (
                    <span className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>-</span>
                  )}
                </td>
                <td className="p-4 text-center">
                  {stock.lq45Return !== undefined ? (
                    <div className="flex flex-col items-center gap-1">
                      <ValueBadge value={lq45Comparison.outperformance} darkMode={darkMode} />
                      <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        LQ45: {formatPercentage(stock.lq45Return)}
                      </span>
                    </div>
                  ) : (
                    <span className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>-</span>
                  )}
                </td>
                <td className="p-4 text-center">
                  <div className="flex items-center justify-center">
                    {stock.daysToMax !== null ? (
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stock.daysToMax}</span>
                        <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>days</span>
                      </div>
                    ) : (
                      <span className={darkMode ? 'text-gray-500' : 'text-gray-400'}>-</span>
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