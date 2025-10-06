import type { MushroomAuctionDataRaw } from "../types/data";

// 테이블 표시용 데이터 타입
export interface TableRowData {
  id: string;
  date: string;
  region: string;
  union: string;
  grade: string;
  gradeName: string;
  quantity: number;
  unitPrice: number;
}

// 등급 키를 한글명으로 변환
export const getGradeName = (gradeKey: string): string => {
  const gradeNames: Record<string, string> = {
    grade1: "1등품",
    grade2: "2등품",
    grade3Stopped: "3등품(생장정지)",
    grade3Estimated: "3등품(개산)",
    gradeBelow: "등외품",
    mixedGrade: "혼합품",
  };
  return gradeNames[gradeKey] || gradeKey;
};

// 숫자 포맷팅 함수
export const formatNumber = (num: number): string => {
  return num.toLocaleString("ko-KR");
};

// 가격 포맷팅 함수 (원 단위)
export const formatPrice = (price: number): string => {
  return `${formatNumber(price)}원`;
};

// 테이블용 데이터 변환 함수
export const transformToTableData = (
  filteredData: MushroomAuctionDataRaw[],
  selectedGrades: string[]
): TableRowData[] => {
  const rows: TableRowData[] = [];

  filteredData.forEach((record) => {
    selectedGrades.forEach((gradeKey) => {
      const gradeData = record[gradeKey as keyof MushroomAuctionDataRaw] as {
        quantity: string;
        unitPrice: string;
      };

      if (gradeData && gradeData.quantity && gradeData.unitPrice) {
        const quantity = parseFloat(gradeData.quantity.replace(/,/g, "")) || 0;
        const unitPrice =
          parseFloat(gradeData.unitPrice.replace(/,/g, "")) || 0;

        // 수량이나 단가가 0보다 큰 경우만 표시
        if (quantity > 0 || unitPrice > 0) {
          rows.push({
            id: `${record.date || "unknown"}-${record.region}-${
              record.union
            }-${gradeKey}`,
            date: record.date || "날짜 미상",
            region: record.region,
            union: record.union,
            grade: gradeKey,
            gradeName: getGradeName(gradeKey),
            quantity,
            unitPrice,
          });
        }
      }
    });
  });

  // 날짜 내림차순 정렬 (최신 데이터가 위로)
  return rows.sort((a, b) => {
    if (a.date === b.date) {
      // 같은 날짜면 등급 순서로 정렬
      const gradeOrder = [
        "grade1",
        "grade2",
        "grade3Stopped",
        "grade3Estimated",
        "gradeBelow",
        "mixedGrade",
      ];
      return gradeOrder.indexOf(a.grade) - gradeOrder.indexOf(b.grade);
    }
    return b.date.localeCompare(a.date);
  });
};
