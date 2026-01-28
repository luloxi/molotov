'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePublicClient, useChainId } from 'wagmi';
import { parseAbiItem, Log } from 'viem';
import { TransactionEvent } from '../types';
import { getContractAddress, MOLOTOV_NFT_ABI } from '../services/contract';

const MAX_EVENTS = 50;

export function useTransactionMonitor() {
  const [events, setEvents] = useState<TransactionEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const publicClient = usePublicClient();
  const chainId = useChainId();
  const contractAddress = getContractAddress(chainId);

  // Process log to TransactionEvent
  const processLog = useCallback((log: Log, type: TransactionEvent['type']): TransactionEvent | null => {
    try {
      const baseEvent = {
        id: `${log.transactionHash}-${log.logIndex}`,
        transactionHash: log.transactionHash as `0x${string}`,
        blockNumber: log.blockNumber || BigInt(0),
        timestamp: Date.now(),
      };

      if (type === 'mint' && log.topics[1] && log.topics[2]) {
        return {
          ...baseEvent,
          type: 'mint',
          tokenId: BigInt(log.topics[1]),
          from: `0x${log.topics[2].slice(26)}` as `0x${string}`,
        };
      }

      if (type === 'purchase' && log.topics[1] && log.topics[2] && log.topics[3]) {
        return {
          ...baseEvent,
          type: 'purchase',
          tokenId: BigInt(log.topics[1]),
          to: `0x${log.topics[2].slice(26)}` as `0x${string}`,
          from: `0x${log.topics[3].slice(26)}` as `0x${string}`,
        };
      }

      if (type === 'register' && log.topics[1]) {
        return {
          ...baseEvent,
          type: 'register',
          from: `0x${log.topics[1].slice(26)}` as `0x${string}`,
        };
      }

      return null;
    } catch (e) {
      console.error('Error processing log:', e);
      return null;
    }
  }, []);

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
        if (event) allEvents.push(event);
      });

      // Sort by block number descending
      allEvents.sort((a, b) => Number(b.blockNumber - a.blockNumber));

      setEvents(allEvents.slice(0, MAX_EVENTS));
    } catch (error) {
      console.error('Error fetching past events:', error);
    } finally {
      setIsLoading(false);
    }
  }, [publicClient, contractAddress, processLog]);

  // Watch for new events
  useEffect(() => {
    if (!publicClient || !contractAddress) return;

    const unwatchMint = publicClient.watchContractEvent({
      address: contractAddress,
      abi: MOLOTOV_NFT_ABI,
      eventName: 'ArtworkMinted',
      onLogs: (logs) => {
        logs.forEach((log) => {
          const event = processLog(log, 'mint');
          if (event) {
            setEvents((prev) => [event, ...prev].slice(0, MAX_EVENTS));
          }
        });
      },
    });

    const unwatchPurchase = publicClient.watchContractEvent({
      address: contractAddress,
      abi: MOLOTOV_NFT_ABI,
      eventName: 'ArtworkPurchased',
      onLogs: (logs) => {
        logs.forEach((log) => {
          const event = processLog(log, 'purchase');
          if (event) {
            setEvents((prev) => [event, ...prev].slice(0, MAX_EVENTS));
          }
        });
      },
    });

    const unwatchRegister = publicClient.watchContractEvent({
      address: contractAddress,
      abi: MOLOTOV_NFT_ABI,
      eventName: 'ArtistRegistered',
      onLogs: (logs) => {
        logs.forEach((log) => {
          const event = processLog(log, 'register');
          if (event) {
            setEvents((prev) => [event, ...prev].slice(0, MAX_EVENTS));
          }
        });
      },
    });

    return () => {
      unwatchMint();
      unwatchPurchase();
      unwatchRegister();
    };
  }, [publicClient, contractAddress, processLog]);

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
