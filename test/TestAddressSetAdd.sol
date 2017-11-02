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
        shouldAdd(ADDRESS_1);

        set.shouldEqual([ADDRESS_1]);
    }

    function testAddMultiple() public {
        shouldAdd(ADDRESS_1);
        shouldAdd(ADDRESS_2);
        shouldAdd(ADDRESS_3);

        set.shouldEqual([ADDRESS_1, ADDRESS_2, ADDRESS_3]);
    }

    function testAddDuplicateSole() public {
        shouldAdd(ADDRESS_1);
        shouldNotAdd(ADDRESS_1);

        set.shouldEqual([ADDRESS_1]);
    }

    function testAddDuplicateFirst() public {
        shouldAdd(ADDRESS_1);
        shouldAdd(ADDRESS_2);
        shouldAdd(ADDRESS_3);
        shouldNotAdd(ADDRESS_1);

        set.shouldEqual([ADDRESS_1, ADDRESS_2, ADDRESS_3]);
    }

    function testAddDuplicateLast() public {
        shouldAdd(ADDRESS_1);
        shouldAdd(ADDRESS_2);
        shouldAdd(ADDRESS_3);
        shouldNotAdd(ADDRESS_3);

        set.shouldEqual([ADDRESS_1, ADDRESS_2, ADDRESS_3]);
    }

    function testAddDuplicateMiddle() public {
        shouldAdd(ADDRESS_1);
        shouldAdd(ADDRESS_2);
        shouldAdd(ADDRESS_3);
        shouldNotAdd(ADDRESS_2);

        set.shouldEqual([ADDRESS_1, ADDRESS_2, ADDRESS_3]);
    }

    function testAddMultipleWithDuplicates() public {
        shouldAdd(ADDRESS_1);
        shouldAdd(ADDRESS_2);
        shouldAdd(ADDRESS_3);
        shouldNotAdd(ADDRESS_2);
        shouldNotAdd(ADDRESS_1);
        shouldNotAdd(ADDRESS_3);
        shouldNotAdd(ADDRESS_1);
        shouldNotAdd(ADDRESS_2);
        shouldNotAdd(ADDRESS_3);

        set.shouldEqual([ADDRESS_1, ADDRESS_2, ADDRESS_3]);
    }

    function shouldAdd(address addr) private {
        bool added = set.add(addr);
        Assert.isTrue(added, "Should add");
    }

    function shouldNotAdd(address addr) private {
        bool added = set.add(addr);
        Assert.isFalse(added, "Should not add");
    }
}
