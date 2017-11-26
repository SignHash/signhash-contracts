pragma solidity 0.4.18;

import "truffle/Assert.sol";

import "../../contracts/AddressSet.sol";
import "./Helpers.sol";


contract TestAddressSetEmpty {
    using AddressSet for AddressSet.Data;
    using Helpers for AddressSet.Data;

    address private constant NOT_EXISTING = address(0xdeadbeef);

    AddressSet.Data private set;

    function testInitiallyEmpty() public {
        set.shouldBeEmpty();
        set.shouldNotContain(NOT_EXISTING);
    }

    function testGetNextForNotExisting() public {
        address next = set.getNext(NOT_EXISTING);
        Assert.equal(next, address(0), "Should return empty next");
    }

    function testGetPreviousForNotExisting() public {
        address previous = set.getPrevious(NOT_EXISTING);
        Assert.equal(previous, address(0), "Should return empty previous");
    }

    function testContainsForNotExisting() public {
        bool contained = set.contains(NOT_EXISTING);
        Assert.isFalse(contained, "Should not contain");
    }
}
