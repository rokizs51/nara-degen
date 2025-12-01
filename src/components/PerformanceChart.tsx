import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { StockWithMarketData, MarketDataPoint, MarketIndices } from '@/data/stock-calls';
import { format } from 'date-fns';

interface ChartDataPoint {
  date: string;
  portfolio: number;
  jkse: number;
  lq45: number;
  timestamp: number;
}

interface PerformanceChartProps {
  stocks: StockWithMarketData[];
  marketIndices?: MarketIndices;
  isLoading?: boolean;
  darkMode?: boolean;
}

// Custom hook to normalize and process chart data
const useNormalizedChartData = (
  stocks: StockWithMarketData[],
  marketIndices?: MarketIndices
): ChartDataPoint[] => {
  return useMemo(() => {
    if (!stocks.length) {
      return [];
    }

    // Get index data with proper error handling
    const jkseData = marketIndices?.jkse || [];
    const lq45Data = marketIndices?.lq45 || [];

    // Create maps for quick lookup
    const jkseMap = new Map(jkseData.map(d => [d.date, d.close]));
    const lq45Map = new Map(lq45Data.map(d => [d.date, d.close]));

    // Get all unique dates from both stock data and indices
    const allDates = Array.from(
      new Set([
        ...stocks.flatMap(stock => stock.historicalData.map(d => d.date)),
        ...jkseData.map(d => d.date),
        ...(lq45Data.length > 0 ? lq45Data.map(d => d.date) : [])
      ])
    ).sort();

    // Calculate portfolio and index performance for each date
    const portfolioData: ChartDataPoint[] = allDates.map(date => {
      // Calculate portfolio value as average performance of all stocks
      // that were active (had call date before this date)
      let portfolioReturns: number[] = [];
      let jkseReturns: number[] = [];
      let lq45Returns: number[] = [];

      stocks.forEach(stock => {
        const stockDataForDate = stock.historicalData.find(d => d.date === date);
        if (stockDataForDate && stock.entryPrice > 0) {
          // Calculate individual stock return from entry price
          const stockReturn = (stockDataForDate.close - stock.entryPrice) / stock.entryPrice;
          portfolioReturns.push(stockReturn);

          // Calculate index returns from this stock's call date
          const callDate = new Date(stock.callDate);

          // Find index value at call date
          let jkseAtCall = jkseData.find(d => new Date(d.date) >= callDate)?.close;
          let jkseAtDate = jkseMap.get(date);

          if (jkseAtCall && jkseAtDate && jkseAtCall > 0) {
            const jkseReturn = (jkseAtDate - jkseAtCall) / jkseAtCall;
            jkseReturns.push(jkseReturn);
          }

          // Calculate LQ45 return (only if data exists)
          if (lq45Data.length > 0) {
            let lq45AtCall = lq45Data.find(d => new Date(d.date) >= callDate)?.close;
            let lq45AtDate = lq45Map.get(date);

            if (lq45AtCall && lq45AtDate && lq45AtCall > 0) {
              const lq45Return = (lq45AtDate - lq45AtCall) / lq45AtCall;
              lq45Returns.push(lq45Return);
            }
          }
        }
      });

      // Calculate averages
      const avgPortfolioReturn = portfolioReturns.length > 0
        ? portfolioReturns.reduce((sum, ret) => sum + ret, 0) / portfolioReturns.length
        : 0;

      const avgJkseReturn = jkseReturns.length > 0
        ? jkseReturns.reduce((sum, ret) => sum + ret, 0) / jkseReturns.length
        : 0;

      const avgLq45Return = lq45Returns.length > 0
        ? lq45Returns.reduce((sum, ret) => sum + ret, 0) / lq45Returns.length
        : 0;

      return {
        date: format(new Date(date), 'MMM dd'),
        portfolio: Number((avgPortfolioReturn * 100).toFixed(2)), // Convert to percentage
        jkse: Number((avgJkseReturn * 100).toFixed(2)),
        lq45: Number((avgLq45Return * 100).toFixed(2)),
        timestamp: new Date(date).getTime()
      };
    });

    return portfolioData;
  }, [stocks, marketIndices]);
};

