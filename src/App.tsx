// import "./reset.css";
import "./App.css";
import { useState } from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { createAppTheme } from "./theme";
import { Typography, AppBar, Toolbar } from "@mui/material";
import ThemeToggleButton from "./components/ThemeToggleButton";
import Dashboard from "./pages/Dashboard";
import { Routes, Route } from "react-router";
import DataAnalysis from "./pages/DataAnalysis";
import RawData from "./pages/RawData";
import Help from "./pages/Help";
import type { PaletteMode } from "@mui/material/styles";
import GlobalNavbar from "./components/GlobalNavbar";

function App() {
  const [mode, setMode] = useState<PaletteMode>(() => {
    const savedMode = localStorage.getItem("theme-mode");
    return (savedMode as PaletteMode) || "light";
  });

  const toggleTheme = () => {
    const newMode = mode === "light" ? "dark" : "light";
    setMode(newMode);
    localStorage.setItem("theme-mode", newMode);
  };

  const currentTheme = createAppTheme(mode);

  return (
    <ThemeProvider theme={currentTheme}>
      <CssBaseline />
      <GlobalNavbar mode={mode} toggleTheme={toggleTheme} />

      <Routes>
        <Route index element={<Dashboard />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="data-analysis" element={<DataAnalysis />} />
        <Route path="raw-data" element={<RawData />} />
        <Route path="help" element={<Help />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;
