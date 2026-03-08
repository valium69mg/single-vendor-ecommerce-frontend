import { useState } from "react";

interface ImageWithFallbackProps {
  src: string;
  alt?: string;
  className?: string;
  fallback?: string;
}

export default function ImageWithFallback({
  src,
  alt = "",
  className,
  fallback = "/images/landscape-placeholder.svg",
}: ImageWithFallbackProps) {
  const [imgSrc, setImgSrc] = useState(src);

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      onError={() => setImgSrc(fallback)}
    />
  );
}