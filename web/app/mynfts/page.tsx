'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { useAllTokenIds, useArtworks, useContractAddress } from '../hooks/useContract';
import { MOLOTOV_NFT_ABI } from '../services/contract';
import { GalleryGrid } from '../components/gallery';
import type { Artwork } from '../types';
import styles from './page.module.css';

// Extended artwork type with owner information
interface OwnedArtwork extends Artwork {
  owner: `0x${string}`;
}

// Hook to get all artworks owned by a specific address
function useOwnedArtworks(ownerAddress?: `0x${string}`) {
  const contractAddress = useContractAddress();
  const { data: allTokenIds, isLoading: tokenIdsLoading } = useAllTokenIds();
  const [ownedTokenIds, setOwnedTokenIds] = useState<bigint[]>([]);
  const [isLoadingOwners, setIsLoadingOwners] = useState(false);
  const [owners, setOwners] = useState<Map<string, `0x${string}`>>(new Map());

  // Fetch owners for all tokens
  useEffect(() => {
    if (!contractAddress || !allTokenIds || !ownerAddress || (allTokenIds as bigint[]).length === 0) {
      setOwnedTokenIds([]);
      setOwners(new Map());
      return;
    }

    const fetchOwners = async () => {
      setIsLoadingOwners(true);
      
      try {
        const { createPublicClient, http } = await import('viem');
        const { baseSepolia } = await import('wagmi/chains');
        
        const client = createPublicClient({
          chain: baseSepolia,
          transport: http(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || 'https://base-sepolia-rpc.publicnode.com'),
        });

        const tokenIds = allTokenIds as bigint[];
        const ownerMap = new Map<string, `0x${string}`>();
        const owned: bigint[] = [];

        // Batch fetch owners
        const ownerResults = await Promise.all(
          tokenIds.map(async (tokenId) => {
            try {
              const owner = await client.readContract({
                address: contractAddress,
                abi: MOLOTOV_NFT_ABI,
                functionName: 'ownerOf',
                args: [tokenId],
              });
              return { tokenId, owner: owner as `0x${string}` };
            } catch (err) {
              console.error(`Failed to fetch owner for token ${tokenId}:`, err);
              return null;
            }
          })
        );

        for (const result of ownerResults) {
          if (result) {
            ownerMap.set(result.tokenId.toString(), result.owner);
            if (result.owner.toLowerCase() === ownerAddress.toLowerCase()) {
              owned.push(result.tokenId);
            }
          }
        }

        setOwners(ownerMap);
        setOwnedTokenIds(owned);
      } catch (err) {
        console.error('Failed to fetch owners:', err);
      } finally {
        setIsLoadingOwners(false);
      }
    };

    fetchOwners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contractAddress, JSON.stringify((allTokenIds as bigint[] | undefined)?.map(t => t.toString())), ownerAddress]);

  const { data: artworks, isLoading: artworksLoading } = useArtworks(ownedTokenIds.length > 0 ? ownedTokenIds : undefined);

  // Add owner info to artworks
  const ownedArtworks = useMemo(() => {
    if (!artworks) return [];
    return artworks.map(artwork => ({
      ...artwork,
      owner: owners.get(artwork.tokenId.toString()) || ('0x0' as `0x${string}`),
    }));
  }, [artworks, owners]);

  return {
    data: ownedArtworks,
    isLoading: tokenIdsLoading || isLoadingOwners || artworksLoading,
  };
}

type TabType = 'all' | 'created' | 'collected';

export default function MyNFTsPage() {
  const { address, isConnected } = useAccount();
  const { data: ownedArtworks, isLoading } = useOwnedArtworks(address);
  const [activeTab, setActiveTab] = useState<TabType>('all');

  // Separate artworks into created and collected
  const { createdArtworks, collectedArtworks, allArtworks } = useMemo(() => {
    if (!ownedArtworks || !address) {
      return { createdArtworks: [], collectedArtworks: [], allArtworks: [] };
    }

    const created: Artwork[] = [];
    const collected: Artwork[] = [];

    for (const artwork of ownedArtworks) {
      if (artwork.artist.toLowerCase() === address.toLowerCase()) {
        created.push(artwork);
      } else {
        collected.push(artwork);
      }
    }

    return {
      createdArtworks: created,
      collectedArtworks: collected,
      allArtworks: ownedArtworks as Artwork[],
    };
  }, [ownedArtworks, address]);

  const displayedArtworks = useMemo(() => {
    switch (activeTab) {
      case 'created':
        return createdArtworks;
      case 'collected':
        return collectedArtworks;
      default:
        return allArtworks;
    }
  }, [activeTab, createdArtworks, collectedArtworks, allArtworks]);

  if (!isConnected) {
    return (
      <div className={styles.container}>
        <div className={styles.notConnected}>
          <div className={styles.notConnectedIcon}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="M3 10h18" />
              <circle cx="7" cy="15" r="1" />
            </svg>
          </div>
          <h2>Connect Your Wallet</h2>
          <p>Connect your wallet to view your NFTs</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>My NFTs</h1>
        <p className={styles.subtitle}>
          View and manage your NFTs
        </p>
      </header>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'all' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('all')}
        >
          <span className={styles.tabLabel}>All</span>
          <span className={styles.tabCount}>{allArtworks.length}</span>
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'created' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('created')}
        >
          <span className={styles.tabLabel}>Created</span>
          <span className={styles.tabCount}>{createdArtworks.length}</span>
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'collected' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('collected')}
        >
          <span className={styles.tabLabel}>Collected</span>
          <span className={styles.tabCount}>{collectedArtworks.length}</span>
        </button>
      </div>

      {!isLoading && displayedArtworks.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            {activeTab === 'created' ? (
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 5v14M5 12h14" />
                <rect x="3" y="3" width="18" height="18" rx="2" />
              </svg>
            ) : activeTab === 'collected' ? (
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20 12v7a2 2 0 01-2 2H6a2 2 0 01-2-2v-7" />
                <path d="M12 3v12M8 11l4 4 4-4" />
              </svg>
            ) : (
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            )}
          </div>
          <h3 className={styles.emptyTitle}>
            {activeTab === 'created'
              ? "You haven't created any NFTs yet"
              : activeTab === 'collected'
              ? "You haven't collected any NFTs yet"
              : "Your collection is empty"}
          </h3>
          <p className={styles.emptyDescription}>
            {activeTab === 'created'
              ? "Start creating and minting your artwork to build your portfolio"
              : activeTab === 'collected'
              ? "Explore the gallery and collect NFTs from talented artists"
              : "Create or collect NFTs to start building your collection"}
          </p>
          <a
            href={activeTab === 'created' ? '/mint' : '/explore'}
            className={styles.emptyAction}
          >
            {activeTab === 'created' ? 'Create NFT' : 'Explore Gallery'}
          </a>
        </div>
      ) : (
        <GalleryGrid
          artworks={displayedArtworks}
          isLoading={isLoading}
          showFilters={displayedArtworks.length > 4}
        />
      )}
    </div>
  );
}
