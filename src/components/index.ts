// Main components export
export { default as StockTable } from './StockTable';
export { default as StatsMatrix } from './StatsMatrix';
export { default as PerformanceChart } from './PerformanceChart';
export { default as PerformanceSimulation } from './PerformanceSimulation';
export { default as ClientDashboard } from './ClientDashboard';
export { DashboardSkeleton } from './DashboardSkeleton';

// Re-export types for convenience
export type { StockCall, StockWithMarketData, MarketDataPoint } from '@/data/stock-calls';