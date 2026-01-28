'use client';

import { useState, useEffect } from 'react';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { baseSepolia } from 'wagmi/chains';
import { MOLOTOV_NFT_ABI, getContractAddress } from '../services/contract';
import type { Artwork } from '../types';

// Target chain for all transactions
const TARGET_CHAIN_ID = baseSepolia.id;

// Hook to get contract address for target chain
export function useContractAddress() {
  return getContractAddress(TARGET_CHAIN_ID);
}

// Hook to check if user is registered artist
export function useIsRegisteredArtist(address?: `0x${string}`) {
  const contractAddress = useContractAddress();
  
  return useReadContract({
    address: contractAddress || undefined,
    abi: MOLOTOV_NFT_ABI,
    functionName: 'registeredArtists',
    args: address ? [address] : undefined,
    query: {
      enabled: !!contractAddress && !!address,
    },
  });
}

// Hook to get artist profile
export function useArtistProfile(address?: `0x${string}`) {
  const contractAddress = useContractAddress();
  
  return useReadContract({
    address: contractAddress || undefined,
    abi: MOLOTOV_NFT_ABI,
    functionName: 'getArtistProfile',
    args: address ? [address] : undefined,
    query: {
      enabled: !!contractAddress && !!address,
    },
  });
}

// Hook to get single artwork
export function useArtwork(tokenId?: bigint) {
  const contractAddress = useContractAddress();
  
  return useReadContract({
    address: contractAddress || undefined,
    abi: MOLOTOV_NFT_ABI,
    functionName: 'getArtwork',
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: {
      enabled: !!contractAddress && tokenId !== undefined,
    },
  });
}

// Hook to get all artworks for sale
export function useArtworksForSale() {
  const contractAddress = useContractAddress();
  
  return useReadContract({
    address: contractAddress || undefined,
    abi: MOLOTOV_NFT_ABI,
    functionName: 'getArtworksForSale',
    query: {
      enabled: !!contractAddress,
    },
  });
}

// Hook to get all token IDs
export function useAllTokenIds() {
  const contractAddress = useContractAddress();
  
  return useReadContract({
    address: contractAddress || undefined,
    abi: MOLOTOV_NFT_ABI,
    functionName: 'getAllTokenIds',
    query: {
      enabled: !!contractAddress,
    },
  });
}

// Hook to get artist's tokens
export function useArtistTokens(address?: `0x${string}`) {
  const contractAddress = useContractAddress();
  
  return useReadContract({
    address: contractAddress || undefined,
    abi: MOLOTOV_NFT_ABI,
    functionName: 'getArtistTokens',
    args: address ? [address] : undefined,
    query: {
      enabled: !!contractAddress && !!address,
    },
  });
}

// Hook to get all artists
export function useAllArtists() {
  const contractAddress = useContractAddress();
  
  return useReadContract({
    address: contractAddress || undefined,
    abi: MOLOTOV_NFT_ABI,
    functionName: 'getAllArtists',
    query: {
      enabled: !!contractAddress,
    },
  });
}

// Hook to get total supply
export function useTotalSupply() {
  const contractAddress = useContractAddress();
  
  return useReadContract({
    address: contractAddress || undefined,
    abi: MOLOTOV_NFT_ABI,
    functionName: 'totalSupply',
    query: {
      enabled: !!contractAddress,
    },
  });
}

// Hook to get token owner
export function useTokenOwner(tokenId?: bigint) {
  const contractAddress = useContractAddress();
  
  return useReadContract({
    address: contractAddress || undefined,
    abi: MOLOTOV_NFT_ABI,
    functionName: 'ownerOf',
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: {
      enabled: !!contractAddress && tokenId !== undefined,
    },
  });
}

// Hook to get multiple artworks by token IDs
export function useArtworks(tokenIds: bigint[] | undefined) {
  const contractAddress = useContractAddress();
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!contractAddress || !tokenIds || tokenIds.length === 0) {
      setArtworks([]);
      setIsLoading(false);
      return;
    }

    const fetchArtworks = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const { createPublicClient, http } = await import('viem');
        const { baseSepolia } = await import('wagmi/chains');
        
        const client = createPublicClient({
          chain: baseSepolia,
          transport: http(),
        });

        const results = await Promise.all(
          tokenIds.map(async (tokenId) => {
            try {
              const result = await client.readContract({
                address: contractAddress,
                abi: MOLOTOV_NFT_ABI,
                functionName: 'getArtwork',
                args: [tokenId],
              });
              return result as Artwork;
            } catch (err) {
              console.error(`Failed to fetch artwork ${tokenId}:`, err);
              return null;
            }
          })
        );

        const validArtworks = results.filter((a): a is Artwork => a !== null);
        setArtworks(validArtworks);
      } catch (err) {
        console.error('Failed to fetch artworks:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch artworks'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchArtworks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contractAddress, JSON.stringify(tokenIds?.map(t => t.toString()))]);

  return { data: artworks, isLoading, error };
}

// Hook for registering as artist
export function useRegisterArtist() {
  const contractAddress = useContractAddress();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });
  
  const register = (name: string, bio: string, profileImageHash: string, socialLinks: string) => {
    if (!contractAddress) return;
    
    writeContract({
      address: contractAddress,
      abi: MOLOTOV_NFT_ABI,
      functionName: 'registerArtist',
      args: [name, bio, profileImageHash, socialLinks],
      chainId: TARGET_CHAIN_ID,
    });
  };
  
  return {
    register,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

// Hook for minting artwork
export function useMintArtwork() {
  const contractAddress = useContractAddress();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });
  
  const mint = (
    title: string,
    description: string,
    mediaType: string,
    ipfsHash: string,
    metadataHash: string,
    priceEth: string,
    isForSale: boolean,
    royaltyBps: number,
    editionNumber: number,
    totalEditions: number
  ) => {
    if (!contractAddress) return;
    
    const priceWei = parseEther(priceEth || '0');
    
    writeContract({
      address: contractAddress,
      abi: MOLOTOV_NFT_ABI,
      functionName: 'mintArtwork',
      args: [
        title,
        description,
        mediaType,
        ipfsHash,
        metadataHash,
        priceWei,
        isForSale,
        BigInt(royaltyBps),
        BigInt(editionNumber),
        BigInt(totalEditions),
      ],
      chainId: TARGET_CHAIN_ID,
    });
  };
  
  return {
    mint,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

// Hook for purchasing artwork
export function usePurchaseArtwork() {
  const contractAddress = useContractAddress();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });
  
  const purchase = (tokenId: bigint, priceWei: bigint) => {
    if (!contractAddress) return;
    
    writeContract({
      address: contractAddress,
      abi: MOLOTOV_NFT_ABI,
      functionName: 'purchaseArtwork',
      args: [tokenId],
      value: priceWei,
      chainId: TARGET_CHAIN_ID,
    });
  };
  
  return {
    purchase,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

// Hook for updating artwork listing
export function useUpdateListing() {
  const contractAddress = useContractAddress();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });
  
  const updateListing = (tokenId: bigint, priceEth: string, isForSale: boolean) => {
    if (!contractAddress) return;
    
    const priceWei = parseEther(priceEth || '0');
    
    writeContract({
      address: contractAddress,
      abi: MOLOTOV_NFT_ABI,
      functionName: 'updateArtworkListing',
      args: [tokenId, priceWei, isForSale],
      chainId: TARGET_CHAIN_ID,
    });
  };
  
  return {
    updateListing,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}
