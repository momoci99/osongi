import { useEffect, useState } from "react";
import type { RegionManifest } from "../types/region";

const MANIFEST_URL = "/auction-stats/region-manifest.json";

/**
 * 지역·조합 페이지 사이를 이동할 때마다 다시 받지 않도록 모듈 스코프에 캐시한다.
 * 매니페스트는 빌드 산출물이라 세션 중 바뀌지 않는다.
 */
let manifestPromise: Promise<RegionManifest> | null = null;

const loadManifest = (): Promise<RegionManifest> => {
  manifestPromise ??= fetch(MANIFEST_URL).then((response) => {
    if (!response.ok) throw new Error(`region-manifest 응답 오류: ${response.status}`);
    return response.json() as Promise<RegionManifest>;
  });
  return manifestPromise;
};

type UseRegionManifestReturn = {
  manifest: RegionManifest | null;
  error: Error | null;
};

/** region-manifest.json 로드 */
const useRegionManifest = (): UseRegionManifestReturn => {
  const [manifest, setManifest] = useState<RegionManifest | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(function initRegionManifest() {
    let cancelled = false;

    loadManifest()
      .then((data) => {
        if (!cancelled) setManifest(data);
      })
      .catch((cause: Error) => {
        manifestPromise = null;
        if (!cancelled) setError(cause);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { manifest, error };
};

export default useRegionManifest;
