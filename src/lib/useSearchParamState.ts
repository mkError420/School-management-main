import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

export function useSearchParamState(paramKey = "search", initialDefault = "") {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState<string>(() => searchParams.get(paramKey) || initialDefault);

  useEffect(() => {
    const val = searchParams.get(paramKey);
    if (val !== null) {
      setSearch(val);
    }
  }, [searchParams, paramKey]);

  return [search, setSearch] as const;
}
