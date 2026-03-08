import React from "react";
import { useLazyImage } from "@/hooks/usePerformance";

interface OptimizedImageProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholder?: string;
  width?: number;
  height?: number;
}

/**
 * Optimized image component with lazy loading
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23f0f0f0" width="400" height="300"/%3E%3C/svg%3E',
  width,
  height,
  className,
  ...props
}) => {
  const { imageSrc, setImageRef } = useLazyImage(src, placeholder);

  return (
    <img
      ref={setImageRef}
      src={imageSrc}
      alt={alt}
      width={width}
      height={height}
      loading="lazy"
      decoding="async"
      className={className}
      {...props}
    />
  );
};

/**
 * Generate srcset for responsive images
 */
export function generateSrcSet(basePath: string, widths: number[]): string {
  return widths.map((width) => `${basePath}?w=${width} ${width}w`).join(", ");
}

/**
 * Preload critical images
 */
export function preloadImage(src: string): void {
  const link = document.createElement("link");
  link.rel = "preload";
  link.as = "image";
  link.href = src;
  document.head.appendChild(link);
}
