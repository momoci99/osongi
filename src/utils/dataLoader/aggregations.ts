import { db, type AuctionRecord } from "../database";

/** 쿼리 필터 옵션 */
export type QueryFilters = {
  startDate: string;
  endDate: string;
  region?: string;
  union?: string;
  regions?: string[];
  unions?: string[];
};

/** 날짜 범위로 데이터 쿼리 */
export const queryByDateRange = async (
  filters: QueryFilters,
): Promise<AuctionRecord[]> => {
  let query = db.auctionData
    .where("date")
    .between(filters.startDate, filters.endDate, true, true);

  // 지역 필터
  if (filters.region) {
    query = query.and((record) => record.region === filters.region);
  } else if (filters.regions && filters.regions.length > 0) {
    query = query.and((record) => filters.regions!.includes(record.region));
  }

  // 조합 필터
  if (filters.union) {
    query = query.and((record) => record.union === filters.union);
  } else if (filters.unions && filters.unions.length > 0) {
    query = query.and((record) => filters.unions!.includes(record.union));
  }

  return await query.toArray();
};

/** 집계 쿼리 (등급별 평균 가격 등) */
export const getAggregatedData = async (filters: QueryFilters) => {
  const records = await queryByDateRange(filters);

  // 지역별 집계
  const byRegion = records.reduce(
    (acc, record) => {
      if (!acc[record.region]) {
        acc[record.region] = {
          totalQuantity: 0,
          totalAmount: 0,
          recordCount: 0,
        };
      }

      acc[record.region].totalQuantity += record.auctionQuantityTotal;
      acc[record.region].totalAmount += record.auctionAmountTotal;
      acc[record.region].recordCount += 1;

      return acc;
    },
    {} as Record<
      string,
      { totalQuantity: number; totalAmount: number; recordCount: number }
    >,
  );

  // 등급별 평균 가격
  const gradeAverages = {
    grade1:
      records
        .filter((r) => r.grade1Quantity > 0)
        .reduce((sum, r) => sum + r.grade1UnitPrice, 0) /
        records.filter((r) => r.grade1Quantity > 0).length || 0,
    grade2:
      records
        .filter((r) => r.grade2Quantity > 0)
        .reduce((sum, r) => sum + r.grade2UnitPrice, 0) /
        records.filter((r) => r.grade2Quantity > 0).length || 0,
  };

  return {
    byRegion,
    gradeAverages,
    totalRecords: records.length,
  };
};
