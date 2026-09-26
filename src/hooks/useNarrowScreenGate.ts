import { useState } from "react";
import { useMediaQuery } from "@mui/material";

/** sessionStorage 읽기 — 사생활 보호 모드 등에서 접근이 막혀도 페이지는 동작해야 한다 */
const readBypass = (key: string): boolean => {
  try {
    return sessionStorage.getItem(key) === "1";
  } catch {
    return false;
  }
};

/** sessionStorage 쓰기 — 실패해도 이번 화면에서는 열린다 */
const writeBypass = (key: string) => {
  try {
    sessionStorage.setItem(key, "1");
  } catch {
    /** 저장 불가 — 새로고침하면 다시 안내가 뜰 뿐이다 */
  }
};

/**
 * 좁은 화면 안내 게이트.
 * 최소 폭 미만이고 이번 세션에 "그래도 보기"를 누르지 않았으면 안내를 띄운다.
 */
const useNarrowScreenGate = (minWidth: number, bypassKey: string) => {
  const wide = useMediaQuery(`(min-width:${minWidth}px)`, { noSsr: true });
  const [bypassed, setBypassed] = useState(() => readBypass(bypassKey));

  const proceed = () => {
    writeBypass(bypassKey);
    setBypassed(true);
  };

  return { showNotice: !wide && !bypassed, proceed };
};

export default useNarrowScreenGate;
