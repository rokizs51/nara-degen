// Real-time market data fetching using yahoo-finance2
// Using dynamic import to avoid build-time issues

import { StockCall, MarketDataPoint, StockWithMarketData, MarketIndices } from '@/data/stock-calls';
import { dummyStockCalls } from '@/data/stock-calls';

// Helper to map Yahoo Finance result to our MarketDataPoint
function mapHistoricalData(result: any[]): MarketDataPoint[] {
  return result.map((item: any) => ({
    date: item.date.toISOString().split('T')[0], // YYYY-MM-DD
    open: item.open,
    high: item.high,
    low: item.low,
    close: item.close,
    volume: item.volume,
    adjClose: item.adjClose || item.close,
  }));
}

export async function fetchHistoricalData(
  ticker: string,
  period: { start: Date; end: Date }
): Promise<MarketDataPoint[]> {
  try {
    const { default: YahooFinance } = await import('yahoo-finance2');
    const yahooFinance = new YahooFinance({
      suppressNotices: ['yahooSurvey', 'ripHistorical']
    });
    const queryOptions = {
      period1: period.start,
      period2: period.end,
      interval: '1d' as const,
    };
    // Use chart() instead of deprecated historical()
    const result = await yahooFinance.chart(ticker, queryOptions);
    return mapHistoricalData(result.quotes || result);
  } catch (error) {
    console.error(`Error fetching historical data for ${ticker}:`, error);
    return [];
  }
}

export async function fetchMarketIndices(
  period: { start: Date; end: Date }
): Promise<MarketIndices> {
  try {
    const [jkseData, lq45Data] = await Promise.allSettled([
      fetchHistoricalData('^JKSE', period),
      fetchHistoricalData('LQ45.JK', period),
    ]);

    // Log results for debugging
    console.log('Market indices fetch results:', {
      jkse: jkseData.status === 'fulfilled' ? `Success (${jkseData.value.length} records)` : `Failed: ${jkseData.reason}`,
      lq45: lq45Data.status === 'fulfilled' ? `Success (${lq45Data.value.length} records)` : `Failed: ${lq45Data.reason}`
    });

    // Try alternative LQ45 symbols if the first attempt fails
    let finalLq45Data = lq45Data.status === 'fulfilled' ? lq45Data.value : [];
    if (finalLq45Data.length === 0) {
      try {
        console.log('Trying alternative LQ45 symbols...');
        // Try different possible symbols for LQ45
        const alternatives = ['^LQ45', 'IDX:LQ45', 'LQ45.JK'];
        for (const symbol of alternatives) {
          const altData = await fetchHistoricalData(symbol, period);
          if (altData.length > 0) {
            console.log(`LQ45 data found using symbol: ${symbol}`);
            finalLq45Data = altData;
            break;
          }
        }
      } catch (altError) {
        console.warn('Alternative LQ45 symbols also failed:', altError);
      }
    }

    return {
      jkse: jkseData.status === 'fulfilled' ? jkseData.value : [],
      lq45: finalLq45Data,
    };
  } catch (error) {
    console.error('Error fetching market indices:', error);
    return { jkse: [], lq45: [] };
  }
}

export async function fetchStocksWithMarketData(
  stockCalls: StockCall[] = dummyStockCalls,
  lookbackDays: number = 365
): Promise<{ stocks: StockWithMarketData[]; marketIndices: MarketIndices }> {
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - (lookbackDays * 24 * 60 * 60 * 1000));

  // Fetch market indices first
  const marketIndices = await fetchMarketIndices({ start: startDate, end: endDate });

  // Dynamic import for quote fetching
  const { default: YahooFinance } = await import('yahoo-finance2');
  const yahooFinance = new YahooFinance({
    suppressNotices: ['yahooSurvey', 'ripHistorical']
  });

  // Fetch data for each stock
  const stocksWithData = await Promise.all(
    stockCalls.map(async (stock) => {
      // Fetch historical data
      const historicalData = await fetchHistoricalData(stock.ticker, { start: startDate, end: endDate });

      // Try to get real-time quote for current price
      let currentPrice = stock.currentPrice;
      try {
        const quote = await yahooFinance.quote(stock.ticker) as any;
        if (quote && quote.regularMarketPrice) {
          currentPrice = quote.regularMarketPrice;
        } else if (historicalData.length > 0) {
          currentPrice = historicalData[historicalData.length - 1].close;
        }
      } catch (e) {
        console.warn(`Failed to get quote for ${stock.ticker}, using fallback or historical`, e);
        if (historicalData.length > 0) {
          currentPrice = historicalData[historicalData.length - 1].close;
        }
      }

      const currentGain = ((currentPrice - stock.entryPrice) / stock.entryPrice) * 100;

      // Calculate max gain from historical data since call date
      const callDateObj = new Date(stock.callDate);
      const dataSinceCall = historicalData.filter(d => new Date(d.date) >= callDateObj);

      let maxGain = currentGain;
      let daysToMax = null;

      if (dataSinceCall.length > 0) {
        const maxPrice = Math.max(...dataSinceCall.map(d => d.high));
        const effectiveMaxPrice = Math.max(maxPrice, currentPrice);

        maxGain = ((effectiveMaxPrice - stock.entryPrice) / stock.entryPrice) * 100;

        const maxPriceEntry = dataSinceCall.find(d => d.high === maxPrice);
        if (maxPriceEntry) {
          const diffTime = Math.abs(new Date(maxPriceEntry.date).getTime() - callDateObj.getTime());
          daysToMax = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }
      }

      // Calculate relative returns vs Indices
      const getIndexReturn = (indexData: MarketDataPoint[]) => {
        if (!indexData || indexData.length === 0) return 0;

        const startNode = indexData.find(d => new Date(d.date) >= callDateObj);
        const endNode = indexData[indexData.length - 1];

        if (startNode && endNode) {
          return ((endNode.close - startNode.close) / startNode.close) * 100;
        }
        return 0;
      };

      const jkseReturn = getIndexReturn(marketIndices.jkse);
      const lq45Return = getIndexReturn(marketIndices.lq45);

      return {
        ...stock,
        currentPrice,
        historicalData,
        maxGain,
        currentGain,
        daysToMax,
        jkseReturn,
        lq45Return
      };
    })
  );

  return {
    stocks: stocksWithData,
    marketIndices
  };
}

// Re-export dummyStockCalls for convenience
export { dummyStockCalls };