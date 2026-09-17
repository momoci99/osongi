import { Alert, Box, Typography } from "@mui/material";
import ExplorerPanel from "../ExplorerPanel";
import SummaryStatRow from "./SummaryStatRow";
import { GradeKeyToKorean } from "../../../const/Common";
import {
  formatAmount,
  formatInteger,
  formatQuantity,
  formatUnitPrice,
} from "../../../utils/analysisQuery/format";
import type {
  AnalysisQuery,
  AnalysisResult,
  PriceExtreme,
} from "../../../utils/analysisQuery/types";

type ExplorerSummaryProps = {
  query: AnalysisQuery;
  result: AnalysisResult;
  /** 현재 지역·조합 범위에 존재하는 전체 조합 수 (참여 조합 분모) */
  scopeUnionCount: number;
};

/** 가격 극값 캡션 — 날짜 · 조합 · 등급 */
const describeExtreme = (extreme: PriceExtreme): string =>
  `${extreme.date.slice(2).replaceAll("-", ".")} · ${extreme.union} · ${GradeKeyToKorean[extreme.grade]}`;

/** 평년 기준 설명 */
const describeNormalYears = (years: number[]): string =>
  years.length === 0 ? "비교할 과거 시즌 없음" : `${years[0]}–${years[years.length - 1]} · ${years.length}시즌 중앙값`;

/** 요약 패널 — 현재 조회 결과의 핵심 수치와 표본 정보 */
const ExplorerSummary = ({ query, result, scopeUnionCount }: ExplorerSummaryProps) => {
  const { summary } = result;
  const price = summary.unitPrice === null ? null : formatUnitPrice(summary.unitPrice);
  const quantity = formatQuantity(summary.quantity);
  const amount = formatAmount(summary.amount);

  return (
    <ExplorerPanel title="요약">
      {summary.lowSample ? (
        <Alert severity="warning" variant="outlined" sx={{ mb: 1.5, py: 0, fontSize: "0.8125rem" }}>
          공판일이 {summary.tradingDays}일뿐이라 수치가 크게 흔들릴 수 있습니다.
        </Alert>
      ) : null}

      <Box>
        <SummaryStatRow
          label="가중 평균 단가"
          value={price?.value ?? "–"}
          unit={price?.unit}
          emphasis
        />
        <SummaryStatRow label="공판량" value={quantity.value} unit={quantity.unit} />
        <SummaryStatRow label="공판 금액" value={amount.value} unit={amount.unit} />
        <SummaryStatRow
          label="공판일"
          value={formatInteger(summary.tradingDays)}
          unit="일"
          caption={`공판 ${formatInteger(summary.records)}건`}
        />
        <SummaryStatRow
          label="참여 조합"
          value={`${result.includedUnions.length}`}
          unit={`/ ${scopeUnionCount}곳`}
          caption={query.commonUnitsOnly ? "공통 조합만 집계" : undefined}
        />
        {summary.max ? (
          <SummaryStatRow
            label="최고 단가"
            value={formatUnitPrice(summary.max.unitPrice).value}
            unit="만원/kg"
            caption={describeExtreme(summary.max)}
          />
        ) : null}
        {summary.min ? (
          <SummaryStatRow
            label="최저 단가"
            value={formatUnitPrice(summary.min.unitPrice).value}
            unit="만원/kg"
            caption={describeExtreme(summary.min)}
          />
        ) : null}
      </Box>

      {query.compare === "normal" ? (
        <Typography sx={{ mt: 1.5, fontSize: "0.75rem", color: "text.secondary" }}>
          평년 기준 · {describeNormalYears(result.normalYears)}
        </Typography>
      ) : null}

    </ExplorerPanel>
  );
};

export default ExplorerSummary;
