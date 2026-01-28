// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/MolotovNFT.sol";

contract MolotovNFTTest is Test {
    MolotovNFT public nft;
    address public owner;
    address public artist1;
    address public artist2;
    address public buyer;
    
    function setUp() public {
        owner = makeAddr("owner");
        artist1 = makeAddr("artist1");
        artist2 = makeAddr("artist2");
        buyer = makeAddr("buyer");
        
        vm.prank(owner);
        nft = new MolotovNFT();
        
        // Fund accounts
        vm.deal(owner, 10 ether);
        vm.deal(buyer, 100 ether);
        vm.deal(artist1, 10 ether);
        vm.deal(artist2, 10 ether);
    }
    
    // Allow this contract to receive ETH
    receive() external payable {}
    
    function testRegisterArtist() public {
        vm.prank(artist1);
        nft.registerArtist("Test Artist", "Bio", "QmHash", "{}");
        
        MolotovNFT.ArtistProfile memory profile = nft.getArtistProfile(artist1);
        assertEq(profile.name, "Test Artist");
        assertEq(profile.wallet, artist1);
        assertTrue(nft.registeredArtists(artist1));
    }
    
    function testCannotRegisterTwice() public {
        vm.startPrank(artist1);
        nft.registerArtist("Test Artist", "Bio", "QmHash", "{}");
        
        vm.expectRevert("Already registered");
        nft.registerArtist("Test Artist 2", "Bio 2", "QmHash2", "{}");
        vm.stopPrank();
    }
    
    function testMintArtwork() public {
        // Register artist first
        vm.prank(artist1);
        nft.registerArtist("Test Artist", "Bio", "QmHash", "{}");
        
        // Mint artwork
        vm.prank(artist1);
        uint256 tokenId = nft.mintArtwork(
            "My Artwork",
            "Description",
            "image/jpeg",
            "QmArtworkHash",
            "QmMetadataHash",
            1 ether,
            true,
            500, // 5% royalty
            1,
            1
        );
        
        assertEq(tokenId, 1);
        assertEq(nft.ownerOf(1), artist1);
        
        MolotovNFT.Artwork memory artwork = nft.getArtwork(1);
        assertEq(artwork.title, "My Artwork");
        assertEq(artwork.price, 1 ether);
        assertTrue(artwork.isForSale);
    }
    
    function testPurchaseArtwork() public {
        // Setup
        vm.prank(artist1);
        nft.registerArtist("Test Artist", "Bio", "QmHash", "{}");
        
        vm.prank(artist1);
        nft.mintArtwork(
            "My Artwork",
            "Description",
            "image/jpeg",
            "QmArtworkHash",
            "QmMetadataHash",
            1 ether,
            true,
            500,
            1,
            1
        );
        
        uint256 artist1BalanceBefore = artist1.balance;
        
        // Purchase
        vm.prank(buyer);
        nft.purchaseArtwork{value: 1 ether}(1);
        
        assertEq(nft.ownerOf(1), buyer);
        
        // Check artist received payment (minus platform fee)
        uint256 expectedPayment = 1 ether - (1 ether * 250 / 10000);
        assertEq(artist1.balance, artist1BalanceBefore + expectedPayment);
    }
    
    function testUpdateListing() public {
        vm.prank(artist1);
        nft.registerArtist("Test Artist", "Bio", "QmHash", "{}");
        
        vm.prank(artist1);
        nft.mintArtwork(
            "My Artwork",
            "Description",
            "image/jpeg",
            "QmArtworkHash",
            "QmMetadataHash",
            1 ether,
            false,
            500,
            1,
            1
        );
        
        vm.prank(artist1);
        nft.updateArtworkListing(1, 2 ether, true);
        
        MolotovNFT.Artwork memory artwork = nft.getArtwork(1);
        assertEq(artwork.price, 2 ether);
        assertTrue(artwork.isForSale);
    }
    
    function testVerifyArtist() public {
        vm.prank(artist1);
        nft.registerArtist("Test Artist", "Bio", "QmHash", "{}");
        
        vm.prank(owner);
        nft.setArtistVerified(artist1, true);
        
        MolotovNFT.ArtistProfile memory profile = nft.getArtistProfile(artist1);
        assertTrue(profile.isVerified);
    }
    
    function testGetArtworksForSale() public {
        vm.prank(artist1);
        nft.registerArtist("Test Artist", "Bio", "QmHash", "{}");
        
        vm.startPrank(artist1);
        nft.mintArtwork("Art 1", "Desc", "image/jpeg", "Hash1", "Meta1", 1 ether, true, 500, 1, 1);
        nft.mintArtwork("Art 2", "Desc", "image/jpeg", "Hash2", "Meta2", 2 ether, false, 500, 1, 1);
        nft.mintArtwork("Art 3", "Desc", "image/gif", "Hash3", "Meta3", 3 ether, true, 500, 1, 1);
        vm.stopPrank();
        
        MolotovNFT.Artwork[] memory forSale = nft.getArtworksForSale();
        assertEq(forSale.length, 2);
    }
}
