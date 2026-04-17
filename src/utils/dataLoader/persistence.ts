import {
  db,
  type CompleteDataset,
  type DatasetMetadata,
  CURRENT_DB_VERSION,
} from "../database";
import type { ProgressCallback } from "./download";

/** IndexedDB에 데이터 저장 */
export const saveToIndexedDB = async (
  dataset: CompleteDataset,
  onProgress?: ProgressCallback,
): Promise<void> => {
  const { version, totalRecords, dateRange, regions, unions, data } = dataset;

  // 트랜잭션으로 원자적 업데이트
  await db.transaction("rw", [db.auctionData, db.metadata], async () => {
    // 기존 데이터 삭제
    await db.auctionData.clear();
    await db.metadata.clear();

    // 새 데이터 일괄 삽입
    const batchSize = 1000;
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      await db.auctionData.bulkAdd(batch);

      // 진행률 업데이트 (50% ~ 100%)
      if (onProgress) {
        const progress = 50 + Math.round((i / data.length) * 50);
        onProgress(progress);
      }
    }

    // 메타데이터 저장
    const metadata: DatasetMetadata = {
      version,
      dbVersion: CURRENT_DB_VERSION,
      totalRecords,
      dateRangeEarliest: dateRange.earliest,
      dateRangeLatest: dateRange.latest,
      regions,
      unions,
      lastUpdated: new Date().toISOString(),
    };

    await db.metadata.add(metadata);
  });
};

/** DB 완전 초기화 (스키마 변경 시 사용) */
export const performDatabaseReset = async (): Promise<void> => {
  console.log("🗑️ 기존 IndexedDB 완전 삭제 중...");

  try {
    // 기존 데이터베이스 완전 삭제
    await db.delete();
    console.log("✅ 기존 데이터베이스 삭제 완료");

    // 새로운 데이터베이스 인스턴스 재생성
    await db.open();
    console.log("✅ 새로운 데이터베이스 생성 완료");
  } catch (error) {
    console.error("❌ 데이터베이스 초기화 실패:", error);
    throw new Error(`데이터베이스 초기화 실패: ${error}`);
  }
};
