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
        shouldAdd(ADDRESS_1);
        shouldRemove(ADDRESS_1);

        set.shouldBeEmpty();
        set.shouldNotContain(ADDRESS_1);
    }

    function testRemoveNotExisting() public {
        shouldNotRemove(ADDRESS_1);

        set.shouldBeEmpty();
        set.shouldNotContain(ADDRESS_1);
    }

    function testRemoveDuplicate() public {
        shouldAdd(ADDRESS_1);
        shouldRemove(ADDRESS_1);
        shouldNotRemove(ADDRESS_1);

        set.shouldBeEmpty();
        set.shouldNotContain(ADDRESS_1);
    }

    function testRemoveFirst() public {
        shouldAdd(ADDRESS_1);
        shouldAdd(ADDRESS_2);
        shouldAdd(ADDRESS_3);
        shouldRemove(ADDRESS_1);

        set.shouldEqual([ADDRESS_2, ADDRESS_3]);
        set.shouldNotContain(ADDRESS_1);
    }

    function testRemoveMiddle() public {
        shouldAdd(ADDRESS_1);
        shouldAdd(ADDRESS_2);
        shouldAdd(ADDRESS_3);
        shouldRemove(ADDRESS_2);

        set.shouldEqual([ADDRESS_1, ADDRESS_3]);
        set.shouldNotContain(ADDRESS_2);
    }

    function testRemoveLast() public {
        shouldAdd(ADDRESS_1);
        shouldAdd(ADDRESS_2);
        shouldAdd(ADDRESS_3);
        shouldRemove(ADDRESS_3);

        set.shouldEqual([ADDRESS_1, ADDRESS_2]);
        set.shouldNotContain(ADDRESS_3);
    }

    function testRemoveAll() public {
        shouldAdd(ADDRESS_1);
        shouldAdd(ADDRESS_2);
        shouldAdd(ADDRESS_3);
        shouldRemove(ADDRESS_3);
        shouldRemove(ADDRESS_1);
        shouldRemove(ADDRESS_2);

        set.shouldBeEmpty();
        set.shouldNotContain(ADDRESS_1);
        set.shouldNotContain(ADDRESS_2);
        set.shouldNotContain(ADDRESS_3);
    }

    function testRemoveFirstAndAdd() public {
        shouldAdd(ADDRESS_1);
        shouldAdd(ADDRESS_2);
        shouldRemove(ADDRESS_1);
        shouldAdd(ADDRESS_3);

        set.shouldEqual([ADDRESS_2, ADDRESS_3]);
        set.shouldNotContain(ADDRESS_1);
    }

    function testRemoveMiddleAndAdd() public {
        shouldAdd(ADDRESS_1);
        shouldAdd(ADDRESS_2);
        shouldAdd(ADDRESS_3);

        shouldRemove(ADDRESS_2);
        shouldAdd(ADDRESS_2);

        set.shouldEqual([ADDRESS_1, ADDRESS_3, ADDRESS_2]);
    }

    function testRemoveLastAndAdd() public {
        shouldAdd(ADDRESS_1);
        shouldAdd(ADDRESS_2);
        shouldRemove(ADDRESS_2);
        shouldAdd(ADDRESS_3);

        set.shouldEqual([ADDRESS_1, ADDRESS_3]);
        set.shouldNotContain(ADDRESS_2);
    }

    function testClear() public {
        shouldAdd(ADDRESS_1);
        shouldAdd(ADDRESS_2);
        set.clear();

        set.shouldBeEmpty();
        set.shouldNotContain(ADDRESS_1);
        set.shouldNotContain(ADDRESS_2);
    }

    function shouldAdd(address addr) private {
        bool added = set.add(addr);
        Assert.isTrue(added, "Should add");
    }

    function shouldRemove(address addr) private {
        bool removed = set.remove(addr);
        Assert.isTrue(removed, "Should remove");
    }

    function shouldNotRemove(address addr) private {
        bool removed = set.remove(addr);
        Assert.isFalse(removed, "Should not remove");
    }
}
