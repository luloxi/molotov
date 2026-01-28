'use client';

import { useState, useEffect } from 'react';

interface PriceData {
  usd: number;
  lastUpdated: number;
}

const CACHE_DURATION = 60000; // 1 minute cache
let cachedPrice: PriceData | null = null;

export function useEthPrice() {
  const [price, setPrice] = useState<number | null>(cachedPrice?.usd ?? null);
  const [isLoading, setIsLoading] = useState(!cachedPrice);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrice = async () => {
      // Use cached price if still valid
      if (cachedPrice && Date.now() - cachedPrice.lastUpdated < CACHE_DURATION) {
        setPrice(cachedPrice.usd);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch ETH price');
        }
        
        const data = await response.json();
        const usdPrice = data.ethereum.usd;
        
        cachedPrice = {
          usd: usdPrice,
          lastUpdated: Date.now(),
        };
        
        setPrice(usdPrice);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch price');
        // Keep using cached price if available
        if (cachedPrice) {
          setPrice(cachedPrice.usd);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrice();
    
    // Refresh price every minute
    const interval = setInterval(fetchPrice, CACHE_DURATION);
    return () => clearInterval(interval);
  }, []);

  const convertEthToUsd = (ethAmount: string | number): string | null => {
    if (!price) return null;
    const eth = typeof ethAmount === 'string' ? parseFloat(ethAmount) : ethAmount;
    if (isNaN(eth) || eth <= 0) return null;
    const usd = eth * price;
    return usd < 0.01 ? '< $0.01' : `~$${usd.toFixed(2)}`;
  };

  return {
    price,
    isLoading,
    error,
    convertEthToUsd,
  };
}
