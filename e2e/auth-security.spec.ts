import { expect, test, type Page, type Request } from "@playwright/test";

interface CapturedRequest {
  method: string;
  pathname: string;
  headers: Record<string, string>;
  body: unknown;
}

interface AuthMockOptions {
  loginStatus?: number;
  loginBody?: Record<string, unknown>;
  csrfStatus?: number;
  sessionFailure?: string;
}

const csrfCookie = "csrftoken=csrf-bootstrap; Path=/; SameSite=Lax";
const sessionCookie =
  "gpp_session_PORTAL=session-e2e; Path=/; HttpOnly; SameSite=Lax";
const testBaseURL =
  process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3001";

function capture(request: Request): CapturedRequest {
  let body: unknown = null;
  if (request.postData()) {
    try {
      body = request.postDataJSON();
    } catch {
      body = request.postData();
    }
  }

  return {
    method: request.method(),
    pathname: new URL(request.url()).pathname,
    headers: request.headers(),
    body,
  };
}

async function installAuthApiMock(
  page: Page,
  requests: CapturedRequest[],
  options: AuthMockOptions = {},
) {
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const entry = capture(request);
    const { pathname } = entry;
    requests.push(entry);

    if (pathname === "/api/accounts/auth/csrf/") {
      const status = options.csrfStatus ?? 200;
      await route.fulfill({
        status,
        contentType: "application/json",
        headers: status === 200 ? { "set-cookie": csrfCookie } : undefined,
        body: JSON.stringify(
          status === 200
            ? { detail: "CSRF cookie initialized" }
            : { detail: "service unavailable" },
        ),
      });
      return;
    }

    if (pathname === "/api/accounts/login/") {
      const status = options.loginStatus ?? 200;
      await route.fulfill({
        status,
        contentType: "application/json",
        headers: status === 200 ? { "set-cookie": sessionCookie } : undefined,
        body: JSON.stringify(
          options.loginBody ??
            (status === 200
              ? { detail: "ok" }
              : { detail: "mensagem sensível que não pode chegar à interface" }),
        ),
      });
      return;
    }

    if (pathname === "/api/accounts/logout/portal/") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: {
          "set-cookie":
            "gpp_session_PORTAL=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0",
        },
        body: JSON.stringify({ detail: "ok" }),
      });
      return;
    }

    if (pathname === "/api/accounts/me/") {
      if (options.sessionFailure) {
        await route.fulfill({
          status: 401,
          contentType: "application/json",
          body: JSON.stringify({ code: options.sessionFailure }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: 100,
          username: "usuario.e2e",
          email: "usuario.e2e@example.invalid",
          first_name: "Usuário",
          last_name: "E2E",
          name: "Usuário E2E",
          is_portal_admin: true,
          orgao: "TESTE",
          status_usuario_id: 1,
          app_context: "PORTAL",
          apps: ["PORTAL"],
          roles: [],
          authz_version: 1,
        }),
      });
      return;
    }

    if (pathname === "/api/accounts/me/permissions/") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ role: "TEST_ONLY", granted: ["view_user"] }),
      });
      return;
    }

    if (pathname === "/api/accounts/menus/") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ app_context: "PORTAL", items: [] }),
      });
      return;
    }

    if (pathname === "/api/accounts/authz/version/") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ authz_version: 1, user_version: 1 }),
      });
      return;
    }

    if (pathname === "/api/portal/dashboard/") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ aplicacoes: [], roles: [] }),
      });
      return;
    }

    await route.fulfill({
      status: 501,
      contentType: "application/json",
      body: JSON.stringify({ detail: `Unexpected E2E request: ${pathname}` }),
    });
  });
}

async function submitLogin(page: Page, identifier = "identificador.e2e") {
  await page.getByLabel("Usuário ou E-mail").fill(identifier);
  await page.getByLabel("Senha").fill("senha-sintetica");
  await page.getByRole("button", { name: "Entrar" }).click();
}

