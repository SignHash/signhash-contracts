pragma solidity ^0.4.18;

import "truffle/Assert.sol";

import "../contracts/AddressSet.sol";
import "./Helpers.sol";


contract TestAddressSetAdd {
    using AddressSet for AddressSet.Data;
    using Helpers for AddressSet.Data;

    address constant ADDRESS_1 = address(0xdeadbeef);
    address constant ADDRESS_2 = address(0xcafebabe);
    address constant ADDRESS_3 = address(0xfee1dead);

    AddressSet.Data private set;

    function beforeEach() public {
        set.clear();
    }

    function testAddFirst() public {
        add(ADDRESS_1);

        set.shouldEqual([ADDRESS_1]);
    }

    function testAddMultiple() public {
        add(ADDRESS_1);
        add(ADDRESS_2);
        add(ADDRESS_3);

        set.shouldEqual([ADDRESS_1, ADDRESS_2, ADDRESS_3]);
    }

    function testAddDuplicateSole() public {
        add(ADDRESS_1);
        addDuplicate(ADDRESS_1);

        set.shouldEqual([ADDRESS_1]);
    }

    function testAddDuplicateFirst() public {
        add(ADDRESS_1);
        add(ADDRESS_2);
        add(ADDRESS_3);
        addDuplicate(ADDRESS_1);

        set.shouldEqual([ADDRESS_1, ADDRESS_2, ADDRESS_3]);
    }

    function testAddDuplicateLast() public {
        add(ADDRESS_1);
        add(ADDRESS_2);
        add(ADDRESS_3);
        addDuplicate(ADDRESS_3);

        set.shouldEqual([ADDRESS_1, ADDRESS_2, ADDRESS_3]);
    }

    function testAddDuplicateMiddle() public {
        add(ADDRESS_1);
        add(ADDRESS_2);
        add(ADDRESS_3);
        addDuplicate(ADDRESS_2);

        set.shouldEqual([ADDRESS_1, ADDRESS_2, ADDRESS_3]);
    }

    function testAddMultipleWithDuplicates() public {
        add(ADDRESS_1);
        add(ADDRESS_2);
        add(ADDRESS_3);
        addDuplicate(ADDRESS_2);
        addDuplicate(ADDRESS_1);
        addDuplicate(ADDRESS_3);
        addDuplicate(ADDRESS_1);
        addDuplicate(ADDRESS_2);
        addDuplicate(ADDRESS_3);

        set.shouldEqual([ADDRESS_1, ADDRESS_2, ADDRESS_3]);
    }

    function add(address addr) private {
        bool added = set.add(addr);
        Assert.isTrue(added, "Should add");
    }

    function addDuplicate(address addr) private {
        bool added = set.add(addr);
        Assert.isFalse(added, "Should not add");
    }
}
