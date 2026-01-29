'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import { useArtwork, useTokenOwner, useArtistProfile, usePurchaseArtwork, useUpdateListing } from '../../hooks/useContract';
import { useArtworkStats } from '../../hooks/useArtworkStats';
import { useCategories, useArtworkCategories } from '../../hooks/useCategories';
import { useEthPrice } from '../../hooks/useEthPrice';
import { getIPFSUrl, getNextIPFSUrl } from '../../services/ipfs';
import { formatPrice, truncateAddress, formatTimestamp } from '../../services/contract';
import type { ArtworkAttribute } from '../../types';
import styles from './page.module.css';

export default function ArtworkPage() {
  const params = useParams();
  const tokenId = BigInt(params.id as string);
  const { address, isConnected } = useAccount();
  
  const { data: artwork, isLoading: artworkLoading, refetch: refetchArtwork } = useArtwork(tokenId);
  const { data: owner } = useTokenOwner(tokenId);
  const { data: artistProfile } = useArtistProfile(artwork?.artist);
  const { stats, recordView, toggleLike, isLiking } = useArtworkStats(tokenId);
  const { categories: artworkCategories, setCategories: setArtworkCategory } = useArtworkCategories(tokenId.toString());
  const artworkCategory = artworkCategories.length > 0 ? artworkCategories[0] : null;
  const { categories: allCategories } = useCategories();

  const { purchase, isPending: purchasePending, isConfirming: purchaseConfirming } = usePurchaseArtwork();
  const { updateListing, isPending: listingPending, isConfirming: listingConfirming, isSuccess: listingSuccess } = useUpdateListing();
  const { convertEthToUsd } = useEthPrice();
  
  const [showListingModal, setShowListingModal] = useState(false);
  const [newPrice, setNewPrice] = useState('');
  const [newForSale, setNewForSale] = useState(true);
  const [showCategorySelect, setShowCategorySelect] = useState(false);

  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarError, setAvatarError] = useState(false);
  const [attributes, setAttributes] = useState<ArtworkAttribute[]>([]);

  // Update image URL when artwork loads
  useEffect(() => {
    if (artwork?.ipfsHash) {
      setImageUrl(getIPFSUrl(artwork.ipfsHash));
    }
  }, [artwork?.ipfsHash]);

  // Update avatar URL when artist profile loads
  useEffect(() => {
    if (artistProfile?.profileImageHash) {
      setAvatarUrl(getIPFSUrl(artistProfile.profileImageHash));
      setAvatarError(false);
    }
  }, [artistProfile?.profileImageHash]);

  // Fetch metadata from IPFS to get attributes
  useEffect(() => {
    const fetchMetadata = async () => {
      if (!artwork?.metadataHash) return;
      
      try {
        const metadataUrl = getIPFSUrl(artwork.metadataHash);
        const response = await fetch(metadataUrl);
        if (response.ok) {
          const metadata = await response.json();
          if (metadata.attributes && Array.isArray(metadata.attributes)) {
            // Filter out system attributes that are already displayed elsewhere
            const systemTraits = ['Artist', 'Edition', 'Media Type'];
            const customAttributes = metadata.attributes.filter(
              (attr: ArtworkAttribute) => !systemTraits.includes(attr.trait_type)
            );
            setAttributes(customAttributes);
          }
        }
      } catch (error) {
        console.error('Failed to fetch metadata:', error);
      }
    };
    
    fetchMetadata();
  }, [artwork?.metadataHash]);

  // Refetch artwork data after listing update is confirmed
  useEffect(() => {
    if (listingSuccess) {
      refetchArtwork();
    }
  }, [listingSuccess, refetchArtwork]);

  // Record view when page loads
  useEffect(() => {
    if (artwork) {
      recordView();
    }
  }, [artwork, recordView]);

  if (artworkLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Loading artwork...</p>
        </div>
      </div>
    );
  }

  if (!artwork) {
    return (
      <div className={styles.container}>
        <div className={styles.notFound}>
          <h1>Artwork Not Found</h1>
          <p>This artwork doesn&apos;t exist or has been removed.</p>
          <Link href="/gallery" className={styles.backButton}>
            Back to Explore
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = owner && address && owner.toLowerCase() === address.toLowerCase();
  const _isArtist = artwork.artist.toLowerCase() === address?.toLowerCase();
  const isGif = artwork.mediaType === 'image/gif';
  const tokenIdStr = tokenId.toString();

  const handlePurchase = () => {
    if (!artwork.isForSale) return;
    purchase(tokenId, artwork.price);
  };

  const handleUpdateListing = () => {
    updateListing(tokenId, newPrice, newForSale);
    setShowListingModal(false);
  };

  const handleCategoryChange = async (categoryId: string) => {
    try {
      await setArtworkCategory(categoryId ? [categoryId] : []);
      setShowCategorySelect(false);
    } catch (err) {
      console.error('Failed to update category:', err);
    }
  };

  const handleShare = async () => {
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
        if ((error as Error).name !== 'AbortError') {
          await navigator.clipboard.writeText(shareUrl);
          alert('Link copied to clipboard!');
        }
      }
    } else {
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
    <div className={styles.container}>
      <header className={styles.header}>
        <Link href="/gallery" className={styles.backLink}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
          Back to Explore
        </Link>
      </header>
      
      <div className={styles.content}>
        <div className={styles.imageSection}>
          <div className={styles.imageContainer}>
            {!imageLoaded && <div className={styles.skeleton} />}
            <img
              src={imageUrl}
              alt={artwork.title}
              className={`${styles.image} ${imageLoaded ? styles.loaded : ''}`}
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                const next = getNextIPFSUrl(imageUrl);
                if (next) setImageUrl(next);
              }}
            />
          </div>
        </div>
        
        <div className={styles.detailsSection}>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>{artwork.title}</h1>
            <div className={styles.badges}>
              {artworkCategory && (
                <span
                  className={styles.categoryBadge}
                  style={artworkCategory.color ? { backgroundColor: artworkCategory.color } : undefined}
                >
                  {artworkCategory.name}
                </span>
              )}
              {isGif && <span className={styles.gifBadge}>GIF</span>}
              {artwork.totalEditions > BigInt(1) && (
                <span className={styles.edition}>
                  Edition {artwork.editionNumber.toString()}/{artwork.totalEditions.toString()}
                </span>
              )}
            </div>
          </div>
          
          {/* Actions and stats */}
          <div className={styles.engagementRow}>
            <div className={styles.actionButtons}>
              <button 
                className={`${styles.actionButton} ${stats.liked ? styles.liked : ''}`}
                onClick={toggleLike}
                disabled={isLiking || !isConnected}
                title={!isConnected ? 'Connect wallet to like' : undefined}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill={stats.liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                <span className={styles.actionCount}>{formatCount(stats.likes)}</span>
              </button>
              <button className={styles.actionButton} onClick={handleShare}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="18" cy="5" r="3"/>
                  <circle cx="6" cy="12" r="3"/>
                  <circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
                <span>Share</span>
              </button>
            </div>
            <div className={styles.viewsStat}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              <span>{formatCount(stats.views)}</span>
            </div>
          </div>
          
          <Link href={`/artist/${artwork.artist}`} className={styles.artistInfo}>
            {avatarUrl && !avatarError ? (
              <img
                src={avatarUrl}
                alt={artistProfile?.name || ''}
                className={styles.artistAvatarImg}
                onError={() => {
                  const next = getNextIPFSUrl(avatarUrl);
                  if (next) {
                    setAvatarUrl(next);
                  } else {
                    setAvatarError(true);
                  }
                }}
              />
            ) : (
              <div className={styles.artistAvatar}>
                {artistProfile?.name?.charAt(0) || '?'}
              </div>
            )}
            <div>
              <p className={styles.artistName}>
                {artistProfile?.name || truncateAddress(artwork.artist)}
                {artistProfile?.isVerified && (
                  <svg className={styles.verifiedIcon} width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                  </svg>
                )}
              </p>
              <p className={styles.artistAddress}>{truncateAddress(artwork.artist)}</p>
            </div>
          </Link>
          
          {artwork.description && (
            <div className={styles.description}>
              <h3>Description</h3>
              <p>{artwork.description}</p>
            </div>
          )}
          
          <div className={styles.details}>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Owner</span>
              <span className={styles.detailValue}>
                {owner ? (isOwner ? 'You' : truncateAddress(owner as string)) : 'Loading...'}
              </span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Category</span>
              {isOwner ? (
                <div className={styles.categoryEditWrapper}>
                  {showCategorySelect ? (
                    <select
                      className={styles.categorySelect}
                      value={artworkCategory?.id || ''}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      onBlur={() => setShowCategorySelect(false)}
                      autoFocus
                    >
                      <option value="">None</option>
                      {allCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  ) : (
                    <button
                      className={styles.categoryEditButton}
                      onClick={() => setShowCategorySelect(true)}
                    >
                      {artworkCategory ? artworkCategory.name : 'Set category'}
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                      </svg>
                    </button>
                  )}
                </div>
              ) : (
                <span className={styles.detailValue}>
                  {artworkCategory?.name || 'Uncategorized'}
                </span>
              )}
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Created</span>
              <span className={styles.detailValue}>{formatTimestamp(artwork.createdAt)}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Media Type</span>
              <span className={styles.detailValue}>{artwork.mediaType}</span>
            </div>
          </div>
          
          {attributes.length > 0 && (
            <div className={styles.attributesSection}>
              <h3>Attributes</h3>
              <div className={styles.attributesGrid}>
                {attributes.map((attr, index) => (
                  <div key={index} className={styles.attributeCard}>
                    <span className={styles.attributeType}>{attr.trait_type}</span>
                    <span className={styles.attributeValue}>{attr.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className={styles.priceSection}>
            {artwork.isForSale ? (
              <>
                <div className={styles.price}>
                  <span className={styles.priceLabel}>Price</span>
                  <span className={styles.priceValue}>{formatPrice(artwork.price)} ETH</span>
                  {convertEthToUsd(formatPrice(artwork.price)) && (
                    <span className={styles.priceUsd}>{convertEthToUsd(formatPrice(artwork.price))}</span>
                  )}
                </div>
                
                {isConnected && !isOwner && (
                  <button 
                    onClick={handlePurchase}
                    disabled={purchasePending || purchaseConfirming}
                    className={styles.buyButton}
                  >
                    {purchasePending ? 'Confirm in wallet...' : purchaseConfirming ? 'Processing...' : 'Buy Now'}
                  </button>
                )}
              </>
            ) : (
              <p className={styles.notForSale}>This artwork is not for sale</p>
            )}
            
            {isOwner && (
              <button 
                onClick={() => {
                  setNewPrice(formatPrice(artwork.price));
                  setNewForSale(artwork.isForSale);
                  setShowListingModal(true);
                }}
                className={styles.listButton}
              >
                {artwork.isForSale ? 'Update Listing' : 'List for Sale'}
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Listing Modal */}
      {showListingModal && (
        <div className={styles.modalOverlay} onClick={() => setShowListingModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>Update Listing</h2>
            
            <div className={styles.modalField}>
              <label>
                <input
                  type="checkbox"
                  checked={newForSale}
                  onChange={(e) => setNewForSale(e.target.checked)}
                />
                List for sale
              </label>
            </div>
            
            {newForSale && (
              <div className={styles.modalField}>
                <label>Price (ETH)</label>
                <input
                  type="number"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  placeholder="0.1"
                  min="0"
                  step="0.00001"
                />
              </div>
            )}
            
            <div className={styles.modalActions}>
              <button onClick={() => setShowListingModal(false)} className={styles.cancelButton}>
                Cancel
              </button>
              <button 
                onClick={handleUpdateListing}
                disabled={listingPending || listingConfirming}
                className={styles.confirmButton}
              >
                {listingPending ? 'Confirm...' : listingConfirming ? 'Updating...' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
