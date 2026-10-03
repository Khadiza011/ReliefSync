import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

/**
 * Loads data on mount and whenever `deps` change, and exposes a silent `refetch`.
 * Previous data stays on screen while a refetch runs so views never flash empty.
 */
export function useFetch(fetcher, deps = []) {
  const key = JSON.stringify(deps);
  const [state, setState] = useState({ key: null, data: null, error: null });
  const [refreshing, setRefreshing] = useState(false);
  const fetcherRef = useRef(fetcher);
  const mounted = useRef(true);

  useLayoutEffect(() => {
    fetcherRef.current = fetcher;
  });

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve()
      .then(() => fetcherRef.current())
      .then(
        (data) => !cancelled && setState({ key, data, error: null }),
        (error) => !cancelled && setState((prev) => ({ key, data: prev.data, error }))
      );
    return () => {
      cancelled = true;
    };
  }, [key]);

  const refetch = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await fetcherRef.current();
      if (mounted.current) setState((prev) => ({ key: prev.key, data, error: null }));
      return data;
    } catch (error) {
      if (mounted.current) setState((prev) => ({ ...prev, error }));
      return null;
    } finally {
      if (mounted.current) setRefreshing(false);
    }
  }, []);

  return {
    data: state.data,
    error: state.error,
    loading: state.key !== key,
    refreshing,
    refetch,
  };
}

export default useFetch;
