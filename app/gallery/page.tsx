'use client';

import { useAllTokenIds } from '../hooks/useContract';
import { GalleryGrid } from '../components/gallery';
import { Artwork } from '../types';
import styles from './page.module.css';

export default function GalleryPage() {
  const { data: tokenIds, isLoading: idsLoading } = useAllTokenIds();
  const artworks: Artwork[] = [];
  const isLoading = idsLoading;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Gallery</h1>
        <p className={styles.subtitle}>
          Explore {(tokenIds as bigint[])?.length || 0} unique artworks from talented artists
        </p>
      </header>
      
      <GalleryGrid 
        artworks={artworks} 
        isLoading={isLoading || idsLoading}
        showFilters={true}
      />
    </div>
  );
}
