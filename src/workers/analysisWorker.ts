/// <reference lib="webworker" />
import { handleAnalysisRequest } from "./handleAnalysisRequest";
import type { AnalysisRequest } from "./analysisProtocol";

/**
 * 분석 워커 — IndexedDB 적재·집계를 메인 스레드 밖에서 처리한다.
 * 조회 결과만 메인 스레드로 보내 입력·애니메이션이 끊기지 않게 한다.
 */
self.onmessage = async (event: MessageEvent<AnalysisRequest>) => {
  self.postMessage(await handleAnalysisRequest(event.data));
};
