// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/MolotovNFT.sol";

contract DeployMolotov is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        MolotovNFT nft = new MolotovNFT();
        
        console.log("MolotovNFT deployed at:", address(nft));
        
        vm.stopBroadcast();
    }
}
