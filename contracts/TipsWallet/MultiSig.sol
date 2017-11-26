pragma solidity 0.4.18;


contract MultiSig {

    //--- Storage
    uint256 public nonce;
    address[] public owners;

    //--- Constructor
    function MultiSig(address[] _owners)
        public
        onlyNonEmpty(_owners)
    {
        owners = _owners;
    }

    //--- Modifiers
    modifier onlySigned(uint8[] v, bytes32[] r, bytes32[] s, bytes32 hash) {
        require(
            (v.length == owners.length) &&
            (r.length == owners.length) &&
            (s.length == owners.length)
        );

        bytes32 prefixedHash = keccak256("\x19Ethereum Signed Message:\n32", hash);
        for (uint256 i = 0; i < owners.length; i++) {
            require(ecrecover(prefixedHash, v[i], r[i], s[i]) == owners[i]);
        }

        _;

        nonce += 1;
    }

    modifier onlyNonEmpty(address[] addresses) {
        require(addresses.length > 0);
        _;
    }

    //--- Events
    event Executed(address indexed destination, uint256 nonce, uint256 value, bytes data);

    //--- Fallback function
    /* solhint-disable no-empty-blocks */
    function() public payable {}
    /* solhint-disable no-empty-blocks */

    //--- Public view functions
    function listOwners() public view returns (address[]) {
        return owners;
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
