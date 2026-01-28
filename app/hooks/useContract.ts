'use client';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { baseSepolia } from 'wagmi/chains';
import { MOLOTOV_NFT_ABI, getContractAddress } from '../services/contract';

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
