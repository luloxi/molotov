'use client';

import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { useIsRegisteredArtist } from '../hooks/useContract';
import { MintForm } from '../components/mint';
import { RegisterArtistForm } from '../components/artist';
import { NetworkGuard } from '../components/NetworkGuard';
import Link from 'next/link';
import styles from './page.module.css';

export default function MintPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const { data: isRegistered, isLoading } = useIsRegisteredArtist(address);

  if (!isConnected) {
    return (
      <div className={styles.container}>
        <div className={styles.notConnected}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
          </svg>
          <h1>Connect Your Wallet</h1>
          <p>Please connect your wallet to create and mint artworks</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link href="/" className={styles.backLink}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
          Back
        </Link>
        <h1 className={styles.title}>
          {isRegistered ? 'Create Artwork' : 'Become an Artist'}
        </h1>
      </header>
      
      <NetworkGuard>
        {isRegistered ? (
          <MintForm onSuccess={(tokenId) => router.push(`/artwork/${tokenId}`)} />
        ) : (
          <RegisterArtistForm onSuccess={() => window.location.reload()} />
        )}
      </NetworkGuard>
    </div>
  );
}
