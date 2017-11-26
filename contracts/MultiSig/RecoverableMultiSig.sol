pragma solidity 0.4.18;

import "./TransferableMultiSig.sol";


contract RecoverableMultiSig is TransferableMultiSig {

    uint256 public recoveryConfirmations;
    uint256 public recoveryBlock;
    bytes32 public recoveryHash;

    function RecoverableMultiSig(address[] _owners, uint256 _recoveryConfirmations)
        public
        TransferableMultiSig(_owners)
    {
        recoveryConfirmations = _recoveryConfirmations;
    }

    event RecoveryStarted(address indexed from, address[] newOwners);

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
        require(block.number >= recoveryBlock + recoveryConfirmations);
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
    }

    function cancelRecovery()
        public
        onlyOwner
        onlyRecoveryStarted
    {
        clearRecovery();
    }

    function confirmRecovery(address[] newOwners)
        public
        onlyOwner
        onlyRecoveryPassed
        onlyRecoveryMatches(newOwners)
    {
        owners = newOwners;

        clearRecovery();
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
