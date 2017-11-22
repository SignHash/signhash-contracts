pragma solidity 0.4.18;


contract TipsWallet {

    //--- Storage
    uint256 public nonce;
    address[] private _owners;

    //--- Constructor
    function TipsWallet(address[] owners) public {
        require(owners.length > 0);

        _owners = owners;
        OwnersSet(msg.sender, owners);
    }

    //--- Fallback function
    function() public payable {
        if (msg.value > 0) {
            Deposit(msg.sender, msg.value);
        }
    }

    //--- Events
    event OwnersSet(address setter, address[] owners);
    event Deposit(address from, uint256 value);
    event Executed(address destination, uint256 nonce, uint256 value, bytes data);

    //--- Accessors
    function owners() public view returns (address[]) {
        return _owners;
    }

    //--- Public mutable functions
    function execute(
        uint8[] v,
        bytes32[] r,
        bytes32[] s,
        address destination,
        uint256 value,
        bytes data
    )
        public
    {
        require((v.length == _owners.length) && (r.length == _owners.length) && (s.length == _owners.length));

        bytes32 hash = keccak256(byte(0x19), byte(0), this, destination, value, data, nonce);
        bytes32 prefixedHash = keccak256("\x19Ethereum Signed Message:\n32", hash);

        for (uint256 i = 0; i < _owners.length; i++) {
            require(ecrecover(prefixedHash, v[i], r[i], s[i]) == _owners[i]);
        }

        Executed(destination, nonce, value, data);

        nonce += 1;

        /* solhint-disable avoid-call-value */
        require(destination.call.value(value)(data));
        /* solhint-enable avoid-call-value */
    }
}
