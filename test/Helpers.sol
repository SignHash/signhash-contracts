pragma solidity ^0.4.18;

import "truffle/Assert.sol";

import "../contracts/AddressSet.sol";


library Helpers {
    using AddressSet for AddressSet.Data;

    function shouldBeEmpty(
        AddressSet.Data storage set
    )
        internal
    {
        Assert.equal(set.count, 0, "Count should be zero");
        Assert.equal(set.head, address(0), "Head should be zero");
        Assert.equal(set.tail, address(0), "Tail should be zero");
    }

    function shouldBeHead(
        AddressSet.Data storage set,
        address expected
    )
        internal
    {
        Assert.equal(set.head, expected, "First element should be head");
        Assert.equal(set.getPrevious(set.head), address(0), "Head should not have previous");
    }

    function shouldBeTail(
        AddressSet.Data storage set,
        address expected
    )
        internal
    {
        Assert.equal(set.tail, expected, "Last element should be tail");
        Assert.equal(set.getNext(set.tail), address(0), "Tail should not have next");
    }

    function shouldCount(
        AddressSet.Data storage set,
        uint256 count
    )
        internal
    {
        Assert.equal(set.count, count, "Count should equal");
    }

    function shouldNotContain(
        AddressSet.Data storage set,
        address element
    )
        internal
    {
        Assert.notEqual(set.head, element, "Should not have the element as head");
        Assert.notEqual(set.tail, element, "Should not have the element as tail");
        Assert.isFalse(set.contains(element), "Should not contain the element");
        Assert.equal(set.getPrevious(element), address(0), "Should have empty previous");
        Assert.equal(set.getNext(element), address(0), "Should have empty next");
    }

    function shouldEqual(
        AddressSet.Data storage set,
        address[1] expected
    )
        internal
    {
        address[] memory dynamic = new address[](1);
        dynamic[0] = expected[0];
        shouldEqual(set, dynamic);
    }

    function shouldEqual(
        AddressSet.Data storage set,
        address[2] memory expected
    )
        internal
    {
        address[] memory dynamic = new address[](2);
        dynamic[0] = expected[0];
        dynamic[1] = expected[1];
        shouldEqual(set, dynamic);
    }

    function shouldEqual(
        AddressSet.Data storage set,
        address[3] memory expected
    )
        internal
    {
        address[] memory dynamic = new address[](3);
        dynamic[0] = expected[0];
        dynamic[1] = expected[1];
        dynamic[2] = expected[2];
        shouldEqual(set, dynamic);
    }

    function shouldEqual(
        AddressSet.Data storage set,
        address[] memory expected
    )
        internal
    {
        shouldCount(set, expected.length);
        shouldBeHead(set, expected[0]);
        shouldBeTail(set, expected[expected.length - 1]);
        shouldContainAll(set, expected);
        shouldIterateForward(set, expected);
        shouldIterateBackward(set, expected);
    }

    function shouldContainAll(
        AddressSet.Data storage set,
        address[] memory expected
    )
        internal
    {
        for (uint256 i = 0; i < expected.length; i++) {
            Assert.isTrue(set.contains(expected[i]), "Should contain the element");
        }
    }

    function shouldIterateForward(
        AddressSet.Data storage set,
        address[] memory expected
    )
        internal
    {
        address current = set.head;

        for (uint256 i = 0; i < expected.length; i++) {
            Assert.equal(current, expected[i], "Addresses should match");
            current = set.getNext(current);
        }

        Assert.equal(set.getNext(current), address(0), "Should be the last element");
    }

    function shouldIterateBackward(
        AddressSet.Data storage set,
        address[] memory expected
    )
        internal
    {
        address current = set.tail;

        for (int256 i = int256(expected.length) - 1; i >= 0; i--) {
            Assert.equal(current, expected[uint256(i)], "Addresses should match");
            current = set.getPrevious(current);
        }

        Assert.equal(set.getPrevious(current), address(0), "Should be the first element");
    }
}
