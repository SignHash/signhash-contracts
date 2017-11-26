pragma solidity 0.4.18;


contract TipsWallet {

    //--- Storage
    uint256 public nonce;
    address[] private _owners;

    //--- Constructor
    function TipsWallet(address[] owners)
        public
        onlyNonEmpty(owners)
    {
        _owners = owners;
    }

    //--- Fallback function
    function() public payable {
        if (msg.value > 0) {
            Deposit(msg.sender, msg.value);
        }
    }

    //--- Events
    event OwnersSet(address indexed setter, address[] owners);
    event Deposit(address indexed from, uint256 value);
    event Executed(address indexed destination, uint256 nonce, uint256 value, bytes data);

    //--- Modifiers
    modifier onlyNonEmpty(address[] addresses) {
        require(addresses.length > 0);

        _;
    }

    modifier onlySigned(uint8[] v, bytes32[] r, bytes32[] s, bytes32 hash) {
        require(
            (v.length == _owners.length) &&
            (r.length == _owners.length) &&
            (s.length == _owners.length)
        );

        bytes32 prefixedHash = keccak256("\x19Ethereum Signed Message:\n32", hash);
        for (uint256 i = 0; i < _owners.length; i++) {
            require(ecrecover(prefixedHash, v[i], r[i], s[i]) == _owners[i]);
        }

        _;

        nonce += 1;
    }

    //--- Accessors
    function owners() public view returns (address[]) {
        return _owners;
    }

    function setOwners(
        uint8[] v,
        bytes32[] r,
        bytes32[] s,
        address[] newOwners
    )
        public
        onlyNonEmpty(newOwners)
        onlySigned(v, r, s, keccak256(byte(0x19), byte(0), this, newOwners, nonce))
    {
        OwnersSet(msg.sender, newOwners);

        _owners = newOwners;
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
        onlySigned(v, r, s, keccak256(byte(0x19), byte(0), this, destination, value, data, nonce))
    {
        Executed(destination, nonce, value, data);

        /* solhint-disable avoid-call-value */
        require(destination.call.value(value)(data));
        /* solhint-enable avoid-call-value */
    }
}
