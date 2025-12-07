import { useReadContract, useAccount, usePublicClient } from 'wagmi';
import { PMNFTABI } from '@/contracts/nftABI';
import { getContractAddress } from '@/contracts/addresses';
import { formatEther } from 'viem';
import { useState, useEffect, useCallback } from 'react';

const PMNFT_ADDRESS = getContractAddress(56, 'PMNFT') as `0x${string}`;

export interface BlockchainNFT {
  id: number;
  name: string;
  description: string;
  category: string;
  royalty: number;
  creator: string;
  mintedAt: number;
  tokenURI: string;
  owner: string;
  listing: {
    seller: string;
    price: string;
    isAuction: boolean;
    endTime: number;
    highestBidder: string;
    highestBid: string;
    isActive: boolean;
  } | null;
}

export interface NFTActivity {
  id: string;
  type: 'mint' | 'list' | 'delist' | 'sale' | 'bid' | 'auction_end' | 'transfer';
  tokenId: number;
  from: string;
  to?: string;
  price?: string;
  timestamp: number;
  txHash: string;
  blockNumber: number;
}

// Hook for fetching marketplace stats from blockchain
export function useBlockchainStats() {
  const { data: stats, isLoading, refetch } = useReadContract({
    address: PMNFT_ADDRESS,
    abi: PMNFTABI,
    functionName: 'getStats',
  });

  const { data: mintFee } = useReadContract({
    address: PMNFT_ADDRESS,
    abi: PMNFTABI,
    functionName: 'mintFee',
  });

  const { data: platformFee } = useReadContract({
    address: PMNFT_ADDRESS,
    abi: PMNFTABI,
    functionName: 'platformFee',
  });

  const { data: isPaused } = useReadContract({
    address: PMNFT_ADDRESS,
    abi: PMNFTABI,
    functionName: 'paused',
  });

  const { data: collector } = useReadContract({
    address: PMNFT_ADDRESS,
    abi: PMNFTABI,
    functionName: 'collector',
  });

  const { data: owner } = useReadContract({
    address: PMNFT_ADDRESS,
    abi: PMNFTABI,
    functionName: 'owner',
  });

  const { data: categories } = useReadContract({
    address: PMNFT_ADDRESS,
    abi: PMNFTABI,
    functionName: 'getCategories',
  });

  return {
    stats: stats ? {
      totalMinted: Number((stats as any).minted || 0),
      totalListings: Number((stats as any).listings || 0),
      totalSales: Number((stats as any).sales || 0),
      totalVolume: formatEther((stats as any).volume || 0n),
    } : null,
    mintFee: mintFee ? formatEther(mintFee as bigint) : '10000',
    platformFee: platformFee ? Number(platformFee) : 2,
    isPaused: isPaused as boolean,
    collector: collector as string,
    owner: owner as string,
    categories: categories as string[] || [],
    isLoading,
    refetch,
  };
}

// Hook for fetching NFT activity (simplified - uses mock data when contract not deployed)
export function useNFTActivity(limit: number = 50) {
  const [activities, setActivities] = useState<NFTActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load from localStorage as fallback when contract not deployed
    const timer = setTimeout(() => {
      const stored = localStorage.getItem('nftActivityHistory');
      if (stored) {
        try {
          setActivities(JSON.parse(stored).slice(0, limit));
        } catch {
          setActivities([]);
        }
      }
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [limit]);

  const addActivity = useCallback((activity: Omit<NFTActivity, 'id' | 'timestamp' | 'blockNumber'>) => {
    const newActivity: NFTActivity = {
      ...activity,
      id: `${activity.type}-${Date.now()}`,
      timestamp: Math.floor(Date.now() / 1000),
      blockNumber: 0,
    };
    setActivities(prev => {
      const updated = [newActivity, ...prev].slice(0, limit);
      localStorage.setItem('nftActivityHistory', JSON.stringify(updated));
      return updated;
    });
  }, [limit]);

  return {
    activities,
    isLoading,
    addActivity,
    refetch: () => setIsLoading(true),
  };
}

// Hook for user's NFTs
export function useUserBlockchainNFTs(address: `0x${string}` | undefined) {
  const [ownedNFTs, setOwnedNFTs] = useState<BlockchainNFT[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { data: balance } = useReadContract({
    address: PMNFT_ADDRESS,
    abi: PMNFTABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  useEffect(() => {
    // Load from localStorage as fallback
    if (address) {
      const stored = localStorage.getItem(`userNFTs_${address}`);
      if (stored) {
        try {
          setOwnedNFTs(JSON.parse(stored));
        } catch {
          setOwnedNFTs([]);
        }
      }
    }
  }, [address]);

  return {
    ownedNFTs,
    balance: balance ? Number(balance) : 0,
    isLoading,
    refetch: () => {},
  };
}
