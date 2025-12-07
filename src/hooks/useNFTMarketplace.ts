import { useReadContract, useAccount, useWriteContract } from 'wagmi';
import { PMNFTABI } from '@/contracts/nftABI';
import { PMTokenABI } from '@/contracts/abis';
import { getContractAddress, PM_TOKEN_ADDRESS } from '@/contracts/addresses';
import { parseEther, formatEther, maxUint256 } from 'viem';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

const PMTOKEN_ADDRESS = PM_TOKEN_ADDRESS as `0x${string}`;
const PMNFT_ADDRESS = getContractAddress(56, 'PMNFT') as `0x${string}`;

// Updated interfaces to match optimized contract
export interface NFTMetadata {
  name: string;
  desc: string;
  category: string;
  royalty: bigint;
  creator: `0x${string}`;
  time: bigint;
}

export interface NFTListing {
  seller: `0x${string}`;
  price: bigint;
  auction: boolean;
  endTime: bigint;
  bidder: `0x${string}`;
  bid: bigint;
  active: boolean;
}

export function useNFTStats() {
  const { data: totalMinted, isLoading: totalMintedLoading } = useReadContract({
    address: PMNFT_ADDRESS,
    abi: PMNFTABI,
    functionName: 'getTotalMinted',
  });

  const { data: totalSupply, isLoading: totalSupplyLoading } = useReadContract({
    address: PMNFT_ADDRESS,
    abi: PMNFTABI,
    functionName: 'totalSupply',
  });

  const { data: mintFee, isLoading: mintFeeLoading } = useReadContract({
    address: PMNFT_ADDRESS,
    abi: PMNFTABI,
    functionName: 'mintFee',
  });

  const { data: platformFee, isLoading: platformFeeLoading } = useReadContract({
    address: PMNFT_ADDRESS,
    abi: PMNFTABI,
    functionName: 'platformFee',
  });

  return {
    totalMinted: totalMinted ? Number(totalMinted) : 0,
    totalSupply: totalSupply ? Number(totalSupply) : 0,
    mintingFee: mintFee ? formatEther(mintFee as bigint) : '10000',
    platformFeePercent: platformFee ? Number(platformFee) : 2,
    isLoading: totalMintedLoading || totalSupplyLoading || mintFeeLoading || platformFeeLoading,
  };
}

export function useNFTMetadata(tokenId: number) {
  const { data, isLoading } = useReadContract({
    address: PMNFT_ADDRESS,
    abi: PMNFTABI,
    functionName: 'getMetadata',
    args: [BigInt(tokenId)],
  });

  return {
    metadata: data as NFTMetadata | undefined,
    isLoading,
  };
}

export function useNFTListing(tokenId: number) {
  const { data, isLoading } = useReadContract({
    address: PMNFT_ADDRESS,
    abi: PMNFTABI,
    functionName: 'getListing',
    args: [BigInt(tokenId)],
  });

  return {
    listing: data as NFTListing | undefined,
    isLoading,
  };
}

export function useUserNFTs(address: `0x${string}` | undefined) {
  const { data: balance } = useReadContract({
    address: PMNFT_ADDRESS,
    abi: PMNFTABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  const [ownedTokenIds, setOwnedTokenIds] = useState<number[]>([]);

  useEffect(() => {
    if (balance && address) {
      setOwnedTokenIds([]);
    }
  }, [balance, address]);

  return {
    nftCount: balance ? Number(balance) : 0,
    ownedTokenIds,
  };
}

export function useTokenApproval() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: PMTOKEN_ADDRESS,
    abi: PMTokenABI,
    functionName: 'allowance',
    args: address ? [address, PMNFT_ADDRESS] : undefined,
  });

  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: PMTOKEN_ADDRESS,
    abi: PMTokenABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  const checkAllowance = (requiredAmount: bigint): boolean => {
    if (!allowance) return false;
    return (allowance as bigint) >= requiredAmount;
  };

  const approvePMToken = async (amount: bigint) => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }
    
    try {
      toast.info('Approving PM tokens...');
      const hash = await writeContractAsync({
        address: PMTOKEN_ADDRESS,
        abi: PMTokenABI,
        functionName: 'approve',
        args: [PMNFT_ADDRESS, amount],
      } as any);
      toast.success('PM tokens approved!');
      await refetchAllowance();
      return hash;
    } catch (error: any) {
      toast.error(error?.message || 'Approval failed');
      throw error;
    }
  };

  const approveMaxPMToken = async () => {
    return approvePMToken(maxUint256);
  };

  return {
    allowance: allowance as bigint | undefined,
    balance: balance as bigint | undefined,
    checkAllowance,
    approvePMToken,
    approveMaxPMToken,
    refetchAllowance,
    refetchBalance,
  };
}

