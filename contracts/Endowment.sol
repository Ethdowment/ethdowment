//SPDX-License-Identifier: MIT
pragma solidity ^0.5.0;

contract Endowment {
    struct Donation {
        uint256 amount;
        address donor;
        uint256 date;
    }

    function donate(uint256 donation) public {}
}
