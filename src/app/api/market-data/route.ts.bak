import { NextResponse } from 'next/server';
import { fetchStocksWithMarketData } from '@/lib/market-data';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

export async function GET() {
    try {
        const data = await fetchStocksWithMarketData();
        return NextResponse.json(data);
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch market data', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
