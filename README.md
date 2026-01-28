# Molotov Gallery

A decentralized NFT gallery built on Base, integrated as a Farcaster mini app.

## Features

- **NFT Smart Contracts** - Custom ERC721 contracts with support for:
  - Complete metadata on IPFS
  - Royalty system
  - Multiple editions
  - Direct listing and sales

- **Artist Profiles** - Complete profile system linked to artworks:
  - Artist registration and verification
  - Social media links
  - Sales statistics

- **IPFS Storage** - Pinata integration for:
  - Decentralized image/GIF storage
  - JSON metadata following NFT standards

- **Crypto Payments** - Functional payment gateway:
  - Direct artwork purchases
  - ETH support on Base

- **Transaction Monitor** - Real-time feed:
  - Minting events
  - Purchases
  - New artists

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Blockchain**: Base (L2), Solidity 0.8.24
- **Smart Contracts**: Foundry, OpenZeppelin
- **Web3**: wagmi, viem
- **Storage**: IPFS via Pinata
- **Mini App**: Farcaster SDK

## Project Structure

```
molotov/
├── web/                        # Next.js Web Application
│   ├── app/                    # Next.js App Router
│   │   ├── components/         # React components
│   │   │   ├── artist/         # Artist components
│   │   │   ├── gallery/        # Gallery components
│   │   │   ├── mint/           # Minting form
│   │   │   └── transactions/   # Transaction feed
│   │   ├── hooks/              # Custom hooks (wagmi)
│   │   ├── services/           # Services (IPFS, contracts)
│   │   ├── types/              # TypeScript types
│   │   ├── gallery/            # Gallery page
│   │   ├── mint/               # Minting page
│   │   ├── artwork/[id]/       # Individual artwork page
│   │   └── artist/[address]/   # Artist profile page
│   ├── public/                 # Static assets
│   ├── package.json
│   └── tsconfig.json
│
├── smart-contracts/            # Foundry Smart Contracts
│   ├── src/                    # Solidity contracts
│   ├── script/                 # Deployment scripts
│   ├── test/                   # Contract tests
│   └── lib/                    # Foundry dependencies
│
├── .gitignore
└── README.md
```

## Installation

### Requirements

- Node.js 18+
- pnpm/npm/yarn
- Foundry (for contracts)

### Setup

1. **Clone and install dependencies**

```bash
git clone <repo-url>
cd molotov/web
npm install
```

2. **Configure environment variables**

```bash
cp .env.example .env.local
```

Edit `.env.local` with your keys:
- `NEXT_PUBLIC_PINATA_JWT` - Pinata JWT for IPFS
- `PRIVATE_KEY` - Private key for deployment (development only)
- `BASESCAN_API_KEY` - Basescan API key for verification

3. **Start development server**

```bash
cd web
npm run dev
```

## Smart Contracts

### Building & Testing

```bash
cd smart-contracts
forge build
forge test
```

### Deployment

#### Testnet (Base Sepolia)

```bash
cd smart-contracts

# Configure environment variables
export BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
export PRIVATE_KEY=your_private_key
export BASESCAN_API_KEY=your_api_key

# Deploy
forge script script/DeployMolotov.s.sol --rpc-url $BASE_SEPOLIA_RPC_URL --broadcast --verify
```

#### Mainnet (Base)

```bash
cd smart-contracts

export BASE_RPC_URL=https://mainnet.base.org
export PRIVATE_KEY=your_private_key
export BASESCAN_API_KEY=your_api_key

forge script script/DeployMolotov.s.sol --rpc-url $BASE_RPC_URL --broadcast --verify
```

After deployment, update contract addresses in:
- `web/app/types/index.ts` - `CONTRACT_ADDRESSES`

### MolotovNFT.sol

Main ERC721 contract with the following features:

- **Minting**: Only registered artists can mint
- **Marketplace**: Integrated listing and direct purchase
- **Royalties**: ERC2981 support (up to 10%)
- **Metadata**: URI pointing to IPFS

Main functions:
- `registerArtist()` - Register as an artist
- `mintArtwork()` - Create new NFT
- `purchaseArtwork()` - Purchase artwork
- `updateArtworkListing()` - Update price/status

## Usage

### As an Artist

1. Connect wallet
2. Go to `/mint` and register as an artist
3. Complete profile with name, bio, and image
4. Create artworks by uploading images/GIFs
5. Set price and royalties

### As a Collector

1. Connect wallet
2. Browse gallery at `/gallery`
3. View artwork details
4. Purchase directly with ETH

## IPFS API

The IPFS service (`web/app/services/ipfs.ts`) provides:

- `uploadFileToIPFS(file)` - Upload image/GIF
- `uploadMetadataToIPFS(metadata)` - Upload JSON metadata
- `getIPFSUrl(hash)` - Get gateway URL

## License

MIT
