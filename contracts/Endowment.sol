//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Endowment {
    struct Donation {
        address donor;
        uint256 amount;
        uint256 date;
    }

    event DonationEvent(address indexed _donor, uint256 _amount);

    Donation[] private _donations;
    mapping(address => uint256[]) private _donorDonations;

    function donate(uint256 amount) external payable {
        require(msg.value == amount);

        uint256 date = block.timestamp;
        _donations.push(
            Donation({donor: msg.sender, amount: amount, date: date})
        );
        _donorDonations[msg.sender].push(_donations.length - 1);

        emit DonationEvent(msg.sender, amount);
    }

    function funds() external view returns (uint256) {
        return address(this).balance;
    }

    function donations() public view returns (Donation[] memory) {
        return _donations;
    }

    function donorTotal(address donor) public view returns (uint256) {
        uint256 total = 0;
        for (uint256 i = 0; i < _donorDonations[donor].length; i++) {
            total += _donations[_donorDonations[donor][i]].amount;
        }
        return total;
    }
}
