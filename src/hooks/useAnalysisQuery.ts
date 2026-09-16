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

/**
 * 분석 조회 상태를 URL과 동기화한다.
 * 파라미터가 없으면 기본 템플릿 쿼리를 쓰되 URL은 건드리지 않는다.
 */
const useAnalysisQuery = (context: TemplateContext) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const fallback = buildTemplateQuery(getDefaultTemplateId(context), context);
  const query = parseAnalysisQuery(searchParams, fallback);
  const activeTemplateId = findMatchingTemplateId(query, context);

  const setQuery = (next: AnalysisQuery, options: UpdateOptions = {}) => {
    setSearchParams(serializeAnalysisQuery(next), { replace: options.replace });
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
