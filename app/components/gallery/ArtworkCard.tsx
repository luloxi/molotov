'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Artwork } from '../../types';
import { getIPFSUrl } from '../../services/ipfs';
import { formatPrice, truncateAddress } from '../../services/contract';
import styles from './ArtworkCard.module.css';

interface ArtworkCardProps {
  artwork: Artwork;
  showArtist?: boolean;
}

export function ArtworkCard({ artwork, showArtist = true }: ArtworkCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const imageUrl = getIPFSUrl(artwork.ipfsHash);
  const isGif = artwork.mediaType === 'image/gif';
  
  return (
    <Link href={`/artwork/${artwork.tokenId.toString()}`} className={styles.card}>
      <div className={styles.imageContainer}>
        {!imageLoaded && !imageError && (
          <div className={styles.skeleton} />
        )}
        {imageError ? (
          <div className={styles.errorPlaceholder}>
            <span>Failed to load</span>
          </div>
        ) : (
          <img
            src={imageUrl}
            alt={artwork.title}
            className={`${styles.image} ${imageLoaded ? styles.loaded : ''}`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        )}
        {isGif && (
          <span className={styles.gifBadge}>GIF</span>
        )}
        {artwork.isForSale && (
          <span className={styles.forSaleBadge}>For Sale</span>
        )}
      </div>
      
      <div className={styles.info}>
        <h3 className={styles.title}>{artwork.title}</h3>
        
        {showArtist && (
          <p className={styles.artist}>
            by {truncateAddress(artwork.artist)}
          </p>
        )}
        
        <div className={styles.footer}>
          {artwork.isForSale ? (
            <span className={styles.price}>
              {formatPrice(artwork.price)} ETH
            </span>
          ) : (
            <span className={styles.notForSale}>Not for sale</span>
          )}
          
          {artwork.totalEditions > BigInt(1) && (
            <span className={styles.edition}>
              {artwork.editionNumber.toString()}/{artwork.totalEditions.toString()}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
