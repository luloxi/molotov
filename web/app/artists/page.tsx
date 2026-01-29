'use client';

import { useState, useMemo } from 'react';
import { useAllArtists, useArtistProfile } from '../hooks/useContract';
import { ArtistCard } from '../components/artist';
import { ArtistProfile, SocialLinks } from '../types';
import styles from './page.module.css';

interface RawArtistProfile {
  wallet: `0x${string}`;
  name: string;
  bio: string;
  profileImageHash: string;
  socialLinks: string;
  totalSales: bigint;
  totalArtworks: bigint;
  isVerified: boolean;
  registeredAt: bigint;
}

function ArtistCardWrapper({ address, searchQuery }: { address: `0x${string}`; searchQuery: string }) {
  const { data: profile, isLoading } = useArtistProfile(address);

  if (isLoading) {
    return <div className={styles.cardSkeleton}><div className={styles.skeletonPulse} /></div>;
  }

  const rawProfile = profile as RawArtistProfile | undefined;
  if (!rawProfile || !rawProfile.name) return null;

  // Filter by search query
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    const matchesName = rawProfile.name.toLowerCase().includes(query);
    const matchesAddress = address.toLowerCase().includes(query);
    if (!matchesName && !matchesAddress) return null;
  }

  let parsedSocialLinks: SocialLinks = {};
  try {
    if (rawProfile.socialLinks) {
      parsedSocialLinks = JSON.parse(rawProfile.socialLinks) as SocialLinks;
    }
  } catch {
    parsedSocialLinks = {};
  }

  const artistProfile: ArtistProfile = {
    wallet: rawProfile.wallet,
    name: rawProfile.name,
    bio: rawProfile.bio,
    profileImageHash: rawProfile.profileImageHash,
    socialLinks: parsedSocialLinks,
    totalSales: rawProfile.totalSales,
    totalArtworks: rawProfile.totalArtworks,
    isVerified: rawProfile.isVerified,
    registeredAt: rawProfile.registeredAt,
  };

  return <ArtistCard artist={artistProfile} />;
}

export default function ArtistsPage() {
  const { data: artists, isLoading } = useAllArtists();
  const [searchQuery, setSearchQuery] = useState('');

  const artistAddresses = useMemo(() => {
    return (artists as `0x${string}`[] | undefined) || [];
  }, [artists]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Artists</h1>
        <p className={styles.subtitle}>
          Discover {artistAddresses.length || 0} registered artists on Molotov Gallery
        </p>
      </header>

      <div className={styles.searchBar}>
        <svg className={styles.searchIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          placeholder="Search by name or wallet address..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {isLoading ? (
        <div className={styles.grid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={styles.cardSkeleton}>
              <div className={styles.skeletonPulse} />
            </div>
          ))}
        </div>
      ) : artistAddresses.length === 0 ? (
        <div className={styles.empty}>
          <p>No artists have registered yet.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {artistAddresses.map((address) => (
            <ArtistCardWrapper
              key={address}
              address={address}
              searchQuery={searchQuery}
            />
          ))}
        </div>
      )}
    </div>
  );
}
