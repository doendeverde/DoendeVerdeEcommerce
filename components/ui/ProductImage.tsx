"use client";

import { CldImage } from "next-cloudinary";
import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ProductImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  priority?: boolean;
  sizes?: string;
}

/**
 * Componente de imagem de produto otimizado
 * 
 * - Se a URL for do Cloudinary, usa CldImage com otimizações automáticas
 * - Se for uma URL externa, usa next/image padrão
 * 
 * @example
 * <ProductImage src={product.image} alt={product.name} width={400} height={400} />
 */
export function ProductImage({
  src,
  alt,
  width = 400,
  height = 400,
  fill = false,
  className,
  priority = false,
  sizes,
}: ProductImageProps) {
  const [error, setError] = useState(false);

  // Verifica se é uma URL do Cloudinary
  const isCloudinaryUrl = src?.includes("res.cloudinary.com") || src?.includes("cloudinary");

  // Extrai o public_id do Cloudinary se for URL do Cloudinary
  const getCloudinaryPublicId = (url: string): string | null => {
    if (!url) return null;

    // Pattern: https://res.cloudinary.com/{cloud_name}/image/upload/{transformations}/{public_id}
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-zA-Z]+)?$/);
    if (match) {
      return match[1];
    }

    return null;
  };

  // Fallback image
  const fallbackSrc = "/placeholder-product.png";

  // Se houver erro ou não tiver src, mostra placeholder
  if (error || !src) {
    return (
      <div
        className={cn(
          "bg-gray-100 flex items-center justify-center text-gray-400",
          fill ? "absolute inset-0" : "",
          className
        )}
        style={fill ? undefined : { width, height }}
      >
        <svg
          className="w-12 h-12"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  // Se for do Cloudinary, usa CldImage com otimizações
  if (isCloudinaryUrl) {
    const publicId = getCloudinaryPublicId(src);

    if (publicId) {
      return (
        <CldImage
          src={publicId}
          alt={alt}
          width={fill ? undefined : width}
          height={fill ? undefined : height}
          fill={fill}
          className={className}
          priority={priority}
          sizes={sizes || (fill ? "100vw" : undefined)}
          crop="fill"
          gravity="auto"
          quality="auto"
          format="auto"
          onError={() => setError(true)}
        />
      );
    }
  }

  // URL externa - usa next/image padrão
  return (
    <Image
      src={src}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      fill={fill}
      className={className}
      priority={priority}
      sizes={sizes}
      onError={() => setError(true)}
    />
  );
}
