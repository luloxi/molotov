"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useChainId,
  useSwitchChain,
} from "wagmi";
import { baseSepolia, base } from "wagmi/chains";
import { truncateAddress } from "../services/contract";
import { Moon, Sun } from "lucide-react";
import styles from "./Navigation.module.css";

export function Navigation() {
  const pathname = usePathname();
  const chainId = useChainId();
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending, error: connectError } = useConnect({
    mutation: {
      onSuccess: () => {
        setShowConnectModal(false);
      },
      onError: (error) => {
        console.error('Connection error:', error);
      },
    },
  });
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const [showWalletMenu, setShowWalletMenu] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Debug: Log available connectors
  useEffect(() => {
    if (mounted && connectors.length > 0) {
      console.log('Available connectors:', connectors.map(c => ({ name: c.name, id: c.uid, ready: c.ready })));
    }
  }, [mounted, connectors]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored = window.localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") {
      applyTheme(stored);
      return;
    }

    // Default to light theme when no preference is stored
    applyTheme("light");
  }, []);

  useEffect(() => {
    if (!showWalletMenu) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(`.${styles.walletWrapper}`)) {
        setShowWalletMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showWalletMenu]);

  const applyTheme = (next: "light" | "dark") => {
    setTheme(next);
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", next);
    }
    if (typeof window !== "undefined") {
      window.localStorage.setItem("theme", next);
    }
  };

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    applyTheme(next);
  };

  const getConnectorIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('metamask')) {
      return (
        <svg width="28" height="28" viewBox="0 0 318.6 318.6" fill="none">
          <path fill="#E2761B" stroke="#E2761B" strokeLinecap="round" strokeLinejoin="round" d="m274.1 35.5-99.5 73.9L193 65.8z"/>
          <path fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round" d="m44.4 35.5 98.7 74.6-17.5-44.3zm193.9 171.3-26.5 40.6 56.7 15.6 16.3-55.3zm-204.4.9L50.1 263l56.7-15.6-26.5-40.6z"/>
          <path fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round" d="m103.6 138.2-15.8 23.9 56.3 2.5-2-60.5zm111.3 0-39-34.8-1.3 61.2 56.2-2.5zM106.8 247.4l33.8-16.5-29.2-22.8zm71.1-16.5 33.9 16.5-4.7-39.3z"/>
          <path fill="#D7C1B3" stroke="#D7C1B3" strokeLinecap="round" strokeLinejoin="round" d="m211.8 247.4-33.9-16.5 2.7 22.1-.3 9.3zm-105 0 31.5 14.9-.2-9.3 2.5-22.1z"/>
          <path fill="#233447" stroke="#233447" strokeLinecap="round" strokeLinejoin="round" d="m138.8 193.5-28.2-8.3 19.9-9.1zm40.9 0 8.3-17.4 20 9.1z"/>
          <path fill="#CD6116" stroke="#CD6116" strokeLinecap="round" strokeLinejoin="round" d="m106.8 247.4 4.8-40.6-31.3.9zM207 206.8l4.8 40.6 26.5-39.7zm23.8-44.7-56.2 2.5 5.2 28.9 8.3-17.4 20 9.1zm-120.2 23.1 20-9.1 8.2 17.4 5.3-28.9-56.3-2.5z"/>
          <path fill="#E4751F" stroke="#E4751F" strokeLinecap="round" strokeLinejoin="round" d="m87.8 162.1 23.6 46-.8-22.9zm120.3 23.1-1 22.9 23.7-46zm-64-20.6-5.3 28.9 6.6 34.1 1.5-44.9zm30.5 0-2.7 18 1.2 45 6.7-34.1z"/>
          <path fill="#F6851B" stroke="#F6851B" strokeLinecap="round" strokeLinejoin="round" d="m179.8 193.5-6.7 34.1 4.8 3.3 29.2-22.8 1-22.9zm-69.2-8.3.8 22.9 29.2 22.8 4.8-3.3-6.6-34.1z"/>
          <path fill="#C0AD9E" stroke="#C0AD9E" strokeLinecap="round" strokeLinejoin="round" d="m180.3 262.3.3-9.3-2.5-2.2h-37.7l-2.3 2.2.2 9.3-31.5-14.9 11 9 22.3 15.5h38.3l22.4-15.5 11-9z"/>
          <path fill="#161616" stroke="#161616" strokeLinecap="round" strokeLinejoin="round" d="m177.9 230.9-4.8-3.3h-27.7l-4.8 3.3-2.5 22.1 2.3-2.2h37.7l2.5 2.2z"/>
          <path fill="#763D16" stroke="#763D16" strokeLinecap="round" strokeLinejoin="round" d="m278.3 114.2 8.5-40.8-12.7-37.9-96.2 71.4 37 31.3 52.3 15.3 11.6-13.5-5-3.6 8-7.3-6.2-4.8 8-6.1zM31.8 73.4l8.5 40.8-5.4 4 8 6.1-6.1 4.8 8 7.3-5 3.6 11.5 13.5 52.3-15.3 37-31.3-96.2-71.4z"/>
          <path fill="#F6851B" stroke="#F6851B" strokeLinecap="round" strokeLinejoin="round" d="m267.2 153.5-52.3-15.3 15.9 23.9-23.7 46 31.2-.4h46.5zm-163.6-15.3-52.3 15.3-17.4 54.2h46.4l31.1.4-23.6-46zm71 26.4 3.3-57.7 15.2-41.1h-67.5l15 41.1 3.5 57.7 1.2 18.2.1 44.8h27.7l.2-44.8z"/>
        </svg>
      );
    }
    if (n.includes('coinbase')) {
      return (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <rect width="28" height="28" rx="6" fill="#0052FF"/>
          <path d="M14 5.5C9.3 5.5 5.5 9.3 5.5 14s3.8 8.5 8.5 8.5 8.5-3.8 8.5-8.5S18.7 5.5 14 5.5zm-2.1 5.4h4.2c.6 0 1 .5 1 1v4.2c0 .6-.5 1-1 1h-4.2c-.6 0-1-.5-1-1v-4.2c0-.5.5-1 1-1z" fill="#fff"/>
        </svg>
      );
    }
    if (n.includes('farcaster')) {
      return (
        <svg width="28" height="28" viewBox="0 0 1000 1000" fill="none">
          <rect width="1000" height="1000" rx="200" fill="#8465CB"/>
          <path d="M257.778 155.556H742.222V844.444H671.111V528.889H670.414C662.554 441.677 589.258 373.333 500 373.333C410.742 373.333 337.446 441.677 329.586 528.889H328.889V844.444H257.778V155.556Z" fill="white"/>
          <path d="M128.889 253.333L157.778 351.111H182.222V746.667C169.949 746.667 160 756.616 160 768.889V795.556H155.556C143.283 795.556 133.333 805.505 133.333 817.778V844.444H382.222V817.778C382.222 805.505 372.273 795.556 360 795.556H355.556V768.889C355.556 756.616 345.606 746.667 333.333 746.667H306.667V253.333H128.889Z" fill="white"/>
          <path d="M693.333 746.667C681.06 746.667 671.111 756.616 671.111 768.889V795.556H666.667C654.394 795.556 644.444 805.505 644.444 817.778V844.444H893.333V817.778C893.333 805.505 883.384 795.556 871.111 795.556H866.667V768.889C866.667 756.616 856.717 746.667 844.444 746.667V351.111H868.889L897.778 253.333H720V746.667H693.333Z" fill="white"/>
        </svg>
      );
    }
    // Generic wallet icon for injected/unknown
    return (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
        <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
      </svg>
    );
  };

  const currentChain = chainId === base.id ? base : baseSepolia;
  const isWrongNetwork = isConnected && chainId !== baseSepolia.id && chainId !== base.id;

  const handleDisconnect = (e: React.MouseEvent) => {
    e.stopPropagation();
    disconnect();
    setShowWalletMenu(false);
  };

  return (
    <>
      <nav className={styles.nav}>
        <Link href="/" className={styles.logo}>
          <Image
            src="/full-logo.png"
            alt="Molotov Gallery"
            width={200}
            height={46}
            priority
          />
        </Link>
        
        <div className={styles.links}>
          <Link 
            href="/" 
            className={`${styles.link} ${pathname === '/' ? styles.active : ''}`}
          >
            HOME
          </Link>
          <Link
            href="/explore"
            className={`${styles.link} ${pathname === '/explore' ? styles.active : ''}`}
          >
            EXPLORE
          </Link>
          <Link
            href="/artists"
            className={`${styles.link} ${pathname === '/artists' ? styles.active : ''}`}
          >
            ARTISTS
          </Link>
          {mounted && isConnected && (
            <Link
              href="/mynfts"
              className={`${styles.link} ${pathname === '/mynfts' ? styles.active : ''}`}
            >
              MY NFTS
            </Link>
          )}
          <Link
            href="/mint"
            className={`${styles.link} ${styles.createButton} ${pathname === '/mint' ? styles.active : ''}`}
          >
            Create NFT
          </Link>
        </div>
        
        <div className={styles.actions}>
          {mounted && isConnected && address ? (
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
                  <div className={styles.walletMenu} onClick={(e) => e.stopPropagation()}>
                    <button onClick={handleDisconnect} type="button">
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
              {connectError && (
                <div className={styles.errorMessage}>
                  <p>Connection failed: {connectError.message || 'Unknown error'}</p>
                  <p className={styles.errorHint}>Please try again or select a different wallet</p>
                </div>
              )}
              {connectors.length === 0 ? (
                <div className={styles.emptyConnectors}>
                  <p>No wallets available</p>
                  <p className={styles.emptyHint}>Please install a wallet extension or use the Farcaster app</p>
                </div>
              ) : (
                connectors
                  .filter((connector) => connector.ready !== false)
                  .map((connector) => (
                  <button
                    key={connector.uid}
                    onClick={() => {
                      connect({ 
                        connector,
                        chainId: baseSepolia.id,
                      });
                      // Modal will close automatically via onSuccess callback
                      // If error occurs, onError callback will log it and modal stays open
                    }}
                    className={styles.connectorButton}
                    disabled={isPending}
                  >
                  <span className={styles.connectorInfo}>
                    {connector.icon ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={connector.icon} alt="" width={28} height={28} className={styles.connectorIcon} />
                    ) : (
                      <span className={styles.connectorIconFallback}>
                        {getConnectorIcon(connector.name)}
                      </span>
                    )}
                    <span className={styles.connectorName}>{connector.name}</span>
                  </span>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                  </svg>
                  </button>
                ))
              )}
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
