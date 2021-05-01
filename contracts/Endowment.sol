//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Endowment {
    struct Donation {
        address donor;
        uint256 amount;
        uint256 date;
    }

    Donation[] private _donations;

    function donate(uint256 amount) external payable {
        require(msg.value == amount);
        Donation memory donation =
            Donation({
                donor: msg.sender,
                amount: amount,
                date: block.timestamp
            });
        _donations.push(donation);
    }

    function funds() external view returns (uint256) {
        return address(this).balance;
    }

    function donations() public view returns (Donation[] memory) {
        return _donations;
    }
}
