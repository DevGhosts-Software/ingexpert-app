import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase';

const BUCKET = 'app-data';

interface UseStorageUploadOptions {
  folder?: string;
}

export function useStorageUpload({ folder = 'inventory' }: UseStorageUploadOptions = {}) {
  const [isUploading, setIsUploading] = useState(false);

  async function uploadFile(file: File): Promise<string> {
    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `${folder}/${uuidv4()}.${ext}`;

    setIsUploading(true);
    try {
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });

      if (error) throw new Error(error.message);

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      return data.publicUrl;
    } finally {
      setIsUploading(false);
    }
  }

  async function deleteFile(url: string): Promise<void> {
    // Extract the path after the bucket name in the URL
    const marker = `/${BUCKET}/`;
    const idx = url.indexOf(marker);
    if (idx === -1) return;
    const path = url.slice(idx + marker.length);
    await supabase.storage.from(BUCKET).remove([path]);
  }

  return { uploadFile, deleteFile, isUploading };
}
