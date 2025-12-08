import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { StockWithMarketData, MarketIndices, MarketDataPoint } from '@/data/stock-calls';
import { format } from 'date-fns';

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface SimulationDataPoint {
  date: string;
  portfolioValue: number;
  jkseValue: number;
  lq45Value: number;
  timestamp: number;
}

interface PerformanceSimulationProps {
  stocks: StockWithMarketData[];
  marketIndices?: MarketIndices;
  isLoading?: boolean;
  darkMode?: boolean;
}

const ALLOCATION_PER_STOCK = 10000000; // 10 million IDR per stock

// Custom hook to calculate portfolio simulation
const usePortfolioSimulation = (
  stocks: StockWithMarketData[],
  marketIndices?: MarketIndices
): SimulationDataPoint[] => {
  return useMemo(() => {
    if (!stocks.length || !marketIndices) {
      return [];
    }

    // Get index data with proper error handling
    const jkseData = marketIndices?.jkse || [];
    const lq45Data = marketIndices?.lq45 || [];

    // Create maps for quick lookup
    const jkseMap = new Map(jkseData.map(d => [d.date, d.close]));
    const lq45Map = new Map(lq45Data.map(d => [d.date, d.close]));

    // Get all unique dates from stock data and indices
    const allDates = Array.from(
      new Set([
        ...stocks.flatMap(stock => stock.historicalData.map(d => d.date)),
        ...jkseData.map(d => d.date),
        ...(lq45Data.length > 0 ? lq45Data.map(d => d.date) : [])
      ])
    ).sort();

    // Calculate portfolio and index values for each date
    const simulationData: SimulationDataPoint[] = allDates.map(date => {
      let portfolioTotalValue = 0;
      let jkseReturnValue = 0;
      let lq45ReturnValue = 0;

      // Calculate portfolio value as sum of all stock allocations + returns
      stocks.forEach(stock => {
        const stockDataForDate = stock.historicalData.find(d => d.date === date);
        if (stockDataForDate && stock.entryPrice > 0) {
          // Calculate individual stock return from entry price
          const stockReturn = (stockDataForDate.close - stock.entryPrice) / stock.entryPrice;
          const stockValue = ALLOCATION_PER_STOCK * (1 + stockReturn);
          portfolioTotalValue += stockValue;

          // Calculate index returns from this stock's call date
          const callDate = new Date(stock.callDate);

          // Find index value at call date
          let jkseAtCall = jkseData.find(d => new Date(d.date) >= callDate)?.close;
          let jkseAtDate = jkseMap.get(date);

          if (jkseAtCall && jkseAtDate && jkseAtCall > 0) {
            const jkseReturn = (jkseAtDate - jkseAtCall) / jkseAtCall;
            jkseReturnValue += jkseReturn;
          }

          // Calculate LQ45 return (only if data exists)
          if (lq45Data.length > 0) {
            let lq45AtCall = lq45Data.find(d => new Date(d.date) >= callDate)?.close;
            let lq45AtDate = lq45Map.get(date);

            if (lq45AtCall && lq45AtDate && lq45AtCall > 0) {
              const lq45Return = (lq45AtDate - lq45AtCall) / lq45AtCall;
              lq45ReturnValue += lq45Return;
            }
          }
        } else {
          // If no stock data for this date, still count the original allocation
          portfolioTotalValue += ALLOCATION_PER_STOCK;
        }
      });

      // Calculate average index returns across all stocks
      const avgJkseReturn = stocks.length > 0 ? jkseReturnValue / stocks.length : 0;
      const avgLq45Return = stocks.length > 0 ? lq45ReturnValue / stocks.length : 0;

      // Calculate index values based on total allocation
      const totalAllocation = stocks.length * ALLOCATION_PER_STOCK;
      const jkseValue = totalAllocation * (1 + avgJkseReturn);
      const lq45Value = totalAllocation * (1 + avgLq45Return);

      return {
        date: format(new Date(date), 'MMM dd'),
        portfolioValue: Number(portfolioTotalValue.toFixed(0)),
        jkseValue: Number(jkseValue.toFixed(0)),
        lq45Value: Number(lq45Value.toFixed(0)),
        timestamp: new Date(date).getTime()
      };
    });

    return simulationData;
  }, [stocks, marketIndices]);
};

