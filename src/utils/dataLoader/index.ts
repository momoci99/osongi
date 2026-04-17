import { db, type DatasetMetadata, CURRENT_DB_VERSION } from "../database";
import { fetchServerVersion } from "./versionCheck";
import { getLocalMetadata, validateLocalData } from "./validation";
import { downloadCompleteDataset } from "./download";
import { saveToIndexedDB, performDatabaseReset } from "./persistence";
import {
  queryByDateRange,
  getAggregatedData,
  type QueryFilters,
} from "./aggregations";

/** 데이터 로딩 상태 */
export type DataLoadingState = {
  isLoading: boolean;
  isInitialized: boolean;
  isRefreshing: boolean;
  hasError: boolean;
  error?: string;
  progress?: number; // 0-100
  lastUpdated?: string;
  latestDataDate?: string;
  totalRecords?: number;
};

class DataLoaderService {
  private loadingState: DataLoadingState = {
    isLoading: false,
    isInitialized: false,
    isRefreshing: false,
    hasError: false,
  };

  private listeners: Set<(state: DataLoadingState) => void> = new Set();

  private notifyStateChange() {
    this.listeners.forEach((listener) => listener(this.loadingState));
  }

  subscribe(listener: (state: DataLoadingState) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getState(): DataLoadingState {
    return { ...this.loadingState };
  }

  private updateProgress = (progress: number) => {
    this.loadingState = { ...this.loadingState, progress };
    this.notifyStateChange();
  };

  private applyMetadata(metadata: DatasetMetadata | null) {
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
  }

  /** 전체 업데이트 수행 */
  private async performFullUpdate(): Promise<void> {
    console.log("📥 전체 데이터셋 다운로드 시작...");
    const dataset = await downloadCompleteDataset(this.updateProgress);
    await saveToIndexedDB(dataset, this.updateProgress);
    console.log(`💾 ${dataset.totalRecords}개 레코드 IndexedDB 저장 완료`);
  }

  /** 점진적 업데이트 수행 (현재는 전체 업데이트와 동일) */
  private async performIncrementalUpdate(
    localMetadata: DatasetMetadata,
    serverInfo: { version: string; size?: number; lastModified?: string },
  ): Promise<void> {
    console.log("🔄 점진적 업데이트 (현재: 전체 업데이트)");
    console.log(
      `이전: ${localMetadata.totalRecords}개 레코드 (${localMetadata.version})`,
    );
    console.log(
      `신규: ${serverInfo.version} ${
        serverInfo.size
          ? `(${Math.round((serverInfo.size / 1024 / 1024) * 100) / 100}MB)`
          : ""
      }`,
    );

    await this.performFullUpdate();

    const newMetadata = await getLocalMetadata();
    if (newMetadata) {
      const addedRecords =
        newMetadata.totalRecords - localMetadata.totalRecords;
      console.log(
        `결과: ${addedRecords > 0 ? "+" : ""}${addedRecords}개 레코드 변화`,
      );
    }
  }

  /** 초기화 (앱 시작 시 한 번 호출) */
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

      const localMetadata = await getLocalMetadata();

      if (!localMetadata) {
        console.log("🆕 첫 방문 - 전체 데이터 다운로드");
        await this.performFullUpdate();
      } else {
        console.log(
          `📦 로컬 데이터 발견: ${localMetadata.totalRecords}개 레코드 (${localMetadata.version})`,
        );

        try {
          const localAge =
            Date.now() - new Date(localMetadata.lastUpdated).getTime();
          const isDev = process.env.NODE_ENV === "development";
          const maxAge = isDev ? 5 * 60 * 1000 : 60 * 60 * 1000;

          if (localAge < maxAge) {
            console.log(
              `✅ 로컬 데이터 최신 (${Math.round(
                localAge / 1000 / 60,
              )}분 전) - 서버 체크 및 무결성 검증 생략`,
            );
            this.applyMetadata(localMetadata);
            this.notifyStateChange();
            console.log("🎉 데이터 초기화 완료 (빠른 경로)");
            return;
          } else {
            const isDataValid = await validateLocalData(localMetadata);
            if (!isDataValid) {
              const localDbVersion = localMetadata.dbVersion || "1.0.0";

              if (localDbVersion !== CURRENT_DB_VERSION) {
                console.log(
                  "🔄 DB 스키마 버전 변경 감지 - 완전 DB 초기화 후 재다운로드",
                );
                await performDatabaseReset();
              } else {
                console.log("🔧 데이터 무결성 오류 - 전체 재다운로드");
              }

              await this.performFullUpdate();
              return;
            }

            console.log("🔍 로컬 데이터 오래됨, 서버 버전 확인 중...");
            const serverInfo = await fetchServerVersion();
            console.log(`🌐 서버 버전: ${serverInfo.version}`);
            console.log(`📦 로컬 버전: ${localMetadata.version}`);

            if (localMetadata.version !== serverInfo.version) {
              console.log("🔄 버전 차이 발견 - 데이터 업데이트");
              await this.performIncrementalUpdate(localMetadata, serverInfo);
            } else {
              console.log("✅ 로컬 데이터 최신 상태 - 업데이트 불필요");
            }
          }
        } catch (error) {
          console.warn("서버 접근 실패, 로컬 데이터 사용:", error);
        }
      }

      const finalMetadata = await getLocalMetadata();
      this.applyMetadata(finalMetadata);
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

    const localMetadata = await getLocalMetadata();
    if (!localMetadata) {
      throw new Error("로컬 데이터가 없습니다. 앱을 다시 시작해 주세요.");
    }

    this.loadingState = { ...this.loadingState, isRefreshing: true };
    this.notifyStateChange();

    try {
      console.log("🔄 수동 새로고침: 데이터셋 다운로드 중...");
      const dataset = await downloadCompleteDataset();

      if (dataset.version === localMetadata.version) {
        console.log("✅ 이미 최신 데이터");
        this.loadingState = { ...this.loadingState, isRefreshing: false };
        this.notifyStateChange();
        return { updated: false };
      }

      console.log(
        `🔄 새 버전 감지 (${localMetadata.version} → ${dataset.version})`,
      );
      await saveToIndexedDB(dataset);

      const newMetadata = await getLocalMetadata();
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

  /** 날짜 범위로 데이터 쿼리 (위임) */
  async queryByDateRange(filters: QueryFilters) {
    if (!this.loadingState.isInitialized) {
      throw new Error("데이터가 초기화되지 않았습니다");
    }
    return queryByDateRange(filters);
  }

  /** 집계 쿼리 (위임) */
  async getAggregatedData(filters: QueryFilters) {
    return getAggregatedData(filters);
  }

  /** 메타데이터 반환 */
  async getMetadata(): Promise<DatasetMetadata | undefined> {
    return await db.metadata.orderBy("id").last();
  }

  /** 강제 업데이트 */
  async forceUpdate(): Promise<void> {
    console.log("🔧 강제 업데이트 시작...");
    this.loadingState = {
      ...this.loadingState,
      isInitialized: false,
      isLoading: true,
    };
    this.notifyStateChange();

    try {
      await performDatabaseReset();
      await this.performFullUpdate();

      const metadata = await getLocalMetadata();
      this.applyMetadata(metadata);
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

/** 글로벌 데이터 로더 인스턴스 */
export const dataLoader = new DataLoaderService();

export { type QueryFilters } from "./aggregations";
