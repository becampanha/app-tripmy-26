import { useCallback, useEffect, useRef, useState } from 'react';
import { getPhoto, setPhoto, deletePhoto } from '../db/photoStore.js';

const KEY = 'background';

/**
 * Persists a user-uploaded background photo in IndexedDB (per device/browser).
 * Falls back to `defaultUrl` (with its credit) until the user replaces it.
 */
export function useBackgroundPhoto(defaultUrl) {
  const [customUrl, setCustomUrl] = useState(null);
  const [ready, setReady] = useState(false);
  const objectUrlRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    getPhoto(KEY)
      .then((blob) => {
        if (cancelled) return;
        if (blob) {
          const url = URL.createObjectURL(blob);
          objectUrlRef.current = url;
          setCustomUrl(url);
        }
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  const upload = useCallback(async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    await setPhoto(KEY, file);
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setCustomUrl(url);
  }, []);

  const reset = useCallback(async () => {
    await deletePhoto(KEY);
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = null;
    setCustomUrl(null);
  }, []);

  return {
    ready,
    isCustom: !!customUrl,
    url: customUrl || defaultUrl,
    upload,
    reset,
  };
}
