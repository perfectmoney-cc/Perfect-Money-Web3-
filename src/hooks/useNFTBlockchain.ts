import { useReadContract, useAccount } from 'wagmi';
import { PMNFTABI } from '@/contracts/nftABI';
import { getContractAddress } from '@/contracts/addresses';
import { formatEther } from 'viem';
import { useState, useEffect, useCallback, useMemo } from 'react';

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

export function useBlockchainStats() {
  const { data: stats } = useReadContract({
    address: PMNFT_ADDRESS,
    abi: PMNFTABI,
    functionName: 'getSt',
  });

  const { data: mintFee } = useReadContract({
    address: PMNFT_ADDRESS,
    abi: PMNFTABI,
    functionName: 'mFee',
  });

  const { data: platformFee } = useReadContract({
    address: PMNFT_ADDRESS,
    abi: PMNFTABI,
    functionName: 'pFee',
  });

  const { data: isPaused } = useReadContract({
    address: PMNFT_ADDRESS,
    abi: PMNFTABI,
    functionName: 'paused',
  });

  const { data: collector } = useReadContract({
    address: PMNFT_ADDRESS,
    abi: PMNFTABI,
    functionName: 'col',
  });

  const { data: owner } = useReadContract({
    address: PMNFT_ADDRESS,
    abi: PMNFTABI,
    functionName: 'owner',
  });

  const { data: categories } = useReadContract({
    address: PMNFT_ADDRESS,
    abi: PMNFTABI,
    functionName: 'getCats',
  });

  const parsedStats = useMemo(() => {
    if (!stats) return null;
    const s = stats as readonly [bigint, bigint, bigint, bigint];
    return {
      totalMinted: Number(s[0]),
      totalListings: Number(s[1]),
      totalSales: Number(s[2]),
      totalVolume: formatEther(s[3]),
    };
  }, [stats]);

  return {
    stats: parsedStats,
    mintFee: mintFee ? formatEther(mintFee as bigint) : '10000',
    platformFee: platformFee ? Number(platformFee) : 2,
    isPaused: (isPaused as boolean) ?? false,
    collector: (collector as string) ?? '',
    owner: (owner as string) ?? '',
    categories: (categories as string[]) ?? [],
    isLoading: !stats,
    refetch: () => {},
  };
}

export function useMarketplaceNFTs() {
  const { stats } = useBlockchainStats();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  return {
    allNFTs: [] as BlockchainNFT[],
    listedNFTs: [] as BlockchainNFT[],
    isLoading,
    refetch: () => setIsLoading(true),
  };
}

export function useNFTActivity(limit: number = 50) {
  const [activities, setActivities] = useState<NFTActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      const stored = localStorage.getItem('nftActivityHistory');
      if (stored) {
        try { setActivities(JSON.parse(stored).slice(0, limit)); } catch { setActivities([]); }
      }
      setIsLoading(false);
    }, 300);
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

  return { activities, isLoading, addActivity, refetch: () => setIsLoading(true) };
}

export function useUserBlockchainNFTs(address: `0x${string}` | undefined) {
  const { data: balance } = useReadContract({
    address: PMNFT_ADDRESS,
    abi: PMNFTABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  return {
    ownedNFTs: [] as BlockchainNFT[],
    balance: balance ? Number(balance) : 0,
    isLoading: false,
    refetch: () => {},
  };
}
