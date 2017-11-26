pragma solidity 0.4.18;

import "./MultiSig/RecoverableMultiSig.sol";


contract TipsWallet is RecoverableMultiSig {

    uint256 public constant DEFAULT_RECOVERY_CONFIRMATIONS = 500 * 1000;

    /* solhint-disable no-empty-blocks */
    function TipsWallet(address[] _owners)
        public
        RecoverableMultiSig(_owners, DEFAULT_RECOVERY_CONFIRMATIONS)
    {
    }
    /* solhint-enable no-empty-blocks */
}
