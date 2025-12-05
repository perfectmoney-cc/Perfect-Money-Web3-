// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

interface IERC20 {
    function transfer(address recipient, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
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
 * @notice Handles PM token airdrops with merkle proof verification
 */
contract PMAirdrop is Ownable {
    IERC20 public pmToken;
    
    bytes32 public merkleRoot;
    uint256 public airdropAmount;
    uint256 public totalClaimed;
    uint256 public maxClaimable;
    
    uint256 public startTime;
    uint256 public endTime;
    bool public isActive;
    
    mapping(address => bool) public hasClaimed;
    mapping(address => uint256) public claimedAmount;
    
    // Task-based airdrop
    mapping(address => mapping(uint256 => bool)) public taskCompleted;
    mapping(uint256 => uint256) public taskRewards;
    uint256 public totalTasks;
    
    event AirdropClaimed(address indexed user, uint256 amount);
    event TaskCompleted(address indexed user, uint256 taskId, uint256 reward);
    event MerkleRootUpdated(bytes32 newRoot);
    event AirdropStarted(uint256 startTime, uint256 endTime);
    
    constructor(address _pmToken, uint256 _airdropAmount) {
        pmToken = IERC20(_pmToken);
        airdropAmount = _airdropAmount;
        isActive = false;
    }
    
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
    
    function setMerkleRoot(bytes32 _merkleRoot) external onlyOwner {
        merkleRoot = _merkleRoot;
        emit MerkleRootUpdated(_merkleRoot);
    }
    
    function setTaskReward(uint256 _taskId, uint256 _reward) external onlyOwner {
        taskRewards[_taskId] = _reward;
        if (_taskId >= totalTasks) {
            totalTasks = _taskId + 1;
        }
    }
    
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
    
    function claimTask(uint256 _taskId) external {
        require(isActive, "Airdrop not active");
        require(!taskCompleted[msg.sender][_taskId], "Task already completed");
        require(taskRewards[_taskId] > 0, "Invalid task");
        
        uint256 reward = taskRewards[_taskId];
        require(totalClaimed + reward <= maxClaimable, "Max claimable reached");
        
        taskCompleted[msg.sender][_taskId] = true;
        claimedAmount[msg.sender] += reward;
        totalClaimed += reward;
        
        require(pmToken.transfer(msg.sender, reward), "Transfer failed");
        
        emit TaskCompleted(msg.sender, _taskId, reward);
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
    
    function withdrawTokens(uint256 _amount) external onlyOwner {
        require(pmToken.transfer(owner(), _amount), "Transfer failed");
    }
    
    function getAirdropInfo() external view returns (
        uint256 _airdropAmount,
        uint256 _totalClaimed,
        uint256 _maxClaimable,
        uint256 _startTime,
        uint256 _endTime,
        bool _isActive
    ) {
        return (airdropAmount, totalClaimed, maxClaimable, startTime, endTime, isActive);
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
}
