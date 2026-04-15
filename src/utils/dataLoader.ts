import {
  db,
  type AuctionRecord,
  type DatasetMetadata,
  type CompleteDataset,
  CURRENT_DB_VERSION,
} from "./database";

// 데이터 로딩 상태
export interface DataLoadingState {
  isLoading: boolean;
  isInitialized: boolean;
  isRefreshing: boolean;
  hasError: boolean;
  error?: string;
  progress?: number; // 0-100
  lastUpdated?: string;
  latestDataDate?: string;
  totalRecords?: number;
}

// 필터 옵션
export interface QueryFilters {
  startDate: string;
  endDate: string;
  region?: string;
  union?: string;
  regions?: string[];
  unions?: string[];
}

class DataLoaderService {
  private loadingState: DataLoadingState = {
    isLoading: false,
    isInitialized: false,
    isRefreshing: false,
    hasError: false,
  };

  private listeners: Set<(state: DataLoadingState) => void> = new Set();

  // 상태 변경 알림
  private notifyStateChange() {
    this.listeners.forEach((listener) => listener(this.loadingState));
  }

  // 상태 구독
  subscribe(listener: (state: DataLoadingState) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // 현재 상태 반환
  getState(): DataLoadingState {
    return { ...this.loadingState };
  }

  // 스마트한 서버 버전 체크 (최소 다운로드)
  private async fetchServerVersion(): Promise<{
    version: string;
    size?: number;
    lastModified?: string;
  }> {
    try {
      // 1단계: HEAD 요청으로 헤더 정보 확인 (빠름)
      const headResponse = await fetch("/auction-data/complete-dataset.json", {
        method: "HEAD",
        cache: "no-cache",
      });

      const etag = headResponse.headers.get("etag");
      const lastModified = headResponse.headers.get("last-modified");
      const contentLength = headResponse.headers.get("content-length");

      // ETag가 있으면 이것을 버전으로 사용 (가장 정확)
      if (etag) {
        console.log("✅ ETag 기반 버전 체크");
        return {
          version: etag.replace(/"/g, ""), // ETag의 따옴표 제거
          size: contentLength ? parseInt(contentLength, 10) : undefined,
          lastModified: lastModified || undefined,
        };
      }

      // Last-Modified가 있으면 사용
      if (lastModified) {
        console.log("✅ Last-Modified 기반 버전 체크");
        return {
          version: lastModified,
          size: contentLength ? parseInt(contentLength, 10) : undefined,
          lastModified,
        };
      }

      // 2단계: 헤더가 없다면 Range 요청으로 최소한의 데이터만 가져오기 (스마트)
      console.log("📡 헤더 없음, Range 요청으로 버전만 추출...");

      try {
        // JSON 파일의 처음 1KB만 가져와서 version 필드 추출
        const rangeResponse = await fetch(
          "/auction-data/complete-dataset.json",
          {
            headers: {
              Range: "bytes=0-1023", // 처음 1KB만
            },
            cache: "no-cache",
          }
        );

        if (rangeResponse.status === 206) {
          // Partial Content
          const partialText = await rangeResponse.text();
          const versionMatch = partialText.match(/"version":\s*"([^"]+)"/);

          if (versionMatch) {
            console.log("✅ Range 요청으로 버전 추출 성공");
            return {
              version: versionMatch[1],
              size: contentLength ? parseInt(contentLength, 10) : undefined,
            };
          }
        }
      } catch (rangeError) {
        console.log("⚠️ Range 요청 실패, 전체 파일에서 버전 추출 시작...");
      }

      // 3단계: Range 요청도 안되면 전체 파일 다운로드 (최후의 수단)
      console.log("📥 전체 데이터 다운로드하여 버전 추출...");
      const fullResponse = await fetch("/auction-data/complete-dataset.json", {
        cache: "no-cache",
      });

      const data = await fullResponse.json();
      return {
        version: data.version,
        size: JSON.stringify(data).length,
      };
    } catch (error) {
      console.warn("서버 버전 확인 실패:", error);
      throw new Error(`서버 버전 확인 실패: ${error}`);
    }
  }

  // 로컬 버전 및 메타데이터 확인
  private async getLocalMetadata(): Promise<DatasetMetadata | null> {
    try {
      const metadata = await db.metadata.orderBy("id").last();
      return metadata || null;
    } catch (error) {
      console.warn("로컬 메타데이터 확인 실패:", error);
      return null;
    }
  }

  // 로컬 데이터 무결성 검증 (빠른 검증으로 최적화)
  private async validateLocalData(metadata: DatasetMetadata): Promise<boolean> {
    try {
      // 1단계: DB 버전 체크 (가장 중요한 검증)
      const currentDbVersion = CURRENT_DB_VERSION;
      const localDbVersion = metadata.dbVersion || "1.0.0"; // 기존 데이터는 1.0.0으로 간주

      if (localDbVersion !== currentDbVersion) {
        console.warn(
          `🔄 DB 스키마 버전 불일치: 로컬(${localDbVersion}) vs 현재(${currentDbVersion}) - 전체 DB 초기화 필요`
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
          `데이터 무결성 오류: 예상 ${expectedCount}개, 실제 ${actualCount}개`
        );
        return false;
      }

      console.log("✅ 빠른 무결성 검증 통과");
      return true;
    } catch (error) {
      console.warn("로컬 데이터 검증 실패:", error);
      return false;
    }
  }

  // 완전한 데이터셋 다운로드
  private async downloadCompleteDataset(): Promise<CompleteDataset> {
    const response = await fetch("/auction-data/complete-dataset.json", {
      cache: "no-cache",
    });

    if (!response.ok) {
      throw new Error(
        `데이터 다운로드 실패: ${response.status} ${response.statusText}`
      );
    }

    const contentLength = response.headers.get("content-length");
    const total = contentLength ? parseInt(contentLength, 10) : 0;

    if (!response.body) {
      throw new Error("응답 본문이 없습니다");
    }

    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let loaded = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        chunks.push(value);
        loaded += value.length;

        // 진행률 업데이트
        if (total > 0) {
          const progress = Math.round((loaded / total) * 50); // 다운로드는 전체의 50%
          this.loadingState = { ...this.loadingState, progress };
          this.notifyStateChange();
        }
      }
    } finally {
      reader.releaseLock();
    }

