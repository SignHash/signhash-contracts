pragma solidity ^0.4.18;

import "./AddressSet.sol";


contract SignHash {

    //--- Definitions

    using AddressSet for AddressSet.Data;

    //--- Storage

    // hash to signers
    mapping (bytes32 => AddressSet.Data) private signers;

    // signer to proofs (method to value)
    mapping (address => mapping (string => string)) private proofs;

    //--- Constructor

    function SignHash() public {}

    //--- Events

    event Signed(bytes32 indexed hash, address indexed signer);
    event Revoked(bytes32 indexed hash, address indexed signer);

    event ProofAdded(address indexed signer, string method, string value);
    event ProofRemoved(address indexed signer, string method);

    //--- Public mutable functions

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

    function addProof(string method, string value) public {
        require(bytes(method).length > 0);
        require(bytes(value).length > 0);

        proofs[msg.sender][method] = value;

        ProofAdded(msg.sender, method, value);
    }

    function removeProof(string method) public {
        require(bytes(method).length > 0);

        string storage value = proofs[msg.sender][method];
        require(bytes(value).length > 0);

        delete proofs[msg.sender][method];

        ProofRemoved(msg.sender, method);
    }

    //--- Public constant functions

    function getSigners(bytes32 hash, uint256 maxCount)
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

    function getProof(address signer, string method)
        public
        view
        returns (string)
    {
        return proofs[signer][method];
    }
}
