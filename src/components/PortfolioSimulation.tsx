import React, { useMemo, useState } from 'react';
import { StockWithMarketData, MarketIndices, PortfolioSimulation as PortfolioSimulationType, SimulationData } from '@/data/stock-calls';
import { format } from 'date-fns';

interface PortfolioSimulationProps {
  stocks: StockWithMarketData[];
  marketIndices: MarketIndices | undefined;
  isLoading?: boolean;
}

const DEFAULT_INVESTMENT_PER_STOCK = 10000000; // Rp 10,000,000

const PortfolioSimulation: React.FC<PortfolioSimulationProps> = ({
  stocks,
  marketIndices,
  isLoading = false
}) => {
  const [simulationEnabled, setSimulationEnabled] = useState(false);
  const [customInvestment, setCustomInvestment] = useState<number | null>(null);

  const simulation = useMemo(() => {
    if (!simulationEnabled || stocks.length === 0) return null;

    const investmentPerStock = customInvestment || DEFAULT_INVESTMENT_PER_STOCK;
    const totalInvestment = investmentPerStock * stocks.length;

    // Calculate stock simulations
    const stockSimulations: SimulationData[] = stocks.map(stock => {
      const shares = investmentPerStock / stock.entryPrice;
      const currentValue = shares * stock.currentPrice;
      const unrealizedGain = currentValue - investmentPerStock;
      const returnPercentage = (unrealizedGain / investmentPerStock) * 100;

      return {
        id: stock.id,
        investmentAmount: investmentPerStock,
        currentValue,
        returnPercentage,
        unrealizedGain,
        returnOnInvestment: currentValue
      };
    });

    // Calculate JKSE simulation (index investment)
    let jkseSimulation: SimulationData | null = null;
    if (marketIndices?.jkse && marketIndices.jkse.length > 0) {
      const jkseShares = totalInvestment / marketIndices.jkse[0].close;
      const jkseCurrentValue = jkseShares * marketIndices.jkse[marketIndices.jkse.length - 1].close;
      const jkseUnrealizedGain = jkseCurrentValue - totalInvestment;
      const jkseReturnPercentage = (jkseUnrealizedGain / totalInvestment) * 100;

      jkseSimulation = {
        id: 'jkse',
        investmentAmount: totalInvestment,
        currentValue: jkseCurrentValue,
        returnPercentage: jkseReturnPercentage,
        unrealizedGain: jkseUnrealizedGain,
        returnOnInvestment: jkseCurrentValue
      };
    }

    // Calculate LQ45 simulation (index investment)
    let lq45Simulation: SimulationData | null = null;
    if (marketIndices?.lq45 && marketIndices.lq45.length > 0) {
      const lq45Shares = totalInvestment / marketIndices.lq45[0].close;
      const lq45CurrentValue = lq45Shares * marketIndices.lq45[marketIndices.lq45.length - 1].close;
      const lq45UnrealizedGain = lq45CurrentValue - totalInvestment;
      const lq45ReturnPercentage = (lq45UnrealizedGain / totalInvestment) * 100;

      lq45Simulation = {
        id: 'lq45',
        investmentAmount: totalInvestment,
        currentValue: lq45CurrentValue,
        returnPercentage: lq45ReturnPercentage,
        unrealizedGain: lq45UnrealizedGain,
        returnOnInvestment: lq45CurrentValue
      };
    }

    // Calculate total portfolio value and returns
    const totalStockValue = stockSimulations.reduce((sum, stock) => sum + stock.currentValue, 0);
    const totalValue = totalStockValue;
    const totalReturn = totalValue - totalInvestment;
    const totalReturnPercentage = (totalReturn / totalInvestment) * 100;

    // Calculate alpha vs indices
    const alphaVsJkse = jkseSimulation
      ? totalReturnPercentage - jkseSimulation.returnPercentage
      : 0;

    const alphaVsLq45 = lq45Simulation
      ? totalReturnPercentage - lq45Simulation.returnPercentage
      : 0;

    return {
      stocks: stockSimulations,
      jkseSimulation,
      lq45Simulation,
      totalInvestment,
      totalValue,
      totalReturn,
      totalReturnPercentage,
      alphaVsJkse,
      alphaVsLq45
    };
  }, [stocks, marketIndices, simulationEnabled, customInvestment]);

  const formatCurrency = (value: number) => {
    return `Rp ${value.toLocaleString('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })}`;
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const getReturnColor = (value: number) => {
    if (value > 0) return 'text-green-600 dark:text-green-400';
    if (value < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-300';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>
        <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Simulation Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Portfolio Simulation
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Virtual portfolio performance tracking
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setSimulationEnabled(!simulationEnabled)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  simulationEnabled
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {simulationEnabled ? 'Simulation Active' : 'Enable Simulation'}
              </button>
              {simulationEnabled && (
                <button
                  onClick={() => setCustomInvestment(null)}
                  className="px-4 py-2 rounded-lg font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                >
                  Reset Investment
                </button>
              )}
            </div>
          </div>

          {simulationEnabled && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Investment per Stock:
                </label>
                <div className="relative">
                  <span className="text-sm text-gray-500">
                    {formatCurrency(customInvestment || DEFAULT_INVESTMENT_PER_STOCK)}
                  </span>
                  <input
                    type="range"
                    min={1000000}
                    max={50000000}
                    step={1000000}
                    value={customInvestment || DEFAULT_INVESTMENT_PER_STOCK}
                    onChange={(e) => setCustomInvestment(Number(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Simulation Results */}
      {simulation && (
        <>
          {/* Portfolio Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="p-6">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Portfolio Summary
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                    Total Investment
                  </div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {formatCurrency(simulation.totalInvestment)}
                  </div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                    Current Value
                  </div>
                  <div className={`text-lg font-bold ${getReturnColor(simulation.totalReturnPercentage)}`}>
                    {formatCurrency(simulation.totalValue)}
                  </div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                    Total Return
                  </div>
                  <div className={`text-lg font-bold ${getReturnColor(simulation.totalReturnPercentage)}`}>
                    {formatCurrency(simulation.totalReturn)}
                  </div>
                  <div className={`text-sm ${getReturnColor(simulation.totalReturnPercentage)}`}>
                    {formatPercentage(simulation.totalReturnPercentage)}
                  </div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                    Return %
                  </div>
                  <div className={`text-lg font-bold ${getReturnColor(simulation.totalReturnPercentage)}`}>
                    {formatPercentage(simulation.totalReturnPercentage)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stock Simulations */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="p-6">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Individual Stock Performance
              </h4>
              <div className="space-y-3">
                {simulation.stocks.map((stock) => (
                  <div
                    key={stock.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {stocks.find(s => s.id === stock.id)?.ticker}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          ({stocks.find(s => s.id === stock.id)?.companyName})
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-300">
                        {stock.shares ? `${stock.shares.toFixed(0)} shares` : ''}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-right">
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Investment
                        </div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {formatCurrency(stock.investmentAmount)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Current Value
                        </div>
                        <div className={`font-medium ${getReturnColor(stock.returnPercentage)}`}>
                          {formatCurrency(stock.currentValue)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Return
                        </div>
                        <div className={`font-bold ${getReturnColor(stock.returnPercentage)}`}>
                          {formatPercentage(stock.returnPercentage)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Index Comparison */}
          {(simulation.jkseSimulation || simulation.lq45Simulation) && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="p-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Index Comparison
                </h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {simulation.jkseSimulation && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="text-center">
                        <div className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                          JKSE (IHSG) Simulation
                        </div>
                        <div className="space-y-1">
                          <div>
                            <span className="text-xs text-blue-700 dark:text-blue-300">Investment:</span>
                            <span className="ml-2 font-medium text-blue-900 dark:text-blue-100">
                              {formatCurrency(simulation.jkseSimulation.investmentAmount)}
                            </span>
                          </div>
                          <div>
                            <span className="text-xs text-blue-700 dark:text-blue-300">Current:</span>
                            <span className="ml-2 font-medium text-blue-900 dark:text-blue-100">
                              {formatCurrency(simulation.jkseSimulation.currentValue)}
                            </span>
                          </div>
                          <div>
                            <span className="text-xs text-blue-700 dark:text-blue-300">Return:</span>
                            <span className={`ml-2 font-bold ${getReturnColor(simulation.jkseSimulation.returnPercentage)}`}>
                              {formatPercentage(simulation.jkseSimulation.returnPercentage)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {simulation.lq45Simulation && (
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                      <div className="text-center">
                        <div className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-2">
                          LQ45 Simulation
                        </div>
                        <div className="space-y-1">
                          <div>
                            <span className="text-xs text-amber-700 dark:text-amber-300">Investment:</span>
                            <span className="ml-2 font-medium text-amber-900 dark:text-amber-100">
                              {formatCurrency(simulation.lq45Simulation.investmentAmount)}
                            </span>
                          </div>
                          <div>
                            <span className="text-xs text-amber-700 dark:text-amber-300">Current:</span>
                            <span className="ml-2 font-medium text-amber-900 dark:text-amber-100">
                              {formatCurrency(simulation.lq45Simulation.currentValue)}
                            </span>
                          </div>
                          <div>
                            <span className="text-xs text-amber-700 dark:text-amber-300">Return:</span>
                            <span className={`ml-2 font-bold ${getReturnColor(simulation.lq45Simulation.returnPercentage)}`}>
                              {formatPercentage(simulation.lq45Simulation.returnPercentage)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Alpha Analysis */}
                <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 rounded-lg">
                  <div className="text-center">
                    <div className="text-sm font-medium text-purple-900 dark:text-purple-100 mb-3">
                      Alpha Analysis (Portfolio vs Indices)
                    </div>
                    <div className="space-y-2">
                      {simulation.jkseSimulation && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-purple-700 dark:text-purple-300">
                            Alpha vs JKSE:
                          </span>
                          <span className={`font-bold ${getReturnColor(simulation.alphaVsJkse)}`}>
                            {formatPercentage(simulation.alphaVsJkse)}
                          </span>
                        </div>
                      )}
                      {simulation.lq45Simulation && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-purple-700 dark:text-purple-300">
                            Alpha vs LQ45:
                          </span>
                          <span className={`font-bold ${getReturnColor(simulation.alphaVsLq45)}`}>
                            {formatPercentage(simulation.alphaVsLq45)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-purple-600 dark:text-purple-400 mt-2">
                      *Alpha shows outperformance relative to market indices
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PortfolioSimulation;