    // 전체 데이터 조합
    const allChunks = new Uint8Array(loaded);
    let offset = 0;
    for (const chunk of chunks) {
      allChunks.set(chunk, offset);
      offset += chunk.length;
    }

    // JSON 파싱
    const text = new TextDecoder().decode(allChunks);
    return JSON.parse(text);
  }

  // IndexedDB에 데이터 저장
  private async saveToIndexedDB(dataset: CompleteDataset): Promise<void> {
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
        const progress = 50 + Math.round((i / data.length) * 50);
        this.loadingState = { ...this.loadingState, progress };
        this.notifyStateChange();
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
  }

  // 초기화 (앱 시작 시 한 번 호출)
  async initialize(): Promise<void> {
    if (this.loadingState.isInitialized) {
      return;
    }

    this.loadingState = {
      ...this.loadingState,
      isLoading: true,
      hasError: false,
      progress: 0,
    };
    this.notifyStateChange();

    try {
      console.log("🔍 데이터 초기화 시작...");

      // 1단계: 로컬 메타데이터 확인
      const localMetadata = await this.getLocalMetadata();

      if (!localMetadata) {
        console.log("🆕 첫 방문 - 전체 데이터 다운로드");
        await this.performFullUpdate();
      } else {
        console.log(
          `📦 로컬 데이터 발견: ${localMetadata.totalRecords}개 레코드 (${localMetadata.version})`
        );

        // 2단계: 조건부 서버 버전 확인 (스마트 체크)
        try {
          // 개발 환경에서는 더 자주 체크, 프로덕션에서는 보수적으로
          const localAge =
            Date.now() - new Date(localMetadata.lastUpdated).getTime();
          const isDev = process.env.NODE_ENV === "development";
          const maxAge = isDev ? 5 * 60 * 1000 : 60 * 60 * 1000; // 개발: 5분, 프로덕션: 1시간

          if (localAge < maxAge) {
            console.log(
              `✅ 로컬 데이터 최신 (${Math.round(
                localAge / 1000 / 60
              )}분 전) - 서버 체크 및 무결성 검증 생략`
            );
            // 빠른 경로: 서버 요청과 무결성 검증 모두 생략!
            // 즉시 초기화 완료 상태로 설정
            this.loadingState = {
              isLoading: false,
              isInitialized: true,
              isRefreshing: false,
              hasError: false,
              progress: 100,
              lastUpdated: localMetadata.lastUpdated,
              latestDataDate: localMetadata.dateRangeLatest,
              totalRecords: localMetadata.totalRecords,
            };
            this.notifyStateChange();
            console.log("🎉 데이터 초기화 완료 (빠른 경로)");
            return;
          } else {
            // 3단계: 로컬 데이터 무결성 검증 (필요시에만)
            const isDataValid = await this.validateLocalData(localMetadata);
            if (!isDataValid) {
              // DB 버전 불일치인 경우 완전 초기화, 아니면 일반 재다운로드
              const currentDbVersion = CURRENT_DB_VERSION;
              const localDbVersion = localMetadata.dbVersion || "1.0.0";

              if (localDbVersion !== currentDbVersion) {
                console.log(
                  "� DB 스키마 버전 변경 감지 - 완전 DB 초기화 후 재다운로드"
                );
                await this.performDatabaseReset();
              } else {
                console.log("�🔧 데이터 무결성 오류 - 전체 재다운로드");
              }

              await this.performFullUpdate();
              return;
            }

            console.log("🔍 로컬 데이터 오래됨, 서버 버전 확인 중...");
            const serverInfo = await this.fetchServerVersion();
            console.log(`🌐 서버 버전: ${serverInfo.version}`);
            console.log(`📦 로컬 버전: ${localMetadata.version}`);

            if (localMetadata.version !== serverInfo.version) {
              console.log("🔄 버전 차이 발견 - 데이터 업데이트");
              await this.performIncrementalUpdate(localMetadata, serverInfo);
            } else {
              console.log("✅ 로컬 데이터 최신 상태 - 업데이트 불필요");
              // 버전은 같으니 로컬 데이터 계속 사용
            }
          }
        } catch (error) {
          console.warn("서버 접근 실패, 로컬 데이터 사용:", error);
          // 네트워크 오류 시 로컬 데이터 계속 사용 (오프라인 지원)
        }
      }

      // 최종 메타데이터 로드
      const finalMetadata = await this.getLocalMetadata();

      this.loadingState = {
        isLoading: false,
        isInitialized: true,
        isRefreshing: false,
        hasError: false,
        progress: 100,
        lastUpdated: finalMetadata?.lastUpdated,
        latestDataDate: finalMetadata?.dateRangeLatest,
        totalRecords: finalMetadata?.totalRecords,
      };

      console.log("🎉 데이터 초기화 완료");
    } catch (error) {
      console.error("❌ 데이터 초기화 실패:", error);

      this.loadingState = {
        ...this.loadingState,
        isLoading: false,
        isRefreshing: false,
        hasError: true,
        error: error instanceof Error ? error.message : "알 수 없는 오류",
      };
    } finally {
      this.notifyStateChange();
    }
  }

  /**
   * 사용자 수동 새로고침. 전체 로딩 화면을 띄우지 않고 백그라운드에서
   * 데이터셋을 다시 받아 로컬 버전과 비교한다. 반환값의 `updated`가
   * true면 호출 측에서 화면을 재진입시켜 새 데이터를 반영해야 한다.
   *
   * NOTE: fetchServerVersion은 HTTP ETag/Last-Modified를 반환하지만
   * 로컬 metadata.version은 JSON 본문의 ISO 타임스탬프라 서로 네임스페이스가
   * 다르다. 그래서 버전 비교는 반드시 다운로드 후 dataset.version으로 한다.
   */
  async softRefresh(): Promise<{ updated: boolean }> {
    if (
      this.loadingState.isRefreshing ||
      this.loadingState.isLoading ||
      !this.loadingState.isInitialized
    ) {
      return { updated: false };
    }

    const localMetadata = await this.getLocalMetadata();
    if (!localMetadata) {
      throw new Error("로컬 데이터가 없습니다. 앱을 다시 시작해 주세요.");
    }

    this.loadingState = { ...this.loadingState, isRefreshing: true };
    this.notifyStateChange();

    try {
      console.log("🔄 수동 새로고침: 데이터셋 다운로드 중...");
      const dataset = await this.downloadCompleteDataset();

      if (dataset.version === localMetadata.version) {
        console.log("✅ 이미 최신 데이터");
        this.loadingState = { ...this.loadingState, isRefreshing: false };
        this.notifyStateChange();
        return { updated: false };
      }

      console.log(
        `🔄 새 버전 감지 (${localMetadata.version} → ${dataset.version})`
      );
      await this.saveToIndexedDB(dataset);

      const newMetadata = await this.getLocalMetadata();
      this.loadingState = {
        ...this.loadingState,
        isRefreshing: false,
        progress: 100,
        lastUpdated: newMetadata?.lastUpdated,
        latestDataDate: newMetadata?.dateRangeLatest,
        totalRecords: newMetadata?.totalRecords,
      };
      this.notifyStateChange();
      return { updated: true };
    } catch (error) {
      console.error("❌ 소프트 새로고침 실패:", error);
      this.loadingState = { ...this.loadingState, isRefreshing: false };
      this.notifyStateChange();
      throw error;
    }
  }

  // 날짜 범위로 데이터 쿼리
  async queryByDateRange(filters: QueryFilters): Promise<AuctionRecord[]> {
    if (!this.loadingState.isInitialized) {
      throw new Error("데이터가 초기화되지 않았습니다");
    }

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
  }

  // 집계 쿼리 (등급별 평균 가격 등)
  async getAggregatedData(filters: QueryFilters) {
    const records = await this.queryByDateRange(filters);

    // 지역별 집계
    const byRegion = records.reduce((acc, record) => {
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
    }, {} as Record<string, { totalQuantity: number; totalAmount: number; recordCount: number }>);

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
  }

  // 메타데이터 반환
  async getMetadata(): Promise<DatasetMetadata | undefined> {
    return await db.metadata.orderBy("id").last();
  }

  // 전체 업데이트 수행
  private async performFullUpdate(): Promise<void> {
    console.log("📥 전체 데이터셋 다운로드 시작...");
    const dataset = await this.downloadCompleteDataset();
    await this.saveToIndexedDB(dataset);
    console.log(`💾 ${dataset.totalRecords}개 레코드 IndexedDB 저장 완료`);
  }

  // 점진적 업데이트 수행 (현재는 전체 업데이트와 동일, 향후 개선 가능)
  private async performIncrementalUpdate(
    localMetadata: DatasetMetadata,
    serverInfo: { version: string; size?: number; lastModified?: string }
  ): Promise<void> {
    // TODO: 향후 더 스마트한 점진적 업데이트 구현
    // 예: 날짜별 차이분만 다운로드, 병합 등

    console.log("🔄 점진적 업데이트 (현재: 전체 업데이트)");
    console.log(
      `이전: ${localMetadata.totalRecords}개 레코드 (${localMetadata.version})`
    );
    console.log(
      `신규: ${serverInfo.version} ${
        serverInfo.size
          ? `(${Math.round((serverInfo.size / 1024 / 1024) * 100) / 100}MB)`
          : ""
      }`
    );

    await this.performFullUpdate();

    const newMetadata = await this.getLocalMetadata();
    if (newMetadata) {
      const addedRecords =
        newMetadata.totalRecords - localMetadata.totalRecords;
      console.log(
        `결과: ${addedRecords > 0 ? "+" : ""}${addedRecords}개 레코드 변화`
      );
    }
  }

  // DB 완전 초기화 (스키마 변경 시 사용)
  private async performDatabaseReset(): Promise<void> {
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
  }

  // 강제 업데이트
  async forceUpdate(): Promise<void> {
    console.log("🔧 강제 업데이트 시작...");
    this.loadingState = {
      ...this.loadingState,
      isInitialized: false,
      isLoading: true,
    };
    this.notifyStateChange();

    try {
      // DB 완전 초기화 후 전체 업데이트
      await this.performDatabaseReset();
      await this.performFullUpdate();

      const metadata = await this.getLocalMetadata();
      this.loadingState = {
        isLoading: false,
        isInitialized: true,
        isRefreshing: false,
        hasError: false,
        progress: 100,
        lastUpdated: metadata?.lastUpdated,
        latestDataDate: metadata?.dateRangeLatest,
        totalRecords: metadata?.totalRecords,
      };
      console.log("✅ 강제 업데이트 완료");
    } catch (error) {
      this.loadingState = {
        ...this.loadingState,
        isLoading: false,
        hasError: true,
        error: error instanceof Error ? error.message : "강제 업데이트 실패",
      };
      console.error("❌ 강제 업데이트 실패:", error);
      throw error;
    } finally {
      this.notifyStateChange();
    }
  }
}

// 글로벌 데이터 로더 인스턴스
export const dataLoader = new DataLoaderService();
