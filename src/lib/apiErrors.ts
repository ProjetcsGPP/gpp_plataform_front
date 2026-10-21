import axios from "axios";

type ErrorPayload = unknown;

function looksLikeHtml(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return normalized.startsWith("<!doctype html") || normalized.startsWith("<html");
}

function firstMessage(payload: unknown): string | null {
  if (!payload) return null;
  if (typeof payload === "string") return looksLikeHtml(payload) ? null : payload;
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
  const message = firstMessage(record.message);
  if (message) return message;
  const errors = firstMessage(record.errors);
  if (errors) return errors;

  for (const value of Object.values(record)) {
    const message = firstMessage(value);
    if (message) return message;
  }
  return null;
}

function messagesFrom(payload: unknown): string[] {
  if (typeof payload === "string") {
    return looksLikeHtml(payload) ? [] : [payload];
  }
  if (!Array.isArray(payload)) return [];
  return payload.flatMap(messagesFrom);
}

export function getApiFieldErrors(error: unknown): Record<string, string[]> {
  if (!axios.isAxiosError<ErrorPayload>(error)) return {};
  const payload = error.response?.data;
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return {};
  }

  const record = payload as Record<string, unknown>;
  const source = record.errors;
  if (!source || typeof source !== "object" || Array.isArray(source)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(source)
      .map(([field, value]) => [field, messagesFrom(value)] as const)
      .filter(([, messages]) => messages.length > 0),
  );
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
