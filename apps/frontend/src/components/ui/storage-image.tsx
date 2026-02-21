'use client';

import { useEffect, useState } from 'react';
import { ImageIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { AvatarImage } from '@/components/ui/avatar';

const BUCKET = 'app-data';
const SIGNED_URL_TTL = 60 * 60; // 1 hour in seconds

function extractPath(url: string): string | null {
  const marker = `/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.slice(idx + marker.length);
}

function useSignedStorageUrl(src: string | null | undefined): string | null {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!src) { setSignedUrl(null); return; }
    setSignedUrl(null);
    const path = extractPath(src);
    if (!path) { setSignedUrl(src); return; }

    let cancelled = false;
    supabase.storage
      .from(BUCKET)
      .createSignedUrl(path, SIGNED_URL_TTL)
      .then(({ data, error }) => {
        if (!cancelled && !error && data) setSignedUrl(data.signedUrl);
      });
    return () => { cancelled = true; };
  }, [src]);

  return signedUrl;
}

interface StorageImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
}

export function StorageImage({ src, alt, className, ...props }: StorageImageProps) {
  const signedUrl = useSignedStorageUrl(src);
  const [imgLoaded, setImgLoaded] = useState(false);

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

/** Drop-in replacement for AvatarImage that handles Supabase RLS via signed URLs. */
export function StorageAvatarImage({ src, alt }: { src: string; alt: string }) {
  const signedUrl = useSignedStorageUrl(src);
  if (!signedUrl) return null; // AvatarFallback renders in the meantime
  return <AvatarImage src={signedUrl} alt={alt} />;
}
