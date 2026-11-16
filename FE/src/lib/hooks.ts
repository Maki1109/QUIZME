import { DependencyList, useCallback, useEffect, useRef, useState } from 'react';
import { errorMessage } from './api';

/** Load data on mount / when deps change. Ignores responses that arrive after unmount or a newer load. */
export function useLoad<T>(loader: () => Promise<T>, deps: DependencyList = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const seq = useRef(0);

  const reload = useCallback(async () => {
    const id = ++seq.current;
    setLoading(true);
    setError(null);
    try {
      const result = await loader();
      if (id === seq.current) setData(result);
    } catch (err) {
      if (id === seq.current) setError(errorMessage(err));
    } finally {
      if (id === seq.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    reload();
    return () => {
      seq.current += 1;
    };
  }, [reload]);

  return { data, error, loading, reload, setData };
}

/** Seconds remaining until `expiresAt`, corrected for the difference between server and client clocks. */
export function useCountdown(expiresAt: string | null, serverNow: string | null) {
  const offset = useRef(0);
  useEffect(() => {
    if (serverNow) offset.current = new Date(serverNow).getTime() - Date.now();
  }, [serverNow]);
  const compute = useCallback(() => (expiresAt ? Math.max(0, Math.round((new Date(expiresAt).getTime() - (Date.now() + offset.current)) / 1000)) : null), [expiresAt]);
  const [left, setLeft] = useState<number | null>(compute);
  useEffect(() => {
    setLeft(compute());
    if (!expiresAt) return undefined;
    const t = setInterval(() => setLeft(compute()), 1000);
    return () => clearInterval(t);
  }, [expiresAt, compute]);
  return left;
}

export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = title ? `${title} · QuizMe` : 'QuizMe';
  }, [title]);
}
