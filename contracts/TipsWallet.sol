pragma solidity 0.4.18;


contract TipsWallet {

    //--- Storage
    address[] private owners;

    //--- Constructor
    function TipsWallet(address[] _owners) public {
        require(_owners.length > 0);

        owners = _owners;
        OwnersSet(msg.sender, _owners);
    }

    //--- Fallback function
    function() public payable {
        if (msg.value > 0) {
            Deposit(msg.sender, msg.value);
        }
    }

    //--- Accessors
    function getOwners() public view returns (address[]) {
        return owners;
    }

    //--- Events
    event OwnersSet(address setter, address[] owners);
    event Deposit(address from, uint256 value);
}
