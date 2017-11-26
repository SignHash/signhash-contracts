pragma solidity 0.4.18;

import "./TransferableMultiSig.sol";


contract TipsWallet is TransferableMultiSig {

    //--- Constructor

    /* solhint-disable no-empty-blocks */
    function TipsWallet(address[] _owners)
        public
        TransferableMultiSig(_owners)
    {
    }
    /* solhint-enable no-empty-blocks */
}
