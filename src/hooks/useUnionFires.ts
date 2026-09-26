import { useEffect, useState } from "react";
import { WILDFIRE_PUBLIC_PATH } from "../const/Wildfire";
import type { UnionFireFile } from "../utils/wildfire/unionFires";

/** 빌드 산출물이라 세션 중 바뀌지 않는다 — 한 번만 받는다 */
let fileRequest: Promise<UnionFireFile> | null = null;

const loadUnionFires = (): Promise<UnionFireFile> => {
  if (fileRequest) return fileRequest;
  fileRequest = fetch(WILDFIRE_PUBLIC_PATH).then((response) => {
    if (!response.ok) throw new Error(`산불 파일 응답 오류: ${response.status}`);
    return response.json() as Promise<UnionFireFile>;
  });
  /** 실패하면 다음 진입 때 다시 시도 */
  fileRequest.catch(() => {
    fileRequest = null;
  });
  return fileRequest;
};

/**
 * 조합별 대형 산불 표식을 지연 로딩한다.
 * 부가 정보라 실패해도 화면을 막지 않고 null 로 둔다.
 */
const useUnionFires = (): UnionFireFile | null => {
  const [file, setFile] = useState<UnionFireFile | null>(null);

  useEffect(function loadFireMarks() {
    let cancelled = false;
    loadUnionFires()
      .then((loaded) => {
        if (!cancelled) setFile(loaded);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  return file;
};

export default useUnionFires;
