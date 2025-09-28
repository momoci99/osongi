import { useState, useEffect, useMemo } from "react";
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Button,
  type SelectChangeEvent,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { ko } from "date-fns/locale";
import type { MushroomAuctionDataRaw, WeeklyPriceDatum } from "../types/data";
import DataAnalysisChart from "../components/DataAnalysisChart";

// 필터 상태 타입 정의
interface AnalysisFilters {
  region: string; // 단일 지역 선택
  union: string;
  grades: string[];
  startDate: Date;
  endDate: Date;
}

// 등급 옵션 정의
const GRADE_OPTIONS = [
  { value: "grade1", label: "1등품" },
  { value: "grade2", label: "2등품" },
  { value: "grade3Stopped", label: "3등품(생장정지)" },
  { value: "grade3Estimated", label: "3등품(개산)" },
  { value: "gradeBelow", label: "등외품" },
  { value: "mixedGrade", label: "혼합품" },
];

// 유틸리티 함수: 송이버섯 시즌 기본 날짜 범위
function getDefaultDateRange(): { startDate: Date; endDate: Date } {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1; // 1-12

  // 현재가 송이버섯 시즌(8-12월)이면 최근 7일
  if (currentMonth >= 8 && currentMonth <= 12) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 6);
    return { startDate, endDate };
  }

  // 송이버섯 시즌이 아니면 작년 10월 일주일로 설정
  const startDate = new Date(currentYear - 1, 9, 1); // 10월 1일
  const endDate = new Date(currentYear - 1, 9, 7); // 10월 7일

  return { startDate, endDate };
}

