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
  const { address, isConnected, connector: activeConnector } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const [showWalletMenu, setShowWalletMenu] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
        <svg width="28" height="28" viewBox="0 0 35 33" fill="none">
          <path d="M32.96 1l-13.14 9.72 2.45-5.73L32.96 1z" fill="#E2761B" stroke="#E2761B" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M2.66 1l13.02 9.82L13.35 4.99 2.66 1zM28.23 23.53l-3.5 5.34 7.49 2.06 2.14-7.28-6.13-.12zM.69 23.65l2.13 7.28 7.47-2.06-3.48-5.34-6.12.12z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M9.93 14.42l-2.07 3.13 7.38.34-.26-7.94-5.05 4.47zM25.69 14.42l-5.13-4.56-.17 8.03 7.37-.34-2.07-3.13zM10.29 28.87l4.44-2.16-3.83-2.99-.61 5.15zM20.89 26.71l4.43 2.16-.6-5.15-3.83 2.99z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M25.32 28.87l-4.43-2.16.36 2.88-.04 1.22 4.11-1.94zM10.29 28.87l4.13 1.94-.03-1.22.34-2.88-4.44 2.16z" fill="#D7C1B3" stroke="#D7C1B3" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M14.51 21.83l-3.7-1.08 2.61-1.2 1.09 2.28zM21.11 21.83l1.09-2.28 2.62 1.2-3.71 1.08z" fill="#233447" stroke="#233447" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M10.29 28.87l.63-5.34-4.11.12 3.48 5.22zM24.7 23.53l.62 5.34 3.49-5.22-4.11-.12zM27.76 17.55l-7.37.34.68 3.94 1.09-2.28 2.62 1.2 2.98-3.2zM10.81 20.75l2.61-1.2 1.09 2.28.69-3.94-7.38-.34 2.99 3.2z" fill="#CD6116" stroke="#CD6116" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M7.82 17.55l3.1 6.05-.1-2.85-3-3.2zM24.78 20.75l-.12 2.85 3.1-6.05-2.98 3.2zM15.2 17.89l-.69 3.94.86 4.49.19-5.91-.36-2.52zM20.39 17.89l-.35 2.51.17 5.92.87-4.49-.69-3.94z" fill="#E4751F" stroke="#E4751F" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M21.08 21.83l-.87 4.49.63.44 3.83-2.99.12-2.85-3.71.91zM10.81 20.75l.1 2.85 3.83 2.99.63-.44-.86-4.49-3.7-.91z" fill="#F6851B" stroke="#F6851B" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M21.12 30.81l.04-1.22-.33-.29h-5.04l-.32.29.03 1.22-4.13-1.94 1.44 1.18 2.93 2.03h5.13l2.93-2.03 1.44-1.18-4.12 1.94z" fill="#C0AD9E" stroke="#C0AD9E" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M20.89 26.71l-.63-.44h-5.9l-.63.44-.34 2.88.32-.29h5.04l.33.29-.19-2.88z" fill="#161616" stroke="#161616" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M33.52 11.35l1.1-5.36L32.96 1l-12.07 8.96 4.64 3.93 6.56 1.92 1.45-1.69-.63-.46 1-1.01-.77-.6 1.01-.78-.66-.51zM.99 5.99l1.12 5.36-.72.53 1.01.78-.76.58 1.01 1.01-.64.46 1.44 1.69 6.57-1.92 4.63-3.93L2.66 1 .99 5.99z" fill="#763D16" stroke="#763D16" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M32.05 16.85l-6.56-1.92 2.07 3.13-3.1 6.05 4.08-.05h6.13l-2.62-7.21zM9.93 14.93l-6.57 1.92-2.58 7.21h6.12l4.07.05-3.1-6.05 2.06-3.13zM20.39 17.89l.42-7.22 1.9-5.15H13.35l1.87 5.15.44 7.22.17 2.53.01 5.9h5.9l.02-5.9.17-2.53h-.54z" fill="#F6851B" stroke="#F6851B" strokeLinecap="round" strokeLinejoin="round"/>
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
    disconnect({ connector: activeConnector });
    setShowWalletMenu(false);
  };

  return (
    <>
      <nav className={styles.nav}>
        <Link href="/" className={styles.logo}>
          <Image
            src="/full-logo.png"
            alt="Molotov Gallery"
            width={140}
            height={32}
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
            href="/gallery" 
            className={`${styles.link} ${pathname === '/gallery' ? styles.active : ''}`}
          >
            EXPLORE
          </Link>
          <Link 
            href="/mint" 
            className={`${styles.link} ${pathname === '/mint' ? styles.active : ''}`}
          >
            CREATE
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
              {connectors.map((connector) => (
                <button
                  key={connector.uid}
                  onClick={() => {
                    connect({ connector });
                    setShowConnectModal(false);
                  }}
                  className={styles.connectorButton}
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
