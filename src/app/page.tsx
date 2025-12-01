import { DashboardSkeleton } from '@/components/DashboardSkeleton';
import ClientDashboard from '@/components/ClientDashboard';
import { dummyStockCalls } from '@/data/stock-calls';
import { StockWithMarketData, MarketIndices } from '@/data/stock-calls';
import YahooFinance from 'yahoo-finance2';

// For now, we'll skip server-side data fetching to avoid Node.js module issues
// The client component will handle data fetching


// Initial data for SSR - client will fetch real data
function getInitialData(): {
  stocks: StockWithMarketData[];
  marketIndices: MarketIndices | undefined;
  error: string | null;
  fetchTime: string;
} {
  const fallbackStocks = dummyStockCalls.map(stock => ({
    ...stock,
    historicalData: [],
    maxGain: 0,
    currentGain: ((stock.currentPrice - stock.entryPrice) / stock.entryPrice) * 100,
    daysToMax: null,
    jkseReturn: undefined,
    lq45Return: undefined
  }));

  return {
    stocks: fallbackStocks,
    marketIndices: undefined,
    error: 'Loading real-time data...',
    fetchTime: new Date().toISOString()
  };
}

// Generate static params for ISR (Incremental Static Regeneration)
export async function generateStaticParams() {
  return [];
}



// Set revalidation period (5 minutes for market data)
export const revalidate = 300; // 5 minutes

// Page metadata
export const metadata = {
  title: 'Nara Degen | Real-time Market Analysis',
  description: 'Track Indonesian stock portfolio performance against Jakarta market indices (JKSE/IHSG, LQ45). Real-time data, performance metrics, and professional analytics.',
  keywords: 'Indonesian stocks, JKSE, IHSG, LQ45, portfolio tracker, market analysis, financial dashboard',
  authors: [{ name: 'Portfolio Tracker' }],
  openGraph: {
    title: 'Nara Degen',
    description: 'Professional portfolio tracking for Indonesian stock market',
    type: 'website',
    locale: 'id_ID',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Indonesian Stock Portfolio Tracker',
    description: 'Track portfolio performance against Jakarta market indices',
  },
};

// Server Component
export default async function HomePage() {
  // Get initial data (client will fetch real data)
  const { stocks, marketIndices, error, fetchTime } = getInitialData();

  // Check if we have meaningful data
  const hasData = stocks.length > 0;
  const hasMarketData = marketIndices && marketIndices.jkse?.length > 0 && marketIndices.lq45?.length > 0;


  // Log build status for debugging
  console.log('Build status:', {
    hasData,
    hasMarketData,
    stockCount: stocks.length,
    error: error ? 'YES' : 'NO',
    fetchTime
  });

  // Show loading skeleton during initial build or data fetch
  if (!hasData) {
    return <DashboardSkeleton />;
  }

  // Pass data to client component
  return (
    <>
      {/* Add structured data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "Indonesian Stock Portfolio Tracker",
            "description": "Professional portfolio tracking for Indonesian stock market with real-time performance analysis",
            "url": process.env.NEXT_PUBLIC_SITE_URL || "https://localhost:3000",
            "applicationCategory": "Finance",
            "operatingSystem": "Web Browser",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "IDR"
            },
            "author": {
              "@type": "Organization",
              "name": "Portfolio Tracker Team"
            },
            "dateModified": fetchTime,
            "mainEntity": {
              "@type": "FinancialService",
              "name": "Stock Market Analysis",
              "serviceType": "Portfolio Tracking"
            }
          })
        }}
      />

      <ClientDashboard
        initialStocks={stocks}
        initialMarketIndices={marketIndices}
        error={error}
      />
    </>
  );
}
