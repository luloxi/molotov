import { ArtworkMetadata, IPFSUploadResponse } from '../types';

// Pinata configuration
const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT || '';
const PINATA_GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY || 'https://gateway.pinata.cloud';

/**
 * Upload a file to IPFS via Pinata
 */
export async function uploadFileToIPFS(file: File): Promise<IPFSUploadResponse> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const metadata = JSON.stringify({
      name: file.name,
      keyvalues: {
        uploadedAt: new Date().toISOString(),
        type: file.type,
      },
    });
    formData.append('pinataMetadata', metadata);
    
    const options = JSON.stringify({
      cidVersion: 1,
    });
    formData.append('pinataOptions', options);
    
    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PINATA_JWT}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to upload to IPFS');
    }
    
    const data = await response.json();
    
    return {
      success: true,
      hash: data.IpfsHash,
      url: `${PINATA_GATEWAY}/ipfs/${data.IpfsHash}`,
    };
  } catch (error) {
    console.error('IPFS upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Upload JSON metadata to IPFS via Pinata
 */
export async function uploadMetadataToIPFS(metadata: ArtworkMetadata): Promise<IPFSUploadResponse> {
  try {
    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${PINATA_JWT}`,
      },
      body: JSON.stringify({
        pinataContent: metadata,
        pinataMetadata: {
          name: `${metadata.name}-metadata.json`,
        },
        pinataOptions: {
          cidVersion: 1,
        },
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to upload metadata to IPFS');
    }
    
    const data = await response.json();
    
    return {
      success: true,
      hash: data.IpfsHash,
      url: `${PINATA_GATEWAY}/ipfs/${data.IpfsHash}`,
    };
  } catch (error) {
    console.error('IPFS metadata upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

const FALLBACK_GATEWAYS = [
  PINATA_GATEWAY,
  'https://ipfs.io',
  'https://cloudflare-ipfs.com',
  'https://dweb.link',
];

/**
 * Get IPFS gateway URL from hash
 */
export function getIPFSUrl(hash: string, gatewayIndex = 0): string {
  if (hash.startsWith('ipfs://')) {
    hash = hash.replace('ipfs://', '');
  }
  const gateway = FALLBACK_GATEWAYS[gatewayIndex] || FALLBACK_GATEWAYS[0];
  return `${gateway}/ipfs/${hash}`;
}

/**
 * Get next fallback URL for an IPFS hash (used on image load error)
 */
export function getNextIPFSUrl(currentUrl: string): string | null {
  const currentGatewayIndex = FALLBACK_GATEWAYS.findIndex((gw) => currentUrl.startsWith(gw));
  const nextIndex = currentGatewayIndex + 1;
  if (nextIndex >= FALLBACK_GATEWAYS.length) return null;
  const hash = currentUrl.replace(/^https?:\/\/[^/]+\/ipfs\//, '');
  return `${FALLBACK_GATEWAYS[nextIndex]}/ipfs/${hash}`;
}

/**
 * Create full artwork metadata for IPFS
 */
export function createArtworkMetadata(
  name: string,
  description: string,
  imageHash: string,
  mediaType: string,
  artist: { name: string; wallet: string; verified: boolean },
  edition: { number: number; total: number },
  attributes: { trait_type: string; value: string | number }[] = []
): ArtworkMetadata {
  const isAnimated = mediaType === 'image/gif' || mediaType === 'video/mp4';
  
  return {
    name,
    description,
    image: `ipfs://${imageHash}`,
    ...(isAnimated && { animation_url: `ipfs://${imageHash}` }),
    external_url: `https://molotov.gallery/artwork/${imageHash}`,
    attributes: [
      { trait_type: 'Artist', value: artist.name },
      { trait_type: 'Edition', value: `${edition.number}/${edition.total}` },
      { trait_type: 'Media Type', value: mediaType },
      ...attributes,
    ],
    properties: {
      artist: {
        name: artist.name,
        wallet: artist.wallet,
        verified: artist.verified,
      },
      edition: {
        number: edition.number,
        total: edition.total,
      },
      media: {
        type: mediaType,
      },
    },
  };
}

/**
 * Validate file for upload
 */
export function validateArtworkFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'video/mp4'];
  
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${allowedTypes.join(', ')}`,
    };
  }
  
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${maxSize / 1024 / 1024}MB`,
    };
  }
  
  return { valid: true };
}
