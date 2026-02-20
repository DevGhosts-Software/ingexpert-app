'use client';

import { useEffect, useState } from 'react';
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

export function StorageImage({ src, alt, ...props }: StorageImageProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  useEffect(() => {
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

  if (!signedUrl) return null;

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={signedUrl} alt={alt} {...props} />;
}
