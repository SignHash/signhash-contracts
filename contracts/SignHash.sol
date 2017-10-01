pragma solidity ^0.4.0;


contract SignHash {

    //--- Storage

    mapping (bytes32 => address[]) private hashSigners;

    //--- Constructor

    function SignHash() {}

    //--- Events

    event HashSigned(bytes32 indexed hash, address indexed signer);

    //--- Public mutable functions

    function sign(bytes32 hash) {
        require(hash != bytes32(0));

        address[] storage signers = hashSigners[hash];
        signers.push(msg.sender);

        HashSigned(hash, msg.sender);
    }

    //--- Public constant functions

    function getSigners(bytes32 hash) public constant returns (address[]) {
        return hashSigners[hash];
    }
}
