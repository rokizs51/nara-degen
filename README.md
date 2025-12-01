# Nara Degen - Indonesian Stock Portfolio Tracker

A professional real-time dashboard for tracking Indonesian stock portfolio performance against Jakarta market indices.

## Features

- **Real-time Market Data**: Live Indonesian stock prices from Yahoo Finance
- **Portfolio Analytics**: Track individual stock performance with entry/exit points
- **Market Comparison**: Performance vs JKSE (IHSG) and LQ45 indices
- **Interactive Charts**: Visual performance analysis with Recharts
- **Auto-refresh**: Updates every 5 minutes during market hours (09:00-16:00 WIB)

## Tech Stack

- **Frontend**: Next.js 16.0.6 with React 19.2.0
- **Styling**: Tailwind CSS 4.0
- **Charts**: Recharts 3.5.1
- **Data**: Yahoo Finance API (yahoo-finance2)
- **TypeScript**: Full type safety

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Market Data

- **JKSE**: Jakarta Composite Index (IHSG)
- **LQ45**: Liquid 45 Index
- **Stocks**: Individual Indonesian equities with `.JK` suffix

## Development

- **Next.js**: App Router with server-side rendering
- **API Routes**: `/api/market-data` for real-time fetching
- **Components**: Modular React components in `/src/components`
- **Data Layer**: Market data utilities in `/src/lib`

## Project Structure

```
src/
├── app/           # Next.js app router
├── components/    # React components
├── lib/          # Utilities and data fetching
└── data/         # Stock definitions and types
```

## Market Hours

Auto-refreshes data during Indonesian market hours:
- **Weekdays**: 09:00 - 16:00 WIB
- **Update Interval**: 5 minutes
