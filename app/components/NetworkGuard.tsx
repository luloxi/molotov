'use client';

import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import styles from './NetworkGuard.module.css';

interface NetworkGuardProps {
  children: React.ReactNode;
}

export function NetworkGuard({ children }: NetworkGuardProps) {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();

  const isCorrectNetwork = chainId === baseSepolia.id;

  if (!isConnected) {
    return <>{children}</>;
  }

  if (!isCorrectNetwork) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.icon}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <h2>Wrong Network</h2>
          <p>
            Please switch to <strong>Base Sepolia</strong> to use this app.
          </p>
          <p className={styles.currentNetwork}>
            Current network: Chain ID {chainId}
          </p>
          <button
            onClick={() => switchChain({ chainId: baseSepolia.id })}
            disabled={isPending}
            className={styles.switchButton}
          >
            {isPending ? 'Switching...' : 'Switch to Base Sepolia'}
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
