pragma solidity ^0.4.0;


contract SignHash {

    //--- Storage

    mapping (bytes32 => address[]) private hashSigners;
    mapping (address => mapping (string => string)) private signerProofs;

    //--- Constructor

    function SignHash() {}

    //--- Events

    event HashSigned(bytes32 indexed hash, address indexed signer);
    event SignerProved(address indexed signer, string method, string value);

    //--- Public mutable functions

    function sign(bytes32 hash) {
        require(hash != bytes32(0));

        address[] storage signers = hashSigners[hash];
        signers.push(msg.sender);

        HashSigned(hash, msg.sender);
    }

    function prove(string method, string value) {
        require(bytes(method).length > 0);
        require(bytes(value).length > 0);

        signerProofs[msg.sender][method] = value;

        SignerProved(msg.sender, method, value);
    }

    //--- Public constant functions

    function getSigners(bytes32 hash) public constant returns (address[]) {
        return hashSigners[hash];
    }

    function getProof(address signer, string method) public constant returns (string) {
        return signerProofs[signer][method];
    }
}
