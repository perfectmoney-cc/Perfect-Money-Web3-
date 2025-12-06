// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

/// @title PMNFT - Perfect Money NFT Marketplace Contract
/// @notice Allows users to mint, list, and trade NFTs using PM tokens
/// @dev Implements ERC721 with enumerable and URI storage extensions
contract PMNFT is ERC721, ERC721URIStorage, ERC721Enumerable, Ownable, ReentrancyGuard {
    IERC20 public immutable pmToken;

    uint256 private _tokenIdCounter;
    uint256 public mintingFee = 10000 * 10**18; // 10,000 PM tokens
    uint256 public listingFee = 0; // Optional listing fee in PM
    uint256 public platformFeePercent = 2; // 2% platform fee on sales

    address public feeCollector;

    struct Listing {
        address seller;
        uint256 price;
        bool isAuction;
        uint256 auctionEndTime;
        address highestBidder;
        uint256 highestBid;
        bool isActive;
    }

    struct NFTMetadata {
        string name;
        string description;
        string category;
        uint256 royaltyPercent;
        address creator;
        uint256 mintedAt;
    }

    mapping(uint256 => Listing) public listings;
    mapping(uint256 => NFTMetadata) public nftMetadata;

    // Events
    event NFTMinted(uint256 indexed tokenId, address indexed creator, string name, string category);
    event NFTListed(uint256 indexed tokenId, address indexed seller, uint256 price, bool isAuction, uint256 auctionEndTime);
    event NFTDelisted(uint256 indexed tokenId, address indexed seller);
    event NFTSold(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price);
    event BidPlaced(uint256 indexed tokenId, address indexed bidder, uint256 amount);
    event AuctionEnded(uint256 indexed tokenId, address indexed winner, uint256 amount);
    event MintingFeeUpdated(uint256 newFee);
    event PlatformFeeUpdated(uint256 newPercent);

    // Errors
    error InsufficientBalance(uint256 required, uint256 available);
    error NotTokenOwner();
    error NotListed();
    error AlreadyListed();
    error InvalidPrice();
    error AuctionNotEnded();
    error AuctionEnded();
    error BidTooLow();
    error NotAuction();
    error TransferFailed();

    constructor(address _pmToken) ERC721("Perfect Money NFT", "PMNFT") Ownable(msg.sender) {
        require(_pmToken != address(0), "Zero token address");
        pmToken = IERC20(_pmToken);
        feeCollector = msg.sender;
    }

    /// @notice Mint a new NFT
    /// @param _tokenURI The metadata URI for the NFT
    /// @param _name Name of the NFT
    /// @param _description Description of the NFT
    /// @param _category Category of the NFT
    /// @param _royaltyPercent Royalty percentage for secondary sales (0-10%)
    function mint(
        string memory _tokenURI,
        string memory _name,
        string memory _description,
        string memory _category,
        uint256 _royaltyPercent
    ) external nonReentrant returns (uint256) {
        require(_royaltyPercent <= 10, "Royalty too high");
        
        uint256 balance = pmToken.balanceOf(msg.sender);
        if (balance < mintingFee) revert InsufficientBalance(mintingFee, balance);

        // Transfer minting fee
        bool sent = pmToken.transferFrom(msg.sender, feeCollector, mintingFee);
        if (!sent) revert TransferFailed();

        uint256 tokenId = _tokenIdCounter++;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, _tokenURI);

        nftMetadata[tokenId] = NFTMetadata({
            name: _name,
            description: _description,
            category: _category,
            royaltyPercent: _royaltyPercent,
            creator: msg.sender,
            mintedAt: block.timestamp
        });

        emit NFTMinted(tokenId, msg.sender, _name, _category);
        return tokenId;
    }

    /// @notice List an NFT for sale
    /// @param _tokenId Token ID to list
    /// @param _price Price in PM tokens
    function listForSale(uint256 _tokenId, uint256 _price) external {
        if (ownerOf(_tokenId) != msg.sender) revert NotTokenOwner();
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

        // Approve contract to transfer NFT
        approve(address(this), _tokenId);

        emit NFTListed(_tokenId, msg.sender, _price, false, 0);
    }

    /// @notice List an NFT for auction
    /// @param _tokenId Token ID to auction
    /// @param _startingPrice Starting price in PM tokens
    /// @param _duration Auction duration in seconds
    function listForAuction(uint256 _tokenId, uint256 _startingPrice, uint256 _duration) external {
        if (ownerOf(_tokenId) != msg.sender) revert NotTokenOwner();
        if (listings[_tokenId].isActive) revert AlreadyListed();
        if (_startingPrice == 0) revert InvalidPrice();
        require(_duration >= 1 hours && _duration <= 7 days, "Invalid duration");

        listings[_tokenId] = Listing({
            seller: msg.sender,
            price: _startingPrice,
            isAuction: true,
            auctionEndTime: block.timestamp + _duration,
            highestBidder: address(0),
            highestBid: 0,
            isActive: true
        });

        approve(address(this), _tokenId);

        emit NFTListed(_tokenId, msg.sender, _startingPrice, true, block.timestamp + _duration);
    }

    /// @notice Delist an NFT
    /// @param _tokenId Token ID to delist
    function delist(uint256 _tokenId) external {
        Listing storage listing = listings[_tokenId];
        if (!listing.isActive) revert NotListed();
        if (listing.seller != msg.sender) revert NotTokenOwner();
        
        if (listing.isAuction && listing.highestBidder != address(0)) {
            // Refund highest bidder
            bool refunded = pmToken.transfer(listing.highestBidder, listing.highestBid);
            require(refunded, "Refund failed");
        }

        delete listings[_tokenId];
        emit NFTDelisted(_tokenId, msg.sender);
    }

    /// @notice Buy a listed NFT (fixed price)
    /// @param _tokenId Token ID to buy
    function buy(uint256 _tokenId) external nonReentrant {
        Listing storage listing = listings[_tokenId];
        if (!listing.isActive) revert NotListed();
        if (listing.isAuction) revert NotAuction();

        uint256 price = listing.price;
        address seller = listing.seller;

        uint256 balance = pmToken.balanceOf(msg.sender);
        if (balance < price) revert InsufficientBalance(price, balance);

        // Calculate fees
        uint256 platformFee = (price * platformFeePercent) / 100;
        NFTMetadata memory meta = nftMetadata[_tokenId];
        uint256 royalty = (price * meta.royaltyPercent) / 100;
        uint256 sellerAmount = price - platformFee - royalty;

        // Transfer payment
        require(pmToken.transferFrom(msg.sender, feeCollector, platformFee), "Platform fee failed");
        if (royalty > 0 && meta.creator != seller) {
            require(pmToken.transferFrom(msg.sender, meta.creator, royalty), "Royalty failed");
        } else {
            sellerAmount += royalty;
        }
        require(pmToken.transferFrom(msg.sender, seller, sellerAmount), "Payment failed");

        // Transfer NFT
        _transfer(seller, msg.sender, _tokenId);

        delete listings[_tokenId];
        emit NFTSold(_tokenId, seller, msg.sender, price);
    }

    /// @notice Place a bid on an auction
    /// @param _tokenId Token ID to bid on
    /// @param _amount Bid amount in PM tokens
    function placeBid(uint256 _tokenId, uint256 _amount) external nonReentrant {
        Listing storage listing = listings[_tokenId];
        if (!listing.isActive) revert NotListed();
        if (!listing.isAuction) revert NotAuction();
        if (block.timestamp >= listing.auctionEndTime) revert AuctionEnded();
        
        uint256 minBid = listing.highestBid > 0 ? listing.highestBid : listing.price;
        if (_amount <= minBid) revert BidTooLow();

        uint256 balance = pmToken.balanceOf(msg.sender);
        if (balance < _amount) revert InsufficientBalance(_amount, balance);

        // Transfer bid amount to contract
        require(pmToken.transferFrom(msg.sender, address(this), _amount), "Bid transfer failed");

        // Refund previous highest bidder
        if (listing.highestBidder != address(0)) {
            require(pmToken.transfer(listing.highestBidder, listing.highestBid), "Refund failed");
        }

        listing.highestBidder = msg.sender;
        listing.highestBid = _amount;

        emit BidPlaced(_tokenId, msg.sender, _amount);
    }

    /// @notice End an auction and transfer NFT to winner
    /// @param _tokenId Token ID of the auction
    function endAuction(uint256 _tokenId) external nonReentrant {
        Listing storage listing = listings[_tokenId];
        if (!listing.isActive) revert NotListed();
        if (!listing.isAuction) revert NotAuction();
        if (block.timestamp < listing.auctionEndTime) revert AuctionNotEnded();

        address seller = listing.seller;
        address winner = listing.highestBidder;
        uint256 winningBid = listing.highestBid;

        if (winner == address(0)) {
            // No bids, just delist
            delete listings[_tokenId];
            emit AuctionEnded(_tokenId, address(0), 0);
            return;
        }

        // Calculate fees
        uint256 platformFee = (winningBid * platformFeePercent) / 100;
        NFTMetadata memory meta = nftMetadata[_tokenId];
        uint256 royalty = (winningBid * meta.royaltyPercent) / 100;
        uint256 sellerAmount = winningBid - platformFee - royalty;

        // Transfer from contract (bid already held)
        require(pmToken.transfer(feeCollector, platformFee), "Platform fee failed");
        if (royalty > 0 && meta.creator != seller) {
            require(pmToken.transfer(meta.creator, royalty), "Royalty failed");
        } else {
            sellerAmount += royalty;
        }
        require(pmToken.transfer(seller, sellerAmount), "Payment failed");

        // Transfer NFT
        _transfer(seller, winner, _tokenId);

        delete listings[_tokenId];
        emit AuctionEnded(_tokenId, winner, winningBid);
        emit NFTSold(_tokenId, seller, winner, winningBid);
    }

    // View functions
    function getListing(uint256 _tokenId) external view returns (Listing memory) {
        return listings[_tokenId];
    }

    function getMetadata(uint256 _tokenId) external view returns (NFTMetadata memory) {
        return nftMetadata[_tokenId];
    }

    function getTotalMinted() external view returns (uint256) {
        return _tokenIdCounter;
    }

    // Admin functions
    function setMintingFee(uint256 _fee) external onlyOwner {
        mintingFee = _fee;
        emit MintingFeeUpdated(_fee);
    }

    function setPlatformFee(uint256 _percent) external onlyOwner {
        require(_percent <= 10, "Fee too high");
        platformFeePercent = _percent;
        emit PlatformFeeUpdated(_percent);
    }

    function setFeeCollector(address _collector) external onlyOwner {
        require(_collector != address(0), "Zero address");
        feeCollector = _collector;
    }

    function withdrawTokens(uint256 _amount) external onlyOwner {
        require(pmToken.transfer(msg.sender, _amount), "Withdraw failed");
    }

    // Override required functions
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
