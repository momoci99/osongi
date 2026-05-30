import { useState, useEffect, useCallback } from "react";
import {
  dataLoader,
  type DataLoadingState,
} from "../utils/dataLoader";

/** 데이터 로더 상태를 위한 커스텀 훅 */
export function useDataLoader() {
  const [state, setState] = useState<DataLoadingState>(dataLoader.getState());

  useEffect(function subscribeDataLoader() {
    // 상태 변경 구독
    const unsubscribe = dataLoader.subscribe(setState);

    // 초기화가 안 되어 있다면 시작 (한 번만 실행)
    const currentState = dataLoader.getState();
    if (!currentState.isInitialized && !currentState.isLoading) {
      dataLoader.initialize();
    }

    return () => {
      unsubscribe();
    };
  }, []); // 마운트 시에만 실행

  const forceUpdate = useCallback(async () => {
    await dataLoader.forceUpdate();
  }, []);

  const softRefresh = useCallback(() => dataLoader.softRefresh(), []);

  return {
    ...state,
    forceUpdate,
    softRefresh,
  };
}
