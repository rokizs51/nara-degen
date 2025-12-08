'use client';

import React, { useState, useEffect } from 'react';
import { StockTable, StatsMatrix, PerformanceSimulation } from '@/components';
import { StockWithMarketData, MarketIndices } from '@/data/stock-calls';

interface ClientDashboardProps {
  initialStocks: StockWithMarketData[];
  initialMarketIndices: MarketIndices | undefined;
  error: string | null;
}

const ClientDashboard: React.FC<ClientDashboardProps> = ({
  initialStocks,
  initialMarketIndices,
  error
}) => {
  const [stocks, setStocks] = useState<StockWithMarketData[]>(initialStocks);
  const [marketIndices, setMarketIndices] = useState<MarketIndices | undefined>(initialMarketIndices);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Dark mode detection for mobile compatibility
  const [darkMode, setDarkMode] = useState(false);

  // Check for system dark mode preference and device capabilities
  useEffect(() => {
    const checkDarkMode = () => {
      // Check if device supports prefers-color-scheme
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return true;
      }

      // Check if body has dark class (fallback)
      return document.body.classList.contains('dark');
    };

    setDarkMode(checkDarkMode());

    // Listen for system dark mode changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setDarkMode(e.matches);
    };

    if (mediaQuery) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  // Fetch real data on mount
  useEffect(() => {
    refreshData();
  }, []);

  // Auto-refresh every 5 minutes during market hours
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const hour = now.getHours();
      const day = now.getDay();

      // Only refresh on weekdays during market hours (9:00 - 16:00 WIB)
      if (day >= 1 && day <= 5 && hour >= 9 && hour < 16) {
        refreshData();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const endpoint = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
      const response = await fetch(endpoint + '/market-data');
      if (!response.ok) throw new Error('Failed to fetch');

      const data = await response.json();
      setStocks(data.stocks);
      setMarketIndices(data.marketIndices);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to refresh data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatLastUpdated = () => {
    return lastUpdated.toLocaleString('id-ID', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Header */}
      <div className="border-b border-gray-100 dark:border-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-light text-gray-900 dark:text-white tracking-tight">
                Nara Degen
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1 sm:mt-2 text-xs sm:text-sm">
                Market Performance Tracking
              </p>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-xs text-gray-400 dark:text-gray-500">
                Last updated
              </div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 font-medium">
                {formatLastUpdated()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Key Metrics Row */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8 mb-8">
          <div className="xl:col-span-2">
            <PerformanceSimulation stocks={stocks} marketIndices={marketIndices} isLoading={isLoading} darkMode={darkMode} />
          </div>
          <div className="space-y-4 lg:space-y-6">
            <div>
              <div className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">
                Portfolio Overview
              </div>
              <div className="space-y-6">
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-900">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Total Positions</span>
                  <span className="text-lg font-light text-gray-900 dark:text-white">{stocks.length}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-900">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Winning Stocks</span>
                  <span className="text-lg font-light text-green-600 dark:text-green-400">
                    {stocks.filter(s => s.currentGain > 0).length}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-900">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Win Rate</span>
                  <span className="text-lg font-light text-gray-900 dark:text-white">
                    {stocks.length > 0 ? ((stocks.filter(s => s.currentGain > 0).length / stocks.length) * 100).toFixed(0) : 0}%
                  </span>
                </div>
              </div>
            </div>

            <div>
              <div className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">
                Performance
              </div>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Total Return</span>
                    <span className={`text-xl font-light ${stocks.length > 0 && (stocks.reduce((sum, s) => sum + s.currentGain, 0) / stocks.length) >= 0
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                      }`}>
                      {stocks.length > 0
                        ? ((stocks.reduce((sum, s) => sum + s.currentGain, 0) / stocks.length).toFixed(1))
                        : '0.0'
                      }%
                    </span>
                  </div>
                  <div className="h-px bg-gray-200 dark:bg-gray-800 rounded-full">
                    <div
                      className={`h-px rounded-full transition-all duration-700 ${stocks.length > 0 && (stocks.reduce((sum, s) => sum + s.currentGain, 0) / stocks.length) >= 0
                        ? 'bg-green-500'
                        : 'bg-red-500'
                        }`}
                      style={{
                        width: `${Math.min(Math.max((stocks.reduce((sum, s) => sum + s.currentGain, 0) / stocks.length + 20) * 2, 0), 100)}%`
                      }}
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Best Performer</span>
                  <span className="text-lg font-light text-gray-900 dark:text-white">
                    {stocks.length > 0 ? stocks.reduce((best, current) =>
                      current.currentGain > best.currentGain ? current : best
                    ).ticker : '-'}
                  </span>
                </div>
              </div>
            </div>

            <div className="relative group">
              <img
                src="/shm.jpg"
                alt="Portfolio Management Mood"
                className="w-full h-auto max-h-[200px] sm:max-h-[240px] lg:max-h-[280px] rounded-lg opacity-90 group-hover:opacity-100 transition-opacity duration-300 object-cover"
              />
              <div className="absolute inset-0 rounded-lg bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          </div>
        </div>

        {/* Stats Matrix */}
        <div className="mb-12">
          <StatsMatrix stocks={stocks} isLoading={isLoading} />
        </div>


        {/* Stock Table */}
        <div>
          <div className="mb-8">
            <h2 className="text-2xl font-light text-gray-900 dark:text-white tracking-tight">
              Stock Performance
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Individual stock analysis and performance metrics
            </p>
          </div>
          <div>
            <StockTable stocks={stocks} isLoading={isLoading} darkMode={darkMode} />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-gray-100 dark:border-gray-900">
          <div className="text-center text-xs text-gray-400 dark:text-gray-500 space-y-2">
            <div className="flex items-center justify-center gap-4">
              <span>Data: Yahoo Finance</span>
              <span>•</span>
              <span>JKSE: Jakarta Composite</span>
              <span>•</span>
              <span>LQ45: Liquid 45</span>
            </div>
            <div>
              Market hours: 09:00 - 16:00 WIB
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
