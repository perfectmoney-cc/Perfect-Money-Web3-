import { useState } from "react";
import { Package, ImageOff } from "lucide-react";
import { ipfsToHttp } from "@/utils/ipfsService";

interface NFTImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackClassName?: string;
}

export function NFTImage({ src, alt, className = "w-full h-full object-cover", fallbackClassName = "h-16 w-16 text-muted-foreground" }: NFTImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Convert IPFS URI to HTTP gateway URL
  const imageUrl = src ? ipfsToHttp(src) : null;

  if (!imageUrl || hasError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted/30">
        {hasError ? (
          <ImageOff className={fallbackClassName} />
        ) : (
          <Package className={fallbackClassName} />
        )}
      </div>
    );
  }

  return (
    <>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/30 animate-pulse">
          <Package className={fallbackClassName} />
        </div>
      )}
      <img
        src={imageUrl}
        alt={alt}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
      />
    </>
  );
}
