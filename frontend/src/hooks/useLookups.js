import { useEffect, useState } from 'react';
import { lookupService, sheltersService } from '../services/api';

// Reference data changes rarely — cache it for the session, refresh after 5 minutes
const TTL = 5 * 60 * 1000;
const cache = new Map();

function cached(key, loader) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.promise;
  const promise = loader().catch((err) => {
    cache.delete(key);
    throw err;
  });
  cache.set(key, { promise, at: Date.now() });
  return promise;
}

export function invalidateLookups(key) {
  if (key) cache.delete(key);
  else cache.clear();
}

const LOADERS = {
  items: () => lookupService.items(),
  shelters: () => sheltersService.list(),
  donors: () => lookupService.donors(),
};

/** useLookups(['items', 'shelters']) → { items, shelters, loading } */
export function useLookups(keys) {
  const [state, setState] = useState(() => ({ loading: true }));
  const signature = keys.join(',');

  useEffect(() => {
    let cancelled = false;
    const wanted = signature.split(',').filter(Boolean);
    Promise.allSettled(wanted.map((k) => cached(k, LOADERS[k]))).then((results) => {
      if (cancelled) return;
      const next = { loading: false };
      results.forEach((r, i) => {
        next[wanted[i]] = r.status === 'fulfilled' ? r.value : [];
      });
      setState(next);
    });
    return () => {
      cancelled = true;
    };
  }, [signature]);

  return state;
}

export default useLookups;
