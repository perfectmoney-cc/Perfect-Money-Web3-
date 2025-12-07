// PMNFT Contract ABI - Optimized for size
export const PMNFTABI = [
  // Read Functions
  { inputs: [], name: "name", outputs: [{ type: "string" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "symbol", outputs: [{ type: "string" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "pmToken", outputs: [{ type: "address" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "mintFee", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "platformFee", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "collector", outputs: [{ type: "address" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "owner", outputs: [{ type: "address" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "totalSupply", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "paused", outputs: [{ type: "bool" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "MAX_ROYALTY", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "MAX_FEE", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "MIN_AUCTION", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "MAX_AUCTION", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  
  // Token queries
  { inputs: [{ name: "tokenId", type: "uint256" }], name: "ownerOf", outputs: [{ type: "address" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "owner", type: "address" }], name: "balanceOf", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "tokenId", type: "uint256" }], name: "tokenURI", outputs: [{ type: "string" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "owner", type: "address" }, { name: "index", type: "uint256" }], name: "tokenOfOwnerByIndex", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "index", type: "uint256" }], name: "tokenByIndex", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "getTotalMinted", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "getCategories", outputs: [{ type: "string[]" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "category", type: "string" }], name: "validCategory", outputs: [{ type: "bool" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "minter", type: "address" }], name: "getMinted", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "minter", type: "address" }], name: "minted", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "tokenId", type: "uint256" }], name: "auctionEnded", outputs: [{ type: "bool" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "tokenId", type: "uint256" }], name: "timeLeft", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  
  // Stats
  { 
    inputs: [], 
    name: "getStats", 
    outputs: [{ 
      components: [
        { name: "minted", type: "uint256" },
        { name: "listings", type: "uint256" },
        { name: "sales", type: "uint256" },
        { name: "volume", type: "uint256" }
      ],
      type: "tuple"
    }], 
    stateMutability: "view", 
    type: "function" 
  },
  
  // Listing
  { 
    inputs: [{ name: "tokenId", type: "uint256" }], 
    name: "getListing", 
    outputs: [{ 
      components: [
        { name: "seller", type: "address" },
        { name: "price", type: "uint256" },
        { name: "auction", type: "bool" },
        { name: "endTime", type: "uint256" },
        { name: "bidder", type: "address" },
        { name: "bid", type: "uint256" },
        { name: "active", type: "bool" }
      ],
      type: "tuple"
    }], 
    stateMutability: "view", 
    type: "function" 
  },
  
  // Metadata
  { 
    inputs: [{ name: "tokenId", type: "uint256" }], 
    name: "getMetadata", 
    outputs: [{ 
      components: [
        { name: "name", type: "string" },
        { name: "desc", type: "string" },
        { name: "category", type: "string" },
        { name: "royalty", type: "uint256" },
        { name: "creator", type: "address" },
        { name: "time", type: "uint256" }
      ],
      type: "tuple"
    }], 
    stateMutability: "view", 
    type: "function" 
  },
  
  // Direct mappings
  { 
    inputs: [{ name: "tokenId", type: "uint256" }], 
    name: "listings", 
    outputs: [
      { name: "seller", type: "address" },
      { name: "price", type: "uint256" },
      { name: "auction", type: "bool" },
      { name: "endTime", type: "uint256" },
      { name: "bidder", type: "address" },
      { name: "bid", type: "uint256" },
      { name: "active", type: "bool" }
    ], 
    stateMutability: "view", 
    type: "function" 
  },
  
  { 
    inputs: [{ name: "tokenId", type: "uint256" }], 
    name: "meta", 
    outputs: [
      { name: "name", type: "string" },
      { name: "desc", type: "string" },
      { name: "category", type: "string" },
      { name: "royalty", type: "uint256" },
      { name: "creator", type: "address" },
      { name: "time", type: "uint256" }
    ], 
    stateMutability: "view", 
    type: "function" 
  },
  
  // Write Functions
  { 
    inputs: [
      { name: "uri", type: "string" },
      { name: "name", type: "string" },
      { name: "desc", type: "string" },
      { name: "cat", type: "string" },
      { name: "royalty", type: "uint256" }
    ], 
    name: "mint", 
    outputs: [{ type: "uint256" }], 
    stateMutability: "nonpayable", 
    type: "function" 
  },
  
  { inputs: [{ name: "id", type: "uint256" }, { name: "price", type: "uint256" }], name: "listForSale", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "id", type: "uint256" }, { name: "startPrice", type: "uint256" }, { name: "dur", type: "uint256" }], name: "listForAuction", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "id", type: "uint256" }], name: "delist", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "id", type: "uint256" }], name: "buy", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "id", type: "uint256" }, { name: "amt", type: "uint256" }], name: "placeBid", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "id", type: "uint256" }], name: "endAuction", outputs: [], stateMutability: "nonpayable", type: "function" },
  
  // ERC721 Standard
  { inputs: [{ name: "to", type: "address" }, { name: "tokenId", type: "uint256" }], name: "approve", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "from", type: "address" }, { name: "to", type: "address" }, { name: "tokenId", type: "uint256" }], name: "transferFrom", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "from", type: "address" }, { name: "to", type: "address" }, { name: "tokenId", type: "uint256" }], name: "safeTransferFrom", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "from", type: "address" }, { name: "to", type: "address" }, { name: "tokenId", type: "uint256" }, { name: "data", type: "bytes" }], name: "safeTransferFrom", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "operator", type: "address" }, { name: "approved", type: "bool" }], name: "setApprovalForAll", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "tokenId", type: "uint256" }], name: "getApproved", outputs: [{ type: "address" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "owner", type: "address" }, { name: "operator", type: "address" }], name: "isApprovedForAll", outputs: [{ type: "bool" }], stateMutability: "view", type: "function" },
  
  // Admin Functions
  { inputs: [{ name: "f", type: "uint256" }], name: "setMintFee", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "p", type: "uint256" }], name: "setPlatformFee", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "c", type: "address" }], name: "setCollector", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "a", type: "uint256" }], name: "withdraw", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "c", type: "string" }], name: "addCategory", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [], name: "pause", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [], name: "unpause", outputs: [], stateMutability: "nonpayable", type: "function" },
  
  // Events
  { anonymous: false, inputs: [{ indexed: true, name: "id", type: "uint256" }, { indexed: true, name: "creator", type: "address" }, { indexed: false, name: "name", type: "string" }, { indexed: false, name: "cat", type: "string" }, { indexed: false, name: "royalty", type: "uint256" }], name: "Mint", type: "event" },
  { anonymous: false, inputs: [{ indexed: true, name: "id", type: "uint256" }, { indexed: true, name: "seller", type: "address" }, { indexed: false, name: "price", type: "uint256" }, { indexed: false, name: "auction", type: "bool" }, { indexed: false, name: "end", type: "uint256" }], name: "List", type: "event" },
  { anonymous: false, inputs: [{ indexed: true, name: "id", type: "uint256" }, { indexed: true, name: "seller", type: "address" }], name: "Delist", type: "event" },
  { anonymous: false, inputs: [{ indexed: true, name: "id", type: "uint256" }, { indexed: true, name: "seller", type: "address" }, { indexed: true, name: "buyer", type: "address" }, { indexed: false, name: "price", type: "uint256" }, { indexed: false, name: "fee", type: "uint256" }, { indexed: false, name: "royalty", type: "uint256" }], name: "Sale", type: "event" },
  { anonymous: false, inputs: [{ indexed: true, name: "id", type: "uint256" }, { indexed: true, name: "bidder", type: "address" }, { indexed: false, name: "amt", type: "uint256" }, { indexed: false, name: "prev", type: "address" }], name: "Bid", type: "event" },
  { anonymous: false, inputs: [{ indexed: true, name: "id", type: "uint256" }, { indexed: true, name: "winner", type: "address" }, { indexed: false, name: "amt", type: "uint256" }], name: "AuctionEnd", type: "event" },
  { anonymous: false, inputs: [{ indexed: true, name: "id", type: "uint256" }, { indexed: true, name: "bidder", type: "address" }, { indexed: false, name: "amt", type: "uint256" }], name: "Refund", type: "event" },
  { anonymous: false, inputs: [{ indexed: false, name: "old", type: "uint256" }, { indexed: false, name: "next", type: "uint256" }], name: "FeeUpdate", type: "event" },
  { anonymous: false, inputs: [{ indexed: false, name: "old", type: "uint256" }, { indexed: false, name: "next", type: "uint256" }], name: "PlatformFeeUpdate", type: "event" },
  { anonymous: false, inputs: [{ indexed: false, name: "old", type: "address" }, { indexed: false, name: "next", type: "address" }], name: "CollectorUpdate", type: "event" },
  { anonymous: false, inputs: [{ indexed: false, name: "cat", type: "string" }], name: "CategoryAdd", type: "event" },
  { anonymous: false, inputs: [{ indexed: true, name: "to", type: "address" }, { indexed: false, name: "amt", type: "uint256" }], name: "Withdraw", type: "event" },
  { anonymous: false, inputs: [{ indexed: false, name: "account", type: "address" }], name: "Paused", type: "event" },
  { anonymous: false, inputs: [{ indexed: false, name: "account", type: "address" }], name: "Unpaused", type: "event" },
  { anonymous: false, inputs: [{ indexed: true, name: "from", type: "address" }, { indexed: true, name: "to", type: "address" }, { indexed: true, name: "tokenId", type: "uint256" }], name: "Transfer", type: "event" },
  { anonymous: false, inputs: [{ indexed: true, name: "owner", type: "address" }, { indexed: true, name: "approved", type: "address" }, { indexed: true, name: "tokenId", type: "uint256" }], name: "Approval", type: "event" },
  { anonymous: false, inputs: [{ indexed: true, name: "owner", type: "address" }, { indexed: true, name: "operator", type: "address" }, { indexed: false, name: "approved", type: "bool" }], name: "ApprovalForAll", type: "event" },
  
  // Errors
  { inputs: [], name: "Zero", type: "error" },
  { inputs: [{ name: "need", type: "uint256" }, { name: "have", type: "uint256" }], name: "LowBal", type: "error" },
  { inputs: [{ name: "need", type: "uint256" }, { name: "have", type: "uint256" }], name: "LowAllow", type: "error" },
  { inputs: [], name: "NotOwner", type: "error" },
  { inputs: [], name: "NotListed", type: "error" },
  { inputs: [], name: "Listed", type: "error" },
  { inputs: [], name: "BadPrice", type: "error" },
  { inputs: [], name: "BadRoyalty", type: "error" },
  { inputs: [], name: "BadCategory", type: "error" },
  { inputs: [], name: "BadDuration", type: "error" },
  { inputs: [], name: "NotEnded", type: "error" },
  { inputs: [], name: "Ended", type: "error" },
  { inputs: [{ name: "min", type: "uint256" }, { name: "got", type: "uint256" }], name: "LowBid", type: "error" },
  { inputs: [], name: "NotAuction", type: "error" },
  { inputs: [], name: "IsAuction", type: "error" },
  { inputs: [], name: "Failed", type: "error" },
  { inputs: [], name: "HighFee", type: "error" },
  { inputs: [], name: "CatExists", type: "error" },
  { inputs: [], name: "SelfBid", type: "error" },
  { inputs: [], name: "SelfBuy", type: "error" },
] as const;

// NFT Categories
export const NFT_CATEGORIES = [
  "PM Digital Card",
  "PM Voucher Card", 
  "PM Gift Cards",
  "PM Partner Badge",
  "PM Discount Card",
  "PM VIP Exclusive Card",
] as const;

export type NFTCategory = typeof NFT_CATEGORIES[number];
