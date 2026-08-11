import { GradeKeyToKorean } from "../const/Common";
import type { ScopeMetaFacts } from "../const/Seo";
import type { ScopeStats } from "../types/region";

/**
 * 지역·조합 페이지의 요약 문단과 메타 문구를 만든다.
 *
 * 클라이언트 페이지와 프리렌더 스크립트가 같은 문장을 써야
 * 크롤러가 본 내용과 사용자가 본 내용이 어긋나지 않는다.
 */

const gradeLabel = (gradeKey: string): string =>
  GradeKeyToKorean[gradeKey as keyof typeof GradeKeyToKorean] ?? gradeKey;

const formatWon = (value: number): string =>
  `${Math.round(value).toLocaleString("ko-KR")}원`;

const formatKg = (value: number): string =>
  `${Math.round(value).toLocaleString("ko-KR")}kg`;

/** 지표를 메타 태그 생성용 최소 형태로 압축 */
export const toScopeMetaFacts = (stats: ScopeStats): ScopeMetaFacts => ({
  seasonYear: stats.latestSeasonYear,
  avgPricePerKg: stats.season?.avgPricePerKg ?? null,
  peakPriceWon: stats.peak?.priceWon ?? null,
  totalQuantityKg: stats.season?.totalQuantityKg ?? null,
  firstYear: stats.yearly[0]?.year ?? null,
});

/** 조합 페이지는 "경북 봉화", 지역 페이지는 "경북" */
export const scopeLabel = (stats: ScopeStats): string =>
  stats.name === stats.region ? stats.region : `${stats.region} ${stats.name}`;

/**
 * 페이지 상단에 노출할 요약 문단.
 * 숫자만 늘어놓은 표는 검색엔진이 주제를 판단할 근거가 얇으므로
 * 지표를 문장으로 풀어 한 단락을 확보한다.
 */
export const buildScopeNarrative = (stats: ScopeStats): string[] => {
  const label = scopeLabel(stats);
  const isUnion = stats.name !== stats.region;
  const subject = isUnion ? `${label}산림조합` : `${label} 지역`;
  const paragraphs: string[] = [];

  if (stats.season) {
    const { startDate, endDate, avgPricePerKg, totalQuantityKg, totalAmountWon } =
      stats.season;
    paragraphs.push(
      `${subject}의 ${stats.latestSeasonYear} 시즌 송이버섯 공판은 ${startDate}부터 ${endDate}까지 진행됐고, ` +
        `공판량 ${formatKg(totalQuantityKg)}에 공판금액 ${formatWon(totalAmountWon)}을 기록했습니다. ` +
        `물량 가중 평균 단가는 kg당 ${formatWon(avgPricePerKg)}입니다.`
    );
  } else {
    paragraphs.push(
      `${subject}의 ${stats.latestSeasonYear} 시즌 공판 실적은 아직 집계되지 않았습니다. ` +
        `아래에서 연도별 공판 실적을 확인할 수 있습니다.`
    );
  }

  const topGrade = [...stats.grades].sort(
    (a, b) => b.avgUnitPriceWon - a.avgUnitPriceWon
  )[0];
  if (topGrade && stats.peak) {
    paragraphs.push(
      `등급별로는 ${gradeLabel(topGrade.gradeKey)}이 kg당 평균 ${formatWon(topGrade.avgUnitPriceWon)}으로 가장 높았고, ` +
        `시즌 최고 단가는 ${stats.peak.date}의 ${gradeLabel(stats.peak.gradeKey)} ${formatWon(stats.peak.priceWon)}입니다.`
    );
  }

  const yearly = stats.yearly;
  if (yearly.length >= 2) {
    const first = yearly[0];
    const last = yearly[yearly.length - 1];
    const best = [...yearly].sort((a, b) => b.totalQuantityKg - a.totalQuantityKg)[0];
    paragraphs.push(
      `${first.year}년부터 ${last.year}년까지 ${yearly.length}개 시즌의 공판 기록이 있으며, ` +
        `공판량이 가장 많았던 해는 ${best.year}년(${formatKg(best.totalQuantityKg)})입니다.`
    );
  }

  if (stats.quantityRank) {
    paragraphs.push(
      `${stats.latestSeasonYear} 시즌 공판량은 전국 ${stats.quantityRank.of}개 조합 중 ${stats.quantityRank.rank}위입니다.`
    );
  }

  return paragraphs;
};
