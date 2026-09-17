import { useEffect, useRef, useState } from "react";
import { useDataLoader } from "./useAuctionData";
import { getAnalysisClient } from "../workers/analysisClient";
import {
  fetchExplorerData,
  getCachedExplorerData,
  prefetchExplorerData,
  toExplorerDataKey,
} from "../workers/explorerDataCache";
import type { ExplorerData, ExplorerMeta } from "../utils/analysisQuery/explorerData";
import type { AnalysisQuery } from "../utils/analysisQuery/types";

/** 오류 메시지 추출 */
const toMessage = (error: unknown): string => (error instanceof Error ? error.message : String(error));

type MetaState = { version: string | null; meta: ExplorerMeta | null; error: string | null };

/** 데이터셋 요약 — 워커가 IndexedDB를 처음 읽는 시점이기도 하다 */
export const useExplorerMeta = () => {
  const { isInitialized, lastUpdated } = useDataLoader();
  const version = lastUpdated ?? "";
  const [state, setState] = useState<MetaState>({ version: null, meta: null, error: null });

  useEffect(
    function requestExplorerMeta() {
      if (!isInitialized) return;
      let cancelled = false;
      getAnalysisClient()
        .request({ type: "meta", version })
        .then((response) => {
          if (!cancelled) setState({ version, meta: response.meta, error: null });
        })
        .catch((error: unknown) => {
          if (!cancelled) setState({ version, meta: null, error: toMessage(error) });
        });
      return () => {
        cancelled = true;
      };
    },
    [isInitialized, version],
  );

  return {
    meta: state.meta,
    version,
    loading: !isInitialized || state.version !== version,
    error: state.error,
  };
};

type DataState = { key: string | null; data: ExplorerData | null; error: string | null };

/**
 * 쿼리 결과를 받는다.
 * 미리 계산된 결과가 캐시에 있으면 같은 렌더에서 바로 쓰고(클릭한 프레임에 반영),
 * 없으면 워커에 요청하고 올 때까지 직전 결과를 유지하며 `pending`을 알린다.
 * 연속 조작 중 늦게 도착한 옛 응답은 버린다(마지막 요청만 반영).
 */
export const useExplorerData = (query: AnalysisQuery, version: string, enabled: boolean) => {
  const key = toExplorerDataKey(query, version);
  const cached = enabled ? getCachedExplorerData(key) : undefined;
  const [state, setState] = useState<DataState>({ key: null, data: null, error: null });
  const latestKeyRef = useRef<string | null>(null);

  useEffect(
    function requestExplorerData() {
      if (!enabled || latestKeyRef.current === key) return;
      latestKeyRef.current = key;
      fetchExplorerData(query, version)
        .then((data) => {
          if (latestKeyRef.current === key) setState({ key, data, error: null });
        })
        .catch((error: unknown) => {
          if (latestKeyRef.current === key) setState((previous) => ({ ...previous, key, error: toMessage(error) }));
        });
    },
    [key, version, query, enabled],
  );

  return {
    data: cached ?? state.data,
    pending: enabled && !cached && state.key !== key,
    error: state.error,
  };
};

/** 결과 미리 계산 (호버·유휴 시간) */
export const usePrefetchExplorerData = (version: string) => (query: AnalysisQuery) =>
  prefetchExplorerData(query, version);

/** 원본 행 CSV — 원본 행은 워커에만 있으므로 요청해서 받는다 */
export const requestRawCsv = async (query: AnalysisQuery, version: string): Promise<string> =>
  (await getAnalysisClient().request({ type: "rawCsv", version, query })).csv;
