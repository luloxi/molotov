'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { Artwork } from '../../types';
import { getIPFSUrl, getNextIPFSUrl } from '../../services/ipfs';
import { formatPrice, truncateAddress } from '../../services/contract';
import { useArtistProfile } from '../../hooks/useContract';
import { useEthPrice } from '../../hooks/useEthPrice';
import styles from './ArtworkCard.module.css';

interface ArtworkStats {
  views: number;
  likes: number;
  liked: boolean;
}

interface ArtworkCardProps {
  artwork: Artwork;
  showArtist?: boolean;
}

export function ArtworkCard({ artwork, showArtist = true }: ArtworkCardProps) {
  const { address } = useAccount();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [stats, setStats] = useState<ArtworkStats>({ views: 0, likes: 0, liked: false });
  const [isLiking, setIsLiking] = useState(false);
  const { convertEthToUsd } = useEthPrice();
  
  // Fetch artist profile to get their name
  const { data: artistProfile } = useArtistProfile(artwork.artist);
  const artistName = artistProfile?.name || truncateAddress(artwork.artist);
  
  const [imageUrl, setImageUrl] = useState(() => getIPFSUrl(artwork.ipfsHash));
  const tokenIdStr = artwork.tokenId.toString();
  
  // Fetch stats on mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const statsRes = await fetch(`/api/artwork/${tokenIdStr}/stats`);
        const statsData = await statsRes.json();
        
        let liked = false;
        if (address) {
          const likeRes = await fetch(`/api/artwork/${tokenIdStr}/like?userId=${address}`);
          const likeData = await likeRes.json();
          liked = likeData.liked;
        }
        
        setStats({
          views: statsData.views || 0,
          likes: statsData.likes || 0,
          liked,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };
    
    fetchStats();
  }, [tokenIdStr, address]);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!address) {
      alert('Connect your wallet to like artworks');
      return;
    }
    
    if (isLiking) return;
    
    try {
      setIsLiking(true);
      const res = await fetch(`/api/artwork/${tokenIdStr}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: address }),
      });
      const data = await res.json();
      
      setStats(prev => ({
        ...prev,
        likes: data.likes,
        liked: data.liked,
      }));
    } catch (error) {
      console.error('Error liking:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const shareUrl = `${window.location.origin}/artwork/${tokenIdStr}`;
    const shareText = `Check out "${artwork.title}" on Molotov Gallery`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: artwork.title,
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        // User cancelled or error
        if ((error as Error).name !== 'AbortError') {
          // Fallback to clipboard
          await navigator.clipboard.writeText(shareUrl);
          alert('Link copied to clipboard!');
        }
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard!');
    }
  };

  const formatCount = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };
  
  return (
    <Link href={`/artwork/${tokenIdStr}`} className={styles.card}>
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
            onError={() => {
              const next = getNextIPFSUrl(imageUrl);
              if (next) {
                setImageUrl(next);
              } else {
                setImageError(true);
              }
            }}
          />
        )}
      </div>
      
      <div className={styles.info}>
        <h3 className={styles.title}>{artwork.title}</h3>
        
        {showArtist && (
          <p className={styles.artist}>
            by {artistName}
          </p>
        )}
        
        {/* Stats row */}
        <div className={styles.statsRow}>
          <div className={styles.statItem}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            <span>{formatCount(stats.views)}</span>
          </div>
          <div className={styles.statItem}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill={stats.liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <span>{formatCount(stats.likes)}</span>
          </div>
        </div>
        
        <div className={styles.footer}>
          <div className={styles.priceInfo}>
            {artwork.isForSale ? (
              <>
                <span className={styles.forSaleTag}>For Sale</span>
                <div className={styles.priceContainer}>
                  <span className={styles.price}>
                    {formatPrice(artwork.price)} ETH
                  </span>
                  {convertEthToUsd(formatPrice(artwork.price)) && (
                    <span className={styles.usdPrice}>
                      {convertEthToUsd(formatPrice(artwork.price))}
                    </span>
                  )}
                </div>
              </>
            ) : (
              <span className={styles.notForSale}>Not for sale</span>
            )}
          </div>
          
          {artwork.totalEditions > BigInt(1) && (
            <span className={styles.edition}>
              {artwork.editionNumber.toString()}/{artwork.totalEditions.toString()}
            </span>
          )}
        </div>
        
        {/* Action buttons */}
        <div className={styles.actions}>
          <button 
            className={`${styles.actionButton} ${stats.liked ? styles.liked : ''}`}
            onClick={handleLike}
            disabled={isLiking}
            aria-label={stats.liked ? 'Unlike' : 'Like'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill={stats.liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <span>{stats.liked ? 'Liked' : 'Like'}</span>
          </button>
          <button 
            className={styles.actionButton}
            onClick={handleShare}
            aria-label="Share"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="18" cy="5" r="3"/>
              <circle cx="6" cy="12" r="3"/>
              <circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
            <span>Share</span>
          </button>
        </div>
      </div>
    </Link>
  );
}
