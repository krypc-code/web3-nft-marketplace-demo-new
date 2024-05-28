// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract WrappedToken is ERC20 {
    
    constructor() ERC20("New Wrapped Token", "wKRYP") {
    }

    function MintTokens() external payable{
        _mint(msg.sender, msg.value);
    }

    function RedeemTokens(uint amount) external {
        _burn(msg.sender, amount);
        payable(msg.sender).transfer(amount);
    }
}