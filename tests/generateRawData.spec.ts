import { test, expect } from "@playwright/test";
import fs from "fs";

//송이는 9월부터 11월까지만 데이터가 있음
const MIN_MONTH = 9;
const MAX_MONTH = 11;

// 날짜 범위 생성 함수
function generateDateRange(startDate: string, endDate: string): Date[] {
  const dates: Date[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  for (
    let date = new Date(start);
    date <= end;
    date.setDate(date.getDate() + 1)
  ) {
    const month = date.getMonth() + 1;
    // 송이 시즌만 포함 (9-11월)
    if (month >= MIN_MONTH && month <= MAX_MONTH) {
      dates.push(new Date(date));
    }
  }
  return dates;
}

// 날짜를 YYYYMMDD 형식으로 변환
function formatDateForQuery(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

// 데이터 변경사항 분석
function analyzeDataChanges(
  oldData: any[],
  newData: any[]
): {
  hasChanges: boolean;
  summary: string;
} {
  if (oldData.length === 0) {
    return { hasChanges: true, summary: "신규 데이터" };
  }

  if (oldData.length !== newData.length) {
    return {
      hasChanges: true,
      summary: `레코드 수 변경 (${oldData.length} → ${newData.length})`,
    };
  }

  // 핵심 데이터 비교 (수량, 가격만)
  for (let i = 0; i < newData.length; i++) {
    const oldItem = oldData[i];
    const newItem = newData[i];

    // 경매 수량 변경 확인
    if (
      JSON.stringify(oldItem.auctionQuantity) !==
      JSON.stringify(newItem.auctionQuantity)
    ) {
      return { hasChanges: true, summary: "경매 수량 업데이트" };
    }

    // 가격 변경 확인
    const priceFields = [
      "grade1",
      "grade2",
      "grade3Stopped",
      "grade3Estimated",
      "gradeBelow",
      "mixedGrade",
    ];
    for (const field of priceFields) {
      if (JSON.stringify(oldItem[field]) !== JSON.stringify(newItem[field])) {
        return { hasChanges: true, summary: `${field} 가격 업데이트` };
      }
    }
  }

  return { hasChanges: false, summary: "변경사항 없음" };
}

test("송이 공판현황 데이터 파싱", async ({ page }) => {
  // 날짜 범위 설정
  const daysToCheck = process.env.DAYS_TO_CHECK
    ? parseInt(process.env.DAYS_TO_CHECK)
    : 7;
  const endDate = new Date().toISOString().split("T")[0];
  const startDateObj = new Date();
  startDateObj.setDate(startDateObj.getDate() - daysToCheck);
  const startDate = startDateObj.toISOString().split("T")[0];

  // 처리할 날짜 목록 생성
  const targetDates = generateDateRange(startDate, endDate);
  console.log(`🍄 처리할 날짜 수: ${targetDates.length}개`);

  // 통계 카운터
  let newCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  // 각 날짜별로 처리
  for (const currentDate of targetDates) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const day = currentDate.getDate();

    // 파일 경로 설정
    const dirPath = `public/auction-data/${year}/${month}`;
    const filename = `${dirPath}/${day}.json`;

    // 기존 데이터 로드 (비교용)
    let existingData: any[] = [];
    let shouldUpdate = true;

    if (fs.existsSync(filename)) {
      try {
        existingData = JSON.parse(fs.readFileSync(filename, "utf8"));
        console.log(
          `기존 파일 확인: ${year}-${month}-${day} (레코드 ${existingData.length}개)`
        );
      } catch (error) {
        console.log(`기존 파일 손상됨, 재수집: ${year}-${month}-${day}`);
      }
    }

    // 디렉터리 생성
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    const queryDate = formatDateForQuery(currentDate);
    console.log(`수집 중: ${year}-${month}-${day} (${queryDate})`);

    try {
      // 페이지 이동
      await page.goto(
        `https://iforest.nfcf.or.kr/forest/user.tdf?a=user.songi.SongiApp&c=1002&mc=%24mc&pmsh_item_c=01&sply_date=${queryDate}&x=21&y=8`
      );

      // 테이블 데이터 추출
      const rows = await page.locator("table tbody tr").all();
      const dayData: any[] = [];

      // 각 tr 요소의 텍스트 추출
      for (const row of rows) {
        const cells = await row.locator("td").allInnerTexts(); // td 태그의 모든 텍스트 추출
        console.log("current query date ::", queryDate);

        const region = cells[0];
        const union = cells[1];

        const auctionQuantityYesterDayRaw = cells[2].split("\n");
        const auctionQuantityTodayRaw = cells[3].split("\n");
        const auctionQuantityTotalRaw = cells[4].split("\n");

        const auctionQuantity = {
          untilYesterday: auctionQuantityYesterDayRaw[0],
          today: auctionQuantityTodayRaw[0],
          total: auctionQuantityTotalRaw[0],
        };
        const auctionAmount = {
          untilYesterday: auctionQuantityYesterDayRaw[1],
          today: auctionQuantityTodayRaw[1],
          total: auctionQuantityTotalRaw[1],
        };

        const grade1Raw = cells[5].split("\n");

        const grade1 = {
          quantity: grade1Raw[0],
          unitPrice: grade1Raw[1],
        };

        const grade2Raw = cells[6].split("\n");
        const grade2 = {
          quantity: grade2Raw[0],
          unitPrice: grade2Raw[1],
        };

        const grade3StoppedRaw = cells[7].split("\n");
        const grade3Stopped = {
          quantity: grade3StoppedRaw[0],
          unitPrice: grade3StoppedRaw[1],
        };

        const grade3EstimatedRaw = cells[8].split("\n");
        const grade3Estimated = {
          quantity: grade3EstimatedRaw[0],
          unitPrice: grade3EstimatedRaw[1],
        };

        const gradeBelowRaw = cells[9].split("\n");
        const gradeBelow = {
          quantity: gradeBelowRaw[0],
          unitPrice: gradeBelowRaw[1],
        };

        const mixedGradeRaw = cells[10].split("\n");
        const mixedGrade = {
          quantity: mixedGradeRaw[0],
          unitPrice: mixedGradeRaw[1],
        };

        const lastUpdated = cells[11];

        const auctionData = {
          region,
          union,
          date: `${year}-${month}-${day}`,
          lastUpdated,
          auctionQuantity,
          auctionAmount,
          grade1,
          grade2,
          grade3Stopped,
          grade3Estimated,
          gradeBelow,
          mixedGrade,
        };

        dayData.push(auctionData);
      }

      // 스마트 데이터 변경 감지
      if (dayData.length > 0) {
        const changeAnalysis = analyzeDataChanges(existingData, dayData);

        if (!changeAnalysis.hasChanges) {
          console.log(`⏭️  ${changeAnalysis.summary}: ${year}-${month}-${day}`);
          skippedCount++;
          continue;
        }

        // 파일 저장
        fs.writeFileSync(filename, JSON.stringify(dayData, null, 2));

        if (existingData.length > 0) {
          console.log(`🔄 ${changeAnalysis.summary}: ${filename}`);
          updatedCount++;
        } else {
          console.log(`✅ 신규 저장: ${filename} (${dayData.length}개 레코드)`);
          newCount++;
        }
      } else {
        console.log(`❌ 데이터 없음: ${year}-${month}-${day}`);
      }
    } catch (error) {
      console.error(`🚨 오류 발생 ${year}-${month}-${day}:`, error);
    }
  }

  // 처리 결과 요약
  console.log(`\n🎯 처리 완료:`);
  console.log(`   - 신규 파일: ${newCount}개`);
  console.log(`   - 업데이트: ${updatedCount}개`);
  console.log(`   - 변경사항 없음: ${skippedCount}개`);
  console.log(`   - 전체 대상: ${targetDates.length}개`);
});
