/** 서버 버전 체크 (HEAD → Range → full 3단계) */
export const fetchServerVersion = async (): Promise<{
  version: string;
  size?: number;
  lastModified?: string;
}> => {
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
      const rangeResponse = await fetch("/auction-data/complete-dataset.json", {
        headers: {
          Range: "bytes=0-1023", // 처음 1KB만
        },
        cache: "no-cache",
      });

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
    } catch {
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
};
