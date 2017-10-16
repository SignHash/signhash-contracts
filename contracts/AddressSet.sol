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
        // preserves initial order of elements, can be optimized if not required

        uint256 position = self.index[element];
        if (position != 0) {
            // position starts from 1
            while (position < self.list.length) {
                self.list[position - 1] = self.list[position];
                position++;
            }

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

