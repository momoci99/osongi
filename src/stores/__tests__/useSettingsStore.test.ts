import { describe, it, expect, beforeEach } from "vitest";
import { useSettingsStore } from "../useSettingsStore";

describe("useSettingsStore", () => {
  beforeEach(() => {
    // 매 테스트 전 초기 상태로 리셋
    useSettingsStore.setState({
      themeMode: "dark",
      myRegion: null,
      myUnion: null,
      hasCompletedOnboarding: false,
      displayMode: "default",
    });
  });

  /** 초기 상태 */
  describe("초기 상태", () => {
    it("themeMode는 dark이다", () => {
      expect(useSettingsStore.getState().themeMode).toBe("dark");
    });

    it("myRegion은 null이다", () => {
      expect(useSettingsStore.getState().myRegion).toBeNull();
    });

    it("myUnion은 null이다", () => {
      expect(useSettingsStore.getState().myUnion).toBeNull();
    });

    it("hasCompletedOnboarding은 false이다", () => {
      expect(useSettingsStore.getState().hasCompletedOnboarding).toBe(false);
    });

    it("displayMode는 default이다", () => {
      expect(useSettingsStore.getState().displayMode).toBe("default");
    });
  });

  /** toggleThemeMode */
  describe("toggleThemeMode", () => {
    it("dark → light 토글", () => {
      useSettingsStore.getState().toggleThemeMode();
      expect(useSettingsStore.getState().themeMode).toBe("light");
    });

    it("light → dark 토글", () => {
      useSettingsStore.setState({ themeMode: "light" });
      useSettingsStore.getState().toggleThemeMode();
      expect(useSettingsStore.getState().themeMode).toBe("dark");
    });

    it("두 번 토글하면 원래 상태로 돌아온다", () => {
      useSettingsStore.getState().toggleThemeMode();
      useSettingsStore.getState().toggleThemeMode();
      expect(useSettingsStore.getState().themeMode).toBe("dark");
    });
  });

  /** setMyRegion */
  describe("setMyRegion", () => {
    it("지역을 설정한다", () => {
      useSettingsStore.getState().setMyRegion("강원");
      expect(useSettingsStore.getState().myRegion).toBe("강원");
    });

    it("지역 설정 시 myUnion을 null로 초기화한다", () => {
      useSettingsStore.setState({ myUnion: "양양군산림조합" });
      useSettingsStore.getState().setMyRegion("경북");
      expect(useSettingsStore.getState().myRegion).toBe("경북");
      expect(useSettingsStore.getState().myUnion).toBeNull();
    });
  });

  /** setMyUnion */
  describe("setMyUnion", () => {
    it("조합을 설정한다", () => {
      useSettingsStore.getState().setMyUnion("양양군산림조합");
      expect(useSettingsStore.getState().myUnion).toBe("양양군산림조합");
    });

    it("null로 초기화할 수 있다", () => {
      useSettingsStore.setState({ myUnion: "양양군산림조합" });
      useSettingsStore.getState().setMyUnion(null);
      expect(useSettingsStore.getState().myUnion).toBeNull();
    });
  });

  /** completeOnboarding */
  describe("completeOnboarding", () => {
    it("온보딩 완료 플래그를 true로 설정한다", () => {
      useSettingsStore.getState().completeOnboarding();
      expect(useSettingsStore.getState().hasCompletedOnboarding).toBe(true);
    });
  });

  /** toggleDisplayMode */
  describe("toggleDisplayMode", () => {
    it("default → large 토글", () => {
      useSettingsStore.getState().toggleDisplayMode();
      expect(useSettingsStore.getState().displayMode).toBe("large");
    });

    it("large → default 토글", () => {
      useSettingsStore.setState({ displayMode: "large" });
      useSettingsStore.getState().toggleDisplayMode();
      expect(useSettingsStore.getState().displayMode).toBe("default");
    });
  });
});
