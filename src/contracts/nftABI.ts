// PMNFT Contract ABI
export const PMNFTABI = [
  // Read functions
  { inputs: [], name: "name", outputs: [{ type: "string" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "symbol", outputs: [{ type: "string" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "pmToken", outputs: [{ type: "address" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "mintingFee", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "listingFee", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "platformFeePercent", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "feeCollector", outputs: [{ type: "address" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "owner", outputs: [{ type: "address" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "totalSupply", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "tokenId", type: "uint256" }], name: "ownerOf", outputs: [{ type: "address" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "owner", type: "address" }], name: "balanceOf", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "tokenId", type: "uint256" }], name: "tokenURI", outputs: [{ type: "string" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "owner", type: "address" }, { name: "index", type: "uint256" }], name: "tokenOfOwnerByIndex", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "index", type: "uint256" }], name: "tokenByIndex", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "getTotalMinted", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  
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
  
  // Write functions
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
  
  // ERC721 standard functions
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
  
  // Admin functions
  { inputs: [{ name: "_fee", type: "uint256" }], name: "setMintingFee", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "_percent", type: "uint256" }], name: "setPlatformFee", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "_collector", type: "address" }], name: "setFeeCollector", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "_amount", type: "uint256" }], name: "withdrawTokens", outputs: [], stateMutability: "nonpayable", type: "function" },
  
  // Events
  { anonymous: false, inputs: [{ indexed: true, name: "tokenId", type: "uint256" }, { indexed: true, name: "creator", type: "address" }, { indexed: false, name: "name", type: "string" }, { indexed: false, name: "category", type: "string" }], name: "NFTMinted", type: "event" },
  { anonymous: false, inputs: [{ indexed: true, name: "tokenId", type: "uint256" }, { indexed: true, name: "seller", type: "address" }, { indexed: false, name: "price", type: "uint256" }, { indexed: false, name: "isAuction", type: "bool" }, { indexed: false, name: "auctionEndTime", type: "uint256" }], name: "NFTListed", type: "event" },
  { anonymous: false, inputs: [{ indexed: true, name: "tokenId", type: "uint256" }, { indexed: true, name: "seller", type: "address" }], name: "NFTDelisted", type: "event" },
  { anonymous: false, inputs: [{ indexed: true, name: "tokenId", type: "uint256" }, { indexed: true, name: "seller", type: "address" }, { indexed: true, name: "buyer", type: "address" }, { indexed: false, name: "price", type: "uint256" }], name: "NFTSold", type: "event" },
  { anonymous: false, inputs: [{ indexed: true, name: "tokenId", type: "uint256" }, { indexed: true, name: "bidder", type: "address" }, { indexed: false, name: "amount", type: "uint256" }], name: "BidPlaced", type: "event" },
  { anonymous: false, inputs: [{ indexed: true, name: "tokenId", type: "uint256" }, { indexed: true, name: "winner", type: "address" }, { indexed: false, name: "amount", type: "uint256" }], name: "AuctionEnded", type: "event" },
  { anonymous: false, inputs: [{ indexed: false, name: "newFee", type: "uint256" }], name: "MintingFeeUpdated", type: "event" },
  { anonymous: false, inputs: [{ indexed: false, name: "newPercent", type: "uint256" }], name: "PlatformFeeUpdated", type: "event" },
  
  // ERC721 Events
  { anonymous: false, inputs: [{ indexed: true, name: "from", type: "address" }, { indexed: true, name: "to", type: "address" }, { indexed: true, name: "tokenId", type: "uint256" }], name: "Transfer", type: "event" },
  { anonymous: false, inputs: [{ indexed: true, name: "owner", type: "address" }, { indexed: true, name: "approved", type: "address" }, { indexed: true, name: "tokenId", type: "uint256" }], name: "Approval", type: "event" },
  { anonymous: false, inputs: [{ indexed: true, name: "owner", type: "address" }, { indexed: true, name: "operator", type: "address" }, { indexed: false, name: "approved", type: "bool" }], name: "ApprovalForAll", type: "event" },
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
