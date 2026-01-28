'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi';
import { baseSepolia, base } from 'wagmi/chains';
import { truncateAddress } from '../services/contract';
import styles from './Navigation.module.css';

export function Navigation() {
  const pathname = usePathname();
  const chainId = useChainId();
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const [showWalletMenu, setShowWalletMenu] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);

  const currentChain = chainId === base.id ? base : baseSepolia;
  const isWrongNetwork = isConnected && chainId !== baseSepolia.id && chainId !== base.id;

  return (
    <>
      <nav className={styles.nav}>
        <Link href="/" className={styles.logo}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
          <span>Molotov</span>
        </Link>
        
        <div className={styles.links}>
          <Link 
            href="/" 
            className={`${styles.link} ${pathname === '/' ? styles.active : ''}`}
          >
            Home
          </Link>
          <Link 
            href="/gallery" 
            className={`${styles.link} ${pathname === '/gallery' ? styles.active : ''}`}
          >
            Gallery
          </Link>
          <Link 
            href="/mint" 
            className={`${styles.link} ${pathname === '/mint' ? styles.active : ''}`}
          >
            Create
          </Link>
        </div>
        
        <div className={styles.actions}>
          {isConnected && address ? (
            <>
              {isWrongNetwork ? (
                <button 
                  onClick={() => switchChain({ chainId: baseSepolia.id })}
                  className={styles.wrongNetwork}
                >
                  Wrong Network
                </button>
              ) : (
                <button 
                  onClick={() => switchChain({ chainId: chainId === baseSepolia.id ? base.id : baseSepolia.id })}
                  className={styles.networkBadge}
                >
                  {currentChain.name}
                </button>
              )}
              <div className={styles.walletWrapper}>
                <button 
                  onClick={() => setShowWalletMenu(!showWalletMenu)}
                  className={styles.walletButton}
                >
                  <span className={styles.walletDot} />
                  {truncateAddress(address)}
                </button>
                {showWalletMenu && (
                  <div className={styles.walletMenu}>
                    <button onClick={() => { disconnect(); setShowWalletMenu(false); }}>
                      Disconnect
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <button 
              onClick={() => setShowConnectModal(true)}
              className={styles.connectButton}
              disabled={isPending}
            >
              {isPending ? 'Connecting...' : 'Connect'}
            </button>
          )}
        </div>
      </nav>

      {/* Connect Modal */}
      {showConnectModal && (
        <div className={styles.modalOverlay} onClick={() => setShowConnectModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Connect Wallet</h2>
              <button onClick={() => setShowConnectModal(false)} className={styles.closeButton}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>
            <div className={styles.connectorList}>
              {connectors.map((connector) => (
                <button
                  key={connector.uid}
                  onClick={() => {
                    connect({ connector });
                    setShowConnectModal(false);
                  }}
                  className={styles.connectorButton}
                >
                  <span className={styles.connectorName}>{connector.name}</span>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                  </svg>
                </button>
              ))}
            </div>
            <p className={styles.modalFooter}>
              By connecting, you agree to the terms of service.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