const PerformanceSimulation: React.FC<PerformanceSimulationProps> = ({
  stocks,
  marketIndices,
  isLoading = false,
  darkMode = false
}) => {
  const simulationData = usePortfolioSimulation(stocks, marketIndices);

  const chartColors = {
    portfolio: darkMode ? '#10b981' : '#059669', // emerald-500/emerald-600
    jkse: darkMode ? '#3b82f6' : '#2563eb',   // blue-500/blue-600
    lq45: darkMode ? '#f59e0b' : '#d97706'    // amber-500/amber-600
  };

  const totalAllocation = stocks.length * ALLOCATION_PER_STOCK;

  // Chart configuration
  const chartOptions = {
    chart: {
      height: 400,
      type: 'line' as const,
      zoom: {
        enabled: true
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
      curve: 'smooth' as const,
      width: 3
    },
    title: {
      text: `Portfolio Simulation (Rp.${(totalAllocation / 1000000).toFixed(0)}M Total Investment)`,
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
      categories: simulationData.map(item => item.date),
      labels: {
        style: {
          colors: darkMode ? '#9ca3af' : '#6b7280',
          fontSize: '12px'
        }
      }
    },
    yaxis: {
      labels: {
        formatter: (value: number) => `Rp.${(value / 1000000).toFixed(1)}M`,
        style: {
          colors: darkMode ? '#9ca3af' : '#6b7280'
        }
      },
      title: {
        text: 'Portfolio Value (IDR Millions)',
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
        formatter: (value: number) => `Rp.${(value / 1000000).toFixed(2)}M`
      }
    },
    colors: [chartColors.portfolio, chartColors.jkse, chartColors.lq45]
  };

  if (isLoading) {
    return (
      <div className={`w-full h-96 rounded-lg border ${darkMode
        ? 'bg-gray-800 border-gray-700'
        : 'bg-white border-gray-200'
        } flex items-center justify-center`}>
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Loading simulation data...
          </p>
        </div>
      </div>
    );
  }

  if (!simulationData.length) {
    return (
      <div className={`w-full h-96 rounded-lg border ${darkMode
        ? 'bg-gray-800 border-gray-700'
        : 'bg-white border-gray-200'
        } flex items-center justify-center`}>
        <div className="text-center">
          <svg
            className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'
              }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className={`text-lg font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
            No simulation data available
          </p>
          <p className={`text-sm mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'
            }`}>
            Add stocks to see portfolio simulation
          </p>
        </div>
      </div>
    );
  }

  // Get latest values for summary
  const latestData = simulationData[simulationData.length - 1];
  const portfolioReturn = ((latestData.portfolioValue - totalAllocation) / totalAllocation) * 100;
  const jkseReturn = ((latestData.jkseValue - totalAllocation) / totalAllocation) * 100;
  const lq45Return = ((latestData.lq45Value - totalAllocation) / totalAllocation) * 100;

  return (
    <div className={`w-full rounded-lg border ${darkMode
      ? 'bg-gray-800 border-gray-700'
      : 'bg-white border-gray-200'
      } p-6`}>
      <div className="mb-6">
        <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'
          }`}>
          Portfolio Performance Simulation
        </h3>
        <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
          Hypothetical investment of Rp.{(ALLOCATION_PER_STOCK / 1000000).toFixed(0)}M per stock with dynamic index comparison
        </p>
      </div>

      <div className="w-full mb-6">
        {typeof window !== 'undefined' && simulationData.length > 0 && (
          <ReactApexChart
            options={chartOptions}
            series={[
              {
                name: 'My Portfolio',
                data: simulationData.map(item => item.portfolioValue)
              },
              {
                name: 'JKSE Index',
                data: simulationData.map(item => item.jkseValue)
              },
              {
                name: 'LQ45 Index',
                data: simulationData.map(item => item.lq45Value)
              }
            ]}
            type="line"
            height={400}
          />
        )}
      </div>

      {/* Simulation Summary */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className={`text-center p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'
            }`}>
            <div className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
              Portfolio Value
            </div>
            <div className={`text-lg font-bold mt-1 ${portfolioReturn >= 0 ? 'text-green-500' : 'text-red-500'
              }`}>
              Rp.{(latestData.portfolioValue / 1000000).toFixed(2)}M
            </div>
            <div className={`text-xs mt-1 ${portfolioReturn >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
              {portfolioReturn >= 0 ? '+' : ''}{portfolioReturn.toFixed(1)}%
            </div>
          </div>

          <div className={`text-center p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'
            }`}>
            <div className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
              JKSE Index
            </div>
            <div className={`text-lg font-bold mt-1 ${jkseReturn >= 0 ? 'text-green-500' : 'text-red-500'
              }`}>
              Rp.{(latestData.jkseValue / 1000000).toFixed(2)}M
            </div>
            <div className={`text-xs mt-1 ${jkseReturn >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
              {jkseReturn >= 0 ? '+' : ''}{jkseReturn.toFixed(1)}%
            </div>
          </div>

          <div className={`text-center p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'
            }`}>
            <div className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
              LQ45 Index
            </div>
            <div className={`text-lg font-bold mt-1 ${lq45Return >= 0 ? 'text-green-500' : 'text-red-500'
              }`}>
              Rp.{(latestData.lq45Value / 1000000).toFixed(2)}M
            </div>
            <div className={`text-xs mt-1 ${lq45Return >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
              {lq45Return >= 0 ? '+' : ''}{lq45Return.toFixed(1)}%
            </div>
          </div>

          <div className={`text-center p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'
            }`}>
            <div className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
              Alpha (vs JKSE)
            </div>
            <div className={`text-lg font-bold mt-1 ${(portfolioReturn - jkseReturn) >= 0 ? 'text-green-500' : 'text-red-500'
              }`}>
              {(portfolioReturn - jkseReturn) >= 0 ? '+' : ''}{(portfolioReturn - jkseReturn).toFixed(1)}%
            </div>
          </div>
        </div>

        <div className={`mt-4 p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'
          }`}>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            <strong>Simulation Details:</strong> Each stock allocated Rp.{(ALLOCATION_PER_STOCK / 1000000).toFixed(0)}M
            • Total investment: Rp.{(totalAllocation / 1000000).toFixed(0)}M
            • {stocks.length} stock{stocks.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceSimulation;