// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

interface IERC20 {
    function transfer(address recipient, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

interface AggregatorV3Interface {
    function latestRoundData() external view returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    );
    function decimals() external view returns (uint8);
}

abstract contract Ownable {
    address private _owner;
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor() {
        _owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    function owner() public view returns (address) {
        return _owner;
    }

    modifier onlyOwner() {
        require(msg.sender == _owner, "Ownable: caller is not the owner");
        _;
    }

    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "Ownable: new owner is zero");
        emit OwnershipTransferred(_owner, newOwner);
        _owner = newOwner;
    }
}

/**
 * @title PM Token Airdrop Contract
 * @notice Handles PM token airdrops with merkle proof verification and task-based claims
 * @dev Each task claim requires a claim fee + network fee (both configurable, default $0.01 USD each)
 */
contract PMAirdrop is Ownable {
    IERC20 public pmToken;
    AggregatorV3Interface public priceFeed;
    
    bytes32 public merkleRoot;
    uint256 public airdropAmount;
    uint256 public totalClaimed;
    uint256 public maxClaimable;
    
    uint256 public startTime;
    uint256 public endTime;
    bool public isActive;
    
    // Fee configuration (with 8 decimals to match Chainlink)
    uint256 public claimFeeUSD = 1000000; // $0.01 with 8 decimals
    uint256 public networkFeeUSD = 1000000; // $0.01 with 8 decimals (minimum network/gas fee)
    uint256 public totalFeesCollected;
    uint256 public totalNetworkFeesCollected;
    address public feeCollector;
    
    mapping(address => bool) public hasClaimed;
    mapping(address => uint256) public claimedAmount;
    
    // Task-based airdrop
    mapping(address => mapping(uint256 => bool)) public taskCompleted;
    mapping(uint256 => uint256) public taskRewards;
    uint256 public totalTasks;
    
    // Task metadata
    mapping(uint256 => string) public taskNames;
    mapping(uint256 => string) public taskLinks;
    mapping(uint256 => bool) public taskEnabled;
    
    event AirdropClaimed(address indexed user, uint256 amount);
    event TaskCompleted(address indexed user, uint256 taskId, uint256 reward, uint256 claimFeePaid, uint256 networkFeePaid);
    event MerkleRootUpdated(bytes32 newRoot);
    event AirdropStarted(uint256 startTime, uint256 endTime);
    event ClaimFeeUpdated(uint256 newFeeUSD);
    event NetworkFeeUpdated(uint256 newFeeUSD);
    event FeesWithdrawn(address indexed to, uint256 claimFees, uint256 networkFees);
    event FeeCollectorUpdated(address indexed newCollector);
    event TaskConfigured(uint256 indexed taskId, string name, string link, uint256 reward, bool enabled);
    event AirdropAmountUpdated(uint256 newAmount);
    event MaxClaimableUpdated(uint256 newMaxClaimable);
    
    constructor(address _pmToken, uint256 _airdropAmount, address _priceFeed) {
        pmToken = IERC20(_pmToken);
        airdropAmount = _airdropAmount;
        priceFeed = AggregatorV3Interface(_priceFeed);
        feeCollector = msg.sender;
        isActive = false;
    }
    
    /**
     * @notice Get the current BNB price in USD from Chainlink
     * @return price BNB price with 8 decimals
     */
    function getBNBPrice() public view returns (uint256) {
        (, int256 price, , , ) = priceFeed.latestRoundData();
        require(price > 0, "Invalid price");
        return uint256(price);
    }
    
    /**
     * @notice Calculate the claim fee in BNB based on current BNB/USD price
     * @return feeInBNB The fee amount in wei
     */
    function getClaimFeeInBNB() public view returns (uint256) {
        uint256 bnbPrice = getBNBPrice();
        return (claimFeeUSD * 1e18) / bnbPrice;
    }
    
    /**
     * @notice Calculate the network fee in BNB based on current BNB/USD price
     * @return feeInBNB The network fee amount in wei
     */
    function getNetworkFeeInBNB() public view returns (uint256) {
        uint256 bnbPrice = getBNBPrice();
        return (networkFeeUSD * 1e18) / bnbPrice;
    }
    
    /**
     * @notice Calculate the total fee (claim + network) in BNB
     * @return totalFeeInBNB The total fee amount in wei
     */
    function getTotalFeeInBNB() public view returns (uint256) {
        return getClaimFeeInBNB() + getNetworkFeeInBNB();
    }
    
    /**
     * @notice Get comprehensive fee information
     * @return claimFee Claim fee in USD with 8 decimals
     * @return networkFee Network fee in USD with 8 decimals
     * @return totalFeeUSD Total fee in USD with 8 decimals
     * @return claimFeeBNB Claim fee in BNB (wei)
     * @return networkFeeBNB Network fee in BNB (wei)
     * @return totalFeeBNB Total fee in BNB (wei)
     * @return bnbPrice Current BNB price in USD with 8 decimals
     */
    function getFeeInfo() external view returns (
        uint256 claimFee,
        uint256 networkFee,
        uint256 totalFeeUSD,
        uint256 claimFeeBNB,
        uint256 networkFeeBNB,
        uint256 totalFeeBNB,
        uint256 bnbPrice
    ) {
        bnbPrice = getBNBPrice();
        claimFeeBNB = getClaimFeeInBNB();
        networkFeeBNB = getNetworkFeeInBNB();
        totalFeeBNB = claimFeeBNB + networkFeeBNB;
        return (claimFeeUSD, networkFeeUSD, claimFeeUSD + networkFeeUSD, claimFeeBNB, networkFeeBNB, totalFeeBNB, bnbPrice);
    }
    
    /**
     * @notice Get task information
     * @param _taskId The task ID
     * @return name Task name
     * @return link Task link
     * @return reward Task reward in tokens
     * @return enabled Whether task is enabled
     */
    function getTaskInfo(uint256 _taskId) external view returns (
        string memory name,
        string memory link,
        uint256 reward,
        bool enabled
    ) {
        return (taskNames[_taskId], taskLinks[_taskId], taskRewards[_taskId], taskEnabled[_taskId]);
    }
    
    /**
     * @notice Get all tasks information
     * @return names Array of task names
     * @return links Array of task links
     * @return rewards Array of task rewards
     * @return enabledList Array of enabled status
     */
    function getAllTasks() external view returns (
        string[] memory names,
        string[] memory links,
        uint256[] memory rewards,
        bool[] memory enabledList
    ) {
        names = new string[](totalTasks);
        links = new string[](totalTasks);
        rewards = new uint256[](totalTasks);
        enabledList = new bool[](totalTasks);
        
        for (uint256 i = 0; i < totalTasks; i++) {
            names[i] = taskNames[i];
            links[i] = taskLinks[i];
            rewards[i] = taskRewards[i];
            enabledList[i] = taskEnabled[i];
        }
        
        return (names, links, rewards, enabledList);
    }
    
    // ============ Admin Functions ============
    
    function startAirdrop(uint256 _duration, uint256 _maxClaimable) external onlyOwner {
        require(!isActive, "Airdrop already active");
        startTime = block.timestamp;
        endTime = block.timestamp + _duration;
        maxClaimable = _maxClaimable;
        isActive = true;
        emit AirdropStarted(startTime, endTime);
    }
    
    function endAirdrop() external onlyOwner {
        isActive = false;
    }
    
    function resumeAirdrop() external onlyOwner {
        require(block.timestamp <= endTime, "Airdrop period ended");
        isActive = true;
    }
    
    function setMerkleRoot(bytes32 _merkleRoot) external onlyOwner {
        merkleRoot = _merkleRoot;
        emit MerkleRootUpdated(_merkleRoot);
    }
    
    function setClaimFeeUSD(uint256 _feeUSD) external onlyOwner {
        claimFeeUSD = _feeUSD;
        emit ClaimFeeUpdated(_feeUSD);
    }
    
    function setNetworkFeeUSD(uint256 _feeUSD) external onlyOwner {
        require(_feeUSD >= 1000000, "Network fee must be at least $0.01");
        networkFeeUSD = _feeUSD;
        emit NetworkFeeUpdated(_feeUSD);
    }
    
    function setFeeCollector(address _collector) external onlyOwner {
        require(_collector != address(0), "Invalid collector");
        feeCollector = _collector;
        emit FeeCollectorUpdated(_collector);
    }
    
    function setPriceFeed(address _priceFeed) external onlyOwner {
        priceFeed = AggregatorV3Interface(_priceFeed);
    }
    
    function setAirdropAmount(uint256 _amount) external onlyOwner {
        airdropAmount = _amount;
        emit AirdropAmountUpdated(_amount);
    }
    
    function setMaxClaimable(uint256 _maxClaimable) external onlyOwner {
        maxClaimable = _maxClaimable;
        emit MaxClaimableUpdated(_maxClaimable);
    }
    
    /**
     * @notice Configure a task with all parameters
     * @param _taskId Task ID
     * @param _name Task name/title
     * @param _link Task link URL
     * @param _reward Reward amount in tokens (with decimals)
     * @param _enabled Whether task is enabled
     */
    function configureTask(
        uint256 _taskId,
        string calldata _name,
        string calldata _link,
        uint256 _reward,
        bool _enabled
    ) external onlyOwner {
        taskNames[_taskId] = _name;
        taskLinks[_taskId] = _link;
        taskRewards[_taskId] = _reward;
        taskEnabled[_taskId] = _enabled;
        
        if (_taskId >= totalTasks) {
            totalTasks = _taskId + 1;
        }
        
        emit TaskConfigured(_taskId, _name, _link, _reward, _enabled);
    }
    
    /**
     * @notice Set only task reward (legacy support)
     */
    function setTaskReward(uint256 _taskId, uint256 _reward) external onlyOwner {
        taskRewards[_taskId] = _reward;
        if (_taskId >= totalTasks) {
            totalTasks = _taskId + 1;
        }
    }
    
    /**
     * @notice Enable or disable a task
     */
    function setTaskEnabled(uint256 _taskId, bool _enabled) external onlyOwner {
        taskEnabled[_taskId] = _enabled;
    }
    
    /**
     * @notice Batch configure multiple tasks
     */
    function batchConfigureTasks(
        uint256[] calldata _taskIds,
        string[] calldata _names,
        string[] calldata _links,
        uint256[] calldata _rewards,
        bool[] calldata _enabledList
    ) external onlyOwner {
        require(
            _taskIds.length == _names.length &&
            _taskIds.length == _links.length &&
            _taskIds.length == _rewards.length &&
            _taskIds.length == _enabledList.length,
            "Array length mismatch"
        );
        
        for (uint256 i = 0; i < _taskIds.length; i++) {
            uint256 taskId = _taskIds[i];
            taskNames[taskId] = _names[i];
            taskLinks[taskId] = _links[i];
            taskRewards[taskId] = _rewards[i];
            taskEnabled[taskId] = _enabledList[i];
            
            if (taskId >= totalTasks) {
                totalTasks = taskId + 1;
            }
            
            emit TaskConfigured(taskId, _names[i], _links[i], _rewards[i], _enabledList[i]);
        }
    }
    
    // ============ Claim Functions ============
    
    function claim(bytes32[] calldata _merkleProof) external {
        require(isActive, "Airdrop not active");
        require(block.timestamp >= startTime && block.timestamp <= endTime, "Airdrop not in progress");
        require(!hasClaimed[msg.sender], "Already claimed");
        require(totalClaimed + airdropAmount <= maxClaimable, "Max claimable reached");
        
        // Verify merkle proof
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
        require(verify(_merkleProof, merkleRoot, leaf), "Invalid proof");
        
        hasClaimed[msg.sender] = true;
        claimedAmount[msg.sender] = airdropAmount;
        totalClaimed += airdropAmount;
        
        require(pmToken.transfer(msg.sender, airdropAmount), "Transfer failed");
        
        emit AirdropClaimed(msg.sender, airdropAmount);
    }
    
    /**
     * @notice Claim reward for completing a task
     * @param _taskId The ID of the completed task
     * @dev Requires payment of total fee (claim fee + network fee) in BNB
     */
    function claimTask(uint256 _taskId) external payable {
        require(isActive, "Airdrop not active");
        require(!taskCompleted[msg.sender][_taskId], "Task already completed");
        require(taskRewards[_taskId] > 0, "Invalid task");
        require(taskEnabled[_taskId], "Task not enabled");
        
        // Check total fee payment (claim fee + network fee)
        uint256 requiredClaimFee = getClaimFeeInBNB();
        uint256 requiredNetworkFee = getNetworkFeeInBNB();
        uint256 totalRequiredFee = requiredClaimFee + requiredNetworkFee;
        require(msg.value >= totalRequiredFee, "Insufficient fee");
        
        uint256 reward = taskRewards[_taskId];
        require(totalClaimed + reward <= maxClaimable, "Max claimable reached");
        
        taskCompleted[msg.sender][_taskId] = true;
        claimedAmount[msg.sender] += reward;
        totalClaimed += reward;
        totalFeesCollected += requiredClaimFee;
        totalNetworkFeesCollected += requiredNetworkFee;
        
        require(pmToken.transfer(msg.sender, reward), "Transfer failed");
        
        // Refund excess BNB if any
        if (msg.value > totalRequiredFee) {
            payable(msg.sender).transfer(msg.value - totalRequiredFee);
        }
        
        emit TaskCompleted(msg.sender, _taskId, reward, requiredClaimFee, requiredNetworkFee);
    }
    
    function verify(
        bytes32[] calldata proof,
        bytes32 root,
        bytes32 leaf
    ) internal pure returns (bool) {
        bytes32 computedHash = leaf;
        for (uint256 i = 0; i < proof.length; i++) {
            bytes32 proofElement = proof[i];
            if (computedHash <= proofElement) {
                computedHash = keccak256(abi.encodePacked(computedHash, proofElement));
            } else {
                computedHash = keccak256(abi.encodePacked(proofElement, computedHash));
            }
        }
        return computedHash == root;
    }
    
    // ============ Withdrawal Functions ============
    
    function withdrawTokens(uint256 _amount) external onlyOwner {
        require(pmToken.transfer(owner(), _amount), "Transfer failed");
    }
    
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        uint256 claimFees = totalFeesCollected;
        uint256 networkFees = totalNetworkFeesCollected;
        totalFeesCollected = 0;
        totalNetworkFeesCollected = 0;
        payable(feeCollector).transfer(balance);
        emit FeesWithdrawn(feeCollector, claimFees, networkFees);
    }
    
    // ============ View Functions ============
    
    function getAirdropInfo() external view returns (
        uint256 _airdropAmount,
        uint256 _totalClaimed,
        uint256 _maxClaimable,
        uint256 _startTime,
        uint256 _endTime,
        bool _isActive,
        uint256 _claimFeeUSD,
        uint256 _networkFeeUSD,
        uint256 _totalFeesCollected,
        uint256 _totalNetworkFeesCollected
    ) {
        return (
            airdropAmount,
            totalClaimed,
            maxClaimable,
            startTime,
            endTime,
            isActive,
            claimFeeUSD,
            networkFeeUSD,
            totalFeesCollected,
            totalNetworkFeesCollected
        );
    }
    
    function getUserInfo(address _user) external view returns (
        bool _hasClaimed,
        uint256 _claimedAmount,
        uint256[] memory _completedTasks
    ) {
        uint256[] memory completed = new uint256[](totalTasks);
        uint256 count = 0;
        for (uint256 i = 0; i < totalTasks; i++) {
            if (taskCompleted[_user][i]) {
                completed[count] = i;
                count++;
            }
        }
        
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = completed[i];
        }
        
        return (hasClaimed[_user], claimedAmount[_user], result);
    }
    
    function getUserTasks(address _user) external view returns (uint256[] memory) {
        uint256[] memory completed = new uint256[](totalTasks);
        uint256 count = 0;
        for (uint256 i = 0; i < totalTasks; i++) {
            if (taskCompleted[_user][i]) {
                completed[count] = i;
                count++;
            }
        }
        
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = completed[i];
        }
        
        return result;
    }
    
    /**
     * @notice Get admin/owner info
     */
    function getAdminInfo() external view returns (
        address _owner,
        address _feeCollector,
        address _priceFeed,
        address _pmToken,
        uint256 _contractBalance
    ) {
        return (owner(), feeCollector, address(priceFeed), address(pmToken), address(this).balance);
    }
    
    // Allow contract to receive BNB
    receive() external payable {}
}
