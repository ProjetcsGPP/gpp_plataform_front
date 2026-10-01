// src/lib/debug.ts
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG === "true";

export function debugLog(scope: string, message: string, data?: unknown): void {
  if (!DEBUG_ENABLED) return;

  if (data === undefined) {
    console.log(`[${scope}] ${message}`);
  } else {
    console.log(`[${scope}] ${message}`, data);
  }
}

export function debugError(
  scope: string,
  message: string,
  data?: unknown,
): void {
  if (!DEBUG_ENABLED) return;

  console.error(`[${scope}] ${message}`, data);
}
