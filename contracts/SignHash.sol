pragma solidity ^0.4.0;

import "./AddressSet.sol";


contract SignHash {

    //--- Definitions

    using AddressSet for AddressSet.Data;

    //--- Storage

    // hash to signers
    mapping (bytes32 => AddressSet.Data) private hashSigners;

    // signer to proofs (method to value)
    mapping (address => mapping (string => string)) private proofs;

    //--- Constructor

    function SignHash() {}

    //--- Events

    event Signed(bytes32 indexed hash, address indexed signer);
    event ProofAdded(address indexed signer, string method, string value);
    event ProofRemoved(address indexed signer, string method);

    //--- Public mutable functions

    function sign(bytes32 hash) {
        require(hash != bytes32(0));

        hashSigners[hash].add(msg.sender);

        Signed(hash, msg.sender);
    }

    function addProof(string method, string value) {
        require(bytes(method).length > 0);
        require(bytes(value).length > 0);

        proofs[msg.sender][method] = value;

        ProofAdded(msg.sender, method, value);
    }

    function removeProof(string method) {
        require(bytes(method).length > 0);

        string storage value = proofs[msg.sender][method];
        require(bytes(value).length > 0);

        delete proofs[msg.sender][method];

        ProofRemoved(msg.sender, method);
    }

    //--- Public constant functions

    function getSigners(bytes32 hash)
        public
        constant
        returns (address[])
    {
        return hashSigners[hash].list;
    }

    function getProof(address signer, string method)
        public
        constant
        returns (string)
    {
        return proofs[signer][method];
    }
}
