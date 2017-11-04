pragma solidity ^0.4.18;

import "truffle/Assert.sol";

import "../contracts/AddressSet.sol";
import "./Helpers.sol";


contract TestAddressSetRemove {
    using AddressSet for AddressSet.Data;
    using Helpers for AddressSet.Data;

    address constant ADDRESS_1 = address(0xdeadbeef);
    address constant ADDRESS_2 = address(0xcafebabe);
    address constant ADDRESS_3 = address(0xfee1dead);

    AddressSet.Data private set;

    function beforeEach() public {
        set.clear();
    }

    function testRemoveSole() public {
        add(ADDRESS_1);
        remove(ADDRESS_1);

        set.shouldBeEmpty();
        set.shouldNotContain(ADDRESS_1);
    }

    function testRemoveNotExisting() public {
        removeNotExisting(ADDRESS_1);

        set.shouldBeEmpty();
        set.shouldNotContain(ADDRESS_1);
    }

    function testRemoveDuplicate() public {
        add(ADDRESS_1);
        remove(ADDRESS_1);
        removeNotExisting(ADDRESS_1);

        set.shouldBeEmpty();
        set.shouldNotContain(ADDRESS_1);
    }

    function testRemoveFirst() public {
        add(ADDRESS_1);
        add(ADDRESS_2);
        add(ADDRESS_3);
        remove(ADDRESS_1);

        set.shouldEqual([ADDRESS_2, ADDRESS_3]);
        set.shouldNotContain(ADDRESS_1);
    }

    function testRemoveMiddle() public {
        add(ADDRESS_1);
        add(ADDRESS_2);
        add(ADDRESS_3);
        remove(ADDRESS_2);

        set.shouldEqual([ADDRESS_1, ADDRESS_3]);
        set.shouldNotContain(ADDRESS_2);
    }

    function testRemoveLast() public {
        add(ADDRESS_1);
        add(ADDRESS_2);
        add(ADDRESS_3);
        remove(ADDRESS_3);

        set.shouldEqual([ADDRESS_1, ADDRESS_2]);
        set.shouldNotContain(ADDRESS_3);
    }

    function testRemoveAll() public {
        add(ADDRESS_1);
        add(ADDRESS_2);
        add(ADDRESS_3);
        remove(ADDRESS_3);
        remove(ADDRESS_1);
        remove(ADDRESS_2);

        set.shouldBeEmpty();
        set.shouldNotContain(ADDRESS_1);
        set.shouldNotContain(ADDRESS_2);
        set.shouldNotContain(ADDRESS_3);
    }

    function testRemoveFirstAndAdd() public {
        add(ADDRESS_1);
        add(ADDRESS_2);
        remove(ADDRESS_1);
        add(ADDRESS_3);

        set.shouldEqual([ADDRESS_2, ADDRESS_3]);
        set.shouldNotContain(ADDRESS_1);
    }

    function testRemoveMiddleAndAdd() public {
        add(ADDRESS_1);
        add(ADDRESS_2);
        add(ADDRESS_3);

        remove(ADDRESS_2);
        add(ADDRESS_2);

        set.shouldEqual([ADDRESS_1, ADDRESS_3, ADDRESS_2]);
    }

    function testRemoveLastAndAdd() public {
        add(ADDRESS_1);
        add(ADDRESS_2);
        remove(ADDRESS_2);
        add(ADDRESS_3);

        set.shouldEqual([ADDRESS_1, ADDRESS_3]);
        set.shouldNotContain(ADDRESS_2);
    }

    function testClear() public {
        add(ADDRESS_1);
        add(ADDRESS_2);
        set.clear();

        set.shouldBeEmpty();
        set.shouldNotContain(ADDRESS_1);
        set.shouldNotContain(ADDRESS_2);
    }

    function add(address addr) private {
        bool added = set.add(addr);
        Assert.isTrue(added, "Should add");
    }

    function remove(address addr) private {
        bool removed = set.remove(addr);
        Assert.isTrue(removed, "Should remove");
    }

    function removeNotExisting(address addr) private {
        bool removed = set.remove(addr);
        Assert.isFalse(removed, "Should not remove");
    }
}
