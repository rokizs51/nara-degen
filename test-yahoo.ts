import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

async function test() {
    try {
        console.log('Testing yahoo-finance2...');
        const result = await yahooFinance.historical('BBCA.JK', { period1: '2024-01-01', interval: '1d' });
        console.log('Success:', result.length);
    } catch (e) {
        console.error('Error:', e);
    }
}

test();
