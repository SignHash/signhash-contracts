pragma solidity ^0.4.0;

import "truffle/Assert.sol";

import "../contracts/AddressSet.sol";


contract TestAddressSet {
    using AddressSet for AddressSet.Data;

    address address1 = address(1);
    address address2 = address(2);
    address address3 = address(3);

    AddressSet.Data set;

    function beforeEach() public {
        set.clear();
    }

    function testSetInitiallyEmpty() public {
        Assert.equal(set.list.length, 0, "List should be empty");
    }

    function testAdd() public {
        set.add(address1);

        Assert.equal(set.list.length, 1, "List should have a single element");
        Assert.equal(set.list[0], address1, "First element should match");
    }

    function testAddDuplicate() public {
        set.add(address1);

        Assert.equal(set.list.length, 1, "List should have a single element");
        Assert.equal(set.list[0], address1, "First element should match");
    }

    function testAddMultiple() public {
        set.add(address1);
        set.add(address2);
        set.add(address3);

        Assert.equal(set.list.length, 3, "List should have a single element");
        Assert.equal(set.list[0], address1, "First element should match");
        Assert.equal(set.list[1], address2, "Second element should match");
        Assert.equal(set.list[2], address3, "Third element should match");
    }

    function testAddMultipleWithDuplicates() public {
        set.add(address1);
        set.add(address2);
        set.add(address3);
        set.add(address2);
        set.add(address1);
        set.add(address3);
        set.add(address2);

        Assert.equal(set.list.length, 3, "List should have a single element");
        Assert.equal(set.list[0], address1, "First element should match");
        Assert.equal(set.list[1], address2, "Second element should match");
        Assert.equal(set.list[2], address3, "Third element should match");
    }

    function testRemove() public {
        set.add(address1);
        set.remove(address1);

        Assert.equal(set.list.length, 0, "List should be empty");
        Assert.equal(set.index[address1], 0, "Index should not contain the address");
    }

    function testRemoveFirst() public {
        set.add(address1);
        set.add(address2);
        set.add(address3);
        set.remove(address1);

        Assert.equal(set.list.length, 2, "List should have a two elements");
        Assert.equal(set.list[0], address3, "First element should match");
        Assert.equal(set.list[1], address2, "Second element should match");
    }

    function testRemoveLast() public {
        set.add(address1);
        set.add(address2);
        set.add(address3);
        set.remove(address3);

        Assert.equal(set.list.length, 2, "List should have a two elements");
        Assert.equal(set.list[0], address1, "First element should match");
        Assert.equal(set.list[1], address2, "Second element should match");
    }

    function testClear() public {
        set.add(address1);
        set.add(address2);

        set.clear();

        Assert.equal(set.list.length, 0, "List should be empty");
        Assert.equal(set.index[address1], 0, "Index should not contain the first address");
        Assert.equal(set.index[address2], 0, "Index should not contain the second address");
    }
}
