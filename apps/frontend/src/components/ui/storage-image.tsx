'use client';

import { useEffect, useState } from 'react';
import { ImageIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const BUCKET = 'app-data';
const SIGNED_URL_TTL = 60 * 60; // 1 hour in seconds

function extractPath(url: string): string | null {
  const marker = `/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.slice(idx + marker.length);
}

interface StorageImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
}

export function StorageImage({ src, alt, className, ...props }: StorageImageProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    setSignedUrl(null);
    setImgLoaded(false);
    const path = extractPath(src);
    if (!path) {
      setSignedUrl(src);
      return;
    }

    let cancelled = false;
    supabase.storage
      .from(BUCKET)
      .createSignedUrl(path, SIGNED_URL_TTL)
      .then(({ data, error }) => {
        if (!cancelled && !error && data) {
          setSignedUrl(data.signedUrl);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [src]);

  const showPlaceholder = !signedUrl || !imgLoaded;

  return (
    <>
      {showPlaceholder && (
        <div className={`flex items-center justify-center bg-muted/50 ${className ?? ''}`}>
          <ImageIcon className="h-8 w-8 text-muted-foreground/30 animate-pulse" />
        </div>
      )}
      {signedUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={signedUrl}
          alt={alt}
          className={`${className ?? ''} ${!imgLoaded ? 'hidden' : ''}`}
          onLoad={() => setImgLoaded(true)}
          {...props}
        />
      )}
    </>
  );
}
