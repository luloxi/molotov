'use client';

import Link from 'next/link';
import { useTransactionMonitor } from '../../hooks/useTransactionMonitor';
import { truncateAddress } from '../../services/contract';
import { formatPrice } from '../../services/contract';
import { TransactionEvent } from '../../types';
import styles from './TransactionFeed.module.css';

export function TransactionFeed() {
  const { events, isLoading, refresh } = useTransactionMonitor();

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'mint':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        );
      case 'purchase':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
          </svg>
        );
      case 'register':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
        );
      default:
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        );
    }
  };

  const renderAddressLink = (address: `0x${string}`, displayName?: string) => {
    return (
      <Link href={`/artist/${address}`} className={styles.addressLink} onClick={(e) => e.stopPropagation()}>
        {displayName || truncateAddress(address)}
      </Link>
    );
  };

  const renderArtworkLink = (tokenId: bigint, title?: string) => {
    return (
      <Link href={`/artwork/${tokenId.toString()}`} className={styles.artworkLink} onClick={(e) => e.stopPropagation()}>
        {title ? `"${title}"` : `#${tokenId.toString()}`}
      </Link>
    );
  };

  const getEventText = (event: TransactionEvent) => {
    switch (event.type) {
      case 'mint':
        return (
          <>
            {renderAddressLink(event.from, event.artistName)}
            {' minted a new artwork '}
            {event.tokenId !== undefined && renderArtworkLink(event.tokenId, event.artworkTitle)}
          </>
        );
      case 'purchase':
        return (
          <>
            {renderAddressLink(event.to || event.from, event.buyerName)}
            {' purchased '}
            {event.tokenId !== undefined && renderArtworkLink(event.tokenId, event.artworkTitle)}
            {' from '}
            {renderAddressLink(event.from, event.artistName)}
            {event.price && (
              <span className={styles.price}> for {formatPrice(event.price)} ETH</span>
            )}
          </>
        );
      case 'register':
        return (
          <>
            {renderAddressLink(event.from, event.artistName)}
            {' joined as an artist'}
          </>
        );
      default:
        return 'Unknown event';
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'mint':
        return styles.mint;
      case 'purchase':
        return styles.purchase;
      case 'register':
        return styles.register;
      default:
        return '';
    }
  };

  const timeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Live Activity</h2>
        <button onClick={refresh} className={styles.refreshButton} disabled={isLoading}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className={isLoading ? styles.spinning : ''}>
            <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
          </svg>
        </button>
      </div>

      {isLoading && events.length === 0 ? (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Loading activity...</p>
        </div>
      ) : events.length === 0 ? (
        <div className={styles.empty}>
          <p>No recent activity</p>
          <span>Transactions will appear here in real-time</span>
        </div>
      ) : (
        <div className={styles.feed}>
          {events.map((event) => (
            <div
              key={event.id}
              className={`${styles.event} ${getEventColor(event.type)}`}
            >
              <div className={styles.iconWrapper}>
                {getEventIcon(event.type)}
              </div>
              <div className={styles.eventContent}>
                <p className={styles.eventText}>{getEventText(event)}</p>
                <span className={styles.eventTime}>{timeAgo(event.timestamp)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
