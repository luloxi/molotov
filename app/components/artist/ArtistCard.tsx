'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArtistProfile } from '../../types';
import { getIPFSUrl } from '../../services/ipfs';
import { formatPrice, truncateAddress } from '../../services/contract';
import styles from './ArtistCard.module.css';

interface ArtistCardProps {
  artist: ArtistProfile;
}

export function ArtistCard({ artist }: ArtistCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const imageUrl = artist.profileImageHash 
    ? getIPFSUrl(artist.profileImageHash) 
    : '/default-avatar.png';

  return (
    <Link href={`/artist/${artist.wallet}`} className={styles.card}>
      <div className={styles.avatarContainer}>
        {!imageLoaded && !imageError && (
          <div className={styles.skeleton} />
        )}
        {imageError ? (
          <div className={styles.avatarPlaceholder}>
            {artist.name.charAt(0).toUpperCase()}
          </div>
        ) : (
          <img
            src={imageUrl}
            alt={artist.name}
            className={`${styles.avatar} ${imageLoaded ? styles.loaded : ''}`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        )}
        {artist.isVerified && (
          <span className={styles.verifiedBadge}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
            </svg>
          </span>
        )}
      </div>
      
      <div className={styles.info}>
        <h3 className={styles.name}>{artist.name}</h3>
        <p className={styles.address}>{truncateAddress(artist.wallet)}</p>
        
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{artist.totalArtworks.toString()}</span>
            <span className={styles.statLabel}>Works</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{formatPrice(artist.totalSales)}</span>
            <span className={styles.statLabel}>ETH Sold</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
