import { useReadContract, useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { PMNFTABI } from '@/contracts/nftABI';
import { PMTokenABI } from '@/contracts/abis';
import { getContractAddress, PM_TOKEN_ADDRESS } from '@/contracts/addresses';
import { parseEther, formatEther, maxUint256 } from 'viem';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

const PMTOKEN_ADDRESS = PM_TOKEN_ADDRESS as `0x${string}`;

const PMNFT_ADDRESS = getContractAddress(56, 'PMNFT') as `0x${string}`;

export interface NFTMetadata {
  name: string;
  description: string;
  category: string;
  royaltyPercent: bigint;
  creator: `0x${string}`;
  mintedAt: bigint;
}

export interface NFTListing {
  seller: `0x${string}`;
  price: bigint;
  isAuction: boolean;
  auctionEndTime: bigint;
  highestBidder: `0x${string}`;
  highestBid: bigint;
  isActive: boolean;
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

  const { data: mintingFee, isLoading: mintingFeeLoading } = useReadContract({
    address: PMNFT_ADDRESS,
    abi: PMNFTABI,
    functionName: 'mintingFee',
  });

  const { data: platformFeePercent, isLoading: platformFeeLoading } = useReadContract({
    address: PMNFT_ADDRESS,
    abi: PMNFTABI,
    functionName: 'platformFeePercent',
  });

  return {
    totalMinted: totalMinted ? Number(totalMinted) : 0,
    totalSupply: totalSupply ? Number(totalSupply) : 0,
    mintingFee: mintingFee ? formatEther(mintingFee as bigint) : '10000',
    platformFeePercent: platformFeePercent ? Number(platformFeePercent) : 2,
    isLoading: totalMintedLoading || totalSupplyLoading || mintingFeeLoading || platformFeeLoading,
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
      const count = Number(balance);
      // For now, we track via events/localStorage hybrid approach
      // Full on-chain tracking would require iterating tokenOfOwnerByIndex
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

  const { data: mintingFee } = useReadContract({
    address: PMNFT_ADDRESS,
    abi: PMNFTABI,
    functionName: 'mintingFee',
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
      const fee = mintingFee as bigint || parseEther('10000');
      
      // Check if approval is needed
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
      // Always approve first to ensure sufficient allowance
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
      
      // First approve the tokens
      toast.info('Step 1/2: Approving PM tokens for purchase...');
      await writeContractAsync({
        address: PMTOKEN_ADDRESS,
        abi: PMTokenABI,
        functionName: 'approve',
        args: [PMNFT_ADDRESS, price],
      } as any);

      // Then buy the NFT
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
      
      // First approve the tokens for the bid
      toast.info('Step 1/2: Approving PM tokens for bid...');
      await writeContractAsync({
        address: PMTOKEN_ADDRESS,
        abi: PMTokenABI,
        functionName: 'approve',
        args: [PMNFT_ADDRESS, amount],
      } as any);

      // Then place the bid
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
    mintingFee: mintingFee as bigint | undefined,
  };
}
