// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./AgentRegistry.sol";

contract YieldAggregator is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct ProtocolInfo {
        bytes32 protocolId;
        address protocolAddress;
        bool isActive;
        uint256 apy;
        uint256 totalDeposited;
        uint256 totalShares;
    }

    struct AgentPosition {
        uint256 agentId;
        bytes32 protocolId;
        address token;
        uint256 shares;
        uint256 lastUpdated;
    }

    AgentRegistry public immutable agentRegistry;
    
    mapping(bytes32 => ProtocolInfo) public protocols;
    mapping(uint256 => mapping(bytes32 => AgentPosition)) public agentPositions;
    mapping(address => mapping(bytes32 => uint256)) public protocolBalances;
    
    bytes32[] public supportedProtocols;
    uint256 public constant APY_PRECISION = 10000;

    event ProtocolAdded(
        bytes32 indexed protocolId,
        address indexed protocolAddress,
        uint256 apy
    );
    
    event ProtocolAPYUpdated(
        bytes32 indexed protocolId,
        uint256 newAPY
    );
    
    event DepositToProtocol(
        uint256 indexed agentId,
        bytes32 indexed protocolId,
        address indexed token,
        uint256 amount,
        uint256 shares
    );
    
    event WithdrawFromProtocol(
        uint256 indexed agentId,
        bytes32 indexed protocolId,
        address indexed token,
        uint256 shares,
        uint256 amount
    );
    
    event RewardsClaimed(
        uint256 indexed agentId,
        bytes32 indexed protocolId,
        uint256 rewards
    );
    
    event RebalanceExecuted(
        uint256 indexed agentId,
        bytes32 indexed fromProtocol,
        bytes32 indexed toProtocol,
        address token,
        uint256 amount
    );

    constructor(address _agentRegistry) Ownable() {
        agentRegistry = AgentRegistry(_agentRegistry);
    }

    function addProtocol(
        bytes32 _protocolId,
        address _protocolAddress,
        uint256 _apy
    ) external onlyOwner {
        require(_protocolAddress != address(0), "Invalid protocol address");
        require(protocols[_protocolId].protocolId == bytes32(0), "Protocol already exists");
        
        protocols[_protocolId] = ProtocolInfo({
            protocolId: _protocolId,
            protocolAddress: _protocolAddress,
            isActive: true,
            apy: _apy,
            totalDeposited: 0,
            totalShares: 0
        });
        
        supportedProtocols.push(_protocolId);
        emit ProtocolAdded(_protocolId, _protocolAddress, _apy);
    }

    function updateProtocolAPY(
        bytes32 _protocolId,
        uint256 _apy
    ) external onlyOwner {
        require(protocols[_protocolId].protocolId != bytes32(0), "Protocol not found");
        protocols[_protocolId].apy = _apy;
        emit ProtocolAPYUpdated(_protocolId, _apy);
    }

    function getProtocolAPY(
        bytes32 _protocolId,
        address _token
    ) external view returns (uint256) {
        require(protocols[_protocolId].isActive, "Protocol not active");
        return protocols[_protocolId].apy;
    }

    function depositToProtocol(
        uint256 _agentId,
        bytes32 _protocolId,
        address _token,
        uint256 _amount
    ) external whenNotPaused nonReentrant returns (uint256) {
        (,,,,,,,,bool isActive) = agentRegistry.agents(_agentId);
        require(isActive, "Agent not active");
        (,,,address agentWallet,,,,,) = agentRegistry.agents(_agentId);
        require(agentWallet == msg.sender, "Not agent wallet");
        require(protocols[_protocolId].isActive, "Protocol not active");
        require(_amount > 0, "Amount must be positive");

        require(
            agentRegistry.isOperationAllowed(_agentId, "STAKE", _amount, address(0)),
            "Operation not allowed"
        );

        IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);

        uint256 shares = _amount;
        protocols[_protocolId].totalDeposited += _amount;
        protocols[_protocolId].totalShares += shares;
        protocolBalances[_token][_protocolId] += _amount;

        agentPositions[_agentId][_protocolId] = AgentPosition({
            agentId: _agentId,
            protocolId: _protocolId,
            token: _token,
            shares: shares,
            lastUpdated: block.timestamp
        });

        agentRegistry.recordAgentAction(_agentId, "STAKE", _amount, address(0));

        emit DepositToProtocol(_agentId, _protocolId, _token, _amount, shares);
        return shares;
    }

    function withdrawFromProtocol(
        uint256 _agentId,
        bytes32 _protocolId,
        address _token,
        uint256 _shares
    ) external whenNotPaused nonReentrant returns (uint256) {
        (,,,,,,,,bool isActive) = agentRegistry.agents(_agentId);
        require(isActive, "Agent not active");
        (,,,address agentWallet,,,,,) = agentRegistry.agents(_agentId);
        require(agentWallet == msg.sender, "Not agent wallet");
        require(protocols[_protocolId].isActive, "Protocol not active");
        require(_shares > 0, "Shares must be positive");

        AgentPosition storage position = agentPositions[_agentId][_protocolId];
        require(position.shares >= _shares, "Insufficient shares");

        uint256 amount = _shares;
        
        require(
            agentRegistry.isOperationAllowed(_agentId, "UNSTAKE", amount, address(0)),
            "Operation not allowed"
        );

        protocols[_protocolId].totalDeposited -= amount;
        protocols[_protocolId].totalShares -= _shares;
        protocolBalances[_token][_protocolId] -= amount;

        position.shares -= _shares;
        position.lastUpdated = block.timestamp;

        IERC20(_token).safeTransfer(msg.sender, amount);

        agentRegistry.recordAgentAction(_agentId, "UNSTAKE", amount, address(0));

        emit WithdrawFromProtocol(_agentId, _protocolId, _token, _shares, amount);
        return amount;
    }

    function claimRewards(
        uint256 _agentId,
        bytes32 _protocolId
    ) external whenNotPaused nonReentrant returns (uint256) {
        (,,,,,,,,bool isActive) = agentRegistry.agents(_agentId);
        require(isActive, "Agent not active");
        (,,,address agentWallet,,,,,) = agentRegistry.agents(_agentId);
        require(agentWallet == msg.sender, "Not agent wallet");
        require(protocols[_protocolId].isActive, "Protocol not active");

        AgentPosition storage position = agentPositions[_agentId][_protocolId];
        require(position.shares > 0, "No position");

        uint256 rewards = (position.shares * protocols[_protocolId].apy) / (APY_PRECISION * 365);
        
        if (rewards > 0) {
            require(
                agentRegistry.isOperationAllowed(_agentId, "CLAIM_REWARDS", rewards, address(0)),
                "Operation not allowed"
            );

            IERC20(position.token).safeTransfer(msg.sender, rewards);

            agentRegistry.recordAgentAction(_agentId, "CLAIM_REWARDS", rewards, address(0));

            emit RewardsClaimed(_agentId, _protocolId, rewards);
        }

        return rewards;
    }

    function rebalance(
        uint256 _agentId,
        bytes32 _fromProtocol,
        bytes32 _toProtocol,
        address _token,
        uint256 _amount
    ) external whenNotPaused nonReentrant {
        (,,,,,,,,bool isActive) = agentRegistry.agents(_agentId);
        require(isActive, "Agent not active");
        (,,,address agentWallet,,,,,) = agentRegistry.agents(_agentId);
        require(agentWallet == msg.sender, "Not agent wallet");
        require(protocols[_fromProtocol].isActive, "From protocol not active");
        require(protocols[_toProtocol].isActive, "To protocol not active");
        require(_amount > 0, "Amount must be positive");

        AgentPosition storage fromPosition = agentPositions[_agentId][_fromProtocol];
        require(fromPosition.shares >= _amount, "Insufficient shares in from protocol");

        require(
            agentRegistry.isOperationAllowed(_agentId, "UNSTAKE", _amount, address(0)),
            "Unstake operation not allowed"
        );
        require(
            agentRegistry.isOperationAllowed(_agentId, "STAKE", _amount, address(0)),
            "Stake operation not allowed"
        );

        fromPosition.shares -= _amount;
        protocols[_fromProtocol].totalDeposited -= _amount;
        protocols[_fromProtocol].totalShares -= _amount;
        protocolBalances[_token][_fromProtocol] -= _amount;

        protocols[_toProtocol].totalDeposited += _amount;
        protocols[_toProtocol].totalShares += _amount;
        protocolBalances[_token][_toProtocol] += _amount;

        AgentPosition storage toPosition = agentPositions[_agentId][_toProtocol];
        toPosition.agentId = _agentId;
        toPosition.protocolId = _toProtocol;
        toPosition.token = _token;
        toPosition.shares += _amount;
        toPosition.lastUpdated = block.timestamp;

        agentRegistry.recordAgentAction(_agentId, "UNSTAKE", _amount, address(0));
        agentRegistry.recordAgentAction(_agentId, "STAKE", _amount, address(0));

        emit RebalanceExecuted(_agentId, _fromProtocol, _toProtocol, _token, _amount);
    }

    function getAgentPosition(
        uint256 _agentId,
        bytes32 _protocolId
    ) external view returns (
        uint256 agentId,
        bytes32 protocolId,
        address token,
        uint256 shares,
        uint256 lastUpdated
    ) {
        AgentPosition storage position = agentPositions[_agentId][_protocolId];
        return (
            position.agentId,
            position.protocolId,
            position.token,
            position.shares,
            position.lastUpdated
        );
    }

    function getProtocolInfo(bytes32 _protocolId) external view returns (
        bytes32 protocolId,
        address protocolAddress,
        bool isActive,
        uint256 apy,
        uint256 totalDeposited,
        uint256 totalShares
    ) {
        ProtocolInfo storage protocol = protocols[_protocolId];
        return (
            protocol.protocolId,
            protocol.protocolAddress,
            protocol.isActive,
            protocol.apy,
            protocol.totalDeposited,
            protocol.totalShares
        );
    }

    function getSupportedProtocols() external view returns (bytes32[] memory) {
        return supportedProtocols;
    }

    function pauseProtocol(bytes32 _protocolId) external onlyOwner {
        protocols[_protocolId].isActive = false;
    }

    function unpauseProtocol(bytes32 _protocolId) external onlyOwner {
        protocols[_protocolId].isActive = true;
    }
}