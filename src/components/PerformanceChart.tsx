import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { StockWithMarketData, MarketDataPoint, MarketIndices } from '@/data/stock-calls';
import { format } from 'date-fns';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

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

// Simple annotations for zero line only
const generateSimpleAnnotations = (darkMode: boolean = false) => {
  return {
    position: 'back',
    yaxis: [
      {
        y: 0,
        strokeDashArray: 5,
        borderColor: darkMode ? '#4b5563' : '#9ca3af',
        opacity: 0.5,
        width: 1,
      }
    ]
  };
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

  // Chart configuration using the simpler style from page.tsx
  const chartOptions = {
    chart: {
      height: 350,
      type: 'line' as const,
      zoom: {
        enabled: false
      },
      background: 'transparent',
      toolbar: {
        show: true,
        tools: {
          download: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true
        }
      },
      animations: {
        enabled: true,
        easing: 'easeinout' as const,
        speed: 800
      }
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'straight' as const,
      width: 2
    },
    title: {
      text: 'Portfolio Performance vs Market Indices',
      align: 'left' as const,
      style: {
        color: darkMode ? '#ffffff' : '#000000',
        fontSize: '16px',
        fontWeight: 'bold'
      }
    },
    grid: {
      row: {
        colors: darkMode ? ['#374151', 'transparent'] : ['#f3f3f3', 'transparent'],
        opacity: 0.5
      },
      borderColor: darkMode ? '#374151' : '#e5e7eb',
      strokeDashArray: 3,
      opacity: 0.3
    },
    xaxis: {
      categories: chartData.map(item => item.date),
      labels: {
        style: {
          colors: darkMode ? '#9ca3af' : '#6b7280',
          fontSize: '12px'
        }
      }
    },
    yaxis: {
      labels: {
        formatter: (value: number) => `${value.toFixed(1)}%`,
        style: {
          colors: darkMode ? '#9ca3af' : '#6b7280'
        }
      },
      title: {
        text: 'Performance (%)',
        style: {
          color: darkMode ? '#9ca3af' : '#6b7280'
        }
      }
    },
    legend: {
      show: true,
      position: 'top' as const,
      labels: {
        colors: darkMode ? '#9ca3af' : '#6b7280'
      }
    },
    tooltip: {
      theme: darkMode ? 'dark' : 'light',
      y: {
        formatter: (value: number) => `${value.toFixed(2)}%`
      }
    },
    series: [
      {
        name: 'My Portfolio',
        data: chartData.map(item => item.portfolio)
      },
      {
        name: 'JKSE (IHSG)',
        data: chartData.map(item => item.jkse)
      },
      {
        name: 'LQ45',
        data: chartData.map(item => item.lq45)
      }
    ],
    colors: [chartColors.portfolio, chartColors.jkse, chartColors.lq45],
    annotations: generateSimpleAnnotations(darkMode)
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
      <div className="mb-4">
        <p className={`text-sm ${
          darkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>
          Performance comparison normalized from each stock's call date (0% = call date)
        </p>
      </div>

      <div className="w-full">
        {typeof window !== 'undefined' && chartData.length > 0 && (
          <ReactApexChart
            options={chartOptions}
            series={chartOptions.series}
            type="line"
            height={350}
          />
        )}
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