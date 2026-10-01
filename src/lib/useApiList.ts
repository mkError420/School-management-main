import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";

interface PaginationState {
  total: number;
  pages: number;
  limit: number;
}

export const useApiList = <T,>(resource: string, collectionKey: string, page: number, limit: number, search: string) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({ total: 0, pages: 1, limit });
  const requestId = useRef(0);

  const refresh = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError(null);

    try {
      const response = await api.getAll(resource, { page, limit, search: search.trim() });
      if (currentRequest !== requestId.current) return;
      const records = response.data?.[collectionKey];

      if (!response.success) {
        setData([]);
        setError(response.message || `Unable to load ${resource}.`);
        return;
      }
      if (!Array.isArray(records)) {
        setData([]);
        setError(`The server returned an invalid ${resource} response.`);
        return;
      }

      setData(records);
      const result = response.data?.pagination;
      setPagination({
        total: Number(result?.total) || 0,
        pages: Math.max(1, Number(result?.pages) || 1),
        limit: Number(result?.limit) || limit,
      });
    } catch (requestError: unknown) {
      if (currentRequest !== requestId.current) return;
      setData([]);
      setError(requestError instanceof Error ? requestError.message : `Unable to load ${resource}.`);
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, [collectionKey, limit, page, resource, search]);

  useEffect(() => {
    void refresh();
    return () => {
      requestId.current += 1;
    };
  }, [refresh]);

  return { data, loading, error, pagination, refresh };
};