import React from 'react';
import { StockWithMarketData } from '@/data/stock-calls';
import { formatPercentage, formatCurrency } from '@/lib/formatters';

interface StatsMatrixProps {
  stocks: StockWithMarketData[];
  isLoading?: boolean;
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
  bgColor?: string;
  textColor?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  trend = 'neutral',
  icon,
  bgColor = 'bg-white',
  textColor = 'text-gray-900'
}) => {
  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        );
      case 'down':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`p-6 rounded-lg border border-gray-200 ${bgColor} transition-all hover:shadow-md`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">{title}</h3>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>
      <div className={`text-2xl font-bold ${textColor} mb-1`}>{value}</div>
      {subtitle && (
        <div className={`flex items-center gap-1 text-sm ${getTrendColor()}`}>
          {getTrendIcon()}
          <span>{subtitle}</span>
        </div>
      )}
    </div>
  );
};

const StatsMatrix: React.FC<StatsMatrixProps> = ({ stocks, isLoading = false }) => {
  const calculateStats = () => {
    if (stocks.length === 0) {
      return {
        totalStocks: 0,
        winningStocks: 0,
        winRate: 0,
        avgGain: 0,
        avgLoss: 0,
        totalPortfolioReturn: 0,
        bestPerformer: null,
        worstPerformer: null,
        totalGainAmount: 0,
        maxGain: 0,
        daysToMaxAvg: 0
      };
    }

    const winningStocks = stocks.filter(stock => stock.currentGain > 0);
    const losingStocks = stocks.filter(stock => stock.currentGain < 0);
    const avgGain = winningStocks.length > 0
      ? winningStocks.reduce((sum, stock) => sum + stock.currentGain, 0) / winningStocks.length
      : 0;
    const avgLoss = losingStocks.length > 0
      ? losingStocks.reduce((sum, stock) => sum + stock.currentGain, 0) / losingStocks.length
      : 0;

    // Calculate portfolio return assuming equal weight
    const totalPortfolioReturn = stocks.reduce((sum, stock) => sum + stock.currentGain, 0) / stocks.length;

    const bestPerformer = stocks.reduce((best, current) =>
      current.currentGain > (best?.currentGain || -Infinity) ? current : best,
      null as StockWithMarketData | null
    );

    const worstPerformer = stocks.reduce((worst, current) =>
      current.currentGain < (worst?.currentGain || Infinity) ? current : worst,
      null as StockWithMarketData | null
    );

    const maxGain = Math.max(...stocks.map(stock => stock.maxGain));

    const daysToMaxValid = stocks.filter(stock => stock.daysToMax !== null);
    const daysToMaxAvg = daysToMaxValid.length > 0
      ? daysToMaxValid.reduce((sum, stock) => sum + (stock.daysToMax || 0), 0) / daysToMaxValid.length
      : 0;

    // Calculate total monetary gain/loss (assuming equal investment of IDR 1M per stock)
    const investmentPerStock = 1000000; // 1M IDR
    const totalGainAmount = stocks.reduce((sum, stock) => {
      const stockGain = (stock.currentGain / 100) * investmentPerStock;
      return sum + stockGain;
    }, 0);

    return {
      totalStocks: stocks.length,
      winningStocks: winningStocks.length,
      winRate: (winningStocks.length / stocks.length) * 100,
      avgGain,
      avgLoss,
      totalPortfolioReturn,
      bestPerformer,
      worstPerformer,
      totalGainAmount,
      maxGain,
      daysToMaxAvg: Math.round(daysToMaxAvg)
    };
  };

  const stats = calculateStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="p-6 rounded-lg border border-gray-200">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
              <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Primary Stats - Top Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Win Rate"
          value={`${formatPercentage(stats.winRate)}`}
          subtitle={`${stats.winningStocks} of ${stats.totalStocks} stocks profitable`}
          trend={stats.winRate >= 50 ? 'up' : 'down'}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          bgColor={stats.winRate >= 50 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}
          textColor={stats.winRate >= 50 ? 'text-green-900' : 'text-red-900'}
        />

        <StatCard
          title="Portfolio Growth"
          value={formatPercentage(stats.totalPortfolioReturn)}
          subtitle={`Total: ${formatCurrency(stats.totalGainAmount)}`}
          trend={stats.totalPortfolioReturn > 0 ? 'up' : stats.totalPortfolioReturn < 0 ? 'down' : 'neutral'}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          bgColor={stats.totalPortfolioReturn > 0 ? 'bg-blue-50 border-blue-200' : stats.totalPortfolioReturn < 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}
        />

        <StatCard
          title="Average Gain"
          value={formatPercentage(stats.avgGain)}
          subtitle={`Winning stocks only`}
          trend={stats.avgGain > 0 ? 'up' : 'neutral'}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
          bgColor="bg-purple-50 border-purple-200"
        />

        <StatCard
          title="Max Gain Achieved"
          value={formatPercentage(stats.maxGain)}
          subtitle={`Best possible return`}
          trend="up"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
          bgColor="bg-emerald-50 border-emerald-200"
        />
      </div>

      {/* Secondary Stats - Bottom Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Best Performer"
          value={stats.bestPerformer ? stats.bestPerformer.ticker : '-'}
          subtitle={stats.bestPerformer ? formatPercentage(stats.bestPerformer.currentGain) : 'No data'}
          trend="up"
          bgColor="bg-green-50 border-green-200"
        />

        <StatCard
          title="Worst Performer"
          value={stats.worstPerformer ? stats.worstPerformer.ticker : '-'}
          subtitle={stats.worstPerformer ? formatPercentage(stats.worstPerformer.currentGain) : 'No data'}
          trend="down"
          bgColor="bg-red-50 border-red-200"
        />

        <StatCard
          title="Average Days to Max"
          value={stats.daysToMaxAvg}
          subtitle="Time to peak performance"
          trend="neutral"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          bgColor="bg-orange-50 border-orange-200"
        />

        <StatCard
          title="Total Stocks"
          value={stats.totalStocks}
          subtitle={`${stats.winningStocks} winners, ${stats.totalStocks - stats.winningStocks} losers`}
          trend="neutral"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          }
          bgColor="bg-gray-50 border-gray-200"
        />
      </div>

      {/* Performance Summary Bar */}
      {stats.totalStocks > 0 && (
        <div className="p-4 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">Performance Distribution</h3>
            <span className="text-xs text-gray-500">{stats.totalStocks} stocks tracked</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden flex">
            <div
              className="bg-green-500 h-full flex items-center justify-center text-xs text-white font-medium transition-all duration-500"
              style={{ width: `${stats.winRate}%` }}
            >
              {stats.winRate >= 10 && `${formatPercentage(stats.winRate)}`}
            </div>
            <div
              className="bg-red-500 h-full flex items-center justify-center text-xs text-white font-medium"
              style={{ width: `${100 - stats.winRate}%` }}
            >
              {100 - stats.winRate >= 10 && `${formatPercentage(100 - stats.winRate)}`}
            </div>
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-600">
            <span>Winning: {stats.winningStocks}</span>
            <span>Losing: {stats.totalStocks - stats.winningStocks}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsMatrix;