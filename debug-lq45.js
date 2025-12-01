// Debug script to test LQ45 data fetching
// Test LQ45 symbol directly
import { YahooFinance } from 'yahoo-finance2';

async function debugLQ45() {
  console.log('Testing LQ45 fetch with new symbol...');

  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - (30 * 24 * 60 * 60 * 1000)); // 30 days back

  console.log('Fetching period:', { startDate, endDate });

  try {
    const yahooFinance = new YahooFinance({
      suppressNotices: ['yahooSurvey', 'ripHistorical']
    });

    // Test the new LQ45.JK symbol
    console.log('Fetching LQ45.JK data...');
    const lq45Result = await yahooFinance.chart('LQ45.JK', {
      period1: startDate,
      period2: endDate,
      interval: '1d'
    });

    const lq45Data = lq45Result.quotes || lq45Result;
    console.log('LQ45.JK data length:', lq45Data.length);
    if (lq45Data.length > 0) {
      console.log('LQ45.JK last entry:', lq45Data[lq45Data.length - 1]);
    }

    // Test JKSE for comparison
    console.log('Fetching JKSE data...');
    const jkseResult = await yahooFinance.chart('^JKSE', {
      period1: startDate,
      period2: endDate,
      interval: '1d'
    });

    const jkseData = jkseResult.quotes || jkseResult;
    console.log('JKSE data length:', jkseData.length);
    if (jkseData.length > 0) {
      console.log('JKSE last entry:', jkseData[jkseData.length - 1]);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

debugLQ45().catch(console.error);