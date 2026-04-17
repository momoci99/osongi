import { db, type DatasetMetadata, CURRENT_DB_VERSION } from "../database";

/** 로컬 메타데이터 조회 */
export const getLocalMetadata = async (): Promise<DatasetMetadata | null> => {
  try {
    const metadata = await db.metadata.orderBy("id").last();
    return metadata || null;
  } catch (error) {
    console.warn("로컬 메타데이터 확인 실패:", error);
    return null;
  }
};

/** 로컬 데이터 무결성 검증 (빠른 검증으로 최적화) */
export const validateLocalData = async (
  metadata: DatasetMetadata,
): Promise<boolean> => {
  try {
    // 1단계: DB 버전 체크 (가장 중요한 검증)
    const currentDbVersion = CURRENT_DB_VERSION;
    const localDbVersion = metadata.dbVersion || "1.0.0"; // 기존 데이터는 1.0.0으로 간주

    if (localDbVersion !== currentDbVersion) {
      console.warn(
        `🔄 DB 스키마 버전 불일치: 로컬(${localDbVersion}) vs 현재(${currentDbVersion}) - 전체 DB 초기화 필요`,
      );
      return false;
    }

    // 2단계: 빠른 검증 - 메타데이터가 최근에 생성되었다면 나머지 검증 생략
    const metadataAge = Date.now() - new Date(metadata.lastUpdated).getTime();
    const isDev = process.env.NODE_ENV === "development";
    const maxValidationAge = isDev ? 10 * 60 * 1000 : 60 * 60 * 1000; // 개발: 10분, 프로덕션: 1시간

    if (metadataAge < maxValidationAge) {
      console.log("✅ DB 버전 일치 및 메타데이터 최신 - 무결성 검증 생략");
      return true;
    } // 기본 카운트만 체크 (가장 빠른 검증)
    const actualCount = await db.auctionData.count();
    const expectedCount = metadata.totalRecords;

    if (actualCount !== expectedCount) {
      console.warn(
        `데이터 무결성 오류: 예상 ${expectedCount}개, 실제 ${actualCount}개`,
      );
      return false;
    }

    console.log("✅ 빠른 무결성 검증 통과");
    return true;
  } catch (error) {
    console.warn("로컬 데이터 검증 실패:", error);
    return false;
  }
};
