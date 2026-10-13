import axios from "axios";

type ErrorPayload = unknown;

function firstMessage(payload: unknown): string | null {
  if (!payload) return null;
  if (typeof payload === "string") return payload;
  if (Array.isArray(payload)) {
    for (const value of payload) {
      const message = firstMessage(value);
      if (message) return message;
    }
    return null;
  }
  if (typeof payload !== "object") return null;

  const record = payload as Record<string, unknown>;
  const detail = firstMessage(record.detail);
  if (detail) return detail;
  const errors = firstMessage(record.errors);
  if (errors) return errors;

  for (const value of Object.values(record)) {
    const message = firstMessage(value);
    if (message) return message;
  }
  return null;
}

export function getApiErrorMessage(
  error: unknown,
  fallback = "Não foi possível concluir a operação.",
): string {
  if (!axios.isAxiosError<ErrorPayload>(error)) return fallback;
  if (error.response?.status === 403) {
    return "Você não possui permissão para realizar esta operação.";
  }
  return firstMessage(error.response?.data) ?? fallback;
}
