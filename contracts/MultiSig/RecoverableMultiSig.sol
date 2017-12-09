pragma solidity 0.4.18;

import "./MultiSig.sol";


contract RecoverableMultiSig is MultiSig {

    uint256 public recoveryBlockOffset;
    uint256 public recoveryBlock;
    bytes32 public recoveryHash;

    function RecoverableMultiSig(address[] _owners, uint256 _recoveryBlockOffset)
        public
        MultiSig(_owners)
    {
        recoveryBlockOffset = _recoveryBlockOffset;
    }

    event RecoveryStarted(address indexed from, address[] newOwners);
    event RecoveryCancelled(address indexed from);
    event RecoveryConfirmed(address indexed from, address[] newOwners);

    modifier onlyOwner() {
        require(isOwner(msg.sender));
        _;
    }

    modifier onlyRecoveryStarted() {
        require(recoveryBlock > 0);
        _;
    }

    modifier onlyRecoveryPassed() {
        require(recoveryBlock > 0);
        require(block.number >= recoveryBlock + recoveryBlockOffset);
        _;
    }

    modifier onlyRecoveryMatches(address[] newOwners) {
        require(keccak256(newOwners) == recoveryHash);
        _;
    }

    function startRecovery(address[] newOwners)
        public
        onlyOwner
        onlyNotEmpty(newOwners)
    {
        recoveryBlock = block.number;
        recoveryHash = keccak256(newOwners);

        RecoveryStarted(msg.sender, newOwners);
    }

    function cancelRecovery()
        public
        onlyOwner
        onlyRecoveryStarted
    {
        clearRecovery();

        RecoveryCancelled(msg.sender);
    }

    function confirmRecovery(address[] newOwners)
        public
        onlyOwner
        onlyRecoveryPassed
        onlyRecoveryMatches(newOwners)
    {
        owners = newOwners;

        clearRecovery();

        RecoveryConfirmed(msg.sender, newOwners);
    }

    function isOwner(address account) public view returns (bool) {
        for (uint256 i = 0; i < owners.length; i++) {
            if (account == owners[i]) {
                return true;
            }
        }

        return false;
    }

    function clearRecovery() private {
        delete recoveryBlock;
        delete recoveryHash;
    }
}
