'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { createPublicClient, http, parseAbiItem } from 'viem';
import { TransactionEvent } from '../types';
import { getContractAddress, MOLOTOV_NFT_ABI } from '../services/contract';
import { baseSepolia } from 'wagmi/chains';

const MAX_EVENTS = 50;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DecodedLog = any;

type ArtistNameMap = Record<string, string>;

export function useTransactionMonitor() {
  // Force all activity to read from Base Sepolia in production
  const TARGET_CHAIN_ID = baseSepolia.id;

  const [events, setEvents] = useState<TransactionEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [artistNames, setArtistNames] = useState<ArtistNameMap>({});

  // Create a stable public client that doesn't depend on wallet connection
  // Use PublicNode's free RPC as fallback since other RPCs can be unreliable or require API keys
  const publicClient = useMemo(() => createPublicClient({
    chain: baseSepolia,
    transport: http(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || 'https://base-sepolia-rpc.publicnode.com'),
  }), []);
  const contractAddress = getContractAddress(TARGET_CHAIN_ID);
  
  // Debug: Log contract address on init
  useEffect(() => {
    console.log(`[TransactionMonitor] Contract address: ${contractAddress}, Chain: ${TARGET_CHAIN_ID}`);
  }, [contractAddress, TARGET_CHAIN_ID]);

  // Process decoded log to TransactionEvent
  // currentBlock and currentTime are used to estimate the actual event timestamp for historical events
  // For real-time events (watchers), these can be omitted and Date.now() will be used
  const processLog = useCallback((
    log: DecodedLog, 
    type: TransactionEvent['type'],
    currentBlock?: bigint,
    currentTime?: number
  ): TransactionEvent | null => {
    try {
      const eventBlock = log.blockNumber || BigInt(0);
      let timestamp: number;
      
      if (currentBlock && currentTime) {
        // Estimate timestamp based on block difference (~2 seconds per block on Base Sepolia)
        const blockDiff = Number(currentBlock - eventBlock);
        timestamp = currentTime - (blockDiff * 2000);
      } else {
        // For real-time events, use current time
        timestamp = Date.now();
      }
      
      const baseEvent = {
        id: `${log.transactionHash}-${log.logIndex}`,
        transactionHash: log.transactionHash as `0x${string}`,
        blockNumber: eventBlock,
        timestamp,
      };

      if (type === 'mint' && log.args) {
        return {
          ...baseEvent,
          type: 'mint',
          tokenId: log.args.tokenId,
          from: log.args.artist,
          artworkTitle: log.args.title || undefined,
        };
      }

      if (type === 'purchase' && log.args) {
        return {
          ...baseEvent,
          type: 'purchase',
          tokenId: log.args.tokenId,
          to: log.args.buyer,
          from: log.args.seller,
          price: log.args.price,
        };
      }

      if (type === 'register' && log.args) {
        return {
          ...baseEvent,
          type: 'register',
          from: log.args.artist,
          artistName: log.args.name || undefined,
        };
      }

      return null;
    } catch (e) {
      console.error('Error processing log:', e);
      return null;
    }
  }, []);

  const applyArtistNames = useCallback(
    (eventsList: TransactionEvent[], names: ArtistNameMap): TransactionEvent[] => {
      return eventsList.map((event) => {
        const fromName = names[event.from.toLowerCase()];
        const toName = event.to ? names[event.to.toLowerCase()] : undefined;
        return {
          ...event,
          artistName: fromName || event.artistName,
          buyerName: toName || event.buyerName,
        };
      });
    },
    []
  );

  // Fetch past events
  const fetchPastEvents = useCallback(async () => {
    if (!publicClient || !contractAddress) {
      console.log('[TransactionMonitor] Missing publicClient or contractAddress');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const currentBlock = await publicClient.getBlockNumber();
      // Look back up to 45,000 blocks (~1 day on Base Sepolia with ~2s blocks)
      // This respects RPC limits (most public RPCs limit to 50,000 blocks)
      const fromBlock = currentBlock > BigInt(45000) ? currentBlock - BigInt(45000) : BigInt(0);
      
      console.log(`[TransactionMonitor] Fetching events from block ${fromBlock} to ${currentBlock} for contract ${contractAddress}`);
      
      const currentTime = Date.now();

      // Fetch different event types
      const [mintLogs, purchaseLogs, registerLogs] = await Promise.all([
        publicClient.getLogs({
          address: contractAddress,
          event: parseAbiItem('event ArtworkMinted(uint256 indexed tokenId, address indexed artist, string title, string ipfsHash, uint256 price)'),
          fromBlock,
          toBlock: currentBlock,
        }),
        publicClient.getLogs({
          address: contractAddress,
          event: parseAbiItem('event ArtworkPurchased(uint256 indexed tokenId, address indexed buyer, address indexed seller, uint256 price)'),
          fromBlock,
          toBlock: currentBlock,
        }),
        publicClient.getLogs({
          address: contractAddress,
          event: parseAbiItem('event ArtistRegistered(address indexed artist, string name)'),
          fromBlock,
          toBlock: currentBlock,
        }),
      ]);

      const allEvents: TransactionEvent[] = [];
      const nameMap: ArtistNameMap = {};

      mintLogs.forEach((log) => {
        const event = processLog(log, 'mint', currentBlock, currentTime);
        if (event) allEvents.push(event);
      });

      purchaseLogs.forEach((log) => {
        const event = processLog(log, 'purchase', currentBlock, currentTime);
        if (event) allEvents.push(event);
      });

      registerLogs.forEach((log) => {
        const event = processLog(log, 'register', currentBlock, currentTime);
        if (event) {
          allEvents.push(event);
          if (event.artistName) {
            nameMap[event.from.toLowerCase()] = event.artistName;
          }
        }
      });

      console.log(`[TransactionMonitor] Found ${mintLogs.length} mints, ${purchaseLogs.length} purchases, ${registerLogs.length} registrations`);
      
      // Sort by block number descending
      allEvents.sort((a, b) => Number(b.blockNumber - a.blockNumber));

      const trimmed = allEvents.slice(0, MAX_EVENTS);
      const enriched = applyArtistNames(trimmed, nameMap);

      console.log(`[TransactionMonitor] Total events: ${allEvents.length}, displaying: ${enriched.length}`);
      
      setArtistNames(nameMap);
      setEvents(enriched);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('[TransactionMonitor] Error fetching past events:', err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [publicClient, contractAddress, processLog, applyArtistNames]);

  // Watch for new events
  useEffect(() => {
    if (!publicClient || !contractAddress) return;

    const unwatchMint = publicClient.watchContractEvent({
      address: contractAddress,
      abi: MOLOTOV_NFT_ABI,
      eventName: 'ArtworkMinted',
      onLogs: (logs) => {
        setEvents((prev) => {
          const nextEvents = [...prev];
          for (const log of logs) {
            const event = processLog(log as DecodedLog, 'mint');
            if (event) {
              const fromName = artistNames[event.from.toLowerCase()];
              const enrichedEvent: TransactionEvent = {
                ...event,
                artistName: fromName || event.artistName,
              };
              nextEvents.unshift(enrichedEvent);
            }
          }
          return nextEvents.slice(0, MAX_EVENTS);
        });
      },
    });

    const unwatchPurchase = publicClient.watchContractEvent({
      address: contractAddress,
      abi: MOLOTOV_NFT_ABI,
      eventName: 'ArtworkPurchased',
      onLogs: (logs) => {
        setEvents((prev) => {
          const nextEvents = [...prev];
          for (const log of logs) {
            const event = processLog(log as DecodedLog, 'purchase');
            if (event) {
              const fromName = artistNames[event.from.toLowerCase()];
              const toName = event.to ? artistNames[event.to.toLowerCase()] : undefined;
              const enrichedEvent: TransactionEvent = {
                ...event,
                artistName: fromName || event.artistName,
                buyerName: toName || event.buyerName,
              };
              nextEvents.unshift(enrichedEvent);
            }
          }
          return nextEvents.slice(0, MAX_EVENTS);
        });
      },
    });

    const unwatchRegister = publicClient.watchContractEvent({
      address: contractAddress,
      abi: MOLOTOV_NFT_ABI,
      eventName: 'ArtistRegistered',
      onLogs: (logs) => {
        logs.forEach((log) => {
          const event = processLog(log as DecodedLog, 'register');
          if (!event || !event.artistName) return;

          const key = event.from.toLowerCase();

          // Update name map
          setArtistNames((prev) => ({
            ...prev,
            [key]: event.artistName as string,
          }));

          // Update existing events and prepend the register event itself
          setEvents((prev) => {
            const updated = prev.map((e) => {
              if (e.from.toLowerCase() === key && !e.artistName) {
                return { ...e, artistName: event.artistName };
              }
              if (e.to && e.to.toLowerCase() === key && !e.buyerName) {
                return { ...e, buyerName: event.artistName };
              }
              return e;
            });
            return [event, ...updated].slice(0, MAX_EVENTS);
          });
        });
      },
    });

    return () => {
      unwatchMint();
      unwatchPurchase();
      unwatchRegister();
    };
  }, [publicClient, contractAddress, processLog, artistNames]);

  // Initial fetch
  useEffect(() => {
    fetchPastEvents();
  }, [fetchPastEvents]);

  return {
    events,
    isLoading,
    error,
    refresh: fetchPastEvents,
  };
}
