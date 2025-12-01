import { Injectable } from '@nestjs/common'
import { chart as yfChart, quote as yfQuote } from '../lib/yahoo-client'
import { StockCall, MarketDataPoint, StockWithMarketData, MarketIndices, dummyStockCalls } from '../data/stock-calls'

function mapHistoricalData(result: any[]): MarketDataPoint[] {
  return result.map((item: any) => ({
    date: item.date.toISOString().split('T')[0],
    open: item.open,
    high: item.high,
    low: item.low,
    close: item.close,
    volume: item.volume,
    adjClose: item.adjClose || item.close,
  }))
}

@Injectable()
export class MarketDataService {
  async fetchHistoricalData(ticker: string, period: { start: Date; end: Date }): Promise<MarketDataPoint[]> {
    try {
      const queryOptions = { period1: period.start, period2: period.end, interval: '1d' as const }
      const result = await yfChart(ticker, queryOptions as any)
      return mapHistoricalData(result.quotes || result)
    } catch (error) {
      return []
    }
  }

  async fetchMarketIndices(period: { start: Date; end: Date }): Promise<MarketIndices> {
    try {
      const [jkseData, lq45Data] = await Promise.allSettled([
        this.fetchHistoricalData('^JKSE', period),
        this.fetchHistoricalData('LQ45.JK', period),
      ])

      let finalLq45Data = lq45Data.status === 'fulfilled' ? lq45Data.value : []
      if (finalLq45Data.length === 0) {
        try {
          const alternatives = ['^LQ45', 'IDX:LQ45', 'LQ45.JK']
          for (const symbol of alternatives) {
            const altData = await this.fetchHistoricalData(symbol, period)
            if (altData.length > 0) {
              finalLq45Data = altData
              break
            }
          }
        } catch {}
      }

      return {
        jkse: jkseData.status === 'fulfilled' ? jkseData.value : [],
        lq45: finalLq45Data,
      }
    } catch {
      return { jkse: [], lq45: [] }
    }
  }

  async fetchStocksWithMarketData(stockCalls: StockCall[] = dummyStockCalls, lookbackDays: number = 365): Promise<{ stocks: StockWithMarketData[]; marketIndices: MarketIndices }> {
    try {
      const endDate = new Date()
      const startDate = new Date(endDate.getTime() - lookbackDays * 24 * 60 * 60 * 1000)

      const marketIndices = await this.fetchMarketIndices({ start: startDate, end: endDate })

      const stocksWithData = await Promise.all(
        stockCalls.map(async (stock) => {
          const historicalData = await this.fetchHistoricalData(stock.ticker, { start: startDate, end: endDate })

          let currentPrice = stock.currentPrice
          try {
            const quote = (await yfQuote(stock.ticker)) as any
            if (quote && quote.regularMarketPrice) {
              currentPrice = quote.regularMarketPrice
            } else if (historicalData.length > 0) {
              currentPrice = historicalData[historicalData.length - 1].close
            }
          } catch {
            if (historicalData.length > 0) {
              currentPrice = historicalData[historicalData.length - 1].close
            }
          }

          const currentGain = ((currentPrice - stock.entryPrice) / stock.entryPrice) * 100
          const callDateObj = new Date(stock.callDate)
          const dataSinceCall = historicalData.filter((d) => new Date(d.date) >= callDateObj)

          let maxGain = currentGain
          let daysToMax: number | null = null

          if (dataSinceCall.length > 0) {
            const maxPrice = Math.max(...dataSinceCall.map((d) => d.high))
            const effectiveMaxPrice = Math.max(maxPrice, currentPrice)
            maxGain = ((effectiveMaxPrice - stock.entryPrice) / stock.entryPrice) * 100
            const maxPriceEntry = dataSinceCall.find((d) => d.high === maxPrice)
            if (maxPriceEntry) {
              const diffTime = Math.abs(new Date(maxPriceEntry.date).getTime() - callDateObj.getTime())
              daysToMax = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
            }
          }

          const getIndexReturn = (indexData: MarketDataPoint[]) => {
            if (!indexData || indexData.length === 0) return 0
            const startNode = indexData.find((d) => new Date(d.date) >= callDateObj)
            const endNode = indexData[indexData.length - 1]
            if (startNode && endNode) {
              return ((endNode.close - startNode.close) / startNode.close) * 100
            }
            return 0
          }

          const jkseReturn = getIndexReturn(marketIndices.jkse)
          const lq45Return = getIndexReturn(marketIndices.lq45)

          return {
            ...stock,
            currentPrice,
            historicalData,
            maxGain,
            currentGain,
            daysToMax,
            jkseReturn,
            lq45Return,
          }
        })
      )

      return { stocks: stocksWithData, marketIndices }
    } catch (error) {
      const fallbackStocks: StockWithMarketData[] = dummyStockCalls.map((stock) => {
        const currentGain = ((stock.currentPrice - stock.entryPrice) / stock.entryPrice) * 100
        return {
          ...stock,
          historicalData: [],
          maxGain: currentGain,
          currentGain,
          daysToMax: null,
          jkseReturn: 0,
          lq45Return: 0,
        } as StockWithMarketData
      })
      return { stocks: fallbackStocks, marketIndices: { jkse: [], lq45: [] } }
    }
  }
}
