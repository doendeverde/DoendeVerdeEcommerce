/**
 * ProductImageGallery Component
 *
 * Galeria de imagens do produto com miniaturas.
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';

interface ProductImage {
  id: string;
  url: string;
  altText: string | null;
  isPrimary: boolean;
  displayOrder: number;
}

interface ProductImageGalleryProps {
  images: ProductImage[];
  productName: string;
}

export function ProductImageGallery({ images, productName }: ProductImageGalleryProps) {
  const sortedImages = [...images].sort((a, b) => a.displayOrder - b.displayOrder);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectedImage = sortedImages[selectedIndex] || sortedImages[0];

  if (!selectedImage) {
    return (
      <div className="aspect-square rounded-xl bg-gray-bg flex items-center justify-center">
        <span className="text-gray-400">Sem imagem</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative aspect-square overflow-hidden rounded-xl bg-gray-bg">
        <Image
          src={selectedImage.url}
          alt={selectedImage.altText || productName}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
      </div>

      {/* Thumbnails */}
      {sortedImages.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {sortedImages.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setSelectedIndex(index)}
              className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg transition-all ${index === selectedIndex
                ? 'ring-2 ring-primary-green ring-offset-2'
                : 'opacity-70 hover:opacity-100'
                }`}
            >
              <Image
                src={image.url}
                alt={image.altText || `${productName} - Imagem ${index + 1}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
