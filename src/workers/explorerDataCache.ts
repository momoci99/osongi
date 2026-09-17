import { EXPLORER_DATA_CACHE } from "../const/AnalysisLayout";
import { getAnalysisClient } from "./analysisClient";
import { serializeAnalysisQuery } from "../utils/analysisQuery/queryParams";
import type { ExplorerData } from "../utils/analysisQuery/explorerData";
import type { AnalysisQuery } from "../utils/analysisQuery/types";

/** 결과 캐시 (삽입 순서 = 오래된 순, 조회 시 뒤로 옮겨 LRU) */
const dataCache = new Map<string, ExplorerData>();
/** 계산 중인 요청 — 같은 키를 두 번 보내지 않는다 */
const inflight = new Map<string, Promise<ExplorerData>>();
/** 스트립 막대 Map — 필터가 같으면 같은 참조를 써서 스트립 재그리기를 막는다 */
const dailyMaps = new Map<string, ExplorerData["dailyQuantity"]>();

/** 캐시 키 */
export const toExplorerDataKey = (query: AnalysisQuery, version: string): string =>
  `${version}::${serializeAnalysisQuery(query).toString()}`;

/** 상한을 넘으면 가장 오래된 항목부터 버린다 */
const trim = <T>(map: Map<string, T>) => {
  while (map.size > EXPLORER_DATA_CACHE.LIMIT) {
    const oldest = map.keys().next().value;
    if (oldest === undefined) return;
    map.delete(oldest);
  }
};

/** 스트립 막대 참조 공유 */
const stabilizeDaily = (data: ExplorerData, version: string): ExplorerData => {
  const dailyKey = `${version}::${data.dailyKey}`;
  const existing = dailyMaps.get(dailyKey);
  if (existing) return { ...data, dailyQuantity: existing };
  dailyMaps.set(dailyKey, data.dailyQuantity);
  trim(dailyMaps);
  return data;
};

/** 캐시된 결과 (없으면 undefined) */
export const getCachedExplorerData = (key: string): ExplorerData | undefined => {
  const data = dataCache.get(key);
  if (data) {
    dataCache.delete(key);
    dataCache.set(key, data);
  }
  return data;
};

/** 결과를 가져온다 — 캐시 → 진행 중 요청 → 워커 순 */
export const fetchExplorerData = (query: AnalysisQuery, version: string): Promise<ExplorerData> => {
  const key = toExplorerDataKey(query, version);
  const cached = getCachedExplorerData(key);
  if (cached) return Promise.resolve(cached);
  const running = inflight.get(key);
  if (running) return running;

  const promise = getAnalysisClient()
    .request({ type: "query", version, query })
    .then((response) => {
      const data = stabilizeDaily(response.data, version);
      dataCache.set(key, data);
      trim(dataCache);
      return data;
    })
    .finally(() => inflight.delete(key));
  inflight.set(key, promise);
  return promise;
};

/** 결과를 미리 계산해 둔다 — 실패는 실제 조회 때 다시 드러나므로 무시 */
export const prefetchExplorerData = (query: AnalysisQuery, version: string) => {
  fetchExplorerData(query, version).catch(() => undefined);
};

/** 테스트용 초기화 */
export const resetExplorerDataCache = () => {
  dataCache.clear();
  inflight.clear();
  dailyMaps.clear();
};