export function useNFTMarketplace() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { approvePMToken, checkAllowance, refetchAllowance } = useTokenApproval();

  const { data: mintFee } = useReadContract({
    address: PMNFT_ADDRESS,
    abi: PMNFTABI,
    functionName: 'mintFee',
  });

  const mintNFT = async (
    tokenURI: string,
    name: string,
    description: string,
    category: string,
    royaltyPercent: number
  ) => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }
    
    try {
      const fee = mintFee as bigint || parseEther('10000');
      
      if (!checkAllowance(fee)) {
        toast.info('Step 1/2: Approving PM tokens for minting fee...');
        await approvePMToken(fee);
        await refetchAllowance();
      }

      toast.info('Step 2/2: Minting NFT...');
      const hash = await writeContractAsync({
        address: PMNFT_ADDRESS,
        abi: PMNFTABI,
        functionName: 'mint',
        args: [tokenURI, name, description, category, BigInt(royaltyPercent)],
      } as any);
      toast.success('NFT minted successfully!');
      return hash;
    } catch (error: any) {
      toast.error(error?.message || 'Minting failed');
      throw error;
    }
  };

  const buyNFT = async (tokenId: number, price: bigint) => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }
    
    try {
      if (!checkAllowance(price)) {
        toast.info('Step 1/2: Approving PM tokens for purchase...');
        await approvePMToken(price);
        await refetchAllowance();
      }

      toast.info('Step 2/2: Completing purchase...');
      const hash = await writeContractAsync({
        address: PMNFT_ADDRESS,
        abi: PMNFTABI,
        functionName: 'buy',
        args: [BigInt(tokenId)],
      } as any);
      toast.success('NFT purchased successfully!');
      return hash;
    } catch (error: any) {
      toast.error(error?.message || 'Purchase failed');
      throw error;
    }
  };

  const buyNFTWithApproval = async (tokenId: number, priceInPM: string) => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }
    
    try {
      const price = parseEther(priceInPM);
      
      toast.info('Step 1/2: Approving PM tokens for purchase...');
      await writeContractAsync({
        address: PMTOKEN_ADDRESS,
        abi: PMTokenABI,
        functionName: 'approve',
        args: [PMNFT_ADDRESS, price],
      } as any);

      toast.info('Step 2/2: Completing purchase...');
      const hash = await writeContractAsync({
        address: PMNFT_ADDRESS,
        abi: PMNFTABI,
        functionName: 'buy',
        args: [BigInt(tokenId)],
      } as any);
      toast.success('NFT purchased successfully!');
      return hash;
    } catch (error: any) {
      toast.error(error?.message || 'Purchase failed');
      throw error;
    }
  };

  const placeBidWithApproval = async (tokenId: number, bidAmount: string) => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }
    
    try {
      const amount = parseEther(bidAmount);
      
      toast.info('Step 1/2: Approving PM tokens for bid...');
      await writeContractAsync({
        address: PMTOKEN_ADDRESS,
        abi: PMTokenABI,
        functionName: 'approve',
        args: [PMNFT_ADDRESS, amount],
      } as any);

      toast.info('Step 2/2: Placing bid...');
      const hash = await writeContractAsync({
        address: PMNFT_ADDRESS,
        abi: PMNFTABI,
        functionName: 'placeBid',
        args: [BigInt(tokenId), amount],
      } as any);
      toast.success('Bid placed successfully!');
      return hash;
    } catch (error: any) {
      toast.error(error?.message || 'Bid failed');
      throw error;
    }
  };

  const listForSale = async (tokenId: number, price: string) => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }
    
    try {
      const hash = await writeContractAsync({
        address: PMNFT_ADDRESS,
        abi: PMNFTABI,
        functionName: 'listForSale',
        args: [BigInt(tokenId), parseEther(price)],
      } as any);
      toast.success('NFT listed for sale!');
      return hash;
    } catch (error: any) {
      toast.error(error?.message || 'Listing failed');
      throw error;
    }
  };

  const listForAuction = async (tokenId: number, startingPrice: string, durationSeconds: number) => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }
    
    try {
      const hash = await writeContractAsync({
        address: PMNFT_ADDRESS,
        abi: PMNFTABI,
        functionName: 'listForAuction',
        args: [BigInt(tokenId), parseEther(startingPrice), BigInt(durationSeconds)],
      } as any);
      toast.success('NFT listed for auction!');
      return hash;
    } catch (error: any) {
      toast.error(error?.message || 'Auction listing failed');
      throw error;
    }
  };

  const placeBid = async (tokenId: number, amount: string) => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }
    
    try {
      const hash = await writeContractAsync({
        address: PMNFT_ADDRESS,
        abi: PMNFTABI,
        functionName: 'placeBid',
        args: [BigInt(tokenId), parseEther(amount)],
      } as any);
      toast.success('Bid placed successfully!');
      return hash;
    } catch (error: any) {
      toast.error(error?.message || 'Bid failed');
      throw error;
    }
  };

  const delistNFT = async (tokenId: number) => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }
    
    try {
      const hash = await writeContractAsync({
        address: PMNFT_ADDRESS,
        abi: PMNFTABI,
        functionName: 'delist',
        args: [BigInt(tokenId)],
      } as any);
      toast.success('NFT delisted!');
      return hash;
    } catch (error: any) {
      toast.error(error?.message || 'Delisting failed');
      throw error;
    }
  };

  const endAuction = async (tokenId: number) => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }
    
    try {
      const hash = await writeContractAsync({
        address: PMNFT_ADDRESS,
        abi: PMNFTABI,
        functionName: 'endAuction',
        args: [BigInt(tokenId)],
      } as any);
      toast.success('Auction ended!');
      return hash;
    } catch (error: any) {
      toast.error(error?.message || 'Failed to end auction');
      throw error;
    }
  };

  return {
    mintNFT,
    buyNFT,
    buyNFTWithApproval,
    placeBidWithApproval,
    listForSale,
    listForAuction,
    placeBid,
    delistNFT,
    endAuction,
    mintingFee: mintFee as bigint | undefined,
  };
}
