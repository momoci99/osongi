import { test, expect } from "@playwright/test";
import fs from "fs";

//송이는 9월부터 11월까지만 데이터가 있음
const MIN_MONTH = 9;
const MAX_MONTH = 11;

test("송이 공판현황 데이터 파싱", async ({ page }) => {
  // const startDate = "2013-09-13";
  // const endDate = "2013-10-25";

  // GitHub Actions에서는 최근 7일만 확인 (환경변수로 제어)
  const daysToCheck = process.env.DAYS_TO_CHECK
    ? parseInt(process.env.DAYS_TO_CHECK)
    : 7;
  const endDate = new Date().toISOString().split("T")[0]; //오늘 날짜
  const startDateObj = new Date();
  startDateObj.setDate(startDateObj.getDate() - daysToCheck);
  const startDate = startDateObj.toISOString().split("T")[0];

  //년 단위 loop
  for (
    let date = new Date(startDate);
    date <= new Date(endDate);
    date.setMonth(date.getMonth() + 1)
  ) {
    //월 단위 loop
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    console.log(year, month);
    if (month < MIN_MONTH || month > MAX_MONTH) continue;

    // 디렉터리 생성 (연도/월)
    const dirPath = `public/auction-data/${year}/${month}`;
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    //일 단위 loop
    for (let day = 1; day <= 31; day++) {
      const queryDate = `${year}${month < 10 ? "0" + month : month}${
        day < 10 ? "0" + day : day
      }`;

      const dayData: any[] = [];

      await page.goto(
        `https://iforest.nfcf.or.kr/forest/user.tdf?a=user.songi.SongiApp&c=1002&mc=%24mc&pmsh_item_c=01&sply_date=${queryDate}&x=21&y=8`
      );
      // tbody 내의 모든 tr 요소 가져오기
      const rows = await page.locator("table tbody tr").all();

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

      // 하루 단위로 JSON 파일 저장
      if (dayData.length > 0) {
        const filename = `${dirPath}/${day}.json`;

        // 이미 파일이 존재하면 건너뛰기
        if (fs.existsSync(filename)) {
          console.log(filename, "Already exists, skipping...");
          continue;
        }

        fs.writeFileSync(filename, JSON.stringify(dayData, null, 2));
        console.log(filename, "Saved!");
      }
    }
  }
});
