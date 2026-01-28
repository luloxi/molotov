'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePublicClient } from 'wagmi';
import { parseAbiItem } from 'viem';
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
  const [artistNames, setArtistNames] = useState<ArtistNameMap>({});

  // Always use a public client scoped to Base Sepolia
  const publicClient = usePublicClient({ chainId: TARGET_CHAIN_ID });
  const contractAddress = getContractAddress(TARGET_CHAIN_ID);

  // Process decoded log to TransactionEvent
  const processLog = useCallback((log: DecodedLog, type: TransactionEvent['type']): TransactionEvent | null => {
    try {
      const baseEvent = {
        id: `${log.transactionHash}-${log.logIndex}`,
        transactionHash: log.transactionHash as `0x${string}`,
        blockNumber: log.blockNumber || BigInt(0),
        timestamp: Date.now(),
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
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const currentBlock = await publicClient.getBlockNumber();
      const fromBlock = currentBlock > BigInt(10000) ? currentBlock - BigInt(10000) : BigInt(0);

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
        const event = processLog(log, 'mint');
        if (event) allEvents.push(event);
      });

      purchaseLogs.forEach((log) => {
        const event = processLog(log, 'purchase');
        if (event) allEvents.push(event);
      });

      registerLogs.forEach((log) => {
        const event = processLog(log, 'register');
        if (event) {
          allEvents.push(event);
          if (event.artistName) {
            nameMap[event.from.toLowerCase()] = event.artistName;
          }
        }
      });

      // Sort by block number descending
      allEvents.sort((a, b) => Number(b.blockNumber - a.blockNumber));

      const trimmed = allEvents.slice(0, MAX_EVENTS);
      const enriched = applyArtistNames(trimmed, nameMap);

      setArtistNames(nameMap);
      setEvents(enriched);
    } catch (error) {
      console.error('Error fetching past events:', error);
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
    refresh: fetchPastEvents,
  };
}
