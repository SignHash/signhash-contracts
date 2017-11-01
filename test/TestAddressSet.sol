pragma solidity ^0.4.0;

import "truffle/Assert.sol";

import "../contracts/AddressSet.sol";


contract TestAddressSet {
    using AddressSet for AddressSet.Data;

    address private address1 = address(1);
    address private address2 = address(2);
    address private address3 = address(3);

    AddressSet.Data private set;

    function beforeEach() public {
        set.clear();
    }

    function testSetInitiallyEmpty() public {
        assertEmpty(set);
    }

    function testAdd() public {
        set.add(address1);

        assertElement(set, address1);
    }

    function testAddDuplicate() public {
        set.add(address1);

        assertElement(set, address1);
    }

    function testAddMultiple() public {
        set.add(address1);
        set.add(address2);
        set.add(address3);

        assertElements(set, address1, address2, address3);
    }

    function testAddMultipleWithDuplicates() public {
        // keeps order of elements

        set.add(address1);
        set.add(address2);
        set.add(address3);
        set.add(address2);
        set.add(address1);
        set.add(address3);
        set.add(address2);

        assertElements(set, address1, address2, address3);
    }

    function testRemove() public {
        set.add(address1);
        set.remove(address1);

        assertEmpty(set);
    }

    function testRemoveFirst() public {
        // keeps order of elements

        set.add(address1);
        set.add(address2);
        set.add(address3);
        set.remove(address1);

        assertElements(set, address2, address3);
    }

    function testRemoveLast() public {
        // keeps order of elements

        set.add(address1);
        set.add(address2);
        set.add(address3);
        set.remove(address3);

        assertElements(set, address1, address2);
    }

    function testRemoveAll() public {
        // keeps order of elements

        set.add(address1);
        set.add(address2);
        set.add(address3);
        set.remove(address3);
        set.remove(address1);
        set.remove(address2);

        assertEmpty(set);
    }

    function testClear() public {
        set.add(address1);
        set.add(address2);
        set.clear();

        assertEmpty(set);
    }

    function assertEmpty(AddressSet.Data storage actual) private {
        Assert.equal(actual.list.length, 0, "List should be empty");
        Assert.equal(actual.index[address1], 0, "Address1 should not exist in index");
        Assert.equal(actual.index[address2], 0, "Address2 should not exist in index");
        Assert.equal(actual.index[address3], 0, "Address3 should not exist in index");
    }

    function assertElement(
        AddressSet.Data storage actual,
        address expected1
    )
        private
    {
        address[] memory expected = new address[](1);
        expected[0] = expected1;
        assertElements(actual, expected);
    }

    function assertElements(
        AddressSet.Data storage actual,
        address expected1,
        address expected2
    )
        private
    {
        address[] memory expected = new address[](2);
        expected[0] = expected1;
        expected[1] = expected2;
        assertElements(actual, expected);
    }

    function assertElements(
        AddressSet.Data storage actual,
        address expected1,
        address expected2,
        address expected3
    )
        private
    {
        address[] memory expected = new address[](3);
        expected[0] = expected1;
        expected[1] = expected2;
        expected[2] = expected3;
        assertElements(actual, expected);
    }

    function assertElements(
        AddressSet.Data storage actual,
        address[] memory expected
    )
        private
    {
        Assert.equal(actual.list.length, expected.length, "Should contain the same number of elements");
        for (uint256 i = 0; i < expected.length; i++) {
            Assert.equal(actual.list[i], expected[i], "Addresses should match");
            Assert.notEqual(actual.index[expected[i]], 0, "Address should exist in index");
        }
    }
}
