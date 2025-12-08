import YahooFinance from 'yahoo-finance2'

type ChartOptions = {
  period1: Date
  period2: Date
  interval: '1d' | '1wk' | '1mo'
}

const yahooFinance = new YahooFinance({
  suppressNotices: ['yahooSurvey', 'ripHistorical']
})

type CacheEntry = { value: any; expires: number }
const cache = new Map<string, CacheEntry>()

function getCache(key: string) {
  const e = cache.get(key)
  if (!e) return undefined
  if (Date.now() > e.expires) {
    cache.delete(key)
    return undefined
  }
  return e.value
}

function setCache(key: string, value: any, ttlMs: number) {
  cache.set(key, { value, expires: Date.now() + ttlMs })
}

async function withRetry<T>(fn: () => Promise<T>) {
  const delays = [200, 500, 1000]
  let lastErr: any
  for (let i = 0; i < delays.length; i++) {
    try {
      return await fn()
    } catch (e) {
      lastErr = e
      await new Promise(r => setTimeout(r, delays[i]))
    }
  }
  throw lastErr
}

export async function chart(ticker: string, options: ChartOptions) {
  // Map common Indonesian stock symbols to correct Yahoo Finance format
  const mappedTicker = mapIndonesianSymbol(ticker)
  const key = `chart:${mappedTicker}:${options.period1.getTime()}:${options.period2.getTime()}:${options.interval}`
  const cached = getCache(key)
  if (cached) return cached
  const result = await withRetry(() => yahooFinance.chart(mappedTicker, options))
  setCache(key, result, 15 * 60 * 1000)
  return result
}

export async function quote(ticker: string) {
  // Map common Indonesian stock symbols to correct Yahoo Finance format
  const mappedTicker = mapIndonesianSymbol(ticker)
  const key = `quote:${mappedTicker}`
  const cached = getCache(key)
  if (cached) return cached
  const result = await withRetry(() => yahooFinance.quote(mappedTicker))
  setCache(key, result, 60 * 1000)
  return result
}

// Map common Indonesian symbols to Yahoo Finance format
function mapIndonesianSymbol(ticker: string): string {
  // Handle LQ45 special case
  if (ticker === 'LQ45' || ticker === 'LQ45.JK' || ticker === 'IDX:LQ45') {
    return '^JKLQ45'
  }

  // Handle JKSE (should work as is, but ensure consistency)
  if (ticker === 'JKSE' && !ticker.startsWith('^')) {
    return '^JKSE'
  }

  // Already properly formatted symbols
  if (ticker.startsWith('^') || ticker.includes('.')) {
    return ticker
  }

  // For other Indonesian stocks without .JK suffix, add it
  if (!ticker.includes('.') && !ticker.startsWith('^')) {
    return `${ticker}.JK`
  }

  return ticker
}
