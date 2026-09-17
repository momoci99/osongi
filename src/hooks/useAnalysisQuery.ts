import { useState } from "react";
import { useSearchParams } from "react-router";
import {
  buildTemplateQuery,
  findMatchingTemplateId,
  getDefaultTemplateId,
  parseAnalysisQuery,
  serializeAnalysisQuery,
  type AnalysisQuery,
  type AnalysisTemplateId,
  type TemplateContext,
} from "../utils/analysisQuery";

/** 쿼리 갱신 옵션 */
type UpdateOptions = {
  /** 슬라이더·브러시처럼 연속 조작이면 히스토리를 쌓지 않는다 */
  replace?: boolean;
};

/** URL보다 먼저 반영한 쿼리와, 그때의 URL */
type PendingQuery = { query: AnalysisQuery; fromUrl: string };

/**
 * 분석 조회 상태를 URL과 동기화한다.
 * 파라미터가 없으면 기본 템플릿 쿼리를 쓰되 URL은 건드리지 않는다.
 *
 * React Router는 URL 변경을 전환(transition) 우선순위로 렌더해 선택 표시가 1~2프레임 늦는다.
 * 그래서 누른 결과를 컴포넌트 상태에 먼저 반영하고 URL은 뒤따라 맞춘다.
 * URL이 바깥에서 바뀌면(뒤로가기 등) URL을 우선한다.
 */
const useAnalysisQuery = (context: TemplateContext) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [pendingQuery, setPendingQuery] = useState<PendingQuery | null>(null);

  const fallback = buildTemplateQuery(getDefaultTemplateId(context), context);
  const currentUrl = searchParams.toString();
  const urlQuery = parseAnalysisQuery(searchParams, fallback);
  const query = pendingQuery && pendingQuery.fromUrl === currentUrl ? pendingQuery.query : urlQuery;
  const activeTemplateId = findMatchingTemplateId(query, context);

  const setQuery = (next: AnalysisQuery, options: UpdateOptions = {}) => {
    const params = serializeAnalysisQuery(next);
    /** URL이 따라왔을 때와 같은 객체가 되도록 같은 파서·캐시를 거친다 */
    setPendingQuery({ query: parseAnalysisQuery(params, fallback), fromUrl: currentUrl });
    setSearchParams(params, { replace: options.replace });
  };

  const updateQuery = (patch: Partial<AnalysisQuery>, options?: UpdateOptions) => {
    setQuery({ ...query, ...patch }, options);
  };

  const applyTemplate = (id: AnalysisTemplateId) => {
    setQuery(buildTemplateQuery(id, context));
  };

  return { query, activeTemplateId, setQuery, updateQuery, applyTemplate };
};

export default useAnalysisQuery;
