pragma solidity 0.4.18;

import "./MultiSig/RecoverableMultiSig.sol";


contract TipsWallet is RecoverableMultiSig {
    /* solhint-disable no-empty-blocks */
    function TipsWallet(address[] _owners, uint256 _recoveryConfirmations)
        public
        RecoverableMultiSig(_owners, _recoveryConfirmations)
    {
    }
    /* solhint-enable no-empty-blocks */
}
