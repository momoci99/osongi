import "./App.css";
import { useEffect, useMemo } from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { createAppTheme } from "./theme";
import Dashboard from "./pages/Dashboard";
import { Routes, Route } from "react-router";
import DataAnalysis from "./pages/DataAnalysis";
import GlobalNavbar from "./components/GlobalNavbar";
import DataInitializer from "./components/DataInitializer";
import RegionOnboarding from "./components/RegionOnboarding";
import { useSettingsStore } from "./stores/useSettingsStore";

function App() {
  const themeMode = useSettingsStore((s) => s.themeMode);
  const displayMode = useSettingsStore((s) => s.displayMode);
  const currentTheme = useMemo(() => createAppTheme(themeMode), [themeMode]);

  // 디스플레이 모드를 html 속성에 반영
  useEffect(() => {
    document.documentElement.setAttribute("data-display", displayMode);
  }, [displayMode]);

  return (
    <ThemeProvider theme={currentTheme}>
      <CssBaseline />
      <DataInitializer>
        <GlobalNavbar />
        <RegionOnboarding />
        <Routes>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="data-analysis" element={<DataAnalysis />} />
        </Routes>
      </DataInitializer>
    </ThemeProvider>
  );
}

export default App;
