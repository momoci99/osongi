import "./App.css";
import { useEffect, useMemo } from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { createAppTheme } from "./theme";
import Dashboard from "./pages/Dashboard";
import { Routes, Route, Navigate, Outlet } from "react-router";
import DataAnalysis from "./pages/DataAnalysis";
import RegionIndex from "./pages/RegionIndex";
import RegionDetail from "./pages/RegionDetail";
import GlobalNavbar from "./components/GlobalNavbar";
import DataInitializer from "./components/DataInitializer";
import RegionOnboarding from "./components/RegionOnboarding";
import ErrorBoundary from "./components/ErrorBoundary";
import AppFooter from "./components/common/AppFooter";
import { useSettingsStore } from "./stores/useSettingsStore";

/**
 * 전체 데이터셋(IndexedDB)이 준비돼야 하는 라우트 전용 레이아웃.
 *
 * 지역·조합 페이지는 검색 유입 랜딩이라 첫 화면이 로딩 게이트에 막히면
 * 이탈로 직결된다. 그래서 매니페스트만으로 렌더되는 라우트는 이 게이트 밖에 둔다.
 */
const DatasetGatedLayout = () => (
  <DataInitializer>
    <RegionOnboarding />
    <Outlet />
  </DataInitializer>
);

const App = () => {
  const themeMode = useSettingsStore((s) => s.themeMode);
  const displayMode = useSettingsStore((s) => s.displayMode);
  const currentTheme = useMemo(() => createAppTheme(themeMode), [themeMode]);

  /** 디스플레이 모드를 html data 속성에 반영 */
  useEffect(() => {
    document.documentElement.setAttribute("data-display", displayMode);
  }, [displayMode]);

  return (
    <ThemeProvider theme={currentTheme}>
      <CssBaseline />
      <ErrorBoundary>
        <GlobalNavbar />
        <Routes>
          <Route element={<DatasetGatedLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Navigate to="/" replace />} />
            <Route path="data-analysis" element={<DataAnalysis />} />
          </Route>
          <Route path="region" element={<RegionIndex />} />
          <Route path="region/:region" element={<RegionDetail />} />
          <Route path="region/:region/:union" element={<RegionDetail />} />
        </Routes>
        <AppFooter />
      </ErrorBoundary>
    </ThemeProvider>
  );
};

export default App;
