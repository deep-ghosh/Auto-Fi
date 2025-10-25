// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./AgentRegistry.sol";

contract MasterTradingContract is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum OrderType { BUY, SELL, REQUEST }
    enum OrderStatus { PENDING, FILLED, CANCELLED, EXPIRED }

    struct Order {
        uint256 orderId;
        address trader;
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 amountOut;
        uint256 minAmountOut;
        OrderType orderType;
        OrderStatus status;
        uint256 deadline;
        uint256 createdAt;
        string description;
    }

    struct Trade {
        uint256 tradeId;
        uint256 orderId;
        address buyer;
        address seller;
        address token;
        uint256 amount;
        uint256 price;
        uint256 timestamp;
    }

    AgentRegistry public immutable agentRegistry;
    
    mapping(uint256 => Order) public orders;
    mapping(uint256 => Trade) public trades;
    mapping(address => uint256[]) public userOrders;
    mapping(address => uint256[]) public userTrades;
    mapping(address => bool) public authorizedTokens;
    mapping(address => uint256) public tokenFees;
    
    uint256 public nextOrderId = 1;
    uint256 public nextTradeId = 1;
    uint256 public constant MAX_DEADLINE = 30 days;
    uint256 public constant MIN_DEADLINE = 1 hours;
    uint256 public defaultFee = 25; // 0.25% in basis points
    uint256 public constant FEE_PRECISION = 10000;

    event OrderCreated(
        uint256 indexed orderId,
        address indexed trader,
        address indexed tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        OrderType orderType
    );
    
    event OrderFilled(
        uint256 indexed orderId,
        uint256 indexed tradeId,
        address indexed buyer,
        address seller,
        uint256 amount,
        uint256 price
    );
    
    event OrderCancelled(uint256 indexed orderId, address indexed trader);
    event OrderExpired(uint256 indexed orderId);
    
    event TokenAuthorized(address indexed token, bool authorized);
    event FeeUpdated(address indexed token, uint256 newFee);
    
    event TradeExecuted(
        uint256 indexed tradeId,
        uint256 indexed orderId,
        address indexed buyer,
        address seller,
        address token,
        uint256 amount,
        uint256 price
    );

    constructor(address _agentRegistry) Ownable(msg.sender) {
        agentRegistry = AgentRegistry(_agentRegistry);
    }

    function createBuyOrder(
        address _tokenOut,
        uint256 _amountOut,
        uint256 _maxAmountIn,
        uint256 _deadline,
        string memory _description
    ) external whenNotPaused nonReentrant returns (uint256) {
        require(_tokenOut != address(0), "Invalid token address");
        require(_amountOut > 0, "Amount must be positive");
        require(_maxAmountIn > 0, "Max amount must be positive");
        require(_deadline >= block.timestamp + MIN_DEADLINE, "Deadline too soon");
        require(_deadline <= block.timestamp + MAX_DEADLINE, "Deadline too far");
        require(authorizedTokens[_tokenOut], "Token not authorized");

        uint256 orderId = nextOrderId++;
        
        orders[orderId] = Order({
            orderId: orderId,
            trader: msg.sender,
            tokenIn: address(0), // Native CELO
            tokenOut: _tokenOut,
            amountIn: _maxAmountIn,
            amountOut: _amountOut,
            minAmountOut: _amountOut,
            orderType: OrderType.BUY,
            status: OrderStatus.PENDING,
            deadline: _deadline,
            createdAt: block.timestamp,
            description: _description
        });

        userOrders[msg.sender].push(orderId);

        emit OrderCreated(orderId, msg.sender, address(0), _tokenOut, _maxAmountIn, _amountOut, OrderType.BUY);
        return orderId;
    }

    function createSellOrder(
        address _tokenIn,
        uint256 _amountIn,
        uint256 _minAmountOut,
        uint256 _deadline,
        string memory _description
    ) external whenNotPaused nonReentrant returns (uint256) {
        require(_tokenIn != address(0), "Invalid token address");
        require(_amountIn > 0, "Amount must be positive");
        require(_minAmountOut > 0, "Min amount must be positive");
        require(_deadline >= block.timestamp + MIN_DEADLINE, "Deadline too soon");
        require(_deadline <= block.timestamp + MAX_DEADLINE, "Deadline too far");
        require(authorizedTokens[_tokenIn], "Token not authorized");

        if (_tokenIn != address(0)) {
            IERC20(_tokenIn).safeTransferFrom(msg.sender, address(this), _amountIn);
        } else {
            require(msg.value >= _amountIn, "Insufficient CELO sent");
        }

        uint256 orderId = nextOrderId++;
        
        orders[orderId] = Order({
            orderId: orderId,
            trader: msg.sender,
            tokenIn: _tokenIn,
            tokenOut: address(0), // Native CELO
            amountIn: _amountIn,
            amountOut: 0,
            minAmountOut: _minAmountOut,
            orderType: OrderType.SELL,
            status: OrderStatus.PENDING,
            deadline: _deadline,
            createdAt: block.timestamp,
            description: _description
        });

        userOrders[msg.sender].push(orderId);

        emit OrderCreated(orderId, msg.sender, _tokenIn, address(0), _amountIn, 0, OrderType.SELL);
        return orderId;
    }

    function createRequestOrder(
        address _tokenIn,
        address _tokenOut,
        uint256 _amountIn,
        uint256 _amountOut,
        uint256 _deadline,
        string memory _description
    ) external whenNotPaused nonReentrant returns (uint256) {
        require(_tokenIn != address(0) && _tokenOut != address(0), "Invalid token addresses");
        require(_amountIn > 0 && _amountOut > 0, "Amounts must be positive");
        require(_deadline >= block.timestamp + MIN_DEADLINE, "Deadline too soon");
        require(_deadline <= block.timestamp + MAX_DEADLINE, "Deadline too far");
        require(authorizedTokens[_tokenIn] && authorizedTokens[_tokenOut], "Tokens not authorized");

        uint256 orderId = nextOrderId++;
        
        orders[orderId] = Order({
            orderId: orderId,
            trader: msg.sender,
            tokenIn: _tokenIn,
            tokenOut: _tokenOut,
            amountIn: _amountIn,
            amountOut: _amountOut,
            minAmountOut: _amountOut,
            orderType: OrderType.REQUEST,
            status: OrderStatus.PENDING,
            deadline: _deadline,
            createdAt: block.timestamp,
            description: _description
        });

        userOrders[msg.sender].push(orderId);

        emit OrderCreated(orderId, msg.sender, _tokenIn, _tokenOut, _amountIn, _amountOut, OrderType.REQUEST);
        return orderId;
    }

    function fillOrder(
        uint256 _orderId,
        uint256 _amount
    ) external payable whenNotPaused nonReentrant returns (uint256) {
        Order storage order = orders[_orderId];
        require(order.status == OrderStatus.PENDING, "Order not pending");
        require(block.timestamp <= order.deadline, "Order expired");
        require(_amount > 0, "Amount must be positive");
        require(_amount <= order.amountIn, "Amount exceeds order");

        uint256 tradeId = nextTradeId++;
        uint256 price = (_amount * order.amountOut) / order.amountIn;
        uint256 fee = (price * getTokenFee(order.tokenOut)) / FEE_PRECISION;
        uint256 netAmount = price - fee;

        if (order.orderType == OrderType.BUY) {
            require(msg.value >= _amount, "Insufficient CELO sent");
            IERC20(order.tokenOut).safeTransfer(msg.sender, _amount);
            payable(order.trader).transfer(_amount);
        } else if (order.orderType == OrderType.SELL) {
            IERC20(order.tokenIn).safeTransferFrom(msg.sender, address(this), _amount);
            payable(order.trader).transfer(netAmount);
            if (fee > 0) {
                payable(owner()).transfer(fee);
            }
        } else if (order.orderType == OrderType.REQUEST) {
            IERC20(order.tokenIn).safeTransferFrom(msg.sender, address(this), _amount);
            IERC20(order.tokenOut).safeTransfer(msg.sender, netAmount);
            if (fee > 0) {
                IERC20(order.tokenOut).safeTransfer(owner(), fee);
            }
        }

        trades[tradeId] = Trade({
            tradeId: tradeId,
            orderId: _orderId,
            buyer: msg.sender,
            seller: order.trader,
            token: order.tokenOut,
            amount: _amount,
            price: price,
            timestamp: block.timestamp
        });

        userTrades[msg.sender].push(tradeId);
        userTrades[order.trader].push(tradeId);

        order.status = OrderStatus.FILLED;

        emit TradeExecuted(tradeId, _orderId, msg.sender, order.trader, order.tokenOut, _amount, price);
        emit OrderFilled(_orderId, tradeId, msg.sender, order.trader, _amount, price);
        
        return tradeId;
    }

    function cancelOrder(uint256 _orderId) external whenNotPaused nonReentrant {
        Order storage order = orders[_orderId];
        require(order.trader == msg.sender, "Not order owner");
        require(order.status == OrderStatus.PENDING, "Order not pending");

        order.status = OrderStatus.CANCELLED;

        if (order.orderType == OrderType.SELL && order.tokenIn != address(0)) {
            IERC20(order.tokenIn).safeTransfer(msg.sender, order.amountIn);
        } else if (order.orderType == OrderType.SELL && order.tokenIn == address(0)) {
            payable(msg.sender).transfer(order.amountIn);
        }

        emit OrderCancelled(_orderId, msg.sender);
    }

    function expireOrder(uint256 _orderId) external {
        Order storage order = orders[_orderId];
        require(order.status == OrderStatus.PENDING, "Order not pending");
        require(block.timestamp > order.deadline, "Order not expired");

        order.status = OrderStatus.EXPIRED;

        if (order.orderType == OrderType.SELL && order.tokenIn != address(0)) {
            IERC20(order.tokenIn).safeTransfer(order.trader, order.amountIn);
        } else if (order.orderType == OrderType.SELL && order.tokenIn == address(0)) {
            payable(order.trader).transfer(order.amountIn);
        }

        emit OrderExpired(_orderId);
    }

    function authorizeToken(address _token, bool _authorized) external onlyOwner {
        authorizedTokens[_token] = _authorized;
        emit TokenAuthorized(_token, _authorized);
    }

    function setTokenFee(address _token, uint256 _fee) external onlyOwner {
        require(_fee <= 1000, "Fee too high"); // Max 10%
        tokenFees[_token] = _fee;
        emit FeeUpdated(_token, _fee);
    }

    function setDefaultFee(uint256 _fee) external onlyOwner {
        require(_fee <= 1000, "Fee too high"); // Max 10%
        defaultFee = _fee;
    }

    function getTokenFee(address _token) public view returns (uint256) {
        return tokenFees[_token] > 0 ? tokenFees[_token] : defaultFee;
    }

    function getOrder(uint256 _orderId) external view returns (
        uint256 orderId,
        address trader,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        uint256 minAmountOut,
        OrderType orderType,
        OrderStatus status,
        uint256 deadline,
        uint256 createdAt,
        string memory description
    ) {
        Order storage order = orders[_orderId];
        return (
            order.orderId,
            order.trader,
            order.tokenIn,
            order.tokenOut,
            order.amountIn,
            order.amountOut,
            order.minAmountOut,
            order.orderType,
            order.status,
            order.deadline,
            order.createdAt,
            order.description
        );
    }

    function getTrade(uint256 _tradeId) external view returns (
        uint256 tradeId,
        uint256 orderId,
        address buyer,
        address seller,
        address token,
        uint256 amount,
        uint256 price,
        uint256 timestamp
    ) {
        Trade storage trade = trades[_tradeId];
        return (
            trade.tradeId,
            trade.orderId,
            trade.buyer,
            trade.seller,
            trade.token,
            trade.amount,
            trade.price,
            trade.timestamp
        );
    }

    function getUserOrders(address _user) external view returns (uint256[] memory) {
        return userOrders[_user];
    }

    function getUserTrades(address _user) external view returns (uint256[] memory) {
        return userTrades[_user];
    }

    function getPendingOrders() external view returns (uint256[] memory) {
        uint256[] memory pendingOrders = new uint256[](nextOrderId - 1);
        uint256 count = 0;
        
        for (uint256 i = 1; i < nextOrderId; i++) {
            if (orders[i].status == OrderStatus.PENDING) {
                pendingOrders[count] = i;
                count++;
            }
        }
        
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = pendingOrders[i];
        }
        
        return result;
    }

    function emergencyWithdraw(
        address _token,
        address _to,
        uint256 _amount
    ) external onlyOwner {
        require(_to != address(0), "Invalid recipient");
        require(_amount > 0, "Amount must be positive");
        
        if (_token == address(0)) {
            require(address(this).balance >= _amount, "Insufficient CELO balance");
            payable(_to).transfer(_amount);
        } else {
            IERC20(_token).safeTransfer(_to, _amount);
        }
    }

    receive() external payable {
        // Accept CELO payments
    }
}
