import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

export async function GET() {
    try {
        const baseUrl = process.env.MARKET_API_URL || 'http://localhost:4000/market-data';
        const res = await fetch(baseUrl, { next: { revalidate: 0 } });
        if (!res.ok) {
            return NextResponse.json(
                { error: 'Upstream failed', status: res.status },
                { status: 502 }
            );
        }
        const data = await res.json();
        return NextResponse.json(data, {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to fetch market data', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

export async function OPTIONS() {
    return new NextResponse(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    });
}
