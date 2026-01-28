'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import { useArtwork, useTokenOwner, useArtistProfile, usePurchaseArtwork, useUpdateListing } from '../../hooks/useContract';
import { getIPFSUrl } from '../../services/ipfs';
import { formatPrice, truncateAddress, formatTimestamp } from '../../services/contract';
import styles from './page.module.css';

export default function ArtworkPage() {
  const params = useParams();
  const tokenId = BigInt(params.id as string);
  const { address, isConnected } = useAccount();
  
  const { data: artwork, isLoading: artworkLoading } = useArtwork(tokenId);
  const { data: owner } = useTokenOwner(tokenId);
  const { data: artistProfile } = useArtistProfile(artwork?.artist);
  
  const { purchase, isPending: purchasePending, isConfirming: purchaseConfirming } = usePurchaseArtwork();
  const { updateListing, isPending: listingPending, isConfirming: listingConfirming } = useUpdateListing();
  
  const [showListingModal, setShowListingModal] = useState(false);
  const [newPrice, setNewPrice] = useState('');
  const [newForSale, setNewForSale] = useState(true);
  
  const [imageLoaded, setImageLoaded] = useState(false);

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

  const imageUrl = getIPFSUrl(artwork.ipfsHash);
  const isOwner = owner && address && owner.toLowerCase() === address.toLowerCase();
  const _isArtist = artwork.artist.toLowerCase() === address?.toLowerCase();
  const isGif = artwork.mediaType === 'image/gif';

  const handlePurchase = () => {
    if (!artwork.isForSale) return;
    purchase(tokenId, artwork.price);
  };

  const handleUpdateListing = () => {
    updateListing(tokenId, newPrice, newForSale);
    setShowListingModal(false);
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
            />
            {isGif && <span className={styles.gifBadge}>GIF</span>}
          </div>
        </div>
        
        <div className={styles.detailsSection}>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>{artwork.title}</h1>
            {artwork.totalEditions > BigInt(1) && (
              <span className={styles.edition}>
                Edition {artwork.editionNumber.toString()}/{artwork.totalEditions.toString()}
              </span>
            )}
          </div>
          
          <Link href={`/artist/${artwork.artist}`} className={styles.artistInfo}>
            <div className={styles.artistAvatar}>
              {artistProfile?.name?.charAt(0) || '?'}
            </div>
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
              <span className={styles.detailLabel}>Created</span>
              <span className={styles.detailValue}>{formatTimestamp(artwork.createdAt)}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Media Type</span>
              <span className={styles.detailValue}>{artwork.mediaType}</span>
            </div>
          </div>
          
          <div className={styles.priceSection}>
            {artwork.isForSale ? (
              <>
                <div className={styles.price}>
                  <span className={styles.priceLabel}>Price</span>
                  <span className={styles.priceValue}>{formatPrice(artwork.price)} ETH</span>
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
                  step="0.001"
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
