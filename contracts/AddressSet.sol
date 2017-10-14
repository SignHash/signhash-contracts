pragma solidity ^0.4.0;


library AddressSet {
    struct Data {
        address[] list;
        mapping (address => uint256) index; // 1..n, 0 means it does not exists
    }

    function add(Data storage self, address element) public {
        if (self.index[element] == 0) {
            self.list.push(element);
            self.index[element] = self.list.length;
        }
    }

    function remove(Data storage self, address element) {
        uint256 position = self.index[element];
        if (position != 0) {
            self.list[position - 1] = self.list[self.list.length - 1];
            self.list.length--;

            delete self.index[element];
        }
    }

    function clear(Data storage self) public {
        for (uint256 i = 0; i < self.list.length; i++) {
            delete self.index[self.list[i]];
        }
        delete self.list;
    }
}

