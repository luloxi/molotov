'use client';

import { useParams } from 'next/navigation';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import { useArtistProfile, useArtistTokens, useArtworks } from '../../hooks/useContract';
import { ArtistProfileHeader } from '../../components/artist';
import { GalleryGrid } from '../../components/gallery';
import { ArtistProfile, SocialLinks } from '../../types';
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

export default function ArtistPage() {
  const params = useParams();
  const artistAddress = params.address as `0x${string}`;
  const { address } = useAccount();
  
  const { data: profile, isLoading: profileLoading } = useArtistProfile(artistAddress);
  const { data: tokenIds, isLoading: tokensLoading } = useArtistTokens(artistAddress);
  const { data: artworks, isLoading: artworksLoading } = useArtworks(tokenIds as bigint[] | undefined);

  const isOwner = address?.toLowerCase() === artistAddress.toLowerCase();

  // Parse profile data
  const rawProfile = profile as RawArtistProfile | undefined;
  
  let parsedSocialLinks: SocialLinks = {};
  try {
    if (rawProfile?.socialLinks) {
      parsedSocialLinks = JSON.parse(rawProfile.socialLinks) as SocialLinks;
    }
  } catch {
    parsedSocialLinks = {};
  }
  
  const artistProfile: ArtistProfile | null = rawProfile ? {
    wallet: rawProfile.wallet,
    name: rawProfile.name,
    bio: rawProfile.bio,
    profileImageHash: rawProfile.profileImageHash,
    socialLinks: parsedSocialLinks,
    totalSales: rawProfile.totalSales,
    totalArtworks: rawProfile.totalArtworks,
    isVerified: rawProfile.isVerified,
    registeredAt: rawProfile.registeredAt,
  } : null;

  if (profileLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Loading artist profile...</p>
        </div>
      </div>
    );
  }

  if (!artistProfile || !artistProfile.name) {
    return (
      <div className={styles.container}>
        <div className={styles.notFound}>
          <h1>Artist Not Found</h1>
          <p>This artist hasn&apos;t registered yet or doesn&apos;t exist.</p>
          <Link href="/gallery" className={styles.backButton}>
            Back to Explore
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link href="/gallery" className={styles.backLink}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
          Back to Explore
        </Link>
      </header>
      
      <ArtistProfileHeader 
        artist={artistProfile}
        isOwner={isOwner}
        onEdit={() => {/* TODO: Open edit modal */}}
      />
      
      <section className={styles.artworksSection}>
        <h2 className={styles.sectionTitle}>
          Artworks ({artworks?.length || 0})
        </h2>
        <GalleryGrid 
          artworks={artworks || []} 
          isLoading={tokensLoading || artworksLoading}
          showFilters={false}
        />
      </section>
    </div>
  );
}
