import Dexie, { type EntityTable } from "dexie";

// 정규화된 경매 레코드 타입 (complete-dataset.json과 동일)
export interface AuctionRecord {
  id?: number; // Auto-increment primary key
  date: string; // YYYY-MM-DD format
  region: string;
  union: string;
  lastUpdated?: string;

  // Parsed auction quantities (in kg)
  auctionQuantityUntilYesterday: number;
  auctionQuantityToday: number;
  auctionQuantityTotal: number;

  // Parsed auction amounts (in won)
  auctionAmountUntilYesterday: number;
  auctionAmountToday: number;
  auctionAmountTotal: number;

  // Grade 1
  grade1Quantity: number;
  grade1UnitPrice: number;

  // Grade 2
  grade2Quantity: number;
  grade2UnitPrice: number;

  // Grade 3 Stopped
  grade3StoppedQuantity: number;
  grade3StoppedUnitPrice: number;

  // Grade 3 Estimated
  grade3EstimatedQuantity: number;
  grade3EstimatedUnitPrice: number;

  // Grade Below
  gradeBelowQuantity: number;
  gradeBelowUnitPrice: number;

  // Mixed Grade
  mixedGradeQuantity: number;
  mixedGradeUnitPrice: number;
}

// 메타데이터 타입
export interface DatasetMetadata {
  id?: number;
  version: string;
  dbVersion: string; // DB 스키마 버전
  totalRecords: number;
  dateRangeEarliest: string;
  dateRangeLatest: string;
  regions: string[];
  unions: string[];
  lastUpdated: string;
}

// 완전한 데이터셋 타입
export interface CompleteDataset {
  version: string;
  totalRecords: number;
  dateRange: {
    earliest: string;
    latest: string;
  };
  regions: string[];
  unions: string[];
  data: AuctionRecord[];
}

// 현재 DB 스키마 버전 (구조 변경 시 증가)
export const CURRENT_DB_VERSION = "1.1.0";

// Dexie 데이터베이스 클래스
export class MushroomAuctionDB extends Dexie {
  // 테이블 선언
  auctionData!: EntityTable<AuctionRecord, "id">;
  metadata!: EntityTable<DatasetMetadata, "id">;

  constructor() {
    super("MushroomAuctionDB");

    // 스키마 정의 (v1)
    this.version(1).stores({
      // 경매 데이터 테이블 - 복합 인덱스로 빠른 쿼리 지원
      auctionData:
        "++id, date, region, union, [date+region], [date+union], [region+union], [date+region+union]",

      // 메타데이터 테이블 - 버전 관리용
      metadata: "++id, version, lastUpdated",
    });
  }
}

// 글로벌 데이터베이스 인스턴스
export const db = new MushroomAuctionDB();
