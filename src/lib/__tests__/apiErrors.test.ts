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
});
