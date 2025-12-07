// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

interface IERC20 {
    function transferFrom(address, address, uint256) external returns (bool);
    function transfer(address, uint256) external returns (bool);
    function balanceOf(address) external view returns (uint256);
    function allowance(address, address) external view returns (uint256);
}

/**
 * @title PMNFT - Optimized NFT Marketplace
 * @dev ERC721 with marketplace, auctions, royalties. Optimized for contract size.
 */
contract PMNFT is ERC721, ERC721URIStorage, ERC721Enumerable, Ownable, ReentrancyGuard, Pausable {
    
    IERC20 public immutable pmToken;
    string[] public categories;
    mapping(string => bool) public validCategory;
    
    uint256 private _tokenId;
    uint256 public mintFee;
    uint256 public platformFee;
    address public collector;
    
    uint256 public constant MAX_ROYALTY = 10;
    uint256 public constant MAX_FEE = 10;
    uint256 public constant MIN_AUCTION = 1 hours;
    uint256 public constant MAX_AUCTION = 7 days;

    struct Listing {
        address seller;
        uint256 price;
        bool auction;
        uint256 endTime;
        address bidder;
        uint256 bid;
        bool active;
    }

    struct Meta {
        string name;
        string desc;
        string category;
        uint256 royalty;
        address creator;
        uint256 time;
    }
    
    struct Stats {
        uint256 minted;
        uint256 listings;
        uint256 sales;
        uint256 volume;
    }

    mapping(uint256 => Listing) public listings;
    mapping(uint256 => Meta) public meta;
    mapping(address => uint256) public minted;
    Stats public stats;

    event Mint(uint256 indexed id, address indexed creator, string name, string cat, uint256 royalty);
    event List(uint256 indexed id, address indexed seller, uint256 price, bool auction, uint256 end);
    event Delist(uint256 indexed id, address indexed seller);
    event Sale(uint256 indexed id, address indexed seller, address indexed buyer, uint256 price, uint256 fee, uint256 royalty);
    event Bid(uint256 indexed id, address indexed bidder, uint256 amt, address prev);
    event AuctionEnd(uint256 indexed id, address indexed winner, uint256 amt);
    event Refund(uint256 indexed id, address indexed bidder, uint256 amt);
    event FeeUpdate(uint256 old, uint256 next);
    event PlatformFeeUpdate(uint256 old, uint256 next);
    event CollectorUpdate(address old, address next);
    event CategoryAdd(string cat);
    event Withdraw(address indexed to, uint256 amt);

    error Zero();
    error LowBal(uint256 need, uint256 have);
    error LowAllow(uint256 need, uint256 have);
    error NotOwner();
    error NotListed();
    error Listed();
    error BadPrice();
    error BadRoyalty();
    error BadCategory();
    error BadDuration();
    error NotEnded();
    error Ended();
    error LowBid(uint256 min, uint256 got);
    error NotAuction();
    error IsAuction();
    error Failed();
    error HighFee();
    error CatExists();
    error SelfBid();
    error SelfBuy();

    constructor(address _pm) ERC721("Perfect Money NFT", "PMNFT") Ownable(msg.sender) {
        if (_pm == address(0)) revert Zero();
        pmToken = IERC20(_pm);
        collector = msg.sender;
        mintFee = 10000 * 10**18;
        platformFee = 2;
        _addCat("PM Digital Card");
        _addCat("PM Voucher Card");
        _addCat("PM Gift Cards");
        _addCat("PM Partner Badge");
        _addCat("PM Discount Card");
        _addCat("PM VIP Exclusive Card");
    }

    modifier isOwner(uint256 id) {
        if (ownerOf(id) != msg.sender) revert NotOwner();
        _;
    }
    
    modifier isActive(uint256 id) {
        if (!listings[id].active) revert NotListed();
        _;
    }

    function _addCat(string memory c) internal {
        categories.push(c);
        validCategory[c] = true;
        emit CategoryAdd(c);
    }
    
    function _pmTransfer(address f, address t, uint256 a) internal {
        if (a == 0) return;
        bool ok = f == address(this) ? pmToken.transfer(t, a) : pmToken.transferFrom(f, t, a);
        if (!ok) revert Failed();
    }
    
    function _pay(uint256 id, uint256 p, address buyer, address seller, bool fromContract) internal returns (uint256 pFee, uint256 r) {
        Meta memory m = meta[id];
        pFee = (p * platformFee) / 100;
        if (m.creator != seller && m.royalty > 0) r = (p * m.royalty) / 100;
        uint256 sellerAmt = p - pFee - r;
        address src = fromContract ? address(this) : buyer;
        _pmTransfer(src, collector, pFee);
        if (r > 0) _pmTransfer(src, m.creator, r);
        _pmTransfer(src, seller, sellerAmt);
        stats.sales++;
        stats.volume += p;
    }

    function addCategory(string calldata c) external onlyOwner {
        if (validCategory[c]) revert CatExists();
        _addCat(c);
    }
    
    function getCategories() external view returns (string[] memory) {
        return categories;
    }

    function mint(string calldata uri, string calldata name, string calldata desc, string calldata cat, uint256 royalty) external nonReentrant whenNotPaused returns (uint256) {
        if (royalty > MAX_ROYALTY) revert BadRoyalty();
        if (!validCategory[cat]) revert BadCategory();
        uint256 bal = pmToken.balanceOf(msg.sender);
        if (bal < mintFee) revert LowBal(mintFee, bal);
        uint256 allow = pmToken.allowance(msg.sender, address(this));
        if (allow < mintFee) revert LowAllow(mintFee, allow);

        uint256 id = _tokenId++;
        meta[id] = Meta(name, desc, cat, royalty, msg.sender, block.timestamp);
        minted[msg.sender]++;
        stats.minted++;

        _pmTransfer(msg.sender, collector, mintFee);
        _safeMint(msg.sender, id);
        _setTokenURI(id, uri);

        emit Mint(id, msg.sender, name, cat, royalty);
        return id;
    }

    function listForSale(uint256 id, uint256 price) external nonReentrant whenNotPaused isOwner(id) {
        if (listings[id].active) revert Listed();
        if (price == 0) revert BadPrice();
        listings[id] = Listing(msg.sender, price, false, 0, address(0), 0, true);
        stats.listings++;
        _approve(address(this), id, msg.sender);
        emit List(id, msg.sender, price, false, 0);
    }

    function listForAuction(uint256 id, uint256 startPrice, uint256 dur) external nonReentrant whenNotPaused isOwner(id) {
        if (listings[id].active) revert Listed();
        if (startPrice == 0) revert BadPrice();
        if (dur < MIN_AUCTION || dur > MAX_AUCTION) revert BadDuration();
        uint256 end = block.timestamp + dur;
        listings[id] = Listing(msg.sender, startPrice, true, end, address(0), 0, true);
        stats.listings++;
        _approve(address(this), id, msg.sender);
        emit List(id, msg.sender, startPrice, true, end);
    }

    function delist(uint256 id) external nonReentrant isActive(id) {
        Listing storage l = listings[id];
        if (l.seller != msg.sender) revert NotOwner();
        address refundTo = l.bidder;
        uint256 refundAmt = l.bid;
        delete listings[id];
        if (refundTo != address(0) && refundAmt > 0) {
            _pmTransfer(address(this), refundTo, refundAmt);
            emit Refund(id, refundTo, refundAmt);
        }
        emit Delist(id, msg.sender);
    }

    function buy(uint256 id) external nonReentrant whenNotPaused isActive(id) {
        Listing storage l = listings[id];
        if (l.auction) revert IsAuction();
        if (l.seller == msg.sender) revert SelfBuy();
        uint256 p = l.price;
        address seller = l.seller;
        uint256 bal = pmToken.balanceOf(msg.sender);
        if (bal < p) revert LowBal(p, bal);
        uint256 allow = pmToken.allowance(msg.sender, address(this));
        if (allow < p) revert LowAllow(p, allow);
        delete listings[id];
        (uint256 pFee, uint256 r) = _pay(id, p, msg.sender, seller, false);
        _transfer(seller, msg.sender, id);
        emit Sale(id, seller, msg.sender, p, pFee, r);
    }

    function placeBid(uint256 id, uint256 amt) external nonReentrant whenNotPaused isActive(id) {
        Listing storage l = listings[id];
        if (!l.auction) revert NotAuction();
        if (block.timestamp >= l.endTime) revert Ended();
        if (l.seller == msg.sender) revert SelfBid();
        uint256 minBid = l.bid > 0 ? l.bid + 1 : l.price;
        if (amt < minBid) revert LowBid(minBid, amt);
        uint256 bal = pmToken.balanceOf(msg.sender);
        if (bal < amt) revert LowBal(amt, bal);
        uint256 allow = pmToken.allowance(msg.sender, address(this));
        if (allow < amt) revert LowAllow(amt, allow);
        address prev = l.bidder;
        uint256 prevAmt = l.bid;
        l.bidder = msg.sender;
        l.bid = amt;
        _pmTransfer(msg.sender, address(this), amt);
        if (prev != address(0) && prevAmt > 0) {
            _pmTransfer(address(this), prev, prevAmt);
            emit Refund(id, prev, prevAmt);
        }
        emit Bid(id, msg.sender, amt, prev);
    }

    function endAuction(uint256 id) external nonReentrant isActive(id) {
        Listing storage l = listings[id];
        if (!l.auction) revert NotAuction();
        if (block.timestamp < l.endTime) revert NotEnded();
        address seller = l.seller;
        address winner = l.bidder;
        uint256 winBid = l.bid;
        delete listings[id];
        if (winner == address(0)) {
            emit AuctionEnd(id, address(0), 0);
            return;
        }
        (uint256 pFee, uint256 r) = _pay(id, winBid, winner, seller, true);
        _transfer(seller, winner, id);
        emit AuctionEnd(id, winner, winBid);
        emit Sale(id, seller, winner, winBid, pFee, r);
    }

    function getListing(uint256 id) external view returns (Listing memory) { return listings[id]; }
    function getMetadata(uint256 id) external view returns (Meta memory) { return meta[id]; }
    function getTotalMinted() external view returns (uint256) { return _tokenId; }
    function getStats() external view returns (Stats memory) { return stats; }
    function getMinted(address a) external view returns (uint256) { return minted[a]; }
    function auctionEnded(uint256 id) external view returns (bool) {
        Listing memory l = listings[id];
        return l.active && l.auction && block.timestamp >= l.endTime;
    }
    function timeLeft(uint256 id) external view returns (uint256) {
        Listing memory l = listings[id];
        if (!l.active || !l.auction || block.timestamp >= l.endTime) return 0;
        return l.endTime - block.timestamp;
    }

    function setMintFee(uint256 f) external onlyOwner {
        uint256 old = mintFee;
        mintFee = f;
        emit FeeUpdate(old, f);
    }
    
    function setPlatformFee(uint256 p) external onlyOwner {
        if (p > MAX_FEE) revert HighFee();
        uint256 old = platformFee;
        platformFee = p;
        emit PlatformFeeUpdate(old, p);
    }
    
    function setCollector(address c) external onlyOwner {
        if (c == address(0)) revert Zero();
        address old = collector;
        collector = c;
        emit CollectorUpdate(old, c);
    }
    
    function withdraw(uint256 a) external onlyOwner {
        _pmTransfer(address(this), msg.sender, a);
        emit Withdraw(msg.sender, a);
    }
    
    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    function _update(address to, uint256 id, address auth) internal override(ERC721, ERC721Enumerable) returns (address) {
        return super._update(to, id, auth);
    }
    
    function _increaseBalance(address a, uint128 v) internal override(ERC721, ERC721Enumerable) {
        super._increaseBalance(a, v);
    }
    
    function tokenURI(uint256 id) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(id);
    }
    
    function supportsInterface(bytes4 iface) public view override(ERC721, ERC721Enumerable, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(iface);
    }
}