async function addPortalSession(page: Page) {
  await page.context().addCookies([
    {
      name: "gpp_session_PORTAL",
      value: "session-e2e",
      url: testBaseURL,
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
}

test.describe("PUB-008 — autenticação no navegador", () => {
  test("faz bootstrap CSRF antes do login e envia somente identifier", async ({
    page,
  }) => {
    const requests: CapturedRequest[] = [];
    await installAuthApiMock(page, requests);
    await page.goto("/portal/login");

    await submitLogin(page, "usuario@example.invalid");
    await expect(page).toHaveURL(/\/portal\/dashboard$/);

    const authRequests = requests.filter((request) =>
      request.pathname.startsWith("/api/accounts/"),
    );
    expect(authRequests[0]).toMatchObject({
      method: "GET",
      pathname: "/api/accounts/auth/csrf/",
    });
    expect(authRequests[1]).toMatchObject({
      method: "POST",
      pathname: "/api/accounts/login/",
      body: {
        identifier: "usuario@example.invalid",
        password: "senha-sintetica",
        app_context: "PORTAL",
      },
    });
    expect(authRequests[1].body).not.toHaveProperty("username");
    expect(authRequests[1].headers["x-csrftoken"]).toBe("csrf-bootstrap");

    const cookies = await page.context().cookies();
    expect(cookies).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "gpp_session_PORTAL",
          httpOnly: true,
          sameSite: "Lax",
        }),
      ]),
    );
  });

  for (const scenario of [
    { name: "identificador inexistente", status: 401 },
    { name: "senha inválida", status: 401 },
    { name: "usuário inativo", status: 401 },
    { name: "aplicação recusada", status: 403 },
  ]) {
    test(`não enumera ${scenario.name}`, async ({ page }) => {
      const requests: CapturedRequest[] = [];
      await installAuthApiMock(page, requests, { loginStatus: scenario.status });
      await page.goto("/portal/login");

      await submitLogin(page);

      await expect(page.locator('form [role="alert"]')).toHaveText(
        "Não foi possível entrar com as credenciais informadas.",
      );
      await expect(
        page.getByText("mensagem sensível que não pode chegar à interface"),
      ).toHaveCount(0);
    });
  }

  test("trata throttling sem enumerar a conta", async ({ page }) => {
    await installAuthApiMock(page, [], { loginStatus: 429 });
    await page.goto("/portal/login");
    await submitLogin(page);
    await expect(page.locator('form [role="alert"]')).toContainText(
      "Muitas tentativas",
    );
  });

  test("trata indisponibilidade no bootstrap e não envia o login", async ({
    page,
  }) => {
    const requests: CapturedRequest[] = [];
    await installAuthApiMock(page, requests, { csrfStatus: 503 });
    await page.goto("/portal/login");
    await submitLogin(page);

    await expect(page.locator('form [role="alert"]')).toContainText(
      "Serviço de autenticação indisponível",
    );
    expect(
      requests.some((request) => request.pathname === "/api/accounts/login/"),
    ).toBe(false);
  });

  test("rejeita open redirect e usa o destino seguro da aplicação", async ({
    page,
  }) => {
    await installAuthApiMock(page, []);
    await page.goto(
      "/portal/login?redirect=https%3A%2F%2Fevil.example%2Fcaptura",
    );
    await submitLogin(page);
    await expect(page).toHaveURL(/\/portal\/dashboard$/);
    expect(new URL(page.url()).origin).toBe(new URL(testBaseURL).origin);
  });

  for (const reason of [
    "session_expired",
    "session_revoked",
    "inactive_user",
    "app_context_mismatch",
  ]) {
    test(`redireciona sessão inválida: ${reason}`, async ({ page }) => {
      await addPortalSession(page);
      await installAuthApiMock(page, [], { sessionFailure: reason });
      await page.goto("/portal/dashboard");

      await expect(page).toHaveURL(/\/portal\/login\?reason=session_expired/);
      await expect(page.getByRole("status")).toHaveText(
        "Sua sessão expirou. Faça login novamente.",
      );
    });
  }

  test("faz logout seletivo com bootstrap CSRF", async ({ page }) => {
    const requests: CapturedRequest[] = [];
    await addPortalSession(page);
    await installAuthApiMock(page, requests);
    await page.goto("/portal/dashboard");
    await expect(page.getByText("Suas Aplicações")).toBeVisible();

    await page.getByRole("button", { name: "Sair", exact: true }).click();
    await expect(page).toHaveURL(/\/portal\/login$/);

    const csrfIndex = requests.findIndex(
      (request) => request.pathname === "/api/accounts/auth/csrf/",
    );
    const logoutIndex = requests.findIndex(
      (request) => request.pathname === "/api/accounts/logout/portal/",
    );
    expect(csrfIndex).toBeGreaterThanOrEqual(0);
    expect(logoutIndex).toBeGreaterThan(csrfIndex);
    expect(requests[logoutIndex].headers["x-csrftoken"]).toBe("csrf-bootstrap");
  });
});
