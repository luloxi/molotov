// NFT and Artwork types
export interface Artwork {
  tokenId: bigint;
  artist: `0x${string}`;
  title: string;
  description: string;
  mediaType: 'image/jpeg' | 'image/gif' | 'image/png' | 'video/mp4';
  ipfsHash: string;
  metadataHash: string;
  price: bigint;
  createdAt: bigint;
  isForSale: boolean;
  editionNumber: bigint;
  totalEditions: bigint;
}

export interface ArtworkMetadata {
  name: string;
  description: string;
  image: string; // ipfs:// URI
  animation_url?: string; // For GIFs/videos
  external_url?: string;
  attributes: ArtworkAttribute[];
  properties: {
    artist: ArtistInfo;
    edition: EditionInfo;
    media: MediaInfo;
  };
}

export interface ArtworkAttribute {
  trait_type: string;
  value: string | number;
}

export interface ArtistInfo {
  name: string;
  wallet: string;
  verified: boolean;
}

export interface EditionInfo {
  number: number;
  total: number;
}

export interface MediaInfo {
  type: string;
  dimensions?: {
    width: number;
    height: number;
  };
  size?: number;
}

// Artist types
export interface ArtistProfile {
  wallet: `0x${string}`;
  name: string;
  bio: string;
  profileImageHash: string;
  socialLinks: SocialLinks;
  totalSales: bigint;
  totalArtworks: bigint;
  isVerified: boolean;
  registeredAt: bigint;
}

export interface SocialLinks {
  twitter?: string;
  instagram?: string;
  website?: string;
  farcaster?: string;
}

// Form types for minting
export interface MintFormData {
  title: string;
  description: string;
  file: File | null;
  price: string;
  isForSale: boolean;
  royaltyPercentage: number;
  editionNumber: number;
  totalEditions: number;
  attributes: ArtworkAttribute[];
}

export interface ArtistFormData {
  name: string;
  bio: string;
  profileImage: File | null;
  socialLinks: SocialLinks;
}

// Transaction types
export interface TransactionEvent {
  id: string;
  type: 'mint' | 'purchase' | 'list' | 'delist' | 'register';
  tokenId?: bigint;
  from: `0x${string}`;
  to?: `0x${string}`;
  price?: bigint;
  timestamp: number;
  transactionHash: `0x${string}`;
  blockNumber: bigint;
  artworkTitle?: string;
  artistName?: string;
  buyerName?: string;
}

// Gallery filter types
export interface GalleryFilters {
  priceMin?: string;
  priceMax?: string;
  mediaType?: string[];
  category?: string[]; // category slugs or IDs
  sortBy: 'newest' | 'oldest' | 'price_asc' | 'price_desc';
  onlyForSale: boolean;
  artist?: `0x${string}`;
}

// Category types
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  color?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    artworks: number;
  };
}

// IPFS upload response
export interface IPFSUploadResponse {
  success: boolean;
  hash?: string;
  url?: string;
  error?: string;
}

// Contract addresses per network
export interface ContractAddresses {
  molotovNFT: `0x${string}`;
}

export const CONTRACT_ADDRESSES: Record<number, ContractAddresses> = {
  // Base Mainnet
  8453: {
    molotovNFT: '0x0000000000000000000000000000000000000000' as `0x${string}`, // TODO: Deploy and update
  },
  // Base Sepolia (testnet)
  84532: {
    molotovNFT: '0xAAa5db0a6aBd2Cf03BbccaF6A2C98b177d48160A' as `0x${string}`, // TODO: Deploy and update
  },
};