// 날짜 범위 생성 함수
function generateDateRange(startDate: Date, endDate: Date): Date[] {
  const dates: Date[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

// 송이버섯 시즌 확인 함수 (8월~12월)
function isMushroomSeason(date: Date): boolean {
  const month = date.getMonth() + 1; // 1-12
  return month >= 8 && month <= 12;
}

// 날짜별 데이터 로드 함수
async function loadDateData(date: Date): Promise<MushroomAuctionDataRaw[]> {
  // 송이버섯 시즌이 아니면 로드하지 않음
  if (!isMushroomSeason(date)) {
    return [];
  }

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  const path = `/auction-data/${year}/${month}/${day}.json`;

  try {
    const response = await fetch(path);
    if (!response.ok) {
      console.warn(`데이터 없음: ${year}-${month}-${day}`);
      return [];
    }
    return await response.json();
  } catch (error) {
    console.warn(`데이터 로드 실패: ${year}-${month}-${day}`, error);
    return [];
  }
}

// 날짜 범위의 모든 데이터 로드
async function loadDateRangeData(
  startDate: Date,
  endDate: Date
): Promise<MushroomAuctionDataRaw[]> {
  const dates = generateDateRange(startDate, endDate);
  console.log(
    `📅 데이터 로드 시작: ${
      dates.length
    }일간 (${startDate.toLocaleDateString()} ~ ${endDate.toLocaleDateString()})`
  );

  const promises = dates.map((date) => loadDateData(date));
  const results = await Promise.all(promises);

  const allData = results.flat();
  console.log(`✅ 데이터 로드 완료: ${allData.length}개 레코드`);

  return allData;
}

// 필터 적용 함수
function applyFilters(
  data: MushroomAuctionDataRaw[],
  filters: AnalysisFilters
): MushroomAuctionDataRaw[] {
  return data.filter((record) => {
    // 지역 필터 (단일 선택)
    if (filters.region && record.region !== filters.region) {
      return false;
    }

    // 조합 필터
    if (filters.union && record.union !== filters.union) {
      return false;
    }

    // 날짜 필터 (YYYY-MM-DD 형식)
    if (record.date) {
      const recordDate = new Date(record.date);
      if (recordDate < filters.startDate || recordDate > filters.endDate) {
        return false;
      }
    }

    return true;
  });
}

// 차트 데이터 변환 함수 - 지역별 멀티 시리즈
function transformToChartData(
  filteredData: MushroomAuctionDataRaw[],
  selectedGrades: string[]
): WeeklyPriceDatum[] {
  const chartData: WeeklyPriceDatum[] = [];

  // 날짜별, 지역별로 그룹화
  const dateRegionGroups: Record<
    string,
    Record<string, MushroomAuctionDataRaw[]>
  > = {};
  filteredData.forEach((record) => {
    if (record.date && record.region) {
      if (!dateRegionGroups[record.date]) {
        dateRegionGroups[record.date] = {};
      }
      if (!dateRegionGroups[record.date][record.region]) {
        dateRegionGroups[record.date][record.region] = [];
      }
      dateRegionGroups[record.date][record.region].push(record);
    }
  });

  // 각 날짜, 지역, 등급별로 개별 거래 포인트 생성
  Object.entries(dateRegionGroups).forEach(([date, regionGroups]) => {
    Object.entries(regionGroups).forEach(([region, records]) => {
      records.forEach((record) => {
        selectedGrades.forEach((gradeKey) => {
          const grade = record[gradeKey as keyof MushroomAuctionDataRaw];
          if (
            grade &&
            typeof grade === "object" &&
            "quantity" in grade &&
            "unitPrice" in grade
          ) {
            const quantity =
              parseFloat(grade.quantity.replace(/[^0-9.-]/g, "")) || 0;
            const unitPrice =
              parseFloat(grade.unitPrice.replace(/[^0-9.-]/g, "")) || 0;

            if (quantity > 0 && unitPrice > 0) {
              // 각 개별 거래를 차트 데이터에 추가
              chartData.push({
                date,
                gradeKey,
                quantityKg: quantity,
                unitPriceWon: Math.round(unitPrice),
                region,
                union: record.union,
              });
            }
          }
        });
      });
    });
  });

  return chartData.sort((a, b) => a.date.localeCompare(b.date));
}

const DataAnalysis = () => {
  // 상태 관리
  const [rawData, setRawData] = useState<MushroomAuctionDataRaw[]>([]);
  const [loading, setLoading] = useState(false);
  // 송이버섯 주요 생산 지역 (실제 JSON 데이터 기준)
  const availableRegions = ["강원", "경북", "경남"];

  // 지역별 조합 목록 (실제 JSON 데이터 기준)
  const regionUnionMap = {
    강원: ["홍천", "양구", "인제", "고성", "양양", "강릉", "삼척", "의성"],
    경북: [
      "의성",
      "안동",
      "청송",
      "영덕",
      "포항",
      "청도",
      "상주",
      "문경",
      "예청",
      "영주",
      "봉화",
      "울진",
    ],
    경남: ["거창"],
  };

  // 모든 조합 목록
  const allUnions = Object.values(regionUnionMap).flat().sort();

  // 필터 상태
  const [filters, setFilters] = useState<AnalysisFilters>(() => {
    const { startDate, endDate } = getDefaultDateRange();
    const defaultRegion = availableRegions[0];
    const defaultUnion =
      regionUnionMap[defaultRegion as keyof typeof regionUnionMap]?.[0] || "";
    return {
      region: defaultRegion, // 기본으로 첫 번째 지역 선택
      union: defaultUnion, // 기본으로 첫 번째 지역의 첫 번째 조합 선택
      grades: ["grade1", "grade2"], // 기본으로 1, 2등품 선택
      startDate,
      endDate,
    };
  });

  // 차트 모드 상태
  const [chartMode, setChartMode] = useState<"price" | "quantity">("price");

  // 초기 데이터 로드 (기본 7일)
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const data = await loadDateRangeData(
          filters.startDate,
          filters.endDate
        );
        setRawData(data);

        // 조합 목록은 고정 목록 사용 (데이터에서 추출하지 않음)

        // 초기 로드 시 기본 지역 설정 (전체)
        // 단일 선택이므로 기본값은 빈 문자열로 유지
      } catch (error) {
        console.error("데이터 로드 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []); // 컴포넌트 마운트 시에만 실행

  // 날짜 범위 변경 시 데이터 재로드
  useEffect(() => {
    const reloadData = async () => {
      setLoading(true);
      try {
        const data = await loadDateRangeData(
          filters.startDate,
          filters.endDate
        );
        setRawData(data);

        // 조합 목록은 고정 목록 사용 (데이터에서 추출하지 않음)

        // 날짜 범위 변경 시 기본 지역 설정 유지
        // 단일 선택이므로 기존 선택 상태 유지
      } catch (error) {
        console.error("데이터 재로드 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    // 초기 로드가 아닌 경우에만 재로드
    if (rawData.length > 0) {
      reloadData();
    }
  }, [filters.startDate, filters.endDate]); // 날짜 변경 시에만 실행

  // 필터 적용된 데이터
  const filteredData = useMemo(() => {
    return applyFilters(rawData, filters);
  }, [rawData, filters]);

  // 차트 데이터 생성
  const chartData = useMemo(() => {
    if (filteredData.length === 0) return [];
    return transformToChartData(filteredData, filters.grades);
  }, [filteredData, filters.grades]);

  // 필터 변경 핸들러들
  const handleRegionChange = (event: SelectChangeEvent) => {
    const newRegion = event.target.value;
    const firstUnion =
      regionUnionMap[newRegion as keyof typeof regionUnionMap]?.[0] || "";
    setFilters((prev) => ({
      ...prev,
      region: newRegion,
      union: firstUnion, // 지역 변경 시 첫 번째 조합 자동 선택
    }));
  };

  const handleUnionChange = (event: SelectChangeEvent) => {
    setFilters((prev) => ({
      ...prev,
      union: event.target.value,
    }));
  };

  const handleGradeChange = (event: SelectChangeEvent<string[]>) => {
    setFilters((prev) => ({
      ...prev,
      grades:
        typeof event.target.value === "string"
          ? [event.target.value]
          : event.target.value,
    }));
  };

  const handleStartDateChange = (date: Date | null) => {
    if (date) {
      setFilters((prev) => ({ ...prev, startDate: date }));
    }
  };

  const handleEndDateChange = (date: Date | null) => {
    if (date) {
      setFilters((prev) => ({ ...prev, endDate: date }));
    }
  };

  // 필터 초기화 함수
  const handleResetFilters = () => {
    const { startDate, endDate } = getDefaultDateRange();
    const defaultRegion = availableRegions[0];
    const defaultUnion =
      regionUnionMap[defaultRegion as keyof typeof regionUnionMap]?.[0] || "";

    setFilters({
      region: defaultRegion,
      union: defaultUnion,
      grades: ["grade1", "grade2"],
      startDate,
      endDate,
    });
  };

  // 지역 기반 조합 필터링 (고정된 지역-조합 매핑 사용)
  const filteredUnions = useMemo(() => {
    if (!filters.region) return allUnions;

    // 선택된 지역의 조합만 반환
    const unions =
      regionUnionMap[filters.region as keyof typeof regionUnionMap] || [];
    return unions.sort();
  }, [filters.region]);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ko}>
      <Container maxWidth="xl">
        <Box sx={{ py: 3 }}>
          {/* 페이지 헤더 */}
          <Typography variant="h4" component="h1" gutterBottom>
            데이터 분석
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
            필터를 사용하여 송이버섯 경매 데이터를 자세히 분석해보세요.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            🍄 송이버섯은 8월~12월 시즌에만 출하되므로, 해당 기간의 데이터만
            분석 가능합니다.
          </Typography>

          {/* 필터 섹션 */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h6">필터 설정</Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={handleResetFilters}
                sx={{ minWidth: "auto", px: 2 }}
              >
                🔄 초기화
              </Button>
            </Box>

            <Grid container spacing={3}>
              {/* 지역 선택 (단일 선택) */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel shrink={filters.region !== ""}>지역</InputLabel>
                  <Select
                    value={filters.region}
                    label="지역"
                    onChange={handleRegionChange}
                    displayEmpty
                    renderValue={(selected) => {
                      return selected || "지역 선택";
                    }}
                  >
                    {availableRegions.map((region) => (
                      <MenuItem key={region} value={region}>
                        {region}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* 조합 선택 */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel shrink={filters.union !== "" || !filters.region}>
                    조합
                  </InputLabel>
                  <Select
                    value={filters.union}
                    label="조합"
                    onChange={handleUnionChange}
                    disabled={!filters.region}
                    displayEmpty
                    renderValue={(selected) => {
                      return selected || "조합 선택";
                    }}
                  >
                    {filteredUnions.map((union) => (
                      <MenuItem key={union} value={union}>
                        {union}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* 등급 선택 */}
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>등급</InputLabel>
                  <Select
                    multiple
                    value={filters.grades}
                    label="등급"
                    onChange={handleGradeChange}
                    renderValue={(selected) => (
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                        {selected.map((value) => {
                          const option = GRADE_OPTIONS.find(
                            (opt) => opt.value === value
                          );
                          return (
                            <Chip
                              key={value}
                              label={option?.label || value}
                              size="small"
                              variant="outlined"
                            />
                          );
                        })}
                      </Box>
                    )}
                  >
                    {GRADE_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* 기간 선택 */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ display: "flex", gap: 2 }}>
                  <DatePicker
                    label="시작일"
                    value={filters.startDate}
                    onChange={handleStartDateChange}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: "medium",
                      },
                    }}
                  />
                  <DatePicker
                    label="종료일"
                    value={filters.endDate}
                    onChange={handleEndDateChange}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: "medium",
                      },
                    }}
                  />
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* 차트 섹션 */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h6">가격 및 수량 변동 추이</Typography>
              <Typography variant="body2" color="text.secondary">
                {loading ? "로딩 중..." : `${filteredData.length}개 레코드`}
              </Typography>
            </Box>

            {loading ? (
              <Box
                sx={{
                  height: 400,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Typography color="text.secondary">
                  📊 데이터 로딩 중...
                </Typography>
              </Box>
            ) : chartData.length > 0 ? (
              <DataAnalysisChart
                data={chartData}
                height={400}
                mode={chartMode}
                onModeChange={setChartMode}
              />
            ) : (
              <Box
                sx={{
                  height: 400,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                  gap: 2,
                }}
              >
                <Typography color="text.secondary">
                  😕 선택한 조건에 맞는 데이터가 없습니다
                </Typography>
                <Typography variant="body2">
                  필터 조건을 조정해보세요
                </Typography>
              </Box>
            )}
          </Paper>

          {/* 테이블 섹션 */}
          <Paper sx={{ p: 3 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h6">상세 데이터</Typography>
              {!loading && filteredData.length > 0 && (
                <Typography variant="body2" color="text.secondary">
                  📋 총 {filteredData.length}개 레코드
                </Typography>
              )}
            </Box>

            <Box
              sx={{
                height: 300,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: 2,
              }}
            >
              {loading ? (
                <Typography color="text.secondary">
                  📋 데이터 로딩 중...
                </Typography>
              ) : filteredData.length > 0 ? (
                <Box sx={{ textAlign: "center" }}>
                  <Typography variant="body1">📊 데이터 미리보기</Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1 }}
                  >
                    지역: {filters.region} | 조합: {filters.union} | 등급:{" "}
                    {filters.grades.length}개 선택
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    테이블 컴포넌트가 여기에 표시됩니다
                  </Typography>
                </Box>
              ) : (
                <Typography color="text.secondary">
                  📋 표시할 데이터가 없습니다
                </Typography>
              )}
            </Box>
          </Paper>
        </Box>
      </Container>
    </LocalizationProvider>
  );
};

export default DataAnalysis;
