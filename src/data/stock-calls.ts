export interface StockCall {
  id: string;
  ticker: string;
  companyName: string;
  targetPrice: number;
  entryPrice: number;
  currentPrice: number;
  callDate: string;
  analyst: string;
  sector: string;
  recommendation: 'BUY' | 'HOLD' | 'SELL';
  confidence: number; // 1-10 scale
  thesis: string;
  maxGain?: number;
  currentGain?: number;
  daysToMax?: number | null;
}

export interface MarketDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adjClose: number;
}

export interface StockWithMarketData extends StockCall {
  historicalData: MarketDataPoint[];
  maxGain: number;
  currentGain: number;
  daysToMax: number | null;
  jkseReturn?: number;
  lq45Return?: number;
  // Simulation properties
  simulatedInvestment?: number;
  simulatedValue?: number;
  simulatedReturn?: number;
}

export interface SimulationData {
  id: string;
  investmentAmount: number;
  currentValue: number;
  returnPercentage: number;
  unrealizedGain: number;
  returnOnInvestment: number;
  shares?: number;
}

export interface PortfolioSimulation {
  stocks: SimulationData[];
  jkseSimulation: SimulationData;
  lq45Simulation: SimulationData;
  totalInvestment: number;
  totalValue: number;
  totalReturn: number;
  totalReturnPercentage: number;
  alphaVsJkse: number;
  alphaVsLq45: number;
}

export interface MarketIndices {
  jkse: MarketDataPoint[];
  lq45: MarketDataPoint[];
}

// Dummy Indonesian stock data with .JK suffix
export const dummyStockCalls: StockCall[] = [
  {
    id: '1',
    ticker: 'ANJT.JK',
    companyName: 'Austindo Nusantara Jaya',
    targetPrice: 5000,
    entryPrice: 2200,
    currentPrice: 0,
    callDate: '2025-10-01',
    analyst: 'John Doe',
    sector: 'Agro',
    recommendation: 'BUY',
    confidence: 8,
    thesis: 'akuisisi first resource'
  },
  {
    id: '2',
    ticker: 'TEBE.JK',
    companyName: 'PT Dana Brata Luhur Tbk',
    targetPrice: 3400,
    entryPrice: 800,
    currentPrice: 2200,
    callDate: '2025-05-01',
    analyst: 'John Doe',
    sector: 'Conglomerate',
    recommendation: 'BUY',
    confidence: 8,
    thesis: 'akuisisi hj isam'
  },
  {
    id: '3',
    ticker: 'MMLP.JK',
    companyName: 'Mega Manunggal Property',
    targetPrice: 2000,
    entryPrice: 570,
    currentPrice: 0,
    callDate: '2025-11-01',
    analyst: 'John Doe',
    sector: 'Conglomerate',
    recommendation: 'BUY',
    confidence: 8,
    thesis: 'akuisisi astra'
  }
];