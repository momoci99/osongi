import { useEffect, useState } from "react";
import { useDataLoader } from "./useAuctionData";
import { db } from "../utils/database";
import { listYears, toGradeRows, type GradeRow } from "../utils/analysisQuery";

/** 데이터셋 버전별 롱 포맷 캐시 — 페이지를 다시 열어도 재변환하지 않는다 */
let rowsCache: { version: string; promise: Promise<GradeRow[]> } | null = null;

/** IndexedDB 전체를 롱 포맷으로 한 번만 읽는다 */
const loadGradeRows = (version: string): Promise<GradeRow[]> => {
  if (rowsCache?.version === version) return rowsCache.promise;

  const promise = db.auctionData.toArray().then(toGradeRows);
  rowsCache = { version, promise };
  promise.catch(() => {
    rowsCache = null;
  });
  return promise;
};

type LoadedRows = {
  version: string | null;
  rows: GradeRow[];
  error: string | null;
};

/** 가장 늦은 공판일 */
const findLatestDate = (rows: GradeRow[]): string | null =>
  rows.reduce<string | null>(
    (latest, row) => (latest === null || row.date > latest ? row.date : latest),
    null,
  );

/**
 * 분석 페이지용 전체 데이터셋.
 * 1만여 건이라 메모리에 상주시키고 모든 조회를 동기 집계로 처리한다.
 * 데이터 로더가 새 버전을 받으면(lastUpdated 변경) 다시 읽는다.
 */
const useAnalysisDataset = () => {
  const { isInitialized, lastUpdated } = useDataLoader();
  const version = lastUpdated ?? "";
  const [loaded, setLoaded] = useState<LoadedRows>({
    version: null,
    rows: [],
    error: null,
  });

  useEffect(
    function loadAnalysisRows() {
      if (!isInitialized) return;
      let cancelled = false;

      loadGradeRows(version)
        .then((rows) => {
          if (!cancelled) setLoaded({ version, rows, error: null });
        })
        .catch((error: unknown) => {
          if (cancelled) return;
          const message = error instanceof Error ? error.message : String(error);
          setLoaded({ version, rows: [], error: message });
        });

      return () => {
        cancelled = true;
      };
    },
    [isInitialized, version],
  );

  return {
    rows: loaded.rows,
    availableYears: listYears(loaded.rows),
    latestDate: findLatestDate(loaded.rows),
    loading: !isInitialized || loaded.version !== version,
    error: loaded.error,
  };
};

export default useAnalysisDataset;
