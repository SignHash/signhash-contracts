pragma solidity 0.4.18;

import "./AddressSet.sol";


contract SignProof {

    // signer to proofs (method to value)
    mapping (address => mapping (string => string)) private proofs;

    event Added(address indexed signer, string method, string value);
    event Removed(address indexed signer, string method);

    modifier onlyNotEmpty(string str) {
        require(bytes(str).length > 0);
        _;
    }

    modifier onlyExisting(string method) {
        require(bytes(proofs[msg.sender][method]).length > 0);
        _;
    }

    function add(string method, string value)
        public
        onlyNotEmpty(method)
        onlyNotEmpty(value)
    {
        proofs[msg.sender][method] = value;

        Added(msg.sender, method, value);
    }

    function remove(string method)
        public
        onlyNotEmpty(method)
        onlyExisting(method)
    {
        delete proofs[msg.sender][method];

        Removed(msg.sender, method);
    }

    function get(address signer, string method)
        public
        view
        returns (string)
    {
        return proofs[signer][method];
    }
}
