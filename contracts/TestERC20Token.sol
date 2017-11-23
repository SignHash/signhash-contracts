pragma solidity 0.4.18;


contract TestERC20Token {

    //--- Storage
    string public name = "TestERC20";
    string public symbol = "TEST";
    uint256 public decimals = 18;

    uint256 public totalSupply;
    mapping(address => uint256) balances;
    mapping (address => mapping (address => uint256)) allowed;

    //--- Constructor
    function TestERC20Token() public {
        totalSupply = 10000 * (10 ** decimals);
        balances[msg.sender] = totalSupply;
    }

    //--- Events
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event Transfer(address indexed from, address indexed to, uint256 value);

    //--- Public mutable functions
    function transfer(address to, uint256 value) public returns (bool) {
        require(to != address(0));

        balances[msg.sender] = safeSub(balances[msg.sender], value);
        balances[to] = safeAdd(balances[to], value);
        Transfer(msg.sender, to, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) public returns (bool) {
        require(to != address(0));

        uint256 allowance = allowed[from][msg.sender];

        balances[from] = safeSub(balances[from], value);
        balances[to] = safeAdd(balances[to], value);
        allowed[from][msg.sender] = safeSub(allowance, value);

        Transfer(from, to, value);

        return true;
    }

    function approve(address spender, uint256 value) public returns (bool) {
        allowed[msg.sender][spender] = value;
        Approval(msg.sender, spender, value);

        return true;
    }

    //--- Public view functions
    function allowance(address owner, address spender) public view returns (uint256 remaining) {
        return allowed[owner][spender];
    }

    function balanceOf(address owner) public view returns (uint256 balance) {
        return balances[owner];
    }

    //--- Private pure functions
    function safeSub(uint256 a, uint256 b) private pure returns (uint256) {
        assert(b <= a);
        return a - b;
    }

    function safeAdd(uint256 a, uint256 b) private pure returns (uint256) {
        uint256 c = a + b;
        assert(c >= a);
        return c;
    }
}
