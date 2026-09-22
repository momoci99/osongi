import { useEffect, useState } from "react";
import { WEATHER_PUBLIC_PATH } from "../const/Weather";
import type { StationWeatherFile } from "../utils/weather/publicWeather";

/**
 * 지점 파일은 빌드 산출물이라 세션 중 바뀌지 않는다.
 * 조합을 바꿔 오가도 다시 받지 않도록 지점별 요청을 모듈 스코프에 캐시한다.
 */
const fileRequests = new Map<number, Promise<StationWeatherFile>>();

const loadStationWeather = (stationId: number): Promise<StationWeatherFile> => {
  const cached = fileRequests.get(stationId);
  if (cached) return cached;
  const request = fetch(`${WEATHER_PUBLIC_PATH}/${stationId}.json`).then((response) => {
    if (!response.ok) throw new Error(`기상 파일 ${stationId} 응답 오류: ${response.status}`);
    return response.json() as Promise<StationWeatherFile>;
  });
  fileRequests.set(stationId, request);
  /** 실패한 요청은 캐시에서 빼 다음 선택 때 다시 시도한다 */
  request.catch(() => fileRequests.delete(stationId));
  return request;
};

type StationWeatherState = {
  /** 요청한 지점 키 — 결과가 현재 요청과 맞는지 확인용 */
  key: string;
  files: StationWeatherFile[] | null;
  error: Error | null;
};

type UseStationWeatherReturn = {
  files: StationWeatherFile[] | null;
  loading: boolean;
  error: Error | null;
};

/** 관측소 지점 파일들을 지연 로딩한다 */
const useStationWeather = (stationIds: number[]): UseStationWeatherReturn => {
  const key = stationIds.join(",");
  const [state, setState] = useState<StationWeatherState>({ key: "", files: null, error: null });

  useEffect(
    function loadScopeStations() {
      if (key === "") return;
      let cancelled = false;
      Promise.all(key.split(",").map((id) => loadStationWeather(Number(id))))
        .then((files) => {
          if (!cancelled) setState({ key, files, error: null });
        })
        .catch((cause: Error) => {
          if (!cancelled) setState({ key, files: null, error: cause });
        });
      return () => {
        cancelled = true;
      };
    },
    [key],
  );

  const current = state.key === key;
  return {
    files: current ? state.files : null,
    loading: key !== "" && !current,
    error: current ? state.error : null,
  };
};

export default useStationWeather;
