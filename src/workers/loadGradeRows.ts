import { db } from "../utils/database";
import { toGradeRows } from "../utils/analysisQuery/rows";
import type { GradeRow } from "../utils/analysisQuery/types";

/** 데이터셋 버전별 롱 포맷 캐시 */
let rowsCache: { version: string; promise: Promise<GradeRow[]> } | null = null;

/**
 * IndexedDB 전체를 등급 롱 포맷으로 한 번만 읽는다.
 * 워커와 메인 스레드 폴백이 같은 함수를 쓴다.
 */
export const loadGradeRows = (version: string): Promise<GradeRow[]> => {
  if (rowsCache?.version === version) return rowsCache.promise;

  const promise = db.auctionData.toArray().then(toGradeRows);
  rowsCache = { version, promise };
  promise.catch(() => {
    rowsCache = null;
  });
  return promise;
};

/** 테스트용 캐시 초기화 */
export const resetGradeRowsCache = () => {
  rowsCache = null;
};
