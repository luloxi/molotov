'use client';

import { useAllTokenIds, useArtworks } from '../hooks/useContract';
import { useListingTimes } from '../hooks/useListingTimes';
import { GalleryGrid } from '../components/gallery';
import styles from './page.module.css';

export default function ExplorePage() {
  const { data: tokenIds, isLoading: idsLoading } = useAllTokenIds();
  const { data: artworks, isLoading: artworksLoading } = useArtworks(tokenIds as bigint[] | undefined);
  const { getListingTime } = useListingTimes();
  
  const isLoading = idsLoading || artworksLoading;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Explore</h1>
        <p className={styles.subtitle}>
          Explore {artworks?.length || 0} unique artworks from talented artists
        </p>
      </header>
      
      <GalleryGrid 
        artworks={artworks || []} 
        isLoading={isLoading}
        showFilters={true}
        getListingTime={getListingTime}
      />
    </div>
  );
}
