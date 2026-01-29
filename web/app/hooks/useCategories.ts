'use client';

import { useState, useEffect, useCallback } from 'react';
import { Category } from '../types';

interface UseCategoriesResult {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Hook to fetch all categories
export function useCategories(): UseCategoriesResult {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/categories');
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      
      const data = await response.json();
      setCategories(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch categories');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return { categories, isLoading, error, refetch: fetchCategories };
}

interface UseArtworkCategoriesResult {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  addCategories: (categoryIds: string[]) => Promise<void>;
  setCategories: (categoryIds: string[]) => Promise<void>;
  removeCategory: (categoryId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

// Hook to manage categories for a specific artwork
export function useArtworkCategories(tokenId: string | undefined): UseArtworkCategoriesResult {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    if (!tokenId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/artwork/${tokenId}/categories`);
      if (!response.ok) {
        throw new Error('Failed to fetch artwork categories');
      }
      
      const data = await response.json();
      setCategories(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch categories');
    } finally {
      setIsLoading(false);
    }
  }, [tokenId]);

  useEffect(() => {
    if (tokenId) {
      fetchCategories();
    }
  }, [tokenId, fetchCategories]);

  const addCategories = useCallback(async (categoryIds: string[]) => {
    if (!tokenId) return;
    
    try {
      setError(null);
      const response = await fetch(`/api/artwork/${tokenId}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryIds }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add categories');
      }
      
      await fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add categories');
      throw err;
    }
  }, [tokenId, fetchCategories]);

  const setCategoriesForArtwork = useCallback(async (categoryIds: string[]) => {
    if (!tokenId) return;
    
    try {
      setError(null);
      const response = await fetch(`/api/artwork/${tokenId}/categories`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryIds }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to set categories');
      }
      
      await fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set categories');
      throw err;
    }
  }, [tokenId, fetchCategories]);

  const removeCategory = useCallback(async (categoryId: string) => {
    if (!tokenId) return;
    
    try {
      setError(null);
      const response = await fetch(
        `/api/artwork/${tokenId}/categories?categoryId=${categoryId}`,
        { method: 'DELETE' }
      );
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to remove category');
      }
      
      await fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove category');
      throw err;
    }
  }, [tokenId, fetchCategories]);

  return {
    categories,
    isLoading,
    error,
    addCategories,
    setCategories: setCategoriesForArtwork,
    removeCategory,
    refetch: fetchCategories,
  };
}
