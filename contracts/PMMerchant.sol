// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PMMerchant is ReentrancyGuard, Ownable {
    IERC20 public pmToken;
    
    enum SubscriptionTier {
        STARTER,
        PROFESSIONAL,
        ENTERPRISE
    }
    
    struct Subscription {
        SubscriptionTier tier;
        uint256 startTime;
        uint256 endTime;
        bool active;
        uint256 amountPaid;
    }
    
    struct TierConfig {
        uint256 price;
        uint256 duration;
        uint256 transactionLimit;
        uint256 apiCallLimit;
        bool active;
    }
    
    mapping(address => Subscription) public subscriptions;
    mapping(SubscriptionTier => TierConfig) public tierConfigs;
    mapping(address => uint256) public merchantTransactions;
    mapping(address => uint256) public merchantApiCalls;
    
    uint256 public totalSubscribers;
    uint256 public totalRevenue;
    
    event SubscriptionPurchased(address indexed merchant, SubscriptionTier tier, uint256 amount);
    event SubscriptionRenewed(address indexed merchant, SubscriptionTier tier, uint256 amount);
    event SubscriptionCancelled(address indexed merchant);
    event TierConfigured(SubscriptionTier tier, uint256 price, uint256 duration);
    
    constructor(address _pmToken) {
        require(_pmToken != address(0), "Invalid token address");
        pmToken = IERC20(_pmToken);
        
        // Configure default tiers
        tierConfigs[SubscriptionTier.STARTER] = TierConfig({
            price: 100 * 10**18,      // 100 PM tokens
            duration: 30 days,
            transactionLimit: 1000,
            apiCallLimit: 10000,
            active: true
        });
        
        tierConfigs[SubscriptionTier.PROFESSIONAL] = TierConfig({
            price: 500 * 10**18,      // 500 PM tokens
            duration: 30 days,
            transactionLimit: 10000,
            apiCallLimit: 100000,
            active: true
        });
        
        tierConfigs[SubscriptionTier.ENTERPRISE] = TierConfig({
            price: 2000 * 10**18,     // 2000 PM tokens
            duration: 30 days,
            transactionLimit: type(uint256).max,
            apiCallLimit: type(uint256).max,
            active: true
        });
    }
    
    function subscribe(SubscriptionTier tier) external nonReentrant {
        TierConfig memory config = tierConfigs[tier];
        require(config.active, "Tier not available");
        
        Subscription storage sub = subscriptions[msg.sender];
        require(!sub.active || block.timestamp >= sub.endTime, "Active subscription exists");
        
        require(pmToken.transferFrom(msg.sender, address(this), config.price), "Transfer failed");
        
        if (!sub.active) {
            totalSubscribers++;
        }
        
        subscriptions[msg.sender] = Subscription({
            tier: tier,
            startTime: block.timestamp,
            endTime: block.timestamp + config.duration,
            active: true,
            amountPaid: config.price
        });
        
        // Reset usage counters
        merchantTransactions[msg.sender] = 0;
        merchantApiCalls[msg.sender] = 0;
        
        totalRevenue += config.price;
        
        emit SubscriptionPurchased(msg.sender, tier, config.price);
    }
    
    function renewSubscription() external nonReentrant {
        Subscription storage sub = subscriptions[msg.sender];
        require(sub.active, "No active subscription");
        
        TierConfig memory config = tierConfigs[sub.tier];
        require(config.active, "Tier not available");
        
        require(pmToken.transferFrom(msg.sender, address(this), config.price), "Transfer failed");
        
        sub.endTime = block.timestamp + config.duration;
        sub.amountPaid = config.price;
        
        // Reset usage counters
        merchantTransactions[msg.sender] = 0;
        merchantApiCalls[msg.sender] = 0;
        
        totalRevenue += config.price;
        
        emit SubscriptionRenewed(msg.sender, sub.tier, config.price);
    }
    
    function cancelSubscription() external {
        Subscription storage sub = subscriptions[msg.sender];
        require(sub.active, "No active subscription");
        
        sub.active = false;
        totalSubscribers--;
        
        emit SubscriptionCancelled(msg.sender);
    }
    
    function isSubscriptionActive(address merchant) external view returns (bool) {
        Subscription memory sub = subscriptions[merchant];
        return sub.active && block.timestamp < sub.endTime;
    }
    
    function getSubscriptionInfo(address merchant) external view returns (
        SubscriptionTier tier,
        uint256 endTime,
        bool active,
        uint256 transactionsUsed,
        uint256 apiCallsUsed,
        uint256 transactionLimit,
        uint256 apiCallLimit
    ) {
        Subscription memory sub = subscriptions[merchant];
        TierConfig memory config = tierConfigs[sub.tier];
        
        return (
            sub.tier,
            sub.endTime,
            sub.active && block.timestamp < sub.endTime,
            merchantTransactions[merchant],
            merchantApiCalls[merchant],
            config.transactionLimit,
            config.apiCallLimit
        );
    }
    
    function recordTransaction(address merchant) external {
        require(msg.sender == owner() || msg.sender == merchant, "Unauthorized");
        merchantTransactions[merchant]++;
    }
    
    function recordApiCall(address merchant) external {
        require(msg.sender == owner() || msg.sender == merchant, "Unauthorized");
        merchantApiCalls[merchant]++;
    }
    
    function configureTier(
        SubscriptionTier tier,
        uint256 price,
        uint256 duration,
        uint256 transactionLimit,
        uint256 apiCallLimit,
        bool active
    ) external onlyOwner {
        tierConfigs[tier] = TierConfig({
            price: price,
            duration: duration,
            transactionLimit: transactionLimit,
            apiCallLimit: apiCallLimit,
            active: active
        });
        
        emit TierConfigured(tier, price, duration);
    }
    
    function withdrawRevenue(uint256 amount) external onlyOwner {
        require(pmToken.transfer(owner(), amount), "Transfer failed");
    }
}
