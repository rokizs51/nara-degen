export const onRequest = async ({ env }) => {
  try {
    const response = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/^JKSE');
    const data = await response.json();

    const jkseData = {
      index: 'JKSE',
      current: data.chart.result[0].meta.regularMarketPrice,
      change: data.chart.result[0].meta.regularMarketPrice - data.chart.result[0].meta.previousClose,
      changePercent: ((data.chart.result[0].meta.regularMarketPrice - data.chart.result[0].meta.previousClose) / data.chart.result[0].meta.previousClose * 100).toFixed(2)
    };

    return new Response(JSON.stringify({
      success: true,
      data: {
        indices: [jkseData],
        stocks: [],
        lastUpdated: new Date().toISOString()
      }
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch market data',
      mockData: {
        indices: [{
          index: 'JKSE',
          current: 7200,
          change: 50,
          changePercent: '0.70'
        }]
      }
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};