// src/hooks/useApiResource.js
// Small data-fetching helper: loading, error and refetch, without pulling in
// a query library for a project this size.

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Runs `fetcher` on mount and whenever `deps` change.
 *
 * @param fetcher  async function returning the resource
 * @param deps     dependency list, as for useEffect
 * @param options  { initialData, skip }
 */
export function useApiResource(fetcher, deps = [], options = {}) {
  const { initialData = null, skip = false } = options;

  const [data, setData] = useState(initialData);
  // Starts true unless skipped, so the first paint shows a loading state
  // rather than briefly flashing an empty result.
  const [fetching, setFetching] = useState(!skip);
  const [error, setError] = useState(null);

  // Holds the latest fetcher so callers can pass an inline arrow function
  // without it becoming a dependency and causing a refetch every render.
  // Written in an effect rather than during render, because a render pass can
  // be discarded and must stay side-effect free.
  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  const [reloadToken, setReloadToken] = useState(0);
  const refetch = useCallback(() => setReloadToken((n) => n + 1), []);

  // Derived rather than stored: a skipped resource is never loading, and
  // deriving it avoids a setState-in-effect just to represent that.
  const loading = !skip && fetching;

  useEffect(() => {
    if (skip) return undefined;

    let cancelled = false;
    // Marking the request in flight is the effect synchronising React with an
    // external system (the API), which is what effects are for. The lint rule
    // cannot distinguish that from a derived-state copy, so it is silenced
    // here specifically rather than project-wide.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFetching(true);
    setError(null);

    fetcherRef
      .current()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        // Leave `data` as it was: a transient failure should not blank a
        // dashboard that is already showing valid numbers.
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setFetching(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadToken, skip]);

  return { data, loading, error, refetch, setData };
}
