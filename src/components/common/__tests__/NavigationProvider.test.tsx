import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { NavigationProvider } from "../NavigationProvider";

const useNavigationMock = vi.fn();
const useAuthStoreMock = vi.fn();

vi.mock("@/hooks/useNavigation", () => ({
  useNavigation: () => useNavigationMock(), // sem parâmetro
}));

vi.mock("@/store/authStore", () => ({
  useAuthStore: (selector: (state: { isAuthenticated: boolean }) => boolean) =>
    useAuthStoreMock(selector),
}));

describe("NavigationProvider", () => {
  beforeEach(() => {
    useNavigationMock.mockClear();
    useAuthStoreMock.mockReset();
  });

  it("não deve chamar useNavigation quando isAuthenticated for false", () => {
    useAuthStoreMock.mockImplementation((selector) =>
      selector({ isAuthenticated: false }),
    );

    render(
      <NavigationProvider>
        <div>conteúdo</div>
      </NavigationProvider>,
    );

    expect(useNavigationMock).not.toHaveBeenCalled();
    expect(screen.getByText("conteúdo")).toBeInTheDocument();
  });

  it("deve chamar useNavigation quando isAuthenticated for true", () => {
    useAuthStoreMock.mockImplementation((selector) =>
      selector({ isAuthenticated: true }),
    );

    render(
      <NavigationProvider>
        <div>conteúdo</div>
      </NavigationProvider>,
    );

    expect(useNavigationMock).toHaveBeenCalledTimes(1);
    // sem asserção de parâmetro — hook não recebe appContext
    expect(screen.getByText("conteúdo")).toBeInTheDocument();
  });
});
