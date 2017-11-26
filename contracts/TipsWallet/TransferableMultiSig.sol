pragma solidity 0.4.18;

import "./MultiSig.sol";


contract TransferableMultiSig is MultiSig {

    //--- Constructor

    /* solhint-disable no-empty-blocks */
    function TransferableMultiSig(address[] _owners)
        public
        MultiSig(_owners)
    {
    }
    /* solhint-enable no-empty-blocks */

    //--- Events
    event OwnershipTransferred(address[] previousOwners, address[] newOwners);

    //--- Public mutable function
    function transferOwnership(
        uint8[] v,
        bytes32[] r,
        bytes32[] s,
        address[] newOwners
    )
        public
        onlyNonEmpty(newOwners)
        onlySigned(v, r, s, keccak256(byte(0x19), byte(0), this, newOwners, nonce))
    {
        OwnershipTransferred(owners, newOwners);

        owners = newOwners;
    }
}
