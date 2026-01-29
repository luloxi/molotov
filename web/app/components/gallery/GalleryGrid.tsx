'use client';

import { useState, useMemo } from 'react';
import { Artwork, GalleryFilters } from '../../types';
import { ArtworkCard } from './ArtworkCard';
import { GalleryFiltersBar } from './GalleryFilters';
import styles from './GalleryGrid.module.css';

interface GalleryGridProps {
  artworks: Artwork[];
  isLoading?: boolean;
  title?: string;
  showFilters?: boolean;
  /** Optional function to get listing time for an artwork (used for "newest" sort) */
  getListingTime?: (tokenId: string | bigint) => number | undefined;
}

export function GalleryGrid({ 
  artworks, 
  isLoading = false, 
  title,
  showFilters = true,
  getListingTime
}: GalleryGridProps) {
  const [filters, setFilters] = useState<GalleryFilters>({
    sortBy: 'newest',
    onlyForSale: false,
  });

  const filteredArtworks = useMemo(() => {
    let result = [...artworks];

    // Filter by sale status
    if (filters.onlyForSale) {
      result = result.filter(a => a.isForSale);
    }

    // Filter by price range
    if (filters.priceMin) {
      const minWei = BigInt(Math.floor(parseFloat(filters.priceMin) * 1e18));
      result = result.filter(a => a.price >= minWei);
    }
    if (filters.priceMax) {
      const maxWei = BigInt(Math.floor(parseFloat(filters.priceMax) * 1e18));
      result = result.filter(a => a.price <= maxWei);
    }

    // Filter by media type
    if (filters.mediaType && filters.mediaType.length > 0) {
      result = result.filter(a => filters.mediaType!.includes(a.mediaType));
    }

    // Filter by artist
    if (filters.artist) {
      result = result.filter(a => a.artist.toLowerCase() === filters.artist!.toLowerCase());
    }

    // Sort
    switch (filters.sortBy) {
      case 'newest':
        // Use listing time if available (when artwork was listed/re-listed for sale)
        // Falls back to createdAt if no listing time found
        result.sort((a, b) => {
          const aTime = getListingTime?.(a.tokenId) ?? Number(a.createdAt) * 1000;
          const bTime = getListingTime?.(b.tokenId) ?? Number(b.createdAt) * 1000;
          return bTime - aTime;
        });
        break;
      case 'oldest':
        result.sort((a, b) => {
          const aTime = getListingTime?.(a.tokenId) ?? Number(a.createdAt) * 1000;
          const bTime = getListingTime?.(b.tokenId) ?? Number(b.createdAt) * 1000;
          return aTime - bTime;
        });
        break;
      case 'price_asc':
        result.sort((a, b) => Number(a.price - b.price));
        break;
      case 'price_desc':
        result.sort((a, b) => Number(b.price - a.price));
        break;
    }

    return result;
  }, [artworks, filters, getListingTime]);

  if (isLoading) {
    return (
      <div className={styles.container}>
        {title && <h2 className={styles.title}>{title}</h2>}
        <div className={styles.grid}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={styles.skeletonCard}>
              <div className={styles.skeletonImage} />
              <div className={styles.skeletonInfo}>
                <div className={styles.skeletonTitle} />
                <div className={styles.skeletonArtist} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {title && <h2 className={styles.title}>{title}</h2>}
      
      {showFilters && (
        <GalleryFiltersBar filters={filters} onChange={setFilters} />
      )}
      
      {filteredArtworks.length === 0 ? (
        <div className={styles.empty}>
          <p>No artworks found</p>
          {filters.onlyForSale && (
            <button 
              onClick={() => setFilters(f => ({ ...f, onlyForSale: false }))}
              className={styles.clearFilter}
            >
              Show all artworks
            </button>
          )}
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredArtworks.map((artwork) => (
            <ArtworkCard key={artwork.tokenId.toString()} artwork={artwork} />
          ))}
        </div>
      )}
    </div>
  );
}
