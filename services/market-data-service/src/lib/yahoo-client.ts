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
  const key = `chart:${ticker}:${options.period1.getTime()}:${options.period2.getTime()}:${options.interval}`
  const cached = getCache(key)
  if (cached) return cached
  const result = await withRetry(() => yahooFinance.chart(ticker, options))
  setCache(key, result, 15 * 60 * 1000)
  return result
}

export async function quote(ticker: string) {
  const key = `quote:${ticker}`
  const cached = getCache(key)
  if (cached) return cached
  const result = await withRetry(() => yahooFinance.quote(ticker))
  setCache(key, result, 60 * 1000)
  return result
}
