# Molotov Gallery

Una galería NFT descentralizada construida en Base, integrada como mini app de Farcaster.

## Características

- **Smart Contracts NFT** - Contratos ERC721 personalizados con soporte para:
  - Metadata completa en IPFS
  - Sistema de regalías (royalties)
  - Ediciones múltiples
  - Listado y venta directa

- **Perfiles de Artistas** - Sistema completo de perfiles vinculados a las obras:
  - Registro y verificación de artistas
  - Links a redes sociales
  - Estadísticas de ventas

- **Almacenamiento IPFS** - Integración con Pinata para:
  - Almacenamiento descentralizado de imágenes/GIFs
  - Metadata JSON siguiendo estándares NFT

- **Pagos Crypto** - Pasarela de pagos funcional:
  - Compra directa de artworks
  - Soporte para ETH en Base

- **Monitor de Transacciones** - Feed en tiempo real:
  - Eventos de minteo
  - Compras
  - Nuevos artistas

## Stack Tecnológico

- **Frontend**: Next.js 15, React 19, TypeScript
- **Blockchain**: Base (L2), Solidity 0.8.24
- **Smart Contracts**: Foundry, OpenZeppelin
- **Web3**: wagmi, viem
- **Almacenamiento**: IPFS via Pinata
- **Mini App**: Farcaster SDK

## Estructura del Proyecto

```
molotov/
├── app/                    # Next.js App Router
│   ├── components/         # Componentes React
│   │   ├── artist/         # Componentes de artistas
│   │   ├── gallery/        # Componentes de galería
│   │   ├── mint/           # Formulario de minteo
│   │   └── transactions/   # Feed de transacciones
│   ├── hooks/              # Custom hooks (wagmi)
│   ├── services/           # Servicios (IPFS, contratos)
│   ├── types/              # Tipos TypeScript
│   ├── gallery/            # Página de galería
│   ├── mint/               # Página de minteo
│   ├── artwork/[id]/       # Página de artwork individual
│   └── artist/[address]/   # Página de perfil de artista
├── contracts/              # Smart Contracts (Foundry)
│   ├── src/                # Contratos Solidity
│   ├── script/             # Scripts de deployment
│   └── test/               # Tests
└── public/                 # Assets estáticos
```

## Instalación

### Requisitos

- Node.js 18+
- pnpm/npm/yarn
- Foundry (para contratos)

### Setup

1. **Clonar e instalar dependencias**

```bash
git clone <repo-url>
cd molotov
npm install
```

2. **Configurar variables de entorno**

```bash
cp .env.example .env.local
```

Editar `.env.local` con tus claves:
- `NEXT_PUBLIC_PINATA_JWT` - JWT de Pinata para IPFS
- `PRIVATE_KEY` - Clave privada para deployment (solo desarrollo)
- `BASESCAN_API_KEY` - API key de Basescan para verificación

3. **Compilar contratos**

```bash
npm run forge:build
```

4. **Ejecutar tests**

```bash
npm run forge:test
```

5. **Iniciar desarrollo**

```bash
npm run dev
```

## Deployment de Contratos

### Testnet (Base Sepolia)

```bash
# Configurar variables de entorno
export BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
export PRIVATE_KEY=tu_clave_privada
export BASESCAN_API_KEY=tu_api_key

# Deploy
npm run forge:deploy:sepolia
```

### Mainnet (Base)

```bash
export BASE_RPC_URL=https://mainnet.base.org
export PRIVATE_KEY=tu_clave_privada
export BASESCAN_API_KEY=tu_api_key

npm run forge:deploy:mainnet
```

Después del deployment, actualizar las direcciones de contrato en:
- `app/types/index.ts` - `CONTRACT_ADDRESSES`
- `.env.local` - Variables de entorno

## Uso

### Como Artista

1. Conectar wallet
2. Ir a `/mint` y registrarse como artista
3. Completar perfil con nombre, bio e imagen
4. Crear artworks subiendo imágenes/GIFs
5. Establecer precio y regalías

### Como Coleccionista

1. Conectar wallet
2. Explorar galería en `/gallery`
3. Ver detalles de artworks
4. Comprar directamente con ETH

## Contratos

### MolotovNFT.sol

Contrato principal ERC721 con las siguientes características:

- **Minteo**: Solo artistas registrados pueden mintear
- **Marketplace**: Listado y compra directa integrados
- **Regalías**: Soporte ERC2981 (hasta 10%)
- **Metadata**: URI apuntando a IPFS

Funciones principales:
- `registerArtist()` - Registrar como artista
- `mintArtwork()` - Crear nuevo NFT
- `purchaseArtwork()` - Comprar artwork
- `updateArtworkListing()` - Actualizar precio/estado

## API de IPFS

El servicio de IPFS (`app/services/ipfs.ts`) proporciona:

- `uploadFileToIPFS(file)` - Subir imagen/GIF
- `uploadMetadataToIPFS(metadata)` - Subir metadata JSON
- `getIPFSUrl(hash)` - Obtener URL del gateway

## Licencia

MIT
