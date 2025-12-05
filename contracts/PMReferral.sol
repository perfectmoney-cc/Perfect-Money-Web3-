// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PMReferral is ReentrancyGuard, Ownable {
    IERC20 public pmToken;
    
    struct Referrer {
        address referrer;
        uint256 totalReferred;
        uint256 totalEarned;
        uint256 availableRewards;
        bool isActive;
    }
    
    struct ReferralTier {
        uint256 minReferrals;
        uint256 rewardRate; // in basis points (e.g., 500 = 5%)
    }
    
    mapping(address => Referrer) public referrers;
    mapping(address => address) public referredBy;
    mapping(uint256 => ReferralTier) public tiers;
    
    uint256 public totalReferrals;
    uint256 public totalRewardsPaid;
    uint256 public tierCount;
    
    uint256 private constant BASIS_POINTS = 10000;
    
    event ReferralRegistered(address indexed referee, address indexed referrer);
    event ReferralRewardEarned(address indexed referrer, uint256 amount);
    event RewardsClaimed(address indexed referrer, uint256 amount);
    event TierCreated(uint256 tierId, uint256 minReferrals, uint256 rewardRate);
    
    constructor(address _pmToken) {
        require(_pmToken != address(0), "Invalid token address");
        pmToken = IERC20(_pmToken);
        
        // Create default tiers
        _createTier(0, 500);   // Bronze: 0+ referrals, 5% rewards
        _createTier(10, 750);  // Silver: 10+ referrals, 7.5% rewards
        _createTier(50, 1000); // Gold: 50+ referrals, 10% rewards
        _createTier(100, 1500); // Platinum: 100+ referrals, 15% rewards
    }
    
    function _createTier(uint256 minReferrals, uint256 rewardRate) private {
        tiers[tierCount] = ReferralTier({
            minReferrals: minReferrals,
            rewardRate: rewardRate
        });
        
        emit TierCreated(tierCount, minReferrals, rewardRate);
        tierCount++;
    }
    
    function registerReferral(address referrer) external {
        require(referrer != address(0), "Invalid referrer");
        require(referrer != msg.sender, "Cannot refer yourself");
        require(referredBy[msg.sender] == address(0), "Already referred");
        
        referredBy[msg.sender] = referrer;
        
        if (!referrers[referrer].isActive) {
            referrers[referrer].isActive = true;
            referrers[referrer].referrer = referrer;
        }
        
        referrers[referrer].totalReferred++;
        totalReferrals++;
        
        emit ReferralRegistered(msg.sender, referrer);
    }
    
    function recordReferralReward(address referee, uint256 transactionAmount) external {
        address referrer = referredBy[referee];
        if (referrer == address(0)) return;
        
        uint256 rewardRate = getCurrentTierRate(referrer);
        uint256 rewardAmount = (transactionAmount * rewardRate) / BASIS_POINTS;
        
        referrers[referrer].availableRewards += rewardAmount;
        referrers[referrer].totalEarned += rewardAmount;
        
        emit ReferralRewardEarned(referrer, rewardAmount);
    }
    
    function getCurrentTierRate(address referrer) public view returns (uint256) {
        uint256 totalReferred = referrers[referrer].totalReferred;
        uint256 currentRate = 0;
        
        for (uint256 i = 0; i < tierCount; i++) {
            if (totalReferred >= tiers[i].minReferrals) {
                currentRate = tiers[i].rewardRate;
            }
        }
        
        return currentRate;
    }
    
    function claimRewards() external nonReentrant {
        uint256 rewards = referrers[msg.sender].availableRewards;
        require(rewards > 0, "No rewards to claim");
        
        referrers[msg.sender].availableRewards = 0;
        totalRewardsPaid += rewards;
        
        require(pmToken.transfer(msg.sender, rewards), "Transfer failed");
        
        emit RewardsClaimed(msg.sender, rewards);
    }
    
    function getReferrerInfo(address referrer) external view returns (
        uint256 totalReferred,
        uint256 totalEarned,
        uint256 availableRewards,
        uint256 currentTierRate
    ) {
        Referrer memory ref = referrers[referrer];
        return (
            ref.totalReferred,
            ref.totalEarned,
            ref.availableRewards,
            getCurrentTierRate(referrer)
        );
    }
    
    function createTier(uint256 minReferrals, uint256 rewardRate) external onlyOwner {
        require(rewardRate <= 5000, "Reward rate too high"); // Max 50%
        _createTier(minReferrals, rewardRate);
    }
    
    function fundContract(uint256 amount) external onlyOwner {
        require(pmToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
    }
    
    function emergencyWithdraw(uint256 amount) external onlyOwner {
        require(pmToken.transfer(owner(), amount), "Transfer failed");
    }
}
