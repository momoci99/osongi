import { useState, useEffect, useCallback } from "react";
import {
  dataLoader,
  type DataLoadingState,
  type QueryFilters,
} from "../utils/dataLoader";
import { type AuctionRecord } from "../utils/database";

// 데이터 로더 상태를 위한 커스텀 훅
export function useDataLoader() {
  const [state, setState] = useState<DataLoadingState>(dataLoader.getState());

  useEffect(() => {
    // 상태 변경 구독
    const unsubscribe = dataLoader.subscribe(setState);

    // 초기화가 안 되어 있다면 시작 (한 번만 실행)
    const currentState = dataLoader.getState();
    if (!currentState.isInitialized && !currentState.isLoading) {
      dataLoader.initialize();
    }

    return () => {
      unsubscribe();
    };
  }, []); // 의존성 배열을 빈 배열로 변경하여 마운트 시에만 실행

  const forceUpdate = useCallback(async () => {
    await dataLoader.forceUpdate();
  }, []);

  return {
    ...state,
    forceUpdate,
  };
}

// 데이터 쿼리를 위한 커스텀 훅
export function useAuctionData(filters: QueryFilters) {
  const [data, setData] = useState<AuctionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isInitialized } = useDataLoader();

  const fetchData = useCallback(async () => {
    if (!isInitialized) return;

    setLoading(true);
    setError(null);

    try {
      const result = await dataLoader.queryByDateRange(filters);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "데이터 조회 실패");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [filters, isInitialized]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading: loading || !isInitialized,
    error,
    refetch,
  };
}

// 집계 데이터를 위한 커스텀 훅
export function useAggregatedData(filters: QueryFilters) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isInitialized } = useDataLoader();

  const fetchData = useCallback(async () => {
    if (!isInitialized) return;

    setLoading(true);
    setError(null);

    try {
      const result = await dataLoader.getAggregatedData(filters);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "집계 데이터 조회 실패");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [filters, isInitialized]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading: loading || !isInitialized,
    error,
    refetch: fetchData,
  };
}
