import type { CompleteDataset } from "../database";

/** 진행률 콜백 타입 */
export type ProgressCallback = (progress: number) => void;

/** 완전한 데이터셋 다운로드 (스트리밍 + progress) */
export const downloadCompleteDataset = async (
  onProgress?: ProgressCallback,
): Promise<CompleteDataset> => {
  const response = await fetch("/auction-data/complete-dataset.json", {
    cache: "no-cache",
  });

  if (!response.ok) {
    throw new Error(
      `데이터 다운로드 실패: ${response.status} ${response.statusText}`,
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
      if (total > 0 && onProgress) {
        const progress = Math.round((loaded / total) * 50); // 다운로드는 전체의 50%
        onProgress(progress);
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
};
