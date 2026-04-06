import { Images } from "lucide-react";
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

  if (imgSrc === null) {
    return;
  }

  return imgSrc ? (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      onError={() => setImgSrc(fallback)}
    />
  ) : (
    <img src={fallback} alt={alt} className={className} />
  );
}
