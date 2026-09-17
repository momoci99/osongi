import { startTransition, useEffect, useRef, useState } from "react";
import { useDataLoader } from "./useAuctionData";
import { getAnalysisClient } from "../workers/analysisClient";
import { serializeAnalysisQuery } from "../utils/analysisQuery/queryParams";
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
 * 스트립 필터가 같으면 이전 막대 Map을 그대로 쓴다.
 * 참조가 유지돼야 스트립이 막대 900여 개를 다시 만들지 않는다.
 */
const reuseDailyQuantity = (previous: ExplorerData | null, next: ExplorerData): ExplorerData =>
  previous && previous.dailyKey === next.dailyKey ? { ...next, dailyQuantity: previous.dailyQuantity } : next;

/**
 * 쿼리 결과를 워커에서 비동기로 받는다.
 * 새 결과가 올 때까지 직전 결과를 유지하고 `pending`으로 계산 중임을 알린다.
 * 연속 조작 중 늦게 도착한 옛 응답은 버린다(마지막 요청만 반영).
 */
export const useExplorerData = (query: AnalysisQuery, version: string, enabled: boolean) => {
  const key = `${version}::${serializeAnalysisQuery(query).toString()}`;
  const [state, setState] = useState<DataState>({ key: null, data: null, error: null });
  const latestKeyRef = useRef<string | null>(null);

  useEffect(
    function requestExplorerData() {
      if (!enabled || latestKeyRef.current === key) return;
      latestKeyRef.current = key;
      getAnalysisClient()
        .request({ type: "query", version, query })
        .then((response) => {
          if (latestKeyRef.current !== key) return;
          /** 결과 반영(차트 재렌더)은 입력보다 급하지 않다 */
          startTransition(() => {
            setState((previous) => ({
              key,
              data: reuseDailyQuantity(previous.data, response.data),
              error: null,
            }));
          });
        })
        .catch((error: unknown) => {
          if (latestKeyRef.current === key) setState((previous) => ({ ...previous, key, error: toMessage(error) }));
        });
    },
    [key, version, query, enabled],
  );

  return {
    data: state.data,
    pending: enabled && state.key !== key,
    error: state.error,
  };
};

/** 원본 행 CSV — 원본 행은 워커에만 있으므로 요청해서 받는다 */
export const requestRawCsv = async (query: AnalysisQuery, version: string): Promise<string> =>
  (await getAnalysisClient().request({ type: "rawCsv", version, query })).csv;
