import type { TableRowData } from "./tableUtils";

/** 테이블 데이터를 CSV 파일로 다운로드한다 (UTF-8 BOM, Excel 호환) */
export const exportToCsv = (data: TableRowData[], filename: string): void => {
  const headers = ["날짜", "지역", "조합", "등급", "수량(kg)", "단가(원/kg)"];
  const rows = data.map((row) => [
    row.date,
    row.region,
    row.union,
    row.gradeName,
    String(row.quantity),
    String(row.unitPrice),
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\r\n");

  const bom = "\uFEFF";
  const blob = new Blob([bom + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
