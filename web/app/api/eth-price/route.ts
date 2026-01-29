import { NextResponse } from 'next/server';

let cachedPrice: { usd: number; lastUpdated: number } | null = null;
const CACHE_DURATION = 60000; // 1 minute

export async function GET() {
  try {
    if (cachedPrice && Date.now() - cachedPrice.lastUpdated < CACHE_DURATION) {
      return NextResponse.json({ ethereum: { usd: cachedPrice.usd } });
    }

    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd',
      { next: { revalidate: 60 } }
    );

    if (!response.ok) {
      if (cachedPrice) {
        return NextResponse.json({ ethereum: { usd: cachedPrice.usd } });
      }
      return NextResponse.json({ error: 'Failed to fetch price' }, { status: 502 });
    }

    const data = await response.json();
    cachedPrice = { usd: data.ethereum.usd, lastUpdated: Date.now() };

    return NextResponse.json(data);
  } catch {
    if (cachedPrice) {
      return NextResponse.json({ ethereum: { usd: cachedPrice.usd } });
    }
    return NextResponse.json({ error: 'Failed to fetch price' }, { status: 502 });
  }
}
