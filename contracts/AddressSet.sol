pragma solidity 0.4.18;


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
        returns (bool)
    {
        require(element != address(0));

        if (self.head == address(0)) { // empty list
            self.head = element;
        } else if (!contains(self, element)) { // not existing
            self.links[self.tail].next = element;
            self.links[element].previous = self.tail;
        } else { // duplicate
            return false;
        }

        self.tail = element;
        safeIncrement(self);

        return true;
    }

    function remove(
        Data storage self,
        address element
    )
        internal
        returns (bool)
    {
        require(element != address(0));

        Link storage link = self.links[element];

        if (link.previous != address(0)) { // middle or tail
            self.links[link.previous].next = link.next;
        } else if (element == self.head) { // head
            self.head = link.next;
        } else { // not existing
            return false;
        }

        if (link.next != address(0)) {
            self.links[link.next].previous = link.previous;
        } else {
            self.tail = link.previous;
        }

        safeDecrement(self);
        delete self.links[element];

        return true;
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
        return element == self.head ||
            self.links[element].previous != address(0);
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

