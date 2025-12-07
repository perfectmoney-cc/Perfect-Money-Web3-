// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title IERC20
 * @notice Minimal ERC20 interface for PM token interactions
 */
interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);
}

/**
 * @title PMNFT - Perfect Money NFT Marketplace Contract
 * @author PM Token Team
 * @notice A secure NFT marketplace for minting, listing, and trading NFTs using PM tokens
 * @dev Implements ERC721 with enumerable and URI storage extensions, optimized for gas and security
 * 
 * Security Features:
 * - ReentrancyGuard on all state-changing functions involving transfers
 * - Pausable for emergency stops
 * - Input validation with custom errors for gas efficiency
 * - Safe math (Solidity 0.8+)
 * - CEI (Checks-Effects-Interactions) pattern
 * - No external calls before state changes
 */
contract PMNFT is ERC721, ERC721URIStorage, ERC721Enumerable, Ownable, ReentrancyGuard, Pausable {
    
    // ============ State Variables ============
    
    /// @notice The PM ERC20 token used for all payments
    IERC20 public immutable pmToken;
    
    /// @notice Array of valid NFT categories
    string[] public validCategories;
    
    /// @notice Mapping to check if a category is valid
    mapping(string => bool) public isValidCategory;
    
    /// @notice Counter for token IDs (starts at 0)
    uint256 private _tokenIdCounter;
    
    /// @notice Fee required to mint an NFT (in PM tokens)
    uint256 public mintingFee;
    
    /// @notice Platform fee percentage on sales (max 10%)
    uint256 public platformFeePercent;
    
    /// @notice Address that receives platform fees
    address public feeCollector;
    
    /// @notice Maximum royalty percentage allowed (10%)
    uint256 public constant MAX_ROYALTY_PERCENT = 10;
    
    /// @notice Maximum platform fee percentage (10%)
    uint256 public constant MAX_PLATFORM_FEE = 10;
    
    /// @notice Minimum auction duration (1 hour)
    uint256 public constant MIN_AUCTION_DURATION = 1 hours;
    
    /// @notice Maximum auction duration (7 days)
    uint256 public constant MAX_AUCTION_DURATION = 7 days;

    // ============ Structs ============
    
    /// @notice Listing information for an NFT
    struct Listing {
        address seller;
        uint256 price;
        bool isAuction;
        uint256 auctionEndTime;
        address highestBidder;
        uint256 highestBid;
        bool isActive;
    }

    /// @notice Metadata for each minted NFT
    struct NFTMetadata {
        string name;
        string description;
        string category;
        uint256 royaltyPercent;
        address creator;
        uint256 mintedAt;
    }
    
    /// @notice Statistics for the marketplace
    struct MarketplaceStats {
        uint256 totalMinted;
        uint256 totalListings;
        uint256 totalSales;
        uint256 totalVolume;
    }

    // ============ Mappings ============
    
    /// @notice Token ID => Listing information
    mapping(uint256 => Listing) public listings;
    
    /// @notice Token ID => NFT metadata
    mapping(uint256 => NFTMetadata) public nftMetadata;
    
    /// @notice Address => Number of NFTs minted by this address
    mapping(address => uint256) public mintedByAddress;
    
    /// @notice Marketplace statistics
    MarketplaceStats public stats;

    // ============ Events ============
    
    event NFTMinted(
        uint256 indexed tokenId, 
        address indexed creator, 
        string name, 
        string category,
        uint256 royaltyPercent
    );
    
    event NFTListed(
        uint256 indexed tokenId, 
        address indexed seller, 
        uint256 price, 
        bool isAuction, 
        uint256 auctionEndTime
    );
    
    event NFTDelisted(uint256 indexed tokenId, address indexed seller);
    
    event NFTSold(
        uint256 indexed tokenId, 
        address indexed seller, 
        address indexed buyer, 
        uint256 price,
        uint256 platformFee,
        uint256 royalty
    );
    
    event BidPlaced(
        uint256 indexed tokenId, 
        address indexed bidder, 
        uint256 amount,
        address previousBidder
    );
    
    event AuctionEnded(
        uint256 indexed tokenId, 
        address indexed winner, 
        uint256 amount
    );
    
    event BidRefunded(
        uint256 indexed tokenId,
        address indexed bidder,
        uint256 amount
    );
    
    event MintingFeeUpdated(uint256 oldFee, uint256 newFee);
    event PlatformFeeUpdated(uint256 oldPercent, uint256 newPercent);
    event FeeCollectorUpdated(address oldCollector, address newCollector);
    event CategoryAdded(string category);
    event EmergencyWithdraw(address indexed to, uint256 amount);

    // ============ Custom Errors ============
    
    error ZeroAddress();
    error InsufficientBalance(uint256 required, uint256 available);
    error InsufficientAllowance(uint256 required, uint256 available);
    error NotTokenOwner();
    error NotListed();
    error AlreadyListed();
    error InvalidPrice();
    error InvalidRoyalty();
    error InvalidCategory();
    error InvalidDuration();
    error AuctionNotEnded();
    error AuctionAlreadyEnded();
    error BidTooLow(uint256 minRequired, uint256 provided);
    error NotAuction();
    error IsAuction();
    error TransferFailed();
    error FeeTooHigh();
    error CategoryExists();
    error CannotBidOnOwnNFT();
    error CannotBuyOwnNFT();

    // ============ Constructor ============
    
    /**
     * @notice Initializes the PMNFT contract
     * @param _pmToken Address of the PM ERC20 token contract
     */
    constructor(address _pmToken) ERC721("Perfect Money NFT", "PMNFT") Ownable(msg.sender) {
        if (_pmToken == address(0)) revert ZeroAddress();
        
        pmToken = IERC20(_pmToken);
        feeCollector = msg.sender;
        mintingFee = 10000 * 10**18; // 10,000 PM tokens
        platformFeePercent = 2; // 2%
        
        // Initialize PM Token NFT categories
        _addCategory("PM Digital Card");
        _addCategory("PM Voucher Card");
        _addCategory("PM Gift Cards");
        _addCategory("PM Partner Badge");
        _addCategory("PM Discount Card");
        _addCategory("PM VIP Exclusive Card");
    }

    // ============ Modifiers ============
    
    /**
     * @notice Ensures the caller is the owner of the specified token
     */
    modifier onlyTokenOwner(uint256 _tokenId) {
        if (ownerOf(_tokenId) != msg.sender) revert NotTokenOwner();
        _;
    }
    
    /**
     * @notice Ensures the listing is active
     */
    modifier onlyActiveListing(uint256 _tokenId) {
        if (!listings[_tokenId].isActive) revert NotListed();
        _;
    }

    // ============ Internal Functions ============
    
    /**
     * @notice Internal function to add a category
     */
    function _addCategory(string memory _category) internal {
        validCategories.push(_category);
        isValidCategory[_category] = true;
        emit CategoryAdded(_category);
    }
    
    /**
     * @notice Validates and processes a PM token transfer
     * @param from Sender address
     * @param to Recipient address
     * @param amount Amount to transfer
     */
    function _safeTransferPM(address from, address to, uint256 amount) internal {
        if (amount == 0) return;
        
        bool success;
        if (from == address(this)) {
            success = pmToken.transfer(to, amount);
        } else {
            success = pmToken.transferFrom(from, to, amount);
        }
        
        if (!success) revert TransferFailed();
    }
    
    /**
     * @notice Calculates and distributes payment for a sale
     * @param _tokenId Token being sold
     * @param _price Sale price
     * @param _buyer Address of buyer
     * @param _seller Address of seller
     * @param _fromContract Whether payment is from contract (auction) or buyer
     */
    function _processSalePayment(
        uint256 _tokenId,
        uint256 _price,
        address _buyer,
        address _seller,
        bool _fromContract
    ) internal returns (uint256 platformFee, uint256 royalty) {
        NFTMetadata memory meta = nftMetadata[_tokenId];
        
        // Calculate fees
        platformFee = (_price * platformFeePercent) / 100;
        
        // Only pay royalty if creator is different from seller
        if (meta.creator != _seller && meta.royaltyPercent > 0) {
            royalty = (_price * meta.royaltyPercent) / 100;
        }
        
        uint256 sellerAmount = _price - platformFee - royalty;
        
        // Transfer payments (CEI pattern - state already updated before calling this)
        address paymentSource = _fromContract ? address(this) : _buyer;
        
        _safeTransferPM(paymentSource, feeCollector, platformFee);
        
        if (royalty > 0) {
            _safeTransferPM(paymentSource, meta.creator, royalty);
        }
        
        _safeTransferPM(paymentSource, _seller, sellerAmount);
        
        // Update stats
        stats.totalSales++;
        stats.totalVolume += _price;
    }

    // ============ External Functions - Minting ============
    
    /**
     * @notice Adds a new NFT category (owner only)
     * @param _category Category name to add
     */
    function addCategory(string calldata _category) external onlyOwner {
        if (isValidCategory[_category]) revert CategoryExists();
        _addCategory(_category);
    }
    
    /**
     * @notice Returns all valid categories
     */
    function getCategories() external view returns (string[] memory) {
        return validCategories;
    }

    /**
     * @notice Mints a new NFT
     * @param _tokenURI IPFS URI for the NFT metadata
     * @param _name Name of the NFT
     * @param _description Description of the NFT
     * @param _category Category of the NFT
     * @param _royaltyPercent Royalty percentage for secondary sales (0-10%)
     * @return tokenId The ID of the newly minted NFT
     */
    function mint(
        string calldata _tokenURI,
        string calldata _name,
        string calldata _description,
        string calldata _category,
        uint256 _royaltyPercent
    ) external nonReentrant whenNotPaused returns (uint256) {
        // Validations
        if (_royaltyPercent > MAX_ROYALTY_PERCENT) revert InvalidRoyalty();
        if (!isValidCategory[_category]) revert InvalidCategory();
        
        uint256 balance = pmToken.balanceOf(msg.sender);
        if (balance < mintingFee) revert InsufficientBalance(mintingFee, balance);
        
        uint256 allowance = pmToken.allowance(msg.sender, address(this));
        if (allowance < mintingFee) revert InsufficientAllowance(mintingFee, allowance);

        // Effects - Update state before external calls
        uint256 tokenId = _tokenIdCounter++;
        
        nftMetadata[tokenId] = NFTMetadata({
            name: _name,
            description: _description,
            category: _category,
            royaltyPercent: _royaltyPercent,
            creator: msg.sender,
            mintedAt: block.timestamp
        });
        
        mintedByAddress[msg.sender]++;
        stats.totalMinted++;

        // Interactions - External calls after state changes
        _safeTransferPM(msg.sender, feeCollector, mintingFee);
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, _tokenURI);

        emit NFTMinted(tokenId, msg.sender, _name, _category, _royaltyPercent);
        return tokenId;
    }

    // ============ External Functions - Listing ============

    /**
     * @notice Lists an NFT for fixed price sale
     * @param _tokenId Token ID to list
     * @param _price Price in PM tokens (wei)
     */
    function listForSale(uint256 _tokenId, uint256 _price) 
        external 
        nonReentrant 
        whenNotPaused 
        onlyTokenOwner(_tokenId) 
    {
        if (listings[_tokenId].isActive) revert AlreadyListed();
        if (_price == 0) revert InvalidPrice();

        listings[_tokenId] = Listing({
            seller: msg.sender,
            price: _price,
            isAuction: false,
            auctionEndTime: 0,
            highestBidder: address(0),
            highestBid: 0,
            isActive: true
        });
        
        stats.totalListings++;

        // Approve contract to transfer NFT
        _approve(address(this), _tokenId, msg.sender);

        emit NFTListed(_tokenId, msg.sender, _price, false, 0);
    }

    /**
     * @notice Lists an NFT for auction
     * @param _tokenId Token ID to auction
     * @param _startingPrice Starting price in PM tokens (wei)
     * @param _duration Auction duration in seconds (1 hour to 7 days)
     */
    function listForAuction(uint256 _tokenId, uint256 _startingPrice, uint256 _duration) 
        external 
        nonReentrant 
        whenNotPaused 
        onlyTokenOwner(_tokenId) 
    {
        if (listings[_tokenId].isActive) revert AlreadyListed();
        if (_startingPrice == 0) revert InvalidPrice();
        if (_duration < MIN_AUCTION_DURATION || _duration > MAX_AUCTION_DURATION) {
            revert InvalidDuration();
        }

        uint256 endTime = block.timestamp + _duration;
        
        listings[_tokenId] = Listing({
            seller: msg.sender,
            price: _startingPrice,
            isAuction: true,
            auctionEndTime: endTime,
            highestBidder: address(0),
            highestBid: 0,
            isActive: true
        });
        
        stats.totalListings++;

        _approve(address(this), _tokenId, msg.sender);

        emit NFTListed(_tokenId, msg.sender, _startingPrice, true, endTime);
    }

    /**
     * @notice Delists an NFT from sale or auction
     * @param _tokenId Token ID to delist
     */
    function delist(uint256 _tokenId) 
        external 
        nonReentrant 
        onlyActiveListing(_tokenId) 
    {
        Listing storage listing = listings[_tokenId];
        if (listing.seller != msg.sender) revert NotTokenOwner();
        
        address bidderToRefund = listing.highestBidder;
        uint256 bidToRefund = listing.highestBid;
        
        // Effects - Clear listing before refund
        delete listings[_tokenId];
        
        // Interactions - Refund if auction had bids
        if (bidderToRefund != address(0) && bidToRefund > 0) {
            _safeTransferPM(address(this), bidderToRefund, bidToRefund);
            emit BidRefunded(_tokenId, bidderToRefund, bidToRefund);
        }

        emit NFTDelisted(_tokenId, msg.sender);
    }

    // ============ External Functions - Trading ============

    /**
     * @notice Buys a listed NFT at fixed price
     * @param _tokenId Token ID to buy
     */
    function buy(uint256 _tokenId) 
        external 
        nonReentrant 
        whenNotPaused 
        onlyActiveListing(_tokenId) 
    {
        Listing storage listing = listings[_tokenId];
        if (listing.isAuction) revert IsAuction();
        if (listing.seller == msg.sender) revert CannotBuyOwnNFT();

        uint256 price = listing.price;
        address seller = listing.seller;

        // Check buyer has sufficient balance and allowance
        uint256 balance = pmToken.balanceOf(msg.sender);
        if (balance < price) revert InsufficientBalance(price, balance);
        
        uint256 allowance = pmToken.allowance(msg.sender, address(this));
        if (allowance < price) revert InsufficientAllowance(price, allowance);

        // Effects - Clear listing before transfers
        delete listings[_tokenId];

        // Interactions - Process payment and transfer NFT
        (uint256 platformFee, uint256 royalty) = _processSalePayment(
            _tokenId, price, msg.sender, seller, false
        );
        _transfer(seller, msg.sender, _tokenId);

        emit NFTSold(_tokenId, seller, msg.sender, price, platformFee, royalty);
    }

    /**
     * @notice Places a bid on an auction
     * @param _tokenId Token ID to bid on
     * @param _amount Bid amount in PM tokens (wei)
     */
    function placeBid(uint256 _tokenId, uint256 _amount) 
        external 
        nonReentrant 
        whenNotPaused 
        onlyActiveListing(_tokenId) 
    {
        Listing storage listing = listings[_tokenId];
        if (!listing.isAuction) revert NotAuction();
        if (block.timestamp >= listing.auctionEndTime) revert AuctionAlreadyEnded();
        if (listing.seller == msg.sender) revert CannotBidOnOwnNFT();
        
        uint256 minBid = listing.highestBid > 0 ? listing.highestBid + 1 : listing.price;
        if (_amount < minBid) revert BidTooLow(minBid, _amount);

        uint256 balance = pmToken.balanceOf(msg.sender);
        if (balance < _amount) revert InsufficientBalance(_amount, balance);
        
        uint256 allowance = pmToken.allowance(msg.sender, address(this));
        if (allowance < _amount) revert InsufficientAllowance(_amount, allowance);

        // Store previous bidder info for refund
        address previousBidder = listing.highestBidder;
        uint256 previousBid = listing.highestBid;

        // Effects - Update listing
        listing.highestBidder = msg.sender;
        listing.highestBid = _amount;

        // Interactions - Transfer new bid to contract
        _safeTransferPM(msg.sender, address(this), _amount);

        // Refund previous bidder
        if (previousBidder != address(0) && previousBid > 0) {
            _safeTransferPM(address(this), previousBidder, previousBid);
            emit BidRefunded(_tokenId, previousBidder, previousBid);
        }

        emit BidPlaced(_tokenId, msg.sender, _amount, previousBidder);
    }

    /**
     * @notice Ends an auction and transfers NFT to winner
     * @param _tokenId Token ID of the auction
     */
    function endAuction(uint256 _tokenId) 
        external 
        nonReentrant 
        onlyActiveListing(_tokenId) 
    {
        Listing storage listing = listings[_tokenId];
        if (!listing.isAuction) revert NotAuction();
        if (block.timestamp < listing.auctionEndTime) revert AuctionNotEnded();

        address seller = listing.seller;
        address winner = listing.highestBidder;
        uint256 winningBid = listing.highestBid;

        // Effects - Clear listing before transfers
        delete listings[_tokenId];

        if (winner == address(0)) {
            // No bids, just delist
            emit AuctionEnded(_tokenId, address(0), 0);
            return;
        }

        // Interactions - Process payment from contract and transfer NFT
        (uint256 platformFee, uint256 royalty) = _processSalePayment(
            _tokenId, winningBid, winner, seller, true
        );
        _transfer(seller, winner, _tokenId);

        emit AuctionEnded(_tokenId, winner, winningBid);
        emit NFTSold(_tokenId, seller, winner, winningBid, platformFee, royalty);
    }

    // ============ View Functions ============
    
    /**
     * @notice Returns listing information for a token
     */
    function getListing(uint256 _tokenId) external view returns (Listing memory) {
        return listings[_tokenId];
    }

    /**
     * @notice Returns metadata for a token
     */
    function getMetadata(uint256 _tokenId) external view returns (NFTMetadata memory) {
        return nftMetadata[_tokenId];
    }

    /**
     * @notice Returns total number of NFTs minted
     */
    function getTotalMinted() external view returns (uint256) {
        return _tokenIdCounter;
    }
    
    /**
     * @notice Returns marketplace statistics
     */
    function getMarketplaceStats() external view returns (MarketplaceStats memory) {
        return stats;
    }
    
    /**
     * @notice Returns number of NFTs minted by an address
     */
    function getMintedByAddress(address _minter) external view returns (uint256) {
        return mintedByAddress[_minter];
    }
    
    /**
     * @notice Checks if an auction has ended
     */
    function isAuctionEnded(uint256 _tokenId) external view returns (bool) {
        Listing memory listing = listings[_tokenId];
        if (!listing.isActive || !listing.isAuction) return false;
        return block.timestamp >= listing.auctionEndTime;
    }
    
    /**
     * @notice Returns time remaining in an auction
     */
    function getAuctionTimeRemaining(uint256 _tokenId) external view returns (uint256) {
        Listing memory listing = listings[_tokenId];
        if (!listing.isActive || !listing.isAuction) return 0;
        if (block.timestamp >= listing.auctionEndTime) return 0;
        return listing.auctionEndTime - block.timestamp;
    }

    // ============ Admin Functions ============

    /**
     * @notice Updates the minting fee
     * @param _fee New minting fee in PM tokens (wei)
     */
    function setMintingFee(uint256 _fee) external onlyOwner {
        uint256 oldFee = mintingFee;
        mintingFee = _fee;
        emit MintingFeeUpdated(oldFee, _fee);
    }

    /**
     * @notice Updates the platform fee percentage
     * @param _percent New platform fee percentage (max 10%)
     */
    function setPlatformFee(uint256 _percent) external onlyOwner {
        if (_percent > MAX_PLATFORM_FEE) revert FeeTooHigh();
        uint256 oldPercent = platformFeePercent;
        platformFeePercent = _percent;
        emit PlatformFeeUpdated(oldPercent, _percent);
    }

    /**
     * @notice Updates the fee collector address
     * @param _collector New fee collector address
     */
    function setFeeCollector(address _collector) external onlyOwner {
        if (_collector == address(0)) revert ZeroAddress();
        address oldCollector = feeCollector;
        feeCollector = _collector;
        emit FeeCollectorUpdated(oldCollector, _collector);
    }

    /**
     * @notice Emergency withdraw of stuck PM tokens
     * @param _amount Amount to withdraw
     */
    function emergencyWithdraw(uint256 _amount) external onlyOwner {
        _safeTransferPM(address(this), msg.sender, _amount);
        emit EmergencyWithdraw(msg.sender, _amount);
    }
    
    /**
     * @notice Pauses the contract (emergency stop)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @notice Unpauses the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    // ============ Override Functions ============

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