// Custom tooltip component
const CustomTooltip: React.FC<any> = ({ active, payload, darkMode = false }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className={`p-3 rounded-lg border shadow-xl backdrop-blur-sm ${
        darkMode
          ? 'bg-gray-900/95 border-gray-700 text-white'
          : 'bg-white/95 border-gray-300 text-gray-900'
      }`}>
        <p className={`font-semibold mb-2 text-sm ${
          darkMode ? 'text-white' : 'text-gray-900'
        }`}>
          {data.date}
        </p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-3 mb-1 last:mb-0">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span className={`text-xs font-medium truncate ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {entry.name}
              </span>
            </div>
            <span className={`text-xs font-bold ml-auto flex-shrink-0 ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              {entry.value.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const PerformanceChart: React.FC<PerformanceChartProps> = ({
  stocks,
  marketIndices,
  isLoading = false,
  darkMode = false
}) => {
  const chartData = useNormalizedChartData(stocks, marketIndices);

  const chartColors = {
    portfolio: darkMode ? '#10b981' : '#059669', // emerald-500/emerald-600
    jkse: darkMode ? '#3b82f6' : '#2563eb',   // blue-500/blue-600
    lq45: darkMode ? '#f59e0b' : '#d97706'    // amber-500/amber-600
  };

  const gridColors = {
    stroke: darkMode ? '#374151' : '#e5e7eb',  // gray-600/gray-200
    textFill: darkMode ? '#9ca3af' : '#6b7280'  // gray-400/gray-500
  };

  if (isLoading) {
    return (
      <div className={`w-full h-96 rounded-lg border ${
        darkMode
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-gray-200'
      } flex items-center justify-center`}>
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Loading performance data...
          </p>
        </div>
      </div>
    );
  }

  if (!chartData.length) {
    return (
      <div className={`w-full h-96 rounded-lg border ${
        darkMode
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-gray-200'
      } flex items-center justify-center`}>
        <div className="text-center">
          <svg
            className={`w-16 h-16 mx-auto mb-4 ${
              darkMode ? 'text-gray-600' : 'text-gray-400'
            }`}
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
          <p className={`text-lg font-medium ${
            darkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            No performance data available
          </p>
          <p className={`text-sm mt-2 ${
            darkMode ? 'text-gray-500' : 'text-gray-500'
          }`}>
            Try adding more stocks or checking your data connection
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full rounded-lg border ${
      darkMode
        ? 'bg-gray-800 border-gray-700'
        : 'bg-white border-gray-200'
    } p-6`}>
      <div className="mb-6">
        <h3 className={`text-xl font-bold ${
          darkMode ? 'text-white' : 'text-gray-900'
        }`}>
          Portfolio Performance vs Market Indices
        </h3>
        <p className={`text-sm mt-1 ${
          darkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>
          Performance comparison normalized from each stock's call date (0% = call date)
        </p>
      </div>

      <div className="w-full" style={{ height: '500px', minHeight: '500px' }}>
        <ResponsiveContainer width="100%" height="100%" debounce={1}>
          <LineChart
            data={chartData}
            margin={{
              top: 20,
              right: 80,
              left: 120,
              bottom: 80,
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={gridColors.stroke}
              opacity={0.3}
            />
            <XAxis
              dataKey="date"
              tick={{
                fill: gridColors.textFill,
                fontSize: 11,
                textAnchor: 'end',
              }}
              tickLine={{
                stroke: gridColors.stroke,
              }}
              tickMargin={10}
              interval="preserveStartEnd"
              minTickGap={30}
              angle={-45}
              height={60}
            />
            <YAxis
              tick={{
                fill: gridColors.textFill,
                fontSize: 12,
              }}
              tickLine={{
                stroke: gridColors.stroke,
              }}
              tickMargin={10}
              label={{
                value: 'Performance Since Call Date (%)',
                angle: -90,
                position: 'insideLeft',
                fill: gridColors.textFill,
                fontSize: 13,
                style: { textAnchor: 'middle' },
                offset: -50,
              }}
            />
            <Tooltip content={<CustomTooltip darkMode={darkMode} />} />
            <Legend
              wrapperStyle={{
                paddingTop: '20px',
              }}
              iconType="line"
            />

            <Line
              type="monotone"
              dataKey="portfolio"
              stroke={chartColors.portfolio}
              strokeWidth={3}
              dot={false}
              activeDot={{
                r: 6,
                stroke: chartColors.portfolio,
                strokeWidth: 2,
                fill: darkMode ? '#1f2937' : '#ffffff',
              }}
              name="My Portfolio"
            />

            <Line
              type="monotone"
              dataKey="jkse"
              stroke={chartColors.jkse}
              strokeWidth={2.5}
              dot={false}
              activeDot={{
                r: 5,
                stroke: chartColors.jkse,
                strokeWidth: 2,
                fill: darkMode ? '#1f2937' : '#ffffff',
              }}
              name="JKSE (IHSG)"
            />

            <Line
              type="monotone"
              dataKey="lq45"
              stroke={chartColors.lq45}
              strokeWidth={2.5}
              dot={false}
              activeDot={{
                r: 5,
                stroke: chartColors.lq45,
                strokeWidth: 2,
                fill: darkMode ? '#1f2937' : '#ffffff',
              }}
              name="LQ45"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Performance Summary */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className={`text-center p-3 rounded-lg ${
            darkMode ? 'bg-gray-700' : 'bg-gray-50'
          }`}>
            <div className={`text-sm font-medium ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Portfolio
            </div>
            <div className={`text-lg font-bold mt-1 ${
              chartData.length > 0 && chartData[chartData.length - 1].portfolio >= 0
                ? 'text-green-500'
                : 'text-red-500'
            }`}>
              {chartData.length > 0
                ? `${chartData[chartData.length - 1].portfolio.toFixed(2)}%`
                : '0%'
              }
            </div>
          </div>

          <div className={`text-center p-3 rounded-lg ${
            darkMode ? 'bg-gray-700' : 'bg-gray-50'
          }`}>
            <div className={`text-sm font-medium ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              JKSE (IHSG)
            </div>
            <div className={`text-lg font-bold mt-1 ${
              chartData.length > 0 && chartData[chartData.length - 1].jkse >= 0
                ? 'text-green-500'
                : 'text-red-500'
            }`}>
              {chartData.length > 0
                ? `${chartData[chartData.length - 1].jkse.toFixed(2)}%`
                : '0%'
              }
            </div>
          </div>

          <div className={`text-center p-3 rounded-lg ${
            darkMode ? 'bg-gray-700' : 'bg-gray-50'
          }`}>
            <div className={`text-sm font-medium ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              LQ45
            </div>
            <div className={`text-lg font-bold mt-1 ${
              chartData.length > 0 && chartData[chartData.length - 1].lq45 >= 0
                ? 'text-green-500'
                : 'text-red-500'
            }`}>
              {chartData.length > 0
                ? `${chartData[chartData.length - 1].lq45.toFixed(2)}%`
                : '0%'
              }
            </div>
          </div>

          <div className={`text-center p-3 rounded-lg ${
            darkMode ? 'bg-gray-700' : 'bg-gray-50'
          }`}>
            <div className={`text-sm font-medium ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Alpha (vs JKSE)
            </div>
            <div className={`text-lg font-bold mt-1 ${
              chartData.length > 0 && (chartData[chartData.length - 1].portfolio - chartData[chartData.length - 1].jkse) >= 0
                ? 'text-green-500'
                : 'text-red-500'
            }`}>
              {chartData.length > 0
                ? `${(chartData[chartData.length - 1].portfolio - chartData[chartData.length - 1].jkse).toFixed(2)}%`
                : '0%'
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceChart;