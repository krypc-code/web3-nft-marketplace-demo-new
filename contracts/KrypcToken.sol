// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract KrypcToken is ERC20 {
    
    constructor(uint256 initialSupply) ERC20("New KrypC Token", "KRYP") {
       initialSupply = initialSupply * 10**18;
        _mint(msg.sender, initialSupply);
    }

    function MintTokens(uint256 qty) public{
        _mint(msg.sender, qty);
    }
}