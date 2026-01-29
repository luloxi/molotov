"use client";

import { useMemo } from "react";
import { useAccount } from "wagmi";
import { useMiniApp } from "./providers/MiniAppProvider";
import { useArtworksForSale, useAllArtists, useTotalSupply } from "./hooks/useContract";
import { useListingTimes } from "./hooks/useListingTimes";
import { GalleryGrid } from "./components/gallery";
import { TransactionFeed } from "./components/transactions";
import { Artwork } from "./types";
import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  const { context } = useMiniApp();
  const { address, isConnected } = useAccount();
  
  const { data: artworksData, isLoading: artworksLoading } = useArtworksForSale();
  const { data: artistsData } = useAllArtists();
  const { data: totalSupply } = useTotalSupply();
  const { getListingTime, listingTimes } = useListingTimes();

  const artworks = (artworksData as Artwork[]) || [];
  const artistCount = (artistsData as string[])?.length || 0;
  const nftCount = totalSupply ? Number(totalSupply) : 0;

  // Sort artworks by listing time (most recently listed first) before taking top 8
  const featuredArtworks = useMemo(() => {
    console.log('[Home] Sorting artworks. Count:', artworks.length, 'ListingTimes size:', listingTimes.size);
    
    const sorted = [...artworks]
      .map(a => {
        const listingTime = getListingTime(a.tokenId);
        const fallbackTime = Number(a.createdAt) * 1000;
        const effectiveTime = listingTime ?? fallbackTime;
        console.log('[Home] Artwork', a.tokenId.toString(), a.title, {
          listingTime: listingTime ? new Date(listingTime).toISOString() : 'none',
          createdAt: new Date(fallbackTime).toISOString(),
          effectiveTime: new Date(effectiveTime).toISOString(),
          usingListingTime: !!listingTime
        });
        return { artwork: a, effectiveTime };
      })
      .sort((a, b) => b.effectiveTime - a.effectiveTime)
      .map(item => item.artwork)
      .slice(0, 8);
    
    console.log('[Home] Sorted order:', sorted.map(a => ({ id: a.tokenId.toString(), title: a.title })));
    return sorted;
  }, [artworks, getListingTime, listingTimes]);

  return (
    <div className={styles.container}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <p className={styles.heroTagline}>
            Collect, Display, Live.
          </p>
          <h1 className={styles.heroTitle}>
            MOLOTOV
          </h1>
          <p className={styles.heroSubtitle}>
            A new way to enjoy art: simple, accessible, and real.
          </p>
          
          <div className={styles.heroStats}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{nftCount}</span>
              <span className={styles.statLabel}>Artworks</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{artistCount}</span>
              <span className={styles.statLabel}>Artists</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{artworks.length}</span>
              <span className={styles.statLabel}>For Sale</span>
            </div>
          </div>

          <div className={styles.heroActions}>
            <Link href="/explore" className={styles.primaryButton}>
              Explore
            </Link>
            {isConnected ? (
              <Link href="/mint" className={styles.secondaryButton}>
                Create Artwork
              </Link>
            ) : (
              <Link href="/mint" className={styles.secondaryButton}>
                Create NFT
              </Link>
            )}
          </div>
        </div>
        
        <div className={styles.heroVisual}>
          <div className={styles.glowOrb} />
        </div>
      </section>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Featured Artworks */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Featured Artworks</h2>
            <Link href="/explore" className={styles.seeAll}>
              See all
            </Link>
          </div>
          <GalleryGrid 
            artworks={featuredArtworks} 
            isLoading={artworksLoading}
            showFilters={false}
          />
        </section>

        {/* Live Activity */}
        <section className={styles.section}>
          <TransactionFeed />
        </section>
      </div>

      {/* Welcome message for authenticated users */}
      {context?.user?.displayName && (
        <div className={styles.welcomeBanner}>
          Welcome back, <strong>{context.user.displayName}</strong>!
          {isConnected && address && (
            <span className={styles.connectedAddress}>
              Connected: {address.slice(0, 6)}...{address.slice(-4)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
