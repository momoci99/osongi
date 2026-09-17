import { handleAnalysisRequest } from "./handleAnalysisRequest";
import type { AnalysisRequest, AnalysisResponse, ResponseOf } from "./analysisProtocol";

/** 요청 본문 (id는 클라이언트가 붙인다) */
type RequestBody = AnalysisRequest extends infer R ? (R extends AnalysisRequest ? Omit<R, "id"> : never) : never;

/** 분석 요청 클라이언트 */
export type AnalysisClient = {
  request: <T extends AnalysisRequest["type"]>(body: Extract<RequestBody, { type: T }>) => Promise<ResponseOf<T>>;
};

/** 응답이 오류면 예외로 바꾼다 */
const unwrap = <T extends AnalysisRequest["type"]>(response: AnalysisResponse): ResponseOf<T> => {
  if (response.type === "error") throw new Error(response.message);
  return response as ResponseOf<T>;
};

/** 워커 기반 클라이언트 */
const createWorkerClient = (): AnalysisClient => {
  const worker = new Worker(new URL("./analysisWorker.ts", import.meta.url), { type: "module" });
  const pending = new Map<number, (response: AnalysisResponse) => void>();
  let nextId = 0;

  worker.onmessage = (event: MessageEvent<AnalysisResponse>) => {
    pending.get(event.data.id)?.(event.data);
    pending.delete(event.data.id);
  };

  return {
    request: (body) =>
      new Promise((resolve, reject) => {
        const id = (nextId += 1);
        pending.set(id, (response) => {
          try {
            resolve(unwrap(response));
          } catch (error) {
            reject(error);
          }
        });
        worker.postMessage({ ...body, id } as AnalysisRequest);
      }),
  };
};

/** 워커를 쓸 수 없는 환경(jsdom·구형 브라우저)용 — 같은 처리기를 메인 스레드에서 실행 */
const createInlineClient = (): AnalysisClient => {
  let nextId = 0;
  return {
    request: async (body) => {
      nextId += 1;
      return unwrap(await handleAnalysisRequest({ ...body, id: nextId } as AnalysisRequest));
    },
  };
};

let client: AnalysisClient | null = null;

/** 앱 전체에서 워커 하나를 공유한다 */
export const getAnalysisClient = (): AnalysisClient => {
  if (!client) client = typeof Worker === "undefined" ? createInlineClient() : createWorkerClient();
  return client;
};
