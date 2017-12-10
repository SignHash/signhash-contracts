pragma solidity 0.4.18;

import "./AddressSet.sol";


contract SignHash {

    using AddressSet for AddressSet.Data;

    // hash to signers
    mapping (bytes32 => AddressSet.Data) private signers;

    event Signed(bytes32 indexed hash, address indexed signer);
    event Revoked(bytes32 indexed hash, address indexed signer);

    function sign(bytes32 hash) public {
        require(hash != bytes32(0));

        signers[hash].add(msg.sender);

        Signed(hash, msg.sender);
    }

    function revoke(bytes32 hash) public {
        require(hash != bytes32(0));

        signers[hash].remove(msg.sender);

        Revoked(hash, msg.sender);
    }

    function list(bytes32 hash, uint256 maxCount)
        public
        view
        returns (address[] result)
    {
        AddressSet.Data storage hashSigners = signers[hash];
        if (hashSigners.count > 0) {
            if (maxCount < hashSigners.count) {
                result = new address[](maxCount);
            } else {
                result = new address[](hashSigners.count);
            }

            address current = hashSigners.head;
            for (uint256 i = 0; i < result.length; i++) {
                result[i] = current;
                current = hashSigners.getNext(current);
            }
        }
    }
}
