import { CONTRACT_ADDRESSES } from '../types';

// Contract ABI (simplified for the functions we need)
export const MOLOTOV_NFT_ABI = [
  // Artist functions
  {
    inputs: [
      { name: '_name', type: 'string' },
      { name: '_bio', type: 'string' },
      { name: '_profileImageHash', type: 'string' },
      { name: '_socialLinks', type: 'string' },
    ],
    name: 'registerArtist',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: '_name', type: 'string' },
      { name: '_bio', type: 'string' },
      { name: '_profileImageHash', type: 'string' },
      { name: '_socialLinks', type: 'string' },
    ],
    name: 'updateArtistProfile',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // Minting
  {
    inputs: [
      { name: '_title', type: 'string' },
      { name: '_description', type: 'string' },
      { name: '_mediaType', type: 'string' },
      { name: '_ipfsHash', type: 'string' },
      { name: '_metadataHash', type: 'string' },
      { name: '_price', type: 'uint256' },
      { name: '_isForSale', type: 'bool' },
      { name: '_royaltyBps', type: 'uint96' },
      { name: '_editionNumber', type: 'uint256' },
      { name: '_totalEditions', type: 'uint256' },
    ],
    name: 'mintArtwork',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // Purchase
  {
    inputs: [{ name: '_tokenId', type: 'uint256' }],
    name: 'purchaseArtwork',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  // Listing
  {
    inputs: [
      { name: '_tokenId', type: 'uint256' },
      { name: '_newPrice', type: 'uint256' },
      { name: '_isForSale', type: 'bool' },
    ],
    name: 'updateArtworkListing',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // View functions
  {
    inputs: [{ name: '_tokenId', type: 'uint256' }],
    name: 'getArtwork',
    outputs: [
      {
        components: [
          { name: 'tokenId', type: 'uint256' },
          { name: 'artist', type: 'address' },
          { name: 'title', type: 'string' },
          { name: 'description', type: 'string' },
          { name: 'mediaType', type: 'string' },
          { name: 'ipfsHash', type: 'string' },
          { name: 'metadataHash', type: 'string' },
          { name: 'price', type: 'uint256' },
          { name: 'createdAt', type: 'uint256' },
          { name: 'isForSale', type: 'bool' },
          { name: 'editionNumber', type: 'uint256' },
          { name: 'totalEditions', type: 'uint256' },
        ],
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: '_artist', type: 'address' }],
    name: 'getArtistProfile',
    outputs: [
      {
        components: [
          { name: 'wallet', type: 'address' },
          { name: 'name', type: 'string' },
          { name: 'bio', type: 'string' },
          { name: 'profileImageHash', type: 'string' },
          { name: 'socialLinks', type: 'string' },
          { name: 'totalSales', type: 'uint256' },
          { name: 'totalArtworks', type: 'uint256' },
          { name: 'isVerified', type: 'bool' },
          { name: 'registeredAt', type: 'uint256' },
        ],
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: '_artist', type: 'address' }],
    name: 'getArtistTokens',
    outputs: [{ name: '', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getAllArtists',
    outputs: [{ name: '', type: 'address[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getAllTokenIds',
    outputs: [{ name: '', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getArtworksForSale',
    outputs: [
      {
        components: [
          { name: 'tokenId', type: 'uint256' },
          { name: 'artist', type: 'address' },
          { name: 'title', type: 'string' },
          { name: 'description', type: 'string' },
          { name: 'mediaType', type: 'string' },
          { name: 'ipfsHash', type: 'string' },
          { name: 'metadataHash', type: 'string' },
          { name: 'price', type: 'uint256' },
          { name: 'createdAt', type: 'uint256' },
          { name: 'isForSale', type: 'bool' },
          { name: 'editionNumber', type: 'uint256' },
          { name: 'totalEditions', type: 'uint256' },
        ],
        type: 'tuple[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: '', type: 'address' }],
    name: 'registeredArtists',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'ownerOf',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'tokenId', type: 'uint256' },
      { indexed: true, name: 'artist', type: 'address' },
      { indexed: false, name: 'title', type: 'string' },
      { indexed: false, name: 'ipfsHash', type: 'string' },
      { indexed: false, name: 'price', type: 'uint256' },
    ],
    name: 'ArtworkMinted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'tokenId', type: 'uint256' },
      { indexed: true, name: 'buyer', type: 'address' },
      { indexed: true, name: 'seller', type: 'address' },
      { indexed: false, name: 'price', type: 'uint256' },
    ],
    name: 'ArtworkPurchased',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'tokenId', type: 'uint256' },
      { indexed: false, name: 'oldPrice', type: 'uint256' },
      { indexed: false, name: 'newPrice', type: 'uint256' },
      { indexed: false, name: 'isForSale', type: 'bool' },
    ],
    name: 'ArtworkPriceUpdated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'artist', type: 'address' },
      { indexed: false, name: 'name', type: 'string' },
    ],
    name: 'ArtistRegistered',
    type: 'event',
  },
] as const;

/**
 * Get contract address for the current chain
 */
export function getContractAddress(chainId: number): `0x${string}` | null {
  return CONTRACT_ADDRESSES[chainId]?.molotovNFT || null;
}

/**
 * Format price from wei to ETH string
 */
export function formatPrice(priceWei: bigint): string {
  const eth = Number(priceWei) / 1e18;
  return eth.toFixed(eth < 0.0001 ? 7 : 5);
}

/**
 * Parse ETH string to wei
 */
export function parsePrice(ethString: string): bigint {
  const eth = parseFloat(ethString);
  return BigInt(Math.floor(eth * 1e18));
}

/**
 * Format timestamp to readable date
 */
export function formatTimestamp(timestamp: bigint): string {
  return new Date(Number(timestamp) * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Truncate address for display
 */
export function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
