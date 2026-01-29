'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';

interface ArtworkStats {
  views: number;
  likes: number;
  liked: boolean;
}

interface UseArtworkStatsReturn {
  stats: ArtworkStats;
  isLoading: boolean;
  recordView: () => Promise<void>;
  toggleLike: () => Promise<void>;
  isLiking: boolean;
}

export function useArtworkStats(tokenId: string | bigint): UseArtworkStatsReturn {
  const { address } = useAccount();
  const [stats, setStats] = useState<ArtworkStats>({ views: 0, likes: 0, liked: false });
  const [isLoading, setIsLoading] = useState(true);
  const [isLiking, setIsLiking] = useState(false);

  const tokenIdStr = tokenId.toString();

  // Fetch initial stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        
        // Fetch stats
        const statsRes = await fetch(`/api/artwork/${tokenIdStr}/stats`);
        const statsData = await statsRes.json();
        
        // Check if user liked (if connected)
        let liked = false;
        if (address) {
          const likeRes = await fetch(`/api/artwork/${tokenIdStr}/like?userId=${address}`);
          const likeData = await likeRes.json();
          liked = likeData.liked;
        }
        
        setStats({
          views: statsData.views || 0,
          likes: statsData.likes || 0,
          liked,
        });
      } catch (error) {
        console.error('Error fetching artwork stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (tokenIdStr) {
      fetchStats();
    }
  }, [tokenIdStr, address]);

  // Record a view
  const recordView = useCallback(async () => {
    try {
      const res = await fetch(`/api/artwork/${tokenIdStr}/view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: address }),
      });
      const data = await res.json();
      
      setStats(prev => ({
        ...prev,
        views: data.views || prev.views,
      }));
    } catch (error) {
      console.error('Error recording view:', error);
    }
  }, [tokenIdStr, address]);

  // Toggle like
  const toggleLike = useCallback(async () => {
    if (!address) {
      console.warn('Must be connected to like artwork');
      return;
    }

    try {
      setIsLiking(true);
      const res = await fetch(`/api/artwork/${tokenIdStr}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: address }),
      });
      const data = await res.json();
      
      setStats(prev => ({
        ...prev,
        likes: data.likes,
        liked: data.liked,
      }));
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setIsLiking(false);
    }
  }, [tokenIdStr, address]);

  return {
    stats,
    isLoading,
    recordView,
    toggleLike,
    isLiking,
  };
}

// Hook for fetching stats for multiple artworks at once
export function useArtworksStats(tokenIds: (string | bigint)[]): Map<string, ArtworkStats> {
  const [statsMap, setStatsMap] = useState<Map<string, ArtworkStats>>(new Map());

  useEffect(() => {
    const fetchAllStats = async () => {
      const newMap = new Map<string, ArtworkStats>();
      
      // Fetch stats for all token IDs in parallel
      await Promise.all(
        tokenIds.map(async (id) => {
          const tokenIdStr = id.toString();
          try {
            const res = await fetch(`/api/artwork/${tokenIdStr}/stats`);
            const data = await res.json();
            newMap.set(tokenIdStr, {
              views: data.views || 0,
              likes: data.likes || 0,
              liked: false, // Would need to check individually if user liked
            });
          } catch (error) {
            newMap.set(tokenIdStr, { views: 0, likes: 0, liked: false });
          }
        })
      );
      
      setStatsMap(newMap);
    };

    if (tokenIds.length > 0) {
      fetchAllStats();
    }
  }, [tokenIds.map(id => id.toString()).join(',')]);

  return statsMap;
}
