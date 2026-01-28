// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title MolotovNFT
 * @dev NFT contract for minting JPG/GIF artworks with full metadata
 * Supports artist profiles, royalties, and direct purchases
 */
contract MolotovNFT is ERC721, ERC721URIStorage, ERC721Royalty, Ownable, ReentrancyGuard {
    
    // ============ Structs ============
    
    struct Artwork {
        uint256 tokenId;
        address artist;
        string title;
        string description;
        string mediaType; // "image/jpeg", "image/gif", "image/png"
        string ipfsHash; // IPFS CID for the artwork
        string metadataHash; // IPFS CID for metadata JSON
        uint256 price; // Price in wei (0 if not for sale)
        uint256 createdAt;
        bool isForSale;
        uint256 editionNumber; // Edition number (1 for unique pieces)
        uint256 totalEditions; // Total editions (1 for unique pieces)
    }
    
    struct ArtistProfile {
        address wallet;
        string name;
        string bio;
        string profileImageHash; // IPFS hash
        string socialLinks; // JSON string with social links
        uint256 totalSales;
        uint256 totalArtworks;
        bool isVerified;
        uint256 registeredAt;
    }
    
    // ============ State Variables ============
    
    uint256 private _tokenIdCounter;
    uint256 public platformFee = 250; // 2.5% in basis points (250/10000)
    uint256 public constant MAX_ROYALTY = 1000; // 10% max royalty
    
    mapping(uint256 => Artwork) public artworks;
    mapping(address => ArtistProfile) public artistProfiles;
    mapping(address => uint256[]) public artistTokens;
    mapping(address => bool) public registeredArtists;
    
    address[] public allArtists;
    uint256[] public allTokenIds;
    
    // ============ Events ============
    
    event ArtworkMinted(
        uint256 indexed tokenId,
        address indexed artist,
        string title,
        string ipfsHash,
        uint256 price
    );
    
    event ArtworkPurchased(
        uint256 indexed tokenId,
        address indexed buyer,
        address indexed seller,
        uint256 price
    );
    
    event ArtworkPriceUpdated(
        uint256 indexed tokenId,
        uint256 oldPrice,
        uint256 newPrice,
        bool isForSale
    );
    
    event ArtistRegistered(
        address indexed artist,
        string name
    );
    
    event ArtistProfileUpdated(
        address indexed artist
    );
    
    event ArtistVerified(
        address indexed artist,
        bool verified
    );
    
    // ============ Constructor ============
    
    constructor() ERC721("Molotov Gallery", "MLTV") Ownable(msg.sender) {
        _tokenIdCounter = 0;
    }
    
    // ============ Artist Functions ============
    
    /**
     * @dev Register as an artist
     */
    function registerArtist(
        string memory _name,
        string memory _bio,
        string memory _profileImageHash,
        string memory _socialLinks
    ) external {
        require(!registeredArtists[msg.sender], "Already registered");
        require(bytes(_name).length > 0, "Name required");
        
        artistProfiles[msg.sender] = ArtistProfile({
            wallet: msg.sender,
            name: _name,
            bio: _bio,
            profileImageHash: _profileImageHash,
            socialLinks: _socialLinks,
            totalSales: 0,
            totalArtworks: 0,
            isVerified: false,
            registeredAt: block.timestamp
        });
        
        registeredArtists[msg.sender] = true;
        allArtists.push(msg.sender);
        
        emit ArtistRegistered(msg.sender, _name);
    }
    
    /**
     * @dev Update artist profile
     */
    function updateArtistProfile(
        string memory _name,
        string memory _bio,
        string memory _profileImageHash,
        string memory _socialLinks
    ) external {
        require(registeredArtists[msg.sender], "Not registered");
        
        ArtistProfile storage profile = artistProfiles[msg.sender];
        profile.name = _name;
        profile.bio = _bio;
        profile.profileImageHash = _profileImageHash;
        profile.socialLinks = _socialLinks;
        
        emit ArtistProfileUpdated(msg.sender);
    }
    
    /**
     * @dev Verify/unverify an artist (owner only)
     */
    function setArtistVerified(address _artist, bool _verified) external onlyOwner {
        require(registeredArtists[_artist], "Artist not registered");
        artistProfiles[_artist].isVerified = _verified;
        emit ArtistVerified(_artist, _verified);
    }
    
    // ============ Minting Functions ============
    
    /**
     * @dev Mint a new artwork NFT
     */
    function mintArtwork(
        string memory _title,
        string memory _description,
        string memory _mediaType,
        string memory _ipfsHash,
        string memory _metadataHash,
        uint256 _price,
        bool _isForSale,
        uint96 _royaltyBps, // Royalty in basis points (e.g., 500 = 5%)
        uint256 _editionNumber,
        uint256 _totalEditions
    ) external returns (uint256) {
        require(registeredArtists[msg.sender], "Must be registered artist");
        require(bytes(_title).length > 0, "Title required");
        require(bytes(_ipfsHash).length > 0, "IPFS hash required");
        require(bytes(_metadataHash).length > 0, "Metadata hash required");
        require(_royaltyBps <= MAX_ROYALTY, "Royalty too high");
        require(_editionNumber <= _totalEditions, "Invalid edition");
        require(_totalEditions > 0, "Must have at least 1 edition");
        
        _tokenIdCounter++;
        uint256 newTokenId = _tokenIdCounter;
        
        _safeMint(msg.sender, newTokenId);
        _setTokenURI(newTokenId, string(abi.encodePacked("ipfs://", _metadataHash)));
        _setTokenRoyalty(newTokenId, msg.sender, _royaltyBps);
        
        artworks[newTokenId] = Artwork({
            tokenId: newTokenId,
            artist: msg.sender,
            title: _title,
            description: _description,
            mediaType: _mediaType,
            ipfsHash: _ipfsHash,
            metadataHash: _metadataHash,
            price: _price,
            createdAt: block.timestamp,
            isForSale: _isForSale,
            editionNumber: _editionNumber,
            totalEditions: _totalEditions
        });
        
        artistTokens[msg.sender].push(newTokenId);
        allTokenIds.push(newTokenId);
        artistProfiles[msg.sender].totalArtworks++;
        
        emit ArtworkMinted(newTokenId, msg.sender, _title, _ipfsHash, _price);
        
        return newTokenId;
    }
    
    // ============ Purchase Functions ============
    
    /**
     * @dev Purchase an artwork
     */
    function purchaseArtwork(uint256 _tokenId) external payable nonReentrant {
        Artwork storage artwork = artworks[_tokenId];
        require(artwork.isForSale, "Not for sale");
        require(msg.value >= artwork.price, "Insufficient payment");
        
        address seller = ownerOf(_tokenId);
        require(seller != msg.sender, "Cannot buy own artwork");
        
        // Calculate fees
        uint256 platformAmount = (artwork.price * platformFee) / 10000;
        uint256 sellerAmount = artwork.price - platformAmount;
        
        // Transfer NFT
        _transfer(seller, msg.sender, _tokenId);
        
        // Update artwork status
        artwork.isForSale = false;
        
        // Update artist stats
        artistProfiles[artwork.artist].totalSales += artwork.price;
        
        // Transfer funds
        (bool platformSuccess, ) = owner().call{value: platformAmount}("");
        require(platformSuccess, "Platform fee transfer failed");
        
        (bool sellerSuccess, ) = seller.call{value: sellerAmount}("");
        require(sellerSuccess, "Seller payment failed");
        
        // Refund excess payment
        if (msg.value > artwork.price) {
            (bool refundSuccess, ) = msg.sender.call{value: msg.value - artwork.price}("");
            require(refundSuccess, "Refund failed");
        }
        
        emit ArtworkPurchased(_tokenId, msg.sender, seller, artwork.price);
    }
    
    /**
     * @dev Update artwork price and sale status
     */
    function updateArtworkListing(uint256 _tokenId, uint256 _newPrice, bool _isForSale) external {
        require(ownerOf(_tokenId) == msg.sender, "Not owner");
        
        uint256 oldPrice = artworks[_tokenId].price;
        artworks[_tokenId].price = _newPrice;
        artworks[_tokenId].isForSale = _isForSale;
        
        emit ArtworkPriceUpdated(_tokenId, oldPrice, _newPrice, _isForSale);
    }
    
    // ============ View Functions ============
    
    function getArtwork(uint256 _tokenId) external view returns (Artwork memory) {
        require(_tokenId > 0 && _tokenId <= _tokenIdCounter, "Invalid token ID");
        return artworks[_tokenId];
    }
    
    function getArtistProfile(address _artist) external view returns (ArtistProfile memory) {
        return artistProfiles[_artist];
    }
    
    function getArtistTokens(address _artist) external view returns (uint256[] memory) {
        return artistTokens[_artist];
    }
    
    function getAllArtists() external view returns (address[] memory) {
        return allArtists;
    }
    
    function getAllTokenIds() external view returns (uint256[] memory) {
        return allTokenIds;
    }
    
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter;
    }
    
    function getArtworksForSale() external view returns (Artwork[] memory) {
        uint256 forSaleCount = 0;
        
        // Count artworks for sale
        for (uint256 i = 1; i <= _tokenIdCounter; i++) {
            if (artworks[i].isForSale) {
                forSaleCount++;
            }
        }
        
        // Create array of correct size
        Artwork[] memory forSaleArtworks = new Artwork[](forSaleCount);
        uint256 index = 0;
        
        for (uint256 i = 1; i <= _tokenIdCounter; i++) {
            if (artworks[i].isForSale) {
                forSaleArtworks[index] = artworks[i];
                index++;
            }
        }
        
        return forSaleArtworks;
    }
    
    // ============ Admin Functions ============
    
    function setPlatformFee(uint256 _newFee) external onlyOwner {
        require(_newFee <= 1000, "Fee too high"); // Max 10%
        platformFee = _newFee;
    }
    
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance");
        (bool success, ) = owner().call{value: balance}("");
        require(success, "Withdrawal failed");
    }
    
    // ============ Override Functions ============
    
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage, ERC721Royalty) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
