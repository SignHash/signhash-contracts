pragma solidity 0.4.18;

import "./AddressSet.sol";


contract SignHash {

    using AddressSet for AddressSet.Data;

    // hash to signers
    mapping (bytes32 => AddressSet.Data) private signers;

    event Signed(bytes32 indexed hash, address indexed signer);
    event Revoked(bytes32 indexed hash, address indexed signer);

    modifier onlyNotZero(bytes32 value) {
        require(value != bytes32(0));
        _;
    }

    function sign(bytes32 hash)
        public
        onlyNotZero(hash)
    {
        signers[hash].add(msg.sender);

        Signed(hash, msg.sender);
    }

    function revoke(bytes32 hash)
        public
        onlyNotZero(hash)
    {
        signers[hash].remove(msg.sender);

        Revoked(hash, msg.sender);
    }

    function list(bytes32 hash, uint256 maxCount)
        public
        view
        returns (address[])
    {
        return signers[hash].toArray(maxCount);
    }
}
