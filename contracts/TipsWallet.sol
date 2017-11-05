pragma solidity 0.4.18;

import "./AddressSet.sol";


contract TipsWallet {

    //--- Definitions
    using AddressSet for AddressSet.Data;

    //--- Storage
    AddressSet.Data private owners;

    uint256 public lastSettledBalance;
    mapping(address => uint256) public settledShares;

    //--- Constructor
    function TipsWallet(address[] _owners) public {
        require(_owners.length > 0);

        for (uint256 i = 0; i < _owners.length; i++) {
            owners.add(_owners[i]);
        }
    }

    //--- Modifiers
    modifier onlyOwners() {
        require(owners.contains(msg.sender));
        _;
    }

    //--- Fallback
    /* solhint-disable no-empty-blocks */
    function() public payable {
        // postpone distribution to settlement
        // keep the gas usage as low as possible
    }
    /* solhint-enable no-empty-blocks */

    //--- Public mutable functions
    function withdraw(uint256 value) public {
        require(value > 0);
        uint256 balance = settledShares[msg.sender];

        require(value <= balance);

        subShare(msg.sender, value);
        msg.sender.transfer(balance);
    }

    function settle() public onlyOwners {
        if (this.balance > lastSettledBalance) {
            uint256 share = (this.balance - lastSettledBalance) / owners.count;

            address owner = owners.head;
            for (uint256 i = 0; i < owners.count; i++) {
                addShare(owner, share);
                owner = owners.getNext(owner);
            }

            lastSettledBalance = this.balance;
        }
    }

    //--- Public view functions
    function getOwners() public view returns (address[] result) {
        result = new address[](owners.count);

        address current = owners.head;
        for (uint256 i = 0; i < result.length; i++) {
            result[i] = current;
            current = owners.getNext(current);
        }
    }

    function getUnsettledBalance() public view returns (uint256) {
        return this.balance - lastSettledBalance;
    }

    //--- Private mutable functions
    function addShare(address account, uint256 value) private {
        uint256 current = settledShares[account];
        settledShares[account] += value;
        assert(settledShares[account] >= current); // check overflow
    }

    function subShare(address account, uint256 value) private {
        uint256 current = settledShares[account];
        assert(value <= current); // check underflow
        settledShares[account] -= value;
    }
}
