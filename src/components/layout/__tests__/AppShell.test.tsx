import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import AppShell from "@/components/layout/AppShell";

const useNavigationMock = vi.hoisted(() => vi.fn());

vi.mock("@/hooks/useNavigation", () => ({
  useNavigation: useNavigationMock,
}));
vi.mock("@/store/authStore", () => ({
  useAuthStore: (selector: (state: { isAuthenticated: boolean }) => unknown) =>
    selector({ isAuthenticated: true }),
}));
vi.mock("@/components/common/AppThemeProvider", () => ({
  AppThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("@/components/common/AuthHydrator", () => ({
  AuthHydrator: () => <div data-testid="auth-hydrator" />,
}));
vi.mock("@/components/common/LoadingGuard", () => ({
  LoadingGuard: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("@/components/layout/Sidebar", () => ({
  default: () => <aside>Sidebar</aside>,
}));
vi.mock("@/components/layout/TopBar", () => ({
  default: () => <header>TopBar</header>,
}));

describe("AppShell", () => {
  it("integra NavigationProvider com Sidebar e TopBar", () => {
    render(
      <AppShell appContext="PORTAL" title="Portal" titleMinor="GPP">
        <main>Conteúdo</main>
      </AppShell>,
    );

    expect(useNavigationMock).toHaveBeenCalledOnce();
    expect(screen.getByText("Sidebar")).toBeInTheDocument();
    expect(screen.getByText("TopBar")).toBeInTheDocument();
    expect(screen.getByText("Conteúdo")).toBeInTheDocument();
  });
});
