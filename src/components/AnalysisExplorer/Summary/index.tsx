import { Alert } from "@mui/material";
import SummaryBand from "./SummaryBand";
import SummaryTile from "./SummaryTile";
import { GradeKeyToKorean } from "../../../const/Common";
import { formatAmount, formatInteger, formatQuantity, formatUnitPrice } from "../../../utils/analysisQuery/format";
import type { AnalysisQuery, AnalysisResultCore, PriceExtreme } from "../../../utils/analysisQuery/types";

type ExplorerSummaryProps = {
  query: AnalysisQuery;
  result: AnalysisResultCore;
  /** 현재 지역·조합 범위에 존재하는 전체 조합 수 (참여 조합 분모) */
  scopeUnionCount: number;
};

/** 가격 극값 캡션 — 날짜 · 조합 · 등급. 한 시즌 안이면 연도를 빼 칸 폭에 맞춘다 */
const describeExtreme = (extreme: PriceExtreme, withYear: boolean): string => {
  const date = (withYear ? extreme.date : extreme.date.slice(5)).replaceAll("-", ".");
  return `${date} · ${extreme.union} · ${GradeKeyToKorean[extreme.grade]}`;
};

/** 조회 기간이 한 시즌 안인지 */
const isSingleSeason = (time: AnalysisQuery["time"]): boolean =>
  time.kind === "seasons" ? time.years.length === 1 : time.start.slice(0, 4) === time.end.slice(0, 4);

/** 공판이 없을 때 0 대신 쓰는 표시 */
const EMPTY_VALUE = { value: "–", unit: "" };

/** 요약 띠 — 현재 조회 결과의 핵심 수치와 표본 정보 */
const ExplorerSummary = ({ query, result, scopeUnionCount }: ExplorerSummaryProps) => {
  const { summary } = result;
  const empty = summary.tradingDays === 0;
  const price = summary.unitPrice === null ? EMPTY_VALUE : formatUnitPrice(summary.unitPrice);
  const quantity = empty ? EMPTY_VALUE : formatQuantity(summary.quantity);
  const amount = empty ? EMPTY_VALUE : formatAmount(summary.amount);

  const withYear = !isSingleSeason(query.time);
  const footer = summary.lowSample ? (
    <Alert severity="warning" variant="outlined" sx={{ mt: 1.5, py: 0, fontSize: "0.8125rem" }}>
      공판일이 {summary.tradingDays}일뿐이라 수치가 크게 흔들릴 수 있습니다.
    </Alert>
  ) : null;

  return (
    <SummaryBand footer={footer}>
      <SummaryTile label="가중 평균 단가" value={price.value} unit={price.unit} emphasis />
      <SummaryTile label="공판량" value={quantity.value} unit={quantity.unit} />
      <SummaryTile label="공판 금액" value={amount.value} unit={amount.unit} />
      <SummaryTile
        label="공판일"
        value={formatInteger(summary.tradingDays)}
        unit="일"
        caption={empty ? undefined : `공판 ${formatInteger(summary.records)}건`}
      />
      <SummaryTile
        label="참여 조합"
        value={`${result.includedUnions.length}`}
        unit={`/ ${scopeUnionCount}곳`}
        caption={query.commonUnitsOnly ? "공통 조합만 집계" : undefined}
      />
      {summary.max ? (
        <SummaryTile
          label="최고 단가"
          value={formatUnitPrice(summary.max.unitPrice).value}
          unit="만원/kg"
          caption={describeExtreme(summary.max, withYear)}
        />
      ) : null}
      {summary.min ? (
        <SummaryTile
          label="최저 단가"
          value={formatUnitPrice(summary.min.unitPrice).value}
          unit="만원/kg"
          caption={describeExtreme(summary.min, withYear)}
        />
      ) : null}
    </SummaryBand>
  );
};

export default ExplorerSummary;
