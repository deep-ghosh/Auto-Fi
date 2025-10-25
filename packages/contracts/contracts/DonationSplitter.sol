// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./AgentRegistry.sol";

contract DonationSplitter is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct SplitConfig {
        address[] recipients;
        uint256[] percentages;
        bool isActive;
    }

    struct Donation {
        address donor;
        address token;
        uint256 amount;
        uint256 timestamp;
        bool processed;
    }

    AgentRegistry public immutable agentRegistry;
    
    mapping(address => SplitConfig) public splitConfigs;
    mapping(address => uint256) public minimumThresholds;
    mapping(bytes32 => Donation) public donations;
    
    uint256 public nextDonationId = 1;
    uint256 public constant MAX_RECIPIENTS = 10;
    uint256 public constant PERCENTAGE_PRECISION = 10000;

    event DonationReceived(
        bytes32 indexed donationId,
        address indexed donor,
        address indexed token,
        uint256 amount
    );
    
    event DonationSplit(
        bytes32 indexed donationId,
        address indexed recipient,
        address indexed token,
        uint256 amount
    );
    
    event ThankYouNFTMinted(
        bytes32 indexed donationId,
        address indexed donor,
        uint256 tokenId
    );
    
    event SplitConfigUpdated(
        address indexed token,
        address[] recipients,
        uint256[] percentages
    );
    
    event MinimumThresholdSet(
        address indexed token,
        uint256 threshold
    );

    constructor(address _agentRegistry) Ownable(msg.sender) {
        agentRegistry = AgentRegistry(_agentRegistry);
    }

    function configureSplit(
        address _token,
        address[] memory _recipients,
        uint256[] memory _percentages
    ) external whenNotPaused {
        require(_recipients.length == _percentages.length, "Array length mismatch");
        require(_recipients.length > 0 && _recipients.length <= MAX_RECIPIENTS, "Invalid recipient count");
        
        uint256 totalPercentage = 0;
        for (uint256 i = 0; i < _percentages.length; i++) {
            require(_recipients[i] != address(0), "Invalid recipient");
            require(_percentages[i] > 0, "Percentage must be positive");
            totalPercentage += _percentages[i];
        }
        require(totalPercentage == PERCENTAGE_PRECISION, "Percentages must sum to 100%");

        splitConfigs[_token] = SplitConfig({
            recipients: _recipients,
            percentages: _percentages,
            isActive: true
        });

        emit SplitConfigUpdated(_token, _recipients, _percentages);
    }

    function processDonation(
        address _token,
        uint256 _amount
    ) external payable whenNotPaused nonReentrant {
        if (_token == address(0)) {
            require(msg.value > 0, "No CELO sent");
            _processDonationInternal(address(0), msg.value, msg.sender);
        } else {
            require(_amount > 0, "Amount must be positive");
            IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);
            _processDonationInternal(_token, _amount, msg.sender);
        }
    }

    function _processDonationInternal(
        address _token,
        uint256 _amount,
        address _donor
    ) internal {
        SplitConfig storage config = splitConfigs[_token];
        require(config.isActive, "Split not configured for this token");
        require(_amount >= minimumThresholds[_token], "Below minimum threshold");

        bytes32 donationId = keccak256(abi.encodePacked(
            _donor,
            _token,
            _amount,
            block.timestamp,
            nextDonationId++
        ));

        donations[donationId] = Donation({
            donor: _donor,
            token: _token,
            amount: _amount,
            timestamp: block.timestamp,
            processed: false
        });

        emit DonationReceived(donationId, _donor, _token, _amount);

        for (uint256 i = 0; i < config.recipients.length; i++) {
            uint256 splitAmount = (_amount * config.percentages[i]) / PERCENTAGE_PRECISION;
            
            if (splitAmount > 0) {
                if (_token == address(0)) {
                    payable(config.recipients[i]).transfer(splitAmount);
                } else {
                    IERC20(_token).safeTransfer(config.recipients[i], splitAmount);
                }
                
                emit DonationSplit(donationId, config.recipients[i], _token, splitAmount);
            }
        }

        donations[donationId].processed = true;
    }

    function setMinimumThreshold(
        address _token,
        uint256 _threshold
    ) external onlyOwner {
        minimumThresholds[_token] = _threshold;
        emit MinimumThresholdSet(_token, _threshold);
    }

    function deactivateSplit(address _token) external onlyOwner {
        splitConfigs[_token].isActive = false;
    }

    function activateSplit(address _token) external onlyOwner {
        require(splitConfigs[_token].recipients.length > 0, "No split configured");
        splitConfigs[_token].isActive = true;
    }

    function getSplitConfig(address _token) external view returns (
        address[] memory recipients,
        uint256[] memory percentages,
        bool isActive
    ) {
        SplitConfig storage config = splitConfigs[_token];
        return (config.recipients, config.percentages, config.isActive);
    }

    function getDonation(bytes32 _donationId) external view returns (
        address donor,
        address token,
        uint256 amount,
        uint256 timestamp,
        bool processed
    ) {
        Donation storage donation = donations[_donationId];
        return (
            donation.donor,
            donation.token,
            donation.amount,
            donation.timestamp,
            donation.processed
        );
    }

    function calculateSplit(
        address _token,
        uint256 _amount
    ) external view returns (
        address[] memory recipients,
        uint256[] memory amounts
    ) {
        SplitConfig storage config = splitConfigs[_token];
        require(config.isActive, "Split not configured");
        
        recipients = new address[](config.recipients.length);
        amounts = new uint256[](config.recipients.length);
        
        for (uint256 i = 0; i < config.recipients.length; i++) {
            recipients[i] = config.recipients[i];
            amounts[i] = (_amount * config.percentages[i]) / PERCENTAGE_PRECISION;
        }
    }

    function emergencyWithdraw(
        address _token,
        address _recipient,
        uint256 _amount
    ) external onlyOwner {
        require(_amount > 0, "Amount must be positive");
        require(_recipient != address(0), "Invalid recipient");
        
        if (_token == address(0)) {
            require(address(this).balance >= _amount, "Insufficient CELO balance");
            payable(_recipient).transfer(_amount);
        } else {
            IERC20(_token).safeTransfer(_recipient, _amount);
        }
    }

    receive() external payable {
        if (msg.value > 0) {
            _processDonationInternal(address(0), msg.value, msg.sender);
        }
    }

    fallback() external payable {
        if (msg.value > 0) {
            _processDonationInternal(address(0), msg.value, msg.sender);
        }
    }
}