import axios, { AxiosHeaders } from "axios";
import { describe, expect, it } from "vitest";

import { getApiErrorMessage } from "@/lib/apiErrors";

describe("getApiErrorMessage", () => {
  it("extrai mensagens aninhadas do envelope errors do backend", () => {
    const error = new axios.AxiosError(
      "Bad request",
      "ERR_BAD_REQUEST",
      undefined,
      undefined,
      {
        status: 400,
        statusText: "Bad Request",
        headers: new AxiosHeaders(),
        config: { headers: new AxiosHeaders() },
        data: {
          errors: {
            strdescricaosituacao: ["Esta descrição já existe."],
          },
        },
      },
    );

    expect(getApiErrorMessage(error)).toBe("Esta descrição já existe.");
  });

  it("não exibe uma página HTML de depuração no card de erro", () => {
    const error = new axios.AxiosError(
      "Internal Server Error",
      "ERR_BAD_RESPONSE",
      undefined,
      undefined,
      {
        status: 500,
        statusText: "Internal Server Error",
        headers: new AxiosHeaders({ "content-type": "text/html" }),
        config: { headers: new AxiosHeaders() },
        data: "<!DOCTYPE html><html><body>ProgrammingError</body></html>",
      },
    );

    expect(getApiErrorMessage(error, "Não foi possível carregar os arquivos."))
      .toBe("Não foi possível carregar os arquivos.");
  });
});
