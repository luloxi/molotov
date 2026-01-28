"use client";

import { } from "react";
import { useAccount } from "wagmi";
import { useMiniApp } from "./providers/MiniAppProvider";
import { useArtworksForSale, useAllArtists, useTotalSupply } from "./hooks/useContract";
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

  const artworks = (artworksData as Artwork[]) || [];
  const artistCount = (artistsData as string[])?.length || 0;
  const nftCount = totalSupply ? Number(totalSupply) : 0;

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
            <Link href="/gallery" className={styles.primaryButton}>
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
            <Link href="/gallery" className={styles.seeAll}>
              See all
            </Link>
          </div>
          <GalleryGrid 
            artworks={artworks.slice(0, 8)} 
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
