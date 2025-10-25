// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./AgentRegistry.sol";

contract AgentTreasury is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct TimeLockedWithdrawal {
        uint256 agentId;
        address token;
        address recipient;
        uint256 amount;
        uint256 unlockTime;
        bool executed;
    }

    AgentRegistry public immutable agentRegistry;
    
    mapping(address => uint256) public tokenBalances;
    mapping(uint256 => TimeLockedWithdrawal) public timeLockedWithdrawals;
    mapping(uint256 => uint256) public agentDailyWithdrawn;
    mapping(uint256 => uint256) public agentLastResetDay;
    
    uint256 public nextTimeLockId = 1;
    uint256 public constant SECONDS_PER_DAY = 86400;
    uint256 public constant MIN_TIME_LOCK = 1 hours;
    uint256 public constant MAX_TIME_LOCK = 30 days;

    event Deposit(address indexed token, uint256 amount, address indexed depositor);
    event AgentWithdrawal(
        uint256 indexed agentId,
        address indexed token,
        address indexed recipient,
        uint256 amount
    );
    event BatchTransfer(
        uint256 indexed agentId,
        address indexed token,
        address[] recipients,
        uint256[] amounts
    );
    event TimeLockedWithdrawalScheduled(
        uint256 indexed timeLockId,
        uint256 indexed agentId,
        address indexed token,
        uint256 amount,
        uint256 unlockTime
    );
    event TimeLockedWithdrawalExecuted(uint256 indexed timeLockId);

    constructor(address _agentRegistry) Ownable(msg.sender) {
        agentRegistry = AgentRegistry(_agentRegistry);
    }

    function deposit(address _token, uint256 _amount) external payable whenNotPaused {
        if (_token == address(0)) {
            require(msg.value > 0, "No CELO sent");
            tokenBalances[address(0)] += msg.value;
            emit Deposit(address(0), msg.value, msg.sender);
        } else {
            require(_amount > 0, "Amount must be positive");
            IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);
            tokenBalances[_token] += _amount;
            emit Deposit(_token, _amount, msg.sender);
        }
    }

    function agentWithdraw(
        uint256 _agentId,
        address _token,
        address _recipient,
        uint256 _amount
    ) external whenNotPaused nonReentrant returns (bool) {
        require(agentRegistry.agents(_agentId).isActive, "Agent not active");
        require(agentRegistry.agents(_agentId).agentWallet == msg.sender, "Not agent wallet");
        require(_amount > 0, "Amount must be positive");
        require(_recipient != address(0), "Invalid recipient");
        require(tokenBalances[_token] >= _amount, "Insufficient treasury balance");

        require(
            agentRegistry.isOperationAllowed(_agentId, "TRANSFER", _amount, _recipient),
            "Operation not allowed"
        );

        _updateDailyWithdrawal(_agentId, _amount);

        agentRegistry.recordAgentAction(_agentId, "TRANSFER", _amount, _recipient);

        tokenBalances[_token] -= _amount;
        
        if (_token == address(0)) {
            payable(_recipient).transfer(_amount);
        } else {
            IERC20(_token).safeTransfer(_recipient, _amount);
        }

        emit AgentWithdrawal(_agentId, _token, _recipient, _amount);
        return true;
    }

    function batchTransfer(
        uint256 _agentId,
        address _token,
        address[] memory _recipients,
        uint256[] memory _amounts
    ) external whenNotPaused nonReentrant returns (bool) {
        require(agentRegistry.agents(_agentId).isActive, "Agent not active");
        require(agentRegistry.agents(_agentId).agentWallet == msg.sender, "Not agent wallet");
        require(_recipients.length == _amounts.length, "Array length mismatch");
        require(_recipients.length > 0, "Empty recipients");

        uint256 totalAmount = 0;
        for (uint256 i = 0; i < _amounts.length; i++) {
            totalAmount += _amounts[i];
        }

        require(totalAmount > 0, "Total amount must be positive");
        require(tokenBalances[_token] >= totalAmount, "Insufficient treasury balance");

        require(
            agentRegistry.isOperationAllowed(_agentId, "TRANSFER", totalAmount, address(0)),
            "Operation not allowed"
        );

        _updateDailyWithdrawal(_agentId, totalAmount);

        agentRegistry.recordAgentAction(_agentId, "TRANSFER", totalAmount, address(0));

        tokenBalances[_token] -= totalAmount;
        
        for (uint256 i = 0; i < _recipients.length; i++) {
            require(_recipients[i] != address(0), "Invalid recipient");
            require(_amounts[i] > 0, "Amount must be positive");
            
            if (_token == address(0)) {
                payable(_recipients[i]).transfer(_amounts[i]);
            } else {
                IERC20(_token).safeTransfer(_recipients[i], _amounts[i]);
            }
        }

        emit BatchTransfer(_agentId, _token, _recipients, _amounts);
        return true;
    }

    function getBalance(address _token) external view returns (uint256) {
        return tokenBalances[_token];
    }

    function scheduleTimeLocked(
        uint256 _agentId,
        address _token,
        address _recipient,
        uint256 _amount,
        uint256 _unlockTime
    ) external whenNotPaused returns (uint256) {
        require(agentRegistry.agents(_agentId).isActive, "Agent not active");
        require(agentRegistry.agents(_agentId).agentWallet == msg.sender, "Not agent wallet");
        require(_amount > 0, "Amount must be positive");
        require(_recipient != address(0), "Invalid recipient");
        require(tokenBalances[_token] >= _amount, "Insufficient treasury balance");
        require(_unlockTime > block.timestamp + MIN_TIME_LOCK, "Unlock time too soon");
        require(_unlockTime <= block.timestamp + MAX_TIME_LOCK, "Unlock time too far");

        require(
            agentRegistry.isOperationAllowed(_agentId, "TRANSFER", _amount, _recipient),
            "Operation not allowed"
        );

        uint256 timeLockId = nextTimeLockId++;
        timeLockedWithdrawals[timeLockId] = TimeLockedWithdrawal({
            agentId: _agentId,
            token: _token,
            recipient: _recipient,
            amount: _amount,
            unlockTime: _unlockTime,
            executed: false
        });

        tokenBalances[_token] -= _amount;

        emit TimeLockedWithdrawalScheduled(timeLockId, _agentId, _token, _amount, _unlockTime);
        return timeLockId;
    }

    function executeTimeLocked(uint256 _timeLockId) external whenNotPaused nonReentrant {
        TimeLockedWithdrawal storage withdrawal = timeLockedWithdrawals[_timeLockId];
        require(withdrawal.agentId != 0, "Withdrawal not found");
        require(!withdrawal.executed, "Already executed");
        require(block.timestamp >= withdrawal.unlockTime, "Not yet unlocked");
        require(
            agentRegistry.agents(withdrawal.agentId).agentWallet == msg.sender,
            "Not authorized"
        );

        withdrawal.executed = true;

        if (withdrawal.token == address(0)) {
            payable(withdrawal.recipient).transfer(withdrawal.amount);
        } else {
            IERC20(withdrawal.token).safeTransfer(withdrawal.recipient, withdrawal.amount);
        }

        emit TimeLockedWithdrawalExecuted(_timeLockId);
    }

    function cancelTimeLocked(uint256 _timeLockId) external whenNotPaused {
        TimeLockedWithdrawal storage withdrawal = timeLockedWithdrawals[_timeLockId];
        require(withdrawal.agentId != 0, "Withdrawal not found");
        require(!withdrawal.executed, "Already executed");
        require(block.timestamp < withdrawal.unlockTime, "Already unlocked");
        require(
            agentRegistry.agents(withdrawal.agentId).agentWallet == msg.sender,
            "Not authorized"
        );

        tokenBalances[withdrawal.token] += withdrawal.amount;
        withdrawal.executed = true;
    }

    function _updateDailyWithdrawal(uint256 _agentId, uint256 _amount) internal {
        uint256 currentDay = block.timestamp / SECONDS_PER_DAY;
        
        if (currentDay > agentLastResetDay[_agentId]) {
            agentDailyWithdrawn[_agentId] = 0;
            agentLastResetDay[_agentId] = currentDay;
        }
        
        agentDailyWithdrawn[_agentId] += _amount;
    }

    function getAgentDailyWithdrawal(uint256 _agentId) external view returns (
        uint256 withdrawn,
        uint256 lastResetDay,
        uint256 dailyLimit
    ) {
        return (
            agentDailyWithdrawn[_agentId],
            agentLastResetDay[_agentId],
            agentRegistry.agents(_agentId).dailyLimit
        );
    }

    function emergencyWithdraw(
        address _token,
        address _recipient,
        uint256 _amount
    ) external onlyOwner {
        require(_amount > 0, "Amount must be positive");
        require(_recipient != address(0), "Invalid recipient");
        require(tokenBalances[_token] >= _amount, "Insufficient balance");

        tokenBalances[_token] -= _amount;
        
        if (_token == address(0)) {
            payable(_recipient).transfer(_amount);
        } else {
            IERC20(_token).safeTransfer(_recipient, _amount);
        }
    }

    receive() external payable {
        tokenBalances[address(0)] += msg.value;
        emit Deposit(address(0), msg.value, msg.sender);
    }
}