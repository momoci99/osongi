import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PaletteMode } from "@mui/material/styles";
import type { AVAILABLE_REGIONS } from "../const/Common";

type RegionType = (typeof AVAILABLE_REGIONS)[number];
type DisplayMode = "default" | "large";

interface SettingsState {
  // 테마
  themeMode: PaletteMode;
  setThemeMode: (mode: PaletteMode) => void;
  toggleThemeMode: () => void;

  // 내 지역 설정
  myRegion: RegionType | null;
  myUnion: string | null;
  setMyRegion: (region: RegionType) => void;
  setMyUnion: (union: string | null) => void;
  hasCompletedOnboarding: boolean;
  completeOnboarding: () => void;

  // 디스플레이 모드 (기본 / 큰글씨)
  displayMode: DisplayMode;
  toggleDisplayMode: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // 테마
      themeMode: "dark",
      setThemeMode: (mode) => set({ themeMode: mode }),
      toggleThemeMode: () =>
        set((state) => ({
          themeMode: state.themeMode === "light" ? "dark" : "light",
        })),

      // 내 지역
      myRegion: null,
      myUnion: null,
      setMyRegion: (region) => set({ myRegion: region, myUnion: null }),
      setMyUnion: (union) => set({ myUnion: union }),
      hasCompletedOnboarding: false,
      completeOnboarding: () => set({ hasCompletedOnboarding: true }),

      // 디스플레이 모드
      displayMode: "default",
      toggleDisplayMode: () =>
        set((state) => ({
          displayMode:
            state.displayMode === "default" ? "large" : "default",
        })),
    }),
    {
      name: "osongi-settings",
    }
  )
);
