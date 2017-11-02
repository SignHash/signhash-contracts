pragma solidity ^0.4.18;


library AddressSet {

    //--- Definitions

    struct Link {
        address previous;
        address next;
    }

    struct Data {
        address head;
        address tail;
        uint256 count;
        mapping (address => Link) links;
    }

    //--- Public mutable functions

    function add(
        Data storage self,
        address element
    )
        internal
        returns (bool added)
    {
        require(element != address(0));

        if (self.count == 0) {
            self.head = element;
            added = true;
        } else if (!contains(self, element)) {
            self.links[self.tail].next = element;
            self.links[element].previous = self.tail;
            added = true;
        }

        if (added) {
            self.tail = element;
            safeIncrement(self);
        }
    }

    function remove(
        Data storage self,
        address element
    )
        internal
        returns (bool removed)
    {
        require(element != address(0));

        Link storage link = self.links[element];

        if (link.previous != address(0)) {
            self.links[link.previous].next = link.next;
            removed = true;
        } else if (element == self.head) {
            self.head = link.next;
            removed = true;
        }

        if (link.next != address(0)) {
            self.links[link.next].previous = link.previous;
            removed = true;
        } else if (element == self.tail) {
            self.tail = link.previous;
            removed = true;
        }

        if (removed) {
            delete self.links[element];
            safeDecrement(self);
        }
    }

    function clear(Data storage self) internal {
        address current = self.head;

        while (current != address(0)) {
            address next = self.links[current].next;
            delete self.links[current];
            current = next;
        }

        delete self.head;
        delete self.tail;
        delete self.count;
    }

    //--- Public view functions

    function getNext(
        Data storage self,
        address current
    )
        internal
        view
        returns (address)
    {
        return self.links[current].next;
    }

    function getPrevious(
        Data storage self,
        address current
    )
        internal
        view
        returns (address)
    {
        return self.links[current].previous;
    }

    function contains(
        Data storage self,
        address element
    )
        internal
        view
        returns (bool)
    {
        return self.head == element || self.links[element].previous != address(0);
    }

    //--- Private mutable functions

    function safeIncrement(Data storage self) private {
        assert(self.count + 1 > self.count);
        self.count++;
    }

    function safeDecrement(Data storage self) private {
        assert(self.count > 0);
        self.count--;
    }
}

