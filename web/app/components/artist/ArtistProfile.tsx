'use client';

import { useState } from 'react';
import { ArtistProfile as ArtistProfileType, SocialLinks } from '../../types';
import { getIPFSUrl } from '../../services/ipfs';
import { formatPrice, formatTimestamp } from '../../services/contract';
import styles from './ArtistProfile.module.css';

interface ArtistProfileProps {
  artist: ArtistProfileType;
  isOwner?: boolean;
  onEdit?: () => void;
}

export function ArtistProfileHeader({ artist, isOwner, onEdit }: ArtistProfileProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const imageUrl = artist.profileImageHash 
    ? getIPFSUrl(artist.profileImageHash) 
    : null;

  let socialLinks: SocialLinks = {};
  try {
    socialLinks = JSON.parse(artist.socialLinks.toString() || '{}');
  } catch {
    socialLinks = {};
  }

  return (
    <div className={styles.header}>
      <div className={styles.avatarSection}>
        <div className={styles.avatarContainer}>
          {imageUrl && !imageError ? (
            <>
              {!imageLoaded && <div className={styles.skeleton} />}
              <img
                src={imageUrl}
                alt={artist.name}
                className={`${styles.avatar} ${imageLoaded ? styles.loaded : ''}`}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
              />
            </>
          ) : (
            <div className={styles.avatarPlaceholder}>
              {artist.name.charAt(0).toUpperCase()}
            </div>
          )}
          {artist.isVerified && (
            <span className={styles.verifiedBadge}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
              </svg>
            </span>
          )}
        </div>
      </div>
      
      <div className={styles.infoSection}>
        <div className={styles.nameRow}>
          <h1 className={styles.name}>
            {artist.name}
            {artist.isVerified && <span className={styles.verifiedText}>Verified</span>}
          </h1>
          {isOwner && (
            <button onClick={onEdit} className={styles.editButton}>
              Edit Profile
            </button>
          )}
        </div>
        
        <p className={styles.address}>{artist.wallet}</p>
        
        {artist.bio && (
          <p className={styles.bio}>{artist.bio}</p>
        )}
        
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{artist.totalArtworks.toString()}</span>
            <span className={styles.statLabel}>Artworks</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{formatPrice(artist.totalSales)} ETH</span>
            <span className={styles.statLabel}>Total Sales</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>
              {formatTimestamp(artist.registeredAt)}
            </span>
            <span className={styles.statLabel}>Joined</span>
          </div>
        </div>
        
        {Object.keys(socialLinks).length > 0 && (
          <div className={styles.socialLinks}>
            {socialLinks.twitter && (
              <a 
                href={`https://twitter.com/${socialLinks.twitter}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.socialLink}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
            )}
            {socialLinks.instagram && (
              <a 
                href={`https://instagram.com/${socialLinks.instagram}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.socialLink}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
            )}
            {socialLinks.farcaster && (
              <a 
                href={`https://warpcast.com/${socialLinks.farcaster}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.socialLink}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.24 2.4H5.76C3.96 2.4 2.4 3.96 2.4 5.76v12.48c0 1.8 1.56 3.36 3.36 3.36h12.48c1.8 0 3.36-1.56 3.36-3.36V5.76c0-1.8-1.56-3.36-3.36-3.36zM12 8.4c-1.98 0-3.6 1.62-3.6 3.6s1.62 3.6 3.6 3.6 3.6-1.62 3.6-3.6-1.62-3.6-3.6-3.6z"/>
                </svg>
              </a>
            )}
            {socialLinks.website && (
              <a 
                href={socialLinks.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.socialLink}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                </svg>
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
