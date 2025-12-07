// PMNFT Contract ABI - Updated for enhanced marketplace functionality
export const PMNFTABI = [
  // ============ Read Functions ============
  { inputs: [], name: "name", outputs: [{ type: "string" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "symbol", outputs: [{ type: "string" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "pmToken", outputs: [{ type: "address" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "mintingFee", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "platformFeePercent", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "feeCollector", outputs: [{ type: "address" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "owner", outputs: [{ type: "address" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "totalSupply", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "paused", outputs: [{ type: "bool" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "MAX_ROYALTY_PERCENT", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "MAX_PLATFORM_FEE", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "MIN_AUCTION_DURATION", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "MAX_AUCTION_DURATION", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  
  // Token queries
  { inputs: [{ name: "tokenId", type: "uint256" }], name: "ownerOf", outputs: [{ type: "address" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "owner", type: "address" }], name: "balanceOf", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "tokenId", type: "uint256" }], name: "tokenURI", outputs: [{ type: "string" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "owner", type: "address" }, { name: "index", type: "uint256" }], name: "tokenOfOwnerByIndex", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "index", type: "uint256" }], name: "tokenByIndex", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "getTotalMinted", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "getCategories", outputs: [{ type: "string[]" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "category", type: "string" }], name: "isValidCategory", outputs: [{ type: "bool" }], stateMutability: "view", type: "function" },
  
  // Minter stats
  { inputs: [{ name: "minter", type: "address" }], name: "getMintedByAddress", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "minter", type: "address" }], name: "mintedByAddress", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  
  // Auction helpers
  { inputs: [{ name: "tokenId", type: "uint256" }], name: "isAuctionEnded", outputs: [{ type: "bool" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "tokenId", type: "uint256" }], name: "getAuctionTimeRemaining", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  
  // Marketplace stats struct
  { 
    inputs: [], 
    name: "getMarketplaceStats", 
    outputs: [{ 
      components: [
        { name: "totalMinted", type: "uint256" },
        { name: "totalListings", type: "uint256" },
        { name: "totalSales", type: "uint256" },
        { name: "totalVolume", type: "uint256" }
      ],
      type: "tuple"
    }], 
    stateMutability: "view", 
    type: "function" 
  },
  
  // Listing struct view
  { 
    inputs: [{ name: "tokenId", type: "uint256" }], 
    name: "getListing", 
    outputs: [{ 
      components: [
        { name: "seller", type: "address" },
        { name: "price", type: "uint256" },
        { name: "isAuction", type: "bool" },
        { name: "auctionEndTime", type: "uint256" },
        { name: "highestBidder", type: "address" },
        { name: "highestBid", type: "uint256" },
        { name: "isActive", type: "bool" }
      ],
      type: "tuple"
    }], 
    stateMutability: "view", 
    type: "function" 
  },
  
  // NFT Metadata struct view
  { 
    inputs: [{ name: "tokenId", type: "uint256" }], 
    name: "getMetadata", 
    outputs: [{ 
      components: [
        { name: "name", type: "string" },
        { name: "description", type: "string" },
        { name: "category", type: "string" },
        { name: "royaltyPercent", type: "uint256" },
        { name: "creator", type: "address" },
        { name: "mintedAt", type: "uint256" }
      ],
      type: "tuple"
    }], 
    stateMutability: "view", 
    type: "function" 
  },
  
  // Direct mapping access
  { 
    inputs: [{ name: "tokenId", type: "uint256" }], 
    name: "listings", 
    outputs: [
      { name: "seller", type: "address" },
      { name: "price", type: "uint256" },
      { name: "isAuction", type: "bool" },
      { name: "auctionEndTime", type: "uint256" },
      { name: "highestBidder", type: "address" },
      { name: "highestBid", type: "uint256" },
      { name: "isActive", type: "bool" }
    ], 
    stateMutability: "view", 
    type: "function" 
  },
  
  { 
    inputs: [{ name: "tokenId", type: "uint256" }], 
    name: "nftMetadata", 
    outputs: [
      { name: "name", type: "string" },
      { name: "description", type: "string" },
      { name: "category", type: "string" },
      { name: "royaltyPercent", type: "uint256" },
      { name: "creator", type: "address" },
      { name: "mintedAt", type: "uint256" }
    ], 
    stateMutability: "view", 
    type: "function" 
  },
  
  // ============ Write Functions ============
  
  // Minting
  { 
    inputs: [
      { name: "_tokenURI", type: "string" },
      { name: "_name", type: "string" },
      { name: "_description", type: "string" },
      { name: "_category", type: "string" },
      { name: "_royaltyPercent", type: "uint256" }
    ], 
    name: "mint", 
    outputs: [{ type: "uint256" }], 
    stateMutability: "nonpayable", 
    type: "function" 
  },
  
  // Listing
  { 
    inputs: [
      { name: "_tokenId", type: "uint256" },
      { name: "_price", type: "uint256" }
    ], 
    name: "listForSale", 
    outputs: [], 
    stateMutability: "nonpayable", 
    type: "function" 
  },
  
  { 
    inputs: [
      { name: "_tokenId", type: "uint256" },
      { name: "_startingPrice", type: "uint256" },
      { name: "_duration", type: "uint256" }
    ], 
    name: "listForAuction", 
    outputs: [], 
    stateMutability: "nonpayable", 
    type: "function" 
  },
  
  { 
    inputs: [{ name: "_tokenId", type: "uint256" }], 
    name: "delist", 
    outputs: [], 
    stateMutability: "nonpayable", 
    type: "function" 
  },
  
  // Trading
  { 
    inputs: [{ name: "_tokenId", type: "uint256" }], 
    name: "buy", 
    outputs: [], 
    stateMutability: "nonpayable", 
    type: "function" 
  },
  
  { 
    inputs: [
      { name: "_tokenId", type: "uint256" },
      { name: "_amount", type: "uint256" }
    ], 
    name: "placeBid", 
    outputs: [], 
    stateMutability: "nonpayable", 
    type: "function" 
  },
  
  { 
    inputs: [{ name: "_tokenId", type: "uint256" }], 
    name: "endAuction", 
    outputs: [], 
    stateMutability: "nonpayable", 
    type: "function" 
  },
  
  // ============ ERC721 Standard Functions ============
  
  { 
    inputs: [
      { name: "to", type: "address" },
      { name: "tokenId", type: "uint256" }
    ], 
    name: "approve", 
    outputs: [], 
    stateMutability: "nonpayable", 
    type: "function" 
  },
  
  { 
    inputs: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "tokenId", type: "uint256" }
    ], 
    name: "transferFrom", 
    outputs: [], 
    stateMutability: "nonpayable", 
    type: "function" 
  },
  
  { 
    inputs: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "tokenId", type: "uint256" }
    ], 
    name: "safeTransferFrom", 
    outputs: [], 
    stateMutability: "nonpayable", 
    type: "function" 
  },
  
  { 
    inputs: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "tokenId", type: "uint256" },
      { name: "data", type: "bytes" }
    ], 
    name: "safeTransferFrom", 
    outputs: [], 
    stateMutability: "nonpayable", 
    type: "function" 
  },
  
  { 
    inputs: [
      { name: "operator", type: "address" },
      { name: "approved", type: "bool" }
    ], 
    name: "setApprovalForAll", 
    outputs: [], 
    stateMutability: "nonpayable", 
    type: "function" 
  },
  
  { 
    inputs: [{ name: "tokenId", type: "uint256" }], 
    name: "getApproved", 
    outputs: [{ type: "address" }], 
    stateMutability: "view", 
    type: "function" 
  },
  
  { 
    inputs: [
      { name: "owner", type: "address" },
      { name: "operator", type: "address" }
    ], 
    name: "isApprovedForAll", 
    outputs: [{ type: "bool" }], 
    stateMutability: "view", 
    type: "function" 
  },
  
  // ============ Admin Functions ============
  
  { inputs: [{ name: "_fee", type: "uint256" }], name: "setMintingFee", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "_percent", type: "uint256" }], name: "setPlatformFee", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "_collector", type: "address" }], name: "setFeeCollector", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "_amount", type: "uint256" }], name: "emergencyWithdraw", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "_category", type: "string" }], name: "addCategory", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [], name: "pause", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [], name: "unpause", outputs: [], stateMutability: "nonpayable", type: "function" },
  
  // ============ Events ============
  
  { anonymous: false, inputs: [{ indexed: true, name: "tokenId", type: "uint256" }, { indexed: true, name: "creator", type: "address" }, { indexed: false, name: "name", type: "string" }, { indexed: false, name: "category", type: "string" }, { indexed: false, name: "royaltyPercent", type: "uint256" }], name: "NFTMinted", type: "event" },
  { anonymous: false, inputs: [{ indexed: true, name: "tokenId", type: "uint256" }, { indexed: true, name: "seller", type: "address" }, { indexed: false, name: "price", type: "uint256" }, { indexed: false, name: "isAuction", type: "bool" }, { indexed: false, name: "auctionEndTime", type: "uint256" }], name: "NFTListed", type: "event" },
  { anonymous: false, inputs: [{ indexed: true, name: "tokenId", type: "uint256" }, { indexed: true, name: "seller", type: "address" }], name: "NFTDelisted", type: "event" },
  { anonymous: false, inputs: [{ indexed: true, name: "tokenId", type: "uint256" }, { indexed: true, name: "seller", type: "address" }, { indexed: true, name: "buyer", type: "address" }, { indexed: false, name: "price", type: "uint256" }, { indexed: false, name: "platformFee", type: "uint256" }, { indexed: false, name: "royalty", type: "uint256" }], name: "NFTSold", type: "event" },
  { anonymous: false, inputs: [{ indexed: true, name: "tokenId", type: "uint256" }, { indexed: true, name: "bidder", type: "address" }, { indexed: false, name: "amount", type: "uint256" }, { indexed: false, name: "previousBidder", type: "address" }], name: "BidPlaced", type: "event" },
  { anonymous: false, inputs: [{ indexed: true, name: "tokenId", type: "uint256" }, { indexed: true, name: "winner", type: "address" }, { indexed: false, name: "amount", type: "uint256" }], name: "AuctionEnded", type: "event" },
  { anonymous: false, inputs: [{ indexed: true, name: "tokenId", type: "uint256" }, { indexed: true, name: "bidder", type: "address" }, { indexed: false, name: "amount", type: "uint256" }], name: "BidRefunded", type: "event" },
  { anonymous: false, inputs: [{ indexed: false, name: "oldFee", type: "uint256" }, { indexed: false, name: "newFee", type: "uint256" }], name: "MintingFeeUpdated", type: "event" },
  { anonymous: false, inputs: [{ indexed: false, name: "oldPercent", type: "uint256" }, { indexed: false, name: "newPercent", type: "uint256" }], name: "PlatformFeeUpdated", type: "event" },
  { anonymous: false, inputs: [{ indexed: false, name: "oldCollector", type: "address" }, { indexed: false, name: "newCollector", type: "address" }], name: "FeeCollectorUpdated", type: "event" },
  { anonymous: false, inputs: [{ indexed: false, name: "category", type: "string" }], name: "CategoryAdded", type: "event" },
  { anonymous: false, inputs: [{ indexed: true, name: "to", type: "address" }, { indexed: false, name: "amount", type: "uint256" }], name: "EmergencyWithdraw", type: "event" },
  { anonymous: false, inputs: [{ indexed: false, name: "account", type: "address" }], name: "Paused", type: "event" },
  { anonymous: false, inputs: [{ indexed: false, name: "account", type: "address" }], name: "Unpaused", type: "event" },
  
  // ERC721 Events
  { anonymous: false, inputs: [{ indexed: true, name: "from", type: "address" }, { indexed: true, name: "to", type: "address" }, { indexed: true, name: "tokenId", type: "uint256" }], name: "Transfer", type: "event" },
  { anonymous: false, inputs: [{ indexed: true, name: "owner", type: "address" }, { indexed: true, name: "approved", type: "address" }, { indexed: true, name: "tokenId", type: "uint256" }], name: "Approval", type: "event" },
  { anonymous: false, inputs: [{ indexed: true, name: "owner", type: "address" }, { indexed: true, name: "operator", type: "address" }, { indexed: false, name: "approved", type: "bool" }], name: "ApprovalForAll", type: "event" },
  
  // ============ Custom Errors ============
  
  { inputs: [], name: "ZeroAddress", type: "error" },
  { inputs: [{ name: "required", type: "uint256" }, { name: "available", type: "uint256" }], name: "InsufficientBalance", type: "error" },
  { inputs: [{ name: "required", type: "uint256" }, { name: "available", type: "uint256" }], name: "InsufficientAllowance", type: "error" },
  { inputs: [], name: "NotTokenOwner", type: "error" },
  { inputs: [], name: "NotListed", type: "error" },
  { inputs: [], name: "AlreadyListed", type: "error" },
  { inputs: [], name: "InvalidPrice", type: "error" },
  { inputs: [], name: "InvalidRoyalty", type: "error" },
  { inputs: [], name: "InvalidCategory", type: "error" },
  { inputs: [], name: "InvalidDuration", type: "error" },
  { inputs: [], name: "AuctionNotEnded", type: "error" },
  { inputs: [], name: "AuctionAlreadyEnded", type: "error" },
  { inputs: [{ name: "minRequired", type: "uint256" }, { name: "provided", type: "uint256" }], name: "BidTooLow", type: "error" },
  { inputs: [], name: "NotAuction", type: "error" },
  { inputs: [], name: "IsAuction", type: "error" },
  { inputs: [], name: "TransferFailed", type: "error" },
  { inputs: [], name: "FeeTooHigh", type: "error" },
  { inputs: [], name: "CategoryExists", type: "error" },
  { inputs: [], name: "CannotBidOnOwnNFT", type: "error" },
  { inputs: [], name: "CannotBuyOwnNFT", type: "error" },
] as const;

// NFT Categories for PM Token ecosystem
export const NFT_CATEGORIES = [
  "PM Digital Card",
  "PM Voucher Card", 
  "PM Gift Cards",
  "PM Partner Badge",
  "PM Discount Card",
  "PM VIP Exclusive Card",
] as const;

export type NFTCategory = typeof NFT_CATEGORIES[number];
