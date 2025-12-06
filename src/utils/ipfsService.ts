import { supabase } from "@/integrations/supabase/client";

export interface NFTMetadata {
  name: string;
  description: string;
  category: string;
  royalty: number;
  price: number;
  creator: string;
  attributes?: Array<{ trait_type: string; value: string }>;
}

export interface IPFSUploadResult {
  success: boolean;
  tokenUri?: string;
  imageUri?: string;
  gatewayUrl?: string;
  imageGatewayUrl?: string;
  cid?: string;
  error?: string;
}

/**
 * Upload NFT image and metadata to IPFS via NFT.Storage
 */
export async function uploadToIPFS(
  image: string | null,
  metadata: NFTMetadata
): Promise<IPFSUploadResult> {
  try {
    const { data, error } = await supabase.functions.invoke("upload-to-ipfs", {
      body: { image, metadata },
    });

    if (error) {
      throw new Error(error.message);
    }

    return data as IPFSUploadResult;
  } catch (error: any) {
    console.error("IPFS upload error:", error);
    return {
      success: false,
      error: error.message || "Failed to upload to IPFS",
    };
  }
}

/**
 * Convert IPFS URI to HTTP gateway URL
 */
export function ipfsToHttp(ipfsUri: string): string {
  if (!ipfsUri) return "";
  if (ipfsUri.startsWith("ipfs://")) {
    return `https://nftstorage.link/ipfs/${ipfsUri.replace("ipfs://", "")}`;
  }
  return ipfsUri;
}

/**
 * Convert HTTP gateway URL back to IPFS URI
 */
export function httpToIpfs(httpUrl: string): string {
  if (!httpUrl) return "";
  const match = httpUrl.match(/\/ipfs\/(.+)$/);
  if (match) {
    return `ipfs://${match[1]}`;
  }
  return httpUrl;
}