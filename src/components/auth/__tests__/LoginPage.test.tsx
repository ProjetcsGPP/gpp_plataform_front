import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { login } = vi.hoisted(() => ({ login: vi.fn() }));

vi.mock("@/lib/auth", () => ({ login }));

import { LoginPage, type LoginTheme } from "@/components/auth/LoginPage";

const theme: LoginTheme = {
  appName: "Portal GPP",
  subtitle: "SEGER",
  logoSymbol: "GPP",
  logoProdestSymbol: "",
  defaultAppContext: "PORTAL",
  redirectMap: { PORTAL: "/portal/dashboard" },
};

async function submitLogin() {
  fireEvent.change(screen.getByLabelText("Usuário ou E-mail"), {
    target: { value: "identificador" },
  });
  fireEvent.change(screen.getByLabelText("Senha"), {
    target: { value: "segredo" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Entrar" }));
}

describe("LoginPage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("envia o identificador opaco ao login", async () => {
    login.mockImplementation(() => new Promise(() => undefined));
    render(<LoginPage theme={theme} />);

    await submitLogin();

    expect(login).toHaveBeenCalledWith("identificador", "segredo", "PORTAL");
  });

  it.each([
    [400, "requisição inválida"],
    [401, "identificador inexistente"],
    [401, "senha inválida"],
    [403, "usuário inativo"],
  ])("não enumera credenciais para status %s (%s)", async (status) => {
    login.mockRejectedValue({
      response: { status, data: { detail: "mensagem sensível do backend" } },
    });
    render(<LoginPage theme={theme} />);

    await submitLogin();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível entrar com as credenciais informadas.",
    );
    expect(screen.queryByText("mensagem sensível do backend")).not.toBeInTheDocument();
  });

  it.each([
    [429, "Muitas tentativas"],
    [500, "Serviço de autenticação indisponível"],
    [503, "Serviço de autenticação indisponível"],
  ])("trata status operacional %s", async (status, expected) => {
    login.mockRejectedValue({ response: { status, data: {} } });
    render(<LoginPage theme={theme} />);

    await submitLogin();

    expect(await screen.findByRole("alert")).toHaveTextContent(expected);
  });

  it("trata indisponibilidade sem resposta HTTP", async () => {
    login.mockRejectedValue(new Error("network error"));
    render(<LoginPage theme={theme} />);

    await submitLogin();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível conectar ao serviço de autenticação.",
    );
  });

  it("exibe a mensagem de sessão expirada sem expor a causa interna", () => {
    render(
      <LoginPage
        theme={theme}
        sessionExpiredMessage="Sua sessão expirou. Faça login novamente."
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "Sua sessão expirou. Faça login novamente.",
    );
  });

  it("reativa o botão após uma falha", async () => {
    login.mockRejectedValue({ response: { status: 401, data: {} } });
    render(<LoginPage theme={theme} />);
    await submitLogin();
    await waitFor(() => expect(screen.getByRole("button", { name: "Entrar" })).toBeEnabled());
  });
});
