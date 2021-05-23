//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Endowment {
    struct Donation {
        address donorAddress;
        string donorName;
        uint256 amount;
        uint256 date;
    }

    event DonationEvent(
        address indexed _donorAddress,
        string _donorName,
        uint256 _amount
    );

    Donation[] private _donations;
    mapping(address => uint256[]) private _donorDonations;
    mapping(address => string) private _donorNames;

    function donate(uint256 amount, string calldata name) external payable {
        require(msg.value == amount);

        uint256 date = block.timestamp;
        _donations.push(
            Donation({
                donorAddress: msg.sender,
                donorName: name,
                amount: amount,
                date: date
            })
        );
        _donorDonations[msg.sender].push(_donations.length - 1);
        _donorNames[msg.sender] = name;

        emit DonationEvent(msg.sender, name, amount);
    }

    function funds() external view returns (uint256) {
        return address(this).balance;
    }

    function donations() public view returns (Donation[] memory) {
        return _donations;
    }

    function donorName(address donor) public view returns (string memory) {
        return _donorNames[donor];
    }

    function donorTotal(address donor) public view returns (uint256) {
        uint256 total = 0;
        for (uint256 i = 0; i < _donorDonations[donor].length; i++) {
            total += _donations[_donorDonations[donor][i]].amount;
        }
        return total;
    }
}
