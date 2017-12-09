pragma solidity 0.4.18;

import "./MultiSig/MultiSig.sol";
import "./MultiSig/TransferableMultiSig.sol";
import "./MultiSig/RecoverableMultiSig.sol";


contract TipsWallet is MultiSig, TransferableMultiSig, RecoverableMultiSig {
    /* solhint-disable no-empty-blocks */
    function TipsWallet(address[] _owners, uint256 _recoveryBlockOffset)
        public
        MultiSig(_owners)
        TransferableMultiSig(_owners)
        RecoverableMultiSig(_owners, _recoveryBlockOffset)
    {
    }
    /* solhint-enable no-empty-blocks */
}
