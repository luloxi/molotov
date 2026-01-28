'use client';

import { useEffect } from 'react';

/**
 * Filters out harmless console errors from third-party SDKs
 * that are commonly blocked by ad blockers or browser extensions.
 * 
 * These errors are harmless and don't affect functionality:
 * - Coinbase Wallet SDK analytics requests blocked by ad blockers
 * - FileSystem API errors from browser extensions
 * 
 * The app will continue to work normally even with these errors.
 */
export function ErrorFilter() {
  useEffect(() => {
    // Store original console methods
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalLog = console.log;

    // List of error patterns to filter (harmless third-party SDK errors)
    const blockedPatterns = [
      /ERR_BLOCKED_BY_CLIENT/i,
      /cca-lite\.coinbase\.com/i,
      /Analytics SDK/i,
      /Failed to fetch.*analytics/i,
      /Unable to add filesystem.*illegal path/i,
      /installHook\.js/i, // Coinbase Wallet SDK hook
    ];

    const shouldFilterMessage = (message: string): boolean => {
      return blockedPatterns.some(pattern => pattern.test(message));
    };

    // Filter console.error
    console.error = (...args: unknown[]) => {
      const message = args.join(' ');
      if (!shouldFilterMessage(message)) {
        originalError.apply(console, args);
      }
      // Silently ignore filtered errors
    };

    // Filter console.warn for network errors
    console.warn = (...args: unknown[]) => {
      const message = args.join(' ');
      if (!shouldFilterMessage(message)) {
        originalWarn.apply(console, args);
      }
    };

    // Filter console.log for analytics messages
    console.log = (...args: unknown[]) => {
      const message = args.join(' ');
      if (!shouldFilterMessage(message)) {
        originalLog.apply(console, args);
      }
    };

    // Filter network errors from window error events
    const handleError = (event: ErrorEvent) => {
      const message = event.message || event.filename || '';
      if (shouldFilterMessage(message)) {
        event.preventDefault();
        return false;
      }
    };

    // Filter unhandled promise rejections related to analytics
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const message = event.reason?.message || event.reason?.toString() || '';
      if (shouldFilterMessage(message)) {
        event.preventDefault();
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Cleanup on unmount
    return () => {
      console.error = originalError;
      console.warn = originalWarn;
      console.log = originalLog;
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return null;
}
