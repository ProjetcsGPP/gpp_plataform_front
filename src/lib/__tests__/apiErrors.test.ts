import axios, { AxiosHeaders } from "axios";
import { describe, expect, it } from "vitest";

import { getApiErrorMessage, getApiFieldErrors } from "@/lib/apiErrors";

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

  it("prioriza a mensagem segura em vez do código técnico", () => {
    const error = new axios.AxiosError(
      "Bad Gateway",
      "ERR_BAD_RESPONSE",
      undefined,
      undefined,
      {
        status: 502,
        statusText: "Bad Gateway",
        headers: new AxiosHeaders(),
        config: { headers: new AxiosHeaders() },
        data: {
          success: false,
          errors: {
            code: "envio_organograma_upstream",
            message: "A PRODEST recusou a solicitação.",
            prodest: { status: 401, traceId: "interno" },
          },
        },
      },
    );

    expect(getApiErrorMessage(error)).toBe(
      "A PRODEST recusou a solicitação.",
    );
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

  it("extrai mensagens por campo sem misturar detalhes técnicos", () => {
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
          success: false,
          errors: {
            strsigla: ["A sigla deve ser única.", "Revise o órgão."],
            code: "conflito_sigla",
            prodest: { authorization: "segredo" },
          },
        },
      },
    );

    expect(getApiFieldErrors(error)).toEqual({
      strsigla: ["A sigla deve ser única.", "Revise o órgão."],
      code: ["conflito_sigla"],
    });
  });
});
