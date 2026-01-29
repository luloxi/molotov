'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { createPublicClient, http, parseAbiItem } from 'viem';
import { baseSepolia } from 'wagmi/chains';
import { getContractAddress } from '../services/contract';

interface ListingTime {
  tokenId: string;
  timestamp: number;
  blockNumber: bigint;
}

/**
 * Hook to fetch listing times for artworks.
 * Returns a map of tokenId -> timestamp when the artwork was most recently listed for sale.
 * 
 * Listing can happen:
 * 1. At mint time (if isForSale was true at creation)
 * 2. Via updateArtworkListing (ArtworkPriceUpdated event with isForSale = true)
 * 
 * We use the most recent listing event for each token.
 */
export function useListingTimes() {
  const TARGET_CHAIN_ID = baseSepolia.id;
  const contractAddress = getContractAddress(TARGET_CHAIN_ID);
  
  const [listingTimes, setListingTimes] = useState<Map<string, ListingTime>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const publicClient = useMemo(() => createPublicClient({
    chain: baseSepolia,
    transport: http(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || 'https://base-sepolia-rpc.publicnode.com'),
  }), []);

  useEffect(() => {
    if (!contractAddress) {
      setIsLoading(false);
      return;
    }

    const fetchListingTimes = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const currentBlock = await publicClient.getBlockNumber();
        const currentTime = Date.now();
        
        // Contract deployment block on Base Sepolia (from broadcast/DeployMolotov.s.sol/84532/run-latest.json)
        // 0x2337baf = 36895663 in decimal
        const DEPLOYMENT_BLOCK = BigInt(36895663);
        const fromBlock = DEPLOYMENT_BLOCK;

        // RPC providers limit block range queries (typically 50,000 blocks max)
        // We need to chunk our requests
        const MAX_BLOCK_RANGE = BigInt(45000);
        const mintLogs: Awaited<ReturnType<typeof publicClient.getLogs>>[] = [];
        const priceUpdateLogs: Awaited<ReturnType<typeof publicClient.getLogs>>[] = [];
        
        // Fetch in chunks
        let chunkStart = fromBlock;
        while (chunkStart <= currentBlock) {
          const chunkEnd = chunkStart + MAX_BLOCK_RANGE > currentBlock 
            ? currentBlock 
            : chunkStart + MAX_BLOCK_RANGE;
          
          console.log(`[useListingTimes] Fetching chunk: ${chunkStart.toString()} to ${chunkEnd.toString()}`);
          
          const [mintChunk, priceChunk] = await Promise.all([
            publicClient.getLogs({
              address: contractAddress,
              event: parseAbiItem('event ArtworkMinted(uint256 indexed tokenId, address indexed artist, string title, string ipfsHash, uint256 price)'),
              fromBlock: chunkStart,
              toBlock: chunkEnd,
            }),
            publicClient.getLogs({
              address: contractAddress,
              event: parseAbiItem('event ArtworkPriceUpdated(uint256 indexed tokenId, uint256 oldPrice, uint256 newPrice, bool isForSale)'),
              fromBlock: chunkStart,
              toBlock: chunkEnd,
            }),
          ]);
          
          mintLogs.push(...mintChunk);
          priceUpdateLogs.push(...priceChunk);
          
          chunkStart = chunkEnd + BigInt(1);
        }

        const timesMap = new Map<string, ListingTime>();

        // Helper to estimate timestamp from block number
        const estimateTimestamp = (eventBlock: bigint): number => {
          const blockDiff = Number(currentBlock - eventBlock);
          return currentTime - (blockDiff * 2000); // ~2 seconds per block
        };

        console.log('[useListingTimes] Fetched events (chunked):', {
          mintLogs: mintLogs.length,
          priceUpdateLogs: priceUpdateLogs.length,
          fromBlock: fromBlock.toString(),
          currentBlock: currentBlock.toString(),
          blockRange: (currentBlock - fromBlock).toString(),
        });

        // Process mint events - these are listings at creation time
        // Note: We assume all minted artworks were initially listed
        // The actual isForSale status at mint isn't in the event, so we track all mints
        for (const log of mintLogs) {
          const tokenId = (log.args as { tokenId: bigint }).tokenId.toString();
          const blockNumber = log.blockNumber || BigInt(0);
          const timestamp = estimateTimestamp(blockNumber);
          
          console.log('[useListingTimes] Mint event:', { tokenId, blockNumber: blockNumber.toString(), timestamp, date: new Date(timestamp).toISOString() });
          timesMap.set(tokenId, { tokenId, timestamp, blockNumber });
        }

        // Process price update events - these override mint times if more recent
        // Only count listings where isForSale is true
        for (const log of priceUpdateLogs) {
          const args = log.args as { tokenId: bigint; oldPrice: bigint; newPrice: bigint; isForSale: boolean };
          
          console.log('[useListingTimes] PriceUpdate event:', { 
            tokenId: args.tokenId.toString(), 
            isForSale: args.isForSale,
            blockNumber: log.blockNumber?.toString()
          });
          
          // Only track when artwork is being listed (isForSale = true)
          if (!args.isForSale) continue;
          
          const tokenId = args.tokenId.toString();
          const blockNumber = log.blockNumber || BigInt(0);
          const timestamp = estimateTimestamp(blockNumber);
          
          const existing = timesMap.get(tokenId);
          
          // Use this event if it's more recent than the existing one
          if (!existing || blockNumber > existing.blockNumber) {
            console.log('[useListingTimes] Updating listing time for token', tokenId, 'to', new Date(timestamp).toISOString());
            timesMap.set(tokenId, { tokenId, timestamp, blockNumber });
          }
        }

        console.log('[useListingTimes] Final timesMap:', Array.from(timesMap.entries()).map(([k, v]) => ({
          tokenId: k,
          timestamp: v.timestamp,
          date: new Date(v.timestamp).toISOString(),
          blockNumber: v.blockNumber.toString()
        })));

        setListingTimes(timesMap);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('[useListingTimes] Error fetching listing times:', err);
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchListingTimes();
  }, [contractAddress, publicClient]);

  // Memoize getListingTime to have stable reference that updates with listingTimes
  const getListingTime = useCallback((tokenId: string | bigint): number | undefined => {
    const key = typeof tokenId === 'bigint' ? tokenId.toString() : tokenId;
    return listingTimes.get(key)?.timestamp;
  }, [listingTimes]);

  return {
    listingTimes,
    isLoading,
    error,
    getListingTime,
  };
}
